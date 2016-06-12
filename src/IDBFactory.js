import {createEvent, Event} from './Event.js';
import {findError, createDOMException, DOMException} from './DOMException.js';
import {IDBOpenDBRequest} from './IDBRequest.js';
import util from './util.js';
import Key from './Key.js';
import IDBTransaction from './IDBTransaction.js';
import IDBDatabase from './IDBDatabase.js';
import CFG from './cfg.js';

const DEFAULT_DB_SIZE = 4 * 1024 * 1024;
let sysdb;

/**
 * Craetes the sysDB to keep track of version numbers for databases
 **/
function createSysDB (success, failure) {
    function sysDbCreateError (tx, err) {
        err = findError(arguments);
        CFG.DEBUG && console.log('Error in sysdb transaction - when creating dbVersions', err);
        failure(err);
    }

    if (sysdb) {
        success();
    } else {
        sysdb = CFG.win.openDatabase('__sysdb__', 1, 'System Database', DEFAULT_DB_SIZE);
        sysdb.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);', [], success, sysDbCreateError);
        }, sysDbCreateError);
    }
}

/**
 * IDBFactory Class
 * https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
 * @constructor
 */
function IDBFactory () {
    this.modules = {DOMException, Event, IDBFactory};
}

/**
 * The IndexedDB Method to create a new database and return the DB
 * @param {string} name
 * @param {number} version
 */
IDBFactory.prototype.open = function (name, version) {
    const req = new IDBOpenDBRequest();
    let calledDbCreateError = false;

    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    } else if (arguments.length === 2) {
        version = parseFloat(version);
        if (isNaN(version) || !isFinite(version) || version <= 0) {
            throw new TypeError('Invalid database version: ' + version);
        }
    }
    name = name + ''; // cast to a string

    function dbCreateError (tx, err) {
        if (calledDbCreateError) {
            return;
        }
        err = findError(arguments);
        calledDbCreateError = true;
        const evt = createEvent('error', arguments);
        req.readyState = 'done';
        req.error = err || DOMException;
        util.callback('onerror', req, evt);
    }

    function openDB (oldVersion) {
        const db = CFG.win.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
        req.readyState = 'done';
        if (typeof version === 'undefined') {
            version = oldVersion || 1;
        }
        if (version <= 0 || oldVersion > version) {
            const err = createDOMException('VersionError', 'An attempt was made to open a database using a lower version than the existing version.', version);
            dbCreateError(err);
            return;
        }

        db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexList BLOB)', [], function () {
                tx.executeSql('SELECT * FROM __sys__', [], function (tx, data) {
                    const e = createEvent('success');
                    req.source = req.result = new IDBDatabase(db, name, version, data);
                    if (oldVersion < version) {
                        // DB Upgrade in progress
                        sysdb.transaction(function (systx) {
                            systx.executeSql('UPDATE dbVersions set version = ? where name = ?', [version, name], function () {
                                const e = createEvent('upgradeneeded');
                                e.oldVersion = oldVersion;
                                e.newVersion = version;
                                req.transaction = req.result.__versionTransaction = new IDBTransaction(req.source, [], 'versionchange');
                                req.transaction.__addToTransactionQueue(function onupgradeneeded (tx, args, success) {
                                    util.callback('onupgradeneeded', req, e);
                                    success();
                                });
                                req.transaction.__oncomplete = function () {
                                    req.transaction = null;
                                    const e = createEvent('success');
                                    util.callback('onsuccess', req, e);
                                };
                            }, dbCreateError);
                        }, dbCreateError);
                    } else {
                        util.callback('onsuccess', req, e);
                    }
                }, dbCreateError);
            }, dbCreateError);
        }, dbCreateError);
    }

    createSysDB(function () {
        sysdb.transaction(function (tx) {
            tx.executeSql('SELECT * FROM dbVersions where name = ?', [name], function (tx, data) {
                if (data.rows.length === 0) {
                    // Database with this name does not exist
                    tx.executeSql('INSERT INTO dbVersions VALUES (?,?)', [name, version || 1], function () {
                        openDB(0);
                    }, dbCreateError);
                } else {
                    openDB(data.rows.item(0).version);
                }
            }, dbCreateError);
        }, dbCreateError);
    }, dbCreateError);

    return req;
};

/**
 * Deletes a database
 * @param {string} name
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.deleteDatabase = function (name) {
    const req = new IDBOpenDBRequest();
    let calledDBError = false;
    let version = null;

    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    }
    name = name + ''; // cast to a string

    function dbError (tx, err) {
        if (calledDBError) {
            return;
        }
        err = findError(arguments);
        req.readyState = 'done';
        req.error = err || DOMException;
        const e = createEvent('error');
        e.debug = arguments;
        util.callback('onerror', req, e);
        calledDBError = true;
    }

    function deleteFromDbVersions () {
        sysdb.transaction(function (systx) {
            systx.executeSql('DELETE FROM dbVersions where name = ? ', [name], function () {
                req.result = undefined;
                const e = createEvent('success');
                e.newVersion = null;
                e.oldVersion = version;
                util.callback('onsuccess', req, e);
            }, dbError);
        }, dbError);
    }

    createSysDB(function () {
        sysdb.transaction(function (systx) {
            systx.executeSql('SELECT * FROM dbVersions where name = ?', [name], function (tx, data) {
                if (data.rows.length === 0) {
                    req.result = undefined;
                    const e = createEvent('success');
                    e.newVersion = null;
                    e.oldVersion = version;
                    util.callback('onsuccess', req, e);
                    return;
                }
                version = data.rows.item(0).version;
                const db = CFG.win.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
                db.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM __sys__', [], function (tx, data) {
                        const tables = data.rows;
                        (function deleteTables (i) {
                            if (i >= tables.length) {
                                // If all tables are deleted, delete the housekeeping tables
                                tx.executeSql('DROP TABLE IF EXISTS __sys__', [], function () {
                                    // Finally, delete the record for this DB from sysdb
                                    deleteFromDbVersions();
                                }, dbError);
                            } else {
                                // Delete all tables in this database, maintained in the sys table
                                tx.executeSql('DROP TABLE ' + util.quote(tables.item(i).name), [], function () {
                                    deleteTables(i + 1);
                                }, function () {
                                    deleteTables(i + 1);
                                });
                            }
                        }(0));
                    }, function (e) {
                        // __sysdb table does not exist, but that does not mean delete did not happen
                        deleteFromDbVersions();
                    });
                });
            }, dbError);
        }, dbError);
    }, dbError);

    return req;
};

/**
 * Compares two keys
 * @param key1
 * @param key2
 * @returns {number}
 */
IDBFactory.prototype.cmp = function (key1, key2) {
    if (arguments.length < 2) {
        throw new TypeError('You must provide two keys to be compared');
    }

    Key.validate(key1);
    Key.validate(key2);
    const encodedKey1 = Key.encode(key1);
    const encodedKey2 = Key.encode(key2);
    const result = encodedKey1 > encodedKey2 ? 1 : encodedKey1 === encodedKey2 ? 0 : -1;

    if (CFG.DEBUG) {
        // verify that the keys encoded correctly
        let decodedKey1 = Key.decode(encodedKey1);
        let decodedKey2 = Key.decode(encodedKey2);
        if (typeof key1 === 'object') {
            key1 = JSON.stringify(key1);
            decodedKey1 = JSON.stringify(decodedKey1);
        }
        if (typeof key2 === 'object') {
            key2 = JSON.stringify(key2);
            decodedKey2 = JSON.stringify(decodedKey2);
        }

        // encoding/decoding mismatches are usually due to a loss of floating-point precision
        if (decodedKey1 !== key1) {
            console.warn(key1 + ' was incorrectly encoded as ' + decodedKey1);
        }
        if (decodedKey2 !== key2) {
            console.warn(key2 + ' was incorrectly encoded as ' + decodedKey2);
        }
    }

    return result;
};

const shimIndexedDB = new IDBFactory();
export {IDBFactory, shimIndexedDB};

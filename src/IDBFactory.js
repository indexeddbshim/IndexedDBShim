import {createEvent, ShimEvent, ProxyPolyfill, IDBVersionChangeEvent} from './Event.js';
import {findError, createDOMException, DOMException} from './DOMException.js';
import {IDBOpenDBRequest, IDBRequest} from './IDBRequest.js';
import * as util from './util.js';
import Key from './Key.js';
import IDBTransaction from './IDBTransaction.js';
import IDBDatabase from './IDBDatabase.js';
import CFG from './CFG.js';

let sysdb;

/**
 * Craetes the sysDB to keep track of version numbers for databases
 **/
function createSysDB (success, failure) {
    function sysDbCreateError (...args /* tx, err */) {
        const err = findError(args);
        CFG.DEBUG && console.log('Error in sysdb transaction - when creating dbVersions', err);
        failure(err);
    }

    if (sysdb) {
        success();
    } else {
        sysdb = CFG.win.openDatabase('__sysdb__.sqlite', 1, 'System Database', CFG.DEFAULT_DB_SIZE);
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
    this.modules = {DOMException, Event: typeof Event !== 'undefined' ? Event : ShimEvent, ShimEvent, ProxyPolyfill, IDBFactory};
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
    } else if (arguments.length >= 2) {
        version = Number(version);
        if (isNaN(version) || !isFinite(version) ||
            version >= 0x20000000000000 || // 2 ** 53
            version < 1) { // The spec only mentions version==0 as throwing, but W3C tests fail with these
            throw new TypeError('Invalid database version: ' + version);
        }
    }
    name = String(name); // cast to a string

    function dbCreateError (...args /* tx, err */) {
        if (calledDbCreateError) {
            return;
        }
        const err = findError(args);
        calledDbCreateError = true;
        const evt = createEvent('error', args);
        req.__readyState = 'done';
        req.__error = err || DOMException;
        req.dispatchEvent(evt);
    }

    function openDB (oldVersion) {
        const db = CFG.win.openDatabase(util.escapeDatabaseName(name), 1, name, CFG.DEFAULT_DB_SIZE);
        req.__readyState = 'done';
        if (version === undefined) {
            version = oldVersion || 1;
        }
        if (oldVersion > version) {
            const err = createDOMException('VersionError', 'An attempt was made to open a database using a lower version than the existing version.', version);
            dbCreateError(err);
            return;
        }

        db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexList BLOB, currNum INTEGER)', [], function () {
                tx.executeSql('SELECT * FROM __sys__', [], function (tx, data) {
                    req.__result = new IDBDatabase(db, name, version, data);
                    if (oldVersion < version) {
                        // DB Upgrade in progress
                        sysdb.transaction(function (systx) {
                            systx.executeSql('UPDATE dbVersions SET version = ? WHERE name = ?', [version, name], function () {
                                const e = new IDBVersionChangeEvent('upgradeneeded', {oldVersion, newVersion: version});
                                req.__transaction = req.result.__versionTransaction = new IDBTransaction(req.result, req.result.objectStoreNames, 'versionchange');
                                req.transaction.__addToTransactionQueue(function onupgradeneeded (tx, args, success) {
                                    req.dispatchEvent(e);
                                    success();
                                });
                                req.transaction.on__beforecomplete = function () {
                                    req.result.__versionTransaction = null;
                                };
                                req.transaction.on__complete = function () {
                                    if (req.__result.__closed) {
                                        return;
                                    }
                                    req.__transaction = null;
                                    const e = createEvent('success');
                                    req.dispatchEvent(e);
                                };
                            }, dbCreateError);
                        }, dbCreateError);
                    } else {
                        const e = createEvent('success');
                        req.dispatchEvent(e);
                    }
                }, dbCreateError);
            }, dbCreateError);
        }, dbCreateError);
    }

    createSysDB(function () {
        sysdb.transaction(function (tx) {
            tx.executeSql('SELECT * FROM dbVersions WHERE name = ?', [name], function (tx, data) {
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
    name = String(name); // cast to a string

    function dbError (...args /* tx, err */) {
        if (calledDBError) {
            return;
        }
        const err = findError(args);
        req.__readyState = 'done';
        req.__error = err || DOMException;
        const e = createEvent('error', args);
        req.dispatchEvent(e);
        calledDBError = true;
    }

    function deleteFromDbVersions () {
        sysdb.transaction(function (systx) {
            systx.executeSql('DELETE FROM dbVersions WHERE name = ? ', [name], function () {
                req.__result = undefined;
                const e = new IDBVersionChangeEvent('success', {oldVersion: version, newVersion: null});
                req.dispatchEvent(e);
            }, dbError);
        }, dbError);
    }

    createSysDB(function () {
        sysdb.transaction(function (systx) {
            systx.executeSql('SELECT * FROM dbVersions WHERE name = ?', [name], function (tx, data) {
                if (data.rows.length === 0) {
                    req.__result = undefined;
                    const e = new IDBVersionChangeEvent('success', {oldVersion: version, newVersion: null});
                    req.dispatchEvent(e);
                    return;
                }
                version = data.rows.item(0).version;
                const db = CFG.win.openDatabase(util.escapeDatabaseName(name), 1, name, CFG.DEFAULT_DB_SIZE);
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
                                tx.executeSql('DROP TABLE ' + util.escapeStore(tables.item(i).name), [], function () {
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
function cmp (key1, key2) {
    if (arguments.length < 2) {
        throw new TypeError('You must provide two keys to be compared');
    }

    Key.convertValueToKey(key1);
    Key.convertValueToKey(key2);
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
}

IDBFactory.prototype.cmp = cmp;

/**
* NON-STANDARD!! (Also may return outdated information)
* @link https://www.w3.org/Bugs/Public/show_bug.cgi?id=16137
* @link http://lists.w3.org/Archives/Public/public-webapps/2011JulSep/1537.html
*/
IDBFactory.prototype.webkitGetDatabaseNames = function () {
    let calledDbCreateError = false;
    function dbGetDatabaseNamesError (...args /* tx, err */) {
        if (calledDbCreateError) {
            return;
        }
        const err = findError(args);
        calledDbCreateError = true;
        const evt = createEvent('error', args);
        req.__readyState = 'done';
        req.__error = err || DOMException;
        req.dispatchEvent(evt);
    }
    const req = new IDBRequest();
    createSysDB(function () {
        sysdb.transaction(function (tx) {
            tx.executeSql('SELECT name FROM dbVersions', [], function (tx, data) {
                const dbNames = new util.StringList();
                for (let i = 0; i < data.rows.length; i++) {
                    dbNames.push(data.rows.item(i).name);
                }
            }, dbGetDatabaseNamesError);
        }, dbGetDatabaseNamesError);
    }, dbGetDatabaseNamesError);
    const e = createEvent('success');
    req.dispatchEvent(e);
    return req;
};

IDBFactory.prototype.toString = function () {
    return '[object IDBFactory]';
};

const shimIndexedDB = new IDBFactory();
export {IDBFactory, cmp, shimIndexedDB};

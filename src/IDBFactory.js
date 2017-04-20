/* globals location, Event */
import {createEvent, ShimEvent, ShimCustomEvent, ShimEventTarget} from './Event';
import IDBVersionChangeEvent from './IDBVersionChangeEvent';
import {logError, webSQLErrback, createDOMException, ShimDOMException} from './DOMException';
import {IDBOpenDBRequest, IDBRequest} from './IDBRequest';
import ShimDOMStringList from './DOMStringList';
import * as util from './util';
import * as Key from './Key';
import IDBTransaction from './IDBTransaction';
import IDBDatabase from './IDBDatabase';
import CFG from './CFG';
import SyncPromise from 'sync-promise';
import path from 'path';

const getOrigin = () => (typeof location !== 'object' || !location) ? 'null' : location.origin;
const hasNullOrigin = () => CFG.checkOrigin !== false && (getOrigin() === 'null');

// Todo: This really should be process and tab-independent so the
//  origin could vary; in the browser, this might be through a
//  `SharedWorker`
const connectionQueue = {
    [getOrigin()]: {}
};

function processNextInConnectionQueue (name, origin = getOrigin()) {
    const queueItems = connectionQueue[origin][name];
    if (!queueItems[0]) { // Nothing left to process
        return;
    }
    const {req, cb} = queueItems[0]; // Keep in queue to prevent continuation
    function removeFromQueue () {
        queueItems.shift();
        processNextInConnectionQueue(name, origin);
    }
    req.addEventListener('success', removeFromQueue);
    req.addEventListener('error', removeFromQueue);
    cb(req);
}

function addRequestToConnectionQueue (req, name, origin = getOrigin(), cb) {
    if (!connectionQueue[origin][name]) {
        connectionQueue[origin][name] = [];
    }
    connectionQueue[origin][name].push({req, cb});

    if (connectionQueue[origin][name].length === 1) { // If there are no items in the queue, we have to start it
        processNextInConnectionQueue(name, origin);
    }
}

function triggerAnyVersionChangeAndBlockedEvents (openConnections, req, oldVersion, newVersion) {
    // Todo: For Node (and in browser using service workers if available?) the
    //    connections ought to involve those in any process; should also
    //    auto-close if unloading
    const connectionIsClosed = (connection) => connection.__closed;
    const connectionsClosed = () => openConnections.every(connectionIsClosed);
    return openConnections.reduce(function (promises, entry) {
        if (connectionIsClosed(entry)) {
            return promises;
        }
        return promises.then(function () {
            if (connectionIsClosed(entry)) {
                // Prior onversionchange must have caused this connection to be closed
                return;
            }
            const e = new IDBVersionChangeEvent('versionchange', {oldVersion, newVersion});
            return new SyncPromise(function (resolve) {
                setTimeout(() => {
                    entry.dispatchEvent(e); // No need to catch errors
                    resolve();
                });
            });
        });
    }, SyncPromise.resolve()).then(function () {
        if (!connectionsClosed()) {
            return new SyncPromise(function (resolve) {
                const unblocking = {
                    check: function check () {
                        if (connectionsClosed()) {
                            resolve();
                        }
                    }
                };
                const e = new IDBVersionChangeEvent('blocked', {oldVersion, newVersion});
                setTimeout(() => {
                    req.dispatchEvent(e); // No need to catch errors
                    if (!connectionsClosed()) {
                        openConnections.forEach((connection) => {
                            if (!connectionIsClosed(connection)) {
                                connection.__unblocking = unblocking;
                            }
                        });
                    } else {
                        resolve();
                    }
                });
            });
        }
    });
}

const websqlDBCache = {};
let sysdb;
let nameCounter = 0;

function getLatestCachedWebSQLVersion (name) {
    return Object.keys(websqlDBCache[name]).map(Number).reduce(
        (prev, curr) => curr > prev ? curr : prev, 0
    );
}

function getLatestCachedWebSQLDB (name) {
    return websqlDBCache[name] && websqlDBCache[name][ // eslint-disable-line standard/computed-property-even-spacing
        getLatestCachedWebSQLVersion()
    ];
}

/**
 * Creates the sysDB to keep track of version numbers for databases
 **/
function createSysDB (__openDatabase, success, failure) {
    function sysDbCreateError (tx, err) {
        err = webSQLErrback(err);
        CFG.DEBUG && console.log('Error in sysdb transaction - when creating dbVersions', err);
        failure(err);
    }

    if (sysdb) {
        success();
    } else {
        sysdb = __openDatabase(
            typeof CFG.memoryDatabase === 'string'
                ? CFG.memoryDatabase
                : path.join(
                    (typeof CFG.sysDatabaseBasePath === 'string'
                        ? CFG.sysDatabaseBasePath
                        : (CFG.databaseBasePath || '')),
                    '__sysdb__' + (CFG.addSQLiteExtension !== false ? '.sqlite' : '')
                ),
            1,
            'System Database',
            CFG.DEFAULT_DB_SIZE
        );
        sysdb.transaction(function (systx) {
            systx.executeSql('CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);', [], success, sysDbCreateError);
        }, sysDbCreateError);
    }
}

/**
 * IDBFactory Class
 * https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
 * @constructor
 */
function IDBFactory () {
    throw new TypeError('Illegal constructor');
}
const IDBFactoryAlias = IDBFactory;
IDBFactory.__createInstance = function () {
    function IDBFactory () {
        this[Symbol.toStringTag] = 'IDBFactory';
        this.modules = { // Export other shims (especially for testing)
            Event: typeof Event !== 'undefined' ? Event : ShimEvent,
            Error, // For test comparisons
            ShimEvent,
            ShimCustomEvent,
            ShimEventTarget,
            ShimDOMException,
            ShimDOMStringList,
            IDBFactory: IDBFactoryAlias
        };
        this.utils = {createDOMException}; // Expose for ease in simulating such exceptions during testing
        this.__connections = {};
    }
    IDBFactory.prototype = IDBFactoryAlias.prototype;
    return new IDBFactory();
};

/**
 * The IndexedDB Method to create a new database and return the DB
 * @param {string} name
 * @param {number} version
 */
IDBFactory.prototype.open = function (name /* , version */) {
    const me = this;
    if (!(me instanceof IDBFactory)) {
        throw new TypeError('Illegal invocation');
    }
    let version = arguments[1];

    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    }
    if (version !== undefined) {
        version = util.enforceRange(version, 'unsigned long long');
        if (version === 0) {
            throw new TypeError('Version cannot be 0');
        }
    }
    if (hasNullOrigin()) {
        throw createDOMException('SecurityError', 'Cannot open an IndexedDB database from an opaque origin.');
    }

    const req = IDBOpenDBRequest.__createInstance();
    let calledDbCreateError = false;

    if (CFG.autoName && name === '') {
        name = 'autoNamedDatabase_' + nameCounter++;
    }
    name = String(name); // cast to a string
    const sqlSafeName = util.escapeSQLiteStatement(name);

    const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
    const useDatabaseCache = CFG.cacheDatabaseInstances !== false || useMemoryDatabase;

    let escapedDatabaseName;
    try {
        escapedDatabaseName = util.escapeDatabaseNameForSQLAndFiles(name);
    } catch (err) {
        throw err; // new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
    }

    function dbCreateError (tx, err) {
        if (calledDbCreateError) {
            return;
        }
        err = err ? webSQLErrback(err) : tx;
        calledDbCreateError = true;
        // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
        const evt = createEvent('error', err, {bubbles: true, cancelable: true});
        req.__readyState = 'done';
        req.__error = err;
        req.__result = undefined;
        req.dispatchEvent(evt);
    }

    function openDB (oldVersion) {
        let db;
        if ((useMemoryDatabase || useDatabaseCache) && name in websqlDBCache && websqlDBCache[name][version]) {
            db = websqlDBCache[name][version];
        } else {
            db = me.__openDatabase(
                useMemoryDatabase ? CFG.memoryDatabase : path.join(CFG.databaseBasePath || '', escapedDatabaseName),
                1,
                name,
                CFG.DEFAULT_DB_SIZE
            );
            if (useDatabaseCache) {
                websqlDBCache[name][version] = db;
            }
        }
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
                tx.executeSql('SELECT "name", "keyPath", "autoInc", "indexList" FROM __sys__', [], function (tx, data) {
                    const connection = IDBDatabase.__createInstance(db, name, oldVersion, version, data);
                    if (!me.__connections[name]) {
                        me.__connections[name] = [];
                    }
                    me.__connections[name].push(connection);
                    function addResult () {
                        req.__result = connection;
                    }

                    if (oldVersion < version) {
                        const openConnections = me.__connections[name].slice(0, -1);
                        triggerAnyVersionChangeAndBlockedEvents(openConnections, req, oldVersion, version).then(function () {
                            // DB Upgrade in progress
                            let sysdbFinishedCb = function (systx, err, cb) {
                                if (err) {
                                    try {
                                        systx.executeSql('ROLLBACK', [], cb, cb);
                                        return;
                                    } catch (er) { // Browser may fail with expired transaction above so
                                                    // no choice but to manually revert
                                        sysdb.transaction(function (systx) {
                                            function reportError () {
                                                throw new Error('Unable to roll back upgrade transaction!');
                                            }

                                            // Attempt to revert
                                            if (oldVersion === 0) {
                                                systx.executeSql('DELETE FROM dbVersions WHERE "name" = ?', [sqlSafeName], cb, reportError);
                                            } else {
                                                systx.executeSql('UPDATE dbVersions SET "version" = ? WHERE "name" = ?', [oldVersion, sqlSafeName], cb, reportError);
                                            }
                                        });
                                        return;
                                    }
                                }
                                cb(); // In browser, should auto-commit
                            };

                            sysdb.transaction(function (systx) {
                                function versionSet () {
                                    addResult(); // Todo: Per open database step order, this should really occur after the upgrade transaction finishes (replace `req.result` with `connection`)

                                    const e = new IDBVersionChangeEvent('upgradeneeded', {oldVersion, newVersion: version});
                                    req.__transaction = req.result.__versionTransaction = IDBTransaction.__createInstance(req.result, req.result.objectStoreNames, 'versionchange');
                                    req.transaction.__addNonRequestToTransactionQueue(function onupgradeneeded (tx, args, finished, error) {
                                        req.dispatchEvent(e);
                                        // req.__transaction.__active = req.result.__versionTransaction.__active = false;
                                        if (e.__legacyOutputDidListenersThrowError) {
                                            logError('Error', 'An error occurred in an upgradeneeded handler attached to request chain', e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
                                            req.transaction.__abortTransaction(createDOMException('AbortError', 'A request was aborted.'));
                                            return;
                                        }
                                        finished();
                                    });
                                    req.transaction.on__beforecomplete = function (ev) {
                                        req.result.__versionTransaction = null;
                                        sysdbFinishedCb(systx, false, function () {
                                            req.transaction.__transFinishedCb(false, function () {
                                                if (useDatabaseCache) {
                                                    if (name in websqlDBCache) {
                                                        delete websqlDBCache[name][version];
                                                    }
                                                }
                                                ev.complete();
                                                req.__transaction = null;
                                            });
                                        });
                                    };
                                    req.transaction.on__preabort = function () {
                                        // We ensure any cache is deleted before any request error events fire and try to reopen
                                        if (useDatabaseCache) {
                                            if (name in websqlDBCache) {
                                                delete websqlDBCache[name][version];
                                            }
                                        }
                                    };
                                    req.transaction.on__abort = function () {
                                        req.__transaction = null;
                                        connection.close();
                                        setTimeout(() => {
                                            const err = createDOMException('AbortError', 'The upgrade transaction was aborted.');
                                            sysdbFinishedCb(systx, err, function () {
                                                dbCreateError(err);
                                            });
                                        });
                                    };
                                    req.transaction.on__complete = function () {
                                        if (req.result.__closed) {
                                            req.__transaction = null;
                                            const err = createDOMException('AbortError', 'The connection has been closed.');
                                            dbCreateError(err);
                                            return;
                                        }
                                        // Since this is running directly after `IDBTransaction.complete`,
                                        //   there should be a new task. However, while increasing the
                                        //   timeout 1ms in `IDBTransaction.__executeRequests` can allow
                                        //   `IDBOpenDBRequest.onsuccess` to trigger faster than a new
                                        //   transaction as required by "transaction-create_in_versionchange" in
                                        //   w3c/Transaction.js (though still on a timeout separate from this
                                        //   preceding `IDBTransaction.oncomplete`), this causes a race condition
                                        //   somehow with old transactions (e.g., for the Mocha test,
                                        //   in `IDBObjectStore.deleteIndex`, "should delete an index that was
                                        //   created in a previous transaction").
                                        // setTimeout(() => {
                                        req.__transaction = null;
                                        const e = createEvent('success');
                                        req.dispatchEvent(e);
                                        // });
                                    };
                                }
                                if (oldVersion === 0) {
                                    systx.executeSql('INSERT INTO dbVersions VALUES (?,?)', [sqlSafeName, version], versionSet, dbCreateError);
                                } else {
                                    systx.executeSql('UPDATE dbVersions SET "version" = ? WHERE "name" = ?', [version, sqlSafeName], versionSet, dbCreateError);
                                }
                            }, dbCreateError, null, function (currentTask, err, done, rollback, commit) {
                                if (currentTask.readOnly || err) {
                                    return true;
                                }
                                sysdbFinishedCb = function (systx, err, cb) {
                                    if (err) {
                                        rollback(err, cb);
                                    } else {
                                        commit(cb);
                                    }
                                };
                                return false;
                            });
                        });
                    } else {
                        addResult();
                        const e = createEvent('success');
                        req.dispatchEvent(e);
                    }
                }, dbCreateError);
            }, dbCreateError);
        }, dbCreateError);
    }

    addRequestToConnectionQueue(req, name, /* origin */ undefined, function (req) {
        let latestCachedVersion;
        if (useDatabaseCache) {
            if (!(name in websqlDBCache)) {
                websqlDBCache[name] = {};
            }
            if (version === undefined) {
                latestCachedVersion = getLatestCachedWebSQLVersion(name);
            } else if (websqlDBCache[name][version]) {
                latestCachedVersion = version;
            }
        }
        if (latestCachedVersion) {
            openDB(latestCachedVersion);
        } else {
            createSysDB(me.__openDatabase, function () {
                sysdb.readTransaction(function (sysReadTx) {
                    sysReadTx.executeSql('SELECT "version" FROM dbVersions WHERE "name" = ?', [sqlSafeName], function (sysReadTx, data) {
                        if (data.rows.length === 0) {
                            // Database with this name does not exist
                            openDB(0);
                        } else {
                            openDB(data.rows.item(0).version);
                        }
                    }, dbCreateError);
                }, dbCreateError);
            }, dbCreateError);
        }
    });

    return req;
};

/**
 * Deletes a database
 * @param {string} name
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.deleteDatabase = function (name) {
    const me = this;
    if (!(me instanceof IDBFactory)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    }
    if (hasNullOrigin()) {
        throw createDOMException('SecurityError', 'Cannot delete an IndexedDB database from an opaque origin.');
    }

    name = String(name); // cast to a string
    const sqlSafeName = util.escapeSQLiteStatement(name);

    let escapedDatabaseName;
    try {
        escapedDatabaseName = util.escapeDatabaseNameForSQLAndFiles(name);
    } catch (err) {
        throw err; // throw new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
    }

    const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
    const useDatabaseCache = CFG.cacheDatabaseInstances !== false || useMemoryDatabase;

    const req = IDBOpenDBRequest.__createInstance();
    let calledDBError = false;
    let version = 0;

    let sysdbFinishedCbDelete = function (err, cb) {
        cb(err);
    };

    // Although the spec has no specific conditions where an error
    //  may occur in `deleteDatabase`, it does provide for
    //  `UnknownError` as we may require upon a SQL deletion error
    function dbError (tx, err) {
        if (calledDBError || err === true) {
            return;
        }
        err = webSQLErrback(err || tx);
        sysdbFinishedCbDelete(true, function () {
            req.__readyState = 'done';
            req.__error = err;
            req.__result = undefined;
            // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
            const e = createEvent('error', err, {bubbles: true, cancelable: true});
            req.dispatchEvent(e);
            calledDBError = true;
        });
    }

    addRequestToConnectionQueue(req, name, /* origin */ undefined, function (req) {
        createSysDB(me.__openDatabase, function () {
            // function callback (cb) { cb(); }
            // callback(function () {

            function databaseDeleted () {
                sysdbFinishedCbDelete(false, function () {
                    if (useDatabaseCache && name in websqlDBCache) {
                        delete websqlDBCache[name]; // New calls will treat as though never existed
                    }
                    delete me.__connections[name];

                    req.__result = undefined;
                    req.__readyState = 'done';
                    const e = new IDBVersionChangeEvent('success', {oldVersion: version, newVersion: null});
                    req.dispatchEvent(e);
                });
            }
            sysdb.readTransaction(function (sysReadTx) {
                sysReadTx.executeSql('SELECT "version" FROM dbVersions WHERE "name" = ?', [sqlSafeName], function (sysReadTx, data) {
                    if (data.rows.length === 0) {
                        req.__result = undefined;
                        const e = new IDBVersionChangeEvent('success', {oldVersion: version, newVersion: null});
                        req.dispatchEvent(e);
                        return;
                    }
                    version = data.rows.item(0).version;

                    const openConnections = me.__connections[name] || [];
                    triggerAnyVersionChangeAndBlockedEvents(openConnections, req, version, null).then(function () {
                        // Since we need two databases which can't be in a single transaction, we
                        //  do this deleting from `dbVersions` first since the `__sys__` deleting
                        //  only impacts file memory whereas this one is critical for avoiding it
                        //  being found via `open` or `webkitGetDatabaseNames`; however, we will
                        //  avoid committing anyways until all deletions are made and rollback the
                        //  `dbVersions` change if they fail
                        sysdb.transaction(function (systx) {
                            systx.executeSql('DELETE FROM dbVersions WHERE "name" = ? ', [sqlSafeName], function () {
                                // Todo: We should also check whether `dbVersions` is empty and if so, delete upon
                                //    `deleteDatabaseFiles` config. We also ought to do this when aborting (see
                                //    above code with `DELETE FROM dbVersions`)
                                if (useMemoryDatabase) {
                                    const latestSQLiteDBCached = websqlDBCache[name] ? getLatestCachedWebSQLDB(name) : null;
                                    if (!latestSQLiteDBCached) {
                                        console.warn('Could not find a memory database instance to delete.');
                                        databaseDeleted();
                                        return;
                                    }
                                    const sqliteDB = latestSQLiteDBCached._db && latestSQLiteDBCached._db._db;
                                    if (!sqliteDB || !sqliteDB.close) {
                                        console.error('The `openDatabase` implementation does not have the expected `._db._db.close` method for closing the database');
                                        return;
                                    }
                                    sqliteDB.close(function (err) {
                                        if (err) {
                                            console.warn('Error closing (destroying) memory database');
                                            return;
                                        }
                                        databaseDeleted();
                                    });
                                    return;
                                }
                                if (CFG.deleteDatabaseFiles !== false && ({}.toString.call(process) === '[object process]')) {
                                    require('fs').unlink(require('path').resolve(escapedDatabaseName), (err) => {
                                        if (err && err.code !== 'ENOENT') { // Ignore if file is already deleted
                                            dbError({code: 0, message: 'Error removing database file: ' + escapedDatabaseName + ' ' + err});
                                            return;
                                        }
                                        databaseDeleted();
                                    });
                                    return;
                                }

                                const sqliteDB = me.__openDatabase(
                                    path.join(CFG.databaseBasePath || '', escapedDatabaseName),
                                    1,
                                    name,
                                    CFG.DEFAULT_DB_SIZE
                                );
                                sqliteDB.transaction(function (tx) {
                                    tx.executeSql('SELECT "name" FROM __sys__', [], function (tx, data) {
                                        const tables = data.rows;
                                        (function deleteTables (i) {
                                            if (i >= tables.length) {
                                                // If all tables are deleted, delete the housekeeping tables
                                                tx.executeSql('DROP TABLE IF EXISTS __sys__', [], function () {
                                                    databaseDeleted();
                                                }, dbError);
                                            } else {
                                                // Delete all tables in this database, maintained in the sys table
                                                tx.executeSql('DROP TABLE ' + util.escapeStoreNameForSQL(
                                                    util.unescapeSQLiteResponse( // Avoid double-escaping
                                                        tables.item(i).name
                                                    )
                                                ), [], function () {
                                                    deleteTables(i + 1);
                                                }, function () {
                                                    deleteTables(i + 1);
                                                });
                                            }
                                        }(0));
                                    }, function (e) {
                                        // __sys__ table does not exist, but that does not mean delete did not happen
                                        databaseDeleted();
                                    });
                                });
                            }, dbError);
                        }, dbError, null, function (currentTask, err, done, rollback, commit) {
                            if (currentTask.readOnly || err) {
                                return true;
                            }
                            sysdbFinishedCbDelete = function (err, cb) {
                                if (err) {
                                    rollback(err, cb);
                                } else {
                                    commit(cb);
                                }
                            };
                            return false;
                        });
                    }, dbError);
                }, dbError);
            });
        }, dbError);
    });

    return req;
};

/**
 * Compares two keys
 * @param key1
 * @param key2
 * @returns {number}
 */
function cmp (first, second) {
    const encodedKey1 = Key.encode(first);
    const encodedKey2 = Key.encode(second);
    const result = encodedKey1 > encodedKey2 ? 1 : encodedKey1 === encodedKey2 ? 0 : -1;

    if (CFG.DEBUG) {
        // verify that the keys encoded correctly
        let decodedKey1 = Key.decode(encodedKey1);
        let decodedKey2 = Key.decode(encodedKey2);
        if (typeof first === 'object') {
            first = JSON.stringify(first);
            decodedKey1 = JSON.stringify(decodedKey1);
        }
        if (typeof second === 'object') {
            second = JSON.stringify(second);
            decodedKey2 = JSON.stringify(decodedKey2);
        }

        // encoding/decoding mismatches are usually due to a loss of floating-point precision
        if (decodedKey1 !== first) {
            console.warn(first + ' was incorrectly encoded as ' + decodedKey1);
        }
        if (decodedKey2 !== second) {
            console.warn(second + ' was incorrectly encoded as ' + decodedKey2);
        }
    }

    return result;
}

IDBFactory.prototype.cmp = function (key1, key2) {
    if (!(this instanceof IDBFactory)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length < 2) {
        throw new TypeError('You must provide two keys to be compared');
    }
    // We use encoding facilities already built for proper sorting;
    //   the following "conversions" are for validation only
    Key.convertValueToKeyRethrowingAndIfInvalid(key1);
    Key.convertValueToKeyRethrowingAndIfInvalid(key2);
    return cmp(key1, key2);
};

/**
* NON-STANDARD!! (Also may return outdated information if a database has since been deleted)
* @link https://www.w3.org/Bugs/Public/show_bug.cgi?id=16137
* @link http://lists.w3.org/Archives/Public/public-webapps/2011JulSep/1537.html
*/
IDBFactory.prototype.webkitGetDatabaseNames = function () {
    const me = this;
    if (!(me instanceof IDBFactory)) {
        throw new TypeError('Illegal invocation');
    }
    if (hasNullOrigin()) {
        throw createDOMException('SecurityError', 'Cannot get IndexedDB database names from an opaque origin.');
    }

    let calledDbCreateError = false;
    function dbGetDatabaseNamesError (tx, err) {
        if (calledDbCreateError) {
            return;
        }
        err = err ? webSQLErrback(err) : tx;
        calledDbCreateError = true;
        // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
        const evt = createEvent('error', err, {bubbles: true, cancelable: true}); // http://stackoverflow.com/questions/40165909/to-where-do-idbopendbrequest-error-events-bubble-up/40181108#40181108
        req.__readyState = 'done';
        req.__error = err;
        req.__result = undefined;
        req.dispatchEvent(evt);
    }
    const req = IDBRequest.__createInstance();
    createSysDB(me.__openDatabase, function () {
        sysdb.readTransaction(function (sysReadTx) {
            sysReadTx.executeSql('SELECT "name" FROM dbVersions', [], function (sysReadTx, data) {
                const dbNames = ShimDOMStringList.__createInstance();
                for (let i = 0; i < data.rows.length; i++) {
                    dbNames.push(util.unescapeSQLiteResponse(data.rows.item(i).name));
                }
                req.__result = dbNames;
                req.__readyState = 'done';
                const e = createEvent('success'); // http://stackoverflow.com/questions/40165909/to-where-do-idbopendbrequest-error-events-bubble-up/40181108#40181108
                req.dispatchEvent(e);
            }, dbGetDatabaseNamesError);
        }, dbGetDatabaseNamesError);
    }, dbGetDatabaseNamesError);
    return req;
};

/**
* @Todo __forceClose: Test
* This is provided to facilitate unit-testing of the
*  closing of a database connection with a forced flag:
* <http://w3c.github.io/IndexedDB/#steps-for-closing-a-database-connection>
*/
IDBFactory.prototype.__forceClose = function (dbName, connIdx, msg) {
    const me = this;
    function forceClose (conn) {
        conn.__forceClose(msg);
    }
    if (dbName == null) {
        Object.values(me.__connections).forEach((conn) => conn.forEach(forceClose));
    } else if (!me.__connections[dbName]) {
        console.log('No database connections with that name to force close');
    } else if (connIdx == null) {
        me.__connections[dbName].forEach(forceClose);
    } else if (!Number.isInteger(connIdx) || connIdx < 0 || connIdx > me.__connections[dbName].length - 1) {
        throw new TypeError(
            'If providing an argument, __forceClose must be called with a ' +
            'numeric index to indicate a specific connection to lose'
        );
    } else {
        forceClose(me.__connections[dbName][connIdx]);
    }
};

IDBFactory.prototype[Symbol.toStringTag] = 'IDBFactoryPrototype';

Object.defineProperty(IDBFactory, 'prototype', {
    writable: false
});

const shimIndexedDB = IDBFactory.__createInstance();
export {IDBFactory, cmp, shimIndexedDB};

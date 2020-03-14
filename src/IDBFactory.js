/* globals location */
import path from 'path';
import SyncPromise from 'sync-promise';

import {createEvent} from './Event.js';
import IDBVersionChangeEvent from './IDBVersionChangeEvent.js';
import {logError, webSQLErrback, createDOMException} from './DOMException.js';
import {IDBOpenDBRequest} from './IDBRequest.js';
import cmp from './cmp.js';
import * as util from './util.js';
import * as Key from './Key.js';
import IDBTransaction from './IDBTransaction.js';
import IDBDatabase from './IDBDatabase.js';
import CFG from './CFG.js';

let fs;
const setFS = (_fs) => {
    fs = _fs;
};

const getOrigin = () => {
    return (typeof location !== 'object' || !location) ? 'null' : location.origin;
};
const hasNullOrigin = () => CFG.checkOrigin !== false && (getOrigin() === 'null');

// Todo: This really should be process and tab-independent so the
//  origin could vary; in the browser, this might be through a
//  `SharedWorker`
const connectionQueue = {};

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

// eslint-disable-next-line default-param-last
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
    const connectionIsClosed = (connection) => connection.__closePending;
    const connectionsClosed = () => openConnections.every((conn) => {
        return connectionIsClosed(conn);
    });
    return openConnections.reduce(function (promises, entry) {
        if (connectionIsClosed(entry)) {
            return promises;
        }
        return promises.then(function () {
            if (connectionIsClosed(entry)) {
                // Prior onversionchange must have caused this connection to be closed
                return undefined;
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
        if (connectionsClosed()) {
            return undefined;
        }
        return new SyncPromise(function (resolve) {
            const unblocking = {
                check () {
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
    });
}

const websqlDBCache = {};
let sysdb;
let nameCounter = 0;

function getLatestCachedWebSQLVersion (name) {
    return Object.keys(websqlDBCache[name]).map((version) => {
        return Number(version);
    }).reduce(
        (prev, curr) => {
            return curr > prev ? curr : prev;
        }, 0
    );
}

function getLatestCachedWebSQLDB (name) {
    return websqlDBCache[name] && websqlDBCache[name][
        getLatestCachedWebSQLVersion(name)
    ];
}

function cleanupDatabaseResources (__openDatabase, name, escapedDatabaseName, databaseDeleted, dbError) {
    const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
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
    if (fs && CFG.deleteDatabaseFiles !== false) {
        fs.unlink(path.join(CFG.databaseBasePath || '', escapedDatabaseName), (err) => {
            if (err && err.code !== 'ENOENT') { // Ignore if file is already deleted
                dbError({
                    code: 0,
                    message: 'Error removing database file: ' + escapedDatabaseName + ' ' + err
                });
                return;
            }
            databaseDeleted();
        });
        return;
    }

    const sqliteDB = __openDatabase(
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
}

/**
* @callback CreateSysDBSuccessCallback
* @returns {void}
*/

/**
 * Creates the sysDB to keep track of version numbers for databases.
 * @param {openDatabase} __openDatabase
 * @param {CreateSysDBSuccessCallback} success
 * @param {DOMException} failure
 * @returns {void}
 */
function createSysDB (__openDatabase, success, failure) {
    function sysDbCreateError (tx, err) {
        err = webSQLErrback(err || tx);
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
            systx.executeSql('CREATE TABLE IF NOT EXISTS dbVersions (name BLOB, version INT);', [], function (systx) {
                if (!CFG.useSQLiteIndexes) {
                    success();
                    return;
                }
                systx.executeSql('CREATE INDEX IF NOT EXISTS dbvname ON dbVersions(name)', [], success, sysDbCreateError);
            }, sysDbCreateError);
        }, sysDbCreateError);
    }
}

/**
 * IDBFactory Class.
 * @see https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
 * @class
 */
function IDBFactory () {
    throw new TypeError('Illegal constructor');
}
const IDBFactoryAlias = IDBFactory;
IDBFactory.__createInstance = function () {
    function IDBFactory () {
        this[Symbol.toStringTag] = 'IDBFactory';
        this.__connections = {};
    }
    IDBFactory.prototype = IDBFactoryAlias.prototype;
    return new IDBFactory();
};

/* eslint-disable jsdoc/check-param-names */
/**
 * The IndexedDB Method to create a new database and return the DB.
 * @param {string} name
 * @param {number} version
 * @throws {TypeError} Illegal invocation or no arguments (for database name)
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.open = function (name /* , version */) {
    /* eslint-enable jsdoc/check-param-names */
    const me = this;
    if (!(me instanceof IDBFactory)) {
        throw new TypeError('Illegal invocation');
    }
    // eslint-disable-next-line prefer-rest-params
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
    // eslint-disable-next-line no-useless-catch
    try {
        escapedDatabaseName = util.escapeDatabaseNameForSQLAndFiles(name);
    // eslint-disable-next-line sonarjs/no-useless-catch
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
        req.__done = true;
        req.__error = err;
        req.__result = undefined; // Must be undefined if an error per `result` getter
        req.dispatchEvent(evt);
    }

    function setupDatabase (tx, db, oldVersion) {
        tx.executeSql('SELECT "name", "keyPath", "autoInc", "indexList" FROM __sys__', [], function (tx, data) {
            function finishRequest () {
                req.__result = connection;
                req.__done = true;
            }
            const connection = IDBDatabase.__createInstance(db, name, oldVersion, version, data);
            if (!me.__connections[name]) {
                me.__connections[name] = [];
            }
            me.__connections[name].push(connection);

            if (oldVersion < version) {
                const openConnections = me.__connections[name].slice(0, -1);
                triggerAnyVersionChangeAndBlockedEvents(openConnections, req, oldVersion, version).then(function () {
                    // DB Upgrade in progress
                    let sysdbFinishedCb = function (systx, err, cb) {
                        if (err) {
                            try {
                                systx.executeSql('ROLLBACK', [], cb, cb);
                            } catch (er) {
                                // Browser may fail with expired transaction above so
                                //     no choice but to manually revert
                                sysdb.transaction(function (systx) {
                                    function reportError (msg) {
                                        throw new Error('Unable to roll back upgrade transaction!' + (msg || ''));
                                    }

                                    // Attempt to revert
                                    if (oldVersion === 0) {
                                        systx.executeSql('DELETE FROM dbVersions WHERE "name" = ?', [sqlSafeName], function () {
                                            cb(reportError); // eslint-disable-line promise/no-callback-in-promise
                                        }, reportError);
                                    } else {
                                        systx.executeSql('UPDATE dbVersions SET "version" = ? WHERE "name" = ?', [oldVersion, sqlSafeName], cb, reportError);
                                    }
                                });
                            }
                            return;
                        }
                        // In browser, should auto-commit
                        cb(); // eslint-disable-line promise/no-callback-in-promise
                    };

                    sysdb.transaction(function (systx) {
                        function versionSet () {
                            const e = new IDBVersionChangeEvent('upgradeneeded', {oldVersion, newVersion: version});
                            req.__result = connection;
                            connection.__upgradeTransaction = req.__transaction = req.__result.__versionTransaction = IDBTransaction.__createInstance(req.__result, req.__result.objectStoreNames, 'versionchange');
                            req.__done = true;

                            req.transaction.__addNonRequestToTransactionQueue(function onupgradeneeded (tx, args, finished, error) {
                                req.dispatchEvent(e);

                                if (e.__legacyOutputDidListenersThrowError) {
                                    logError('Error', 'An error occurred in an upgradeneeded handler attached to request chain', e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
                                    req.transaction.__abortTransaction(createDOMException('AbortError', 'A request was aborted.'));
                                    return;
                                }
                                finished();
                            });
                            req.transaction.on__beforecomplete = function (ev) {
                                connection.__upgradeTransaction = null;
                                req.__result.__versionTransaction = null;
                                sysdbFinishedCb(systx, false, function () {
                                    req.transaction.__transFinishedCb(false, function () {
                                        ev.complete();
                                        req.__transaction = null;
                                    });
                                });
                            };
                            req.transaction.on__preabort = function () {
                                connection.__upgradeTransaction = null;
                                // We ensure any cache is deleted before any request error events fire and try to reopen
                                if (useDatabaseCache) {
                                    if (name in websqlDBCache) {
                                        delete websqlDBCache[name][version];
                                    }
                                }
                            };
                            req.transaction.on__abort = function () {
                                req.__transaction = null;
                                // `readyState` and `result` will be reset anyways by `dbCreateError` but we follow spec.
                                req.__result = undefined;
                                req.__done = false;

                                connection.close();
                                setTimeout(() => {
                                    const err = createDOMException('AbortError', 'The upgrade transaction was aborted.');
                                    sysdbFinishedCb(systx, err, function (reportError) {
                                        if (oldVersion === 0) {
                                            cleanupDatabaseResources(me.__openDatabase, name, escapedDatabaseName, dbCreateError.bind(null, err), reportError || dbCreateError);
                                            return;
                                        }
                                        dbCreateError(err);
                                    });
                                });
                            };
                            req.transaction.on__complete = function () {
                                if (req.__result.__closePending) {
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

                                finishRequest();

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
                    return undefined;
                }).catch((err) => {
                    console.log('Error within `triggerAnyVersionChangeAndBlockedEvents`');
                    throw err;
                });
            } else {
                finishRequest();

                const e = createEvent('success');
                req.dispatchEvent(e);
            }
        }, dbCreateError);
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
                if (!(name in websqlDBCache)) {
                    websqlDBCache[name] = {};
                }
                websqlDBCache[name][version] = db;
            }
        }

        if (version === undefined) {
            version = oldVersion || 1;
        }
        if (oldVersion > version) {
            const err = createDOMException('VersionError', 'An attempt was made to open a database using a lower version than the existing version.', version);
            if (useDatabaseCache) {
                setTimeout(() => {
                    dbCreateError(err);
                });
            } else {
                dbCreateError(err);
            }
            return;
        }

        db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS __sys__ (name BLOB, keyPath BLOB, autoInc BOOLEAN, indexList BLOB, currNum INTEGER)', [], function () {
                function setup () {
                    setupDatabase(tx, db, oldVersion);
                }
                if (!CFG.createIndexes) {
                    setup();
                    return;
                }
                tx.executeSql('CREATE INDEX IF NOT EXISTS sysname ON __sys__(name)', [], setup, dbCreateError);
            }, dbCreateError);
        }, dbCreateError);
    }

    addRequestToConnectionQueue(req, name, /* origin */ undefined, function (req) {
        let latestCachedVersion;
        if (useDatabaseCache) {
            if (!(name in websqlDBCache)) {
                websqlDBCache[name] = {};
            }
            latestCachedVersion = getLatestCachedWebSQLVersion(name);
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
 * Deletes a database.
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
    // eslint-disable-next-line no-useless-catch
    try {
        escapedDatabaseName = util.escapeDatabaseNameForSQLAndFiles(name);
    // eslint-disable-next-line sonarjs/no-useless-catch
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
            req.__done = true;
            req.__error = err;
            req.__result = undefined; // Must be undefined if an error per `result` getter
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

            function completeDatabaseDelete () {
                req.__result = undefined;
                req.__done = true;
                const e = new IDBVersionChangeEvent('success', {oldVersion: version, newVersion: null});
                req.dispatchEvent(e);
            }

            function databaseDeleted () {
                sysdbFinishedCbDelete(false, function () {
                    if (useDatabaseCache && name in websqlDBCache) {
                        delete websqlDBCache[name]; // New calls will treat as though never existed
                    }
                    delete me.__connections[name];

                    completeDatabaseDelete();
                });
            }
            sysdb.readTransaction(function (sysReadTx) {
                sysReadTx.executeSql('SELECT "version" FROM dbVersions WHERE "name" = ?', [sqlSafeName], function (sysReadTx, data) {
                    if (data.rows.length === 0) {
                        completeDatabaseDelete();
                        return undefined;
                    }
                    ({version} = data.rows.item(0));

                    const openConnections = me.__connections[name] || [];
                    triggerAnyVersionChangeAndBlockedEvents(openConnections, req, version, null).then(function () { // eslint-disable-line promise/catch-or-return
                        // Since we need two databases which can't be in a single transaction, we
                        //  do this deleting from `dbVersions` first since the `__sys__` deleting
                        //  only impacts file memory whereas this one is critical for avoiding it
                        //  being found via `open` or `databases`; however, we will
                        //  avoid committing anyways until all deletions are made and rollback the
                        //  `dbVersions` change if they fail
                        sysdb.transaction(function (systx) {
                            systx.executeSql('DELETE FROM dbVersions WHERE "name" = ? ', [sqlSafeName], function () {
                                // Todo: We should also check whether `dbVersions` is empty and if so, delete upon
                                //    `deleteDatabaseFiles` config. We also ought to do this when aborting (see
                                //    above code with `DELETE FROM dbVersions`)
                                cleanupDatabaseResources(me.__openDatabase, name, escapedDatabaseName, databaseDeleted, dbError);
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
                        return undefined;
                    }, dbError);
                    return undefined;
                }, dbError);
            });
        }, dbError);
    });

    return req;
};

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
* May return outdated information if a database has since been deleted.
* @see https://github.com/w3c/IndexedDB/pull/240/files
* @returns {Promise<string[]>}
*/
IDBFactory.prototype.databases = function () {
    const me = this;
    let calledDbCreateError = false;
    return new Promise(function (resolve, reject) { // eslint-disable-line promise/avoid-new
        if (!(me instanceof IDBFactory)) {
            throw new TypeError('Illegal invocation');
        }
        if (hasNullOrigin()) {
            throw createDOMException('SecurityError', 'Cannot get IndexedDB database names from an opaque origin.');
        }
        function dbGetDatabaseNamesError (tx, err) {
            if (calledDbCreateError) {
                return;
            }
            err = err ? webSQLErrback(err) : tx;
            calledDbCreateError = true;
            reject(err);
        }
        createSysDB(me.__openDatabase, function () {
            sysdb.readTransaction(function (sysReadTx) {
                sysReadTx.executeSql('SELECT "name", "version" FROM dbVersions', [], function (sysReadTx, data) {
                    const dbNames = [];
                    for (let i = 0; i < data.rows.length; i++) {
                        const {name, version} = data.rows.item(i);
                        dbNames.push({
                            name: util.unescapeSQLiteResponse(name),
                            version
                        });
                    }
                    resolve(dbNames);
                }, dbGetDatabaseNamesError);
            }, dbGetDatabaseNamesError);
        }, dbGetDatabaseNamesError);
    });
};

/**
* @todo forceClose: Test
* This is provided to facilitate unit-testing of the
*  closing of a database connection with a forced flag:
* <http://w3c.github.io/IndexedDB/#steps-for-closing-a-database-connection>
* @param {string} dbName
* @param {Integer} connIdx
* @param {string} msg
* @throws {TypeError}
* @returns {void}
*/
IDBFactory.prototype.__forceClose = function (dbName, connIdx, msg) {
    const me = this;
    function forceClose (conn) {
        conn.__forceClose(msg);
    }
    if (util.isNullish(dbName)) {
        Object.values(me.__connections).forEach((conn) => {
            forceClose(conn);
        });
    } else if (!me.__connections[dbName]) {
        console.log('No database connections with that name to force close');
    } else if (util.isNullish(connIdx)) {
        me.__connections[dbName].forEach((conn) => {
            forceClose(conn);
        });
    } else if (!Number.isInteger(connIdx) || connIdx < 0 || connIdx > me.__connections[dbName].length - 1) {
        throw new TypeError(
            'If providing an argument, __forceClose must be called with a ' +
            'numeric index to indicate a specific connection to lose'
        );
    } else {
        forceClose(me.__connections[dbName][connIdx]);
    }
};

IDBFactory.prototype.__setConnectionQueueOrigin = function (origin = getOrigin()) {
    connectionQueue[origin] = {};
};

IDBFactory.prototype[Symbol.toStringTag] = 'IDBFactoryPrototype';

Object.defineProperty(IDBFactory, 'prototype', {
    writable: false
});

const shimIndexedDB = IDBFactory.__createInstance();
export {IDBFactory, cmp, shimIndexedDB, setFS};

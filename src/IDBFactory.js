/* eslint-disable sonarjs/no-invariant-returns -- Convenient here */
// eslint-disable-next-line no-restricted-imports -- Can be polyfilled
import path from 'path';
import SyncPromise from 'sync-promise-expanded';

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

/**
 * @typedef {number} Integer
 */

/**
 * @callback DatabaseDeleted
 * @returns {void}
 */

/** @type {import('./CFG.js').FSApi} */
let fs;

/**
 * @param {import('./CFG.js').FSApi} _fs
 * @returns {void}
 */
const setFS = (_fs) => {
    fs = _fs;
};

/**
 * @returns {string}
 */
const getOrigin = () => {
    return (typeof location !== 'object' || !location) ? 'null' : location.origin;
};
const hasNullOrigin = () => CFG.checkOrigin !== false && (getOrigin() === 'null');

// Todo: This really should be process and tab-independent so the
//  origin could vary; in the browser, this might be through a
//  `SharedWorker`

/**
 * @type {{
 *   [key: string]: {
 *     [key: string]: {
 *       req: import('./IDBRequest.js').IDBOpenDBRequestFull,
 *       cb: (req: import('./IDBRequest.js').IDBRequestFull) => void,
 *     }[]
 *   }
 * }}
 */
const connectionQueue = {};

/**
 * @param {string} name
 * @param {string} origin
 * @returns {void}
 */
function processNextInConnectionQueue (name, origin = getOrigin()) {
    const queueItems = connectionQueue[origin][name];
    if (!queueItems[0]) { // Nothing left to process
        return;
    }
    const {req, cb} = queueItems[0]; // Keep in queue to prevent continuation

    /**
     * @returns {void}
     */
    function removeFromQueue () {
        queueItems.shift();
        processNextInConnectionQueue(name, origin);
    }
    req.addEventListener('success', removeFromQueue);
    req.addEventListener('error', removeFromQueue);
    req.addEventListener('blocked', removeFromQueue);
    cb(req);
}

/* eslint-disable default-param-last -- Keep cb at end */
/**
 * @param {import('./IDBRequest.js').IDBOpenDBRequestFull} req
 * @param {string} name
 * @param {string} origin
 * @param {(req: import('./IDBRequest.js').IDBOpenDBRequestFull) => void} cb
 * @returns {void}
 */
function addRequestToConnectionQueue (req, name, origin = getOrigin(), cb) {
    /* eslint-enable default-param-last -- Keep cb at end */
    if (!connectionQueue[origin][name]) {
        connectionQueue[origin][name] = [];
    }
    connectionQueue[origin][name].push({req, cb});

    if (connectionQueue[origin][name].length === 1) { // If there are no items in the queue, we have to start it
        processNextInConnectionQueue(name, origin);
    }
}

/**
 * @param {import('./IDBDatabase.js').IDBDatabaseFull[]} openConnections
 * @param {import('./IDBRequest.js').IDBRequestFull} req
 * @param {Integer} oldVersion
 * @param {Integer|null} newVersion
 * @returns {SyncPromise}
 */
function triggerAnyVersionChangeAndBlockedEvents (openConnections, req, oldVersion, newVersion) {
    // Todo: For Node (and in browser using service workers if available?) the
    //    connections ought to involve those in any process; should also
    //    auto-close if unloading

    /**
     * @param {IDBDatabase} connection
     * @returns {boolean|undefined}
     */
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
            const e = /** @type {Event & IDBVersionChangeEvent} */ (
                new IDBVersionChangeEvent('versionchange', {oldVersion, newVersion})
            );
            return new SyncPromise(function (resolve) {
                setTimeout(() => {
                    entry.dispatchEvent(e); // No need to catch errors
                    resolve(undefined);
                });
            });
        });
    }, SyncPromise.resolve(undefined)).then(function () {
        if (connectionsClosed()) {
            return undefined;
        }
        return new SyncPromise(function (resolve) {
            const unblocking = {
                check () {
                    if (connectionsClosed()) {
                        resolve(undefined);
                    }
                }
            };
            const e = /** @type {Event & IDBVersionChangeEvent} */ (
                new IDBVersionChangeEvent('blocked', {oldVersion, newVersion})
            );
            setTimeout(() => {
                req.dispatchEvent(e); // No need to catch errors
                if (!connectionsClosed()) {
                    openConnections.forEach((connection) => {
                        if (!connectionIsClosed(connection)) {
                            connection.__unblocking = unblocking;
                        }
                    });
                } else {
                    resolve(undefined);
                }
            });
        });
    });
}

/**
 * @typedef {import('websql-configurable/lib/websql/WebSQLDatabase.js').default & {
 *   _db: {
 *     _db: {
 *       close: (errBack: (err: Error) => void) => void
 *     }
 *   }
 * }} DatabaseFull
 */

/**
 * @type {{
 *   [key: string]: {
 *     [key: string]: DatabaseFull
 *   }
 * }}
 */
const websqlDBCache = {};

/** @type {import('websql-configurable/lib/websql/WebSQLDatabase.js').default} */
let sysdb;
let nameCounter = 0;

/**
 * @param {string} name
 * @returns {Integer}
 */
function getLatestCachedWebSQLVersion (name) {
    return Object.keys(websqlDBCache[name]).map(Number).reduce(
        (prev, curr) => {
            return Math.max(curr, prev);
        }, 0
    );
}

/**
 * @param {string} name
 * @returns {DatabaseFull}
 */
function getLatestCachedWebSQLDB (name) {
    return websqlDBCache[name] && websqlDBCache[name][
        getLatestCachedWebSQLVersion(name)
    ];
}

/**
 * @param {OpenDatabase} __openDatabase
 * @param {string} name
 * @param {string} escapedDatabaseName
 * @param {DatabaseDeleted} databaseDeleted
 * @param {(tx: SQLTransaction|Error|SQLError, err?: SQLError) => boolean} dbError
 * @returns {void}
 */
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
        sqliteDB.close(
            /**
             * @param {Error} err
             * @returns {void}
             */
            (err) => {
                if (err) {
                    console.warn('Error closing (destroying) memory database');
                    return;
                }
                databaseDeleted();
            }
        );
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
        '1',
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
                        return false;
                    });
                }
            }(0));
        }, function () {
            // __sys__ table does not exist, but that does not mean delete did not happen
            databaseDeleted();
            return false;
        });
    });
}

/**
 * @callback CreateSysDBSuccessCallback
 * @returns {void}
 */

/**
 * Creates the sysDB to keep track of version numbers for databases.
 * @param {OpenDatabase} __openDatabase
 * @param {CreateSysDBSuccessCallback} success
 * @param {(tx: SQLTransaction|SQLError|Error, err?: SQLError) => void} failure
 * @returns {void}
 */
function createSysDB (__openDatabase, success, failure) {
    /**
     *
     * @param {boolean|SQLTransaction|SQLError} tx
     * @param {SQLError} [err]
     * @returns {void}
     */
    function sysDbCreateError (tx, err) {
        const er = webSQLErrback(/** @type {SQLError} */ (err) || tx);
        if (CFG.DEBUG) { console.log('Error in sysdb transaction - when creating dbVersions', err); }
        failure(er);
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
            '1',
            'System Database',
            CFG.DEFAULT_DB_SIZE
        );
        sysdb.transaction(function (systx) {
            systx.executeSql('CREATE TABLE IF NOT EXISTS dbVersions (name BLOB, version INT);', [], function (systx) {
                if (!CFG.useSQLiteIndexes) {
                    success();
                    return;
                }
                systx.executeSql(
                    'CREATE INDEX IF NOT EXISTS dbvname ON dbVersions(name)',
                    [],
                    success,
                    /** @type {SQLStatementErrorCallback} */ (sysDbCreateError)
                );
            }, /** @type {SQLStatementErrorCallback} */ (sysDbCreateError));
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

/**
 * @typedef {(
 *   name: string, version: string, displayName: string, estimatedSize: number
 * ) => import('websql-configurable/lib/websql/WebSQLDatabase.js').default} OpenDatabase
 */

/**
 * @typedef {globalThis.IDBFactory & {
 *   __openDatabase: OpenDatabase,
 *   __connections: {
 *     [key: string]: import('./IDBDatabase.js').IDBDatabaseFull[]
 *   }
* }} IDBFactoryFull
 */

const IDBFactoryAlias = IDBFactory;
/**
 * @returns {IDBFactoryFull}
 */
IDBFactory.__createInstance = function () {
    /**
     * @class
     */
    function IDBFactory () {
        this[Symbol.toStringTag] = 'IDBFactory';
        this.__connections = {};
    }
    IDBFactory.prototype = IDBFactoryAlias.prototype;

    // @ts-expect-error It's ok
    return new IDBFactory();
};

/**
 * The IndexedDB Method to create a new database and return the DB.
 * @param {string} name
 * @this {IDBFactoryFull}
 * @throws {TypeError} Illegal invocation or no arguments (for database name)
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.open = function (name /* , version */) {
    const me = this;
    if (!(me instanceof IDBFactory)) {
        throw new TypeError('Illegal invocation');
    }
    // eslint-disable-next-line prefer-rest-params -- API
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

    /** @type {string} */
    let escapedDatabaseName;
    // eslint-disable-next-line no-useless-catch -- Possible refactoring
    try {
        escapedDatabaseName = util.escapeDatabaseNameForSQLAndFiles(name);
    // eslint-disable-next-line sonarjs/no-useless-catch -- Possible refactoring
    } catch (err) {
        throw err; // new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
    }

    /**
     *
     * @param {SQLTransaction|Error|SQLError} tx
     * @param {SQLError} [err]
     * @returns {boolean}
     */
    function dbCreateError (tx, err) {
        if (calledDbCreateError) {
            return false;
        }
        const er = err ? webSQLErrback(err) : /** @type {Error} */ (tx);
        calledDbCreateError = true;
        // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
        const evt = createEvent('error', er, {bubbles: true, cancelable: true});
        req.__done = true;
        req.__error = er;
        req.__result = undefined; // Must be undefined if an error per `result` getter
        req.dispatchEvent(evt);
        return false;
    }

    /**
     *
     * @param {SQLTransaction} tx
     * @param {DatabaseFull} db
     * @param {Integer} oldVersion
     * @returns {void}
     */
    function setupDatabase (tx, db, oldVersion) {
        tx.executeSql('SELECT "name", "keyPath", "autoInc", "indexList" FROM __sys__', [], function (tx, data) {
            /**
             * @returns {void}
             */
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
                    /**
                     *
                     * @param {SQLTransaction} systx
                     * @param {boolean|SQLError|DOMException|Error} err
                     * @param {(tx?: SQLTransaction|SQLError, err?: SQLError|SQLResultSet) => boolean} cb
                     * @returns {void}
                     */
                    let sysdbFinishedCb = function (systx, err, cb) {
                        if (err) {
                            try {
                                systx.executeSql('ROLLBACK', [], cb, cb);
                            } catch (err) {
                                // Browser may fail with expired transaction above so
                                //     no choice but to manually revert
                                sysdb.transaction(function (systx) {
                                    /**
                                     *
                                     * @param {string} msg
                                     * @throws {Error}
                                     * @returns {never}
                                     */
                                    function reportError (msg) {
                                        throw new Error('Unable to roll back upgrade transaction!' + (msg || ''));
                                    }

                                    // Attempt to revert
                                    if (oldVersion === 0) {
                                        systx.executeSql(
                                            'DELETE FROM dbVersions WHERE "name" = ?',
                                            [sqlSafeName],
                                            function () {
                                                // @ts-expect-error Force to work
                                                cb(reportError); // eslint-disable-line promise/no-callback-in-promise -- Convenient
                                            },
                                            // @ts-expect-error Force to work
                                            reportError
                                        );
                                    } else {
                                        systx.executeSql(
                                            'UPDATE dbVersions SET "version" = ? WHERE "name" = ?',
                                            [
                                                oldVersion, sqlSafeName
                                            ],
                                            cb,
                                            // @ts-expect-error Force to work
                                            reportError
                                        );
                                    }
                                });
                            }
                            return;
                        }
                        // In browser, should auto-commit
                        cb(); // eslint-disable-line promise/no-callback-in-promise -- Convenient
                    };

                    sysdb.transaction(function (systx) {
                        /**
                         * @returns {void}
                         */
                        function versionSet () {
                            const e = /** @type {import('eventtargeter').EventWithProps & Event & IDBVersionChangeEvent} */ (
                                new IDBVersionChangeEvent('upgradeneeded', {oldVersion, newVersion: version})
                            );
                            req.__result = connection;
                            connection.__upgradeTransaction = req.__transaction = req.__result.__versionTransaction = IDBTransaction.__createInstance(req.__result, req.__result.objectStoreNames, 'versionchange');
                            req.__done = true;

                            req.transaction.__addNonRequestToTransactionQueue(function onupgradeneeded (tx, args, finished /* , error */) {
                                req.dispatchEvent(e);

                                if (e.__legacyOutputDidListenersThrowError) {
                                    logError('Error', 'An error occurred in an upgradeneeded handler attached to request chain', /** @type {Error} */ (e.__legacyOutputDidListenersThrowError)); // We do nothing else with this error as per spec
                                    req.transaction.__abortTransaction(createDOMException('AbortError', 'A request was aborted.'));
                                    return;
                                }
                                finished();
                            });

                            // eslint-disable-next-line camelcase -- Clear API
                            req.transaction.on__beforecomplete = function (ev) {
                                connection.__upgradeTransaction = null;
                                /** @type {import('./IDBDatabase.js').IDBDatabaseFull} */ (
                                    req.__result
                                ).__versionTransaction = null;
                                sysdbFinishedCb(systx, false, function () {
                                    req.transaction.__transFinishedCb(false, function () {
                                        ev.complete();
                                        req.__transaction = null;
                                    });
                                    return false;
                                });
                            };

                            // eslint-disable-next-line camelcase -- Clear API
                            req.transaction.on__preabort = function () {
                                connection.__upgradeTransaction = null;
                                // We ensure any cache is deleted before any request error events fire and try to reopen
                                if (useDatabaseCache) {
                                    if (name in websqlDBCache) {
                                        delete websqlDBCache[name][version];
                                    }
                                }
                            };

                            // eslint-disable-next-line camelcase -- Clear API
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
                                            cleanupDatabaseResources(
                                                me.__openDatabase,
                                                name,
                                                escapedDatabaseName,
                                                dbCreateError.bind(null, err),
                                                // @ts-expect-error It's ok
                                                reportError || dbCreateError
                                            );
                                            return false;
                                        }
                                        dbCreateError(err);
                                        return false;
                                    });
                                });
                            };

                            // eslint-disable-next-line camelcase -- Clear API
                            req.transaction.on__complete = function () {
                                const pos = connection.__transactions.indexOf(req.transaction);
                                if (pos !== -1) {
                                    connection.__transactions.splice(pos, 1);
                                }

                                if (/** @type {import('./IDBDatabase.js').IDBDatabaseFull} */ (
                                    req.__result
                                ).__closePending) {
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
                    }, dbCreateError, undefined, function (currentTask, err, done, rollback, commit) {
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

    /**
     *
     * @param {Integer} oldVersion
     * @returns {void}
     */
    function openDB (oldVersion) {
        /** @type {DatabaseFull} */
        let db;
        if ((useMemoryDatabase || useDatabaseCache) && name in websqlDBCache && websqlDBCache[name][version]) {
            db = websqlDBCache[name][version];
        } else {
            db = me.__openDatabase(
                useMemoryDatabase ? CFG.memoryDatabase : path.join(CFG.databaseBasePath || '', escapedDatabaseName),
                '1',
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
                /**
                 * @returns {void}
                 */
                function setup () {
                    setupDatabase(tx, db, oldVersion);
                }
                if (!CFG.createIndexes) {
                    setup();
                    return;
                }
                tx.executeSql('CREATE INDEX IF NOT EXISTS sysname ON __sys__(name)', [], setup, dbCreateError);
            }, /** @type {SQLStatementErrorCallback} */ (dbCreateError));
        }, dbCreateError);
    }

    addRequestToConnectionQueue(req, name, /* origin */ undefined, function () {
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
 * @this {IDBFactoryFull}
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

    /** @type {string} */
    let escapedDatabaseName;
    // eslint-disable-next-line no-useless-catch -- Possible refactoring
    try {
        escapedDatabaseName = util.escapeDatabaseNameForSQLAndFiles(name);
    // eslint-disable-next-line sonarjs/no-useless-catch -- Possible refactoring
    } catch (err) {
        throw err; // throw new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
    }

    const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
    const useDatabaseCache = CFG.cacheDatabaseInstances !== false || useMemoryDatabase;

    const req = IDBOpenDBRequest.__createInstance();
    let calledDBError = false;
    let version = 0;

    /**
     *
     * @param {boolean} err
     * @param {(erred?: boolean) => void} cb
     * @returns {void}
     */
    let sysdbFinishedCbDelete = function (err, cb) {
        cb(err);
    };

    // Although the spec has no specific conditions where an error
    //  may occur in `deleteDatabase`, it does provide for
    //  `UnknownError` as we may require upon a SQL deletion error
    /**
     *
     * @param {SQLTransaction|SQLError|Error} tx
     * @param {SQLError|boolean} [err]
     * @returns {boolean}
     */
    function dbError (tx, err) {
        if (calledDBError || err === true) {
            return false;
        }
        const er = webSQLErrback(/** @type {SQLError} */ (err || tx));
        sysdbFinishedCbDelete(true, function () {
            req.__done = true;
            req.__error = er;
            req.__result = undefined; // Must be undefined if an error per `result` getter
            // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
            const e = createEvent('error', er, {bubbles: true, cancelable: true});
            req.dispatchEvent(e);
            calledDBError = true;
        });
        return false;
    }

    addRequestToConnectionQueue(req, name, /* origin */ undefined, function (req) {
        createSysDB(me.__openDatabase, function () {
            // function callback (cb) { cb(); }
            // callback(function () {

            /**
             * @returns {void}
             */
            function completeDatabaseDelete () {
                req.__result = undefined;
                req.__done = true;
                const e = /** @type {Event & IDBVersionChangeEvent} */ (
                    new IDBVersionChangeEvent('success', {oldVersion: version, newVersion: null})
                );
                req.dispatchEvent(e);
            }

            /** @type {DatabaseDeleted} */
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
                    triggerAnyVersionChangeAndBlockedEvents(openConnections, req, version, null).then(function () { // eslint-disable-line promise/catch-or-return -- Sync promise
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
                        }, dbError, undefined, function (currentTask, err, done, rollback, commit) {
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
                    // @ts-expect-error It's ok
                    }, dbError);
                    return undefined;
                }, dbError);
            });
        }, dbError);
    });

    return req;
};

/**
 *
 * @param {import('./Key.js').Key} key1
 * @param {import('./Key.js').Key} key2
 * @throws {TypeError}
 * @returns {number}
 */
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
* @this {IDBFactoryFull}
* @returns {Promise<{
*   name: string,
*   version: Integer
* }[]>}
*/
IDBFactory.prototype.databases = function () {
    const me = this;
    let calledDbCreateError = false;
    return new Promise(function (resolve, reject) { // eslint-disable-line promise/avoid-new -- Own polyfill
        if (!(me instanceof IDBFactory)) {
            throw new TypeError('Illegal invocation');
        }
        if (hasNullOrigin()) {
            throw createDOMException('SecurityError', 'Cannot get IndexedDB database names from an opaque origin.');
        }
        /**
         *
         * @param {true|SQLTransaction|SQLError|DOMException|Error} tx
         * @param {SQLError|DOMException|Error} [err]
         * @returns {boolean}
         */
        function dbGetDatabaseNamesError (tx, err) {
            if (calledDbCreateError) {
                return false;
            }
            const er = err ? webSQLErrback(/** @type {SQLError} */ (err)) : tx;
            calledDbCreateError = true;
            reject(er);
            return false;
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
* @this {IDBFactoryFull}
* @returns {void}
*/
IDBFactory.prototype.__forceClose = function (dbName, connIdx, msg) {
    const me = this;
    /**
     *
     * @param {import('./IDBDatabase.js').IDBDatabaseFull} conn
     * @returns {void}
     */
    function forceClose (conn) {
        conn.__forceClose(msg);
    }
    if (util.isNullish(dbName)) {
        (Object.values(me.__connections)).forEach((connections) => {
            connections.forEach((connection) => {
                forceClose(connection);
            });
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
            'numeric index to indicate a specific connection to close'
        );
    } else {
        forceClose(me.__connections[dbName][connIdx]);
    }
};

/**
 *
 * @param {string} [origin]
 * @returns {void}
 */
IDBFactory.prototype.__setConnectionQueueOrigin = function (origin = getOrigin()) {
    connectionQueue[origin] = {};
};

IDBFactory.prototype[Symbol.toStringTag] = 'IDBFactoryPrototype';

Object.defineProperty(IDBFactory, 'prototype', {
    writable: false
});

const shimIndexedDB = IDBFactory.__createInstance();
export {IDBFactory, cmp, shimIndexedDB, setFS};

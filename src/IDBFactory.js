/* eslint-disable sonarjs/no-invariant-returns -- Convenient here */
// eslint-disable-next-line no-restricted-imports -- Can be polyfilled
import path from 'node:path';
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
 * @typedef {import('websql-configurable/lib/websql/WebSQLTransaction.js').default} WebSQLTransaction
 */

/**
 * @typedef {import('websql-configurable/lib/websql/WebSQLTransaction.js').SqlErrorCallback} SqlErrorCallback
 */

/**
 * @typedef {import('websql-configurable/lib/websql/WebSQLResultSet.js').default} WebSQLResultSet
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
    // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Necessary?
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
 *       cb: (req: import('./IDBRequest.js').IDBOpenDBRequestFull) => void,
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
    // Only a terminal (`success`/`error`) event advances the queue --
    //   `blocked` means this request is still pending (waiting on other
    //   connections to close), so later requests for the same database must
    //   keep waiting behind it rather than starting concurrently, per
    //   https://w3c.github.io/IndexedDB/#request-connection-queue.
    req.addEventListener('success', removeFromQueue);
    req.addEventListener('error', removeFromQueue);
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
    if (!Object.hasOwn(connectionQueue[origin], name)) {
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
     * @param {import('./IDBDatabase.js').IDBDatabaseFull} connection
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
                // @ts-ignore It's ok; needed under some TS versions
                new IDBVersionChangeEvent('versionchange', {oldVersion, newVersion})
            );
            return new SyncPromise(function (resolve) {
                setTimeout(() => {
                    entry.dispatchEvent(e); // No need to catch errors
                    // Unlike a native `Promise`, `SyncPromise#then` chains
                    //   synchronously off `resolve()` (verified directly:
                    //   `SyncPromise.resolve().then(cb)` runs `cb` before
                    //   even the calling code below it finishes) -- so
                    //   resolving immediately here would let the
                    //   `connectionsClosed()` check below run before a
                    //   same-task-but-microtask-later continuation of a
                    //   `versionchange` listener above (e.g. an `await`-
                    //   based one that then calls `db.close()`, as in
                    //   `transaction-lifetime.any.js`) ever gets a turn,
                    //   incorrectly firing `blocked` even though the
                    //   connection was about to close in time. Give real
                    //   microtask-deferred continuations a small, bounded
                    //   number of turns first -- same pattern as
                    //   `IDBTransaction.js`'s `checkQueueEntry`.
                    let attemptsLeft = 10;
                    (function wait () {
                        if (attemptsLeft-- <= 0) {
                            resolve(undefined);
                            return;
                        }
                        queueMicrotask(wait);
                    }());
                }, 0);
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
                // @ts-ignore It's ok; needed under some TS versions
                new IDBVersionChangeEvent('blocked', {oldVersion, newVersion})
            );
            setTimeout(() => {
                req.dispatchEvent(e); // No need to catch errors
                if (!connectionsClosed()) {
                    openConnections.forEach((connection) => {
                        if (!connectionIsClosed(connection)) {
                            // Several concurrently-blocked requests can each be
                            //   waiting on this same connection, so append
                            //   rather than overwrite -- see `IDBDatabase.close`.
                            connection.__unblocking.push(unblocking);
                        }
                    });
                } else {
                    resolve(undefined);
                }
            }, 0);
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

/**
 * Tracks databases with a creation/upgrade currently in flight but not yet
 *   committed or aborted -- keyed by (unescaped) database name. The
 *   `dbVersions` row in `sysdb` these entries shadow is written *before*
 *   `upgradeneeded` is even dispatched to user code (as the success
 *   callback of that very `INSERT`/`UPDATE`), on the same shared `sysdb`
 *   connection `databases()` itself reads from -- so, absent this, a
 *   `databases()` call made while an upgrade is still pending would see
 *   the new row (or new version) immediately, rather than only once the
 *   corresponding `versionchange` transaction has genuinely committed, as
 *   required by `get-databases.any.js`'s "doesn't pick up changes that
 *   haven't committed" test. `IDBFactory.prototype.databases` filters
 *   its SQL results against this map.
 * @type {Map<string, {oldVersion: Integer, newVersion: Integer}>}
 */
const pendingVersionChanges = new Map();

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
 * A cached WebSQL connection (e.g., from a prior `open()`) can keep the
 *  underlying SQLite file handle open even after `IDBDatabase#close()`
 *  (which only flags the connection for closing without releasing the
 *  handle, to allow instance reuse). On Windows, deleting a file while a
 *  handle to it is still open fails with `EBUSY`, so any cached connections
 *  for `name` must be actually closed (and evicted, since they're no longer
 *  usable) before attempting to remove the file.
 * @param {string} name
 * @param {() => void} cb
 * @returns {void}
 */
function closeCachedWebSQLConnections (name, cb) {
    if (!Object.hasOwn(websqlDBCache, name)) {
        cb();
        return;
    }
    const dbs = Object.values(websqlDBCache[name]);
    delete websqlDBCache[name];
    let remaining = dbs.length;
    if (remaining === 0) {
        cb();
        return;
    }
    dbs.forEach((db) => {
        const sqliteDB = db._db && db._db._db;
        if (!sqliteDB || !sqliteDB.close) {
            remaining--;
            if (remaining === 0) {
                cb();
            }
            return;
        }
        sqliteDB.close(
            /**
             * @param {Error} err
             * @returns {void}
             */
            (err) => {
                if (err) {
                    console.warn('Error closing database connection prior to file removal: ' + err);
                }
                remaining--;
                if (remaining === 0) {
                    cb();
                }
            }
        );
    });
}

/**
 * @param {OpenDatabase} __openDatabase
 * @param {string} name
 * @param {string} escapedDatabaseName
 * @param {DatabaseDeleted} databaseDeleted
 * @param {(tx: WebSQLTransaction|Error|(Error & {code?: number}), err?: (Error & {code?: number})) => boolean} dbError
 * @returns {void}
 */
function cleanupDatabaseResources (__openDatabase, name, escapedDatabaseName, databaseDeleted, dbError) {
    const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
    if (useMemoryDatabase) {
        const latestSQLiteDBCached = Object.hasOwn(websqlDBCache, name) ? getLatestCachedWebSQLDB(name) : null;
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
        closeCachedWebSQLConnections(name, () => {
            fs.unlink(path.join(CFG.databaseBasePath || '', escapedDatabaseName), (err) => {
                if (err && err.code !== 'ENOENT') { // Ignore if file is already deleted
                    const removalError = /** @type {Error & {code?: number}} */ (
                        new Error('Error removing database file: ' + escapedDatabaseName + ' ' + err)
                    );
                    removalError.code = 0;
                    dbError(removalError);
                    return;
                }
                databaseDeleted();
            });
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
                            /** @type {{name: string}} */ (tables.item(i)).name
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
 * @param {(tx: WebSQLTransaction|(Error & {code?: number})|Error, err?: (Error & {code?: number})) => void} failure
 * @returns {void}
 */
function createSysDB (__openDatabase, success, failure) {
    /**
     *
     * @param {boolean|WebSQLTransaction|(Error & {code?: number})} tx
     * @param {(Error & {code?: number})} [err]
     * @returns {void}
     */
    function sysDbCreateError (tx, err) {
        const er = webSQLErrback(/** @type {(Error & {code?: number})} */ (err) || tx);
        if (CFG.DEBUG) { console.log('Error in sysdb transaction - when creating dbVersions', err); }
        failure(er);
    }

    if (sysdb) {
        success();
    } else {
        // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Necessary?
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
                    /** @type {SqlErrorCallback} */ (sysDbCreateError)
                );
            }, /** @type {SqlErrorCallback} */ (sysDbCreateError));
        }, sysDbCreateError);
    }
}

/**
 * IDBFactory Class.
 * @see https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
 * @throws {TypeError}
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
 *   },
 *   __forceClose: (dbName: string, connIdx: Integer, msg: string) => void,
 *   __setConnectionQueueOrigin: (origin?: string) => void
 * }} IDBFactoryFull
 */

const IDBFactoryAlias = IDBFactory;
/**
 * @returns {IDBFactoryFull}
 */
IDBFactory.__createInstance = function () {
    /**
     * @class
     * @this {IDBFactoryFull}
     */
    function IDBFactory () {
        // @ts-expect-error It's ok
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
    let isRevertingSysdb = false;

    if (CFG.autoName && name === '') {
        // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Necessary?
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
     * @param {WebSQLTransaction|Error|(Error & {code?: number})} tx
     * @param {(Error & {code?: number})} [err]
     * @returns {boolean}
     */
    function dbCreateError (tx, err) {
        if (calledDbCreateError || isRevertingSysdb) {
            return false;
        }
        // Defensive cleanup: `pendingVersionChanges.set(name, ...)` (see
        //   below) runs *before* the `dbVersions` `INSERT`/`UPDATE` it
        //   guards is even attempted, but only `versionSet`'s own
        //   `on__beforecomplete`/`on__preabort` handlers ever clear it --
        //   and `versionSet` never runs at all if that `INSERT`/`UPDATE`,
        //   or an earlier step in this same `open()` flow, fails first.
        //   Without this, such a failure would leave the entry orphaned
        //   forever, silently corrupting `databases()` for any *other*,
        //   unrelated later `open()` call that happens to reuse the same
        //   database name (common in WPT tests, e.g. generic names like
        //   "DB1"/"TestDatabase" reused across different test files in
        //   the same process). A no-op if no entry was ever set.
        pendingVersionChanges.delete(name);
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
     * @param {WebSQLTransaction} tx
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
            if (!Object.hasOwn(me.__connections, name)) {
                me.__connections[name] = [];
            }
            me.__connections[name].push(connection);

            if (oldVersion < version) {
                const openConnections = me.__connections[name].slice(0, -1);
                triggerAnyVersionChangeAndBlockedEvents(openConnections, req, oldVersion, version).then(function () {
                    // DB Upgrade in progress
                    /**
                     *
                     * @param {WebSQLTransaction} systx
                     * @param {boolean|(Error & {code?: number})|DOMException|Error} err
                     * @param {(tx?: WebSQLTransaction|(Error & {code?: number}), err?: (Error & {code?: number})|WebSQLResultSet) => boolean} cb
                     * @returns {void}
                     */
                    let sysdbFinishedCb = function (systx, err, cb) {
                        if (err) {
                            /**
                             * @param {any} [errorToShow]
                             * @returns {void}
                             */
                            const manualRevert = function (errorToShow) {
                                /**
                                 * @param {string} [msg]
                                 * @throws {Error}
                                 * @returns {never}
                                 */
                                function reportError (msg) {
                                    throw new Error('Unable to roll back upgrade transaction!' + (msg || ''));
                                }

                                sysdb.transaction(
                                    function (systx) {
                                        // Attempt to revert
                                        if (oldVersion === 0) {
                                            systx.executeSql(
                                                'DELETE FROM dbVersions WHERE "name" = ?',
                                                [sqlSafeName]
                                            );
                                        } else {
                                            systx.executeSql(
                                                'UPDATE dbVersions SET "version" = ? WHERE "name" = ?',
                                                [oldVersion, sqlSafeName]
                                            );
                                        }
                                    },
                                    function (sqlErr) {
                                        isRevertingSysdb = false;
                                        cb(sqlErr);
                                    },
                                    function () {
                                        isRevertingSysdb = false;
                                        cb(errorToShow || reportError); // eslint-disable-line promise/no-callback-in-promise -- Convenient
                                    }
                                );
                            };

                            try {
                                systx.executeSql(
                                    'ROLLBACK',
                                    [],
                                    function () {
                                        cb();
                                    },
                                    function (tx, sqlErr) {
                                        // Browser/Node may fail with expired transaction, so manually revert
                                        manualRevert(sqlErr);
                                        return false;
                                    }
                                );
                            } catch (e) {
                                // Browser may fail with expired transaction above so
                                //     no choice but to manually revert
                                manualRevert(e);
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
                                // @ts-ignore It's ok; needed under some TS versions
                                new IDBVersionChangeEvent('upgradeneeded', {oldVersion, newVersion: version})
                            );
                            req.__result = connection;
                            connection.__upgradeTransaction = req.__transaction = req.__result.__versionTransaction = IDBTransaction.__createInstance(req.__result, req.__result.objectStoreNames, 'versionchange');
                            req.__done = true;

                            req.transaction.__addNonRequestToTransactionQueue(
                                /**
                                 * @param {import('websql-configurable/lib/websql/WebSQLTransaction.js').default} tx
                                 * @param {ObjectArray} args
                                 * @param {(result?: any, req?: import('./IDBRequest.js').IDBRequestFull) => void} finished
                                 * @returns {void}
                                 */
                                function onupgradeneeded (tx, args, finished /* , error */) {
                                    // Unlike ordinary requests, this dispatch doesn't go through
                                    //   `IDBTransaction`'s own `success`/`error` closures, so it must
                                    //   open/close the transaction's active-handler window itself.
                                    req.transaction.__handlerActive = true;
                                    req.dispatchEvent(e);
                                    // Give any microtask-scheduled continuation of the
                                    //   `upgradeneeded` handler (e.g. a plain
                                    //   `Promise.resolve().then(...)`, or an `await`-based
                                    //   continuation of a promise resolved from within the handler,
                                    //   such as testharness.js's own `EventWatcher`) a chance to
                                    //   run -- and still observe the transaction as active -- before
                                    //   we deactivate it again, per
                                    //   https://github.com/w3c/IndexedDB/issues/87. A single deferred
                                    //   tick isn't always enough: an `await`-based continuation can
                                    //   take more than one microtask turn to resume (e.g.
                                    //   `transaction-lifetime.any.js`'s `EventWatcher`-based
                                    //   `await eventWatcher.wait_for('upgradeneeded')`), so retry a
                                    //   small, bounded number of times first -- same pattern as
                                    //   `IDBTransaction.js`'s `checkQueueEntry` -- rather than
                                    //   resetting after only one. Only the flag reset itself is
                                    //   deferred here -- unlike `IDBTransaction.js`'s
                                    //   `advanceAfterDispatch`, `finished()` (this transaction's own
                                    //   queue-advancement/completion signal) still runs
                                    //   synchronously, at exactly its previous timing: an earlier
                                    //   attempt at deferring `finished()` too raced against unrelated
                                    //   test setup that assumed a freshly deleted/created database's
                                    //   upgrade transaction had already fully completed by the time
                                    //   this function returns.
                                    /**
                                     * @param {Integer} attemptsLeft
                                     * @returns {void}
                                     */
                                    function deferHandlerActiveReset (attemptsLeft) {
                                        if (attemptsLeft <= 0) {
                                            req.transaction.__handlerActive = false;
                                            return;
                                        }
                                        queueMicrotask(() => {
                                            deferHandlerActiveReset(attemptsLeft - 1);
                                        });
                                    }
                                    deferHandlerActiveReset(10);

                                    if (e.__legacyOutputDidListenersThrowError) {
                                        logError('Error', 'An error occurred in an upgradeneeded handler attached to request chain', /** @type {Error} */ (e.__legacyOutputDidListenersThrowError)); // We do nothing else with this error as per spec
                                        req.transaction.__abortTransaction(createDOMException('AbortError', 'A request was aborted.'));
                                        return;
                                    }
                                    finished();
                                }
                            );

                            // eslint-disable-next-line camelcase -- Clear API
                            req.transaction.on__beforecomplete =
                                /**
                                 * @param {Event & {complete: () => void}} ev
                                 * @returns {void}
                                 */
                                function (ev) {
                                    pendingVersionChanges.delete(name);
                                    connection.__upgradeTransaction = null;
                                    /** @type {import('./IDBDatabase.js').IDBDatabaseFull} */ (
                                        req.__result
                                    ).__versionTransaction = null;
                                    sysdbFinishedCb(systx, false, function () {
                                        req.transaction.__callTransFinishedCb(false, function () {
                                            ev.complete();
                                            req.__transaction = null;
                                        });
                                        return false;
                                    });
                                };

                            // eslint-disable-next-line camelcase -- Clear API
                            req.transaction.on__preabort = function () {
                                isRevertingSysdb = true;
                                pendingVersionChanges.delete(name);
                                connection.__upgradeTransaction = null;
                                // We ensure any cache is deleted before any request error events fire and try to reopen
                                if (useDatabaseCache) {
                                    if (Object.hasOwn(websqlDBCache, name)) {
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
                                isRevertingSysdb = true;
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
                                }, 0);
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

                        pendingVersionChanges.set(name, {oldVersion, newVersion: version});
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
                                rollback(err,
                                    /**
                                     * @param {Error} [reportError]
                                     * @returns {void}
                                     */
                                    function (reportError) {
                                        sysdb.transaction(
                                            function (systx) {
                                                if (oldVersion === 0) {
                                                    systx.executeSql(
                                                        'DELETE FROM dbVersions WHERE "name" = ?',
                                                        [sqlSafeName]
                                                    );
                                                } else {
                                                    systx.executeSql(
                                                        'UPDATE dbVersions SET "version" = ? WHERE "name" = ?',
                                                        [oldVersion, sqlSafeName]
                                                    );
                                                }
                                            },
                                            function (sqlErr) {
                                                isRevertingSysdb = false;
                                                cb(sqlErr);
                                            },
                                            function () {
                                                isRevertingSysdb = false;
                                                cb(reportError); // eslint-disable-line promise/no-callback-in-promise -- Convenient
                                            }
                                        );
                                    });
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
        if (version === undefined) {
            // Resolve before use as a cache key below, or a `open(name)` call
            //  (no explicit version) would cache/look up under `undefined`
            //  instead of the actual version, causing a second, separate
            //  connection to be opened for the same database on reopen.
            version = oldVersion || 1;
        }
        if ((useMemoryDatabase || useDatabaseCache) && Object.hasOwn(websqlDBCache, name) && Object.hasOwn(websqlDBCache[name], version)) {
            db = websqlDBCache[name][version];
        } else {
            db = /** @type {DatabaseFull} */ (me.__openDatabase(
                useMemoryDatabase ? CFG.memoryDatabase : path.join(CFG.databaseBasePath || '', escapedDatabaseName),
                '1',
                name,
                CFG.DEFAULT_DB_SIZE
            ));
            if (useDatabaseCache) {
                if (!(Object.hasOwn(websqlDBCache, name))) {
                    websqlDBCache[name] = {};
                }
                websqlDBCache[name][version] = db;
            }
        }

        if (oldVersion > version) {
            const err = createDOMException('VersionError', 'An attempt was made to open a database using a lower version than the existing version.', version);
            if (useDatabaseCache) {
                setTimeout(() => {
                    dbCreateError(err);
                }, 0);
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
            }, /** @type {SqlErrorCallback} */ (dbCreateError));
        }, dbCreateError);
    }

    addRequestToConnectionQueue(req, name, /* origin */ undefined, function () {
        let latestCachedVersion;
        if (useDatabaseCache) {
            if (!Object.hasOwn(websqlDBCache, name)) {
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
                            openDB(/** @type {{version: Integer}} */ (data.rows.item(0)).version);
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
     * @param {WebSQLTransaction|(Error & {code?: number})|Error} tx
     * @param {(Error & {code?: number})|boolean} [err]
     * @returns {boolean}
     */
    function dbError (tx, err) {
        if (calledDBError) {
            return false;
        }
        // Must be set synchronously (not inside the `sysdbFinishedCbDelete` callback below) to
        //  guard against reentrancy: `sysdbFinishedCbDelete` -> `rollback`/`commit` -> websql-configurable's
        //  `done()` -> `currentTask.errorCallback(er)`, which is this very `dbError`, calling back into
        //  us before the first invocation has finished. Without this, a second rollback/commit gets
        //  issued on the shared `sysdb` connection after it has already moved on to the next queued
        //  transaction, corrupting that connection's task queue (see issue with unrelated `open()` calls
        //  failing/crashing after a `deleteDatabase` file-removal error).
        calledDBError = true;
        const er = webSQLErrback(/** @type {(Error & {code?: number})} */ (err || tx));
        sysdbFinishedCbDelete(true, function () {
            req.__done = true;
            req.__error = er;
            req.__result = undefined; // Must be undefined if an error per `result` getter
            // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
            const e = createEvent('error', er, {bubbles: true, cancelable: true});
            req.dispatchEvent(e);
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
                    // @ts-ignore It's ok; needed under some TS versions
                    new IDBVersionChangeEvent('success', {oldVersion: version, newVersion: null})
                );
                req.dispatchEvent(e);
            }

            /** @type {DatabaseDeleted} */
            function databaseDeleted () {
                sysdbFinishedCbDelete(false, function () {
                    if (useDatabaseCache && Object.hasOwn(websqlDBCache, name)) {
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
                    ({version} = /** @type {{version: Integer}} */ (data.rows.item(0)));

                    const openConnections = me.__connections[name] || [];
                    triggerAnyVersionChangeAndBlockedEvents(openConnections, req, version, null).then(function () {
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
                    }).catch(dbError);
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
    // Snapshotted *now*, synchronously, at call time -- not read later
    // from inside the SQL query's callback below, which runs on a
    //   deferred macrotask (see `nodeSQLiteDatabase.js`'s `exec`) and so
    //   could otherwise race against (and lose to) an in-flight upgrade's
    //   own commit/abort handler clearing its `pendingVersionChanges`
    //   entry in the meantime -- which would make this method incorrectly
    //   reflect a since-committed change that hadn't committed yet when
    //   it was actually called.
    const pendingVersionChangesSnapshot = new Map(pendingVersionChanges);
    return new Promise(function (resolve, reject) { // eslint-disable-line promise/avoid-new -- Own polyfill
        if (!(me instanceof IDBFactory)) {
            throw new TypeError('Illegal invocation');
        }
        if (hasNullOrigin()) {
            throw createDOMException('SecurityError', 'Cannot get IndexedDB database names from an opaque origin.');
        }
        /**
         *
         * @param {true|WebSQLTransaction|(Error & {code?: number})|DOMException|Error} tx
         * @param {(Error & {code?: number})|DOMException|Error} [err]
         * @returns {boolean}
         */
        function dbGetDatabaseNamesError (tx, err) {
            if (calledDbCreateError) {
                return false;
            }
            const er = err ? webSQLErrback(/** @type {(Error & {code?: number})} */ (err)) : tx;
            calledDbCreateError = true;
            reject(er);
            return false;
        }
        createSysDB(me.__openDatabase, function () {
            sysdb.readTransaction(function (sysReadTx) {
                sysReadTx.executeSql('SELECT "name", "version" FROM dbVersions', [], function (sysReadTx, data) {
                    const dbNames = [];
                    for (let i = 0; i < data.rows.length; i++) {
                        const {name: encodedName, version} = /** @type {{name: string, version: Integer}} */ (data.rows.item(i));
                        const name = util.unescapeSQLiteResponse(encodedName);
                        // A row for a database whose creation/upgrade hasn't
                        //   committed yet (see `pendingVersionChanges`) must
                        //   not reflect that in-flight change: a brand new
                        //   database (`oldVersion === 0`) isn't reported at
                        //   all until its creation commits, and an existing
                        //   database being upgraded is still reported, but
                        //   with its pre-upgrade version.
                        const pending = pendingVersionChangesSnapshot.get(name);
                        if (pending) {
                            if (pending.oldVersion === 0) {
                                continue;
                            }
                            dbNames.push({name, version: pending.oldVersion});
                            continue;
                        }
                        dbNames.push({name, version});
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
 * <https://w3c.github.io/IndexedDB/#steps-for-closing-a-database-connection>
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
    } else if (!Object.hasOwn(me.__connections, dbName)) {
        console.log('No database connections with that name to force close');
    } else if (util.isNullish(connIdx)) {
        me.__connections[dbName].forEach((conn) => {
            forceClose(conn);
        });
    // eslint-disable-next-line unicorn/prefer-number-is-safe-integer -- Ok
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

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
util.setOperationNames(IDBFactory.prototype);
Object.defineProperty(IDBFactory, 'prototype', {
    writable: false
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

const shimIndexedDB = IDBFactory.__createInstance();
export {IDBFactory, cmp, shimIndexedDB, setFS};

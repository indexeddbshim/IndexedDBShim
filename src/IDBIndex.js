import SyncPromise from 'sync-promise-expanded';
import {createDOMException} from './DOMException.js';
import {IDBCursor, IDBCursorWithValue} from './IDBCursor.js';
import * as util from './util.js';
import * as Key from './Key.js';
import {setSQLForKeyRange, IDBKeyRange, convertValueToKeyRange} from './IDBKeyRange.js';
import IDBTransaction from './IDBTransaction.js';
import * as Sca from './Sca.js';
import CFG from './CFG.js';
import IDBObjectStore from './IDBObjectStore.js';

const readonlyProperties = ['objectStore', 'keyPath', 'multiEntry', 'unique'];

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {{
 *   columnName: string,
 *   keyPath: import('./Key.js').KeyPath,
 *   optionalParams: {
 *     unique: boolean,
 *     multiEntry: boolean
 *   }
 *   deleted?: boolean,
 *   __deleted?: boolean,
 *   cursors?: import('./IDBCursor.js').IDBCursorWithValueFull[],
 * }} IDBIndexProperties
 */

/**
 * IDB Index.
 * @see http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
 * @class
 */
function IDBIndex () {
    throw new TypeError('Illegal constructor');
}
const IDBIndexAlias = IDBIndex;

/**
 * @typedef {IDBIndex & {
 *   name: string,
 *   keyPath: import('./Key.js').KeyPath,
 *   multiEntry: boolean,
 *   unique: boolean,
 *   objectStore: import('./IDBObjectStore.js').IDBObjectStoreFull,
 *   __pendingCreate?: boolean,
 *   __deleted?: boolean,
 *   __originalName: string,
 *   __currentName: string,
 *   __pendingName?: string,
 *   __pendingDelete?: boolean,
 *   __name: string,
 *   __multiEntry: boolean,
 *   __unique: boolean,
 *   __objectStore: import('./IDBObjectStore.js').IDBObjectStoreFull,
 *   __keyPath: import('./Key.js').KeyPath,
 *   __recreated?: boolean
 * }} IDBIndexFull
 */

/**
 *
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {IDBIndexProperties} indexProperties
 * @returns {IDBIndexFull}
 */
IDBIndex.__createInstance = function (store, indexProperties) {
    /**
     * @class
     * @this {IDBIndexFull}
     */
    function IDBIndex () {
        const me = this;
        // @ts-expect-error It's ok
        me[Symbol.toStringTag] = 'IDBIndex';
        util.defineReadonlyProperties(me, readonlyProperties);
        me.__objectStore = store;
        me.__name = me.__originalName = indexProperties.columnName;
        me.__keyPath = Array.isArray(indexProperties.keyPath) ? indexProperties.keyPath.slice() : indexProperties.keyPath;
        const {optionalParams} = indexProperties;
        me.__multiEntry = Boolean(optionalParams && optionalParams.multiEntry);
        me.__unique = Boolean(optionalParams && optionalParams.unique);
        me.__deleted = Boolean(indexProperties.__deleted);
        me.__objectStore.__cursors = indexProperties.cursors || [];
        Object.defineProperty(me, '__currentName', {
            /**
             * @this {IDBIndexFull}
             * @returns {string}
             */
            get () {
                return '__pendingName' in me
                    ? /** @type {string} */ (me.__pendingName)
                    : me.name;
            }
        });
        Object.defineProperty(me, 'name', {
            enumerable: false,
            configurable: false,
            /**
             * @this {IDBIndexFull}
             * @returns {string}
             */
            get () {
                return this.__name;
            },
            /**
             * @param {string} newName
             * @this {IDBIndexFull}
             * @returns {void}
             */
            set (newName) {
                const me = this;
                newName = util.convertToDOMString(newName);
                const oldName = me.name;
                IDBTransaction.__assertVersionChange(me.objectStore.transaction);
                IDBTransaction.__assertActive(me.objectStore.transaction);
                IDBIndexAlias.__invalidStateIfDeleted(me);
                IDBObjectStore.__invalidStateIfDeleted(me);
                if (newName === oldName) {
                    return;
                }

                if (me.objectStore.__indexes[newName] && !me.objectStore.__indexes[newName].__deleted &&
                    !me.objectStore.__indexes[newName].__pendingDelete) {
                    throw createDOMException('ConstraintError', 'Index "' + newName + '" already exists on ' + me.objectStore.__currentName);
                }

                me.__name = newName;

                const {objectStore} = me;
                delete objectStore.__indexes[oldName];
                objectStore.__indexes[newName] = me;
                objectStore.indexNames.splice(objectStore.indexNames.indexOf(oldName), 1, newName);

                const storeHandle = /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
                    objectStore.transaction
                ).__storeHandles[objectStore.name];
                const oldIndexHandle = storeHandle.__indexHandles[oldName];
                oldIndexHandle.__name = newName; // Fix old references
                storeHandle.__indexHandles[newName] = oldIndexHandle; // Ensure new reference accessible
                me.__pendingName = oldName;

                const colInfoToPreserveArr = [
                    ['key', 'BLOB ' + (objectStore.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY')],
                    ['value', 'BLOB']
                ].concat(
                    // @ts-expect-error Has numeric indexes instead of iterator
                    [...objectStore.indexNames]
                        .filter((indexName) => indexName !== newName)
                        .map((indexName) => [util.escapeIndexNameForSQL(indexName), 'BLOB'])
                );

                me.__renameIndex(
                    objectStore, oldName, newName, colInfoToPreserveArr,
                    function (tx, success) {
                        IDBIndexAlias.__updateIndexList(store, tx, function (store) {
                            delete storeHandle.__pendingName;
                            success(store);
                        });
                    }
                );
            }
        });
    }
    IDBIndex.prototype = IDBIndexAlias.prototype;

    // @ts-expect-error It's ok
    return new IDBIndex();
};

/**
 *
 * @param {IDBIndexFull} index
 * @param {string} [msg]
 * @throws {DOMException}
 * @returns {void}
 */
IDBIndex.__invalidStateIfDeleted = function (index, msg) {
    if (index.__deleted || index.__pendingDelete || (
        index.__pendingCreate && index.objectStore.transaction && index.objectStore.transaction.__errored
    )) {
        throw createDOMException('InvalidStateError', msg || 'This index has been deleted');
    }
};

/**
 * Clones an IDBIndex instance for a different IDBObjectStore instance.
 * @param {IDBIndexFull} index
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @returns {IDBIndexFull}
 */
IDBIndex.__clone = function (index, store) {
    const idx = IDBIndex.__createInstance(store, {
        columnName: index.name,
        keyPath: index.keyPath,
        optionalParams: {
            multiEntry: index.multiEntry,
            unique: index.unique
        }
    });
    /** @type {const} */ ([
        '__pendingCreate', '__pendingDelete', '__deleted',
        '__originalName', '__recreated'
    ]).forEach((p) => {
        // @ts-expect-error Why is this type "never"?
        idx[p] = index[p];
    });
    return idx;
};

/**
 * Creates a new index on an object store.
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {IDBIndexFull} index
 * @returns {void}
 */
IDBIndex.__createIndex = function (store, index) {
    const indexName = index.name;
    const storeName = store.__currentName;
    const idx = store.__indexes[indexName];

    index.__pendingCreate = true;

    // Add the index to the IDBObjectStore
    store.indexNames.push(indexName);
    store.__indexes[indexName] = index; // We add to indexes as needs to be available, e.g., if there is a subsequent deleteIndex call

    let indexHandle = store.__indexHandles[indexName];
    if (!indexHandle ||
        index.__pendingDelete ||
        index.__deleted ||
        indexHandle.__pendingDelete ||
        indexHandle.__deleted
    ) {
        indexHandle = store.__indexHandles[indexName] = IDBIndex.__clone(index, store);
    }

    // Create the index in WebSQL
    const {transaction} = store;
    /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
        transaction
    ).__addNonRequestToTransactionQueue(function createIndex (tx, args, success, failure) {
        const columnExists = idx && (idx.__deleted || idx.__recreated); // This check must occur here rather than earlier as properties may not have been set yet otherwise

        /** @type {{[key: string]: boolean}} */
        let indexValues = {};

        /**
         * @param {SQLTransaction} tx
         * @param {SQLError} err
         * @returns {void}
         */
        function error (tx, err) {
            failure(createDOMException('UnknownError', 'Could not create index "' + indexName + '"' + err.code + '::' + err.message, err));
        }

        /**
         * @param {SQLTransaction} tx
         * @returns {void}
         */
        function applyIndex (tx) {
            // Update the object store's index list
            IDBIndex.__updateIndexList(store, tx, function () {
                // Add index entries for all existing records
                tx.executeSql('SELECT "key", "value" FROM ' + util.escapeStoreNameForSQL(storeName), [], function (tx, data) {
                    if (CFG.DEBUG) { console.log('Adding existing ' + storeName + ' records to the ' + indexName + ' index'); }
                    addIndexEntry(0);

                    /**
                     * @param {Integer} i
                     * @returns {void}
                     */
                    function addIndexEntry (i) {
                        if (i < data.rows.length) {
                            try {
                                const value = Sca.decode(util.unescapeSQLiteResponse(data.rows.item(i).value));
                                const indexKey = Key.extractKeyValueDecodedFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Todo: Do we need this stricter error checking?
                                if (
                                    ('invalid' in indexKey && indexKey.invalid) ||
                                    ('failure' in indexKey && indexKey.failure)
                                ) { // Todo: Do we need invalid checks and should we instead treat these as being duplicates?
                                    throw new Error('Go to catch; ignore bad indexKey');
                                }
                                const indexKeyStr = /** @type {string} */ (
                                    Key.encode(indexKey.value, index.multiEntry)
                                );
                                if (index.unique) {
                                    if (indexValues[indexKeyStr]) {
                                        indexValues = {};
                                        failure(createDOMException(
                                            'ConstraintError',
                                            'Duplicate values already exist within the store'
                                        ));
                                        return;
                                    }
                                    indexValues[indexKeyStr] = true;
                                }

                                tx.executeSql(
                                    'UPDATE ' + util.escapeStoreNameForSQL(storeName) + ' SET ' +
                                        util.escapeIndexNameForSQL(indexName) + ' = ? WHERE "key" = ?',
                                    [util.escapeSQLiteStatement(indexKeyStr), data.rows.item(i).key],
                                    function () {
                                        addIndexEntry(i + 1);
                                    },
                                    /** @type {SQLStatementErrorCallback} */ (error)
                                );
                            } catch (err) {
                                // Not a valid value to insert into index, so just continue
                                addIndexEntry(i + 1);
                            }
                        } else {
                            delete index.__pendingCreate;
                            delete indexHandle.__pendingCreate;
                            if (index.__deleted) {
                                delete index.__deleted;
                                delete indexHandle.__deleted;
                                index.__recreated = true;
                                indexHandle.__recreated = true;
                            }
                            indexValues = {};
                            success(store);
                        }
                    }
                }, /** @type {SQLStatementErrorCallback} */ (error));
            }, /** @type {SQLStatementErrorCallback} */ (error));
        }

        const escapedStoreNameSQL = util.escapeStoreNameForSQL(storeName);
        const escapedIndexNameSQL = util.escapeIndexNameForSQL(index.name);

        /**
         * @param {SQLTransaction} tx
         * @returns {void}
         */
        function addIndexSQL (tx) {
            if (!CFG.useSQLiteIndexes) {
                applyIndex(tx);
                return;
            }
            tx.executeSql(
                'CREATE INDEX IF NOT EXISTS "' +
                    // The escaped index name must be unique among indexes in the whole database;
                    //    so we prefix with store name; as prefixed, will also not conflict with
                    //    index on `key`
                    // Avoid quotes and separate with special escape sequence
                    escapedStoreNameSQL.slice(1, -1) + '^5' + escapedIndexNameSQL.slice(1, -1) +
                    '" ON ' + escapedStoreNameSQL + '(' + escapedIndexNameSQL + ')',
                [],
                applyIndex,
                /** @type {SQLStatementErrorCallback} */ (error)
            );
        }

        if (columnExists) {
            // For a previously existing index, just update the index entries in the existing column;
            //   no need to add SQLite index to it either as should already exist
            applyIndex(tx);
        } else {
            // For a new index, add a new column to the object store, then apply the index
            const sql = ['ALTER TABLE', escapedStoreNameSQL, 'ADD', escapedIndexNameSQL, 'BLOB'].join(' ');
            if (CFG.DEBUG) { console.log(sql); }
            tx.executeSql(
                sql, [], addIndexSQL, /** @type {SQLStatementErrorCallback} */ (error)
            );
        }
    });
};

/**
 * Deletes an index from an object store.
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {IDBIndexFull} index
 * @returns {void}
 */
IDBIndex.__deleteIndex = function (store, index) {
    // Remove the index from the IDBObjectStore
    index.__pendingDelete = true;
    const indexHandle = store.__indexHandles[index.name];
    if (indexHandle) {
        indexHandle.__pendingDelete = true;
    }

    store.indexNames.splice(store.indexNames.indexOf(index.name), 1);

    // Remove the index in WebSQL
    const {transaction} = store;
    /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
        transaction
    ).__addNonRequestToTransactionQueue(function deleteIndex (tx, args, success, failure) {
        /**
         * @param {SQLTransaction} tx
         * @param {SQLError} err
         * @returns {void}
         */
        function error (tx, err) {
            failure(createDOMException('UnknownError', 'Could not delete index "' + index.name + '"', err));
        }

        /**
         * @returns {void}
         */
        function finishDeleteIndex () {
            // Update the object store's index list
            IDBIndex.__updateIndexList(store, tx, function (store) {
                delete index.__pendingDelete;
                delete index.__recreated;
                index.__deleted = true;
                if (indexHandle) {
                    indexHandle.__deleted = true;
                    delete indexHandle.__pendingDelete;
                }
                success(store);
            }, /** @type {SQLStatementErrorCallback} */ (error));
        }

        if (!CFG.useSQLiteIndexes) {
            finishDeleteIndex();
            return;
        }
        tx.executeSql(
            'DROP INDEX IF EXISTS ' +
                util.sqlQuote(
                    util.escapeStoreNameForSQL(store.name).slice(1, -1) + '^5' +
                    util.escapeIndexNameForSQL(index.name).slice(1, -1)
                ),
            [],
            finishDeleteIndex,
            /** @type {SQLStatementErrorCallback} */ (error)
        );
    });
};

/**
 * @typedef {{[key: string]: IDBIndexProperties}} IndexList
 */

/**
 * Updates index list for the given object store.
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {SQLTransaction} tx
 * @param {(store: IDBObjectStore) => void} success
 * @param {(
 *   tx: SQLTransaction,
 *   err: SQLError
 * ) => boolean} [failure]
 * @returns {void}
 */
IDBIndex.__updateIndexList = function (store, tx, success, failure) {
    /** @type {IndexList} **/
    const indexList = {};
    for (let i = 0; i < store.indexNames.length; i++) {
        const idx = store.__indexes[store.indexNames[i]];
        indexList[idx.name] = {
            columnName: idx.name,
            keyPath: idx.keyPath,
            optionalParams: {
                unique: idx.unique,
                multiEntry: idx.multiEntry
            },
            deleted: Boolean(idx.__deleted)
        };
    }

    if (CFG.DEBUG) { console.log('Updating the index list for ' + store.__currentName, indexList); }
    tx.executeSql('UPDATE __sys__ SET "indexList" = ? WHERE "name" = ?', [JSON.stringify(indexList), util.escapeSQLiteStatement(store.__currentName)], function () {
        success(store);
    }, /** @type {SQLStatementErrorCallback} */ (failure));
};

/**
 * @typedef {any|IDBKeyRange} Query
 */

/**
 * Retrieves index data for the given key.
 * @param {Query} range
 * @param {"value"|"key"|"count"} opType
 * @param {boolean} nullDisallowed
 * @param {number} [count]
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.__fetchIndexData = function (range, opType, nullDisallowed, count) {
    const me = this;
    if (count !== undefined) {
        count = util.enforceRange(count, 'unsigned long');
    }

    IDBIndex.__invalidStateIfDeleted(me);
    IDBObjectStore.__invalidStateIfDeleted(me.objectStore);
    if (me.objectStore.__deleted) {
        throw createDOMException('InvalidStateError', "This index's object store has been deleted");
    }
    IDBTransaction.__assertActive(me.objectStore.transaction);

    if (nullDisallowed && util.isNullish(range)) {
        throw createDOMException('DataError', 'No key or range was specified');
    }

    const fetchArgs = buildFetchIndexDataSQL(nullDisallowed, me, range, opType, false);
    return /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
        me.objectStore.transaction
    ).__addToTransactionQueue(function (...args) {
        executeFetchIndexData(
            count,
            ...fetchArgs,
            // @ts-expect-error It's ok
            ...args
        );
    }, undefined, me);
};

/**
 * Opens a cursor over the given key range.
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.openCursor = function (/* query, direction */) {
    const me = this;
    // eslint-disable-next-line prefer-rest-params -- API
    const [query, direction] = arguments;
    const cursor = IDBCursorWithValue.__createInstance(query, direction, me.objectStore, me, util.escapeIndexNameForSQLKeyColumn(me.name), 'value');
    me.__objectStore.__cursors.push(cursor);
    return cursor.__request;
};

/**
 * Opens a cursor over the given key range.  The cursor only includes key values, not data.
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.openKeyCursor = function (/* query, direction */) {
    const me = this;
    // eslint-disable-next-line prefer-rest-params -- API
    const [query, direction] = arguments;
    const cursor = IDBCursor.__createInstance(query, direction, me.objectStore, me, util.escapeIndexNameForSQLKeyColumn(me.name), 'key');
    me.__objectStore.__cursors.push(cursor);
    return cursor.__request;
};

/**
 *
 * @param {Query} query
 * @throws {TypeError}
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.get = function (query) {
    if (!arguments.length) { // Per https://heycam.github.io/webidl/
        throw new TypeError('A parameter was missing for `IDBIndex.get`.');
    }
    return this.__fetchIndexData(query, 'value', true);
};

/**
 *
 * @param {Query} query
 * @throws {TypeError}
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.getKey = function (query) {
    if (!arguments.length) { // Per https://heycam.github.io/webidl/
        throw new TypeError('A parameter was missing for `IDBIndex.getKey`.');
    }
    return this.__fetchIndexData(query, 'key', true);
};

/**
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.getAll = function (/* query, count */) {
    // eslint-disable-next-line prefer-rest-params -- API
    const [query, count] = arguments;
    return this.__fetchIndexData(query, 'value', false, count);
};

/**
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.getAllKeys = function (/* query, count */) {
    // eslint-disable-next-line prefer-rest-params -- API
    const [query, count] = arguments;
    return this.__fetchIndexData(query, 'key', false, count);
};

/**
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.count = function (/* query */) {
    const me = this;
    // eslint-disable-next-line prefer-rest-params -- API
    const query = arguments[0];
    // With the exception of needing to check whether the index has been
    //  deleted, we could, for greater spec parity (if not accuracy),
    //  just call:
    //  `return me.__objectStore.count(query);`

    if (util.instanceOf(query, IDBKeyRange)) { // Todo: Do we need this block?
        // We don't need to add to cursors array since has the count parameter which won't cache
        return IDBCursorWithValue.__createInstance(query, 'next', me.objectStore, me, util.escapeIndexNameForSQLKeyColumn(me.name), 'value', true).__request;
    }
    return me.__fetchIndexData(query, 'count', false);
};

/**
 *
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {string} oldName
 * @param {string} newName
 * @param {string[][]} colInfoToPreserveArr
 * @param {null|((
 *   tx: SQLTransaction,
 *   success: ((store: IDBObjectStore) => void)
 * ) => void)} cb
 * @this {IDBIndexFull}
 * @returns {void}
 */
IDBIndex.prototype.__renameIndex = function (store, oldName, newName, colInfoToPreserveArr = [], cb = null) {
    const newNameType = 'BLOB';
    const storeName = store.__currentName;
    const escapedStoreNameSQL = util.escapeStoreNameForSQL(storeName);
    const escapedNewIndexNameSQL = util.escapeIndexNameForSQL(newName);
    const escapedTmpStoreNameSQL = util.sqlQuote('tmp_' + util.escapeStoreNameForSQL(storeName).slice(1, -1));
    const colNamesToPreserve = colInfoToPreserveArr.map((colInfo) => colInfo[0]);
    const colInfoToPreserve = colInfoToPreserveArr.map((colInfo) => colInfo.join(' '));
    const listColInfoToPreserve = (colInfoToPreserve.length ? (colInfoToPreserve.join(', ') + ', ') : '');
    const listColsToPreserve = (colNamesToPreserve.length ? (colNamesToPreserve.join(', ') + ', ') : '');

    // We could adapt the approach at http://stackoverflow.com/a/8430746/271577
    //    to make the approach reusable without passing column names, but it is a bit fragile
    /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
        store.transaction
    ).__addNonRequestToTransactionQueue(function renameIndex (tx, args, success, error) {
        /**
         * @param {SQLTransaction} tx
         * @param {SQLError} err
         * @returns {void}
         */
        function sqlError (tx, err) {
            error(err);
        }
        /**
         * @returns {void}
         */
        function finish () {
            if (cb) {
                cb(tx, success);
                return;
            }
            success();
        }
        // See https://www.sqlite.org/lang_altertable.html#otheralter
        // We don't query for indexes as we already have the info
        // This approach has the advantage of auto-deleting indexes via the DROP TABLE
        const sql = 'CREATE TABLE ' + escapedTmpStoreNameSQL +
            '(' + listColInfoToPreserve + escapedNewIndexNameSQL + ' ' + newNameType + ')';
        if (CFG.DEBUG) { console.log(sql); }
        tx.executeSql(sql, [], function () {
            const sql = 'INSERT INTO ' + escapedTmpStoreNameSQL + '(' +
                listColsToPreserve + escapedNewIndexNameSQL +
                ') SELECT ' + listColsToPreserve + util.escapeIndexNameForSQL(oldName) + ' FROM ' + escapedStoreNameSQL;
            if (CFG.DEBUG) { console.log(sql); }
            tx.executeSql(sql, [], function () {
                const sql = 'DROP TABLE ' + escapedStoreNameSQL;
                if (CFG.DEBUG) { console.log(sql); }
                tx.executeSql(sql, [], function () {
                    const sql = 'ALTER TABLE ' + escapedTmpStoreNameSQL + ' RENAME TO ' + escapedStoreNameSQL;
                    if (CFG.DEBUG) { console.log(sql); }
                    tx.executeSql(sql, [], function (tx) {
                        if (!CFG.useSQLiteIndexes) {
                            finish();
                            return;
                        }
                        const indexCreations = colNamesToPreserve
                            .slice(2) // Doing `key` separately and no need for index on `value`
                            .map((escapedIndexNameSQL) => new SyncPromise(function (resolve, reject) {
                                const escapedIndexToRecreate = util.sqlQuote(
                                    escapedStoreNameSQL.slice(1, -1) + '^5' + escapedIndexNameSQL.slice(1, -1)
                                );
                                // const sql = 'DROP INDEX IF EXISTS ' + escapedIndexToRecreate;
                                // if (CFG.DEBUG) { console.log(sql); }
                                // tx.executeSql(sql, [], function () {
                                const sql = 'CREATE INDEX ' +
                                    escapedIndexToRecreate + ' ON ' + escapedStoreNameSQL + '(' + escapedIndexNameSQL + ')';
                                if (CFG.DEBUG) { console.log(sql); }
                                tx.executeSql(
                                    sql,
                                    [],
                                    resolve,
                                    /** @type {SQLStatementErrorCallback} */
                                    (function (tx, err) {
                                        reject(err);
                                    })
                                );
                                // }, function (tx, err) {
                                //    reject(err);
                                // });
                            }));
                        indexCreations.push(
                            new SyncPromise(function (resolve, reject) {
                                const escapedIndexToRecreate = util.sqlQuote('sk_' + escapedStoreNameSQL.slice(1, -1));
                                // Chrome erring here if not dropped first; Node does not
                                const sql = 'DROP INDEX IF EXISTS ' + escapedIndexToRecreate;
                                if (CFG.DEBUG) { console.log(sql); }
                                tx.executeSql(
                                    sql, [], function () {
                                        const sql = 'CREATE INDEX ' + escapedIndexToRecreate +
                                            ' ON ' + escapedStoreNameSQL + '("key")';
                                        if (CFG.DEBUG) { console.log(sql); }
                                        tx.executeSql(
                                            sql, [], resolve,
                                            /** @type {SQLStatementErrorCallback} */
                                            (function (tx, err) {
                                                reject(err);
                                            })
                                        );
                                    },
                                    /** @type {SQLStatementErrorCallback} */
                                    (function (tx, err) {
                                        reject(err);
                                    })
                                );
                            })
                        );
                        SyncPromise.all(indexCreations).then(
                            finish,
                            /** @type {(reason: any) => PromiseLike<never>} */
                            (error)
                        ).catch((err) => {
                            console.log('Index rename error');
                            throw err;
                        });
                    }, /** @type {SQLStatementErrorCallback} */ (sqlError));
                }, /** @type {SQLStatementErrorCallback} */ (sqlError));
            }, /** @type {SQLStatementErrorCallback} */ (sqlError));
        }, /** @type {SQLStatementErrorCallback} */ (sqlError));
    });
};

/**
 * @typedef {any} AnyValue
 */

Object.defineProperty(IDBIndex, Symbol.hasInstance, {
    /**
     * @param {AnyValue} obj
     * @returns {boolean}
     */
    value: (obj) => util.isObj(obj) &&
        'openCursor' in obj &&
        typeof obj.openCursor === 'function' &&
        'multiEntry' in obj &&
        typeof obj.multiEntry === 'boolean'
});

util.defineReadonlyOuterInterface(IDBIndex.prototype, readonlyProperties);
util.defineOuterInterface(IDBIndex.prototype, ['name']);

IDBIndex.prototype[Symbol.toStringTag] = 'IDBIndexPrototype';

Object.defineProperty(IDBIndex, 'prototype', {
    writable: false
});

/**
 * @param {number|null} count
 * @param {boolean} unboundedDisallowed
 * @param {IDBIndexFull} index
 * @param {boolean} hasKey
 * @param {import('./Key.js').Value|import('./Key.js').Key} range
 * @param {"value"|"key"|"count"} opType
 * @param {boolean} multiChecks
 * @param {string[]} sql
 * @param {string[]} sqlValues
 * @param {SQLTransaction} tx
 * @param {null|undefined} args
 * @param {(result: number|undefined|[]|AnyValue|AnyValue[]) => void} success
 * @param {(tx: SQLTransaction, err: SQLError) => void} error
 * @returns {void}
 */
function executeFetchIndexData (
    count, unboundedDisallowed, index, hasKey, range, opType,
    multiChecks, sql, sqlValues, tx, args, success, error
) {
    if (unboundedDisallowed) {
        count = 1;
    }
    if (count) {
        sql.push('LIMIT', String(count));
    }
    const isCount = opType === 'count';
    if (CFG.DEBUG) { console.log('Trying to fetch data for Index', sql.join(' '), sqlValues); }
    tx.executeSql(sql.join(' '), sqlValues, function (tx, data) {
        const records = [];
        let recordCount = 0;
        const decode = isCount
            ? () => { /* */ }
            : (opType === 'key'
                // eslint-disable-next-line @stylistic/operator-linebreak -- JSDoc
                ?
                /**
                 * @param {{
                 *   key: string
                 * }} record
                 * @returns {import('./Key.js').ValueType|undefined}
                 */
                (record) => {
                    // Key.convertValueToKey(record.key); // Already validated before storage
                    return Key.decode(util.unescapeSQLiteResponse(record.key));
                }
                // eslint-disable-next-line @stylistic/operator-linebreak -- JSDoc
                :
                /**
                 * @param {{
                 *   value: string
                 * }} record
                 * @returns {AnyValue}
                 */
                (record) => { // when opType is value
                    return Sca.decode(util.unescapeSQLiteResponse(record.value));
                });
        if (index.multiEntry) {
            const escapedIndexNameForKeyCol = util.escapeIndexNameForSQLKeyColumn(index.name);
            const encodedKey = Key.encode(range, index.multiEntry);
            for (let i = 0; i < data.rows.length; i++) {
                const row = data.rows.item(i);
                const rowKey = /** @type {import('./Key.js').ValueTypeArray} */ (
                    Key.decode(row[escapedIndexNameForKeyCol])
                );
                let record;
                if (hasKey && (
                    (multiChecks && range.some(
                        /**
                         * @param {string} check
                         * @returns {boolean}
                         */
                        (check) => rowKey.includes(check)
                    )) || // More precise than our SQL
                    Key.isMultiEntryMatch(
                        // Added `JSON.stringify` as was having problems with
                        //        `JSON.stringify` encoding added to nested
                        //        array keys
                        JSON.stringify(encodedKey).slice(1, -1),
                        row[escapedIndexNameForKeyCol]
                    )
                )) {
                    recordCount++;
                    record = row;
                } else if (!hasKey && !multiChecks) {
                    if (rowKey !== undefined) {
                        recordCount += (Array.isArray(rowKey) ? rowKey.length : 1);
                        record = row;
                    }
                }
                if (record) {
                    records.push(decode(record));
                    if (unboundedDisallowed) {
                        break;
                    }
                }
            }
        } else {
            for (let i = 0; i < data.rows.length; i++) {
                const record = data.rows.item(i);
                if (record) {
                    records.push(decode(record));
                }
            }
            recordCount = records.length;
        }
        if (isCount) {
            success(recordCount);
        } else if (recordCount === 0) {
            success(unboundedDisallowed ? undefined : []);
        } else {
            success(unboundedDisallowed ? records[0] : records);
        }
    }, /** @type {SQLStatementErrorCallback} */ (error));
}

/**
 * @param {boolean} nullDisallowed
 * @param {IDBIndexFull} index
 * @param {import('./Key.js').Value|import('./Key.js').Key} range
 * @param {"value"|"key"|"count"} opType
 * @param {boolean} multiChecks
 * @returns {[
 *   nullDisallowed: boolean,
 *   index: IDBIndexFull,
 *   hasRange: boolean,
 *   range: import('./Key.js').Value|import('./Key.js').Key,
 *   opType: "value"|"key"|"count",
 *   multiChecks: boolean,
 *   sql: string[],
 *   sqlValues: string[]
 * ]}
 */
function buildFetchIndexDataSQL (
    nullDisallowed, index, range, opType, multiChecks
) {
    const hasRange = nullDisallowed || !util.isNullish(range);
    const col = opType === 'count' ? 'key' : opType; // It doesn't matter which column we use for 'count' as long as it is valid
    const sql = [
        'SELECT', util.sqlQuote(col) + (
            index.multiEntry ? ', ' + util.escapeIndexNameForSQL(index.name) : ''
        ),
        'FROM', util.escapeStoreNameForSQL(index.objectStore.__currentName),
        'WHERE', util.escapeIndexNameForSQL(index.name), 'NOT NULL'
    ];

    /** @type {string[]} */
    const sqlValues = [];
    if (hasRange) {
        if (multiChecks) {
            sql.push('AND (');
            /** @type {import('./Key.js').KeyPathArray} */ (
                range
            ).forEach((innerKey, i) => {
                if (i > 0) { sql.push('OR'); }
                sql.push(util.escapeIndexNameForSQL(index.name), "LIKE ? ESCAPE '^' ");
                sqlValues.push('%' + util.sqlLIKEEscape(
                    /** @type {string} */ (Key.encode(innerKey, index.multiEntry))
                ) + '%');
            });
            sql.push(')');
        } else if (index.multiEntry) {
            sql.push('AND', util.escapeIndexNameForSQL(index.name), "LIKE ? ESCAPE '^'");

            if (Array.isArray(range)) {
                // Todo: For nesting deeper than one level, we probably need to
                //         run `JSON.stringify` again
                sqlValues.push('%' + util.sqlLIKEEscape(
                    JSON.stringify(
                    /** @type {string} */ (Key.encode(range, index.multiEntry))
                    ).slice(1, -1)
                ) + '%');
            } else {
                sqlValues.push('%' + util.sqlLIKEEscape(
                /** @type {string} */ (Key.encode(range, index.multiEntry))
                ) + '%');
            }
        } else {
            const convertedRange = convertValueToKeyRange(range, nullDisallowed);
            setSQLForKeyRange(convertedRange, util.escapeIndexNameForSQL(index.name), sql, sqlValues, true, false);
        }
    }
    return [nullDisallowed, index, hasRange, range, opType, multiChecks, sql, sqlValues];
}

// eslint-disable-next-line unicorn/no-named-default -- Had some reason
export {buildFetchIndexDataSQL, executeFetchIndexData, IDBIndex, IDBIndex as default};

import {createDOMException} from './DOMException';
import {IDBCursor, IDBCursorWithValue} from './IDBCursor';
import * as util from './util';
import * as Key from './Key';
import {setSQLForKeyRange, IDBKeyRange, convertValueToKeyRange} from './IDBKeyRange';
import IDBTransaction from './IDBTransaction';
import * as Sca from './Sca';
import CFG from './CFG';
import IDBObjectStore from './IDBObjectStore';

const readonlyProperties = ['objectStore', 'keyPath', 'multiEntry', 'unique'];

/**
 * IDB Index
 * http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
 * @param {IDBObjectStore} store
 * @param {IDBIndexProperties} indexProperties
 * @constructor
 */
function IDBIndex () {
    throw new TypeError('Illegal constructor');
}
const IDBIndexAlias = IDBIndex;
IDBIndex.__createInstance = function (store, indexProperties) {
    function IDBIndex () {
        const me = this;
        me[Symbol.toStringTag] = 'IDBIndex';
        util.defineReadonlyProperties(me, readonlyProperties);
        me.__objectStore = store;
        me.__name = me.__originalName = indexProperties.columnName;
        me.__keyPath = Array.isArray(indexProperties.keyPath) ? indexProperties.keyPath.slice() : indexProperties.keyPath;
        const optionalParams = indexProperties.optionalParams;
        me.__multiEntry = !!(optionalParams && optionalParams.multiEntry);
        me.__unique = !!(optionalParams && optionalParams.unique);
        me.__deleted = !!indexProperties.__deleted;
        me.__objectStore.__cursors = indexProperties.cursors || [];
        Object.defineProperty(me, 'name', {
            enumerable: false,
            configurable: false,
            get: function () {
                return this.__name;
            },
            set: function (newName) {
                const me = this;
                const oldName = me.name;
                IDBTransaction.__assertVersionChange(me.objectStore.transaction);
                IDBTransaction.__assertActive(me.objectStore.transaction);
                IDBIndexAlias.__invalidStateIfDeleted(me);
                IDBObjectStore.__invalidStateIfDeleted(me);
                if (newName === oldName) {
                    return;
                }
                if (me.objectStore.__indexes[newName] && !me.objectStore.__indexes[newName].__deleted) {
                    throw createDOMException('ConstraintError', 'Index "' + newName + '" already exists on ' + me.objectStore.name);
                }

                delete me.objectStore.__indexes[me.name];
                me.objectStore.indexNames.splice(me.objectStore.indexNames.indexOf(me.name), 1);
                me.objectStore.__indexes[newName] = me;
                me.objectStore.indexNames.push(newName);

                me.__name = newName;
                // Todo: Add pending flag to delay queries against this index until renamed in SQLite?
                const colInfoToPreserveArr = [
                    ['key', 'BLOB ' + (me.objectStore.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY')],
                    ['value', 'BLOB']
                ];
                me.__renameIndex(me.objectStore, oldName, newName, colInfoToPreserveArr);
            }
        });
    }
    IDBIndex.prototype = IDBIndexAlias.prototype;
    return new IDBIndex();
};

IDBIndex.__invalidStateIfDeleted = function (index, msg) {
    if (index.__deleted || index.__pendingDelete || (index.__pendingCreate && index.objectStore.transaction.__errored)) {
        throw createDOMException('InvalidStateError', msg || 'This index has been deleted');
    }
};

/**
 * Clones an IDBIndex instance for a different IDBObjectStore instance.
 * @param {IDBIndex} index
 * @param {IDBObjectStore} store
 * @protected
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
    ['__pendingCreate', '__pendingDelete', '__deleted', '__originalName', '__recreated'].forEach((p) => {
        idx[p] = index[p];
    });
    return idx;
};

/**
 * Creates a new index on an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @returns {IDBIndex}
 * @protected
 */
IDBIndex.__createIndex = function (store, index) {
    const idx = store.__indexes[index.name];

    // Add the index to the IDBObjectStore
    index.__pendingCreate = true;

    store.indexNames.push(index.name);
    store.__indexes[index.name] = index; // We add to indexes as needs to be available, e.g., if there is a subsequent deleteIndex call
    store.__indexHandles[index.name] = index;

    // Create the index in WebSQL
    const transaction = store.transaction;
    transaction.__addNonRequestToTransactionQueue(function createIndex (tx, args, success, failure) {
        const columnExists = idx && (idx.__deleted || idx.__recreated); // This check must occur here rather than earlier as properties may not have been set yet otherwise
        let indexValues = {};

        function error (tx, err) {
            failure(createDOMException('UnknownError', 'Could not create index "' + index.name + '"' + err.code + '::' + err.message, err));
        }

        function applyIndex (tx) {
            // Update the object store's index list
            IDBIndex.__updateIndexList(store, tx, function () {
                // Add index entries for all existing records
                tx.executeSql('SELECT "key", "value" FROM ' + util.escapeStoreNameForSQL(store.name), [], function (tx, data) {
                    CFG.DEBUG && console.log('Adding existing ' + store.name + ' records to the ' + index.name + ' index');
                    addIndexEntry(0);

                    function addIndexEntry (i) {
                        if (i < data.rows.length) {
                            try {
                                const value = Sca.decode(util.unescapeSQLiteResponse(data.rows.item(i).value));
                                let indexKey = Key.extractKeyValueDecodedFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Todo: Do we need this stricter error checking?
                                if (indexKey.invalid || indexKey.failure) { // Todo: Do we need invalid checks and should we instead treat these as being duplicates?
                                    throw new Error('Go to catch; ignore bad indexKey');
                                }
                                indexKey = Key.encode(indexKey.value, index.multiEntry);
                                if (index.unique) {
                                    if (indexValues[indexKey]) {
                                        indexValues = {};
                                        failure(createDOMException(
                                            'ConstraintError',
                                            'Duplicate values already exist within the store'
                                        ));
                                        return;
                                    }
                                    indexValues[indexKey] = true;
                                }

                                tx.executeSql(
                                    'UPDATE ' + util.escapeStoreNameForSQL(store.name) + ' SET ' +
                                        util.escapeIndexNameForSQL(index.name) + ' = ? WHERE "key" = ?',
                                    [util.escapeSQLiteStatement(indexKey), data.rows.item(i).key],
                                    function (tx, data) {
                                        addIndexEntry(i + 1);
                                    }, error
                                );
                            } catch (e) {
                                // Not a valid value to insert into index, so just continue
                                addIndexEntry(i + 1);
                            }
                        } else {
                            delete index.__pendingCreate;
                            if (index.__deleted) {
                                delete index.__deleted;
                                index.__recreated = true;
                            }
                            indexValues = {};
                            success(store);
                        }
                    }
                }, error);
            }, error);
        }

        if (columnExists) {
            // For a previously existing index, just update the index entries in the existing column
            applyIndex(tx);
        } else {
            // For a new index, add a new column to the object store, then apply the index
            const sql = ['ALTER TABLE', util.escapeStoreNameForSQL(store.name), 'ADD', util.escapeIndexNameForSQL(index.name), 'BLOB'].join(' ');
            CFG.DEBUG && console.log(sql);
            tx.executeSql(sql, [], applyIndex, error);
        }
    }, undefined, store);
};

/**
 * Deletes an index from an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @protected
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
    const transaction = store.transaction;
    transaction.__addNonRequestToTransactionQueue(function deleteIndex (tx, args, success, failure) {
        function error (tx, err) {
            failure(createDOMException('UnknownError', 'Could not delete index "' + index.name + '"', err));
        }

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
        }, error);
    }, undefined, store);
};

/**
 * Updates index list for the given object store.
 * @param {IDBObjectStore} store
 * @param {object} tx
 * @param {function} success
 * @param {function} failure
 */
IDBIndex.__updateIndexList = function (store, tx, success, failure) {
    const indexList = {};
    for (let i = 0; i < store.indexNames.length; i++) {
        const idx = store.__indexes[store.indexNames[i]];
        /** @type {IDBIndexProperties} **/
        indexList[idx.name] = {
            columnName: idx.name,
            keyPath: idx.keyPath,
            optionalParams: {
                unique: idx.unique,
                multiEntry: idx.multiEntry
            },
            deleted: !!idx.deleted
        };
    }

    CFG.DEBUG && console.log('Updating the index list for ' + store.name, indexList);
    tx.executeSql('UPDATE __sys__ SET "indexList" = ? WHERE "name" = ?', [JSON.stringify(indexList), util.escapeSQLiteStatement(store.name)], function () {
        success(store);
    }, failure);
};

/**
 * Retrieves index data for the given key
 * @param {*|IDBKeyRange} range
 * @param {string} opType
 * @param {boolean} nullDisallowed
 * @param {number} count
 * @returns {IDBRequest}
 * @private
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

    if (nullDisallowed && range == null) {
        throw createDOMException('DataError', 'No key or range was specified');
    }

    const fetchArgs = buildFetchIndexDataSQL(nullDisallowed, me, range, opType, false);
    return me.objectStore.transaction.__addToTransactionQueue(function (...args) {
        executeFetchIndexData(count, ...fetchArgs, ...args);
    }, undefined, me);
};

/**
 * Opens a cursor over the given key range.
 * @param {*|IDBKeyRange} query
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openCursor = function (/* query, direction */) {
    const me = this;
    const [query, direction] = arguments;
    const cursor = IDBCursorWithValue.__createInstance(query, direction, me.objectStore, me, util.escapeIndexNameForSQLKeyColumn(me.name), 'value');
    me.__objectStore.__cursors.push(cursor);
    return cursor.__req;
};

/**
 * Opens a cursor over the given key range.  The cursor only includes key values, not data.
 * @param {*|IDBKeyRange} query
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openKeyCursor = function (/* query, direction */) {
    const me = this;
    const [query, direction] = arguments;
    const cursor = IDBCursor.__createInstance(query, direction, me.objectStore, me, util.escapeIndexNameForSQLKeyColumn(me.name), 'key');
    me.__objectStore.__cursors.push(cursor);
    return cursor.__req;
};

IDBIndex.prototype.get = function (query) {
    if (!arguments.length) { // Per https://heycam.github.io/webidl/
        throw new TypeError('A parameter was missing for `IDBIndex.get`.');
    }
    return this.__fetchIndexData(query, 'value', true);
};

IDBIndex.prototype.getKey = function (query) {
    if (!arguments.length) { // Per https://heycam.github.io/webidl/
        throw new TypeError('A parameter was missing for `IDBIndex.getKey`.');
    }
    return this.__fetchIndexData(query, 'key', true);
};

IDBIndex.prototype.getAll = function (/* query, count */) {
    const [query, count] = arguments;
    return this.__fetchIndexData(query, 'value', false, count);
};

IDBIndex.prototype.getAllKeys = function (/* query, count */) {
    const [query, count] = arguments;
    return this.__fetchIndexData(query, 'key', false, count);
};

IDBIndex.prototype.count = function (/* query */) {
    const me = this;
    const query = arguments[0];
    // With the exception of needing to check whether the index has been
    //  deleted, we could, for greater spec parity (if not accuracy),
    //  just call:
    //  `return me.__objectStore.count(query);`

    if (util.instanceOf(query, IDBKeyRange)) { // Todo: Do we need this block?
        // We don't need to add to cursors array since has the count parameter which won't cache
        return IDBCursorWithValue.__createInstance(query, 'next', me.objectStore, me, util.escapeIndexNameForSQLKeyColumn(me.name), 'value', true).__req;
    }
    return me.__fetchIndexData(query, 'count', false);
};

IDBIndex.prototype.__renameIndex = function (store, oldName, newName, colInfoToPreserveArr = []) {
    const newNameType = 'BLOB';
    const storeName = store.name;
    const escapedStoreNameSQL = util.escapeStoreNameForSQL(storeName);
    const colNamesToPreserve = colInfoToPreserveArr.map((colInfo) => colInfo[0]);
    const colInfoToPreserve = colInfoToPreserveArr.map((colInfo) => colInfo.join(' '));
    const listColInfoToPreserve = (colInfoToPreserve.length ? (colInfoToPreserve.join(', ') + ', ') : '');
    const listColsToPreserve = (colNamesToPreserve.length ? (colNamesToPreserve.join(', ') + ', ') : '');

    // We could adapt the approach at http://stackoverflow.com/a/8430746/271577
    //    to make the approach reusable without passing column names, but it is a bit fragile
    store.transaction.__addNonRequestToTransactionQueue(function renameIndex (tx, args, success, error) {
        const sql = 'ALTER TABLE ' + escapedStoreNameSQL + ' RENAME TO tmp_' + escapedStoreNameSQL;
        tx.executeSql(sql, [], function (tx, data) {
            const sql = 'CREATE TABLE ' + escapedStoreNameSQL + '(' + listColInfoToPreserve + util.escapeIndexNameForSQL(newName) + ' ' + newNameType + ')';
            tx.executeSql(sql, [], function (tx, data) {
                const sql = 'INSERT INTO ' + escapedStoreNameSQL + '(' +
                    listColsToPreserve +
                    util.escapeIndexNameForSQL(newName) +
                    ') SELECT ' + listColsToPreserve + util.escapeIndexNameForSQL(oldName) + ' FROM tmp_' + escapedStoreNameSQL;
                tx.executeSql(sql, [], function (tx, data) {
                    const sql = 'DROP TABLE tmp_' + escapedStoreNameSQL;
                    tx.executeSql(sql, [], function (tx, data) {
                        success();
                    }, function (tx, err) {
                        error(err);
                    });
                }, function (tx, err) {
                    error(err);
                });
            });
        }, function (tx, err) {
            error(err);
        });
    });
};

Object.defineProperty(IDBIndex, Symbol.hasInstance, {
    value: obj => util.isObj(obj) && typeof obj.openCursor === 'function' && typeof obj.multiEntry === 'boolean'
});

readonlyProperties.forEach((prop) => {
    Object.defineProperty(IDBIndex.prototype, prop, {
        enumerable: true,
        configurable: true,
        get: function () {
            throw new TypeError('Illegal invocation');
        }
    });
});
Object.defineProperty(IDBIndex.prototype, 'name', {
    enumerable: true,
    configurable: true,
    get: function () {
        throw new TypeError('Illegal invocation');
    },
    set: function (val) {
        throw new TypeError('Illegal invocation');
    }
});
IDBIndex.prototype[Symbol.toStringTag] = 'IDBIndexPrototype';

Object.defineProperty(IDBIndex, 'prototype', {
    writable: false
});

function executeFetchIndexData (count, unboundedDisallowed, index, hasKey, range, opType, multiChecks, sql, sqlValues, tx, args, success, error) {
    if (unboundedDisallowed) {
        count = 1;
    }
    if (count) {
        sql.push('LIMIT', count);
    }
    const isCount = opType === 'count';
    CFG.DEBUG && console.log('Trying to fetch data for Index', sql.join(' '), sqlValues);
    tx.executeSql(sql.join(' '), sqlValues, function (tx, data) {
        const records = [];
        let recordCount = 0;
        const decode = isCount ? () => {} : (opType === 'key' ? (record) => {
            // Key.convertValueToKey(record.key); // Already validated before storage
            return Key.decode(util.unescapeSQLiteResponse(record.key));
        } : (record) => { // when opType is value
            return Sca.decode(util.unescapeSQLiteResponse(record.value));
        });
        if (index.multiEntry) {
            const escapedIndexNameForKeyCol = util.escapeIndexNameForSQLKeyColumn(index.name);
            const encodedKey = Key.encode(range, index.multiEntry);
            for (let i = 0; i < data.rows.length; i++) {
                const row = data.rows.item(i);
                const rowKey = Key.decode(row[escapedIndexNameForKeyCol]);
                let record;
                if (hasKey && (
                    (multiChecks && range.some((check) => rowKey.includes(check))) || // More precise than our SQL
                    Key.isMultiEntryMatch(encodedKey, row[escapedIndexNameForKeyCol])
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
    }, error);
}

function buildFetchIndexDataSQL (nullDisallowed, index, range, opType, multiChecks) {
    const hasRange = nullDisallowed || range != null;
    const col = opType === 'count' ? 'key' : opType; // It doesn't matter which column we use for 'count' as long as it is valid
    const sql = [
        'SELECT', util.sqlQuote(col) + (
            index.multiEntry ? ', ' + util.escapeIndexNameForSQL(index.name) : ''
        ),
        'FROM', util.escapeStoreNameForSQL(index.objectStore.name),
        'WHERE', util.escapeIndexNameForSQL(index.name), 'NOT NULL'
    ];
    const sqlValues = [];
    if (hasRange) {
        if (multiChecks) {
            sql.push('AND (');
            range.forEach((innerKey, i) => {
                if (i > 0) sql.push('OR');
                sql.push(util.escapeIndexNameForSQL(index.name), "LIKE ? ESCAPE '^' ");
                sqlValues.push('%' + util.sqlLIKEEscape(Key.encode(innerKey, index.multiEntry)) + '%');
            });
            sql.push(')');
        } else if (index.multiEntry) {
            sql.push('AND', util.escapeIndexNameForSQL(index.name), "LIKE ? ESCAPE '^'");
            sqlValues.push('%' + util.sqlLIKEEscape(Key.encode(range, index.multiEntry)) + '%');
        } else {
            const convertedRange = convertValueToKeyRange(range, nullDisallowed);
            setSQLForKeyRange(convertedRange, util.escapeIndexNameForSQL(index.name), sql, sqlValues, true, false);
        }
    }
    return [nullDisallowed, index, hasRange, range, opType, multiChecks, sql, sqlValues];
}

export {buildFetchIndexDataSQL, executeFetchIndexData, IDBIndex, IDBIndex as default};

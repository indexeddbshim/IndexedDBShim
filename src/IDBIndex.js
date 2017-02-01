import {createDOMException} from './DOMException';
import {IDBCursor, IDBCursorWithValue} from './IDBCursor';
import * as util from './util';
import Key from './Key';
import {setSQLForRange, IDBKeyRange} from './IDBKeyRange';
import IDBTransaction from './IDBTransaction';
import Sca from './Sca';
import CFG from './CFG';

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
                if (me.__deleted) {
                    throw createDOMException('InvalidStateError', 'This index has been deleted');
                }
                if (me.objectStore.__deleted) {
                    throw createDOMException('InvalidStateError', "This index's object store has been deleted");
                }
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
    // idx.__deleted = index.__deleted;
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
    const columnExists = idx && idx.__deleted;

    // Add the index to the IDBObjectStore
    index.__pending = true;
    store.__indexes[index.name] = index;
    store.indexNames.push(index.name);

    // Create the index in WebSQL
    const transaction = store.transaction;
    transaction.__addNonRequestToTransactionQueue(function createIndex (tx, args, success, failure) {
        let indexValues = {};

        function error (tx, err) {
            failure(createDOMException('UnknownError', 'Could not create index "' + index.name + '"', err));
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
                                let indexKey = Key.evaluateKeyPathOnValue(value, index.keyPath, index.multiEntry);
                                indexKey = Key.encode(indexKey, index.multiEntry);
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
                                        util.escapeIndexNameForSQL(index.name) + ' = ? WHERE key = ?',
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
                            delete index.__pending;
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
    store.__indexes[index.name].__deleted = true;
    store.indexNames.splice(store.indexNames.indexOf(index.name), 1);

    // Remove the index in WebSQL
    const transaction = store.transaction;
    transaction.__addNonRequestToTransactionQueue(function deleteIndex (tx, args, success, failure) {
        function error (tx, err) {
            failure(createDOMException('UnknownError', 'Could not delete index "' + index.name + '"', err));
        }

        // Update the object store's index list
        IDBIndex.__updateIndexList(store, tx, success, error);
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
    tx.executeSql('UPDATE __sys__ SET indexList = ? WHERE name = ?', [JSON.stringify(indexList), util.escapeSQLiteStatement(store.name)], function () {
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
    const hasUnboundedRange = !nullDisallowed && range == null;

    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This index has been deleted');
    }
    if (me.objectStore.__deleted) {
        throw createDOMException('InvalidStateError', "This index's object store has been deleted");
    }
    IDBTransaction.__assertActive(me.objectStore.transaction);

    if (nullDisallowed && range == null) {
        throw createDOMException('DataError', 'No key or range was specified');
    }

    const fetchArgs = fetchIndexData(me, !hasUnboundedRange, range, opType, false);
    return me.objectStore.transaction.__addToTransactionQueue(function (...args) {
        executeFetchIndexData(nullDisallowed, count, ...fetchArgs, ...args);
    }, undefined, me);
};

/**
 * Opens a cursor over the given key range.
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openCursor = function (/* range, direction */) {
    const me = this;
    const [range, direction] = arguments;
    const cursor = IDBCursorWithValue.__createInstance(range, direction, me.objectStore, me, util.escapeIndexNameForKeyColumn(me.name), 'value');
    me.__objectStore.__cursors.push(cursor);
    return cursor.__req;
};

/**
 * Opens a cursor over the given key range.  The cursor only includes key values, not data.
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openKeyCursor = function (/* range, direction */) {
    const me = this;
    const [range, direction] = arguments;
    const cursor = IDBCursor.__createInstance(range, direction, me.objectStore, me, util.escapeIndexNameForKeyColumn(me.name), 'key');
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
    let query = arguments[0];
    // With the exception of needing to check whether the index has been
    //  deleted, we could, for greater spec parity (if not accuracy),
    //  just call:
    //  `return me.__objectStore.count(query);`

    // key is optional
    if (util.instanceOf(query, IDBKeyRange)) {
        if (!query.toString() !== '[object IDBKeyRange]') {
            query = IDBKeyRange.__createInstance(query.lower, query.upper, query.lowerOpen, query.upperOpen);
        }
        // We don't need to add to cursors array since has the count parameter which won't cache
        return IDBCursorWithValue.__createInstance(query, 'next', me.objectStore, me, util.escapeIndexNameForKeyColumn(me.name), 'value', true).__req;
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

function executeFetchIndexData (unboundedDisallowed, count, index, hasKey, encodedKey, opType, multiChecks, sql, sqlValues, tx, args, success, error) {
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
            const escapedIndexNameForKeyCol = util.escapeIndexNameForKeyColumn(index.name);
            for (let i = 0; i < data.rows.length; i++) {
                const row = data.rows.item(i);
                const rowKey = Key.decode(row[escapedIndexNameForKeyCol]);
                let record;
                if (hasKey && (
                    (multiChecks && encodedKey.some((check) => rowKey.includes(check))) || // More precise than our SQL
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

function fetchIndexData (index, hasRange, range, opType, multiChecks) {
    const col = opType === 'count' ? 'key' : opType; // It doesn't matter which column we use for 'count' as long as it is valid
    const sql = ['SELECT ' + util.quote(col) + (index.multiEntry ? ', ' + util.escapeIndexNameForSQL(index.name) : '') +
        ' FROM', util.escapeStoreNameForSQL(index.objectStore.name), 'WHERE', util.escapeIndexNameForSQL(index.name), 'NOT NULL'];
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
            range = Key.encode(range, index.multiEntry);
            sqlValues.push('%' + util.sqlLIKEEscape(range) + '%');
        } else {
            if (util.instanceOf(range, IDBKeyRange)) {
                // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
                if (!range.toString() !== '[object IDBKeyRange]') {
                    range = IDBKeyRange.__createInstance(range.lower, range.upper, range.lowerOpen, range.upperOpen);
                }
            } else {
                range = IDBKeyRange.only(range);
            }
            setSQLForRange(range, util.escapeIndexNameForSQL(index.name), sql, sqlValues, true, false);
        }
    }
    return [index, hasRange, range, opType, multiChecks, sql, sqlValues];
}

export {fetchIndexData, executeFetchIndexData, IDBIndex, IDBIndex as default};

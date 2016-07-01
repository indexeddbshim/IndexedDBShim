import {IDBRequest} from './IDBRequest.js';
import {createDOMException} from './DOMException.js';
import {setSQLForRange, IDBKeyRange} from './IDBKeyRange.js';
import {cmp} from './IDBFactory.js';
import * as util from './util.js';
import Key from './Key.js';
import Sca from './Sca.js';
import IDBIndex from './IDBIndex.js';
import CFG from './cfg.js';

/**
 * The IndexedDB Cursor Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @param {IDBObjectStore} store
 * @param {IDBObjectStore|IDBIndex} source
 * @param {string} keyColumnName
 * @param {string} valueColumnName
 * @param {boolean} count
 */
function IDBCursor (range, direction, store, source, keyColumnName, valueColumnName, count, reqSource) {
    // Calling openCursor on an index or objectstore with null is allowed but we treat it as undefined internally
    IDBTransaction.__assertActive(store.transaction);
    if (range === null) {
        range = undefined;
    }
    if (util.instanceOf(range, IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!range.toString() !== '[object IDBKeyRange]') {
            range = new IDBKeyRange(range.lower, range.upper, range.lowerOpen, range.upperOpen);
        }
    } else if (range !== undefined) {
        range = new IDBKeyRange(range, range, false, false);
    }
    if (direction !== undefined && !(['next', 'prev', 'nextunique', 'prevunique'].includes(direction))) {
        throw new TypeError(direction + 'is not a valid cursor direction');
    }

    Object.defineProperties(this, {
        // Babel is not respecting default writable false here, so make explicit
        source: {writable: false, value: source},
        direction: {writable: false, value: direction || 'next'}
    });
    this.__key = undefined;
    this.__primaryKey = undefined;

    this.__store = store;
    this.__range = range;
    this.__req = new IDBRequest();
    this.__req.__source = reqSource !== undefined ? reqSource : this;
    this.__req.__transaction = this.__store.transaction;
    this.__keyColumnName = keyColumnName;
    this.__valueColumnName = valueColumnName;
    this.__keyOnly = valueColumnName === 'key';
    this.__valueDecoder = this.__keyOnly ? Key : Sca;
    this.__count = count;
    this.__offset = -1; // Setting this to -1 as continue will set it to 0 anyway
    this.__lastKeyContinued = undefined; // Used when continuing with a key
    this.__indexSource = util.instanceOf(source, IDBIndex);
    this.__multiEntryIndex = this.__indexSource ? source.multiEntry : false;
    this.__unique = this.direction.includes('unique');

    if (range !== undefined) {
        // Encode the key range and cache the encoded values, so we don't have to re-encode them over and over
        range.__lowerCached = range.lower !== undefined && Key.encode(range.lower, this.__multiEntryIndex);
        range.__upperCached = range.upper !== undefined && Key.encode(range.upper, this.__multiEntryIndex);
    }
    this.__gotValue = true;
    this['continue']();
}

IDBCursor.prototype.__find = function (...args /* key, tx, success, error, recordsToLoad */) {
    if (this.__multiEntryIndex) {
        this.__findMultiEntry(...args);
    } else {
        this.__findBasic(...args);
    }
};

IDBCursor.prototype.__findBasic = function (key, tx, success, error, recordsToLoad) {
    recordsToLoad = recordsToLoad || 1;

    const me = this;
    const quotedKeyColumnName = util.quote(me.__keyColumnName);
    let sql = ['SELECT * FROM', util.quote('s_' + me.__store.name)];
    const sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    setSQLForRange(me.__range, quotedKeyColumnName, sql, sqlValues, true, true);
    if (key !== undefined) {
        me.__lastKeyContinued = key;
        me.__offset = 0;
    }
    if (me.__lastKeyContinued !== undefined) {
        sql.push('AND', quotedKeyColumnName, '>= ?');
        Key.validate(me.__lastKeyContinued);
        sqlValues.push(Key.encode(me.__lastKeyContinued));
    }

    // Determine the ORDER BY direction based on the cursor.
    if (!me.__count) {
        const direction = ['prev', 'prevunique'].includes(me.direction) ? 'DESC' : 'ASC';

        // 1. Sort by key
        sql.push('ORDER BY', quotedKeyColumnName, direction); // Todo: Any reason for this first sorting?

        // 2. Sort by primaryKey (if defined and not unique)
        if (!me.__unique && me.__keyColumnName !== 'key') { // Avoid adding 'key' twice
            sql.push(',', util.quote('key'), direction);
        }

        // 3. Sort by position (if defined)

        if (!me.__unique && me.__indexSource) {
            // 4. Sort by object store position (if defined and not unique)
            sql.push(',', util.quote(me.__valueColumnName), direction);
        }
        sql.push('LIMIT', recordsToLoad, 'OFFSET', me.__offset);
    }
    sql = sql.join(' ');
    CFG.DEBUG && console.log(sql, sqlValues);

    me.__prefetchedData = null;
    me.__prefetchedIndex = 0;
    tx.executeSql(sql, sqlValues, function (tx, data) {
        if (me.__count) {
            success(undefined, data.rows.length, undefined);
        } else if (data.rows.length > 1) {
            me.__prefetchedData = data.rows;
            me.__prefetchedIndex = 0;
            CFG.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for cursor');
            me.__decode(data.rows.item(0), success);
        } else if (data.rows.length === 1) {
            me.__decode(data.rows.item(0), success);
        } else {
            CFG.DEBUG && console.log('Reached end of cursors');
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        CFG.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
        error(err);
    });
};

IDBCursor.prototype.__findMultiEntry = function (key, tx, success, error) {
    const me = this;

    if (me.__prefetchedData && me.__prefetchedData.length === me.__prefetchedIndex) {
        CFG.DEBUG && console.log('Reached end of multiEntry cursor');
        success(undefined, undefined, undefined);
        return;
    }

    const quotedKeyColumnName = util.quote(me.__keyColumnName);
    let sql = ['SELECT * FROM', util.quote('s_' + me.__store.name)];
    const sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && (me.__range.lower !== undefined && me.__range.upper !== undefined)) {
        if (me.__range.upper.indexOf(me.__range.lower) === 0) {
            sql.push('AND', quotedKeyColumnName, "LIKE ? ESCAPE '^'");
            sqlValues.push('%' + util.sqlLIKEEscape(me.__range.__lowerCached.slice(0, -1)) + '%');
        }
    }
    if (key !== undefined) {
        me.__lastKeyContinued = key;
        me.__offset = 0;
    }
    if (me.__lastKeyContinued !== undefined) {
        sql.push('AND', quotedKeyColumnName, '>= ?');
        Key.validate(me.__lastKeyContinued);
        sqlValues.push(Key.encode(me.__lastKeyContinued));
    }

    if (!me.__count) {
        // Determine the ORDER BY direction based on the cursor.
        const direction = ['prev', 'prevunique'].includes(me.direction) ? 'DESC' : 'ASC';

        // 1. Sort by key
        sql.push('ORDER BY', quotedKeyColumnName, direction); // Todo: Any reason for this first sorting?

        // 2. Sort by primaryKey (if defined and not unique)
        if (!me.__unique && me.__keyColumnName !== 'key') { // Avoid adding 'key' twice
            sql.push(',', util.quote('key'), direction);
        }

        // 3. Sort by position (if defined)

        if (!me.__unique && me.__indexSource) {
            // 4. Sort by object store position (if defined and not unique)
            sql.push(',', util.quote(me.__valueColumnName), direction);
        }
    }
    sql = sql.join(' ');
    CFG.DEBUG && console.log(sql, sqlValues);

    me.__prefetchedData = null;
    me.__prefetchedIndex = 0;
    tx.executeSql(sql, sqlValues, function (tx, data) {
        me.__multiEntryOffset = data.rows.length;

        if (data.rows.length > 0) {
            const rows = [];

            for (let i = 0; i < data.rows.length; i++) {
                const rowItem = data.rows.item(i);
                const rowKey = Key.decode(rowItem[me.__keyColumnName], true);
                const matches = Key.findMultiEntryMatches(rowKey, me.__range);

                for (let j = 0; j < matches.length; j++) {
                    const matchingKey = matches[j];
                    const clone = {
                        matchingKey: Key.encode(matchingKey, true),
                        key: rowItem.key
                    };
                    clone[me.__keyColumnName] = rowItem[me.__keyColumnName];
                    clone[me.__valueColumnName] = rowItem[me.__valueColumnName];
                    rows.push(clone);
                }
            }

            const reverse = me.direction.indexOf('prev') === 0;
            rows.sort(function (a, b) {
                if (a.matchingKey.replace('[', 'z') < b.matchingKey.replace('[', 'z')) {
                    return reverse ? 1 : -1;
                }
                if (a.matchingKey.replace('[', 'z') > b.matchingKey.replace('[', 'z')) {
                    return reverse ? -1 : 1;
                }
                if (a.key < b.key) {
                    return me.direction === 'prev' ? 1 : -1;
                }
                if (a.key > b.key) {
                    return me.direction === 'prev' ? -1 : 1;
                }
                return 0;
            });

            me.__prefetchedData = {
                data: rows,
                length: rows.length,
                item: function (index) {
                    return this.data[index];
                }
            };
            me.__prefetchedIndex = 0;

            if (me.__count) {
                success(undefined, rows.length, undefined);
            } else if (rows.length > 1) {
                CFG.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for multiEntry cursor');
                me.__decode(rows[0], success);
            } else if (rows.length === 1) {
                CFG.DEBUG && console.log('Reached end of multiEntry cursor');
                me.__decode(rows[0], success);
            } else {
                CFG.DEBUG && console.log('Reached end of multiEntry cursor');
                success(undefined, undefined, undefined);
            }
        } else {
            CFG.DEBUG && console.log('Reached end of multiEntry cursor');
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        CFG.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
        error(err);
    });
};

/**
 * Creates an "onsuccess" callback
 * @private
 */
IDBCursor.prototype.__onsuccess = function (success) {
    const me = this;
    return function (key, value, primaryKey) {
        me.__gotValue = true;
        if (me.__count) {
            success(value, me.__req);
        } else {
            me.__key = key === undefined ? null : key;
            me.__primaryKey = primaryKey === undefined ? null : primaryKey;
            me.__value = value === undefined ? null : value;
            const result = key === undefined ? null : me;
            success(result, me.__req);
        }
    };
};

IDBCursor.prototype.__decode = function (rowItem, callback) {
    if (this.__multiEntryIndex && this.__unique) {
        if (!this.__matchedKeys) {
            this.__matchedKeys = {};
        }
        if (this.__matchedKeys[rowItem.matchingKey]) {
            callback(undefined, undefined, undefined);
            return;
        }
        this.__matchedKeys[rowItem.matchingKey] = true;
    }
    const key = Key.decode(this.__multiEntryIndex ? rowItem.matchingKey : rowItem[this.__keyColumnName], this.__multiEntryIndex);
    const val = this.__valueDecoder.decode(rowItem[this.__valueColumnName]);
    const primaryKey = Key.decode(rowItem.key);
    callback(key, val, primaryKey);
};

IDBCursor.prototype.__sourceOrEffectiveObjStoreDeleted = function () {
    if (!this.__store.transaction.db.objectStoreNames.contains(this.__store.name) ||
        this.__indexSource && !this.__store.indexNames.contains(this.source.name)) {
        throw createDOMException('InvalidStateError', 'The cursor\'s source or effective object store has been deleted');
    }
};

IDBCursor.prototype['continue'] = function (key) {
    const recordsToPreloadOnContinue = CFG.cursorPreloadPackSize || 100;
    const me = this;
    IDBTransaction.__assertActive(me.__store.transaction);
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (key !== undefined) Key.validate(key);

    if (key !== undefined) {
        const cmpResult = cmp(key, me.key);
        if (cmpResult === 0 ||
            (me.direction.includes('next') && cmpResult === -1) ||
            (me.direction.includes('prev') && cmpResult === 1)
        ) {
            throw createDOMException('DataError', 'Cannot continue the cursor in an unexpected direction');
        }
    }

    me.__gotValue = false;

    me.__store.transaction.__pushToQueue(me.__req, function cursorContinue (tx, args, success, error) {
        me.__offset++;

        if (me.__prefetchedData) {
            // We have pre-loaded data for the cursor
            me.__prefetchedIndex++;
            if (me.__prefetchedIndex < me.__prefetchedData.length) {
                me.__decode(me.__prefetchedData.item(me.__prefetchedIndex), function (k, val, primKey) {
                    function triggerSuccess () {
                        if (key !== undefined && k !== key) {
                            cursorContinue(tx, args, success, error);
                            return;
                        }
                        me.__onsuccess(success)(k, val, primKey);
                    }
                    if (me.__unique && !me.__multiEntryIndex) {
                        Sca.encode(val, function (encVal) {
                            Sca.encode(me.value, function (encMeVal) {
                                if (encVal === encMeVal) {
                                    cursorContinue(tx, args, success, error);
                                    return;
                                }
                                triggerSuccess();
                            });
                        });
                        return;
                    }
                    triggerSuccess();
                });
                return;
            }
        }

        // No pre-fetched data, do query
        me.__find(key, tx, me.__onsuccess(success), error, recordsToPreloadOnContinue);
    });
};

/*
// Todo:
IDBCursor.prototype.continuePrimaryKey = function (key, primaryKey) {};
*/

IDBCursor.prototype.advance = function (count) {
    const me = this;
    if (!Number.isFinite(count) || count <= 0) {
        throw new TypeError('Count is invalid - 0 or negative: ' + count);
    }
    IDBTransaction.__assertActive(me.__store.transaction);
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    me.__gotValue = false;
    me.__store.transaction.__pushToQueue(me.__req, function cursorAdvance (tx, args, success, error) {
        me.__offset += count;
        me.__find(undefined, tx, me.__onsuccess(success), error);
    });
};

IDBCursor.prototype.update = function (valueToUpdate) {
    const me = this;
    if (!arguments.length) throw new TypeError('A value must be passed to update()');
    IDBTransaction.__assertActive(me.__store.transaction);
    me.__store.transaction.__assertWritable();
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (me.__keyOnly) {
        throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
    }
    util.throwIfNotClonable(valueToUpdate, 'The data to be updated could not be cloned by the internal structured cloning algorithm.');
    if (me.__store.keyPath !== null) {
        const evaluatedKey = me.__store.__validateKeyAndValue(valueToUpdate);
        if (me.primaryKey !== evaluatedKey) {
            throw createDOMException('DataError', 'The key of the supplied value to `update` is not equal to the cursor\'s effective key');
        }
    }
    return me.__store.transaction.__addToTransactionQueue(function cursorUpdate (tx, args, success, error) {
        Sca.encode(valueToUpdate, function (encoded) {
            me.__find(undefined, tx, function (key, value, primaryKey) {
                const store = me.__store;
                const params = [encoded];
                const sql = ['UPDATE', util.quote('s_' + store.name), 'SET value = ?'];
                Key.validate(primaryKey);

                // Also correct the indexes in the table
                for (let i = 0; i < store.indexNames.length; i++) {
                    const index = store.__indexes[store.indexNames[i]];
                    const indexKey = Key.evaluateKeyPathOnValue(valueToUpdate, index.keyPath);
                    sql.push(',', util.quote('_' + index.name), '= ?');
                    params.push(Key.encode(indexKey, index.multiEntry));
                }

                sql.push('WHERE key = ?');
                params.push(Key.encode(primaryKey));

                CFG.DEBUG && console.log(sql.join(' '), encoded, key, primaryKey);
                tx.executeSql(sql.join(' '), params, function (tx, data) {
                    me.__prefetchedData = null;
                    me.__prefetchedIndex = 0;
                    if (data.rowsAffected === 1) {
                        success(key);
                    } else {
                        error('No rows with key found' + key);
                    }
                }, function (tx, data) {
                    error(data);
                });
            }, error);
        });
    }, undefined, me);
};

IDBCursor.prototype['delete'] = function () {
    const me = this;
    IDBTransaction.__assertActive(me.__store.transaction);
    me.__store.transaction.__assertWritable();
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (me.__keyOnly) {
        throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
    }
    return this.__store.transaction.__addToTransactionQueue(function cursorDelete (tx, args, success, error) {
        me.__find(undefined, tx, function (key, value, primaryKey) {
            const sql = 'DELETE FROM  ' + util.quote('s_' + me.__store.name) + ' WHERE key = ?';
            CFG.DEBUG && console.log(sql, key, primaryKey);
            Key.validate(primaryKey);
            tx.executeSql(sql, [Key.encode(primaryKey)], function (tx, data) {
                me.__prefetchedData = null;
                me.__prefetchedIndex = 0;
                if (data.rowsAffected === 1) {
                    // lower the offset or we will miss a row
                    me.__offset--;
                    success(undefined);
                } else {
                    error('No rows with key found' + key);
                }
            }, function (tx, data) {
                error(data);
            });
        }, error);
    }, undefined, me);
};

IDBCursor.prototype.toString = function () {
    return '[object IDBCursor]';
};

util.defineReadonlyProperties(IDBCursor.prototype, ['key', 'primaryKey']);

class IDBCursorWithValue extends IDBCursor {
    toString () {
        return '[object IDBCursorWithValue]';
    }
}

util.defineReadonlyProperties(IDBCursorWithValue.prototype, 'value');

export {IDBCursor, IDBCursorWithValue};

import {createDOMException} from './DOMException.js';
import {IDBRequest} from './IDBRequest.js';
import util from './util.js';
import Key from './Key.js';
import IDBKeyRange from './IDBKeyRange.js';
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
function IDBCursor (range, direction, store, source, keyColumnName, valueColumnName, count) {
    // Calling openCursor on an index or objectstore with null is allowed but we treat it as undefined internally
    if (range === null) {
        range = undefined;
    }
    if (range !== undefined && !(range instanceof IDBKeyRange)) {
        range = new IDBKeyRange(range, range, false, false);
    }
    store.transaction.__assertActive();
    if (direction !== undefined && ['next', 'prev', 'nextunique', 'prevunique'].indexOf(direction) === -1) {
        throw new TypeError(direction + 'is not a valid cursor direction');
    }

    this.source = source;
    this.direction = direction || 'next';
    this.key = undefined;
    this.primaryKey = undefined;
    this.__store = store;
    this.__range = range;
    this.__req = new IDBRequest();
    this.__keyColumnName = keyColumnName;
    this.__valueColumnName = valueColumnName;
    this.__valueDecoder = valueColumnName === 'value' ? Sca : Key;
    this.__count = count;
    this.__offset = -1; // Setting this to -1 as continue will set it to 0 anyway
    this.__lastKeyContinued = undefined; // Used when continuing with a key
    this.__multiEntryIndex = source instanceof IDBIndex ? source.multiEntry : false;
    this.__unique = this.direction.indexOf('unique') !== -1;

    if (range !== undefined) {
        // Encode the key range and cache the encoded values, so we don't have to re-encode them over and over
        range.__lower = range.lower !== undefined && Key.encode(range.lower, this.__multiEntryIndex);
        range.__upper = range.upper !== undefined && Key.encode(range.upper, this.__multiEntryIndex);
    }

    this['continue']();
}

IDBCursor.prototype.__find = function (/* key, tx, success, error, recordsToLoad */) {
    const args = Array.prototype.slice.call(arguments);
    if (this.__multiEntryIndex) {
        this.__findMultiEntry.apply(this, args);
    } else {
        this.__findBasic.apply(this, args);
    }
};

IDBCursor.prototype.__findBasic = function (key, tx, success, error, recordsToLoad) {
    recordsToLoad = recordsToLoad || 1;

    const me = this;
    const quotedKeyColumnName = util.quote(me.__keyColumnName);
    let sql = ['SELECT * FROM', util.quote(me.__store.name)];
    const sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && (me.__range.lower !== undefined || me.__range.upper !== undefined)) {
        sql.push('AND');
        if (me.__range.lower !== undefined) {
            sql.push(quotedKeyColumnName, (me.__range.lowerOpen ? '>' : '>='), '?');
            sqlValues.push(me.__range.__lower);
        }
        (me.__range.lower !== undefined && me.__range.upper !== undefined) && sql.push('AND');
        if (me.__range.upper !== undefined) {
            sql.push(quotedKeyColumnName, (me.__range.upperOpen ? '<' : '<='), '?');
            sqlValues.push(me.__range.__upper);
        }
    }
    if (typeof key !== 'undefined') {
        me.__lastKeyContinued = key;
        me.__offset = 0;
    }
    if (me.__lastKeyContinued !== undefined) {
        sql.push('AND', quotedKeyColumnName, '>= ?');
        Key.validate(me.__lastKeyContinued);
        sqlValues.push(Key.encode(me.__lastKeyContinued));
    }

    // Determine the ORDER BY direction based on the cursor.
    const direction = me.direction === 'prev' || me.direction === 'prevunique' ? 'DESC' : 'ASC';

    if (!me.__count) {
        sql.push('ORDER BY', quotedKeyColumnName, direction);
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
    let sql = ['SELECT * FROM', util.quote(me.__store.name)];
    const sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && (me.__range.lower !== undefined && me.__range.upper !== undefined)) {
        if (me.__range.upper.indexOf(me.__range.lower) === 0) {
            sql.push('AND', quotedKeyColumnName, 'LIKE ?');
            sqlValues.push('%' + me.__range.__lower.slice(0, -1) + '%');
        }
    }
    if (typeof key !== 'undefined') {
        me.__lastKeyContinued = key;
        me.__offset = 0;
    }
    if (me.__lastKeyContinued !== undefined) {
        sql.push('AND', quotedKeyColumnName, '>= ?');
        Key.validate(me.__lastKeyContinued);
        sqlValues.push(Key.encode(me.__lastKeyContinued));
    }

    // Determine the ORDER BY direction based on the cursor.
    const direction = me.direction === 'prev' || me.direction === 'prevunique' ? 'DESC' : 'ASC';

    if (!me.__count) {
        sql.push('ORDER BY key', direction);
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
        if (me.__count) {
            success(value, me.__req);
        } else {
            me.key = key === undefined ? null : key;
            me.value = value === undefined ? null : value;
            me.primaryKey = primaryKey === undefined ? null : primaryKey;
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

IDBCursor.prototype['continue'] = function (key) {
    const recordsToPreloadOnContinue = CFG.cursorPreloadPackSize || 100;
    const me = this;

    this.__store.transaction.__pushToQueue(me.__req, function cursorContinue (tx, args, success, error) {
        me.__offset++;

        if (me.__prefetchedData) {
            // We have pre-loaded data for the cursor
            me.__prefetchedIndex++;
            if (me.__prefetchedIndex < me.__prefetchedData.length) {
                me.__decode(me.__prefetchedData.item(me.__prefetchedIndex), me.__onsuccess(success));
                return;
            }
        }

        // No pre-fetched data, do query
        me.__find(key, tx, me.__onsuccess(success), error, recordsToPreloadOnContinue);
    });
};

IDBCursor.prototype.advance = function (count) {
    if (count <= 0) {
        throw createDOMException('Type Error', 'Count is invalid - 0 or negative', count);
    }
    const me = this;
    this.__store.transaction.__pushToQueue(me.__req, function cursorAdvance (tx, args, success, error) {
        me.__offset += count;
        me.__find(undefined, tx, me.__onsuccess(success), error);
    });
};

IDBCursor.prototype.update = function (valueToUpdate) {
    const me = this;
    me.__store.transaction.__assertWritable();
    return me.__store.transaction.__addToTransactionQueue(function cursorUpdate (tx, args, success, error) {
        Sca.encode(valueToUpdate, function (encoded) {
            me.__find(undefined, tx, function (key, value, primaryKey) {
                const store = me.__store;
                const params = [encoded];
                const sql = ['UPDATE', util.quote(store.name), 'SET value = ?'];
                Key.validate(primaryKey);

                // Also correct the indexes in the table
                for (let i = 0; i < store.indexNames.length; i++) {
                    const index = store.__indexes[store.indexNames[i]];
                    const indexKey = Key.getValue(valueToUpdate, index.keyPath);
                    sql.push(',', util.quote(index.name), '= ?');
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
    });
};

IDBCursor.prototype['delete'] = function () {
    const me = this;
    me.__store.transaction.__assertWritable();
    return this.__store.transaction.__addToTransactionQueue(function cursorDelete (tx, args, success, error) {
        me.__find(undefined, tx, function (key, value, primaryKey) {
            const sql = 'DELETE FROM  ' + util.quote(me.__store.name) + ' WHERE key = ?';
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
    });
};

// Todo: Add IDBCursorWithValue?
const IDBCursorWithValue = {};
export {IDBCursor, IDBCursorWithValue};

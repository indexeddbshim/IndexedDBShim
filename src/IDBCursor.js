
import {IDBRequest} from './IDBRequest';
import IDBObjectStore from './IDBObjectStore';
import {createDOMException} from './DOMException';
import {setSQLForKeyRange, convertValueToKeyRange} from './IDBKeyRange';
import {cmp} from './IDBFactory';
import * as util from './util';
import IDBTransaction from './IDBTransaction';
import * as Key from './Key';
import * as Sca from './Sca';
import IDBIndex from './IDBIndex';
import CFG from './CFG';

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
function IDBCursor () {
    throw new TypeError('Illegal constructor');
}
const IDBCursorAlias = IDBCursor;
IDBCursor.__super = function IDBCursor (query, direction, store, source, keyColumnName, valueColumnName, count) {
    this[Symbol.toStringTag] = 'IDBCursor';
    util.defineReadonlyProperties(this, ['key', 'primaryKey']);
    IDBObjectStore.__invalidStateIfDeleted(store);
    this.__indexSource = util.instanceOf(source, IDBIndex);
    if (this.__indexSource) IDBIndex.__invalidStateIfDeleted(source);
    IDBTransaction.__assertActive(store.transaction);
    const range = convertValueToKeyRange(query);
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
    this.__req = IDBRequest.__createInstance();
    this.__req.__source = source;
    this.__req.__transaction = this.__store.transaction;
    this.__keyColumnName = keyColumnName;
    this.__valueColumnName = valueColumnName;
    this.__keyOnly = valueColumnName === 'key';
    this.__valueDecoder = this.__keyOnly ? Key : Sca;
    this.__count = count;
    this.__prefetchedIndex = -1;
    this.__multiEntryIndex = this.__indexSource ? source.multiEntry : false;
    this.__unique = this.direction.includes('unique');
    this.__sqlDirection = ['prev', 'prevunique'].includes(this.direction) ? 'DESC' : 'ASC';

    if (range !== undefined) {
        // Encode the key range and cache the encoded values, so we don't have to re-encode them over and over
        range.__lowerCached = range.lower !== undefined && Key.encode(range.lower, this.__multiEntryIndex);
        range.__upperCached = range.upper !== undefined && Key.encode(range.upper, this.__multiEntryIndex);
    }
    this.__gotValue = true;
    this['continue']();
};

IDBCursor.__createInstance = function (...args) {
    const IDBCursor = IDBCursorAlias.__super;
    IDBCursor.prototype = IDBCursorAlias.prototype;
    return new IDBCursor(...args);
};

IDBCursor.prototype.__find = function (...args /* key, tx, success, error, recordsToLoad */) {
    if (this.__multiEntryIndex) {
        this.__findMultiEntry(...args);
    } else {
        this.__findBasic(...args);
    }
};

IDBCursor.prototype.__findBasic = function (key, primaryKey, tx, success, error, recordsToLoad) {
    const continueCall = recordsToLoad !== undefined;
    recordsToLoad = recordsToLoad || 1;

    const me = this;
    const quotedKeyColumnName = util.sqlQuote(me.__keyColumnName);
    const quotedKey = util.sqlQuote('key');
    let sql = ['SELECT * FROM', util.escapeStoreNameForSQL(me.__store.__currentName)];
    const sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    setSQLForKeyRange(me.__range, quotedKeyColumnName, sql, sqlValues, true, true);

    // Determine the ORDER BY direction based on the cursor.
    const direction = me.__sqlDirection;
    const op = direction === 'ASC' ? '>' : '<';

    if (primaryKey !== undefined) {
        sql.push('AND', quotedKey, op + '= ?');
        // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
        sqlValues.push(Key.encode(primaryKey));
    }
    if (key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + '= ?');
        // Key.convertValueToKey(key); // Already checked by `continue` or `continuePrimaryKey`
        sqlValues.push(Key.encode(key));
    } else if (continueCall && me.__key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + ' ?');
        // Key.convertValueToKey(me.__key); // Already checked when stored
        sqlValues.push(Key.encode(me.__key));
    }

    if (!me.__count) {
        // 1. Sort by key
        sql.push('ORDER BY', quotedKeyColumnName, direction);

        // 2. Sort by primaryKey (if defined and not unique)
        if (!me.__unique && me.__keyColumnName !== 'key') { // Avoid adding 'key' twice
            sql.push(',', quotedKey, direction);
        }

        // 3. Sort by position (if defined)

        if (!me.__unique && me.__indexSource) {
            // 4. Sort by object store position (if defined and not unique)
            sql.push(',', util.sqlQuote(me.__valueColumnName), direction);
        }
        sql.push('LIMIT', recordsToLoad);
    }
    sql = sql.join(' ');
    CFG.DEBUG && console.log(sql, sqlValues);

    tx.executeSql(sql, sqlValues, function (tx, data) {
        if (me.__count) {
            success(undefined, data.rows.length, undefined);
        } else if (data.rows.length > 1) {
            me.__prefetchedIndex = 0;
            me.__prefetchedData = data.rows;
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

IDBCursor.prototype.__findMultiEntry = function (key, primaryKey, tx, success, error) {
    const me = this;

    if (me.__prefetchedData && me.__prefetchedData.length === me.__prefetchedIndex) {
        CFG.DEBUG && console.log('Reached end of multiEntry cursor');
        success(undefined, undefined, undefined);
        return;
    }

    const quotedKeyColumnName = util.sqlQuote(me.__keyColumnName);
    let sql = ['SELECT * FROM', util.escapeStoreNameForSQL(me.__store.__currentName)];
    const sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && (me.__range.lower !== undefined && Array.isArray(me.__range.upper))) {
        if (me.__range.upper.indexOf(me.__range.lower) === 0) {
            sql.push('AND', quotedKeyColumnName, "LIKE ? ESCAPE '^'");
            sqlValues.push('%' + util.sqlLIKEEscape(me.__range.__lowerCached.slice(0, -1)) + '%');
        }
    }

    // Determine the ORDER BY direction based on the cursor.
    const direction = me.__sqlDirection;
    const op = direction === 'ASC' ? '>' : '<';
    const quotedKey = util.sqlQuote('key');

    if (primaryKey !== undefined) {
        sql.push('AND', quotedKey, op + '= ?');
        // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
        sqlValues.push(Key.encode(primaryKey));
    }
    if (key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + '= ?');
        // Key.convertValueToKey(key); // Already checked by `continue` or `continuePrimaryKey`
        sqlValues.push(Key.encode(key));
    } else if (me.__key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + ' ?');
        // Key.convertValueToKey(me.__key); // Already checked when entered
        sqlValues.push(Key.encode(me.__key));
    }

    if (!me.__count) {
        // 1. Sort by key
        sql.push('ORDER BY', quotedKeyColumnName, direction);

        // 2. Sort by primaryKey (if defined and not unique)
        if (!me.__unique && me.__keyColumnName !== 'key') { // Avoid adding 'key' twice
            sql.push(',', util.sqlQuote('key'), direction);
        }

        // 3. Sort by position (if defined)

        if (!me.__unique && me.__indexSource) {
            // 4. Sort by object store position (if defined and not unique)
            sql.push(',', util.sqlQuote(me.__valueColumnName), direction);
        }
    }
    sql = sql.join(' ');
    CFG.DEBUG && console.log(sql, sqlValues);

    tx.executeSql(sql, sqlValues, function (tx, data) {
        if (data.rows.length > 0) {
            if (me.__count) { // Avoid caching and other processing below
                let ct = 0;
                for (let i = 0; i < data.rows.length; i++) {
                    const rowItem = data.rows.item(i);
                    const rowKey = Key.decode(rowItem[me.__keyColumnName], true);
                    const matches = Key.findMultiEntryMatches(rowKey, me.__range);
                    ct += matches.length;
                }
                success(undefined, ct, undefined);
                return;
            }
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

            if (rows.length > 1) {
                me.__prefetchedIndex = 0;
                me.__prefetchedData = {
                    data: rows,
                    length: rows.length,
                    item: function (index) {
                        return this.data[index];
                    }
                };
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
            if (key !== undefined) {
                me.__gotValue = true;
            }
            me.__key = key === undefined ? null : key;
            me.__primaryKey = primaryKey === undefined ? null : primaryKey;
            me.__value = value === undefined ? null : value;
            const result = key === undefined ? null : me;
            success(result, me.__req);
        }
    };
};

IDBCursor.prototype.__decode = function (rowItem, callback) {
    const me = this;
    if (me.__multiEntryIndex && me.__unique) {
        if (!me.__matchedKeys) {
            me.__matchedKeys = {};
        }
        if (me.__matchedKeys[rowItem.matchingKey]) {
            callback(undefined, undefined, undefined); // eslint-disable-line standard/no-callback-literal
            return;
        }
        me.__matchedKeys[rowItem.matchingKey] = true;
    }
    const encKey = util.unescapeSQLiteResponse(me.__multiEntryIndex
        ? rowItem.matchingKey
        : rowItem[me.__keyColumnName]
    );
    const encVal = util.unescapeSQLiteResponse(rowItem[me.__valueColumnName]);
    const encPrimaryKey = util.unescapeSQLiteResponse(rowItem.key);

    const key = Key.decode(
        encKey,
        me.__multiEntryIndex
    );
    const val = me.__valueDecoder.decode(encVal);
    const primaryKey = Key.decode(encPrimaryKey);
    callback(key, val, primaryKey, encKey /*, encVal, encPrimaryKey */);
};

IDBCursor.prototype.__sourceOrEffectiveObjStoreDeleted = function () {
    IDBObjectStore.__invalidStateIfDeleted(this.__store, "The cursor's effective object store has been deleted");
    if (this.__indexSource) IDBIndex.__invalidStateIfDeleted(this.source, "The cursor's index source has been deleted");
};

IDBCursor.prototype.__invalidateCache = function () {
    this.__prefetchedData = null;
};

IDBCursor.prototype.__continue = function (key, advanceContinue) {
    const me = this;
    const advanceState = me.__advanceCount !== undefined;
    IDBTransaction.__assertActive(me.__store.transaction);
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue && !advanceContinue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (key !== undefined) {
        Key.convertValueToKeyRethrowingAndIfInvalid(key);
        const cmpResult = cmp(key, me.key);
        if (cmpResult === 0 ||
            (me.direction.includes('next') && cmpResult === -1) ||
            (me.direction.includes('prev') && cmpResult === 1)
        ) {
            throw createDOMException('DataError', 'Cannot ' + (advanceState ? 'advance' : 'continue') + ' the cursor in an unexpected direction');
        }
    }
    this.__continueFinish(key, undefined, advanceState);
};

IDBCursor.prototype.__continueFinish = function (key, primaryKey, advanceState) {
    const me = this;
    const recordsToPreloadOnContinue = me.__advanceCount || CFG.cursorPreloadPackSize || 100;
    me.__gotValue = false;
    me.__req.__readyState = 'pending'; // Unset done flag

    me.__store.transaction.__pushToQueue(me.__req, function cursorContinue (tx, args, success, error, executeNextRequest) {
        function triggerSuccess (k, val, primKey) {
            if (advanceState) {
                if (me.__advanceCount >= 2 && k !== undefined) {
                    me.__advanceCount--;
                    me.__key = k;
                    me.__continue(undefined, true);
                    executeNextRequest(); // We don't call success yet but do need to advance the transaction queue
                    return;
                }
                me.__advanceCount = undefined;
            }
            me.__onsuccess(success)(k, val, primKey);
        }
        if (me.__prefetchedData) {
            // We have pre-loaded data for the cursor
            me.__prefetchedIndex++;
            if (me.__prefetchedIndex < me.__prefetchedData.length) {
                me.__decode(me.__prefetchedData.item(me.__prefetchedIndex), function (k, val, primKey, encKey) {
                    function checkKey () {
                        const cmpResult = key === undefined || cmp(k, key);
                        if (cmpResult > 0 || (
                            cmpResult === 0 && (
                                me.__unique || primaryKey === undefined || cmp(primKey, primaryKey) >= 0
                            )
                        )) {
                            triggerSuccess(k, val, primKey);
                            return;
                        }
                        cursorContinue(tx, args, success, error);
                    }
                    if (me.__unique && !me.__multiEntryIndex &&
                        encKey === Key.encode(me.key, me.__multiEntryIndex)) {
                        cursorContinue(tx, args, success, error);
                        return;
                    }
                    checkKey();
                });
                return;
            }
        }

        // No (or not enough) pre-fetched data, do query
        me.__find(key, primaryKey, tx, triggerSuccess, function (...args) {
            me.__advanceCount = undefined;
            error(...args);
        }, recordsToPreloadOnContinue);
    });
};

IDBCursor.prototype['continue'] = function (/* key */) {
    this.__continue(arguments[0]);
};

IDBCursor.prototype.continuePrimaryKey = function (key, primaryKey) {
    const me = this;
    IDBTransaction.__assertActive(me.__store.transaction);
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__indexSource) {
        throw createDOMException('InvalidAccessError', '`continuePrimaryKey` may only be called on an index source.');
    }
    if (!['next', 'prev'].includes(me.direction)) {
        throw createDOMException('InvalidAccessError', '`continuePrimaryKey` may not be called with unique cursors.');
    }
    if (!me.__gotValue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    Key.convertValueToKeyRethrowingAndIfInvalid(key);
    Key.convertValueToKeyRethrowingAndIfInvalid(primaryKey);

    const cmpResult = cmp(key, me.key);
    if (
        (me.direction === 'next' && cmpResult === -1) ||
        (me.direction === 'prev' && cmpResult === 1)
    ) {
        throw createDOMException('DataError', 'Cannot continue the cursor in an unexpected direction');
    }
    function noErrors () {
        me.__continueFinish(key, primaryKey, false);
    }
    if (cmpResult === 0) {
        Sca.encode(primaryKey, function (encPrimaryKey) {
            Sca.encode(me.primaryKey, function (encObjectStorePos) {
                if (encPrimaryKey === encObjectStorePos ||
                    (me.direction === 'next' && encPrimaryKey < encObjectStorePos) ||
                    (me.direction === 'prev' && encPrimaryKey > encObjectStorePos)
                ) {
                    throw createDOMException('DataError', 'Cannot continue the cursor in an unexpected direction');
                }
                noErrors();
            });
        });
    } else {
        noErrors();
    }
};

IDBCursor.prototype.advance = function (count) {
    const me = this;
    count = util.enforceRange(count, 'unsigned long');
    if (count === 0) {
        throw new TypeError('Calling advance() with count argument 0');
    }
    if (me.__gotValue) { // Only set the count if not running in error (otherwise will override earlier good advance calls)
        me.__advanceCount = count;
    }
    me.__continue();
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
    const request = me.__store.transaction.__createRequest(me);
    const key = me.primaryKey;
    function addToQueue (clonedValue) {
        IDBObjectStore.__storingRecordObjectStore(request, me.__store, clonedValue, false, key);
    }
    if (me.__store.keyPath !== null) {
        const [evaluatedKey, clonedValue] = me.__store.__validateKeyAndValueAndCloneValue(valueToUpdate, undefined, true);
        if (cmp(me.primaryKey, evaluatedKey) !== 0) {
            throw createDOMException('DataError', 'The key of the supplied value to `update` is not equal to the cursor\'s effective key');
        }
        addToQueue(clonedValue);
    } else {
        const clonedValue = Sca.clone(valueToUpdate);
        addToQueue(clonedValue);
    }
    return request;
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
        me.__find(undefined, undefined, tx, function (key, value, primaryKey) {
            const sql = 'DELETE FROM  ' + util.escapeStoreNameForSQL(me.__store.__currentName) + ' WHERE "key" = ?';
            CFG.DEBUG && console.log(sql, key, primaryKey);
            // Key.convertValueToKey(primaryKey); // Already checked when entered
            tx.executeSql(sql, [util.escapeSQLiteStatement(Key.encode(primaryKey))], function (tx, data) {
                if (data.rowsAffected === 1) {
                    me.__store.__cursors.forEach((cursor) => {
                        cursor.__invalidateCache(); // Delete
                    });
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

IDBCursor.prototype[Symbol.toStringTag] = 'IDBCursorPrototype';

['source', 'direction', 'key', 'primaryKey'].forEach((prop) => {
    Object.defineProperty(IDBCursor.prototype, prop, {
        enumerable: true,
        configurable: true,
        get: function () {
            throw new TypeError('Illegal invocation');
        }
    });
});
Object.defineProperty(IDBCursor, 'prototype', {
    writable: false
});

function IDBCursorWithValue () {
    throw new TypeError('Illegal constructor');
}

IDBCursorWithValue.prototype = Object.create(IDBCursor.prototype);
IDBCursorWithValue.prototype.constructor = IDBCursorWithValue;

const IDBCursorWithValueAlias = IDBCursorWithValue;
IDBCursorWithValue.__createInstance = function (...args) {
    function IDBCursorWithValue () {
        IDBCursor.__super.call(this, ...args);
        this[Symbol.toStringTag] = 'IDBCursorWithValue';
        util.defineReadonlyProperties(this, 'value');
    }
    IDBCursorWithValue.prototype = IDBCursorWithValueAlias.prototype;
    return new IDBCursorWithValue();
};

Object.defineProperty(IDBCursorWithValue.prototype, 'value', {
    enumerable: true,
    configurable: true,
    get: function () {
        throw new TypeError('Illegal invocation');
    }
});

IDBCursorWithValue.prototype[Symbol.toStringTag] = 'IDBCursorWithValuePrototype';

Object.defineProperty(IDBCursorWithValue, 'prototype', {
    writable: false
});

export {IDBCursor, IDBCursorWithValue};

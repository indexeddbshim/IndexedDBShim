import {IDBRequest} from './IDBRequest.js';
import IDBObjectStore from './IDBObjectStore.js';
import {createDOMException} from './DOMException.js';
import {setSQLForKeyRange, convertValueToKeyRange} from './IDBKeyRange.js';
import {cmp} from './IDBFactory.js';
import * as util from './util.js';
import IDBTransaction from './IDBTransaction.js';
import * as Key from './Key.js';
import * as Sca from './Sca.js';
import {IDBIndex} from './IDBIndex.js';
import CFG from './CFG.js';

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {IDBCursor & {
 *   primaryKey: import('./Key.js').Key,
 *   key:  import('./Key.js').Key,
 *   direction: string,
 *   source: import('./IDBObjectStore.js').IDBObjectStoreFull|
 *     import('./IDBIndex.js').IDBIndexFull,
 *   __request: import('./IDBRequest.js').IDBRequestFull,
 *   __advanceCount: Integer|undefined,
 *   __indexSource: boolean,
 *   __key: import('./Key.js').Key,
 *   __primaryKey: import('./Key.js').Key,
 *   __value: import('./Key.js').Value,
 *   __store: import('./IDBObjectStore.js').IDBObjectStoreFull,
 *   __range: import('./IDBKeyRange.js').IDBKeyRangeFull|undefined,
 *   __keyColumnName: string,
 *   __valueColumnName: string,
 *   __keyOnly: boolean,
 *   __valueDecoder: {
 *     decode: (str: string) => any,
 *   },
 *   __count: boolean,
 *   __prefetchedIndex: Integer,
 *   __prefetchedData: null|SQLResultSetRowList|{
 *     data: RowItemNonNull[],
 *     length: Integer,
 *     item: (index: Integer) => RowItemNonNull
 *   },
 *   __multiEntryIndex: boolean,
 *   __unique: boolean,
 *   __sqlDirection: "DESC"|"ASC",
 *   __matchedKeys: {[key: string]: true},
 *   __invalidateCache: () => void
 * }} IDBCursorFull
 */

/**
 * @typedef {IDBCursorFull & {
 *   __request: import('./IDBRequest.js').IDBRequestFull,
 * }} IDBCursorWithValueFull
 */

/**
 * @class
 */
function IDBCursor () {
    throw new TypeError('Illegal constructor');
}
const IDBCursorAlias = IDBCursor;

/* eslint-disable func-name-matching -- API */
/**
 * The IndexedDB Cursor Object.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
 * @param {IDBKeyRange} query
 * @param {string} direction
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull|
 *   import('./IDBIndex.js').IDBIndexFull} source
 * @param {string} keyColumnName
 * @param {string} valueColumnName
 * @param {boolean} count
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.__super = function IDBCursor (query, direction, store, source, keyColumnName, valueColumnName, count) {
    /* eslint-enable func-name-matching -- API */
    // @ts-expect-error Should be ok
    this[Symbol.toStringTag] = 'IDBCursor';
    util.defineReadonlyProperties(this, ['key', 'primaryKey', 'request']);
    IDBObjectStore.__invalidStateIfDeleted(store);
    this.__indexSource = util.instanceOf(source, IDBIndex);
    if (this.__indexSource) {
        IDBIndex.__invalidStateIfDeleted(
            /** @type {import('./IDBIndex.js').IDBIndexFull} */ (source)
        );
    }
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
    this.__request = IDBRequest.__createInstance();
    this.__request.__source = source;
    this.__request.__transaction = this.__store.transaction;
    this.__keyColumnName = keyColumnName;
    this.__valueColumnName = valueColumnName;
    this.__keyOnly = valueColumnName === 'key';
    this.__valueDecoder = this.__keyOnly ? Key : Sca;
    this.__count = count;
    this.__prefetchedIndex = -1;
    this.__multiEntryIndex = this.__indexSource
        ? 'multiEntry' in source && source.multiEntry
        : false;
    this.__unique = this.direction.includes('unique');
    this.__sqlDirection = ['prev', 'prevunique'].includes(this.direction) ? 'DESC' : 'ASC';

    if (range !== undefined) {
        // Encode the key range and cache the encoded values, so we don't have to re-encode them over and over
        range.__lowerCached = range.lower !== undefined && Key.encode(range.lower, this.__multiEntryIndex);
        range.__upperCached = range.upper !== undefined && Key.encode(range.upper, this.__multiEntryIndex);
    }
    this.__gotValue = true;
    this.continue();
};

/**
 *
 * @param {...any} args
 * @returns {IDBCursorFull}
 */
IDBCursor.__createInstance = function (...args) {
    const IDBCursor = IDBCursorAlias.__super;
    IDBCursor.prototype = IDBCursorAlias.prototype;

    // @ts-expect-error It's ok
    return new IDBCursor(...args);
};

/**
 *
 * @param {...any} args
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__find = function (...args /* key, tx, success, error, recordsToLoad */) {
    if (this.__multiEntryIndex) {
        const [key, primaryKey, tx, success, error, recordsToLoad] = args;
        this.__findMultiEntry(key, primaryKey, tx, success, error, recordsToLoad);
    } else {
        const [key, primaryKey, tx, success, error, recordsToLoad] = args;
        this.__findBasic(key, primaryKey, tx, success, error, recordsToLoad);
    }
};

/**
 * @typedef {(
 *   k: import('./Key.js').Key,
 *   val: import('./Key.js').Value,
 *   primKey: import('./Key.js').Key
 * ) => void} KeySuccess
 */

/**
 * @typedef {(tx: SQLTransaction|Error|DOMException|SQLError, err?: SQLError) => void} FindError
 */

/**
 *
 * @param {undefined|import('./Key.js').Key} key
 * @param {undefined|import('./Key.js').Key} primaryKey
 * @param {SQLTransaction} tx
 * @param {KeySuccess} success
 * @param {FindError} error
 * @param {Integer|undefined} recordsToLoad
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__findBasic = function (key, primaryKey, tx, success, error, recordsToLoad) {
    const continueCall = recordsToLoad !== undefined;
    recordsToLoad = recordsToLoad || 1;

    const me = this;
    const quotedKeyColumnName = util.sqlQuote(me.__keyColumnName);
    const quotedKey = util.sqlQuote('key');
    const sql = ['SELECT * FROM', util.escapeStoreNameForSQL(me.__store.__currentName)];

    /** @type {string[]} */
    const sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    setSQLForKeyRange(me.__range, quotedKeyColumnName, sql, sqlValues, true, true);

    // Determine the ORDER BY direction based on the cursor.
    const direction = me.__sqlDirection;
    const op = direction === 'ASC' ? '>' : '<';

    if (primaryKey !== undefined) {
        sql.push('AND', quotedKey, op + '= ?');
        // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
        sqlValues.push(/** @type {string} */ (Key.encode(primaryKey)));
    }
    if (key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + '= ?');
        // Key.convertValueToKey(key); // Already checked by `continue` or `continuePrimaryKey`
        sqlValues.push(/** @type {string} */ (Key.encode(key)));
    } else if (continueCall && me.__key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + ' ?');
        // Key.convertValueToKey(me.__key); // Already checked when stored
        sqlValues.push(/** @type {string} */ (Key.encode(me.__key)));
    }

    if (!me.__count) {
        // 1. Sort by key
        sql.push('ORDER BY', quotedKeyColumnName, direction);

        if (me.__keyColumnName !== 'key') { // Avoid adding 'key' twice
            if (!me.__unique) {
                // 2. Sort by primaryKey (if defined and not unique)
                // 3. Sort by position (if defined)
                sql.push(',', quotedKey, direction);
            } else if (me.direction === 'prevunique') {
                // Sort by first record with key matching
                sql.push(',', quotedKey, 'ASC');
            }
        }

        if (!me.__unique && me.__indexSource) {
            // 4. Sort by object store position (if defined and not unique)
            sql.push(',', util.sqlQuote(me.__valueColumnName), direction);
        }
        sql.push('LIMIT', String(recordsToLoad));
    }
    const sqlStr = sql.join(' ');
    if (CFG.DEBUG) { console.log(sqlStr, sqlValues); }

    tx.executeSql(sqlStr, sqlValues, function (tx, data) {
        if (me.__count) {
            success(undefined, data.rows.length, undefined);
        } else if (data.rows.length > 1) {
            me.__prefetchedIndex = 0;
            me.__prefetchedData = data.rows;
            if (CFG.DEBUG) { console.log('Preloaded ' + me.__prefetchedData.length + ' records for cursor'); }
            me.__decode(data.rows.item(0), success);
        } else if (data.rows.length === 1) {
            me.__decode(data.rows.item(0), success);
        } else {
            if (CFG.DEBUG) { console.log('Reached end of cursors'); }
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        if (CFG.DEBUG) { console.log('Could not execute Cursor.continue', sqlStr, sqlValues); }
        error(err);
        return false;
    });
};

const leftBracketRegex = /\[/gu;

/**
 *
 * @param {undefined|import('./Key.js').Key} key
 * @param {undefined|import('./Key.js').Key} primaryKey
 * @param {SQLTransaction} tx
 * @param {KeySuccess} success
 * @param {FindError} error
 * @param {Integer|undefined} recordsToLoad
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__findMultiEntry = function (key, primaryKey, tx, success, error, recordsToLoad) {
    const me = this;

    if (me.__prefetchedData && me.__prefetchedData.length === me.__prefetchedIndex) {
        if (CFG.DEBUG) { console.log('Reached end of multiEntry cursor'); }
        success(undefined, undefined, undefined);
        return;
    }

    const quotedKeyColumnName = util.sqlQuote(me.__keyColumnName);
    const sql = ['SELECT * FROM', util.escapeStoreNameForSQL(me.__store.__currentName)];
    /** @type {string[]} */
    const sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && (me.__range.lower !== undefined && Array.isArray(me.__range.upper))) {
        if (me.__range.upper.indexOf(me.__range.lower) === 0) {
            sql.push('AND', quotedKeyColumnName, "LIKE ? ESCAPE '^'");
            sqlValues.push(
                '%' + util.sqlLIKEEscape(
                    /** @type {string} */ (me.__range.__lowerCached).slice(0, -1)
                ) + '%'
            );
        }
    }

    // Determine the ORDER BY direction based on the cursor.
    const direction = me.__sqlDirection;
    const op = direction === 'ASC' ? '>' : '<';
    const quotedKey = util.sqlQuote('key');

    if (primaryKey !== undefined) {
        sql.push('AND', quotedKey, op + '= ?');
        // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
        sqlValues.push(/** @type {string} */ (Key.encode(primaryKey)));
    }
    if (key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + '= ?');
        // Key.convertValueToKey(key); // Already checked by `continue` or `continuePrimaryKey`
        sqlValues.push(/** @type {string} */ (Key.encode(key)));
    } else if (me.__key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + ' ?');
        // Key.convertValueToKey(me.__key); // Already checked when entered
        sqlValues.push(/** @type {string} */ (Key.encode(me.__key)));
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
        sql.push('LIMIT', String(recordsToLoad));
    }
    const sqlStr = sql.join(' ');
    if (CFG.DEBUG) { console.log(sqlStr, sqlValues); }

    tx.executeSql(sqlStr, sqlValues, function (tx, data) {
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

                for (const matchingKey of matches) {
                    /**
                     * @type {RowItemNonNull}
                     */
                    const clone = {
                        matchingKey: /** @type {string} */ (
                            Key.encode(matchingKey, true)
                        ),
                        key: rowItem.key
                    };
                    clone[me.__keyColumnName] = rowItem[me.__keyColumnName];
                    clone[me.__valueColumnName] = rowItem[me.__valueColumnName];
                    rows.push(clone);
                }
            }
            const reverse = me.direction.indexOf('prev') === 0;
            rows.sort(function (a, b) {
                if (a.matchingKey.replaceAll(leftBracketRegex, 'z') < b.matchingKey.replaceAll(leftBracketRegex, 'z')) {
                    return reverse ? 1 : -1;
                }
                if (a.matchingKey.replaceAll(leftBracketRegex, 'z') > b.matchingKey.replaceAll(leftBracketRegex, 'z')) {
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
                    /**
                     * @param {Integer} index
                     * @returns {RowItemNonNull}
                     */
                    item (index) {
                        return this.data[index];
                    }
                };
                if (CFG.DEBUG) { console.log('Preloaded ' + me.__prefetchedData.length + ' records for multiEntry cursor'); }
                me.__decode(rows[0], success);
            } else if (rows.length === 1) {
                if (CFG.DEBUG) { console.log('Reached end of multiEntry cursor'); }
                me.__decode(rows[0], success);
            } else {
                if (CFG.DEBUG) { console.log('Reached end of multiEntry cursor'); }
                success(undefined, undefined, undefined);
            }
        } else {
            if (CFG.DEBUG) { console.log('Reached end of multiEntry cursor'); }
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        if (CFG.DEBUG) { console.log('Could not execute Cursor.continue', sqlStr, sqlValues); }
        error(err);
        return false;
    });
};

/**
 * @typedef {any} StructuredCloneValue
 */

/**
 * @typedef {any} IndexedDBKey
 */

/**
* @callback SuccessArg
* @param {StructuredCloneValue} value
* @param {import('./IDBRequest.js').IDBRequestFull} req
* @returns {void}
*/

/**
* @callback SuccessCallback
* @param {IndexedDBKey} key
* @param {StructuredCloneValue} value
* @param {IndexedDBKey} primaryKey
* @returns {void}
*/

/**
 * Creates an "onsuccess" callback.
 * @param {SuccessArg} success
 * @this {IDBCursorFull}
 * @returns {SuccessCallback}
 */
IDBCursor.prototype.__onsuccess = function (success) {
    const me = this;
    return function (key, value, primaryKey) {
        if (me.__count) {
            success(value, me.__request);
        } else {
            if (key !== undefined) {
                me.__gotValue = true;
            }
            me.__key = key === undefined ? null : key;
            me.__primaryKey = primaryKey === undefined ? null : primaryKey;
            me.__value = value === undefined ? null : value;
            const result = key === undefined ? null : me;
            success(result, me.__request);
        }
    };
};

/**
 * @typedef {{
*   matchingKey: string,
*   key: string,
*   [k: string]: string
* }} RowItemNonNull
*/

/**
 *
 * @param {RowItemNonNull} rowItem
 * @param {(
 *   key: import('./Key.js').Key,
 *   val: import('./Key.js').Value,
 *   primaryKey: import('./Key.js').Key,
 *   encKey?: string
 * ) => void} callback
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__decode = function (rowItem, callback) {
    const me = this;
    if (me.__multiEntryIndex && me.__unique) {
        if (!me.__matchedKeys) {
            me.__matchedKeys = {};
        }
        if (me.__matchedKeys[rowItem.matchingKey]) {
            callback(undefined, undefined, undefined);
            return;
        }
        me.__matchedKeys[rowItem.matchingKey] = true;
    }
    const encKey = util.unescapeSQLiteResponse(
        me.__multiEntryIndex
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
    callback(key, val, primaryKey, encKey /* , encVal, encPrimaryKey */);
};

/**
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__sourceOrEffectiveObjStoreDeleted = function () {
    IDBObjectStore.__invalidStateIfDeleted(this.__store, "The cursor's effective object store has been deleted");
    if (this.__indexSource) {
        IDBIndex.__invalidStateIfDeleted(
            /** @type {import('./IDBIndex.js').IDBIndexFull} */ (this.source),
            "The cursor's index source has been deleted"
        );
    }
};

/**
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__invalidateCache = function () {
    // @ts-expect-error Why is this not being found?
    this.__prefetchedData = null;
};

/**
 *
 * @param {import('./Key.js').Key} [key]
 * @param {boolean} [advanceContinue]
 * @this {IDBCursorFull}
 * @returns {void}
 */
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

/**
 *
 * @param {import('./Key.js').Key} key
 * @param {import('./Key.js').Key} primaryKey
 * @param {boolean} advanceState
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__continueFinish = function (key, primaryKey, advanceState) {
    const me = this;
    const recordsToPreloadOnContinue = me.__advanceCount || CFG.cursorPreloadPackSize || 100;
    me.__gotValue = false;
    me.__request.__done = false;

    /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
        me.__store.transaction
    ).__pushToQueue(me.__request, function cursorContinue (tx, args, success, error, executeNextRequest) {
        /**
         * @param {import('./Key.js').Key} k
         * @param {import('./Key.js').Value} val
         * @param {import('./Key.js').Key} primKey
         * @returns {void}
         */
        function triggerSuccess (k, val, primKey) {
            if (advanceState) {
                if (me.__advanceCount && me.__advanceCount >= 2 && k !== undefined) {
                    me.__advanceCount--;
                    me.__key = k;
                    me.__continue(undefined, true);
                    /** @type {() => void} */ (
                        executeNextRequest
                    )(); // We don't call success yet but do need to advance the transaction queue
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
                    /**
                     * @returns {void}
                     */
                    function checkKey () {
                        const cmpResult = Number(key === undefined) || cmp(k, key);
                        if (cmpResult > 0 || (
                            cmpResult === 0 && (
                                me.__unique || primaryKey === undefined || cmp(primKey, primaryKey) >= 0
                            )
                        )) {
                            triggerSuccess(k, val, primKey);
                            return;
                        }
                        // @ts-expect-error Todo: Our bug to fix
                        cursorContinue(tx, args, success, error);
                    }
                    if (me.__unique && !me.__multiEntryIndex &&
                        encKey === Key.encode(me.key, me.__multiEntryIndex)) {
                        // @ts-expect-error Todo: Our bug to fix
                        cursorContinue(tx, args, success, error);
                        return;
                    }
                    checkKey();
                });
                return;
            }
        }

        // No (or not enough) pre-fetched data, do query
        me.__find(
            key, primaryKey, tx, triggerSuccess,
            /** @type {FindError} */
            function (...args) {
                me.__advanceCount = undefined;
                const [t, err] = args;
                error(t, err);
            }, recordsToPreloadOnContinue
        );
    });
};

/**
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.continue = function (/* key */) {
    // eslint-disable-next-line prefer-rest-params -- API
    this.__continue(arguments[0]);
};

/**
 *
 * @param {import('./Key.js').Key} key
 * @param {import('./Key.js').Key} primaryKey
 * @this {IDBCursorFull}
 * @returns {void}
 */
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

    /**
     * @returns {void}
     */
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

/**
 *
 * @param {Integer} count
 * @this {IDBCursorFull}
 * @returns {void}
 */
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

/**
 * @typedef {any} AnyValue
 */

/**
 *
 * @param {AnyValue} valueToUpdate
 * @this {IDBCursorFull}
 * @returns {IDBRequest}
 */
IDBCursor.prototype.update = function (valueToUpdate) {
    const me = this;
    if (!arguments.length) {
        throw new TypeError('A value must be passed to update()');
    }
    IDBTransaction.__assertActive(me.__store.transaction);
    /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
        me.__store.transaction
    ).__assertWritable();
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (me.__keyOnly) {
        throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
    }
    const request = /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
        me.__store.transaction
    ).__createRequest(me);
    const key = me.primaryKey;

    /**
     * @param {import('./Key.js').Value} clonedValue
     * @returns {void}
     */
    function addToQueue (clonedValue) {
        // We set the `invalidateCache` argument to `false` since the old value shouldn't be accessed
        IDBObjectStore.__storingRecordObjectStore(request, me.__store, false, clonedValue, false, key);
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

/**
 * @this {IDBCursorFull}
 * @returns {IDBRequest}
 */
IDBCursor.prototype.delete = function () {
    const me = this;
    IDBTransaction.__assertActive(me.__store.transaction);
    /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
        me.__store.transaction
    ).__assertWritable();
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (me.__keyOnly) {
        throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
    }
    return /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (
        this.__store.transaction
    ).__addToTransactionQueue(function cursorDelete (tx, args, success, error) {
        me.__find(
            undefined, undefined, tx,
            /** @type {KeySuccess} */
            function (key, value, primaryKey) {
                const sql = 'DELETE FROM  ' + util.escapeStoreNameForSQL(me.__store.__currentName) + ' WHERE "key" = ?';
                if (CFG.DEBUG) { console.log(sql, key, primaryKey); }
                // Key.convertValueToKey(primaryKey); // Already checked when entered
                tx.executeSql(sql, [util.escapeSQLiteStatement(
                    /** @type {string} */ (Key.encode(primaryKey))
                )], function (tx, data) {
                    if (data.rowsAffected === 1) {
                        // We don't invalidate the cache (as we don't access it anymore
                        //    and it will set the index off)
                        success(undefined);
                    } else {
                        // @ts-expect-error Apparently ok
                        error('No rows with key found' + key);
                    }
                }, function (tx, data) {
                    error(data);
                    return false;
                });
            }, error
        );
    }, undefined, me);
};

IDBCursor.prototype[Symbol.toStringTag] = 'IDBCursorPrototype';

util.defineReadonlyOuterInterface(
    IDBCursor.prototype,
    ['source', 'direction', 'key', 'primaryKey', 'request']
);
Object.defineProperty(IDBCursor, 'prototype', {
    writable: false
});

/**
 * @class
 */
function IDBCursorWithValue () {
    throw new TypeError('Illegal constructor');
}

// @ts-expect-error It's ok
IDBCursorWithValue.prototype = Object.create(IDBCursor.prototype);
Object.defineProperty(IDBCursorWithValue.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: IDBCursorWithValue
});

const IDBCursorWithValueAlias = IDBCursorWithValue;
/**
 *
 * @param {...any} args
 * @returns {IDBCursorWithValueFull}
 */
IDBCursorWithValue.__createInstance = function (...args) {
    /**
     * @class
     * @this {IDBCursorWithValueFull}
     */
    function IDBCursorWithValue () {
        const [query, direction, store, source, keyColumnName, valueColumnName, count] = args;
        IDBCursor.__super.call(this, query, direction, store, source, keyColumnName, valueColumnName, count);
        // @ts-expect-error It's ok
        this[Symbol.toStringTag] = 'IDBCursorWithValue';
        util.defineReadonlyProperties(this, 'value');
    }
    IDBCursorWithValue.prototype = IDBCursorWithValueAlias.prototype;

    // @ts-expect-error It's ok
    return new IDBCursorWithValue();
};

util.defineReadonlyOuterInterface(IDBCursorWithValue.prototype, ['value']);

IDBCursorWithValue.prototype[Symbol.toStringTag] = 'IDBCursorWithValuePrototype';

Object.defineProperty(IDBCursorWithValue, 'prototype', {
    writable: false
});

export {IDBCursor, IDBCursorWithValue};

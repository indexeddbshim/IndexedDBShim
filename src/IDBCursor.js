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
import IDBRecord from './IDBRecord.js';

const cursorDirections = ['next', 'prev', 'nextunique', 'prevunique'];

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {import('websql-configurable/lib/websql/WebSQLTransaction.js').default} WebSQLTransaction
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
 *   __prefetchedData: null|{
 *     length: number;
 *     item(index: number): any;
 *   }|{
 *     data: RowItemNonNull[],
 *     length: Integer,
 *     item: (index: Integer) => RowItemNonNull
 *   },
 *   __multiEntryIndex: boolean,
 *   __unique: boolean,
 *   __sqlDirection: "DESC"|"ASC",
 *   __matchedKeys: {[key: string]: true},
 *   __continuationKey: import('./Key.js').Key|undefined,
 *   __continuationPrimaryKey: import('./Key.js').Key|undefined,
 *   __multiEntryExhausted: boolean,
 *   __invalidateCache: () => void,
 *   __gotValue: boolean,
 *   __find: (...args: any[]) => void,
 *   __findBasic: (
 *     key: import('./Key.js').Key|undefined,
 *     primaryKey: import('./Key.js').Key|undefined,
 *     tx: WebSQLTransaction,
 *     success: KeySuccess,
 *     error: FindError,
 *     recordsToLoad: Integer|undefined
 *   ) => void,
 *   __findMultiEntry: (
 *     key: import('./Key.js').Key|undefined,
 *     primaryKey: import('./Key.js').Key|undefined,
 *     tx: WebSQLTransaction,
 *     success: KeySuccess,
 *     error: FindError,
 *     recordsToLoad?: Integer
 *   ) => void,
 *   __onsuccess: (success: SuccessArg) => SuccessCallback,
 *   __decode: (
 *     rowItem: RowItemNonNull,
 *     callback: (
 *       key: import('./Key.js').Key,
 *       val: import('./Key.js').Value,
 *       primaryKey: import('./Key.js').Key,
 *       encKey?: string
 *     ) => void
 *   ) => void,
 *   __sourceOrEffectiveObjStoreDeleted: () => void,
 *   __continue: (key?: import('./Key.js').Key, advanceContinue?: boolean) => void,
 *   __continueFinish: (
 *     key: import('./Key.js').Key,
 *     primaryKey: import('./Key.js').Key,
 *     advanceState: boolean
 *   ) => void
 * }} IDBCursorFull
 */

/**
 * @typedef {IDBCursorFull & {
 *   __request: import('./IDBRequest.js').IDBRequestFull,
 *   value: import('./Key.js').Value,
 * }} IDBCursorWithValueFull
 */

/**
 * @class
 * @throws {TypeError}
 */
function IDBCursor () {
    throw new TypeError('Illegal constructor');
}
const IDBCursorAlias = IDBCursor;

/* eslint-disable func-name-matching -- API */
/**
 * The IndexedDB Cursor Object.
 * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
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
    if (direction !== undefined && !cursorDirections.includes(direction)) {
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
    this.__continuationKey = undefined;
    this.__continuationPrimaryKey = undefined;
    this.__multiEntryExhausted = false;
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
    const [key, primaryKey, tx, success, error, recordsToLoad] = args;
    if (this.__multiEntryIndex) {
        this.__findMultiEntry(key, primaryKey, tx, success, error, recordsToLoad);
    } else {
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
 * @typedef {(tx: WebSQLTransaction|Error|DOMException|(Error & {code?: number}), err?: (Error & {code?: number})) => void} FindError
 */

/**
 *
 * @param {undefined|import('./Key.js').Key} key
 * @param {undefined|import('./Key.js').Key} primaryKey
 * @param {WebSQLTransaction} tx
 * @param {KeySuccess} success
 * @param {FindError} error
 * @param {Integer|undefined} recordsToLoad
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__findBasic = function (key, primaryKey, tx, success, error, recordsToLoad) {
    const continueCall = recordsToLoad !== undefined;
    recordsToLoad ||= 1;

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
        // Key.convertValueToKey(me.__key); // Already checked when stored
        if (!me.__unique && me.__keyColumnName !== 'key' && me.__primaryKey !== undefined) {
            // A plain `continue()` on a non-unique index cursor must find
            //   the next record strictly after the (key, primaryKey) pair
            //   this cursor last returned -- a scalar `key > lastKey` alone
            //   would wrongly exclude a *different*, not-yet-visited record
            //   that's still tied on key with the last one (e.g. another
            //   record that always had that same indexed value), and would
            //   also wrongly re-admit the *same* record forever if a
            //   same-transaction `update()` bumped its own key back above
            //   the threshold, since a scalar comparison can't distinguish
            //   "some other record newly tied" from "this record moved
            //   past its own last position." Comparing the full tuple (via
            //   this OR) against both key and primary key resolves both.
            sql.push(
                'AND (', quotedKeyColumnName, op, '?',
                'OR (', quotedKeyColumnName, '= ?', 'AND', quotedKey, op, '?))'
            );
            sqlValues.push(
                /** @type {string} */ (Key.encode(me.__key)),
                /** @type {string} */ (Key.encode(me.__key)),
                /** @type {string} */ (Key.encode(me.__primaryKey))
            );
        } else {
            sql.push('AND', quotedKeyColumnName, op + ' ?');
            sqlValues.push(/** @type {string} */ (Key.encode(me.__key)));
        }
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
            me.__decode(/** @type {RowItemNonNull} */ (data.rows.item(0)), success);
        } else if (data.rows.length === 1) {
            me.__decode(/** @type {RowItemNonNull} */ (data.rows.item(0)), success);
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
 * @param {WebSQLTransaction} tx
 * @param {KeySuccess} success
 * @param {FindError} error
 * @param {Integer} [recordsToLoad]
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__findMultiEntry = function (key, primaryKey, tx, success, error, recordsToLoad = 1) {
    const me = this;

    if (me.__multiEntryExhausted) {
        if (CFG.DEBUG) { console.log('[multiEntry] Reached end of multiEntry cursor (already exhausted)'); }
        success(undefined, undefined, undefined);
        return;
    }

    const quotedKeyColumnName = util.sqlQuote(me.__keyColumnName);
    const quotedKey = util.sqlQuote('key');

    // Determine the ORDER BY direction based on the cursor.
    const direction = me.__sqlDirection;
    const op = direction === 'ASC' ? '>' : '<';

    /**
     * Runs (and, if a batch of underlying rows produces no matching
     * multi-entry values, repeatedly re-runs) the query for the next batch
     * of underlying rows, advancing `me.__continuationKey`/
     * `me.__continuationPrimaryKey` (tracking the last *physical* row
     * scanned) each time, until either some matches are found or the
     * underlying table is exhausted.
     * @returns {void}
     */
    function runQuery () {
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

        if (primaryKey !== undefined) {
            sql.push('AND', quotedKey, op + '= ?');
            // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
            sqlValues.push(/** @type {string} */ (Key.encode(primaryKey)));
        }
        if (key !== undefined) {
            sql.push('AND', quotedKeyColumnName, op + '= ?');
            // Key.convertValueToKey(key); // Already checked by `continue` or `continuePrimaryKey`
            sqlValues.push(/** @type {string} */ (Key.encode(key)));
        } else if (me.__continuationKey !== undefined) {
            // Resume from the last underlying (physical) row we scanned, not
            // from the last *matching* multi-entry value (which lives in a
            // different key-space than the raw index column and cannot be
            // reliably compared against it, e.g. for array index keys).
            sql.push(
                'AND (', quotedKeyColumnName, op, '?',
                'OR (', quotedKeyColumnName, '= ?', 'AND', quotedKey, op, '?))'
            );
            const encodedContinuationKey = /** @type {string} */ (
                Key.encode(me.__continuationKey, true)
            );
            sqlValues.push(
                encodedContinuationKey,
                encodedContinuationKey,
                /** @type {string} */ (Key.encode(me.__continuationPrimaryKey))
            );
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
        if (CFG.DEBUG) { console.log('[multiEntry] query', sqlStr, sqlValues); }

        tx.executeSql(sqlStr, sqlValues, function (tx, data) {
            if (data.rows.length === 0) {
                me.__multiEntryExhausted = true;
                if (CFG.DEBUG) { console.log('[multiEntry] Reached end of multiEntry cursor (no more rows)'); }
                success(undefined, undefined, undefined);
                return;
            }

            if (me.__count) { // Avoid caching and other processing below
                let ct = 0;
                for (let i = 0; i < data.rows.length; i++) {
                    const rowItem = /** @type {RowItemNonNull} */ (data.rows.item(i));
                    const rowKey = Key.decode(rowItem[me.__keyColumnName], true);
                    const matches = Key.findMultiEntryMatches(rowKey, me.__range);
                    ct += matches.length;
                }
                success(undefined, ct, undefined);
                return;
            }

            // Track how far we've physically scanned, regardless of whether
            // this batch produced any matches, so the next batch (if any)
            // resumes after this one instead of re-scanning or stopping early.
            const lastRawRow = /** @type {RowItemNonNull} */ (data.rows.item(data.rows.length - 1));
            me.__continuationKey = Key.decode(lastRawRow[me.__keyColumnName], true);
            me.__continuationPrimaryKey = Key.decode(lastRawRow.key);
            if (data.rows.length < recordsToLoad) {
                me.__multiEntryExhausted = true;
            }

            const rows = [];
            for (let i = 0; i < data.rows.length; i++) {
                const rowItem = /** @type {RowItemNonNull} */ (data.rows.item(i));
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
                        key: rowItem.key,
                        [me.__keyColumnName]: rowItem[me.__keyColumnName],
                        [me.__valueColumnName]: rowItem[me.__valueColumnName]
                    };
                    rows.push(clone);
                }
            }

            if (rows.length === 0) {
                if (me.__multiEntryExhausted) {
                    if (CFG.DEBUG) { console.log('[multiEntry] Reached end of multiEntry cursor (last batch had no matches)'); }
                    success(undefined, undefined, undefined);
                    return;
                }
                if (CFG.DEBUG) { console.log('[multiEntry] batch had no matches; fetching next batch'); }
                runQuery();
                return;
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

            me.__prefetchedIndex = 0;
            me.__prefetchedData = {
                data: rows,
                length: rows.length,
                /**
                 * @param {Integer} index
                 * @this {{data: RowItemNonNull[]}}
                 * @returns {RowItemNonNull}
                 */
                item (index) {
                    return this.data[index];
                }
            };
            if (CFG.DEBUG) { console.log('[multiEntry] Preloaded ' + me.__prefetchedData.length + ' records for multiEntry cursor'); }
            me.__decode(rows[0], success);
        }, function (tx, err) {
            if (CFG.DEBUG) { console.log('[multiEntry] Could not execute Cursor.continue', sqlStr, sqlValues); }
            error(err);
            return false;
        });
    }

    runQuery();
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
        if (me.__matchedKeys[rowItem.matchingKey] === true) {
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
    // @ts-ignore Why is this not being found?; needed under some TS versions
    this.__prefetchedData = null;
    this.__multiEntryExhausted = false;
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
                    me.__sourceOrEffectiveObjStoreDeleted();
                    // This is an internal continuation step within a single
                    //   `advance()` call, not a fresh user-facing dispatch --
                    //   it's already part of an in-flight, already-validated
                    //   operation, so briefly reopen the active-handler
                    //   window `__pushToQueue` (via `__continueFinish`)
                    //   checks, rather than routing back through the public
                    //   `__continue()` (which would apply that check as if
                    //   this were new activity from user code).
                    const {transaction} = /** @type {{transaction: import('./IDBTransaction.js').IDBTransactionFull}} */ (
                        me.__store
                    );
                    // `runQueuedRequest` (in `IDBTransaction.js`) resets both
                    //   `__active` and `__handlerActive` to `false` right
                    //   before invoking this op, so both -- not just
                    //   `__handlerActive` -- need reopening here for
                    //   `__pushToQueue`'s `__assertActive()` check below to
                    //   pass.
                    transaction.__active = true;
                    transaction.__handlerActive = true;
                    me.__continueFinish(undefined, undefined, true);
                    transaction.__active = false;
                    transaction.__handlerActive = false;
                    // We don't call success yet but do need to advance the transaction queue
                    util.runContinuationSafely(/** @type {() => void} */ (executeNextRequest));
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
                        if (key === undefined) {
                            // No target key to compare against -- always accept the next
                            //   prefetched record, regardless of direction.
                            triggerSuccess(k, val, primKey);
                            return;
                        }
                        // `cmp(k, key) > 0` ("has this record passed the target key?")
                        //   only holds for an ascending (`next`) cursor; a descending
                        //   (`prev`) one passes the target once `k` has dropped *below*
                        //   it, i.e. `cmp(k, key) < 0` -- matching `continuePrimaryKey`'s
                        //   own direction-aware comparisons above.
                        const isPrev = me.direction.includes('prev');
                        const keyCmp = cmp(k, key);
                        const passedKey = isPrev ? keyCmp < 0 : keyCmp > 0;
                        const atKey = keyCmp === 0;
                        if (passedKey || (
                            atKey && (
                                me.__unique || primaryKey === undefined ||
                                (isPrev ? cmp(primKey, primaryKey) <= 0 : cmp(primKey, primaryKey) >= 0)
                            )
                        )) {
                            triggerSuccess(k, val, primKey);
                            return;
                        }
                        // @ts-expect-error Todo: Our bug to fix
                        util.runContinuationSafely(() => cursorContinue(tx, args, success, error));
                    }
                    if (me.__multiEntryIndex && me.__unique && encKey === undefined) {
                        // `__decode` found this row's matching key already seen
                        //   (tracked via `__matchedKeys`) and signaled a skip by
                        //   omitting `encKey`; move on to the next prefetched
                        //   row instead of treating the missing key as the end
                        //   of the cursor.
                        // @ts-expect-error Todo: Our bug to fix
                        util.runContinuationSafely(() => cursorContinue(tx, args, success, error));
                        return;
                    }
                    if (me.__unique && !me.__multiEntryIndex &&
                        encKey === Key.encode(me.key, me.__multiEntryIndex)) {
                        // @ts-expect-error Todo: Our bug to fix
                        util.runContinuationSafely(() => cursorContinue(tx, args, success, error));
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
        // `invalidateCache: true` so any cursor on this store (including
        //   this one) drops its prefetched row batch, forcing its next
        //   `continue()` to re-query live rather than serve rows snapshotted
        //   before this update -- needed for the compound-tuple
        //   continuation logic in `__findBasic` to see this update's
        //   effect on ordering (see "Modify records during cursor
        //   iteration" in idbcursor_update_index.any.js).
        // @ts-ignore -- API (not erring in TS 6)
        IDBObjectStore.__storingRecordObjectStore(request, me.__store, true, clonedValue, false, key);
    }
    if (me.__store.keyPath !== null) {
        const [evaluatedKey, clonedValue] = me.__store.__validateKeyAndValueAndCloneValue(valueToUpdate, undefined, true);
        if (cmp(me.primaryKey, evaluatedKey) !== 0) {
            throw createDOMException('DataError', 'The key of the supplied value to `update` is not equal to the cursor\'s effective key');
        }
        // eslint-disable-next-line unicorn/prefer-hoisting-branch-code -- Different
        addToQueue(clonedValue);
    } else {
        const clonedValue = Sca.cloneWithInactiveTransaction(
            /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (me.__store.transaction),
            valueToUpdate
        );
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

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
util.defineReadonlyOuterInterface(
    IDBCursor.prototype,
    ['source', 'direction', 'key', 'primaryKey', 'request']
);
util.setOperationNames(IDBCursor.prototype);
Object.defineProperty(IDBCursor, 'prototype', {
    writable: false
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

/**
 * @class
 * @throws {TypeError}
 */
function IDBCursorWithValue () {
    throw new TypeError('Illegal constructor');
}

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
// @ts-expect-error It's ok
IDBCursorWithValue.prototype = Object.create(IDBCursor.prototype);
Object.defineProperty(IDBCursorWithValue.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: IDBCursorWithValue
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

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

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
util.defineReadonlyOuterInterface(IDBCursorWithValue.prototype, ['value']);
IDBCursorWithValue.prototype[Symbol.toStringTag] = 'IDBCursorWithValuePrototype';

Object.defineProperty(IDBCursorWithValue, 'prototype', {
    writable: false
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

/**
 * Validates `direction` and fills in defaults for the `{query, count,
 *   direction}` shape shared by `getAll`/`getAllKeys`/`getAllRecords`.
 * @param {AnyValue} options
 * @throws {TypeError}
 * @returns {{query: AnyValue, count: Integer|undefined, direction: string}}
 */
function normalizeGetAllOptions (options) {
    const {query, count, direction = 'next'} = /** @type {AnyValue} */ (options ?? {});
    if (!cursorDirections.includes(direction)) {
        throw new TypeError('`' + direction + '` is not a valid direction');
    }
    return {query, count, direction};
}

/**
 * `getAll`/`getAllKeys` accept either the legacy `(query, count)` signature
 *   or, per the IndexedDB 3 draft's `getAllRecords` options shape, a single
 *   `{query, count, direction}` options object -- including an *empty*
 *   `{}` (WPT's own tests call `getAll({})` expecting every record back,
 *   the same as `getAll()`, not a `DataError` from treating `{}` as an
 *   invalid key). A plain object is never a valid IndexedDB key (or key
 *   range), so the two forms can be told apart unambiguously by the shape
 *   of the first argument alone -- WPT's own `get_all_with_options_and_count_test`
 *   deliberately calls `getAll(options, count)` (an extra, non-overload-matching
 *   second argument, which JS simply ignores) to confirm the options-shaped
 *   first argument wins regardless of how many arguments were actually passed.
 * @param {IArguments} args
 * @throws {TypeError}
 * @returns {{query: AnyValue, count: Integer|undefined, direction: string}}
 */
function parseGetAllArgs (args) {
    const arg0 = args[0];
    if (util.isObj(arg0) && !Array.isArray(arg0) && !util.isDate(arg0) &&
        !util.isBinary(arg0) &&
        !('upper' in arg0 && 'lowerOpen' in arg0 && typeof arg0.lowerOpen === 'boolean') // IDBKeyRange-like
    ) {
        return normalizeGetAllOptions(arg0);
    }
    const [query, count] = args;
    return normalizeGetAllOptions({query, count});
}

/**
 * `getAllRecords` (IndexedDB 3.0) takes a single, optional `IDBGetAllOptions`
 *   dictionary -- `{query, count, direction}` -- with no legacy positional
 *   form to disambiguate against.
 * @param {IArguments} args
 * @throws {TypeError}
 * @returns {{query: AnyValue, count: Integer|undefined, direction: string}}
 */
function parseGetAllRecordsArgs (args) {
    return normalizeGetAllOptions(args[0]);
}

/**
 * Shared implementation backing `getAll`/`getAllKeys`/`getAllRecords` on both
 *   `IDBObjectStore` and `IDBIndex`. This walks a `find`/`decode` state
 *   object using the exact same low-level primitives
 *   (`__find`/`__findBasic`/`__findMultiEntry`/`__decode`) a real cursor's
 *   `continue()` uses internally, so ordering and uniqueness semantics --
 *   including `nextunique`/`prevunique` over `multiEntry` indexes -- always
 *   match what iterating that same cursor manually would produce.
 *
 * Unlike a real cursor, none of the intermediate steps go through the
 *   transaction's shared request queue (`__pushToQueue`): each step re-enters
 *   the same queue slot's op function via a plain synchronous/callback chain
 *   and only calls the queue's real `success` once, when every record has
 *   been collected. This makes the whole operation occupy exactly one slot,
 *   at its true issuance position, so its result event can't be reordered
 *   relative to sibling requests queued around the same time -- which
 *   driving this through the public, queue-based `openCursor()`/`continue()`
 *   API (as this used to) cannot guarantee, since each subsequent `continue()`
 *   step is appended to the end of the (by-then-longer) queue rather than
 *   staying next to the steps before it.
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull|
 *   import('./IDBIndex.js').IDBIndexFull} source
 * @param {import('./Key.js').Value} query
 * @param {Integer|undefined} count
 * @param {string} direction
 * @param {"value"|"key"|"record"} mode
 * @throws {TypeError}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
function collectAll (source, query, count, direction, mode) {
    const isIndexSource = util.instanceOf(source, IDBIndex);
    if (!isIndexSource && !util.instanceOf(source, IDBObjectStore)) {
        // Per Web IDL, an operation invoked on a `this` that isn't an
        //   instance of the interface it's defined on must throw a
        //   TypeError ("illegal invocation") -- checked here, rather than
        //   left to fall through to `store.transaction`/`__assertActive`
        //   below, since those instead throw `TransactionInactiveError`
        //   for a `this` with no real `transaction` property.
        throw new TypeError('Illegal invocation');
    }
    if (count !== undefined) {
        count = util.enforceRange(count, 'unsigned long');
    }
    const indexSource = /** @type {import('./IDBIndex.js').IDBIndexFull} */ (source);
    const store = /** @type {import('./IDBObjectStore.js').IDBObjectStoreFull} */ (
        isIndexSource ? indexSource.objectStore : source
    );
    const tx = /** @type {import('./IDBTransaction.js').IDBTransactionFull} */ (store.transaction);

    IDBObjectStore.__invalidStateIfDeleted(store);
    if (isIndexSource) {
        IDBIndex.__invalidStateIfDeleted(indexSource);
    }
    IDBTransaction.__assertActive(tx);
    const range = convertValueToKeyRange(query);
    const multiEntryIndex = isIndexSource && Boolean(indexSource.multiEntry);
    if (range !== undefined) {
        // Encode the key range and cache the encoded values, matching what a
        //   real cursor's constructor does, since `__findMultiEntry` reads
        //   these cached values back off the range.
        range.__lowerCached = range.lower !== undefined && Key.encode(range.lower, multiEntryIndex);
        range.__upperCached = range.upper !== undefined && Key.encode(range.upper, multiEntryIndex);
    }

    // `getAllRecords` needs each record's value, so it (like `getAll`) must
    //   decode the `value` column rather than the lighter-weight `key`-only
    //   reads `getAllKeys` can get away with.
    const needsValue = mode !== 'key';
    const keyColumnName = isIndexSource ? util.escapeIndexNameForSQLKeyColumn(indexSource.name) : 'key';
    const valueColumnName = needsValue ? 'value' : 'key';

    // Inherits from `IDBCursor.prototype` (rather than being a plain object)
    //   because `__find` dispatches to `this.__findBasic`/`this.__findMultiEntry`
    //   as methods on `this`, not as functions looked up separately.
    /** @type {IDBCursorFull} */
    const state = /** @type {IDBCursorFull} */ (/** @type {unknown} */ (Object.assign(Object.create(IDBCursor.prototype), {
        __store: store,
        __indexSource: isIndexSource,
        __range: range,
        __keyColumnName: keyColumnName,
        __valueColumnName: valueColumnName,
        __valueDecoder: valueColumnName === 'key' ? Key : Sca,
        __count: false,
        __prefetchedIndex: -1,
        __prefetchedData: null,
        __continuationKey: undefined,
        __continuationPrimaryKey: undefined,
        __multiEntryExhausted: false,
        __multiEntryIndex: multiEntryIndex,
        __unique: direction.includes('unique'),
        __sqlDirection: ['prev', 'prevunique'].includes(direction) ? 'DESC' : 'ASC',
        __key: undefined
    })));
    // `direction` (unlike the `__`-prefixed internals above) is exposed as a
    //   readonly getter on `IDBCursor.prototype` (via `defineReadonlyOuterInterface`)
    //   that throws unless shadowed by an own property, exactly as a real
    //   cursor's constructor shadows it -- a plain assignment would instead
    //   hit that inherited accessor, which has no setter.
    Object.defineProperty(state, 'direction', {writable: false, value: direction});

    return tx.__addToTransactionQueue(function collectAllOp (sqlTx, args, success, error) {
        /** @type {AnyValue[]} */
        const results = [];
        const recordsToLoad = count || CFG.cursorPreloadPackSize || 100;

        /**
         * @param {import('./Key.js').Key} k
         * @param {import('./Key.js').Value} val
         * @param {import('./Key.js').Key} primKey
         * @returns {void}
         */
        function acceptOrFinish (k, val, primKey) {
            if (k === undefined) {
                success(results);
                return;
            }
            state.__key = k;
            switch (mode) {
            case 'key':
                results.push(primKey);
                break;
            case 'record':
                results.push(IDBRecord.__createInstance(k, primKey, val));
                break;
            default:
                results.push(val);
            }
            if (count && results.length >= count) {
                success(results);
                return;
            }
            util.runContinuationSafely(step);
        }

        /**
         * @returns {void}
         */
        function step () {
            if (state.__prefetchedData) {
                state.__prefetchedIndex++;
                if (state.__prefetchedIndex < state.__prefetchedData.length) {
                    IDBCursor.prototype.__decode.call(
                        state, state.__prefetchedData.item(state.__prefetchedIndex),
                        /**
                         * @param {import('./Key.js').Key} k
                         * @param {import('./Key.js').Value} val
                         * @param {import('./Key.js').Key} primKey
                         * @param {string} [encKey]
                         * @returns {void}
                         */
                        function (k, val, primKey, encKey) {
                            if (state.__multiEntryIndex && state.__unique && encKey === undefined) {
                                // `__decode` already saw this matching key (tracked
                                //   via `__matchedKeys`) and signaled a skip.
                                util.runContinuationSafely(step);
                                return;
                            }
                            if (state.__unique && !state.__multiEntryIndex &&
                                encKey === Key.encode(state.__key, state.__multiEntryIndex)) {
                                util.runContinuationSafely(step);
                                return;
                            }
                            acceptOrFinish(k, val, primKey);
                        }
                    );
                    return;
                }
            }
            IDBCursor.prototype.__find.call(
                state, undefined, undefined, sqlTx, acceptOrFinish, error, recordsToLoad
            );
        }

        step();
    }, undefined, source);
}

export {IDBCursor, IDBCursorWithValue, parseGetAllArgs, parseGetAllRecordsArgs, collectAll};

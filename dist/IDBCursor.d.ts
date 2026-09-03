export type Integer = number;
export type WebSQLTransaction = import("websql-configurable/lib/websql/WebSQLTransaction.js").default;
export type IDBCursorFull = IDBCursor & {
    primaryKey: import("./Key.js").Key | undefined;
    key: import("./Key.js").Key | undefined;
    direction: string;
    source: import("./IDBObjectStore.js").IDBObjectStoreFull | import("./IDBIndex.js").IDBIndexFull;
    __request: import("./IDBRequest.js").IDBRequestFull;
    __advanceCount: Integer | undefined;
    __indexSource: boolean;
    __key: import("./Key.js").Key | undefined;
    __primaryKey: import("./Key.js").Key | undefined;
    __value: import("./Key.js").Value;
    __store: import("./IDBObjectStore.js").IDBObjectStoreFull;
    __range: import("./IDBKeyRange.js").IDBKeyRangeFull | undefined;
    __keyColumnName: string;
    __valueColumnName: string;
    __keyOnly: boolean;
    __valueDecoder: {
        decode: (str: string) => import("./Key.js").Value;
    };
    __count: boolean;
    __prefetchedIndex: Integer;
    __prefetchedData: null | {
        length: number;
        item(index: number): unknown;
    } | {
        data: RowItemNonNull[];
        length: Integer;
        item: (index: Integer) => RowItemNonNull;
    };
    __multiEntryIndex: boolean;
    __unique: boolean;
    __sqlDirection: "DESC" | "ASC";
    __matchedKeys: {
        [key: string]: true;
    };
    __continuationKey: import("./Key.js").Key | undefined;
    __continuationPrimaryKey: import("./Key.js").Key | undefined;
    __multiEntryExhausted: boolean;
    __invalidateCache: () => void;
    __gotValue: boolean;
    __find: (key: import("./Key.js").Key | undefined, primaryKey: import("./Key.js").Key | undefined, tx: WebSQLTransaction, success: KeySuccess, error: FindError, recordsToLoad?: Integer) => void;
    __findBasic: (key: import("./Key.js").Key | undefined, primaryKey: import("./Key.js").Key | undefined, tx: WebSQLTransaction, success: KeySuccess, error: FindError, recordsToLoad: Integer | undefined) => void;
    __findMultiEntry: (key: import("./Key.js").Key | undefined, primaryKey: import("./Key.js").Key | undefined, tx: WebSQLTransaction, success: KeySuccess, error: FindError, recordsToLoad?: Integer) => void;
    __onsuccess: (success: SuccessArg) => SuccessCallback;
    __decode: (rowItem: RowItemNonNull, callback: (key: import("./Key.js").Key, val: import("./Key.js").Value, primaryKey: import("./Key.js").Key, encKey?: string) => void) => void;
    __sourceOrEffectiveObjStoreDeleted: () => void;
    __continue: (key?: import("./Key.js").Key, advanceContinue?: boolean) => void;
    __continueFinish: (key: import("./Key.js").Key, primaryKey: import("./Key.js").Key, advanceState: boolean) => void;
};
export type IDBCursorWithValueFull = IDBCursorFull & {
    __request: import("./IDBRequest.js").IDBRequestFull;
    value: import("./Key.js").Value;
};
export type KeySuccess = (k: import("./Key.js").Key, val: import("./Key.js").Value, primKey: import("./Key.js").Key) => void;
export type FindError = (tx: WebSQLTransaction | Error | DOMException | (Error & {
    code?: number;
}), err?: (Error & {
    code?: number;
})) => void;
export type StructuredCloneValue = import("./Key.js").Value;
export type IndexedDBKey = import("./Key.js").Key;
export type SuccessArg = (value: StructuredCloneValue, req: import("./IDBRequest.js").IDBRequestFull) => void;
export type SuccessCallback = (key: IndexedDBKey, value: StructuredCloneValue, primaryKey: IndexedDBKey) => void;
export type RowItemNonNull = {
    matchingKey: string;
    key: string;
    [k: string]: string;
};
/**
 * The `{query, count, direction}` options shape shared by
 *   `getAll`/`getAllKeys`/`getAllRecords`.
 */
export type GetAllOptions = {
    query?: import("./Key.js").Value;
    count?: Integer;
    direction?: string;
};
/**
 * @typedef {number} Integer
 */
/**
 * @typedef {import('websql-configurable/lib/websql/WebSQLTransaction.js').default} WebSQLTransaction
 */
/**
 * @typedef {IDBCursor & {
 *   primaryKey: import('./Key.js').Key|undefined,
 *   key:  import('./Key.js').Key|undefined,
 *   direction: string,
 *   source: import('./IDBObjectStore.js').IDBObjectStoreFull|
 *     import('./IDBIndex.js').IDBIndexFull,
 *   __request: import('./IDBRequest.js').IDBRequestFull,
 *   __advanceCount: Integer|undefined,
 *   __indexSource: boolean,
 *   __key: import('./Key.js').Key|undefined,
 *   __primaryKey: import('./Key.js').Key|undefined,
 *   __value: import('./Key.js').Value,
 *   __store: import('./IDBObjectStore.js').IDBObjectStoreFull,
 *   __range: import('./IDBKeyRange.js').IDBKeyRangeFull|undefined,
 *   __keyColumnName: string,
 *   __valueColumnName: string,
 *   __keyOnly: boolean,
 *   __valueDecoder: {
 *     decode: (str: string) => import('./Key.js').Value,
 *   },
 *   __count: boolean,
 *   __prefetchedIndex: Integer,
 *   __prefetchedData: null|{
 *     length: number;
 *     item(index: number): unknown;
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
 *   __find: (
 *     key: import('./Key.js').Key|undefined,
 *     primaryKey: import('./Key.js').Key|undefined,
 *     tx: WebSQLTransaction,
 *     success: KeySuccess,
 *     error: FindError,
 *     recordsToLoad?: Integer
 *   ) => void,
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
export function IDBCursor(): void;
export class IDBCursor {
    /**
     *
     * @param {import('./Key.js').Key|undefined} key
     * @param {import('./Key.js').Key|undefined} primaryKey
     * @param {WebSQLTransaction} tx
     * @param {KeySuccess} success
     * @param {FindError} error
     * @param {Integer} [recordsToLoad]
     * @this {IDBCursorFull}
     * @returns {void}
     */
    __find(this: IDBCursorFull, key: import("./Key.js").Key | undefined, primaryKey: import("./Key.js").Key | undefined, tx: WebSQLTransaction, success: KeySuccess, error: FindError, recordsToLoad?: Integer): void;
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
    __findBasic(this: IDBCursorFull, key: undefined | import("./Key.js").Key, primaryKey: undefined | import("./Key.js").Key, tx: WebSQLTransaction, success: KeySuccess, error: FindError, recordsToLoad: Integer | undefined): void;
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
    __findMultiEntry(this: IDBCursorFull, key: undefined | import("./Key.js").Key, primaryKey: undefined | import("./Key.js").Key, tx: WebSQLTransaction, success: KeySuccess, error: FindError, recordsToLoad?: Integer): void;
    /**
     * @typedef {import('./Key.js').Value} StructuredCloneValue
     */
    /**
     * @typedef {import('./Key.js').Key} IndexedDBKey
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
    __onsuccess(this: IDBCursorFull, success: SuccessArg): SuccessCallback;
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
    __decode(this: IDBCursorFull, rowItem: RowItemNonNull, callback: (key: import("./Key.js").Key, val: import("./Key.js").Value, primaryKey: import("./Key.js").Key, encKey?: string) => void): void;
    /**
     * @this {IDBCursorFull}
     * @returns {void}
     */
    __sourceOrEffectiveObjStoreDeleted(this: IDBCursorFull): void;
    /**
     * @this {IDBCursorFull}
     * @returns {void}
     */
    __invalidateCache(this: IDBCursorFull): void;
    __prefetchedData: any;
    __multiEntryExhausted: boolean | undefined;
    /**
     *
     * @param {import('./Key.js').Key} [key]
     * @param {boolean} [advanceContinue]
     * @this {IDBCursorFull}
     * @returns {void}
     */
    __continue(this: IDBCursorFull, key?: import("./Key.js").Key, advanceContinue?: boolean): void;
    /**
     *
     * @param {import('./Key.js').Key} key
     * @param {import('./Key.js').Key} primaryKey
     * @param {boolean} advanceState
     * @this {IDBCursorFull}
     * @returns {void}
     */
    __continueFinish(this: IDBCursorFull, key: import("./Key.js").Key, primaryKey: import("./Key.js").Key, advanceState: boolean): void;
    __gotValue: boolean | undefined;
    /**
     * @this {IDBCursorFull}
     * @returns {void}
     */
    continue(this: IDBCursorFull, ...args: any[]): void;
    /**
     *
     * @param {import('./Key.js').Key} key
     * @param {import('./Key.js').Key} primaryKey
     * @this {IDBCursorFull}
     * @returns {void}
     */
    continuePrimaryKey(this: IDBCursorFull, key: import("./Key.js").Key, primaryKey: import("./Key.js").Key): void;
    /**
     *
     * @param {Integer} count
     * @this {IDBCursorFull}
     * @returns {void}
     */
    advance(this: IDBCursorFull, count: Integer): void;
    /**
     * The `{query, count, direction}` options shape shared by
     *   `getAll`/`getAllKeys`/`getAllRecords`.
     * @typedef {{
     *   query?: import('./Key.js').Value,
     *   count?: Integer,
     *   direction?: string
     * }} GetAllOptions
     */
    /**
     *
     * @param {import('./Key.js').Value} valueToUpdate
     * @this {IDBCursorFull}
     * @returns {IDBRequest}
     */
    update(this: IDBCursorFull, valueToUpdate: import("./Key.js").Value, ...args: any[]): IDBRequest;
    /**
     * @this {IDBCursorFull}
     * @returns {IDBRequest}
     */
    delete(this: IDBCursorFull): IDBRequest;
}
export namespace IDBCursor {
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
     * @param {boolean} [count]
     * @this {IDBCursorFull}
     * @returns {void}
     */
    function __super(this: IDBCursorFull, query: IDBKeyRange, direction: string, store: import("./IDBObjectStore.js").IDBObjectStoreFull, source: import("./IDBObjectStore.js").IDBObjectStoreFull | import("./IDBIndex.js").IDBIndexFull, keyColumnName: string, valueColumnName: string, count?: boolean): void;
    /**
     *
     * @param {IDBKeyRange} query
     * @param {string} direction
     * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
     * @param {import('./IDBObjectStore.js').IDBObjectStoreFull|
     *   import('./IDBIndex.js').IDBIndexFull} source
     * @param {string} keyColumnName
     * @param {string} valueColumnName
     * @param {boolean} [count]
     * @returns {IDBCursorFull}
     */
    function __createInstance(query: IDBKeyRange, direction: string, store: import("./IDBObjectStore.js").IDBObjectStoreFull, source: import("./IDBObjectStore.js").IDBObjectStoreFull | import("./IDBIndex.js").IDBIndexFull, keyColumnName: string, valueColumnName: string, count?: boolean): IDBCursorFull;
}
/**
 * @class
 * @throws {TypeError}
 */
export function IDBCursorWithValue(): void;
export class IDBCursorWithValue {
}
export namespace IDBCursorWithValue {
    /**
     *
     * @param {IDBKeyRange} query
     * @param {string} direction
     * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
     * @param {import('./IDBObjectStore.js').IDBObjectStoreFull|
     *   import('./IDBIndex.js').IDBIndexFull} source
     * @param {string} keyColumnName
     * @param {string} valueColumnName
     * @param {boolean} [count]
     * @returns {IDBCursorWithValueFull}
     */
    function __createInstance(query: IDBKeyRange, direction: string, store: import("./IDBObjectStore.js").IDBObjectStoreFull, source: import("./IDBObjectStore.js").IDBObjectStoreFull | import("./IDBIndex.js").IDBIndexFull, keyColumnName: string, valueColumnName: string, count?: boolean): IDBCursorWithValueFull;
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
 * @returns {{
 *   query: import('./Key.js').Value|undefined,
 *   count: Integer|undefined,
 *   direction: string
 * }}
 */
export function parseGetAllArgs(args: IArguments): {
    query: import("./Key.js").Value | undefined;
    count: Integer | undefined;
    direction: string;
};
/**
 * `getAllRecords` (IndexedDB 3.0) takes a single, optional `IDBGetAllOptions`
 *   dictionary -- `{query, count, direction}` -- with no legacy positional
 *   form to disambiguate against.
 * @param {IArguments} args
 * @throws {TypeError}
 * @returns {{
 *   query: import('./Key.js').Value|undefined,
 *   count: Integer|undefined,
 *   direction: string
 * }}
 */
export function parseGetAllRecordsArgs(args: IArguments): {
    query: import("./Key.js").Value | undefined;
    count: Integer | undefined;
    direction: string;
};
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
export function collectAll(source: import("./IDBObjectStore.js").IDBObjectStoreFull | import("./IDBIndex.js").IDBIndexFull, query: import("./Key.js").Value, count: Integer | undefined, direction: string, mode: "value" | "key" | "record"): import("./IDBRequest.js").IDBRequestFull;
import { IDBRequest } from './IDBRequest.js';
//# sourceMappingURL=IDBCursor.d.ts.map
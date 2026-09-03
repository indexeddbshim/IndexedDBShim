export default IDBTransaction;
export type Integer = number;
export type RequestInfo = {
    op: SQLCallback;
    args: unknown[];
    req: import("./IDBRequest.js").IDBRequestFull | null;
};
export type IDBTransactionFull = EventTarget & {
    mode: "readonly" | "readwrite" | "versionchange";
    durability: "default" | "strict" | "relaxed";
    db: import("./IDBDatabase.js").IDBDatabaseFull;
    on__abort: () => void;
    on__complete: () => void;
    on__beforecomplete: (ev: Event & {
        complete: () => void;
    }) => void;
    on__preabort: () => void;
    __abortTransaction: (err: Error | DOMException | null) => void;
    __executeRequests: () => void;
    __tx: import("websql-configurable/lib/websql/WebSQLTransaction.js").default;
    __id: Integer;
    __active: boolean;
    __handlerActive: boolean;
    __running: boolean;
    __errored: boolean;
    __committed: boolean;
    __requests: RequestInfo[];
    __db: import("./IDBDatabase.js").IDBDatabaseFull;
    __mode: string;
    __durability: string;
    __error: null | DOMException | Error;
    __objectStoreNames: import("./DOMStringList.js").DOMStringListFull;
    __storeHandles: {
        [key: string]: import("./IDBObjectStore.js").IDBObjectStoreFull;
    };
    __requestsFinished: boolean;
    __transFinishedCb: (err: boolean, cb: ((bool?: boolean) => void)) => void;
    __callTransFinishedCb: (err: boolean, cb: ((bool?: boolean) => void)) => void;
    __transactionEndCallback: (() => void) | undefined;
    __transactionFinished: boolean;
    __completed: boolean;
    __transFinishedCbFired: boolean;
    __internal: boolean;
    __abortFinished: boolean;
    __createRequest: (source: import("./IDBDatabase.js").IDBDatabaseFull | import("./IDBObjectStore.js").IDBObjectStoreFull | import("./IDBIndex.js").IDBIndexFull | import("./IDBCursor.js").IDBCursorFull) => import("./IDBRequest.js").IDBRequestFull;
    __pushToQueue: (request: import("./IDBRequest.js").IDBRequestFull | null, callback: SQLCallback, args?: unknown[]) => void;
    __assertActive: () => void;
    commit: () => void;
    __addNonRequestToTransactionQueue: (callback: SQLCallback, args?: unknown[]) => void;
    __addToTransactionQueue: (callback: SQLCallback, args: unknown[] | undefined, source: import("./IDBDatabase.js").IDBDatabaseFull | import("./IDBObjectStore.js").IDBObjectStoreFull | import("./IDBIndex.js").IDBIndexFull | import("./IDBCursor.js").IDBCursorFull) => import("./IDBRequest.js").IDBRequestFull;
    __assertWritable: () => void;
};
export type SQLCallback = (tx: import("websql-configurable/lib/websql/WebSQLTransaction.js").default, args: unknown[], success: (result?: unknown, req?: import("./IDBRequest.js").IDBRequestFull) => void, error: (tx: import("websql-configurable/lib/websql/WebSQLTransaction.js").default | Error | DOMException, err?: Error & {
    code?: number;
}) => void, executeNextRequest?: () => void) => void;
/**
 * The IndexedDB Transaction.
 * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
 * @class
 * @throws {TypeError}
 */
declare function IDBTransaction(): void;
declare class IDBTransaction {
    /**
     *
     * @param {boolean} err
     * @param {(bool: boolean) => void} cb
     * @returns {void}
     */
    __transFinishedCb(err: boolean, cb: (bool: boolean) => void): void;
    /**
     * In Node, the real (SQL-commit-capable) `__transFinishedCb` is only
     * installed once the underlying WebSQL driver's own SQL-queue-idle check
     * has fired at least once for this transaction (asynchronously, via the
     * `nonstandardTransCb` passed to `db.transaction`/`.readTransaction`).
     * Since our own request processing can now finish synchronously (e.g., a
     * trivial upgrade using a synchronous SQL driver), it is possible to reach
     * transaction completion here before that has happened, in which case
     * `__transFinishedCb` is still the non-committing default above. Calling
     * that default directly would silently skip the actual SQL commit and
     * leave the underlying WebSQL transaction "running" forever, hanging any
     * later transaction on that same database connection. So, if the real
     * callback isn't installed yet, defer and retry until it is.
     * @this {IDBTransactionFull}
     * @param {boolean} err
     * @param {(bool?: boolean) => void} cb
     * @returns {void}
     */
    __callTransFinishedCb(this: IDBTransactionFull, err: boolean, cb: (bool?: boolean) => void): void;
    __transFinishedCbFired: boolean | undefined;
    /**
     * @this {IDBTransactionFull}
     * @returns {void}
     */
    __executeRequests(this: IDBTransactionFull): void;
    __handlerActive: boolean | undefined;
    __running: boolean | undefined;
    /**
     * Creates a new IDBRequest for the transaction.
     * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}.
     * @param {import('./IDBDatabase.js').IDBDatabaseFull} source
     * @this {IDBTransactionFull}
     * @returns {IDBRequest}
     */
    __createRequest(this: IDBTransactionFull, source: import("./IDBDatabase.js").IDBDatabaseFull): IDBRequest;
    /**
     * @typedef {(
     *   tx: import('websql-configurable/lib/websql/WebSQLTransaction.js').default,
     *   args: unknown[],
     *   success: (result?: unknown, req?: import('./IDBRequest.js').IDBRequestFull) => void,
     *   error: (
     *     tx: import('websql-configurable/lib/websql/WebSQLTransaction.js').default|Error|DOMException,
     *     err?: Error & {code?: number}
     *   ) => void,
     *   executeNextRequest?: () => void
     * ) => void} SQLCallback
     */
    /**
     * Adds a callback function to the transaction queue.
     * @param {SQLCallback} callback
     * @param {unknown[]} args
     * @param {import('./IDBDatabase.js').IDBDatabaseFull|
     *   import('./IDBObjectStore.js').IDBObjectStoreFull|
     *   import('./IDBIndex.js').IDBIndexFull} source
     * @this {IDBTransactionFull}
     * @returns {import('./IDBRequest.js').IDBRequestFull}
     */
    __addToTransactionQueue(this: IDBTransactionFull, callback: SQLCallback, args: unknown[], source: import("./IDBDatabase.js").IDBDatabaseFull | import("./IDBObjectStore.js").IDBObjectStoreFull | import("./IDBIndex.js").IDBIndexFull): import("./IDBRequest.js").IDBRequestFull;
    /**
     * Adds a callback function to the transaction queue without generating a
     *   request.
     * @param {SQLCallback} callback
     * @param {unknown[]} args
     * @this {IDBTransactionFull}
     * @returns {void}
     */
    __addNonRequestToTransactionQueue(this: IDBTransactionFull, callback: SQLCallback, args: unknown[]): void;
    /**
     * Adds an IDBRequest to the transaction queue.
     * @param {import('./IDBRequest.js').IDBRequestFull|null} request
     * @param {SQLCallback} callback
     * @param {unknown[]} args
     * @this {IDBTransactionFull}
     * @returns {void}
     */
    __pushToQueue(this: IDBTransactionFull, request: import("./IDBRequest.js").IDBRequestFull | null, callback: SQLCallback, args: unknown[]): void;
    /**
     * @throws {DOMException}
     * @this {IDBTransactionFull}
     * @returns {void}
     */
    __assertActive(this: IDBTransactionFull): void;
    /**
     * @throws {DOMException}
     * @this {IDBTransactionFull}
     * @returns {void}
     */
    __assertWritable(this: IDBTransactionFull): void;
    /**
     * @this {IDBTransactionFull}
     * @returns {void}
     */
    __assertVersionChange(this: IDBTransactionFull): void;
    /**
     * Returns the specified object store.
     * @param {string} objectStoreName
     * @this {IDBTransactionFull}
     * @returns {IDBObjectStore}
     */
    objectStore(this: IDBTransactionFull, objectStoreName: string, ...args: any[]): IDBObjectStore;
    /**
     *
     * @param {Error|DOMException|null} err
     * @this {IDBTransactionFull}
     * @returns {void}
     */
    __abortTransaction(this: IDBTransactionFull, err: Error | DOMException | null): void;
    __errored: boolean | undefined;
    __active: boolean | undefined;
    /**
     * @this {IDBTransactionFull}
     * @returns {void}
     */
    abort(this: IDBTransactionFull): void;
    /**
     * @see https://www.w3.org/TR/IndexedDB/#dom-idbtransaction-commit
     * @this {IDBTransactionFull}
     * @returns {void}
     */
    commit(this: IDBTransactionFull): void;
    __committed: boolean | undefined;
    /**
     * Used by our `EventTarget.prototype` library to implement bubbling/capturing.
     * @this {IDBTransactionFull}
     * @returns {import('./IDBDatabase.js').IDBDatabaseFull}
     */
    __getParent(this: IDBTransactionFull): import("./IDBDatabase.js").IDBDatabaseFull;
}
declare namespace IDBTransaction {
    /**
     * @param {import('./IDBDatabase.js').IDBDatabaseFull} db
     * @param {import('./DOMStringList.js').DOMStringListFull} storeNames
     * @param {string} mode
     * @param {string} [durability]
     * @returns {IDBTransactionFull}
     */
    export function __createInstance(db: import("./IDBDatabase.js").IDBDatabaseFull, storeNames: import("./DOMStringList.js").DOMStringListFull, mode: string, durability?: string): IDBTransactionFull;
    /**
     *
     * @param {IDBTransactionFull|null|undefined} tx
     * @returns {void}
     */
    export function __assertVersionChange(tx: IDBTransactionFull | null | undefined): void;
    /**
     *
     * @param {IDBTransactionFull|null} tx
     * @throws {DOMException}
     * @returns {void}
     */
    export function __assertNotVersionChange(tx: IDBTransactionFull | null): void;
    /**
     *
     * @param {IDBTransactionFull|null|undefined} tx
     * @throws {DOMException}
     * @returns {void}
     */
    export function __assertNotFinished(tx: IDBTransactionFull | null | undefined): void;
    /**
     *
     * @param {IDBTransactionFull} tx
     * @returns {void}
     */
    export function __assertNotFinishedObjectStoreMethod(tx: IDBTransactionFull): void;
    /**
     *
     * @param {IDBTransactionFull|null|undefined} tx
     * @throws {DOMException}
     * @returns {void}
     */
    export function __assertActive(tx: IDBTransactionFull | null | undefined): void;
    export { activeTransactions };
}
import { IDBRequest } from './IDBRequest.js';
import IDBObjectStore from './IDBObjectStore.js';
declare const activeTransactions: Set<any>;
//# sourceMappingURL=IDBTransaction.d.ts.map
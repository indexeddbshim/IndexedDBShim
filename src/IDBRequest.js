/**
 * The IDBRequest Object that is returns for all async calls
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 */
class IDBRequest {
    constructor () {
        this.onsuccess = this.onerror = this.result = this.error = this.source = this.transaction = null;
        this.readyState = 'pending';
    }
}

/**
 * The IDBOpenDBRequest called when a database is opened
 */
class IDBOpenDBRequest extends IDBRequest {
    constructor () {
        super();
        this.onblocked = this.onupgradeneeded = null;
    }
}

export {IDBRequest, IDBOpenDBRequest};

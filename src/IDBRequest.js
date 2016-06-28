import * as util from './util.js';

/**
 * The IDBRequest Object that is returns for all async calls
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 */
class IDBRequest {
    constructor () {
        this.onsuccess = this.onerror = this.__result = this.__error = this.__source = this.__transaction = null;
        this.__readyState = 'pending';
    }
    toString () {
        return '[object IDBRequest]';
    }
}

util.defineReadonlyProperties(IDBRequest.prototype, ['result', 'error', 'source', 'transaction', 'readyState']);

/**
 * The IDBOpenDBRequest called when a database is opened
 */
class IDBOpenDBRequest extends IDBRequest {
    constructor () {
        super();
        this.onblocked = this.onupgradeneeded = null;
    }
    toString () {
        return '[object IDBOpenDBRequest]';
    }
}

export {IDBRequest, IDBOpenDBRequest};

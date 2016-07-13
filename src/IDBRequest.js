import * as util from './util.js';
import EventTarget from 'eventtarget';

/**
 * The IDBRequest Object that is returns for all async calls
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 */
class IDBRequest {
    constructor () {
        this.onsuccess = this.onerror = null;
        this.__result = undefined;
        this.__error = this.__source = this.__transaction = null;
        this.__readyState = 'pending';
        this.setOptions({extraProperties: ['debug']}); // Ensure EventTarget preserves our properties
    }
    toString () {
        return '[object IDBRequest]';
    }
}

util.defineReadonlyProperties(IDBRequest.prototype, ['result', 'error', 'source', 'transaction', 'readyState']);

Object.assign(IDBRequest.prototype, EventTarget.prototype);

/**
 * The IDBOpenDBRequest called when a database is opened
 */
class IDBOpenDBRequest extends IDBRequest {
    constructor () {
        super();
        this.setOptions({extraProperties: ['oldVersion', 'newVersion', 'debug']}); // Ensure EventTarget preserves our properties
        this.onblocked = this.onupgradeneeded = null;
    }
    toString () {
        return '[object IDBOpenDBRequest]';
    }
}

export {IDBRequest, IDBOpenDBRequest};

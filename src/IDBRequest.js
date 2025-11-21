import {EventTargetFactory} from 'eventtargeter';
import {createDOMException} from './DOMException.js';
import * as util from './util.js';

const listeners = ['onsuccess', 'onerror'];
const readonlyProperties = ['source', 'transaction', 'readyState'];
const doneFlagGetters = ['result', 'error'];

/**
 * The IDBRequest Object that is returns for all async calls.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 * @class
 */
function IDBRequest () {
    throw new TypeError('Illegal constructor');
}

/**
 * @typedef {IDBRequest & EventTarget & import('eventtargeter').ShimEventTarget & {
 *   transaction: import('./IDBTransaction.js').IDBTransactionFull,
 *   __done: boolean,
 *   __result: import('./IDBDatabase.js').IDBDatabaseFull|undefined,
 *   __error: null|DOMException|Error,
 *   __source: null|import('./IDBDatabase.js').IDBDatabaseFull|
 *     import('./IDBObjectStore.js').IDBObjectStoreFull|
 *     import('./IDBIndex.js').IDBIndexFull,
 *   __transaction: undefined|null|
 *     import('./IDBTransaction.js').IDBTransactionFull,
 *   addLateEventListener: (ev: string, listener: (e: Event & {
 *     __legacyOutputDidListenersThrowError: boolean
 *   }) => void) => void
 *   addDefaultEventListener: (ev: string, listener: (e: Event & {
 *     __legacyOutputDidListenersThrowError: boolean
 *   }) => void) => void
 * }} IDBRequestFull
 */

/* eslint-disable func-name-matching -- Polyfill */
/**
 * @class
 * @this {IDBRequestFull}
 */
IDBRequest.__super = function IDBRequest () {
    // @ts-expect-error It's ok
    this[Symbol.toStringTag] = 'IDBRequest';
    // @ts-expect-error Part of `ShimEventTarget`
    this.__setOptions({
        legacyOutputDidListenersThrowFlag: true // Event hook for IndexedB
    });
    doneFlagGetters.forEach((prop) => {
        Object.defineProperty(this, '__' + prop, {
            enumerable: false,
            configurable: false,
            writable: true
        });
        Object.defineProperty(this, prop, {
            enumerable: true,
            configurable: true,
            get () {
                if (!this.__done) {
                    throw createDOMException('InvalidStateError', "Can't get " + prop + '; the request is still pending.');
                }
                return this['__' + prop];
            }
        });
    });
    util.defineReadonlyProperties(this, readonlyProperties, {
        readyState: {
            /**
             * @this {IDBRequestFull}
             * @returns {"done"|"pending"}
             */
            get readyState () {
                return this.__done ? 'done' : 'pending';
            }
        }
    });
    util.defineListenerProperties(this, listeners);

    this.__result = undefined;
    this.__error = this.__source = this.__transaction = null;
    this.__done = false;
};
/* eslint-enable func-name-matching -- Polyfill */

/**
 * @returns {IDBRequestFull}
 */
IDBRequest.__createInstance = function () {
    // @ts-expect-error Casting this causes other errors
    return new IDBRequest.__super();
};

// @ts-expect-error It's ok
IDBRequest.prototype = EventTargetFactory.createInstance({extraProperties: ['debug']});
IDBRequest.prototype[Symbol.toStringTag] = 'IDBRequestPrototype';

/**
 * @this {IDBRequestFull}
 * @returns {import('./IDBTransaction.js').IDBTransactionFull|null|undefined}
 */
IDBRequest.prototype.__getParent = function () {
    if (this.toString() === '[object IDBOpenDBRequest]') {
        return null;
    }
    return this.__transaction;
};

// Illegal invocations
util.defineReadonlyOuterInterface(IDBRequest.prototype, readonlyProperties);
util.defineReadonlyOuterInterface(IDBRequest.prototype, doneFlagGetters);

util.defineOuterInterface(IDBRequest.prototype, listeners);

Object.defineProperty(IDBRequest.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: IDBRequest
});
IDBRequest.__super.prototype = IDBRequest.prototype;

Object.defineProperty(IDBRequest, 'prototype', {
    writable: false
});

const openListeners = ['onblocked', 'onupgradeneeded'];

/**
 * @typedef {IDBRequestFull & IDBOpenDBRequest} IDBOpenDBRequestFull
 */

/**
 * The IDBOpenDBRequest called when a database is opened.
 * @class
 */
function IDBOpenDBRequest () {
    throw new TypeError('Illegal constructor');
}

// @ts-expect-error It's ok
IDBOpenDBRequest.prototype = Object.create(IDBRequest.prototype);

Object.defineProperty(IDBOpenDBRequest.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: IDBOpenDBRequest
});

const IDBOpenDBRequestAlias = IDBOpenDBRequest;
/**
 * @returns {IDBRequestFull & IDBOpenDBRequest}
 */
IDBOpenDBRequest.__createInstance = function () {
    /**
     * @class
     * @this {IDBOpenDBRequestFull}
     */
    function IDBOpenDBRequest () {
        IDBRequest.__super.call(this);

        // @ts-expect-error It's ok
        this[Symbol.toStringTag] = 'IDBOpenDBRequest';
        // @ts-expect-error It's ok
        this.__setOptions({
            legacyOutputDidListenersThrowFlag: true, // Event hook for IndexedB
            extraProperties: ['oldVersion', 'newVersion', 'debug']
        }); // Ensure EventTarget preserves our properties
        util.defineListenerProperties(this, openListeners);
    }
    IDBOpenDBRequest.prototype = IDBOpenDBRequestAlias.prototype;

    // @ts-expect-error It's ok
    return new IDBOpenDBRequest();
};

util.defineOuterInterface(IDBOpenDBRequest.prototype, openListeners);

IDBOpenDBRequest.prototype[Symbol.toStringTag] = 'IDBOpenDBRequestPrototype';

Object.defineProperty(IDBOpenDBRequest, 'prototype', {
    writable: false
});

export {IDBRequest, IDBOpenDBRequest};

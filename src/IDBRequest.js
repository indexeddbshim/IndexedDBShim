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
// eslint-disable-next-line func-name-matching
IDBRequest.__super = function IDBRequest () {
    this[Symbol.toStringTag] = 'IDBRequest';
    this.__setOptions({
        legacyOutputDidListenersThrowFlag: true // Event hook for IndexedB
    });
    doneFlagGetters.forEach(function (prop) {
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
    }, this);
    util.defineReadonlyProperties(this, readonlyProperties, {
        readyState: {
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

IDBRequest.__createInstance = function () {
    return new IDBRequest.__super();
};

IDBRequest.prototype = EventTargetFactory.createInstance({extraProperties: ['debug']});
IDBRequest.prototype[Symbol.toStringTag] = 'IDBRequestPrototype';

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
 * The IDBOpenDBRequest called when a database is opened.
 * @class
 */
function IDBOpenDBRequest () {
    throw new TypeError('Illegal constructor');
}
IDBOpenDBRequest.prototype = Object.create(IDBRequest.prototype);

Object.defineProperty(IDBOpenDBRequest.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: IDBOpenDBRequest
});

const IDBOpenDBRequestAlias = IDBOpenDBRequest;
IDBOpenDBRequest.__createInstance = function () {
    function IDBOpenDBRequest () {
        IDBRequest.__super.call(this);

        this[Symbol.toStringTag] = 'IDBOpenDBRequest';
        this.__setOptions({
            legacyOutputDidListenersThrowFlag: true, // Event hook for IndexedB
            extraProperties: ['oldVersion', 'newVersion', 'debug']
        }); // Ensure EventTarget preserves our properties
        util.defineListenerProperties(this, openListeners);
    }
    IDBOpenDBRequest.prototype = IDBOpenDBRequestAlias.prototype;
    return new IDBOpenDBRequest();
};

util.defineOuterInterface(IDBOpenDBRequest.prototype, openListeners);

IDBOpenDBRequest.prototype[Symbol.toStringTag] = 'IDBOpenDBRequestPrototype';

Object.defineProperty(IDBOpenDBRequest, 'prototype', {
    writable: false
});

export {IDBRequest, IDBOpenDBRequest};

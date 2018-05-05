import {createDOMException} from './DOMException';
import {EventTargetFactory} from 'eventtargeter';
import * as util from './util';

const listeners = ['onsuccess', 'onerror'];
const readonlyProperties = ['source', 'transaction', 'readyState'];
const doneFlagGetters = ['result', 'error'];

/**
 * The IDBRequest Object that is returns for all async calls
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 */
function IDBRequest () {
    throw new TypeError('Illegal constructor');
}
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
                if (this.__readyState !== 'done') {
                    throw createDOMException('InvalidStateError', "Can't get " + prop + '; the request is still pending.');
                }
                return this['__' + prop];
            }
        });
    }, this);
    util.defineReadonlyProperties(this, readonlyProperties);
    listeners.forEach((listener) => {
        Object.defineProperty(this, listener, {
            configurable: true, // Needed by support.js in W3C IndexedDB tests
            get () {
                return this['__' + listener];
            },
            set (val) {
                this['__' + listener] = val;
            }
        });
    }, this);
    listeners.forEach((l) => {
        this[l] = null;
    });
    this.__result = undefined;
    this.__error = this.__source = this.__transaction = null;
    this.__readyState = 'pending';
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
readonlyProperties.forEach((prop) => {
    Object.defineProperty(IDBRequest.prototype, prop, {
        enumerable: true,
        configurable: true,
        get () {
            throw new TypeError('Illegal invocation');
        }
    });
});

doneFlagGetters.forEach(function (prop) {
    Object.defineProperty(IDBRequest.prototype, prop, {
        enumerable: true,
        configurable: true,
        get () {
            throw new TypeError('Illegal invocation');
        }
    });
});

listeners.forEach((listener) => {
    Object.defineProperty(IDBRequest.prototype, listener, {
        enumerable: true,
        configurable: true,
        get () {
            throw new TypeError('Illegal invocation');
        },
        set (val) {
            throw new TypeError('Illegal invocation');
        }
    });
});

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
 * The IDBOpenDBRequest called when a database is opened
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
        openListeners.forEach((listener) => {
            Object.defineProperty(this, listener, {
                configurable: true, // Needed by support.js in W3C IndexedDB tests
                get () {
                    return this['__' + listener];
                },
                set (val) {
                    this['__' + listener] = val;
                }
            });
        }, this);
        openListeners.forEach((l) => {
            this[l] = null;
        });
    }
    IDBOpenDBRequest.prototype = IDBOpenDBRequestAlias.prototype;
    return new IDBOpenDBRequest();
};

openListeners.forEach((listener) => {
    Object.defineProperty(IDBOpenDBRequest.prototype, listener, {
        enumerable: true,
        configurable: true,
        get () {
            throw new TypeError('Illegal invocation');
        },
        set (val) {
            throw new TypeError('Illegal invocation');
        }
    });
});

IDBOpenDBRequest.prototype[Symbol.toStringTag] = 'IDBOpenDBRequestPrototype';

Object.defineProperty(IDBOpenDBRequest, 'prototype', {
    writable: false
});

export {IDBRequest, IDBOpenDBRequest};

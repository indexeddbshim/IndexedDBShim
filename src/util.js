import {createDOMException} from './DOMException.js';

let cleanInterface = false;

const testObject = {test: true};
// Test whether Object.defineProperty really works.
if (Object.defineProperty) {
    try {
        Object.defineProperty(testObject, 'test', { enumerable: false });
        if (testObject.test) {
            cleanInterface = true;
        }
    } catch (e) {
    // Object.defineProperty does not work as intended.
    }
}

/**
 * A utility method to callback onsuccess, onerror, etc as soon as the calling function's context is over
 * @param {Object} fn
 * @param {Object} context
 * @param {Object} argArray
 */
function callback (fn, context, event) {
    // setTimeout(function(){
    event.target = context;
    (typeof context[fn] === 'function') && context[fn](event);
    // }, 1);
}

/**
 * Shim the DOMStringList object.
 *
 */
const StringList = function () {
    this.length = 0;
    this._items = [];
    // Internal functions on the prototype have been made non-enumerable below.
    if (cleanInterface) {
        Object.defineProperty(this, '_items', {
            enumerable: false
        });
    }
};
StringList.prototype = {
    // Interface.
    contains: function (str) {
        return this._items.includes(str);
    },
    item: function (key) {
        return this._items[key];
    },

    // Helpers. Should only be used internally.
    map: function (cb, thisArg) {
        return this._items.map(cb, thisArg);
    },
    indexOf: function (str) {
        return this._items.indexOf(str);
    },
    push: function (item) {
        this._items.push(item);
        this.length += 1;
        for (let i = 0; i < this._items.length; i++) {
            this[i] = this._items[i];
        }
    },
    splice: function (...args /* index, howmany, item1, ..., itemX*/) {
        this._items.splice(...args);
        this.length = this._items.length;
        for (const i in this) {
            if (i === String(parseInt(i, 10))) {
                delete this[i];
            }
        }
        for (let i = 0; i < this._items.length; i++) {
            this[i] = this._items[i];
        }
    }
};
if (cleanInterface) {
    for (const i in {
        'indexOf': false,
        'push': false,
        'splice': false
    }) {
        Object.defineProperty(StringList.prototype, i, {
            enumerable: false
        });
    }
}

function quote (arg) {
    return '"' + arg + '"';
}

// Babel doesn't seem to provide a means of using the `instanceof` operator with Symbol.hasInstance (yet?)
function instanceOf (obj, Clss) {
    return Clss[Symbol.hasInstance](obj);
}

function isObj (obj) {
    return obj && typeof obj === 'object';
}

function isDate (obj) {
    return isObj(obj) && typeof obj.getDate === 'function';
}

function isBlob (obj) {
    return isObj(obj) && typeof obj.size === 'number' && typeof obj.slice === 'function';
}

function isRegExp (obj) {
    return isObj(obj) && typeof obj.flags === 'string' && typeof obj.exec === 'function';
}

function isFile (obj) {
    return isObj(obj) && typeof obj.name === 'string' && isBlob(obj);
}

/*
// Todo: Utilize with encoding/decoding
function isArrayBufferOrView (obj) {
    return isObj(obj) && typeof obj.byteLength === 'number' && (
        typeof obj.slice === 'function' || // `TypedArray` (view on buffer) or `ArrayBuffer`
        typeof obj.getFloat64 === 'function' // `DataView` (view on buffer)
    );
}
*/

function isNotClonable (value) {
    return ['function', 'symbol'].includes(typeof value) ||
        (isObj(value) && (
            value instanceof Error || // Duck-typing with some util.isError would be better, but too easy to get a false match
            (value.nodeType > 0 && typeof value.nodeName === 'string') // DOM nodes
        ));
}

function throwIfNotClonable (value, errMsg) {
    JSON.stringify(value, function (key, val) {
        if (isNotClonable(val)) {
            throw createDOMException('DataCloneError', errMsg);
        }
        return val;
    });
}

function defineReadonlyProperties (obj, props) {
    props = typeof props === 'string' ? [props] : props;
    props.forEach(function (prop) {
        Object.defineProperty(obj, '__' + prop, {
            enumerable: false,
            configurable: false,
            writable: true
        });
        Object.defineProperty(obj, prop, {
            enumerable: true,
            configurable: true,
            get: function () {
                return this['__' + prop];
            }
        });
    });
}

export {callback, StringList, quote, instanceOf, isObj, isDate, isBlob, isRegExp, isFile, throwIfNotClonable, defineReadonlyProperties};

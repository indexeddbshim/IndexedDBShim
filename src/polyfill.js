import {createDOMException} from './DOMException.js';
import Key from './Key.js';

// Todo: polyfill IDBVersionChangeEvent, IDBOpenDBRequest?

/**
 * Polyfills missing features in the browser's native IndexedDB implementation.
 * This is used for browsers that DON'T support WebSQL but DO support IndexedDB
 */
function polyfill () {
    if (navigator.userAgent.match(/MSIE/) ||
        navigator.userAgent.match(/Trident/) ||
        navigator.userAgent.match(/Edge/)) {
        // Internet Explorer's native IndexedDB does not support compound keys
        compoundKeyPolyfill();
    }
}

/**
 * Polyfills support for compound keys
 */
function compoundKeyPolyfill (IDBCursor, IDBCursorWithValue, IDBDatabase, IDBFactory, IDBIndex, IDBKeyRange, IDBObjectStore, IDBRequest, IDBTransaction) {
    const cmp = IDBFactory.prototype.cmp;
    const createObjectStore = IDBDatabase.prototype.createObjectStore;
    const createIndex = IDBObjectStore.prototype.createIndex;
    const add = IDBObjectStore.prototype.add;
    const put = IDBObjectStore.prototype.put;
    const indexGet = IDBIndex.prototype.get;
    const indexGetKey = IDBIndex.prototype.getKey;
    const indexCursor = IDBIndex.prototype.openCursor;
    const indexKeyCursor = IDBIndex.prototype.openKeyCursor;
    const storeGet = IDBObjectStore.prototype.get;
    const storeDelete = IDBObjectStore.prototype.delete;
    const storeCursor = IDBObjectStore.prototype.openCursor;
    const storeKeyCursor = IDBObjectStore.prototype.openKeyCursor;
    const bound = IDBKeyRange.bound;
    const upperBound = IDBKeyRange.upperBound;
    const lowerBound = IDBKeyRange.lowerBound;
    const only = IDBKeyRange.only;
    const requestResult = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'result');
    const cursorPrimaryKey = Object.getOwnPropertyDescriptor(IDBCursor.prototype, 'primaryKey');
    const cursorKey = Object.getOwnPropertyDescriptor(IDBCursor.prototype, 'key');
    const cursorValue = Object.getOwnPropertyDescriptor(IDBCursorWithValue.prototype, 'value');

    IDBFactory.prototype.cmp = function (key1, key2) {
        const args = Array.prototype.slice.call(arguments);
        if (key1 instanceof Array) {
            args[0] = encodeCompoundKey(key1);
        }
        if (key2 instanceof Array) {
            args[1] = encodeCompoundKey(key2);
        }
        return cmp.apply(this, args);
    };

    IDBDatabase.prototype.createObjectStore = function (name, opts) {
        if (opts && opts.keyPath instanceof Array) {
            opts.keyPath = encodeCompoundKeyPath(opts.keyPath);
        }
        return createObjectStore.apply(this, arguments);
    };

    IDBObjectStore.prototype.createIndex = function (name, keyPath, opts) {
        const args = Array.prototype.slice.call(arguments);
        if (keyPath instanceof Array) {
            args[1] = encodeCompoundKeyPath(keyPath);
        }
        return createIndex.apply(this, args);
    };

    IDBObjectStore.prototype.add = function (value, key) {
        return this.__insertData(add, arguments);
    };

    IDBObjectStore.prototype.put = function (value, key) {
        return this.__insertData(put, arguments);
    };

    IDBObjectStore.prototype.__insertData = function (method, args) {
        args = Array.prototype.slice.call(args);
        const value = args[0];
        const key = args[1];

        // out-of-line key
        if (key instanceof Array) {
            args[1] = encodeCompoundKey(key);
        }

        if (typeof value === 'object') {
            // inline key
            if (isCompoundKey(this.keyPath)) {
                setInlineCompoundKey(value, this.keyPath);
            }

            // inline indexes
            for (let i = 0; i < this.indexNames.length; i++) {
                const index = this.index(this.indexNames[i]);
                if (isCompoundKey(index.keyPath)) {
                    try {
                        setInlineCompoundKey(value, index.keyPath);
                    } catch (e) {
                        // The value doesn't have a valid key for this index.
                    }
                }
            }
        }
        return method.apply(this, args);
    };

    IDBIndex.prototype.get = function (key) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return indexGet.apply(this, args);
    };

    IDBIndex.prototype.getKey = function (key) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return indexGetKey.apply(this, args);
    };

    IDBIndex.prototype.openCursor = function (key) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return indexCursor.apply(this, args);
    };

    IDBIndex.prototype.openKeyCursor = function (key) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return indexKeyCursor.apply(this, args);
    };

    IDBObjectStore.prototype.get = function (key) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return storeGet.apply(this, args);
    };

    IDBObjectStore.prototype.delete = function (key) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return storeDelete.apply(this, args);
    };

    IDBObjectStore.prototype.openCursor = function (key) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return storeCursor.apply(this, args);
    };

    IDBObjectStore.prototype.openKeyCursor = function (key) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return storeKeyCursor.apply(this, args);
    };

    IDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
        const args = Array.prototype.slice.call(arguments);
        if (lower instanceof Array) {
            args[0] = encodeCompoundKey(lower);
        }
        if (upper instanceof Array) {
            args[1] = encodeCompoundKey(upper);
        }
        return bound.apply(IDBKeyRange, args);
    };

    IDBKeyRange.upperBound = function (key, open) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return upperBound.apply(IDBKeyRange, args);
    };

    IDBKeyRange.lowerBound = function (key, open) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return lowerBound.apply(IDBKeyRange, args);
    };

    IDBKeyRange.only = function (key) {
        const args = Array.prototype.slice.call(arguments);
        if (key instanceof Array) {
            args[0] = encodeCompoundKey(key);
        }
        return only.apply(IDBKeyRange, args);
    };

    Object.defineProperty(IDBRequest.prototype, 'result', {
        enumerable: requestResult.enumerable,
        configurable: requestResult.configurable,
        get: function () {
            const result = requestResult.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });

    Object.defineProperty(IDBCursor.prototype, 'primaryKey', {
        enumerable: cursorPrimaryKey.enumerable,
        configurable: cursorPrimaryKey.configurable,
        get: function () {
            const result = cursorPrimaryKey.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });

    Object.defineProperty(IDBCursor.prototype, 'key', {
        enumerable: cursorKey.enumerable,
        configurable: cursorKey.configurable,
        get: function () {
            const result = cursorKey.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });

    Object.defineProperty(IDBCursorWithValue.prototype, 'value', {
        enumerable: cursorValue.enumerable,
        configurable: cursorValue.configurable,
        get: function () {
            const result = cursorValue.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });
}

const compoundKeysPropertyName = '__$$compoundKey';
const propertySeparatorRegExp = /\$\$/g;
const propertySeparator = '$$$$';         // "$$" after RegExp escaping
const keySeparator = '$_$';

function isCompoundKey (keyPath) {
    return keyPath && (keyPath.indexOf(compoundKeysPropertyName + '.') === 0);
}

function encodeCompoundKeyPath (keyPath) {
    // Encoded dotted properties
    // ["name.first", "name.last"] ==> ["name$$first", "name$$last"]
    for (let i = 0; i < keyPath.length; i++) {
        keyPath[i] = keyPath[i].replace(/\./g, propertySeparator);
    }

    // Encode the array as a single property
    // ["name$$first", "name$$last"] => "__$$compoundKey.name$$first$_$name$$last"
    return compoundKeysPropertyName + '.' + keyPath.join(keySeparator);
}

function decodeCompoundKeyPath (keyPath) {
    // Remove the "__$$compoundKey." prefix
    keyPath = keyPath.substr(compoundKeysPropertyName.length + 1);

    // Split the properties into an array
    // "name$$first$_$name$$last" ==> ["name$$first", "name$$last"]
    keyPath = keyPath.split(keySeparator);

    // Decode dotted properties
    // ["name$$first", "name$$last"] ==> ["name.first", "name.last"]
    for (let i = 0; i < keyPath.length; i++) {
        keyPath[i] = keyPath[i].replace(propertySeparatorRegExp, '.');
    }
    return keyPath;
}

function setInlineCompoundKey (value, encodedKeyPath) {
    // Encode the key
    const keyPath = decodeCompoundKeyPath(encodedKeyPath);
    const key = Key.getValue(value, keyPath);
    const encodedKey = encodeCompoundKey(key);

    // Store the encoded key inline
    encodedKeyPath = encodedKeyPath.substr(compoundKeysPropertyName.length + 1);
    value[compoundKeysPropertyName] = value[compoundKeysPropertyName] || {};
    value[compoundKeysPropertyName][encodedKeyPath] = encodedKey;
}

function removeInlineCompoundKey (value) {
    if (typeof value === 'string' && isCompoundKey(value)) {
        return decodeCompoundKey(value);
    } else if (value && typeof value[compoundKeysPropertyName] === 'object') {
        delete value[compoundKeysPropertyName];
    }
    return value;
}

function encodeCompoundKey (key) {
    // Validate and encode the key
    Key.validate(key);
    key = Key.encode(key);

    // Prepend the "__$$compoundKey." prefix
    key = compoundKeysPropertyName + '.' + key;

    validateKeyLength(key);
    return key;
}

function decodeCompoundKey (key) {
    validateKeyLength(key);

    // Remove the "__$$compoundKey." prefix
    key = key.substr(compoundKeysPropertyName.length + 1);

    // Decode the key
    key = Key.decode(key);
    return key;
}

function validateKeyLength (key) {
    // BUG: Internet Explorer truncates string keys at 889 characters
    if (key.length > 889) {
        throw createDOMException('DataError', 'The encoded key is ' + key.length + ' characters long, but IE only allows 889 characters. Consider replacing numeric keys with strings to reduce the encoded length.');
    }
}

export default polyfill;

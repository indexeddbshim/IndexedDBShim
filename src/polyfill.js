(function (idbModules) {
    'use strict';

    /**
     * Polyfills missing features in the browser's native IndexedDB implementation.
     * This is used for browsers that DON'T support WebSQL but DO support IndexedDB
     */
    function polyfill() {
        if (navigator.userAgent.match(/MSIE/) || navigator.userAgent.match(/Trident/)) {
            // Internet Explorer's native IndexedDB does not support compound keys
            compoundKeyPolyfill();
        }
    }

    /**
     * Polyfills support for compound keys
     */
    function compoundKeyPolyfill() {
        var cmp = IDBFactory.prototype.cmp;
        var createObjectStore = IDBDatabase.prototype.createObjectStore;
        var createIndex = IDBObjectStore.prototype.createIndex;
        var add = IDBObjectStore.prototype.add;
        var put = IDBObjectStore.prototype.put;
        var indexGet = IDBIndex.prototype.get;
        var indexGetKey = IDBIndex.prototype.getKey;
        var indexCursor = IDBIndex.prototype.openCursor;
        var indexKeyCursor = IDBIndex.prototype.openKeyCursor;
        var storeGet = IDBObjectStore.prototype.get;
        var storeDelete = IDBObjectStore.prototype.delete;
        var storeCursor = IDBObjectStore.prototype.openCursor;
        var storeKeyCursor = IDBObjectStore.prototype.openKeyCursor;
        var bound = IDBKeyRange.bound;
        var upperBound = IDBKeyRange.upperBound;
        var lowerBound = IDBKeyRange.lowerBound;
        var only = IDBKeyRange.only;
        var requestResult = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'result');
        var cursorPrimaryKey = Object.getOwnPropertyDescriptor(IDBCursor.prototype, 'primaryKey');
        var cursorKey = Object.getOwnPropertyDescriptor(IDBCursor.prototype, 'key');
        var cursorValue = Object.getOwnPropertyDescriptor(IDBCursorWithValue.prototype, 'value');

        IDBFactory.prototype.cmp = function(key1, key2) {
            var args = Array.prototype.slice.call(arguments);
            if (key1 instanceof Array) {
                args[0] = encodeCompoundKey(key1);
            }
            if (key2 instanceof Array) {
                args[1] = encodeCompoundKey(key2);
            }
            return cmp.apply(this, args);
        };

        IDBDatabase.prototype.createObjectStore = function(name, opts) {
            if (opts && opts.keyPath instanceof Array) {
                opts.keyPath = encodeCompoundKeyPath(opts.keyPath);
            }
            return createObjectStore.apply(this, arguments);
        };

        IDBObjectStore.prototype.createIndex = function(name, keyPath, opts) {
            var args = Array.prototype.slice.call(arguments);
            if (keyPath instanceof Array) {
                args[1] = encodeCompoundKeyPath(keyPath);
            }
            return createIndex.apply(this, args);
        };

        IDBObjectStore.prototype.add = function(value, key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[1] = encodeCompoundKey(key);
            }
            else if (typeof value === 'object' && isCompoundKey(this.keyPath)) {
                setInlineCompoundKey(value, this.keyPath);
            }
            return add.apply(this, args);
        };

        IDBObjectStore.prototype.put = function(value, key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[1] = encodeCompoundKey(key);
            }
            else if (typeof value === 'object' && isCompoundKey(this.keyPath)) {
                setInlineCompoundKey(value, this.keyPath);
            }
            return put.apply(this, args);
        };

        IDBIndex.prototype.get = function(key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return indexGet.apply(this, args);
        };

        IDBIndex.prototype.getKey = function(key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return indexGetKey.apply(this, args);
        };

        IDBIndex.prototype.openCursor = function(key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return indexCursor.apply(this, args);
        };

        IDBIndex.prototype.openKeyCursor = function(key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return indexKeyCursor.apply(this, args);
        };

        IDBObjectStore.prototype.get = function(key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return storeGet.apply(this, args);
        };

        IDBObjectStore.prototype.delete = function(key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return storeDelete.apply(this, args);
        };

        IDBObjectStore.prototype.openCursor = function(key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return storeCursor.apply(this, args);
        };

        IDBObjectStore.prototype.openKeyCursor = function(key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return storeKeyCursor.apply(this, args);
        };

        IDBKeyRange.bound = function(lower, upper, lowerOpen, upperOpen) {
            var args = Array.prototype.slice.call(arguments);
            if (lower instanceof Array) {
                args[0] = encodeCompoundKey(lower);
            }
            if (upper instanceof Array) {
                args[1] = encodeCompoundKey(upper);
            }
            return bound.apply(IDBKeyRange, args);
        };

        IDBKeyRange.upperBound = function(key, open) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return upperBound.apply(IDBKeyRange, args);
        };

        IDBKeyRange.lowerBound = function(key, open) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return lowerBound.apply(IDBKeyRange, args);
        };

        IDBKeyRange.only = function(key) {
            var args = Array.prototype.slice.call(arguments);
            if (key instanceof Array) {
                args[0] = encodeCompoundKey(key);
            }
            return only.apply(IDBKeyRange, args);
        };

        Object.defineProperty(IDBRequest.prototype, 'result', {
            enumerable: requestResult.enumerable,
            configurable: requestResult.configurable,
            get: function() {
                var result = requestResult.get.call(this);
                return removeInlineCompoundKey(result);
            }
        });

        Object.defineProperty(IDBCursor.prototype, 'primaryKey', {
            enumerable: requestResult.enumerable,
            configurable: requestResult.configurable,
            get: function() {
                var result = cursorPrimaryKey.get.call(this);
                return removeInlineCompoundKey(result);
            }
        });

        Object.defineProperty(IDBCursor.prototype, 'key', {
            enumerable: requestResult.enumerable,
            configurable: requestResult.configurable,
            get: function() {
                var result = cursorKey.get.call(this);
                return removeInlineCompoundKey(result);
            }
        });

        Object.defineProperty(IDBCursorWithValue.prototype, 'value', {
            enumerable: requestResult.enumerable,
            configurable: requestResult.configurable,
            get: function() {
                var result = cursorValue.get.call(this);
                return removeInlineCompoundKey(result);
            }
        });
    }

    var compoundKeysPropertyName = '__$$compoundKey';
    var propertySeparatorRegExp = /\$\$/g;
    var propertySeparator = '$$$$';         // "$$" after RegExp escaping
    var keySeparator = '$_$';

    function isCompoundKey(keyPath) {
        return keyPath && (keyPath.indexOf(compoundKeysPropertyName + '.') === 0);
    }

    function encodeCompoundKeyPath(keyPath) {
        // Encoded dotted properties
        // ["name.first", "name.last"] ==> ["name$$first", "name$$last"]
        for (var i = 0; i < keyPath.length; i++) {
            keyPath[i] = keyPath[i].replace(/\./g, propertySeparator);
        }

        // Encode the array as a single property
        // ["name$$first", "name$$last"] => "__$$compoundKeys.name$$first$_$name$$last"
        return compoundKeysPropertyName + '.' + keyPath.join(keySeparator);
    }

    function decodeCompoundKeyPath(keyPath) {
        // Remove the "__$$compoundKeys." prefix
        keyPath = keyPath.substr(compoundKeysPropertyName.length + 1);

        // Split the properties into an array
        // "name$$first$_$name$$last" ==> ["name$$first", "name$$last"]
        keyPath = keyPath.split(keySeparator);

        // Decode dotted properties
        // ["name$$first", "name$$last"] ==> ["name.first", "name.last"]
        for (var i = 0; i < keyPath.length; i++) {
            keyPath[i] = keyPath[i].replace(propertySeparatorRegExp, '.');
        }
        return keyPath;
    }

    function setInlineCompoundKey(value, encodedKeyPath) {
        // Encode the key
        var keyPath = decodeCompoundKeyPath(encodedKeyPath);
        var key = idbModules.Key.getValue(value, keyPath);
        var encodedKey = encodeCompoundKey(key);

        // Store the encoded key inline
        encodedKeyPath = encodedKeyPath.substr(compoundKeysPropertyName.length + 1);
        value[compoundKeysPropertyName] = value[compoundKeysPropertyName] || {};
        value[compoundKeysPropertyName][encodedKeyPath] = encodedKey;
    }

    function removeInlineCompoundKey(value) {
        if (typeof value === "string" && isCompoundKey(value)) {
            return decodeCompoundKey(value);
        }
        else if (value && typeof value[compoundKeysPropertyName] === "object") {
            delete value[compoundKeysPropertyName];
        }
        return value;
    }

    function encodeCompoundKey(key) {
        // Validate and encode the key
        idbModules.Key.validate(key);
        key = idbModules.Key.encode(key);

        // Prepend the "__$$compoundKeys." prefix
        return compoundKeysPropertyName + '.' + key;
    }

    function decodeCompoundKey(key) {
        // Remove the "__$$compoundKeys." prefix
        key = key.substr(compoundKeysPropertyName.length + 1);

        // Decode the key
        key = idbModules.Key.decode(key);
        return key;
    }

    idbModules.polyfill = polyfill;
})(idbModules);

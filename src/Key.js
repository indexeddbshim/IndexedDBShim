/*jshint globalstrict: true*/
'use strict';
(function(idbModules){
    /**
     * Encodes the keys and values based on their types. This is required to maintain collations
     */
    var collations = ["", "number", "string", "boolean", "object", "undefined"];
    var getGenericEncoder = function(){
        return {
            "encode": function(key){
                return collations.indexOf(typeof key) + "-" + JSON.stringify(key);
            },
            "decode": function(key){
                if (typeof key === "undefined") {
                    return undefined;
                }
                else {
                    return JSON.parse(key.substring(2));
                }
            }
        };
    };
    
    var types = {
        "boolean": getGenericEncoder(),
        "object": getGenericEncoder(),
        "number": {
            "encode": function(key){
                return collations.indexOf("number") + "-" + key;
            },
            "decode": function(key){
                return parseFloat(key.substring(2));
            }
        },
        "string": {
            "encode": function(key){
                return collations.indexOf("string") + "-" + key;
            },
            "decode": function(key){
                return "" + key.substring(2);
            }
        },
        "undefined": {
            "encode": function(key){
                return collations.indexOf("undefined") + "-undefined";
            },
            "decode": function(key){
                return undefined;
            }
        }
    };

    /**
     * Keys must be strings, numbers, Dates, or Arrays
     */
    function validateKey(key) {
        var type = typeof key;
        if (type === "string" ||
            (type === "number" && !isNaN(key)) ||
            key instanceof Date) {
             // valid
        }
        else if (key instanceof Array) {
            for (var i = 0; i < key.length; i++) {
                validateKey(key[i]);
            }
        }
        else {
            throw idbModules.util.createDOMException("DataError", "Not a valid key");
        }
    }

    /**
     * Safely evaluates a primitive key value
     */
    function evalKeyPath(value, keyPath) {
        try {
            return eval("value." + keyPath);
        }
        catch (e) {
            return undefined;
        }
    }

    /**
     * Returns the inline key value
     */
    function getKeyPath(value, keyPath) {
      if (keyPath instanceof Array) {
        var arrayValue = [];
        for (var i = 0; i < keyPath.length; i++) {
            arrayValue.push(evalKeyPath(value, keyPath[i]));
        }
        return arrayValue;
      } else {
        return evalKeyPath(value, keyPath);
      }
    }

    /**
     * Sets the inline key value
     */
    function setKeyPath(value, keyPath, key) {
        var props = keyPath.split('.');
        for (var i = 0; i < props.length - 1; i++) {
            var prop = props[i];
            value = value[prop] = value[prop] || {};
        }
        value[props[props.length - 1]] = key;
    }

    idbModules.Key = {
        encode: function(key) {
            return types[typeof key].encode(key);
        },
        encodeKey: function(key) {
            validateKey(key);
            return types[typeof key].encode(key);
        },
        decode: function(key) {
            return types[collations[key.substring(0, 1)]].decode(key);
        },
        validateKey: validateKey,
        getKeyPath: getKeyPath,
        setKeyPath: setKeyPath
    };
}(idbModules));

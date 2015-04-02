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
        "number": getGenericEncoder("number"), // decoder will fail for NaN
        "boolean": getGenericEncoder(),
        "object": getGenericEncoder(),
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
        if (type === "string" || type === "number" || key instanceof Date) {
            return true;
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
     * Returns the inline key value
     */
    function getKeyPath(value, keyPath) {
        try {
            return eval("value." + keyPath);
        }
        catch (e) {
            return undefined;
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
        getKeyPath: getKeyPath,
        setKeyPath: setKeyPath
    };
}(idbModules));

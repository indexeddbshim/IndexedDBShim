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
	
    var Key = (function(){
        return {
            encode: function(key){
                return types[typeof key].encode(key);
            },
            decode: function(key){
                return types[collations[key.substring(0, 1)]].decode(key);
            }
        };
    }());
    idbModules.Key = Key;
}(idbModules));

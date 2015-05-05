(function(idbModules) {
    'use strict';

    /**
     * Encodes the keys based on their types. This is required to maintain collations
     */
    var collations = ["undefined", "number", "date", "string", "array"];
    var types = {
        // Undefined is not a valid key type.  It's only used when there is no key.
        undefined: {
            encode: function(key) {
                return collations.indexOf("undefined") + "-";
            },
            decode: function(key) {
                return undefined;
            }
        },

        // Dates are encoded as ISO 8601 strings, in UTC time zone
        date: {
            encode: function(key) {
                return collations.indexOf("date") + "-" + key.toJSON();
            },
            decode: function(key) {
                return new Date(key.substring(2));
            }
        },

        // Numbers are encoded as base-36 strings between 200 and 400 characters
        // 1 character = sign (always)
        // 1 character = decimal point (optional)
        // 199 characters on each side of decimal point (Number.MAX_VALUE is 199 digits in base-36)
        number: {
            encode: function(key) {
                var sign, whole, fraction;
                sign = key < 0 ? '0' : 'z';                                     // 0 = negative, z = positive
                whole = new Array(200).join(sign);                              // Infinity
                fraction = '';

                if (isFinite(key)) {
                    var encoded = Math.abs(key).toString(36);                   // base-36 encode
                    encoded = encoded.split('.');                               // split whole from fraction
                    whole = flipBase36(sign, encoded[0]);                       // if negative, flip each whole digit
                    var padding = new Array(200 - whole.length);                // pad the whole to 199 digits
                    padding = padding.join(sign === '0' ? 'z' : '0');           // pad with z for negative, 0 for positive
                    whole = padding + whole;                                    // pad-left
                    if (encoded.length > 1) {
                        fraction = '.' + flipBase36(sign, encoded[1] || '');    // if negative, flip each fractional digit
                    }
                }

                return collations.indexOf("number") + "-" + sign + whole + fraction;
            },
            decode: function(key) {
                var sign = key.substr(2, 1);                                    // 0 = negative, z = positive
                var whole = flipBase36(sign, key.substr(3, 199));               // flip each whole digit if negative
                var fraction = flipBase36(sign, key.substr(203));               // flip each fractional digit if negative
                sign = sign === '0' ? -1 : 1;                                   // sign multiplier
                whole = parseInt(whole, 36);                                    // base-36 decode
                if (fraction) {
                    var digits = fraction.length;
                    fraction = parseInt(fraction, 36);                          // base-36 decode
                    return sign * (whole + (fraction / Math.pow(36, digits)));  // add the fraction to the whole
                }
                else {
                    return sign * whole;
                }
            }
        },

        // Strings are encoded as JSON strings (with quotes and unicode characters escaped).
        //
        // IF the strings are in an array, then some extra encoding is done to make sorting work correctly:
        // Since we can't force all strings to be the same length, we need to ensure that characters line-up properly
        // for sorting, while also accounting for the extra characters that are added when the array itself is encoded as JSON.
        // To do this, each character of the string is prepended with a dash ("-"), and a space is added to the end of the string.
        // This effectively doubles the size of every string, but it ensures that when two arrays of strings are compared,
        // the indexes of each string's characters line up with each other.
        string: {
            encode: function(key, inArray) {
                if (inArray) {
                    // prepend each character with a dash, and append a space to the end
                    key = key.replace(/(.)/g, '-$1') + ' ';
                }
                return collations.indexOf("string") + "-" + key;
            },
            decode: function(key, inArray) {
                key = key.substring(2);
                if (inArray) {
                    // remove the space at the end, and the dash before each character
                    key = key.substr(0, key.length - 1).replace(/-(.)/g, '$1');
                }
                return key;
            }
        },

        // Arrays are encoded as JSON strings.
        // An extra, value is added to each array during encoding to make empty arrays sort correctly.
        array: {
            encode: function(key) {
                var encoded = [];
                for (var i = 0; i < key.length; i++) {
                    var item = key[i];
                    var encodedItem = idbModules.Key.encode(item, true);        // encode the array item
                    encoded[i] = encodedItem;
                }
                encoded.push(collations.indexOf("undefined") + "-");            // append an extra item, so empty arrays sort correctly
                return collations.indexOf("array") + "-" + JSON.stringify(encoded);
            },
            decode: function(key) {
                var decoded = JSON.parse(key.substring(2));
                decoded.pop();                                                  // remove the extra item
                for (var i = 0; i < decoded.length; i++) {
                    var item = decoded[i];
                    var decodedItem = idbModules.Key.decode(item, true);        // decode the item
                    decoded[i] = decodedItem;
                }
                return decoded;
            }
        }
    };

    /**
     * Flips each digit of a base-36 encoded number, if negative
     * @param {string} sign - 0 = negative, z = positive
     * @param {string} encoded
     */
    function flipBase36(sign, encoded) {
        if (sign === '0') {
            var flipped = '';
            for (var i = 0; i < encoded.length; i++) {
                flipped += (35 - parseInt(encoded[i], 36)).toString(36);
            }
            return flipped;
        }
        return encoded;
    }

    /**
     * Returns the string "number", "date", "string", or "array".
     */
    function getType(key) {
        if (key instanceof Date) {
            return "date";
        }
        if (key instanceof Array) {
            return "array";
        }
        return typeof key;
    }

    /**
     * Keys must be strings, numbers, Dates, or Arrays
     */
    function validate(key) {
        var type = getType(key);
        if (type === "array") {
            for (var i = 0; i < key.length; i++) {
                validate(key[i]);
            }
        }
        else if (!types[type] || (type !== "string" && isNaN(key))) {
            throw idbModules.util.createDOMException("DataError", "Not a valid key");
        }
    }

    /**
     * Returns the value of an inline key
     * @param {object} source
     * @param {string|array} keyPath
     */
    function getValue(source, keyPath) {
        try {
            if (keyPath instanceof Array) {
                var arrayValue = [];
                for (var i = 0; i < keyPath.length; i++) {
                    arrayValue.push(eval("source." + keyPath[i]));
                }
                return arrayValue;
            } else {
                return eval("source." + keyPath);
            }
        }
        catch (e) {
            return undefined;
        }
    }

    /**
     * Sets the inline key value
     * @param {object} source
     * @param {string} keyPath
     * @param {*} value
     */
    function setValue(source, keyPath, value) {
        var props = keyPath.split('.');
        for (var i = 0; i < props.length - 1; i++) {
            var prop = props[i];
            source = source[prop] = source[prop] || {};
        }
        source[props[props.length - 1]] = value;
    }

    /**
     * Determines whether an index entry matches a multi-entry key value.
     * @param {string} encodedEntry     The entry value (already encoded)
     * @param {string} encodedKey       The full index key (already encoded)
     * @returns {boolean}
     */
    function isMultiEntryMatch(encodedEntry, encodedKey) {
        var keyType = collations[encodedKey.substring(0, 1)];

        if (keyType === "array") {
            return encodedKey.indexOf(encodedEntry) > 1;
        }
        else {
            return encodedKey === encodedEntry;
        }
    }

    function isKeyInRange(key, range) {
        var lowerMatch = range.lower === undefined;
        var upperMatch = range.upper === undefined;

        if (range.lower !== undefined) {
            if (range.lowerOpen && key > range.lower) {
                lowerMatch = true;
            }
            if (!range.lowerOpen && key >= range.lower) {
                lowerMatch = true;
            }
        }
        if (range.upper !== undefined) {
            if (range.upperOpen && key < range.upper) {
                upperMatch = true;
            }
            if (!range.upperOpen && key <= range.upper) {
                upperMatch = true;
            }
        }

        return lowerMatch && upperMatch;
    }

    function findMultiEntryMatches(keyEntry, range) {
        var matches = [];

        if (keyEntry instanceof Array) {
            for (var i = 0; i < keyEntry.length; i++) {
                var key = keyEntry[i];

                if (key instanceof Array) {
                    if (range.lower === range.upper) {
                        continue;
                    }
                    if (key.length === 1) {
                        key = key[0];
                    } else {
                        var nested = findMultiEntryMatches(key, range);
                        if (nested.length > 0) {
                            matches.push(key);
                        }
                        continue;
                    }
                }

                if (isKeyInRange(key, range)) {
                    matches.push(key);
                }
            }
        } else {
            if (isKeyInRange(keyEntry, range)) {
                matches.push(keyEntry);
            }
        }
        return matches;
    }

    idbModules.Key = {
        encode: function(key, inArray) {
            if (key === undefined) {
                return null;
            }
            return types[getType(key)].encode(key, inArray);
        },
        decode: function(key, inArray) {
            if (typeof key !== "string") {
                return undefined;
            }
            return types[collations[key.substring(0, 1)]].decode(key, inArray);
        },
        validate: validate,
        getValue: getValue,
        setValue: setValue,
        isMultiEntryMatch: isMultiEntryMatch,
        findMultiEntryMatches: findMultiEntryMatches
    };
}(idbModules));

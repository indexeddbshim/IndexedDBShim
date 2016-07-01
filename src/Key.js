import {createDOMException} from './DOMException.js';
import * as util from './util.js';

let Key = {};

/**
 * Encodes the keys based on their types. This is required to maintain collations
 */
const collations = ['undefined', 'number', 'date', 'string', 'array'];

/**
 * The sign values for numbers, ordered from least to greatest.
 *  - "negativeInfinity": Sorts below all other values.
 *  - "bigNegative": Negative values less than or equal to negative one.
 *  - "smallNegative": Negative values between negative one and zero, noninclusive.
 *  - "smallPositive": Positive values between zero and one, including zero but not one.
 *  - "largePositive": Positive values greater than or equal to one.
 *  - "positiveInfinity": Sorts above all other values.
 */
const signValues = ['negativeInfinity', 'bigNegative', 'smallNegative', 'smallPositive', 'bigPositive', 'positiveInfinity'];

// Todo: Support `ArrayBuffer`/Views on buffers (`TypedArray` or `DataView`)
const types = {
    // Undefined is not a valid key type.  It's only used when there is no key.
    undefined: {
        encode: function (key) {
            return collations.indexOf('undefined') + '-';
        },
        decode: function (key) {
            return undefined;
        }
    },

    // Numbers are represented in a lexically sortable base-32 sign-exponent-mantissa
    // notation.
    //
    // sign: takes a value between zero and five, inclusive. Represents infinite cases
    //     and the signs of both the exponent and the fractional part of the number.
    // exponent: paded to two base-32 digits, represented by the 32's compliment in the
    //     "smallPositive" and "bigNegative" cases to ensure proper lexical sorting.
    // mantissa: also called the fractional part. Normed 11-digit base-32 representation.
    //     Represented by the 32's compliment in the "smallNegative" and "bigNegative"
    //     cases to ensure proper lexical sorting.
    number: {
        // The encode step checks for six numeric cases and generates 14-digit encoded
        // sign-exponent-mantissa strings.
        encode: function (key) {
            let key32 = Math.abs(key).toString(32);
            // Get the index of the decimal.
            const decimalIndex = key32.indexOf('.');
            // Remove the decimal.
            key32 = (decimalIndex !== -1) ? key32.replace('.', '') : key32;
            // Get the index of the first significant digit.
            const significantDigitIndex = key32.search(/[^0]/);
            // Truncate leading zeros.
            key32 = key32.slice(significantDigitIndex);
            let sign, exponent = zeros(2), mantissa = zeros(11);

            // Finite cases:
            if (isFinite(key)) {
                // Negative cases:
                if (key < 0) {
                    // Negative exponent case:
                    if (key > -1) {
                        sign = signValues.indexOf('smallNegative');
                        exponent = padBase32Exponent(significantDigitIndex);
                        mantissa = flipBase32(padBase32Mantissa(key32));
                    // Non-negative exponent case:
                    } else {
                        sign = signValues.indexOf('bigNegative');
                        exponent = flipBase32(padBase32Exponent(
                            (decimalIndex !== -1) ? decimalIndex : key32.length
                        ));
                        mantissa = flipBase32(padBase32Mantissa(key32));
                    }
                // Non-negative cases:
                } else {
                    // Negative exponent case:
                    if (key < 1) {
                        sign = signValues.indexOf('smallPositive');
                        exponent = flipBase32(padBase32Exponent(significantDigitIndex));
                        mantissa = padBase32Mantissa(key32);
                    // Non-negative exponent case:
                    } else {
                        sign = signValues.indexOf('bigPositive');
                        exponent = padBase32Exponent(
                            (decimalIndex !== -1) ? decimalIndex : key32.length
                        );
                        mantissa = padBase32Mantissa(key32);
                    }
                }
            // Infinite cases:
            } else {
                sign = signValues.indexOf(
                    key > 0 ? 'positiveInfinity' : 'negativeInfinity'
                );
            }

            return collations.indexOf('number') + '-' + sign + exponent + mantissa;
        },
        // The decode step must interpret the sign, reflip values encoded as the 32's complements,
        // apply signs to the exponent and mantissa, do the base-32 power operation, and return
        // the original JavaScript number values.
        decode: function (key) {
            const sign = +key.substr(2, 1);
            let exponent = key.substr(3, 2);
            let mantissa = key.substr(5, 11);

            switch (signValues[sign]) {
            case 'negativeInfinity':
                return -Infinity;
            case 'positiveInfinity':
                return Infinity;
            case 'bigPositive':
                return pow32(mantissa, exponent);
            case 'smallPositive':
                exponent = negate(flipBase32(exponent));
                return pow32(mantissa, exponent);
            case 'smallNegative':
                exponent = negate(exponent);
                mantissa = flipBase32(mantissa);
                return -pow32(mantissa, exponent);
            case 'bigNegative':
                exponent = flipBase32(exponent);
                mantissa = flipBase32(mantissa);
                return -pow32(mantissa, exponent);
            default:
                throw new Error('Invalid number.');
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
        encode: function (key, inArray) {
            if (inArray) {
                // prepend each character with a dash, and append a space to the end
                key = key.replace(/(.)/g, '-$1') + ' ';
            }
            return collations.indexOf('string') + '-' + key;
        },
        decode: function (key, inArray) {
            key = key.slice(2);
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
        encode: function (key) {
            const encoded = [];
            for (let i = 0; i < key.length; i++) {
                const item = key[i];
                const encodedItem = encode(item, true);        // encode the array item
                encoded[i] = encodedItem;
            }
            encoded.push(collations.indexOf('undefined') + '-');            // append an extra item, so empty arrays sort correctly
            return collations.indexOf('array') + '-' + JSON.stringify(encoded);
        },
        decode: function (key) {
            const decoded = JSON.parse(key.slice(2));
            decoded.pop();                                                  // remove the extra item
            for (let i = 0; i < decoded.length; i++) {
                const item = decoded[i];
                const decodedItem = decode(item, true);        // decode the item
                decoded[i] = decodedItem;
            }
            return decoded;
        }
    },

    // Dates are encoded as ISO 8601 strings, in UTC time zone.
    date: {
        encode: function (key) {
            return collations.indexOf('date') + '-' + key.toJSON();
        },
        decode: function (key) {
            return new Date(key.slice(2));
        }
    }
};

/**
 * Return a padded base-32 exponent value.
 * @param {number}
 * @return {string}
 */
function padBase32Exponent (n) {
    n = n.toString(32);
    return (n.length === 1) ? '0' + n : n;
}

/**
 * Return a padded base-32 mantissa.
 * @param {string}
 * @return {string}
 */
function padBase32Mantissa (s) {
    return (s + zeros(11)).slice(0, 11);
}

/**
 * Flips each digit of a base-32 encoded string.
 * @param {string} encoded
 */
function flipBase32 (encoded) {
    let flipped = '';
    for (let i = 0; i < encoded.length; i++) {
        flipped += (31 - parseInt(encoded[i], 32)).toString(32);
    }
    return flipped;
}

/**
 * Base-32 power function.
 * RESEARCH: This function does not precisely decode floats because it performs
 * floating point arithmetic to recover values. But can the original values be
 * recovered exactly?
 * Someone may have already figured out a good way to store JavaScript floats as
 * binary strings and convert back. Barring a better method, however, one route
 * may be to generate decimal strings that `parseFloat` decodes predictably.
 * @param {string}
 * @param {string}
 * @return {number}
 */
function pow32 (mantissa, exponent) {
    exponent = parseInt(exponent, 32);
    if (exponent < 0) {
        return roundToPrecision(
            parseInt(mantissa, 32) * Math.pow(32, exponent - 10)
        );
    } else {
        if (exponent < 11) {
            let whole = mantissa.slice(0, exponent);
            whole = parseInt(whole, 32);
            let fraction = mantissa.slice(exponent);
            fraction = parseInt(fraction, 32) * Math.pow(32, exponent - 11);
            return roundToPrecision(whole + fraction);
        } else {
            const expansion = mantissa + zeros(exponent - 11);
            return parseInt(expansion, 32);
        }
    }
}

/**
 *
 */
function roundToPrecision (num, precision) {
    precision = precision || 16;
    return parseFloat(num.toPrecision(precision));
}

/**
 * Returns a string of n zeros.
 * @param {number}
 * @return {string}
 */
function zeros (n) {
    let result = '';
    while (n--) {
        result = result + '0';
    }
    return result;
}

/**
 * Negates numeric strings.
 * @param {string}
 * @return {string}
 */
function negate (s) {
    return '-' + s;
}

/**
 * Returns the string "number", "date", "string", or "array".
 */
function getType (key) {
    if (Array.isArray(key)) return 'array';
    if (util.isDate(key)) return 'date';
    // if (util.isArrayBufferOrView(key)) return 'ArrayBuffer'; // Todo: Uncomment when supported
    return typeof key;
}

/**
 * Keys must be strings, numbers (besides NaN), Dates (if value is not NaN),
 *   Arrays (or, once supported, ArrayBuffer) objects
 */
function validate (key, arrayRefs) {
    const type = getType(key);
    switch (type) {
    case 'ArrayBuffer': // Will just return once implemented (not a possible type yet)
        return;
    case 'array':
        arrayRefs = arrayRefs || [];
        arrayRefs.push(key);
        for (let i = 0; i < key.length; i++) { // We cannot iterate here with array extras as we must ensure sparse arrays are invalidated
            const item = key[i];
            if (arrayRefs.includes(item)) throw createDOMException('DataError', 'An array key cannot be circular');
            validate(item, arrayRefs);
        }
        return;
    case 'date':
        if (!Number.isNaN(key.getTime())) {
            return;
        }
        // Falls through
    default:
        // allow for strings, numbers instead of first part of this check:
        // Other `typeof` types which are not valid keys:
        //    'undefined', 'boolean', 'object' (including `null`), 'symbol', 'function'
        if (!['string', 'number'].includes(type) || Number.isNaN(key)) {
            throw createDOMException('DataError', 'Not a valid key');
        }
    }
}

/**
 * Returns the value of an inline key based on a key path
 * @param {object} source
 * @param {string|array} keyPath
 */
function evaluateKeyPathOnValue (value, keyPath) {
    if (Array.isArray(keyPath)) {
        const arrayValue = [];
        return keyPath.some((kpPart) => {
            const key = evaluateKeyPathOnValue(value, kpPart);
            try {
                validate(key);
            } catch (err) {
                return true;
            }
            arrayValue.push(key);
        }, []) ? undefined : arrayValue;
    }
    if (keyPath === '') {
        return value;
    }
    const identifiers = keyPath.split('.');
    if (typeof value === 'string' && identifiers.slice(-1) === 'length') {
        return value.length;
    }
    if (!util.isObj(value)) {
        return undefined;
    }
    identifiers.some((idntfr) => {
        value = value[idntfr];
        return value === undefined;
    });
    return value;
}

/**
 * Sets the inline key value
 * @param {object} source
 * @param {string} keyPath
 * @param {*} value
 */
function setValue (source, keyPath, value) {
    const props = keyPath.split('.');
    for (let i = 0; i < props.length - 1; i++) {
        const prop = props[i];
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
function isMultiEntryMatch (encodedEntry, encodedKey) {
    const keyType = collations[encodedKey.substring(0, 1)];

    if (keyType === 'array') {
        return encodedKey.indexOf(encodedEntry) > 1;
    } else {
        return encodedKey === encodedEntry;
    }
}

function isKeyInRange (key, range, checkCached) {
    let lowerMatch = range.lower === undefined;
    let upperMatch = range.upper === undefined;
    const encodedKey = encode(key, true);
    const lower = checkCached ? range.__lowerCached : encode(range.lower, true);
    const upper = checkCached ? range.__upperCached : encode(range.upper, true);

    if (range.lower !== undefined) {
        if (range.lowerOpen && encodedKey > lower) {
            lowerMatch = true;
        }
        if (!range.lowerOpen && encodedKey >= lower) {
            lowerMatch = true;
        }
    }
    if (range.upper !== undefined) {
        if (range.upperOpen && encodedKey < upper) {
            upperMatch = true;
        }
        if (!range.upperOpen && encodedKey <= upper) {
            upperMatch = true;
        }
    }

    return lowerMatch && upperMatch;
}

function findMultiEntryMatches (keyEntry, range) {
    const matches = [];

    if (Array.isArray(keyEntry)) {
        for (let i = 0; i < keyEntry.length; i++) {
            let key = keyEntry[i];

            if (Array.isArray(key)) {
                if (range.lower === range.upper) {
                    continue;
                }
                if (key.length === 1) {
                    key = key[0];
                } else {
                    const nested = findMultiEntryMatches(key, range);
                    if (nested.length > 0) {
                        matches.push(key);
                    }
                    continue;
                }
            }

            if (isKeyInRange(key, range, true)) {
                matches.push(key);
            }
        }
    } else {
        if (isKeyInRange(keyEntry, range, true)) {
            matches.push(keyEntry);
        }
    }
    return matches;
}

function encode (key, inArray) {
    // Bad keys like `null`, `object`, `boolean`, 'function', 'symbol' should not be passed here due to prior validation
    if (key === undefined) {
        return null;
    }
    // Currently has array, date, number, string
    return types[getType(key)].encode(key, inArray);
}
function decode (key, inArray) {
    if (typeof key !== 'string') {
        return undefined;
    }
    return types[collations[key.substring(0, 1)]].decode(key, inArray);
}

Key = {encode, decode, validate, evaluateKeyPathOnValue, setValue, isMultiEntryMatch, isKeyInRange, findMultiEntryMatches};
export {encode, decode, validate, evaluateKeyPathOnValue, setValue, isMultiEntryMatch, isKeyInRange, findMultiEntryMatches, Key as default};

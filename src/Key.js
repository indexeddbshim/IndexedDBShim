import {createDOMException} from './DOMException.js';
import * as util from './util.js';
import cmp from './cmp.js';
import CFG from './CFG.js';

/**
 * @typedef {NodeJS.TypedArray|DataView} ArrayBufferView
 */

/**
 * @typedef {ArrayBufferView|ArrayBuffer} BufferSource
 */

/**
 * @typedef {"number"|"date"|"string"|"binary"|"array"} KeyType
 */

/**
 * @typedef {any} Value
 */

/**
 * @typedef {any} Key
 * @todo Specify possible value more precisely
 */

/**
 * @typedef {KeyPath[]} KeyPathArray
 */
/**
 * @typedef {string|KeyPathArray} KeyPath
 */

/**
* @typedef {object} KeyValueObject
* @property {KeyType|"NaN"|"null"|"undefined"|"boolean"|"object"|"symbol"|
*   "function"|"bigint"} type If not `KeyType`, indicates invalid value
* @property {Value} [value]
* @property {boolean} [invalid]
* @property {string} [message]
* @todo Specify acceptable `value` more precisely
*/

/**
 * @typedef {number|string|Date|ArrayBuffer} ValueTypePrimitive
 */
/**
 * @typedef {ValueType[]} ValueTypeArray
 */
/**
 * @typedef {ValueTypePrimitive|ValueTypeArray} ValueType
 */

/**
 * Encodes the keys based on their types. This is required to maintain collations
 * We leave space for future keys.
 * @type {{[key: string]: Integer|string}}
 */
const keyTypeToEncodedChar = {
    invalid: 100,
    number: 200,
    date: 300,
    string: 400,
    binary: 500,
    array: 600
};
const keyTypes = /** @type {(KeyType|"invalid")[]} */ (Object.keys(keyTypeToEncodedChar));
keyTypes.forEach((k) => {
    keyTypeToEncodedChar[k] = String.fromCodePoint(
        /** @type {number} */ (keyTypeToEncodedChar[k])
    );
});

const encodedCharToKeyType = keyTypes.reduce((o, k) => {
    o[keyTypeToEncodedChar[k]] = k;
    return o;
}, /** @type {{[key: string]: KeyType|"invalid"}} */ ({}));

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

/**
 * @typedef {any} AnyValue
 */

/**
 * @type {{
 *   [key: string]: {
 *     encode: (param: any, inArray?: boolean) => string,
 *     decode: (param: string, inArray?: boolean) => any
 *   }
 * }}
 */
const types = {
    invalid: {
        /**
         * @returns {string}
         */
        encode () {
            return keyTypeToEncodedChar.invalid + '-';
        },
        /**
         * @returns {undefined}
         */
        decode () {
            return undefined;
        }
    },

    // Numbers are represented in a lexically sortable base-32 sign-exponent-mantissa
    // notation.
    //
    // sign: takes a value between zero and five, inclusive. Represents infinite cases
    //     and the signs of both the exponent and the fractional part of the number.
    // exponent: padded to two base-32 digits, represented by the 32's compliment in the
    //     "smallPositive" and "bigNegative" cases to ensure proper lexical sorting.
    // mantissa: also called the fractional part. Normed 11-digit base-32 representation.
    //     Represented by the 32's compliment in the "smallNegative" and "bigNegative"
    //     cases to ensure proper lexical sorting.
    number: {
        // The encode step checks for six numeric cases and generates 14-digit encoded
        // sign-exponent-mantissa strings.
        /**
         * @param {number} key
         * @returns {string}
         */
        encode (key) {
            let key32 = key === Number.MIN_VALUE
                // Mocha test `IDBFactory/cmp-spec.js` exposed problem for some
                //   Node (and Chrome) versions with `Number.MIN_VALUE` being treated
                //   as 0
                // https://stackoverflow.com/questions/43305403/number-min-value-and-tostring
                ? '0.' + '0'.repeat(214) + '2'
                : Math.abs(key).toString(32);
            // Get the index of the decimal.
            const decimalIndex = key32.indexOf('.');
            // Remove the decimal.
            key32 = (decimalIndex !== -1) ? key32.replace('.', '') : key32;
            // Get the index of the first significant digit.
            const significantDigitIndex = key32.search(/[^0]/u);
            // Truncate leading zeros.
            key32 = key32.slice(significantDigitIndex);
            let sign, exponent, mantissa;

            // Finite cases:
            if (Number.isFinite(
                Number(key)
            )) {
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
                // Negative exponent case:
                } else if (key < 1) {
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
            // Infinite cases:
            } else {
                exponent = zeros(2);
                mantissa = zeros(11);
                sign = signValues.indexOf(
                    key > 0 ? 'positiveInfinity' : 'negativeInfinity'
                );
            }

            return keyTypeToEncodedChar.number + '-' + sign + exponent + mantissa;
        },
        // The decode step must interpret the sign, reflip values encoded as the 32's complements,
        // apply signs to the exponent and mantissa, do the base-32 power operation, and return
        // the original JavaScript number values.
        /**
         * @param {string} key
         * @returns {number}
         */
        decode (key) {
            const sign = Number(key.slice(2, 3));
            let exponent = key.slice(3, 5);
            let mantissa = key.slice(5, 16);

            switch (signValues[sign]) {
            case 'negativeInfinity':
                return Number.NEGATIVE_INFINITY;
            case 'positiveInfinity':
                return Number.POSITIVE_INFINITY;
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
    // If the strings are in an array, then some extra encoding is done to make sorting work correctly:
    // Since we can't force all strings to be the same length, we need to ensure that characters line-up properly
    // for sorting, while also accounting for the extra characters that are added when the array itself is encoded as JSON.
    // To do this, each character of the string is prepended with a dash ("-"), and a space is added to the end of the string.
    // This effectively doubles the size of every string, but it ensures that when two arrays of strings are compared,
    // the indexes of each string's characters line up with each other.
    string: {
        /**
         * @param {string} key
         * @param {boolean} [inArray]
         * @returns {string}
         */
        encode (key, inArray) {
            if (inArray) {
                // prepend each character with a dash, and append a space to the end
                key = key.replaceAll(/(.)/gu, '-$1') + ' ';
            }
            return keyTypeToEncodedChar.string + '-' + key;
        },
        /**
         * @param {string} key
         * @param {boolean} [inArray]
         * @returns {string}
         */
        decode (key, inArray) {
            key = key.slice(2);
            if (inArray) {
                // remove the space at the end, and the dash before each character
                key = key.slice(0, -1).replaceAll(/-(.)/gu, '$1');
            }
            return key;
        }
    },

    // Arrays are encoded as JSON strings.
    // An extra, value is added to each array during encoding to make
    //  empty arrays sort correctly.
    array: {
        /**
         * @param {ValueTypeArray} key
         * @returns {string}
         */
        encode (key) {
            const encoded = [];
            for (const [i, item] of key.entries()) {
                const encodedItem = encode(item, true); // encode the array item
                encoded[i] = encodedItem;
            }
            encoded.push(keyTypeToEncodedChar.invalid + '-'); // append an extra item, so empty arrays sort correctly
            return keyTypeToEncodedChar.array + '-' + JSON.stringify(encoded);
        },
        /**
         * @param {string} key
         * @returns {ValueTypeArray}
         */
        decode (key) {
            const decoded = JSON.parse(key.slice(2));
            decoded.pop(); // remove the extra item
            for (let i = 0; i < decoded.length; i++) {
                const item = decoded[i];
                const decodedItem = decode(item, true); // decode the item
                decoded[i] = decodedItem;
            }
            return decoded;
        }
    },

    // Dates are encoded as ISO 8601 strings, in UTC time zone.
    date: {
        /**
         * @param {Date} key
         * @returns {string}
         */
        encode (key) {
            return keyTypeToEncodedChar.date + '-' + key.toJSON();
        },
        /**
         * @param {string} key
         * @returns {Date}
         */
        decode (key) {
            return new Date(key.slice(2));
        }
    },
    binary: {
        // `ArrayBuffer`/Views on buffers (`TypedArray` or `DataView`)
        /**
         * @param {BufferSource} key
         * @returns {string}
         */
        encode (key) {
            return keyTypeToEncodedChar.binary + '-' + (key.byteLength
                ? [...getCopyBytesHeldByBufferSource(key)].map(
                    (b) => String(b).padStart(3, '0')
                ) // e.g., '255,005,254,000,001,033'
                : '');
        },
        /**
         * @param {string} key
         * @returns {ArrayBuffer}
         */
        decode (key) {
            // Set the entries in buffer's [[ArrayBufferData]] to those in `value`
            const k = key.slice(2);
            const arr = k.length ? k.split(',').map((s) => Number.parseInt(s)) : [];
            const buffer = new ArrayBuffer(arr.length);
            const uint8 = new Uint8Array(buffer);
            uint8.set(arr);
            return buffer;
        }
    }
};

/**
 * Return a padded base-32 exponent value.
 * @param {number} n
 * @returns {string}
 */
function padBase32Exponent (n) {
    const exp = n.toString(32);
    return (exp.length === 1) ? '0' + exp : exp;
}

/**
 * Return a padded base-32 mantissa.
 * @param {string} s
 * @returns {string}
 */
function padBase32Mantissa (s) {
    return (s + zeros(11)).slice(0, 11);
}

/**
 * Flips each digit of a base-32 encoded string.
 * @param {string} encoded
 * @returns {string}
 */
function flipBase32 (encoded) {
    let flipped = '';
    for (const ch of encoded) {
        flipped += (31 - Number.parseInt(ch, 32)).toString(32);
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
 * @param {string} mantissa
 * @param {string} exponent
 * @returns {number}
 */
function pow32 (mantissa, exponent) {
    const exp = Number.parseInt(exponent, 32);
    if (exp < 0) {
        return roundToPrecision(
            Number.parseInt(mantissa, 32) * (32 ** (exp - 10))
        );
    }
    if (exp < 11) {
        const whole = mantissa.slice(0, exp);
        const wholeNum = Number.parseInt(whole, 32);
        const fraction = mantissa.slice(exp);
        const fractionNum = Number.parseInt(fraction, 32) * (32 ** (exp - 11));
        return roundToPrecision(wholeNum + fractionNum);
    }
    const expansion = mantissa + zeros(exp - 11);
    return Number.parseInt(expansion, 32);
}

/**
 * @typedef {number} Float
 */

/**
 * @param {Float} num
 * @param {Float} [precision]
 * @returns {Float}
 */
function roundToPrecision (num, precision = 16) {
    return Number.parseFloat(num.toPrecision(precision));
}

/**
 * Returns a string of n zeros.
 * @param {number} n
 * @returns {string}
 */
function zeros (n) {
    return '0'.repeat(n);
}

/**
 * Negates numeric strings.
 * @param {string} s
 * @returns {string}
 */
function negate (s) {
    return '-' + s;
}

/**
 * @param {Key} key
 * @returns {KeyType|"invalid"}
 */
function getKeyType (key) {
    if (Array.isArray(key)) { return 'array'; }
    if (util.isDate(key)) { return 'date'; }
    if (util.isBinary(key)) { return 'binary'; }
    const keyType = typeof key;
    return ['string', 'number'].includes(keyType)
        ? /** @type {"string"|"number"} */ (keyType)
        : 'invalid';
}

/**
 * Keys must be strings, numbers (besides `NaN`), Dates (if value is not
 *   `NaN`), binary objects or Arrays.
 * @param {Value} input The key input
 * @param {Value[]|null|undefined} [seen] An array of already seen keys
 * @returns {KeyValueObject}
 */
function convertValueToKey (input, seen) {
    return convertValueToKeyValueDecoded(input, seen, false, true);
}

/**
* Currently not in use.
* @param {Value} input
* @returns {KeyValueObject}
*/
function convertValueToMultiEntryKey (input) {
    return convertValueToKeyValueDecoded(input, null, true, true);
}

/**
 *
 * @param {BufferSource} O
 * @throws {TypeError}
 * @see https://heycam.github.io/webidl/#ref-for-dfn-get-buffer-source-copy-2
 * @returns {Uint8Array}
 */
function getCopyBytesHeldByBufferSource (O) {
    let offset = 0;
    let length = 0;
    if (ArrayBuffer.isView(O)) { // Has [[ViewedArrayBuffer]] internal slot
        const arrayBuffer = O.buffer;
        if (arrayBuffer === undefined) {
            throw new TypeError(
                'Could not copy the bytes held by a buffer source as the buffer was undefined.'
            );
        }
        offset = O.byteOffset; // [[ByteOffset]] (will also throw as desired if detached)
        length = O.byteLength; // [[ByteLength]] (will also throw as desired if detached)
    } else {
        length = O.byteLength; // [[ArrayBufferByteLength]] on ArrayBuffer (will also throw as desired if detached)
    }
    // const octets = new Uint8Array(input);
    // const octets = types.binary.decode(types.binary.encode(input));
    return new Uint8Array(
        // Should allow DataView
        /** @type {ArrayBuffer} */
        (('buffer' in O && O.buffer) || O),
        offset,
        length
    );
}

/**
* Shortcut utility to avoid returning full keys from `convertValueToKey`
*   and subsequent need to process in calling code unless `fullKeys` is
*   set; may throw.
* @param {Value} input
* @param {Value[]|null} [seen]
* @param {boolean} [multiEntry]
* @param {boolean} [fullKeys]
* @throws {TypeError} See `getCopyBytesHeldByBufferSource`
* @todo Document other allowable `input`
* @returns {KeyValueObject}
*/
function convertValueToKeyValueDecoded (input, seen, multiEntry, fullKeys) {
    seen = seen || [];
    if (seen.includes(input)) {
        return {
            type: 'array',
            invalid: true,
            message: 'An array key cannot be circular'
        };
    }
    const type = getKeyType(input);
    const ret = {type, value: input};
    switch (type) {
    case 'number': {
        if (Number.isNaN(input)) {
            // List as 'NaN' type for convenience of consumers in reporting errors
            return {type: 'NaN', invalid: true};
        }

        // https://github.com/w3c/IndexedDB/issues/375
        // https://github.com/w3c/IndexedDB/pull/386
        if (Object.is(input, -0)) {
            return {type, value: 0};
        }
        return /** @type {{type: KeyType; value: Value}} */ (ret);
    } case 'string': {
        return /** @type {{type: KeyType; value: Value}} */ (ret);
    } case 'binary': { // May throw (if detached)
        // Get a copy of the bytes held by the buffer source
        // https://heycam.github.io/webidl/#ref-for-dfn-get-buffer-source-copy-2
        const octets = getCopyBytesHeldByBufferSource(
            /** @type {BufferSource} */ (input)
        );
        return {type: 'binary', value: octets};
    } case 'array': { // May throw (from binary)
        const arr = /** @type {Array<any>} */ (input);
        const len = arr.length;
        seen.push(input);

        /** @type {(KeyValueObject|Value)[]} */
        const keys = [];
        for (let i = 0; i < len; i++) { // We cannot iterate here with array extras as we must ensure sparse arrays are invalidated
            if (!multiEntry && !Object.hasOwn(arr, i)) {
                return {type, invalid: true, message: 'Does not have own index property'};
            }
            try {
                const entry = arr[i];
                const key = convertValueToKeyValueDecoded(entry, seen, false, fullKeys); // Though steps do not list rethrowing, the next is returnifabrupt when not multiEntry
                if (key.invalid) {
                    if (multiEntry) {
                        continue;
                    }
                    return {type, invalid: true, message: 'Bad array entry value-to-key conversion'};
                }
                if (!multiEntry ||
                    (!fullKeys && keys.every((k) => cmp(k, key.value) !== 0)) ||
                    (fullKeys && keys.every((k) => cmp(k, key) !== 0))
                ) {
                    keys.push(fullKeys ? key : key.value);
                }
            } catch (err) {
                if (!multiEntry) {
                    throw err;
                }
            }
        }
        return {type, value: keys};
    } case 'date': {
        const date = /** @type {Date} */ (input);
        if (!Number.isNaN(date.getTime())) {
            return fullKeys
                ? {type, value: date.getTime()}
                : {type, value: new Date(date)};
        }
        return {type, invalid: true, message: 'Not a valid date'};
        // Falls through
    } case 'invalid': default: {
        // Other `typeof` types which are not valid keys:
        //    'undefined', 'boolean', 'object' (including `null`), 'symbol', 'function'
        const type = input === null ? 'null' : typeof input; // Convert `null` for convenience of consumers in reporting errors
        return {type, invalid: true, message: 'Not a valid key; type ' + type};
    }
    }
}

/**
 *
 * @param {Key} key
 * @param {boolean} [fullKeys]
 * @returns {KeyValueObject}
 * @todo Document other allowable `key`?
 */
function convertValueToMultiEntryKeyDecoded (key, fullKeys) {
    return convertValueToKeyValueDecoded(key, null, true, fullKeys);
}

/**
* An internal utility.
* @param {Value} input
* @param {Value[]|null|undefined} [seen]
* @throws {DOMException} `DataError`
* @returns {KeyValueObject}
*/
function convertValueToKeyRethrowingAndIfInvalid (input, seen) {
    const key = convertValueToKey(input, seen);
    if (key.invalid) {
        throw createDOMException('DataError', key.message || 'Not a valid key; type: ' + key.type);
    }
    return key;
}

/**
 *
 * @param {Value} value
 * @param {KeyPath} keyPath
 * @param {boolean} multiEntry
 * @returns {KeyValueObject|KeyPathEvaluateValue}
 * @todo Document other possible return?
 */
function extractKeyFromValueUsingKeyPath (value, keyPath, multiEntry) {
    return extractKeyValueDecodedFromValueUsingKeyPath(value, keyPath, multiEntry, true);
}
/**
* Not currently in use.
* @param {Value} value
* @param {KeyPath} keyPath
* @param {boolean} multiEntry
* @returns {KeyPathEvaluateValue}
*/
function evaluateKeyPathOnValue (value, keyPath, multiEntry) {
    return evaluateKeyPathOnValueToDecodedValue(value, keyPath, multiEntry, true);
}

/**
* May throw, return `{failure: true}` (e.g., non-object on keyPath resolution)
*    or `{invalid: true}` (e.g., `NaN`).
* @param {Value} value
* @param {KeyPath} keyPath
* @param {boolean} [multiEntry]
* @param {boolean} [fullKeys]
* @returns {KeyValueObject|KeyPathEvaluateValue}
* @todo Document other possible return?
*/
function extractKeyValueDecodedFromValueUsingKeyPath (value, keyPath, multiEntry, fullKeys) {
    const r = evaluateKeyPathOnValueToDecodedValue(value, keyPath, multiEntry, fullKeys);
    if (r.failure) {
        return r;
    }
    if (!multiEntry) {
        return convertValueToKeyValueDecoded(r.value, null, false, fullKeys);
    }
    return convertValueToMultiEntryKeyDecoded(r.value, fullKeys);
}

/**
 * Unused?
 * @typedef {object} KeyPathEvaluateFailure
 * @property {boolean} failure
 */

/**
 * @typedef {KeyPathEvaluateValueValue[]} KeyPathEvaluateValueValueArray
 */

/**
 * @typedef {undefined|number|string|Date|object|KeyPathEvaluateValueValueArray} KeyPathEvaluateValueValue
 */

/**
 * @typedef {object} KeyPathEvaluateValue
 * @property {KeyPathEvaluateValueValue} [value]
 * @property {boolean} [failure]
 */

/**
 * Returns the value of an inline key based on a key path (wrapped in an
 *   object with key `value`) or `{failure: true}`
 * @param {Value} value
 * @param {KeyPath} keyPath
 * @param {boolean} [multiEntry]
 * @param {boolean} [fullKeys]
 * @returns {KeyPathEvaluateValue}
 */
function evaluateKeyPathOnValueToDecodedValue (value, keyPath, multiEntry, fullKeys) {
    if (Array.isArray(keyPath)) {
        /** @type {KeyPathEvaluateValueValueArray} */
        const result = [];
        return keyPath.some((item) => {
            const key = evaluateKeyPathOnValueToDecodedValue(value, item, multiEntry, fullKeys);
            if (key.failure) {
                return true;
            }
            result.push(key.value);
            return false;
        })
            ? {failure: true}
            : {value: result};
    }
    if (keyPath === '') {
        return {value};
    }
    const identifiers = keyPath.split('.');
    return identifiers.some((idntfr) => {
        if (idntfr === 'length' && (
            typeof value === 'string' || Array.isArray(value)
        )) {
            value = value.length;
        } else if (util.isBlob(value)) {
            switch (idntfr) {
            case 'size': case 'type':
                value = /** @type {Blob} */ (value)[idntfr];
                break;
            default:
                break;
            }
        } else if (util.isFile(value)) {
            switch (idntfr) {
            case 'name': case 'lastModified':
                value = /** @type {File} */ (value)[idntfr];
                break;
            case 'lastModifiedDate':
                value = new Date(/** @type {File} */ (value).lastModified);
                break;
            default:
                break;
            }
        } else if (!util.isObj(value) || !Object.hasOwn(value, idntfr)) {
            return true;
        } else {
            value = /** @type {{[key: string]: KeyPathEvaluateValueValue}} */ (
                value
            )[idntfr];
            return value === undefined;
        }
        return false;
    })
        ? {failure: true}
        : {value};
}

/**
 * Sets the inline key value.
 * @param {{[key: string]: AnyValue}} value
 * @param {Key} key
 * @param {string} keyPath
 * @returns {void}
 */
function injectKeyIntoValueUsingKeyPath (value, key, keyPath) {
    const identifiers = keyPath.split('.');
    const last = identifiers.pop();
    identifiers.forEach((identifier) => {
        const hop = Object.hasOwn(value, identifier);
        if (!hop) {
            value[identifier] = {};
        }
        value = value[identifier];
    });
    value[/** @type {string} */ (last)] = key; // key is already a `keyValue` in our processing so no need to convert
}

/**
 *
 * @param {Value} value
 * @param {string} keyPath
 * @see https://github.com/w3c/IndexedDB/pull/146
 * @returns {boolean}
 */
function checkKeyCouldBeInjectedIntoValue (value, keyPath) {
    const identifiers = keyPath.split('.');
    identifiers.pop();
    for (const identifier of identifiers) {
        if (!util.isObj(value)) {
            return false;
        }
        const hop = Object.hasOwn(value, identifier);
        if (!hop) {
            return true;
        }
        value = /** @type {{[key: string]: Value}} */ (value)[identifier];
    }
    return util.isObj(value);
}

/**
 *
 * @param {Key} key
 * @param {import('./IDBKeyRange.js').IDBKeyRangeFull} range
 * @param {boolean} [checkCached]
 * @returns {boolean}
 */
function isKeyInRange (key, range, checkCached) {
    let lowerMatch = range.lower === undefined;
    let upperMatch = range.upper === undefined;
    const encodedKey = encode(key, true);
    const lower = checkCached ? range.__lowerCached : encode(range.lower, true);
    const upper = checkCached ? range.__upperCached : encode(range.upper, true);

    if (!lowerMatch && (
        (range.lowerOpen &&
            encodedKey !== null && lower !== null && encodedKey > lower) ||
        (!range.lowerOpen && (
            (!encodedKey && !lower) ||
            (encodedKey !== null && lower !== null && encodedKey >= lower))
        )
    )) {
        lowerMatch = true;
    }
    if (!upperMatch && (
        (range.upperOpen &&
            encodedKey !== null && upper !== null && encodedKey < upper) ||
        (!range.upperOpen && (
            (!encodedKey && !upper) ||
            (encodedKey !== null && upper !== null && encodedKey <= upper))
        )
    )) {
        upperMatch = true;
    }

    return lowerMatch && upperMatch;
}

/**
 * Determines whether an index entry matches a multi-entry key value.
 * @param {string} encodedEntry     The entry value (already encoded)
 * @param {string} encodedKey       The full index key (already encoded)
 * @returns {boolean}
 */
function isMultiEntryMatch (encodedEntry, encodedKey) {
    const keyType = encodedCharToKeyType[encodedKey.slice(0, 1)];

    if (keyType === 'array') {
        return encodedKey.indexOf(encodedEntry) > 1;
    }
    return encodedKey === encodedEntry;
}

/**
 *
 * @param {Key} keyEntry
 * @param {import('./IDBKeyRange.js').IDBKeyRangeFull|undefined} range
 * @returns {Key[]}
 */
function findMultiEntryMatches (keyEntry, range) {
    const matches = [];

    if (Array.isArray(keyEntry)) {
        for (let key of keyEntry) {
            if (Array.isArray(key)) {
                if (range && range.lower === range.upper) {
                    continue;
                }
                if (key.length === 1) {
                    // eslint-disable-next-line sonarjs/updated-loop-counter -- Convenient
                    key = key[0];
                } else {
                    const nested = findMultiEntryMatches(key, range);
                    if (nested.length > 0) {
                        matches.push(key);
                    }
                    continue;
                }
            }

            if (util.isNullish(range) || isKeyInRange(key, range, true)) {
                matches.push(key);
            }
        }
    } else if (util.isNullish(range) || isKeyInRange(keyEntry, range, true)) {
        matches.push(keyEntry);
    }
    return matches;
}

/**
* Not currently in use but keeping for spec parity.
* @param {Key} key
* @throws {Error} Upon a "bad key"
* @returns {ValueType}
*/
function convertKeyToValue (key) {
    const {type, value} = key;
    switch (type) {
    case 'number': case 'string': {
        return value;
    } case 'array': {
        const array = [];
        const len = value.length;
        let index = 0;
        while (index < len) {
            const entry = convertKeyToValue(value[index]);
            array[index] = entry;
            index++;
        }
        return array;
    } case 'date': {
        return new Date(value);
    } case 'binary': {
        const len = value.length;
        const buffer = new ArrayBuffer(len);
        // Set the entries in buffer's [[ArrayBufferData]] to those in `value`
        const uint8 = new Uint8Array(buffer, value.byteOffset || 0, value.byteLength);
        uint8.set(value);
        return buffer;
    } case 'invalid': default:
        throw new Error('Bad key');
    }
}

/**
 *
 * @param {Key} key
 * @param {boolean} [inArray]
 * @returns {string|null}
 */
function encode (key, inArray) {
    // Bad keys like `null`, `object`, `boolean`, 'function', 'symbol' should not be passed here due to prior validation
    if (key === undefined) {
        return null;
    }
    // array, date, number, string, binary (should already have detected "invalid")
    return types[getKeyType(key)].encode(key, inArray);
}

/**
 *
 * @param {Key} key
 * @param {boolean} [inArray]
 * @throws {Error} Invalid number
 * @returns {undefined|ValueType}
 */
function decode (key, inArray) {
    if (typeof key !== 'string') {
        return undefined;
    }
    return types[encodedCharToKeyType[key.slice(0, 1)]].decode(key, inArray);
}

/**
 *
 * @param {Key} key
 * @param {boolean} [inArray]
 * @returns {undefined|ValueType}
 */
function roundTrip (key, inArray) {
    return decode(encode(key, inArray), inArray);
}

const MAX_ALLOWED_CURRENT_NUMBER = 9007199254740992; // 2 ^ 53 (Also equal to `Number.MAX_SAFE_INTEGER + 1`)

/**
 * @typedef {number} Integer
 */

/**
 * @callback CurrentNumberCallback
 * @param {Integer} cn The current number
 * @returns {void}
 */

/**
* @callback SQLFailureCallback
* @param {DOMException|Error} exception
* @returns {void}
*/

/**
 *
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {CurrentNumberCallback} func
 * @param {SQLFailureCallback} sqlFailCb
 * @returns {void}
 */
function getCurrentNumber (tx, store, func, sqlFailCb) {
    tx.executeSql('SELECT "currNum" FROM __sys__ WHERE "name" = ?', [
        util.escapeSQLiteStatement(store.__currentName)
    ], function (tx, data) {
        if (data.rows.length !== 1) {
            func(1);
        } else {
            func(data.rows.item(0).currNum);
        }
    }, function (tx, error) {
        sqlFailCb(createDOMException(
            'DataError',
            'Could not get the auto increment value for key',
            error
        ));
        return false;
    });
}

/**
 *
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {Integer} num
 * @param {CurrentNumberCallback} successCb
 * @param {SQLFailureCallback} failCb
 * @returns {void}
 */
function assignCurrentNumber (tx, store, num, successCb, failCb) {
    const sql = 'UPDATE __sys__ SET "currNum" = ? WHERE "name" = ?';
    const sqlValues = [num, util.escapeSQLiteStatement(store.__currentName)];
    if (CFG.DEBUG) { console.log(sql, sqlValues); }
    tx.executeSql(sql, sqlValues, function () {
        successCb(num);
    }, function (tx, err) {
        failCb(createDOMException('UnknownError', 'Could not set the auto increment value for key', err));
        return false;
    });
}

/**
 * Bump up the auto-inc counter if the key path-resolved value is valid
 *   (greater than old value and >=1) OR if a manually passed in key is
 *   valid (numeric and >= 1) and >= any primaryKey.
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {Integer} num
 * @param {CurrentNumberCallback} successCb
 * @param {SQLFailureCallback} failCb
 * @returns {void}
 */
function setCurrentNumber (tx, store, num, successCb, failCb) {
    num = num === MAX_ALLOWED_CURRENT_NUMBER
        ? num + 2 // Since incrementing by one will have no effect in JavaScript on this unsafe max, we represent the max as a number incremented by two. The getting of the current number is never returned to the user and is only used in safe comparisons, so it is safe for us to represent it in this manner
        : num + 1;
    return assignCurrentNumber(tx, store, num, successCb, failCb);
}

/**
 * @callback KeyForStoreCallback
 * @param {"failure"|null} arg1
 * @param {Integer} [arg2]
 * @param {Integer} [arg3]
 * @returns {void}
 */

/**
 *
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {KeyForStoreCallback} cb
 * @param {SQLFailureCallback} sqlFailCb
 * @returns {void}
 */
function generateKeyForStore (tx, store, cb, sqlFailCb) {
    getCurrentNumber(tx, store, function (key) {
        if (key > MAX_ALLOWED_CURRENT_NUMBER) { // 2 ^ 53 (See <https://github.com/w3c/IndexedDB/issues/147>)
            cb('failure');
            return;
        }
        // Increment current number by 1 (we cannot leverage SQLite's
        //  autoincrement (and decrement when not needed), as decrementing
        //  will be overwritten/ignored upon the next insert)
        setCurrentNumber(
            tx, store, key,
            function () {
                cb(null, key, key);
            },
            sqlFailCb
        );
    }, sqlFailCb);
}

// Fractional or numbers exceeding the max do not get changed in the result
//     per https://github.com/w3c/IndexedDB/issues/147
//     so we do not return a key
/**
 *
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {Key} key
 * @param {(num?: Integer) => void} successCb
 * @param {SQLFailureCallback} sqlFailCb
 * @returns {void}
 */
function possiblyUpdateKeyGenerator (tx, store, key, successCb, sqlFailCb) {
    // Per https://github.com/w3c/IndexedDB/issues/147 , non-finite numbers
    //   (or numbers larger than the max) are now to have the explicit effect of
    //   setting the current number (up to the max), so we do not optimize them
    //   out here
    if (typeof key !== 'number' || key < 1) { // Optimize with no need to get the current number
        // Auto-increment attempted with a bad key;
        //   we are not to change the current number, but the steps don't call for failure
        // Numbers < 1 are optimized out as they will never be greater than the current number which must be at least 1
        successCb();
    } else {
        // If auto-increment and the keyPath item is a valid numeric key, get the old auto-increment to compare if the new is higher
        //  to determine which to use and whether to update the current number
        getCurrentNumber(tx, store, function (cn) {
            const value = Math.floor(
                Math.min(key, MAX_ALLOWED_CURRENT_NUMBER)
            );
            const useNewKeyForAutoInc = value >= cn;
            if (useNewKeyForAutoInc) {
                setCurrentNumber(tx, store, value, function () {
                    successCb(cn); // Supply old current number in case needs to be reverted
                }, sqlFailCb);
            } else { // Not updated
                successCb();
            }
        }, sqlFailCb);
    }
}

export {encode, decode, roundTrip, convertKeyToValue, convertValueToKeyValueDecoded,
    convertValueToMultiEntryKeyDecoded,
    convertValueToKey,
    convertValueToMultiEntryKey, convertValueToKeyRethrowingAndIfInvalid,
    extractKeyFromValueUsingKeyPath, evaluateKeyPathOnValue,
    extractKeyValueDecodedFromValueUsingKeyPath, injectKeyIntoValueUsingKeyPath, checkKeyCouldBeInjectedIntoValue,
    isMultiEntryMatch, isKeyInRange, findMultiEntryMatches,
    assignCurrentNumber,
    generateKeyForStore, possiblyUpdateKeyGenerator};

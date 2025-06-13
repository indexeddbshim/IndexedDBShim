import {createDOMException} from './DOMException.js';
import * as Key from './Key.js';
import * as util from './util.js';

const readonlyProperties = /** @type {const} */ (['lower', 'upper', 'lowerOpen', 'upperOpen']);

/**
 * @typedef {globalThis.IDBKeyRange & {
*   __lowerCached: string|null|false,
*   __upperCached: string|null|false,
*   __lowerOpen: boolean,
* }} IDBKeyRangeFull
*/

/**
 * The IndexedDB KeyRange object.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
 * @throws {TypeError}
 * @class
 */
function IDBKeyRange () {
    this.__lowerOpen = false;
    this.__upperOpen = false;
    throw new TypeError('Illegal constructor');
}
const IDBKeyRangeAlias = IDBKeyRange;

/**
 * @param {import('./Key.js').Key|null} lower
 * @param {import('./Key.js').Key|null} upper
 * @param {boolean} lowerOpen
 * @param {boolean} upperOpen
 * @returns {import('./IDBKeyRange.js').IDBKeyRangeFull}
 */
IDBKeyRange.__createInstance = function (lower, upper, lowerOpen, upperOpen) {
    /**
     * @class
     */
    function IDBKeyRange () {
        this[Symbol.toStringTag] = 'IDBKeyRange';
        if (lower === undefined && upper === undefined) {
            throw createDOMException('DataError', 'Both arguments to the key range method cannot be undefined');
        }
        let lowerConverted, upperConverted;
        if (lower !== undefined) {
            lowerConverted = Key.roundTrip(lower); // Todo: does this make the "conversions" redundant
            Key.convertValueToKeyRethrowingAndIfInvalid(lower);
        }
        if (upper !== undefined) {
            upperConverted = Key.roundTrip(upper); // Todo: does this make the "conversions" redundant
            Key.convertValueToKeyRethrowingAndIfInvalid(upper);
        }
        if (lower !== undefined && upper !== undefined && lower !== upper) {
            if (
                /** @type {string} */ (Key.encode(lower)) >
                /** @type {string} */ (Key.encode(upper))
            ) {
                throw createDOMException('DataError', '`lower` must not be greater than `upper` argument in `bound()` call.');
            }
        }

        this.__lower = lowerConverted;
        this.__upper = upperConverted;
        this.__lowerOpen = Boolean(lowerOpen);
        this.__upperOpen = Boolean(upperOpen);
    }
    IDBKeyRange.prototype = IDBKeyRangeAlias.prototype;

    // @ts-expect-error Properties added by `defineProperty/ies`
    return new IDBKeyRange();
};

/**
 * @param {import('./Key.js').Key} key
 * @this {IDBKeyRangeFull}
 * @returns {boolean}
 */
IDBKeyRange.prototype.includes = function (key) {
    // We can't do a regular instanceof check as it will create a loop given our hasInstance implementation
    if (!util.isObj(this) || typeof this.__lowerOpen !== 'boolean') {
        throw new TypeError('Illegal invocation');
    }
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.includes requires a key argument');
    }
    Key.convertValueToKeyRethrowingAndIfInvalid(key);
    return Key.isKeyInRange(key, this);
};

/**
 * @param {import('./Key.js').Value} value
 * @returns {import('./IDBKeyRange.js').IDBKeyRangeFull}
 */
IDBKeyRange.only = function (value) {
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.only requires a value argument');
    }
    return IDBKeyRange.__createInstance(value, value, false, false);
};

/**
 * @param {import('./Key.js').Value} value
 * @returns {globalThis.IDBKeyRange}
 */
IDBKeyRange.lowerBound = function (value /* , open */) {
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.lowerBound requires a value argument');
    }
    // eslint-disable-next-line prefer-rest-params -- API
    return IDBKeyRange.__createInstance(value, undefined, arguments[1], true);
};

/**
 * @param {import('./Key.js').Value} value
 * @returns {globalThis.IDBKeyRange}
 */
IDBKeyRange.upperBound = function (value /* , open */) {
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.upperBound requires a value argument');
    }
    // eslint-disable-next-line prefer-rest-params -- API
    return IDBKeyRange.__createInstance(undefined, value, true, arguments[1]);
};

/**
 * @param {import('./Key.js').Value} lower
 * @param {import('./Key.js').Value} upper
 * @returns {globalThis.IDBKeyRange}
 */
IDBKeyRange.bound = function (lower, upper /* , lowerOpen, upperOpen */) {
    if (arguments.length <= 1) {
        throw new TypeError('IDBKeyRange.bound requires lower and upper arguments');
    }
    // eslint-disable-next-line prefer-rest-params -- API
    return IDBKeyRange.__createInstance(lower, upper, arguments[2], arguments[3]);
};
IDBKeyRange.prototype[Symbol.toStringTag] = 'IDBKeyRangePrototype';

readonlyProperties.forEach((prop) => {
    Object.defineProperty(IDBKeyRange.prototype, '__' + prop, {
        enumerable: false,
        configurable: false,
        writable: true
    });
    // Ensure for proper interface testing that "get <name>" is the function name
    const o = {
        /**
         * @returns {import('./Key.js').Key|null|boolean}
         */
        get [prop] () {
            // We can't do a regular instanceof check as it will create a loop given our hasInstance implementation
            if (!util.isObj(this) || typeof this.__lowerOpen !== 'boolean') {
                throw new TypeError('Illegal invocation');
            }
            return this['__' + prop];
        }
    };
    const desc = /** @type {PropertyDescriptor} */ (
        Object.getOwnPropertyDescriptor(o, prop)
    );
    // desc.enumerable = true; // Default
    // desc.configurable = true; // Default
    Object.defineProperty(IDBKeyRange.prototype, prop, desc);
});

Object.defineProperty(IDBKeyRange, Symbol.hasInstance, {
    value:
        /**
         * @param {object} obj
         * @returns {boolean}
         */
        (obj) => util.isObj(obj) && 'upper' in obj && 'lowerOpen' in obj &&
            typeof obj.lowerOpen === 'boolean'
});

Object.defineProperty(IDBKeyRange, 'prototype', {
    writable: false
});

/**
 * @param {IDBKeyRangeFull|undefined} range
 * @param {string} quotedKeyColumnName
 * @param {string[]} sql
 * @param {string[]} sqlValues
 * @param {boolean} [addAnd]
 * @param {boolean} [checkCached]
 * @returns {void}
 */
function setSQLForKeyRange (
    range, quotedKeyColumnName, sql, sqlValues, addAnd, checkCached
) {
    if (range && (range.lower !== undefined || range.upper !== undefined)) {
        if (addAnd) { sql.push('AND'); }
        let encodedLowerKey, encodedUpperKey;
        const hasLower = range.lower !== undefined;
        const hasUpper = range.upper !== undefined;
        if (hasLower) {
            encodedLowerKey = checkCached ? range.__lowerCached : Key.encode(range.lower);
        }
        if (hasUpper) {
            encodedUpperKey = checkCached ? range.__upperCached : Key.encode(range.upper);
        }
        if (hasLower) {
            sqlValues.push(util.escapeSQLiteStatement(/** @type {string} */ (encodedLowerKey)));
            if (hasUpper && encodedLowerKey === encodedUpperKey && !range.lowerOpen && !range.upperOpen) {
                sql.push(quotedKeyColumnName, '=', '?');
                return;
            }
            sql.push(quotedKeyColumnName, (range.lowerOpen ? '>' : '>='), '?');
        }
        if (hasLower && hasUpper) { sql.push('AND'); }
        if (hasUpper) {
            sql.push(quotedKeyColumnName, (range.upperOpen ? '<' : '<='), '?');
            sqlValues.push(util.escapeSQLiteStatement(/** @type {string} */ (encodedUpperKey)));
        }
    }
}

/**
 * @param {import('./Key.js').Value} value
 * @param {boolean} [nullDisallowed]
 * @throws {DOMException}
 * @returns {import('./IDBKeyRange.js').IDBKeyRangeFull|undefined}
 */
function convertValueToKeyRange (value, nullDisallowed) {
    if (util.instanceOf(value, IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on loose duck-typing)
        if (value.toString() !== '[object IDBKeyRange]') {
            return IDBKeyRange.__createInstance(value.lower, value.upper, value.lowerOpen, value.upperOpen);
        }
        return value;
    }
    if (util.isNullish(value)) {
        if (nullDisallowed) {
            throw createDOMException('DataError', 'No key or range was specified');
        }
        return undefined; // Represents unbounded
    }
    Key.convertValueToKeyRethrowingAndIfInvalid(value);
    return IDBKeyRange.only(value);
}

// eslint-disable-next-line unicorn/no-named-default -- Had some reason for this
export {setSQLForKeyRange, IDBKeyRange, convertValueToKeyRange, IDBKeyRange as default};

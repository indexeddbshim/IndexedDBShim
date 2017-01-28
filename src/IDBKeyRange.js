import {createDOMException} from './DOMException';
import Key from './Key';
import * as util from './util';

const readonlyProperties = ['lower', 'upper', 'lowerOpen', 'upperOpen'];

/**
 * The IndexedDB KeyRange object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
 * @param {Object} lower
 * @param {Object} upper
 * @param {Object} lowerOpen
 * @param {Object} upperOpen
 */
function IDBKeyRange () {
    throw new TypeError('Illegal constructor');
}
const IDBKeyRangeAlias = IDBKeyRange;
IDBKeyRange.__createInstance = function (lower, upper, lowerOpen, upperOpen) {
    function IDBKeyRange () {
        this[Symbol.toStringTag] = 'IDBKeyRange';
        if (lower === undefined && upper === undefined) {
            throw createDOMException('DataError', 'Both arguments to the key range method cannot be undefined');
        }
        if (lower !== undefined) {
            Key.convertValueToKey(lower);
        }
        if (upper !== undefined) {
            Key.convertValueToKey(upper);
        }
        if (lower !== undefined && upper !== undefined && lower !== upper) {
            if (Key.encode(lower) > Key.encode(upper)) {
                throw createDOMException('DataError', '`lower` must not be greater than `upper` argument in `bound()` call.');
            }
        }

        this.__lower = lower;
        this.__upper = upper;
        this.__lowerOpen = !!lowerOpen;
        this.__upperOpen = !!upperOpen;
    }
    IDBKeyRange.prototype = IDBKeyRangeAlias.prototype;
    return new IDBKeyRange();
};
IDBKeyRange.prototype.includes = function (key) {
    // We can't do a regular instanceof check as it will create a loop given our hasInstance implementation
    if (!util.isObj(this) || typeof this.__lowerOpen !== 'boolean') {
        throw new TypeError('Illegal invocation');
    }
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.includes requires a key argument');
    }
    Key.convertValueToKey(key);
    return Key.isKeyInRange(key, this);
};

IDBKeyRange.only = function (value) {
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.only requires a value argument');
    }
    return IDBKeyRange.__createInstance(value, value, false, false);
};

IDBKeyRange.lowerBound = function (value /*, open */) {
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.lowerBound requires a value argument');
    }
    return IDBKeyRange.__createInstance(value, undefined, arguments[1], true);
};
IDBKeyRange.upperBound = function (value /*, open */) {
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.upperBound requires a value argument');
    }
    return IDBKeyRange.__createInstance(undefined, value, true, arguments[1]);
};
IDBKeyRange.bound = function (lower, upper /* , lowerOpen, upperOpen */) {
    if (arguments.length <= 1) {
        throw new TypeError('IDBKeyRange.bound requires lower and upper arguments');
    }
    return IDBKeyRange.__createInstance(lower, upper, arguments[2], arguments[3]);
};
IDBKeyRange.prototype[Symbol.toStringTag] = 'IDBKeyRangePrototype';

readonlyProperties.forEach((prop) => {
    Object.defineProperty(IDBKeyRange.prototype, '__' + prop, {
        enumerable: false,
        configurable: false,
        writable: true
    });
    Object.defineProperty(IDBKeyRange.prototype, prop, {
        enumerable: true,
        configurable: true,
        get: function () {
            // We can't do a regular instanceof check as it will create a loop given our hasInstance implementation
            if (!util.isObj(this) || typeof this.__lowerOpen !== 'boolean') {
                throw new TypeError('Illegal invocation');
            }
            return this['__' + prop];
        }
    });
});

Object.defineProperty(IDBKeyRange, Symbol.hasInstance, {
    value: obj => util.isObj(obj) && 'upper' in obj && typeof obj.lowerOpen === 'boolean'
});

Object.defineProperty(IDBKeyRange, 'prototype', {
    writable: false
});

function setSQLForRange (range, quotedKeyColumnName, sql, sqlValues, addAnd, checkCached) {
    if (range && (range.lower !== undefined || range.upper !== undefined)) {
        if (addAnd) sql.push('AND');
        if (range.lower !== undefined) {
            sql.push(quotedKeyColumnName, (range.lowerOpen ? '>' : '>='), '?');
            sqlValues.push(util.escapeSQLiteStatement(checkCached ? range.__lowerCached : Key.encode(range.lower)));
        }
        (range.lower !== undefined && range.upper !== undefined) && sql.push('AND');
        if (range.upper !== undefined) {
            sql.push(quotedKeyColumnName, (range.upperOpen ? '<' : '<='), '?');
            sqlValues.push(util.escapeSQLiteStatement(checkCached ? range.__upperCached : Key.encode(range.upper)));
        }
    }
}

export {setSQLForRange, IDBKeyRange, IDBKeyRange as default};

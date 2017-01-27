import {createDOMException} from './DOMException.js';
import Key from './Key.js';
import * as util from './util.js';

/**
 * The IndexedDB KeyRange object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
 * @param {Object} lower
 * @param {Object} upper
 * @param {Object} lowerOpen
 * @param {Object} upperOpen
 */
function IDBKeyRange (lower, upper, lowerOpen, upperOpen) {
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
IDBKeyRange.prototype.includes = function (key) {
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
    return new IDBKeyRange(value, value, false, false);
};

IDBKeyRange.lowerBound = function (value, open) {
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.lowerBound requires a value argument');
    }
    return new IDBKeyRange(value, undefined, open, true);
};
IDBKeyRange.upperBound = function (value, open) {
    if (!arguments.length) {
        throw new TypeError('IDBKeyRange.upperBound requires a value argument');
    }
    return new IDBKeyRange(undefined, value, true, open);
};
IDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
    if (arguments.length <= 1) {
        throw new TypeError('IDBKeyRange.bound requires lower and upper arguments');
    }
    return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
};
IDBKeyRange.prototype[Symbol.toStringTag] = 'IDBKeyRange';

util.defineReadonlyProperties(IDBKeyRange.prototype, ['lower', 'upper', 'lowerOpen', 'upperOpen']);

Object.defineProperty(IDBKeyRange, Symbol.hasInstance, {
    value: obj => util.isObj(obj) && 'upper' in obj && typeof obj.lowerOpen === 'boolean'
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

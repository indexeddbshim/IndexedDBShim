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
        throw new TypeError('Both arguments to the key range method cannot be undefined');
    }
    if (lower !== undefined) {
        Key.validate(lower);
    }
    if (upper !== undefined) {
        Key.validate(upper);
    }

    this.lower = lower;
    this.upper = upper;
    this.lowerOpen = !!lowerOpen;
    this.upperOpen = !!upperOpen;
}
IDBKeyRange.prototype.includes = function (key) {
    Key.validate(key);
    return Key.isKeyInRange(key, this);
};

IDBKeyRange.only = function (value) {
    return new IDBKeyRange(value, value, false, false);
};

IDBKeyRange.lowerBound = function (value, open) {
    return new IDBKeyRange(value, undefined, open, true);
};
IDBKeyRange.upperBound = function (value, open) {
    return new IDBKeyRange(undefined, value, true, open);
};
IDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
    if (Key.encode(lower) > Key.encode(upper)) {
        throw createDOMException('DataError', '`lower` must not be greater than `upper` argument in `bound()` call.');
    }
    return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
};
Object.defineProperty(IDBKeyRange, Symbol.hasInstance, {
    value: obj => util.isObj(obj) && 'upper' in obj && typeof obj.lowerOpen === 'boolean'
});

function setSQLForRange (range, quotedKeyColumnName, sql, sqlValues, addAnd, checkCached) {
    if (range && (range.lower !== undefined || range.upper !== undefined)) {
        if (addAnd) sql.push('AND');
        if (range.lower !== undefined) {
            sql.push(quotedKeyColumnName, (range.lowerOpen ? '>' : '>='), '?');
            sqlValues.push(checkCached ? range.__lower : Key.encode(range.lower));
        }
        (range.lower !== undefined && range.upper !== undefined) && sql.push('AND');
        if (range.upper !== undefined) {
            sql.push(quotedKeyColumnName, (range.upperOpen ? '<' : '<='), '?');
            sqlValues.push(checkCached ? range.__upper : Key.encode(range.upper));
        }
    }
}

export {setSQLForRange, IDBKeyRange, IDBKeyRange as default};

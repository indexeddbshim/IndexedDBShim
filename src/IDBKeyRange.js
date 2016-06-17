import Key from './Key.js';

/**
 * The IndexedDB KeyRange object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
 * @param {Object} lower
 * @param {Object} upper
 * @param {Object} lowerOpen
 * @param {Object} upperOpen
 */
function IDBKeyRange (lower, upper, lowerOpen, upperOpen) {
    if (lower !== null) {
        Key.validate(lower);
    }
    if (upper !== null) {
        Key.validate(upper);
    }

    this.lower = lower;
    this.upper = upper;
    this.lowerOpen = !!lowerOpen;
    this.upperOpen = !!upperOpen;
}
IDBKeyRange.prototype.includes = function (key) {
    return Key.isKeyInRange(key, this);
};

IDBKeyRange.only = function (value) {
    return new IDBKeyRange(value, value, false, false);
};

IDBKeyRange.lowerBound = function (value, open) {
    return new IDBKeyRange(value, null, open, true);
};
IDBKeyRange.upperBound = function (value, open) {
    return new IDBKeyRange(null, value, true, open);
};
IDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
    return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
};
Object.defineProperty(IDBKeyRange, Symbol.hasInstance, {
    value: obj => obj && typeof obj === 'object' && 'upper' in obj && typeof obj.lowerOpen === 'boolean'
});

function setSQLForRange (range, quotedKeyColumnName, sql, sqlValues, addAnd, checkCached) {
    if (range && (range.lower !== null || range.upper !== null)) {
        if (addAnd) sql.push('AND');
        if (range.lower !== null) {
            sql.push(quotedKeyColumnName, (range.lowerOpen ? '>' : '>='), '?');
            sqlValues.push(checkCached ? range.__lower : range.lower);
        }
        (range.lower !== null && range.upper !== null) && sql.push('AND');
        if (range.upper !== null) {
            sql.push(quotedKeyColumnName, (range.upperOpen ? '<' : '<='), '?');
            sqlValues.push(checkCached ? range.__upper : range.upper);
        }
    }
}

export {setSQLForRange, IDBKeyRange, IDBKeyRange as default};

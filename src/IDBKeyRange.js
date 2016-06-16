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

export default IDBKeyRange;

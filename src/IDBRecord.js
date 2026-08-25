import * as util from './util.js';

const readonlyProperties = /** @type {const} */ (['key', 'primaryKey', 'value']);

/* eslint-disable jsdoc/valid-types -- pratt parser bug */
/**
 * @typedef {{
 *   [Symbol.toStringTag]: 'IDBRecord',
 *   __key: import('./Key.js').Key,
 *   __primaryKey: import('./Key.js').Key,
 *   __value: import('./Key.js').Value,
 *   key: import('./Key.js').Key,
 *   primaryKey: import('./Key.js').Key,
 *   value: import('./Key.js').Value
 * }} IDBRecordFull
 */
/* eslint-enable jsdoc/valid-types -- pratt parser bug */

/**
 * The record type returned by `IDBObjectStore`/`IDBIndex#getAllRecords()`
 *   (IndexedDB 3.0). Structured the same way as `IDBCursor` -- a public
 *   constructor that always throws, with real instances only ever produced
 *   internally via `__createInstance` -- so a record can't be directly
 *   instantiated by script.
 * @see https://w3c.github.io/IndexedDB/#record-interface
 * @throws {TypeError}
 * @class
 */
function IDBRecord () {
    throw new TypeError('Illegal constructor');
}
const IDBRecordAlias = IDBRecord;

/**
 * @param {import('./Key.js').Key} key
 * @param {import('./Key.js').Key} primaryKey
 * @param {import('./Key.js').Value} value
 * @returns {IDBRecordFull}
 */
IDBRecord.__createInstance = function (key, primaryKey, value) {
    /**
     * @class
     * @this {IDBRecordFull}
     */
    function IDBRecord () {
        // @ts-ignore Should be ok
        this[Symbol.toStringTag] = 'IDBRecord';
        this.__key = key;
        this.__primaryKey = primaryKey;
        this.__value = value;
    }
    IDBRecord.prototype = IDBRecordAlias.prototype;

    // @ts-expect-error Properties added below on the shared prototype
    return new IDBRecord();
};

IDBRecord.prototype[Symbol.toStringTag] = 'IDBRecordPrototype';

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
util.setOperationNames(IDBRecord.prototype);
util.setOperationNames(IDBRecord);

// Defined once on the shared prototype (rather than per-instance, as
//   `util.defineReadonlyProperties` would) since WPT's `assert_idl_attribute`
//   specifically requires these to be inherited, not own, properties.
readonlyProperties.forEach((prop) => {
    Object.defineProperty(IDBRecord.prototype, '__' + prop, {
        enumerable: false,
        configurable: false,
        writable: true
    });
    // We must resort to this to get "get <name>" as the function `name` for
    //   proper IDL.
    const o = {
        /**
         * @returns {import('./Key.js').Key|import('./Key.js').Value}
         */
        get [prop] () {
            // This is defined on the *shared* prototype (see above), so,
            //   unlike a per-instance getter, it's reachable by calling it
            //   directly on `IDBRecord.prototype` itself (not a real
            //   instance) -- WebIDL requires that to throw.
            if (!(this instanceof IDBRecordAlias)) {
                throw new TypeError('Illegal invocation');
            }
            // @ts-ignore `this` is a real instance past the check above (not an issue in TS7)
            return this['__' + prop];
        }
    };
    const desc = /** @type {PropertyDescriptor} */ (
        Object.getOwnPropertyDescriptor(o, prop)
    );
    Object.defineProperty(IDBRecord.prototype, prop, desc);
});

Object.defineProperty(IDBRecord, 'prototype', {
    writable: false
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

export {IDBRecord};

export default IDBRecord;

import {
    Typeson, hasConstructorOf, structuredCloningForStorage
} from 'typeson-registry';

import {createDOMException, ShimDOMException} from './DOMException.js';

// See: https://stackoverflow.com/questions/42170826/categories-for-rejection-by-the-structured-cloning-algorithm

let typeson = new Typeson().register(structuredCloningForStorage);

/**
 * @param {(preset: import('typeson-registry').Preset) =>
 *   import('typeson-registry').Preset} func
 * @returns {void}
 */
function register (func) {
    // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Should be one-time cache
    typeson = new Typeson().register(func(structuredCloningForStorage));
}

/**
 * We are keeping the callback approach for now in case we wish to reexpose
 * `Blob`, `File`, `FileList` asynchronously (though in such a case, we
 * should probably refactor as a Promise).
 * @param {AnyValue} obj
 * @param {(str: string) => void} [func]
 * @throws {Error}
 * @returns {string}
 */
function encode (obj, func) {
    let ret;
    try {
        ret = typeson.stringifySync(obj);
    } catch (err) {
        // SCA in typeson-registry using `DOMException` which is not defined (e.g., in Node)
        if (hasConstructorOf(err, ReferenceError) ||
            // SCA in typeson-registry threw a cloning error and we are in a
            //   supporting environment (e.g., the browser) where `ShimDOMException` is
            //   an alias for `DOMException`; if typeson-registry ever uses our shim
            //   to throw, we can use this condition alone.
            hasConstructorOf(err, ShimDOMException)) {
            throw createDOMException('DataCloneError', 'The object cannot be cloned.');
        }
        // We should rethrow non-cloning exceptions like from
        //  throwing getters (as in the W3C test, key-conversion-exceptions.htm)
        throw err;
    }
    if (func) {
        func(ret);
    }
    return ret;
}

/**
 * @typedef {any} AnyValue
 */

/**
 * @param {string} obj
 * @returns {AnyValue}
 */
function decode (obj) {
    return typeson.parse(obj);
}

/**
 * @param {AnyValue} val
 * @returns {AnyValue}
 */
function clone (val) {
    // We don't return the intermediate `encode` as we'll need to reencode
    //   the clone as it may differ
    return decode(encode(val));
}

/**
 * Per spec, a transaction must appear inactive to any code that runs
 *   reentrantly *during* the structured clone of a value passed to
 *   `add()`/`put()`/`IDBCursor#update()` (e.g. a getter on the value being
 *   stored) -- even though the transaction is otherwise active for the
 *   duration of that same call. `__active` is restored in a `finally` so a
 *   `DataCloneError` (or any other throw from `clone()`) can't leave the
 *   transaction permanently stuck inactive.
 * @param {{__active: boolean}} transaction
 * @param {AnyValue} val
 * @returns {AnyValue}
 */
function cloneWithInactiveTransaction (transaction, val) {
    transaction.__active = false;
    try {
        return clone(val);
    } finally {
        transaction.__active = true;
    }
}

export {encode, decode, clone, cloneWithInactiveTransaction, register};

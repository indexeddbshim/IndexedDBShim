import {
    Typeson, hasConstructorOf, structuredCloningThrowing
} from 'typeson-registry';

import {createDOMException, ShimDOMException} from './DOMException.js';

// See: http://stackoverflow.com/questions/42170826/categories-for-rejection-by-the-structured-cloning-algorithm

let typeson = new Typeson().register(structuredCloningThrowing);

/**
 * @param {(preset: import('typeson-registry').Preset) =>
 *   import('typeson-registry').Preset} func
 * @returns {void}
 */
function register (func) {
    typeson = new Typeson().register(func(structuredCloningThrowing));
}

/**
 * We are keeping the callback approach for now in case we wish to reexpose
 * `Blob`, `File`, `FileList` asynchronously (though in such a case, we
 * should probably refactor as a Promise).
 * @param {import('../src/Key.js').Value} obj
 * @param {(str: string) => void} func
 * @throws {Error}
 * @returns {string}
 */
function encode (obj, func) {
    let ret;
    try {
        // eslint-disable-next-line n/no-sync
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
 * @param {string} obj
 * @returns {import('typeson').Value}
 */
function decode (obj) {
    return typeson.parse(obj);
}

/**
 * @param {import('typeson').Value} val
 * @returns {import('typeson').Value}
 */
function clone (val) {
    // We don't return the intermediate `encode` as we'll need to reencode
    //   the clone as it may differ
    return decode(encode(val));
}

export {encode, decode, clone, register};

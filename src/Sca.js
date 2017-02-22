import Typeson from 'typeson';
import StructuredCloning from 'typeson-registry/presets/structured-cloning-throwing';
// import Blob from 'w3c-blob'; // Needed by Node; uses native if available (browser)

import {createDOMException, ShimDOMException} from './DOMException';

// Todo: Register `ImageBitmap` and add `Blob`/`File`/`FileList`
// Todo: add a proper polyfill for `ImageData` using node-canvas
// See also: http://stackoverflow.com/questions/42170826/categories-for-rejection-by-the-structured-cloning-algorithm

const typeson = new Typeson().register(StructuredCloning);

// We are keeping the callback approach for now in case we wish to reexpose Blob, File, FileList
function encode (obj, cb) {
    let ret;
    try {
        ret = typeson.stringifySync(obj);
    } catch (err) {
        // SCA in typeson-registry using `DOMException` which is not defined (e.g., in Node)
        if (Typeson.hasConstructorOf(err, ReferenceError) ||
            // SCA in typeson-registry threw a cloning error and we are in a
            //   supporting environment (e.g., the browser) where `ShimDOMException` is
            //   an alias for `DOMException`; if typeson-registry ever uses our shim
            //   to throw, we can use this condition alone.
            Typeson.hasConstructorOf(err, ShimDOMException)) {
            throw createDOMException('DataCloneError', 'The object cannot be cloned.');
        }
        throw err; // We should rethrow non-cloning exceptions like from
                   //  throwing getters (as in the W3C test, key-conversion-exceptions.htm)
    }
    if (cb) cb(ret);
    return ret;
}

function decode (obj) {
    return typeson.parse(obj);
}

function clone (val) {
    // We don't return the intermediate `encode` as we'll need to reencode the clone as it may differ
    return decode(encode(val));
}

export {encode, decode, clone};

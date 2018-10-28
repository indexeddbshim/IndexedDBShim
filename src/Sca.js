import Typeson from 'typeson';
import StructuredCloning from 'typeson-registry/dist/presets/structured-cloning-throwing';
// import Blob from 'w3c-blob'; // Needed by Node; uses native if available (browser)

import {createDOMException, ShimDOMException} from './DOMException';

// Todo: Register `ImageBitmap` and add `Blob`/`File`/`FileList`
// Todo: add a proper polyfill for `ImageData` using node-canvas
// See also: http://stackoverflow.com/questions/42170826/categories-for-rejection-by-the-structured-cloning-algorithm

function traverseMapToRevertToLegacyTypeNames (obj) {
    if (Array.isArray(obj)) {
        return obj.forEach(traverseMapToRevertToLegacyTypeNames);
    }
    if (obj && typeof obj === 'object') { // Should be all
        Object.entries(obj).forEach(([prop, val]) => {
            if (prop in newTypeNamesToLegacy) {
                const legacyProp = newTypeNamesToLegacy[prop];
                delete obj[prop];
                obj[legacyProp] = val;
            }
        });
    }
}

const structuredCloning = StructuredCloning;
const newTypeNamesToLegacy = {
    IntlCollator: 'Intl.Collator',
    IntlDateTimeFormat: 'Intl.DateTimeFormat',
    IntlNumberFormat: 'Intl.NumberFormat',
    userObject: 'userObjects',
    undef: 'undefined',
    negativeInfinity: 'NegativeInfinity',
    nonbuiltinIgnore: 'nonBuiltInIgnore',
    arraybuffer: 'ArrayBuffer',
    blob: 'Blob',
    dataview: 'DataView',
    date: 'Date',
    error: 'Error',
    file: 'File',
    filelist: 'FileList',
    imagebitmap: 'ImageBitmap',
    imagedata: 'ImageData',
    infinity: 'Infinity',
    map: 'Map',
    nan: 'NaN',
    regexp: 'RegExp',
    set: 'Set',
    int8array: 'Int8Array',
    uint8array: 'Uint8Array',
    uint8clampedarray: 'Uint8ClampedArray',
    int16array: 'Int16Array',
    uint16array: 'Uint16Array',
    int32array: 'Int32Array',
    uint32array: 'Uint32Array',
    float32array: 'Float32Array',
    float64array: 'Float64Array'
};

// Todo (deprecated): We should make this conditional on CONFIG and deprecate
//   the legacy names, but for compatibility with data created under this
//   major version, we need the legacy now

// console.log('StructuredCloning1', JSON.stringify(structuredCloning));
traverseMapToRevertToLegacyTypeNames(structuredCloning);
// console.log('StructuredCloning2', JSON.stringify(structuredCloning));

const typeson = new Typeson().register(structuredCloning);

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
        // We should rethrow non-cloning exceptions like from
        //  throwing getters (as in the W3C test, key-conversion-exceptions.htm)
        throw err;
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

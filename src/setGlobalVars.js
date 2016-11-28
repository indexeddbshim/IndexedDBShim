import 'babel-polyfill'; // Object.assign in EventTarget, etc.
import {IDBVersionChangeEvent as shimIDBVersionChangeEvent} from './Event.js';
import {IDBCursor as shimIDBCursor, IDBCursorWithValue as shimIDBCursorWithValue} from './IDBCursor.js';
import {IDBRequest as shimIDBRequest, IDBOpenDBRequest as shimIDBOpenDBRequest} from './IDBRequest.js';
import {IDBFactory as shimIDBFactory, shimIndexedDB} from './IDBFactory.js';
import shimIDBKeyRange from './IDBKeyRange.js';
import shimIDBObjectStore from './IDBObjectStore.js';
import shimIDBIndex from './IDBIndex.js';
import shimIDBTransaction from './IDBTransaction.js';
import shimIDBDatabase from './IDBDatabase.js';
import polyfill from './polyfill.js';
import CFG from './CFG.js';

const glob = typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : self);
glob._babelPolyfill = false; // http://stackoverflow.com/questions/31282702/conflicting-use-of-babel-register

let IDB;

function shim (name, value) {
    const originValue = IDB[name];

    try {
        // Try setting the property. This will fail if the property is read-only.
        IDB[name] = value;
        return originValue;
    } catch (e) {
        console.log(e);
    }
    if (IDB[name] !== value && Object.defineProperty) {
        // Setting a read-only property failed, so try re-defining the property
        try {
            const desc = {value, configurable: true};
            if (name === 'indexedDB') {
                desc.writable = false; // Make explicit for Babel
            }
            Object.defineProperty(IDB, name, desc);
            return originValue;
        } catch (e) {
            // With `indexedDB`, PhantomJS fails here and below but
            //  not above, while Chrome is reverse (and Firefox doesn't
            //  get here since no WebSQL to use for shimming)
        }

        if (IDB[name] !== value) {
            typeof console !== 'undefined' && console.warn && console.warn('Unable to shim ' + name);
        }
    }
}

function setGlobalVars (idb) {
    IDB = idb || (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {}));
    shim('shimIndexedDB', shimIndexedDB);
    if (IDB.shimIndexedDB) {
        const stashOriginConstants = {};
        IDB.shimIndexedDB.__useShim = function () {
            if (CFG.win.openDatabase !== undefined) {
                // Polyfill ALL of IndexedDB, using WebSQL
                stashOriginConstants.indexedDB = shim('indexedDB', shimIndexedDB);
                stashOriginConstants.IDBFactory = shim('IDBFactory', shimIDBFactory);
                stashOriginConstants.IDBDatabase = shim('IDBDatabase', shimIDBDatabase);
                stashOriginConstants.IDBObjectStore = shim('IDBObjectStore', shimIDBObjectStore);
                stashOriginConstants.IDBIndex = shim('IDBIndex', shimIDBIndex);
                stashOriginConstants.IDBTransaction = shim('IDBTransaction', shimIDBTransaction);
                stashOriginConstants.IDBCursor = shim('IDBCursor', shimIDBCursor);
                stashOriginConstants.IDBCursorWithValue = shim('IDBCursorWithValue', shimIDBCursorWithValue);
                stashOriginConstants.IDBKeyRange = shim('IDBKeyRange', shimIDBKeyRange);
                stashOriginConstants.IDBRequest = shim('IDBRequest', shimIDBRequest);
                stashOriginConstants.IDBOpenDBRequest = shim('IDBOpenDBRequest', shimIDBOpenDBRequest);
                stashOriginConstants.IDBVersionChangeEvent = shim('IDBVersionChangeEvent', shimIDBVersionChangeEvent);
            } else if (typeof IDB.indexedDB === 'object') {
                // Polyfill the missing IndexedDB features (no need for IDBEnvironment, the window containing indexedDB itself))
                polyfill(shimIDBCursor, shimIDBCursorWithValue, shimIDBDatabase, shimIDBFactory, shimIDBIndex, shimIDBKeyRange, shimIDBObjectStore, shimIDBRequest, shimIDBTransaction);
            }
        };
        IDB.shimIndexedDB.__unuseShim = function () {
            Object.keys(stashOriginConstants).forEach(function (name) {
                if (stashOriginConstants[name] && shim(name, stashOriginConstants[name])) {
                    delete stashOriginConstants[name];
                }
            });
        };

        IDB.shimIndexedDB.__debug = function (val) {
            CFG.DEBUG = val;
        };
        IDB.shimIndexedDB.__setConfig = function (prop, val) {
            CFG[prop] = val;
        };
        IDB.shimIndexedDB.__getConfig = function (prop) {
            return CFG[prop];
        };
        IDB.shimIndexedDB.__setUnicodeIdentifiers = function (ui) {
            this.__setConfig('UnicodeIDStart', ui.UnicodeIDStart);
            this.__setConfig('UnicodeIDContinue', ui.UnicodeIDContinue);
        };
    }

    // Workaround to prevent an error in Firefox
    if (!('indexedDB' in IDB)) {
        IDB.indexedDB = IDB.indexedDB || IDB.webkitIndexedDB || IDB.mozIndexedDB || IDB.oIndexedDB || IDB.msIndexedDB;
    }

    // Detect browsers with known IndexedDb issues (e.g. Android pre-4.4)
    let poorIndexedDbSupport = false;
    if (typeof navigator !== 'undefined' && ( // Ignore Node or other environments
        (
            // Bad non-Chrome Android support
            navigator.userAgent.match(/Android (?:2|3|4\.[0-3])/) &&
            !navigator.userAgent.match(/Chrome/)
        ) ||
        (
            // Bad non-Safari iOS9 support (see <https://github.com/axemclion/IndexedDBShim/issues/252>)
            (navigator.userAgent.indexOf('Safari') === -1 || navigator.userAgent.indexOf('Chrome') > -1) && // Exclude genuine Safari: http://stackoverflow.com/a/7768006/271577
            // Detect iOS: http://stackoverflow.com/questions/9038625/detect-if-device-is-ios/9039885#9039885
            // and detect version 9: http://stackoverflow.com/a/26363560/271577
            (/(iPad|iPhone|iPod).* os 9_/i).test(navigator.userAgent) &&
            !window.MSStream // But avoid IE11
        )
    )) {
        poorIndexedDbSupport = true;
    }
    CFG.DEFAULT_DB_SIZE = (
        ( // Safari currently requires larger size: (We don't need a larger size for Node as node-websql doesn't use this info)
            // https://github.com/axemclion/IndexedDBShim/issues/41
            // https://github.com/axemclion/IndexedDBShim/issues/115
            typeof navigator !== 'undefined' &&
            navigator.userAgent.indexOf('Safari') > -1 &&
            navigator.userAgent.indexOf('Chrome') === -1
        ) ? 25 : 4) * 1024 * 1024;

    if ((IDB.indexedDB === undefined || !IDB.indexedDB || poorIndexedDbSupport) && CFG.win.openDatabase !== undefined) {
        IDB.shimIndexedDB.__useShim();
    } else {
        IDB.IDBDatabase = IDB.IDBDatabase || IDB.webkitIDBDatabase;
        IDB.IDBTransaction = IDB.IDBTransaction || IDB.webkitIDBTransaction || {};
        IDB.IDBCursor = IDB.IDBCursor || IDB.webkitIDBCursor;
        IDB.IDBKeyRange = IDB.IDBKeyRange || IDB.webkitIDBKeyRange;
    }
    return IDB;
}

export default setGlobalVars;

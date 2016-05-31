/*global GLOBAL*/
import 'babel-polyfill'; // Object.assign in EventTarget, etc.
import {shimIDBVersionChangeEvent} from './Event.js';
import shimIDBKeyRange from './IDBKeyRange.js';
import {shimIDBCursor, shimIDBCursorWithValue} from './IDBCursor.js';
import shimIDBObjectStore from './IDBObjectStore.js';
import shimIDBIndex from './IDBIndex.js';
import shimIDBTransaction from './IDBTransaction.js';
import shimIDBDatabase from './IDBDatabase.js';
import {shimIDBRequest, shimIDBOpenDBRequest} from './IDBRequest.js';
import {shimIDBFactory, shimIndexedDB} from './IDBFactory.js';
import polyfill from './polyfill.js';

(function () {
    'use strict';
    const global = typeof window !== 'undefined' ? window : GLOBAL; // DEBUG, cursorPreloadPackSize=100

    function shim (name, value) {
        try {
            // Try setting the property. This will fail if the property is read-only.
            window[name] = value;
        } catch (e) {
            console.log(e);
        }
        if (window[name] !== value && Object.defineProperty) {
            // Setting a read-only property failed, so try re-defining the property
            try {
                Object.defineProperty(window, name, {
                    value: value
                });
            } catch (e) {
                // With `indexedDB`, PhantomJS 2.2.1 fails here and below but
                //  not above, while Chrome is reverse (and Firefox doesn't
                //  get here since no WebSQL to use for shimming)
                console.log('failed defineProperty');
            }

            if (window[name] !== value) {
                window.console && console.warn && console.warn('Unable to shim ' + name);
            }
        }
    }

    shim('shimIndexedDB', shimIndexedDB);
    if (window.shimIndexedDB) {
        window.shimIndexedDB.__useShim = function () {
            if (typeof window.openDatabase !== 'undefined') {
                // Polyfill ALL of IndexedDB, using WebSQL
                shim('indexedDB', shimIndexedDB);
                shim('IDBFactory', shimIDBFactory);
                shim('IDBDatabase', shimIDBDatabase);
                shim('IDBObjectStore', shimIDBObjectStore);
                shim('IDBIndex', shimIDBIndex);
                shim('IDBTransaction', shimIDBTransaction);
                shim('IDBCursor', shimIDBCursor);
                shim('IDBKeyRange', shimIDBKeyRange);
                shim('IDBRequest', shimIDBRequest);
                shim('IDBOpenDBRequest', shimIDBOpenDBRequest);
                shim('IDBVersionChangeEvent', shimIDBVersionChangeEvent);
            } else if (typeof window.indexedDB === 'object') {
                // Polyfill the missing IndexedDB features (no need for IDBEnvironment (window containing indexedDB itself))
                polyfill(shimIDBCursor, shimIDBCursorWithValue, shimIDBDatabase, shimIDBFactory, shimIDBIndex, shimIDBKeyRange, shimIDBObjectStore, shimIDBRequest, shimIDBTransaction);
            }
        };

        window.shimIndexedDB.__debug = function (val) {
            global.DEBUG = val;
        };
    }

    // Workaround to prevent an error in Firefox
    if (!('indexedDB' in window)) {
        window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB;
    }

    // Detect browsers with known IndexedDb issues (e.g. Android pre-4.4)
    let poorIndexedDbSupport = false;
    if (navigator.userAgent.match(/Android 2/) || navigator.userAgent.match(/Android 3/) || navigator.userAgent.match(/Android 4\.[0-3]/)) {
        /* Chrome is an exception. It supports IndexedDb */
        if (!navigator.userAgent.match(/Chrome/)) {
            poorIndexedDbSupport = true;
        }
    }

    if ((typeof window.indexedDB === 'undefined' || !window.indexedDB || poorIndexedDbSupport) && typeof window.openDatabase !== 'undefined') {
        window.shimIndexedDB.__useShim();
    } else {
        window.IDBDatabase = window.IDBDatabase || window.webkitIDBDatabase;
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
        window.IDBCursor = window.IDBCursor || window.webkitIDBCursor;
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
        if (!window.IDBTransaction) {
            window.IDBTransaction = {};
        }
        /* Some browsers (e.g. Chrome 18 on Android) support IndexedDb but do not allow writing of these properties */
        try {
            window.IDBTransaction.READ_ONLY = window.IDBTransaction.READ_ONLY || 'readonly';
            window.IDBTransaction.READ_WRITE = window.IDBTransaction.READ_WRITE || 'readwrite';
        } catch (e) {}
    }
}());

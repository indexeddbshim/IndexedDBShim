/*jshint globalstrict: true*/
'use strict';
(function(window, idbModules){
    function shim(name, value) {
        try {
            // Try setting the property. This will fail if the property is read-only.
            window[name] = value;
        }
        catch (e) {}

        if (window[name] !== value && Object.defineProperty) {
            // Setting a read-only property failed, so try re-defining the property
            try {
                Object.defineProperty(window, name, {
                    value: value
                });
            }
            catch (e) {}

            if (window[name] !== value) {
                window.console && console.warn && console.warn('Unable to shim ' + name);
            }
        }
    }

    if (typeof window.openDatabase !== "undefined") {
        shim('shimIndexedDB', idbModules.shimIndexedDB);
        if (window.shimIndexedDB) {
            window.shimIndexedDB.__useShim = function(){
                shim('indexedDB', idbModules.shimIndexedDB);
                shim('IDBFactory', idbModules.IDBFactory);
                shim('IDBDatabase', idbModules.IDBDatabase);
                shim('IDBObjectStore', idbModules.IDBObjectStore);
                shim('IDBIndex', idbModules.IDBIndex);
                shim('IDBTransaction', idbModules.IDBTransaction);
                shim('IDBCursor', idbModules.IDBCursor);
                shim('IDBKeyRange', idbModules.IDBKeyRange);
                shim('IDBRequest', idbModules.IDBRequest);
                shim('IDBOpenDBRequest', idbModules.IDBOpenDBRequest);
                shim('IDBVersionChangeEvent', idbModules.IDBVersionChangeEvent);
            };

            window.shimIndexedDB.__debug = function(val){
                idbModules.DEBUG = val;
            };
        }
    }
    
    /*
    prevent error in Firefox
    */
    if(!('indexedDB' in window)) {
        window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB;
    }
    
    /*
    detect browsers with known IndexedDb issues (e.g. Android pre-4.4)
    */
    var poorIndexedDbSupport = false;
    if (navigator.userAgent.match(/Android 2/) || navigator.userAgent.match(/Android 3/) || navigator.userAgent.match(/Android 4\.[0-3]/)) {
        /* Chrome is an exception. It supports IndexedDb */
        if (!navigator.userAgent.match(/Chrome/)) {
            poorIndexedDbSupport = true;
        }
    }

    if ((typeof window.indexedDB === "undefined" || !window.indexedDB || poorIndexedDbSupport) && typeof window.openDatabase !== "undefined") {
        window.shimIndexedDB.__useShim();
    }
    else {
        window.IDBDatabase = window.IDBDatabase || window.webkitIDBDatabase;
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
        window.IDBCursor = window.IDBCursor || window.webkitIDBCursor;
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
        if(!window.IDBTransaction){
            window.IDBTransaction = {};
        }
        /* Some browsers (e.g. Chrome 18 on Android) support IndexedDb but do not allow writing of these properties */
        try {
            window.IDBTransaction.READ_ONLY = window.IDBTransaction.READ_ONLY || "readonly";
            window.IDBTransaction.READ_WRITE = window.IDBTransaction.READ_WRITE || "readwrite";
        } catch (e) {}
    }
    
}(window, idbModules));


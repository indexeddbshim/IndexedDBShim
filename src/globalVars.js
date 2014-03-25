/*jshint globalstrict: true*/
'use strict';
(function(window, idbModules){
    if (typeof window.openDatabase !== "undefined") {
        window.shimIndexedDB = idbModules.shimIndexedDB;
        if (window.shimIndexedDB) {
            window.shimIndexedDB.__useShim = function(){
                window.indexedDB = idbModules.shimIndexedDB;
                window.IDBDatabase = idbModules.IDBDatabase;
                window.IDBTransaction = idbModules.IDBTransaction;
                window.IDBCursor = idbModules.IDBCursor;
                window.IDBKeyRange = idbModules.IDBKeyRange;
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
    
    if (typeof window.indexedDB === "undefined" && typeof window.openDatabase !== "undefined") {
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
        window.IDBTransaction.READ_ONLY = window.IDBTransaction.READ_ONLY || "readonly";
        window.IDBTransaction.READ_WRITE = window.IDBTransaction.READ_WRITE || "readwrite";
    }
    
}(window, idbModules));


/*jshint globalstrict: true*/
'use strict';
(function(idbModules){

    /**
     * The IDBRequest Object that is returns for all async calls
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
     */
    function IDBRequest(){
        this.onsuccess = this.onerror = this.result = this.error = this.source = this.transaction = null;
        this.readyState = "pending";
    }

    /**
     * The IDBOpenDBRequest called when a database is opened
     */
    function IDBOpenDBRequest(){
        this.onblocked = this.onupgradeneeded = null;
    }
    IDBOpenDBRequest.prototype = new IDBRequest();
    IDBOpenDBRequest.prototype.constructor = IDBOpenDBRequest;
    
    idbModules.IDBRequest = IDBRequest;
    idbModules.IDBOpenDBRequest = IDBOpenDBRequest;
    
}(idbModules));

/*jshint globalstrict: true*/
'use strict';
(function(idbModules){

    /**
     * The IDBRequest Object that is returns for all async calls
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
     */
    var IDBRequest = function(){
        this.onsuccess = this.onerror = this.result = this.error = this.source = this.transaction = null;
        this.readyState = "pending";
        this.eventListeners = {"success": [], "error": []};
        this.__defineSetter__('onsuccess', function (h) {
            this.addEventListener('success', h);
        });
        this.__defineSetter__('onerror', function (h) {
            this.addEventListener('error', h);
        });
    };

    IDBRequest.prototype.addEventListener = function (evt, handler) {
        if (!this.eventListeners[evt]) {
            this.eventListeners[evt] = [];
        }
        this.eventListeners[evt].push(handler);
    };
    IDBRequest.prototype.removeEventListener = function (evt, handler) {
        if (this.eventListeners[evt]) {
            var eventIndex = this.eventListeners[evt].indexOf(handler);
            if (eventIndex >= 0) {
                this.eventListeners[evt].splice(eventIndex, 1);
            }
        }
    };
    IDBRequest.prototype.dispatchEvent = function (e) {
        if (this.eventListeners && this.eventListeners[e.type]) {
            this.eventListeners[e.type].forEach(function (handler) {
                if (typeof handler === 'function') {
                    handler(e);
                }
            });
        }
    };

    /**
     * The IDBOpen Request called when a database is opened
     */
    var IDBOpenRequest = function(){
        this.onblocked = this.onupgradeneeded = null;
        this.eventListeners = {
            "success": [],
            "error": [],
            "blocked": [],
            "upgradeneeded": []};
        this.__defineSetter__('onupgradeneeded', function (h) {
            this.addEventListener('upgradeneeded', h);
        });
        this.__defineSetter__('onblocked', function (h) {
            this.addEventListener('blocked', h);
        });
    };

    IDBOpenRequest.prototype = IDBRequest.prototype;
    
    idbModules.IDBRequest = IDBRequest;
    idbModules.IDBOpenRequest = IDBOpenRequest;
    
}(idbModules));

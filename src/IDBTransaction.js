/*jshint globalstrict: true*/
'use strict';
(function(idbModules){

    /**
     * The IndexedDB Transaction
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
     * @param {Object} storeNames
     * @param {Object} mode
     * @param {Object} db
     */
    function IDBTransaction(storeNames, mode, db){
        if (typeof mode === "number") {
            this.mode = mode === 1 ? IDBTransaction.prototype.READ_WRITE : IDBTransaction.prototype.READ_ONLY;
            idbModules.DEBUG && console.log("Mode should be a string, but was specified as ", mode);
        }
        else {
            this.mode = mode || IDBTransaction.prototype.READ_ONLY;
        }
        
        this.storeNames = typeof storeNames === "string" ? [storeNames] : storeNames;
        for (var i = 0; i < this.storeNames.length; i++) {
            if (!db.objectStoreNames.contains(this.storeNames[i])) {
                idbModules.util.throwDOMException(0, "The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.", this.storeNames[i]);
            }
        }
        this.__active = true;
        this.__running = false;
        this.__requests = [];
        this.db = db;
        this.error = null;
        this.onabort = this.onerror = this.oncomplete = null;
    }
    
    IDBTransaction.prototype.__executeRequests = function(){
        if (this.__running) {
            idbModules.DEBUG && console.log("Looks like the request set is already running", this.mode);
            return;
        }

        this.__running = true;
        var me = this;

        if (!me.__active) {
            idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
        }

        me.db.__db.transaction(function executeRequests(tx) {
            me.__tx = tx;
            var q = null, i = 0;

            function success(result, req) {
                if (req) {
                    q.req = req;// Need to do this in case of cursors
                }
                q.req.readyState = "done";
                q.req.result = result;
                delete q.req.error;
                var e = idbModules.util.createEvent("success");
                idbModules.util.callback("onsuccess", q.req, e);
                i++;
                executeRequest();
            }

            function error(errorVal) {
                q.req.readyState = "done";
                q.req.error = "DOMError";
                var e = idbModules.util.createEvent("error", arguments);
                idbModules.util.callback("onerror", q.req, e);
                i++;
                executeRequest();
            }

            function executeRequest() {
                var evt;
                try {
                    if (i >= me.__requests.length) {
                        me.__active = false; // All requests in the transaction are done
                        me.__requests = [];

                        // Fire the "oncomplete" events
                        idbModules.DEBUG && console.log("Transaction completed", arguments);
                        evt = idbModules.util.createEvent("complete");
                        idbModules.util.callback("oncomplete", me, evt);
                        idbModules.util.callback("__oncomplete", me, evt);
                        return;
                    }

                    q = me.__requests[i];
                    q.op(tx, q.args, success, error);
                }
                catch (e) {
                    idbModules.DEBUG && console.log("An exception occurred in transaction", arguments);
                    me.error = e;
                    me.abort();
                    evt = idbModules.util.createEvent("error");
                    idbModules.util.callback("onerror", me, evt);
                }
            }

            executeRequest();
        },

        function onError(e){
            idbModules.DEBUG && console.log("An error in transaction", arguments);
            me.error = e;
            me.abort();
            var evt = idbModules.util.createEvent("error");
            idbModules.util.callback("onerror", me, evt);
        });
    };
    
    IDBTransaction.prototype.__addToTransactionQueue = function(callback, args){
        var request = this.__createRequest();
        this.__pushToQueue(request, callback, args);       
        return request;
    };
    
    IDBTransaction.prototype.__createRequest = function(){
        var request = new idbModules.IDBRequest();
        request.source = this.db;
        request.transaction = this;
        return request;
    };
    
    IDBTransaction.prototype.__pushToQueue = function(request, callback, args) {
        this.__requests.push({
            "op": callback,
            "args": args,
            "req": request
        });
        // Start the queue for executing the requests
        this.__executeRequests();
    };
    
    IDBTransaction.prototype.objectStore = function(objectStoreName){
        return new idbModules.IDBObjectStore(objectStoreName, this);
    };
    
    IDBTransaction.prototype.abort = function(){
        this.__active = false;
    };
    
    IDBTransaction.READ_ONLY = "readonly";
    IDBTransaction.READ_WRITE = "readwrite";
    IDBTransaction.VERSION_CHANGE = "versionchange";
    
    idbModules.IDBTransaction = IDBTransaction;
}(idbModules));

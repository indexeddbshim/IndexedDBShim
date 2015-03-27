/*jshint globalstrict: true*/
'use strict';
(function(idbModules) {

    /**
     * The IndexedDB Transaction
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
     * @param {Object} storeNames
     * @param {Object} mode
     * @param {Object} db
     */
    function IDBTransaction(storeNames, mode, db) {
        this.__active = true;
        this.__running = false;
        this.__requests = [];
        this.storeNames = storeNames;
        this.mode = mode;
        this.db = db;
        this.error = null;
        this.onabort = this.onerror = this.oncomplete = null;

        // Kick off the transaction as soon as all synchronous code is done.
        var me = this;
        setTimeout(function() { me.__executeRequests(); }, 0);
    }

    IDBTransaction.prototype.__executeRequests = function() {
        if (this.__running) {
            idbModules.DEBUG && console.log("Looks like the request set is already running", this.mode);
            return;
        }

        this.__running = true;
        var me = this;

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

                function error(tx, err) {
                    if (arguments.length === 1) {
                        err = tx;
                    }
                    q.req.readyState = "done";
                    q.req.error = err || "DOMError";
                    var e = idbModules.util.createEvent("error", err);
                    idbModules.util.callback("onerror", q.req, e);
                    me.__error(err);
                }

                function executeRequest() {
                    try {
                        if (i >= me.__requests.length) {
                            me.__active = false; // All requests in the transaction are done
                            me.__requests = [];

                            // Fire the "oncomplete" events asynchronously, so errors don't bubble
                            setTimeout(finished, 0);
                        }
                        else {
                            q = me.__requests[i];
                            q.op(tx, q.args, success, error);
                        }
                    }
                    catch (e) {
                        me.__error(e);
                    }
                }

                executeRequest();
            },

            function onError(e) {
                me.__error(e);
            }
        );

        function finished() {
            idbModules.DEBUG && console.log("Transaction completed");
            var evt = idbModules.util.createEvent("complete");
            idbModules.util.callback("oncomplete", me, evt);
            idbModules.util.callback("__oncomplete", me, evt);
        }
    };

    IDBTransaction.prototype.__addToTransactionQueue = function(callback, args) {
        var request = this.__createRequest();
        this.__pushToQueue(request, callback, args);
        return request;
    };

    IDBTransaction.prototype.__createRequest = function() {
        var request = new idbModules.IDBRequest();
        request.source = this.db;
        request.transaction = this;
        return request;
    };

    IDBTransaction.prototype.__pushToQueue = function(request, callback, args) {
        this.__assertActive();
        this.__requests.push({
            "op": callback,
            "args": args,
            "req": request
        });
    };

    IDBTransaction.prototype.__assertActive = function() {
        if (!this.__active) {
            throw idbModules.util.createDOMException("TransactionInactiveError", "A request was placed against a transaction which is currently not active, or which is finished");
        }
    };

    IDBTransaction.prototype.__assertWritable = function() {
        if (this.mode === IDBTransaction.READ_ONLY) {
            throw idbModules.util.createDOMException("ReadOnlyError", "The transaction is read only");
        }
    };

    IDBTransaction.prototype.__assertVersionChange = function() {
        IDBTransaction.__assertVersionChange(this);
    };

    IDBTransaction.__assertVersionChange = function(tx) {
        if (!tx || tx.mode !== IDBTransaction.VERSION_CHANGE) {
            throw idbModules.util.createDOMException("InvalidStateError", "Not a version transaction");
        }
    };

    IDBTransaction.prototype.__error = function(err) {
        idbModules.util.logError("Error", "An error occurred in a transaction", err);
        this.error = err;
        this.abort();
        var evt = idbModules.util.createEvent("error");
        idbModules.util.callback("onerror", this, evt);
    };

    IDBTransaction.prototype.objectStore = function(objectStoreName) {
        return new idbModules.IDBObjectStore(objectStoreName, this);
    };

    IDBTransaction.prototype.abort = function() {
        this.__active = false;
    };

    IDBTransaction.READ_ONLY = "readonly";
    IDBTransaction.READ_WRITE = "readwrite";
    IDBTransaction.VERSION_CHANGE = "versionchange";

    idbModules.IDBTransaction = IDBTransaction;
}(idbModules));

(function(idbModules){

  /**
   * The IndexedDB Transaction
   * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
   * @param {Object} storeNames
   * @param {Object} mode
   * @param {Object} db
   */
  var READ = 0;
  var READ_WRITE = 1;
  var VERSION_TRANSACTION = 2;
  
  var IDBTransaction = function(storeNames, mode, db){
    if (typeof mode === "number") {
      this.mode = mode;
      DEBUG && (mode !== 2) && logger.log("Mode should be a string, but was specified as ", mode);
    } else if (typeof mode === "string") {
      this.mod = 'readwrite' === mode ? READ_WRITE : READ;
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
    this.__aborted = false;
    this.db = db;
    this.error = null;
    this.onabort = this.onerror = this.oncomplete = null;
    var me = this;
  };
  
  IDBTransaction.prototype.__executeRequests = function(){
    if (this.__running && this.mode !== VERSION_TRANSACTION) {
      DEBUG && logger.warn("Looks like the request set is already running", this.mode);
      return;
    }
    this.__running = true;
    var me = this;
    window.setTimeout(function(){
      if (me.mode !== 2 && !me.__active) {
        idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
      }
      // Start using the version transaction
      me.db.__db.transaction(function(tx){
        me.__tx = tx;
        var q = null, i = 0;
        function success(result, req){
          if (req) {
            q.req = req;// Need to do this in case of cursors
          }
          q.req.readyState = "done";
          q.req.result = result;
          delete q.req.error;
          var e = idbModules.Event("success");
          idbModules.util.callback("onsuccess", q.req, e);
          i++;
          executeRequest();
        }
        
        function error(errorVal){
          q.req.readyState = "done";
          q.req.error = "DOMError";
          var e = idbModules.Event("error", arguments);
          idbModules.util.callback("onerror", q.req, e);
          i++;
          executeRequest();
        }
        try {
          function executeRequest(){
            if (i >= me.__requests.length) {
              me.__active = false; // All requests in the transaction is done
              me.__requests = [];
              return;
            }
            q = me.__requests[i];
            q.op(tx, q.args, success, error);
          }
          executeRequest();
        } catch (e) {
          DEBUG && logger.error("An exception occured in transaction", arguments);
          typeof me.onerror === "function" && me.onerror();
        }
      }, function(){
        DEBUG && logger.error("An error in transaction", arguments);
        typeof me.onerror === "function" && me.onerror();
      }, function(){
        DEBUG && logger.log("Transaction completed", arguments);
        typeof me.oncomplete === "function" && me.oncomplete();
      });
    }, 1);
  };
  
  IDBTransaction.prototype.__addToTransactionQueue = function(callback, args){
    if (!this.__active && this.mode !== VERSION_TRANSACTION) {
      idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished.", this.__mode);
    }
    var request = new idbModules.IDBRequest();
    request.source = this.db;
    this.__requests.push({
      "op": callback,
      "args": args,
      "req": request
    });
    // Start the queue for executing the requests
    this.__executeRequests();
    return request;
  };
  
  IDBTransaction.prototype.objectStore = function(objectStoreName){
    return new idbModules.IDBObjectStore(objectStoreName, this);
  };
  
  IDBTransaction.prototype.abort = function(){
    !this.__active && idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", this.__active);
    
  };
  
  IDBTransaction.prototype.READ_ONLY = 0;
  IDBTransaction.prototype.READ_WRITE = 1;
  IDBTransaction.prototype.VERSION_CHANGE = 2;
  
  idbModules.IDBTransaction = IDBTransaction;
}(idbModules));

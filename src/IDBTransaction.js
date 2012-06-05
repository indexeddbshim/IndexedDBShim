(function(idbModules){

	/**
	 * The IndexedDB Transaction
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
	 * @param {Object} storeNames
	 * @param {Object} mode
	 * @param {Object} db
	 */
	var IDBTransaction = function(storeNames, mode, db){
		this.mode = mode;
		this.storeNames = typeof storeNames === "string" ? [storeNames] : storeNames;
		for (var i = 0; i < this.storeNames.length; i++) {
			if (db.objectStoreNames.indexOf(storeNames[i]) === -1) {
				idbModules.util.throwDOMException(0, "The operation failed because the requested database object could not be found. For example, an object store did not exist but was being opened.", storeNames);
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
		if (this.__running) {
			return;
		}
		this.__running = true;
		var me = this;
		window.setTimeout(function(){
			!me.__active && idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
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
					idbModules.util.callback("onsuccess", q.req, [e]);
					i++;
					executeRequest();
				};
				
				function error(errorVal){
					q.req.readyState = "done";
					q.req.error = "DOMError";
					var e = idbModules.Event("error", arguments);
					idbModules.util.callback("onerror", q.req, [e]);
					i++;
					executeRequest();
				};
				try {
					function executeRequest(){
						if (i >= me.__requests.length) {
							me.__active = false; // All requests in the transaction is done
							me.__requests = [];
							return;
						}
						q = me.__requests[i];
						q.op(tx, q["args"], success, error);
					};
					executeRequest();
				} catch (e) {
					// TODO - Call transaction onerror
					console.error("An exception occured in transaction", arguments);
				}
			}, function(){
				// TODO - Call transaction onerror
				console.error("An error in transaction", arguments);
			}, function(){
				// TODO - Call transaction oncomplete 
				console.log("Transaction completed", arguments);
			});
		}, 1);
	}
	
	IDBTransaction.prototype.__addToTransactionQueue = function(callback, args){
		!this.__active && idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished.", this.__active);
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
		!me.__active && idbModules.util.throwDOMException(0, "A request was placed against a transaction which is currently not active, or which is finished", me.__active);
		
	};
	
	IDBTransaction.prototype.READ_ONLY = 0;
	IDBTransaction.prototype.READ_WRITE = 1;
	IDBTransaction.prototype.VERSION_CHANGE = 2;
	
	window.IDBTransaction = idbModules["IDBTransaction"] = IDBTransaction;
}(idbModules));

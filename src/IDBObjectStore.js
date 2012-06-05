(function(idbModules){

	/**
	 * IndexedDB Object Store
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
	 * @param {Object} name
	 * @param {Object} transaction
	 */
	var IDBObjectStore = function(name, idbTransaction, ready){
		this.name = name;
		this.transaction = idbTransaction;
		this.__ready = {};
		this.__setReadyState("createObjectStore", typeof ready === "undefined" ? true : ready);
		this.indexNames = [];
	};
	
	/**
	 * Need this flag as createObjectStore is synchronous. So, we simply return when create ObjectStore is called
	 * but do the processing in the background. All other operations should wait till ready is set
	 * @param {Object} val
	 */
	IDBObjectStore.prototype.__setReadyState = function(key, val){
		this.__ready[key] = val;
	};
	
	/**
	 * Called by all operations on the object store, waits till the store is ready, and then performs the operation
	 * @param {Object} callback
	 */
	IDBObjectStore.prototype.__waitForReady = function(callback, key){
		var ready = true;
		if (typeof key !== "undefined") {
			ready = (typeof this.__ready[key] === "undefined") ? true : this.__ready[key];
		} else {
			for (var x in this.__ready) {
				if (!this.__ready[x]) {
					ready = false;
				}
			}
		}
		
		if (ready) {
			callback();
		} else {
			console.log("Waiting for to be ready", key);
			var me = this;
			window.setTimeout(function(){
				me.__waitForReady(callback);
			}, 100);
		}
	};
	
	/**
	 * Gets (and optionally caches) the properties like keyPath, autoincrement, etc for this objectStore
	 * @param {Object} callback
	 */
	IDBObjectStore.prototype.__getStoreProps = function(tx, callback, waitOnProperty){
		var me = this;
		this.__waitForReady(function(){
			if (me.__storeProps) {
				//console.log("Store properties - cached", me.__storeProps);
				callback(me.__storeProps);
			} else {
				tx.executeSql("SELECT * FROM __sys__ where name = ?", [me.name], function(tx, data){
					if (data.rows.length !== 1) {
						callback();
					} else {
						me.__storeProps = {
							"name": data.rows.item(0).name,
							"indexList": data.rows.item(0).indexList,
							"autoInc": data.rows.item(0).autoInc,
							"keyPath": data.rows.item(0).keyPath
						}
						//console.log("Store properties", me.__storeProps);
						callback(me.__storeProps);
					}
				}, function(){
					callback();
				});
			}
		}, waitOnProperty);
	};
	
	/**
	 * From the store properties and object, extracts the value for the key in hte object Store
	 * If the table has auto increment, get the next in sequence
	 * @param {Object} props
	 * @param {Object} value
	 * @param {Object} key
	 */
	IDBObjectStore.prototype.__deriveKey = function(tx, value, key, callback){
		function getNextAutoIncKey(){
			tx.executeSql("SELECT * FROM sqlite_sequence where name like ?", [me.name], function(tx, data){
				if (data.rows.length !== 1) {
					idbModules.util.throwDOMException(0, "Data Error - Could not get the auto increment value for key, no auto Inc value returned", data.rows);
				} else {
					callback(data.rows.item(0).seq);
				}
			}, function(tx, error){
				idbModules.util.throwDOMException(0, "Data Error - Could not get the auto increment value for key", error);
			});
		}
		
		var me = this;
		me.__getStoreProps(tx, function(props){
			if (!props) idbModules.util.throwDOMException(0, "Data Error - Could not locate defination for this table", props);
			
			if (props.keyPath) {
				if (typeof key !== "undefined") {
					idbModules.util.throwDOMException(0, "Data Error - The object store uses in-line keys and the key parameter was provided", props);
				}
				if (value) {
					try {
						var primaryKey = eval("value['" + props.keyPath + "']");
						if (!primaryKey) {
							if (props.autoInc === "true") {
								getNextAutoIncKey();
							} else {
								idbModules.util.throwDOMException(0, "Data Error - Could not eval key from keyPath", e);
							}
						} else {
							callback(primaryKey);
						}
					} catch (e) {
						idbModules.util.throwDOMException(0, "Data Error - Could not eval key from keyPath", e);
					}
				} else {
					idbModules.util.throwDOMException(0, "Data Error - KeyPath was specified, but value was not", e);
				}
			} else {
				if (typeof key !== "undefined") {
					callback(key);
				} else {
					if (props.autoInc === "false") {
						idbModules.util.throwDOMException(0, "Data Error - The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ", props);
					} else {
						// Looks like this has autoInc, so lets get the next in sequence and return that.
						getNextAutoIncKey();
					}
				}
			}
		});
	};
	
	IDBObjectStore.prototype.__insertData = function(tx, value, primaryKey, success, error){
		var paramMap = {};
		if (typeof primaryKey !== "undefined") {
			paramMap["key"] = idbModules.Key.encode(primaryKey);
		}
		var indexes = JSON.parse(this.__storeProps.indexList);
		for (var key in indexes) {
			try {
				paramMap[indexes[key].columnName] = idbModules.Key.encode(eval("value['" + indexes[key].keyPath + "']"));
			} catch (e) {
				error(e);
			}
		}
		var sqlStart = ["INSERT INTO ", this.name, "("];
		var sqlEnd = [" VALUES ("];
		var sqlValues = [];
		for (key in paramMap) {
			sqlStart.push(key + ",");
			sqlEnd.push("?,");
			sqlValues.push(paramMap[key]);
		}
		// removing the trailing comma
		sqlStart.push("value )");
		sqlEnd.push("?)")
		sqlValues.push(idbModules.Sca.encode(value));
		
		sql = sqlStart.join(" ") + sqlEnd.join(" ");
		
		console.log("SQL for adding", sql, sqlValues);
		tx.executeSql(sql, sqlValues, function(tx, data){
			success(primaryKey);
		}, function(tx, err){
			error(err);
		});
	};
	
	IDBObjectStore.prototype.add = function(value, key){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__deriveKey(tx, value, key, function(primaryKey){
				me.__insertData(tx, value, primaryKey, success, error);
			});
		});
	};
	
	IDBObjectStore.prototype.put = function(value, key){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__deriveKey(tx, value, key, function(primaryKey){
				// First try to delete if the record exists
				var sql = "DELETE FROM " + me.name + " where key = ?";
				tx.executeSql(sql, [idbModules.Key.encode(primaryKey)], function(tx, data){
					console.log("Did the row with the", primaryKey, "exist? ", data.rowsAffected);
					me.__insertData(tx, value, primaryKey, success, error);
				}, function(tx, err){
					error(err);
				});
			});
		});
	};
	
	IDBObjectStore.prototype.get = function(key){
		// TODO Key should also be a key range
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__waitForReady(function(){
				var primaryKey = idbModules.Key.encode(key);
				console.log("Fetching", me.name, primaryKey);
				tx.executeSql("SELECT * FROM " + me.name + " where key = ?", [primaryKey], function(tx, data){
					console.log("Fetched data", data.rows.item(0));
					try {
						success(idbModules.Sca.decode(data.rows.item(0).value));
					} catch (e) {
						console.log(e)
						// If no result is returned, or error occurs when parsing JSON
						success(undefined);
					}
				}, function(tx, err){
					error(err);
				});
			});
		});
	};
	
	IDBObjectStore.prototype["delete"] = function(key){
		// TODO key should also support key ranges
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__waitForReady(function(){
				var primaryKey = idbModules.Key.encode(key);
				console.log("Fetching", me.name, primaryKey);
				tx.executeSql("DELETE FROM " + me.name + " where key = ?", [primaryKey], function(tx, data){
					console.log("Deleted from database", data.rowsAffected);
					success();
				}, function(tx, err){
					error(err);
				});
			});
		});
	};
	
	IDBObjectStore.prototype.clear = function(){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__waitForReady(function(){
				var primaryKey = idbModules.Key.encode(key);
				console.log("Fetching", me.name, primaryKey);
				tx.executeSql("DELETE FROM " + me.name, [], function(tx, data){
					console.log("Cleared all records from database", data.rowsAffected);
					success();
				}, function(tx, err){
					error(err);
				});
			});
		});
	};
	
	IDBObjectStore.prototype.count = function(){
		var me = this;
		return me.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__waitForReady(function(){
				var sql = "SELECT * FROM " + me.name + ((key !== "undefined") ? " WHERE key = ?" : "");
				var sqlValues = [];
				key && sqlValues.push(idbModules.Key.encode(key))
				tx.executeSql(sql, sqlValues, function(tx, data){
					success(data.rows.length);
				}, function(tx, err){
					error(err);
				});
			});
		});
	};
	
	IDBObjectStore.prototype.openCursor = function(range, direction){
		var cursorRequest = new idbModules.IDBRequest();
		var cursor = new idbModules.IDBCursor(range, direction, this, cursorRequest, "key", "value");
		return cursorRequest;
	};
	
	IDBObjectStore.prototype.index = function(indexName){
		var index = new idbModules.IDBIndex(indexName, this);
		return index;
	};
	
	IDBObjectStore.prototype.createIndex = function(indexName, keyPath, optionalParameters){
		var me = this;
		optionalParameters = optionalParameters || {};
		me.__setReadyState("createIndex", false);
		var result = new idbModules.IDBIndex(indexName, me);
		me.__waitForReady(function(){
			result.__createIndex(indexName, keyPath, optionalParameters);
		}, "createObjectStore");
		me.indexNames.push(indexName);
		return result;
	};
	
	IDBObjectStore.prototype.deleteIndex = function(indexName){
		var result = new idbModules.IDBIndex(indexName, me, false);
		result.__deleteIndex(indexName);
		return result;
	};
	
	idbModules["IDBObjectStore"] = IDBObjectStore;
}(idbModules));

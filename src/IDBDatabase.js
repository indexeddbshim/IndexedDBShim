(function(idbModules){

	/**
	 * IDB Database Object
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
	 * @param {Object} db
	 */
	var IDBDatabase = function(db, name, version, storeProperties){
		this.__db = db, this.version = version, this.__storeProperties = storeProperties;
		this.objectStoreNames = [];
		for (var i = 0; i < storeProperties.rows.length; i++) {
			this.objectStoreNames.push(storeProperties.rows.item(i).name);
		}
		this.name = name;
		this.onabort = this.onerror = this.onversionchange = null;
	};
	
	IDBDatabase.prototype.createObjectStore = function(storeName, createOptions){
		var me = this;
		createOptions = createOptions || {};
		createOptions.keyPath = createOptions.keyPath || null;
		var result = new idbModules.IDBObjectStore(storeName, me.__versionTransaction, false);
		
		var transaction = me.__versionTransaction;
		transaction.__addToTransactionQueue(function(tx, args, success, failure){
			function error(){
				idbModules.util.throwDOMException(0, "Could not create new object store", arguments);
			}
			
			if (!me.__versionTransaction) {
				idbModules.util.throwDOMException(0, "Invalid State error", me.transaction);
			}
			//key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
			var sql = ["CREATE TABLE", storeName, "(key BLOB", createOptions.autoIncrement ? ", inc INTEGER PRIMARY KEY AUTOINCREMENT" : "PRIMARY KEY", ", value BLOB)"].join(" ");
			console.log(sql);
			tx.executeSql(sql, [], function(tx, data){
				tx.executeSql("INSERT INTO __sys__ VALUES (?,?,?,?)", [storeName, createOptions.keyPath, createOptions.autoIncrement ? true : false, "{}"], function(){
					result.__setReadyState("createObjectStore", true);
					success(result);
				}, error);
			}, error);
		});
		
		// The IndexedDB Specification needs us to return an Object Store immediatly, but WebSQL does not create and return the store immediatly
		// Hence, this can technically be unusable, and we hack around it, by setting the ready value to false
		me.objectStoreNames.push(storeName);
		return result;
	};
	
	IDBDatabase.prototype.deleteObjectStore = function(storeName){
		var error = function(){
			idbModules.util.throwDOMException(0, "Could not delete ObjectStore", arguments);
		}
		var me = this;
		me.objectStoreNames.indexOf(storeName) === -1 && error("Object Store does not exist");
		me.objectStoreNames.splice(me.objectStoreNames.indexOf(storeName), 1);
		
		var transaction = me.__versionTransaction;
		transaction.__addToTransactionQueue(function(tx, args, success, failure){
			if (!me.__versionTransaction) {
				idbModules.util.throwDOMException(0, "Invalid State error", me.transaction);
			}
			me.__db.transaction(function(tx){
				tx.executeSql("SELECT * FROM __sys__ where name = ?", [storeName], function(tx, data){
					if (data.rows.length > 0) {
						tx.executeSql("DROP TABLE " + storeName, [], function(){
							tx.executeSql("DELETE FROM __sys__ WHERE name = ?", [storeName], function(){
							}, error);
						}, error);
					}
				});
			});
		});
	};
	
	IDBDatabase.prototype.close = function(){
		// Don't do anything coz the database automatically closes
	};
	
	IDBDatabase.prototype.transaction = function(storeNames, mode){
		var transaction = new idbModules.IDBTransaction(storeNames, mode, this);
		return transaction;
	};
	
	idbModules["IDBDatabase"] = IDBDatabase;
})(idbModules);

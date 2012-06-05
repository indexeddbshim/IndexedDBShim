(function(idbModules, undefined){
	/**
	 * IDB Index
	 * http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
	 * @param {Object} indexName
	 * @param {Object} keyPath
	 * @param {Object} optionalParameters
	 * @param {Object} transaction
	 */
	function IDBIndex(indexName, idbObjectStore){
		this.indexName = indexName;
		this.__idbObjectStore = this.source = idbObjectStore;
	};
	
	IDBIndex.prototype.__createIndex = function(indexName, keyPath, optionalParameters){
		var me = this;
		var transaction = me.__idbObjectStore.transaction;
		transaction.__addToTransactionQueue(function(tx, args, success, failure){
			me.__idbObjectStore.__getStoreProps(tx, function(){
				function error(){
					idbModules.util.throwDOMException(0, "Could not create new index", arguments);
				}
				if (transaction.mode !== 2) {
					idbModules.util.throwDOMException(0, "Invalid State error, not a version transaction", me.transaction);
				}
				var idxList = JSON.parse(me.__idbObjectStore.__storeProps.indexList);
				if (typeof idxList[indexName] != "undefined") {
					idbModules.util.throwDOMException(0, "Index already exists on store", idxList);
				}
				var columnName = indexName;
				idxList[indexName] = {
					"columnName": columnName,
					"keyPath": keyPath,
					"optionalParams": optionalParameters
				};
				// For this index, first create a column
				me.__idbObjectStore.__storeProps.indexList = JSON.stringify(idxList);
				var sql = ["ALTER TABLE", me.__idbObjectStore.name, "ADD", columnName, "BLOB"].join(" ");
				console.log(sql);
				tx.executeSql(sql, [], function(tx, data){
					// Once a column is created, put existing records into the index
					tx.executeSql("SELECT * FROM " + me.__idbObjectStore.name, [], function(tx, data){
						(function initIndexForRow(i){
							if (i < data.rows.length) {
								try {
									var value = idbModules.Sca.decode(data.rows.item(i).value);
									var indexKey = eval("value['" + keyPath + "']");
									tx.executeSql("UPDATE " + me.__idbObjectStore.name + " set " + columnName + " = ? where key = ?", [idbModules.Key.encode(indexKey), data.rows.item(i).key], function(tx, data){
										initIndexForRow(i + 1);
									}, error);
								} catch (e) {
									// Not a valid value to insert into index, so just continue
									initIndexForRow(i + 1);
								}
							} else {
								console.log("Updating the indexes in table", me.__idbObjectStore.__storeProps);
								tx.executeSql("UPDATE __sys__ set indexList = ? where name = ?", [me.__idbObjectStore.__storeProps.indexList, me.__idbObjectStore.name], function(){
									me.__idbObjectStore.__setReadyState("createIndex", true);
									success(me);
								}, error);
							}
						})(0);
					}, error);
				}, error);
			}, "createObjectStore");
		});
	};
	
	IDBIndex.prototype.openCursor = function(range, direction){
		var cursorRequest = new idbModules.IDBRequest();
		var cursor = new idbModules.IDBCursor(range, direction, this.source, cursorRequest, this.indexName, "value");
		return cursorRequest;
	};
	
	IDBIndex.prototype.openKeyCursor = function(range, direction){
		var cursorRequest = new idbModules.IDBRequest();
		var cursor = new idbModules.IDBCursor(range, direction, this.source, cursorRequest, this.indexName, "key");
		return cursorRequest;
	};
	
	IDBIndex.prototype.__fetchIndexData = function(key, opType){
		var me = this;
		return me.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
			var sql = ["SELECT * FROM ", me.__idbObjectStore.name, " WHERE", me.indexName, "NOT NULL"];
			var sqlValues = [];
			if (typeof key !== "undefined") {
				sql.push("AND", me.indexName, " = ?");
				sqlValues.push(idbModules.Key.encode(key));
			}
			console.log("Trying to fetch data for Index", sql.join(" "), sqlValues);
			tx.executeSql(sql.join(" "), sqlValues, function(tx, data){
				var d;
				if (typeof opType === "count") {
					d = data.rows.length;
				} else if (data.rows.length === 0) {
					d = undefined;
				} else if (opType === "key") {
					d = idbModules.Key.decode(data.rows.item(0).key);
				} else { // when opType is value
					d = idbModules.Sca.decode(data.rows.item(0).value);
				}
				success(d);
			}, error);
		});
	}
	
	IDBIndex.prototype.get = function(key){
		return this.__fetchIndexData(key, "value");
	};
	
	IDBIndex.prototype.getKey = function(key){
		return this.__fetchIndexData(key, "key");
	};
	
	IDBIndex.prototype.count = function(key){
		return this.__fetchIndexData(key, "count");
	};
	
	idbModules["IDBIndex"] = IDBIndex;
}(idbModules));

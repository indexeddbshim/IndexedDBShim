(function(idbModules, undefined){
	/**
	 * The IndexedDB Cursor Object
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
	 * @param {Object} range
	 * @param {Object} direction
	 * @param {Object} idbObjectStore
	 * @param {Object} cursorRequest
	 */
	function IDBCursor(range, direction, idbObjectStore, cursorRequest, keyColumnName, valueColumnName){
		this.__range = range;
		this.source = this.__idbObjectStore = idbObjectStore;
		this.__req = cursorRequest;
		
		this.key = undefined;
		this.direction = direction;
		
		this.__keyColumnName = keyColumnName;
		this.__valueColumnName = valueColumnName;
		
		if (!this.source.transaction.__active) idbModules.util.throwDOMException("TransactionInactiveError - The transaction this IDBObjectStore belongs to is not active.");
		
		// Setting this to -1 as continue will set it to 0 anyway
		this.__offset = -1;
		this["continue"]();
	}
	
	IDBCursor.prototype.__find = function(key, tx, success, error){
		var me = this;
		var sql = ["SELECT * FROM ", me.__idbObjectStore.name];
		var sqlValues = [];
		sql.push("WHERE ", me.__keyColumnName, " NOT NULL");
		if (me.__range && (me.__range.lower || me.__range.upper)) {
			sql.push("AND");
			if (me.__range.lower) {
				sql.push("key " + (me.__range.lowerOpen ? "<=" : "<") + " ?");
				sqlValues.push(me.__range.lower);
			}
			(me.__range.lower && me.__range.upper) && sql.push("AND");
			if (me.__range.upper) {
				sql.push("key " + (me.__range.upperOpen ? ">=" : ">") + " ?");
				sqlValues.push(me.__range.upper);
			}
		}
		sql.push(" ORDER BY ", me.__keyColumnName);
		if (typeof key !== "undefined") {
			sql.push((me.__range && (me.__range.lower || me.__range.upper)) ? "AND" : "WHERE")
			sql.push("key = ?");
			sqlValues.push(idbModules.Key.encode(key));
			sql.push("LIMIT 1");
		} else {
			sql.push("LIMIT 1 OFFSET " + me.__offset);
		}
		console.log(sql.join(" "), sqlValues);
		tx.executeSql(sql.join(" "), sqlValues, function(tx, data){
			if (data.rows.length === 1) {
				var key = idbModules.Key.decode(data.rows.item(0)[me.__keyColumnName]);
				var val = me.__valueColumnName === "value" ? idbModules.Sca.decode(data.rows.item(0)[me.__valueColumnName]) : idbModules.Key.decode(data.rows.item(0)[me.__valueColumnName]);
				success(key, val);
			} else {
				console.log("Reached end of cursors");
				success(undefined, undefined);
			}
		}, function(tx, data){
			console.log("Could not execute Cursor.continue");
			error(data);
		});
	};
	
	IDBCursor.prototype["continue"] = function(key){
		var me = this;
		this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__offset++;
			me.__find(key, tx, function(key, val){
				me.key = key, me.value = val;
				success(typeof me.key !== "undefined" ? me : undefined, me.__req);
			}, function(data){
				error(data);
			});
		});
	};
	
	IDBCursor.prototype.advance = function(count){
		if (count <= 0) {
			idbModules.util.throwDOMException("Type Error - Count is invalid - 0 or negative", count);
		}
		var me = this;
		this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__offset += count;
			me.__find(key, tx, function(key, value){
				me.__offset++;
				me.key = key, me.value = value;
				success(me, me.__req);
			}, function(data){
				error(data);
			})
		});
	};
	
	IDBCursor.prototype.update = function(valueToUpdate){
		var me = this;
		return this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__find(undefined, tx, function(key, value){
				var sql = "UPDATE " + me.__idbObjectStore.name + " SET value = ? WHERE key = ?";
				console.log(sql, valueToUpdate, key);
				tx.executeSql(sql, [idbModules.Sca.encode(valueToUpdate), idbModules.Key.encode(key)], function(tx, data){
					if (data.rowsAffected === 1) {
						success(key);
					} else {
						error("No rowns with key found" + key);
					}
				}, function(tx, data){
					error(data);
				})
			}, function(data){
				error(data);
			});
		});
	};
	
	IDBCursor.prototype["delete"] = function(){
		var me = this;
		return this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
			me.__find(undefined, tx, function(key, value){
				var sql = "DELETE FROM  " + me.__idbObjectStore.name + " WHERE key = ?";
				console.log(sql, key);
				tx.executeSql(sql, [idbModules.Key.encode(key)], function(tx, data){
					if (data.rowsAffected === 1) {
						success(undefined);
					} else {
						error("No rowns with key found" + key);
					}
				}, function(tx, data){
					error(data);
				})
			}, function(data){
				error(data);
			});
		});
	};
	
	idbModules["IDBCursor"] = IDBCursor;
}(idbModules));

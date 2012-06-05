(function(idbModules){
	var DEFAULT_DB_SIZE = 4 * 1024 * 1024;
	
	// The sysDB to keep track of version numbers for databases
	var sysdb = window.openDatabase("__sysdb__", 1, "System Database", DEFAULT_DB_SIZE);
	sysdb.transaction(function(tx){
		tx.executeSql("SELECT * FROM dbVersions", [], function(t, data){
			// dbVersions already exists
		}, function(){
			// dbVersions does not exist, so creating it
			sysdb.transaction(function(tx){
				tx.executeSql("CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);", [], function(){
				}, function(){
					idbModules.util.throwDOMException("Could not create table __sysdb__ to save DB versions");
				});
			});
		});
	}, function(){
		// sysdb Transaction failed
		idbModules.util.throwDOMException("Could not create table __sysdb__ to save DB versions");
	});
	
	idbModules["shimIndexedDB"] = {
		/**
		 * The IndexedDB Method to create a new database and return the DB
		 * @param {Object} name
		 * @param {Object} version
		 */
		open: function(name, version){
			var req = new idbModules.IDBOpenRequest();
			var calledDbCreateError = false;
			
			function dbCreateError(){
				if (calledDbCreateError) {
					return;
				}
				var e = idbModules.Event("error", arguments);
				req.readyState = "done";
				req.error = "DOMError";
				idbModules.util.callback("onerror", req, [e]);
				calledDbCreateError = true
			}
			
			function openDB(oldVersion){
				var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
				req.readyState = "done";
				if (typeof version === "undefined") {
					version = oldVersion || 1;
				}
				if (version <= 0 || oldVersion > version) {
					idbModules.util.throwDOMException(0, "An attempt was made to open a database using a lower version than the existing version.", version);
				}
				
				db.transaction(function(tx){
					tx.executeSql("CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexList BLOB)", [], function(){
						tx.executeSql("SELECT * FROM __sys__", [], function(tx, data){
							var e = idbModules.Event("success");
							req.source = req.result = new idbModules.IDBDatabase(db, name, version, data);
							if (oldVersion < version) {
								// DB Upgrade in progress 
								sysdb.transaction(function(systx){
									systx.executeSql("UPDATE dbVersions set version = ? where name = ?", [version, name], function(){
										var e = idbModules.Event("success");
										e.oldVersion = oldVersion, e.newVersion = version;
										req.transaction = req.result.__versionTransaction = new idbModules.IDBTransaction([], 2, req.source);
										idbModules.util.callback("onupgradeneeded", req, [e], function(){
											idbModules.util.callback("onsuccess", req, [e]);
										});
									}, dbCreateError);
								}, dbCreateError);
							} else {
								idbModules.util.callback("onsuccess", req, [e]);
							}
						}, dbCreateError);
					}, dbCreateError);
				}, dbCreateError);
			};
			
			sysdb.transaction(function(tx){
				tx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data){
					if (data.rows.length === 0) {
						// Database with this name does not exist
						tx.executeSql("INSERT INTO dbVersions VALUES (?,?)", [name, version || 1], function(){
							openDB(1);
						}, dbCreateError);
					} else {
						openDB(data.rows.item(0).version);
					}
				}, dbCreateError);
			}, dbCreateError);
			
			return req;
		},
		
		"deleteDatabase": function(name){
			var req = new idbModules.IDBOpenRequest();
			var calledDBError = false;
			function dbError(msg){
				if (calledDBError) {
					return;
				}
				req.readyState = "done";
				req.error = "DOMError";
				var e = idbModules.Event("error");
				e.message = msg;
				e.debug = arguments;
				idbModules.util.callback("onerror", req, [e]);
				calledDBError = true;
			}
			var version = null;
			function deleteFromDbVersions(){
				sysdb.transaction(function(systx){
					systx.executeSql("DELETE FROM dbVersions where name = ? ", [name], function(){
						req.result = undefined;
						var e = idbModules.Event("success");
						e.newVersion = null, e.oldVersion = version;
						idbModules.util.callback("onsuccess", req, [e]);
					}, dbError);
				}, dbError);
			}
			sysdb.transaction(function(systx){
				systx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data){
					if (data.rows.length === 0) {
						dbError("Database does not exist");
						return;
					}
					var version = data.rows.item(0).version;
					var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
					db.transaction(function(tx){
						tx.executeSql("SELECT * FROM __sys__", [], function(tx, data){
							var tables = data.rows;
							(function deleteTables(i){
								if (i >= tables.length) {
									// If all tables are deleted, delete the housekeeping tables
									tx.executeSql("DROP TABLE __sys__", [], function(){
										// Finally, delete the record for this DB from sysdb
										deleteFromDbVersions();
									}, dbError);
								} else {
									// Delete all tables in this database, maintained in the sys table
									tx.executeSql("DROP TABLE " + tables.item(i).name, [], function(){
										deleteTables(i + 1);
									}, function(){
										deleteTables(i + 1);
									});
								}
							}(0));
						}, function(e){
							// __sysdb table does not exist, but that does not mean delete did not happen
							deleteFromDbVersions();
						});
					}, dbError);
				});
			}, dbError);
			return req;
		},
		"cmp": function(key1, key2){
			return idbModules.Key.encode(key1) > idbModules.Key.encode(key2) ? 1 : key1 == key2 ? 0 : -1;
		}
	};
	
	window.indexedDB = idbModules["shimIndexedDB"];
})(idbModules);

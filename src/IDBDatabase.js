/*jshint globalstrict: true*/
'use strict';
(function(idbModules){

    /**
     * IDB Database Object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
     * @param {Object} db
     */
    var IDBDatabase = function(db, name, version, storeProperties){
        this.__db = db;
        this.version = version;
        this.objectStoreNames = new idbModules.util.StringList();
        for (var i = 0; i < storeProperties.rows.length; i++) {
            this.objectStoreNames.push(storeProperties.rows.item(i).name);
        }
        // Convert store properties to an object because we need to modify the object when a db is upgraded and new
        // stores/indexes are being created
        this.__storeProperties = {};
        for (i = 0; i < storeProperties.rows.length; i++) {
            var row = storeProperties.rows.item(i);
            var objectStoreProps = this.__storeProperties[row.name] = {};
            objectStoreProps.keyPath = row.keypath;
            objectStoreProps.autoInc = row.autoInc === "true";
            objectStoreProps.indexList = JSON.parse(row.indexList);
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
            var sql = ["CREATE TABLE", idbModules.util.quote(storeName), "(key BLOB", createOptions.autoIncrement ? ", inc INTEGER PRIMARY KEY AUTOINCREMENT" : "PRIMARY KEY", ", value BLOB)"].join(" ");
            idbModules.DEBUG && console.log(sql);
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
        // Also store this for the first run
        var storeProps = me.__storeProperties[storeName] = {};
        storeProps.keyPath = createOptions.keyPath;
        storeProps.autoInc = !!createOptions.autoIncrement;
        storeProps.indexList = {};
        return result;
    };
    
    IDBDatabase.prototype.deleteObjectStore = function(storeName){
        var error = function(){
            idbModules.util.throwDOMException(0, "Could not delete ObjectStore", arguments);
        };
        var me = this;
        !me.objectStoreNames.contains(storeName) && error("Object Store does not exist");
        me.objectStoreNames.splice(me.objectStoreNames.indexOf(storeName), 1);
        
        var transaction = me.__versionTransaction;
        transaction.__addToTransactionQueue(function(tx, args, success, failure){
            if (!me.__versionTransaction) {
                idbModules.util.throwDOMException(0, "Invalid State error", me.transaction);
            }
            me.__db.transaction(function(tx){
                tx.executeSql("SELECT * FROM __sys__ where name = ?", [storeName], function(tx, data){
                    if (data.rows.length > 0) {
                        tx.executeSql("DROP TABLE " + idbModules.util.quote(storeName), [], function(){
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
        var transaction = new idbModules.IDBTransaction(storeNames, mode || 1, this);
        return transaction;
    };
    
    idbModules.IDBDatabase = IDBDatabase;
}(idbModules));

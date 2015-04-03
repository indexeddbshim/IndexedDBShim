/*jshint globalstrict: true*/
'use strict';
(function(idbModules){

    /**
     * IDB Database Object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
     * @param {Object} db
     */
    function IDBDatabase(db, name, version, storeProperties){
        this.__db = db;
        this.__closed = false;
        this.version = version;

        this.objectStoreNames = new idbModules.util.StringList();
        this.__objectStores = [];
        for (var i = 0; i < storeProperties.rows.length; i++) {
//            var store = new idbModules.IDBObjectStore(storeProperties.rows.item(i));
//            this.__objectStores.push(store);
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
    }
    
    IDBDatabase.prototype.createObjectStore = function(storeName, createOptions){
        var me = this;
        createOptions = createOptions || {};
        createOptions.keyPath = createOptions.keyPath || null;
        var result = new idbModules.IDBObjectStore(storeName, me.__versionTransaction, false, createOptions);
        
        var transaction = me.__versionTransaction;
        idbModules.IDBTransaction.__assertVersionChange(transaction);
        transaction.__addToTransactionQueue(function createObjectStore(tx, args, success, failure){
            function error(tx, err){
                throw idbModules.util.createDOMException(0, "Could not create object store \"" + storeName + "\"", err);
            }

            //key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
            var sql = ["CREATE TABLE", idbModules.util.quote(storeName), "(key BLOB", createOptions.autoIncrement ? "UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT" : "PRIMARY KEY", ", value BLOB)"].join(" ");
            idbModules.DEBUG && console.log(sql);
            tx.executeSql(sql, [], function(tx, data){
                tx.executeSql("INSERT INTO __sys__ VALUES (?,?,?,?)", [storeName, createOptions.keyPath, !!createOptions.autoIncrement, "{}"], function(){
                    result.__setReadyState("createObjectStore", true);
                    success(result);
                }, error);
            }, error);
        });
        
        // The IndexedDB Specification needs us to return an Object Store immediately, but WebSQL does not create and return the store immediately
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
        var error = function(tx, err){
            throw idbModules.util.createDOMException(0, "Could not delete ObjectStore", err);
        };
        var me = this;
        !me.objectStoreNames.contains(storeName) && error(null, "Object Store does not exist");
        me.objectStoreNames.splice(me.objectStoreNames.indexOf(storeName), 1);
        
        var transaction = me.__versionTransaction;
        idbModules.IDBTransaction.__assertVersionChange(transaction);
        transaction.__addToTransactionQueue(function deleteObjectStore(tx, args, success, failure){
            me.__db.transaction(function(tx){
                tx.executeSql("SELECT * FROM __sys__ where name = ?", [storeName], function(tx, data){
                    if (data.rows.length > 0) {
                        tx.executeSql("DROP TABLE " + idbModules.util.quote(storeName), [], function(){
                            tx.executeSql("DELETE FROM __sys__ WHERE name = ?", [storeName], function(){
                                success();
                            }, error);
                        }, error);
                    }
                });
            });
        });
    };
    
    IDBDatabase.prototype.close = function(){
        this.__closed = true;
    };
    
    IDBDatabase.prototype.transaction = function(storeNames, mode){
        if (this.__closed) {
            throw idbModules.util.createDOMException("InvalidStateError", "An attempt was made to start a new transaction on a database connection that is not open");
        }

        if (typeof mode === "number") {
            mode = mode === 1 ? IDBTransaction.READ_WRITE : IDBTransaction.READ_ONLY;
            idbModules.DEBUG && console.log("Mode should be a string, but was specified as ", mode);
        }
        else {
            mode = mode || IDBTransaction.READ_ONLY;
        }

        if (mode !== IDBTransaction.READ_ONLY && mode !== IDBTransaction.READ_WRITE) {
            throw new TypeError("Invalid transaction mode: " + mode);
        }

        storeNames = typeof storeNames === "string" ? [storeNames] : storeNames;
        if (storeNames.length === 0) {
            throw idbModules.util.createDOMException("InvalidAccessError", "No object store names were specified");
        }
        for (var i = 0; i < storeNames.length; i++) {
            if (!this.objectStoreNames.contains(storeNames[i])) {
                throw idbModules.util.createDOMException("NotFoundError", "The \"" + storeNames[i] + "\" object store does not exist");
            }
        }

        var transaction = new idbModules.IDBTransaction(storeNames, mode, this);
        return transaction;
    };
    
    idbModules.IDBDatabase = IDBDatabase;
}(idbModules));

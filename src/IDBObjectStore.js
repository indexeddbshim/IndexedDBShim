/*jshint globalstrict: true*/
'use strict';
(function(idbModules){

    /**
     * IndexedDB Object Store
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
     * @param {Object} name
     * @param {Object} transaction
     */
    function IDBObjectStore(name, idbTransaction, ready){
        this.name = name;
        this.transaction = idbTransaction;
        this.__ready = {};
        this.__waiting = {};
        this.__setReadyState("createObjectStore", typeof ready === "undefined" ? true : ready);
        this.indexNames = new idbModules.util.StringList();
        var dbProps = idbTransaction.db.__storeProperties;
        if (dbProps[name] && dbProps[name].indexList) {
            var indexes = dbProps[name].indexList;
            for (var indexName in indexes) {
                if(indexes.hasOwnProperty(indexName)) {
                    this.indexNames.push(indexName);
                }
            }
        }
    }
    
    /**
     * Need this flag as createObjectStore is synchronous. So, we simply return when create ObjectStore is called
     * but do the processing in the background. All other operations should wait till ready is set
     * @param {Object} val
     */
    IDBObjectStore.prototype.__setReadyState = function(key, val){
        this.__ready[key] = val;
        this.__runIfReady();
    };

    IDBObjectStore.prototype.__isReady = function(key) {
        if (key === "ALL") {
            for (var x in this.__ready) {
                if (!this.__ready[x]) {
                    return false;
                }
            }
            return true;
        }
        else {
            return (typeof this.__ready[key] === "undefined") ? true : this.__ready[key];
        }
    };
    
    /**
     * Called by all operations on the object store, waits till the store is ready, and then performs the operation
     * @param {Object} callback
     */
    IDBObjectStore.prototype.__waitForReady = function(callback, key) {
        key = key || "ALL";
        if (this.__isReady(key)) {
            callback();
        }
        else {
            this.__waiting[key] = this.__waiting[key] || [];
            this.__waiting[key].push(callback);
        }
    };
        
    /**
     * Performs waiting operations if the object store is ready.
     */
    IDBObjectStore.prototype.__runIfReady = function() {
        for (var key in this.__waiting) {
            if (this.__isReady(key)) {
                var waiting = this.__waiting[key];
                if (waiting && waiting.length > 0) {
                    idbModules.DEBUG && console.log(key + " is ready. Running callbacks.");
                    while (waiting.length > 0) {
                        var callback = waiting.shift();
                        callback();
                    }
                }
            }
            else {
                idbModules.DEBUG && console.log("Waiting for " + key + " to be ready");
            }
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
                idbModules.DEBUG && console.log("Store properties - cached", me.__storeProps);
                callback(me.__storeProps);
            }
            else {
                tx.executeSql("SELECT * FROM __sys__ where name = ?", [me.name], function(tx, data){
                    if (data.rows.length !== 1) {
                        callback();
                    }
                    else {
                        me.__storeProps = {
                            "name": data.rows.item(0).name,
                            "indexList": data.rows.item(0).indexList,
                            "autoInc": data.rows.item(0).autoInc,
                            "keyPath": idbModules.Key.decode(data.rows.item(0).keyPath)
                        };
                        idbModules.DEBUG && console.log("Store properties", me.__storeProps);
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
                    callback(1);
                }
                else {
                    callback(data.rows.item(0).seq);
                }
            }, function(tx, error){
                throw idbModules.util.createDOMException(0, "Data Error", "Could not get the auto increment value for key", error);
            });
        }
        
        var me = this;
        me.__getStoreProps(tx, function(props){
            if (!props) {
                throw idbModules.util.createDOMException(0, "Data Error", "Could not locate defination for this table", props);
            }
            if (props.keyPath) {
                if (typeof key !== "undefined") {
                    throw idbModules.util.createDOMException(0, "Data Error", "The object store uses in-line keys and the key parameter was provided", props);
                }
                if (value) {
                    try {
                        var primaryKey;
                        if(Object.prototype.toString.apply(props.keyPath) === '[object Array]') {
                            primaryKey = [];
                            for (var i = 0; i < props.keyPath.length; i++) {
                                primaryKey.push(eval("value['" + props.keyPath[i] + "']"));
                            }
                        } else {
                            primaryKey = eval("value['" + props.keyPath + "']");
                        }
                        if (primaryKey === undefined) {
                            if (props.autoInc === "true") {
                                getNextAutoIncKey();
                            }
                            else {
                                throw idbModules.util.createDOMException(0, "Data Error", "Could not eval key from keyPath");
                            }
                        }
                        else {
                            callback(primaryKey);
                        }
                    } 
                    catch (e) {
                        throw idbModules.util.createDOMException(0, "Data Error", "Could not eval key from keyPath", e);
                    }
                }
                else {
                    throw idbModules.util.createDOMException(0, "Data Error", "KeyPath was specified, but value was not");
                }
            }
            else {
                if (typeof key !== "undefined") {
                    callback(key);
                }
                else {
                    if (props.autoInc === "false") {
                        throw idbModules.util.createDOMException(0, "Data Error", "The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ", props);
                    }
                    else {
                        // Looks like this has autoInc, so lets get the next in sequence and return that.
                        getNextAutoIncKey();
                    }
                }
            }
        });
    };
    
    IDBObjectStore.prototype.__insertData = function(tx, encoded, value, primaryKey, success, error){
        var paramMap = {};
        if (typeof primaryKey !== "undefined") {
            paramMap.key = idbModules.Key.encode(primaryKey);
        }
        var indexes = JSON.parse(this.__storeProps.indexList);
        for (var key in indexes) {
            try {
                var indexVal;
                if(Object.prototype.toString.apply(indexes[key].keyPath) === '[object Array]') {
                    indexVal = [];
                    for (var i = 0; i < indexes[key].keyPath.length; i++) {
                        indexVal.push(eval("value['" + indexes[key].keyPath[i] + "']"));
                    }
                } else {
                    indexVal = eval("value['" + indexes[key].keyPath + "']");
                }
                paramMap[indexes[key].columnName] = idbModules.Key.encode(indexVal);
            } 
            catch (e) {
                error(e);
            }
        }
        var sqlStart = ["INSERT INTO ", idbModules.util.quote(this.name), "("];
        var sqlEnd = [" VALUES ("];
        var sqlValues = [];
        for (key in paramMap) {
            sqlStart.push(key + ",");
            sqlEnd.push("?,");
            sqlValues.push(paramMap[key]);
        }
        // removing the trailing comma
        sqlStart.push("value )");
        sqlEnd.push("?)");
        sqlValues.push(encoded);
        
        var sql = sqlStart.join(" ") + sqlEnd.join(" ");
        
        idbModules.DEBUG && console.log("SQL for adding", sql, sqlValues);
        tx.executeSql(sql, sqlValues, function(tx, data){
            success(primaryKey);
        }, function(tx, err){
            error(err);
        });
    };
    
    IDBObjectStore.prototype.add = function(value, key){
        var me = this,
            request = me.transaction.__createRequest(function(){}); //Stub request
        idbModules.Sca.encode(value, function(encoded) {
            me.transaction.__pushToQueue(request, function objectStoreAdd(tx, args, success, error){
                me.__deriveKey(tx, value, key, function(primaryKey){
                    me.__insertData(tx, encoded, value, primaryKey, success, error);
                });
            });
        });
        return request;
    };
    
    IDBObjectStore.prototype.put = function(value, key){
        var me = this,
            request = me.transaction.__createRequest(function(){}); //Stub request
        idbModules.Sca.encode(value, function(encoded) {
            me.transaction.__pushToQueue(request, function objectStorePut(tx, args, success, error){
                me.__deriveKey(tx, value, key, function(primaryKey){
                    // First try to delete if the record exists
                    var sql = "DELETE FROM " + idbModules.util.quote(me.name) + " where key = ?";
                    tx.executeSql(sql, [idbModules.Key.encode(primaryKey)], function(tx, data){
                        idbModules.DEBUG && console.log("Did the row with the", primaryKey, "exist? ", data.rowsAffected);
                        me.__insertData(tx, encoded, value, primaryKey, success, error);
                    }, function(tx, err){
                        error(err);
                    });
                });
            });
        });
        return request;
    };
    
    IDBObjectStore.prototype.get = function(key){
        // TODO Key should also be a key range
        var me = this;
        return me.transaction.__addToTransactionQueue(function objectStoreGet(tx, args, success, error){
            me.__waitForReady(function(){
                var primaryKey = idbModules.Key.encode(key);
                idbModules.DEBUG && console.log("Fetching", me.name, primaryKey);
                tx.executeSql("SELECT * FROM " + idbModules.util.quote(me.name) + " where key = ?", [primaryKey], function(tx, data){
                    idbModules.DEBUG && console.log("Fetched data", data);
                    try {
                        // Opera can't deal with the try-catch here.
                        if (0 === data.rows.length) {
                            return success();
                        }
                        
                        success(idbModules.Sca.decode(data.rows.item(0).value));
                    } 
                    catch (e) {
                        idbModules.DEBUG && console.log(e);
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
        return me.transaction.__addToTransactionQueue(function objectStoreDelete(tx, args, success, error){
            me.__waitForReady(function(){
                var primaryKey = idbModules.Key.encode(key);
                idbModules.DEBUG && console.log("Fetching", me.name, primaryKey);
                tx.executeSql("DELETE FROM " + idbModules.util.quote(me.name) + " where key = ?", [primaryKey], function(tx, data){
                    idbModules.DEBUG && console.log("Deleted from database", data.rowsAffected);
                    success();
                }, function(tx, err){
                    error(err);
                });
            });
        });
    };
    
    IDBObjectStore.prototype.clear = function(){
        var me = this;
        return me.transaction.__addToTransactionQueue(function objectStoreClear(tx, args, success, error){
            me.__waitForReady(function(){
                tx.executeSql("DELETE FROM " + idbModules.util.quote(me.name), [], function(tx, data){
                    idbModules.DEBUG && console.log("Cleared all records from database", data.rowsAffected);
                    success();
                }, function(tx, err){
                    error(err);
                });
            });
        });
    };
    
    IDBObjectStore.prototype.count = function(key){
        var me = this;
        return me.transaction.__addToTransactionQueue(function objectStoreCount(tx, args, success, error){
            me.__waitForReady(function(){
                var sql = "SELECT * FROM " + idbModules.util.quote(me.name) + ((typeof key !== "undefined") ? " WHERE key = ?" : "");
                var sqlValues = [];
                (typeof key !== "undefined") && sqlValues.push(idbModules.Key.encode(key));
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
        result.__createIndex(indexName, keyPath, optionalParameters);
        me.indexNames.push(indexName);

        // Also update the db indexList, because after reopening the store, we still want to know this indexName
        var storeProps = me.transaction.db.__storeProperties[me.name];
        storeProps.indexList[indexName] = {
            keyPath: keyPath,
            optionalParams: optionalParameters
        };
        return result;
    };
    
    IDBObjectStore.prototype.deleteIndex = function(indexName){
        var result = new idbModules.IDBIndex(indexName, this, false);
        result.__deleteIndex(indexName);
        return result;
    };
    
    idbModules.IDBObjectStore = IDBObjectStore;
}(idbModules));

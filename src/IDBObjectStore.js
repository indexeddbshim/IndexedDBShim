/*jshint globalstrict: true*/
'use strict';
(function(idbModules) {

    /**
     * IndexedDB Object Store
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
     * @param {IDBObjectStoreProperties} storeProperties
     * @param {IDBTransaction} transaction
     * @constructor
     */
    function IDBObjectStore(storeProperties, transaction) {
        this.name = storeProperties.name;
        this.keyPath = storeProperties.keyPath || null;
        this.autoIncrement = typeof storeProperties.autoInc === "string" ? storeProperties.autoInc === "true" : !!storeProperties.autoInc;
        this.transaction = transaction;

        this.__indexes = {};
        this.indexNames = new idbModules.util.StringList();
        var indexList = typeof storeProperties.indexList === "object" ? storeProperties.indexList : JSON.parse(storeProperties.indexList);
        for (var indexName in indexList) {
            if (indexList.hasOwnProperty(indexName)) {
                var index = new idbModules.IDBIndex(this, indexList[indexName]);
                this.__indexes[index.name] = index;
                this.indexNames.push(index.name);
            }
        }
    }

    /**
     * Clones an IDBObjectStore instance for a different IDBTransaction instance.
     * @param {IDBObjectStore} store
     * @param {IDBTransaction} transaction
     * @protected
     */
    IDBObjectStore.__clone = function(store, transaction) {
        var newStore = new IDBObjectStore({name: store.name, keyPath: store.keyPath, autoInc: store.autoIncrement, indexList: {}}, transaction);
        newStore.__indexes = store.__indexes;
        newStore.indexNames = store.indexNames;
        return newStore;
    };

    /**
     * Creates a new object store in the database.
     * @param {IDBDatabase} db
     * @param {IDBObjectStore} store
     * @protected
     */
    IDBObjectStore.__createObjectStore = function(db, store) {
        // Add the object store to the IDBDatabase
        db.__objectStores[store.name] = store;
        db.objectStoreNames.push(store.name);

        // Add the object store to WebSQL
        var transaction = db.__versionTransaction;
        idbModules.IDBTransaction.__assertVersionChange(transaction);
        transaction.__addToTransactionQueue(function createObjectStore(tx, args, success, failure) {
            function error(tx, err) {
                throw idbModules.util.createDOMException(0, "Could not create object store \"" + store.name + "\"", err);
            }

            //key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
            var sql = ["CREATE TABLE", idbModules.util.quote(store.name), "(key BLOB", store.autoIncrement ? "UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT" : "PRIMARY KEY", ", value BLOB)"].join(" ");
            idbModules.DEBUG && console.log(sql);
            tx.executeSql(sql, [], function(tx, data) {
                tx.executeSql("INSERT INTO __sys__ VALUES (?,?,?,?)", [store.name, store.keyPath, store.autoIncrement, "{}"], function() {
                    success(store);
                }, error);
            }, error);
        });
    };

    /**
     * Deletes an object store from the database.
     * @param {IDBDatabase} db
     * @param {IDBObjectStore} store
     * @protected
     */
    IDBObjectStore.__deleteObjectStore = function(db, store) {
        // Remove the object store from the IDBDatabase
        db.__objectStores[store.name] = undefined;
        db.objectStoreNames.splice(db.objectStoreNames.indexOf(store.name), 1);

        // Remove the object store from WebSQL
        var transaction = db.__versionTransaction;
        idbModules.IDBTransaction.__assertVersionChange(transaction);
        transaction.__addToTransactionQueue(function deleteObjectStore(tx, args, success, failure) {
            function error(tx, err) {
                failure(idbModules.util.createDOMException(0, "Could not delete ObjectStore", err));
            }

            db.__db.transaction(function(tx) {
                tx.executeSql("SELECT * FROM __sys__ where name = ?", [store.name], function(tx, data) {
                    if (data.rows.length > 0) {
                        tx.executeSql("DROP TABLE " + idbModules.util.quote(store.name), [], function() {
                            tx.executeSql("DELETE FROM __sys__ WHERE name = ?", [store.name], function() {
                                success();
                            }, error);
                        }, error);
                    }
                });
            });
        });
    };

    /**
     * Determines whether the given inline or out-of-line key is valid, according to the object store's schema.
     * @param {*} value     Used for inline keys
     * @param {*} key       Used for out-of-line keys
     * @private
     */
    IDBObjectStore.prototype.__validateKey = function(value, key) {
        if (this.keyPath) {
            if (typeof key !== "undefined") {
                throw idbModules.util.createDOMException("DataError", "The object store uses in-line keys and the key parameter was provided", this);
            }
            else if (value && typeof value === "object") {
                key = idbModules.Key.getKeyPath(value, this.keyPath);
                if (key === undefined) {
                    if (this.autoIncrement) {
                        // A key will be generated
                        return;
                    }
                    else {
                        throw idbModules.util.createDOMException("DataError", "Could not eval key from keyPath");
                    }
                }
            }
            else {
                throw idbModules.util.createDOMException("DataError", "KeyPath was specified, but value was not an object");
            }
        }
        else {
            if (typeof key === "undefined") {
                if (this.autoIncrement) {
                    // A key will be generated
                    return;
                }
                else {
                    throw idbModules.util.createDOMException("DataError", "The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ", this);
                }
            }
        }

        idbModules.Key.validateKey(key);
    };

    /**
     * From the store properties and object, extracts the value for the key in hte object Store
     * If the table has auto increment, get the next in sequence
     * @param {Object} tx
     * @param {Object} value
     * @param {Object} key
     * @param {function} success
     * @param {function} failure
     */
    IDBObjectStore.prototype.__deriveKey = function(tx, value, key, success, failure) {
        var me = this;

        function getNextAutoIncKey(callback) {
            tx.executeSql("SELECT * FROM sqlite_sequence where name like ?", [me.name], function(tx, data) {
                if (data.rows.length !== 1) {
                    callback(1);
                }
                else {
                    callback(data.rows.item(0).seq + 1);
                }
            }, function(tx, error) {
                failure(idbModules.util.createDOMException("DataError", "Could not get the auto increment value for key", error));
            });
        }

        if (me.keyPath) {
            var primaryKey = idbModules.Key.getKeyPath(value, me.keyPath);
            if (primaryKey === undefined && me.autoIncrement) {
                getNextAutoIncKey(function(primaryKey) {
                    try {
                        // Update the value with the new key
                        idbModules.Key.setKeyPath(value, me.keyPath, primaryKey);
                        success(primaryKey);
                    }
                    catch (e) {
                        failure(idbModules.util.createDOMException("DataError", "Could not assign a generated value to the keyPath", e));
                    }
                });
            }
            else {
                success(primaryKey);
            }
        }
        else {
            if (typeof key === "undefined" && me.autoIncrement) {
                // Looks like this has autoInc, so lets get the next in sequence and return that.
                getNextAutoIncKey(success);
            }
            else {
                success(key);
            }
        }
    };

    IDBObjectStore.prototype.__insertData = function(tx, encoded, value, primaryKey, success, error) {
        try {
            var paramMap = {};
            if (typeof primaryKey !== "undefined") {
                paramMap.key = idbModules.Key.encodeKey(primaryKey);
            }
            for (var i = 0; i < this.indexNames.length; i++) {
                var index = this.__indexes[this.indexNames[i]];
                paramMap[index.name] = idbModules.Key.encode(idbModules.Key.getKeyPath(value, index.keyPath));
            }
            var sqlStart = ["INSERT INTO ", idbModules.util.quote(this.name), "("];
            var sqlEnd = [" VALUES ("];
            var sqlValues = [];
            for (var key in paramMap) {
                sqlStart.push(idbModules.util.quote(key) + ",");
                sqlEnd.push("?,");
                sqlValues.push(paramMap[key]);
            }
            // removing the trailing comma
            sqlStart.push("value )");
            sqlEnd.push("?)");
            sqlValues.push(encoded);

            var sql = sqlStart.join(" ") + sqlEnd.join(" ");

            idbModules.DEBUG && console.log("SQL for adding", sql, sqlValues);
            tx.executeSql(sql, sqlValues, function(tx, data) {
                idbModules.Sca.encode(primaryKey, function(primaryKey) {
                    primaryKey = idbModules.Sca.decode(primaryKey);
                    success(primaryKey);
                });
            }, function(tx, err) {
                error(idbModules.util.createDOMError("ConstraintError", err.message, err));
            });
        }
        catch (e) {
            error(e);
        }
    };

    IDBObjectStore.prototype.add = function(value, key) {
        var me = this;
        if (arguments.length === 0) {
            throw new TypeError("No value was specified");
        }
        this.__validateKey(value, key);
        me.transaction.__assertWritable();

        var request = me.transaction.__createRequest();
        me.transaction.__pushToQueue(request, function objectStoreAdd(tx, args, success, error) {
            me.__deriveKey(tx, value, key, function(primaryKey) {
                idbModules.Sca.encode(value, function(encoded) {
                    me.__insertData(tx, encoded, value, primaryKey, success, error);
                });
            }, error);
        });
        return request;
    };

    IDBObjectStore.prototype.put = function(value, key) {
        var me = this;
        if (arguments.length === 0) {
            throw new TypeError("No value was specified");
        }
        this.__validateKey(value, key);
        me.transaction.__assertWritable();

        var request = me.transaction.__createRequest();
        me.transaction.__pushToQueue(request, function objectStorePut(tx, args, success, error) {
            me.__deriveKey(tx, value, key, function(primaryKey) {
                idbModules.Sca.encode(value, function(encoded) {
                    // First try to delete if the record exists
                    var sql = "DELETE FROM " + idbModules.util.quote(me.name) + " where key = ?";
                    tx.executeSql(sql, [idbModules.Key.encode(primaryKey)], function(tx, data) {
                        idbModules.DEBUG && console.log("Did the row with the", primaryKey, "exist? ", data.rowsAffected);
                        me.__insertData(tx, encoded, value, primaryKey, success, error);
                    }, function(tx, err) {
                        error(err);
                    });
                });
            }, error);
        });
        return request;
    };

    IDBObjectStore.prototype.get = function(key) {
        // TODO Key should also be a key range
        var me = this;

        if (arguments.length === 0) {
            throw new TypeError("No key was specified");
        }

        var primaryKey = idbModules.Key.encodeKey(key);
        return me.transaction.__addToTransactionQueue(function objectStoreGet(tx, args, success, error) {
            idbModules.DEBUG && console.log("Fetching", me.name, primaryKey);
            tx.executeSql("SELECT * FROM " + idbModules.util.quote(me.name) + " where key = ?", [primaryKey], function(tx, data) {
                idbModules.DEBUG && console.log("Fetched data", data);
                var value;
                try {
                    // Opera can't deal with the try-catch here.
                    if (0 === data.rows.length) {
                        return success();
                    }

                    value = idbModules.Sca.decode(data.rows.item(0).value);
                }
                catch (e) {
                    // If no result is returned, or error occurs when parsing JSON
                    idbModules.DEBUG && console.log(e);
                }
                success(value);
            }, function(tx, err) {
                error(err);
            });
        });
    };

    IDBObjectStore.prototype["delete"] = function(key) {
        var me = this;

        if (arguments.length === 0) {
            throw new TypeError("No key was specified");
        }

        me.transaction.__assertWritable();
        var primaryKey = idbModules.Key.encodeKey(key);
        // TODO key should also support key ranges
        return me.transaction.__addToTransactionQueue(function objectStoreDelete(tx, args, success, error) {
            idbModules.DEBUG && console.log("Fetching", me.name, primaryKey);
            tx.executeSql("DELETE FROM " + idbModules.util.quote(me.name) + " where key = ?", [primaryKey], function(tx, data) {
                idbModules.DEBUG && console.log("Deleted from database", data.rowsAffected);
                success();
            }, function(tx, err) {
                error(err);
            });
        });
    };

    IDBObjectStore.prototype.clear = function() {
        var me = this;
        me.transaction.__assertWritable();
        return me.transaction.__addToTransactionQueue(function objectStoreClear(tx, args, success, error) {
            tx.executeSql("DELETE FROM " + idbModules.util.quote(me.name), [], function(tx, data) {
                idbModules.DEBUG && console.log("Cleared all records from database", data.rowsAffected);
                success();
            }, function(tx, err) {
                error(err);
            });
        });
    };

    IDBObjectStore.prototype.count = function(key) {
        var me = this;
        var hasKey = false;

        // key is optional
        if (arguments.length > 0) {
            hasKey = true;
            key = idbModules.Key.encodeKey(key);
        }

        return me.transaction.__addToTransactionQueue(function objectStoreCount(tx, args, success, error) {
            var sql = "SELECT * FROM " + idbModules.util.quote(me.name) + (hasKey ? " WHERE key = ?" : "");
            var sqlValues = [];
            hasKey && sqlValues.push(key);
            tx.executeSql(sql, sqlValues, function(tx, data) {
                success(data.rows.length);
            }, function(tx, err) {
                error(err);
            });
        });
    };

    IDBObjectStore.prototype.openCursor = function(range, direction) {
        var cursorRequest = new idbModules.IDBRequest();
        var cursor = new idbModules.IDBCursor(range, direction, this, cursorRequest, "key", "value");
        return cursorRequest;
    };

    IDBObjectStore.prototype.index = function(indexName) {
        if (arguments.length === 0) {
            throw new TypeError("No index name was specified");
        }
        var index = this.__indexes[indexName];
        if (!index) {
            throw idbModules.util.createDOMException("NotFoundError", "Index \"" + indexName + "\" does not exist on " + this.name);
        }

        return idbModules.IDBIndex.__clone(index, this);
    };

    /**
     * Creates a new index on the object store.
     * @param {string} indexName
     * @param {string} keyPath
     * @param {object} optionalParameters
     * @returns {IDBIndex}
     */
    IDBObjectStore.prototype.createIndex = function(indexName, keyPath, optionalParameters) {
        if (arguments.length === 0) {
            throw new TypeError("No index name was specified");
        }
        if (arguments.length === 1) {
            throw new TypeError("No key path was specified");
        }
        if (this.__indexes[indexName]) {
            throw idbModules.util.createDOMException("ConstraintError", "Index \"" + indexName + "\" already exists on " + this.name);
        }
        this.transaction.__assertVersionChange();

        optionalParameters = optionalParameters || {};
        /** @name IDBIndexProperties **/
        var indexProperties = {
            columnName: indexName,
            keyPath: keyPath,
            optionalParams: {
                unique: !!optionalParameters.unique,
                multiEntry: !!optionalParameters.multiEntry
            }
        };
        var index = new idbModules.IDBIndex(this, indexProperties);
        idbModules.IDBIndex.__createIndex(this, index);
        return index;
    };

    IDBObjectStore.prototype.deleteIndex = function(indexName) {
        if (arguments.length === 0) {
            throw new TypeError("No index name was specified");
        }
        var index = this.__indexes[indexName];
        if (!index) {
            throw idbModules.util.createDOMException("NotFoundError", "Index \"" + indexName + "\" does not exist on " + this.name);
        }
        this.transaction.__assertVersionChange();

        idbModules.IDBIndex.__deleteIndex(this, index);
    };

    idbModules.IDBObjectStore = IDBObjectStore;
}(idbModules));

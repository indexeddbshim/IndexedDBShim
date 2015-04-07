/*jshint globalstrict: true*/
'use strict';
(function(idbModules, undefined) {
    /**
     * IDB Index
     * http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
     * @param {IDBObjectStore} store
     * @param {IDBIndexProperties} indexProperties
     * @constructor
     */
    function IDBIndex(store, indexProperties) {
        this.objectStore = store;
        this.name = indexProperties.columnName;
        this.keyPath = indexProperties.keyPath;
        this.multiEntry = indexProperties.optionalParams && indexProperties.optionalParams.multiEntry;
        this.unique = indexProperties.optionalParams && indexProperties.optionalParams.unique;
    }

    /**
     * Creates a new index on an object store.
     * @param {IDBObjectStore} store
     * @param {IDBIndex} index
     * @returns {IDBIndex}
     * @protected
     */
    IDBIndex.__createIndex = function(store, index) {
        // Add the index to the IDBObjectStore
        store.__indexes[index.name] = index;
        store.indexNames.push(index.name);

        // Create the index in WebSQL
        var transaction = store.transaction;
        transaction.__addToTransactionQueue(function createIndex(tx, args, success, failure) {
            function error(tx, err) {
                failure(idbModules.util.createDOMException(0, "Could not create index \"" + index.name + "\"", err));
            }

            // For this index, first create a column
            var sql = ["ALTER TABLE", idbModules.util.quote(store.name), "ADD", idbModules.util.quote(index.name), "BLOB"].join(" ");
            idbModules.DEBUG && console.log(sql);
            tx.executeSql(sql, [], function(tx, data) {
                // Once a column is created, put existing records into the index
                tx.executeSql("SELECT * FROM " + idbModules.util.quote(store.name), [], function(tx, data) {
                    idbModules.DEBUG && console.log("Adding existing " + store.name + " records to the " + index.name + " index");
                    initIndexForRow(0);

                    // Adds an existing record to the new index
                    function initIndexForRow(i) {
                        if (i < data.rows.length) {
                            try {
                                var value = idbModules.Sca.decode(data.rows.item(i).value);
                                var indexKey = idbModules.Key.getKeyPath(value, index.keyPath);
                                tx.executeSql("UPDATE " + idbModules.util.quote(store.name) + " set " + idbModules.util.quote(index.name) + " = ? where key = ?", [idbModules.Key.encode(indexKey), data.rows.item(i).key], function(tx, data) {
                                    initIndexForRow(i + 1);
                                }, error);
                            }
                            catch (e) {
                                // Not a valid value to insert into index, so just continue
                                initIndexForRow(i + 1);
                            }
                        }
                        else {
                            updateObjectStoreSchema();
                        }
                    }

                    // Updates the "indexList" column for the object store
                    function updateObjectStoreSchema() {
                        var indexList = {};
                        for (var i = 0; i < store.indexNames.length; i++) {
                            var idx = store.__indexes[store.indexNames[i]];
                            /** @type {IDBIndexProperties} **/
                            indexList[idx.name] = {
                                columnName: idx.name,
                                keyPath: idx.keyPath,
                                optionalParams: {
                                    unique: idx.unique,
                                    multiEntry: idx.multiEntry
                                }
                            };
                        }

                        idbModules.DEBUG && console.log("Updating the index list for " + store.name, indexList);
                        tx.executeSql("UPDATE __sys__ set indexList = ? where name = ?", [JSON.stringify(indexList), store.name], function() {
                            success(index);
                        }, error);
                    }
                }, error);
            }, error);
        });
    };

    /**
     * Deletes an index from an object store.
     * @param {IDBObjectStore} store
     * @param {IDBIndex} index
     * @protected
     */
    IDBIndex.__deleteIndex = function(store, index) {
        // Remove the index from the IDBObjectStore
        store.__indexes[index.name] = undefined;
        store.indexNames.splice(store.indexNames.indexOf(index.name), 1);

        // TODO: Remove the index from WebSQL
    };

    /**
     * Retrieves index data for the given key
     * @param {*|IDBKeyRange} key
     * @param {string} opType
     * @returns {IDBRequest}
     * @private
     */
    IDBIndex.prototype.__fetchIndexData = function(key, opType) {
        var me = this;
        var hasKey;

        // key is optional
        if (arguments.length === 1) {
            opType = key;
            key = undefined;
            hasKey = false;
        }
        else {
            key = idbModules.Key.encodeKey(key);
            hasKey = true;
        }

        return me.objectStore.transaction.__addToTransactionQueue(function fetchIndexData(tx, args, success, error) {
            var sql = ["SELECT * FROM ", idbModules.util.quote(me.objectStore.name), " WHERE", idbModules.util.quote(me.name), "NOT NULL"];
            var sqlValues = [];
            if (hasKey) {
                sql.push("AND", idbModules.util.quote(me.name), " = ?");
                sqlValues.push(key);
            }
            idbModules.DEBUG && console.log("Trying to fetch data for Index", sql.join(" "), sqlValues);
            tx.executeSql(sql.join(" "), sqlValues, function(tx, data) {
                var d;
                if (opType === "count") {
                    d = data.rows.length;
                }
                else if (data.rows.length === 0) {
                    d = undefined;
                }
                else if (opType === "key") {
                    d = idbModules.Key.decode(data.rows.item(0).key);
                }
                else { // when opType is value
                    d = idbModules.Sca.decode(data.rows.item(0).value);
                }
                success(d);
            }, error);
        });
    };

    /**
     * Opens a cursor over the given key range.
     * @param {IDBKeyRange} range
     * @param {string} direction
     * @returns {IDBRequest}
     */
    IDBIndex.prototype.openCursor = function(range, direction) {
        var cursorRequest = new idbModules.IDBRequest();
        var cursor = new idbModules.IDBCursor(range, direction, this.objectStore, cursorRequest, this.name, "value");
        return cursorRequest;
    };

    /**
     * Opens a cursor over the given key range.  The cursor only includes key values, not data.
     * @param {IDBKeyRange} range
     * @param {string} direction
     * @returns {IDBRequest}
     */
    IDBIndex.prototype.openKeyCursor = function(range, direction) {
        var cursorRequest = new idbModules.IDBRequest();
        var cursor = new idbModules.IDBCursor(range, direction, this.objectStore, cursorRequest, this.name, "key");
        return cursorRequest;
    };

    IDBIndex.prototype.get = function(key) {
        if (arguments.length === 0) {
            throw new TypeError("No key was specified");
        }

        return this.__fetchIndexData(key, "value");
    };

    IDBIndex.prototype.getKey = function(key) {
        if (arguments.length === 0) {
            throw new TypeError("No key was specified");
        }

        return this.__fetchIndexData(key, "key");
    };

    IDBIndex.prototype.count = function(key) {
        // key is optional
        if (arguments.length === 0) {
            return this.__fetchIndexData("count");
        }
        else {
            return this.__fetchIndexData(key, "count");
        }
    };

    idbModules.IDBIndex = IDBIndex;
}(idbModules));

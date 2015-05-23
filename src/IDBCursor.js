(function(idbModules, undefined){
    'use strict';

    /**
     * The IndexedDB Cursor Object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
     * @param {IDBKeyRange} range
     * @param {string} direction
     * @param {IDBObjectStore} store
     * @param {IDBObjectStore|IDBIndex} source
     * @param {string} keyColumnName
     * @param {string} valueColumnName
     */
    function IDBCursor(range, direction, store, source, keyColumnName, valueColumnName){
        if (range !== undefined && !(range instanceof idbModules.IDBKeyRange)) {
            range = new idbModules.IDBKeyRange(range, range, false, false);
        }
        store.transaction.__assertActive();
        if (direction !== undefined && ["next", "prev", "nextunique", "prevunique"].indexOf(direction) === -1) {
            throw new TypeError(direction + "is not a valid cursor direction");
        }

        this.source = source;
        this.direction = direction || "next";
        this.key = undefined;
        this.primaryKey = undefined;
        this.__store = store;
        this.__range = range;
        this.__req = new idbModules.IDBRequest();
        this.__keyColumnName = keyColumnName;
        this.__valueColumnName = valueColumnName;
        this.__valueDecoder = valueColumnName === "value" ? idbModules.Sca : idbModules.Key;
        this.__offset = -1; // Setting this to -1 as continue will set it to 0 anyway
        this.__lastKeyContinued = undefined; // Used when continuing with a key
        this.__multiEntryIndex = source instanceof idbModules.IDBIndex ? source.multiEntry : false;
        this.__unique = this.direction.indexOf("unique") !== -1;

        if (range !== undefined) {
            // Encode the key range and cache the encoded values, so we don't have to re-encode them over and over
            range.__lower = range.lower !== undefined && idbModules.Key.encode(range.lower, this.__multiEntryIndex);
            range.__upper = range.upper !== undefined && idbModules.Key.encode(range.upper, this.__multiEntryIndex);
        }

        this["continue"]();
    }

    IDBCursor.prototype.__find = function (/* key, tx, success, error, recordsToLoad */) {
        var args = Array.prototype.slice.call(arguments);
        if (this.__multiEntryIndex) {
            this.__findMultiEntry.apply(this, args);
        } else {
            this.__findBasic.apply(this, args);
        }
    };

    IDBCursor.prototype.__findBasic = function (key, tx, success, error, recordsToLoad) {
        recordsToLoad = recordsToLoad || 1;

        var me = this;
        var quotedKeyColumnName = idbModules.util.quote(me.__keyColumnName);
        var sql = ["SELECT * FROM", idbModules.util.quote(me.__store.name)];
        sql.push("WHERE", quotedKeyColumnName, "NOT NULL");
        var sqlValues = [];
        applyRange(me.__range, quotedKeyColumnName, sql, sqlValues);
        if (typeof key !== "undefined") {
            me.__lastKeyContinued = key;
            me.__offset = 0;
        }
        if (me.__lastKeyContinued !== undefined) {
            sql.push("AND", quotedKeyColumnName, ">= ?");
            idbModules.Key.validate(me.__lastKeyContinued);
            sqlValues.push(idbModules.Key.encode(me.__lastKeyContinued));
        }

        // Determine the ORDER BY direction based on the cursor.
        var direction = me.direction === 'prev' || me.direction === 'prevunique' ? 'DESC' : 'ASC';

        sql.push("ORDER BY", quotedKeyColumnName, direction);
        sql.push("LIMIT", recordsToLoad, "OFFSET", me.__offset);
        sql = sql.join(" ");
        idbModules.DEBUG && console.log(sql, sqlValues);

        me.__prefetchedData = null;
        me.__prefetchedIndex = 0;
        tx.executeSql(sql, sqlValues, function (tx, data) {
            if (data.rows.length > 1) {
                me.__prefetchedData = data.rows;
                me.__prefetchedIndex = 0;
                idbModules.DEBUG && console.log("Preloaded " + me.__prefetchedData.length + " records for cursor");
                me.__decode(data.rows.item(0), success);
            }
            else if (data.rows.length === 1) {
                me.__decode(data.rows.item(0), success);
            }
            else {
                idbModules.DEBUG && console.log("Reached end of cursors");
                success(undefined, undefined, undefined);
            }
        }, function (tx, err) {
            idbModules.DEBUG && console.log("Could not execute Cursor.continue", sql, sqlValues);
            error(err);
        });
    };

    IDBCursor.prototype.__count = function (tx, success, error) {
        var me = this;
        var quotedKeyColumnName = idbModules.util.quote(me.__keyColumnName);
        var sql = ["SELECT COUNT(*) FROM", idbModules.util.quote(me.__store.name)];
        sql.push("WHERE", quotedKeyColumnName, "NOT NULL");
        var sqlValues = [];
        applyRange(me.__range, quotedKeyColumnName, sql, sqlValues);
        sql = sql.join(" ");
        idbModules.DEBUG && console.log(sql, sqlValues);

        tx.executeSql(sql, sqlValues, function (tx, data) {
            if (data.rows.length > 0) {
                var count = data.rows.item(0)['COUNT(*)'];
                success(count);
            }
            else {
                idbModules.DEBUG && console.log("Reached end of cursors");
                success(0);
            }
        }, function (tx, err) {
            idbModules.DEBUG && console.log("Could not execute Cursor.__count", sql, sqlValues);
            error(err);
        });
    };

    IDBCursor.prototype.__findMultiEntry = function (key, tx, success, error, recordsToLoad) {
        recordsToLoad = recordsToLoad || 1;

        if (this.__multiEntryOffset && this.__multiEntryOffset < recordsToLoad) {
            idbModules.DEBUG && console.log("Reached end of cursors");
            success(undefined, undefined, undefined);
            return;
        }

        var me = this;
        var quotedKeyColumnName = idbModules.util.quote(me.__keyColumnName);
        var sql = ["SELECT * FROM", idbModules.util.quote(me.__store.name)];
        var sqlValues = [];
        sql.push("WHERE", quotedKeyColumnName, "NOT NULL");
        if (me.__range && (me.__range.lower !== undefined && me.__range.upper !== undefined)) {
            if (me.__range.upper.indexOf(me.__range.lower) === 0) {
                sql.push("AND", quotedKeyColumnName, "LIKE ?");
                sqlValues.push("%" + me.__range.__lower.slice(0, -1) + "%");
            }
        }
        if (typeof key !== "undefined") {
            me.__lastKeyContinued = key;
            me.__offset = 0;
        }
        if (me.__lastKeyContinued !== undefined) {
            sql.push("AND", quotedKeyColumnName, ">= ?");
            idbModules.Key.validate(me.__lastKeyContinued);
            sqlValues.push(idbModules.Key.encode(me.__lastKeyContinued));
        }

        // Determine the ORDER BY direction based on the cursor.
        var direction = me.direction === 'prev' || me.direction === 'prevunique' ? 'DESC' : 'ASC';

        sql.push("ORDER BY key", direction);
        sql.push("LIMIT", recordsToLoad, "OFFSET", me.__multiEntryOffset || 0);
        sql = sql.join(" ");
        idbModules.DEBUG && console.log(sql, sqlValues);

        me.__prefetchedData = null;
        me.__prefetchedIndex = 0;
        tx.executeSql(sql, sqlValues, function (tx, data) {
            me.__multiEntryOffset = data.rows.length;

            if (data.rows.length > 0) {
                var rows = [];

                for (var i = 0; i < data.rows.length; i++) {
                    var rowItem = data.rows.item(i);
                    var matches = idbModules.Key.findMultiEntryMatches(idbModules.Key.decode(rowItem[me.__keyColumnName], true), me.__range);

                    for (var j = 0; j < matches.length; j++) {
                        var matchingKey = matches[j];
                        var clone = {
                            matchingKey: idbModules.Key.encode(matchingKey, true),
                            key: rowItem.key
                        };
                        clone[me.__keyColumnName] = rowItem[me.__keyColumnName];
                        clone[me.__valueColumnName] = rowItem[me.__valueColumnName];
                        rows.push(clone);
                    }
                }

                var reverse = me.direction.indexOf("prev") === 0;
                rows.sort(function (a, b) {
                    if (a.matchingKey.replace('[','z') < b.matchingKey.replace('[','z')) {
                        return reverse ? 1 : -1;
                    }
                    if (a.matchingKey.replace('[','z') > b.matchingKey.replace('[','z')) {
                        return reverse ? -1 : 1;
                    }
                    if (a.key < b.key) {
                        return me.direction === "prev" ? 1 : -1;
                    }
                    if (a.key > b.key) {
                        return me.direction === "prev" ? -1 : 1;
                    }
                    return 0;
                });

                if (rows.length > 1) {
                    me.__prefetchedData = {
                        data: rows,
                        length: rows.length,
                        item: function (index) {
                            return this.data[index];
                        }
                    };
                    me.__prefetchedIndex = 0;

                    idbModules.DEBUG && console.log("Preloaded " + me.__prefetchedData.length + " records for cursor");
                    me.__decode(rows[0], success);
                } else if (rows.length === 1) {
                    me.__decode(rows[0], success);
                } else {
                    idbModules.DEBUG && console.log("Reached end of cursors");
                    success(undefined, undefined, undefined);
                }
            }
            else {
                idbModules.DEBUG && console.log("Reached end of cursors");
                success(undefined, undefined, undefined);
            }
        }, function (tx, err) {
            idbModules.DEBUG && console.log("Could not execute Cursor.continue", sql, sqlValues);
            error(err);
        });
    };

    /**
     * Creates an "onsuccess" callback
     * @private
     */
    IDBCursor.prototype.__onsuccess = function(success) {
        var me = this;
        return function(key, value, primaryKey) {
            me.key = key === undefined ? null : key;
            me.value = value === undefined ? null : value;
            me.primaryKey = primaryKey === undefined ? null : primaryKey;
            success(key === undefined ? null : me, me.__req);
        };
    };

    IDBCursor.prototype.__decode = function (rowItem, callback) {
        if (this.__multiEntryIndex && this.__unique) {
            if (!this.__matchedKeys) {
                this.__matchedKeys = {};
            }
            if (this.__matchedKeys[rowItem.matchingKey]) {
                callback(undefined, undefined, undefined);
                return;
            }
            this.__matchedKeys[rowItem.matchingKey] = true;
        }
        var key = idbModules.Key.decode(this.__multiEntryIndex ? rowItem.matchingKey : rowItem[this.__keyColumnName], this.__multiEntryIndex);
        var val = this.__valueDecoder.decode(rowItem[this.__valueColumnName]);
        var primaryKey = idbModules.Key.decode(rowItem.key);
        callback(key, val, primaryKey);
    };

    IDBCursor.prototype["continue"] = function (key) {
        var recordsToPreloadOnContinue = idbModules.cursorPreloadPackSize || 100;
        var me = this;

        this.__store.transaction.__pushToQueue(me.__req, function cursorContinue(tx, args, success, error) {
            me.__offset++;

            if (me.__prefetchedData) {
                // We have pre-loaded data for the cursor
                me.__prefetchedIndex++;
                if (me.__prefetchedIndex < me.__prefetchedData.length) {
                    me.__decode(me.__prefetchedData.item(me.__prefetchedIndex), me.__onsuccess(success));
                    return;
                }
            }

            // No pre-fetched data, do query
            me.__find(key, tx, me.__onsuccess(success), error, recordsToPreloadOnContinue);
        });
    };

    IDBCursor.prototype.advance = function(count){
        if (count <= 0) {
            throw idbModules.util.createDOMException("Type Error", "Count is invalid - 0 or negative", count);
        }
        var me = this;
        this.__store.transaction.__pushToQueue(me.__req, function cursorAdvance(tx, args, success, error){
            me.__offset += count;
            me.__find(undefined, tx, me.__onsuccess(success), error);
        });
    };

    IDBCursor.prototype.update = function(valueToUpdate){
        var me = this;
        me.__store.transaction.__assertWritable();
        return me.__store.transaction.__addToTransactionQueue(function cursorUpdate(tx, args, success, error){
            idbModules.Sca.encode(valueToUpdate, function(encoded) {
                me.__find(undefined, tx, function(key, value, primaryKey){
                    var store = me.__store;
                    var params = [encoded];
                    var sql = ["UPDATE", idbModules.util.quote(store.name), "SET value = ?"];
                    idbModules.Key.validate(primaryKey);

                    // Also correct the indexes in the table
                    for (var i = 0; i < store.indexNames.length; i++) {
                        var index = store.__indexes[store.indexNames[i]];
                        var indexKey = idbModules.Key.getValue(valueToUpdate, index.keyPath);
                        sql.push(",", idbModules.util.quote(index.name), "= ?");
                        params.push(idbModules.Key.encode(indexKey, index.multiEntry));
                    }

                    sql.push("WHERE key = ?");
                    params.push(idbModules.Key.encode(primaryKey));

                    idbModules.DEBUG && console.log(sql.join(" "), encoded, key, primaryKey);
                    tx.executeSql(sql.join(" "), params, function(tx, data){
                        me.__prefetchedData = null;
                        me.__prefetchedIndex = 0;
                        if (data.rowsAffected === 1) {
                            success(key);
                        }
                        else {
                            error("No rows with key found" + key);
                        }
                    }, function(tx, data){
                        error(data);
                    });
                }, error);
            });
        });
    };

    IDBCursor.prototype["delete"] = function(){
        var me = this;
        me.__store.transaction.__assertWritable();
        return this.__store.transaction.__addToTransactionQueue(function cursorDelete(tx, args, success, error){
            me.__find(undefined, tx, function(key, value, primaryKey){
                var sql = "DELETE FROM  " + idbModules.util.quote(me.__store.name) + " WHERE key = ?";
                idbModules.DEBUG && console.log(sql, key, primaryKey);
                idbModules.Key.validate(primaryKey);
                tx.executeSql(sql, [idbModules.Key.encode(primaryKey)], function(tx, data){
                    me.__prefetchedData = null;
                    me.__prefetchedIndex = 0;
                    if (data.rowsAffected === 1) {
                        // lower the offset or we will miss a row
                        me.__offset--;
                        success(undefined);
                    }
                    else {
                        error("No rows with key found" + key);
                    }
                }, function(tx, data){
                    error(data);
                });
            }, error);
        });
    };

    function applyRange(range, quotedKeyColumnName, sql, sqlValues) {
        if (range && (range.lower !== undefined || range.upper !== undefined )) {
            sql.push("AND");
            if (range.lower !== undefined) {
                sql.push(quotedKeyColumnName, (range.lowerOpen ? ">" : ">="), "?");
                sqlValues.push(range.__lower);
            }
            (range.lower !== undefined && range.upper !== undefined) && sql.push("AND");
            if (range.upper !== undefined) {
                sql.push(quotedKeyColumnName, (range.upperOpen ? "<" : "<="), "?");
                sqlValues.push(range.__upper);
            }
        }
    }

    idbModules.IDBCursor = IDBCursor;
}(idbModules));

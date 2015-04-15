/*jshint globalstrict: true*/
'use strict';
(function(idbModules, undefined){
    /**
     * The IndexedDB Cursor Object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
     * @param {IDBKeyRange} range
     * @param {string} direction
     * @param {IDBObjectStore} store
     * @param {IDBRequest} cursorRequest
     */
    function IDBCursor(range, direction, store, cursorRequest, keyColumnName, valueColumnName){
        if (range && !(range instanceof idbModules.IDBKeyRange)) {
            range = new idbModules.IDBKeyRange(range, range, false, false);
        }
        this.__range = range;
        this.__req = cursorRequest;

        this.source = store;
        this.key = undefined;
        this.direction = direction;

        this.__keyColumnName = keyColumnName;
        this.__valueColumnName = valueColumnName;
        this.__valueDecoder = valueColumnName === "value" ? idbModules.Sca : idbModules.Key;

        if (!this.source.transaction.__active) {
            throw idbModules.util.createDOMException("TransactionInactiveError", "The transaction this IDBObjectStore belongs to is not active.");
        }
        // Setting this to -1 as continue will set it to 0 anyway
        this.__offset = -1;

        this.__lastKeyContinued = undefined; // Used when continuing with a key

        this["continue"]();
    }

    IDBCursor.prototype.__find = function (key, tx, success, error, recordsToLoad) {
        recordsToLoad = recordsToLoad || 1;

        var me = this;
        var quotedKeyColumnName = idbModules.util.quote(me.__keyColumnName);
        var sql = ["SELECT * FROM", idbModules.util.quote(me.source.name)];
        var sqlValues = [];
        sql.push("WHERE", quotedKeyColumnName, "NOT NULL");
        if (me.__range && (me.__range.lower !== undefined || me.__range.upper !== undefined )) {
            sql.push("AND");
            if (me.__range.lower !== undefined) {
                sql.push(quotedKeyColumnName, (me.__range.lowerOpen ? ">" : ">="), "?");
                idbModules.Key.validate(me.__range.lower);
                sqlValues.push(idbModules.Key.encode(me.__range.lower));
            }
            (me.__range.lower !== undefined && me.__range.upper !== undefined) && sql.push("AND");
            if (me.__range.upper !== undefined) {
                sql.push(quotedKeyColumnName, (me.__range.upperOpen ? "<" : "<="), "?");
                idbModules.Key.validate(me.__range.upper);
                sqlValues.push(idbModules.Key.encode(me.__range.upper));
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

        sql.push("ORDER BY", quotedKeyColumnName, direction);
        sql.push("LIMIT", recordsToLoad, "OFFSET", me.__offset);
        idbModules.DEBUG && console.log(sql.join(" "), sqlValues);

        me.__prefetchedData = null;
        tx.executeSql(sql.join(" "), sqlValues, function (tx, data) {

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
                success(undefined, undefined);
            }
        }, function (tx, data) {
            idbModules.DEBUG && console.log("Could not execute Cursor.continue");
            error(data);
        });
    };

    IDBCursor.prototype.__decode = function (rowItem, callback) {
        var key = idbModules.Key.decode(rowItem[this.__keyColumnName]);
        var val = this.__valueDecoder.decode(rowItem[this.__valueColumnName]);
        var primaryKey = idbModules.Key.decode(rowItem.key);
        callback(key, val, primaryKey);
    };

    IDBCursor.prototype["continue"] = function (key) {
        var recordsToPreloadOnContinue = idbModules.cursorPreloadPackSize || 100;
        var me = this;

        this.source.transaction.__addToTransactionQueue(function cursorContinue(tx, args, success, error) {

            me.__offset++;

            var successCallback = function(key, val, primaryKey) {
                me.key = key;
                me.value = val;
                me.primaryKey = primaryKey;
                success(typeof me.key !== "undefined" ? me : undefined, me.__req);
            };

            if (me.__prefetchedData) {
                // We have pre-loaded data for the cursor
                me.__prefetchedIndex++;
                if (me.__prefetchedIndex < me.__prefetchedData.length) {
                    me.__decode(me.__prefetchedData.item(me.__prefetchedIndex), successCallback);
                    return;
                }
            }
            // No pre-fetched data, do query
            me.__find(key, tx, successCallback, error, recordsToPreloadOnContinue);

        });
    };

    IDBCursor.prototype.advance = function(count){
        if (count <= 0) {
            throw idbModules.util.createDOMException("Type Error", "Count is invalid - 0 or negative", count);
        }
        var me = this;
        this.source.transaction.__addToTransactionQueue(function cursorAdvance(tx, args, success, error){
            me.__offset += count;
            me.__find(undefined, tx, function(key, value){
                me.key = key;
                me.value = value;
                success(typeof me.key !== "undefined" ? me : undefined, me.__req);
            }, error);
        });
    };

    IDBCursor.prototype.update = function(valueToUpdate){
        var me = this;
        me.source.transaction.__assertWritable();
        var request = this.source.transaction.__createRequest();
        idbModules.Sca.encode(valueToUpdate, function(encoded) {
            me.source.transaction.__pushToQueue(request, function cursorUpdate(tx, args, success, error){
                me.__find(undefined, tx, function(key, value, primaryKey){
                    var store = me.source;
                    var params = [encoded];
                    var sql = "UPDATE " + idbModules.util.quote(store.name) + " SET value = ?";
                    idbModules.Key.validate(primaryKey);

                    // Also correct the indexes in the table
                    for (var i = 0; i < store.indexNames.length; i++) {
                        var index = store.__indexes[store.indexNames[i]];
                        var indexKey = idbModules.Key.getValue(valueToUpdate, index.keyPath);
                        sql += ", " + index.name + " = ?";
                        params.push(idbModules.Key.encode(indexKey, index.multiEntry));
                    }

                    sql += " WHERE key = ?";
                    params.push(idbModules.Key.encode(primaryKey));

                    idbModules.DEBUG && console.log(sql, encoded, key, primaryKey);
                    tx.executeSql(sql, params, function(tx, data){
                        me.__prefetchedData = null;
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
        return request;
    };

    IDBCursor.prototype["delete"] = function(){
        var me = this;
        me.source.transaction.__assertWritable();
        return this.source.transaction.__addToTransactionQueue(function cursorDelete(tx, args, success, error){
            me.__find(undefined, tx, function(key, value, primaryKey){
                var sql = "DELETE FROM  " + idbModules.util.quote(me.source.name) + " WHERE key = ?";
                idbModules.DEBUG && console.log(sql, key, primaryKey);
                idbModules.Key.validate(primaryKey);
                tx.executeSql(sql, [idbModules.Key.encode(primaryKey)], function(tx, data){
                    me.__prefetchedData = null;
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

    idbModules.IDBCursor = IDBCursor;
}(idbModules));

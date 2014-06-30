/*jshint globalstrict: true*/
'use strict';
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
        this.__valueDecoder = valueColumnName === "value" ? idbModules.Sca : idbModules.Key;

        if (!this.source.transaction.__active) {
            idbModules.util.throwDOMException("TransactionInactiveError - The transaction this IDBObjectStore belongs to is not active.");
        }
        // Setting this to -1 as continue will set it to 0 anyway
        this.__offset = -1;

        this.__lastKeyContinued = undefined; // Used when continuing with a key

        this["continue"]();
    }

    IDBCursor.prototype.__find = function (key, tx, success, error, recordsToLoad) {
        recordsToLoad = recordsToLoad || 1;

        var me = this;
        var sql = ["SELECT * FROM ", idbModules.util.quote(me.__idbObjectStore.name)];
        var sqlValues = [];
        sql.push("WHERE ", me.__keyColumnName, " NOT NULL");
        if (me.__range && (me.__range.lower || me.__range.upper)) {
            sql.push("AND");
            if (me.__range.lower) {
                sql.push(me.__keyColumnName + (me.__range.lowerOpen ? " >" : " >= ") + " ?");
                sqlValues.push(idbModules.Key.encode(me.__range.lower));
            }
            (me.__range.lower && me.__range.upper) && sql.push("AND");
            if (me.__range.upper) {
                sql.push(me.__keyColumnName + (me.__range.upperOpen ? " < " : " <= ") + " ?");
                sqlValues.push(idbModules.Key.encode(me.__range.upper));
            }
        }
        if (typeof key !== "undefined") {
            me.__lastKeyContinued = key;
            me.__offset = 0;
        }
        if (me.__lastKeyContinued !== undefined) {
            sql.push("AND " + me.__keyColumnName + " >= ?");
            sqlValues.push(idbModules.Key.encode(me.__lastKeyContinued));
        }
        sql.push("ORDER BY ", me.__keyColumnName);
        sql.push("LIMIT " + recordsToLoad + " OFFSET " + me.__offset);
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

        this.__idbObjectStore.transaction.__addToTransactionQueue(function (tx, args, success, error) {

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
            idbModules.util.throwDOMException("Type Error - Count is invalid - 0 or negative", count);
        }
        var me = this;
        this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__offset += count;
            me.__find(undefined, tx, function(key, value){
                me.key = key;
                me.value = value;
                success(typeof me.key !== "undefined" ? me : undefined, me.__req);
            }, error);
        });
    };

    IDBCursor.prototype.update = function(valueToUpdate){
        var me = this,
                request = this.__idbObjectStore.transaction.__createRequest(function(){}); //Stub request
        idbModules.Sca.encode(valueToUpdate, function(encoded) {
            me.__idbObjectStore.transaction.__pushToQueue(request, function(tx, args, success, error){
                me.__find(undefined, tx, function(key, value, primaryKey){
                    var sql = "UPDATE " + idbModules.util.quote(me.__idbObjectStore.name) + " SET value = ? WHERE key = ?";
                    idbModules.DEBUG && console.log(sql, encoded, key, primaryKey);
                    tx.executeSql(sql, [encoded, idbModules.Key.encode(primaryKey)], function(tx, data){
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
        return this.__idbObjectStore.transaction.__addToTransactionQueue(function(tx, args, success, error){
            me.__find(undefined, tx, function(key, value, primaryKey){
                var sql = "DELETE FROM  " + idbModules.util.quote(me.__idbObjectStore.name) + " WHERE key = ?";
                idbModules.DEBUG && console.log(sql, key, primaryKey);
                tx.executeSql(sql, [idbModules.Key.encode(primaryKey)], function(tx, data){
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

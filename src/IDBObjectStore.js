import {createDOMException} from './DOMException';
import {IDBCursor, IDBCursorWithValue} from './IDBCursor';
import {setSQLForRange, IDBKeyRange} from './IDBKeyRange';
import DOMStringList from './DOMStringList';
import * as util from './util';
import Key from './Key';
import {executeFetchIndexData, fetchIndexData, IDBIndex} from './IDBIndex';
import IDBTransaction from './IDBTransaction';
import Sca from './Sca';
import CFG from './CFG';
import SyncPromise from 'sync-promise';

const readonlyProperties = ['keyPath', 'indexNames', 'transaction', 'autoIncrement'];

/**
 * IndexedDB Object Store
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
 * @param {IDBObjectStoreProperties} storeProperties
 * @param {IDBTransaction} transaction
 * @constructor
 */
function IDBObjectStore () {
    throw new TypeError('Illegal constructor');
}
const IDBObjectStoreAlias = IDBObjectStore;
IDBObjectStore.__createInstance = function (storeProperties, transaction) {
    function IDBObjectStore () {
        const me = this;
        me[Symbol.toStringTag] = 'IDBObjectStore';
        util.defineReadonlyProperties(this, readonlyProperties);
        me.__name = me.__originalName = storeProperties.name;
        me.__keyPath = Array.isArray(storeProperties.keyPath) ? storeProperties.keyPath.slice() : storeProperties.keyPath;
        me.__transaction = transaction;
        me.__idbdb = storeProperties.idbdb;
        me.__cursors = storeProperties.cursors || [];

        // autoInc is numeric (0/1) on WinPhone
        me.__autoIncrement = !!storeProperties.autoInc;

        me.__indexes = {};
        me.__indexNames = DOMStringList.__createInstance();
        const indexList = storeProperties.indexList;
        for (const indexName in indexList) {
            if (indexList.hasOwnProperty(indexName)) {
                const index = IDBIndex.__createInstance(me, indexList[indexName]);
                me.__indexes[index.name] = index;
                if (!index.__deleted) {
                    me.indexNames.push(index.name);
                }
            }
        }
        me.__oldIndexNames = me.indexNames.clone();
        Object.defineProperty(this, 'name', {
            enumerable: false,
            configurable: false,
            get: function () {
                return this.__name;
            },
            set: function (name) {
                const me = this;
                if (me.__deleted) {
                    throw createDOMException('InvalidStateError', 'This store has been deleted');
                }
                IDBTransaction.__assertVersionChange(me.transaction);
                IDBTransaction.__assertActive(me.transaction);
                if (me.name === name) {
                    return;
                }
                if (me.__idbdb.__objectStores[name]) {
                    throw createDOMException('ConstraintError', 'Object store "' + name + '" already exists in ' + me.__idbdb.name);
                }

                delete me.__idbdb.__objectStores[me.name];
                me.__idbdb.objectStoreNames.splice(me.__idbdb.objectStoreNames.indexOf(me.name), 1);
                me.__idbdb.__objectStores[name] = me;
                me.__idbdb.objectStoreNames.push(name);
                me.__name = name;
                // Todo: Add pending flag to delay queries against this store until renamed in SQLite

                const sql = 'ALTER TABLE ' + util.escapeStoreNameForSQL(me.name) + ' RENAME TO ' + util.escapeStoreNameForSQL(name);
                me.transaction.__addNonRequestToTransactionQueue(function objectStoreClear (tx, args, success, error) {
                    tx.executeSql(sql, [], function (tx, data) {
                        success();
                    }, function (tx, err) {
                        error(err);
                    });
                });
            }
        });
    }
    IDBObjectStore.prototype = IDBObjectStoreAlias.prototype;
    return new IDBObjectStore();
};

/**
 * Clones an IDBObjectStore instance for a different IDBTransaction instance.
 * @param {IDBObjectStore} store
 * @param {IDBTransaction} transaction
 * @protected
 */
IDBObjectStore.__clone = function (store, transaction) {
    const newStore = IDBObjectStore.__createInstance({
        name: store.name,
        keyPath: Array.isArray(store.keyPath) ? store.keyPath.slice() : store.keyPath,
        autoInc: store.autoIncrement,
        indexList: {},
        idbdb: store.__idbdb,
        cursors: store.__cursors
    }, transaction);

    newStore.__indexes = store.__indexes;
    newStore.__indexNames = store.indexNames;
    newStore.__oldIndexNames = store.__oldIndexNames;
    return newStore;
};

/**
 * Creates a new object store in the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 */
IDBObjectStore.__createObjectStore = function (db, store) {
    // Add the object store to the IDBDatabase
    db.__objectStores[store.name] = store;
    db.objectStoreNames.push(store.name);

    // Add the object store to WebSQL
    const transaction = db.__versionTransaction;
    IDBTransaction.__assertVersionChange(transaction);

    transaction.__addNonRequestToTransactionQueue(function createObjectStore (tx, args, success, failure) {
        function error (tx, err) {
            CFG.DEBUG && console.log(err);
            failure(createDOMException('UnknownError', 'Could not create object store "' + store.name + '"', err));
        }

        // key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
        const sql = ['CREATE TABLE', util.escapeStoreNameForSQL(store.name), '(key BLOB', store.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY', ', value BLOB)'].join(' ');
        CFG.DEBUG && console.log(sql);
        tx.executeSql(sql, [], function (tx, data) {
            Sca.encode(store.keyPath, function (encodedKeyPath) {
                tx.executeSql('INSERT INTO __sys__ VALUES (?,?,?,?,?)', [util.escapeSQLiteStatement(store.name), encodedKeyPath, store.autoIncrement, '{}', 1], function () {
                    success(store);
                }, error);
            });
        }, error);
    });
};

/**
 * Deletes an object store from the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 */
IDBObjectStore.__deleteObjectStore = function (db, store) {
    // Remove the object store from the IDBDatabase
    store.__deleted = true;
    db.__objectStores[store.name] = undefined;
    db.objectStoreNames.splice(db.objectStoreNames.indexOf(store.name), 1);

    const storeClone = db.__versionTransaction.__storeClones[store.name];
    if (storeClone) {
        storeClone.__indexNames = DOMStringList.__createInstance();
        storeClone.__indexes = {};
        storeClone.__deleted = true;
    }

    // Remove the object store from WebSQL
    const transaction = db.__versionTransaction;
    IDBTransaction.__assertVersionChange(transaction);

    transaction.__addNonRequestToTransactionQueue(function deleteObjectStore (tx, args, success, failure) {
        function error (tx, err) {
            CFG.DEBUG && console.log(err);
            failure(createDOMException('UnknownError', 'Could not delete ObjectStore', err));
        }

        tx.executeSql('SELECT "name", "keyPath", "autoInc", "indexList", "currNum" FROM __sys__ WHERE name = ?', [util.escapeSQLiteStatement(store.name)], function (tx, data) {
            if (data.rows.length > 0) {
                tx.executeSql('DROP TABLE ' + util.escapeStoreNameForSQL(store.name), [], function () {
                    tx.executeSql('DELETE FROM __sys__ WHERE name = ?', [util.escapeSQLiteStatement(store.name)], function () {
                        success();
                    }, error);
                }, error);
            }
        });
    });
};

/**
 * Determines whether the given inline or out-of-line key is valid, according to the object store's schema.
 * @param {*} value     Used for inline keys
 * @param {*} key       Used for out-of-line keys
 * @private
 */
IDBObjectStore.prototype.__validateKeyAndValue = function (value, key) {
    const me = this;
    if (me.keyPath !== null) {
        if (key !== undefined) {
            throw createDOMException('DataError', 'The object store uses in-line keys and the key parameter was provided', me);
        }
        util.throwIfNotClonable(value, 'The data to be stored could not be cloned by the internal structured cloning algorithm.');
        key = Key.evaluateKeyPathOnValue(value, me.keyPath);
        if (key === undefined) {
            if (me.autoIncrement) {
                // Todo: Check whether this next check is a problem coming from `IDBCursor.update()`
                if (!util.isObj(value)) { // Although steps for storing will detect this, we want to throw synchronously for `add`/`put`
                    throw createDOMException('DataError', 'KeyPath was specified, but value was not an object');
                }
                // A key will be generated
                return undefined;
            }
            throw createDOMException('DataError', 'Could not evaluate a key from keyPath');
        }
        Key.convertValueToKey(key);
    } else {
        if (key === undefined) {
            if (me.autoIncrement) {
                // A key will be generated
                return undefined;
            }
            throw createDOMException('DataError', 'The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ', me);
        }
        Key.convertValueToKey(key);
        util.throwIfNotClonable(value, 'The data to be stored could not be cloned by the internal structured cloning algorithm.');
    }

    return key;
};

/**
 * From the store properties and object, extracts the value for the key in the object store
 * If the table has auto increment, get the current number (unless it has a keyPath leading to a
 *  valid but non-numeric or < 1 key)
 * @param {Object} tx
 * @param {Object} value
 * @param {Object} key
 * @param {function} success
 * @param {function} failure
 */
IDBObjectStore.prototype.__deriveKey = function (tx, value, key, success, failure) {
    const me = this;

    function getCurrentNumber (callback) {
        tx.executeSql('SELECT currNum FROM __sys__ WHERE name = ?', [util.escapeSQLiteStatement(me.name)], function (tx, data) {
            if (data.rows.length !== 1) {
                callback(1);
            } else {
                callback(data.rows.item(0).currNum);
            }
        }, function (tx, error) {
            failure(createDOMException('DataError', 'Could not get the auto increment value for key', error));
        });
    }

    // This variable determines against which key comparisons should be made
    //   when determining whether to update the current number
    let keyToCheck = key;
    const hasKeyPath = me.keyPath !== null;
    if (hasKeyPath) {
        keyToCheck = Key.evaluateKeyPathOnValue(value, me.keyPath);
    }
    // If auto-increment and no valid primaryKey found on the keyPath, get and set the new value, and use
    if (me.autoIncrement && keyToCheck === undefined) {
        getCurrentNumber(function (cn) {
            if (hasKeyPath) {
                try {
                    // Update the value with the new key
                    Key.setValue(value, me.keyPath, cn);
                } catch (e) {
                    failure(createDOMException('DataError', 'Could not assign a generated value to the keyPath', e));
                }
            }
            success(cn);
        });
    // If auto-increment and the keyPath item is a valid numeric key, get the old auto-increment to compare if the new is higher
    //  to determine which to use and whether to update the current number
    } else if (me.autoIncrement && Number.isFinite(keyToCheck) && keyToCheck >= 1) {
        getCurrentNumber(function (cn) {
            const useNewForAutoInc = keyToCheck >= cn;
            success(keyToCheck, useNewForAutoInc);
        });
    // Not auto-increment or auto-increment with a bad (non-numeric or < 1) keyPath key
    } else {
        success(keyToCheck);
    }
};

IDBObjectStore.prototype.__insertData = function (tx, encoded, value, primaryKey, passedKey, useNewForAutoInc, success, error) {
    const me = this;
    const paramMap = {};
    const indexPromises = me.indexNames.map((indexName) => {
        // While this may sometimes resolve sync and sometimes async, the
        //   idea is to avoid, where possible, unnecessary delays (and
        //   consuming code ought to only see a difference in the browser
        //   where we can't control the transaction timeout anyways).
        return new SyncPromise((resolve, reject) => {
            const index = me.__indexes[indexName];
            if (index.__pending) {
                resolve();
                return;
            }
            let indexKey;
            try {
                indexKey = Key.extractKeyFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Add as necessary to this and skip past this index if exceptions here)
            } catch (err) {
                resolve();
                return;
            }
            function setIndexInfo (index) {
                if (indexKey === undefined) {
                    return;
                }
                paramMap[index.name] = Key.encode(indexKey, index.multiEntry);
            }
            if (index.unique) {
                const multiCheck = index.multiEntry && Array.isArray(indexKey);
                const fetchArgs = fetchIndexData(index, true, indexKey, 'key', multiCheck);
                executeFetchIndexData(true, null, ...fetchArgs, tx, null, function success (key) {
                    if (key === undefined) {
                        setIndexInfo(index);
                        resolve();
                        return;
                    }
                    reject(createDOMException(
                        'ConstraintError',
                        'Index already contains a record equal to ' +
                            (multiCheck ? 'one of the subkeys of' : '') +
                            '`indexKey`'
                    ));
                }, reject);
            } else {
                setIndexInfo(index);
                resolve();
            }
        });
    });
    SyncPromise.all(indexPromises).then(() => {
        const sqlStart = ['INSERT INTO ', util.escapeStoreNameForSQL(me.name), '('];
        const sqlEnd = [' VALUES ('];
        const insertSqlValues = [];
        if (primaryKey !== undefined) {
            Key.convertValueToKey(primaryKey);
            sqlStart.push(util.quote('key'), ',');
            sqlEnd.push('?,');
            insertSqlValues.push(util.escapeSQLiteStatement(Key.encode(primaryKey)));
        }
        for (const key in paramMap) {
            sqlStart.push(util.escapeIndexNameForSQL(key) + ',');
            sqlEnd.push('?,');
            insertSqlValues.push(util.escapeSQLiteStatement(paramMap[key]));
        }
        // removing the trailing comma
        sqlStart.push(util.quote('value') + ' )');
        sqlEnd.push('?)');
        insertSqlValues.push(util.escapeSQLiteStatement(encoded));

        const insertSql = sqlStart.join(' ') + sqlEnd.join(' ');
        CFG.DEBUG && console.log('SQL for adding', insertSql, insertSqlValues);

        const insert = function (result) {
            let cb;
            if (typeof result === 'function') {
                cb = result;
                result = undefined;
            }
            tx.executeSql(insertSql, insertSqlValues, function (tx, data) {
                if (cb) {
                    cb();
                } else success(result);
            }, function (tx, err) {
                error(createDOMException('ConstraintError', err.message, err));
            });
        };

        // Need for a clone here?
        Sca.encode(primaryKey, function (primaryKey) {
            primaryKey = Sca.decode(primaryKey);
            if (!me.autoIncrement) {
                insert(primaryKey);
                return;
            }

            // Bump up the auto-inc counter if the key path-resolved value is valid (greater than old value and >=1) OR
            //  if a manually passed in key is valid (numeric and >= 1) and >= any primaryKey
            // Todo: If primaryKey is not a number, we should be checking the value of any previous "current number" and compare with that
            if (useNewForAutoInc) {
                insert(function () {
                    const sql = 'UPDATE __sys__ SET currNum = ? WHERE name = ?';
                    const sqlValues = [
                        Math.floor(primaryKey) + 1, util.escapeSQLiteStatement(me.name)
                    ];
                    CFG.DEBUG && console.log(sql, sqlValues);
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        success(primaryKey);
                    }, function (tx, err) {
                        error(createDOMException('UnknownError', 'Could not set the auto increment value for key', err));
                    });
                });
            // If the key path-resolved value is invalid (not numeric or < 1) or
            //    if a manually passed in key is invalid (non-numeric or < 1),
            //    then we don't need to modify the current number
            } else if (useNewForAutoInc === false || !Number.isFinite(primaryKey) || primaryKey < 1) {
                insert(primaryKey);
            // Increment current number by 1 (we cannot leverage SQLite's
            //  autoincrement (and decrement when not needed), as decrementing
            //  will be overwritten/ignored upon the next insert)
            } else {
                insert(function () {
                    const sql = 'UPDATE __sys__ SET currNum = currNum + 1 WHERE name = ?';
                    const sqlValues = [util.escapeSQLiteStatement(me.name)];
                    CFG.DEBUG && console.log(sql, sqlValues);
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        success(primaryKey);
                    }, function (tx, err) {
                        error(createDOMException('UnknownError', 'Could not set the auto increment value for key', err));
                    });
                });
            }
        });
    }).catch(function (err) {
        error(err);
    });
};

IDBObjectStore.prototype.add = function (value /* , key */) {
    const me = this;
    const key = arguments[1];
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction.__assertActive(me.transaction);
    me.transaction.__assertWritable();
    this.__validateKeyAndValue(value, key);

    const request = me.transaction.__createRequest(me);
    me.transaction.__pushToQueue(request, function objectStoreAdd (tx, args, success, error) {
        Sca.encode(value, function (encoded) {
            value = Sca.decode(encoded);
            me.__deriveKey(tx, value, key, function (primaryKey, useNewForAutoInc) {
                Sca.encode(value, function (encoded) {
                    me.__insertData(tx, encoded, value, primaryKey, key, useNewForAutoInc, function (...args) {
                        me.__cursors.forEach((cursor) => {
                            cursor.__invalidateCache(); // Add
                        });
                        success(...args);
                    }, error);
                });
            }, error);
        });
    });
    return request;
};

IDBObjectStore.prototype.put = function (value /*, key */) {
    const me = this;
    const key = arguments[1];
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction.__assertActive(me.transaction);
    me.transaction.__assertWritable();
    me.__validateKeyAndValue(value, key);

    const request = me.transaction.__createRequest(me);
    me.transaction.__pushToQueue(request, function objectStorePut (tx, args, success, error) {
        Sca.encode(value, function (encoded) {
            value = Sca.decode(encoded);
            me.__deriveKey(tx, value, key, function (primaryKey, useNewForAutoInc) {
                Sca.encode(value, function (encoded) {
                    // First try to delete if the record exists
                    Key.convertValueToKey(primaryKey);
                    const sql = 'DELETE FROM ' + util.escapeStoreNameForSQL(me.name) + ' WHERE key = ?';
                    const encodedPrimaryKey = Key.encode(primaryKey);
                    tx.executeSql(sql, [util.escapeSQLiteStatement(encodedPrimaryKey)], function (tx, data) {
                        CFG.DEBUG && console.log('Did the row with the', primaryKey, 'exist? ', data.rowsAffected);
                        me.__insertData(tx, encoded, value, primaryKey, key, useNewForAutoInc, function (...args) {
                            me.__cursors.forEach((cursor) => {
                                cursor.__invalidateCache(); // Add
                            });
                            success(...args);
                        }, error);
                    }, function (tx, err) {
                        error(err);
                    });
                });
            }, error);
        });
    });
    return request;
};

IDBObjectStore.prototype.__get = function (range, getKey, getAll, count) {
    const me = this;
    if (count !== undefined) {
        count = util.enforceRange(count, 'unsigned long');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction.__assertActive(me.transaction);
    if (!getAll && range == null) {
        throw createDOMException('DataError', 'No key or range was specified');
    }

    if (util.instanceOf(range, IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!range.toString() !== '[object IDBKeyRange]') {
            range = IDBKeyRange.__createInstance(range.lower, range.upper, range.lowerOpen, range.upperOpen);
        }
    } else if (range != null) {
        range = IDBKeyRange.only(range);
    }

    const col = getKey ? 'key' : 'value';
    let sql = ['SELECT ' + util.quote(col) + ' FROM ', util.escapeStoreNameForSQL(me.name)];
    const sqlValues = [];
    if (range != null) {
        sql.push('WHERE');
        setSQLForRange(range, util.quote('key'), sql, sqlValues);
    }
    if (!getAll) {
        count = 1;
    }
    if (count) {
        if (typeof count !== 'number' || isNaN(count) || !isFinite(count)) {
            throw new TypeError('The count parameter must be a finite number');
        }
        sql.push('LIMIT', count);
    }
    sql = sql.join(' ');
    return me.transaction.__addToTransactionQueue(function objectStoreGet (tx, args, success, error) {
        CFG.DEBUG && console.log('Fetching', me.name, sqlValues);
        tx.executeSql(sql, sqlValues, function (tx, data) {
            CFG.DEBUG && console.log('Fetched data', data);
            let ret;
            try {
                // Opera can't deal with the try-catch here.
                if (data.rows.length === 0) {
                    return getAll ? success([]) : success();
                }
                ret = [];
                if (getKey) {
                    for (let i = 0; i < data.rows.length; i++) {
                        // Key.convertValueToKey(data.rows.item(i).key); // Already validated before storage
                        ret.push(
                            Key.decode(util.unescapeSQLiteResponse(data.rows.item(i).key), false)
                        );
                    }
                } else {
                    for (let i = 0; i < data.rows.length; i++) {
                        ret.push(
                            Sca.decode(util.unescapeSQLiteResponse(data.rows.item(i).value))
                        );
                    }
                }
                if (!getAll) {
                    ret = ret[0];
                }
            } catch (e) {
                // If no result is returned, or error occurs when parsing JSON
                CFG.DEBUG && console.log(e);
            }
            success(ret);
        }, function (tx, err) {
            error(err);
        });
    }, undefined, me);
};

IDBObjectStore.prototype.get = function (query) {
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.get`.');
    }
    return this.__get(query);
};

IDBObjectStore.prototype.getKey = function (query) {
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.getKey`.');
    }
    return this.__get(query, true);
};

IDBObjectStore.prototype.getAll = function (/* query, count */) {
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.getAll`.');
    }
    const [query, count] = arguments;
    return this.__get(query, false, true, count);
};

IDBObjectStore.prototype.getAllKeys = function (/* query, count */) {
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.getAllKeys`.');
    }
    const [query, count] = arguments;
    return this.__get(query, true, true, count);
};

IDBObjectStore.prototype['delete'] = function (range) {
    const me = this;
    if (!(this instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.delete`.');
    }

    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    if (range == null) {
        throw createDOMException('DataError', 'No key or range was specified');
    }

    if (util.instanceOf(range, IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!range.toString() !== '[object IDBKeyRange]') {
            range = IDBKeyRange.__createInstance(range.lower, range.upper, range.lowerOpen, range.upperOpen);
        }
    } else {
        range = IDBKeyRange.only(range);
    }

    const sqlArr = ['DELETE FROM ', util.escapeStoreNameForSQL(me.name), ' WHERE '];
    const sqlValues = [];
    setSQLForRange(range, util.quote('key'), sqlArr, sqlValues);
    const sql = sqlArr.join(' ');

    return me.transaction.__addToTransactionQueue(function objectStoreDelete (tx, args, success, error) {
        CFG.DEBUG && console.log('Deleting', me.name, sqlValues);
        tx.executeSql(sql, sqlValues, function (tx, data) {
            CFG.DEBUG && console.log('Deleted from database', data.rowsAffected);
            me.__cursors.forEach((cursor) => {
                cursor.__invalidateCache(); // Delete
            });
            success();
        }, function (tx, err) {
            error(err);
        });
    }, undefined, me);
};

IDBObjectStore.prototype.clear = function () {
    const me = this;
    if (!(this instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    return me.transaction.__addToTransactionQueue(function objectStoreClear (tx, args, success, error) {
        tx.executeSql('DELETE FROM ' + util.escapeStoreNameForSQL(me.name), [], function (tx, data) {
            CFG.DEBUG && console.log('Cleared all records from database', data.rowsAffected);
            me.__cursors.forEach((cursor) => {
                cursor.__invalidateCache(); // Clear
            });
            success();
        }, function (tx, err) {
            error(err);
        });
    }, undefined, me);
};

IDBObjectStore.prototype.count = function (/* key */) {
    const me = this;
    let key = arguments[0];
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction.__assertActive(me.transaction);
    if (util.instanceOf(key, IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!key.toString() !== '[object IDBKeyRange]') {
            key = IDBKeyRange.__createInstance(key.lower, key.upper, key.lowerOpen, key.upperOpen);
        }
        // We don't need to add to cursors array since has the count parameter which won't cache
        return IDBCursorWithValue.__createInstance(key, 'next', me, me, 'key', 'value', true).__req;
    } else {
        const hasKey = key != null;

        // key is optional
        if (hasKey) {
            Key.convertValueToKey(key);
        }

        return me.transaction.__addToTransactionQueue(function objectStoreCount (tx, args, success, error) {
            const sql = 'SELECT * FROM ' + util.escapeStoreNameForSQL(me.name) + (hasKey ? ' WHERE key = ?' : '');
            const sqlValues = [];
            hasKey && sqlValues.push(util.escapeSQLiteStatement(Key.encode(key)));
            tx.executeSql(sql, sqlValues, function (tx, data) {
                success(data.rows.length);
            }, function (tx, err) {
                error(err);
            });
        }, undefined, me);
    }
};

IDBObjectStore.prototype.openCursor = function (/* range, direction */) {
    const me = this;
    const [range, direction] = arguments;
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    const cursor = IDBCursorWithValue.__createInstance(range, direction, me, me, 'key', 'value');
    me.__cursors.push(cursor);
    return cursor.__req;
};

IDBObjectStore.prototype.openKeyCursor = function (/* range, direction */) {
    const me = this;
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    const [range, direction] = arguments;
    const cursor = IDBCursor.__createInstance(range, direction, me, me, 'key', 'key');
    me.__cursors.push(cursor);
    return cursor.__req;
};

IDBObjectStore.prototype.index = function (indexName) {
    const me = this;
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction.__assertNotFinished(me.transaction);
    const index = me.__indexes[indexName];
    if (!index || index.__deleted) {
        throw createDOMException('NotFoundError', 'Index "' + indexName + '" does not exist on ' + me.name);
    }
    /*
    // const storeClone = me.transaction.objectStore(me.name); // Ensure clone is made if not present
    // const indexes = storeClone.__indexes;
    const storeClones = me.transaction.__storeClones;
    if (!storeClones[me.name] || storeClones[me.name].__deleted) { // The latter condition is to allow store
                                                         //   recreation to create new clone object
        storeClones[me.name] = IDBObjectStore.__clone(me, me.transaction);
    }

    const indexes = storeClones[me.name].__indexes;
    if (!indexes[indexName]) {
        indexes[indexName] = IDBIndex.__clone(index, me);
    }
    return indexes[indexName];
    */
    return IDBIndex.__clone(index, me);
};

/**
 * Creates a new index on the object store.
 * @param {string} indexName
 * @param {string} keyPath
 * @param {object} optionalParameters
 * @returns {IDBIndex}
 */
IDBObjectStore.prototype.createIndex = function (indexName, keyPath /* , optionalParameters */) {
    const me = this;
    let optionalParameters = arguments[2];
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    indexName = String(indexName); // W3C test within IDBObjectStore.js seems to accept string conversion
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    if (arguments.length === 1) {
        throw new TypeError('No key path was specified');
    }
    IDBTransaction.__assertVersionChange(me.transaction);
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction.__assertActive(me.transaction);
    if (me.__indexes[indexName] && !me.__indexes[indexName].__deleted) {
        throw createDOMException('ConstraintError', 'Index "' + indexName + '" already exists on ' + me.name);
    }
    if (!util.isValidKeyPath(keyPath)) {
        throw createDOMException('SyntaxError', 'A valid keyPath must be supplied');
    }
    if (Array.isArray(keyPath) && optionalParameters && optionalParameters.multiEntry) {
        throw createDOMException('InvalidAccessError', 'The keyPath argument was an array and the multiEntry option is true.');
    }

    optionalParameters = optionalParameters || {};
    /** @name IDBIndexProperties **/
    const indexProperties = {
        columnName: indexName,
        keyPath: keyPath,
        optionalParams: {
            unique: !!optionalParameters.unique,
            multiEntry: !!optionalParameters.multiEntry
        }
    };
    const index = IDBIndex.__createInstance(me, indexProperties);
    IDBIndex.__createIndex(me, index);
    return index;
};

IDBObjectStore.prototype.deleteIndex = function (indexName) {
    const me = this;
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    IDBTransaction.__assertVersionChange(me.transaction);
    if (me.__deleted) {
        throw createDOMException('InvalidStateError', 'This store has been deleted');
    }
    IDBTransaction.__assertActive(me.transaction);
    const index = me.__indexes[indexName];
    if (!index) {
        throw createDOMException('NotFoundError', 'Index "' + indexName + '" does not exist on ' + me.name);
    }

    IDBIndex.__deleteIndex(me, index);
};

readonlyProperties.forEach((prop) => {
    Object.defineProperty(IDBObjectStore.prototype, prop, {
        enumerable: true,
        configurable: true,
        get: function () {
            throw new TypeError('Illegal invocation');
        }
    });
});
Object.defineProperty(IDBObjectStore.prototype, 'name', {
    enumerable: true,
    configurable: true,
    get: function () {
        throw new TypeError('Illegal invocation');
    },
    set: function (val) {
        throw new TypeError('Illegal invocation');
    }
});

IDBObjectStore.prototype[Symbol.toStringTag] = 'IDBObjectStorePrototype';

Object.defineProperty(IDBObjectStore, 'prototype', {
    writable: false
});

export default IDBObjectStore;

import {createDOMError, createDOMException} from './DOMException.js';
import util from './util.js';
import Key from './Key.js';
import IDBKeyRange from './IDBKeyRange.js';
import {IDBCursor} from './IDBCursor.js';
import IDBIndex from './IDBIndex.js';
import IDBTransaction from './IDBTransaction.js';
import Sca from './Sca.js';

/**
 * IndexedDB Object Store
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
 * @param {IDBObjectStoreProperties} storeProperties
 * @param {IDBTransaction} transaction
 * @constructor
 */
function IDBObjectStore (storeProperties, transaction) {
    this.name = storeProperties.name;
    this.keyPath = JSON.parse(storeProperties.keyPath);
    this.transaction = transaction;

    // autoInc is numeric (0/1) on WinPhone
    this.autoIncrement = typeof storeProperties.autoInc === 'string' ? storeProperties.autoInc === 'true' : !!storeProperties.autoInc;

    this.__indexes = {};
    this.indexNames = new util.StringList();
    const indexList = JSON.parse(storeProperties.indexList);
    for (const indexName in indexList) {
        if (indexList.hasOwnProperty(indexName)) {
            const index = new IDBIndex(this, indexList[indexName]);
            this.__indexes[index.name] = index;
            if (!index.__deleted) {
                this.indexNames.push(index.name);
            }
        }
    }
}

/**
 * Clones an IDBObjectStore instance for a different IDBTransaction instance.
 * @param {IDBObjectStore} store
 * @param {IDBTransaction} transaction
 * @protected
 */
IDBObjectStore.__clone = function (store, transaction) {
    const newStore = new IDBObjectStore({
        name: store.name,
        keyPath: JSON.stringify(store.keyPath),
        autoInc: JSON.stringify(store.autoIncrement),
        indexList: '{}'
    }, transaction);
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
IDBObjectStore.__createObjectStore = function (db, store) {
    // Add the object store to the IDBDatabase
    db.__objectStores[store.name] = store;
    db.objectStoreNames.push(store.name);

    // Add the object store to WebSQL
    const transaction = db.__versionTransaction;
    IDBTransaction.__assertVersionChange(transaction);
    transaction.__addToTransactionQueue(function createObjectStore (tx, args, success, failure) {
        function error (tx, err) {
            throw createDOMException(0, 'Could not create object store "' + store.name + '"', err);
        }

        // key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
        const sql = ['CREATE TABLE', util.quote(store.name), '(key BLOB', store.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY', ', value BLOB)'].join(' ');
        window.DEBUG && console.log(sql);
        tx.executeSql(sql, [], function (tx, data) {
            tx.executeSql('INSERT INTO __sys__ VALUES (?,?,?,?)', [store.name, JSON.stringify(store.keyPath), store.autoIncrement, '{}'], function () {
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
IDBObjectStore.__deleteObjectStore = function (db, store) {
    // Remove the object store from the IDBDatabase
    db.__objectStores[store.name] = undefined;
    db.objectStoreNames.splice(db.objectStoreNames.indexOf(store.name), 1);

    // Remove the object store from WebSQL
    const transaction = db.__versionTransaction;
    IDBTransaction.__assertVersionChange(transaction);
    transaction.__addToTransactionQueue(function deleteObjectStore (tx, args, success, failure) {
        function error (tx, err) {
            failure(createDOMException(0, 'Could not delete ObjectStore', err));
        }

        tx.executeSql('SELECT * FROM __sys__ where name = ?', [store.name], function (tx, data) {
            if (data.rows.length > 0) {
                tx.executeSql('DROP TABLE ' + util.quote(store.name), [], function () {
                    tx.executeSql('DELETE FROM __sys__ WHERE name = ?', [store.name], function () {
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
IDBObjectStore.prototype.__validateKey = function (value, key) {
    if (this.keyPath) {
        if (typeof key !== 'undefined') {
            throw createDOMException('DataError', 'The object store uses in-line keys and the key parameter was provided', this);
        } else if (value && typeof value === 'object') {
            key = Key.getValue(value, this.keyPath);
            if (key === undefined) {
                if (this.autoIncrement) {
                    // A key will be generated
                    return;
                }
                throw createDOMException('DataError', 'Could not eval key from keyPath');
            }
        } else {
            throw createDOMException('DataError', 'KeyPath was specified, but value was not an object');
        }
    } else {
        if (typeof key === 'undefined') {
            if (this.autoIncrement) {
                // A key will be generated
                return;
            } else {
                throw createDOMException('DataError', 'The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ', this);
            }
        }
    }

    Key.validate(key);
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
IDBObjectStore.prototype.__deriveKey = function (tx, value, key, success, failure) {
    const me = this;

    function getNextAutoIncKey (callback) {
        tx.executeSql('SELECT * FROM sqlite_sequence where name like ?', [me.name], function (tx, data) {
            if (data.rows.length !== 1) {
                callback(1);
            } else {
                callback(data.rows.item(0).seq + 1);
            }
        }, function (tx, error) {
            failure(createDOMException('DataError', 'Could not get the auto increment value for key', error));
        });
    }

    if (me.keyPath) {
        const primaryKey = Key.getValue(value, me.keyPath);
        if (primaryKey === undefined && me.autoIncrement) {
            getNextAutoIncKey(function (primaryKey) {
                try {
                    // Update the value with the new key
                    Key.setValue(value, me.keyPath, primaryKey);
                    success(primaryKey);
                } catch (e) {
                    failure(createDOMException('DataError', 'Could not assign a generated value to the keyPath', e));
                }
            });
        } else {
            success(primaryKey);
        }
    } else {
        if (typeof key === 'undefined' && me.autoIncrement) {
            // Looks like this has autoInc, so lets get the next in sequence and return that.
            getNextAutoIncKey(success);
        } else {
            success(key);
        }
    }
};

IDBObjectStore.prototype.__insertData = function (tx, encoded, value, primaryKey, success, error) {
    try {
        const paramMap = {};
        if (typeof primaryKey !== 'undefined') {
            Key.validate(primaryKey);
            paramMap.key = Key.encode(primaryKey);
        }
        for (let i = 0; i < this.indexNames.length; i++) {
            const index = this.__indexes[this.indexNames[i]];
            paramMap[index.name] = Key.encode(Key.getValue(value, index.keyPath), index.multiEntry);
        }
        const sqlStart = ['INSERT INTO ', util.quote(this.name), '('];
        const sqlEnd = [' VALUES ('];
        const sqlValues = [];
        for (const key in paramMap) {
            sqlStart.push(util.quote(key) + ',');
            sqlEnd.push('?,');
            sqlValues.push(paramMap[key]);
        }
        // removing the trailing comma
        sqlStart.push('value )');
        sqlEnd.push('?)');
        sqlValues.push(encoded);

        const sql = sqlStart.join(' ') + sqlEnd.join(' ');

        window.DEBUG && console.log('SQL for adding', sql, sqlValues);
        tx.executeSql(sql, sqlValues, function (tx, data) {
            Sca.encode(primaryKey, function (primaryKey) {
                primaryKey = Sca.decode(primaryKey);
                success(primaryKey);
            });
        }, function (tx, err) {
            error(createDOMError('ConstraintError', err.message, err));
        });
    } catch (e) {
        error(e);
    }
};

IDBObjectStore.prototype.add = function (value, key) {
    const me = this;
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    this.__validateKey(value, key);
    me.transaction.__assertWritable();

    const request = me.transaction.__createRequest();
    me.transaction.__pushToQueue(request, function objectStoreAdd (tx, args, success, error) {
        me.__deriveKey(tx, value, key, function (primaryKey) {
            Sca.encode(value, function (encoded) {
                me.__insertData(tx, encoded, value, primaryKey, success, error);
            });
        }, error);
    });
    return request;
};

IDBObjectStore.prototype.put = function (value, key) {
    const me = this;
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    this.__validateKey(value, key);
    me.transaction.__assertWritable();

    const request = me.transaction.__createRequest();
    me.transaction.__pushToQueue(request, function objectStorePut (tx, args, success, error) {
        me.__deriveKey(tx, value, key, function (primaryKey) {
            Sca.encode(value, function (encoded) {
                // First try to delete if the record exists
                Key.validate(primaryKey);
                const sql = 'DELETE FROM ' + util.quote(me.name) + ' where key = ?';
                tx.executeSql(sql, [Key.encode(primaryKey)], function (tx, data) {
                    window.DEBUG && console.log('Did the row with the', primaryKey, 'exist? ', data.rowsAffected);
                    me.__insertData(tx, encoded, value, primaryKey, success, error);
                }, function (tx, err) {
                    error(err);
                });
            });
        }, error);
    });
    return request;
};

IDBObjectStore.prototype.get = function (key) {
    // TODO Key should also be a key range
    const me = this;

    if (arguments.length === 0) {
        throw new TypeError('No key was specified');
    }

    Key.validate(key);
    const primaryKey = Key.encode(key);
    return me.transaction.__addToTransactionQueue(function objectStoreGet (tx, args, success, error) {
        window.DEBUG && console.log('Fetching', me.name, primaryKey);
        tx.executeSql('SELECT * FROM ' + util.quote(me.name) + ' where key = ?', [primaryKey], function (tx, data) {
            window.DEBUG && console.log('Fetched data', data);
            let value;
            try {
                // Opera can't deal with the try-catch here.
                if (0 === data.rows.length) {
                    return success();
                }

                value = Sca.decode(data.rows.item(0).value);
            } catch (e) {
                // If no result is returned, or error occurs when parsing JSON
                window.DEBUG && console.log(e);
            }
            success(value);
        }, function (tx, err) {
            error(err);
        });
    });
};

IDBObjectStore.prototype['delete'] = function (key) {
    const me = this;

    if (arguments.length === 0) {
        throw new TypeError('No key was specified');
    }

    me.transaction.__assertWritable();
    Key.validate(key);
    const primaryKey = Key.encode(key);
    // TODO key should also support key ranges
    return me.transaction.__addToTransactionQueue(function objectStoreDelete (tx, args, success, error) {
        window.DEBUG && console.log('Fetching', me.name, primaryKey);
        tx.executeSql('DELETE FROM ' + util.quote(me.name) + ' where key = ?', [primaryKey], function (tx, data) {
            window.DEBUG && console.log('Deleted from database', data.rowsAffected);
            success();
        }, function (tx, err) {
            error(err);
        });
    });
};

IDBObjectStore.prototype.clear = function () {
    const me = this;
    me.transaction.__assertWritable();
    return me.transaction.__addToTransactionQueue(function objectStoreClear (tx, args, success, error) {
        tx.executeSql('DELETE FROM ' + util.quote(me.name), [], function (tx, data) {
            window.DEBUG && console.log('Cleared all records from database', data.rowsAffected);
            success();
        }, function (tx, err) {
            error(err);
        });
    });
};

IDBObjectStore.prototype.count = function (key) {
    if (key instanceof IDBKeyRange) {
        return new IDBCursor(key, 'next', this, this, 'key', 'value', true).__req;
    } else {
        const me = this;
        let hasKey = false;

        // key is optional
        if (key !== undefined) {
            hasKey = true;
            Key.validate(key);
        }

        return me.transaction.__addToTransactionQueue(function objectStoreCount (tx, args, success, error) {
            const sql = 'SELECT * FROM ' + util.quote(me.name) + (hasKey ? ' WHERE key = ?' : '');
            const sqlValues = [];
            hasKey && sqlValues.push(Key.encode(key));
            tx.executeSql(sql, sqlValues, function (tx, data) {
                success(data.rows.length);
            }, function (tx, err) {
                error(err);
            });
        });
    }
};

IDBObjectStore.prototype.openCursor = function (range, direction) {
    return new IDBCursor(range, direction, this, this, 'key', 'value').__req;
};

IDBObjectStore.prototype.index = function (indexName) {
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    const index = this.__indexes[indexName];
    if (!index) {
        throw createDOMException('NotFoundError', 'Index "' + indexName + '" does not exist on ' + this.name);
    }

    return IDBIndex.__clone(index, this);
};

/**
 * Creates a new index on the object store.
 * @param {string} indexName
 * @param {string} keyPath
 * @param {object} optionalParameters
 * @returns {IDBIndex}
 */
IDBObjectStore.prototype.createIndex = function (indexName, keyPath, optionalParameters) {
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    if (arguments.length === 1) {
        throw new TypeError('No key path was specified');
    }
    if (keyPath instanceof Array && optionalParameters && optionalParameters.multiEntry) {
        throw createDOMException('InvalidAccessError', 'The keyPath argument was an array and the multiEntry option is true.');
    }
    if (this.__indexes[indexName] && !this.__indexes[indexName].__deleted) {
        throw createDOMException('ConstraintError', 'Index "' + indexName + '" already exists on ' + this.name);
    }

    this.transaction.__assertVersionChange();

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
    const index = new IDBIndex(this, indexProperties);
    IDBIndex.__createIndex(this, index);
    return index;
};

IDBObjectStore.prototype.deleteIndex = function (indexName) {
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    const index = this.__indexes[indexName];
    if (!index) {
        throw createDOMException('NotFoundError', 'Index "' + indexName + '" does not exist on ' + this.name);
    }
    this.transaction.__assertVersionChange();

    IDBIndex.__deleteIndex(this, index);
};

export default IDBObjectStore;

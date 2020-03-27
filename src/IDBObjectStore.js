import SyncPromise from 'sync-promise';
import {createDOMException} from './DOMException.js';
import {IDBCursor, IDBCursorWithValue} from './IDBCursor.js';
import {setSQLForKeyRange, convertValueToKeyRange} from './IDBKeyRange.js';
import DOMStringList from './DOMStringList.js';
import * as util from './util.js';
import * as Key from './Key.js';
import {executeFetchIndexData, buildFetchIndexDataSQL, IDBIndex} from './IDBIndex.js';
import IDBTransaction from './IDBTransaction.js';
import * as Sca from './Sca.js';
import CFG from './CFG.js';

const readonlyProperties = ['keyPath', 'indexNames', 'transaction', 'autoIncrement'];

/* eslint-disable jsdoc/check-param-names */
/**
 * IndexedDB Object Store.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
 * @param {IDBObjectStoreProperties} storeProperties
 * @param {IDBTransaction} transaction
 * @class
 */
function IDBObjectStore () {
    /* eslint-enable jsdoc/check-param-names */
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
        me.__autoIncrement = Boolean(storeProperties.autoInc);

        me.__indexes = {};
        me.__indexHandles = {};
        me.__indexNames = DOMStringList.__createInstance();
        const {indexList} = storeProperties;
        for (const indexName in indexList) {
            if (util.hasOwn(indexList, indexName)) {
                const index = IDBIndex.__createInstance(me, indexList[indexName]);
                me.__indexes[index.name] = index;
                if (!index.__deleted) {
                    me.indexNames.push(index.name);
                }
            }
        }
        me.__oldIndexNames = me.indexNames.clone();
        Object.defineProperty(this, '__currentName', {
            get () {
                return '__pendingName' in this ? this.__pendingName : this.name;
            }
        });
        Object.defineProperty(this, 'name', {
            enumerable: false,
            configurable: false,
            get () {
                return this.__name;
            },
            set (name) {
                const me = this;
                name = util.convertToDOMString(name);
                const oldName = me.name;
                IDBObjectStoreAlias.__invalidStateIfDeleted(me);
                IDBTransaction.__assertVersionChange(me.transaction);
                IDBTransaction.__assertActive(me.transaction);
                if (oldName === name) {
                    return;
                }
                if (me.__idbdb.__objectStores[name] && !me.__idbdb.__objectStores[name].__pendingDelete) {
                    throw createDOMException('ConstraintError', 'Object store "' + name + '" already exists in ' + me.__idbdb.name);
                }

                me.__name = name;

                const oldStore = me.__idbdb.__objectStores[oldName];
                oldStore.__name = name; // Fix old references
                me.__idbdb.__objectStores[name] = oldStore; // Ensure new reference accessible
                delete me.__idbdb.__objectStores[oldName]; // Ensure won't be found

                me.__idbdb.objectStoreNames.splice(me.__idbdb.objectStoreNames.indexOf(oldName), 1, name);

                const oldHandle = me.transaction.__storeHandles[oldName];
                oldHandle.__name = name; // Fix old references
                me.transaction.__storeHandles[name] = oldHandle; // Ensure new reference accessible

                me.__pendingName = oldName;

                const sql = 'UPDATE __sys__ SET "name" = ? WHERE "name" = ?';
                const sqlValues = [util.escapeSQLiteStatement(name), util.escapeSQLiteStatement(oldName)];
                CFG.DEBUG && console.log(sql, sqlValues);
                me.transaction.__addNonRequestToTransactionQueue(function objectStoreClear (tx, args, success, error) {
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        // This SQL preserves indexes per https://www.sqlite.org/lang_altertable.html
                        const sql = 'ALTER TABLE ' + util.escapeStoreNameForSQL(oldName) + ' RENAME TO ' + util.escapeStoreNameForSQL(name);
                        CFG.DEBUG && console.log(sql);
                        tx.executeSql(sql, [], function (tx, data) {
                            delete me.__pendingName;
                            success();
                        });
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
 * @returns {IDBObjectStore}
 */
IDBObjectStore.__clone = function (store, transaction) {
    const newStore = IDBObjectStore.__createInstance({
        name: store.__currentName,
        keyPath: Array.isArray(store.keyPath) ? store.keyPath.slice() : store.keyPath,
        autoInc: store.autoIncrement,
        indexList: {},
        idbdb: store.__idbdb,
        cursors: store.__cursors
    }, transaction);

    ['__indexes', '__indexNames', '__oldIndexNames', '__deleted', '__pendingDelete', '__pendingCreate', '__originalName'].forEach((p) => {
        newStore[p] = store[p];
    });
    return newStore;
};

IDBObjectStore.__invalidStateIfDeleted = function (store, msg) {
    if (store.__deleted || store.__pendingDelete || (store.__pendingCreate && (store.transaction && store.transaction.__errored))) {
        throw createDOMException('InvalidStateError', msg || 'This store has been deleted');
    }
};

/**
 * Creates a new object store in the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 * @returns {IDBObjectStore}
 */
IDBObjectStore.__createObjectStore = function (db, store) {
    // Add the object store to the IDBDatabase
    const storeName = store.__currentName;
    store.__pendingCreate = true;
    db.__objectStores[storeName] = store;
    db.objectStoreNames.push(storeName);

    // Add the object store to WebSQL
    const transaction = db.__versionTransaction;

    const storeHandles = transaction.__storeHandles;
    if (!storeHandles[storeName] ||
        // These latter conditions are to allow store
        //   recreation to create new clone object
        storeHandles[storeName].__pendingDelete ||
        storeHandles[storeName].__deleted) {
        storeHandles[storeName] = IDBObjectStore.__clone(store, transaction);
    }

    transaction.__addNonRequestToTransactionQueue(function createObjectStore (tx, args, success, failure) {
        function error (tx, err) {
            CFG.DEBUG && console.log(err);
            failure(createDOMException('UnknownError', 'Could not create object store "' + storeName + '"', err));
        }

        const escapedStoreNameSQL = util.escapeStoreNameForSQL(storeName);
        // key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
        const sql = ['CREATE TABLE', escapedStoreNameSQL, '(key BLOB', store.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY', ', value BLOB)'].join(' ');
        CFG.DEBUG && console.log(sql);
        tx.executeSql(sql, [], function (tx, data) {
            function insertStoreInfo () {
                const encodedKeyPath = JSON.stringify(store.keyPath);
                tx.executeSql('INSERT INTO __sys__ VALUES (?,?,?,?,?)', [
                    util.escapeSQLiteStatement(storeName),
                    encodedKeyPath,
                    // For why converting here, see comment and following
                    //  discussion at:
                    //  https://github.com/axemclion/IndexedDBShim/issues/313#issuecomment-590086778
                    Number(store.autoIncrement),
                    '{}',
                    1
                ], function () {
                    delete store.__pendingCreate;
                    delete store.__deleted;
                    success(store);
                }, error);
            }
            if (!CFG.useSQLiteIndexes) {
                insertStoreInfo();
                return;
            }
            tx.executeSql('CREATE INDEX IF NOT EXISTS ' + (
                util.sqlQuote('sk_' + escapedStoreNameSQL.slice(1, -1))
            ) + ' ON ' + escapedStoreNameSQL + '("key")', [], insertStoreInfo, error);
        }, error);
    });
    return storeHandles[storeName];
};

/**
 * Deletes an object store from the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 * @returns {void}
 */
IDBObjectStore.__deleteObjectStore = function (db, store) {
    // Remove the object store from the IDBDatabase
    store.__pendingDelete = true;
    // We don't delete the other index holders in case need reversion
    store.__indexNames = DOMStringList.__createInstance();

    db.objectStoreNames.splice(db.objectStoreNames.indexOf(store.__currentName), 1);

    const storeHandle = db.__versionTransaction.__storeHandles[store.__currentName];
    if (storeHandle) {
        storeHandle.__indexNames = DOMStringList.__createInstance();
        storeHandle.__pendingDelete = true;
    }

    // Remove the object store from WebSQL
    const transaction = db.__versionTransaction;
    transaction.__addNonRequestToTransactionQueue(function deleteObjectStore (tx, args, success, failure) {
        function error (tx, err) {
            CFG.DEBUG && console.log(err);
            failure(createDOMException('UnknownError', 'Could not delete ObjectStore', err));
        }

        tx.executeSql('SELECT "name" FROM __sys__ WHERE "name" = ?', [util.escapeSQLiteStatement(store.__currentName)], function (tx, data) {
            if (data.rows.length > 0) {
                tx.executeSql('DROP TABLE ' + util.escapeStoreNameForSQL(store.__currentName), [], function () {
                    tx.executeSql('DELETE FROM __sys__ WHERE "name" = ?', [util.escapeSQLiteStatement(store.__currentName)], function () {
                        delete store.__pendingDelete;
                        store.__deleted = true;
                        if (storeHandle) {
                            delete storeHandle.__pendingDelete;
                            storeHandle.__deleted = true;
                        }
                        success();
                    }, error);
                }, error);
            }
        });
    });
};

/**
* @typedef {GenericArray} KeyValueArray
* @property {module:Key.Key} 0
* @property {*} 1
*/

// Todo: Although we may end up needing to do cloning genuinely asynchronously (for Blobs and FileLists),
//   and we'll want to ensure the queue starts up synchronously, we nevertheless do the cloning
//   before entering the queue and its callback since the encoding we do is preceded by validation
//   which we must do synchronously anyways. If we reimplement Blobs and FileLists asynchronously,
//   we can detect these types (though validating synchronously as possible) and once entering the
//   queue callback, ensure they load before triggering success or failure (perhaps by returning and
//   a `SyncPromise` from the `Sca.clone` operation and later detecting and ensuring it is resolved
//   before continuing).
/**
 * Determines whether the given inline or out-of-line key is valid,
 *   according to the object store's schema.
 * @param {*} value Used for inline keys
 * @param {*} key Used for out-of-line keys
 * @param {boolean} cursorUpdate
 * @throws {DOMException}
 * @returns {KeyValueArray}
 * @private
 */
IDBObjectStore.prototype.__validateKeyAndValueAndCloneValue = function (value, key, cursorUpdate) {
    const me = this;
    if (me.keyPath !== null) {
        if (key !== undefined) {
            throw createDOMException('DataError', 'The object store uses in-line keys and the key parameter was provided', me);
        }
        // Todo Binary: Avoid blobs loading async to ensure cloning (and errors therein)
        //   occurs sync; then can make cloning and this method without callbacks (except where ok
        //   to be async)
        const clonedValue = Sca.clone(value);
        key = Key.extractKeyValueDecodedFromValueUsingKeyPath(clonedValue, me.keyPath); // May throw so "rethrow"
        if (key.invalid) {
            throw createDOMException('DataError', 'KeyPath was specified, but key was invalid.');
        }
        if (key.failure) {
            if (!cursorUpdate) {
                if (!me.autoIncrement) {
                    throw createDOMException('DataError', 'Could not evaluate a key from keyPath and there is no key generator');
                }
                if (!Key.checkKeyCouldBeInjectedIntoValue(clonedValue, me.keyPath)) {
                    throw createDOMException('DataError', 'A key could not be injected into a value');
                }
                // A key will be generated
                return [undefined, clonedValue];
            }
            throw createDOMException('DataError', 'Could not evaluate a key from keyPath');
        }
        // An `IDBCursor.update` call will also throw if not equal to the cursor’s effective key
        return [key.value, clonedValue];
    }
    if (key === undefined) {
        if (!me.autoIncrement) {
            throw createDOMException('DataError', 'The object store uses out-of-line keys and has no key generator and the key parameter was not provided.', me);
        }
        // A key will be generated
        key = undefined;
    } else {
        Key.convertValueToKeyRethrowingAndIfInvalid(key);
    }
    const clonedValue = Sca.clone(value);
    return [key, clonedValue];
};

/**
 * From the store properties and object, extracts the value for the key in
 *   the object store
 * If the table has auto increment, get the current number (unless it has
 *   a keyPath leading to a valid but non-numeric or < 1 key).
 * @param {Object} tx
 * @param {Object} value
 * @param {Object} key
 * @param {function} success
 * @param {function} failCb
 * @returns {void}
 */
IDBObjectStore.prototype.__deriveKey = function (tx, value, key, success, failCb) {
    const me = this;

    // Only run if cloning is needed
    function keyCloneThenSuccess (oldCn) { // We want to return the original key, so we don't need to accept an argument here
        Sca.encode(key, function (key) {
            key = Sca.decode(key);
            success(key, oldCn);
        });
    }

    if (me.autoIncrement) {
        // If auto-increment and no valid primaryKey found on the keyPath, get and set the new value, and use
        if (key === undefined) {
            Key.generateKeyForStore(tx, me, function (failure, key, oldCn) {
                if (failure) {
                    failCb(createDOMException('ConstraintError', 'The key generator\'s current number has reached the maximum safe integer limit'));
                    return;
                }
                if (me.keyPath !== null) {
                    // Should not throw now as checked earlier
                    Key.injectKeyIntoValueUsingKeyPath(value, key, me.keyPath);
                }
                success(key, oldCn);
            }, failCb);
        } else {
            Key.possiblyUpdateKeyGenerator(tx, me, key, keyCloneThenSuccess, failCb);
        }
    // Not auto-increment
    } else {
        keyCloneThenSuccess();
    }
};

IDBObjectStore.prototype.__insertData = function (tx, encoded, value, clonedKeyOrCurrentNumber, oldCn, success, error) {
    const me = this;
    // The `ConstraintError` to occur for `add` upon a duplicate will occur naturally in attempting an insert
    // We process the index information first as it will stored in the same table as the store
    const paramMap = {};
    const indexPromises = Object.keys(
        // We do not iterate `indexNames` as those can be modified synchronously (e.g.,
        //   `deleteIndex` could, by its synchronous removal from `indexNames`, prevent
        //   iteration here of an index though per IndexedDB test
        //   `idbobjectstore_createIndex4-deleteIndex-event_order.js`, `createIndex`
        //   should be allowed to first fail even in such a case).
        me.__indexes
    ).map((indexName) => {
        // While this may sometimes resolve sync and sometimes async, the
        //   idea is to avoid, where possible, unnecessary delays (and
        //   consuming code ought to only see a difference in the browser
        //   where we can't control the transaction timeout anyways).
        return new SyncPromise((resolve, reject) => {
            const index = me.__indexes[indexName];
            if (
                // `createIndex` was called synchronously after the current insertion was added to
                //  the transaction queue so although it was added to `__indexes`, it is not yet
                //  ready to be checked here for the insertion as it will be when running the
                //  `createIndex` operation (e.g., if two items with the same key were added and
                //  *then* a unique index was created, it should not continue to err and abort
                //  yet, as we're still handling the insertions which must be processed (e.g., to
                //  add duplicates which then cause a unique index to fail))
                index.__pendingCreate ||
                // If already deleted (and not just slated for deletion (by `__pendingDelete`
                //  after this add), we avoid checks
                index.__deleted
            ) {
                resolve();
                return;
            }
            let indexKey;
            try {
                indexKey = Key.extractKeyValueDecodedFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Add as necessary to this and skip past this index if exceptions here)
                if (indexKey.invalid || indexKey.failure) {
                    throw new Error('Go to catch');
                }
            } catch (err) {
                resolve();
                return;
            }
            indexKey = indexKey.value;
            function setIndexInfo (index) {
                if (indexKey === undefined) {
                    return;
                }
                paramMap[index.__currentName] = Key.encode(indexKey, index.multiEntry);
            }
            if (index.unique) {
                const multiCheck = index.multiEntry && Array.isArray(indexKey);
                const fetchArgs = buildFetchIndexDataSQL(true, index, indexKey, 'key', multiCheck);
                executeFetchIndexData(null, ...fetchArgs, tx, null, function success (key) {
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
    return SyncPromise.all(indexPromises).then(() => {
        const sqlStart = ['INSERT INTO', util.escapeStoreNameForSQL(me.__currentName), '('];
        const sqlEnd = [' VALUES ('];
        const insertSqlValues = [];
        if (clonedKeyOrCurrentNumber !== undefined) {
            // Key.convertValueToKey(primaryKey); // Already run
            sqlStart.push(util.sqlQuote('key'), ',');
            sqlEnd.push('?,');
            insertSqlValues.push(
                util.escapeSQLiteStatement(
                    Key.encode(clonedKeyOrCurrentNumber)
                )
            );
        }
        Object.entries(paramMap).forEach(([key, stmt]) => {
            sqlStart.push(util.escapeIndexNameForSQL(key) + ',');
            sqlEnd.push('?,');
            insertSqlValues.push(util.escapeSQLiteStatement(stmt));
        });
        // removing the trailing comma
        sqlStart.push(util.sqlQuote('value') + ' )');
        sqlEnd.push('?)');
        insertSqlValues.push(util.escapeSQLiteStatement(encoded));

        const insertSql = sqlStart.join(' ') + sqlEnd.join(' ');
        CFG.DEBUG && console.log('SQL for adding', insertSql, insertSqlValues);

        tx.executeSql(insertSql, insertSqlValues, function (tx, data) {
            success(clonedKeyOrCurrentNumber);
        }, function (tx, err) {
            // Should occur for `add` operation
            error(createDOMException('ConstraintError', err.message, err));
        });
        return undefined;
    }).catch(function (err) {
        function fail () {
            // Todo: Add a different error object here if `assignCurrentNumber` fails in reverting?
            error(err);
        }
        if (typeof oldCn === 'number') {
            Key.assignCurrentNumber(tx, me, oldCn, fail, fail);
            return;
        }
        fail();
    });
};

IDBObjectStore.prototype.add = function (value /* , key */) {
    const me = this;
    // eslint-disable-next-line prefer-rest-params
    const key = arguments[1];
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    IDBObjectStore.__invalidStateIfDeleted(me);
    IDBTransaction.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    const request = me.transaction.__createRequest(me);
    const [ky, clonedValue] = me.__validateKeyAndValueAndCloneValue(value, key, false);
    IDBObjectStore.__storingRecordObjectStore(request, me, true, clonedValue, true, ky);
    return request;
};

IDBObjectStore.prototype.put = function (value /*, key */) {
    const me = this;
    // eslint-disable-next-line prefer-rest-params
    const key = arguments[1];
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    IDBObjectStore.__invalidStateIfDeleted(me);
    IDBTransaction.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    const request = me.transaction.__createRequest(me);
    const [ky, clonedValue] = me.__validateKeyAndValueAndCloneValue(value, key, false);
    IDBObjectStore.__storingRecordObjectStore(request, me, true, clonedValue, false, ky);
    return request;
};

IDBObjectStore.prototype.__overwrite = function (tx, key, cb, error) {
    const me = this;
    // First try to delete if the record exists
    // Key.convertValueToKey(key); // Already run
    const sql = 'DELETE FROM ' + util.escapeStoreNameForSQL(me.__currentName) + ' WHERE "key" = ?';
    const encodedKey = Key.encode(key);
    tx.executeSql(sql, [util.escapeSQLiteStatement(encodedKey)], function (tx, data) {
        CFG.DEBUG && console.log('Did the row with the', key, 'exist?', data.rowsAffected);
        cb(tx);
    }, function (tx, err) {
        error(err);
    });
};

IDBObjectStore.__storingRecordObjectStore = function (request, store, invalidateCache, value, noOverwrite /* , key */) {
    // eslint-disable-next-line prefer-rest-params
    const key = arguments[5];
    store.transaction.__pushToQueue(request, function (tx, args, success, error) {
        store.__deriveKey(tx, value, key, function (clonedKeyOrCurrentNumber, oldCn) {
            Sca.encode(value, function (encoded) {
                function insert (tx) {
                    store.__insertData(tx, encoded, value, clonedKeyOrCurrentNumber, oldCn, function (...args) {
                        if (invalidateCache) {
                            store.__cursors.forEach((cursor) => {
                                cursor.__invalidateCache();
                            });
                        }
                        success(...args);
                    }, error);
                }
                if (!noOverwrite) {
                    store.__overwrite(tx, clonedKeyOrCurrentNumber, insert, error);
                    return;
                }
                insert(tx);
            });
        }, error);
    });
};

IDBObjectStore.prototype.__get = function (query, getKey, getAll, count) {
    const me = this;
    if (count !== undefined) {
        count = util.enforceRange(count, 'unsigned long');
    }
    IDBObjectStore.__invalidStateIfDeleted(me);
    IDBTransaction.__assertActive(me.transaction);

    const range = convertValueToKeyRange(query, !getAll);

    const col = getKey ? 'key' : 'value';
    let sql = ['SELECT', util.sqlQuote(col), 'FROM', util.escapeStoreNameForSQL(me.__currentName)];
    const sqlValues = [];
    if (range !== undefined) {
        sql.push('WHERE');
        setSQLForKeyRange(range, util.sqlQuote('key'), sql, sqlValues);
    }
    if (!getAll) {
        count = 1;
    }
    if (count) {
        if (!Number.isFinite(count)) {
            throw new TypeError('The count parameter must be a finite number');
        }
        sql.push('LIMIT', count);
    }
    sql = sql.join(' ');
    return me.transaction.__addToTransactionQueue(function objectStoreGet (tx, args, success, error) {
        CFG.DEBUG && console.log('Fetching', me.__currentName, sqlValues);
        tx.executeSql(sql, sqlValues, function (tx, data) {
            CFG.DEBUG && console.log('Fetched data', data);
            let ret;
            try {
                // Opera can't deal with the try-catch here.
                if (data.rows.length === 0) {
                    if (getAll) {
                        success([]);
                    } else {
                        success();
                    }
                    return;
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
    // eslint-disable-next-line prefer-rest-params
    const [query, count] = arguments;
    return this.__get(query, false, true, count);
};

IDBObjectStore.prototype.getAllKeys = function (/* query, count */) {
    // eslint-disable-next-line prefer-rest-params
    const [query, count] = arguments;
    return this.__get(query, true, true, count);
};

IDBObjectStore.prototype.delete = function (query) {
    const me = this;
    if (!(this instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.delete`.');
    }

    IDBObjectStore.__invalidStateIfDeleted(me);
    IDBTransaction.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    const range = convertValueToKeyRange(query, true);

    const sqlArr = ['DELETE FROM', util.escapeStoreNameForSQL(me.__currentName), 'WHERE'];
    const sqlValues = [];
    setSQLForKeyRange(range, util.sqlQuote('key'), sqlArr, sqlValues);
    const sql = sqlArr.join(' ');

    return me.transaction.__addToTransactionQueue(function objectStoreDelete (tx, args, success, error) {
        CFG.DEBUG && console.log('Deleting', me.__currentName, sqlValues);
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
    IDBObjectStore.__invalidStateIfDeleted(me);
    IDBTransaction.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    return me.transaction.__addToTransactionQueue(function objectStoreClear (tx, args, success, error) {
        tx.executeSql('DELETE FROM ' + util.escapeStoreNameForSQL(me.__currentName), [], function (tx, data) {
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

IDBObjectStore.prototype.count = function (/* query */) {
    const me = this;
    // eslint-disable-next-line prefer-rest-params
    const query = arguments[0];
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    IDBObjectStore.__invalidStateIfDeleted(me);
    IDBTransaction.__assertActive(me.transaction);

    // We don't need to add to cursors array since has the count parameter which won't cache
    return IDBCursorWithValue.__createInstance(query, 'next', me, me, 'key', 'value', true).__request;
};

IDBObjectStore.prototype.openCursor = function (/* query, direction */) {
    const me = this;
    // eslint-disable-next-line prefer-rest-params
    const [query, direction] = arguments;
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    IDBObjectStore.__invalidStateIfDeleted(me);
    const cursor = IDBCursorWithValue.__createInstance(query, direction, me, me, 'key', 'value');
    me.__cursors.push(cursor);
    return cursor.__request;
};

IDBObjectStore.prototype.openKeyCursor = function (/* query, direction */) {
    const me = this;
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    IDBObjectStore.__invalidStateIfDeleted(me);
    // eslint-disable-next-line prefer-rest-params
    const [query, direction] = arguments;
    const cursor = IDBCursor.__createInstance(query, direction, me, me, 'key', 'key');
    me.__cursors.push(cursor);
    return cursor.__request;
};

IDBObjectStore.prototype.index = function (indexName) {
    const me = this;
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    IDBObjectStore.__invalidStateIfDeleted(me);
    IDBTransaction.__assertNotFinished(me.transaction);
    const index = me.__indexes[indexName];
    if (!index || index.__deleted) {
        throw createDOMException('NotFoundError', 'Index "' + indexName + '" does not exist on ' + me.__currentName);
    }

    if (!me.__indexHandles[indexName] ||
        me.__indexes[indexName].__pendingDelete ||
        me.__indexes[indexName].__deleted
    ) {
        me.__indexHandles[indexName] = IDBIndex.__clone(index, me);
    }
    return me.__indexHandles[indexName];
};

/* eslint-disable jsdoc/check-param-names */
/**
 * Creates a new index on the object store.
 * @param {string} indexName
 * @param {string} keyPath
 * @param {object} optionalParameters
 * @returns {IDBIndex}
 */
IDBObjectStore.prototype.createIndex = function (indexName, keyPath /* , optionalParameters */) {
    /* eslint-enable jsdoc/check-param-names */
    const me = this;
    // eslint-disable-next-line prefer-rest-params
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
    IDBObjectStore.__invalidStateIfDeleted(me);
    IDBTransaction.__assertActive(me.transaction);
    if (me.__indexes[indexName] && !me.__indexes[indexName].__deleted && !me.__indexes[indexName].__pendingDelete) {
        throw createDOMException('ConstraintError', 'Index "' + indexName + '" already exists on ' + me.__currentName);
    }

    keyPath = util.convertToSequenceDOMString(keyPath);
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
        keyPath,
        optionalParams: {
            unique: Boolean(optionalParameters.unique),
            multiEntry: Boolean(optionalParameters.multiEntry)
        }
    };
    const index = IDBIndex.__createInstance(me, indexProperties);
    IDBIndex.__createIndex(me, index);
    return index;
};

IDBObjectStore.prototype.deleteIndex = function (name) {
    const me = this;
    if (!(me instanceof IDBObjectStore)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    IDBTransaction.__assertVersionChange(me.transaction);
    IDBObjectStore.__invalidStateIfDeleted(me);
    IDBTransaction.__assertActive(me.transaction);
    const index = me.__indexes[name];
    if (!index) {
        throw createDOMException('NotFoundError', 'Index "' + name + '" does not exist on ' + me.__currentName);
    }

    IDBIndex.__deleteIndex(me, index);
};

util.defineReadonlyOuterInterface(IDBObjectStore.prototype, readonlyProperties);
util.defineOuterInterface(IDBObjectStore.prototype, ['name']);

IDBObjectStore.prototype[Symbol.toStringTag] = 'IDBObjectStorePrototype';

Object.defineProperty(IDBObjectStore, 'prototype', {
    writable: false
});

export default IDBObjectStore;

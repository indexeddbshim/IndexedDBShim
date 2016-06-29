import {createDOMException} from './DOMException.js';
import * as util from './util.js';
import IDBObjectStore from './IDBObjectStore.js';
import IDBTransaction from './IDBTransaction.js';
import CFG from './cfg.js';

/**
 * IDB Database Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
 * @constructor
 */
function IDBDatabase (db, name, version, storeProperties) {
    this.__db = db;
    this.__closed = false;
    this.version = version;
    this.name = name;
    this.onabort = this.onerror = this.onversionchange = null;

    this.__objectStores = {};
    this.objectStoreNames = new util.StringList();
    for (let i = 0; i < storeProperties.rows.length; i++) {
        const store = new IDBObjectStore(storeProperties.rows.item(i));
        this.__objectStores[store.name] = store;
        this.objectStoreNames.push(store.name);
    }
}

/**
 * Creates a new object store.
 * @param {string} storeName
 * @param {object} [createOptions]
 * @returns {IDBObjectStore}
 */
IDBDatabase.prototype.createObjectStore = function (storeName, createOptions) {
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    IDBTransaction.__assertVersionChange(this.__versionTransaction); // this.__versionTransaction may not exist if called mistakenly by user in onsuccess
    this.__versionTransaction.__assertActive();
    if (this.__objectStores[storeName]) {
        throw createDOMException('ConstraintError', 'Object store "' + storeName + '" already exists in ' + this.name);
    }
    createOptions = Object.assign({}, createOptions);
    if (createOptions.keyPath === undefined) {
        createOptions.keyPath = null;
    }

    const keyPath = createOptions.keyPath;
    const autoIncrement = createOptions.autoIncrement;

    if (keyPath !== null && !util.isValidKeyPath(keyPath)) {
        // throw createDOMException('SyntaxError', 'The keyPath argument contains an invalid key path.');
        throw new SyntaxError('The keyPath argument contains an invalid key path.');
    }
    if (autoIncrement && (keyPath === '' || Array.isArray(keyPath))) {
        throw createDOMException('InvalidAccessError', 'With autoIncrement set, the keyPath argument must not be an array or empty string.');
    }

    /** @name IDBObjectStoreProperties **/
    const storeProperties = {
        name: storeName,
        keyPath: JSON.stringify(keyPath),
        autoInc: JSON.stringify(autoIncrement),
        indexList: '{}'
    };
    const store = new IDBObjectStore(storeProperties, this.__versionTransaction);
    IDBObjectStore.__createObjectStore(this, store);
    return store;
};

/**
 * Deletes an object store.
 * @param {string} storeName
 */
IDBDatabase.prototype.deleteObjectStore = function (storeName) {
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    const store = this.__objectStores[storeName];
    if (!store) {
        throw createDOMException('NotFoundError', 'Object store "' + storeName + '" does not exist in ' + this.name);
    }
    IDBTransaction.__assertVersionChange(this.__versionTransaction); // this.__versionTransaction may not exist if called mistakenly by user in onsuccess

    IDBObjectStore.__deleteObjectStore(this, store);
};

IDBDatabase.prototype.close = function () {
    this.__closed = true;
};

/**
 * Starts a new transaction.
 * @param {string|string[]} storeNames
 * @param {string} mode
 * @returns {IDBTransaction}
 */
IDBDatabase.prototype.transaction = function (storeNames, mode) {
    if (this.__closed) {
        throw createDOMException('InvalidStateError', 'An attempt was made to start a new transaction on a database connection that is not open');
    }

    if (typeof mode === 'number') {
        mode = mode === 1 ? 'readwrite' : 'readonly';
        CFG.DEBUG && console.log('Mode should be a string, but was specified as ', mode);
    } else {
        mode = mode || 'readonly';
    }

    if (mode !== 'readonly' && mode !== 'readwrite') {
        throw new TypeError('Invalid transaction mode: ' + mode);
    }

    storeNames = typeof storeNames === 'string' ? [storeNames] : storeNames;
    if (storeNames.length === 0) {
        throw createDOMException('InvalidAccessError', 'No object store names were specified');
    }
    for (let i = 0; i < storeNames.length; i++) {
        if (!this.objectStoreNames.contains(storeNames[i])) {
            throw createDOMException('NotFoundError', 'The "' + storeNames[i] + '" object store does not exist');
        }
    }

    return new IDBTransaction(this, storeNames, mode);
};

export default IDBDatabase;

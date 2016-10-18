import {createDOMException} from './DOMException.js';
import * as util from './util.js';
import IDBObjectStore from './IDBObjectStore.js';
import IDBTransaction from './IDBTransaction.js';
import CFG from './cfg.js';
import EventTarget from 'eventtarget';

/**
 * IDB Database Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
 * @constructor
 */
function IDBDatabase (db, name, version, storeProperties) {
    this.__db = db;
    this.__closed = false;
    this.__version = version;
    this.__name = name;
    this.onabort = this.onerror = this.onversionchange = null;

    this.__objectStores = {};
    this.__objectStoreNames = new util.StringList();
    for (let i = 0; i < storeProperties.rows.length; i++) {
        const item = storeProperties.rows.item(i);
        // 'name' doesn't need to be JSON-parsed
        ['keyPath', 'autoInc', 'indexList'].forEach(function (prop) {
            item[prop] = JSON.parse(item[prop]);
        });
        item.idbdb = this;
        const store = new IDBObjectStore(item);
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
    storeName = String(storeName); // W3C test within IDBObjectStore.js seems to accept string conversion
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    IDBTransaction.__assertVersionChange(this.__versionTransaction); // this.__versionTransaction may not exist if called mistakenly by user in onsuccess
    IDBTransaction.__assertActive(this.__versionTransaction);
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
        throw createDOMException('SyntaxError', 'The keyPath argument contains an invalid key path.');
    }
    if (autoIncrement && (keyPath === '' || Array.isArray(keyPath))) {
        throw createDOMException('InvalidAccessError', 'With autoIncrement set, the keyPath argument must not be an array or empty string.');
    }

    /** @name IDBObjectStoreProperties **/
    const storeProperties = {
        name: storeName,
        keyPath: keyPath,
        autoInc: autoIncrement,
        indexList: {},
        idbdb: this
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
    IDBTransaction.__assertVersionChange(this.__versionTransaction);
    IDBTransaction.__assertActive(this.__versionTransaction);
    delete this.__versionTransaction.__storeClones[storeName];

    const store = this.__objectStores[storeName];
    if (!store) {
        throw createDOMException('NotFoundError', 'Object store "' + storeName + '" does not exist in ' + this.name);
    }

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
    if (typeof mode === 'number') {
        mode = mode === 1 ? 'readwrite' : 'readonly';
        CFG.DEBUG && console.log('Mode should be a string, but was specified as ', mode); // Todo: Remove this option as no longer in spec
    } else {
        mode = mode || 'readonly';
    }

    if (mode !== 'readonly' && mode !== 'readwrite') {
        throw new TypeError('Invalid transaction mode: ' + mode);
    }

    IDBTransaction.__assertNotVersionChange(this.__versionTransaction);
    if (this.__closed) {
        throw createDOMException('InvalidStateError', 'An attempt was made to start a new transaction on a database connection that is not open');
    }

    storeNames = typeof storeNames === 'string' ? [storeNames] : storeNames;
    storeNames.forEach((storeName) => {
        if (!this.objectStoreNames.contains(storeName)) {
            throw createDOMException('NotFoundError', 'The "' + storeName + '" object store does not exist');
        }
    });
    if (storeNames.length === 0) {
        throw createDOMException('InvalidAccessError', 'No object store names were specified');
    }

    return new IDBTransaction(this, storeNames, mode);
};
IDBDatabase.prototype.toString = function () {
    return '[object IDBDatabase]';
};

util.defineReadonlyProperties(IDBDatabase.prototype, ['name', 'version', 'objectStoreNames']);

Object.assign(IDBDatabase.prototype, EventTarget.prototype);

export default IDBDatabase;

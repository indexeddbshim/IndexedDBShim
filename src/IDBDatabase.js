import {createDOMException} from './DOMException.js';
import {createEvent} from './Event.js';
import * as util from './util.js';
import IDBObjectStore from './IDBObjectStore.js';
import IDBTransaction from './IDBTransaction.js';
import Sca from './Sca.js';
import CFG from './CFG.js';
import EventTarget from 'eventtarget';

/**
 * IDB Database Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
 * @constructor
 */
function IDBDatabase (db, name, oldVersion, version, storeProperties) {
    this.__db = db;
    this.__closed = false;
    this.__oldVersion = oldVersion;
    this.__version = version;
    this.__name = name;
    this.onabort = this.onclose = this.onerror = this.onversionchange = null;

    this.__transactions = [];
    this.__objectStores = {};
    this.__objectStoreNames = new util.DOMStringList();
    const itemCopy = {};
    for (let i = 0; i < storeProperties.rows.length; i++) {
        const item = storeProperties.rows.item(i);
        // Safari implements `item` getter return object's properties
        //  as readonly, so we copy all its properties (except our
        //  custom `currNum` which we don't need) onto a new object
        itemCopy.name = item.name;
        itemCopy.keyPath = Sca.decode(item.keyPath);
        ['autoInc', 'indexList'].forEach(function (prop) {
            itemCopy[prop] = JSON.parse(item[prop]);
        });
        itemCopy.idbdb = this;
        const store = new IDBObjectStore(itemCopy);
        this.__objectStores[store.name] = store;
        this.objectStoreNames.push(store.name);
    }
    this.__oldObjectStoreNames = this.objectStoreNames.clone();
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
    // Since SQLite (at least node-websql and definitely WebSQL) requires
    //   locking of the whole database, to allow simultaneous readwrite
    //   operations on transactions without overlapping stores, we'd probably
    //   need to save the stores in separate databases (we could also consider
    //   prioritizing readonly but not starving readwrite).
    // Even for readonly transactions, due to [issue 17](https://github.com/nolanlawson/node-websql/issues/17),
    //   we're not currently actually running the SQL requests in parallel.
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
    // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
    const trans = new IDBTransaction(this, storeNames, mode);
    this.__transactions.push(trans);
    return trans;
};

// Todo: Test
IDBDatabase.prototype.__forceClose = function (msg) {
    const me = this;
    me.close();
    let ct = 0;
    me.__transactions.forEach(function (trans) {
        trans.on__abort = function () {
            ct++;
            if (ct === me.__transactions.length) {
                // Todo: unblock any pending `upgradeneeded` or `deleteDatabase` calls
                const evt = createEvent('close');
                setTimeout(() => {
                    me.dispatchEvent(evt);
                });
            }
        };
        trans.__abortTransaction(createDOMException('AbortError', 'The connection was force-closed: ' + (msg || '')));
    });
};

IDBDatabase.prototype.toString = function () {
    return '[object IDBDatabase]';
};

util.defineReadonlyProperties(IDBDatabase.prototype, ['name', 'version', 'objectStoreNames']);

Object.assign(IDBDatabase.prototype, EventTarget.prototype);

export default IDBDatabase;

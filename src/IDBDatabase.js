/*jshint globalstrict: true*/
'use strict';
(function(idbModules){

    /**
     * IDB Database Object
     * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
     * @constructor
     */
    function IDBDatabase(db, name, version, storeProperties){
        this.__db = db;
        this.__closed = false;
        this.version = version;
        this.name = name;
        this.onabort = this.onerror = this.onversionchange = null;

        this.__objectStores = {};
        this.objectStoreNames = new idbModules.util.StringList();
        for (var i = 0; i < storeProperties.rows.length; i++) {
            var store = new idbModules.IDBObjectStore(storeProperties.rows.item(i));
            this.__objectStores[store.name] = store;
            this.objectStoreNames.push(store.name);
        }
    }

    /**
     * Creates a new object store.
     * @param {string} storeName
     * @param {object} createOptions
     * @returns {IDBObjectStore}
     */
    IDBDatabase.prototype.createObjectStore = function(storeName, createOptions){
        if (arguments.length === 0) {
            throw new TypeError("No object store name was specified");
        }
        if (this.__objectStores[storeName]) {
            throw idbModules.util.createDOMException("ConstraintError", "Object store \"" + storeName + "\" already exists in " + this.name);
        }
        this.__versionTransaction.__assertVersionChange();

        createOptions = createOptions || {};
        /** @name IDBObjectStoreProperties **/
        var storeProperties = {
            name: storeName,
            keyPath: createOptions.keyPath || null,
            autoInc: !!createOptions.autoIncrement,
            indexList: {}
        };
        var store = new idbModules.IDBObjectStore(storeProperties, this.__versionTransaction);
        idbModules.IDBObjectStore.__createObjectStore(this, store);
        return store;
    };

    /**
     * Deletes an object store.
     * @param {string} storeName
     */
    IDBDatabase.prototype.deleteObjectStore = function(storeName){
        if (arguments.length === 0) {
            throw new TypeError("No object store name was specified");
        }
        var store = this.__objectStores[storeName];
        if (!store) {
            throw idbModules.util.createDOMException("NotFoundError", "Object store \"" + storeName + "\" does not exist in " + this.name);
        }
        this.__versionTransaction.__assertVersionChange();

        idbModules.IDBObjectStore.__deleteObjectStore(this, store);
    };

    IDBDatabase.prototype.close = function(){
        this.__closed = true;
    };

    /**
     * Starts a new transaction.
     * @param {string|string[]} storeNames
     * @param {string} mode
     * @returns {IDBTransaction}
     */
    IDBDatabase.prototype.transaction = function(storeNames, mode){
        if (this.__closed) {
            throw idbModules.util.createDOMException("InvalidStateError", "An attempt was made to start a new transaction on a database connection that is not open");
        }

        if (typeof mode === "number") {
            mode = mode === 1 ? IDBTransaction.READ_WRITE : IDBTransaction.READ_ONLY;
            idbModules.DEBUG && console.log("Mode should be a string, but was specified as ", mode);
        }
        else {
            mode = mode || IDBTransaction.READ_ONLY;
        }

        if (mode !== IDBTransaction.READ_ONLY && mode !== IDBTransaction.READ_WRITE) {
            throw new TypeError("Invalid transaction mode: " + mode);
        }

        storeNames = typeof storeNames === "string" ? [storeNames] : storeNames;
        if (storeNames.length === 0) {
            throw idbModules.util.createDOMException("InvalidAccessError", "No object store names were specified");
        }
        for (var i = 0; i < storeNames.length; i++) {
            if (!this.objectStoreNames.contains(storeNames[i])) {
                throw idbModules.util.createDOMException("NotFoundError", "The \"" + storeNames[i] + "\" object store does not exist");
            }
        }

        var transaction = new idbModules.IDBTransaction(this, storeNames, mode);
        return transaction;
    };
    
    idbModules.IDBDatabase = IDBDatabase;
}(idbModules));

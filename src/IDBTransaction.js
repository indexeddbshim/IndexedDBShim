import {createEvent} from './Event.js';
import {logError, findError, DOMException, createDOMException} from './DOMException.js';
import {IDBRequest} from './IDBRequest.js';
import * as util from './util.js';
import IDBObjectStore from './IDBObjectStore.js';
import CFG from './CFG.js';
import EventTarget from 'eventtarget';

let uniqueID = 0;

/**
 * The IndexedDB Transaction
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
 * @param {IDBDatabase} db
 * @param {string[]} storeNames
 * @param {string} mode
 * @constructor
 */
function IDBTransaction (db, storeNames, mode) {
    this.__id = ++uniqueID; // for debugging simultaneous transactions
    this.__active = true;
    this.__running = false;
    this.__errored = false;
    this.__requests = [];
    this.__objectStoreNames = storeNames;
    this.__mode = mode;
    this.__db = db;
    this.__error = null;
    this.onabort = this.onerror = this.oncomplete = null;
    this.__storeClones = {};

    // Kick off the transaction as soon as all synchronous code is done.
    setTimeout(() => { this.__executeRequests(); }, 0);
}

IDBTransaction.prototype.__executeRequests = function () {
    if (this.__running) {
        CFG.DEBUG && console.log('Looks like the request set is already running', this.mode);
        return;
    }

    this.__running = true;
    const me = this;

    me.db.__db.transaction(
        function executeRequests (tx) {
            me.__tx = tx;
            let q = null, i = -1;

            function success (result, req) {
                if (req) {
                    q.req = req; // Need to do this in case of cursors
                }
                q.req.__readyState = 'done';
                q.req.__result = result;
                q.req.__error = null;
                const e = createEvent('success');
                q.req.dispatchEvent(e);
                executeNextRequest();
            }

            function error (...args /* tx, err */) {
                const err = findError(args);
                try {
                    // Fire an error event for the current IDBRequest
                    q.req.__readyState = 'done';
                    q.req.__error = err || DOMException;
                    q.req.__result = undefined;
                    const e = createEvent('error', err);
                    q.req.dispatchEvent(e);
                } finally {
                    // Fire an error event for the transaction
                    transactionError(err);
                }
            }

            function executeNextRequest () {
                i++;
                if (i >= me.__requests.length) {
                    // All requests in the transaction are done
                    me.__requests = [];
                    if (me.__active) {
                        me.__active = false;
                        transactionFinished();
                    }
                } else {
                    try {
                        q = me.__requests[i];
                        q.op(tx, q.args, success, error, executeNextRequest);
                    } catch (e) {
                        error(e);
                    }
                }
            }

            executeNextRequest();
        },

        function webSqlError (errWebsql) {
            let name, message;
            switch (errWebsql.code) {
            case 4: { // SQLError.QUOTA_ERR
                name = 'QuotaExceededError';
                message = 'The operation failed because there was not enough remaining storage space, or the storage quota was reached and the user declined to give more space to the database.';
                break;
            }
            /*
            // Should a WebSQL timeout treat as IndexedDB `TransactionInactiveError` or `UnknownError`?
            case 7: { // SQLError.TIMEOUT_ERR
                // All transaction errors abort later, so no need to mark inactive
                name = 'TransactionInactiveError';
                message = 'A request was placed against a transaction which is currently not active, or which is finished (Internal SQL Timeout).';
                break;
            }
            */
            default: {
                name = 'UnknownError';
                message = 'The operation failed for reasons unrelated to the database itself and not covered by any other errors.';
                break;
            }
            }
            message += ' (' + errWebsql.message + ')--(' + errWebsql.code + ')';
            const err = createDOMException(name, message);
            transactionError(err);
        }
    );

    function transactionError (err) {
        logError('Error', 'An error occurred in a transaction', err);

        if (me.__errored) {
            // We've already called "onerror", "onabort", or thrown, so don't do it again.
            return;
        }

        me.__errored = true;

        if (!me.__active) {
            // The transaction has already completed, so we can't call "onerror" or "onabort".
            // So throw the error instead.
            throw err;
        }

        try {
            me.__error = err;
            const evt = createEvent('error');
            me.dispatchEvent(evt);
            me.db.dispatchEvent(createEvent('error'));
        } finally {
            me.__storeClones = {};
            me.abort();
        }
    }

    function transactionFinished () {
        CFG.DEBUG && console.log('Transaction completed');
        const evt = createEvent('complete');
        try {
            me.dispatchEvent(createEvent('__beforecomplete'));
            me.dispatchEvent(evt);
            me.dispatchEvent(createEvent('__complete'));
        } catch (e) {
            // An error occurred in the "oncomplete" handler.
            // It's too late to call "onerror" or "onabort". Throw a global error instead.
            // (this may seem odd/bad, but it's how all native IndexedDB implementations work)
            me.__errored = true;
            throw e;
        } finally {
            me.__storeClones = {};
        }
    }
};

/**
 * Creates a new IDBRequest for the transaction.
 * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__createRequest = function (source) {
    const request = new IDBRequest();
    request.__source = source !== undefined ? source : this.db;
    request.__transaction = this;
    return request;
};

/**
 * Adds a callback function to the transaction queue
 * @param {function} callback
 * @param {*} args
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__addToTransactionQueue = function (callback, args, source) {
    const request = this.__createRequest(source);
    this.__pushToQueue(request, callback, args);
    return request;
};

/**
 * Adds an IDBRequest to the transaction queue
 * @param {IDBRequest} request
 * @param {function} callback
 * @param {*} args
 * @protected
 */
IDBTransaction.prototype.__pushToQueue = function (request, callback, args) {
    this.__assertActive();
    this.__requests.push({
        'op': callback,
        'args': args,
        'req': request
    });
};

IDBTransaction.prototype.__assertActive = function () {
    if (!this.__active) {
        throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

IDBTransaction.prototype.__assertWritable = function () {
    if (this.mode === 'readonly') {
        throw createDOMException('ReadOnlyError', 'The transaction is read only');
    }
};

IDBTransaction.prototype.__assertVersionChange = function () {
    IDBTransaction.__assertVersionChange(this);
};

/**
 * Returns the specified object store.
 * @param {string} objectStoreName
 * @returns {IDBObjectStore}
 */
IDBTransaction.prototype.objectStore = function (objectStoreName) {
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    if (!this.__active) {
        throw createDOMException('InvalidStateError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
    if (this.__objectStoreNames.indexOf(objectStoreName) === -1) {
        throw createDOMException('NotFoundError', objectStoreName + ' is not participating in this transaction');
    }
    const store = this.db.__objectStores[objectStoreName];
    if (!store) {
        throw createDOMException('NotFoundError', objectStoreName + ' does not exist in ' + this.db.name);
    }

    if (!this.__storeClones[objectStoreName]) {
        this.__storeClones[objectStoreName] = IDBObjectStore.__clone(store, this);
    }
    return this.__storeClones[objectStoreName];
};

IDBTransaction.prototype.abort = function () {
    const me = this;
    CFG.DEBUG && console.log('The transaction was aborted', me);
    if (!this.__active) {
        throw createDOMException('InvalidStateError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
    me.__active = false;
    me.__storeClones = {};
    const evt = createEvent('abort');

    // Fire the "onabort" event asynchronously, so errors don't bubble
    setTimeout(() => {
        me.dispatchEvent(evt);
    }, 0);
};
IDBTransaction.prototype.toString = function () {
    return '[object IDBTransaction]';
};

IDBTransaction.__assertVersionChange = function (tx) {
    if (!tx || tx.mode !== 'versionchange') {
        throw createDOMException('InvalidStateError', 'Not a version transaction');
    }
};
IDBTransaction.__assertNotVersionChange = function (tx) {
    if (tx && tx.mode === 'versionchange') {
        throw createDOMException('InvalidStateError', 'Cannot be called during a version transaction');
    }
};

IDBTransaction.__assertActive = function (tx) {
    if (!tx || !tx.__active) {
        throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

util.defineReadonlyProperties(IDBTransaction.prototype, ['objectStoreNames', 'mode', 'db', 'error']);

Object.assign(IDBTransaction.prototype, EventTarget.prototype);

export default IDBTransaction;

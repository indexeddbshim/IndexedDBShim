import {createEvent} from './Event.js';
import {logError, findError, DOMException, createDOMException} from './DOMException.js';
import {IDBRequest} from './IDBRequest.js';
import util from './util.js';
import IDBObjectStore from './IDBObjectStore.js';
import CFG from './cfg.js';
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
    this.__storeNames = storeNames;
    this.mode = mode;
    this.db = db;
    this.error = null;
    this.onabort = this.onerror = this.oncomplete = null;

    // Kick off the transaction as soon as all synchronous code is done.
    const me = this;
    setTimeout(function () { me.__executeRequests(); }, 0);
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
            let q = null, i = 0;

            function success (result, req) {
                if (req) {
                    q.req = req;// Need to do this in case of cursors
                }
                q.req.readyState = 'done';
                q.req.result = result;
                delete q.req.error;
                const e = createEvent('success');
                util.callback('onsuccess', q.req, e);
                i++;
                executeNextRequest();
            }

            function error (tx, err) {
                err = findError(arguments);
                try {
                    // Fire an error event for the current IDBRequest
                    q.req.readyState = 'done';
                    q.req.error = err || DOMException;
                    q.req.result = undefined;
                    const e = createEvent('error', err);
                    util.callback('onerror', q.req, e);
                } finally {
                    // Fire an error event for the transaction
                    transactionError(err);
                }
            }

            function executeNextRequest () {
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
                        q.op(tx, q.args, success, error);
                    } catch (e) {
                        error(e);
                    }
                }
            }

            executeNextRequest();
        },

        function webSqlError (err) {
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
            me.error = err;
            const evt = createEvent('error');
            util.callback('onerror', me, evt);
            util.callback('onerror', me.db, evt);
        } finally {
            me.abort();
        }
    }

    function transactionFinished () {
        CFG.DEBUG && console.log('Transaction completed');
        const evt = createEvent('complete');
        try {
            util.callback('oncomplete', me, evt);
            util.callback('__oncomplete', me, evt);
        } catch (e) {
            // An error occurred in the "oncomplete" handler.
            // It's too late to call "onerror" or "onabort". Throw a global error instead.
            // (this may seem odd/bad, but it's how all native IndexedDB implementations work)
            me.__errored = true;
            throw e;
        }
    }
};

/**
 * Creates a new IDBRequest for the transaction.
 * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__createRequest = function () {
    const request = new IDBRequest();
    request.source = this.db;
    request.transaction = this;
    return request;
};

/**
 * Adds a callback function to the transaction queue
 * @param {function} callback
 * @param {*} args
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__addToTransactionQueue = function (callback, args) {
    const request = this.__createRequest();
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
    if (this.mode === IDBTransaction.READ_ONLY) {
        throw createDOMException('ReadOnlyError', 'The transaction is read only');
    }
};

IDBTransaction.prototype.__assertVersionChange = function () {
    IDBTransaction.__assertVersionChange(this);
};

IDBTransaction.__assertVersionChange = function (tx) {
    if (!tx || tx.mode !== IDBTransaction.VERSION_CHANGE) {
        throw createDOMException('InvalidStateError', 'Not a version transaction');
    }
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
    if (this.__storeNames.indexOf(objectStoreName) === -1 && this.mode !== IDBTransaction.VERSION_CHANGE) {
        throw createDOMException('NotFoundError', objectStoreName + ' is not participating in this transaction');
    }
    const store = this.db.__objectStores[objectStoreName];
    if (!store) {
        throw createDOMException('NotFoundError', objectStoreName + ' does not exist in ' + this.db.name);
    }

    return IDBObjectStore.__clone(store, this);
};

IDBTransaction.prototype.abort = function () {
    const me = this;
    CFG.DEBUG && console.log('The transaction was aborted', me);
    me.__active = false;
    const evt = createEvent('abort');

    // Fire the "onabort" event asynchronously, so errors don't bubble
    setTimeout(function () {
        util.callback('onabort', me, evt);
    }, 0);
};

Object.assign(IDBTransaction.prototype, EventTarget.prototype);

IDBTransaction.READ_ONLY = 'readonly';
IDBTransaction.READ_WRITE = 'readwrite';
IDBTransaction.VERSION_CHANGE = 'versionchange';

export default IDBTransaction;

import {EventTargetFactory} from 'eventtargeter';
import SyncPromise from 'sync-promise-expanded';
import {createEvent} from './Event.js';
import {logError, findError, webSQLErrback, createDOMException} from './DOMException.js';
import {IDBRequest} from './IDBRequest.js';
import * as util from './util.js';
import IDBObjectStore from './IDBObjectStore.js';
import CFG from './CFG.js';

let uniqueID = 0;
const listeners = ['onabort', 'oncomplete', 'onerror'];
const readonlyProperties = ['objectStoreNames', 'mode', 'db', 'error'];

/* eslint-disable jsdoc/check-param-names */
/**
 * The IndexedDB Transaction.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
 * @param {IDBDatabase} db
 * @param {string[]} storeNames
 * @param {string} mode
 * @class
 */
function IDBTransaction () {
    /* eslint-enable jsdoc/check-param-names */
    throw new TypeError('Illegal constructor');
}
const IDBTransactionAlias = IDBTransaction;
/**
 *
 * @param {} db
 * @param {} storeNames
 * @param {} mode
 * @returns {IDBTransaction}
 */
IDBTransaction.__createInstance = function (db, storeNames, mode) {
    /**
     * @class
     */
    function IDBTransaction () {
        const me = this;
        me[Symbol.toStringTag] = 'IDBTransaction';
        util.defineReadonlyProperties(me, readonlyProperties);
        me.__id = ++uniqueID; // for debugging simultaneous transactions
        me.__active = true;
        me.__running = false;
        me.__errored = false;
        me.__requests = [];
        me.__objectStoreNames = storeNames;
        me.__mode = mode;
        me.__db = db;
        me.__error = null;
        me.__setOptions({
            legacyOutputDidListenersThrowFlag: true // Event hook for IndexedB
        });

        readonlyProperties.forEach((readonlyProp) => {
            Object.defineProperty(this, readonlyProp, {
                configurable: true
            });
        });
        util.defineListenerProperties(this, listeners);
        me.__storeHandles = {};

        // Kick off the transaction as soon as all synchronous code is done
        setTimeout(() => { me.__executeRequests(); }, 0);
    }
    IDBTransaction.prototype = IDBTransactionAlias.prototype;
    return new IDBTransaction();
};

IDBTransaction.prototype = EventTargetFactory.createInstance({
    defaultSync: true,
    // Ensure EventTarget preserves our properties
    extraProperties: ['complete']
});

/**
 *
 * @param {} err
 * @param {} cb
 * @returns {void}
 */
IDBTransaction.prototype.__transFinishedCb = function (err, cb) {
    cb(Boolean(err));
};
/**
 * @returns {void}
 */
IDBTransaction.prototype.__executeRequests = function () {
    const me = this;
    if (me.__running) {
        CFG.DEBUG && console.log('Looks like the request set is already running', me.mode);
        return;
    }

    me.__running = true;

    me.db.__db[me.mode === 'readonly' ? 'readTransaction' : 'transaction']( // `readTransaction` is optimized, at least in `node-websql`
        function executeRequests (tx) {
            me.__tx = tx;
            let q = null, i = -1;

            /**
             * @typedef {any} IDBRequestResult
             */

            /**
             * @param {IDBRequestResult} result
             * @param {IDBRequest} req
             * @returns {void}
             */
            function success (result, req) {
                if (me.__errored || me.__requestsFinished) {
                    // We've already called "onerror", "onabort", or thrown within the transaction, so don't do it again.
                    return;
                }
                if (req) {
                    q.req = req; // Need to do this in case of cursors
                }
                if (q.req.__done) { // Avoid continuing with aborted requests
                    return;
                }
                q.req.__done = true;
                q.req.__result = result;
                q.req.__error = null;

                me.__active = true;
                const e = createEvent('success');
                q.req.dispatchEvent(e);
                // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
                if (e.__legacyOutputDidListenersThrowError) {
                    logError('Error', 'An error occurred in a success handler attached to request chain', e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
                    // me.__active = false;
                    me.__abortTransaction(createDOMException('AbortError', 'A request was aborted (in user handler after success).'));
                    return;
                }
                executeNextRequest();
            }

            /**
             * @param {[tx: SQLTransaction, err: SQLError]} args
             * @returns {void}
             */
            function error (...args /* tx, err */) {
                if (me.__errored || me.__requestsFinished) {
                    // We've already called "onerror", "onabort", or thrown within
                    //  the transaction, so don't do it again.
                    return;
                }
                if (q.req && q.req.__done) { // Avoid continuing with aborted requests
                    return;
                }
                const err = findError(args);
                if (!q.req) {
                    me.__abortTransaction(err);
                    return;
                }

                // Fire an error event for the current IDBRequest
                q.req.__done = true;
                q.req.__error = err;
                q.req.__result = undefined; // Must be undefined if an error per `result` getter
                q.req.addLateEventListener('error', function (e) {
                    if (e.cancelable && e.defaultPrevented && !e.__legacyOutputDidListenersThrowError) {
                        executeNextRequest();
                    }
                });
                q.req.addDefaultEventListener('error', function () {
                    me.__abortTransaction(q.req.__error);
                });

                me.__active = true;
                const e = createEvent('error', err, {bubbles: true, cancelable: true});
                q.req.dispatchEvent(e);
                // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
                if (e.__legacyOutputDidListenersThrowError) {
                    logError('Error', 'An error occurred in an error handler attached to request chain', e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
                    e.preventDefault(); // Prevent 'error' default as steps indicate we should abort with `AbortError` even without cancellation
                    me.__abortTransaction(createDOMException('AbortError', 'A request was aborted (in user handler after error).'));
                }
            }

            /**
             * @returns {void}
             */
            function executeNextRequest () {
                if (me.__errored || me.__requestsFinished) {
                    // We've already called "onerror", "onabort", or thrown within the transaction, so don't do it again.
                    return;
                }
                i++;
                if (i >= me.__requests.length) {
                    // All requests in the transaction are done
                    me.__requests = [];
                    if (me.__active) {
                        requestsFinished();
                    }
                } else {
                    try {
                        q = me.__requests[i];
                        if (!q.req) {
                            q.op(tx, q.args, executeNextRequest, error);
                            return;
                        }
                        if (q.req.__done) { // Avoid continuing with aborted requests
                            return;
                        }
                        q.op(tx, q.args, success, error, executeNextRequest);
                    } catch (e) {
                        error(e);
                    }
                }
            }

            executeNextRequest();
        },
        function webSQLError (webSQLErr) {
            if (webSQLErr === true) { // Not a genuine SQL error
                return;
            }
            const err = webSQLErrback(webSQLErr);
            me.__abortTransaction(err);
        },
        function () {
            // For Node, we don't need to try running here as we can keep
            //   the transaction running long enough to rollback (in the
            //   next (non-standard) callback for this transaction call)
            if (me.__transFinishedCb !== IDBTransaction.prototype.__transFinishedCb) { // Node
                return;
            }
            if (!me.__transactionEndCallback && !me.__requestsFinished) {
                me.__transactionFinished = true;
                return;
            }
            if (me.__transactionEndCallback && !me.__completed) {
                me.__transFinishedCb(me.__errored, me.__transactionEndCallback);
            }
        },
        function (currentTask, err, done, rollback, commit) {
            if (currentTask.readOnly || err) {
                return true;
            }
            me.__transFinishedCb = function (err, cb) {
                if (err) {
                    rollback(err, cb);
                } else {
                    commit(cb);
                }
            };
            if (me.__transactionEndCallback && !me.__completed) {
                me.__transFinishedCb(me.__errored, me.__transactionEndCallback);
            }
            return false;
        }
    );

    /**
     * @returns {void}
     */
    function requestsFinished () {
        me.__active = false;
        me.__requestsFinished = true;

        /**
         * @throws {Error}
         * @returns {void}
         */
        function complete () {
            me.__completed = true;
            CFG.DEBUG && console.log('Transaction completed');
            const evt = createEvent('complete');
            try {
                me.__internal = true;
                me.dispatchEvent(evt);
                me.__internal = false;
                me.dispatchEvent(createEvent('__complete'));
            } catch (e) {
                me.__internal = false;
                // An error occurred in the "oncomplete" handler.
                // It's too late to call "onerror" or "onabort". Throw a global error instead.
                // (this may seem odd/bad, but it's how all native IndexedDB implementations work)
                me.__errored = true;
                throw e;
            } finally {
                me.__storeHandles = {};
            }
        }
        if (me.mode === 'readwrite') {
            if (me.__transactionFinished) {
                complete();
                return;
            }
            me.__transactionEndCallback = complete;
            return;
        }
        if (me.mode === 'readonly') {
            complete();
            return;
        }
        const ev = createEvent('__beforecomplete');
        ev.complete = complete;
        me.dispatchEvent(ev);
    }
};

/**
 * Creates a new IDBRequest for the transaction.
 * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}.
 * @param {IDBDatabase} source
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__createRequest = function (source) {
    const me = this;
    const request = IDBRequest.__createInstance();
    request.__source = source !== undefined ? source : me.db;
    request.__transaction = me;
    return request;
};

/**
 * @typedef {(
 *   tx: SQLTransaction,
 *   args: ObjectArray,
 *   success: () => void,
 *   error: (tx: SQLTransaction, err: SQLError) => void
 * ) => void} SQLCallback
 */

/**
 * Adds a callback function to the transaction queue.
 * @param {SQLCallback} callback
 * @param {ObjectArray} args
 * @param {IDBDatabase} source
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__addToTransactionQueue = function (callback, args, source) {
    const request = this.__createRequest(source);
    this.__pushToQueue(request, callback, args);
    return request;
};

/**
 * Adds a callback function to the transaction queue without generating a
 *   request.
 * @param {SQLCallback} callback
 * @param {ObjectArray} args
 * @param {IDBDatabase} source
 * @returns {void}
 * @protected
 */
IDBTransaction.prototype.__addNonRequestToTransactionQueue = function (callback, args, source) {
    this.__pushToQueue(null, callback, args);
};

/**
 * Adds an IDBRequest to the transaction queue.
 * @param {IDBRequest} request
 * @param {SQLCallback} callback
 * @param {ObjectArray} args
 * @protected
 * @returns {void}
 */
IDBTransaction.prototype.__pushToQueue = function (request, callback, args) {
    this.__assertActive();
    this.__requests.push({
        op: callback,
        args,
        req: request
    });
};

/**
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.prototype.__assertActive = function () {
    if (!this.__active) {
        throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

/**
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.prototype.__assertWritable = function () {
    if (this.mode === 'readonly') {
        throw createDOMException('ReadOnlyError', 'The transaction is read only');
    }
};

/**
 * @returns {void}
 */
IDBTransaction.prototype.__assertVersionChange = function () {
    IDBTransaction.__assertVersionChange(this);
};

/**
 * Returns the specified object store.
 * @param {string} objectStoreName
 * @returns {IDBObjectStore}
 */
IDBTransaction.prototype.objectStore = function (objectStoreName) {
    const me = this;
    if (!(me instanceof IDBTransaction)) {
        throw new TypeError('Illegal invocation');
    }
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    IDBTransaction.__assertNotFinished(me);
    if (me.__objectStoreNames.indexOf(objectStoreName) === -1) { // eslint-disable-line unicorn/prefer-includes
        throw createDOMException('NotFoundError', objectStoreName + ' is not participating in this transaction');
    }
    const store = me.db.__objectStores[objectStoreName];
    if (!store) {
        throw createDOMException('NotFoundError', objectStoreName + ' does not exist in ' + me.db.name);
    }

    if (!me.__storeHandles[objectStoreName] ||
        // These latter conditions are to allow store
        //   recreation to create new clone object
        me.__storeHandles[objectStoreName].__pendingDelete ||
        me.__storeHandles[objectStoreName].__deleted) {
        me.__storeHandles[objectStoreName] = IDBObjectStore.__clone(store, me);
    }
    return me.__storeHandles[objectStoreName];
};

/**
 *
 * @param {} err
 * @returns {void}
 */
IDBTransaction.prototype.__abortTransaction = function (err) {
    const me = this;
    logError('Error', 'An error occurred in a transaction', err);
    if (me.__errored) {
        // We've already called "onerror", "onabort", or thrown, so don't do it again.
        return;
    }
    me.__errored = true;

    if (me.mode === 'versionchange') { // Steps for aborting an upgrade transaction
        me.db.__version = me.db.__oldVersion;
        me.db.__objectStoreNames = me.db.__oldObjectStoreNames;
        me.__objectStoreNames = me.db.__oldObjectStoreNames;
        Object.values(me.db.__objectStores).concat(
            Object.values(me.__storeHandles)
        ).forEach(function (store) {
            // Store was already created so we restore to name before the rename
            if ('__pendingName' in store &&
                me.db.__oldObjectStoreNames.indexOf(store.__pendingName) > -1 // eslint-disable-line unicorn/prefer-includes
            ) {
                store.__name = store.__originalName;
            }
            store.__indexNames = store.__oldIndexNames;
            delete store.__pendingDelete;
            Object.values(store.__indexes).concat(
                Object.values(store.__indexHandles)
            ).forEach(function (index) {
                // Index was already created so we restore to name before the rename
                if ('__pendingName' in index &&
                    store.__oldIndexNames.indexOf(index.__pendingName) > -1 // eslint-disable-line unicorn/prefer-includes
                ) {
                    index.__name = index.__originalName;
                }
                delete index.__pendingDelete;
            });
        });
    }
    me.__active = false; // Setting here and in requestsFinished for https://github.com/w3c/IndexedDB/issues/87

    if (err !== null) {
        me.__error = err;
    }

    if (me.__requestsFinished) {
        // The transaction has already completed, so we can't call "onerror" or "onabort".
        // So throw the error instead.
        setTimeout(() => {
            throw err;
        }, 0);
    }

    /**
     * @param {SQLTransaction} tx
     * @param {SQLError|{code: 0}} errOrResult
     * @returns {void}
     */
    function abort (tx, errOrResult) {
        if (!tx) {
            CFG.DEBUG && console.log('Rollback not possible due to missing transaction', me);
        } else if (errOrResult && typeof errOrResult.code === 'number') {
            CFG.DEBUG && console.log('Rollback erred; feature is probably not supported as per WebSQL', me);
        } else {
            CFG.DEBUG && console.log('Rollback succeeded', me);
        }

        me.dispatchEvent(createEvent('__preabort'));
        me.__requests.filter(function (q, i, arr) { // eslint-disable-line promise/no-promise-in-callback
            return q.req && !q.req.__done && [i, -1].includes(
                arr.map((q) => q.req).lastIndexOf(q.req)
            );
        }).reduce(function (promises, q) {
            // We reduce to a chain of promises to be queued in order, so we cannot
            //  use `Promise.all`, and I'm unsure whether `setTimeout` currently
            //  behaves first-in-first-out with the same timeout so we could
            //  just use a `forEach`.
            return promises.then(function () {
                q.req.__done = true;
                q.req.__result = undefined;
                q.req.__error = createDOMException('AbortError', 'A request was aborted (an unfinished request).');
                const reqEvt = createEvent('error', q.req.__error, {bubbles: true, cancelable: true});
                return new SyncPromise(function (resolve) {
                    setTimeout(() => {
                        q.req.dispatchEvent(reqEvt); // No need to catch errors
                        resolve();
                    });
                });
            });
        }, SyncPromise.resolve()).then(function () { // Also works when there are no pending requests
            const evt = createEvent('abort', err, {bubbles: true, cancelable: false});
            setTimeout(() => {
                me.__abortFinished = true;
                me.dispatchEvent(evt);
                me.__storeHandles = {};
                me.dispatchEvent(createEvent('__abort'));
            });
            return undefined;
        }).catch((err) => {
            console.log('Abort error');
            throw err;
        });
    }

    me.__transFinishedCb(true, function (rollback) {
        if (rollback && me.__tx) { // Not supported in standard SQL (and WebSQL errors should
            //   rollback automatically), but for Node.js, etc., we give chance for
            //   manual aborts which would otherwise not work.
            if (me.mode === 'readwrite') {
                if (me.__transactionFinished) {
                    abort();
                    return;
                }
                me.__transactionEndCallback = abort;
                return;
            }
            try {
                me.__tx.executeSql('ROLLBACK', [], abort, abort); // Not working in some circumstances, even in Node
            } catch (err) {
                // Browser errs when transaction has ended and since it most likely already erred here,
                //   we call to abort
                abort();
            }
        } else {
            abort(null, {code: 0});
        }
    });
};

/**
 * @returns {void}
 */
IDBTransaction.prototype.abort = function () {
    const me = this;
    if (!(me instanceof IDBTransaction)) {
        throw new TypeError('Illegal invocation');
    }
    CFG.DEBUG && console.log('The transaction was aborted', me);
    IDBTransaction.__assertNotFinished(me);
    me.__abortTransaction(null);
};

IDBTransaction.prototype[Symbol.toStringTag] = 'IDBTransactionPrototype';

/**
 *
 * @param {} tx
 * @returns {void}
 */
IDBTransaction.__assertVersionChange = function (tx) {
    if (!tx || tx.mode !== 'versionchange') {
        throw createDOMException('InvalidStateError', 'Not a version transaction');
    }
};
/**
 *
 * @param {} tx
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.__assertNotVersionChange = function (tx) {
    if (tx && tx.mode === 'versionchange') {
        throw createDOMException('InvalidStateError', 'Cannot be called during a version transaction');
    }
};

/**
 *
 * @param {} tx
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.__assertNotFinished = function (tx) {
    if (!tx || tx.__completed || tx.__abortFinished || tx.__errored) {
        throw createDOMException('InvalidStateError', 'Transaction finished by commit or abort');
    }
};

// object store methods behave differently: see https://github.com/w3c/IndexedDB/issues/192
/**
 *
 * @param {} tx
 * @returns {void}
 */
IDBTransaction.__assertNotFinishedObjectStoreMethod = function (tx) {
    try {
        IDBTransaction.__assertNotFinished(tx);
    } catch (err) {
        if (tx && !tx.__completed && !tx.__abortFinished) {
            throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
        }
        throw err;
    }
};

/**
 *
 * @param {} tx
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.__assertActive = function (tx) {
    if (!tx || !tx.__active) {
        throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

/**
* Used by our `EventTarget.prototype` library to implement bubbling/capturing.
* @returns {IDBDatabase}
*/
IDBTransaction.prototype.__getParent = function () {
    return this.db;
};

util.defineOuterInterface(IDBTransaction.prototype, listeners);
util.defineReadonlyOuterInterface(IDBTransaction.prototype, readonlyProperties);

Object.defineProperty(IDBTransaction.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: IDBTransaction
});

Object.defineProperty(IDBTransaction, 'prototype', {
    writable: false
});

export default IDBTransaction;

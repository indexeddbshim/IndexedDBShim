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
const readonlyProperties = ['objectStoreNames', 'mode', 'durability', 'db', 'error'];

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {{
 *   op: SQLCallback,
 *   args: ObjectArray,
 *   req: import('./IDBRequest.js').IDBRequestFull|null
 * }} RequestInfo
 */

/**
 * @typedef {EventTarget & {
 *   mode: "readonly"|"readwrite"|"versionchange",
 *   durability: "default"|"strict"|"relaxed",
 *   db: import('./IDBDatabase.js').IDBDatabaseFull,
 *   on__abort: () => void,
 *   on__complete: () => void,
 *   on__beforecomplete: (ev: Event & {
 *     complete: () => void
 *   }) => void,
 *   on__preabort: () => void,
 *   __abortTransaction: (err: Error|DOMException|null) => void,
 *   __executeRequests: () => void,
 *   __tx: import('websql-configurable/lib/websql/WebSQLTransaction.js').default,
 *   __id: Integer,
 *   __active: boolean,
 *   __handlerActive: boolean,
 *   __running: boolean,
 *   __errored: boolean,
 *   __committed: boolean,
 *   __requests: RequestInfo[],
 *   __db: import('./IDBDatabase.js').IDBDatabaseFull,
 *   __mode: string,
 *   __durability: string,
 *   __error: null|DOMException|Error,
 *   __objectStoreNames: import('./DOMStringList.js').DOMStringListFull,
 *   __storeHandles: {
 *     [key: string]: import('./IDBObjectStore.js').IDBObjectStoreFull
 *   },
 *   __requestsFinished: boolean,
 *   __transFinishedCb: (err: boolean, cb: ((bool?: boolean) => void)) => void,
 *   __callTransFinishedCb: (err: boolean, cb: ((bool?: boolean) => void)) => void,
 *   __transactionEndCallback: () => void,
 *   __transactionFinished: boolean,
 *   __completed: boolean,
 *   __transFinishedCbFired: boolean,
 *   __internal: boolean,
 *   __abortFinished: boolean,
 *   __createRequest: (
 *     source: import('./IDBDatabase.js').IDBDatabaseFull|
 *       import('./IDBObjectStore.js').IDBObjectStoreFull|
 *       import('./IDBIndex.js').IDBIndexFull|
 *       import('./IDBCursor.js').IDBCursorFull
 *   ) => import('./IDBRequest.js').IDBRequestFull,
 *   __pushToQueue: (
 *     request: import('./IDBRequest.js').IDBRequestFull|null,
 *     callback: SQLCallback,
 *     args?: ObjectArray
 *   ) => void,
 *   __assertActive: () => void,
 *   commit: () => void,
 *   __addNonRequestToTransactionQueue: (
 *     callback: SQLCallback,
 *     args?: ObjectArray
 *   ) => void
 *   __addToTransactionQueue: (
 *     callback: SQLCallback,
 *     args: ObjectArray|undefined,
 *     source: import('./IDBDatabase.js').IDBDatabaseFull|
 *       import('./IDBObjectStore.js').IDBObjectStoreFull|
 *       import('./IDBIndex.js').IDBIndexFull|
 *       import('./IDBCursor.js').IDBCursorFull
 *   ) => import('./IDBRequest.js').IDBRequestFull
 *   __assertWritable: () => void,
 * }} IDBTransactionFull
 */

/**
 * The IndexedDB Transaction.
 * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
 * @class
 * @throws {TypeError}
 */
function IDBTransaction () {
    throw new TypeError('Illegal constructor');
}
const IDBTransactionAlias = IDBTransaction;
/**
 * @param {import('./IDBDatabase.js').IDBDatabaseFull} db
 * @param {import('./DOMStringList.js').DOMStringListFull} storeNames
 * @param {string} mode
 * @param {string} [durability]
 * @returns {IDBTransactionFull}
 */
IDBTransaction.__createInstance = function (db, storeNames, mode, durability = 'default') {
    /**
     * @class
     * @this {IDBTransactionFull}
     */
    function IDBTransaction () {
        const me = this;
        // @ts-expect-error It's ok
        me[Symbol.toStringTag] = 'IDBTransaction';
        util.defineReadonlyProperties(me, readonlyProperties);
        // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Debugging only
        me.__id = ++uniqueID; // for debugging simultaneous transactions
        me.__active = true;
        // Tracks the spec's "active" flag for the purpose of validating new
        //   requests/`commit()`: true only during the initial synchronous
        //   script that created the transaction and during each dispatched
        //   request's synchronous `success`/`error` handler. Deliberately
        //   kept separate from `__active` above, which additionally (and
        //   permanently, once false) signals that request-queue processing
        //   has stopped -- `executeNextRequest` relies on that to know
        //   whether it's still safe to finish the transaction normally.
        me.__handlerActive = true;
        me.__running = false;
        me.__errored = false;
        me.__committed = false;
        me.__requests = [];
        me.__objectStoreNames = storeNames;
        me.__mode = mode;
        me.__durability = durability;
        me.__db = db;
        me.__error = null;
        // @ts-expect-error Part of `ShimEventTarget`
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

    // @ts-expect-error It's ok
    return new IDBTransaction();
};

// @ts-expect-error It's ok
IDBTransaction.prototype = EventTargetFactory.createInstance({
    defaultSync: true,
    // Ensure EventTarget preserves our properties
    extraProperties: ['complete']
});

/**
 *
 * @param {boolean} err
 * @param {(bool: boolean) => void} cb
 * @returns {void}
 */
IDBTransaction.prototype.__transFinishedCb = function (err, cb) {
    cb(Boolean(err));
};

/**
 * In Node, the real (SQL-commit-capable) `__transFinishedCb` is only
 * installed once the underlying WebSQL driver's own SQL-queue-idle check
 * has fired at least once for this transaction (asynchronously, via the
 * `nonstandardTransCb` passed to `db.transaction`/`.readTransaction`).
 * Since our own request processing can now finish synchronously (e.g., a
 * trivial upgrade using a synchronous SQL driver), it is possible to reach
 * transaction completion here before that has happened, in which case
 * `__transFinishedCb` is still the non-committing default above. Calling
 * that default directly would silently skip the actual SQL commit and
 * leave the underlying WebSQL transaction "running" forever, hanging any
 * later transaction on that same database connection. So, if the real
 * callback isn't installed yet, defer and retry until it is.
 * @this {IDBTransactionFull}
 * @param {boolean} err
 * @param {(bool?: boolean) => void} cb
 * @returns {void}
 */
IDBTransaction.prototype.__callTransFinishedCb = function (err, cb) {
    const me = this;
    if (me.__completed || me.__transFinishedCbFired) {
        // Either this transaction's `nonstandardTransCb` installation (see
        //   `__executeRequests`) already found `__transactionEndCallback` set
        //   and fired `__transFinishedCb` itself in the meantime -- a race with
        //   this call's own (possibly `setTimeout`-deferred) retry below -- or
        //   this same call already fired it on an earlier retry. Either way,
        //   don't fire a second commit/rollback for the same transaction.
        //   `__transFinishedCbFired` is checked in addition to `__completed`
        //   because `__completed` isn't set until the resulting SQL commit/
        //   rollback round trip actually finishes, which is too late to stop
        //   the other side from *also* firing while that's still in flight.
        return;
    }
    if (me.__transFinishedCb === IDBTransaction.prototype.__transFinishedCb) {
        // Standard (3-argument) `transaction()`/`readTransaction()` implementations
        //  (browser WebSQL, `cordova-plugin-sqlite-2`, etc.) never invoke the
        //  non-standard 4th callback that installs the real `__transFinishedCb`,
        //  so waiting for it here would defer forever. Detect that via arity
        //  (checking whichever of the two methods this transaction's own mode
        //  actually uses -- see `__executeRequests`) and, if it's not supported,
        //  just call the default (the driver auto-commits on its own).
        const dbConn = me.db && me.db.__db;
        const dbMethodName = me.mode === 'readonly' ? 'readTransaction' : 'transaction';
        const supportsNonstandardTransCb = Boolean(
            dbConn && typeof dbConn[dbMethodName] === 'function' && dbConn[dbMethodName].length >= 4
        );
        if (!supportsNonstandardTransCb) {
            me.__transFinishedCbFired = true;
            me.__transFinishedCb(err, cb);
            return;
        }
        setTimeout(() => {
            me.__callTransFinishedCb(err, cb);
        }, 0);
        return;
    }
    me.__transFinishedCbFired = true;
    me.__transFinishedCb(err, cb);
};
/**
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__executeRequests = function () {
    const me = this;
    if (me.__running) {
        if (CFG.DEBUG) { console.log('Looks like the request set is already running', me.mode); }
        return;
    }

    // The synchronous script that created this transaction (and
    //   synchronously queued whatever requests it wanted to) has now
    //   definitely returned control to the event loop -- this callback was
    //   itself deferred via `setTimeout(..., 0)` for exactly that reason.
    //   So the transaction's initial "active" window closes here, until the
    //   first dispatched request's handler (see `success`/`error` below)
    //   reopens it.
    me.__handlerActive = false;

    me.__running = true;

    me.db.__db[me.mode === 'readonly' ? 'readTransaction' : 'transaction']( // `readTransaction` is optimized, at least in `node-websql`
        function executeRequests (tx) {
            me.__tx = tx;
            /** @type {RequestInfo} */
            let q,
                i = -1;

            /**
             * @typedef {any} IDBRequestResult
             */

            /**
             * @param {IDBRequestResult} [result]
             * @param {import('./IDBRequest.js').IDBRequestFull} [req]
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
                if (!q.req) { // TS guard
                    return;
                }
                if (q.req.__done) { // Avoid continuing with aborted requests
                    return;
                }
                q.req.__done = true;
                q.req.__result = result;
                q.req.__error = null;

                me.__active = true;
                me.__handlerActive = true;
                const e = createEvent('success');
                q.req.dispatchEvent(e);
                // Do not set __active or __handlerActive flags to false yet:
                //   https://github.com/w3c/IndexedDB/issues/87 -- a follow-up
                //   request queued from an `await`-based continuation of this
                //   one (a microtask, not a further synchronous call within
                //   this handler) must still pass `__assertActive`'s check of
                //   both flags. `checkQueueEntry` (see `executeNextRequest`)
                //   is what actually resets `__handlerActive`, once it's
                //   confirmed (across its own bounded microtask wait) that no
                //   such continuation queued anything.
                if (e.__legacyOutputDidListenersThrowError) {
                    logError('Error', 'An error occurred in a success handler attached to request chain', e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
                    if (!me.__committed) { // An explicit `commit()` locks in the commit, so errors thrown afterward must not abort it
                        // me.__active = false;
                        me.__abortTransaction(createDOMException('AbortError', 'A request was aborted (in user handler after success).'));
                        return;
                    }
                }
                util.runContinuationSafely(advanceAfterDispatch);
            }

            /**
             * @param {[
             *   tx: import('websql-configurable/lib/websql/WebSQLTransaction.js').default|DOMException|Error,
             *   err?: Error & {code?: number}
             * ]} args
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
                const err = /** @type {Error|DOMException} */ (findError(args));
                if (!q.req) {
                    me.__abortTransaction(err);
                    return;
                }

                // Fire an error event for the current IDBRequest
                q.req.__done = true;
                q.req.__error = err;
                q.req.__result = undefined; // Must be undefined if an error per `result` getter
                q.req.addLateEventListener(
                    'error',
                    /**
                     * @param {Event & {__legacyOutputDidListenersThrowError: boolean}} e
                     * @returns {void}
                     */
                    function (e) {
                        if (e.cancelable && e.defaultPrevented && !e.__legacyOutputDidListenersThrowError) {
                            advanceAfterDispatch();
                        }
                    }
                );
                q.req.addDefaultEventListener('error', function () {
                    if (!q.req) { // TS guard
                        return;
                    }
                    me.__abortTransaction(q.req.__error);
                });

                me.__active = true;
                me.__handlerActive = true;
                const e = createEvent('error', err, {bubbles: true, cancelable: true});
                q.req.dispatchEvent(e);
                // Do not set __active or __handlerActive flags to false yet --
                //   see the matching comment in `success`, above.
                if (e.__legacyOutputDidListenersThrowError) {
                    logError('Error', 'An error occurred in an error handler attached to request chain', e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
                    e.preventDefault(); // Prevent 'error' default as steps indicate we should abort with `AbortError` even without cancellation
                    if (me.__committed) { // An explicit `commit()` locks in the commit, so errors thrown afterward must not abort it
                        util.runContinuationSafely(advanceAfterDispatch);
                        return;
                    }
                    me.__abortTransaction(createDOMException('AbortError', 'A request was aborted (in user handler after error).'));
                }
            }

            /**
             * Sets up `q` for the current queue index and, for a genuine
             *   request (not one of our internal non-request queue entries),
             *   deactivates the transaction for the duration of its
             *   (possibly async) work. Returns `false` if there's nothing to
             *   do (an already-aborted request).
             * @returns {boolean}
             */
            function prepareNextRequest () {
                q = me.__requests[i];
                if (!q.req) {
                    // Non-standard, non-`IDBRequest` queue entries (e.g.
                    //   the internal `onupgradeneeded` dispatch op in
                    //   `IDBFactory.js`) dispatch straight to user code
                    //   without going through `success`/`error` below --
                    //   unlike those, they never restore `__active`/
                    //   `__handlerActive` to `true` before doing so, so
                    //   they rely on the flags being left as they are
                    //   (not reset here).
                    return true;
                }
                if (q.req.__done) { // Avoid continuing with aborted requests
                    return false;
                }
                // We're now handing off to (possibly async) work for
                //   this request, so the transaction is no longer active
                //   until its own `success`/`error` dispatch (below)
                //   sets these flags again -- a check that happens to
                //   run during this gap (e.g. `commit()` called from an
                //   unrelated `setTimeout`) must see the transaction as
                //   inactive, per spec.
                me.__active = false;
                me.__handlerActive = false;
                return true;
            }

            /**
             * @returns {void}
             */
            function launchQueuedOp () {
                try {
                    if (!q.req) {
                        q.op(tx, q.args, () => util.runContinuationSafely(executeNextRequest), error);
                        return;
                    }
                    q.op(tx, q.args, success, error, executeNextRequest);
                } catch (e) {
                    error(/** @type {Error} */ (e));
                }
            }

            /**
             * @returns {void}
             */
            function runQueuedRequest () {
                if (!prepareNextRequest()) {
                    return;
                }
                launchQueuedOp();
            }

            /**
             * A request's `success`/`error` event fires (and any `await`-based
             *   continuation watching it resolves) before this check runs, since
             *   that dispatch happens synchronously above, one call frame up.
             *   If such a continuation queues a follow-up request, it does so
             *   from a microtask -- so if the JS-level queue is merely found
             *   empty here, that doesn't yet mean no more work is coming, only
             *   that none has been queued *yet*. Re-check across a small, bounded
             *   number of further microtask turns (letting a typical `await`
             *   chain like `await store.put(...); await store.get(...)` catch
             *   up) before finally concluding the transaction is genuinely done.
             *   Applies to `readonly` transactions too, not just `readwrite`/
             *   `versionchange`: a `readonly` transaction's `complete` event
             *   can otherwise fire synchronously, immediately after its last
             *   request's `success` handler returns -- before an `await`-based
             *   consumer of that same handler (e.g. one that resolves a
             *   promise from within `onsuccess` and only attaches `oncomplete`
             *   afterward) ever gets a turn to run, so it can miss `complete`
             *   entirely. `readonly` requests don't hold a real SQL
             *   transaction open, though, so there's no file-lock/connection
             *   collision risk in waiting the same bounded amount here.
             * @param {number} attemptsLeft
             * @returns {void}
             */
            function checkQueueEntry (attemptsLeft) {
                if (me.__errored || me.__requestsFinished) {
                    return;
                }
                if (i < me.__requests.length) {
                    runQueuedRequest();
                    return;
                }
                if (attemptsLeft <= 0) {
                    // All requests in the transaction are done
                    me.__requests = [];
                    if (me.__active) {
                        requestsFinished();
                    }
                    return;
                }
                queueMicrotask(() => {
                    checkQueueEntry(attemptsLeft - 1);
                });
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
                    checkQueueEntry(10);
                    return;
                }
                runQueuedRequest();
            }

            /**
             * Same as `executeNextRequest`, but used specifically as the
             *   continuation from a request's own `success`/`error` dispatch
             *   (see call sites above): gives same-tick microtasks scheduled
             *   from within that handler (e.g. a plain
             *   `Promise.resolve().then(...)`) a chance to run -- and still
             *   observe the transaction as active -- before we deactivate it
             *   again for the next queued request, per
             *   https://github.com/w3c/IndexedDB/issues/87.
             *
             *   This is safe for `readonly` transactions too only because
             *   `__executeRequests` now passes a `nonstandardTransCb` to
             *   `readTransaction()` (matching `.transaction()`) and
             *   `requestsFinished` defers `readonly` completion through
             *   `__transactionEndCallback`/`__callTransFinishedCb` the same
             *   way `readwrite` already did: the WebSQL driver's
             *   "optimized" `readTransaction` path used to finalize the
             *   underlying transaction as soon as no further `executeSql`
             *   call was already in flight or queued, which -- before that
             *   fix -- meant even a microtask-long gap here would let the
             *   driver consider the transaction done, silently dropping
             *   every subsequent queued request (never firing
             *   `success`/`error` for it at all).
             * @returns {void}
             */
            function advanceAfterDispatch () {
                if (me.__errored || me.__requestsFinished) {
                    return;
                }
                i++;
                if (i >= me.__requests.length) {
                    checkQueueEntry(10);
                    return;
                }
                queueMicrotask(() => {
                    if (me.__errored || me.__requestsFinished) {
                        return;
                    }
                    if (!prepareNextRequest()) {
                        return;
                    }
                    launchQueuedOp();
                });
            }

            executeNextRequest();
        },
        function webSQLError (webSQLErr) {
            // @ts-expect-error It's ok
            if (webSQLErr === true) { // Not a genuine SQL error
                return;
            }
            const err = webSQLErrback(/** @type {Error & {code?: number}} */ (webSQLErr));
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
            if (me.__transactionEndCallback && !me.__completed && !me.__transFinishedCbFired) {
                me.__transFinishedCbFired = true;
                me.__transFinishedCb(me.__errored, me.__transactionEndCallback);
            }
        },
        function (currentTask, err, done, rollback, commit) {
            if (err) {
                return true;
            }
            // `readonly` transactions never hold a real SQL transaction open
            //   (see `WebSQLTransaction`'s constructor skipping `BEGIN;` for
            //   them), so there's no commit/rollback round trip to defer --
            //   `done` itself is the "genuinely finished" signal for them,
            //   called synchronously once `requestsFinished` (via
            //   `__callTransFinishedCb`) confirms no further request is
            //   coming.
            me.__transFinishedCb = currentTask.readOnly
                ? function (err, cb) {
                    done(err);
                    if (cb) {
                        cb();
                    }
                }
                : function (err, cb) {
                    if (err) {
                        rollback(err, cb);
                    } else {
                        commit(cb);
                    }
                };
            // Guarded by `__transFinishedCbFired`, not just `__completed`: this
            //   installation can race `IDBTransaction.prototype.__callTransFinishedCb`'s
            //   own `setTimeout` retry (see there) -- both watch for
            //   `__transFinishedCb` to become installed and `__transactionEndCallback`
            //   to become set, and either could observe both conditions first.
            //   `__completed` alone isn't set until the resulting SQL commit/rollback
            //   round trip actually finishes, which is too late to prevent the other
            //   side from *also* firing in the meantime.
            if (me.__transactionEndCallback && !me.__completed && !me.__transFinishedCbFired) {
                me.__transFinishedCbFired = true;
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
        me.__handlerActive = false;
        me.__requestsFinished = true;

        /**
         * @throws {Error}
         * @returns {void}
         */
        function complete () {
            me.__completed = true;
            if (CFG.DEBUG) { console.log('Transaction completed'); }
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
        if (me.mode === 'readwrite' || me.mode === 'readonly') {
            if (me.__transactionFinished) {
                complete();
                return;
            }
            me.__transactionEndCallback = complete;
            // The underlying SQL driver's own "queue empty" check
            //   (`nonstandardTransCb`, above) typically already ran and
            //   installed the real `__transFinishedCb` *before* this point --
            //   it fires synchronously once the last SQL batch's results are
            //   processed, whereas `requestsFinished` can now be reached only
            //   after `checkQueueEntry`'s bounded microtask wait, i.e. later.
            //   When that happens, its check for `me.__transactionEndCallback`
            //   (not yet set at that earlier time) finds nothing to do and
            //   just returns, so nothing else will ever re-trigger the actual
            //   commit unless this explicitly does so now. For `readonly`,
            //   `__transFinishedCb` (installed by the `nonstandardTransCb`
            //   passed to `readTransaction()`, above) just calls the WebSQL
            //   driver's own `done` -- there's no real commit/rollback SQL
            //   step for a `readonly` transaction.
            me.__callTransFinishedCb(me.__errored, complete);
            return;
        }
        const ev = /** @type {Event & {complete: () => void}} */ (
            createEvent('__beforecomplete')
        );
        ev.complete = complete;
        me.dispatchEvent(ev);
    }
};

/**
 * Creates a new IDBRequest for the transaction.
 * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}.
 * @param {import('./IDBDatabase.js').IDBDatabaseFull} source
 * @this {IDBTransactionFull}
 * @returns {IDBRequest}
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
 *   tx: import('websql-configurable/lib/websql/WebSQLTransaction.js').default,
 *   args: ObjectArray,
 *   success: (result?: any, req?: import('./IDBRequest.js').IDBRequestFull) => void,
 *   error: (
 *     tx: import('websql-configurable/lib/websql/WebSQLTransaction.js').default|Error|DOMException,
 *     err?: Error & {code?: number}
 *   ) => void,
 *   executeNextRequest?: () => void
 * ) => void} SQLCallback
 */

/**
 * Adds a callback function to the transaction queue.
 * @param {SQLCallback} callback
 * @param {ObjectArray} args
 * @param {import('./IDBDatabase.js').IDBDatabaseFull|
 *   import('./IDBObjectStore.js').IDBObjectStoreFull|
 *   import('./IDBIndex.js').IDBIndexFull} source
 * @this {IDBTransactionFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
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
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__addNonRequestToTransactionQueue = function (callback, args) {
    this.__pushToQueue(null, callback, args);
};

/**
 * Adds an IDBRequest to the transaction queue.
 * @param {import('./IDBRequest.js').IDBRequestFull|null} request
 * @param {SQLCallback} callback
 * @param {ObjectArray} args
 * @this {IDBTransactionFull}
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
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__assertActive = function () {
    if (!this.__active || !this.__handlerActive || this.__committed) {
        throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

/**
 * @throws {DOMException}
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__assertWritable = function () {
    if (this.mode === 'readonly') {
        throw createDOMException('ReadOnlyError', 'The transaction is read only');
    }
};

/**
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__assertVersionChange = function () {
    IDBTransaction.__assertVersionChange(this);
};

/**
 * Returns the specified object store.
 * @param {string} objectStoreName
 * @this {IDBTransactionFull}
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
    if (me.__objectStoreNames.indexOf(objectStoreName) === -1) { // eslint-disable-line unicorn/prefer-includes -- Not supported
        throw createDOMException('NotFoundError', objectStoreName + ' is not participating in this transaction');
    }
    const store = me.db.__objectStores[objectStoreName];
    if (!store) {
        throw createDOMException('NotFoundError', objectStoreName + ' does not exist in ' + me.db.name);
    }

    if (!Object.hasOwn(me.__storeHandles, objectStoreName) ||
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
 * @param {Error|DOMException|null} err
 * @this {IDBTransactionFull}
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
                me.db.__oldObjectStoreNames.indexOf(/** @type {string} */ (store.__pendingName)) > -1 // eslint-disable-line unicorn/prefer-includes -- Not supported
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
                    store.__oldIndexNames.indexOf(/** @type {string} */ (index.__pendingName)) > -1 // eslint-disable-line unicorn/prefer-includes -- Not supported
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
     * @param {import('websql-configurable/lib/websql/WebSQLTransaction.js').default|null} [tx]
     * @param {import('websql-configurable/lib/websql/WebSQLResultSet.js').default|(Error & {code?: number})|{code: 0}} [errOrResult]
     * @returns {void}
     */
    function abort (tx, errOrResult) {
        if (!tx) {
            if (CFG.DEBUG) { console.log('Rollback not possible due to missing transaction', me); }
        } else if (errOrResult && 'code' in errOrResult && typeof errOrResult.code === 'number') {
            if (CFG.DEBUG) { console.log('Rollback erred; feature is probably not supported as per WebSQL', me); }
        } else if (CFG.DEBUG) { console.log('Rollback succeeded', me); }

        me.dispatchEvent(createEvent('__preabort'));
        me.__requests.filter(function (q, i, arr) { // eslint-disable-line promise/no-promise-in-callback -- Sync promise
            return q.req && !q.req.__done && [i, -1].includes(
                arr.map((q) => q.req).lastIndexOf(q.req)
            );
        }).reduce(function (promises, q) {
            // We reduce to a chain of promises to be queued in order, so we cannot
            //  use `Promise.all`, and I'm unsure whether `setTimeout` currently
            //  behaves first-in-first-out with the same timeout so we could
            //  just use a `forEach`.
            return promises.then(function () {
                if (!q.req) { // TS guard
                    throw new Error('Missing request');
                }
                q.req.__done = true;
                q.req.__result = undefined;
                q.req.__error = createDOMException('AbortError', 'A request was aborted (an unfinished request).');
                const reqEvt = createEvent('error', q.req.__error, {bubbles: true, cancelable: true});
                return new SyncPromise(
                    /** @type {(resolve: (value?: any) => void) => void} */
                    (resolve) => {
                        setTimeout(() => {
                            if (!q.req) { // TS guard
                                throw new Error('Missing request');
                            }
                            q.req.dispatchEvent(reqEvt); // No need to catch errors
                            resolve();
                        }, 0);
                    }
                );
            });
        }, SyncPromise.resolve(undefined)).then(function () { // Also works when there are no pending requests
            const evt = createEvent('abort', err, {bubbles: true, cancelable: false});
            setTimeout(() => {
                me.__abortFinished = true;
                me.dispatchEvent(evt);
                me.__storeHandles = {};
                me.dispatchEvent(createEvent('__abort'));
            }, 0);
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
                me.__tx.executeSql(
                    'ROLLBACK',
                    [],
                    abort,
                    /** @type {import('websql-configurable/lib/websql/WebSQLTransaction.js').SqlErrorCallback} */ (abort)
                ); // Not working in some circumstances, even in Node
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
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.abort = function () {
    const me = this;
    if (!(me instanceof IDBTransaction)) {
        throw new TypeError('Illegal invocation');
    }
    if (CFG.DEBUG) { console.log('The transaction was aborted', me); }
    IDBTransaction.__assertNotFinished(me);
    if (me.__committed) {
        throw createDOMException('InvalidStateError', 'The transaction has already been committed');
    }
    me.__abortTransaction(null);
};

/**
 * @see https://www.w3.org/TR/IndexedDB/#dom-idbtransaction-commit
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.commit = function () {
    const me = this;
    if (!(me instanceof IDBTransaction)) {
        throw new TypeError('Illegal invocation');
    }
    if (!me.__active || !me.__handlerActive || me.__committed) {
        throw createDOMException('InvalidStateError', 'Failed to execute \'commit\' on \'IDBTransaction\': The transaction is not active.');
    }
    if (CFG.DEBUG) { console.log('The transaction was explicitly committed', me); }
    me.__committed = true;
};

IDBTransaction.prototype[Symbol.toStringTag] = 'IDBTransactionPrototype';

/**
 *
 * @param {IDBTransactionFull|null|undefined} tx
 * @returns {void}
 */
IDBTransaction.__assertVersionChange = function (tx) {
    if (!tx || tx.mode !== 'versionchange') {
        throw createDOMException('InvalidStateError', 'Not a version transaction');
    }
};
/**
 *
 * @param {IDBTransactionFull|null} tx
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
 * @param {IDBTransactionFull|null|undefined} tx
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
 * @param {IDBTransactionFull} tx
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
 * @param {IDBTransactionFull|null|undefined} tx
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.__assertActive = function (tx) {
    if (!tx || !tx.__active || tx.__committed) {
        throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

/**
 * Used by our `EventTarget.prototype` library to implement bubbling/capturing.
 * @this {IDBTransactionFull}
 * @returns {import('./IDBDatabase.js').IDBDatabaseFull}
 */
IDBTransaction.prototype.__getParent = function () {
    return this.db;
};

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
util.defineOuterInterface(IDBTransaction.prototype, listeners);
util.defineReadonlyOuterInterface(IDBTransaction.prototype, readonlyProperties);
util.setOperationNames(IDBTransaction.prototype);

Object.defineProperty(IDBTransaction.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: IDBTransaction
});

Object.defineProperty(IDBTransaction, 'prototype', {
    writable: false
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

export default IDBTransaction;

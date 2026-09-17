// Regression test for issue #391: a `readwrite`/`readonly` transaction
// holding more than one request must still fire `success`/`error` for every
// request and eventually `oncomplete`, even when the underlying WebSQL
// driver only exposes the standard 3-argument `transaction()`/
// `readTransaction()` API (browser WebSQL, `cordova-plugin-sqlite-2`,
// etc.), i.e., when the driver never invokes the non-standard 4th
// `nonstandardTransCb` argument that installs the real, commit-capable
// `__transFinishedCb`. A sibling of #383 (see `issue383-standard-driver-
// spec.js`): same root cause, that the standard 3-argument driver surface
// wasn't exercised by requests queued *after* the first one in a
// transaction. Node-only (registered in test-node.js only, not index.html)
// since it needs to wrap `__openDatabase`.
describe('Issue 391: multi-request transactions on a standard (3-argument) WebSQL driver', function () {
    let prevOpenDatabase;

    beforeEach(function () {
        prevOpenDatabase = indexedDB.__openDatabase;
        // Same engine as the harness driver, but exposing only the standard
        //  WebSQL surface (no non-standard 4th `transaction()` callback).
        indexedDB.__openDatabase = function (...args) {
            const db = prevOpenDatabase(...args);
            return {
                get version () { return db.version; },
                transaction (fn, errCb, okCb) { return db.transaction(fn, errCb, okCb); },
                readTransaction (fn, errCb, okCb) { return db.readTransaction(fn, errCb, okCb); }
            };
        };
    });

    afterEach(function () {
        indexedDB.__openDatabase = prevOpenDatabase;
    });

    /**
     * @param {(err: Error|null, db?: IDBDatabase) => void} cb
     * @returns {void}
     */
    function openStoreDb (cb) {
        util.generateDatabaseName(function (err, dbName) {
            if (err) {
                cb(err);
                return;
            }
            const req = indexedDB.open(dbName, 1);
            req.onupgradeneeded = function () {
                req.result.createObjectStore('store');
            };
            req.onerror = req.onblocked = function () {
                cb(req.error || new Error('open() errored or blocked'));
            };
            req.onsuccess = function () {
                cb(null, req.result);
            };
        });
    }

    it('fires success for a second request queued synchronously up front, and completes', function (done) {
        this.timeout(5000);
        openStoreDb(function (err, db) {
            if (err) {
                done(err);
                return;
            }
            const tx = db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            const put1 = store.put('a', 1);
            const put2 = store.put('b', 2);
            put1.onerror = put2.onerror = function (e) {
                done(e.target.error || new Error('put() errored'));
            };
            let completed = false;
            tx.oncomplete = function () {
                completed = true;
            };
            tx.onerror = tx.onabort = function () {
                done(new Error('Transaction errored or aborted'));
            };
            put2.onsuccess = function () {
                setTimeout(function () {
                    expect(completed, 'oncomplete fired').to.equal(true);
                    db.close();
                    done();
                }, 50);
            };
        });
    });

    it('fires success for a follow-up request issued synchronously from the first request\'s onsuccess, and completes', function (done) {
        this.timeout(5000);
        openStoreDb(function (err, db) {
            if (err) {
                done(err);
                return;
            }
            const tx = db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            let completed = false;
            tx.oncomplete = function () {
                completed = true;
            };
            tx.onerror = tx.onabort = function () {
                done(new Error('Transaction errored or aborted'));
            };
            const put1 = store.put('a', 1);
            put1.onerror = function (e) {
                done(e.target.error || new Error('put() errored'));
            };
            put1.onsuccess = function () {
                const put2 = store.put('b', 2);
                put2.onerror = function (e) {
                    done(e.target.error || new Error('put() errored'));
                };
                put2.onsuccess = function () {
                    setTimeout(function () {
                        expect(completed, 'oncomplete fired').to.equal(true);
                        db.close();
                        done();
                    }, 50);
                };
            };
        });
    });

    it('fires success for a follow-up request queued from a microtask (await) continuation, and completes', function (done) {
        this.timeout(5000);
        openStoreDb(function (err, db) {
            if (err) {
                done(err);
                return;
            }
            const tx = db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            let completed = false;
            tx.oncomplete = function () {
                completed = true;
            };
            tx.onerror = tx.onabort = function () {
                done(new Error('Transaction errored or aborted'));
            };

            /**
             * @param {IDBRequest} req
             * @returns {Promise<unknown>}
             */
            function requestToPromise (req) {
                // eslint-disable-next-line promise/avoid-new -- No API
                return new Promise(function (resolve, reject) {
                    req.onsuccess = function () { resolve(req.result); };
                    req.onerror = function () { reject(req.error); };
                });
            }

            (async function () {
                try {
                    await requestToPromise(store.put('a', 1));
                    await requestToPromise(store.put('b', 2));
                } catch (asyncErr) {
                    done(asyncErr);
                    return;
                }
                setTimeout(function () {
                    expect(completed, 'oncomplete fired').to.equal(true);
                    db.close();
                    done();
                }, 50);
            }());
        });
    });
});

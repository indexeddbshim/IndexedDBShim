// Regression test for issue #383: `open()` must fire `onsuccess` after
// `upgradeneeded` even when the underlying WebSQL driver only exposes the
// standard 3-argument `transaction()`/`readTransaction()` API (browser
// WebSQL, `cordova-plugin-sqlite-2`, etc.), i.e., when the driver never
// invokes the non-standard 4th `nonstandardTransCb` argument that installs
// the real, commit-capable `__transFinishedCb`. Node-only (registered in
// test-node.js only, not index.html) since it needs to wrap `__openDatabase`.
describe('Issue 383: open() on a standard (3-argument) WebSQL driver', function () {
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

    it('fires success for an open() that runs upgradeneeded', function (done) {
        util.generateDatabaseName(function (err, dbName) {
            if (err) {
                done(err);
                return;
            }
            const req = indexedDB.open(dbName, 1);
            let upgradeneededFired = false;
            req.onupgradeneeded = function () {
                upgradeneededFired = true;
                req.result.createObjectStore('store');
            };
            req.onerror = req.onblocked = function () {
                done(req.error || new Error('open() errored or blocked'));
            };
            req.onsuccess = function () {
                if (!upgradeneededFired) {
                    done(new Error('upgradeneeded did not fire'));
                    return;
                }
                req.result.close();
                done();
            };
        });
    });
});

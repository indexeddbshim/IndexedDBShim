// Forces the shared `sysdb` singleton to be (re)created against a driver
//   that only exposes the *standard* 3-argument WebSQL `transaction()`/
//   `readTransaction()` API (no non-standard 4th `nonstandardTransCb`
//   argument) -- see `issue383-standard-driver-spec.js` for the same
//   technique applied to a regular (non-sysdb) connection. Since `sysdb` is
//   only recreated when `CFG.memoryDatabase` changes, switching it to a
//   fresh, isolated in-memory value for the duration of these tests (and
//   restoring it afterward) lets `sysdb` pick up the wrapped driver without
//   ever touching the real, shared, file-backed `sysdb` used by every other
//   test.
describe('IDBFactory upgrade commit/rollback on a standard (3-argument) sysdb driver', function () {
    'use strict';

    if (env.isNative) { return; }

    let prevOpenDatabase, memoryDatabase;
    beforeEach(function (done) {
        prevOpenDatabase = shimIndexedDB.__openDatabase;
        memoryDatabase = shimIndexedDB.__getConfig('memoryDatabase');
        // `sysdb` is only recreated when `CFG.memoryDatabase` *changes
        //   value*, not merely when it's toggled off and back to the same
        //   string -- so if an earlier test (in this file or another) left
        //   the shared `:memory:` `sysdb` permanently stuck mid-transaction
        //   (e.g. `deleteDatabase-spec.js`'s misbehaving-cached-connection
        //   tests), simply setting `:memory:` again here would silently
        //   reuse that same stuck instance. Routing through a disposable
        //   value first (with a normal, fully-completing open+close)
        //   guarantees `sysdb`'s stored setting differs from `:memory:`, so
        //   switching to `:memory:` immediately after is always treated as
        //   a real change and forces fresh recreation.
        //   The disposable value must match `CFG.memoryDatabase`'s
        //   validator (`:memory:`, or a `file::memory:[?queryString]`
        //   URL-like string) -- any such non-`:memory:` value is still
        //   treated by the underlying driver as a real, lockable file
        //   path, so the resulting one-off `.sqlite`-less file is swept up
        //   automatically by `package.json`'s `clean-mocha` script (globs
        //   for `file::memory:?*`).
        // eslint-disable-next-line sonarjs/pseudo-random -- Testing
        const resetPath = 'file::memory:?D_delete-sysdb-reset-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        shimIndexedDB.__setConfig('memoryDatabase', resetPath);
        // eslint-disable-next-line sonarjs/pseudo-random -- Testing
        const resetReq = shimIndexedDB.open('sysdb-reset-' + Date.now() + '-' + Math.random().toString(36).slice(2), 1);
        resetReq.onsuccess = function () {
            resetReq.result.close();
            shimIndexedDB.__setConfig('memoryDatabase', ':memory:');
            shimIndexedDB.__openDatabase = function (...args) {
                const db = prevOpenDatabase(...args);
                return {
                    get version () { return db.version; },
                    transaction (fn, errCb, okCb) { return db.transaction(fn, errCb, okCb); },
                    readTransaction (fn, errCb, okCb) { return db.readTransaction(fn, errCb, okCb); }
                };
            };
            done();
        };
        resetReq.onerror = resetReq.onblocked = function (e) {
            done((e.target && e.target.error) || new Error('sysdb reset failed'));
        };
    });

    afterEach(function () {
        shimIndexedDB.__openDatabase = prevOpenDatabase;
        // Recreates `sysdb` again on next use, this time against the real
        //   driver and the real, file-backed sysdb.
        shimIndexedDB.__setConfig('memoryDatabase', memoryDatabase);
    });

    it('commits a successful upgrade', function (done) {
        util.generateDatabaseName(function (err, name) {
            if (err) { done(err); return; }
            const open = shimIndexedDB.open(name, 1);
            open.onupgradeneeded = function () {
                open.result.createObjectStore('s');
            };
            open.onerror = open.onblocked = done;
            open.onsuccess = function () {
                open.result.close();
                done();
            };
        });
    });

    // An abort/rollback test was deliberately not added here: forcing the
    //   standard-only `sysdbFinishedCb` path (`IDBFactory.js`'s manual
    //   `ROLLBACK` SQL, ~lines 656-722) to run against an abort requires the
    //   sysdb bookkeeping transaction to still be open by the time the
    //   `on__abort` handler's deferred (`setTimeout`) revert attempt runs --
    //   but by then the real driver has typically already auto-completed
    //   that transaction (nothing else was queued on it), so the follow-up
    //   `executeSql('ROLLBACK', ...)` call races against the driver's own
    //   internal transaction-completion bookkeeping in a way that doesn't
    //   reliably reproduce either callback (success or error) through this
    //   wrapper, making the scenario too flaky to assert on reliably here.
});

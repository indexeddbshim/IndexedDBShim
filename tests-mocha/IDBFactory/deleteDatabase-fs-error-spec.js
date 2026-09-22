// Node-only: exercises `cleanupDatabaseResources`'s `fs.unlink` error branch
//   (and the `deleteDatabase`-scoped `dbError`/rollback paths it feeds into),
//   which requires mocking the `fs` module IndexedDBShim was configured with
//   -- not meaningful/reachable in a real browser environment.
import {setFS} from '../../src/IDBFactory.js';
import realFS from 'node:fs';

describe('IDBFactory.deleteDatabase fs.unlink error handling', function () {
    'use strict';

    if (env.isNative) { return; }

    afterEach(function () {
        setFS(realFS);
    });

    it('should error the request when removing the database file fails', function (done) {
        setFS({
            unlink (path, cb) {
                // Deferred via `setTimeout` to match real `fs.unlink`'s
                //   always-asynchronous callback behavior. If this fired
                //   synchronously, it would run *inside* the sysdb
                //   `DELETE FROM dbVersions` statement's own SQL callback,
                //   before `websql-configurable`'s `nonstandardTransCb`
                //   ever gets to install the real rollback-capable
                //   `sysdbFinishedCbDelete` closure (that only happens once
                //   the whole SQL batch finishes and the transaction
                //   "checks done"). `dbError` would then run its *default*
                //   no-op `sysdbFinishedCbDelete` (dispatching the `error`
                //   event immediately, without ever issuing a SQL
                //   ROLLBACK/COMMIT), permanently leaving the `sysdb`
                //   WebSQL transaction "active" -- silently hanging every
                //   later `sysdb.transaction()`/`readTransaction()` call
                //   (e.g. the global per-test cleanup's own
                //   `deleteDatabase()` retry for this same name).
                const err = new Error('Simulated unlink failure');
                setTimeout(function () { cb(err); }, 0);
            }
        });
        util.generateDatabaseName(function (err, name) {
            if (err) { setFS(realFS); done(err); return; }
            const open1 = shimIndexedDB.open(name, 1);
            open1.onupgradeneeded = function () {
                open1.result.createObjectStore('s');
            };
            open1.onerror = open1.onblocked = function (e) {
                setFS(realFS);
                done(e.target.error || new Error('open() errored or blocked'));
            };
            open1.onsuccess = function () {
                open1.result.close();
                const del = shimIndexedDB.deleteDatabase(name);
                del.onsuccess = del.onblocked = function () {
                    done(new Error('deleteDatabase() should have failed'));
                };
                del.onerror = function (e) {
                    expect(e.target.error).to.exist;
                    // Restore real `fs` immediately so the leftover file
                    //   (never actually removed above) is cleaned up normally
                    //   by later `deleteDatabase()` calls/test-suite teardown.
                    setFS(realFS);
                    done();
                };
            };
        });
    });
});

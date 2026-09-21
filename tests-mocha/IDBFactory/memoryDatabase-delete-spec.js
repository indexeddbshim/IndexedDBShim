describe('deleteDatabase with CFG.memoryDatabase', function () {
    'use strict';

    if (!env.isNative && env.isShimmed && window.shimIndexedDB) {
        it('should close and clean up the in-memory SQLite instance', function (done) {
            this.timeout(20000);
            util.generateDatabaseName(function (genErr, dbName) {
                if (genErr) {
                    done(genErr);
                    return;
                }

                window.shimIndexedDB.__setConfig('memoryDatabase', ':memory:');

                /**
                 * @param {unknown} [err]
                 * @returns {void}
                 */
                function finish (err) {
                    // Always restore the config, even on failure -- this is
                    //   a shared, process-wide setting, and every later test
                    //   in the suite creates its databases through it.
                    //   `null` (rather than `''`) is required to actually
                    //   disable memory-database mode again; see `CFG.js`'s
                    //   `memoryDatabase` validator.
                    window.shimIndexedDB.__setConfig('memoryDatabase', null);
                    done(err);
                }

                const open1 = env.indexedDB.open(dbName, 1);
                open1.onupgradeneeded = function () {
                    open1.result.createObjectStore('s1');
                };
                open1.onerror = function () {
                    finish(new Error('Could not open in-memory database'));
                };
                open1.onsuccess = function () {
                    open1.result.close();

                    const delReq = env.indexedDB.deleteDatabase(dbName);
                    delReq.onsuccess = function () {
                        finish();
                    };
                    delReq.onerror = function () {
                        finish(new Error('Could not delete in-memory database'));
                    };
                    delReq.onblocked = function () {
                        finish(new Error('Deleting in-memory database was blocked'));
                    };
                };
            });
        });
    }
});

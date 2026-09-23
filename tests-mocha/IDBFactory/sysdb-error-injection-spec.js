// Forces the shared `sysdb` singleton to be (re)created against a fully
//   fake driver whose SQL callbacks can be made to fail on demand, in order
//   to exercise `IDBFactory.js`'s `sysdb`-level SQL error handlers
//   (`createSysDB`'s `sysDbCreateError` and `databases()`'s
//   `dbGetDatabaseNamesError`) -- paths that can't be triggered through any
//   genuine SQL failure in normal use. As in `sysdb-standard-driver-spec.js`,
//   toggling `CFG.memoryDatabase` for the duration of each test forces
//   `sysdb` to be recreated against the fake driver without ever touching
//   the real, shared, file-backed `sysdb` used by every other test.
describe('IDBFactory sysdb SQL error handling', function () {
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
        //   reuse that same stuck instance instead of creating a fresh one
        //   against the fake driver each test below installs. Routing
        //   through a disposable value first (with a normal, fully-
        //   completing open+close against the real driver) guarantees
        //   `sysdb`'s stored setting differs from `:memory:`, so switching
        //   to `:memory:` immediately after is always treated as a real
        //   change and forces fresh recreation.
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
            done();
        };
        resetReq.onerror = resetReq.onblocked = function (e) {
            done((e.target && e.target.error) || new Error('sysdb reset failed'));
        };
    });

    afterEach(function () {
        shimIndexedDB.__openDatabase = prevOpenDatabase;
        shimIndexedDB.__setConfig('memoryDatabase', memoryDatabase);
    });

    it('errors an open() request when the sysdb transaction itself fails (no `err`, only `tx`)', function (done) {
        shimIndexedDB.__openDatabase = function () {
            return {
                version: '1',
                transaction (fn, errCb) {
                    // Simulate the whole transaction failing outright (as
                    //   opposed to an individual `executeSql` call within
                    //   it) -- this invokes `sysDbCreateError` with only a
                    //   single (`tx`) argument, no separate `err`.
                    setTimeout(function () {
                        errCb(new Error('Simulated sysdb transaction failure'));
                    }, 0);
                },
                readTransaction (fn, errCb) {
                    errCb && errCb(new Error('Should not be reached'));
                }
            };
        };
        const open = shimIndexedDB.open('sysdb-transaction-error-test', 1);
        open.onsuccess = open.onblocked = function () {
            done(new Error('open() should have failed'));
        };
        open.onerror = function (e) {
            expect(e.target.error).to.exist;
            done();
        };
    });

    it('errors an open() request when creating the sysdb dbVersions table fails', function (done) {
        shimIndexedDB.__openDatabase = function () {
            return {
                version: '1',
                transaction (fn /* , errCb */) {
                    fn({
                        executeSql (sql, params, success, error) {
                            // Deferred (not called synchronously): a fully
                            //   synchronous fake driver would let the whole
                            //   `open()` flow -- including this request's
                            //   error dispatch -- complete before this
                            //   function even returns control to the test,
                            //   since `IDBFactory.js`'s connection queue
                            //   processes a request immediately/
                            //   synchronously when the queue was previously
                            //   empty. That would fire the `error` event
                            //   before `open.onerror` below is ever
                            //   attached, silently losing it. A real driver
                            //   always has *some* async boundary, so defer
                            //   here to match.
                            setTimeout(function () {
                                error({}, new Error('Simulated CREATE TABLE failure'));
                            }, 0);
                        }
                    });
                },
                readTransaction (fn, errCb) {
                    errCb && errCb(new Error('Should not be reached'));
                }
            };
        };
        const open = shimIndexedDB.open('sysdb-create-error-test', 1);
        open.onsuccess = open.onblocked = function () {
            done(new Error('open() should have failed'));
        };
        open.onerror = function (e) {
            expect(e.target.error).to.exist;
            done();
        };
    });

    it('rejects databases() when the sysdb dbVersions SELECT fails', async function () {
        shimIndexedDB.__openDatabase = function () {
            return {
                version: '1',
                transaction (fn, errCb, okCb) {
                    // The success callback must receive a transaction-like
                    //   object (with its own `executeSql`) as its first
                    //   argument, not a plain `{}` -- `createSysDB` chains a
                    //   further `executeSql` call (for `CREATE INDEX`) off
                    //   of it when `useSQLiteIndexes` is enabled (the
                    //   default), and a bare `{}` would throw a `TypeError`
                    //   there instead of ever reaching the `readTransaction`
                    //   SELECT this test means to fail.
                    const tx = {
                        executeSql (sql, params, success) {
                            success && success(tx, {rows: {length: 0, item: () => undefined}});
                        }
                    };
                    fn(tx);
                    okCb && okCb();
                },
                readTransaction (fn /* , errCb */) {
                    fn({
                        executeSql (sql, params, success, error) {
                            // Call twice to also exercise `databases()`'s
                            //   `calledDbCreateError` re-entrancy guard,
                            //   which discards any error reported after
                            //   the promise has already been rejected once.
                            error({}, new Error('Simulated SELECT failure'));
                            error({}, new Error('Simulated SELECT failure (duplicate)'));
                        }
                    });
                }
            };
        };
        let rejected = false;
        try {
            await shimIndexedDB.databases();
        } catch (err) {
            rejected = true;
            expect(err).to.exist;
        }
        expect(rejected, 'databases() should have rejected').to.be.true;
    });

    it('rejects databases() when the sysdb readTransaction itself fails (no `err`, only `tx`)', async function () {
        shimIndexedDB.__openDatabase = function () {
            return {
                version: '1',
                transaction (fn, errCb, okCb) {
                    const tx = {
                        executeSql (sql, params, success) {
                            success && success(tx, {rows: {length: 0, item: () => undefined}});
                        }
                    };
                    fn(tx);
                    okCb && okCb();
                },
                readTransaction (fn, errCb) {
                    // Simulate the whole `readTransaction` itself failing
                    //   outright (as opposed to an individual `executeSql`
                    //   call within it) -- this invokes
                    //   `dbGetDatabaseNamesError` with only a single (`tx`)
                    //   argument, no separate `err`.
                    errCb(new Error('Simulated sysdb readTransaction failure'));
                }
            };
        };
        let rejected = false;
        try {
            await shimIndexedDB.databases();
        } catch (err) {
            rejected = true;
            expect(err).to.exist;
        }
        expect(rejected, 'databases() should have rejected').to.be.true;
    });

    it('should use `sysDatabaseBasePath` to build the sysdb file path when not using a memory database', function (done) {
        const sysDatabaseBasePath = shimIndexedDB.__getConfig('sysDatabaseBasePath');
        shimIndexedDB.__setConfig('memoryDatabase', null); // Forces the non-memory (joinPath) branch
        shimIndexedDB.__setConfig('sysDatabaseBasePath', 'my-sys-base-path');
        let capturedName;
        // Only intercept the `sysdb` file's own creation (identified by its
        //   distinctive `__sysdb__` file name) with a fully fake, no-I/O
        //   driver; delegate everything else (the actual user database
        //   being opened) to the real driver so the rest of the `open()`
        //   flow behaves normally.
        shimIndexedDB.__openDatabase = function (name, ...rest) {
            if (typeof name === 'string' && name.includes('__sysdb__')) {
                capturedName = name;
                return {
                    version: '1',
                    transaction (fn, errCb, okCb) {
                        const tx = {
                            executeSql (sql, params, success) {
                                success && success(tx, {rows: {length: 0, item: () => undefined}});
                            }
                        };
                        fn(tx);
                        okCb && okCb();
                    },
                    readTransaction (fn) {
                        fn({
                            executeSql (sql, params, success) {
                                success && success({}, {rows: {length: 0, item: () => undefined}});
                            }
                        });
                    }
                };
            }
            return prevOpenDatabase(name, ...rest);
        };
        const open = shimIndexedDB.open('sysdb-basepath-test', 1);
        open.onerror = open.onblocked = function (e) {
            shimIndexedDB.__setConfig('sysDatabaseBasePath', sysDatabaseBasePath);
            done((e.target && e.target.error) || new Error('open() failed'));
        };
        open.onsuccess = function () {
            open.result.close();
            shimIndexedDB.__setConfig('sysDatabaseBasePath', sysDatabaseBasePath);
            expect(capturedName).to.equal('my-sys-base-path/__sysdb__.sqlite');
            done();
        };
    });

    it('should fall back to an empty base path for the sysdb file when neither `sysDatabaseBasePath` nor `databaseBasePath` is set', function (done) {
        const sysDatabaseBasePath = shimIndexedDB.__getConfig('sysDatabaseBasePath');
        const databaseBasePath = shimIndexedDB.__getConfig('databaseBasePath');
        shimIndexedDB.__setConfig('memoryDatabase', undefined); // Forces the non-memory (joinPath) branch; differs from the prior test's `null` so `sysdb` is recreated again
        shimIndexedDB.__setConfig('sysDatabaseBasePath', null);
        shimIndexedDB.__setConfig('databaseBasePath', null);
        let capturedName;
        shimIndexedDB.__openDatabase = function (name, ...rest) {
            if (typeof name === 'string' && name.includes('__sysdb__')) {
                capturedName = name;
                return {
                    version: '1',
                    transaction (fn, errCb, okCb) {
                        const tx = {
                            executeSql (sql, params, success) {
                                success && success(tx, {rows: {length: 0, item: () => undefined}});
                            }
                        };
                        fn(tx);
                        okCb && okCb();
                    },
                    readTransaction (fn) {
                        fn({
                            executeSql (sql, params, success) {
                                success && success({}, {rows: {length: 0, item: () => undefined}});
                            }
                        });
                    }
                };
            }
            return prevOpenDatabase(name, ...rest);
        };
        /**
         * @returns {void}
         */
        function restore () {
            shimIndexedDB.__setConfig('sysDatabaseBasePath', sysDatabaseBasePath);
            shimIndexedDB.__setConfig('databaseBasePath', databaseBasePath);
        }
        const open = shimIndexedDB.open('sysdb-basepath-fallback-test', 1);
        open.onerror = open.onblocked = function (e) {
            restore();
            done((e.target && e.target.error) || new Error('open() failed'));
        };
        open.onsuccess = function () {
            open.result.close();
            restore();
            expect(capturedName).to.equal('__sysdb__.sqlite');
            done();
        };
    });
});

describe('IDBFactory.deleteDatabase', function () {
    'use strict';
    this.timeout(5000);

    let indexedDB;
    beforeEach(function () {
        ({indexedDB} = env);
    });

    it('should return an IDBOpenDBRequest', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            db.close();
            const del = indexedDB.deleteDatabase(db.name);

            expect(del).to.be.an.instanceOf(IDBOpenDBRequest);
            done();
        });
    });

    it('should return an IDBOpenDBRequest, even if the database doesn\'t exist', function (done) {
        const del = indexedDB.deleteDatabase('foobar');
        expect(del).to.be.an.instanceOf(IDBOpenDBRequest);

        del.onerror = sinon.spy();
        del.onsuccess = function () {
            sinon.assert.notCalled(del.onerror);
            done();
        };
    });

    it('should pass an IDBVersionChangeEvent to the onsuccess event', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            db.close();
            const del = indexedDB.deleteDatabase(db.name);

            del.onsuccess = function (event) {
                if (env.isShimmed || (!env.browser.isIE && !env.browser.isSafari)) {
                    expect(event).to.be.an.instanceOf('ShimEvent' in window ? window.ShimEvent : Event); // IE and Safari use a normal event
                }
                done();
            };
        });
    });

    it('should pass the IDBOpenDBRequest to the onsuccess event', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            db.close();
            const del = indexedDB.deleteDatabase(db.name);

            del.onsuccess = function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(del);
                done();
            };
        });
    });

    it('should set IDBOpenDBRequest.result to undefined', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            db.close();
            const del = indexedDB.deleteDatabase(db.name);

            del.onsuccess = function () {
                expect(del.result).to.be.undefined;
                done();
            };
        });
    });

    it('should delete the database', function (done) {
        util.generateDatabaseName(function (err, name) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            // Create version 5 of the database
            indexedDB.open(name, 5).onsuccess = function (event) {
                const db = event.target.result;
                expect(db.version).to.equal(5);
                db.close();

                // Delete the database
                indexedDB.deleteDatabase(name).onsuccess = function () {
                    // Create version 3 of the database.
                    indexedDB.open(name, 3).onsuccess = function (event) {
                        const db = event.target.result;
                        expect(db.version).to.equal(3);

                        db.close();
                        done();
                    };
                };
            };
        });
    });

    it('should fire the onblocked event if the database is open', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            let alreadyDone = false;
            const del = indexedDB.deleteDatabase(db.name);
            del.onerror = sinon.spy();

            // It will either be blocked, or it will delete successfully
            del.onsuccess = del.onblocked = function (event) {
                sinon.assert.notCalled(del.onerror);

                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(del);

                if (alreadyDone) {
                    return;
                }

                alreadyDone = true;
                db.close();
                done();
            };
        });
    });

    it('should allow all of these parameter types', function (done) {
        let deletingCounter = 0, deletedCounter = 0;
        if (window.shimIndexedDB) {
            window.shimIndexedDB.__setConfig({databaseNameLengthLimit: util.sampleData.veryLongString.length + 100});
        }

        deleteDatabase(undefined);
        deleteDatabase('');
        deleteDatabase(util.sampleData.veryLongString);
        deleteDatabase(42);
        deleteDatabase(-0.331);
        deleteDatabase(Infinity);
        deleteDatabase(-Infinity);
        deleteDatabase(NaN);
        deleteDatabase([]);
        deleteDatabase(['a', 'b', 'c']);
        deleteDatabase(new Date());
        deleteDatabase({foo: 'bar'});
        deleteDatabase(/^regex$/v);

        if (env.isShimmed || !env.browser.isIE) {
            deleteDatabase(null);
        }

        /**
         * @param {string} name
         * @returns {void}
         */
        function deleteDatabase (name) {
            deletingCounter++;
            const del = indexedDB.deleteDatabase(name);
            del.onerror = sinon.spy();
            del.onsuccess = function () {
                sinon.assert.notCalled(del.onerror);

                if (++deletedCounter !== deletingCounter) {
                    return;
                }

                // Reset back to the natural (unset) default -- this is a
                //   shared, process-wide setting, and every later test
                //   creating a database goes through this same length
                //   check. `false` would disable the check entirely
                //   rather than restoring its normal 254-character
                //   fallback, so `undefined` is used instead.
                if (window.shimIndexedDB) {
                    window.shimIndexedDB.__setConfig({databaseNameLengthLimit: undefined});
                }
                done();
            };
        }
    });

    it('should throw an error if called without params', function () {
        let err;
        try {
            indexedDB.deleteDatabase();
        } catch (e) {
            err = e;
        }

        expect(err).to.be.an.instanceOf(TypeError);
        expect(err.name).to.equal('TypeError');
    });
});

describe('IDBFactory.deleteDatabase shim-internal edge cases', function () {
    'use strict';
    this.timeout(10000);

    if (env.isNative) { return; }

    it('should throw for a database name exceeding the length limit', function () {
        expect(() => {
            shimIndexedDB.deleteDatabase(util.sampleData.veryLongString);
        }).to.throw(Error, /length/v);
    });

    it('should fall back to the WebSQL __sys__ table-drop path when CFG.deleteDatabaseFiles is false', function (done) {
        const deleteDatabaseFiles = shimIndexedDB.__getConfig('deleteDatabaseFiles');
        util.generateDatabaseName(function (err, name) {
            if (err) { done(err); return; }
            const open1 = shimIndexedDB.open(name, 1);
            open1.onupgradeneeded = function () {
                open1.result.createObjectStore('s');
            };
            open1.onerror = open1.onblocked = done;
            open1.onsuccess = function () {
                open1.result.close();
                shimIndexedDB.__setConfig('deleteDatabaseFiles', false);
                const del = shimIndexedDB.deleteDatabase(name);
                del.onerror = del.onblocked = function (e) {
                    shimIndexedDB.__setConfig('deleteDatabaseFiles', deleteDatabaseFiles);
                    done(e.target.error || new Error('deleteDatabase() errored or blocked'));
                };
                del.onsuccess = function () {
                    shimIndexedDB.__setConfig('deleteDatabaseFiles', deleteDatabaseFiles);
                    const open2 = shimIndexedDB.open(name, 1);
                    open2.onupgradeneeded = function () {
                        // A brand new database (the old store shouldn't exist).
                        expect([...open2.result.objectStoreNames]).to.deep.equal([]);
                    };
                    open2.onerror = open2.onblocked = done;
                    open2.onsuccess = function () {
                        open2.result.close();
                        done();
                    };
                };
            };
        });
    });

    describe('with a cached connection whose underlying close() misbehaves', function () {
        let prevOpenDatabase;
        beforeEach(function () {
            prevOpenDatabase = shimIndexedDB.__openDatabase;
        });
        afterEach(function () {
            shimIndexedDB.__openDatabase = prevOpenDatabase;
        });

        it('should warn but still complete deletion when closing a cached connection errors', function (done) {
            shimIndexedDB.__openDatabase = function (...args) {
                const db = prevOpenDatabase(...args);
                return {
                    get version () { return db.version; },
                    transaction (...a) { return db.transaction(...a); },
                    readTransaction (...a) { return db.readTransaction(...a); },
                    _db: {
                        close (cb) { cb(new Error('Simulated close error')); }
                    }
                };
            };
            const warn = sinon.stub(console, 'warn');
            util.generateDatabaseName(function (err, name) {
                if (err) { warn.restore(); done(err); return; }
                const open1 = shimIndexedDB.open(name, 1);
                open1.onupgradeneeded = function () {
                    open1.result.createObjectStore('s');
                };
                open1.onerror = open1.onblocked = function (e) {
                    warn.restore();
                    done(e.target.error || new Error('open() errored or blocked'));
                };
                open1.onsuccess = function () {
                    open1.result.close();
                    const del = shimIndexedDB.deleteDatabase(name);
                    del.onerror = del.onblocked = function (e) {
                        warn.restore();
                        done(e.target.error || new Error('deleteDatabase() errored or blocked'));
                    };
                    del.onsuccess = function () {
                        sinon.assert.calledWithMatch(warn, /Error closing database connection prior to file removal/v);
                        warn.restore();
                        done();
                    };
                };
            });
        });
    });

    describe('with CFG.memoryDatabase enabled and a misbehaving cached connection', function () {
        // `cleanupDatabaseResources`'s `useMemoryDatabase` branch requires
        //   `CFG.memoryDatabase` to already be enabled at the time the
        //   database being deleted was originally opened (that's what
        //   populates `websqlDBCache` with the instance this branch reads),
        //   so it must stay enabled for the whole test, not just the
        //   `deleteDatabase()` call.
        //   IMPORTANT: this must be the literal string `:memory:`, not e.g.
        //   a unique `file::memory:?...` variant per test -- `SQLiteDatabase`
        //   (the real Node driver) only exempts the exact literal
        //   `:memory:` from its own path-keyed reader/writer lock; any other
        //   string is treated as a real, lockable file path, and since
        //   `sysdb` and this test's own connection would then share that
        //   same "path", one of these tests' deliberately-never-released
        //   write locks (the whole point of these tests is a branch that
        //   never calls back) would permanently deadlock the other.
        //   `:memory:` itself needs no such exemption workaround: every
        //   `new Database(':memory:')` call is already a fresh, fully
        //   isolated instance regardless of how many other connections
        //   share that same literal name.
        //   Also note: the wrapped `transaction`/`readTransaction` methods
        //   below must keep their explicit 4-parameter signatures (matching
        //   the real driver's arity) rather than e.g. rest parameters --
        //   `IDBTransaction.js` detects "nonstandard" (4-argument) driver
        //   support via `fn.length >= 4`, and collapsing that arity would
        //   silently force the connection into the standard-only
        //   3-argument protocol instead.
        let prevOpenDatabase, memoryDatabase;
        beforeEach(function (done) {
            prevOpenDatabase = shimIndexedDB.__openDatabase;
            memoryDatabase = shimIndexedDB.__getConfig('memoryDatabase');
            // `sysdb` is only recreated when `CFG.memoryDatabase` *changes
            //   value*, not merely when it's toggled off and back to the
            //   same string -- so if an earlier test in this block left the
            //   shared `:memory:` `sysdb` permanently stuck mid-transaction
            //   (by design; see the tests below), simply setting
            //   `:memory:` again here would silently reuse that same stuck
            //   instance. Routing through a disposable value first (with a
            //   normal, fully-completing open+close) guarantees `sysdb`'s
            //   stored setting differs from `:memory:`, so switching to
            //   `:memory:` immediately after is always treated as a real
            //   change and forces fresh recreation.
            //   The disposable value must match `CFG.memoryDatabase`'s
            //   validator (`:memory:`, or a `file::memory:[?queryString]`
            //   URL-like string) -- any such non-`:memory:` value is still
            //   treated by the underlying driver as a real, lockable file
            //   path, so the resulting one-off `.sqlite`-less file is swept
            //   up automatically by `package.json`'s `clean-mocha` script
            //   (globs for `file::memory:?*`).
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

        it('should log an error and not complete when the cached instance lacks a `._db.close` method', function (done) {
            shimIndexedDB.__openDatabase = function (...args) {
                const db = prevOpenDatabase(...args);
                return {
                    get version () { return db.version; },
                    transaction (fn, errCb, okCb, nonstandardCb) { return db.transaction(fn, errCb, okCb, nonstandardCb); },
                    readTransaction (fn, errCb, okCb, nonstandardCb) { return db.readTransaction(fn, errCb, okCb, nonstandardCb); },
                    _db: {}
                };
            };
            const errorStub = sinon.stub(console, 'error');
            // Deliberately not using `util.generateDatabaseName` (and so not
            //   registering this name for the global per-test cleanup
            //   `afterEach`): the `deleteDatabase()` call below never
            //   completes by design, and an auto-cleanup attempt for the
            //   same name would queue up behind it and hang forever too.
            const name = 'no-close-method-test-' + Date.now();
            const open1 = shimIndexedDB.open(name, 1);
            open1.onupgradeneeded = function () {
                open1.result.createObjectStore('s');
            };
            open1.onerror = open1.onblocked = function (e) {
                errorStub.restore();
                done(e.target.error || new Error('open() errored or blocked'));
            };
            open1.onsuccess = function () {
                open1.result.close();
                shimIndexedDB.deleteDatabase(name); // Never completes; only the log is asserted.
                setTimeout(function () {
                    sinon.assert.calledWithMatch(errorStub, /does not have the expected/v);
                    errorStub.restore();
                    done();
                }, 50);
            };
        });

        it('should warn and not complete when closing the cached memory-database instance errors', function (done) {
            shimIndexedDB.__openDatabase = function (...args) {
                const db = prevOpenDatabase(...args);
                return {
                    get version () { return db.version; },
                    transaction (fn, errCb, okCb, nonstandardCb) { return db.transaction(fn, errCb, okCb, nonstandardCb); },
                    readTransaction (fn, errCb, okCb, nonstandardCb) { return db.readTransaction(fn, errCb, okCb, nonstandardCb); },
                    _db: {
                        close (cb) { cb(new Error('Simulated close (destroy) error')); }
                    }
                };
            };
            const warn = sinon.stub(console, 'warn');
            // See the previous test for why `util.generateDatabaseName` is
            //   deliberately not used here.
            const name = 'close-error-memory-db-test-' + Date.now();
            const open1 = shimIndexedDB.open(name, 1);
            open1.onupgradeneeded = function () {
                open1.result.createObjectStore('s');
            };
            open1.onerror = open1.onblocked = function (e) {
                warn.restore();
                done(e.target.error || new Error('open() errored or blocked'));
            };
            open1.onsuccess = function () {
                open1.result.close();
                shimIndexedDB.deleteDatabase(name); // Never completes; only the log is asserted.
                setTimeout(function () {
                    sinon.assert.calledWithMatch(warn, /Error closing \(destroying\) memory database/v);
                    warn.restore();
                    done();
                }, 50);
            };
        });
    });
});

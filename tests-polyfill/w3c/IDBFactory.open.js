describe('W3C IDBFactory.open Tests', function () {
    var FDBVersionChangeEvent = IDBVersionChangeEvent;
    var Event = shimIndexedDB.modules.ShimEvent;
    //var FDBTransaction = IDBTransaction;
    var assert_unreached = support.assert_unreached;
    var createdb = support.createdb;
    var format_value = support.format_value;

    // idbfactory_open
    it('request has no source', function (done) {
        var open_rq = createdb(done, undefined, 9);

        open_rq.onupgradeneeded = function(e) {};
        open_rq.onsuccess = function(e) {
            assert.equal(e.target.source, null, "source")
            done();
        }
    });

    // idbfactory_open2
    it("database 'name' and 'version' are correctly set", function (done) {
        var open_rq = createdb(done, 'database_name', 13);

        open_rq.onupgradeneeded = function(e) {};
        open_rq.onsuccess = function(e) {
            var db = e.target.result;
            assert.equal(db.name, 'database_name', 'db.name');
            assert.equal(db.version, 13, 'db.version');
            done();
        }
    });

    // idbfactory_open3
    it('no version opens current database', function (done) {
        var open_rq = createdb(done, undefined, 13);
        var did_upgrade = false;

        open_rq.onupgradeneeded = function() {};
        open_rq.onsuccess = function(e) {
            var db = e.target.result;
            db.close();

            var open_rq2 = indexedDB.open(db.name);
            open_rq2.onsuccess = function(e) {
                assert.equal(e.target.result.version, 13, "db.version")
                done();
            };
            open_rq2.onupgradeneeded = function () { throw new Error('Unexpected upgradeneeded') };
            open_rq2.onerror = function () { throw new Error('Unexpected error') };
        }
    });

    // idbfactory_open4
    it('new database has default version', function (done) {
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e) {
            assert.equal(e.target.result.version, 1, "db.version");
        };
        open_rq.onsuccess = function(e) {
            assert.equal(e.target.result.version, 1, "db.version");
            done();
        };
    });

    // idbfactory_open5
    it('new database is empty', function (done) {
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function() {};
        open_rq.onsuccess = function(e) {
            assert.equal(e.target.result.objectStoreNames.length, 0, "objectStoreNames.length");
            done();
        };
    });

    // idbfactory_open6
    it('open database with a lower version than current', function (done) {
        var open_rq = createdb(done, undefined, 13);
        var did_upgrade = false;

        open_rq.onupgradeneeded = function() {};
        open_rq.onsuccess = function(e) {
            var db = e.target.result;
            db.close();

            var open_rq2 = indexedDB.open(db.name, 14);
            open_rq2.onupgradeneeded = function() {};
            open_rq2.onsuccess = open_previous_db;
            open_rq2.onerror = function () { throw new Error('Unexpected error') };
        }

        function open_previous_db(e) {
            var open_rq3 = indexedDB.open(e.target.result.name, 13);
            open_rq3.onerror = function(e) {
                assert.equal(e.target.error.name, 'VersionError', 'e.target.error.name')
                done();
            };
            open_rq3.onupgradeneeded = function () { throw new Error('Unexpected upgradeneeded') };
            open_rq3.onsuccess = function () { throw new Error('Unexpected success') };
        }
    });

    // idbfactory_open7
    it('open database with a higher version than current', function (done) {
        var open_rq = createdb(done, undefined, 13);
        var did_upgrade = false;

        open_rq.onupgradeneeded = function() {};
        open_rq.onsuccess = function(e) {
            var db = e.target.result;
            db.close();

            var open_rq2 = indexedDB.open(db.name, 14);
            open_rq2.onupgradeneeded = function() {
                did_upgrade = true;
            };
            open_rq2.onsuccess = open_current_db;
            open_rq2.onerror = function () { throw new Error('Unexpected error') };
        }

        function open_current_db(e) {
            var open_rq3 = indexedDB.open(e.target.result.name);
            open_rq3.onsuccess = function(e) {
                assert.equal(e.target.result.version, 14, "db.version")
                done();
            };
            open_rq3.onupgradeneeded = function () { throw new Error('Unexpected upgradeneeded') };
            open_rq3.onerror = function () { throw new Error('Unexpected error') };

            assert(did_upgrade, 'did upgrade');
        }
    });

    // idbfactory_open8
    it('error in version change transaction aborts open', function (done) {
        var open_rq = createdb(done, undefined, 13);
        var did_upgrade = false;
        var did_db_abort = false;

        open_rq.onupgradeneeded = function(e) {
            did_upgrade = true;
            e.target.result.onabort = function() {
                did_db_abort = true;
            }
            e.target.transaction.abort();
        };
        open_rq.onerror = function(e) {
            assert(did_upgrade);
            assert.equal(e.target.error.name, 'AbortError', 'target.error');
            done()
        };
    });

    // idbfactory_open9
    it('errors in version argument', function (done) {
        function should_throw(val, name) {
            if (!name) {
                name = ((typeof val == "object" && val) ? "object" : format_value(val))
            }
            assert.throws(function() {
              indexedDB.open('test', val);
            }, TypeError, null, "Calling open() with version argument " + name + " should throw TypeError.");
        }

        should_throw(-1)
        should_throw(-0.5)
        should_throw(0)
        should_throw(0.5)
        should_throw(0.8)
        should_throw(0x20000000000000)  // Number.MAX_SAFE_INTEGER + 1
        should_throw(NaN)
        should_throw(Infinity)
        should_throw(-Infinity)
        should_throw("foo")
        should_throw(null)
        should_throw(false)

        should_throw({
            toString() { assert_unreached("toString should not be called for ToPrimitive [Number]"); },
            valueOf() { return 0; }
        })
        should_throw({
            toString() { return 0; },
            valueOf() { return {}; }
        }, 'object (second)')
        should_throw({
            toString() { return {}; },
            valueOf() { return {}; },
        }, 'object (third)')


        /* Valid */

        var ct = 0;
        function should_work(val) {
            var rq = createdb(done, undefined, val)
            rq.onupgradeneeded = function() {
                ct++;
                if (ct === 2) {
                    done()
                }
            }
            rq.onsuccess = function () {}
        }

        should_work(1.5)
        should_work(Number.MAX_SAFE_INTEGER)  // 0x20000000000000 - 1
    });

    // idbfactory_open10
    it('error in upgradeneeded resets db', function (done) {
        var db, db2;
        var open_rq = createdb(done, undefined, 9);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var st = db.createObjectStore("store");
            st.createIndex("index", "i");

            assert.equal(db.version, 9, "first db.version");
            assert(db.objectStoreNames.contains("store"), "objectStoreNames contains store");
            assert(st.indexNames.contains("index"), "indexNames contains index");

            st.add({i: "Joshua"}, 1);
            st.add({i: "Jonas"}, 2);
        };
        open_rq.onsuccess = function(e) {
            db.close();
            var open_rq2 = indexedDB.open(db.name, 10);
            open_rq2.onupgradeneeded = function(e) {
                db2 = e.target.result;

                db2.createObjectStore("store2");

                var store = open_rq2.transaction.objectStore("store")
                store.createIndex("index2", "i");

                assert.equal(db2.version, 10, "db2.version");

                assert(db2.objectStoreNames.contains("store"), "second objectStoreNames contains store");
                assert(db2.objectStoreNames.contains("store2"), "second objectStoreNames contains store2");
                assert(store.indexNames.contains("index"), "second indexNames contains index");
                assert(store.indexNames.contains("index2"), "second indexNames contains index2");

                store.add({i: "Odin"}, 3);
                store.put({i: "Sicking"}, 2);

                open_rq2.transaction.abort();
            };
            open_rq2.onerror = function(e) {
                assert.equal(db2.version, 9, "db2.version after error");
                assert(db2.objectStoreNames.contains("store"), "objectStoreNames contains store after error");
                assert(!db2.objectStoreNames.contains("store2"), "objectStoreNames not contains store2 after error");

                var open_rq3 = indexedDB.open(db.name);
                open_rq3.onsuccess = function(e) {
                    var db3 = e.target.result;

                    assert(db3.objectStoreNames.contains("store"), "third objectStoreNames contains store");
                    assert(!db3.objectStoreNames.contains("store2"), "third objectStoreNames contains store2");

                    var st = db3.transaction("store").objectStore("store");

                    assert.equal(db3.version, 9, "db3.version");

                    assert(st.indexNames.contains("index"), "third indexNames contains index");
                    assert(!st.indexNames.contains("index2"), "third indexNames contains index2");

                    st.openCursor(null, "prev").onsuccess = function(e) {
                        assert.equal(e.target.result.key, 2, "opencursor(prev) key");
                        assert.equal(e.target.result.value.i, "Jonas", "opencursor(prev) value");
                    };
                    st.get(3).onsuccess = function(e) {
                        assert.equal(e.target.result, undefined, "get(3)");
                    }

                    var idx = st.index("index");
                    idx.getKey("Jonas").onsuccess = function(e) {
                        assert.equal(e.target.result, 2, "getKey(Jonas)");
                    };
                    idx.getKey("Odin").onsuccess = function(e) {
                        assert.equal(e.target.result, undefined, "getKey(Odin)");
                    };
                    idx.getKey("Sicking").onsuccess = function(e) {
                        assert.equal(e.target.result, undefined, "getKey(Sicking)");
                        done();
                    };
                };
            };
        };
    });

    // idbfactory_open11
    it("second open's transaction is available to get objectStores", function (done) {
        var db;
        var count_done = 0;
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            db.createObjectStore("store");
            assert(db.objectStoreNames.contains("store"), "objectStoreNames contains store");

            var store = e.target.transaction.objectStore("store");
            assert.equal(store.name, "store", "store.name");

            store.add("data", 1);

            store.count().onsuccess = function(e) {
                assert.equal(e.target.result, 1, "count()");
                count_done++;
            };

            store.add("data2", 2);
        };
        open_rq.onsuccess = function(e) {
            var store = db.transaction("store").objectStore("store");
            assert.equal(store.name, "store", "store.name");
            store.count().onsuccess = function(e) {
                assert.equal(e.target.result, 2, "count()");
                count_done++;
            };
            db.close();

            var open_rq2 = indexedDB.open(db.name, 10);
            open_rq2.onupgradeneeded = function(e) {
                var db2 = e.target.result;
                assert(db2.objectStoreNames.contains("store"), "objectStoreNames contains store");
                var store = open_rq2.transaction.objectStore("store");
                assert.equal(store.name, "store", "store.name");

                store.add("data3", 3);

                store.count().onsuccess = function(e) {
                    assert.equal(e.target.result, 3, "count()");
                    count_done++;

                    assert.equal(count_done, 3, "count_done");
                    done();
                };
            };
        };
    });

    // idbfactory_open12
    it('upgradeneeded gets VersionChangeEvent', function (done) {
        var db;
        var open_rq = createdb(done, undefined, 9);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            assert(support.instanceOf(e, FDBVersionChangeEvent), "e instanceof IDBVersionChangeEvent");
            assert.equal(e.oldVersion, 0, "oldVersion");
            assert.equal(e.newVersion, 9, "newVersion");
            assert.equal(e.type, "upgradeneeded", "event type");

            assert.equal(db.version, 9, "db.version");
        };
        open_rq.onsuccess = function(e) {
            assert(support.instanceOf(e, Event), "e instanceof Event");
            assert(!(support.instanceOf(e, FDBVersionChangeEvent)), "e not instanceof IDBVersionChangeEvent");
            assert.equal(e.type, "success", "event type");


            /**
             * Second test
             */
            db.onversionchange = function() { db.close(); };

            var open_rq2 = createdb(done, db.name, 10);
            open_rq2.onupgradeneeded = function(e) {
                var db2 = e.target.result;
                assert(support.instanceOf(e, FDBVersionChangeEvent), "e instanceof IDBVersionChangeEvent");
                assert.equal(e.oldVersion, 9, "oldVersion");
                assert.equal(e.newVersion, 10, "newVersion");
                assert.equal(e.type, "upgradeneeded", "event type");

                assert.equal(db2.version, 10, "new db.version");

                done();
            };
            open_rq2.onsuccess = function () {};
        };
    });
});

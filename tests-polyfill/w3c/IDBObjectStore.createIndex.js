describe('W3C IDBObjectStore.createIndex Tests', function () {
    var FDBIndex = IDBIndex;
    var createdb = support.createdb;

    // idbobjectstore_createindex
    it('returns an IDBIndex and the properties are set correctly', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store");
            var index = objStore.createIndex("index", "indexedProperty", { unique: true });

            assert(index instanceof FDBIndex, "IDBIndex");
            assert.equal(index.name, "index", "name");
            assert.equal(index.objectStore, objStore, "objectStore");
            assert.equal(index.keyPath, "indexedProperty", "keyPath");
            assert(index.unique, "unique");
            assert(!index.multiEntry, "multiEntry");

            done();
        };
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_createindex2
    it('attempt to create an index that requires unique values on an object store already contains duplicates', function (done) {
        var db, aborted,
          record = { indexedProperty: "bar" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var txn = e.target.transaction,
              objStore = db.createObjectStore("store");

            objStore.add(record, 1);
            objStore.add(record, 2);
            var index = objStore.createIndex("index", "indexedProperty", { unique: true });

            assert(index instanceof FDBIndex, "IDBIndex");

            e.target.transaction.onabort = function(e) {
                aborted = true;
                assert.equal(e.type, "abort", "event type");
            };

            db.onabort = function(e) {
                assert(aborted, "transaction.abort event has fired");
                done();
            };

            e.target.transaction.oncomplete = function () { throw new Error("got complete, expected abort"); };
        };
        open_rq.onerror = function () {};
    });

    // idbobjectstore_createindex3
    it('the index is usable right after being made', function (done) {
        var db, aborted;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var txn = e.target.transaction,
              objStore = db.createObjectStore("store", { keyPath: 'key' });

            for (var i = 0; i < 100; i++)
                objStore.add({ key: "key_" + i, indexedProperty: "indexed_" + i });

            var idx = objStore.createIndex("index", "indexedProperty")

            idx.get('indexed_99').onsuccess = function(e) {
                assert.equal(e.target.result.key, 'key_99', 'key');
            };
            idx.get('indexed_9').onsuccess = function(e) {
                assert.equal(e.target.result.key, 'key_9', 'key');
            };
        }

        open_rq.onsuccess = function() {
            done();
        }
    });

    // idbobjectstore_createindex4
    it('Event ordering for a later deleted index', function (done) {
        var db,
          events = [];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            e.target.transaction.oncomplete = log("transaction.complete");

            var txn = e.target.transaction,
              objStore = db.createObjectStore("store");

            var rq_add1 = objStore.add({ animal: "Unicorn" }, 1);
            rq_add1.onsuccess = log("rq_add1.success");
            rq_add1.onerror   = log("rq_add1.error");

            objStore.createIndex("index", "animal", { unique: true });

            var rq_add2 = objStore.add({ animal: "Unicorn" }, 2);
            rq_add2.onsuccess = log("rq_add2.success");
            rq_add2.onerror   = function(e) {
                log("rq_add2.error")(e);
                e.preventDefault();
                e.stopPropagation();
            }

            objStore.deleteIndex("index");

            var rq_add3 = objStore.add({ animal: "Unicorn" }, 3);
            rq_add3.onsuccess = log("rq_add3.success");
            rq_add3.onerror   = log("rq_add3.error");
        }

        open_rq.onsuccess = function(e) {
            log("open_rq.success")(e);
            assert.deepEqual(events, [ "rq_add1.success",
                                           "rq_add2.error: ConstraintError",
                                           "rq_add3.success",

                                           "transaction.complete",

                                           "open_rq.success" ],
                                "events");
            done();
        }

        function log(msg) {
            return function(e) {
                if(e && e.target && e.target.error)
                    events.push(msg + ": " + e.target.error.name);
                else
                    events.push(msg);
            };
        }
    });

    // idbobjectstore_createindex5
    it('empty keyPath', function (done) {
        var db, aborted;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var txn = e.target.transaction,
              objStore = db.createObjectStore("store");

            for (var i = 0; i < 5; i++)
                objStore.add("object_" + i, i);

            var rq = objStore.createIndex("index", "")
            rq.onerror = function() { throw new Error("error: " + rq.error.name); }
            rq.onsuccess = function() { }

            objStore.index("index")
                    .get('object_4')
                    .onsuccess = function(e) {
                assert.equal(e.target.result, 'object_4', 'result');
            };
        }

        open_rq.onsuccess = function() {
            done();
        }
    });

    // idbobjectstore_createindex6
    it('event order when unique constraint is triggered', function (done) {
        var db,
          events = [];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            db.onerror = log("db.error");
            db.onabort = log("db.abort");
            e.target.transaction.onabort = log("transaction.abort")
            e.target.transaction.onerror = log("transaction.error")
            e.target.transaction.oncomplete = log("transaction.complete")

            var txn = e.target.transaction,
              objStore = db.createObjectStore("store");

            var rq_add1 = objStore.add({ animal: "Unicorn" }, 1);
            rq_add1.onsuccess = log("rq_add1.success");
            rq_add1.onerror   = log("rq_add1.error");

            var rq_add2 = objStore.add({ animal: "Unicorn" }, 2);
            rq_add2.onsuccess = log("rq_add2.success");
            rq_add2.onerror   = log("rq_add2.error");

            objStore.createIndex("index", "animal", { unique: true })

            var rq_add3 = objStore.add({ animal: "Unicorn" }, 3);
            rq_add3.onsuccess = log("rq_add3.success");
            rq_add3.onerror   = log("rq_add3.error");
        }

        open_rq.onerror = function(e) {
            log("open_rq.error")(e);
            assert.deepEqual(events, [ "rq_add1.success",
                                           "rq_add2.success",

                                           "rq_add3.error: AbortError",
                                           "transaction.error: AbortError",
                                           "db.error: AbortError",

                                           "transaction.abort: ConstraintError",
                                           "db.abort: ConstraintError",

                                           "open_rq.error: AbortError" ],
                                "events");
            done();
        }

        function log(msg) {
            return function(e) {
                if(e && e.target && e.target.error)
                    events.push(msg + ": " + e.target.error.name);
                else
                    events.push(msg);
            };
        }
    });

    // idbobjectstore_createindex7
    it('Event ordering for ConstraintError on request', function (done) {
        var db,
          events = [];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var txn = e.target.transaction;
            db.onerror = log("db.error");
            db.onabort = log("db.abort");
            txn.onabort = log("transaction.abort")
            txn.onerror = log("transaction.error")
            txn.oncomplete = log("transaction.complete")

            var objStore = db.createObjectStore("store");

            var rq_add1 = objStore.add({ animal: "Unicorn" }, 1);
            rq_add1.onsuccess = log("rq_add1.success");
            rq_add1.onerror   = log("rq_add1.error");

            objStore.createIndex("index", "animal", { unique: true })

            var rq_add2 = objStore.add({ animal: "Unicorn" }, 2);
            rq_add2.onsuccess = log("rq_add2.success");
            rq_add2.onerror   = log("rq_add2.error");

            var rq_add3 = objStore.add({ animal: "Horse" }, 3);
            rq_add3.onsuccess = log("rq_add3.success");
            rq_add3.onerror   = log("rq_add3.error");
        }

        open_rq.onerror = function(e) {
            log("open_rq.error")(e);
            assert.deepEqual(events, [ "rq_add1.success",

                                           "rq_add2.error: ConstraintError",
                                           "transaction.error: ConstraintError",
                                           "db.error: ConstraintError",

                                           "rq_add3.error: AbortError",
                                           "transaction.error: AbortError",
                                           "db.error: AbortError",

                                           "transaction.abort: ConstraintError",
                                           "db.abort: ConstraintError",

                                           "open_rq.error: AbortError" ],
                                "events");
            done();
        }

        function log(msg) {
            return function(e) {
                if(e && e.target && e.target.error)
                    events.push(msg + ": " + e.target.error.name);
                else
                    events.push(msg);
            };
        }
    });

    // idbobjectstore_createindex8
    it('index can be valid keys', function (done) {
        var db,
          now = new Date(),
          mar18 = new Date(1111111111111),
          ar = ["Yay", 2, -Infinity],
          num = 1337

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var txn = e.target.transaction,
              objStore = db.createObjectStore("store", { keyPath: 'key' });

            objStore.add({ key: "now",    i: now   });
            objStore.add({ key: "mar18",  i: mar18 });
            objStore.add({ key: "array",  i: ar    });
            objStore.add({ key: "number", i: num   });

            var idx = objStore.createIndex("index", "i")

            idx.get(now).onsuccess = function(e) {
                assert.equal(e.target.result.key, 'now', 'key');
                assert.equal(e.target.result.i.getTime(), now.getTime(), 'getTime');
            };
            idx.get(mar18).onsuccess = function(e) {
                assert.equal(e.target.result.key, 'mar18', 'key');
                assert.equal(e.target.result.i.getTime(), mar18.getTime(), 'getTime');
            };
            idx.get(ar).onsuccess = function(e) {
                assert.equal(e.target.result.key, 'array', 'key');
                assert.deepEqual(e.target.result.i, ar, 'array is the same');
            };
            idx.get(num).onsuccess = function(e) {
                assert.equal(e.target.result.key, 'number', 'key');
                assert.equal(e.target.result.i, num, 'number is the same');
            };
        }

        open_rq.onsuccess = function() {
            done();
        }
    });

    // idbobjectstore_createindex9
    it('empty name', function (done) {
        var db

        var open_rq = createdb(done)
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result
            var store = db.createObjectStore("store")

            for (var i = 0; i < 5; i++)
                store.add({ idx: "object_" + i }, i)

            store.createIndex("", "idx")

            store.index("")
                 .get('object_4')
                 .onsuccess = function(e) {
                assert.equal(e.target.result.idx, 'object_4', 'result')
            }
            assert.equal(store.indexNames[0], "", "indexNames[0]")
            assert.equal(store.indexNames.length, 1, "indexNames.length")
        }

        open_rq.onsuccess = function() {
            var store = db.transaction("store").objectStore("store")

            assert.equal(store.indexNames[0], "", "indexNames[0]")
            assert.equal(store.indexNames.length, 1, "indexNames.length")

            done()
        }
    });

    // idbobjectstore_createindex10
    it('If an index with the name name already exists in this object store, the implementation must throw a DOMException of type ConstraintError', function (done) {
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function (e) {
            var db = e.target.result;
            var ostore = db.createObjectStore("store");
            ostore.createIndex("a", "a");
            support.throws(function(){
                ostore.createIndex("a", "a");
            }, 'ConstraintError');
            done();
        }
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_createindex11
    it('If keyPath is not a valid key path, the implementation must throw a DOMException of type SyntaxError', function (done) {
       var open_rq = createdb(done);

       open_rq.onupgradeneeded = function (e) {
           var db = e.target.result;
           var ostore = db.createObjectStore("store");
           support.throws(function(){
               ostore.createIndex("ab", ".");
           }, 'SyntaxError');
           done();
       }
       open_rq.onsuccess = function () {};
    });

    // idbobjectstore_createindex12
    it('If the object store has been deleted, the implementation must throw a DOMException of type InvalidStateError', function (done) {
        var db,
            ostore;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function (event) {
            db = event.target.result;
            ostore = db.createObjectStore("store");
            db.deleteObjectStore("store");
        }

        open_rq.onsuccess = function (event) {
            support.throws(function(){
                ostore.createIndex("index", "indexedProperty");
            }, 'InvalidStateError');
            done();
        }
    });

    // idbobjectstore_createindex13
    it('Operate out versionchange throw InvalidStateError', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function (event) {
            db = event.target.result;
            db.createObjectStore("store");
        }

        open_rq.onsuccess = function (event) {
            var txn = db.transaction("store", "readwrite");
            var ostore = txn.objectStore("store");
            support.throws(function(){
                ostore.createIndex("index", "indexedProperty");
            }, 'InvalidStateError');
            done();
        }
    });
});

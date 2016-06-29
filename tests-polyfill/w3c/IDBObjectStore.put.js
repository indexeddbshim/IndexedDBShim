var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBRequest = IDBRequest;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBObjectStore.put Tests', function () {
    // idbobjectstore_put
    it('put with an inline key', function (done) {
        var db,
          record = { key: 1, property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "key" });

            objStore.put(record);
        };

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .get(record.key);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result.property, record.property);
                assert.equal(e.target.result.key, record.key);
                done();
            };
        };
    });

    // idbobjectstore_put2
    it('put with an out-of-line key', function (done) {
        var db,
          key = 1,
          record = { property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store");

            objStore.put(record, key);
        };

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .get(key);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result.property, record.property);

                done();
            };
        };
    });

    // idbobjectstore_put3
    it('record with same key already exists', function (done) {
        var db, success_event,
          record = { key: 1, property: "data" },
          record_put = { key: 1, property: "changed", more: ["stuff", 2] };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "key" });
            objStore.put(record);

            var rq = objStore.put(record_put);

            rq.onsuccess = function(e) {
                success_event = true;
            };
        };

        open_rq.onsuccess = function(e) {
            assert(success_event);

            var rq = db.transaction("store")
                       .objectStore("store")
                       .get(1);

            rq.onsuccess = function(e) {
                var rec = e.target.result;

                assert.equal(rec.key, record_put.key);
                assert.equal(rec.property, record_put.property);
                assert.deepEqual(rec.more, record_put.more);

                done();
            };
        };
    });

    // idbobjectstore_put4
    it('put where an index has unique:true specified', function (done) {
        var db,
          record = { key: 1, property: "data" };
        var errors = 0;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { autoIncrement: true });
            objStore.createIndex("i1", "property", { unique: true });
            objStore.put(record);

            var rq = objStore.put(record);

            rq.onerror = function(e) {
                errors += 1;

                assert.equal(rq.error.name, "ConstraintError");
                assert.equal(e.target.error.name, "ConstraintError");

                assert.equal(e.type, "error");

                e.preventDefault();
                e.stopPropagation();
            };
        };

        // Defer done, giving a spurious rq.onsuccess a chance to run
        open_rq.onsuccess = function(e) {
            assert.equal(errors, 1);
            done();
        }
    });

    // idbobjectstore_put5
    it("object store's key path is an object attribute", function (done) {
        var db,
          record = { test: { obj: { key: 1 } }, property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "test.obj.key" });
            objStore.put(record);
        };

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .get(record.test.obj.key);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result.property, record.property);

                done();
            };
        };
    });

    // idbobjectstore_put6
    it('autoIncrement and inline keys', function (done) {
        var db,
          record = { property: "data" },
          expected_keys = [ 1, 2, 3, 4 ];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "key", autoIncrement: true });

            objStore.put(record);
            objStore.put(record);
            objStore.put(record);
            objStore.put(record);
        };

        open_rq.onsuccess = function(e) {
            var actual_keys = [],
              rq = db.transaction("store")
                     .objectStore("store")
                     .openCursor();

            rq.onsuccess = function(e) {
                var cursor = e.target.result;

                if (cursor) {
                    actual_keys.push(cursor.value.key);
                    cursor.continue();
                }
                else {
                    assert.deepEqual(actual_keys, expected_keys);
                    done();
                }
            };
        };
    });

    // idbobjectstore_put7
    it('autoIncrement and out-of-line keys', function (done) {
        var db,
          record = { property: "data" },
          expected_keys = [ 1, 2, 3, 4 ];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { autoIncrement: true });

            objStore.put(record);
            objStore.put(record);
            objStore.put(record);
            objStore.put(record);
        };

        open_rq.onsuccess = function(e) {
            var actual_keys = [],
              rq = db.transaction("store")
                     .objectStore("store")
                     .openCursor();

            rq.onsuccess = function(e) {
                var cursor = e.target.result;

                if (cursor) {
                    actual_keys.push(cursor.key);
                    cursor.continue();
                }
                else {
                    assert.deepEqual(actual_keys, expected_keys);
                    done();
                }
            };
        };
    });

    // idbobjectstore_put8
    it('object store has autoIncrement:true and the key path is an object attribute', function (done) {
        var db,
          record = { property: "data" },
          expected_keys = [ 1, 2, 3, 4 ];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "test.obj.key", autoIncrement: true });

            objStore.put(record);
            objStore.put(record);
            objStore.put(record);
            objStore.put(record);
        };

        open_rq.onsuccess = function(e) {
            var actual_keys = [],
              rq = db.transaction("store")
                     .objectStore("store")
                     .openCursor();

            rq.onsuccess = function(e) {
                var cursor = e.target.result;

                if (cursor) {
                    actual_keys.push(cursor.value.test.obj.key);
                    cursor.continue();
                }
                else {
                    assert.deepEqual(actual_keys, expected_keys);
                    done();
                }
            };
        };
    });

    // idbobjectstore_put9
    it("Attempt to put a record that does not meet the constraints of an object store's inline key requirements", function (done) {
        var record = { key: 1, property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            var rq,
              db = e.target.result,
              objStore = db.createObjectStore("store", { keyPath: "key" });

            support.throws(function() {
                rq = objStore.put(record, 1);
            }, 'DataError');

            assert.equal(rq, undefined);
            done();
        };
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_put10
    it("Attempt to call 'put' without an key parameter when the object store uses out-of-line keys", function (done) {
        var db,
          record = { property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var rq,
              objStore = db.createObjectStore("store", { keyPath: "key" });

            support.throws(function() {
                rq = objStore.put(record);
            }, 'DataError');

            assert.equal(rq, undefined);
            done();
        };
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_put11
    it("Attempt to put a record where the record's key does not meet the constraints of a valid key", function (done) {
        var db,
          record = { key: { value: 1 }, property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var rq,
              objStore = db.createObjectStore("store", { keyPath: "key" });

            support.throws(function() {
                rq = objStore.put(record);
            }, 'DataError');

            assert.equal(rq, undefined);
            done();
        };
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_put12
    it("Attempt to put a record where the record's in-line key is not defined", function (done) {
        var db,
          record = { property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var rq,
              objStore = db.createObjectStore("store", { keyPath: "key" });

            support.throws(function() {
                rq = objStore.put(record);
            }, 'DataError');

            assert.equal(rq, undefined);
            done();
        };
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_put13
    it('Attempt to put a record where the out of line key provided does not meet the constraints of a valid key', function (done) {
        var db,
          record = { property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var rq,
              objStore = db.createObjectStore("store");

            support.throws(function() {
                rq = objStore.put(record, { value: 1 });
            }, 'DataError');

            assert.equal(rq, undefined);
            done();
        };
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_put14
    it('Put a record where a value being indexed does not meet the constraints of a valid key', function (done) {
        var db,
          record = { key: 1, indexedProperty: { property: "data" } };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var rq,
              objStore = db.createObjectStore("store", { keyPath: "key" });

            objStore.createIndex("index", "indexedProperty");

            rq = objStore.put(record);

            assert(rq instanceof FDBRequest);
            rq.onsuccess = function() {
                done();
            }
        };
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_put15
    it('If the transaction this IDBObjectStore belongs to has its mode set to readonly, throw ReadOnlyError', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function (event) {
            db = event.target.result;
            db.createObjectStore("store", {keyPath:"pKey"});
        }

        open_rq.onsuccess = function (event) {
            var txn = db.transaction("store");
            var ostore = txn.objectStore("store");
            support.throws(function() {
                ostore.put({pKey: "primaryKey_0"});
            }, 'ReadOnlyError');
            done();
        }
    });

    // idbobjectstore_put16
    it('If the object store has been deleted, the implementation must throw a DOMException of type InvalidStateError', function (done) {
        var db,
            ostore;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function (event) {
            db = event.target.result;
            ostore = db.createObjectStore("store", {keyPath:"pKey"});
            db.deleteObjectStore("store");
        }

        open_rq.onsuccess = function (event) {
            support.throws(function() {
                ostore.put({pKey: "primaryKey_0"});
            }, 'InvalidStateError');
            done();
        }
    });
});

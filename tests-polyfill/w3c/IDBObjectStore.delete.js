var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBKeyRange = IDBKeyRange;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBObjectStore.delete Tests', function () {
    // idbobjectstore_delete
    it('delete removes record (inline keys)', function (done) {
        var db,
          record = { key: 1, property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var objStore = db.createObjectStore("test", { keyPath: "key" });
            objStore.add(record);
        };

        open_rq.onsuccess = function(e) {
            var delete_rq = db.transaction("test", "readwrite")
                              .objectStore("test")
                              .delete(record.key);

            delete_rq.onsuccess = function(e) {
                assert.equal(e.target.result, undefined);

                e.target.transaction.oncomplete = VerifyRecordRemoved;
            };
        };

        function VerifyRecordRemoved() {
            var rq = db.transaction("test")
                       .objectStore("test")
                       .get(record.key);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, undefined);
                done();
            };
        }
    });

    // idbobjectstore_delete2
    it("key doesn't match any records", function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var delete_rq = db.createObjectStore("test")
                              .delete(1);

            delete_rq.onsuccess = function(e) {
                assert.equal(e.target.result, undefined);
                done();
            };
        };
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_delete3
    it("object store's key path is an object attribute", function (done) {
        var db,
          record = { test: { obj: { key: 1 } }, property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var objStore = db.createObjectStore("test", { keyPath: "test.obj.key" });
            objStore.add(record);
        };

        open_rq.onsuccess = function(e) {
            var delete_rq = db.transaction("test", "readwrite")
                              .objectStore("test")
                              .delete(record.test.obj.key);

            delete_rq.onsuccess = function(e) {
                assert.equal(e.target.result, undefined);

                e.target.transaction.oncomplete = VerifyRecordRemoved;
            };
        };

        function VerifyRecordRemoved() {
            var rq = db.transaction("test")
                       .objectStore("test")
                       .get(record.test.obj.key);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, undefined);
                done();
            };
        }
    });

    // idbobjectstore_delete4
    it('delete removes record (out-of-line keys)', function (done) {
        var db,
          key = 1,
          record = { property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var objStore = db.createObjectStore("test");
            objStore.add(record, key);
        };

        open_rq.onsuccess = function(e) {
            var delete_rq = db.transaction("test", "readwrite")
                              .objectStore("test")
                              .delete(key);

            delete_rq.onsuccess = function(e) {
                assert.equal(e.target.result, undefined);

                e.target.transaction.oncomplete = VerifyRecordRemoved;
            };
        };

        function VerifyRecordRemoved() {
            var rq = db.transaction("test")
                       .objectStore("test")
                       .get(key);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, undefined);
                done();
            };
        }
    });

    // idbobjectstore_delete5
    it('removes all of the records in the range', function (done) {
        var db
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result
            var os = db.createObjectStore("store")

            for(var i = 0; i < 10; i++)
                os.add("data" + i, i)
        }

        open_rq.onsuccess = function (e) {
            var os = db.transaction("store", "readwrite")
                       .objectStore("store")

            os.delete( FDBKeyRange.bound(3, 6) )
            os.count().onsuccess = function(e)
            {
                assert.equal(e.target.result, 6, "Count after deleting 3-6 from 10");
                done();
            }
        }
    });

    // idbobjectstore_delete6
    it('If the transaction this IDBObjectStore belongs to has its mode set to readonly, throw ReadOnlyError', function (done) {
        var db,
            records = [{ pKey: "primaryKey_0"},
                       { pKey: "primaryKey_1"}];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function (event) {
            db = event.target.result;
            var objStore = db.createObjectStore("store", {keyPath:"pKey"});
            for (var i = 0; i < records.length; i++) {
                objStore.add(records[i]);
            }
        }

        open_rq.onsuccess = function (event) {
            var txn = db.transaction("store");
            var ostore = txn.objectStore("store");
            support.throws(function(){
                ostore.delete("primaryKey_0");
            }, 'ReadOnlyError');
            done();
        }
    });

    // idbobjectstore_delete7
    it('If the object store has been deleted, the implementation must throw a DOMException of type InvalidStateError', function (done) {
        var db,
            ostore,
            records = [{ pKey: "primaryKey_0"},
                       { pKey: "primaryKey_1"}];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function (event) {
            db = event.target.result;
            ostore = db.createObjectStore("store", {keyPath:"pKey"});
            db.deleteObjectStore("store");
        }

        open_rq.onsuccess = function (event) {
            support.throws(function(){
                ostore.delete("primaryKey_0");
            }, 'InvalidStateError');
            done();
        }
    });
});

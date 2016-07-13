var assert = require('assert');
var support = require('./support');
var FDBKeyRange = IDBKeyRange;
var createdb = support.createdb;

describe('W3C IDBIndex.get Tests', function () {
    // idbindex_get
    it('returns the record', function (done) {
        var db,
          record = { key: 1, indexedProperty: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "key" });
            index = objStore.createIndex("index", "indexedProperty");

            objStore.add(record);
        }

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .index("index")
                       .get(record.indexedProperty);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result.key, record.key);
                done();
            };
        }
    });

    // idbindex_get2
    it('returns the record where the index contains duplicate values', function (done) {
        var db,
          records = [ { key:1, indexedProperty:"data" },
                      { key:2, indexedProperty:"data" },
                      { key:3, indexedProperty:"data" } ];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("test", { keyPath: "key" });
            objStore.createIndex("index", "indexedProperty");

            for (var i = 0; i < records.length; i++)
                objStore.add(records[i]);
        };

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("test")
                       .objectStore("test")
                       .index("index")
                       .get("data");

            rq.onsuccess = function(e) {
                assert.equal(e.target.result.key, records[0].key);
                done();
            };
        };
    });

    // idbindex_get3
    it("attempt to retrieve a record that doesn't exist", function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var rq = db.createObjectStore("test", { keyPath: "key" })
                       .createIndex("index", "indexedProperty")
                       .get(1);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, undefined);
                done();
            };
        };
        open_rq.onsuccess = function () {};
    });

    // idbindex_get4
    it('returns the record with the first key in the range', function (done) {
        var db;

        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            store.createIndex("index", "indexedProperty");

            for(var i = 0; i < 10; i++) {
                store.add({ key: i, indexedProperty: "data" + i });
            }
        }

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .index("index")
                       .get(FDBKeyRange.bound('data4', 'data7'));

            rq.onsuccess = function(e) {
                assert.equal(e.target.result.key, 4);
                assert.equal(e.target.result.indexedProperty, 'data4');

                setTimeout(function() { done(); }, 4)
            };
        }
    });

    // idbindex_get5
    it('throw DataError when using invalid key', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var index = db.createObjectStore("test", { keyPath: "key" })
                          .createIndex("index", "indexedProperty");
            support.throws(function(){
                index.get(NaN);
            }, 'DataError');
            done();
        };
        open_rq.onsuccess = function () {};
    });

    // idbindex_get6
    it('throw InvalidStateError when the index is deleted', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");

            store.add({ key: 1, indexedProperty: "data" });
            store.deleteIndex("index");

            support.throws(function(){
                index.get("data");
            }, 'InvalidStateError');
            done();
        }
        open_rq.onsuccess = function (e) { };
    });

    // idbindex_get7
    it('throw TransactionInactiveError on aborted transaction', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");
            store.add({ key: 1, indexedProperty: "data" });

            e.target.transaction.abort();

            support.throws(function(){
                index.get("data");
            }, 'TransactionInactiveError');
            done();
        }
        open_rq.onerror = function () {};
    });
});

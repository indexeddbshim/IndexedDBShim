var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBKeyRange = IDBKeyRange;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBIndex.count Tests', function () {
    // idbindex_count
    it('returns the number of records in the index', function (done) {
        var db;

        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { autoIncrement: true });
            store.createIndex("index", "indexedProperty");

            for(var i = 0; i < 10; i++) {
                store.add({ indexedProperty: "data" + i });
            }
        }

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .index("index")
                       .count();

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, 10);
                done();
            };
        }
    });

    // idbindex_count2
    it('returns the number of records that have keys within the range', function (done) {
        var db;

        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { autoIncrement: true });
            store.createIndex("index", "indexedProperty");

            for(var i = 0; i < 10; i++) {
                store.add({ indexedProperty: "data" + i });
            }
        }

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .index("index")
                       .count(FDBKeyRange.bound('data0', 'data4'));

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, 5);
                done();
            };
        }
    });

    // idbindex_count3
    it('returns the number of records that have keys with the key', function (done) {
        var db

        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result

            var store = db.createObjectStore("store", { autoIncrement: true })
            store.createIndex("myindex", "idx")

            for (var i = 0; i < 10; i++)
                store.add({ idx: "data_" + (i%2) });

            store.index("myindex").count("data_0").onsuccess = function(e) {
                assert.equal(e.target.result, 5, "count(data_0)")
                done()
            }
        }
        open_rq.onsuccess = function () {};
    });

    // idbindex_count4
    it('throw DataError when using invalid key', function (done) {
        var db;

        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { autoIncrement: true });
            store.createIndex("index", "indexedProperty");

            for(var i = 0; i < 10; i++) {
                store.add({ indexedProperty: "data" + i });
            }
        }

        open_rq.onsuccess = function(e) {
            var index = db.transaction("store")
                          .objectStore("store")
                          .index("index");

            support.throws(function() {
                index.count(NaN);
            }, 'DataError');

            done();
        }
    });
});

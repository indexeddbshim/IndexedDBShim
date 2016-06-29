var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBKeyRange = IDBKeyRange;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBObjectStore.get Tests', function () {
    // idbobjectstore_get
    it('key is a number', function (done) {
        var db,
          record = { key: 3.14159265, property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            db.createObjectStore("store", { keyPath: "key" })
              .add(record);
        }

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .get(record.key);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result.key, record.key);
                assert.equal(e.target.result.property, record.property);
                done();
            };
        }
    });

    // idbobjectstore_get2
    it('key is a string', function (done) {
        var db,
          record = { key: "this is a key that's a string", property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            db.createObjectStore("store", { keyPath: "key" })
              .add(record);
        };

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .get(record.key);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result.key, record.key);
                assert.equal(e.target.result.property, record.property);
                done();
            };
        };
    });

    // idbobjectstore_get3
    it('key is a Date', function (done) {
        var db,
          record = { key: new Date(), property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            db.createObjectStore("store", { keyPath: "key" })
              .add(record);
        }

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .get(record.key);

            rq.onsuccess = function(e) {
                assert.equal(e.target.result.key.valueOf(), record.key.valueOf());
                assert.equal(e.target.result.property, record.property);
                done();
            };
        }
    });

    // idbobjectstore_get4
    it("attempt to retrieve a record that doesn't exist", function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var rq = db.createObjectStore("store", { keyPath: "key" })
                       .get(1);
            rq.onsuccess = function(e) {
                assert.equal(e.target.results, undefined);
                setTimeout(function() { done(); }, 10);
            };
        };

        open_rq.onsuccess = function() {};
    });

    // idbobjectstore_get5
    it('returns the record with the first key in the range', function (done) {
        var db
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result
            var os = db.createObjectStore("store")

            for(var i = 0; i < 10; i++)
                os.add("data" + i, i)
        }

        open_rq.onsuccess = function (e) {
            db.transaction("store")
              .objectStore("store")
              .get( FDBKeyRange.bound(3, 6) )
              .onsuccess = function(e)
            {
                assert.equal(e.target.result, "data3", "get(3-6)");
                done();
            };
        }
    });

    // idbobjectstore_get6
    it('throw TransactionInactiveError on aborted transaction', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            db.createObjectStore("store", { keyPath: "key" })
        }

        open_rq.onsuccess = function (e) {
            var store = db.transaction("store")
                          .objectStore("store");
            store.transaction.abort();
            support.throws(function () {
                store.get(1);
            }, 'TransactionInactiveError');
            done();
        }
    });

    // idbobjectstore_get7
    it('throw DataError when using invalid key', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            db.createObjectStore("store", { keyPath: "key" })
        }

        open_rq.onsuccess = function(e) {
            var store = db.transaction("store")
                          .objectStore("store")
            support.throws(function () {
                store.get(null)
            }, 'DataError');
            done();
        }
    });
});

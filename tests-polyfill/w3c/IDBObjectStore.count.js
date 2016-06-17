var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBKeyRange = IDBKeyRange;
var InvalidStateError = DOMException;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBObjectStore.count Tests', function () {
    // idbobjectstore_count
    it('returns the number of records in the object store', function (done) {
        var db;

        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store");

            for(var i = 0; i < 10; i++) {
                store.add({ data: "data" + i }, i);
            }
        }

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .count();

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, 10);
                done();
            };
        }
    });

    // idbobjectstore_count2
    it('returns the number of records that have keys within the range', function (done) {
        var db;

        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store");

            for(var i = 0; i < 10; i++) {
                store.add({ data: "data" + i }, i);
            }
        }

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .count(FDBKeyRange.bound(5,20));

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, 5);
                done();
            };
        }
    });

    // idbobjectstore_count3
    it('returns the number of records that have keys with the key', function (done) {
        var db

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result

            var store = db.createObjectStore("store", { keyPath: "k" })

            for (var i = 0; i < 5; i++)
                store.add({ k: "key_" + i });

            store.count("key_2").onsuccess = function(e) {
                assert.equal(e.target.result, 1, "count(key_2)")

                store.count("key_").onsuccess = function(e) {
                    assert.equal(e.target.result, 0, "count(key_)")
                    done()
                }
            }
        }
        open_rq.onsuccess = function () {};
    });

    // idbobjectstore_count4
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
            assert.throws(function(){
                ostore.count();
            }, InvalidStateError);
            done();
        }
    });
});

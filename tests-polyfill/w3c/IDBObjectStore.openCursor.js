var assert = require('assert');
var indexedDB = require('../test-helper');
var DataError = DOMException;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBObjectStore.openCursor Tests', function () {
    // idbobjectstore_openCursor
    it('iterate through 100 objects', function (done) {
        var db
        var open_rq = createdb(done)
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store");
            for (var i=0; i < 100; i++)
                store.add("record_" + i, i);
        };
        open_rq.onsuccess = function(e) {
            var count = 0
            var txn = db.transaction("store")
            txn.objectStore("store")
               .openCursor().onsuccess = function(e)
            {
                if (e.target.result) {
                    count += 1;
                    e.target.result.continue()
                }
            }
            txn.oncomplete = function() {
                assert.equal(count, 100);
                done()
            }
        }
    });

    // idbobjectstore_openCursor_invalid
    it('invalid', function (done) {
        var db, open;
        open = indexedDB.open('testdb-' + new Date().getTime());
        open.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("test");
            objStore.createIndex("index", "");
            objStore.add("data",  1);
            objStore.add("data2", 2);
        };
        open.onsuccess = function() {
            var idx = db.transaction("test").objectStore("test").index("index");
            assert.throws(
                function() { idx.openCursor({ lower: "a" }); }, DataError);
            assert.throws(
                function() { idx.openCursor({ lower: "a", lowerOpen: false }); }, DataError);
            assert.throws(
                function() { idx.openCursor({ lower: "a", lowerOpen: false, upper: null, upperOpen: false }); }, DataError);
            done();
        }
    });
});

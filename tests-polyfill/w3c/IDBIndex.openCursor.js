var assert = require('assert');
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBIndex.openCursor()', function () {
    // idbindex_openCursor
    it('throw InvalidStateError when the index is deleted', function (done) {
        var db;
        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");
            store.add({ key: 1, indexedProperty: "data" });
            store.deleteIndex("index");
            support.assert_throws(function(){
                index.openCursor();
            }, "InvalidStateError");
            done();
        }
    });

    // idbindex_openCursor2
    it('throw TransactionInactiveError on aborted transaction', function (done) {
        var db;
        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");
            store.add({ key: 1, indexedProperty: "data" });
        }
        open_rq.onsuccess = function(e) {
            db = e.target.result;
            var tx = db.transaction('store');
            var index = tx.objectStore('store').index('index');
            tx.abort();
            support.assert_throws(function(){
                index.openCursor();
            }, "InvalidStateError");
            done();
        }
    });
    // idbindex_openCursor3
    it('throw InvalidStateError on index deleted by aborted upgrade', function (done) {
        var db;
        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");
            store.add({ key: 1, indexedProperty: "data" });
            e.target.transaction.abort();
            support.assert_throws(function(){
                index.openCursor();
            }, "InvalidStateError");
            done();
        }
    });
});

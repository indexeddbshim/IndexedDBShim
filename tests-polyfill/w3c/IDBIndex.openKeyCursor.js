var assert = require('assert');
var DataError = DOMException;
var InvalidStateError = DOMException;
var TransactionInactiveError = DOMException;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBIndex.openKeyCursor Tests', function () {
    // idbindex_openKeyCursor
    it('throw DataError when using a invalid key', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");

            store.add({ key: 1, indexedProperty: "data" });

            assert.throws(function(){
                index.openKeyCursor(NaN);
            }, DataError);
            done();
        }
        open_rq.onsuccess = function () {};
    });

    // idbindex_openKeyCursor
    it('throw InvalidStateError when the index is deleted', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");

            store.add({ key: 1, indexedProperty: "data" });
            store.deleteIndex("index");

            assert.throws(function(){
                index.openKeyCursor();
            }, InvalidStateError);
            done();
        }
        open_rq.onsuccess = function () {};
    });

    // idbindex_openKeyCursor
    it('throw TransactionInactiveError on aborted transaction', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");
            store.add({ key: 1, indexedProperty: "data" });

            e.target.transaction.abort();

            assert.throws(function(){
                index.openKeyCursor();
            }, TransactionInactiveError);
            done();
        }
        open_rq.onerror = function () {};
    });
});
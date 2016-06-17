var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBIndex = IDBIndex;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBObjectStore.index Tests', function () {
    // idbobjectstore_index
    it('removes the index', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            db.createObjectStore("store")
              .createIndex("index", "indexedProperty");
        };

        open_rq.onsuccess = function(e) {
            var index = db.transaction("store")
                          .objectStore("store")
                          .index("index");

            assert(index instanceof FDBIndex, 'instanceof FDBIndex');
            done();
        };
    });
});

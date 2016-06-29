var assert = require('assert');
var indexedDB = require('../test-helper');
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBObjectStore.deleteIndex Tests', function () {
    // idbobjectstore_deleteindex
    it('removes the index', function (done) {
        var db,
          key = 1,
          record = { property: "data" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            db.createObjectStore("test")
              .createIndex("index", "indexedProperty")
        };

        open_rq.onsuccess = function(e) {
            db.close();
            var new_version = createdb(done, db.name, 2);
            new_version.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = e.target.transaction.objectStore("test")
                objStore.deleteIndex("index");
            }
            new_version.onsuccess = function(e) {
                var index,
                  objStore = db.transaction("test")
                               .objectStore("test");

                support.throws(function() {
                    index = objStore.index("index")
                }, 'NotFoundError');
                assert.equal(index, undefined);
                done();
            }
        }
    });
});

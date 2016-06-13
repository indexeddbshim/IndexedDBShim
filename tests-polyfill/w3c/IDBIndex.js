var assert = require('assert');
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBIndex Tests', function () {
    // idbindex_indexNames
    it('indexNames', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("test", { keyPath: "key" });
            objStore.createIndex("index", "data");

            assert.equal(objStore.indexNames[0], "index", "indexNames");
            assert.equal(objStore.indexNames.length, 1, "indexNames.length");
        };

        open_rq.onsuccess = function(e) {
            var objStore = db.transaction("test")
                       .objectStore("test");

            assert.equal(objStore.indexNames[0], "index", "indexNames (second)");
            assert.equal(objStore.indexNames.length, 1, "indexNames.length (second)");

            done();
        };
    });

    // index_sort_order
    it("Verify key sort order in an index is 'number < Date < DOMString'", function (done) {
        var db,
          d = new Date(),
          records = [ { foo: d },
                      { foo: "test" },
                      { foo: 1 },
                      { foo: 2.55 }  ],
          expectedKeyOrder = [ 1, 2.55, d.valueOf(), "test" ];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { autoIncrement: true });
            objStore.createIndex("index", "foo");

            for (var i = 0; i < records.length; i++)
                objStore.add(records[i]);
        };

        open_rq.onsuccess = function(e) {
            var actual_keys = [],
              rq = db.transaction("store")
                     .objectStore("store")
                     .index("index")
                     .openCursor();

            rq.onsuccess = function(e) {
                var cursor = e.target.result;

                if (cursor) {
                    actual_keys.push(cursor.key.valueOf());
                    cursor.continue();
                }
                else {
                    assert.deepEqual(actual_keys, expectedKeyOrder);
                    done();
                }
            };
        };
    })
});

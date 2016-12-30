describe('W3C IDBIndex.getKey Tests', function () {
    var FDBKeyRange = IDBKeyRange;
    var createdb = support.createdb;

    // idbindex_count
    it("returns the record's primary key", function (done) {
        var db,
          record = { key:1, indexedProperty:"data" };
        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("test", { keyPath: "key" });
            objStore.createIndex("index", "indexedProperty");
            objStore.add(record);
        };
        open_rq.onsuccess = function(e) {
            var rq = db.transaction("test")
                       .objectStore("test");
            rq = rq.index("index");
            rq = rq.getKey("data");
            rq.onsuccess = function(e) {
                assert.equal(e.target.result, record.key);
                done();
            };
        };
    });

    // idbindex_count2
    it("returns the record's primary key where the index contains duplicate values", function (done) {
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
                       .getKey("data");
            rq.onsuccess = function(e) {
                assert.equal(e.target.result, records[0].key);
                done();
            };
        };
    });

    // idbindex_count3
    it("attempt to retrieve the primary key of a record that doesn't exist", function (done) {
        var db;
        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var rq = db.createObjectStore("test", { keyPath: "key" })
                       .createIndex("index", "indexedProperty")
                       .getKey(1);
            rq.onsuccess = function(e) {
                assert.equal(e.target.result, undefined);
                done();
            };
        };
        open_rq.onsuccess = function () {};
    });

    // idbindex_count4
    it('returns the key of the first record within the range', function (done) {
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
                       .getKey(FDBKeyRange.bound('data4', 'data7'));
            rq.onsuccess = function(e) {
                assert.equal(e.target.result, 4);
                setTimeout(function() { done(); }, 4)
            };
        }
    });

    // idbindex_count5
    it('throw DataError when using invalid key', function (done) {
        var db;
        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var index = db.createObjectStore("test", { keyPath: "key" })
                          .createIndex("index", "indexedProperty");
            support.throws(function(){
                index.getKey(NaN);
            }, 'DataError');
            done();
        };
        open_rq.onsuccess = function () {};
    });

    // idbindex_count6
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
                index.getKey("data");
            }, 'InvalidStateError');
            done();
        }
        open_rq.onsuccess = function () {};
    });

    // idbindex_count7
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
                index.getKey("data");
            }, 'TransactionInactiveError');
            done();
        }
        open_rq.onerror = function () {};
    });
});

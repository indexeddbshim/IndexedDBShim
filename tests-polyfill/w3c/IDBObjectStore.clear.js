describe('W3C IDBObjectStore.clear Tests', function () {
    var createdb = support.createdb;

    // idbobjectstore_clear
    it('Verify clear removes all records', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { autoIncrement: true });

            objStore.add({ property: "data" });
            objStore.add({ something_different: "Yup, totally different" });
            objStore.add(1234);
            objStore.add([1, 2, 1234]);

            objStore.clear().onsuccess = function(e) {
                assert.equal(e.target.result, undefined);
            };
        };


        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .openCursor();

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, null, 'cursor');
                done();
            };
        };
    });

    // idbobjectstore_clear2
    it('clear removes all records from an index', function (done) {
        var db;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { autoIncrement: true });
            objStore.createIndex("index", "indexedProperty");

            objStore.add({ indexedProperty: "data" });
            objStore.add({ indexedProperty: "yo, man", something_different: "Yup, totally different" });
            objStore.add({ indexedProperty: 1234 });
            objStore.add({ indexedProperty: [1, 2, 1234] });
            objStore.add(1234);

            objStore.clear().onsuccess = function(e) {
                assert.equal(e.target.result, undefined);
            };
        };

        open_rq.onsuccess = function(e) {
            var rq = db.transaction("store")
                       .objectStore("store")
                       .index("index")
                       .openCursor();

            rq.onsuccess = function(e) {
                assert.equal(e.target.result, null, 'cursor');
                done();
            };
        };
    });

    // idbobjectstore_clear3
    it('If the transaction this IDBObjectStore belongs to has its mode set to readonly, throw ReadOnlyError', function (done) {
        var db,
            records = [{ pKey: "primaryKey_0"},
                       { pKey: "primaryKey_1"}];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function (event) {
            db = event.target.result;
            var objStore = db.createObjectStore("store", {keyPath:"pKey"});
            for (var i = 0; i < records.length; i++) {
                objStore.add(records[i]);
            }
        }

        open_rq.onsuccess = function (event) {
            var txn = db.transaction("store");
            var ostore = txn.objectStore("store");
            support.throws(function(){
                ostore.clear();
            }, 'ReadOnlyError');
            done();
        }
    });

    // idbobjectstore_clear4
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
            support.throws(function(){
                ostore.clear();
            }, 'InvalidStateError');
            done();
        }
    });
});

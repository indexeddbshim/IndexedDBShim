var assert = require('assert');
var InvalidStateError = DOMException;
var NotFoundError = DOMException;
var support = require('./support');
var createdb = support.createdb;

/*Array.prototype.contains = function (item) {
    return this.indexOf(item) >= 0;
}*/

describe('W3C IDBDatabase.deleteObjectStore Tests', function () {
    // idbdatabase_deleteObjectStore
    it("object store's name is removed from database's list", function (done) {
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            var db = e.target.result

            db.createObjectStore("deleted");
            db.deleteObjectStore("deleted");
            assert(db.objectStoreNames.indexOf("deleted") < 0)

            done()
        }
        open_rq.onsuccess = function () {};
    });

    // idbdatabase_deleteObjectStore2
    it('attempt to remove an object store outside of a version change transaction', function (done) {
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e)
        {
            var db = e.target.result,
                objStore = db.createObjectStore("delete_outside");

            e.target.transaction.oncomplete = function (e)
            {
                assert.throws(function() {
                    db.deleteObjectStore("delete_outside");
                }, InvalidStateError);
                done();
            };
        }
        open_rq.onsuccess = function () {};
    });

    // idbdatabase_deleteObjectStore3
    it('attempt to remove an object store that does not exist', function (done) {
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function(e)
        {
            var db = e.target.result;
            assert.throws(function() {
                db.deleteObjectStore('whatever');
            }, NotFoundError);
            done();
        }
        open_rq.onsuccess = function () {};
    });

    // idbdatabase_deleteObjectStore4-not_reused
    it('the object store is not reused', function (done) {
        var keys = [],
            open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            var db = e.target.result

            var objStore = db.createObjectStore("resurrected", { autoIncrement: true, keyPath: "k" });
            objStore.add({k:5}).onsuccess = function(e) { keys.push(e.target.result); }
            objStore.add({}).onsuccess = function(e) { keys.push(e.target.result); }
            objStore.createIndex("idx", "i");
            assert(objStore.indexNames.indexOf("idx") >= 0);
            assert.equal(objStore.keyPath, "k", "keyPath");

            db.deleteObjectStore("resurrected");

            var objStore2 = db.createObjectStore("resurrected", { autoIncrement: true });
            objStore2.add("Unicorns'R'us").onsuccess = function(e) { keys.push(e.target.result); };
            assert(objStore2.indexNames.indexOf("idx") < 0, "index exist on new objstore");
            assert.equal(objStore2.keyPath, null, "keyPath");

            assert.throws(function() {
               objStore2.index("idx");
            }, NotFoundError);
        }

        open_rq.onsuccess = function(e) {
            assert.deepEqual(keys, [5, 6, 1], "keys");
            done();
        } 
    });
});
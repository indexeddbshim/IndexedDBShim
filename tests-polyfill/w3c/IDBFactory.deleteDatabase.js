var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBVersionChangeEvent = IDBVersionChangeEvent;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBFactory.deleteDatabase Tests', function () {
    // idbfactory_deletedatabase
    it('request has no source', function (done) {
        var open_rq = createdb(done, undefined, 9);

        open_rq.onupgradeneeded = function(e) {};
        open_rq.onsuccess = function(e) {
            var db = e.target.result;
            db.close();

            var delete_rq = indexedDB.deleteDatabase(db.name);
            delete_rq.onerror = function () { throw new Error("Unexpected delete_rq.error event"); };
            delete_rq.onsuccess = function (e) {
                assert.equal(e.target.source, null, "event.target.source")
                done();
            };
        }
    });

    // idbfactory_deletedatabase2
    it('result of the request is set to undefined', function (done) {
        var open_rq = createdb(done, undefined, 9);

        open_rq.onupgradeneeded = function(e) {};
        open_rq.onsuccess = function(e) {
            var db = e.target.result;
            db.close();

            var delete_rq = indexedDB.deleteDatabase(db.name);
            delete_rq.onerror = function () { throw new Error("Unexpected delete_rq.error event"); };
            delete_rq.onsuccess =  function (e) {
                assert.equal(e.target.result, undefined, "result");
                done();
            };
        }
    });

    // idbfactory_deletedatabase3
    it('success event', function (done) {
        var db
        var open_rq = createdb(done, undefined, 9)

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result
            db.createObjectStore('os')
        }
        open_rq.onsuccess = function(e) {
            db.close()

            var delete_rq = indexedDB.deleteDatabase(db.name)
            delete_rq.onerror = function () { throw new Error("Unexpected delete_rq.error event") };
            delete_rq.onsuccess =  function (e) {
                assert.equal(e.oldVersion, 9, "oldVersion")
                assert.equal(e.newVersion, null, "newVersion")
                assert.equal(e.target.result, undefined, "result")
                assert(support.instanceOf(e, FDBVersionChangeEvent), "e instanceof FDBVersionChangeEvent")
                done()
            }
        }
    });

    // idbfactory_deletedatabase4
    it('Test events opening a second database when one connection is open already', function (done) {
        var openrq = indexedDB.open('db.sqlite', 3);

        openrq.onupgradeneeded = function(e) {
            e.target.result.createObjectStore('store');
        };
        openrq.onsuccess = function(e) {
            db = e.target.result;

            // Errors
            db.onversionchange = function () { throw new Error("db.versionchange"); };
            db.onerror = function () { throw new Error("db.error"); };
            db.abort = function () { throw new Error("db.abort"); };

            setTimeout(Second, 4);
            db.close();
        };

        // Errors
        openrq.onerror = function () { throw new Error("open.error"); };
        openrq.onblocked = function () { throw new Error("open.blocked"); };

        function Second(e) {
            var deleterq = indexedDB.deleteDatabase('db.sqlite');

            deleterq.onsuccess = function(e) { done(); }

            deleterq.onerror = function () { throw new Error("delete.error"); };
            deleterq.onblocked = function () { throw new Error("delete.blocked"); };
            deleterq.onupgradeneeded = function () { throw new Error("delete.upgradeneeded"); };
        }
    });
    it('Delete a nonexistant database', function (done) {
        var deleterq = indexedDB.deleteDatabase('nonexistant');

        deleterq.onsuccess = function(e) { done(); };

        deleterq.onerror = function () { throw new Error("delete.error"); };
        deleterq.onblocked = function () { throw new Error("delete.blocked"); };
        deleterq.onupgradeneeded = function () { throw new Error("delete.upgradeneeded"); };
    });

    // idbversionchangeevent
    it('IDBVersionChangeEvent fired in upgradeneeded, versionchange and deleteDatabase', function (done) {
        var db;

        var openrq = indexedDB.open('db.sqlite', 3);

        openrq.onupgradeneeded = function(e) {
            assert.equal(e.oldVersion, 0, "old version (upgradeneeded)");
            assert.equal(e.newVersion, 3, "new version (upgradeneeded)");
            assert(support.instanceOf(e, FDBVersionChangeEvent), "upgradeneeded instanceof IDBVersionChangeEvent");
        };

        openrq.onsuccess = function(e) {
            db = e.target.result;

            db.onversionchange = function(e) {
                assert.equal(e.oldVersion, 3, "old version (versionchange)");
                assert.equal(e.newVersion, null, "new version (versionchange)");
                assert(support.instanceOf(e, FDBVersionChangeEvent), "versionchange instanceof IDBVersionChangeEvent");
                db.close();
            };

            // Errors
            db.onerror = function () { throw new Error("db.error"); };
            db.onabort = function () { throw new Error("db.abort"); };

            setTimeout(deleteDB, 10);
        };

        // Errors
        openrq.onerror = function () { throw new Error("open.error"); };
        openrq.onblocked = function () { throw new Error("open.blocked"); };

        function deleteDB (e) {
            var deleterq = indexedDB.deleteDatabase('db.sqlite');

            deleterq.onsuccess = function(e) {
                assert.equal(e.oldVersion, 3, "old version (delete.success)");
                assert.equal(e.newVersion, null, "new version (delete.success)");
                assert(support.instanceOf(e, FDBVersionChangeEvent), "delete.success instanceof IDBVersionChangeEvent");

                setTimeout(function() { done(); }, 10);
            };

            // Errors
            deleterq.onerror = function () { throw new Error("delete.error"); };
            deleterq.onblocked = function () { throw new Error("delete.blocked"); };
        }
    });
});

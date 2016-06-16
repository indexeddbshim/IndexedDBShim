var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBOpenDBRequest = IDBOpenDBRequest;
var FDBTransaction = IDBTransaction;
var InvalidStateError = DOMException;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBTransaction Tests', function () {
    // idbtransaction
    it('IDBTransaction', function (done) {
        var db;
        var open_rq = indexedDB.open("idbtransaction-" + new Date().getTime() + Math.random() + '.sqlite');

        assert.equal(open_rq.transaction, null, "IDBOpenDBRequest.transaction");
        assert.equal(open_rq.source, null, "IDBOpenDBRequest.source");
        assert.equal(open_rq.readyState, "pending", "IDBOpenDBRequest.readyState");

        assert(open_rq instanceof FDBOpenDBRequest, "open_rq instanceof FDBOpenDBRequest");
        assert.equal(open_rq + "", "[object IDBOpenDBRequest]", "IDBOpenDBRequest (open_rq)");

        open_rq.onupgradeneeded = function (e) {
            assert.equal(e.target, open_rq, "e.target is reusing the same FDBOpenDBRequest");
            assert.equal(e.target.transaction, open_rq.transaction, "FDBOpenDBRequest.transaction");

            assert(e.target.transaction instanceof FDBTransaction, "transaction instanceof FDBTransaction");
            done();
        };
    });

    // idbtransaction-oncomplete
    it('complete event', function (done) {
        var db;
        var open_rq = createdb(done);
        var stages = [];

        open_rq.onupgradeneeded = function (e) {
            stages.push("upgradeneeded");

            db = e.target.result;
            db.createObjectStore('store');

            e.target.transaction.oncomplete = function () {
                stages.push("complete");
            };
        };
        open_rq.onsuccess = function () {
            stages.push("success");

            assert.deepEqual(stages, ["upgradeneeded",
                                      "complete",
                                      "success"]);
            done();
        };
    });

    // transaction-create_in_versionchange
    it('Attempt to create new transactions inside a versionchange transaction', function (done) {
        var db;
        var open_rq = createdb(done);
        var events = [];

        function log(msg) {
            return function(e) {
                if(e && e.target && e.target.error)
                    events.push(msg + ": " + e.target.error.name)
                else if(e && e.target && e.target.result !== undefined)
                    events.push(msg + ": " + e.target.result)
                else
                    events.push(msg)
            };
        }

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result

            db.createObjectStore("store")
                .add("versionchange1", 1)
                .addEventListener("success", log("versionchange_add.success"))

            assert.throws(function () {
                db.transaction("store");
            }, InvalidStateError);

            e.target.transaction
                .objectStore("store")
                .count(2)
                .addEventListener("success", log("versionchange_count.success"))

            assert.throws(function () {
                db.transaction("store", "readwrite");
            }, InvalidStateError);

            open_rq.transaction
                .objectStore("store")
                .add("versionchange2", 2)
                .addEventListener("success", log("versionchange_add2.success"));

            open_rq.transaction.oncomplete = function(e) {
                log("versionchange_txn.complete")(e);

                db.transaction("store")
                    .objectStore("store")
                    .count()
                    .addEventListener("success", log("complete_count.success"));
            }
        };

        open_rq.onsuccess = function(e) {
            log("open_rq.success")(e);

            var txn = db.transaction("store", "readwrite");
            txn.objectStore("store")
                .put("woo", 1)
                .addEventListener("success", log("complete2_get.success"));

            txn.oncomplete = function(e) {
                assert.deepEqual(events, ["versionchange_add.success: 1",
                                          "versionchange_count.success: 0",
                                          "versionchange_add2.success: 2",
                                          "versionchange_txn.complete",
                                          "open_rq.success: [object IDBDatabase]",
                                          "complete_count.success: 2",
                                          "complete2_get.success: 1"], "events");
                done();
            };
        };
    });
});

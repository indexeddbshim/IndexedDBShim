var assert = require('assert');
var FDBIndex = IDBIndex;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBTransaction.abort Tests', function () {
    // abort-in-initial-upgradeneeded
    it('Test that an abort in the initial upgradeneeded sets version back to 0', function (done) {
        var db, open_rq = createdb(done, undefined, 2);

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            assert.equal(db.version, 2);
            transaction = e.target.transaction;
            transaction.oncomplete = function () { throw new Error("unexpected transaction.complete") };
            transaction.onabort = function(e) {
                assert.equal(e.target.db.version, 0);
            }
            db.onabort = function() {}

            transaction.abort();
        }

        open_rq.onerror = function(e) {
            assert.equal(open_rq, e.target);
            assert.equal(e.target.result, undefined);
            assert.equal(e.target.error.name, "AbortError");
            assert.equal(db.version, 0);
            assert.equal(open_rq.transaction, null);
            done();
        }
    });

    // idbtransaction_abort
    it('IDBTransaction - abort', function (done) {
        var db, aborted,
          record = { indexedProperty: "bar" };

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var txn = e.target.transaction,
              objStore = db.createObjectStore("store");

            objStore.add(record, 1);
            objStore.add(record, 2);
            var index = objStore.createIndex("index", "indexedProperty", { unique: true });

            assert(index instanceof FDBIndex, "IDBIndex");

            e.target.transaction.onabort = function(e) {
                aborted = true;
                assert.equal(e.type, "abort", "event type");
            };

            db.onabort = function(e) {
                assert(aborted, "transaction.abort event has fired");
                done();
            };

            e.target.transaction.oncomplete = function () { throw new Error("got complete, expected abort"); };
        };
        open_rq.onerror = function (e) {};
    });
});

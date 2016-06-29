var assert = require('assert');
var indexedDB = require('../test-helper');
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBDatabase.close Tests', function () {
    // idbdatabase_close
    it('unblock the version change transaction created by an open database request', function (done) {
        var db;
        var versionchange_fired;
        var blocked_fired;
        var upgradeneeded_fired;
        var open_rq = createdb(done);
        var counter = 0;

        open_rq.onupgradeneeded = function() {}
        open_rq.onsuccess = function(e) {
            db = e.target.result;
            db.onversionchange = function(e) {
                versionchange_fired = counter++;
            };
            var rq = indexedDB.open(db.name, db.version + 1);
            rq.onblocked = function (e) {
                blocked_fired = counter++;
                db.close();
            };
            rq.onupgradeneeded = function (e) {
                upgradeneeded_fired = counter++;
            };
            rq.onsuccess = function (e) {
                assert.equal(versionchange_fired, 0, 'versionshange event fired #')
                assert.equal(blocked_fired, 1, 'block event fired #')
                assert.equal(upgradeneeded_fired, 2, 'second upgradeneeded event fired #')

                done();
            };
            rq.onerror = function () { throw new Error('Unexpected database deletion error'); };
        };
    });

    // idbdatabase_close2
    it('unblock the delete database request', function (done) {
        var db;
        var blocked_fired = false;
        var versionchange_fired = false;
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function() {};
        open_rq.onsuccess = function(e) {
            db = e.target.result;

            db.onversionchange = function (e) {
              versionchange_fired = true;
            };

            var rq = indexedDB.deleteDatabase(db.name);
            rq.onblocked = function (e) {
                blocked_fired = true;
                db.close();
            };
            rq.onsuccess = function (e) {
                assert(versionchange_fired, "versionchange event fired")
                assert(blocked_fired, "block event fired")
                done();
            };
            rq.onerror = function () { throw new Error('Unexpected database deletion error'); };
        };
    });

    // close-in-upgradeneeded
    it('When db.close is called in upgradeneeded, the db is cleaned up on refresh', function (done) {
        var open_rq = createdb(done)
        var sawTransactionComplete = false

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result
            assert.equal(db.version, 1)

            db.createObjectStore('os')
            db.close()

            e.target.transaction.oncomplete = function() { sawTransactionComplete = true }
        }

        open_rq.onerror = function(e) {
            assert(sawTransactionComplete, "saw transaction.complete")

            assert.equal(e.target.error.name, 'AbortError')
            assert.equal(e.result, undefined)

            assert(!!db)
            assert.equal(db.version, 1)
            assert.equal(db.objectStoreNames.length, 1)
            support.throws(function() { db.transaction('os') }, 'InvalidStateError')

            done()
        }
    });
});

var assert = require('assert');
var indexedDB = require('../test-helper');
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBDatabase.transaction Tests', function () {
    // idbdatabase_transaction
    it('attempt to open a transaction with invalid scope', function (done) {
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function () {};
        open_rq.onsuccess = function (e) {
            var db = e.target.result;
            support.throws(function () {
                db.transaction('non-existing');
            }, 'NotFoundError');
            done();
        };
    });

    // idbdatabase_transaction2
    it('opening a transaction defaults to a read-only mode', function (done) {
        var db;
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function (e) {
            db = e.target.result;
            db.createObjectStore('readonly');
        };
        open_rq.onsuccess = function () {
            var txn = db.transaction('readonly');
            assert.equal(txn.mode, 'readonly');

            done();
        };
    });

    // idbdatabase_transaction3
    it('attempt to open a transaction from closed database connection', function (done) {
        var db;
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function (e) {
            db = e.target.result;
            db.createObjectStore('test');
        };
        open_rq.onsuccess = function () {
            db.close();

            support.throws(function () {
                db.transaction('test');
            }, 'InvalidStateError');

            done();
        };
    });

    // idbdatabase_transaction4
    it('attempt to open a transaction with invalid mode', function (done) {
        var db;
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function (e) {
            db = e.target.result;
            db.createObjectStore('test');
        };
        open_rq.onsuccess = function () {
            assert.throws(function () {
                db.transaction('test', 'whatever');
            }, TypeError);

            done();
        };
    });

    // idbdatabase_transaction5
    it('If storeNames is an empty list, the implementation must throw a DOMException of type InvalidAccessError', function (done) {
        var db;
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function () {};
        open_rq.onsuccess = function (e) {
            db = e.target.result;
            support.throws(function () {
                db.transaction([]);
            }, 'InvalidAccessError');

            done();
        };
    });
});

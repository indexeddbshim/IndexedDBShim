var assert = require('assert');
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBIndex.multiEntry Tests', function () {
    // idbindex-multientry
    it('adding keys', function (done) {
        var db,
            expected_keys = [1, 2, 2, 3, 3];

        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var store = db.createObjectStore("store")

            store.createIndex('actors', 'name', { multiEntry: true })

            store.add({name: 'Odin'}, 1);
            store.add({name: ['Rita', 'Scheeta', {Bobby:'Bobby'}]}, 2);
            store.add({name: [ {s: 'Robert'}, 'Neil', 'Bobby']}, 3);
        };
        open_rq.onsuccess = function(e) {
            var gotten_keys = [];
            var idx = db.transaction('store').objectStore('store').index('actors');

            idx.getKey('Odin').onsuccess = function(e) {
                gotten_keys.push(e.target.result)
            };
            idx.getKey('Rita').onsuccess = function(e) {
                gotten_keys.push(e.target.result)
            };
            idx.getKey('Scheeta').onsuccess = function(e) {
                gotten_keys.push(e.target.result)
            };
            idx.getKey('Neil').onsuccess = function(e) {
                gotten_keys.push(e.target.result)
            };
            idx.getKey('Bobby').onsuccess = function(e) {
                gotten_keys.push(e.target.result)

                support.assert_array_equals(gotten_keys, expected_keys);
                done();
            };
        }
    });

    // idbindex-multientry-arraykeypath
    it('array keyPath with multiEntry', function (done) {
        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            var store = e.target.result.createObjectStore("store");

            support.throws(function() {
                store.createIndex('actors', ['name'], { multiEntry: true })
            }, 'InvalidAccessError');

            done();
        };
        open_rq.onsuccess = function () {};
    });

    // idbindex-multientry-big
    it('a 100 entry multiEntry array', function (done) {
        var db;

        var open_rq = createdb(done);
        var obj = { test: 'yo', idxkeys: [] };

        for (var i = 0; i < 100; i++)
            obj.idxkeys.push('index_no_' + i);


        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            db.createObjectStore('store')
              .createIndex('index', 'idxkeys', { multiEntry: true });
        };
        open_rq.onsuccess = function(e) {
            var tx = db.transaction('store', 'readwrite');
            tx.objectStore('store')
              .put(obj, 1)
              .onsuccess = function(e)
            {
                assert.equal(e.target.result, 1, "put'd key");
            };

            tx.oncomplete = function() {
                var idx = db.transaction('store').objectStore('store').index('index')

                for (var i = 0; i < 100; i++)
                {
                    idx.get('index_no_' + i).onsuccess = function(e) {
                        assert.equal(e.target.result.test, "yo");
                    };
                }

                idx.get('index_no_99').onsuccess = function(e) {
                    assert.equal(e.target.result.test, "yo");
                    assert.equal(e.target.result.idxkeys.length, 100);
                    done();
                };
            };
        };
    });
});

var assert = require('assert');
var indexedDB = require('../test-helper');
var DataError = DOMException;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBFactory.cmp Tests', function () {
    // idbfactory_cmp
    it("IDBFactory.cmp", function() {
        var greater = indexedDB.cmp(2, 1);
        var equal = indexedDB.cmp(2, 2);
        var less = indexedDB.cmp(1, 2);

        assert.equal(greater, 1, "greater");
        assert.equal(equal, 0, "equal");
        assert.equal(less, -1, "less");
    });

    // idbfactory_cmp2
    it("no argument", function() {
        assert.throws(function() {
            indexedDB.cmp();
        }, TypeError);
    });
    it("null", function() {
        assert.throws(function() {
            indexedDB.cmp(null, null);
        }, DataError);
        assert.throws(function() {
            indexedDB.cmp(1, null);
        }, DataError);
        assert.throws(function() {
            indexedDB.cmp(null, 1);
        }, DataError);
    });
    it("NaN", function() {
        assert.throws(function() {
            indexedDB.cmp(NaN, NaN);
        }, DataError);
        assert.throws(function() {
            indexedDB.cmp(1, NaN);
        }, DataError);
        assert.throws(function() {
            indexedDB.cmp(NaN, 1);
        }, DataError);
    });

    // keyorder
    it('Key sort order', function (done) {
        var numStarted = 0;
        var numFinished = 0;
        function keysort(desc, unsorted, expected) {
            var db,
                store_name = 'store-' + Date.now() + Math.random();

            numStarted += 1;

            // The database test
            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore(store_name);

                for (var i = 0; i < unsorted.length; i++)
                    objStore.add("value", unsorted[i]);
            };

            open_rq.onsuccess = function(e) {
                var actual_keys = [],
                  rq = db.transaction(store_name)
                         .objectStore(store_name)
                         .openCursor();

                rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    if (cursor) {
                        actual_keys.push(cursor.key.valueOf());
                        cursor.continue();
                    }
                    else {
                        assert.deepEqual(actual_keys, expected, "keyorder array");
                        assert.equal(actual_keys.length, expected.length, "array length");

                        numFinished += 1;
                        if (numFinished === numStarted) {
                            done();
                        }
                    }
                };
            };

            // The IDBKey.cmp test
            var sorted = unsorted.slice(0).sort(function(a, b) { return indexedDB.cmp(a, b)});

            for (var i in sorted)
                if (typeof sorted[i] === "object" && 'valueOf' in sorted[i])
                    sorted[i] = sorted[i].valueOf();

            assert.deepEqual(sorted, expected, "sorted array");
        }

        var now = new Date(),
            one_sec_ago = new Date(now - 1000),
            one_min_future = new Date(now.getTime() + (1000*60));

        keysort('String < Array',
            [ [0], "yo", "", [] ],
            [ "", "yo", [], [0] ]);

        keysort('float < String',
            [ Infinity, "yo", 0, "", 100 ],
            [ 0, 100, Infinity, "", "yo" ]);

        keysort('float < Date',
            [ now, 0, 9999999999999, -0.22 ],
            [ -0.22, 0, 9999999999999, now.valueOf() ]);

        keysort('float < Date < String < Array',
            [ [], "", now, [0], "-1", 0, 9999999999999, ],
            [ 0, 9999999999999, now.valueOf(), "", "-1", [], [0] ]);


        keysort('Date(1 sec ago) < Date(now) < Date(1 minute in future)',
            [ now, one_sec_ago, one_min_future ],
            [ one_sec_ago.valueOf(), now.valueOf(), one_min_future.valueOf() ]);

        keysort('-1.1 < 1 < 1.01337 < 1.013373 < 2',
            [ 1.013373, 2, 1.01337, -1.1, 1 ],
            [ -1.1, 1, 1.01337, 1.013373, 2 ]);

        keysort('-Infinity < -0.01 < 0 < Infinity',
            [ 0, -0.01, -Infinity, Infinity ],
            [ -Infinity, -0.01, 0, Infinity ]);

        keysort('"" < "a" < "ab" < "b" < "ba"',
            [ "a", "ba", "", "b", "ab" ],
            [ "", "a", "ab", "b", "ba" ]);

        keysort('Arrays',
            [ [[0]], [0], [], [0, 0], [0, [0]] ],
            [ [], [0], [0, 0], [0, [0]], [[0]] ]);

        var big_array = [], bigger_array = [];
        for (var i=0; i < 10000; i++) {
            big_array.push(i);
            bigger_array.push(i);
        }
        bigger_array.push(0);

        keysort('Array.length: 10,000 < Array.length: 10,001',
            [ bigger_array, [0, 2, 3], [0], [9], big_array ],
            [ [0], big_array, bigger_array, [0, 2, 3], [9] ]);

        keysort('Infinity inside arrays',
            [ [Infinity, 1], [Infinity, Infinity], [1, 1],
                [1, Infinity], [1, -Infinity], [-Infinity, Infinity] ],
            [ [-Infinity, Infinity], [1, -Infinity], [1, 1],
                [1, Infinity], [Infinity, 1], [Infinity, Infinity] ]);


        keysort('Test different stuff at once',
            [
              now,
              [0, []],
              "test",
              1,
              ["a", [1, [-1]]],
              ["b", "a"],
              [ 0, 2, "c"],
              ["a", [1, 2]],
              [],
              [0, [], 3],
              ["a", "b"],
              [ 1, 2 ],
              ["a", "b", "c"],
              one_sec_ago,
              [ 0, "b", "c"],
              Infinity,
              -Infinity,
              2.55,
              [ 0, now ],
              [1]
            ],
            [
              -Infinity,
              1,
              2.55,
              Infinity,
              one_sec_ago.valueOf(),
              now.valueOf(),
              "test",
              [],
              [0 ,2, "c"],
              [0, now],
              [0, "b", "c"],
              [0, []],
              [0, [], 3],
              [1],
              [1, 2],
              ["a", "b"],
              ["a", "b", "c"],
              ["a", [1, 2]],
              ["a", [1, [-1]]],
              ["b", "a"]
            ]);
    });
});

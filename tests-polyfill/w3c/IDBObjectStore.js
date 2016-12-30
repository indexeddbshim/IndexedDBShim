describe('W3C IDBObjectStore Tests', function () {
    var FDBOpenDBRequest = IDBOpenDBRequest;
    var FDBTransaction = IDBTransaction;
    var createdb = support.createdb;

    // idbobjectstore_deleted
    it('Attempting to use deleted IDBObjectStore', function (done) {
        var db,
          add_success = false

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;

            var objStore = db.createObjectStore("store", { autoIncrement: true });
            assert.equal(db.objectStoreNames[0], "store", "objectStoreNames");

            var rq_add = objStore.add(1);
            rq_add.onsuccess = function() { add_success = true; };
            rq_add.onerror = function () { throw new Error('rq_add.error') };

            objStore.createIndex("idx", "a");
            db.deleteObjectStore("store");
            assert.equal(db.objectStoreNames.length, 0, "objectStoreNames.length after delete");

            support.throws(function() { objStore.add(2); }, 'InvalidStateError');
            support.throws(function() { objStore.put(3); }, 'InvalidStateError');
            support.throws(function() { objStore.get(1); }, 'InvalidStateError');
            support.throws(function() { objStore.clear(); }, 'InvalidStateError');
            support.throws(function() { objStore.count(); }, 'InvalidStateError');
            support.throws(function() { objStore.delete(1); }, 'InvalidStateError');
            support.throws(function() { objStore.openCursor(); }, 'InvalidStateError');
            support.throws(function() { objStore.index("idx"); }, 'InvalidStateError');
            support.throws(function() { objStore.deleteIndex("idx"); }, 'InvalidStateError');
            support.throws(function() { objStore.createIndex("idx2", "a"); }, 'InvalidStateError');
        }

        open_rq.onsuccess = function() {
            assert(add_success, "First add was successful");
            done();
        }
    });

    // string-list-ordering
    it('Test string list ordering in IndexedDB', function (done) {
        var expectedOrder = [
            "",
            "\x00", // 'NULL' (U+0000)
            "0",
            "1",
            "A",
            "B",
            "a",
            "b",
            "\x7F", // 'DELETE' (U+007F)
            "\xC0", // 'LATIN CAPITAL LETTER A WITH GRAVE' (U+00C0)
            "\xC1", // 'LATIN CAPITAL LETTER A WITH ACUTE' (U+00C1)
            "\xE0", // 'LATIN SMALL LETTER A WITH GRAVE' (U+00E0)
            "\xE1", // 'LATIN SMALL LETTER A WITH ACUTE' (U+00E1)
            "\xFF", // 'LATIN SMALL LETTER Y WITH DIAERESIS' (U+00FF)
            "\u0100", // 'LATIN CAPITAL LETTER A WITH MACRON' (U+0100)
            "\u1000", // 'MYANMAR LETTER KA' (U+1000)
            "\uD834\uDD1E", // 'MUSICAL SYMBOL G-CLEF' (U+1D11E), UTF-16 surrogate pairs
            "\uFFFD" // 'REPLACEMENT CHARACTER' (U+FFFD)
        ];

        var i, tmp, permutedOrder = expectedOrder.slice();
        permutedOrder.reverse();
        for (i = 0; i < permutedOrder.length - 2; i += 2) {
            tmp = permutedOrder[i];
            permutedOrder[i] = permutedOrder[i + 1];
            permutedOrder[i + 1] = tmp;
        }

        var objStore, db;

        // Check that the expected order is the canonical JS sort order.
        var sortedOrder = expectedOrder.slice();
        sortedOrder.sort();
        assert.deepEqual(sortedOrder, expectedOrder);

        var request = createdb(done);

        request.onupgradeneeded = function(e) {
            db = e.target.result;

            // Object stores.
            for (var i = 0; i < permutedOrder.length; i++) {
                objStore = db.createObjectStore(permutedOrder[i]);
            }
            assert.deepEqual(Array.from(db.objectStoreNames), expectedOrder);

            // Indexes.
            for (var i = 0; i < permutedOrder.length; i++) {
                objStore.createIndex(permutedOrder[i], "keyPath");
            }
            assert.deepEqual(Array.from(objStore.indexNames), expectedOrder);
        };

        request.onsuccess = function(e) {
            // Object stores.
            assert.deepEqual(Array.from(db.objectStoreNames), expectedOrder);
            // Indexes.
            assert.deepEqual(Array.from(objStore.indexNames), expectedOrder);
            done();
        };
    });

    // list_ordering
    it('objectStoreNames and indexNames order', function (done) {
        var count = 0;
        function list_order(desc, unsorted, expected) {
            var objStore, db;

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                for (var i = 0; i < unsorted.length; i++)
                    objStore = db.createObjectStore(unsorted[i]);

                assert.equal(db.objectStoreNames.length, expected.length, "objectStoreNames length");
                for (var i = 0; i < expected.length; i++)
                   assert.equal(db.objectStoreNames[i], expected[i], "objectStoreNames["+i+"]");

                for (var i = 0; i < unsorted.length; i++)
                    objStore.createIndex(unsorted[i], "length");

                assert.equal(objStore.indexNames.length, expected.length, "indexNames length");
                for (var i = 0; i < expected.length; i++)
                    assert.equal(objStore.indexNames[i], expected[i], "indexNames["+i+"]");
            };

            open_rq.onsuccess = function(e) {
                assert.equal(db.objectStoreNames.length, expected.length, "objectStoreNames length");
                for (var i = 0; i < expected.length; i++)
                    assert.equal(db.objectStoreNames[i], expected[i], "objectStoreNames["+i+"]");

                assert.equal(objStore.indexNames.length, expected.length, "indexNames length");
                for (var i = 0; i < expected.length; i++)
                    assert.equal(objStore.indexNames[i], expected[i], "indexNames["+i+"]");

                count += 1;
                if (count >= 3) {
                    done();
                }
            };
        }

        list_order("numbers",
            [123456, -12345, -123, 123, 1234, -1234, 0, 12345, -123456],
            ["-123", "-1234", "-12345", "-123456", "0", "123", "1234", "12345", "123456"]);

        list_order("numbers 'overflow'",
            [9, 1, 1000000000, 200000000000000000],
            ["1", "1000000000", "200000000000000000", "9"]);

        list_order("lexigraphical string sort",
            [ "cc", "c", "aa", "a", "bb", "b", "ab", "", "ac" ],
            [ "", "a", "aa", "ab", "ac", "b", "bb", "c", "cc" ]);
    });

    // objectstore_keyorder
    it("Verify key sort order in an object store is 'number < Date < DOMString'", function (done) {
        var db,
          d = new Date(),
          records = [ { key: d },
                      { key: "test" },
                      { key: 1 },
                      { key: 2.55 }  ],
          expectedKeyOrder = [ 1, 2.55, d.valueOf(), "test" ];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "key" });

            for (var i = 0; i < records.length; i++)
                objStore.add(records[i]);
        };

        open_rq.onsuccess = function(e) {
            var actual_keys = [],
              rq = db.transaction("store")
                     .objectStore("store")
                     .openCursor();

            rq.onsuccess = function(e) {
                var cursor = e.target.result;

                if (cursor) {
                    actual_keys.push(cursor.key.valueOf());
                    cursor.continue();
                }
                else {
                    assert.deepEqual(actual_keys, expectedKeyOrder);
                    done();
                }
            };
        };
    });
});

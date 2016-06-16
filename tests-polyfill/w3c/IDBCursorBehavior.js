var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBKeyRange = IDBKeyRange;
var support = require('./support');
var createdb = support.createdb;

function assert_readonly(obj, prop) {
    try {
        obj[prop] = 587238956283;
    } catch (err) {}

    if (obj[prop] === 587238956283) {
        throw new Error('assert_readonly fail for property', prop);
    }
}

function fail_helper(name) {
    return function() {
        throw new Error(name);
    };
}

describe('W3C IDBCursor Behavior Tests', function () {
    describe('direction', function () {
        // idbcursor-direction
        it('IDBCursor.direction', function (done) {
            var count = 0;
            function cursor_direction(constant, dir)
            {
                var db,
                  expected = dir ? dir : "next";

                var open_rq = createdb(done);

                open_rq.onupgradeneeded = function(e) {
                    db = e.target.result;
                    var objStore = db.createObjectStore("test");

                    objStore.add("data", "key");
                };

                open_rq.onsuccess = function(e) {
                    var cursor_rq;
                    var os = db.transaction("test")
                               .objectStore("test");
                    if (dir)
                        cursor_rq = os.openCursor(undefined, dir);
                    else
                        cursor_rq = os.openCursor();

                    cursor_rq.onsuccess = function(e) {
                        var cursor = e.target.result;

                        assert.equal(cursor.direction, constant, 'direction constant');
                        assert.equal(cursor.direction, expected, 'direction');
                        assert_readonly(cursor, 'direction');
                    };

                    var cursor_rq2 = db.transaction("test")
                                      .objectStore("test")
                                      .openCursor(undefined, constant);

                    cursor_rq2.onsuccess = function(e) {
                        var cursor = e.target.result;

                        assert.equal(cursor.direction, constant, 'direction constant (second try)');
                        assert.equal(cursor.direction, expected, 'direction (second try)');
                        assert_readonly(cursor, 'direction');

                        count++;
                        if (count >= 5)
                            done();
                    };

                };
            }

            cursor_direction("next");
            cursor_direction("next",       "next");
            cursor_direction("prev",       "prev");
            cursor_direction("nextunique", "nextunique");
            cursor_direction("prevunique", "prevunique");
        });

        // idbcursor-direction-index
        it('index', function (done) {
            var records = [ "Alice", "Bob", "Bob", "Greg" ];
            var directions = ["next", "prev", "nextunique", "prevunique"];
            var doneCount = 0;

            var open_rq = indexedDB.open(support.getDBNameRandom());

            open_rq.onupgradeneeded = function(e) {
                var objStore = e.target.result.createObjectStore("test");
                objStore.createIndex("idx", "name");

                for (var i = 0; i < records.length; i++)
                    objStore.add({ name: records[i] }, i);
            };

            open_rq.onsuccess = function(e) {
                var db = e.target.result;
                db.onerror = fail_helper("db.onerror");


                // The tests
                testdir('next',       ['Alice:0', 'Bob:1', 'Bob:2', 'Greg:3']);
                testdir('prev',       ['Greg:3',  'Bob:2', 'Bob:1', 'Alice:0']);
                testdir('nextunique', ['Alice:0', 'Bob:1', 'Greg:3']);
                testdir('prevunique', ['Greg:3',  'Bob:1', 'Alice:0']);


                // Test function
                function testdir(dir, expect) {
                    var count = 0;
                    var rq = db.transaction("test").objectStore("test").index("idx").openCursor(undefined, dir);
                    rq.onsuccess = function(e) {
                        var cursor = e.target.result;
                        if (!cursor) {
                            assert.equal(count, expect.length, "cursor runs");
                            doneCount += 1;
                            if (doneCount >= 4) {
                                done();
                            }
                            return;
                        }
                        assert.equal(cursor.value.name + ":" + cursor.primaryKey, expect[count], "cursor.value");
                        count++;
                        cursor.continue();
                    };
                    rq.onerror = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        throw new Error("rq.onerror - " + e.message);
                    };
                }
            };

            open_rq.onblocked = fail_helper('open_rq.onblocked');
            open_rq.onerror = fail_helper('open_rq.onerror');
        });

        // idbcursor-direction-index-keyrange
        it('index with keyrange', function (done) {
            var records = [ 1337, "Alice", "Bob", "Bob", "Greg", "Åke", ["Anne"] ];
            var directions = ["next", "prev", "nextunique", "prevunique"];
            var doneCount = 0;

            var open_rq = indexedDB.open(support.getDBNameRandom());

            open_rq.onupgradeneeded = function(e) {
                var objStore = e.target.result.createObjectStore("test");
                objStore.createIndex("idx", "name");

                for (var i = 0; i < records.length; i++)
                    objStore.add({ name: records[i] }, i);
            };

            open_rq.onsuccess = function(e) {
                var db = e.target.result;
                db.onerror = fail_helper("db.onerror");


                // The tests
                testdir('next',       ['Alice:1', 'Bob:2', 'Bob:3', 'Greg:4']);
                testdir('prev',       ['Greg:4',  'Bob:3', 'Bob:2', 'Alice:1']);
                testdir('nextunique', ['Alice:1', 'Bob:2', 'Greg:4']);
                testdir('prevunique', ['Greg:4',  'Bob:2', 'Alice:1']);


                // Test function
                function testdir(dir, expect) {
                    var count = 0;
                    var rq = db.transaction("test").objectStore("test").index("idx").openCursor(FDBKeyRange.bound("AA", "ZZ"), dir);
                    rq.onsuccess = function(e) {
                        var cursor = e.target.result;
                        if (!cursor) {
                            assert.equal(count, expect.length, "cursor runs");
                            doneCount += 1;
                            if (doneCount >= 4) {
                                done();
                            }
                            return;
                        }
                        assert.equal(cursor.value.name + ":" + cursor.primaryKey, expect[count], "cursor.value");
                        count++;
                        cursor.continue();
                    };
                    rq.onerror = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        throw new Error("rq.onerror - " + e.message);
                    };
                }
            };

            open_rq.onblocked = fail_helper('open_rq.onblocked');
            open_rq.onerror = fail_helper('open_rq.onerror');
        });

        // idbcursor-direction-objectstore
        it('object store', function (done) {
            var records = [ "Alice", "Bob", "Greg" ];
            var directions = ["next", "prev", "nextunique", "prevunique"];
            var doneCount = 0;

            var open_rq = indexedDB.open(support.getDBNameRandom());

            open_rq.onupgradeneeded = function(e) {
                var objStore = e.target.result.createObjectStore("test");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i], records[i]);
            };

            open_rq.onsuccess = function(e) {
                var db = e.target.result;
                db.onerror = fail_helper("db.onerror");


                // The tests
                testdir('next',       ['Alice', 'Bob', 'Greg']);
                testdir('prev',       ['Greg', 'Bob', 'Alice']);
                testdir('nextunique', ['Alice', 'Bob', 'Greg']);
                testdir('prevunique', ['Greg', 'Bob', 'Alice']);


                // Test function
                function testdir(dir, expect) {
                    var count = 0;
                    var rq = db.transaction("test").objectStore("test").openCursor(undefined, dir);
                    rq.onsuccess = function(e) {
                        var cursor = e.target.result;
                        if (!cursor) {
                            assert.equal(count, expect.length, "cursor runs");
                            doneCount += 1;
                            if (doneCount >= 4) {
                                done();
                            }
                            return;
                        }
                        assert.equal(cursor.value, expect[count], "cursor.value");
                        count++;
                        cursor.continue();
                    };
                    rq.onerror = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        throw new Error("rq.onerror - " + e.message);
                    };
                }
            };

            open_rq.onblocked = fail_helper('open_rq.onblocked');
            open_rq.onerror = fail_helper('open_rq.onerror');
        });

        // idbcursor-direction-objectstore-keyrange
        it('object store with keyrange', function (done) {
            var records = [ 1337, "Alice", "Bob", "Greg", "Åke", ["Anne"] ];
            var directions = ["next", "prev", "nextunique", "prevunique"];
            var doneCount = 0;

            var open_rq = indexedDB.open(support.getDBNameRandom());

            open_rq.onupgradeneeded = function(e) {
                var objStore = e.target.result.createObjectStore("test");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i], records[i]);
            };

            open_rq.onsuccess = function(e) {
                var db = e.target.result;
                db.onerror = fail_helper("db.onerror");


                // The tests
                testdir('next',       ['Alice', 'Bob', 'Greg']);
                testdir('prev',       ['Greg', 'Bob', 'Alice']);
                testdir('nextunique', ['Alice', 'Bob', 'Greg']);
                testdir('prevunique', ['Greg', 'Bob', 'Alice']);


                // Test function
                function testdir(dir, expect) {
                    var count = 0;
                    var rq = db.transaction("test").objectStore("test").openCursor(FDBKeyRange.bound("AA", "ZZ"), dir);
                    rq.onsuccess = function(e) {
                        var cursor = e.target.result;
                        if (!cursor) {
                            assert.equal(count, expect.length, "cursor runs");
                            doneCount += 1;
                            if (doneCount >= 4) {
                                done();
                            }
                            return;
                        }
                        assert.equal(cursor.value, expect[count], "cursor.value");
                        count++;
                        cursor.continue();
                    };
                    rq.onerror = function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        throw new Error("rq.onerror - " + e.message);
                    };
                }
            };

            open_rq.onblocked = fail_helper('open_rq.onblocked');
            open_rq.onerror = fail_helper('open_rq.onerror');
        });
    });

    describe('iterating', function () {
        // idbcursor_iterating
        it('objectstore - delete next element, and iterate to it', function (done) {
            var db,
              count = 0;

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", { keyPath: "key" });

                for (var i = 0; i < 100; i++)
                    objStore.add({ key: i, val: "val_"+i });

                var rq = objStore.add({ key: 100, val: "val_100" });

                rq.onsuccess = function() {
                    for (var i = 199; i > 100; i--)
                        objStore.add({ key: i, val: "val_"+i });
                };

                objStore.createIndex('index', ['key', 'val']);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result,
                      store = e.target.source;
                    if (!cursor) {
                        assert.equal(count, 197, "cursor run count");

                        var rq = e.target.source.count();
                        rq.onsuccess = function(e) {
                            assert.equal(e.target.result, 195, "object count");
                            done();
                        };
                        return;
                    }

                    switch (cursor.key) {
                        case 10:
                            assert.equal(count, cursor.key, "count");
                            store.delete(11);
                            break;

                        case 12:
                        case 99:
                        case 100:
                        case 101:
                            assert.equal(count, cursor.key - 1, "count");
                            break;

                        // Delete the next key
                        case 110:
                            store.delete(111);
                            break;

                        // Delete randomly
                        case 112:
                            store.delete(114);
                            store.delete(45);
                            store.delete(84);
                            break;

                        // Delete and add a new key
                        case 120:
                            store.delete(121);
                            store.add({ key: 121, val: "new"});
                            break;

                        case 121:
                            assert.equal(cursor.value.val, "new");
                            break;

                        // We should only be here once although we're basically making the index
                        // "heavier" with its new key.
                        case 130:
                            assert.equal(cursor.value.val, "val_130");
                            cursor.update({ key: 130, val: "val_131" })

                            store.get(130).onsuccess = function(e) {
                                assert.equal(e.target.result.val, "val_131");
                            };
                            break;

                        // Shouldn't happen.
                        case 11:
                        case 111:
                        case 114:
                            throw new Error(cursor.key + " should be deleted and never run");
                            break;
                    }

                    cursor.continue();
                    count++;
                };
            };
        });

        // idbcursor_iterating_index
        it('index - delete next element, and iterate to it', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0", obj: { iKey: "iKey_0" }},
                          { pKey: "primaryKey_1", obj: { iKey: "iKey_1" }},
                          { pKey: "primaryKey_2", obj: { iKey: "iKey_2" }} ],

              expected = [ [ "primaryKey_2", "iKey_2" ],
                           [ "primaryKey_0", "iKey_0" ] ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:["pKey", "obj.iKey"]});
                objStore.createIndex("index", [ "pKey", "obj.iKey" ]);

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor(null, "prev");

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (!cursor) {
                        assert.equal(count, 2, "cursor run count");
                        return done();
                    }

                    if (count === 0) {
                        e.target.source.objectStore.delete(["primaryKey_1", "iKey_1"]);
                    }
                    assert.deepEqual(cursor.key, expected[count], "primary key");

                    cursor.continue();
                    count++;
                };
            };
        });

        // idbcursor_iterating_index2
        it('index - add next element, and iterate to it', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0", obj: { iKey: "iKey_0" }},
                          { pKey: "primaryKey_2", obj: { iKey: "iKey_2" }} ],

              expected = [ [ "primaryKey_2", "iKey_2" ],
                           [ "primaryKey_1", "iKey_1" ],
                           [ "primaryKey_0", "iKey_0" ] ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:"pKey"});
                objStore.createIndex("index", [ "pKey", "obj.iKey" ]);

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor(null, "prev");

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (!cursor) {
                        assert.equal(count, 3, "cursor run count");
                        return done();
                    }

                    if (count === 0) {
                        e.target.source.objectStore.add({ pKey: "primaryKey_1", obj: { iKey: "iKey_1" } });
                    }
                    assert.deepEqual(cursor.key, expected[count], "primary key");

                    cursor.continue();
                    count++;
                };
            };
        });

        // idbcursor_iterating_objectstore
        it('objectstore - delete next element, and iterate to it (2)', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" },
                          { pKey: "primaryKey_2" } ],
              expected_records = [ { pKey: "primaryKey_0" },
                                   { pKey: "primaryKey_2" }];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:"pKey"});

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (!cursor) {
                        assert.equal(count, 2, "cursor run count");
                        return done();
                    }

                    var record = cursor.value;
                    if (record.pKey == "primaryKey_0") {
                       e.target.source.delete("primaryKey_1");
                    }
                    assert.equal(record.pKey, expected_records[count].pKey, "primary key");

                    cursor.continue();
                    count++;
                };
            };
        });

        // idbcursor_iterating_objectstore2
        it('objectstore - add next element, and iterate to it', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_2" } ],
              expected_records = [ { pKey: "primaryKey_0" },
                                   { pKey: "primaryKey_1" },
                                   { pKey: "primaryKey_2" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:"pKey"});

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (!cursor) {
                        assert.equal(count, 3, "cursor run count");
                        return done();
                    }

                    var record = cursor.value;
                    if (record.pKey == "primaryKey_0") {
                       e.target.source.add({ pKey: "primaryKey_1" });
                    }
                    assert.equal(record.pKey, expected_records[count].pKey, "primary key");

                    cursor.continue();
                    count++;
                };
            };
        });
    });

    // idbcursor-key
    it('IDBCursor.key', function (done) {
        var count = 0;
        function cursor_key(key)
        {
            var db;

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test");

                objStore.add("data", key);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert.equal(cursor.value, "data", "prequisite cursor.value");

                    assert.deepEqual(cursor.key, key, 'key');
                    assert_readonly(cursor, 'key');

                    if (key instanceof Array) {
                        cursor.key.push("new");
                        key.push("new");

                        assert.deepEqual(cursor.key, key, 'key after array push');

                        // But we can not change key (like readonly, just a bit different)
                        cursor.key = 10;
                        assert.deepEqual(cursor.key, key, 'key after assignment');
                    }

                    count += 1;
                    if (count >= 3) {
                        done();
                    }
                };
            };
        }

        cursor_key(1);
        cursor_key("key");
        cursor_key(["my", "key"]);
    });

    // idbcursor-primarykey
    it('IDBCursor.primaryKey', function (done) {
        var count = 0;
        function cursor_primarykey(key)
        {
            var db;

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test");
                objStore.createIndex("index", "");

                objStore.add("data", key);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert.equal(cursor.value, "data", "prequisite cursor.value");
                    assert.equal(cursor.key, "data", "prequisite cursor.key");

                    assert.deepEqual(cursor.primaryKey, key, 'primaryKey');
                    assert_readonly(cursor, 'primaryKey');

                    if (key instanceof Array) {
                        cursor.primaryKey.push("new");
                        key.push("new");

                        assert.deepEqual(cursor.primaryKey, key, 'primaryKey after array push');

                        // But we can not change key (like readonly, just a bit different)
                        cursor.key = 10;
                        assert.deepEqual(cursor.primaryKey, key, 'key after assignment');
                    }

                    count += 1;
                    if (count >= 3) {
                        done();
                    }
                };
            };
        }

        cursor_primarykey(1);
        cursor_primarykey("key");
        cursor_primarykey(["my", "key"]);
    });

    // idbcursor-reused
    it('IDBCursor is reused', function (done) {
        var db
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result
            var os = db.createObjectStore("test")

            os.add("data",  "k")
            os.add("data2", "k2")
        }

        open_rq.onsuccess = function(e) {
            var cursor
            var count = 0
            var rq = db.transaction("test").objectStore("test").openCursor()

            rq.onsuccess = function(e)
            {
                switch(count)
                {
                    case 0:
                        cursor = e.target.result

                        assert.equal(cursor.value, "data", "prequisite cursor.value")
                        cursor.custom_cursor_value = 1
                        e.target.custom_request_value = 2

                        cursor.continue()
                        break

                    case 1:
                        assert.equal(cursor.value, "data2", "prequisite cursor.value")
                        assert.equal(cursor.custom_cursor_value, 1, "custom cursor value")
                        assert.equal(e.target.custom_request_value, 2, "custom request value")

                        cursor.advance(1)
                        break

                    case 2:
                        assert(!e.target.result, "got cursor")
                        assert.equal(cursor.custom_cursor_value, 1, "custom cursor value")
                        assert.equal(e.target.custom_request_value, 2, "custom request value")
                        break
                }
                count++
            }

            rq.transaction.oncomplete = function() {
                assert.equal(count, 3, "cursor callback runs")
                assert.equal(rq.custom_request_value, 2, "variable placed on old IDBRequest")
                assert.equal(cursor.custom_cursor_value, 1, "custom cursor value (transaction.complete)")
                done()
            }
        }
    });

    // idbcursor-source
    it('IDBCursor.source', function (done) {
        var db;
        var open_rq = indexedDB.open(support.getDBName());
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("my_objectstore");
            objStore.createIndex("my_index", "");

            objStore.add("data",  1);
            objStore.add("data2", 2);
        };

        var count = 0;
        function cursor_source(name, stringified_object, cursor_rq) {
            var cursor;

            cursor_rq.onsuccess = function(e) {
                if (!e.target.result) {
                    return;
                }
                cursor = e.target.result;
                assert_readonly(cursor, 'source');

                // Direct try
                assert(cursor.source instanceof Object, "source isobject");
                assert.equal(cursor.source + "", stringified_object, "source");
                assert.equal(cursor.source.name, name, "name");

                cursor.continue();
            };

            cursor_rq.transaction.oncomplete = function(e) {
                count += 1;
                if (count >= 2) {
                    done();
                }
             };

            cursor_rq.transaction.onerror = function(e) {
                throw new Error("Transaction got error. " + (e.target.error ? e.target.error.name : "unknown"));
            };
        }

        open_rq.onsuccess = function() {
                cursor_source("my_objectstore", "[object IDBObjectStore]", db.transaction("my_objectstore")
                                                           .objectStore("my_objectstore")
                                                           .openCursor());

                cursor_source("my_index", "[object IDBIndex]", db.transaction("my_objectstore")
                                                     .objectStore("my_objectstore")
                                                     .index("my_index")
                                                     .openCursor());
        };
    });

    // cursor-overloads
    it('Validate the overloads of IDBObjectStore.openCursor(), IDBIndex.openCursor() and IDBIndex.openKeyCursor()', function (done) {
        var db, trans, store, index;

        var request = createdb(done);
        request.onupgradeneeded = function(e) {
            db = request.result;
            store = db.createObjectStore('store');
            index = store.createIndex('index', 'value');
            store.put({value: 0}, 0);
            trans = request.transaction;
            trans.oncomplete = verifyOverloads;
        };
        request.onsuccess = function () {};

        function verifyOverloads() {
            trans = db.transaction('store');
            store = trans.objectStore('store');
            index = store.index('index');

            checkCursorDirection("store.openCursor()", "next");
            checkCursorDirection("store.openCursor(0)", "next");
            checkCursorDirection("store.openCursor(0, 'next')", "next");
            checkCursorDirection("store.openCursor(0, 'nextunique')", "nextunique");
            checkCursorDirection("store.openCursor(0, 'prev')", "prev");
            checkCursorDirection("store.openCursor(0, 'prevunique')", "prevunique");

            checkCursorDirection("store.openCursor(FDBKeyRange.only(0))", "next");
            checkCursorDirection("store.openCursor(FDBKeyRange.only(0), 'next')", "next");
            checkCursorDirection("store.openCursor(FDBKeyRange.only(0), 'nextunique')", "nextunique");
            checkCursorDirection("store.openCursor(FDBKeyRange.only(0), 'prev')", "prev");
            checkCursorDirection("store.openCursor(FDBKeyRange.only(0), 'prevunique')", "prevunique");

            checkCursorDirection("index.openCursor()", "next");
            checkCursorDirection("index.openCursor(0)", "next");
            checkCursorDirection("index.openCursor(0, 'next')", "next");
            checkCursorDirection("index.openCursor(0, 'nextunique')", "nextunique");
            checkCursorDirection("index.openCursor(0, 'prev')", "prev");
            checkCursorDirection("index.openCursor(0, 'prevunique')", "prevunique");

            checkCursorDirection("index.openCursor(FDBKeyRange.only(0))", "next");
            checkCursorDirection("index.openCursor(FDBKeyRange.only(0), 'next')", "next");
            checkCursorDirection("index.openCursor(FDBKeyRange.only(0), 'nextunique')", "nextunique");
            checkCursorDirection("index.openCursor(FDBKeyRange.only(0), 'prev')", "prev");
            checkCursorDirection("index.openCursor(FDBKeyRange.only(0), 'prevunique')", "prevunique");

            checkCursorDirection("index.openKeyCursor()", "next");
            checkCursorDirection("index.openKeyCursor(0)", "next");
            checkCursorDirection("index.openKeyCursor(0, 'next')", "next");
            checkCursorDirection("index.openKeyCursor(0, 'nextunique')", "nextunique");
            checkCursorDirection("index.openKeyCursor(0, 'prev')", "prev");
            checkCursorDirection("index.openKeyCursor(0, 'prevunique')", "prevunique");

            checkCursorDirection("index.openKeyCursor(FDBKeyRange.only(0))", "next");
            checkCursorDirection("index.openKeyCursor(FDBKeyRange.only(0), 'next')", "next");
            checkCursorDirection("index.openKeyCursor(FDBKeyRange.only(0), 'nextunique')", "nextunique");
            checkCursorDirection("index.openKeyCursor(FDBKeyRange.only(0), 'prev')", "prev");
            checkCursorDirection("index.openKeyCursor(FDBKeyRange.only(0), 'prevunique')", "prevunique");
        }

        var numTried = 0;
        var numDone = 0;
        function checkCursorDirection(statement, direction) {
            numTried += 1;
            request = eval(statement);
            request.onsuccess = function(event) {
                assert(event.target.result !== null, "Check the result is not null")
                assert.equal(event.target.result.direction, direction, "Check the result direction");
                numDone += 1;
                if (numDone >= numTried) {
                    done();
                }
            };
        }
    })
});

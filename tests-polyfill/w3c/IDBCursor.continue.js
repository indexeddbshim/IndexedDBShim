var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBCursor = IDBCursor;
var FDBCursorWithValue = IDBCursorWithValue;
var FDBKeyRange = IDBKeyRange;
var DataError = DOMException;
var InvalidStateError = DOMException;
var TransactionInactiveError = DOMException;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBCursor.continue Tests', function () {
    describe('index', function () {
        // idbcursor-continue
        describe('IDBCursor.continue', function (done) {
            var db, open;
            var store = [ { value: "cupcake", key: 5 },
                          { value: "pancake", key: 3 },
                          { value: "pie",     key: 1 },
                          { value: "pie",     key: 4 },
                          { value: "taco",    key: 2 } ];

            before(function (done) {
                open = indexedDB.open('testdb-' + new Date().getTime());
                open.onupgradeneeded = function(e) {
                    var os, i;
                    db = e.target.result;
                    os = db.createObjectStore("test");
                    os.createIndex("index", "");

                    for (i = 0; i < store.length; i++)
                        os.add(store[i].value, store[i].key);
                };
                open.onsuccess = function () { done(); };
            });

            it("continues", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index").openCursor();

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 5, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    assert.equal(cursor.value, store[count].value);
                    assert.equal(cursor.primaryKey, store[count].key);

                    cursor.continue();

                    count++;
                };
                rq.onerror = function () { throw new Error("unexpected error") };
            });

            it("with given key", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index").openCursor();

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 3, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "cupcake");
                            assert.equal(cursor.primaryKey, 5);
                            cursor.continue("pie");
                            break;

                        case 1:
                            assert.equal(cursor.value, "pie");
                            assert.equal(cursor.primaryKey, 1);
                            cursor.continue("taco");
                            break;

                        case 2:
                            assert.equal(cursor.value, "taco");
                            assert.equal(cursor.primaryKey, 2);
                            cursor.continue();
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                };
                rq.onerror = function () { throw new Error("unexpected error") };
            });

            it("skip far forward", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index")
                           .openCursor();

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 1, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "cupcake");
                            assert.equal(cursor.primaryKey, 5);
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                    cursor.continue([]); // Arrays are always bigger than strings

                };
                rq.onerror = function () { throw new Error("unexpected error2") };
            });

            it("within range", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index")
                           .openCursor(FDBKeyRange.lowerBound("cupcake", true));

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 2, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "pancake");
                            assert.equal(cursor.primaryKey, 3);
                            cursor.continue("pie");
                            break;

                        case 1:
                            assert.equal(cursor.value, "pie");
                            assert.equal(cursor.primaryKey, 1);
                            cursor.continue("zzz");
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                };
                rq.onerror = function () { throw new Error("unexpected error1") };
            });

            it("within single key range", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index")
                           .openCursor("pancake");

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 1, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "pancake");
                            assert.equal(cursor.primaryKey, 3);
                            cursor.continue("pie");
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                };
                rq.onerror = function () { throw new Error("unexpected error1") };
            });

            it("within single key range, with several results", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index")
                           .openCursor("pie");

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 2, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "pie");
                            assert.equal(cursor.primaryKey, 1);
                            cursor.continue();
                            break;

                        case 1:
                            assert.equal(cursor.value, "pie");
                            assert.equal(cursor.primaryKey, 4);
                            cursor.continue();
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                };
                rq.onerror = function () { throw new Error("unexpected error1") };
            });
        });

        // idbcursor_continue_index
        it('iterate to the next record', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0",   iKey: "indexKey_0" },
                          { pKey: "primaryKey_1",   iKey: "indexKey_1" },
                          { pKey: "primaryKey_1-2", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", { keyPath:"pKey" });

                objStore.createIndex("index", "iKey");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (!cursor) {
                        assert.equal(count, records.length, "cursor run count");
                        return done();
                    }

                    var record = cursor.value;
                    assert.equal(record.pKey, records[count].pKey, "primary key");
                    assert.equal(record.iKey, records[count].iKey, "index key");

                    cursor.continue();
                    count++;
                };
                cursor_rq.onerror = function (e) { throw e.target.error; }
            };
        });

        // idbcursor_continue_index2
        it('attempt to pass a key parameter that is not a valid key', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:"pKey"});

                objStore.createIndex("index", "iKey");

                for(var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert.throws(
                        function() { cursor.continue(true); }, DataError);

                    assert(cursor instanceof FDBCursor, "cursor"); // Changed as per new spec behavior: see https://github.com/brettz9/web-platform-tests/pull/1

                    done();
                };
            };
        });

        // idbcursor_continue_index3
        it('attempt to iterate to the previous record when the direction is set for the next record', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:"pKey"});

                objStore.createIndex("index", "iKey");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var count = 0;
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor(undefined, "next"); // XXX: Fx has issue with "undefined"

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (!cursor) {
                        assert.equal(count, 2, "ran number of times");
                        return done()
                    }

                    // First time checks key equal, second time checks key less than
                    assert.throws(
                        function() { cursor.continue(records[0].iKey); }, DataError);

                    cursor.continue();

                    count++;
                };
            };
        });

        // idbcursor_continue_index4
        it('attempt to iterate to the next record when the direction is set for the previous record', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" },
                          { pKey: "primaryKey_2", iKey: "indexKey_2" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                objStore.createIndex("index", "iKey");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var count = 0,
                  cursor_rq = db.transaction("test")
                                .objectStore("test")
                                .index("index")
                                .openCursor(undefined, "prev"); // XXX Fx issues w undefined

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result,
                      record = cursor.value;

                    switch(count) {
                    case 0:
                        assert.equal(record.pKey, records[2].pKey, "first pKey");
                        assert.equal(record.iKey, records[2].iKey, "first iKey");
                        cursor.continue();
                        break;

                    case 1:
                        assert.equal(record.pKey, records[1].pKey, "second pKey");
                        assert.equal(record.iKey, records[1].iKey, "second iKey");
                        assert.throws(
                            function() { cursor.continue("indexKey_2"); }, DataError);
                        done();
                        break;

                    default:
                        throw new Error("Unexpected count value: " + count);
                    }

                    count++;
                };
            };
        });

        // idbcursor_continue_index5
        it("iterate using 'prevunique'", function (done) {
            var db,
              records = [ { pKey: "primaryKey_0",   iKey: "indexKey_0" },
                          { pKey: "primaryKey_1",   iKey: "indexKey_1" },
                          { pKey: "primaryKey_1-2", iKey: "indexKey_1" },
                          { pKey: "primaryKey_2",   iKey: "indexKey_2" } ],

              expected = [ { pKey: "primaryKey_2",   iKey: "indexKey_2" },
                         { pKey: "primaryKey_1",   iKey: "indexKey_1" },
                         { pKey: "primaryKey_0",   iKey: "indexKey_0" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                objStore.createIndex("index", "iKey");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var count = 0,
                  cursor_rq = db.transaction("test")
                                .objectStore("test")
                                .index("index")
                                .openCursor(undefined, 'prevunique');

                cursor_rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, expected.length, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result,
                      record = cursor.value;

                    assert.equal(record.pKey, expected[count].pKey, "pKey #" + count);
                    assert.equal(record.iKey, expected[count].iKey, "iKey #" + count);

                    assert.equal(cursor.key,  expected[count].iKey, "cursor.key #" + count);
                    assert.equal(cursor.primaryKey, expected[count].pKey, "cursor.primaryKey #" + count);

                    count++;
                    cursor.continue(expected[count] ? expected[count].iKey : undefined);
                };
            };
        });

        // idbcursor_continue_index6
        it('iterate using nextunique', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0",   iKey: "indexKey_0" },
                          { pKey: "primaryKey_1",   iKey: "indexKey_1" },
                          { pKey: "primaryKey_1-2", iKey: "indexKey_1" },
                          { pKey: "primaryKey_2",   iKey: "indexKey_2" } ],

              expected = [ { pKey: "primaryKey_0",   iKey: "indexKey_0" },
                         { pKey: "primaryKey_1",   iKey: "indexKey_1" },
                         { pKey: "primaryKey_2",   iKey: "indexKey_2" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                objStore.createIndex("index", "iKey");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var count = 0,
                  cursor_rq = db.transaction("test")
                                .objectStore("test")
                                .index("index")
                                .openCursor(undefined, "nextunique");

                cursor_rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, expected.length, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result,
                      record = cursor.value;

                    assert.equal(record.pKey, expected[count].pKey, "pKey #" + count);
                    assert.equal(record.iKey, expected[count].iKey, "iKey #" + count);

                    assert.equal(cursor.key,  expected[count].iKey, "cursor.key #" + count);
                    assert.equal(cursor.primaryKey, expected[count].pKey, "cursor.primaryKey #" + count);

                    count++;
                    cursor.continue(expected[count] ? expected[count].iKey : undefined);
                };
            };
        });

        // idbcursor_continue_index7
        it('throw TransactionInactiveError', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function (event) {
                db = event.target.result;
                var objStore = db.createObjectStore("store", {keyPath : "pKey"});
                objStore.createIndex("index", "iKey");
                for (var i = 0; i < records.length; i++) {
                    objStore.add(records[i]);
                }
                var rq = objStore.index("index").openCursor();
                rq.onsuccess = function(event) {
                    var cursor = event.target.result;
                    assert(cursor instanceof FDBCursor);

                    event.target.transaction.abort();
                    assert.throws(function() {
                        cursor.continue();
                    }, TransactionInactiveError, "Calling continue() should throws an exception TransactionInactiveError when the transaction is not active.");

                    done();
                };
            }
            open_rq.onerror = function () {}
        });

        // idbcursor_continue_index8
        it('throw InvalidStateError caused by object store been deleted', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function (event) {
                db = event.target.result;
                var objStore = db.createObjectStore("store", {keyPath : "pKey"});
                objStore.createIndex("index", "iKey");
                for (var i = 0; i < records.length; i++) {
                    objStore.add(records[i]);
                }
                var rq = objStore.index("index").openCursor();
                rq.onsuccess = function(event) {
                    var cursor = event.target.result;
                    assert(cursor instanceof FDBCursor);

                    db.deleteObjectStore("store");
                    assert.throws(function() {
                        cursor.continue();
                    }, InvalidStateError, "If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError");

                    done();
                };
            }
            open_rq.onsuccess = function () {}
        });

        // idbcursor_continue_invalid
        it('attempt to call continue two times', function (done) {
            var db;

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test");

                objStore.createIndex("index", "");

                objStore.add("data",  1);
                objStore.add("data2", 2);
            };

            open_rq.onsuccess = function(e) {
                var count = 0;
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 2, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    cursor.continue(undefined);

                    // Second try
                    assert.throws(
                        function() { cursor.continue(); }, 'second continue', InvalidStateError);

                    assert.throws(
                        function() { cursor.continue(3); }, 'third continue', InvalidStateError);

                    count++;
                };
            };
        });
    });

    describe('objectstore', function () {
        // idbcursor_continue_objectstore
        it('iterate to the next record', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {autoIncrement:true, keyPath:"pKey"});

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var store = db.transaction("test")
                              .objectStore("test");

                cursor_rq = store.openCursor();
                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (!cursor) {
                        assert.equal(count, records.length, "cursor run count");
                        return done()
                    }

                    var record = cursor.value;
                    assert.equal(record.pKey, records[count].pKey, "primary key");
                    assert.equal(record.iKey, records[count].iKey, "index key");

                    cursor.continue();
                    count++;
                };
            };
        });

        // idbcursor_continue_objectstore2
        it('attempt to pass a key parameter is not a valid key', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:"pKey"});

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert(cursor instanceof FDBCursor, "cursor exists");
                    assert.throws(
                        function() { cursor.continue(true); }, DataError);

                    done();
                };
            };
        });

        // idbcursor_continue_objectstore3
        it('attempt to iterate to the previous record when the direction is set for the next record', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:"pKey"});

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor(undefined, "next");

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert(cursor instanceof FDBCursor, "cursor exist");
                    assert.throws(
                        function() { cursor.continue(records[0].pKey); }, DataError);

                    done();
                };
            };
        });

        // idbcursor_continue_objectstore4
        it('attempt to iterate to the next record when the direction is set for the previous record', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" },
                          { pKey: "primaryKey_2" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var count = 0,
                  cursor_rq = db.transaction("test")
                                .objectStore("test")
                                .openCursor(null, "prev");

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert(cursor != null, "cursor exist");

                    switch(count) {
                    case 0:
                        assert.equal(cursor.value.pKey, records[2].pKey, "first cursor pkey");
                        cursor.continue(records[1].pKey);
                        break;

                    case 1:
                        assert.equal(cursor.value.pKey, records[1].pKey, "second cursor pkey");
                        assert.throws(
                            function() { cursor.continue(records[2].pKey); }, DataError);
                        done();
                        break;

                    default:
                        throw new Error("Unexpected count value: " + count);
                    }

                    count++;
                };
            };
        });

        // idbcursor_continue_objectstore5
        it('throw TransactionInactiveError', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:"pKey"});

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert(cursor instanceof FDBCursor, "cursor exists");

                    e.target.transaction.abort();
                    assert.throws(function() {
                        cursor.continue();
                    }, TransactionInactiveError, "Calling continue() should throws an exception TransactionInactiveError when the transaction is not active.");


                    done();
                };
            };
        });

        // idbcursor_continue_objectstore6
        it('throw InvalidStateError caused by object store been deleted', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", {keyPath:"pKey"});

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);

                var cursor_rq = objStore.openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert(cursor instanceof FDBCursor, "cursor exists");

                    db.deleteObjectStore("test");
                    assert.throws(function() {
                        cursor.continue();
                    }, InvalidStateError, "If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError");

                    done();
                };
            }
            open_rq.onsuccess = function () {}
        });
    });
});

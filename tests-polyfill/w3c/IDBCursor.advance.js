describe('W3C IDBCursor.advance Tests', function () {
    var FDBCursor = IDBCursor;
    var FDBKeyRange = IDBKeyRange;
    var createdb = support.createdb;
    /*
    Object.defineProperty(global, 'done', {
        set (value) {
            throw new Error("Found the leak!");
        }
    });
    */
    // idbcursor-advance-continue-async
    describe('asyncness', function () {
        var db;

        before(function (done) {
            var open = indexedDB.open(support.getDBName());
            open.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test");
                objStore.createIndex("index", "");

                objStore.add("data",  1);
                objStore.add("data2", 2);
            };
            open.onsuccess = function () { done(); };
        });

        it("advance", function (done) {
            var count = 0;
            var rq = db.transaction("test").objectStore("test").openCursor();

            rq.onsuccess = function(e) {
                if (!e.target.result) {
                    assert.equal(count, 2, 'count');
                    done();
                    return;
                }
                var cursor = e.target.result;

                switch(count) {
                    case 0:
                        assert.equal(cursor.value, "data")
                        assert.equal(cursor.key, 1)
                        cursor.advance(1)
                        assert.equal(cursor.value, "data")
                        assert.equal(cursor.key, 1)
                        break

                    case 1:
                        assert.equal(cursor.value, "data2")
                        assert.equal(cursor.key, 2)
                        cursor.advance(1)
                        assert.equal(cursor.value, "data2")
                        assert.equal(cursor.key, 2)
                        break

                    default:
                        throw new Error("Unexpected count: " + count)
                }

                count++;
            };
            rq.onerror = function (e) { throw e.target.error; };
        });


        it("continue", function (done) {
            var count = 0;
            var rq = db.transaction("test").objectStore("test").index("index").openCursor();

            rq.onsuccess = function(e) {
                if (!e.target.result) {
                    assert.equal(count, 2, 'count');
                    done();
                    return;
                }
                var cursor = e.target.result;

                switch(count) {
                    case 0:
                        assert.equal(cursor.value, "data")
                        assert.equal(cursor.key,   "data")
                        assert.equal(cursor.primaryKey, 1)
                        cursor.continue("data2")
                        assert.equal(cursor.value, "data")
                        assert.equal(cursor.key,   "data")
                        assert.equal(cursor.primaryKey, 1)
                        break

                    case 1:
                        assert.equal(cursor.value, "data2")
                        assert.equal(cursor.key,   "data2")
                        assert.equal(cursor.primaryKey, 2)
                        cursor.continue()
                        assert.equal(cursor.value, "data2")
                        assert.equal(cursor.key,   "data2")
                        assert.equal(cursor.primaryKey, 2)
                        break

                    default:
                        throw new Error("Unexpected count: " + count)
                }

                count++;
            };
            rq.onerror = function (e) { throw e.target.error; };
        });


        it("fresh advance still async", function (done) {
            var count = 0;
            var rq = db.transaction("test").objectStore("test").index("index").openCursor();

            rq.onsuccess = function(e) {
                if (!e.target.result) {
                    assert.equal(count, 2, 'count');
                    done();
                    return;
                }
                var cursor = e.target.result;
                cursor.advance(1)

                switch(count) {
                    case 0:
                        assert.equal(cursor.value, "data")
                        assert.equal(cursor.key,   "data")
                        assert.equal(cursor.primaryKey, 1)
                        break

                    case 1:
                        assert.equal(cursor.value, "data2")
                        assert.equal(cursor.key,   "data2")
                        assert.equal(cursor.primaryKey, 2)
                        break

                    default:
                        throw new Error("Unexpected count: " + count)
                }

                count++;
            };
            rq.onerror = function (e) { throw e.target.error; };
        });


        it("fresh continue still async", function (done) {
            var count = 0;
            var rq = db.transaction("test").objectStore("test").openCursor();

            rq.onsuccess = function(e) {
                if (!e.target.result) {
                    assert.equal(count, 2, 'count');
                    done();
                    return;
                }
                var cursor = e.target.result;
                cursor.continue()

                switch(count) {
                    case 0:
                        assert.equal(cursor.value, "data")
                        assert.equal(cursor.key, 1)
                        break

                    case 1:
                        assert.equal(cursor.value, "data2")
                        assert.equal(cursor.key, 2)
                        break

                    default:
                        throw new Error("Unexpected count: " + count)
                }

                count++;
            };
            rq.onerror = function (e) { throw e.target.error; };
        });
    })
    describe('index', function () {
        // idbcursor-advance
        describe('IDBCursor.advance', function (done) {
            var db;

            before(function (done) {
                open = indexedDB.open(support.getDBName());
                open.onupgradeneeded = function(e) {
                    db = e.target.result;
                    var objStore = db.createObjectStore("test");
                    objStore.createIndex("index", "");

                    objStore.add("cupcake", 5);
                    objStore.add("pancake", 3); // Yes, it is intended
                    objStore.add("pie",     1);
                    objStore.add("pie",     4);
                    objStore.add("taco",    2);
                };
                open.onsuccess = function () { done(); };
            });

            it("advances", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index").openCursor();

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 3, "count");
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "cupcake");
                            assert.equal(cursor.primaryKey, 5);
                            break;

                        case 1:
                            assert.equal(cursor.value, "pie");
                            assert.equal(cursor.primaryKey, 1);
                            break;

                        case 2:
                            assert.equal(cursor.value, "taco");
                            assert.equal(cursor.primaryKey, 2);
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                    cursor.advance(2);
                };
                rq.onerror = function (e) { throw e.target.error; };
            });

            it("advances backwards", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index").openCursor(null, "prev");

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 3, "count");
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "taco");
                            assert.equal(cursor.primaryKey, 2);
                            break;

                        case 1:
                            assert.equal(cursor.value, "pie");
                            assert.equal(cursor.primaryKey, 1);
                            break;

                        case 2:
                            assert.equal(cursor.value, "cupcake");
                            assert.equal(cursor.primaryKey, 5);
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                    cursor.advance(2);
                };
                rq.onerror = function (e) { throw e.target.error; };
            });

            it("skip far forward", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index")
                           .openCursor();

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 1, "count");
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
                    cursor.advance(100000);
                };
                rq.onerror = function (e) { throw e.target.error; };
            });


            it("within range", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index")
                           .openCursor(FDBKeyRange.lowerBound("cupcake", true));

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 2, "count");
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "pancake");
                            assert.equal(cursor.primaryKey, 3);
                            break;

                        case 1:
                            assert.equal(cursor.value, "pie");
                            assert.equal(cursor.primaryKey, 4);
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                    cursor.advance(2);
                };
                rq.onerror = function (e) { throw e.target.error; };
            });


            it("within single key range", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index")
                           .openCursor("pancake");

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 1, "count");
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "pancake");
                            assert.equal(cursor.primaryKey, 3);
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                    cursor.advance(1);
                };
                rq.onerror = function (e) { throw e.target.error; };
            });


            it("within single key range, with several results", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index")
                           .openCursor("pie");

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 2, "count");
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    switch(count) {
                        case 0:
                            assert.equal(cursor.value, "pie");
                            assert.equal(cursor.primaryKey, 1);
                            break;

                        case 1:
                            assert.equal(cursor.value, "pie");
                            assert.equal(cursor.primaryKey, 4);
                            break;

                        default:
                            throw new Error("Unexpected count: " + count);
                    }

                    count++;
                    cursor.advance(1);
                };
                rq.onerror = function (e) { throw e.target.error; };
            });
        });

        // idbcursor-advance-invalid
        describe('IDBCursor.advance - invalid', function (done) {
            var db;

            before(function (done) {
                open = indexedDB.open(support.getDBName());
                open.onupgradeneeded = function(e) {
                    db = e.target.result;
                    var objStore = db.createObjectStore("test");
                    objStore.createIndex("index", "");

                    objStore.add("data",  1);
                    objStore.add("data2", 2);
                };
                open.onsuccess = function () { done(); };
            });

            it("attempt to call advance twice", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index").openCursor();

                rq.onsuccess = function(e) {
                    if (!e.target.result) {
                        assert.equal(count, 2, 'count');
                        done();
                        return;
                    }
                    var cursor = e.target.result;

                    cursor.advance(1);

                    // Second try
                    support.throws(
                        function() { cursor.advance(1); }, 'InvalidStateError', 'second advance');

                    support.throws(
                        function() { cursor.advance(3); }, 'InvalidStateError', 'third advance');

                    count++;
                };
                rq.onerror = function (e) { throw e.target.error; };
            });


            it("pass something other than number", function (done) {
                var rq = db.transaction("test").objectStore("test").index("index").openCursor();

                rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert.throws(
                        function() { cursor.advance(window.document); }, TypeError);

                    assert.throws(
                        function() { cursor.advance({}); }, TypeError);

                    assert.throws(
                        function() { cursor.advance([]); }, TypeError);

                    assert.throws(
                        function() { cursor.advance(""); }, TypeError);

                    assert.throws(
                        function() { cursor.advance("1 2"); }, TypeError);

                    done();
                };
                rq.onerror = function (e) { throw e.target.error; };
            });


            it("pass null/undefined", function (done) {
                var rq = db.transaction("test").objectStore("test").index("index").openCursor();

                rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert.throws(
                        function() { cursor.advance(null); }, TypeError);

                    assert.throws(
                        function() { cursor.advance(undefined); }, TypeError);

                    var myvar = null;
                    assert.throws(
                        function() { cursor.advance(myvar); }, TypeError);

                    done();
                };
                rq.onerror = function (e) { throw e.target.error; };
            });


            it("missing argument", function (done) {
                var rq = db.transaction("test").objectStore("test").index("index").openCursor();

                rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert.throws(
                        function() { cursor.advance(); }, TypeError);

                    done();
                };
                rq.onerror = function (e) { throw e.target.error; };
            });


            it("pass negative numbers", function (done) {
                var rq = db.transaction("test").objectStore("test").index("index").openCursor();

                rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert.throws(
                        function() { cursor.advance(-1); }, TypeError);

                    assert.throws(
                        function() { cursor.advance(NaN); }, TypeError);

                    assert.throws(
                        function() { cursor.advance(0); }, TypeError);

                    assert.throws(
                        function() { cursor.advance(-0); }, TypeError);

                    assert.throws(
                        function() { cursor.advance(Infinity); }, TypeError);

                    assert.throws(
                        function() { cursor.advance(-Infinity); }, TypeError);

                    var myvar = -999999;
                    assert.throws(
                        function() { cursor.advance(myvar); }, TypeError);

                    done();
                };
                rq.onerror = function (e) { throw e.target.error; };
            });


            it("got value not set on exception", function (done) {
                var count = 0;
                var rq = db.transaction("test").objectStore("test").index("index").openCursor();

                rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (!cursor)
                    {
                        assert.equal(count, 2, "count runs");
                        done();
                        return;
                    }

                    assert.throws(
                        function() { cursor.advance(0); }, TypeError);

                    cursor.advance(1);
                    count++;
                };
                rq.onerror = function (e) { throw e.target.error; };
            });
        });

        // idbcursor_advance_index
        it('iterate cursor number of times specified by count', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" },
                          { pKey: "primaryKey_2", iKey: "indexKey_2" },
                          { pKey: "primaryKey_3", iKey: "indexKey_3" }];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var store = db.createObjectStore("test", {keyPath:"pKey"});
                store.createIndex("idx", "iKey");

                for(var i = 0; i < records.length; i++) {
                    store.add(records[i]);
                }
            };

            open_rq.onsuccess = function (e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .index("idx")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert(cursor instanceof FDBCursor);

                    switch(count) {
                        case 0:
                            count += 3;
                            cursor.advance(3);
                            break;
                        case 3:
                            var record = cursor.value;
                            assert.equal(record.pKey, records[count].pKey, "record.pKey");
                            assert.equal(record.iKey, records[count].iKey, "record.iKey");
                            done();
                            break;
                        default:
                            throw new Error("unexpected count");
                            break;
                    }
                };
            }
        });

        // idbcursor_advance_index2
        it('attempt to pass a count parameter that is not a number', function (done) {
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

                    assert(cursor != null, "cursor exist");
                    assert.throws(
                        function() { cursor.advance(window.document); }, TypeError);

                    done();
                };
            };
        });

        // idbcursor_advance_index3
        it('attempt to advance backwards', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

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
                                  .openCursor(undefined, "next");

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert(cursor != null, "cursor exist");
                    assert.throws(
                        function() { cursor.advance(-1); }, TypeError);

                    done();
                };
            };
        });

        // idbcursor_advance_index5
        it('iterate to the next record', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0",   iKey: "indexKey_0" },
                          { pKey: "primaryKey_1",   iKey: "indexKey_1" },
                          { pKey: "primaryKey_1-2", iKey: "indexKey_1" } ],
              expected = [ { pKey: "primaryKey_0",   iKey: "indexKey_0" },
                           { pKey: "primaryKey_1-2", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result
                var objStore = db.createObjectStore("test", { keyPath:"pKey" })

                objStore.createIndex("index", "iKey")

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i])
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if (!cursor) {
                        assert.equal(count, expected.length, "cursor run count")
                        return done()
                    }

                    var record = cursor.value;
                    assert.equal(record.pKey, expected[count].pKey, "primary key");
                    assert.equal(record.iKey, expected[count].iKey, "index key");

                    cursor.advance(2);
                    count++;
                };
            };
        });

        // idbcursor_advance_index6
        it('throw TypeError', function (done) {
            var db,
                records = [{ pKey: "primaryKey_0", iKey: "indexKey_0" },
                           { pKey: "primaryKey_1", iKey: "indexKey_1" }];

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

                    assert.throws(function() {
                        cursor.advance(0);
                    }, TypeError, null, "Calling advance() with count argument 0 should throw TypeError.");

                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_advance_index7
        it('throw TransactionInactiveError', function (done) {
            var db,
                records = [{ pKey: "primaryKey_0", iKey: "indexKey_0" },
                           { pKey: "primaryKey_1", iKey: "indexKey_1" }];

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
                    support.throws(function() {
                        cursor.advance(1);
                    }, 'TransactionInactiveError', "Calling advance() should throws an exception TransactionInactiveError when the transaction is not active.");

                    done();
                };
            }
            open_rq.onerror = function () {};
        });

        // idbcursor_advance_index8
        it('throw InvalidStateError', function (done) {
            var db,
                records = [{ pKey: "primaryKey_0", iKey: "indexKey_0" },
                           { pKey: "primaryKey_1", iKey: "indexKey_1" }];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function (event) {
                db = event.target.result;
                var objStore = db.createObjectStore("store", {keyPath : "pKey"});
                objStore.createIndex("index", "iKey");
                for (var i = 0; i < records.length; i++) {
                    objStore.add(records[i]);
                }
                var rq = objStore.index("index").openCursor();
                var reallyDone = false;
                rq.onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        assert(cursor instanceof FDBCursor);

                        cursor.advance(1);
                        support.throws(function() {
                            cursor.advance(1);
                        }, 'InvalidStateError', "Calling advance() should throw DOMException when the cursor is currently being iterated.");

                        if (!reallyDone) {
                            reallyDone = true;
                            done();
                        }
                    }
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_advance_index9
        it('throw InvalidStateError caused by object store been deleted', function (done) {
            var db,
                records = [{ pKey: "primaryKey_0", iKey: "indexKey_0" },
                           { pKey: "primaryKey_1", iKey: "indexKey_1" }];

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
                    assert(cursor instanceof FDBCursor, "cursor exist");

                    db.deleteObjectStore("store");
                    support.throws(function() {
                        cursor.advance(1);
                    }, 'InvalidStateError', "If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError");

                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });
    });

    describe('objectstore', function () {
        // idbcursor_advance_objectstore
        it('iterate cursor number of times specified by count', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" },
                          { pKey: "primaryKey_2" },
                          { pKey: "primaryKey_3" }];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var store = db.createObjectStore("test", {keyPath:"pKey"});

                for(var i = 0; i < records.length; i++) {
                    store.add(records[i]);
                }
            };

            open_rq.onsuccess = function (e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert(cursor instanceof FDBCursor);

                    switch(count) {
                        case 0:
                            count += 3;
                            cursor.advance(3);
                            break;
                        case 3:
                            assert.equal(cursor.value.pKey, records[count].pKey, "cursor.value.pKey");
                            done();
                            break;
                        default:
                            throw new Error("unexpected count");
                            break;
                    }
                };
            }
        });

        // idbcursor_advance_objectstore2
        it('throw TypeError', function (done) {
            var db,
                records = [{ pKey: "primaryKey_0"},
                           { pKey: "primaryKey_1"}];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function (event) {
                db = event.target.result;
                var objStore = db.createObjectStore("store", {keyPath:"pKey"});
                for (var i = 0; i < records.length; i++) {
                    objStore.add(records[i]);
                }
            }

            open_rq.onsuccess = function (event) {
                var txn = db.transaction("store", "readwrite");
                var rq = txn.objectStore("store").openCursor();
                rq.onsuccess = function(event) {
                    var cursor = event.target.result;
                    assert(cursor instanceof FDBCursor);

                    assert.throws(function() {
                        cursor.advance(0);
                    }, TypeError, null, "Calling advance() with count argument 0 should throw TypeError.");

                    done();
                };
            }
        });

        // idbcursor_advance_objectstore3
        it('throw TransactionInactiveError', function (done) {
            var db,
                records = [{ pKey: "primaryKey_0"},
                           { pKey: "primaryKey_1"}];
            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function (event) {
                db = event.target.result;
                var objStore = db.createObjectStore("store", {keyPath:"pKey"});
                for (var i = 0; i < records.length; i++) {
                    objStore.add(records[i]);
                }
            }

            open_rq.onsuccess = function (event) {
                var txn = db.transaction("store", "readwrite");
                var rq = txn.objectStore("store").openCursor();
                rq.onsuccess = function(event) {
                    var cursor = event.target.result;
                    assert(cursor instanceof FDBCursor);
                    event.target.transaction.abort();
                    support.throws(function() {
                        cursor.advance(1);
                    }, 'TransactionInactiveError', "Calling advance() should throws an exception TransactionInactiveError when the transaction is not active");

                    done();
                };
            }
        });

        // idbcursor_advance_objectstore4
        it('throw InvalidStateError', function (done) {
            var db,
                records = [{ pKey: "primaryKey_0"},
                           { pKey: "primaryKey_1"}];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function (event) {
                db = event.target.result;
                var objStore = db.createObjectStore("store", {keyPath:"pKey"});
                for (var i = 0; i < records.length; i++) {
                    objStore.add(records[i]);
                }
            }

            open_rq.onsuccess = function (event) {
                var txn = db.transaction("store", "readwrite");
                var rq = txn.objectStore("store").openCursor();
                var reallyDone = false;
                rq.onsuccess = function(event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        assert(cursor instanceof FDBCursor);

                        cursor.advance(1);
                        support.throws(function() {
                            cursor.advance(1);
                        }, 'InvalidStateError', "Calling advance() should throw DOMException when the cursor is currently being iterated.");

                        if (!reallyDone) {
                            reallyDone = true;
                            done();
                        }
                    }
                };
            }
        });

        // idbcursor_advance_objectstore5
        it('throw InvalidStateError caused by object store been deleted', function (done) {
            var db,
                records = [{ pKey: "primaryKey_0"},
                           { pKey: "primaryKey_1"}];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function (event) {
                db = event.target.result;
                var objStore = db.createObjectStore("store", {keyPath:"pKey"});
                for (var i = 0; i < records.length; i++) {
                    objStore.add(records[i]);
                }
                var rq = objStore.openCursor();
                rq.onsuccess = function(event) {
                    var cursor = event.target.result;
                    assert(cursor instanceof FDBCursor, "cursor exist");

                    db.deleteObjectStore("store");
                    support.throws(function() {
                        cursor.advance(1);
                    }, 'InvalidStateError', "If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError");

                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });
    });
});

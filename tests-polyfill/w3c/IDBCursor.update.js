var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBCursor = IDBCursor;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBCursor.update Tests', function () {
    describe('index', function () {
        // idbcursor_update_index
        it('modify a record in the object store', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });
                objStore.createIndex("index", "iKey");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);

                // XXX: Gecko doesn't like this
                //e.target.transaction.oncomplete = CursorUpdateRecord;
            };

            open_rq.onsuccess = CursorUpdateRecord;


            function CursorUpdateRecord(e) {
                var txn = db.transaction("test", "readwrite"),
                  cursor_rq = txn.objectStore("test")
                                 .index("index")
                                 .openCursor();
                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    cursor.value.iKey += "_updated";
                    cursor.update(cursor.value);
                };

                txn.oncomplete = VerifyRecordWasUpdated;
            }


            function VerifyRecordWasUpdated(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert.equal(cursor.value.iKey, records[0].iKey + "_updated");
                    done();
                };
            }
        });

        // idbcursor_update_index2
        it('attempt to modify a record in a read-only transaction', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });
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
                    support.throws(function() { cursor.update(cursor.value); }, 'ReadOnlyError');
                    done();
                };
            }
        });

        // idbcursor_update_index3
        it('attempt to modify a record in an inactive transaction', function (done) {
            var db, cursor, record
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", { keyPath: "pKey" });
                var index = objStore.createIndex("index", "iKey");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);

                var cursor_rq = index.openCursor();

                cursor_rq.onsuccess = function(e) {
                    cursor = e.target.result;
                    assert(cursor instanceof FDBCursor, "cursor exist");
                    record = cursor.value;
                };

                e.target.transaction.oncomplete = function(e) {
                    support.throws(function() { cursor.update(record); }, 'TransactionInactiveError')
                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_update_index4
        it('attempt to modify a record when object store been deleted', function (done) {
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
                    cursor.value.iKey += "_updated";
                    support.throws(function() {
                        cursor.update(cursor.value);
                    }, 'InvalidStateError', "If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError");

                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_update_index5
        it('throw DataCloneError', function (done) {
            var db,
                records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                            { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });
                objStore.createIndex("index", "iKey");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert(cursor instanceof FDBCursor);

                    var record = cursor.value;
                    record.data = new Error();
                    support.throws(function() {
                        cursor.update(record);
                    }, 'DataCloneError');
                    done();
                };
            }
        });

        // idbcursor_update_index6
        it('no argument', function (done) {
            var db,
                records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                            { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });
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
                    assert(cursor instanceof FDBCursor);

                    assert.throws(function() { cursor.update(); }, TypeError);
                    done();
                };
            }
        });

        // idbcursor_update_index7
        it('throw DataError', function (done) {
            var db,
                records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                            { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });
                objStore.createIndex("index", "iKey");

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .index("index")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert(cursor instanceof FDBCursor);

                    support.throws(function() { cursor.update(null); }, 'DataError');
                    done();
                };
            }
        });
    });

    describe('objectstore', function () {
        // idbcursor_update_objectstore
        it('modify a record in the object store', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);

                // XXX: Gecko doesn't like this
                //e.target.transaction.oncomplete = CursorUpdateRecord;
            };

            open_rq.onsuccess = CursorUpdateRecord;


            function CursorUpdateRecord(e) {
                var txn = db.transaction("test", "readwrite"),
                  cursor_rq = txn.objectStore("test")
                                 .openCursor();
                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    cursor.value.data = "New information!";
                    cursor.update(cursor.value);
                };

                txn.oncomplete = VerifyRecordWasUpdated;
            }


            function VerifyRecordWasUpdated(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert.equal(cursor.value.data, "New information!");
                    done();
                };
            }
        });

        // idbcursor_update_objectstore2
        it('attempt to modify a record in a read-only transaction', function (done) {
            var db,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    support.throws(function() { cursor.update(cursor.value); }, 'ReadOnlyError');
                    done();
                };
            }
        });

        // idbcursor_update_objectstore3
        it('attempt to modify a record in an inactive transaction', function (done) {
            var db, cursor, record,
              records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                          { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);

                var cursor_rq = objStore.openCursor();

                cursor_rq.onsuccess = function(e) {
                    cursor = e.target.result;
                    assert(cursor instanceof FDBCursor, "cursor exist");
                    record = cursor.value;
                };

                e.target.transaction.oncomplete = function(e) {
                    support.throws(function() { cursor.update(record); }, 'TransactionInactiveError')
                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_update_objectstore4
        it('modify a record in the object store', function (done) {
            var db

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("test");

                objStore.add("data", "key");
            };

            open_rq.onsuccess = function(e) {
                var txn = db.transaction("test", "readwrite"),
                  cursor_rq = txn.objectStore("test")
                                 .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    cursor.value = "new data!";
                    cursor.update(cursor.value).onsuccess = function(e) {
                        assert.equal(e.target.result, "key");
                        done();
                    };
                };
            };
        });

        // idbcursor_update_objectstore5
        it('attempt to  modify a record when object store been deleted', function (done) {
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
                    cursor.value += "_updated";
                    support.throws(function() {
                        cursor.update(cursor.value);
                    }, 'InvalidStateError', "If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError");


                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_update_objectstore6
        it('throw DataCloneError', function (done) {
            var db,
                records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                            { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert(cursor instanceof FDBCursor);

                    var record = cursor.value;
                    record.data = function () {};
                    support.throws(function() {
                        cursor.update(record);
                    }, 'DataCloneError');
                    done();
                };
            }
        });

        // idbcursor_update_objectstore7
        it('no argument', function (done) {
            var db,
                records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                            { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert(cursor instanceof FDBCursor);

                    assert.throws(function() { cursor.update(); }, TypeError);
                    done();
                };
            }
        });

        // idbcursor_update_objectstore8
        it('throw DataError', function (done) {
            var db,
                records = [ { pKey: "primaryKey_0", iKey: "indexKey_0" },
                            { pKey: "primaryKey_1", iKey: "indexKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = function(e) {
                var cursor_rq = db.transaction("test", "readwrite")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;
                    assert(cursor instanceof FDBCursor);

                    support.throws(function() { cursor.update(null); }, 'DataError');
                    done();
                };
            }
        });
    });
});

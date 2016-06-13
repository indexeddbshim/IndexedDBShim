var assert = require('assert');
var FDBCursor = IDBCursor;
var InvalidStateError = DOMException;
var ReadOnlyError = DOMException;
var TransactionInactiveError = DOMException;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBCursor.delete Tests', function () {
    describe('index', function () {
        // idbcursor_delete_index
        it('remove a record from the object store', function (done) {
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
            };

            open_rq.onsuccess = CursorDeleteRecord;


            function CursorDeleteRecord(e) {
                var txn = db.transaction("test", "readwrite"),
                  cursor_rq = txn.objectStore("test")
                                 .index("index")
                                 .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert(cursor instanceof FDBCursor, "cursor exist");
                    cursor.delete();
                };
                txn.onerror = function (e) { throw e.target.error; }
                txn.oncomplete = VerifyRecordWasDeleted;
            }


            function VerifyRecordWasDeleted(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    if (!cursor) {
                        assert.equal(count, 1, 'count');
                        return done();
                    }

                    assert.equal(cursor.value.pKey, records[1].pKey);
                    assert.equal(cursor.value.iKey, records[1].iKey);
                    cursor.continue();
                    count++;
                };
            }
        });

        // idbcursor_delete_index2
        it('attempt to remove a record in a read-only transaction', function (done) {
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

                    assert(cursor instanceof FDBCursor, "cursor exist");
                    assert.throws(function() { cursor.delete(); }, ReadOnlyError);
                    done();
                };
            }
        });

        // idbcursor_delete_index3
        it('attempt to remove a record in an inactive transaction', function (done) {
            var db, cursor,
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
                };

                e.target.transaction.oncomplete = function(e) {
                    assert.throws(function() { cursor.delete(); }, TransactionInactiveError)
                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_delete_index4
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
                    assert.throws(function() {
                        cursor.delete();
                    }, InvalidStateError, "If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError");

                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_delete_index5
        it('throw InvalidStateError when the cursor is being iterated', function (done) {
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
                var count = 0;
                rq.onsuccess = function(event) {
                    count += 1;
                    var cursor = event.target.result;
                    if (cursor) {
                        assert(cursor instanceof FDBCursor, "cursor exist");
                        cursor.continue();
                        assert.throws(function() {
                            cursor.delete();
                        }, InvalidStateError);

                        if (count === 1) {
                            done();
                        }
                    }
                };
            }
            open_rq.onsuccess = function () {};
        });
    });

    describe('objectstore', function () {
        // idbcursor_delete_objectstore
        it('remove a record from the object store', function (done) {
            var db,
              count = 0,
              records = [ { pKey: "primaryKey_0" },
                          { pKey: "primaryKey_1" } ];

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                var objStore = db.createObjectStore("test", { keyPath: "pKey" });

                for (var i = 0; i < records.length; i++)
                    objStore.add(records[i]);
            };

            open_rq.onsuccess = CursorDeleteRecord;


            function CursorDeleteRecord(e) {
                var txn = db.transaction("test", "readwrite"),
                  cursor_rq = txn.objectStore("test").openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    assert(cursor != null, "cursor exist");
                    cursor.delete();
                };
                txn.onerror = function (e) { throw e.target.error; }
                txn.oncomplete = VerifyRecordWasDeleted;
            }


            function VerifyRecordWasDeleted(e) {
                var cursor_rq = db.transaction("test")
                                  .objectStore("test")
                                  .openCursor();

                cursor_rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    if (!cursor) {
                        assert.equal(count, 1, 'count');
                        return done();
                    }

                    assert.equal(cursor.value.pKey, records[1].pKey);
                    count++;
                    cursor.continue();
                };
            }
        });

        // idbcursor_delete_objectstore2
        it('attempt to remove a record in a read-only transaction', function (done) {
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

                    assert(cursor != null, "cursor exist");
                    assert.throws(function() { cursor.delete(); }, ReadOnlyError);
                    done();
                };
            }
        });

        // idbcursor_delete_objectstore3
        it('attempt to remove a record in an inactive transaction', function (done) {
            var db, cursor,
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
                };

                e.target.transaction.oncomplete = function(e) {
                    assert.throws(function() { cursor.delete(); }, TransactionInactiveError)
                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_delete_objectstore4
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
                    assert.throws(function() {
                        cursor.delete();
                    }, InvalidStateError, "If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError");

                    done();
                };
            }
            open_rq.onsuccess = function () {};
        });

        // idbcursor_delete_objectstore5
        it('throw InvalidStateError when the cursor is being iterated', function (done) {
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
                var count = 0;
                rq.onsuccess = function(event) {
                    count += 1;
                    var cursor = event.target.result;

                    if (cursor) {
                        assert(cursor instanceof FDBCursor, "cursor exist");
                        cursor.continue();
                        assert.throws(function() {
                            cursor.delete();
                        }, InvalidStateError);

                        if (count === 1) {
                            done();
                        }
                    }
                };
            }
        });
    });
});

var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBObjectStore = IDBObjectStore;
var ConstraintError = DOMException;
var InvalidStateError = DOMException;
var support = require('./support');
var createdb = support.createdb;

describe('W3C IDBDatabase.createObjectStore Tests', function () {
    // idbdatabase_createobjectstore
    it('returns an instance of FDBObjectStore', function (done) {
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            var db = e.target.result
            var objStore = db.createObjectStore('instancetest')

            assert(objStore instanceof FDBObjectStore, 'instanceof FDBObjectStore')
        }

        open_rq.onsuccess = function(e) {
            var db = e.target.result
            var objStore = db.transaction('instancetest').objectStore('instancetest')

            assert(objStore instanceof FDBObjectStore, 'instanceof FDBObjectStore')
            done()
        }
    });

    // idbdatabase_createobjectstore2
    it("object store 'name' and 'keyPath' properties are correctly set", function (done) {
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            var db = e.target.result,
                objStore = db.createObjectStore("prop", { keyPath: "mykeypath" })

            assert.equal(objStore.name, "prop", "object store name")
            assert.equal(objStore.keyPath, "mykeypath", "key path")
            assert.equal(objStore.autoIncrement, false, "auto increment")
        }

        open_rq.onsuccess = function(e) {
            var db = e.target.result
            var objStore = db.transaction('prop').objectStore('prop')

            assert.equal(objStore.name, "prop", "object store name")
            assert.equal(objStore.keyPath, "mykeypath", "key path")
            assert.equal(objStore.autoIncrement, false, "auto increment")
            done()
        }
    });

    // idbdatabase_createobjectstore3
    it('attempt to create an object store outside of a version change transaction', function (done) {
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function() {}
        open_rq.onsuccess = function (e) {
            var db = e.target.result
            assert.throws(
                function() { db.createObjectStore('fails') }, InvalidStateError)
            done();
        }
    });

    // idbdatabase_createobjectstore4
    it('attempt to create an object store that already exists', function (done) {
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            var db = e.target.result
            db.createObjectStore("dupe")
            assert.throws(
                function() { db.createObjectStore("dupe") }, ConstraintError)

            // Bonus test creating a new objectstore after the exception
            db.createObjectStore("dupe ")
            done()
        }
        open_rq.onsuccess = function () {};
    });

    // idbdatabase_createobjectstore5
    it("object store's name appears in database's list", function (done) {
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            var db = e.target.result

            db.createObjectStore("My cool object store name")
            assert(
                db.objectStoreNames.indexOf("My cool object store name") >= 0,
                'objectStoreNames.contains')
        }

        open_rq.onsuccess = function(e) {
            var db = e.target.result

            assert(
                db.objectStoreNames.indexOf("My cool object store name") >= 0,
                'objectStoreNames.contains (in success)')
            done()
        }
    });

    // idbdatabase_createobjectstore6
    it('attempt to create an object store with an invalid key path', function (done) {
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            var db = e.target.result

            assert.throws(function() {
                    db.createObjectStore("invalidkeypath", { keyPath: "Invalid Keypath" })
                }, SyntaxError)

            assert.throws(function() {
                    db.createObjectStore("invalidkeypath", { autoIncrement: true,
                                                             keyPath: "Invalid Keypath" })
                }, SyntaxError)

            done()
        }
        open_rq.onsuccess = function () {};
    });

    // idbdatabase_createobjectstore7
    it('create an object store with an unknown optional parameter', function (done) {
        var open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            var db = e.target.result
            db.createObjectStore("with unknown param", { parameter: 0 });

            done()
        }
        open_rq.onsuccess = function () {};
    });

    // idbdatabase_createobjectstore8-parameters
    it('IDBObjectStoreParameters', function (done) {
        this.timeout(5000);
        var numTried = 0;
        var numDone = 0;
        function optionalParameters(desc, params) {
            numTried += 1;

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                e.target.result.createObjectStore("store", params);

                numDone += 1;
                if (numDone === numTried) {
                    done();
                }
            };
            open_rq.onsuccess = function () {};
        }

        optionalParameters("autoInc true",                    {autoIncrement: true});
        optionalParameters("autoInc true, keyPath null",      {autoIncrement: true,  keyPath: null});
        optionalParameters("autoInc true, keyPath undefined", {autoIncrement: true,  keyPath: undefined});
        optionalParameters("autoInc true, keyPath string",    {autoIncrement: true,  keyPath: "a"});

        optionalParameters("autoInc false, keyPath empty",  {autoIncrement: false, keyPath: ""});
        optionalParameters("autoInc false, keyPath array",  {autoIncrement: false, keyPath: ["h", "j"]});
        optionalParameters("autoInc false, keyPath string", {autoIncrement: false, keyPath: "abc"});

        optionalParameters("keyPath empty",     {keyPath: ""});
        optionalParameters("keyPath array",     {keyPath: ["a","b"]});
        optionalParameters("keyPath string",    {keyPath: "abc"});
        optionalParameters("keyPath null",      {keyPath: null});
        optionalParameters("keyPath undefined", {keyPath: undefined});
    });

    // idbdatabase_createobjectstore9-invalidparameters
    it('Invalid optionalParameters', function (done) {
        var numTried = 0;
        var numDone = 0;
        function invalid_optionalParameters(desc, params) {
            numTried += 1;

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                assert.throws(function () {
                    e.target.result.createObjectStore("store", params);
                });

                numDone += 1;
                if (numDone === numTried) {
                    done();
                }
            };
            open_rq.onsuccess = function () {};
        }

        invalid_optionalParameters("autoInc and empty keyPath", {autoIncrement: true, keyPath: ""});
        invalid_optionalParameters("autoInc and keyPath array", {autoIncrement: true, keyPath: []});
        invalid_optionalParameters("autoInc and keyPath array 2", {autoIncrement: true, keyPath: ["hey"]});
        invalid_optionalParameters("autoInc and keyPath object", {autoIncrement: true, keyPath: {a:"hey", b:2}});
    });

    // idbdatabase_createobjectstore10-1000ends
    it('create 100 object stores, add one item and delete', function (done) {
        var db,
            open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            db = e.target.result
            var st, i;
            for (i = 0; i < 100; i++)
            {
                st = db.createObjectStore("object_store_" + i)
                st.add("test", 1);
            }

            st.get(1).onsuccess = function(e) {
                assert.equal(e.target.result, "test")
            }
        }
        open_rq.onsuccess = function(e) {
            db.close()
            indexedDB.deleteDatabase(db.name).onsuccess = function(e) {
                done()
            }
        }
    });

    // idbdatabase_createobjectstore10-emptyname
    it('empty name', function (done) {
        var db

        var open_rq = createdb(done)
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result
            var store = db.createObjectStore("")

            for (var i = 0; i < 5; i++)
                store.add("object_" + i, i)

            assert.equal(db.objectStoreNames[0], "", "db.objectStoreNames[0]")
            assert.equal(db.objectStoreNames.length, 1, "objectStoreNames.length")
        }

        open_rq.onsuccess = function() {
            var store = db.transaction("").objectStore("")

            store.get(2).onsuccess = function(e) {
                assert.equal(e.target.result, "object_2")
            }

            assert.equal(db.objectStoreNames[0], "", "db.objectStoreNames[0]")
            assert.equal(db.objectStoreNames.length, 1, "objectStoreNames.length")

            done()
        }
    });

    // idbdatabase_createObjectStore11
    it('Attampt Create Exsists Object Store With Difference keyPath throw ConstraintError', function (done) {
        var open_rq = createdb(done);

        open_rq.onupgradeneeded = function (e) {
            var db = e.target.result;
            db.createObjectStore("store");
            assert.throws(function(){
                db.createObjectStore("store", {
                    keyPath: "key1",
                });
            }, ConstraintError);
            done();
        }
        open_rq.onsuccess = function () {};
    });

    // idbdatabase_createobjectstore-createIndex-emptyname
    it('IDBDatabase.createObjectStore() and FDBObjectStore.createIndex() - both with empty name', function (done) {
        var db

        var open_rq = createdb(done)
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result
            var store = db.createObjectStore("")

            for (var i = 0; i < 5; i++)
                store.add({ idx: "object_" + i }, i)

            store.createIndex("", "idx")

            store.get(4)
                 .onsuccess = function(e) {
                assert.equal(e.target.result.idx, 'object_4', 'result')
            }
            assert.equal(store.indexNames[0], "", "indexNames[0]")
            assert.equal(store.indexNames.length, 1, "indexNames.length")
        }

        open_rq.onsuccess = function() {
            var store = db.transaction("").objectStore("")

            assert.equal(store.indexNames[0], "", "indexNames[0]")
            assert.equal(store.indexNames.length, 1, "indexNames.length")

            store.index("")
                 .get('object_4')
                 .onsuccess = function(e) {
                assert.equal(e.target.result.idx, 'object_4', 'result')
                done()
            }
        }
    });
});

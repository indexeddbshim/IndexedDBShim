require('./setup')
var assert = require('assert')

/**
 * Created by Kristof on 29/03/2015.
 */

describe("Objectstore - Delete", function () {

    it("Deleting data - no data present for key", function (done) {
        var expect = 2, ct = 0;
        var key = 1;

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(key);
                        deleteRequest.onsuccess = function (e){
                            assert.equal(e.target.result, undefined, "Data undefined");
                            ct++;

                            var countRequest = objectstore.count(key);

                            countRequest.onsuccess = function (e){
                                assert.equal(e.target.result, 0, "Data deleted");
                                ct++;

                            };
                            countRequest.onerror = function (e){
                                assert.ok(false, "Count error");
                            };
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Delete error");
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - key", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreNoAutoIncrementWithData(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(addData.id);
                        deleteRequest.onsuccess = function (e){
                            assert.equal(e.target.result, undefined, "Data deleted");
                            ct++;
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Delete error");
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - key range lowerBound exclusieve", function (done) {
        var expect = 2, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(KeyRange.lowerBound(5, true));
                        deleteRequest.onsuccess = function (e){
                            assert.equal(e.target.result, undefined, "Data deleted");
                            ct++;

                            var countRequest = objectstore.count(KeyRange.lowerBound(5, true));

                            countRequest.onsuccess = function (e){
                                assert.equal(e.target.result, 0, "Data deleted");
                                ct++;

                            };
                            countRequest.onerror = function (e){
                                assert.ok(false, "Count error");
                            };
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Delete error");
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - key range lowerBound inclusieve", function (done) {
        var expect = 2, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(KeyRange.lowerBound(5));
                        deleteRequest.onsuccess = function (e){
                            assert.equal(e.target.result, undefined, "Data deleted");
                            ct++;

                            var countRequest = objectstore.count(KeyRange.lowerBound(5));

                            countRequest.onsuccess = function (e){
                                assert.equal(e.target.result, 0, "Data deleted");
                                ct++;

                            };
                            countRequest.onerror = function (e){
                                assert.ok(false, "Count error");
                            };
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Delete error");
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - key range upperBound exclusieve", function (done) {
        var expect = 2, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(KeyRange.upperBound(5, true));
                        deleteRequest.onsuccess = function (e){
                            assert.equal(e.target.result, undefined, "Data deleted");
                            ct++;

                            var countRequest = objectstore.count(KeyRange.upperBound(5, true));

                            countRequest.onsuccess = function (e){
                                assert.equal(e.target.result, 0, "Data deleted");
                                ct++;

                            };
                            countRequest.onerror = function (e){
                                assert.ok(false, "Count error");
                            };
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Delete error");
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - key range upperBound inclusieve", function (done) {
        var expect = 2, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(KeyRange.upperBound(5, false));
                        deleteRequest.onsuccess = function (e){
                            assert.equal(e.target.result, undefined, "Data deleted");
                            ct++;

                            var countRequest = objectstore.count(KeyRange.upperBound(5, false));

                            countRequest.onsuccess = function (e){
                                assert.equal(e.target.result, 0, "Data deleted");
                                ct++;

                            };
                            countRequest.onerror = function (e){
                                assert.ok(false, "Count error");
                            };
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Delete error");
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - key range only", function (done) {
        var expect = 2, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(KeyRange.only(1));
                        deleteRequest.onsuccess = function (e){
                            assert.equal(e.target.result, undefined, "Data deleted");
                            ct++;

                            var countRequest = objectstore.count(KeyRange.only(1));

                            countRequest.onsuccess = function (e){
                                assert.equal(e.target.result, 0, "Data deleted");
                                ct++;

                            };
                            countRequest.onerror = function (e){
                                assert.ok(false, "Count error");
                            };
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Delete error");
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - key range between", function (done) {
        var expect = 2, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(KeyRange.bound(1,5, false, false));
                        deleteRequest.onsuccess = function (e){
                            assert.equal(e.target.result, undefined, "Data deleted");
                            ct++;

                            var countRequest = objectstore.count(KeyRange.bound(1,5, false, false));

                            countRequest.onsuccess = function (e){
                                assert.equal(e.target.result, 0, "Data deleted");
                                ct++;

                            };
                            countRequest.onerror = function (e){
                                assert.ok(false, "Count error");
                            };
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Delete error");
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - key invalid", function (done) {
        var expect = 1, ct = 0;
        var key = 1;

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(function(){});
                        deleteRequest.onsuccess = function (e){
                            assert.ok(false, "Data deleted");
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.equal(ex.name, "DataError", ex.name);
                        ct++;
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - no key", function (done) {
        var expect = 1, ct = 0;
        var key = 1;

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete();
                        deleteRequest.onsuccess = function (e){
                            assert.ok(false, "Data deleted");
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "Delete error");
                        };
                    }
                    catch (ex){
                        assert.equal(ex.name, "DataError", ex.name);
                        ct++;
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.equal(err.error.name, "AbortError", "AbortError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction error");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    it("Deleting data - ReadOnly transaction", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readonly");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var deleteRequest = objectstore.delete(1);
                        deleteRequest.onsuccess = function (e){
                            assert.ok(false, "data deleted");
                        };
                        deleteRequest.onerror = function (e){
                            assert.ok(false, "delete error");
                        };
                    }
                    catch (ex){
                        assert.equal(ex.name, "ReadOnlyError", "ReadOnlyError");
                        ct++;
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        assert.ok(false, "Transaction abort");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(false, "Transaction exception");
                    e.target.result.close();
                    done();
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });
    // TODO Add test with indexes check if data is present
});

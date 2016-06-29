require('./setup')
var assert = require('assert')

/**
 * Created by Kristof on 16/10/2015.
 */

describe("Objectstore - Count", function () {

    it("Counting data - Count all", function (done) {
        var expect = 1, ct = 0;
        var key = 1;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var countRequest = objectstore.count();
                        countRequest.onsuccess = function (e){
                            assert.equal(e.target.result, 10, "Count");
                            ct++;
                        };
                        countRequest.onerror = function (e){
                            assert.ok(false, "Count error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Count error");
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
    it("Counting data - key range lowerBound exclusieve", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var countRequest = objectstore.count(KeyRange.lowerBound(5, true));
                        countRequest.onsuccess = function (e){
                            assert.deepEqual(e.target.result, 5, "Count");
                            ct++;
                        };
                        countRequest.onerror = function (e){
                            assert.ok(false, "Count error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Count error");
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
    it("Counting data - key range lowerBound inclusieve", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var countRequest = objectstore.count(KeyRange.lowerBound(5));
                        countRequest.onsuccess = function (e){
                            assert.deepEqual(e.target.result, 6, "Count");
                            ct++;
                        };
                        countRequest.onerror = function (e){
                            assert.ok(false, "Count error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Count error");
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
    it("Counting data - key range upperBound exclusieve", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var countRequest = objectstore.count(KeyRange.upperBound(5, true));
                        countRequest.onsuccess = function (e){
                            assert.deepEqual(e.target.result, 4, "Count");
                            ct++;
                        };
                        countRequest.onerror = function (e){
                            assert.ok(false, "Count error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Count error");
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
    it("Counting data - key range upperBound inclusieve", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var countRequest = objectstore.count(KeyRange.upperBound(5, false));
                        countRequest.onsuccess = function (e){
                            assert.deepEqual(e.target.result, 5, "Count");
                            ct++;
                        };
                        countRequest.onerror = function (e){
                            assert.ok(false, "Count error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Count error");
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
    it("Counting data - key range only", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var countRequest = objectstore.count(KeyRange.only(1));
                        countRequest.onsuccess = function (e){
                            assert.deepEqual(e.target.result, 1, "Count");
                            ct++;
                        };
                        countRequest.onerror = function (e){
                            assert.ok(false, "Count error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Count error");
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
    it("Counting data - key range between", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var countRequest = objectstore.count(KeyRange.bound(1,5, false, false));
                        countRequest.onsuccess = function (e){
                            assert.deepEqual(e.target.result, 5, "Count");
                            ct++;
                        };
                        countRequest.onerror = function (e){
                            assert.ok(false, "Count error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Count error");
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
    it("Counting data - non key range", function (done) {
        var expect = 1, ct = 0;
        var key = 1;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var countRequest = objectstore.count(2);
                        countRequest.onsuccess = function (e){
                            assert.equal(e.target.result, 1, "Count");
                            ct++;
                        };
                        countRequest.onerror = function (e){
                            assert.ok(false, "Count error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Count error");
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
    it("Retrieving data - key invalid", function (done) {
        var expect = 1, ct = 0;
        var key = 1;

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var countRequest = objectstore.count(function(){});
                        countRequest.onsuccess = function (e){
                            assert.ok(false, "Data counted");
                        };
                        countRequest.onerror = function (e){
                            assert.ok(false, "Count error");
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
});

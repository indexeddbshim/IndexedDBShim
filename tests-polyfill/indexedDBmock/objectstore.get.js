describe('Objectstore - Get', function() {
    it("Retrieving data - no data present for key", function (done) {
        var key = 1;

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(key);
                        getRequest.onsuccess = function (e){
                            equal(e.target.result, undefined, "Data undefined");
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.error.name, "AbortError", "AbortError");
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

    it("Retrieving data - external key", function (done) {
        initionalSituationObjectStoreNoAutoIncrementWithData(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(addData.id);
                        getRequest.onsuccess = function (e){
                            deepEqual(e.target.result, addData, "Data undefined");
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.error.name, "AbortError", "AbortError");
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

    it("Retrieving data - internal key", function (done) {
        initionalSituationObjectStoreWithKeyPathAndData(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(addData.id);
                        getRequest.onsuccess = function (e){
                            deepEqual(e.target.result, addData, "Data undefined");
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.error.name, "AbortError", "AbortError");
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

    it("Retrieving data - key range lowerBound exclusive", function (done) {
        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(KeyRange.lowerBound(5, true));
                        getRequest.onsuccess = function (e){
                            deepEqual(e.target.result, addData6, "Data");
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.error.name, "AbortError", "AbortError");
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

    it("Retrieving data - key range lowerBound inclusieve", function (done) {
        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(KeyRange.lowerBound(5));
                        getRequest.onsuccess = function (e){
                            deepEqual(e.target.result, addData5, "Data");
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.error.name, "AbortError", "AbortError");
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

    it("Retrieving data - key range upperBound", function (done) {
        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(KeyRange.upperBound(5));
                        getRequest.onsuccess = function (e){
                            deepEqual(e.target.result, addData, "No data Data");
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.error.name, "AbortError", "AbortError");
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

    it("Retrieving data - key range upperBound exclusieve", function (done) {
        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(KeyRange.upperBound(1, true));
                        getRequest.onsuccess = function (e){
                            deepEqual(e.target.result, undefined, "No data Data");
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.error.name, "AbortError", "AbortError");
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

    it("Retrieving data - key range upperBound inclusieve", function (done) {
        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(KeyRange.upperBound(1, false));
                        getRequest.onsuccess = function (e){
                            deepEqual(e.target.result, addData, "Data");
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
                    }

                    transaction.oncomplete = function (e){
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
    it("Retrieving data - key range only", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(KeyRange.only(1));
                        getRequest.onsuccess = function (e){
                            assert.deepEqual(e.target.result, addData, "Data");
                            ct++;
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
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
    it("Retrieving data - key range between", function (done) {
        var expect = 1, ct = 0;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(KeyRange.bound(1,5, false, false));
                        getRequest.onsuccess = function (e){
                            assert.deepEqual(e.target.result, addData, "Data");
                            ct++;

                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Get error");
                    }

                    transaction.oncomplete = function (e){
                        equal(ct, expect, "Expected test count");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.error.name, "AbortError", "AbortError");
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
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var getRequest = objectstore.get(function(){});
                        getRequest.onsuccess = function (e){
                            assert.ok(false, "Data retrieved");
                        };
                        getRequest.onerror = function (e){
                            assert.ok(false, "Get error");
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

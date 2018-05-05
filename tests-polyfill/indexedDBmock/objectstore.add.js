describe('Objectstore - Add', function() {
    it("Adding data", function (done) {
        var data = { test: "test" };

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);
                        addRequest.onsuccess = function (e){
                            assert.ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "Add error");
                        };
                    }
                    catch (ex){
                        equal(ex.name, "DataError", "DataError");
                    }

                    transaction.oncomplete = function (e){
                        assert.ok(true, "Transaction complete");
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

    it("Adding data with external key", function (done) {
        var data = { test: "test" };
        var key = 1;

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data, key);

                        addRequest.onsuccess = function (e){
                            assert.ok(true, "data added");
                            equal(e.target.result, key, "Key ok");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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

    it("Adding data - objectstore autoincrement", function (done) {
        var data = { test: "test" };
        initionalSituationObjectStoreWithAutoIncrement(function () {
    		var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);

                        addRequest.onsuccess = function (e){
                            assert.ok(true, "data added");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "add exception");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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

    it("Adding data with external key - objectstore autoincrement", function (done) {
    	var data = { test: "test" };
    	var key = 1;
    	initionalSituationObjectStoreWithAutoIncrement(function () {
    		var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data, key);

                        addRequest.onsuccess = function (e){
                            assert.ok(true, "data added");
                            equal(e.target.result, key, "Key ok");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction exception");
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

    it("Adding data with external key (increase autoincrement) - objectstore autoincrement", function (done) {
    	var data = { test: "test" };
    	initionalSituationObjectStoreWithAutoIncrement(function () {
    		var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);

                        addRequest.onsuccess = function (e){
                            assert.ok(true, "data added");
                            var key = e.target.result;

    						try{
    							var addRequest2 = objectstore.add(data, (key + 3));

    							addRequest2.onsuccess = function (e){
    								equal(e.target.result, (key + 3), "Key same as provided");
                                    try{
                                        var addRequest3 = objectstore.add(data);

                                        addRequest3.onsuccess = function (e){
                                            equal(e.target.result, (key + 4), "Key increased after add with provided key");
                                        };
                                        addRequest3.onerror = function (e){
                                            assert.ok(false, "add error");
                                        };
                                    }
                                    catch (ex){
                                        assert.ok(false, "add exception");
                                    }
    							};
    							addRequest2.onerror = function (e){
    								assert.ok(false, "add error");
    							};
    						}
    						catch (ex){
    							assert.ok(false, "add exception");
    						}
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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

    it("Adding data - objectstore keyPath", function (done) {
    	var data = { test: "test" };
    	initionalSituationObjectStoreWithKeyPathNoAutoIncrement(function () {
    		var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);

                        addRequest.onsuccess = function (e){
                            assert.ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "Add error");
                        };
                    }
                    catch (ex){
                        equal(ex.name, "DataError", "DataError");
                    }

                    transaction.oncomplete = function (e){
                        assert.ok(true, "Transaction complete");
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

    it("Adding data with inline key - objectstore keyPath", function (done) {
        var data = { test: "test", id: 1 };
        initionalSituationObjectStoreWithKeyPathNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);

                        addRequest.onsuccess = function (e){
                            assert.ok(true, "data added");
                            equal(e.target.result, data.id, "Key same as provided");
                        };
                        addRequest.onerror = function (e){
                        assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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

    it("Adding data with external key - objectstore keyPath", function (done) {
        var data = { test: "test" };
        var key = 1;
        initionalSituationObjectStoreWithKeyPathNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data, key);

                        addRequest.onsuccess = function (e){
                            assert.ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        equal(ex.name, "DataError", "DataError");
                    }

                    transaction.oncomplete = function (e){
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

    it("Adding data - objectstore keyPath autoincrement", function (done) {
        var data = { test: "test" };
        initionalSituationObjectStoreWithKeyPathAndAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);

                        addRequest.onsuccess = function (e){
                            assert.ok(true, "data added");
                            assert.equal(e.target.result, 1, "Key same as provided");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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

    it("Adding data with inline key - objectstore keyPath autoincrement", function (done) {
        var data = { test: "test", id:2 };
        initionalSituationObjectStoreWithKeyPathAndAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);

                        addRequest.onsuccess = function (e){
                            ok(true, "data added");
                            equal(e.target.result, data.id, "Key set by autoincrement");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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

    it("Adding data with external key - objectstore keyPath autoincrement", function (done) {
        var data = { test: "test" };
        var key = 1;
        initionalSituationObjectStoreWithKeyPathAndAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data, key);

                        addRequest.onsuccess = function (e){
                            ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            ok(false, "data error");
                        };
                    }
                    catch (ex){
                        equal(ex.name, "DataError", "DataError");
                    }

                    transaction.oncomplete = function (e){
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

    it("Adding data with existing external key", function (done) {
        initionalSituationObjectStoreNoAutoIncrementWithData(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(addData, addData.id);

                        addRequest.onsuccess = function (e){
                            ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            equal(e.target.error.name, "ConstraintError", "ConstraintError");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.target.error.name, "ConstraintError", "ConstraintError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (err){
                        equal(err.target.error.name, "ConstraintError", "ConstraintError");
                        //**/e.target.result.close();
                        //done();
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

    it("Adding data with existing internal key", function (done) {
        initionalSituationObjectStoreWithKeyPathAndDataNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(addData);

                        addRequest.onsuccess = function (e){
                            ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            equal(e.target.error.name, "ConstraintError", "ConstraintError");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.target.error.name, "ConstraintError", "ConstraintError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (err){
                        equal(err.target.error.name, "ConstraintError", "ConstraintError");
                        //e.target.result.close();
                        //done();
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

    it("Adding data with invalid key", function (done) {
        var data = { test: "test" };

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data, data);

                        addRequest.onsuccess = function (e){
                            ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "Add error");
                        };
                    }
                    catch (ex){
                        equal(ex.name, "DataError", "DataError");
                    }

                    transaction.oncomplete = function (e){
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

    it("Adding data with external key - string", function (done) {
        var data = { test: "test" };
        var key = "key";

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data, key);

                        addRequest.onsuccess = function (e){
                            ok(true, "data added");
                            equal(e.target.result, key, "Key ok");
                        };
                        addRequest.onerror = function (e){
                            ok(false, "add error");
                        };
                    }
                    catch (ex){
                        ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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

    it("Adding data with external key - array", function (done) {
        var data = { test: "test" };
        var key = [1,2,3];

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data, key);

                        addRequest.onsuccess = function (e){
                            ok(true, "data added");
                            deepEqual(e.target.result, key, "Key ok");
                        };
                        addRequest.onerror = function (e){
                            ok(false, "add error");
                        };
                    }
                    catch (ex){
                        ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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

    it("Adding data with inline key - string", function (done) {
        var data = { test: "test", id: "key" };
        initionalSituationObjectStoreWithKeyPathNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);

                        addRequest.onsuccess = function (e){
                            ok(true, "data added");
                            equal(e.target.result, data.id, "Key same as provided");
                        };
                        addRequest.onerror = function (e){
                        assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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
                assert.ok(false, "Database exception");
                done();
            };
        }, done, assert);
        });

    it("Adding data with inline key - date", function (done) {
        var data = { test: "test", id: new Date() };
        initionalSituationObjectStoreWithKeyPathNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);

                        addRequest.onsuccess = function (e){
                            ok(true, "data added");
                            deepEqual(e.target.result, data.id, "Key same as provided");
                        };
                        addRequest.onerror = function (e){
                        assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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
                assert.ok(false, "Database exception");
                done();
            };
        }, done, assert);
        });

    it("Adding data with inline key - array", function (done) {
        var data = { test: "test", id: [1,2,3] };
        initionalSituationObjectStoreWithKeyPathNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data);

                        addRequest.onsuccess = function (e){
                            ok(true, "data added");
                            deepEqual(e.target.result, data.id, "Key same as provided");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "add error");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(false, "Transaction aborted");
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

    it("Adding data - ReadOnly transaction", function (done) {
        var data = { test: "test" };
        var key = "key";

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readonly");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data, key);

                        addRequest.onsuccess = function (e){
                            ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "Add error");
                        };
                    }
                    catch (ex){
                        equal(ex.name, "ReadOnlyError", "ReadOnlyError");
                    }

                    transaction.oncomplete = function (e){
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

    it("Adding data - DataCloneError", function (done) {
        var data = { test: "test", toString () {
                                                return true;
                                            }
                    };
        var key = "key";

        initionalSituationObjectStoreNoAutoIncrement(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(data, key);

                        addRequest.onsuccess = function (e){
                            assert.ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            assert.ok(false, "Add error");
                        };
                    }
                    catch (ex){
                        equal(ex.name, "DataCloneError", "DataCloneError");
                    }

                    transaction.oncomplete = function (e){
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

    it("Adding data with existing index key - unique index", function (done) {
        initionalSituationIndexUniqueIndexWithData(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(addData, addData.id + 1);

                        addRequest.onsuccess = function (e){
                            assert.ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            equal(e.target.error.name, "ConstraintError", "ConstraintError");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.target.error.name, "ConstraintError", "ConstraintError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (err){
                        equal(err.target.error.name, "ConstraintError", "ConstraintError");
                        //e.target.result.close();
                        //done();
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

    it("Adding data with existing index key - unique multientry index", function (done) {
        initionalSituationIndexUniqueMultiEntryIndexWithData(function () {
            var request = indexedDB.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    var objectstore = transaction.objectStore(objectStoreName);

                    try{
                        var addRequest = objectstore.add(addData, addData.id + 1);

                        addRequest.onsuccess = function (e){
                            assert.ok(false, "data added");
                        };
                        addRequest.onerror = function (e){
                            equal(e.target.error.name, "ConstraintError", "ConstraintError");
                        };
                    }
                    catch (ex){
                        assert.ok(false, "Add exception");
                    }

                    transaction.oncomplete = function (e){
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (err){
                        equal(err.target.error.name, "ConstraintError", "ConstraintError");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (err){
                        equal(err.target.error.name, "ConstraintError", "ConstraintError");
                        //e.target.result.close();
                        //done();
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
    // TODO: test adding data to a deleted objectstore

    // TODO Add test with indexes check if data is present
});

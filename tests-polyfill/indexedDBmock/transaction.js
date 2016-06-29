require('./setup')
var assert = require('assert')

describe("Transaction", function() {
    it("Opening transaction", function (done) {
        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName]);
                    assert.ok(true, "Transaction open");
                    assert.equal(transaction.mode, "readonly", "readonly");

                    transaction.oncomplete = function (e){
                        assert.ok(true, "Transaction commited");
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
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });

    it("Opening readonly transaction", function (done) {
        var mode = "readonly";

        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName]);
                    assert.ok(true, "Transaction open");
                    assert.equal(transaction.mode, mode, mode);

                    transaction.oncomplete = function (e){
                        assert.ok(true, "Transaction commited");
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
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });

    it("Opening readwrite transaction", function (done) {
        var mode = "readwrite";

        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], mode);
                    assert.ok(true, "Transaction open");
                    assert.equal(transaction.mode, mode, mode);

                    transaction.oncomplete = function (e){
                        assert.ok(true, "Transaction commited");
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
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });

    it("Aborting transaction", function (done) {
        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName]);
                    assert.ok(true, "Transaction open");

                    transaction.oncomplete = function (e){
                        assert.ok(false, "Transaction commited");
                        e.target.db.close();
                        done();
                    };
                    transaction.onabort = function (){
                        assert.ok(true, "Transaction aborted");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };
                    transaction.abort();
                }
                catch (ex) {
                    assert.equal(ex.type, "InvalidAccessError", ex.message);
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

    it("Opening transaction - without objectStore", function (done) {
        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([]);
                    assert.ok(false, "Transaction open");

                    transaction.oncomplete = function (e){
                        assert.ok(false, "Transaction commited");
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
                    assert.equal(ex.name, "InvalidAccessError", "InvalidAccessError");
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

    it("Opening transaction - non existing objectStore", function (done) {
        var anOtherObjectStore = "anOtherObjectStore";
        initionalSituation(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([anOtherObjectStore]);
                    assert.ok(false, "Transaction open");

                    transaction.oncomplete = function (e){
                        assert.ok(false, "Transaction commited");
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
                    assert.equal(ex.name, "NotFoundError", "NotFoundError");
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
    // TODO: Test concurrent transactions
    it("Opening 2 readonly transaction with seperate scope", function (done) {
        var expect = 4, ct = 0;
        var mode = "readonly";
        var firstTransactionCommited = false;

        initionalSituation2ObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName]);
                    assert.ok(true, "Transaction open");
                    var transaction2 = e.target.result.transaction([anOtherObjectStoreName]);
                    assert.ok(true, "Second transaction open");
                    ct += 2;

                    transaction.oncomplete = function (e){
                        assert.ok(true, "Transaction commited");
                        ct++;
                        e.target.db.close();
                        if(firstTransactionCommited){
                            equal(ct, expect, "Expected test count");
                            done();
                        }
                        else{
                            firstTransactionCommited = true;
                        }
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

                    transaction2.oncomplete = function (e){
                        assert.ok(true, "Second Transaction commited");
                        ct++;
                        e.target.db.close();
                        if(firstTransactionCommited){
                            equal(ct, expect, "Expected test count");
                            done();
                        }
                        else{
                            firstTransactionCommited = true;
                        }
                    };
                    transaction2.onabort = function (){
                        assert.ok(false, "Second Transaction aborted");
                        e.target.result.close();
                        done();
                    };
                    transaction2.onerror = function (){
                        assert.ok(false, "Second Transaction error");
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
    it("Opening 2 readonly transaction with same scope", function (done) {
        var expect = 4, ct = 0;
        var mode = "readonly";
        var firstTransactionCommited = false;

        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName]);
                    assert.ok(true, "Transaction open");
                    var transaction2 = e.target.result.transaction([objectStoreName]);
                    assert.ok(true, "Second transaction open");
                    ct += 2;

                    transaction.oncomplete = function (e){
                        assert.ok(true, "Transaction commited");
                        ct++;
                        e.target.db.close();
                        if(firstTransactionCommited){
                            equal(ct, expect, "Expected test count");
                            done();
                        }
                        else{
                            firstTransactionCommited = true;
                        }
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

                    transaction2.oncomplete = function (e){
                        assert.ok(true, "Second Transaction commited");
                        ct++;
                        e.target.db.close();
                        if(firstTransactionCommited){
                            equal(ct, expect, "Expected test count");
                            done();
                        }
                        else{
                            firstTransactionCommited = true;
                        }
                    };
                    transaction2.onabort = function (){
                        assert.ok(false, "Second Transaction aborted");
                        e.target.result.close();
                        done();
                    };
                    transaction2.onerror = function (){
                        assert.ok(false, "Second Transaction error");
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
    it("Opening 2 write transaction with seperate scope", function (done) {
        var expect = 4, ct = 0;
        var mode = "readwrite";
        var firstTransactionCommited = false;

        initionalSituation2ObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], mode);
                    assert.ok(true, "Transaction open");
                    var transaction2 = e.target.result.transaction([anOtherObjectStoreName], mode);
                    assert.ok(true, "Second transaction open");
                    ct += 2;

                    transaction.oncomplete = function (e){
                        assert.ok(true, "Transaction commited");
                        ct++;
                        e.target.db.close();
                        if(firstTransactionCommited){
                            equal(ct, expect, "Expected test count");
                            done();
                        }
                        else{
                            firstTransactionCommited = true;
                        }
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

                    transaction2.oncomplete = function (e){
                        assert.ok(true, "Second Transaction commited");
                        e.target.db.close();
                        ct++;
                        if(firstTransactionCommited){
                            equal(ct, expect, "Expected test count");
                            done();
                        }
                        else{
                            firstTransactionCommited = true;
                        }
                    };
                    transaction2.onabort = function (){
                        assert.ok(false, "Second Transaction aborted");
                        e.target.result.close();
                        done();
                    };
                    transaction2.onerror = function (){
                        assert.ok(false, "Second Transaction error");
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
    /*it("Opening 2 write transaction with same scope", function (done) {
        var expect = 4, ct = 0;
        var mode = "readwrite";
        var firstTransactionCommited = false;

        initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], mode);
                    assert.ok(true, "Transaction open");
                    var transaction2 = e.target.result.transaction([objectStoreName], mode);
                    assert.ok(true, "Second transaction open");
                    ct += 2;

                    var objectStore2 = transaction2.objectStore(objectStoreName);
                    var addRequest2 = objectStore2.add({ id: 998});

                    var objectStore = transaction.objectStore(objectStoreName);
                    var addRequest = objectStore.add({ id: 999});

                    addRequest.onsuccess = function(args){
                        assert.ok(true, "keep first transaction open");
                        var d = new Date(Date.now() + 2 * 1000);
                        while(Date.now() < d){
                            // thread sleep
                        };
                    };

                    addRequest.onerror = function(args){
                        assert.ok(false, "first transaction error");
                    };
                    addRequest2.onsuccess = function(args){
                        assert.ok(false, "keep second transaction open");
                    };
                    addRequest2.onerror = function(args){
                        assert.ok(true, "second transaction error");
                    };

                    transaction.oncomplete = function (e){
                        assert.ok(true, "Transaction commited");
                        ct++;
                        e.target.db.close();
                        if(firstTransactionCommited){
                            equal(ct, expect, "Expected test count");
                            done();
                        }
                        else{
                            firstTransactionCommited = true;
                        }
                    };
                    transaction.onabort = function (e){
                        assert.ok(false, "Transaction aborted");
                        e.target.result.close();
                        done();
                    };
                    transaction.onerror = function (e){
                        assert.ok(false, "Transaction error");
                        e.target.result.close();
                        done();
                    };

                    transaction2.oncomplete = function (e){
                        assert.ok(false, "Second Transaction commited");
                        e.target.db.close();
                        ct++;
                        if(firstTransactionCommited){
                            equal(ct, expect, "Expected test count");
                            done();
                        }
                        else{
                            firstTransactionCommited = true;
                        }
                    };
                    transaction2.onabort = function (){
                        assert.ok(false, "Second Transaction aborted");
                        e.target.result.close();
                        done();
                    };
                    transaction2.onerror = function (){
                        assert.ok(false, "Second Transaction error");
                        e.target.result.close();
                        done();
                    };
                }
                catch (ex) {
                    assert.ok(true, "Transaction error");
                    e.target.result.close();
                    if(firstTransactionCommited){
                        done();
                    }
                    else{
                        firstTransactionCommited = true;
                    }
                }
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });*/
    // TODO: Test isolation of scopes
});

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
                    assert.equal(ex.type, "InvalidAccessError", transArgs.message);
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
});

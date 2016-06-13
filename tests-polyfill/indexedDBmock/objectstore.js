require('./setup')
var assert = require('assert')

describe('ObjectStores', function() {
    it("Creating ObjectStore", function (done) {
        initionalSituation(function () {
            var request = indexedDb.open(dbName, 1);
            request.onsuccess = function(e){
                for(var i = 0; i < e.target.result.objectStoreNames.length; i++) {
                    if (e.target.result.objectStoreNames[i] === objectStoreName) {
                        assert.ok(true, "Object store present");
                    }
                }
                e.target.result.close();
                done();
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
            request.onupgradeneeded = function(e){
                if (e.type == "upgradeneeded") {
                    try {
                        var objectStore = e.target.transaction.db.createObjectStore(objectStoreName);
                        assert.ok(true, "Object store created");
                        assert.equal(objectStore.name, objectStoreName, objectStoreName);
                    }
                    catch (ex) {
                        assert.ok(false, "Creating object store failed");
                    }
                }
            };
        }, done, assert);
    });

    it("Creating ObjectStore with options", function (done) {
        var keyPath = "Id";
        var autoIncrement = true;
        initionalSituation(function () {
            var request = indexedDb.open(dbName, 1);
            request.onsuccess = function(e){
                for(var i = 0; i < e.target.result.objectStoreNames.length; i++) {
                    if (e.target.result.objectStoreNames[i] === objectStoreName) {
                        assert.ok(true, "Object store present");
                    }
                }
                e.target.result.close();
                done();
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
            request.onupgradeneeded = function(e){
                if (e.type == "upgradeneeded") {
                    try {
                        var objectStore = e.target.transaction.db.createObjectStore(objectStoreName, { keyPath: keyPath, autoIncrement: autoIncrement });
                        assert.ok(true, "Object store created");
                        assert.equal(objectStore.name, objectStoreName, "Object store name");
                        assert.equal(objectStore.keyPath, keyPath, "Object store keyPath");
                        if(objectStore.autoIncrement){
                            assert.equal(objectStore.autoIncrement, autoIncrement, "Object store autoIncrement");
                        }
                        else{
                            assert.ok(true, "IE implementation doesn't expose the autoIncrement field yet");
                        }

                    }
                    catch (ex) {
                        assert.ok(false, "Creating object store failed");
                    }
                }
            };
        }, done, assert);
    });

    it("Creating ObjectStore in readwrite transaction", function (done) {
        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName, 1);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    try {
                        var objectStore = transaction.db.createObjectStore(objectStoreName);
                        assert.ok(false, "Object store created");
                        e.target.result.close();
                        done();
                    }
                    catch (ex) {
                        assert.equal(ex.name, "InvalidStateError", "InvalidStateError");
                        e.target.result.close();
                        done();
                    }

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

    it("Creating ObjectStore with autoIncrement and array with empty string as keyPath", function (done) {
        initionalSituation(function () {
            var request = indexedDb.open(dbName, 1);
            request.onsuccess = function(e){
                for(var i = 0; i < e.target.result.objectStoreNames.length; i++) {
                    if (e.target.result.objectStoreNames[i] === objectStoreName) {
                        assert.ok(false, "Object store present");
                    }
                }
                e.target.result.close();
                done();
            };
            request.onerror = function(e){
                //assert.equal(e.error.name, "AbortError", "AbortError");
                done();
            };
            request.onupgradeneeded = function(e){
                if (e.type == "upgradeneeded") {
                    try {
                        var objectStore = e.target.transaction.db.createObjectStore(objectStoreName, { keyPath: [""], autoIncrement: true });
                        assert.ok(false, "Object store created");
                    }
                    catch (ex) {
                        assert.equal(ex.name, "InvalidAccessError", "InvalidAccessError");
                    }
                }
            };
        }, done, assert);
    });

    it("Opening ObjectStore", function (done) {
        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName]);
                    var objectstore = transaction.objectStore(objectStoreName);

                    if(objectstore){
                        assert.ok(true, "Object store open");
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
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });

    it("Opening non existing ObjectStore", function (done) {
        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName]);
                    try {
                        var objectstore = transaction.objectStore("anOtherObjectStore");

                        if(objectstore){
                            assert.ok(false, "Object store open");
                        }
                    }
                    catch(ex){
                        assert.equal(ex.name, "NotFoundError", "NotFoundError");
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
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });

    it("Opening ObjectStore not in transaction scope", function (done) {
        initionalSituation2ObjectStore(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName]);
                    try {
                        var objectstore = transaction.objectStore(anOtherObjectStoreName);

                        if(objectstore){
                            assert.ok(false, "Object store open");
                        }
                    }
                    catch(ex){
                        assert.equal(ex.name, "NotFoundError", "NotFoundError");
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
                assert.ok(false, "Database error");
                done();
            };
        }, done, assert);
    });

    it("Deleting ObjectStore", function (done) {
        initionalSituationObjectStore(function () {
            // Delete database if existing
            var request = indexedDb.open(dbName, 2);
            request.onsuccess = function(e){
                for(var i = 0; i < e.target.result.objectStoreNames.length; i++) {
                    if (e.target.result.objectStoreNames[i] === objectStoreName) {
                        assert.ok(false, "Object store present");
                    }
                }
                e.target.result.close();
                done();
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
            request.onupgradeneeded = function(e){
                if (e.type == "upgradeneeded") {
                    try {
                        var objectStore = e.target.transaction.db.deleteObjectStore(objectStoreName);
                        assert.ok(true, "Object store deleted");
                    }
                    catch (ex) {
                        assert.ok(false, "Deleting object store failed");
                    }
                }
            };
        }, done, assert);
    });

    it("Deleting Non existing objectStore", function (done) {
        initionalSituation(function () {
            // Delete database if existing
            var request = indexedDb.open(dbName, 2);
            request.onsuccess = function(e){
                for(var i = 0; i < e.target.result.objectStoreNames.length; i++) {
                    if (e.target.result.objectStoreNames[i] === objectStoreName) {
                        assert.ok(false, "Object store present");
                    }
                }
                e.target.result.close();
                done();
            };
            request.onerror = function(){
                assert.ok(false, "Database error");
                done();
            };
            request.onupgradeneeded = function(e){
                if (e.type == "upgradeneeded") {
                    try {
                        var objectStore = e.target.transaction.db.deleteObjectStore(objectStoreName);
                        assert.ok(false, "Object store deleted");
                    }
                    catch (ex) {
                        assert.equal(ex.name, "NotFoundError", "NotFoundError");
                    }
                }
            };
        }, done, assert);
    });

    it("Deleting ObjectStore in readwrite transaction", function (done) {
        initionalSituationObjectStore(function () {
            var request = indexedDb.open(dbName, 1);
            request.onsuccess = function(e){
                try{
                    var transaction = e.target.result.transaction([objectStoreName], "readwrite");
                    try {
                        var objectStore = transaction.db.deleteObjectStore(objectStoreName);
                        assert.ok(false, "Object store created");
                        e.target.result.close();
                        done();
                    }
                    catch (ex) {
                        assert.equal(ex.name, "InvalidStateError", "InvalidStateError");
                        e.target.result.close();
                        done();
                    }

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
});

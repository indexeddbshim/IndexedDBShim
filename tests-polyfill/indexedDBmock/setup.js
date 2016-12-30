global.ok = assert.ok
global.equal = assert.equal
global.deepEqual = assert.deepEqual

global.KeyRange = IDBKeyRange;
global.dbName = "test_database.sqlite";
global.objectStoreName = "objectStore";
global.anOtherObjectStoreName = "anOtherObjectStoreName";
global.indexProperty = "name";
global.indexPropertyMultiEntry = "multiEntry";
global.addData = { test: "addData", name: "name", id: 1, multiEntry: [1, "test", new Date()] };
global.addData2 = { test: "addData2", name: "name2", id: 2 };
global.addData3 = { test: "addData3", name: "name3", id: 3 };
global.addData4 = { test: "addData4", name: "name4", id: 4 };
global.addData5 = { test: "addData5", name: "name5", id: 5 };
global.addData6 = { test: "addData6", name: "name6", id: 6 };
global.addData7 = { test: "addData7", name: "name7", id: 7 };
global.addData8 = { test: "addData8", name: "name8", id: 8 };
global.addData9 = { test: "addData9", name: "name9", id: 9 };
global.addData10 = { test: "addData10", name: "name10", id: 10 };
global.msgCreatingInitialSituationFailed = "Creating initial situation failed";

global.initionalSituation = function(callBack, done, assert) {
    var request = indexedDB.deleteDatabase(dbName);

    request.onsuccess = function(){
        callBack();
    };
    request.onerror = function(){
        assert.ok(false, msgCreatingInitialSituationFailed);
        done();
    };
}
global.initionalSituationDatabase = function(callBack, done, assert) {
    initionalSituation(function(){
        var request = indexedDB.open(dbName);
        request.onsuccess = function(e){
            e.target.result.close();
            callBack();
        };
        request.onerror = function(){
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
    }, done, assert);
}
global.initionalSituationDatabaseVersion = function(callBack, done, assert) {
    initionalSituation(function(){
        var request = indexedDB.open(dbName, 2);
        request.onsuccess = function(e){
            e.target.result.close();
            callBack();
        };
        request.onerror = function(){
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
    }, done, assert);
}
global.initionalSituationObjectStore = function(callBack, done, assert) {
    initionalSituation(function(){
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e){
            e.target.result.close();
            callBack();
        };
        request.onerror = function(){
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e){
            if (e.type == "upgradeneeded") {
                try {
                    e.target.transaction.db.createObjectStore(objectStoreName);
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituation2ObjectStore = function(callBack, done, assert) {
    initionalSituation(function(){
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e){
            e.target.result.close();
            callBack();
        };
        request.onerror = function(){
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e){
            if (e.type == "upgradeneeded") {
                try {
                    e.target.transaction.db.createObjectStore(objectStoreName);
                    e.target.transaction.db.createObjectStore(anOtherObjectStoreName);
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationObjectStoreNoAutoIncrement = function(callBack, done, assert) {
    initionalSituation(function() {
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function (e) {
            e.target.result.close();
            callBack();
        };
        request.onerror = function () {
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function (e) {
            if (e.type == "upgradeneeded") {
                try {
                    e.target.transaction.db.createObjectStore(objectStoreName, {autoIncrement: false});
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationObjectStoreWithAutoIncrement = function(callBack, done, assert) {
    initionalSituation(function() {
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e) {
            e.target.result.close();
            callBack();
        };
        request.onerror = function() {
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e) {
            if (e.type == "upgradeneeded") {
                try {
                    e.target.transaction.db.createObjectStore(objectStoreName, { autoIncrement: true });
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationObjectStoreWithKeyPathNoAutoIncrement = function(callBack, done, assert) {
    initionalSituation(function() {
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e) {
            e.target.result.close();
            callBack();
        };
        request.onerror = function() {
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e) {
            if (e.type == "upgradeneeded") {
                try {
                    e.target.transaction.db.createObjectStore(objectStoreName, {keyPath: "id", autoIncrement: false});
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationObjectStoreWithKeyPathAndAutoIncrement = function(callBack, done, assert) {
    initionalSituation(function() {
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e) {
            e.target.result.close();
            callBack();
        };
        request.onerror = function() {
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e) {
            if (e.type == "upgradeneeded") {
                try {
                    e.target.transaction.db.createObjectStore(objectStoreName, {keyPath: "id", autoIncrement: true});
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationObjectStoreNoAutoIncrementWithData = function(callBack, done, assert) {
    initionalSituation(function() {
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function (e) {
            e.target.result.close();
            callBack();
        };
        request.onerror = function() {
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e) {
            if (e.type == "upgradeneeded") {
                try {
                    var objectstore = e.target.transaction.db.createObjectStore(objectStoreName, { autoIncrement: false });
                    objectstore.add(addData, addData.id);
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationObjectStoreWithKeyPathAndData = function(callBack, done, assert) {
    initionalSituation(function() {
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function (e) {
            e.target.result.close();
            callBack();
        };
        request.onerror = function() {
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e) {
            if (e.type == "upgradeneeded") {
                try {
                    var objectstore = e.target.transaction.db.createObjectStore(objectStoreName, { autoIncrement: false, keyPath: "id" });
                    objectstore.add(addData);
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationObjectStoreWithKeyPathAndDataNoAutoIncrement = function(callBack, done, assert) {
    initionalSituation(function() {
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e) {
            e.target.result.close();
            callBack();
        };
        request.onerror = function() {
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e) {
            if (e.type == "upgradeneeded") {
                try {
                    var objectstore = e.target.transaction.db.createObjectStore(objectStoreName, {keyPath: "id", autoIncrement: false});
                    objectstore.add(addData);
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationObjectStoreWithKeyPathAndMultipleDataNoAutoIncrement = function(callBack, done, assert) {
    initionalSituation(function() {
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e) {
            e.target.result.close();
            callBack();
        };
        request.onerror = function() {
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e) {
            if (e.type == "upgradeneeded") {
                try {
                    var objectstore = e.target.transaction.db.createObjectStore(objectStoreName, {keyPath: "id", autoIncrement: false});
                    objectstore.add(addData);
                    objectstore.add(addData2);
                    objectstore.add(addData3);
                    objectstore.add(addData4);
                    objectstore.add(addData5);
                    objectstore.add(addData6);
                    objectstore.add(addData7);
                    objectstore.add(addData8);
                    objectstore.add(addData9);
                    objectstore.add(addData10);
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationIndex = function(callBack, done, assert) {
    initionalSituation(function(){
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e){
            e.target.result.close();
            callBack();
        };
        request.onerror = function(){
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e){
            if (e.type == "upgradeneeded") {
                try {
                    var objectstore = e.target.transaction.db.createObjectStore(objectStoreName);
                    objectstore.createIndex(indexProperty, indexProperty);
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationIndexUniqueIndexWithData = function(callBack, done, assert) {
    initionalSituation(function(){
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e){
            e.target.result.close();
            callBack();
        };
        request.onerror = function(){
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e){
            if (e.type == "upgradeneeded") {
                try {
                    var objectstore = e.target.transaction.db.createObjectStore(objectStoreName);
                    objectstore.createIndex(indexProperty, indexProperty, { unique: true });
                    objectstore.add(addData, addData.id);
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}
global.initionalSituationIndexUniqueMultiEntryIndexWithData = function(callBack, done, assert) {
    initionalSituation(function(){
        var request = indexedDB.open(dbName, 1);
        request.onsuccess = function(e){
            e.target.result.close();
            callBack();
        };
        request.onerror = function(){
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
        request.onupgradeneeded = function(e){
            if (e.type == "upgradeneeded") {
                try {
                    var objectstore = e.target.transaction.db.createObjectStore(objectStoreName);
                    objectstore.createIndex(indexPropertyMultiEntry, indexPropertyMultiEntry, { unique: true, multiEntry: true });
                    objectstore.add(addData, addData.id);
                }
                catch (ex) {
                    assert.ok(false, msgCreatingInitialSituationFailed);
                    done();
                }
            }
        };
    }, done, assert);
}

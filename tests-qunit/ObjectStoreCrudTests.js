/* eslint-disable no-var */
(function () {
    function onObjectStoreOpen (name, storeName, callback) {
        queuedAsyncTest(name, function (assert) {
            var done = assert.async();
            var dbOpenRequest = window.indexedDB.open(DB.NAME);
            dbOpenRequest.onsuccess = function (e) {
                _('Database opened successfully');
                assert.ok(true, 'Database Opened successfully');
                var db = dbOpenRequest.result;
                var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2, DB.OBJECT_STORE_3, DB.OBJECT_STORE_4], 'readwrite');
                var objectStore = transaction.objectStore(storeName);
                callback(objectStore, assert, done);
            };
            dbOpenRequest.onerror = function (e) {
                assert.ok(false, 'Database NOT Opened successfully');
                _('Database NOT opened successfully');
                nextTest();
                done();
            };
            dbOpenRequest.onblocked = function (e) {
                assert.ok(false, 'Opening database blocked');
                _('Opening database blocked');
                done();
            };
        });
    }

    queuedModule('ObjectStore CRUD');
    var key = sample.integer();
    var data = sample.obj();

    onObjectStoreOpen('Adding data to Object Store', DB.OBJECT_STORE_1, function (objectStore, assert, done) {
        var req = objectStore.add(data, key);
        req.onsuccess = function (e) {
            _('Data added to object Store successfully ' + key);
            assert.equal(key, req.result, 'Data added to Object store');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function (e) {
            _('Could not add data to database' + e.message);
            assert.ok(false, 'Could not add Data to ObjectStore1');
            nextTest();
            done();
        };
    });

    onObjectStoreOpen('Adding with keypath and autoInc, no key', DB.OBJECT_STORE_2, function (objectStore, assert, done) {
        var req = objectStore.add(sample.obj());
        req.onsuccess = function (e) {
            _('Data added to object Store successfully ' + req.result);
            assert.notEqual(null, req.result, 'Data added to Object store');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function (e) {
            _('Could not add data to database');
            assert.ok(false, 'Could not add Data to ObjectStore1');
            nextTest();
            done();
        };
    });
    onObjectStoreOpen('Adding with keypath and autoInc, no key in path', DB.OBJECT_STORE_2, function (objectStore, assert, done) {
        var data = sample.obj();
        delete data.Int;
        var req = objectStore.add(data);
        req.onsuccess = function (e) {
            _('Data added to object Store successfully ' + req.result);
            assert.notEqual(null, req.result, 'Data added to Object store');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function (e) {
            _('Could not add data to database');
            assert.ok(false, 'Could not add Data to ObjectStore1');
            nextTest();
            done();
        };
    });
    onObjectStoreOpen('Adding with NO keypath and autoInc', DB.OBJECT_STORE_3, function (objectStore, assert, done) {
        var key = sample.integer();
        var req = objectStore.add(sample.obj(), key);
        req.onsuccess = function (e) {
            _('Data added to object Store successfully ' + key);
            assert.equal(key, req.result, 'Data added to Object store');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function (e) {
            _('Could not add data to database');
            assert.ok(false, 'Could not add Data to ObjectStore1');
            nextTest();
            done();
        };
    });
    onObjectStoreOpen('Adding with NO keypath and autoInc - no key specified', DB.OBJECT_STORE_3, function (objectStore, assert, done) {
        var key = sample.integer();
        var req = objectStore.add(sample.obj());
        req.onsuccess = function (e) {
            _('Data added to object Store successfully ' + key);
            assert.ok(req.result, 'Data added to Object store');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function (e) {
            _('Could not add data to database');
            assert.ok(false, 'Could not add Data to ObjectStore1');
            nextTest();
            done();
        };
    });

    onObjectStoreOpen('Updating data in Object Store', DB.OBJECT_STORE_1, function (objectStore, assert, done) {
        data = sample.obj();
        data.modified = true;
        var req = objectStore.put(data, key);
        req.onsuccess = function () {
            _('Data added to object Store successfully ' + req.result);
            assert.equal(key, req.result, 'Data added to Object store');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function () {
            _('Could not add data to database');
            assert.ok(false, 'Could not update Data');
            nextTest();
            done();
        };
    });
    onObjectStoreOpen('Updating non-existent in Object Store', DB.OBJECT_STORE_1, function (objectStore, assert, done) {
        var key = 'UPDATED';
        var req = objectStore.put(sample.obj(), key);
        req.onsuccess = function () {
            _('Data added to object Store successfully ' + req.result);
            assert.equal(key, req.result, 'Data updated in Object store');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function () {
            _('Could not add data to database');
            assert.ok(false, 'Could not update Data');
            nextTest();
            done();
        };
    });
    onObjectStoreOpen('Getting data in Object Store', DB.OBJECT_STORE_1, function (objectStore, assert, done) {
        var req = objectStore.get(key);
        req.onsuccess = function () {
            _('Data got from object store');
            assert.deepEqual(req.result, data, 'Data fetched matches the data');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function () {
            _('Could not get data to database');
            assert.ok(false, 'Could not get data');
            nextTest();
            done();
        };
    });
    onObjectStoreOpen('Count in Object Store', DB.OBJECT_STORE_1, function (objectStore, assert, done) {
        var req = objectStore.count();
        req.onsuccess = function (e) {
            _('Data counted from object store');
            assert.equal(req.result, 2, 'Total number of objects in database');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function () {
            _('Could not get data to database');
            assert.ok(false, 'Could not get count of data');
            nextTest();
            done();
        };
    });
    onObjectStoreOpen('Delete data in Object Store', DB.OBJECT_STORE_1, function (objectStore, assert, done) {
        var req = objectStore['delete'](key);
        req.onsuccess = function (e) {
            _('Data deleted from object store');
            assert.deepEqual(req.result, undefined, 'Data deleted from Object Store');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function () {
            _('Could not get data to database');
            assert.ok(false, 'Could not delete data');
            nextTest();
            done();
        };
    });
    onObjectStoreOpen('Clear data in Object Store', DB.OBJECT_STORE_1, function (objectStore, assert, done) {
        var req = objectStore.clear();
        req.onsuccess = function (e) {
            _('Data cleared from object store');
            assert.ok(true, 'Data from Object Store');
            objectStore.transaction.db.close();
            nextTest();
            done();
        };
        req.onerror = function () {
            _('Could not get data to database');
            assert.ok(false, 'Could not delete data');
            nextTest();
            done();
        };
    });

    queuedAsyncTest('Lots of data Added to objectStore1', function (assert) {
        var done = assert.async();
        var dbOpenRequest = window.indexedDB.open(DB.NAME);
        dbOpenRequest.onsuccess = function (e) {
            _('Database opened successfully');
            assert.ok(true, 'Database Opened successfully');
            var db = dbOpenRequest.result;
            var transaction = db.transaction([DB.OBJECT_STORE_1], 'readwrite');
            var objectStore = transaction.objectStore(DB.OBJECT_STORE_1);
            var counter = 0, max = 15;
            var success = function () {
                assert.ok(true, 'Data added to store');
                if (++counter >= max) {
                    db.close();
                    nextTest();
                    done();
                }
            };
            var error = function () {
                assert.ok(false, 'Could not add data');
                if (++counter >= 10) {
                    nextTest();
                    done();
                }
            };
            for (var i = 0; i < max; i++) {
                var req = objectStore.add(sample.obj(), i);
                req.onsuccess = success;
                req.onerror = error;
            }
        };
        dbOpenRequest.onerror = function (e) {
            assert.ok(false, 'Database NOT Opened successfully');
            _('Database NOT opened successfully');
            nextTest();
            done();
        };
        dbOpenRequest.onblocked = function (e) {
            assert.ok(false, 'Opening database blocked');
            _('Opening database blocked');
            done();
        };
    });
}());

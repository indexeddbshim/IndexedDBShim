/* eslint-env qunit */
/* globals sample, queuedAsyncTest, DB, _, nextTest, queuedModule, dbVersion:true */
/* globals IDBKeyRange */
/* eslint-disable no-var */
queuedModule('Indexes');
queuedAsyncTest('Creating Indexes', function (assert) {
    var done = assert.async();
    var dbOpenRequest = window.indexedDB.open(DB.NAME, ++dbVersion);
    dbOpenRequest.onsuccess = function (e) {
        assert.ok(true, 'Database Opened successfully');
        _('Database opened successfully with version');
        dbOpenRequest.result.close();
        nextTest();
        done();
    };
    dbOpenRequest.onerror = function (e) {
        assert.ok(false, 'Database NOT Opened successfully');
        _('Database NOT opened successfully');
        nextTest();
        done();
    };
    dbOpenRequest.onupgradeneeded = function (e) {
        assert.ok(true, 'Database Upgraded successfully');
        _('Database upgrade called');
        // var db = dbOpenRequest.result;
        var objectStore1 = dbOpenRequest.transaction.objectStore(DB.OBJECT_STORE_1);
        // eslint-disable-next-line no-unused-vars
        var index1 = objectStore1.createIndex('Int Index', 'Int', {
            unique: false,
            multiEntry: false
        });
        var index2 = objectStore1.createIndex('String.Index', 'String'); // eslint-disable-line no-unused-vars
        assert.equal(objectStore1.indexNames.length, 2, '2 Indexes on object store successfully created');
        _(objectStore1.indexNames);
    };
    dbOpenRequest.onblocked = function (e) {
        _('Opening database blocked');
        assert.ok(false, 'Opening database blocked');
        done();
    };
});

(function () {
    function openObjectStore (name, storeName, callback) {
        queuedAsyncTest(name, function (assert) {
            var done = assert.async();
            var dbOpenRequest = window.indexedDB.open(DB.NAME);
            dbOpenRequest.onsuccess = function (e) {
                _('Database opened successfully');
                var db = dbOpenRequest.result;
                var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], 'readwrite');
                var objectStore = transaction.objectStore(DB.OBJECT_STORE_1);
                callback(objectStore, db, assert, done);
            };
            dbOpenRequest.onerror = function (e) {
                assert.ok(false, 'Database NOT Opened successfully');
                _('Database NOT opened successfully');
                nextTest();
                done();
            };
        });
    }

    openObjectStore('Check index exists after reopening database', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        assert.equal(objectStore.indexNames.length, 2, '2 Indexes on still exist');
        _(objectStore.indexNames);
        db.close();
        nextTest();
        done();
    });

    openObjectStore('Check index keyPath exists after reopening database', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var index = objectStore.index('Int Index');
        assert.equal(index.keyPath, 'Int', 'keyPath on index still exists');
        db.close();
        nextTest();
        done();
    });

    var key = sample.integer();
    var value = sample.obj();
    openObjectStore('Adding data after index is created', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var addReq = objectStore.add(value, key);
        addReq.onsuccess = function (e) {
            assert.equal(key, addReq.result, 'Data successfully added');
            _('Added to datastore with index ' + key);
            db.close();
            nextTest();
            done();
        };
        addReq.onerror = function () {
            db.close();
            assert.ok(false, 'Could not add data');
            nextTest();
            done();
        };
    });
    openObjectStore('Index Cursor', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var index = objectStore.index('Int Index');
        var indexCursorReq = index.openCursor();
        indexCursorReq.onsuccess = function () {
            var cursor = indexCursorReq.result;
            if (cursor) {
                _('Iterating over cursor ' + cursor.key + ' for value ' + JSON.stringify(cursor.value));
                cursor.continue();
            } else {
                assert.ok(true, 'Cursor Iteration completed');
                db.close();
                nextTest();
                done();
            }
        };
        indexCursorReq.onerror = function () {
            _('Error on cursor request');
            db.close();
            assert.ok(false, 'Could not continue opening cursor');
            nextTest();
            done();
        };
    });

    openObjectStore('Index Key Cursor', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var index = objectStore.index('Int Index');
        var indexCursorReq = index.openKeyCursor();
        indexCursorReq.onsuccess = function () {
            var cursor = indexCursorReq.result;
            if (cursor) {
                _('Iterating over cursor ' + cursor.key + ' for value ' + JSON.stringify(cursor.value));
                cursor.continue();
            } else {
                assert.ok(true, 'Cursor Iteration completed');
                db.close();
                nextTest();
                done();
            }
        };
        indexCursorReq.onerror = function () {
            _('Error on cursor request');
            db.close();
            assert.ok(false, 'Could not continue opening cursor');
            nextTest();
            done();
        };
    });

    openObjectStore('Index Get', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var index = objectStore.index('Int Index');
        var req = index.get(value.Int);
        req.onsuccess = function () {
            assert.deepEqual(req.result, value, 'Got object from Index Get');
            console.log('Got', req.result, value);
            db.close();
            nextTest();
            done();
        };
        req.onerror = function () {
            _('Error on cursor request');
            db.close();
            assert.ok(false, 'Could not continue opening cursor');
            nextTest();
            done();
        };
    });

    openObjectStore('Index Get Key', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var index = objectStore.index('Int Index');
        var req = index.getKey(value.Int);
        req.onsuccess = function () {
            assert.equal(req.result, key, 'Got key from Index Get');
            console.log('Got', req.result, value);
            db.close();
            nextTest();
            done();
        };
        req.onerror = function () {
            _('Error on cursor request');
            db.close();
            assert.ok(false, 'Could not continue opening cursor');
            nextTest();
            done();
        };
    });

    openObjectStore('Index update Cursor', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var index = objectStore.index('Int Index');
        var kr = IDBKeyRange.only(value.Int);
        var indexCursorReq;
        try {
            indexCursorReq = index.openCursor(kr);
        } catch (err) {
            if (err.name === 'DataError') { // PhantomJS having issue here
                // as mistakenly confusing supplied key range here with supplying
                // key to put/add (when in-line keys are used)
                db.close();
                assert.ok(false, 'Cursor update failed; possibly PhantomJS bug');
                nextTest();
                done();
                return;
            }
            throw err;
        }
        indexCursorReq.onsuccess = function () {
            var cursor = indexCursorReq.result;
            if (cursor) {
                var cursorValue = cursor.value;
                cursorValue.updated = true;
                var updateReq = cursor.update(cursorValue);
                updateReq.onerror = function () {
                    db.close();
                    assert.ok(false, 'Cursor update failed');
                    nextTest();
                    done();
                };
                updateReq.onsuccess = function () {
                    assert.ok(true, 'Cursor update succeeded');
                    var checkReq = index.openCursor(IDBKeyRange.only(value.Int));
                    checkReq.onsuccess = function () {
                        assert.deepEqual(checkReq.result.value, cursorValue, 'Update check succeeded');
                        db.close();
                        nextTest();
                        done();
                    };
                    checkReq.onerror = function () {
                        db.close();
                        assert.ok(false, 'cursor check failed');
                        nextTest();
                        done();
                    };
                };
            } else {
                db.close();
                assert.ok(false, 'Cursor expected');
                nextTest();
                done();
            }
        };
        indexCursorReq.onerror = function () {
            _('Error on cursor request');
            db.close();
            assert.ok(false, 'Could not continue opening cursor');
            nextTest();
            done();
        };
    });
}());

queuedAsyncTest('Deleting Indexes', function (assert) {
    var done = assert.async();
    var dbOpenRequest = window.indexedDB.open(DB.NAME, ++dbVersion);
    dbOpenRequest.onsuccess = function (e) {
        assert.ok(true, 'Database Opened successfully');
        _('Database opened successfully with version');
        dbOpenRequest.result.close();
        nextTest();
        done();
    };
    dbOpenRequest.onerror = function (e) {
        assert.ok(false, 'Database NOT Opened successfully');
        _('Database NOT opened successfully');
        nextTest();
        done();
    };
    dbOpenRequest.onupgradeneeded = function (e) {
        assert.ok(true, 'Database Upgraded successfully');
        _('Database upgrade called');
        // var db = dbOpenRequest.result;
        var objectStore1 = dbOpenRequest.transaction.objectStore(DB.OBJECT_STORE_1);
        var count = objectStore1.indexNames.length;

        var index3 = objectStore1.createIndex('DeleteTestIndex', 'String'); // eslint-disable-line no-unused-vars
        assert.equal(objectStore1.indexNames.length, count + 1, 'Index on object store successfully created');
        objectStore1.deleteIndex('DeleteTestIndex');
        assert.equal(objectStore1.indexNames.length, count, 'Index on object store successfully deleted');
        objectStore1.createIndex('DeleteTestIndex', 'Int');
        assert.equal(objectStore1.indexNames.length, count + 1, 'Index with previously deleted name successfully created');
        objectStore1.deleteIndex('DeleteTestIndex');
        assert.equal(objectStore1.indexNames.length, count, 'Index with previously deleted name successfully deleted');

        _(objectStore1.indexNames);
    };
    dbOpenRequest.onblocked = function (e) {
        _('Opening database blocked');
        assert.ok(false, 'Opening database blocked');
        done();
    };
});

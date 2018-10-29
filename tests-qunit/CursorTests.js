/* eslint-env qunit */
/* globals queuedAsyncTest, DB, _, nextTest, queuedModule */
/* eslint-disable no-var */
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

    queuedModule('Cursor');

    openObjectStore('Iterating over cursor', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var cursorReq = objectStore.openCursor();
        var count = 0;
        cursorReq.onsuccess = function (e) {
            var cursor = cursorReq.result;
            if (cursor) {
                count++;
                assert.ok(true, 'Iterating over cursor ' + cursor.key + ' for value ' + JSON.stringify(cursor.value));
                cursor.continue();
            } else {
                assert.equal(count, 15);
                objectStore.transaction.db.close();
                nextTest();
                done();
            }
        };
        cursorReq.onerror = function (e) {
            _('Error on cursor request');
            assert.ok(false, 'Could not continue opening cursor');
            nextTest();
            done();
        };
    });
    openObjectStore('Updating using a cursor', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var cursorReq = objectStore.openCursor();
        cursorReq.onsuccess = function (e) {
            var cursor = cursorReq.result;
            if (cursor) {
                if (cursor.value.Int % 3 === 0) {
                    cursor.value.cursorUpdate = true;
                    var updateReq = cursor.update(cursor.value);
                    updateReq.onsuccess = function () {
                        assert.equal(cursor.key, updateReq.result, 'Update value ' + cursor.key);
                        _('Updated cursor with key ' + updateReq.result);
                        cursor.continue();
                    };
                    updateReq.onerror = function () {
                        assert.ok(false, 'No Update ' + cursor.key);
                        cursor.continue();
                    };
                } else {
                    assert.ok(true, 'Got cursor value ' + cursor.key + ':' + JSON.stringify(cursor.value));
                    cursor.continue();
                }
            } else {
                _('Iterating over all objects completed');
                objectStore.transaction.db.close();
                nextTest();
                done();
            }
        };
        cursorReq.onerror = function (e) {
            _('Error on cursor request');
            assert.ok(false, 'Could not continue opening cursor');
            nextTest();
            done();
        };
    });

    openObjectStore('Deleting using a cursor', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        var cursorReq = objectStore.openCursor();
        var totalRows = 15;
        var cursorIteration = 0;
        cursorReq.onsuccess = function (e) {
            var cursor = cursorReq.result;
            if (cursor) {
                cursorIteration++;
                if (cursor.value.Int % 5 === 0) {
                    var updateReq = cursor.delete();
                    updateReq.onsuccess = function () {
                        assert.equal(undefined, updateReq.result, 'Deleted value ' + cursor.key);
                        _('Deleted cursor with key ' + updateReq.result);
                        cursor.continue();
                    };
                    updateReq.onerror = function () {
                        assert.ok(false, 'No delete ' + cursor.key);
                        cursor.continue();
                    };
                } else {
                    assert.ok(true, 'Got cursor value ' + cursor.key + ':' + JSON.stringify(cursor.value));
                    cursor.continue();
                }
            } else {
                objectStore.transaction.db.close();
                assert.equal(cursorIteration, totalRows, 'All cursors iterated');
                _('Iterating over all objects completed');
                nextTest();
                done();
            }
        };
        cursorReq.onerror = function (e) {
            _('Error on cursor request');
            assert.ok(false, 'Could not continue opening cursor');
            nextTest();
            done();
        };
    });

    openObjectStore('Store Key Cursor', DB.OBJECT_STORE_1, function (objectStore, db, assert, done) {
        if (!objectStore.openKeyCursor) {
            assert.ok(false, 'Environment doesn\'t yet support objectStore.openKeyCursor');
            db.close();
            nextTest();
            done();
            return;
        }
        var indexCursorReq = objectStore.openKeyCursor();
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
}());

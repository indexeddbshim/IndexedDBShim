/* eslint-env qunit */
/* globals queuedAsyncTest, DB, _, nextTest, queuedModule, dbVersion:true */
/* eslint-disable no-var */
queuedModule('Object Store');
queuedAsyncTest('Creating an Object Store', function (assert) {
    var done = assert.async();
    var dbOpenRequest = window.indexedDB.open(DB.NAME, ++dbVersion);
    dbOpenRequest.onsuccess = function (e) {
        assert.ok(true, 'Database Opened successfully');
        _('Database opened successfully with version ' + dbOpenRequest.result.version);
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
        var db = dbOpenRequest.result;
        db.createObjectStore(DB.OBJECT_STORE_1);
        db.createObjectStore(DB.OBJECT_STORE_2, {
            'keyPath': 'Int',
            'autoIncrement': true
        });
        db.createObjectStore(DB.OBJECT_STORE_3, {
            'autoIncrement': true
        });
        db.createObjectStore(DB.OBJECT_STORE_4, {
            'keyPath': 'Int'
        });
        var objectStore5 = db.createObjectStore(DB.OBJECT_STORE_5); // eslint-disable-line no-unused-vars
        assert.equal(db.objectStoreNames.length, 5, 'Count of Object Stores created is correct');
        _(db.objectStoreNames);
    };

    dbOpenRequest.onblocked = function () {
        assert.ok(false, 'Database open is now blocked');
        _('Database open blocked');
        done();
    };
});

queuedAsyncTest('Reopening an Object Store', function (assert) {
    var done = assert.async();
    var dbOpenRequest = window.indexedDB.open(DB.NAME);
    dbOpenRequest.onsuccess = function (e) {
        _('Database opened successfully');
        var db = dbOpenRequest.result;
        var transaction = db.transaction([DB.OBJECT_STORE_1], 'readonly');
        var objectStore = transaction.objectStore(DB.OBJECT_STORE_1);
        assert.equal(objectStore.autoIncrement, false, 'AutoIncrement defaults to false');
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
});

queuedAsyncTest('Deleting an Object Store', function (assert) {
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
        assert.ok(true, 'Database Upgraded successfully, now trying to delete the database');
        _('Database upgrade called');
        var db = dbOpenRequest.result;
        db.deleteObjectStore(DB.OBJECT_STORE_5);
        var len = db.objectStoreNames.length;
        for (var i = 0; i < len; i++) {
            if (db.objectStoreNames[i] === DB.OBJECT_STORE_5) {
                assert.notOk('Database should not not contain Object Store 5');
            }
        }
    };

    dbOpenRequest.onblocked = function (e) {
        assert.ok(false, 'Database open request blocked');
        _('Database open blocked');
        done();
    };
});

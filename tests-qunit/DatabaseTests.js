/* eslint-disable no-var */
queuedModule('Database');
queuedAsyncTest('Opening a Database without version', function (assert) {
    var done = assert.async();
    var dbOpenRequest = window.indexedDB.open(DB.NAME);
    dbOpenRequest.onsuccess = function (e) {
        assert.ok(true, 'Database Opened successfully');
        assert.expect(2);
        _('Database opened successfully with version ' + dbOpenRequest.result.version + '-' + dbVersion);
        dbVersion = dbOpenRequest.result.version || 0;
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
        assert.ok(true, 'Database upgrade should be called');
        _('Database upgrade called');
    };
    dbOpenRequest.onblocked = function (e) {
        assert.ok(true, 'Database blocked called');
        _('Database blocked called');
        done();
    };
});

queuedAsyncTest('Opening a database with a version ' + dbVersion, function (assert) {
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
    };
    dbOpenRequest.onblocked = function (e) {
        assert.ok(true, 'Database blocked called');
        _('Database blocked called');
        done();
    };
});

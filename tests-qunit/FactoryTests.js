/* eslint-env qunit */
/* globals queuedAsyncTest, DB, _, nextTest, queuedModule */
/* eslint-disable no-var */
(function () {
    function openDb (name, callback) {
        queuedAsyncTest(name, function (assert) {
            var done = assert.async();
            var dbOpenRequest = window.indexedDB.open(DB.NAME);
            dbOpenRequest.onsuccess = function (e) {
                _('Database opened successfully');
                var db = dbOpenRequest.result;
                callback(db, assert, done);
            };
            dbOpenRequest.onerror = function (e) {
                assert.ok(false, 'Database NOT Opened successfully');
                _('Database NOT opened successfully');
                nextTest();
                done();
            };
        });
    }
    queuedModule('IDBFactory');
    openDb('webkitGetDatabaseNames', function (db, assert, done) {
        if (!window.indexedDB.webkitGetDatabaseNames) {
            assert.ok(false, 'Database does not support (non-standard) IDBFactory.prototype.webkitGetDatabaseNames()');
            _('Database does not support (non-standard) IDBFactory.prototype.webkitGetDatabaseNames()');
            nextTest();
            done();
            return;
        }
        var req = window.indexedDB.webkitGetDatabaseNames();
        req.onsuccess = function () {
            assert.ok(req.result.length >= 1, 'Database list successfully found');
            var found = false;
            for (var i = 0; i < req.result.length; i++) {
                if (req.result.item(i) === DB.NAME) {
                    found = true;
                    break;
                }
            }
            assert.ok(found, 'Database lits successfully matched earlier-added database');
            _('Database names retrieved');
            db.close();
            nextTest();
            done();
        };
        req.onerror = function () {
            assert.ok(false, 'Unexpected error retrieving indexedDB.webkitGetDatabaseName().');
            nextTest();
            done();
        };
    });
}());

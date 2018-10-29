/* eslint-env qunit */
/* globals queuedAsyncTest, DB, _, nextTest, queuedModule */
/* eslint-disable no-var */
(function () {
    function openDb (name, callback) {
        queuedAsyncTest(name, function (assert) {
            var done = assert.async();
            window.indexedDB.deleteDatabase(DB.NAME);
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
    openDb('databases', function (db, assert, done) {
        if (!window.indexedDB.databases) {
            assert.ok(false, 'Database does not support IDBFactory.prototype.databases()');
            _('Database does not support IDBFactory.prototype.databases()');
            nextTest();
            done();
            return;
        }
        window.indexedDB.databases().then(function (info) { // eslint-disable-line promise/catch-or-return
            assert.ok(info.length >= 1, 'Database list successfully found');
            var found = info.some(function (inf) {
                return inf.name === DB.NAME && inf.version === 1;
            });
            assert.ok(found, 'Database list successfully matched earlier-added database');
            _('Database names retrieved');
            db.close();
            return undefined;
        }).catch(function () {
            assert.ok(false, 'Unexpected error retrieving indexedDB.databases().');
        }).then(function () {
            nextTest();
            done(); // eslint-disable-line promise/no-callback-in-promise
            return undefined;
        });
    });
}());

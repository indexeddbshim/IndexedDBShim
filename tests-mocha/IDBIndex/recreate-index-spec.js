describe('IDBIndex recreate', function () {
    'use strict';
    if (env.isNative) {
        return;
    }

    it('should handle creating, deleting, and recreating an index in the same transaction', function (done) {
        let db;
        const req = shimIndexedDB.open('recreate-index-db');
        req.onupgradeneeded = function (e) {
            db = e.target.result;
            const store = db.createObjectStore('store', {keyPath: 'id'});
            store.createIndex('idx', 'prop');
            store.deleteIndex('idx');
            store.createIndex('idx', 'prop');
        };
        req.onsuccess = function () {
            db.close();
            done();
        };
        req.onerror = function (e) {
            done(e.target.error);
        };
    });
});

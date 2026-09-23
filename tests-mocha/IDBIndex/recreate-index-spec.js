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

    // Regression test: recreating an index whose *previous* deletion has
    // already fully resolved (as opposed to still being merely
    // `__pendingDelete`) within the same version-change transaction --
    // exercised by deferring the recreate until after a round-trip request
    // that is queued after the `deleteIndex` call, so the delete's own
    // (asynchronous) completion callback has already run by the time we
    // recreate.
    it('should handle recreating an index whose earlier deletion has already resolved', function (done) {
        let db;
        const dbName = 'recreate-index-resolved-db' + Date.now() + Math.random(); // eslint-disable-line sonarjs/pseudo-random -- Testing
        const req = shimIndexedDB.open(dbName);
        req.onupgradeneeded = function (e) {
            db = e.target.result;
            const store = db.createObjectStore('store', {keyPath: 'id'});
            store.createIndex('idx', 'prop');
            store.deleteIndex('idx');
            const putReq = store.put({id: 1, prop: 'x'});
            putReq.onsuccess = function () {
                store.createIndex('idx', 'prop');
            };
            putReq.onerror = function (event) {
                done(event.target.error);
            };
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

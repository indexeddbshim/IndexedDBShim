describe('useSQLiteIndexes disabled', function () {
    if (env.isNative) { return; }

    // eslint-disable-next-line jsdoc/require-jsdoc -- helper
    function createDB (name, cb, upgrade) {
        // eslint-disable-next-line sonarjs/pseudo-random -- not used for security
        const req = indexedDB.open(name + Date.now() + Math.random(), 1);
        req.onupgradeneeded = function (e) {
            upgrade(e.target.result);
        };
        req.onsuccess = function (e) {
            cb(e.target.result);
        };
        req.onerror = function () {
            throw new Error('db open failed');
        };
    }

    it('should allow creating, renaming, count, and deleting indexes when useSQLiteIndexes is false', function (done) {
        // Temporarily disable SQLite indexes
        const originalConfig = shimIndexedDB.__getConfig('useSQLiteIndexes');
        shimIndexedDB.__setConfig('useSQLiteIndexes', false);

        createDB('db-no-indexes', function (db) {
            shimIndexedDB.__setConfig('useSQLiteIndexes', originalConfig);
            db.close();
            done();
        }, function (db) {
            const store = db.createObjectStore('store1', {keyPath: 'id'});

            store.add({id: 1, prop1: 'a'});
            store.add({id: 2, prop1: 'b'});

            // This tests IDBObjectStore.js and IDBIndex.js creation without SQLite indexes
            const idx1 = store.createIndex('idx1', 'prop1');

            // This tests IDBIndex.js count without SQLite indexes
            const countReq = idx1.count();
            countReq.onsuccess = function (e) {
                expect(e.target.result).to.equal(2);
            };

            // This tests IDBIndex.js renaming without SQLite indexes
            idx1.name = 'idx2';
            expect(idx1.name).to.equal('idx2');

            // This tests IDBIndex.js deletion without SQLite indexes
            store.deleteIndex('idx2');
        });
    });
});

describe('useSQLiteIndexes enabled', function () {
    if (env.isNative) { return; }

    // eslint-disable-next-line jsdoc/require-jsdoc -- helper
    function createDB (name, cb, upgrade) {
        // eslint-disable-next-line sonarjs/pseudo-random -- not used for security
        const req = indexedDB.open(name + Date.now() + Math.random(), 1);
        req.onupgradeneeded = function (e) {
            upgrade(e.target.result);
        };
        req.onsuccess = function (e) {
            cb(e.target.result);
        };
        req.onerror = function () {
            throw new Error('db open failed');
        };
    }

    it('should allow creating, renaming, count, and deleting indexes when useSQLiteIndexes is true', function (done) {
        // `useSQLiteIndexes` is `true` by default in the Node test environment (see `test-node.js`);
        //   set explicitly here so this test documents and exercises that path regardless of test order.
        const originalConfig = shimIndexedDB.__getConfig('useSQLiteIndexes');
        shimIndexedDB.__setConfig('useSQLiteIndexes', true);

        createDB('db-with-indexes', function (db) {
            shimIndexedDB.__setConfig('useSQLiteIndexes', originalConfig);
            db.close();
            done();
        }, function (db) {
            const store = db.createObjectStore('store1', {keyPath: 'id'});

            store.add({id: 1, prop1: 'a'});
            store.add({id: 2, prop1: 'b'});

            // This tests IDBObjectStore.js and IDBIndex.js creation with SQLite indexes
            const idx1 = store.createIndex('idx1', 'prop1');

            // This tests IDBIndex.js count with SQLite indexes
            const countReq = idx1.count();
            countReq.onsuccess = function (e) {
                expect(e.target.result).to.equal(2);
            };

            // This tests IDBIndex.js's `__renameIndex` SQL rebuild path (`CREATE TABLE`/
            //   `INSERT`/`DROP TABLE`/`ALTER TABLE ... RENAME` plus SQLite index recreation)
            idx1.name = 'idx2';
            expect(idx1.name).to.equal('idx2');

            // This tests IDBIndex.js deletion with SQLite indexes
            store.deleteIndex('idx2');
        });
    });

    it('should preserve other existing SQLite indexes when renaming an index', function (done) {
        // `useSQLiteIndexes` is `true` by default in the Node test environment (see `test-node.js`);
        //   set explicitly here so this test documents and exercises that path regardless of test order.
        const originalConfig = shimIndexedDB.__getConfig('useSQLiteIndexes');
        shimIndexedDB.__setConfig('useSQLiteIndexes', true);

        createDB('db-with-multiple-indexes', function (db) {
            shimIndexedDB.__setConfig('useSQLiteIndexes', originalConfig);
            db.close();
            done();
        }, function (db) {
            const store = db.createObjectStore('store1', {keyPath: 'id'});

            store.add({id: 1, prop1: 'a', prop2: 'x'});
            store.add({id: 2, prop1: 'b', prop2: 'y'});

            const idx1 = store.createIndex('idx1', 'prop1');
            // Having a second index present when `idx1` is renamed below exercises
            //   `IDBIndex.js`'s `__renameIndex` SQLite-index-recreation loop for
            //   "other" indexes that need to be preserved across the table rebuild.
            const idx2 = store.createIndex('idx2', 'prop2');

            idx1.name = 'idx1-renamed';
            expect(idx1.name).to.equal('idx1-renamed');

            const countReq = idx2.count();
            countReq.onsuccess = function (e) {
                expect(e.target.result).to.equal(2);
            };
        });
    });
});

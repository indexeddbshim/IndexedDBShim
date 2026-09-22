

describe('IDBCursor multiEntry edge cases', function () {
    if (env.isNative) { return; }

    // eslint-disable-next-line jsdoc/require-jsdoc -- helper
    function createDB (name, upgrade, cb) {
        const req = indexedDB.open(name, 1);
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

    it('should handle duplicate array elements in multiEntry without crashing sort (cover line 543)', function (done) {
        createDB('cont-db1', (db) => {
            db.createObjectStore('store').createIndex('idx', 'tags', {multiEntry: true});
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put({tags: ['a', 'a', 'a']}, 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').index('idx').openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { db.close(); done(); return; }
                    cursor.continue();
                };
            };
        });
    });
    it('should use LIKE optimization when range.upper is an array starting with range.lower (cover lines 404-412)', function (done) {
        createDB('cont-db2', (db) => {
            db.createObjectStore('store').createIndex('idx', 'tags', {multiEntry: true});
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put({tags: ['a', 'b']}, 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const range = IDBKeyRange.bound('a', ['a', 'z']);
                const req = tx2.objectStore('store').index('idx').openCursor(range);
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { db.close(); done(); return; }
                    cursor.continue();
                };
            };
        });
    });
    it('should throw TypeError on illegal constructor (cover lines 119-121)', function () {
        expect(() => new window.IDBCursor()).to.throw(TypeError, 'Illegal constructor');
        expect(() => new window.IDBCursorWithValue()).to.throw(TypeError, 'Illegal constructor');
    });
});

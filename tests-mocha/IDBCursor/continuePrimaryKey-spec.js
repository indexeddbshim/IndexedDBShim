
describe('IDBCursor.continuePrimaryKey', function () {
    if (env.isNative) { return; }
    // eslint-disable-next-line jsdoc/require-jsdoc -- helper
    function createDB (name, upgrade, cb) {
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

    it('should throw InvalidAccessError if not called on an index cursor', function (done) {
        createDB('cPK-db1', (db) => db.createObjectStore('store'), (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put('a', 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    try { cursor.continuePrimaryKey(2, 2); done(new Error('Should throw')); }
                    catch (e) { expect(e.name).to.equal('InvalidAccessError'); db.close(); done(); }
                };
            };
        });
    });
    it('should throw InvalidAccessError if called on a unique cursor', function (done) {
        createDB('cPK-db2', (db) => {
            const store = db.createObjectStore('store');
            store.createIndex('idx', 'val');
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put({val: 'a'}, 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').index('idx').openCursor(null, 'nextunique');
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    try { cursor.continuePrimaryKey('b', 2); done(new Error('Should throw')); }
                    catch (e) { expect(e.name).to.equal('InvalidAccessError'); db.close(); done(); }
                };
            };
        });
    });
    it('should continue to the specified primary key', function (done) {
        createDB('cPK-db3', (db) => {
            const store = db.createObjectStore('store');
            store.createIndex('idx', 'val');
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            store.put({val: 'a'}, 1);
            store.put({val: 'a'}, 2);
            store.put({val: 'b'}, 3);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').index('idx').openCursor();
                let count = 0;
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) {
                        expect(count).to.equal(2);
                        db.close(); done(); return;
                    }
                    count++;
                    switch (count) {
                    case 1: {
                        expect(cursor.primaryKey).to.equal(1);
                        cursor.continuePrimaryKey('a', 2);

                        break;
                    }
                    case 2: {
                        expect(cursor.primaryKey).to.equal(2);
                        cursor.continue();

                        break;
                    }
                    case 3: {
                        done(new Error('Should have skipped b'));

                        break;
                    }
                    // No default
                    }
                };
            };
        });
    });
    it('should throw DataError if key parameter does not match current key', function (done) {
        createDB('cPK-db4', (db) => {
            const store = db.createObjectStore('store');
            store.createIndex('idx', 'val');
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put({val: 'a'}, 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').index('idx').openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    try { cursor.continuePrimaryKey('b', 2); done(new Error('Should throw')); }
                    catch (e) { expect(e.name).to.equal('DataError'); db.close(); done(); }
                };
            };
        });
    });
    it('should throw DataError if primaryKey is not greater than current for next direction', function (done) {
        createDB('cPK-db5', (db) => {
            const store = db.createObjectStore('store');
            store.createIndex('idx', 'val');
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put({val: 'a'}, 2);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').index('idx').openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    try { cursor.continuePrimaryKey('a', 1); done(new Error('Should throw')); }
                    catch (e) { expect(e.name).to.equal('DataError'); db.close(); done(); }
                };
            };
        });
    });
    it('should throw DataError if primaryKey is not less than current for prev direction', function (done) {
        createDB('cPK-db6', (db) => {
            const store = db.createObjectStore('store');
            store.createIndex('idx', 'val');
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put({val: 'a'}, 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').index('idx').openCursor(null, 'prev');
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    try { cursor.continuePrimaryKey('a', 2); done(new Error('Should throw')); }
                    catch (e) { expect(e.name).to.equal('DataError'); db.close(); done(); }
                };
            };
        });
    });
    it('should throw InvalidStateError if cursor has no value', function (done) {
        createDB('cPK-db7', (db) => {
            const store = db.createObjectStore('store');
            store.createIndex('idx', 'val');
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put({val: 'a'}, 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').index('idx').openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    cursor.continue();
                    try { cursor.continuePrimaryKey('a', 2); done(new Error('Should throw')); }
                    catch (e) { expect(e.name).to.equal('InvalidStateError'); db.close(); done(); }
                };
            };
        });
    });
    it('should continue to the specified primary key on a multiEntry index', function (done) {
        createDB('cPK-db8', (db) => {
            const store = db.createObjectStore('store');
            store.createIndex('idx', 'tags', {multiEntry: true});
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            store.put({tags: ['a']}, 1);
            store.put({tags: ['a']}, 2);
            store.put({tags: ['b']}, 3);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').index('idx').openCursor();
                let count = 0;
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) {
                        expect(count).to.equal(2); db.close(); done(); return;
                    }
                    count++;
                    if (count === 1) {
                        expect(cursor.primaryKey).to.equal(1);
                        cursor.continuePrimaryKey('a', 2);
                    } else if (count === 2) {
                        expect(cursor.primaryKey).to.equal(2);
                        cursor.continue();
                    }
                };
            };
        });
    });
});

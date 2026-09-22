
describe('IDBCursor.continuePrimaryKey', function () {
    if (env.isNative) { return; }
    // eslint-disable-next-line jsdoc/require-jsdoc -- helper
    function createDB (name, upgrade, cb) {
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

    it('should throw InvalidAccessError if not called on an index cursor', function (done) {
        createDB('contPK-db1', (db) => db.createObjectStore('store'), (db) => {
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
        createDB('contPK-db2', (db) => {
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
        createDB('contPK-db3', (db) => {
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
                        expect(count).to.equal(3);
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
                        expect(cursor.primaryKey).to.equal(3);
                        cursor.continue();
                        break;
                    }
                    default: break;
                    }
                };
            };
        });
    });
    it('should throw DataError if primaryKey is not greater than current for next direction', function (done) {
        createDB('contPK-db5', (db) => {
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
        createDB('contPK-db6', (db) => {
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
        createDB('contPK-db7', (db) => {
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
        createDB('contPK-db8', (db) => {
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
                        expect(count).to.equal(3); db.close(); done(); return;
                    }
                    count++;
                    // eslint-disable-next-line default-case -- intentional
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
                        expect(cursor.primaryKey).to.equal(3);
                        cursor.continue();
                        break;
                    }
                    }
                };
            };
        });
    });

    it('should query the database on a multiEntry index when cache is exhausted', function (done) {
        if (typeof shimIndexedDB !== 'undefined' && shimIndexedDB.__setConfig) {
            shimIndexedDB.__setConfig('cursorPreloadPackSize', 1);
        }
        createDB('contPK-db9', (db) => {
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
                        if (typeof shimIndexedDB !== 'undefined' && shimIndexedDB.__setConfig) {
                            shimIndexedDB.__setConfig('cursorPreloadPackSize', 100);
                        }
                        expect(count).to.equal(2); db.close(); done(); return;
                    }
                    count++;
                    // eslint-disable-next-line default-case -- intentional
                    switch (count) {
                    case 1: {
                        expect(cursor.primaryKey).to.equal(1);
                        // The cache is size 1, so this continuePrimaryKey will miss the cache
                        // and trigger the SQL logic in __findMultiEntry covering lines 414-423.
                        cursor.continuePrimaryKey('b', 3);
                        break;
                    }
                    case 2: {
                        expect(cursor.primaryKey).to.equal(3);
                        cursor.continue();
                        break;
                    }
                    }
                };
            };
        });
    });

    it('should query the database on a standard index when cache is exhausted', function (done) {
        if (typeof shimIndexedDB !== 'undefined' && shimIndexedDB.__setConfig) {
            shimIndexedDB.__setConfig('cursorPreloadPackSize', 1);
        }
        createDB('contPK-db10', (db) => {
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
                        if (typeof shimIndexedDB !== 'undefined' && shimIndexedDB.__setConfig) {
                            shimIndexedDB.__setConfig('cursorPreloadPackSize', 100);
                        }
                        expect(count).to.equal(2); db.close(); done(); return;
                    }
                    count++;
                    // eslint-disable-next-line default-case -- intentional
                    switch (count) {
                    case 1: {
                        expect(cursor.primaryKey).to.equal(1);
                        cursor.continuePrimaryKey('b', 3);
                        break;
                    }
                    case 2: {
                        expect(cursor.primaryKey).to.equal(3);
                        cursor.continue();
                        break;
                    }
                    }
                };
            };
        });
    });

    it('should continue to a valid key successfully', function (done) {
        createDB('contPK-db11', (db) => {
            db.createObjectStore('store');
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            store.put('a', 1);
            store.put('b', 2);
            store.put('c', 3);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').openCursor();
                let count = 0;
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) {
                        expect(count).to.equal(2); db.close(); done(); return;
                    }
                    count++;
                    // eslint-disable-next-line default-case -- intentional
                    switch (count) {
                    case 1: {
                        expect(cursor.key).to.equal(1);
                        cursor.continue(3); // Valid forward jump!
                        break;
                    }
                    case 2: {
                        expect(cursor.key).to.equal(3);
                        cursor.continue();
                        break;
                    }
                    }
                };
            };
        });
    });

    it('should continue to a valid key successfully in prev direction', function (done) {
        createDB('contPK-db12', (db) => {
            db.createObjectStore('store');
        }, (db) => {
            const tx = db.transaction('store', 'readwrite');
            const store = tx.objectStore('store');
            store.put('a', 1);
            store.put('b', 2);
            store.put('c', 3);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readonly');
                const req = tx2.objectStore('store').openCursor(null, 'prev');
                let count = 0;
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) {
                        expect(count).to.equal(2); db.close(); done(); return;
                    }
                    count++;
                    // eslint-disable-next-line default-case -- intentional
                    switch (count) {
                    case 1: {
                        expect(cursor.key).to.equal(3);
                        cursor.continue(1); // Valid backward jump!
                        break;
                    }
                    case 2: {
                        expect(cursor.key).to.equal(1);
                        cursor.continue();
                        break;
                    }
                    }
                };
            };
        });
    });
});

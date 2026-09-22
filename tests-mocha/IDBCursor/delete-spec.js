describe('IDBCursor.delete', function () {
    it('Deleting using a cursor', function (done) {
        this.timeout(15000);
        testHelper.createObjectStores(undefined, (error, [, db]) => {
            if (error) {
                done(error);
                return;
            }
            db.close();
            testHelper.addObjectStoreData(function () {
                testHelper.openObjectStore(undefined, function (error, [objectStore]) {
                    if (error) {
                        done(error);
                        return;
                    }
                    const cursorReq = objectStore.openCursor();
                    const totalRows = 15;
                    let cursorIteration = 0;
                    cursorReq.onsuccess = function () {
                        const cursor = cursorReq.result;
                        if (cursor) {
                            cursorIteration++;
                            if (cursor.value.Int % 5 === 0) {
                                const updateReq = cursor.delete();
                                updateReq.onsuccess = function () {
                                    expect(
                                        updateReq.result,
                                        'Deleted value ' + cursor.key +
                                            'with key ' + updateReq.result
                                    ).to.be.undefined;
                                    cursor.continue();
                                };
                                updateReq.onerror = function () {
                                    expect(false, 'No delete ' + cursor.key).to.be.true;
                                    cursor.continue();
                                };
                            } else {
                                expect(
                                    true,
                                    'Got cursor value ' + cursor.key +
                                    ':' + JSON.stringify(cursor.value)
                                ).to.be.true;
                                cursor.continue();
                            }
                        } else {
                            objectStore.transaction.db.close();
                            expect(
                                cursorIteration,
                                'All cursors iterated'
                            ).to.equal(totalRows);
                            done();
                        }
                    };
                    cursorReq.onerror = function (e) {
                        expect(false, 'Could not continue opening cursor').to.be.true;
                        done(e);
                    };
                });
            });
        });
    });
});


describe('IDBCursor.delete edge cases', function () {
    if (env.isNative) { return; }

    // eslint-disable-next-line jsdoc/require-jsdoc -- helper
    function createDB (name, upgrade, cb) {
        // eslint-disable-next-line sonarjs/pseudo-random -- Testing
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

    it('should throw InvalidStateError if called on a key cursor', function (done) {
        createDB('delete-db1', (db) => db.createObjectStore('store'), (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put('a', 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readwrite');
                const req = tx2.objectStore('store').openKeyCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    try { cursor.delete(); done(new Error('Should throw')); }
                    catch (e) { expect(e.name).to.equal('InvalidStateError'); db.close(); done(); }
                };
            };
        });
    });
    it('should return error if record is not found during delete', function (done) {
        createDB('delete-db2', (db) => db.createObjectStore('store'), (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put('a', 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readwrite');
                const store2 = tx2.objectStore('store');
                const req = store2.openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    const delReq = store2.delete(cursor.primaryKey);
                    delReq.onsuccess = () => {
                        const curDelReq = cursor.delete();
                        curDelReq.onerror = () => {
                            expect(curDelReq.error).to.be.ok;
                            db.close(); done();
                        };
                    };
                };
            };
        });
    });
});

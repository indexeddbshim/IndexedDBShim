describe('IDBCursor.update', function () {
    it('Updating using a cursor', function (done) {
        this.timeout(20000);
        testHelper.createObjectStores(undefined, function (error, [objectStore]) {
            if (error) {
                done(error);
                return;
            }
            const cursorReq = objectStore.openCursor();
            cursorReq.onsuccess = function () {
                const cursor = cursorReq.result;
                if (cursor) {
                    if (cursor.value.Int % 3 === 0) {
                        cursor.value.cursorUpdate = true;
                        const updateReq = cursor.update(cursor.value);
                        updateReq.onsuccess = function () {
                            expect(cursor.key, 'Update value ' + cursor.key).to.equal(updateReq.result);
                            cursor.continue();
                        };
                        updateReq.onerror = function () {
                            expect(false, 'No Update ' + cursor.key).to.be.true;
                            cursor.continue();
                        };
                    } else {
                        expect(true, 'Got cursor value ' + cursor.key + ':' + JSON.stringify(cursor.value)).to.be.true;
                        cursor.continue();
                    }
                } else {
                    objectStore.transaction.db.close();
                    done();
                }
            };
            cursorReq.onerror = function () {
                done(new Error('Could not continue opening cursor'));
            };
        });
    });

    it('Index update Cursor', function (done) {
        testHelper.createIndexesAndData((error, [, value, objectStore, db]) => {
            if (error) {
                done(error);
                return;
            }
            const index = objectStore.index('Int Index');
            const kr = IDBKeyRange.only(value.Int);
            let indexCursorReq;
            try {
                indexCursorReq = index.openCursor(kr);
            } catch (err) {
                if (err.name === 'DataError') { // PhantomJS having issue here
                    // as mistakenly confusing supplied key range here with supplying
                    // key to put/add (when in-line keys are used)
                    db.close();
                    throw new Error('Cursor update failed; possibly PhantomJS bug', {
                        cause: err
                    });
                }
                throw err;
            }
            indexCursorReq.onsuccess = function () {
                const cursor = indexCursorReq.result;
                if (cursor) {
                    const cursorValue = cursor.value;
                    cursorValue.updated = true;
                    const updateReq = cursor.update(cursorValue);
                    updateReq.onerror = function () {
                        db.close();
                        done(new Error('Cursor update failed'));
                    };
                    updateReq.onsuccess = function () {
                        expect(true, 'Cursor update succeeded').to.be.true;
                        const checkReq = index.openCursor(IDBKeyRange.only(value.Int));
                        checkReq.onsuccess = function () {
                            expect(checkReq.result.value, 'Update check succeeded').to.deep.equal(cursorValue);
                            db.close();
                            done();
                        };
                        checkReq.onerror = function () {
                            db.close();
                            done(new Error('cursor check failed'));
                        };
                    };
                } else {
                    db.close();
                    done(new Error('Cursor expected'));
                }
            };
            indexCursorReq.onerror = function () {
                db.close();
                done(new Error('Could not continue opening cursor'));
            };
        });
    });
});


describe('IDBCursor.update edge cases', function () {
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

    it('should throw DataError if the new value evaluates to a different key than the cursor primaryKey', function (done) {
        createDB('update-db1', (db) => db.createObjectStore('store', {keyPath: 'id'}), (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put({id: 1, val: 'a'});
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readwrite');
                const req = tx2.objectStore('store').openCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    try { cursor.update({id: 2, val: 'b'}); done(new Error('Should throw')); }
                    catch (e) { expect(e.name).to.equal('DataError'); db.close(); done(); }
                };
            };
        });
    });
    it('should throw InvalidStateError if called on a key cursor', function (done) {
        createDB('update-db2', (db) => db.createObjectStore('store'), (db) => {
            const tx = db.transaction('store', 'readwrite');
            tx.objectStore('store').put('a', 1);
            tx.oncomplete = () => {
                const tx2 = db.transaction('store', 'readwrite');
                const req = tx2.objectStore('store').openKeyCursor();
                req.onsuccess = () => {
                    const cursor = req.result;
                    if (!cursor) { return; }
                    try { cursor.update('b'); done(new Error('Should throw')); }
                    catch (e) { expect(e.name).to.equal('InvalidStateError'); db.close(); done(); }
                };
            };
        });
    });
});

describe('IDBObjectStore.getAll/getAllKeys direction', function () {
    'use strict';

    /**
     * @param {IDBObjectStore} store
     * @param {string} direction
     * @param {(err: Error|undefined, keys: AnyValue[], values: AnyValue[]) => void} cb
     * @returns {void}
     */
    function collectViaCursor (store, direction, cb) {
        const keys = [];
        const values = [];
        const req = store.openCursor(undefined, direction);
        req.onsuccess = function () {
            const cursor = req.result;
            if (!cursor) {
                cb(undefined, keys, values);
                return;
            }
            keys.push(cursor.primaryKey);
            values.push(cursor.value);
            cursor.continue();
        };
        req.onerror = function () {
            cb(req.error, keys, values);
        };
    }

    /**
     * @param {(err: Error|undefined, store?: IDBObjectStore, db?: IDBDatabase) => void} cb
     * @returns {void}
     */
    function setup (cb) {
        util.createDatabase('out-of-line-generated', function (err, db) {
            if (err) {
                cb(err);
                return;
            }
            const tx = db.transaction('out-of-line-generated', 'readwrite');
            const store = tx.objectStore('out-of-line-generated');
            [10, 30, 20, 50, 40].forEach(function (n) {
                store.add({n});
            });
            tx.oncomplete = function () {
                cb(undefined, db.transaction('out-of-line-generated', 'readonly').objectStore('out-of-line-generated'), db);
            };
            tx.onerror = function () {
                cb(new Error('Could not populate store'));
            };
        });
    }

    ['next', 'prev'].forEach(function (direction) {
        it('should match cursor iteration order for direction "' + direction + '"', function (done) {
            setup(function (err, store, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                collectViaCursor(store, direction, function (cursorErr, expectedKeys) {
                    if (cursorErr) {
                        expect(function () { throw cursorErr; }).to.not.throw(Error);
                        done();
                        return;
                    }
                    const req = store.getAllKeys({direction});
                    req.onsuccess = function () {
                        expect(req.result).to.deep.equal(expectedKeys);
                        db.close();
                        done();
                    };
                    req.onerror = function () {
                        done(new Error('getAllKeys failed'));
                    };
                });
            });
        });
    });

    it('should support the legacy (query, count) signature', function (done) {
        setup(function (err, store, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const req = store.getAll(undefined, 2);
            req.onsuccess = function () {
                expect(req.result).to.have.lengthOf(2);
                db.close();
                done();
            };
            req.onerror = function () {
                done(new Error('getAll failed'));
            };
        });
    });

    it('should support {query, count, direction} together', function (done) {
        setup(function (err, store, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            collectViaCursor(store, 'prev', function (cursorErr, expectedKeys) {
                if (cursorErr) {
                    expect(function () { throw cursorErr; }).to.not.throw(Error);
                    done();
                    return;
                }
                const req = store.getAllKeys({count: 2, direction: 'prev'});
                req.onsuccess = function () {
                    expect(req.result).to.deep.equal(expectedKeys.slice(0, 2));
                    db.close();
                    done();
                };
                req.onerror = function () {
                    done(new Error('getAllKeys failed'));
                };
            });
        });
    });

    it('should throw a TypeError for an invalid direction', function (done) {
        setup(function (err, store, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            let thrown;
            try {
                store.getAll({direction: 'bogus'});
            } catch (e) {
                thrown = e;
            }
            expect(thrown).to.be.an.instanceOf(TypeError);
            db.close();
            done();
        });
    });

    it('getAllRecords should return {key, primaryKey, value} matching cursor iteration', function (done) {
        setup(function (err, store, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            collectViaCursor(store, 'prev', function (cursorErr, expectedKeys, expectedValues) {
                if (cursorErr) {
                    expect(function () { throw cursorErr; }).to.not.throw(Error);
                    done();
                    return;
                }
                const req = store.getAllRecords({direction: 'prev'});
                req.onsuccess = function () {
                    // `req.result` holds real `IDBRecord` instances (whose
                    //   `key`/`primaryKey`/`value` are inherited accessors,
                    //   per spec), not plain objects, so compare their
                    //   values rather than the instances themselves.
                    expect(req.result.map(function (record) {
                        return {key: record.key, primaryKey: record.primaryKey, value: record.value};
                    })).to.deep.equal(expectedKeys.map(function (key, i) {
                        return {key, primaryKey: key, value: expectedValues[i]};
                    }));
                    db.close();
                    done();
                };
                req.onerror = function () {
                    done(new Error('getAllRecords failed'));
                };
            });
        });
    });
});

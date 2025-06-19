describe('IDBIndex.count', function () {
    'use strict';

    it('should return an IDBRequest', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            tx.onerror = function (event) {
                done(event.target.error);
            };

            const store = tx.objectStore('inline');
            const storeCount = store.count();
            const indexCount = store.index('inline-index').count();

            expect(storeCount).to.be.an.instanceOf(IDBRequest);
            expect(indexCount).to.be.an.instanceOf(IDBRequest);

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });

    it('should have a reference to the transaction', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            const store = tx.objectStore('inline');
            const storeCount = store.count();
            const indexCount = store.index('inline-index').count();

            expect(storeCount.transaction).to.equal(tx);
            expect(indexCount.transaction).to.equal(tx);
            expect(storeCount.transaction.db).to.equal(db);
            expect(indexCount.transaction.db).to.equal(db);

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });

    it('should pass the IDBRequest to the onsuccess event', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            const store = tx.objectStore('inline');
            const storeCount = store.count();
            storeCount.onerror = sinon.spy();
            storeCount.onsuccess = sinon.spy(function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(storeCount);
            });

            const indexCount = store.index('inline-index').count();
            indexCount.onerror = sinon.spy();
            indexCount.onsuccess = sinon.spy(function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(indexCount);
            });

            tx.oncomplete = function () {
                sinon.assert.calledOnce(storeCount.onsuccess);
                sinon.assert.calledOnce(indexCount.onsuccess);

                sinon.assert.notCalled(storeCount.onerror);
                sinon.assert.notCalled(indexCount.onerror);

                db.close();
                done();
            };
        });
    });

    it('should return zero if there are no records', function (done) {
        util.createDatabase('out-of-line', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = done;

            const store = tx.objectStore('out-of-line');
            const storeCount = store.count();
            const indexCount = store.index('inline-index').count();

            tx.oncomplete = function () {
                expect(storeCount.result).to.equal(0);
                expect(indexCount.result).to.equal(0);

                db.close();
                done();
            };
        });
    });

    it('should return one if there is one record', function (done) {
        util.createDatabase('out-of-line', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = function (evt) {
                done(evt.target.error);
            };

            const store = tx.objectStore('out-of-line');
            store.add({id: 'a'}, 12345);

            const storeCount = store.count();
            const indexCount = store.index('inline-index').count();

            tx.oncomplete = function () {
                expect(storeCount.result).to.equal(1);
                expect(indexCount.result).to.equal(1);

                db.close();
                done();
            };
        });
    });

    it('should return the count for multiple records', function (done) {
        util.createDatabase('out-of-line', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = done;

            const store = tx.objectStore('out-of-line');
            store.add({id: 'a'}, 111);
            store.add({id: 'b'}, 2222);
            store.add({id: 'c'}, 33);

            const storeCount = store.count();
            const indexCount = store.index('inline-index').count();

            tx.oncomplete = function () {
                expect(storeCount.result).to.equal(3);
                expect(indexCount.result).to.equal(3);

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should return the count of all records if key is undefined', function (done) {
        // BUG: IE throws an error if the key is undefined
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            const store = tx.objectStore('inline');
            store.add({id: 'a'});
            store.add({id: 'b'});
            store.add({id: 'c'});

            const storeCount = store.count(undefined);
            const indexCount = store.index('inline-index').count(undefined);

            tx.oncomplete = function () {
                expect(storeCount.result).to.equal(3);
                expect(indexCount.result).to.equal(3);

                db.close();
                done();
            };
        });
    });

    it('should return the count for multiple records filtered by range', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            const store = tx.objectStore('inline');
            const index = store.index('inline-index');

            store.add({id: 'a'});
            store.add({id: 'b'});
            store.add({id: 'c'});

            const storeCount = store.count();
            const indexCount = index.count();

            const range = IDBKeyRange.bound('a', 'b', false, false);
            const filteredStoreCount = store.count(range);
            const filteredIndexCount = index.count(range);

            tx.oncomplete = function () {
                expect(storeCount.result).to.equal(3);
                expect(indexCount.result).to.equal(3);
                expect(filteredStoreCount.result).to.equal(2);
                expect(filteredIndexCount.result).to.equal(2);

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should return the count for multi-entry indexes', function (done) {
        // BUG: IE's native IndexedDB does not support multi-entry indexes
        this.timeout(35000);
        this.slow(35000);

        util.createDatabase('inline', 'multi-entry-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');
            const index = store.index('multi-entry-index');
            tx.onerror = function (event) {
                done(event.target.error.message);
            };

            for (let i = 0; i < 500; i++) {
                store.add({id: ['a', 'b', i]});
                store.add({id: ['a', 'c', i]});
            }

            const storeCount1 = store.count();
            const indexCount1 = index.count();

            const storeCount2 = store.count('a');
            const indexCount2 = index.count('a');

            const storeCount3 = store.count('b');
            const indexCount3 = index.count('b');

            const storeCount4 = store.count('c');
            const indexCount4 = index.count('c');

            const storeCount5 = store.count(['a', 'b', 5]);
            const indexCount5 = index.count(['a', 'b', 5]);

            const storeCount6 = store.count(['b']);
            const indexCount6 = index.count(['b']);

            tx.oncomplete = function () {
                expect(storeCount1.result).to.equal(1000);
                expect(storeCount2.result).to.equal(0);
                expect(storeCount3.result).to.equal(0);
                expect(storeCount4.result).to.equal(0);
                expect(storeCount5.result).to.equal(1);
                expect(storeCount6.result).to.equal(0);

                expect(indexCount1.result).to.equal(3000);
                expect(indexCount2.result).to.equal(1000);
                expect(indexCount3.result).to.equal(500);
                expect(indexCount4.result).to.equal(500);
                expect(indexCount5.result).to.equal(0);
                expect(indexCount6.result).to.equal(0);

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should return the count for unique, multi-entry indexes', function (done) {
        // BUG: IE's native IndexedDB does not support multi-entry indexes
        this.timeout(25000);
        this.slow(25000);

        util.createDatabase('inline', 'unique-multi-entry-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');
            const index = store.index('unique-multi-entry-index');
            tx.onerror = function (event) {
                done(event.target.error.message);
            };

            for (let i = 0; i < 500; i++) {
                store.add({id: ['a' + i, 'b' + i]});
                store.add({id: ['c' + i]});
            }

            const storeCount1 = store.count();
            const indexCount1 = index.count();

            const storeCount2 = store.count('a250');
            const indexCount2 = index.count('a250');

            const storeCount3 = store.count('b499');
            const indexCount3 = index.count('b499');

            const storeCount4 = store.count('c9');
            const indexCount4 = index.count('c9');

            const storeCount5 = store.count(['a5', 'b5']);
            const indexCount5 = index.count(['a5', 'b5']);

            const storeCount6 = store.count(['b42']);
            const indexCount6 = index.count(['b42']);

            tx.oncomplete = function () {
                expect(storeCount1.result).to.equal(1000);
                expect(storeCount2.result).to.equal(0);
                expect(storeCount3.result).to.equal(0);
                expect(storeCount4.result).to.equal(0);
                expect(storeCount5.result).to.equal(1);
                expect(storeCount6.result).to.equal(0);

                expect(indexCount1.result).to.equal(1500);
                expect(indexCount2.result).to.equal(1);
                expect(indexCount3.result).to.equal(1);
                expect(indexCount4.result).to.equal(1);
                expect(indexCount5.result).to.equal(0);
                expect(indexCount6.result).to.equal(0);

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should return the count for unique, multi-entry indexes, filtered by range', function (done) {
        // BUG: IE's native IndexedDB does not support multi-entry indexes
        util.createDatabase('inline', 'unique-multi-entry-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');
            const index = store.index('unique-multi-entry-index');
            tx.onerror = function (event) {
                done(event.target.error.message);
            };

            store.add({id: ['a'], value: 1});
            store.add({id: ['b', 'c'], value: 2});
            store.add({id: ['d', 'e'], value: 3});

            const storeCount = store.count();
            const indexCount = index.count();

            const filteredStoreCount = store.count(IDBKeyRange.bound(['a'], ['c']));
            const filteredIndexCount = index.count(IDBKeyRange.bound('b', 'd'));

            tx.oncomplete = function () {
                expect(storeCount.result).to.equal(3);
                expect(indexCount.result).to.equal(5);
                expect(filteredStoreCount.result).to.equal(2);
                expect(filteredIndexCount.result).to.equal(3);

                db.close();
                done();
            };
        });
    });

    it('should return different values as records are added/removed', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');
            const index = store.index('inline-index');
            tx.onerror = done;

            const storeCount1 = store.count();
            const indexCount1 = index.count();

            store.add({id: 'a'});
            store.add({id: 'b'});

            const storeCount2 = store.count();
            const indexCount2 = index.count();

            store.delete('a');

            const storeCount3 = store.count();
            const indexCount3 = index.count();

            store.add({id: 'a'});
            store.add({id: 'c'});
            store.add({id: 'd'});

            const storeCount4 = store.count();
            const indexCount4 = index.count();

            tx.oncomplete = function () {
                expect(storeCount1.result).to.equal(0);
                expect(indexCount1.result).to.equal(0);

                expect(storeCount2.result).to.equal(2);
                expect(indexCount2.result).to.equal(2);

                expect(storeCount3.result).to.equal(1);
                expect(indexCount3.result).to.equal(1);

                expect(storeCount4.result).to.equal(4);
                expect(indexCount4.result).to.equal(4);

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should return different values as records are added/removed from multi-entry indexes', function (done) {
        // BUG: IE's native IndexedDB does not support multi-entry indexes
        util.createDatabase('inline', 'multi-entry-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');
            const index = store.index('multi-entry-index');
            tx.onerror = done;

            const storeCount1 = store.count();
            const indexCount1 = index.count();

            store.add({id: ['a']});

            const storeCount2 = store.count();
            const indexCount2 = index.count();

            store.add({id: ['a', 'b']});

            const storeCount3 = store.count();
            const indexCount3 = index.count();

            store.delete(['a']);

            const storeCount4 = store.count();
            const indexCount4 = index.count();

            store.add({id: ['a']});

            const storeCount5 = store.count();
            const indexCount5 = index.count();

            store.add({id: ['c', 'a', 'd']});

            const storeCount6 = store.count();
            const indexCount6 = index.count();

            store.add({id: ['d', 'c']});

            const storeCount7 = store.count();
            const indexCount7 = index.count();

            tx.oncomplete = function () {
                expect(storeCount1.result).to.equal(0);
                expect(storeCount2.result).to.equal(1);
                expect(storeCount3.result).to.equal(2);
                expect(storeCount4.result).to.equal(1);
                expect(storeCount5.result).to.equal(2);
                expect(storeCount6.result).to.equal(3);
                expect(storeCount7.result).to.equal(4);

                expect(indexCount1.result).to.equal(0);
                expect(indexCount2.result).to.equal(1);
                expect(indexCount3.result).to.equal(3);
                expect(indexCount4.result).to.equal(2);
                expect(indexCount5.result).to.equal(3);
                expect(indexCount6.result).to.equal(6);
                expect(indexCount7.result).to.equal(8);

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should return different values as records are added/removed from unique, multi-entry indexes', function (done) {
        // BUG: IE's native IndexedDB does not support multi-entry indexes
        util.createDatabase('inline', 'unique-multi-entry-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');
            const index = store.index('unique-multi-entry-index');
            tx.onerror = done;

            const storeCount1 = store.count();
            const indexCount1 = index.count();

            store.add({id: ['a']});

            const storeCount2 = store.count();
            const indexCount2 = index.count();

            store.add({id: ['b', 'c']});

            const storeCount3 = store.count();
            const indexCount3 = index.count();

            store.delete(['b']);

            const storeCount4 = store.count();
            const indexCount4 = index.count();

            store.add({id: ['d', 'e']});

            const storeCount5 = store.count();
            const indexCount5 = index.count();

            store.delete(['b', 'c']);

            const storeCount6 = store.count();
            const indexCount6 = index.count();

            tx.oncomplete = function () {
                expect(storeCount1.result).to.equal(0);
                expect(storeCount2.result).to.equal(1);
                expect(storeCount3.result).to.equal(2);
                expect(storeCount4.result).to.equal(2);
                expect(storeCount5.result).to.equal(3);
                expect(storeCount6.result).to.equal(2);

                expect(indexCount1.result).to.equal(0);
                expect(indexCount2.result).to.equal(1);
                expect(indexCount3.result).to.equal(3);
                expect(indexCount4.result).to.equal(3);
                expect(indexCount5.result).to.equal(5);
                expect(indexCount6.result).to.equal(3);

                db.close();
                done();
            };
        });
    });

    it('should throw an error if the transaction is closed', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');
            const index = store.index('inline-index');

            setTimeout(function () {
                tryToCount(store);
                tryToCount(index);

                /**
                 * @param {IDBObjectStore|IDBIndex} obj
                 * @returns {void}
                 */
                function tryToCount (obj) {
                    let err = null;

                    try {
                        obj.count();
                    } catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(env.DOMException);
                    expect(err.name).to.equal('TransactionInactiveError');
                }

                db.close();
                done();
            }, env.transactionDuration);
        });
    });
});

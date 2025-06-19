describe('IDBIndex.get', function () {
    'use strict';

    it('Index Get', function (done) {
        testHelper.createIndexesAndData((error, [, value, objectStore, db]) => {
            if (error) {
                done(error);
                return;
            }
            const index = objectStore.index('Int Index');
            const req = index.get(value.Int);
            req.onsuccess = function () {
                expect(req.result, 'Got object from Index Get').to.deep.equal(value);
                console.log('Got', req.result, value);
                db.close();
                done();
            };
            req.onerror = function () {
                db.close();
                done(new Error('Could not continue opening cursor'));
            };
        });
    });

    it('should return an IDBRequest', function (done) {
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

            const storeGet = store.get('foo');
            const indexGet = index.get('foo');

            expect(storeGet).to.be.an.instanceOf(IDBRequest);
            expect(indexGet).to.be.an.instanceOf(IDBRequest);

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });

    it('should pass the IDBRequest event to the onsuccess callback', function (done) {
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

            const storeGet = store.get('foo');
            const indexGet = index.get('foo');

            storeGet.onerror = sinon.spy();
            indexGet.onerror = sinon.spy();

            storeGet.onsuccess = sinon.spy(function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(storeGet);
            });

            indexGet.onsuccess = sinon.spy(function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(indexGet);
            });

            tx.oncomplete = function () {
                sinon.assert.calledOnce(storeGet.onsuccess);
                sinon.assert.calledOnce(indexGet.onsuccess);

                sinon.assert.notCalled(storeGet.onerror);
                sinon.assert.notCalled(indexGet.onerror);

                db.close();
                done();
            };
        });
    });

    it('should get a record', function (done) {
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

            let storeGet, indexGet;
            store.add({id: 1}).onsuccess = function () {
                storeGet = store.get(1);
                indexGet = index.get(1);
            };

            tx.oncomplete = function () {
                expect(storeGet.result).to.deep.equal({id: 1});
                expect(indexGet.result).to.deep.equal({id: 1});

                db.close();
                done();
            };
        });
    });

    it('should not get a record if the key is not found', function (done) {
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

            let storeGet, indexGet;
            store.add({id: 1}).onsuccess = function () {
                storeGet = store.get(2);
                indexGet = index.get(2);
            };

            tx.oncomplete = function () {
                expect(storeGet.result).to.not.be.ok;
                expect(indexGet.result).to.not.be.ok;

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(storeGet.result).equal(undefined); // Safari returns null
                    expect(indexGet.result).equal(undefined); // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get records immediately after creating them', function (done) {
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

            store.add({id: 1});
            const storeGet1 = store.get(1);
            const indexGet1 = index.get(1);

            store.add({id: 2});
            store.add({id: 3});
            const storeGet2 = store.get(2);
            const storeGet3 = store.get(3);
            const indexGet2 = index.get(2);
            const indexGet3 = index.get(3);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.deep.equal({id: 1});
                expect(storeGet2.result).to.deep.equal({id: 2});
                expect(storeGet3.result).to.deep.equal({id: 3});

                expect(indexGet1.result).to.deep.equal({id: 1});
                expect(indexGet2.result).to.deep.equal({id: 2});
                expect(indexGet3.result).to.deep.equal({id: 3});

                db.close();
                done();
            };
        });
    });

    it('should get records from previous transactions', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            transaction1();

            /**
             * @returns {void}
             */
            function transaction1 () {
                const tx = db.transaction('inline', 'readwrite');
                const store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = transaction2;

                store.add({id: 1});
                store.add({id: 2});
                store.add({id: 3});
            }

            /**
             * @returns {void}
             */
            function transaction2 () {
                const tx = db.transaction('inline', 'readwrite');
                const store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = transaction3;

                store.add({id: 4});
                store.add({id: 5});
            }

            let storeGet1, storeGet2, storeGet3, storeGet4, storeGet5,
                indexGet1, indexGet2, indexGet3, indexGet4, indexGet5;

            /**
             * @returns {void}
             */
            function transaction3 () {
                const tx = db.transaction('inline', 'readwrite');
                const store = tx.objectStore('inline');
                const index = store.index('inline-index');
                tx.onerror = done;
                tx.oncomplete = checkResults;

                storeGet1 = store.get(1);
                storeGet2 = store.get(2);
                storeGet3 = store.get(3);
                storeGet4 = store.get(4);
                storeGet5 = store.get(5);

                indexGet1 = index.get(1);
                indexGet2 = index.get(2);
                indexGet3 = index.get(3);
                indexGet4 = index.get(4);
                indexGet5 = index.get(5);
            }

            /**
             * @returns {void}
             */
            function checkResults () {
                expect(storeGet1.result).to.deep.equal({id: 1});
                expect(storeGet2.result).to.deep.equal({id: 2});
                expect(storeGet3.result).to.deep.equal({id: 3});
                expect(storeGet4.result).to.deep.equal({id: 4});
                expect(storeGet5.result).to.deep.equal({id: 5});

                expect(indexGet1.result).to.deep.equal({id: 1});
                expect(indexGet2.result).to.deep.equal({id: 2});
                expect(indexGet3.result).to.deep.equal({id: 3});
                expect(indexGet4.result).to.deep.equal({id: 4});
                expect(indexGet5.result).to.deep.equal({id: 5});

                db.close();
                done();
            }
        });
    });

    it('should get data using out-of-line keys', function (done) {
        util.createDatabase('out-of-line', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line', 'readwrite');
            const store = tx.objectStore('out-of-line');
            const index = store.index('inline-index');
            tx.onerror = function (event) {
                done(event.target.error);
            };

            store.add('one', 101);
            store.add('two', 222);
            store.add('three', 3);
            store.add('four', 44);
            store.add('five', 555555);

            const storeGet1 = store.get(555555);
            const storeGet2 = store.get(3);
            const storeGet3 = store.get(101);

            const indexGet1 = index.get(555555);
            const indexGet2 = index.get(3);
            const indexGet3 = index.get(101);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.equal('five');
                expect(storeGet2.result).to.equal('three');
                expect(storeGet3.result).to.equal('one');

                // Out-of-line keys aren't included in indexes
                expect(indexGet1.result).to.not.be.ok;
                expect(indexGet2.result).to.not.be.ok;
                expect(indexGet3.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet1.result).equal(undefined); // Safari returns null
                    expect(indexGet2.result).equal(undefined); // Safari returns null
                    expect(indexGet3.result).equal(undefined); // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should get data using compound out-of-line keys', function (done) {
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('out-of-line-compound', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line-compound', 'readwrite');
            const store = tx.objectStore('out-of-line-compound');
            const index = store.index('inline-index');
            tx.onerror = done;

            store.add('one', [1, 'oh', 1]);
            store.add('two', ['t', 'w', 'o']);
            store.add('three', [3, 3]);
            store.add('four', [4, '4']);
            store.add('five', ['five']);

            const storeGet1 = store.get(['five']);
            const storeGet2 = store.get([1, 'oh', 1]);
            const storeGet3 = store.get(['t', 'w', 'o']);

            const indexGet1 = index.get(['five']);
            const indexGet2 = index.get([1, 'oh', 1]);
            const indexGet3 = index.get(['t', 'w', 'o']);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.equal('five');
                expect(storeGet2.result).to.equal('one');
                expect(storeGet3.result).to.equal('two');

                // Out-of-line keys aren't included in indexes
                expect(indexGet1.result).to.not.be.ok;
                expect(indexGet2.result).to.not.be.ok;
                expect(indexGet3.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet1.result).equal(undefined); // Safari returns null
                    expect(indexGet2.result).equal(undefined); // Safari returns null
                    expect(indexGet3.result).equal(undefined); // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get data using generated out-of-line keys', function (done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line-generated', 'readwrite');
            const store = tx.objectStore('out-of-line-generated');
            const index = store.index('inline-index');
            tx.onerror = done;

            store.add('one');
            store.add('two');
            store.add('three');
            store.add('four');
            store.add('five');

            const storeGet1 = store.get(4);
            const storeGet2 = store.get(2);
            const storeGet3 = store.get(5);

            const indexGet1 = index.get(4);
            const indexGet2 = index.get(2);
            const indexGet3 = index.get(5);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.equal('four');
                expect(storeGet2.result).to.equal('two');
                expect(storeGet3.result).to.equal('five');

                // Out-of-line keys aren't included in indexes
                expect(indexGet1.result).to.not.be.ok;
                expect(indexGet2.result).to.not.be.ok;
                expect(indexGet3.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet1.result).equal(undefined); // Safari returns null
                    expect(indexGet2.result).equal(undefined); // Safari returns null
                    expect(indexGet3.result).equal(undefined); // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get data using inline keys', function (done) {
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

            store.add({id: 'one'});
            store.add({id: 'two'});
            store.add({id: 'three'});
            store.add({id: 'four'});
            store.add({id: 'five'});

            const storeGet1 = store.get('four');
            const storeGet2 = store.get('five');
            const storeGet3 = store.get('two');

            const indexGet1 = index.get('four');
            const indexGet2 = index.get('five');
            const indexGet3 = index.get('two');

            tx.oncomplete = function () {
                expect(storeGet1.result).to.deep.equal({id: 'four'});
                expect(storeGet2.result).to.deep.equal({id: 'five'});
                expect(storeGet3.result).to.deep.equal({id: 'two'});

                expect(indexGet1.result).to.deep.equal({id: 'four'});
                expect(indexGet2.result).to.deep.equal({id: 'five'});
                expect(indexGet3.result).to.deep.equal({id: 'two'});

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should get data using compound inline keys', function (done) {
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('inline-compound', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline-compound', 'readwrite');
            const store = tx.objectStore('inline-compound');
            const index = store.index('inline-index');
            tx.onerror = function (event) {
                done(event.target.error);
            };

            store.add({id: 1, name: 'one'});
            store.add({id: 2, name: 'two'});
            store.add({id: 3, name: 'three'});
            store.add({id: 4, name: 'four'});
            store.add({id: 5, name: 'five'});

            const storeGet1 = store.get([3, 'three']);
            const storeGet2 = store.get([1, 'one']);
            const storeGet3 = store.get([5, 'five']);

            const indexGet1 = index.get(3);
            const indexGet2 = index.get(1);
            const indexGet3 = index.get(5);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.deep.equal({id: 3, name: 'three'});
                expect(storeGet2.result).to.deep.equal({id: 1, name: 'one'});
                expect(storeGet3.result).to.deep.equal({id: 5, name: 'five'});

                expect(indexGet1.result).to.deep.equal({id: 3, name: 'three'});
                expect(indexGet2.result).to.deep.equal({id: 1, name: 'one'});
                expect(indexGet3.result).to.deep.equal({id: 5, name: 'five'});

                db.close();
                done();
            };
        });
    });

    it('should get data using generated inline keys', function (done) {
        util.createDatabase('inline-generated', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline-generated', 'readwrite');
            const store = tx.objectStore('inline-generated');
            const index = store.index('inline-index');
            tx.onerror = function (event) {
                done(event.target.error);
            };

            store.add({name: 'one'});
            store.add({name: 'two'});
            store.add({name: 'three'});
            store.add({name: 'four'});
            store.add({name: 'five'});

            const storeGet1 = store.get(3);
            const storeGet2 = store.get(1);
            const storeGet3 = store.get(5);

            const indexGet1 = index.get(3);
            const indexGet2 = index.get(1);
            const indexGet3 = index.get(5);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.deep.equal({id: 3, name: 'three'});
                expect(storeGet2.result).to.deep.equal({id: 1, name: 'one'});
                expect(storeGet3.result).to.deep.equal({id: 5, name: 'five'});

                // BUG: Only Chrome supports indexes on generated inline keys
                if (env.isShimmed || env.browser.isChrome) {
                    expect(indexGet1.result).to.deep.equal({id: 3, name: 'three'});
                    expect(indexGet2.result).to.deep.equal({id: 1, name: 'one'});
                    expect(indexGet3.result).to.deep.equal({id: 5, name: 'five'});
                }

                db.close();
                done();
            };
        });
    });

    it('should get data using dotted keys', function (done) {
        util.createDatabase('dotted', 'dotted-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('dotted', 'readwrite');
            const store = tx.objectStore('dotted');
            const index = store.index('dotted-index');
            tx.onerror = done;

            store.add({name: {first: 'one'}});
            store.add({name: {first: 'two'}});
            store.add({name: {first: 'three'}});
            store.add({name: {first: 'four'}});
            store.add({name: {first: 'five'}});

            const storeGet1 = store.get('two');
            const storeGet2 = store.get('five');
            const storeGet3 = store.get('three');

            const indexGet1 = index.get('two');
            const indexGet2 = index.get('five');
            const indexGet3 = index.get('three');

            tx.oncomplete = function () {
                expect(storeGet1.result).to.deep.equal({name: {first: 'two'}});
                expect(storeGet2.result).to.deep.equal({name: {first: 'five'}});
                expect(storeGet3.result).to.deep.equal({name: {first: 'three'}});

                expect(indexGet1.result).to.deep.equal({name: {first: 'two'}});
                expect(indexGet2.result).to.deep.equal({name: {first: 'five'}});
                expect(indexGet3.result).to.deep.equal({name: {first: 'three'}});

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should get data using compound dotted keys', function (done) {
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('dotted-compound', 'compound-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('dotted-compound', 'readwrite');
            const store = tx.objectStore('dotted-compound');
            const index = store.index('compound-index');
            tx.onerror = done;

            store.add({id: 1, name: {first: 'one', last: 'abc'}});
            store.add({id: 1, name: {first: 'two', last: 'abc'}});
            store.add({id: 1, name: {first: 'three', last: 'abc'}});
            store.add({id: 1, name: {first: 'four', last: 'abc'}});
            store.add({id: 1, name: {first: 'five', last: 'abc'}});

            const storeGet1 = store.get([1, 'two', 'abc']);
            const storeGet2 = store.get([1, 'five', 'abc']);
            const storeGet3 = store.get([1, 'three', 'abc']);

            const indexGet1 = index.get([1, 'two', 'abc']);
            const indexGet2 = index.get([1, 'five', 'abc']);
            const indexGet3 = index.get([1, 'three', 'abc']);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.deep.equal({id: 1, name: {first: 'two', last: 'abc'}});
                expect(storeGet2.result).to.deep.equal({id: 1, name: {first: 'five', last: 'abc'}});
                expect(storeGet3.result).to.deep.equal({id: 1, name: {first: 'three', last: 'abc'}});

                expect(indexGet1.result).to.deep.equal({id: 1, name: {first: 'two', last: 'abc'}});
                expect(indexGet2.result).to.deep.equal({id: 1, name: {first: 'five', last: 'abc'}});
                expect(indexGet3.result).to.deep.equal({id: 1, name: {first: 'three', last: 'abc'}});

                db.close();
                done();
            };
        });
    });

    it('should get data using generated dotted keys', function (done) {
        this.timeout(5000);
        util.createDatabase('dotted-generated', 'dotted-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('dotted-generated', 'readwrite');
            const store = tx.objectStore('dotted-generated');
            const index = store.index('dotted-index');
            tx.onerror = done;

            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});

            const storeGet1 = store.get(4);
            const storeGet2 = store.get(5);
            const storeGet3 = store.get(1);

            const indexGet1 = index.get(4);
            const indexGet2 = index.get(5);
            const indexGet3 = index.get(1);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.deep.equal({name: {first: 4, last: 'abc'}});
                expect(storeGet2.result).to.deep.equal({name: {first: 5, last: 'abc'}});
                expect(storeGet3.result).to.deep.equal({name: {first: 1, last: 'abc'}});

                // BUG: Only Chrome supports indexes on generated inline keys
                if (env.isShimmed || env.isChrome) {
                    expect(indexGet1.result).to.deep.equal({name: {first: 4, last: 'abc'}});
                    expect(indexGet2.result).to.deep.equal({name: {first: 5, last: 'abc'}});
                    expect(indexGet3.result).to.deep.equal({name: {first: 1, last: 'abc'}});
                }

                db.close();
                done();
            };
        });
    });

    it('should allow these keys', function (done) {
        this.timeout(5000);
        util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line-generated', 'readwrite');
            const store = tx.objectStore('out-of-line-generated');
            const index = store.index('inline-index');
            let gettingCounter = 0, gottenCounter = 0;

            getKey(''); // empty string
            getKey(util.sampleData.veryLongString);// very long string
            getKey(0); // zero
            getKey(-99999); // negative number
            getKey(3.12345); // float
            getKey(Number.POSITIVE_INFINITY); // infinity
            getKey(Number.NEGATIVE_INFINITY); // negative infinity
            getKey(new Date(2000, 1, 2)); // Date

            if (env.isShimmed || !env.browser.isIE) {
                getKey([]); // empty array
                getKey(['a', '', 'b']); // array of strings
                getKey([1, 2.345, -678]); // array of numbers
                getKey([new Date(2005, 6, 7)]); // array of Dates
            }

            /**
             * @param {import('../../src/Key.js').Key} key
             * @returns {void}
             */
            function getKey (key) {
                gettingCounter++;
                const storeGet = store.get(key);
                const indexGet = index.get(key);
                storeGet.onerror = indexGet.onerror = done;
                storeGet.onsuccess = indexGet.onsuccess = function () {
                    gottenCounter++;
                };
            }

            tx.oncomplete = function () {
                // Make sure all the gets completed
                expect(gottenCounter).to.equal(gettingCounter * 2);

                db.close();
                done();
            };
        });
    });

    it('should not allow these keys', function (done) {
        this.timeout(10000);
        util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line-generated', 'readwrite');
            const store = tx.objectStore('out-of-line-generated');
            const index = store.index('inline-index');

            tryToGet(undefined); // undefined
            tryToGet(Number.NaN); // NaN
            tryToGet(true); // boolean
            tryToGet(false); // boolean
            tryToGet({}); // empty object
            tryToGet({foo: 'bar'}); // object
            tryToGet(new util.sampleData.Person('John')); // Class
            tryToGet([1, undefined, 2]); // array with undefined
            tryToGet([1, null, 2]); // array with null
            tryToGet([true, false]); // array of booleans
            tryToGet([{foo: 'bar'}]); // array of objects

            if (env.isShimmed || !env.browser.isIE) {
                tryToGet(/^regex$/v); // RegExp
            }

            /**
             * @param {import('../../src/Key.js').Key} key
             * @param {IDBObjectStore|IDBIndex} IDBObj
             * @returns {void}
             */
            function tryToGet (key, IDBObj) {
                if (!IDBObj) {
                    tryToGet(key, store);
                    tryToGet(key, index);
                } else {
                    let err = null;

                    try {
                        IDBObj.get(key);
                    } catch (e) {
                        err = e;
                    }

                    if (!env.isPolyfilled) {
                        expect(err).to.be.an.instanceOf(env.DOMException); // The polyfill throws a normal error
                    }
                    expect(err).to.be.ok;
                    expect(err.name).to.equal('DataError');
                }
            }

            db.close();
            done();
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should get multi-entry indexes', function (done) {
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

            store.add({id: 'a'});
            store.add({id: ['a']});
            store.add({id: ['b']});
            store.add({id: ['a', 'b', 'c']});
            store.add({id: [['a', [['b'], 'c']]]});

            const storeGet1 = store.get('a');
            const indexGet1 = index.get('a');

            const storeGet2 = store.get(['a']);
            const indexGet2 = index.get(['a']);

            const storeGet3 = store.get('b');
            const indexGet3 = index.get('b');

            const storeGet4 = store.get('c');
            const indexGet4 = index.get('c');

            const storeGet5 = store.get(['a', 'b', 'c']);
            const indexGet5 = index.get(['a', 'b', 'c']);

            const storeGet6 = store.get(['b']);
            const indexGet6 = index.get(['b']);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.deep.equal({id: 'a'});
                expect(storeGet2.result).to.deep.equal({id: ['a']});
                expect(storeGet3.result).equal(undefined);
                expect(storeGet4.result).equal(undefined);
                expect(storeGet5.result).to.deep.equal({id: ['a', 'b', 'c']});
                expect(storeGet6.result).to.deep.equal({id: ['b']});

                expect(indexGet1.result).to.deep.equal({id: 'a'});
                expect(indexGet2.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet2.result).equal(undefined); // Safari returns null
                }
                expect(indexGet3.result.id).to.include('b'); // Some browsers return different records
                expect(indexGet4.result).to.deep.equal({id: ['a', 'b', 'c']});
                expect(indexGet5.result).to.not.be.ok;
                expect(indexGet6.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet5.result).equal(undefined); // Safari returns null
                    expect(indexGet6.result).equal(undefined); // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should get unique, multi-entry indexes', function (done) {
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

            store.add({id: 'a'});
            store.add({id: ['b']});
            store.add({id: ['c', 'd', 'e']});

            const storeGet1 = store.get('a');
            const indexGet1 = index.get('a');

            const storeGet2 = store.get(['a']);
            const indexGet2 = index.get(['a']);

            const storeGet3 = store.get('b');
            const indexGet3 = index.get('b');

            const storeGet4 = store.get(['c']);
            const indexGet4 = index.get(['c']);

            const storeGet5 = store.get(['c', 'd', 'e']);
            const indexGet5 = index.get(['c', 'd', 'e']);

            tx.oncomplete = function () {
                expect(storeGet1.result).to.deep.equal({id: 'a'});
                expect(storeGet2.result).equal(undefined);
                expect(storeGet3.result).equal(undefined);
                expect(storeGet4.result).equal(undefined);
                expect(storeGet5.result).to.deep.equal({id: ['c', 'd', 'e']});

                expect(indexGet1.result).to.deep.equal({id: 'a'});
                expect(indexGet2.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet2.result).equal(undefined); // Safari returns null
                }
                expect(indexGet3.result).to.deep.equal({id: ['b']});
                expect(indexGet4.result).to.not.be.ok;
                expect(indexGet5.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet4.result).equal(undefined);
                    expect(indexGet5.result).equal(undefined); // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should not throw an error if called an incomplete compound key', function (done) {
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('inline-compound', 'compound-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline-compound', 'readwrite');
            const store = tx.objectStore('inline-compound');
            const index = store.index('compound-index');

            store.add({id: 12345, name: 'John Doe'});

            const storeGet = store.get([12345]); // <-- "id" is specified, but "name" is missing
            const indexGet = index.get([12345]); // <-- "id" is specified, but "name" is missing

            storeGet.onerror = sinon.spy();
            indexGet.onerror = sinon.spy();

            tx.oncomplete = function () {
                // Make sure no error was thrown
                sinon.assert.notCalled(storeGet.onerror);
                sinon.assert.notCalled(indexGet.onerror);

                // Make sure no data was returned
                expect(storeGet.result).equal(undefined);
                expect(indexGet.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet.result).equal(undefined); // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should throw an error if the transaction is closed', function (done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line-generated', 'readwrite');
            const store = tx.objectStore('out-of-line-generated');
            const index = store.index('inline-index');

            setTimeout(function () {
                let storeErr, indexErr;

                try {
                    store.get(1);
                } catch (e) {
                    storeErr = e;
                }

                try {
                    index.get(1);
                } catch (e) {
                    indexErr = e;
                }

                expect(storeErr).to.be.an.instanceOf(env.DOMException);
                expect(storeErr.name).to.equal('TransactionInactiveError');

                expect(indexErr).to.be.an.instanceOf(env.DOMException);
                expect(indexErr.name).to.equal('TransactionInactiveError');

                db.close();
                done();
            }, env.transactionDuration);
        });
    });

    it('should throw an error if called without params', function (done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('out-of-line-generated', 'readwrite');
            const store = tx.objectStore('out-of-line-generated');
            const index = store.index('inline-index');
            let storeErr, indexErr;

            try {
                store.get();
            } catch (e) {
                storeErr = e;
            }

            try {
                index.get();
            } catch (e) {
                indexErr = e;
            }

            expect(storeErr).to.be.an.instanceOf(TypeError);
            expect(storeErr.name).to.equal('TypeError');

            expect(indexErr).to.be.an.instanceOf(TypeError);
            expect(indexErr.name).to.equal('TypeError');

            db.close();
            done();
        });
    });
});

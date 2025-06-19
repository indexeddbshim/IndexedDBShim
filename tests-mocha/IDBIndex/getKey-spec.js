describe('IDBIndex.getKey', function () {
    'use strict';

    it('Index Get Key', function (done) {
        testHelper.createIndexesAndData((error, [key, value, objectStore, db]) => {
            if (error) {
                done(error);
                return;
            }
            const index = objectStore.index('Int Index');
            const req = index.getKey(value.Int);
            req.onsuccess = function () {
                expect(req.result, 'Got key from Index Get').to.equal(key);
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

            const key = index.getKey('foo');

            expect(key).to.be.an.instanceOf(IDBRequest);

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

            const key = index.getKey('foo');
            key.onerror = sinon.spy();

            key.onsuccess = sinon.spy(function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(key);
            });

            tx.oncomplete = function () {
                sinon.assert.calledOnce(key.onsuccess);
                sinon.assert.notCalled(key.onerror);

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

            let key;
            store.add({id: 1}).onsuccess = function () {
                key = index.getKey(1);
            };

            tx.oncomplete = function () {
                expect(key.result).to.deep.equal(1);

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

            let key;
            store.add({id: 1}).onsuccess = function () {
                key = index.getKey(2);
            };

            tx.oncomplete = function () {
                expect(key.result).to.not.be.ok;

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(key.result).equal(undefined); // Safari returns null
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
            const key1 = index.getKey(1);

            store.add({id: 2});
            store.add({id: 3});
            const key2 = index.getKey(2);
            const key3 = index.getKey(3);

            tx.oncomplete = function () {
                expect(key1.result).to.deep.equal(1);
                expect(key2.result).to.deep.equal(2);
                expect(key3.result).to.deep.equal(3);

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

            let key1, key2, key3, key4, key5;
            /**
             * @returns {void}
             */
            function transaction3 () {
                const tx = db.transaction('inline', 'readwrite');
                const store = tx.objectStore('inline');
                const index = store.index('inline-index');
                tx.onerror = done;
                tx.oncomplete = checkResults;

                key1 = index.getKey(1);
                key2 = index.getKey(2);
                key3 = index.getKey(3);
                key4 = index.getKey(4);
                key5 = index.getKey(5);
            }

            /**
             * @returns {void}
             */
            function checkResults () {
                expect(key1.result).to.deep.equal(1);
                expect(key2.result).to.deep.equal(2);
                expect(key3.result).to.deep.equal(3);
                expect(key4.result).to.deep.equal(4);
                expect(key5.result).to.deep.equal(5);

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
            tx.onerror = done;

            store.add('one', 101);
            store.add('two', 222);
            store.add('three', 3);
            store.add('four', 44);
            store.add('five', 555555);

            const key1 = index.getKey(555555);
            const key2 = index.getKey(3);
            const key3 = index.getKey(101);

            tx.oncomplete = function () {
                // Out-of-line keys aren't included in indexes
                expect(key1.result).to.not.be.ok;
                expect(key2.result).to.not.be.ok;
                expect(key3.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(key1.result).equal(undefined); // Safari returns null
                    expect(key2.result).equal(undefined); // Safari returns null
                    expect(key3.result).equal(undefined); // Safari returns null
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

            const key1 = index.getKey(['five']);
            const key2 = index.getKey([1, 'oh', 1]);
            const key3 = index.getKey(['t', 'w', 'o']);

            tx.oncomplete = function () {
                // Out-of-line keys aren't included in indexes
                expect(key1.result).to.not.be.ok;
                expect(key2.result).to.not.be.ok;
                expect(key3.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(key1.result).equal(undefined); // Safari returns null
                    expect(key2.result).equal(undefined); // Safari returns null
                    expect(key3.result).equal(undefined); // Safari returns null
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

            const key1 = index.getKey(4);
            const key2 = index.getKey(2);
            const key3 = index.getKey(5);

            tx.oncomplete = function () {
                // Out-of-line keys aren't included in indexes
                expect(key1.result).to.not.be.ok;
                expect(key2.result).to.not.be.ok;
                expect(key3.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(key1.result).equal(undefined); // Safari returns null
                    expect(key2.result).equal(undefined); // Safari returns null
                    expect(key3.result).equal(undefined); // Safari returns null
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

            const key1 = index.getKey('four');
            const key2 = index.getKey('five');
            const key3 = index.getKey('two');

            tx.oncomplete = function () {
                expect(key1.result).to.deep.equal('four');
                expect(key2.result).to.deep.equal('five');
                expect(key3.result).to.deep.equal('two');

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
            tx.onerror = done;

            store.add({id: 1, name: 'one'});
            store.add({id: 2, name: 'two'});
            store.add({id: 3, name: 'three'});
            store.add({id: 4, name: 'four'});
            store.add({id: 5, name: 'five'});

            const key1 = index.getKey(3);
            const key2 = index.getKey(1);
            const key3 = index.getKey(5);

            tx.oncomplete = function () {
                expect(key1.result).to.deep.equal([3, 'three']);
                expect(key2.result).to.deep.equal([1, 'one']);
                expect(key3.result).to.deep.equal([5, 'five']);

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
            tx.onerror = done;

            store.add({name: 'one'});
            store.add({name: 'two'});
            store.add({name: 'three'});
            store.add({name: 'four'});
            store.add({name: 'five'});

            const key1 = index.getKey(3);
            const key2 = index.getKey(1);
            const key3 = index.getKey(5);

            tx.oncomplete = function () {
                // BUG: Only Chrome supports indexes on generated inline keys
                if (env.isShimmed || env.isChrome) {
                    expect(key1.result).to.deep.equal(3);
                    expect(key2.result).to.deep.equal(1);
                    expect(key3.result).to.deep.equal(5);
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

            const key1 = index.getKey('two');
            const key2 = index.getKey('five');
            const key3 = index.getKey('three');

            tx.oncomplete = function () {
                expect(key1.result).to.deep.equal('two');
                expect(key2.result).to.deep.equal('five');
                expect(key3.result).to.deep.equal('three');

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

            const key1 = index.getKey([1, 'two', 'abc']);
            const key2 = index.getKey([1, 'five', 'abc']);
            const key3 = index.getKey([1, 'three', 'abc']);

            tx.oncomplete = function () {
                expect(key1.result).to.deep.equal([1, 'two', 'abc']);
                expect(key2.result).to.deep.equal([1, 'five', 'abc']);
                expect(key3.result).to.deep.equal([1, 'three', 'abc']);

                db.close();
                done();
            };
        });
    });

    it('should get data using generated dotted keys', function (done) {
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

            const key1 = index.getKey(4);
            const key2 = index.getKey(5);
            const key3 = index.getKey(1);

            tx.oncomplete = function () {
                // BUG: Only Chrome supports indexes on generated inline keys
                if (env.isShimmed || env.isChrome) {
                    expect(key1.result).to.deep.equal(4);
                    expect(key2.result).to.deep.equal(5);
                    expect(key3.result).to.deep.equal(1);
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
             * @param {import('../../src/Key.js').Key} theKey
             * @returns {void}
             */
            function getKey (theKey) {
                gettingCounter++;
                const key = index.getKey(theKey);
                key.onerror = done;
                key.onsuccess = function () {
                    gottenCounter++;
                };
            }

            tx.oncomplete = function () {
                // Make sure all the gets completed
                expect(gottenCounter).to.equal(gettingCounter);

                db.close();
                done();
            };
        });
    });

    it('should not allow these keys', function (done) {
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
             * @returns {void}
             */
            function tryToGet (key) {
                let err = null;

                try {
                    index.getKey(key);
                } catch (e) {
                    err = e;
                }

                if (!env.isPolyfilled) {
                    expect(err).to.be.an.instanceOf(env.DOMException); // The polyfill throws a normal error
                }
                expect(err).to.be.ok;
                expect(err.name).to.equal('DataError');
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

            const key1 = index.getKey('a');
            const key2 = index.getKey(['a']);
            const key3 = index.getKey('b');
            const key4 = index.getKey('c');
            const key5 = index.getKey(['a', 'b', 'c']);

            tx.oncomplete = function () {
                expect(key1.result).to.deep.equal('a');
                expect(key2.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(key2.result).equal(undefined); // Safari returns null
                }
                expect(key3.result).to.include('b'); // Some browsers return different records
                expect(key4.result).to.deep.equal(['a', 'b', 'c']);
                expect(key5.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(key5.result).equal(undefined); // Safari returns null
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

            const key1 = index.getKey('a');
            const key2 = index.getKey(['a']);
            const key3 = index.getKey('b');
            const key4 = index.getKey(['c']);
            const key5 = index.getKey(['c', 'd', 'e']);

            tx.oncomplete = function () {
                expect(key1.result).to.deep.equal('a');
                expect(key2.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(key2.result).equal(undefined); // Safari returns null
                }
                expect(key3.result).to.deep.equal(['b']);
                expect(key4.result).to.not.be.ok;
                expect(key5.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(key4.result).equal(undefined);
                    expect(key5.result).equal(undefined); // Safari returns null
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

            const key = index.getKey([12345]); // <-- "id" is specified, but "name" is missing
            key.onerror = sinon.spy();

            tx.oncomplete = function () {
                // Make sure no error was thrown
                sinon.assert.notCalled(key.onerror);

                // Make sure no data was returned
                expect(key.result).to.not.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(key.result).equal(undefined); // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should throw an error if the transaction is closed', function (done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
            const tx = db.transaction('out-of-line-generated', 'readwrite');
            const store = tx.objectStore('out-of-line-generated');
            const index = store.index('inline-index');

            setTimeout(function () {
                try {
                    index.getKey(1);
                } catch (e) {
                    err = e;
                }

                expect(err).to.be.an.instanceOf(env.DOMException);
                expect(err.name).to.equal('TransactionInactiveError');

                db.close();
                done();
            }, env.transactionDuration);
        });
    });

    it('should throw an error if called without params', function (done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
            const tx = db.transaction('out-of-line-generated', 'readwrite');
            const store = tx.objectStore('out-of-line-generated');
            const index = store.index('inline-index');

            try {
                index.getKey();
            } catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.name).to.equal('TypeError');

            db.close();
            done();
        });
    });
});

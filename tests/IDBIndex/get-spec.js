describe('IDBIndex.get', function() {
    'use strict';

    it('should return an IDBRequest', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            var storeGet = store.get('foo');
            var indexGet = index.get('foo');

            expect(storeGet).to.be.an.instanceOf(IDBRequest);
            expect(indexGet).to.be.an.instanceOf(IDBRequest);

            tx.oncomplete = function() {
                db.close();
                done();
            };
        });
    });

    it('should pass the IDBRequest event to the onsuccess callback', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            var storeGet = store.get('foo');
            var indexGet = index.get('foo');

            storeGet.onerror = sinon.spy();
            indexGet.onerror = sinon.spy();

            storeGet.onsuccess = sinon.spy(function(event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(storeGet);
            });

            indexGet.onsuccess = sinon.spy(function(event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(indexGet);
            });

            tx.oncomplete = function() {
                sinon.assert.calledOnce(storeGet.onsuccess);
                sinon.assert.calledOnce(indexGet.onsuccess);

                sinon.assert.notCalled(storeGet.onerror);
                sinon.assert.notCalled(indexGet.onerror);

                db.close();
                done();
            };
        });
    });

    it('should get a record', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            var storeGet, indexGet;
            store.add({id: 1}).onsuccess = function() {
                storeGet = store.get(1);
                indexGet = index.get(1);
            };

            tx.oncomplete = function() {
                expect(storeGet.result).to.deep.equal({id: 1});
                expect(indexGet.result).to.deep.equal({id: 1});

                db.close();
                done();
            };
        });
    });

    it('should not get a record if the key is not found', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            var storeGet, indexGet;
            store.add({id: 1}).onsuccess = function() {
                storeGet = store.get(2);
                indexGet = index.get(2);
            };

            tx.oncomplete = function() {
                expect(storeGet.result).not.to.be.ok;
                expect(indexGet.result).not.to.be.ok;

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(storeGet.result).to.be.undefined;    // Safari returns null
                    expect(indexGet.result).to.be.undefined;    // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get records immediately after creating them', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            store.add({id: 1});
            var storeGet1 = store.get(1);
            var indexGet1 = index.get(1);

            store.add({id: 2});
            store.add({id: 3});
            var storeGet2 = store.get(2);
            var storeGet3 = store.get(3);
            var indexGet2 = index.get(2);
            var indexGet3 = index.get(3);

            tx.oncomplete = function() {
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

    it('should get records from previous transactions', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            transaction1();

            function transaction1() {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = transaction2;

                store.add({id: 1});
                store.add({id: 2});
                store.add({id: 3});
            }

            function transaction2() {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = transaction3;

                store.add({id: 4});
                store.add({id: 5});
            }

            var storeGet1, storeGet2, storeGet3, storeGet4, storeGet5,
                indexGet1, indexGet2, indexGet3, indexGet4, indexGet5;

            function transaction3() {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                var index = store.index('inline-index');
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

            function checkResults() {
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

    it('should get data using out-of-line keys', function(done) {
        util.createDatabase('out-of-line', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line', 'readwrite');
            var store = tx.objectStore('out-of-line');
            var index = store.index('inline-index');
            tx.onerror = function(event) {
                done(event.target.error);
            };

            store.add('one', 101);
            store.add('two', 222);
            store.add('three', 3);
            store.add('four', 44);
            store.add('five', 555555);

            var storeGet1 = store.get(555555);
            var storeGet2 = store.get(3);
            var storeGet3 = store.get(101);

            var indexGet1 = index.get(555555);
            var indexGet2 = index.get(3);
            var indexGet3 = index.get(101);

            tx.oncomplete = function() {
                expect(storeGet1.result).to.equal('five');
                expect(storeGet2.result).to.equal('three');
                expect(storeGet3.result).to.equal('one');

                // Out-of-line keys aren't included in indexes
                expect(indexGet1.result).not.to.be.ok;
                expect(indexGet2.result).not.to.be.ok;
                expect(indexGet3.result).not.to.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet1.result).to.be.undefined;   // Safari returns null
                    expect(indexGet2.result).to.be.undefined;   // Safari returns null
                    expect(indexGet3.result).to.be.undefined;   // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get data using compound out-of-line keys', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('out-of-line-compound', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line-compound', 'readwrite');
            var store = tx.objectStore('out-of-line-compound');
            var index = store.index('inline-index');
            tx.onerror = done;

            store.add('one', [1, 'oh', 1]);
            store.add('two', ['t', 'w', 'o']);
            store.add('three', [3, 3]);
            store.add('four', [4, '4']);
            store.add('five', ['five']);

            var storeGet1 = store.get(['five']);
            var storeGet2 = store.get([1, 'oh', 1]);
            var storeGet3 = store.get(['t', 'w', 'o']);

            var indexGet1 = index.get(['five']);
            var indexGet2 = index.get([1, 'oh', 1]);
            var indexGet3 = index.get(['t', 'w', 'o']);

            tx.oncomplete = function() {
                expect(storeGet1.result).to.equal('five');
                expect(storeGet2.result).to.equal('one');
                expect(storeGet3.result).to.equal('two');

                // Out-of-line keys aren't included in indexes
                expect(indexGet1.result).not.to.be.ok;
                expect(indexGet2.result).not.to.be.ok;
                expect(indexGet3.result).not.to.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet1.result).to.be.undefined;   // Safari returns null
                    expect(indexGet2.result).to.be.undefined;   // Safari returns null
                    expect(indexGet3.result).to.be.undefined;   // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get data using generated out-of-line keys', function(done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var index = store.index('inline-index');
            tx.onerror = done;

            store.add('one');
            store.add('two');
            store.add('three');
            store.add('four');
            store.add('five');

            var storeGet1 = store.get(4);
            var storeGet2 = store.get(2);
            var storeGet3 = store.get(5);

            var indexGet1 = index.get(4);
            var indexGet2 = index.get(2);
            var indexGet3 = index.get(5);

            tx.oncomplete = function() {
                expect(storeGet1.result).to.equal('four');
                expect(storeGet2.result).to.equal('two');
                expect(storeGet3.result).to.equal('five');

                // Out-of-line keys aren't included in indexes
                expect(indexGet1.result).not.to.be.ok;
                expect(indexGet2.result).not.to.be.ok;
                expect(indexGet3.result).not.to.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet1.result).to.be.undefined;   // Safari returns null
                    expect(indexGet2.result).to.be.undefined;   // Safari returns null
                    expect(indexGet3.result).to.be.undefined;   // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get data using inline keys', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            store.add({id: 'one'});
            store.add({id: 'two'});
            store.add({id: 'three'});
            store.add({id: 'four'});
            store.add({id: 'five'});

            var storeGet1 = store.get('four');
            var storeGet2 = store.get('five');
            var storeGet3 = store.get('two');

            var indexGet1 = index.get('four');
            var indexGet2 = index.get('five');
            var indexGet3 = index.get('two');

            tx.oncomplete = function() {
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

    it('should get data using compound inline keys', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline-compound', 'inline-index', function(err, db) {
            var tx = db.transaction('inline-compound', 'readwrite');
            var store = tx.objectStore('inline-compound');
            var index = store.index('inline-index');
            tx.onerror = function(event) {
                done(event.target.error);
            };

            store.add({id: 1, name: 'one'});
            store.add({id: 2, name: 'two'});
            store.add({id: 3, name: 'three'});
            store.add({id: 4, name: 'four'});
            store.add({id: 5, name: 'five'});

            var storeGet1 = store.get([3, 'three']);
            var storeGet2 = store.get([1, 'one']);
            var storeGet3 = store.get([5, 'five']);

            var indexGet1 = index.get(3);
            var indexGet2 = index.get(1);
            var indexGet3 = index.get(5);

            tx.oncomplete = function() {
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

    it('should get data using generated inline keys', function(done) {
        util.createDatabase('inline-generated', 'inline-index', function(err, db) {
            var tx = db.transaction('inline-generated', 'readwrite');
            var store = tx.objectStore('inline-generated');
            var index = store.index('inline-index');
            tx.onerror = function(event) {
                done(event.target.error);
            };

            store.add({name: 'one'});
            store.add({name: 'two'});
            store.add({name: 'three'});
            store.add({name: 'four'});
            store.add({name: 'five'});

            var storeGet1 = store.get(3);
            var storeGet2 = store.get(1);
            var storeGet3 = store.get(5);

            var indexGet1 = index.get(3);
            var indexGet2 = index.get(1);
            var indexGet3 = index.get(5);

            tx.oncomplete = function() {
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

    it('should get data using dotted keys', function(done) {
        util.createDatabase('dotted', 'dotted-index', function(err, db) {
            var tx = db.transaction('dotted', 'readwrite');
            var store = tx.objectStore('dotted');
            var index = store.index('dotted-index');
            tx.onerror = done;

            store.add({name: {first: 'one'}});
            store.add({name: {first: 'two'}});
            store.add({name: {first: 'three'}});
            store.add({name: {first: 'four'}});
            store.add({name: {first: 'five'}});

            var storeGet1 = store.get('two');
            var storeGet2 = store.get('five');
            var storeGet3 = store.get('three');

            var indexGet1 = index.get('two');
            var indexGet2 = index.get('five');
            var indexGet3 = index.get('three');

            tx.oncomplete = function() {
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

    it('should get data using compound dotted keys', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('dotted-compound', 'compound-index', function(err, db) {
            var tx = db.transaction('dotted-compound', 'readwrite');
            var store = tx.objectStore('dotted-compound');
            var index = store.index('compound-index');
            tx.onerror = done;

            store.add({id: 1, name: {first: 'one', last: 'abc'}});
            store.add({id: 1, name: {first: 'two', last: 'abc'}});
            store.add({id: 1, name: {first: 'three', last: 'abc'}});
            store.add({id: 1, name: {first: 'four', last: 'abc'}});
            store.add({id: 1, name: {first: 'five', last: 'abc'}});

            var storeGet1 = store.get([1, 'two', 'abc']);
            var storeGet2 = store.get([1, 'five', 'abc']);
            var storeGet3 = store.get([1, 'three', 'abc']);

            var indexGet1 = index.get([1, 'two', 'abc']);
            var indexGet2 = index.get([1, 'five', 'abc']);
            var indexGet3 = index.get([1, 'three', 'abc']);

            tx.oncomplete = function() {
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

    it('should get data using generated dotted keys', function(done) {
        util.createDatabase('dotted-generated', 'dotted-index', function(err, db) {
            var tx = db.transaction('dotted-generated', 'readwrite');
            var store = tx.objectStore('dotted-generated');
            var index = store.index('dotted-index');
            tx.onerror = done;

            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});

            var storeGet1 = store.get(4);
            var storeGet2 = store.get(5);
            var storeGet3 = store.get(1);

            var indexGet1 = index.get(4);
            var indexGet2 = index.get(5);
            var indexGet3 = index.get(1);

            tx.oncomplete = function() {
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

    it('should allow these keys', function(done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var index = store.index('inline-index');
            var gettingCounter = 0, gottenCounter = 0;

            getKey('');                            // empty string
            getKey(0);                             // zero
            getKey(-99999);                        // negative number
            getKey(3.12345);                       // float
            getKey(Infinity);                      // infinity
            getKey(-Infinity);                     // negative infinity
            getKey(new Date(2000, 1, 2));          // Date

            if (env.isShimmed || !env.browser.isIE) {
                getKey([]);                        // empty array
                getKey(['a', '', 'b']);            // array of strings
                getKey([1, 2.345, -678]);          // array of numbers
                getKey([new Date(2005, 6, 7)]);    // array of Dates
            }

            function getKey(key) {
                gettingCounter++;
                var storeGet = store.get(key);
                var indexGet = index.get(key);
                storeGet.onerror = indexGet.onerror = done;
                storeGet.onsuccess = indexGet.onsuccess = function() {
                    gottenCounter++;
                };
            }

            tx.oncomplete = function() {
                // Make sure all the gets completed
                expect(gottenCounter).to.equal(gettingCounter * 2);

                db.close();
                done();
            };
        });
    });

    it('should not allow these keys', function(done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var index = store.index('inline-index');

            tryToGet(undefined);                // undefined
            tryToGet(NaN);                      // NaN
            tryToGet(true);                     // boolean
            tryToGet(false);                    // boolean
            tryToGet({});                       // empty object
            tryToGet({foo: 'bar'});             // object
            tryToGet(new util.Person('John'));  // Class
            tryToGet([1, undefined, 2]);        // array with undefined
            tryToGet([1, null, 2]);             // array with null
            tryToGet([true, false]);            // array of booleans
            tryToGet([{foo: 'bar'}]);           // array of objects

            if (env.isShimmed || !env.browser.isIE) {
                tryToGet(/^regex$/);            // RegExp
            }

            function tryToGet(key, IDBObj) {
                if (!IDBObj) {
                    tryToGet(key, store);
                    tryToGet(key, index);
                }
                else {
                    var err = null;

                    try {
                        IDBObj.get(key);
                    }
                    catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(env.DOMException);
                    expect(err.name).to.equal('DataError');
                }
            }

            db.close();
            done();
        });
    });

    it('should get multi-entry indexes', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support multi-entry indexes
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline', 'multi-entry-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('multi-entry-index');
            tx.onerror = done;

            store.add({id: 'a'});
            store.add({id: ['a']});
            store.add({id: ['b']});
            store.add({id: ['a', 'b', 'c']});
            store.add({id: [['a', [['b'], 'c']]]});

            var storeGet1 = store.get('a');
            var indexGet1 = index.get('a');

            var storeGet2 = store.get(['a']);
            var indexGet2 = index.get(['a']);

            var storeGet3 = store.get('b');
            var indexGet3 = index.get('b');

            var storeGet4 = store.get('c');
            var indexGet4 = index.get('c');

            var storeGet5 = store.get(['a', 'b', 'c']);
            var indexGet5 = index.get(['a', 'b', 'c']);

            var storeGet6 = store.get(['b']);
            var indexGet6 = index.get(['b']);


            tx.oncomplete = function() {
                expect(storeGet1.result).to.deep.equal({id: 'a'});
                expect(storeGet2.result).to.deep.equal({id: ['a']});
                expect(storeGet3.result).to.be.undefined;
                expect(storeGet4.result).to.be.undefined;
                expect(storeGet5.result).to.deep.equal({id: ['a', 'b', 'c']});
                expect(storeGet6.result).to.deep.equal({id: ['b']});

                expect(indexGet1.result).to.deep.equal({id: 'a'});
                expect(indexGet2.result).not.to.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet2.result).to.be.undefined;     // Safari returns null
                }
                expect(indexGet3.result.id).to.include('b');      // Some browsers return different records
                expect(indexGet4.result).to.deep.equal({id: ['a', 'b', 'c']});
                expect(indexGet5.result).not.to.be.ok;
                expect(indexGet6.result).not.to.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet5.result).to.be.undefined;     // Safari returns null
                    expect(indexGet6.result).to.be.undefined;     // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get unique, multi-entry indexes', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support multi-entry indexes
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline', 'unique-multi-entry-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('unique-multi-entry-index');
            tx.onerror = done;

            store.add({id: 'a'});
            store.add({id: ['b']});
            store.add({id: ['c', 'd', 'e']});

            var storeGet1 = store.get('a');
            var indexGet1 = index.get('a');

            var storeGet2 = store.get(['a']);
            var indexGet2 = index.get(['a']);

            var storeGet3 = store.get('b');
            var indexGet3 = index.get('b');

            var storeGet4 = store.get(['c']);
            var indexGet4 = index.get(['c']);

            var storeGet5 = store.get(['c', 'd', 'e']);
            var indexGet5 = index.get(['c', 'd', 'e']);


            tx.oncomplete = function() {
                expect(storeGet1.result).to.deep.equal({id: 'a'});
                expect(storeGet2.result).to.be.undefined;
                expect(storeGet3.result).to.be.undefined;
                expect(storeGet4.result).to.be.undefined;
                expect(storeGet5.result).to.deep.equal({id: ['c', 'd', 'e']});

                expect(indexGet1.result).to.deep.equal({id: 'a'});
                expect(indexGet2.result).not.to.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet2.result).to.be.undefined;     // Safari returns null
                }
                expect(indexGet3.result).to.deep.equal({id: ['b']});
                expect(indexGet4.result).not.to.be.ok;
                expect(indexGet5.result).not.to.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet4.result).to.be.undefined;
                    expect(indexGet5.result).to.be.undefined;     // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should not throw an error if called an incomplete compound key', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline-compound', 'compound-index', function(err, db) {
            var tx = db.transaction('inline-compound', 'readwrite');
            var store = tx.objectStore('inline-compound');
            var index = store.index('compound-index');

            store.add({id: 12345, name: 'John Doe'});

            var storeGet = store.get([12345]);            // <-- "id" is specified, but "name" is missing
            var indexGet = index.get([12345]);            // <-- "id" is specified, but "name" is missing

            storeGet.onerror = sinon.spy();
            indexGet.onerror = sinon.spy();

            tx.oncomplete = function() {
                // Make sure no error was thrown
                sinon.assert.notCalled(storeGet.onerror);
                sinon.assert.notCalled(indexGet.onerror);

                // Make sure no data was returned
                expect(storeGet.result).to.be.undefined;
                expect(indexGet.result).not.to.be.ok;
                if (env.isShimmed || !env.browser.isSafari) {
                    expect(indexGet.result).to.be.undefined;    // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should throw an error if the transaction is closed', function(done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var index = store.index('inline-index');

            setTimeout(function() {
                var storeErr, indexErr;

                try {
                    store.get(1);
                }
                catch (e) {
                    storeErr = e;
                }

                try {
                    index.get(1);
                }
                catch (e) {
                    indexErr = e;
                }

                expect(storeErr).to.be.an.instanceOf(env.DOMException);
                expect(storeErr.name).to.equal('TransactionInactiveError');

                expect(indexErr).to.be.an.instanceOf(env.DOMException);
                expect(indexErr.name).to.equal('TransactionInactiveError');

                db.close();
                done();
            }, 50);
        });
    });

    it('should throw an error if called without params', function(done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var index = store.index('inline-index');
            var storeErr, indexErr;

            try {
                store.get();
            }
            catch (e) {
                storeErr = e;
            }

            try {
                index.get();
            }
            catch (e) {
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

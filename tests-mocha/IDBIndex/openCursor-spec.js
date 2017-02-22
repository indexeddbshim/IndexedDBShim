/* eslint-disable no-var, no-unused-expressions */
describe('IDBIndex.openCursor', function () {
    'use strict';

    it('should return an IDBRequest', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = function (event) {
                done(event.target.error);
            };

            var storeCursor = store.openCursor('foo');
            var indexCursor = index.openCursor('foo');

            expect(storeCursor).to.be.an.instanceOf(IDBRequest);
            expect(indexCursor).to.be.an.instanceOf(IDBRequest);

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
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            var storeCursor = store.openCursor('foo');
            var indexCursor = index.openCursor('foo');

            storeCursor.onerror = sinon.spy();
            indexCursor.onerror = sinon.spy();

            storeCursor.onsuccess = sinon.spy(function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(storeCursor);
            });

            indexCursor.onsuccess = sinon.spy(function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(indexCursor);
            });

            tx.oncomplete = function () {
                sinon.assert.calledOnce(storeCursor.onsuccess);
                sinon.assert.calledOnce(indexCursor.onsuccess);

                sinon.assert.notCalled(storeCursor.onerror);
                sinon.assert.notCalled(indexCursor.onerror);

                db.close();
                done();
            };
        });
    });

    it('should set IDBRequest.result to the IDBCursor', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            store.add({id: 1, name: 'John Doe'});

            var storeCursor = store.openCursor(1);
            var indexCursor = index.openCursor(1);

            storeCursor.onerror = sinon.spy();
            indexCursor.onerror = sinon.spy();

            storeCursor.onsuccess = sinon.spy(function (event) {
                expect(storeCursor.result).to.be.an.instanceOf(IDBCursor);
                expect(storeCursor.result.source).to.equal(store);
                expect(storeCursor.result.direction).to.equal('next');
                expect(storeCursor.result.primaryKey).to.equal(1);
                expect(storeCursor.result.key).to.equal(1);
                expect(storeCursor.result.value).to.deep.equal({id: 1, name: 'John Doe'});
            });

            indexCursor.onsuccess = sinon.spy(function (event) {
                expect(indexCursor.result).to.be.an.instanceOf(IDBCursor);
                expect(indexCursor.result.source).to.equal(index);
                expect(indexCursor.result.direction).to.equal('next');
                expect(indexCursor.result.primaryKey).to.equal(1);
                expect(indexCursor.result.key).to.equal(1);
                expect(indexCursor.result.value).to.deep.equal({id: 1, name: 'John Doe'});
            });

            tx.oncomplete = function () {
                sinon.assert.calledOnce(storeCursor.onsuccess);
                sinon.assert.calledOnce(indexCursor.onsuccess);

                sinon.assert.notCalled(storeCursor.onerror);
                sinon.assert.notCalled(indexCursor.onerror);

                db.close();
                done();
            };
        });
    });

    it('should get zero records', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            var storeCursor = store.openCursor(IDBKeyRange.only('foo'));
            var indexCursor = index.openCursor(IDBKeyRange.only('foo'));

            storeCursor.onerror = sinon.spy();
            indexCursor.onerror = sinon.spy();

            storeCursor.onsuccess = sinon.spy(function (event) {
                expect(storeCursor.result).equal(null);
            });

            indexCursor.onsuccess = sinon.spy(function (event) {
                expect(indexCursor.result).equal(null);
            });

            tx.oncomplete = function () {
                sinon.assert.calledOnce(storeCursor.onsuccess);
                sinon.assert.calledOnce(indexCursor.onsuccess);

                sinon.assert.notCalled(storeCursor.onerror);
                sinon.assert.notCalled(indexCursor.onerror);

                db.close();
                done();
            };
        });
    });

    it('should get one record', function (done) {
        this.timeout(8000);
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            store.add({id: 1, name: 'John Doe'});

            var storeCursor = store.openCursor(IDBKeyRange.only(1));
            var indexCursor = index.openCursor(IDBKeyRange.only(1));

            storeCursor.onerror = sinon.spy();
            indexCursor.onerror = sinon.spy();

            storeCursor.onsuccess = sinon.spy(function (event) {
                expect(storeCursor.result).to.be.an.instanceOf(IDBCursor);
                expect(storeCursor.result.source).to.equal(store);
                expect(storeCursor.result.direction).to.equal('next');
                expect(storeCursor.result.primaryKey).to.equal(1);
                expect(storeCursor.result.key).to.equal(1);
                expect(storeCursor.result.value).to.deep.equal({id: 1, name: 'John Doe'});
            });

            indexCursor.onsuccess = sinon.spy(function (event) {
                expect(indexCursor.result).to.be.an.instanceOf(IDBCursor);
                expect(indexCursor.result.source).to.equal(index);
                expect(indexCursor.result.direction).to.equal('next');
                expect(indexCursor.result.primaryKey).to.equal(1);
                expect(indexCursor.result.key).to.equal(1);
                expect(indexCursor.result.value).to.deep.equal({id: 1, name: 'John Doe'});
            });

            tx.oncomplete = function () {
                sinon.assert.calledOnce(storeCursor.onsuccess);
                sinon.assert.calledOnce(indexCursor.onsuccess);

                sinon.assert.notCalled(storeCursor.onerror);
                sinon.assert.notCalled(indexCursor.onerror);

                db.close();
                done();
            };
        });
    });

    it('should get all records', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = done;

            // Added BEFORE opening the cursor
            store.add({id: 1});
            store.add({id: 2});
            store.add({id: 3});

            var storeCursor = store.openCursor();
            var indexCursor = index.openCursor();
            var storeCounter = 0, indexCounter = 0;

            storeCursor.onsuccess = sinon.spy(function (event) {
                if (storeCursor.result) {
                    storeCounter++;
                    expect(storeCursor.result.source).to.equal(store);
                    expect(storeCursor.result.direction).to.equal('next');
                    expect(storeCursor.result.primaryKey).to.equal(storeCounter);
                    expect(storeCursor.result.key).to.equal(storeCounter);
                    expect(storeCursor.result.value).to.deep.equal({id: storeCounter});
                    storeCursor.result.continue();
                }
            });

            indexCursor.onsuccess = sinon.spy(function (event) {
                if (indexCursor.result) {
                    indexCounter++;
                    expect(indexCursor.result.source).to.equal(index);
                    expect(indexCursor.result.direction).to.equal('next');
                    expect(indexCursor.result.primaryKey).to.equal(indexCounter);
                    expect(indexCursor.result.key).to.equal(indexCounter);
                    expect(indexCursor.result.value).to.deep.equal({id: indexCounter});
                    indexCursor.result.continue();
                }
            });

            // Added AFTER opening the cursor
            store.add({id: 4});
            store.add({id: 5});

            tx.oncomplete = function () {
                sinon.assert.callCount(storeCursor.onsuccess, 6);
                sinon.assert.callCount(indexCursor.onsuccess, 6);
                db.close();
                done();
            };
        });
    });

    it('should allow multiple simultaneous cursors', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            tx.onerror = function (event) {
                done(event.target.error.message);
            };

            store.add({id: 1});
            store.add({id: 2});
            store.add({id: 3});
            store.add({id: 4});
            store.add({id: 5});

            var cursor1 = store.openCursor(IDBKeyRange.lowerBound(0), 'next');
            var cursor2 = store.openCursor(IDBKeyRange.lowerBound(0), 'prev');

            var counter1 = 1, counter2 = 5;

            cursor1.onsuccess = sinon.spy(function (event) {
                if (cursor1.result) {
                    expect(cursor1.result.key).to.equal(counter1++);
                    cursor1.result.continue();
                }
            });

            cursor2.onsuccess = sinon.spy(function (event) {
                if (cursor2.result) {
                    expect(cursor2.result.key).to.equal(counter2--);
                    cursor2.result.continue();
                }
            });

            tx.oncomplete = function () {
                sinon.assert.callCount(cursor1.onsuccess, 6);
                sinon.assert.callCount(cursor2.onsuccess, 6);
                db.close();
                done();
            };
        });
    });

    it('should get hundreds of records', function (done) {
        this.timeout(25000);
        this.slow(25000);

        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            tx.onerror = function (event) {
                done(event.target.error.message);
            };

            for (var i = 1; i < 500; i++) {
                store.add({id: i});
            }

            var storeCursor = store.openCursor();
            var indexCursor = index.openCursor();
            var storeCounter = 0, indexCounter = 0;

            storeCursor.onsuccess = sinon.spy(function (event) {
                if (storeCursor.result) {
                    storeCounter++;
                    expect(storeCursor.result.source).to.equal(store);
                    expect(storeCursor.result.direction).to.equal('next');
                    expect(storeCursor.result.primaryKey).to.equal(storeCounter);
                    expect(storeCursor.result.key).to.equal(storeCounter);
                    expect(storeCursor.result.value).to.deep.equal({id: storeCounter});
                    storeCursor.result.continue();
                }
            });

            indexCursor.onsuccess = sinon.spy(function (event) {
                if (indexCursor.result) {
                    indexCounter++;
                    expect(indexCursor.result.source).to.equal(index);
                    expect(indexCursor.result.direction).to.equal('next');
                    expect(indexCursor.result.primaryKey).to.equal(indexCounter);
                    expect(indexCursor.result.key).to.equal(indexCounter);
                    expect(indexCursor.result.value).to.deep.equal({id: indexCounter});
                    indexCursor.result.continue();
                }
            });

            tx.oncomplete = function () {
                sinon.assert.callCount(storeCursor.onsuccess, 500);
                sinon.assert.callCount(indexCursor.onsuccess, 500);
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
            var storeCursor, indexCursor, storeCounter = 0, indexCounter = 0;
            transaction1();

            function transaction1 () {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = transaction2;

                store.add({id: 1});
                store.add({id: 2});
                store.add({id: 3});
            }

            function transaction2 () {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = transaction3;

                store.add({id: 4});
                store.add({id: 5});
            }

            function transaction3 () {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                var index = store.index('inline-index');
                tx.onerror = done;

                storeCursor = store.openCursor();
                indexCursor = index.openCursor();

                storeCursor.onsuccess = sinon.spy(function (event) {
                    if (storeCursor.result) {
                        expect(storeCursor.result.key).to.equal(++storeCounter);
                        storeCursor.result.continue();
                    }
                });

                indexCursor.onsuccess = sinon.spy(function (event) {
                    if (indexCursor.result) {
                        expect(indexCursor.result.key).to.equal(++indexCounter);
                        indexCursor.result.continue();
                    }
                });

                tx.oncomplete = function () {
                    sinon.assert.callCount(storeCursor.onsuccess, 6);
                    sinon.assert.callCount(indexCursor.onsuccess, 6);
                    db.close();
                    done();
                };
            }
        });
    });

    it('should allow these keys', function (done) {
        this.timeout(10000);
        util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var index = store.index('inline-index');
            var gettingCounter = 0, gottenCounter = 0;

            getKey('');                            // empty string
            getKey(util.sampleData.veryLongString);// very long string
            getKey(0);                             // zero
            getKey(-99999);                        // negative number
            getKey(3.12345);                       // float
            getKey(Infinity);                      // infinity
            getKey(-Infinity);                     // negative infinity
            getKey(new Date(2000, 1, 2));          // Date
            getKey(null);                          // null

            if (env.isShimmed || !env.browser.isIE) {
                getKey([]);                        // empty array
                getKey(['a', '', 'b']);            // array of strings
                getKey([1, 2.345, -678]);          // array of numbers
                getKey([new Date(2005, 6, 7)]);    // array of Dates
            }

            if (env.isShimmed || (!env.browser.isSafari && !env.browser.isIE)) {
                getKey(undefined);                  // undefined
            }

            function getKey (key) {
                gettingCounter++;
                var storeCursor = store.openCursor(key);
                var indexCursor = index.openCursor(key);
                storeCursor.onerror = indexCursor.onerror = done;
                storeCursor.onsuccess = indexCursor.onsuccess = function () {
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
        this.timeout(5000);
        util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var index = store.index('inline-index');

            tryToGet(NaN);                                  // NaN
            tryToGet(true);                                 // boolean
            tryToGet(false);                                // boolean
            tryToGet({});                                   // empty object
            tryToGet({foo: 'bar'});                         // object
            tryToGet(new util.sampleData.Person('John'));   // Class
            tryToGet([1, undefined, 2]);                    // array with undefined
            tryToGet([1, null, 2]);                         // array with null
            tryToGet([true, false]);                        // array of booleans
            tryToGet([{foo: 'bar'}]);                       // array of objects

            if (env.isShimmed || !env.browser.isIE) {
                tryToGet(/^regex$/);                        // RegExp
            }

            function tryToGet (key, IDBObj) {
                if (!IDBObj) {
                    tryToGet(key, store);
                    tryToGet(key, index);
                } else {
                    var err = null;

                    try {
                        IDBObj.openCursor(key);
                    } catch (e) {
                        err = e;
                    }

                    if (!env.isPolyfilled) {
                        expect(err).to.be.an.instanceOf(env.DOMException);  // The polyfill throws a normal error
                    }
                    expect(err).to.be.ok;
                    expect(err.name).to.equal('DataError');
                }
            }

            db.close();
            done();
        });
    });

    describe('queries', function () {
        var queries, queriesCompleted;

        function query (source, keyRange, direction, expected) {
            queries++;
            if (arguments.length === 2) {
                expected = keyRange;
                keyRange = undefined;
                direction = 'next';
            } else if (arguments.length === 3) {
                expected = direction;
                direction = 'next';
            }

            util.query(source, keyRange, direction, function (err, data) {
                if (err) {
                    throw err;
                }
                var expectedLength = typeof expected === 'number' ? expected : expected.length;
                if (data.length !== expectedLength) {
                    throw new Error('Expected ' + expectedLength + ' results, but got ' + data.length + '\n' + JSON.stringify(data.slice(0, 10), null, 2));
                }
                if (expected instanceof Array) {
                    for (var i = 0; i < data.length; i++) {
                        ['primaryKey', 'key', 'value'].forEach(function (prop) {
                            try {
                                expect(data[i][prop]).to.deep.equal(expected[i][prop]);
                            } catch (e) {
                                throw new Error('The ' + prop + ' of result #' + (i + 1) + ' (of ' + data.length + ') does not match.\n\nActual:' + JSON.stringify(data[i], null, 2) + '\n\nExpected:' + JSON.stringify(expected[i], null, 2));
                            }
                        });
                    }
                }
                queriesCompleted++;
            });
        }

        beforeEach(function () {
            queries = queriesCompleted = 0;
        });

        it('should query out-of-line keys', function (done) {
            util.createDatabase('out-of-line', 'inline-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('out-of-line', 'readwrite');
                var store = tx.objectStore('out-of-line');
                var index = store.index('inline-index');
                tx.onerror = done;
                tx.oncomplete = function () {
                    expect(queries).to.equal(queriesCompleted);
                    db.close();
                    done();
                };

                store.add('one', 101);
                store.add('two', 222);
                store.add('three', -3);
                store.add('four', 4.4);
                store.add('five', 0.0000000000005);

                // Object Store queries
                query(store, 0.0000000000005, [
                    {primaryKey: 0.0000000000005, key: 0.0000000000005, value: 'five'}
                ]);
                query(store, IDBKeyRange.lowerBound(1), [
                    {primaryKey: 4.4, key: 4.4, value: 'four'},
                    {primaryKey: 101, key: 101, value: 'one'},
                    {primaryKey: 222, key: 222, value: 'two'}
                ]);
                query(store, IDBKeyRange.upperBound(0, true), [
                    {primaryKey: -3, key: -3, value: 'three'}
                ]);
                query(store, IDBKeyRange.bound(-Infinity, 1, true, true), [
                    {primaryKey: -3, key: -3, value: 'three'},
                    {primaryKey: 0.0000000000005, key: 0.0000000000005, value: 'five'}
                ]);

                // Index queries
                query(index, 101, []);
                query(index, IDBKeyRange.lowerBound(1), []);
                query(index, IDBKeyRange.bound(-Infinity, Infinity), []);
            });
        });

        it('should query generated out-of-line keys', function (done) {
            util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('out-of-line-generated', 'readwrite');
                var store = tx.objectStore('out-of-line-generated');
                var index = store.index('inline-index');
                tx.onerror = done;
                tx.oncomplete = function () {
                    expect(queries).to.equal(queriesCompleted);
                    db.close();
                    done();
                };

                store.add('one');
                store.add('two');
                store.add('three');
                store.add('four');
                store.add('five');

                // Object Store queries
                query(store, 3, [
                    {primaryKey: 3, key: 3, value: 'three'}
                ]);
                query(store, IDBKeyRange.bound(1, 4, true, false), [
                    {primaryKey: 2, key: 2, value: 'two'},
                    {primaryKey: 3, key: 3, value: 'three'},
                    {primaryKey: 4, key: 4, value: 'four'}
                ]);
                query(store, IDBKeyRange.upperBound(2, true), [
                    {primaryKey: 1, key: 1, value: 'one'}
                ]);

                // Index queries
                query(index, 3, []);
                query(index, IDBKeyRange.bound(1, 4, true, false), []);
                query(index, IDBKeyRange.upperBound(2, true), []);
            });
        });

        util.skipIf(env.isNative && env.browser.isIE, 'should query compound out-of-line keys', function (done) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            util.createDatabase('out-of-line-compound', 'inline-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('out-of-line-compound', 'readwrite');
                var store = tx.objectStore('out-of-line-compound');
                var index = store.index('inline-index');
                tx.onerror = done;
                tx.oncomplete = function () {
                    expect(queries).to.equal(queriesCompleted);
                    db.close();
                    done();
                };

                store.add('one', [1, 2, 3]);
                store.add('two', ['1', '2', '3']);
                store.add('three', [0, 1]);
                store.add('four', ['4', 5, 6]);
                store.add('five', [-3, -2, -1, 0]);
                store.add('six', [1, '2', new Date(2000, 0, 1)]);
                store.add('seven', [new Date(1990, 5, 24), 2, '3']);

                // Object Store queries
                query(store, ['1', '2', '3'], [
                    {primaryKey: ['1', '2', '3'], key: ['1', '2', '3'], value: 'two'}
                ]);
                query(store, IDBKeyRange.lowerBound([1], true), [
                    {primaryKey: [1, 2, 3], key: [1, 2, 3], value: 'one'},
                    {primaryKey: [1, '2', new Date(2000, 0, 1)], key: [1, '2', new Date(2000, 0, 1)], value: 'six'},
                    {primaryKey: [new Date(1990, 5, 24), 2, '3'], key: [new Date(1990, 5, 24), 2, '3'], value: 'seven'},
                    {primaryKey: ['1', '2', '3'], key: ['1', '2', '3'], value: 'two'},
                    {primaryKey: ['4', 5, 6], key: ['4', 5, 6], value: 'four'}
                ]);
                query(store, IDBKeyRange.lowerBound(['1'], true), [
                    {primaryKey: ['1', '2', '3'], key: ['1', '2', '3'], value: 'two'},
                    {primaryKey: ['4', 5, 6], key: ['4', 5, 6], value: 'four'}
                ]);

                // Index queries
                query(index, ['1', '2', '3'], []);
                query(index, IDBKeyRange.lowerBound([1]), []);
                query(index, IDBKeyRange.lowerBound(['1']), []);
            });
        });

        it('should query inline keys', function (done) {
            util.createDatabase('dotted', 'dotted-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('dotted', 'readwrite');
                var store = tx.objectStore('dotted');
                var index = store.index('dotted-index');
                tx.onerror = done;
                tx.oncomplete = function () {
                    expect(queries).to.equal(queriesCompleted);
                    db.close();
                    done();
                };

                store.add({name: {first: '1'}});
                store.add({name: {first: 2}});
                store.add({name: {first: 1}});
                store.add({name: {first: new Date(Date.UTC(2003, 3, 13))}});
                store.add({name: {first: '2003-03-13T00:00:00.000Z'}});
                store.add({name: {first: 0.0000000000005}});
                store.add({name: {first: -1}});
                store.add({name: {first: new Date(Date.UTC(2000, 0, 1))}});
                store.add({name: {first: new Date(Date.UTC(1999, 11, 31, 23, 59, 59, 999))}});

                // Object Store queries
                query(store, IDBKeyRange.lowerBound(new Date(Date.UTC(2003, 3, 13))), 'prevunique', [
                    {primaryKey: '2003-03-13T00:00:00.000Z', key: '2003-03-13T00:00:00.000Z', value: {name: {first: '2003-03-13T00:00:00.000Z'}}},
                    {primaryKey: '1', key: '1', value: {name: {first: '1'}}},
                    {primaryKey: new Date(Date.UTC(2003, 3, 13)), key: new Date(Date.UTC(2003, 3, 13)), value: {name: {first: new Date(Date.UTC(2003, 3, 13))}}}
                ]);
                query(store, IDBKeyRange.lowerBound('2003-03-13T00:00:00.000Z'), [
                    {primaryKey: '2003-03-13T00:00:00.000Z', key: '2003-03-13T00:00:00.000Z', value: {name: {first: '2003-03-13T00:00:00.000Z'}}}
                ]);
                query(store, IDBKeyRange.bound(0, 2, false, true), [
                    {primaryKey: 0.0000000000005, key: 0.0000000000005, value: {name: {first: 0.0000000000005}}},
                    {primaryKey: 1, key: 1, value: {name: {first: 1}}}
                ]);

                // Index queries
                query(index, IDBKeyRange.bound(-Infinity, Infinity), 'prev', [
                    {primaryKey: 2, key: 2, value: {name: {first: 2}}},
                    {primaryKey: 1, key: 1, value: {name: {first: 1}}},
                    {primaryKey: 0.0000000000005, key: 0.0000000000005, value: {name: {first: 0.0000000000005}}},
                    {primaryKey: -1, key: -1, value: {name: {first: -1}}}
                ]);
                query(index, IDBKeyRange.upperBound(new Date(Date.UTC(2003, 3, 13)), true), [
                    {primaryKey: -1, key: -1, value: {name: {first: -1}}},
                    {primaryKey: 0.0000000000005, key: 0.0000000000005, value: {name: {first: 0.0000000000005}}},
                    {primaryKey: 1, key: 1, value: {name: {first: 1}}},
                    {primaryKey: 2, key: 2, value: {name: {first: 2}}},
                    {primaryKey: new Date(Date.UTC(1999, 11, 31, 23, 59, 59, 999)), key: new Date(Date.UTC(1999, 11, 31, 23, 59, 59, 999)), value: {name: {first: new Date(Date.UTC(1999, 11, 31, 23, 59, 59, 999))}}},
                    {primaryKey: new Date(Date.UTC(2000, 0, 1)), key: new Date(Date.UTC(2000, 0, 1)), value: {name: {first: new Date(Date.UTC(2000, 0, 1))}}}
                ]);
            });
        });

        it('should query generated inline keys', function (done) {
            util.createDatabase('dotted-generated', 'dotted-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('dotted-generated', 'readwrite');
                var store = tx.objectStore('dotted-generated');
                var index = store.index('dotted-index');
                tx.onerror = done;
                tx.oncomplete = function () {
                    expect(queries).to.equal(queriesCompleted);
                    db.close();
                    done();
                };

                store.add({id: 'one'});
                store.add({id: 'two'});
                store.add({id: 'three'});
                store.add({id: 'four'});
                store.add({id: 'five'});

                // Object Store queries
                query(store, IDBKeyRange.only(4), [
                    {primaryKey: 4, key: 4, value: {id: 'four', name: {first: 4}}}
                ]);
                query(store, IDBKeyRange.bound(3, 4, true, true), []);
                query(store, IDBKeyRange.bound(3, 4, false, false), 'prev', [
                    {primaryKey: 4, key: 4, value: {id: 'four', name: {first: 4}}},
                    {primaryKey: 3, key: 3, value: {id: 'three', name: {first: 3}}}
                ]);

                // Index queries
                query(index, 0, []);
                if (env.isShimmed || env.isChrome) {
                    // Only Chrome supports immediate querying of generated inline keys for indexes
                    query(index, IDBKeyRange.lowerBound(5), [
                        {primaryKey: 5, key: 5, value: {id: 'five', name: {first: 5}}}
                    ]);
                    query(index, IDBKeyRange.upperBound(1), [
                        {primaryKey: 1, key: 1, value: {id: 'one', name: {first: 1}}}
                    ]);
                }
            });
        });

        util.skipIf(env.isNative && env.browser.isIE, 'should query compound inline keys', function (done) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            util.createDatabase('dotted-compound', 'compound-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('dotted-compound', 'readwrite');
                var store = tx.objectStore('dotted-compound');
                var index = store.index('compound-index');
                tx.onerror = done;
                tx.oncomplete = function () {
                    expect(queries).to.equal(queriesCompleted);
                    db.close();
                    done();
                };

                store.add({id: '1', name: {first: '2', last: '3'}});
                store.add({id: '-1', name: {first: '-2', last: '-3'}});
                store.add({id: '-1', name: {first: '-3', last: '-2'}});
                store.add({id: 1, name: {first: 2, last: 3}});
                store.add({id: -1, name: {first: -2, last: -3}});
                store.add({id: -1, name: {first: -3, last: -2}});
                store.add({id: new Date(2001, 1, 1), name: {first: new Date(2003, 3, 3), last: new Date(2002, 2, 2)}});
                store.add({id: new Date(2001, 1, 1), name: {first: new Date(2002, 2, 2), last: new Date(2003, 3, 3)}});

                // Object Store queries
                query(store, IDBKeyRange.bound(-Infinity, Infinity), []);
                query(store, IDBKeyRange.bound([-Infinity], [Infinity], true, true), 'prev', [
                    {primaryKey: [1, 2, 3], key: [1, 2, 3], value: {id: 1, name: {first: 2, last: 3}}},
                    {primaryKey: [-1, -2, -3], key: [-1, -2, -3], value: {id: -1, name: {first: -2, last: -3}}},
                    {primaryKey: [-1, -3, -2], key: [-1, -3, -2], value: {id: -1, name: {first: -3, last: -2}}}
                ]);
                query(store, IDBKeyRange.bound([' '], ['Z']), 'nextunique', [
                    {primaryKey: ['-1', '-2', '-3'], key: ['-1', '-2', '-3'], value: {id: '-1', name: {first: '-2', last: '-3'}}},
                    {primaryKey: ['-1', '-3', '-2'], key: ['-1', '-3', '-2'], value: {id: '-1', name: {first: '-3', last: '-2'}}},
                    {primaryKey: ['1', '2', '3'], key: ['1', '2', '3'], value: {id: '1', name: {first: '2', last: '3'}}}
                ]);

                // Index queries
                query(index, IDBKeyRange.bound(' ', 'Z'), []);
                query(index, IDBKeyRange.bound([new Date(2001, 1, 1), new Date(2003, 1, 1)], [new Date(9999, 11, 31)]), [
                    {primaryKey: [new Date(2001, 1, 1), new Date(2003, 3, 3), new Date(2002, 2, 2)], key: [new Date(2001, 1, 1), new Date(2003, 3, 3), new Date(2002, 2, 2)], value: {id: new Date(2001, 1, 1), name: {first: new Date(2003, 3, 3), last: new Date(2002, 2, 2)}}}
                ]);
                query(index, IDBKeyRange.upperBound([new Date(9999, 11, 31)]), [
                    {primaryKey: [-1, -3, -2], key: [-1, -3, -2], value: {id: -1, name: {first: -3, last: -2}}},
                    {primaryKey: [-1, -2, -3], key: [-1, -2, -3], value: {id: -1, name: {first: -2, last: -3}}},
                    {primaryKey: [1, 2, 3], key: [1, 2, 3], value: {id: 1, name: {first: 2, last: 3}}},
                    {primaryKey: [new Date(2001, 1, 1), new Date(2002, 2, 2), new Date(2003, 3, 3)], key: [new Date(2001, 1, 1), new Date(2002, 2, 2), new Date(2003, 3, 3)], value: {id: new Date(2001, 1, 1), name: {first: new Date(2002, 2, 2), last: new Date(2003, 3, 3)}}},
                    {primaryKey: [new Date(2001, 1, 1), new Date(2003, 3, 3), new Date(2002, 2, 2)], key: [new Date(2001, 1, 1), new Date(2003, 3, 3), new Date(2002, 2, 2)], value: {id: new Date(2001, 1, 1), name: {first: new Date(2003, 3, 3), last: new Date(2002, 2, 2)}}}
                ]);
            });
        });

        util.skipIf(env.isNative && env.browser.isIE, 'should query indexes other than the primary key', function (done) {
            // BUG: IE's native IndexedDB does not support compound keys at all

            // NOTE: The object store's keyPath is "id".  The index's keyPath is ["id","name.first","name.last"]
            util.createDatabase('inline', 'compound-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                var index = store.index('compound-index');
                tx.onerror = function (event) {
                    done(event.target.error);
                };
                tx.oncomplete = function () {
                    expect(queries).to.equal(queriesCompleted);
                    db.close();
                    done();
                };

                store.add({id: ''});
                store.add({id: 0});
                store.add({id: '1', name: {first: '2', last: '3'}});
                store.add({id: '-1', name: {first: '-2', last: '-3'}});
                store.add({id: 1, name: {first: 2, last: 3}});
                store.add({id: -1, name: {first: -2, last: -3}});

                // Object Store queries
                query(store, IDBKeyRange.bound([-Infinity], [Infinity]), []);
                query(store, IDBKeyRange.bound(-Infinity, Infinity), [
                    {primaryKey: -1, key: -1, value: {id: -1, name: {first: -2, last: -3}}},
                    {primaryKey: 0, key: 0, value: {id: 0}},
                    {primaryKey: 1, key: 1, value: {id: 1, name: {first: 2, last: 3}}}
                ]);
                query(store, IDBKeyRange.bound(' ', 'Z'), 'nextunique', [
                    {primaryKey: '-1', key: '-1', value: {id: '-1', name: {first: '-2', last: '-3'}}},
                    {primaryKey: '1', key: '1', value: {id: '1', name: {first: '2', last: '3'}}}
                ]);
                if (env.isShimmed || !env.browser.isIE) {
                    // IE sorts empty strings ahead of numbers
                    query(store, IDBKeyRange.upperBound(''), [
                        {primaryKey: -1, key: -1, value: {id: -1, name: {first: -2, last: -3}}},
                        {primaryKey: 0, key: 0, value: {id: 0}},
                        {primaryKey: 1, key: 1, value: {id: 1, name: {first: 2, last: 3}}},
                        {primaryKey: '', key: '', value: {id: ''}}
                    ]);
                }

                // Index queries
                query(index, IDBKeyRange.bound(' ', 'Z'), []);
                query(index, IDBKeyRange.lowerBound(['']), [
                    {primaryKey: '-1', key: ['-1', '-2', '-3'], value: {id: '-1', name: {first: '-2', last: '-3'}}},
                    {primaryKey: '1', key: ['1', '2', '3'], value: {id: '1', name: {first: '2', last: '3'}}}
                ]);
                query(index, IDBKeyRange.lowerBound([]), 'prev', [
                    {primaryKey: '1', key: ['1', '2', '3'], value: {id: '1', name: {first: '2', last: '3'}}},
                    {primaryKey: '-1', key: ['-1', '-2', '-3'], value: {id: '-1', name: {first: '-2', last: '-3'}}},
                    {primaryKey: 1, key: [1, 2, 3], value: {id: 1, name: {first: 2, last: 3}}},
                    {primaryKey: -1, key: [-1, -2, -3], value: {id: -1, name: {first: -2, last: -3}}}
                ]);
                query(index, [
                    {primaryKey: -1, key: [-1, -2, -3], value: {id: -1, name: {first: -2, last: -3}}},
                    {primaryKey: 1, key: [1, 2, 3], value: {id: 1, name: {first: 2, last: 3}}},
                    {primaryKey: '-1', key: ['-1', '-2', '-3'], value: {id: '-1', name: {first: '-2', last: '-3'}}},
                    {primaryKey: '1', key: ['1', '2', '3'], value: {id: '1', name: {first: '2', last: '3'}}}
                ]);
                query(index, IDBKeyRange.upperBound([new Date(1900, 1, 1)]), [
                    {primaryKey: -1, key: [-1, -2, -3], value: {id: -1, name: {first: -2, last: -3}}},
                    {primaryKey: 1, key: [1, 2, 3], value: {id: 1, name: {first: 2, last: 3}}}
                ]);
            });
        });

        util.skipIf(env.browser.isIE, 'should query multi-entry indexes', function (done) {
            // BUG: IE's native IndexedDB does not support multi-entry indexes
            util.createDatabase('inline', 'multi-entry-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                var index = store.index('multi-entry-index');
                tx.onerror = done;
                tx.oncomplete = function () {
                    expect(queries).to.equal(queriesCompleted);
                    db.close();
                    done();
                };

                store.add({id: 'a'});
                store.add({id: ['a']});
                store.add({id: ['b']});
                store.add({id: ['a', 'b', 'c']});
                store.add({id: [['a', [['b'], 'c']]]});

                // Object Store queries
                query(store, 'b', []);
                query(store, 'a', [
                    {primaryKey: 'a', key: 'a', value: {id: 'a'}}
                ]);
                query(store, IDBKeyRange.only(['a']), [
                    {primaryKey: ['a'], key: ['a'], value: {id: ['a']}}
                ]);
                query(store, IDBKeyRange.lowerBound(['a']), 'prevunique', [
                    {primaryKey: [['a', [['b'], 'c']]], key: [['a', [['b'], 'c']]], value: {id: [['a', [['b'], 'c']]]}},
                    {primaryKey: ['b'], key: ['b'], value: {id: ['b']}},
                    {primaryKey: ['a', 'b', 'c'], key: ['a', 'b', 'c'], value: {id: ['a', 'b', 'c']}},
                    {primaryKey: ['a'], key: ['a'], value: {id: ['a']}}
                ]);

                // Index queries
                query(index, IDBKeyRange.only('a'), 'nextunique', [
                    {primaryKey: 'a', key: 'a', value: {id: 'a'}}
                ]);
                if (env.isShimmed || !env.browser.isSafari) {
                    // Safari's native IndexedDB cursors don't return the correct keys
                    query(index, IDBKeyRange.only('a'), [
                        {primaryKey: 'a', key: 'a', value: {id: 'a'}},
                        {primaryKey: ['a'], key: 'a', value: {id: ['a']}},
                        {primaryKey: ['a', 'b', 'c'], key: 'a', value: {id: ['a', 'b', 'c']}}
                    ]);
                    query(index, IDBKeyRange.lowerBound('a'), [
                        {primaryKey: 'a', key: 'a', value: {id: 'a'}},
                        {primaryKey: ['a'], key: 'a', value: {id: ['a']}},
                        {primaryKey: ['a', 'b', 'c'], key: 'a', value: {id: ['a', 'b', 'c']}},
                        {primaryKey: ['a', 'b', 'c'], key: 'b', value: {id: ['a', 'b', 'c']}},
                        {primaryKey: ['b'], key: 'b', value: {id: ['b']}},
                        {primaryKey: ['a', 'b', 'c'], key: 'c', value: {id: ['a', 'b', 'c']}},
                        {primaryKey: [['a', [['b'], 'c']]], key: ['a', [['b'], 'c']], value: {id: [['a', [['b'], 'c']]]}}
                    ]);
                    query(index, IDBKeyRange.lowerBound('a', true), 'prev', [
                        {primaryKey: [['a', [['b'], 'c']]], key: ['a', [['b'], 'c']], value: {id: [['a', [['b'], 'c']]]}},
                        {primaryKey: ['a', 'b', 'c'], key: 'c', value: {id: ['a', 'b', 'c']}},
                        {primaryKey: ['b'], key: 'b', value: {id: ['b']}},
                        {primaryKey: ['a', 'b', 'c'], key: 'b', value: {id: ['a', 'b', 'c']}}
                    ]);
                    query(index, IDBKeyRange.lowerBound('a', true), 'prevunique', [
                        {primaryKey: [['a', [['b'], 'c']]], key: ['a', [['b'], 'c']], value: {id: [['a', [['b'], 'c']]]}},
                        {primaryKey: ['a', 'b', 'c'], key: 'c', value: {id: ['a', 'b', 'c']}},
                        {primaryKey: ['a', 'b', 'c'], key: 'b', value: {id: ['a', 'b', 'c']}}
                    ]);
                }
            });
        });

        util.skipIf(env.browser.isIE, 'should query multi-entry indexes with hundreds of records', function (done) {
            // BUG: IE's native IndexedDB does not support multi-entry indexes
            this.timeout(40000);
            this.slow(10000);

            util.createDatabase('inline', 'multi-entry-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                var index = store.index('multi-entry-index');
                tx.onerror = function (event) {
                    done(event.target.error.message);
                };
                tx.oncomplete = function () {
                    expect(queries).to.equal(queriesCompleted);
                    db.close();
                    done();
                };

                for (var i = 0; i < 500; i++) {
                    store.add({id: ['a', 'b', i]});
                    store.add({id: ['a', 'c', i]});
                }

                // Object Store queries
                query(store, 'a', 0);
                query(store, ['b'], 0);
                query(store, ['a', 'b', 450], 1);
                query(store, IDBKeyRange.lowerBound(['a']), 1000);
                query(store, IDBKeyRange.upperBound(['a', 'c', 400]), 901);
                query(store, IDBKeyRange.bound(['a', 'b', 200], ['a', 'c'], true, true), 299);

                // Index queries
                query(index, IDBKeyRange.only('a'), 1000);
                query(index, IDBKeyRange.bound('a', 'c'), 2000);
                query(index, IDBKeyRange.lowerBound(['a']), 0);
                query(index, IDBKeyRange.lowerBound('b', true), 500);
                query(index, IDBKeyRange.lowerBound('c', true), 0);
                query(index, IDBKeyRange.upperBound(250, true), 500);
                query(index, IDBKeyRange.upperBound(250, false), 502);
            });
        });
    });

    describe('failure tests', function () {
        it('should throw an error if the key range is invalid', function (done) {
            util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('out-of-line-generated', 'readwrite');
                var store = tx.objectStore('out-of-line-generated');
                var index = store.index('inline-index');
                var storeErr, indexErr;

                try {
                    store.openCursor(IDBKeyRange.upperBound({foo: 'bar'}));
                } catch (e) {
                    storeErr = e;
                }

                try {
                    index.openCursor(IDBKeyRange.lowerBound({foo: 'bar'}));
                } catch (e) {
                    indexErr = e;
                }

                expect(storeErr).to.be.an.instanceOf(env.DOMException);
                expect(storeErr.name).to.equal('DataError');

                expect(indexErr).to.be.an.instanceOf(env.DOMException);
                expect(indexErr.name).to.equal('DataError');

                db.close();
                done();
            });
        });

        it('should throw an error if the direction is invalid', function (done) {
            util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('out-of-line-generated', 'readwrite');
                var store = tx.objectStore('out-of-line-generated');
                var index = store.index('inline-index');
                var storeErr, indexErr;

                try {
                    store.openCursor(1, 'ascending');   // not a valid direction
                } catch (e) {
                    storeErr = e;
                }

                try {
                    index.openCursor(1, 'Next');        // direction is case-sensitive
                } catch (e) {
                    indexErr = e;
                }

                expect(storeErr && typeof storeErr).equal('object');
                expect(indexErr && typeof indexErr).equal('object');
                if (env.isShimmed || !env.browser.isIE) {
                    expect(storeErr).to.be.an.instanceOf(TypeError);    // IE throws a DOMException
                    expect(storeErr.name).to.equal('TypeError');        // IE is InvalidAccessError

                    expect(indexErr).to.be.an.instanceOf(TypeError);    // IE throws a DOMException
                    expect(indexErr.name).to.equal('TypeError');        // IE is InvalidAccessError
                }

                db.close();
                done();
            });
        });

        it('should throw an error if the transaction is closed', function (done) {
            util.createDatabase('out-of-line-generated', 'inline-index', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                var tx = db.transaction('out-of-line-generated', 'readwrite');
                var store = tx.objectStore('out-of-line-generated');
                var index = store.index('inline-index');

                setTimeout(function () {
                    var storeErr, indexErr;

                    try {
                        store.openCursor(1);
                    } catch (e) {
                        storeErr = e;
                    }

                    try {
                        index.openCursor(1);
                    } catch (e) {
                        indexErr = e;
                    }

                    if (!env.browser.isFirefox) expect(storeErr).to.be.an.instanceOf(env.DOMException);
                    expect(storeErr.name).to.equal('TransactionInactiveError');

                    if (!env.browser.isFirefox) expect(indexErr).to.be.an.instanceOf(env.DOMException);
                    expect(indexErr.name).to.equal('TransactionInactiveError');

                    db.close();
                    done();
                }, env.transactionDuration);
            });
        });
    });
});

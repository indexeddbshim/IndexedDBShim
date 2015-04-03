describe('IDBIndex.getKey', function() {
    'use strict';

    it('should return an IDBRequest', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index') ;
            tx.onerror = done;

            var key = index.getKey('foo');

            expect(key).to.be.an.instanceOf(IDBRequest);

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
            var index = store.index('inline-index') ;
            tx.onerror = done;

            var key = index.getKey('foo');
            key.onerror = sinon.spy();

            key.onsuccess = sinon.spy(function(event){
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(key);
            });

            tx.oncomplete = function() {
                sinon.assert.calledOnce(key.onsuccess);
                sinon.assert.notCalled(key.onerror);

                db.close();
                done();
            };
        });
    });

    it('should get a record', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index') ;
            tx.onerror = done;

            var key;
            store.add({id: 1}).onsuccess = function() {
                key = index.getKey(1);
            };

            tx.oncomplete = function() {
                expect(key.result).to.deep.equal(1);

                db.close();
                done();
            };
        });
    });

    it('should not get a record if the key is not found', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            var index = store.index('inline-index') ;
            tx.onerror = done;

            var key;
            store.add({id: 1}).onsuccess = function() {
                key = index.getKey(2);
            };

            tx.oncomplete = function() {
                expect(key.result).not.to.be.ok;

                if (!env.browser.isSafari) {
                    expect(key.result).to.be.undefined;    // Safari returns null
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
            var index = store.index('inline-index') ;
            tx.onerror = done;

            store.add({id: 1});
            var key1 = index.getKey(1);

            store.add({id: 2});
            store.add({id: 3});
            var key2 = index.getKey(2);
            var key3 = index.getKey(3);

            tx.oncomplete = function() {
                expect(key1.result).to.deep.equal(1);
                expect(key2.result).to.deep.equal(2);
                expect(key3.result).to.deep.equal(3);

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

            var key1, key2, key3, key4, key5;
            function transaction3() {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                var index = store.index('inline-index') ;
                tx.onerror = done;
                tx.oncomplete = checkResults;

                key1 = index.getKey(1);
                key2 = index.getKey(2);
                key3 = index.getKey(3);
                key4 = index.getKey(4);
                key5 = index.getKey(5);
            }

            function checkResults() {
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

    it('should get data using out-of-line keys', function(done) {
        util.createDatabase('out-of-line', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line', 'readwrite');
            var store = tx.objectStore('out-of-line');
            var index = store.index('inline-index') ;
            tx.onerror = done;

            store.add('one', 101);
            store.add('two', 222);
            store.add('three', 3);
            store.add('four', 44);
            store.add('five', 555555);

            var key1 = index.getKey(555555);
            var key2 = index.getKey(3);
            var key3 = index.getKey(101);

            tx.oncomplete = function() {
                // Out-of-line keys aren't included in indexes
                expect(key1.result).not.to.be.ok;
                expect(key2.result).not.to.be.ok;
                expect(key3.result).not.to.be.ok;
                if (!env.browser.isSafari) {
                    expect(key1.result).to.be.undefined;   // Safari returns null
                    expect(key2.result).to.be.undefined;   // Safari returns null
                    expect(key3.result).to.be.undefined;   // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get data using compound out-of-line keys', function(done) {
        if (env.browser.isIE) {
            // BUG: IE does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('out-of-line-compound', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line-compound', 'readwrite');
            var store = tx.objectStore('out-of-line-compound');
            var index = store.index('inline-index') ;
            tx.onerror = done;

            store.add('one', [1, 'oh', 1]);
            store.add('two', ['t', 'w', 'o']);
            store.add('three', [3, 3]);
            store.add('four', [4, '4']);
            store.add('five', ['five']);

            var key1 = index.getKey(['five']);
            var key2 = index.getKey([1, 'oh', 1]);
            var key3 = index.getKey(['t', 'w', 'o']);

            tx.oncomplete = function() {
                // Out-of-line keys aren't included in indexes
                expect(key1.result).not.to.be.ok;
                expect(key2.result).not.to.be.ok;
                expect(key3.result).not.to.be.ok;
                if (!env.browser.isSafari) {
                    expect(key1.result).to.be.undefined;   // Safari returns null
                    expect(key2.result).to.be.undefined;   // Safari returns null
                    expect(key3.result).to.be.undefined;   // Safari returns null
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
            var index = store.index('inline-index') ;
            tx.onerror = done;

            store.add('one');
            store.add('two');
            store.add('three');
            store.add('four');
            store.add('five');

            var key1 = index.getKey(4);
            var key2 = index.getKey(2);
            var key3 = index.getKey(5);

            tx.oncomplete = function() {
                // Out-of-line keys aren't included in indexes
                expect(key1.result).not.to.be.ok;
                expect(key2.result).not.to.be.ok;
                expect(key3.result).not.to.be.ok;
                if (!env.browser.isSafari) {
                    expect(key1.result).to.be.undefined;   // Safari returns null
                    expect(key2.result).to.be.undefined;   // Safari returns null
                    expect(key3.result).to.be.undefined;   // Safari returns null
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
            var index = store.index('inline-index') ;
            tx.onerror = done;

            store.add({id: 'one'});
            store.add({id: 'two'});
            store.add({id: 'three'});
            store.add({id: 'four'});
            store.add({id: 'five'});

            var key1 = index.getKey('four');
            var key2 = index.getKey('five');
            var key3 = index.getKey('two');

            tx.oncomplete = function() {
                expect(key1.result).to.deep.equal('four');
                expect(key2.result).to.deep.equal('five');
                expect(key3.result).to.deep.equal('two');

                db.close();
                done();
            };
        });
    });

    it('should get data using compound inline keys', function(done) {
        if (env.browser.isIE) {
            // BUG: IE does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline-compound', 'inline-index', function(err, db) {
            var tx = db.transaction('inline-compound', 'readwrite');
            var store = tx.objectStore('inline-compound');
            var index = store.index('inline-index') ;
            tx.onerror = done;

            store.add({id: 1, name: 'one'});
            store.add({id: 2, name: 'two'});
            store.add({id: 3, name: 'three'});
            store.add({id: 4, name: 'four'});
            store.add({id: 5, name: 'five'});

            var key1 = index.getKey(3);
            var key2 = index.getKey(1);
            var key3 = index.getKey(5);

            tx.oncomplete = function() {
                expect(key1.result).to.deep.equal([3, 'three']);
                expect(key2.result).to.deep.equal([1, 'one']);
                expect(key3.result).to.deep.equal([5, 'five']);

                db.close();
                done();
            };
        });
    });

    it('should get data using generated inline keys', function(done) {
        util.createDatabase('inline-generated', 'inline-index', function(err, db) {
            var tx = db.transaction('inline-generated', 'readwrite');
            var store = tx.objectStore('inline-generated');
            var index = store.index('inline-index') ;
            tx.onerror = done;

            store.add({name: 'one'});
            store.add({name: 'two'});
            store.add({name: 'three'});
            store.add({name: 'four'});
            store.add({name: 'five'});

            var key1 = index.getKey(3);
            var key2 = index.getKey(1);
            var key3 = index.getKey(5);

            tx.oncomplete = function() {
                // BUG: These browsers don't support indexes on generated inline keys
                if (!env.browser.isFirefox && !env.browser.isSafari && !env.browser.isIE) {
                    expect(key1.result).to.deep.equal(3);
                    expect(key2.result).to.deep.equal(1);
                    expect(key3.result).to.deep.equal(5);
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

            var key1 = index.getKey('two');
            var key2 = index.getKey('five');
            var key3 = index.getKey('three');

            tx.oncomplete = function() {
                expect(key1.result).to.deep.equal('two');
                expect(key2.result).to.deep.equal('five');
                expect(key3.result).to.deep.equal('three');

                db.close();
                done();
            };
        });
    });

    it('should get data using compound dotted keys', function(done) {
        if (env.browser.isIE) {
            // BUG: IE does not support compound keys at all
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

            var key1 = index.getKey([1, 'two', 'abc']);
            var key2 = index.getKey([1, 'five', 'abc']);
            var key3 = index.getKey([1, 'three', 'abc']);

            tx.oncomplete = function() {
                expect(key1.result).to.deep.equal([1, 'two', 'abc']);
                expect(key2.result).to.deep.equal([1, 'five', 'abc']);
                expect(key3.result).to.deep.equal([1, 'three', 'abc']);

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

            var key1 = index.getKey(4);
            var key2 = index.getKey(5);
            var key3 = index.getKey(1);

            tx.oncomplete = function() {
                // BUG: These browsers don't support indexes on generated inline keys
                if (!env.browser.isFirefox && !env.browser.isSafari && !env.browser.isIE) {
                    expect(key1.result).to.deep.equal(4);
                    expect(key2.result).to.deep.equal(5);
                    expect(key3.result).to.deep.equal(1);
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
            var index = store.index('inline-index') ;
            var gettingCounter = 0, gottenCounter = 0;

            getKey('');                            // empty string
            getKey(0);                             // zero
            getKey(-99999);                        // negative number
            getKey(3.12345);                       // float
            getKey(Infinity);                      // infinity
            getKey(-Infinity);                     // negative infinity
            getKey(new Date(2000, 1, 2));          // Date

            if (!env.browser.isIE) {
                getKey([]);                        // empty array
                getKey(['a', '', 'b']);            // array of strings
                getKey([1, 2.345, -678]);          // array of numbers
                getKey([new Date(2005, 6, 7)]);    // array of Dates
            }

            function getKey(theKey) {
                gettingCounter++;
                var key = index.getKey(theKey);
                key.onerror = done;
                key.onsuccess = function() {
                    gottenCounter++;
                };
            }

            tx.oncomplete = function() {
                // Make sure all the gets completed
                expect(gottenCounter).to.equal(gettingCounter);

                db.close();
                done();
            };
        });
    });

    it('should not allow these keys', function(done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var index = store.index('inline-index') ;

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

            if (!env.browser.isIE) {
                tryToGet(/^regex$/);            // RegExp
            }

            function tryToGet(key) {
                var err = null;

                try {
                    index.getKey(key);
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an.instanceOf(env.DOMException);
                expect(err.name).to.equal('DataError');
            }

            db.close();
            done();
        });
    });

    it('should get multi-entry indexes', function(done) {
        if (env.browser.isIE) {
            // BUG: IE does not support multi-entry indexes
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

            var key1 = index.getKey('a');
            var key2 = index.getKey(['a']);
            var key3 = index.getKey('b');
            var key4 = index.getKey('c');
            var key5 = index.getKey(['a', 'b', 'c']);


            tx.oncomplete = function() {
                expect(key1.result).to.deep.equal('a');
                expect(key2.result).not.to.be.ok;
                if (!env.browser.isSafari) {
                    expect(key2.result).to.be.undefined;     // Safari returns null
                }
                expect(key3.result).to.include('b');        // Some browsers return different records
                expect(key4.result).to.deep.equal(['a', 'b', 'c']);
                expect(key5.result).not.to.be.ok;
                if (!env.browser.isSafari) {
                    expect(key5.result).to.be.undefined;     // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should get unique, multi-entry indexes', function(done) {
        if (env.browser.isIE) {
            // BUG: IE does not support multi-entry indexes
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

            var key1 = index.getKey('a');
            var key2 = index.getKey(['a']);
            var key3 = index.getKey('b');
            var key4 = index.getKey(['c']);
            var key5 = index.getKey(['c', 'd', 'e']);


            tx.oncomplete = function() {
                expect(key1.result).to.deep.equal('a');
                expect(key2.result).not.to.be.ok;
                if (!env.browser.isSafari) {
                    expect(key2.result).to.be.undefined;     // Safari returns null
                }
                expect(key3.result).to.deep.equal(['b']);
                expect(key4.result).not.to.be.ok;
                expect(key5.result).not.to.be.ok;
                if (!env.browser.isSafari) {
                    expect(key4.result).to.be.undefined;
                    expect(key5.result).to.be.undefined;     // Safari returns null
                }

                db.close();
                done();
            };
        });
    });

    it('should not throw an error if called an incomplete compound key', function(done) {
        if (env.browser.isIE) {
            // BUG: IE does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline-compound', 'compound-index', function(err, db) {
            var tx = db.transaction('inline-compound', 'readwrite');
            var store = tx.objectStore('inline-compound');
            var index = store.index('compound-index');

            store.add({id: 12345, name: 'John Doe'});

            var key = index.getKey([12345]);            // <-- "id" is specified, but "name" is missing
            key.onerror = sinon.spy();

            tx.oncomplete = function() {
                // Make sure no error was thrown
                sinon.assert.notCalled(key.onerror);

                // Make sure no data was returned
                expect(key.result).not.to.be.ok;
                if (!env.browser.isSafari) {
                    expect(key.result).to.be.undefined;    // Safari returns null
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
            var index = store.index('inline-index') ;

            setTimeout(function() {
                try {
                    index.getKey(1);
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an.instanceOf(env.DOMException);
                expect(err.name).to.equal('TransactionInactiveError');

                db.close();
                done();
            }, 50);
        });
    });

    it('should throw an error if called without params', function(done) {
        util.createDatabase('out-of-line-generated', 'inline-index', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var index = store.index('inline-index') ;

            try {
                index.getKey();
            }
            catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.name).to.equal('TypeError');

            db.close();
            done();
        });
    });
});

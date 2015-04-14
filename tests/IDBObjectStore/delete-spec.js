describe('IDBObjectStore.delete', function() {
    'use strict';

    it('should return an IDBRequest', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var del = store.delete('foo');

            expect(del).to.be.an.instanceOf(IDBRequest);

            tx.oncomplete = function() {
                db.close();
                done();
            };
        });
    });

    it('should pass the IDBRequest event to the onsuccess callback', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var del = store.delete('foo');
            del.onerror = sinon.spy();

            del.onsuccess = sinon.spy(function(event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(del);
            });

            tx.oncomplete = function() {
                sinon.assert.calledOnce(del.onsuccess);
                sinon.assert.notCalled(del.onerror);
                db.close();
                done();
            };
        });
    });

    it('should set IDBRequest.result to undefined', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            store.add({id: 'foo'});
            var del = store.delete('foo');

            del.onsuccess = sinon.spy(function() {
                expect(del.result).to.be.undefined;
            });

            tx.oncomplete = function() {
                sinon.assert.calledOnce(del.onsuccess);
                db.close();
                done();
            };
        });
    });

    it('should delete a record', function(done) {
        util.createDatabase('inline', function(err, db) {
            var allData;
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            tx.onerror = done;

            store.add({id: 1}).onsuccess = function() {
                store.delete(1).onsuccess = function() {
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });
                };
            };

            tx.oncomplete = function() {
                expect(allData).to.have.lengthOf(0);
                db.close();
                done();
            };
        });
    });

    it('should not delete a record if the key is not found', function(done) {
        util.createDatabase('inline', function(err, db) {
            var allData;
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            tx.onerror = done;

            store.add({id: 1}).onsuccess = function() {
                store.delete(2).onsuccess = function() {
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });
                };
            };

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: 1, value: {id: 1}}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should delete records immediately after creating them', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            tx.onerror = done;

            store.add({id: 1});
            store.delete(1);

            store.add({id: 2});
            store.add({id: 3});
            store.delete(2);
            store.delete(3);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.lengthOf(0);
                db.close();
                done();
            };
        });
    });

    it('should delete records from previous transactions', function(done) {
        util.createDatabase('inline', function(err, db) {
            var allData, deletedData;

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

                util.getAll(store, function(err, data) {
                    allData = data;
                });
            }

            function transaction3() {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = checkResults;

                store.delete(1);
                store.delete(2);
                store.delete(3);
                store.delete(4);
                store.delete(5);

                util.getAll(store, function(err, data) {
                    deletedData = data;
                });
            }

            function checkResults() {
                // Make sure all 5 records existed before the delete
                expect(allData).to.have.same.deep.members([
                    {key: 1, value: {id: 1}},
                    {key: 2, value: {id: 2}},
                    {key: 3, value: {id: 3}},
                    {key: 4, value: {id: 4}},
                    {key: 5, value: {id: 5}}
                ]);

                // Make sure all data was deleted
                expect(deletedData).to.have.lengthOf(0);

                db.close();
                done();
            }
        });
    });

    it('should delete data using out-of-line keys', function(done) {
        util.createDatabase('out-of-line', function(err, db) {
            var tx = db.transaction('out-of-line', 'readwrite');
            var store = tx.objectStore('out-of-line');
            tx.onerror = done;

            store.add('one', 101);
            store.add('two', 222);
            store.add('three', 3);
            store.add('four', 44);
            store.add('five', 555555);

            store.delete(555555);
            store.delete(3);
            store.delete(101);
            store.delete(3);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: 222, value: 'two'},
                    {key: 44, value: 'four'}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should delete data using compound out-of-line keys', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('out-of-line-compound', function(err, db) {
            var tx = db.transaction('out-of-line-compound', 'readwrite');
            var store = tx.objectStore('out-of-line-compound');
            tx.onerror = done;

            store.add('one', [1, 'oh', 1]);
            store.add('two', ['t', 'w', 'o']);
            store.add('three', [3, 3]);
            store.add('four', [4, '4']);
            store.add('five', ['five']);

            store.delete(['five']);
            store.delete([1, 'oh', 1]);
            store.delete(['t', 'w', 'o']);
            store.delete(['five']);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: [3, 3], value: 'three'},
                    {key: [4, '4'], value: 'four'}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should delete data using generated out-of-line keys', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            tx.onerror = done;

            store.add('one');
            store.add('two');
            store.add('three');
            store.add('four');
            store.add('five');

            store.delete(4);
            store.delete(2);
            store.delete(5);
            store.delete(2);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: 1, value: 'one'},
                    {key: 3, value: 'three'}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should delete data using inline keys', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            tx.onerror = done;

            store.add({id: 'one'});
            store.add({id: 'two'});
            store.add({id: 'three'});
            store.add({id: 'four'});
            store.add({id: 'five'});

            store.delete('four');
            store.delete('five');
            store.delete('two');
            store.delete('four');

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: 'one', value: {id: 'one'}},
                    {key: 'three', value: {id: 'three'}}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should delete data using compound inline keys', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline-compound', function(err, db) {
            var tx = db.transaction('inline-compound', 'readwrite');
            var store = tx.objectStore('inline-compound');
            tx.onerror = done;

            store.add({id: 1, name: 'one'});
            store.add({id: 2, name: 'two'});
            store.add({id: 3, name: 'three'});
            store.add({id: 4, name: 'four'});
            store.add({id: 5, name: 'five'});

            store.delete([3, 'three']);
            store.delete([1, 'one']);
            store.delete([5, 'five']);
            store.delete([3, 'three']);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: [2, 'two'], value: {id: 2, name: 'two'}},
                    {key: [4, 'four'], value: {id: 4, name: 'four'}}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should delete data using generated inline keys', function(done) {
        util.createDatabase('inline-generated', function(err, db) {
            var tx = db.transaction('inline-generated', 'readwrite');
            var store = tx.objectStore('inline-generated');
            tx.onerror = done;

            store.add({name: 'one'});
            store.add({name: 'two'});
            store.add({name: 'three'});
            store.add({name: 'four'});
            store.add({name: 'five'});

            store.delete(3);
            store.delete(1);
            store.delete(5);
            store.delete(3);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: 2, value: {id: 2, name: 'two'}},
                    {key: 4, value: {id: 4, name: 'four'}}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should delete data using dotted keys', function(done) {
        util.createDatabase('dotted', function(err, db) {
            var tx = db.transaction('dotted', 'readwrite');
            var store = tx.objectStore('dotted');
            tx.onerror = done;

            store.add({name: {first: 'one'}});
            store.add({name: {first: 'two'}});
            store.add({name: {first: 'three'}});
            store.add({name: {first: 'four'}});
            store.add({name: {first: 'five'}});

            store.delete('two');
            store.delete('five');
            store.delete('two');
            store.delete('three');

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: 'one', value: {name: {first: 'one'}}},
                    {key: 'four', value: {name: {first: 'four'}}}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should delete data using compound dotted keys', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('dotted-compound', function(err, db) {
            var tx = db.transaction('dotted-compound', 'readwrite');
            var store = tx.objectStore('dotted-compound');
            tx.onerror = done;

            store.add({id: 1, name: {first: 'one', last: 'abc'}});
            store.add({id: 1, name: {first: 'two', last: 'abc'}});
            store.add({id: 1, name: {first: 'three', last: 'abc'}});
            store.add({id: 1, name: {first: 'four', last: 'abc'}});
            store.add({id: 1, name: {first: 'five', last: 'abc'}});

            store.delete([1, 'two', 'abc']);
            store.delete([1, 'five', 'abc']);
            store.delete([1, 'two', 'abc']);
            store.delete([1, 'three', 'abc']);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: [1, 'one', 'abc'], value: {id: 1, name: {first: 'one', last: 'abc'}}},
                    {key: [1, 'four', 'abc'], value: {id: 1, name: {first: 'four', last: 'abc'}}}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should delete data using generated dotted keys', function(done) {
        util.createDatabase('dotted-generated', function(err, db) {
            var tx = db.transaction('dotted-generated', 'readwrite');
            var store = tx.objectStore('dotted-generated');
            tx.onerror = done;

            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});
            store.add({name: {last: 'abc'}});

            store.delete(4);
            store.delete(5);
            store.delete(1);
            store.delete(4);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                expect(allData).to.have.same.deep.members([
                    {key: 2, value: {name: {first: 2, last: 'abc'}}},
                    {key: 3, value: {name: {first: 3, last: 'abc'}}}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should allow these keys', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');
            var deletingCounter = 0, deletedCounter = 0;

            deleteKey('');                            // empty string
            deleteKey(0);                             // zero
            deleteKey(-99999);                        // negative number
            deleteKey(3.12345);                       // float
            deleteKey(Infinity);                      // infinity
            deleteKey(-Infinity);                     // negative infinity
            deleteKey(new Date(2000, 1, 2));          // Date

            if (env.isShimmed || !env.browser.isIE) {
                deleteKey([]);                        // empty array
                deleteKey(['a', '', 'b']);            // array of strings
                deleteKey([1, 2.345, -678]);          // array of numbers
                deleteKey([new Date(2005, 6, 7)]);    // array of Dates
            }

            function deleteKey(key) {
                deletingCounter++;
                var del = store.delete(key);
                del.onerror = done;
                del.onsuccess = function() {
                    deletedCounter++;
                };
            }

            tx.oncomplete = function() {
                // Make sure all the deletes completed
                expect(deletedCounter).to.equal(deletingCounter);

                db.close();
                done();
            };
        });
    });

    it('should not allow these keys', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');

            tryToDelete(undefined);                // undefined
            tryToDelete(NaN);                      // NaN
            tryToDelete(true);                     // boolean
            tryToDelete(false);                    // boolean
            tryToDelete({});                       // empty object
            tryToDelete({foo: 'bar'});             // object
            tryToDelete(new util.Person('John'));  // Class
            tryToDelete([1, undefined, 2]);        // array with undefined
            tryToDelete([1, null, 2]);             // array with null
            tryToDelete([true, false]);            // array of booleans
            tryToDelete([{foo: 'bar'}]);           // array of objects

            if (env.isShimmed || !env.browser.isIE) {
                tryToDelete(/^regex$/);            // RegExp
            }

            function tryToDelete(key) {
                var err = null;

                try {
                    store.delete(key);
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

    it('should not throw an error if called an incomplete compound key', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline-compound', function(err, db) {
            var tx = db.transaction('inline-compound', 'readwrite');
            var store = tx.objectStore('inline-compound');

            store.add({id: 12345, name: 'John Doe'});

            var del = store.delete([12345]);            // <-- "id" is specified, but "name" is missing
            del.onerror = sinon.spy();

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // Make sure no error was thrown
                sinon.assert.notCalled(del.onerror);

                // Make sure the record still exists
                expect(allData).to.have.same.deep.members([
                    {key: [12345, 'John Doe'], value: {id: 12345, name: 'John Doe'}}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should throw an error if the transaction is read-only', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readonly');
            var store = tx.objectStore('out-of-line-generated');

            try {
                store.delete(1);
            }
            catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(env.DOMException);
            expect(err.name).to.equal('ReadOnlyError');

            db.close();
            done();
        });
    });

    it('should throw an error if the transaction is closed', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');

            setTimeout(function() {
                try {
                    store.delete(1);
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
        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');

            try {
                store.delete();
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

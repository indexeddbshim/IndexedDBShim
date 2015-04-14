/*********************************************************
 *     This file contains tests that are THE SAME for
 *       IDBObjectStore.add and IDBObjectStore.put
 *********************************************************/
['put', 'add'].forEach(function(save) {
    'use strict';

    describe('IDBObjectStore.' + save, function() {
        it('should return an IDBRequest', function(done) {
            util.createDatabase('inline', function(err, db) {
                var tx = db.transaction('inline', 'readwrite');
                tx.onerror = done;

                var store = tx.objectStore('inline');
                var save1 = store[save]({id: 12345});
                expect(save1).to.be.an.instanceOf(IDBRequest);

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
                var save1 = store[save]({id: 12345});
                save1.onerror = done;

                save1.onsuccess = sinon.spy(function(event) {
                    expect(event).to.be.an.instanceOf(env.Event);
                    expect(event.target).to.equal(save1);
                });

                tx.oncomplete = function() {
                    sinon.assert.calledOnce(save1.onsuccess);
                    db.close();
                    done();
                };
            });
        });

        it('should save a structured clone of the data, not the actual data', function(done) {
            var john = new util.Person('John Doe');
            var bob = new util.Person('Bob Smith', 30, new Date(2000, 5, 20), true);

            util.createDatabase('out-of-line-generated', function(err, db) {
                var tx = db.transaction('out-of-line-generated', 'readwrite');
                tx.onerror = done;

                var store = tx.objectStore('out-of-line-generated');
                store[save](john);
                store[save](bob);

                var allData;
                util.getAll(store, function(err, data) {
                    allData = data;
                });

                tx.oncomplete = function() {
                    expect(allData).to.have.lengthOf(2);

                    // The data should have been cloned
                    expect(allData).not.to.contain(john);
                    expect(allData).not.to.contain(bob);

                    // The data should have been saved as plain objects, not Person classes
                    expect(allData[0]).not.to.be.an.instanceOf(util.Person);
                    expect(allData[1]).not.to.be.an.instanceOf(util.Person);

                    // Only the instance properties should have been saved, not prototype properties
                    // The `dob` property should still be a Date class
                    expect(allData).to.have.same.deep.members([
                        {key: 1, value: {name: 'John Doe'}},
                        {key: 2, value: {name: 'Bob Smith', dob: new Date(2000, 5, 20), age: 30, isMarried: true}}
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
                    store[save]({foo: 'bar'});
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
                        store[save]({foo: 'bar'});
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
                    store[save]();
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

        describe('out-of-line keys', function() {
            it('should save data with an out-of-line key', function(done) {
                util.createDatabase('out-of-line', function(err, db) {
                    var tx = db.transaction('out-of-line', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('out-of-line');
                    var save1 = store[save]({foo: 'bar'}, 12345);
                    var save2 = store[save]({biz: 'baz'}, 45678);

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.equal(12345);
                        expect(save2.result).to.equal(45678);

                        expect(allData).to.have.same.deep.members([
                            {key: 12345, value: {foo: 'bar'}},
                            {key: 45678, value: {biz: 'baz'}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should save data with a generated out-of-line key', function(done) {
                util.createDatabase('out-of-line-generated', function(err, db) {
                    var tx = db.transaction('out-of-line-generated', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('out-of-line-generated');
                    var save1 = store[save]({foo: 'bar'});
                    var save2 = store[save]({biz: 'baz'});

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.equal(1);
                        expect(save2.result).to.equal(2);

                        expect(allData).to.have.same.deep.members([
                            {key: 1, value: {foo: 'bar'}},
                            {key: 2, value: {biz: 'baz'}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should allow generated out-of-line keys to be specified', function(done) {
                if (env.isNative && env.browser.isSafari) {
                    // BUG: Safari's native IndexedDB resets the key generator whenever key is specified, causing key conflicts
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('out-of-line-generated', function(err, db) {
                    var tx = db.transaction('out-of-line-generated', 'readwrite');
                    tx.onerror = function(event) {
                        done(tx.error || event);
                    };

                    var store = tx.objectStore('out-of-line-generated');
                    var save1 = store[save]({foo: 'bar'});          // <-- generated key
                    var save2 = store[save]({biz: 'baz'}, 'abc');   // <-- specified key
                    var save3 = store[save]({bat: 'bar'});          // <-- generated key
                    var save4 = store[save]({bar: 'foo'}, 99);      // <-- specified key
                    var save5 = store[save]({baz: 'biz'});          // <-- generated key

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.equal(1);       // Generated keys should always start at 1
                        expect(save2.result).to.equal('abc');   // This key was explicitly specified
                        expect(save3.result).to.be.above(1);    // Depending on the implementation, it might be 2 or 3
                        expect(save4.result).to.equal(99);      // This key was explicitly specified
                        expect(save5.result).to.be.above(2);    // Depending on the implementation, it might be 3, 5, or 100

                        expect(allData).to.have.same.deep.members([
                            {key: 1, value: {foo: 'bar'}},
                            {key: 'abc', value: {biz: 'baz'}},
                            {key: save3.result, value: {bat: 'bar'}},
                            {key: 99, value: {bar: 'foo'}},
                            {key: save5.result, value: {baz: 'biz'}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should allow these keys', function(done) {
                util.createDatabase('out-of-line', function(err, db) {
                    var tx = db.transaction('out-of-line', 'readwrite');
                    var store = tx.objectStore('out-of-line');
                    tx.onerror = done;
                    var savingCounter = 0, savedCounter = 0;

                    saveKey('');                            // empty string
                    saveKey(0);                             // zero
                    saveKey(-99999);                        // negative number
                    saveKey(3.12345);                       // float
                    saveKey(Infinity);                      // infinity
                    saveKey(-Infinity);                     // negative infinity
                    saveKey(new Date(2000, 1, 2));          // Date

                    if (env.isShimmed || !env.browser.isIE) {
                        saveKey([]);                        // empty array
                        saveKey(['a', '', 'b']);            // array of strings
                        saveKey([1, 2.345, -678]);          // array of numbers
                        saveKey([new Date(2005, 6, 7)]);    // array of Dates
                    }

                    function saveKey(key) {
                        savingCounter++;
                        var saving = store[save]({foo: key}, key);
                        saving.onerror = done;
                        saving.onsuccess = function() {
                            if (typeof(key) === 'object') {
                                // The key should be a clone, not the same object
                                expect(saving.result).not.to.equal(key);
                                expect(saving.result).to.deep.equal(key);
                            }

                            // Re-fetch the data using the key
                            var get = store.get(key);
                            get.onerror = done;
                            get.onsuccess = function() {
                                expect(get.result).to.deep.equal({foo: key});
                                savedCounter++;
                            };
                        };
                    }

                    tx.oncomplete = function() {
                        // Make sure all the saves completed
                        expect(savedCounter).to.equal(savingCounter);

                        db.close();
                        done();
                    };
                });
            });

            it('should not allow these keys', function(done) {
                util.createDatabase('out-of-line', function(err, db) {
                    var tx = db.transaction('out-of-line', 'readwrite');
                    var store = tx.objectStore('out-of-line');
                    tx.onerror = done;

                    tryToSaveKey(undefined);                // undefined
                    tryToSaveKey(NaN);                      // NaN
                    tryToSaveKey(true);                     // boolean
                    tryToSaveKey(false);                    // boolean
                    tryToSaveKey({});                       // empty object
                    tryToSaveKey({foo: 'bar'});             // object
                    tryToSaveKey(new util.Person('John'));  // Class
                    tryToSaveKey([1, undefined, 2]);        // array with undefined
                    tryToSaveKey([1, null, 2]);             // array with null
                    tryToSaveKey([true, false]);            // array of booleans
                    tryToSaveKey([{foo: 'bar'}]);           // array of objects

                    if (env.isShimmed || !env.browser.isIE) {
                        tryToSaveKey(null);                 // null
                        tryToSaveKey(/^regex$/);            // RegExp
                    }

                    function tryToSaveKey(key) {
                        var err = null;

                        try {
                            store[save]({foo: 'bar'}, key);
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

            it('should allow these data types', function(done) {
                util.createDatabase('out-of-line-generated', function(err, db) {
                    var tx = db.transaction('out-of-line-generated', 'readwrite');
                    var store = tx.objectStore('out-of-line-generated');
                    tx.onerror = done;
                    var savingCounter = 0, savedCounter = 0;

                    saveData(undefined);                    // undefined
                    saveData(true);                         // boolean
                    saveData(false);                        // boolean
                    saveData('');                           // empty string
                    saveData('hello world');                // string
                    saveData(0);                            // zero
                    saveData(-99999);                       // negative number
                    saveData(3.12345);                      // float
                    saveData(Infinity);                     // infinity
                    saveData(-Infinity);                    // negative infinity
                    saveData(NaN);                          // NaN
                    saveData({});                           // empty object
                    saveData({foo: 'bar'});                 // object
                    saveData(new Date(2000, 1, 2));         // Date
                    saveData(new util.Person('John', 30));  // Class
                    saveData(/^regex$/);                    // RegExp
                    saveData([]);                           // empty array
                    saveData(['a', '', 'b']);               // array of strings
                    saveData([1, 2.345, -678]);             // array of numbers
                    saveData([new Date(2005, 6, 7)]);       // array of Dates
                    saveData([1, undefined, 2]);            // array with undefined
                    saveData([1, null, 2]);                 // array with null
                    saveData([1, NaN, 3]);                  // array with NaN
                    saveData([true, false]);                // array of booleans
                    saveData([{foo: 'bar'}, {}]);           // array of objects

                    if (env.isShimmed || !env.browser.isIE) {
                        saveData(null);                     // null
                    }

                    function saveData(data) {
                        savingCounter++;
                        var saving = store[save](data);
                        saving.onerror = done;
                        saving.onsuccess = function() {
                            // Re-fetch the data to make sure it serialized/deserialized correctly
                            var get = store.get(saving.result);
                            get.onerror = done;
                            get.onsuccess = function() {
                                if (typeof(data) === 'object' && data !== null) {
                                    // The data should be a clone, not the same object
                                    expect(get.result).not.to.equal(data);
                                }

                                if (data instanceof Array) {
                                    expect(get.result).to.have.lengthOf(data.length);
                                    for (var i = 0; i < data.length; i++) {
                                        expect(get.result[i]).to.deep.equal(data[i]);
                                    }
                                }
                                else if (data instanceof util.Person) {
                                    // Only the "name" and "age" properties should have been serialized
                                    expect(get.result).to.deep.equal({name: 'John', age: 30});
                                }
                                else {
                                    expect(get.result).to.deep.equal(data);
                                }

                                savedCounter++;
                            };
                        };
                    }

                    tx.oncomplete = function() {
                        // Make sure all the saves completed
                        expect(savedCounter).to.equal(savingCounter);

                        db.close();
                        done();
                    };
                });
            });

            it('should throw an error if no key is specified', function(done) {
                util.createDatabase('out-of-line', function(err, db) {
                    var tx = db.transaction('out-of-line', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('out-of-line');
                    try {
                        // Not specifying a key for an out-of-line object store
                        store[save]({foo: 'bar'});
                    }
                    catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(env.DOMException);
                    expect(err.name).to.equal('DataError');

                    db.close();
                    done();
                });
            });

            it('should save out-of-line keys in multiple simultaneous transactions', function(done) {
                util.createDatabase('out-of-line', function(err, db) {
                    var tx1 = db.transaction('out-of-line', 'readwrite');
                    var tx2 = db.transaction('out-of-line', 'readwrite');
                    var tx3 = db.transaction('out-of-line', 'readwrite');

                    var store1 = tx1.objectStore('out-of-line');
                    var store2 = tx2.objectStore('out-of-line');
                    var store3 = tx3.objectStore('out-of-line');

                    var save1 = store1[save]({foo: 'one'}, 1);
                    var save2 = store2[save]({foo: 'two'}, 2);
                    var save3 = store3[save]({foo: 'three'}, 3);

                    var allData;
                    util.getAll(store3, function(err, data) {
                        allData = data;
                    });

                    tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function() {
                        if (tx1.oncomplete.calledThrice) {
                            expect(save1.result).to.equal(1);
                            expect(save2.result).to.equal(2);
                            expect(save3.result).to.equal(3);

                            expect(allData).to.have.same.deep.members([
                                {key: 1, value: {foo: 'one'}},
                                {key: 2, value: {foo: 'two'}},
                                {key: 3, value: {foo: 'three'}}
                            ]);

                            db.close();
                            done();
                        }
                    });
                });
            });

            it('should save generated out-of-line keys in multiple simultaneous transactions', function(done) {
                util.createDatabase('out-of-line-generated', function(err, db) {
                    var tx1 = db.transaction('out-of-line-generated', 'readwrite');
                    var tx2 = db.transaction('out-of-line-generated', 'readwrite');
                    var tx3 = db.transaction('out-of-line-generated', 'readwrite');

                    var store1 = tx1.objectStore('out-of-line-generated');
                    var store2 = tx2.objectStore('out-of-line-generated');
                    var store3 = tx3.objectStore('out-of-line-generated');

                    var save1 = store1[save]({foo: 'one'});
                    var save2 = store2[save]({foo: 'two'});
                    var save3 = store3[save]({foo: 'three'});

                    var allData;
                    util.getAll(store3, function(err, data) {
                        allData = data;
                    });

                    tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function() {
                        if (tx1.oncomplete.calledThrice) {
                            expect(save1.result).to.equal(1);
                            expect(save2.result).to.equal(2);
                            expect(save3.result).to.equal(3);

                            expect(allData).to.have.same.deep.members([
                                {key: 1, value: {foo: 'one'}},
                                {key: 2, value: {foo: 'two'}},
                                {key: 3, value: {foo: 'three'}}
                            ]);

                            db.close();
                            done();
                        }
                    });
                });
            });
        });

        describe('inline keys', function() {
            it('should save data with an inline key', function(done) {
                util.createDatabase('inline', function(err, db) {
                    var tx = db.transaction('inline', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('inline');
                    var save1 = store[save]({id: 12345});
                    var save2 = store[save]({id: 45678});

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.deep.equal(12345);
                        expect(save2.result).to.deep.equal(45678);

                        expect(allData).to.have.same.deep.members([
                            {key: 12345, value: {id: 12345}},
                            {key: 45678, value: {id: 45678}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should save data with a generated inline key', function(done) {
                util.createDatabase('inline-generated', function(err, db) {
                    var tx = db.transaction('inline-generated', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('inline-generated');
                    var save1 = store[save]({foo: 'bar'});
                    var save2 = store[save]({biz: 'baz'});

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.deep.equal(1);
                        expect(save2.result).to.deep.equal(2);

                        expect(allData).to.have.same.deep.members([
                            {key: 1, value: {id: 1, foo: 'bar'}},
                            {key: 2, value: {id: 2, biz: 'baz'}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should allow generated inline keys to be specified', function(done) {
                if (env.isNative && env.browser.isSafari) {
                    // BUG: Safari's native IndexedDB resets the key generator whenever key is specified, causing key conflicts
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('inline-generated', function(err, db) {
                    var tx = db.transaction('inline-generated', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('inline-generated');
                    var save1 = store[save]({foo: 'bar'});             // <-- generated key
                    var save2 = store[save]({id: 'abc', biz: 'baz'});  // <-- specified key
                    var save3 = store[save]({bat: 'bar'});             // <-- generated key
                    var save4 = store[save]({id: 99, bar: 'foo'});     // <-- specified key
                    var save5 = store[save]({baz: 'biz'});             // <-- generated key

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.equal(1);       // Generated keys should always start at 1
                        expect(save2.result).to.equal('abc');   // This key was explicitly specified
                        expect(save3.result).to.be.above(1);    // Depending on the implementation, it might be 2 or 3
                        expect(save4.result).to.equal(99);      // This key was explicitly specified
                        expect(save5.result).to.be.above(2);    // Depending on the implementation, it might be 3, 5, or 100

                        expect(allData).to.have.same.deep.members([
                            {key: 1, value: {id: 1, foo: 'bar'}},
                            {key: 'abc', value: {id: 'abc', biz: 'baz'}},
                            {key: save3.result, value: {id: save3.result, bat: 'bar'}},
                            {key: 99, value: {id: 99, bar: 'foo'}},
                            {key: save5.result, value: {id: save5.result, baz: 'biz'}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should allow these keys', function(done) {
                util.createDatabase('inline', function(err, db) {
                    var tx = db.transaction('inline', 'readwrite');
                    var store = tx.objectStore('inline');
                    tx.onerror = done;
                    var savingCounter = 0, savedCounter = 0;

                    saveKey('');                            // empty string
                    saveKey(0);                             // zero
                    saveKey(-99999);                        // negative number
                    saveKey(3.12345);                       // float
                    saveKey(Infinity);                      // infinity
                    saveKey(-Infinity);                     // negative infinity
                    saveKey(new Date(2000, 1, 2));          // Date

                    if (env.isShimmed || !env.browser.isIE) {
                        saveKey([]);                        // empty array
                        saveKey(['a', '', 'b']);            // array of strings
                        saveKey([1, 2.345, -678]);          // array of numbers
                        saveKey([new Date(2005, 6, 7)]);    // array of Dates
                    }

                    function saveKey(key) {
                        savingCounter++;
                        var saving = store[save]({id: key});
                        saving.onerror = done;
                        saving.onsuccess = function() {
                            if (typeof(key) === 'object') {
                                // The key should be a clone, not the same object
                                expect(saving.result).not.to.equal(key);
                                expect(saving.result).to.deep.equal(key);
                            }

                            // Re-fetch the data using the key
                            var get = store.get(key);
                            get.onerror = done;
                            get.onsuccess = function() {
                                expect(get.result).to.deep.equal({id: key});
                                savedCounter++;
                            };
                        };
                    }

                    tx.oncomplete = function() {
                        // Make sure all the saves completed
                        expect(savedCounter).to.equal(savingCounter);

                        db.close();
                        done();
                    };
                });
            });

            it('should not allow these keys', function(done) {
                util.createDatabase('inline', function(err, db) {
                    var tx = db.transaction('inline', 'readwrite');
                    var store = tx.objectStore('inline');
                    tx.onerror = done;

                    tryToSaveKey(undefined);                // undefined
                    tryToSaveKey(NaN);                      // NaN
                    tryToSaveKey(true);                     // boolean
                    tryToSaveKey(false);                    // boolean
                    tryToSaveKey({});                       // empty object
                    tryToSaveKey({foo: 'bar'});             // object
                    tryToSaveKey(new util.Person('John'));  // Class
                    tryToSaveKey(/^regex$/);                // RegExp
                    tryToSaveKey([1, undefined, 2]);        // array with undefined
                    tryToSaveKey([1, null, 2]);             // array with null
                    tryToSaveKey([true, false]);            // array of booleans
                    tryToSaveKey([{foo: 'bar'}]);           // array of objects

                    if (env.isShimmed || !env.browser.isIE) {
                        tryToSaveKey(null);                 // null
                    }

                    function tryToSaveKey(key) {
                        var err = null;

                        try {
                            store[save]({id: key});
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

            it('should allow these data types', function(done) {
                util.createDatabase('inline-generated', function(err, db) {
                    var tx = db.transaction('inline-generated', 'readwrite');
                    var store = tx.objectStore('inline-generated');
                    tx.onerror = done;
                    var savingCounter = 0, savedCounter = 0;

                    saveData({});                           // empty object
                    saveData({foo: 'bar'});                 // object
                    saveData(new util.Person('John', 30));  // Class
                    saveData([]);                           // empty array
                    saveData(['a', '', 'b']);               // array of strings
                    saveData([1, 2.345, -678]);             // array of numbers
                    saveData([new Date(2005, 6, 7)]);       // array of Dates
                    saveData([1, undefined, 2]);            // array with undefined
                    saveData([1, null, 2]);                 // array with null
                    saveData([true, false]);                // array of booleans
                    saveData([{foo: 'bar'}, {}]);           // array of objects

                    if (env.isShimmed || !env.browser.isFirefox) {
                        saveData(new Date(2000, 1, 2));     // Date
                        saveData(/^regex$/);                // RegExp
                    }

                    function saveData(data) {
                        savingCounter++;
                        var saving = store[save](data);
                        saving.onerror = done;
                        saving.onsuccess = function() {
                            // Re-fetch the data to make sure it serialized/deserialized correctly
                            var get = store.get(saving.result);
                            get.onerror = done;
                            get.onsuccess = function() {
                                if (typeof(data) === 'object' && data !== null) {
                                    // The data should be a clone, not the same object
                                    expect(get.result).not.to.equal(data);
                                }

                                if (data instanceof Array) {
                                    expect(get.result).to.have.lengthOf(data.length);
                                    for (var i = 0; i < data.length; i++) {
                                        expect(get.result[i]).to.deep.equal(data[i]);
                                    }
                                }
                                else if (data instanceof util.Person) {
                                    // Only the "name" and "age" properties should have been serialized
                                    expect(get.result).to.deep.equal({id: get.result.id, name: 'John', age: 30});
                                }
                                else {
                                    data.id = get.result.id;
                                    expect(get.result).to.deep.equal(data);
                                }

                                savedCounter++;
                            };
                        };
                    }

                    tx.oncomplete = function() {
                        // Make sure all the saves completed
                        expect(savedCounter).to.equal(savingCounter);

                        db.close();
                        done();
                    };
                });
            });

            it('should not allow these data types', function(done) {
                util.createDatabase('inline-generated', function(err, db) {
                    var tx = db.transaction('inline-generated', 'readwrite');
                    var store = tx.objectStore('inline-generated');
                    tx.onerror = done;

                    tryToSaveData(undefined);           // undefined
                    tryToSaveData(true);                // boolean
                    tryToSaveData(false);               // boolean
                    tryToSaveData('');                  // empty string
                    tryToSaveData('hello world');       // string
                    tryToSaveData(0);                   // zero
                    tryToSaveData(-99999);              // negative number
                    tryToSaveData(3.12345);             // float
                    tryToSaveData(Infinity);            // infinity
                    tryToSaveData(-Infinity);           // negative infinity
                    tryToSaveData(NaN);                 // NaN

                    if (env.isShimmed || !env.browser.isIE) {
                        tryToSaveData(null);            // null
                    }

                    function tryToSaveData(value) {
                        var err;

                        try {
                            store[save](value);
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

            it('should throw an error if a key is specified', function(done) {
                util.createDatabase('inline', function(err, db) {
                    var tx = db.transaction('inline', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('inline');
                    try {
                        // Specifying an out-of-line key for an inline object store
                        store[save]({id: 12345}, 45678);
                    }
                    catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(env.DOMException);
                    expect(err.name).to.equal('DataError');

                    db.close();
                    done();
                });
            });

            it('should save inline keys in multiple simultaneous transactions', function(done) {
                util.createDatabase('inline', function(err, db) {
                    var tx1 = db.transaction('inline', 'readwrite');
                    var tx2 = db.transaction('inline', 'readwrite');
                    var tx3 = db.transaction('inline', 'readwrite');

                    var store1 = tx1.objectStore('inline');
                    var store2 = tx2.objectStore('inline');
                    var store3 = tx3.objectStore('inline');

                    var save1 = store1[save]({id: 'one'});
                    var save2 = store2[save]({id: 'two'});
                    var save3 = store3[save]({id: 'three'});

                    var allData;
                    util.getAll(store3, function(err, data) {
                        allData = data;
                    });

                    tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function() {
                        if (tx1.oncomplete.calledThrice) {
                            expect(save1.result).to.equal('one');
                            expect(save2.result).to.equal('two');
                            expect(save3.result).to.equal('three');

                            expect(allData).to.have.same.deep.members([
                                {key: 'one', value: {id: 'one'}},
                                {key: 'two', value: {id: 'two'}},
                                {key: 'three', value: {id: 'three'}}
                            ]);

                            db.close();
                            done();
                        }
                    });
                });
            });

            it('should save generated inline keys in multiple simultaneous transactions', function(done) {
                util.createDatabase('inline-generated', function(err, db) {
                    var tx1 = db.transaction('inline-generated', 'readwrite');
                    var tx2 = db.transaction('inline-generated', 'readwrite');
                    var tx3 = db.transaction('inline-generated', 'readwrite');

                    var store1 = tx1.objectStore('inline-generated');
                    var store2 = tx2.objectStore('inline-generated');
                    var store3 = tx3.objectStore('inline-generated');

                    var save1 = store1[save]({foo: 'one'});
                    var save2 = store2[save]({foo: 'two'});
                    var save3 = store3[save]({foo: 'three'});

                    var allData;
                    util.getAll(store3, function(err, data) {
                        allData = data;
                    });

                    tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function() {
                        if (tx1.oncomplete.calledThrice) {
                            expect(save1.result).to.equal(1);
                            expect(save2.result).to.equal(2);
                            expect(save3.result).to.equal(3);

                            expect(allData).to.have.same.deep.members([
                                {key: 1, value: {id: 1, foo: 'one'}},
                                {key: 2, value: {id: 2, foo: 'two'}},
                                {key: 3, value: {id: 3, foo: 'three'}}
                            ]);

                            db.close();
                            done();
                        }
                    });
                });
            });
        });

        describe('dotted keys', function() {
            it('should save data with a dotted key', function(done) {
                util.createDatabase('dotted', function(err, db) {
                    var tx = db.transaction('dotted', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('dotted');
                    var save1 = store[save]({name: {first: 'John', last: 'Doe'}});
                    var save2 = store[save]({name: {first: 'Bob', last: 'Smith'}});

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.deep.equal('John');
                        expect(save2.result).to.deep.equal('Bob');

                        expect(allData).to.have.same.deep.members([
                            {key: 'John', value: {name: {first: 'John', last: 'Doe'}}},
                            {key: 'Bob', value: {name: {first: 'Bob', last: 'Smith'}}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should save data with a generated dotted key', function(done) {
                util.createDatabase('dotted-generated', function(err, db) {
                    var tx = db.transaction('dotted-generated', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('dotted-generated');
                    var save1 = store[save]({lastName: 'Doe'});
                    var save2 = store[save]({lastName: 'Smith'});

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.deep.equal(1);
                        expect(save2.result).to.deep.equal(2);

                        expect(allData).to.have.same.deep.members([
                            {key: 1, value: {name: {first: 1}, lastName: 'Doe'}},
                            {key: 2, value: {name: {first: 2}, lastName: 'Smith'}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should save dotted keys in multiple simultaneous transactions', function(done) {
                util.createDatabase('dotted', function(err, db) {
                    var tx1 = db.transaction('dotted', 'readwrite');
                    var tx2 = db.transaction('dotted', 'readwrite');
                    var tx3 = db.transaction('dotted', 'readwrite');

                    var store1 = tx1.objectStore('dotted');
                    var store2 = tx2.objectStore('dotted');
                    var store3 = tx3.objectStore('dotted');

                    var save1 = store1[save]({name: {first: 'John'}});
                    var save2 = store2[save]({name: {first: 'Sarah'}});
                    var save3 = store3[save]({name: {first: 'Bob'}});

                    var allData;
                    util.getAll(store3, function(err, data) {
                        allData = data;
                    });

                    tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function() {
                        if (tx1.oncomplete.calledThrice) {
                            expect(save1.result).to.equal('John');
                            expect(save2.result).to.equal('Sarah');
                            expect(save3.result).to.equal('Bob');

                            expect(allData).to.have.same.deep.members([
                                {key: 'John', value: {name: {first: 'John'}}},
                                {key: 'Sarah', value: {name: {first: 'Sarah'}}},
                                {key: 'Bob', value: {name: {first: 'Bob'}}}
                            ]);

                            db.close();
                            done();
                        }
                    });
                });
            });

            it('should save generated dotted keys in multiple simultaneous transactions', function(done) {
                util.createDatabase('dotted-generated', function(err, db) {
                    var tx1 = db.transaction('dotted-generated', 'readwrite');
                    var tx2 = db.transaction('dotted-generated', 'readwrite');
                    var tx3 = db.transaction('dotted-generated', 'readwrite');

                    var store1 = tx1.objectStore('dotted-generated');
                    var store2 = tx2.objectStore('dotted-generated');
                    var store3 = tx3.objectStore('dotted-generated');

                    var save1 = store1[save]({foo: 'one'});
                    var save2 = store2[save]({foo: 'two'});
                    var save3 = store3[save]({foo: 'three'});

                    var allData;
                    util.getAll(store3, function(err, data) {
                        allData = data;
                    });

                    tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function() {
                        if (tx1.oncomplete.calledThrice) {
                            expect(save1.result).to.equal(1);
                            expect(save2.result).to.equal(2);
                            expect(save3.result).to.equal(3);

                            expect(allData).to.have.same.deep.members([
                                {key: 1, value: {name: {first: 1}, foo: 'one'}},
                                {key: 2, value: {name: {first: 2}, foo: 'two'}},
                                {key: 3, value: {name: {first: 3}, foo: 'three'}}
                            ]);

                            db.close();
                            done();
                        }
                    });
                });
            });
        });

        describe('compound keys', function() {
            it('should save data with a compound out-of-line key', function(done) {
                if (env.isNative && env.browser.isIE) {
                    // BUG: IE's native IndexedDB does not support compound keys at all
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('out-of-line-compound', function(err, db) {
                    var tx = db.transaction('out-of-line-compound', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('out-of-line-compound');
                    var save1 = store[save]({foo: 'bar'}, [1, 2, 'c']);
                    var save2 = store[save]({biz: 'baz'}, ['a', 'b', 3]);

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.deep.equal([1, 2, 'c']);
                        expect(save2.result).to.deep.equal(['a', 'b', 3]);

                        expect(allData).to.have.same.deep.members([
                            {key: [1, 2, 'c'], value: {foo: 'bar'}},
                            {key: ['a', 'b', 3], value: {biz: 'baz'}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should save data with a compound inline key', function(done) {
                if (env.isNative && env.browser.isIE) {
                    // BUG: IE's native IndexedDB does not support compound keys at all
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('inline-compound', function(err, db) {
                    var tx = db.transaction('inline-compound', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('inline-compound');
                    var save1 = store[save]({id: 12345, name: 'John Doe'});
                    var save2 = store[save]({id: 12345, name: 'Bob Smith'});

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.deep.equal([12345, 'John Doe']);
                        expect(save2.result).to.deep.equal([12345, 'Bob Smith']);

                        expect(allData).to.have.same.deep.members([
                            {key: [12345, 'John Doe'], value: {id: 12345, name: 'John Doe'}},
                            {key: [12345, 'Bob Smith'], value: {id: 12345, name: 'Bob Smith'}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should save data with a compound dotted key', function(done) {
                if (env.isNative && env.browser.isIE) {
                    // BUG: IE's native IndexedDB does not support compound keys at all
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('dotted-compound', function(err, db) {
                    var tx = db.transaction('dotted-compound', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('dotted-compound');
                    var save1 = store[save]({id: 12345, name: {first: 'John', last: 'Doe'}});
                    var save2 = store[save]({id: 12345, name: {first: 'Bob', last: 'Smith'}});

                    var allData;
                    util.getAll(store, function(err, data) {
                        allData = data;
                    });

                    tx.oncomplete = function() {
                        expect(save1.result).to.deep.equal([12345, 'John', 'Doe']);
                        expect(save2.result).to.deep.equal([12345, 'Bob', 'Smith']);

                        expect(allData).to.have.same.deep.members([
                            {key: [12345, 'John', 'Doe'], value: {id: 12345, name: {first: 'John', last: 'Doe'}}},
                            {key: [12345, 'Bob', 'Smith'], value: {id: 12345, name: {first: 'Bob', last: 'Smith'}}}
                        ]);

                        db.close();
                        done();
                    };
                });
            });

            it('should allow these keys', function(done) {
                if (env.isNative && env.browser.isIE) {
                    // BUG: IE's native IndexedDB does not support compound keys at all
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('dotted-compound', function(err, db) {
                    var tx = db.transaction('dotted-compound', 'readwrite');
                    var store = tx.objectStore('dotted-compound');
                    tx.onerror = done;
                    var savingCounter = 0, savedCounter = 0;

                    saveKey('');                            // empty string
                    saveKey(0);                             // zero
                    saveKey(-99999);                        // negative number
                    saveKey(3.12345);                       // float
                    saveKey(Infinity);                      // infinity
                    saveKey(-Infinity);                     // negative infinity
                    saveKey(new Date(2000, 1, 2));          // Date
                    saveKey([]);                            // empty array
                    saveKey(['a', '', 'b']);                // array of strings
                    saveKey([1, 2.345, -678]);              // array of numbers
                    saveKey([new Date(2005, 6, 7)]);        // array of Dates

                    function saveKey(key) {
                        savingCounter++;
                        var saving = store[save]({id: 1, name: {first: 'abc', last: key}});
                        saving.onerror = done;
                        saving.onsuccess = function() {
                            if (typeof(key) === 'object') {
                                // The key should be a clone, not the same object
                                expect(saving.result[2]).not.to.equal(key);
                                expect(saving.result[2]).to.deep.equal(key);
                            }

                            // Re-fetch the data using the key
                            var get = store.get([1, 'abc', key]);
                            get.onerror = done;
                            get.onsuccess = function() {
                                expect(get.result).to.deep.equal({id: 1, name: {first: 'abc', last: key}});
                                savedCounter++;
                            };
                        };
                    }

                    tx.oncomplete = function() {
                        // Make sure all the saves completed
                        expect(savedCounter).to.equal(savingCounter);

                        db.close();
                        done();
                    };
                });
            });

            it('should not allow these keys', function(done) {
                if (env.isNative && env.browser.isIE) {
                    // BUG: IE's native IndexedDB does not support compound keys at all
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('dotted-compound', function(err, db) {
                    var tx = db.transaction('dotted-compound', 'readwrite');
                    var store = tx.objectStore('dotted-compound');
                    tx.onerror = done;

                    tryToSaveKey(undefined);                // undefined
                    tryToSaveKey(NaN);                      // NaN
                    tryToSaveKey(true);                     // boolean
                    tryToSaveKey(false);                    // boolean
                    tryToSaveKey({});                       // empty object
                    tryToSaveKey({foo: 'bar'});             // object
                    tryToSaveKey(/^regex$/);                // RegExp
                    tryToSaveKey([1, undefined, 2]);        // array with undefined
                    tryToSaveKey([1, null, 2]);             // array with null
                    tryToSaveKey([true, false]);            // array of booleans
                    tryToSaveKey([{foo: 'bar'}]);           // array of objects

                    if (env.isShimmed || !env.browser.isIE) {
                        tryToSaveKey(null);                 // null
                    }

                    function tryToSaveKey(key) {
                        var err = null;

                        try {
                            store[save]({id: 1, name: {first: 'abc', last: key}});
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

            it('should throw an error if the key is incomplete', function(done) {
                if (env.isNative && env.browser.isIE) {
                    // BUG: IE's native IndexedDB does not support compound keys at all
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('inline-compound', function(err, db) {
                    var tx = db.transaction('inline-compound', 'readwrite');
                    tx.onerror = done;

                    var store = tx.objectStore('inline-compound');
                    try {
                        store[save]({id: 1});   // The "name" property is missing
                    }
                    catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(env.DOMException);
                    expect(err.name).to.equal('DataError');

                    db.close();
                    done();
                });
            });

            it('should save compound inline keys in multiple simultaneous transactions', function(done) {
                if (env.isNative && env.browser.isIE) {
                    // BUG: IE's native IndexedDB does not support compound keys at all
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('inline-compound', function(err, db) {
                    var tx1 = db.transaction('inline-compound', 'readwrite');
                    var tx2 = db.transaction('inline-compound', 'readwrite');
                    var tx3 = db.transaction('inline-compound', 'readwrite');

                    var store1 = tx1.objectStore('inline-compound');
                    var store2 = tx2.objectStore('inline-compound');
                    var store3 = tx3.objectStore('inline-compound');

                    var save1 = store1[save]({id: 1, name: 'John'});
                    var save2 = store2[save]({id: 2, name: 'Sarah'});
                    var save3 = store3[save]({id: 3, name: 'Bob'});

                    var allData;
                    util.getAll(store3, function(err, data) {
                        allData = data;
                    });

                    tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function() {
                        if (tx1.oncomplete.calledThrice) {
                            expect(save1.result).to.deep.equal([1, 'John']);
                            expect(save2.result).to.deep.equal([2, 'Sarah']);
                            expect(save3.result).to.deep.equal([3, 'Bob']);

                            expect(allData).to.have.same.deep.members([
                                {key: [1, 'John'], value: {id: 1, name: 'John'}},
                                {key: [2, 'Sarah'], value: {id: 2, name: 'Sarah'}},
                                {key: [3, 'Bob'], value: {id: 3, name: 'Bob'}}
                            ]);

                            db.close();
                            done();
                        }
                    });
                });
            });

            it('should save compound out-of-line keys in multiple simultaneous transactions', function(done) {
                if (env.isNative && env.browser.isIE) {
                    // BUG: IE's native IndexedDB does not support compound keys at all
                    console.error('Skipping test: ' + this.test.title);
                    return done();
                }

                util.createDatabase('out-of-line', function(err, db) {
                    var tx1 = db.transaction('out-of-line', 'readwrite');
                    var tx2 = db.transaction('out-of-line', 'readwrite');
                    var tx3 = db.transaction('out-of-line', 'readwrite');

                    var store1 = tx1.objectStore('out-of-line');
                    var store2 = tx2.objectStore('out-of-line');
                    var store3 = tx3.objectStore('out-of-line');

                    var save1 = store1[save]({foo: 'one'}, [1, 'b', 3]);
                    var save2 = store2[save]({foo: 'two'}, [2, 'b', 3]);
                    var save3 = store3[save]({foo: 'three'}, [3, 'b', 3]);

                    var allData;
                    util.getAll(store3, function(err, data) {
                        allData = data;
                    });

                    tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function() {
                        if (tx1.oncomplete.calledThrice) {
                            expect(save1.result).to.deep.equal([1,'b',3]);
                            expect(save2.result).to.deep.equal([2,'b',3]);
                            expect(save3.result).to.deep.equal([3,'b',3]);

                            expect(allData).to.have.same.deep.members([
                                {key: [1,'b',3], value: {foo: 'one'}},
                                {key: [2,'b',3], value: {foo: 'two'}},
                                {key: [3,'b',3], value: {foo: 'three'}}
                            ]);

                            db.close();
                            done();
                        }
                    });
                });
            });
        });
    });
});

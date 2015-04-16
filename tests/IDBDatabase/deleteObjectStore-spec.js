describe('IDBDatabase.deleteObjectStore', function() {
    'use strict';

    var indexedDB;
    beforeEach(function() {
        indexedDB = env.indexedDB;
    });

    describe('success tests', function() {
        it('should return undefined', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    db.createObjectStore('My Store');
                    var result = db.deleteObjectStore('My Store');

                    expect(result).to.be.undefined;
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should delete an object store that was created in the same transaction', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    db.createObjectStore('My Store 1');
                    db.createObjectStore('My Store 2');

                    expect(Array.prototype.slice.call(db.objectStoreNames))
                        .to.have.same.members(['My Store 1', 'My Store 2']);

                    db.deleteObjectStore('My Store 2');

                    expect(Array.prototype.slice.call(db.objectStoreNames))
                        .to.have.same.members(['My Store 1']);
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should delete an object store that was created in a previous transaction', function(done) {
            util.generateDatabaseName(function(err, name) {
                transaction1();

                // Create some object stores
                function transaction1() {
                    var open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = function(event) {
                        var db = event.target.result;
                        db.createObjectStore('My Store 1');
                        db.createObjectStore('My Store 2');
                        db.createObjectStore('My Store 3');
                    };

                    open.onsuccess = function() {
                        open.result.close();
                        setTimeout(transaction2, 50);
                    };
                }

                // Delete an object store
                function transaction2() {
                    var open = indexedDB.open(name, 2);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;

                        expect(Array.prototype.slice.call(db.objectStoreNames))
                            .to.have.same.members(['My Store 1', 'My Store 2', 'My Store 3']);

                        db.deleteObjectStore('My Store 2');

                        expect(Array.prototype.slice.call(db.objectStoreNames))
                            .to.have.same.members(['My Store 1', 'My Store 3']);
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should be able to re-create an object store that was deleted', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function() {
                    var db = open.result;
                    var tx = open.transaction;

                    db.createObjectStore('My Store', {keyPath: 'foo'});
                    var store1 = tx.objectStore('My Store');
                    expect(store1.keyPath).to.equal('foo');
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store1.autoIncrement).to.be.false;   // IE doesn't have this property
                    }

                    db.deleteObjectStore('My Store');
                    db.createObjectStore('My Store', {keyPath: 'bar', autoIncrement: true});
                    var store2 = tx.objectStore('My Store');
                    expect(store2).not.to.equal(store1);
                    expect(store2.keyPath).to.equal('bar');
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store1.autoIncrement).to.be.false;   // IE doesn't have this property
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should persist the schema across database sessions', function(done) {
            if (env.isNative && env.browser.isSafari) {
                // BUG: Safari's native IndexedDB does not support opening multiple object stores
                console.error('Skipping test: ' + this.test.title);
                return done();
            }

            // Create a database schema, then close the database
            util.createDatabase(
                'out-of-line', 'out-of-line-generated', 'inline', 'inline-generated',
                'inline-compound', 'dotted', 'dotted-generated', 'dotted-compound',
                function(err, db) {
                    db.close();
                    setTimeout(function() {
                        deleteObjectStores(db.name);
                    }, 50);
                }
            );

            // Re-open the database, delete some object stores, then close the database
            function deleteObjectStores(name) {
                var open = indexedDB.open(name, 2);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = function(event) {
                    var db = event.target.result;
                    db.deleteObjectStore('out-of-line');
                    db.deleteObjectStore('dotted-generated');
                };

                open.onsuccess = function() {
                    var db = open.result;
                    db.close();
                    setTimeout(function() {
                        verifyDatabaseSchema(db.name);
                    }, 50);
                };
            }

            // Re-open the database, and verify that the object stores are gone
            function verifyDatabaseSchema(name) {
                var open = indexedDB.open(name, 2);
                open.onerror = open.onblocked = done;

                open.onsuccess = function() {
                    var db = open.result;
                    var tx = db.transaction(db.objectStoreNames);
                    tx.onerror = tx.onabort = done;

                    // Verify that the correct object stores exist
                    var storeNames = Array.prototype.slice.call(db.objectStoreNames);
                    expect(storeNames).to.have.same.members([
                        'out-of-line-generated', 'inline', 'inline-generated',
                        'inline-compound', 'dotted', 'dotted-compound'
                    ]);

                    // Verify the properties of each object store
                    verifySchema(tx.objectStore('out-of-line-generated'), {name: 'out-of-line-generated', keyPath: null, autoIncrement: true, indexNames: []});
                    verifySchema(tx.objectStore('inline'), {name: 'inline', keyPath: 'id', autoIncrement: false, indexNames: []});
                    verifySchema(tx.objectStore('inline-generated'), {name: 'inline-generated', keyPath: 'id', autoIncrement: true, indexNames: []});
                    verifySchema(tx.objectStore('dotted'), {name: 'dotted', keyPath: 'name.first', autoIncrement: false, indexNames: []});

                    if (env.isShimmed || !env.browser.isIE) {
                        // IE doesn't support compound keys
                        verifySchema(tx.objectStore('inline-compound'), {name: 'inline-compound', keyPath: ['id','name'], autoIncrement: false, indexNames: []});
                        verifySchema(tx.objectStore('dotted-compound'), {name: 'dotted-compound', keyPath: ['id','name.first','name.last'], autoIncrement: false, indexNames: []});
                    }

                    tx.oncomplete = function() {
                        db.close();
                        done();
                    };
                };
            }

            function verifySchema(obj, schema) {
                for (var prop in schema) {
                    var objValue = obj[prop];
                    var schemaValue = schema[prop];

                    if (env.isNative && env.browser.isIE && prop === 'autoIncrement') {
                        // IE's native IndexedDB does not have the autoIncrement property
                        schemaValue = undefined;
                    }

                    if (schemaValue instanceof Array) {
                        objValue = Array.prototype.slice.call(objValue);
                    }

                    expect(objValue).to.deep.equal(schemaValue, obj.name + ' ' + prop);
                }
            }
        });
    });

    describe('failure tests', function() {
        it('should throw an error if the object store does not exist', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;

                    try {
                        db.deleteObjectStore('My Store');
                    }
                    catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(env.DOMException);
                    expect(err.name).to.equal('NotFoundError');
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should throw an error if called without params', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;

                    try {
                        db.deleteObjectStore();
                    }
                    catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(TypeError);
                    expect(err.name).to.equal('TypeError');
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });
    });
});

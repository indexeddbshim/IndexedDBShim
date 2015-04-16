describe('IDBObjectStore.deleteIndex', function() {
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
                    var store = db.createObjectStore('My Store');
                    store.createIndex('My Index', 'foo');
                    var result = store.deleteIndex('My Index');

                    expect(result).to.be.undefined;
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should delete an index that was created in the same transaction', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');
                    store.createIndex('My Index 1', 'foo');
                    store.createIndex('My Index 2', 'foo');

                    expect(Array.prototype.slice.call(store.indexNames))
                        .to.have.same.members(['My Index 1', 'My Index 2']);

                    store.deleteIndex('My Index 2');

                    expect(Array.prototype.slice.call(store.indexNames))
                        .to.have.same.members(['My Index 1']);
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should delete an index that was created in a previous transaction', function(done) {
            util.generateDatabaseName(function(err, name) {
                transaction1();

                // Create some indexes
                function transaction1() {
                    var open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = function(event) {
                        var db = event.target.result;
                        var store = db.createObjectStore('My Store');
                        store.createIndex('My Index 1', 'foo');
                        store.createIndex('My Index 2', 'foo');
                        store.createIndex('My Index 3', 'foo');
                    };

                    open.onsuccess = function() {
                        open.result.close();
                        setTimeout(transaction2, 50);
                    };
                }

                // Delete an index
                function transaction2() {
                    var open = indexedDB.open(name, 2);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        var store = open.transaction.objectStore('My Store');

                        expect(Array.prototype.slice.call(store.indexNames))
                            .to.have.same.members(['My Index 1', 'My Index 2', 'My Index 3']);

                        store.deleteIndex('My Index 2');

                        expect(Array.prototype.slice.call(store.indexNames))
                            .to.have.same.members(['My Index 1', 'My Index 3']);
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should be able to re-create an index that was deleted', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function() {
                    var db = open.result;
                    var store = db.createObjectStore('My Store');

                    store.createIndex('My Index', 'foo');
                    var index1 = store.index('My Index');
                    expect(index1.keyPath).to.equal('foo');
                    expect(index1.unique).to.be.false;
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index1.multiEntry).to.be.false;   // IE doesn't have this property
                    }

                    store.deleteIndex('My Index');
                    store.createIndex('My Index', 'bar', {unique: true, multiEntry: true});
                    var index2 = store.index('My Index');
                    expect(index2).not.to.equal(index1);
                    expect(index2.keyPath).to.equal('bar');
                    expect(index2.unique).to.be.true;
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index2.multiEntry).to.be.true;   // IE doesn't have this property
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
            // Create a database schema, then close the database
            util.createDatabase(
                'out-of-line', 'inline-index', 'unique-index', 'multi-entry-index',
                'unique-multi-entry-index', 'dotted-index', 'compound-index', 'compound-index-unique',
                function(err, db) {
                    db.close();
                    setTimeout(function() {
                        deleteObjectStores(db.name);
                    }, 50);
                }
            );

            // Re-open the database, delete some indexes, then close the database
            function deleteObjectStores(name) {
                var open = indexedDB.open(name, 2);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = function() {
                    var db = open.result;
                    var store = open.transaction.objectStore('out-of-line');
                    store.deleteIndex('inline-index');
                    store.deleteIndex('dotted-index');
                };

                open.onsuccess = function() {
                    var db = open.result;
                    db.close();
                    setTimeout(function() {
                        verifyDatabaseSchema(db.name);
                    }, 50);
                };
            }

            // Re-open the database, and verify that the indexes are gone
            function verifyDatabaseSchema(name) {
                var open = indexedDB.open(name, 2);
                open.onerror = open.onblocked = done;

                open.onsuccess = function() {
                    var db = open.result;
                    var tx = db.transaction('out-of-line');
                    var store = tx.objectStore('out-of-line');
                    tx.onerror = tx.onabort = done;

                    // Verify that the correct indexes exist
                    var indexNames = Array.prototype.slice.call(store.indexNames);
                    expect(indexNames).to.have.same.members([
                        'unique-index', 'multi-entry-index', 'unique-multi-entry-index',
                        'compound-index', 'compound-index-unique'
                    ]);

                    // Verify the properties of each index
                    verifySchema(store.index('unique-index'), {name: 'unique-index', objectStore: store, keyPath: 'id', multiEntry: false, unique: true});
                    verifySchema(store.index('multi-entry-index'), {name: 'multi-entry-index', objectStore: store, keyPath: 'id', multiEntry: true, unique: false});
                    verifySchema(store.index('unique-multi-entry-index'), {name: 'unique-multi-entry-index', objectStore: store, keyPath: 'id', multiEntry: true, unique: true});

                    if (env.isShimmed || !env.browser.isIE) {
                        // IE doesn't support compound indexes
                        verifySchema(store.index('compound-index'), {name: 'compound-index', objectStore: store, keyPath: ['id', 'name.first', 'name.last'], multiEntry: false, unique: false});
                        verifySchema(store.index('compound-index-unique'), {name: 'compound-index-unique', objectStore: store, keyPath: ['id', 'name.first', 'name.last'], multiEntry: false, unique: true});
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

                    if (env.isNative && env.browser.isIE && prop === 'multiEntry') {
                        // IE's native IndexedDB does not have the multiEntry property
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
        it('should throw an error if the index does not exist', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');

                    try {
                        store.deleteIndex('My Index');
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
                    var store = db.createObjectStore('My Store');

                    try {
                        store.deleteIndex();
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

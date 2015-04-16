describe('IDBObjectStore.createIndex', function() {
    'use strict';

    var indexedDB;
    beforeEach(function() {
        indexedDB = env.indexedDB;
    });

    describe('success tests', function() {
        it('should create an index with default properties', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');
                    var index = store.createIndex('My Index', 'foo.bar.baz');

                    expect(index).to.be.an.instanceOf(IDBIndex);
                    expect(index.objectStore).to.be.an.instanceOf(IDBObjectStore).and.equal(store);
                    expect(index.name).to.equal('My Index');
                    expect(index.keyPath).to.equal('foo.bar.baz');
                    expect(index.unique).to.be.false;
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index.multiEntry).to.be.false;    // IE doesn't have this property
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create a unique index', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');
                    var index = store.createIndex('My Index', 'foo.bar.baz', {unique: true});

                    expect(index).to.be.an.instanceOf(IDBIndex);
                    expect(index.objectStore).to.be.an.instanceOf(IDBObjectStore).and.equal(store);
                    expect(index.name).to.equal('My Index');
                    expect(index.keyPath).to.equal('foo.bar.baz');
                    expect(index.unique).to.be.true;
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index.multiEntry).to.be.false;    // IE doesn't have this property
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create a multi-entry index', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');
                    var index = store.createIndex('My Index', 'foo.bar.baz', {multiEntry: true});

                    expect(index).to.be.an.instanceOf(IDBIndex);
                    expect(index.objectStore).to.be.an.instanceOf(IDBObjectStore).and.equal(store);
                    expect(index.name).to.equal('My Index');
                    expect(index.keyPath).to.equal('foo.bar.baz');
                    expect(index.unique).to.be.false;
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index.multiEntry).to.be.true;    // IE doesn't have this property
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create a unique, multi-entry index', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');
                    var index = store.createIndex('My Index', 'foo.bar.baz', {unique: true, multiEntry: true});

                    expect(index).to.be.an.instanceOf(IDBIndex);
                    expect(index.objectStore).to.be.an.instanceOf(IDBObjectStore).and.equal(store);
                    expect(index.name).to.equal('My Index');
                    expect(index.keyPath).to.equal('foo.bar.baz');
                    expect(index.unique).to.be.true;
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index.multiEntry).to.be.true;    // IE doesn't have this property
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create new indexes in an existing database', function(done) {
            util.generateDatabaseName(function(err, name) {
                createVersion1();

                function createVersion1() {
                    var open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        var store = db.createObjectStore('My Store');
                        store.createIndex('My Index 1', 'foo');
                        store.createIndex('My Index 2', 'foo');

                        expect(Array.prototype.slice.call(store.indexNames))
                            .to.have.same.members(['My Index 1', 'My Index 2']);
                    });

                    open.onsuccess = function() {
                        open.result.close();
                        setTimeout(createVersion2, 50);
                    };
                }

                function createVersion2() {
                    var open = indexedDB.open(name, 2);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var store = open.transaction.objectStore('My Store');

                        expect(Array.prototype.slice.call(store.indexNames))
                            .to.have.same.members(['My Index 1', 'My Index 2']);

                        store.createIndex('My Index 3', 'bar');
                        store.createIndex('My Index 4', 'bar');

                        if (env.isShimmed || !env.browser.isSafari) {
                            // Safari's native IndexedDB doesn't update the "indexNames" property correctly
                            expect(Array.prototype.slice.call(store.indexNames))
                                .to.have.same.members(['My Index 1', 'My Index 2', 'My Index 3', 'My Index 4']);
                        }
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should persist the schema across database sessions', function(done) {
            // Create a database schema, then close the database
            util.createDatabase(
                'out-of-line', 'inline-index', 'unique-index', 'multi-entry-index',
                'unique-multi-entry-index', 'dotted-index', 'compound-index', 'compound-index-unique',
                function(err, db) {
                    if (err) return done(err);
                    db.close();
                    setTimeout(function() {
                        verifyDatabaseSchema(db.name);
                    }, 50);
                }
            );

            // Re-open the database, and verify that the schema is the same
            function verifyDatabaseSchema(name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onsuccess = function() {
                    var db = open.result;
                    var tx = db.transaction('out-of-line');
                    var store = tx.objectStore('out-of-line');
                    tx.onerror = tx.onabort = function(event) {
                        done(event.target.error);
                    };

                    // Verify that all of the indexes exist
                    var indexes = Array.prototype.slice.call(store.indexNames);
                    expect(indexes).to.have.same.members([
                        'inline-index', 'unique-index', 'multi-entry-index', 'unique-multi-entry-index',
                        'dotted-index', 'compound-index', 'compound-index-unique'
                    ]);

                    // Verify the properties of each index
                    verifySchema(store.index('inline-index'), {name: 'inline-index', objectStore: store, keyPath: 'id', multiEntry: false, unique: false});
                    verifySchema(store.index('unique-index'), {name: 'unique-index', objectStore: store, keyPath: 'id', multiEntry: false, unique: true});
                    verifySchema(store.index('multi-entry-index'), {name: 'multi-entry-index', objectStore: store, keyPath: 'id', multiEntry: true, unique: false});
                    verifySchema(store.index('unique-multi-entry-index'), {name: 'unique-multi-entry-index', objectStore: store, keyPath: 'id', multiEntry: true, unique: true});
                    verifySchema(store.index('dotted-index'), {name: 'dotted-index', objectStore: store, keyPath: 'name.first', multiEntry: false, unique: false});

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
        it('should throw an error if called without params', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');

                    try {
                        store.createIndex();
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

        it('should throw an error if called without a keyPath', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');

                    try {
                        store.createIndex('My Index');
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

        it('should throw an error if the index was already created in the same transaction', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');
                    store.createIndex('My Index', 'foo');

                    try {
                        store.createIndex('My Index', 'bar');
                    }
                    catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(env.DOMException);
                    expect(err.name).to.equal('ConstraintError');
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should throw an error if the index was already created in a previous transaction', function(done) {
            util.generateDatabaseName(function(err, name) {
                createVersion1();

                function createVersion1() {
                    var open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        var store = db.createObjectStore('My Store');
                        store.createIndex('My Index', 'foo');
                    });

                    open.onsuccess = function() {
                        open.result.close();
                        setTimeout(createVersion2, 50);
                    };
                }

                function createVersion2() {
                    var open = indexedDB.open(name, 2);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var store = open.transaction.objectStore('My Store');

                        try {
                            store.createIndex('My Index', 'bar');
                        }
                        catch (e) {
                            err = e;
                        }

                        expect(err).to.be.an.instanceOf(env.DOMException);
                        expect(err.name).to.equal('ConstraintError');
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });
    });
});

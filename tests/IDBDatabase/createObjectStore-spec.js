describe('IDBDatabase.createObjectStore', function() {
    'use strict';

    var indexedDB;
    beforeEach(function() {
        indexedDB = env.indexedDB;
    });

    describe('success tests', function() {
        it('should create an object store with an out-of-line key', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store');

                    expect(store).to.be.an.instanceOf(IDBObjectStore);
                    expect(store.transaction).to.be.an.instanceOf(IDBTransaction).and.equal(open.transaction);
                    expect(store.name).to.equal('My Store');
                    expect(store.keyPath).to.be.null;
                    expect(store.indexNames).to.have.lengthOf(0);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store.autoIncrement).to.be.false;    // IE doesn't have this property
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create an object store with a generated out-of-line key', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store', {autoIncrement: true});

                    expect(store).to.be.an.instanceOf(IDBObjectStore);
                    expect(store.transaction).to.be.an.instanceOf(IDBTransaction).and.equal(open.transaction);
                    expect(store.name).to.equal('My Store');
                    expect(store.keyPath).to.be.null;
                    expect(store.indexNames).to.have.lengthOf(0);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store.autoIncrement).to.be.true;    // IE doesn't have this property
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create an object store with an inline key', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store', {keyPath: 'foo.bar.baz'});

                    expect(store).to.be.an.instanceOf(IDBObjectStore);
                    expect(store.transaction).to.be.an.instanceOf(IDBTransaction).and.equal(open.transaction);
                    expect(store.name).to.equal('My Store');
                    expect(store.keyPath).to.equal('foo.bar.baz');
                    expect(store.indexNames).to.have.lengthOf(0);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store.autoIncrement).to.be.false;    // IE doesn't have this property
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create an object store with a generated inline key', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    var store = db.createObjectStore('My Store', {keyPath: 'foo.bar.baz', autoIncrement: true});

                    expect(store).to.be.an.instanceOf(IDBObjectStore);
                    expect(store.transaction).to.be.an.instanceOf(IDBTransaction).and.equal(open.transaction);
                    expect(store.name).to.equal('My Store');
                    expect(store.keyPath).to.equal('foo.bar.baz');
                    expect(store.indexNames).to.have.lengthOf(0);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store.autoIncrement).to.be.true;    // IE doesn't have this property
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create new tables in an existing database', function(done) {
            if (env.isNative && env.browser.isSafari) {
                // BUG: Safari's native IndexedDB aborts the 2nd transaction (without any error)
                console.error('Skipping test: ' + this.test.title);
                return done();
            }

            util.generateDatabaseName(function(err, name) {
                createVersion1();

                function createVersion1() {
                    var open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        db.createObjectStore('My Store 1');
                        db.createObjectStore('My Store 2', {keyPath: 'foo', autoIncrement: false});

                        expect(Array.prototype.slice.call(db.objectStoreNames))
                            .to.have.same.members(['My Store 1', 'My Store 2']);
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
                        var db = event.target.result;

                        expect(Array.prototype.slice.call(db.objectStoreNames))
                            .to.have.same.members(['My Store 1', 'My Store 2']);

                        db.createObjectStore('My Store 3');
                        db.createObjectStore('My Store 4');

                        expect(Array.prototype.slice.call(db.objectStoreNames))
                            .to.have.same.members(['My Store 1', 'My Store 2', 'My Store 3', 'My Store 4']);
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
            if (env.isNative && env.browser.isSafari) {
                // BUG: Safari's native IndexedDB does not support opening multiple object stores
                console.error('Skipping test: ' + this.test.title);
                return done();
            }
            if (env.browser.isIE && env.browser.isMobile) {
                // BUG: The WebSql plug-in is synchronous, so a stack overflow happens whenever a transaction contains many operations
                return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
            }

            // Create a database schema, then close the database
            util.createDatabase(
                'out-of-line', 'out-of-line-generated', 'inline', 'inline-generated', 'inline-compound',
                'dotted', 'dotted-generated', 'dotted-compound', 'inline-index', 'unique-index', 'multi-entry-index',
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
                    var tx = db.transaction(db.objectStoreNames);
                    tx.onerror = tx.onabort = function(event) {
                        done(event.target.error);
                    };

                    // Verify that all of the object stores exist
                    var storeNames = Array.prototype.slice.call(db.objectStoreNames);
                    expect(storeNames).to.have.same.members([
                        'out-of-line', 'out-of-line-generated', 'inline', 'inline-generated',
                        'inline-compound', 'dotted', 'dotted-generated', 'dotted-compound'
                    ]);

                    // Verify the properties of each object store
                    verifySchema(tx.objectStore('out-of-line'), {name: 'out-of-line', keyPath: null, autoIncrement: false});
                    verifySchema(tx.objectStore('out-of-line-generated'), {name: 'out-of-line-generated', keyPath: null, autoIncrement: true});
                    verifySchema(tx.objectStore('inline'), {name: 'inline', keyPath: 'id', autoIncrement: false});
                    verifySchema(tx.objectStore('inline-generated'), {name: 'inline-generated', keyPath: 'id', autoIncrement: true});
                    verifySchema(tx.objectStore('dotted'), {name: 'dotted', keyPath: 'name.first', autoIncrement: false});
                    verifySchema(tx.objectStore('dotted-generated'), {name: 'dotted-generated', keyPath: 'name.first', autoIncrement: true});

                    if (env.isShimmed || !env.browser.isIE) {
                        // IE doesn't support compound keys
                        verifySchema(tx.objectStore('inline-compound'), {name: 'inline-compound', keyPath: ['id','name'], autoIncrement: false});
                        verifySchema(tx.objectStore('dotted-compound'), {name: 'dotted-compound', keyPath: ['id','name.first','name.last'], autoIncrement: false});
                    }

                    storeNames.forEach(function(storeName) {
                        var store = tx.objectStore(storeName);

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

                    });

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

                    if (env.isNative && env.browser.isIE &&
                        (prop === 'autoIncrement' || prop === 'multiEntry')) {
                        // IE does not have these properties
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

                    try {
                        db.createObjectStore();
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

        it('should throw an error if the store was already created in the same transaction', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    db.createObjectStore('My Store');

                    try {
                        db.createObjectStore('My Store');
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

        it('should throw an error if the store was already created in a previous transaction', function(done) {
            util.generateDatabaseName(function(err, name) {
                createVersion1();

                function createVersion1() {
                    var open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        db.createObjectStore('My Store');
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
                        var db = event.target.result;

                        try {
                            db.createObjectStore('My Store');
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

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
                    if (!env.browser.isIE) {
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
                    if (!env.browser.isIE) {
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
                    if (!env.browser.isIE) {
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
                    if (!env.browser.isIE) {
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
            if (env.browser.isSafari) {
                // BUG: For some reason, Safari aborts the 2nd transaction (without any error)
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

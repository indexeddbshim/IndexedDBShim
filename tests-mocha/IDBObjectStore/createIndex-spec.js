/* eslint-env mocha */
/* globals expect, sinon, util, env */
/* eslint-disable no-unused-expressions */
describe('IDBObjectStore.createIndex', function () {
    'use strict';

    let indexedDB;
    beforeEach(function () {
        indexedDB = env.indexedDB;
    });

    describe('success tests', function () {
        it('should create an index with default properties', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');
                    const index = store.createIndex('My Index', 'foo.bar.baz');

                    expect(index).to.be.an.instanceOf(IDBIndex);
                    expect(index.objectStore).to.be.an.instanceOf(IDBObjectStore).and.equal(store);
                    expect(index.name).to.equal('My Index');
                    expect(index.keyPath).to.equal('foo.bar.baz');
                    expect(index.unique).equal(false);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index.multiEntry).equal(false); // IE doesn't have this property
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create a unique index', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');
                    const index = store.createIndex('My Index', 'foo.bar.baz', {unique: true});

                    expect(index).to.be.an.instanceOf(IDBIndex);
                    expect(index.objectStore).to.be.an.instanceOf(IDBObjectStore).and.equal(store);
                    expect(index.name).to.equal('My Index');
                    expect(index.keyPath).to.equal('foo.bar.baz');
                    expect(index.unique).equal(true);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index.multiEntry).equal(false); // IE doesn't have this property
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create a multi-entry index', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');
                    const index = store.createIndex('My Index', 'foo.bar.baz', {multiEntry: true});

                    expect(index).to.be.an.instanceOf(IDBIndex);
                    expect(index.objectStore).to.be.an.instanceOf(IDBObjectStore).and.equal(store);
                    expect(index.name).to.equal('My Index');
                    expect(index.keyPath).to.equal('foo.bar.baz');
                    expect(index.unique).equal(false);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index.multiEntry).equal(true); // IE doesn't have this property
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create a unique, multi-entry index', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');
                    const index = store.createIndex('My Index', 'foo.bar.baz', {unique: true, multiEntry: true});

                    expect(index).to.be.an.instanceOf(IDBIndex);
                    expect(index.objectStore).to.be.an.instanceOf(IDBObjectStore).and.equal(store);
                    expect(index.name).to.equal('My Index');
                    expect(index.keyPath).to.equal('foo.bar.baz');
                    expect(index.unique).equal(true);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index.multiEntry).equal(true); // IE doesn't have this property
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create new indexes in an existing database', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                createVersion1();

                /**
                 * @returns {void}
                 */
                function createVersion1 () {
                    const open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function (event) {
                        const db = event.target.result;
                        const store = db.createObjectStore('My Store');
                        store.createIndex('My Index 1', 'foo');
                        store.createIndex('My Index 2', 'foo');

                        expect(Array.prototype.slice.call(store.indexNames))
                            .to.have.same.members(['My Index 1', 'My Index 2']);
                    });

                    open.onsuccess = function () {
                        open.result.close();
                        setTimeout(createVersion2, 50);
                    };
                }

                /**
                 * @returns {void}
                 */
                function createVersion2 () {
                    const open = indexedDB.open(name, 2);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function () {
                        const store = open.transaction.objectStore('My Store');

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

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should persist the schema across database sessions', function (done) {
            // Create a database schema, then close the database
            util.createDatabase(
                'out-of-line', 'inline-index', 'unique-index', 'multi-entry-index',
                'unique-multi-entry-index', 'dotted-index', 'compound-index', 'compound-index-unique',
                function (err, db) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.close();
                    setTimeout(function () {
                        verifyDatabaseSchema(db.name);
                    }, 50);
                }
            );

            /**
             * Re-open the database, and verify that the schema is the same.
             * @param {string} name
             * @returns {void}
             */
            function verifyDatabaseSchema (name) {
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onsuccess = function () {
                    const db = open.result;
                    const tx = db.transaction('out-of-line');
                    const store = tx.objectStore('out-of-line');
                    tx.onerror = tx.onabort = function (event) {
                        done(event.target.error);
                    };

                    // Verify that all of the indexes exist
                    const indexes = Array.prototype.slice.call(store.indexNames);
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

                    tx.oncomplete = function () {
                        db.close();
                        done();
                    };
                };
            }

            /**
             * @param {IDBIndex} obj
             * @param {{
             *   name: string,
             *   objectStore: IDBObjectStore,
             *   keyPath: string|string[],
             *   multiEntry: boolean,
             *   unique: boolean
             * }} schema
             * @returns {void}
             */
            function verifySchema (obj, schema) {
                Object.entries(schema).forEach(([prop, schemaValue]) => {
                    let objValue = obj[prop];

                    if (!env.isShimmed && env.browser.isIE && prop === 'multiEntry') {
                        // IE's native IndexedDB does not have the multiEntry property
                        schemaValue = undefined;
                    }

                    if (Array.isArray(schemaValue)) {
                        objValue = Array.prototype.slice.call(objValue);
                    }

                    expect(objValue).to.deep.equal(schemaValue, obj.name + ' ' + prop);
                });
            }
        });
    });

    describe('failure tests', function () {
        it('should throw an error if called without params', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');

                    try {
                        store.createIndex();
                    } catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(TypeError);
                    expect(err.name).to.equal('TypeError');
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should throw an error if called without a keyPath', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');

                    try {
                        store.createIndex('My Index');
                    } catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(TypeError);
                    expect(err.name).to.equal('TypeError');
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should throw an error if called with an array keyPath with multiEntry true', function (done) {
            // BUG: IE's native IndexedDB does not support multi-entry indexes
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');

                    try {
                        store.createIndex('My Index', ['id', 'Name'], {multiEntry: true});
                    } catch (e) {
                        err = e;
                    }

                    if (env.isShimmed || !env.browser.isIE) {
                        expect(err).to.be.an.instanceOf(env.DOMException); // The IE polyfill throws a normal Error
                    }
                    expect(err).to.be.ok;
                    expect(err.name).to.equal('InvalidAccessError');
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should throw an error if the index was already created in the same transaction', function (done) {
            util.generateDatabaseName(function (err, name) {
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');
                    store.createIndex('My Index', 'foo');

                    try {
                        store.createIndex('My Index', 'bar');
                    } catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(env.DOMException);
                    expect(err.name).to.equal('ConstraintError');
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should throw an error if the index was already created in a previous transaction', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                createVersion1();

                /**
                 * @returns {void}
                 */
                function createVersion1 () {
                    const open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function (event) {
                        const db = event.target.result;
                        const store = db.createObjectStore('My Store');
                        store.createIndex('My Index', 'foo');
                    });

                    open.onsuccess = function () {
                        open.result.close();
                        setTimeout(createVersion2, 50);
                    };
                }

                /**
                 * @returns {void}
                 */
                function createVersion2 () {
                    const open = indexedDB.open(name, 2);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function () {
                        const store = open.transaction.objectStore('My Store');

                        try {
                            store.createIndex('My Index', 'bar');
                        } catch (e) {
                            err = e;
                        }

                        expect(err).to.be.an.instanceOf(env.DOMException);
                        expect(err.name).to.equal('ConstraintError');
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should allow `key`, `value`, or `inc` for index names (column names used internally)', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;
                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('test');
                    store.createIndex('value', 'id');
                    expect(store.indexNames.contains('value')).equal(true);
                    store.createIndex('key', 'id');
                    expect(store.indexNames.contains('key')).equal(true);
                    store.createIndex('inc', 'id');
                    expect(store.indexNames.contains('inc')).equal(true);
                });
                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });
    });
});

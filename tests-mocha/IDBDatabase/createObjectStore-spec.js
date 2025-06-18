/* eslint-env mocha */
/* globals expect, sinon, util, env */
describe('IDBDatabase.createObjectStore', function () {
    'use strict';

    let indexedDB;
    beforeEach(function () {
        indexedDB = env.indexedDB;
    });

    describe('success tests', function () {
        it('should create an object store with an out-of-line key', function (done) {
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

                    expect(store).to.be.an.instanceOf(IDBObjectStore);
                    expect(store.transaction).to.be.an.instanceOf(IDBTransaction).and.equal(open.transaction);
                    expect(store.name).to.equal('My Store');
                    expect(store.keyPath).equal(null);
                    expect(store.indexNames).to.have.lengthOf(0);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store.autoIncrement).equal(false); // IE doesn't have this property
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create an object store with a generated out-of-line key', function (done) {
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
                    const store = db.createObjectStore('My Store', {autoIncrement: true});

                    expect(store).to.be.an.instanceOf(IDBObjectStore);
                    expect(store.transaction).to.be.an.instanceOf(IDBTransaction).and.equal(open.transaction);
                    expect(store.name).to.equal('My Store');
                    expect(store.keyPath).equal(null);
                    expect(store.indexNames).to.have.lengthOf(0);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store.autoIncrement).equal(true); // IE doesn't have this property
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create an object store with an inline key', function (done) {
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
                    const store = db.createObjectStore('My Store', {keyPath: 'foo.bar.baz'});

                    expect(store).to.be.an.instanceOf(IDBObjectStore);
                    expect(store.transaction).to.be.an.instanceOf(IDBTransaction).and.equal(open.transaction);
                    expect(store.name).to.equal('My Store');
                    expect(store.keyPath).to.equal('foo.bar.baz');
                    expect(store.indexNames).to.have.lengthOf(0);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store.autoIncrement).equal(false); // IE doesn't have this property
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should create an object store with a generated inline key', function (done) {
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
                    const store = db.createObjectStore('My Store', {keyPath: 'foo.bar.baz', autoIncrement: true});

                    expect(store).to.be.an.instanceOf(IDBObjectStore);
                    expect(store.transaction).to.be.an.instanceOf(IDBTransaction).and.equal(open.transaction);
                    expect(store.name).to.equal('My Store');
                    expect(store.keyPath).to.equal('foo.bar.baz');
                    expect(store.indexNames).to.have.lengthOf(0);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(store.autoIncrement).equal(true); // IE doesn't have this property
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        util.skipIf(env.isNative && env.browser.isSafari, 'should create new tables in an existing database', function (done) {
            // BUG: Safari's native IndexedDB aborts the 2nd transaction (without any error)
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
                        db.createObjectStore('My Store 1');
                        db.createObjectStore('My Store 2', {keyPath: 'foo', autoIncrement: false});
                        expect(
                            db.objectStoreNames,
                            'Count of Object Stores created is correct'
                        ).to.have.a.lengthOf(2);

                        expect(Array.prototype.slice.call(db.objectStoreNames))
                            .to.have.same.members(['My Store 1', 'My Store 2']);
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

                    open.onupgradeneeded = sinon.spy(function (event) {
                        const db = event.target.result;

                        expect(Array.prototype.slice.call(db.objectStoreNames))
                            .to.have.same.members(['My Store 1', 'My Store 2']);

                        db.createObjectStore('My Store 3');
                        db.createObjectStore('My Store 4');

                        expect(Array.prototype.slice.call(db.objectStoreNames))
                            .to.have.same.members(['My Store 1', 'My Store 2', 'My Store 3', 'My Store 4']);
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        util.skipIf(env.isNative && env.browser.isSafari, 'should persist the schema across database sessions', function (done) {
            this.timeout(5000);
            // BUG: Safari's native IndexedDB does not support opening multiple object stores

            // Create a database schema, then close the database
            util.createDatabase(
                'out-of-line', 'out-of-line-generated', 'inline', 'inline-generated', 'inline-compound',
                'dotted', 'dotted-generated', 'dotted-compound', 'inline-index', 'unique-index',
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
                    const tx = db.transaction(db.objectStoreNames);
                    tx.onerror = tx.onabort = function (event) {
                        done(event.target.error);
                    };

                    // Verify that all of the object stores exist
                    const storeNames = Array.prototype.slice.call(db.objectStoreNames);
                    const indexNames = ['inline-index', 'unique-index'];
                    expect(storeNames).to.have.same.members([
                        'out-of-line', 'out-of-line-generated', 'inline', 'inline-generated',
                        'inline-compound', 'dotted', 'dotted-generated', 'dotted-compound'
                    ]);

                    // Verify the properties of each object store
                    verifySchema(tx.objectStore('out-of-line'), {name: 'out-of-line', keyPath: null, autoIncrement: false, indexNames: indexNames});
                    verifySchema(tx.objectStore('out-of-line-generated'), {name: 'out-of-line-generated', keyPath: null, autoIncrement: true, indexNames: indexNames});
                    verifySchema(tx.objectStore('inline'), {name: 'inline', keyPath: 'id', autoIncrement: false, indexNames: indexNames});
                    verifySchema(tx.objectStore('inline-generated'), {name: 'inline-generated', keyPath: 'id', autoIncrement: true, indexNames: indexNames});
                    verifySchema(tx.objectStore('dotted'), {name: 'dotted', keyPath: 'name.first', autoIncrement: false, indexNames: indexNames});
                    verifySchema(tx.objectStore('dotted-generated'), {name: 'dotted-generated', keyPath: 'name.first', autoIncrement: true, indexNames: indexNames});

                    if (env.isShimmed || !env.browser.isIE) {
                        // IE doesn't support compound keys
                        verifySchema(tx.objectStore('inline-compound'), {name: 'inline-compound', keyPath: ['id', 'name'], autoIncrement: false, indexNames: indexNames});
                        verifySchema(tx.objectStore('dotted-compound'), {name: 'dotted-compound', keyPath: ['id', 'name.first', 'name.last'], autoIncrement: false, indexNames: indexNames});
                    }

                    tx.oncomplete = function () {
                        db.close();
                        done();
                    };
                };
            }

            /**
             * @param {IDBObjectStore} obj
             * @param {{
             *   name: string,
             *   keyPath: null|string|string[],
             *   autoIncrement: boolean,
             *   indexNames: string[]
             * }} schema
             * @returns {void}
             */
            function verifySchema (obj, schema) {
                Object.entries(schema).forEach(([prop, schemaValue]) => {
                    let objValue = obj[prop];

                    if (!env.isShimmed && env.browser.isIE && prop === 'autoIncrement') {
                        // IE's native IndexedDB does not have the autoIncrement property
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
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;

                    try {
                        db.createObjectStore();
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

        it('should throw an error if the store was already created in the same transaction', function (done) {
            util.generateDatabaseName(function (err, name) {
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    db.createObjectStore('My Store');

                    try {
                        db.createObjectStore('My Store');
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

        it('should throw an error if the store was already created in a previous transaction', function (done) {
            util.generateDatabaseName(function (err, name) {
                createVersion1();

                /**
                 * @returns {void}
                 */
                function createVersion1 () {
                    const open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function (event) {
                        const db = event.target.result;
                        db.createObjectStore('My Store');
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

                    open.onupgradeneeded = sinon.spy(function (event) {
                        const db = event.target.result;

                        try {
                            db.createObjectStore('My Store');
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
    });
});

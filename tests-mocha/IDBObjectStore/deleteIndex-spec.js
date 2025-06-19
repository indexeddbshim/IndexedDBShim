describe('IDBObjectStore.deleteIndex', function () {
    'use strict';

    let indexedDB;
    beforeEach(function () {
        ({indexedDB} = env);
    });

    it('deletes indexes', function (done) {
        const {testData: {DB}} = window;
        testHelper.createObjectStores(undefined, (error, [, db]) => {
            if (error) {
                done(error);
                return;
            }
            db.close();
            const dbOpenRequest = indexedDB.open(DB.NAME);
            dbOpenRequest.onsuccess = function () {
                expect(true, 'Database Opened successfully').to.be.true;
                dbOpenRequest.result.close();
                done();
            };
            dbOpenRequest.onerror = function (e) {
                console.log('e', e);
                done(new Error('Database NOT Opened successfully'));
            };
            dbOpenRequest.onupgradeneeded = function () {
                expect(true, 'Database Upgraded successfully').to.be.true;
                // const db = dbOpenRequest.result;
                const objectStore1 = dbOpenRequest.transaction.objectStore(DB.OBJECT_STORE_1);
                const count = objectStore1.indexNames.length;

                const index3 = objectStore1.createIndex('DeleteTestIndex', 'String'); // eslint-disable-line no-unused-vars -- Clear
                expect(objectStore1.indexNames, 'Index on object store successfully created').to.have.lengthOf(count + 1);
                objectStore1.deleteIndex('DeleteTestIndex');
                expect(objectStore1.indexNames, 'Index on object store successfully deleted').to.have.lengthOf(count);
                objectStore1.createIndex('DeleteTestIndex', 'Int');
                expect(objectStore1.indexNames, 'Index with previously deleted name successfully created').to.have.lengthOf(count + 1);
                objectStore1.deleteIndex('DeleteTestIndex');
                expect(objectStore1.indexNames, 'Index with previously deleted name successfully deleted').to.have.lengthOf(count);
            };
            dbOpenRequest.onblocked = function () {
                done(new Error('Opening database blocked'));
            };
        });
    });

    describe('success tests', function () {
        it('should return undefined', function (done) {
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
                    store.createIndex('My Index', 'foo');
                    const result = store.deleteIndex('My Index');

                    expect(result).equal(undefined);
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should delete an index that was created in the same transaction', function (done) {
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
                    store.createIndex('My Index 1', 'foo');
                    store.createIndex('My Index 2', 'foo');

                    expect(Array.prototype.slice.call(store.indexNames))
                        .to.have.same.members(['My Index 1', 'My Index 2']);

                    store.deleteIndex('My Index 2');

                    expect(Array.prototype.slice.call(store.indexNames))
                        .to.have.same.members(['My Index 1']);
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should delete an index that was created in a previous transaction', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                transaction1();

                /**
                 * Create some indexes.
                 * @returns {void}
                 */
                function transaction1 () {
                    const open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = function (event) {
                        const db = event.target.result;
                        const store = db.createObjectStore('My Store');
                        store.createIndex('My Index 1', 'foo');
                        store.createIndex('My Index 2', 'foo');
                        store.createIndex('My Index 3', 'foo');
                    };

                    open.onsuccess = function () {
                        open.result.close();
                        setTimeout(transaction2, 50);
                    };
                }

                /**
                 * Delete an index.
                 * @returns {void}
                 */
                function transaction2 () {
                    const open = indexedDB.open(name, 2);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function () {
                        // const db = event.target.result;
                        const store = open.transaction.objectStore('My Store');

                        expect(Array.prototype.slice.call(store.indexNames))
                            .to.have.same.members(['My Index 1', 'My Index 2', 'My Index 3']);

                        store.deleteIndex('My Index 2');

                        expect(Array.prototype.slice.call(store.indexNames))
                            .to.have.same.members(['My Index 1', 'My Index 3']);
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should be able to re-create an index that was deleted', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function () {
                    const db = open.result;
                    const store = db.createObjectStore('My Store');

                    store.createIndex('My Index', 'foo');
                    const index1 = store.index('My Index');
                    expect(index1.keyPath).to.equal('foo');
                    expect(index1.unique).equal(false);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index1.multiEntry).equal(false); // IE doesn't have this property
                    }

                    store.deleteIndex('My Index');
                    store.createIndex('My Index', 'bar', {unique: true, multiEntry: true});
                    const index2 = store.index('My Index');
                    expect(index2).not.to.equal(index1);
                    expect(index2.keyPath).to.equal('bar');
                    expect(index2.unique).equal(true);
                    if (env.isShimmed || !env.browser.isIE) {
                        expect(index2.multiEntry).equal(true); // IE doesn't have this property
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should persist the schema across database sessions', function (done) {
            this.timeout(10000);
            // Create a database schema, then close the database
            util.createDatabase(
                'out-of-line', 'inline-index', 'unique-index', 'multi-entry-index',
                'unique-multi-entry-index', 'dotted-index', 'compound-index', 'compound-index-unique',
                function (err, db) {
                    if (err) {
                        expect(function () { throw err; }).to.not.throw(Error);
                        done();
                        return;
                    }
                    db.close();
                    setTimeout(function () {
                        deleteObjectStores(db.name);
                    }, 50);
                }
            );

            /**
             * Re-open the database, delete some indexes, then close the database.
             * @param {string} name
             * @returns {void}
             */
            function deleteObjectStores (name) {
                const open = indexedDB.open(name, 2);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = function () {
                    // const db = open.result;
                    const store = open.transaction.objectStore('out-of-line');
                    store.deleteIndex('inline-index');
                    store.deleteIndex('dotted-index');
                };

                open.onsuccess = function () {
                    const db = open.result;
                    db.close();
                    setTimeout(function () {
                        verifyDatabaseSchema(db.name);
                    }, 50);
                };
            }

            /**
             * Re-open the database, and verify that the indexes are gone.
             * @param {string} name
             * @returns {void}
             */
            function verifyDatabaseSchema (name) {
                const open = indexedDB.open(name, 2);
                open.onerror = open.onblocked = done;

                open.onsuccess = function () {
                    const db = open.result;
                    const tx = db.transaction('out-of-line');
                    const store = tx.objectStore('out-of-line');
                    tx.onerror = tx.onabort = done;

                    // Verify that the correct indexes exist
                    const indexNames = Array.prototype.slice.call(store.indexNames);
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
        it('should throw an error if the index does not exist', function (done) {
            util.generateDatabaseName(function (err, name) {
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');

                    try {
                        store.deleteIndex('My Index');
                    } catch (e) {
                        err = e;
                    }

                    expect(err).to.be.an.instanceOf(env.DOMException);
                    expect(err.name).to.equal('NotFoundError');
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should throw an error if called without params', function (done) {
            util.generateDatabaseName(function (err, name) {
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    const store = db.createObjectStore('My Store');

                    try {
                        store.deleteIndex();
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
    });
});

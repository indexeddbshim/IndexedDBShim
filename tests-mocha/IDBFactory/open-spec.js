/* eslint-env mocha */
/* globals expect, sinon, util, env */
describe('IDBFactory.open', function () {
    'use strict';

    let indexedDB;
    beforeEach(function () {
        indexedDB = env.indexedDB;
    });

    describe('success tests', function () {
        it('should return an IDBOpenDBRequest', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                expect(open).to.be.an.instanceOf(IDBOpenDBRequest);

                open.onsuccess = function () {
                    open.result.close();
                    done();
                };
            });
        });

        it('should have a reference to the upgrade transaction', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                let tx;
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                // The transaction property is null initially
                expect(open.transaction).equal(null);

                open.onupgradeneeded = function () {
                    // The transaction property is an IDBTransaction during the onupgradeneeded event
                    expect(open.transaction).to.be.an.instanceOf(IDBTransaction);
                    tx = open.transaction;
                };

                open.onsuccess = function () {
                    // The transaction property is null again in the onsuccess event
                    expect(open.transaction).equal(null);
                    expect(tx).to.be.an.instanceOf(IDBTransaction);

                    open.result.close();
                    done();
                };
            });
        });

        it('should pass an IDBVersionChangeEvent to the onupgradeneeded event', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    expect(event).to.be.an.instanceOf(IDBVersionChangeEvent);
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should pass the IDBOpenDBRequest to the onsuccess event', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onsuccess = function (event) {
                    expect(event).to.be.an.instanceOf(env.Event);
                    expect(event.target).to.equal(open);
                    open.result.close();
                    done();
                };
            });
        });

        it('should set the IDBOpenDBRequest.result to the database', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onsuccess = function () {
                    expect(open.result).to.be.an.instanceOf(IDBDatabase);
                    expect(open.result.name).to.equal(name);

                    open.result.close();
                    done();
                };
            });
        });

        it('should populate all IDBDatabase properties', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name, 1);

                open.onsuccess = function () {
                    const db = open.result;
                    expect(db.name).to.equal(name);
                    expect(db.version).to.equal(1);
                    expect(open.result.version).to.equal(1);
                    expect(db.objectStoreNames).to.have.lengthOf(0);

                    open.result.close();
                    done();
                };
            });
        });

        it('should open (and create) a new database', function (done) {
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

                    expect(db.version).to.equal(1);
                    expect(event.newVersion).to.equal(1);
                    if (env.isShimmed || !env.browser.isSafari) {
                        expect(event.oldVersion).to.equal(0); // BUG: Safari equals Number.MAX_VALUE
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should open (and create) a new database without specifying version number', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const open = indexedDB.open(name); // <--- No version number
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function (event) {
                    const db = event.target.result;
                    expect(db.version).to.equal(1);
                    expect(open.result.version).to.equal(1);
                    if (env.isShimmed || !env.browser.isSafari) {
                        expect(event.newVersion).to.equal(1); // BUG: Safari equals null
                        expect(event.oldVersion).to.equal(0); // BUG: Safari equals Number.MAX_VALUE
                    }
                });

                open.onsuccess = function () {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should upgrade an existing database by one version', function (done) {
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
                        expect(db.version).to.equal(1);
                        expect(event.newVersion).to.equal(1);
                        if (env.isShimmed || !env.browser.isSafari) {
                            expect(event.oldVersion).to.equal(0);
                        }
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        expect(open.result.version).to.equal(1);
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
                        expect(db.version).to.equal(2);
                        expect(event.oldVersion).to.equal(1);
                        expect(event.newVersion).to.equal(2);
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should upgrade an existing database by multiple versions', function (done) {
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
                        expect(db.version).to.equal(1);
                        expect(event.newVersion).to.equal(1);
                        if (env.isShimmed || !env.browser.isSafari) {
                            expect(event.oldVersion).to.equal(0);
                        }
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        expect(open.result.version).to.equal(1);
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
                        expect(db.version).to.equal(2);
                        expect(event.oldVersion).to.equal(1);
                        expect(event.newVersion).to.equal(2);
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        setTimeout(createVersion3, 50);
                    };
                }

                /**
                 * @returns {void}
                 */
                function createVersion3 () {
                    const open = indexedDB.open(name, 3);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function (event) {
                        const db = event.target.result;
                        expect(db.version).to.equal(3);
                        expect(event.oldVersion).to.equal(2);
                        expect(event.newVersion).to.equal(3);
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should upgrade an existing database by multiple versions at once', function (done) {
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
                        expect(db.version).to.equal(1);
                        expect(event.newVersion).to.equal(1);
                        if (env.isShimmed || !env.browser.isSafari) {
                            expect(event.oldVersion).to.equal(0);
                        }
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        expect(open.result.version).to.equal(1);
                        open.result.close();
                        setTimeout(createVersion5, 50);
                    };
                }

                /**
                 * @returns {void}
                 */
                function createVersion5 () {
                    const open = indexedDB.open(name, 5);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function (event) {
                        const db = event.target.result;
                        expect(db.version).to.equal(5);
                        expect(event.oldVersion).to.equal(1);
                        expect(event.newVersion).to.equal(5);
                    });

                    open.onsuccess = function () {
                        sinon.assert.calledOnce(open.onupgradeneeded); // <-- only called once, not five times
                        open.result.close();
                        done();
                    };
                }
            });
        });
    });

    describe('failure tests', function () {
        it('should not allow databases to be downgraded', function (done) {
            this.timeout(5000);
            util.generateDatabaseName(function (err, name) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                createVersion7();

                /**
                 * @returns {void}
                 */
                function createVersion7 () {
                    const open = indexedDB.open(name, 7);
                    open.onerror = open.onblocked = done;
                    open.onsuccess = function () {
                        expect(open.result.version).to.equal(7);
                        open.result.close();
                        setTimeout(createVersion4, env.transactionDuration);
                    };
                }

                /**
                 * @returns {void}
                 */
                function createVersion4 () {
                    const open = indexedDB.open(name, 4);
                    open.onupgradeneeded = sinon.spy();
                    open.onsuccess = sinon.spy();
                    open.onblocked = sinon.spy();

                    open.onerror = function () {
                        sinon.assert.notCalled(open.onupgradeneeded);
                        sinon.assert.notCalled(open.onsuccess);
                        sinon.assert.notCalled(open.onblocked);

                        if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                            expect(open.error).to.be.an.instanceOf(env.DOMException); // Was DOMError before latest draft spec
                        }
                        expect(open.error.name).to.equal('VersionError');
                        done();
                    };
                }
            });
        });

        it('should throw an error if called without params', function () {
            let err;
            try {
                indexedDB.open();
            } catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.name).to.equal('TypeError');
        });

        it('should not allow these version numbers', function () {
            tryToOpen('');
            tryToOpen(util.sampleData.veryLongString);
            tryToOpen('foobar');
            tryToOpen(0);
            tryToOpen(-3);
            tryToOpen(Number.POSITIVE_INFINITY);
            tryToOpen(Number.NEGATIVE_INFINITY);
            tryToOpen(Number.NaN);

            if (env.isShimmed || !env.browser.isFirefox) {
                tryToOpen(/^regex$/);
                tryToOpen(null);
                tryToOpen({foo: 'bar'});
                tryToOpen([]);
                tryToOpen(['a', 'b', 'c']);
            }

            /**
             * @typedef {number} Integer
             */

            /**
             * @param {Integer} version
             * @returns {void}
             */
            function tryToOpen (version) {
                let err = null;

                try {
                    indexedDB.open('test', version);
                } catch (e) {
                    err = e;
                }

                expect(typeof err).equal('object'); // When using native, an('object') will show custom string
                if (env.isShimmed || !env.browser.isIE) {
                    expect(err).to.be.an.instanceOf(TypeError); // IE throws a DOMException
                    expect(err.name).to.equal('TypeError');
                }
            }
        });
    });
});

describe('IDBFactory.open', function () {
    'use strict';

    let indexedDB;
    beforeEach(function () {
        ({indexedDB} = env);
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
                expect(open.transaction).to.be.null;

                open.onupgradeneeded = function () {
                    // The transaction property is an IDBTransaction during the onupgradeneeded event
                    expect(open.transaction).to.be.an.instanceOf(IDBTransaction);
                    tx = open.transaction;
                };

                open.onsuccess = function () {
                    // The transaction property is null again in the onsuccess event
                    expect(open.transaction).to.be.null;
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
                    if (!env.isShimmed && env.browser.isSafari) {
                        return;
                    }

                    expect(event.newVersion).to.equal(1); // BUG: Safari equals null
                    expect(event.oldVersion).to.equal(0); // BUG: Safari equals Number.MAX_VALUE
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
            tryToOpen(Infinity);
            tryToOpen(-Infinity);
            tryToOpen(NaN);

            if (env.isShimmed || !env.browser.isFirefox) {
                tryToOpen(/^regex$/v);
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
                if (!env.isShimmed && env.browser.isIE) {
                    return;
                }

                expect(err).to.be.an.instanceOf(TypeError); // IE throws a DOMException
                expect(err.name).to.equal('TypeError');
            }
        });
    });
});

describe('IDBFactory.open shim-internal edge cases', function () {
    'use strict';

    if (env.isNative) { return; }

    it('should throw for a database name exceeding the length limit', function () {
        expect(() => {
            shimIndexedDB.open(util.sampleData.veryLongString);
        }).to.throw(Error, /length/v);
    });

    it('should auto-name the database when CFG.autoName is true and the name is empty', function (done) {
        const autoName = shimIndexedDB.__getConfig('autoName');
        shimIndexedDB.__setConfig('autoName', true);
        const open = shimIndexedDB.open('', 1);
        open.onerror = open.onblocked = function (e) {
            shimIndexedDB.__setConfig('autoName', autoName);
            done(e.target.error || new Error('open() errored or blocked'));
        };
        open.onsuccess = function () {
            shimIndexedDB.__setConfig('autoName', autoName);
            expect(open.result.name).to.match(/^autoNamedDatabase_\d+$/v);
            open.result.close();
            shimIndexedDB.deleteDatabase(open.result.name);
            done();
        };
    });

    it('should create the __sys__ SQLite index when CFG.createIndexes is true', function (done) {
        const createIndexes = shimIndexedDB.__getConfig('createIndexes');
        shimIndexedDB.__setConfig('createIndexes', true);
        util.generateDatabaseName(function (err, name) {
            if (err) {
                shimIndexedDB.__setConfig('createIndexes', createIndexes);
                done(err);
                return;
            }
            const open = shimIndexedDB.open(name, 1);
            open.onupgradeneeded = function () {
                open.result.createObjectStore('s');
            };
            open.onerror = open.onblocked = function (e) {
                shimIndexedDB.__setConfig('createIndexes', createIndexes);
                done(e.target.error || new Error('open() errored or blocked'));
            };
            open.onsuccess = function () {
                shimIndexedDB.__setConfig('createIndexes', createIndexes);
                open.result.close();
                done();
            };
        });
    });

    describe('with CFG.cacheDatabaseInstances disabled', function () {
        let cacheDatabaseInstances;
        beforeEach(function () {
            cacheDatabaseInstances = shimIndexedDB.__getConfig('cacheDatabaseInstances');
            shimIndexedDB.__setConfig('cacheDatabaseInstances', false);
        });
        afterEach(function () {
            shimIndexedDB.__setConfig('cacheDatabaseInstances', cacheDatabaseInstances);
        });

        it('should re-look-up an existing (uncached) database\'s version from dbVersions', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) { done(err); return; }
                const open1 = shimIndexedDB.open(name, 1);
                open1.onupgradeneeded = function () {
                    open1.result.createObjectStore('s');
                };
                open1.onerror = open1.onblocked = done;
                open1.onsuccess = function () {
                    open1.result.close();
                    // Not cached (cacheDatabaseInstances is false), so this
                    //   reopen must look up the existing version via SQL
                    //   rather than an in-memory cache hit.
                    const open2 = shimIndexedDB.open(name);
                    open2.onupgradeneeded = function () {
                        done(new Error('Should not need an upgrade to reopen at the existing version'));
                    };
                    open2.onerror = open2.onblocked = done;
                    open2.onsuccess = function () {
                        expect(open2.result.version).to.equal(1);
                        open2.result.close();
                        done();
                    };
                };
            });
        });

        it('should synchronously error with VersionError for a lower requested version', function (done) {
            util.generateDatabaseName(function (err, name) {
                if (err) { done(err); return; }
                const open1 = shimIndexedDB.open(name, 2);
                open1.onupgradeneeded = function () {
                    open1.result.createObjectStore('s');
                };
                open1.onerror = open1.onblocked = done;
                open1.onsuccess = function () {
                    open1.result.close();
                    const open2 = shimIndexedDB.open(name, 1);
                    open2.onupgradeneeded = function () {
                        done(new Error('Should not fire upgradeneeded for a lower version'));
                    };
                    open2.onsuccess = function () {
                        done(new Error('Should not succeed when opening at a lower version'));
                    };
                    open2.onerror = function (e) {
                        expect(e.target.error.name).to.equal('VersionError');
                        done();
                    };
                };
            });
        });
    });

    it('should not dispatch versionchange to a connection already closed by an earlier connection\'s handler', function (done) {
        util.generateDatabaseName(function (err, name) {
            if (err) { done(err); return; }
            const open1 = shimIndexedDB.open(name, 1);
            open1.onupgradeneeded = function () {
                open1.result.createObjectStore('s');
            };
            open1.onerror = open1.onblocked = done;
            open1.onsuccess = function () {
                const db1 = open1.result;
                const open2 = shimIndexedDB.open(name, 1);
                open2.onerror = open2.onblocked = done;
                open2.onsuccess = function () {
                    const db2 = open2.result;
                    let db2VersionChangeFired = false;
                    db2.onversionchange = function () {
                        db2VersionChangeFired = true;
                    };
                    db1.onversionchange = function () {
                        // Synchronously close `db2` as well, before its turn
                        //   comes up in the `versionchange`-dispatch queue.
                        db1.close();
                        db2.close();
                    };
                    const open3 = shimIndexedDB.open(name, 2);
                    open3.onblocked = done;
                    open3.onupgradeneeded = function () {
                        open3.result.createObjectStore('s2');
                    };
                    open3.onerror = done;
                    open3.onsuccess = function () {
                        expect(db2VersionChangeFired).to.equal(false);
                        open3.result.close();
                        done();
                    };
                };
            };
        });
    });
});

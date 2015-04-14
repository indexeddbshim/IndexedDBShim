describe('IDBFactory.open', function() {
    'use strict';

    var indexedDB;
    beforeEach(function() {
        indexedDB = env.indexedDB;
    });

    describe('success tests', function() {
        it('should return an IDBOpenDBRequest', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                expect(open).to.be.an.instanceOf(IDBOpenDBRequest);

                open.onsuccess = function() {
                    open.result.close();
                    done();
                };
            });
        });

        it('should have a reference to the upgrade transaction', function(done) {
            util.generateDatabaseName(function(err, name) {
                var tx;
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                // The transaction property is null initially
                expect(open.transaction).to.be.null;

                open.onupgradeneeded = function() {
                    // The transaction property is an IDBTransaction during the onupgradeneeded event
                    expect(open.transaction).to.be.an.instanceOf(IDBTransaction);
                    tx = open.transaction;
                };

                open.onsuccess = function() {
                    // The transaction property is null again in the onsuccess event
                    expect(open.transaction).to.be.null;
                    expect(tx).to.be.an.instanceOf(IDBTransaction);

                    open.result.close();
                    done();
                };
            });
        });

        it('should pass an IDBVersionChangeEvent to the onupgradeneeded event', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    expect(event).to.be.an.instanceOf(IDBVersionChangeEvent);
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should pass the IDBOpenDBRequest to the onsuccess event', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onsuccess = function(event) {
                    expect(event).to.be.an.instanceOf(env.Event);
                    expect(event.target).to.equal(open);
                    open.result.close();
                    done();
                };
            });
        });

        it('should set the IDBOpenDBRequest.result to the database', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onsuccess = function() {
                    expect(open.result).to.be.an.instanceOf(IDBDatabase);
                    expect(open.result.name).to.equal(name);

                    open.result.close();
                    done();
                };
            });
        });

        it('should populate all IDBDatabase properties', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);

                open.onsuccess = function() {
                    var db = open.result;
                    expect(db.name).to.equal(name);
                    expect(db.version).to.equal(1);
                    expect(db.objectStoreNames).to.have.lengthOf(0);

                    open.result.close();
                    done();
                };
            });
        });

        it('should open (and create) a new database', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name, 1);
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;

                    expect(db.version).to.equal(1);
                    expect(event.newVersion).to.equal(1);
                    if (env.isShimmed || !env.browser.isSafari) {
                        expect(event.oldVersion).to.equal(0);   // BUG: Safari equals Number.MAX_VALUE
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should open (and create) a new database without specifying version number', function(done) {
            util.generateDatabaseName(function(err, name) {
                var open = indexedDB.open(name);                // <--- No version number
                open.onerror = open.onblocked = done;

                open.onupgradeneeded = sinon.spy(function(event) {
                    var db = event.target.result;
                    expect(db.version).to.equal(1);
                    if (env.isShimmed || !env.browser.isSafari) {
                        expect(event.newVersion).to.equal(1);   // BUG: Safari equals null
                        expect(event.oldVersion).to.equal(0);   // BUG: Safari equals Number.MAX_VALUE
                    }
                });

                open.onsuccess = function() {
                    sinon.assert.calledOnce(open.onupgradeneeded);
                    open.result.close();
                    done();
                };
            });
        });

        it('should upgrade an existing database by one version', function(done) {
            util.generateDatabaseName(function(err, name) {
                createVersion1();

                function createVersion1() {
                    var open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        expect(db.version).to.equal(1);
                        expect(event.newVersion).to.equal(1);
                        if (env.isShimmed || !env.browser.isSafari) {
                            expect(event.oldVersion).to.equal(0);
                        }
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        expect(open.result.version).to.equal(1);
                        open.result.close();
                        setTimeout(createVersion2, 50);
                    };
                }

                function createVersion2() {
                    var open = indexedDB.open(name, 2);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        expect(db.version).to.equal(2);
                        expect(event.oldVersion).to.equal(1);
                        expect(event.newVersion).to.equal(2);
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should upgrade an existing database by multiple versions', function(done) {
            util.generateDatabaseName(function(err, name) {
                createVersion1();

                function createVersion1() {
                    var open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        expect(db.version).to.equal(1);
                        expect(event.newVersion).to.equal(1);
                        if (env.isShimmed || !env.browser.isSafari) {
                            expect(event.oldVersion).to.equal(0);
                        }
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        expect(open.result.version).to.equal(1);
                        open.result.close();
                        setTimeout(createVersion2, 50);
                    };
                }

                function createVersion2() {
                    var open = indexedDB.open(name, 2);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        expect(db.version).to.equal(2);
                        expect(event.oldVersion).to.equal(1);
                        expect(event.newVersion).to.equal(2);
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        setTimeout(createVersion3, 50);
                    };
                }

                function createVersion3() {
                    var open = indexedDB.open(name, 3);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        expect(db.version).to.equal(3);
                        expect(event.oldVersion).to.equal(2);
                        expect(event.newVersion).to.equal(3);
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        open.result.close();
                        done();
                    };
                }
            });
        });

        it('should upgrade an existing database by multiple versions at once', function(done) {
            util.generateDatabaseName(function(err, name) {
                createVersion1();

                function createVersion1() {
                    var open = indexedDB.open(name, 1);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        expect(db.version).to.equal(1);
                        expect(event.newVersion).to.equal(1);
                        if (env.isShimmed || !env.browser.isSafari) {
                            expect(event.oldVersion).to.equal(0);
                        }
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);
                        expect(open.result.version).to.equal(1);
                        open.result.close();
                        setTimeout(createVersion5, 50);
                    };
                }

                function createVersion5() {
                    var open = indexedDB.open(name, 5);
                    open.onerror = open.onblocked = done;

                    open.onupgradeneeded = sinon.spy(function(event) {
                        var db = event.target.result;
                        expect(db.version).to.equal(5);
                        expect(event.oldVersion).to.equal(1);
                        expect(event.newVersion).to.equal(5);
                    });

                    open.onsuccess = function() {
                        sinon.assert.calledOnce(open.onupgradeneeded);  // <-- only called once, not five times
                        open.result.close();
                        done();
                    };
                }
            });
        });
    });

    describe('failure tests', function() {
        it('should not allow databases to be downgraded', function(done) {
            util.generateDatabaseName(function(err, name) {
                createVersion7();

                function createVersion7() {
                    var open = indexedDB.open(name, 7);
                    open.onerror = open.onblocked = done;
                    open.onsuccess = function() {
                        expect(open.result.version).to.equal(7);
                        open.result.close();
                        setTimeout(createVersion4, 50);
                    };
                }

                function createVersion4() {
                    var open = indexedDB.open(name, 4);
                    open.onupgradeneeded = sinon.spy();
                    open.onsuccess = sinon.spy();
                    open.onblocked = sinon.spy();

                    open.onerror = function() {
                        sinon.assert.notCalled(open.onupgradeneeded);
                        sinon.assert.notCalled(open.onsuccess);
                        sinon.assert.notCalled(open.onblocked);

                        if (env.isShimmed || !env.browser.isSafari) {
                            expect(open.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                        }
                        expect(open.error.name).to.equal('VersionError');
                        done();
                    };
                }
            });
        });

        it('should throw an error if called without params', function() {
            var err;
            try {
                indexedDB.open();
            }
            catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.name).to.equal('TypeError');
        });

        it('should not allow these version numbers', function() {
            tryToOpen('');
            tryToOpen('foobar');
            tryToOpen(0);
            tryToOpen(-3);
            tryToOpen(Infinity);
            tryToOpen(-Infinity);
            tryToOpen(NaN);
            tryToOpen(/^regex$/);

            if (env.isShimmed || !env.browser.isFirefox) {
                tryToOpen(undefined);
                tryToOpen(null);
                tryToOpen({foo: 'bar'});
                tryToOpen([]);
                tryToOpen(['a', 'b', 'c']);
            }

            function tryToOpen(version) {
                var err = null;

                try {
                    indexedDB.open('test', version);
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an('object');
                if (env.isShimmed || !env.browser.isIE) {
                    expect(err).to.be.an.instanceOf(TypeError); // IE throws a DOMException
                    expect(err.name).to.equal('TypeError');
                }
            }
        });
    });
});

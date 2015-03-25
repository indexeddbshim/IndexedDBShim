describe('IDBDatabase.transaction', function() {
    'use strict';

    describe('success tests', function() {
        it('should return an IDBTransaction', function(done) {
            util.createDatabase('inline', function(err, db) {
                var tx = db.transaction('inline', 'readonly');
                expect(tx).to.be.an.instanceOf(IDBTransaction);

                db.close();
                done();
            });
        });

        it('should have a reference to the database', function(done) {
            util.createDatabase('inline', function(err, db) {
                var tx = db.transaction('inline', 'readonly');
                expect(tx.db).to.equal(db);

                db.close();
                done();
            });
        });

        it('should pass the IDBTransaction to the oncomplete callback', function(done) {
            util.createDatabase('out-of-line', function(err, db) {
                var tx = db.transaction('out-of-line', 'readwrite');
                tx.onerror = done;

                tx.oncomplete = function(event) {
                    expect(event.target).to.equal(tx);

                    db.close();
                    done();
                };
            });
        });

        it('should open a single object store', function(done) {
            util.createDatabase('inline', 'inline-generated', 'out-of-line', function(err, db) {
                // Transaction only includes one of the three stores
                var tx = db.transaction('inline-generated');
                expect(tx.objectStore('inline-generated')).to.be.an.instanceOf(IDBObjectStore);

                // These two stores aren't part of the transaction
                expect(tryToOpen('inline')).to.throw();
                expect(tryToOpen('out-of-line')).to.throw();

                function tryToOpen(store) {
                    return function() {
                        expect(tx.objectStore(store)).to.be.an.instanceOf(IDBObjectStore);
                    };
                }

                db.close();
                done();
            });
        });

        it('should open multiple object stores', function(done) {
            if (env.browser.isSafari) {
                // BUG: Safari does not support opening multiple object stores
                console.error('Skipping test: ' + this.test.title);
                return done();
            }

            util.createDatabase('inline', 'inline-generated', 'out-of-line', function(err, db) {
                // Transaction only includes two of the three stores
                var tx = db.transaction(['inline', 'out-of-line']);
                expect(tx.objectStore('inline')).to.be.an.instanceOf(IDBObjectStore);
                expect(tx.objectStore('out-of-line')).to.be.an.instanceOf(IDBObjectStore);

                // This store isn't part of the transaction
                try {
                    tx.objectStore('inline-generated');
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an('object');

                if (!env.browser.isIE) {
                    // IE's DOMException doesn't inherit from Error
                    expect(err).to.be.an.instanceOf(Error);
                }

                db.close();
                done();
            });
        });

        it('should default to "readonly" mode', function(done) {
            util.createDatabase('inline', function(err, db) {
                var tx = db.transaction('inline');
                var store = tx.objectStore('inline');

                try {
                    store.put({id: 12345});
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an('object');
                expect(err.name).to.equal('ReadOnlyError');

                if (!env.browser.isIE) {
                    // IE's DOMException doesn't inherit from Error
                    expect(err).to.be.an.instanceOf(Error);
                }

                db.close();
                done();
            });
        });

        it('can be explicitly set to "readonly" mode', function(done) {
            util.createDatabase('inline', function(err, db) {
                var tx = db.transaction('inline', 'readonly');
                var store = tx.objectStore('inline');

                try {
                    store.put({id: 12345});
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an('object');
                expect(err.name).to.equal('ReadOnlyError');

                if (!env.browser.isIE) {
                    // IE's DOMException doesn't inherit from Error
                    expect(err).to.be.an.instanceOf(Error);
                }

                db.close();
                done();
            });
        });

        it('can be explicitly set to "readwrite" mode', function(done) {
            util.createDatabase('inline', function(err, db) {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');

                var put = store.put({id: 12345});
                expect(put).to.be.an.instanceOf(IDBRequest);

                tx.oncomplete = function() {
                    db.close();
                    done();
                };
            });
        });
    });

    describe('failure tests', function() {
        it('should throw an error if called without params', function(done) {
            util.createDatabase(function(err, db) {
                try {
                    db.transaction();
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an.instanceOf(TypeError);
                expect(err.name).to.equal('TypeError');

                db.close();
                done();
            });
        });

        it('should throw an error if an empty list of store names is given', function(done) {
            util.createDatabase(function(err, db) {
                try {
                    db.transaction([]);
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an('object');

                if (!env.browser.isSafari) {
                    // Safari throws "NotFoundError"
                    expect(err.name).to.equal('InvalidAccessError');
                }

                if (!env.browser.isIE) {
                    // IE's DOMException doesn't inherit from Error
                    expect(err).to.be.an.instanceOf(Error);
                }

                db.close();
                done();
            });
        });

        it('should throw an error if an invalid store name is given', function(done) {
            util.createDatabase(function(err, db) {
                try {
                    db.transaction('foobar');
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an('object');
                expect(err.name).to.equal('NotFoundError');

                if (!env.browser.isIE) {
                    // IE's DOMException doesn't inherit from Error
                    expect(err).to.be.an.instanceOf(Error);
                }

                db.close();
                done();
            });
        });

        it('should throw an error if valid and invalid store names are specified', function(done) {
            util.createDatabase('inline', 'inline-generated', function(err, db) {
                try {
                    db.transaction(['inline', 'foobar', 'inline-generated']);
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an('object');
                expect(err.name).to.equal('NotFoundError');

                if (!env.browser.isIE) {
                    // IE's DOMException doesn't inherit from Error
                    expect(err).to.be.an.instanceOf(Error);
                }

                db.close();
                done();
            });
        });

        it('should throw an error if an invalid mode is specified', function(done) {
            util.createDatabase('inline', function(err, db) {
                try {
                    db.transaction('inline', 'ReadWrite');          // <--- mode is case-sensitive
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.ok;
                if (!env.browser.isIE) {
                    expect(err).to.be.an.instanceOf(TypeError);     // IE throws a DOMException
                    expect(err.name).to.equal('TypeError');         // IE throws "InvalidAccessError"
                }

                db.close();
                done();
            });
        });

        it('should throw an error if the database is closed', function(done) {
            util.createDatabase('inline', function(err, db) {
                db.close();

                try {
                    db.transaction('inline', 'readonly');
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an('object');
                expect(err.name).to.equal('InvalidStateError');

                if (!env.browser.isIE) {
                    // IE's DOMException doesn't inherit from Error
                    expect(err).to.be.an.instanceOf(Error);
                }

                db.close();
                done();
            });
        });
    });

});

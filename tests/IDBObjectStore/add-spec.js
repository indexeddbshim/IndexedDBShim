describe('IDBObjectStore.add', function() {
    'use strict';

    var onerror;
    beforeEach(function() {
        onerror = window.onerror;

        if (env.isNative && env.browser.isFirefox) {
            // Firefox throws a global error when a transaction fails.
            // Catch the error and stop it from propagating
            window.onerror = function() { return true; };
        }
    });

    afterEach(function() {
        // Restore the global error handler
        window.onerror = onerror;
    });

    it('should throw an error if an out-of-line key already exists', function(done) {
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('out-of-line', function(err, db) {
            window.onerror = function() {
                return true;
            };

            var tx = db.transaction('out-of-line', 'readwrite');
            tx.oncomplete = sinon.spy();
            tx.onerror = sinon.spy();

            var store = tx.objectStore('out-of-line');
            var add1 = store.add({foo: 'bar'}, 12345);
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({biz: 'baz'}, 12345);
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function() {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };
        });
    });

    it('should throw an error if an out-of-line key conflict occurs in simultaneous transactions', function(done) {
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('out-of-line', function(err, db) {
            var tx1 = db.transaction('out-of-line', 'readwrite');
            var tx2 = db.transaction('out-of-line', 'readwrite');
            var tx3 = db.transaction('out-of-line', 'readwrite');

            var store1 = tx1.objectStore('out-of-line');
            var store2 = tx2.objectStore('out-of-line');
            var store3 = tx3.objectStore('out-of-line');

            var save1 = store1.add({foo: 'one'}, 1);
            var save2 = store2.add({foo: 'two'}, 1);
            var save3 = store3.add({foo: 'three'}, 1);

            tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy();
            tx1.onerror = tx2.onerror = tx3.onerror = sinon.spy();

            tx1.onabort = tx2.onabort = tx3.onabort = sinon.spy(function() {
                if (tx1.oncomplete.calledOnce && tx1.onerror.calledTwice && tx1.onabort.calledTwice) {
                    expect(save1.result).to.equal(1);
                    expect(save2.result).not.to.be.ok;
                    expect(save3.result).not.to.be.ok;

                    expect(save2.error.name).to.equal('ConstraintError');
                    expect(save3.error.name).to.equal('ConstraintError');

                    if (env.isShimmed || !env.browser.isSafari) {
                        expect(save2.result).to.be.undefined;   // Safari uses null
                        expect(save3.result).to.be.undefined;   // Safari uses null

                        expect(save2.error).to.be.an.instanceOf(env.DOMError);     // Safari's DOMError is private
                        expect(save3.error).to.be.an.instanceOf(env.DOMError);     // Safari's DOMError is private
                    }

                    db.close();
                    done();
                }
            });
        });
    });

    it('should throw an error if a generated out-of-line key already exists', function(done) {
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            tx.oncomplete = sinon.spy();
            tx.onerror = sinon.spy();

            var store = tx.objectStore('out-of-line-generated');
            var add1 = store.add({foo: 'bar'});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({foo: 'bar'}, 1);
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.onabort = function() {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };
        });
    });

    it('should throw an error if an inline key already exists', function(done) {
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.oncomplete = sinon.spy();
            tx.onerror = sinon.spy();

            var store = tx.objectStore('inline');
            var add1 = store.add({id: 12345, foo: 'bar'});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({id: 12345, biz: 'baz'});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.onabort = function() {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };
        });
    });

    it('should throw an error if an inline key conflict occurs in simultaneous transactions', function(done) {
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('inline', function(err, db) {
            var tx1 = db.transaction('inline', 'readwrite');
            var tx2 = db.transaction('inline', 'readwrite');
            var tx3 = db.transaction('inline', 'readwrite');

            var store1 = tx1.objectStore('inline');
            var store2 = tx2.objectStore('inline');
            var store3 = tx3.objectStore('inline');

            var save1 = store1.add({id: 1});
            var save2 = store2.add({id: 1});
            var save3 = store3.add({id: 1});

            tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy();
            tx1.onerror = tx2.onerror = tx3.onerror = sinon.spy();

            tx1.onabort = tx2.onabort = tx3.onabort = sinon.spy(function() {
                if (tx1.oncomplete.calledOnce && tx1.onerror.calledTwice && tx1.onabort.calledTwice) {
                    expect(save1.result).to.equal(1);
                    expect(save2.result).not.to.be.ok;
                    expect(save3.result).not.to.be.ok;

                    expect(save2.error.name).to.equal('ConstraintError');
                    expect(save3.error.name).to.equal('ConstraintError');

                    if (env.isShimmed || !env.browser.isSafari) {
                        expect(save2.result).to.be.undefined;   // Safari uses null
                        expect(save3.result).to.be.undefined;   // Safari uses null

                        expect(save2.error).to.be.an.instanceOf(env.DOMError);     // Safari's DOMError is private
                        expect(save3.error).to.be.an.instanceOf(env.DOMError);     // Safari's DOMError is private
                    }

                    db.close();
                    done();
                }
            });
        });
    });

    it('should throw an error if a generated inline key already exists', function(done) {
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('inline-generated', function(err, db) {
            var tx = db.transaction('inline-generated', 'readwrite');
            tx.oncomplete = sinon.spy();
            tx.onerror = sinon.spy();

            var store = tx.objectStore('inline-generated');
            var add1 = store.add({foo: 'bar'});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({id: 1, biz: 'baz'});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.onabort = function() {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };
        });
    });

    it('should throw an error if a dotted key already exists', function(done) {
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('dotted', function(err, db) {
            var tx = db.transaction('dotted', 'readwrite');
            tx.oncomplete = sinon.spy();
            tx.onerror = sinon.spy();

            var store = tx.objectStore('dotted');
            var add1 = store.add({name: {first: 'John', last: 'Doe'}, age: 30});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({name: {first: 'John', last: 'Smith'}, age: 42});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.onabort = function() {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };
        });
    });

    it('should throw an error if a generated dotted key already exists', function(done) {
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('dotted-generated', function(err, db) {
            var tx = db.transaction('dotted-generated', 'readwrite');
            tx.oncomplete = sinon.spy();
            tx.onerror = sinon.spy();

            var store = tx.objectStore('dotted-generated');
            var add1 = store.add({age: 30});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({name: {first: 1, last: 'Smith'}, age: 42});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.onabort = function() {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };
        });
    });

    it('should throw an error if a compound out-of-line key already exists', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('out-of-line-compound', function(err, db) {
            var tx = db.transaction('out-of-line-compound', 'readwrite');
            tx.oncomplete = sinon.spy();
            tx.onerror = sinon.spy();

            var store = tx.objectStore('out-of-line-compound');
            var add1 = store.add({foo: 'bar'}, [1, 'two', new Date(2003, 4, 5)]);
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({foo: 'bar'}, [1, 'two', new Date(2003, 4, 5)]);
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.onabort = function() {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };
        });
    });

    it('should throw an error if a compound key already exists', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('inline-compound', function(err, db) {
            var tx = db.transaction('inline-compound', 'readwrite');
            tx.oncomplete = sinon.spy();
            tx.onerror = sinon.spy();

            var store = tx.objectStore('inline-compound');
            var add1 = store.add({id: 12345, name: 'John Doe', age: 30});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({id: 12345, name: 'John Doe', age: 42});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.onabort = function() {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };
        });
    });

    it('should throw an error if a dotted compound key already exists', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }
        if (env.browser.isIE && env.browser.isMobile) {
            // BUG: The WebSql plug-in suppresses constraint violation errors (see https://code.google.com/p/csharp-sqlite/issues/detail?id=130)
            return done(new Error('This test fails on Windows Phone due to a bug in the WebSql plug-in'));
        }

        util.createDatabase('dotted-compound', function(err, db) {
            var tx = db.transaction('dotted-compound', 'readwrite');
            tx.oncomplete = sinon.spy();
            tx.onerror = sinon.spy();

            var store = tx.objectStore('dotted-compound');
            var add1 = store.add({id: 12345, name: {first: 'John', last: 'Doe'}, age: 30});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({id: 12345, name: {first: 'John', last: 'Doe'}, age: 42});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.onabort = function() {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || !env.browser.isSafari) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMError);   // Safari's DOMError is private
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };
        });
    });
});

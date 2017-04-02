/* eslint-env mocha */
/* globals expect, sinon, util, env */
/* eslint-disable no-var, no-unused-expressions */
describe('IDBObjectStore.add (only)', function () {
    'use strict';

    var onerror;
    beforeEach(function () {
        onerror = window.onerror;

        if (env.browser.isFirefox) {
            // Firefox throws a global error when a transaction fails.
            // Catch the error and stop it from propagating
            window.onerror = function () {
                return true;
            };
        }
    });

    afterEach(function () {
        // Restore the global error handler
        window.onerror = onerror;
    });

    it('should throw an error if an out-of-line key already exists', function (done) {
        this.timeout(5000);
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            window.onerror = function () {
                return true;
            };

            var tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = sinon.spy();

            var store = tx.objectStore('out-of-line');
            var add1 = store.add({foo: 'bar'}, 12345);
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({biz: 'baz'}, 12345);
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function () {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMException);   // Was DOMError before latest draft spec
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };

            tx.oncomplete = sinon.spy(function () {
                if (add2.onsuccess.called) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    it('should throw an error if an out-of-line key conflict occurs in simultaneous transactions', function (done) {
        this.timeout(8000);
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx1 = db.transaction('out-of-line', 'readwrite');
            var tx2 = db.transaction('out-of-line', 'readwrite');
            var tx3 = db.transaction('out-of-line', 'readwrite');

            var store1 = tx1.objectStore('out-of-line');
            var store2 = tx2.objectStore('out-of-line');
            var store3 = tx3.objectStore('out-of-line');

            var save1 = store1.add({foo: 'one'}, 1);
            var save2 = store2.add({foo: 'two'}, 1);
            var save3 = store3.add({foo: 'three'}, 1);

            save1.onsuccess = save2.onsuccess = save3.onsuccess = sinon.spy();
            tx1.onerror = tx2.onerror = tx3.onerror = sinon.spy();

            tx1.onabort = tx2.onabort = tx3.onabort = sinon.spy(function () {
                if (tx1.oncomplete.calledOnce && tx1.onerror.calledTwice && tx1.onabort.calledTwice) {
                    expect(save1.result).to.equal(1);
                    expect(save2.result).to.not.be.ok;
                    expect(save3.result).to.not.be.ok;

                    expect(save2.error.name).to.equal('ConstraintError');
                    expect(save3.error.name).to.equal('ConstraintError');

                    if (env.isShimmed || !env.browser.isSafari) {
                        expect(save2.result).equal(undefined);   // Safari uses null
                        expect(save3.result).equal(undefined);   // Safari uses null

                        if (!env.browser.isFirefox) {
                            expect(save2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                            expect(save3.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                        }
                    }

                    db.close();
                    done();
                }
            });

            tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function () {
                if (save1.calledThrice) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    it('should throw an error if a generated out-of-line key already exists', function (done) {
        util.createDatabase('out-of-line-generated', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            tx.onerror = sinon.spy();

            var store = tx.objectStore('out-of-line-generated');
            var add1 = store.add({foo: 'bar'});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({foo: 'bar'}, 1);
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function () {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };

            tx.oncomplete = sinon.spy(function () {
                if (add2.onsuccess.called) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    it('should throw an error if an inline key already exists', function (done) {
        this.timeout(5000);

        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = sinon.spy();

            var store = tx.objectStore('inline');
            var add1 = store.add({id: 12345, foo: 'bar'});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({id: 12345, biz: 'baz'});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function () {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };

            tx.oncomplete = sinon.spy(function () {
                if (add2.onsuccess.called) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    it('should throw an error if an inline key conflict occurs in simultaneous transactions', function (done) {
        this.timeout(10000);
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx1 = db.transaction('inline', 'readwrite');
            var tx2 = db.transaction('inline', 'readwrite');
            var tx3 = db.transaction('inline', 'readwrite');

            var store1 = tx1.objectStore('inline');
            var store2 = tx2.objectStore('inline');
            var store3 = tx3.objectStore('inline');

            var save1 = store1.add({id: 1});
            var save2 = store2.add({id: 1});
            var save3 = store3.add({id: 1});

            save1.onsuccess = save2.onsuccess = save3.onsuccess = sinon.spy();
            tx1.onerror = tx2.onerror = tx3.onerror = sinon.spy();

            tx1.onabort = tx2.onabort = tx3.onabort = sinon.spy(function () {
                if (tx1.oncomplete.calledOnce && tx1.onerror.calledTwice && tx1.onabort.calledTwice) {
                    expect(save1.result).to.equal(1);
                    expect(save2.result).to.not.be.ok;
                    expect(save3.result).to.not.be.ok;

                    expect(save2.error.name).to.equal('ConstraintError');
                    expect(save3.error.name).to.equal('ConstraintError');

                    if (env.isShimmed || !env.browser.isSafari) {
                        expect(save2.result).equal(undefined);   // Safari uses null
                        expect(save3.result).equal(undefined);   // Safari uses null

                        if (!env.browser.isFirefox) {
                            expect(save2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                            expect(save3.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                        }
                    }

                    db.close();
                    done();
                }
            });

            tx1.oncomplete = tx2.oncomplete = tx3.oncomplete = sinon.spy(function () {
                if (save1.calledThrice) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    it('should throw an error if a generated inline key already exists', function (done) {
        this.timeout(5000);

        util.createDatabase('inline-generated', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline-generated', 'readwrite');
            tx.onerror = sinon.spy();

            var store = tx.objectStore('inline-generated');
            var add1 = store.add({foo: 'bar'});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({id: 1, biz: 'baz'});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function () {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };

            tx.oncomplete = sinon.spy(function () {
                if (add2.onsuccess.called) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    it('should throw an error if a dotted key already exists', function (done) {
        this.timeout(5000);
        util.createDatabase('dotted', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('dotted', 'readwrite');
            tx.onerror = sinon.spy();

            var store = tx.objectStore('dotted');
            var add1 = store.add({name: {first: 'John', last: 'Doe'}, age: 30});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({name: {first: 'John', last: 'Smith'}, age: 42});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function () {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };

            tx.oncomplete = sinon.spy(function () {
                if (add2.onsuccess.called) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    it('should throw an error if a generated dotted key already exists', function (done) {
        this.timeout(5000);

        util.createDatabase('dotted-generated', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('dotted-generated', 'readwrite');
            tx.onerror = sinon.spy();

            var store = tx.objectStore('dotted-generated');
            var add1 = store.add({age: 30});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({name: {first: 1, last: 'Smith'}, age: 42});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function () {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };

            tx.oncomplete = sinon.spy(function () {
                if (add2.onsuccess.called) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should throw an error if a compound out-of-line key already exists', function (done) {
        this.timeout(5000);
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('out-of-line-compound', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line-compound', 'readwrite');
            tx.onerror = sinon.spy();

            var store = tx.objectStore('out-of-line-compound');
            var add1 = store.add({foo: 'bar'}, [1, 'two', new Date(2003, 4, 5)]);
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({foo: 'bar'}, [1, 'two', new Date(2003, 4, 5)]);
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function () {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };

            tx.oncomplete = sinon.spy(function () {
                if (add2.onsuccess.called) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should throw an error if a compound key already exists', function (done) {
        this.timeout(5000);
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('inline-compound', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline-compound', 'readwrite');
            tx.onerror = sinon.spy();

            var store = tx.objectStore('inline-compound');
            var add1 = store.add({id: 12345, name: 'John Doe', age: 30});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({id: 12345, name: 'John Doe', age: 42});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function () {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };

            tx.oncomplete = sinon.spy(function () {
                if (add2.onsuccess.called) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should throw an error if a dotted compound key already exists', function (done) {
        this.timeout(5000);
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('dotted-compound', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('dotted-compound', 'readwrite');
            tx.onerror = sinon.spy();

            var store = tx.objectStore('dotted-compound');
            var add1 = store.add({id: 12345, name: {first: 'John', last: 'Doe'}, age: 30});
            add1.onsuccess = sinon.spy();
            add1.onerror = sinon.spy();

            var add2 = store.add({id: 12345, name: {first: 'John', last: 'Doe'}, age: 42});
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();

            tx.onabort = function () {
                // The first add should succeed
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.notCalled(add1.onerror);

                // The second add should fail
                sinon.assert.notCalled(add2.onsuccess);
                sinon.assert.calledOnce(add2.onerror);

                // The transaction should fail
                sinon.assert.notCalled(tx.oncomplete);
                sinon.assert.called(tx.onerror);

                if (env.isShimmed || (!env.browser.isSafari && !env.browser.isFirefox)) {
                    expect(add2.error).to.be.an.instanceOf(env.DOMException);     // Was DOMError before latest draft spec
                }
                expect(add2.error.name).to.equal('ConstraintError');

                db.close();
                done();
            };

            tx.oncomplete = sinon.spy(function () {
                if (add2.onsuccess.called) {
                    db.close();
                    done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key'));
                }
            });
        });
    });
});

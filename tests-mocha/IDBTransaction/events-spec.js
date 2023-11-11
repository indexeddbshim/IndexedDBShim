/* eslint-env mocha */
/* globals expect, sinon, util, env */
/* eslint-disable no-var */
describe('IDBTransaction events', function () {
    'use strict';

    it('should fire the oncomplete event if a transaction completes successfully', function (done) {
        this.timeout(5000);
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');

            var store = tx.objectStore('inline');
            var add = store.add({id: 1});
            add.onsuccess = sinon.spy();

            tx.oncomplete = function () {
                sinon.assert.calledOnce(add.onsuccess);
                db.close();
                done();
            };
        });
    });

    it('should fire the oncomplete event if a transaction does nothing', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });

    it('should fire the oncomplete event if a synchronous error occurs', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readonly'); // <-- read-only

            db.onerror = sinon.spy();
            tx.onerror = sinon.spy();

            var windowOnerrorState = {};
            util.stubWindowOnerror(windowOnerrorState);

            // if (!env.browser.isFirefox) sinon.spy(window, 'onerror').returns(true);

            var store = tx.objectStore('inline');
            var errored = false;
            try {
                store.add({id: 1}); // <-- This causes a synchronous error
            } catch (e) {
                errored = true;
            }

            tx.oncomplete = function () {
                expect(errored).equal(true);
                sinon.assert.notCalled(db.onerror); // <-- database.onerror NEVER fires
                sinon.assert.notCalled(tx.onerror); // <-- transaction.onerror NEVER fires
                expect(windowOnerrorState.erred).equal(false); // <-- window.onerror NEVER fires
                // if (!env.browser.isFirefox) sinon.assert.notCalled(window.onerror);
            };

            setTimeout(function () {
                try {
                    expect(errored).equal(true);
                    sinon.assert.notCalled(db.onerror); // <-- database.onerror NEVER fires
                    sinon.assert.notCalled(tx.onerror); // <-- transaction.onerror NEVER fires
                    // if (!env.browser.isFirefox) sinon.assert.notCalled(window.onerror);     // <-- window.onerror NEVER fires
                    expect(windowOnerrorState.erred).equal(false); // <-- window.onerror NEVER fires
                    db.close();
                    done();
                } finally {
                    // if (!env.browser.isFirefox) window.onerror.restore();
                    util.restoreWindowOnerror();
                }
            }, env.transactionDuration);
        });
    });

    it('should fire the onerror event if an asynchronous error occurs', function (done) {
        this.timeout(5000);
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');

            var windowOnerrorState = {};
            util.stubWindowOnerror(windowOnerrorState);

            var store = tx.objectStore('inline');
            store.add({id: 1});
            var add = store.add({id: 1}); // <-- This causes an asynchronous error (duplicate id)

            // IDBRequest events
            add.onsuccess = sinon.spy();
            add.onerror = sinon.spy(function () {
                sinon.assert.notCalled(add.onsuccess); // <-- request.onsuccess NEVER fires
                sinon.assert.notCalled(tx.oncomplete); // <-- transaction.oncomplete NEVER fires
                sinon.assert.notCalled(tx.onerror); // <-- transaction.onerror HAS NOT fired YET
                sinon.assert.notCalled(db.onerror); // <-- database.onerror HAS NOT fired YET
                // if (!env.browser.isFirefox) sinon.assert.notCalled(window.onerror);     // <-- window.onerror HAS NOT fired YET
                expect(windowOnerrorState.erred).equal(false);
            });

            // IDBTransaction events
            tx.onerror = sinon.spy(function (e) {
                sinon.assert.notCalled(add.onsuccess); // <-- request.onsuccess NEVER fires
                sinon.assert.notCalled(tx.oncomplete); // <-- transaction.oncomplete NEVER fires
                sinon.assert.calledOnce(add.onerror); // <-- request.onerror HAS fired
                sinon.assert.notCalled(db.onerror); // <-- database.onerror HAS NOT fired YET
                // if (!env.browser.isFirefox) sinon.assert.notCalled(window.onerror);     // <-- window.onerror HAS NOT fired YET
                if (env.browser.isFirefox) { e.preventDefault(); } // Firefox reaches here unless preventDefault() is called (which will also cause our tests to fail)
                else { expect(windowOnerrorState.erred).equal(false); }
            });
            tx.oncomplete = sinon.spy(function () {
                db.close();
                if (!env.browser.isFirefox) { done(new Error('IDBObjectStore.add() should have thrown an error when two records were added with the same primary key')); }
            });

            // IDBDatabase events
            db.onerror = sinon.spy(function () {
                sinon.assert.notCalled(add.onsuccess); // <-- request.onsuccess NEVER fires
                sinon.assert.notCalled(tx.oncomplete); // <-- transaction.oncomplete NEVER fires
                sinon.assert.calledOnce(add.onerror); // <-- request.onerror HAS fired
                sinon.assert.calledOnce(tx.onerror); // <-- transaction.onerror HAS fired
                // if (!env.browser.isFirefox) sinon.assert.notCalled(window.onerror);     // <-- window.onerror HAS NOT fired YET
                expect(windowOnerrorState.erred).equal(false);
            });

            // Window events
            // if (!env.browser.isFirefox) sinon.stub(window, 'onerror').returns(true);

            setTimeout(function () {
                try {
                    sinon.assert.notCalled(add.onsuccess); // <-- request.onsuccess NEVER fires
                    if (!env.browser.isFirefox) {
                        sinon.assert.notCalled(tx.oncomplete); // <-- transaction.oncomplete NEVER fires
                    }
                    sinon.assert.calledOnce(add.onerror); // <-- request.onerror HAS fired
                    sinon.assert.calledOnce(tx.onerror); // <-- transaction.onerror HAS fired
                    sinon.assert.calledOnce(db.onerror); // <-- database.onerror HAS fired

                    // Firefox fires window.onerror.  No other browser does.
                    // sinon.assert.notCalled(window.onerror);
                    expect(windowOnerrorState.erred).equal(false);
                    db.close();
                    done();
                } finally {
                    // if (!env.browser.isFirefox) window.onerror.restore();
                    util.restoreWindowOnerror();
                }
            }, env.transactionDuration);
        });
    });

    it('should not fire the onerror event if an error occurs during oncomplete', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            if (typeof process !== 'undefined') { // Node
                const originalException = process.listeners('uncaughtException').pop();
                process.removeListener('uncaughtException', originalException);
                process.once('uncaughtException', function (error) {
                    process.addListener('uncaughtException', originalException);
                    window.onerror(error);
                });
            }
            var tx = db.transaction('inline', 'readwrite');
            tx.onabort = sinon.spy();

            var windowOnerrorState = {};
            util.stubWindowOnerror(windowOnerrorState);

            db.onerror = tx.onerror = sinon.spy(function () {
                db.close();
                done(new Error('The onerror event fired when it should not have'));
            });

            tx.oncomplete = sinon.spy(function () {
                sinon.assert.notCalled(db.onerror); // <-- database.onerror NEVER fires
                sinon.assert.notCalled(tx.onerror); // <-- transaction.onerror NEVER fires
                sinon.assert.notCalled(tx.onabort); // <-- transaction.abort NEVER fires
                // if (!env.browser.isFirefox) sinon.assert.notCalled(window.onerror);         // <-- window.onerror HAS NOT fired YET
                expect(windowOnerrorState.erred).equal(false);
                throw new Error('Test Error');
            });

            util.stubWindowOnerror(windowOnerrorState, function () {
                sinon.assert.calledOnce(tx.oncomplete); // <-- transaction.oncomplete HAS fired
                sinon.assert.notCalled(db.onerror); // <-- database.onerror NEVER fires
                sinon.assert.notCalled(tx.onerror); // <-- transaction.onerror NEVER fires
                sinon.assert.notCalled(tx.onabort); // <-- transaction.abort NEVER fires
                return true;
            });

            window.addEventListener('cordovacallbackerror', function handler () {
                window.removeEventListener('cordovacallbackerror', handler);
                db.close();
                done(new Error('The WebSQL plugin suppressed an error event. (window.onerror should have fired)'));
            });

            setTimeout(function () {
                try {
                    sinon.assert.calledOnce(tx.oncomplete); // <-- transaction.oncomplete HAS fired
                    // if (!env.browser.isFirefox) sinon.assert.calledOnce(window.onerror);    // <-- window.onerror HAS fired
                    expect(windowOnerrorState.erred).equal(true);
                    windowOnerrorState.erred = false;
                    sinon.assert.notCalled(db.onerror); // <-- database.onerror NEVER fires
                    sinon.assert.notCalled(tx.onerror); // <-- transaction.onerror NEVER fires
                    sinon.assert.notCalled(tx.onabort); // <-- transaction.abort NEVER fires
                    db.close();
                    done();
                } finally {
                    // if (!env.browser.isFirefox) window.onerror.restore();
                    util.restoreWindowOnerror();
                }
            }, env.transactionDuration);
        });
    });

    it('should not fire the onerror event if an error occurs during onabort', function (done) {
        this.timeout(5000);
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            if (typeof process !== 'undefined') { // Node
                const originalException = process.listeners('uncaughtException').pop();
                process.removeListener('uncaughtException', originalException);
                process.once('uncaughtException', function (error) {
                    process.addListener('uncaughtException', originalException);
                    window.onerror(error);
                });
            }
            var tx = db.transaction('inline', 'readwrite');

            db.onerror = sinon.spy();
            tx.onerror = sinon.spy();
            tx.oncomplete = sinon.spy();

            var windowOnerrorState = {};
            util.stubWindowOnerror(windowOnerrorState);

            tx.onabort = sinon.spy(function () {
                sinon.assert.notCalled(db.onerror); // <-- database.onerror NEVER fires
                sinon.assert.notCalled(tx.onerror); // <-- transaction.onerror NEVER fires
                sinon.assert.notCalled(tx.oncomplete); // <-- transaction.oncomplete NEVER fires
                // if (!env.browser.isFirefox) sinon.assert.notCalled(window.onerror);         // <-- window.onerror HAS NOT fired YET
                expect(windowOnerrorState.erred).equal(false);
                throw new Error('Test Error');
            });

            util.stubWindowOnerror({}, function () {
                sinon.assert.calledOnce(tx.onabort); // <-- transaction.onabort HAS fired
                sinon.assert.notCalled(db.onerror); // <-- database.onerror NEVER fires
                sinon.assert.notCalled(tx.onerror); // <-- transaction.onerror NEVER fires
                sinon.assert.notCalled(tx.oncomplete); // <-- transaction.oncomplete NEVER fires
                return true;
            });
            tx.abort();
            setTimeout(function () {
                try {
                    sinon.assert.calledOnce(tx.onabort); // <-- transaction.onabort HAS fired
                    // if (!env.browser.isFirefox) sinon.assert.calledOnce(window.onerror);    // <-- window.onerror HAS fired
                    sinon.assert.notCalled(db.onerror); // <-- database.onerror NEVER fires
                    sinon.assert.notCalled(tx.onerror); // <-- transaction.onerror NEVER fires
                    sinon.assert.notCalled(tx.oncomplete); // <-- transaction.oncomplete NEVER fires
                    expect(windowOnerrorState.erred).equal(false); // <-- window.onerror NEVER fires
                    // if (!env.browser.isFirefox) sinon.assert.notCalled(window.onerror);     // <-- window.onerror NEVER fires
                    db.close();
                    done();
                } finally {
                    // if (!env.browser.isFirefox) window.onerror.restore();
                    util.restoreWindowOnerror();
                }
            }, env.transactionDuration);
        });
    });
});

describe('IDBTransaction.abort', function () {
    'use strict';

    if (!env.isNative) {
        it('should throw "Illegal invocation" when called on a non-instance', function () {
            expect(() => {
                IDBTransaction.prototype.abort.call({});
            }).to.throw(TypeError, 'Illegal invocation');
        });
    }

    it('should abort a readwrite transaction whose underlying SQL transaction has already started', function (done) {
        this.timeout(20000);
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');

            tx.onabort = function () {
                db.close();
                done();
            };
            tx.oncomplete = function () {
                db.close();
                done(new Error('Transaction should have aborted, not completed'));
            };

            const addReq = store.add({id: 3});
            addReq.onsuccess = function () {
                // By now the underlying WebSQL/SQLite transaction has been
                //   established (`me.__tx` is set), so aborting here exercises
                //   the readwrite-specific rollback path in `__abortTransaction`.
                tx.abort();
            };
            addReq.onerror = function () {
                db.close();
                done(new Error('Could not add data'));
            };
        });
    });

    it('should error out later-queued requests when aborted synchronously from an earlier request\'s success handler', function (done) {
        this.timeout(20000);
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');

            tx.onabort = function () {
                sinon.assert.calledOnce(add1.onsuccess);
                sinon.assert.calledOnce(add2.onerror);
                sinon.assert.notCalled(add2.onsuccess);
                db.close();
                done();
            };
            tx.oncomplete = function () {
                db.close();
                done(new Error('Transaction should have aborted, not completed'));
            };

            // Both requests are queued synchronously, before either has had a
            //   chance to run, so aborting from `add1`'s success handler
            //   later marks `add2` (still pending in the queue at that
            //   point) as done via `__abortTransaction`'s own cleanup --
            //   exercising `prepareNextRequest`'s "already aborted" check for
            //   a request it hasn't reached yet.
            const add1 = store.add({id: 4});
            const add2 = store.add({id: 5});
            add1.onsuccess = sinon.spy(function () {
                tx.abort();
            });
            add1.onerror = sinon.spy();
            add2.onsuccess = sinon.spy();
            add2.onerror = sinon.spy();
        });
    });

    it('should throw InvalidStateError when called on an already-committed transaction', function (done) {
        this.timeout(20000);
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');

            tx.oncomplete = function () {
                db.close();
                done();
            };
            tx.onerror = function () {
                db.close();
                done(new Error('Transaction should have completed, not errored'));
            };

            const addReq = store.add({id: 1});
            addReq.onsuccess = function () {
                tx.commit();

                let caught;
                try {
                    tx.abort();
                } catch (e) {
                    caught = e;
                }
                expect(caught).to.be.an.instanceOf(env.DOMException);
                expect(caught.name).to.equal('InvalidStateError');
                expect(caught.message).to.include('already been committed');
            };
            addReq.onerror = function () {
                db.close();
                done(new Error('Could not add data'));
            };
        });
    });

    it('should throw InvalidStateError when called after all requests have finished (auto-committing)', function (done) {
        this.timeout(20000);
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');

            tx.oncomplete = function () {
                db.close();
                done();
            };
            tx.onerror = function () {
                db.close();
                done(new Error('Transaction should have completed, not errored'));
            };

            const addReq = store.add({id: 2});
            addReq.onsuccess = function () {
                // No further requests are queued, so shortly the transaction
                //   will become `__requestsFinished` and auto-committing,
                //   even though `__committed` itself isn't set until the
                //   async SQL commit round trip actually resolves. Exactly
                //   how much of that round trip has elapsed by the time this
                //   `setTimeout(fn, 0)` macrotask runs is not deterministic
                //   (it races the driver's own macrotask-scheduled commit
                //   completion), so `abort()` may throw either while still
                //   "already committing" or after having fully finished --
                //   both are valid confirmations that abort is too late.
                setTimeout(function () {
                    let caught;
                    try {
                        tx.abort();
                    } catch (e) {
                        caught = e;
                    }
                    expect(caught).to.be.an.instanceOf(env.DOMException);
                    expect(caught.name).to.equal('InvalidStateError');
                    expect(caught.message).to.match(/already committing|finished by commit or abort/);
                }, 0);
            };
            addReq.onerror = function () {
                db.close();
                done(new Error('Could not add data'));
            };
        });
    });
});

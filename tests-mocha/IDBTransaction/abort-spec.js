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
                // No further requests are queued, so the transaction is now
                //   `__requestsFinished` and auto-committing, even though
                //   `__committed` itself isn't set yet.
                setTimeout(function () {
                    let caught;
                    try {
                        tx.abort();
                    } catch (e) {
                        caught = e;
                    }
                    expect(caught).to.be.an.instanceOf(env.DOMException);
                    expect(caught.name).to.equal('InvalidStateError');
                    expect(caught.message).to.include('already committing');
                }, 0);
            };
            addReq.onerror = function () {
                db.close();
                done(new Error('Could not add data'));
            };
        });
    });
});

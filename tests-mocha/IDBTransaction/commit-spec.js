describe('IDBTransaction.commit', function () {
    'use strict';

    if (!env.isNative) {
        it('should throw "Illegal invocation" when called on a non-instance', function () {
            expect(() => {
                IDBTransaction.prototype.commit.call({});
            }).to.throw(TypeError, 'Illegal invocation');
        });
    }

    it('should explicitly commit the transaction, firing `complete`', function (done) {
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
            tx.onabort = function () {
                db.close();
                done(new Error('Transaction should have completed, not aborted'));
            };

            // The `inline` schema store uses `keyPath: 'id'`, so the key
            //   must come from the value, not a second argument.
            const addReq = store.add({id: 1});
            addReq.onsuccess = function () {
                // Per `commit()`'s own check, the transaction must still be
                //   genuinely active -- reachable from within a request's own
                //   `onsuccess`, same as elsewhere in this codebase.
                tx.commit();
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

            const addReq = store.add({id: 2});
            addReq.onsuccess = function () {
                tx.commit();

                let err2;
                try {
                    tx.commit();
                } catch (e) {
                    err2 = e;
                }
                expect(err2).to.be.an.instanceOf(env.DOMException);
                expect(err2.name).to.equal('InvalidStateError');
            };
            addReq.onerror = function () {
                db.close();
                done(new Error('Could not add data'));
            };
        });
    });
});

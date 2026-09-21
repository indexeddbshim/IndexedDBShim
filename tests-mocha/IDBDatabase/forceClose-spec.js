describe('IDBDatabase.__forceClose', function () {
    'use strict';

    const {sample} = testData;

    if (!env.isNative) {
        it('should abort pending transactions and then dispatch a `close` event', function (done) {
            this.timeout(20000);
            testHelper.createObjectStores(undefined, (error, [objectStore]) => {
                if (error) {
                    done(error);
                    return;
                }
                const tx = objectStore.transaction;
                const {db} = tx;
                let aborted = false;

                tx.onabort = function () {
                    aborted = true;
                    expect(tx.error, 'tx.error').to.exist;
                    expect(tx.error.name, 'tx.error.name').to.equal('AbortError');
                };
                tx.oncomplete = function () {
                    done(new Error('Transaction should have been force-aborted, not completed'));
                };

                db.onclose = function () {
                    expect(aborted, 'transaction aborted before `close`').to.equal(true);
                    done();
                };

                // A lone request marks the transaction `__requestsFinished`
                //   internally as soon as it completes, before even its own
                //   `onsuccess` fires -- too early for `__forceClose` to
                //   still catch it as active. A second, still-queued request
                //   keeps the transaction genuinely active, so `__forceClose`
                //   is called here from within the first request's own
                //   `onsuccess`, while the second is still pending.
                const req1 = objectStore.add(sample.obj(), sample.integer());
                const req2 = objectStore.add(sample.obj(), sample.integer());
                req2.onerror = function (event) {
                    // Expected: aborted along with the rest of the transaction.
                    event.preventDefault();
                };
                req2.onsuccess = function () {
                    done(new Error('req2 should have been aborted, not succeeded'));
                };
                req1.onsuccess = function () {
                    env.indexedDB.__forceClose(db.name);
                };
            });
        });

        it('should wait for every active transaction to abort before dispatching `close`', function (done) {
            this.timeout(20000);
            // An isolated, uniquely-named database (rather than the shared
            //   `DB.NAME` `testHelper.createObjectStores` uses) so nothing
            //   here can leak a connection that blocks a later, unrelated
            //   test sharing that name.
            util.createDatabase('out-of-line', 'out-of-line-compound', function (err, db) {
                if (err) {
                    done(err);
                    return;
                }
                // Both schema items are plain out-of-line-keyed stores (the
                //   `-compound` suffix only affects how a *caller* might
                //   choose to key it, not how the store itself is created),
                //   so both transactions below do symmetric work and finish
                //   at comparable speed -- no assumption about which is
                //   "faster" is needed.
                const tx1 = db.transaction('out-of-line', 'readwrite');
                const store1 = tx1.objectStore('out-of-line');
                const tx2 = db.transaction('out-of-line-compound', 'readwrite');
                const store2 = tx2.objectStore('out-of-line-compound');

                let tx1Aborted = false;
                let tx2Aborted = false;
                let closeFired = false;

                tx1.onabort = function () {
                    tx1Aborted = true;
                    expect(closeFired, '`close` should not fire before this abort').to.equal(false);
                };
                tx2.onabort = function () {
                    tx2Aborted = true;
                    expect(closeFired, '`close` should not fire before this abort').to.equal(false);
                };

                db.onclose = function () {
                    closeFired = true;
                    expect(tx1Aborted, 'tx1 aborted before `close`').to.equal(true);
                    expect(tx2Aborted, 'tx2 aborted before `close`').to.equal(true);
                    done();
                };

                const req1 = store1.add(sample.obj(), sample.integer());
                const req2 = store2.add(sample.obj(), sample.integer());
                req1.onerror = function (event) { event.preventDefault(); };
                req2.onerror = function (event) { event.preventDefault(); };

                // `readwrite` transactions on the same database are
                //   serialized by SQLite's own write-locking even across
                //   different stores, so waiting for either one's request to
                //   succeed before force closing risks the *other* having
                //   already finished entirely in the meantime (whichever
                //   gets scheduled second could otherwise not even have
                //   started). Calling `__forceClose` synchronously, in the
                //   same tick as issuing both requests -- before either's
                //   SQL has had a chance to run at all -- avoids relying on
                //   any assumption about their relative scheduling.
                env.indexedDB.__forceClose(db.name);
            });
        });
    }
});

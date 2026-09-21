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
    }
});

describe('IDBDatabase.__forceClose', function () {
    'use strict';

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

            env.indexedDB.__forceClose(db.name);
        });
    });
});

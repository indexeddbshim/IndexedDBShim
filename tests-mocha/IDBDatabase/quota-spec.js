describe('IDBDatabase quota', function () {
    'use strict';
    this.timeout(5000);

    it('should throw QuotaExceededError when sqlMemoryQuota is exceeded', function (done) {
        if (!env.isShimmed || !window.shimIndexedDB) {
            // We can only reliably test this configuration in the shim in node environment.
            done();
            return;
        }

        // 4KB quota, 1 page
        window.shimIndexedDB.__setConfig({sqlMemoryQuota: 4096});

        util.createDatabase('quota-test-db', function (err, db) {
            if (err) {
                // If it fails during setup, it might also be due to quota being too small for the schema,
                // but let's assume we can at least create the DB and an empty store.
                if (err.name === 'QuotaExceededError') {
                    // This is also acceptable if it fails on schema creation
                    window.shimIndexedDB.__setConfig({sqlMemoryQuota: 0}); // reset
                    done();
                    return;
                }
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }

            const tx = db.transaction('quota-test-db', 'readwrite');
            const store = tx.objectStore('quota-test-db');

            // Try to store 10KB of data
            const largeData = 'x'.repeat(10240);
            const req = store.add(largeData, 'large-key');

            req.onerror = function (e) {
                e.preventDefault();
            };

            tx.oncomplete = function () {
                window.shimIndexedDB.__setConfig({sqlMemoryQuota: 0}); // reset
                db.close();
                done(new Error('Transaction should have failed due to quota exceeded'));
            };

            tx.onerror = function () {
                window.shimIndexedDB.__setConfig({sqlMemoryQuota: 0}); // reset
                db.close();
                try {
                    expect(tx.error).to.be.ok;
                    expect(tx.error.name).to.equal('QuotaExceededError');
                    done();
                } catch (txErr) {
                    done(txErr);
                }
            };
        });
    });
});

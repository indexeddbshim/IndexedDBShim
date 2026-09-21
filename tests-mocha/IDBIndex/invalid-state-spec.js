describe('IDBIndex deleted state', function () {
    'use strict';

    it('should throw InvalidStateError when used after its index is deleted', function (done) {
        this.timeout(20000);
        const {testData: {DB}} = window;
        testHelper.createObjectStores(undefined, (error, [, db]) => {
            if (error) {
                done(error);
                return;
            }
            db.close();
            // `createObjectStores` leaves `DB.NAME` at version 1; a version
            //   bump is required here to reliably trigger `onupgradeneeded`
            //   (opening with no version wouldn't fire it at all).
            const dbOpenRequest = env.indexedDB.open(DB.NAME, 2);
            dbOpenRequest.onupgradeneeded = function () {
                const objectStore1 = dbOpenRequest.transaction.objectStore(DB.OBJECT_STORE_1);
                const index = objectStore1.createIndex('ToBeDeletedIndex', 'String');
                objectStore1.deleteIndex('ToBeDeletedIndex');
                let thrown;
                try {
                    index.count();
                } catch (err) {
                    thrown = err;
                }
                expect(thrown, 'index.count() after deleteIndex() should throw').to.exist;
                expect(thrown.name, 'error name').to.equal('InvalidStateError');
                // The shim's own message wording is more specific; native
                //   browsers use their own standard message for the same
                //   error, so only check the message text against the shim.
                if (!env.isNative) {
                    expect(thrown.message).to.match(/This index has been deleted/);
                }
            };
            dbOpenRequest.onsuccess = function () {
                dbOpenRequest.result.close();
                done();
            };
            dbOpenRequest.onerror = function (e) {
                // Defense in depth: an uncaught exception inside
                //   `onupgradeneeded` (e.g. a failed assertion) aborts the
                //   version-change transaction and routes here instead of
                //   `onsuccess` -- without this, the connection would never
                //   be closed, and `DB.NAME` (shared across this whole
                //   suite) would stay blocked for whichever later test next
                //   tries to open it at a higher version.
                if (dbOpenRequest.result) {
                    dbOpenRequest.result.close();
                }
                done(new Error('Database NOT opened: ' + (e.target && e.target.error)));
            };
            dbOpenRequest.onblocked = function () {
                done(new Error('Opening database blocked'));
            };
        });
    });
});

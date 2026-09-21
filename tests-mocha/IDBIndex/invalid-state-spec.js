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
            const dbOpenRequest = env.indexedDB.open(DB.NAME);
            dbOpenRequest.onupgradeneeded = function () {
                const objectStore1 = dbOpenRequest.transaction.objectStore(DB.OBJECT_STORE_1);
                const index = objectStore1.createIndex('ToBeDeletedIndex', 'String');
                objectStore1.deleteIndex('ToBeDeletedIndex');
                expect(() => {
                    index.count();
                }, 'index.count() after deleteIndex()').to.throw(/This index has been deleted/);
            };
            dbOpenRequest.onsuccess = function () {
                dbOpenRequest.result.close();
                done();
            };
            dbOpenRequest.onerror = function (e) {
                done(new Error('Database NOT opened: ' + (e.target && e.target.error)));
            };
            dbOpenRequest.onblocked = function () {
                done(new Error('Opening database blocked'));
            };
        });
    });
});

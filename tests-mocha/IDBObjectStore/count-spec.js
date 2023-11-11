/* eslint-env mocha */
/* globals expect, testHelper */
/* eslint-disable no-var */

describe('IDBObjectStore.count', function () {
    it('Count in Object Store', function (done) {
        testHelper.createObjectStores(undefined, (error, [, db]) => {
            if (error) {
                done(error);
                return;
            }
            db.close();
            testHelper.addObjectStoreData(() => {
                testHelper.openObjectStore(undefined, (error, [objectStore]) => {
                    if (error) {
                        done(error);
                    }
                    var req = objectStore.count();
                    req.onsuccess = function () {
                        expect(req.result, 'Total number of objects in database').to.equal(15);
                        objectStore.transaction.db.close();
                        done();
                    };
                    req.onerror = function () {
                        done(new Error('Could not get count of data'));
                    };
                });
            });
        });
    });
});

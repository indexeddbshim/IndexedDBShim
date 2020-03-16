/* eslint-env mocha */
/* globals expect, testHelper */
/* eslint-disable no-var, no-unused-expressions */
describe('IDBObjectStore.openKeyCursor', function () {
    it('Store Key Cursor', function (done) {
        testHelper.createObjectStores(undefined, (error, [, db]) => {
            if (error) {
                done(error);
                return;
            }
            db.close();
            testHelper.addObjectStoreData(function () {
                testHelper.openObjectStore(undefined, function (error, [objectStore, db]) {
                    if (error) {
                        done(error);
                    }
                    if (!objectStore.openKeyCursor) {
                        db.close();
                        done(new Error(
                            'Environment doesn\'t yet support objectStore.openKeyCursor'
                        ));
                        return;
                    }
                    var indexCursorReq = objectStore.openKeyCursor();
                    indexCursorReq.onsuccess = function () {
                        var cursor = indexCursorReq.result;
                        if (cursor) {
                            // _('Iterating over cursor ' + cursor.key + ' for value ' + JSON.stringify(cursor.value));
                            cursor.continue();
                        } else {
                            expect(true, 'Cursor Iteration completed').to.be.true;
                            db.close();
                            done();
                        }
                    };
                    indexCursorReq.onerror = function () {
                        db.close();
                        done(new Error(
                            'Could not continue opening cursor'
                        ));
                    };
                });
            });
        });
    });
});

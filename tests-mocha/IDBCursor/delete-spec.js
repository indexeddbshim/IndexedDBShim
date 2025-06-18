/* globals testHelper, expect */
/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
describe('IDBCursor.delete', function () {
    it('Deleting using a cursor', function (done) {
        this.timeout(10000);
        testHelper.createObjectStores(undefined, (error, [, db]) => {
            if (error) {
                done(error);
                return;
            }
            db.close();
            testHelper.addObjectStoreData(function () {
                testHelper.openObjectStore(undefined, function (error, [objectStore]) {
                    if (error) {
                        done(error);
                        return;
                    }
                    const cursorReq = objectStore.openCursor();
                    const totalRows = 15;
                    let cursorIteration = 0;
                    cursorReq.onsuccess = function () {
                        const cursor = cursorReq.result;
                        if (cursor) {
                            cursorIteration++;
                            if (cursor.value.Int % 5 === 0) {
                                const updateReq = cursor.delete();
                                updateReq.onsuccess = function () {
                                    expect(
                                        updateReq.result,
                                        'Deleted value ' + cursor.key +
                                            'with key ' + updateReq.result
                                    ).to.be.undefined;
                                    cursor.continue();
                                };
                                updateReq.onerror = function () {
                                    expect(false, 'No delete ' + cursor.key).to.be.true;
                                    cursor.continue();
                                };
                            } else {
                                expect(
                                    true,
                                    'Got cursor value ' + cursor.key +
                                    ':' + JSON.stringify(cursor.value)
                                ).to.be.true;
                                cursor.continue();
                            }
                        } else {
                            objectStore.transaction.db.close();
                            expect(
                                cursorIteration,
                                'All cursors iterated'
                            ).to.equal(totalRows);
                            done();
                        }
                    };
                    cursorReq.onerror = function (e) {
                        expect(false, 'Could not continue opening cursor').to.be.true;
                        done(e);
                    };
                });
            });
        });
    });
});

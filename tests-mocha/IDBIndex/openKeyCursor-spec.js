/* eslint-env mocha */
/* globals expect, testHelper */
/* eslint-disable no-unused-expressions */
describe('IDBIndex.openKeyCursor', function () {
    it('Index Key Cursor', function (done) {
        testHelper.createIndexesAndData((error, [, , objectStore, db]) => {
            if (error) {
                done(error);
                return;
            }
            const index = objectStore.index('Int Index');
            const indexCursorReq = index.openKeyCursor();
            indexCursorReq.onsuccess = function () {
                const cursor = indexCursorReq.result;
                if (cursor) {
                    expect(true, 'Iterating over cursor ' + cursor.key + ' for value ' + JSON.stringify(cursor.value)).to.be.true;
                    cursor.continue();
                } else {
                    expect(true, 'Cursor Iteration completed').to.be.true;
                    db.close();
                    done();
                }
            };
            indexCursorReq.onerror = function () {
                db.close();
                done(new Error('Could not continue opening cursor'));
            };
        });
    });
});

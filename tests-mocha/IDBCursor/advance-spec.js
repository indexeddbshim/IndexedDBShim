describe('IDBCursor.advance', function () {
    'use strict';

    it('should skip multiple records in one call', function (done) {
        this.timeout(20000);
        testHelper.createObjectStores(undefined, (error, [, db]) => {
            if (error) {
                done(error);
                return;
            }
            db.close();
            testHelper.addObjectStoreData(function () {
                // First, collect every key in cursor order the normal way.
                testHelper.openObjectStore(undefined, function (err1, [objectStore1, db1]) {
                    if (err1) {
                        done(err1);
                        return;
                    }
                    const allKeys = [];
                    const collectReq = objectStore1.openCursor();
                    collectReq.onsuccess = function () {
                        const cursor = collectReq.result;
                        if (!cursor) {
                            db1.close();
                            runAdvanceCheck(allKeys);
                            return;
                        }
                        allKeys.push(cursor.key);
                        cursor.continue();
                    };
                    collectReq.onerror = function () {
                        db1.close();
                        done(new Error('Could not open cursor to collect keys'));
                    };
                });
            });

            /**
             * @param {unknown[]} allKeys
             * @returns {void}
             */
            function runAdvanceCheck (allKeys) {
                expect(allKeys.length, 'at least 3 records exist').to.be.at.least(3);
                testHelper.openObjectStore(undefined, function (err2, [objectStore2, db2]) {
                    if (err2) {
                        done(err2);
                        return;
                    }
                    let calls = 0;
                    const advanceReq = objectStore2.openCursor();
                    advanceReq.onsuccess = function () {
                        calls++;
                        const cursor = advanceReq.result;
                        if (calls === 1) {
                            expect(cursor.key, 'starts at the first record').to.deep.equal(allKeys[0]);
                            // Skip two records in one call, landing on the
                            //   third (index 2) rather than the second.
                            cursor.advance(2);
                            return;
                        }
                        expect(calls, 'only one further `onsuccess` call after advance(2)').to.equal(2);
                        expect(cursor.key, 'lands on the record two ahead').to.deep.equal(allKeys[2]);
                        db2.close();
                        done();
                    };
                    advanceReq.onerror = function () {
                        db2.close();
                        done(new Error('Could not open cursor to advance'));
                    };
                });
            }
        });
    });
});

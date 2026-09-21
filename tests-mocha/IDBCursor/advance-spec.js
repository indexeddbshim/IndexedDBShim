describe('IDBCursor.advance', function () {
    'use strict';

    it('should skip multiple records in one call', function (done) {
        this.timeout(20000);
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                done(err);
                return;
            }
            const storeName = 'out-of-line';
            const keys = [1, 2, 3, 4, 5];
            const addTx = db.transaction(storeName, 'readwrite');
            const addStore = addTx.objectStore(storeName);
            keys.forEach((key) => addStore.add('value-' + key, key));
            addTx.onerror = function () {
                db.close();
                done(new Error('Could not add data'));
            };
            addTx.oncomplete = function () {
                const advanceTx = db.transaction(storeName, 'readonly');
                const advanceStore = advanceTx.objectStore(storeName);
                let calls = 0;
                const advanceReq = advanceStore.openCursor();
                advanceReq.onsuccess = function () {
                    calls++;
                    const cursor = advanceReq.result;
                    if (calls === 1) {
                        expect(cursor.key, 'starts at the first record').to.equal(keys[0]);
                        // Skip two records in one call, landing on the
                        //   third (index 2) rather than the second.
                        cursor.advance(2);
                        return;
                    }
                    expect(calls, 'only one further `onsuccess` call after advance(2)').to.equal(2);
                    expect(cursor.key, 'lands on the record two ahead').to.equal(keys[2]);
                    db.close();
                    done();
                };
                advanceReq.onerror = function () {
                    db.close();
                    done(new Error('Could not open cursor to advance'));
                };
            };
        });
    });
});

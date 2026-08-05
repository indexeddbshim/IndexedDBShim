describe('Issue 334: NUL key-range bound', function () {
    it(String.raw`should not include values beyond ["Johnson", "\0") in a compound range`, function (done) {
        util.generateDatabaseName(function (err, dbName) {
            if (err) {
                done(err);
                return;
            }

            const open = indexedDB.open(dbName, 1);
            open.onerror = function () {
                done(open.error || new Error('Failed opening database'));
            };
            open.onupgradeneeded = function () {
                open.result.createObjectStore('people', {keyPath: ['last', 'first']});
            };
            open.onsuccess = function () {
                const db = open.result;
                const writeTx = db.transaction('people', 'readwrite');
                const store = writeTx.objectStore('people');

                store.put({last: 'Johnsom', first: 'NOPE'});
                store.put({last: 'Johnson', first: 'Fred'});
                store.put({last: 'Johnson', first: 'Sally'});
                store.put({last: 'Johnson2', first: 'NOPE'});
                store.put({last: 'Johnson\\', first: 'NOPE'});
                store.put({last: 'Johnson]', first: 'NOPE'});

                writeTx.onerror = function () {
                    db.close();
                    done(writeTx.error || new Error('Failed writing test data'));
                };

                writeTx.oncomplete = function () {
                    const range = IDBKeyRange.bound(
                        ['Johnson'],
                        ['Johnson\0'],
                        false,
                        true
                    );

                    const results = [];
                    const readTx = db.transaction('people', 'readonly');
                    const readStore = readTx.objectStore('people');
                    const cursorReq = readStore.openCursor(range, 'next');

                    cursorReq.onerror = function () {
                        db.close();
                        done(cursorReq.error || new Error('Failed reading cursor data'));
                    };
                    cursorReq.onsuccess = function () {
                        const cursor = cursorReq.result;
                        if (!cursor) {
                            expect(results).to.deep.equal([
                                {last: 'Johnson', first: 'Fred'},
                                {last: 'Johnson', first: 'Sally'}
                            ]);
                            db.close();
                            done();
                            return;
                        }

                        results.push(cursor.value);
                        cursor.continue();
                    };
                };
            };
        });
    });
});

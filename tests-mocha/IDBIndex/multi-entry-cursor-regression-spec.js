describe('IDBIndex.openCursor multi-entry regression', function () {
    'use strict';

    // Regression test for a bug where `IDBCursor.prototype.__findMultiEntry`
    // would stop iterating (or lose track of its position) as soon as it had
    // to fetch more than one underlying batch of rows, since a single
    // physical row can expand into multiple multi-entry matches, and a batch
    // of matches doesn't line up 1:1 with a batch of underlying rows.
    // This is a smaller/faster stand-in for the "hundreds of records" test
    // in openCursor-spec.js, using a tiny `cursorPreloadPackSize` to force
    // several small batches instead of needing hundreds of records.
    it('should walk multi-entry cursors across several small batches', function (done) {
        this.timeout(10000);

        const originalPackSize = shimIndexedDB.__getConfig('cursorPreloadPackSize');
        shimIndexedDB.__setConfig({cursorPreloadPackSize: 3});

        util.createDatabase('inline', 'multi-entry-index', function (err, db) {
            if (err) {
                shimIndexedDB.__setConfig({cursorPreloadPackSize: originalPackSize});
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');
            const index = store.index('multi-entry-index');

            tx.onerror = function (event) {
                shimIndexedDB.__setConfig({cursorPreloadPackSize: originalPackSize});
                done(event.target.error.message);
            };
            tx.oncomplete = function () {
                shimIndexedDB.__setConfig({cursorPreloadPackSize: originalPackSize});
                expect(queries).to.equal(queriesCompleted);
                db.close();
                done();
            };

            const recordCount = 10;
            for (let i = 0; i < recordCount; i++) {
                store.add({id: ['a', 'b', i]});
                store.add({id: ['a', 'c', i]});
            }

            let queries = 0, queriesCompleted = 0;

            /**
             * @param {IDBObjectStore|IDBIndex} source
             * @param {IDBKeyRange} keyRange
             * @param {number} expectedLength
             * @returns {void}
             */
            function query (source, keyRange, expectedLength) {
                queries++;
                util.query(source, keyRange, 'next', function (queryErr, data) {
                    if (queryErr) {
                        throw queryErr;
                    }
                    if (data.length !== expectedLength) {
                        throw new Error(
                            'Expected ' + expectedLength + ' results, but got ' + data.length +
                            '\n' + JSON.stringify(data, null, 2)
                        );
                    }
                    queriesCompleted++;
                });
            }

            // Object Store queries
            query(store, IDBKeyRange.lowerBound(['a']), recordCount * 2);

            // Index queries
            query(index, IDBKeyRange.only('a'), recordCount * 2);
            query(index, IDBKeyRange.bound('a', 'c'), recordCount * 4);
            query(index, IDBKeyRange.lowerBound('b', true), recordCount);
        });
    });
});

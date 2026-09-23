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

    // Regression test: a multi-entry array containing a duplicate value must
    // not produce more than one index record for that record (per spec, the
    // duplicate is dropped when the index entry is built), and querying for
    // it must not error.
    it('should not error when a record\'s multi-entry values contain a duplicate', function (done) {
        util.createDatabase('inline', 'multi-entry-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            const store = tx.objectStore('inline');
            const index = store.index('multi-entry-index');

            tx.onerror = function (event) {
                done(event.target.error.message);
            };
            tx.oncomplete = function () {
                db.close();
                done();
            };

            store.add({id: ['dup', 'dup']});

            util.query(index, IDBKeyRange.only('dup'), 'next', function (queryErr, data) {
                if (queryErr) {
                    throw queryErr;
                }
                expect(data).to.have.lengthOf(1);
            });
        });
    });

    // Regression test: when the *last* (partial, exhausting) batch of
    // underlying rows produces no multi-entry matches at all, the cursor
    // must finish cleanly (rather than looping or erroring) instead of only
    // being exercised by non-final batches with no matches.
    it('should finish cleanly when the final batch of a multi-entry cursor has no matches', function (done) {
        this.timeout(10000);

        const originalPackSize = shimIndexedDB.__getConfig('cursorPreloadPackSize');
        shimIndexedDB.__setConfig({cursorPreloadPackSize: 2});

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
                db.close();
                done();
            };

            // None of these records' multi-entry values match the range
            // queried below, and there are more records than the pack size,
            // so the last (partial, exhausting) batch also has no matches.
            store.add({id: ['a', 'b', 0]});
            store.add({id: ['a', 'b', 1]});
            store.add({id: ['a', 'b', 2]});

            util.query(index, IDBKeyRange.only('nonexistent'), 'next', function (queryErr, data) {
                if (queryErr) {
                    throw queryErr;
                }
                expect(data).to.have.lengthOf(0);
            });
        });
    });
});

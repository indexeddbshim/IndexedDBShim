describe('IDBIndex.getAll/getAllKeys direction', function () {
    'use strict';

    /**
     * @param {IDBIndex} index
     * @param {string} direction
     * @param {(err: Error|undefined, result?: {keys: AnyValue[], primaryKeys: AnyValue[], values: AnyValue[]}) => void} cb
     * @returns {void}
     */
    function collectViaCursor (index, direction, cb) {
        const keys = [];
        const primaryKeys = [];
        const values = [];
        const req = index.openCursor(undefined, direction);
        req.onsuccess = function () {
            const cursor = req.result;
            if (!cursor) {
                cb(undefined, {keys, primaryKeys, values});
                return;
            }
            keys.push(cursor.key);
            primaryKeys.push(cursor.primaryKey);
            values.push(cursor.value);
            cursor.continue();
        };
        req.onerror = function () {
            cb(req.error);
        };
    }

    /**
     * Sets up a `multiEntry` index ('tags') over an out-of-line, autoIncrement
     *   object store, with overlapping tag values across records, so that
     *   `nextunique`/`prevunique` dedup has something meaningful to collapse.
     * @param {(err: Error|undefined, index?: IDBIndex, db?: IDBDatabase) => void} cb
     * @returns {void}
     */
    function setup (cb) {
        util.generateDatabaseName(function (nameErr, dbName) {
            if (nameErr) {
                cb(nameErr);
                return;
            }
            const open = env.indexedDB.open(dbName, 1);
            open.onupgradeneeded = function () {
                const db = open.result;
                const store = db.createObjectStore('items', {autoIncrement: true});
                store.createIndex('tags', 'tags', {multiEntry: true});
            };
            open.onerror = open.onblocked = function (event) {
                cb(event.target.error || new Error('Could not open db'));
            };
            open.onsuccess = function () {
                const db = open.result;
                const tx = db.transaction('items', 'readwrite');
                const store = tx.objectStore('items');
                [
                    {tags: ['a', 'b']},
                    {tags: ['b', 'c']},
                    {tags: ['a']}
                ].forEach(function (record) {
                    store.add(record);
                });
                tx.oncomplete = function () {
                    const index = db.transaction('items', 'readonly').objectStore('items').index('tags');
                    cb(undefined, index, db);
                };
                tx.onerror = function () {
                    cb(new Error('Could not populate store'));
                };
            };
        });
    }

    ['next', 'prev', 'nextunique', 'prevunique'].forEach(function (direction) {
        it('getAll/getAllKeys should match cursor iteration for direction "' + direction + '"', function (done) {
            setup(function (err, index, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                collectViaCursor(index, direction, function (cursorErr, expected) {
                    if (cursorErr) {
                        expect(function () { throw cursorErr; }).to.not.throw(Error);
                        done();
                        return;
                    }
                    const keysReq = index.getAllKeys({direction});
                    keysReq.onsuccess = function () {
                        expect(keysReq.result).to.deep.equal(expected.primaryKeys);

                        const valuesReq = index.getAll({direction});
                        valuesReq.onsuccess = function () {
                            expect(valuesReq.result).to.deep.equal(expected.values);
                            db.close();
                            done();
                        };
                        valuesReq.onerror = function () {
                            done(new Error('getAll failed'));
                        };
                    };
                    keysReq.onerror = function () {
                        done(new Error('getAllKeys failed'));
                    };
                });
            });
        });
    });

    it('should dedup to one record per distinct tag for "nextunique"', function (done) {
        setup(function (err, index, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const req = index.getAllKeys({direction: 'nextunique'});
            req.onsuccess = function () {
                // Records: {tags:['a','b']}, {tags:['b','c']}, {tags:['a']}
                //   -> distinct tags: a, b, c
                expect(req.result).to.have.lengthOf(3);
                db.close();
                done();
            };
            req.onerror = function () {
                done(new Error('getAllKeys failed'));
            };
        });
    });
});

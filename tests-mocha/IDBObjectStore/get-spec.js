import {escapeStoreNameForSQL} from '../../src/util.js';

describe('IDBObjectStore.get', function () {
    const {sample} = testData;
    it('Getting data in Object Store', function (done) {
        this.timeout(20000);
        testHelper.createObjectStores(undefined, (error, [objectStore]) => {
            if (error) {
                done(error);
                return;
            }
            const key = sample.integer();
            const data = sample.obj();
            const addReq = objectStore.add(data, key);
            addReq.onsuccess = () => {
                const req = objectStore.get(key);
                req.onsuccess = function () {
                    expect(req.result, 'Data fetched matches the data').to.deep.equal(data);
                    objectStore.transaction.db.close();
                    done();
                };
                req.onerror = function () {
                    done(new Error('Could not get data'));
                };
            };
            addReq.onerror = function () {
                done(new Error('Could not add data'));
            };
        });
    });

    if (!env.isNative) {
        it('Getting data in Object Store with a duck-typed (non-`IDBKeyRange`-instance) range-like object', function (done) {
            this.timeout(20000);
            testHelper.createObjectStores(undefined, (error, [objectStore]) => {
                if (error) {
                    done(error);
                    return;
                }
                const key = sample.integer();
                const data = sample.obj();
                const addReq = objectStore.add(data, key);
                addReq.onsuccess = () => {
                    // A plain object satisfying `IDBKeyRange`'s duck-typed
                    //   `Symbol.hasInstance` check (rather than an actual
                    //   `IDBKeyRange` instance) must be converted to a real
                    //   range internally.
                    const rangeLike = {
                        lower: key, upper: key, lowerOpen: false, upperOpen: false
                    };
                    const req = objectStore.get(rangeLike);
                    req.onsuccess = function () {
                        expect(req.result, 'Data fetched matches the data').to.deep.equal(data);
                        objectStore.transaction.db.close();
                        done();
                    };
                    req.onerror = function () {
                        done(new Error('Could not get data'));
                    };
                };
                addReq.onerror = function () {
                    done(new Error('Could not add data'));
                };
            });
        });
    }
});

// Corrupt persisted data through the real WebSQL backing store, without
// replacing the decoder or intercepting its SQL result callbacks.
describe('IDBObjectStore.get corrupt stored values', function () {
    if (env.isNative) { return; }

    let db;
    let name;
    let previousDebug;
    let sequence = 0;

    /**
     * Await a real request without changing its success/error behavior.
     * @param {IDBRequest} request
     * @returns {Promise<unknown>}
     */
    function requestResult (request) {
        // eslint-disable-next-line promise/avoid-new -- Adapt the request event API.
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Observe completion or abort without canceling request errors.
     * @param {IDBTransaction} transaction
     * @returns {Promise<string>}
     */
    function transactionResult (transaction) {
        // eslint-disable-next-line promise/avoid-new -- Adapt the transaction event API.
        return new Promise((resolve) => {
            transaction.oncomplete = () => resolve('complete');
            transaction.onabort = () => resolve('abort');
        });
    }

    beforeEach(async function () {
        previousDebug = shimIndexedDB.__getConfig('DEBUG');
        name = 'decode-corrupt-' + Date.now() + '-' + sequence++;
        const open = env.indexedDB.open(name, 1);
        open.onupgradeneeded = () => {
            open.result.createObjectStore('store').put({bad: true}, 1);
        };
        db = await requestResult(open);
        // eslint-disable-next-line promise/avoid-new -- Await the actual backing SQL transaction.
        await new Promise((resolve, reject) => {
            db.__db.transaction((tx) => {
                tx.executeSql('UPDATE ' + escapeStoreNameForSQL('store') + ' SET "value" = ?', ['{']);
            }, reject, resolve);
        });
        const tx = db.transaction('store', 'readwrite');
        const finished = transactionResult(tx);
        tx.objectStore('store').put({valid: true}, 2);
        tx.objectStore('store').put(undefined, 3);
        expect(await finished).to.equal('complete');
    });

    afterEach(async function () {
        shimIndexedDB.__setConfig('DEBUG', previousDebug);
        if (db) { db.close(); }
        await requestResult(env.indexedDB.deleteDatabase(name));
        db = undefined;
    });

    it('fails the request and aborts the transaction instead of succeeding with undefined', async function () {
        shimIndexedDB.__setConfig('DEBUG', false);
        const tx = db.transaction('store');
        const finished = transactionResult(tx);
        const store = tx.objectStore('store');
        const bad = store.get(1);
        const queued = store.get(2);
        let successes = 0;
        const errors = [];
        bad.onsuccess = () => { successes++; };
        bad.onerror = (event) => {
            errors.push([bad.error.name, event.bubbles, event.cancelable, bad.readyState]);
        };
        queued.onerror = () => { errors.push([queued.error.name]); };
        expect(await finished).to.equal('abort');
        expect(successes).to.equal(0);
        expect(errors).to.deep.equal([['UnknownError', true, true, 'done'], ['AbortError']]);
        expect(tx.error).to.equal(bad.error);
        expect(bad.result).to.be.undefined;
    });

    it('continues the transaction when the decoding error is canceled', async function () {
        const tx = db.transaction('store');
        const finished = transactionResult(tx);
        const store = tx.objectStore('store');
        const bad = store.get(1);
        const good = store.get(2);
        let errorName;
        let successes = 0;
        bad.onsuccess = () => { successes++; };
        bad.onerror = (event) => {
            errorName = bad.error.name;
            event.preventDefault();
        };
        expect(await finished).to.equal('complete');
        expect(errorName).to.equal('UnknownError');
        expect(successes).to.equal(0);
        expect(good.result).to.deep.equal({valid: true});
        expect(tx.error).to.be.null;
    });

    it('preserves successful reads of valid, missing and explicitly undefined records', async function () {
        const tx = db.transaction('store');
        const finished = transactionResult(tx);
        const store = tx.objectStore('store');
        const good = store.get(2);
        const key = store.getKey(1);
        const missing = store.get(999);
        const storedUndefined = store.get(3);
        let successes = 0;
        const onSuccess = () => { successes++; };
        for (const request of [good, key, missing, storedUndefined]) {
            request.onsuccess = onSuccess;
        }
        expect(await finished).to.equal('complete');
        expect(successes).to.equal(4);
        expect(good.result).to.deep.equal({valid: true});
        expect(key.result).to.equal(1);
        expect(missing.result).to.be.undefined;
        expect(storedUndefined.result).to.be.undefined;
    });

    it('rolls back preceding writes when the decode error is not canceled', async function () {
        const tx = db.transaction('store', 'readwrite');
        const finished = transactionResult(tx);
        const store = tx.objectStore('store');
        store.put('must roll back', 4);
        const bad = store.get(1);
        bad.onerror = () => { /* Observe the default transaction abort below. */ };
        expect(await finished).to.equal('abort');
        const read = db.transaction('store');
        const readFinished = transactionResult(read);
        const missing = read.objectStore('store').get(4);
        expect(await readFinished).to.equal('complete');
        expect(missing.result).to.be.undefined;
    });
});

describe('Index and cursor reads of corrupt stored values', function () {
    if (env.isNative) { return; }

    let db;
    let name;
    let previousDebug;
    let sequence = 0;

    /**
     * @param {IDBRequest} request
     * @returns {Promise<unknown>}
     */
    function requestResult (request) {
        // eslint-disable-next-line promise/avoid-new -- Adapt the request event API.
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * @param {IDBTransaction} transaction
     * @returns {Promise<string>}
     */
    function transactionResult (transaction) {
        // eslint-disable-next-line promise/avoid-new -- Adapt the transaction event API.
        return new Promise((resolve) => {
            transaction.oncomplete = () => resolve('complete');
            transaction.onabort = () => resolve('abort');
        });
    }

    /**
     * Runs `makeRequest` against a fresh read transaction, expecting the
     * request to fail with `UnknownError` and abort the transaction.
     * @param {(store: IDBObjectStore) => IDBRequest} makeRequest
     * @returns {Promise<void>}
     */
    async function expectDecodeFailure (makeRequest) {
        const tx = db.transaction('store');
        const finished = transactionResult(tx);
        const request = makeRequest(tx.objectStore('store'));
        let successes = 0;
        let errorName;
        request.onsuccess = () => { successes++; };
        request.onerror = () => { errorName = request.error.name; };
        expect(await finished).to.equal('abort');
        expect(successes).to.equal(0);
        expect(errorName).to.equal('UnknownError');
    }

    /**
     * Corrupts the persisted value of the rows with the given SQLite rowids
     * (insertion order) through the real backing store.
     * @param {number[]} rowids
     * @returns {Promise<void>}
     */
    function corrupt (rowids) {
        // eslint-disable-next-line promise/avoid-new -- Await the actual backing SQL transaction.
        return new Promise((resolve, reject) => {
            db.__db.transaction((tx) => {
                tx.executeSql(
                    'UPDATE ' + escapeStoreNameForSQL('store') + ' SET "value" = ? WHERE rowid IN (' +
                        rowids.map(() => '?').join(', ') + ')',
                    ['{', ...rowids]
                );
            }, reject, resolve);
        });
    }

    beforeEach(async function () {
        previousDebug = shimIndexedDB.__getConfig('DEBUG');
        name = 'decode-corrupt-idx-' + Date.now() + '-' + sequence++;
        const open = env.indexedDB.open(name, 1);
        open.onupgradeneeded = () => {
            const store = open.result.createObjectStore('store');
            store.createIndex('idx', 'tag');
            store.createIndex('multi', 'tags', {multiEntry: true});
            store.put({tag: 'a', tags: ['x']}, 1);
            store.put({tag: 'b', tags: ['x']}, 2);
            store.put({tag: 'c', tags: ['x']}, 3);
        };
        db = await requestResult(open);
    });

    afterEach(async function () {
        shimIndexedDB.__setConfig('DEBUG', previousDebug);
        if (db) { db.close(); }
        await requestResult(env.indexedDB.deleteDatabase(name));
        db = undefined;
    });

    it('index.get fails with UnknownError', async function () {
        await corrupt([1, 2, 3]);
        await expectDecodeFailure((store) => store.index('idx').get('a'));
    });

    it('index.get on a multiEntry index fails with UnknownError', async function () {
        await corrupt([1, 2, 3]);
        await expectDecodeFailure((store) => store.index('multi').get('x'));
    });

    it('logs the decode failure when DEBUG is enabled', async function () {
        await corrupt([1, 2, 3]);
        shimIndexedDB.__setConfig('DEBUG', true);
        const origLog = console.log;
        console.log = () => { /* Silence verbose DEBUG output */ };
        try {
            await expectDecodeFailure((store) => store.index('idx').get('a'));
            await expectDecodeFailure((store) => store.openCursor());
        } finally {
            console.log = origLog;
        }
    });

    it('store.getAll fails with UnknownError on the first row', async function () {
        await corrupt([1]);
        await expectDecodeFailure((store) => store.getAll());
    });

    it('store.getAll fails with UnknownError on a later (prefetched) row', async function () {
        await corrupt([2]);
        await expectDecodeFailure((store) => store.getAll());
    });

    it('store.getAllRecords fails with UnknownError on a later (prefetched) row', async function () {
        await corrupt([3]);
        await expectDecodeFailure((store) => store.getAllRecords());
    });

    it('store.openCursor fails with UnknownError', async function () {
        await corrupt([1, 2, 3]);
        await expectDecodeFailure((store) => store.openCursor());
    });

    it('store.openCursor fails on continue() reaching a later (prefetched) row', async function () {
        await corrupt([3]);
        const tx = db.transaction('store');
        const finished = transactionResult(tx);
        const request = tx.objectStore('store').openCursor();
        const seen = [];
        let errorName;
        request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor) {
                return;
            }

            seen.push(cursor.key);
            cursor.continue();
        };
        request.onerror = () => { errorName = request.error.name; };
        expect(await finished).to.equal('abort');
        expect(seen).to.deep.equal([1, 2]);
        expect(errorName).to.equal('UnknownError');
    });

    it('index.openCursor fails with UnknownError', async function () {
        await corrupt([1, 2, 3]);
        await expectDecodeFailure((store) => store.index('idx').openCursor());
    });

    it('multiEntry index.openCursor fails with UnknownError', async function () {
        await corrupt([1, 2, 3]);
        await expectDecodeFailure((store) => store.index('multi').openCursor());
    });

    it('multiEntry index.openCursor fails on continue() reaching a later row', async function () {
        await corrupt([3]);
        const tx = db.transaction('store');
        const finished = transactionResult(tx);
        const request = tx.objectStore('store').index('multi').openCursor();
        const seen = [];
        let errorName;
        request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor) {
                return;
            }

            seen.push(cursor.primaryKey);
            cursor.continue();
        };
        request.onerror = () => { errorName = request.error.name; };
        expect(await finished).to.equal('abort');
        expect(seen).to.deep.equal([1, 2]);
        expect(errorName).to.equal('UnknownError');
    });

    it('index.getKey, key cursors and key-only reads still succeed', async function () {
        await corrupt([1, 2, 3]);
        const tx = db.transaction('store');
        const finished = transactionResult(tx);
        const store = tx.objectStore('store');
        const key = store.index('idx').getKey('a');
        const keys = store.getAllKeys();
        const cursorKeys = [];
        const cursorRequest = store.openKeyCursor();
        cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result;
            if (!cursor) {
                return;
            }

            cursorKeys.push(cursor.key);
            cursor.continue();
        };
        expect(await finished).to.equal('complete');
        expect(key.result).to.equal(1);
        expect(keys.result).to.deep.equal([1, 2, 3]);
        expect(cursorKeys).to.deep.equal([1, 2, 3]);
    });
});

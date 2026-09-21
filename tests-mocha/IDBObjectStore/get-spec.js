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

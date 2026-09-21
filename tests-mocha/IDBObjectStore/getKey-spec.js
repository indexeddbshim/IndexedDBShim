describe('IDBObjectStore.getKey', function () {
    const {sample} = testData;

    it('Getting a key in Object Store', function (done) {
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
                const req = objectStore.getKey(key);
                req.onsuccess = function () {
                    expect(req.result, 'Key fetched matches the key').to.equal(key);
                    objectStore.transaction.db.close();
                    done();
                };
                req.onerror = function () {
                    done(new Error('Could not get key'));
                };
            };
            addReq.onerror = function () {
                done(new Error('Could not add data'));
            };
        });
    });

    it('should throw when called with no arguments', function (done) {
        this.timeout(20000);
        testHelper.createObjectStores(undefined, (error, [objectStore]) => {
            if (error) {
                done(error);
                return;
            }
            expect(() => {
                objectStore.getKey();
            }).to.throw(TypeError);
            objectStore.transaction.db.close();
            done();
        });
    });
});

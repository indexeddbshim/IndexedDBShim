describe('IDBRequest', function () {
    'use strict';

    const {sample} = testData;

    it('should throw InvalidStateError when accessing `result`/`error` while pending, and report `readyState`', function (done) {
        this.timeout(20000);
        testHelper.createObjectStores(undefined, (error, [objectStore]) => {
            if (error) {
                done(error);
                return;
            }
            const req = objectStore.get(sample.integer());
            expect(req.readyState, 'readyState while pending').to.equal('pending');
            expect(() => req.result, '`result` while pending').to.throw(/still pending/v);
            expect(() => req.error, '`error` while pending').to.throw(/still pending/v);
            req.onsuccess = req.onerror = function () {
                expect(req.readyState, 'readyState once done').to.equal('done');
                objectStore.transaction.db.close();
                done();
            };
        });
    });

    it('should throw "Illegal constructor" when `IDBOpenDBRequest` is invoked directly', function () {
        expect(() => {
            // eslint-disable-next-line no-new -- Testing the throw
            new IDBOpenDBRequest();
        }).to.throw(TypeError, 'Illegal constructor');
    });
});

describe('collectAll (getAll/getAllKeys/getAllRecords) illegal invocation', function () {
    'use strict';

    if (!env.isNative) {
        it('should throw "Illegal invocation" when called on a non-instance', function () {
            ['getAll', 'getAllKeys', 'getAllRecords'].forEach((method) => {
                expect(() => {
                    IDBObjectStore.prototype[method].call({});
                }, 'IDBObjectStore.' + method).to.throw(TypeError, 'Illegal invocation');
                expect(() => {
                    IDBIndex.prototype[method].call({});
                }, 'IDBIndex.' + method).to.throw(TypeError, 'Illegal invocation');
            });
        });
    }
});

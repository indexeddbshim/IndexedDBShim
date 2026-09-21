describe('IDBObjectStore illegal invocation', function () {
    'use strict';

    if (!env.isNative) {
        it('should throw "Illegal invocation" when called on a non-instance', function () {
            [
                'put', 'delete', 'clear', 'count', 'openCursor', 'openKeyCursor',
                'index', 'createIndex', 'deleteIndex'
            ].forEach((method) => {
                expect(() => {
                    IDBObjectStore.prototype[method].call({});
                }, method).to.throw(TypeError, 'Illegal invocation');
            });
        });
    }
});

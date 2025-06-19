describe('IDBKeyRange', function () {
    'use strict';

    it('should expose indexedDB', function () {
        const kr = IDBKeyRange.bound(3, 6, true, false);
        expect(kr.includes(3)).equals(false);
        expect(kr.includes(4)).equals(true);
        expect(kr.includes(5)).equals(true);
        expect(kr.includes(6)).equals(true);
        expect(kr.includes(7)).equals(false);
    });
});

describe('IndexedDB API', function() {
    'use strict';

    var indexedDB;
    beforeEach(function() {
        indexedDB = env.indexedDB;
    });
    

    // Determines whether the given thing is a class
    function isAClass(thing) {
        return (typeof(thing) === 'function' ||
            (typeof(thing) === 'object' && thing.__proto__));  // jshint ignore:line
    }

    it('should expose indexedDB', function() {
        expect(indexedDB).to.be.an('object');
        expect(indexedDB).to.be.an.instanceOf(IDBFactory);
    });

    it('should expose IDBFactory', function() {
        expect(IDBFactory).to.satisfy(isAClass);
    });

    it('should expose IDBDatabase', function() {
        expect(IDBDatabase).to.satisfy(isAClass);
    });

    it('should expose IDBObjectStore', function() {
        expect(IDBObjectStore).to.satisfy(isAClass);
    });

    it('should expose IDBIndex', function() {
        expect(IDBIndex).to.satisfy(isAClass);
    });

    it('should expose IDBTransaction', function() {
        expect(IDBTransaction).to.satisfy(isAClass);
    });

    it('should expose IDBCursor', function() {
        expect(IDBCursor).to.satisfy(isAClass);
    });

    it('should expose IDBKeyRange', function() {
        expect(IDBKeyRange).to.satisfy(isAClass);
    });

    it('should expose IDBRequest', function() {
        expect(IDBRequest).to.satisfy(isAClass);
    });

    it('should expose IDBOpenDBRequest', function() {
        expect(IDBOpenDBRequest).to.satisfy(isAClass);
    });

    it('should expose IDBVersionChangeEvent', function() {
        expect(IDBVersionChangeEvent).to.satisfy(isAClass);
    });

    it('should expose DOMException', function() {
        expect(DOMException).to.satisfy(isAClass);
    });

    it('should expose DOMError', function() {
        // DOMError is private in Safari
        if (!env.browser.isSafari) {
            expect(DOMError).to.satisfy(isAClass);
        }
    });
});

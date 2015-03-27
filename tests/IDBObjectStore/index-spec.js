describe('IDBObjectStore.index', function() {
    'use strict';

    it('should return an IDBIndex', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            expect(index).to.be.an.instanceOf(IDBIndex);

            tx.oncomplete = function() {
                db.close();
                done();
            };
        });
    });

    it('should have a reference to the object store', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            expect(index.objectStore).to.equal(store);

            tx.oncomplete = function() {
                db.close();
                done();
            };
        });
    });

    it('should throw an error if called without params', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            try {
                store.index();
            }
            catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.name).to.equal('TypeError');

            tx.oncomplete = function() {
                db.close();
                done();
            };
        });
    });

    it('should throw an error if an invalid index name is given', function(done) {
        util.createDatabase('inline', 'inline-index', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            try {
                store.index('foobar');
            }
            catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(env.DOMException);
            expect(err.name).to.equal('NotFoundError');

            tx.oncomplete = function() {
                db.close();
                done();
            };
        });
    });
});

/* eslint-disable no-var */
describe('IDBObjectStore.index', function () {
    'use strict';

    it('should return an IDBIndex', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            expect(index).to.be.an.instanceOf(IDBIndex);

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });

    it('should return the same IDBIndex instance within a transaction but not otherwise', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            var index2 = store.index('inline-index');
            expect(index).to.equal(index2);

            var tx2 = db.transaction('inline', 'readwrite');
            tx2.onerror = done;

            var store2 = tx2.objectStore('inline');
            var index3 = store2.index('inline-index');

            expect(index).to.not.equal(index3);

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });

    it('should have a reference to the object store', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var index = store.index('inline-index');
            expect(index.objectStore).to.equal(store);

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });

    it('should throw an error if called without params', function (done) {
        this.timeout(5000);
        util.createDatabase('inline', 'inline-index', function (err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            try {
                store.index();
            } catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.name).to.equal('TypeError');

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });

    it('should throw an error if an invalid index name is given', function (done) {
        util.createDatabase('inline', 'inline-index', function (err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            try {
                store.index('foobar');
            } catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(env.DOMException);
            expect(err.name).to.equal('NotFoundError');

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });
});

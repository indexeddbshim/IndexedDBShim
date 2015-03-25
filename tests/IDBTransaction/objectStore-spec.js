describe('IDBTransaction.objectStore', function() {
    "use strict";

    it('should return an IDBObjectStore', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readonly');
            var store = tx.objectStore('inline');

            expect(store).to.be.an.instanceOf(IDBObjectStore);

            db.close();
            done();
        });
    });

    it('should have a reference to the transaction', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readonly');
            var store = tx.objectStore('inline');

            expect(store.transaction).to.equal(tx);

            db.close();
            done();
        });
    });

    it('should throw an error if called without params', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readonly');

            try {
                tx.objectStore();
            }
            catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.name).to.equal('TypeError');

            db.close();
            done();
        });
    });

    it('should throw an error if an invalid store name is given', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readonly');

            try {
                tx.objectStore('foobar');
            }
            catch (e) {
                err = e;
            }

                expect(err).to.be.an('object');
            expect(err.name).to.equal('NotFoundError');

                if (!env.browser.isIE) {
                    // IE's DOMException doesn't inherit from Error
                    expect(err).to.be.an.instanceOf(Error);
                }

            db.close();
            done();
        });
    });

    it('should throw an error if the transaction is closed', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');

            setTimeout(function() {
                try {
                    tx.objectStore('out-of-line-generated');
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an('object');

                if (!env.browser.isIE) {
                    // IE's DOMException doesn't inherit from Error
                    expect(err).to.be.an.instanceOf(Error);
                    expect(err.name).to.equal('InvalidStateError');
                }

                db.close();
                done();
            }, 50);
        });
    });
});

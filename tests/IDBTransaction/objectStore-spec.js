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

            expect(err).to.be.an.instanceOf(env.DOMException);
            expect(err.name).to.equal('NotFoundError');

            db.close();
            done();
        });
    });

    it('should throw an error if the object store is not in the transaction', function(done) {
        util.createDatabase('inline', 'inline-generated', 'out-of-line', function(err, db) {
            // Transaction only includes one of the three stores
            var tx = db.transaction('inline-generated');
            expect(tx.objectStore('inline-generated')).to.be.an.instanceOf(IDBObjectStore);

            // These two stores aren't part of the transaction
            tryToOpen('inline');
            tryToOpen('out-of-line');

            function tryToOpen(store) {
                var err = null;
                try {
                    tx.objectStore(store);
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an.instanceOf(env.DOMException);
                expect(err.name).to.equal('NotFoundError');
            }

            db.close();
            done();
        });
    });

    it('should throw an error if the object store is not in the multi-store transaction', function(done) {
        if (env.browser.isSafari) {
            // BUG: Safari does not support opening multiple object stores
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline', 'inline-generated', 'out-of-line', function(err, db) {
            // Transaction only includes two of the three stores
            var tx = db.transaction(['inline', 'out-of-line']);
            expect(tx.objectStore('inline')).to.be.an.instanceOf(IDBObjectStore);
            expect(tx.objectStore('out-of-line')).to.be.an.instanceOf(IDBObjectStore);

            // This store isn't part of the transaction
            try {
                tx.objectStore('inline-generated');
            }
            catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(env.DOMException);
            expect(err.name).to.equal('NotFoundError');

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

                expect(err).to.be.an.instanceOf(env.DOMException);
                if (!env.browser.isIE) {
                    expect(err.name).to.equal('InvalidStateError');     // IE is "TransactionInactiveError"
                }

                db.close();
                done();
            }, 50);
        });
    });
});

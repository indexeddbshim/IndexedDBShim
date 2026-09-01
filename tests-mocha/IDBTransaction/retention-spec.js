describe('IDBTransaction retention', function () {
    'use strict';

    /**
     * Runs assertions off the event loop, reporting any failure through
     *   `done` rather than throwing into a `setTimeout`, which this suite's
     *   `window.onerror` shim turns into unbounded recursion.
     * @param {IDBDatabase} db
     * @param {() => void} done
     * @param {() => void} assertions
     * @returns {void}
     */
    function assertLater (db, done, assertions) {
        setTimeout(function () {
            let error = null;
            try {
                assertions();
            } catch (err) {
                error = err;
            }
            db.close();
            done(error);
        }, 0);
    }

    it('should remove a completed transaction from the connection', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            tx.objectStore('inline').put({id: 1, name: 'John Doe'});

            tx.oncomplete = function () {
                assertLater(db, done, function () {
                    expect(db.__transactions).to.not.include(tx);
                    expect(tx.__requests).to.have.lengthOf(0);
                });
            };
        });
    });

    it('should remove an aborted transaction from the connection', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readwrite');
            tx.objectStore('inline').put({id: 1, name: 'John Doe'});

            tx.onabort = function () {
                assertLater(db, done, function () {
                    expect(db.__transactions).to.not.include(tx);
                    expect(tx.__requests).to.have.lengthOf(0);
                });
            };
            tx.abort();
        });
    });

    it('should not accumulate transactions on a long-lived connection', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            let remaining = 5;

            /**
             * @returns {void}
             */
            function next () {
                if (remaining === 0) {
                    assertLater(db, done, function () {
                        expect(db.__transactions).to.have.lengthOf(0);
                    });
                    return;
                }
                remaining--;
                const tx = db.transaction('inline', 'readwrite');
                tx.objectStore('inline').put({id: remaining, name: 'John Doe'});
                tx.oncomplete = function () {
                    setTimeout(next, 0);
                };
            }
            next();
        });
    });
});

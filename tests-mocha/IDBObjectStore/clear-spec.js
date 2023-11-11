/* eslint-env mocha */
/* globals expect, sinon, util, env */
/* eslint-disable no-var */
describe('IDBObjectStore.clear', function () {
    'use strict';

    it('should return an IDBRequest', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var clear = store.clear();
            expect(clear).to.be.an.instanceOf(IDBRequest);

            tx.oncomplete = function () {
                db.close();
                done();
            };
        });
    });

    it('should pass the IDBRequest event to the onsuccess callback', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var clear = store.clear();
            clear.onerror = done;

            clear.onsuccess = sinon.spy(function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(clear);
            });

            tx.oncomplete = function () {
                sinon.assert.calledOnce(clear.onsuccess);
                db.close();
                done();
            };
        });
    });

    it('should set the IDBRequest.result to undefined', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            var clear = store.clear();

            clear.onsuccess = sinon.spy(function () {
                expect(clear.result).equal(undefined);
            });

            tx.oncomplete = function () {
                sinon.assert.calledOnce(clear.onsuccess);
                db.close();
                done();
            };
        });
    });

    it('should clear all records', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var allData, clearedData, clear;
            var tx = db.transaction('inline', 'readwrite');
            var store = tx.objectStore('inline');
            tx.onerror = done;

            store.add({id: 1});
            store.add({id: 2});
            store.add({id: 3});
            store.add({id: 4});
            store.add({id: 5});

            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;

                clear = store.clear();
                clear.onerror = done;
                clear.onsuccess = sinon.spy();

                util.getAll(store, function (err, data) {
                    if (err) {
                        expect(function () { throw err; }).to.not.throw(Error);
                        done();
                        return;
                    }
                    clearedData = data;
                });
            });

            tx.oncomplete = function () {
                // Make sure all 5 records existed before the clear
                expect(allData).to.have.same.deep.members([
                    {primaryKey: 1, key: 1, value: {id: 1}},
                    {primaryKey: 2, key: 2, value: {id: 2}},
                    {primaryKey: 3, key: 3, value: {id: 3}},
                    {primaryKey: 4, key: 4, value: {id: 4}},
                    {primaryKey: 5, key: 5, value: {id: 5}}
                ]);

                // Make sure all data was cleared
                sinon.assert.calledOnce(clear.onsuccess);
                expect(clearedData).to.have.lengthOf(0);

                db.close();
                done();
            };
        });
    });

    it('should clear all records from previous transactions', function (done) {
        this.timeout(5000);
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var allData, clearedData, cleared = sinon.spy();

            transaction1();

            /**
             * @returns {void}
             */
            function transaction1 () {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = transaction2;

                store.add({id: 1});
                store.add({id: 2});
                store.add({id: 3});
            }

            /**
             * @returns {void}
             */
            function transaction2 () {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = transaction3;

                store.add({id: 4});
                store.add({id: 5});

                util.getAll(store, function (err, data) {
                    if (err) {
                        expect(function () { throw err; }).to.not.throw(Error);
                        done();
                        return;
                    }
                    allData = data;
                });
            }

            /**
             * @returns {void}
             */
            function transaction3 () {
                var tx = db.transaction('inline', 'readwrite');
                var store = tx.objectStore('inline');
                tx.onerror = done;
                tx.oncomplete = checkResults;

                var clear = store.clear();
                clear.onerror = done;
                clear.onsuccess = cleared;

                util.getAll(store, function (err, data) {
                    if (err) {
                        expect(function () { throw err; }).to.not.throw(Error);
                        done();
                        return;
                    }
                    clearedData = data;
                });
            }

            /**
             * @returns {void}
             */
            function checkResults () {
                // Make sure all 5 records existed before the clear
                expect(allData).to.have.same.deep.members([
                    {primaryKey: 1, key: 1, value: {id: 1}},
                    {primaryKey: 2, key: 2, value: {id: 2}},
                    {primaryKey: 3, key: 3, value: {id: 3}},
                    {primaryKey: 4, key: 4, value: {id: 4}},
                    {primaryKey: 5, key: 5, value: {id: 5}}
                ]);

                // Make sure all data was cleared
                sinon.assert.calledOnce(cleared);
                expect(clearedData).to.have.lengthOf(0);

                db.close();
                done();
            }
        });
    });

    it('should throw an error if the transaction is read-only', function (done) {
        util.createDatabase('out-of-line-generated', function (err, db) {
            var tx = db.transaction('out-of-line-generated', 'readonly');
            var store = tx.objectStore('out-of-line-generated');

            try {
                store.clear();
            } catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(env.DOMException);
            expect(err.name).to.equal('ReadOnlyError');

            db.close();
            done();
        });
    });

    it('should throw an error if the transaction is closed', function (done) {
        util.createDatabase('out-of-line-generated', function (err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            var store = tx.objectStore('out-of-line-generated');

            setTimeout(function () {
                try {
                    store.clear();
                } catch (e) {
                    err = e;
                }

                expect(err).to.be.an.instanceOf(env.DOMException);
                expect(err.name).to.equal('TransactionInactiveError');

                db.close();
                done();
            }, env.transactionDuration);
        });
    });
});

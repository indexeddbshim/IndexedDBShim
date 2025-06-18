/* eslint-env mocha */
/* globals expect, sinon, util, env */
describe('IDBFactory.deleteDatabase', function () {
    'use strict';
    this.timeout(5000);

    let indexedDB;
    beforeEach(function () {
        indexedDB = env.indexedDB;
    });

    it('should return an IDBOpenDBRequest', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            db.close();
            const del = indexedDB.deleteDatabase(db.name);

            expect(del).to.be.an.instanceOf(IDBOpenDBRequest);
            done();
        });
    });

    it('should return an IDBOpenDBRequest, even if the database doesn\'t exist', function (done) {
        const del = indexedDB.deleteDatabase('foobar');
        expect(del).to.be.an.instanceOf(IDBOpenDBRequest);

        del.onerror = sinon.spy();
        del.onsuccess = function () {
            sinon.assert.notCalled(del.onerror);
            done();
        };
    });

    it('should pass an IDBVersionChangeEvent to the onsuccess event', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            db.close();
            const del = indexedDB.deleteDatabase(db.name);

            del.onsuccess = function (event) {
                if (env.isShimmed || (!env.browser.isIE && !env.browser.isSafari)) {
                    expect(event).to.be.an.instanceOf('ShimEvent' in window ? window.ShimEvent : Event); // IE and Safari use a normal event
                }
                done();
            };
        });
    });

    it('should pass the IDBOpenDBRequest to the onsuccess event', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            db.close();
            const del = indexedDB.deleteDatabase(db.name);

            del.onsuccess = function (event) {
                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(del);
                done();
            };
        });
    });

    it('should set IDBOpenDBRequest.result to undefined', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            db.close();
            const del = indexedDB.deleteDatabase(db.name);

            del.onsuccess = function () {
                expect(del.result).equal(undefined);
                done();
            };
        });
    });

    it('should delete the database', function (done) {
        util.generateDatabaseName(function (err, name) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            // Create version 5 of the database
            indexedDB.open(name, 5).onsuccess = function (event) {
                const db = event.target.result;
                expect(db.version).to.equal(5);
                db.close();

                // Delete the database
                indexedDB.deleteDatabase(name).onsuccess = function () {
                    // Create version 3 of the database.
                    indexedDB.open(name, 3).onsuccess = function (event) {
                        const db = event.target.result;
                        expect(db.version).to.equal(3);

                        db.close();
                        done();
                    };
                };
            };
        });
    });

    it('should fire the onblocked event if the database is open', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            let alreadyDone = false;
            const del = indexedDB.deleteDatabase(db.name);
            del.onerror = sinon.spy();

            // It will either be blocked, or it will delete successfully
            del.onsuccess = del.onblocked = function (event) {
                sinon.assert.notCalled(del.onerror);

                expect(event).to.be.an.instanceOf(env.Event);
                expect(event.target).to.equal(del);

                if (!alreadyDone) {
                    alreadyDone = true;
                    db.close();
                    done();
                }
            };
        });
    });

    it('should allow all of these parameter types', function (done) {
        let deletingCounter = 0, deletedCounter = 0;
        if (window.shimIndexedDB) {
            window.shimIndexedDB.__setConfig({databaseNameLengthLimit: util.sampleData.veryLongString.length + 100});
        }

        deleteDatabase(undefined);
        deleteDatabase('');
        deleteDatabase(util.sampleData.veryLongString);
        deleteDatabase(42);
        deleteDatabase(-0.331);
        deleteDatabase(Number.POSITIVE_INFINITY);
        deleteDatabase(Number.NEGATIVE_INFINITY);
        deleteDatabase(Number.NaN);
        deleteDatabase([]);
        deleteDatabase(['a', 'b', 'c']);
        deleteDatabase(new Date());
        deleteDatabase({foo: 'bar'});
        deleteDatabase(/^regex$/);

        if (env.isShimmed || !env.browser.isIE) {
            deleteDatabase(null);
        }

        /**
         * @param {string} name
         * @returns {void}
         */
        function deleteDatabase (name) {
            deletingCounter++;
            const del = indexedDB.deleteDatabase(name);
            del.onerror = sinon.spy();
            del.onsuccess = function () {
                sinon.assert.notCalled(del.onerror);

                if (++deletedCounter === deletingCounter) {
                    done();
                }
            };
        }
    });

    it('should throw an error if called without params', function () {
        let err;
        try {
            indexedDB.deleteDatabase();
        } catch (e) {
            err = e;
        }

        expect(err).to.be.an.instanceOf(TypeError);
        expect(err.name).to.equal('TypeError');
    });
});

describe('IDBFactory.deleteDatabase', function() {
    'use strict';

    var indexedDB = env.indexedDB;

    it('should return an IDBOpenDBRequest', function(done) {
        util.createDatabase('inline', function(err, db) {
            db.close();
            var del = indexedDB.deleteDatabase(db.name);

            expect(del).to.be.an.instanceOf(IDBOpenDBRequest);
            done();
        });
    });

    it('should return an IDBOpenDBRequest, even if the database doesn\'t exist', function(done) {
        var del = indexedDB.deleteDatabase('foobar');
        expect(del).to.be.an.instanceOf(IDBOpenDBRequest);

        del.onerror = sinon.spy();
        del.onsuccess = function() {
            sinon.assert.notCalled(del.onerror);
            done();
        };
    });

    it('should pass an IDBVersionChangeEvent to the onsuccess event', function(done) {
        util.createDatabase('inline', function(err, db) {
            db.close();
            var del = indexedDB.deleteDatabase(db.name);

            del.onsuccess = function(event) {
                expect(event).to.be.an.instanceOf(Event);
                if (!env.browser.isIE && !env.browser.isSafari) {
                    expect(event).to.be.an.instanceOf(IDBVersionChangeEvent);
                }
                done();
            };
        });
    });

    it('should pass the IDBOpenDBRequest to the onsuccess event', function(done) {
        util.createDatabase('inline', function(err, db) {
            db.close();
            var del = indexedDB.deleteDatabase(db.name);

            del.onsuccess = function(event) {
                expect(event.target).to.equal(del);
                done();
            };
        });
    });

    it('should set IDBOpenDBRequest.result to undefined', function(done) {
        util.createDatabase('inline', function(err, db) {
            db.close();
            var del = indexedDB.deleteDatabase(db.name);

            del.onsuccess = function() {
                expect(del.result).to.be.undefined;
                done();
            };
        });
    });

    it('should delete the database', function(done) {
        util.generateDatabaseName(function(err, name) {
            // Create version 5 of the database
            indexedDB.open(name, 5).onsuccess = function(event) {
                var db = event.target.result;
                expect(db.version).to.equal(5);
                db.close();

                // Delete the database
                indexedDB.deleteDatabase(name).onsuccess = function() {

                    // Create version 3 of the database.
                    indexedDB.open(name, 3).onsuccess = function(event) {
                        var db = event.target.result;
                        expect(db.version).to.equal(3);

                        db.close();
                        done();
                    };
                };
            };
        });
    });

    it('should fire the onblocked event if the database is open', function(done) {
        util.createDatabase('inline', function(err, db) {
            var del = indexedDB.deleteDatabase(db.name);
            del.onerror = sinon.spy();
            del.onsuccess = sinon.spy();

            del.onblocked = function(event) {
                sinon.assert.notCalled(del.onerror);
                sinon.assert.notCalled(del.onsuccess);

                expect(event.target).to.equal(del);

                db.close();
                done();
            };
        });
    });

    it('should throw an error if called without params', function() {
        var err;
        try {
            indexedDB.deleteDatabase();
        }
        catch (e) {
            err = e;
        }

        expect(err).to.be.an.instanceOf(TypeError);
        expect(err.name).to.equal('TypeError');
    });
});

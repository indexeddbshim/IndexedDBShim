describe('IDBDatabase.close', function() {
    'use strict';

    it('should return void', function(done) {
        util.createDatabase('inline', function(err, db) {
            var result = db.close();
            expect(result).to.be.undefined;
            done();
        });
    });

    it('should wait for a transaction to complete first', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            tx.onerror = function(event) {
                done(event.target.error);
            };

            db.close();

            var store = tx.objectStore('out-of-line-generated');
            var put = store.put({foo: 'bar'});
            put.onsuccess = sinon.spy();

            tx.oncomplete = function() {
                sinon.assert.calledOnce(put.onsuccess);

                done();
            };
        });
    });

    it('should do nothing if the database is already closed', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            db.close();

            setTimeout(function() {
                db.close();
                done();
            }, 50);
        });
    });

    it('should do nothing if called multiple times', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            db.close();
            db.close();
            db.close();
            db.close();
            done();
        });
    });

    it('should ignore any parameters', function(done) {
        util.createDatabase(function(err, db) {
            db.close('foobar');
            db.close({foo: 'bar'});
            db.close(db);
            db.close(null);
            done();
        });
    });
});

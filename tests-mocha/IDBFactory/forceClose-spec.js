describe('IDBFactory.__forceClose dispatch', function () {
    'use strict';

    if (env.isNative) {
        return;
    }

    it('should throw when given a non-numeric connection index', function (done) {
        this.timeout(20000);
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                done(err);
                return;
            }
            expect(() => {
                env.indexedDB.__forceClose(db.name, 'not-a-number');
            }).to.throw(TypeError, 'numeric index');
            db.close();
            done();
        });
    });

    it('should log rather than throw for an unrecognized database name', function (done) {
        this.timeout(20000);
        expect(() => {
            env.indexedDB.__forceClose('a-db-name-that-was-never-opened');
        }).to.not.throw();
        done();
    });

    it('should close a specific connection by index, leaving others open', function (done) {
        this.timeout(20000);
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                done(err);
                return;
            }
            const dbName = db.name;
            const secondOpenReq = env.indexedDB.open(dbName);
            secondOpenReq.onerror = function () {
                done(new Error('Could not open second connection'));
            };
            secondOpenReq.onsuccess = function () {
                const db2 = secondOpenReq.result;
                let db1Closed = false;
                db.onclose = function () {
                    db1Closed = true;
                };
                let db2Closed = false;
                db2.onclose = function () {
                    db2Closed = true;
                };

                // The first-opened connection (`db`) is always at index 0.
                env.indexedDB.__forceClose(dbName, 0);

                setTimeout(function () {
                    expect(db1Closed, 'first connection force-closed').to.equal(true);
                    expect(db2Closed, 'second connection left open').to.equal(false);
                    db2.close();
                    done();
                }, 50);
            };
        });
    });

    it('should close every connection when no database name is given', function (done) {
        this.timeout(20000);
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                done(err);
                return;
            }
            let closed = false;
            db.onclose = function () {
                closed = true;
            };

            env.indexedDB.__forceClose();

            setTimeout(function () {
                expect(closed, 'connection force-closed when closing all').to.equal(true);
                done();
            }, 50);
        });
    });
});

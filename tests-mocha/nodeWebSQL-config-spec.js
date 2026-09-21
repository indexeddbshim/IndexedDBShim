describe('nodeWebSQL driver configuration', function () {
    'use strict';
    this.timeout(20000);

    it('should apply sqlBusyTimeout/sqlTrace/sqlProfile to a newly-opened SQLite connection', function (done) {
        if (!env.isShimmed || !window.shimIndexedDB) {
            // These `nodeWebSQL`-specific options only apply to the Node SQLite driver.
            done();
            return;
        }

        let traceCalled = false;
        let profileCalled = false;
        window.shimIndexedDB.__setConfig({
            sqlBusyTimeout: 2000,
            sqlTrace () { traceCalled = true; },
            sqlProfile () { profileCalled = true; }
        });

        util.createDatabase('out-of-line', function (err, db) {
            window.shimIndexedDB.__setConfig({sqlBusyTimeout: 0, sqlTrace: null, sqlProfile: null}); // reset
            if (err) {
                done(err);
                return;
            }
            db.close();
            // `trace`/`profile` fire per SQL statement SQLite executes, and
            //   creating the database and its object store above runs at
            //   least one by the time this callback is reached.
            expect(traceCalled, 'sqlTrace callback invoked').to.equal(true);
            expect(profileCalled, 'sqlProfile callback invoked').to.equal(true);
            done();
        });
    });
});

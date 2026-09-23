describe('Aborting an upgrade transaction', function () {
    'use strict';

    it('should revert the database version and discard schema changes', function (done) {
        this.timeout(20000);
        util.generateDatabaseName(function (err, dbName) {
            if (err) {
                done(err);
                return;
            }

            const open1 = env.indexedDB.open(dbName, 1);
            open1.onupgradeneeded = function () {
                open1.result.createObjectStore('s1');
            };
            open1.onerror = function () {
                done(new Error('Could not open database at version 1'));
            };
            open1.onsuccess = function () {
                expect(open1.result.version, 'opened at version 1').to.equal(1);
                open1.result.close();

                const open2 = env.indexedDB.open(dbName, 2);
                open2.onupgradeneeded = function (e) {
                    expect(e.oldVersion, 'oldVersion reported to upgradeneeded').to.equal(1);
                    open2.result.createObjectStore('s2');
                    // Deliberately abort mid-upgrade: the version bump and
                    //   new object store should both be rolled back.
                    open2.transaction.abort();
                };
                open2.onsuccess = function () {
                    done(new Error('Open at version 2 should have failed after the abort'));
                };
                open2.onblocked = function () {
                    done(new Error('Open at version 2 should not have been blocked'));
                };
                open2.onerror = function (e) {
                    expect(e.target.error, 'open2 error').to.exist;
                    expect(e.target.error.name, 'open2 error name').to.equal('AbortError');

                    // Re-open without a version to confirm the revert stuck.
                    const open3 = env.indexedDB.open(dbName);
                    open3.onupgradeneeded = function () {
                        done(new Error('Version should have reverted to 1; no upgrade should be needed'));
                    };
                    open3.onsuccess = function () {
                        const db3 = open3.result;
                        expect(db3.version, 'version reverted to 1').to.equal(1);
                        expect([...db3.objectStoreNames], 'only the original store remains').to.deep.equal(['s1']);
                        db3.close();
                        done();
                    };
                    open3.onerror = function () {
                        done(new Error('Could not re-open database to verify reverted version'));
                    };
                };
            };
        });
    });

    it('should revert an object store rename when the upgrade transaction is aborted', function (done) {
        this.timeout(20000);
        util.generateDatabaseName(function (err, dbName) {
            if (err) {
                done(err);
                return;
            }

            const open1 = env.indexedDB.open(dbName, 1);
            open1.onupgradeneeded = function () {
                open1.result.createObjectStore('s1');
            };
            open1.onerror = function () {
                done(new Error('Could not open database at version 1'));
            };
            open1.onsuccess = function () {
                open1.result.close();

                const open2 = env.indexedDB.open(dbName, 2);
                open2.onupgradeneeded = function () {
                    open2.transaction.objectStore('s1').name = 's1-renamed';
                    // Deliberately abort mid-upgrade: the rename should be
                    //   rolled back along with the version bump.
                    open2.transaction.abort();
                };
                open2.onsuccess = function () {
                    done(new Error('Open at version 2 should have failed after the abort'));
                };
                open2.onblocked = function () {
                    done(new Error('Open at version 2 should not have been blocked'));
                };
                open2.onerror = function (e) {
                    expect(e.target.error, 'open2 error').to.exist;
                    expect(e.target.error.name, 'open2 error name').to.equal('AbortError');

                    // Re-open without a version to confirm the rename reverted.
                    const open3 = env.indexedDB.open(dbName);
                    open3.onupgradeneeded = function () {
                        done(new Error('Version should have reverted to 1; no upgrade should be needed'));
                    };
                    open3.onsuccess = function () {
                        const db3 = open3.result;
                        expect([...db3.objectStoreNames], 'object store name reverted').to.deep.equal(['s1']);
                        db3.close();
                        done();
                    };
                    open3.onerror = function () {
                        done(new Error('Could not re-open database to verify reverted rename'));
                    };
                };
            };
        });
    });
});

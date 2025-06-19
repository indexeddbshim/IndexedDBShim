/* eslint-disable n/no-sync -- Ok for testing  */
import fs from 'fs';
import * as chai from 'chai';

global.window = global;
window.chai = chai;

const {expect, assert} = window.chai;

describe('database config', function () {
    // eslint-disable-next-line sonarjs/assertions-in-tests -- Has them
    it('should not err in cleaning up memory database resources', async function (done) {
        const setGlobalVars = (await import('../dist/indexeddbshim-node.cjs')).default;

        setGlobalVars(null, {
            DEBUG: false,
            memoryDatabase: ':memory:',
            checkOrigin: false
        });
        const open = indexedDB.open('my_db', 1);
        open.onerror = () => {
            assert.isOk(false, 'Error opening database');
            done();
        };
        open.onsuccess = () => {
            const db = open.result;
            db.close();
            const delReq = indexedDB.deleteDatabase('my_db');
            delReq.onerror = () => {
                assert.isOk(false, 'Error deleting database');
            };
            delReq.onsuccess = () => {
                done();
            };
        };
    });

    it('should respect the `databaseBasePath` setting for deletions', async function (done) {
        const setGlobalVars = (await import('../dist/indexeddbshim-node.cjs')).default;

        if (!fs.existsSync('foo')) {
            fs.mkdirSync('foo');
        }

        setGlobalVars(null, {
            DEBUG: false,
            databaseBasePath: 'foo',
            checkOrigin: false
        });

        const open = indexedDB.open('my_db', 1);
        open.onerror = () => {
            assert.isOk(false, 'Error opening database');
            done();
        };
        open.onsuccess = () => {
            const db = open.result;
            db.close();

            const delReq = indexedDB.deleteDatabase('my_db');
            delReq.onerror = () => {
                assert.isOk(false, 'Error deleting database');
            };
            delReq.onsuccess = () => {
                fs.readdir('foo', (err, files) => {
                    expect(err, 'Should be no read directory error').to.be.null;
                    expect(files.length, 'Should be no files remaining').to.equal(0);
                    fs.rmdir('foo', (err) => {
                        expect(err, 'Should be no error removing test directory').to.be.null;
                        done();
                    });
                });
            };
            delReq.onerror = () => {
                assert.isOk(false, 'Error deleting database');
                done();
            };
        };
    });
});

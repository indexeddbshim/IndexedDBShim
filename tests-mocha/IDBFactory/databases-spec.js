/* eslint-env mocha */
/* globals testData, expect */
/* eslint-disable no-var, no-unused-expressions */

describe('IDBFactory.databases', function () {
    it('databases', function () {
        if (!window.indexedDB.databases) {
            expect(
                false,
                'Database does not support IDBFactory.prototype.databases()'
            ).to.be.true;
            return undefined;
        }
        let db;
        return openDb().then((_db) => {
            db = _db;
            return window.indexedDB.databases();
        }).then(function (info) {
            expect(
                info,
                'Database list successfully found'
            ).to.have.lengthOf.at.least(1);
            var found = info.some(function (inf) {
                return inf.name === testData.DB.NAME && inf.version === 1;
            });
            expect(
                found,
                'Database list successfully matched earlier-added database'
            ).to.be.true;
            db.close();
            return undefined;
        }).catch(function () {
            expect(
                false,
                'Unexpected error retrieving indexedDB.databases().'
            ).to.be.true;
        });
    });
});
function openDb () {
    window.indexedDB.deleteDatabase(testData.DB.NAME);
    var dbOpenRequest = window.indexedDB.open(testData.DB.NAME);
    // eslint-disable-next-line promise/avoid-new
    return new Promise((resolve, reject) => {
        dbOpenRequest.onsuccess = function (e) {
            var db = dbOpenRequest.result;
            resolve(db);
        };
        dbOpenRequest.onerror = function (e) {
            expect(false, 'Database NOT Opened successfully').to.be.true;
            reject(e);
        };
    });
}

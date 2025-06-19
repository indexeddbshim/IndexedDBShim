describe('IDBObjectStore.indexNames', function () {
    it('Check index exists after reopening database', function (done) {
        testHelper.createIndexes((error, [objectStore, db]) => {
            if (error) {
                done(error);
                return;
            }
            expect(objectStore.indexNames, '2 Indexes on still exist').to.have.lengthOf(2);
            db.close();
            done();
        });
    });
});

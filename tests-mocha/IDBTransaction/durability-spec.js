describe('IDBTransaction.durability', function () {
    'use strict';

    it('should default to "default" when no options are given', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            const tx = db.transaction('inline', 'readonly');

            expect(tx.durability).to.equal('default');

            db.close();
            done();
        });
    });

    ['default', 'strict', 'relaxed'].forEach(function (durability) {
        it('should reflect a "' + durability + '" durability option', function (done) {
            util.createDatabase('inline', function (err, db) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                const tx = db.transaction('inline', 'readonly', {durability});

                expect(tx.durability).to.equal(durability);

                db.close();
                done();
            });
        });
    });

    it('should throw an error for an invalid durability value', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            try {
                db.transaction('inline', 'readonly', {durability: 'bogus'});
            } catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);

            db.close();
            done();
        });
    });
});

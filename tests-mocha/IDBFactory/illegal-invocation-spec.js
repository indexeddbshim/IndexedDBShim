describe('IDBFactory illegal invocation', function () {
    'use strict';

    if (!env.isNative) {
        it('should throw "Illegal invocation" when a synchronous method is called on a non-instance', function () {
            expect(() => {
                IDBFactory.prototype.open.call({});
            }, 'open').to.throw(TypeError, 'Illegal invocation');
            expect(() => {
                IDBFactory.prototype.deleteDatabase.call({}, 'x');
            }, 'deleteDatabase').to.throw(TypeError, 'Illegal invocation');
            expect(() => {
                IDBFactory.prototype.cmp.call({}, 1, 2);
            }, 'cmp').to.throw(TypeError, 'Illegal invocation');
        });

        it('should reject with "Illegal invocation" when `databases()` is called on a non-instance', async function () {
            try {
                await IDBFactory.prototype.databases.call({});
                throw new Error('Expected `databases()` to reject');
            } catch (err) {
                expect(err).to.be.instanceOf(TypeError);
                expect(err.message).to.equal('Illegal invocation');
            }
        });
    }
});

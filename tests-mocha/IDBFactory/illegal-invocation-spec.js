describe('IDBFactory illegal invocation', function () {
    'use strict';

    if (env.isNative) {
        return;
    }

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
});

describe('IDBFactory SecurityError', function () {
    'use strict';
    if (env.isNative) {
        return;
    }

    it('should reject with SecurityError when databases() is called from an opaque origin', async function () {
        const checkOrigin = shimIndexedDB.__getConfig('checkOrigin');
        const oldLocation = global.location;
        global.location = { origin: 'null' };
        shimIndexedDB.__setConfig('checkOrigin', true);
        try {
            await shimIndexedDB.databases();
            throw new Error('Expected databases() to reject');
        } catch (err) {
            expect(err.name).to.equal('SecurityError');
        } finally {
            shimIndexedDB.__setConfig('checkOrigin', checkOrigin);
            global.location = oldLocation;
        }
    });
});

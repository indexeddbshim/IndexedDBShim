describe('CFG', function () {
    'use strict';

    it('should validate `memoryDatabase` values', async function () {
        // A fresh, isolated module instance is imported here (via a
        //   cache-busting query string) rather than reusing the shared
        //   `CFG` singleton also used by the IndexedDB shim already running
        //   in this suite -- setting `memoryDatabase` on that shared
        //   instance would switch every later test over to an in-memory
        //   SQLite database.
        const {default: CFG} = await import('../src/CFG.js?isolated-cfg-test');

        expect(() => {
            CFG.memoryDatabase = 'not-a-valid-value';
        }).to.throw(TypeError, /memoryDatabase/v);

        expect(() => {
            CFG.memoryDatabase = ':memory:';
        }).to.not.throw();
        expect(CFG.memoryDatabase).to.equal(':memory:');

        expect(() => {
            CFG.memoryDatabase = '';
        }).to.not.throw();

        expect(() => {
            CFG.memoryDatabase = 'file::memory:?cache=shared#frag';
        }).to.not.throw();

        // `null`/`undefined` are accepted unconditionally, as an explicit
        //   way to reset back to the unset/disabled state -- unlike other
        //   values here, no string round-trips back to "disabled", since
        //   even the empty string is its own distinct in-memory mode.
        expect(() => {
            CFG.memoryDatabase = null;
        }).to.not.throw();
        expect(CFG.memoryDatabase).to.be.null;

        expect(() => {
            CFG.memoryDatabase = undefined;
        }).to.not.throw();
        expect(CFG.memoryDatabase).to.be.undefined;
    });
});

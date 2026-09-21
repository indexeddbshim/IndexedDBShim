describe('Sca.register', function () {
    'use strict';

    it('should invoke the registration callback and install its returned preset', async function () {
        // A fresh, isolated module instance is imported here (via a
        //   cache-busting query string) rather than reusing the shared
        //   `Sca` module also used by the IndexedDB shim already running in
        //   this suite -- `register` replaces the module-level `typeson`
        //   instance used for *all* structured cloning, so calling it on
        //   the shared instance would affect every later test's cloning.
        const Sca = await import('../src/Sca.js?isolated-sca-test');

        let called = false;
        Sca.register((preset) => {
            called = true;
            return preset;
        });
        expect(called, 'the registration callback was invoked').to.equal(true);

        // The newly-registered `typeson` instance should still clone plain
        //   values correctly.
        expect(Sca.clone({foo: 'bar'})).to.deep.equal({foo: 'bar'});
    });
});

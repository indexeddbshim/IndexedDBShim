import {clone} from '../src/Sca.js';

describe('Sca FileList cloning without a native/polyfilled `FileList`', function () {
    'use strict';

    it('should round-trip a duck-typed, empty FileList-like value', function () {
        // typeson-registry's own `filelist` type (which `Sca.js`'s
        //   `customFileList` wraps and falls back to whenever `FileList`
        //   isn't defined, as in this Node mocha environment) identifies a
        //   FileList purely by `Symbol.toStringTag`, and reconstructs one
        //   by iterating `.length`/`.item(i)` -- so an *empty* duck-typed
        //   FileList round-trips with no need for the real per-file
        //   Blob/File byte-reading machinery this project doesn't wire up
        //   (see the `revive()`/FileList branch note in past coverage work).
        const fakeFileList = {
            [Symbol.toStringTag]: 'FileList',
            length: 0,
            item () {
                return undefined;
            }
        };

        const cloned = clone(fakeFileList);
        expect(Object.prototype.toString.call(cloned)).to.equal('[object FileList]');
        expect(cloned).to.have.lengthOf(0);
    });
});

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

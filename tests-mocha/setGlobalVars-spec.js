describe('shimIndexedDB.__setConfig', function () {
    'use strict';

    if (!env.isNative) {
        it('should throw when given an unrecognized configuration property', function () {
            expect(() => {
                window.shimIndexedDB.__setConfig('notARealConfigProperty', 1);
            }).to.throw(Error, 'notARealConfigProperty is not a valid configuration property');
            expect(() => {
                window.shimIndexedDB.__getConfig('notARealConfigProperty');
            }).to.throw(Error, 'notARealConfigProperty is not a valid configuration property');
        });

        it('should get and set a configuration property', function () {
            const original = window.shimIndexedDB.__getConfig('DEBUG');
            try {
                window.shimIndexedDB.__setConfig('DEBUG', true);
                expect(window.shimIndexedDB.__getConfig('DEBUG')).to.equal(true);
            } finally {
                window.shimIndexedDB.__setConfig('DEBUG', original);
            }
        });

        it('should toggle debug mode via `__debug`', function () {
            const original = window.shimIndexedDB.__getConfig('DEBUG');
            try {
                window.shimIndexedDB.__debug(true);
                expect(window.shimIndexedDB.__getConfig('DEBUG')).to.equal(true);
            } finally {
                window.shimIndexedDB.__debug(original);
            }
        });

        it('should set the Unicode identifier config via `__setUnicodeIdentifiers`', function () {
            const originalStart = window.shimIndexedDB.__getConfig('UnicodeIDStart');
            const originalContinue = window.shimIndexedDB.__getConfig('UnicodeIDContinue');
            try {
                window.shimIndexedDB.__setUnicodeIdentifiers({
                    UnicodeIDStart: '[$A-Z_a-z]', UnicodeIDContinue: '[$0-9A-Z_a-z]'
                });
                expect(window.shimIndexedDB.__getConfig('UnicodeIDStart')).to.equal('[$A-Z_a-z]');
                expect(window.shimIndexedDB.__getConfig('UnicodeIDContinue')).to.equal('[$0-9A-Z_a-z]');
            } finally {
                window.shimIndexedDB.__setUnicodeIdentifiers({
                    UnicodeIDStart: originalStart, UnicodeIDContinue: originalContinue
                });
            }
        });

        it('should call through to `Sca.register()` when configuring `registerSCA`', function (done) {
            this.timeout(20000);
            // `register()` replaces the module-level `typeson` instance used
            //   for *all* structured cloning with one built only from
            //   whatever this callback returns -- dropping `Sca.js`'s own
            //   `customFileList` merge for the rest of this process. Nothing
            //   else in this suite clones an actual/duck-typed `FileList`
            //   through this shared instance (the dedicated `Sca.js` test
            //   for that uses its own isolated import instead), so this is
            //   safe, but an identity callback is used regardless to keep
            //   the change as inert as possible.
            let called = false;
            window.shimIndexedDB.__setConfig({
                registerSCA (preset) {
                    called = true;
                    return preset;
                }
            });
            expect(called, 'the registerSCA callback was invoked').to.equal(true);

            // Structured cloning of ordinary values must still work.
            testHelper.createObjectStores(undefined, (error, [objectStore]) => {
                if (error) {
                    done(error);
                    return;
                }
                const addReq = objectStore.add({plain: 'value'}, 1);
                addReq.onsuccess = function () {
                    expect(addReq.result).to.equal(1);
                    objectStore.transaction.db.close();
                    done();
                };
                addReq.onerror = function () {
                    done(new Error('Could not add data after registerSCA'));
                };
            });
        });
    }
});

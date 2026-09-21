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
    }
});

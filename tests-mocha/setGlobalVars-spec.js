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
import setGlobalVars from '../src/setGlobalVars.js';

describe('setGlobalVars coverage', function () {
    it('should cover undefined openDatabase in __useShim (lines 217-218)', function () {
        const idb = {};
        const cfg = { win: { openDatabase: () => {} } };
        setGlobalVars(idb, cfg);
        cfg.win.openDatabase = undefined;
        idb.shimIndexedDB.__useShim(); // Should return early without throwing
    });

    it('should cover fullIDLSupport and DOMException prototype manipulation (lines 281-283)', function () {
        const idb = {};
        const cfg = { win: { openDatabase: () => {} }, fullIDLSupport: true, fs: {} };
        const originalDOMException = global.DOMException;
        global.DOMException = class DOMException {};
        try {
            setGlobalVars(idb, cfg);
            idb.shimIndexedDB.__useShim(); // Should set prototype
        } finally {
            global.DOMException = originalDOMException;
        }
    });

    it('should cover no-op shim fallback when openDatabase is undefined (lines 324-338)', function () {
        const idb = {};
        const cfg = { win: {} };
        setGlobalVars(idb, cfg);
        idb.shimIndexedDB.__useShim(); // Should print a console warning
    });

    it('should cover Android poorIndexedDbSupport (line 359)', function () {
        const idb = {};
        const cfg = { win: { openDatabase: () => {} } };
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(global, 'navigator');
        Object.defineProperty(global, 'navigator', { get: () => ({ userAgent: 'Android 4.1' }), configurable: true });
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(global, 'navigator', originalNavigatorDesc);
            } else {
                delete global.navigator;
            }
        }
    });

    it('should cover iOS 9 poorIndexedDbSupport (line 367)', function () {
        const idb = {};
        const cfg = { win: { openDatabase: () => {} } };
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(global, 'navigator');
        Object.defineProperty(global, 'navigator', { get: () => ({ userAgent: 'iPhone os 9_' }), configurable: true });
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(global, 'navigator', originalNavigatorDesc);
            } else {
                delete global.navigator;
            }
        }
    });

    it('should cover Safari DEFAULT_DB_SIZE logic (line 381)', function () {
        const idb = {};
        const cfg = { win: { openDatabase: () => {} } };
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(global, 'navigator');
        Object.defineProperty(global, 'navigator', { get: () => ({ userAgent: 'Safari' }), configurable: true });
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(global, 'navigator', originalNavigatorDesc);
            } else {
                delete global.navigator;
            }
        }
    });

    it('should cover fallback block when avoidAutoShim is true (lines 393-403)', function () {
        const idb = {};
        const cfg = { win: { openDatabase: () => {} }, avoidAutoShim: true };
        setGlobalVars(idb, cfg);
    });
});

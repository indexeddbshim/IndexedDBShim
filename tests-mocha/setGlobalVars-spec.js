describe('shimIndexedDB.__setConfig', function () {
    'use strict';

    if (env.isNative) {
        return;
    }

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
});
import setGlobalVars from '../src/setGlobalVars.js';
import CFG from '../src/CFG.js';

describe('setGlobalVars coverage', function () {
    let originalCFG, originalOpenDatabase;
    beforeEach(function () {
        // `shimIndexedDB` and `CFG` are process-wide singletons, so the fake
        //   `cfg.win.openDatabase` no-op stubs and other config overrides
        //   used throughout this suite (passed to `setGlobalVars`/`__useShim`
        //   via an isolated `idb`/`cfg` object) still end up mutating this
        //   shared state -- e.g. `shimIndexedDB.__openDatabase` gets rebound
        //   to the fake stub, permanently breaking real database opens in
        //   later, unrelated tests/files if not restored here.
        originalCFG = {...CFG};
        originalOpenDatabase = window.shimIndexedDB.__openDatabase;
        CFG.DEFAULT_DB_SIZE = undefined;
    });
    afterEach(function () {
        Object.assign(CFG, originalCFG);
        window.shimIndexedDB.__openDatabase = originalOpenDatabase;
    });

    it('should cover undefined openDatabase in __useShim (lines 217-218)', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        setGlobalVars(idb, cfg);
        cfg.win.openDatabase = undefined;
        idb.shimIndexedDB.__useShim(); // Should return early without throwing
    });

    it('should cover fullIDLSupport and DOMException prototype manipulation (lines 281-283)', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}, fullIDLSupport: true, fs: {}};
        const originalDOMException = DOMException;
        /**
         *
         */
        globalThis.DOMException = class DOMException {};
        try {
            setGlobalVars(idb, cfg);
            idb.shimIndexedDB.__useShim(); // Should set prototype
        } finally {
            globalThis.DOMException = originalDOMException;
        }
    });

    it('should cover no-op shim fallback when openDatabase is undefined (lines 324-338)', function () {
        const idb = {};
        const cfg = {win: {}};
        setGlobalVars(idb, cfg);
        idb.shimIndexedDB.__useShim(); // Should print a console warning
    });

    it('should cover Android poorIndexedDbSupport (line 359)', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {get: () => ({userAgent: 'Android 4.1'}), configurable: true});
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
            } else {
                delete globalThis.navigator;
            }
        }
    });

    it('should cover iOS 9 poorIndexedDbSupport (line 367)', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {get: () => ({userAgent: 'iPhone os 9_'}), configurable: true});
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
            } else {
                delete globalThis.navigator;
            }
        }
    });

    it('should cover Safari DEFAULT_DB_SIZE logic (line 381)', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {get: () => ({userAgent: 'Safari'}), configurable: true});
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
            } else {
                delete globalThis.navigator;
            }
        }
    });

    it('should cover fallback block when avoidAutoShim is true (lines 393-403)', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}, avoidAutoShim: true};
        setGlobalVars(idb, cfg);
    });

    it('should cover Safari DEFAULT_DB_SIZE logic false branch (line 381)', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {get: () => ({userAgent: 'Safari Chrome'}), configurable: true});
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
            } else {
                delete globalThis.navigator;
            }
        }
    });

    it('should catch defineProperty errors and warn when unable to shim (lines 163-166, 170-173)', function () {
        const idb = {};
        Object.freeze(idb);
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        const origWarn = console.warn;
        let warned = false;
        console.warn = () => { warned = true; };
        try {
            setGlobalVars(idb, cfg);
        } catch (e) {
            // expected to throw Cannot add property shimIndexedDB because IDB is frozen and it enters the else block
        } finally {
            console.warn = origWarn;
        }
        expect(warned).to.be.true;
    });

    it('should catch property assignment errors (lines 127-128)', function () {
        const idb = {};
        Object.freeze(idb);
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        const origDef = Object.defineProperty;
        Object.defineProperty = undefined;
        try {
            setGlobalVars(idb, cfg);
        } catch (e) {
            // expected
        } finally {
            Object.defineProperty = origDef;
        }
    });

    it('should cover Safari DEFAULT_DB_SIZE logic false branch empty userAgent (line 381)', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {get: () => ({userAgent: ''}), configurable: true});
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
            } else {
                delete globalThis.navigator;
            }
        }
    });

    it('should cover Safari DEFAULT_DB_SIZE logic false branch no userAgent (line 381)', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {get: () => ({}), configurable: true});
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
            } else {
                delete globalThis.navigator;
            }
        }
    });
    it('should cover line 111 branch by passing undefined idb', function () {
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        // Passing null to cover `idb || globalThis || {}`
        setGlobalVars(null, cfg);
    });

    it('should cover line 136 propDesc || {} by making ShimDOMException read-only', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}, fullIDLSupport: true, fs: {}};
        // Create a read-only property so initial assignment fails
        Object.defineProperty(idb, 'ShimDOMException', {get: () => undefined, configurable: true});
        setGlobalVars(idb, cfg);
        idb.shimIndexedDB.__useShim();
    });

    it('should cover lines 343-346 webkitIndexedDB fallback', function () {
        const idb = {webkitIndexedDB: {}};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        setGlobalVars(idb, cfg);
    });

    it('should cover lines 343-346 mozIndexedDB fallback', function () {
        const idb = {mozIndexedDB: {}};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        setGlobalVars(idb, cfg);
    });

    it('should cover lines 343-346 oIndexedDB fallback', function () {
        const idb = {oIndexedDB: {}};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        setGlobalVars(idb, cfg);
    });

    it('should cover lines 343-346 msIndexedDB fallback', function () {
        const idb = {msIndexedDB: {}};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        setGlobalVars(idb, cfg);
    });

    it('should cover line 388 (!IDB.indexedDB || poorIndexedDbSupport) false branch', function () {
        // IDB.indexedDB is truthy, poorIndexedDbSupport is falsy
        // (avoidAutoShim is explicitly reset to `false` here since it is a shared
        //  `CFG` singleton that an earlier test in this file leaves set to `true`,
        //  which would otherwise short-circuit the `&&` before this branch runs)
        const idb = {indexedDB: {}};
        const cfg = {win: {openDatabase () { /* no-op */ }}, avoidAutoShim: false};
        setGlobalVars(idb, cfg);
    });

    it('should cover line 388 poorIndexedDbSupport true branch with truthy IDB.indexedDB', function () {
        // IDB.indexedDB is truthy, poorIndexedDbSupport is truthy
        const idb = {indexedDB: {}};
        const cfg = {win: {openDatabase () { /* no-op */ }}, avoidAutoShim: false};
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {get: () => ({userAgent: 'Android 4.1'}), configurable: true});
        try {
            setGlobalVars(idb, cfg);
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
            } else {
                delete globalThis.navigator;
            }
        }
    });

    it('should cover lines 395-401 webkit fallbacks', function () {
        const idb = {
            webkitIDBDatabase: {},
            webkitIDBTransaction: {},
            webkitIDBCursor: {},
            webkitIDBKeyRange: {}
        };
        const cfg = {win: {openDatabase () { /* no-op */ }}, avoidAutoShim: true};
        setGlobalVars(idb, cfg);
    });

    it('should cover line 388 (!IDB.indexedDB || poorIndexedDbSupport) true/false branches completely', function () {
        // (avoidAutoShim is explicitly reset to `false` in each `cfg` below since it is
        //  a shared `CFG` singleton that an earlier test in this file leaves set to
        //  `true`, which would otherwise short-circuit the `&&` before this branch runs)

        // IDB.indexedDB truthy, poor falsy
        setGlobalVars({indexedDB: {}}, {win: {openDatabase () { /* no-op */ }}, avoidAutoShim: false});

        // IDB.indexedDB falsy
        setGlobalVars({}, {win: {openDatabase () { /* no-op */ }}, avoidAutoShim: false});

        // IDB.indexedDB truthy, poor truthy
        const originalNavigatorDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
        Object.defineProperty(globalThis, 'navigator', {get: () => ({userAgent: 'Android 4.1'}), configurable: true});
        try {
            setGlobalVars({indexedDB: {}}, {win: {openDatabase () { /* no-op */ }}, avoidAutoShim: false});
        } finally {
            if (originalNavigatorDesc) {
                Object.defineProperty(globalThis, 'navigator', originalNavigatorDesc);
            } else {
                delete globalThis.navigator;
            }
        }
    });
    it('should cover line 388 false branch for openDatabase !== undefined', function () {
        // IDB.indexedDB is falsy, so (!IDB.indexedDB || poorIndexedDbSupport) is TRUE
        // But openDatabase is undefined!
        // (avoidAutoShim explicitly reset to `false`; see comment above)
        const idb = {};
        const cfg = {win: {}, avoidAutoShim: false}; // no openDatabase!
        setGlobalVars(idb, cfg);
    });

    it('should throw "Illegal invocation" when the shimmed `indexedDB` getter is called on a non-instance', function () {
        const idb = {};
        const cfg = {win: {openDatabase () { /* no-op */ }}};
        setGlobalVars(idb, cfg);
        idb.shimIndexedDB.__useShim();
        const desc = Object.getOwnPropertyDescriptor(idb, 'indexedDB');
        expect(() => desc.get.call({})).to.throw(TypeError, 'Illegal invocation');
    });

    it('should cover the `replaceNonIDBGlobals` branch', function () {
        if (env.isNative) {
            this.skip();
            return;
        }
        const idb = {};
        const cfg = {
            win: {openDatabase () { /* no-op */ }},
            replaceNonIDBGlobals: true
        };
        setGlobalVars(idb, cfg);
        idb.shimIndexedDB.__useShim();
        expect(idb.DOMException).to.equal(window.ShimDOMException);
    });
});

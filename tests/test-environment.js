(function() {
    'use strict';

    var browser = getBrowserInfo();

    /** Environment info */
    var env = window.env = {
        /** Does the browser natively support WebSql? */
        nativeWebSql: !!window.openDatabase || false,

        /** Does the browser natively support IndexedDB? */
        nativeIndexedDB: window.indexedDB || false,

        /**
         * The IndexedDB instance that is currently being used.
         * This may be the native instance, or the shim.
         *
         * HACK: We can't use window.indexedDB directly in our tests, because of Safari on iOS.
         * See https://github.com/axemclion/IndexedDBShim/issues/167
         */
        indexedDB: window.indexedDB,

        /** Browser info */
        browser: {
            name: browser.name,
            version: browser.version,   // numeric
            isChrome: browser.name === 'Chrome',
            isIE: browser.name === 'MSIE',
            isFirefox: browser.name === 'Firefox',
            isSafari: browser.name === 'Safari'
        }
    };

    // Setup Mocha and Chai
    mocha.setup('bdd');
    mocha.globals(['indexedDB']);
    window.expect = chai.expect;

    // Browser feature detection
    getElementById("supports-websql").className += env.nativeWebSql ? ' pass' : ' fail';
    getElementById("supports-indexeddb").className += env.nativeIndexedDB ? ' pass' : ' fail';
    getElementById("supports-mozindexeddb").className += window.mozIndexedDB ? ' pass' : '';
    getElementById("supports-webkitindexeddb").className += window.webkitIndexedDB ? ' pass' : '';
    getElementById("supports-msindexeddb").className += window.msIndexedDB ? ' pass' : '';

    /**
     * This function runs before every test
     */
    beforeEach(function() {
        if (util.currentTest === undefined) {
            // This is the first test, so do one-time initialization
            initializeShim();
        }

        // Track the current test
        util.currentTest = this.currentTest;

        // A list of databases created during this test
        util.currentTest.databases = [];

        // Increase the slowness threshold
        util.currentTest.slow(300);
    });


    /**
     * This function runs after every test
     */
    afterEach(function(done) {
        // Delete all databases that were created during this test
        util.asyncForEach(util.currentTest.databases, done, function(dbName) {
            return indexedDB.deleteDatabase(dbName);
        });
    });


    /**
     * Performs one-time initialization before any tests run.
     */
    function initializeShim() {
        var useShim = location.search.indexOf('useShim=true') > 0;
        var isShimmed = false;

        // Should we use the shim instead of the native IndexedDB?
        if (useShim && env.nativeWebSql) {
            window.shimIndexedDB.__useShim();
            isShimmed = true;
        }
        else if (window.indexedDB === window.shimIndexedDB ||
            window.indexedDB === null) {    // <--- Safari on iOS
            isShimmed = true;
        }

        if (isShimmed) {
            // Disable browser-specific checks in unit tests,
            // since the shim should behave the same in all browsers
            env.browser.isChrome = false;
            env.browser.isIE = false;
            env.browser.isFirefox = false;
            env.browser.isSafari = false;

            // Run all unit tests against the IndexedDBShim
            env.indexedDB = shimIndexedDB;
            shimIndexedDB.__debug(true);

            if (env.nativeIndexedDB) {
                // Allow users to switch back to the native IndexedDB
                getElementById("use-native").style.display = 'inline-block';
            }
        }
        else if (env.nativeWebSql) {
            // Run all unit tests against the native IndexedDB
            env.indexedDB = env.nativeIndexedDB;

            // Allow users to switch to use the shim instead of the native IndexedDB
            getElementById("use-shim").style.display = 'inline-block';
        }
    }


    /**
     * Returns browser name and version
     * @returns {{name: string, version: number}}
     */
    function getBrowserInfo() {
        var userAgent = navigator.userAgent;
        var browser = {name: '', version: 0};
        var offset;

        if ((offset = userAgent.indexOf('Chrome')) !== -1) {
            browser.name = 'Chrome';
            browser.version = userAgent.substring(offset + 7);
        } else if ((offset = userAgent.indexOf('Firefox')) !== -1) {
            browser.name = 'Firefox';
            browser.version = userAgent.substring(offset + 8);
        } else if ((offset = userAgent.indexOf('MSIE')) !== -1) {
            browser.name = 'MSIE';
            browser.version = userAgent.substring(offset + 5);
        } else if (userAgent.indexOf('Trident') !== -1) {
            browser.name = 'MSIE';
            browser.version = '11';
        } else if ((offset = userAgent.indexOf('Safari')) !== -1) {
            browser.name = 'Safari';

            if ((offset = userAgent.indexOf('Version')) !== -1) {
                browser.version = userAgent.substring(offset + 8);
            }
            else {
                browser.version = userAgent.substring(offset + 7);
            }
        } else if ((offset = userAgent.indexOf('AppleWebKit')) !== -1) {
            browser.name = 'Safari';
            browser.version = userAgent.substring(offset + 12);
        }

        if ((offset = browser.version.indexOf(';')) !== -1 || (offset = browser.version.indexOf(' ')) !== -1) {
            browser.version = browser.version.substring(0, offset);
        }

        browser.version = parseFloat(browser.version);

        return browser;
    }


    /**
     * A "safe" wrapper around `document.getElementById`
     */
    function getElementById(id) {
        return document.getElementById(id) || {style: {}};
    }
})();

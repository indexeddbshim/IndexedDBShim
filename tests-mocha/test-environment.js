/* eslint-env mocha */
/* globals chai, shimIndexedDB, location, IDBFactory */
/* eslint-disable no-var */
(function () {
    'use strict';

    // Setup Mocha and Chai
    mocha.setup({ui: 'bdd', timeout: 5000});
    mocha.globals(['indexedDB', '__stub__onerror']);
    window.expect = chai.expect;
    var describe = window.describe;

    /** Environment Info **/
    var env = window.env = {
        /**
         * Browser info
         * @type {browserInfo}
         */
        browser: getBrowserInfo(),

        /**
         * Does the browser natively support IndexedDB?
         */
        nativeIndexedDB: Boolean(window.indexedDB),

        /**
         * Does the browser natively support WebSql?
         */
        nativeWebSql: Boolean(window.openDatabase),

        /**
         * The IndexedDB instance that is being used (may be native, or the shim).
         * HACK: We can't use window.indexedDB directly in our tests, because of Safari on iOS.
         * See https://github.com/axemclion/IndexedDBShim/issues/167
         */
        indexedDB: window.indexedDB,

        /**
         * The WebSQL instance that is being used (may be native, or a shim).
         */
        webSql: window.openDatabase,

        /**
         * Are we using the native IndexedDB implementation?
         */
        isNative: true,

        /**
         * Are we using the IndexedDBShim implementation?
         * NOTE: This can be true even if the browser natively supports IndexedDB.
         */
        isShimmed: false,

        /**
         * Are we using the polyfill (not the full shim, but a polyfilled version of the native IndexedDB)
         */
        isPolyfilled: false,

        /**
         * IndexedDBShim can't always use these native classes, because some browsers don't allow us to instantiate them.
         * It's also not safe to shim these classes on the global scope, because it could break other stuff.
         */
        Event: window.ShimEvent || window.Event,
        DOMException: window.ShimDOMException || window.DOMException,

        /**
         * Safe duration by which transaction should have expired
        */
        transactionDuration: 1000
    };

    /**
     * Intercept the first call to Mocha's `describe` function, and use it to initialize the test environment.
     * @returns {void}
     */
    window.describe = function (name, testSuite) {
        initTestEnvironment();
        mocha.checkLeaks();
        window.describe = describe;
        describe.apply(window, arguments);
    };

    /**
     * Initializes the test environment, applying the shim if necessary.
     * @returns {void}
     */
    function initTestEnvironment () {
        // Show which features the browser natively supports
        getElementById('supports-websql').className += env.nativeWebSql ? ' pass' : ' fail';
        getElementById('supports-indexeddb').className += env.nativeIndexedDB ? ' pass' : ' fail';
        getElementById('supports-mozindexeddb').className += window.mozIndexedDB ? ' pass' : '';
        getElementById('supports-webkitindexeddb').className += window.webkitIndexedDB ? ' pass' : '';
        getElementById('supports-msindexeddb').className += window.msIndexedDB ? ' pass' : '';

        // Has a WebSQL shim been loaded?
        env.webSql = window.openDatabase;

        // Should we use the shim instead of the native IndexedDB?
        var useShim = location.search.includes('useShim=true');
        if (useShim || !window.indexedDB || window.indexedDB === window.shimIndexedDB) {
            // Replace the browser's native IndexedDB with the shim
            shimIndexedDB.__useShim();
            shimIndexedDB.__setConfig('useSQLiteIndexes', true);
            shimIndexedDB.__debug(true);
            env.isNative = false;
            if (!IDBFactory.toString().includes('[native code]')) {
                env.indexedDB = shimIndexedDB;
                env.isShimmed = true;
            } else {
                env.isPolyfilled = true;
            }

            if (env.isShimmed) {
                // Use the shimmed Error & Event classes instead of the native ones
                env.Event = window.ShimEvent;
                env.DOMException = window.ShimDOMException;
            }

            if (env.nativeIndexedDB) {
                // Allow users to switch back to the native IndexedDB
                getElementById('use-native').style.display = 'inline-block';
            }
        } else {
            // Allow users to switch to use the shim instead of the native IndexedDB
            getElementById('use-shim').style.display = 'inline-block';
        }

        if ((env.browser.isIE && !env.browser.isMobile) || (env.browser.isSafari && env.browser.version > 6 && env.isShimmed && !window.device)) {
            // These browsers choke when trying to run all the tests, so show a warning message
            getElementById('choke-warning').className = 'problem-child';
        }
    }

    /**
     * Returns browser name and version.
     * @returns {browserInfo}
     */
    function getBrowserInfo () {
        var userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        var offset;

        /** @name browserInfo **/
        var browserInfo = {
            name: '',
            version: '0',
            isMobile: false,
            isChrome: false,
            isIE: false,
            isFirefox: false,
            isSafari: false
        };

        if ((offset = userAgent.indexOf('Edge')) !== -1 ||
            (offset = userAgent.indexOf('MSIE')) !== -1
        ) {
            browserInfo.name = 'MSIE';
            browserInfo.version = userAgent.slice(offset + 5);
            browserInfo.isIE = true;
            browserInfo.isMobile = userAgent.includes('Windows Phone');
        } else if ((offset = userAgent.indexOf('Chrome')) !== -1) {
            browserInfo.name = 'Chrome';
            browserInfo.version = userAgent.slice(offset + 7);
            browserInfo.isChrome = true;
        } else if ((offset = userAgent.indexOf('Firefox')) !== -1) {
            browserInfo.name = 'Firefox';
            browserInfo.version = userAgent.slice(offset + 8);
            browserInfo.isFirefox = true;
        } else if (userAgent.includes('Trident')) {
            browserInfo.name = 'MSIE';
            browserInfo.version = '11';
            browserInfo.isIE = true;
            browserInfo.isMobile = userAgent.includes('Windows Phone');
        } else if ((offset = userAgent.indexOf('Safari')) !== -1) {
            browserInfo.name = 'Safari';
            browserInfo.isSafari = true;
            browserInfo.isMobile = userAgent.includes('Mobile Safari');
            if ((offset = userAgent.indexOf('Version')) !== -1) {
                browserInfo.version = userAgent.slice(offset + 8);
            } else {
                browserInfo.version = userAgent.slice(offset + 7);
            }
        } else if ((offset = userAgent.indexOf('AppleWebKit')) !== -1) {
            browserInfo.name = 'Safari';
            browserInfo.version = userAgent.slice(offset + 12);
            browserInfo.isSafari = true;
            browserInfo.isMobile = userAgent.includes('Mobile Safari');
        }

        if ((offset = browserInfo.version.indexOf(';')) !== -1 || (offset = browserInfo.version.indexOf(' ')) !== -1) {
            browserInfo.version = browserInfo.version.slice(0, offset);
        }

        browserInfo.version = parseFloat(browserInfo.version);

        return browserInfo;
    }

    /**
    * @typedef {PlainObject} SimulatedElement
    * @property {PlainObject} style
    * @property {string} [className]
    */
    /**
     * A "safe" wrapper around `document.getElementById`
     * @returns {Element|SimulatedElement}
     */
    function getElementById (id) {
        if (typeof document === 'undefined') {
            return {className: '', style: {}};
        }
        return document.querySelector('#' + id) || {style: {}};
    }
})();

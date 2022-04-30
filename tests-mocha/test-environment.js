/* eslint-env mocha */
/* globals chai, expect, shimIndexedDB, location, IDBFactory */
/* eslint-disable no-var, no-unused-expressions */
(function () {
    'use strict';

    // Setup Mocha and Chai
    mocha.setup({ui: 'bdd', timeout: 5000});
    mocha.globals(['indexedDB', '__stub__onerror']);
    window.expect = chai.expect;
    var describe = window.describe;

    /** Environment info. */
    var env = window.env = {
        /**
         * Browser info.
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
         * HACK: We can't use window.indexedDB directly in our tests, because of
         * Safari on iOS.
         * @see https://github.com/axemclion/IndexedDBShim/issues/167
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
         * Are we using the polyfill (not the full shim, but a polyfilled
         * version of the native IndexedDB)?
         */
        isPolyfilled: false,

        /**
         * IndexedDBShim can't always use these native classes, because some
         * browsers don't allow us to instantiate them.
         * It's also not safe to shim these classes on the global scope
         * because it could break other stuff.
         */
        Event: window.ShimEvent || window.Event,
        DOMException: window.ShimDOMException || window.DOMException,

        /**
         * Safe duration by which transaction should have expired.
        */
        transactionDuration: 1000
    };

    /**
     * Intercept the first call to Mocha's `describe` function, and use it to initialize the test environment.
     * @param {string} name
     * @param {function} testSuite
     * @returns {void}
     */
    window.describe = function (name, testSuite) {
        initTestEnvironment();
        mocha.checkLeaks();
        window.describe = describe;
        // eslint-disable-next-line prefer-rest-params
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

        /** @name browserInfo */
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
            // eslint-disable-next-line unicorn/prefer-ternary -- Easier
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

        browserInfo.version = Number.parseFloat(browserInfo.version);

        return browserInfo;
    }

    /**
    * @typedef {PlainObject} SimulatedElement
    * @property {PlainObject} style
    * @property {string} [className]
    */
    /**
     * A "safe" wrapper around `document.getElementById`
     * @param {string} id
     * @returns {Element|SimulatedElement}
     */
    function getElementById (id) {
        if (typeof document === 'undefined') {
            return {className: '', style: {}};
        }
        return document.querySelector('#' + id) || {style: {}};
    }

    // Sample data
    window.testData = {
        DB: {
            NAME: 'dbname',
            OBJECT_STORE_1: 'objectStore1',
            OBJECT_STORE_2: 'objectStore2',
            OBJECT_STORE_3: 'objectStore3',
            OBJECT_STORE_4: 'objectStore4',
            OBJECT_STORE_5: 'objectStore5',
            INDEX1_ON_OBJECT_STORE_1: 'Index1_ObjectStore1',
            INDEX1_ON_OBJECT_STORE_2: 'Index1_ObjectStore2'
        },
        sample: (function () {
            var generatedNumbers = {};
            return {
                obj () {
                    return {
                        String: 'Sample ' + new Date(),
                        Int: this.integer(),
                        Float: Math.random(),
                        Boolean: true
                    };
                },
                integer (arg) {
                    // Ensuring a unique integer everytime, for the sake of index get
                    var r;
                    do {
                        r = Number.parseInt(Math.random() * (arg || 100000));
                    }
                    while (generatedNumbers[r]);
                    generatedNumbers[r] = true;
                    return r;
                }
            };
        }())
    };
    var {testData: {DB, sample}} = window;
    window.testHelper = {
        createIndexes (cb) {
            this.createObjectStores(undefined, (error, [, db]) => {
                if (error) {
                    expect(false, error).to.be.true;
                    return;
                }
                db.close();
                var dbOpenRequest = window.indexedDB.open(DB.NAME, 2);
                dbOpenRequest.onsuccess = function (e) {
                    expect(true, 'Database Opened successfully').to.be.true;
                    var newDb = dbOpenRequest.result;
                    var transaction = newDb.transaction([DB.OBJECT_STORE_1], 'readwrite');
                    var objectStore = transaction.objectStore(DB.OBJECT_STORE_1);
                    cb(null, [objectStore, newDb]);
                };
                dbOpenRequest.onerror = function (e) {
                    cb(new Error('Database NOT Opened successfully'));
                };
                dbOpenRequest.onupgradeneeded = function (e) {
                    expect(true, 'Database Upgraded successfully').to.be.true;
                    // var db = dbOpenRequest.result;
                    var objectStore1 = dbOpenRequest.transaction.objectStore(DB.OBJECT_STORE_1);
                    // eslint-disable-next-line no-unused-vars
                    var index1 = objectStore1.createIndex('Int Index', 'Int', {
                        unique: false,
                        multiEntry: false
                    });
                    var index2 = objectStore1.createIndex('String.Index', 'String'); // eslint-disable-line no-unused-vars
                    expect(objectStore1.indexNames, '2 Indexes on object store successfully created').to.have.lengthOf(2);
                };
                dbOpenRequest.onblocked = function (e) {
                    cb(new Error('Opening database blocked'));
                };
            });
        },
        createIndexesAndData (cb) {
            var key = sample.integer();
            var value = sample.obj();
            this.createIndexes((error, [objectStore, db]) => {
                if (error) {
                    expect(false, error).to.be.true;
                    return;
                }
                var addReq = objectStore.add(value, key);
                addReq.onsuccess = function (e) {
                    expect(addReq.result, 'Data successfully added').to.equal(key);
                    cb(null, [key, value, objectStore, db]);
                };
                addReq.onerror = function () {
                    db.close();
                    cb(new Error('Could not add data'));
                };
            });
        },
        // eslint-disable-next-line default-param-last
        createObjectStores (storeName = DB.OBJECT_STORE_1, cb) {
            const delReq = window.indexedDB.deleteDatabase(DB.NAME);
            delReq.onblocked = () => {
                expect(false, 'blocked').to.be.true;
            };
            delReq.onerror = (err) => {
                expect(false, err).to.be.true;
            };
            delReq.onsuccess = () => {
                var dbOpenRequest = window.indexedDB.open(DB.NAME, 1);
                dbOpenRequest.onsuccess = function (e) {
                    expect(true, 'Database opened successfully with version ' + dbOpenRequest.result.version).to.be.true;
                    var db = dbOpenRequest.result;
                    var transaction = db.transaction([
                        DB.OBJECT_STORE_1, DB.OBJECT_STORE_2,
                        DB.OBJECT_STORE_3
                    ], 'readwrite');
                    var objectStore = transaction.objectStore(storeName);
                    cb(null, [objectStore, db]);
                };
                dbOpenRequest.onerror = function (e) {
                    expect(false, 'Database NOT Opened successfully').to.be.true;
                    cb(e);
                };
                dbOpenRequest.onupgradeneeded = function (e) {
                    expect(true, 'Database Upgraded successfully').to.be.true;
                    var db = dbOpenRequest.result;
                    db.createObjectStore(DB.OBJECT_STORE_1);
                    db.createObjectStore(DB.OBJECT_STORE_2, {
                        keyPath: 'Int',
                        autoIncrement: true
                    });
                    db.createObjectStore(DB.OBJECT_STORE_3, {
                        autoIncrement: true
                    });
                    db.createObjectStore(DB.OBJECT_STORE_4, {
                        keyPath: 'Int'
                    });
                    var objectStore5 = db.createObjectStore(DB.OBJECT_STORE_5); // eslint-disable-line no-unused-vars
                    expect(
                        db.objectStoreNames,
                        'Count of Object Stores created is correct'
                    ).to.have.lengthOf(5);
                };

                dbOpenRequest.onblocked = function (e) {
                    expect(false, 'Database open is now blocked').to.be.true;
                    cb(e);
                };
            };
        },
        addObjectStoreData (cb) {
            var dbOpenRequest = window.indexedDB.open(DB.NAME);
            dbOpenRequest.onsuccess = function (e) {
                expect(true, 'Database Opened successfully').to.be.true;
                var db = dbOpenRequest.result;
                var transaction = db.transaction([DB.OBJECT_STORE_1], 'readwrite');
                var objectStore = transaction.objectStore(DB.OBJECT_STORE_1);
                var counter = 0, max = 15;
                var success = function () {
                    expect(true, 'Data added to store').to.be.true;
                    if (++counter >= max) {
                        db.close();
                        // eslint-disable-next-line n/callback-return
                        cb();
                    }
                };
                var error = function (e) {
                    expect(false, 'Could not add data').to.be.true;
                    if (++counter >= 10) {
                        // eslint-disable-next-line n/callback-return
                        cb(e);
                    }
                };
                for (var i = 0; i < max; i++) {
                    var req = objectStore.add(sample.obj(), i);
                    req.onsuccess = success;
                    req.onerror = error;
                }
            };
            dbOpenRequest.onerror = function (e) {
                expect(false, 'Database NOT Opened successfully').to.be.true;
                cb(e);
            };
            dbOpenRequest.onblocked = function (e) {
                expect(false, 'Opening database blocked').to.be.true;
                cb(e);
            };
        },
        // eslint-disable-next-line default-param-last
        openObjectStore (storeName = DB.OBJECT_STORE_1, cb) {
            var dbOpenRequest = window.indexedDB.open(DB.NAME);
            dbOpenRequest.onsuccess = function (e) {
                var db = dbOpenRequest.result;
                var transaction = db.transaction([
                    DB.OBJECT_STORE_1, DB.OBJECT_STORE_2,
                    DB.OBJECT_STORE_3
                ], 'readwrite');
                var objectStore = transaction.objectStore(storeName);
                cb(null, [objectStore, db]);
            };
            dbOpenRequest.onerror = function (e) {
                expect(false, 'Database NOT Opened successfully').to.be.true;
                cb(e);
            };
        }
    };
})();

/* eslint-disable unicorn/prefer-global-this -- Older browsers? */
import {setPrototypeOfCustomEvent} from 'eventtargeter';
import shimIDBVersionChangeEvent from './IDBVersionChangeEvent.js';
import {IDBCursor as shimIDBCursor, IDBCursorWithValue as shimIDBCursorWithValue} from './IDBCursor.js';
import {IDBRequest as shimIDBRequest, IDBOpenDBRequest as shimIDBOpenDBRequest} from './IDBRequest.js';
import {createDOMException, ShimDOMException} from './DOMException.js';
import {shimIndexedDB, IDBFactory, setFS} from './IDBFactory.js';
import DOMStringList from './DOMStringList.js';
import {ShimEvent, ShimCustomEvent, ShimEventTarget} from './Event.js';
import {register} from './Sca.js';
import shimIDBKeyRange from './IDBKeyRange.js';
import shimIDBObjectStore from './IDBObjectStore.js';
import shimIDBIndex from './IDBIndex.js';
import shimIDBTransaction from './IDBTransaction.js';
import shimIDBDatabase from './IDBDatabase.js';
import CFG from './CFG.js';
import {isNullish} from './util.js';

/**
 * @typedef {any} AnyValue
 */

/**
 * @callback SetConfig
 * @param {import('./CFG.js').KeyofConfigValues|
 *   Partial<import('./CFG.js').ConfigValues>} prop
 * @param {AnyValue} [val]
 * @throws {Error}
 * @returns {void}
 */

/** @type {SetConfig} */
function setConfig (prop, val) {
    if (prop && typeof prop === 'object') {
        Object.entries(prop).forEach(([p, val]) => {
            setConfig(
                /** @type {import('./CFG.js').KeyofConfigValues} */
                (p),
                val
            );
        });
        return;
    }
    if (!(prop in CFG)) {
        throw new Error(prop + ' is not a valid configuration property');
    }
    // @ts-expect-error Should not be `never` here!
    CFG[prop] = val;
    if (prop === 'registerSCA' && typeof val === 'function') {
        register(
            /**
             * @type {(
             *   preset: import('typeson').Preset
             * ) => import('typeson').Preset}
             */ (
                val
            )
        );
    }
}

/**
 * @typedef {(
 *   prop: import('./CFG.js').KeyofConfigValues
 * ) => import('./CFG.js').ConfigValue} GetConfig
 */

/**
 * @typedef {(cfg: {
 *   UnicodeIDStart: string,
 *   UnicodeIDContinue: string
 * }) => void} SetUnicodeIdentifiers
 */

/**
 * @typedef {(IDBFactory|object) & {
 *     __useShim: () => void,
 *     __debug: (val: boolean) => void,
 *     __setConfig: SetConfig,
 *     __getConfig: GetConfig,
 *     __setUnicodeIdentifiers: SetUnicodeIdentifiers,
 *     __setConnectionQueueOrigin: (origin?: string) => void
 *   }} ShimIndexedDB
 */

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {(typeof globalThis|object) & {
 *   indexedDB?: Partial<IDBFactory>,
 *   IDBFactory: typeof IDBFactory,
 *   IDBOpenDBRequest: typeof IDBOpenDBRequest,
 *   IDBRequest: typeof IDBRequest,
 *   IDBCursorWithValue: typeof IDBCursorWithValue,
 *   IDBCursor: typeof IDBCursor,
 *   IDBDatabase: typeof IDBDatabase,
 *   IDBTransaction: typeof IDBTransaction,
 *   IDBKeyRange: typeof IDBKeyRange,
 *   shimIndexedDB?: ShimIndexedDB
 * }} ShimmedObject
 */

/**
 *
 * @param {ShimmedObject} [idb]
 * @param {import('./CFG.js').ConfigValues} [initialConfig]
 * @returns {ShimmedObject}
 */
function setGlobalVars (idb, initialConfig) {
    if (initialConfig) {
        setConfig(initialConfig);
    }
    const IDB = idb || globalThis || {};
    /**
     * @typedef {any} AnyClass
     */
    /**
     * @typedef {any} AnyValue
     */
    /**
     * @typedef {Function} AnyFunction
     */
    /**
     * @param {string} name
     * @param {AnyClass} value
     * @param {PropertyDescriptor & {
     *   shimNS?: object
     * }|undefined} [propDesc]
     * @returns {void}
     */
    function shim (name, value, propDesc) {
        if (!propDesc || !Object.defineProperty) {
            try {
                // Try setting the property. This will fail if the property is read-only.
                // @ts-expect-error It's ok
                IDB[name] = value;
            } catch (e) {
                console.log(e);
            }
        }
        if (
            // @ts-expect-error It's ok
            IDB[name] !== value &&
            Object.defineProperty
        ) {
            // Setting a read-only property failed, so try re-defining the property
            try {
                let desc = propDesc || {};
                if (!('get' in desc)) {
                    if (!('value' in desc)) {
                        desc.value = value;
                    }
                    if (!('writable' in desc)) {
                        desc.writable = true;
                    }
                } else {
                    const o = {
                        /**
                         * @returns {AnyValue}
                         */
                        get [name] () {
                            return /** @type {AnyFunction} */ (
                                /** @type {PropertyDescriptor} */ (
                                    propDesc
                                ).get
                            ).call(this);
                        }
                    };
                    desc = /** @type {PropertyDescriptor} */ (
                        Object.getOwnPropertyDescriptor(o, name)
                    );
                }
                Object.defineProperty(IDB, name, desc);
            } catch (err) {
                // With `indexedDB`, PhantomJS fails here and below but
                //  not above, while Chrome is reverse (and Firefox doesn't
                //  get here since no WebSQL to use for shimming)
            }
        }

        // @ts-expect-error It's ok
        if (IDB[name] !== value) {
            if (typeof console !== 'undefined' && console.warn) {
                console.warn('Unable to shim ' + name);
            }
        }
    }
    if (CFG.win.openDatabase !== undefined) {
        shim('shimIndexedDB', shimIndexedDB, {
            enumerable: false,
            configurable: true
        });
    }
    if ('shimIndexedDB' in IDB && IDB.shimIndexedDB) {
        IDB.shimIndexedDB.__useShim = function () {
            /**
             *
             * @param {"Shim"|""} [prefix]
             * @returns {void}
             */
            function setNonIDBGlobals (prefix = '') {
                shim(prefix + 'DOMException', ShimDOMException);
                shim(prefix + 'DOMStringList', DOMStringList, {
                    enumerable: false,
                    configurable: true,
                    writable: true,
                    value: DOMStringList
                });
                shim(prefix + 'Event', ShimEvent, {
                    configurable: true,
                    writable: true,
                    value: ShimEvent,
                    enumerable: false
                });
                shim(prefix + 'CustomEvent', ShimCustomEvent, {
                    configurable: true,
                    writable: true,
                    value: ShimCustomEvent,
                    enumerable: false
                });
                shim(prefix + 'EventTarget', ShimEventTarget, {
                    configurable: true,
                    writable: true,
                    value: ShimEventTarget,
                    enumerable: false
                });
            }
            const shimIDBFactory = IDBFactory;
            if (CFG.win.openDatabase !== undefined) {
                shimIndexedDB.__openDatabase = CFG.win.openDatabase.bind(CFG.win); // We cache here in case the function is overwritten later as by the IndexedDB support promises tests
                // Polyfill ALL of IndexedDB, using WebSQL
                shim('indexedDB', shimIndexedDB, {
                    enumerable: true,
                    configurable: true,
                    get () {
                        if (this !== IDB && !isNullish(this) && !this.shimNS) { // Latter is hack for test environment
                            throw new TypeError('Illegal invocation');
                        }
                        return shimIndexedDB;
                    }
                });
                /** @type {[string, any][]} */
                ([
                    ['IDBFactory', shimIDBFactory],
                    ['IDBDatabase', shimIDBDatabase],
                    ['IDBObjectStore', shimIDBObjectStore],
                    ['IDBIndex', shimIDBIndex],
                    ['IDBTransaction', shimIDBTransaction],
                    ['IDBCursor', shimIDBCursor],
                    ['IDBCursorWithValue', shimIDBCursorWithValue],
                    ['IDBKeyRange', shimIDBKeyRange],
                    ['IDBRequest', shimIDBRequest],
                    ['IDBOpenDBRequest', shimIDBOpenDBRequest],
                    ['IDBVersionChangeEvent', shimIDBVersionChangeEvent]
                ]).forEach(([prop, obj]) => {
                    shim(prop, obj, {
                        enumerable: false,
                        configurable: true
                    });
                });
                // For Node environments
                if (CFG.fs) {
                    setFS(CFG.fs);
                }
                if (CFG.fullIDLSupport) {
                    // Slow per MDN so off by default! Though apparently needed for WebIDL: http://stackoverflow.com/questions/41927589/rationales-consequences-of-webidl-class-inheritance-requirements

                    Object.setPrototypeOf(IDB.IDBOpenDBRequest, IDB.IDBRequest);
                    Object.setPrototypeOf(IDB.IDBCursorWithValue, IDB.IDBCursor);

                    Object.setPrototypeOf(shimIDBDatabase, ShimEventTarget);
                    Object.setPrototypeOf(shimIDBRequest, ShimEventTarget);
                    Object.setPrototypeOf(shimIDBTransaction, ShimEventTarget);
                    Object.setPrototypeOf(shimIDBVersionChangeEvent, ShimEvent);
                    Object.setPrototypeOf(ShimDOMException, Error);
                    Object.setPrototypeOf(ShimDOMException.prototype, Error.prototype);
                    setPrototypeOfCustomEvent();
                }
                if (IDB.indexedDB && !IDB.indexedDB.toString().includes('[native code]')) {
                    if (CFG.addNonIDBGlobals) {
                        // As `DOMStringList` exists per IDL (and Chrome) in the global
                        //   thread (but not in workers), we prefix the name to avoid
                        //   shadowing or conflicts
                        setNonIDBGlobals('Shim');
                    }
                    if (CFG.replaceNonIDBGlobals) {
                        setNonIDBGlobals();
                    }
                }
                /* istanbul ignore next -- TS guard */
                if (!IDB.shimIndexedDB) {
                    return;
                }
                IDB.shimIndexedDB.__setConnectionQueueOrigin();
            }
        };

        IDB.shimIndexedDB.__debug = function (val) {
            CFG.DEBUG = val;
        };
        IDB.shimIndexedDB.__setConfig = setConfig;

        /** @type {GetConfig} */
        IDB.shimIndexedDB.__getConfig = function (prop) {
            if (!(prop in CFG)) {
                throw new Error(prop + ' is not a valid configuration property');
            }
            return CFG[prop];
        };

        /** @type {SetUnicodeIdentifiers} */
        IDB.shimIndexedDB.__setUnicodeIdentifiers = function ({
            UnicodeIDStart, UnicodeIDContinue
        }) {
            setConfig({UnicodeIDStart, UnicodeIDContinue});
        };
    } else {
        // We no-op the harmless set-up properties and methods with a warning; the `IDBFactory` methods,
        //    however (including our non-standard methods), are not stubbed as they ought
        //    to fail earlier rather than potentially having side effects.
        IDB.shimIndexedDB = /** @type {ShimIndexedDB} */ ({});
        /** @type {const} */ ([
            '__useShim', '__debug', '__setConfig',
            '__getConfig', '__setUnicodeIdentifiers'
        ]).forEach((prop) => {
            /** @type {ShimIndexedDB} */ (IDB.shimIndexedDB)[prop] = /** @type {() => any} */ function () {
                console.warn('This browser does not have WebSQL to shim.');
            };
        });
    }

    // Workaround to prevent an error in Firefox
    if (!('indexedDB' in IDB) && typeof window !== 'undefined') { // 2nd condition avoids problems in Node
        IDB.indexedDB = /** @type {IDBFactory} */ (IDB.indexedDB ||
            ('webkitIndexedDB' in IDB && IDB.webkitIndexedDB) ||
            ('mozIndexedDB' in IDB && IDB.mozIndexedDB) ||
            ('oIndexedDB' in IDB && IDB.oIndexedDB) ||
            ('msIndexedDB' in IDB && IDB.msIndexedDB));
    }

    // Detect browsers with known IndexedDB issues (e.g. Android pre-4.4)
    let poorIndexedDbSupport = false;
    if (
        typeof navigator !== 'undefined' &&
        // Not apparently defined in React Native
        navigator.userAgent &&
        ( // Ignore Node or other environments
            (
                // Bad non-Chrome Android support
                (/Android (?:2|3|4\.[0-3])/u).test(navigator.userAgent) &&
                !navigator.userAgent.includes('Chrome')
            ) ||
            (
                // Bad non-Safari iOS9 support (see <https://github.com/axemclion/IndexedDBShim/issues/252>)
                (!navigator.userAgent.includes('Safari') || navigator.userAgent.includes('Chrome')) && // Exclude genuine Safari: http://stackoverflow.com/a/7768006/271577
                // Detect iOS: http://stackoverflow.com/questions/9038625/detect-if-device-is-ios/9039885#9039885
                // and detect version 9: http://stackoverflow.com/a/26363560/271577
                (/(iPad|iPhone|iPod).* os 9_/ui).test(navigator.userAgent) &&
                (typeof window !== 'undefined' &&
                // eslint-disable-next-line no-undef -- Extra check
                !('MSStream' in window)) // But avoid IE11
            )
        )
    ) {
        poorIndexedDbSupport = true;
    }
    if (!CFG.DEFAULT_DB_SIZE) {
        CFG.DEFAULT_DB_SIZE = (
            ( // Safari currently requires larger size: (We don't need a larger size for Node as node-websql doesn't use this info)
                // https://github.com/axemclion/IndexedDBShim/issues/41
                // https://github.com/axemclion/IndexedDBShim/issues/115
                typeof navigator !== 'undefined' &&
                // React Native
                navigator.userAgent &&
                navigator.userAgent.includes('Safari') &&
                !navigator.userAgent.includes('Chrome')
            )
                ? 25
                : 4
        ) * 1024 * 1024;
    }
    if (!CFG.avoidAutoShim &&
        (!IDB.indexedDB || poorIndexedDbSupport) &&
        CFG.win.openDatabase !== undefined
    ) {
        IDB.shimIndexedDB.__useShim();
    } else {
        IDB.IDBDatabase = IDB.IDBDatabase ||
            ('webkitIDBDatabase' in IDB && IDB.webkitIDBDatabase);
        IDB.IDBTransaction = IDB.IDBTransaction ||
            ('webkitIDBTransaction' in IDB && IDB.webkitIDBTransaction) || {};
        IDB.IDBCursor = IDB.IDBCursor ||
            ('webkitIDBCursor' in IDB && IDB.webkitIDBCursor);
        IDB.IDBKeyRange = IDB.IDBKeyRange ||
            ('webkitIDBKeyRange' in IDB && IDB.webkitIDBKeyRange);
    }
    return /** @type {ShimmedObject} */ (IDB);
}

// Expose for ease in simulating such exceptions during testing
export {createDOMException};

export default setGlobalVars;

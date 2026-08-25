import {ShimEvent} from './Event.js';
import * as util from './util.js';

const readonlyProperties = ['oldVersion', 'newVersion'];

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {globalThis.Event & {
 *   __eventInitDict: {oldVersion?: Integer, newVersion?: Integer|null}
 * }} IDBVersionChangeEventFull
 */

/**
 * `extends ShimEvent` via a real `class`, now that `Event` (`ShimEvent`)
 *   is itself a real, constructible class in `eventtargeter` -- the old
 *   `ShimEvent.call(this, type)` + `Object.create(ShimEvent.prototype)`
 *   pattern this used to use is illegal for a real class constructor
 *   (only callable via `new`/`super()`).
 */
class IDBVersionChangeEvent extends ShimEvent {
    /**
     * @param {string} type
     */
    constructor (type /* , eventInitDict */) { // eventInitDict is a IDBVersionChangeEventInit (but is not defined as a global)
        super(type);
        const me = /** @type {IDBVersionChangeEventFull} */ (/** @type {unknown} */ (this));
        // @ts-expect-error It's ok
        me[Symbol.toStringTag] = 'IDBVersionChangeEvent';
        me.toString = function () {
            return '[object IDBVersionChangeEvent]';
        };
        // eslint-disable-next-line prefer-rest-params -- API
        me.__eventInitDict = arguments[1] || {};
    }
}

// @ts-expect-error Not part of the class body itself
IDBVersionChangeEvent.prototype[Symbol.toStringTag] = 'IDBVersionChangeEventPrototype';

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
readonlyProperties.forEach((prop) => {
    // Ensure for proper interface testing that "get <name>" is the function name
    const o = {
        /**
         * @returns {Integer|null}
         */
        get [prop] () {
            if (!(this instanceof IDBVersionChangeEvent)) {
                throw new TypeError('Illegal invocation');
            }
            const me = /** @type {IDBVersionChangeEventFull} */ (/** @type {unknown} */ (this));
            return (me.__eventInitDict && me.__eventInitDict[
                /** @type {keyof IDBVersionChangeEventFull['__eventInitDict']} */ (prop)
            ]) || (prop === 'oldVersion' ? 0 : null);
        }
    };
    const desc = /** @type {PropertyDescriptor} */ (
        Object.getOwnPropertyDescriptor(o, prop)
    );
    // desc.enumerable = true; // Default
    // desc.configurable = true; // Default
    Object.defineProperty(IDBVersionChangeEvent.prototype, prop, desc);
});

Object.defineProperty(IDBVersionChangeEvent, Symbol.hasInstance, {
    /**
     * @typedef {any} AnyValue
     */
    value:
        /**
         * @param {AnyValue} obj
         * @returns {boolean}
         */
        (obj) => util.isObj(obj) && 'oldVersion' in obj &&
        'defaultPrevented' in obj && typeof obj.defaultPrevented === 'boolean'
});

// A real class's own `.prototype` (and its `.constructor` back-reference)
//   is already set up correctly and non-writable/non-configurable per
//   spec, so no explicit setup is needed here.
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

export default IDBVersionChangeEvent;

import {ShimEvent} from './Event.js';
import * as util from './util.js';

const readonlyProperties = ['oldVersion', 'newVersion'];

/**
 * Babel apparently having a problem adding `hasInstance` to a class,
 * so we are redefining as a function.
 * @class
 * @param {string} type
 */
function IDBVersionChangeEvent (type /* , eventInitDict */) { // eventInitDict is a IDBVersionChangeEventInit (but is not defined as a global)
    // @ts-expect-error It's passing only one!
    ShimEvent.call(this, type);
    this[Symbol.toStringTag] = 'IDBVersionChangeEvent';
    this.toString = function () {
        return '[object IDBVersionChangeEvent]';
    };
    // eslint-disable-next-line prefer-rest-params
    this.__eventInitDict = arguments[1] || {};
}

// @ts-expect-error It's ok
IDBVersionChangeEvent.prototype = Object.create(ShimEvent.prototype);

IDBVersionChangeEvent.prototype[Symbol.toStringTag] = 'IDBVersionChangeEventPrototype';

/**
 * @typedef {number} Integer
 */

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
            return (this.__eventInitDict && this.__eventInitDict[prop]) || (prop === 'oldVersion' ? 0 : null);
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

Object.defineProperty(IDBVersionChangeEvent.prototype, 'constructor', {
    enumerable: false,
    writable: true,
    configurable: true,
    value: IDBVersionChangeEvent
});

Object.defineProperty(IDBVersionChangeEvent, 'prototype', {
    writable: false
});

export default IDBVersionChangeEvent;

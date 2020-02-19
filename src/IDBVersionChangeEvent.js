import {ShimEvent} from './Event.js';
import * as util from './util.js';

const readonlyProperties = ['oldVersion', 'newVersion'];

// Babel apparently having a problem adding `hasInstance` to a class, so we are redefining as a function
function IDBVersionChangeEvent (type /* , eventInitDict */) { // eventInitDict is a IDBVersionChangeEventInit (but is not defined as a global)
    ShimEvent.call(this, type);
    this[Symbol.toStringTag] = 'IDBVersionChangeEvent';
    this.toString = function () {
        return '[object IDBVersionChangeEvent]';
    };
    // eslint-disable-next-line prefer-rest-params
    this.__eventInitDict = arguments[1] || {};
}

IDBVersionChangeEvent.prototype = Object.create(ShimEvent.prototype);

IDBVersionChangeEvent.prototype[Symbol.toStringTag] = 'IDBVersionChangeEventPrototype';

readonlyProperties.forEach((prop) => {
    // Ensure for proper interface testing that "get <name>" is the function name
    const o = {
        get [prop] () {
            if (!(this instanceof IDBVersionChangeEvent)) {
                throw new TypeError('Illegal invocation');
            }
            return (this.__eventInitDict && this.__eventInitDict[prop]) || (prop === 'oldVersion' ? 0 : null);
        }
    };
    const desc = Object.getOwnPropertyDescriptor(o, prop);
    // desc.enumerable = true; // Default
    // desc.configurable = true; // Default
    Object.defineProperty(IDBVersionChangeEvent.prototype, prop, desc);
});

Object.defineProperty(IDBVersionChangeEvent, Symbol.hasInstance, {
    value: (obj) => util.isObj(obj) && 'oldVersion' in obj && typeof obj.defaultPrevented === 'boolean'
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

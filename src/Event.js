import EventTarget from 'eventtarget';
import * as util from './util.js';

const ShimEvent = EventTarget.EventPolyfill;
const ProxyPolyfill = EventTarget.ProxyPolyfill;

function createEvent (type, debug, evInit) {
    const ev = new ShimEvent(type, evInit);
    ev.debug = debug;
    return ev;
}

// Babel apparently having a problem adding `hasInstance` to a class, so we are redefining as a function
function IDBVersionChangeEvent (type, eventInitDict) { // eventInitDict is a IDBVersionChangeEventInit (but is not defined as a global)
    ShimEvent.call(this, type);
    Object.defineProperty(this, 'oldVersion', {
        enumerable: true,
        configurable: true,
        get: function () {
            return eventInitDict.oldVersion;
        }
    });
    Object.defineProperty(this, 'newVersion', {
        enumerable: true,
        configurable: true,
        get: function () {
            return eventInitDict.newVersion;
        }
    });
}
IDBVersionChangeEvent.prototype = new ShimEvent('bogus');
IDBVersionChangeEvent.prototype.constructor = IDBVersionChangeEvent;

Object.defineProperty(IDBVersionChangeEvent, Symbol.hasInstance, {
    value: obj => util.isObj(obj) && 'oldVersion' in obj && typeof obj.defaultPrevented === 'boolean'
});

export {IDBVersionChangeEvent, createEvent, ShimEvent, ProxyPolyfill}; // Event not currently in use

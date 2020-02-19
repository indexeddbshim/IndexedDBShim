import {ShimEventTarget, ShimEvent, ShimCustomEvent} from 'eventtargeter';
import * as util from './util.js';

/**
 *
 * @param {string} type
 * @param {Any} debug
 * @param {EventInit} evInit
 * @returns {Event}
 */
function createEvent (type, debug, evInit) {
    const ev = new ShimEvent(type, evInit);
    ev.debug = debug;
    return ev;
}

// We don't add within polyfill repo as might not always be the desired implementation
Object.defineProperty(ShimEvent, Symbol.hasInstance, {
    value: (obj) => util.isObj(obj) && 'target' in obj && typeof obj.bubbles === 'boolean'
});

export {createEvent, ShimEvent, ShimCustomEvent, ShimEventTarget};

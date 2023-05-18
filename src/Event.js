import {ShimEventTarget, ShimEvent, ShimCustomEvent} from 'eventtargeter';
import * as util from './util.js';

/**
 * @typedef {Error} DebuggingError
 */

/**
 *
 * @param {string} type
 * @param {DebuggingError|null} [debug]
 * @param {EventInit} [evInit]
 * @returns {Event & {
 *   __legacyOutputDidListenersThrowError?: boolean
 * }}
 */
function createEvent (type, debug, evInit) {
    // @ts-expect-error It's ok
    const ev = new ShimEvent(type, evInit);
    ev.debug = debug;
    return ev;
}

// We don't add within polyfill repo as might not always be the desired implementation
Object.defineProperty(ShimEvent, Symbol.hasInstance, {
    /**
     * @typedef {any} AnyValue
     */
    value:
        /**
         * @param {AnyValue} obj
         * @returns {boolean}
         */
        (obj) => util.isObj(obj) && 'target' in obj && 'bubbles' in obj && typeof obj.bubbles === 'boolean'
});

export {createEvent, ShimEvent, ShimCustomEvent, ShimEventTarget};

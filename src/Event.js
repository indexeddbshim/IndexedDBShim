import {ShimEventTarget, ShimEvent, ShimCustomEvent} from 'eventtargeter';
import * as util from './util.js';

/**
 * @typedef {Error} DebuggingError
 */

/**
 * @typedef {Event & {
 *   __legacyOutputDidListenersThrowError?: boolean,
 *   debug?: DebuggingError|null
 * }} EventFull
 */

/**
 *
 * @param {string} type
 * @param {DebuggingError|null} [debug]
 * @param {EventInit} [evInit]
 * @returns {EventFull}
 */
function createEvent (type, debug, evInit) {
    // @ts-expect-error It's ok
    const ev = /** @type {EventFull} */ (new ShimEvent(type, evInit));
    ev.debug = debug;
    return ev;
}

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
// We don't add within polyfill repo as might not always be the desired implementation
Object.defineProperty(ShimEvent, Symbol.hasInstance, {
    /* eslint-enable unicorn/no-top-level-side-effects -- Would be good */
    value:
        /**
         * @param {unknown} obj
         * @returns {boolean}
         */
        (obj) => util.isObj(obj) && 'target' in obj && 'bubbles' in obj && typeof obj.bubbles === 'boolean'
});

export {createEvent, ShimEvent, ShimCustomEvent, ShimEventTarget};

export type DebuggingError = Error;
export type EventFull = Event & {
    __legacyOutputDidListenersThrowError?: boolean;
    debug?: DebuggingError | null;
};
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
export function createEvent(type: string, debug?: DebuggingError | null, evInit?: EventInit): EventFull;
import { ShimEvent } from 'eventtargeter';
import { ShimCustomEvent } from 'eventtargeter';
import { ShimEventTarget } from 'eventtargeter';
export { ShimEvent, ShimCustomEvent, ShimEventTarget };
//# sourceMappingURL=Event.d.ts.map
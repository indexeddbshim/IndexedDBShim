export default IDBVersionChangeEvent;
export type Integer = number;
export type IDBVersionChangeEventFull = globalThis.Event & {
    __eventInitDict: {
        oldVersion?: Integer;
        newVersion?: Integer | null;
    };
};
declare const IDBVersionChangeEvent_base: {
    new (type: string): {};
};
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
declare class IDBVersionChangeEvent extends IDBVersionChangeEvent_base {
    /**
     * @param {string} type
     */
    constructor(type: string, ...args: any[]);
}
//# sourceMappingURL=IDBVersionChangeEvent.d.ts.map
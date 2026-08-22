export default IDBVersionChangeEvent;
export type Integer = number;
export type IDBVersionChangeEventFull = globalThis.Event & {
    __eventInitDict: {
        oldVersion?: Integer;
        newVersion?: Integer | null;
    };
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
 * Babel apparently having a problem adding `hasInstance` to a class,
 * so we are redefining as a function.
 * @class
 * @param {string} type
 * @this {IDBVersionChangeEventFull}
 */
declare function IDBVersionChangeEvent(this: IDBVersionChangeEventFull, type: string, ...args: any[]): void;
declare class IDBVersionChangeEvent {
    /**
     * @typedef {number} Integer
     */
    /**
     * @typedef {globalThis.Event & {
     *   __eventInitDict: {oldVersion?: Integer, newVersion?: Integer|null}
     * }} IDBVersionChangeEventFull
     */
    /**
     * Babel apparently having a problem adding `hasInstance` to a class,
     * so we are redefining as a function.
     * @class
     * @param {string} type
     * @this {IDBVersionChangeEventFull}
     */
    constructor(this: IDBVersionChangeEventFull, type: string, ...args: any[]);
    toString: () => string;
    __eventInitDict: any;
    [Symbol.toStringTag]: string;
}
//# sourceMappingURL=IDBVersionChangeEvent.d.ts.map
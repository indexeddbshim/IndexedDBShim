export type AnyValue = any;
/**
 * We are keeping the callback approach for now in case we wish to reexpose
 * `Blob`, `File`, `FileList` asynchronously (though in such a case, we
 * should probably refactor as a Promise).
 * @param {AnyValue} obj
 * @param {(str: string) => void} [func]
 * @throws {Error}
 * @returns {string}
 */
export function encode(obj: AnyValue, func?: (str: string) => void): string;
/**
 * @typedef {any} AnyValue
 */
/**
 * @param {string} obj
 * @returns {AnyValue}
 */
export function decode(obj: string): AnyValue;
/**
 * @param {AnyValue} val
 * @returns {AnyValue}
 */
export function clone(val: AnyValue): AnyValue;
/**
 * Per spec, a transaction must appear inactive to any code that runs
 *   reentrantly *during* the structured clone of a value passed to
 *   `add()`/`put()`/`IDBCursor#update()` (e.g. a getter on the value being
 *   stored) -- even though the transaction is otherwise active for the
 *   duration of that same call. `__active` is restored in a `finally` so a
 *   `DataCloneError` (or any other throw from `clone()`) can't leave the
 *   transaction permanently stuck inactive.
 * @param {{__active: boolean}} transaction
 * @param {AnyValue} val
 * @returns {AnyValue}
 */
export function cloneWithInactiveTransaction(transaction: {
    __active: boolean;
}, val: AnyValue): AnyValue;
/**
 * @param {(preset: import('typeson-registry').Preset) =>
 *   import('typeson-registry').Preset} func
 * @returns {void}
 */
export function register(func: (preset: import("typeson-registry").Preset) => import("typeson-registry").Preset): void;
//# sourceMappingURL=Sca.d.ts.map
export type Integer = number;
export type AnyClass = Function;
export type AnyValue = any;
/**
 * The escaping of unmatched surrogates was needed by Chrome but not Node.
 * @param {string} arg
 * @returns {string}
 */
export function escapeSQLiteStatement(arg: string): string;
/**
 * @param {string} arg
 * @returns {string}
 */
export function unescapeSQLiteResponse(arg: string): string;
/**
 * @param {string} db
 * @throws {Error}
 * @returns {string}
 */
export function escapeDatabaseNameForSQLAndFiles(db: string): string;
/**
 * Not in use internally but supplied for convenience.
 * @param {string} db
 * @returns {string}
 */
export function unescapeDatabaseNameForSQLAndFiles(db: string): string;
/**
 * @param {string} store
 * @returns {string}
 */
export function escapeStoreNameForSQL(store: string): string;
/**
 * @param {string} index
 * @returns {string}
 */
export function escapeIndexNameForSQL(index: string): string;
/**
 * @param {string} index
 * @returns {string}
 */
export function escapeIndexNameForSQLKeyColumn(index: string): string;
/**
 * @todo Didn't need to escape `%`. Do we still need this escape?
 * @param {string} str
 * @returns {string}
 */
export function sqlLIKEEscape(str: string): string;
/**
 * @param {string} arg
 * @returns {string}
 */
export function sqlQuote(arg: string): string;
/**
 * Minimal replacement for `path.join(base, name)` covering our only use case:
 *   `name` is always a bare file name (no separators and no `.`/`..`), and
 *   `base` is a directory path expected to be absolute and normalized (an
 *   empty string means the current working directory). Unlike `path.join`,
 *   this performs no `.`/`..` resolution. It reuses the separator style of
 *   `base` (backslash only when `base` uses backslashes and no forward
 *   slashes, i.e. a Windows path), otherwise `/`; Node's `fs`, SQLite, and
 *   `websql-configurable` accept either separator on Windows regardless.
 *   Avoiding `node:path` keeps browser bundles free of a path polyfill.
 * @param {string} base
 * @param {string} name
 * @returns {string}
 */
export function joinPath(base: string, name: string): string;
/**
 * @typedef {Function} AnyClass
 */
/**
 *
 * @param {AnyValue} obj
 * @param {AnyClass} Clss
 * @returns {boolean}
 */
export function instanceOf(obj: AnyValue, Clss: AnyClass): boolean;
/**
 *
 * @param {AnyValue} obj
 * @returns {obj is object}
 */
export function isObj(obj: AnyValue): obj is object;
/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
export function isDate(obj: object): boolean;
/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
export function isBlob(obj: object): boolean;
/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
export function isRegExp(obj: object): boolean;
/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
export function isFile(obj: object): boolean;
/**
 *
 * @param {AnyValue} obj
 * @returns {boolean}
 */
export function isBinary(obj: AnyValue): boolean;
/**
 *
 * @param {AnyValue} obj
 * @returns {boolean}
 */
export function isIterable(obj: AnyValue): boolean;
/**
 *
 * @param {object} obj
 * @param {string[]} props
 * @returns {void}
 */
export function defineOuterInterface(obj: object, props: string[]): void;
/**
 *
 * @param {object} obj
 * @param {string[]} props
 * @returns {void}
 */
export function defineReadonlyOuterInterface(obj: object, props: string[]): void;
/**
 *
 * @param {object & {
 *   [key: string]: any
 * }} obj
 * @param {string[]} listeners
 * @returns {void}
 */
export function defineListenerProperties(obj: object & {
    [key: string]: any;
}, listeners: string[]): void;
/**
 *
 * @param {object} obj
 * @param {string|string[]} props
 * @param {null|{
 *   [key: string]: any
 * }} getter
 * @returns {void}
 */
export function defineReadonlyProperties(obj: object, props: string | string[], getter?: null | {
    [key: string]: any;
}): void;
/**
 * `X.prototype.method = function (...) {}` (an assignment to a
 * `MemberExpression`, as used throughout this codebase for IDB
 * interface operations) does not get its `name` inferred by the
 * engine the way object-literal method shorthand or a plain variable
 * assignment would, so it is left as `''`. Per Web IDL, an operation's
 * function object must have its `name` set to the operation's
 * identifier, so call this once all of an interface's own-property
 * operations have been assigned onto its prototype (or, for static
 * operations, onto the constructor itself) to patch any still-empty
 * names in place.
 * @param {object} obj
 * @returns {void}
 */
export function setOperationNames(obj: object): void;
/**
 *
 * @param {string|string[]} keyPath
 * @returns {boolean}
 */
export function isValidKeyPath(keyPath: string | string[]): boolean;
/**
 * @param {number} number
 * @param {"unsigned long long"|"unsigned long"} type
 * @throws {Error|TypeError}
 * @returns {number}
 */
export function enforceRange(number: number, type: "unsigned long long" | "unsigned long"): number;
/**
 * @typedef {any} AnyValue
 */
/**
 * @param {AnyValue} v
 * @param {boolean} [treatNullAs]
 * @returns {string}
 */
export function convertToDOMString(v: AnyValue, treatNullAs?: boolean): string;
/**
 *
 * @param {AnyValue} val
 * @returns {string|string[]}
 */
export function convertToSequenceDOMString(val: AnyValue): string | string[];
/**
 * @param {AnyValue} v
 * @returns {v is null|undefined}
 */
export function isNullish(v: AnyValue): v is null | undefined;
/**
 * @param {() => void} fn
 * @returns {void}
 */
export function runContinuationSafely(fn: () => void): void;
//# sourceMappingURL=util.d.ts.map
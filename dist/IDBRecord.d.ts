export default IDBRecord;
export type IDBRecordFull = {
    [Symbol.toStringTag]: "IDBRecord";
    __key: import("./Key.js").Key;
    __primaryKey: import("./Key.js").Key;
    __value: import("./Key.js").Value;
    key: import("./Key.js").Key;
    primaryKey: import("./Key.js").Key;
    value: import("./Key.js").Value;
};
/**
 * @typedef {{
 *   [Symbol.toStringTag]: 'IDBRecord',
 *   __key: import('./Key.js').Key,
 *   __primaryKey: import('./Key.js').Key,
 *   __value: import('./Key.js').Value,
 *   key: import('./Key.js').Key,
 *   primaryKey: import('./Key.js').Key,
 *   value: import('./Key.js').Value
 * }} IDBRecordFull
 */
/**
 * The record type returned by `IDBObjectStore`/`IDBIndex#getAllRecords()`
 *   (IndexedDB 3.0). Structured the same way as `IDBCursor` -- a public
 *   constructor that always throws, with real instances only ever produced
 *   internally via `__createInstance` -- so a record can't be directly
 *   instantiated by script.
 * @see https://w3c.github.io/IndexedDB/#record-interface
 * @throws {TypeError}
 * @class
 */
export function IDBRecord(): void;
export class IDBRecord {
}
export namespace IDBRecord {
    /**
     * @param {import('./Key.js').Key} key
     * @param {import('./Key.js').Key} primaryKey
     * @param {import('./Key.js').Value} value
     * @returns {IDBRecordFull}
     */
    function __createInstance(key: import("./Key.js").Key, primaryKey: import("./Key.js").Key, value: import("./Key.js").Value): IDBRecordFull;
}
//# sourceMappingURL=IDBRecord.d.ts.map
export default SQLiteDatabase;
export type SQLProfileCallback = (sql: string, duration: number) => void;
export type SQLTraceCallback = ((sql: string) => void) | undefined;
/**
 * @class
 * @param {string} name
 * @param {{busyTimeout?: number, trace?: (sql: string) => void, profile?: SQLProfileCallback}} [opts]
 * @this {{_db: any, _qFilePath: string}}
 * @returns {void}
 */
declare function SQLiteDatabase(this: {
    _db: any;
    _qFilePath: string;
}, name: string, opts?: {
    busyTimeout?: number;
    trace?: (sql: string) => void;
    profile?: SQLProfileCallback;
}): void;
declare class SQLiteDatabase {
    /**
     * @class
     * @param {string} name
     * @param {{busyTimeout?: number, trace?: (sql: string) => void, profile?: SQLProfileCallback}} [opts]
     * @this {{_db: any, _qFilePath: string}}
     * @returns {void}
     */
    constructor(this: {
        _db: any;
        _qFilePath: string;
    }, name: string, opts?: {
        busyTimeout?: number;
        trace?: (sql: string) => void;
        profile?: SQLProfileCallback;
    });
    _qFilePath: string;
    _db: any;
    /**
     * @param {{sql: string, args: unknown[]}[]} queries
     * @param {boolean} readOnly
     * @param {(err: Error|null, results?: SQLiteResult[]) => void} callback
     * @returns {void}
     */
    exec(queries: {
        sql: string;
        args: unknown[];
    }[], readOnly: boolean, callback: (err: Error | null, results?: SQLiteResult[]) => void): void;
}
/**
 *
 */
declare class SQLiteResult {
    /**
     * @param {Error|null|undefined} error
     * @param {number|undefined} [insertId]
     * @param {number} [rowsAffected]
     * @param {object[]} [rows]
     */
    constructor(error: Error | null | undefined, insertId?: number | undefined, rowsAffected?: number, rows?: object[]);
    error: Error | null | undefined;
    insertId: number | undefined;
    rowsAffected: number | undefined;
    rows: object[] | undefined;
}
//# sourceMappingURL=nodeSQLiteDatabase.d.ts.map
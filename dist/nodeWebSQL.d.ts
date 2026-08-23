export default nodeWebSQL;
export type SQLiteDatabaseInstance = {
    _db: any;
    exec: (typeof SQLiteDatabase)["prototype"]["exec"];
};
/**
 * `websql-configurable`'s `customOpenDatabase` always calls this via `new`
 *   (see its `custom.js`: `new SQLiteDatabase(dbName, sqliteOpts)`), so this
 *   is typed with a construct signature even though `wrappedSQLiteDatabase`
 *   below is written as a plain function -- that's a deliberate, working JS
 *   idiom (a plain function invoked with `new` that explicitly `return`s an
 *   object yields that object as the `new` expression's result, overriding
 *   the default "return `this`" behavior), not something TypeScript can
 *   verify structurally.
 */
export type SQLiteDatabaseConstructor = new (name: string, opts?: any) => SQLiteDatabaseInstance;
declare const nodeWebSQL: (...args: unknown[]) => import("websql-configurable/lib/websql/WebSQLDatabase.js").default;
import SQLiteDatabase from './nodeSQLiteDatabase.js';
//# sourceMappingURL=nodeWebSQL.d.ts.map
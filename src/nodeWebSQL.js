import customOpenDatabase from 'websql-configurable/custom/index.js';
import SQLiteDatabase from 'websql-configurable/lib/sqlite/SQLiteDatabase.js';
import CFG from './CFG.js';

/**
 * @typedef {{
 *   _db: unknown,
 *   exec: typeof SQLiteDatabase['prototype']['exec']
 * }} SQLiteDatabaseInstance
 */

/**
 * `websql-configurable`'s `customOpenDatabase` always calls this via `new`
 *   (see its `custom.js`: `new SQLiteDatabase(dbName, sqliteOpts)`), so this
 *   is typed with a construct signature even though `wrappedSQLiteDatabase`
 *   below is written as a plain function -- that's a deliberate, working JS
 *   idiom (a plain function invoked with `new` that explicitly `return`s an
 *   object yields that object as the `new` expression's result, overriding
 *   the default "return `this`" behavior), not something TypeScript can
 *   verify structurally.
 * @typedef {new (
 *   name: string,
 *   opts?: import('websql-configurable/lib/sqlite/SQLiteDatabase.js').SQLiteDatabaseOptions
 * ) => SQLiteDatabaseInstance} SQLiteDatabaseConstructor
 */

/**
 * @param {string} name
 * @returns {SQLiteDatabaseInstance}
 */
function wrappedSQLiteDatabase (name) {
    // @ts-ignore It's ok; needed under some TS versions
    const db = new SQLiteDatabase(name, {});
    if (CFG.sqlBusyTimeout) {
        db.configure('busyTimeout', /** @type {number} */ (CFG.sqlBusyTimeout)); // Default is 1000
    }
    if (CFG.sqlTrace) {
        db.configure('trace', CFG.sqlTrace);
    }
    if (CFG.sqlProfile) {
        db.configure('profile', CFG.sqlProfile);
    }
    if (CFG.sqlMemoryQuota) {
        db.configure('memoryQuota', /** @type {number} */ (CFG.sqlMemoryQuota));
    }
    return db;
}

// `concurrentReaders` is off by default in `websql-configurable` itself (to
//   preserve the WebSQL spec's strict, one-at-a-time transaction ordering
//   that library's own test suite depends on), but IndexedDBShim only ever
//   uses it as an internal SQL execution engine -- it doesn't need or expose
//   that ordering guarantee itself -- so it's safe, and needed, to opt in
//   here: without it, two same-scope `readonly` IDBTransactions can deadlock
//   waiting on each other (see `transaction-scheduling-within-database.any.js`).
const nodeWebSQL = customOpenDatabase(/** @type {SQLiteDatabaseConstructor} */ (/** @type {unknown} */ (wrappedSQLiteDatabase)), {websql: {concurrentReaders: true}});
export default nodeWebSQL;

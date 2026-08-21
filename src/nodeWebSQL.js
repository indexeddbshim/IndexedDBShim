import customOpenDatabase from 'websql-configurable/custom/index.js';
import SQLiteDatabase from './nodeSQLiteDatabase.js';
import CFG from './CFG.js';

/**
 * @typedef {{
 *   _db: any,
 *   exec: typeof SQLiteDatabase['prototype']['exec']
 * }} SQLiteDatabaseInstance
 */

/**
 * @param {string} name
 * @returns {SQLiteDatabaseInstance}
 */
function wrappedSQLiteDatabase (name) {
    // @ts-ignore It's ok; needed under some TS versions
    const db = new SQLiteDatabase(name, {});
    if (CFG.sqlBusyTimeout) {
        db._db.configure('busyTimeout', /** @type {number} */ (CFG.sqlBusyTimeout)); // Default is 1000
    }
    if (CFG.sqlTrace) {
        db._db.configure('trace', CFG.sqlTrace);
    }
    if (CFG.sqlProfile) {
        db._db.configure('profile', CFG.sqlProfile);
    }
    return db;
}

const nodeWebSQL = customOpenDatabase(wrappedSQLiteDatabase, {});
export default nodeWebSQL;

import customOpenDatabase from 'websql/custom/index.js';
import SQLiteDatabase from 'websql/lib/sqlite/SQLiteDatabase.js';
import CFG from './CFG.js';

function wrappedSQLiteDatabase (name) {
    const db = new SQLiteDatabase(name);
    if (CFG.sqlBusyTimeout) {
        db._db.configure('busyTimeout', CFG.sqlBusyTimeout); // Default is 1000
    }
    if (CFG.sqlTrace) {
        db._db.configure('trace', CFG.sqlTrace);
    }
    if (CFG.sqlProfile) {
        db._db.configure('profile', CFG.sqlProfile);
    }
    return db;
}

const nodeWebSQL = customOpenDatabase(wrappedSQLiteDatabase);
export default nodeWebSQL;

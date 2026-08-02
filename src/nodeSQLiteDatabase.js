import Database from 'better-sqlite3';

/**
 *
 */
class SQLiteResult {
    /**
     * @param {Error|null|undefined} error
     * @param {number|undefined} insertId
     * @param {number} rowsAffected
     * @param {object[]} rows
     */
    constructor (error, insertId, rowsAffected, rows) {
        this.error = error;
        this.insertId = insertId;
        this.rowsAffected = rowsAffected;
        this.rows = rows;
    }
}

const READ_ONLY_ERROR = new Error(
    'could not prepare statement (23 not authorized)'
);

/**
 * @typedef {(sql: string, duration: number) => void} SQLProfileCallback
 */

/**
 * @typedef {((sql: string) => void)|undefined} SQLTraceCallback
 */

/**
 * @param {string} name
 * @param {{busyTimeout?: number, trace?: (sql: string) => void, profile?: SQLProfileCallback}} [opts]
 */
function SQLiteDatabase (name, opts = {}) {
    const db = new Database(name);

    /** @type {SQLTraceCallback} */
    // eslint-disable-next-line prefer-destructuring -- TS
    let trace = opts.trace;
    /** @type {SQLProfileCallback|undefined} */
    // eslint-disable-next-line prefer-destructuring -- TS
    let profile = opts.profile;

    if (opts.busyTimeout) {
        db.pragma('busy_timeout = ' + Number(opts.busyTimeout));
    }

    this._db = {
        _db: db,
        /**
         * Compatibility with node-sqlite3's configure API.
         * @param {'busyTimeout'|'trace'|'profile'} option
         * @param {number|((sql: string, duration?: number) => void)} value
         * @returns {void}
         */
        configure (option, value) {
            if (option === 'busyTimeout') {
                db.pragma('busy_timeout = ' + Number(/** @type {number} */ (value)));
                return;
            }
            if (option === 'trace') {
                trace = /** @type {(sql: string) => void} */ (value);
                return;
            }
            if (option === 'profile') {
                profile = /** @type {SQLProfileCallback} */ (value);
            }
        },
        /**
         * Compatibility with callback-oriented close semantics.
         * @param {(err?: Error|null) => void} [cb]
         * @returns {void}
         */
        close (cb) {
            try {
                db.close();
                if (cb) {
                    cb(null);
                }
            } catch (err) {
                if (cb) {
                    cb(/** @type {Error} */ (err));
                }
            }
        },
        getTrace () {
            return trace;
        },
        getProfile () {
            return profile;
        }
    };
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {string} sql
 * @param {unknown[]} args
 * @returns {object[]}
 */
function runSelect (db, sql, args) {
    const stmt = db.prepare(sql);
    return stmt.reader ? stmt.all(...args) : [];
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {string} sql
 * @param {unknown[]} args
 * @returns {import('better-sqlite3').RunResult}
 */
function runNonSelect (db, sql, args) {
    const stmt = db.prepare(sql);
    return stmt.run(...args);
}

/**
 *
 */
SQLiteDatabase.prototype.exec = function exec (queries, readOnly, callback) {
    const db = this._db._db;
    const len = queries.length;
    const results = Array.from({length: len});

    for (let i = 0; i < len; i++) {
        const query = queries[i];
        const {sql, args} = query;
        const isSelect = (/^\s*SELECT\b/iu).test(sql);
        if (readOnly && !isSelect) {
            results[i] = new SQLiteResult(READ_ONLY_ERROR);
            continue;
        }
        const trace = this._db.getTrace();
        const profile = this._db.getProfile();
        const start = profile ? process.hrtime.bigint() : 0n;
        try {
            if (trace) {
                trace(sql);
            }
            if (isSelect) {
                const rows = runSelect(db, sql, args);
                results[i] = new SQLiteResult(null, undefined, 0, rows);
            } else {
                const executionResult = runNonSelect(db, sql, args);
                const insertId = Number(executionResult.lastInsertRowid);
                results[i] = new SQLiteResult(null, insertId, executionResult.changes, []);
            }
        } catch (err) {
            results[i] = new SQLiteResult(/** @type {Error} */ (err));
        } finally {
            if (profile) {
                profile(sql, Number(process.hrtime.bigint() - start));
            }
        }
    }
    queueMicrotask(() => {
        callback(null, results);
    });
};

export default SQLiteDatabase;

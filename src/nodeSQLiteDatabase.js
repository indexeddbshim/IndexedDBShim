import Database from 'better-sqlite3';

/**
 *
 */
class SQLiteResult {
    /**
     * @param {Error|null|undefined} error
     * @param {number|undefined} [insertId]
     * @param {number} [rowsAffected]
     * @param {object[]} [rows]
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
 * @class
 * @param {string} name
 * @param {{busyTimeout?: number, trace?: (sql: string) => void, profile?: SQLProfileCallback}} [opts]
 * @this {{_db: any}}
 * @returns {void}
 */
function SQLiteDatabase (name, opts = {}) {
    /** @type {import('better-sqlite3').Database} */
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

    // Kept untyped (rather than the better-sqlite3 `Database` type) since that
    //  type is internal to `@types/better-sqlite3` and can't be named in this
    //  file's emitted declaration.
    this._db = /** @type {any} */ ({
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
                    return cb(null);
                }
            } catch (err) {
                if (cb) {
                    return cb(/** @type {Error} */ (err));
                }
            }
            return undefined;
        },
        getTrace () {
            return trace;
        },
        getProfile () {
            return profile;
        }
    });
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {string} sql
 * @param {unknown[]} args
 * @returns {object[]}
 */
function runSelect (db, sql, args) {
    const stmt = db.prepare(sql);
    return stmt.reader ? /** @type {object[]} */ (stmt.all(...args)) : [];
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
 * @param {{sql: string, args: unknown[]}[]} queries
 * @param {boolean} readOnly
 * @param {(err: Error|null, results?: SQLiteResult[]) => void} callback
 * @returns {void}
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
        // eslint-disable-next-line unicorn/prefer-bigint-literals -- `0n` needs ES2020+ target for tsc
        const start = profile ? process.hrtime.bigint() : BigInt(0);
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
    // A real timer (not `queueMicrotask`) so this yields to the macrotask
    //   queue: code that synchronously issues a new request from within
    //   each request's callback (e.g. to keep a transaction alive) would
    //   otherwise chain microtask to microtask forever, starving out any
    //   `setTimeout`-based code (including IndexedDB's own internal request
    //   scheduling) that never gets a turn to run.
    setTimeout(() => {
        callback(null, results);
    }, 0);
};

export default SQLiteDatabase;

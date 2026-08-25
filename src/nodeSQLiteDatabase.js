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

// Two separate `better-sqlite3` connections (i.e., two separate
//   `SQLiteDatabase` instances) can legitimately point at the same
//   underlying file at once -- e.g. an old, about-to-close IndexedDB
//   connection and a newly-opened one during an upgrade. `PRAGMA
//   busy_timeout` can't safely arbitrate between them here: it blocks the
//   single JS thread synchronously while it retries, but the lock holder's
//   own release is itself scheduled via `setImmediate` below, which can
//   never fire while that retry loop is blocking the same thread -- so
//   instead of waiting, a second connection's write just fails with
//   "database is locked".
//
// `fileReaders`/`fileWriter` implement a simple (not starvation-proof --
//   see the release loop below) reader/writer lock per file path instead:
//   any number of `readonly` transactions may hold the file concurrently,
//   matching what SQLite itself already natively supports (multiple
//   readers never need to exclude each other, only a writer needs
//   exclusivity), while a non-`readonly` transaction still waits for
//   exclusive access -- no concurrent readers, no concurrent writer. A
//   simple single-owner mutex (this file's prior implementation) would
//   otherwise serialize even purely-concurrent-reader scenarios that
//   never touch a writer at all, for no reason `better-sqlite3`/SQLite
//   itself requires.
/** @type {Map<string, Set<{_db: any, _qFilePath: string}>>} */
const fileReaders = new Map();
/** @type {Map<string, {_db: any, _qFilePath: string}>} */
const fileWriter = new Map();
/** @type {Map<string, {isReader: boolean, resume: () => void}[]>} */
const fileWaiters = new Map();
const beginRe = /^\s*BEGIN\b/iu;
const endRe = /^\s*(END|COMMIT|ROLLBACK)\b/iu;

/**
 * @class
 * @param {string} name
 * @param {{busyTimeout?: number, trace?: (sql: string) => void, profile?: SQLProfileCallback}} [opts]
 * @this {{_db: any, _qFilePath: string}}
 * @returns {void}
 */
function SQLiteDatabase (name, opts = {}) {
    this._qFilePath = name;
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
    // `:memory:` (SQLite/`better-sqlite3`'s own sentinel for an isolated,
    //   non-shared in-memory database) can never actually collide with a
    //   different connection -- each `new Database(':memory:')` call is
    //   already fully independent -- so there is nothing to serialize.
    const filePath = this._qFilePath === ':memory:' ? null : this._qFilePath;
    if (filePath && queries[0] && beginRe.test(queries[0].sql)) {
        const activeReaders = fileReaders.get(filePath);
        const hasActiveReaders = Boolean(activeReaders && activeReaders.size);
        const activeWriter = fileWriter.get(filePath);
        const blockedByWriter = Boolean(activeWriter && activeWriter !== this);
        const blocked = blockedByWriter || (!readOnly && hasActiveReaders);
        if (blocked) {
            const waiters = fileWaiters.get(filePath) || [];
            waiters.push({
                isReader: readOnly,
                resume: () => this.exec(queries, readOnly, callback)
            });
            fileWaiters.set(filePath, waiters);
            return;
        }
        if (readOnly) {
            if (activeReaders) {
                activeReaders.add(this);
            } else {
                fileReaders.set(filePath, new Set([this]));
            }
        } else {
            fileWriter.set(filePath, this);
        }
    }

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
    // A real macrotask (not `queueMicrotask`) so this yields properly:
    //   code that synchronously issues a new request from within each
    //   request's callback (e.g. to keep a transaction alive) would
    //   otherwise chain microtask to microtask forever, starving out any
    //   `setTimeout`-based code (including IndexedDB's own internal request
    //   scheduling) that never gets a turn to run. `setImmediate` (Node's
    //   "check" phase) still yields the same way `setTimeout(..., 0)` did,
    //   but runs sooner in Node's event loop.
    setImmediate(() => {
        // Release the file lock (if held) and hand it to the next waiting
        //   connection, if any, only once this transaction has genuinely
        //   finished -- and only here, on its own turn, so a resumed
        //   waiter's own `exec` call can't run reentrantly inside this one.
        // Checked across the whole batch, not just `queries[0]`: when a
        //   transaction's `BEGIN` and its later `ROLLBACK`/`COMMIT` are both
        //   queued synchronously before `websql-configurable`'s async flush
        //   gets a turn to run (e.g. an immediate `transaction.abort()`
        //   inside `onupgradeneeded`), they arrive coalesced into a single
        //   batch/`exec()` call, with the terminal statement anywhere but
        //   first -- so only checking `queries[0]` would acquire the lock
        //   and never see the matching release, deadlocking every later
        //   connection to the same file.
        if (filePath && queries.some((q) => endRe.test(q.sql))) {
            const activeReaders = fileReaders.get(filePath);
            if (activeReaders) {
                activeReaders.delete(this);
                if (!activeReaders.size) {
                    fileReaders.delete(filePath);
                }
            }
            if (fileWriter.get(filePath) === this) {
                fileWriter.delete(filePath);
            }
            // Resume as many waiters as the lock now genuinely allows:
            //   any leading run of readers (concurrent reads are always
            //   fine), then at most one writer, since a writer needs
            //   exclusivity -- stop there rather than looking past it.
            //   Not starvation-proof: a steady stream of arriving readers
            //   could in principle keep a waiting writer waiting
            //   indefinitely, but that's an acceptable tradeoff here over
            //   the added complexity of tracking arrival order across
            //   reader/writer kinds.
            const waiters = fileWaiters.get(filePath);
            if (waiters) {
                while (waiters.length) {
                    if (fileWriter.has(filePath)) {
                        break;
                    }
                    const next = waiters[0];
                    const stillHasReaders = fileReaders.get(filePath);
                    if (!next.isReader && stillHasReaders && stillHasReaders.size) {
                        break;
                    }
                    waiters.shift();
                    next.resume();
                    if (!next.isReader) {
                        // A writer just took exclusive ownership (inside
                        //   `resume()`, synchronously, via the acquire
                        //   logic above) -- nothing else may proceed now.
                        break;
                    }
                }
                if (!waiters.length) {
                    fileWaiters.delete(filePath);
                }
            }
        }
        callback(null, results);
    });
};

export default SQLiteDatabase;

(function () {
    'use strict';

    const databaseNamePrefix = 'indexeddbshim_test_database_';
    const databaseSuffix = ''; // '.sqlite' now added automatically by default
    let dbNameCounter = 0;

    /**
     * @typedef {number} Integer
     */

    /**
     * @typedef {(err: Error, db?: IDBDatabase) => void} Done
     */

    /**
     * This function runs before every test.
     */
    beforeEach(function () {
        // Track the current test
        util.currentTest = this.currentTest;

        // A list of databases created during this test
        util.currentTest.databases = [];

        // Increase the slowness threshold
        util.currentTest.slow(300);
    });

    /**
     * This function runs after every test.
     */
    afterEach(function (done) {
        // Delete all databases that were created during this test
        util.asyncForEach(util.currentTest.databases, done, function (dbName) {
            return env.indexedDB.deleteDatabase(dbName);
        });
    });

    const util = window.util = {
        sampleData: {
            /**
             * A custom class, used to test the IndexedDB structured
             * cloning algorithm.
             */
            Person,

            /**
             * A very long string :) .
             */
            veryLongString:
                // eslint-disable-next-line unicorn/no-new-array -- Easy way
                new Array(1001).join('1234567890') // 10,000 characters
        },

        /**
         * Skips the given test if the given condition is true.
         * @param {boolean} condition
         * @param {string} title
         * @param {(done?: () => void) => void} test
         * @returns {void}
         */
        skipIf (condition, title, test) {
            if (condition) {
                // This is a conditional skip
                it.skip(title, test);
            } else {
                it(title, test);
            }
        },

        /**
         * Creates a test database with one or more pre-defined schema items.
         *
         * @param {...string} schema One or more pre-defined schema items. (see {@link createSchemaItem})
         * @param {Done} done
         * @returns {void}
         */
        createDatabase (schema, done) {
            /* eslint-disable prefer-rest-params -- Convenient */
            schema = Array.prototype.slice.call(arguments, 0, -1);
            // eslint-disable-next-line unicorn/prefer-at -- Not available here
            done = arguments[arguments.length - 1];
            /* eslint-enable prefer-rest-params -- Convenient */

            util.generateDatabaseName(function (err, dbName) {
                // Open the database
                const open = env.indexedDB.open(dbName, 1);

                open.onerror = open.onblocked = function (event) {
                    let err;
                    try {
                        err = event.target.error;
                        console.error(err.message);
                    } finally {
                        done(err || 'Unknown Error');
                    }
                };

                // Add the specified schema items
                open.onupgradeneeded = function () {
                    open.transaction.onerror = open.onerror;
                    schema.forEach(function (schemaItem) {
                        createSchemaItem(open.transaction, schemaItem);
                    });
                };

                // Done!
                open.onsuccess = function () {
                    done(err, open.result);
                };
            });
        },

        /**
         * Returns all data in the given object store or index.
         *
         * @param {IDBObjectStore|IDBIndex} store The object store or index
         * @param {(err: Error, db:? IDBDatabase) => void} done
         * @returns {void}
         */
        getAll (store, done) {
            util.query(store, done);
        },

        /**
         * Queries data in the given object store or index.
         *
         * @param   {IDBObjectStore|IDBIndex}   store       The object store or index
         * @param   {IDBKeyRange}               [keyRange]  The key or key range to query
         * @param   {"next"|"prev"|"nextunique"|"prevunique"} [direction] The direction of the cursor
         * @param   {Done} done
         * @returns {void}
         */
        query (store, keyRange, direction, done) {
            if (arguments.length === 2) {
                done = keyRange;
                keyRange = undefined;
                direction = 'next';
            } else if (arguments.length === 3) {
                done = direction;
                direction = 'next';
            }
            const data = [];
            let safariPrimaryKeyOffset = 0, safariKeyOffset = 0;

            try {
                const open = keyRange === undefined ? store.openCursor() : store.openCursor(keyRange, direction);
                open.onerror = function () {
                    done(open.error, data);
                };
                open.onsuccess = function () {
                    const cursor = open.result;
                    if (cursor) {
                        const {key} = cursor;
                        const {primaryKey} = cursor;
                        if (env.isNative && env.browser.isSafari) {
                            // BUG: Safari has a bug with compound-key cursors
                            if (Array.isArray(primaryKey)) {
                                primaryKey.splice(0, safariPrimaryKeyOffset);
                                safariPrimaryKeyOffset += primaryKey.length;
                            }
                            if (Array.isArray(key)) {
                                key.splice(0, safariKeyOffset);
                                safariKeyOffset += key.length;
                            }
                        }

                        data.push({
                            primaryKey,
                            key,
                            value: cursor.value
                        });
                        cursor.continue();
                    } else {
                        done(null, data);
                    }
                };
            } catch (e) {
                done(e, data);
            }
        },

        /**
         * Generates a new database name that is unique for this test-run.
         * Database names are not re-used in a single test-run, because many native browser implementations
         * wait to delete databases until garbage collection occurs.  So attempting to re-use a database name
         * that is pending deletion will cause runtime errors.
         *
         * @param   {Done}  done
         * @returns {void}
         */
        generateDatabaseName (done) {
            dbNameCounter++;
            const dbName = databaseNamePrefix + dbNameCounter + databaseSuffix;

            // Remember this database name, so it can be deleted when the test is done
            util.currentTest.databases.push(dbName);

            // Just in case the database already exists, delete it
            const request = env.indexedDB.deleteDatabase(dbName);
            request.onsuccess = function () {
                done(null, dbName);
            };
            request.onerror = request.onblocked = function () {
                let err;
                try {
                    err = request.error;
                    console.error(err.message);
                } finally {
                    done(err || 'Unknown Error');
                }
            };
        },

        /**
         * An asynchronous for-each loop.
         *
         * @param   {string[]}     array       The array to loop through
         * @param   {Done}  done        Callback function (when the loop is finished or an error occurs)
         * @param   {(item: string, idx: Integer, next: (err: Error) => void) => IDBRequest|IDBTransaction}  iterator
         * The logic for each iteration.  Signature is `function(item, index, next)`.
         * Call `next()` to continue to the next item.  Call `next(Error)` to throw an error and cancel the loop.
         * Or don't call `next` at all to break out of the loop.
         *
         * If iterator returns an {@link IDBRequest} or {@link IDBTransaction} object,
         * then `next` will automatically be bound to the `onsuccess`, `onerror`, `onblocked`, and `oncomplete` events.
         * @returns {void}
         */
        asyncForEach (array, done, iterator) {
            let i = 0;
            return next();

            /**
             * @param {Error} err
             * @returns {void}
             */
            function next (err) {
                if (err) {
                    done(err);
                } else if (i >= array.length) {
                    done();
                } else if (i < array.length) {
                    const item = array[i++];
                    setTimeout(function () {
                        let nextCalled = false;

                        // Call the iterator function
                        const request = iterator(item, i - 1, function (err) {
                            if (!nextCalled) {
                                nextCalled = true;
                                return next(err);
                            }
                            return undefined;
                        });

                        // If it returned an IDBRequest or IDBTransaction, then bind to its events
                        if (typeof request === 'object') {
                            request.onsuccess = request.onerror = request.onblocked = request.oncomplete = function () {
                                if (!nextCalled) {
                                    nextCalled = true;
                                    let err;
                                    try {
                                        err = request.error;
                                    } catch (e) { /* Some browsers throw an error when accessing the error property */ }
                                    return next(err);
                                }
                                return undefined;
                            };
                        }
                    }, typeof window !== 'undefined' && typeof global === 'undefined' ? 0 : 300);
                }
            }
        },

        stubWindowOnerror (stateObj, cb) {
            // As Mocha or Sinon are apparently already using window.onerror, we provide the stubbing ourselves
            util._onerror = window.onerror;
            stateObj.erred = false;
            window.onerror = function () {
                stateObj.erred = true;
                if (cb) {
                    cb();
                    return;
                }
                // eslint-disable-next-line prefer-rest-params -- Convenient
                util._onerror.apply(window, arguments);
            };
        },
        restoreWindowOnerror () {
            window.onerror = util._onerror;
        }
    };

    /**
     * A class with instance and prototype properties.
     * Used to test the IndexedDB structured cloning algorithm.
     * @param {string} name
     * @param {Integer} age
     * @param {Date} dob
     * @param {boolean} isMarried
     * @returns {void}
     */
    function Person (name, age, dob, isMarried) {
        if (name) {
            this.name = name;
        }
        if (age) {
            this.age = age;
        }
        if (dob) {
            this.dob = dob;
        }
        if (isMarried) {
            this.isMarried = isMarried;
        }
    }

    Person.prototype.name = '';
    Person.prototype.age = 0;
    Person.prototype.dob = new Date(1900, 0, 1);
    Person.prototype.isMarried = false;

    /**
     * Creates a pre-defined schema item for use in a test.
     *
     * @param   {IDBTransaction}    tx              The database upgrade transaction
     * @param   {string}            schemaItem      The name of the schema item to create
     * @throws {Error} If not one of the predefined schema items
     * @returns {void}
     */
    function createSchemaItem (tx, schemaItem) {
        switch (schemaItem) {
        case 'out-of-line':
        case 'out-of-line-compound':
            tx.db.createObjectStore(schemaItem);
            break;
        case 'out-of-line-generated':
            tx.db.createObjectStore(schemaItem, {autoIncrement: true});
            break;
        case 'inline':
            tx.db.createObjectStore(schemaItem, {keyPath: 'id'});
            break;
        case 'inline-generated':
            tx.db.createObjectStore(schemaItem, {keyPath: 'id', autoIncrement: true});
            break;
        case 'inline-compound':
            tx.db.createObjectStore(schemaItem, {keyPath: ['id', 'name']});
            break;
        case 'dotted':
            tx.db.createObjectStore(schemaItem, {keyPath: 'name.first'});
            break;
        case 'dotted-generated':
            tx.db.createObjectStore(schemaItem, {keyPath: 'name.first', autoIncrement: true});
            break;
        case 'dotted-compound':
            tx.db.createObjectStore(schemaItem, {keyPath: ['id', 'name.first', 'name.last']});
            break;
        case 'inline-index':
            createIndex(schemaItem, 'id');
            break;
        case 'unique-index':
            createIndex(schemaItem, 'id', {unique: true});
            break;
        case 'multi-entry-index':
            createIndex(schemaItem, 'id', {multiEntry: true});
            break;
        case 'unique-multi-entry-index':
            createIndex(schemaItem, 'id', {unique: true, multiEntry: true});
            break;
        case 'dotted-index':
            createIndex(schemaItem, 'name.first');
            break;
        case 'compound-index':
            createIndex(schemaItem, ['id', 'name.first', 'name.last']);
            break;
        case 'compound-index-unique':
            createIndex(schemaItem, ['id', 'name.first', 'name.last'], {unique: true});
            break;
        default:
            throw new Error(schemaItem + ' is not one of the pre-defined schema items');
        }

        /**
         * Creates an index on all object stores.
         * @param {string} name
         * @param {string|string[]} keyPath
         * @param {IDBIndexParameters} options
         * @returns {void}
         */
        function createIndex (name, keyPath, options) {
            for (let i = 0; i < tx.db.objectStoreNames.length; i++) {
                const store = tx.objectStore(tx.db.objectStoreNames[i]);
                store.createIndex(name, keyPath, options);
            }
        }
    }
}());

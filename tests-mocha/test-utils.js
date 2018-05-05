/* eslint-env mocha */
/* globals env */
/* eslint-disable no-var */
(function () {
    'use strict';

    var databaseNamePrefix = 'indexeddbshim_test_database_';
    var databaseSuffix = ''; // '.sqlite' now added automatically by default
    var dbNameCounter = 0;
    var util;

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
     * This function runs after every test
     */
    afterEach(function (done) {
        // Delete all databases that were created during this test
        util.asyncForEach(util.currentTest.databases, done, function (dbName) {
            return env.indexedDB.deleteDatabase(dbName);
        });
    });

    util = window.util = {
        sampleData: {
            /**
             * A custom class, used to test the IndexedDB structured cloning algorithm
             */
            Person: Person,

            /**
             * A very long string :)
             */
            veryLongString: new Array(1001).join('1234567890')  // 10,000 characters
        },

        /**
         * Skips the given test if the given condition is true.
         * @param {boolean} condition
         * @param {string} title
         * @param {function} test
         */
        skipIf (condition, title, test) {
            if (condition) {
                it.skip(title, test);
            } else {
                it(title, test);
            }
        },

        /**
         * Creates a test database with one or more pre-defined schema items.
         *
         * @param   {...string}     schema      One or more pre-defined schema items. (see {@link createSchemaItem})
         * @param   {function}      done        `function(err, db)`
         */
        createDatabase (schema, done) {
            schema = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
            done = arguments[arguments.length - 1];

            util.generateDatabaseName(function (err, dbName) {
                // Open the database
                var open = env.indexedDB.open(dbName, 1);

                open.onerror = open.onblocked = function (event) {
                    var err;
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
         * @param   {IDBObjectStore|IDBIndex}   store   The object store or index
         * @param   {function}                  done    `function(err, data)`
         */
        getAll (store, done) {
            util.query(store, done);
        },

        /**
         * Queries data in the given object store or index.
         *
         * @param   {IDBObjectStore|IDBIndex}   store       The object store or index
         * @param   {IDBKeyRange}               [keyRange]  The key or key range to query
         * @param   {string}                    [direction] The direction of the cursor
         * @param   {function}                  done        `function(err, data)`
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
            var data = [];
            var safariPrimaryKeyOffset = 0, safariKeyOffset = 0;

            try {
                var open = keyRange === undefined ? store.openCursor() : store.openCursor(keyRange, direction);
                open.onerror = function () {
                    done(open.error, data);
                };
                open.onsuccess = function () {
                    var cursor = open.result;
                    if (cursor) {
                        var key = cursor.key;
                        var primaryKey = cursor.primaryKey;
                        if (env.isNative && env.browser.isSafari) {
                            // BUG: Safari has a bug with compound-key cursors
                            if (primaryKey instanceof Array) {
                                primaryKey.splice(0, safariPrimaryKeyOffset);
                                safariPrimaryKeyOffset += primaryKey.length;
                            }
                            if (key instanceof Array) {
                                key.splice(0, safariKeyOffset);
                                safariKeyOffset += key.length;
                            }
                        }

                        data.push({
                            primaryKey: primaryKey,
                            key: key,
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
         * @param   {function}  done    `function(err, dbName)`
         */
        generateDatabaseName (done) {
            dbNameCounter++;
            var dbName = databaseNamePrefix + dbNameCounter + databaseSuffix;

            // Remember this database name, so it can be deleted when the test is done
            util.currentTest.databases.push(dbName);

            // Just in case the database already exists, delete it
            var request = env.indexedDB.deleteDatabase(dbName);
            request.onsuccess = function () {
                done(null, dbName);
            };
            request.onerror = request.onblocked = function () {
                var err;
                try {
                    err = request.error;
                    console.error(err.message);
                } finally {
                    done(err || 'Unknown Error');
                }
            };
        },

        /**
         * An asynchronous for-each loop
         *
         * @param   {array}     array       The array to loop through
         *
         * @param   {function}  done        Callback function (when the loop is finished or an error occurs)
         *
         * @param   {function}  iterator
         * The logic for each iteration.  Signature is `function(item, index, next)`.
         * Call `next()` to continue to the next item.  Call `next(Error)` to throw an error and cancel the loop.
         * Or don't call `next` at all to break out of the loop.
         *
         * If iterator returns an {@link IDBRequest} or {@link IDBTransaction} object,
         * then `next` will automatically be bound to the `onsuccess`, `onerror`, `onblocked`, and `oncomplete` events.
         */
        asyncForEach (array, done, iterator) {
            var i = 0;
            next();

            function next (err) {
                if (err) {
                    done(err);
                } else if (i >= array.length) {
                    done();
                } else if (i < array.length) {
                    var item = array[i++];
                    setTimeout(function () {
                        var nextCalled = false;

                        // Call the iterator function
                        var request = iterator(item, i - 1, function (err) {
                            if (!nextCalled) {
                                nextCalled = true;
                                next(err);
                            }
                        });

                        // If it returned an IDBRequest or IDBTransaction, then bind to its events
                        if (typeof request === 'object') {
                            request.onsuccess = request.onerror = request.onblocked = request.oncomplete = function () {
                                if (!nextCalled) {
                                    nextCalled = true;
                                    var err;
                                    try {
                                        err = request.error;
                                    } catch (e) { /* Some browsers throw an error when accessing the error property */ }
                                    next(err);
                                }
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
                    return cb();
                }
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
     */
    function Person (name, age, dob, isMarried) {
        name && (this.name = name);
        age && (this.age = age);
        dob && (this.dob = dob);
        isMarried && (this.isMarried = isMarried);
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

        // Creates an index on all object stores
        function createIndex (name, keyPath, options) {
            for (var i = 0; i < tx.db.objectStoreNames.length; i++) {
                var store = tx.objectStore(tx.db.objectStoreNames[i]);
                store.createIndex(name, keyPath, options);
            }
        }
    }
})();

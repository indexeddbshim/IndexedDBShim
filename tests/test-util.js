(function() {
    'use strict';

    var databaseNamePrefix = 'IndexedDBShim_Test_Database_';
    var dbNameCounter = 0;

    var util = window.util = {
        /**
         * A custom class, used to test the IndexedDB structured cloning algorithm
         */
        Person: Person,


        /**
         * Creates a test database with one or more pre-defined schema items.
         *
         * @param   {...string}     schema      One or more pre-defined schema items. (see {@link createSchemaItem})
         * @param   {function}      done        `function(err, db)`
         */
        createDatabase: function(schema, done) {
            schema = Array.prototype.slice.call(arguments, 0, arguments.length - 1);
            done = arguments[arguments.length - 1];

            util.generateDatabaseName(function(err, dbName) {
                // Open the database
                var open = env.indexedDB.open(dbName, 1);

                open.onerror = open.onblocked = function() {
                    done(open.error);
                };

                // Add the specified schema items
                open.onupgradeneeded = function() {
                    schema.forEach(function(schemaItem) {
                        createSchemaItem(open.transaction, schemaItem);
                    });
                };

                // Done!
                open.onsuccess = function() {
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
        getAll: function(store, done) {
            var data = [];
            var safariKeyOffset = 0;

            try {
                var open = store.openCursor();
                open.onerror = function() {
                    done(open.error, data);
                };
                open.onsuccess = function() {
                    var cursor = open.result;
                    if (cursor) {
                        var key = cursor.key;
                        if (env.browser.isSafari && key instanceof Array) {
                            // BUG: Safari has a bug with compound-key cursors
                            key.splice(0, safariKeyOffset);
                            safariKeyOffset += key.length;
                        }

                        data.push({
                            key: key,
                            value: cursor.value
                        });
                        cursor.continue();
                    }
                    else {
                        done(null, data);
                    }
                };
            }
            catch (e) {
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
        generateDatabaseName: function(done) {
            dbNameCounter++;
            var dbName = databaseNamePrefix + dbNameCounter;

            // Remember this database name, so it can be deleted when the test is done
            util.currentTest.databases.push(dbName);

            // Just in case the database already exists, delete it
            var request = env.indexedDB.deleteDatabase(dbName);
            request.onsuccess = function() {
                done(null, dbName);
            };
            request.onerror = request.onblocked = function() {
                done(request.error, dbName);
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
        asyncForEach: function(array, done, iterator) {
            var i = 0;
            next();

            function next(err) {
                if (err) {
                    done(err);
                }
                else if (i >= array.length) {
                    done();
                }
                else if (i < array.length) {
                    var item = array[i++];
                    setTimeout(function() {
                        var nextCalled = false;

                        // Call the iterator function
                        var request = iterator(item, i - 1, function(err) {
                            if (!nextCalled) {
                                nextCalled = true;
                                next(err);
                            }
                        });

                        // If it returned an IDBRequest or IDBTransaction, then bind to its events
                        if (typeof(request) === 'object') {
                            request.onsuccess = request.onerror = request.onblocked = request.oncomplete = function() {
                                if (!nextCalled) {
                                    nextCalled = true;
                                    var err;
                                    try {
                                        err = request.error;
                                    }
                                    catch (e) {/* Some browsers throw an error when accessing the error property */}
                                    next(err);
                                }
                            };
                        }
                    }, 0);
                }
            }
        }
    };


    /**
     * A class with instance and prototype properties.
     * Used to test the IndexedDB structured cloning algorithm.
     */
    function Person(name, age, dob, isMarried) {
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
    function createSchemaItem(tx, schemaItem) {
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
            case 'compound-index-multi':
                createIndex(schemaItem, ['id', 'name.first', 'name.last'], {multiEntry: true});
                break;
            case 'compound-index-unique-multi':
                createIndex(schemaItem, ['id', 'name.first', 'name.last'], {unique: true, multiEntry: true});
                break;
            default:
                throw new Error(schemaItem + ' is not one of the pre-defined schema items');
        }

        // Creates an index on all object stores
        function createIndex(name, keyPath, options) {
            for (var i = 0; i < tx.db.objectStoreNames.length; i++) {
                var store = tx.objectStore(tx.db.objectStoreNames[i]);
                store.createIndex(name, keyPath, options);
            }
        }
    }


})();

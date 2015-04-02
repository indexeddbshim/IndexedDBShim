/*jshint globalstrict: true*/
'use strict';
(function(idbModules) {
    var DEFAULT_DB_SIZE = 4 * 1024 * 1024;
    if (!window.openDatabase) {
        return;
    }
    // The sysDB to keep track of version numbers for databases
    var sysdb = window.openDatabase("__sysdb__", 1, "System Database", DEFAULT_DB_SIZE);
    sysdb.transaction(function(tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);", []);
    }, function() {
        idbModules.DEBUG && console.log("Error in sysdb transaction - when creating dbVersions", arguments);
    });

    /**
     * IDBFactory Class
     * https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
     * @constructor
     */
    function IDBFactory() {
        // It's not safe to shim these on the global scope, because it could break other stuff.
        this.Event = idbModules.Event;
        this.DOMException = idbModules.DOMException;
        this.DOMError = idbModules.DOMError;
    }

    /**
     * The IndexedDB Method to create a new database and return the DB
     * @param {Object} name
     * @param {Object} version
     */
    IDBFactory.prototype.open = function(name, version) {
        var req = new idbModules.IDBOpenDBRequest();
        var calledDbCreateError = false;

        if (arguments.length === 0) {
            throw new TypeError('Database name is required');
        }
        else if (arguments.length === 2) {
            version = parseFloat(version);
            if (isNaN(version) || !isFinite(version) || version <= 0) {
                throw new TypeError('Invalid database version: ' + version);
            }
        }
        name = name + ''; // cast to a string

        function dbCreateError(err) {
            if (calledDbCreateError) {
                return;
            }
            calledDbCreateError = true;
            var evt = idbModules.util.createEvent("error", arguments);
            req.readyState = "done";
            req.error = err || "DOMError";
            idbModules.util.callback("onerror", req, evt);
        }

        function openDB(oldVersion) {
            var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
            req.readyState = "done";
            if (typeof version === "undefined") {
                version = oldVersion || 1;
            }
            if (version <= 0 || oldVersion > version) {
                var err = idbModules.util.createDOMError("VersionError", "An attempt was made to open a database using a lower version than the existing version.", version);
                dbCreateError(err);
                return;
            }

            db.transaction(function(tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexList BLOB)", [], function() {
                    tx.executeSql("SELECT * FROM __sys__", [], function(tx, data) {
                        var e = idbModules.util.createEvent("success");
                        req.source = req.result = new idbModules.IDBDatabase(db, name, version, data);
                        if (oldVersion < version) {
                            // DB Upgrade in progress
                            sysdb.transaction(function(systx) {
                                systx.executeSql("UPDATE dbVersions set version = ? where name = ?", [version, name], function() {
                                    var e = idbModules.util.createEvent("upgradeneeded");
                                    e.oldVersion = oldVersion;
                                    e.newVersion = version;
                                    req.transaction = req.result.__versionTransaction = new idbModules.IDBTransaction([], idbModules.IDBTransaction.VERSION_CHANGE, req.source);
                                    req.transaction.__addToTransactionQueue(function onupgradeneeded(tx, args, success) {
                                        idbModules.util.callback("onupgradeneeded", req, e);
                                        success();
                                    });
                                    req.transaction.__oncomplete = function() {
                                        req.transaction = null;
                                        var e = idbModules.util.createEvent("success");
                                        idbModules.util.callback("onsuccess", req, e);
                                    };
                                }, dbCreateError);
                            }, dbCreateError);
                        } else {
                            idbModules.util.callback("onsuccess", req, e);
                        }
                    }, dbCreateError);
                }, dbCreateError);
            }, dbCreateError);
        }

        sysdb.transaction(function(tx) {
            tx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data) {
                if (data.rows.length === 0) {
                    // Database with this name does not exist
                    tx.executeSql("INSERT INTO dbVersions VALUES (?,?)", [name, version || 1], function() {
                        openDB(0);
                    }, dbCreateError);
                } else {
                    openDB(data.rows.item(0).version);
                }
            }, dbCreateError);
        }, dbCreateError);

        return req;
    };

    IDBFactory.prototype.deleteDatabase = function(name) {
        var req = new idbModules.IDBOpenDBRequest();
        var calledDBError = false;
        var version = null;

        if (arguments.length === 0) {
            throw new TypeError('Database name is required');
        }
        name = name + ''; // cast to a string

        function dbError(msg) {
            if (calledDBError) {
                return;
            }
            req.readyState = "done";
            req.error = "DOMError";
            var e = idbModules.util.createEvent("error");
            e.message = msg;
            e.debug = arguments;
            idbModules.util.callback("onerror", req, e);
            calledDBError = true;
        }

        function deleteFromDbVersions() {
            sysdb.transaction(function(systx) {
                systx.executeSql("DELETE FROM dbVersions where name = ? ", [name], function() {
                    req.result = undefined;
                    var e = idbModules.util.createEvent("success");
                    e.newVersion = null;
                    e.oldVersion = version;
                    idbModules.util.callback("onsuccess", req, e);
                }, dbError);
            }, dbError);
        }

        sysdb.transaction(function(systx) {
            systx.executeSql("SELECT * FROM dbVersions where name = ?", [name], function(tx, data) {
                if (data.rows.length === 0) {
                    req.result = undefined;
                    var e = idbModules.util.createEvent("success");
                    e.newVersion = null;
                    e.oldVersion = version;
                    idbModules.util.callback("onsuccess", req, e);
                    return;
                }
                version = data.rows.item(0).version;
                var db = window.openDatabase(name, 1, name, DEFAULT_DB_SIZE);
                db.transaction(function(tx) {
                    tx.executeSql("SELECT * FROM __sys__", [], function(tx, data) {
                        var tables = data.rows;
                        (function deleteTables(i) {
                            if (i >= tables.length) {
                                // If all tables are deleted, delete the housekeeping tables
                                tx.executeSql("DROP TABLE __sys__", [], function() {
                                    // Finally, delete the record for this DB from sysdb
                                    deleteFromDbVersions();
                                }, dbError);
                            } else {
                                // Delete all tables in this database, maintained in the sys table
                                tx.executeSql("DROP TABLE " + idbModules.util.quote(tables.item(i).name), [], function() {
                                    deleteTables(i + 1);
                                }, function() {
                                    deleteTables(i + 1);
                                });
                            }
                        }(0));
                    }, function(e) {
                        // __sysdb table does not exist, but that does not mean delete did not happen
                        deleteFromDbVersions();
                    });
                }, dbError);
            });
        }, dbError);
        return req;
    };

    IDBFactory.prototype.cmp = function(key1, key2) {
        return idbModules.Key.encodeKey(key1) > idbModules.Key.encodeKey(key2) ? 1 : key1 === key2 ? 0 : -1;
    };


    idbModules.shimIndexedDB = new IDBFactory();
    idbModules.IDBFactory = IDBFactory;
}(idbModules));

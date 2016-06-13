require('./setup')
var assert = require('assert')

describe('Database', function() {
    it("Opening/Creating Database", function (done) {
        initionalSituation(function(){
            var request = indexedDb.open(dbName);

            request.onsuccess = function(e){
                assert.equal(e.target.result.name, dbName, "Database opened/created");
                // Necessary for indexeddb who work with setVersion
                assert.equal(parseInt(e.target.result.version), 1, "Database opened/created");
                e.target.result.close();
                done();
            };
            request.onerror = function(){
                assert.ok(false, "Creating database failed");
                done();
            };
            request.onupgradeneeded = function(e){
                assert.equal(e.type, "upgradeneeded", "Upgrading database");
            };
        }, done, assert);
    });

    it("Opening/Creating Database with version", function (done) {
        var version = 2;

        initionalSituation(function(){
            var request = indexedDb.open(dbName, version);

            request.onsuccess = function(e){
                assert.equal(e.target.result.name, dbName, "Database opened/created");
                // Necessary for indexeddb who work with setVersion
                assert.equal(parseInt(e.target.result.version), version, "Database version");
                e.target.result.close();
                done();
            };
            request.onerror = function(){
                assert.ok(false, "Creating database failed");
                done();
            };
            request.onupgradeneeded = function(e){
                assert.equal(e.type, "upgradeneeded", "Upgrading database");
                assert.equal(e.oldVersion, 0, "Old version");
                assert.equal(e.newVersion, version, "New version");
            };
        }, done, assert);
    });

    it("Opening existing Database", function (done) {
        initionalSituationDatabase(function () {
            var request = indexedDb.open(dbName);
            request.onsuccess = function(e){
                assert.equal(e.target.result.name, dbName, "Database opened/created");
                e.target.result.close();
                done();
            };
            request.onerror = function(){
                assert.ok(false, "Creating/opening database failed");
                done();
            };
            request.onupgradeneeded = function(e){
                assert.ok(false, "Upgrading database");
            };
        }, done, assert);
    });

    it("Opening existing Database with current version", function (done) {
        var version = 1;

        initionalSituationDatabase(function () {
            var request = indexedDb.open(dbName, version);
            request.onsuccess = function(e){
                assert.equal(e.target.result.name, dbName, "Database opened/created");
                assert.equal(parseInt(e.target.result.version), version, "Database version");
                e.target.result.close();
                done();
            };
            request.onerror = function(){
                assert.ok(false, "Creating/opening database failed");
                done();
            };
            request.onupgradeneeded = function(e){
                assert.ok(false, "Upgrading database");
            };
        }, done, assert);
    });

    it("Opening existing Database with lower version", function (done) {
        var version = 1;

        initionalSituationDatabaseVersion(function () {
            var request = indexedDb.open(dbName, version);

            request.onsuccess = function(e){
                assert.ok(false, "Database opened/created");
                e.target.result.close();
                done();
            };
            request.onerror = function(e){
                assert.equal(e.target.error.name, "VersionError", "Creating/Opening database failed");
                done();
            };
            request.onupgradeneeded = function(e){
                assert.ok(false, "Upgrading database");
            };
        }, done, assert);
    });

    it("Opening existing Database with higher version", function (done) {
        var version = 2;

        initionalSituationDatabase(function () {
            var request = indexedDb.open(dbName, version);

            request.onsuccess = function(e){
                assert.equal(e.target.result.name, dbName, "Database opened/created");
                assert.equal(e.target.result.version, version, "Database version");
                e.target.result.close();
                done();
            };
            request.onerror = function(){
                assert.ok(false, "Creating/Opening database failed");
                done();
            };
            request.onupgradeneeded = function(e){
                assert.equal("upgradeneeded", e.type, "Upgrading database");
                assert.equal(e.oldVersion, 1, "Old version");
                assert.equal(e.newVersion, version, "New version");
            };
        }, done, assert);
    });

    it("Deleting existing Database", function (done) {
        var request = indexedDb.open(dbName);

        request.onsuccess = function(e){
            e.target.result.close();
            var deleteRequest = indexedDb.deleteDatabase(dbName);

            deleteRequest.onsuccess = function(e){
                assert.ok(true, "Database removed");
                done();
            };
            deleteRequest.onerror = function(){
                assert.ok(false, "Deleting database failed: ");
                done();
            };
        };
        request.onerror = function(){
            assert.ok(false, msgCreatingInitialSituationFailed);
            done();
        };
    });

    it("Deleting non existing Database", function (done) {
        initionalSituation(function () {
            var deleteRequest = indexedDb.deleteDatabase(dbName);

            deleteRequest.onsuccess = function(e){
                assert.ok(true, "Database removed");
                done();
            };
            deleteRequest.onerror = function(){
                assert.ok(false, "Deleting database failed: ");
                done();
            };
        }, done, assert);
    });
    /* TODO add tests for version change event */
});

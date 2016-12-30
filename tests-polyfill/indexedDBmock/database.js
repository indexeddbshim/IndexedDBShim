describe('Database', function() {
    it("Opening/Creating Database", function (done) {
        initionalSituation(function(){
            var request = indexedDB.open(dbName);

            request.onsuccess = function(e){
                assert.equal(e.target.result.name, dbName, "Database opened/created");
                // Necessary for indexedDB who work with setVersion
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
            request.onblocked = function(e){
                assert.ok(false, "Blocked database");
            };
        }, done, assert);
    });

    it("Opening/Creating Database with version", function (done) {
        var version = 2;

        initionalSituation(function(){
            var request = indexedDB.open(dbName, version);

            request.onsuccess = function(e){
                assert.equal(e.target.result.name, dbName, "Database opened/created");
                // Necessary for indexedDB who work with setVersion
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
            request.onblocked = function(e){
                assert.ok(false, "Blocked database");
            };
        }, done, assert);
    });

    it("Opening existing Database", function (done) {
        initionalSituationDatabase(function () {
            var request = indexedDB.open(dbName);
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
            var request = indexedDB.open(dbName, version);
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
            request.onblocked = function(e){
                assert.ok(false, "Blocked database");
            };
        }, done, assert);
    });

    it("Opening existing Database with lower version", function (done) {
        var version = 1;

        initionalSituationDatabaseVersion(function () {
            var request = indexedDB.open(dbName, version);

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
            request.onblocked = function(e){
                assert.ok(false, "Blocked database");
            };
        }, done, assert);
    });

    it("Opening existing Database with higher version", function (done) {
        var version = 2;

        initionalSituationDatabase(function () {
            var request = indexedDB.open(dbName, version);

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
        var request = indexedDB.open(dbName);

        request.onsuccess = function(e){
            e.target.result.close();
            var deleteRequest = indexedDB.deleteDatabase(dbName);

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
        request.onblocked = function(e){
            assert.ok(false, "Blocked database");
        };
    });

    it("Deleting non existing Database", function (done) {
        initionalSituation(function () {
            var deleteRequest = indexedDB.deleteDatabase(dbName);

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

    it("Opening database with higher version while open database connection exist.", function (done) {
        var version = 2;
        var expect = 3, ct = 0;

        initionalSituation(function(){
            var request = indexedDB.open(dbName, version);

            request.onsuccess = function(e){
                e.target.result.onversionchange = function(args){
                    equal("versionchange", args.type, "Versionchange database");
                    equal(args.oldVersion, version, "Old version");
                    assert.equal(args.newVersion, version + 1, "New version");
                    ct += 3;
                    e.target.result.close();
                };
                var request2 = indexedDB.open(dbName, version+1);
                request2.onsuccess = function(args){
                    e.target.result.close();
                    args.target.result.close();
                    equal(ct, expect, "Expected test count");
                    done();
                };

            };
            request.onerror = function(){
                assert.ok(false, "Creating database failed");
                done();
            };
            request.onblocked = function(e){
                assert.ok(false, "Blocked database");
            };

        }, done, assert);
    });
    it("Block opening database with higher version.", function (done) {
        var version = 2;
        var expect = 4, ct = 0;

        initionalSituation(function(){
            var request = indexedDB.open(dbName, version);

            request.onsuccess = function(e){
                e.target.result.onversionchange = function(args){
                    assert.equal("versionchange", args.type, "Versionchange database");
                    ct++;
                };
                var request2 = indexedDB.open(dbName, version+1);
                request2.onsuccess = function(args){
                    args.target.result.close();
                    equal(ct, expect, "Expected test count");
                    done();
                };
                request2.onblocked = function(args){
                    assert.equal("blocked", args.type, "blocked database");
                    assert.equal(args.oldVersion, version, "Old version");
                    assert.equal(args.newVersion, null, "New version");
                    ct += 3;
                    e.target.result.close();
                };
                request2.onerror = function(){
                    assert.ok(false, "Creating database failed");
                    ct++;
                    done();
                };

            };
            request.onerror = function(){
                assert.ok(false, "Creating database failed");
                done();
            };
            request.onblocked = function(e){
                assert.ok(false, "Blocked database");
            };

        }, done, assert);
    });
    it("Block delete database with open connection.", function (done) {
        var version = 2;
        var expect = 5, ct = 0;

        initionalSituation(function(){
            var request = indexedDB.open(dbName, version);

            request.onsuccess = function(e){
                e.target.result.onversionchange = function(args){
                    assert.equal("versionchange", args.type, "Versionchange database");
                    ct++;
                };
                var request2 = indexedDB.deleteDatabase(dbName);
                request2.onsuccess = function(args){
                    assert.ok(true, "Database deleted");
                    ct++;
                    equal(ct, expect, "Expected test count");
                    done();
                };
                request2.onblocked = function(args){
                    assert.equal("blocked", args.type, "blocked database");
                    assert.equal(args.oldVersion, version, "Old version");
                    assert.equal(args.newVersion, null, "New version");
                    ct += 3;
                    e.target.result.close();
                };
                request2.onerror = function(){
                    assert.ok(false, "Creating database failed");
                    done();
                };
                request2.onupgradeneeded = function(args){
                    assert.ok(false, "upgradeneeded database");
                };

            };
            request.onerror = function(){
                assert.ok(false, "Creating database failed");
                done();
            };
            request.onblocked = function(e){
                assert.ok(false, "Blocked database");
            };

        }, done, assert);
    });
    /* TODO add tests for version change event */
});

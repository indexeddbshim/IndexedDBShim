queuedModule("Database");
queuedAsyncTest("Opening a Database without version", function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME);
	dbOpenRequest.onsuccess = function(e){
		ok(true, "Database Opened successfully");
		expect(2);
		_("Database opened successfully with version " + dbOpenRequest.result.version + "-" + dbVersion);
		dbVersion = dbOpenRequest.result.version || 0;
		dbOpenRequest.result.close();
		start();
		nextTest();
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		start();
		nextTest();
	};
	dbOpenRequest.onupgradeneeded = function(e){
		ok(true, "Database upgrade should be called");
		_("Database upgrade called");
		start();
		stop();
	};
	dbOpenRequest.onblocked = function(e){
		ok(true, "Database blocked called");
		_("Database blocked called");
		start();
		stop();
	};
});

queuedAsyncTest("Opening a database with a version " + dbVersion, function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME, ++dbVersion);
	dbOpenRequest.onsuccess = function(e){
		ok(true, "Database Opened successfully");
		_("Database opened successfully with version");
		dbOpenRequest.result.close();
		nextTest();
		start();
	};
	dbOpenRequest.onerror = function(e){
		ok(false, "Database NOT Opened successfully");
		_("Database NOT opened successfully");
		nextTest();
		start();
	};
	dbOpenRequest.onupgradeneeded = function(e){
		ok(true, "Database Upgraded successfully");
		_("Database upgrade called");
	};
	dbOpenRequest.onblocked = function(e){
		ok(true, "Database blocked called");
		_("Database blocked called");
		start();
		stop();
	};
});

queuedAsyncTest("Creating Many Stores with Indexes opening the same db every time", function(){
    var dbOpenRequest,
        version = ++dbVersion,
        onUpgradeCallCount = 0,
        i,
        stores = [],
        dbs = [],
        indexes = [
            {name: "IntIndex", key: "Int", options: {
                "unique": false,
                "multiEntry": false
            }},
            {name: "StringIndex", key: "String"}
        ];

    function makeOnSuccess(dbOpenRequest) {
        return function(e){
            ok(true, "Database Opened successfully");
            _("Database opened successfully with version");
            dbs.push(dbOpenRequest.result);
            dbOpenRequest.result.close();
        };
    }

    function makeOnError(dbOpenRequest) {
        return function(e){
            ok(false, "Database NOT Opened successfully");
            _("Database NOT opened successfully");
            nextTest();
        };
    }

    function waitForStoresReady(stores) {
        if (stores.length === 0 || !stores[0].__waitForReady) {
            console.log('stores ready', stores);
            if (onUpgradeCallCount > 1) {
                throw new Error('upgradeneeded called ' + onUpgradeCallCount +
                                ' times');
            }
            nextTest();
            start();
        } else {
            console.info('waiting for stores to be ready', stores);
            stores[0].__waitForReady(function () {
                setTimeout(function () {
                    waitForStoresReady(stores.slice(1));
                }, 100);
            });
        }
    }

    function upgradeCalled() {
        waitForStoresReady(stores);
    }

    function makeOnUpgrade(dbOpenRequest) {
        return function(e){
            ok(true, "Database Upgraded successfully");
            _("Database upgrade called");
            var db = dbOpenRequest.result, storeName, objectStore,
                i, j, len, index;

            onUpgradeCallCount += 1;

            /*if (onUpgradeCallCount !== 1) {
                throw new Error('should not call onupgradeneeded more than once');
            }*/

            function createIndex(objectStore, index) {
                return objectStore.createIndex(index.name, index.key, index.options);
            }


            try {
                for (i = 0; i < 10; i += 1) {
                    storeName = DB.OBJECT_STORE_1 + '_' + i,
                    objectStore = db.createObjectStore(storeName);
                    stores.push(objectStore);

                    for (j = 0, len = indexes.length; j < len; j += 1) {
                        index = indexes[j];
                        createIndex(objectStore, index);
                    }
                }
            } catch (error) {
                console.error('creating stores and indexes', error);
            }

            upgradeCalled();
        };
    }

    function makeOnBlocked(dbOpenRequest) {
        return function(e){
            _("Opening database blocked");
            ok(false, "Opening database blocked");
            start();
            stop();
        };
    }

    for (i = 0; i < 5; i += 1) {
        dbOpenRequest = window.indexedDB.open(DB.NAME, version);
        dbOpenRequest.onsuccess = makeOnSuccess(dbOpenRequest);
        dbOpenRequest.onerror = makeOnError(dbOpenRequest);
        dbOpenRequest.onupgradeneeded = makeOnUpgrade(dbOpenRequest);
        dbOpenRequest.onblocked = makeOnBlocked(dbOpenRequest);
    }

    start();
    stop();
});


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

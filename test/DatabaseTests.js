var dbVersion = 0;
queuedModule("Database");
queuedAsyncTest("Opening a Database without version", function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME);
	dbOpenRequest.onsuccess = function(e){
		ok(true, "Database Opened successfully");
		_("Database opened successfully");
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
		ok(false, "Database upgrade should not be called");
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

queuedAsyncTest("Opening a database with a version", function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME, ++dbVersion);
	dbOpenRequest.onsuccess = function(e){
		ok(true, "Database Opened successfully");
		_("Database opened successfully with version");
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

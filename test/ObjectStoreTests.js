queuedModule("Object Store");
queuedAsyncTest("Creating an Object Store", function(){
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
		var db = dbOpenRequest.result;
		db.createObjectStore(DB.OBJECT_STORE_1);
		db.createObjectStore(DB.OBJECT_STORE_2, {
			"keyPath": "Int",
			"autoIncrement": true
		});
		db.createObjectStore(DB.OBJECT_STORE_3, {
			"autoIncrement": true
		});
		db.createObjectStore(DB.OBJECT_STORE_4, {
			"keyPath": "Int"
		});
		var objectStore5 = db.createObjectStore(DB.OBJECT_STORE_5);
		equal(db.objectStoreNames.length, 5, "Count of Object Stores created is correct");
		_(db.objectStoreNames);
		start();
		stop();
	};
});

queuedAsyncTest("Deleting an Object Store", function(){
	var dbOpenRequest = window.indexedDB.open(DB.NAME, ++dbVersion);
	dbOpenRequest.onsuccess = function(e){
		ok(true, "Database Opened successfully");
		_("Database opened successfully with version");
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
		ok(true, "Database Upgraded successfully, now trying to delete the database");
		_("Database upgrade called");
		var db = dbOpenRequest.result;
		var len = db.objectStoreNames.length;
		db.deleteObjectStore(DB.OBJECT_STORE_5);
		equal(db.objectStoreNames.indexOf(DB.OBJECT_STORE_5), -1, "Database does not contain Object Store 4");
		start();
		stop();
	};
});

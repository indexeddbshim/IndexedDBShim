function onObjectStoreOpen(name, storeName, callback){
	queuedAsyncTest(name, function(){
		var dbOpenRequest = window.indexedDB.open(DB.NAME);
		dbOpenRequest.onsuccess = function(e){
			_("Database opened successfully");
			ok(true, "Database Opened successfully");
			var db = dbOpenRequest.result;
			var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2, DB.OBJECT_STORE_3, DB.OBJECT_STORE_4], IDBTransaction.READ_WRITE);
			var objectStore = transaction.objectStore(storeName);
			callback(objectStore);
		};
		dbOpenRequest.onerror = function(e){
			ok(false, "Database NOT Opened successfully");
			_("Database NOT opened successfully");
			start();
			nextTest();
		};
	});
}

queuedModule("ObjectStore CRUD");
var key = sample.integer();
var data = sample.obj();

onObjectStoreOpen("Adding data to Object Store", DB.OBJECT_STORE_1, function(objectStore){
	var req = objectStore.add(data, key);
	req.onsuccess = function(e){
		_("Data added to object Store successfully " + key);
		equal(key, req.result, "Data added to Object store");
		start();
		nextTest();
	};
	req.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Adding with keypath and autoInc, no key", DB.OBJECT_STORE_2, function(objectStore){
	var req = objectStore.add(sample.obj());
	req.onsuccess = function(e){
		_("Data added to object Store successfully " + req.result);
		notEqual(null, req.result, "Data added to Object store");
		start();
		nextTest();
	};
	req.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});


onObjectStoreOpen("Adding with keypath and autoInc, no key in path", DB.OBJECT_STORE_2, function(objectStore){
	var data = sample.obj();
	delete data["Int"]
	var req = objectStore.add(data);
	req.onsuccess = function(e){
		_("Data added to object Store successfully " + req.result);
		notEqual(null, req.result, "Data added to Object store");
		start();
		nextTest();
	};
	req.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Adding with NO keypath and autoInc", DB.OBJECT_STORE_3, function(objectStore){
	var key = sample.integer();
	var req = objectStore.add(sample.obj(), key);
	req.onsuccess = function(e){
		_("Data added to object Store successfully " + key);
		equal(key, req.result, "Data added to Object store");
		start();
		nextTest();
	};
	req.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Adding with NO keypath and autoInc - no key specified", DB.OBJECT_STORE_3, function(objectStore){
	var key = sample.integer();
	var req = objectStore.add(sample.obj());
	req.onsuccess = function(e){
		_("Data added to object Store successfully " + key);
		ok(req.result, "Data added to Object store");
		start();
		nextTest();
	};
	req.onerror = function(e){
		_("Could not add data to database");
		ok(false, "Could not add Data to ObjectStore1");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Updating data in Object Store", DB.OBJECT_STORE_1, function(objectStore){
	data = sample.obj();
	data["modified"] = true;
	var req = objectStore.put(data, key);
	req.onsuccess = function(){
		_("Data added to object Store successfully");
		equal(key, req.result, "Data added to Object store");
		start();
		nextTest();
	};
	req.onerror = function(){
		_("Could not add data to database");
		ok(false, "Could not update Data");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Updating non-existant in Object Store", DB.OBJECT_STORE_1, function(objectStore){
	var key = "UPDATED"
	var req = objectStore.put(sample.obj(), key);
	req.onsuccess = function(){
		_("Data added to object Store successfully");
		equal(key, req.result, "Data updated in Object store");
		start();
		nextTest();
	};
	req.onerror = function(){
		_("Could not add data to database");
		ok(false, "Could not update Data");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Getting data in Object Store", DB.OBJECT_STORE_1, function(objectStore){
	var req = objectStore.get(key);
	req.onsuccess = function(){
		_("Data got from object store");
		deepEqual(req.result, data, "Data fetched matches the data");
		start();
		nextTest();
	};
	req.onerror = function(){
		_("Could not get data to database");
		ok(false, "Could not get data");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Count in Object Store", DB.OBJECT_STORE_1, function(objectStore){
	var req = objectStore.count();
	req.onsuccess = function(e){
		_("Data counted from object store");
		equal(req.result, 1, "Total number of objects in database");
		start();
		nextTest();
	};
	req.onerror = function(){
		_("Could not get data to database");
		ok(false, "Could not get count of data");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Delete data in Object Store", DB.OBJECT_STORE_1, function(objectStore){
	var req = objectStore["delete"](key);
	req.onsuccess = function(e){
		_("Data deleted from object store");
		deepEqual(req.result, undefined, "Data deleted from Object Store");
		start();
		nextTest();
	};
	req.onerror = function(){
		_("Could not get data to database");
		ok(false, "Could not delete data");
		start();
		nextTest();
	};
});


onObjectStoreOpen("Clear data in Object Store", DB.OBJECT_STORE_1, function(objectStore){
	var req = objectStore.clear();
	req.onsuccess = function(e){
		_("Data cleared from object store");
		ok(true, "Data from Object Store");
		start();
		nextTest();
	};
	req.onerror = function(){
		_("Could not get data to database");
		ok(false, "Could not delete data");
		start();
		nextTest();
	};
});

onObjectStoreOpen("Lots of data Added to objectStore1", DB.OBJECT_STORE_1, function(objectStore){
	counter = 0;
	for (var i = 0; i < 15; i++) {
		var req = objectStore.add(sample.obj(), i);
		req.onsuccess = function(){
			_(counter + ". Data added to store" + req.result);
			ok(true, "Data added to store" + req.result);
			if (++counter >= 15) {
				start();
				nextTest();
			}
		};
		req.onerror = function(){
			_(counter + ". Could not get add to database");
			ok(false, "Could not add data");
			if (++counter >= 10) {
				start();
				nextTest();
			}
		};
	}
});

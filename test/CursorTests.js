function openObjectStore(name, storeName, callback){
    queuedAsyncTest(name, function(){
        var dbOpenRequest = window.indexedDB.open(DB.NAME);
        dbOpenRequest.onsuccess = function(e){
            _("Database opened successfully");
            var db = dbOpenRequest.result;
            var transaction = db.transaction([DB.OBJECT_STORE_1, DB.OBJECT_STORE_2], "readwrite");
            var objectStore = transaction.objectStore(DB.OBJECT_STORE_1);
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

queuedModule("Cursor");

openObjectStore("Iterating over cursor", DB.OBJECT_STORE_1, function(objectStore){
    var cursorReq = objectStore.openCursor();
    var count = 0;
    cursorReq.onsuccess = function(e){
        var cursor = cursorReq.result;
        if (cursor) {
            count ++;
            ok(true, "Iterating over cursor " + cursor.key + " for value " + JSON.stringify(cursor.value));
            cursor["continue"]();
        }
        else {
            equal(count, 15);
            objectStore.transaction.db.close();
            start();
            nextTest();
        }
    };
    cursorReq.onerror = function(e){
        _("Error on cursor request");
        ok(false, "Could not continue opening cursor");
        start();
        nextTest();
    };
});
openObjectStore("Updating using a cursor", DB.OBJECT_STORE_1, function(objectStore){
    var cursorReq = objectStore.openCursor();
    cursorReq.onsuccess = function(e){
        var cursor = cursorReq.result;
        if (cursor) {
            if (cursor.value.Int % 3 === 0) {
                cursor.value.cursorUpdate = true;
                var updateReq = cursor.update(cursor.value);
                updateReq.onsuccess = function(){
                    equal(cursor.key, updateReq.result, "Update value " + cursor.key);
                    _("Updated cursor with key " + updateReq.result);
                    cursor["continue"]();
                };
                updateReq.onerror = function(){
                    ok(false, "No Update " + cursor.key);
                    cursor["continue"]();
                };
            }
            else {
                ok(true, "Got cursor value " + cursor.key + ":" + JSON.stringify(cursor.value));
                cursor["continue"]();
            }
        }
        else {
            _("Iterating over all objects completed");
            objectStore.transaction.db.close();
            start();
            nextTest();
        }
    };
    cursorReq.onerror = function(e){
        _("Error on cursor request");
        ok(false, "Could not continue opening cursor");
        start();
        nextTest();
    };
});


openObjectStore("Deleting using a cursor", DB.OBJECT_STORE_1, function(objectStore){
    var cursorReq = objectStore.openCursor();
    var totalRows  = 15;
    var cursorIteration = 0;
    cursorReq.onsuccess = function(e){
        var cursor = cursorReq.result;
        if (cursor) {
            cursorIteration++;
            if (cursor.value.Int % 5 === 0) {
                var updateReq = cursor["delete"]();
                updateReq.onsuccess = function(){
                    equal(undefined, updateReq.result, "Deleted value " + cursor.key);
                    _("Deleted cursor with key " + updateReq.result);
                    cursor["continue"]();
                };
                updateReq.onerror = function(){
                    ok(false, "No delete " + cursor.key);
                    cursor["continue"]();
                };
            }
            else {
                ok(true, "Got cursor value " + cursor.key + ":" + JSON.stringify(cursor.value));
                cursor["continue"]();
            }
        }
        else {
            objectStore.transaction.db.close();
            equal(cursorIteration, totalRows, "All cursors iterated");
            _("Iterating over all objects completed");
            start();
            nextTest();
        }
    };
    cursorReq.onerror = function(e){
        _("Error on cursor request");
        ok(false, "Could not continue opening cursor");
        start();
        nextTest();
    };
});

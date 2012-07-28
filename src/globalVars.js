(function(window, idbModules){
	if (typeof window.openDatabase !== "undefined") {
		window.shimIndexedDB = idbModules.shimIndexedDB;
		window.shimIndexedDB &&
		(window.shimIndexedDB.__useShim = function(){
			window.indexedDB = idbModules.shimIndexedDB;
			window.IDBDatabase = idbModules.IDBDatabase;
			window.IDBTransaction = idbModules.IDBTransaction;
			window.IDBCursor = idbModules.IDBCursor;
			window.IDBKeyRange = idbModules.IDBKeyRange;
		});
	}
	
	window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.oIndexedDB || window.msIndexedDB;
	
	if (typeof window.indexedDB === "undefined" && typeof window.openDatabase !== "undefined") {
		window.shimIndexedDB.__useShim();
	} else {
		window.IDBDatabase = window.IDBDatabase || window.webkitIDBDatabase;
		window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction;
		window.IDBCursor = window.IDBCursor || window.webkitIDBCursor;
		window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
	}
	
}(window, idbModules));


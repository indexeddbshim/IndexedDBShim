/*global addTest*/
/* eslint-disable no-var */
var dbVersion = 0; // eslint-disable-line no-unused-vars
var testNames = ['Database', 'ObjectStore', 'ObjectStoreCrud', 'Cursor', 'Index']; // eslint-disable-line no-unused-vars
var testFiles = testNames.map(function (testName) { return testName + 'Tests.js'; }); // eslint-disable-line no-unused-vars

function _ (msg) { // eslint-disable-line no-unused-vars
    console.log('[' + QUnit.config.current.testName + ']', msg, arguments.callee.caller ? arguments.callee.caller.arguments : ' -- '); // eslint-disable-line no-caller
}

function addTestSuite (i) {
    if (i >= testNames.length) {
        nextTest();
        return;
    }
    console.log('Adding test suite ', testNames[i]);
    addTest(i);
}

function QUnitTests () {
    addTestSuite(0);
}

function deleteDB (callback) {
    var deleteReq = window.indexedDB.deleteDatabase(DB.NAME);
    deleteReq.onsuccess = function () {
        console.log('Database deleted');
        callback();
    };
    deleteReq.onerror = function (e) {
        console.log('Could not delete database. Database may not exist');
        callback();
    };
}

function startTests () { // eslint-disable-line no-unused-vars
    if (typeof window.mozIndexedDB !== 'undefined') {
        window.indexedDB = window.mozIndexedDB;
    } else {
        window.indexedDB = window.shimIndexedDB;
        window.shimIndexedDB.__useShim();
        window.shimIndexedDB.__debug(true);
        console.log('Starting Tests with shimIndexedDB');
    }
    deleteDB(function () {
        QUnitTests();
    });
}

if (typeof global !== 'undefined') {
    global.startTests = startTests;
    global.testFiles = testFiles;
    global.dbVersion = dbVersion;
    global.addTestSuite = addTestSuite;
    global._ = _;
}

/* eslint-env qunit */
/* globals nextTest, addTest */
/* eslint-disable no-var */
var dbVersion = 0; // eslint-disable-line no-unused-vars
var testNames = ['Database', 'ObjectStore', 'ObjectStoreCrud', 'Cursor', 'Index', 'Factory']; // eslint-disable-line no-unused-vars
var testFiles = testNames.map(function (testName) { return testName + 'Tests.js'; }); // eslint-disable-line no-unused-vars

function _ (msg) { // eslint-disable-line no-unused-vars
    console.log('[' + QUnit.config.current.testName + ']', msg, arguments.callee.caller ? arguments.callee.caller.arguments : ' -- '); // eslint-disable-line no-caller
}

// Sample data (phantom-qunit had issues with this in external file for QUnit 2.0)
var DB = {
    NAME: 'dbname',
    OBJECT_STORE_1: 'objectStore1',
    OBJECT_STORE_2: 'objectStore2',
    OBJECT_STORE_3: 'objectStore3',
    OBJECT_STORE_4: 'objectStore4',
    OBJECT_STORE_5: 'objectStore5',
    INDEX1_ON_OBJECT_STORE_1: 'Index1_ObjectStore1',
    INDEX1_ON_OBJECT_STORE_2: 'Index1_ObjectStore2'
};

var sample = (function () {
    var generatedNumbers = {};
    return {
        obj: function () {
            return {
                String: 'Sample ' + new Date(),
                Int: this.integer(),
                Float: Math.random(),
                Boolean: true
            };
        },
        integer: function (arg) {
            // Ensuring a unique integer everytime, for the sake of index get
            var r;
            do {
                r = parseInt(Math.random() * (arg || 100000));
            }
            while (generatedNumbers[r]);
            generatedNumbers[r] = true;
            return r;
        }
    };
}());

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
        window.shimIndexedDB.__setConfig('useSQLiteIndexes', true);
        window.shimIndexedDB.__debug(true);
        window.shimIndexedDB.__setConfig({checkOrigin: false});
        console.log('Starting Tests with shimIndexedDB');
    }
    deleteDB(function () {
        QUnitTests();
    });
}

(function () {
    var glob = typeof global === 'undefined'
        ? window
        : global;
    glob.DB = DB;
    glob.sample = sample;
    glob.startTests = startTests;
    glob.testFiles = testFiles;
    glob.dbVersion = dbVersion;
    glob.addTestSuite = addTestSuite;
    glob._ = _;
})();

global.window = global;
window.location = {search: ''}; // useShim=true // This must go before sinon as well as before our test-environment.js.

window.chai = require('chai');
window.sinon = require('sinon');
window.mocha = {setup () {}, globals () {}, checkLeaks () {}};
window.assert = window.chai.assert;

window.addEventListener = function (type) {
    if (type !== 'cordovacallbackerror') {
        throw new Error('Event listener type added for dummy addEventListener placeholder: ' + type);
    }
    console.log('dummy window.addEventListener called');
};

window.onerror = function () {
    console.log('Node onerror called');
};

(function () {
    require('../../tests-mocha/test-environment.js');
    require('../../tests-mocha/test-utils.js');

    global.support = require('./support');

    var tests; // eslint-disable-line no-var

    if (process.env.npm_config_test) {
        tests = [process.env.npm_config_test];
        console.log('Running test: ' + process.env.npm_config_test);
    } else {
        tests = [
            'IDBCursor.advance.js',
            'IDBCursor.continue.js',
            'IDBCursor.delete.js',
            'IDBCursor.update.js',
            'IDBCursorBehavior.js',
            'IDBDatabase.close.js',
            'IDBDatabase.createObjectStore.js',
            'IDBDatabase.deleteObjectStore.js',
            'IDBDatabase.transaction.js',
            'IDBFactory.cmp.js',
            'IDBFactory.deleteDatabase.js',
            'IDBFactory.open.js',
            'IDBIndex.count.js',
            'IDBIndex.get.js',
            'IDBIndex.getKey.js',
            'IDBIndex.js',
            'IDBIndex.multiEntry.js',
            'IDBIndex.openKeyCursor.js',
            'IDBKeyRange.js',
            'IDBObjectStore.add.js', // Cyclic
            'IDBObjectStore.clear.js',
            'IDBObjectStore.count.js',
            'IDBObjectStore.createIndex.js',
            'IDBObjectStore.delete.js',
            'IDBObjectStore.deleteIndex.js',
            'IDBObjectStore.get.js',
            'IDBObjectStore.index.js',
            'IDBObjectStore.js',
            'IDBObjectStore.openCursor.js',
            'IDBObjectStore.put.js',
            'IDBTransaction.abort.js',
            'IDBTransaction.js',
            'KeyGenerator.js',
            'KeyPath.js',
            'KeyValidity.js',
            'RequestBehavior.js',
            'TransactionBehavior.js'
        ];
    }

    var base = '../test-helper-unicode';
    //    var base = '../test-helper';
    tests.forEach(function (path) {
        var indexedDB = require(base);
        indexedDB.__setConfig('useSQLiteIndexes', true);
        require('./' + path);
    });
}());

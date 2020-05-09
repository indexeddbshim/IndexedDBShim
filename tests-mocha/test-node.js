global.window = global;
window.location = {search: ''}; // useShim=true // This must go before sinon as well as before our test-environment.js.

window.chai = require('chai');
window.sinon = require('sinon');

window.mocha = {setup () { /* */ }, globals () { /* */ }, checkLeaks () { /* */ }};

window.addEventListener = function (type) {
    if (type !== 'cordovacallbackerror') {
        throw new Error('Event listener type added for dummy addEventListener placeholder: ' + type);
    }
    console.log('dummy window.addEventListener called');
};

window.dispatchEvent = function (e) {
    window.onerror(e);
};

class ErrorEvent {}

window.ErrorEvent = ErrorEvent;

window.onerror = function () {
    console.log('Node onerror called');
};

(function () {
    const setGlobalVars = require('../dist/indexeddbshim-node.js'); // eslint-disable-line node/global-require
    setGlobalVars(window, {addNonIDBGlobals: true});

    require('./test-environment.js'); // eslint-disable-line node/global-require
    require('./test-utils.js'); // eslint-disable-line node/global-require

    var tests; // eslint-disable-line no-var

    if (process.env.npm_config_test) { // eslint-disable-line node/no-process-env
        tests = [process.env.npm_config_test]; // eslint-disable-line node/no-process-env
        console.log('Running test: ' + process.env.npm_config_test); // eslint-disable-line node/no-process-env
    } else {
        tests = [
            'api-spec.js',
            'IDBCursor/delete-spec.js',
            'IDBCursor/update-spec.js',
            'IDBFactory/cmp-spec.js',
            'IDBFactory/databases-spec.js',
            'IDBFactory/deleteDatabase-spec.js',
            'IDBFactory/open-spec.js',
            'IDBDatabase/close-spec.js',
            'IDBDatabase/createObjectStore-spec.js',
            'IDBDatabase/deleteObjectStore-spec.js',
            'IDBDatabase/transaction-spec.js',
            'IDBIndex/count-spec.js',
            'IDBIndex/get-spec.js',
            'IDBIndex/getKey-spec.js',
            'IDBIndex/openCursor-spec.js',
            'IDBIndex/openKeyCursor-spec.js',
            'IDBKeyRange/includes-spec.js',
            'IDBObjectStore/add-put-spec.js',
            'IDBObjectStore/add-spec.js',
            'IDBObjectStore/clear-spec.js',
            'IDBObjectStore/count-spec.js',
            'IDBObjectStore/createIndex-spec.js',
            'IDBObjectStore/delete-spec.js',
            'IDBObjectStore/deleteIndex-spec.js',
            'IDBObjectStore/get-spec.js',
            'IDBObjectStore/index-spec.js',
            'IDBObjectStore/indexNames-spec.js',
            'IDBObjectStore/openKeyCursor-spec.js',
            'IDBObjectStore/put-spec.js',
            'IDBTransaction/objectStore-spec.js',
            'IDBTransaction/events-spec.js'
        ];
    }
    tests.forEach(function (path) {
        require('./' + path); // eslint-disable-line import/no-dynamic-require, node/global-require
    });
}());

global.window = global;
window.location = {search: ''}; // useShim=true // This must go before sinon as well as before our test-environment.js.

window.chai = require('chai');
window.sinon = require('sinon');
window.mocha = {setup () {}, globals () {}, checkLeaks () {}};

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
    const setGlobalVars = require('../dist/indexeddbshim-node.js');
    setGlobalVars(window, {addNonIDBGlobals: true});

    require('./test-environment.js');
    require('./test-utils.js');

    var tests; // eslint-disable-line no-var

    if (process.env.npm_config_test) {
        tests = [process.env.npm_config_test];
        console.log('Running test: ' + process.env.npm_config_test);
    } else {
        tests = [
            'api-spec.js',
            'IDBFactory/cmp-spec.js',
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
            'IDBKeyRange/includes-spec.js',
            'IDBObjectStore/add-spec.js',
            'IDBObjectStore/put-spec.js',
            'IDBObjectStore/add-put-spec.js',
            'IDBObjectStore/clear-spec.js',
            'IDBObjectStore/createIndex-spec.js',
            'IDBObjectStore/deleteIndex-spec.js',
            'IDBObjectStore/delete-spec.js',
            'IDBObjectStore/index-spec.js',
            'IDBTransaction/objectStore-spec.js',
            'IDBTransaction/events-spec.js'
        ];
    }
    tests.forEach(function (path) {
        require('./' + path);
    });
}());

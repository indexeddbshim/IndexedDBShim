import chai from 'chai';
import sinon from 'sinon';

global.window = global;
window.location = {search: ''}; // useShim=true // This must go before sinon as well as before our test-environment.js.

window.chai = chai;
window.sinon = sinon;

window.mocha = {setup () { /* */ }, globals () { /* */ }, checkLeaks () { /* */ }};

/**
 * @param {string} type
 * @returns {void}
 */
window.addEventListener = function (type) {
    if (type !== 'cordovacallbackerror') {
        throw new Error('Event listener type added for dummy addEventListener placeholder: ' + type);
    }
    console.log('dummy window.addEventListener called');
};

/**
 * @param {Event} e
 * @returns {void}
 */
window.dispatchEvent = function (e) {
    window.onerror(e);
};

/**
 * An Error event.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
 */
class ErrorEvent {}

window.ErrorEvent = ErrorEvent;

/**
 * @returns {void}
 */
window.onerror = function () {
    console.log('Node onerror called');
};

const setGlobalVars = (await import('../src/node.js')).default;
setGlobalVars(window, {addNonIDBGlobals: true});

await import('./test-environment.js');
await import('./test-utils.js');

var tests; // eslint-disable-line no-var

if (process.env.npm_config_test) { // eslint-disable-line n/no-process-env
    tests = [process.env.npm_config_test]; // eslint-disable-line n/no-process-env
    console.log('Running test: ' + process.env.npm_config_test); // eslint-disable-line n/no-process-env
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
await Promise.all(tests.map(async function (path) {
    // eslint-disable-next-line no-unsanitized/method -- Safe env.
    return await import('./' + path);
}));

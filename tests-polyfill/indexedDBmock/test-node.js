import * as chai from 'chai';
import sinon from 'sinon';

global.window = global;
window.location = {search: ''}; // useShim=true // This must go before sinon as well as before our test-environment.js.

window.chai = chai;
window.sinon = sinon;
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

const setGlobalVars = (await import('../../src/node.js')).default;
setGlobalVars();

await import('../../tests-mocha/test-environment.js');
await import('../../tests-mocha/test-utils.js');
await import('./setup.js');

let tests;

if (process.env.npm_config_test) {
    tests = [process.env.npm_config_test];
    console.log('Running test: ' + process.env.npm_config_test);
} else {
    tests = [
        'database.js',
        'index.js',
        'keyrange.js',
        'objectstore.add.js',
        'objectstore.clear.js',
        'objectstore.count.js',
        'objectstore.delete.js',
        'objectstore.get.js',
        'objectstore.js',
        'objectstore.put.js',
        'transaction.js',
    ];
}
await Promise.all(tests.map(async (path) => {
    return await import('./' + path);
}));

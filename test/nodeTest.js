/*global QUnit, testFiles, addTestSuite, startTests */

const shimAll = require('../dist/indexeddbshim-node');
shimAll(GLOBAL.window);

QUnit.module('group a');
QUnit.test('a basic test example', function (assert) {
    assert.ok(true, 'this test is fine');
});
QUnit.test('a basic test example 2', function (assert) {
    assert.ok(true, 'this test is fine');
});

function addTest (i) { // eslint-disable-line no-unused-vars
    console.log('i:' + i);
    require('./' + testFiles[i]);
    addTestSuite(i + 1);
}
GLOBAL.addTest = addTest;

startTests();

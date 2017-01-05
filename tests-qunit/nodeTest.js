/* global testFiles, addTestSuite, startTests */

const setGlobalVars = require('../dist/indexeddbshim-node.min');
setGlobalVars(global.window);

function addTest (i) { // eslint-disable-line no-unused-vars
    console.log('i:' + i);
    require('./' + testFiles[i]);
    addTestSuite(i + 1);
}
global.addTest = addTest;

startTests();

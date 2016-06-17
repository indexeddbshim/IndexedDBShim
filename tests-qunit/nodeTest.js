/*global testFiles, addTestSuite, startTests */

const setGlobalVars = require('../dist/indexeddbshim-node.min');
setGlobalVars(GLOBAL.window);

function addTest (i) { // eslint-disable-line no-unused-vars
    console.log('i:' + i);
    require('./' + testFiles[i]);
    addTestSuite(i + 1);
}
GLOBAL.addTest = addTest;

startTests();

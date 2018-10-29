/* eslint-env qunit */
/* global testFiles, addTestSuite, startTests */
require('source-map-support').install();

const setGlobalVars = require('../dist/indexeddbshim-node');

setGlobalVars(global.window);

function addTest (i) { // eslint-disable-line no-unused-vars
    console.log('i:' + i);
    require('./' + testFiles[i]); // eslint-disable-line global-require, import/no-dynamic-require
    addTestSuite(i + 1);
}
global.addTest = addTest;

startTests();

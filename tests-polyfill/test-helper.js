GLOBAL.window = GLOBAL;

const setGlobalVars = require('../dist/indexeddbshim-node');
// const setGlobalVars = require('../dist/indexeddbshim-node.min');

setGlobalVars();
// shimIndexedDB.__debug(true);

window.DOMException = indexedDB.modules.DOMException;

module.exports = global.indexedDB

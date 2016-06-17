GLOBAL.window = GLOBAL;

const setGlobalVars = require('../dist/indexeddbshim-node.min');
setGlobalVars();

window.DOMException = indexedDB.modules.DOMException;

module.exports = global.indexedDB

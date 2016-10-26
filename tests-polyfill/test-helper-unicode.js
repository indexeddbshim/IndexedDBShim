GLOBAL.window = GLOBAL;

const setGlobalVars = require('../dist/indexeddbshim-UnicodeIdentifiers-node');
// const setGlobalVars = require('../dist/indexeddbshim-node.min');

setGlobalVars();
// shimIndexedDB.__debug(true);

window.DOMException = indexedDB.modules.DOMException;
window.Event = indexedDB.modules.ShimEvent;

module.exports = global.indexedDB

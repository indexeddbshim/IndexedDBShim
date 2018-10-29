global.window = global;

const setGlobalVars = require('../dist/indexeddbshim-UnicodeIdentifiers-node');
// const setGlobalVars = require('../dist/indexeddbshim-node.min');

setGlobalVars(null, {addNonIDBGlobals: true});
// shimIndexedDB.__debug(true);

window.DOMException = ShimDOMException;
window.Event = ShimEvent;

module.exports = global.indexedDB;

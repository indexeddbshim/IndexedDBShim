import setGlobalVars from '../src/node-UnicodeIdentifiers.js';

global.window = global;

// import setGlobalVars from '../dist/indexeddbshim-node.min';

setGlobalVars(null, {addNonIDBGlobals: true});
// shimIndexedDB.__debug(true);

window.DOMException = ShimDOMException;
window.Event = ShimEvent;

export default global.indexedDB;

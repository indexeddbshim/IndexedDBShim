import setGlobalVars from '../dist/indexeddbshim-node';
// import setGlobalVars from '../dist/indexeddbshim-node.min';

global.window = global;

setGlobalVars(null, {addNonIDBGlobals: true});
// shimIndexedDB.__debug(true);

window.DOMException = ShimDOMException;
window.Event = ShimEvent;

export default global.indexedDB;

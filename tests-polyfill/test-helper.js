GLOBAL.window = GLOBAL;

const shimAll = require('../dist/indexeddbshim-node.min');
shimAll();

window.DOMException = indexedDB.modules.DOMException;

module.exports = global.indexedDB

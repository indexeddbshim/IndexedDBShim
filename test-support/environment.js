const global = this;
var self = global; // eslint-disable-line no-var
self.parent = self;

const jsdom = require('jsdom').jsdom;
const doc = jsdom('<div id="log"></div>', {});
var window = doc.defaultView; // eslint-disable-line no-var

// We could do this for `window` but some tests use some basic DOM,
//   including these below (which are accessed globally, and not
//   as `window` properties, however).
// this.window = this;
[
    // Needed by testing framework
    'clearTimeout', 'setTimeout',
    'addEventListener', 'document', 'location'
].forEach(function (prop) {
    this[prop] = window[prop];
}, this);

// Todo: We might switch to conditionally use Unicode version
// require('../dist/indexeddbshim-node')(window);
require('../dist/indexeddbshim-UnicodeIdentifiers-node')(global);
window.indexedDB = global.indexedDB;

/*
// We are setting on the vm code's global, but some scripts may
//   conceivably check for them on the `window` (but applying
//   does not currently change any test results)
[
    'indexedDB', 'IDBFactory', 'IDBDatabase', 'IDBObjectStore', 'IDBIndex',
    'IDBTransaction', 'IDBCursor', 'IDBCursorWithValue', 'IDBKeyRange',
    'IDBRequest', 'IDBOpenDBRequest', 'IDBVersionChangeEvent'
].forEach(function (prop) {
    window[prop] = global[prop];
});
*/

// shimIndexedDB.__debug(true);
global.DOMException /* = window.DOMException */ = indexedDB.modules.DOMException;
global.Event /* = window.Event */ = indexedDB.modules.ShimEvent;

/* globals finished, scores, shimTests, get_assertion */
/* eslint-disable no-unused-vars, no-var */
const global = this;
var self = global;
self.parent = self;

const jsdom = require('jsdom').jsdom;
const doc = jsdom('<div id="log"></div>', {});
var window = doc.defaultView;

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
});

// Todo: We might switch to conditionally use Unicode version
// require('../dist/indexeddbshim-node')(window);
require('../dist/indexeddbshim-UnicodeIdentifiers-node')(global);
window.indexedDB = global.indexedDB;

const colors = require('colors/safe');
const theme = {
    pass: 'green',
    fail: 'red',
    timeout: 'red',
    notrun: 'red'
};
colors.setTheme(theme);
function write (statusText, status) {
    const color = colors[Object.keys(theme)[status]];
    let msg = color(statusText);
    scores[statusText] += 1;
    msg += scores[statusText];
    (process && process.stdout && process.stdout.isTTY) ? process.stdout.write(msg) : console.log(msg);
}

function reportResults (tests, statText, assertions, fileName) {
    tests.forEach((test) => {
        const statusText = statText[test.status];
        write(statusText, test.status);
        if (!shimTests[statusText].includes(fileName)) shimTests[statusText].push(fileName);
        console.log(' (' + fileName + '): ' + test.name);
        if (assertions) console.log(get_assertion(test));
        if (test.message && test.stack) console.log((test.message || ' ') + test.stack);
    });
    finished();
}

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

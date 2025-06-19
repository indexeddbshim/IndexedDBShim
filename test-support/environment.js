/* globals shimNS -- This environment */
var window = this; // eslint-disable-line no-var, no-unused-vars, consistent-this -- Needed by framework?
var self = this; // eslint-disable-line no-var, consistent-this -- Needed by framework?
self.parent = self;

(function () {
    const nonEnumerables = ['IDBVersionChangeEvent', 'IDBRequest', 'IDBOpenDBRequest', 'IDBTransaction', 'IDBKeyRange', 'IDBCursor', 'IDBCursorWithValue', 'IDBDatabase', 'IDBObjectStore', 'IDBIndex', 'IDBFactory', 'indexedDB'];
    // https://github.com/w3c/webidl2.js/issues/426
    if (!shimNS.window.$$isHarnessTest) {
        nonEnumerables.push('Object');
    }
    nonEnumerables.concat(
        // Needed early by testing framework
        'Function', 'TypeError',
        'clearTimeout', 'setTimeout',
        'addEventListener', 'document',
        'location', 'ImageData', 'Blob', 'File', 'Event', 'MessageChannel',
        'DOMMatrix', 'DOMMatrixReadOnly', 'DOMPoint', 'DOMPointReadOnly',
        'DOMRect', 'DOMRectReadOnly',
        'BigInt', 'ArrayBuffer', 'FileReader', 'Promise'
    ).forEach((prop) => {
        // Isn't working for 'indexedDB' and its getter; see <https://github.com/axemclion/IndexedDBShim/issues/280>
        const desc = Object.getOwnPropertyDescriptor(shimNS.window, prop);
        // Todo: This doesn't seem to work for Event, EventTarget, CustomEvent, DOMStringList as still enumerable
        if (desc) {
            Object.defineProperty(this, prop, desc);
        } else {
            // `addEventListener` has none (in browser also)
            this[prop] = shimNS.window[prop].bind(shimNS.window);
        }
    });
}());

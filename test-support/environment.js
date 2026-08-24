/* globals shimNS -- This environment */
var window = this; // eslint-disable-line no-var, no-unused-vars, consistent-this -- Needed by framework?
var self = this; // eslint-disable-line no-var, consistent-this -- Needed by framework?
self.parent = self;

(function () {
    const nonEnumerables = ['IDBVersionChangeEvent', 'IDBRequest', 'IDBOpenDBRequest', 'IDBTransaction', 'IDBKeyRange', 'IDBCursor', 'IDBCursorWithValue', 'IDBDatabase', 'IDBObjectStore', 'IDBIndex', 'IDBFactory', 'IDBRecord', 'indexedDB'];
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
        // `ArrayBuffer` deliberately excluded: it's a plain ECMAScript
        //   global the sandbox already has its own correct-realm copy of,
        //   and copying jsdom's different one over it here would break
        //   `instanceof ArrayBuffer` checks against buffers `Key.js`
        //   produces -- see `node-idb-test.js`'s `sandboxObj` comment.
        'BigInt', 'FileReader', 'Promise'
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

    // We need to overcome the `value.js` test's `instanceof` checks as
    //   our IDB object is injected rather than inline; jsdom doesn't make
    //   them available as `window` properties. Applied here (rather than
    //   later, in `custom-reporter.js`) so it's in place before any
    //   *synchronous* `test()` (as opposed to `async_test()`) runs its
    //   assertions -- those execute immediately, inline, as this whole
    //   file is evaluated top to bottom, so a fix placed later would be a
    //   no-op for a test whose assertions run before that point is
    //   reached (e.g. idb_binary_key_conversion.any.js's first
    //   `key instanceof Array` check).
    Object.defineProperty(Array, Symbol.hasInstance, {
        value: (obj) => Array.isArray(obj),
        configurable: true
    });

    Object.defineProperty(Date, Symbol.hasInstance, {
        value: (obj) => shimNS.isDateObject(obj),
        configurable: true
    });

    // testharness.js's own `show_results()` (building its native HTML
    //   results table) walks its `["tag", attrs, ...children]` template
    //   arrays and checks `children[i] instanceof Object` to decide whether
    //   a child is a nested template (array) or plain text -- since these
    //   arrays are cross-realm relative to whatever realm `Object` is
    //   evaluated from here, that check can spuriously come back `false`,
    //   causing nested templates to be stringified as text (e.g. the results
    //   table's own child elements) instead of rendered, and (worse) causing
    //   a later `getElementById("rerun")` lookup on the now-malformed markup
    //   to return `null` and throw -- aborting the shared `all_done_callbacks`
    //   loop before our own `add_completion_callback` handler in
    //   `custom-reporter.js` ever gets to run. Same fix as `Array`/`Date`
    //   above, generalized: match real `instanceof Object` semantics (true
    //   for any non-null object or function) regardless of which realm the
    //   value came from.
    Object.defineProperty(Object, Symbol.hasInstance, {
        value: (obj) => obj !== null && (typeof obj === 'object' || typeof obj === 'function'),
        configurable: true
    });
}());

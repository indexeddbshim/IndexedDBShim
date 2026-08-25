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
        'addEventListener', 'removeEventListener', 'document',
        'location', 'ImageData', 'Blob', 'File', 'Event', 'MessageChannel',
        'DOMMatrix', 'DOMMatrixReadOnly', 'DOMPoint', 'DOMPointReadOnly',
        'DOMRect', 'DOMRectReadOnly',
        // `ArrayBuffer` deliberately excluded: it's a plain ECMAScript
        //   global the sandbox already has its own correct-realm copy of,
        //   and copying jsdom's different one over it here would break
        //   `instanceof ArrayBuffer` checks against buffers `Key.js`
        //   produces -- see `node-idb-test.js`'s `sandboxObj` comment.
        'BigInt', 'FileReader', 'Promise', 'AbortController', 'AbortSignal'
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

    // `Event`/`EventTarget` (from `eventtargeter`) are real singleton
    //   objects, constructed once in the OUTER, non-sandboxed Node process
    //   -- so their `.prototype`'s own `[[Prototype]]` is the *outer*
    //   realm's `Object.prototype`, set by V8 when `eventtargeter`'s module
    //   code first ran there. idlharness.js's own "existence and properties
    //   of interface prototype object" check compares that against *this*
    //   sandbox's `Object.prototype` (a bare `Object` reference resolved
    //   here, inside the sandbox) -- two different objects, so the check
    //   fails despite there being no real conformance gap. Re-pointing
    //   these onto this sandbox's own `Object.prototype` (fresh for every
    //   file's own fresh sandbox, same as the `Symbol.hasInstance` patches
    //   above) fixes the comparison without needing these classes to be
    //   re-declared per sandbox.
    // `CustomEvent` is deliberately excluded here: its prototype is
    //   already correctly chained to `Event.prototype` (not directly to
    //   `Object.prototype`) automatically, since `CustomEvent` is a real
    //   `class CustomEvent extends Event` in eventtargeter -- re-pointing
    //   it here would overwrite that link.
    [
        'Event', 'EventTarget', 'IDBKeyRange', 'IDBCursor',
        'IDBObjectStore', 'IDBIndex', 'IDBFactory', 'IDBRecord'
    ].forEach((name) => {
        const ctor = shimNS.window[name];
        if (ctor && ctor.prototype) {
            Object.setPrototypeOf(ctor.prototype, Object.prototype);
        }
    });

    // `DOMException` is passed directly into this sandbox via `sandboxObj`
    //   (see `node-idb-test.js`), rather than copied from `shimNS.window`
    //   -- deliberately, so IndexedDBShim's own thrown `DOMException`s
    //   (built with this same, OUTER-realm native class) satisfy
    //   `instanceof` checks here. That directness means two things about
    //   it don't yet match a real browser: it's still enumerable on this
    //   sandbox's global (an artifact of `sandboxObj` being passed as a
    //   plain object literal, which `vm` exposes as-is), and its
    //   `.prototype`'s own `[[Prototype]]` is the *outer* realm's
    //   `Error.prototype`, not this sandbox's -- the same cross-realm
    //   mismatch as `Event`/`EventTarget` above. Fixed here, fresh per file.
    Object.defineProperty(this, 'DOMException', {
        value: DOMException,
        writable: true,
        enumerable: false,
        configurable: true
    });
    Object.setPrototypeOf(DOMException.prototype, Error.prototype);
}());

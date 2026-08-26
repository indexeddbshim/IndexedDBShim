## KNOWN ISSUES

All code has bugs, and this project is no exception.  If you find a bug,
please [let us know about it](https://github.com/indexeddbshim/indexeddbshim/issues).
Or better yet, [send us a fix](https://github.com/indexeddbshim/indexeddbshim/pulls)!
Please make sure someone else hasn't already reported the same bug though.

Here is a summary of main [known issues](https://github.com/indexeddbshim/IndexedDBShim/issues/262#issuecomment-254413002)
to resolve:

1. `blocked` and `versionchange` `IDBVersionChangeEvent` event support ([#2](https://github.com/indexeddbshim/IndexedDBShim/issues/2) and [#273](https://github.com/indexeddbshim/IndexedDBShim/issues/273)) across
processes/browser windows
1. Some issues related to [task/micro-task timing](https://github.com/indexeddbshim/IndexedDBShim/issues/296)
in Node (for inherent limitations in the browser, see below).
1. [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData) storage on Node 14 when used with `node-canvas` - due to [this issue](https://github.com/Automattic/node-canvas/issues/1646)

There are a few bugs that are outside of our power to fix.  Namely:

### Task/micro-task timing

IndexedDB transactions [will timeout](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB#Adding_data_to_the_database)
so long as there are no detected active requests.

While a single promise delay (a "microtask") is not supposed to be
long enough to cause a transaction timeout (and they do not in Node
where we have control over extending the transaction), it could possibly
occur in our browser implementation.

(Note that chaining multiple promises or having a long-resolving
promise will likely cause a transaction to expire even in compliant
implementations.)

[This test](https://github.com/web-platform-tests/wpt/blob/master/IndexedDB/transaction-deactivation-timing.html) and
[this one](https://github.com/web-platform-tests/wpt/blob/master/IndexedDB/upgrade-transaction-deactivation-timing.html)
demonstrate the *expected* timeout behavior with regard to `setTimeout`
or promises and transaction expiration.

3. MICROTASK CHECKPOINT BETWEEN LISTENERS OF THE SAME EVENT

- `transaction-deactivation-timing.any.js`: 4 of 5 tests pass. The one
    failure, "Deactivation of new transactions happens at end of
    invocation," registers *two* listeners on the same request's
    `success` event. The first listener schedules a microtask (e.g.
    `Promise.resolve().then(...)`); per spec, that microtask must run to
    completion *before* the second listener is invoked -- dispatching an
    event to multiple listeners isn't a tight synchronous loop, each
    listener invocation is its own callback-completion boundary, and the
    browser drains the microtask queue between them. `eventtargeter`'s
    `invokeCurrentListeners` (its dispatch loop) instead invokes
    same-type listeners back to back synchronously, with no yield point
    in between, so a microtask scheduled by the first listener hasn't
    run yet by the time the second one executes.

    This can't be fixed without breaking a real spec guarantee, not just
    "a lot of code to change": a real browser achieves the microtask
    interleaving using native (non-JS) access to the microtask queue,
    while `dispatchEvent()` itself still returns synchronously, with a
    plain `boolean`, only once *every* listener and everything it
    scheduled has fully settled. There is no JS/Node API that lets a
    still-executing synchronous function force the microtask queue to
    drain and resume -- draining only happens when the call stack
    actually unwinds. (V8 itself does expose exactly this as a native
    intrinsic, `%RunMicrotasks()`, but only under the `--allow-natives-
    syntax` flag, which is not something production code can rely on
    being enabled -- Node deliberately keeps V8 native syntax
    unavailable outside of V8's own test suite.) So replicating the
    interleaving in pure JS would
    require `dispatchEvent()` to become genuinely asynchronous (return a
    `Promise<boolean>`, or otherwise require the caller to `await` it).
    But `dispatchEvent()`'s synchronous, `boolean`-returning signature is
    the literal DOM `EventTarget` spec contract -- the exact thing this
    library exists to accurately emulate. Any real consumer code using
    the universal `if (target.dispatchEvent(evt)) { ... }` pattern to
    check whether an event was cancelled would silently break, since a
    `Promise` object is always truthy regardless of whether
    `preventDefault()` was called. So the fix for this one WPT edge case
    would make the polyfill non-compliant with the exact spec behavior
    it exists to provide, for every normal use of `dispatchEvent()` --
    not an acceptable trade for one test.

### [Structured Cloning Algorithm](https://html.spec.whatwg.org/multipage/infrastructure.html#safe-passing-of-structured-data)

Due to
[certain challenges](http://stackoverflow.com/questions/42170826/categories-for-rejection-by-the-structured-cloning-algorithm)
in detecting cloneable objects from within JavaScript, there are certain
limitations regarding cloning. They may be other subtleties we have not been
able to work around.

#### Proxies

1. We cannot properly detect `Proxy` to throw upon encountering such
    non-cloneable objects. The same limitation applies to key validation --
    a `Proxy` wrapping an otherwise-valid key (e.g., `new Proxy([1, 2, 3],
    {})`) is indistinguishable from a real key, so it is accepted rather
    than rejected as invalid; the corresponding WPT test case is live-edited
    out of `key_invalid.any.js` by our own test harness (see
    `test-support/node-replacement-hacks.js`) rather than left failing

- 'key_invalid.any.js'/'key_invalid.any.worker.js' - We can't detect proxies
    from JS, so a `Proxy`-wrapped array is indistinguishable from a real one
    and can't be rejected as an invalid key; that one WPT test case is
    live-removed at load time via `node-replacement-hacks.js` rather than
    left failing (see README's Known Issues)

#### Overriding globals

1. Our reliance on `Object.prototype.toString` to detect uncloneable objects
    can fail if that method is overridden or if `Symbol.toStringTag` is used
    to change the default reporting of a given "class".

#### Deprecated specs for synchronous resolution of Blobs and Files

1. Although they are currently working, we were only able to resolve `Blob`,
    `File`, and `FileList` objects synchronously (as
    [required per spec](https://github.com/indexeddbshim/IndexedDBShim/issues/285))
    using the now-deprecated `XMLHttpRequest` synchronous API.

We also have limitations in creating certain objects synchronously, namely, the
one method for creating an image bitmap, `createImageBitmap`, returns a
`Promise`, so we cannot clone a bona fide image bitmap synchronously so as to
obtain any errors synchronously as expected by the IndexedDB methods involving
cloning.

### Error.prototype.stack Accessor

- `../non-indexedDB/DOMException-stack-accessor.js`: 3 of 9 tests pass.
    All 6 failures are about `Error.prototype.stack`'s own property
    descriptor (`Object.getOwnPropertyDescriptor(Error.prototype, 'stack')`
    returns `undefined` in this Node/V8 environment, where the WPT test
    expects an accessor property with `get`/`set`). Looks like a genuine
    Node/V8-vs-browser-V8 engine difference in how `Error.stack` is
    exposed (per-instance vs. an `Error.prototype`-level accessor), not
    something `DOMException`'s shim controls or can polyfill without
    reaching into `Error.prototype` itself.

### Deadlocking (requiring solution of separate databases per store)

- `idb-explicit-commit.any.js`: 9 of 12 tests pass -- `commit()` itself
  (committing, going inactive immediately, throwing on double-commit or
  abort-after-commit, etc.) is fully implemented and correct. The 10th
  test, "Transactions with same scope should stay in program order, even
  if one calls commit", deadlocks (and permanently blocks the remaining
  2 tests in the file, which testharness.js never gets to run): it starts
  a `readwrite` transaction on `books` kept artificially alive by
  continuously re-queuing `get()` requests, then expects a *different*,
  non-overlapping-scope `readonly` transaction on `not_books` to run
  concurrently and complete -- which is exactly what `IDBDatabase.js`'s
  own `transaction()` comment already documents as unsupported: the
  WebSQL/SQLite backend locks the *whole* database per transaction, not
  per-scope, so non-overlapping transactions still serialize behind each
  other. The `not_books` transaction can never run until the `books` one
  finishes, but the `books` one is only released by the `not_books`
  transaction completing -- a genuine deadlock from this pre-existing
  whole-database-locking limitation, not a `commit()` bug. Fixing it for
  real would mean the same "save the stores in separate databases"
  change already called out as needed in `IDBDatabase.js`. However, doing
  this would mean not easily being able to span multiple stores atomically
  in a single transaction (it might be doable with ATTACH DATABASE), and
  in any case would suffer from unduly proliferating the number of databases
  that get created.

### TIming/Transaction Finished Timing

Our actual SQLite driver (`better-sqlite3`, wired in via
`src/nodeSQLiteDatabase.js`) is already fully synchronous --
`stmt.run()`/`stmt.all()` execute directly, no callbacks. But
`SQLiteDatabase.prototype.exec` there deliberately wraps its callback in
a real macrotask (`setImmediate`, not a microtask) before invoking it:
without that deferral, code that synchronously re-issues a new request
from within a request's own callback (e.g. to keep a transaction alive,
a pattern several WPT tests use) would chain microtask to microtask
forever and starve out any `setTimeout`-based scheduling, including
IndexedDB's own internal request queue. So the remaining "transactions
don't finish before the next task" gap is a deliberate JS-level
scheduling choice made for that specific, already-solved reason, not a
synchronous-vs-asynchronous driver limitation -- switching drivers
wouldn't change this on its own. Tightening the deferral itself
(swapping the prior `setTimeout(..., 0)` for `setImmediate`, which
fires sooner in Node's event loop while still being a macrotask) turned
out to genuinely fix a real class of timing failures in the window
context: several `*-exception-order.any.js` tests (e.g.
`idbcursor-advance-exception-order.any.js`,
`idbobjectstore-add-put-exception-order.any.js`) used to need our test
harness's own `setTimeout` wrapped with an extra +500ms padding to
reliably observe a transaction as finished by the time it fired;
`setImmediate` closes that gap on its own, so the padding was removed
from `node-idb-test.js`'s window-context setup. The worker context
still needs it, though (see `webworker-child.js`): a worker's script
runs in a real, separate child process reached over a socket, and that
round-trip adds latency `setImmediate`'s tighter deferral doesn't
cover.

Although the worker test does modify the tests, these test requirements
are nevertheless essentially met if taking into account the environment's
limitations.

### Origins

The shim fundamentally lacks a true multi-origin architecture.
Because the Node testing environment operates as a single
filesystem, all origins share a single global `__sysdb__`
SQLite file for database versioning and the same physical
SQLite files (e.g. `D_dbname.sqlite`) for storage. True
data segregation does not exist; if `https://a.com` and
`https://b.com` open a database with the same name, they
will write to the same file.

Furthermore, while the shim's in-memory `connectionQueue`
segregates transaction locks by origin (accidentally
simulating isolated locking), global schema operations
like `deleteDatabase` check the unsegregated `__connections`
registry. As a result, cross-origin interactions will
globally block each other and improperly fire `blocked`
events. The `hasNullOrigin()` checks in `open()` and
`deleteDatabase()` are merely spec-compliant veneers to
throw `SecurityError`s for opaque origins (like `data:`
or `file://`), but do not provide true isolation.

Resolving this would necessitate including the origin within
the already long file name.

### Realms

Cross-realm operations typically test whether calling a
detached `<iframe>`'s prototype method against a
main-realm object throws a cross-realm `TypeError` (often
caused by native V8 C++ brand checking).

Practically, because this shim is implemented entirely
in JavaScript rather than native C++ bindings, it
inherently bypasses strict V8 brand-checking boundaries,
making cross-realm invocations natively safe.
Furthermore, because our offline JSDOM testing harness
spawns dynamically created iframes without any IndexedDB
implementations on their `contentWindow`, true
cross-realm testing is impossible. We satisfy the
WPT requirements by manually injecting the main
window's IDB classes into the iframe's context, proving
the pure-JS prototype methods operate safely.

### Environment-specific

#### Browser rollback

While we do try to rollback the database version in the browser when
called for, as we are not able to prolong WebSQL transactions to benefit
from the auto-rollback they perform upon encountering an error (nor
does WebSQL permit manual ROLLBACK commands so that we could undo the
various WebSQL calls we need to make up IndexedDB transactions), we are
not able to provide safe rollbacks in the browser. The synchronous WebSQL
API was not apparently well supported, at least it is missing in Safari
and Chrome, and it would particularly degrade performance in a Node
environment.

The special build of `websql` that we use does allow such
IndexedDB-spec-compliant (and data-integrity-friendly!) rollback behavior
in Node.

See below on task/micro-task timing for more.

### iOS

Due to a [bug in WebKit](https://bugs.webkit.org/show_bug.cgi?id=137034), the
`window.indexedDB` property is read-only and cannot be overridden by
IndexedDBShim.  There are two possible workarounds for this:

1. Use `window.shimIndexedDB` instead of `window.indexedDB`
1. Create an `indexedDB` variable in your closure

By creating a variable named `indexedDB`, all the code within that closure
will use the variable instead of the `window.indexedDB` property.  For
example:

```js
(function () {
    // This works on all browsers, and only uses IndexedDBShim as a final fallback
    var indexedDB = window.indexedDB || window.mozIndexedDB || // eslint-disable-line no-var -- Older browsers
        window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

    // This code will use the native IndexedDB, if it exists, or the shim otherwise
    indexedDB.open('MyDatabase', 1);
}());
```

### Windows Phone

*This information might be outdated. Reports on current support or fixes welcome.*

IndexedDBShim works on Windows Phone via a Cordova/PhoneGap plug-in.  There
are two plugins available: [cordova-plugin-indexedDB](https://github.com/MSOpenTech/cordova-plugin-indexedDB)
and [cordova-plugin-indexeddb-async](https://github.com/ABB-Austin/cordova-plugin-indexeddb-async).
Both plug-ins rely on a WebSQL-to-SQLite adapter, but there are differences
in their implementations.  Try them both and see which one works best for
your app.

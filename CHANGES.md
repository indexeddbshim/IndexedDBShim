# IndexedDBShim changes

## Version 3.0.0 (Unreleased)

Though we have tried to keep this accurate, some changes listed below might
have been mistakenly ascribed to changes since the previous release whereas
they were actually changes since a more recent version on `master`.

- License: Add back missing MIT license
- Security fix: Avoid SQL injection potential--ensure database, store and
    index names are prefixed as SQLite columns to avoid conflict with built-in
    columns; add test
- Security fix: Ensure `LIKE` clauses escape special characters
- Security fix: Escape SQLite-disallowed-for-column-names NUL characters from
    database, store, and index names
- Security fix: Escape/unescape NUL for safety with
    node-websql->node-sqlite3 (part of fix for #274)
- Security fix: Ensure quoting (for column names) escapes double quotes
- Breaking refactoring with consequences for old data: prefix store/index
    names with "S_" instead of "s_" and "I_" instead of "_" (consistent
    with casing of "D_" though SQLite insensitive with ASCII while file
    systems may be sensitive; more future-compatible)
- Breaking change: Avoid encoding `keyPath` internally as JSON--needs
    Sca encoding; breaks all tables but important to fix!
- Breaking change/Fix: Remove `IDBTransaction` mode constants and tests since
    now being removed from IndexedDB
- Breaking change: Throw if database name is too long, defaulting to 254 (part
    of fix for #274) (enforcing compatibility with Node, given our mapping it to
    file naming on common file systems)
- Breaking change: If you were overriding/monkey-patching globals, these are
    no longer available with a shift to ES6 modules (see below). The `CFG.js`
    module can be imported in its place to change the default values, however.
- Breaking change (minor): Change "modules" property of `IDBFactory` to only
    expose `DOMException`, `Event`, and `IDBFactory` (replacing the former
    use of `idbModules` with ES6 modules and a CFG module for the globals:
    see below)
- Breaking change (minor): Change "eval" to "evaluate" in exception message
    for bad key from `keyPath`
- Breaking change (minor): Remove unneeded `DOMError` methods
- Breaking change (minor): As moved away from SQL offsets for `IDBCursor`
    retrieval, remove `__lastKeyContinued` property (we can use `__key`);
    also remove unused `__multiEntryOffset`
- Deprecate: Numeric constants as second arguments to
    `IDBDatabase.prototype.transaction` (use `readonly`/`readwrite` instead).
- Enhancement: Add config to allow user to override `escapeDatabaseName`
    function (and for convenience, `unescapeDatabaseName`) or to keep
    it but configure its new config subcomponents,
    `databaseCharacterBlacklist` and/or `databaseNameLengthLimit`
     (part of fix for #274)
- Enhancement: Throw upon receiving bad config property in config methods
- Enhancement: Allow initial config object to `setGlobalVars`
    (e.g., for setting an early `CFG.win` value)
- Enhancement: Allow non-invasive browser build (inspired
    by @bolasblack's fork)
- Enhancement: Add non-standard `webkitGetDatabaseNames` and test file (issue #223)
- Enhancement: Allow `DEFAULT_DB_SIZE` to be set via `CFG.js`;
- Enhancement: `IDBIndex` methods, `get`, `getKey`, `count` to allow obtaining
    first record of an `IDBKeyRange` (or `IDBKeyRange`-like range) and change
    error messages to indicate "key or range"
- Enhancement: Support Node cleanly via `websql` SQLite3 library including
    customization of SQLite `busyTimeout`, `trace` and `profile`
- Enhancement: Add `IDBObjectStore.openKeyCursor`
- Enhancement: Add `IDBKeyRange.includes()` with test
- Enhancement: Allow ranges to be passed to `IDBObjectStore.get` and
    `IDBObjectStore.delete()`
- Enhancement: Allow key argument with `IDBCursor.continue`.
- Enhancement: Key value retrieval: Allow "length" type key
- Enhancement: Add ".sqlite" extension to database name for sake of (Windows)
    file type identification
- Enhancement: Expose `__setConfig(prop, val)` method for setting pseudo-global
    property used internally for config and `shimIndexedDB.__getConfig()`
    to read
- Enhancement: Expose `__setUnicodeIdentifiers()` for setting Unicode
    regular expression strings for full key path validation compliance (could
    slow loading/performance as depends on large regular expressions)
- Enhancement: Implement `IDBTransaction.objectStoreNames`
- Enhancement: Add `IDBObjectStore.name` and `IDBIndex.name` setters (untested)
- Enhancement: Add various missing lesser event properties (`NONE`,
    `CAPTURING_PHASE`, `AT_TARGET`, `BUBBLING_PHASE`) and initialize readonly
    `target`, `currentTarget`, `defaultPrevented`, `isTrusted`.
- Enhancement: Utilize `EventTarget` to invoke `dispatchEvent` to allow
    invocation of multiple listeners as by `addEventListener` (not
    yet treating bubbling or `preventDefault`); change `ShimEvent` to utilize
    polyfill from `eventtarget`
- Enhancement: Expose `ShimDOMStringList` on `indexedDB.modules` for
     sake of tests (the former also renamed internally for interfaces
     testing); we may deprecate `indexedDB.modules` however, as
     `CFG.addNonIDBGlobals` is now allowing export
- Enhancement: Add new `CFG` property, `addNonIDBGlobals`, to allow
     polyfilling non-IndexedDB interfaces used internally (and needed
     potentially for testing); `ShimDOMStringList`, `ShimDOMException`,
     `ShimEvent`, `ShimCustomEvent`, and `ShimEventTarget`
- Enhancement: Add non-standard `sqlError` property to `DOMException`
    for facilitating debugging
- Enhancement: Export `ShimCustomEvent` and `ShimEventTarget` shims we
    are using on `IDBFactory.modules` for sake of testing checks
- Missing API: Add `IDBCursor.continuePrimaryKey` (untested)
- Missing API: Implement `IDBObjectStore.getKey` (untested)
- Missing APIs: Implement `IDBIndex.getAll/getAllKeys` (untested)
- Missing APIs: Implement `IDBObjectStore.getAll`,
      `IDBObjectStore.getAllKeys` (untested)
- Fix: Avoid `continue` errors upon multiEntry checks with open-ended ranges
- Fix: Ensure `deleteDatabase` SQLite execution errors (not only
     its transaction errors) are properly surfaced (probably shouldn't
     occur once we implement blocking transactions anyways, but
     should resolve in case such errors may occur)
- Fix: Add error codes on `DOMException`'s for sake of
    web-platform-tests' testharness.js even though new spec does not
    list the codes and `code` is listed on MDN as no longer being set
    on new exceptions
- Fix: Ensure `AbortError` sent to `IDBOpenDBRequest.onerror` upon a
    transaction aborting or a connection being closed within an upgrade
    transaction
- Fix: Set `IDBOpenDBRequest.transaction` to `null` upon `AbortError` due to
    closed connection
- Fix: Set `error` property of `IDBTransaction` for certain tx aborts
- Fix: 'error' and 'abort' bubbling events
   ((`IDBRequest`->) `IDBTransaction`->`IDBDatabase`),
   including reuse of same event object upon propagation and potential
   for cancellation as appropriate; used within `IDBTransaction` and
   potentially within `IDBFactory`
- Fix: Set `readyState` to "done", `result` to `undefined`, and `error`
   to a new `AbortError` on each request when aborting a transaction
- Fix: Set transaction active flag on while dispatching success/error
   events
- Fix: Abort transaction upon request "success" handler throwing or
   "error" handler throwing or "error" event not being prevented
- Fix: Trigger queue of "error"-type events on all unfinished
   requests during transaction abort (then "abort" type event on
   transaction)
- Fix: Avoid adding `DOMException` class when error not found (should
   not occur?)
- Fix (minor): Avoid defaulting to `DOMException` class for error
   instances in `IDBFactory`
- Fix: Unknown problems creating/deleting object stores or indexes
   should have `UnknownError` `DOMException` name (and fail through events)
- Fix: Report `ConstraintError` if attempting to add a unique index when
   existing values are not unique
- Fix: Ensure IndexedDB `DOMException` is returned for `IDBFactory`
   method errors instead of WebSQL errors
- Fix: Use `AbortError` as `IDBTransaction.error` property when
   "error" handler throws
- Fix: If transaction already aborted, avoid potential for
   request errors firing
- Fix: If transaction already aborted, avoid running further
   request callbacks or success/error events
- Fix: Throw for `IDBRequest` or `IDBOpenDBRequest` with `result`
   and `error` getters if request not yet done
- Fix: Ensure `IDBOpenDBRequest` `result` is set to `undefined` upon
   erring
- Fix: Ensure `IDBOpenDBRequest` `transaction` is set to `null` upon
   completing or aborting
- Fix: Add duck-typing `instanceof` mechanism for `ShimEvent`
- Fix: Change type to "abort" for transaction abort events
- Fix: Set `readyState` for successful `IDBFactory.deleteDatabase`
    and `IDBFactory.webkitGetDatabaseNames`
- Fix: If calling `deleteDatabase` on non-existing database,
    ensure `oldVersion` is 0 (not `null`)
- Fix: Set `readyState` to 'pending' for `IDBCursor` `continue`/`advance`
- Fix: Avoid adding requests with success events for
    `createObjectStore`/`deleteObjectStore`/`createIndex`/`deleteIndex`
    and store/index renaming
- Fix: Avoid firing multiple `success` events with `IDBFactory.open`
- Fix: Return appropriate IndexedDB error object instead of WebSQL error
    object; fixes #27
- Fix: For `IDBCursor`, move from SQL offsets to utilization of last key as
    per spec (and as needed for discovering any db modifications)
- Fix: In conjunction with `IDBCursor` `continue` and `advance` caching,
    trigger cache resets/changes (for `IDBCursor`: `delete`, `update`
    and for `IDBObjectStore`: `add`, `put`, `delete`, `clear`);
- Fix: Cause `IDBCursor.advance` to properly handle unique values (and also
    take advantage of caching)
- Fix: `IDBCursor` key-based `continue` to be direction-sensitive
- Fix: `IDBCursor` request source should be store or index, not cursor
- Fix:  stores cursor
- Fix: Avoid `cursor.update` always getting next key
- (Fix: Avoid storing cursor (for `IDBObjectStore.count`) if will be no cache)
- Fix: In Safari, default DEFAULT_DB_SIZE to a higher value
    (25 * 1024 * 1024); fixes #115
- Fix: Properly implement and utilize `IDBCursorWithValue`
- Fix: Use latest draft spec's (and implementations') use of `DOMException`
    instead of `DOMError`
- Fix: Replace `instanceof` checks with `Array.isArray()` for arrays and
    with duck-typing otherwise (for reliability with cross-window/module data)
- Fix: For `advance`/`continue`, throw if the cursor source or effective
    object store has been deleted
- Fix: Ensure will throw when "got value flag" is unset during call to
    `continue` or `advance`
- Fix: Ensure "prev" cursor will iterate in descending order on primary key
    (sort by keyPath-indicated value then primary key)
- Fix: Allow empty string keyPath for index to return value as is (for
    handling non-object values as keys)
- Fix: Throw error upon non-finite `IDBCursor.advance` count
- Fix: Ensure the error thrown for a count `<=0` to `advance()` is a genuine
    `TypeError`
- Fix: Ensure other bad counts passed to `advance()` (non-numbers or non-finite
    numbers) throw `TypeError` as per W3C tests (even though the spec is
    silent on bad counts except for count=0)
- Fix: Add transaction to `IDBCursor` request
- Fix: Update keyRange behavior and tests to reflect draft spec
- Fix: Allow `__versionTransaction` not to exist (if user calling it wrong)
    for `create/deleteObjectStore` and test it so it will return an
    `InvalidStateError`
- Fix: Avoid `LIKE` check on auto-increment sequence check (could be store
    name inside another store name);
- Fix: Ensure numeric keys passed to `add()` or `put()` on an auto-increment
    store which are greater or equal to the "current number" will update
    the auto-increment counter
- Fix: Ensure a keyPath added numeric auto-increment key will update the
    auto-increment counter
- Fix: Avoid potential problem with data insertion if an index were named "key"
- Fix: Throw `TypeError` on `IDBKeyRange` methods with inadequate
   arguments and `DataError`-type `DOMException` with explicit
   `undefined`
- Fix: If `lower` is greater than the `upper` argument to `IDBKeyRange.bound`,
    throw a `DataError`
- Fix: Throw `DataError` upon continuing the cursor in an unexpected direction
- Fix: Key validation: Avoid circular arrays
- Fix: Key validation: Disallow Dates with NaN as \[\[DateValue]]
- Fix: Ensure validation occurs for indexes before storage
- Fix: Implement `IDBVersionChangeEvent` properly and utilize to allow
    `instanceof` checks
- Fix: Sort properly for next/prev(unique) (potentially by key,
    primary key, (position,) obj. store position)
- Fix: Be safe in quoting "key" column (reserved SQLite word)
- Fix: For all public methods, seek to ensure error checking occurs in
    spec order and add missing checks
- Fix: Throw for `IDBCursor.update/delete` if transaction not active,
    if source or effective object store deleted, if got value not set,
    or if a key method has been invoked
- Fix: Throw `DataCloneError` if `IDBCursor.update` value is not
    clonable by the Structured Cloning Algorithm
- Fix: Improve structured cloning checking by using cyclonejs (not
    currently used for cloning though could be used elsewhere where
    not needed to be encoded); also avoid use of JSON.stringify
    which only works on a subset of SCA
- Fix: Throw `TypeError` if call to `update()` has no arguments
- Fix: Allow empty string key path to be utilized when validating
    `add`/`put` input
- Fix: Avoid iterating duplicate values for unique iterations
- Fix: Ensure `IDBRequest.error` returns `null` rather than `undefined` upon
    success event
- Fix: Readonly
  - Make `indexedDB` readonly
  - Make `IDBCursor` properties, `key`, `primaryKey`, `direction`,
      `source`, `value` readonly
  - Make `IDBRequest` properties (`result`, `error`, `source`,
      `transaction`, `readyState`) readonly
  - Make `IDBDatabase` properties, `name`, `version`, and
      `objectStoreNames` readonly
  - Make `IDBKeyRange` properties, `lower`, `upper`, `lowerOpen`, and
      `upperOpen` readonly, renaming cached range attributes
  - Make `IDBTransaction` properties, `objectStoreNames`, `mode`, `db`,
      and `error` readonly
  - Make `IDBIndex` properties, `objectStore`, `keyPath`, `multiEntry`,
      `unique` readonly
  - Make `IDBObjectStore` properties, `keyPath`, `indexNames`,
      `transaction`, `autoIncrement` readonly
  - Ensure `keyPath` does not return same instance as passed in (if
      an array)
  - Make `ShimEvent` properties, `type`, `bubbles`, `cancelable`,
      `eventPhase`, `timeStamp` readonly (and for native events, stop
      making `target` writable)
- Fix: Ensure `IDBIndex` properties, `multiEntry`, `unique` are always boolean
- Fix: Ensure an `IDBTransaction.objectStore` call always returns the
    same instance if for the same transaction
- Fix: For `IDBTransaction.abort()`, throw `InvalidStateError` if
    transaction not active
- Fix: Ensure `IDBIndex` retrieval methods throw upon index or store being
    deleted, upon transaction inactive
- Fix: Allow `IDBIndex.count` to pass `null` as key
- Fix: Throw if not in versionchange transaction when calling
    `IDBDatabase.transaction`
- Fix: Ensure `DOMException` variant of `SyntaxError` is thrown for
    bad key paths
- Fix: Handle (mistaken) arguments > 2 to `IDBFactory.open()`
- Fix: In `IDBObjectStore` methods, throw upon transaction inactive;
    fix checking error
- Fix: In `IDBObjectStore.count`, allow `null` (as with `undefined`) to
    indicate unbounded range
- Fix: Correct `IDBRequest.source` to reflect `IDBCursor`, `IDBIndex`,
    or `IDBObjectStore` as appropriate
- Fix: Prevent race condition error if attempting to find indexes during
    insertion when index creation has begun but not yet completed
- Fix: Validate keyPath supplied to `createObjectStore`
- Fix: Allow for empty string keyPath to `createObjectStore`
- Fix: Clone options object passed to `createObjectStore`
- Fix: Overcome lone surrogate limitation in
    node-sqlite3/Python (see <http://bugs.python.org/issue12569> and
    <http://stackoverflow.com/a/6701665/271577>)
- Fix: For `createObjectStore`, throw if transaction is not active, or
    if auto-increment with empty string or array key path
- Fix: Ensure `__versionTransaction` set to `null` and set before `oncomplete`
    so that `versionchange` checks inside `e.target.transaction.oncomplete`
    within `onupgradeneeded` or inside `onsuccess` will fail (and thus will
    attempts to create or delete object stores)
- Fix: Throw InvalidStateError if store deleted (for `IDBObjectStore`
    methods: `add`, `put`, `get`, `delete`, `clear`, `count`, `openCursor`,
    `openKeyCursor`, `index`, `createIndex`, `deleteeIndex`)
- Fix: For `IDBObjectStore.deleteIndex`, throw if not in upgrade
    transaction or if transaction is inactive
- Fix: For `IDBObjectStore.createIndex`, throw `SyntaxError` if not a
    valid keyPath given
- Fix: For `IDBObjectStore.createIndex`, throw if transaction not active
- Fix: Apply `toString()` (and convert from sparse to dense) for
    validation and utilization within key path arrays
- Fix: Validate `IDBKeyRange`-like objects (e.g., passed to cursor methods)
- Fix: Properly ensure with multiEntry conversions that array members which
    fail validation as keys are ignored (and avoid adding duplicate members
- Fix: Ensure `success` event does not fire if database has already been
    closed (in `upgradeneeded`)
- Fix: Make `length` on `DOMStringList` non-enumerable (impacts W3C tests
    and also how implemented in Chrome)
- Fix: Error checking for `DOMStringList` methods
- Fix: Prevent non-numeric and `<= 1` keys from auto-incrementing current number
- Fix: Prevent incrementing if nevertheless valid key is lower than current
    number
- Fix: Ensure sorting of `StringList` (for `IDBDatabase.objectStoreNames`,
    `IDBObjectStore.indexNames`)
- Fix: Escape upper-case letters as table/column names case-insensitive in
    SQLite, but db/store/index names not case-insensitive in IndexedDB
- Fix: Stringify calls to `IDBDatabase.createObjectStore` and
    `IDBObjectstore.createIndex` as per W3C tests
- Fix: Avoid setting `source` for `open` request, as, per new spec, it is
    to always be `null`
- Fix: Ensure cloning value before as well as after key evaluated (otherwise,
    original object will be modified)
- Fix: Check for array on range within multiEntry cursor iteration; fixes
    issue #222
- Fix: Copy SQLite row `item` object properties (for Safari); fixes issue #261
- Fix: Genuinely rollback version in Node
    - Wrap all possible `openDatabase` operations, including version changes
        into an effectively single transaction;
    - Revert `IDBDatabase` `version` and `objectStoreNames`, `IDBObjectStore`
        `name` and `indexNames`, `IDBIndex` `name` properties after aborted
        transactions;
    - Allow `dbVersions` table insert to be undone in one transaction
        (also avoids second query);
    - If connection closed or errs, rollback; otherwise, commit only after
        transaction finished;
    - Reimplement `deleteDatabase` to delete from `dbVersions` first and
        rollback everything if there is a failure
- Fix: In browser, only version can be consistently rolled back since we
    can't extend WebSQL transaction expiration (and thus force an error to
    get auto-rollback given that ROLLBACK is not supported)
- Fix: Destroy index entries from index set upon store deletion and
    still allow recreation of store handles (but not removing whole
    clone record, allowing its properties to still be examined)
- Fix: As per spec, `DELETE` then `INSERT` rather than `UPDATE` for
    `IDBCursor.update`
- Fix: Add support for new "closed" event via a custom
    `IDBFactory.__forceClose()` method (untested)
- Fix: Do not set got value flag if end of iteration (and also avoid
   setting irrelevant got value flag on count cursors)
- Fix: Closing the database in an upgrade transaction should not
   prevent execution of the `oncomplete` handler (though an `AbortError`
   will subsequently occur)
- Fix: Allow `IDBFactory.open()` to accept explicit `undefined` version
- Fix: Round down version in `IDBFactory.open()` (when `> 1`)
- Fix: Ensure store names passed into `IDBDatabase.transaction` are stored
    as unique names and are sorted
- Fix: Add `Symbol.toStringTag` (or `toString`) to `IDB*` classes for proper
    `Object.prototype.toString.call`-type invocations checked in
    W3C interface tests)
- Fix: Throw precise and better ordered exceptions upon
    non-strings or non-iterable objects or non-string sequences being
    supplied as `storeNames` argument to `IDBDatabase.transaction` (as
    should occur per WebIDL when converting to a
    "DOMString or sequence\<DOMString\>");
    see <https://heycam.github.io/webidl/#es-sequence>
- Fix: Add iterator to `DOMStringList` as it should be convertable
    to sequence\<DOMStringList\> per
    <https://html.spec.whatwg.org/multipage/infrastructure.html#domstringlist>
    and <https://infra.spec.whatwg.org/#list-iterate>
- Fix: Make `DOMStringList` non-enumerable but configurable
- Fix: Interface changes for `DOMStringList`: illegal constructor, length
   enumerable, `instanceof` override
- Fix: WebIDL-based changes, including:
   1) new `CFG` option `fullIDLSupport` to avoid expensive
       `setPrototypeOf` by default;
   2) Illegal constructor and `prototype` invocation (while allowing
       normal access)
   3) Make `prototype` non-writable as appropriate
   4) Ensure `constructor` set on `prototype` as appropriate
   5) Proper `Symbol.toStringTag` and `toString` exposure on
       classes and prototypes
   6) Use `arguments` object in place of some function parameters
       to get proper function lengths
   7) Set properties to appropriate `enumerable`/`configurable`
   8) Set proper inheritance hierarchy, including to `EventTarget` or
       `Event`
- Fix: Properly report global shimming errors when setting a readonly
   failed and `Object.defineProperty` is not present
- Repo files: Rename test folders for ease in distinguishing
- Optimize: Only retrieve required SQLite columns for `IDBIndex`
      get operations
- Optimize: Have `IDBObjectStore` and `IDBIndex`'s `get` and
      `getKey` only retrieve one record from SQLite
- Optimize: use WebSQL `readTransaction` as possible/when in `readonly` mode
- Optimize: Run SELECT only on columns we need
- Optimize: Avoid caching and other processing in `IDBCursor` multiEntry
    finds (used by `IDBObjectStore` or `IDBIndex` `count` with key range)
- Optimize: Switch to `SyncPromise` for faster execution
- Refactoring: Replace Node-deprecated `GLOBAL` with `global`
- Refactoring: Rename internal escaping/unescaping functions to semantic
     names and add further documentation
- Refactoring (Avoid globals): Change from using window global to a CFG module
    for better maintainability
- Refactoring (Avoid deprecated): Avoid deprecated `unescape`
- Refactoring (ES6): Add Babel with ES6 module support for imports and add
    to ESLint
- Refactoring (ES6): Move to ES6 modules with babel/browserify (for
    immediately clear semantics and cruft removal), removing 'use strict'
    (redundant for modules) and remove build.js
- Refactoring (ES6): Use `const` where possible, and `let` otherwise and
    add as ESLint rules, other minor changes
- Refactoring (ESLint): Move from JSHint to ESLint and to "standard" config,
    with a few exceptions
- Refactoring: upper-case SQL keywords for greater visual distinction
- Refactoring: Where safe, switch from `typeof ... === 'undefined'` to
    check against undefined (safe for strict mode implicit in modules)
- Refactoring: Use spread operator in place of `arguments` where named
    args not needed (also may be more future-proof)
- Refactoring: Have `setSQLForRange` handle key encoding
- Refactoring: `isObj` utility, further use of `Array.isArray()`
- Refactoring: Rename `Key.getValue` to `Key.evaluateKeyPathOnValue`
    (greater spec parity).
- Refactoring: Key value retrieval: Avoid `eval()` (in Key--still used
    in Sca.js)
- Refactoring: Use ES6 classes for cleaner inheritance
- Refactoring: Avoid JSON methods upon each `objectStore`/`createObjectStore`
    call in favor of one-time in `IDBDatabase`
- Refactoring: Rename and repurpose `Key.validate` to
    `Key.convertValueToKey` (also paralleling terminology in the spec),
    also supporting multiEntry argument
- Refactoring: Replace SQLite auto-increment with our own table since
    SQLite's own apparently cannot be decremented successfully;
    also rename to spec "current number"
- Refactoring: Avoid using native events, as we need to let `EventTarget`
    alter its readonly `target`, `currentTarget`, etc. properties
- Refactoring: Throw count 0 error differently from negative count in
    `IDBCursor.advance`
- Refactoring: Put `DOMStringList` and `IDBVersionChangeEvent` into own
    files
- Updating: Bump various `devDependency` min versions
- Docs: List known issues on README
- Docs: Notice on deprecation for transaction mode constants
- Docs: Update summarization of npm testing info
- Docs: Distinguish `dependencies`/`devDependencies` display on README
- npm: Update packages
- Testing: Update tests per current spec and behavior
- Testing: Ensure db closes after each test to allow non-blocking `open()`
    (was affecting testing)
- Testing: Work on Node tests and for Firefox (including increasing timeouts
    as needed)
- Testing: Rely on `node_modules` paths for testing framework files
- Testing (ESLint): Add compat plugin for browser feature testing
- Testing (fakeIndexedDB.js): Comment out non-standard property checks
- Testing (mock): Update IndexedDBMock tests
- Testing (mock): Expect `InvalidStateError` instead of `ConstraintError`
    when not in an upgrade transaction calling `createObjectStore`
- Testing (W3C Old): Fix global
- Testing (W3C Old): Bump timeout for browser key validity tests
- Testing (W3C Old): `IDBFactory.open` tests to do more flexible
   `instanceof` checks;
- Testing (W3C Old): Fix test to reflect latest draft spec -- see <https://github.com/brettz9/web-platform-tests/pull/1>
- Testing (W3C Old): Cause recursive value test not to be skipped
- Testing (W3C Old): Change example to expect `ConstraintError` (since object
    store already existing per test)--though perhaps should ensure it is
    not yet existing
- Testing (W3C Old): Ensure `DOMException` variant of `SyntaxError` is checked
- Testing (W3C Old): Increase timeout for Node testing `createObjectStore`'s
    `IDBObjectStoreParameters` test and IDBCursorBehavior's
    `IDBCursor.direction`
- Testing (W3C Old): Utilize Unicode in `KeyPath.js` test
- Testing (W3C Old): Update w3c-old to work with browser
- Testing (W3C Old): Fix a few globals, increase test timeouts for
    browser, allow array-like properties as per original tests
- Test scaffolding (W3C Old): Fix args to `initionalSituation()`
- Test scaffolding (W3C Old): Fix test ok condition, typo
- Test scaffolding (W3C Old): Fix assertions
- Testing (W3C): Add new preliminary testing framework (mostly complete)
- Testing (W3C): Add separate tests for events and workers; also
    incorporate test for `DOMStringList`
- (Testing:
    From tests-mocha and tests-qunit (Node and browser), all tests
        are now passing

    From fakeIndexedDB (Node), all tests now passing;
    From fakeIndexedDB (Browser), only the first test is
        passing (as expected due to rollback limitations);

    From indexedDBmock (Node and browser), only database.js is not passing

    From old W3C (Node and browser), only the following are not passing:
        IDBDatabase.close.js,
        IDBObjectStore.createIndex.js,
        TransactionBehavior.js

    From new W3C (Node but potentially also browser):
        See [`/test-support/node-good-bad-files.js`](test-support/node-good-bad-files.js)
            for the current test status on these tests.
- Testing (Grunt): Force ESLint (since "standard" currently causing a warning)
- Testing (Grunt): More granular uglification, add build-browser,
    dev-browser, Unicode watching
- Testing (Grunt): Add Node-specific, Unicode-specific build/dev commands
- Testing (Grunt): Clarify Grunt tasks, expand tasks for cleaning, make tests
    more granular
- Testing (Grunt): Remove now redundant `sourceMappingURL`, use
    `sourceMapName` per current specs
- Testing (Grunt): Add `uglify` to grunt watch task
- Testing (Grunt): Allow use of own sauce access key
- Testing (Grunt): Add task to avoid Saucelabs when running PhantomJS
- Testing (Grunt): Add assorted testing tasks
- Testing (Grunt): Update grunt-node-qunit to support latest QUnit
- Testing (Grunt): Get Saucelabs working (for Chrome and most of Firefox)
- Testing (Grunt): Log Saucelabs results
- Testing (PhantomJS): Deal with PhantomJS error
- Testing (npm): Streamline test names
- Testing (QUnit): Upgrade QUnit refs
- Testing (QUnit): Minimize chances for QUnit random integer failure
- Testing (QUnit): Allow QUnit tests to pass when "Check for globals" enabled
    (put certain test code blocks in closures)
- Testing (QUnit): Separate out QUnit for sake of choosing between browser
    or Node testing, supporting node-qunit for Node testing
- Testing (QUnit): Upgrade to QUnit 2.0 API, lint test files
- Testing (QUnit): Add local copies of QUnit files
- Testing (QUnit): Allow `noanalytics=true` string in QUnit URL
   (slows down testing in China where Google is blocked)
- Testing (Mocha): Conditionally check for `indexedDB.modules` in case we
    are running tests without shim
- Testing improvement: Shim `Event` in Unicode test for parity (even
    if not needed in current tests)
- Testing (Mocha): Add missing `IDBKeyRange/includes-spec.js` to browser
    tests
- Testing (Mocha): Add mocha tests to grunt (along with clean-up) and add
    node-qunit for Node mocha testing
- Testing (Mocha): Allow passing in specific test files to mocha tests
- Testing (Mocha): Add test to ensure unique index checks are safely ignored
    with bad index keys
- Testing (Mocha): Rename test sets for distinguishing
- Testing (Mocha): Change fakeIndexedDB and indexedDBmock to Mocha tests
- Testing (Mocha): Increase default Mocha timeout to 5000ms (Chrome failing some
    at 2000ms as was Node occasionally); tweak as needed
- Testing (Cordova): Update Cordova testing (untested)

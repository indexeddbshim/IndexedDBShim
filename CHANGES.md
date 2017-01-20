# IndexedDBShim changes

## Version 3.0.0 (Unreleased)

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
    regular expression strings
- Enhancement: Implement `IDBTransaction.objectStoreNames`
- Enhancement: Add `IDB.shimIndexedDB.__setUnicodeIdentifiers` scaffolding for
    importing and setting Unicode identifier regular expression strings for
    the sake of full key path validation compliance (may slow
    loading/performance, requires polyfills, and is untested)
- Enhancement: Add `IDBObjectStore.name` and `IDBIndex.name` setters (untested)
- Enhancement: Add various missing lesser event properties (`NONE`,
    `CAPTURING_PHASE`, `AT_TARGET`, `BUBBLING_PHASE`) and initialize readonly
    `target`, `currentTarget`, `defaultPrevented`, `isTrusted`.
- Enhancement: Utilize `EventTarget` to invoke `dispatchEvent` to allow
    invocation of multiple listeners as by `addEventListener` (not
    yet treating bubbling or `preventDefault`); change `ShimEvent` to utilize
    polyfill from `eventtarget`
- Missing API: Add `IDBCursor.continuePrimaryKey` (untested)
- Missing API: Implement `IDBObjectStore.getKey` (untested)
- Missing APIs: Implement `IDBIndex.getAll/getAllKeys` (untested)
- Missing APIs: Implement `IDBObjectStore.getAll`,
      `IDBObjectStore.getAllKeys` (untested)
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
- Fix: Fire abort event synchronously (otherwise transaction
    apparently timing out)
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
- Fix: Throw `TypeError` when `undefined` occurs for both `lower` and `upper`
    bounds
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
- Fix: Add more precise `toString` behaviors on `IDB*` objects and
    `IDBVersionChangeEvent`
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
- (Testing:
    From tests-mocha and tests-qunit (Node and browser), all tests
        are now passing

    From fakeIndexedDB (Node), all tests now passing;
    From fakeIndexedDB (Browser), only the first test is
        passing (as expected due to rollback limitations);

    From indexedDBmock (Node and browser), only database.js is not passing;

    From old W3C (Node and browser), only the following are not passing:
        IDBDatabase.close.js,
        IDBObjectStore.add.js (skipping one for cyclic values),
        IDBObjectStore.createIndex.js,
        TransactionBehavior.js

    From new W3C (Node but potentially also browser):
        The following (241) files contain tests which are all passing:
            "abort-in-initial-upgradeneeded.js","cursor-overloads.js","historical.js","idbcursor-advance-continue-async.js","idbcursor-advance-invalid.js","idbcursor-advance.js","idbcursor-continue.js","idbcursor-direction-index-keyrange.js","idbcursor-direction-index.js","idbcursor-direction-objectstore-keyrange.js","idbcursor-direction-objectstore.js","idbcursor-direction.js","idbcursor-key.js","idbcursor-primarykey.js","idbcursor-reused.js","idbcursor_advance_index.js","idbcursor_advance_index2.js","idbcursor_advance_index3.js","idbcursor_advance_index5.js","idbcursor_advance_index6.js","idbcursor_advance_index7.js","idbcursor_advance_index8.js","idbcursor_advance_index9.js","idbcursor_advance_objectstore.js","idbcursor_advance_objectstore2.js","idbcursor_advance_objectstore3.js","idbcursor_advance_objectstore4.js","idbcursor_advance_objectstore5.js","idbcursor_continue_index.js","idbcursor_continue_index2.js","idbcursor_continue_index3.js","idbcursor_continue_index4.js","idbcursor_continue_index5.js","idbcursor_continue_index6.js","idbcursor_continue_index7.js","idbcursor_continue_index8.js","idbcursor_continue_invalid.js","idbcursor_continue_objectstore.js","idbcursor_continue_objectstore2.js","idbcursor_continue_objectstore3.js","idbcursor_continue_objectstore4.js","idbcursor_continue_objectstore5.js","idbcursor_continue_objectstore6.js","idbcursor_delete_index.js","idbcursor_delete_index2.js","idbcursor_delete_index3.js","idbcursor_delete_index4.js","idbcursor_delete_index5.js","idbcursor_delete_objectstore.js","idbcursor_delete_objectstore2.js","idbcursor_delete_objectstore3.js","idbcursor_delete_objectstore4.js","idbcursor_delete_objectstore5.js","idbcursor_iterating.js","idbcursor_iterating_index.js","idbcursor_iterating_index2.js","idbcursor_iterating_objectstore.js","idbcursor_iterating_objectstore2.js","idbcursor_update_index.js","idbcursor_update_index2.js","idbcursor_update_index3.js","idbcursor_update_index4.js","idbcursor_update_index5.js","idbcursor_update_index6.js","idbcursor_update_index7.js","idbcursor_update_index8.js","idbcursor_update_objectstore.js","idbcursor_update_objectstore2.js","idbcursor_update_objectstore3.js","idbcursor_update_objectstore4.js","idbcursor_update_objectstore5.js","idbcursor_update_objectstore6.js","idbcursor_update_objectstore7.js","idbcursor_update_objectstore8.js","idbcursor_update_objectstore9.js","idbdatabase_createObjectStore-createIndex-emptyname.js","idbdatabase_createObjectStore.js","idbdatabase_createObjectStore10-1000ends.js","idbdatabase_createObjectStore10-emptyname.js","idbdatabase_createObjectStore11.js","idbdatabase_createObjectStore2.js","idbdatabase_createObjectStore3.js","idbdatabase_createObjectStore4.js","idbdatabase_createObjectStore5.js","idbdatabase_createObjectStore6.js","idbdatabase_createObjectStore7.js","idbdatabase_createObjectStore8-parameters.js","idbdatabase_createObjectStore9-invalidparameters.js","idbdatabase_deleteObjectStore.js","idbdatabase_deleteObjectStore2.js","idbdatabase_deleteObjectStore3.js","idbdatabase_deleteObjectStore4-not_reused.js","idbdatabase_transaction.js","idbdatabase_transaction2.js","idbdatabase_transaction3.js","idbdatabase_transaction4.js","idbdatabase_transaction5.js","idbfactory_cmp.js","idbfactory_cmp2.js","idbfactory_deleteDatabase.js","idbfactory_deleteDatabase2.js","idbfactory_deleteDatabase3.js","idbfactory_deleteDatabase4.js","idbfactory_open.js","idbfactory_open10.js","idbfactory_open11.js","idbfactory_open12.js","idbfactory_open2.js","idbfactory_open3.js","idbfactory_open4.js","idbfactory_open5.js","idbfactory_open6.js","idbfactory_open7.js","idbfactory_open8.js","idbindex-multientry-arraykeypath.js","idbindex-multientry-big.js","idbindex-multientry.js","idbindex_count.js","idbindex_count2.js","idbindex_count3.js","idbindex_count4.js","idbindex_get.js","idbindex_get2.js","idbindex_get3.js","idbindex_get4.js","idbindex_get5.js","idbindex_get6.js","idbindex_getKey.js","idbindex_getKey2.js","idbindex_getKey3.js","idbindex_getKey4.js","idbindex_getKey5.js","idbindex_getKey6.js","idbindex_indexNames.js","idbindex_openCursor.js","idbindex_openKeyCursor.js","idbindex_openKeyCursor2.js","idbkeyrange-includes.js","idbkeyrange_incorrect.js","idbobjectstore-rename-errors.js","idbobjectstore_add.js","idbobjectstore_add10.js","idbobjectstore_add11.js","idbobjectstore_add12.js","idbobjectstore_add13.js","idbobjectstore_add14.js","idbobjectstore_add15.js","idbobjectstore_add16.js","idbobjectstore_add2.js","idbobjectstore_add3.js","idbobjectstore_add4.js","idbobjectstore_add5.js","idbobjectstore_add6.js","idbobjectstore_add7.js","idbobjectstore_add8.js","idbobjectstore_add9.js","idbobjectstore_clear.js","idbobjectstore_clear2.js","idbobjectstore_clear3.js","idbobjectstore_clear4.js","idbobjectstore_count.js","idbobjectstore_count2.js","idbobjectstore_count3.js","idbobjectstore_count4.js","idbobjectstore_createIndex.js","idbobjectstore_createIndex10.js","idbobjectstore_createIndex11.js","idbobjectstore_createIndex12.js","idbobjectstore_createIndex13.js","idbobjectstore_createIndex14-exception_order.js","idbobjectstore_createIndex2.js","idbobjectstore_createIndex3-usable-right-away.js","idbobjectstore_createIndex5-emptykeypath.js","idbobjectstore_createIndex6-event_order.js","idbobjectstore_createIndex7-event_order.js","idbobjectstore_createIndex8-valid_keys.js","idbobjectstore_createIndex9-emptyname.js","idbobjectstore_delete.js","idbobjectstore_delete2.js","idbobjectstore_delete3.js","idbobjectstore_delete4.js","idbobjectstore_delete5.js","idbobjectstore_delete6.js","idbobjectstore_delete7.js","idbobjectstore_deleted.js","idbobjectstore_deleteIndex.js","idbobjectstore_get.js","idbobjectstore_get2.js","idbobjectstore_get3.js","idbobjectstore_get4.js","idbobjectstore_get5.js","idbobjectstore_get7.js","idbobjectstore_index.js","idbobjectstore_openCursor.js","idbobjectstore_openCursor_invalid.js","idbobjectstore_openKeyCursor.js","idbobjectstore_put.js","idbobjectstore_put10.js","idbobjectstore_put11.js","idbobjectstore_put12.js","idbobjectstore_put13.js","idbobjectstore_put14.js","idbobjectstore_put15.js","idbobjectstore_put16.js","idbobjectstore_put2.js","idbobjectstore_put3.js","idbobjectstore_put4.js","idbobjectstore_put5.js","idbobjectstore_put6.js","idbobjectstore_put7.js","idbobjectstore_put8.js","idbobjectstore_put9.js","idbrequest_error.js","idbrequest_result.js","idbtransaction-oncomplete.js","idbtransaction.js","idbtransaction_abort.js","idbversionchangeevent.js","index_sort_order.js","keygenerator-constrainterror.js","keygenerator-overflow.js","keygenerator.js","keyorder.js","keypath.js","keypath_invalid.js","keypath_maxsize.js","key_invalid.js","key_valid.js","list_ordering.js","name-scopes.js","objectstore_keyorder.js","request_bubble-and-capture.js","string-list-ordering.js","transaction-abort-generator-revert.js","transaction-create_in_versionchange.js","transaction-lifetime-empty.js","transaction-requestqueue.js","transaction_bubble-and-capture.js","upgrade-transaction-lifecycle-committed.js","value_recursive.js","writer-starvation.js"
        The following (40) files contain tests which are failing:
            "close-in-upgradeneeded.js","idbcursor-continuePrimaryKey-exception-order.js","idbcursor-source.js","idbdatabase_close.js","idbdatabase_close2.js","idbfactory_cmp3.js","idbfactory_cmp4.js","idbfactory_open9.js","idbindex-rename-abort.js","idbindex-rename-errors.js","idbindex-rename.js","idbindex_get7.js","idbindex_get8.js","idbindex_getAll.js","idbindex_getAllKeys.js","idbindex_getKey7.js","idbindex_getKey8.js","idbindex_openCursor2.js","idbindex_openCursor3.js","idbindex_openKeyCursor3.js","idbindex_openKeyCursor4.js","idbkeyrange.js","idbobjectstore-rename-abort.js","idbobjectstore-rename-store.js","idbobjectstore_createIndex4-deleteIndex-event_order.js","idbobjectstore_get6.js","idbobjectstore_getAll.js","idbobjectstore_getAllKeys.js","idbtransaction_objectStoreNames.js","idb_binary_key_conversion.js","idb_webworkers.js","interfaces.js","transaction-abort-index-metadata-revert.js","transaction-abort-multiple-metadata-revert.js","transaction-abort-object-store-metadata-revert.js","transaction-lifetime-blocked.js","transaction-lifetime.js","upgrade-transaction-lifecycle-backend-aborted.js","upgrade-transaction-lifecycle-user-aborted.js","value.js"
        The following (5) files contain tests which are failing due to not running to completion:
            "idbindex-rename.js","idbobjectstore-rename-abort.js","idbobjectstore-rename-store.js","transaction-abort-index-metadata-revert.js","transaction-abort-object-store-metadata-revert.js"
- Testing (Grunt): Force ESLint (since "standard" currently causing a warning)
- Testing (Grunt): More granular uglification, add build-browser,
    dev-browser, Unicode watching
- Testing (Grunt): Add Node-specific build/dev commands
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
- Testing: Increase default Mocha timeout to 5000ms (Chrome failing some
    at 2000ms as was Node occasionally); tweak as needed
- Testing (Cordova): Update Cordova testing (untested)

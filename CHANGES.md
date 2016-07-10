# IndexedDBShim changes

## Version 3.0.0 (Unreleased)

- License: Add back missing MIT license
- Security fix: Avoid SQL injection potential--ensure database, store and
    index names are prefixed as SQLite columns to avoid conflict with built-in
    columns; add test
- Security fix: Ensure LIKE clauses escape special characters
- Security fix: Escape SQLite-disallowed-for-column-names NUL characters from
    database, store, and index names, documenting this limitation
- Security fix: Ensure quoting (for column names) escapes double quotes
- Breaking change/Fix: Remove `IDBTransaction` mode constants and tests since
    now being removed from IndexedDB
- Breaking change: If you were overriding/monkey-patching globals, these are
    no longer available with a shift to ES6 modules (see below). The cfg.js
    module can be imported in its place to change the default values, however.
- Breaking change (minor): Change "modules" property of `IDBFactory` to only
    expose `DOMException`, `Event`, and `IDBFactory` (replacing the former
    use of `idbModules` with ES6 modules and a CFG module for the globals:
    see below)
- Breaking change (minor): Change "eval" to "evaluate" in exception message
    for bad key from `keyPath`
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
- Fix: Ensure the error thrown for a count <=0 to `advance()` is a genuine
    `TypeError`
- Fix: Ensure other bad counts passed to `advance()` (non-numbers or non-finite
    numbers) throw `TypeError` as per W3C tests (even though the spec is
    silent on bad counts except for count=0)
- Fix: Add transaction to `IDBCursor` request
- Fix: Update keyRange behavior and tests to reflect draft spec
- Fix: Adapt changes from wibimaster:Fix_Object_Type to allow object, boolean,
    and `null` type encoding/decoding
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
- Fix: Throw `DataError` instead of `TypeError` with bad
    `get()`/`getKey`/`delete()`
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
    proper order and add missing checks
- Fix: Throw for `IDBCursor.update/delete` if transaction not active,
    if source or effective object store deleted, if got value not set,
    or if a key method has been invoked
- Fix: Throw `DataCloneError` if `IDBCursor.update` value is not
    clonable by the Structured Cloning Algorithm
- Fix: Throw `TypeError` if call to `update()` has no arguments
- Fix: Allow empty string key path to be utilized when validating
    `add`/`put` input
- Fix: Add more precise `toString` behaviors on IDB* objects
- Fix: Avoid iterating unique values
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
- Fix: Assure correct error checking order
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
- Fix: For `IDBObjectStore.createIndex`, throw SyntaxError if not a
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
- Fix: Prevent non-numeric and <= 1 keys from auto-incrementing current number
- Fix: Prevent incrementing if nevertheless valid key is lower than current
    number
- Fix: Ensure sorting of `StringList` (`IDBDatabase.objectStoreNames`,
    `IDBObjectStore.indexNames`)
- Fix: Escape upper-case letters as table/column names case-insensitive in
    SQLite, but db/store/index names not case-insensitive in IndexedDB
- Fix: Stringify calls to `IDBDatabase.createObjectStore` and
    `IDBObjectstore.createIndex` as per W3C tests
- Fix: Avoid setting `source` for `open` request, as, per new spec, it is
    to always be `null`
- Feature: `IDBIndex` methods, `get`, `getKey`, `count` to allow obtaining
    first record of an IDBKeyRange (or IDBKeyRange-like range) and change
    error messages to indicate "key or range"
- Feature: Support Node cleanly via `websql` SQLite3 library
- Feature: Add `IDBObjectStore.openKeyCursor`
- Feature: Add `IDBKeyRange.includes()` with test
- Feature: Allow ranges to be passed to `IDBObjectStore.get` and
    `IDBObjectStore.delete()`
- Feature: Allow key argument with `IDBCursor.continue`.
- Feature: Key value retrieval: Allow "length" type key
- Feature: Add ".sqlite" extension to database name for sake of (Windows)
    file type identification
- Feature: Expose `__setConfig(prop, val)` method for setting pseudo-global
    property used internally for config.
- Feature: Expose `__setUnicodeIdentifiers()` for setting Unicode
    regular expression strings
- Feature: Implement `IDBTransaction.objectStoreNames`
- Feature: Add `IDB.shimIndexedDB.__setUnicodeIdentifier` scaffolding for
    importing and setting Unicode identifier regular expression strings for
    the sake of full key path validation compliance (may slow
    loading/performance, requires polyfills, and is untested)
- Feature: Add `IDBObjectStore.name` and `IDBIndex.name` setters (untested)
- Repo files: Rename test folders for ease in distinguishing
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
- Updating: Bump various `devDependency` min versions
- Documentation: Document `shimIndexedDB.__setConfig()`.
- Testing: Update tests per current spec and behavior
- Testing: Ensure db closes after each test to allow non-blocking `open()`
    (was affecting testing)
- Testing: Work on Node tests and for Firefox (including increasing timeouts
    as needed)
- Testing: Rely on `node_modules` paths for testing framework files
- Testing (mock): Update IndexedDBMock tests
- Testing (mock): Expect `InvalidStateError` instead of `ConstraintError`
    when not in an upgrade transaction calling `createObjectStore`
- Testing (W3C): Fix test to reflect latest draft spec -- see <https://github.com/brettz9/web-platform-tests/pull/1>
- Testing (W3C): Change example to expect `ConstraintError` (since object
    store already existing per test)--though perhaps should ensure it is
    not yet existing
- Testing (W3C): Ensure `DOMException` variant of `SyntaxError` is checked
- Testing (W3C): Increase timeout for Node testing `createObjectStore`'s
    `IDBObjectStoreParameters` test and IDBCursorBehavior's
    `IDBCursor.direction`
- Testing (W3C): Utilize Unicode in KeyPath.js test
- Test scaffolding (W3C): Fix args to `initionalSituation()`
- Test scaffolding (W3C): Fix test ok condition, typo
- Test scaffolding (W3C): Fix assertions
- (Testing:
    From tests-mocha and tests-qunit (Browser and Node), all tests now
        passing;
    From fakeIndexedDB (Node), only fakeIndexedDB.js is not passing;
    From indexedDBmock (Node), only database.js is not passing;
    From W3C (Old, Node), only IDBCursorBehavior.js, IDBDatabase.close.js,
        IDBFactory.open.js, IBObjectStore.add.js,
        IDBObjectStore.createIndex.js,
        IDBObjectStore.put.js, IDBTransaction.abort.js, IDBTransaction.js,
        KeyGenerator.js, RequestBehavior.js, TransactionBehavior.js
        are not passing:
    From W3C (New, Node but potentially also browser): only idbkeyrange.js
        is currently passing
- Testing (Grunt): Clarify Grunt tasks, expand tasks for cleaning, make tests
    more granular
- Testing (Grunt): Remove now redundant `sourceMappingURL`, use
    `sourceMapName` per current specs
- Testing (Grunt): Add `uglify` to grunt watch task
- Testing (PhantomJS): Deal with PhantomJS error
- Testing (QUnit): Upgrade QUnit refs
- Testing (QUnit): Allow QUnit tests to pass when "Check for globals" enabled
    (put certain test code blocks in closures)
- Testing (QUnit): Separate out QUnit for sake of choosing between browser
    or Node testing, supporting node-qunit for Node testing
- Testing (QUnit): Upgrade to QUnit 2.0 API, lint test files
- Testing (Mocha): Add mocha tests to grunt (along with clean-up) and add
    node-qunit for Node mocha testing
- Testing (Mocha): Allow passing in specific test files to mocha tests
- Testing (Mocha): Add test to ensure unique index checks are safely ignored
    with bad index keys
- Testing: Increase default Mocha timeout to 5000ms (Chrome failing some
    at 2000ms as was Node occasionally)
- Testing (Cordova): Update Cordova testing (untested)

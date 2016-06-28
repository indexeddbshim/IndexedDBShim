# IndexedDBShim changes

## Version 3.0.0 (Unreleased)

- License: Add back missing MIT license
- Security fix: Avoid SQL injection potential--ensure store names and index
    names are prefixed as SQLite columns to avoid conflict with built-in
    columns; add test
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
- Fix: Avoid `LIKE` check on auto-complete sequence check (could be store
    name inside another store name);
- Fix: Ensure numeric keys passed to `add()` or `put()` on an autocomplete
    store which are greater or equal to the "current number" will update
    the auto-increment counter
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
- Fix: Throw for `IDBCursor.update/delete` if transaction not active,
    if source or effective object store deleted, if got value not set,
    or if a key method has been invoked
- Fix: Throw `DataCloneError` if `IDBCursor.update` value is not
    clonable by the Structured Cloning Algorithm
- Fix: Throw `TypeError` if call to `update()` has no arguments
- Fix: Allow empty string key path to be utilized when validating
    `add`/`put` input
- Fix: Add more precise `toString` behaviors
- Fix: Make `key`/`primaryKey`/`direction`/`source`/`value` properties
    of `IDBCursor` readonly
- Fix: Avoid iterating unique values
- Fix: Ensure `IDBRequest.error` returns `null` rather than `undefined` upon
    success event
- Fix: Make `IDBRequest` properties (`result`, `error`, `source`,
    `transaction`, `readyState`) readonly
- Fix: Correct `IDBRequest.source` to reflect `IDBCursor`, `IDBIndex`,
    or `IDBObjectStore` as appropriate
- Fix: Prevent race condition error if attempting to find indexes during
    insertion when index creation has begun but not yet completed
- Feature: Support Node cleanly via `websql` SQLite3 library
- Feature: Add `IDBObjectStore.openKeyCursor`
- Feature: Add `IDBKeyRange.includes()` with test
- Feature: Allow ranges to be passed to `IDBObjectStore.get`.
- Feature: Allow key argument with `IDBCursor.continue`.
- Feature: Key value retrieval: Allow "length" type key
- Feature: Add ".sqlite" extension to database name for sake of (Windows)
    file type identification
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
- Updating: Bump various `devDependency` min versions
- Testing: Update tests per current spec and behavior
- Testing: Ensure db closes after each test to allow non-blocking `open()`
    (was affecting testing)
- Testing: Work on Node tests and for Firefox (including increasing timeouts
    as needed)
- Testing: Rely on `node_modules` paths for testing framework files
- Testing (W3C): Fix test to reflect latest draft spec -- see <https://github.com/brettz9/web-platform-tests/pull/1>
- Testing (W3C): Change example to expect `ConstraintError` (since object
    store already existing per test)--though perhaps should ensure it is
    not yet existing
- Test scaffolding (W3C): Fix args to `initionalSituation()`
- Test scaffolding (W3C): Fix test ok condition, typo
- Test scaffolding (W3C): Fix assertions
- (Testing: tests-mocha, tests-qunit, and indexedDBmock tests now all
    passing in browser and Node; from W3C, IDBCursor.advance.js,
    IDBCursor.continue.js, IDBCursor.delete.js, and IDBCursor.update.js
    are passing)
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

# IndexedDBShim changes

## Version 3.0.0 (Unreleased)

- License: Add back missing MIT license
- Breaking change/Fix: Remove `IDBTransaction` mode constants and tests since
    now being removed from IndexedDB
- Breaking change (minor): Change "modules" property of `IDBFactory` to only
    expose `DOMException`, `Event`, and `IDBFactory` (replacing the former
    use of `idbModules` with ES6 modules and a CFG module for the globals:
    see below)
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
- Feature: Support Node cleanly via `websql` SQLite3 library
- Feature: Add `IDBObjectStore.openKeyCursor` (no tests yet, however)
- Feature: Add `IDBKeyRange.includes()` with test
- Feature: Allow ranges to be passed to `IDBObjectStore.get`.
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
- Test scaffolding (W3C): Fix args to initionalSituation()
- Test scaffolding (W3C): Fix test ok condition, typo
- Test scaffolding (W3C): Fix assertions
- (Testing: W3C IDBCursor.advance.js tests now all passing)
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
- Testing (Cordova): Update Cordova testing (untested)

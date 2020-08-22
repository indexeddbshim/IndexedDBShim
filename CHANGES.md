# CHANGES for indexeddbshim

# 7.0.0

- Breaking change: Require Node >= 10
- Enhancement: By way of `typeson-registry`, support `CryptoKey`
- Docs: Update dev. license badge per latest
- Linting: As per latest ash-nazg
- npm: Update deps. (`regenerator-runtime`, `typeson-registry`) devDeps.

## 6.6.0 (releasing again as `indexeddbshim` and deprecating `@indexeddbshim/indexeddbshim`)

- Incorporate previous relevant updates made to `@indexeddbshim/indexeddbshim`
- Linting: As per latest ash-nazg
- npm: Add `lint` to `test`
- npm: Update devDeps. (and bundled mocha copy)

## 6.5.0 (was published to `@indexeddbshim/indexeddbshim` only)

- Linting: As per latest ash-nazg
- Build: Update mocha copy
- Testing: Switch to stable version of `cypress-multi-reporters`
- npm: Add `prepublishOnly` script
- npm: Update `typeson-registry`
- npm: Update devDeps.

## 6.4.0 (was published to `@indexeddbshim/indexeddbshim` only)

- Build: Update per latest devDeps.
- Build: Report compared to last build size
- Linting: As per latest ash-nazg
- Testing: Update tests to continue working per latest Node/jsdom
- Testing: Switch to `cmrOutput`-supporting `cypres-multi-reporters` fork
    (no need for Promise-based mocha-multi-reporters fork with proper
    implementation)
- Docs: Switch to mocha-badge-generator fork for proper async behavior
- Docs: Update license badges
- npm: Switch from deprecated rollup-plugin-babel to rollup/plugin-babel
- npm: Update typeson-registry dep.
- npm: Update devDeps (related to Babel, Rollup, ESLint, core-js,
    jsdom, badges, mocha/nyc, sinon, source-map-support, ws)

## 6.3.0 (was published to `@indexeddbshim/indexeddbshim` only)

- Build: Fix per current fork
- Docs: Update coverage badge per latest coveradge
- Linting (ESLint): As per latest ash-nazg
- npm: Point to now merged `mocha-badge-generator`
- npm: Update devDeps

## 6.2.1 (was published to `@indexeddbshim/indexeddbshim` only)

- Docs: Fix badges

## 6.2.0 (was published to `@indexeddbshim/indexeddbshim` only)

- Fork from <https://github.com/axemclion/IndexedDBShim>.
- Project: Add Github Sponors button to be able to accept funding
- Project: Restore demo via Github Pages
- Fix (React Native/Webpack): Add CFG item `fs` (which the Node
    files automatically set) to allow removal of database files
    without disturbing non-Node environments that do their own
    special handling of `require` statements
- Fix (Android): Overcome apparent Android SQLite mishandling of
    boolean (convert to `Number`)
- Build: Drop Grunt in favor of equivalent npm scripts
- Testing (W3C): Update per latest wpt
- npm: Update devDeps/package-lock.json

## 6.1.0

- Build (change/optimization): Remove `browersify`/`babelify`/
    `mapstraction` process in favor of `grunt-rollup` with plugins;
    reduces minified build size and expands non-minfiied size (so that
    the source incorporated from `typeson`/`typeson-registry` is not
    minified)
    - `indexeddbshim-noninvasive.min.js` (182 KB -> 154 KB)
    - `indexeddbshim.min.js` (165 KB -> 137 KB)
    - `indexeddbshim-Key.min.js` (27.7 KB -> 16 KB)
- Enhancement: Check that `navigator.userAgent` even exists (avoid erring
    in React Native)
- Fix: `__forceClose` method with nullish value as name was not closing
    all connections
- Linting (ESLint): Add file extensions; lint `.eslintrc` file itself;
    enable other disabled rules
- Docs: Add license badges (with `license-badger` routine)
- Testing: Remove `grunt-qunit-puppeteer` devDep. (slow to install)
- Testing (Mocha): Allow Firefox tests to pass
- Testing (W3C): Bump memory so tests can complete
- npm: Update dep. `typeson-registry` (for `module` importing)
- npm: Add `package-lock.json` (needed by `npm audit`)
- npm: Update devDeps
- yarn: Remove `yarn.lock` (having some difficulties installing everything)

## 6.0.1

- Note that the typeson updates include some important fixes for accurately
    storing certain types or combinations of types
- Fix: For `CFG.fullIDLSupport`, revert setting of prototypes of
    `IDBCursor`, `IDBKeyRange`, `IDBIndex`, `IDBObjectStore`,
    `IDBFactory` to objects that serialize to
    `[object ObjectPrototype]`
- Linting (ESLint): Latest as per ash-nazg
- Travis: Change to 10 and 12
- Testing (W3C): Update web-platform-tests
- Testing (W3C): Shim objects that are only checked for exposure
- Testing (W3C): Avoid reporting known failures as unexpected
- Testing (W3C): Update test counts
- npm: Add script for updating submodules
- npm: Update deps (typeson and typeson-registry)
- npm: Update devDeps

## 6.0.0

- npm (BREAKING CHANGE): Move core-js-bundle out of deps; user to install
    if needed for supported environments
- Fix: For `CFG.fullIDLSupport`, ensure prototypes of `IDBCursor`,
    `IDBKeyRange`, `IDBIndex`, `IDBObjectStore`, `IDBFactory` are
    objects that serialize to `[object ObjectPrototype]`
- Linting (ESLint): Apply latest updates
- Testing (W3C): Avoid hack in test to deal with missing prototype;
    do not inject `Object` on full IDL tests
- Testing (W3C): Add `structured-clone.any.js` to known `badFiles` list
- Testing (W3C): Add `MessageChannel`
- Testing (W3C): Add canvas for `ImageData`
- Docs: Link to TrialTool
- npm: Remove `package-lock.json` in favor of `yarn.lock`
- npm: Bump `typeson-registry` (Cause `Event` and `MessageChannel` to
    throw upon attempted cloning); update `typeson`; bump devDeps and
    local copies

## 5.0.0

- Breaking change: Move from deprecated `@babel/polyfill` to
    recommended replacements `core-js-bundle` /
    `regenerator-runtime`
- Fix: For unescaping unmatched surrogates preceded by carets, we need to
    restore the carets
- Fix: Avoid erring in some instances with not-yet-added name key
    for `cacheDatabaseInstances` or `memoryDatabase`
- Fix (Missing API): Add new `IDBCursor.request`
- Fix (example): Paths in `IDBKeyUtils.html` examples file
- Optimization (build): Avoid `build` step as bundling `dist` files anyways;
    avoid linting step as it has problem in grunt
- Refactoring: Change private `__closed` flag to match spec
    terminology, `__closePending`.
- Refactoring: Add `__done` flag to match spec, with `readyState`
    getter using this flag
- Linting (ESLint): Update for `eslint-config-ash-nazg` (prefer
    `for...of` and `includes`, etc.)
- Linting (ESLint): Lint HTML and Markdown
- Docs (JSDoc): Add returns and some additional docs
- Docs (Code): Better toward `max-len`
- Docs (README): Use paths more consistent with installing
    indexeddbshim as dep.
- Docs (README): Indicate ESM usage; fix broken link
- Docs (TESTING): Info on individual tests
- Testing (W3C): Update wpt; test results; fix regression
- Testing (W3C): Exclude tests causing undue timeouts in other files; update
    test counts
- Testing (W3C): Avoid excluding non-breaking test
- Testing (W3C): Support new "any" files (and support future ones) and
    fix for `location`; report reason for new test file failing; update
    `web-platform-tests`; avoid excluded files in list of failed;
    add scripts to list files in test folder which are not in goodBad
    listing
- Grunt: Avoid eslint task for main build as having problems with lint config
- npm: Update `typeson`/`typeson-registry`, `eventtargeter`
- npm: Update devDeps; package-lock

## 4.1.0

- Optimization: Update `typeson-registry` to return to more space-optimal
    array format when arrays do not have non-index keys (while still
    supporting arrays with non-index keys) and `undefined` and
    sparse arrays formats (though all are backward-compatible with
    old data).
- Docs (README): Update note on typeson-registry-sca-reverter
- npm: Add `request` peer dep
- npm: Bump devDeps and adjust linting accordingly

## 4.0.1

- Build fix: Apply `browserslist` to `@babel/env`; update typeson-registry
    to get its `browserslist` fix

## 4.0.0

- Breaking change: **WARNING**: If you need 4.0.0 to work with data stored
    under 3.\*, you need to add a callback as the value of the new
    `CFG.registerSCA` config with a value set to the function exported from
    [typeson-registry-sca-reverter](https://github.com/brettz9/typeson-registry-sca-reverter),
    and do so before you make your `indexedDB` calls. This code was part of
    IndexedDBShim, but is no longer bundled with it, as IndexedDBShim, as of
    version 4.0.0 is now using the new typeson-registry Structured Cloning
    Algorithm format by default for representing cloneable data as JSON.
- Breaking fix: Representation of Arrays to allow storage of non-index
    properties (courtesy of updated typeson-registry)
- Breaking fix: Representation of Blobs as binary to avoid UTF16 representation
    dropping unpaired surrogates (courtesy of updated typeson-registry); also assumes
    XHR has `overrideMimeType`
- Breaking change: `webkitGetDatabaseNames` removed in favor of now-standard
    `databases` (see <https://github.com/w3c/IndexedDB/pull/240/files>)
- Breaking change; Remove Bower completely (service was deprecated);
    use npm or yarn
- Breaking change: Switch from `babel-polyfill` to `@babel/polyfill`
    (script tag paths for polyfill will need to be updated)
- Breaking change: Remove support for previously deprecated numeric
    constants as second arguments to `IDBDatabase.prototype.transaction`
    (to use `readonly`/`readwrite` instead).
- Breaking change: Remove our non-standard `IDBFactory.modules`
    (non-IDB shims or polyfills available through `CFG.addNonIDBGlobals`
    or `CFG.replaceNonIDBGlobals`, respectively, with shims prefixing
    class names with "Shim")
- Breaking change: Remove our non-standard `IDBFactory.utils` and move its
    test utility `createDOMException` to named export of `setGlobalVars.js`
- Fix: If stored data had an even number of caret characters (`^`) followed
    by a `0`, the final caret would mistakenly be interpreted with the
    `0` as a NUL character as part of unescaping (which could in turn cause
    errors)
- Fix: Compile to target 100% coverage (including e.g., iOS)
- Enhancement: Support `BigInt()` and `Object(BigInt())`
- Optimization: Import all of single typeson-registry to reduce file size
    from two versions
- Refactoring: Add empty favicon to avoid extra console messages; load after
    title
- Linting (ESLint): Switch Node-11-deprecated url methods
- Linting (ESLint): Add and apply eslint-plugin-qunit-recommended rules; add
    checks for browser support using eslint-plugin-compat; apply
    `eslint-config-ash-nazg` rules; use `.js` for linting file
- Testing (W3C): Instructions and results for using `wpt run`; wrap
    dynamic files
- Testing (W3C): Update worker BSON per new BSON API; use new
    `XMLHttpRequest` partial polyfill; update wpt
- Testing (Puppeteer QUnit): Avoid build step
- Testing (QUnit): Ensure deleting database before testing version
- Demo: Update copy of sinon
- Docs: Max-length
- Docs: Add "versions" section for migration info; note in code on
    deprecating old typeson names
- npm: Add `yarn` to `prepublishOnly` script
- npm: Add "wpt" as alias script for "web-platform-tests"; add "lint"
    script to test non-Grunt eslint
- npm: Update eventtargeter and typeson/typeson-registry deps and devDeps
- npm: Update devDeps (and their local copies); avoid `js-polyfills`
    in favor of Node `URL`/`URLSearchParams`

[typeson-registry-sca-reverter](https://github.com/brettz9/typeson-registry-sca-reverter)

## 3.10.0

- Fix: Ensure multiEntry sorts address possibility of nested array
    keys (Courtesy lgtm)
- Fix: For interface tests, ensure properties are getter based
- Refactoring: Factor out common interface code (making
    `IDBRequest` and `IDBOpenRequest` listeners `enumerable` too)
- Testing (W3C): Update web-platform-tests (including repo location)
- Testing (W3C): Use new `idlharness.any.html` over `interfaces.any.html`
- Travis: Update Node version (having issues with Yarn)
- Docs: Remove Bower badge

## 3.9.0

- Fix: Upon converting value to key range, avoid creating new
    `IDBKeyRange` instance when already existing (flagged by LGTM.com)
- Refactoring: Avoid useless assignment (flagged by LGTM.com); object
    destructuring
- npm: Update devDeps
- Linting (ESLint): Override new "standard" ESLint to prevent spacing
    around object curly quotes; deprecated assert APIs

## 3.8.0

- npm: Update devDeps
- npm: With updates to node-pre-gyp, rebuild `package-lock.json`; fixes #321
- yarn: Update `yarn.lock`
- Testing: Update `web-platform-tests`
- Demo site: Update sinon version to work on rawgit.com

## 3.7.0

- npm: Update websql fork dep. (which updates sqlite3 to 4.0.0)
- npm: Switch unicode-10.0.0 to devDep (with copy routine);
    Fixes #323
- npm: Update devDeps and `package-lock.json` (surface dependency
    security fixes) (Temporary fix for #321 until Grunt
    and node-pre-gyp->sqlite3(->websql) update)
- Refactoring: Remove unnecessary `type=text/css`
- Testing (Grunt): Fix clean-polyfill task (fixes #322)
- Testing (Grunt): Replace phantom-qunit with puppeteer-qunit
- Testing (QUnit): Fix issue with QUnit 2 (move sample data into test
    starting file); see https://stackoverflow.com/a/38791824/271577
    (fixes #324)
- Testing: Update `web-platform-tests`

## 3.6.2

- Fix (Node): Respect the `databaseBasePath` setting for database
    deletions (#319); test courtesy @mikelehen
- Fix (Node): Error (and warning) in cleaning up memory database
    resources (#320); test and fix courtesy @mikelehen
- Fix/optimization (Node): Don't remove cache after success, but if using
    cache, ensure getting last version and ensure async before
    dispatching any version error
- Refactoring: Avoid redundant `function` on object literals
- npm: Fix web-platform-tests script

## 3.6.1

- Critical fix (Please upgrade from any previous 3.0.0 version):
    Ensure unescaping done in SQL responses (and database names) always adds
    back any literal `^` sequences. This loss could more easily happen for
    database names (whenever the name had a sequence of 1 or more literal `^`
    followed by a single `A` to `Z` (or `[\u0000-\u001F\u007F"*/:<>?\\|]`
    or characters expanding on NFD normalization), but it could also happen
    in general SQL responses (or database names) where there was a sequence
    of 1 or more literal `^` followed by an unmatched surrogate (though this
    should admittedly be unlikely for most users); this unescaping was meant
    to build back unmatched surrogates (which are allowed in IndexedDB)
    and the like which were unsafe for the SQLite engine used internally or
    for the file system used for Node, but we were failing to add back the
    `^` escape in such cases (which was used as an escape character).

## 3.6.0

- Refactoring/Fix: For default `escapeNFDForDatabaseNames` check, temporarily
    circumvent current limitations in Babel until
    <https://github.com/babel/babel/issues/5978> addressed; (see also
    <https://github.com/axemclion/IndexedDBShim/issues/311#issuecomment-316090147>);
    fixes #311
- Linting: Expand ESLint file coverage and apply minor linting fix to test file
- Testing: Update web-platform-tests and our tests accordingly
- npm: Update `eventtargeter` to avoid automatic `Object.setPrototypeOf`
    calls (make conditional on `CFG.fullIDLSupport`); fixes #313

## 3.5.1

- npm: Update `package-lock.json`
- npm: Resume allowing Node versions 8.93 - 9.0.0
- Docs: Put message in README about failure of one test as a known
    issue for the above Node versions

## 3.5.0

- Breaking fix (through npm): Update typeson and typeson-registry
    (ArrayBuffer, DataView, and typed arrays were not properly
    preserving entire underlying buffer when only a portion used;
    were also not restoring when buffers were reused cyclically
    across an object)
- npm: Update dev deps
- Install: Update `yarn.lock`/`package-lock.json`
- Testing (W3C): Update web-platform-tests

## 3.4.0

- Fix (minor): Return proper `indexedDB` object descriptor
- npm: Update devDeps
- npm: Update dep to unicode-10.0.0 (no practical difference)
- Testing (W3C): Remove need for cheerio in build (use jsdom instead)
- Testing (W3C): Update `web-platform-tests`

## Version 3.3.1

- Build: Switch from `devDependencies` to `dependencies` the following which
    Node or custom rollups may require: eventtargeter, sync-promise,
    typeson, typeson-registry, unicode-9.0.0

## Version 3.3.0

- Build: More complete `.npmignore` to exclude more files at root that we
    don't need in distributions
- Build: Amend `.npmignore` to allow for `src` inclusion (for those who
    wish to rollup own (complete or partial) versions)
- Build: Update file copies out of `node_modules` needed for Rawgit demo

## Version 3.2.0

- Fix: Deal with issue with Chrome/Node and `Number.MIN_VALUE` converting
    to string
- npm: Add `module` to `package.json` for potential use by Webpack/Rollup
- npm: Limit engines to exclude Node 8.9.3 as having problems with Mocha
    IDBIndex/openCursor-spec.js test
    "should query multi-entry indexes with hundreds of records"; may be
   other problematic versions but 7.7.4 and 9.2.1 are ok
- npm (Build): Update devDeps including versioned `eventtargeter`, `typeson`,
    and `typeson-registry`
- npm (Build/Testing): Add missing `babel-core` devDep
- npm (Build): Preserve LICENSE info in `npmignore` (and avoid redundant items)
- npm (Testing): Add `web-platform-tests` and `sqlite-rebuild` scripts
- npm (Testing): Update W3C test script to clean before beginning as well
- Build: For Babel, use env over deprecated es2015; rebuild
- Build: Add `yarn.lock`
- Docs: Remove outdated polyfill info in README (babel-polyfill should cover)
- Demo: Add example of IDBKeyUtils usage (not documented yet)
- License: Rename files to include file extensions for Windows

## Version 3.1.0

- Fix: `update` and `delete` were invalidating the cache and thus
    mistakenly incrementing cursor index; no longer invalidating the
    (read-only) cache
- Enhancement: As part of #283 on export improvements, provide build
    process for `Key.js` file to function as standalone file (currently
    targeted for Chrome)
- Refactoring: In order to minimize build size for standalone `Key.js`,
    move `cmp` out of `IDBFactory` and reference it.
- npm: Update dev deps (including using harmony branch of
    grunt-contrib-uglify for correct ES6 support)

## Version 3.0.4

- Fix (Edge case): For `IDBDatabase.transaction()` (`storeNames` arg),
    `IDBDatabase.createObjectStore` (`keyPath` parameter), and
    `IDBObjectStore.createIndex` (`keyPath` argument), ensure
    conversion to DOMString (`ToString`) is being called per WebIDL
    (e.g., passing `true` would produce a valid `"true"`) while still
    throwing upon missing argument
- Optimize: We didn't actually need structured cloning for keypaths as
    keypaths are valid JSON (but we did need the edge cases handled
    per the accompanying fix and the Typeson encoded as of 3.0.0 should
    remain compatible with this reversion to JSON)
- Refactoring (minor): Use ES6 object property name shorthand
- npm: Update dev deps
- Demo: Update copies of test files

## Version 3.0.3

- Fix: Avoid allowing (open-ended) escaped Unicode escape sequences
    for key paths (JavaScript handles the escape sequences!).
- Fix: Avoid double-escaping zero-width joiners/non-joiner in key
    path check.
- npm: Update dev deps

## Version 3.0.2

- Fix: Incorporate `typeson` library fix for periods within
    property names; could create cloning issues
- Linting: Update per linting software updates (indents)
    though avoid `no-mulit-spaces` reporting (frequent in tests)
- Linting: Update and apply ESLint compat plugin linting
- npm: Update dev deps
- npm: Avoid shrinkwrap for now, pending
    <https://github.com/benmosher/eslint-plugin-import/pull/871>
- Testing (W3C): Update `web-platform-tests`
- Testing (W3C): Exclude new `large-nesting-cloning.js` file as preventing
    some other tests from running; also remove `parallel-cursors.uprade.js`
    from good tests as in timeouts (since it sometimes times out)
- Docs (Testing): Update note on running W3C Node tests
- Docs (README): Fixed first hyperlink not working (courtesy @Erwin)

## Version 3.0.1

- Update in case lagging `npm shrinkwrap` version causing any issues
- Docs (README): Update version number and remove completed to-do
- Testing: Update copies of Mocha/Chai/Sinon (for rawgit.com)
- Testing (Grunt): Comment out cumbersome minified version updater
- Testing (W3C): Revert from apparently problematic `cheerio` RC

## Version 3.0.0

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
- Security fix: As per new requirements, ensure `IDBFactory` methods `open`,
     `deleteDatabase` (and we do it for the non-standard
    `webkitGetDatabaseNames` as well as it could relate to privacy) throw a
    `SecurityError` `DOMException` if run from a `"null"` origin (unless the
    new config `checkOrigin` is set to `false`); for Node, requires
   `location` to be defined globally (could have some applications in Node,
    too, e.g., if jsdom sets the origin for iframes)
- Breaking refactoring with consequences for old data: prefix store/index
    names with "S_" instead of "s_" and "I_" instead of "_" (consistent
    with casing of "D_" though SQLite insensitive with ASCII while file
    systems may be sensitive; more future-compatible)
- Breaking change: Avoid encoding `keyPath` internally as JSON--needs
    Sca encoding; ~breaks all tables but important to fix!~
    _Shouldn't have broken tables as supplied keypaths should only have
    produced Typeson that is JSON; other breaking db changes were needed
    in this version, however_
- Breaking change/Fix: Remove `IDBTransaction` mode constants and tests since
    now being removed from IndexedDB
- Breaking change: Remove old `polyfill.js` code for incrementally
    plugging browsers with incomplete support (has not been tested for a long
    time and had perhaps not been properly kept up to date anyways); one
    can still use IndexedDBShim to replace the whole implementation, however.
- Breaking change: Throw if database name is too long, defaulting to 254 (part
    of fix for #274) (enforcing compatibility with Node, given our mapping it to
    file naming on common file systems)
- Breaking change: If you were overriding/monkey-patching globals, these are
    no longer available with a shift to ES6 modules (see below). The `CFG.js`
    module can be imported in its place to change the default values, however.
- Breaking fix for existing data: Give comparisons/storage of arrays
     higher priority over binary (arrays already existing in storage
     will not benefit from this until re-encoded, however)
- Breaking fix for existing data: Change encoding of key types so any future
    key types can be fitted into the proper place for sorting precedence
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
- Enhancement: Add `IDBObjectStore.name` and `IDBIndex.name` setters
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
- Enhancement: Add `addSQLiteExtension` config to add ".sqlite" to user
    databases, taking it into account when throwing against any file
    length limits
- Enhancement: Add `deleteDatabaseFiles` config to allow file itself to
    be deleted in Node; will throw `UnknownError` if there are any errors
    removing file (besides a missing file)
- Enhancement: Make addition of `.sqlite` extension to `__sysdb__` conditional
    on `CFG.addSQLiteExtension` setting
- Enhancement: Support `autoName` config to interpret empty string name as a
    cue for creating a database name automatically (introspect on
    `IDBDatabase.name` to get the actual name used) (untested)
- Enhancement: Support `memoryDatabase` config to cause all opening, deleting,
    and listing to be of SQLite in-memory databases (for Node); name supplied
    by user is still used (including to automatically build a cache since
    SQLite does not allow naming of in-memory databases); the name is also
    accessible to `IDBFactory.webkitGetDatabaseNames()`; causes database
    name/version tracking to also be within an in-memory database; part of
    #278 (untested); builds on work by @ThomasGreiner)
- Enhancement: Support `cacheDatabaseInstances` config to ensure that any
    repeat `IDBFactory.open` call to the same name and version (assuming
    no deletes or aborts causing rollbacks) will reuse the same SQLite
    `openDatabase` instance
- Enhancement: Add `useSQLiteIndexes` option to add (and drop) SQLite
    indexes where utilized (#210)
- Enhancement: Provide `avoidAutoShim` option (#270)
- Enhancement: Provide `shimIndexedDB.__setConnectionQueueOrigin()` utility
- Add missing API: Add `IDBCursor.continuePrimaryKey`
- Add missing API: Implement `IDBObjectStore.getKey`
- Add missing APIs: Implement `IDBIndex.getAll/getAllKeys`
- Add missing APIs: Implement `IDBObjectStore.getAll`,
      `IDBObjectStore.getAllKeys`
- Add missing API: Binary keys
- Add missing API: `versionchange` and `blocked` events (currently assumes
    single process)
- Fix: Ensure `IDBKeyRange`'s `lower` and `upper` get round-tripped
   key-encoded (e.g., to ensure a `DataView` gets converted into
   an `ArrayBuffer`)
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
- Fix: For `IDBCursor.advance`, better range enforcement
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
- Fix: Avoid iterating duplicate key values for unique iterations
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
- Fix: For generators, as per new requirements, ensure numbers
    higher than the max (including non-finite) have the effect of
    setting the current number to the max
- Fix: For generators, handle numbers just beyond the max allowed by
    ES since confusable if only incrementing by one
- Fix: Default to `global` for IDB exports where no `window` or `self` is defined
- Fix: Prevent incrementing if nevertheless valid key is lower than current
    number
- Fix: Ensure sorting of `StringList` (for `IDBDatabase.objectStoreNames`,
    `IDBObjectStore.indexNames`)
- Fix: Escape upper-case letters as table/column names case-insensitive in
    SQLite, but db/store/index names not case-insensitive in IndexedDB
- Fix: Add default option `escapeNFDForDatabaseNames` to
    escape characters that expand on NFD normalization so as to avoid
    accidental loss of precise Unicode code points and thus potential name
    clashes on the Mac which does NFD normalization on the file system (user
    should normalize themselves if they want normalization); part of #278
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
    - Revert `IDBDatabase` `version` and `objectStoreNames`; `IDBObjectStore`
        `name` and `indexNames`; `IDBTransaction` `objectStoreNames`, and
        `IDBIndex` `name` properties after aborted transactions;
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
- Fix: Ensure `createObjectStore`/`createIndex` return same handles as
    `objectStore`/`index` methods
- Fix: Avoid resetting store name if the store already existed before an
    upgrade transaction (per W3C test `idbobjectstore-rename-abort.html`)
- Fix: Ensure `IDBTransaction.objectStoreNames` is always a `DOMStringList`
    even when user supplies arrays
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
- Fix: Round down version in `IDBFactory.open()`
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
- Fix: As per spec, check whether transaction is finished for
  `IDBDatabase` (`createObjectStore`, `deleteObjectStore`),
   `IDBObjectStore.index`, `IDBTransaction` (`objectStore`, `abort`),
   and not merely whether it is active
- Fix: Improve evaluate key path splitting of identifier algorithm
- Fix: Ensure extraction of key value from value using key path algorithm
  is applied during ignoring of bad indexes of storage and during
  checks for storing operations
- Fix: Better `IDBIndex` (`openCursor`, `openKeyCursor`, `count`,
    `get*`) range validation
- Fix: Disallow invocation of `webkitGetDatabaseNames` on
    `IDBFactory.prototype`
- Fix: Throw synchronously if won't be able to inject into a value (thereby
   avoiding the need to check during the injection); assumes
   PR https://github.com/w3c/IndexedDB/pull/146
- Fix: Make `DataError` message more accurate for cursor key path
    resolution failures
- Fix: Ensure non-numeric/non-finite or `< 1` keys can be stored as
    per spec even though not changing the current number
- Fix: Allow iterables where `sequence<DOMString>` is accepted
   (`IDBDatabase.createObjectStore`, `IDBObjectStore.createIndex`,
   `IDBDatabase.transaction`)
- Fix: Avoid modifying the supplied `createObjectStore` `createOptions`
   object when `keyPath` is `undefined`
- Fix: For `IDBDatabase.transaction`, allow `ToString` to occur on
   iterables
- Fix: Tighten up `DOMException` shim to support legacy constants per
  W3C tests and better follow W3C interface expectations
- Fix: Improve precision of `util.isFile` and have
   `util.isBlob` fail with files but support non-file Blobs
- Fix: Clone before checking against key path (`IDBObjectStore`
   (`put`, `add`) and `IDBCursor.update`)
- Fix: Avoid `eval()` in cloning (issue #211, #236)
- Fix: Support cyclic values via typeson/typeson-registry (#267)
- Fix: Distinguish deleted and pending deleted stores and indexes;
    for insertion operations, do index checks independent of
    `indexNames` in case subsequently deleted by `deleteIndex` (#276)
- Fix: Ensure same index instance object returned for same store object and
    index name
- Fix: Better error reporting for `IDBRequest.error` or `IDBRequest.result`
    errors.
- Fix: Throw `InvalidStateError` `DOMException` upon deleted object store or index for:
    1. cursor-related operations
    1. index and store name setters
    1. index and store get or manipulation operations
    1. index creation, deletion, or retrieval operations
- Fix: Ensure will throw `InvalidStateError` `DOMException` as with deleted
    object stores or indexes for access after an aborted transaction when
    there were pending object stores or indexes to be created
- Fix: Cause not finished assertions to fire even if at beginning of abort except for
    `IDBDatabase` `createObjectStore`/`deleteObjectStore` which per corrected
    spec throw different error upon (incompletely) finished check
- Fix `IDBDatabase.createObjectStore` exception order fix (object store
    `ConstraintError` check follows key path `SyntaxError` check)
- Fix `IDBDatabase.transaction` exception order fixes (`InvalidAccessError`
    follows `InvalidStateError` version change check, `InvalidStateError`
    closed check, and `NotFoundError` object store check); `TypeError` mode
    check per newly corrected spec behavior, to follow all other exception
    checks
- Fix: Close connection on abort (setting closed flag)
- Fix: Have `deleteDatabase` empty relevant `connections` (relevant
    for `__forceClose` as well as `open`)
- Fix: Change `VARCHAR(255)` to `BLOB` for database and store name
    fields as may be longer (for db names, if
    `databaseNameLengthLimit` is higher than default)
- Fix: Upon upgrade transaction abort, attempt to clean up other resources
    (remove memory database or remove/empty database file if no prior versions)
- Fix: Ensure escaping of unmatched surrogates occurs in all SQLite statements
    as needed by Chrome (but not Node) (noted in failed dropping of tables)
- Fix: Revert current number if operation fails (even if not aborting)
- Fix: Avoid reporting abort errors on duplicates of same request in
    transaction queue (ensures subsequent unsetting of cursor request done
    flag does not return additional error results in an abort error)
- Repo files: Rename test folders for ease in distinguishing
- Optimize: Only retrieve required SQLite columns
- Optimize: Have `IDBObjectStore` and `IDBIndex`'s `get` and
      `getKey` only retrieve one record from SQLite
- Optimize: use WebSQL `readTransaction` as possible/when in `readonly` mode
- Optimize: Run SELECT only on columns we need
- Optimize: Avoid caching and other processing in `IDBCursor` multiEntry
    finds (used by `IDBObjectStore` or `IDBIndex` `count` with key range)
- Optimize: Switch to `SyncPromise` for faster execution
- Optimize: Avoid redundant key->value checks and redundant cloning
- Optimize: Avoid cloning key when already a primitive
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
- Refactoring (spec parity): Use same naming/return of methods in spec
- Refactoring (spec parity): Implement `convertKeyToValue` (not in use internally)
- Refactoring (spec parity): Extract steps for storing a record (affecting
     `IDBCursor.update` and `IDBObjectStore`'s `put`/`add`)
- Refactoring (spec parity): Perform auto-increment in spec order (should be of
    no consequence to the user, however)
- Refactoring (spec parity): Rename `Key.getValue` to `Key.evaluateKeyPathOnValue`
- Refactoring (spec parity): Rename and repurpose `Key.validate` to
    `Key.convertValueToKey` (also paralleling terminology in the spec),
    also supporting multiEntry argument
- Refactoring (spec parity): Make current number retrieval routines more closely
   parallel spec
- Refactoring (spec parity): Mirror recent minor spec changes re:
   bubbling/cancelable `IDBFactory` error events
- Refactoring (SQL): Quoting columns consistently for SQLite
- Refactoring (SQL): Make SQL-relationship clearer for method names (escaping)
- Refactoring (SQL): upper-case SQL keywords for greater visual distinction
- Refactoring: Where safe, switch from `typeof ... === 'undefined'` to
    check against undefined (safe for strict mode implicit in modules)
- Refactoring: Use spread operator in place of `arguments` where named
    args not needed (also may be more future-proof)
- Refactoring: Have `setSQLForRange` handle key encoding
- Refactoring: `isObj` utility, further use of `Array.isArray()`
- Refactoring: Key value retrieval: Avoid `eval()` (#211, #236)
- Refactoring: Use ES6 classes for cleaner inheritance
- Refactoring: Avoid JSON methods upon each `objectStore`/`createObjectStore`
    call in favor of one-time in `IDBDatabase`
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
- Testing (browser index): Update links to test cases
- Testing (ESLint): Add compat plugin for browser feature testing
- Testing (fakeIndexedDB.js): Comment out non-standard property checks
- Testing (mock): Update IndexedDBMock tests
- Testing (mock): Expect `InvalidStateError` instead of `ConstraintError`
    when not in an upgrade transaction calling `createObjectStore`
- Testing (mock): Fix for `blocked` event's expected `newVersion` (submitted
    fix as <https://github.com/kristofdegrave/indexedDBmock/pull/2>)
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
- Testing (W3C Old): Update tests per latest behavior as far as throwing
    `InvalidStateError` for deleted object stores or indexes
- Test scaffolding (W3C Old): Fix args to `initionalSituation()`
- Test scaffolding (W3C Old): Fix test ok condition, typo
- Test scaffolding (W3C Old): Fix assertions
- Testing (W3C): Add new preliminary testing framework (mostly complete)
- Testing (W3C): Add separate tests for events and workers; also
    incorporate tests for `DOMStringList` and `DOMException`
- Testing (W3C Old): Fix `DOMStringList` API usage (failing on Safari)
- Testing (W3C Old): Partly update `TransactionBehavior.js` tests to
    ensure `objectStoreNames` are compared as arrays
- (Testing)
    (Unless stated otherwise, "Browser" below refers to Safari 10.1 and
        Chrome 57.0.2987.133 (64-bit); note that both browsers (especially
        Safari may require re-running tests or running the tests as individual
        groups)

    From tests-qunit (Node and browser), all tests are now passing.

    From tests-mocha (Node), all tests are now passing.
    From tests-mocha (Browser), all tests are now passing except:
        1.  in Chrome: `IDBFactory.cmp` `simple keys->should compare two numbers` due to an apparent `Number.MIN_VALUE` problem as [described here](http://stackoverflow.com/questions/43305403/number-min-value-and-tostring).
        (Note: This is no longer occurring at least as of Chrome 69.)

    From fakeIndexedDB (Node), all tests now passing.
    From fakeIndexedDB (Browser), only the first test is
        passing (as expected due to rollback limitations);

    From indexedDBmock (Node and browser), all tests are now passing.
        (see <https://github.com/kristofdegrave/indexedDBmock/compare/f6cdf451769827e13c746984b820096b0de3ac6d...master>
        for any new changes to add to tests).

    From old W3C (Node and browser), all tests are now passing.

    From new W3C (Node):
        See [`/test-support/node-good-bad-files.js`](test-support/node-good-bad-files.js)
            for the current test status on these tests.

    From new W3C (Browser):
        Individual tests can be run as per [TESTING](docs/TESTING.md).
        See [node-good-bad-files.js](test-support/node-good-bad-files.js)
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
- Testing (Grunt): Work toward fixing source maps
- Testing (Grunt): Avoid missing grunt-cli message
- Testing (PhantomJS): Deal with PhantomJS error
- Testing (npm): Streamline test names; add convenience scripts
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
- Testing (Mocha): Add Mocha tests to Grunt (along with clean-up) and add
    node-qunit for Node mocha testing
- Testing (Mocha): Allow passing in specific test files to mocha tests
- Testing (Mocha): Add test to ensure unique index checks are safely ignored
    with bad index keys
- Testing (Mocha): Rename test sets for distinguishing
- Testing (Mocha): Change fakeIndexedDB and indexedDBmock to Mocha tests
- Testing (Mocha): Increase default Mocha timeout to 5000ms (Chrome failing
    some at 2000ms as was Node occasionally); tweak as needed
- Testing (Mocha): Safari currently problematic with (old) Sinon code; avoid on
    error checks for Safari too
- Testing (Mocha): Fall back to genuine `Event`/`DOMException` when shims not
    present (if testing native)
- Testing (Cordova): Update Cordova testing (untested)

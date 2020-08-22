# IndexedDB Polyfill

[![Build Status](https://img.shields.io/travis/indexeddbshim/IndexedDBShim.svg)](https://travis-ci.org/indexeddbshim/IndexedDBShim)
[![Dependencies](https://img.shields.io/david/indexeddbshim/indexeddbshim.svg)](https://david-dm.org/indexeddbshim/indexeddbshim)
[![devDependencies](https://img.shields.io/david/dev/indexeddbshim/indexeddbshim.svg)](https://david-dm.org/indexeddbshim/indexeddbshim?type=dev)
[![npm](http://img.shields.io/npm/v/indexeddbshim.svg)](https://www.npmjs.com/package/indexeddbshim)
[![CDNJS](https://img.shields.io/cdnjs/v/IndexedDBShim.svg)](https://cdnjs.com/libraries/indexeddbshim)

[![Tests badge](https://raw.githubusercontent.com/indexeddbshim/indexeddbshim/master/badges/tests-badge.svg?sanitize=true)](badges/tests-badge.svg)
[![Coverage badge](https://raw.githubusercontent.com/indexeddbshim/indexeddbshim/master/badges/coverage-badge.svg?sanitize=true)](badges/coverage-badge.svg)

[![Known Vulnerabilities](https://snyk.io/test/github/indexeddbshim/indexeddbshim/badge.svg)](https://snyk.io/test/github/indexeddbshim/indexeddbshim)
[![Total Alerts](https://img.shields.io/lgtm/alerts/g/indexeddbshim/indexeddbshim.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/indexeddbshim/indexeddbshim/alerts)
[![Code Quality: Javascript](https://img.shields.io/lgtm/grade/javascript/g/indexeddbshim/indexeddbshim.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/indexeddbshim/indexeddbshim/context:javascript)

[![License](https://img.shields.io/npm/l/indexeddbshim.svg)](LICENSE-APACHE)

[![Licenses badge](https://raw.githubusercontent.com/indexeddbshim/indexeddbshim/master/badges/licenses-badge.svg?sanitize=true)](badges/licenses-badge.svg)
<!--
[![Licenses dev badge](https://raw.githubusercontent.com/indexeddbshim/indexeddbshim/master/badges/licenses-badge-dev.svg?sanitize=true)](badges/licenses-badge-dev.svg)
-->
(see also [licenses for dev. deps.](https://raw.githubusercontent.com/indexeddbshim/indexeddbshim/master/badges/licenses-badge-dev.svg?sanitize=true))

<!--[![issuehunt-to-marktext](https://issuehunt.io/static/embed/issuehunt-button-v1.svg)](https://issuehunt.io/r/indexeddbshim/indexeddbshim)-->

|[Live Demo (stable)!](https://raw.githack.com/indexeddbshim/indexeddbshim/v6.2.0/index.html) | [Live Demo (master)!](https://indexeddbshim.github.io/indexeddbshim/) |
| -------------- | ----------------- |

__Use a single, indexable, offline storage API across all desktop and mobile
browsers and Node.js.__

Even if a browser natively supports [IndexedDB](http://w3c.github.io/IndexedDB/),
you may still want to use this shim.  Some native IndexedDB implementations are
[very buggy](http://www.raymondcamden.com/2014/09/25/IndexedDB-on-iOS-8-Broken-Bad/).
Others are [missing certain features](http://codepen.io/cemerick/pen/Itymi).
There are also many minor inconsistencies between different browser
implementations of IndexedDB, such as how errors are handled, how transaction
timing works, how records are sorted, how cursors behave, etc.  Using this
shim will ensure consistent behavior across all browsers.

## Features

- Optionally adds full IndexedDB support to any web browser that
    [supports WebSQL](http://caniuse.com/#search=websql)
- Does nothing if the browser already
    [natively supports IndexedDB](http://caniuse.com/#search=indexeddb)
- Can _optionally replace_ native IndexedDB on browsers with
    [buggy implementations](http://www.raymondcamden.com/2014/09/25/IndexedDB-on-iOS-8-Broken-Bad/)
- Works on __desktop__ and __mobile__ devices as well as __Node.js__ (courtesy of
    [websql](https://www.npmjs.com/package/websql) which sits on top of SQLite3)
- Works on __Cordova__ and __PhoneGap__ via the
    [IndexedDB plug-in](http://plugins.cordova.io/#/package/com.msopentech.websql)
    (Not recently tested)
- This shim is basically an IndexedDB-to-WebSQL adapter.
- More (though most likely now outdated) details about the project at
    <http://nparashuram.com/IndexedDBShim>

## Installation

You can download the [development](https://raw.githubusercontent.com/indexeddbshim/indexeddbshim/master/dist/indexeddbshim.js)
or
[production (minified)](https://raw.githubusercontent.com/indexeddbshim/indexeddbshim/master/dist/indexeddbshim.min.js)
script, or install it using [NPM](https://docs.npmjs.com/getting-started/what-is-npm).

Please note that the version currently in `master` is the only one which
supports Node.js (and has a number of fixes), but we are not yet ready
for release.

For Mac, you may need to have [CMake](https://cmake.org/download/) installed
for the SQLite3 install to work (See
`Tools->How to Install For Command Line Use`) as well as build SQLite3 from
source via `npm install --build-from-source` in the `node-sqlite3` directory.
Also make sure Python (2.7) is installed.

### npm

```shell
npm install indexeddbshim
```

or

```shell
yarn add indexeddbshim
```

## Browser set-up

Add the following scripts to your page:

```html
<script src="./node_modules/core-js-bundle/minified.js"></script>
<script src="./node_modules/regenerator-runtime/runtime.js"></script>
<script src="./node_modules/indexeddbshim/dist/indexeddbshim.min.js"></script>
```

If you need full Unicode compliance (handling special
non-alphanumeric identifiers in store and index names),
use the following instead:

```html
<script src="./node_modules/core-js-bundle/minified.js"></script>
<script src="./node_modules/regenerator-runtime/runtime.js"></script>
<script src="./node_modules/indexeddbshim/dist/indexeddbshim-UnicodeIdentifiers.min.js"></script>
```

## Node set-up

```js
const setGlobalVars = require('indexeddbshim');

global.window = global; // We'll allow ourselves to use `window.indexedDB` or `indexedDB` as a global
setGlobalVars(); // See signature below
```

## ES6 Modules

### Bundler for Browser

```js
import setGlobalVars from 'indexeddbshim';
```

### Bundler for Node

```js
import setGlobalVars from 'indexeddbshim/src/node-UnicodeIdentifiers';

// Or without Unicode support
// import setGlobalVars from 'indexeddbshim/src/node';
```

## Usage/API

For the browser scripts, if the browser already natively supports IndexedDB
and is not known to be buggy, then the script won't do anything.

Otherwise, assuming WebSQL is available, the script will add the
[IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
to the browser (unless you use one of the non-invasive files, in which case
`setGlobalVars` can be used to optionally add the API to an object of your
choosing; if you also wish Unicode support, you will need to add it yourself).

Either way, you can use IndexedDB just like normal.
[Here's an example](https://gist.github.com/BigstickCarpet/a0d6389a5d0e3a24814b).

### setGlobalVars(\<winObj or `null`\>, initialConfig)

In the non-invasive builds (and Node.js), globals are not automatically set.
You have the choice to set globals when you wish as well as to set the API
on an object of your choosing in place of setting globals.

This is done through `setGlobalVars()` (which is otherwise called in the
browser builds automatically with no arguments).

This function defines `shimIndexedDB`, `indexedDB`, `IDBFactory`, etc. on
one of the following objects in order of precedence:

1. The passed in `winObj` object if defined
1. `window` (for Node, define `global.window = global;`)
1. `self` (for web workers)
1. `global` (for Node)
1. A new empty object

The `initialConfig` argument, if present, should be an object whose keys
are the config properties to set and its values are the config values (see
`shimIndexedDB.__setConfig` below).

If you are adding your own `window.openDatabase` implementation, supplying
it within `initialConfig` (keyed as `openDatabase`) will ensure that
`shimIndexedDB.__useShim()` is auto-invoked for you if poor IndexedDB
support is detected.

### shimIndexedDB.\__useShim();

To force IndexedDBShim to shim the browser's native IndexedDB (if our code
is not already auto-shimming your browser when detecting poor browser
support), add this method call to your script.

On browsers that support WebSQL, this line will _completely replace_ the
native IndexedDB implementation with the IndexedDBShim-to-WebSQL
implementation.

On browsers that _don't_ support WebSQL, but _do_ support IndexedDB, this
line will patch many known problems and add missing features. For example,
on Internet Explorer, this will add support for compound keys.

If `CFG.addNonIDBGlobals` has been set (e.g., on the `initialConfig` argument
of `setGlobalVars`), the other non-IndexedDB shims necessitated by this
library will be polyfilled as possible on the chosen "global" (i.e.,
`ShimEvent`, `ShimCustomEvent`, `ShimEventTarget`, `ShimDOMException`,
and `ShimDOMStringList`). Mostly useful for testing.

If `CFG.replaceNonIDBGlobals` is used, it will instead attempt to add,
or if already present, overwrite these globals.

If `CFG.fullIDLSupport` has been set, the slow-performing
`Object.setPrototypeOf` calls required for full WebIDL compliance will
be used. Probably only needed for testing or environments where full
introspection on class relationships is required.
See this [SO topic](http://stackoverflow.com/questions/41927589/rationales-consequences-of-webidl-class-inheritance-requirements)

### shimIndexedDB.\__forceClose([dbName], [connIdx], [msg])

The spec anticipates the [closing of a database connection with a forced flag](http://w3c.github.io/IndexedDB/#steps-for-closing-a-database-connection).

The spec also mentions [some circumstances](http://w3c.github.io/IndexedDB/#database-connection)
where this may occur:

> A connection may be closed by a user agent in exceptional circumstances,
> for example due to loss of access to the file system, a permission change,
> or clearing of the origin’s storage.

Since the latter examples are under the browser's control, this method may
be more useful on the server or for unit-testing.

If the first argument, `dbName` is missing (or `null` or `undefined`),
all connections to all databases will be force-closed.

If the second argument, `connIdx` is missing (or `null` or `undefined`),
all connections with the given name will be force-closed. It can
alternatively be an integer representing a 0-based index to indicate a
specific connection to close.

The third argument `msg` will be appended to the `AbortError` that will be
triggered on the transactions of the connection.

Individual `IDBDatabase` database instances can also be force-closed
with a particular message:

```js
db.__forceClose(msg);
```

### shimIndexedDB.\__setConnectionQueueOrigin(origin = getOrigin())

Establishes a `connectionQueue` for the supplied (or current) origin.

The queue is otherwise only keyed to the detected origin on the
loading of the IndexedDBShim script, though this is usually the
desired behavior.

### shimIndexedDB.\__debug(boolean)

The IndexedDB polyfill has sourcemaps enabled, so the polyfill can be debugged
even if the minified file is included.

To print out detailed debug messages, add this line to your script:

```js
shimIndexedDB.__debug(true);
```

### shimIndexedDB.\__setConfig()

Rather than using globals, a method has been provided to share state across
IndexedDBShim modules.

Configuration can be set early in the non-invasive browser and Node builds
via the second argument to `setGlobalVars()` (see its definition above).

Its signature (for setting configuration after `shimIndexedDB` is created) is:

```js
shimIndexedDB.__setConfig({
    property: value, property2: value2, ...otherProperties
});
```

or:

```js
shimIndexedDB.__setConfig(property, value);
```

### `createDOMException(name, message)`

A utility for creating a `DOMException` instance. Attempts to use any
available native implementation.

#### Configuration options

The available properties relevant to browser or Node are:

- __DEBUG__ - Boolean (equivalent to calling `shimIndexedDB.__debug(val)`)
- __cacheDatabaseInstances__ - Config to ensure that any repeat
    `IDBFactory.open` call to the same name and version (assuming
    no deletes or aborts causing rollbacks) will reuse the same SQLite
    `openDatabase` instance.
- __checkOrigin__ - Boolean on whether to perform origin checks in `IDBFactory`
    methods (`open`, `deleteDatabase`, `databases`); effectively
    defaults to true (must be set to `false` to cancel checks); for Node
    testing, you will either need to define a `location` global from which
    the origin value can be found or set this property to `false`.
- __UnicodeIDStart__ and __UnicodeIDContinue__ - Invocation of
    `createObjectStore` and `createIndex` calls for validation of key paths.
    The specification technically allows all
    `IdentifierName`](https://tc39.github.io/ecma262/#prod-IdentifierName)
    strings, but as this requires a [very large regular expression](https://gist.github.com/brettz9/b4cd6821d990daa023b2e604de371407),
    it is replaced by default with `[$A-Z_a-z]` and `[$0-9A-Z_a-z]`,
    respectively. Note that these are and must be expressed as strings,
    not `RegExp` objects. You can use this configuration to change the default
    to match the spec or as you see fit. In the future we may allow the spec
    behavior via optional dynamic loading of an internal module.
- __registerSCA__ - For data created in 3.* versions of IndexedDBShim to
    continue to work with the more recent version of typeson-registry we
    are using (specifically its Structured Cloning Algorithm), set this
    property to a callback which is passed the current typeson-registry
    structured cloning algorithm representation and return its own to be
    passed to `typeson.register`. See the library
    [typeson-registry-sca-reverter](https://github.com/brettz9/typeson-registry-sca-reverter)
    for a function that can do this and check it for updates if you are
    using it in case needed to work against new updates of IndexedDBShim.
- __fullIDLSupport__ - If set to `true`, the slow-performing
    `Object.setPrototypeOf` calls required for full WebIDL compliance will
    be used. Probably only needed for testing or environments where full
    introspection on class relationships is required.
    See this [SO topic](http://stackoverflow.com/questions/41927589/rationales-consequences-of-webidl-class-inheritance-requirements)
- __win__,  Object on which there may be an `openDatabase` method (if any)
    for WebSQL; Defaults to `window` or `self` in the browser and for Node,
    it is set by default to [`node-websql`](https://github.com/nolanlawson/node-websql).
    If you are intending on adding your own `openDatabase` implementation,
    please note that (for the sake of Node), we rely on supplying an additional
    non-WebSQL-standard callback argument to *WebSQL* `transaction` or
    `readTransaction` calls in our `node-websql` fork to allow it to prolong
    the transaction (to last through our IndexedDB transaction) and to provide
    rollback functionality. (See
    <https://github.com/axemclion/IndexedDBShim/issues/296>, however, for
    a remaining issue this fix does not currently overcome.)
- __cursorPreloadPackSize__ - Number indicating how many records to preload for
    caching of (non-multiEntry) `IDBCursor.continue` calls. Defaults to 100.
- __DEFAULT_DB_SIZE__ - Used as estimated size argument (in bytes) to
    underlying WebSQL `openDatabase` calls. Defaults to `4 * 1024 * 1024` or
    `25 * 1024 * 1024` in Safari (apparently necessary due to Safari creating
    larger files and possibly also due to Safari not completing the storage
    of all records even after permission is given). Has no effect in Node
    (using [`node-websql`](https://github.com/nolanlawson/node-websql)),
    and its use in WebSQL-compliant browsers is implementation dependent (the
    browser may use this information to suggest the use of this quota to the
    user rather than prompting the user regularly for say incremental 5MB
    permissions).
- __useSQLiteIndexes__ - Whether to create indexes on SQLite tables (and also
    whether to try dropping). Indexes can increase file size and slow
    performance on tables involving many write operations, but can speed
    performance for retrieval. Defaults to `false`.
- __avoidAutoShim__ - Where WebSQL is detected but where `indexedDB` is
    missing or poor support is known (non-Chrome Android or
    non-Safari iOS9), the shim will be auto-applied without
    `shimIndexedDB.__useShim()`. Set this to `true` to avoid forcing
    the shim for such cases.

The following config are mostly relevant to Node but has bearing on the
browser, particularly if one changes the defaults.

- __fs__ - File system module with `unlink` to remove deleted database files.
    Auto-set by Node distributions.
- __addNonIDBGlobals__ - If set to `true` will polyfill the "global" with
    non-IndexedDB shims created by and sometimes returned publicly by
    the library. These include `ShimEvent`, `ShimCustomEvent`,
    `ShimEventTarget`, `ShimDOMException`, and `ShimDOMStringList`.
    Mostly useful for debugging (and in Node where these
    are not available by default).
- __replaceNonIDBGlobals__ - Similar to `addNonIDBGlobals` but will attempt
    to add the values unprefixed and overwrite if possible. Mostly for
    testing.
- __escapeDatabaseName__ - Due to the Node implementation's reliance on
    `node-websql`/`node-sqlite3` which create files for each database
    (and the fact that we haven't provided an option to map filename-safe
    IDs to arbitrary, user-supplied IndexedDB database names),
    when the user creates IndexedDB databases, the Node implementation
    will be subject to the limitations systems can have with filenames.
    Since IndexedDBShim aims to facilitate code that can work on both
    the server and client, we have applied some escaping and restrictions
    by default. The default behavior is to prefix the database name with
    `D_` (to avoid filesystem, SQLite, and `node-sqlite3` problems if
    the user supplies the IndexedDB-permitted empty string database
    name), to escape `^` which we use as our own generally-filename-supported
    escape character, to escape NUL (which is also problematic in SQLite
    identifiers and in `node-sqlite3` in general) as `^0`, to escape upper-case
    letters A-Z as `^A`, `^B`, etc. (since IndexedDB insists on
    case-sensitivity while file systems often do not), to escape any
    characters mentioned in `databaseCharacterEscapeList` (as `^1` + a
    two-hexadecimal-digit-padded sequence), and to throw an `Error` if
    `databaseNameLengthLimit` is not set to `false` and is surpassed
    by the resulting escaped name. You can use this `escapeDatabaseName`
    callback property to override the default behavior, with the callback
    accepting a single argument of the user's database name choice and
    returning your own filename-safe value. Note that we do escape NUL and
    our own escape character (`^`) before passing in the value (for the
    above-mentioned reasons), though you could unescape and
    return your own escaped format. While some file systems may not have
    the other restrictions, you should at a minimum anticipate
    the possibility for empty strings (since we rely on the result of this
    function for internal escaping as a SQLite identifier) as well as
    realize the string `":memory:"` will, if unescaped, have a special
    meaning with `node-sqlite3`. You can make the escaping more lax,
    e.g., if your file system is case-sensitive, or you could make it more
    stringent.
- __unescapeDatabaseName__ - Not used internally; usable as a convenience
    method for unescaping strings formatted per our default escaping
    conventions.
- __databaseCharacterEscapeList__ - When this property and
    `escapeDatabaseName` are not overridden, the following characters will
    be escaped by default, even though IndexedDB has no such restrictions,
    as they are restricted in a number of file systems, even modern,
    Unicode-supporting ones: `0x00-0x1F 0x7F " * / : < > ? \ |`. This
    property can be overridden with a string that will be converted into
    an alternate regular expression or supplied with `false` to disable
    any character limitations.
- __databaseNameLengthLimit__ - When this property and
    `escapeDatabaseName` are not overridden, an error will be thrown if
    the escaped filename exceeds the length of 254 characters (the shortest
    typical modern file length maximum). Provide a number to change the
    limit or supply `false` to disable any length checking.
- __escapeNFDForDatabaseNames__ - Boolean defaulting to true on whether
    to escape NFD-escaping characters to avoid clashes on MacOS which
    performs NFD on files
- __addSQLiteExtension__ - Boolean on whether to add the `.sqlite` extension
    to database file names (including `__sysdb__` which tracks versions);
    defaults to `true`
- __autoName__ - Boolean config to interpret empty string name as a
    cue for creating a database name automatically (introspect on
    `IDBDatabase.name` to get the actual name used); `false` by default

Node-only config:

- __sysDatabaseBasePath__ - Base path for the `__sysdb__(.sqlite)` database
    file; defaults to `__databaseBasePath` unless another value (including
    the empty string) is given; otherwise is the empty string
- __databaseBasePath__ - Base path for user database files; defaults to the
    empty string
- __deleteDatabaseFiles__ - Deletes physical database file upon
    `deleteDatabase` (instead of merely emptying). Defaults to `true`.
    Does not currently delete the database for tracking available
    databases and versions, `__sys__`, if emptied; see
    [#278](https://github.com/axemclion/IndexedDBShim/issues/278).
- __memoryDatabase__ - String config to cause all opening, deleting, and
    listing to be of SQLite in-memory databases; name supplied
    by user is still used (including to automatically build a cache since
    SQLite does not allow naming of in-memory databases); the name is also
    accessible to `IDBFactory.databases()`; causes database
    name/version tracking to also be within an in-memory database; if
    set in the browser, avoids normal database name escaping meant
    for Node compatibility; allowable values include the empty string,
    `":memory:"`, and `file::memory:[?optionalQueryString][#optionalHash]`.
    See <https://sqlite.org/inmemorydb.html> and <https://sqlite.org/uri.html>
    for more on the function and form of such values

Node config mostly for development debugging:

- __sqlBusyTimeout__ - Integer used by Node WebSQL for
    [SQLite config](https://github.com/mapbox/node-sqlite3/wiki/API#databaseconfigureoption-value)
    to set the [busy timeout](https://www.sqlite.org/c3ref/busy_timeout.html)
    (Defaults to 1000 ms)
- __sqlTrace__ - Callback used by Node WebSQL for
    [SQLite config](https://github.com/mapbox/node-sqlite3/wiki/API#databaseconfigureoption-value)
    (Invoked when an SQL statement executes, with a rendering of the
    statement text)
- __sqlProfile__ - Callback used by Node WebSQL for
    [SQLite config](https://github.com/mapbox/node-sqlite3/wiki/API#databaseconfigureoption-value)
    (Invoked every time an SQL statement executes)
    // Overcoming limitations with node-sqlite3/storing database name on
    // file systems
    // https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words

### shimIndexedDB.\__getConfig()

For retrieving a config value:

```js
shimIndexedDB.__getConfig(property);
```

## Known Issues

All code has bugs, and this project is no exception.  If you find a bug,
please [let us know about it](https://github.com/indexeddbshim/indexeddbshim/issues).
Or better yet, [send us a fix](https://github.com/indexeddbshim/indexeddbshim/pulls)!
Please make sure someone else hasn't already reported the same bug though.

Here is a summary of main [known issues](https://github.com/axemclion/IndexedDBShim/issues/262#issuecomment-254413002)
to resolve:

1. `blocked` and `versionchange` `IDBVersionChangeEvent` event support ([#2](https://github.com/axemclion/IndexedDBShim/issues/2) and [#273](https://github.com/axemclion/IndexedDBShim/issues/273)) across
processes/browser windows
1. Some issues related to [task/micro-task timing](https://github.com/axemclion/IndexedDBShim/issues/296)
in Node (for inherent limitations in the browser, see below).
1. [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData/ImageData) storage on Node 14 when used with `node-canvas` - due to [this issue](https://github.com/Automattic/node-canvas/issues/1646)

There are a few bugs that are outside of our power to fix.  Namely:

### Browser rollback

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

A `setTimeout` timeout of `0`, on the other hand (a full "task"), ought,
for compliant implementations, to be long enough of a time to cause a
time out of the transaction, but in Node where we prolong transactions
long enough to ensure our full chain of asynchronous SQL needed for the
transaction operations is run (as well as ensure complete rollback should
there be an error causing a transaction abort), it may be too short.

We could fix this in Node (where we can have access to a synchronous
SQLite API such as <https://github.com/grumdrig/node-sqlite> unlike
on the browser) and ensure transactions finish before the next task
(though always after a microtask), but as mentioned above, this would
degrade performance particularly on a server (and in the browser,
the WebSQL API on which we are relying did not apparently
gain support in browsers for the synchronous API).

[This test](https://github.com/w3c/web-platform-tests/blob/master/IndexedDB/transaction-deactivation-timing.html) and
[this one](https://github.com/w3c/web-platform-tests/blob/master/IndexedDB/upgrade-transaction-deactivation-timing.html)
demonstrate the *expected* timeout behavior with regard to `setTimeout`
or promises and transaction expiration.

### [Structured Cloning Algorithm](https://html.spec.whatwg.org/multipage/infrastructure.html#safe-passing-of-structured-data)

Due to
[certain challenges](http://stackoverflow.com/questions/42170826/categories-for-rejection-by-the-structured-cloning-algorithm)
in detecting cloneable objects from within JavaScript, there are certain
limitations regarding cloning:

1. We cannot properly detect `Proxy` to throw upon encountering such
    non-cloneable objects
1. Our reliance on `Object.prototype.toString` to detect uncloneable objects
    can fail if that method is overridden or if `Symbol.toStringTag` is used
    to change the default reporting of a given "class".
1. Although they are currently working, we were only able to resolve `Blob`,
    `File`, and `FileList` objects synchronously (as
    [required per spec](https://github.com/axemclion/IndexedDBShim/issues/285))
    using the now-deprecated `XMLHttpRequest` synchronous API.
1. Without a means of transferring `ArrayBuffer` objects in Node, we cannot
    meet the requirement to fail upon encountering detached binary objects.
1. They may be other subtleties we have not been able to work around.

We have, however, overcome some cloning issues still faced by browser
implementations, e.g., in Chrome (issue
[#698564](https://bugs.chromium.org/p/chromium/issues/detail?id=698564))
(re: not failing on `WeakMap`, `WeakSet`, `Promise`, and `Object.prototype`).

We also have limitations in creating certain objects synchronously, namely, the
one method for creating an image bitmap, `createImageBitmap`, returns a
`Promise`, so we cannot clone a bona fide image bitmap synchronously so as to
obtain any errors synchronously as expected by the IndexedDB methods involving
cloning.

### Node versions 8.9.3 to 9.0.0

Our Mocha test "query multi-entry indexes with hundreds of records" of
`IDBIndex/openCursor-spec.js` is failing for these versions. Starting
with 9.1.0, however, the test passes again.

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
    var indexedDB = window.indexedDB || window.mozIndexedDB || // eslint-disable-line no-var
        window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

    // This code will use the native IndexedDB, if it exists, or the shim otherwise
    indexedDB.open('MyDatabase', 1);
})();
```

### Windows Phone

*This information might be outdated. Reports on current support or fixes welcome.*

IndexedDBShim works on Windows Phone via a Cordova/PhoneGap plug-in.  There
are two plugins available: [cordova-plugin-indexedDB](https://github.com/MSOpenTech/cordova-plugin-indexedDB)
and [cordova-plugin-indexeddb-async](https://github.com/ABB-Austin/cordova-plugin-indexeddb-async).
Both plug-ins rely on a WebSQL-to-SQLite adapter, but there are differences
in their implementations.  Try them both and see which one works best for
your app.

## Building

To build the project locally on your computer:

1. __Clone this repo__
If you clone the repository to work against an unstable version, you only
need to clone the repository recursively (via
`git clone https://github.com/indexeddbshim/indexeddbshim.git --recursive`)
if you wish to have the W3C tests available for testing (which
unfortunately loads all W3C tests into the "web-platform-tests"
subdirectory rather than just the IndexedDB ones). Otherwise, just use
`git clone https://github.com/indexeddbshim/indexeddbshim.git`

1. __Install dev dependencies (and websql for Node)__
`yarn install`

1. __Run the build script__
`npm start`

1. __Done__

The output files will be generated in the `dist` directory

## Upgrading from previous versions

See [Versions](docs/versions/) for migration information.

## Testing

See [TESTING](docs/TESTING.md).

## Resources for IndexedDB

- [TrialTool](http://nparashuram.com/trialtool) - For experimenting with
    IndexedDB commands, including predefined examples. (Some examples
    may depend on others previously being run, even with
    "Load Pre-Requisites" added, but it is nevertheless useful to avoid
    boilerplate in testing out commands, in conjunction with
    the browser developer tools.)

## Contributing

Pull requests or Bug reports welcome! See [CONTRIBUTING](docs/CONTRIBUTING.MD)

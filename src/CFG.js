const map = {};
const CFG = {};

[
    // Boolean for verbose reporting
    'DEBUG', // Effectively defaults to false (ignored unless true)

    // Used by `IDBCursor` continue methods for number of records to cache;
    'cursorPreloadPackSize', //  Defaults to 100

    // See optional API (`shimIndexedDB.__setUnicodeIdentifiers`);
    //    or just use the Unicode builds which invoke this method
    //    automatically using the large, fully spec-compliant, regular
    //    expression strings of `src/UnicodeIdentifiers.js`)
    'UnicodeIDStart', // In the non-Unicode builds, defaults to /[$A-Z_a-z]/
    'UnicodeIDContinue', // In the non-Unicode builds, defaults to /[$0-9A-Z_a-z]/

    // -----------SQL CONFIG----------
    // Object (`window` in the browser) on which there may be an
    //  `openDatabase` method (if any) for WebSQL. (The browser
    //  throws if attempting to call `openDatabase` without the window
    //  so this is why the config doesn't just allow the function.)
    'win', // Defaults to `window` or `self` in browser builds or
           // a singleton object with the `openDatabase` method set to
           // the "websql" package in Node.

    // For internal `openDatabase` calls made by `IDBFactory` methods;
    //  per the WebSQL spec, "User agents are expected to use the display name
    //  and the estimated database size to optimize the user experience.
    //  For example, a user agent could use the estimated size to suggest an
    //  initial quota to the user. This allows a site that is aware that it
    //  will try to use hundreds of megabytes to declare this upfront, instead
    //  of the user agent prompting the user for permission to increase the
    //  quota every five megabytes."
    'DEFAULT_DB_SIZE', // Defaults to (4 * 1024 * 1024) or (25 * 1024 * 1024) in Safari

    // Overcoming limitations with node-sqlite3/storing database name on file systems
    // https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
    'escapeDatabaseName', // Defaults to prefixing database with `D_`, escaping
                          //   `databaseCharacterEscapeList`, escaping NUL, and
                          //   escaping upper case letters, as well as enforcing
                          //   `databaseNameLengthLimit`
    'unescapeDatabaseName', // Not used internally; usable as a convenience method
    'databaseCharacterEscapeList', // Defaults to global regex representing the following
        // (characters nevertheless commonly reserved in modern, Unicode-supporting
        // systems): 0x00-0x1F 0x7F " * / : < > ? \ |
    'databaseNameLengthLimit', // Defaults to 254 (shortest typical modern file length limit)

    // Optional Node WebSQL config
    'sqlBusyTimeout', // Defaults to 1000
    'sqlTrace', // Callback not used by default
    'sqlProfile' // Callback not used by default
].forEach((prop) => {
    Object.defineProperty(CFG, prop, {
        get: function () {
            return map[prop];
        },
        set: function (val) {
            map[prop] = val;
        }
    });
});

export default CFG;

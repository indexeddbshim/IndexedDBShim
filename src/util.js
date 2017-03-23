import CFG from './CFG';

function escapeNameForSQLiteIdentifier (arg) {
    // http://stackoverflow.com/a/6701665/271577
    return '_' + // Prevent empty string
        arg.replace(/\^/g, '^^') // Escape our escape
        // http://www.sqlite.org/src/tktview?name=57c971fc74
        .replace(/\0/g, '^0')
        // We need to avoid identifiers being treated as duplicates based on SQLite's ASCII-only case-insensitive table and column names
        // (For SQL in general, however, see http://stackoverflow.com/a/17215009/271577
        // See also https://www.sqlite.org/faq.html#q18 re: Unicode (non-ASCII) case-insensitive not working
        .replace(/([A-Z])/g, '^$1')
        // http://stackoverflow.com/a/6701665/271577
        .replace(/([\uD800-\uDBFF])(?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])([\uDC00-\uDFFF])/g, function (_, unmatchedHighSurrogate, unmatchedLowSurrogate) {
            if (unmatchedHighSurrogate) {
                return '^2' + unmatchedHighSurrogate + '\uDC00'; // Add a low surrogate for compatibility with `node-sqlite3`: http://bugs.python.org/issue12569 and http://stackoverflow.com/a/6701665/271577
            }
            return '^3\uD800' + unmatchedLowSurrogate;
        });
}

function escapeSQLiteStatement (arg) {
    return arg.replace(/\^/g, '^^').replace(/\0/g, '^0');
}
function unescapeSQLiteResponse (arg) {
    return arg.replace(/\^0/g, '\0').replace(/\^\^/g, '^');
}

function sqlEscape (arg) {
    // https://www.sqlite.org/lang_keywords.html
    // http://stackoverflow.com/a/6701665/271577
    // There is no need to escape ', `, or [], as
    //   we should always be within double quotes
    // NUL should have already been stripped
    return arg.replace(/"/g, '""');
}

function sqlQuote (arg) {
    return '"' + sqlEscape(arg) + '"';
}

function escapeDatabaseNameForSQLAndFiles (db) {
    if (CFG.useInMemoryDatabases) {
        return ':memory:';
    }
    if (CFG.escapeDatabaseName) {
        // We at least ensure NUL is escaped by default, but we need to still
        //   handle empty string and possibly also length (potentially
        //   throwing if too long), escaping casing (including Unicode?),
        //   and escaping special characters depending on file system
        return CFG.escapeDatabaseName(escapeSQLiteStatement(db));
    }
    db = 'D' + escapeNameForSQLiteIdentifier(db);
    if (CFG.databaseCharacterEscapeList !== false) {
        db = db.replace(
            (CFG.databaseCharacterEscapeList
                ? new RegExp(CFG.databaseCharacterEscapeList, 'g')
                : /[\u0000-\u001F\u007F"*/:<>?\\|]/g),
            function (n0) {
                return '^1' + n0.charCodeAt().toString(16).padStart(2, '0');
            }
        );
    }
    if (CFG.databaseNameLengthLimit !== false &&
        db.length >= (CFG.databaseNameLengthLimit || 254)) {
        throw new Error(
            'Unexpectedly long database name supplied; length limit required for Node compatibility; passed length: ' +
            db.length + '; length limit setting: ' + (CFG.databaseNameLengthLimit || 254) + '.');
    }
    return db; // Shouldn't have quoting (do we even need NUL/case escaping here?)
}

// Not in use internally but supplied for convenience
function unescapeDatabaseNameForSQLAndFiles (db) {
    if (CFG.unescapeDatabaseName) {
        // We at least ensure NUL is unescaped by default, but we need to still
        //   handle empty string and possibly also length (potentially
        //   throwing if too long), unescaping casing (including Unicode?),
        //   and unescaping special characters depending on file system
        return CFG.unescapeDatabaseName(unescapeSQLiteResponse(db));
    }

    return db.slice(2) // D_
        .replace(/(\^+)1([0-9a-f]{2})/g, (_, esc, hex) => esc % 2 ? String.fromCharCode(parseInt(hex, 16)) : _) // databaseCharacterEscapeList
        .replace(/(\^+)3\uD800([\uDC00-\uDFFF])/g, (_, esc, lowSurr) => esc % 2 ? lowSurr : _)
        .replace(/(\^+)2([\uD800-\uDBFF])\uDC00/g, (_, esc, highSurr) => esc % 2 ? highSurr : _)
        .replace(/(\^+)([A-Z])/g, (_, esc, upperCase) => esc % 2 ? upperCase : _)
        .replace(/(\^+)0/g, (_, esc) => esc % 2 ? '\0' : _)
        .replace(/\^\^/g, '^');
}

function escapeStoreNameForSQL (store) {
    return sqlQuote('S' + escapeNameForSQLiteIdentifier(store));
}

function escapeIndexNameForSQL (index) {
    return sqlQuote('I' + escapeNameForSQLiteIdentifier(index));
}

function escapeIndexNameForSQLKeyColumn (index) {
    return 'I' + escapeNameForSQLiteIdentifier(index);
}

function sqlLIKEEscape (str) {
    // https://www.sqlite.org/lang_expr.html#like
    return sqlEscape(str).replace(/\^/g, '^^');
}

// Babel doesn't seem to provide a means of using the `instanceof` operator with Symbol.hasInstance (yet?)
function instanceOf (obj, Clss) {
    return Clss[Symbol.hasInstance](obj);
}

function isObj (obj) {
    return obj && typeof obj === 'object';
}

function isDate (obj) {
    return isObj(obj) && typeof obj.getDate === 'function';
}

function isBlob (obj) {
    return isObj(obj) && typeof obj.size === 'number' && typeof obj.slice === 'function' && !('lastModified' in obj);
}

function isRegExp (obj) {
    return isObj(obj) && typeof obj.flags === 'string' && typeof obj.exec === 'function';
}

function isFile (obj) {
    return isObj(obj) && typeof obj.name === 'string' && typeof obj.slice === 'function' && 'lastModified' in obj;
}

function isBinary (obj) {
    return isObj(obj) && typeof obj.byteLength === 'number' && (
        typeof obj.slice === 'function' || // `TypedArray` (view on buffer) or `ArrayBuffer`
        typeof obj.getFloat64 === 'function' // `DataView` (view on buffer)
    );
}

function isIterable (obj) {
    return isObj(obj) && typeof obj[Symbol.iterator] === 'function';
}

function defineReadonlyProperties (obj, props) {
    props = typeof props === 'string' ? [props] : props;
    props.forEach(function (prop) {
        Object.defineProperty(obj, '__' + prop, {
            enumerable: false,
            configurable: false,
            writable: true
        });
        Object.defineProperty(obj, prop, {
            enumerable: true,
            configurable: true,
            get: function () {
                return this['__' + prop];
            }
        });
    });
}

const HexDigit = '[0-9a-fA-F]';
// The commented out line below is technically the grammar, with a SyntaxError
//   to occur if larger than U+10FFFF, but we will prevent the error by
//   establishing the limit in regular expressions
// const HexDigits = HexDigit + HexDigit + '*';
const HexDigits = '0*(?:' + HexDigit + '{1,5}|10' + HexDigit + '{4})*';
const UnicodeEscapeSequence = '(?:u' + HexDigit + '{4}|u{' + HexDigits + '})';

function isIdentifier (item) {
    // For load-time and run-time performance, we don't provide the complete regular
    //   expression for identifiers, but these can be passed in, using the expressions
    //   found at https://gist.github.com/brettz9/b4cd6821d990daa023b2e604de371407
    // ID_Start (includes Other_ID_Start)
    const UnicodeIDStart = CFG.UnicodeIDStart || '[$A-Z_a-z]';
    // ID_Continue (includes Other_ID_Continue)
    const UnicodeIDContinue = CFG.UnicodeIDContinue || '[$0-9A-Z_a-z]';
    const IdentifierStart = '(?:' + UnicodeIDStart + '|[$_]|\\\\' + UnicodeEscapeSequence + ')';
    const IdentifierPart = '(?:' + UnicodeIDContinue + '|[$_]|\\\\' + UnicodeEscapeSequence + '|\\u200C|\\u200D)';
    return (new RegExp('^' + IdentifierStart + IdentifierPart + '*$')).test(item);
}

function isValidKeyPathString (keyPathString) {
    return typeof keyPathString === 'string' &&
        (keyPathString === '' || isIdentifier(keyPathString) || keyPathString.split('.').every(isIdentifier));
}

function isValidKeyPath (keyPath) {
    return isValidKeyPathString(keyPath) || (
        Array.isArray(keyPath) && keyPath.length &&
            // Convert array from sparse to dense http://www.2ality.com/2012/06/dense-arrays.html
            Array.apply(null, keyPath).every(function (kpp) {
                // See also https://heycam.github.io/webidl/#idl-DOMString
                return isValidKeyPathString(kpp); // Should already be converted to string by here
            })
    );
}

function enforceRange (number, type) {
    number = Math.floor(Number(number));
    let max, min;
    switch (type) {
    case 'unsigned long long': {
        max = 0x1FFFFFFFFFFFFF; // 2^53 - 1
        min = 0;
        break;
    }
    case 'unsigned long': {
        max = 0xFFFFFFFF; // 2^32 - 1
        min = 0;
        break;
    }
    default:
        throw new Error('Unrecognized type supplied to enforceRange');
    }
    if (isNaN(number) || !isFinite(number) ||
        number > max ||
        number < min) {
        throw new TypeError('Invalid range: ' + number);
    }
    return number;
}

function ToString (o) { // Todo: See `es-abstract/es7`
    return '' + o; // `String()` will not throw with Symbols
}

function convertToSequenceDOMString (val) {
    // Per <https://heycam.github.io/webidl/#idl-sequence>, converting to a sequence works with iterables
    if (isIterable(val)) { // We don't want `Array.from` to convert primitives
        // Per <https://heycam.github.io/webidl/#es-DOMString>, converting to a `DOMString` to be via `ToString`: https://tc39.github.io/ecma262/#sec-tostring
        return Array.from(val).map(ToString);
    }
    return val;
}

export {escapeSQLiteStatement, unescapeSQLiteResponse,
    escapeDatabaseNameForSQLAndFiles, unescapeDatabaseNameForSQLAndFiles,
    escapeStoreNameForSQL, escapeIndexNameForSQL, escapeIndexNameForSQLKeyColumn,
    sqlLIKEEscape, sqlQuote,
    instanceOf,
    isObj, isDate, isBlob, isRegExp, isFile, isBinary, isIterable,
    defineReadonlyProperties, isValidKeyPath, enforceRange, convertToSequenceDOMString};

import CFG from './CFG.js';
import expandsOnNFD from './unicode-regex.js';

/**
 * @typedef {number} Integer
 */

/**
 * @param {string} arg
 * @returns {string}
 */
function escapeUnmatchedSurrogates (arg) {
    // http://stackoverflow.com/a/6701665/271577
    return arg.replaceAll(
        /([\uD800-\uDBFF])(?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])([\uDC00-\uDFFF])/gu,
        function (_, unmatchedHighSurrogate, precedingLow, unmatchedLowSurrogate) {
            // Could add a corresponding surrogate for compatibility with `node-sqlite3`: http://bugs.python.org/issue12569 and http://stackoverflow.com/a/6701665/271577
            //   but Chrome having problems
            if (unmatchedHighSurrogate) {
                return '^2' + unmatchedHighSurrogate.codePointAt()
                    .toString(16).padStart(4, '0');
            }
            return (precedingLow || '') + '^3' +
                unmatchedLowSurrogate.codePointAt().toString(16).padStart(4, '0');
        }
    );
}

/**
 * @param {string} arg
 * @returns {string}
 */
function escapeNameForSQLiteIdentifier (arg) {
    // http://stackoverflow.com/a/6701665/271577
    return '_' + // Prevent empty string
        escapeUnmatchedSurrogates(
            arg.replaceAll('^', '^^') // Escape our escape
                // http://www.sqlite.org/src/tktview?name=57c971fc74
                .replaceAll('\0', '^0')
                // We need to avoid identifiers being treated as duplicates based on SQLite's ASCII-only case-insensitive table and column names
                // (For SQL in general, however, see http://stackoverflow.com/a/17215009/271577
                // See also https://www.sqlite.org/faq.html#q18 re: Unicode (non-ASCII) case-insensitive not working
                .replaceAll(/([A-Z])/gu, '^$1')
        );
}

/**
 * The escaping of unmatched surrogates was needed by Chrome but not Node.
 * @param {string} arg
 * @returns {string}
 */
function escapeSQLiteStatement (arg) {
    return escapeUnmatchedSurrogates(arg.replaceAll('^', '^^').replaceAll('\0', '^0'));
}

/**
 * @param {string} arg
 * @returns {string}
 */
function unescapeSQLiteResponse (arg) {
    return unescapeUnmatchedSurrogates(arg)
        .replaceAll(/(\^+)0/gu, (_, esc) => {
            return esc.length % 2
                ? esc.slice(1) + '\0'
                : _;
        })
        .replaceAll('^^', '^');
}

/**
 * @param {string} arg
 * @returns {string}
 */
function sqlEscape (arg) {
    // https://www.sqlite.org/lang_keywords.html
    // http://stackoverflow.com/a/6701665/271577
    // There is no need to escape ', `, or [], as
    //   we should always be within double quotes
    // NUL should have already been stripped
    return arg.replaceAll('"', '""');
}

/**
 * @param {string} arg
 * @returns {string}
 */
function sqlQuote (arg) {
    return '"' + sqlEscape(arg) + '"';
}

/**
 * @param {string} db
 * @throws {Error}
 * @returns {string}
 */
function escapeDatabaseNameForSQLAndFiles (db) {
    if (CFG.escapeDatabaseName) {
        // We at least ensure NUL is escaped by default, but we need to still
        //   handle empty string and possibly also length (potentially
        //   throwing if too long), escaping casing (including Unicode?),
        //   and escaping special characters depending on file system
        return CFG.escapeDatabaseName(escapeSQLiteStatement(db));
    }
    db = 'D' + escapeNameForSQLiteIdentifier(db);
    if (CFG.escapeNFDForDatabaseNames !== false) {
        // ES6 copying of regex with different flags
        db = db.replaceAll(new RegExp(expandsOnNFD, 'gu'), function (expandable) {
            return '^4' + /** @type {Integer} */ (expandable.codePointAt(0)).toString(16).padStart(6, '0');
        });
    }
    if (CFG.databaseCharacterEscapeList !== false) {
        db = db.replace(
            (CFG.databaseCharacterEscapeList
                ? new RegExp(CFG.databaseCharacterEscapeList, 'gu')
                : /[\u0000-\u001F\u007F"*/:<>?\\|]/gu), // eslint-disable-line no-control-regex
            function (n0) {
                // eslint-disable-next-line unicorn/prefer-code-point -- Switch to `codePointAt`?
                return '^1' + n0.charCodeAt(0).toString(16).padStart(2, '0');
            }
        );
    }
    if (CFG.databaseNameLengthLimit !== false &&
        db.length >= ((CFG.databaseNameLengthLimit || 254) - (CFG.addSQLiteExtension !== false ? 7 /* '.sqlite'.length */ : 0))) {
        throw new Error(
            'Unexpectedly long database name supplied; length limit required for Node compatibility; passed length: ' +
            db.length + '; length limit setting: ' + (CFG.databaseNameLengthLimit || 254) + '.'
        );
    }
    return db + (CFG.addSQLiteExtension !== false ? '.sqlite' : ''); // Shouldn't have quoting (do we even need NUL/case escaping here?)
}

/**
 * @param {string} arg
 * @returns {string}
 */
function unescapeUnmatchedSurrogates (arg) {
    return arg
        .replaceAll(/(\^+)3(d[0-9a-f]{3})/gu, (_, esc, lowSurr) => {
            return esc.length % 2
                ? esc.slice(1) + String.fromCodePoint(Number.parseInt(lowSurr, 16))
                : _;
        }).replaceAll(/(\^+)2(d[0-9a-f]{3})/gu, (_, esc, highSurr) => {
            return esc.length % 2
                ? esc.slice(1) + String.fromCodePoint(Number.parseInt(highSurr, 16))
                : _;
        });
}

/**
 * Not in use internally but supplied for convenience.
 * @param {string} db
 * @returns {string}
 */
function unescapeDatabaseNameForSQLAndFiles (db) {
    if (CFG.unescapeDatabaseName) {
        // We at least ensure NUL is unescaped by default, but we need to still
        //   handle empty string and possibly also length (potentially
        //   throwing if too long), unescaping casing (including Unicode?),
        //   and unescaping special characters depending on file system
        return CFG.unescapeDatabaseName(unescapeSQLiteResponse(db));
    }

    return unescapeUnmatchedSurrogates(
        db.slice(2) // D_
            // CFG.databaseCharacterEscapeList
            .replaceAll(/(\^+)1([0-9a-f]{2})/gu, (_, esc, hex) => {
                return esc.length % 2
                    ? esc.slice(1) + String.fromCodePoint(Number.parseInt(hex, 16))
                    : _;
            // CFG.escapeNFDForDatabaseNames
            }).replaceAll(/(\^+)4([0-9a-f]{6})/gu, (_, esc, hex) => {
                return esc.length % 2
                    ? esc.slice(1) + String.fromCodePoint(Number.parseInt(hex, 16))
                    : _;
            })
    // escapeNameForSQLiteIdentifier (including unescapeUnmatchedSurrogates() above)
    ).replaceAll(/(\^+)([A-Z])/gu, (_, esc, upperCase) => {
        return esc.length % 2
            ? esc.slice(1) + upperCase
            : _;
    }).replaceAll(/(\^+)0/gu, (_, esc) => {
        return esc.length % 2
            ? esc.slice(1) + '\0'
            : _;
    }).replaceAll('^^', '^');
}

/**
 * @param {string} store
 * @returns {string}
 */
function escapeStoreNameForSQL (store) {
    return sqlQuote('S' + escapeNameForSQLiteIdentifier(store));
}

/**
 * @param {string} index
 * @returns {string}
 */
function escapeIndexNameForSQL (index) {
    return sqlQuote('I' + escapeNameForSQLiteIdentifier(index));
}

/**
 * @param {string} index
 * @returns {string}
 */
function escapeIndexNameForSQLKeyColumn (index) {
    return 'I' + escapeNameForSQLiteIdentifier(index);
}

/**
 * @param {string} str
 * @returns {string}
 */
function sqlLIKEEscape (str) {
    // https://www.sqlite.org/lang_expr.html#like
    return sqlEscape(str).replaceAll('^', '^^');
}

/**
 * @typedef {Function} AnyClass
 */

// Babel doesn't seem to provide a means of using the `instanceof` operator with Symbol.hasInstance (yet?)
/**
 *
 * @param {AnyValue} obj
 * @param {AnyClass} Clss
 * @returns {boolean}
 */
function instanceOf (obj, Clss) {
    return Clss[Symbol.hasInstance](obj);
}

/**
 *
 * @param {AnyValue} obj
 * @returns {obj is object}
 */
function isObj (obj) {
    return obj !== null && typeof obj === 'object';
}

/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
function isDate (obj) {
    return isObj(obj) && 'getDate' in obj && typeof obj.getDate === 'function';
}

/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
function isBlob (obj) {
    return isObj(obj) && 'size' in obj && typeof obj.size === 'number' &&
    'slice' in obj && typeof obj.slice === 'function' && !('lastModified' in obj);
}

/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
function isRegExp (obj) {
    return isObj(obj) && 'flags' in obj && typeof obj.flags === 'string' &&
    'exec' in obj && typeof obj.exec === 'function';
}

/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
function isFile (obj) {
    return isObj(obj) && 'name' in obj && typeof obj.name === 'string' &&
    'slice' in obj && typeof obj.slice === 'function' && 'lastModified' in obj;
}

/**
 *
 * @param {AnyValue} obj
 * @returns {boolean}
 */
function isBinary (obj) {
    return isObj(obj) && 'byteLength' in obj && typeof obj.byteLength === 'number' && (
        ('slice' in obj && typeof obj.slice === 'function') || // `TypedArray` (view on buffer) or `ArrayBuffer`
        ('getFloat64' in obj && typeof obj.getFloat64 === 'function') // `DataView` (view on buffer)
    );
}

/**
 *
 * @param {AnyValue} obj
 * @returns {boolean}
 */
function isIterable (obj) {
    return isObj(obj) && Symbol.iterator in obj &&
        typeof obj[Symbol.iterator] === 'function';
}

/**
 *
 * @param {object} obj
 * @param {string[]} props
 * @returns {void}
 */
function defineOuterInterface (obj, props) {
    props.forEach((prop) => {
        const o = {
            get [prop] () {
                throw new TypeError('Illegal invocation');
            },
            // @ts-expect-error Deliberately errs
            set [prop] (val) {
                throw new TypeError('Illegal invocation');
            }
        };
        const desc = /** @type {PropertyDescriptor} */ (
            Object.getOwnPropertyDescriptor(o, prop)
        );
        Object.defineProperty(obj, prop, desc);
    });
}

/**
 *
 * @param {object} obj
 * @param {string[]} props
 * @returns {void}
 */
function defineReadonlyOuterInterface (obj, props) {
    props.forEach((prop) => {
        const o = {
            get [prop] () {
                throw new TypeError('Illegal invocation');
            }
        };
        const desc = /** @type {PropertyDescriptor} */ (
            Object.getOwnPropertyDescriptor(o, prop)
        );
        Object.defineProperty(obj, prop, desc);
    });
}

/**
 *
 * @param {object & {
 *   [key: string]: any
 * }} obj
 * @param {string[]} listeners
 * @returns {void}
 */
function defineListenerProperties (obj, listeners) {
    listeners = typeof listeners === 'string' ? [listeners] : listeners;
    listeners.forEach((listener) => {
        const o = {
            get [listener] () {
                return obj['__' + listener];
            },
            /**
             * @param {AnyValue} val
             * @returns {void}
             */
            set [listener] (val) {
                obj['__' + listener] = val;
            }
        };
        const desc = /** @type {PropertyDescriptor} */ (
            Object.getOwnPropertyDescriptor(o, listener)
        );
        // desc.enumerable = true; // Default
        // desc.configurable = true; // Default // Needed by support.js in W3C IndexedDB tests (for openListeners)
        Object.defineProperty(obj, listener, desc);
    });
    listeners.forEach((l) => {
        obj[l] = null;
    });
}

/**
 *
 * @param {object} obj
 * @param {string|string[]} props
 * @param {null|{
 *   [key: string]: any
 * }} getter
 * @returns {void}
 */
function defineReadonlyProperties (obj, props, getter = null) {
    props = typeof props === 'string' ? [props] : props;
    props.forEach(function (prop) {
        let o;
        if (getter && prop in getter) {
            o = getter[prop];
        } else {
            Object.defineProperty(obj, '__' + prop, {
                enumerable: false,
                configurable: false,
                writable: true
            });
            // We must resort to this to get "get <name>" as
            //   the function `name` for proper IDL
            o = {
                get [prop] () {
                    return this['__' + prop];
                }
            };
        }

        const desc = /** @type {PropertyDescriptor} */ (
            Object.getOwnPropertyDescriptor(o, prop)
        );
        // desc.enumerable = true; // Default
        // desc.configurable = true; // Default
        Object.defineProperty(obj, prop, desc);
    });
}

/**
 *
 * @param {string} item
 * @returns {boolean}
 */
function isIdentifier (item) {
    // For load-time and run-time performance, we don't provide the complete regular
    //   expression for identifiers, but these can be passed in, using the expressions
    //   found at https://gist.github.com/brettz9/b4cd6821d990daa023b2e604de371407
    // ID_Start (includes Other_ID_Start)
    const UnicodeIDStart = CFG.UnicodeIDStart || '[$A-Z_a-z]';
    // ID_Continue (includes Other_ID_Continue)
    const UnicodeIDContinue = CFG.UnicodeIDContinue || '[$0-9A-Z_a-z]';
    const IdentifierStart = '(?:' + UnicodeIDStart + '|[$_])';
    const IdentifierPart = '(?:' + UnicodeIDContinue + '|[$_\u200C\u200D])';
    return (new RegExp('^' + IdentifierStart + IdentifierPart + '*$', 'u')).test(item);
}

/**
 *
 * @param {string|string[]} keyPathString
 * @returns {boolean}
 */
function isValidKeyPathString (keyPathString) {
    return typeof keyPathString === 'string' &&
        (keyPathString === '' || isIdentifier(keyPathString) || keyPathString.split('.').every((pathComponent) => {
            return isIdentifier(pathComponent);
        }));
}

/**
 *
 * @param {string|string[]} keyPath
 * @returns {boolean}
 */
function isValidKeyPath (keyPath) {
    return isValidKeyPathString(keyPath) || (
        Array.isArray(keyPath) && Boolean(keyPath.length) &&
            // Convert array from sparse to dense http://www.2ality.com/2012/06/dense-arrays.html
            // See also https://heycam.github.io/webidl/#idl-DOMString
            [...keyPath].every((pathComponent) => {
                return isValidKeyPathString(pathComponent);
            })
    );
}

/**
 * @param {number} number
 * @param {"unsigned long long"|"unsigned long"} type
 * @throws {Error|TypeError}
 * @returns {number}
 */
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
    if (!Number.isFinite(number) ||
        number > max ||
        number < min) {
        throw new TypeError('Invalid range: ' + number);
    }
    return number;
}

/**
 * @typedef {any} AnyValue
 */

/**
 * @param {AnyValue} v
 * @param {boolean} [treatNullAs]
 * @returns {string}
 */
function convertToDOMString (v, treatNullAs) {
    return v === null && treatNullAs ? '' : ToString(v);
}

/**
 * @param {AnyValue} o
 * @returns {string}
 */
function ToString (o) { // Todo: See `es-abstract/es7`
    // `String()` will not throw with Symbols
    return '' + o; // eslint-disable-line no-implicit-coercion
}

/**
 *
 * @param {AnyValue} val
 * @returns {string|string[]}
 */
function convertToSequenceDOMString (val) {
    // Per <https://heycam.github.io/webidl/#idl-sequence>, converting to a sequence works with iterables
    if (isIterable(val)) { // We don't want conversion to array to convert primitives
        // Per <https://heycam.github.io/webidl/#es-DOMString>, converting to a `DOMString` to be via `ToString`: https://tc39.github.io/ecma262/#sec-tostring
        return [...val].map((item) => {
            return ToString(item);
        });
    }
    return ToString(val);
}

/**
 * @param {AnyValue} v
 * @returns {v is null|undefined}
 */
function isNullish (v) {
    return v === null || v === undefined;
}

export {escapeSQLiteStatement, unescapeSQLiteResponse,
    escapeDatabaseNameForSQLAndFiles, unescapeDatabaseNameForSQLAndFiles,
    escapeStoreNameForSQL, escapeIndexNameForSQL, escapeIndexNameForSQLKeyColumn,
    sqlLIKEEscape, sqlQuote,
    instanceOf,
    isObj, isDate, isBlob, isRegExp, isFile, isBinary, isIterable,
    defineOuterInterface, defineReadonlyOuterInterface,
    defineListenerProperties, defineReadonlyProperties,
    isValidKeyPath, enforceRange,
    convertToDOMString, convertToSequenceDOMString,
    isNullish};

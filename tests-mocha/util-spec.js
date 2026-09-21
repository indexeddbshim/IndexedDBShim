import * as util from '../src/util.js';
import CFG from '../src/CFG.js';

describe('unescapeDatabaseNameForSQLAndFiles', () => {
    it('should escape and unescape database name', () => {
        const name = '\u{DC00}abc\u{D800}def\u{DC00}ghi\u{D800}\u{DC00}';
        const escaped = util.escapeDatabaseNameForSQLAndFiles(name);
        expect(escaped).to.equal('D_^3dc00abc^2d800def^3dc00ghi𐀀.sqlite');

        const unescaped = util.unescapeDatabaseNameForSQLAndFiles(
            escaped
        );
        expect(unescaped).to.equal(name + '.sqlite');
    });

    it('should escape and unescape an NFD-expanding character and a reserved character', () => {
        // `é` (U+00E9) expands, under NFD normalization, into `e` plus a
        //   combining acute accent -- exercising the `escapeNFDForDatabaseNames`
        //   path (`^4` escapes). `:` is one of the reserved/control
        //   characters in the default `databaseCharacterEscapeList` (`^1`
        //   escapes). The uppercase `T` and the NUL character exercise
        //   `escapeNameForSQLiteIdentifier`'s own two escapes (a bare `^`
        //   before an uppercase letter, and `^0` for NUL).
        const name = 'Café:Time\0End';
        const escaped = util.escapeDatabaseNameForSQLAndFiles(name);
        expect(escaped).to.include('^4').and.to.include('^1').and.to.include('^0');

        const unescaped = util.unescapeDatabaseNameForSQLAndFiles(escaped);
        expect(unescaped).to.equal(name + '.sqlite');
    });

    it('should round-trip a name whose literal text already looks like one of the escape sequences', () => {
        // Each of these substrings, after the leading `^` in it gets doubled
        //   during escaping, becomes indistinguishable from a real escape
        //   sequence except by the (now even) number of leading carets --
        //   exercising the "this was just literal text" branch of each
        //   escape scheme (NUL, the reserved-character list, NFD expansion,
        //   uppercase letters, and both surrogate forms).
        const name = '^1ab^2d800^3dc00^4000065^T';
        const escaped = util.escapeDatabaseNameForSQLAndFiles(name);
        const unescaped = util.unescapeDatabaseNameForSQLAndFiles(escaped);
        expect(unescaped).to.equal(name + '.sqlite');
    });

    it('should omit the `.sqlite` extension when `addSQLiteExtension` is `false`', () => {
        const original = CFG.addSQLiteExtension;
        try {
            CFG.addSQLiteExtension = false;
            const escaped = util.escapeDatabaseNameForSQLAndFiles('plain');
            expect(escaped).to.not.include('.sqlite');
            expect(util.unescapeDatabaseNameForSQLAndFiles(escaped)).to.equal('plain');
        } finally {
            CFG.addSQLiteExtension = original;
        }
    });

    it('should throw using the natural (unconfigured) length limit and its default in the message', () => {
        // `databaseNameLengthLimit` is falsy by default (whether truly
        //   `undefined` or reset to `0` by some other test), so this name,
        //   without configuring anything, exercises the same `|| 254`
        //   fallback used both in the length check and in this message.
        const veryLongName = 'a'.repeat(300);
        expect(() => {
            util.escapeDatabaseNameForSQLAndFiles(veryLongName);
        }).to.throw(Error, /length limit setting: 254/v);
    });

    it('should leave an even (already-doubled) run of carets before an escaped uppercase letter or NUL untouched', () => {
        // Escaping a real name can never itself *produce* an even run of
        //   carets immediately before one of these markers -- doubling
        //   existing carets always yields an even count, and then exactly
        //   one more is added for the marker itself, so the result is
        //   always odd. An even run only arises from a hand-crafted (or
        //   otherwise not-escaped-by-this-code) string, so these are
        //   exercised directly rather than through a round trip.
        expect(util.unescapeDatabaseNameForSQLAndFiles('D_^^T')).to.equal('^T');
        expect(util.unescapeDatabaseNameForSQLAndFiles('D_^^0')).to.equal('^0');

        // `unescapeSQLiteResponse` only runs its NUL-unescape regex (where
        //   this same even/odd distinction applies) when
        //   `escapeNULForSQLiteStatements` isn't `false` -- this Node
        //   environment's ambient default -- so it must be enabled
        //   explicitly here (see the `escapeSQLiteStatement`/
        //   `unescapeSQLiteResponse` tests below for the same pattern).
        const original = CFG.escapeNULForSQLiteStatements;
        try {
            CFG.escapeNULForSQLiteStatements = true;
            expect(util.unescapeSQLiteResponse('^^0')).to.equal('^0');
        } finally {
            CFG.escapeNULForSQLiteStatements = original;
        }
    });
});

describe('defineListenerProperties', () => {
    it('should accept a single listener name as a bare string', () => {
        const obj = {};
        util.defineListenerProperties(obj, 'onfoo');
        obj.onfoo = function () { /* noop */ };
        expect(obj.onfoo).to.be.a('function');
    });
});

describe('escapeSQLiteStatement/unescapeSQLiteResponse', () => {
    // This Node test environment already defaults `escapeNULForSQLiteStatements`
    //   to `false` (NUL is preserved literally, per better-sqlite3 support),
    //   so both states are set explicitly here rather than relying on
    //   whatever the ambient default happens to be.
    it('should escape and unescape a NUL character when enabled', () => {
        const original = CFG.escapeNULForSQLiteStatements;
        try {
            CFG.escapeNULForSQLiteStatements = true;
            const value = 'a\0b';
            const escaped = util.escapeSQLiteStatement(value);
            expect(escaped).to.equal('a^0b');
            expect(util.unescapeSQLiteResponse(escaped)).to.equal(value);
        } finally {
            CFG.escapeNULForSQLiteStatements = original;
        }
    });

    it('should leave NUL untouched when `escapeNULForSQLiteStatements` is `false`', () => {
        const original = CFG.escapeNULForSQLiteStatements;
        try {
            CFG.escapeNULForSQLiteStatements = false;
            const value = 'a\0b';
            const escaped = util.escapeSQLiteStatement(value);
            expect(escaped).to.equal(value);
            expect(util.unescapeSQLiteResponse(escaped)).to.equal(value);
        } finally {
            CFG.escapeNULForSQLiteStatements = original;
        }
    });
});

describe('escapeDatabaseNameForSQLAndFiles config hooks', () => {
    it('should defer to a custom `escapeDatabaseName`/`unescapeDatabaseName` when configured', () => {
        const originalEscape = CFG.escapeDatabaseName;
        const originalUnescape = CFG.unescapeDatabaseName;
        try {
            CFG.escapeDatabaseName = (db) => 'CUSTOM_' + db;
            CFG.unescapeDatabaseName = (db) => db.replace(/^CUSTOM_/v, '');
            expect(util.escapeDatabaseNameForSQLAndFiles('my-db')).to.equal('CUSTOM_my-db');
            expect(util.unescapeDatabaseNameForSQLAndFiles('CUSTOM_my-db')).to.equal('my-db');
        } finally {
            CFG.escapeDatabaseName = originalEscape;
            CFG.unescapeDatabaseName = originalUnescape;
        }
    });

    it('should throw when the escaped name exceeds `databaseNameLengthLimit`', () => {
        const original = CFG.databaseNameLengthLimit;
        try {
            CFG.databaseNameLengthLimit = 5;
            expect(() => {
                util.escapeDatabaseNameForSQLAndFiles('a-fairly-long-database-name');
            }).to.throw(Error, /length limit/v);
        } finally {
            CFG.databaseNameLengthLimit = original;
        }
    });

    it('should use a custom `databaseCharacterEscapeList` regex when configured', () => {
        const original = CFG.databaseCharacterEscapeList;
        try {
            // Escape lowercase `z` specifically, instead of the default
            //   control-character/reserved-symbol set.
            CFG.databaseCharacterEscapeList = 'z';
            const escaped = util.escapeDatabaseNameForSQLAndFiles('zoo');
            expect(escaped).to.include('^1');
        } finally {
            CFG.databaseCharacterEscapeList = original;
        }
    });
});

describe('joinPath', () => {
    it('should join with a forward slash by default', () => {
        expect(util.joinPath('/a/b', 'c.txt')).to.equal('/a/b/c.txt');
        expect(util.joinPath('/a/b/', 'c.txt')).to.equal('/a/b/c.txt');
    });

    it('should reuse a backslash-only base\'s separator', () => {
        expect(util.joinPath(String.raw`C:\a\b`, 'c.txt')).to.equal(String.raw`C:\a\b\c.txt`);
    });

    it('should return the bare name when there is no base', () => {
        expect(util.joinPath('', 'c.txt')).to.equal('c.txt');
    });
});

describe('isValidKeyPath', () => {
    it('should accept the empty string, identifiers, and dotted paths', () => {
        expect(util.isValidKeyPath('')).to.equal(true);
        expect(util.isValidKeyPath('foo')).to.equal(true);
        expect(util.isValidKeyPath('foo.bar')).to.equal(true);
    });

    it('should accept a non-empty array of valid key path strings', () => {
        expect(util.isValidKeyPath(['foo', 'bar.baz'])).to.equal(true);
    });

    it('should reject an invalid identifier, an empty array, and a mixed-validity array', () => {
        expect(util.isValidKeyPath('1foo')).to.equal(false);
        expect(util.isValidKeyPath([])).to.equal(false);
        expect(util.isValidKeyPath(['foo', '1bar'])).to.equal(false);
    });
});

describe('enforceRange', () => {
    it('should accept in-range values for both recognized types', () => {
        expect(util.enforceRange(5, 'unsigned long')).to.equal(5);
        expect(util.enforceRange(5.9, 'unsigned long long')).to.equal(5);
    });

    it('should throw on an out-of-range or non-finite value', () => {
        expect(() => util.enforceRange(-1, 'unsigned long')).to.throw(TypeError, 'Invalid range');
        expect(() => util.enforceRange(0xFFFFFFFF + 1, 'unsigned long')).to.throw(TypeError, 'Invalid range');
        expect(() => util.enforceRange(Infinity, 'unsigned long')).to.throw(TypeError, 'Invalid range');
    });

    it('should throw on an unrecognized type', () => {
        expect(() => util.enforceRange(5, 'not-a-real-type')).to.throw(Error, 'Unrecognized type supplied to enforceRange');
    });
});

describe('convertToDOMString/convertToSequenceDOMString', () => {
    it('should stringify a value, treating `null` as requested', () => {
        expect(util.convertToDOMString(5)).to.equal('5');
        expect(util.convertToDOMString(null)).to.equal('null');
        expect(util.convertToDOMString(null, true)).to.equal('');
    });

    it('should map an iterable to stringified entries, else stringify directly', () => {
        expect(util.convertToSequenceDOMString([1, 'a', true])).to.deep.equal(['1', 'a', 'true']);
        expect(util.convertToSequenceDOMString(5)).to.equal('5');
    });
});

describe('isIterable/isBinary/isNullish', () => {
    it('should recognize iterable objects, excluding string/number primitives', () => {
        expect(util.isIterable([1, 2])).to.equal(true);
        expect(util.isIterable(new Set([1, 2]))).to.equal(true);
        // `isObj` gates on `typeof obj === 'object'`, so string/number
        //   primitives don't qualify despite being iterable themselves.
        expect(util.isIterable('abc')).to.equal(false);
        expect(util.isIterable({})).to.equal(false);
        expect(util.isIterable(5)).to.equal(false);
    });

    it('should recognize binary sources', () => {
        expect(util.isBinary(new ArrayBuffer(4))).to.equal(true);
        expect(util.isBinary(new Uint8Array(4))).to.equal(true);
        expect(util.isBinary(new DataView(new ArrayBuffer(4)))).to.equal(true);
        expect(util.isBinary({})).to.equal(false);
    });

    it('should recognize only `null`/`undefined` as nullish', () => {
        expect(util.isNullish(null)).to.equal(true);
        expect(util.isNullish(undefined)).to.equal(true);
        expect(util.isNullish(0)).to.equal(false);
        expect(util.isNullish('')).to.equal(false);
    });
});

describe('runContinuationSafely', () => {
    it('should run a lone continuation immediately', () => {
        const order = [];
        util.runContinuationSafely(() => { order.push('a'); });
        expect(order).to.deep.equal(['a']);
    });

    it('should queue a reentrant continuation instead of recursing', () => {
        const order = [];
        util.runContinuationSafely(() => {
            order.push('a');
            // Called while already draining -- must be queued, not run here.
            util.runContinuationSafely(() => { order.push('b'); });
            order.push('a-end');
        });
        expect(order).to.deep.equal(['a', 'a-end', 'b']);
    });

    it('should reset the queue even if a continuation throws', () => {
        expect(() => {
            util.runContinuationSafely(() => {
                throw new Error('boom');
            });
        }).to.throw('boom');
        // A subsequent call must run immediately, not be silently swallowed
        //   by a queue left stuck from the throw above.
        const order = [];
        util.runContinuationSafely(() => { order.push('a'); });
        expect(order).to.deep.equal(['a']);
    });
});

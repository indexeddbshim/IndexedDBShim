import * as util from '../src/util.js';

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

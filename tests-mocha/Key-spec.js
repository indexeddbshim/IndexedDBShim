import * as Key from '../src/Key.js';

describe('Key.convertValueToKey', function () {
    'use strict';

    it('should mark a circular array key as invalid', function () {
        // Passing the array as already-`seen` simulates the recursive case
        //   where an array contains itself: `convertValueToKey` itself always
        //   starts with an empty `seen` list, so nesting the same reference
        //   one level down (e.g. `arr.push(arr)`) surfaces as the generic
        //   "bad array entry" message at the outer level instead of this one.
        const arr = [];
        const result = Key.convertValueToKeyValueDecoded(arr, [arr], false, true);
        expect(result.invalid).to.equal(true);
        expect(result.message).to.equal('An array key cannot be circular');
    });

    it('should mark a sparse array key as invalid', function () {
        const arr = [];
        arr[2] = 'x'; // Indexes 0 and 1 are missing.
        const result = Key.convertValueToKey(arr);
        expect(result.invalid).to.equal(true);
        expect(result.message).to.equal('Does not have own index property');
    });

    it('should mark an array key with a bad entry as invalid', function () {
        const result = Key.convertValueToKey([undefined]);
        expect(result.invalid).to.equal(true);
        expect(result.message).to.equal('Bad array entry value-to-key conversion');
    });

    it('should mark a detached buffer source as invalid', function () {
        const buf = new ArrayBuffer(8);
        structuredClone(buf, {transfer: [buf]}); // Detaches `buf`.
        const result = Key.convertValueToKey(buf);
        expect(result.invalid).to.equal(true);
        expect(result.message).to.equal('Could not read the buffer source (it may be detached)');
    });
});

describe('Key.extractKeyFromValueUsingKeyPath', function () {
    'use strict';

    it('should extract `length` from a string value', function () {
        const result = Key.extractKeyFromValueUsingKeyPath('hello', 'length', false);
        expect(result.value).to.equal(5);
    });

    it('should extract Blob/File-specific properties', function () {
        const file = new File(['hello'], 'test.txt', {lastModified: 12345});
        expect(Key.extractKeyFromValueUsingKeyPath(file, 'name', false).value).to.equal('test.txt');
        expect(Key.extractKeyFromValueUsingKeyPath(file, 'lastModified', false).value).to.equal(12345);
        // `fullKeys` (always `true` via this wrapper) reduces a `Date` key
        //   value down to its timestamp, so this comes back as a number,
        //   not a `Date` instance.
        expect(Key.extractKeyFromValueUsingKeyPath(file, 'lastModifiedDate', false).value).to.equal(12345);

        const blob = new Blob(['hello'], {type: 'text/plain'});
        expect(Key.extractKeyFromValueUsingKeyPath(blob, 'size', false).value).to.equal(5);
        expect(Key.extractKeyFromValueUsingKeyPath(blob, 'type', false).value).to.equal('text/plain');
    });
});

describe('Key.convertValueToMultiEntryKey', function () {
    'use strict';

    it('should convert an array to a deduplicated multi-entry key', () => {
        // Not currently used internally (multi-entry index keys are derived
        //   via `convertValueToMultiEntryKeyDecoded` instead), but kept as
        //   part of the module's exported API.
        const result = Key.convertValueToMultiEntryKey(['a', 'b', 'a']);
        expect(result.type).to.equal('array');
        expect(result.value).to.have.lengthOf(2);
        expect(result.value.map((k) => k.value)).to.deep.equal(['a', 'b']);
    });
});

describe('Key.evaluateKeyPathOnValue', function () {
    'use strict';

    it('should evaluate a key path directly against a value', () => {
        // Not currently used internally (key extraction goes through
        //   `extractKeyFromValueUsingKeyPath` instead), but kept as part of
        //   the module's exported API.
        expect(Key.evaluateKeyPathOnValue({foo: 'bar'}, 'foo', false)).to.deep.equal({value: 'bar'});
    });
});

describe('Key.convertKeyToValue', function () {
    'use strict';

    it('should convert each key type back to its original value', function () {
        expect(Key.convertKeyToValue({type: 'number', value: 5})).to.equal(5);
        expect(Key.convertKeyToValue({type: 'string', value: 'abc'})).to.equal('abc');
        expect(Key.convertKeyToValue({type: 'date', value: 12345})).to.deep.equal(new Date(12345));
        expect(Key.convertKeyToValue({
            type: 'array',
            value: [{type: 'number', value: 1}, {type: 'string', value: 'a'}]
        })).to.deep.equal([1, 'a']);

        const bytes = new Uint8Array([1, 2, 3]);
        const buffer = Key.convertKeyToValue({type: 'binary', value: bytes});
        expect(new Uint8Array(buffer)).to.deep.equal(bytes);
    });

    it('should throw on an unrecognized key type', function () {
        expect(() => {
            Key.convertKeyToValue({type: 'not-a-real-type', value: null});
        }).to.throw(Error, 'Bad key');
    });
});

describe('Key additional coverage', function () {
    'use strict';

    it('should throw "Invalid number." for badly formatted number keys in decode', function () {
        expect(() => {
            const numberPrefix = String.fromCodePoint(200) + '-';
            Key.decode(numberPrefix + '9000000000000', false);
        }).to.throw(Error, 'Invalid number.');
    });

    it('should throw when buffer is undefined', function () {
        const originalIsView = ArrayBuffer.isView;
        ArrayBuffer.isView = () => true;
        try {
            expect(() => {
                Key.encode({ byteLength: 1, slice: () => {} });
            }).to.throw(TypeError, 'Could not copy the bytes held by a buffer source as the buffer was undefined.');
        } finally {
            ArrayBuffer.isView = originalIsView;
        }
    });

    it('should handle zero rows or error in getCurrentNumber via generateKeyForStore', function (done) {
        const tx = {
            executeSql: function (sql, args, success, error) {
                if (sql.includes('SELECT "currNum"')) {
                    success(tx, { rows: { length: 0 } });
                } else if (sql.includes('UPDATE __sys__')) {
                    success(tx);
                }
            }
        };
        const store = { __currentName: 'testStore', autoIncrement: true };
        Key.generateKeyForStore(tx, store, function (err, key) {
            expect(key).to.equal(1);

            const txErr = {
                executeSql: function (sql, args, success, error) {
                    if (sql.includes('SELECT "currNum"')) {
                        error(txErr, new Error('Simulated select error'));
                    }
                }
            };
            Key.generateKeyForStore(txErr, store, function () {}, function (err) {
                expect(err.name).to.equal('DataError');
                expect(err.message).to.equal('Could not get the auto increment value for key');
                done();
            });
        }, function () {});
    });

    it('should handle error in assignCurrentNumber', function (done) {
        const tx = {
            executeSql: function (sql, args, success, error) {
                if (sql.includes('UPDATE __sys__')) {
                    error(tx, new Error('Simulated update error'));
                }
            }
        };
        const store = { __currentName: 'testStore' };
        Key.assignCurrentNumber(tx, store, 5, function () {}, function (err) {
            expect(err.name).to.equal('UnknownError');
            expect(err.message).to.equal('Could not set the auto increment value for key');
            done();
        });
    });
    it('should cover isKeyInRange edge cases for null bounds', function () {
        // Line 866 and 876
        const match = Key.isKeyInRange(
            undefined, 
            { lower: 'defined', upper: 'defined', lowerOpen: false, upperOpen: false, __lowerCached: null, __upperCached: null }, 
            true
        );
        expect(match).to.equal(true); 
    });

    it('should return undefined when decoding non-string', function () {
        // Line 999
        expect(Key.decode(null)).to.equal(undefined);
    });
});

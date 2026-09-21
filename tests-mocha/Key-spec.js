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

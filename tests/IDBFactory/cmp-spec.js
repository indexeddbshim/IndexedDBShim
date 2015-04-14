describe('IDBFactory.cmp', function() {
    'use strict';

    var indexedDB;
    beforeEach(function() {
        indexedDB = env.indexedDB;
    });

    var results = [];
    results[-1] = ', but it was less';
    results[0] = ', but they were equal';
    results[1] = ', but it was greater';

    // Asserts that a is less than b, and that b is less than a
    function compare(a, b) {
        var result = indexedDB.cmp(a, b);
        if (result !== -1) {
            throw new Error('Expected ' + a + ' to be less than ' + b + results[result]);
        }

        result = indexedDB.cmp(b, a);
        if (result !== 1) {
            throw new Error('Expected ' + b + ' to be greater than ' + a + results[result]);
        }
    }

    // Asserts that a equals b, and that b equals a
    function equal(a, b) {
        if (arguments.length === 1) {
            b = a;
        }

        var result = indexedDB.cmp(a, b);
        if (result !== 0) {
            throw new Error('Expected ' + a + ' to equal ' + b + results[result]);
        }

        result = indexedDB.cmp(b, a);
        if (result !== 0) {
            throw new Error('Expected ' + b + ' to equal ' + a + results[result]);
        }
    }

    describe('simple keys', function() {
        it('should compare two numbers', function() {
            compare(1, 2);
            compare(-2, -1);
            compare(-1, 1);
            compare(-1, 0);
            compare(9, 10);
            compare(99, 100);
            compare(100, 999);
            compare(9, 10000);
            compare(-10, -9);
            compare(-100, -99);
            compare(-999, -100);
            compare(-10000, 9);
            compare(-12345, -12344);
            compare(0.12344, 0.12345);
            compare(-0.12345, -0.12344);
            compare(1, 1.0000000000001);
            compare(1.9999999999999, 2);
            compare(0, Infinity);
            compare(-1, Infinity);
            compare(1, Infinity);
            compare(-Infinity, 0);
            compare(-Infinity, 1);
            compare(-Infinity, -1);
            compare(-Infinity, Infinity);
            compare(-Math.PI, Math.PI);
            compare(-Number.MAX_VALUE, Number.MAX_VALUE);
            compare(-Number.MIN_VALUE, 0);
            compare(0, Number.MIN_VALUE);
            compare(0, Number.MIN_VALUE);

            equal(1);
            equal(0);
            equal(-1);
            equal(-0);
            equal(+0);
            equal(-0, 0);
            equal(+0, -0);
            equal(0.0000000000001);
            equal(9999999999999.9999999999999);
            equal(Infinity);
            equal(-Infinity);
            equal(Math.PI);
            equal(-Math.PI);
            equal(Number.MIN_VALUE);
            equal(-Number.MIN_VALUE);
            equal(Number.MAX_VALUE);
            equal(-Number.MAX_VALUE);
        });

        it('should compare two strings', function() {
            compare('', ' ');
            compare('a', 'b');
            compare('A', 'a');
            compare('Z', 'a');
            compare('a', 'z');
            compare('0', '9');
            compare('0', 'a');
            compare('0', 'A');
            compare('9', 'A');
            compare(' ', '0');
            compare('-', '0');
            compare('+', '0');
            compare('.', '0');
            compare('#', '0');
            compare('0', '_');
            compare('A', '_');
            compare('Z', '_');
            compare('@', '_');
            compare('_', 'a');
            compare('"', '\'');
            compare('goodbye', 'hello');
            compare('aaaaaaA', 'aaaaaaa');
            compare('ZZZZZZa', 'aaaaaaa');
            compare('Zxyz', 'aXYZ');
            compare('123aBc', 'aBc123');
            compare('~!@#$%^&*()_+`-={ }|[]\\:"\';<>?,./a', '~!@#$%^&*()_+`-={ }|[]\\:"\';<>?,./b');

            equal('');
            equal(' ');
            equal('a');
            equal('z');
            equal('A');
            equal('Z');
            equal('0');
            equal('_');
            equal('@');
            equal('hello, world');
            equal('123aBc');
            equal('~!@#$%^&*()_+`-={}|[]\\:"\';<>?,./');
        });

        it('should compare two dates', function() {
            compare(new Date(0), new Date(1));
            compare(new Date(0), new Date());
            compare(new Date(12345), new Date(12346));
            compare(new Date('1999-12-31T23:59:59Z'), new Date('2000-01-01T00:00:00Z'));
            compare(new Date('2000-01-01T00:00:00.000Z'), new Date('2000-01-01T00:00:00.001Z'));
            compare(new Date(), new Date('9999-12-31T23:59:59.999Z'));

            try {
                compare(new Date(-12345), new Date(-12344));
            }
            catch (e) {
                // Some browsers throw an error when creating a date with a negative number
            }

            equal(new Date());
            equal(new Date(0));
            equal(new Date('2000-01-01T00:00:00.000Z'));
        });

        it('should compare different data types', function() {
            if (env.isShimmed || !env.browser.isIE) {
                // IE doesn't support array keys
                // arrays are greater than strings, numbers, and dates
                compare('', []);
                compare('abc', []);
                compare('ZZZ', []);
                compare(0, []);
                compare(999999, []);
                compare(new Date(), []);
                compare(new Date(0), []);
                compare(new Date('9999-12-31T23:59:59.999Z'), []);
            }

            // strings are greater than numbers and dates
            compare(0, '');
            compare(-1, '');
            compare(new Date(), '');

            try {
                compare(new Date(-9999), '');
            }
            catch (e) {
                // Some browsers throw an error when creating a date with a negative number
            }

            // dates are greater than numbers
            compare(0, new Date());
            compare(-999, new Date());
            compare(2000, new Date('9999-12-31T23:59:59.999Z'));
        });
    });

    describe('compound keys', function() {
        it('should compare numeric arrays', function() {
            if (env.isNative && env.browser.isIE) {
                // BUG: IE's native IndexedDB does not support compound keys at all
                console.error('Skipping test: ' + this.test.title);
                return;
            }

            compare([], [0]);
            compare([0], [1]);
            compare([-1], [0]);
            compare([-0.00000000001], [0]);
            compare([0.99999999999999], [1]);
            compare([0], [0,0]);
            compare([0,0], [1]);
            compare([-1], [0,0]);
            compare([1,2,3,4,5], [1,2,3,4,5,0]);
            compare([1,1,1,1,0], [1,1,1,1,1]);

            equal([]);
            equal([], []);
            equal([0], [0]);
            equal([0,0,0,0,0], [0,0,0,0,0]);
            equal([1,2,3,4,5], [1,2,3,4,5]);
        });

        it('should compare string arrays', function() {
            if (env.isNative && env.browser.isIE) {
                // BUG: IE's native IndexedDB does not support compound keys at all
                console.error('Skipping test: ' + this.test.title);
                return;
            }

            compare([], ['']);
            compare([''], [' ']);
            compare([''], ['0']);
            compare(['Z'], ['a']);
            compare([''], ['a']);
            compare(['',''], ['a']);
            compare(['a','b','c','d'], ['a','b','c','d','']);
            compare(['a','a','a',''], ['a','a','a','a']);

            equal(['']);
            equal([''], ['']);
            equal([' '], [' ']);
            equal(['a','b','c'], ['a','b','c']);
        });

        it('should compare nested arrays', function() {
            if (env.isNative && env.browser.isIE) {
                // BUG: IE's native IndexedDB does not support compound keys at all
                console.error('Skipping test: ' + this.test.title);
                return;
            }

            compare([], [[]]);
            compare([[]], [[],[]]);
            compare([[[]]], [[[[]]]]);
            compare([0,[1],[2,[3]]], [1]);
            compare([0,[1],[2,[3]]], [1,[0],[0,[0]]]);
            compare([1,[2],[3,[4]]], [1,[2],[3,[4],[]]]);
            compare([[],[[],[1]]], [[],[[0],[]]]);

            equal([[[[]]]]);
            equal([[[[]]]], [[[[]]]]);
            equal(['a',['b'],['c',['d']]], ['a',['b'],['c',['d']]]);
            equal([[[['a'],'b'],'c']], [[[['a'],'b'],'c']]);
        });
    });

    describe('failure tests', function() {
        it('should not allow these keys', function() {
            tryToCompare(undefined);                        // undefined
            tryToCompare(NaN);                              // NaN
            tryToCompare(true);                             // boolean
            tryToCompare(false);                            // boolean
            tryToCompare({});                               // empty object
            tryToCompare({foo: 'bar'});                     // object
            tryToCompare(new util.Person('John'));          // Class
            tryToCompare([1, undefined, 2]);                // array with undefined
            tryToCompare([1, null, 2]);                     // array with null
            tryToCompare([true, false]);                    // array of booleans
            tryToCompare([{foo: 'bar'}]);                   // array of objects
            tryToCompare(new Boolean(true));                // jshint ignore:line
            tryToCompare(new Object());                     // jshint ignore:line

            if (env.isShimmed || !env.browser.isIE) {
                tryToCompare(null);                         // null
                tryToCompare(new Number(12345));            // jshint ignore:line
                tryToCompare(new String('hello world'));    // jshint ignore:line
                tryToCompare(new Date(''));                 // invalid date
                tryToCompare(new RegExp("asdf"));           // RegExp object
                tryToCompare(/asdf/);                       // RegExp literal
            }

            function tryToCompare(x) {
                var err;
                try {
                    indexedDB.cmp(1, x);
                }
                catch (e) {
                    err = e;
                }

                expect(err).to.be.an.instanceOf(env.DOMException);
                expect(err.name).to.equal('DataError');
            }
        });

        it('should throw an error if called without params', function() {
            var err;
            try {
                indexedDB.cmp();
            }
            catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.name).to.equal('TypeError');
        });

        it('should throw an error if called with only one param', function() {
            var err;
            try {
                indexedDB.cmp(1);
            }
            catch (e) {
                err = e;
            }

            expect(err).to.be.an.instanceOf(TypeError);
            expect(err.name).to.equal('TypeError');
        });
    });
});

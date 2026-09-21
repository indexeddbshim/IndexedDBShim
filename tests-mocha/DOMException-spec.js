import {QuotaExceededError} from 'typeson-registry/polyfills';
import {webSQLErrback, findError} from '../src/DOMException.js';

describe('findError', function () {
    'use strict';

    it('should return the sole argument when there is only one', () => {
        const err = new Error('x');
        expect(findError([err])).to.equal(err);
    });

    it('should find an Error/DOMException-like argument by its `name`', () => {
        const notErrLike = {message: 'plain message-like'};
        const errLike = {name: 'SomeError'};
        expect(findError([notErrLike, errLike])).to.equal(errLike);
    });

    it('should fall back to a message-like argument when nothing name-like is found', () => {
        const messageLike = {message: 'just a message'};
        expect(findError([{}, messageLike])).to.equal(messageLike);
    });

    it('should return undefined when nothing usable is found', () => {
        expect(findError([])).to.be.undefined;
        expect(findError(null)).to.be.undefined;
    });
});

describe('webSQLErrback', function () {
    'use strict';

    let originalQuotaExceededError;
    before(function () {
        originalQuotaExceededError = global.QuotaExceededError;
        global.QuotaExceededError = QuotaExceededError;
    });
    after(function () {
        global.QuotaExceededError = originalQuotaExceededError;
    });

    it('should return a `QuotaExceededError` when a global `QuotaExceededError` is present and a WebSQL `QUOTA_ERR` (code 4) is passed', function () {
        const err = webSQLErrback({code: 4, message: 'db is full'});
        expect(err).to.be.instanceOf(QuotaExceededError);
        expect(err.name).to.equal('QuotaExceededError');
        expect(err.message).to.contain('db is full').and.to.contain('(4)');
    });

    it('should return an `UnknownError` for an unrecognized WebSQL error code', function () {
        const err = webSQLErrback({code: 999, message: 'something odd'});
        expect(err.name).to.equal('UnknownError');
        expect(err.message).to.contain('something odd').and.to.contain('(999)');
    });
});

describe('non-native DOMException fallback', function () {
    'use strict';

    it('should provide a working `DOMException` constructor when no native one is present', async function () {
        // Node (like every real browser) has a working native `DOMException`,
        //   so `DOMException.js`'s own module-load-time feature test always
        //   picks that path, leaving its from-scratch polyfill constructor
        //   -- meant for environments with no native `DOMException` at all --
        //   never actually exercised. Hiding the native global before a
        //   fresh, isolated import (cache-busting query string, so this
        //   doesn't disturb the shared module the rest of the shim is using)
        //   forces that module evaluation down the polyfill path instead.
        const originalDOMException = DOMException;
        delete globalThis.DOMException;
        let mod;
        try {
            mod = await import('../src/DOMException.js?isolated-no-native-domexception-test');
        } finally {
            globalThis.DOMException = originalDOMException;
        }

        const err = new mod.ShimDOMException('a message', 'NotFoundError');
        expect(err.name).to.equal('NotFoundError');
        expect(err.message).to.equal('a message');
        expect(err.code).to.equal(8); // NotFoundError's legacy numeric code.
        expect(err).to.be.instanceOf(Error);
        expect(err.toString()).to.equal('NotFoundError: a message');

        const created = mod.createDOMException('NotFoundError', 'another message');
        expect(created.name).to.equal('NotFoundError');
        expect(created.message).to.equal('another message');

        // `name`/`message`/`code` are actually defined one level up the
        //   prototype chain, on `DummyDOMException.prototype` -- since
        //   `DOMException.prototype` itself is an *instance* of
        //   `DummyDOMException`, not that prototype object. Calling their
        //   getters on a plain, non-instance object must throw per WebIDL.
        const dummyProto = Object.getPrototypeOf(mod.ShimDOMException.prototype);
        ['name', 'message'].forEach((prop) => {
            const {get} = Object.getOwnPropertyDescriptor(dummyProto, prop);
            expect(() => {
                get.call({});
            }, prop).to.throw(TypeError, 'Illegal invocation');
        });
        const {get: getCode} = Object.getOwnPropertyDescriptor(dummyProto, 'code');
        expect(() => {
            getCode.call({});
        }).to.throw(TypeError, 'Illegal invocation');

        // The constructor defines `name`/`message` as *own* properties on
        //   the instance whenever an argument is actually passed for them,
        //   shadowing these very getters -- so exercising the getters
        //   themselves (rather than just the plain property read) requires
        //   an instance built with both arguments omitted.
        const bare = new mod.ShimDOMException();
        const {get: getName} = Object.getOwnPropertyDescriptor(dummyProto, 'name');
        expect(getName.call(bare)).to.equal('Error');
        const {get: getMessage} = Object.getOwnPropertyDescriptor(dummyProto, 'message');
        expect(getMessage.call(bare)).to.equal('');
    });
});

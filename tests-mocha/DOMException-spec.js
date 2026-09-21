import {QuotaExceededError} from 'typeson-registry/polyfills';
import {webSQLErrback} from '../src/DOMException.js';

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
    });
});

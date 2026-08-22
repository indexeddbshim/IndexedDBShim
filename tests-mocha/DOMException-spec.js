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
});

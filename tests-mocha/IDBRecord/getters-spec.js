import {IDBRecord} from '../../src/IDBRecord.js';

describe('IDBRecord', function () {
    'use strict';

    it('should throw "Illegal invocation" when a getter is called on a non-instance', function () {
        ['key', 'primaryKey', 'value'].forEach((prop) => {
            const {get} = Object.getOwnPropertyDescriptor(IDBRecord.prototype, prop);
            expect(() => {
                get.call(IDBRecord.prototype);
            }).to.throw(TypeError, 'Illegal invocation');
            expect(() => {
                get.call({});
            }).to.throw(TypeError, 'Illegal invocation');
        });
    });

    it('should return the underlying values on a real instance', function () {
        const record = IDBRecord.__createInstance('k', 'pk', 'v');
        expect(record.key).to.equal('k');
        expect(record.primaryKey).to.equal('pk');
        expect(record.value).to.equal('v');
    });
});

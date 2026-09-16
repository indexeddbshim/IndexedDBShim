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

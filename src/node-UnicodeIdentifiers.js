import fs from 'node:fs';

import setGlobalVars from './setGlobalVars.js';
import nodeWebSQL from './nodeWebSQL.js'; // Importing "websql" would not gain us SQLite config ability
import CFG from './CFG.js';
import * as UnicodeIdentifiers from './UnicodeIdentifiers.js';

CFG.win = {openDatabase: nodeWebSQL};

/**
 * @param {typeof globalThis | Record<string, unknown>} [idb]
 * @param {Partial<import('./CFG.js').ConfigValues>} [initialConfig]
 * @returns {import('./setGlobalVars.js').ShimmedObject|Window}
 */
const __setGlobalVars = function (idb, initialConfig = {}) {
    const obj = setGlobalVars(idb, {
        fs,
        escapeNULForSQLiteStatements: false,
        ...initialConfig
    });
    /* c8 ignore start -- TS guard */
    if (!obj.shimIndexedDB) {
        return obj;
    }
    /* c8 ignore stop -- TS guard */
    obj.shimIndexedDB.__setUnicodeIdentifiers(UnicodeIdentifiers);

    return obj;
};

export default __setGlobalVars;

import fs from 'node:fs';

import setGlobalVars from './setGlobalVars.js';
import nodeWebSQL from './nodeWebSQL.js'; // Importing "websql" would not gain us SQLite config ability
import CFG from './CFG.js';

CFG.win = {openDatabase: nodeWebSQL};

/**
 * @param {typeof globalThis | Record<string, unknown>} [idb]
 * @param {Partial<import('./CFG.js').ConfigValues>} [initialConfig]
 * @returns {import('./setGlobalVars.js').ShimmedObject|Window}
 */
const __setGlobalVars = function (idb, initialConfig = {}) {
    return setGlobalVars(idb, {
        fs,
        escapeNULForSQLiteStatements: false,
        ...initialConfig
    });
};

export default __setGlobalVars;

import fs from 'node:fs';

import setGlobalVars from './setGlobalVars.js';
import nodeWebSQL from './nodeWebSQL.js'; // Importing "websql" would not gain us SQLite config ability
import CFG from './CFG.js';
import * as UnicodeIdentifiers from './UnicodeIdentifiers.js';

CFG.win = {openDatabase: nodeWebSQL};

/**
 * @param {import('./setGlobalVars.js').ShimmedObject} idb
 * @param {import('./CFG.js').default} initialConfig
 * @returns {import('./setGlobalVars.js').ShimmedObject|Window}
 */
const __setGlobalVars = function (idb, initialConfig = {}) {
    const obj = setGlobalVars(idb, {fs, ...initialConfig});
    /* istanbul ignore next -- TS guard */
    if (!obj.shimIndexedDB) {
        return obj;
    }
    obj.shimIndexedDB.__setUnicodeIdentifiers(UnicodeIdentifiers);

    return obj;
};

export default __setGlobalVars;

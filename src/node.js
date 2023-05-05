import fs from 'node:fs';

import setGlobalVars from './setGlobalVars.js';
import nodeWebSQL from './nodeWebSQL.js'; // Importing "websql" would not gain us SQLite config ability
import CFG from './CFG.js';

CFG.win = {openDatabase: nodeWebSQL};

/**
 * @param {null|{}|Window} idb
 * @param {import('./CFG.js').CFG} initialConfig
 * @returns {{}|Window}
 */
const __setGlobalVars = function (idb, initialConfig = {}) {
    return setGlobalVars(idb, {fs, ...initialConfig});
};

export default __setGlobalVars;

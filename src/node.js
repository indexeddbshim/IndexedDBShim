import setGlobalVars from './setGlobalVars.js';
import nodeWebSQL from './nodeWebSQL.js'; // Importing "websql" would not gain us SQLite config ability
import CFG from './CFG.js';

// eslint-disable-next-line import/no-commonjs
const fs = require('fs');

CFG.win = {openDatabase: nodeWebSQL};

const __setGlobalVars = function (idb, initialConfig = {}) {
    return setGlobalVars(idb, {fs, ...initialConfig});
};

export default __setGlobalVars;

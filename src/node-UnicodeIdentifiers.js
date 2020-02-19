import setGlobalVars from './setGlobalVars.js';
import nodeWebSQL from './nodeWebSQL.js'; // Importing "websql" would not gain us SQLite config ability
import CFG from './CFG.js';
import * as UnicodeIdentifiers from './UnicodeIdentifiers.js';

CFG.win = {openDatabase: nodeWebSQL};

const __setGlobalVars = function (idb, initialConfig) {
    const obj = setGlobalVars(idb, initialConfig);
    obj.shimIndexedDB.__setUnicodeIdentifiers(UnicodeIdentifiers);
    return obj;
};

export default __setGlobalVars;

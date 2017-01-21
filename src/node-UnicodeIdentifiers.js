import setGlobalVars from './setGlobalVars.js';
import nodeWebSQL from './nodeWebSQL'; // Importing "websql" would not gain us SQLite config ability
import CFG from './CFG.js';
import * as UnicodeIdentifiers from './UnicodeIdentifiers';

CFG.win = {openDatabase: nodeWebSQL};

const __setGlobalVars = function (idb, initialConfig) {
    idb = setGlobalVars(idb, initialConfig);
    idb.shimIndexedDB.__setUnicodeIdentifiers(UnicodeIdentifiers);
};

export default __setGlobalVars;

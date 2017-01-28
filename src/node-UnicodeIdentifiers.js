import setGlobalVars from './setGlobalVars';
import nodeWebSQL from './nodeWebSQL'; // Importing "websql" would not gain us SQLite config ability
import CFG from './CFG';
import * as UnicodeIdentifiers from './UnicodeIdentifiers';

CFG.win = {openDatabase: nodeWebSQL};

const __setGlobalVars = function (idb, initialConfig) {
    const obj = setGlobalVars(idb, initialConfig);
    obj.shimIndexedDB.__setUnicodeIdentifiers(UnicodeIdentifiers);
    return obj;
};

export default __setGlobalVars;

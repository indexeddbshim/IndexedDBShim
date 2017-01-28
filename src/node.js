import setGlobalVars from './setGlobalVars';
import nodeWebSQL from './nodeWebSQL'; // Importing "websql" would not gain us SQLite config ability
import CFG from './CFG';

CFG.win = {openDatabase: nodeWebSQL};

export default setGlobalVars;

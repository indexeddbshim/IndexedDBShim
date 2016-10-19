/* globals GLOBAL */

import nodeWebsql from 'websql';
import setGlobalVars from './setGlobalVars.js';
import CFG from './CFG.js';

CFG.win = {openDatabase: nodeWebsql};

export default setGlobalVars;

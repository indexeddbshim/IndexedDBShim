/*globals GLOBAL*/

import nodeWebsql from 'websql';
import setGlobalVars from './setGlobalVars.js';
import CFG from './cfg.js';

CFG.win = {openDatabase: nodeWebsql};

export default setGlobalVars;

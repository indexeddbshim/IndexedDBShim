/*globals GLOBAL*/

import nodeWebsql from 'websql';
import shimAll from './globalVars.js';
import CFG from './cfg.js';

CFG.openDatabase = nodeWebsql;
CFG.IDB = GLOBAL;

export default shimAll;

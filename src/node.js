/*globals GLOBAL*/

import nodeWebsql from 'websql';
import shimAll from './globalVars.js';

GLOBAL.window = GLOBAL;
window.openDatabase = nodeWebsql;

export default shimAll;

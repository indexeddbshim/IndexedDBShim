/* globals GLOBAL, shimIndexedDB */
import * as UnicodeIdentifiers from './UnicodeIdentifiers';

// BEGIN: Same code as in node.js
import nodeWebsql from 'websql';
import setGlobalVars from './setGlobalVars.js';
import CFG from './cfg.js';

CFG.win = {openDatabase: nodeWebsql};
// END: Same code as in node.js

const __setGlobalVars = function () {
    setGlobalVars();
    shimIndexedDB.__setUnicodeIdentifiers(UnicodeIdentifiers);
};

export default __setGlobalVars;

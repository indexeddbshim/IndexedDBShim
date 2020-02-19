/* eslint-env browser, worker */
import {UnicodeIDStart, UnicodeIDContinue} from './UnicodeIdentifiers.js';

// BEGIN: Same code as in browser.js
import setGlobalVars from './setGlobalVars.js';
import CFG from './CFG.js';

CFG.win = typeof window !== 'undefined' ? window : self; // For Web Workers
// END: Same code as in browser.js

CFG.UnicodeIDStart = UnicodeIDStart;
CFG.UnicodeIDContinue = UnicodeIDContinue;

export default setGlobalVars;

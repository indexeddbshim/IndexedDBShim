/* eslint-env browser, worker */
import './babel-polyfill-before';
import {UnicodeIDStart, UnicodeIDContinue} from './UnicodeIdentifiers';

// BEGIN: Same code as in browser.js
import setGlobalVars from './setGlobalVars';
import CFG from './CFG';

CFG.win = typeof window !== 'undefined' ? window : self; // For Web Workers
// END: Same code as in browser.js

CFG.UnicodeIDStart = UnicodeIDStart;
CFG.UnicodeIDContinue = UnicodeIDContinue;

export default setGlobalVars;

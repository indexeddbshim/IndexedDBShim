/* eslint-env browser, worker */
import setGlobalVars from './setGlobalVars.js';
import CFG from './CFG.js';

CFG.win = typeof window !== 'undefined' ? window : self; // For Web Workers
setGlobalVars();

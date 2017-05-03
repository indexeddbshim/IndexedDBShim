/* eslint-env browser, worker */
import './babel-polyfill-before';
import setGlobalVars from './setGlobalVars';
import CFG from './CFG';

CFG.win = typeof window !== 'undefined' ? window : self; // For Web Workers
setGlobalVars();

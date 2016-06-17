import setGlobalVars from './setGlobalVars.js';
import CFG from './cfg.js';

CFG.win = typeof window !== 'undefined' ? window : self; // For Web Workers

setGlobalVars();

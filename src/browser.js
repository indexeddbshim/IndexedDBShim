import setGlobalVars from './setGlobalVars.js';
import CFG from './CFG.js';

CFG.win = /** @type {import('./CFG.js').ConfigValues['win']} */ (
    /** @type {unknown} */ (typeof window !== 'undefined' ? window : self)
); // For Web Workers
setGlobalVars();

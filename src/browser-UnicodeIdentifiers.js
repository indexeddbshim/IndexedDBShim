/* eslint-env browser, worker */
/* global shimIndexedDB */
import * as UnicodeIdentifiers from './UnicodeIdentifiers.js';

// BEGIN: Same code as in browser.js
import setGlobalVars from './setGlobalVars.js';
import CFG from './CFG.js';

CFG.win = typeof window !== 'undefined' ? window : self; // For Web Workers

setGlobalVars();
// END: Same code as in browser.js

const __setUnicodeIdentifiers = shimIndexedDB.__setUnicodeIdentifiers.bind(
    shimIndexedDB
);
shimIndexedDB.__setUnicodeIdentifiers = function () {
    __setUnicodeIdentifiers(UnicodeIdentifiers);
};

shimIndexedDB.__setUnicodeIdentifiers();

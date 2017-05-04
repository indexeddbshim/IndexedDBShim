/* eslint-env browser, worker */
/* global shimIndexedDB */
import 'babel-polyfill'; // `Object.assign` including within `EventTarget`, generator functions, `Array.from`, etc.; see https://babeljs.io/docs/usage/polyfill/
import * as UnicodeIdentifiers from './UnicodeIdentifiers';

// BEGIN: Same code as in browser.js
import setGlobalVars from './setGlobalVars';
import CFG from './CFG';

CFG.win = typeof window !== 'undefined' ? window : self; // For Web Workers

setGlobalVars();
// END: Same code as in browser.js

const __setUnicodeIdentifiers = shimIndexedDB.__setUnicodeIdentifiers.bind(shimIndexedDB);
shimIndexedDB.__setUnicodeIdentifiers = function () {
    __setUnicodeIdentifiers(UnicodeIdentifiers);
};

shimIndexedDB.__setUnicodeIdentifiers();

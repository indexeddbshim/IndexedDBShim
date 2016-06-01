import shimAll from './globalVars.js';
import CFG from './cfg.js';

CFG.openDatabase = window.openDatabase;

shimAll();

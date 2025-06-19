import gb from './node-good-bad-files.js';

console.log(
    'Chrome',
    Object.values(gb.browser.chrome).flat().filter((f) => gb.goodFiles.includes(f.replace(/\.html?$/v, '.js')))
);
console.log(
    'Safari',
    Object.values(gb.browser.safari).flat().filter((f) => gb.goodFiles.includes(f.replace(/\.html?$/v, '.js')))
);

const gb = require('../test-support/node-good-bad-files');

console.log(
    'Chrome',
    [].concat(...Object.values(gb.browser.chrome)).filter((f) => gb.goodFiles.includes(f.replace(/\.html?$/u, '.js')))
);
console.log(
    'Safari',
    [].concat(...Object.values(gb.browser.safari)).filter((f) => gb.goodFiles.includes(f.replace(/\.html?$/u, '.js')))
);

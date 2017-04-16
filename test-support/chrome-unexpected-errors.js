const gb = require('../test-support/node-good-bad-files');

console.log(
    [].concat(...Object.values(gb.browser.chrome)).filter((f) => gb.goodFiles.includes(f.replace(/\.html?$/, '.js')))
);

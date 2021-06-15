const fs = require('fs');
const util = require('util');
const {join} = require('path');
const goodBad = require('./node-good-bad-files.js');

(async () => {
    const readdir = util.promisify(fs.readdir);
    let alreadyListedFiles = [];
    Object.entries(goodBad).forEach(([key, arr]) => {
        alreadyListedFiles = alreadyListedFiles.concat(arr);
    });
    const files = (await readdir(join(__dirname, 'js'))).filter((file) => {
        return !alreadyListedFiles.includes(file);
    });
    console.log('files', files);
})();

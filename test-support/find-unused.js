import {readdir} from 'node:fs/promises';
import {join} from 'node:path';

import goodBad from './node-good-bad-files.js';

const __dirname = import.meta.dirname;

let alreadyListedFiles = [];
Object.values(goodBad).forEach((arr) => {
    // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- CLI file only
    alreadyListedFiles = alreadyListedFiles.concat(arr);
});
const files = (await readdir(join(__dirname, 'js'))).filter((file) => {
    return !alreadyListedFiles.includes(file) && file !== '.DS_Store';
});
console.log('files', files);

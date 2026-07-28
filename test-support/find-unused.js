import {readdir} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import goodBad from './node-good-bad-files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let alreadyListedFiles = [];
Object.values(goodBad).forEach((arr) => {
    // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- CLI file only
    alreadyListedFiles = alreadyListedFiles.concat(arr);
});
const files = (await readdir(join(__dirname, 'js'))).filter((file) => {
    return !alreadyListedFiles.includes(file) && file !== '.DS_Store';
});
console.log('files', files);

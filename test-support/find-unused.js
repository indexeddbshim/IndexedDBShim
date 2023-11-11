import {readdir} from 'node:fs/promises';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

import goodBad from './node-good-bad-files.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let alreadyListedFiles = [];
Object.entries(goodBad).forEach(([, arr]) => {
    alreadyListedFiles = alreadyListedFiles.concat(arr);
});
const files = (await readdir(join(__dirname, 'js'))).filter((file) => {
    return !alreadyListedFiles.includes(file) && file !== '.DS_Store';
});
console.log('files', files);

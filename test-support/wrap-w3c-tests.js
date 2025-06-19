/* eslint-disable n/no-sync -- CLI */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fetch from 'isomorphic-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const indexedDBDir = path.join(__dirname, '../web-platform-tests/IndexedDB/');
const loaderFile = '_indexeddbshim-loader.html';
const shimLoaderPath = path.join(indexedDBDir, loaderFile);

if (process.argv[2] === 'remove') {
    // fs.unlinkSync(shimLoaderPath);
    fs.readdir(indexedDBDir, (err, files) => {
        if (err) {
            console.log('err', err);
            return;
        }
        const anyJSFiles = files.filter((f) => (/\.html?\.any\.js$/u).test(f));
        anyJSFiles.forEach((anyJS) => {
            const anyJSPath = path.join(indexedDBDir, anyJS);
            fs.unlinkSync(anyJSPath);
        });
    });
} else if (process.argv[2] === 'add') {
    fs.writeFileSync(shimLoaderPath,
        `<!DOCTYPE html>
<meta charset="utf-8" />
<link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon" />
<script src="http://127.0.0.1:9999/dist/indexeddbshim-noninvasive.min.js"></script>
`);

    fs.readdir(indexedDBDir, (err, files) => {
        if (err) {
            console.log('err', err);
            return;
        }

        const htmlFiles = files.filter((f) => (/\.html?$/u).test(f) && !(/indexeddbshim-loader\.html$/u).test(f));
        htmlFiles.forEach((htmlFile) => {
            const anyJS = /* '_' + */ htmlFile + '.any.js';
            const anyJSPath = path.join(indexedDBDir, anyJS);
            if (fs.existsSync(anyJSPath)) {
                console.log('file already exists, overwriting ' + anyJS);
                // return;
            }
            const content = `
function createIframe (src, w) {
    // Ensure page can allow iframe height to be set to fill page
    w.document.documentElement.style.height = '98.5%';
    w.document.body.style.height = '98.5%';

    var ifr = w.document.createElement('iframe');
    ifr.src = src;
    ifr.style.width = '100%';
    ifr.style.height = '100%';
    ifr.style.border = 'none';
    w.document.body.appendChild(ifr);
    return ifr;
}
var ifr = createIframe('${loaderFile}', window);

// Avoid extra scrollbars: http://stackoverflow.com/a/15494969/271577
ifr.style.overflow = 'hidden';
ifr.setAttribute('scrolling', 'no');

var loaderWin = ifr.contentWindow;
loaderWin.addEventListener('DOMContentLoaded', function () {
    var ifr = createIframe('${htmlFile.replaceAll('\'', String.raw`\'`)}', loaderWin);
    var testWin = ifr.contentWindow;

    var style = document.createElement('style');
    style.textContent = '#log {display: none;}'; // Avoid extra display of log; another way?
    document.head.appendChild(style);

    ['Date', 'Array'].forEach(function (prop) { // For instanceof checks expecting those in test to match those in IndexedDBShim
        testWin[prop] = loaderWin[prop];
    });

    // Override to better ensure transaction has expired
    const _setTimeout = testWin.setTimeout;
    testWin.setTimeout = function (cb, ms) {
        return _setTimeout(cb, ms + 500);
    };

    loaderWin.setGlobalVars(testWin, {
        fullIDLSupport: true,
        replaceNonIDBGlobals: true,
        useSQLiteIndexes: true
    });
    testWin.shimIndexedDB.__useShim();
    /*
    // We can adapt this to apply source maps once we may get sourcemap-transformer working in the browser
    testWin.addEventListener('DOMContentLoaded', function () {
        testWin.add_completion_callback(function () {
            var pres = Array.from(testWin.document.querySelectorAll('pre'));
            pres.forEach(function (pre) {
                loaderWin.console.log(pre.textContent);
            });
        });
    });
    */
});
`;

            fs.writeFileSync(anyJSPath, content);
        });
    });
} else {
    fs.readdir(indexedDBDir, (err, files) => {
        if (err) {
            console.log('err', err);
            return;
        }

        const htmlFiles = files.filter((f) => (/\.html?$/u).test(f));
        const polyfillScript = `
<script src="http://127.0.0.1:9999/dist/indexeddbshim-noninvasive.js"></script>
<script>
    'use strict';
    // Override to better ensure transaction has expired
    const _setTimeout = setTimeout;
    setTimeout = function () {
        arguments[1] = (arguments[1] || 0) + 500;
        return _setTimeout.apply(window, arguments);
    };
    setGlobalVars(null, {
        fullIDLSupport: true,
        replaceNonIDBGlobals: true,
        useSQLiteIndexes: true
    });
    shimIndexedDB.__useShim();
</script>
`;
        /*
        // We can adapt this to apply source maps once we may get sourcemap-transformer working in the browser
        window.addEventListener('DOMContentLoaded', function () {
            add_completion_callback(function () {
                var pres = Array.from(document.querySelectorAll('pre'));
                pres.forEach(function (pre) {
                    loaderWin.console.log(pre.textContent);
                });
            });
        });
        */

        const replace = (htmlPath, fileContents, append) => {
            fs.writeFileSync(
                append ? htmlPath.replace(/.html?$/, '2$&') : htmlPath,
                String(fileContents)
                    .replace(polyfillScript, '') // Replace any preexisting polyfill tag
                    .replace(/<script/u, polyfillScript + '$&')
            );
        };
        htmlFiles.forEach((htmlFile) => {
            // Could add these too to avoid warnings
            // <meta charset="utf-8" />
            // <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon" />
            const htmlPath = path.join(indexedDBDir, htmlFile);
            const fileContents = fs.readFileSync(htmlPath);
            replace(htmlPath, fileContents);
        });
        // Dynamic HTML
        [
            'get-databases.any.html',
            'get-databases.any.worker.html',
            'idb-explicit-commit-throw.any.html',
            'idb-explicit-commit-throw.any.worker.html',
            'idb-explicit-commit.any.html',
            'idb-explicit-commit.any.worker.html',
            'idlharness.any.html',
            'idlharness.any.worker.html',
            'idlharness.any.serviceworker.html',
            'idlharness.any.sharedworker.html'
        ].forEach(async (htmlFile) => {
            const htmlPath = path.join(indexedDBDir, htmlFile);
            const urlPath = new URL(
                htmlFile,
                'http://web-platform.test:8000/IndexedDB/'
            );
            const resp = await fetch(urlPath.href);
            const fileContents = await resp.text();
            replace(htmlPath, fileContents, true);
        });
    });
}

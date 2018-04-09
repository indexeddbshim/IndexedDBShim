const fs = require('fs');
const path = require('path');

const indexedDBDir = path.join(__dirname, '../web-platform-tests/IndexedDB/');
const loaderFile = '_indexeddbshim-loader.html';
const shimLoaderPath = path.join(indexedDBDir, loaderFile);

if (process.argv[2] === 'remove') {
    fs.unlinkSync(shimLoaderPath);
    fs.readdir(indexedDBDir, (err, files) => {
        if (err) {
            console.log('err', err);
            return;
        }
        const anyJSFiles = files.filter((f) => (/\.html?\.any\.js$/).test(f));
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
<script src="http://localhost:9999/node_modules/babel-polyfill/dist/polyfill.js"></script>
<script src="http://localhost:9999/dist/indexeddbshim-noninvasive.min.js"></script>
`);

    fs.readdir(indexedDBDir, (err, files) => {
        if (err) {
            console.log('err', err);
            return;
        }

        const htmlFiles = files.filter((f) => (/\.html?$/).test(f) && !(/indexeddbshim-loader\.html$/).test(f));
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
    var ifr = createIframe('${htmlFile.replace(/'/g, "\\'")}', loaderWin);
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

        const htmlFiles = files.filter((f) => (/\.html?$/).test(f));
        const polyfillScript = `
<script src="http://localhost:9999/node_modules/babel-polyfill/dist/polyfill.js"></script>
<script src="http://localhost:9999/dist/indexeddbshim-noninvasive.js"></script>
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

        htmlFiles.forEach((htmlFile) => {
            // Could add these too to avoid warnings
            // <meta charset="utf-8" />
            // <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon" />
            const htmlPath = path.join(indexedDBDir, htmlFile);
            fs.writeFileSync(
                htmlPath,
                String(fs.readFileSync(htmlPath))
                    .replace(polyfillScript, '') // Replace any preexisting polyfill tag
                    .replace(/<script/, polyfillScript + '$&'));
        });
    });
}

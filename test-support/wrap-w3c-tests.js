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
} else {
    fs.writeFileSync(shimLoaderPath, '<script src="http://localhost:9999/dist/indexeddbshim-noninvasive.js"></script>');

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

var w = ifr.contentWindow;
w.addEventListener('DOMContentLoaded', function () {
    var ifr = createIframe('${htmlFile.replace(/'/g, "\\'")}', w);
    var win = ifr.contentWindow;

    var style = document.createElement('style');
    style.textContent = '#log {display: none;}'; // Avoid extra display of log; another way?
    document.head.appendChild(style);

    // Todo: Add in Unicode config
    w.setGlobalVars(win, {
        fullIDLSupport: true,
        addNonIDBGlobals: true,
        win: win
    });
    win.shimIndexedDB.__useShim();
    win.DOMStringList = win.ShimDOMStringList;
    win.DOMException = win.ShimDOMException;
    win.Event = win.ShimEvent;
    win.CustomEvent = win.ShimCustomEvent;
    win.EventTarget = win.ShimEventTarget;
});
`;

            fs.writeFileSync(anyJSPath, content);
        });
    });
}

import {readFile, writeFile, readdir, mkdir} from 'node:fs/promises';
import path from 'path';
import http from 'http';
import {JSDOM} from 'jsdom';

const dirPath = process.argv[2] || 'web-platform-tests/IndexedDB';

const anyFiles = (await readdir(dirPath)).filter((dir) => {
    return dir.endsWith('.any.js');
});
const anyFilesPaths = anyFiles.map((dir) => {
    return `/IndexedDB/${dir}`;
});

// Known scripts
const testHarnessScripts = [
    '/resources/testharness.js', '/resources/testharnessreport.js'
];
const supportScripts = [
    '/resources/testdriver.js',
    '/resources/testdriver-vendor.js',
    '/common/subset-tests.js',
    'resources/support.js',
    'resources/support-promises.js',
    'resources/nested-cloning-common.js',
    'resources/interleaved-cursors-common.js',
    'resources/reading-autoincrement-common.js',
    'http://127.0.0.1:9999/dist/indexeddbshim-noninvasive.js',
    'http://127.0.0.1:9999/node_modules/core-js-bundle/minified.js',
    '/common/get-host-info.sub.js' // 'web-platform-tests/IndexedDB/idbfactory-origin-isolation.html'
];
const webIDLScripts = [
    '/resources/WebIDLParser.js', '/resources/idlharness.js',
    ...anyFilesPaths
];
const serviceWorkerScripts = ['resources/test-helpers.sub.js'];
const knownScripts = testHarnessScripts.concat(supportScripts, webIDLScripts, serviceWorkerScripts);

const builtJSPath = path.join('test-support', 'js');

try {
    await mkdir(builtJSPath);
} catch (err) {}
let items;
try {
    items = await readdir(dirPath);
} catch (err) {
    console.log(`Error reading directory ${dirPath}`);
    throw err;
}
const htmlExt = /\.html?$/u;
const normalIndexedDBFiles = items.filter((item) => {
    return item.match(htmlExt) &&
        !['_indexeddbshim-loader.html'].includes(item);
});
const htmlFiles = normalIndexedDBFiles.map((htmlFile) => ({
    inputFile: path.join(dirPath, htmlFile),
    outputFile: path.join(builtJSPath, htmlFile.replace(htmlExt, '.js'))
})).concat({
    // DOMStringList test uses IndexedDB to test and is used by IndexedDB (and exported by our shim)
    inputFile: 'web-platform-tests/html/infrastructure/common-dom-interfaces/collections/domstringlist.html',
    outputFile: path.join(builtJSPath, 'domstringlist.js')
}, {
    inputFile: 'http://web-platform.test:8000/workers/semantics/interface-objects/003.any.html',
    outputFile: path.join(builtJSPath, '_interface-objects-003.js'),
    web: true
}, {
    inputFile: 'http://web-platform.test:8000/workers/semantics/interface-objects/004.any.html',
    outputFile: path.join(builtJSPath, '_interface-objects-004.js'),
    web: true
}, {
    inputFile: 'web-platform-tests/service-workers/service-worker/indexeddb.https.html',
    outputFile: path.join(builtJSPath, '_service-worker-indexeddb.https.js')
}, ...anyFiles.map((anyFile) => {
    return {
        inputFile: `http://web-platform.test:8000/IndexedDB/${anyFile.replace(/\.js$/, '.html')}`,
        outputFile: path.join(builtJSPath, anyFile),
        web: true
    };
}));

// Iterate IndexedDB files
await Promise.all(htmlFiles.map(async ({inputFile, outputFile, web}) => {
    let data;
    if (web) {
        data = await new Promise((resolve) => { // eslint-disable-line promise/avoid-new
            http.get(inputFile, (res) => {
                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    // console.log('got HTML file', rawData);
                    resolve(rawData);
                });
            }).on('error', (e) => {
                console.error(`Got error retrieving ${inputFile}: ${e.message}`);
            });
        });
    } else {
        try {
            data = await readFile(inputFile, 'utf8');
        } catch (err) {
            console.log(err);
        }
    }
    // Extract JavaScript content and save to file
    const {document} = (new JSDOM(data)).window;
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => [...document.querySelectorAll(sel)];

    // Confirm there are no unexpected elements which should be handled in the test
    // <(?!/?(script(>| src| type="text/javascript")|div( id="?log"?)?>|link|meta|!|title>|html|http|DOM|head>|body>| |=))
    $$('*').forEach(function (elem) {
        if (![
            'html', 'head', 'body', 'meta', 'title',
            'link', 'script', 'div', 'h1', 'form', 'input'
        ].includes(elem.nodeName.toLowerCase())) {
            console.log('Unexpected element: ' + elem.nodeName + ' in file: ' + inputFile);
        }
        const atts = [...elem.attributes].map((a) => a.name);
        if (atts.some((att) => {
            return ![
                'src', 'type', 'id', 'rel', 'charset',
                'title', 'href', 'name', 'content'
            ].includes(att);
        })) {
            console.log('Unrecognized attributes: ' + atts + ' on element: ' + elem.nodeName);
        }
    });

    // Build script content
    let scriptContent = '';
    $$('script[src]').forEach(function (elem) {
        const src = elem.getAttribute('src');
        if (!knownScripts.includes(src)) {
            console.log('Found non-typical script src: ' + src + ' in: ' + inputFile);
        }
        scriptContent += '/' + '*beginscript::' + (
            // Handle exceptions to top-level /resources or /IndexedDB
            src === 'resources/test-helpers.sub.js' ? 'service-workers/service-worker/' + src : src
        ) + '::endscript*' + '/\n';
    });
    scriptContent +=
        "document.title = '" +
        ($('title')
            ? $('title').textContent
            : inputFile).replaceAll('\'', "\\'").replaceAll(/\n|\r/gu, ' ') +
        "';\n" +
        ($('script:not([src])')
            ? $('script:not([src])').textContent
            : '');

    try {
        await writeFile(outputFile, scriptContent);
    } catch (err) {
        console.log(err);
    }
    // console.log("The file " + outputFile + " was saved!");
}));
const reducer = (s, src) => s + '/' + '*beginscript::' + src + '::endscript*' + '/\n';
/* eslint-disable unicorn/no-array-callback-reference */
const harnessContent = [
    '/resources/testharness.js',
    '/resources/testharnessreport.js'
].reduce(reducer, '');
const harnessContent0 = [
    '/resources/WebIDLParser.js',
    '/resources/idlharness.js',
    '/resources/testharness.js',
    '/resources/testharnessreport.js'
].reduce(reducer, '');
/* eslint-enable unicorn/no-array-callback-reference */
const scripts = [
    {
        inputFile: '/workers/semantics/interface-objects/001.worker.js',
        outputFile: path.join(builtJSPath, '_interface-objects-001.worker.js')
    },
    {
        inputFile: '/workers/semantics/interface-objects/002.worker.js',
        outputFile: path.join(builtJSPath, '_interface-objects-002.worker.js')
    }
];
await Promise.all(scripts.map(async ({inputFile, outputFile}, i) => {
    const scriptContent = (i === 0
        ? harnessContent0
        : harnessContent) + "document.title = '" + inputFile + "';\n" +
        'fetch_tests_from_worker(new Worker("' + inputFile + '"));';
    try {
        await writeFile(outputFile, scriptContent);
    } catch (err) {
        console.log(err);
        return;
    }
    let data;
    try {
        data = await readFile('web-platform-tests/resources/webidl2/lib/webidl2.js', 'utf8');
    } catch (err) {
        console.log(err);
        return;
    }
    try {
        await writeFile('web-platform-tests/resources/WebIDLParser.js', data);
    } catch (err) {
        console.log(err);
    }
}));
console.log('All files have been saved!');

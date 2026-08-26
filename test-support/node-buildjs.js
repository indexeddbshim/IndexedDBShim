import {readFile, writeFile, readdir, mkdir} from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {JSDOM} from 'jsdom';

const dirPath = process.argv[2] || 'web-platform-tests/IndexedDB';

const anyFiles = (await readdir(dirPath)).filter((dir) => {
    return dir.endsWith('.any.js');
});
const anyFilesPaths = anyFiles.map((dir) => {
    return `/IndexedDB/${dir}`;
});

// WPT's own tooling additionally generates a dedicated-worker-context
//   `<name>.any.worker.html`/`.any.worker.js` pair (served the same way as
//   the window-context `.any.html` variant already fetched below) for any
//   `.any.js` file declaring a worker-compatible global via its `META`
//   comment, e.g. `// META: global=window,worker`. Detect those here so a
//   companion `htmlFiles` entry can be added for each.
const workerMetaRegex = /^\/\/ META: global=.*worker/miv;
const anyWorkerFiles = (await Promise.all(anyFiles.map(async (anyFile) => {
    const content = await readFile(path.join(dirPath, anyFile), 'utf8');
    return workerMetaRegex.test(content) ? anyFile : null;
}))).filter(Boolean);

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
    'resources/support-get-all.js',
    'resources/request-event-ordering-common.js',
    'resources/nested-cloning-common.js',
    'resources/interleaved-cursors-common.js',
    'resources/reading-autoincrement-common.js',
    'http://127.0.0.1:9999/dist/indexeddbshim-noninvasive.js',
    '../common/get-host-info.sub.js', // web-platform-tests/IndexedDB/database-names-by-origin.html
    '/common/get-host-info.sub.js' // 'web-platform-tests/IndexedDB/idbfactory-origin-isolation.html'
];
const webIDLScripts = [
    '/resources/WebIDLParser.js', '/resources/idlharness.js',
    ...anyFilesPaths
];
const serviceWorkerScripts = ['resources/test-helpers.sub.js'];
const bucketScripts = ['/storage/buckets/resources/util.js'];
const knownScripts = testHarnessScripts.concat(
    supportScripts, webIDLScripts, serviceWorkerScripts, bucketScripts
);

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
const htmlExt = /\.html?$/v;
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
    /* eslint-disable unicorn/prefer-https -- Local */
    inputFile: 'web-platform-tests/service-workers/service-worker/indexeddb.https.html',
    outputFile: path.join(builtJSPath, '_service-worker-indexeddb.https.js')
}, ...anyFiles.map((anyFile) => {
    return {
        inputFile: `http://web-platform.test:8000/IndexedDB/${anyFile.replace(/\.js$/v, '.html')}`,
        /* eslint-enable unicorn/prefer-https -- Local */
        outputFile: path.join(builtJSPath, anyFile),
        web: true
    };
}), ...anyWorkerFiles.map((anyFile) => {
    return {
        // eslint-disable-next-line unicorn/prefer-https -- Local
        inputFile: `http://web-platform.test:8000/IndexedDB/${anyFile.replace(/\.js$/v, '.worker.html')}`,
        outputFile: path.join(builtJSPath, anyFile.replace(/\.js$/v, '.worker.js')),
        web: true
    };
}));

// Iterate IndexedDB files
await Promise.all(htmlFiles.map(async ({inputFile, outputFile, web}) => {
    let data;
    if (web) {
        data = await new Promise((resolve) => { // eslint-disable-line promise/avoid-new -- No API
            http.get(inputFile, (res) => {
                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
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
        scriptContent += '/*beginscript::' + (
            // Handle exceptions to top-level /resources or /IndexedDB
            src === 'resources/test-helpers.sub.js' ? 'service-workers/service-worker/' + src : src
        ) + '::endscript*/\n';
    });
    scriptContent +=
        "document.title = '" +
        ($('title')
            ? $('title').textContent
            : inputFile).replaceAll('\'', String.raw`\'`).replaceAll(/[\n\r]/gv, ' ') +
        "';\n" +
        ($('script:not([src])')
            ? $('script:not([src])').textContent
            : '');

    try {
        await writeFile(outputFile, scriptContent);
    } catch (err) {
        console.log(err);
    }
}));
const reducer = (s, src) => s + '/*beginscript::' + src + '::endscript*/\n';
/* eslint-disable unicorn/no-array-callback-reference -- Convenient */
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
/* eslint-enable unicorn/no-array-callback-reference -- Convenient */
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

// `workers/semantics/interface-objects/003.any.js` and `004.any.js` are
//   restricted via `// META: global=sharedworker`, so WPT's own tooling
//   never generates meaningful content for the window-context (`.any.html`)
//   variant of either -- fetching that URL, as this build script used to,
//   only ever produced an empty stub. Instead, extract each file's
//   `expected`/`unexpected` interface-name array directly from its real WPT
//   source and wrap it in a small SharedWorker-based test that checks every
//   name from inside that worker's actual global scope, then reports the
//   combined result back to this window-context test. This deliberately
//   does not use `fetch_tests_from_worker`: that relies on testharness.js's
//   own worker-side result-relaying protocol, which has a separate,
//   pre-existing bug in this harness unrelated to SharedWorker support.
/**
 * @param {string} sourceFile
 * @param {string} varName
 * @returns {Promise<string[]>}
 */
async function extractInterfaceArray (sourceFile, varName) {
    const source = await readFile(sourceFile, 'utf8');
    const startMarker = 'var ' + varName + ' = [';
    const start = source.indexOf(startMarker);
    if (start === -1) {
        throw new Error(
            'Could not find `' + startMarker + '` in ' + sourceFile +
            ' -- has this WPT test been restructured upstream? The ' +
            '_interface-objects-003.js/004.js generation in this script ' +
            'assumes a plain `var ' + varName + ' = [...]` array followed ' +
            'by a simple `name in self` check loop, and will need updating ' +
            'to match whatever changed.'
        );
    }
    const arrayStart = start + startMarker.length - 1;
    const end = source.indexOf('];', arrayStart) + 1;
    const arrayLiteral = source.slice(arrayStart, end)
        // The source has `//`-prefixed comment lines grouping entries by
        //   spec, and a trailing comma before `]` -- neither of which plain
        //   `JSON.parse` accepts.
        .replaceAll(/^\s*\/\/.*$/gmv, '')
        .replace(/,(\s*\])/v, '$1');
    const list = JSON.parse(arrayLiteral);
    if (list.length === 0) {
        throw new Error('Extracted an empty interface list from ' + sourceFile + ' -- something is wrong with the extraction above.');
    }
    return list;
}

/**
 * @param {{
 *   sourceFile: string,
 *   outputFile: string,
 *   varName: string,
 *   wantPresent: boolean,
 *   title: string,
 *   describeWord: string
 * }} opts
 * @returns {Promise<void>}
 */
async function buildInterfaceObjectsFile ({sourceFile, outputFile, varName, wantPresent, title, describeWord}) {
    const list = await extractInterfaceArray(sourceFile, varName);
    const workerScript = 'var ' + varName + ' = ' + JSON.stringify(list) + ';\n' +
        'self.addEventListener("connect", function (e) {\n' +
        '  var port = e.ports[0];\n' +
        '  var results = ' + varName + '.map(function (name) {\n' +
        '    return {name: name, present: name in self};\n' +
        '  });\n' +
        '  port.postMessage(results);\n' +
        '});';
    const content = harnessContent +
        'document.title = ' + JSON.stringify(title) + ';\n' +
        'const worker_script = ' + JSON.stringify(workerScript) + ';\n' +
        'promise_test(async t => {\n' +
        '  const worker = new SharedWorker("data:," + encodeURIComponent(worker_script));\n' +
        '  const results = await new Promise((resolve) => {\n' +
        '    worker.port.onmessage = (e) => resolve(e.data);\n' +
        '  });\n' +
        '  const mismatched = results\n' +
        '    .filter((result) => result.present !== ' + wantPresent + ')\n' +
        '    .map((result) => result.name);\n' +
        '  assert_array_equals(\n' +
        '    mismatched, [],\n' +
        '    "These interface objects should ' + (wantPresent ? '' : 'not ') +
            'have been exposed on SharedWorkerGlobalScope: " + mismatched.join(", ")\n' +
        '  );\n' +
        '}, ' + JSON.stringify(describeWord) + ');\n';
    try {
        await writeFile(outputFile, content);
    } catch (err) {
        console.log(err);
    }
}

await Promise.all([
    buildInterfaceObjectsFile({
        sourceFile: 'web-platform-tests/workers/semantics/interface-objects/003.any.js',
        outputFile: path.join(builtJSPath, '_interface-objects-003.js'),
        varName: 'expected',
        wantPresent: true,
        title: 'Interface exposure on SharedWorkerGlobalScope (present)',
        describeWord: 'The expected interface objects should be exposed on SharedWorkerGlobalScope'
    }),
    buildInterfaceObjectsFile({
        sourceFile: 'web-platform-tests/workers/semantics/interface-objects/004.any.js',
        outputFile: path.join(builtJSPath, '_interface-objects-004.js'),
        varName: 'unexpected',
        wantPresent: false,
        title: 'Interface exposure on SharedWorkerGlobalScope (absent)',
        describeWord: 'The unexpected interface objects should not be exposed on SharedWorkerGlobalScope'
    })
]);

console.log('All files have been saved!');

/* eslint-disable compat/compat */
const {JSDOM} = require('jsdom');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Known scripts
const testHarnessScripts = ['/resources/testharness.js', '/resources/testharnessreport.js'];
const supportScripts = ['support.js', 'support-promises.js', 'nested-cloning-common.js', 'interleaved-cursors-common.js'];
const webIDLScripts = ['/resources/WebIDLParser.js', '/resources/idlharness.js', '/IndexedDB/interfaces.any.js'];
const serviceWorkerScripts = ['resources/test-helpers.sub.js'];
const knownScripts = testHarnessScripts.concat(supportScripts, webIDLScripts, serviceWorkerScripts);

const dirPath = process.argv[2] || 'web-platform-tests/IndexedDB';
const builtJSPath = path.join('test-support', 'js');
fs.mkdir(builtJSPath, function () {
    fs.readdir(dirPath, function (err, items) {
        if (err) { return console.log(err); }
        const htmlExt = /\.html?$/;
        const normalIndexedDBFiles = items.filter((item) => item.match(htmlExt) && !['_indexeddbshim-loader.html'].includes(item));
        const htmlFiles = normalIndexedDBFiles.map((htmlFile) => ({
            inputFile: path.join(dirPath, htmlFile),
            outputFile: path.join(builtJSPath, htmlFile.replace(htmlExt, '.js'))
        })).concat({
            // DOMStringList test uses IndexedDB to test and is used by IndexedDB (and exported by our shim)
            inputFile: 'web-platform-tests/html/infrastructure/common-dom-interfaces/collections/domstringlist.html',
            outputFile: path.join(builtJSPath, 'domstringlist.js')
        }, {
            inputFile: 'web-platform-tests/workers/semantics/interface-objects/003.html',
            outputFile: path.join(builtJSPath, '_interface-objects-003.js')
        }, {
            inputFile: 'web-platform-tests/workers/semantics/interface-objects/004.html',
            outputFile: path.join(builtJSPath, '_interface-objects-004.js')
        }, {
            inputFile: 'web-platform-tests/service-workers/service-worker/indexeddb.https.html',
            outputFile: path.join(builtJSPath, '_service-worker-indexeddb.https.js')
        }, {
            inputFile: 'http://web-platform.test:8000/IndexedDB/interfaces.any.html',
            outputFile: path.join(builtJSPath, 'interfaces.any.js'),
            web: true
        });
        let ct = 0;

        // Iterate IndexedDB files
        htmlFiles.forEach(({inputFile, outputFile, web}, i) => {
            let prom;
            if (web) {
                prom = new Promise((resolve, reject) => {
                    http.get(inputFile, (res) => {
                        res.setEncoding('utf8');
                        let rawData = '';
                        res.on('data', (chunk) => { rawData += chunk; });
                        res.on('end', () => {
                            // console.log('got HTML file', rawData);
                            resolve(rawData);
                        });
                    }).on('error', (e) => {
                        console.error(`Got error: ${e.message}`);
                    });
                });
            } else {
                prom = new Promise((resolve, reject) => {
                    fs.readFile(inputFile, 'utf8', function (err, data) {
                        if (err) { return console.log(err); }
                        resolve(data);
                    });
                });
            }
            prom.then((data) => {
                // Extract JavaScript content and save to file
                const {document} = (new JSDOM(data)).window;
                const $ = (sel) => document.querySelector(sel);
                const $$ = (sel) => [...document.querySelectorAll(sel)];

                // Confirm there are no unexpected elements which should be handled in the test
                // <(?!/?(script(>| src| type="text/javascript")|div( id="?log"?)?>|link|meta|!|title>|html|http|DOM|head>|body>| |=))
                $$('*').forEach(function (elem, i) {
                    if (!['html', 'head', 'body', 'meta', 'title', 'link', 'script', 'div', 'h1'].includes(elem.nodeName.toLowerCase())) {
                        console.log('Unexpected element: ' + elem.nodeName);
                    }
                    const atts = [...elem.attributes].map((a) => a.name);
                    if (atts.some((att) => {
                        return !['src', 'type', 'id', 'rel', 'charset', 'title', 'href', 'name', 'content'].includes(att);
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
                        : inputFile).replace(/'/g, "\\'").replace(/\n|\r/g, ' ') +
                    "';\n" +
                    $('script:not([src])').textContent;

                fs.writeFile(outputFile, scriptContent, function (err) {
                    if (err) { return console.log(err); }
                    ct++;
                    if (ct === htmlFiles.length - 1) {
                        const reducer = (s, src) => s + '/' + '*beginscript::' + src + '::endscript*' + '/\n';
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
                        const scripts = [
                            {inputFile: 'interfaces.any.worker.js', outputFile: path.join(builtJSPath, 'interfaces.any.worker.js')}, // There is no name conflict as this will be attempting to load from inside web-platform-tests/IndexedDB/
                            {inputFile: '/workers/semantics/interface-objects/001.worker.js', outputFile: path.join(builtJSPath, '_interface-objects-001.worker.js')},
                            {inputFile: '/workers/semantics/interface-objects/002.worker.js', outputFile: path.join(builtJSPath, '_interface-objects-002.worker.js')}
                        ];
                        scripts.forEach(({inputFile, outputFile}, i) => {
                            const scriptContent = (i === 0
                                ? harnessContent0
                                : harnessContent) + "document.title = '" + inputFile + "';\n" +
                                'fetch_tests_from_worker(new Worker("' + inputFile + '"));';
                            fs.writeFile(outputFile, scriptContent, function (err) {
                                if (err) { return console.log(err); }
                                fs.readFile('web-platform-tests/resources/webidl2/lib/webidl2.js', 'utf8', function (err, data) {
                                    if (err) { return console.log(err); }
                                    fs.writeFile('web-platform-tests/resources/WebIDLParser.js', data, function (err) {
                                        if (err) { return console.log(err); }
                                        if (i === scripts.length - 1) {
                                            console.log('All files have been saved!');
                                        }
                                    });
                                });
                            });
                        });
                    }
                    // console.log("The file " + outputFile + " was saved!");
                });
            });
        });
    });
});

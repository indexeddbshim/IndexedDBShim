/* eslint-disable compat/compat */
// Todo: Reuse any relevant portions in this file or `node-buildjs.js` for adapting tests for browser shimming
require('source-map-support').install({
    // Needed along with sourcemap transform
    environment: 'node'
});
const util = require('util');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
// Requires `--experimental-worker` (as of 10.5.0)
const {MessageChannel} = require('worker_threads');

const jsdom = require('jsdom');
const {ImageData, DOMPoint, DOMMatrix} = require('canvas');
const colors = require('colors/safe');

const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);

const {JSDOM} = jsdom;
const CY = require('cyclonejs'); // Todo: Replace this with Sca (but need to make requireable)
const XMLHttpRequestConstr = require('local-xmlhttprequest');
const isDateObject = require('is-date-object');
const fetch = require('isomorphic-fetch');
const Worker = require('./webworker/webworker'); // Todo: We could export this `Worker` publicly for others looking for a Worker polyfill with IDB support
const transformV8Stack = require('./transformV8Stack');
const {
    goodFiles, badFiles, notRunning, timeout, excludedWorkers, excludedNormal
} = require('./node-good-bad-files');

// CONFIG
const DEBUG = false;
const vmTimeout = 90000; // Time until we give up on the vm (increasing to 40000 didn't make a difference on coverage in earlier versions)
// const intervalSpacing = 1; // Time delay after test before running next

// SET-UP
const fileArg = process.argv[2];
const fileIndex = (/^-?\d+$/u).test(fileArg) ? fileArg : (process.argv[3] || undefined);
const endFileCount = (/^-?\d+$/u).test(fileArg) && (/^-?\d+$/u).test(process.argv[3]) ? process.argv[3] : (process.argv[4] || undefined);
const dirPath = path.join('test-support', 'js');
const idbTestPath = 'web-platform-tests';
const indexeddbshim = require('../dist/indexeddbshim-UnicodeIdentifiers-node');

const {createDOMException} = indexeddbshim;
const workerFileRegex = /^(_service-worker-indexeddb\.https\.js|(_interface-objects-)?00\d(\.worker)?\.js)$/u;
// const indexeddbshimNonUnicode = require('../dist/indexeddbshim-node');

// String replacements on code due, e.g., for lagging ES support in Node
const nodeReplacementHacks = {
    'idb-binary-key-roundtrip.js': [/(`Binary keys can be supplied using the view type \$\{type\}`),/u, '$1'] // https://github.com/w3c/web-platform-tests/issues/4817
};

const jsonResults = true;
const shimNS = {
    colors,
    fileName: '',
    finished () { throw new Error('Finished callback not set'); },
    isDateObject,
    write (msg) {
        (process && process.stdout && process.stdout.isTTY) ? process.stdout.write(msg) : console.log(msg);
    },
    writeStack (msg, stack) {
        console.log(msg + transformV8Stack(stack));
    },
    writeln (msg) {
        console.log(msg);
    },
    statuses: {
        Pass: 0,
        Fail: 0,
        Timeout: 0,
        'Not Run': 0
    },
    // fileMap: new Map(), // Todo: Could add a flag to set
    // jsonOutput: {results: []},
    files: {
        Pass: [],
        Fail: [],
        Timeout: [],
        'Not Run': []
    }
};
let ct = 0;
let excludedCount = 0;

/*
// Todo: Might use in place of excluded array, but would need to increment, etc.
process.on('uncaughtException', function (err) {
    // handle the error safely
    console.log('idbshim uncaught error:' + err);
});
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
*/
function exit () {
    process.exit();
}
async function readAndEvaluate (jsFiles, initial = '', ending = '', workers = false, item = 0) {
    shimNS.fileName = jsFiles[item];
    shimNS.finished = async () => {
        ct += 1;
        async function finishedCheck () {
            function cleanJSONOutput (...args) {
                return JSON.stringify(...args).replace(/"/gu, "'").replace(/','/gu, "', '");
            }
            if (ct < jsFiles.length) {
                // Todo: Have the test environment script itself report back time-outs and
                //    tweak per test? (but set vmTimeout longer in case needed or even
                //    remove if we control it on a per-test basis ourselves)
                // We chain requests to avoid tests having race condition, e.g.,
                //   potentially reusing database name, etc. if not handled already
                //   in the tests (more tests do pass with these timeouts);
                //   the timeout, however, does not even seem to be necessary.
                // setTimeout(() => {
                await readAndEvaluate(jsFiles, initial, ending, workers, ++item);
                // }, intervalSpacing);
                return;
            }

            // Ensure time for final clean-up (e.g., deleting databases) and
            //   logging before reporting results
            setTimeout(async () => {
                shimNS.files['Files with all tests passing'] = shimNS.files.Pass.filter((p) => {
                    return !shimNS.files.Fail.includes(p) &&
                        !shimNS.files.Timeout.includes(p) &&
                        !shimNS.files['Not Run'].includes(p);
                });

                const unknownFiles = [];
                const knownFiles = [
                    ...goodFiles, ...badFiles, ...notRunning,
                    ...timeout, ...excludedWorkers, ...excludedNormal
                ];

                console.log('\nTest files by status (may recur):');
                console.log(
                    // Object.entries(shimNS.files).reduce((_, [status, files]) => { // Sometimes failing in Node 6.9.2
                    Object.keys(shimNS.files).reduce((_, status) => {
                        const files = shimNS.files[status];
                        files.forEach((file) => {
                            if (!knownFiles.includes(file) && !unknownFiles.includes(file)) {
                                unknownFiles.push(file);
                            }
                        });
                        if (!files.length) {
                            return _ + '  ' + status + ': 0\n';
                        }
                        return _ + '  ' + status + ' (' + files.length +
                            '): [\n    ' + cleanJSONOutput(files).slice(1, -1) +
                            '\n  ]\n';
                    }, '\n')
                );

                console.log('  Number of files processed: ' + (ct - excludedCount));

                console.log('\nNumber of total tests by status:');
                shimNS.statuses['Total tests'] = Object.values(shimNS.statuses).reduce((ct, statusCt) => ct + statusCt);
                console.log(
                    cleanJSONOutput(shimNS.statuses, null, 2) + '\n'
                );

                console.log('Files run which were not in goodBadFiles list', unknownFiles.length, unknownFiles);

                console.log('Unexpectedly wholly passing files:');

                const unexpectedPasses = shimNS.files['Files with all tests passing'].filter((file) => {
                    return !goodFiles.includes(file);
                });
                if (unexpectedPasses.length) {
                    console.log(
                        '  ' + '(' + unexpectedPasses.length + '): [\n    ' + cleanJSONOutput(unexpectedPasses).slice(1, -1) + '\n  ]\n'
                    );
                } else {
                    console.log('(None)');
                }

                console.log('Unexpected failures:');
                const failedFiles = shimNS.files.Fail.filter(
                    (f) => ![...badFiles, ...excludedWorkers, ...excludedNormal].includes(f) &&
                    ![
                        '../non-indexedDB/interface-objects.js',
                        '../non-indexedDB/__event-interface.js',
                        '../non-indexedDB/exceptions.js'
                    ].includes(f) &&
                    (!workers || !['_service-worker-indexeddb.https.js'].includes(f))
                );
                if (failedFiles.length) {
                    console.log(
                        '  ' + '(' + failedFiles.length + '): [\n    ' + cleanJSONOutput(failedFiles).slice(1, -1) + '\n  ]\n'
                    );
                } else console.log('(None)');

                if (shimNS.fileMap) {
                    console.log(
                        [...shimNS.fileMap].reduce(
                            (str, [fileName, [passing, total]]) => {
                                return str + fileName + ': ' + passing + '/' + total + '\n';
                            },
                            ''
                        )
                    );
                    shimNS.fileMap.clear(); // Release memory
                }
                if (excluded.length) {
                    console.log(
                        'Please note that the following tests ' + excluded.length +
                        ' are being deliberately excluded as we do not yet have the ' +
                        'built-in support for their features (e.g., shared and ' +
                        'service workers), and they are not currently allowing the ' +
                        'other tests to complete: ' + cleanJSONOutput(excluded)
                    );
                }
                if (jsonResults) {
                    const jsonOutputPath = path.join(
                        'test-support', 'results',
                        'file-w3c' +
                            // new Date().getTime() +
                            '.json'
                    );
                    try {
                        await writeFile(jsonOutputPath, JSON.stringify(
                            {
                                stats: {
                                    passes: shimNS.statuses.Pass,
                                    failures:
                                        shimNS.statuses.Fail +
                                        shimNS.statuses.Timeout +
                                        shimNS.statuses['Not Run']
                                }
                            }, null, 2
                        ));
                    } catch (err) {
                        console.log(err);
                        return;
                    }
                    console.log('Saved to ' + jsonOutputPath);
                } else if (shimNS.jsonOutput) {
                    const jsonOutputPath = path.join(
                        'test-support', 'json-output' +
                        // new Date().getTime() +
                        '.json'
                    );
                    try {
                        await writeFile(jsonOutputPath, JSON.stringify(shimNS.jsonOutput, null, 2));
                    } catch (err) {
                        console.log(err);
                        return;
                    }
                    console.log('Saved to ' + jsonOutputPath);
                }
                exit();
            }, 1000);
        }
        await finishedCheck();
    };

    // Exclude those currently breaking the tests
    // Todo: Replace with `uncaughtException` handlers above?
    let excluded = [];
    if (jsFiles.length > 1) {
        excluded = workers
            // Keep these arrays even if made empty for sake of any new breaking W3C tests
            ? excludedWorkers
            : excludedNormal;
        if (excluded.includes(shimNS.fileName) || (!workers && workerFileRegex.test(shimNS.fileName))) {
            excludedCount++;
            shimNS.finished();
            return;
        }
    }

    let content;
    try {
        content = await readFile(path.join(dirPath, shimNS.fileName), 'utf8');
    } catch (err) {
        console.log(err);
        return;
    }

    if (nodeReplacementHacks[shimNS.fileName]) {
        content = content.replace(...nodeReplacementHacks[shimNS.fileName]);
    }

    const scripts = [];
    const supported = [
        'resources/testharness.js', 'resources/testharnessreport.js',
        'resources/idlharness.js', 'resources/WebIDLParser.js',
        'resources/testdriver.js', 'resources/testdriver-vendor.js',
        'common/subset-tests.js',
        'nested-cloning-common.js', 'interleaved-cursors-common.js',
        'support.js', 'support-promises.js', 'service-workers/service-worker/resources/test-helpers.sub.js',
        'common/get-host-info.sub.js'
    ];
    // Use paths set in node-buildjs.js (when extracting <script> tags and joining contents)
    content.replace(/beginscript::(.*?)::endscript/gu, (_, src) => {
        // Fix paths for known support files and report new ones (so we can decide how to handle)
        if (supported.includes(src) || supported.includes(src.replace(/^\//u, '')) ||
            (src.startsWith('/IndexedDB') && src.endsWith('.any.js'))
        ) {
            src = src.replace(/^\//u, '');
            scripts.push(path.join(
                idbTestPath,
                // Since our build script is now copying it, we actually don't need this now,
                //    but keeping comment in case this possibility is later closed
                // src === 'resources/WebIDLParser.js' // See https://github.com/w3c/testharness.js/issues/231
                // This file should be rewritten by `web-platform-tests/tools/serve/serve`,
                //   but as we are allowing testing independently of this environment (and
                //   are using file loading as opposed to URL loading mechanisms in our
                //   testing) we just map it to the source file which appears to be rendered
                //   unmodified
                // ? 'resources/webidl2/lib/webidl2.js' : ()
                ((/^(service-workers|resources|IndexedDB|common\/)/u).test(src)
                    ? src
                    : 'IndexedDB/' + src)
            ));
        } else {
            console.log('missing?:' + src);
        }
    });

    const harnessContent = await readAndJoinFiles(scripts);
    // early envt't, harness, reporting env't, specific test
    const allContent = initial + '\n' + harnessContent + '\n' + ending + '\n' + content;

    // Build the window each time for test safety
    const rootPath = path.join(__dirname, '../web-platform-tests');
    const basePath = path.join(rootPath, 'IndexedDB');
    /*
    // Todo: We aren't really using this now as it doesn't help
    //    with XMLHttpRequest; it also changes path of
    //    node-XMLHttpRequest; submit PR to jsdom to get
    //    relative local file paths working as in our
    //    node-XMLHttpRequest fork (and with a desired base path);
    //    however, we really need to get our own test server running
    //    to allow URLs to work
    */
    // Todo: We should get this working with our test server; should work with `XMLHttpRequest` base
    // Leverage the W3C server for interfaces test, assuming it is running;
    //   as we are overriding `XMLHttpRequest` below, we are not really using this at the moment,
    //   but to set up, see https://github.com/w3c/web-platform-tests
    // const url = 'http://localhost:9999/web-platform-tests/IndexedDB/idlharness.any.html',
    // const url = 'file://' + basePath;
    const url = 'http://localhost:8000/IndexedDB/idlharness.any.html';
    const {window} = await JSDOM.fromURL(url);
    try {
        // Should only pass in safe objects
        const sandboxObj = {
            console,
            shimNS
        };

        const baseCfg = {
            replaceNonIDBGlobals: true,
            checkOrigin: false,
            databaseNameLengthLimit: 1000,
            useSQLiteIndexes: true,
            DEBUG
        };
        if (['idbfactory-open-opaque-origin.js', 'idbfactory-deleteDatabase-opaque-origin.js'].includes(
            shimNS.fileName
        )) {
            baseCfg.checkOrigin = true;
        }
        global.location = window.location; // Needed by IDB for origin checks; also needed by `createObjectURL` polyfill

        // Todo: We might switch based on file to normally try non-Unicode version or otherwise exclude properties as
        //   some of these do incur a significant performance cost which could speed up the testing process if avoided,
        //   though it could also make the tests more fragile to changes
        // indexeddbshimNonUnicode(window);
        if (['idlharness.any.js', '../non-indexedDB/exceptions.js', '../non-indexedDB/__event-interface.js'].includes(shimNS.fileName)) {
            indexeddbshim(window, Object.assign(baseCfg, {fullIDLSupport: true}));
            // https://github.com/w3c/webidl2.js/issues/426
            window.$$isHarnessTest = true;
        } else {
            indexeddbshim(window, baseCfg);
            // We will otherwise miss these tests (though not sure this is the best solution):
            //   see test_primary_interface_of in idlharness.js
            window.Object = Object;
            window.Object[Symbol.hasInstance] = function (inst) {
                return inst && typeof inst === 'object';
            };
        }

        // See <https://github.com/axemclion/IndexedDBShim/issues/280>
        /*
        ['DOMStringList', 'Event', 'CustomEvent', 'EventTarget' // These were having no effect due to https://github.com/jsdom/jsdom/issues/1720#issuecomment-279665105
        ].forEach((prop) => {
            // Object.defineProperty(window, prop, Object.getOwnPropertyDescriptor(window, 'Shim' + prop));
            Object.defineProperty(window[prop], 'prototype', {
                writable: false
            });
            window[prop].prototype[Symbol.toStringTag] = prop + 'Prototype';
        });
        // These overwrite jsdom's objects as needed by test checks
        // window.CustomEvent = window.ShimCustomEvent; // Used in events tests
        */

        const _setTimeout = window.setTimeout;
        window.setTimeout = function (cb, ms) { // Override to better ensure transaction has expired (otherwise we'd mostly need sync SQLite operations)
            _setTimeout(cb, ms + 500);
        };

        Object.defineProperty(window.CustomEvent.prototype, 'constructor', {
            enumerable: false
        });
        Object.setPrototypeOf(window.CustomEvent, window.Event);

        if (shimNS.fileName === 'file_support.sub.js') {
            const _getById = window.document.getElementById;
            // Getting `Error: element in different document or shadow tree`
            //  with this use
            window.document.getElementById = function (id) {
                if (id === 'file_input') {
                    const input = window.document.createElement('input');
                    input.id = 'file_input';
                    input.type = 'file';
                    return input;
                }
                return _getById.call(this, id);
            };
        }

        if (['../non-indexedDB/exceptions.js', '../non-indexedDB/constructor-object.js'].includes(shimNS.fileName)) {
            // These changes are for exceptions tests
            const _appendChild = window.document.documentElement.appendChild.bind(window.document.documentElement);
            window.document.documentElement.appendChild = function (...args) {
                if (args[0] === window.document) { // exceptions.js compares the DOMException thrown here with the global DOMException object
                    throw new window.DOMException('Hierarchy request error', 'HierarchyRequestError');
                }
                return _appendChild(...args);
            };
            const _bodyAppendChild = window.document.body.appendChild.bind(window.document.body);
            window.document.body.appendChild = function (...args) {
                const el = args[0];
                if (el.localName.toLowerCase() === 'iframe') {
                    const _onload = el.onload;
                    el.onload = function (e) {
                        const _appendChild = el.contentDocument.documentElement.appendChild.bind(el.contentDocument.documentElement);
                        el.contentWindow.DOMException = window.DOMException;
                        el.contentDocument.documentElement.appendChild = function (...args) {
                            if (args[0] === el.contentDocument) {
                                throw new window.DOMException('Hierarchy request error', 'HierarchyRequestError');
                            }
                            return _appendChild(...args);
                        };
                        return _onload(e);
                    };
                }
                return _bodyAppendChild(...args);
            };
            window.Error = Error; // For comparison of DOMException by constructor-object.js test
        } else if (['idbfactory-open-opaque-origin.js', 'idbfactory-deleteDatabase-opaque-origin.js'].includes(shimNS.fileName)) {
            const _createElement = window.document.createElement.bind(window.document);
            window.document.createElement = function (...args) {
                const elName = args[0];
                const el = _createElement(...args);
                if (elName === 'iframe') {
                    let _onload;
                    Object.defineProperties(el, {
                        /*
                        srcdoc: { // We need to have this run in its own sandbox or something
                            set () {

                            }
                        },
                        */
                        onload: {
                            set (val) {
                                _onload = val;
                            },
                            get () {
                                return function (e) {
                                    setTimeout(function () {
                                        _onload(e);
                                    });
                                };
                            }
                        }
                    });
                }
                return el;
            };
        }

        // window.XMLHttpRequest = XMLHttpRequest({basePath: 'http://localhost:8000/IndexedDB/'}); // Todo: We should support this too
        window.XMLHttpRequest = XMLHttpRequestConstr({basePath});
        window.XMLHttpRequest.prototype.overrideMimeType = function () { /* */ };
        window.fetch = function (...args) {
            if (args[0].startsWith('/')) {
                args[0] = 'http://localhost:8000' + args[0];
            }
            return fetch(...args);
        };

        global.ImageData = window.ImageData = ImageData;
        window.DOMPoint = DOMPoint;
        window.DOMMatrix = DOMMatrix;
        window.MessageChannel = MessageChannel;
        window.DOMMatrixReadOnly = window.DOMPointReadOnly =
            window.DOMRect = window.DOMRectReadOnly = function () {
                // Testing
            };

        global.XMLHttpRequest = window.XMLHttpRequest;
        // Expose the following to the `createObjectURL` polyfill
        delete window.URL.createObjectURL;
        global.URL = window.URL;
        // Polyfill enough for our tests
        const cou = require( // eslint-disable-line node/global-require
            '../node_modules/typeson-registry/polyfills/createObjectURL-cjs'
        );
        global.URL.createObjectURL = cou.createObjectURL;
        global.XMLHttpRequest.prototype.overrideMimeType = cou.xmlHttpRequestOverrideMimeType({
            polyfillDataURLs: true
        });

        delete require.cache[
            Object.keys(require.cache).find((path) => path.includes('createObjectURL'))
        ];

        window.Promise = Promise;
        window.Promise[Symbol.hasInstance] = function (inst) {
            return inst && typeof inst === 'object' && typeof inst.then === 'function';
        };

        window.Function = Function; // idlharness.any.js with check for `DOMStringList`'s prototype being the same Function.prototype (still true?)

        // Not deleting per https://github.com/jsdom/jsdom/issues/1720#issuecomment-279665105
        // Needed for avoiding test non-completion in '../non-indexedDB/interface-objects.js'
        Object.defineProperty(window, 'TreeWalker', {
            enumerable: false,
            writable: true,
            configurable: true,
            value () { /* */ }
        });

        // Patch postMessage to throw for SCA (as needed by tests in key_invalid.htm)
        const _postMessage = window.postMessage.bind(window);
        // Todo: Submit this as PR to jsdom
        window.postMessage = function (...args) {
            try {
                CY.clone(args[0]);
            } catch (cloneErr) {
                // Todo: Submit the likes of this as a PR to cyclonejs
                throw createDOMException('DataCloneError', 'Could not clone the message.');
            }
            _postMessage(...args);
        };
        window.Worker = Worker({
            relativePathType: 'file', // Todo: We need to change this to "url" when implemented
            // Todo: We might auto-detect this by looking at window.location
            basePath, // Todo: We need to change this to our server's base URL when implemented
            // basePath: path.join(__dirname, 'js')
            rootPath,
            permittedProtocols: ['http', 'https', 'blob']
        });
        window.Blob.prototype[Symbol.toStringTag] = 'Blob';
        window.File.prototype[Symbol.toStringTag] = 'File';
        window.FileList.prototype[Symbol.toStringTag] = 'FileList';

        // Needed by typeson-registry to revive clones
        // window.BigInt = global.BigInt;
        global.Blob = window.Blob;
        global.File = window.File;
        // keypath-special-identifiers.htm still relies on this property
        Object.defineProperty(global.File.prototype, 'lastModifiedDate', {
            configurable: true,
            get () {
                return new Date(this.lastModified);
            }
        });

        shimNS.window = window;

        vm.runInNewContext(allContent, sandboxObj, {
            displayErrors: true,
            timeout: vmTimeout
        });
    } catch (err) {
        console.log(err);
        // If there is an issue, save the last erring test along with our
        // custom test environment and the harness bundle; avoid some of our
        //  ESLint rules on this joined file to better notice any other
        //  issues between the code, custom environment, and harness
        const fileSave =
            '/' + '*' + shimNS.fileName + ':::' + err /* .replace(new RegExp('\\*' + '/', 'g'), '* /') */ + '*' + '/' +
            '/' + '* globals assert_equals, assert_array_equals, assert_unreached, async_test, EventWatcher, SharedWorkerGlobalScope, DedicatedWorkerGlobalScope, ServiceWorkerGlobalScope, WorkerGlobalScope *' + '/\n' +
            '/' + '*eslint-disable curly, no-unused-vars, no-self-compare, space-in-parens, no-extra-parens, spaced-comment, padded-blocks, no-useless-escape, func-call-spacing, comma-spacing, operator-linebreak, prefer-const, compat/compat, no-unneeded-ternary, space-unary-ops, object-property-newline, no-multiple-empty-lines, block-spacing, space-infix-ops, comma-dangle, no-template-curly-in-string, yoda, quotes, spaced-comment, no-var, key-spacing, camelcase, indent, semi, space-before-function-paren, eqeqeq, brace-style, no-array-constructor, keyword-spacing*' + '/\n' +
            allContent;
        try {
            await writeFile(path.join('test-support', 'latest-erring-bundled.js'), fileSave);
        } catch (err) {
            console.log(err);
        }
        shimNS.finished();
    }
}

async function readAndEvaluateFiles (jsFiles, workers, recursing) {
    jsFiles = jsFiles.filter((jsFile) => (/\.js/u).test(jsFile));
    if (!recursing && fileIndex) { // Start at a particular file count
        const start = Number.parseInt(fileIndex);
        const end = (endFileCount ? (start + Number.parseInt(endFileCount)) : jsFiles.length);
        await readAndEvaluateFiles(
            jsFiles.slice(start, end),
            workers,
            true
        );
        return;
    }
    let initial;
    try {
        initial = await readFile(path.join('test-support', 'environment.js'), 'utf8');
    } catch (err) {
        console.log(err);
        return;
    }

    // console.log(JSON.stringify(jsFiles)); // See what files we've got

    // Hard-coding problematic files for testing
    // jsFiles = ['idbcursor-continuePrimaryKey-exception-order.js'];
    // jsFiles = ['idlharness.any.js'];
    // jsFiles = ['transaction-lifetime-empty.js'];

    let ending;
    try {
        ending = await readFile(path.join('test-support', 'custom-reporter.js'), 'utf8');
    } catch (err) {
        console.log(err);
        return;
    }
    await readAndEvaluate(jsFiles, initial, ending, workers);
}

(async () => {
    try {
        switch (fileArg) {
        case 'good':
            await readAndEvaluateFiles(goodFiles);
            break;
        case 'bad':
            await readAndEvaluateFiles(badFiles);
            break;
        case 'timeout':
            await readAndEvaluateFiles(timeout);
            break;
        case 'notRunning':
            await readAndEvaluateFiles(notRunning);
            break;
        case 'domstringlist':
            await readAndEvaluateFiles(['domstringlist.js']);
            break;
        case 'events': case 'event':
            // Tests `EventTarget`, etc. shims
            await readAndEvaluateFiles([
                '../non-indexedDB/__event-interface.js',
                '../non-indexedDB/interface-objects.js'
            ]);
            break;
        case 'exceptions': case 'exception': case 'domexception':
            await readAndEvaluateFiles([
                '../non-indexedDB/DOMException-constructor.js',
                '../non-indexedDB/DOMException-constants.js',
                '../non-indexedDB/exceptions.js',
                '../non-indexedDB/constructor-object.js'
            ]);
            break;
        case 'workers': case 'worker': {
            let jsFiles;
            try {
                jsFiles = (await readdir(dirPath)).filter((file) => file.match(workerFileRegex));
            } catch (err) {
                console.log(err);
                return;
            }
            await readAndEvaluateFiles(jsFiles, true);
            break;
        } default: {
            if (!fileIndex && fileArg && fileArg !== 'all') {
                await readAndEvaluateFiles([fileArg], true); // Allow specific worker files to be passed
                break;
            }
            let files;
            try {
                files = await readdir(dirPath);
            } catch (err) {
                console.log(err);
                return;
            }
            await readAndEvaluateFiles(files);
            break;
        }
        }
    } catch (err) {
        console.log(err);
    }
})();

async function readAndJoinFiles (arr, i = 0, str = '') {
    const filename = arr[i];
    if (!filename) { // || i === arr.length - 1) {
        return str;
    }
    let data;
    try {
        data = await readFile(filename, 'utf8');
    } catch (err) {
        console.log(err);
        throw err;
    }
    str += '/*jsfilename:' + filename + '*/\n\n' + data;
    return readAndJoinFiles(arr, i + 1, str);
}

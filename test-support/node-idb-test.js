// Todo: Reuse any relevant portions in this file or `node-buildjs.js` for adapting tests for browser shimming
const fs = require('fs');
const path = require('path');
const {goodFiles, badFiles, notRunning, timeout} = require('./node-good-bad-files');
const vm = require('vm');
const jsdom = require('jsdom');
const CY = require('cyclonejs');
const Worker = require('./webworker/webworker'); // Todo: We could export this `Worker` publicly for others looking for a Worker polyfill with IDB support
const XMLHttpRequest = require('xmlhttprequest');
const URL = require('js-polyfills/url');
const isDateObject = require('is-date-object');

// CONFIG
const vmTimeout = 40000; // Time until we give up on the vm (increasing to 40000 didn't make a difference on coverage in earlier versions)
// const intervalSpacing = 1; // Time delay after test before running next

// SET-UP
const fileArg = process.argv[2];
const fileIndex = (/^-?\d+$/).test(fileArg) ? fileArg : (process.argv[3] || undefined);
const endFileCount = (/^-?\d+$/).test(fileArg) && (/^-?\d+$/).test(process.argv[3]) ? process.argv[3] : (process.argv[4] || undefined);
const dirPath = path.join('test-support', 'js');
const idbTestPath = 'web-platform-tests';
const indexeddbshim = require('../dist/indexeddbshim-UnicodeIdentifiers-node');
const workerFileRegex = /^(_service-worker-indexeddb\.https\.js|(_interface-objects-)?00\d(\.worker)?\.js)$/;
// const indexeddbshimNonUnicode = require('../dist/indexeddbshim-node');

const shimNS = {
    colors: require('colors/safe'),
    fileName: '',
    finished: function () { throw new Error('Finished callback not set'); },
    write: function (msg) {
        (process && process.stdout && process.stdout.isTTY) ? process.stdout.write(msg) : console.log(msg);
    },
    writeln: function (msg) {
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
process.on('uncaughtException', function(err) {
    // handle the error safely
    console.log('idbshim uncaught error:' + err)
});
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
*/
function readAndEvaluate (jsFiles, initial = '', ending = '', workers = false, item = 0) {
    shimNS.fileName = jsFiles[item];
    shimNS.finished = () => {
        ct += 1;
        function finishedCheck () {
            function cleanJSONOutput (...args) {
                return JSON.stringify(...args).replace(/"/g, "'").replace(/','/g, "', '");
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
                readAndEvaluate(jsFiles, initial, ending, workers, ++item);
                // }, intervalSpacing);
                return;
            }
            shimNS.files['Files with all tests passing'] = shimNS.files.Pass.filter((p) =>
                !shimNS.files.Fail.includes(p) &&
                !shimNS.files.Timeout.includes(p) &&
                !shimNS.files['Not Run'].includes(p)
            );
            console.log('\nTest files by status (may recur):');
            console.log(
                // Object.entries(shimNS.files).reduce((_, [status, files]) => { // Sometimes failing in Node 6.9.2
                Object.keys(shimNS.files).reduce((_, status) => {
                    const files = shimNS.files[status];
                    if (!files.length) {
                        return _ + '  ' + status + ': 0\n';
                    }
                    return _ + '  ' + status + ' (' + files.length + '): [\n    ' + cleanJSONOutput(files).slice(1, -1) + '\n  ]\n';
                }, '\n')
            );

            console.log('  Number of files processed: ' + (ct - excludedCount));

            console.log('\nNumber of total tests by status:');
            shimNS.statuses['Total tests'] = Object.values(shimNS.statuses).reduce((ct, statusCt) => ct + statusCt);
            console.log(
                cleanJSONOutput(shimNS.statuses, null, 2) + '\n'
            );
            if (shimNS.fileMap) {
                console.log(
                    [...shimNS.fileMap].reduce(
                        (str, [fileName, [passing, total]]) =>
                            str + fileName + ': ' + passing + '/' + total + '\n',
                        ''
                    )
                );
                shimNS.fileMap.clear(); // Release memory
            }
            if (excluded.length) {
                console.log('Please note that the following tests are being deliberately excluded as we do not yet have the built-in support for their features (e.g., shared and service workers), and they are not currently allowing the other tests to complete: ' + cleanJSONOutput(excluded));
            }
            if (shimNS.jsonOutput) {
                const jsonOutputPath = path.join(
                    'test-support', 'json-output' +
                    // new Date().getTime() +
                    '.json'
                );
                fs.writeFile(jsonOutputPath, JSON.stringify(shimNS.jsonOutput, null, 2), function (err) {
                    if (err) { console.log(err); return; }
                    console.log('Saved to ' + jsonOutputPath);
                    process.exit();
                });
            } else {
                process.exit();
            }
        }
        finishedCheck();
    };

    // Exclude those currently breaking the tests
    // Todo: Replace with `uncaughtException` handlers above?
    let excluded = [];
    if (jsFiles.length > 1) {
        excluded = workers
            // Keep these arrays even if made empty for sake of any new breaking W3C tests
            ? [
                '_interface-objects-003.js',
                '_interface-objects-004.js'
            ] : [
                'bindings-inject-key.js',
                'keypath-exceptions.js'
            ];
        if (excluded.includes(shimNS.fileName) || (!workers && workerFileRegex.test(shimNS.fileName))) {
            excludedCount++;
            shimNS.finished();
            return;
        }
    }

    fs.readFile(path.join(dirPath, shimNS.fileName), 'utf8', function (err, content) {
        if (err) { return console.log(err); }

        const scripts = [];
        const supported = [
            'resources/testharness.js', 'resources/testharnessreport.js',
            'resources/idlharness.js', 'resources/WebIDLParser.js',
            'support.js', 'support-promises.js', 'service-workers/service-worker/resources/test-helpers.sub.js'
        ];
        // Use paths set in node-buildjs.js (when extracting <script> tags and joining contents)
        content.replace(/beginscript::(.*?)::endscript/g, (_, src) => {
            // Fix paths for known support files and report new ones (so we can decide how to handle)
            if (supported.includes(src) || supported.includes(src.replace(/^\//, ''))) {
                src = src.replace(/^\//, '');
                scripts.push(path.join(idbTestPath,
                    // Since the `interfaces.worker.js` Worker script requires this file too,
                    //    and as our build script is now copying it, we actually don't need this now,
                    //    but keeping comment in case this possibility is later closed
                    // src === 'resources/WebIDLParser.js' // See https://github.com/w3c/testharness.js/issues/231
                    // This file should be rewritten by `web-platform-tests/tools/serve/serve`,
                    //   but as we are allowing testing independently of this environment (and
                    //   are using file loading as opposed to URL loading mechanisms in our
                    //   testing) we just map it to the source file which appears to be rendered
                    //   unmodified
                    // ? 'resources/webidl2/lib/webidl2.js' : ()
                    ((/^(service-workers|resources)/).test(src)
                        ? src
                        : 'IndexedDB/' + src)
                ));
            } else {
                console.log('missing?:' + src);
            }
        });

        readAndJoinFiles(
            scripts,
            function (harnessContent) {
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
                jsdom.env({
                    // Todo: We should get this working with our test server; should work with `XMLHttpRequest` base
                    // url: 'http://localhost:9999/web-platform-tests/IndexedDB/interfaces.html',
                    url: 'http://localhost:8000/IndexedDB/interfaces.html', // Leverage the W3C server for interfaces test (assuming it is running); as we are overriding XMLHttpRequest below, we are not really using this at the moment, but to set up, see https://github.com/w3c/web-platform-tests
                    // url: 'file://' + basePath,
                    done: function () {
                        try {
                            // Should only pass in safe objects
                            const sandboxObj = {
                                console,
                                shimNS
                            };

                            const doc = jsdom.jsdom('<div id="log"></div>', {});
                            const window = doc.defaultView; // eslint-disable-line no-var

                            // Todo: We are failing one W3C interfaces test (and possibly obscuring bugs in other tests) because
                            //    jsdom is apparently having problems with `Object.defineProperty` and accessor descriptors (or
                            //    with `Object.getOwnPropertyDescriptor` when retrieving them); see https://github.com/tmpvar/jsdom/issues/1720
                            //    Thus, `indexedDB`, despite being set in `setGlobalVars`with a getter, is not retained as such when checked by the test.

                            // Todo: We might switch based on file to normally try non-Unicode version or otherwise exclude properties as
                            //   some of these do incur a significant performance cost which could speed up the testing process if avoided,
                            //   though it could also make the tests more fragile to changes
                            // indexeddbshimNonUnicode(window);
                            if (['interfaces.js', 'interfaces.worker.js'].includes(shimNS.fileName)) {
                                indexeddbshim(window, {addNonIDBGlobals: true, fullIDLSupport: true});
                            } else {
                                indexeddbshim(window, {addNonIDBGlobals: true});
                            }

                            // Though we could expose `DOMStringList` through the shim, we want to avoid automatically shadowing it in case it may exist already in the browser
                            Object.defineProperty(window, 'DOMStringList', {
                                enumerable: false,
                                configurable: true,
                                get: function () {
                                    return window.ShimDOMStringList;
                                }
                            });
                            window.Event = window.ShimEvent;
                            window.CustomEvent = window.ShimCustomEvent;
                            window.EventTarget = window.ShimEventTarget;
                            window.DOMException = window.ShimDOMException;

                            // window.XMLHttpRequest = XMLHttpRequest({basePath: 'http://localhost:8000/IndexedDB/'}); // Todo: We should support this too
                            window.XMLHttpRequest = XMLHttpRequest({basePath});
                            window.URL = URL.URL;
                            window.URLSearchParams = URL.URLSearchParams;
                            // We will otherwise miss these tests (though not sure this is the best solution):
                            //   see test_primary_interface_of in idlharness.js
                            window.Object = Object;
                            window.Object[Symbol.hasInstance] = function (inst) { return inst && typeof inst === 'object'; };

                            window.Function = Function; // interfaces.js with check for `DOMStringList`'s prototype being the same Function.prototype

                            // We need to overcome the `value.js` test's `instanceof` checks as our IDB object is injected rather than inline
                            // jsdom didn't like us overriding directly or only operating on them as `window` properties
                            const _Array = window.Array;
                            Object.defineProperty(_Array, Symbol.hasInstance, {
                                value: obj => Array.isArray(obj)
                            });
                            sandboxObj.Array = _Array;
                            const _Date = window.Date;
                            Object.defineProperty(_Date, Symbol.hasInstance, {
                                value: obj => isDateObject(obj)
                            });
                            sandboxObj.Date = _Date;

                            // Patch postMessage to throw for SCA (as needed by tests in key_invalid.htm)
                            const _postMessage = window.postMessage.bind(window);
                            // Todo: Submit this as PR to jsdom
                            window.postMessage = function (...args) {
                                try {
                                    CY.clone(args[0]);
                                } catch (cloneErr) {
                                    // Todo: Submit the likes of this as a PR to cyclonejs
                                    throw window.indexedDB.utils.createDOMException('DataCloneError', 'Could not clone the message.');
                                }
                                _postMessage(...args);
                            };
                            window.Worker = Worker({
                                relativePathType: 'file', // Todo: We need to change this to "url" when implemented
                                // Todo: We might auto-detect this by looking at window.location
                                basePath, // Todo: We need to change this to our server's base URL when implemented
                                // basePath: path.join(__dirname, 'js')
                                rootPath
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
                            fs.writeFile(path.join('test-support', 'latest-erring-bundled.js'), fileSave, function (err) {
                                if (err) { return console.log(err); }
                            });
                            shimNS.finished();
                        }
                    }
                });
            }
        );
    });
}

function readAndEvaluateFiles (err, jsFiles, workers, recursing) {
    if (err) { return console.log(err); }
    if (!recursing && fileIndex) { // Start at a particular file count
        const start = parseInt(fileIndex, 10);
        const end = (endFileCount ? (start + parseInt(endFileCount, 10)) : jsFiles.length);
        readAndEvaluateFiles(
            err,
            jsFiles.slice(start, end),
            workers,
            true
        );
        return;
    }
    fs.readFile(path.join('test-support', 'environment.js'), 'utf8', function (err, initial) {
        if (err) { return console.log(err); }

        // console.log(JSON.stringify(jsFiles)); // See what files we've got

        // Hard-coding problematic files for testing
        // jsFiles = ['idbcursor-continuePrimaryKey-exception-order.js'];
        // jsFiles = ['interfaces.js'];
        // jsFiles = ['transaction-lifetime-empty.js'];

        fs.readFile(path.join('test-support', 'custom-reporter.js'), 'utf8', function (err, ending) {
            if (err) { return console.log(err); }
            readAndEvaluate(jsFiles, initial, ending, workers);
        });
    });
}

switch (fileArg) {
case 'good':
    readAndEvaluateFiles(null, goodFiles);
    break;
case 'bad':
    readAndEvaluateFiles(null, badFiles);
    break;
case 'timeout':
    readAndEvaluateFiles(null, timeout);
    break;
case 'notRunning':
    readAndEvaluateFiles(null, notRunning);
    break;
case 'events': case 'event':
    // Tests `EventTarget` shim
    readAndEvaluateFiles(null, ['../non-indexedDB/__event.js']);
    break;
case 'workers': case 'worker':
    fs.readdir(dirPath, function (err, jsFiles) {
        jsFiles = jsFiles.filter((file) => file.match(workerFileRegex));
        readAndEvaluateFiles(err, jsFiles, true);
    });
    break;
default:
    if (!fileIndex && fileArg && fileArg !== 'all') {
        readAndEvaluateFiles(null, [fileArg], true); // Allow specific worker files to be passed
        break;
    }
    fs.readdir(dirPath, readAndEvaluateFiles);
    break;
}

function readAndJoinFiles (arr, cb, i = 0, str = '') {
    const filename = arr[i];
    if (!filename) { // || i === arr.length - 1) {
        return cb(str);
    }
    fs.readFile(filename, 'utf8', function (err, data) {
        if (err) { return console.log(err); }
        str += '/*jsfilename:' + filename + '*/\n\n' + data;
        readAndJoinFiles(arr, cb, i + 1, str);
    });
}

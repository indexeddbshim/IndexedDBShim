/* eslint-disable n/no-sync -- Convenient */
// Launcher script for WebWorkers.
//
// Sets up context and runs a worker script. This is not intended to be
// invoked directly. Rather, it is invoked automatically when constructing a
// new Worker() object.
//
//      usage: node worker.js <sock> <script>
//
//      The <sock> parameter is the filesystem path to a UNIX domain socket
//      that is listening for connections. The <script> parameter is the
//      path to the JavaScript source to be executed as the body of the
//      worker.
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import util from 'util';
import http from 'http';
import WebSocket from 'ws';
import xmlHttpRequest from 'local-xmlhttprequest';
import Blob from 'w3c-blob'; // Needed by Node; uses native if available (browser)
import fetch from 'isomorphic-fetch';
import * as wwutil from './webworker-util.js';
// Had problems with npm and the following when requiring `webworkers`
//   as a separate repository (due to indirect circular dependency?);
// import indexeddbshim from 'indexeddbshim';
import indexeddbshim from '../../src/node-UnicodeIdentifiers.js';
import worker from './webworker.js';
// import isDateObject from 'is-date-object'; // Not needed in worker tests as in main thread tests
/*
const permittedProtocols;
try {
    permittedProtocols = JSON.parse(process.argv[6])
} catch (err) {
    throw new Error('There was an error processing the permitted protocols argument (which must be a valid stringified JSON object)');
}
*/

if (process.argv.length < 4) {
    throw new Error('usage: node worker.js <sock> <script>');
}

const workerCtx = {};
const sockPath = process.argv[2];
let workerURL = process.argv[3];
const scriptLoc = new wwutil.WorkerLocation(workerURL);
// Connect to the parent process

const workerOptions = {
    type: process.argv[4], // "classic" (default), "module"
    credentials: process.argv[5] // "omit" (if type=module), "include", "same-origin"
};
const workerConfig = {
    // Whether to add basic Node globals and require capability to worker
    node: process.argv[6] === 'true',

    // "file", "url" - determines Worker `src` argument interpretation; defaults to "url"
    //       relative paths will be relative to `basePath`; absolute paths will be relative to `rootPath`
    relativePathType: process.argv[7],

    // The base path for pathType="url" defaults to `localhost`; the base path for pathType="file"; defaults to the current working directory; if `false`, will throw upon relative paths
    basePath: process.argv[8] === 'false' ? false : process.argv[8],
    rootPath: process.argv[9],
    // Used for the `Origin` header (may be `null`); if `*` will cause cross-origin restrictions to be ignored
    origin: process.argv[10]
};

// Catch exceptions
//
// This implements the Runtime Script Errors section fo the Web Workers API
// specification at
//
//  http://www.whatwg.org/specs/web-workers/current-work/#runtime-script-errors
//
// Todo: There are all sorts of pieces of the error handling spec that are not
//      being done correctly. Pick a clause, any clause.
let inErrorHandler = false;

// Set up the context for the worker instance
let workerCtxObj;
let prom;

// Per https://fetch.spec.whatwg.org/#cors-protocol-and-credentials
//    Following response headers:
//        `Access-Control-Allow-Origin`=[Submitted `Origin` including possibly `null`] or `*`
//        `Access-Control-Allow-Credentials`=`true`/undefined
//    ...if credentials=omit (which needs type=module); if 1st header not malformed, share (otherwise don't share)
//    ...if credentials=include; if 1st header is not `*` AND 2nd header is present and not malformed, share (otherwise don't share)
//    ...if credentials=same-origin; only share if same origin (no prior preflight (which is always omit) needed or follow include share requirements?)
//    Should be following credentials flag also:
//        credentials flag = credentials=include or credentials=same-origin & response-tainting=basic (not cors or opaque)
// See also https://html.spec.whatwg.org/multipage/webappapis.html#fetch-a-module-worker-script-tree

/*
const workerOptions = {
    type: process.argv[4], // "classic" (default), "module"
    credentials: process.argv[5] // "omit" (if type=module), "include", "same-origin"
};
const workerConfig = {
    node: process.argv[6] === 'true', // Whether to add basic Node globals and require capability to worker
    relativePathType: process.argv[7], // "file", "url" - determines Worker `src` argument interpretation; defaults to "url"
                                        //       relative paths will be relative to `basePath`
    basePath: process.argv[8], // The base path for pathType="url" defaults to `localhost`; the base path for pathType="file" defaults to the current working directory; if `false`, will throw upon relative paths
    rootPath: process.argv[9],
    origin: process.argv[10] // Used for the `Origin` header (may be `null`); if `*` will cause cross-origin restrictions to be ignored
};
*/

// Construct the Script object to host the worker's code
switch (scriptLoc.protocol) {
case 'file':
    if ([/interfaces\.any\.js$/u, /interfaces\.any\.worker\.js$/u].some((interfaceFileRegex) => interfaceFileRegex.test(workerURL))) {
        workerURL = workerURL.replace(/.*web-platform-tests/u, 'http://web-platform.test:8000');
        prom = new Promise((resolve) => { // eslint-disable-line promise/avoid-new -- No API
            http.get(workerURL, (res) => {
                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    resolve(rawData);
                });
            }).on('error', (e) => {
                console.error(`Got error: ${e.message}`);
            });
        });
    } else {
        prom = Promise.resolve(
            fs.readFileSync(scriptLoc.pathname.replace(/\/$/u, ''))
        ); // Latter replace needed on Mac but not Windows
    }
    break;

default:
    throw new Error(
        'Cannot load script from unknown protocol \'' + scriptLoc.protocol
    );
}

prom.then((scriptSource) => {
    const ws = new WebSocket('ws+unix://' + sockPath);
    const ms = new wwutil.MsgStream(ws);

    /**
     * @param {Error} e
     * @returns {void}
     */
    const exceptionHandler = function (e) {
        if (!inErrorHandler && workerCtx.onerror) {
            inErrorHandler = true;
            workerCtx.onerror(e);
            inErrorHandler = false;

            return;
        }

        // Don't bother setting inErrorHandler here, as we're already delivering
        // the event to the master anyway
        ms.send([wwutil.MSGTYPE_ERROR, {
            message: wwutil.getErrorMessage(e),
            filename: wwutil.getErrorFilename(e),
            lineno: wwutil.getErrorLine(e),
            stack: e.stack
        }]);
    };

    /**
     * Message handling function for messages from the master.
     * @param {[0|1|2|100]} msg
     * @param {FileDescriptor} fd
     * @returns {void}
     */
    const handleMessage = function (msg, fd) {
        if (!wwutil.isValidMessage(msg)) {
            wwutil.debug('Received invalid message: ' + util.inspect(msg));
            return;
        }

        switch (msg[0]) {
        case wwutil.MSGTYPE_NOOP:
            break;

        case wwutil.MSGTYPE_CLOSE:
            // Conform to the Web Workers API for termination
            workerCtx.closing = true;

            // Close down the event sources that we know about
            ws.close();

            // Request that the worker perform any application-level shutdown
            if (workerCtx.onclose) {
                workerCtx.onclose();
            }

            break;

        case wwutil.MSGTYPE_USER:
            // Todo: I have no idea what the event object here should really look
            //      like. I do know that it needs a 'data' elements, though.
            if (workerCtx.onmessage || workerCtx.eventHandlers.message.length > 0) {
                const e = {data: msg[1]};

                if (fd) {
                    e.fd = fd;
                }

                if (workerCtx.onmessage) {
                    workerCtx.onmessage(e);
                }

                for (let i = 0; i < workerCtx.eventHandlers.message.length; i++) {
                    workerCtx.eventHandlers.message[i](e);
                }
            }

            break;

        default:
            wwutil.debug('Received unexpected message: ' + util.inspect(msg));
            break;
        }
    };
    // Once we connect successfully, set up the rest of the world
    ws.addListener('open', function () {
        // When we receive a message from the master, react and possibly
        // dispatch it to the worker context
        ms.addListener('msg', handleMessage);

        // Register for uncaught events for delivery to workerCtx.onerror
        process.addListener('uncaughtException', exceptionHandler);

        // Execute the worker
        vm.runInContext(scriptSource, workerCtxObj);
    });
    // Context elements required for node.js
    //
    // Todo: How to allow user to customize configuration here????
    if (workerConfig.node) {
        workerCtx.global = workerCtx;
        workerCtx.process = process;
        // workerCtx.require = require;
        workerCtx.__filename = scriptLoc.pathname;
        workerCtx.__dirname = path.dirname(scriptLoc.pathname);
    }

    workerCtx.console = console;
    ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'].forEach((prop) => {
        workerCtx[prop] = global[prop];
    });

    // Context elements required by the WebWorkers API spec
    workerCtx.postMessage = function (msg) {
        ms.send([wwutil.MSGTYPE_USER, msg]);
    };
    workerCtx.WorkerGlobalScope = workerCtx;

    // Todo: In place of this, allow conditionally `SharedWorkerGlobalScope`, or `ServiceWorkerGlobalScope`
    workerCtx.DedicatedWorkerGlobalScope = workerCtx;
    // This was needed for testharness' `instanceof` check which requires it to be callable: `self instanceof DedicatedWorkerGlobalScope`
    // workerCtx.DedicatedWorkerGlobalScope[Symbol.hasInstance] = function (inst) { return inst.WorkerGlobalScope && !inst.SharedWorkerGlobalScope && !inst.ServiceWorkerGlobalScope; };

    workerCtx.location = scriptLoc;
    workerCtx.closing = false;
    workerCtx.close = function () {
        // eslint-disable-next-line unicorn/no-process-exit -- Needed
        process.exit(0);
    };
    workerCtx.eventHandlers = {message: []};
    workerCtx.addEventListener = function (event, handler) {
        if (event in workerCtx.eventHandlers) {
            workerCtx.eventHandlers[event].push(handler);
        }
    };
    workerCtx.removeEventListener = function (event, handler) {
        if (event in workerCtx.eventHandlers) {
            const handlerPos = workerCtx.eventHandlers[event].indexOf(handler);
            if (handlerPos !== -1) {
                workerCtx.eventHandlers[event].splice(handlerPos, 1);
            }
        }
    };
    workerCtx.importScripts = function (...args) {
        if (workerOptions.type === 'module') {
            // https://html.spec.whatwg.org/multipage/workers.html#importing-scripts-and-libraries
            throw new TypeError('For modules, `importScripts` should not be used. Use `import` statements instead.');
        }
        // Todo: Support URL/absolute file paths
        for (const arg of args) {
            // Todo: Handle pathType="url" (defaults to `localhost`) and if basePath is `false` with it
            const currentPath = (/^[\\/]/u).test(arg) // Root
                ? workerConfig.pathType === 'file' && workerConfig.rootPath === false ? process.cwd() : workerConfig.rootPath
                : workerConfig.pathType === 'file' && workerConfig.basePath === false ? process.cwd() : workerConfig.basePath;
            /*
            console.log(path.join(
                currentPath,
                arg
            ));
            */
            try {
                vm.runInContext(
                    fs.readFileSync(
                        path.join(
                            currentPath,
                            arg
                        )
                    ),
                    workerCtxObj
                );
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    };

    workerCtx.prototype = Object.create(workerCtx); // Must have a prototype per WebIDL tests when checking on `WorkerGlobalScope`
    Object.defineProperty(workerCtx.prototype, 'indexedDB', {
        enumerable: true,
        configurable: true,
        get () {
            throw new TypeError('Illegal invocation');
        }
    });

    // Other Objects

    // Todo: Allow argument to overturn `checkOrigin` when doing opaque origin tests
    const baseCfg = {checkOrigin: false, databaseNameLengthLimit: 1000, addNonIDBGlobals: true};
    // Add indexedDB globals; we also add non-IndexedDB ones that are not normally "exposed" to workers
    // Only the second regex will ever be used, but just listing the files that should get fullIDLSupport
    if ([/interfaces\.any\.js$/u, /interfaces\.any\.worker\.js$/u].some((interfaceFileRegex) => interfaceFileRegex.test(workerURL))) {
        indexeddbshim(workerCtx, Object.assign(baseCfg, {fullIDLSupport: true}));
    } else {
        indexeddbshim(workerCtx, baseCfg);
    }

    // We don't expose workerCtx.ShimDOMStringList as not supposed to be per IDL tests for workers (though IDL (and Chrome) currently expose it in the main thread)
    workerCtx.Event = workerCtx.ShimEvent;
    workerCtx.CustomEvent = workerCtx.ShimCustomEvent;
    workerCtx.EventTarget = workerCtx.ShimEventTarget;
    workerCtx.DOMException = workerCtx.ShimDOMException;

    workerCtx.XMLHttpRequest = xmlHttpRequest({basePath: workerConfig.basePath});
    workerCtx.URL = URL;
    workerCtx.URLSearchParams = URLSearchParams;

    workerCtx.Worker = worker({
        relativePathType: 'file', // Todo: We need to change this to "url" when implemented
        // Todo: We might auto-detect this by looking at window.location
        basePath: workerConfig.basePath, // Todo: We need to change this to our server's base URL when implemented
        // basePath: path.join(__dirname, 'js')
        rootPath: workerConfig.rootPath
    });

    // We will otherwise miss these tests (though not sure this is the best solution):
    //   see test_primary_interface_of in idlharness.js
    workerCtx.Object = Object;
    // workerCtx.Object[Symbol.hasInstance] = function (inst) { return inst && typeof inst === 'object'; };

    workerCtx.Function = Function; // idlharness.any.js with check for `DOMStringList`'s prototype being the same Function.prototype (still true?)

    workerCtx.Blob = Blob;
    workerCtx.fetch = function (...args) {
        if (args[0].startsWith('/')) {
            args[0] = 'http://web-platform.test:8000' + args[0];
        }
        return fetch(...args);
    };

    // Todo: A good Worker polyfill would implement these as possible and
    //   if exposing we should do so; for W3C IndexedDB or IndexedDB-related tests,
    //   however, they do not currently require a working implementation except to
    //   check that they exist
    [
        'SharedWorker', 'MessagePort', 'MessageEvent', 'WorkerNavigator',
        'MessageChannel', 'WorkerLocation', 'ImageData', 'ImageBitmap',
        'CanvasPath', 'Path2D', 'PromiseRejectionEvent', 'EventSource',
        'WebSocket', 'CloseEvent', 'BroadcastChannel',
        'XMLHttpRequestEventTarget', 'XMLHttpRequestUpload',
        'ProgressEvent', 'FormData', 'File', 'FileList', 'FileReader',
        'FileReaderSync', 'ErrorEvent', 'ReadableStream', 'WritableStream',
        'ByteLengthQueuingStrategy', 'CountQueuingStrategy',
        'CanvasGradient', 'CanvasPattern', 'TextMetrics'
    ].forEach((prop) => {
        workerCtx[prop] = function () {
            throw new Error(prop + ' not implemented');
        };
    });
    workerCtx.self = workerCtx;

    // Context object for vm script api
    workerCtxObj = vm.createContext(workerCtx);
    return undefined;
}).catch((err) => {
    throw err;
});

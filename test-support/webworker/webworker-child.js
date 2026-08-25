/* eslint-disable n/no-sync -- Convenient */
/* eslint-disable unicorn/no-top-level-assignment-in-function -- Temporary */
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
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import util from 'node:util';
import http from 'node:http';
import {MessageChannel} from 'node:worker_threads';
import {WebSocket} from 'ws';
import xmlHttpRequest from 'local-xmlhttprequest';
import fetch from 'isomorphic-fetch';
import * as wwutil from './webworker-util.js';
// Had problems with npm and the following when requiring `webworkers`
//   as a separate repository (due to indirect circular dependency?);
// import indexeddbshim from 'indexeddbshim';
import indexeddbshim from '../../src/node-UnicodeIdentifiers.js';
import worker from './webworker.js';
import nodeReplacementHacks from '../node-replacement-hacks.js';
import isDateObject from 'is-date-object';
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
let scriptLoc = new wwutil.WorkerLocation(workerURL);
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
const isSharedWorker = process.argv[11] === 'true';

// Catch exceptions
//
// This implements the Runtime Script Errors section fo the Web Workers API
// specification at
//
//  https://www.whatwg.org/specs/web-workers/current-work/#runtime-script-errors
//
// Todo: There are all sorts of pieces of the error handling spec that are not
//      being done correctly. Pick a clause, any clause.
let inErrorHandler = false;

// Set up the context for the worker instance
let ws, ms;
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
case 'data': {
    // Decode directly from the original `data:[<mediatype>][;base64],<data>`
    //   string rather than `scriptLoc.pathname`: `WorkerLocation` runs
    //   `path.normalize` on the pathname for every protocol, which would
    //   corrupt a base64 payload containing `/`-delimited sequences that
    //   happen to look like path segments to normalize away.
    const commaIndex = workerURL.indexOf(',');
    const meta = workerURL.slice('data:'.length, commaIndex);
    const payload = workerURL.slice(commaIndex + 1);
    prom = Promise.resolve(
        meta.endsWith(';base64')
            ? Buffer.from(payload, 'base64').toString('utf8')
            : decodeURIComponent(payload)
    );
    break;
}

case 'file':
    // `makeFileURL` appends a trailing `/` to every `file://` URL it builds
    //   (see `webworker-util.js`), so allow for one here.
    if ((/\.any\.worker\.js\/?$/v).test(workerURL)) {
        // WPT's `wptserve` generates `<name>.any.worker.js` on the fly from
        //   `<name>.any.js` (resolving its `importScripts`/support-file
        //   references) -- it is never a real file on disk, so it has to be
        //   fetched from the live server rather than read locally.
        // eslint-disable-next-line unicorn/prefer-https -- Local
        workerURL = workerURL.replace(/.*web-platform-tests/v, 'http://web-platform.test:8000').replace(/\/$/v, '');
        // `self.location`/`self.location.pathname` (set from `scriptLoc`
        //   below) must reflect the URL actually used to fetch this
        //   worker's content -- the canonical, short `/IndexedDB/...` WPT
        //   path -- not the long local filesystem path `scriptLoc` was
        //   originally built from above. Left stale, `location.pathname`
        //   would be a full local disk path (e.g.
        //   `/Users/.../web-platform-tests/IndexedDB/foo.any.worker.js`),
        //   which some tests (e.g. `resources/support-promises.js`'s
        //   `databaseName()`) fold into a SQLite filename; combined with a
        //   long enough WPT test name and SQLite's own `-journal`/`-wal`
        //   suffix, that can exceed the OS's filename length limit and
        //   fail with a generic SQLITE_CANTOPEN, with no indication the
        //   real cause was an overlong, wrongly-local `location.pathname`.
        scriptLoc = new wwutil.WorkerLocation(workerURL);
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
            fs.readFileSync(scriptLoc.pathname.replace(/\/$/v, ''))
        ); // Latter replace needed on Mac but not Windows
    }
    break;

case 'http:':
case 'https:':
    prom = fetch(workerURL).then((res) => res.text());
    break;

default:
    throw new Error(
        'Cannot load script from unknown protocol \'' + scriptLoc.protocol
    );
}

const startWorker = (scriptSource) => {
    ws = new WebSocket('ws+unix://' + sockPath);
    ms = new wwutil.MsgStream(ws);

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
                // See the matching comment in `webworker.js`'s `handleMessage`.
                const e = {data: msg[1], source: null};

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

        // Minimal `SharedWorker` support: dispatch a single synthetic
        //   `connect` event, now that the worker script (run synchronously
        //   above) has had a chance to register its listeners. There is no
        //   real MessagePort here -- `port.postMessage` just reuses the same
        //   IPC channel `self.postMessage` already sends over, since this
        //   shim only supports a single, immediately-connected client (see
        //   `WebSharedWorker` in `webworker.js`).
        if (isSharedWorker) {
            const port = {
                postMessage: workerCtx.postMessage,
                addEventListener () { /* No-op: this shim never emits port-level events */ },
                removeEventListener () { /* No-op */ },
                start () { /* No-op */ },
                close () { /* No-op */ }
            };
            const connectEvent = {ports: [port], source: port};
            if (workerCtx.onconnect) {
                workerCtx.onconnect(connectEvent);
            }
            workerCtx.eventHandlers.connect.forEach((handler) => handler(connectEvent));
        }
    });
};
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
['clearTimeout', 'setInterval', 'clearInterval'].forEach((prop) => {
    workerCtx[prop] = global[prop];
});
// Unlike the window context (`node-idb-test.js`, which no longer needs
//   this now that `nodeSQLiteDatabase.js` defers its SQL callback via
//   `setImmediate` rather than `setTimeout(..., 0)`), a worker's script
//   runs in a real, separate child process reached over a Unix-domain-
//   socket-wrapped WebSocket (see `webworker.js`) -- that round-trip
//   adds real latency `setImmediate`'s tighter deferral doesn't cover,
//   so tests relying on a transaction having genuinely finished by the
//   time a `setTimeout` fires (e.g. idbcursor-advance-exception-order.
//   any.worker.js's "TransactionInactiveError vs. InvalidStateError"
//   cases) still need this grace period here.
/**
 *
 * @param {() => void} cb
 * @param {number} ms
 * @returns {NodeJS.Timeout}
 */
workerCtx.setTimeout = function (cb, ms) {
    return global.setTimeout(() => {
        if (workerCtx.IDBTransaction && workerCtx.IDBTransaction.activeTransactions) {
            for (const tx of workerCtx.IDBTransaction.activeTransactions) {
                tx.__handlerActive = false;
            }
        }
        return cb();
    }, (ms || 0) + 500);
};

// `indexeddbshim(workerCtx, ...)` below installs `IDBKeyRange`/
//   `IDBObjectStore`/etc. using THIS process's own `src/DOMException.js`/
//   `Key.js` module copies, which resolve bare `TypeError`/`DOMException`
//   via normal Node module scope -- i.e. this process's native globals.
//   Once `workerCtx` is contextified below, code evaluated inside that
//   context gets its OWN, different native `TypeError`/`DOMException`,
//   so an assertion like `assert_throws_js(TypeError, ...)` comparing
//   against that inner one would never match what the shim actually
//   throws. Assigning these here (mirroring the identical fix in
//   `node-idb-test.js`'s `sandboxObj`) keeps the two aligned.
workerCtx.TypeError = TypeError;
workerCtx.DOMException = DOMException;
if (typeof Float16Array !== 'undefined') {
    workerCtx.Float16Array = Float16Array;
}

// Context elements required by the WebWorkers API spec
/**
 *
 * @param {string} msg
 * @returns {void}
 */
workerCtx.postMessage = function (msg) {
    ms.send([wwutil.MSGTYPE_USER, msg]);
};

// Todo: In place of this, allow conditionally `ServiceWorkerGlobalScope`
if (isSharedWorker) {
    workerCtx.onconnect = null;
}

workerCtx.location = scriptLoc;
// `IDBFactory.js`'s connection-queue origin caching (`getOrigin()`) is
//   read once, synchronously, as part of `indexeddbshim(workerCtx, ...)`
//   below and must stay consistent for every later call in this
//   process's lifetime -- so this needs to be set before that call, not
//   later next to the `createObjectURL` polyfill setup that also reads
//   it (setting it there second overwrote it with a different value,
//   breaking every subsequent `IDBFactory.open`/`deleteDatabase`, since
//   `getOrigin()` had already cached the pre-this-line value as an
//   object key). Also matches `node-idb-test.js`'s `global.location =
//   window.location` ordering (also before `indexeddbshim(window, ...)`).
global.location = workerCtx.location;
workerCtx.closing = false;
/**
 * @returns {void}
 */
workerCtx.close = function () {
    process.exit(0);
};
workerCtx.eventHandlers = {message: [], connect: []};
/**
 *
 * @param {"message"|"connect"} event
 * @param {() => void} handler
 * @returns {void}
 */
workerCtx.addEventListener = function (event, handler) {
    if (Object.hasOwn(workerCtx.eventHandlers, event)) {
        workerCtx.eventHandlers[event].push(handler);
    }
};
/**
 *
 * @param {"message"|"connect"} event
 * @param {() => void} handler
 * @returns {void}
 */
workerCtx.removeEventListener = function (event, handler) {
    if (!Object.hasOwn(workerCtx.eventHandlers, event)) {
        return;
    }

    const handlerPos = workerCtx.eventHandlers[event].indexOf(handler);
    if (handlerPos !== -1) {
        workerCtx.eventHandlers[event].splice(handlerPos, 1);
    }
};
/**
 *
 * @param {...any} args
 * @throws {TypeError}
 * @returns {void}
 */
workerCtx.importScripts = function (...args) {
    if (workerOptions.type === 'module') {
        // https://html.spec.whatwg.org/multipage/workers.html#importing-scripts-and-libraries
        throw new TypeError('For modules, `importScripts` should not be used. Use `import` statements instead.');
    }
    // Todo: Support URL/absolute file paths
    for (const arg of args) {
        // Todo: Handle pathType="url" (defaults to `localhost`) and if basePath is `false` with it
        const currentPath = (/^[\\\/]/v).test(arg) // Root
            ? workerConfig.pathType === 'file' && workerConfig.rootPath === false ? process.cwd() : workerConfig.rootPath
            : workerConfig.pathType === 'file' && workerConfig.basePath === false ? process.cwd() : workerConfig.basePath;
            /*
            console.log(path.join(
                currentPath,
                arg
            ));
            */
        try {
            let scriptSource = fs.readFileSync(
                path.join(
                    currentPath,
                    arg
                ),
                'utf8'
            );
            const scriptBasename = path.basename(arg);
            if (Object.hasOwn(nodeReplacementHacks, scriptBasename)) {
                scriptSource = nodeReplacementHacks[scriptBasename].reduce(
                    (content, pair) => content.replace(...pair),
                    scriptSource
                );
            }
            vm.runInContext(
                scriptSource,
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
if ([/interfaces\.any\.js$/v, /interfaces\.any\.worker\.js$/v].some((interfaceFileRegex) => interfaceFileRegex.test(workerURL))) {
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

// `test_primary_interface_of` in idlharness.js does `obj instanceof
//   Object` to recognize plain objects built by this process's own
//   classes (e.g. `IDBFactory`) injected into the context. The actual
//   `Symbol.hasInstance` patch for that is applied below, alongside
//   `Array`/`Date`/`BigInt`/`ArrayBuffer`'s, once `workerCtxObj`
//   exists -- see the comment there for why a full `workerCtx.Object
//   = Object;` override here (replacing the context's own intrinsic
//   `Object` binding entirely, before it's even contextified) isn't
//   used instead.

workerCtx.Function = Function; // idlharness.any.js with check for `DOMStringList`'s prototype being the same Function.prototype (still true?)

workerCtx.MessageChannel = MessageChannel; // `node:worker_threads`'s real transferable-object semantics (needed by WPT's `createDetachedArrayBuffer()` helper)

// `typeson-registry`'s `File`/`Blob` clone specs read the value's bytes
//   by creating a URL via `URL.createObjectURL(file)` and fetching it
//   synchronously through `XMLHttpRequest` -- neither Node's `URL` nor
//   `local-xmlhttprequest` (`workerCtx.XMLHttpRequest` above) support
//   that natively, so without this polyfill pair (mirroring
//   `node-idb-test.js`'s identical window-context setup) cloning a
//   `File`/`Blob` value throws `DataCloneError` instead of working.
// `SyncBlob`/`SyncFile` (also from `typeson-registry/polyfills`) replace
//   the native `File`/the `w3c-blob` polyfill's `Blob`: neither Node's
//   own `Blob`/`File` nor `w3c-blob` expose their bytes synchronously
//   (the latter doesn't store bytes at all), which the XHR-based read
//   above needs; `SyncBlob`/`SyncFile` capture that copy at construction
//   time instead, since there's no jsdom `window` in a worker context to
//   supply it the way `node-idb-test.js`'s window context can.
const cou = await import('typeson-registry/polyfills');
workerCtx.Blob = cou.SyncBlob;
workerCtx.File = cou.SyncFile;
// `typeson-registry`'s `blob`/`file` clone specs' `revive()` construct
//   a plain `new Blob(...)`/`new File(...)` using this process's own
//   ambient global (not `workerCtx`'s) -- structured-cloning a value
//   (`Sca.clone()`, used to extract a keyPath-derived key from a fresh
//   clone per spec) revives it that way too. Without also pointing this
//   process's own `Blob`/`File` at `SyncBlob`/`SyncFile`, a *revived*
//   Blob/File loses synchronous byte access and a subsequent re-encode
//   (e.g. the one that actually persists the cloned value) throws.
global.Blob = cou.SyncBlob;
global.File = cou.SyncFile;
workerCtx.URL.createObjectURL = cou.createObjectURL;
workerCtx.URL.revokeObjectURL = cou.revokeObjectURL;
// `xmlHttpRequestOverrideMimeType`'s own implementation patches a bare,
//   ambient `XMLHttpRequest.prototype.open` (not the constructor passed
//   in above, which only lives on `workerCtx`) -- this process's own
//   global needs to be set to the same constructor first, exactly as
//   `node-idb-test.js` does with `global.XMLHttpRequest = window.XMLHttpRequest`.
global.XMLHttpRequest = workerCtx.XMLHttpRequest;
global.XMLHttpRequest.prototype.overrideMimeType = cou.xmlHttpRequestOverrideMimeType({
    polyfillDataURLs: true
});
/**
 *
 * @param {...any} args
 * @returns {Promise<Response>}
 */
workerCtx.fetch = function (...args) {
    if (args[0].startsWith('/')) {
        // eslint-disable-next-line unicorn/prefer-https -- Local
        args[0] = 'http://web-platform.test:8000' + args[0];
    }
    return fetch(...args);
};

// A minimal, real `FileReader` (unlike the throw-on-use stubs below):
//   worker-context tests that clone a `Blob`/`File` through IndexedDB
//   commonly read the result back via `FileReader` to verify content
//   (e.g. `nested-cloning-basic.any.worker.js`). `SyncBlob`/`SyncFile`
//   (see above) already keep a synchronously-readable copy of their
//   bytes, via `cou.getBlobBytesSync`, which this reads from; the
//   actual read is still dispatched asynchronously (`setTimeout`) to
//   match real `FileReader` timing, in case anything depends on it.
/**
 * A minimal, real `FileReader`, backed by `cou.getBlobBytesSync`.
 */
class WorkerFileReader {
    /**
     *
     */
    constructor () {
        this.readyState = WorkerFileReader.EMPTY;
        this.result = null;
        this.error = null;
        this.onloadstart = null;
        this.onprogress = null;
        this.onload = null;
        this.onabort = null;
        this.onerror = null;
        this.onloadend = null;
    }

    /**
     * @param {"loadstart"|"progress"|"load"|"error"|"loadend"} type
     * @returns {void}
     */
    #dispatch (type) {
        const cb = this['on' + type];
        if (typeof cb === 'function') {
            cb.call(this, {type, target: this});
        }
    }

    /**
     * @param {Blob} blob
     * @param {"arraybuffer"|"text"|"dataurl"} mode
     * @returns {void}
     */
    #read (blob, mode) {
        if (this.readyState === WorkerFileReader.LOADING) {
            throw new Error('InvalidStateError: FileReader is already reading');
        }
        this.readyState = WorkerFileReader.LOADING;
        this.#dispatch('loadstart');
        setTimeout(() => {
            const bytes = cou.getBlobBytesSync(blob);
            if (!bytes) {
                this.error = new Error('Could not read the Blob/File (it may be detached)');
                this.readyState = WorkerFileReader.DONE;
                this.#dispatch('error');
                this.#dispatch('loadend');
                return;
            }
            if (mode === 'arraybuffer') {
                this.result = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            } else if (mode === 'text') {
                this.result = bytes.toString('utf8');
            } else {
                this.result = 'data:' + (blob.type || '') + ';base64,' + bytes.toString('base64');
            }
            this.readyState = WorkerFileReader.DONE;
            this.#dispatch('progress');
            this.#dispatch('load');
            this.#dispatch('loadend');
        }, 0);
    }

    /**
     * @param {Blob} blob
     * @returns {void}
     */
    readAsArrayBuffer (blob) {
        this.#read(blob, 'arraybuffer');
    }

    /**
     * @param {Blob} blob
     * @returns {void}
     */
    readAsText (blob) {
        this.#read(blob, 'text');
    }

    /**
     * @param {Blob} blob
     * @returns {void}
     */
    readAsDataURL (blob) {
        this.#read(blob, 'dataurl');
    }

    // `abort` is a required part of the `FileReader` interface, but
    //   with a read this synchronous there's nothing meaningful to
    //   interrupt -- a genuine no-op, not a stand-in for missing logic.
    /**
     * @returns {void}
     */
    // eslint-disable-next-line class-methods-use-this -- Interface conformance
    abort () {
        // Testing
    }
}
WorkerFileReader.EMPTY = 0;
WorkerFileReader.LOADING = 1;
WorkerFileReader.DONE = 2;
workerCtx.FileReader = WorkerFileReader;

// Todo: A good Worker polyfill would implement these as possible and
//   if exposing we should do so; for W3C IndexedDB or IndexedDB-related tests,
//   however, they do not currently require a working implementation except to
//   check that they exist. `SharedWorker`/`CanvasPath` are deliberately excluded
//   from this stub list: per `workers/semantics/interface-objects/002.worker.js`
//   and `004.any.js`, neither should be exposed in *any* worker global scope
//   (dedicated or shared) at all.
[
    'MessagePort', 'MessageEvent', 'WorkerNavigator',
    'WorkerLocation', 'ImageData', 'ImageBitmap',
    'Path2D', 'PromiseRejectionEvent', 'EventSource',
    'WebSocket', 'CloseEvent', 'BroadcastChannel',
    'XMLHttpRequestEventTarget', 'XMLHttpRequestUpload',
    'ProgressEvent', 'FormData', 'FileList',
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
const workerCtxObj = vm.createContext(workerCtx);

// testharness.js's `create_test_environment` does
//   `'WorkerGlobalScope' in global_scope && global_scope instanceof WorkerGlobalScope`
//   (and the same for `DedicatedWorkerGlobalScope`/`SharedWorkerGlobalScope`) --
//   `instanceof`'s right-hand side must either be callable or define its own
//   `Symbol.hasInstance`, so assigning `workerCtx` itself (a plain object) as
//   these "marker" values throws `TypeError: Right-hand side of 'instanceof'
//   is not callable` and aborts test environment creation entirely. A real
//   (if empty) constructor with a `Symbol.hasInstance` fixes the "callable"
//   part -- but the check inside also needs the *correct* object identity:
//   `vm.createContext(workerCtx)` does not make `workerCtx` itself become
//   `globalThis`/`self` as seen from code running inside the context (verified
//   directly: `workerCtx !== vm.runInContext('globalThis', workerCtxObj)`) --
//   it's a separate, property-mirrored global object. `global_scope`/`self`
//   inside testharness.js is that inner `globalThis`, so the brand must
//   compare against that, not against `workerCtx`.
const workerGlobalThis = vm.runInContext('globalThis', workerCtxObj);

// `IDBObjectStore`/etc. reconstruct cloned values (`Sca.js`) using this
//   process's own `Array`/`Date`, not this new context's -- so an
//   `instanceof` check made from inside the context (like WPT's
//   `value.any.worker.js`) against ITS `Array`/`Date` would otherwise
//   fail even for a genuine array/date. Same fix as `custom-reporter.js`
//   applies for the window-context tests, mirrored here for the
//   context's own globals.
Object.defineProperty(vm.runInContext('Array', workerCtxObj), Symbol.hasInstance, {
    value: (obj) => Array.isArray(obj),
    configurable: true
});
Object.defineProperty(vm.runInContext('Date', workerCtxObj), Symbol.hasInstance, {
    value: (obj) => isDateObject(obj),
    configurable: true
});
// `test_primary_interface_of` in idlharness.js does `obj instanceof
//   Object` against plain objects built by this process's own classes
//   (e.g. `IDBFactory`) injected into the context -- those are built
//   with this process's own `Object.prototype`, not the context's, so
//   without this they'd fail the check even though they're genuinely
//   plain objects. A `Symbol.hasInstance` patch alone (rather than
//   overwriting the context's own `Object` global entirely, the way
//   Array/Date above do) matters here specifically: classes defined
//   *inside* the context via `class X {}` syntax (e.g. `webidl2.js`'s
//   `Base`) have their real prototype chain tied to the context's own
//   true native `Object.prototype`, regardless of what the `Object`
//   global binding points to -- a full override would leave that
//   chain never terminating at whatever `Object.prototype` code
//   inside the context sees, breaking anything that walks it (e.g.
//   `Base.prototype.toJSON()`, walked while parsing WebIDL for
//   `idlharness.any.worker.js`).
Object.defineProperty(vm.runInContext('Object', workerCtxObj), Symbol.hasInstance, {
    value: (obj) => obj !== null && typeof obj === 'object',
    configurable: true
});
// Same idea for boxed `BigInt` objects: this process's own `Sca.js`/
//   `Key.js` reconstruct decoded values (including boxed BigInts)
//   using its own globals, not the context's, so a boxed BigInt
//   handed into the context needs a realm-independent way to be
//   recognized -- `Object.prototype.toString` tagging works
//   regardless of which realm did the boxing.
Object.defineProperty(vm.runInContext('BigInt', workerCtxObj), Symbol.hasInstance, {
    value: (obj) => typeof obj === 'bigint' ||
            (typeof obj === 'object' && obj !== null && Object.prototype.toString.call(obj) === '[object BigInt]'),
    configurable: true
});
// Same idea for `ArrayBuffer`: `Key.js`'s binary key decoding does
//   `new ArrayBuffer(...)` using this process's own native global, not
//   the context's -- `Object.prototype.toString` tagging is realm-
//   independent here too.
Object.defineProperty(vm.runInContext('ArrayBuffer', workerCtxObj), Symbol.hasInstance, {
    value: (obj) => typeof obj === 'object' && obj !== null && Object.prototype.toString.call(obj) === '[object ArrayBuffer]',
    configurable: true
});

/**
 * @returns {Function}
 */
function globalScopeBrand () {
    /**
     * @returns {void}
     */
    function GlobalScopeBrand () { /* Marker constructor only; never invoked */ }
    Object.defineProperty(GlobalScopeBrand, Symbol.hasInstance, {
        value: (obj) => obj === workerGlobalThis,
        configurable: true
    });
    return GlobalScopeBrand;
}

workerCtx.WorkerGlobalScope = globalScopeBrand();
if (isSharedWorker) {
    workerCtx.SharedWorkerGlobalScope = globalScopeBrand();
} else {
    workerCtx.DedicatedWorkerGlobalScope = globalScopeBrand();
}
const contextObjectPrototype = vm.runInContext('Object.prototype', workerCtxObj);
[
    'Event', 'EventTarget', 'IDBKeyRange', 'IDBCursor',
    'IDBObjectStore', 'IDBIndex', 'IDBFactory', 'IDBRecord'
].forEach((name) => {
    const ctor = workerCtx[name];
    if (ctor && ctor.prototype) {
        Object.setPrototypeOf(ctor.prototype, contextObjectPrototype);
    }
});

if (workerCtx.IDBTransaction && workerCtx.EventTarget) {
    Object.setPrototypeOf(workerCtx.IDBTransaction, workerCtx.EventTarget);
}
if (workerCtx.IDBCursorWithValue && workerCtx.IDBCursor) {
    Object.setPrototypeOf(workerCtx.IDBCursorWithValue, workerCtx.IDBCursor);
}
if (workerCtx.IDBOpenDBRequest && workerCtx.IDBRequest) {
    Object.setPrototypeOf(workerCtx.IDBOpenDBRequest, workerCtx.IDBRequest);
}
if (workerCtx.IDBRequest && workerCtx.EventTarget) {
    Object.setPrototypeOf(workerCtx.IDBRequest, workerCtx.EventTarget);
}
if (workerCtx.IDBDatabase && workerCtx.EventTarget) {
    Object.setPrototypeOf(workerCtx.IDBDatabase, workerCtx.EventTarget);
}

if (workerCtx.WorkerGlobalScope && workerCtx.WorkerGlobalScope.prototype) {
    /**
     * @returns {never}
     */
    const getter = function () {
        throw new TypeError('Illegal invocation');
    };
    Object.defineProperty(getter, 'name', {
        value: 'get indexedDB',
        configurable: true
    });
    Object.defineProperty(workerCtx.WorkerGlobalScope.prototype, 'indexedDB', {
        enumerable: true,
        configurable: true,
        get: getter
    });
}

prom.then(startWorker).catch((err) => {
    throw err;
});

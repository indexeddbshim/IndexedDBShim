// Todo: SharedWorker/ServiceWorker/MessageChannel polyfills
// WebWorkers implementation.
//
// The master and workers communite over a UNIX domain socket at
//
//      /tmp/node-webworker-<master PID>.sock
//
// This socket is used as a full-duplex channel for exchanging messages.
// Messages are objects encoded using the MessagePack format. Each message
// being exchanged is wrapped in an array envelope, the first element of
// which indicates the type of message being sent. For example take the
// following message (expresed in JSON)
//
//      [999, {'foo' : 'bar'}]
//
// This represents a message of type 999 with an object payload.
//
// o Message Types
//
//      MSGTYPE_NOOP        No-op. The payload of this message is discarded.
//
//      MSGTYPE_ERROR       An error has occurred. Used for bubbling up
//                          error events from the child process.
//
//      MSGTYPE_CLOSE       Graceful shut-down. Used to request that the
//                          child terminate gracefully.
//
//      MSGTYPE_USER        A user-specified message. All messages sent
//                          via the WebWorker API generate this type of
//                          message.

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const util = require('util');
const wwutil = require('./webworker-util');
const WebSocketServer = require('ws').Server;
const os = require('os');
const url = require('url');
const isWin = /^win/.test(os.platform());

// Directory for our UNIX domain sockets
const SOCK_DIR_PATH = path.join(os.tmpdir(), 'node-webworker-' + process.pid);

// The number of workers created so far
let numWorkersCreated = 0;

// Our optional custom `workerConfig` options = {
//   path: path to Node executable: defaults to `process.execPath` || process.argv[0]
//   args: arguments to pass in opening Node process: defaults to [worker child, sockPath, Worker src argument, standard options type, standard options credentials, relativePathType, basePath, rootPath, origin]; if present, array values will have components spliced into the beginning; if non-array, will be converted to string and spliced onto the beginning
//   permittedProtocols: indicates array of permitted explicit protocols ("file", "http", "https"); defaults to ["http", "https"]
//   relativePathType: "file", "url" - determines Worker `src` argument interpretation; defaults to "url"
//       relative paths will be relative to `basePath`
//   basePath: The base path for pathType="url" defaults to `localhost`; the base path for pathType="file" defaults to the current working directory; if `false`, will throw upon relative paths
//   rootPath: The root path
//   origin: Used for the `Origin` header (may be `null`); if `*` will cause cross-origin restrictions to be ignored
// }
module.exports = function (workerConfig) {
    workerConfig = workerConfig || {};
    if (workerConfig.permittedProtocols && !Array.isArray(workerConfig.permittedProtocols)) {
        throw new TypeError('The permittedProtocols argument must be an array');
    }
    // A Web Worker
    //
    // Each worker communicates with the master over a UNIX domain socket rooted
    // in SOCK_DIR_PATH.
    // Standard options = {
    //   type: "classic" (default), "module"
    //   credentials: "omit" (if type=module), "include", "same-origin"
    // }
    const Worker = function (src, opts) {
        // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker
        const self = this;

        opts = opts || {};

        let basePath;
        const urlObj = url.parse(src);
        if (urlObj.host !== null) {
            const {protocol} = urlObj;
            if (!(workerConfig.permittedProtocols || ['http', 'https']).map((p) => p + ':').includes(protocol)) {
                throw new TypeError('This worker is not configured to support the protocol of the supplied Worker source argument (' + protocol + ').');
            }
        } else if (urlObj.pathname && (/^[\\/]/).test(urlObj.pathname)) {
            if (workerConfig.rootPath === false) {
                throw new TypeError('Absolute paths are not allowed when `rootPath` is `false`');
            }
            const {rootPath} = workerConfig;
            basePath = 'http://localhost';
            if (rootPath !== false) {
                if (workerConfig.relativePathType === 'file') {
                    basePath = path.join(rootPath || process.cwd(), src);
                    src = wwutil.makeFileURL(workerConfig, basePath);
                } else {
                    // basePath = wwutil.makeFileURL(workerConfig, process.cwd());
                    src = url.resolve(basePath, src);
                }
            }
        } else {
            basePath = workerConfig.basePath;
            if (basePath === false) {
                throw new TypeError('Relative paths are not allowed when `basePath` is `false`');
            }
            if (basePath) {
                basePath = wwutil.makeFileURL(workerConfig, basePath);
            }
            basePath = basePath || wwutil.makeFileURL(workerConfig, process.cwd()) || 'http://localhost';
            src = url.resolve(basePath, src);
            // const urlObj = url.parse(src);
        }

        // The timeout ID for killing off this worker if it is unresponsive to a
        // graceful shutdown request
        let killTimeoutID;

        // Process ID of child process running this worker
        //
        // This value persists even once the child process itself has
        // terminated; it is used as a key into datastructures managed by the
        // Master object.
        let pid;

        // Child process object
        //
        // This value is 'undefined' until the child process itself is spawned
        // and defined forever after.
        let cp;

        // The stream associated with this worker and wwutil.MsgStream that
        // wraps it.
        let stream;
        let msgStream;

        // Outbound message queue
        //
        // This queue is only written to when we don't yet have a stream to
        // talk to the worker. It contains [type, data, fd] tuples.
        let msgQueue = [];

        // Event handlers (onmessage via addEventListener)
        const eventHandlers = {message: []};

        // The path to our socket
        const sockFilePath = path.join(SOCK_DIR_PATH, '' + numWorkersCreated++);
        const sockPath = path.join((isWin ? '\\\\.\\pipe\\' : ''), sockFilePath); // '\\\\?\\pipe' had problems

        // Make sure our socket folder is in place (it may have been removed by a previous clean-up)
        try {
            fs.mkdirSync(SOCK_DIR_PATH, parseInt('0700', 8));
        } catch (e) {}

        // Server instance for our communication socket with the child process
        //
        // Doesn't begin listening until start() is called.

        const httpServer = http.createServer();
        const wsSrv = new WebSocketServer({server: httpServer});
        let handleMessage; // eslint-disable-line prefer-const
        wsSrv.addListener('connection', function (s) {
            assert.strictEqual(stream, undefined);
            assert.strictEqual(msgStream, undefined);

            stream = s;
            msgStream = new wwutil.MsgStream(s);

            // Process any messages waiting to be sent
            msgQueue.forEach(function (m) {
                const fd = m.pop();
                msgStream.send(m, fd);
            });

            msgQueue = [];

            // Process incoming messages with handleMessage()
            msgStream.addListener('msg', handleMessage);
        });

        // Begin worker execution
        //
        // First fires up the UNIX socket server, then spawns the child process
        // and away we go.
        const start = function () {
            httpServer.listen(sockPath);
            httpServer.addListener('listening', function () {
                const execPath = workerConfig.path || process.execPath || process.argv[0];

                const args = [
                    path.join(__dirname, 'webworker-child.js'),
                    sockPath,
                    src,
                    opts.type,
                    opts.credentials,
                    workerConfig.node,
                    workerConfig.relativePathType,
                    workerConfig.basePath,
                    workerConfig.rootPath,
                    workerConfig.origin
                ];
                if (workerConfig.args) {
                    if (Array.isArray(workerConfig.args)) {
                        for (let ii = workerConfig.args.length; ii >= 0; ii--) {
                            args.splice(0, 0, workerConfig.args[ii]);
                        }
                    } else {
                        args.splice(0, 0, workerConfig.args.toString());
                    }
                }

                cp = childProcess.spawn(
                    execPath,
                    args
                );

                // Save off the PID of the child process, as this value gets
                // undefined once the process exits.
                pid = cp.pid;

                wwutil.debug(1,
                    'Spawned process ' + pid + ' for worker \'' + src + '\': ' +
                    execPath + ' ' + args.join(' ')
                );
                cp.stdout.on('data', function (d) {
                    process.stdout.write(d);
                });
                cp.stderr.on('data', function (d) {
                    process.stderr.write(d);
                });
                cp.addListener('exit', function (code, signal) {
                    wwutil.debug(
                        'Process ' + pid + ' for worker \'' + src +
                            '\' exited with status ' + code + ', signal ' + signal
                    );

                    // If we have an outstanding timeout for killing off this process,
                    // abort it.
                    if (killTimeoutID) {
                        clearTimeout(killTimeoutID);
                    }

                    if (stream) {
                        stream.close();
                    } else {
                        wwutil.debug(
                            'Process ' + pid + ' exited without completing handshaking'
                        );
                    }

                    wsSrv.close();
                    httpServer.close();
                    if (msgStream) {
                        msgStream = null;
                    }

                    // remove the socket
                    fs.unlink(sockFilePath, function (e) {
                        try {
                            // try removing the socket directory
                            fs.rmdirSync(path.dirname(sockFilePath));
                        } catch (e) {}

                        if (self.onexit) {
                            process.nextTick(function () {
                                self.onexit(code, signal);
                            });
                        }
                    });

                    if (self.onexit) {
                        process.nextTick(function () {
                            self.onexit(code, signal);
                        });
                    }
                });
            });
        };

        // The primary message handling function for the worker.
        //
        // This is only invoked after handshaking has occurred.
        handleMessage = function (msg, fd) {
            if (!wwutil.isValidMessage(msg)) {
                wwutil.debug('Received invalid message: ' + util.inspect(msg));
                return;
            }

            wwutil.debug(
                'Received message type=' + msg[0] + ', data=' + util.inspect(msg[1])
            );

            switch (msg[0]) {
            case wwutil.MSGTYPE_NOOP:
                break;

            case wwutil.MSGTYPE_ERROR:
                if (self.onerror) {
                    const err = msg[1];
                    // Prevent error by testharness.js; if we need more support later, we could invoke eventtargeter's Event polyfill
                    // console.log(err.stack);
                    err.preventDefault = function () {};
                    self.onerror(err);
                }
                break;

            case wwutil.MSGTYPE_USER:
                if (self.onmessage || eventHandlers['message'].length > 0) {
                    const e = {data: msg[1]};

                    if (fd) {
                        e.fd = fd;
                    }

                    if (self.onmessage) {
                        self.onmessage(e);
                    }

                    for (let i = 0; i < eventHandlers['message'].length; i++) {
                        eventHandlers['message'][i](e);
                    }
                }
                break;

            default:
                wwutil.debug(
                    'Received unexpected message: ' + util.inspect(msg)
                );
                break;
            }
        };

        // Do the heavy lifting of posting a message
        const postMessageImpl = function (msgType, msg, fd) {
            assert.ok(!msgQueue || !msgStream);

            const m = [msgType, msg];

            if (msgStream) {
                msgStream.send(m, fd);
            } else {
                m.push(fd);
                msgQueue.push(m);
            }
        };

        // Post a message to the worker
        self.postMessage = function (msg, xfers) {
            if (Array.isArray(xfers)) { // Todo: Currently only handling detached buffers, not yet exposing the transfer
                xfers.forEach(function (xfer) {
                    // Assumes this currently non-standard method gets implemented for Node
                    if (typeof ArrayBuffer.transfer === 'function') { ArrayBuffer.transfer(xfer, 0); }
                });
            }
            postMessageImpl(wwutil.MSGTYPE_USER, msg);
        };

        // Register event handler
        self.addEventListener = function (event, handler) {
            if (event in eventHandlers) {
                eventHandlers[event].push(handler);
            }
        };
        self.removeEventListener = function (event, handler) {
            if (event in eventHandlers) {
                const handlerPos = eventHandlers[event].indexOf(handler);
                if (handlerPos > -1) {
                    eventHandlers[event].splice(handlerPos, 1);
                }
            }
        };

        // Terminate the worker
        //
        // Takes a timeout value for forcibly killing off the worker if it does
        // not shut down gracefully on its own. By default, this timeout is
        // 5 seconds. A value of 0 indicates infinite timeout.
        self.terminate = function (timeout) {
            assert.notStrictEqual(pid, undefined);
            assert.ok(cp.pid === pid || !cp.pid);

            timeout = (timeout === undefined) ? 5000 : timeout;

            // The child process is already shut down; no-op
            if (!cp.pid) {
                return;
            }

            // The termination process has already been initiated for this
            // process
            if (killTimeoutID) {
                return;
            }

            // Request graceful shutdown of the child process
            postMessageImpl(wwutil.MSGTYPE_CLOSE);

            // Optionally set a timer to kill off the child process forcefully if
            // it has not shut down by itself.
            if (timeout > 0) {
                killTimeoutID = setTimeout(function () {
                    // Clear our ID since we're now running
                    killTimeoutID = undefined;

                    if (!cp.pid) {
                        return;
                    }

                    wwutil.debug(
                        'Forcibily terminating worker process ' + pid +
                            ' with SIGTERM'
                    );

                    cp.kill('SIGTERM');
                }, timeout);
            }
        };

        // Fire it up
        start();
    };
    return Worker;
};

// Perform any one-time initialization
try {
    fs.mkdirSync(SOCK_DIR_PATH, parseInt('0700', 8));
} catch (e) {
    if (e.code && e.code !== 'EEXIST') {
        throw e;
    }
}

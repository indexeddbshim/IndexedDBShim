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

var assert = require('assert');
var child_process = require('child_process');
var fs = require('fs');
var net = require('net');
var http = require('http');
var path = require('path');
var util = require('util');
var wwutil = require('./webworker-util');
var WebSocketServer = require('ws').Server;
var inspect = require('eyes').inspector({styles: {all: 'magenta'}});
var os = require('os');
var url = require('url');
var isWin = /^win/.test(os.platform());

// Directory for our UNIX domain sockets
var SOCK_DIR_PATH = path.join(os.tmpdir(), 'node-webworker-' + process.pid);

// The number of workers created so far
var numWorkersCreated = 0;

// Our optional custom `workerConfig` options = {
//   path: path to Node executable: defaults to `process.execPath` || process.argv[0]
//   args: arguments to pass in opening Node process: defaults to [worker child, sockPath, Worker src argument, standard options type, standard options credentials, relativePathType, basePath, origin]; if present, array values will have components spliced into the beginning; if non-array, will be converted to string and spliced onto the beginning
//   permittedProtocols: indicates array of permitted explicit protocols ("file", "http", "https"); defaults to ["http", "https"]
//   relativePathType: "file", "url" - determines Worker `src` argument interpretation; defaults to "url"
//       relative paths will be relative to `basePath`
//   basePath: The base path for pathType="url" defaults to `localhost`; the base path for pathType="file" defaults to the current working directory; if `false`, will throw upon relative paths
//   origin: Used for the `Origin` header (may be `null`); if `*` will cause cross-origin restrictions to be ignored
//}
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
    //}
    var Worker = function(src, opts) {
        // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker
        var self = this;

        opts = opts || {};

        var urlObj = url.parse(src);
        if (urlObj.host !== null) {
            var protocol = urlObj.protocol;
            if (!(workerConfig.permittedProtocols || ['http', 'https']).map((p) => p + ':').includes(protocol)) {
                throw new TypeError('This worker is not configured to support the protocol of the supplied Worker source argument.');
            }
        } else {
            if (workerConfig.basePath === false) {
                throw new TypeError('Relative paths are not allowed when `basePath` is `false`');
            }
            var base = workerConfig.basePath;
            if (base) {
                base = wwutil.makeFileURL(workerConfig, base);
            }
            base = base || wwutil.makeFileURL(workerConfig, process.cwd()) || 'http://localhost';

            src = url.resolve(base, src);
            // var urlObj = url.parse(src);
        }

        // The timeout ID for killing off this worker if it is unresponsive to a
        // graceful shutdown request
        var killTimeoutID = undefined;

        // Process ID of child process running this worker
        //
        // This value persists even once the child process itself has
        // terminated; it is used as a key into datastructures managed by the
        // Master object.
        var pid = undefined;

        // Child process object
        //
        // This value is 'undefined' until the child process itself is spawned
        // and defined forever after.
        var cp = undefined;

        // The stream associated with this worker and wwutil.MsgStream that
        // wraps it.
        var stream = undefined;
        var msgStream = undefined;

        // Outbound message queue
        //
        // This queue is only written to when we don't yet have a stream to
        // talk to the worker. It contains [type, data, fd] tuples.
        var msgQueue = [];

        // Event handlers (onmessage via addEventListener)
        var eventHandlers = {"message": new Array()};

        // The path to our socket
        var sockFilePath = path.join(SOCK_DIR_PATH, '' + numWorkersCreated++);
        var sockPath = path.join((isWin ? '\\\\.\\pipe\\' : ''), sockFilePath); // '\\\\?\\pipe' had problems

        // Make sure our socket folder is in place (it may have been removed by a previous clean-up)
        try {
            fs.mkdirSync(SOCK_DIR_PATH, 0700);
        } catch(e) {}

        // Server instance for our communication socket with the child process
        //
        // Doesn't begin listening until start() is called.

        var httpServer = http.createServer();
        var wsSrv = new WebSocketServer({ server: httpServer });
        wsSrv.addListener('connection', function(s) {
            assert.equal(stream, undefined);
            assert.equal(msgStream, undefined);

            stream = s;
            msgStream = new wwutil.MsgStream(s);

            // Process any messages waiting to be sent
            msgQueue.forEach(function(m) {
                var fd = m.pop();
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
        var start = function() {
            httpServer.listen(sockPath);
            httpServer.addListener('listening', function() {
                var execPath = workerConfig.path || process.execPath || process.argv[0];

                var args = [
                    path.join(__dirname, 'webworker-child.js'),
                    sockPath,
                    src,
                    opts.type,
                    opts.credentials,
                    workerConfig.node,
                    workerConfig.relativePathType,
                    workerConfig.basePath,
                    workerConfig.origin
                ];
                if (workerConfig.args) {
                    if (Array.isArray(workerConfig.args)) {
                        for (var ii = workerConfig.args.length; ii >= 0; ii--) {
                            args.splice(0, 0, workerConfig.args[ii]);
                        }
                    } else {
                        args.splice(0, 0, workerConfig.args.toString());
                    }
                }

                cp = child_process.spawn(
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
                cp.stdout.on('data', function(d) {
                  process.stdout.write(d);
                })
                cp.stderr.on('data', function(d) {
                  process.stderr.write(d);
                })
                cp.addListener('exit', function(code, signal) {
                    wwutil.debug(
                        'Process ' + pid + ' for worker \'' + src +
                            '\' exited with status ' + code +', signal ' + signal
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
                    if (msgStream)
                        msgStream = null;

                    // remove the socket
                    fs.unlink(sockFilePath, function(e) {
                        try {
                            // try removing the socket directory
                            fs.rmdirSync(path.dirname(sockFilePath));
                        } catch(e) {}

                        if (self.onexit) {
                            process.nextTick(function() {
                                self.onexit(code, signal);
                            });
                        }
                    });

                    if (self.onexit) {
                        process.nextTick(function() {
                            self.onexit(code, signal);
                        });
                    }
                });
            });
        };

        // The primary message handling function for the worker.
        //
        // This is only invoked after handshaking has occurred.
        var handleMessage = function(msg, fd) {
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
                    self.onerror(msg[1]);
                }
                break;

            case wwutil.MSGTYPE_USER:
                if (self.onmessage || eventHandlers['message'].length > 0) {
                    var e = { data : msg[1] };

                    if (fd) {
                        e.fd = fd;
                    }

                    if(self.onmessage) {
                        self.onmessage(e);
                    }

                    for (var i=0; i<eventHandlers['message'].length; i++) {
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
        var postMessageImpl = function(msgType, msg, fd) {
            assert.ok(msgQueue.length == 0 || !msgStream);

            var m = [msgType, msg];

            if (msgStream) {
                msgStream.send(m, fd);
            } else {
                m.push(fd);
                msgQueue.push(m);
            }
        };

        // Post a message to the worker
        self.postMessage = function(msg) {
            postMessageImpl(wwutil.MSGTYPE_USER, msg);
        };

        // Register event handler
        self.addEventListener = function(event, handler) {
            if (event in eventHandlers) {
                eventHandlers[event].push(handler);
            }
        };

        // Terminate the worker
        //
        // Takes a timeout value for forcibly killing off the worker if it does
        // not shut down gracefully on its own. By default, this timeout is
        // 5 seconds. A value of 0 indicates infinite timeout.
        self.terminate = function(timeout) {
            assert.notEqual(pid, undefined);
            assert.ok(cp.pid == pid || !cp.pid);

            timeout = (timeout === undefined) ?  5000 : timeout;

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
                killTimeoutID = setTimeout(function() {
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
    fs.mkdirSync(SOCK_DIR_PATH, 0700);
} catch(e) {
    if (e.code && e.code != 'EEXIST')
        throw e;
}

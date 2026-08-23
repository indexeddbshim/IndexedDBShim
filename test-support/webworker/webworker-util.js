// Utilies and other common gook shared between the WebWorker master and
// its constituent Workers.

import {EventEmitter} from 'node:events';
import path from 'node:path';
import util from 'node:util';

import * as BSON from 'bson';

// Some debugging functions
const debugLevel = Number.parseInt(process.env.NODE_DEBUG, 16); // eslint-disable-line n/no-process-env -- Debugging
export const debug = (debugLevel & 0x8) // eslint-disable-line no-bitwise -- Convenient
    ? function (...args) { Reflect.apply(console.error, this, args); }
    : function () { /* */ };

// Extract meaning from stack traces
const STACK_FRAME_RE = /.* \(?(.+:\d+:\d+)\)?$/v;

// Symbolic names for our messages types
export const MSGTYPE_NOOP = 0;
export const MSGTYPE_ERROR = 1;
export const MSGTYPE_CLOSE = 2;
export const MSGTYPE_USER = 100;

/**
 * Is the given message well-formed?
 * @param {[0|1|2|100, FileDescriptor]} msg
 * @returns {boolean}
 */
export const isValidMessage = function (msg) {
    return (typeof msg[0] !== 'undefined' && typeof msg[1] !== 'undefined');
};

// A simple messaging stream.
//
// This class is constructed around an existing stream net.Stream. This class
// emits 'msg' events when a message is received. Each emitted 'msg' event
// may come with a second 'fd' parameter if the message was sent with  file
// descriptor. A sent file descriptor is guaranteed to be received with the
// message with which it was sent.
//
// Sending messages is done with the send() method.
/* eslint-disable unicorn/prefer-event-target -- Existing API */
/**
 * @class
 * @param {WebSocket} s
 */
export class MsgStream extends EventEmitter {
    /* eslint-enable unicorn/prefer-event-target -- Existing API */
    /**
     * @param {WebSocket} s
     */
    constructor (s) {
        super();

        const self = this; // eslint-disable-line consistent-this -- Clear

        // Sequence numbers for outgoing and incoming FDs
        let fdsSeqnoSent = 0;
        let fdsSeqnoRecvd = 0;

        // Collections of messages waiting for FDs and vice-versa. These
        // are keyed by FD seqno.
        const msgWaitingForFd = {};
        const fdWaitingForMsg = {};

        // Get the JS object representing message 'v' with fd 'fd'.
        /**
         *
         * @param {[msgType: 0|1|2|100, msg: string]} v
         * @param {FileDescriptor} fd
         * @returns {[]}
         */
        const getMsgObj = function (v, fd) {
            return [(fd !== undefined) ? ++fdsSeqnoSent : 0, v];
        };

        self.send = function (v, fd) {
            const ms = getMsgObj(v, fd);
            debug('Process ' + process.pid + ' sending message: ' + util.inspect(ms));

            // `BSON.serialize` no longer accepts an array as the root
            //   document, so wrap it in an object; `deserialize` below
            //   unwraps it again.
            //
            // `mask` is deliberately left unset: this `send` runs on both
            //   the client (worker) and server (master) side of the socket,
            //   and per RFC 6455 only client-to-server frames may be
            //   masked -- a server that masks its frames produces an
            //   invalid frame the client-side receiver rejects. Leaving it
            //   unset lets `ws` default it correctly per-socket
            //   (`!this._isServer`).
            s.send(BSON.serialize({m: ms}), {binary: true});
        };

        s.on('message', function (ms) {
            debug('Process ' + process.pid + ' received message: ' + ms);

            const {m: mo} = BSON.deserialize(ms);

            // Ignore invalid messages; this is probably worth an error, though
            if (!isValidMessage(mo)) {
                return;
            }

            let fd;

            const fdSeq = mo[0];
            const msg = mo[1];

            // If our message has an associated file descriptor that we
            // have not yet received, queue it for later delivery.
            if (fdSeq) {
                // eslint-disable-next-line sonarjs/no-nested-assignment -- Convenient
                if (!(fd = fdWaitingForMsg[fdSeq])) {
                    msgWaitingForFd[fdSeq] = msg;
                    return;
                }

                delete fdWaitingForMsg[fdSeq];
            }

            // We're complete; emit
            self.emit('msg', msg, fd);
        });

        s.on('fd', function (fd) {
            // Look for a message that's waiting for our arrival. If we don't
            // have one, enqueu the received FD for later delivery.
            const msg = msgWaitingForFd[++fdsSeqnoRecvd];
            if (!msg) {
                fdWaitingForMsg[fdsSeqnoRecvd] = fd;
                return;
            }

            // There was a message waiting for us; emit
            delete msgWaitingForFd[fdsSeqnoRecvd];
            self.emit('msg', msg, fd);
        });
    }
}

/**
 *
 * @param {import('./webworker.js').WorkerConfig} workerConfig
 * @param {string} dir
 * @returns {string|false}
 */
export const makeFileURL = function (workerConfig, dir) {
    if (workerConfig.relativePathType === 'file') {
        return 'file://' + dir.replaceAll('\\', '/') + '/';
    }
    return false;
};

// Todo: Implement the WorkerLocation interface described in
// https://www.whatwg.org/specs/web-workers/current-work/#dom-workerlocation-href
//   Leverage URL/URLSearchParams polyfill?
// Todo: None of these properties are readonly as required by the spec.
/**
 *
 * @param {string} url
 * @returns {void}
 */
export const WorkerLocation = function (url) {
    const u = new URL(url);

    // https://url.spec.whatwg.org/#url-miscellaneous
    /**
     *
     * @param {string} proto
     * @returns {void}
     */
    const portForProto = function (proto) {
        switch (proto) {
        case 'http': case 'ws':
            return 80;

        case 'https': case 'wss':
            return 443;

        case 'file':
            return undefined;

        case 'ftp':
            return 21;

        case 'gopher':
            return 70;

        // `data:`/`blob:` (used by the SharedWorker interface-exposure
        //   tests) have no network authority component at all, so having
        //   no port is expected, not an error.
        case 'data': case 'blob':
            return undefined;

        default:
            console.error(
                'Unknown protocol \'' + proto + '\'; returning undefined'
            );
            return undefined;
        }
    };

    this.href = u.href;
    this.protocol = u.protocol.slice(0, -1);
    this.host = u.host;
    this.hostname = u.hostname;
    this.port = u.port || portForProto(this.protocol);
    this.pathname = (u.pathname) ? path.normalize(u.pathname) : '/';
    this.search = u.search || '';
    this.hash = u.hash || '';
};

// Get the error message for a given exception
//
// The first line of the stack trace seems to always be the message itself.
/**
 *
 * @param {Error} e
 * @returns {string}
 */
export const getErrorMessage = function (e) {
    try {
        return e.message || e.stack.split('\n', 1)[0].trim();
    } catch (e) {
        return 'WebWorkers: failed to get error message';
    }
};

// Get the filename for a given exception
/**
 *
 * @param {Error} e
 * @returns {string}
 */
export const getErrorFilename = function (e) {
    try {
        const m = e.stack.split('\n', 2)[1].match(STACK_FRAME_RE);
        // eslint-disable-next-line unicorn/prefer-string-slice -- Clear
        return m[1].substring(
            0,
            m[1].lastIndexOf(':', m[1].lastIndexOf(':') - 1)
        );
    } catch (e) {
        return 'WebWorkers: failed to get error filename';
    }
};

// Get the line number for a given exception
/**
 *
 * @param {Error} e
 * @returns {Integer}
 */
export const getErrorLine = function (e) {
    try {
        const m = e.stack.split('\n', 2)[1].match(STACK_FRAME_RE);
        const parts = m[1].split(':');
        return Math.trunc(Number(parts.at(-2)));
    } catch (e) {
        return -1;
    }
};

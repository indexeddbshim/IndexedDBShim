// Utilies and other common gook shared between the WebWorker master and
// its constituent Workers.
/* eslint-disable compat/compat */

import events from 'events';
import path from 'path';
import util from 'util';

import * as BSON from 'bson';

// Some debugging functions
const debugLevel = Number.parseInt(process.env.NODE_DEBUG, 16); // eslint-disable-line n/no-process-env
export const debug = (debugLevel & 0x8) // eslint-disable-line no-bitwise
    ? function (...args) { Reflect.apply(console.error, this, args); }
    : function () { /* */ };

// Extract meaning from stack traces
const STACK_FRAME_RE = /.* \(?(.+:\d+:\d+)\)?$/;

// Symbolic names for our messages types
export const MSGTYPE_NOOP = 0;
export const MSGTYPE_ERROR = 1;
export const MSGTYPE_CLOSE = 2;
export const MSGTYPE_USER = 100;

// Is the given message well-formed?
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
export const MsgStream = function (s) {
    const self = this; // eslint-disable-line consistent-this

    events.EventEmitter.call(self);

    // Sequence numbers for outgoing and incoming FDs
    let fdsSeqnoSent = 0;
    let fdsSeqnoRecvd = 0;

    // Collections of messages waiting for FDs and vice-versa. These
    // are keyed by FD seqno.
    const msgWaitingForFd = {};
    const fdWaitingForMsg = {};

    // Get the JS object representing message 'v' with fd 'fd'.
    const getMsgObj = function (v, fd) {
        return [(fd !== undefined) ? ++fdsSeqnoSent : 0, v];
    };

    self.send = function (v, fd) {
        const ms = getMsgObj(v, fd);
        debug('Process ' + process.pid + ' sending message: ' + util.inspect(ms));

        s.send(BSON.serialize(ms), {binary: true, mask: true});
    };

    s.on('message', function (ms) {
        debug('Process ' + process.pid + ' received message: ' + ms);

        const mo = BSON.deserialize(ms);

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
};

util.inherits(MsgStream, events.EventEmitter);

export const makeFileURL = function (workerConfig, dir) {
    if (workerConfig.relativePathType === 'file') {
        return 'file://' + dir.replace(/\\/g, '/') + '/';
    }
    return false;
};

// Todo: Implement the WorkerLocation interface described in
// http://www.whatwg.org/specs/web-workers/current-work/#dom-workerlocation-href
//   Leverage URL/URLSearchParams polyfill?
// Todo: None of these properties are readonly as required by the spec.
export const WorkerLocation = function (url) {
    const u = new URL(url);

    // https://url.spec.whatwg.org/#url-miscellaneous
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
export const getErrorMessage = function (e) {
    try {
        return e.message || e.stack.split('\n')[0].trim();
    } catch (e) {
        return 'WebWorkers: failed to get error message';
    }
};

// Get the filename for a given exception
export const getErrorFilename = function (e) {
    try {
        const m = e.stack.split('\n')[1].match(STACK_FRAME_RE);
        // eslint-disable-next-line unicorn/prefer-string-slice
        return m[1].substring(
            0,
            m[1].lastIndexOf(':', m[1].lastIndexOf(':') - 1)
        );
    } catch (e) {
        return 'WebWorkers: failed to get error filename';
    }
};

// Get the line number for a given exception
export const getErrorLine = function (e) {
    try {
        const m = e.stack.split('\n')[1].match(STACK_FRAME_RE);
        const parts = m[1].split(':');
        return Number.parseInt(parts[parts.length - 2]);
    } catch (e) {
        return -1;
    }
};

// Utilies and other common gook shared between the WebWorker master and
// its constituent Workers.

const BSON = require('bson');
const events = require('events');
const path = require('path');
const util = require('util');
const urllib = require('url');

const bson = new BSON();

// Some debugging functions
const debugLevel = parseInt(process.env.NODE_DEBUG, 16);
const debug = (debugLevel & 0x8)
    ? function () { console.error.apply(this, arguments); }
    : function () {};
exports.debug = debug;

// Extract meaning from stack traces
const STACK_FRAME_RE = /.* \(?(.+:\d+:\d+)\)?$/;

// Symbolic names for our messages types
exports.MSGTYPE_NOOP = 0;
exports.MSGTYPE_ERROR = 1;
exports.MSGTYPE_CLOSE = 2;
exports.MSGTYPE_USER = 100;

// Is the given message well-formed?
const isValidMessage = function (msg) {
    return (typeof msg[0] !== 'undefined' && typeof msg[1] !== 'undefined');
};
exports.isValidMessage = isValidMessage;

// A simple messaging stream.
//
// This class is constructed around an existing stream net.Stream. This class
// emits 'msg' events when a message is received. Each emitted 'msg' event
// may come with a second 'fd' parameter if the message was sent with  file
// descriptor. A sent file descriptor is guaranteed to be received with the
// message with which it was sent.
//
// Sending messages is done with the send() method.
const MsgStream = function (s) {
    const self = this;

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

        s.send(bson.serialize(ms), {binary: true, mask: true});
    };

    s.on('message', function (ms) {
        debug('Process ' + process.pid + ' received message: ' + ms);

        const mo = bson.deserialize(ms);

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
exports.MsgStream = MsgStream;

exports.makeFileURL = function (workerConfig, dir) {
    if (workerConfig.relativePathType === 'file') {
        return 'file://' + dir.replace(/\\/g, '/') + '/';
    }
    return false;
};

// Todo: Implement the WorkerLocation interface described in
// http://www.whatwg.org/specs/web-workers/current-work/#dom-workerlocation-href
//   Leverage URL/URLSearchParams polyfill?
// XXX: None of these properties are readonly as required by the spec.
const WorkerLocation = function (url) {
    const u = urllib.parse(url);

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
            util.debug(
                'Unknown protocol \'' + proto + '\'; returning undefined'
            );
            return undefined;
        }
    };

    this.href = u.href;
    this.protocol = u.protocol.substring(0, u.protocol.length - 1);
    this.host = u.host;
    this.hostname = u.hostname;
    this.port = (u.port) ? u.port : portForProto(this.protocol);
    this.pathname = (u.pathname) ? path.normalize(u.pathname) : '/';
    this.search = (u.search) ? u.search : '';
    this.hash = (u.hash) ? u.hash : '';
};

exports.WorkerLocation = WorkerLocation;

// Get the error message for a given exception
//
// The first line of the stack trace seems to always be the message itself.
exports.getErrorMessage = function (e) {
    try {
        return e.message || e.stack.split('\n')[0].trim();
    } catch (e) {
        return 'WebWorkers: failed to get error message';
    }
};

// Get the filename for a given exception
exports.getErrorFilename = function (e) {
    try {
        const m = e.stack.split('\n')[1].match(STACK_FRAME_RE);
        return m[1].substring(
            0,
            m[1].lastIndexOf(':', m[1].lastIndexOf(':') - 1)
        );
    } catch (e) {
        return 'WebWorkers: failed to get error filename';
    }
};

// Get the line number for a given exception
exports.getErrorLine = function (e) {
    try {
        const m = e.stack.split('\n')[1].match(STACK_FRAME_RE);
        const parts = m[1].split(':');
        return parseInt(parts[parts.length - 2]);
    } catch (e) {
        return -1;
    }
};

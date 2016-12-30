import CFG from './CFG.js';

/**
 * Creates a native DOMException, for browsers that support it
 * @returns {DOMException}
 */
function createNativeDOMException (name, message) {
    return new DOMException.prototype.constructor(message, name || 'DOMException');
}

/**
 * Creates a generic Error object
 * @returns {Error}
 */
function createError (name, message) {
    const e = new Error(message); // DOMException uses the same `toString` as `Error`, so no need to add
    e.name = name || 'DOMException';
    e.message = message;
    return e;
}

/**
 * Logs detailed error information to the console.
 * @param {string} name
 * @param {string} message
 * @param {string|Error|null} error
 */
function logError (name, message, error) {
    if (CFG.DEBUG) {
        if (error && error.message) {
            error = error.message;
        }

        const method = typeof (console.error) === 'function' ? 'error' : 'log';
        console[method](name + ': ' + message + '. ' + (error || ''));
        console.trace && console.trace();
    }
}

function isErrorOrDOMErrorOrDOMException (obj) {
    return obj && typeof obj === 'object' && // We don't use util.isObj here as mutual dependency causing problems in Babel with browser
        typeof obj.name === 'string';
}

/**
 * Finds the error argument.  This is useful because some WebSQL callbacks
 * pass the error as the first argument, and some pass it as the second argument.
 * @param {array} args
 * @returns {Error|DOMException|undefined}
 */
function findError (args) {
    let err;
    if (args) {
        if (args.length === 1) {
            return args[0];
        }
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (isErrorOrDOMErrorOrDOMException(arg)) {
                return arg;
            } else if (arg && typeof arg.message === 'string') {
                err = arg;
            }
        }
    }
    return err;
}

function webSQLErrback (webSQLErr) {
    let name, message;
    switch (webSQLErr.code) {
    case 4: { // SQLError.QUOTA_ERR
        name = 'QuotaExceededError';
        message = 'The operation failed because there was not enough remaining storage space, or the storage quota was reached and the user declined to give more space to the database.';
        break;
    }
    /*
    // Should a WebSQL timeout treat as IndexedDB `TransactionInactiveError` or `UnknownError`?
    case 7: { // SQLError.TIMEOUT_ERR
        // All transaction errors abort later, so no need to mark inactive
        name = 'TransactionInactiveError';
        message = 'A request was placed against a transaction which is currently not active, or which is finished (Internal SQL Timeout).';
        break;
    }
    */
    default: {
        name = 'UnknownError';
        message = 'The operation failed for reasons unrelated to the database itself and not covered by any other errors.';
        break;
    }
    }
    message += ' (' + webSQLErr.message + ')--(' + webSQLErr.code + ')';
    const err = createDOMException(name, message);
    return err;
}

let test, useNativeDOMException = false;

// Test whether we can use the browser's native DOMException class
try {
    test = createNativeDOMException('test name', 'test message');
    if (isErrorOrDOMErrorOrDOMException(test) && test.name === 'test name' && test.message === 'test message') {
        // Native DOMException works as expected
        useNativeDOMException = true;
    }
} catch (e) {}

let createDOMException, shimDOMException;
if (useNativeDOMException) {
    shimDOMException = DOMException;
    createDOMException = function (name, message, error) {
        logError(name, message, error);
        return createNativeDOMException(name, message);
    };
} else {
    shimDOMException = Error;
    createDOMException = function (name, message, error) {
        logError(name, message, error);
        return createError(name, message);
    };
}

export {logError, findError, shimDOMException as DOMException, createDOMException, webSQLErrback};

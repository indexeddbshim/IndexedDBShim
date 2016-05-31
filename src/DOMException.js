/*global GLOBAL*/
const global = typeof window !== 'undefined' ? window : GLOBAL;

/**
 * Creates a native DOMException, for browsers that support it
 * @returns {DOMException}
 */
function createNativeDOMException (name, message) {
    const e = new DOMException.prototype.constructor(0, message);
    e.name = name || 'DOMException';
    e.message = message;
    return e;
}

/**
 * Creates a native DOMError, for browsers that support it
 * @returns {DOMError}
 */
function createNativeDOMError (name, message) {
    name = name || 'DOMError';
    const e = new DOMError(name, message);
    e.name === name || (e.name = name);
    e.message === message || (e.message = message);
    return e;
}

/**
 * Creates a generic Error object
 * @returns {Error}
 */
function createError (name, message) {
    const e = new Error(message);
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
    if (global.DEBUG) {
        if (error && error.message) {
            error = error.message;
        }

        const method = typeof (console.error) === 'function' ? 'error' : 'log';
        console[method](name + ': ' + message + '. ' + (error || ''));
        console.trace && console.trace();
    }
};

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
            if (arg instanceof Error || arg instanceof DOMException) {
                return arg;
            } else if (arg && typeof arg.message === 'string') {
                err = arg;
            }
        }
    }
    return err;
};

let test, useNativeDOMException = false, useNativeDOMError = false;

// Test whether we can use the browser's native DOMException class
try {
    test = createNativeDOMException('test name', 'test message');
    if (test instanceof DOMException && test.name === 'test name' && test.message === 'test message') {
        // Native DOMException works as expected
        useNativeDOMException = true;
    }
} catch (e) {}

// Test whether we can use the browser's native DOMError class
try {
    test = createNativeDOMError('test name', 'test message');
    if (test instanceof DOMError && test.name === 'test name' && test.message === 'test message') {
        // Native DOMError works as expected
        useNativeDOMError = true;
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

let createDOMError, shimDOMError;
if (useNativeDOMError) {
    shimDOMError = DOMError;
    createDOMError = function (name, message, error) {
        logError(name, message, error);
        return createNativeDOMError(name, message);
    };
} else {
    shimDOMError = Error;
    createDOMError = function (name, message, error) {
        logError(name, message, error);
        return createError(name, message);
    };
}

export {logError, findError, shimDOMError as DOMError, shimDOMException as DOMException, createDOMException, createDOMError};

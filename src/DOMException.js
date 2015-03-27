/*jshint globalstrict: true*/
'use strict';
(function(idbModules) {
    /**
     * Creates a native DOMException, for browsers that support it
     * @returns {DOMException}
     */
    function createNativeDOMException(name, message) {
        var e = new DOMException.prototype.constructor(0, message);
        e.name = name || 'DOMException';
        e.message = message;
        return e;
    }

    /**
     * Creates a native DOMError, for browsers that support it
     * @returns {DOMError}
     */
    function createNativeDOMError(name, message) {
        name = name || 'DOMError';
        var e = new DOMError(name, message);
        e.name === name || (e.name = name);
        e.message === message || (e.message = message);
        return e;
    }

    
    /**
     * Creates a generic Error object
     * @returns {Error}
     */
    function createError(name, message) {
        var e = new Error(message);
        e.name = name || 'DOMException';
        e.message = message;
        return e;
    }
    
    function logError(name, message, error) {
        if (idbModules.DEBUG) {
            if (error && error.message) {
                error = error.message;
            }
            
            var method = typeof(console.error) === 'function' ? 'error' : 'log';
            console[method](name + ': ' + message + '. ' + (error || ''));
            console.trace && console.trace();
        }
    }
    
    var test, useNativeDOMException = false, useNativeDOMError = false;

    // Test whether we can use the browser's native DOMException class
    try {
        test = createNativeDOMException('test name', 'test message');
        if (test instanceof DOMException && test.name === 'test name' && test.message === 'test message') {
            // Native DOMException works as expected
            useNativeDOMException = true;
        }
    }
    catch (e) {}
    
    // Test whether we can use the browser's native DOMError class
    try {
        test = createNativeDOMError('test name', 'test message');
        if (test instanceof DOMError && test.name === 'test name' && test.message === 'test message') {
            // Native DOMError works as expected
            useNativeDOMError = true;
        }
    }
    catch (e) {}

    idbModules.util.logError = logError;
    if (useNativeDOMException) {
        idbModules.DOMException = DOMException;
        idbModules.util.createDOMException = function(name, message, error) {
            logError(name, message, error);
            return createNativeDOMException(name, message);
        };
    }
    else {
        idbModules.DOMException = Error;
        idbModules.util.createDOMException = function(name, message, error) {
            logError(name, message, error);
            return createError(name, message);
        };
    }

    if (useNativeDOMError) {
        idbModules.DOMError = DOMError;
        idbModules.util.createDOMError = function(name, message, error) {
            logError(name, message, error);
            return createNativeDOMError(name, message);
        };
    }
    else {
        idbModules.DOMError = Error;
        idbModules.util.createDOMError = function(name, message, error) {
            logError(name, message, error);
            return createError(name, message);
        };
    }
}(idbModules));

import CFG from './CFG.js';

/**
 * Creates a native DOMException, for browsers that support it.
 * @param {string} name
 * @param {string} message
 * @returns {DOMException}
 */
function createNativeDOMException (name, message) {
    // @ts-expect-error It's ok
    return new DOMException.prototype.constructor(
        message,
        name || 'DOMException'
    );
}

// From web-platform-tests testharness.js name_code_map (though not in new spec)

/**
 * @typedef {"IndexSizeError"|"HierarchyRequestError"|"WrongDocumentError"|
 * "InvalidCharacterError"|"NoModificationAllowedError"|"NotFoundError"|
 * "NotSupportedError"|"InUseAttributeError"|"InvalidStateError"|
 * "SyntaxError"|"InvalidModificationError"|"NamespaceError"|
 * "InvalidAccessError"|"TypeMismatchError"|"SecurityError"|
 * "NetworkError"|"AbortError"|"URLMismatchError"|"QuotaExceededError"|
 * "TimeoutError"|"InvalidNodeTypeError"|"DataCloneError"|"EncodingError"|
 * "NotReadableError"|"UnknownError"|"ConstraintError"|"DataError"|
 * "TransactionInactiveError"|"ReadOnlyError"|"VersionError"|
 * "OperationError"|"NotAllowedError"} Code
 */

const codes = {
    IndexSizeError: 1,
    HierarchyRequestError: 3,
    WrongDocumentError: 4,
    InvalidCharacterError: 5,
    NoModificationAllowedError: 7,
    NotFoundError: 8,
    NotSupportedError: 9,
    InUseAttributeError: 10,
    InvalidStateError: 11,
    SyntaxError: 12,
    InvalidModificationError: 13,
    NamespaceError: 14,
    InvalidAccessError: 15,
    TypeMismatchError: 17,
    SecurityError: 18,
    NetworkError: 19,
    AbortError: 20,
    URLMismatchError: 21,
    QuotaExceededError: 22,
    TimeoutError: 23,
    InvalidNodeTypeError: 24,
    DataCloneError: 25,

    EncodingError: 0,
    NotReadableError: 0,
    UnknownError: 0,
    ConstraintError: 0,
    DataError: 0,
    TransactionInactiveError: 0,
    ReadOnlyError: 0,
    VersionError: 0,
    OperationError: 0,
    NotAllowedError: 0
};

/**
 * @typedef {"INDEX_SIZE_ERR"|"DOMSTRING_SIZE_ERR"|"HIERARCHY_REQUEST_ERR"|
 * "WRONG_DOCUMENT_ERR"|"INVALID_CHARACTER_ERR"|"NO_DATA_ALLOWED_ERR"|
 * "NO_MODIFICATION_ALLOWED_ERR"|"NOT_FOUND_ERR"|"NOT_SUPPORTED_ERR"|
 * "INUSE_ATTRIBUTE_ERR"|"INVALID_STATE_ERR"|"SYNTAX_ERR"|
 * "INVALID_MODIFICATION_ERR"|"NAMESPACE_ERR"|"INVALID_ACCESS_ERR"|
 * "VALIDATION_ERR"|"TYPE_MISMATCH_ERR"|"SECURITY_ERR"|"NETWORK_ERR"|
 * "ABORT_ERR"|"URL_MISMATCH_ERR"|"QUOTA_EXCEEDED_ERR"|"TIMEOUT_ERR"|
 * "INVALID_NODE_TYPE_ERR"|"DATA_CLONE_ERR"} LegacyCode
 */

const legacyCodes = {
    INDEX_SIZE_ERR: 1,
    DOMSTRING_SIZE_ERR: 2,
    HIERARCHY_REQUEST_ERR: 3,
    WRONG_DOCUMENT_ERR: 4,
    INVALID_CHARACTER_ERR: 5,
    NO_DATA_ALLOWED_ERR: 6,
    NO_MODIFICATION_ALLOWED_ERR: 7,
    NOT_FOUND_ERR: 8,
    NOT_SUPPORTED_ERR: 9,
    INUSE_ATTRIBUTE_ERR: 10,
    INVALID_STATE_ERR: 11,
    SYNTAX_ERR: 12,
    INVALID_MODIFICATION_ERR: 13,
    NAMESPACE_ERR: 14,
    INVALID_ACCESS_ERR: 15,
    VALIDATION_ERR: 16,
    TYPE_MISMATCH_ERR: 17,
    SECURITY_ERR: 18,
    NETWORK_ERR: 19,
    ABORT_ERR: 20,
    URL_MISMATCH_ERR: 21,
    QUOTA_EXCEEDED_ERR: 22,
    TIMEOUT_ERR: 23,
    INVALID_NODE_TYPE_ERR: 24,
    DATA_CLONE_ERR: 25
};

/**
 *
 * @returns {typeof DOMException}
 */
function createNonNativeDOMExceptionClass () {
    /**
     * @param {string|undefined} message
     * @param {Code|LegacyCode} name
     * @returns {void}
     */
    function DOMException (message, name) {
        // const err = Error.prototype.constructor.call(this, message); // Any use to this? Won't set this.message
        this[Symbol.toStringTag] = 'DOMException';
        this._code = name in codes
            ? codes[/** @type {Code} */ (name)]
            : (legacyCodes[/** @type {LegacyCode} */ (name)] || 0);
        this._name = name || 'Error';
        // We avoid `String()` in this next line as it converts Symbols
        this._message = message === undefined ? '' : ('' + message); // eslint-disable-line no-implicit-coercion
        Object.defineProperty(this, 'code', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: this._code
        });
        if (name !== undefined) {
            Object.defineProperty(this, 'name', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: this._name
            });
        }
        if (message !== undefined) {
            Object.defineProperty(this, 'message', {
                configurable: true,
                enumerable: false,
                writable: true,
                value: this._message
            });
        }
    }

    // Necessary for W3C tests which complains if `DOMException` has properties on its "own" prototype

    // class DummyDOMException extends Error {}; // Sometimes causing problems in Node
    /* eslint-disable func-name-matching */
    /**
     * @class
     */
    const DummyDOMException = function DOMException () { /* */ };
    /* eslint-enable func-name-matching */
    DummyDOMException.prototype = Object.create(Error.prototype); // Intended for subclassing
    /** @type {const} */ (['name', 'message']).forEach((prop) => {
        Object.defineProperty(DummyDOMException.prototype, prop, {
            enumerable: true,
            /**
             * @this {DOMException}
             * @returns {string}
             */
            get () {
                if (!(this instanceof DOMException ||
                    // @ts-expect-error Just checking
                    this instanceof DummyDOMException ||
                    // @ts-expect-error Just checking
                    this instanceof Error)) {
                    throw new TypeError('Illegal invocation');
                }
                return this[prop === 'name' ? '_name' : '_message'];
            }
        });
    });
    // DOMException uses the same `toString` as `Error`
    Object.defineProperty(DummyDOMException.prototype, 'code', {
        configurable: true,
        enumerable: true,
        get () {
            throw new TypeError('Illegal invocation');
        }
    });
    // @ts-expect-error It's ok
    DOMException.prototype = new DummyDOMException();

    DOMException.prototype[Symbol.toStringTag] = 'DOMExceptionPrototype';
    Object.defineProperty(DOMException, 'prototype', {
        writable: false
    });

    const keys = Object.keys(codes);

    /** @type {(keyof codes)[]} */ (keys).forEach(
        (codeName) => {
            Object.defineProperty(DOMException.prototype, codeName, {
                enumerable: true,
                configurable: false,
                value: codes[codeName]
            });
            Object.defineProperty(DOMException, codeName, {
                enumerable: true,
                configurable: false,
                value: codes[codeName]
            });
        }
    );
    /** @type {(keyof legacyCodes)[]} */ (Object.keys(legacyCodes)).forEach((
        codeName
    ) => {
        Object.defineProperty(DOMException.prototype, codeName, {
            enumerable: true,
            configurable: false,
            value: legacyCodes[codeName]
        });
        Object.defineProperty(DOMException, codeName, {
            enumerable: true,
            configurable: false,
            value: legacyCodes[codeName]
        });
    });
    Object.defineProperty(DOMException.prototype, 'constructor', {
        writable: true,
        configurable: true,
        enumerable: false,
        value: DOMException
    });

    // @ts-expect-error We don't need all its properties
    return DOMException;
}

const ShimNonNativeDOMException = createNonNativeDOMExceptionClass();

/**
 * Creates a generic Error object.
 * @param {string} name
 * @param {string} message
 * @returns {Error}
 */
function createNonNativeDOMException (name, message) {
    return new ShimNonNativeDOMException(message, name);
}

/**
 * @typedef {{
 *   message: string|DOMString
 * }} ErrorLike
 */

/**
 * Logs detailed error information to the console.
 * @param {string} name
 * @param {string} message
 * @param {string|ErrorLike|boolean|null} [error]
 * @returns {void}
 */
function logError (name, message, error) {
    if (CFG.DEBUG) {
        const msg = error && typeof error === 'object' && error.message
            ? error.message
            : /** @type {string} */ (error);

        const method = typeof (console.error) === 'function' ? 'error' : 'log';
        console[method](name + ': ' + message + '. ' + (msg || ''));
        if (console.trace) { console.trace(); }
    }
}

/**
 * @typedef {any} ArbitraryValue
 */

/**
 * @param {ArbitraryValue} obj
 * @returns {boolean}
 */
function isErrorOrDOMErrorOrDOMException (obj) {
    return obj && typeof obj === 'object' && // We don't use util.isObj here as mutual dependency causing problems in Babel with browser
        typeof obj.name === 'string';
}

/**
 * Finds the error argument.  This is useful because some WebSQL callbacks
 * pass the error as the first argument, and some pass it as the second
 * argument.
 * @param {(Error|{message?: string, name?: string}|any)[]} args
 * @returns {Error|DOMException|undefined}
 */
function findError (args) {
    let err;
    if (args) {
        if (args.length === 1) {
            return args[0];
        }
        for (const arg of args) {
            if (isErrorOrDOMErrorOrDOMException(arg)) {
                return arg;
            }
            if (arg && typeof arg.message === 'string') {
                err = arg;
            }
        }
    }
    return err;
}

/**
 *
 * @param {SQLError} webSQLErr
 * @returns {(DOMException|Error) & {
 *   sqlError: SQLError
 * }}
 */
function webSQLErrback (webSQLErr) {
    let name, message;
    switch (webSQLErr.code) {
    case 4: { // SQLError.QUOTA_ERR
        name = 'QuotaExceededError';
        message = 'The operation failed because there was not enough ' +
            'remaining storage space, or the storage quota was reached ' +
            'and the user declined to give more space to the database.';
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
    const err =
        /**
         * @type {(Error | DOMException) & {
         *   sqlError: SQLError
         * }}
         */
        (createDOMException(name, message));
    err.sqlError = webSQLErr;
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

const createDOMException = useNativeDOMException
    // eslint-disable-next-line @stylistic/operator-linebreak -- Need JSDoc
    ? /**
     * @param {string} name
     * @param {string} message
     * @param {ErrorLike} [error]
     * @returns {DOMException}
     */
    function (name, message, error) {
        logError(name, message, error);
        return createNativeDOMException(name, message);
    }
    // eslint-disable-next-line @stylistic/operator-linebreak -- Need JSDoc
    : /**
    * @param {string} name
    * @param {string} message
    * @param {ErrorLike} [error]
    * @returns {Error}
    */
    function (name, message, error) {
        logError(name, message, error);
        return createNonNativeDOMException(name, message);
    };

const ShimDOMException = useNativeDOMException
    ? DOMException
    : ShimNonNativeDOMException;

export {logError, findError, ShimDOMException, createDOMException, webSQLErrback};

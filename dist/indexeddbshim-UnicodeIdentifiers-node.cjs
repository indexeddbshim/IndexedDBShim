/*! indexeddbshim - v17.2.1 - 8/18/2026 */

'use strict';

var fs$1 = require('node:fs');
var path = require('path');
var require$$0 = require('fs');
var require$$2 = require('util');

function _typeof(obj) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  }, _typeof(obj);
}

/* eslint-disable n/no-sync -- Want sync naming */
/* eslint-disable no-restricted-syntax -- Instanceof checks */
/* eslint-disable unicorn/no-this-assignment -- TS */

/**
 * @typedef {number} Integer
 */

/**
 * @callback InvokeCurrentListeners
 * @param {AllListeners} listeners
 * @param {EventWithProps} eventCopy
 * @param {string} type
 * @param {boolean} [checkOnListeners]
 * @returns {boolean}
 */

/**
 * @typedef {{
 *   defaultSync?: boolean,
 *   extraProperties?: string[],
 *   legacyOutputDidListenersThrowFlag?: boolean
 * }} CustomOptions
 */
/**
 * @typedef {{
 *   __legacyOutputDidListenersThrowError: unknown,
 *   target: EventTarget & {
 *     invokeCurrentListeners: InvokeCurrentListeners,
 *     _earlyListeners: AllListeners,
 *     _listeners: AllListeners,
 *     _lateListeners: AllListeners,
 *     _defaultListeners: AllListeners
 *   },
 *   composed: boolean,
 *   currentTarget: EventTarget,
 *   eventPhase: 0|1|2|3
 *   defaultPrevented: boolean,
 *   type: string,
 *   bubbles: boolean,
 *   cancelable: boolean,
 *   isTrusted: boolean,
 *   timeStamp: Integer,
 *   initEvent: (type: string, bubbles: boolean, cancelable: boolean) => void,
 *   preventDefault: () => void,
 *   composedPath: () => void,
 *   detail: any,
 *   initCustomEvent: (
 *     type: string, canBubble: boolean, cancelable: boolean,
 *     detail: any
 *   ) => void
 * }} EventWithProps
 */

// Todo: Switch to ES6 classes

var phases = {
  NONE: 0,
  CAPTURING_PHASE: 1,
  AT_TARGET: 2,
  BUBBLING_PHASE: 3
};
var ShimDOMException$1 = typeof DOMException === 'undefined'
// Todo: Better polyfill (if even needed here)
/* eslint-disable no-shadow -- Polyfill */
// eslint-disable-next-line operator-linebreak -- TS/JSDoc needs
?
/**
 * @param {string} msg
 * @param {string} name
 * @returns {Error}
 */
function DOMException(msg, name) {
  // No need for `toString` as same as for `Error`
  /* eslint-enable no-shadow -- Polyfill */
  var err = new Error(msg);
  err.name = name;
  return err;
} : DOMException;
var ev = new WeakMap();
var evCfg = new WeakMap();

// Todo: Set _ev argument outside of this function

/* eslint-disable func-name-matching -- Shim vs. Polyfill */
/* eslint-disable no-shadow -- Polyfilling */
/**
* We use an adapter class rather than a proxy not only for compatibility
* but also since we have to clone native event properties anyways in order
* to properly set `target`, etc.
* The regular DOM method `dispatchEvent` won't work with this polyfill as
* it expects a native event.
* @class
* @param {string} type
*/
var ShimEvent = /** @type {unknown} */function Event(type) {
  var _this = this;
  /* eslint-enable func-name-matching -- Shim vs. Polyfill */
  /* eslint-enable no-shadow -- Polyfilling */
  // For WebIDL checks of function's `length`, we check `arguments` for the optional arguments
  // @ts-expect-error
  this[Symbol.toStringTag] = 'Event';
  this.toString = function () {
    return '[object Event]';
  };
  // eslint-disable-next-line prefer-rest-params -- Don't want to change signature
  var _arguments = Array.prototype.slice.call(arguments),
    evInit = _arguments[1],
    _ev = _arguments[2];
  if (!arguments.length) {
    throw new TypeError("Failed to construct 'Event': 1 argument required, but only 0 present.");
  }
  evInit = evInit || {};
  _ev = _ev || {};

  /** @type {EventWithProps} */
  var _evCfg = {};
  if ('composed' in evInit) {
    _evCfg.composed = evInit.composed;
  }

  // _evCfg.isTrusted = true; // We are not always using this for user-created events
  // _evCfg.timeStamp = new Date().valueOf(); // This is no longer a timestamp, but monotonic (elapsed?)

  ev.set(this, _ev);
  evCfg.set(this, _evCfg);
  var that = /** @type {unknown} */this;
  /** @type {ShimEvent} */
  that.initEvent(type, evInit.bubbles, evInit.cancelable);
  ['target', 'currentTarget', 'eventPhase', 'defaultPrevented'].forEach(function (pr) {
    var prop = /** @type {"target"|"currentTarget"|"eventPhase"|"defaultPrevented"} */
    pr;
    Object.defineProperty(_this, prop, {
      get: function get() {
        return /* prop in _evCfg && */_evCfg[prop] !== undefined ? _evCfg[prop] : prop in _ev ? _ev[prop] :
        // Defaults
        prop === 'eventPhase' ? 0 : prop === 'defaultPrevented' ? false : null;
      }
    });
  });
  var props = [
  // Event
  'type', 'bubbles', 'cancelable',
  // Defaults to false
  'isTrusted', 'timeStamp', 'initEvent',
  // Other event properties (not used by our code)
  'composedPath', 'composed'];
  if (this.toString() === '[object CustomEvent]') {
    props.push('detail', 'initCustomEvent');
  }
  Object.defineProperties(this, props.reduce(function (obj, pr) {
    var prop =
    /**
     * @type {"type"|"bubbles"|"cancelable"|"isTrusted"|
     *   "timeStamp"|"initEvent"|"composedPath"|"composed"|
     *   "detail"|"initCustomEvent"
     * }
     */
    pr;
    obj[prop] = {
      get: function get() {
        return prop in _evCfg ? _evCfg[prop] : prop in _ev ? _ev[prop] : ['bubbles', 'cancelable', 'composed'].includes(prop) ? false : undefined;
      }
    };
    return obj;
  }, /** @type {{[key: string]: any}} */{}));
};

// @ts-expect-error Casting doesn't work
ShimEvent.prototype.preventDefault = function () {
  // @ts-expect-error Needed for exporting
  if (!(this instanceof ShimEvent)) {
    throw new TypeError('Illegal invocation');
  }
  var _ev = ev.get(this);
  var _evCfg = evCfg.get(this);
  if (this.cancelable && !_evCfg._passive) {
    _evCfg.defaultPrevented = true;
    if (typeof _ev.preventDefault === 'function') {
      // Prevent any predefined defaults
      _ev.preventDefault();
    }
  }
};

// @ts-expect-error Casting doesn't work
ShimEvent.prototype.stopImmediatePropagation = function () {
  var _evCfg = evCfg.get(this);
  _evCfg._stopImmediatePropagation = true;
};

// @ts-expect-error Casting doesn't work
ShimEvent.prototype.stopPropagation = function () {
  var _evCfg = evCfg.get(this);
  _evCfg._stopPropagation = true;
};

// @ts-expect-error Casting doesn't work
ShimEvent.prototype.initEvent = function (type, bubbles, cancelable) {
  // Chrome currently has function length 1 only but WebIDL says 3
  // const bubbles = arguments[1];
  // const cancelable = arguments[2];
  var _evCfg = evCfg.get(this);
  if (_evCfg._dispatched) {
    return;
  }
  Object.defineProperty(this, 'type', {
    enumerable: true,
    configurable: true,
    get: function get() {
      return type;
    }
  });
  Object.defineProperty(this, 'bubbles', {
    enumerable: true,
    configurable: true,
    get: function get() {
      return bubbles;
    }
  });
  Object.defineProperty(this, 'cancelable', {
    enumerable: true,
    configurable: true,
    get: function get() {
      return cancelable;
    }
  });
  _evCfg.type = type;
  if (bubbles !== undefined) {
    _evCfg.bubbles = bubbles;
  }
  if (cancelable !== undefined) {
    _evCfg.cancelable = cancelable;
  }
};
['type', 'target', 'currentTarget'].forEach(function (prop) {
  // @ts-expect-error Casting doesn't work
  Object.defineProperty(ShimEvent.prototype, prop, {
    enumerable: true,
    configurable: true,
    get: function get() {
      throw new TypeError('Illegal invocation');
    }
  });
});
['eventPhase', 'defaultPrevented', 'bubbles', 'cancelable', 'timeStamp'].forEach(function (prop) {
  // @ts-expect-error Casting doesn't work
  Object.defineProperty(ShimEvent.prototype, prop, {
    enumerable: true,
    configurable: true,
    get: function get() {
      throw new TypeError('Illegal invocation');
    }
  });
});
['NONE', 'CAPTURING_PHASE', 'AT_TARGET', 'BUBBLING_PHASE'].forEach(function (prop, i) {
  Object.defineProperty(ShimEvent, prop, {
    enumerable: true,
    writable: false,
    value: i
  });
  // @ts-expect-error Casting doesn't work
  Object.defineProperty(ShimEvent.prototype, prop, {
    writable: false,
    value: i
  });
});
// @ts-expect-error Casting doesn't work
ShimEvent[Symbol.toStringTag] = 'Function';

// @ts-expect-error Casting doesn't work
ShimEvent.prototype[Symbol.toStringTag] = 'EventPrototype';
Object.defineProperty(ShimEvent, 'prototype', {
  writable: false
});

/* eslint-disable func-name-matching -- Polyfill */
/* eslint-disable no-shadow -- Polyfill */
/**
 * @class
 * @param {string} type
 */
var ShimCustomEvent = /** @type {unknown} */function CustomEvent(type) {
  /* eslint-enable func-name-matching -- Polyfill */
  /* eslint-enable no-shadow -- Polyfill */

  // eslint-disable-next-line prefer-rest-params -- Keep signature
  var _arguments2 = Array.prototype.slice.call(arguments),
    evInit = _arguments2[1],
    _ev = _arguments2[2];
  // @ts-expect-error Casting doesn't work
  ShimEvent.call(this, type, evInit, _ev);
  // @ts-expect-error
  this[Symbol.toStringTag] = 'CustomEvent';
  this.toString = function () {
    return '[object CustomEvent]';
  };
  // var _evCfg = evCfg.get(this);
  evInit = evInit || {};
  // @ts-ignore
  this.initCustomEvent(type, evInit.bubbles, evInit.cancelable, 'detail' in evInit ? evInit.detail : null);
};
// @ts-expect-error Casting doesn't work
Object.defineProperty(ShimCustomEvent.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: ShimCustomEvent
});
// @ts-expect-error Casting doesn't work
ShimCustomEvent.prototype.initCustomEvent = function (type, bubbles, cancelable, detail) {
  // @ts-expect-error Needed for exporting
  if (!(this instanceof ShimCustomEvent)) {
    throw new TypeError('Illegal invocation');
  }
  var _evCfg = evCfg.get(this);
  // @ts-expect-error Casting doesn't work
  ShimCustomEvent.call(this, type, {
    bubbles: bubbles,
    cancelable: cancelable,
    detail: detail
    // eslint-disable-next-line prefer-rest-params -- Keep signature
  }, arguments[4]);
  if (_evCfg._dispatched) {
    return;
  }
  if (detail !== undefined) {
    _evCfg.detail = detail;
  }
  Object.defineProperty(this, 'detail', {
    get: function get() {
      return _evCfg.detail;
    }
  });
};
// @ts-expect-error Casting doesn't work
ShimCustomEvent[Symbol.toStringTag] = 'Function';
// @ts-expect-error Casting doesn't work
ShimCustomEvent.prototype[Symbol.toStringTag] = 'CustomEventPrototype';

// @ts-expect-error Casting doesn't work
Object.defineProperty(ShimCustomEvent.prototype, 'detail', {
  enumerable: true,
  configurable: true,
  get: function get() {
    throw new TypeError('Illegal invocation');
  }
});
Object.defineProperty(ShimCustomEvent, 'prototype', {
  writable: false
});

/**
 *
 * @param {EventWithProps} e
 * @returns {EventWithProps}
 */
function copyEvent(e) {
  var bubbles = e.bubbles,
    cancelable = e.cancelable,
    detail = e.detail,
    type = e.type;
  if ('detail' in e) {
    // @ts-expect-error Casting doesn't work
    return new ShimCustomEvent(type, {
      bubbles: bubbles,
      cancelable: cancelable,
      detail: detail
    }, e);
  }
  // @ts-expect-error Casting doesn't work
  return new ShimEvent(type, {
    bubbles: bubbles,
    cancelable: cancelable
  }, e);
}

/**
* @typedef {object} ListenerOptions
* @property {boolean} [once] Remove listener after invoking once
* @property {boolean} [passive] Don't allow `preventDefault`
* @property {boolean} [capture] Use `_children` and set `eventPhase`
*/

/**
* @typedef {object} ListenerAndOptions
* @property {Listener} listener
* @property {ListenerOptions} options
*/

/**
* @typedef {object} ListenerInfo
* @property {ListenerAndOptions[]} listenersByTypeOptions
* @property {ListenerOptions} options
* @property {ListenerAndOptions[]} listenersByType
*/

/**
* @callback Listener
* @param {EventWithProps} e
* @returns {boolean}
*/

/**
 * Keys are event types.
 * @typedef {{[key: string]: Listener[]}} Listeners
 */

/**
 * @typedef {{
 *   [type: string]: ListenerAndOptions[]
 * }} AllListeners
 */

/**
 *
 * @param {AllListeners} listeners
 * @param {string} type
 * @param {boolean|ListenerOptions} options
 * @returns {ListenerInfo}
 */
function getListenersOptions(listeners, type, options) {
  var listenersByType = listeners[type];
  if (listenersByType === undefined) listeners[type] = listenersByType = [];
  var opts = typeof options === 'boolean' ? {
    capture: options
  } : options || {};
  var stringifiedOptions = JSON.stringify(opts);
  var listenersByTypeOptions = listenersByType.filter(function (obj) {
    return stringifiedOptions === JSON.stringify(obj.options);
  });
  return {
    listenersByTypeOptions: listenersByTypeOptions,
    options: opts,
    listenersByType: listenersByType
  };
}
var methods = {
  /**
   * @param {AllListeners} listeners
   * @param {Listener} listener
   * @param {string} type
   * @param {boolean|ListenerOptions} options
   * @returns {void}
   */
  addListener: function addListener(listeners, listener, type, options) {
    var listenersOptions = getListenersOptions(listeners, type, options);
    var listenersByTypeOptions = listenersOptions.listenersByTypeOptions;
    options = listenersOptions.options;
    var listenersByType = listenersOptions.listenersByType;
    if (listenersByTypeOptions.some(function (l) {
      return l.listener === listener;
    })) return;
    listenersByType.push({
      listener: listener,
      options: options
    });
  },
  /**
   * @param {AllListeners} listeners
   * @param {Listener} listener
   * @param {string} type
   * @param {boolean|ListenerOptions} options
   * @returns {void}
   */
  removeListener: function removeListener(listeners, listener, type, options) {
    var listenersOptions = getListenersOptions(listeners, type, options);
    var listenersByType = listenersOptions.listenersByType;
    var stringifiedOptions = JSON.stringify(listenersOptions.options);
    listenersByType.some(function (l, i) {
      if (l.listener === listener && stringifiedOptions === JSON.stringify(l.options)) {
        listenersByType.splice(i, 1);
        if (!listenersByType.length) delete listeners[type];
        return true;
      }
      return false;
    });
  },
  /**
   *
   * @param {AllListeners} listeners
   * @param {Listener} listener
   * @param {string} type
   * @param {boolean|ListenerOptions} options
   * @returns {boolean}
   */
  hasListener: function hasListener(listeners, listener, type, options) {
    var listenersOptions = getListenersOptions(listeners, type, options);
    var listenersByTypeOptions = listenersOptions.listenersByTypeOptions;
    return listenersByTypeOptions.some(function (l) {
      return l.listener === listener;
    });
  }
};

/* eslint-disable no-shadow -- Polyfill */
/**
 * @class
 */
function EventTarget() {
  /* eslint-enable no-shadow -- Polyfill */
  throw new TypeError('Illegal constructor');
}

/**
 * @typedef {"addEarlyEventListener"|"removeEarlyEventListener"|"hasEarlyEventListener"|
 *   "addEventListener"|"removeEventListener"|"hasEventListener"|
 *   "addLateEventListener"|"removeLateEventListener"|"hasLateEventListener"|
 *   "addDefaultEventListener"|"removeDefaultEventListener"|"hasDefaultEventListener"
 * } ListenerName
 */
Object.assign(EventTarget.prototype, ['Early', '', 'Late', 'Default'].reduce(function (/** @type {{[key: string]: Function}} */
obj, listenerType) {
  ['add', 'remove', 'has'].forEach(function (method) {
    var mainMethod = /** @type {ListenerName} */method + listenerType + 'EventListener';
    /**
     * @param {string} type
     * @param {Listener|{handleEvent: Listener}} listener
     * @this {EventTarget & {
     *   _earlyListeners: AllListeners,
     *   _listeners: AllListeners,
     *   _lateListeners: AllListeners,
     *   _defaultListeners: AllListeners,
     * }}
     * @returns {boolean|void}
     */
    obj[mainMethod] = function (type, listener) {
      // eslint-disable-next-line prefer-rest-params -- Keep signature
      var options = arguments[2]; // We keep the listener `length` as per WebIDL
      if (arguments.length < 2) throw new TypeError('2 or more arguments required');
      if (typeof type !== 'string') {
        // @ts-expect-error It's ok to construct
        throw new ShimDOMException$1('UNSPECIFIED_EVENT_TYPE_ERR', 'UNSPECIFIED_EVENT_TYPE_ERR');
      }
      try {
        // As per code such as the following, handleEvent may throw,
        //  but is uncaught
        // https://github.com/web-platform-tests/wpt/blob/master/IndexedDB/fire-error-event-exception.html#L54-L56
        if ('handleEvent' in listener && listener.handleEvent.bind) {
          listener = listener.handleEvent.bind(listener);
        }
      } catch (err) {
        // eslint-disable-next-line no-console -- Feedback to user
        console.log('Uncaught `handleEvent` error', err);
      }
      var arrStr = /** @type {"_earlyListeners"|"_listeners"|"_lateListeners"|"_defaultListeners"} */
      '_' + listenerType.toLowerCase() + (listenerType === '' ? 'l' : 'L') + 'isteners';
      if (!this[arrStr]) {
        Object.defineProperty(this, arrStr, {
          value: {}
        });
      }
      var meth = /** @type {"addListener"|"removeListener"|"hasListener"} */
      method + 'Listener';
      return methods[meth](this[arrStr], /** @type {Listener} */listener, type, options);
    };
  });
  return obj;
}, {}));
Object.assign(EventTarget.prototype, {
  _legacyOutputDidListenersThrowCheck: undefined,
  /**
   * @param {CustomOptions} customOptions
   * @this {EventTarget.prototype}
   * @returns {void}
   */
  __setOptions: function __setOptions(customOptions) {
    customOptions = customOptions || {};
    // Todo: Make into event properties?
    this._defaultSync = customOptions.defaultSync;
    this._extraProperties = customOptions.extraProperties || [];
    if (customOptions.legacyOutputDidListenersThrowFlag) {
      // IndexedDB
      this._legacyOutputDidListenersThrowCheck = true;
      this._extraProperties.push('__legacyOutputDidListenersThrowError');
    }
  },
  /**
   * @param {ShimEvent} e
   * @this {EventTarget & {
   *   _dispatchEvent: (e: ShimEvent|ShimCustomEvent, setTarget: boolean) => boolean,
  * }}
   * @returns {boolean}
   */
  dispatchEvent: function dispatchEvent(e) {
    return this._dispatchEvent(e, true);
  },
  /**
   * @param {EventWithProps} e
   * @param {boolean} setTarget
   * @this {EventTarget.prototype & {
   *   _earlyListeners: AllListeners,
   *   _listeners: AllListeners,
   *   _lateListeners: AllListeners,
   *   _defaultListeners: AllListeners,
   * }}
   * @returns {boolean}
   */
  _dispatchEvent: function _dispatchEvent(e, setTarget) {
    var _this2 = this;
    ['early', '', 'late', 'default'].forEach(function (listenerType) {
      var arrStr = /** @type {"_earlyListeners"|"_listeners"|"_lateListeners"|"_defaultListeners"} */
      '_' + listenerType + (listenerType === '' ? 'l' : 'L') + 'isteners';
      if (!_this2[arrStr]) {
        Object.defineProperty(_this2, arrStr, {
          value: {}
        });
      }
    });
    var _evCfg = evCfg.get(e);
    if (_evCfg && setTarget && _evCfg._dispatched) {
      // @ts-expect-error It's ok to construct
      throw new ShimDOMException$1('The object is in an invalid state.', 'InvalidStateError');
    }

    /** @type {EventWithProps} */
    var eventCopy;
    if (_evCfg) {
      eventCopy = e;
    } else {
      eventCopy = copyEvent(e);
      _evCfg = evCfg.get(eventCopy);
      _evCfg._dispatched = true;

      /** @type {string[]} */
      this._extraProperties.forEach(function (prop) {
        if (prop in e) {
          /** @type {{[key: string]: any}} */eventCopy[prop] = /** @type {{[key: string]: any}} */e[prop]; // Todo: Put internal to `ShimEvent`?
        }
      });
    }
    var _eventCopy = eventCopy,
      type = _eventCopy.type;

    /**
     *
     * @returns {void}
     */
    function finishEventDispatch() {
      _evCfg.eventPhase = phases.NONE;
      _evCfg.currentTarget = null;
      delete _evCfg._children;
    }
    /**
     *
     * @returns {void}
     */
    function invokeDefaults() {
      // Ignore stopPropagation from defaults
      _evCfg._stopImmediatePropagation = undefined;
      _evCfg._stopPropagation = undefined;
      // We check here for whether we should invoke since may have changed since timeout (if late listener prevented default)
      if (!eventCopy.defaultPrevented || !_evCfg.cancelable) {
        // 2nd check should be redundant
        _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke default listeners
        eventCopy.target.invokeCurrentListeners(eventCopy.target._defaultListeners, eventCopy, type);
      }
      finishEventDispatch();
    }
    var continueEventDispatch = function continueEventDispatch() {
      // Ignore stop propagation of user now
      _evCfg._stopImmediatePropagation = undefined;
      _evCfg._stopPropagation = undefined;
      if (!_this2._defaultSync) {
        setTimeout(invokeDefaults, 0);
      } else invokeDefaults();
      _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke late listeners
      // Sync default might have stopped
      if (!_evCfg._stopPropagation) {
        _evCfg._stopImmediatePropagation = undefined;
        _evCfg._stopPropagation = undefined;
        // We could allow stopPropagation by only executing upon (_evCfg._stopPropagation)
        eventCopy.target.invokeCurrentListeners(eventCopy.target._lateListeners, eventCopy, type);
      }
      finishEventDispatch();
      return !eventCopy.defaultPrevented;
    };
    if (setTarget) _evCfg.target = this;
    switch ('eventPhase' in eventCopy && eventCopy.eventPhase) {
      case phases.CAPTURING_PHASE:
        {
          if (_evCfg._stopPropagation) {
            return continueEventDispatch();
          }
          this.invokeCurrentListeners(this._listeners, eventCopy, type);
          var child = _evCfg._children && _evCfg._children.length && _evCfg._children.pop();
          if (!child || child === eventCopy.target) {
            _evCfg.eventPhase = phases.AT_TARGET;
          }
          if (child) child._defaultSync = this._defaultSync;
          return (child || this)._dispatchEvent(eventCopy, false);
        }
      case phases.AT_TARGET:
        if (_evCfg._stopPropagation) {
          return continueEventDispatch();
        }
        this.invokeCurrentListeners(this._listeners, eventCopy, type, true);
        if (!_evCfg.bubbles) {
          return continueEventDispatch();
        }
        _evCfg.eventPhase = phases.BUBBLING_PHASE;
        return this._dispatchEvent(eventCopy, false);
      case phases.BUBBLING_PHASE:
        {
          if (_evCfg._stopPropagation) {
            return continueEventDispatch();
          }
          var parent = this.__getParent && this.__getParent();
          if (!parent) {
            return continueEventDispatch();
          }
          parent.invokeCurrentListeners(parent._listeners, eventCopy, type, true);
          parent._defaultSync = this._defaultSync;
          return parent._dispatchEvent(eventCopy, false);
        }
      case phases.NONE:
      default:
        {
          _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke early listeners
          this.invokeCurrentListeners(this._earlyListeners, eventCopy, type);
          if (!('__getParent' in this)) {
            _evCfg.eventPhase = phases.AT_TARGET;
            return this._dispatchEvent(eventCopy, false);
          }

          /* eslint-disable consistent-this -- Readability */
          var par = this;
          var root_ = this;
          /* eslint-enable consistent-this -- Readability */
          while (par.__getParent && (par = par.__getParent()) !== null) {
            if (!_evCfg._children) {
              _evCfg._children = [];
            }
            _evCfg._children.push(root_);
            root_ = par;
          }
          root_._defaultSync = this._defaultSync;
          _evCfg.eventPhase = phases.CAPTURING_PHASE;
          return root_._dispatchEvent(eventCopy, false);
        }
    }
  },
  /**
   * @type {InvokeCurrentListeners}
   * @this {EventTarget.prototype & {[key: string]: Listener}}
   */
  invokeCurrentListeners: function invokeCurrentListeners(listeners, eventCopy, type, checkOnListeners) {
    var _this3 = this;
    var _evCfg = evCfg.get(eventCopy);
    _evCfg.currentTarget = this;
    var listOpts = getListenersOptions(listeners, type, {});
    // eslint-disable-next-line unicorn/prefer-spread -- Performance?
    var listenersByType = listOpts.listenersByType.concat();
    var dummyIPos = listenersByType.length ? 1 : 0;
    listenersByType.some(function (listenerObj, i) {
      var onListener = checkOnListeners ? _this3['on' + type] : null;
      if (_evCfg._stopImmediatePropagation) return true;
      if (i === dummyIPos && typeof onListener === 'function') {
        // We don't splice this in as could be overwritten; executes here per
        //    https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes:event-handlers-14
        _this3.tryCatch(eventCopy, function () {
          var ret = onListener.call(eventCopy.currentTarget, eventCopy);
          if (ret === false) {
            eventCopy.preventDefault();
          }
        });
      }
      var options = listenerObj.options;
      var once = options.once,
        passive = options.passive,
        capture = options.capture;
      _evCfg._passive = passive;
      if (capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.CAPTURING_PHASE || eventCopy.eventPhase === phases.AT_TARGET || !capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.BUBBLING_PHASE) {
        var listener = listenerObj.listener;
        _this3.tryCatch(eventCopy, function () {
          listener.call(eventCopy.currentTarget, eventCopy);
        });
        if (once) {
          _this3.removeEventListener(type, listener, options);
        }
      }
      return false;
    });
    this.tryCatch(eventCopy, function () {
      var onListener = checkOnListeners ? _this3['on' + type] : null;
      if (typeof onListener === 'function' && listenersByType.length < 2) {
        var ret = onListener.call(eventCopy.currentTarget, eventCopy); // Won't have executed if too short
        if (ret === false) {
          eventCopy.preventDefault();
        }
      }
    });
    return !eventCopy.defaultPrevented;
  },
  /* eslint-disable promise/prefer-await-to-callbacks -- Try-catch */
  /**
   * @param {EventWithProps} evt
   * @param {() => void} cb
   * @returns {void}
   */
  tryCatch: function tryCatch(evt, cb) {
    /* eslint-enable promise/prefer-await-to-callbacks -- Try-catch */
    try {
      // Per MDN: Exceptions thrown by event handlers are reported
      //    as uncaught exceptions; the event handlers run on a nested
      //    callstack: they block the caller until they complete, but
      //    exceptions do not propagate to the caller.
      // eslint-disable-next-line promise/prefer-await-to-callbacks, n/callback-return --  Try-catch
      cb();
    } catch (err) {
      this.triggerErrorEvent(err, evt);
    }
  },
  /**
   * @param {unknown} err
   * @param {EventWithProps} evt
   * @returns {void}
   */
  triggerErrorEvent: function triggerErrorEvent(err, evt) {
    var error = err;
    if (typeof err === 'string') {
      error = new Error('Uncaught exception: ' + err);
    }
    var triggerGlobalErrorEvent;
    var useNodeImpl = false;
    if (typeof window === 'undefined' || typeof ErrorEvent === 'undefined' || window && (typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object' && !window.dispatchEvent) {
      useNodeImpl = true;
      triggerGlobalErrorEvent = function triggerGlobalErrorEvent() {
        setTimeout(function () {
          // Node won't be able to catch in this way if we throw in the main thread
          // console.log(err); // Should we auto-log for user?
          throw error; // Let user listen to `process.on('uncaughtException', (err) => {});`
        });
      };
    } else {
      triggerGlobalErrorEvent = function triggerGlobalErrorEvent() {
        // See https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
        //     and https://github.com/w3c/IndexedDB/issues/49

        // Note that a regular Event will properly trigger
        //     `window.addEventListener('error')` handlers, but it will not trigger
        //     `window.onerror` as per https://html.spec.whatwg.org/multipage/webappapis.html#handler-onerror
        // Note also that the following line won't handle `window.addEventListener` handlers
        //        if (window.onerror) window.onerror(error.message, err.fileName, err.lineNumber, error.columnNumber, error);

        // `ErrorEvent` properly triggers `window.onerror` and `window.addEventListener('error')` handlers
        var errEv = new ErrorEvent('error', {
          error: err,
          message: /** @type {Error} */error.message || '',
          // We can't get the actually useful user's values!
          filename: /** @type {Error & {fileName: string}} */error.fileName || '',
          lineno: /** @type {Error & {lineNumber: Integer}} */error.lineNumber || 0,
          colno: /** @type {Error & {columnNumber: Integer}} */error.columnNumber || 0
        });
        window.dispatchEvent(errEv);
        // console.log(err); // Should we auto-log for user?
      };
    }

    // Todo: This really should always run here but as we can't set the global
    //     `window` (e.g., using jsdom) since `setGlobalVars` becomes unable to
    //     shim `indexedDB` in such a case currently (apparently due to
    //     <https://github.com/axemclion/IndexedDBShim/issues/280>), we can't
    //     avoid the above Node implementation (which, while providing some
    //     fallback mechanism, is unstable)
    if (!useNodeImpl || !this._legacyOutputDidListenersThrowCheck) triggerGlobalErrorEvent();

    // See https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke and
    //    https://github.com/w3c/IndexedDB/issues/140 (also https://github.com/w3c/IndexedDB/issues/49 )
    if (this._legacyOutputDidListenersThrowCheck) {
      evt.__legacyOutputDidListenersThrowError = error;
    }
  }
});
EventTarget.prototype[Symbol.toStringTag] = 'EventTargetPrototype';
Object.defineProperty(EventTarget, 'prototype', {
  writable: false
});
var ShimEventTarget = EventTarget;
var EventTargetFactory = {
  /**
   * @param {CustomOptions} customOptions
   * @returns {EventTarget}
   */
  createInstance: function createInstance(customOptions) {
    /* eslint-disable func-name-matching -- Shim vs. Polyfill */
    /* eslint-disable no-shadow -- Polyfill */
    /**
     * @class
     * @this {typeof ShimEventTarget.prototype}
     */
    var ET = /** @type {unknown} */function EventTarget() {
      /* eslint-enable no-shadow -- Polyfill */
      /* eslint-enable func-name-matching -- Shim vs. Polyfill */
      this.__setOptions(customOptions);
    };
    // @ts-expect-error Casting doesn't work
    ET.prototype = ShimEventTarget.prototype;
    // @ts-expect-error Casting doesn't work
    return new ET();
  }
};
EventTarget.ShimEvent = ShimEvent;
EventTarget.ShimCustomEvent = ShimCustomEvent;
EventTarget.ShimDOMException = ShimDOMException$1;
EventTarget.ShimEventTarget = EventTarget;
EventTarget.EventTargetFactory = EventTargetFactory;

/**
 * @returns {void}
 */
function setPrototypeOfCustomEvent() {
  // TODO: IDL needs but reported as slow!
  Object.setPrototypeOf(ShimCustomEvent, /** @type {object} */ShimEvent);
  // @ts-expect-error How to overcome?
  Object.setPrototypeOf(ShimCustomEvent.prototype, ShimEvent.prototype);
}

/**
 * @typedef {T[keyof T]} ValueOf<T>
 * @template T
 */

/**
 * @typedef {{unlink: (path: string, cb: import('fs').NoParamCallback) => void}} FSApi
 */

/**
 * @typedef {{
 *   DEBUG: boolean,
 *   cacheDatabaseInstances: boolean,
 *   autoName: boolean,
 *   fullIDLSupport: boolean,
 *   checkOrigin: boolean,
 *   cursorPreloadPackSize: number,
 *   UnicodeIDStart: string,
 *   UnicodeIDContinue: string,
 *   registerSCA: (
 *     preset: import('typeson').Preset
 *   ) => import('typeson').Preset,
 *   avoidAutoShim: boolean,
 *   win: {
 *     openDatabase: (name: string, version: string, displayName: string, estimatedSize: number) => import('websql-configurable').default
 *   },
 *   DEFAULT_DB_SIZE: number,
 *   useSQLiteIndexes: boolean,
 *   fs: FSApi,
 *   addNonIDBGlobals: boolean,
 *   replaceNonIDBGlobals: boolean,
 *   escapeDatabaseName: (name: string) => string,
 *   unescapeDatabaseName: (name: string) => string,
 *   databaseCharacterEscapeList: string|false,
 *   databaseNameLengthLimit: number|false,
 *   escapeNFDForDatabaseNames: boolean,
 *   addSQLiteExtension: boolean,
 *   memoryDatabase: string,
 *   deleteDatabaseFiles: boolean,
 *   databaseBasePath: string,
 *   sysDatabaseBasePath: string,
 *   sqlBusyTimeout: number,
 *   sqlTrace: () => void,
 *   sqlProfile: () => void,
 *   escapeNULForSQLiteStatements: boolean,
 *   createIndexes: boolean
 * }} ConfigValues
 */

/**
 * @typedef {ValueOf<ConfigValues>} ConfigValue
 */

/** @type {{[key: string]: ConfigValue}} */
const map = {};
const CFG = /** @type {ConfigValues} */{};

/**
 * @typedef {keyof ConfigValues} KeyofConfigValues
 */

/**
 * @typedef {KeyofConfigValues[]} Config
 */

/** @type {Config} */
// eslint-disable-next-line unicorn/no-top-level-side-effects -- Would be good
[
// Boolean for verbose reporting
'DEBUG',
// Effectively defaults to false (ignored unless `true`)

// Boolean (effectively defaults to true) on whether to cache WebSQL
//  `openDatabase` instances
'cacheDatabaseInstances',
// Boolean on whether to auto-name databases (based on an
//   auto-increment) when the empty string is supplied; useful with
//   `memoryDatabase`; defaults to `false` which means the empty string
//   will be used as the (valid) database name
'autoName',
// Determines whether the slow-performing `Object.setPrototypeOf`
//    calls required for full WebIDL compliance will be used. Probably
//    only needed for testing or environments where full introspection
//    on class relationships is required; see
//    https://stackoverflow.com/questions/41927589/rationales-consequences-of-webidl-class-inheritance-requirements
'fullIDLSupport',
// Effectively defaults to false (ignored unless `true`)

// Boolean on whether to perform origin checks in `IDBFactory` methods
// Effectively defaults to `true` (must be set to `false` to cancel checks)
'checkOrigin',
// Used by `IDBCursor` continue methods for number of records to cache;
//  Defaults to 100
'cursorPreloadPackSize',
// See optional API (`shimIndexedDB.__setUnicodeIdentifiers`);
//    or just use the Unicode builds which invoke this method
//    automatically using the large, fully spec-compliant, regular
//    expression strings of `src/UnicodeIdentifiers.js`)
// In the non-Unicode builds, defaults to /[$A-Z_a-z]/
'UnicodeIDStart',
// In the non-Unicode builds, defaults to /[$0-9A-Z_a-z]/
'UnicodeIDContinue',
// Used by SCA.js for optional restructuring of typeson-registry
//   Structured Cloning Algorithm; should only be needed for ensuring data
//   created in 3.* versions of IndexedDBShim continue to work; see the
//   library `typeson-registry-sca-reverter` to get a function to do this
'registerSCA',
// BROWSER-SPECIFIC CONFIG
'avoidAutoShim',
// Where WebSQL is detected but where `indexedDB` is
//    missing or poor support is known (non-Chrome Android or
//    non-Safari iOS9), the shim will be auto-applied without
//   `shimIndexedDB.__useShim()`. Set this to `true` to avoid forcing
//    the shim for such cases.

// -----------SQL CONFIG----------
// Object (`window` in the browser) on which there may be an
//  `openDatabase` method (if any) for WebSQL. (The browser
//  throws if attempting to call `openDatabase` without the window
//  so this is why the config doesn't just allow the function.)
// Defaults to `window` or `self` in browser builds or
//  a singleton object with the `openDatabase` method set to
//  the "websql" package in Node.
'win',
// For internal `openDatabase` calls made by `IDBFactory` methods;
//  per the WebSQL spec, "User agents are expected to use the display name
//  and the estimated database size to optimize the user experience.
//  For example, a user agent could use the estimated size to suggest an
//  initial quota to the user. This allows a site that is aware that it
//  will try to use hundreds of megabytes to declare this upfront, instead
//  of the user agent prompting the user for permission to increase the
//  quota every five megabytes."
// Defaults to (4 * 1024 * 1024) or (25 * 1024 * 1024) in Safari
'DEFAULT_DB_SIZE',
// Whether to create indexes on SQLite tables (and also whether to try
//   dropping)
// Effectively defaults to `false` (ignored unless `true`)
'useSQLiteIndexes',
// NODE-IMPINGING SETTINGS (created for sake of limitations in Node
//    or desktop file system implementation but applied by default in
//    browser for parity)

// File system module with `unlink` to remove deleted database files
'fs',
// Used when setting global shims to determine whether to try to add
//   other globals shimmed by the library (`ShimDOMException`,
//   `ShimDOMStringList`, `ShimEvent`, `ShimCustomEvent`, `ShimEventTarget`)
// Effectively defaults to `false` (ignored unless `true`)
'addNonIDBGlobals',
// Used when setting global shims to determine whether to try to overwrite
//   other globals shimmed by the library (`DOMException`, `DOMStringList`,
//   `Event`, `CustomEvent`, `EventTarget`)
// Effectively defaults to `false` (ignored unless `true`)
'replaceNonIDBGlobals',
// Overcoming limitations with node-sqlite3/storing database name on
//   file systems
// https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
// Defaults to prefixing database with `D_`, escaping
//   `databaseCharacterEscapeList`, escaping NUL, and
//   escaping upper case letters, as well as enforcing
//   `databaseNameLengthLimit`
'escapeDatabaseName',
// Not used internally; usable as a convenience method
'unescapeDatabaseName',
// Defaults to global regex representing the following
//   (characters nevertheless commonly reserved in modern,
//   Unicode-supporting systems): 0x00-0x1F 0x7F " * / : < > ? \ |
'databaseCharacterEscapeList',
// Defaults to 254 (shortest typical modern file length limit)
'databaseNameLengthLimit',
// Boolean defaulting to true on whether to escape NFD-escaping
//   characters to avoid clashes on MacOS which performs NFD on files
'escapeNFDForDatabaseNames',
// Boolean on whether to add the `.sqlite` extension to file names;
//   defaults to `true`
'addSQLiteExtension',
// Various types of in-memory databases that can auto-delete
['memoryDatabase',
/**
 * @param {string} val
 * @throws {TypeError}
 * @returns {void}
 */
val => {
  if (!/^(?::memory:|file::memory:(\?[^#]*)?(#.*)?)?$/u.test(/** @type {string} */val)) {
    throw new TypeError('`memoryDatabase` must be the empty string, ":memory:", or a ' + '"file::memory:[?queryString][#hash] URL".');
  }
}],
// NODE-SPECIFIC CONFIG
// Boolean on whether to delete the database file itself after
//   `deleteDatabase`; defaults to `true` as the database will be empty
'deleteDatabaseFiles', 'databaseBasePath', 'sysDatabaseBasePath',
// NODE-SPECIFIC WEBSQL CONFIG
'sqlBusyTimeout',
// Defaults to 1000
'sqlTrace',
// Callback not used by default
'sqlProfile',
// Callback not used by default
// Defaults to true except in Node builds where we can preserve literal NUL with better-sqlite3
'escapeNULForSQLiteStatements', 'createIndexes'].forEach(prop => {
  /** @type {(val: any) => void} */
  let validator;
  if (Array.isArray(prop)) {
    [prop, validator] = prop;
  }
  Object.defineProperty(CFG, prop, {
    get() {
      return map[prop];
    },
    set(val) {
      if (validator) {
        validator(val);
      }
      map[prop] = val;
    }
  });
});

// @ts-nocheck

function getDefaultExportFromCjs$1(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}
var regex$1;
var hasRequiredRegex;
function requireRegex() {
  if (hasRequiredRegex) return regex$1;
  hasRequiredRegex = 1;
  regex$1 = /[\xC0-\xC5\xC7-\xCF\xD1-\xD6\xD9-\xDD\xE0-\xE5\xE7-\xEF\xF1-\xF6\xF9-\xFD\xFF-\u010F\u0112-\u0125\u0128-\u0130\u0134-\u0137\u0139-\u013E\u0143-\u0148\u014C-\u0151\u0154-\u0165\u0168-\u017E\u01A0\u01A1\u01AF\u01B0\u01CD-\u01DC\u01DE-\u01E3\u01E6-\u01F0\u01F4\u01F5\u01F8-\u021B\u021E\u021F\u0226-\u0233\u0344\u0385\u0386\u0388-\u038A\u038C\u038E-\u0390\u03AA-\u03B0\u03CA-\u03CE\u03D3\u03D4\u0400\u0401\u0403\u0407\u040C-\u040E\u0419\u0439\u0450\u0451\u0453\u0457\u045C-\u045E\u0476\u0477\u04C1\u04C2\u04D0-\u04D3\u04D6\u04D7\u04DA-\u04DF\u04E2-\u04E7\u04EA-\u04F5\u04F8\u04F9\u0622-\u0626\u06C0\u06C2\u06D3\u0929\u0931\u0934\u0958-\u095F\u09CB\u09CC\u09DC\u09DD\u09DF\u0A33\u0A36\u0A59-\u0A5B\u0A5E\u0B48\u0B4B\u0B4C\u0B5C\u0B5D\u0B94\u0BCA-\u0BCC\u0C48\u0CC0\u0CC7\u0CC8\u0CCA\u0CCB\u0D4A-\u0D4C\u0DDA\u0DDC-\u0DDE\u0F43\u0F4D\u0F52\u0F57\u0F5C\u0F69\u0F73\u0F75\u0F76\u0F78\u0F81\u0F93\u0F9D\u0FA2\u0FA7\u0FAC\u0FB9\u1026\u1B06\u1B08\u1B0A\u1B0C\u1B0E\u1B12\u1B3B\u1B3D\u1B40\u1B41\u1B43\u1E00-\u1E99\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FC1-\u1FC4\u1FC6-\u1FD3\u1FD6-\u1FDB\u1FDD-\u1FEE\u1FF2-\u1FF4\u1FF6-\u1FFC\u212B\u219A\u219B\u21AE\u21CD-\u21CF\u2204\u2209\u220C\u2224\u2226\u2241\u2244\u2247\u2249\u2260\u2262\u226D-\u2271\u2274\u2275\u2278\u2279\u2280\u2281\u2284\u2285\u2288\u2289\u22AC-\u22AF\u22E0-\u22E3\u22EA-\u22ED\u2ADC\u304C\u304E\u3050\u3052\u3054\u3056\u3058\u305A\u305C\u305E\u3060\u3062\u3065\u3067\u3069\u3070\u3071\u3073\u3074\u3076\u3077\u3079\u307A\u307C\u307D\u3094\u309E\u30AC\u30AE\u30B0\u30B2\u30B4\u30B6\u30B8\u30BA\u30BC\u30BE\u30C0\u30C2\u30C5\u30C7\u30C9\u30D0\u30D1\u30D3\u30D4\u30D6\u30D7\u30D9\u30DA\u30DC\u30DD\u30F4\u30F7-\u30FA\u30FE\uAC00-\uD7A3\uFB1D\uFB1F\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFB4E]|\uD801[\uDDC9\uDDE4]|\uD804[\uDC9A\uDC9C\uDCAB\uDD2E\uDD2F\uDF4B\uDF4C\uDF83\uDF85\uDF8E\uDF91\uDFC5\uDFC7\uDFC8]|\uD805[\uDCBB\uDCBC\uDCBE\uDDBA\uDDBB]|\uD806\uDD38|\uD818[\uDD21-\uDD28]|\uD81B[\uDD68-\uDD6A]|\uD834[\uDD5E-\uDD64\uDDBB-\uDDC0]/;
  return regex$1;
}
var regexExports = requireRegex();
var regex = /*@__PURE__*/getDefaultExportFromCjs$1(regexExports);

/* eslint-disable new-cap -- ToString is how it is defined */

/**
 * @typedef {number} Integer
 */

/**
 * @param {string} arg
 * @returns {string}
 */
function escapeUnmatchedSurrogates(arg) {
  // https://stackoverflow.com/a/6701665/271577
  return arg.replaceAll(/([\uD800-\uDBFF])(?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])([\uDC00-\uDFFF])/gu, function (_, unmatchedHighSurrogate, precedingLow, unmatchedLowSurrogate) {
    // Could add a corresponding surrogate for compatibility with `node-sqlite3`: https://bugs.python.org/issue12569 and https://stackoverflow.com/a/6701665/271577
    //   but Chrome having problems
    if (unmatchedHighSurrogate) {
      return '^2' + unmatchedHighSurrogate.codePointAt().toString(16).padStart(4, '0');
    }
    return (precedingLow || '') + '^3' + unmatchedLowSurrogate.codePointAt().toString(16).padStart(4, '0');
  });
}

/**
 * @param {string} arg
 * @returns {string}
 */
function escapeNameForSQLiteIdentifier(arg) {
  // https://stackoverflow.com/a/6701665/271577
  return '_' +
  // Prevent empty string
  escapeUnmatchedSurrogates(arg.replaceAll('^', '^^') // Escape our escape
  // https://www.sqlite.org/src/tktview?name=57c971fc74
  .replaceAll('\0', '^0')
  // We need to avoid identifiers being treated as duplicates based on SQLite's ASCII-only case-insensitive table and column names
  // (For SQL in general, however, see https://stackoverflow.com/a/17215009/271577
  // See also https://www.sqlite.org/faq.html#q18 re: Unicode (non-ASCII) case-insensitive not working
  .replaceAll(/([A-Z])/gu, '^$1'));
}

/**
 * The escaping of unmatched surrogates was needed by Chrome but not Node.
 * @param {string} arg
 * @returns {string}
 */
function escapeSQLiteStatement(arg) {
  const escaped = arg.replaceAll('^', '^^');
  return escapeUnmatchedSurrogates(CFG.escapeNULForSQLiteStatements === false ? escaped : escaped.replaceAll('\0', '^0'));
}

/**
 * @param {string} arg
 * @returns {string}
 */
function unescapeSQLiteResponse(arg) {
  const unescaped = unescapeUnmatchedSurrogates(arg);
  if (CFG.escapeNULForSQLiteStatements === false) {
    return unescaped.replaceAll('^^', '^');
  }
  return unescaped.replaceAll(/(\^+)0/gu, (_, esc) => {
    return esc.length % 2 ? esc.slice(1) + '\0' : _;
  }).replaceAll('^^', '^');
}

/**
 * @param {string} arg
 * @returns {string}
 */
function sqlEscape(arg) {
  // https://www.sqlite.org/lang_keywords.html
  // https://stackoverflow.com/a/6701665/271577
  // There is no need to escape ', `, or [], as
  //   we should always be within double quotes
  // NUL should have already been stripped
  return arg.replaceAll('"', '""');
}

/**
 * @param {string} arg
 * @returns {string}
 */
function sqlQuote(arg) {
  return '"' + sqlEscape(arg) + '"';
}

/**
 * @param {string} db
 * @throws {Error}
 * @returns {string}
 */
function escapeDatabaseNameForSQLAndFiles(db) {
  if (CFG.escapeDatabaseName) {
    // We at least ensure NUL is escaped by default, but we need to still
    //   handle empty string and possibly also length (potentially
    //   throwing if too long), escaping casing (including Unicode?),
    //   and escaping special characters depending on file system
    return CFG.escapeDatabaseName(escapeSQLiteStatement(db));
  }
  db = 'D' + escapeNameForSQLiteIdentifier(db);
  if (CFG.escapeNFDForDatabaseNames !== false) {
    // ES6 copying of regex with different flags
    db = db.replaceAll(new RegExp(regex, 'gu'), function (expandable) {
      return '^4' + /** @type {Integer} */expandable.codePointAt(0).toString(16).padStart(6, '0');
    });
  }
  if (CFG.databaseCharacterEscapeList !== false) {
    db = db.replace(CFG.databaseCharacterEscapeList ? new RegExp(CFG.databaseCharacterEscapeList, 'gu') : /[\u{0000}-\u{001F}\u{007F}"*/:<>?\\|]/gu,
    // eslint-disable-line no-control-regex -- Controls needed
    function (n0) {
      // eslint-disable-next-line unicorn/prefer-code-point -- Switch to `codePointAt`?
      return '^1' + n0.charCodeAt(0).toString(16).padStart(2, '0');
    });
  }
  if (CFG.databaseNameLengthLimit !== false && db.length >= (CFG.databaseNameLengthLimit || 254) - (CFG.addSQLiteExtension !== false ? 7 /* '.sqlite'.length */ : 0)) {
    throw new Error('Unexpectedly long database name supplied; length limit required for Node compatibility; passed length: ' + db.length + '; length limit setting: ' + (CFG.databaseNameLengthLimit || 254) + '.');
  }
  return db + (CFG.addSQLiteExtension !== false ? '.sqlite' : ''); // Shouldn't have quoting (do we even need NUL/case escaping here?)
}

/**
 * @param {string} arg
 * @returns {string}
 */
function unescapeUnmatchedSurrogates(arg) {
  return arg.replaceAll(/(\^+)3(d[0-9a-f]{3})/gu, (_, esc, lowSurr) => {
    return esc.length % 2 ? esc.slice(1) + String.fromCodePoint(Number.parseInt(lowSurr, 16)) : _;
  }).replaceAll(/(\^+)2(d[0-9a-f]{3})/gu, (_, esc, highSurr) => {
    return esc.length % 2 ? esc.slice(1) + String.fromCodePoint(Number.parseInt(highSurr, 16)) : _;
  });
}

/**
 * @param {string} store
 * @returns {string}
 */
function escapeStoreNameForSQL(store) {
  return sqlQuote('S' + escapeNameForSQLiteIdentifier(store));
}

/**
 * @param {string} index
 * @returns {string}
 */
function escapeIndexNameForSQL(index) {
  return sqlQuote('I' + escapeNameForSQLiteIdentifier(index));
}

/**
 * @param {string} index
 * @returns {string}
 */
function escapeIndexNameForSQLKeyColumn(index) {
  return 'I' + escapeNameForSQLiteIdentifier(index);
}

/**
 * @todo Didn't need to escape `%`. Do we still need this escape?
 * @param {string} str
 * @returns {string}
 */
function sqlLIKEEscape(str) {
  // https://www.sqlite.org/lang_expr.html#like
  return str.replaceAll('^', '^^');
}

/**
 * @typedef {Function} AnyClass
 */

// Babel doesn't seem to provide a means of using the `instanceof` operator with Symbol.hasInstance (yet?)
/**
 *
 * @param {AnyValue} obj
 * @param {AnyClass} Clss
 * @returns {boolean}
 */
function instanceOf(obj, Clss) {
  return Clss[Symbol.hasInstance](obj);
}

/**
 *
 * @param {AnyValue} obj
 * @returns {obj is object}
 */
function isObj(obj) {
  return obj !== null && typeof obj === 'object';
}

/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
function isDate(obj) {
  return isObj(obj) && 'getDate' in obj && typeof obj.getDate === 'function';
}

/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
function isBlob(obj) {
  return isObj(obj) && 'size' in obj && typeof obj.size === 'number' && 'slice' in obj && typeof obj.slice === 'function' && !('lastModified' in obj);
}

/**
 *
 * @param {object} obj
 * @returns {boolean}
 */
function isFile(obj) {
  return isObj(obj) && 'name' in obj && typeof obj.name === 'string' && 'slice' in obj && typeof obj.slice === 'function' && 'lastModified' in obj;
}

/**
 *
 * @param {AnyValue} obj
 * @returns {boolean}
 */
function isBinary(obj) {
  return isObj(obj) && 'byteLength' in obj && typeof obj.byteLength === 'number' && ('slice' in obj && typeof obj.slice === 'function' ||
  // `TypedArray` (view on buffer) or `ArrayBuffer`
  'getFloat64' in obj && typeof obj.getFloat64 === 'function' // `DataView` (view on buffer)
  );
}

/**
 *
 * @param {AnyValue} obj
 * @returns {boolean}
 */
function isIterable(obj) {
  return isObj(obj) &&
  // eslint-disable-next-line unicorn/no-computed-property-existence-check -- May not be "own"
  Symbol.iterator in obj && typeof obj[Symbol.iterator] === 'function';
}

/**
 *
 * @param {object} obj
 * @param {string[]} props
 * @returns {void}
 */
function defineOuterInterface(obj, props) {
  props.forEach(prop => {
    const o = {
      get [prop]() {
        throw new TypeError('Illegal invocation');
      },
      // @ts-expect-error Deliberately errs
      set [prop](val) {
        throw new TypeError('Illegal invocation');
      }
    };
    const desc = /** @type {PropertyDescriptor} */
    Object.getOwnPropertyDescriptor(o, prop);
    Object.defineProperty(obj, prop, desc);
  });
}

/**
 *
 * @param {object} obj
 * @param {string[]} props
 * @returns {void}
 */
function defineReadonlyOuterInterface(obj, props) {
  props.forEach(prop => {
    const o = {
      get [prop]() {
        throw new TypeError('Illegal invocation');
      }
    };
    const desc = /** @type {PropertyDescriptor} */
    Object.getOwnPropertyDescriptor(o, prop);
    Object.defineProperty(obj, prop, desc);
  });
}

/**
 *
 * @param {object & {
 *   [key: string]: any
 * }} obj
 * @param {string[]} listeners
 * @returns {void}
 */
function defineListenerProperties(obj, listeners) {
  listeners = typeof listeners === 'string' ? [listeners] : listeners;
  listeners.forEach(listener => {
    const o = {
      get [listener]() {
        return obj['__' + listener];
      },
      /**
       * @param {AnyValue} val
       * @returns {void}
       */
      set [listener](val) {
        obj['__' + listener] = val;
      }
    };
    const desc = /** @type {PropertyDescriptor} */
    Object.getOwnPropertyDescriptor(o, listener);
    // desc.enumerable = true; // Default
    // desc.configurable = true; // Default // Needed by support.js in W3C IndexedDB tests (for openListeners)
    Object.defineProperty(obj, listener, desc);
  });
  listeners.forEach(l => {
    obj[l] = null;
  });
}

/**
 *
 * @param {object} obj
 * @param {string|string[]} props
 * @param {null|{
 *   [key: string]: any
 * }} getter
 * @returns {void}
 */
function defineReadonlyProperties(obj, props, getter = null) {
  props = typeof props === 'string' ? [props] : props;
  props.forEach(function (prop) {
    let o;
    if (getter && Object.hasOwn(getter, prop)) {
      o = getter[prop];
    } else {
      Object.defineProperty(obj, '__' + prop, {
        enumerable: false,
        configurable: false,
        writable: true
      });
      // We must resort to this to get "get <name>" as
      //   the function `name` for proper IDL
      o = {
        get [prop]() {
          return this['__' + prop];
        }
      };
    }
    const desc = /** @type {PropertyDescriptor} */
    Object.getOwnPropertyDescriptor(o, prop);
    // desc.enumerable = true; // Default
    // desc.configurable = true; // Default
    Object.defineProperty(obj, prop, desc);
  });
}

/**
 *
 * @param {string} item
 * @returns {boolean}
 */
function isIdentifier(item) {
  // For load-time and run-time performance, we don't provide the complete regular
  //   expression for identifiers, but these can be passed in, using the expressions
  //   found at https://gist.github.com/brettz9/b4cd6821d990daa023b2e604de371407
  // ID_Start (includes Other_ID_Start)
  const UnicodeIDStart = CFG.UnicodeIDStart || '[$A-Z_a-z]';
  // ID_Continue (includes Other_ID_Continue)
  const UnicodeIDContinue = CFG.UnicodeIDContinue || '[$0-9A-Z_a-z]';
  const IdentifierStart = '(?:' + UnicodeIDStart + '|[$_])';
  const IdentifierPart = '(?:' + UnicodeIDContinue + '|[$_\u{200C}\u{200D}])';
  return new RegExp('^' + IdentifierStart + IdentifierPart + '*$', 'u').test(item);
}

/**
 *
 * @param {string|string[]} keyPathString
 * @returns {boolean}
 */
function isValidKeyPathString(keyPathString) {
  return typeof keyPathString === 'string' && (keyPathString === '' || isIdentifier(keyPathString) || keyPathString.split('.').every(pathComponent => {
    return isIdentifier(pathComponent);
  }));
}

/**
 *
 * @param {string|string[]} keyPath
 * @returns {boolean}
 */
function isValidKeyPath(keyPath) {
  return isValidKeyPathString(keyPath) || Array.isArray(keyPath) && Boolean(keyPath.length) &&
  // Convert array from sparse to dense https://www.2ality.com/2012/06/dense-arrays.html
  // See also https://heycam.github.io/webidl/#idl-DOMString
  [...keyPath].every(pathComponent => {
    return isValidKeyPathString(pathComponent);
  });
}

/**
 * @param {number} number
 * @param {"unsigned long long"|"unsigned long"} type
 * @throws {Error|TypeError}
 * @returns {number}
 */
function enforceRange(number, type) {
  number = Math.floor(Number(number));
  let max, min;
  switch (type) {
    case 'unsigned long long':
      {
        max = 0x1FFFFFFFFFFFFF; // 2^53 - 1
        min = 0;
        break;
      }
    case 'unsigned long':
      {
        max = 0xFFFFFFFF; // 2^32 - 1
        min = 0;
        break;
      }
    default:
      throw new Error('Unrecognized type supplied to enforceRange');
  }
  if (!Number.isFinite(number) || number > max || number < min) {
    throw new TypeError('Invalid range: ' + number);
  }
  return number;
}

/**
 * @typedef {any} AnyValue
 */

/**
 * @param {AnyValue} v
 * @param {boolean} [treatNullAs]
 * @returns {string}
 */
function convertToDOMString(v, treatNullAs) {
  return v === null && treatNullAs ? '' : ToString(v);
}

/**
 * @param {AnyValue} o
 * @returns {string}
 */
function ToString(o) {
  // Todo: See `es-abstract/es7`
  // `String()` will not throw with Symbols
  return '' + o; // eslint-disable-line no-implicit-coercion -- Need to throw with symbols
}

/**
 *
 * @param {AnyValue} val
 * @returns {string|string[]}
 */
function convertToSequenceDOMString(val) {
  // Per <https://heycam.github.io/webidl/#idl-sequence>, converting to a sequence works with iterables
  if (isIterable(val)) {
    // We don't want conversion to array to convert primitives
    // Per <https://heycam.github.io/webidl/#es-DOMString>, converting to a `DOMString` to be via `ToString`: https://tc39.github.io/ecma262/#sec-tostring
    return [...val].map(item => {
      return ToString(item);
    });
  }
  return ToString(val);
}

/**
 * @param {AnyValue} v
 * @returns {v is null|undefined}
 */
function isNullish(v) {
  return v === null || v === undefined;
}

/**
 * Cursor/request continuation chains can call each other synchronously
 * (e.g. walking a large prefetched buffer, or advancing many interleaved
 * cursors in one transaction) which, for large enough record counts, can
 * exceed the JS engine's call stack ("Maximum call stack size exceeded").
 *
 * This can't be fixed by deferring continuations to a microtask/macrotask:
 * the transaction machinery synchronously checks (once the current call
 * stack unwinds) whether there are any pending requests left in order to
 * decide it's safe to commit; deferring a continuation opens a real gap in
 * which that check runs first and the transaction completes prematurely,
 * with the deferred continuation then acting on an already-finished
 * transaction (a hang, since it can never resolve).
 *
 * Instead, this implements a true trampoline: the first call starts a
 * synchronous work queue and drains it in a flat loop; any call made while
 * already draining (i.e. a continuation triggering another continuation)
 * is simply appended to that same queue and returns immediately instead of
 * recursing. This keeps everything synchronous (so no completion-check
 * race is introduced) while preventing the call stack from growing with
 * each successive continuation.
 */
const continuationState = {
  /** @type {Array<() => void>|null} */
  queue: null
};

/**
 * @param {() => void} fn
 * @returns {void}
 */
function runContinuationSafely(fn) {
  if (continuationState.queue) {
    continuationState.queue.push(fn);
    return;
  }
  const queue = [fn];
  continuationState.queue = queue;
  try {
    while (queue.length) {
      const next = /** @type {() => void} */queue.shift();
      next();
    }
  } finally {
    // Ensure a thrown exception can't leave the queue permanently
    // stuck (which would silently swallow all future continuations).
    continuationState.queue = null;
  }
}

/**
 * @typedef {Error} DebuggingError
 */

/**
 *
 * @param {string} type
 * @param {DebuggingError|null} [debug]
 * @param {EventInit} [evInit]
 * @returns {Event & {
 *   __legacyOutputDidListenersThrowError?: boolean
 * }}
 */
function createEvent(type, debug, evInit) {
  // @ts-expect-error It's ok
  const ev = new ShimEvent(type, evInit);
  ev.debug = debug;
  return ev;
}

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
// We don't add within polyfill repo as might not always be the desired implementation
Object.defineProperty(ShimEvent, Symbol.hasInstance, {
  /* eslint-enable unicorn/no-top-level-side-effects -- Would be good */
  /**
   * @typedef {any} AnyValue
   */
  value:
  /**
   * @param {AnyValue} obj
   * @returns {boolean}
   */
  obj => isObj(obj) && 'target' in obj && 'bubbles' in obj && typeof obj.bubbles === 'boolean'
});

const readonlyProperties$6 = ['oldVersion', 'newVersion'];

/**
 * Babel apparently having a problem adding `hasInstance` to a class,
 * so we are redefining as a function.
 * @class
 * @param {string} type
 */
function IDBVersionChangeEvent(type /* , eventInitDict */) {
  // eventInitDict is a IDBVersionChangeEventInit (but is not defined as a global)
  // @ts-expect-error It's passing only one!
  ShimEvent.call(this, type);
  this[Symbol.toStringTag] = 'IDBVersionChangeEvent';
  this.toString = function () {
    return '[object IDBVersionChangeEvent]';
  };
  // eslint-disable-next-line prefer-rest-params -- API
  this.__eventInitDict = arguments[1] || {};
}

// @ts-expect-error It's ok
IDBVersionChangeEvent.prototype = Object.create(ShimEvent.prototype);
IDBVersionChangeEvent.prototype[Symbol.toStringTag] = 'IDBVersionChangeEventPrototype';

/**
 * @typedef {number} Integer
 */

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
readonlyProperties$6.forEach(prop => {
  // Ensure for proper interface testing that "get <name>" is the function name
  const o = {
    /**
     * @returns {Integer|null}
     */
    get [prop]() {
      if (!(this instanceof IDBVersionChangeEvent)) {
        throw new TypeError('Illegal invocation');
      }
      return this.__eventInitDict && this.__eventInitDict[prop] || (prop === 'oldVersion' ? 0 : null);
    }
  };
  const desc = /** @type {PropertyDescriptor} */
  Object.getOwnPropertyDescriptor(o, prop);
  // desc.enumerable = true; // Default
  // desc.configurable = true; // Default
  Object.defineProperty(IDBVersionChangeEvent.prototype, prop, desc);
});
Object.defineProperty(IDBVersionChangeEvent, Symbol.hasInstance, {
  /**
   * @typedef {any} AnyValue
   */
  value:
  /**
   * @param {AnyValue} obj
   * @returns {boolean}
   */
  obj => isObj(obj) && 'oldVersion' in obj && 'defaultPrevented' in obj && typeof obj.defaultPrevented === 'boolean'
});
Object.defineProperty(IDBVersionChangeEvent.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: IDBVersionChangeEvent
});
Object.defineProperty(IDBVersionChangeEvent, 'prototype', {
  writable: false
});

/**
 * Creates a native DOMException, for browsers that support it.
 * @param {string} name
 * @param {string} message
 * @returns {DOMException}
 */
function createNativeDOMException(name, message) {
  // @ts-expect-error It's ok
  return new DOMException.prototype.constructor(message, name || 'DOMException');
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
function createNonNativeDOMExceptionClass() {
  /**
   * @param {string|undefined} message
   * @param {Code|LegacyCode} name
   * @returns {void}
   */
  function DOMException(message, name) {
    // const err = Error.prototype.constructor.call(this, message); // Any use to this? Won't set this.message
    this[Symbol.toStringTag] = 'DOMException';
    this._code = Object.hasOwn(codes, name) ? codes[(/** @type {Code} */name)] : legacyCodes[(/** @type {LegacyCode} */name)] || 0;
    this._name = name || 'Error';
    // We avoid `String()` in this next line as it converts Symbols
    this._message = message === undefined ? '' : '' + message; // eslint-disable-line no-implicit-coercion -- Don't convert symbols
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
  /* eslint-disable func-name-matching -- See above */
  /**
   * @class
   */
  const DummyDOMException = function DOMException() {/* */};
  /* eslint-enable func-name-matching -- See above */
  DummyDOMException.prototype = Object.create(Error.prototype); // Intended for subclassing
  /** @type {const} */
  ['name', 'message'].forEach(prop => {
    Object.defineProperty(DummyDOMException.prototype, prop, {
      enumerable: true,
      /**
       * @this {DOMException}
       * @returns {string}
       */
      get() {
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
    get() {
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

  /** @type {(keyof codes)[]} */
  keys.forEach(codeName => {
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
  });
  /** @type {(keyof legacyCodes)[]} */
  Object.keys(legacyCodes).forEach(codeName => {
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
function createNonNativeDOMException(name, message) {
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
function logError(name, message, error) {
  if (!CFG.DEBUG) {
    return;
  }
  const msg = error && typeof error === 'object' && error.message ? error.message : (/** @type {string} */error);
  const method = typeof console.error === 'function' ? 'error' : 'log';
  console[method](name + ': ' + message + '. ' + (msg || ''));
  if (console.trace) {
    console.trace();
  }
}

/**
 * @typedef {any} ArbitraryValue
 */

/**
 * @param {ArbitraryValue} obj
 * @returns {boolean}
 */
function isErrorOrDOMErrorOrDOMException(obj) {
  return obj && typeof obj === 'object' &&
  // We don't use util.isObj here as mutual dependency causing problems in Babel with browser
  typeof obj.name === 'string';
}

/**
 * Finds the error argument.  This is useful because some WebSQL callbacks
 * pass the error as the first argument, and some pass it as the second
 * argument.
 * @param {(Error|{message?: string, name?: string}|any)[]} args
 * @returns {Error|DOMException|undefined}
 */
function findError(args) {
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
function webSQLErrback(webSQLErr) {
  let name, message;
  switch (webSQLErr.code) {
    case 4:
      {
        // SQLError.QUOTA_ERR
        name = 'QuotaExceededError';
        message = 'The operation failed because there was not enough ' + 'remaining storage space, or the storage quota was reached ' + 'and the user declined to give more space to the database.';
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
    default:
      {
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
  createDOMException(name, message);
  err.sqlError = webSQLErr;
  return err;
}
let test,
  useNativeDOMException = false;

// Test whether we can use the browser's native DOMException class
try {
  test = createNativeDOMException('test name', 'test message');
  if (isErrorOrDOMErrorOrDOMException(test) && test.name === 'test name' && test.message === 'test message') {
    // Native DOMException works as expected
    useNativeDOMException = true;
  }
} catch (err) {}
const createDOMException = useNativeDOMException
// eslint-disable-next-line @stylistic/operator-linebreak -- Need JSDoc
?
/**
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
:
/**
 * @param {string} name
 * @param {string} message
 * @param {ErrorLike} [error]
 * @returns {Error}
 */
function (name, message, error) {
  logError(name, message, error);
  return createNonNativeDOMException(name, message);
};
const ShimDOMException = useNativeDOMException ? DOMException : ShimNonNativeDOMException;

const listeners$2 = ['onsuccess', 'onerror'];
const readonlyProperties$5 = ['source', 'transaction', 'readyState'];
const doneFlagGetters = ['result', 'error'];

/**
 * The IDBRequest Object that is returns for all async calls.
 * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 * @class
 * @throws {TypeError}
 */
function IDBRequest() {
  throw new TypeError('Illegal constructor');
}

/**
 * @typedef {IDBRequest & EventTarget & import('eventtargeter').ShimEventTarget & {
 *   transaction: import('./IDBTransaction.js').IDBTransactionFull,
 *   __done: boolean,
 *   __result: import('./IDBDatabase.js').IDBDatabaseFull|undefined,
 *   __error: null|DOMException|Error,
 *   __source: null|import('./IDBDatabase.js').IDBDatabaseFull|
 *     import('./IDBObjectStore.js').IDBObjectStoreFull|
 *     import('./IDBIndex.js').IDBIndexFull,
 *   __transaction: undefined|null|
 *     import('./IDBTransaction.js').IDBTransactionFull,
 *   addLateEventListener: (ev: string, listener: (e: Event & {
 *     __legacyOutputDidListenersThrowError: boolean
 *   }) => void) => void
 *   addDefaultEventListener: (ev: string, listener: (e: Event & {
 *     __legacyOutputDidListenersThrowError: boolean
 *   }) => void) => void
 * }} IDBRequestFull
 */

/* eslint-disable func-name-matching -- Polyfill */
/**
 * @class
 * @this {IDBRequestFull}
 */
IDBRequest.__super = function IDBRequest() {
  // @ts-expect-error It's ok
  this[Symbol.toStringTag] = 'IDBRequest';
  // @ts-expect-error Part of `ShimEventTarget`
  this.__setOptions({
    legacyOutputDidListenersThrowFlag: true // Event hook for IndexedB
  });
  doneFlagGetters.forEach(prop => {
    Object.defineProperties(this, {
      ['__' + prop]: {
        enumerable: false,
        configurable: false,
        writable: true
      },
      [prop]: {
        enumerable: true,
        configurable: true,
        get() {
          if (!this.__done) {
            throw createDOMException('InvalidStateError', "Can't get " + prop + '; the request is still pending.');
          }
          return this['__' + prop];
        }
      }
    });
  });
  defineReadonlyProperties(this, readonlyProperties$5, {
    readyState: {
      /**
       * @this {IDBRequestFull}
       * @returns {"done"|"pending"}
       */
      get readyState() {
        return this.__done ? 'done' : 'pending';
      }
    }
  });
  defineListenerProperties(this, listeners$2);
  this.__result = undefined;
  this.__error = this.__source = this.__transaction = null;
  this.__done = false;
};
/* eslint-enable func-name-matching -- Polyfill */

/**
 * @returns {IDBRequestFull}
 */
IDBRequest.__createInstance = function () {
  // @ts-expect-error Casting this causes other errors
  return new IDBRequest.__super();
};

// @ts-expect-error It's ok
IDBRequest.prototype = EventTargetFactory.createInstance({
  extraProperties: ['debug']
});
IDBRequest.prototype[Symbol.toStringTag] = 'IDBRequestPrototype';

/**
 * @this {IDBRequestFull}
 * @returns {import('./IDBTransaction.js').IDBTransactionFull|null|undefined}
 */
IDBRequest.prototype.__getParent = function () {
  if (this.toString() === '[object IDBOpenDBRequest]') {
    return null;
  }
  return this.__transaction;
};

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
// Illegal invocations
defineReadonlyOuterInterface(IDBRequest.prototype, readonlyProperties$5);
defineReadonlyOuterInterface(IDBRequest.prototype, doneFlagGetters);
defineOuterInterface(IDBRequest.prototype, listeners$2);
Object.defineProperty(IDBRequest.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: IDBRequest
});
IDBRequest.__super.prototype = IDBRequest.prototype;
Object.defineProperty(IDBRequest, 'prototype', {
  writable: false
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

const openListeners = ['onblocked', 'onupgradeneeded'];

/**
 * @typedef {IDBRequestFull & IDBOpenDBRequest} IDBOpenDBRequestFull
 */

/**
 * The IDBOpenDBRequest called when a database is opened.
 * @class
 * @throws {TypeError}
 */
function IDBOpenDBRequest() {
  throw new TypeError('Illegal constructor');
}

// @ts-expect-error It's ok
IDBOpenDBRequest.prototype = Object.create(IDBRequest.prototype);

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
Object.defineProperty(IDBOpenDBRequest.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: IDBOpenDBRequest
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

const IDBOpenDBRequestAlias = IDBOpenDBRequest;
/**
 * @returns {IDBRequestFull & IDBOpenDBRequest}
 */
IDBOpenDBRequest.__createInstance = function () {
  /**
   * @class
   * @this {IDBOpenDBRequestFull}
   */
  function IDBOpenDBRequest() {
    IDBRequest.__super.call(this);

    // @ts-expect-error It's ok
    this[Symbol.toStringTag] = 'IDBOpenDBRequest';
    // @ts-expect-error It's ok
    this.__setOptions({
      legacyOutputDidListenersThrowFlag: true,
      // Event hook for IndexedB
      extraProperties: ['oldVersion', 'newVersion', 'debug']
    }); // Ensure EventTarget preserves our properties
    defineListenerProperties(this, openListeners);
  }
  IDBOpenDBRequest.prototype = IDBOpenDBRequestAlias.prototype;

  // @ts-expect-error It's ok
  return new IDBOpenDBRequest();
};

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
defineOuterInterface(IDBOpenDBRequest.prototype, openListeners);
IDBOpenDBRequest.prototype[Symbol.toStringTag] = 'IDBOpenDBRequestPrototype';
Object.defineProperty(IDBOpenDBRequest, 'prototype', {
  writable: false
});

/* eslint-disable promise/prefer-await-to-callbacks -- Needed for API */
/* eslint-disable promise/catch-or-return, n/callback-return,
    promise/always-return -- Not needed */
// Since [immediate](https://github.com/calvinmetcalf/immediate) is
//   not doing the trick for our WebSQL transactions (at least in Node),
//   we are forced to make the promises run fully synchronously.

/* eslint-disable jsdoc/reject-any-type -- Truly arbitrary */
/**
 * @typedef {any} ArbitraryValue
 */
/* eslint-enable jsdoc/reject-any-type -- Truly arbitrary */

/**
 * @callback Resolve
 * @param {ArbitraryValue} val
 * @returns {void}
 */
/**
 * @callback Reject
 * @param {ArbitraryValue} reason
 * @returns {void}
 */
/**
 * @callback Settle
 * @returns {void}
 */

/**
 * @callback ResolveReject
 * @param {Resolve} resolve
 * @param {Reject} reject
 * @returns {void}
 */

/**
 * @callback OnFulfilled
 * @param {ArbitraryValue} resolve
 * @returns {void}
 */

/**
 * @typedef {[(Settle|Resolve)[], (Settle|Reject)[]]} Callbacks
 */

/**
 *
 * @param {PromiseLike<ArbitraryValue>} p
 * @returns {boolean}
 */
function isPromise(p) {
  return p && typeof p.then === 'function';
}
/**
 *
 * @param {PromiseLike<ArbitraryValue>} prom
 * @param {(err: Error) => void} reject
 * @returns {void}
 */
function addReject(prom, reject) {
  // Use this style for sake of non-Promise thenables (e.g., jQuery Deferred)
  prom.then(null, reject);
}

// States
const PENDING = 2,
  FULFILLED = 0,
  // We later abuse these as array indices
  REJECTED = 1;

/**
 *
 */
class SyncPromise {
  /**
   * @param {unknown[]|[]} promises
   * @returns {SyncPromise}
   */
  static all(promises) {
    return new SyncPromise(/** @type {ResolveReject} */
    (resolve, reject) => {
      let l = promises.length;
      /** @type {ArbitraryValue[]} */
      const newPromises = [];
      if (!l) {
        resolve(newPromises);
        return;
      }
      promises.forEach((p, i) => {
        if (isPromise(/** @type {PromiseLike<ArbitraryValue>} */p)) {
          addReject(/** @type {PromiseLike<ArbitraryValue>} */p.then(/** @type {OnFulfilled} */
          res => {
            newPromises[i] = res;
            --l;
            if (!l) {
              resolve(newPromises);
            }
          }), reject);
        } else {
          newPromises[i] = p;
          --l;
          if (!l) {
            resolve(promises);
          }
        }
      });
    });
  }

  /**
   * @param {unknown[]|[]} promises
   * @returns {SyncPromise}
   */
  static race(promises) {
    let resolved = false;
    return new SyncPromise(/** @type {ResolveReject} */
    (resolve, reject) => {
      // eslint-disable-next-line @stylistic/max-len -- Long
      // eslint-disable-next-line unicorn/no-unused-array-method-return -- Shortcuts
      promises.some(p => {
        if (isPromise(/** @type {PromiseLike<ArbitraryValue>} */p)) {
          addReject(/** @type {PromiseLike<ArbitraryValue>} */p.then(/** @type {OnFulfilled} */
          res => {
            if (resolved) {
              return;
            }
            resolve(res);
            resolved = true;
          }), reject);
          return false;
        }
        resolve(p);
        resolved = true;
        return true;
      });
    });
  }

  /**
   * @param {ArbitraryValue} val
   * @returns {SyncPromise}
   */
  static resolve(val) {
    return new SyncPromise(/** @type {ResolveReject} */
    resolve => {
      resolve(val);
    });
  }

  /**
   * @param {ArbitraryValue} val
   * @returns {SyncPromise}
   */
  static reject(val) {
    return new SyncPromise(/** @type {ResolveReject} */
    (resolve, reject) => {
      reject(val);
    });
  }

  // Value, this will be set to either a resolved value or rejected reason
  v = 0;

  /**
   * @param {(
   *   resolve: (value: ArbitraryValue | PromiseLike<ArbitraryValue>) => void,
   *   reject: (reason?: ArbitraryValue) => void
   * ) => void} fn
   */
  constructor(fn) {
    // State of the promise
    this.s = PENDING;
    // Callbacks c[0] is fulfillment and c[1] contains rejection callbacks
    /** @type {Callbacks|null} */
    this.c = [[], []];
    /**
     *
     * @param {ArbitraryValue} val
     * @param {0|1} state
     * @returns {void}
     */
    const transist = (val, state) => {
      this.v = val;
      this.s = state;

      // console.log('state', state);
      /** @type {Callbacks} */
      this.c[state].forEach(func => {
        func(val);
      });
      // Release memory, but if no handlers have been added, as we
      //   assume that we will resolve/reject (truly) synchronously
      //   and thus we avoid flagging checks about whether we've
      //   already resolved/rejected.
      if (/** @type {Callbacks} */this.c[state].length) {
        this.c = null;
      }
    };

    /** @type {Resolve} */
    const resolve = val => {
      if (!this.c) ; else if (isPromise(val)) {
        addReject(val.then(resolve), reject);
      } else {
        transist(val, FULFILLED);
      }
    };

    /** @type {Reject} */
    const reject = reason => {
      if (!this.c) ; else if (isPromise(reason)) {
        addReject(reason.then(reject), reject);
      } else {
        transist(reason, REJECTED);
      }
    };
    try {
      fn(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  /* eslint-disable unicorn/no-thenable -- Promise API */
  /**
   * @param {((value: ArbitraryValue) => ArbitraryValue)|null|undefined} [cb]
   * @param {(reason: ArbitraryValue) => PromiseLike<never>} [errBack]
   * @returns {SyncPromise}
   */
  then(cb, errBack) {
    /* eslint-enable unicorn/no-thenable -- Promise API */
    return new SyncPromise(/** @type {ResolveReject} */
    (resolve, reject) => {
      const rej = typeof errBack === 'function' ? errBack : reject;

      /** @type {Settle} */
      const settle = () => {
        try {
          resolve(cb ? cb(this.v) : this.v);
        } catch (e) {
          rej(e);
        }
      };
      if (this.s === FULFILLED) {
        settle();
      } else if (this.s === REJECTED) {
        rej(this.v);
      } else {
        /** @type {Callbacks} */this.c[FULFILLED].push(settle);
        /** @type {Callbacks} */
        this.c[REJECTED].push(rej);
      }
    });
  }

  /**
   * @param {(reason: ArbitraryValue) => PromiseLike<never>|null|undefined} cb
   * @returns {SyncPromise}
   */
  catch(cb) {
    return new SyncPromise(/** @type {ResolveReject} */
    (resolve, reject) => {
      /**
       * @returns {void}
       */
      const settle = () => {
        try {
          resolve(cb(this.v));
        } catch (e) {
          reject(e);
        }
      };
      if (this.s === REJECTED) {
        settle();
      } else if (this.s === FULFILLED) {
        resolve(this.v);
      } else {
        /** @type {Callbacks} */this.c[REJECTED].push(settle);
        /** @type {Callbacks} */
        this.c[FULFILLED].push(resolve);
      }
    });
  }
}

/**
 * Compares two keys.
 * @param {import('./Key.js').Key} first
 * @param {import('./Key.js').Key} second
 * @returns {0|1|-1}
 */
function cmp(first, second) {
  const encodedKey1 = /** @type {string} */encode$1(first);
  const encodedKey2 = /** @type {string} */encode$1(second);
  const result = encodedKey1 > encodedKey2 ? 1 : encodedKey1 === encodedKey2 ? 0 : -1;
  if (CFG.DEBUG) {
    // verify that the keys encoded correctly
    let decodedKey1 = decode$1(encodedKey1);
    let decodedKey2 = decode$1(encodedKey2);
    if (typeof first === 'object') {
      first = JSON.stringify(first);
      decodedKey1 = JSON.stringify(decodedKey1);
    }
    if (typeof second === 'object') {
      second = JSON.stringify(second);
      decodedKey2 = JSON.stringify(decodedKey2);
    }

    // Encoding/decoding mismatches are usually due to a loss of
    //   floating-point precision
    if (decodedKey1 !== first) {
      console.warn(first + ' was incorrectly encoded as ' + decodedKey1);
    }
    if (decodedKey2 !== second) {
      console.warn(second + ' was incorrectly encoded as ' + decodedKey2);
    }
  }
  return result;
}

/**
 * @typedef {NodeJS.TypedArray|DataView} ArrayBufferView
 */

/**
 * @typedef {ArrayBufferView|ArrayBuffer} BufferSource
 */

/**
 * @typedef {"number"|"date"|"string"|"binary"|"array"} KeyType
 */

/**
 * @typedef {any} Value
 */

/**
 * @typedef {any} Key
 * @todo Specify possible value more precisely
 */

/**
 * @typedef {KeyPath[]} KeyPathArray
 */
/**
 * @typedef {string|KeyPathArray} KeyPath
 */

/**
 * @typedef {object} KeyValueObject
 * @property {KeyType|"NaN"|"null"|"undefined"|"boolean"|"object"|"symbol"|
 *   "function"|"bigint"} type If not `KeyType`, indicates invalid value
 * @property {Value} [value]
 * @property {boolean} [invalid]
 * @property {string} [message]
 * @todo Specify acceptable `value` more precisely
 */

/**
 * @typedef {number|string|Date|ArrayBuffer} ValueTypePrimitive
 */
/**
 * @typedef {ValueType[]} ValueTypeArray
 */
/**
 * @typedef {ValueTypePrimitive|ValueTypeArray} ValueType
 */

/**
 * Encodes the keys based on their types. This is required to maintain collations
 * We leave space for future keys.
 * @type {{[key: string]: Integer|string}}
 */
const keyTypeToEncodedChar = {
  invalid: 100,
  number: 200,
  date: 300,
  string: 400,
  binary: 500,
  array: 600
};

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
const keyTypes = /** @type {(KeyType|"invalid")[]} */Object.keys(keyTypeToEncodedChar);
keyTypes.forEach(k => {
  keyTypeToEncodedChar[k] = String.fromCodePoint(/** @type {number} */keyTypeToEncodedChar[k]);
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

const encodedCharToKeyType = keyTypes.reduce((o, k) => {
  o[keyTypeToEncodedChar[k]] = k;
  return o;
}, /** @type {{[key: string]: KeyType|"invalid"}} */{});

/**
 * The sign values for numbers, ordered from least to greatest.
 *  - "negativeInfinity": Sorts below all other values.
 *  - "bigNegative": Negative values less than or equal to negative one.
 *  - "smallNegative": Negative values between negative one and zero, noninclusive.
 *  - "smallPositive": Positive values between zero and one, including zero but not one.
 *  - "largePositive": Positive values greater than or equal to one.
 *  - "positiveInfinity": Sorts above all other values.
 */
const signValues = ['negativeInfinity', 'bigNegative', 'smallNegative', 'smallPositive', 'bigPositive', 'positiveInfinity'];

/**
 * @typedef {any} AnyValue
 */

/**
 * @type {{
 *   [key: string]: {
 *     encode: (param: any, inArray?: boolean) => string,
 *     decode: (param: string, inArray?: boolean) => any
 *   }
 * }}
 */
const types = {
  invalid: {
    /**
     * @returns {string}
     */
    encode() {
      return keyTypeToEncodedChar.invalid + '-';
    },
    /**
     * @returns {undefined}
     */
    decode() {
      return undefined;
    }
  },
  // Numbers are represented in a lexically sortable base-32 sign-exponent-mantissa
  // notation.
  //
  // sign: takes a value between zero and five, inclusive. Represents infinite cases
  //     and the signs of both the exponent and the fractional part of the number.
  // exponent: padded to two base-32 digits, represented by the 32's compliment in the
  //     "smallPositive" and "bigNegative" cases to ensure proper lexical sorting.
  // mantissa: also called the fractional part. Normed 11-digit base-32 representation.
  //     Represented by the 32's compliment in the "smallNegative" and "bigNegative"
  //     cases to ensure proper lexical sorting.
  number: {
    // The encode step checks for six numeric cases and generates 14-digit encoded
    // sign-exponent-mantissa strings.
    /**
     * @param {number} key
     * @returns {string}
     */
    encode(key) {
      let key32 = key === Number.MIN_VALUE
      // Mocha test `IDBFactory/cmp-spec.js` exposed problem for some
      //   Node (and Chrome) versions with `Number.MIN_VALUE` being treated
      //   as 0
      // https://stackoverflow.com/questions/43305403/number-min-value-and-tostring
      ? '0.' + '0'.repeat(214) + '2' : Math.abs(key).toString(32);
      // Get the index of the decimal.
      const decimalIndex = key32.indexOf('.');
      // Remove the decimal.
      key32 = decimalIndex !== -1 ? key32.replace('.', '') : key32;
      // Get the index of the first significant digit.
      const significantDigitIndex = key32.search(/[^0]/u);
      // Truncate leading zeros.
      key32 = key32.slice(significantDigitIndex);
      let sign, exponent, mantissa;

      // Finite cases:
      if (Number.isFinite(Number(key))) {
        // Negative cases:
        if (key < 0) {
          // Negative exponent case:
          if (key > -1) {
            sign = signValues.indexOf('smallNegative');
            exponent = padBase32Exponent(significantDigitIndex);
            // Non-negative exponent case:
          } else {
            sign = signValues.indexOf('bigNegative');
            exponent = flipBase32(padBase32Exponent(decimalIndex !== -1 ? decimalIndex : key32.length));
          }
          mantissa = flipBase32(padBase32Mantissa(key32));
          // Non-negative cases:
          // Negative exponent case:
        } else if (key < 1) {
          sign = signValues.indexOf('smallPositive');
          exponent = flipBase32(padBase32Exponent(significantDigitIndex));
          mantissa = padBase32Mantissa(key32);
          // Non-negative exponent case:
        } else {
          sign = signValues.indexOf('bigPositive');
          exponent = padBase32Exponent(decimalIndex !== -1 ? decimalIndex : key32.length);
          mantissa = padBase32Mantissa(key32);
        }
        // Infinite cases:
      } else {
        exponent = zeros(2);
        mantissa = zeros(11);
        sign = signValues.indexOf(key > 0 ? 'positiveInfinity' : 'negativeInfinity');
      }
      return keyTypeToEncodedChar.number + '-' + sign + exponent + mantissa;
    },
    // The decode step must interpret the sign, reflip values encoded as the 32's complements,
    // apply signs to the exponent and mantissa, do the base-32 power operation, and return
    // the original JavaScript number values.
    /**
     * @param {string} key
     * @returns {number}
     */
    decode(key) {
      const sign = Number(key.slice(2, 3));
      let exponent = key.slice(3, 5);
      let mantissa = key.slice(5, 16);
      switch (signValues[sign]) {
        case 'negativeInfinity':
          return -Infinity;
        case 'positiveInfinity':
          return Infinity;
        case 'bigPositive':
          return pow32(mantissa, exponent);
        case 'smallPositive':
          exponent = negate(flipBase32(exponent));
          return pow32(mantissa, exponent);
        case 'smallNegative':
          exponent = negate(exponent);
          mantissa = flipBase32(mantissa);
          return -pow32(mantissa, exponent);
        case 'bigNegative':
          exponent = flipBase32(exponent);
          mantissa = flipBase32(mantissa);
          return -pow32(mantissa, exponent);
        default:
          throw new Error('Invalid number.');
      }
    }
  },
  // Strings are encoded as JSON strings (with quotes and unicode characters escaped).
  //
  // If the strings are in an array, then some extra encoding is done to make sorting work correctly:
  // Since we can't force all strings to be the same length, we need to ensure that characters line-up properly
  // for sorting, while also accounting for the extra characters that are added when the array itself is encoded as JSON.
  // To do this, each character of the string is prepended with a dash ("-"), and a space is added to the end of the string.
  // This effectively doubles the size of every string, but it ensures that when two arrays of strings are compared,
  // the indexes of each string's characters line up with each other.
  string: {
    /**
     * @param {string} key
     * @param {boolean} [inArray]
     * @returns {string}
     */
    encode(key, inArray) {
      if (inArray) {
        // prepend each character with a dash, and append a space to the end
        key = key.replaceAll(/(.)/gu, '-$1') + ' ';
      }
      return keyTypeToEncodedChar.string + '-' + key;
    },
    /**
     * @param {string} key
     * @param {boolean} [inArray]
     * @returns {string}
     */
    decode(key, inArray) {
      key = key.slice(2);
      if (inArray) {
        // remove the space at the end, and the dash before each character
        key = key.slice(0, -1).replaceAll(/-(.)/gu, '$1');
      }
      return key;
    }
  },
  // Arrays are encoded as JSON strings.
  // An extra, value is added to each array during encoding to make
  //  empty arrays sort correctly.
  array: {
    /**
     * @param {ValueTypeArray} key
     * @returns {string}
     */
    encode(key) {
      const encoded = [];
      for (const [i, item] of key.entries()) {
        const encodedItem = encode$1(item, true); // encode the array item
        encoded[i] = encodedItem;
      }
      encoded.push(keyTypeToEncodedChar.invalid + '-'); // append an extra item, so empty arrays sort correctly
      let encodedKey = JSON.stringify(encoded);
      if (CFG.escapeNULForSQLiteStatements === false) {
        encodedKey = encodedKey.replaceAll(String.raw`\u0000`, '\0');
      }
      return keyTypeToEncodedChar.array + '-' + encodedKey;
    },
    /**
     * @param {string} key
     * @returns {ValueTypeArray}
     */
    decode(key) {
      let decodedKey = key.slice(2);
      if (CFG.escapeNULForSQLiteStatements === false) {
        decodedKey = decodedKey.replaceAll('\0', String.raw`\u0000`);
      }
      const decoded = JSON.parse(decodedKey);
      decoded.pop(); // remove the extra item
      for (let i = 0; i < decoded.length; i++) {
        const item = decoded[i];
        const decodedItem = decode$1(item, true); // decode the item
        decoded[i] = decodedItem;
      }
      return decoded;
    }
  },
  // Dates are encoded as ISO 8601 strings, in UTC time zone.
  date: {
    /**
     * @param {Date} key
     * @returns {string}
     */
    encode(key) {
      return keyTypeToEncodedChar.date + '-' + key.toJSON();
    },
    /**
     * @param {string} key
     * @returns {Date}
     */
    decode(key) {
      return new Date(key.slice(2));
    }
  },
  binary: {
    // `ArrayBuffer`/Views on buffers (`TypedArray` or `DataView`)
    /**
     * @param {BufferSource} key
     * @returns {string}
     */
    encode(key) {
      return keyTypeToEncodedChar.binary + '-' + (key.byteLength ? [...getCopyBytesHeldByBufferSource(key)].map(b => String(b).padStart(3, '0')) // e.g., '255,005,254,000,001,033'
      : '');
    },
    /**
     * @param {string} key
     * @returns {ArrayBuffer}
     */
    decode(key) {
      // Set the entries in buffer's [[ArrayBufferData]] to those in `value`
      const k = key.slice(2);
      const arr = k.length ? k.split(',').map(Number) : [];
      const buffer = new ArrayBuffer(arr.length);
      const uint8 = new Uint8Array(buffer);
      uint8.set(arr);
      return buffer;
    }
  }
};

/**
 * Return a padded base-32 exponent value.
 * @param {number} n
 * @returns {string}
 */
function padBase32Exponent(n) {
  const exp = n.toString(32);
  return exp.length === 1 ? '0' + exp : exp;
}

/**
 * Return a padded base-32 mantissa.
 * @param {string} s
 * @returns {string}
 */
function padBase32Mantissa(s) {
  return (s + zeros(11)).slice(0, 11);
}

/**
 * Flips each digit of a base-32 encoded string.
 * @param {string} encoded
 * @returns {string}
 */
function flipBase32(encoded) {
  let flipped = '';
  for (const ch of encoded) {
    flipped += (31 - Number.parseInt(ch, 32)).toString(32);
  }
  return flipped;
}

/**
 * Base-32 power function.
 * RESEARCH: This function does not precisely decode floats because it performs
 * floating point arithmetic to recover values. But can the original values be
 * recovered exactly?
 * Someone may have already figured out a good way to store JavaScript floats as
 * binary strings and convert back. Barring a better method, however, one route
 * may be to generate decimal strings that `parseFloat` decodes predictably.
 * @param {string} mantissa
 * @param {string} exponent
 * @returns {number}
 */
function pow32(mantissa, exponent) {
  const exp = Number.parseInt(exponent, 32);
  if (exp < 0) {
    return roundToPrecision(Number.parseInt(mantissa, 32) * 32 ** (exp - 10));
  }
  if (exp < 11) {
    const whole = mantissa.slice(0, exp);
    const wholeNum = Number.parseInt(whole, 32);
    const fraction = mantissa.slice(exp);
    const fractionNum = Number.parseInt(fraction, 32) * 32 ** (exp - 11);
    return roundToPrecision(wholeNum + fractionNum);
  }
  const expansion = mantissa + zeros(exp - 11);
  return Number.parseInt(expansion, 32);
}

/**
 * @typedef {number} Float
 */

/**
 * @param {Float} num
 * @param {Float} [precision]
 * @returns {Float}
 */
function roundToPrecision(num, precision = 16) {
  return Number(num.toPrecision(precision));
}

/**
 * Returns a string of n zeros.
 * @param {number} n
 * @returns {string}
 */
function zeros(n) {
  return '0'.repeat(n);
}

/**
 * Negates numeric strings.
 * @param {string} s
 * @returns {string}
 */
function negate(s) {
  return '-' + s;
}

/**
 * @param {Key} key
 * @returns {KeyType|"invalid"}
 */
function getKeyType(key) {
  if (Array.isArray(key)) {
    return 'array';
  }
  if (isDate(key)) {
    return 'date';
  }
  if (isBinary(key)) {
    return 'binary';
  }
  const keyType = typeof key;
  return ['string', 'number'].includes(keyType) ? (/** @type {"string"|"number"} */keyType) : 'invalid';
}

/**
 * Keys must be strings, numbers (besides `NaN`), Dates (if value is not
 *   `NaN`), binary objects or Arrays.
 * @param {Value} input The key input
 * @param {Value[]|null|undefined} [seen] An array of already seen keys
 * @returns {KeyValueObject}
 */
function convertValueToKey(input, seen) {
  return convertValueToKeyValueDecoded(input, seen, false, true);
}

/**
 * Currently not in use.
 * @param {Value} input
 * @returns {KeyValueObject}
 */
function convertValueToMultiEntryKey(input) {
  return convertValueToKeyValueDecoded(input, null, true, true);
}

/**
 *
 * @param {BufferSource} O
 * @throws {TypeError}
 * @see https://heycam.github.io/webidl/#ref-for-dfn-get-buffer-source-copy-2
 * @returns {Uint8Array}
 */
function getCopyBytesHeldByBufferSource(O) {
  let offset = 0;
  let length;
  if (ArrayBuffer.isView(O)) {
    // Has [[ViewedArrayBuffer]] internal slot
    const arrayBuffer = O.buffer;
    if (arrayBuffer === undefined) {
      throw new TypeError('Could not copy the bytes held by a buffer source as the buffer was undefined.');
    }
    offset = O.byteOffset; // [[ByteOffset]] (will also throw as desired if detached)
    length = O.byteLength; // [[ByteLength]] (will also throw as desired if detached)
  } else {
    length = O.byteLength; // [[ArrayBufferByteLength]] on ArrayBuffer (will also throw as desired if detached)
  }
  // const octets = new Uint8Array(input);
  // const octets = types.binary.decode(types.binary.encode(input));
  return new Uint8Array(
  // Should allow DataView
  /** @type {ArrayBuffer} */
  'buffer' in O && O.buffer || O, offset, length);
}

/**
 * Shortcut utility to avoid returning full keys from `convertValueToKey`
 *   and subsequent need to process in calling code unless `fullKeys` is
 *   set; may throw.
 * @param {Value} input
 * @param {Value[]|null} [seen]
 * @param {boolean} [multiEntry]
 * @param {boolean} [fullKeys]
 * @throws {TypeError} See `getCopyBytesHeldByBufferSource`
 * @todo Document other allowable `input`
 * @returns {KeyValueObject}
 */
function convertValueToKeyValueDecoded(input, seen, multiEntry, fullKeys) {
  seen ||= [];
  if (seen.includes(input)) {
    return {
      type: 'array',
      invalid: true,
      message: 'An array key cannot be circular'
    };
  }
  const type = getKeyType(input);
  const ret = {
    type,
    value: input
  };
  switch (type) {
    case 'number':
      {
        if (Number.isNaN(input)) {
          // List as 'NaN' type for convenience of consumers in reporting errors
          return {
            type: 'NaN',
            invalid: true
          };
        }

        // https://github.com/w3c/IndexedDB/issues/375
        // https://github.com/w3c/IndexedDB/pull/386
        if (Object.is(input, -0)) {
          return {
            type,
            value: 0
          };
        }
        return /** @type {{type: KeyType; value: Value}} */ret;
      }
    case 'string':
      {
        return /** @type {{type: KeyType; value: Value}} */ret;
      }
    case 'binary':
      {
        // May throw (if detached)
        // Get a copy of the bytes held by the buffer source
        // https://heycam.github.io/webidl/#ref-for-dfn-get-buffer-source-copy-2
        const octets = getCopyBytesHeldByBufferSource(/** @type {BufferSource} */input);
        return {
          type: 'binary',
          value: octets
        };
      }
    case 'array':
      {
        // May throw (from binary)
        const arr = /** @type {Array<any>} */input;
        const len = arr.length;
        seen.push(input);

        /** @type {(KeyValueObject|Value)[]} */
        const keys = [];
        for (let i = 0; i < len; i++) {
          // We cannot iterate here with array extras as we must ensure sparse arrays are invalidated
          if (!multiEntry && !Object.hasOwn(arr, i)) {
            return {
              type,
              invalid: true,
              message: 'Does not have own index property'
            };
          }
          try {
            const entry = arr[i];
            const key = convertValueToKeyValueDecoded(entry, seen, false, fullKeys); // Though steps do not list rethrowing, the next is returnifabrupt when not multiEntry
            if (key.invalid) {
              if (multiEntry) {
                continue;
              }
              return {
                type,
                invalid: true,
                message: 'Bad array entry value-to-key conversion'
              };
            }
            if (!multiEntry || !fullKeys && keys.every(k => cmp(k, key.value) !== 0) || fullKeys && keys.every(k => cmp(k, key) !== 0)) {
              keys.push(fullKeys ? key : key.value);
            }
          } catch (err) {
            if (!multiEntry) {
              throw err;
            }
          }
        }
        return {
          type,
          value: keys
        };
      }
    case 'date':
      {
        const date = /** @type {Date} */input;
        if (!Number.isNaN(date.getTime())) {
          return fullKeys ? {
            type,
            value: date.getTime()
          } : {
            type,
            value: new Date(date)
          };
        }
        return {
          type,
          invalid: true,
          message: 'Not a valid date'
        };
        // Falls through
      }
    case 'invalid':
    default:
      {
        // Other `typeof` types which are not valid keys:
        //    'undefined', 'boolean', 'object' (including `null`), 'symbol', 'function'
        const type = input === null ? 'null' : typeof input; // Convert `null` for convenience of consumers in reporting errors
        return {
          type,
          invalid: true,
          message: 'Not a valid key; type ' + type
        };
      }
  }
}

/**
 *
 * @param {Key} key
 * @param {boolean} [fullKeys]
 * @returns {KeyValueObject}
 * @todo Document other allowable `key`?
 */
function convertValueToMultiEntryKeyDecoded(key, fullKeys) {
  return convertValueToKeyValueDecoded(key, null, true, fullKeys);
}

/**
 * An internal utility.
 * @param {Value} input
 * @param {Value[]|null|undefined} [seen]
 * @throws {DOMException} `DataError`
 * @returns {KeyValueObject}
 */
function convertValueToKeyRethrowingAndIfInvalid(input, seen) {
  const key = convertValueToKey(input, seen);
  if (key.invalid) {
    throw createDOMException('DataError', key.message || 'Not a valid key; type: ' + key.type);
  }
  return key;
}

/**
 *
 * @param {Value} value
 * @param {KeyPath} keyPath
 * @param {boolean} multiEntry
 * @returns {KeyValueObject|KeyPathEvaluateValue}
 * @todo Document other possible return?
 */
function extractKeyFromValueUsingKeyPath(value, keyPath, multiEntry) {
  return extractKeyValueDecodedFromValueUsingKeyPath(value, keyPath, multiEntry, true);
}
/**
 * Not currently in use.
 * @param {Value} value
 * @param {KeyPath} keyPath
 * @param {boolean} multiEntry
 * @returns {KeyPathEvaluateValue}
 */
function evaluateKeyPathOnValue(value, keyPath, multiEntry) {
  return evaluateKeyPathOnValueToDecodedValue(value, keyPath);
}

/**
 * May throw, return `{failure: true}` (e.g., non-object on keyPath resolution)
 *    or `{invalid: true}` (e.g., `NaN`).
 * @param {Value} value
 * @param {KeyPath} keyPath
 * @param {boolean} [multiEntry]
 * @param {boolean} [fullKeys]
 * @returns {KeyValueObject|KeyPathEvaluateValue}
 * @todo Document other possible return?
 */
function extractKeyValueDecodedFromValueUsingKeyPath(value, keyPath, multiEntry, fullKeys) {
  const r = evaluateKeyPathOnValueToDecodedValue(value, keyPath);
  if (r.failure) {
    return r;
  }
  if (!multiEntry) {
    return convertValueToKeyValueDecoded(r.value, null, false, fullKeys);
  }
  return convertValueToMultiEntryKeyDecoded(r.value, fullKeys);
}

/**
 * Unused?
 * @typedef {object} KeyPathEvaluateFailure
 * @property {boolean} failure
 */

/**
 * @typedef {KeyPathEvaluateValueValue[]} KeyPathEvaluateValueValueArray
 */

/**
 * @typedef {undefined|number|string|Date|object|KeyPathEvaluateValueValueArray} KeyPathEvaluateValueValue
 */

/**
 * @typedef {object} KeyPathEvaluateValue
 * @property {KeyPathEvaluateValueValue} [value]
 * @property {boolean} [failure]
 */

/**
 * Returns the value of an inline key based on a key path (wrapped in an
 *   object with key `value`) or `{failure: true}`
 * @param {Value} value
 * @param {KeyPath} keyPath
 * @param {boolean} [multiEntry]
 * @param {boolean} [fullKeys]
 * @returns {KeyPathEvaluateValue}
 */
function evaluateKeyPathOnValueToDecodedValue(value, keyPath, multiEntry, fullKeys) {
  if (Array.isArray(keyPath)) {
    /** @type {KeyPathEvaluateValueValueArray} */
    const result = [];
    return keyPath.some(item => {
      const key = evaluateKeyPathOnValueToDecodedValue(value, item);
      if (key.failure) {
        return true;
      }
      result.push(key.value);
      return false;
    }) ? {
      failure: true
    } : {
      value: result
    };
  }
  if (keyPath === '') {
    return {
      value
    };
  }
  const identifiers = keyPath.split('.');
  return identifiers.some(idntfr => {
    if (idntfr === 'length' && (typeof value === 'string' || Array.isArray(value))) {
      value = value.length;
    } else if (isBlob(value)) {
      switch (idntfr) {
        case 'size':
        case 'type':
          value = /** @type {Blob} */value[idntfr];
          break;
      }
    } else if (isFile(value)) {
      switch (idntfr) {
        case 'name':
        case 'lastModified':
          value = /** @type {File} */value[idntfr];
          break;
        case 'lastModifiedDate':
          value = new Date(/** @type {File} */value.lastModified);
          break;
      }
    } else if (!isObj(value) || !Object.hasOwn(value, idntfr)) {
      return true;
    } else {
      value = /** @type {{[key: string]: KeyPathEvaluateValueValue}} */value[idntfr];
      return value === undefined;
    }
    return false;
  }) ? {
    failure: true
  } : {
    value
  };
}

/**
 * Sets the inline key value.
 * @param {{[key: string]: AnyValue}} value
 * @param {Key} key
 * @param {string} keyPath
 * @returns {void}
 */
function injectKeyIntoValueUsingKeyPath(value, key, keyPath) {
  const identifiers = keyPath.split('.');
  const last = identifiers.pop();
  identifiers.forEach(identifier => {
    const hop = Object.hasOwn(value, identifier);
    if (!hop) {
      value[identifier] = {};
    }
    value = value[identifier];
  });
  value[(/** @type {string} */last)] = key; // key is already a `keyValue` in our processing so no need to convert
}

/**
 *
 * @param {Value} value
 * @param {string} keyPath
 * @see https://github.com/w3c/IndexedDB/pull/146
 * @returns {boolean}
 */
function checkKeyCouldBeInjectedIntoValue(value, keyPath) {
  const identifiers = keyPath.split('.');
  identifiers.pop();
  for (const identifier of identifiers) {
    if (!isObj(value)) {
      return false;
    }
    const hop = Object.hasOwn(value, identifier);
    if (!hop) {
      return true;
    }
    value = /** @type {{[key: string]: Value}} */value[identifier];
  }
  return isObj(value);
}

/**
 *
 * @param {Key} key
 * @param {import('./IDBKeyRange.js').IDBKeyRangeFull} range
 * @param {boolean} [checkCached]
 * @returns {boolean}
 */
function isKeyInRange(key, range, checkCached) {
  let lowerMatch = range.lower === undefined;
  let upperMatch = range.upper === undefined;
  const encodedKey = encode$1(key, true);
  const lower = checkCached ? range.__lowerCached : encode$1(range.lower, true);
  const upper = checkCached ? range.__upperCached : encode$1(range.upper, true);
  if (!lowerMatch && (range.lowerOpen && encodedKey !== null && lower !== null && encodedKey > lower || !range.lowerOpen && (!encodedKey && !lower || encodedKey !== null && lower !== null && encodedKey >= lower))) {
    lowerMatch = true;
  }
  if (!upperMatch && (range.upperOpen && encodedKey !== null && upper !== null && encodedKey < upper || !range.upperOpen && (!encodedKey && !upper || encodedKey !== null && upper !== null && encodedKey <= upper))) {
    upperMatch = true;
  }
  return lowerMatch && upperMatch;
}

/**
 * Determines whether an index entry matches a multi-entry key value.
 * @param {string} encodedEntry     The entry value (already encoded)
 * @param {string} encodedKey       The full index key (already encoded)
 * @returns {boolean}
 */
function isMultiEntryMatch(encodedEntry, encodedKey) {
  const keyType = encodedCharToKeyType[encodedKey.slice(0, 1)];
  if (keyType === 'array') {
    return encodedKey.indexOf(encodedEntry) > 1;
  }
  return encodedKey === encodedEntry;
}

/**
 *
 * @param {Key} keyEntry
 * @param {import('./IDBKeyRange.js').IDBKeyRangeFull|undefined} range
 * @returns {Key[]}
 */
function findMultiEntryMatches(keyEntry, range) {
  const matches = [];
  if (Array.isArray(keyEntry)) {
    for (let key of keyEntry) {
      if (Array.isArray(key)) {
        if (range && range.lower === range.upper) {
          continue;
        }
        if (key.length === 1) {
          key = key[0];
        } else {
          const nested = findMultiEntryMatches(key, range);
          if (nested.length > 0) {
            matches.push(key);
          }
          continue;
        }
      }
      if (isNullish(range) || isKeyInRange(key, range, true)) {
        matches.push(key);
      }
    }
  } else if (isNullish(range) || isKeyInRange(keyEntry, range, true)) {
    matches.push(keyEntry);
  }
  return matches;
}

/**
 * Not currently in use but keeping for spec parity.
 * @param {Key} key
 * @throws {Error} Upon a "bad key"
 * @returns {ValueType}
 */
function convertKeyToValue(key) {
  const {
    type,
    value
  } = key;
  switch (type) {
    case 'number':
    case 'string':
      {
        return value;
      }
    case 'array':
      {
        const array = [];
        const len = value.length;
        let index = 0;
        while (index < len) {
          const entry = convertKeyToValue(value[index]);
          array[index] = entry;
          index++;
        }
        return array;
      }
    case 'date':
      {
        return new Date(value);
      }
    case 'binary':
      {
        const len = value.length;
        const buffer = new ArrayBuffer(len);
        // Set the entries in buffer's [[ArrayBufferData]] to those in `value`
        const uint8 = new Uint8Array(buffer, value.byteOffset || 0, value.byteLength);
        uint8.set(value);
        return buffer;
      }
    case 'invalid':
    default:
      throw new Error('Bad key');
  }
}

/**
 *
 * @param {Key} key
 * @param {boolean} [inArray]
 * @returns {string|null}
 */
function encode$1(key, inArray) {
  // Bad keys like `null`, `object`, `boolean`, 'function', 'symbol' should not be passed here due to prior validation
  if (key === undefined) {
    return null;
  }
  // array, date, number, string, binary (should already have detected "invalid")
  return types[getKeyType(key)].encode(key, inArray);
}

/**
 *
 * @param {Key} key
 * @param {boolean} [inArray]
 * @throws {Error} Invalid number
 * @returns {undefined|ValueType}
 */
function decode$1(key, inArray) {
  if (typeof key !== 'string') {
    return undefined;
  }
  return types[encodedCharToKeyType[key.slice(0, 1)]].decode(key, inArray);
}

/**
 *
 * @param {Key} key
 * @param {boolean} [inArray]
 * @returns {undefined|ValueType}
 */
function roundTrip(key, inArray) {
  return decode$1(encode$1(key, inArray), inArray);
}
const MAX_ALLOWED_CURRENT_NUMBER = 9007199254740992; // 2 ^ 53 (Also equal to `Number.MAX_SAFE_INTEGER + 1`)

/**
 * @typedef {number} Integer
 */

/**
 * @callback CurrentNumberCallback
 * @param {Integer} cn The current number
 * @returns {void}
 */

/**
 * @callback SQLFailureCallback
 * @param {DOMException|Error} exception
 * @returns {void}
 */

/**
 *
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {CurrentNumberCallback} func
 * @param {SQLFailureCallback} sqlFailCb
 * @returns {void}
 */
function getCurrentNumber(tx, store, func, sqlFailCb) {
  tx.executeSql('SELECT "currNum" FROM __sys__ WHERE "name" = ?', [escapeSQLiteStatement(store.__currentName)], function (tx, data) {
    if (data.rows.length !== 1) {
      func(1);
    } else {
      func(data.rows.item(0).currNum);
    }
  }, function (tx, error) {
    sqlFailCb(createDOMException('DataError', 'Could not get the auto increment value for key', error));
    return false;
  });
}

/**
 *
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {Integer} num
 * @param {CurrentNumberCallback} successCb
 * @param {SQLFailureCallback} failCb
 * @returns {void}
 */
function assignCurrentNumber(tx, store, num, successCb, failCb) {
  const sql = 'UPDATE __sys__ SET "currNum" = ? WHERE "name" = ?';
  const sqlValues = [num, escapeSQLiteStatement(store.__currentName)];
  if (CFG.DEBUG) {
    console.log(sql, sqlValues);
  }
  tx.executeSql(sql, sqlValues, function () {
    successCb(num);
  }, function (tx, err) {
    failCb(createDOMException('UnknownError', 'Could not set the auto increment value for key', err));
    return false;
  });
}

/**
 * Bump up the auto-inc counter if the key path-resolved value is valid
 *   (greater than old value and >=1) OR if a manually passed in key is
 *   valid (numeric and >= 1) and >= any primaryKey.
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {Integer} num
 * @param {CurrentNumberCallback} successCb
 * @param {SQLFailureCallback} failCb
 * @returns {void}
 */
function setCurrentNumber(tx, store, num, successCb, failCb) {
  num = 1 + (num === MAX_ALLOWED_CURRENT_NUMBER
  // Since incrementing by one will have no effect in JavaScript on this
  // unsafe max, we represent the max as a number incremented by two.
  // The getting of the current number is never returned to the user and
  // is only used in safe comparisons, so it is safe for us to represent
  // it in this manner
  ? num + 1 : num);
  return assignCurrentNumber(tx, store, num, successCb, failCb);
}

/**
 * @callback KeyForStoreCallback
 * @param {"failure"|null} arg1
 * @param {Integer} [arg2]
 * @param {Integer} [arg3]
 * @returns {void}
 */

/**
 *
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {KeyForStoreCallback} cb
 * @param {SQLFailureCallback} sqlFailCb
 * @returns {void}
 */
function generateKeyForStore(tx, store, cb, sqlFailCb) {
  getCurrentNumber(tx, store, function (key) {
    if (key > MAX_ALLOWED_CURRENT_NUMBER) {
      // 2 ^ 53 (See <https://github.com/w3c/IndexedDB/issues/147>)
      cb('failure');
      return;
    }
    // Increment current number by 1 (we cannot leverage SQLite's
    //  autoincrement (and decrement when not needed), as decrementing
    //  will be overwritten/ignored upon the next insert)
    setCurrentNumber(tx, store, key, function () {
      cb(null, key, key);
    }, sqlFailCb);
  }, sqlFailCb);
}

// Fractional or numbers exceeding the max do not get changed in the result
//     per https://github.com/w3c/IndexedDB/issues/147
//     so we do not return a key
/**
 *
 * @param {SQLTransaction} tx
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {Key} key
 * @param {(num?: Integer) => void} successCb
 * @param {SQLFailureCallback} sqlFailCb
 * @returns {void}
 */
function possiblyUpdateKeyGenerator(tx, store, key, successCb, sqlFailCb) {
  // Per https://github.com/w3c/IndexedDB/issues/147 , non-finite numbers
  //   (or numbers larger than the max) are now to have the explicit effect of
  //   setting the current number (up to the max), so we do not optimize them
  //   out here
  if (typeof key !== 'number' || key < 1) {
    // Optimize with no need to get the current number
    // Auto-increment attempted with a bad key;
    //   we are not to change the current number, but the steps don't call for failure
    // Numbers < 1 are optimized out as they will never be greater than the current number which must be at least 1
    successCb();
  } else {
    // If auto-increment and the keyPath item is a valid numeric key, get the old auto-increment to compare if the new is higher
    //  to determine which to use and whether to update the current number
    getCurrentNumber(tx, store, function (cn) {
      const value = Math.floor(Math.min(key, MAX_ALLOWED_CURRENT_NUMBER));
      const useNewKeyForAutoInc = value >= cn;
      if (useNewKeyForAutoInc) {
        setCurrentNumber(tx, store, value, function () {
          successCb(cn); // Supply old current number in case needs to be reverted
        }, sqlFailCb);
      } else {
        // Not updated
        successCb();
      }
    }, sqlFailCb);
  }
}

var Key = /*#__PURE__*/Object.freeze({
  __proto__: null,
  assignCurrentNumber: assignCurrentNumber,
  checkKeyCouldBeInjectedIntoValue: checkKeyCouldBeInjectedIntoValue,
  convertKeyToValue: convertKeyToValue,
  convertValueToKey: convertValueToKey,
  convertValueToKeyRethrowingAndIfInvalid: convertValueToKeyRethrowingAndIfInvalid,
  convertValueToKeyValueDecoded: convertValueToKeyValueDecoded,
  convertValueToMultiEntryKey: convertValueToMultiEntryKey,
  convertValueToMultiEntryKeyDecoded: convertValueToMultiEntryKeyDecoded,
  decode: decode$1,
  encode: encode$1,
  evaluateKeyPathOnValue: evaluateKeyPathOnValue,
  extractKeyFromValueUsingKeyPath: extractKeyFromValueUsingKeyPath,
  extractKeyValueDecodedFromValueUsingKeyPath: extractKeyValueDecodedFromValueUsingKeyPath,
  findMultiEntryMatches: findMultiEntryMatches,
  generateKeyForStore: generateKeyForStore,
  injectKeyIntoValueUsingKeyPath: injectKeyIntoValueUsingKeyPath,
  isKeyInRange: isKeyInRange,
  isMultiEntryMatch: isMultiEntryMatch,
  possiblyUpdateKeyGenerator: possiblyUpdateKeyGenerator,
  roundTrip: roundTrip
});

const readonlyProperties$4 = /** @type {const} */['lower', 'upper', 'lowerOpen', 'upperOpen'];

/**
 * @typedef {globalThis.IDBKeyRange & {
 *   __lowerCached: string|null|false,
 *   __upperCached: string|null|false,
 *   __lowerOpen: boolean,
 * }} IDBKeyRangeFull
 */

/**
 * The IndexedDB KeyRange object.
 * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
 * @throws {TypeError}
 * @class
 */
function IDBKeyRange() {
  this.__lowerOpen = false;
  this.__upperOpen = false;
  throw new TypeError('Illegal constructor');
}
const IDBKeyRangeAlias = IDBKeyRange;

/**
 * @param {import('./Key.js').Key|null} lower
 * @param {import('./Key.js').Key|null} upper
 * @param {boolean} lowerOpen
 * @param {boolean} upperOpen
 * @returns {import('./IDBKeyRange.js').IDBKeyRangeFull}
 */
IDBKeyRange.__createInstance = function (lower, upper, lowerOpen, upperOpen) {
  /**
   * @class
   * @throws {DOMException|Error}
   */
  function IDBKeyRange() {
    this[Symbol.toStringTag] = 'IDBKeyRange';
    if (lower === undefined && upper === undefined) {
      throw createDOMException('DataError', 'Both arguments to the key range method cannot be undefined');
    }
    let lowerConverted, upperConverted;
    if (lower !== undefined) {
      lowerConverted = roundTrip(lower); // Todo: does this make the "conversions" redundant
      convertValueToKeyRethrowingAndIfInvalid(lower);
    }
    if (upper !== undefined) {
      upperConverted = roundTrip(upper); // Todo: does this make the "conversions" redundant
      convertValueToKeyRethrowingAndIfInvalid(upper);
    }
    if (lower !== undefined && upper !== undefined && lower !== upper) {
      if (/** @type {string} */encode$1(lower) > (/** @type {string} */encode$1(upper))) {
        throw createDOMException('DataError', '`lower` must not be greater than `upper` argument in `bound()` call.');
      }
    }
    this.__lower = lowerConverted;
    this.__upper = upperConverted;
    this.__lowerOpen = Boolean(lowerOpen);
    this.__upperOpen = Boolean(upperOpen);
  }
  IDBKeyRange.prototype = IDBKeyRangeAlias.prototype;

  // @ts-expect-error Properties added by `defineProperty/ies`
  return new IDBKeyRange();
};

/**
 * @param {import('./Key.js').Key} key
 * @this {IDBKeyRangeFull}
 * @returns {boolean}
 */
IDBKeyRange.prototype.includes = function (key) {
  // We can't do a regular instanceof check as it will create a loop given our hasInstance implementation
  if (!isObj(this) || typeof this.__lowerOpen !== 'boolean') {
    throw new TypeError('Illegal invocation');
  }
  if (!arguments.length) {
    throw new TypeError('IDBKeyRange.includes requires a key argument');
  }
  convertValueToKeyRethrowingAndIfInvalid(key);
  return isKeyInRange(key, this);
};

/**
 * @param {import('./Key.js').Value} value
 * @returns {import('./IDBKeyRange.js').IDBKeyRangeFull}
 */
IDBKeyRange.only = function (value) {
  if (!arguments.length) {
    throw new TypeError('IDBKeyRange.only requires a value argument');
  }
  return IDBKeyRange.__createInstance(value, value, false, false);
};

/**
 * @param {import('./Key.js').Value} value
 * @returns {globalThis.IDBKeyRange}
 */
IDBKeyRange.lowerBound = function (value /* , open */) {
  if (!arguments.length) {
    throw new TypeError('IDBKeyRange.lowerBound requires a value argument');
  }
  // eslint-disable-next-line prefer-rest-params -- API
  return IDBKeyRange.__createInstance(value, undefined, arguments[1], true);
};

/**
 * @param {import('./Key.js').Value} value
 * @returns {globalThis.IDBKeyRange}
 */
IDBKeyRange.upperBound = function (value /* , open */) {
  if (!arguments.length) {
    throw new TypeError('IDBKeyRange.upperBound requires a value argument');
  }
  // eslint-disable-next-line prefer-rest-params -- API
  return IDBKeyRange.__createInstance(undefined, value, true, arguments[1]);
};

/**
 * @param {import('./Key.js').Value} lower
 * @param {import('./Key.js').Value} upper
 * @returns {globalThis.IDBKeyRange}
 */
IDBKeyRange.bound = function (lower, upper /* , lowerOpen, upperOpen */) {
  if (arguments.length <= 1) {
    throw new TypeError('IDBKeyRange.bound requires lower and upper arguments');
  }
  // eslint-disable-next-line prefer-rest-params -- API
  return IDBKeyRange.__createInstance(lower, upper, arguments[2], arguments[3]);
};
IDBKeyRange.prototype[Symbol.toStringTag] = 'IDBKeyRangePrototype';

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
readonlyProperties$4.forEach(prop => {
  Object.defineProperty(IDBKeyRange.prototype, '__' + prop, {
    enumerable: false,
    configurable: false,
    writable: true
  });
  // Ensure for proper interface testing that "get <name>" is the function name
  const o = {
    /**
     * @returns {import('./Key.js').Key|null|boolean}
     */
    get [prop]() {
      // We can't do a regular instanceof check as it will create a loop given our hasInstance implementation
      if (!isObj(this) || typeof this.__lowerOpen !== 'boolean') {
        throw new TypeError('Illegal invocation');
      }
      return this['__' + prop];
    }
  };
  const desc = /** @type {PropertyDescriptor} */
  Object.getOwnPropertyDescriptor(o, prop);
  // desc.enumerable = true; // Default
  // desc.configurable = true; // Default
  Object.defineProperty(IDBKeyRange.prototype, prop, desc);
});
Object.defineProperties(IDBKeyRange, {
  [Symbol.hasInstance]: {
    value:
    /**
     * @param {object} obj
     * @returns {boolean}
     */
    obj => isObj(obj) && 'upper' in obj && 'lowerOpen' in obj && typeof obj.lowerOpen === 'boolean'
  },
  prototype: {
    writable: false
  }
});

/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

/**
 * @param {IDBKeyRangeFull|undefined} range
 * @param {string} quotedKeyColumnName
 * @param {string[]} sql
 * @param {string[]} sqlValues
 * @param {boolean} [addAnd]
 * @param {boolean} [checkCached]
 * @returns {void}
 */
function setSQLForKeyRange(range, quotedKeyColumnName, sql, sqlValues, addAnd, checkCached) {
  if (!(range && (range.lower !== undefined || range.upper !== undefined))) {
    return;
  }
  if (addAnd) {
    sql.push('AND');
  }
  let encodedLowerKey, encodedUpperKey;
  const hasLower = range.lower !== undefined;
  const hasUpper = range.upper !== undefined;
  if (hasLower) {
    encodedLowerKey = checkCached ? range.__lowerCached : encode$1(range.lower);
  }
  if (hasUpper) {
    encodedUpperKey = checkCached ? range.__upperCached : encode$1(range.upper);
  }
  if (hasLower) {
    sqlValues.push(escapeSQLiteStatement(/** @type {string} */encodedLowerKey));
    if (hasUpper && encodedLowerKey === encodedUpperKey && !range.lowerOpen && !range.upperOpen) {
      sql.push(quotedKeyColumnName, '=', '?');
      return;
    }
    sql.push(quotedKeyColumnName, range.lowerOpen ? '>' : '>=', '?');
  }
  if (hasLower && hasUpper) {
    sql.push('AND');
  }
  if (hasUpper) {
    sql.push(quotedKeyColumnName, range.upperOpen ? '<' : '<=', '?');
    sqlValues.push(escapeSQLiteStatement(/** @type {string} */encodedUpperKey));
  }
}

/**
 * @param {import('./Key.js').Value} value
 * @param {boolean} [nullDisallowed]
 * @throws {DOMException}
 * @returns {import('./IDBKeyRange.js').IDBKeyRangeFull|undefined}
 */
function convertValueToKeyRange(value, nullDisallowed) {
  if (instanceOf(value, IDBKeyRange)) {
    // We still need to validate IDBKeyRange-like objects (the above check is based on loose duck-typing)
    if (value.toString() !== '[object IDBKeyRange]') {
      return IDBKeyRange.__createInstance(value.lower, value.upper, value.lowerOpen, value.upperOpen);
    }
    return value;
  }
  if (isNullish(value)) {
    if (nullDisallowed) {
      throw createDOMException('DataError', 'No key or range was specified');
    }
    return undefined; // Represents unbounded
  }
  convertValueToKeyRethrowingAndIfInvalid(value);
  return IDBKeyRange.only(value);
}

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {{
 *   _items: string[],
 *   _length: Integer,
 *   [key: number]: string,
 *   addIndexes: () => void,
 *   sortList: () => string[],
 *   push: (item: string) => void,
 *   clone: () => DOMStringListFull,
 *   contains: (str: string) => boolean,
 *   indexOf: (str: string) => Integer,
 *   splice: (index: Integer, howmany: Integer, ...args: any) => void
 *   length: Integer
 * }} DOMStringListFull
 */

let cleanInterface = false;
const testObject = {
  test: true
};
// Test whether Object.defineProperty really works.
if (Object.defineProperty) {
  try {
    Object.defineProperty(testObject, 'test', {
      enumerable: false
    });
    if (testObject.test) {
      cleanInterface = true;
    }
  } catch (err) {
    // Object.defineProperty does not work as intended.
  }
}

/**
 * Shim the DOMStringList object.
 * @throws {TypeError}
 * @class
 */
const DOMStringList = function () {
  /** @type {string[]} */
  this._items = [];
  /** @type {Integer} */
  this._length = 0;
  throw new TypeError('Illegal constructor');
};

// @ts-expect-error It's ok
DOMStringList.prototype = {
  constructor: DOMStringList,
  // Interface.

  /**
   * @param {string} str
   * @returns {boolean}
   */
  contains(str) {
    if (!arguments.length) {
      throw new TypeError('DOMStringList.contains must be supplied a value');
    }
    return this._items.includes(str);
  },
  /**
   * @param {number} key
   * @returns {string|null}
   */
  item(key) {
    if (!arguments.length) {
      throw new TypeError('DOMStringList.item must be supplied a value');
    }
    if (key < 0 || key >= this.length ||
    // eslint-disable-next-line unicorn/prefer-number-is-safe-integer -- We want all
    !Number.isInteger(key)) {
      return null;
    }
    return this._items[key];
  },
  // Helpers. Should only be used internally.
  /**
   * @returns {DOMStringListFull}
   */
  clone() {
    const stringList = DOMStringList.__createInstance();
    stringList._items = this._items.slice();
    stringList._length = this.length;
    stringList.addIndexes();
    return stringList;
  },
  /**
   * @this {DOMStringListFull}
   * @returns {void}
   */
  addIndexes() {
    for (let i = 0; i < this._items.length; i++) {
      this[i] = this._items[i];
    }
  },
  /**
   * @this {DOMStringListFull}
   * @returns {string[]}
   */
  sortList() {
    // https://w3c.github.io/IndexedDB/#sorted-list
    // https://tc39.github.io/ecma262/#sec-abstract-relational-comparison
    // eslint-disable-next-line unicorn/require-array-sort-compare -- IndexedDB requires code unit comparison (default behavior)
    this._items.sort();
    this.addIndexes();
    return this._items;
  },
  /**
   * @param {(value: string, i: Integer, arr: string[]) => void} cb
   * @param {object} thisArg
   * @returns {void}
   */
  forEach(cb, thisArg) {
    // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument -- Convenient
    this._items.forEach(cb, thisArg);
  },
  /**
   * @param {(value: string, i: Integer, arr: string[]) => any[]} cb
   * @param {object} thisArg
   * @returns {any[]}
   */
  map(cb, thisArg) {
    // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument -- Convenient
    return this._items.map(cb, thisArg);
  },
  /**
   * @param {string} str
   * @returns {Integer}
   */
  indexOf(str) {
    return this._items.indexOf(str);
  },
  /**
   * @param {string} item
   * @this {DOMStringListFull}
   * @returns {void}
   */
  push(item) {
    this._items.push(item);
    this._length++;
    this.sortList();
  },
  /**
   * @typedef {any} AnyArgs
   */
  /**
   * @param {[index: Integer, howmany: Integer, ...args: any]} args
   * @this {DOMStringListFull}
   * @returns {void}
   */
  splice(...args /* index, howmany, item1, ..., itemX */) {
    this._items.splice(...args);
    this._length = this._items.length;
    for (const i in this) {
      if (i === String(Math.trunc(Number(i)))) {
        delete this[i];
      }
    }
    this.sortList();
  },
  [Symbol.toStringTag]: 'DOMStringListPrototype',
  // At least because `DOMStringList`, as a [list](https://infra.spec.whatwg.org/#list)
  //    can be converted to a sequence per https://infra.spec.whatwg.org/#list-iterate
  //    and particularly as some methods, e.g., `IDBDatabase.transaction`
  //    expect such sequence<DOMString> (or DOMString), we need an iterator (some of
  //    the Mocha tests rely on these)
  *[Symbol.iterator]() {
    let i = 0;
    while (i < this._items.length) {
      yield this._items[i++];
    }
  }
};

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
/**
 * @typedef {any} AnyValue
 */
Object.defineProperty(DOMStringList, Symbol.hasInstance, {
  /**
   * @param {AnyValue} obj
   * @returns {boolean}
   */
  value(obj) {
    return Object.prototype.toString.call(obj) === 'DOMStringListPrototype';
  }
});
const DOMStringListAlias = DOMStringList;
Object.defineProperty(DOMStringList, '__createInstance', {
  /* eslint-enable unicorn/no-top-level-side-effects -- Would be good */
  /**
   * @returns {DOMStringListFull}
   */
  value() {
    /**
     * @class
     * @this {DOMStringList}
     */
    const DOMStringList = function DOMStringList() {
      this.toString = function () {
        return '[object DOMStringList]';
      };
      // Internal functions on the prototype have been made non-enumerable below.
      Object.defineProperty(this, 'length', {
        enumerable: true,
        get() {
          return this._length;
        }
      });
      this._items = /** @type {string[]} */[];
      this._length = 0;
    };
    DOMStringList.prototype = DOMStringListAlias.prototype;
    return /** @type {DOMStringListFull} */new DOMStringList();
  }
});
if (cleanInterface) {
  Object.defineProperty(DOMStringList, 'prototype', {
    writable: false
  });
  const nonenumerableReadonly = ['addIndexes', 'sortList', 'forEach', 'map', 'indexOf', 'push', 'splice', 'constructor', '__createInstance'];
  nonenumerableReadonly.forEach(nonenumerableReadonly => {
    Object.defineProperty(DOMStringList.prototype, nonenumerableReadonly, {
      enumerable: false
    });
  });

  // Illegal invocations
  // @ts-expect-error No return value
  Object.defineProperty(DOMStringList.prototype, 'length', {
    configurable: true,
    enumerable: true,
    get() {
      throw new TypeError('Illegal invocation');
    }
  });
  const nonenumerableWritable = ['_items', '_length'];
  nonenumerableWritable.forEach(nonenumerableWritable => {
    Object.defineProperty(DOMStringList.prototype, nonenumerableWritable, {
      enumerable: false,
      writable: true
    });
  });
}

let uniqueID = 0;
const listeners$1 = ['onabort', 'oncomplete', 'onerror'];
const readonlyProperties$3 = ['objectStoreNames', 'mode', 'db', 'error'];

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {{
 *   op: SQLCallback,
 *   args: ObjectArray,
 *   req: import('./IDBRequest.js').IDBRequestFull|null
 * }} RequestInfo
 */

/**
 * @typedef {EventTarget & {
 *   mode: "readonly"|"readwrite"|"versionchange",
 *   db: import('./IDBDatabase.js').IDBDatabaseFull,
 *   on__abort: () => void,
 *   on__complete: () => void,
 *   on__beforecomplete: (ev: Event & {
 *     complete: () => void
 *   }) => void,
 *   on__preabort: () => void,
 *   __abortTransaction: (err: Error|DOMException|null) => void,
 *   __executeRequests: () => void,
 *   __tx: SQLTransaction,
 *   __id: Integer,
 *   __active: boolean,
 *   __running: boolean,
 *   __errored: boolean,
 *   __requests: RequestInfo[],
 *   __db: import('./IDBDatabase.js').IDBDatabaseFull,
 *   __mode: string,
 *   __error: null|DOMException|Error,
 *   __objectStoreNames: import('./DOMStringList.js').DOMStringListFull,
 *   __storeHandles: {
 *     [key: string]: import('./IDBObjectStore.js').IDBObjectStoreFull
 *   },
 *   __requestsFinished: boolean,
 *   __transFinishedCb: (err: boolean, cb: ((bool?: boolean) => void)) => void,
 *   __callTransFinishedCb: (err: boolean, cb: ((bool?: boolean) => void)) => void,
 *   __transactionEndCallback: () => void,
 *   __transactionFinished: boolean,
 *   __completed: boolean,
 *   __internal: boolean,
 *   __abortFinished: boolean,
 *   __createRequest: (
 *     source: import('./IDBDatabase.js').IDBDatabaseFull|
 *       import('./IDBObjectStore.js').IDBObjectStoreFull|
 *       import('./IDBIndex.js').IDBIndexFull|
 *       import('./IDBCursor.js').IDBCursorFull
 *   ) => import('./IDBRequest.js').IDBRequestFull,
 *   __pushToQueue: (
 *     request: import('./IDBRequest.js').IDBRequestFull|null,
 *     callback: SQLCallback,
 *     args?: ObjectArray
 *   ) => void,
 *   __assertActive: () => void,
 *   __addNonRequestToTransactionQueue: (
 *     callback: SQLCallback,
 *     args?: ObjectArray
 *   ) => void
 *   __addToTransactionQueue: (
 *     callback: SQLCallback,
 *     args: ObjectArray|undefined,
 *     source: import('./IDBDatabase.js').IDBDatabaseFull|
 *       import('./IDBObjectStore.js').IDBObjectStoreFull|
 *       import('./IDBIndex.js').IDBIndexFull|
 *       import('./IDBCursor.js').IDBCursorFull
 *   ) => import('./IDBRequest.js').IDBRequestFull
 *   __assertWritable: () => void,
 * }} IDBTransactionFull
 */

/**
 * The IndexedDB Transaction.
 * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
 * @class
 * @throws {TypeError}
 */
function IDBTransaction() {
  throw new TypeError('Illegal constructor');
}
const IDBTransactionAlias = IDBTransaction;
/**
 * @param {import('./IDBDatabase.js').IDBDatabaseFull} db
 * @param {import('./DOMStringList.js').DOMStringListFull} storeNames
 * @param {string} mode
 * @returns {IDBTransactionFull}
 */
IDBTransaction.__createInstance = function (db, storeNames, mode) {
  /**
   * @class
   * @this {IDBTransactionFull}
   */
  function IDBTransaction() {
    const me = this;
    // @ts-expect-error It's ok
    me[Symbol.toStringTag] = 'IDBTransaction';
    defineReadonlyProperties(me, readonlyProperties$3);
    // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Debugging only
    me.__id = ++uniqueID; // for debugging simultaneous transactions
    me.__active = true;
    me.__running = false;
    me.__errored = false;
    me.__requests = [];
    me.__objectStoreNames = storeNames;
    me.__mode = mode;
    me.__db = db;
    me.__error = null;
    // @ts-expect-error Part of `ShimEventTarget`
    me.__setOptions({
      legacyOutputDidListenersThrowFlag: true // Event hook for IndexedB
    });
    readonlyProperties$3.forEach(readonlyProp => {
      Object.defineProperty(this, readonlyProp, {
        configurable: true
      });
    });
    defineListenerProperties(this, listeners$1);
    me.__storeHandles = {};

    // Kick off the transaction as soon as all synchronous code is done
    setTimeout(() => {
      me.__executeRequests();
    }, 0);
  }
  IDBTransaction.prototype = IDBTransactionAlias.prototype;

  // @ts-expect-error It's ok
  return new IDBTransaction();
};

// @ts-expect-error It's ok
IDBTransaction.prototype = EventTargetFactory.createInstance({
  defaultSync: true,
  // Ensure EventTarget preserves our properties
  extraProperties: ['complete']
});

/**
 *
 * @param {boolean} err
 * @param {(bool: boolean) => void} cb
 * @returns {void}
 */
IDBTransaction.prototype.__transFinishedCb = function (err, cb) {
  cb(Boolean(err));
};

/**
 * In Node, the real (SQL-commit-capable) `__transFinishedCb` is only
 * installed once the underlying WebSQL driver's own SQL-queue-idle check
 * has fired at least once for this transaction (asynchronously, via the
 * `nonstandardTransCb` passed to `db.transaction`/`.readTransaction`).
 * Since our own request processing can now finish synchronously (e.g., a
 * trivial upgrade using a synchronous SQL driver), it is possible to reach
 * transaction completion here before that has happened, in which case
 * `__transFinishedCb` is still the non-committing default above. Calling
 * that default directly would silently skip the actual SQL commit and
 * leave the underlying WebSQL transaction "running" forever, hanging any
 * later transaction on that same database connection. So, if the real
 * callback isn't installed yet, defer and retry until it is.
 * @this {IDBTransactionFull}
 * @param {boolean} err
 * @param {(bool?: boolean) => void} cb
 * @returns {void}
 */
IDBTransaction.prototype.__callTransFinishedCb = function (err, cb) {
  const me = this;
  if (me.__transFinishedCb === IDBTransaction.prototype.__transFinishedCb) {
    setTimeout(() => {
      me.__callTransFinishedCb(err, cb);
    }, 0);
    return;
  }
  me.__transFinishedCb(err, cb);
};
/**
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__executeRequests = function () {
  const me = this;
  if (me.__running) {
    if (CFG.DEBUG) {
      console.log('Looks like the request set is already running', me.mode);
    }
    return;
  }
  me.__running = true;
  me.db.__db[me.mode === 'readonly' ? 'readTransaction' : 'transaction'](
  // `readTransaction` is optimized, at least in `node-websql`
  function executeRequests(tx) {
    me.__tx = tx;
    /** @type {RequestInfo} */
    let q,
      i = -1;

    /**
     * @typedef {any} IDBRequestResult
     */

    /**
     * @param {IDBRequestResult} [result]
     * @param {import('./IDBRequest.js').IDBRequestFull} [req]
     * @returns {void}
     */
    function success(result, req) {
      if (me.__errored || me.__requestsFinished) {
        // We've already called "onerror", "onabort", or thrown within the transaction, so don't do it again.
        return;
      }
      if (req) {
        q.req = req; // Need to do this in case of cursors
      }
      if (!q.req) {
        // TS guard
        return;
      }
      if (q.req.__done) {
        // Avoid continuing with aborted requests
        return;
      }
      q.req.__done = true;
      q.req.__result = result;
      q.req.__error = null;
      me.__active = true;
      const e = createEvent('success');
      q.req.dispatchEvent(e);
      // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
      if (e.__legacyOutputDidListenersThrowError) {
        logError('Error', 'An error occurred in a success handler attached to request chain', e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
        // me.__active = false;
        me.__abortTransaction(createDOMException('AbortError', 'A request was aborted (in user handler after success).'));
        return;
      }
      runContinuationSafely(executeNextRequest);
    }

    /**
     * @param {[tx: SQLTransaction|DOMException|Error|SQLError, err?: SQLError]} args
     * @returns {void}
     */
    function error(...args /* tx, err */) {
      if (me.__errored || me.__requestsFinished) {
        // We've already called "onerror", "onabort", or thrown within
        //  the transaction, so don't do it again.
        return;
      }
      if (q.req && q.req.__done) {
        // Avoid continuing with aborted requests
        return;
      }
      const err = /** @type {Error|DOMException} */findError(args);
      if (!q.req) {
        me.__abortTransaction(err);
        return;
      }

      // Fire an error event for the current IDBRequest
      q.req.__done = true;
      q.req.__error = err;
      q.req.__result = undefined; // Must be undefined if an error per `result` getter
      q.req.addLateEventListener('error', function (e) {
        if (e.cancelable && e.defaultPrevented && !e.__legacyOutputDidListenersThrowError) {
          executeNextRequest();
        }
      });
      q.req.addDefaultEventListener('error', function () {
        if (!q.req) {
          // TS guard
          return;
        }
        me.__abortTransaction(q.req.__error);
      });
      me.__active = true;
      const e = createEvent('error', err, {
        bubbles: true,
        cancelable: true
      });
      q.req.dispatchEvent(e);
      // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
      if (e.__legacyOutputDidListenersThrowError) {
        logError('Error', 'An error occurred in an error handler attached to request chain', e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
        e.preventDefault(); // Prevent 'error' default as steps indicate we should abort with `AbortError` even without cancellation
        me.__abortTransaction(createDOMException('AbortError', 'A request was aborted (in user handler after error).'));
      }
    }

    /**
     * @returns {void}
     */
    function executeNextRequest() {
      if (me.__errored || me.__requestsFinished) {
        // We've already called "onerror", "onabort", or thrown within the transaction, so don't do it again.
        return;
      }
      i++;
      if (i >= me.__requests.length) {
        // All requests in the transaction are done
        me.__requests = [];
        if (me.__active) {
          requestsFinished();
        }
      } else {
        try {
          q = me.__requests[i];
          if (!q.req) {
            q.op(tx, q.args, () => runContinuationSafely(executeNextRequest), error);
            return;
          }
          if (q.req.__done) {
            // Avoid continuing with aborted requests
            return;
          }
          q.op(tx, q.args, success, error, executeNextRequest);
        } catch (e) {
          error(/** @type {Error} */e);
        }
      }
    }
    executeNextRequest();
  }, function webSQLError(webSQLErr) {
    // @ts-expect-error It's ok
    if (webSQLErr === true) {
      // Not a genuine SQL error
      return;
    }
    const err = webSQLErrback(/** @type {SQLError} */webSQLErr);
    me.__abortTransaction(err);
  }, function () {
    // For Node, we don't need to try running here as we can keep
    //   the transaction running long enough to rollback (in the
    //   next (non-standard) callback for this transaction call)
    if (me.__transFinishedCb !== IDBTransaction.prototype.__transFinishedCb) {
      // Node
      return;
    }
    if (!me.__transactionEndCallback && !me.__requestsFinished) {
      me.__transactionFinished = true;
      return;
    }
    if (me.__transactionEndCallback && !me.__completed) {
      me.__transFinishedCb(me.__errored, me.__transactionEndCallback);
    }
  }, function (currentTask, err, done, rollback, commit) {
    if (currentTask.readOnly || err) {
      return true;
    }
    me.__transFinishedCb = function (err, cb) {
      if (err) {
        rollback(err, cb);
      } else {
        commit(cb);
      }
    };
    if (me.__transactionEndCallback && !me.__completed) {
      me.__transFinishedCb(me.__errored, me.__transactionEndCallback);
    }
    return false;
  });

  /**
   * @returns {void}
   */
  function requestsFinished() {
    me.__active = false;
    me.__requestsFinished = true;

    /**
     * @throws {Error}
     * @returns {void}
     */
    function complete() {
      me.__completed = true;
      if (CFG.DEBUG) {
        console.log('Transaction completed');
      }
      const evt = createEvent('complete');
      try {
        me.__internal = true;
        me.dispatchEvent(evt);
        me.__internal = false;
        me.dispatchEvent(createEvent('__complete'));
      } catch (e) {
        me.__internal = false;
        // An error occurred in the "oncomplete" handler.
        // It's too late to call "onerror" or "onabort". Throw a global error instead.
        // (this may seem odd/bad, but it's how all native IndexedDB implementations work)
        me.__errored = true;
        throw e;
      } finally {
        me.__storeHandles = {};
      }
    }
    if (me.mode === 'readwrite') {
      if (me.__transactionFinished) {
        complete();
        return;
      }
      me.__transactionEndCallback = complete;
      return;
    }
    if (me.mode === 'readonly') {
      complete();
      return;
    }
    const ev = /** @type {Event & {complete: () => void}} */
    createEvent('__beforecomplete');
    ev.complete = complete;
    me.dispatchEvent(ev);
  }
};

/**
 * Creates a new IDBRequest for the transaction.
 * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}.
 * @param {import('./IDBDatabase.js').IDBDatabaseFull} source
 * @this {IDBTransactionFull}
 * @returns {IDBRequest}
 */
IDBTransaction.prototype.__createRequest = function (source) {
  const me = this;
  const request = IDBRequest.__createInstance();
  request.__source = source !== undefined ? source : me.db;
  request.__transaction = me;
  return request;
};

/**
 * @typedef {(
 *   tx: SQLTransaction,
 *   args: ObjectArray,
 *   success: (result?: any, req?: import('./IDBRequest.js').IDBRequestFull) => void,
 *   error: (tx: SQLTransaction|Error|DOMException|SQLError, err?: SQLError) => void,
 *   executeNextRequest?: () => void
 * ) => void} SQLCallback
 */

/**
 * Adds a callback function to the transaction queue.
 * @param {SQLCallback} callback
 * @param {ObjectArray} args
 * @param {import('./IDBDatabase.js').IDBDatabaseFull|
 *   import('./IDBObjectStore.js').IDBObjectStoreFull|
 *   import('./IDBIndex.js').IDBIndexFull} source
 * @this {IDBTransactionFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBTransaction.prototype.__addToTransactionQueue = function (callback, args, source) {
  const request = this.__createRequest(source);
  this.__pushToQueue(request, callback, args);
  return request;
};

/**
 * Adds a callback function to the transaction queue without generating a
 *   request.
 * @param {SQLCallback} callback
 * @param {ObjectArray} args
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__addNonRequestToTransactionQueue = function (callback, args) {
  this.__pushToQueue(null, callback, args);
};

/**
 * Adds an IDBRequest to the transaction queue.
 * @param {import('./IDBRequest.js').IDBRequestFull|null} request
 * @param {SQLCallback} callback
 * @param {ObjectArray} args
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__pushToQueue = function (request, callback, args) {
  this.__assertActive();
  this.__requests.push({
    op: callback,
    args,
    req: request
  });
};

/**
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.prototype.__assertActive = function () {
  if (!this.__active) {
    throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
  }
};

/**
 * @throws {DOMException}
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__assertWritable = function () {
  if (this.mode === 'readonly') {
    throw createDOMException('ReadOnlyError', 'The transaction is read only');
  }
};

/**
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__assertVersionChange = function () {
  IDBTransaction.__assertVersionChange(this);
};

/**
 * Returns the specified object store.
 * @param {string} objectStoreName
 * @this {IDBTransactionFull}
 * @returns {IDBObjectStore}
 */
IDBTransaction.prototype.objectStore = function (objectStoreName) {
  const me = this;
  if (!(me instanceof IDBTransaction)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('No object store name was specified');
  }
  IDBTransaction.__assertNotFinished(me);
  if (me.__objectStoreNames.indexOf(objectStoreName) === -1) {
    // eslint-disable-line unicorn/prefer-includes -- Not supported
    throw createDOMException('NotFoundError', objectStoreName + ' is not participating in this transaction');
  }
  const store = me.db.__objectStores[objectStoreName];
  if (!store) {
    throw createDOMException('NotFoundError', objectStoreName + ' does not exist in ' + me.db.name);
  }
  if (!Object.hasOwn(me.__storeHandles, objectStoreName) ||
  // These latter conditions are to allow store
  //   recreation to create new clone object
  me.__storeHandles[objectStoreName].__pendingDelete || me.__storeHandles[objectStoreName].__deleted) {
    me.__storeHandles[objectStoreName] = IDBObjectStore.__clone(store, me);
  }
  return me.__storeHandles[objectStoreName];
};

/**
 *
 * @param {Error|DOMException|null} err
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.__abortTransaction = function (err) {
  const me = this;
  logError('Error', 'An error occurred in a transaction', err);
  if (me.__errored) {
    // We've already called "onerror", "onabort", or thrown, so don't do it again.
    return;
  }
  me.__errored = true;
  if (me.mode === 'versionchange') {
    // Steps for aborting an upgrade transaction
    me.db.__version = me.db.__oldVersion;
    me.db.__objectStoreNames = me.db.__oldObjectStoreNames;
    me.__objectStoreNames = me.db.__oldObjectStoreNames;
    Object.values(me.db.__objectStores).concat(Object.values(me.__storeHandles)).forEach(function (store) {
      // Store was already created so we restore to name before the rename
      if ('__pendingName' in store && me.db.__oldObjectStoreNames.indexOf(store.__pendingName) > -1 // eslint-disable-line unicorn/prefer-includes -- Not supported
      ) {
        store.__name = store.__originalName;
      }
      store.__indexNames = store.__oldIndexNames;
      delete store.__pendingDelete;
      Object.values(store.__indexes).concat(Object.values(store.__indexHandles)).forEach(function (index) {
        // Index was already created so we restore to name before the rename
        if ('__pendingName' in index && store.__oldIndexNames.indexOf(index.__pendingName) > -1 // eslint-disable-line unicorn/prefer-includes -- Not supported
        ) {
          index.__name = index.__originalName;
        }
        delete index.__pendingDelete;
      });
    });
  }
  me.__active = false; // Setting here and in requestsFinished for https://github.com/w3c/IndexedDB/issues/87

  if (err !== null) {
    me.__error = err;
  }
  if (me.__requestsFinished) {
    // The transaction has already completed, so we can't call "onerror" or "onabort".
    // So throw the error instead.
    setTimeout(() => {
      throw err;
    }, 0);
  }

  /**
   * @param {SQLTransaction|null} [tx]
   * @param {SQLResultSet|SQLError|{code: 0}} [errOrResult]
   * @returns {void}
   */
  function abort(tx, errOrResult) {
    if (!tx) {
      if (CFG.DEBUG) {
        console.log('Rollback not possible due to missing transaction', me);
      }
    } else if (errOrResult && 'code' in errOrResult && typeof errOrResult.code === 'number') {
      if (CFG.DEBUG) {
        console.log('Rollback erred; feature is probably not supported as per WebSQL', me);
      }
    } else if (CFG.DEBUG) {
      console.log('Rollback succeeded', me);
    }
    me.dispatchEvent(createEvent('__preabort'));
    me.__requests.filter(function (q, i, arr) {
      // eslint-disable-line promise/no-promise-in-callback -- Sync promise
      return q.req && !q.req.__done && [i, -1].includes(arr.map(q => q.req).lastIndexOf(q.req));
    }).reduce(function (promises, q) {
      // We reduce to a chain of promises to be queued in order, so we cannot
      //  use `Promise.all`, and I'm unsure whether `setTimeout` currently
      //  behaves first-in-first-out with the same timeout so we could
      //  just use a `forEach`.
      return promises.then(function () {
        if (!q.req) {
          // TS guard
          throw new Error('Missing request');
        }
        q.req.__done = true;
        q.req.__result = undefined;
        q.req.__error = createDOMException('AbortError', 'A request was aborted (an unfinished request).');
        const reqEvt = createEvent('error', q.req.__error, {
          bubbles: true,
          cancelable: true
        });
        return new SyncPromise(/** @type {() => void} */
        resolve => {
          setTimeout(() => {
            if (!q.req) {
              // TS guard
              throw new Error('Missing request');
            }
            q.req.dispatchEvent(reqEvt); // No need to catch errors
            resolve();
          }, 0);
        });
      });
    }, SyncPromise.resolve(undefined)).then(function () {
      // Also works when there are no pending requests
      const evt = createEvent('abort', err, {
        bubbles: true,
        cancelable: false
      });
      setTimeout(() => {
        me.__abortFinished = true;
        me.dispatchEvent(evt);
        me.__storeHandles = {};
        me.dispatchEvent(createEvent('__abort'));
      }, 0);
      return undefined;
    }).catch(err => {
      console.log('Abort error');
      throw err;
    });
  }
  me.__transFinishedCb(true, function (rollback) {
    if (rollback && me.__tx) {
      // Not supported in standard SQL (and WebSQL errors should
      //   rollback automatically), but for Node.js, etc., we give chance for
      //   manual aborts which would otherwise not work.
      if (me.mode === 'readwrite') {
        if (me.__transactionFinished) {
          abort();
          return;
        }
        me.__transactionEndCallback = abort;
        return;
      }
      try {
        me.__tx.executeSql('ROLLBACK', [], abort, /** @type {SQLStatementErrorCallback} */abort); // Not working in some circumstances, even in Node
      } catch (err) {
        // Browser errs when transaction has ended and since it most likely already erred here,
        //   we call to abort
        abort();
      }
    } else {
      abort(null, {
        code: 0
      });
    }
  });
};

/**
 * @this {IDBTransactionFull}
 * @returns {void}
 */
IDBTransaction.prototype.abort = function () {
  const me = this;
  if (!(me instanceof IDBTransaction)) {
    throw new TypeError('Illegal invocation');
  }
  if (CFG.DEBUG) {
    console.log('The transaction was aborted', me);
  }
  IDBTransaction.__assertNotFinished(me);
  me.__abortTransaction(null);
};
IDBTransaction.prototype[Symbol.toStringTag] = 'IDBTransactionPrototype';

/**
 *
 * @param {IDBTransactionFull|undefined} tx
 * @returns {void}
 */
IDBTransaction.__assertVersionChange = function (tx) {
  if (!tx || tx.mode !== 'versionchange') {
    throw createDOMException('InvalidStateError', 'Not a version transaction');
  }
};
/**
 *
 * @param {IDBTransactionFull} tx
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.__assertNotVersionChange = function (tx) {
  if (tx && tx.mode === 'versionchange') {
    throw createDOMException('InvalidStateError', 'Cannot be called during a version transaction');
  }
};

/**
 *
 * @param {IDBTransactionFull|undefined} tx
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.__assertNotFinished = function (tx) {
  if (!tx || tx.__completed || tx.__abortFinished || tx.__errored) {
    throw createDOMException('InvalidStateError', 'Transaction finished by commit or abort');
  }
};

// object store methods behave differently: see https://github.com/w3c/IndexedDB/issues/192
/**
 *
 * @param {IDBTransactionFull} tx
 * @returns {void}
 */
IDBTransaction.__assertNotFinishedObjectStoreMethod = function (tx) {
  try {
    IDBTransaction.__assertNotFinished(tx);
  } catch (err) {
    if (tx && !tx.__completed && !tx.__abortFinished) {
      throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
    throw err;
  }
};

/**
 *
 * @param {IDBTransactionFull|undefined} tx
 * @throws {DOMException}
 * @returns {void}
 */
IDBTransaction.__assertActive = function (tx) {
  if (!tx || !tx.__active) {
    throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
  }
};

/**
 * Used by our `EventTarget.prototype` library to implement bubbling/capturing.
 * @this {IDBTransactionFull}
 * @returns {import('./IDBDatabase.js').IDBDatabaseFull}
 */
IDBTransaction.prototype.__getParent = function () {
  return this.db;
};

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
defineOuterInterface(IDBTransaction.prototype, listeners$1);
defineReadonlyOuterInterface(IDBTransaction.prototype, readonlyProperties$3);
Object.defineProperty(IDBTransaction.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: IDBTransaction
});
Object.defineProperty(IDBTransaction, 'prototype', {
  writable: false
});

class TypesonPromise {
  constructor(e) {
    this.p = new Promise(e);
  }
}
TypesonPromise.__typeson__type__ = "TypesonPromise", "undefined" != typeof Symbol && Object.defineProperty(TypesonPromise.prototype, Symbol.toStringTag, {
  get: () => "TypesonPromise"
}), TypesonPromise.prototype.then = function (e, t) {
  return new TypesonPromise((r, n) => {
    this.p.then(function (t) {
      r(e ? e(t) : t);
    }).catch(function (e) {
      return t ? t(e) : Promise.reject(e);
    }).then(r, n);
  });
}, TypesonPromise.prototype.catch = function (e) {
  return this.then(void 0, e);
}, TypesonPromise.resolve = function (e) {
  return new TypesonPromise(t => {
    t(e);
  });
}, TypesonPromise.reject = function (e) {
  return new TypesonPromise((t, r) => {
    r(e);
  });
}, TypesonPromise.all = function (e) {
  return new TypesonPromise(function (t, r) {
    Promise.all(e.map(e => e?.constructor && "__typeson__type__" in e.constructor && "TypesonPromise" === e.constructor.__typeson__type__ ? e.p : e)).then(t, r);
  });
}, TypesonPromise.race = function (e) {
  return new TypesonPromise(function (t, r) {
    Promise.race(e.map(e => e?.constructor && "__typeson__type__" in e.constructor && "TypesonPromise" === e.constructor.__typeson__type__ ? e.p : e)).then(t, r);
  });
}, TypesonPromise.allSettled = function (e) {
  return new TypesonPromise(function (t, r) {
    Promise.allSettled(e.map(e => e?.constructor && "__typeson__type__" in e.constructor && "TypesonPromise" === e.constructor.__typeson__type__ ? e.p : e)).then(t, r);
  });
};
const {
    hasOwn: e
  } = Object,
  t = Object.getPrototypeOf;
function isThenable(e, t) {
  return isObject(e) && "function" == typeof e.then && (true || "function" == typeof e.catch);
}
function toStringTag(e) {
  return Object.prototype.toString.call(e).slice(8, -1);
}
function hasConstructorOf(r, n) {
  if (!r || "object" != typeof r) return false;
  const o = t(r);
  if (!o) return null === n;
  const s = e(o, "constructor") && o.constructor;
  return "function" != typeof s ? null === n : n === s || null !== n && Function.prototype.toString.call(s) === Function.prototype.toString.call(n) || "function" == typeof n && "string" == typeof s.__typeson__type__ && s.__typeson__type__ === n.__typeson__type__;
}
function isPlainObject(e) {
  return !(!e || "Object" !== toStringTag(e)) && (!t(e) || hasConstructorOf(e, Object));
}
function isUserObject(e) {
  if (!e || "Object" !== toStringTag(e)) return false;
  const r = t(e);
  return !r || hasConstructorOf(e, Object) || isUserObject(r);
}
function isObject(e) {
  return null !== e && "object" == typeof e;
}
function escapeKeyPathComponent(e) {
  return e.replaceAll("''", "''''").replace(/^$/u, "''").replaceAll("~", "~0").replaceAll(".", "~1");
}
function unescapeKeyPathComponent(e) {
  return e.replaceAll("~1", ".").replaceAll("~0", "~").replace(/^''$/u, "").replaceAll("''''", "''");
}
function getByKeyPath(t, r, n) {
  if ("" === r) return t;
  if (null === t || "object" != typeof t) throw new TypeError("Unexpected non-object type");
  const o = r.indexOf("."),
    s = unescapeKeyPathComponent(-1 === o ? r : r.slice(0, o));
  if (e(t, s)) {
    if (-1 !== o) {
      const e = t[s];
      return void 0 === e ? void 0 : getByKeyPath(e, r.slice(o + 1));
    }
    return t[s];
  }
}
function setAtKeyPath(t, r, n, o) {
  if ("" === r) return n;
  let s = t,
    a = r;
  for (;;) {
    if (!s || "object" != typeof s) throw new TypeError("Unexpected non-object type");
    const r = a.indexOf("."),
      i = unescapeKeyPathComponent(-1 === r ? a : a.slice(0, r));
    if ("__proto__" === i) throw new TypeError("Invalid property");
    if (-1 === r) return s[i] = n, t;
    if (!e(s, i)) throw new TypeError("Invalid property");
    s = s[i], a = a.slice(r + 1);
  }
}
function getJSONType(e) {
  return null === e ? "null" : Array.isArray(e) ? "array" : typeof e;
}
/**
 * @file Typeson - JSON with types.
 * @license The MIT License (MIT)
 * @copyright (c) 2016-2018 David Fahlander, Brett Zamir
 */
const {
    keys: r,
    hasOwn: n
  } = Object,
  {
    isArray: o
  } = Array,
  s = ["type", "replaced", "iterateIn", "iterateUnsetNumeric", "addLength"];
function setOwnEnumerable(e, t, r) {
  Object.defineProperty(e, t, {
    configurable: true,
    enumerable: true,
    value: r,
    writable: true
  });
}
function nestedPathsFirst(e, t) {
  if ("" === e.keypath) return -1;
  let r = e.keypath.match(/\./gu) ?? 0,
    n = t.keypath.match(/\./gu) ?? 0;
  return r && (r = r.length), n && (n = n.length), r > n ? -1 : r < n ? 1 : e.keypath < t.keypath ? -1 : e.keypath > t.keypath ? 1 : 0;
}
class Typeson {
  constructor(e) {
    this.options = e, this.plainObjectReplacers = [], this.nonplainObjectReplacers = [], this.revivers = {}, this.types = {};
  }
  stringify(e, t, r, n) {
    n = {
      ...this.options,
      ...n,
      stringification: true
    };
    const s = this.encapsulate(e, null, n);
    return o(s) ? JSON.stringify(s[0], t, r) : s.then(e => JSON.stringify(e, t, r));
  }
  stringifySync(e, t, r, n) {
    return this.stringify(e, t, r, {
      throwOnBadSyncType: true,
      ...n,
      sync: true
    });
  }
  stringifyAsync(e, t, r, n) {
    return this.stringify(e, t, r, {
      throwOnBadSyncType: true,
      ...n,
      sync: false
    });
  }
  parse(e, t, r) {
    return r = {
      ...this.options,
      ...r,
      parse: true
    }, this.revive(JSON.parse(e, t), r);
  }
  parseSync(e, t, r) {
    return this.parse(e, t, {
      throwOnBadSyncType: true,
      ...r,
      sync: true
    });
  }
  parseAsync(e, t, r) {
    return this.parse(e, t, {
      throwOnBadSyncType: true,
      ...r,
      sync: false
    });
  }
  specialTypeNames(e, t, r = {}) {
    return this.encapsulate(e, t, {
      ...r,
      returnTypeNames: true
    });
  }
  rootTypeName(e, t, r = {}) {
    return this.encapsulate(e, t, {
      ...r,
      iterateNone: true
    });
  }
  encapsulate(e, t, a) {
    const i = {
        sync: true,
        ...this.options,
        ...a
      },
      {
        sync: c
      } = i,
      y = {},
      u = [],
      l = [],
      p = [],
      f = !("cyclic" in i) || i.cyclic,
      {
        encapsulateObserver: d,
        encapsulateError: m
      } = i,
      finish = e => {
        const t = Object.values(y);
        if (i.iterateNone) return t.length ? t[0] : getJSONType(e);
        if (t.length) {
          if (i.returnTypeNames) return [...new Set(t)];
          e && isPlainObject(e) && !n(e, "$types") ? e.$types = y : e = {
            $: e,
            $types: {
              $: y
            }
          };
        } else isObject(e) && n(e, "$types") && (e = {
          $: e,
          $types: true
        });
        return !i.returnTypeNames && e;
      },
      checkPromises = async (e, t) => {
        const r = await Promise.all(t.map(e => e[1].p));
        return await Promise.all(r.map(async function (r) {
          const n = [],
            [o] = t.splice(0, 1),
            [s,, a, i, c, y, u] = o,
            l = _encapsulate(s, r, a, i, n, true, u),
            p = hasConstructorOf(l, TypesonPromise);
          return s && p ? (setOwnEnumerable(c, y, await l.p), checkPromises(e, n)) : (s ? setOwnEnumerable(c, y, l) : e = p ? l.p : l, checkPromises(e, n));
        })), e;
      },
      _adaptBuiltinStateObjectProperties = (e, t, r) => {
        Object.assign(e, t);
        const n = s.map(t => {
          const r = e[t];
          return delete e[t], r;
        });
        r(), s.forEach((t, r) => {
          e[t] = n[r];
        });
      },
      _encapsulate = (e, t, s, a, c, p, f) => {
        let h,
          g = {};
        const b = d ? function (r) {
            const n = f ?? a.type ?? getJSONType(t);
            d(Object.assign(r ?? g, {
              keypath: e,
              value: t,
              cyclic: s,
              stateObj: a,
              promisesData: c,
              resolvingTypesonPromise: p,
              awaitingTypesonPromise: hasConstructorOf(t, TypesonPromise)
            }, {
              type: n
            }));
          } : null,
          getEncapsulatedValue = (e, t, r) => {
            try {
              return {
                value: _encapsulate(e, t[r], Boolean(s), a, c, p)
              };
            } catch (n) {
              if (!m) throw n;
              const o = f ?? a.type ?? getJSONType(t),
                s = m({
                  keypath: e,
                  error: n,
                  parent: t,
                  key: r,
                  stateObj: a,
                  type: o
                });
              if (!s) throw n;
              if ("substitute" in s) return {
                value: s.substitute,
                substitute: true
              };
              if (s.ignore) return;
              throw n;
            }
          };
        if (["string", "boolean", "number", "undefined"].includes(typeof t)) return void 0 === t || t === 1 / 0 || 0 === t || t === -1 / 0 || Number.isNaN(t) ? (h = a.replaced ? t : replace(e, t, a, c, false, p, b), h !== t && (g = {
          replaced: h
        })) : h = t, b && b(), h;
        if (null === t) return b && b(), t;
        if (s && t && "object" == typeof t && !a.iterateIn && !a.iterateUnsetNumeric) {
          const r = u.indexOf(t);
          if (-1 !== r) return y[e] = "#", b && b({
            cyclicKeypath: l[r]
          }), "#" + l[r];
          true === s && (u.push(t), l.push(e));
        }
        const v = isPlainObject(t),
          O = o(t),
          w = (v || O) && (!this.plainObjectReplacers.length || a.replaced) || a.iterateIn ? t : replace(e, t, a, c, v || O, null, b);
        let T;
        if (w !== t ? (h = w, g = {
          replaced: w
        }) : "" === e && hasConstructorOf(t, TypesonPromise) ? (c.push([e, t, s, a, void 0, void 0, a.type]), h = t) : O && "object" !== a.iterateIn || "array" === a.iterateIn ? (T = new Array(t.length), g = {
          clone: T
        }) : !v && ("object" != typeof t || "toJSON" in t || hasConstructorOf(t, TypesonPromise) || hasConstructorOf(t, Promise) || hasConstructorOf(t, ArrayBuffer)) && "object" !== a.iterateIn ? h = t : (T = {}, a.addLength && (T.length = t.length), g = {
          clone: T
        }), b && b(), i.iterateNone) return T ?? h;
        if (!T) return h;
        if (a.iterateIn) {
          for (const r in t) {
            const o = {
              ownKeys: n(t, r)
            };
            _adaptBuiltinStateObjectProperties(a, o, () => {
              const n = e + (e ? "." : "") + escapeKeyPathComponent(r),
                o = getEncapsulatedValue(n, t, r),
                i = o && o.value;
              hasConstructorOf(i, TypesonPromise) ? c.push([n, i, Boolean(s), a, T, r, a.type]) : o && (void 0 !== i || "substitute" in o) && setOwnEnumerable(T, r, i);
            });
          }
          b && b({
            endIterateIn: true,
            end: true
          });
        } else r(t).forEach(function (r) {
          const n = e + (e ? "." : "") + escapeKeyPathComponent(r);
          _adaptBuiltinStateObjectProperties(a, {
            ownKeys: true
          }, () => {
            const e = getEncapsulatedValue(n, t, r),
              o = e && e.value;
            hasConstructorOf(o, TypesonPromise) ? c.push([n, o, Boolean(s), a, T, r, a.type]) : e && (void 0 !== o || "substitute" in e) && setOwnEnumerable(T, r, o);
          });
        }), b && b({
          endIterateOwn: true,
          end: true
        });
        if (a.iterateUnsetNumeric) {
          const r = t.length;
          for (let n = 0; n < r; n++) {
            if (n in t) continue;
            const r = `${e}${e ? "." : ""}${String(n)}`;
            _adaptBuiltinStateObjectProperties(a, {
              ownKeys: false
            }, () => {
              const e = _encapsulate(r, void 0, Boolean(s), a, c, p);
              hasConstructorOf(e, TypesonPromise) ? c.push([r, e, Boolean(s), a, T, n, a.type]) : void 0 !== e && setOwnEnumerable(T, n, e);
            });
          }
          b && b({
            endIterateUnsetNumeric: true,
            end: true
          });
        }
        return T;
      },
      replace = (e, t, r, n, o, s, a) => {
        const i = o ? this.plainObjectReplacers : this.nonplainObjectReplacers;
        let u = i.length;
        for (; u--;) {
          const o = i[u];
          if (o.test(t, r)) {
            const {
              type: i
            } = o;
            if (Object.hasOwn(this.revivers, i)) {
              const t = y[e];
              y[e] = t ? [i].concat(t) : i;
            }
            if (Object.assign(r, {
              type: i,
              replaced: true
            }), (c || !o.replaceAsync) && !o.replace) return a && a({
              typeDetected: true
            }), _encapsulate(e, t, f && "readonly", r, n, s, i);
            let u;
            if (a && a({
              replacing: true
            }), c || !o.replaceAsync) {
              if (void 0 === o.replace) throw new TypeError("Missing replacer");
              u = o.replace(t, r);
            } else u = o.replaceAsync(t, r);
            return _encapsulate(e, u, f && "readonly", r, n, s, i);
          }
        }
        return t;
      },
      h = _encapsulate("", e, f, t ?? {}, p);
    if (p.length) return c && i.throwOnBadSyncType ? (() => {
      throw new TypeError("Sync method requested but async result obtained");
    })() : Promise.resolve(checkPromises(h, p)).then(finish);
    if (!c && i.throwOnBadSyncType) throw new TypeError("Async method requested but sync result obtained");
    return c && i.stringification ? [finish(h)] : c ? finish(h) : Promise.resolve(finish(h));
  }
  encapsulateSync(e, t, r) {
    return this.encapsulate(e, t, {
      throwOnBadSyncType: true,
      ...r,
      sync: true
    });
  }
  encapsulateAsync(e, t, r) {
    return this.encapsulate(e, t, {
      throwOnBadSyncType: true,
      ...r,
      sync: false
    });
  }
  revive(e, t) {
    const s = {
        sync: true,
        ...this.options,
        ...t
      },
      {
        sync: a
      } = s;
    function finishRevival(e) {
      if (a) return e;
      if (s.throwOnBadSyncType) throw new TypeError("Async method requested but sync result obtained");
      return Promise.resolve(e);
    }
    if (!e || "object" != typeof e || Array.isArray(e)) return finishRevival(e);
    let i = e.$types;
    if (true === i) return finishRevival(e.$);
    if (!i || "object" != typeof i || Array.isArray(i)) return finishRevival(e);
    const c = [],
      y = Object.create(null),
      u = {};
    let l = true;
    i.$ && isPlainObject(i.$) && (e = e.$, i = i.$, l = false);
    const executeReviver = (e, t) => {
        const [r] = this.revivers[e] ?? [];
        if (!r) throw new Error("Unregistered type: " + e);
        if (a && !("revive" in r)) return t;
        if (!a && r.reviveAsync) return r.reviveAsync(t, u);
        if (r.revive) return r.revive(t, u);
        throw new Error("Missing reviver");
      },
      p = [];
    function checkUndefined(e) {
      return hasConstructorOf(e, Undefined) ? void 0 : e;
    }
    const f = (() => {
      if (!i) throw new Error("Found bad `types`");
      const t = [];
      if (Object.entries(i).forEach(([e, r]) => {
        "#" !== r && [].concat(r).forEach(r => {
          const [, {
            plain: n
          }] = this.revivers[r] ?? [null, {}];
          n && (t.push({
            keypath: e,
            type: r
          }), delete i[e]);
        });
      }), t.length) return t.sort(nestedPathsFirst), t.reduce(function reducer(t, {
        keypath: r,
        type: n
      }) {
        if (isThenable(t)) return t.then(e => reducer(e, {
          keypath: r,
          type: n
        }));
        let o = getByKeyPath(e, r);
        if (o = executeReviver(n, o), hasConstructorOf(o, TypesonPromise)) return o.then(t => {
          const n = setAtKeyPath(e, r, t);
          n === t && (e = n);
        });
        const s = setAtKeyPath(e, r, o);
        s === o && (e = s);
      }, void 0);
    })();
    let d;
    return hasConstructorOf(f, TypesonPromise) ? d = f.then(() => e) : (d = function _revive(e, t, s, u, f) {
      if (l && "$types" === e) return;
      const d = p.length,
        m = n(i, e) ? i[e] : void 0,
        h = o(t);
      if (h || isPlainObject(t)) {
        const o = h ? new Array(t.length) : {};
        for (r(t).forEach(r => {
          const n = _revive(e + (e ? "." : "") + escapeKeyPathComponent(r), t[r], s ?? o, o, r),
            set = e => (hasConstructorOf(e, Undefined) ? setOwnEnumerable(o, r, void 0) : void 0 !== e && setOwnEnumerable(o, r, e), e);
          hasConstructorOf(n, TypesonPromise) ? p.push(n.then(e => set(e))) : set(n);
        }), t = o; c.length;) {
          const [[e, t, r, o]] = c,
            s = n(y, t),
            a = s ? y[t] : getByKeyPath(e, t);
          if (!s && void 0 === a) break;
          setOwnEnumerable(r, o, a), c.shift();
        }
      }
      if (!m) return y[e] = t, t;
      if ("#" === m) {
        const e = t.slice(1),
          r = n(y, e),
          o = r ? y[e] : getByKeyPath(s, e);
        return r || void 0 !== o || c.push([s, e, u, f]), o;
      }
      const applyType = t => {
        const r = [].concat(m).reduce(function reducer(e, t) {
          if (hasConstructorOf(e, TypesonPromise)) return e.then(e => reducer(e, t));
          if ("string" != typeof t) throw new TypeError("Bad type JSON");
          return executeReviver(t, e);
        }, t);
        return hasConstructorOf(r, TypesonPromise) ? r.then(t => (y[e] = t, t)) : (y[e] = r, r);
      };
      return !a && p.length > d ? TypesonPromise.all(p.slice(d)).then(() => applyType(t)) : applyType(t);
    }("", e, null), p.length && (d = TypesonPromise.resolve(d).then(e => TypesonPromise.all([e, ...p])).then(([e]) => e))), isThenable(d) ? a && s.throwOnBadSyncType ? (() => {
      throw new TypeError("Sync method requested but async result obtained");
    })() : hasConstructorOf(d, TypesonPromise) ? d.p.then(checkUndefined) : d : !a && s.throwOnBadSyncType ? (() => {
      throw new TypeError("Async method requested but sync result obtained");
    })() : a ? checkUndefined(d) : Promise.resolve(checkUndefined(d));
  }
  reviveSync(e, t) {
    return this.revive(e, {
      throwOnBadSyncType: true,
      ...t,
      sync: true
    });
  }
  reviveAsync(e, t) {
    return this.revive(e, {
      throwOnBadSyncType: true,
      ...t,
      sync: false
    });
  }
  register(e, t) {
    const n = t ?? {},
      reg = e => {
        o(e) ? e.forEach(e => {
          reg(e);
        }) : r(e).forEach(t => {
          if ("#" === t) throw new TypeError("# cannot be used as a type name as it is reserved for cyclic objects");
          if (a.includes(t)) throw new TypeError("Plain JSON object types are reserved as type names");
          let r = e[t];
          if ([this.plainObjectReplacers, this.nonplainObjectReplacers].forEach(e => {
            const r = e.findIndex(e => e.type === t);
            -1 !== r && e.splice(r, 1);
          }), delete this.revivers[t], delete this.types[t], "function" == typeof r) {
            const e = r;
            r = {
              test: t => t && t.constructor === e,
              replace: e => ({
                ...e
              }),
              revive: t => Object.assign(Object.create(e.prototype), t)
            };
          } else if (o(r)) {
            const [e, t, n] = r;
            r = {
              test: e,
              replace: t,
              revive: n
            };
          }
          if (!r?.test) return;
          const s = {
            type: t,
            test: r.test.bind(r)
          };
          r.replace && (s.replace = r.replace.bind(r)), r.replaceAsync && (s.replaceAsync = r.replaceAsync.bind(r));
          const i = "number" == typeof n.fallback ? n.fallback : n.fallback ? 0 : 1 / 0;
          if (r.testPlainObjects ? this.plainObjectReplacers.splice(i, 0, s) : this.nonplainObjectReplacers.splice(i, 0, s), r.revive || r.reviveAsync) {
            const e = {};
            r.revive && (e.revive = r.revive.bind(r)), r.reviveAsync && (e.reviveAsync = r.reviveAsync.bind(r)), this.revivers[t] = [e, {
              plain: r.testPlainObjects
            }];
          }
          this.types[t] = r;
        });
      };
    return [].concat(e).forEach(e => {
      reg(e);
    }), this;
  }
}
class Undefined {}
Undefined.__typeson__type__ = "TypesonUndefined";
const a = ["null", "boolean", "number", "string", "array", "object"];
for (var i = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", c = new Uint8Array(256), y = 0; y < 64; y++) c[i.codePointAt(y)] = y;
var u = function encode(e, t, r) {
    null == r && (r = e.byteLength);
    for (var n = new Uint8Array(e, 0, r), o = n.length, s = "", a = 0; a < o; a += 3) s += i[n[a] >> 2], s += i[(3 & n[a]) << 4 | n[a + 1] >> 4], s += i[(15 & n[a + 1]) << 2 | n[a + 2] >> 6], s += i[63 & n[a + 2]];
    return o % 3 == 2 ? s = s.slice(0, -1) + "=" : o % 3 == 1 && (s = s.slice(0, -2) + "=="), s;
  },
  l = function decode(e, t) {
    var r = e.length;
    if (r % 4) throw new Error("Bad base64 length: not divisible by four");
    var n,
      o,
      s,
      a,
      i = .75 * e.length,
      y = 0;
    "=" === e[e.length - 1] && (i--, "=" === e[e.length - 2] && i--);
    for (var u = new ArrayBuffer(i, t), l = new Uint8Array(u), p = 0; p < r; p += 4) n = c[e.codePointAt(p)], o = c[e.codePointAt(p + 1)], s = c[e.codePointAt(p + 2)], a = c[e.codePointAt(p + 3)], l[y++] = n << 2 | o >> 4, l[y++] = (15 & o) << 4 | s >> 2, l[y++] = (3 & s) << 6 | 63 & a;
    return u;
  };
const p = {
    arraybuffer: {
      test: e => "ArrayBuffer" === toStringTag(e),
      replace(e, t) {
        t.buffers || (t.buffers = []);
        const r = t.buffers.indexOf(e);
        return -1 !== r ? {
          index: r
        } : (t.buffers.push(e), {
          s: u(e),
          maxByteLength: e.maxByteLength,
          resizable: e.resizable
        });
      },
      revive(e, t) {
        if (t.buffers || (t.buffers = []), Object.hasOwn(e, "index")) return t.buffers[e.index];
        const r = l(e.s, e.resizable ? {
          maxByteLength: e.maxByteLength
        } : void 0);
        return t.buffers.push(r), r;
      }
    }
  },
  f = {
    bigintObject: {
      test: e => "object" == typeof e && hasConstructorOf(e, BigInt),
      replace: String,
      revive: e => new Object(BigInt(e))
    }
  },
  d = {
    bigint: {
      test: e => "bigint" == typeof e,
      replace: String,
      revive: e => BigInt(e)
    }
  };
function arraybuffer2string(e) {
  return new Uint8Array(e).reduce((e, t) => e + String.fromCodePoint(t), "");
}
function string2arraybuffer(e) {
  const t = new Uint8Array(e.length);
  for (let r = 0; r < e.length; r++) t[r] = e.charCodeAt(r);
  return t.buffer;
}
const m = {
  blob: {
    test: e => "Blob" === toStringTag(e),
    replace(e) {
      const t = new XMLHttpRequest();
      if (t.overrideMimeType("text/plain; charset=x-user-defined"), t.open("GET", URL.createObjectURL(e), false), t.send(), 200 !== t.status && 0 !== t.status) throw new Error("Bad Blob access: " + t.status);
      return {
        type: e.type,
        stringContents: t.responseText
      };
    },
    revive(e) {
      const {
        type: t,
        stringContents: r
      } = e;
      return new Blob([string2arraybuffer(r)], {
        type: t
      });
    },
    replaceAsync: e => new TypesonPromise((t, r) => {
      const n = new FileReader();
      n.addEventListener("load", () => {
        t({
          type: e.type,
          stringContents: arraybuffer2string(n.result)
        });
      }), n.addEventListener("error", () => {
        r(n.error);
      }), n.readAsArrayBuffer(e);
    })
  }
};
const b = {
    cryptokey: {
      test: e => "CryptoKey" === toStringTag(e) && e.extractable,
      replaceAsync: e => new TypesonPromise(async (t, r) => {
        let n;
        try {
          n = await crypto.subtle.exportKey("jwk", e);
        } catch (e) {
          return void r(e);
        }
        t({
          jwk: n,
          algorithm: e.algorithm,
          usages: e.usages
        });
      }),
      revive(e) {
        const {
          jwk: t,
          algorithm: r,
          usages: n
        } = e;
        return crypto.subtle.importKey("jwk", t, r, true, n);
      }
    }
  },
  v = {
    dataview: {
      test: e => "DataView" === toStringTag(e),
      replace({
        buffer: e,
        byteOffset: t,
        byteLength: r
      }, n) {
        n.buffers || (n.buffers = []);
        const o = n.buffers.indexOf(e);
        return -1 !== o ? {
          index: o,
          byteOffset: t,
          byteLength: r
        } : (n.buffers.push(e), {
          encoded: u(e),
          maxByteLength: e.maxByteLength,
          resizable: e.resizable,
          byteOffset: t,
          byteLength: r
        });
      },
      revive(e, t) {
        t.buffers || (t.buffers = []);
        const {
          byteOffset: r,
          byteLength: n,
          encoded: o,
          index: s,
          maxByteLength: a,
          resizable: i
        } = e;
        let c;
        return "index" in e ? c = t.buffers[s] : (c = l(o, i ? {
          maxByteLength: a
        } : a), t.buffers.push(c)), new DataView(c, r, n);
      }
    }
  },
  O = {
    date: {
      test: e => "Date" === toStringTag(e),
      replace(e) {
        const t = e.getTime();
        return Number.isNaN(t) ? "NaN" : t;
      },
      revive: e => "NaN" === e ? new Date(NaN) : new Date(e)
    }
  },
  w = {
    domexception: {
      test: e => "DOMException" === toStringTag(e),
      replace: e => ({
        name: e.name,
        message: e.message
      }),
      revive: ({
        message: e,
        name: t
      }) => new DOMException(e, t)
    }
  },
  T = {};
function create$5(e) {
  T[e.name.toLowerCase()] = {
    test: t => toStringTag(t) === e.name,
    replace: e => e.is2D ? {
      a: e.a,
      b: e.b,
      c: e.c,
      d: e.d,
      e: e.e,
      f: e.f
    } : {
      m11: e.m11,
      m12: e.m12,
      m13: e.m13,
      m14: e.m14,
      m21: e.m21,
      m22: e.m22,
      m23: e.m23,
      m24: e.m24,
      m31: e.m31,
      m32: e.m32,
      m33: e.m33,
      m34: e.m34,
      m41: e.m41,
      m42: e.m42,
      m43: e.m43,
      m44: e.m44
    },
    revive: t => Object.hasOwn(t, "a") ? new e([t.a, t.b, t.c, t.d, t.e, t.f]) : new e([t.m11, t.m12, t.m13, t.m14, t.m21, t.m22, t.m23, t.m24, t.m31, t.m32, t.m33, t.m34, t.m41, t.m42, t.m43, t.m44])
  };
}
"undefined" != typeof DOMMatrix && create$5(DOMMatrix), "undefined" != typeof DOMMatrixReadOnly && create$5(DOMMatrixReadOnly);
const A = {};
function create$4(e) {
  A[e.name.toLowerCase()] = {
    test: t => toStringTag(t) === e.name,
    replace: e => ({
      x: e.x,
      y: e.y,
      z: e.z,
      w: e.w
    }),
    revive: ({
      x: t,
      y: r,
      z: n,
      w: o
    }) => new e(t, r, n, o)
  };
}
"undefined" != typeof DOMPoint && create$4(DOMPoint), "undefined" != typeof DOMPointReadOnly && create$4(DOMPointReadOnly);
const P = {
    domquad: {
      test: e => "DOMQuad" === toStringTag(e),
      replace: e => ({
        p1: e.p1,
        p2: e.p2,
        p3: e.p3,
        p4: e.p4
      }),
      revive: ({
        p1: e,
        p2: t,
        p3: r,
        p4: n
      }) => new DOMQuad(e, t, r, n)
    }
  },
  S = {};
function create$3(e) {
  S[e.name.toLowerCase()] = {
    test: t => toStringTag(t) === e.name,
    replace: e => ({
      x: e.x,
      y: e.y,
      width: e.width,
      height: e.height
    }),
    revive: ({
      x: t,
      y: r,
      width: n,
      height: o
    }) => new e(t, r, n, o)
  };
}
"undefined" != typeof DOMRect && create$3(DOMRect), "undefined" != typeof DOMRectReadOnly && create$3(DOMRectReadOnly);
const x = {
    error: {
      test: e => "Error" === toStringTag(e),
      replace: ({
        name: e,
        message: t,
        cause: r,
        stack: n,
        fileName: o,
        lineNumber: s,
        columnNumber: a
      }) => ({
        name: e,
        message: t,
        cause: r,
        stack: n,
        fileName: o,
        lineNumber: s,
        columnNumber: a
      }),
      revive(e) {
        const t = new Error(e.message);
        return t.name = e.name, t.cause = e.cause, t.stack = e.stack, t.fileName = e.fileName, t.lineNumber = e.lineNumber, t.columnNumber = e.columnNumber, t;
      }
    }
  },
  j = {};
function create$2(e) {
  j[e.name.toLowerCase()] = {
    test: t => hasConstructorOf(t, e),
    replace: ({
      name: e,
      message: t,
      cause: r,
      stack: n,
      fileName: o,
      lineNumber: s,
      columnNumber: a,
      errors: i
    }) => ({
      name: e,
      message: t,
      cause: r,
      stack: n,
      fileName: o,
      lineNumber: s,
      columnNumber: a,
      errors: i
    }),
    revive(t) {
      const r = "undefined" != typeof AggregateError && e === AggregateError ? new e(t.errors, t.message) : new e(t.message);
      return r.name = t.name, r.cause = t.cause, r.stack = t.stack, r.fileName = t.fileName, r.lineNumber = t.lineNumber, r.columnNumber = t.columnNumber, r;
    }
  };
}
[TypeError, RangeError, SyntaxError, ReferenceError, EvalError, URIError].forEach(e => create$2(e)), "undefined" != typeof AggregateError && create$2(AggregateError), "function" == typeof InternalError && create$2(InternalError);
const E = {
    file: {
      test: e => "File" === toStringTag(e),
      replace(e) {
        const t = new XMLHttpRequest();
        if (t.overrideMimeType("text/plain; charset=x-user-defined"), t.open("GET", URL.createObjectURL(e), false), t.send(), 200 !== t.status && 0 !== t.status) throw new Error("Bad File access: " + t.status);
        return {
          type: e.type,
          stringContents: t.responseText,
          name: e.name,
          lastModified: e.lastModified
        };
      },
      revive: ({
        name: e,
        type: t,
        stringContents: r,
        lastModified: n
      }) => new File([string2arraybuffer(r)], e, {
        type: t,
        lastModified: n
      }),
      replaceAsync: e => new TypesonPromise(function (t, r) {
        const n = new FileReader();
        n.addEventListener("load", function () {
          t({
            type: e.type,
            stringContents: arraybuffer2string(n.result),
            name: e.name,
            lastModified: e.lastModified
          });
        }), n.addEventListener("error", function () {
          r(n.error);
        }), n.readAsArrayBuffer(e);
      })
    }
  },
  N = {
    file: E.file,
    filelist: {
      test: e => "FileList" === toStringTag(e),
      replace(e) {
        const t = [];
        for (let r = 0; r < e.length; r++) t[r] = e.item(r);
        return t;
      },
      revive(e) {
        class FileList {
          constructor() {
            this._files = arguments[0], this.length = this._files.length;
          }
          item(e) {
            return this._files[e];
          }
          get [Symbol.toStringTag]() {
            return "FileList";
          }
        }
        return new FileList(e);
      }
    }
  },
  _ = {
    imagebitmap: {
      test: e => "ImageBitmap" === toStringTag(e) || e && e.dataset && "ImageBitmap" === e.dataset.toStringTag,
      replace(e) {
        const t = document.createElement("canvas");
        return t.getContext("2d").drawImage(e, 0, 0), {
          width: e.width,
          height: e.height,
          dataURL: t.toDataURL()
        };
      },
      revive(e) {
        const t = "undefined" == typeof OffscreenCanvas ? document.createElement("canvas") : new OffscreenCanvas(e.width, e.height),
          r = t.getContext("2d"),
          n = document.createElement("img");
        return n.addEventListener("load", function () {
          r.drawImage(n, 0, 0);
        }), n.src = e.dataURL, "undefined" == typeof OffscreenCanvas ? t : t.transferToImageBitmap();
      },
      reviveAsync(e) {
        const t = document.createElement("canvas"),
          r = t.getContext("2d"),
          n = document.createElement("img");
        return n.addEventListener("load", function () {
          r.drawImage(n, 0, 0);
        }), n.src = e.dataURL, new TypesonPromise(async (e, r) => {
          try {
            e(await createImageBitmap(t));
          } catch (e) {
            r(e);
          }
        });
      }
    }
  },
  B = {
    imagedata: {
      test: e => "ImageData" === toStringTag(e),
      replace: e => ({
        array: [...e.data],
        width: e.width,
        height: e.height
      }),
      revive: e => new ImageData(new Uint8ClampedArray(e.array), e.width, e.height)
    }
  },
  I = {
    infinity: {
      test: e => e === 1 / 0,
      replace: () => "Infinity",
      revive: () => 1 / 0
    }
  },
  U = {
    map: {
      test: e => "Map" === toStringTag(e),
      replace: e => e.entries().toArray(),
      revive: e => new Map(e)
    }
  },
  M = {
    nan: {
      test: e => Number.isNaN(e),
      replace: () => "NaN",
      revive: () => NaN
    }
  },
  L = {
    negativeInfinity: {
      test: e => e === -1 / 0,
      replace: () => "-Infinity",
      revive: () => -1 / 0
    }
  },
  D = {
    negativeZero: {
      test: e => Object.is(e, -0),
      replace: () => 0,
      revive: () => -0
    }
  },
  R = {
    StringObject: {
      test: e => "String" === toStringTag(e) && "object" == typeof e,
      replace: String,
      revive: e => new String(e)
    },
    BooleanObject: {
      test: e => "Boolean" === toStringTag(e) && "object" == typeof e,
      replace: e => e.valueOf(),
      revive: e => new Boolean(e)
    },
    NumberObject: {
      test: e => "Number" === toStringTag(e) && "object" == typeof e,
      replace: Number,
      revive: e => new Number(e)
    }
  },
  K = {
    regexp: {
      test: e => "RegExp" === toStringTag(e),
      replace: e => ({
        source: e.source,
        flags: (e.global ? "g" : "") + (e.ignoreCase ? "i" : "") + (e.multiline ? "m" : "") + (e.sticky ? "y" : "") + (e.unicode ? "u" : "") + (e.unicodeSets ? "v" : "") + (e.hasIndices ? "d" : "") + (e.dotAll ? "s" : "")
      }),
      revive: ({
        source: e,
        flags: t
      }) => new RegExp(e, t)
    }
  },
  z = {
    set: {
      test: e => "Set" === toStringTag(e),
      replace: e => e.values().toArray(),
      revive: e => new Set(e)
    }
  },
  V = {};
"function" == typeof Int8Array && [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, ...("function" == typeof BigInt64Array ? [BigInt64Array, BigUint64Array] : [])].forEach(e => function create$1(e) {
  const t = e.name;
  V[t.toLowerCase()] = {
    test: e => toStringTag(e) === t,
    replace: e => (0 === e.byteOffset && e.byteLength === e.buffer.byteLength ? e : e.slice(0)).buffer,
    revive: t => "ArrayBuffer" === toStringTag(t) ? new e(t) : t
  };
}(e));
const W = {};
"function" == typeof Int8Array && [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, ...("function" == typeof BigInt64Array ? [BigInt64Array, BigUint64Array] : [])].forEach(e => function create(e) {
  const t = e.name;
  W[t.toLowerCase()] = {
    test: e => toStringTag(e) === t,
    replace({
      buffer: e,
      byteOffset: t,
      length: r
    }, n) {
      n.buffers || (n.buffers = []);
      const o = n.buffers.indexOf(e);
      return -1 !== o ? {
        index: o,
        byteOffset: t,
        length: r
      } : (n.buffers.push(e), {
        maxByteLength: e.maxByteLength,
        resizable: e.resizable,
        encoded: u(e),
        byteOffset: t,
        length: r
      });
    },
    revive(t, r) {
      r.buffers || (r.buffers = []);
      const {
        byteOffset: n,
        length: o,
        encoded: s,
        index: a,
        maxByteLength: i,
        resizable: c
      } = t;
      let y;
      return "index" in t ? y = r.buffers[a] : (y = l(s, c ? {
        maxByteLength: i
      } : void 0), r.buffers.push(y)), new e(y, n, o);
    }
  };
}(e));
const Q = {
    undef: {
      test: (e, t) => void 0 === e && (t.ownKeys || !("ownKeys" in t)),
      replace: () => 0,
      revive: () => new Undefined()
    }
  },
  G = {
    userObject: {
      test: e => isUserObject(e),
      replace: e => ({
        ...e
      }),
      revive: e => e
    }
  },
  H = [{
    arrayNonindexKeys: {
      testPlainObjects: true,
      test: (e, t) => !!Array.isArray(e) && (Object.keys(e).some(e => String(Number(e)) !== e) && (t.iterateIn = "object", t.addLength = true), true),
      replace: (e, t) => (t.iterateUnsetNumeric = true, e),
      revive(e) {
        if (Array.isArray(e)) return e;
        const t = [];
        return Object.entries(e).forEach(([e, r]) => {
          t[e] = r;
        }), t;
      }
    }
  }, {
    sparseUndefined: {
      test: (e, t) => void 0 === e && false === t.ownKeys,
      replace: () => 0,
      revive() {}
    }
  }],
  X = [M, I, L, D],
  re = [G, Q, H, R, X, O, K, B, _, E, N, m, x, j].concat("function" == typeof Map ? U : [], "function" == typeof Set ? z : [], "function" == typeof ArrayBuffer ? p : [], "function" == typeof Uint8Array ? W : [], "function" == typeof DataView ? v : [], "undefined" != typeof crypto ? b : [], "undefined" != typeof BigInt ? [d, f] : [], "undefined" != typeof DOMException ? w : [], "undefined" != typeof DOMRect ? S : [], "undefined" != typeof DOMPoint ? A : [], "undefined" != typeof DOMQuad ? P : [], "undefined" != typeof DOMMatrix ? T : []),
  ne = re.concat({
    checkDataCloneException: {
      test(e) {
        const t = {}.toString.call(e).slice(8, -1);
        if (["symbol", "function"].includes(typeof e) || ["Arguments", "Module", "Promise", "WeakMap", "WeakSet", "Event", "MessageChannel"].includes(t) || e && "object" == typeof e && "number" == typeof e.nodeType && "function" == typeof e.insertBefore) throw new DOMException("The object cannot be cloned.", "DataCloneError");
        return false;
      }
    }
  });

// See: https://stackoverflow.com/questions/42170826/categories-for-rejection-by-the-structured-cloning-algorithm

let typeson = new Typeson().register(ne);

/**
 * @param {(preset: import('typeson-registry').Preset) =>
 *   import('typeson-registry').Preset} func
 * @returns {void}
 */
function register(func) {
  // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Should be one-time cache
  typeson = new Typeson().register(func(ne));
}

/**
 * We are keeping the callback approach for now in case we wish to reexpose
 * `Blob`, `File`, `FileList` asynchronously (though in such a case, we
 * should probably refactor as a Promise).
 * @param {AnyValue} obj
 * @param {(str: string) => void} [func]
 * @throws {Error}
 * @returns {string}
 */
function encode(obj, func) {
  let ret;
  try {
    ret = typeson.stringifySync(obj);
  } catch (err) {
    // SCA in typeson-registry using `DOMException` which is not defined (e.g., in Node)
    if (hasConstructorOf(err, ReferenceError) ||
    // SCA in typeson-registry threw a cloning error and we are in a
    //   supporting environment (e.g., the browser) where `ShimDOMException` is
    //   an alias for `DOMException`; if typeson-registry ever uses our shim
    //   to throw, we can use this condition alone.
    hasConstructorOf(err, ShimDOMException)) {
      throw createDOMException('DataCloneError', 'The object cannot be cloned.');
    }
    // We should rethrow non-cloning exceptions like from
    //  throwing getters (as in the W3C test, key-conversion-exceptions.htm)
    throw err;
  }
  if (func) {
    func(ret);
  }
  return ret;
}

/**
 * @typedef {any} AnyValue
 */

/**
 * @param {string} obj
 * @returns {AnyValue}
 */
function decode(obj) {
  return typeson.parse(obj);
}

/**
 * @param {AnyValue} val
 * @returns {AnyValue}
 */
function clone(val) {
  // We don't return the intermediate `encode` as we'll need to reencode
  //   the clone as it may differ
  return decode(encode(val));
}

var Sca = /*#__PURE__*/Object.freeze({
  __proto__: null,
  clone: clone,
  decode: decode,
  encode: encode,
  register: register
});

const readonlyProperties$2 = ['objectStore', 'keyPath', 'multiEntry', 'unique'];

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {{
 *   columnName: string,
 *   keyPath: import('./Key.js').KeyPath,
 *   optionalParams: {
 *     unique: boolean,
 *     multiEntry: boolean
 *   }
 *   deleted?: boolean,
 *   __deleted?: boolean,
 *   cursors?: import('./IDBCursor.js').IDBCursorWithValueFull[],
 * }} IDBIndexProperties
 */

/**
 * IDB Index.
 * @see https://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
 * @throws {TypeError}
 * @class
 */
function IDBIndex() {
  throw new TypeError('Illegal constructor');
}
const IDBIndexAlias = IDBIndex;

/**
 * @typedef {IDBIndex & {
 *   name: string,
 *   keyPath: import('./Key.js').KeyPath,
 *   multiEntry: boolean,
 *   unique: boolean,
 *   objectStore: import('./IDBObjectStore.js').IDBObjectStoreFull,
 *   __pendingCreate?: boolean,
 *   __deleted?: boolean,
 *   __originalName: string,
 *   __currentName: string,
 *   __pendingName?: string,
 *   __pendingDelete?: boolean,
 *   __name: string,
 *   __multiEntry: boolean,
 *   __unique: boolean,
 *   __objectStore: import('./IDBObjectStore.js').IDBObjectStoreFull,
 *   __keyPath: import('./Key.js').KeyPath,
 *   __recreated?: boolean
 * }} IDBIndexFull
 */

/**
 *
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {IDBIndexProperties} indexProperties
 * @returns {IDBIndexFull}
 */
IDBIndex.__createInstance = function (store, indexProperties) {
  /**
   * @class
   * @this {IDBIndexFull}
   */
  function IDBIndex() {
    const me = this;
    // @ts-expect-error It's ok
    me[Symbol.toStringTag] = 'IDBIndex';
    defineReadonlyProperties(me, readonlyProperties$2);
    me.__objectStore = store;
    me.__name = me.__originalName = indexProperties.columnName;
    me.__keyPath = Array.isArray(indexProperties.keyPath) ? indexProperties.keyPath.slice() : indexProperties.keyPath;
    const {
      optionalParams
    } = indexProperties;
    me.__multiEntry = Boolean(optionalParams && optionalParams.multiEntry);
    me.__unique = Boolean(optionalParams && optionalParams.unique);
    me.__deleted = Boolean(indexProperties.__deleted);
    me.__objectStore.__cursors = indexProperties.cursors || [];
    Object.defineProperties(me, {
      __currentName: {
        /**
         * @this {IDBIndexFull}
         * @returns {string}
         */
        get() {
          return '__pendingName' in me ? (/** @type {string} */me.__pendingName) : me.name;
        }
      },
      name: {
        enumerable: false,
        configurable: false,
        /**
         * @this {IDBIndexFull}
         * @returns {string}
         */
        get() {
          return this.__name;
        },
        /**
         * @param {string} newName
         * @this {IDBIndexFull}
         * @returns {void}
         */
        set(newName) {
          const me = this;
          newName = convertToDOMString(newName);
          const oldName = me.name;
          IDBTransaction.__assertVersionChange(me.objectStore.transaction);
          IDBTransaction.__assertActive(me.objectStore.transaction);
          IDBIndexAlias.__invalidStateIfDeleted(me);
          IDBObjectStore.__invalidStateIfDeleted(me);
          if (newName === oldName) {
            return;
          }
          if (Object.hasOwn(me.objectStore.__indexes, newName) && !me.objectStore.__indexes[newName].__deleted && !me.objectStore.__indexes[newName].__pendingDelete) {
            throw createDOMException('ConstraintError', 'Index "' + newName + '" already exists on ' + me.objectStore.__currentName);
          }
          me.__name = newName;
          const {
            objectStore
          } = me;
          delete objectStore.__indexes[oldName];
          objectStore.__indexes[newName] = me;
          objectStore.indexNames.splice(objectStore.indexNames.indexOf(oldName), 1, newName);
          const storeHandle = /** @type {import('./IDBTransaction.js').IDBTransactionFull} */objectStore.transaction.__storeHandles[objectStore.name];
          const oldIndexHandle = storeHandle.__indexHandles[oldName];
          oldIndexHandle.__name = newName; // Fix old references
          storeHandle.__indexHandles[newName] = oldIndexHandle; // Ensure new reference accessible
          me.__pendingName = oldName;
          const colInfoToPreserveArr = [['key', 'BLOB ' + (objectStore.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY')], ['value', 'BLOB']].concat(
          // @ts-expect-error Has numeric indexes instead of iterator
          [...objectStore.indexNames].filter(indexName => indexName !== newName).map(indexName => [escapeIndexNameForSQL(indexName), 'BLOB']));
          me.__renameIndex(objectStore, oldName, newName, colInfoToPreserveArr, function (tx, success) {
            IDBIndexAlias.__updateIndexList(store, tx, function (store) {
              delete storeHandle.__pendingName;
              success(store);
            });
          });
        }
      }
    });
  }
  IDBIndex.prototype = IDBIndexAlias.prototype;

  // @ts-expect-error It's ok
  return new IDBIndex();
};

/**
 *
 * @param {IDBIndexFull} index
 * @param {string} [msg]
 * @throws {DOMException}
 * @returns {void}
 */
IDBIndex.__invalidStateIfDeleted = function (index, msg) {
  if (index.__deleted || index.__pendingDelete || index.__pendingCreate && index.objectStore.transaction && index.objectStore.transaction.__errored) {
    throw createDOMException('InvalidStateError', msg || 'This index has been deleted');
  }
};

/**
 * Clones an IDBIndex instance for a different IDBObjectStore instance.
 * @param {IDBIndexFull} index
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @returns {IDBIndexFull}
 */
IDBIndex.__clone = function (index, store) {
  const idx = IDBIndex.__createInstance(store, {
    columnName: index.name,
    keyPath: index.keyPath,
    optionalParams: {
      multiEntry: index.multiEntry,
      unique: index.unique
    }
  });
  /** @type {const} */
  ['__pendingCreate', '__pendingDelete', '__deleted', '__originalName', '__recreated'].forEach(p => {
    // @ts-expect-error Why is this type "never"?
    idx[p] = index[p];
  });
  return idx;
};

/**
 * Creates a new index on an object store.
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {IDBIndexFull} index
 * @returns {void}
 */
IDBIndex.__createIndex = function (store, index) {
  const indexName = index.name;
  const storeName = store.__currentName;
  const idx = store.__indexes[indexName];
  index.__pendingCreate = true;

  // Add the index to the IDBObjectStore
  store.indexNames.push(indexName);
  store.__indexes[indexName] = index; // We add to indexes as needs to be available, e.g., if there is a subsequent deleteIndex call

  let indexHandle = store.__indexHandles[indexName];
  if (!indexHandle || index.__pendingDelete || index.__deleted || indexHandle.__pendingDelete || indexHandle.__deleted) {
    indexHandle = store.__indexHandles[indexName] = IDBIndex.__clone(index, store);
  }

  // Create the index in WebSQL
  const {
    transaction
  } = store;
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  transaction.__addNonRequestToTransactionQueue(function createIndex(tx, args, success, failure) {
    const columnExists = idx && (idx.__deleted || idx.__recreated); // This check must occur here rather than earlier as properties may not have been set yet otherwise

    /** @type {{[key: string]: boolean}} */
    let indexValues = {};

    /**
     * @param {SQLTransaction} tx
     * @param {SQLError} err
     * @returns {void}
     */
    function error(tx, err) {
      failure(createDOMException('UnknownError', 'Could not create index "' + indexName + '"' + err.code + '::' + err.message, err));
    }

    /**
     * @param {SQLTransaction} tx
     * @returns {void}
     */
    function applyIndex(tx) {
      // Update the object store's index list
      IDBIndex.__updateIndexList(store, tx, function () {
        // Add index entries for all existing records
        tx.executeSql('SELECT "key", "value" FROM ' + escapeStoreNameForSQL(storeName), [], function (tx, data) {
          if (CFG.DEBUG) {
            console.log('Adding existing ' + storeName + ' records to the ' + indexName + ' index');
          }
          addIndexEntry(0);

          /**
           * @param {Integer} i
           * @returns {void}
           */
          function addIndexEntry(i) {
            if (i < data.rows.length) {
              try {
                const value = decode(unescapeSQLiteResponse(data.rows.item(i).value));
                const indexKey = extractKeyValueDecodedFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Todo: Do we need this stricter error checking?
                if ('invalid' in indexKey && indexKey.invalid || 'failure' in indexKey && indexKey.failure) {
                  // Todo: Do we need invalid checks and should we instead treat these as being duplicates?
                  throw new Error('Go to catch; ignore bad indexKey');
                }
                const indexKeyStr = /** @type {string} */
                encode$1(indexKey.value, index.multiEntry);
                if (index.unique) {
                  if (Object.hasOwn(indexValues, indexKeyStr)) {
                    indexValues = {};
                    failure(createDOMException('ConstraintError', 'Duplicate values already exist within the store'));
                    return;
                  }
                  indexValues[indexKeyStr] = true;
                }
                tx.executeSql('UPDATE ' + escapeStoreNameForSQL(storeName) + ' SET ' + escapeIndexNameForSQL(indexName) + ' = ? WHERE "key" = ?', [escapeSQLiteStatement(indexKeyStr), data.rows.item(i).key], function () {
                  addIndexEntry(i + 1);
                }, /** @type {SQLStatementErrorCallback} */error);
              } catch (err) {
                // Not a valid value to insert into index, so just continue
                addIndexEntry(i + 1);
              }
            } else {
              delete index.__pendingCreate;
              delete indexHandle.__pendingCreate;
              if (index.__deleted) {
                delete index.__deleted;
                delete indexHandle.__deleted;
                index.__recreated = true;
                indexHandle.__recreated = true;
              }
              indexValues = {};
              success(store);
            }
          }
        }, /** @type {SQLStatementErrorCallback} */error);
      }, /** @type {SQLStatementErrorCallback} */error);
    }
    const escapedStoreNameSQL = escapeStoreNameForSQL(storeName);
    const escapedIndexNameSQL = escapeIndexNameForSQL(index.name);

    /**
     * @param {SQLTransaction} tx
     * @returns {void}
     */
    function addIndexSQL(tx) {
      if (!CFG.useSQLiteIndexes) {
        applyIndex(tx);
        return;
      }
      tx.executeSql('CREATE INDEX IF NOT EXISTS "' +
      // The escaped index name must be unique among indexes in the whole database;
      //    so we prefix with store name; as prefixed, will also not conflict with
      //    index on `key`
      // Avoid quotes and separate with special escape sequence
      escapedStoreNameSQL.slice(1, -1) + '^5' + escapedIndexNameSQL.slice(1, -1) + '" ON ' + escapedStoreNameSQL + '(' + escapedIndexNameSQL + ')', [], applyIndex, /** @type {SQLStatementErrorCallback} */error);
    }
    if (columnExists) {
      // For a previously existing index, just update the index entries in the existing column;
      //   no need to add SQLite index to it either as should already exist
      applyIndex(tx);
    } else {
      // For a new index, add a new column to the object store, then apply the index
      const sql = ['ALTER TABLE', escapedStoreNameSQL, 'ADD', escapedIndexNameSQL, 'BLOB'].join(' ');
      if (CFG.DEBUG) {
        console.log(sql);
      }
      tx.executeSql(sql, [], addIndexSQL, /** @type {SQLStatementErrorCallback} */error);
    }
  });
};

/**
 * Deletes an index from an object store.
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {IDBIndexFull} index
 * @returns {void}
 */
IDBIndex.__deleteIndex = function (store, index) {
  // Remove the index from the IDBObjectStore
  index.__pendingDelete = true;
  const indexHandle = store.__indexHandles[index.name];
  if (indexHandle) {
    indexHandle.__pendingDelete = true;
  }
  store.indexNames.splice(store.indexNames.indexOf(index.name), 1);

  // Remove the index in WebSQL
  const {
    transaction
  } = store;
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  transaction.__addNonRequestToTransactionQueue(function deleteIndex(tx, args, success, failure) {
    /**
     * @param {SQLTransaction} tx
     * @param {SQLError} err
     * @returns {void}
     */
    function error(tx, err) {
      failure(createDOMException('UnknownError', 'Could not delete index "' + index.name + '"', err));
    }

    /**
     * @returns {void}
     */
    function finishDeleteIndex() {
      // Update the object store's index list
      IDBIndex.__updateIndexList(store, tx, function (store) {
        delete index.__pendingDelete;
        delete index.__recreated;
        index.__deleted = true;
        if (indexHandle) {
          indexHandle.__deleted = true;
          delete indexHandle.__pendingDelete;
        }
        success(store);
      }, /** @type {SQLStatementErrorCallback} */error);
    }
    if (!CFG.useSQLiteIndexes) {
      finishDeleteIndex();
      return;
    }
    tx.executeSql('DROP INDEX IF EXISTS ' + sqlQuote(escapeStoreNameForSQL(store.name).slice(1, -1) + '^5' + escapeIndexNameForSQL(index.name).slice(1, -1)), [], finishDeleteIndex, /** @type {SQLStatementErrorCallback} */error);
  });
};

/**
 * @typedef {{[key: string]: IDBIndexProperties}} IndexList
 */

/**
 * Updates index list for the given object store.
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {SQLTransaction} tx
 * @param {(store: IDBObjectStore) => void} success
 * @param {(
 *   tx: SQLTransaction,
 *   err: SQLError
 * ) => boolean} [failure]
 * @returns {void}
 */
IDBIndex.__updateIndexList = function (store, tx, success, failure) {
  /** @type {IndexList} **/
  const indexList = {};
  for (let i = 0; i < store.indexNames.length; i++) {
    const idx = store.__indexes[store.indexNames[i]];
    indexList[idx.name] = {
      columnName: idx.name,
      keyPath: idx.keyPath,
      optionalParams: {
        unique: idx.unique,
        multiEntry: idx.multiEntry
      },
      deleted: Boolean(idx.__deleted)
    };
  }
  if (CFG.DEBUG) {
    console.log('Updating the index list for ' + store.__currentName, indexList);
  }
  tx.executeSql('UPDATE __sys__ SET "indexList" = ? WHERE "name" = ?', [JSON.stringify(indexList), escapeSQLiteStatement(store.__currentName)], function () {
    success(store);
  }, /** @type {SQLStatementErrorCallback} */failure);
};

/**
 * @typedef {any|IDBKeyRange} Query
 */

/**
 * Retrieves index data for the given key.
 * @param {Query} range
 * @param {"value"|"key"|"count"} opType
 * @param {boolean} nullDisallowed
 * @param {number} [count]
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.__fetchIndexData = function (range, opType, nullDisallowed, count) {
  const me = this;
  if (count !== undefined) {
    count = enforceRange(count, 'unsigned long');
  }
  IDBIndex.__invalidStateIfDeleted(me);
  IDBObjectStore.__invalidStateIfDeleted(me.objectStore);
  if (me.objectStore.__deleted) {
    throw createDOMException('InvalidStateError', "This index's object store has been deleted");
  }
  IDBTransaction.__assertActive(me.objectStore.transaction);
  if (nullDisallowed && isNullish(range)) {
    throw createDOMException('DataError', 'No key or range was specified');
  }
  const fetchArgs = buildFetchIndexDataSQL(nullDisallowed, me, range, opType, false);
  return /** @type {import('./IDBTransaction.js').IDBTransactionFull} */me.objectStore.transaction.__addToTransactionQueue(function (...args) {
    executeFetchIndexData(count, ...fetchArgs,
    // @ts-expect-error It's ok
    ...args);
  }, undefined, me);
};

/**
 * Opens a cursor over the given key range.
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.openCursor = function /* query, direction */
() {
  const me = this;
  // eslint-disable-next-line prefer-rest-params -- API
  const [query, direction] = arguments;
  const cursor = IDBCursorWithValue.__createInstance(query, direction, me.objectStore, me, escapeIndexNameForSQLKeyColumn(me.name), 'value');
  me.__objectStore.__cursors.push(cursor);
  return cursor.__request;
};

/**
 * Opens a cursor over the given key range.  The cursor only includes key values, not data.
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.openKeyCursor = function /* query, direction */
() {
  const me = this;
  // eslint-disable-next-line prefer-rest-params -- API
  const [query, direction] = arguments;
  const cursor = IDBCursor.__createInstance(query, direction, me.objectStore, me, escapeIndexNameForSQLKeyColumn(me.name), 'key');
  me.__objectStore.__cursors.push(cursor);
  return cursor.__request;
};

/**
 *
 * @param {Query} query
 * @throws {TypeError}
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.get = function (query) {
  if (!arguments.length) {
    // Per https://heycam.github.io/webidl/
    throw new TypeError('A parameter was missing for `IDBIndex.get`.');
  }
  return this.__fetchIndexData(query, 'value', true);
};

/**
 *
 * @param {Query} query
 * @throws {TypeError}
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.getKey = function (query) {
  if (!arguments.length) {
    // Per https://heycam.github.io/webidl/
    throw new TypeError('A parameter was missing for `IDBIndex.getKey`.');
  }
  return this.__fetchIndexData(query, 'key', true);
};

/**
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.getAll = function /* query, count */
() {
  // eslint-disable-next-line prefer-rest-params -- API
  const [query, count] = arguments;
  return this.__fetchIndexData(query, 'value', false, count);
};

/**
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.getAllKeys = function /* query, count */
() {
  // eslint-disable-next-line prefer-rest-params -- API
  const [query, count] = arguments;
  return this.__fetchIndexData(query, 'key', false, count);
};

/**
 * @this {IDBIndexFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBIndex.prototype.count = function /* query */
() {
  const me = this;
  // eslint-disable-next-line prefer-rest-params -- API
  const query = arguments[0];
  // With the exception of needing to check whether the index has been
  //  deleted, we could, for greater spec parity (if not accuracy),
  //  just call:
  //  `return me.__objectStore.count(query);`

  if (instanceOf(query, IDBKeyRange)) {
    // Todo: Do we need this block?
    // We don't need to add to cursors array since has the count parameter which won't cache
    return IDBCursorWithValue.__createInstance(query, 'next', me.objectStore, me, escapeIndexNameForSQLKeyColumn(me.name), 'value', true).__request;
  }
  return me.__fetchIndexData(query, 'count', false);
};

/**
 *
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {string} oldName
 * @param {string} newName
 * @param {string[][]} colInfoToPreserveArr
 * @param {null|((
 *   tx: SQLTransaction,
 *   success: ((store: IDBObjectStore) => void)
 * ) => void)} cb
 * @this {IDBIndexFull}
 * @returns {void}
 */
IDBIndex.prototype.__renameIndex = function (store, oldName, newName, colInfoToPreserveArr = [], cb = null) {
  const newNameType = 'BLOB';
  const storeName = store.__currentName;
  const escapedStoreNameSQL = escapeStoreNameForSQL(storeName);
  const escapedNewIndexNameSQL = escapeIndexNameForSQL(newName);
  const escapedTmpStoreNameSQL = sqlQuote('tmp_' + escapeStoreNameForSQL(storeName).slice(1, -1));
  const colNamesToPreserve = colInfoToPreserveArr.map(colInfo => colInfo[0]);
  const colInfoToPreserve = colInfoToPreserveArr.map(colInfo => colInfo.join(' '));
  const listColInfoToPreserve = colInfoToPreserve.length ? colInfoToPreserve.join(', ') + ', ' : '';
  const listColsToPreserve = colNamesToPreserve.length ? colNamesToPreserve.join(', ') + ', ' : '';

  // We could adapt the approach at https://stackoverflow.com/a/8430746/271577
  //    to make the approach reusable without passing column names, but it is a bit fragile
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  store.transaction.__addNonRequestToTransactionQueue(function renameIndex(tx, args, success, error) {
    /**
     * @param {SQLTransaction} tx
     * @param {SQLError} err
     * @returns {void}
     */
    function sqlError(tx, err) {
      error(err);
    }
    /**
     * @returns {void}
     */
    function finish() {
      if (cb) {
        cb(tx, success);
        return;
      }
      success();
    }
    // See https://www.sqlite.org/lang_altertable.html#otheralter
    // We don't query for indexes as we already have the info
    // This approach has the advantage of auto-deleting indexes via the DROP TABLE
    const sql = 'CREATE TABLE ' + escapedTmpStoreNameSQL + '(' + listColInfoToPreserve + escapedNewIndexNameSQL + ' ' + newNameType + ')';
    if (CFG.DEBUG) {
      console.log(sql);
    }
    tx.executeSql(sql, [], function () {
      const sql = 'INSERT INTO ' + escapedTmpStoreNameSQL + '(' + listColsToPreserve + escapedNewIndexNameSQL + ') SELECT ' + listColsToPreserve + escapeIndexNameForSQL(oldName) + ' FROM ' + escapedStoreNameSQL;
      if (CFG.DEBUG) {
        console.log(sql);
      }
      tx.executeSql(sql, [], function () {
        const sql = 'DROP TABLE ' + escapedStoreNameSQL;
        if (CFG.DEBUG) {
          console.log(sql);
        }
        tx.executeSql(sql, [], function () {
          const sql = 'ALTER TABLE ' + escapedTmpStoreNameSQL + ' RENAME TO ' + escapedStoreNameSQL;
          if (CFG.DEBUG) {
            console.log(sql);
          }
          tx.executeSql(sql, [], function (tx) {
            if (!CFG.useSQLiteIndexes) {
              finish();
              return;
            }
            const indexCreations = colNamesToPreserve.slice(2) // Doing `key` separately and no need for index on `value`
            .map(escapedIndexNameSQL => new SyncPromise(function (resolve, reject) {
              const escapedIndexToRecreate = sqlQuote(escapedStoreNameSQL.slice(1, -1) + '^5' + escapedIndexNameSQL.slice(1, -1));
              // const sql = 'DROP INDEX IF EXISTS ' + escapedIndexToRecreate;
              // if (CFG.DEBUG) { console.log(sql); }
              // tx.executeSql(sql, [], function () {
              const sql = 'CREATE INDEX ' + escapedIndexToRecreate + ' ON ' + escapedStoreNameSQL + '(' + escapedIndexNameSQL + ')';
              if (CFG.DEBUG) {
                console.log(sql);
              }
              tx.executeSql(sql, [], resolve, /** @type {SQLStatementErrorCallback} */
              function (tx, err) {
                reject(err);
              });
              // }, function (tx, err) {
              //    reject(err);
              // });
            }));
            indexCreations.push(new SyncPromise(function (resolve, reject) {
              const escapedIndexToRecreate = sqlQuote('sk_' + escapedStoreNameSQL.slice(1, -1));
              // Chrome erring here if not dropped first; Node does not
              const sql = 'DROP INDEX IF EXISTS ' + escapedIndexToRecreate;
              if (CFG.DEBUG) {
                console.log(sql);
              }
              tx.executeSql(sql, [], function () {
                const sql = 'CREATE INDEX ' + escapedIndexToRecreate + ' ON ' + escapedStoreNameSQL + '("key")';
                if (CFG.DEBUG) {
                  console.log(sql);
                }
                tx.executeSql(sql, [], resolve, /** @type {SQLStatementErrorCallback} */
                function (tx, err) {
                  reject(err);
                });
              }, /** @type {SQLStatementErrorCallback} */
              function (tx, err) {
                reject(err);
              });
            }));
            SyncPromise.all(indexCreations).then(finish).catch(/** @type {(reason: any) => PromiseLike<never>} */
            error).catch(err => {
              console.log('Index rename error');
              throw err;
            });
          }, /** @type {SQLStatementErrorCallback} */sqlError);
        }, /** @type {SQLStatementErrorCallback} */sqlError);
      }, /** @type {SQLStatementErrorCallback} */sqlError);
    }, /** @type {SQLStatementErrorCallback} */sqlError);
  });
};

/**
 * @typedef {any} AnyValue
 */

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
Object.defineProperty(IDBIndex, Symbol.hasInstance, {
  /**
   * @param {AnyValue} obj
   * @returns {boolean}
   */
  value: obj => isObj(obj) && 'openCursor' in obj && typeof obj.openCursor === 'function' && 'multiEntry' in obj && typeof obj.multiEntry === 'boolean'
});
defineReadonlyOuterInterface(IDBIndex.prototype, readonlyProperties$2);
defineOuterInterface(IDBIndex.prototype, ['name']);
IDBIndex.prototype[Symbol.toStringTag] = 'IDBIndexPrototype';
Object.defineProperty(IDBIndex, 'prototype', {
  writable: false
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

/**
 * @param {number|null} count
 * @param {boolean} unboundedDisallowed
 * @param {IDBIndexFull} index
 * @param {boolean} hasKey
 * @param {import('./Key.js').Value|import('./Key.js').Key} range
 * @param {"value"|"key"|"count"} opType
 * @param {boolean} multiChecks
 * @param {string[]} sql
 * @param {string[]} sqlValues
 * @param {SQLTransaction} tx
 * @param {null|undefined} args
 * @param {(result: number|undefined|[]|AnyValue|AnyValue[]) => void} success
 * @param {(tx: SQLTransaction, err: SQLError) => void} error
 * @returns {void}
 */
function executeFetchIndexData(count, unboundedDisallowed, index, hasKey, range, opType, multiChecks, sql, sqlValues, tx, args, success, error) {
  if (unboundedDisallowed) {
    count = 1;
  }
  if (count) {
    sql.push('LIMIT', String(count));
  }
  const isCount = opType === 'count';
  if (CFG.DEBUG) {
    console.log('Trying to fetch data for Index', sql.join(' '), sqlValues);
  }
  tx.executeSql(sql.join(' '), sqlValues, function (tx, data) {
    const records = [];
    let recordCount = 0;
    const decode$2 = isCount ? () => {/* */} : opType === 'key'
    // eslint-disable-next-line @stylistic/operator-linebreak -- JSDoc
    ?
    /**
     * @param {{
     *   key: string
     * }} record
     * @returns {import('./Key.js').ValueType|undefined}
     */
    record => {
      // Key.convertValueToKey(record.key); // Already validated before storage
      return decode$1(unescapeSQLiteResponse(record.key));
    }
    // eslint-disable-next-line @stylistic/operator-linebreak -- JSDoc
    :
    /**
     * @param {{
     *   value: string
     * }} record
     * @returns {AnyValue}
     */
    record => {
      // when opType is value
      return decode(unescapeSQLiteResponse(record.value));
    };
    if (index.multiEntry) {
      const escapedIndexNameForKeyCol = escapeIndexNameForSQLKeyColumn(index.name);
      const encodedKey = encode$1(range, index.multiEntry);
      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows.item(i);
        const rowKey = /** @type {import('./Key.js').ValueTypeArray} */
        decode$1(row[escapedIndexNameForKeyCol]);
        let record;
        if (hasKey && (multiChecks && range.some(
        /**
         * @param {string} check
         * @returns {boolean}
         */
        check => rowKey.includes(check)) ||
        // More precise than our SQL
        isMultiEntryMatch(
        // Added `JSON.stringify` as was having problems with
        //        `JSON.stringify` encoding added to nested
        //        array keys
        JSON.stringify(encodedKey).slice(1, -1), row[escapedIndexNameForKeyCol]))) {
          recordCount++;
          record = row;
        } else if (!hasKey && !multiChecks) {
          if (rowKey !== undefined) {
            recordCount += Array.isArray(rowKey) ? rowKey.length : 1;
            record = row;
          }
        }
        if (record) {
          records.push(decode$2(record));
          if (unboundedDisallowed) {
            break;
          }
        }
      }
    } else {
      for (let i = 0; i < data.rows.length; i++) {
        const record = data.rows.item(i);
        if (record) {
          records.push(decode$2(record));
        }
      }
      recordCount = records.length;
    }
    if (isCount) {
      success(recordCount);
    } else if (recordCount === 0) {
      success(unboundedDisallowed ? undefined : []);
    } else {
      success(unboundedDisallowed ? records[0] : records);
    }
  }, /** @type {SQLStatementErrorCallback} */error);
}

/**
 * @param {boolean} nullDisallowed
 * @param {IDBIndexFull} index
 * @param {import('./Key.js').Value|import('./Key.js').Key} range
 * @param {"value"|"key"|"count"} opType
 * @param {boolean} multiChecks
 * @returns {[
 *   nullDisallowed: boolean,
 *   index: IDBIndexFull,
 *   hasRange: boolean,
 *   range: import('./Key.js').Value|import('./Key.js').Key,
 *   opType: "value"|"key"|"count",
 *   multiChecks: boolean,
 *   sql: string[],
 *   sqlValues: string[]
 * ]}
 */
function buildFetchIndexDataSQL(nullDisallowed, index, range, opType, multiChecks) {
  const hasRange = nullDisallowed || !isNullish(range);
  const col = opType === 'count' ? 'key' : opType; // It doesn't matter which column we use for 'count' as long as it is valid
  const sql = ['SELECT', sqlQuote(col) + (index.multiEntry ? ', ' + escapeIndexNameForSQL(index.name) : ''), 'FROM', escapeStoreNameForSQL(index.objectStore.__currentName), 'WHERE', escapeIndexNameForSQL(index.name), 'NOT NULL'];

  /** @type {string[]} */
  const sqlValues = [];
  if (hasRange) {
    if (multiChecks) {
      sql.push('AND (');
      /** @type {import('./Key.js').KeyPathArray} */
      range.forEach((innerKey, i) => {
        if (i > 0) {
          sql.push('OR');
        }
        sql.push(escapeIndexNameForSQL(index.name), "LIKE ? ESCAPE '^' ");
        sqlValues.push('%' + sqlLIKEEscape(/** @type {string} */encode$1(innerKey, index.multiEntry)) + '%');
      });
      sql.push(')');
    } else if (index.multiEntry) {
      sql.push('AND', escapeIndexNameForSQL(index.name), "LIKE ? ESCAPE '^'");
      if (Array.isArray(range)) {
        // Todo: For nesting deeper than one level, we probably need to
        //         run `JSON.stringify` again
        sqlValues.push('%' + sqlLIKEEscape(JSON.stringify(/** @type {string} */encode$1(range, index.multiEntry)).slice(1, -1)) + '%');
      } else {
        sqlValues.push('%' + sqlLIKEEscape(/** @type {string} */encode$1(range, index.multiEntry)) + '%');
      }
    } else {
      const convertedRange = convertValueToKeyRange(range, nullDisallowed);
      setSQLForKeyRange(convertedRange, escapeIndexNameForSQL(index.name), sql, sqlValues, true, false);
    }
  }
  return [nullDisallowed, index, hasRange, range, opType, multiChecks, sql, sqlValues];
}

const readonlyProperties$1 = ['keyPath', 'indexNames', 'transaction', 'autoIncrement'];

/**
 * @typedef {number} Integer
 */

/**
 * IndexedDB Object Store.
 * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
 * @class
 * @throws {TypeError}
 */
function IDBObjectStore() {
  throw new TypeError('Illegal constructor');
}
const IDBObjectStoreAlias = IDBObjectStore;

/**
 * @typedef {IDBObjectStore & {
 *   name: string,
 *   keyPath: import('./Key.js').KeyPath,
 *   transaction?: import('./IDBTransaction.js').IDBTransactionFull,
 *   indexNames: import('./DOMStringList.js').DOMStringListFull,
 *   autoIncrement: boolean,
 *   __autoIncrement: boolean,
 *   __indexes: {[key: string]: import('./IDBIndex.js').IDBIndexFull},
 *   __indexHandles: {[key: string]: import('./IDBIndex.js').IDBIndexFull},
 *   __indexNames: import('./DOMStringList.js').DOMStringListFull,
 *   __oldIndexNames: import('./DOMStringList.js').DOMStringListFull,
 *   __transaction?: import('./IDBTransaction.js').IDBTransactionFull,
 *   __name: string,
 *   __keyPath: import('./Key.js').KeyPath,
 *   __originalName: string,
 *   __currentName: string,
 *   __pendingName?: string,
 *   __pendingDelete?: boolean,
 *   __pendingCreate?: boolean,
 *   __deleted?: boolean,
 *   __cursors: (
 *     import('./IDBCursor.js').IDBCursorFull|
 *     import('./IDBCursor.js').IDBCursorWithValueFull
 *   )[],
 *   __idbdb: import('./IDBDatabase.js').IDBDatabaseFull,
 * }} IDBObjectStoreFull
 */

/**
 *
 * @param {import('./IDBDatabase.js').IDBObjectStoreProperties} storeProperties
 * @param {import('./IDBTransaction.js').IDBTransactionFull} [transaction]
 * @returns {IDBObjectStoreFull}
 */
IDBObjectStore.__createInstance = function (storeProperties, transaction) {
  /**
   * @class
   * @this {IDBObjectStoreFull}
   */
  function IDBObjectStore() {
    const me = this;
    // @ts-expect-error It's ok
    me[Symbol.toStringTag] = 'IDBObjectStore';
    defineReadonlyProperties(this, readonlyProperties$1);
    me.__name = me.__originalName = storeProperties.name;
    me.__keyPath = Array.isArray(storeProperties.keyPath) ? storeProperties.keyPath.slice() : storeProperties.keyPath;
    me.__transaction = transaction;
    me.__idbdb = storeProperties.idbdb;
    me.__cursors = storeProperties.cursors || [];

    // autoInc is numeric (0/1) on WinPhone
    me.__autoIncrement = Boolean(storeProperties.autoInc);
    me.__indexes = {};
    me.__indexHandles = {};
    me.__indexNames = DOMStringList.__createInstance();
    const {
      indexList
    } = storeProperties;
    for (const indexName in indexList) {
      if (!Object.hasOwn(indexList, indexName)) {
        continue;
      }
      const index = IDBIndex.__createInstance(me, indexList[indexName]);
      me.__indexes[index.name] = index;
      if (!index.__deleted) {
        me.indexNames.push(index.name);
      }
    }
    me.__oldIndexNames = me.indexNames.clone();
    Object.defineProperties(this, {
      __currentName: {
        get() {
          return '__pendingName' in this ? this.__pendingName : this.name;
        }
      },
      name: {
        enumerable: false,
        configurable: false,
        /**
         * @this {IDBObjectStoreFull}
         * @returns {string}
         */
        get() {
          return this.__name;
        },
        /**
         * @param {string} name
         * @this {IDBObjectStoreFull}
         * @returns {void}
         */
        set(name) {
          const me = this;
          name = convertToDOMString(name);
          const oldName = me.name;
          IDBObjectStoreAlias.__invalidStateIfDeleted(me);
          IDBTransaction.__assertVersionChange(me.transaction);
          IDBTransaction.__assertActive(me.transaction);
          if (oldName === name) {
            return;
          }
          if (Object.hasOwn(me.__idbdb.__objectStores, name) && !me.__idbdb.__objectStores[name].__pendingDelete) {
            throw createDOMException('ConstraintError', 'Object store "' + name + '" already exists in ' + me.__idbdb.name);
          }
          me.__name = name;
          const oldStore = me.__idbdb.__objectStores[oldName];
          oldStore.__name = name; // Fix old references
          me.__idbdb.__objectStores[name] = oldStore; // Ensure new reference accessible
          delete me.__idbdb.__objectStores[oldName]; // Ensure won't be found

          me.__idbdb.objectStoreNames.splice(me.__idbdb.objectStoreNames.indexOf(oldName), 1, name);
          const oldHandle = /** @type {IDBObjectStoreFull} */
          /** @type {import('./IDBTransaction.js').IDBTransactionFull} */me.transaction.__storeHandles[oldName];
          oldHandle.__name = name; // Fix old references
          /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
          me.transaction.__storeHandles[name] = oldHandle; // Ensure new reference accessible

          me.__pendingName = oldName;
          const sql = 'UPDATE __sys__ SET "name" = ? WHERE "name" = ?';
          const sqlValues = [escapeSQLiteStatement(name), escapeSQLiteStatement(oldName)];
          if (CFG.DEBUG) {
            console.log(sql, sqlValues);
          }
          /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
          me.transaction.__addNonRequestToTransactionQueue(function objectStoreClear(tx, args, success, error) {
            tx.executeSql(sql, sqlValues, function (tx) {
              // This SQL preserves indexes per https://www.sqlite.org/lang_altertable.html
              const sql = 'ALTER TABLE ' + escapeStoreNameForSQL(oldName) + ' RENAME TO ' + escapeStoreNameForSQL(name);
              if (CFG.DEBUG) {
                console.log(sql);
              }
              tx.executeSql(sql, [], function () {
                delete me.__pendingName;
                success();
              });
            }, function (tx, err) {
              error(err);
              return false;
            });
          });
        }
      }
    });
  }
  IDBObjectStore.prototype = IDBObjectStoreAlias.prototype;

  // @ts-expect-error It's ok
  return new IDBObjectStore();
};

/**
 * Clones an IDBObjectStore instance for a different IDBTransaction instance.
 * @param {IDBObjectStoreFull} store
 * @param {import('./IDBTransaction.js').IDBTransactionFull} transaction
 * @returns {IDBObjectStoreFull}
 */
IDBObjectStore.__clone = function (store, transaction) {
  const newStore = IDBObjectStore.__createInstance({
    name: store.__currentName,
    keyPath: Array.isArray(store.keyPath) ? store.keyPath.slice() : store.keyPath,
    autoInc: store.autoIncrement,
    indexList: {},
    idbdb: store.__idbdb,
    cursors: store.__cursors
  }, transaction);

  /** @type {const} */
  ['__indexes', '__indexNames', '__oldIndexNames', '__deleted', '__pendingDelete', '__pendingCreate', '__originalName'].forEach(p => {
    // @ts-expect-error It's ok
    newStore[p] = store[p];
  });
  return newStore;
};

/**
 *
 * @param {IDBObjectStoreFull|import('./IDBIndex.js').IDBIndexFull} store
 * @param {string} [msg]
 * @throws {DOMException}
 * @returns {void}
 */
IDBObjectStore.__invalidStateIfDeleted = function (store, msg) {
  if (store.__deleted || store.__pendingDelete || store.__pendingCreate && 'transaction' in store && store.transaction && store.transaction.__errored) {
    throw createDOMException('InvalidStateError', msg || 'This store has been deleted');
  }
};

/**
 * Creates a new object store in the database.
 * @param {import('./IDBDatabase.js').IDBDatabaseFull} db
 * @param {IDBObjectStoreFull} store
 * @returns {IDBObjectStore}
 */
IDBObjectStore.__createObjectStore = function (db, store) {
  // Add the object store to the IDBDatabase
  const storeName = store.__currentName;
  store.__pendingCreate = true;
  db.__objectStores[storeName] = store;
  db.objectStoreNames.push(storeName);

  // Add the object store to WebSQL
  const transaction = /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  db.__versionTransaction;
  const storeHandles = transaction.__storeHandles;
  if (!Object.hasOwn(storeHandles, storeName) ||
  // These latter conditions are to allow store
  //   recreation to create new clone object
  storeHandles[storeName].__pendingDelete || storeHandles[storeName].__deleted) {
    storeHandles[storeName] = IDBObjectStore.__clone(store, transaction);
  }
  transaction.__addNonRequestToTransactionQueue(function createObjectStore(tx, args, success, failure) {
    /**
     * @param {SQLTransaction} tx
     * @param {SQLError} [err]
     * @returns {boolean}
     */
    function error(tx, err) {
      if (CFG.DEBUG) {
        console.log(err);
      }
      failure(createDOMException('UnknownError', 'Could not create object store "' + storeName + '"', err));
      return false;
    }
    const escapedStoreNameSQL = escapeStoreNameForSQL(storeName);
    // key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
    const sql = ['CREATE TABLE', escapedStoreNameSQL, '(key BLOB', store.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY', ', value BLOB)'].join(' ');
    if (CFG.DEBUG) {
      console.log(sql);
    }
    tx.executeSql(sql, [], function (tx) {
      /**
       * @returns {void}
       */
      function insertStoreInfo() {
        const encodedKeyPath = JSON.stringify(store.keyPath);
        tx.executeSql('INSERT INTO __sys__ VALUES (?,?,?,?,?)', [escapeSQLiteStatement(storeName), encodedKeyPath,
        // For why converting here, see comment and following
        //  discussion at:
        //  https://github.com/axemclion/IndexedDBShim/issues/313#issuecomment-590086778
        Number(store.autoIncrement), '{}', 1], function () {
          delete store.__pendingCreate;
          delete store.__deleted;
          success(store);
        }, error);
      }
      if (!CFG.useSQLiteIndexes) {
        insertStoreInfo();
        return;
      }
      tx.executeSql('CREATE INDEX IF NOT EXISTS ' + sqlQuote('sk_' + escapedStoreNameSQL.slice(1, -1)) + ' ON ' + escapedStoreNameSQL + '("key")', [], insertStoreInfo, error);
    }, error);
  });
  return storeHandles[storeName];
};

/**
 * Deletes an object store from the database.
 * @param {import('./IDBDatabase.js').IDBDatabaseFull} db
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @returns {void}
 */
IDBObjectStore.__deleteObjectStore = function (db, store) {
  // Remove the object store from the IDBDatabase
  store.__pendingDelete = true;
  // We don't delete the other index holders in case need reversion
  store.__indexNames = DOMStringList.__createInstance();
  db.objectStoreNames.splice(db.objectStoreNames.indexOf(store.__currentName), 1);
  const storeHandle = db.__versionTransaction.__storeHandles[store.__currentName];
  if (storeHandle) {
    storeHandle.__indexNames = DOMStringList.__createInstance();
    storeHandle.__pendingDelete = true;
  }

  // Remove the object store from WebSQL
  const transaction = /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  db.__versionTransaction;
  transaction.__addNonRequestToTransactionQueue(function deleteObjectStore(tx, args, success, failure) {
    /**
     * @param {SQLTransaction} tx
     * @param {SQLError} [err]
     * @returns {boolean}
     */
    function error(tx, err) {
      if (CFG.DEBUG) {
        console.log(err);
      }
      failure(createDOMException('UnknownError', 'Could not delete ObjectStore', err));
      return false;
    }
    tx.executeSql('SELECT "name" FROM __sys__ WHERE "name" = ?', [escapeSQLiteStatement(store.__currentName)], function (tx, data) {
      if (data.rows.length > 0) {
        tx.executeSql('DROP TABLE ' + escapeStoreNameForSQL(store.__currentName), [], function () {
          tx.executeSql('DELETE FROM __sys__ WHERE "name" = ?', [escapeSQLiteStatement(store.__currentName)], function () {
            delete store.__pendingDelete;
            store.__deleted = true;
            if (storeHandle) {
              delete storeHandle.__pendingDelete;
              storeHandle.__deleted = true;
            }
            success();
          }, error);
        }, error);
      }
    });
  });
};

/**
 * @typedef {[import('./Key.js').Key, import('./Key.js').Value]} KeyValueArray
 */

// Todo: Although we may end up needing to do cloning genuinely asynchronously (for Blobs and FileLists),
//   and we'll want to ensure the queue starts up synchronously, we nevertheless do the cloning
//   before entering the queue and its callback since the encoding we do is preceded by validation
//   which we must do synchronously anyways. If we reimplement Blobs and FileLists asynchronously,
//   we can detect these types (though validating synchronously as possible) and once entering the
//   queue callback, ensure they load before triggering success or failure (perhaps by returning and
//   a `SyncPromise` from the `Sca.clone` operation and later detecting and ensuring it is resolved
//   before continuing).
/**
 * Determines whether the given inline or out-of-line key is valid,
 *   according to the object store's schema.
 * @param {import('./Key.js').Value} value Used for inline keys
 * @param {import('./Key.js').Key} key Used for out-of-line keys
 * @param {boolean} cursorUpdate
 * @throws {DOMException}
 * @this {IDBObjectStoreFull}
 * @returns {KeyValueArray}
 */
IDBObjectStore.prototype.__validateKeyAndValueAndCloneValue = function (value, key, cursorUpdate) {
  const me = this;
  if (me.keyPath !== null) {
    if (key !== undefined) {
      throw createDOMException('DataError', 'The object store uses in-line keys and the key parameter was provided');
    }
    // Todo Binary: Avoid blobs loading async to ensure cloning (and errors therein)
    //   occurs sync; then can make cloning and this method without callbacks (except where ok
    //   to be async)
    const clonedValue = clone(value);
    key = extractKeyValueDecodedFromValueUsingKeyPath(clonedValue, me.keyPath); // May throw so "rethrow"
    if (key.invalid) {
      throw createDOMException('DataError', 'KeyPath was specified, but key was invalid.');
    }
    if (key.failure) {
      if (!cursorUpdate) {
        if (!me.autoIncrement) {
          throw createDOMException('DataError', 'Could not evaluate a key from keyPath and there is no key generator');
        }
        // Todo: Could the keyPath not be an array?
        if (!checkKeyCouldBeInjectedIntoValue(clonedValue, /** @type {string} */me.keyPath)) {
          throw createDOMException('DataError', 'A key could not be injected into a value');
        }
        // A key will be generated
        return [undefined, clonedValue];
      }
      throw createDOMException('DataError', 'Could not evaluate a key from keyPath');
    }
    // An `IDBCursor.update` call will also throw if not equal to the cursor’s effective key
    return [key.value, clonedValue];
  }
  if (key === undefined) {
    if (!me.autoIncrement) {
      throw createDOMException('DataError', 'The object store uses out-of-line keys and has no key generator and the key parameter was not provided.');
    }
    // A key will be generated
    key = undefined;
  } else {
    convertValueToKeyRethrowingAndIfInvalid(key);
  }
  const clonedValue = clone(value);
  return [key, clonedValue];
};

/**
 * From the store properties and object, extracts the value for the key in
 *   the object store
 * If the table has auto increment, get the current number (unless it has
 *   a keyPath leading to a valid but non-numeric or < 1 key).
 * @param {SQLTransaction} tx
 * @param {import('./Key.js').Value} value
 * @param {import('./Key.js').Key} key
 * @param {(key: import('./Key.js').Key, cn?: Integer) => void} success
 * @param {import('./Key.js').SQLFailureCallback} failCb
 * @this {IDBObjectStoreFull}
 * @returns {void}
 */
IDBObjectStore.prototype.__deriveKey = function (tx, value, key, success, failCb) {
  const me = this;

  // Only run if cloning is needed
  /**
   * @param {Integer} [oldCn]
   * @returns {void}
   */
  function keyCloneThenSuccess(oldCn) {
    // We want to return the original key, so we don't need to accept an argument here
    encode(key, function (key) {
      key = decode(key);
      success(key, oldCn);
    });
  }
  if (me.autoIncrement) {
    // If auto-increment and no valid primaryKey found on the keyPath, get and set the new value, and use
    if (key === undefined) {
      generateKeyForStore(tx, me, function (failure, key, oldCn) {
        if (failure) {
          failCb(createDOMException('ConstraintError', 'The key generator\'s current number has reached the maximum safe integer limit'));
          return;
        }
        if (me.keyPath !== null) {
          // Should not throw now as checked earlier
          // Todo: Could this not be an array here?
          injectKeyIntoValueUsingKeyPath(value, key, /** @type {string} */me.keyPath);
        }
        success(key, oldCn);
      }, failCb);
    } else {
      possiblyUpdateKeyGenerator(tx, me, key, keyCloneThenSuccess, failCb);
    }
    // Not auto-increment
  } else {
    keyCloneThenSuccess();
  }
};

/**
 *
 * @param {SQLTransaction} tx
 * @param {string} encoded
 * @param {import('./Key.js').Value} value
 * @param {import('./Key.js').Key|Integer} clonedKeyOrCurrentNumber
 * @param {Integer|undefined} oldCn
 * @param {(
 *   clonedKeyOrCurrentNumber: import('./Key.js').Key|Integer
 * ) => void} success
 * @param {(err: Error|DOMException) => void} error
 * @this {IDBObjectStoreFull}
 * @returns {SyncPromise}
 */
IDBObjectStore.prototype.__insertData = function (tx, encoded, value, clonedKeyOrCurrentNumber, oldCn, success, error) {
  const me = this;
  // The `ConstraintError` to occur for `add` upon a duplicate will occur naturally in attempting an insert
  // We process the index information first as it will stored in the same table as the store
  /** @type {{[key: string]: string}} */
  const paramMap = {};
  const indexPromises = Object.keys(
  // We do not iterate `indexNames` as those can be modified synchronously (e.g.,
  //   `deleteIndex` could, by its synchronous removal from `indexNames`, prevent
  //   iteration here of an index though per IndexedDB test
  //   `idbobjectstore_createIndex4-deleteIndex-event_order.js`, `createIndex`
  //   should be allowed to first fail even in such a case).
  me.__indexes).map(indexName => {
    // While this may sometimes resolve sync and sometimes async, the
    //   idea is to avoid, where possible, unnecessary delays (and
    //   consuming code ought to only see a difference in the browser
    //   where we can't control the transaction timeout anyways).
    return new SyncPromise((resolve, reject) => {
      const index = me.__indexes[indexName];
      if (
      // `createIndex` was called synchronously after the current insertion was added to
      //  the transaction queue so although it was added to `__indexes`, it is not yet
      //  ready to be checked here for the insertion as it will be when running the
      //  `createIndex` operation (e.g., if two items with the same key were added and
      //  *then* a unique index was created, it should not continue to err and abort
      //  yet, as we're still handling the insertions which must be processed (e.g., to
      //  add duplicates which then cause a unique index to fail))
      index.__pendingCreate ||
      // If already deleted (and not just slated for deletion (by `__pendingDelete`
      //  after this add), we avoid checks
      index.__deleted) {
        resolve(undefined);
        return;
      }
      /**
       * @type {import('./Key.js').KeyValueObject|
       *   import('./Key.js').KeyPathEvaluateValue}
       */
      let indexKey;
      try {
        indexKey = extractKeyValueDecodedFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Add as necessary to this and skip past this index if exceptions here)
        if ('invalid' in indexKey && indexKey.invalid || 'failure' in indexKey && indexKey.failure) {
          throw new Error('Go to catch');
        }
      } catch (err) {
        resolve(undefined);
        return;
      }
      indexKey = indexKey.value;
      /**
       * @param {import('./IDBIndex.js').IDBIndexFull} index
       * @returns {void}
       */
      function setIndexInfo(index) {
        if (indexKey === undefined) {
          return;
        }
        paramMap[index.__currentName] = /** @type {string} */
        encode$1(indexKey, index.multiEntry);
      }
      if (index.unique) {
        const multiCheck = index.multiEntry && Array.isArray(indexKey);
        const fetchArgs = buildFetchIndexDataSQL(true, index, indexKey, 'key', multiCheck);
        executeFetchIndexData(null, ...fetchArgs, tx, null, function success(key) {
          if (key === undefined) {
            setIndexInfo(index);
            resolve(undefined);
            return;
          }
          reject(createDOMException('ConstraintError', 'Index already contains a record equal to ' + (multiCheck ? 'one of the subkeys of' : '') + '`indexKey`'));
        }, reject);
      } else {
        setIndexInfo(index);
        resolve(undefined);
      }
    });
  });
  return SyncPromise.all(indexPromises).then(() => {
    const sqlStart = ['INSERT INTO', escapeStoreNameForSQL(me.__currentName), '('];
    const sqlEnd = [' VALUES ('];
    const insertSqlValues = [];
    if (clonedKeyOrCurrentNumber !== undefined) {
      // Key.convertValueToKey(primaryKey); // Already run
      sqlStart.push(sqlQuote('key'), ',');
      sqlEnd.push('?,');
      insertSqlValues.push(escapeSQLiteStatement(/** @type {string} */encode$1(clonedKeyOrCurrentNumber)));
    }
    Object.entries(paramMap).forEach(([key, stmt]) => {
      sqlStart.push(escapeIndexNameForSQL(key) + ',');
      sqlEnd.push('?,');
      insertSqlValues.push(escapeSQLiteStatement(stmt));
    });
    // removing the trailing comma
    sqlStart.push(sqlQuote('value') + ' )');
    sqlEnd.push('?)');
    insertSqlValues.push(escapeSQLiteStatement(encoded));
    const insertSql = sqlStart.join(' ') + sqlEnd.join(' ');
    if (CFG.DEBUG) {
      console.log('SQL for adding', insertSql, insertSqlValues);
    }
    tx.executeSql(insertSql, insertSqlValues, function () {
      success(clonedKeyOrCurrentNumber);
    }, function (tx, err) {
      // Should occur for `add` operation
      error(createDOMException('ConstraintError', /** @type {string} */err.message, err));
      return false;
    });
    return undefined;
  }).catch(function (err) {
    /**
     * @returns {void}
     */
    function fail() {
      // Todo: Add a different error object here if `assignCurrentNumber`
      //  fails in reverting?
      error(err);
    }
    if (typeof oldCn === 'number') {
      assignCurrentNumber(tx, me, oldCn, fail, fail);
      return null;
    }
    fail();
    return null;
  });
};

/**
 *
 * @param {import('./Key.js').Value} value
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.add = function (value /* , key */) {
  const me = this;
  // eslint-disable-next-line prefer-rest-params -- API
  const key = arguments[1];
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('No value was specified');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  me.transaction.__assertWritable();
  const request = /** @type {import('./IDBTransaction.js').IDBTransactionFull} */me.transaction.__createRequest(me);
  const [ky, clonedValue] = me.__validateKeyAndValueAndCloneValue(value, key, false);
  IDBObjectStore.__storingRecordObjectStore(request, me, true, clonedValue, true, ky);
  return request;
};

/**
 *
 * @param {import('./Key.js').Value} value
 * @throws {TypeError}
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.put = function (value /* , key */) {
  const me = this;
  // eslint-disable-next-line prefer-rest-params -- API
  const key = arguments[1];
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('No value was specified');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  me.transaction.__assertWritable();
  const request = /** @type {import('./IDBTransaction.js').IDBTransactionFull} */me.transaction.__createRequest(me);
  const [ky, clonedValue] = me.__validateKeyAndValueAndCloneValue(value, key, false);
  IDBObjectStore.__storingRecordObjectStore(request, me, true, clonedValue, false, ky);
  return request;
};

/**
 *
 * @param {SQLTransaction} tx
 * @param {import('./Key.js').Key} key
 * @param {(tx: SQLTransaction) => void} cb
 * @param {(err: SQLError) => void} error
 * @this {IDBObjectStoreFull}
 * @returns {void}
 */
IDBObjectStore.prototype.__overwrite = function (tx, key, cb, error) {
  const me = this;
  // First try to delete if the record exists
  // Key.convertValueToKey(key); // Already run
  const sql = 'DELETE FROM ' + escapeStoreNameForSQL(me.__currentName) + ' WHERE "key" = ?';
  const encodedKey = /** @type {string} */encode$1(key);
  tx.executeSql(sql, [escapeSQLiteStatement(encodedKey)], function (tx, data) {
    if (CFG.DEBUG) {
      console.log('Did the row with the', key, 'exist?', data.rowsAffected);
    }
    cb(tx);
  }, function (tx, err) {
    error(err);
    return false;
  });
};

/**
 *
 * @param {import('./IDBRequest.js').IDBRequestFull} request
 * @param {IDBObjectStoreFull} store
 * @param {boolean} invalidateCache
 * @param {import('./Key.js').Value} value
 * @param {boolean} noOverwrite
 * @returns {void}
 */
IDBObjectStore.__storingRecordObjectStore = function (request, store, invalidateCache, value, noOverwrite /* , key */) {
  // eslint-disable-next-line prefer-rest-params -- API
  const key = arguments[5];
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  store.transaction.__pushToQueue(request, function (tx, args, success, error) {
    store.__deriveKey(tx, value, key, function (clonedKeyOrCurrentNumber, oldCn) {
      encode(value, function (encoded) {
        /**
         * @param {SQLTransaction} tx
         * @returns {void}
         */
        function insert(tx) {
          store.__insertData(tx, encoded, value, clonedKeyOrCurrentNumber, oldCn, function (...args) {
            if (invalidateCache) {
              store.__cursors.forEach(cursor => {
                cursor.__invalidateCache();
              });
            }
            success(...args);
          }, error);
        }
        if (!noOverwrite) {
          store.__overwrite(tx, clonedKeyOrCurrentNumber, insert, error);
          return;
        }
        insert(tx);
      });
    }, error);
  });
};

/**
 *
 * @param {import('./Key.js').Value} query
 * @param {boolean} [getKey]
 * @param {boolean} [getAll]
 * @param {Integer} [count]
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.__get = function (query, getKey, getAll, count) {
  const me = this;
  if (count !== undefined) {
    count = enforceRange(count, 'unsigned long');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  const range = convertValueToKeyRange(query, !getAll);
  const col = getKey ? 'key' : 'value';
  const sql = ['SELECT', sqlQuote(col), 'FROM', escapeStoreNameForSQL(me.__currentName)];
  /** @type {string[]} */
  const sqlValues = [];
  if (range !== undefined) {
    sql.push('WHERE');
    setSQLForKeyRange(range, sqlQuote('key'), sql, sqlValues);
  }
  if (!getAll) {
    count = 1;
  }
  if (count) {
    if (!Number.isFinite(count)) {
      throw new TypeError('The count parameter must be a finite number');
    }
    sql.push('LIMIT', String(count));
  }
  const sqlStr = sql.join(' ');
  return /** @type {import('./IDBTransaction.js').IDBTransactionFull} */me.transaction.__addToTransactionQueue(function objectStoreGet(tx, args, success, error) {
    if (CFG.DEBUG) {
      console.log('Fetching', me.__currentName, sqlValues);
    }
    tx.executeSql(sqlStr, sqlValues, function (tx, data) {
      if (CFG.DEBUG) {
        console.log('Fetched data', data);
      }
      let ret;
      try {
        // Opera can't deal with the try-catch here.
        if (data.rows.length === 0) {
          if (getAll) {
            success([]);
          } else {
            success();
          }
          return;
        }
        ret = [];
        if (getKey) {
          for (let i = 0; i < data.rows.length; i++) {
            // Key.convertValueToKey(data.rows.item(i).key); // Already validated before storage
            ret.push(decode$1(unescapeSQLiteResponse(data.rows.item(i).key), false));
          }
        } else {
          for (let i = 0; i < data.rows.length; i++) {
            ret.push(decode(unescapeSQLiteResponse(data.rows.item(i).value)));
          }
        }
        if (!getAll) {
          ret = ret[0];
        }
      } catch (e) {
        // If no result is returned, or error occurs when parsing JSON
        if (CFG.DEBUG) {
          console.log(e);
        }
      }
      success(ret);
    }, function (tx, err) {
      error(err);
      return false;
    });
  }, undefined, me);
};

/**
 *
 * @param {import('./Key.js').Value} query
 * @throws {TypeError}
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.get = function (query) {
  if (!arguments.length) {
    throw new TypeError('A parameter was missing for `IDBObjectStore.get`.');
  }
  return this.__get(query);
};

/**
 *
 * @param {import('./Key.js').Value} query
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.getKey = function (query) {
  if (!arguments.length) {
    throw new TypeError('A parameter was missing for `IDBObjectStore.getKey`.');
  }
  return this.__get(query, true);
};

/**
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.getAll = function /* query, count */
() {
  // eslint-disable-next-line prefer-rest-params -- API
  const [query, count] = arguments;
  return this.__get(query, false, true, count);
};

/**
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.getAllKeys = function /* query, count */
() {
  // eslint-disable-next-line prefer-rest-params -- API
  const [query, count] = arguments;
  return this.__get(query, true, true, count);
};

/**
 *
 * @param {import('./Key.js').Value} query
 * @throws {TypeError}
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.delete = function (query) {
  const me = this;
  if (!(this instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  if (!arguments.length) {
    throw new TypeError('A parameter was missing for `IDBObjectStore.delete`.');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  me.transaction.__assertWritable();
  const range = convertValueToKeyRange(query, true);
  const sqlArr = ['DELETE FROM', escapeStoreNameForSQL(me.__currentName), 'WHERE'];
  /** @type {string[]} */
  const sqlValues = [];
  setSQLForKeyRange(range, sqlQuote('key'), sqlArr, sqlValues);
  const sql = sqlArr.join(' ');
  return /** @type {import('./IDBTransaction.js').IDBTransactionFull} */me.transaction.__addToTransactionQueue(function objectStoreDelete(tx, args, success, error) {
    if (CFG.DEBUG) {
      console.log('Deleting', me.__currentName, sqlValues);
    }
    tx.executeSql(sql, sqlValues, function (tx, data) {
      if (CFG.DEBUG) {
        console.log('Deleted from database', data.rowsAffected);
      }
      me.__cursors.forEach(cursor => {
        cursor.__invalidateCache(); // Delete
      });
      success();
    }, function (tx, err) {
      error(err);
      return false;
    });
  }, undefined, me);
};

/**
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.clear = function () {
  const me = this;
  if (!(this instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  me.transaction.__assertWritable();
  return /** @type {import('./IDBTransaction.js').IDBTransactionFull} */me.transaction.__addToTransactionQueue(function objectStoreClear(tx, args, success, error) {
    tx.executeSql('DELETE FROM ' + escapeStoreNameForSQL(me.__currentName), [], function (tx, data) {
      if (CFG.DEBUG) {
        console.log('Cleared all records from database', data.rowsAffected);
      }
      me.__cursors.forEach(cursor => {
        cursor.__invalidateCache(); // Clear
      });
      success();
    }, function (tx, err) {
      error(err);
      return false;
    });
  }, undefined, me);
};

/**
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.count = function /* query */
() {
  const me = this;
  // eslint-disable-next-line prefer-rest-params -- API
  const query = arguments[0];
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);

  // We don't need to add to cursors array since has the count parameter which won't cache
  return IDBCursorWithValue.__createInstance(query, 'next', me, me, 'key', 'value', true).__request;
};

/**
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.openCursor = function /* query, direction */
() {
  const me = this;
  // eslint-disable-next-line prefer-rest-params -- API
  const [query, direction] = arguments;
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  const cursor = IDBCursorWithValue.__createInstance(query, direction, me, me, 'key', 'value');
  me.__cursors.push(cursor);
  return cursor.__request;
};

/**
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBRequest.js').IDBRequestFull}
 */
IDBObjectStore.prototype.openKeyCursor = function /* query, direction */
() {
  const me = this;
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  // eslint-disable-next-line prefer-rest-params -- API
  const [query, direction] = arguments;
  const cursor = IDBCursor.__createInstance(query, direction, me, me, 'key', 'key');
  me.__cursors.push(cursor);
  return cursor.__request;
};

/**
 *
 * @param {string} indexName
 * @this {IDBObjectStoreFull}
 * @returns {import('./IDBIndex.js').IDBIndexFull}
 */
IDBObjectStore.prototype.index = function (indexName) {
  const me = this;
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('No index name was specified');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertNotFinished(me.transaction);
  const index = me.__indexes[indexName];
  if (!index || index.__deleted) {
    throw createDOMException('NotFoundError', 'Index "' + indexName + '" does not exist on ' + me.__currentName);
  }
  if (!Object.hasOwn(me.__indexHandles, indexName) || me.__indexes[indexName].__pendingDelete || me.__indexes[indexName].__deleted) {
    me.__indexHandles[indexName] = IDBIndex.__clone(index, me);
  }
  return me.__indexHandles[indexName];
};

/**
 * Creates a new index on the object store.
 * @param {string} indexName
 * @param {string|string[]} keyPath
 * @this {IDBObjectStoreFull}
 * @returns {IDBIndex}
 */
IDBObjectStore.prototype.createIndex = function (indexName, keyPath /* , optionalParameters */) {
  const me = this;
  // eslint-disable-next-line prefer-rest-params -- API
  let optionalParameters = arguments[2];
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  indexName = String(indexName); // W3C test within IDBObjectStore.js seems to accept string conversion
  if (arguments.length === 0) {
    throw new TypeError('No index name was specified');
  }
  if (arguments.length === 1) {
    throw new TypeError('No key path was specified');
  }
  IDBTransaction.__assertVersionChange(me.transaction);
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  if (Object.hasOwn(me.__indexes, indexName) && !me.__indexes[indexName].__deleted && !me.__indexes[indexName].__pendingDelete) {
    throw createDOMException('ConstraintError', 'Index "' + indexName + '" already exists on ' + me.__currentName);
  }
  keyPath = convertToSequenceDOMString(keyPath);
  if (!isValidKeyPath(keyPath)) {
    throw createDOMException('SyntaxError', 'A valid keyPath must be supplied');
  }
  if (Array.isArray(keyPath) && optionalParameters && optionalParameters.multiEntry) {
    throw createDOMException('InvalidAccessError', 'The keyPath argument was an array and the multiEntry option is true.');
  }
  optionalParameters ||= {};
  /** @type {import('./IDBIndex.js').IDBIndexProperties} */
  const indexProperties = {
    columnName: indexName,
    keyPath,
    optionalParams: {
      unique: Boolean(optionalParameters.unique),
      multiEntry: Boolean(optionalParameters.multiEntry)
    }
  };
  const index = IDBIndex.__createInstance(me, indexProperties);
  IDBIndex.__createIndex(me, index);
  return index;
};

/**
 *
 * @param {string} name
 * @this {IDBObjectStoreFull}
 * @returns {void}
 */
IDBObjectStore.prototype.deleteIndex = function (name) {
  const me = this;
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('No index name was specified');
  }
  IDBTransaction.__assertVersionChange(me.transaction);
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  const index = me.__indexes[name];
  if (!index) {
    throw createDOMException('NotFoundError', 'Index "' + name + '" does not exist on ' + me.__currentName);
  }
  IDBIndex.__deleteIndex(me, index);
};

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
defineReadonlyOuterInterface(IDBObjectStore.prototype, readonlyProperties$1);
defineOuterInterface(IDBObjectStore.prototype, ['name']);
IDBObjectStore.prototype[Symbol.toStringTag] = 'IDBObjectStorePrototype';
Object.defineProperty(IDBObjectStore, 'prototype', {
  writable: false
});

const listeners = ['onabort', 'onclose', 'onerror', 'onversionchange'];
const readonlyProperties = ['name', 'version', 'objectStoreNames'];

/**
 * @typedef {{
 *   name: string,
 *   keyPath: import('./Key.js').KeyPath,
 *   autoInc: boolean,
 *   indexList: {[key: string]: import('./IDBIndex.js').IDBIndexProperties},
 *   idbdb: IDBDatabaseFull,
 *   cursors?: (import('./IDBCursor.js').IDBCursorFull|
 *     import('./IDBCursor.js').IDBCursorWithValueFull)[],
 * }} IDBObjectStoreProperties
 */

/**
 * IDB Database Object.
 * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
 * @class
 * @throws {TypeError}
 */
function IDBDatabase() {
  this.__versionTransaction = null;
  this.__objectStores = null;
  /** @type {import('./IDBTransaction.js').IDBTransactionFull[]} */
  this.__transactions = [];
  throw new TypeError('Illegal constructor');
}
const IDBDatabaseAlias = IDBDatabase;

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {IDBDatabase & EventTarget & {
 *   createObjectStore: (storeName: string) => IDBObjectStore,
 *   deleteObjectStore: (storeName: string) => void,
 *   close: () => void,
 *   transaction: (storeNames: string|string[], mode: string) => IDBTransaction,
 *   throwIfUpgradeTransactionNull: () => void,
 *   objectStoreNames: import('./DOMStringList.js').DOMStringListFull,
 *   name: string,
 *   __forceClose: (msg: string) => void,
 *   __db: import('websql-configurable/lib/websql/WebSQLDatabase.js').default,
 *   __oldVersion: Integer,
 *   __version: Integer,
 *   __name: string,
 *   __upgradeTransaction: null|import('./IDBTransaction.js').IDBTransactionFull,
 *   __versionTransaction: import('./IDBTransaction.js').IDBTransactionFull,
 *   __transactions: import('./IDBTransaction.js').IDBTransactionFull[],
 *   __objectStores: {[key: string]: IDBObjectStore},
 *   __objectStoreNames: import('./DOMStringList.js').DOMStringListFull,
 *   __oldObjectStoreNames: import('./DOMStringList.js').DOMStringListFull,
 *   __unblocking: {
 *     check: () => void
 *   }
 * }} IDBDatabaseFull
 */

/**
 * @param {import('websql-configurable').default} db
 * @param {string} name
 * @param {Integer} oldVersion
 * @param {Integer} version
 * @param {SQLResultSet} storeProperties
 * @returns {IDBDatabaseFull}
 */
IDBDatabase.__createInstance = function (db, name, oldVersion, version, storeProperties) {
  /**
   * @class
   * @this {IDBDatabaseFull}
   */
  function IDBDatabase() {
    // @ts-expect-error It's ok
    this[Symbol.toStringTag] = 'IDBDatabase';
    defineReadonlyProperties(this, readonlyProperties);
    this.__db = db;
    this.__closePending = false;
    this.__oldVersion = oldVersion;
    this.__version = version;
    this.__name = name;
    this.__upgradeTransaction = null;
    defineListenerProperties(this, listeners);
    // @ts-expect-error Part of `ShimEventTarget`
    this.__setOptions({
      legacyOutputDidListenersThrowFlag: true // Event hook for IndexedB
    });

    /** @type {import('./IDBTransaction.js').IDBTransactionFull[]} */
    this.__transactions = [];

    /** @type {{[key: string]: IDBObjectStore}} */
    this.__objectStores = {};
    this.__objectStoreNames = DOMStringList.__createInstance();

    /**
     * @type {IDBObjectStoreProperties}
     */
    const itemCopy = {};
    for (let i = 0; i < storeProperties.rows.length; i++) {
      const item = storeProperties.rows.item(i);
      // Safari implements `item` getter return object's properties
      //  as readonly, so we copy all its properties (except our
      //  custom `currNum` which we don't need) onto a new object
      itemCopy.name = item.name;
      itemCopy.keyPath = JSON.parse(item.keyPath);
      // Though `autoInc` is coming from the database as a NUMERIC
      // type (how SQLite stores BOOLEAN set in CREATE TABLE),
      // and should thus be parsed into a number here (0 or 1),
      // `IDBObjectStore.__createInstance` will convert to a boolean
      // when setting the store's `autoIncrement`.
      /** @type {const} */
      ['autoInc', 'indexList'].forEach(prop => {
        itemCopy[prop] = JSON.parse(item[prop]);
      });
      itemCopy.idbdb = this;
      const store = IDBObjectStore.__createInstance(itemCopy);
      this.__objectStores[store.name] = store;
      this.objectStoreNames.push(store.name);
    }
    this.__oldObjectStoreNames = this.objectStoreNames.clone();
  }
  IDBDatabase.prototype = IDBDatabaseAlias.prototype;

  // @ts-expect-error It's ok
  return new IDBDatabase();
};

// @ts-expect-error It's ok
IDBDatabase.prototype = EventTargetFactory.createInstance();
IDBDatabase.prototype[Symbol.toStringTag] = 'IDBDatabasePrototype';

/**
 * Creates a new object store.
 * @param {string} storeName
 * @this {IDBDatabaseFull}
 * @returns {IDBObjectStore}
 */
IDBDatabase.prototype.createObjectStore = function (storeName /* , createOptions */) {
  // eslint-disable-next-line prefer-rest-params -- API
  let createOptions = arguments[1];
  storeName = String(storeName); // W3C test within IDBObjectStore.js seems to accept string conversion
  if (!(this instanceof IDBDatabase)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('No object store name was specified');
  }
  IDBTransaction.__assertVersionChange(this.__versionTransaction); // this.__versionTransaction may not exist if called mistakenly by user in onsuccess
  this.throwIfUpgradeTransactionNull();
  IDBTransaction.__assertActive(this.__versionTransaction);
  createOptions = {
    ...createOptions
  };
  let {
    keyPath
  } = createOptions;
  keyPath = keyPath === undefined ? null : convertToSequenceDOMString(keyPath);
  if (keyPath !== null && !isValidKeyPath(keyPath)) {
    throw createDOMException('SyntaxError', 'The keyPath argument contains an invalid key path.');
  }
  if (Object.hasOwn(this.__objectStores, storeName) && !this.__objectStores[storeName].__pendingDelete) {
    throw createDOMException('ConstraintError', 'Object store "' + storeName + '" already exists in ' + this.name);
  }
  const autoInc = createOptions.autoIncrement;
  if (autoInc && (keyPath === '' || Array.isArray(keyPath))) {
    throw createDOMException('InvalidAccessError', 'With autoIncrement set, the keyPath argument must not be an array or empty string.');
  }

  /** @type {IDBObjectStoreProperties} */
  const storeProperties = {
    name: storeName,
    keyPath,
    autoInc,
    indexList: {},
    idbdb: this
  };
  const store = IDBObjectStore.__createInstance(storeProperties, this.__versionTransaction);
  return IDBObjectStore.__createObjectStore(this, store);
};

/**
 * Deletes an object store.
 * @param {string} storeName
 * @throws {TypeError|DOMException}
 * @this {IDBDatabaseFull}
 * @returns {void}
 */
IDBDatabase.prototype.deleteObjectStore = function (storeName) {
  if (!(this instanceof IDBDatabase)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('No object store name was specified');
  }
  IDBTransaction.__assertVersionChange(this.__versionTransaction);
  this.throwIfUpgradeTransactionNull();
  IDBTransaction.__assertActive(this.__versionTransaction);
  const store = this.__objectStores[storeName];
  if (!store) {
    throw createDOMException('NotFoundError', 'Object store "' + storeName + '" does not exist in ' + this.name);
  }
  IDBObjectStore.__deleteObjectStore(this, store);
};

/**
 * @throws {TypeError}
 * @this {IDBDatabaseFull}
 * @returns {void}
 */
IDBDatabase.prototype.close = function () {
  if (!(this instanceof IDBDatabase)) {
    throw new TypeError('Illegal invocation');
  }
  this.__closePending = true;
  if (this.__unblocking) {
    this.__unblocking.check();
  }
  this.__transactions = [];
};

/**
 * Starts a new transaction.
 * @param {string|string[]} storeNames
 * @this {IDBDatabaseFull}
 * @returns {import('./IDBTransaction.js').IDBTransactionFull}
 */
IDBDatabase.prototype.transaction = function (storeNames /* , mode */) {
  if (arguments.length === 0) {
    throw new TypeError('You must supply a valid `storeNames` to `IDBDatabase.transaction`');
  }
  // eslint-disable-next-line prefer-rest-params -- API
  let mode = arguments[1];
  storeNames = isIterable(storeNames)
  // Creating new array also ensures sequence is passed by value: https://heycam.github.io/webidl/#idl-sequence
  ? [...new Set(
  // to be unique
  convertToSequenceDOMString(storeNames) // iterables have `ToString` applied (and we convert to array for convenience)
  // eslint-disable-next-line unicorn/require-array-sort-compare -- IndexedDB requires code unit comparison (default behavior)
  )].toSorted() // must be sorted
  : [convertToDOMString(storeNames)];

  /* (function () {
      throw new TypeError('You must supply a valid `storeNames` to `IDBDatabase.transaction`');
  }())); */

  // Since SQLite (at least node-websql and definitely WebSQL) requires
  //   locking of the whole database, to allow simultaneous readwrite
  //   operations on transactions without overlapping stores, we'd probably
  //   need to save the stores in separate databases (we could also consider
  //   prioritizing readonly but not starving readwrite).
  // Even for readonly transactions, due to [issue 17](https://github.com/nolanlawson/node-websql/issues/17),
  //   we're not currently actually running the SQL requests in parallel.
  mode ||= 'readonly';
  IDBTransaction.__assertNotVersionChange(this.__versionTransaction);
  if (this.__closePending) {
    throw createDOMException('InvalidStateError', 'An attempt was made to start a new transaction on a database connection that is not open');
  }
  const objectStoreNames = DOMStringList.__createInstance();
  storeNames.forEach(storeName => {
    if (!this.objectStoreNames.contains(storeName)) {
      throw createDOMException('NotFoundError', 'The "' + storeName + '" object store does not exist');
    }
    objectStoreNames.push(storeName);
  });
  if (storeNames.length === 0) {
    throw createDOMException('InvalidAccessError', 'No valid object store names were specified');
  }
  if (mode !== 'readonly' && mode !== 'readwrite') {
    throw new TypeError('Invalid transaction mode: ' + mode);
  }

  // Do not set transaction state to "inactive" yet (will be set after
  //   timeout on creating transaction instance):
  //   https://github.com/w3c/IndexedDB/issues/87
  const trans = IDBTransaction.__createInstance(this, objectStoreNames, mode);
  this.__transactions.push(trans);
  return trans;
};

/**
 * @see https://github.com/w3c/IndexedDB/issues/192
 * @throws {DOMException}
 * @this {IDBDatabaseFull}
 * @returns {void}
 */
IDBDatabase.prototype.throwIfUpgradeTransactionNull = function () {
  if (this.__upgradeTransaction === null) {
    throw createDOMException('InvalidStateError', 'No upgrade transaction associated with database.');
  }
};

// Todo __forceClose: Add tests for `__forceClose`
/**
 *
 * @param {string} msg
 * @this {IDBDatabaseFull}
 * @returns {void}
 */
IDBDatabase.prototype.__forceClose = function (msg) {
  const me = this;
  me.close();
  let ct = 0;
  me.__transactions.forEach(function (trans) {
    // eslint-disable-next-line camelcase -- Clear API
    trans.on__abort = function () {
      ct++;
      if (ct === me.__transactions.length) {
        // Todo __forceClose: unblock any pending `upgradeneeded` or `deleteDatabase` calls
        const evt = createEvent('close');
        setTimeout(() => {
          me.dispatchEvent(evt);
        }, 0);
      }
    };
    trans.__abortTransaction(createDOMException('AbortError', 'The connection was force-closed: ' + (msg || '')));
  });
  me.__transactions = [];
};
/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
defineOuterInterface(IDBDatabase.prototype, listeners);
defineReadonlyOuterInterface(IDBDatabase.prototype, readonlyProperties);
Object.defineProperty(IDBDatabase.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: IDBDatabase
});
Object.defineProperty(IDBDatabase, 'prototype', {
  writable: false
});

/* eslint-disable sonarjs/no-invariant-returns -- Convenient here */
// eslint-disable-next-line no-restricted-imports -- Can be polyfilled

/**
 * @typedef {number} Integer
 */

/**
 * @callback DatabaseDeleted
 * @returns {void}
 */

/** @type {import('./CFG.js').FSApi} */
let fs;

/**
 * @param {import('./CFG.js').FSApi} _fs
 * @returns {void}
 */
const setFS = _fs => {
  // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Necessary?
  fs = _fs;
};

/**
 * @returns {string}
 */
const getOrigin = () => {
  return typeof location !== 'object' || !location ? 'null' : location.origin;
};
const hasNullOrigin = () => CFG.checkOrigin !== false && getOrigin() === 'null';

// Todo: This really should be process and tab-independent so the
//  origin could vary; in the browser, this might be through a
//  `SharedWorker`

/**
 * @type {{
 *   [key: string]: {
 *     [key: string]: {
 *       req: import('./IDBRequest.js').IDBOpenDBRequestFull,
 *       cb: (req: import('./IDBRequest.js').IDBRequestFull) => void,
 *     }[]
 *   }
 * }}
 */
const connectionQueue = {};

/**
 * @param {string} name
 * @param {string} origin
 * @returns {void}
 */
function processNextInConnectionQueue(name, origin = getOrigin()) {
  const queueItems = connectionQueue[origin][name];
  if (!queueItems[0]) {
    // Nothing left to process
    return;
  }
  const {
    req,
    cb
  } = queueItems[0]; // Keep in queue to prevent continuation

  /**
   * @returns {void}
   */
  function removeFromQueue() {
    queueItems.shift();
    processNextInConnectionQueue(name, origin);
  }
  req.addEventListener('success', removeFromQueue);
  req.addEventListener('error', removeFromQueue);
  req.addEventListener('blocked', removeFromQueue);
  cb(req);
}

/* eslint-disable default-param-last -- Keep cb at end */
/**
 * @param {import('./IDBRequest.js').IDBOpenDBRequestFull} req
 * @param {string} name
 * @param {string} origin
 * @param {(req: import('./IDBRequest.js').IDBOpenDBRequestFull) => void} cb
 * @returns {void}
 */
function addRequestToConnectionQueue(req, name, origin = getOrigin(), cb) {
  /* eslint-enable default-param-last -- Keep cb at end */
  if (!Object.hasOwn(connectionQueue[origin], name)) {
    connectionQueue[origin][name] = [];
  }
  connectionQueue[origin][name].push({
    req,
    cb
  });
  if (connectionQueue[origin][name].length === 1) {
    // If there are no items in the queue, we have to start it
    processNextInConnectionQueue(name, origin);
  }
}

/**
 * @param {import('./IDBDatabase.js').IDBDatabaseFull[]} openConnections
 * @param {import('./IDBRequest.js').IDBRequestFull} req
 * @param {Integer} oldVersion
 * @param {Integer|null} newVersion
 * @returns {SyncPromise}
 */
function triggerAnyVersionChangeAndBlockedEvents(openConnections, req, oldVersion, newVersion) {
  // Todo: For Node (and in browser using service workers if available?) the
  //    connections ought to involve those in any process; should also
  //    auto-close if unloading

  /**
   * @param {IDBDatabase} connection
   * @returns {boolean|undefined}
   */
  const connectionIsClosed = connection => connection.__closePending;
  const connectionsClosed = () => openConnections.every(conn => {
    return connectionIsClosed(conn);
  });
  return openConnections.reduce(function (promises, entry) {
    if (connectionIsClosed(entry)) {
      return promises;
    }
    return promises.then(function () {
      if (connectionIsClosed(entry)) {
        // Prior onversionchange must have caused this connection to be closed
        return undefined;
      }
      const e = /** @type {Event & IDBVersionChangeEvent} */
      new IDBVersionChangeEvent('versionchange', {
        oldVersion,
        newVersion
      });
      return new SyncPromise(function (resolve) {
        setTimeout(() => {
          entry.dispatchEvent(e); // No need to catch errors
          resolve(undefined);
        }, 0);
      });
    });
  }, SyncPromise.resolve(undefined)).then(function () {
    if (connectionsClosed()) {
      return undefined;
    }
    return new SyncPromise(function (resolve) {
      const unblocking = {
        check() {
          if (connectionsClosed()) {
            resolve(undefined);
          }
        }
      };
      const e = /** @type {Event & IDBVersionChangeEvent} */
      new IDBVersionChangeEvent('blocked', {
        oldVersion,
        newVersion
      });
      setTimeout(() => {
        req.dispatchEvent(e); // No need to catch errors
        if (!connectionsClosed()) {
          openConnections.forEach(connection => {
            if (!connectionIsClosed(connection)) {
              connection.__unblocking = unblocking;
            }
          });
        } else {
          resolve(undefined);
        }
      }, 0);
    });
  });
}

/**
 * @typedef {import('websql-configurable/lib/websql/WebSQLDatabase.js').default & {
 *   _db: {
 *     _db: {
 *       close: (errBack: (err: Error) => void) => void
 *     }
 *   }
 * }} DatabaseFull
 */

/**
 * @type {{
 *   [key: string]: {
 *     [key: string]: DatabaseFull
 *   }
 * }}
 */
const websqlDBCache = {};

/** @type {import('websql-configurable/lib/websql/WebSQLDatabase.js').default} */
let sysdb;
let nameCounter = 0;

/**
 * @param {string} name
 * @returns {Integer}
 */
function getLatestCachedWebSQLVersion(name) {
  return Object.keys(websqlDBCache[name]).map(Number).reduce((prev, curr) => {
    return Math.max(curr, prev);
  }, 0);
}

/**
 * @param {string} name
 * @returns {DatabaseFull}
 */
function getLatestCachedWebSQLDB(name) {
  return websqlDBCache[name] && websqlDBCache[name][getLatestCachedWebSQLVersion(name)];
}

/**
 * @param {OpenDatabase} __openDatabase
 * @param {string} name
 * @param {string} escapedDatabaseName
 * @param {DatabaseDeleted} databaseDeleted
 * @param {(tx: SQLTransaction|Error|SQLError, err?: SQLError) => boolean} dbError
 * @returns {void}
 */
function cleanupDatabaseResources(__openDatabase, name, escapedDatabaseName, databaseDeleted, dbError) {
  const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
  if (useMemoryDatabase) {
    const latestSQLiteDBCached = Object.hasOwn(websqlDBCache, name) ? getLatestCachedWebSQLDB(name) : null;
    if (!latestSQLiteDBCached) {
      console.warn('Could not find a memory database instance to delete.');
      databaseDeleted();
      return;
    }
    const sqliteDB = latestSQLiteDBCached._db && latestSQLiteDBCached._db._db;
    if (!sqliteDB || !sqliteDB.close) {
      console.error('The `openDatabase` implementation does not have the expected `._db._db.close` method for closing the database');
      return;
    }
    sqliteDB.close(
    /**
     * @param {Error} err
     * @returns {void}
     */
    err => {
      if (err) {
        console.warn('Error closing (destroying) memory database');
        return;
      }
      databaseDeleted();
    });
    return;
  }
  if (fs && CFG.deleteDatabaseFiles !== false) {
    fs.unlink(path.join(CFG.databaseBasePath || '', escapedDatabaseName), err => {
      if (err && err.code !== 'ENOENT') {
        // Ignore if file is already deleted
        dbError({
          code: 0,
          message: 'Error removing database file: ' + escapedDatabaseName + ' ' + err
        });
        return;
      }
      databaseDeleted();
    });
    return;
  }
  const sqliteDB = __openDatabase(path.join(CFG.databaseBasePath || '', escapedDatabaseName), '1', name, CFG.DEFAULT_DB_SIZE);
  sqliteDB.transaction(function (tx) {
    tx.executeSql('SELECT "name" FROM __sys__', [], function (tx, data) {
      const tables = data.rows;
      (function deleteTables(i) {
        if (i >= tables.length) {
          // If all tables are deleted, delete the housekeeping tables
          tx.executeSql('DROP TABLE IF EXISTS __sys__', [], function () {
            databaseDeleted();
          }, dbError);
        } else {
          // Delete all tables in this database, maintained in the sys table
          tx.executeSql('DROP TABLE ' + escapeStoreNameForSQL(unescapeSQLiteResponse(
          // Avoid double-escaping
          tables.item(i).name)), [], function () {
            deleteTables(i + 1);
          }, function () {
            deleteTables(i + 1);
            return false;
          });
        }
      })(0);
    }, function () {
      // __sys__ table does not exist, but that does not mean delete did not happen
      databaseDeleted();
      return false;
    });
  });
}

/**
 * @callback CreateSysDBSuccessCallback
 * @returns {void}
 */

/**
 * Creates the sysDB to keep track of version numbers for databases.
 * @param {OpenDatabase} __openDatabase
 * @param {CreateSysDBSuccessCallback} success
 * @param {(tx: SQLTransaction|SQLError|Error, err?: SQLError) => void} failure
 * @returns {void}
 */
function createSysDB(__openDatabase, success, failure) {
  /**
   *
   * @param {boolean|SQLTransaction|SQLError} tx
   * @param {SQLError} [err]
   * @returns {void}
   */
  function sysDbCreateError(tx, err) {
    const er = webSQLErrback(/** @type {SQLError} */err || tx);
    if (CFG.DEBUG) {
      console.log('Error in sysdb transaction - when creating dbVersions', err);
    }
    failure(er);
  }
  if (sysdb) {
    success();
  } else {
    // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Necessary?
    sysdb = __openDatabase(typeof CFG.memoryDatabase === 'string' ? CFG.memoryDatabase : path.join(typeof CFG.sysDatabaseBasePath === 'string' ? CFG.sysDatabaseBasePath : CFG.databaseBasePath || '', '__sysdb__' + (CFG.addSQLiteExtension !== false ? '.sqlite' : '')), '1', 'System Database', CFG.DEFAULT_DB_SIZE);
    sysdb.transaction(function (systx) {
      systx.executeSql('CREATE TABLE IF NOT EXISTS dbVersions (name BLOB, version INT);', [], function (systx) {
        if (!CFG.useSQLiteIndexes) {
          success();
          return;
        }
        systx.executeSql('CREATE INDEX IF NOT EXISTS dbvname ON dbVersions(name)', [], success, /** @type {SQLStatementErrorCallback} */sysDbCreateError);
      }, /** @type {SQLStatementErrorCallback} */sysDbCreateError);
    }, sysDbCreateError);
  }
}

/**
 * IDBFactory Class.
 * @see https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
 * @throws {TypeError}
 * @class
 */
function IDBFactory() {
  throw new TypeError('Illegal constructor');
}

/**
 * @typedef {(
 *   name: string, version: string, displayName: string, estimatedSize: number
 * ) => import('websql-configurable/lib/websql/WebSQLDatabase.js').default} OpenDatabase
 */

/**
 * @typedef {globalThis.IDBFactory & {
 *   __openDatabase: OpenDatabase,
 *   __connections: {
 *     [key: string]: import('./IDBDatabase.js').IDBDatabaseFull[]
 *   }
 * }} IDBFactoryFull
 */

const IDBFactoryAlias = IDBFactory;
/**
 * @returns {IDBFactoryFull}
 */
IDBFactory.__createInstance = function () {
  /**
   * @class
   */
  function IDBFactory() {
    this[Symbol.toStringTag] = 'IDBFactory';
    this.__connections = {};
  }
  IDBFactory.prototype = IDBFactoryAlias.prototype;

  // @ts-expect-error It's ok
  return new IDBFactory();
};

/**
 * The IndexedDB Method to create a new database and return the DB.
 * @param {string} name
 * @this {IDBFactoryFull}
 * @throws {TypeError} Illegal invocation or no arguments (for database name)
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.open = function (name /* , version */) {
  const me = this;
  if (!(me instanceof IDBFactory)) {
    throw new TypeError('Illegal invocation');
  }
  // eslint-disable-next-line prefer-rest-params -- API
  let version = arguments[1];
  if (arguments.length === 0) {
    throw new TypeError('Database name is required');
  }
  if (version !== undefined) {
    version = enforceRange(version, 'unsigned long long');
    if (version === 0) {
      throw new TypeError('Version cannot be 0');
    }
  }
  if (hasNullOrigin()) {
    throw createDOMException('SecurityError', 'Cannot open an IndexedDB database from an opaque origin.');
  }
  const req = IDBOpenDBRequest.__createInstance();
  let calledDbCreateError = false;
  if (CFG.autoName && name === '') {
    // eslint-disable-next-line unicorn/no-top-level-assignment-in-function -- Necessary?
    name = 'autoNamedDatabase_' + nameCounter++;
  }
  name = String(name); // cast to a string
  const sqlSafeName = escapeSQLiteStatement(name);
  const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
  const useDatabaseCache = CFG.cacheDatabaseInstances !== false || useMemoryDatabase;

  /** @type {string} */
  let escapedDatabaseName;
  // eslint-disable-next-line no-useless-catch -- Possible refactoring
  try {
    escapedDatabaseName = escapeDatabaseNameForSQLAndFiles(name);
    // eslint-disable-next-line sonarjs/no-useless-catch -- Possible refactoring
  } catch (err) {
    throw err; // new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
  }

  /**
   *
   * @param {SQLTransaction|Error|SQLError} tx
   * @param {SQLError} [err]
   * @returns {boolean}
   */
  function dbCreateError(tx, err) {
    if (calledDbCreateError) {
      return false;
    }
    const er = err ? webSQLErrback(err) : (/** @type {Error} */tx);
    calledDbCreateError = true;
    // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
    const evt = createEvent('error', er, {
      bubbles: true,
      cancelable: true
    });
    req.__done = true;
    req.__error = er;
    req.__result = undefined; // Must be undefined if an error per `result` getter
    req.dispatchEvent(evt);
    return false;
  }

  /**
   *
   * @param {SQLTransaction} tx
   * @param {DatabaseFull} db
   * @param {Integer} oldVersion
   * @returns {void}
   */
  function setupDatabase(tx, db, oldVersion) {
    tx.executeSql('SELECT "name", "keyPath", "autoInc", "indexList" FROM __sys__', [], function (tx, data) {
      /**
       * @returns {void}
       */
      function finishRequest() {
        req.__result = connection;
        req.__done = true;
      }
      const connection = IDBDatabase.__createInstance(db, name, oldVersion, version, data);
      if (!Object.hasOwn(me.__connections, name)) {
        me.__connections[name] = [];
      }
      me.__connections[name].push(connection);
      if (oldVersion < version) {
        const openConnections = me.__connections[name].slice(0, -1);
        triggerAnyVersionChangeAndBlockedEvents(openConnections, req, oldVersion, version).then(function () {
          // DB Upgrade in progress
          /**
           *
           * @param {SQLTransaction} systx
           * @param {boolean|SQLError|DOMException|Error} err
           * @param {(tx?: SQLTransaction|SQLError, err?: SQLError|SQLResultSet) => boolean} cb
           * @returns {void}
           */
          let sysdbFinishedCb = function (systx, err, cb) {
            if (err) {
              try {
                systx.executeSql('ROLLBACK', [], cb, cb);
              } catch (err) {
                // Browser may fail with expired transaction above so
                //     no choice but to manually revert
                sysdb.transaction(function (systx) {
                  /**
                   *
                   * @param {string} msg
                   * @throws {Error}
                   * @returns {never}
                   */
                  function reportError(msg) {
                    throw new Error('Unable to roll back upgrade transaction!' + (msg || ''));
                  }

                  // Attempt to revert
                  if (oldVersion === 0) {
                    systx.executeSql('DELETE FROM dbVersions WHERE "name" = ?', [sqlSafeName], function () {
                      // @ts-expect-error Force to work
                      cb(reportError); // eslint-disable-line promise/no-callback-in-promise -- Convenient
                    },
                    // @ts-expect-error Force to work
                    reportError);
                  } else {
                    systx.executeSql('UPDATE dbVersions SET "version" = ? WHERE "name" = ?', [oldVersion, sqlSafeName], cb,
                    // @ts-expect-error Force to work
                    reportError);
                  }
                });
              }
              return;
            }
            // In browser, should auto-commit
            cb(); // eslint-disable-line promise/no-callback-in-promise -- Convenient
          };
          sysdb.transaction(function (systx) {
            /**
             * @returns {void}
             */
            function versionSet() {
              const e = /** @type {import('eventtargeter').EventWithProps & Event & IDBVersionChangeEvent} */
              new IDBVersionChangeEvent('upgradeneeded', {
                oldVersion,
                newVersion: version
              });
              req.__result = connection;
              connection.__upgradeTransaction = req.__transaction = req.__result.__versionTransaction = IDBTransaction.__createInstance(req.__result, req.__result.objectStoreNames, 'versionchange');
              req.__done = true;
              req.transaction.__addNonRequestToTransactionQueue(function onupgradeneeded(tx, args, finished /* , error */) {
                req.dispatchEvent(e);
                if (e.__legacyOutputDidListenersThrowError) {
                  logError('Error', 'An error occurred in an upgradeneeded handler attached to request chain', /** @type {Error} */e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
                  req.transaction.__abortTransaction(createDOMException('AbortError', 'A request was aborted.'));
                  return;
                }
                finished();
              });

              // eslint-disable-next-line camelcase -- Clear API
              req.transaction.on__beforecomplete = function (ev) {
                connection.__upgradeTransaction = null;
                /** @type {import('./IDBDatabase.js').IDBDatabaseFull} */
                req.__result.__versionTransaction = null;
                sysdbFinishedCb(systx, false, function () {
                  req.transaction.__callTransFinishedCb(false, function () {
                    ev.complete();
                    req.__transaction = null;
                  });
                  return false;
                });
              };

              // eslint-disable-next-line camelcase -- Clear API
              req.transaction.on__preabort = function () {
                connection.__upgradeTransaction = null;
                // We ensure any cache is deleted before any request error events fire and try to reopen
                if (useDatabaseCache) {
                  if (Object.hasOwn(websqlDBCache, name)) {
                    delete websqlDBCache[name][version];
                  }
                }
              };

              // eslint-disable-next-line camelcase -- Clear API
              req.transaction.on__abort = function () {
                req.__transaction = null;
                // `readyState` and `result` will be reset anyways by `dbCreateError` but we follow spec.
                req.__result = undefined;
                req.__done = false;
                connection.close();
                setTimeout(() => {
                  const err = createDOMException('AbortError', 'The upgrade transaction was aborted.');
                  sysdbFinishedCb(systx, err, function (reportError) {
                    if (oldVersion === 0) {
                      cleanupDatabaseResources(me.__openDatabase, name, escapedDatabaseName, dbCreateError.bind(null, err),
                      // @ts-expect-error It's ok
                      reportError || dbCreateError);
                      return false;
                    }
                    dbCreateError(err);
                    return false;
                  });
                }, 0);
              };

              // eslint-disable-next-line camelcase -- Clear API
              req.transaction.on__complete = function () {
                const pos = connection.__transactions.indexOf(req.transaction);
                if (pos !== -1) {
                  connection.__transactions.splice(pos, 1);
                }
                if (/** @type {import('./IDBDatabase.js').IDBDatabaseFull} */req.__result.__closePending) {
                  req.__transaction = null;
                  const err = createDOMException('AbortError', 'The connection has been closed.');
                  dbCreateError(err);
                  return;
                }
                // Since this is running directly after `IDBTransaction.complete`,
                //   there should be a new task. However, while increasing the
                //   timeout 1ms in `IDBTransaction.__executeRequests` can allow
                //   `IDBOpenDBRequest.onsuccess` to trigger faster than a new
                //   transaction as required by "transaction-create_in_versionchange" in
                //   w3c/Transaction.js (though still on a timeout separate from this
                //   preceding `IDBTransaction.oncomplete`), this causes a race condition
                //   somehow with old transactions (e.g., for the Mocha test,
                //   in `IDBObjectStore.deleteIndex`, "should delete an index that was
                //   created in a previous transaction").
                // setTimeout(() => {

                finishRequest();
                req.__transaction = null;
                const e = createEvent('success');
                req.dispatchEvent(e);
                // });
              };
            }
            if (oldVersion === 0) {
              systx.executeSql('INSERT INTO dbVersions VALUES (?,?)', [sqlSafeName, version], versionSet, dbCreateError);
            } else {
              systx.executeSql('UPDATE dbVersions SET "version" = ? WHERE "name" = ?', [version, sqlSafeName], versionSet, dbCreateError);
            }
          }, dbCreateError, undefined, function (currentTask, err, done, rollback, commit) {
            if (currentTask.readOnly || err) {
              return true;
            }
            sysdbFinishedCb = function (systx, err, cb) {
              if (err) {
                rollback(err, cb);
              } else {
                commit(cb);
              }
            };
            return false;
          });
          return undefined;
        }).catch(err => {
          console.log('Error within `triggerAnyVersionChangeAndBlockedEvents`');
          throw err;
        });
      } else {
        finishRequest();
        const e = createEvent('success');
        req.dispatchEvent(e);
      }
    }, dbCreateError);
  }

  /**
   *
   * @param {Integer} oldVersion
   * @returns {void}
   */
  function openDB(oldVersion) {
    /** @type {DatabaseFull} */
    let db;
    if (version === undefined) {
      // Resolve before use as a cache key below, or a `open(name)` call
      //  (no explicit version) would cache/look up under `undefined`
      //  instead of the actual version, causing a second, separate
      //  connection to be opened for the same database on reopen.
      version = oldVersion || 1;
    }
    if ((useMemoryDatabase || useDatabaseCache) && Object.hasOwn(websqlDBCache, name) && Object.hasOwn(websqlDBCache[name], version)) {
      db = websqlDBCache[name][version];
    } else {
      db = me.__openDatabase(useMemoryDatabase ? CFG.memoryDatabase : path.join(CFG.databaseBasePath || '', escapedDatabaseName), '1', name, CFG.DEFAULT_DB_SIZE);
      if (useDatabaseCache) {
        if (!Object.hasOwn(websqlDBCache, name)) {
          websqlDBCache[name] = {};
        }
        websqlDBCache[name][version] = db;
      }
    }
    if (oldVersion > version) {
      const err = createDOMException('VersionError', 'An attempt was made to open a database using a lower version than the existing version.', version);
      if (useDatabaseCache) {
        setTimeout(() => {
          dbCreateError(err);
        }, 0);
      } else {
        dbCreateError(err);
      }
      return;
    }
    db.transaction(function (tx) {
      tx.executeSql('CREATE TABLE IF NOT EXISTS __sys__ (name BLOB, keyPath BLOB, autoInc BOOLEAN, indexList BLOB, currNum INTEGER)', [], function () {
        /**
         * @returns {void}
         */
        function setup() {
          setupDatabase(tx, db, oldVersion);
        }
        if (!CFG.createIndexes) {
          setup();
          return;
        }
        tx.executeSql('CREATE INDEX IF NOT EXISTS sysname ON __sys__(name)', [], setup, dbCreateError);
      }, /** @type {SQLStatementErrorCallback} */dbCreateError);
    }, dbCreateError);
  }
  addRequestToConnectionQueue(req, name, /* origin */undefined, function () {
    let latestCachedVersion;
    if (useDatabaseCache) {
      if (!Object.hasOwn(websqlDBCache, name)) {
        websqlDBCache[name] = {};
      }
      latestCachedVersion = getLatestCachedWebSQLVersion(name);
    }
    if (latestCachedVersion) {
      openDB(latestCachedVersion);
    } else {
      createSysDB(me.__openDatabase, function () {
        sysdb.readTransaction(function (sysReadTx) {
          sysReadTx.executeSql('SELECT "version" FROM dbVersions WHERE "name" = ?', [sqlSafeName], function (sysReadTx, data) {
            if (data.rows.length === 0) {
              // Database with this name does not exist
              openDB(0);
            } else {
              openDB(data.rows.item(0).version);
            }
          }, dbCreateError);
        }, dbCreateError);
      }, dbCreateError);
    }
  });
  return req;
};

/**
 * Deletes a database.
 * @param {string} name
 * @this {IDBFactoryFull}
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.deleteDatabase = function (name) {
  const me = this;
  if (!(me instanceof IDBFactory)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('Database name is required');
  }
  if (hasNullOrigin()) {
    throw createDOMException('SecurityError', 'Cannot delete an IndexedDB database from an opaque origin.');
  }
  name = String(name); // cast to a string
  const sqlSafeName = escapeSQLiteStatement(name);

  /** @type {string} */
  let escapedDatabaseName;
  // eslint-disable-next-line no-useless-catch -- Possible refactoring
  try {
    escapedDatabaseName = escapeDatabaseNameForSQLAndFiles(name);
    // eslint-disable-next-line sonarjs/no-useless-catch -- Possible refactoring
  } catch (err) {
    throw err; // throw new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
  }
  const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
  const useDatabaseCache = CFG.cacheDatabaseInstances !== false || useMemoryDatabase;
  const req = IDBOpenDBRequest.__createInstance();
  let calledDBError = false;
  let version = 0;

  /**
   *
   * @param {boolean} err
   * @param {(erred?: boolean) => void} cb
   * @returns {void}
   */
  let sysdbFinishedCbDelete = function (err, cb) {
    cb(err);
  };

  // Although the spec has no specific conditions where an error
  //  may occur in `deleteDatabase`, it does provide for
  //  `UnknownError` as we may require upon a SQL deletion error
  /**
   *
   * @param {SQLTransaction|SQLError|Error} tx
   * @param {SQLError|boolean} [err]
   * @returns {boolean}
   */
  function dbError(tx, err) {
    if (calledDBError) {
      return false;
    }
    // Must be set synchronously (not inside the `sysdbFinishedCbDelete` callback below) to
    //  guard against reentrancy: `sysdbFinishedCbDelete` -> `rollback`/`commit` -> websql-configurable's
    //  `done()` -> `currentTask.errorCallback(er)`, which is this very `dbError`, calling back into
    //  us before the first invocation has finished. Without this, a second rollback/commit gets
    //  issued on the shared `sysdb` connection after it has already moved on to the next queued
    //  transaction, corrupting that connection's task queue (see issue with unrelated `open()` calls
    //  failing/crashing after a `deleteDatabase` file-removal error).
    calledDBError = true;
    const er = webSQLErrback(/** @type {SQLError} */err || tx);
    sysdbFinishedCbDelete(true, function () {
      req.__done = true;
      req.__error = er;
      req.__result = undefined; // Must be undefined if an error per `result` getter
      // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
      const e = createEvent('error', er, {
        bubbles: true,
        cancelable: true
      });
      req.dispatchEvent(e);
    });
    return false;
  }
  addRequestToConnectionQueue(req, name, /* origin */undefined, function (req) {
    createSysDB(me.__openDatabase, function () {
      // function callback (cb) { cb(); }
      // callback(function () {

      /**
       * @returns {void}
       */
      function completeDatabaseDelete() {
        req.__result = undefined;
        req.__done = true;
        const e = /** @type {Event & IDBVersionChangeEvent} */
        new IDBVersionChangeEvent('success', {
          oldVersion: version,
          newVersion: null
        });
        req.dispatchEvent(e);
      }

      /** @type {DatabaseDeleted} */
      function databaseDeleted() {
        sysdbFinishedCbDelete(false, function () {
          if (useDatabaseCache && Object.hasOwn(websqlDBCache, name)) {
            delete websqlDBCache[name]; // New calls will treat as though never existed
          }
          delete me.__connections[name];
          completeDatabaseDelete();
        });
      }
      sysdb.readTransaction(function (sysReadTx) {
        sysReadTx.executeSql('SELECT "version" FROM dbVersions WHERE "name" = ?', [sqlSafeName], function (sysReadTx, data) {
          if (data.rows.length === 0) {
            completeDatabaseDelete();
            return undefined;
          }
          ({
            version
          } = data.rows.item(0));
          const openConnections = me.__connections[name] || [];
          triggerAnyVersionChangeAndBlockedEvents(openConnections, req, version, null).then(function () {
            // Since we need two databases which can't be in a single transaction, we
            //  do this deleting from `dbVersions` first since the `__sys__` deleting
            //  only impacts file memory whereas this one is critical for avoiding it
            //  being found via `open` or `databases`; however, we will
            //  avoid committing anyways until all deletions are made and rollback the
            //  `dbVersions` change if they fail
            sysdb.transaction(function (systx) {
              systx.executeSql('DELETE FROM dbVersions WHERE "name" = ? ', [sqlSafeName], function () {
                // Todo: We should also check whether `dbVersions` is empty and if so, delete upon
                //    `deleteDatabaseFiles` config. We also ought to do this when aborting (see
                //    above code with `DELETE FROM dbVersions`)
                cleanupDatabaseResources(me.__openDatabase, name, escapedDatabaseName, databaseDeleted, dbError);
              }, dbError);
            }, dbError, undefined, function (currentTask, err, done, rollback, commit) {
              if (currentTask.readOnly || err) {
                return true;
              }
              sysdbFinishedCbDelete = function (err, cb) {
                if (err) {
                  rollback(err, cb);
                } else {
                  commit(cb);
                }
              };
              return false;
            });
            return undefined;
            // @ts-expect-error It's ok
          }).catch(dbError);
          return undefined;
        }, dbError);
      });
    }, dbError);
  });
  return req;
};

/**
 *
 * @param {import('./Key.js').Key} key1
 * @param {import('./Key.js').Key} key2
 * @throws {TypeError}
 * @returns {number}
 */
IDBFactory.prototype.cmp = function (key1, key2) {
  if (!(this instanceof IDBFactory)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length < 2) {
    throw new TypeError('You must provide two keys to be compared');
  }
  // We use encoding facilities already built for proper sorting;
  //   the following "conversions" are for validation only
  convertValueToKeyRethrowingAndIfInvalid(key1);
  convertValueToKeyRethrowingAndIfInvalid(key2);
  return cmp(key1, key2);
};

/**
 * May return outdated information if a database has since been deleted.
 * @see https://github.com/w3c/IndexedDB/pull/240/files
 * @this {IDBFactoryFull}
 * @returns {Promise<{
 *   name: string,
 *   version: Integer
 * }[]>}
 */
IDBFactory.prototype.databases = function () {
  const me = this;
  let calledDbCreateError = false;
  return new Promise(function (resolve, reject) {
    // eslint-disable-line promise/avoid-new -- Own polyfill
    if (!(me instanceof IDBFactory)) {
      throw new TypeError('Illegal invocation');
    }
    if (hasNullOrigin()) {
      throw createDOMException('SecurityError', 'Cannot get IndexedDB database names from an opaque origin.');
    }
    /**
     *
     * @param {true|SQLTransaction|SQLError|DOMException|Error} tx
     * @param {SQLError|DOMException|Error} [err]
     * @returns {boolean}
     */
    function dbGetDatabaseNamesError(tx, err) {
      if (calledDbCreateError) {
        return false;
      }
      const er = err ? webSQLErrback(/** @type {SQLError} */err) : tx;
      calledDbCreateError = true;
      reject(er);
      return false;
    }
    createSysDB(me.__openDatabase, function () {
      sysdb.readTransaction(function (sysReadTx) {
        sysReadTx.executeSql('SELECT "name", "version" FROM dbVersions', [], function (sysReadTx, data) {
          const dbNames = [];
          for (let i = 0; i < data.rows.length; i++) {
            const {
              name,
              version
            } = data.rows.item(i);
            dbNames.push({
              name: unescapeSQLiteResponse(name),
              version
            });
          }
          resolve(dbNames);
        }, dbGetDatabaseNamesError);
      }, dbGetDatabaseNamesError);
    }, dbGetDatabaseNamesError);
  });
};

/**
 * @todo forceClose: Test
 * This is provided to facilitate unit-testing of the
 *  closing of a database connection with a forced flag:
 * <https://w3c.github.io/IndexedDB/#steps-for-closing-a-database-connection>
 * @param {string} dbName
 * @param {Integer} connIdx
 * @param {string} msg
 * @throws {TypeError}
 * @this {IDBFactoryFull}
 * @returns {void}
 */
IDBFactory.prototype.__forceClose = function (dbName, connIdx, msg) {
  const me = this;
  /**
   *
   * @param {import('./IDBDatabase.js').IDBDatabaseFull} conn
   * @returns {void}
   */
  function forceClose(conn) {
    conn.__forceClose(msg);
  }
  if (isNullish(dbName)) {
    Object.values(me.__connections).forEach(connections => {
      connections.forEach(connection => {
        forceClose(connection);
      });
    });
  } else if (!Object.hasOwn(me.__connections, dbName)) {
    console.log('No database connections with that name to force close');
  } else if (isNullish(connIdx)) {
    me.__connections[dbName].forEach(conn => {
      forceClose(conn);
    });
    // eslint-disable-next-line unicorn/prefer-number-is-safe-integer -- Ok
  } else if (!Number.isInteger(connIdx) || connIdx < 0 || connIdx > me.__connections[dbName].length - 1) {
    throw new TypeError('If providing an argument, __forceClose must be called with a ' + 'numeric index to indicate a specific connection to close');
  } else {
    forceClose(me.__connections[dbName][connIdx]);
  }
};

/**
 *
 * @param {string} [origin]
 * @returns {void}
 */
IDBFactory.prototype.__setConnectionQueueOrigin = function (origin = getOrigin()) {
  connectionQueue[origin] = {};
};
IDBFactory.prototype[Symbol.toStringTag] = 'IDBFactoryPrototype';

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
Object.defineProperty(IDBFactory, 'prototype', {
  writable: false
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

const shimIndexedDB = IDBFactory.__createInstance();

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {IDBCursor & {
 *   primaryKey: import('./Key.js').Key,
 *   key:  import('./Key.js').Key,
 *   direction: string,
 *   source: import('./IDBObjectStore.js').IDBObjectStoreFull|
 *     import('./IDBIndex.js').IDBIndexFull,
 *   __request: import('./IDBRequest.js').IDBRequestFull,
 *   __advanceCount: Integer|undefined,
 *   __indexSource: boolean,
 *   __key: import('./Key.js').Key,
 *   __primaryKey: import('./Key.js').Key,
 *   __value: import('./Key.js').Value,
 *   __store: import('./IDBObjectStore.js').IDBObjectStoreFull,
 *   __range: import('./IDBKeyRange.js').IDBKeyRangeFull|undefined,
 *   __keyColumnName: string,
 *   __valueColumnName: string,
 *   __keyOnly: boolean,
 *   __valueDecoder: {
 *     decode: (str: string) => any,
 *   },
 *   __count: boolean,
 *   __prefetchedIndex: Integer,
 *   __prefetchedData: null|SQLResultSetRowList|{
 *     data: RowItemNonNull[],
 *     length: Integer,
 *     item: (index: Integer) => RowItemNonNull
 *   },
 *   __multiEntryIndex: boolean,
 *   __unique: boolean,
 *   __sqlDirection: "DESC"|"ASC",
 *   __matchedKeys: {[key: string]: true},
 *   __continuationKey: import('./Key.js').Key|undefined,
 *   __continuationPrimaryKey: import('./Key.js').Key|undefined,
 *   __multiEntryExhausted: boolean,
 *   __invalidateCache: () => void
 * }} IDBCursorFull
 */

/**
 * @typedef {IDBCursorFull & {
 *   __request: import('./IDBRequest.js').IDBRequestFull,
 * }} IDBCursorWithValueFull
 */

/**
 * @class
 * @throws {TypeError}
 */
function IDBCursor() {
  throw new TypeError('Illegal constructor');
}
const IDBCursorAlias = IDBCursor;

/* eslint-disable func-name-matching -- API */
/**
 * The IndexedDB Cursor Object.
 * @see https://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
 * @param {IDBKeyRange} query
 * @param {string} direction
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull} store
 * @param {import('./IDBObjectStore.js').IDBObjectStoreFull|
 *   import('./IDBIndex.js').IDBIndexFull} source
 * @param {string} keyColumnName
 * @param {string} valueColumnName
 * @param {boolean} count
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.__super = function IDBCursor(query, direction, store, source, keyColumnName, valueColumnName, count) {
  /* eslint-enable func-name-matching -- API */
  // @ts-expect-error Should be ok
  this[Symbol.toStringTag] = 'IDBCursor';
  defineReadonlyProperties(this, ['key', 'primaryKey', 'request']);
  IDBObjectStore.__invalidStateIfDeleted(store);
  this.__indexSource = instanceOf(source, IDBIndex);
  if (this.__indexSource) {
    IDBIndex.__invalidStateIfDeleted(/** @type {import('./IDBIndex.js').IDBIndexFull} */source);
  }
  IDBTransaction.__assertActive(store.transaction);
  const range = convertValueToKeyRange(query);
  if (direction !== undefined && !['next', 'prev', 'nextunique', 'prevunique'].includes(direction)) {
    throw new TypeError(direction + 'is not a valid cursor direction');
  }
  Object.defineProperties(this, {
    // Babel is not respecting default writable false here, so make explicit
    source: {
      writable: false,
      value: source
    },
    direction: {
      writable: false,
      value: direction || 'next'
    }
  });
  this.__key = undefined;
  this.__primaryKey = undefined;
  this.__store = store;
  this.__range = range;
  this.__request = IDBRequest.__createInstance();
  this.__request.__source = source;
  this.__request.__transaction = this.__store.transaction;
  this.__keyColumnName = keyColumnName;
  this.__valueColumnName = valueColumnName;
  this.__keyOnly = valueColumnName === 'key';
  this.__valueDecoder = this.__keyOnly ? Key : Sca;
  this.__count = count;
  this.__prefetchedIndex = -1;
  this.__continuationKey = undefined;
  this.__continuationPrimaryKey = undefined;
  this.__multiEntryExhausted = false;
  this.__multiEntryIndex = this.__indexSource ? 'multiEntry' in source && source.multiEntry : false;
  this.__unique = this.direction.includes('unique');
  this.__sqlDirection = ['prev', 'prevunique'].includes(this.direction) ? 'DESC' : 'ASC';
  if (range !== undefined) {
    // Encode the key range and cache the encoded values, so we don't have to re-encode them over and over
    range.__lowerCached = range.lower !== undefined && encode$1(range.lower, this.__multiEntryIndex);
    range.__upperCached = range.upper !== undefined && encode$1(range.upper, this.__multiEntryIndex);
  }
  this.__gotValue = true;
  this.continue();
};

/**
 *
 * @param {...any} args
 * @returns {IDBCursorFull}
 */
IDBCursor.__createInstance = function (...args) {
  const IDBCursor = IDBCursorAlias.__super;
  IDBCursor.prototype = IDBCursorAlias.prototype;

  // @ts-expect-error It's ok
  return new IDBCursor(...args);
};

/**
 *
 * @param {...any} args
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__find = function (...args /* key, tx, success, error, recordsToLoad */) {
  const [key, primaryKey, tx, success, error, recordsToLoad] = args;
  if (this.__multiEntryIndex) {
    this.__findMultiEntry(key, primaryKey, tx, success, error, recordsToLoad);
  } else {
    this.__findBasic(key, primaryKey, tx, success, error, recordsToLoad);
  }
};

/**
 * @typedef {(
 *   k: import('./Key.js').Key,
 *   val: import('./Key.js').Value,
 *   primKey: import('./Key.js').Key
 * ) => void} KeySuccess
 */

/**
 * @typedef {(tx: SQLTransaction|Error|DOMException|SQLError, err?: SQLError) => void} FindError
 */

/**
 *
 * @param {undefined|import('./Key.js').Key} key
 * @param {undefined|import('./Key.js').Key} primaryKey
 * @param {SQLTransaction} tx
 * @param {KeySuccess} success
 * @param {FindError} error
 * @param {Integer|undefined} recordsToLoad
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__findBasic = function (key, primaryKey, tx, success, error, recordsToLoad) {
  const continueCall = recordsToLoad !== undefined;
  recordsToLoad ||= 1;
  const me = this;
  const quotedKeyColumnName = sqlQuote(me.__keyColumnName);
  const quotedKey = sqlQuote('key');
  const sql = ['SELECT * FROM', escapeStoreNameForSQL(me.__store.__currentName)];

  /** @type {string[]} */
  const sqlValues = [];
  sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
  setSQLForKeyRange(me.__range, quotedKeyColumnName, sql, sqlValues, true, true);

  // Determine the ORDER BY direction based on the cursor.
  const direction = me.__sqlDirection;
  const op = direction === 'ASC' ? '>' : '<';
  if (primaryKey !== undefined) {
    sql.push('AND', quotedKey, op + '= ?');
    // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
    sqlValues.push(/** @type {string} */encode$1(primaryKey));
  }
  if (key !== undefined) {
    sql.push('AND', quotedKeyColumnName, op + '= ?');
    // Key.convertValueToKey(key); // Already checked by `continue` or `continuePrimaryKey`
    sqlValues.push(/** @type {string} */encode$1(key));
  } else if (continueCall && me.__key !== undefined) {
    sql.push('AND', quotedKeyColumnName, op + ' ?');
    // Key.convertValueToKey(me.__key); // Already checked when stored
    sqlValues.push(/** @type {string} */encode$1(me.__key));
  }
  if (!me.__count) {
    // 1. Sort by key
    sql.push('ORDER BY', quotedKeyColumnName, direction);
    if (me.__keyColumnName !== 'key') {
      // Avoid adding 'key' twice
      if (!me.__unique) {
        // 2. Sort by primaryKey (if defined and not unique)
        // 3. Sort by position (if defined)
        sql.push(',', quotedKey, direction);
      } else if (me.direction === 'prevunique') {
        // Sort by first record with key matching
        sql.push(',', quotedKey, 'ASC');
      }
    }
    if (!me.__unique && me.__indexSource) {
      // 4. Sort by object store position (if defined and not unique)
      sql.push(',', sqlQuote(me.__valueColumnName), direction);
    }
    sql.push('LIMIT', String(recordsToLoad));
  }
  const sqlStr = sql.join(' ');
  if (CFG.DEBUG) {
    console.log(sqlStr, sqlValues);
  }
  tx.executeSql(sqlStr, sqlValues, function (tx, data) {
    if (me.__count) {
      success(undefined, data.rows.length, undefined);
    } else if (data.rows.length > 1) {
      me.__prefetchedIndex = 0;
      me.__prefetchedData = data.rows;
      if (CFG.DEBUG) {
        console.log('Preloaded ' + me.__prefetchedData.length + ' records for cursor');
      }
      me.__decode(data.rows.item(0), success);
    } else if (data.rows.length === 1) {
      me.__decode(data.rows.item(0), success);
    } else {
      if (CFG.DEBUG) {
        console.log('Reached end of cursors');
      }
      success(undefined, undefined, undefined);
    }
  }, function (tx, err) {
    if (CFG.DEBUG) {
      console.log('Could not execute Cursor.continue', sqlStr, sqlValues);
    }
    error(err);
    return false;
  });
};
const leftBracketRegex = /\[/gu;

/**
 *
 * @param {undefined|import('./Key.js').Key} key
 * @param {undefined|import('./Key.js').Key} primaryKey
 * @param {SQLTransaction} tx
 * @param {KeySuccess} success
 * @param {FindError} error
 * @param {Integer} [recordsToLoad]
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__findMultiEntry = function (key, primaryKey, tx, success, error, recordsToLoad = 1) {
  const me = this;
  if (me.__multiEntryExhausted) {
    if (CFG.DEBUG) {
      console.log('[multiEntry] Reached end of multiEntry cursor (already exhausted)');
    }
    success(undefined, undefined, undefined);
    return;
  }
  const quotedKeyColumnName = sqlQuote(me.__keyColumnName);
  const quotedKey = sqlQuote('key');

  // Determine the ORDER BY direction based on the cursor.
  const direction = me.__sqlDirection;
  const op = direction === 'ASC' ? '>' : '<';

  /**
   * Runs (and, if a batch of underlying rows produces no matching
   * multi-entry values, repeatedly re-runs) the query for the next batch
   * of underlying rows, advancing `me.__continuationKey`/
   * `me.__continuationPrimaryKey` (tracking the last *physical* row
   * scanned) each time, until either some matches are found or the
   * underlying table is exhausted.
   * @returns {void}
   */
  function runQuery() {
    const sql = ['SELECT * FROM', escapeStoreNameForSQL(me.__store.__currentName)];
    /** @type {string[]} */
    const sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && me.__range.lower !== undefined && Array.isArray(me.__range.upper)) {
      if (me.__range.upper.indexOf(me.__range.lower) === 0) {
        sql.push('AND', quotedKeyColumnName, "LIKE ? ESCAPE '^'");
        sqlValues.push('%' + sqlLIKEEscape(/** @type {string} */me.__range.__lowerCached.slice(0, -1)) + '%');
      }
    }
    if (primaryKey !== undefined) {
      sql.push('AND', quotedKey, op + '= ?');
      // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
      sqlValues.push(/** @type {string} */encode$1(primaryKey));
    }
    if (key !== undefined) {
      sql.push('AND', quotedKeyColumnName, op + '= ?');
      // Key.convertValueToKey(key); // Already checked by `continue` or `continuePrimaryKey`
      sqlValues.push(/** @type {string} */encode$1(key));
    } else if (me.__continuationKey !== undefined) {
      // Resume from the last underlying (physical) row we scanned, not
      // from the last *matching* multi-entry value (which lives in a
      // different key-space than the raw index column and cannot be
      // reliably compared against it, e.g. for array index keys).
      sql.push('AND (', quotedKeyColumnName, op, '?', 'OR (', quotedKeyColumnName, '= ?', 'AND', quotedKey, op, '?))');
      const encodedContinuationKey = /** @type {string} */
      encode$1(me.__continuationKey, true);
      sqlValues.push(encodedContinuationKey, encodedContinuationKey, /** @type {string} */encode$1(me.__continuationPrimaryKey));
    }
    if (!me.__count) {
      // 1. Sort by key
      sql.push('ORDER BY', quotedKeyColumnName, direction);

      // 2. Sort by primaryKey (if defined and not unique)
      if (!me.__unique && me.__keyColumnName !== 'key') {
        // Avoid adding 'key' twice
        sql.push(',', sqlQuote('key'), direction);
      }

      // 3. Sort by position (if defined)

      if (!me.__unique && me.__indexSource) {
        // 4. Sort by object store position (if defined and not unique)
        sql.push(',', sqlQuote(me.__valueColumnName), direction);
      }
      sql.push('LIMIT', String(recordsToLoad));
    }
    const sqlStr = sql.join(' ');
    if (CFG.DEBUG) {
      console.log('[multiEntry] query', sqlStr, sqlValues);
    }
    tx.executeSql(sqlStr, sqlValues, function (tx, data) {
      if (data.rows.length === 0) {
        me.__multiEntryExhausted = true;
        if (CFG.DEBUG) {
          console.log('[multiEntry] Reached end of multiEntry cursor (no more rows)');
        }
        success(undefined, undefined, undefined);
        return;
      }
      if (me.__count) {
        // Avoid caching and other processing below
        let ct = 0;
        for (let i = 0; i < data.rows.length; i++) {
          const rowItem = data.rows.item(i);
          const rowKey = decode$1(rowItem[me.__keyColumnName], true);
          const matches = findMultiEntryMatches(rowKey, me.__range);
          ct += matches.length;
        }
        success(undefined, ct, undefined);
        return;
      }

      // Track how far we've physically scanned, regardless of whether
      // this batch produced any matches, so the next batch (if any)
      // resumes after this one instead of re-scanning or stopping early.
      const lastRawRow = data.rows.item(data.rows.length - 1);
      me.__continuationKey = decode$1(lastRawRow[me.__keyColumnName], true);
      me.__continuationPrimaryKey = decode$1(lastRawRow.key);
      if (data.rows.length < recordsToLoad) {
        me.__multiEntryExhausted = true;
      }
      const rows = [];
      for (let i = 0; i < data.rows.length; i++) {
        const rowItem = data.rows.item(i);
        const rowKey = decode$1(rowItem[me.__keyColumnName], true);
        const matches = findMultiEntryMatches(rowKey, me.__range);
        for (const matchingKey of matches) {
          /**
           * @type {RowItemNonNull}
           */
          const clone = {
            matchingKey: (/** @type {string} */
            encode$1(matchingKey, true)),
            key: rowItem.key,
            [me.__keyColumnName]: rowItem[me.__keyColumnName],
            [me.__valueColumnName]: rowItem[me.__valueColumnName]
          };
          rows.push(clone);
        }
      }
      if (rows.length === 0) {
        if (me.__multiEntryExhausted) {
          if (CFG.DEBUG) {
            console.log('[multiEntry] Reached end of multiEntry cursor (last batch had no matches)');
          }
          success(undefined, undefined, undefined);
          return;
        }
        if (CFG.DEBUG) {
          console.log('[multiEntry] batch had no matches; fetching next batch');
        }
        runQuery();
        return;
      }
      const reverse = me.direction.indexOf('prev') === 0;
      rows.sort(function (a, b) {
        if (a.matchingKey.replaceAll(leftBracketRegex, 'z') < b.matchingKey.replaceAll(leftBracketRegex, 'z')) {
          return reverse ? 1 : -1;
        }
        if (a.matchingKey.replaceAll(leftBracketRegex, 'z') > b.matchingKey.replaceAll(leftBracketRegex, 'z')) {
          return reverse ? -1 : 1;
        }
        if (a.key < b.key) {
          return me.direction === 'prev' ? 1 : -1;
        }
        if (a.key > b.key) {
          return me.direction === 'prev' ? -1 : 1;
        }
        return 0;
      });
      me.__prefetchedIndex = 0;
      me.__prefetchedData = {
        data: rows,
        length: rows.length,
        /**
         * @param {Integer} index
         * @returns {RowItemNonNull}
         */
        item(index) {
          return this.data[index];
        }
      };
      if (CFG.DEBUG) {
        console.log('[multiEntry] Preloaded ' + me.__prefetchedData.length + ' records for multiEntry cursor');
      }
      me.__decode(rows[0], success);
    }, function (tx, err) {
      if (CFG.DEBUG) {
        console.log('[multiEntry] Could not execute Cursor.continue', sqlStr, sqlValues);
      }
      error(err);
      return false;
    });
  }
  runQuery();
};

/**
 * @typedef {any} StructuredCloneValue
 */

/**
 * @typedef {any} IndexedDBKey
 */

/**
 * @callback SuccessArg
 * @param {StructuredCloneValue} value
 * @param {import('./IDBRequest.js').IDBRequestFull} req
 * @returns {void}
 */

/**
 * @callback SuccessCallback
 * @param {IndexedDBKey} key
 * @param {StructuredCloneValue} value
 * @param {IndexedDBKey} primaryKey
 * @returns {void}
 */

/**
 * Creates an "onsuccess" callback.
 * @param {SuccessArg} success
 * @this {IDBCursorFull}
 * @returns {SuccessCallback}
 */
IDBCursor.prototype.__onsuccess = function (success) {
  const me = this;
  return function (key, value, primaryKey) {
    if (me.__count) {
      success(value, me.__request);
    } else {
      if (key !== undefined) {
        me.__gotValue = true;
      }
      me.__key = key === undefined ? null : key;
      me.__primaryKey = primaryKey === undefined ? null : primaryKey;
      me.__value = value === undefined ? null : value;
      const result = key === undefined ? null : me;
      success(result, me.__request);
    }
  };
};

/**
 * @typedef {{
 *   matchingKey: string,
 *   key: string,
 *   [k: string]: string
 * }} RowItemNonNull
 */

/**
 *
 * @param {RowItemNonNull} rowItem
 * @param {(
 *   key: import('./Key.js').Key,
 *   val: import('./Key.js').Value,
 *   primaryKey: import('./Key.js').Key,
 *   encKey?: string
 * ) => void} callback
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__decode = function (rowItem, callback) {
  const me = this;
  if (me.__multiEntryIndex && me.__unique) {
    if (!me.__matchedKeys) {
      me.__matchedKeys = {};
    }
    if (me.__matchedKeys[rowItem.matchingKey] === true) {
      callback(undefined, undefined, undefined);
      return;
    }
    me.__matchedKeys[rowItem.matchingKey] = true;
  }
  const encKey = unescapeSQLiteResponse(me.__multiEntryIndex ? rowItem.matchingKey : rowItem[me.__keyColumnName]);
  const encVal = unescapeSQLiteResponse(rowItem[me.__valueColumnName]);
  const encPrimaryKey = unescapeSQLiteResponse(rowItem.key);
  const key = decode$1(encKey, me.__multiEntryIndex);
  const val = me.__valueDecoder.decode(encVal);
  const primaryKey = decode$1(encPrimaryKey);
  callback(key, val, primaryKey, encKey /* , encVal, encPrimaryKey */);
};

/**
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__sourceOrEffectiveObjStoreDeleted = function () {
  IDBObjectStore.__invalidStateIfDeleted(this.__store, "The cursor's effective object store has been deleted");
  if (this.__indexSource) {
    IDBIndex.__invalidStateIfDeleted(/** @type {import('./IDBIndex.js').IDBIndexFull} */this.source, "The cursor's index source has been deleted");
  }
};

/**
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__invalidateCache = function () {
  // @ts-expect-error Why is this not being found?
  this.__prefetchedData = null;
  this.__multiEntryExhausted = false;
};

/**
 *
 * @param {import('./Key.js').Key} [key]
 * @param {boolean} [advanceContinue]
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__continue = function (key, advanceContinue) {
  const me = this;
  const advanceState = me.__advanceCount !== undefined;
  IDBTransaction.__assertActive(me.__store.transaction);
  me.__sourceOrEffectiveObjStoreDeleted();
  if (!me.__gotValue && !advanceContinue) {
    throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
  }
  if (key !== undefined) {
    convertValueToKeyRethrowingAndIfInvalid(key);
    const cmpResult = cmp(key, me.key);
    if (cmpResult === 0 || me.direction.includes('next') && cmpResult === -1 || me.direction.includes('prev') && cmpResult === 1) {
      throw createDOMException('DataError', 'Cannot ' + (advanceState ? 'advance' : 'continue') + ' the cursor in an unexpected direction');
    }
  }
  this.__continueFinish(key, undefined, advanceState);
};

/**
 *
 * @param {import('./Key.js').Key} key
 * @param {import('./Key.js').Key} primaryKey
 * @param {boolean} advanceState
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.__continueFinish = function (key, primaryKey, advanceState) {
  const me = this;
  const recordsToPreloadOnContinue = me.__advanceCount || CFG.cursorPreloadPackSize || 100;
  me.__gotValue = false;
  me.__request.__done = false;

  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  me.__store.transaction.__pushToQueue(me.__request, function cursorContinue(tx, args, success, error, executeNextRequest) {
    /**
     * @param {import('./Key.js').Key} k
     * @param {import('./Key.js').Value} val
     * @param {import('./Key.js').Key} primKey
     * @returns {void}
     */
    function triggerSuccess(k, val, primKey) {
      if (advanceState) {
        if (me.__advanceCount && me.__advanceCount >= 2 && k !== undefined) {
          me.__advanceCount--;
          me.__key = k;
          me.__continue(undefined, true);
          // We don't call success yet but do need to advance the transaction queue
          runContinuationSafely(/** @type {() => void} */executeNextRequest);
          return;
        }
        me.__advanceCount = undefined;
      }
      me.__onsuccess(success)(k, val, primKey);
    }
    if (me.__prefetchedData) {
      // We have pre-loaded data for the cursor
      me.__prefetchedIndex++;
      if (me.__prefetchedIndex < me.__prefetchedData.length) {
        me.__decode(me.__prefetchedData.item(me.__prefetchedIndex), function (k, val, primKey, encKey) {
          /**
           * @returns {void}
           */
          function checkKey() {
            const cmpResult = Number(key === undefined) || cmp(k, key);
            if (cmpResult > 0 || cmpResult === 0 && (me.__unique || primaryKey === undefined || cmp(primKey, primaryKey) >= 0)) {
              triggerSuccess(k, val, primKey);
              return;
            }
            // @ts-expect-error Todo: Our bug to fix
            runContinuationSafely(() => cursorContinue(tx, args, success, error));
          }
          if (me.__unique && !me.__multiEntryIndex && encKey === encode$1(me.key, me.__multiEntryIndex)) {
            // @ts-expect-error Todo: Our bug to fix
            runContinuationSafely(() => cursorContinue(tx, args, success, error));
            return;
          }
          checkKey();
        });
        return;
      }
    }

    // No (or not enough) pre-fetched data, do query
    me.__find(key, primaryKey, tx, triggerSuccess, /** @type {FindError} */
    function (...args) {
      me.__advanceCount = undefined;
      const [t, err] = args;
      error(t, err);
    }, recordsToPreloadOnContinue);
  });
};

/**
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.continue = function /* key */
() {
  // eslint-disable-next-line prefer-rest-params -- API
  this.__continue(arguments[0]);
};

/**
 *
 * @param {import('./Key.js').Key} key
 * @param {import('./Key.js').Key} primaryKey
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.continuePrimaryKey = function (key, primaryKey) {
  const me = this;
  IDBTransaction.__assertActive(me.__store.transaction);
  me.__sourceOrEffectiveObjStoreDeleted();
  if (!me.__indexSource) {
    throw createDOMException('InvalidAccessError', '`continuePrimaryKey` may only be called on an index source.');
  }
  if (!['next', 'prev'].includes(me.direction)) {
    throw createDOMException('InvalidAccessError', '`continuePrimaryKey` may not be called with unique cursors.');
  }
  if (!me.__gotValue) {
    throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
  }
  convertValueToKeyRethrowingAndIfInvalid(key);
  convertValueToKeyRethrowingAndIfInvalid(primaryKey);
  const cmpResult = cmp(key, me.key);
  if (me.direction === 'next' && cmpResult === -1 || me.direction === 'prev' && cmpResult === 1) {
    throw createDOMException('DataError', 'Cannot continue the cursor in an unexpected direction');
  }

  /**
   * @returns {void}
   */
  function noErrors() {
    me.__continueFinish(key, primaryKey, false);
  }
  if (cmpResult === 0) {
    encode(primaryKey, function (encPrimaryKey) {
      encode(me.primaryKey, function (encObjectStorePos) {
        if (encPrimaryKey === encObjectStorePos || me.direction === 'next' && encPrimaryKey < encObjectStorePos || me.direction === 'prev' && encPrimaryKey > encObjectStorePos) {
          throw createDOMException('DataError', 'Cannot continue the cursor in an unexpected direction');
        }
        noErrors();
      });
    });
  } else {
    noErrors();
  }
};

/**
 *
 * @param {Integer} count
 * @this {IDBCursorFull}
 * @returns {void}
 */
IDBCursor.prototype.advance = function (count) {
  const me = this;
  count = enforceRange(count, 'unsigned long');
  if (count === 0) {
    throw new TypeError('Calling advance() with count argument 0');
  }
  if (me.__gotValue) {
    // Only set the count if not running in error (otherwise will override earlier good advance calls)
    me.__advanceCount = count;
  }
  me.__continue();
};

/**
 * @typedef {any} AnyValue
 */

/**
 *
 * @param {AnyValue} valueToUpdate
 * @this {IDBCursorFull}
 * @returns {IDBRequest}
 */
IDBCursor.prototype.update = function (valueToUpdate) {
  const me = this;
  if (!arguments.length) {
    throw new TypeError('A value must be passed to update()');
  }
  IDBTransaction.__assertActive(me.__store.transaction);
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  me.__store.transaction.__assertWritable();
  me.__sourceOrEffectiveObjStoreDeleted();
  if (!me.__gotValue) {
    throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
  }
  if (me.__keyOnly) {
    throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
  }
  const request = /** @type {import('./IDBTransaction.js').IDBTransactionFull} */me.__store.transaction.__createRequest(me);
  const key = me.primaryKey;

  /**
   * @param {import('./Key.js').Value} clonedValue
   * @returns {void}
   */
  function addToQueue(clonedValue) {
    // We set the `invalidateCache` argument to `false` since the old value shouldn't be accessed
    IDBObjectStore.__storingRecordObjectStore(request, me.__store, false, clonedValue, false, key);
  }
  if (me.__store.keyPath !== null) {
    const [evaluatedKey, clonedValue] = me.__store.__validateKeyAndValueAndCloneValue(valueToUpdate, undefined, true);
    if (cmp(me.primaryKey, evaluatedKey) !== 0) {
      throw createDOMException('DataError', 'The key of the supplied value to `update` is not equal to the cursor\'s effective key');
    }
    // eslint-disable-next-line unicorn/prefer-hoisting-branch-code -- Different
    addToQueue(clonedValue);
  } else {
    const clonedValue = clone(valueToUpdate);
    addToQueue(clonedValue);
  }
  return request;
};

/**
 * @this {IDBCursorFull}
 * @returns {IDBRequest}
 */
IDBCursor.prototype.delete = function () {
  const me = this;
  IDBTransaction.__assertActive(me.__store.transaction);
  /** @type {import('./IDBTransaction.js').IDBTransactionFull} */
  me.__store.transaction.__assertWritable();
  me.__sourceOrEffectiveObjStoreDeleted();
  if (!me.__gotValue) {
    throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
  }
  if (me.__keyOnly) {
    throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
  }
  return /** @type {import('./IDBTransaction.js').IDBTransactionFull} */this.__store.transaction.__addToTransactionQueue(function cursorDelete(tx, args, success, error) {
    me.__find(undefined, undefined, tx, /** @type {KeySuccess} */
    function (key, value, primaryKey) {
      const sql = 'DELETE FROM  ' + escapeStoreNameForSQL(me.__store.__currentName) + ' WHERE "key" = ?';
      if (CFG.DEBUG) {
        console.log(sql, key, primaryKey);
      }
      // Key.convertValueToKey(primaryKey); // Already checked when entered
      tx.executeSql(sql, [escapeSQLiteStatement(/** @type {string} */encode$1(primaryKey))], function (tx, data) {
        if (data.rowsAffected === 1) {
          // We don't invalidate the cache (as we don't access it anymore
          //    and it will set the index off)
          success(undefined);
        } else {
          // @ts-expect-error Apparently ok
          error('No rows with key found' + key);
        }
      }, function (tx, data) {
        error(data);
        return false;
      });
    }, error);
  }, undefined, me);
};
IDBCursor.prototype[Symbol.toStringTag] = 'IDBCursorPrototype';

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
defineReadonlyOuterInterface(IDBCursor.prototype, ['source', 'direction', 'key', 'primaryKey', 'request']);
Object.defineProperty(IDBCursor, 'prototype', {
  writable: false
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

/**
 * @class
 * @throws {TypeError}
 */
function IDBCursorWithValue() {
  throw new TypeError('Illegal constructor');
}

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
// @ts-expect-error It's ok
IDBCursorWithValue.prototype = Object.create(IDBCursor.prototype);
Object.defineProperty(IDBCursorWithValue.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: IDBCursorWithValue
});
/* eslint-enable unicorn/no-top-level-side-effects -- Would be good */

const IDBCursorWithValueAlias = IDBCursorWithValue;
/**
 *
 * @param {...any} args
 * @returns {IDBCursorWithValueFull}
 */
IDBCursorWithValue.__createInstance = function (...args) {
  /**
   * @class
   * @this {IDBCursorWithValueFull}
   */
  function IDBCursorWithValue() {
    const [query, direction, store, source, keyColumnName, valueColumnName, count] = args;
    IDBCursor.__super.call(this, query, direction, store, source, keyColumnName, valueColumnName, count);
    // @ts-expect-error It's ok
    this[Symbol.toStringTag] = 'IDBCursorWithValue';
    defineReadonlyProperties(this, 'value');
  }
  IDBCursorWithValue.prototype = IDBCursorWithValueAlias.prototype;

  // @ts-expect-error It's ok
  return new IDBCursorWithValue();
};

/* eslint-disable unicorn/no-top-level-side-effects -- Would be good */
defineReadonlyOuterInterface(IDBCursorWithValue.prototype, ['value']);
IDBCursorWithValue.prototype[Symbol.toStringTag] = 'IDBCursorWithValuePrototype';
Object.defineProperty(IDBCursorWithValue, 'prototype', {
  writable: false
});

/**
 * @typedef {any} AnyValue
 */

/**
 * @callback SetConfig
 * @param {import('./CFG.js').KeyofConfigValues|
 *   Partial<import('./CFG.js').ConfigValues>} prop
 * @param {AnyValue} [val]
 * @throws {Error}
 * @returns {void}
 */

/** @type {SetConfig} */
function setConfig(prop, val) {
  if (prop && typeof prop === 'object') {
    Object.entries(prop).forEach(([p, val]) => {
      setConfig(/** @type {import('./CFG.js').KeyofConfigValues} */
      p, val);
    });
    return;
  }
  if (!Object.hasOwn(CFG, prop)) {
    throw new Error(prop + ' is not a valid configuration property');
  }
  // @ts-expect-error Should not be `never` here!
  CFG[prop] = val;
  if (prop === 'registerSCA' && typeof val === 'function') {
    register(
    /**
     * @type {(
     *   preset: import('typeson').Preset
     * ) => import('typeson').Preset}
     */
    val);
  }
}

/**
 * @typedef {(
 *   prop: import('./CFG.js').KeyofConfigValues
 * ) => import('./CFG.js').ConfigValue} GetConfig
 */

/**
 * @typedef {(cfg: {
 *   UnicodeIDStart: string,
 *   UnicodeIDContinue: string
 * }) => void} SetUnicodeIdentifiers
 */

/**
 * @typedef {(IDBFactory|object) & {
 *     __useShim: () => void,
 *     __debug: (val: boolean) => void,
 *     __setConfig: SetConfig,
 *     __getConfig: GetConfig,
 *     __setUnicodeIdentifiers: SetUnicodeIdentifiers,
 *     __setConnectionQueueOrigin: (origin?: string) => void
 *   }} ShimIndexedDB
 */

/**
 * @typedef {number} Integer
 */

/**
 * @typedef {(typeof globalThis|object) & {
 *   indexedDB?: Partial<IDBFactory>,
 *   IDBFactory: typeof IDBFactory,
 *   IDBOpenDBRequest: typeof IDBOpenDBRequest,
 *   IDBRequest: typeof IDBRequest,
 *   IDBCursorWithValue: typeof IDBCursorWithValue,
 *   IDBCursor: typeof IDBCursor,
 *   IDBDatabase: typeof IDBDatabase,
 *   IDBTransaction: typeof IDBTransaction,
 *   IDBKeyRange: typeof IDBKeyRange,
 *   shimIndexedDB?: ShimIndexedDB
 * }} ShimmedObject
 */

/**
 *
 * @param {ShimmedObject} [idb]
 * @param {import('./CFG.js').ConfigValues} [initialConfig]
 * @returns {ShimmedObject}
 */
function setGlobalVars(idb, initialConfig) {
  if (initialConfig) {
    setConfig(initialConfig);
  }
  const IDB = idb || globalThis || {};
  /**
   * @typedef {any} AnyClass
   */
  /**
   * @typedef {any} AnyValue
   */
  /**
   * @typedef {Function} AnyFunction
   */
  /**
   * @param {string} name
   * @param {AnyClass} value
   * @param {PropertyDescriptor & {
   *   shimNS?: object
   * }|undefined} [propDesc]
   * @returns {void}
   */
  function shim(name, value, propDesc) {
    if (!propDesc || !Object.defineProperty) {
      try {
        // Try setting the property. This will fail if the property is read-only.
        // @ts-expect-error It's ok
        IDB[name] = value;
      } catch (e) {
        console.log(e);
      }
    }
    if (
    // @ts-expect-error It's ok
    IDB[name] !== value && Object.defineProperty) {
      // Setting a read-only property failed, so try re-defining the property
      try {
        let desc = propDesc || {};
        if (!('get' in desc)) {
          if (!('value' in desc)) {
            desc.value = value;
          }
          if (!('writable' in desc)) {
            desc.writable = true;
          }
        } else {
          const o = {
            /**
             * @returns {AnyValue}
             */
            get [name]() {
              return /** @type {AnyFunction} */(/** @type {PropertyDescriptor} */propDesc.get).call(this);
            }
          };
          desc = /** @type {PropertyDescriptor} */
          Object.getOwnPropertyDescriptor(o, name);
        }
        Object.defineProperty(IDB, name, desc);
      } catch (err) {
        // With `indexedDB`, PhantomJS fails here and below but
        //  not above, while Chrome is reverse (and Firefox doesn't
        //  get here since no WebSQL to use for shimming)
      }
    }

    // @ts-expect-error It's ok
    if (IDB[name] !== value) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Unable to shim ' + name);
      }
    }
  }
  if (CFG.win.openDatabase !== undefined) {
    shim('shimIndexedDB', shimIndexedDB, {
      enumerable: false,
      configurable: true
    });
  }
  if ('shimIndexedDB' in IDB && IDB.shimIndexedDB) {
    IDB.shimIndexedDB.__useShim = function () {
      /**
       *
       * @param {"Shim"|""} [prefix]
       * @returns {void}
       */
      function setNonIDBGlobals(prefix = '') {
        shim(prefix + 'DOMException', ShimDOMException);
        shim(prefix + 'DOMStringList', DOMStringList, {
          enumerable: false,
          configurable: true,
          writable: true,
          value: DOMStringList
        });
        shim(prefix + 'Event', ShimEvent, {
          configurable: true,
          writable: true,
          value: ShimEvent,
          enumerable: false
        });
        shim(prefix + 'CustomEvent', ShimCustomEvent, {
          configurable: true,
          writable: true,
          value: ShimCustomEvent,
          enumerable: false
        });
        shim(prefix + 'EventTarget', EventTarget, {
          configurable: true,
          writable: true,
          value: EventTarget,
          enumerable: false
        });
      }
      const shimIDBFactory = IDBFactory;
      if (CFG.win.openDatabase !== undefined) {
        shimIndexedDB.__openDatabase = CFG.win.openDatabase.bind(CFG.win); // We cache here in case the function is overwritten later as by the IndexedDB support promises tests
        // Polyfill ALL of IndexedDB, using WebSQL
        shim('indexedDB', shimIndexedDB, {
          enumerable: true,
          configurable: true,
          get() {
            if (this !== IDB && !isNullish(this) && !this.shimNS) {
              // Latter is hack for test environment
              throw new TypeError('Illegal invocation');
            }
            return shimIndexedDB;
          }
        });
        /** @type {[string, any][]} */
        [['IDBFactory', shimIDBFactory], ['IDBDatabase', IDBDatabase], ['IDBObjectStore', IDBObjectStore], ['IDBIndex', IDBIndex], ['IDBTransaction', IDBTransaction], ['IDBCursor', IDBCursor], ['IDBCursorWithValue', IDBCursorWithValue], ['IDBKeyRange', IDBKeyRange], ['IDBRequest', IDBRequest], ['IDBOpenDBRequest', IDBOpenDBRequest], ['IDBVersionChangeEvent', IDBVersionChangeEvent]].forEach(([prop, obj]) => {
          shim(prop, obj, {
            enumerable: false,
            configurable: true
          });
        });
        // For Node environments
        if (CFG.fs) {
          setFS(CFG.fs);
        }
        if (CFG.fullIDLSupport) {
          // Slow per MDN so off by default! Though apparently needed for WebIDL: https://stackoverflow.com/questions/41927589/rationales-consequences-of-webidl-class-inheritance-requirements

          Object.setPrototypeOf(IDB.IDBOpenDBRequest, IDB.IDBRequest);
          Object.setPrototypeOf(IDB.IDBCursorWithValue, IDB.IDBCursor);
          Object.setPrototypeOf(IDBDatabase, EventTarget);
          Object.setPrototypeOf(IDBRequest, EventTarget);
          Object.setPrototypeOf(IDBTransaction, EventTarget);
          Object.setPrototypeOf(IDBVersionChangeEvent, ShimEvent);
          Object.setPrototypeOf(ShimDOMException, Error);
          Object.setPrototypeOf(ShimDOMException.prototype, Error.prototype);
          setPrototypeOfCustomEvent();
        }
        if (IDB.indexedDB && !IDB.indexedDB.toString().includes('[native code]')) {
          if (CFG.addNonIDBGlobals) {
            // As `DOMStringList` exists per IDL (and Chrome) in the global
            //   thread (but not in workers), we prefix the name to avoid
            //   shadowing or conflicts
            setNonIDBGlobals('Shim');
          }
          if (CFG.replaceNonIDBGlobals) {
            setNonIDBGlobals();
          }
        }
        /* istanbul ignore next -- TS guard */
        if (!IDB.shimIndexedDB) {
          return;
        }
        IDB.shimIndexedDB.__setConnectionQueueOrigin();
      }
    };
    IDB.shimIndexedDB.__debug = function (val) {
      CFG.DEBUG = val;
    };
    IDB.shimIndexedDB.__setConfig = setConfig;

    /** @type {GetConfig} */
    IDB.shimIndexedDB.__getConfig = function (prop) {
      if (!Object.hasOwn(CFG, prop)) {
        throw new Error(prop + ' is not a valid configuration property');
      }
      return CFG[prop];
    };

    /** @type {SetUnicodeIdentifiers} */
    IDB.shimIndexedDB.__setUnicodeIdentifiers = function ({
      UnicodeIDStart,
      UnicodeIDContinue
    }) {
      setConfig({
        UnicodeIDStart,
        UnicodeIDContinue
      });
    };
  } else {
    // We no-op the harmless set-up properties and methods with a warning; the `IDBFactory` methods,
    //    however (including our non-standard methods), are not stubbed as they ought
    //    to fail earlier rather than potentially having side effects.
    IDB.shimIndexedDB = /** @type {ShimIndexedDB} */{};
    /** @type {const} */
    ['__useShim', '__debug', '__setConfig', '__getConfig', '__setUnicodeIdentifiers'].forEach(prop => {
      /** @type {ShimIndexedDB} */IDB.shimIndexedDB[prop] = /** @type {() => any} */function () {
        console.warn('This browser does not have WebSQL to shim.');
      };
    });
  }

  // Workaround to prevent an error in Firefox
  if (!('indexedDB' in IDB) && typeof window !== 'undefined') {
    // 2nd condition avoids problems in Node
    IDB.indexedDB ||= /** @type {IDBFactory} */
    'webkitIndexedDB' in IDB && IDB.webkitIndexedDB || 'mozIndexedDB' in IDB && IDB.mozIndexedDB || 'oIndexedDB' in IDB && IDB.oIndexedDB || 'msIndexedDB' in IDB && IDB.msIndexedDB;
  }

  // Detect browsers with known IndexedDB issues (e.g. Android pre-4.4)
  const poorIndexedDbSupport = typeof navigator !== 'undefined' &&
  // Not apparently defined in React Native
  navigator.userAgent && (
  // Ignore Node or other environments
  // Bad non-Chrome Android support
  /Android (?:2|3|4\.[0-3])/u.test(navigator.userAgent) && !navigator.userAgent.includes('Chrome') ||
  // Bad non-Safari iOS9 support (see <https://github.com/axemclion/IndexedDBShim/issues/252>)
  (!navigator.userAgent.includes('Safari') || navigator.userAgent.includes('Chrome')) &&
  // Exclude genuine Safari: https://stackoverflow.com/a/7768006/271577
  // Detect iOS: https://stackoverflow.com/questions/9038625/detect-if-device-is-ios/9039885#9039885
  // and detect version 9: https://stackoverflow.com/a/26363560/271577
  /(iPad|iPhone|iPod).* os 9_/ui.test(navigator.userAgent) && typeof window !== 'undefined' && !('MSStream' in window) // But avoid IE11
  );
  if (!CFG.DEFAULT_DB_SIZE) {
    CFG.DEFAULT_DB_SIZE = (
    // Safari currently requires larger size: (We don't need a larger size for Node as node-websql doesn't use this info)
    // https://github.com/axemclion/IndexedDBShim/issues/41
    // https://github.com/axemclion/IndexedDBShim/issues/115
    typeof navigator !== 'undefined' &&
    // React Native
    navigator.userAgent && navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome') ? 25 : 4) * 1024 * 1024;
  }
  if (!CFG.avoidAutoShim && (!IDB.indexedDB || poorIndexedDbSupport) && CFG.win.openDatabase !== undefined) {
    IDB.shimIndexedDB.__useShim();
  } else {
    /* eslint-disable unicorn/logical-assignment-operators -- TS */
    IDB.IDBDatabase = IDB.IDBDatabase || 'webkitIDBDatabase' in IDB && IDB.webkitIDBDatabase;
    IDB.IDBTransaction = IDB.IDBTransaction || 'webkitIDBTransaction' in IDB && IDB.webkitIDBTransaction || {};
    IDB.IDBCursor = IDB.IDBCursor || 'webkitIDBCursor' in IDB && IDB.webkitIDBCursor;
    IDB.IDBKeyRange = IDB.IDBKeyRange || 'webkitIDBKeyRange' in IDB && IDB.webkitIDBKeyRange;
    /* eslint-enable unicorn/logical-assignment-operators -- TS */
  }
  return /** @type {ShimmedObject} */IDB;
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var nextTick = {};

var hasRequiredNextTick;
function requireNextTick() {
  if (hasRequiredNextTick) return nextTick;
  hasRequiredNextTick = 1;
  nextTick.test = function () {
    // Don't get fooled by e.g. browserify environments.
    return typeof process !== 'undefined' && !process.browser;
  };
  nextTick.install = function (func) {
    return function () {
      process.nextTick(func);
    };
  };
  return nextTick;
}

var queueMicrotask$1 = {};

var hasRequiredQueueMicrotask;
function requireQueueMicrotask() {
  if (hasRequiredQueueMicrotask) return queueMicrotask$1;
  hasRequiredQueueMicrotask = 1;
  queueMicrotask$1.test = function () {
    return typeof commonjsGlobal.queueMicrotask === 'function';
  };
  queueMicrotask$1.install = function (func) {
    return function () {
      commonjsGlobal.queueMicrotask(func);
    };
  };
  return queueMicrotask$1;
}

var mutation = {};

var hasRequiredMutation;
function requireMutation() {
  if (hasRequiredMutation) return mutation;
  hasRequiredMutation = 1;
  //based off rsvp https://github.com/tildeio/rsvp.js
  //license https://github.com/tildeio/rsvp.js/blob/master/LICENSE
  //https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/asap.js

  var Mutation = commonjsGlobal.MutationObserver || commonjsGlobal.WebKitMutationObserver;
  mutation.test = function () {
    return Mutation;
  };
  mutation.install = function (handle) {
    var called = 0;
    var observer = new Mutation(handle);
    var element = commonjsGlobal.document.createTextNode('');
    observer.observe(element, {
      characterData: true
    });
    return function () {
      element.data = called = ++called % 2;
    };
  };
  return mutation;
}

var messageChannel = {};

var hasRequiredMessageChannel;
function requireMessageChannel() {
  if (hasRequiredMessageChannel) return messageChannel;
  hasRequiredMessageChannel = 1;
  messageChannel.test = function () {
    if (commonjsGlobal.setImmediate) {
      // we can only get here in IE10
      // which doesn't handel postMessage well
      return false;
    }
    return typeof commonjsGlobal.MessageChannel !== 'undefined';
  };
  messageChannel.install = function (func) {
    var channel = new commonjsGlobal.MessageChannel();
    channel.port1.onmessage = func;
    return function () {
      channel.port2.postMessage(0);
    };
  };
  return messageChannel;
}

var stateChange = {};

var hasRequiredStateChange;
function requireStateChange() {
  if (hasRequiredStateChange) return stateChange;
  hasRequiredStateChange = 1;
  stateChange.test = function () {
    return 'document' in commonjsGlobal && 'onreadystatechange' in commonjsGlobal.document.createElement('script');
  };
  stateChange.install = function (handle) {
    return function () {
      // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
      // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
      var scriptEl = commonjsGlobal.document.createElement('script');
      scriptEl.onreadystatechange = function () {
        handle();
        scriptEl.onreadystatechange = null;
        scriptEl.parentNode.removeChild(scriptEl);
        scriptEl = null;
      };
      commonjsGlobal.document.documentElement.appendChild(scriptEl);
      return handle;
    };
  };
  return stateChange;
}

var timeout = {};

var hasRequiredTimeout;
function requireTimeout() {
  if (hasRequiredTimeout) return timeout;
  hasRequiredTimeout = 1;
  timeout.test = function () {
    return true;
  };
  timeout.install = function (t) {
    return function () {
      setTimeout(t, 0);
    };
  };
  return timeout;
}

var lib$1;
var hasRequiredLib$1;
function requireLib$1() {
  if (hasRequiredLib$1) return lib$1;
  hasRequiredLib$1 = 1;
  var types = [requireNextTick(), requireQueueMicrotask(), requireMutation(), requireMessageChannel(), requireStateChange(), requireTimeout()];
  var draining;
  var currentQueue;
  var queueIndex = -1;
  var queue = [];
  var scheduled = false;
  function cleanUpNextTick() {
    if (!draining || !currentQueue) {
      return;
    }
    draining = false;
    if (currentQueue.length) {
      queue = currentQueue.concat(queue);
    } else {
      queueIndex = -1;
    }
    if (queue.length) {
      nextTick();
    }
  }

  //named nextTick for less confusing stack traces
  function nextTick() {
    if (draining) {
      return;
    }
    scheduled = false;
    draining = true;
    var len = queue.length;
    var timeout = setTimeout(cleanUpNextTick);
    while (len) {
      currentQueue = queue;
      queue = [];
      while (currentQueue && ++queueIndex < len) {
        currentQueue[queueIndex].run();
      }
      queueIndex = -1;
      len = queue.length;
    }
    currentQueue = null;
    queueIndex = -1;
    draining = false;
    clearTimeout(timeout);
  }
  var scheduleDrain;
  var i = -1;
  var len = types.length;
  while (++i < len) {
    if (types[i] && types[i].test && types[i].test()) {
      scheduleDrain = types[i].install(nextTick);
      break;
    }
  }
  // v8 likes predictible objects
  function Item(fun, array) {
    this.fun = fun;
    this.array = array;
  }
  Item.prototype.run = function () {
    var fun = this.fun;
    var array = this.array;
    switch (array.length) {
      case 0:
        return fun();
      case 1:
        return fun(array[0]);
      case 2:
        return fun(array[0], array[1]);
      case 3:
        return fun(array[0], array[1], array[2]);
      default:
        return fun.apply(null, array);
    }
  };
  lib$1 = immediate;
  function immediate(task) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }
    }
    queue.push(new Item(task, args));
    if (!scheduled && !draining) {
      scheduled = true;
      scheduleDrain();
    }
  }
  return lib$1;
}

var libExports$1 = requireLib$1();
var immediate = /*@__PURE__*/getDefaultExportFromCjs(libExports$1);

var tinyQueue;
var hasRequiredTinyQueue;
function requireTinyQueue() {
  if (hasRequiredTinyQueue) return tinyQueue;
  hasRequiredTinyQueue = 1;

  // Simple FIFO queue implementation to avoid having to do shift()
  // on an array, which is slow.

  function Queue() {
    this.length = 0;
  }
  Queue.prototype.push = function (item) {
    var node = {
      item: item
    };
    if (this.last) {
      this.last = this.last.next = node;
    } else {
      this.last = this.first = node;
    }
    this.length++;
  };
  Queue.prototype.shift = function () {
    var node = this.first;
    if (node) {
      this.first = node.next;
      if (! --this.length) {
        this.last = undefined;
      }
      return node.item;
    }
  };
  Queue.prototype.slice = function (start, end) {
    start = typeof start === 'undefined' ? 0 : start;
    end = typeof end === 'undefined' ? Infinity : end;
    var output = [];
    var i = 0;
    for (var node = this.first; node; node = node.next) {
      if (--end < 0) {
        break;
      } else if (++i > start) {
        output.push(node.item);
      }
    }
    return output;
  };
  tinyQueue = Queue;
  return tinyQueue;
}

var tinyQueueExports = requireTinyQueue();
var Queue = /*@__PURE__*/getDefaultExportFromCjs(tinyQueueExports);

var noopFn;
var hasRequiredNoopFn;
function requireNoopFn() {
  if (hasRequiredNoopFn) return noopFn;
  hasRequiredNoopFn = 1;
  noopFn = function () {};
  return noopFn;
}

var noopFnExports = requireNoopFn();
var noop = /*@__PURE__*/getDefaultExportFromCjs(noopFnExports);

function WebSQLRows(array) {
  this._array = array;
  this.length = array.length;
}
WebSQLRows.prototype.item = function (i) {
  return this._array[i];
};
function WebSQLResultSet(insertId, rowsAffected, rows) {
  this.insertId = insertId;
  this.rowsAffected = rowsAffected;
  this.rows = new WebSQLRows(rows);
}

function errorUnhandled() {
  return true; // a non-truthy return indicates error was handled
}

// WebSQL has some bizarre behavior regarding insertId/rowsAffected. To try
// to match the observed behavior of Chrome/Safari as much as possible, we
// sniff the SQL message to try to massage the returned insertId/rowsAffected.
// This helps us pass the tests, although it's error-prone and should
// probably be revised.
function massageSQLResult(sql, insertId, rowsAffected, rows) {
  if (/^\s*UPDATE\b/i.test(sql)) {
    // insertId is always undefined for "UPDATE" statements
    insertId = void 0;
  } else if (/^\s*CREATE\s+TABLE\b/i.test(sql)) {
    // WebSQL always returns an insertId of 0 for "CREATE TABLE" statements
    insertId = 0;
    rowsAffected = 0;
  } else if (/^\s*DROP\s+TABLE\b/i.test(sql)) {
    // WebSQL always returns insertId=undefined and rowsAffected=0
    // for "DROP TABLE" statements. Go figure.
    insertId = void 0;
    rowsAffected = 0;
  } else if (!/^\s*INSERT\b/i.test(sql)) {
    // for all non-inserts (deletes, etc.) insertId is always undefined
    // ¯\_(ツ)_/¯
    insertId = void 0;
  }
  return new WebSQLResultSet(insertId, rowsAffected, rows);
}
function SQLTask(sql, args, sqlCallback, sqlErrorCallback) {
  this.sql = sql;
  this.args = args;
  this.sqlCallback = sqlCallback;
  this.sqlErrorCallback = sqlErrorCallback;
}
function runBatch(self, batch) {
  function onDone() {
    self._running = false;
    runAllSql(self);
  }
  var readOnly = self._websqlDatabase._currentTask.readOnly;
  self._websqlDatabase._db.exec(batch, readOnly, function (err, results) {
    /* istanbul ignore next */
    if (err) {
      self._error = err;
      return onDone();
    }
    for (var i = 0; i < results.length; i++) {
      var res = results[i];
      var batchTask = batch[i];
      if (res.error) {
        if (batchTask.sqlErrorCallback(self, res.error)) {
          // user didn't handle the error
          self._error = res.error;
          return onDone();
        }
      } else {
        try {
          batchTask.sqlCallback(self, massageSQLResult(batch[i].sql, res.insertId, res.rowsAffected, res.rows));
        } catch (err) {
          self._error = err;
          runAllSql(self);
        }
      }
    }
    onDone();
  });
}
function runAllSql(self) {
  if (self._running || self._complete) {
    return;
  }
  if (self._error || !self._sqlQueue.length) {
    self._complete = true;
    return self._websqlDatabase._onTransactionComplete(self._error);
  }
  self._running = true;
  var batch = [];
  var task;
  while (task = self._sqlQueue.shift()) {
    batch.push(task);
  }
  runBatch(self, batch);
}
function executeSql(self, sql, args, sqlCallback, sqlErrorCallback, executeDelay) {
  self._sqlQueue.push(new SQLTask(sql, args, sqlCallback, sqlErrorCallback));
  if (self._runningTimeout) {
    return;
  }
  self._runningTimeout = true;
  executeDelay(function () {
    self._runningTimeout = false;
    runAllSql(self);
  });
}
function WebSQLTransaction(websqlDatabase, executeDelay) {
  this._websqlDatabase = websqlDatabase;
  this._error = null;
  this._complete = false;
  this._runningTimeout = false;
  this._executeDelay = executeDelay || immediate;
  this._sqlQueue = new Queue();
  if (!websqlDatabase._currentTask.readOnly) {
    // Since we serialize all access to the database, there is no need to
    // run read-only tasks in a transaction. This is a perf boost.
    this._sqlQueue.push(new SQLTask('BEGIN;', [], noop, noop));
  }
}

/**
 * @param {string} sql
 * @param {ObjectArray} args
 * @param {SQLStatementCallback} sqlCallback
 * @param {SQLStatementErrorCallback} sqlErrorCallback
 */
WebSQLTransaction.prototype.executeSql = function (sql, args, sqlCallback, sqlErrorCallback) {
  args = Array.isArray(args) ? args : [];
  sqlCallback = typeof sqlCallback === 'function' ? sqlCallback : noop;
  sqlErrorCallback = typeof sqlErrorCallback === 'function' ? sqlErrorCallback : errorUnhandled;
  executeSql(this, sql, args, sqlCallback, sqlErrorCallback, this._executeDelay);
};
WebSQLTransaction.prototype._checkDone = function () {
  runAllSql(this);
};

var ROLLBACK = [{
  sql: 'ROLLBACK;',
  args: []
}];
var COMMIT = [{
  sql: 'END;',
  args: []
}];

// v8 likes predictable objects
function TransactionTask(readOnly, txnCallback, errorCallback, successCallback, nonstandardTransCb) {
  this.readOnly = readOnly;
  this.txnCallback = txnCallback;
  this.errorCallback = errorCallback;
  this.successCallback = successCallback;
  this.nonstandardTransCb = nonstandardTransCb;
}
function WebSQLDatabase(dbVersion, db, webSQLOverrides) {
  this.version = dbVersion;
  this._db = db;
  this._txnQueue = new Queue();
  this._running = false;
  this._currentTask = null;
  this._transactionDelay = webSQLOverrides.transactionDelay || immediate;
  this._executeDelay = webSQLOverrides.executeDelay;
}
WebSQLDatabase.prototype._onTransactionComplete = function (err) {
  var self = this;
  function done(er) {
    if (er) {
      self._currentTask && self._currentTask.errorCallback(er);
    } else {
      self._currentTask && self._currentTask.successCallback();
    }
    self._running = false;
    self._currentTask = null;
    self._runNextTransaction();
  }
  function rollback(er, cb) {
    self._db.exec(ROLLBACK, false, function () {
      done(er);
      if (cb) {
        cb();
      }
    });
  }
  function commit(cb) {
    self._db.exec(COMMIT, false, function () {
      done();
      if (cb) {
        cb();
      }
    });
  }
  if (self._currentTask && self._currentTask.nonstandardTransCb) {
    var cont = self._currentTask.nonstandardTransCb.call(this, self._currentTask, err, done, rollback, commit);
    if (!cont) {
      return;
    }
  }
  if (self._currentTask && self._currentTask.readOnly) {
    done(err); // read-only doesn't require a transaction
  } else if (err) {
    rollback(err);
  } else {
    commit();
  }
};
WebSQLDatabase.prototype._runTransaction = function () {
  var self = this;
  var txn = new WebSQLTransaction(self, this._executeDelay);
  this._transactionDelay(function () {
    self._currentTask.txnCallback(txn);
    txn._checkDone();
  });
};
WebSQLDatabase.prototype._runNextTransaction = function () {
  if (this._running) {
    return;
  }
  var task = this._txnQueue.shift();
  if (!task) {
    return;
  }
  this._currentTask = task;
  this._running = true;
  this._runTransaction();
};
WebSQLDatabase.prototype._createTransaction = function (readOnly, txnCallback, errorCallback, successCallback, nonstandardTransCb) {
  errorCallback = errorCallback || noop;
  successCallback = successCallback || noop;
  if (typeof txnCallback !== 'function') {
    throw new Error('The callback provided as parameter 1 is not a function.');
  }
  this._txnQueue.push(new TransactionTask(readOnly, txnCallback, errorCallback, successCallback, nonstandardTransCb));
  this._runNextTransaction();
};

/**
 * @param {(trans: import('./WebSQLTransaction.js').default) => void} txnCallback
 * @param {(err: SQLError) => void} [errorCallback]
 * @param {() => void} [successCallback]
 * @param {(
 *   currentTask: TransactionTask,
 *   err: Error,
 *   done: () => void,
 *   rollback: (err: boolean|Error|SQLError, cb: () => void) => void,
 *   commit: (cb: () => void) => void
 * ) => boolean} [nonstandardTransCb]
 */
WebSQLDatabase.prototype.transaction = function (txnCallback, errorCallback, successCallback, nonstandardTransCb) {
  this._createTransaction(false, txnCallback, errorCallback, successCallback, nonstandardTransCb);
};

/**
 * @param {(trans: import('./WebSQLTransaction.js').default) => void} txnCallback
 * @param {(err: Error) => void} [errorCallback]
 * @param {() => void} [successCallback]
 */
WebSQLDatabase.prototype.readTransaction = function (txnCallback, errorCallback, successCallback) {
  this._createTransaction(true, txnCallback, errorCallback, successCallback);
};

function customOpenDatabase(SQLiteDatabase, opts) {
  opts = opts || {};
  var sqliteOpts = opts.sqlite;
  var webSQLOverrides = opts.websql || {};
  var openDelay = webSQLOverrides.openDelay || immediate;
  function createDb(dbName, dbVersion) {
    var sqliteDatabase = new SQLiteDatabase(dbName, sqliteOpts);
    return new WebSQLDatabase(dbVersion, sqliteDatabase, webSQLOverrides);
  }
  function openDatabase(args) {
    if (args.length < 4) {
      throw new Error('Failed to execute \'openDatabase\': ' + '4 arguments required, but only ' + args.length + ' present');
    }
    var dbName = args[0];
    var dbVersion = args[1];
    // db description and size are ignored
    var callback = args[4];
    var db = createDb(dbName, dbVersion);
    if (typeof callback === 'function') {
      openDelay(function () {
        callback(db);
      });
    }
    return db;
  }
  return (...args) => openDatabase(args);
}

var lib = {exports: {}};

var util = {};

var hasRequiredUtil;
function requireUtil() {
  if (hasRequiredUtil) return util;
  hasRequiredUtil = 1;
  util.getBooleanOption = (options, key) => {
    let value = false;
    if (key in options && typeof (value = options[key]) !== 'boolean') {
      throw new TypeError(`Expected the "${key}" option to be a boolean`);
    }
    return value;
  };
  util.cppdb = Symbol();
  util.inspect = Symbol.for('nodejs.util.inspect.custom');
  return util;
}

var sqliteError;
var hasRequiredSqliteError;
function requireSqliteError() {
  if (hasRequiredSqliteError) return sqliteError;
  hasRequiredSqliteError = 1;
  class SqliteError extends Error {
    constructor(message, code) {
      if (typeof code !== 'string') {
        throw new TypeError('Expected second argument to be a string');
      }
      super('' + message);
      this.code = code;
      if (typeof Error.captureStackTrace === 'function') {
        Error.captureStackTrace(this, SqliteError);
      }
    }
  }
  Object.defineProperty(SqliteError.prototype, 'name', {
    value: 'SqliteError',
    writable: true,
    enumerable: false,
    configurable: true
  });
  sqliteError = SqliteError;
  return sqliteError;
}

var wrappers = {};

var hasRequiredWrappers;
function requireWrappers() {
  if (hasRequiredWrappers) return wrappers;
  hasRequiredWrappers = 1;
  const {
    cppdb
  } = requireUtil();
  wrappers.prepare = function prepare(sql) {
    return this[cppdb].prepare(sql, this, false, false);
  };
  wrappers.exec = function exec(sql) {
    this[cppdb].exec(sql);
    return this;
  };
  wrappers.close = function close() {
    this[cppdb].close();
    return this;
  };
  wrappers.loadExtension = function loadExtension(...args) {
    this[cppdb].loadExtension(...args);
    return this;
  };
  wrappers.defaultSafeIntegers = function defaultSafeIntegers(...args) {
    this[cppdb].defaultSafeIntegers(...args);
    return this;
  };
  wrappers.unsafeMode = function unsafeMode(...args) {
    this[cppdb].unsafeMode(...args);
    return this;
  };
  wrappers.getters = {
    name: {
      get: function name() {
        return this[cppdb].name;
      },
      enumerable: true
    },
    open: {
      get: function open() {
        return this[cppdb].open;
      },
      enumerable: true
    },
    inTransaction: {
      get: function inTransaction() {
        return this[cppdb].inTransaction;
      },
      enumerable: true
    },
    readonly: {
      get: function readonly() {
        return this[cppdb].readonly;
      },
      enumerable: true
    },
    memory: {
      get: function memory() {
        return this[cppdb].memory;
      },
      enumerable: true
    }
  };
  return wrappers;
}

var transaction;
var hasRequiredTransaction;
function requireTransaction() {
  if (hasRequiredTransaction) return transaction;
  hasRequiredTransaction = 1;
  const {
    cppdb
  } = requireUtil();
  const controllers = new WeakMap();
  transaction = function transaction(fn) {
    if (typeof fn !== 'function') throw new TypeError('Expected first argument to be a function');
    const db = this[cppdb];
    const controller = getController(db, this);
    const {
      apply
    } = Function.prototype;

    // Each version of the transaction function has these same properties
    const properties = {
      default: {
        value: wrapTransaction(apply, fn, db, controller.default)
      },
      deferred: {
        value: wrapTransaction(apply, fn, db, controller.deferred)
      },
      immediate: {
        value: wrapTransaction(apply, fn, db, controller.immediate)
      },
      exclusive: {
        value: wrapTransaction(apply, fn, db, controller.exclusive)
      },
      database: {
        value: this,
        enumerable: true
      }
    };
    Object.defineProperties(properties.default.value, properties);
    Object.defineProperties(properties.deferred.value, properties);
    Object.defineProperties(properties.immediate.value, properties);
    Object.defineProperties(properties.exclusive.value, properties);

    // Return the default version of the transaction function
    return properties.default.value;
  };

  // Return the database's cached transaction controller, or create a new one
  const getController = (db, self) => {
    let controller = controllers.get(db);
    if (!controller) {
      const shared = {
        commit: db.prepare('COMMIT', self, false, false),
        rollback: db.prepare('ROLLBACK', self, false, false),
        savepoint: db.prepare('SAVEPOINT `\t_bs3.\t`', self, false, false),
        release: db.prepare('RELEASE `\t_bs3.\t`', self, false, false),
        rollbackTo: db.prepare('ROLLBACK TO `\t_bs3.\t`', self, false, false)
      };
      controllers.set(db, controller = {
        default: Object.assign({
          begin: db.prepare('BEGIN', self, false, false)
        }, shared),
        deferred: Object.assign({
          begin: db.prepare('BEGIN DEFERRED', self, false, false)
        }, shared),
        immediate: Object.assign({
          begin: db.prepare('BEGIN IMMEDIATE', self, false, false)
        }, shared),
        exclusive: Object.assign({
          begin: db.prepare('BEGIN EXCLUSIVE', self, false, false)
        }, shared)
      });
    }
    return controller;
  };

  // Return a new transaction function by wrapping the given function
  const wrapTransaction = (apply, fn, db, {
    begin,
    commit,
    rollback,
    savepoint,
    release,
    rollbackTo
  }) => function sqliteTransaction() {
    let before, after, undo;
    if (db.inTransaction) {
      before = savepoint;
      after = release;
      undo = rollbackTo;
    } else {
      before = begin;
      after = commit;
      undo = rollback;
    }
    before.run();
    try {
      const result = apply.call(fn, this, arguments);
      if (result && typeof result.then === 'function') {
        throw new TypeError('Transaction function cannot return a promise');
      }
      after.run();
      return result;
    } catch (ex) {
      if (db.inTransaction) {
        undo.run();
        if (undo !== rollback) after.run();
      }
      throw ex;
    }
  };
  return transaction;
}

var pragma;
var hasRequiredPragma;
function requirePragma() {
  if (hasRequiredPragma) return pragma;
  hasRequiredPragma = 1;
  const {
    getBooleanOption,
    cppdb
  } = requireUtil();
  pragma = function pragma(source, options) {
    if (options == null) options = {};
    if (typeof source !== 'string') throw new TypeError('Expected first argument to be a string');
    if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
    const simple = getBooleanOption(options, 'simple');
    const stmt = this[cppdb].prepare(`PRAGMA ${source}`, this, true, false);
    return simple ? stmt.pluck().get() : stmt.all();
  };
  return pragma;
}

var explain;
var hasRequiredExplain;
function requireExplain() {
  if (hasRequiredExplain) return explain;
  hasRequiredExplain = 1;
  const {
    cppdb
  } = requireUtil();
  explain = function explain(source) {
    if (typeof source !== 'string') throw new TypeError('Expected first argument to be a string');
    const stmt = this[cppdb].prepare(`EXPLAIN ${source}`, this, false, true);
    return stmt.all();
  };
  return explain;
}

var backup;
var hasRequiredBackup;
function requireBackup() {
  if (hasRequiredBackup) return backup;
  hasRequiredBackup = 1;
  const fs = require$$0;
  const path$1 = path;
  const {
    promisify
  } = require$$2;
  const {
    cppdb
  } = requireUtil();
  const fsAccess = promisify(fs.access);
  backup = async function backup(filename, options) {
    if (options == null) options = {};

    // Validate arguments
    if (typeof filename !== 'string') throw new TypeError('Expected first argument to be a string');
    if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');

    // Interpret options
    filename = filename.trim();
    const attachedName = 'attached' in options ? options.attached : 'main';
    const handler = 'progress' in options ? options.progress : null;

    // Validate interpreted options
    if (!filename) throw new TypeError('Backup filename cannot be an empty string');
    if (filename === ':memory:') throw new TypeError('Invalid backup filename ":memory:"');
    if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
    if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
    if (handler != null && typeof handler !== 'function') throw new TypeError('Expected the "progress" option to be a function');

    // Make sure the specified directory exists
    await fsAccess(path$1.dirname(filename)).catch(() => {
      throw new TypeError('Cannot save backup because the directory does not exist');
    });
    const isNewFile = await fsAccess(filename).then(() => false, () => true);
    return runBackup(this[cppdb].backup(this, attachedName, filename, isNewFile), handler || null);
  };
  const runBackup = (backup, handler) => {
    let rate = 0;
    let useDefault = true;
    return new Promise((resolve, reject) => {
      setImmediate(function step() {
        try {
          const progress = backup.transfer(rate);
          if (!progress.remainingPages) {
            backup.close();
            resolve(progress);
            return;
          }
          if (useDefault) {
            useDefault = false;
            rate = 100;
          }
          if (handler) {
            const ret = handler(progress);
            if (ret !== undefined) {
              if (typeof ret === 'number' && ret === ret) rate = Math.max(0, Math.min(0x7fffffff, Math.round(ret)));else throw new TypeError('Expected progress callback to return a number or undefined');
            }
          }
          setImmediate(step);
        } catch (err) {
          backup.close();
          reject(err);
        }
      });
    });
  };
  return backup;
}

var serialize;
var hasRequiredSerialize;
function requireSerialize() {
  if (hasRequiredSerialize) return serialize;
  hasRequiredSerialize = 1;
  const {
    cppdb
  } = requireUtil();
  serialize = function serialize(options) {
    if (options == null) options = {};

    // Validate arguments
    if (typeof options !== 'object') throw new TypeError('Expected first argument to be an options object');

    // Interpret and validate options
    const attachedName = 'attached' in options ? options.attached : 'main';
    if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
    if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
    return this[cppdb].serialize(attachedName);
  };
  return serialize;
}

var _function;
var hasRequired_function;
function require_function() {
  if (hasRequired_function) return _function;
  hasRequired_function = 1;
  const {
    getBooleanOption,
    cppdb
  } = requireUtil();
  _function = function defineFunction(name, options, fn) {
    // Apply defaults
    if (options == null) options = {};
    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    // Validate arguments
    if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
    if (typeof fn !== 'function') throw new TypeError('Expected last argument to be a function');
    if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
    if (!name) throw new TypeError('User-defined function name cannot be an empty string');

    // Interpret options
    const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
    const deterministic = getBooleanOption(options, 'deterministic');
    const directOnly = getBooleanOption(options, 'directOnly');
    const varargs = getBooleanOption(options, 'varargs');
    let argCount = -1;

    // Determine argument count
    if (!varargs) {
      argCount = fn.length;
      if (!Number.isInteger(argCount) || argCount < 0) throw new TypeError('Expected function.length to be a positive integer');
      if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
    }
    this[cppdb].function(fn, name, argCount, safeIntegers, deterministic, directOnly);
    return this;
  };
  return _function;
}

var aggregate;
var hasRequiredAggregate;
function requireAggregate() {
  if (hasRequiredAggregate) return aggregate;
  hasRequiredAggregate = 1;
  const {
    getBooleanOption,
    cppdb
  } = requireUtil();
  aggregate = function defineAggregate(name, options) {
    // Validate arguments
    if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
    if (typeof options !== 'object' || options === null) throw new TypeError('Expected second argument to be an options object');
    if (!name) throw new TypeError('User-defined function name cannot be an empty string');

    // Interpret options
    const start = 'start' in options ? options.start : null;
    const step = getFunctionOption(options, 'step', true);
    const inverse = getFunctionOption(options, 'inverse', false);
    const result = getFunctionOption(options, 'result', false);
    const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
    const deterministic = getBooleanOption(options, 'deterministic');
    const directOnly = getBooleanOption(options, 'directOnly');
    const varargs = getBooleanOption(options, 'varargs');
    let argCount = -1;

    // Determine argument count
    if (!varargs) {
      argCount = Math.max(getLength(step), inverse ? getLength(inverse) : 0);
      if (argCount > 0) argCount -= 1;
      if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
    }
    this[cppdb].aggregate(start, step, inverse, result, name, argCount, safeIntegers, deterministic, directOnly);
    return this;
  };
  const getFunctionOption = (options, key, required) => {
    const value = key in options ? options[key] : null;
    if (typeof value === 'function') return value;
    if (value != null) throw new TypeError(`Expected the "${key}" option to be a function`);
    if (required) throw new TypeError(`Missing required option "${key}"`);
    return null;
  };
  const getLength = ({
    length
  }) => {
    if (Number.isInteger(length) && length >= 0) return length;
    throw new TypeError('Expected function.length to be a positive integer');
  };
  return aggregate;
}

var table;
var hasRequiredTable;
function requireTable() {
  if (hasRequiredTable) return table;
  hasRequiredTable = 1;
  const {
    cppdb
  } = requireUtil();
  table = function defineTable(name, factory) {
    // Validate arguments
    if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
    if (!name) throw new TypeError('Virtual table module name cannot be an empty string');

    // Determine whether the module is eponymous-only or not
    let eponymous = false;
    if (typeof factory === 'object' && factory !== null) {
      eponymous = true;
      factory = defer(parseTableDefinition(factory, 'used', name));
    } else {
      if (typeof factory !== 'function') throw new TypeError('Expected second argument to be a function or a table definition object');
      factory = wrapFactory(factory);
    }
    this[cppdb].table(factory, name, eponymous);
    return this;
  };
  function wrapFactory(factory) {
    return function virtualTableFactory(moduleName, databaseName, tableName, ...args) {
      const thisObject = {
        module: moduleName,
        database: databaseName,
        table: tableName
      };

      // Generate a new table definition by invoking the factory
      const def = apply.call(factory, thisObject, args);
      if (typeof def !== 'object' || def === null) {
        throw new TypeError(`Virtual table module "${moduleName}" did not return a table definition object`);
      }
      return parseTableDefinition(def, 'returned', moduleName);
    };
  }
  function parseTableDefinition(def, verb, moduleName) {
    // Validate required properties
    if (!hasOwnProperty.call(def, 'rows')) {
      throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "rows" property`);
    }
    if (!hasOwnProperty.call(def, 'columns')) {
      throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "columns" property`);
    }

    // Validate "rows" property
    const rows = def.rows;
    if (typeof rows !== 'function' || Object.getPrototypeOf(rows) !== GeneratorFunctionPrototype) {
      throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "rows" property (should be a generator function)`);
    }

    // Validate "columns" property
    let columns = def.columns;
    if (!Array.isArray(columns) || !isStringArray(columns = [...columns])) {
      throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "columns" property (should be an array of strings)`);
    }
    if (columns.length !== new Set(columns).size) {
      throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate column names`);
    }
    if (!columns.length) {
      throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with zero columns`);
    }

    // Validate "parameters" property
    let parameters;
    if (hasOwnProperty.call(def, 'parameters')) {
      parameters = def.parameters;
      if (!Array.isArray(parameters) || !isStringArray(parameters = [...parameters])) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "parameters" property (should be an array of strings)`);
      }
    } else {
      parameters = inferParameters(rows);
    }
    if (parameters.length !== new Set(parameters).size) {
      throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate parameter names`);
    }
    if (parameters.length > 32) {
      throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with more than the maximum number of 32 parameters`);
    }
    for (const parameter of parameters) {
      if (columns.includes(parameter)) {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with column "${parameter}" which was ambiguously defined as both a column and parameter`);
      }
    }

    // Validate "safeIntegers" option
    let safeIntegers = 2;
    if (hasOwnProperty.call(def, 'safeIntegers')) {
      const bool = def.safeIntegers;
      if (typeof bool !== 'boolean') {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "safeIntegers" property (should be a boolean)`);
      }
      safeIntegers = +bool;
    }

    // Validate "directOnly" option
    let directOnly = false;
    if (hasOwnProperty.call(def, 'directOnly')) {
      directOnly = def.directOnly;
      if (typeof directOnly !== 'boolean') {
        throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "directOnly" property (should be a boolean)`);
      }
    }

    // Generate SQL for the virtual table definition
    const columnDefinitions = [...parameters.map(identifier).map(str => `${str} HIDDEN`), ...columns.map(identifier)];
    return [`CREATE TABLE x(${columnDefinitions.join(', ')});`, wrapGenerator(rows, new Map(columns.map((x, i) => [x, parameters.length + i])), moduleName), parameters, safeIntegers, directOnly];
  }
  function wrapGenerator(generator, columnMap, moduleName) {
    return function* virtualTable(...args) {
      /*
      	We must defensively clone any buffers in the arguments, because
      	otherwise the generator could mutate one of them, which would cause
      	us to return incorrect values for hidden columns, potentially
      	corrupting the database.
       */
      const output = args.map(x => Buffer.isBuffer(x) ? Buffer.from(x) : x);
      for (let i = 0; i < columnMap.size; ++i) {
        output.push(null); // Fill with nulls to prevent gaps in array (v8 optimization)
      }
      for (const row of generator(...args)) {
        if (Array.isArray(row)) {
          extractRowArray(row, output, columnMap.size, moduleName);
          yield output;
        } else if (typeof row === 'object' && row !== null) {
          extractRowObject(row, output, columnMap, moduleName);
          yield output;
        } else {
          throw new TypeError(`Virtual table module "${moduleName}" yielded something that isn't a valid row object`);
        }
      }
    };
  }
  function extractRowArray(row, output, columnCount, moduleName) {
    if (row.length !== columnCount) {
      throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an incorrect number of columns`);
    }
    const offset = output.length - columnCount;
    for (let i = 0; i < columnCount; ++i) {
      output[i + offset] = row[i];
    }
  }
  function extractRowObject(row, output, columnMap, moduleName) {
    let count = 0;
    for (const key of Object.keys(row)) {
      const index = columnMap.get(key);
      if (index === undefined) {
        throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an undeclared column "${key}"`);
      }
      output[index] = row[key];
      count += 1;
    }
    if (count !== columnMap.size) {
      throw new TypeError(`Virtual table module "${moduleName}" yielded a row with missing columns`);
    }
  }
  function inferParameters({
    length
  }) {
    if (!Number.isInteger(length) || length < 0) {
      throw new TypeError('Expected function.length to be a positive integer');
    }
    const params = [];
    for (let i = 0; i < length; ++i) {
      params.push(`$${i + 1}`);
    }
    return params;
  }
  const {
    hasOwnProperty
  } = Object.prototype;
  const {
    apply
  } = Function.prototype;
  const GeneratorFunctionPrototype = Object.getPrototypeOf(function* () {});
  const identifier = str => `"${str.replace(/"/g, '""')}"`;
  const defer = x => () => x;
  const isStringArray = arr => {
    for (let i = 0; i < arr.length; ++i) {
      if (typeof arr[i] !== 'string') return false;
    }
    return true;
  };
  return table;
}

var inspect;
var hasRequiredInspect;
function requireInspect() {
  if (hasRequiredInspect) return inspect;
  hasRequiredInspect = 1;
  const DatabaseInspection = function Database() {};
  inspect = function inspect(depth, opts) {
    return Object.assign(new DatabaseInspection(), this);
  };
  return inspect;
}

var database;
var hasRequiredDatabase;
function requireDatabase() {
  if (hasRequiredDatabase) return database;
  hasRequiredDatabase = 1;
  const fs = require$$0;
  const path$1 = path;
  const util = requireUtil();
  const SqliteError = requireSqliteError();
  database = function createDatabase(getAddon, allowNativeBinding) {
    function Database(filenameGiven, options) {
      if (new.target == null) {
        return new Database(filenameGiven, options);
      }

      // Apply defaults
      let buffer;
      if (Buffer.isBuffer(filenameGiven)) {
        buffer = filenameGiven;
        filenameGiven = ':memory:';
      }
      if (filenameGiven == null) filenameGiven = '';
      if (options == null) options = {};

      // Validate arguments
      if (typeof filenameGiven !== 'string') throw new TypeError('Expected first argument to be a string');
      if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
      if ('readOnly' in options) throw new TypeError('Misspelled option "readOnly" should be "readonly"');
      if ('memory' in options) throw new TypeError('Option "memory" was removed in v7.0.0 (use ":memory:" filename instead)');

      // Interpret options
      const filename = filenameGiven.trim();
      const anonymous = filename === '' || filename === ':memory:';
      const readonly = util.getBooleanOption(options, 'readonly');
      const fileMustExist = util.getBooleanOption(options, 'fileMustExist');
      const timeout = 'timeout' in options ? options.timeout : 5000;
      const verbose = 'verbose' in options ? options.verbose : null;
      const nativeBinding = 'nativeBinding' in options ? options.nativeBinding : null;

      // Validate interpreted options
      if (readonly && anonymous && !buffer) throw new TypeError('In-memory/temporary databases cannot be readonly');
      if (!Number.isInteger(timeout) || timeout < 0) throw new TypeError('Expected the "timeout" option to be a positive integer');
      if (timeout > 0x7fffffff) throw new RangeError('Option "timeout" cannot be greater than 2147483647');
      if (verbose != null && typeof verbose !== 'function') throw new TypeError('Expected the "verbose" option to be a function');
      if (!allowNativeBinding && 'nativeBinding' in options) throw new TypeError('The "nativeBinding" option is only supported by the default better-sqlite3 entrypoint');
      if (allowNativeBinding && nativeBinding != null && typeof nativeBinding !== 'string' && typeof nativeBinding !== 'object') throw new TypeError('Expected the "nativeBinding" option to be a string or addon object');

      // Load the native addon
      const addon = getAddon(nativeBinding);
      if (!addon.isInitialized) {
        addon.initialize(SqliteError, arrayFactory, arrayAppender, rowFactory, recordFactory);
        addon.isInitialized = true;
      }

      // Make sure the specified directory exists
      if (!anonymous && !filename.startsWith('file:') && !fs.existsSync(path$1.dirname(filename))) {
        throw new TypeError('Cannot open database because the directory does not exist');
      }
      Object.defineProperties(this, {
        [util.cppdb]: {
          value: new addon.Database(filename, filenameGiven, anonymous, readonly, fileMustExist, timeout, verbose || null, buffer || null)
        },
        ...wrappers.getters
      });
    }
    const wrappers = requireWrappers();
    Database.prototype.prepare = wrappers.prepare;
    Database.prototype.transaction = requireTransaction();
    Database.prototype.pragma = requirePragma();
    Database.prototype.explain = requireExplain();
    Database.prototype.backup = requireBackup();
    Database.prototype.serialize = requireSerialize();
    Database.prototype.function = require_function();
    Database.prototype.aggregate = requireAggregate();
    Database.prototype.table = requireTable();
    Database.prototype.loadExtension = wrappers.loadExtension;
    Database.prototype.exec = wrappers.exec;
    Database.prototype.close = wrappers.close;
    Database.prototype.defaultSafeIntegers = wrappers.defaultSafeIntegers;
    Database.prototype.unsafeMode = wrappers.unsafeMode;
    Database.prototype[util.inspect] = requireInspect();
    return Database;
  };
  function arrayFactory(...values) {
    return values;
  }
  function arrayAppender(array, ...values) {
    const offset = array.length;
    for (let i = 0; i < values.length; ++i) {
      array[offset + i] = values[i];
    }
  }
  function rowFactory(...keys) {
    if (!keys.includes('__proto__')) {
      const parameters = keys.map((_, index) => `v${index}`).join(',');
      const properties = keys.map((key, index) => `${JSON.stringify(key)}:v${index}`).join(',');
      return Function(`return (${parameters}) => ({${properties}})`)();
    }
    return (...values) => {
      const row = {};
      for (let i = 0; i < keys.length; ++i) row[keys[i]] = values[i];
      return row;
    };
  }
  function recordFactory(value) {
    return {
      value,
      done: false
    };
  }
  return database;
}

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var binding = {exports: {}};

var hasRequiredBinding;
function requireBinding() {
  if (hasRequiredBinding) return binding.exports;
  hasRequiredBinding = 1;
  (function (module, exports) {

    const fs = require$$0;
    const path$1 = path;
    const PREBUILD_PLATFORMS = ['linux', 'darwin', 'win32'];
    const PREBUILD_ARCHS = ['x64', 'arm64'];
    let DEFAULT_ADDON;
    function getBinding(nativeBinding) {
      // If a path was provided, load the binding from the filesystem.
      if (typeof nativeBinding === 'string') {
        // See <https://webpack.js.org/api/module-variables/#__non_webpack_require__-webpack-specific>
        const requireFunc = typeof __non_webpack_require__ === 'function' ? __non_webpack_require__ : commonjsRequire;
        return requireFunc(path$1.resolve(nativeBinding).replace(/(\.node)?$/, '.node'));
      }

      // If an object was provided, use it as the binding directly.
      if (typeof nativeBinding === 'object' && nativeBinding !== null) {
        return nativeBinding;
      }

      // If we're using the default binding and it already exists, just return it.
      if (DEFAULT_ADDON) {
        return DEFAULT_ADDON;
      }

      // Otherwise, try to find the binding as a prebuilt binary.
      let filename = getPrebuildPath();
      if (filename) {
        return DEFAULT_ADDON = commonjsRequire(filename);
      }

      // If no prebuilt binary was found, try the default node-gyp locations.
      filename = path$1.join(__dirname, '..', 'build', 'Debug', 'better_sqlite3.node');
      if (!fs.existsSync(filename)) {
        filename = path$1.join(__dirname, '..', 'build', 'Release', 'better_sqlite3.node');
      }
      return DEFAULT_ADDON = commonjsRequire(filename);
    }
    function getPrebuildPath() {
      if (PREBUILD_PLATFORMS.includes(process.platform) && PREBUILD_ARCHS.includes(process.arch)) {
        const target = `${isLinuxMusl() ? 'linuxmusl' : process.platform}-${process.arch}`;
        const filename = path$1.join(__dirname, '..', 'prebuilds', `${target}.node`);
        if (fs.existsSync(filename)) {
          return filename;
        }
      }
      return null;
    }
    function isLinuxMusl() {
      return process.platform === 'linux' && !process.report.getReport().header.glibcVersionRuntime;
    }
    exports.getBinding = getBinding;
    exports.getPrebuildPath = getPrebuildPath;

    // This script is executed directly by binding.gyp to detect prebuilt binaries.
    if (require.main === module) {
      process.stdout.write(getPrebuildPath() ? '1' : '0');
    }
  })(binding, binding.exports);
  return binding.exports;
}

var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib.exports;
  hasRequiredLib = 1;
  lib.exports = requireDatabase()(requireBinding().getBinding, true);
  lib.exports.SqliteError = requireSqliteError();
  return lib.exports;
}

var libExports = requireLib();
var Database = /*@__PURE__*/getDefaultExportFromCjs(libExports);

/**
 *
 */
class SQLiteResult {
  /**
   * @param {Error|null|undefined} error
   * @param {number|undefined} [insertId]
   * @param {number} [rowsAffected]
   * @param {object[]} [rows]
   */
  constructor(error, insertId, rowsAffected, rows) {
    this.error = error;
    this.insertId = insertId;
    this.rowsAffected = rowsAffected;
    this.rows = rows;
  }
}
const READ_ONLY_ERROR = new Error('could not prepare statement (23 not authorized)');

/**
 * @typedef {(sql: string, duration: number) => void} SQLProfileCallback
 */

/**
 * @typedef {((sql: string) => void)|undefined} SQLTraceCallback
 */

/**
 * @param {string} name
 * @param {{busyTimeout?: number, trace?: (sql: string) => void, profile?: SQLProfileCallback}} [opts]
 * @returns {void}
 */
function SQLiteDatabase(name, opts = {}) {
  /** @type {import('better-sqlite3').Database} */
  const db = new Database(name);

  /** @type {SQLTraceCallback} */
  // eslint-disable-next-line prefer-destructuring -- TS
  let trace = opts.trace;
  /** @type {SQLProfileCallback|undefined} */
  // eslint-disable-next-line prefer-destructuring -- TS
  let profile = opts.profile;
  if (opts.busyTimeout) {
    db.pragma('busy_timeout = ' + Number(opts.busyTimeout));
  }

  // Kept untyped (rather than the better-sqlite3 `Database` type) since that
  //  type is internal to `@types/better-sqlite3` and can't be named in this
  //  file's emitted declaration.
  this._db = /** @type {any} */{
    _db: db,
    /**
     * Compatibility with node-sqlite3's configure API.
     * @param {'busyTimeout'|'trace'|'profile'} option
     * @param {number|((sql: string, duration?: number) => void)} value
     * @returns {void}
     */
    configure(option, value) {
      if (option === 'busyTimeout') {
        db.pragma('busy_timeout = ' + Number(/** @type {number} */value));
        return;
      }
      if (option === 'trace') {
        trace = /** @type {(sql: string) => void} */value;
        return;
      }
      if (option === 'profile') {
        profile = /** @type {SQLProfileCallback} */value;
      }
    },
    /**
     * Compatibility with callback-oriented close semantics.
     * @param {(err?: Error|null) => void} [cb]
     * @returns {void}
     */
    close(cb) {
      try {
        db.close();
        if (cb) {
          return cb(null);
        }
      } catch (err) {
        if (cb) {
          return cb(/** @type {Error} */err);
        }
      }
      return undefined;
    },
    getTrace() {
      return trace;
    },
    getProfile() {
      return profile;
    }
  };
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {string} sql
 * @param {unknown[]} args
 * @returns {object[]}
 */
function runSelect(db, sql, args) {
  const stmt = db.prepare(sql);
  return stmt.reader ? (/** @type {object[]} */stmt.all(...args)) : [];
}

/**
 * @param {import('better-sqlite3').Database} db
 * @param {string} sql
 * @param {unknown[]} args
 * @returns {import('better-sqlite3').RunResult}
 */
function runNonSelect(db, sql, args) {
  const stmt = db.prepare(sql);
  return stmt.run(...args);
}

/**
 * @param {{sql: string, args: unknown[]}[]} queries
 * @param {boolean} readOnly
 * @param {(err: Error|null, results?: SQLiteResult[]) => void} callback
 * @returns {void}
 */
SQLiteDatabase.prototype.exec = function exec(queries, readOnly, callback) {
  const db = this._db._db;
  const len = queries.length;
  const results = Array.from({
    length: len
  });
  for (let i = 0; i < len; i++) {
    const query = queries[i];
    const {
      sql,
      args
    } = query;
    const isSelect = /^\s*SELECT\b/iu.test(sql);
    if (readOnly && !isSelect) {
      results[i] = new SQLiteResult(READ_ONLY_ERROR);
      continue;
    }
    const trace = this._db.getTrace();
    const profile = this._db.getProfile();
    // eslint-disable-next-line unicorn/prefer-bigint-literals -- `0n` needs ES2020+ target for tsc
    const start = profile ? process.hrtime.bigint() : BigInt(0);
    try {
      if (trace) {
        trace(sql);
      }
      if (isSelect) {
        const rows = runSelect(db, sql, args);
        results[i] = new SQLiteResult(null, undefined, 0, rows);
      } else {
        const executionResult = runNonSelect(db, sql, args);
        const insertId = Number(executionResult.lastInsertRowid);
        results[i] = new SQLiteResult(null, insertId, executionResult.changes, []);
      }
    } catch (err) {
      results[i] = new SQLiteResult(/** @type {Error} */err);
    } finally {
      if (profile) {
        profile(sql, Number(process.hrtime.bigint() - start));
      }
    }
  }
  queueMicrotask(() => {
    callback(null, results);
  });
};

/**
 * @param {string} name
 * @returns {SQLiteDatabase}
 */
function wrappedSQLiteDatabase(name) {
  const db = new SQLiteDatabase(name, {});
  if (CFG.sqlBusyTimeout) {
    db._db.configure('busyTimeout', /** @type {number} */CFG.sqlBusyTimeout); // Default is 1000
  }
  if (CFG.sqlTrace) {
    db._db.configure('trace', CFG.sqlTrace);
  }
  if (CFG.sqlProfile) {
    db._db.configure('profile', CFG.sqlProfile);
  }
  return db;
}
const nodeWebSQL = customOpenDatabase(wrappedSQLiteDatabase, {});

// ID_Start (includes Other_ID_Start)
const UnicodeIDStart = String.raw`(?:[$A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D])`;

// ID_Continue (includes Other_ID_Continue)
const UnicodeIDContinue = String.raw`(?:[$0-9A-Z_a-z\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF])`;

var UnicodeIdentifiers = /*#__PURE__*/Object.freeze({
  __proto__: null,
  UnicodeIDContinue: UnicodeIDContinue,
  UnicodeIDStart: UnicodeIDStart
});

CFG.win = {
  openDatabase: nodeWebSQL
};

/**
 * @param {import('./setGlobalVars.js').ShimmedObject} idb
 * @param {import('./CFG.js').default} initialConfig
 * @returns {import('./setGlobalVars.js').ShimmedObject|Window}
 */
const __setGlobalVars = function (idb, initialConfig = {}) {
  const obj = setGlobalVars(idb, {
    fs: fs$1,
    escapeNULForSQLiteStatements: false,
    ...initialConfig
  });
  /* istanbul ignore next -- TS guard */
  if (!obj.shimIndexedDB) {
    return obj;
  }
  obj.shimIndexedDB.__setUnicodeIdentifiers(UnicodeIdentifiers);
  return obj;
};

module.exports = __setGlobalVars;
//# sourceMappingURL=indexeddbshim-UnicodeIdentifiers-node.cjs.map

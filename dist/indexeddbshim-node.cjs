/*! indexeddbshim - v11.0.0-beta.0 - 4/9/2023 */

'use strict';

var fs$1 = require('node:fs');
var path = require('path');
var customOpenDatabase = require('websql/custom/index.js');

function ownKeys$1(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    enumerableOnly && (symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    })), keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2$1(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = null != arguments[i] ? arguments[i] : {};
    i % 2 ? ownKeys$1(Object(source), !0).forEach(function (key) {
      _defineProperty$1(target, key, source[key]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys$1(Object(source)).forEach(function (key) {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
    });
  }
  return target;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}
function _defineProperty$1(obj, key, value) {
  key = _toPropertyKey$1(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey$1(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}

function _typeof$1(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof$1 = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof$1 = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }
  return _typeof$1(obj);
}

/* eslint-disable no-sync, no-restricted-syntax */
// Todo: Switch to ES6 classes
var phases = {
  NONE: 0,
  CAPTURING_PHASE: 1,
  AT_TARGET: 2,
  BUBBLING_PHASE: 3
};
var ShimDOMException$1 = typeof DOMException === 'undefined' // Todo: Better polyfill (if even needed here)
// eslint-disable-next-line no-shadow
? function DOMException(msg, name) {
  // No need for `toString` as same as for `Error`
  var err = new Error(msg);
  err.name = name;
  return err;
} : DOMException;
var ev = new WeakMap();
var evCfg = new WeakMap(); // Todo: Set _ev argument outside of this function

/* eslint-disable func-name-matching, no-shadow */

/**
* We use an adapter class rather than a proxy not only for compatibility
* but also since we have to clone native event properties anyways in order
* to properly set `target`, etc.
* The regular DOM method `dispatchEvent` won't work with this polyfill as
* it expects a native event.
* @class
* @param {string} type
*/

var ShimEvent = function Event(type) {
  /* eslint-enable func-name-matching, no-shadow */
  // For WebIDL checks of function's `length`, we check `arguments` for the optional arguments
  this[Symbol.toStringTag] = 'Event';
  this.toString = function () {
    return '[object Event]';
  }; // eslint-disable-next-line prefer-rest-params

  var _arguments = Array.prototype.slice.call(arguments),
    evInit = _arguments[1],
    _ev = _arguments[2];
  if (!arguments.length) {
    throw new TypeError("Failed to construct 'Event': 1 argument required, but only 0 present.");
  }
  evInit = evInit || {};
  _ev = _ev || {};
  var _evCfg = {};
  if ('composed' in evInit) {
    _evCfg.composed = evInit.composed;
  } // _evCfg.isTrusted = true; // We are not always using this for user-created events
  // _evCfg.timeStamp = new Date().valueOf(); // This is no longer a timestamp, but monotonic (elapsed?)

  ev.set(this, _ev);
  evCfg.set(this, _evCfg);
  this.initEvent(type, evInit.bubbles, evInit.cancelable);
  Object.defineProperties(this, ['target', 'currentTarget', 'eventPhase', 'defaultPrevented'].reduce(function (obj, prop) {
    obj[prop] = {
      get: function get() {
        return (/* prop in _evCfg && */
          _evCfg[prop] !== undefined ? _evCfg[prop] : prop in _ev ? _ev[prop] :
          // Defaults
          prop === 'eventPhase' ? 0 : prop === 'defaultPrevented' ? false : null
        );
      }
    };
    return obj;
  }, {}));
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
  Object.defineProperties(this, props.reduce(function (obj, prop) {
    obj[prop] = {
      get: function get() {
        return prop in _evCfg ? _evCfg[prop] : prop in _ev ? _ev[prop] : ['bubbles', 'cancelable', 'composed'].includes(prop) ? false : undefined;
      }
    };
    return obj;
  }, {}));
};
ShimEvent.prototype.preventDefault = function () {
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
ShimEvent.prototype.stopImmediatePropagation = function () {
  var _evCfg = evCfg.get(this);
  _evCfg._stopImmediatePropagation = true;
};
ShimEvent.prototype.stopPropagation = function () {
  var _evCfg = evCfg.get(this);
  _evCfg._stopPropagation = true;
};
ShimEvent.prototype.initEvent = function (type, bubbles, cancelable) {
  // Chrome currently has function length 1 only but WebIDL says 3
  // const bubbles = arguments[1];
  // const cancelable = arguments[2];
  var _evCfg = evCfg.get(this);
  if (_evCfg._dispatched) {
    return;
  }
  _evCfg.type = type;
  if (bubbles !== undefined) {
    _evCfg.bubbles = bubbles;
  }
  if (cancelable !== undefined) {
    _evCfg.cancelable = cancelable;
  }
};
['type', 'target', 'currentTarget'].forEach(function (prop) {
  Object.defineProperty(ShimEvent.prototype, prop, {
    enumerable: true,
    configurable: true,
    get: function get() {
      throw new TypeError('Illegal invocation');
    }
  });
});
['eventPhase', 'defaultPrevented', 'bubbles', 'cancelable', 'timeStamp'].forEach(function (prop) {
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
  Object.defineProperty(ShimEvent.prototype, prop, {
    writable: false,
    value: i
  });
});
ShimEvent[Symbol.toStringTag] = 'Function';
ShimEvent.prototype[Symbol.toStringTag] = 'EventPrototype';
Object.defineProperty(ShimEvent, 'prototype', {
  writable: false
});
/* eslint-disable func-name-matching, no-shadow */

/**
 *
 * @param {string} type
 * @class
 */

var ShimCustomEvent = function CustomEvent(type) {
  /* eslint-enable func-name-matching, no-shadow */
  // eslint-disable-next-line prefer-rest-params
  var _arguments2 = Array.prototype.slice.call(arguments),
    evInit = _arguments2[1],
    _ev = _arguments2[2];
  ShimEvent.call(this, type, evInit, _ev);
  this[Symbol.toStringTag] = 'CustomEvent';
  this.toString = function () {
    return '[object CustomEvent]';
  }; // var _evCfg = evCfg.get(this);

  evInit = evInit || {};
  this.initCustomEvent(type, evInit.bubbles, evInit.cancelable, 'detail' in evInit ? evInit.detail : null);
};
Object.defineProperty(ShimCustomEvent.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: ShimCustomEvent
});
ShimCustomEvent.prototype.initCustomEvent = function (type, bubbles, cancelable, detail) {
  if (!(this instanceof ShimCustomEvent)) {
    throw new TypeError('Illegal invocation');
  }
  var _evCfg = evCfg.get(this);
  ShimCustomEvent.call(this, type, {
    bubbles: bubbles,
    cancelable: cancelable,
    detail: detail // eslint-disable-next-line prefer-rest-params
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
ShimCustomEvent[Symbol.toStringTag] = 'Function';
ShimCustomEvent.prototype[Symbol.toStringTag] = 'CustomEventPrototype';
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
 * @param {Event} e
 * @returns {ShimEvent}
 */

function copyEvent(e) {
  var bubbles = e.bubbles,
    cancelable = e.cancelable,
    detail = e.detail,
    type = e.type;
  if ('detail' in e) {
    return new ShimCustomEvent(type, {
      bubbles: bubbles,
      cancelable: cancelable,
      detail: detail
    }, e);
  }
  return new ShimEvent(type, {
    bubbles: bubbles,
    cancelable: cancelable
  }, e);
}
/**
* @typedef {PlainObject} ListenerOptions
* @property {boolean} once Remove listener after invoking once
* @property {boolean} passive Don't allow `preventDefault`
* @property {boolean} capture Use `_children` and set `eventPhase`
*/

/**
* @typedef {PlainObject} ListenerAndOptions
* @property {listener} listener
* @property {ListenerOptions} options
*/

/**
* @typedef {PlainObject} ListenerInfo
* @property {ListenerAndOptions[]} listenersByTypeOptions
* @property {ListenerOptions} options
* @property {ListenerAndOptions[]} listenersByType
*/

/**
* @callback Listener
* @param {Event} e
* @returns {boolean}
*/

/**
 * Keys are event types.
 * @typedef {Object<string,Listener[]>} Listeners
*/

/**
 *
 * @param {Listeners} listeners
 * @param {string} type
 * @param {boolean|ListenerOptions} options
 * @returns {ListenerInfo}
 */

function getListenersOptions(listeners, type, options) {
  var listenersByType = listeners[type];
  if (listenersByType === undefined) listeners[type] = listenersByType = [];
  options = typeof options === 'boolean' ? {
    capture: options
  } : options || {};
  var stringifiedOptions = JSON.stringify(options);
  var listenersByTypeOptions = listenersByType.filter(function (obj) {
    return stringifiedOptions === JSON.stringify(obj.options);
  });
  return {
    listenersByTypeOptions: listenersByTypeOptions,
    options: options,
    listenersByType: listenersByType
  };
}
var methods = {
  addListener: function addListener(listeners, listener, type, options) {
    var listenerOptions = getListenersOptions(listeners, type, options);
    var listenersByTypeOptions = listenerOptions.listenersByTypeOptions;
    options = listenerOptions.options;
    var listenersByType = listenerOptions.listenersByType;
    if (listenersByTypeOptions.some(function (l) {
      return l.listener === listener;
    })) return;
    listenersByType.push({
      listener: listener,
      options: options
    });
  },
  removeListener: function removeListener(listeners, listener, type, options) {
    var listenerOptions = getListenersOptions(listeners, type, options);
    var listenersByType = listenerOptions.listenersByType;
    var stringifiedOptions = JSON.stringify(listenerOptions.options);
    listenersByType.some(function (l, i) {
      if (l.listener === listener && stringifiedOptions === JSON.stringify(l.options)) {
        listenersByType.splice(i, 1);
        if (!listenersByType.length) delete listeners[type];
        return true;
      }
      return false;
    });
  },
  hasListener: function hasListener(listeners, listener, type, options) {
    var listenerOptions = getListenersOptions(listeners, type, options);
    var listenersByTypeOptions = listenerOptions.listenersByTypeOptions;
    return listenersByTypeOptions.some(function (l) {
      return l.listener === listener;
    });
  }
};
/* eslint-disable no-shadow */

/**
 * @class
 */

function EventTarget() {
  /* eslint-enable no-shadow */
  throw new TypeError('Illegal constructor');
}
Object.assign(EventTarget.prototype, ['Early', '', 'Late', 'Default'].reduce(function (obj, listenerType) {
  ['add', 'remove', 'has'].forEach(function (method) {
    obj[method + listenerType + 'EventListener'] = function (type, listener) {
      // eslint-disable-next-line prefer-rest-params
      var options = arguments[2]; // We keep the listener `length` as per WebIDL

      if (arguments.length < 2) throw new TypeError('2 or more arguments required');
      if (typeof type !== 'string') {
        throw new ShimDOMException$1('UNSPECIFIED_EVENT_TYPE_ERR', 'UNSPECIFIED_EVENT_TYPE_ERR');
      }
      try {
        // As per code such as the following, handleEvent may throw,
        //  but is uncaught
        // https://github.com/web-platform-tests/wpt/blob/master/IndexedDB/fire-error-event-exception.html#L54-L56
        if (listener.handleEvent && listener.handleEvent.bind) {
          listener = listener.handleEvent.bind(listener);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Uncaught `handleEvent` error', err);
      }
      var arrStr = '_' + listenerType.toLowerCase() + (listenerType === '' ? 'l' : 'L') + 'isteners';
      if (!this[arrStr]) {
        Object.defineProperty(this, arrStr, {
          value: {}
        });
      }
      return methods[method + 'Listener'](this[arrStr], listener, type, options);
    };
  });
  return obj;
}, {}));
Object.assign(EventTarget.prototype, {
  __setOptions: function __setOptions(customOptions) {
    customOptions = customOptions || {}; // Todo: Make into event properties?

    this._defaultSync = customOptions.defaultSync;
    this._extraProperties = customOptions.extraProperties || [];
    if (customOptions.legacyOutputDidListenersThrowFlag) {
      // IndexedDB
      this._legacyOutputDidListenersThrowCheck = true;
      this._extraProperties.push('__legacyOutputDidListenersThrowError');
    }
  },
  dispatchEvent: function dispatchEvent(e) {
    return this._dispatchEvent(e, true);
  },
  _dispatchEvent: function _dispatchEvent(e, setTarget) {
    var _this = this;
    ['early', '', 'late', 'default'].forEach(function (listenerType) {
      var arrStr = '_' + listenerType + (listenerType === '' ? 'l' : 'L') + 'isteners';
      if (!_this[arrStr]) {
        Object.defineProperty(_this, arrStr, {
          value: {}
        });
      }
    });
    var _evCfg = evCfg.get(e);
    if (_evCfg && setTarget && _evCfg._dispatched) {
      throw new ShimDOMException$1('The object is in an invalid state.', 'InvalidStateError');
    }
    var eventCopy;
    if (_evCfg) {
      eventCopy = e;
    } else {
      eventCopy = copyEvent(e);
      _evCfg = evCfg.get(eventCopy);
      _evCfg._dispatched = true;
      this._extraProperties.forEach(function (prop) {
        if (prop in e) {
          eventCopy[prop] = e[prop]; // Todo: Put internal to `ShimEvent`?
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
      _evCfg._stopPropagation = undefined; // We check here for whether we should invoke since may have changed since timeout (if late listener prevented default)

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
      if (!_this._defaultSync) {
        setTimeout(invokeDefaults, 0);
      } else invokeDefaults();
      _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke late listeners
      // Sync default might have stopped

      if (!_evCfg._stopPropagation) {
        _evCfg._stopImmediatePropagation = undefined;
        _evCfg._stopPropagation = undefined; // We could allow stopPropagation by only executing upon (_evCfg._stopPropagation)

        eventCopy.target.invokeCurrentListeners(eventCopy.target._lateListeners, eventCopy, type);
      }
      finishEventDispatch();
      return !eventCopy.defaultPrevented;
    };
    if (setTarget) _evCfg.target = this;
    switch (eventCopy.eventPhase) {
      default:
      case phases.NONE:
        {
          _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke early listeners

          this.invokeCurrentListeners(this._earlyListeners, eventCopy, type);
          if (!this.__getParent) {
            _evCfg.eventPhase = phases.AT_TARGET;
            return this._dispatchEvent(eventCopy, false);
          }
          /* eslint-disable consistent-this */

          var par = this;
          var root = this;
          /* eslint-enable consistent-this */

          while (par.__getParent && (par = par.__getParent()) !== null) {
            if (!_evCfg._children) {
              _evCfg._children = [];
            }
            _evCfg._children.push(root);
            root = par;
          }
          root._defaultSync = this._defaultSync;
          _evCfg.eventPhase = phases.CAPTURING_PHASE;
          return root._dispatchEvent(eventCopy, false);
        }
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
    }
  },
  invokeCurrentListeners: function invokeCurrentListeners(listeners, eventCopy, type, checkOnListeners) {
    var _this2 = this;
    var _evCfg = evCfg.get(eventCopy);
    _evCfg.currentTarget = this;
    var listOpts = getListenersOptions(listeners, type, {});
    var listenersByType = listOpts.listenersByType.concat();
    var dummyIPos = listenersByType.length ? 1 : 0;
    listenersByType.some(function (listenerObj, i) {
      var onListener = checkOnListeners ? _this2['on' + type] : null;
      if (_evCfg._stopImmediatePropagation) return true;
      if (i === dummyIPos && typeof onListener === 'function') {
        // We don't splice this in as could be overwritten; executes here per
        //    https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes:event-handlers-14
        _this2.tryCatch(eventCopy, function () {
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
        _this2.tryCatch(eventCopy, function () {
          listener.call(eventCopy.currentTarget, eventCopy);
        });
        if (once) {
          _this2.removeEventListener(type, listener, options);
        }
      }
      return false;
    });
    this.tryCatch(eventCopy, function () {
      var onListener = checkOnListeners ? _this2['on' + type] : null;
      if (typeof onListener === 'function' && listenersByType.length < 2) {
        var ret = onListener.call(eventCopy.currentTarget, eventCopy); // Won't have executed if too short

        if (ret === false) {
          eventCopy.preventDefault();
        }
      }
    });
    return !eventCopy.defaultPrevented;
  },
  // eslint-disable-next-line promise/prefer-await-to-callbacks
  tryCatch: function tryCatch(evt, cb) {
    try {
      // Per MDN: Exceptions thrown by event handlers are reported
      //    as uncaught exceptions; the event handlers run on a nested
      //    callstack: they block the caller until they complete, but
      //    exceptions do not propagate to the caller.
      // eslint-disable-next-line promise/prefer-await-to-callbacks, callback-return
      cb();
    } catch (err) {
      this.triggerErrorEvent(err, evt);
    }
  },
  triggerErrorEvent: function triggerErrorEvent(err, evt) {
    var error = err;
    if (typeof err === 'string') {
      error = new Error('Uncaught exception: ' + err);
    }
    var triggerGlobalErrorEvent;
    var useNodeImpl = false;
    if (typeof window === 'undefined' || typeof ErrorEvent === 'undefined' || window && (typeof window === "undefined" ? "undefined" : _typeof$1(window)) === 'object' && !window.dispatchEvent) {
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
          message: error.message || '',
          // We can't get the actually useful user's values!
          filename: error.fileName || '',
          lineno: error.lineNumber || 0,
          colno: error.columnNumber || 0
        });
        window.dispatchEvent(errEv); // console.log(err); // Should we auto-log for user?
      };
    } // Todo: This really should always run here but as we can't set the global
    //     `window` (e.g., using jsdom) since `setGlobalVars` becomes unable to
    //     shim `indexedDB` in such a case currently (apparently due to
    //     <https://github.com/axemclion/IndexedDBShim/issues/280>), we can't
    //     avoid the above Node implementation (which, while providing some
    //     fallback mechanism, is unstable)

    if (!useNodeImpl || !this._legacyOutputDidListenersThrowCheck) triggerGlobalErrorEvent(); // See https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke and
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
  createInstance: function createInstance(customOptions) {
    /* eslint-disable no-shadow */

    /**
     * @class
     */
    function EventTarget() {
      /* eslint-enable no-shadow */
      this.__setOptions(customOptions);
    }
    EventTarget.prototype = ShimEventTarget.prototype;
    return new EventTarget();
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
  Object.setPrototypeOf(ShimCustomEvent, ShimEvent);
  Object.setPrototypeOf(ShimCustomEvent.prototype, ShimEvent.prototype);
} // Todo: Move to own library (but allowing WeakMaps to be passed in for sharing here)

const map = {};
const CFG = {};
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
//    http://stackoverflow.com/questions/41927589/rationales-consequences-of-webidl-class-inheritance-requirements
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
['memoryDatabase', val => {
  if (!/^(?::memory:|file::memory:(\?[^#]*)?(#.*)?)?$/u.test(val)) {
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
'sqlProfile' // Callback not used by default
].forEach(prop => {
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

var regex = /[\xC0-\xC5\xC7-\xCF\xD1-\xD6\xD9-\xDD\xE0-\xE5\xE7-\xEF\xF1-\xF6\xF9-\xFD\xFF-\u010F\u0112-\u0125\u0128-\u0130\u0134-\u0137\u0139-\u013E\u0143-\u0148\u014C-\u0151\u0154-\u0165\u0168-\u017E\u01A0\u01A1\u01AF\u01B0\u01CD-\u01DC\u01DE-\u01E3\u01E6-\u01F0\u01F4\u01F5\u01F8-\u021B\u021E\u021F\u0226-\u0233\u0344\u0385\u0386\u0388-\u038A\u038C\u038E-\u0390\u03AA-\u03B0\u03CA-\u03CE\u03D3\u03D4\u0400\u0401\u0403\u0407\u040C-\u040E\u0419\u0439\u0450\u0451\u0453\u0457\u045C-\u045E\u0476\u0477\u04C1\u04C2\u04D0-\u04D3\u04D6\u04D7\u04DA-\u04DF\u04E2-\u04E7\u04EA-\u04F5\u04F8\u04F9\u0622-\u0626\u06C0\u06C2\u06D3\u0929\u0931\u0934\u0958-\u095F\u09CB\u09CC\u09DC\u09DD\u09DF\u0A33\u0A36\u0A59-\u0A5B\u0A5E\u0B48\u0B4B\u0B4C\u0B5C\u0B5D\u0B94\u0BCA-\u0BCC\u0C48\u0CC0\u0CC7\u0CC8\u0CCA\u0CCB\u0D4A-\u0D4C\u0DDA\u0DDC-\u0DDE\u0F43\u0F4D\u0F52\u0F57\u0F5C\u0F69\u0F73\u0F75\u0F76\u0F78\u0F81\u0F93\u0F9D\u0FA2\u0FA7\u0FAC\u0FB9\u1026\u1B06\u1B08\u1B0A\u1B0C\u1B0E\u1B12\u1B3B\u1B3D\u1B40\u1B41\u1B43\u1E00-\u1E99\u1E9B\u1EA0-\u1EF9\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FC1-\u1FC4\u1FC6-\u1FD3\u1FD6-\u1FDB\u1FDD-\u1FEE\u1FF2-\u1FF4\u1FF6-\u1FFC\u212B\u219A\u219B\u21AE\u21CD-\u21CF\u2204\u2209\u220C\u2224\u2226\u2241\u2244\u2247\u2249\u2260\u2262\u226D-\u2271\u2274\u2275\u2278\u2279\u2280\u2281\u2284\u2285\u2288\u2289\u22AC-\u22AF\u22E0-\u22E3\u22EA-\u22ED\u2ADC\u304C\u304E\u3050\u3052\u3054\u3056\u3058\u305A\u305C\u305E\u3060\u3062\u3065\u3067\u3069\u3070\u3071\u3073\u3074\u3076\u3077\u3079\u307A\u307C\u307D\u3094\u309E\u30AC\u30AE\u30B0\u30B2\u30B4\u30B6\u30B8\u30BA\u30BC\u30BE\u30C0\u30C2\u30C5\u30C7\u30C9\u30D0\u30D1\u30D3\u30D4\u30D6\u30D7\u30D9\u30DA\u30DC\u30DD\u30F4\u30F7-\u30FA\u30FE\uAC00-\uD7A3\uFB1D\uFB1F\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFB4E]|\uD804[\uDC9A\uDC9C\uDCAB\uDD2E\uDD2F\uDF4B\uDF4C]|\uD805[\uDCBB\uDCBC\uDCBE\uDDBA\uDDBB]|\uD806\uDD38|\uD834[\uDD5E-\uDD64\uDDBB-\uDDC0]/;

function escapeUnmatchedSurrogates(arg) {
  // http://stackoverflow.com/a/6701665/271577
  return arg.replace(/([\uD800-\uDBFF])(?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])([\uDC00-\uDFFF])/gu, function (_, unmatchedHighSurrogate, precedingLow, unmatchedLowSurrogate) {
    // Could add a corresponding surrogate for compatibility with `node-sqlite3`: http://bugs.python.org/issue12569 and http://stackoverflow.com/a/6701665/271577
    //   but Chrome having problems
    if (unmatchedHighSurrogate) {
      return '^2' + unmatchedHighSurrogate.codePointAt().toString(16).padStart(4, '0');
    }
    return (precedingLow || '') + '^3' + unmatchedLowSurrogate.codePointAt().toString(16).padStart(4, '0');
  });
}
function escapeNameForSQLiteIdentifier(arg) {
  // http://stackoverflow.com/a/6701665/271577
  return '_' +
  // Prevent empty string
  escapeUnmatchedSurrogates(arg.replace(/\^/gu, '^^') // Escape our escape
  // http://www.sqlite.org/src/tktview?name=57c971fc74
  .replace(/\0/gu, '^0')
  // We need to avoid identifiers being treated as duplicates based on SQLite's ASCII-only case-insensitive table and column names
  // (For SQL in general, however, see http://stackoverflow.com/a/17215009/271577
  // See also https://www.sqlite.org/faq.html#q18 re: Unicode (non-ASCII) case-insensitive not working
  .replace(/([A-Z])/gu, '^$1'));
}

// The escaping of unmatched surrogates was needed by Chrome but not Node
function escapeSQLiteStatement(arg) {
  return escapeUnmatchedSurrogates(arg.replace(/\^/gu, '^^').replace(/\0/gu, '^0'));
}
function unescapeSQLiteResponse(arg) {
  return unescapeUnmatchedSurrogates(arg).replace(/(\^+)0/gu, (_, esc) => {
    return esc.length % 2 ? esc.slice(1) + '\0' : _;
  }).replace(/\^\^/gu, '^');
}
function sqlEscape(arg) {
  // https://www.sqlite.org/lang_keywords.html
  // http://stackoverflow.com/a/6701665/271577
  // There is no need to escape ', `, or [], as
  //   we should always be within double quotes
  // NUL should have already been stripped
  return arg.replace(/"/gu, '""');
}
function sqlQuote(arg) {
  return '"' + sqlEscape(arg) + '"';
}
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
    db = db.replace(new RegExp(regex, 'gu'), function (expandable) {
      return '^4' + expandable.codePointAt().toString(16).padStart(6, '0');
    });
  }
  if (CFG.databaseCharacterEscapeList !== false) {
    db = db.replace(CFG.databaseCharacterEscapeList ? new RegExp(CFG.databaseCharacterEscapeList, 'gu') : /[\u0000-\u001F\u007F"*/:<>?\\|]/gu,
    // eslint-disable-line no-control-regex
    function (n0) {
      // eslint-disable-next-line unicorn/prefer-code-point -- Switch to `codePointAt`?
      return '^1' + n0.charCodeAt().toString(16).padStart(2, '0');
    });
  }
  if (CFG.databaseNameLengthLimit !== false && db.length >= (CFG.databaseNameLengthLimit || 254) - (CFG.addSQLiteExtension !== false ? 7 /* '.sqlite'.length */ : 0)) {
    throw new Error('Unexpectedly long database name supplied; length limit required for Node compatibility; passed length: ' + db.length + '; length limit setting: ' + (CFG.databaseNameLengthLimit || 254) + '.');
  }
  return db + (CFG.addSQLiteExtension !== false ? '.sqlite' : ''); // Shouldn't have quoting (do we even need NUL/case escaping here?)
}

function unescapeUnmatchedSurrogates(arg) {
  return arg.replace(/(\^+)3(d[0-9a-f]{3})/gu, (_, esc, lowSurr) => {
    return esc.length % 2 ? esc.slice(1) + String.fromCodePoint(Number.parseInt(lowSurr, 16)) : _;
  }).replace(/(\^+)2(d[0-9a-f]{3})/gu, (_, esc, highSurr) => {
    return esc.length % 2 ? esc.slice(1) + String.fromCodePoint(Number.parseInt(highSurr, 16)) : _;
  });
}
function escapeStoreNameForSQL(store) {
  return sqlQuote('S' + escapeNameForSQLiteIdentifier(store));
}
function escapeIndexNameForSQL(index) {
  return sqlQuote('I' + escapeNameForSQLiteIdentifier(index));
}
function escapeIndexNameForSQLKeyColumn(index) {
  return 'I' + escapeNameForSQLiteIdentifier(index);
}
function sqlLIKEEscape(str) {
  // https://www.sqlite.org/lang_expr.html#like
  return sqlEscape(str).replace(/\^/gu, '^^');
}

// Babel doesn't seem to provide a means of using the `instanceof` operator with Symbol.hasInstance (yet?)
function instanceOf(obj, Clss) {
  return Clss[Symbol.hasInstance](obj);
}
function isObj(obj) {
  return obj && typeof obj === 'object';
}
function isDate(obj) {
  return isObj(obj) && typeof obj.getDate === 'function';
}
function isBlob(obj) {
  return isObj(obj) && typeof obj.size === 'number' && typeof obj.slice === 'function' && !('lastModified' in obj);
}
function isFile(obj) {
  return isObj(obj) && typeof obj.name === 'string' && typeof obj.slice === 'function' && 'lastModified' in obj;
}
function isBinary(obj) {
  return isObj(obj) && typeof obj.byteLength === 'number' && (typeof obj.slice === 'function' ||
  // `TypedArray` (view on buffer) or `ArrayBuffer`
  typeof obj.getFloat64 === 'function' // `DataView` (view on buffer)
  );
}

function isIterable(obj) {
  return isObj(obj) && typeof obj[Symbol.iterator] === 'function';
}
function defineOuterInterface(obj, props) {
  props.forEach(prop => {
    const o = {
      get [prop]() {
        throw new TypeError('Illegal invocation');
      },
      set [prop](val) {
        throw new TypeError('Illegal invocation');
      }
    };
    const desc = Object.getOwnPropertyDescriptor(o, prop);
    Object.defineProperty(obj, prop, desc);
  });
}
function defineReadonlyOuterInterface(obj, props) {
  props.forEach(prop => {
    const o = {
      get [prop]() {
        throw new TypeError('Illegal invocation');
      }
    };
    const desc = Object.getOwnPropertyDescriptor(o, prop);
    Object.defineProperty(obj, prop, desc);
  });
}
function defineListenerProperties(obj, listeners) {
  listeners = typeof listeners === 'string' ? [listeners] : listeners;
  listeners.forEach(listener => {
    const o = {
      get [listener]() {
        return obj['__' + listener];
      },
      set [listener](val) {
        obj['__' + listener] = val;
      }
    };
    const desc = Object.getOwnPropertyDescriptor(o, listener);
    // desc.enumerable = true; // Default
    // desc.configurable = true; // Default // Needed by support.js in W3C IndexedDB tests (for openListeners)
    Object.defineProperty(obj, listener, desc);
  });
  listeners.forEach(l => {
    obj[l] = null;
  });
}
function defineReadonlyProperties(obj, props, getter = null) {
  props = typeof props === 'string' ? [props] : props;
  props.forEach(function (prop) {
    let o;
    if (getter && prop in getter) {
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
    const desc = Object.getOwnPropertyDescriptor(o, prop);
    // desc.enumerable = true; // Default
    // desc.configurable = true; // Default
    Object.defineProperty(obj, prop, desc);
  });
}
function isIdentifier(item) {
  // For load-time and run-time performance, we don't provide the complete regular
  //   expression for identifiers, but these can be passed in, using the expressions
  //   found at https://gist.github.com/brettz9/b4cd6821d990daa023b2e604de371407
  // ID_Start (includes Other_ID_Start)
  const UnicodeIDStart = CFG.UnicodeIDStart || '[$A-Z_a-z]';
  // ID_Continue (includes Other_ID_Continue)
  const UnicodeIDContinue = CFG.UnicodeIDContinue || '[$0-9A-Z_a-z]';
  const IdentifierStart = '(?:' + UnicodeIDStart + '|[$_])';
  const IdentifierPart = '(?:' + UnicodeIDContinue + '|[$_\u200C\u200D])';
  return new RegExp('^' + IdentifierStart + IdentifierPart + '*$', 'u').test(item);
}
function isValidKeyPathString(keyPathString) {
  return typeof keyPathString === 'string' && (keyPathString === '' || isIdentifier(keyPathString) || keyPathString.split('.').every(pathComponent => {
    return isIdentifier(pathComponent);
  }));
}
function isValidKeyPath(keyPath) {
  return isValidKeyPathString(keyPath) || Array.isArray(keyPath) && keyPath.length &&
  // Convert array from sparse to dense http://www.2ality.com/2012/06/dense-arrays.html
  // See also https://heycam.github.io/webidl/#idl-DOMString
  [...keyPath].every(pathComponent => {
    return isValidKeyPathString(pathComponent);
  });
}
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
function convertToDOMString(v, treatNullAs) {
  return v === null && treatNullAs ? '' : ToString(v);
}
function ToString(o) {
  // Todo: See `es-abstract/es7`
  // `String()` will not throw with Symbols
  return '' + o; // eslint-disable-line no-implicit-coercion
}

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
function isNullish(v) {
  return v === null || v === undefined;
}
function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/**
 *
 * @param {string} type
 * @param {Any} debug
 * @param {EventInit} evInit
 * @returns {Event}
 */
function createEvent(type, debug, evInit) {
  const ev = new ShimEvent(type, evInit);
  ev.debug = debug;
  return ev;
}

// We don't add within polyfill repo as might not always be the desired implementation
Object.defineProperty(ShimEvent, Symbol.hasInstance, {
  value: obj => isObj(obj) && 'target' in obj && typeof obj.bubbles === 'boolean'
});

const readonlyProperties$6 = ['oldVersion', 'newVersion'];

// Babel apparently having a problem adding `hasInstance` to a class, so we are redefining as a function
function IDBVersionChangeEvent(type /* , eventInitDict */) {
  // eventInitDict is a IDBVersionChangeEventInit (but is not defined as a global)
  ShimEvent.call(this, type);
  this[Symbol.toStringTag] = 'IDBVersionChangeEvent';
  this.toString = function () {
    return '[object IDBVersionChangeEvent]';
  };
  // eslint-disable-next-line prefer-rest-params
  this.__eventInitDict = arguments[1] || {};
}
IDBVersionChangeEvent.prototype = Object.create(ShimEvent.prototype);
IDBVersionChangeEvent.prototype[Symbol.toStringTag] = 'IDBVersionChangeEventPrototype';
readonlyProperties$6.forEach(prop => {
  // Ensure for proper interface testing that "get <name>" is the function name
  const o = {
    get [prop]() {
      if (!(this instanceof IDBVersionChangeEvent)) {
        throw new TypeError('Illegal invocation');
      }
      return this.__eventInitDict && this.__eventInitDict[prop] || (prop === 'oldVersion' ? 0 : null);
    }
  };
  const desc = Object.getOwnPropertyDescriptor(o, prop);
  // desc.enumerable = true; // Default
  // desc.configurable = true; // Default
  Object.defineProperty(IDBVersionChangeEvent.prototype, prop, desc);
});
Object.defineProperty(IDBVersionChangeEvent, Symbol.hasInstance, {
  value: obj => isObj(obj) && 'oldVersion' in obj && typeof obj.defaultPrevented === 'boolean'
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

/* globals DOMException */

/**
 * Creates a native DOMException, for browsers that support it.
 * @param {string} name
 * @param {string} message
 * @returns {DOMException}
 */
function createNativeDOMException(name, message) {
  return new DOMException.prototype.constructor(message, name || 'DOMException');
}

// From web-platform-tests testharness.js name_code_map (though not in new spec)
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
 * @returns {DOMException}
 */
function createNonNativeDOMExceptionClass() {
  function DOMException(message, name) {
    // const err = Error.prototype.constructor.call(this, message); // Any use to this? Won't set this.message
    this[Symbol.toStringTag] = 'DOMException';
    this._code = name in codes ? codes[name] : legacyCodes[name] || 0;
    this._name = name || 'Error';
    // We avoid `String()` in this next line as it converts Symbols
    this._message = message === undefined ? '' : '' + message; // eslint-disable-line no-implicit-coercion
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
  // eslint-disable-next-line func-name-matching
  const DummyDOMException = function DOMException() {/* */};
  DummyDOMException.prototype = Object.create(Error.prototype); // Intended for subclassing
  ['name', 'message'].forEach(prop => {
    Object.defineProperty(DummyDOMException.prototype, prop, {
      enumerable: true,
      get() {
        if (!(this instanceof DOMException || this instanceof DummyDOMException || this instanceof Error)) {
          throw new TypeError('Illegal invocation');
        }
        return this['_' + prop];
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
  DOMException.prototype = new DummyDOMException();
  DOMException.prototype[Symbol.toStringTag] = 'DOMExceptionPrototype';
  Object.defineProperty(DOMException, 'prototype', {
    writable: false
  });
  Object.keys(codes).forEach(codeName => {
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
 * Logs detailed error information to the console.
 * @param {string} name
 * @param {string} message
 * @param {string|Error|null} error
 * @returns {void}
 */
function logError(name, message, error) {
  if (CFG.DEBUG) {
    if (error && error.message) {
      error = error.message;
    }
    const method = typeof console.error === 'function' ? 'error' : 'log';
    console[method](name + ': ' + message + '. ' + (error || ''));
    console.trace && console.trace();
  }
}
function isErrorOrDOMErrorOrDOMException(obj) {
  return obj && typeof obj === 'object' &&
  // We don't use util.isObj here as mutual dependency causing problems in Babel with browser
  typeof obj.name === 'string';
}

/**
 * Finds the error argument.  This is useful because some WebSQL callbacks
 * pass the error as the first argument, and some pass it as the second
 * argument.
 * @param {Array} args
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
 * @param {external:WebSQLError} webSQLErr
 * @returns {DOMException}
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
  const err = createDOMException(name, message);
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
} catch (e) {}
const createDOMException = useNativeDOMException ? function (name, message, error) {
  logError(name, message, error);
  return createNativeDOMException(name, message);
} : function (name, message, error) {
  logError(name, message, error);
  return createNonNativeDOMException(name, message);
};
const ShimDOMException = useNativeDOMException ? DOMException : ShimNonNativeDOMException;

const listeners$2 = ['onsuccess', 'onerror'];
const readonlyProperties$5 = ['source', 'transaction', 'readyState'];
const doneFlagGetters = ['result', 'error'];

/**
 * The IDBRequest Object that is returns for all async calls.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 * @class
 */
function IDBRequest() {
  throw new TypeError('Illegal constructor');
}
// eslint-disable-next-line func-name-matching
IDBRequest.__super = function IDBRequest() {
  this[Symbol.toStringTag] = 'IDBRequest';
  this.__setOptions({
    legacyOutputDidListenersThrowFlag: true // Event hook for IndexedB
  });

  doneFlagGetters.forEach(prop => {
    Object.defineProperty(this, '__' + prop, {
      enumerable: false,
      configurable: false,
      writable: true
    });
    Object.defineProperty(this, prop, {
      enumerable: true,
      configurable: true,
      get() {
        if (!this.__done) {
          throw createDOMException('InvalidStateError', "Can't get " + prop + '; the request is still pending.');
        }
        return this['__' + prop];
      }
    });
  });
  defineReadonlyProperties(this, readonlyProperties$5, {
    readyState: {
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
IDBRequest.__createInstance = function () {
  return new IDBRequest.__super();
};
IDBRequest.prototype = EventTargetFactory.createInstance({
  extraProperties: ['debug']
});
IDBRequest.prototype[Symbol.toStringTag] = 'IDBRequestPrototype';
IDBRequest.prototype.__getParent = function () {
  if (this.toString() === '[object IDBOpenDBRequest]') {
    return null;
  }
  return this.__transaction;
};

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
const openListeners = ['onblocked', 'onupgradeneeded'];

/**
 * The IDBOpenDBRequest called when a database is opened.
 * @class
 */
function IDBOpenDBRequest() {
  throw new TypeError('Illegal constructor');
}
IDBOpenDBRequest.prototype = Object.create(IDBRequest.prototype);
Object.defineProperty(IDBOpenDBRequest.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: IDBOpenDBRequest
});
const IDBOpenDBRequestAlias = IDBOpenDBRequest;
IDBOpenDBRequest.__createInstance = function () {
  function IDBOpenDBRequest() {
    IDBRequest.__super.call(this);
    this[Symbol.toStringTag] = 'IDBOpenDBRequest';
    this.__setOptions({
      legacyOutputDidListenersThrowFlag: true,
      // Event hook for IndexedB
      extraProperties: ['oldVersion', 'newVersion', 'debug']
    }); // Ensure EventTarget preserves our properties
    defineListenerProperties(this, openListeners);
  }
  IDBOpenDBRequest.prototype = IDBOpenDBRequestAlias.prototype;
  return new IDBOpenDBRequest();
};
defineOuterInterface(IDBOpenDBRequest.prototype, openListeners);
IDBOpenDBRequest.prototype[Symbol.toStringTag] = 'IDBOpenDBRequestPrototype';
Object.defineProperty(IDBOpenDBRequest, 'prototype', {
  writable: false
});

// Since [immediate](https://github.com/calvinmetcalf/immediate) is
//   not doing the trick for our WebSQL transactions (at least in Node),
//   we are forced to make the promises run fully synchronously.

function isPromise(p) {
  return p && typeof p.then === 'function';
}
function addReject(prom, reject) {
  prom.then(null, reject); // Use this style for sake of non-Promise thenables (e.g., jQuery Deferred)
}

// States
var PENDING = 2,
  FULFILLED = 0,
  // We later abuse these as array indices
  REJECTED = 1;
function SyncPromise(fn) {
  var self = this;
  self.v = 0; // Value, this will be set to either a resolved value or rejected reason
  self.s = PENDING; // State of the promise
  self.c = [[], []]; // Callbacks c[0] is fulfillment and c[1] contains rejection callbacks
  function transist(val, state) {
    self.v = val;
    self.s = state;
    self.c[state].forEach(function (fn) {
      fn(val);
    });
    // Release memory, but if no handlers have been added, as we
    //   assume that we will resolve/reject (truly) synchronously
    //   and thus we avoid flagging checks about whether we've
    //   already resolved/rejected.
    if (self.c[state].length) self.c = null;
  }
  function resolve(val) {
    if (!self.c) ; else if (isPromise(val)) {
      addReject(val.then(resolve), reject);
    } else {
      transist(val, FULFILLED);
    }
  }
  function reject(reason) {
    if (!self.c) ; else if (isPromise(reason)) {
      addReject(reason.then(reject), reject);
    } else {
      transist(reason, REJECTED);
    }
  }
  try {
    fn(resolve, reject);
  } catch (err) {
    reject(err);
  }
}
var prot = SyncPromise.prototype;
prot.then = function (cb, errBack) {
  var self = this;
  return new SyncPromise(function (resolve, reject) {
    var rej = typeof errBack === 'function' ? errBack : reject;
    function settle() {
      try {
        resolve(cb ? cb(self.v) : self.v);
      } catch (e) {
        rej(e);
      }
    }
    if (self.s === FULFILLED) {
      settle();
    } else if (self.s === REJECTED) {
      rej(self.v);
    } else {
      self.c[FULFILLED].push(settle);
      self.c[REJECTED].push(rej);
    }
  });
};
prot.catch = function (cb) {
  var self = this;
  return new SyncPromise(function (resolve, reject) {
    function settle() {
      try {
        resolve(cb(self.v));
      } catch (e) {
        reject(e);
      }
    }
    if (self.s === REJECTED) {
      settle();
    } else if (self.s === FULFILLED) {
      resolve(self.v);
    } else {
      self.c[REJECTED].push(settle);
      self.c[FULFILLED].push(resolve);
    }
  });
};
SyncPromise.all = function (promises) {
  return new SyncPromise(function (resolve, reject, l) {
    l = promises.length;
    var hasPromises = false;
    var newPromises = [];
    if (!l) {
      resolve(newPromises);
      return;
    }
    promises.forEach(function (p, i) {
      if (isPromise(p)) {
        addReject(p.then(function (res) {
          newPromises[i] = res;
          --l || resolve(newPromises);
        }), reject);
      } else {
        newPromises[i] = p;
        --l || resolve(promises);
      }
    });
  });
};
SyncPromise.race = function (promises) {
  var resolved = false;
  return new SyncPromise(function (resolve, reject) {
    promises.some(function (p, i) {
      if (isPromise(p)) {
        addReject(p.then(function (res) {
          if (resolved) {
            return;
          }
          resolve(res);
          resolved = true;
        }), reject);
      } else {
        resolve(p);
        resolved = true;
        return true;
      }
    });
  });
};
SyncPromise.resolve = function (val) {
  return new SyncPromise(function (resolve, reject) {
    resolve(val);
  });
};
SyncPromise.reject = function (val) {
  return new SyncPromise(function (resolve, reject) {
    reject(val);
  });
};
var syncPromiseCommonjs = SyncPromise;

/**
 * Compares two keys.
 * @param first
 * @param second
 * @returns {number}
 */
function cmp(first, second) {
  const encodedKey1 = encode$1(first);
  const encodedKey2 = encode$1(second);
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
 * @module Key
 */

/**
 * Encodes the keys based on their types. This is required to maintain collations
 * We leave space for future keys.
 */
const keyTypeToEncodedChar = {
  invalid: 100,
  number: 200,
  date: 300,
  string: 400,
  binary: 500,
  array: 600
};
const keyTypes = Object.keys(keyTypeToEncodedChar);
keyTypes.forEach(k => {
  keyTypeToEncodedChar[k] = String.fromCodePoint(keyTypeToEncodedChar[k]);
});
const encodedCharToKeyType = keyTypes.reduce((o, k) => {
  o[keyTypeToEncodedChar[k]] = k;
  return o;
}, {});

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
const types = {
  invalid: {
    encode(key) {
      return keyTypeToEncodedChar.invalid + '-';
    },
    decode(key) {
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
            mantissa = flipBase32(padBase32Mantissa(key32));
            // Non-negative exponent case:
          } else {
            sign = signValues.indexOf('bigNegative');
            exponent = flipBase32(padBase32Exponent(decimalIndex !== -1 ? decimalIndex : key32.length));
            mantissa = flipBase32(padBase32Mantissa(key32));
          }
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
    decode(key) {
      const sign = Number(key.slice(2, 3));
      let exponent = key.slice(3, 5);
      let mantissa = key.slice(5, 16);
      switch (signValues[sign]) {
        case 'negativeInfinity':
          return Number.NEGATIVE_INFINITY;
        case 'positiveInfinity':
          return Number.POSITIVE_INFINITY;
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
    encode(key, inArray) {
      if (inArray) {
        // prepend each character with a dash, and append a space to the end
        key = key.replace(/(.)/gu, '-$1') + ' ';
      }
      return keyTypeToEncodedChar.string + '-' + key;
    },
    decode(key, inArray) {
      key = key.slice(2);
      if (inArray) {
        // remove the space at the end, and the dash before each character
        key = key.slice(0, -1).replace(/-(.)/gu, '$1');
      }
      return key;
    }
  },
  // Arrays are encoded as JSON strings.
  // An extra, value is added to each array during encoding to make
  //  empty arrays sort correctly.
  array: {
    encode(key) {
      const encoded = [];
      for (const [i, item] of key.entries()) {
        const encodedItem = encode$1(item, true); // encode the array item
        encoded[i] = encodedItem;
      }
      encoded.push(keyTypeToEncodedChar.invalid + '-'); // append an extra item, so empty arrays sort correctly
      return keyTypeToEncodedChar.array + '-' + JSON.stringify(encoded);
    },
    decode(key) {
      const decoded = JSON.parse(key.slice(2));
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
    encode(key) {
      return keyTypeToEncodedChar.date + '-' + key.toJSON();
    },
    decode(key) {
      return new Date(key.slice(2));
    }
  },
  binary: {
    // `ArrayBuffer`/Views on buffers (`TypedArray` or `DataView`)
    encode(key) {
      return keyTypeToEncodedChar.binary + '-' + (key.byteLength ? [...getCopyBytesHeldByBufferSource(key)].map(b => String(b).padStart(3, '0')) // e.g., '255,005,254,000,001,033'
      : '');
    },
    decode(key) {
      // Set the entries in buffer's [[ArrayBufferData]] to those in `value`
      const k = key.slice(2);
      const arr = k.length ? k.split(',').map(s => Number.parseInt(s)) : [];
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
  n = n.toString(32);
  return n.length === 1 ? '0' + n : n;
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
  exponent = Number.parseInt(exponent, 32);
  if (exponent < 0) {
    return roundToPrecision(Number.parseInt(mantissa, 32) * Math.pow(32, exponent - 10));
  }
  if (exponent < 11) {
    let whole = mantissa.slice(0, exponent);
    whole = Number.parseInt(whole, 32);
    let fraction = mantissa.slice(exponent);
    fraction = Number.parseInt(fraction, 32) * Math.pow(32, exponent - 11);
    return roundToPrecision(whole + fraction);
  }
  const expansion = mantissa + zeros(exponent - 11);
  return Number.parseInt(expansion, 32);
}

/**
 * @param {Float} num
 * @param {Float} [precision=16]
 * @returns {Float}
 */
function roundToPrecision(num, precision = 16) {
  return Number.parseFloat(num.toPrecision(precision));
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
* @typedef {"number"|"date"|"string"|"binary"|"array"} module:Key.KeyType
*/

/**
 * @param key
 * @returns {module:Key.KeyType}
 */
function getKeyType(key) {
  if (Array.isArray(key)) return 'array';
  if (isDate(key)) return 'date';
  if (isBinary(key)) return 'binary';
  const keyType = typeof key;
  return ['string', 'number'].includes(keyType) ? keyType : 'invalid';
}

/**
 * Keys must be strings, numbers (besides `NaN`), Dates (if value is not
 *   `NaN`), binary objects or Arrays.
 * @param input The key input
 * @param {?(Array)} [seen] An array of already seen keys
 * @returns {module:Key.keyValueObject}
 */
function convertValueToKey(input, seen) {
  return convertValueToKeyValueDecoded(input, seen, false, true);
}

/**
* Currently not in use.
* @param input
* @returns {module:Key.keyValueObject}
*/
function convertValueToMultiEntryKey(input) {
  return convertValueToKeyValueDecoded(input, null, true, true);
}

/**
 *
 * @param O
 * @throws {TypeError}
 * @see https://heycam.github.io/webidl/#ref-for-dfn-get-buffer-source-copy-2
 * @returns {Uint8Array}
 */
function getCopyBytesHeldByBufferSource(O) {
  let offset = 0;
  let length = 0;
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
  return new Uint8Array(O.buffer || O, offset, length);
}

/**
* @typedef {PlainObject} module:Key.keyValueObject
* @property {module:Key.KeyType|"NaN"} type
* @property {*} [value]
* @property {boolean} [invalid]
* @property {string} [message]
* @todo Specify acceptable `value` more precisely
*/

/**
* Shortcut utility to avoid returning full keys from `convertValueToKey`
*   and subsequent need to process in calling code unless `fullKeys` is
*   set; may throw.
* @param {module:Key.Key} input
* @param {?(Array)} [seen]
* @param {boolean} [multiEntry]
* @param {boolean} [fullKeys]
* @throws {TypeError} See `getCopyBytesHeldByBufferSource`
* @todo Document other allowable `input`
* @returns {module:Key.keyValueObject}
*/
function convertValueToKeyValueDecoded(input, seen, multiEntry, fullKeys) {
  seen = seen || [];
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
        return ret;
      }
    case 'string':
      {
        return ret;
      }
    case 'binary':
      {
        // May throw (if detached)
        // Get a copy of the bytes held by the buffer source
        // https://heycam.github.io/webidl/#ref-for-dfn-get-buffer-source-copy-2
        const octets = getCopyBytesHeldByBufferSource(input);
        return {
          type: 'binary',
          value: octets
        };
      }
    case 'array':
      {
        // May throw (from binary)
        const len = input.length;
        seen.push(input);
        const keys = [];
        for (let i = 0; i < len; i++) {
          // We cannot iterate here with array extras as we must ensure sparse arrays are invalidated
          if (!multiEntry && !Object.prototype.hasOwnProperty.call(input, i)) {
            return {
              type,
              invalid: true,
              message: 'Does not have own index property'
            };
          }
          try {
            const entry = input[i];
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
        if (!Number.isNaN(input.getTime())) {
          return fullKeys ? {
            type,
            value: input.getTime()
          } : {
            type,
            value: new Date(input.getTime())
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
        //    'undefined', 'boolean', 'object' (including `null`), 'symbol', 'function
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
* @typedef {*} module:Key.Key
* @todo Specify possible value more precisely
*/

/**
 *
 * @param {module:Key.Key} key
 * @param {boolean} fullKeys
 * @returns {module:Key.keyValueObject}
 * @todo Document other allowable `key`?
 */
function convertValueToMultiEntryKeyDecoded(key, fullKeys) {
  return convertValueToKeyValueDecoded(key, null, true, fullKeys);
}

/**
* An internal utility.
* @param input
* @param {boolean} seen
* @throws {DOMException} `DataError`
* @returns {module:Key.keyValueObject}
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
 * @param value
 * @param keyPath
 * @param {boolean} multiEntry
 * @returns {module:Key.keyValueObject|module:Key.KeyPathEvaluateValue}
 * @todo Document other possible return?
 */
function extractKeyFromValueUsingKeyPath(value, keyPath, multiEntry) {
  return extractKeyValueDecodedFromValueUsingKeyPath(value, keyPath, multiEntry, true);
}
/**
* Not currently in use.
* @param value
* @param keyPath
* @param {boolean} multiEntry
* @returns {module:Key.KeyPathEvaluateValue}
*/
function evaluateKeyPathOnValue(value, keyPath, multiEntry) {
  return evaluateKeyPathOnValueToDecodedValue(value, keyPath);
}

/**
* May throw, return `{failure: true}` (e.g., non-object on keyPath resolution)
*    or `{invalid: true}` (e.g., `NaN`).
* @param value
* @param keyPath
* @param {boolean} multiEntry
* @param {boolean} fullKeys
* @returns {module:Key.keyValueObject|module:Key.KeyPathEvaluateValue}
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
* @typedef {PlainObject} module:Key.KeyPathEvaluateFailure
* @property {boolean} failure
*/

/**
* @typedef {PlainObject} module:Key.KeyPathEvaluateValue
* @property {undefined|array|string} value
*/

/**
 * Returns the value of an inline key based on a key path (wrapped in an
 *   object with key `value`) or `{failure: true}`
 * @param {object} value
 * @param {string|array} keyPath
 * @param {boolean} multiEntry
 * @param {boolean} [fullKeys]
 * @returns {module:Key.KeyPathEvaluateValue}
 */
function evaluateKeyPathOnValueToDecodedValue(value, keyPath, multiEntry, fullKeys) {
  if (Array.isArray(keyPath)) {
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
  return identifiers.some((idntfr, i) => {
    if (idntfr === 'length' && (typeof value === 'string' || Array.isArray(value))) {
      value = value.length;
    } else if (isBlob(value)) {
      switch (idntfr) {
        case 'size':
        case 'type':
          value = value[idntfr];
          break;
      }
    } else if (isFile(value)) {
      switch (idntfr) {
        case 'name':
        case 'lastModified':
          value = value[idntfr];
          break;
        case 'lastModifiedDate':
          value = new Date(value.lastModified);
          break;
      }
    } else if (!isObj(value) || !Object.prototype.hasOwnProperty.call(value, idntfr)) {
      return true;
    } else {
      value = value[idntfr];
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
 * @param {object} value
 * @param {*} key
 * @param {string} keyPath
 * @returns {void}
 */
function injectKeyIntoValueUsingKeyPath(value, key, keyPath) {
  const identifiers = keyPath.split('.');
  const last = identifiers.pop();
  identifiers.forEach(identifier => {
    const hop = Object.prototype.hasOwnProperty.call(value, identifier);
    if (!hop) {
      value[identifier] = {};
    }
    value = value[identifier];
  });
  value[last] = key; // key is already a `keyValue` in our processing so no need to convert
}

/**
 *
 * @param value
 * @param keyPath
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
    const hop = Object.prototype.hasOwnProperty.call(value, identifier);
    if (!hop) {
      return true;
    }
    value = value[identifier];
  }
  return isObj(value);
}

/**
 *
 * @param {module:Key.Key} key
 * @param {IDBKeyRange} range
 * @param {boolean} checkCached
 * @returns {boolean}
 */
function isKeyInRange(key, range, checkCached) {
  let lowerMatch = range.lower === undefined;
  let upperMatch = range.upper === undefined;
  const encodedKey = encode$1(key, true);
  const lower = checkCached ? range.__lowerCached : encode$1(range.lower, true);
  const upper = checkCached ? range.__upperCached : encode$1(range.upper, true);
  if (range.lower !== undefined) {
    if (range.lowerOpen && encodedKey > lower) {
      lowerMatch = true;
    }
    if (!range.lowerOpen && encodedKey >= lower) {
      lowerMatch = true;
    }
  }
  if (range.upper !== undefined) {
    if (range.upperOpen && encodedKey < upper) {
      upperMatch = true;
    }
    if (!range.upperOpen && encodedKey <= upper) {
      upperMatch = true;
    }
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
 * @param {module:Key.Key} keyEntry
 * @param {IDBKeyRange} range
 * @returns {module:Key.Key[]}
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
* @typedef {number|string|Date|ArrayBuffer|module:Key.ValueTypes[]} module:Key.ValueTypes
*/

/**
* Not currently in use but keeping for spec parity.
* @param {module:Key.Key} key
* @throws {Error} Upon a "bad key"
* @returns {module:Key.ValueTypes}
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
 * @param {module:Key.Key} key
 * @param {boolean} inArray
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
 * @param {module:Key.Key} key
 * @param {boolean} inArray
 * @throws {Error} Invalid number
 * @returns {undefined|module:Key.ValueTypes}
 */
function decode$1(key, inArray) {
  if (typeof key !== 'string') {
    return undefined;
  }
  return types[encodedCharToKeyType[key.slice(0, 1)]].decode(key, inArray);
}

/**
 *
 * @param {module:Key.Key} key
 * @param {boolean} inArray
 * @returns {undefined|module:Key.ValueTypes}
 */
function roundTrip(key, inArray) {
  return decode$1(encode$1(key, inArray), inArray);
}
const MAX_ALLOWED_CURRENT_NUMBER = 9007199254740992; // 2 ^ 53 (Also equal to `Number.MAX_SAFE_INTEGER + 1`)

/**
 * @external WebSQLTransaction
 */

/**
* @typedef {IDBObjectStore} IDBObjectStoreWithCurrentName
* @property {string} __currentName
*/

/**
 * @callback CurrentNumberCallback
 * @param {Integer} The current number
 * @returns {void}
 */

/**
* @callback SQLFailureCallback
* @param {DOMException} exception
* @returns {void}
*/

/**
 *
 * @param {external:WebSQLTransaction} tx
 * @param {IDBObjectStoreWithCurrentName} store
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
  });
}

/**
 *
 * @param {external:WebSQLTransaction} tx
 * @param {IDBObjectStoreWithCurrentName} store
 * @param {Integer} num
 * @param {CurrentNumberCallback} successCb
 * @param {SQLFailureCallback} failCb
 * @returns {void}
 */
function assignCurrentNumber(tx, store, num, successCb, failCb) {
  const sql = 'UPDATE __sys__ SET "currNum" = ? WHERE "name" = ?';
  const sqlValues = [num, escapeSQLiteStatement(store.__currentName)];
  CFG.DEBUG && console.log(sql, sqlValues);
  tx.executeSql(sql, sqlValues, function (tx, data) {
    successCb(num);
  }, function (tx, err) {
    failCb(createDOMException('UnknownError', 'Could not set the auto increment value for key', err));
  });
}

/**
 * Bump up the auto-inc counter if the key path-resolved value is valid
 *   (greater than old value and >=1) OR if a manually passed in key is
 *   valid (numeric and >= 1) and >= any primaryKey.
 * @param {external:WebSQLTransaction} tx
 * @param {IDBObjectStoreWithCurrentName} store
 * @param {Integer} num
 * @param {CurrentNumberCallback} successCb
 * @param {SQLFailureCallback} failCb
 * @returns {void}
 */
function setCurrentNumber(tx, store, num, successCb, failCb) {
  num = num === MAX_ALLOWED_CURRENT_NUMBER ? num + 2 // Since incrementing by one will have no effect in JavaScript on this unsafe max, we represent the max as a number incremented by two. The getting of the current number is never returned to the user and is only used in safe comparisons, so it is safe for us to represent it in this manner
  : num + 1;
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
 * @param {external:WebSQLTransaction} tx
 * @param {IDBObjectStoreWithCurrentName} store
 * @param {KeyForStoreCallback} cb
 * @param {SQLFailureCallback} sqlFailCb
 * @returns {void}
 */
function generateKeyForStore(tx, store, cb, sqlFailCb) {
  getCurrentNumber(tx, store, function (key) {
    if (key > MAX_ALLOWED_CURRENT_NUMBER) {
      // 2 ^ 53 (See <https://github.com/w3c/IndexedDB/issues/147>)
      cb('failure'); // eslint-disable-line n/no-callback-literal
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
 * @param {external:WebSQLTransaction} tx
 * @param {IDBObjectStoreWithCurrentName} store
 * @param {*|Integer} key
 * @param {CurrentNumberCallback|void} successCb
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

const readonlyProperties$4 = ['lower', 'upper', 'lowerOpen', 'upperOpen'];

/* eslint-disable jsdoc/check-param-names */
/**
 * The IndexedDB KeyRange object.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
 * @param {Object} lower
 * @param {Object} upper
 * @param {Object} lowerOpen
 * @param {Object} upperOpen
 * @throws {TypeError}
 * @class
 */
function IDBKeyRange() {
  /* eslint-enable jsdoc/check-param-names */
  throw new TypeError('Illegal constructor');
}
const IDBKeyRangeAlias = IDBKeyRange;
IDBKeyRange.__createInstance = function (lower, upper, lowerOpen, upperOpen) {
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
      if (encode$1(lower) > encode$1(upper)) {
        throw createDOMException('DataError', '`lower` must not be greater than `upper` argument in `bound()` call.');
      }
    }
    this.__lower = lowerConverted;
    this.__upper = upperConverted;
    this.__lowerOpen = Boolean(lowerOpen);
    this.__upperOpen = Boolean(upperOpen);
  }
  IDBKeyRange.prototype = IDBKeyRangeAlias.prototype;
  return new IDBKeyRange();
};
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
IDBKeyRange.only = function (value) {
  if (!arguments.length) {
    throw new TypeError('IDBKeyRange.only requires a value argument');
  }
  return IDBKeyRange.__createInstance(value, value, false, false);
};
IDBKeyRange.lowerBound = function (value /*, open */) {
  if (!arguments.length) {
    throw new TypeError('IDBKeyRange.lowerBound requires a value argument');
  }
  // eslint-disable-next-line prefer-rest-params
  return IDBKeyRange.__createInstance(value, undefined, arguments[1], true);
};
IDBKeyRange.upperBound = function (value /*, open */) {
  if (!arguments.length) {
    throw new TypeError('IDBKeyRange.upperBound requires a value argument');
  }
  // eslint-disable-next-line prefer-rest-params
  return IDBKeyRange.__createInstance(undefined, value, true, arguments[1]);
};
IDBKeyRange.bound = function (lower, upper /* , lowerOpen, upperOpen */) {
  if (arguments.length <= 1) {
    throw new TypeError('IDBKeyRange.bound requires lower and upper arguments');
  }
  // eslint-disable-next-line prefer-rest-params
  return IDBKeyRange.__createInstance(lower, upper, arguments[2], arguments[3]);
};
IDBKeyRange.prototype[Symbol.toStringTag] = 'IDBKeyRangePrototype';
readonlyProperties$4.forEach(prop => {
  Object.defineProperty(IDBKeyRange.prototype, '__' + prop, {
    enumerable: false,
    configurable: false,
    writable: true
  });
  // Ensure for proper interface testing that "get <name>" is the function name
  const o = {
    get [prop]() {
      // We can't do a regular instanceof check as it will create a loop given our hasInstance implementation
      if (!isObj(this) || typeof this.__lowerOpen !== 'boolean') {
        throw new TypeError('Illegal invocation');
      }
      return this['__' + prop];
    }
  };
  const desc = Object.getOwnPropertyDescriptor(o, prop);
  // desc.enumerable = true; // Default
  // desc.configurable = true; // Default
  Object.defineProperty(IDBKeyRange.prototype, prop, desc);
});
Object.defineProperty(IDBKeyRange, Symbol.hasInstance, {
  value: obj => isObj(obj) && 'upper' in obj && typeof obj.lowerOpen === 'boolean'
});
Object.defineProperty(IDBKeyRange, 'prototype', {
  writable: false
});
function setSQLForKeyRange(range, quotedKeyColumnName, sql, sqlValues, addAnd, checkCached) {
  if (range && (range.lower !== undefined || range.upper !== undefined)) {
    if (addAnd) sql.push('AND');
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
      sqlValues.push(escapeSQLiteStatement(encodedLowerKey));
      if (hasUpper && encodedLowerKey === encodedUpperKey && !range.lowerOpen && !range.upperOpen) {
        sql.push(quotedKeyColumnName, '=', '?');
        return;
      }
      sql.push(quotedKeyColumnName, range.lowerOpen ? '>' : '>=', '?');
    }
    hasLower && hasUpper && sql.push('AND');
    if (hasUpper) {
      sql.push(quotedKeyColumnName, range.upperOpen ? '<' : '<=', '?');
      sqlValues.push(escapeSQLiteStatement(encodedUpperKey));
    }
  }
}
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
  } catch (e) {
    // Object.defineProperty does not work as intended.
  }
}

/**
 * Shim the DOMStringList object.
 * @throws {TypeError}
 * @class
 */
const DOMStringList = function () {
  throw new TypeError('Illegal constructor');
};
DOMStringList.prototype = {
  constructor: DOMStringList,
  // Interface.
  contains(str) {
    if (!arguments.length) {
      throw new TypeError('DOMStringList.contains must be supplied a value');
    }
    return this._items.includes(str);
  },
  item(key) {
    if (!arguments.length) {
      throw new TypeError('DOMStringList.item must be supplied a value');
    }
    if (key < 0 || key >= this.length || !Number.isInteger(key)) {
      return null;
    }
    return this._items[key];
  },
  // Helpers. Should only be used internally.
  clone() {
    const stringList = DOMStringList.__createInstance();
    stringList._items = this._items.slice();
    stringList._length = this.length;
    stringList.addIndexes();
    return stringList;
  },
  addIndexes() {
    for (let i = 0; i < this._items.length; i++) {
      this[i] = this._items[i];
    }
  },
  sortList() {
    // http://w3c.github.io/IndexedDB/#sorted-list
    // https://tc39.github.io/ecma262/#sec-abstract-relational-comparison
    this._items.sort();
    this.addIndexes();
    return this._items;
  },
  forEach(cb, thisArg) {
    // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
    this._items.forEach(cb, thisArg);
  },
  map(cb, thisArg) {
    // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
    return this._items.map(cb, thisArg);
  },
  indexOf(str) {
    return this._items.indexOf(str);
  },
  push(item) {
    this._items.push(item);
    this._length++;
    this.sortList();
  },
  splice(...args /* index, howmany, item1, ..., itemX */) {
    this._items.splice(...args);
    this._length = this._items.length;
    for (const i in this) {
      if (i === String(Number.parseInt(i))) {
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
Object.defineProperty(DOMStringList, Symbol.hasInstance, {
  value(obj) {
    return Object.prototype.toString.call(obj) === 'DOMStringListPrototype';
  }
});
const DOMStringListAlias = DOMStringList;
Object.defineProperty(DOMStringList, '__createInstance', {
  value() {
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
      this._items = [];
      this._length = 0;
    };
    DOMStringList.prototype = DOMStringListAlias.prototype;
    return new DOMStringList();
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

/* eslint-disable jsdoc/check-param-names */
/**
 * The IndexedDB Transaction.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
 * @param {IDBDatabase} db
 * @param {string[]} storeNames
 * @param {string} mode
 * @class
 */
function IDBTransaction() {
  /* eslint-enable jsdoc/check-param-names */
  throw new TypeError('Illegal constructor');
}
const IDBTransactionAlias = IDBTransaction;
IDBTransaction.__createInstance = function (db, storeNames, mode) {
  function IDBTransaction() {
    const me = this;
    me[Symbol.toStringTag] = 'IDBTransaction';
    defineReadonlyProperties(me, readonlyProperties$3);
    me.__id = ++uniqueID; // for debugging simultaneous transactions
    me.__active = true;
    me.__running = false;
    me.__errored = false;
    me.__requests = [];
    me.__objectStoreNames = storeNames;
    me.__mode = mode;
    me.__db = db;
    me.__error = null;
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
  return new IDBTransaction();
};
IDBTransaction.prototype = EventTargetFactory.createInstance({
  defaultSync: true,
  // Ensure EventTarget preserves our properties
  extraProperties: ['complete']
});
IDBTransaction.prototype.__transFinishedCb = function (err, cb) {
  cb(Boolean(err));
};
IDBTransaction.prototype.__executeRequests = function () {
  const me = this;
  if (me.__running) {
    CFG.DEBUG && console.log('Looks like the request set is already running', me.mode);
    return;
  }
  me.__running = true;
  me.db.__db[me.mode === 'readonly' ? 'readTransaction' : 'transaction'](
  // `readTransaction` is optimized, at least in `node-websql`
  function executeRequests(tx) {
    me.__tx = tx;
    let q = null,
      i = -1;
    function success(result, req) {
      if (me.__errored || me.__requestsFinished) {
        // We've already called "onerror", "onabort", or thrown within the transaction, so don't do it again.
        return;
      }
      if (req) {
        q.req = req; // Need to do this in case of cursors
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
      executeNextRequest();
    }
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
      const err = findError(args);
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
            q.op(tx, q.args, executeNextRequest, error);
            return;
          }
          if (q.req.__done) {
            // Avoid continuing with aborted requests
            return;
          }
          q.op(tx, q.args, success, error, executeNextRequest);
        } catch (e) {
          error(e);
        }
      }
    }
    executeNextRequest();
  }, function webSQLError(webSQLErr) {
    if (webSQLErr === true) {
      // Not a genuine SQL error
      return;
    }
    const err = webSQLErrback(webSQLErr);
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
  function requestsFinished() {
    me.__active = false;
    me.__requestsFinished = true;
    function complete() {
      me.__completed = true;
      CFG.DEBUG && console.log('Transaction completed');
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
    const ev = createEvent('__beforecomplete');
    ev.complete = complete;
    me.dispatchEvent(ev);
  }
};

/**
 * Creates a new IDBRequest for the transaction.
 * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}.
 * @param {IDBDatabase} source
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__createRequest = function (source) {
  const me = this;
  const request = IDBRequest.__createInstance();
  request.__source = source !== undefined ? source : me.db;
  request.__transaction = me;
  return request;
};

/**
 * Adds a callback function to the transaction queue.
 * @param {function} callback
 * @param {*} args
 * @param {IDBDatabase} source
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__addToTransactionQueue = function (callback, args, source) {
  const request = this.__createRequest(source);
  this.__pushToQueue(request, callback, args);
  return request;
};

/**
 * Adds a callback function to the transaction queue without generating a
 *   request.
 * @param {function} callback
 * @param {*} args
 * @param {IDBDatabase} source
 * @returns {void}
 * @protected
 */
IDBTransaction.prototype.__addNonRequestToTransactionQueue = function (callback, args, source) {
  this.__pushToQueue(null, callback, args);
};

/**
 * Adds an IDBRequest to the transaction queue.
 * @param {IDBRequest} request
 * @param {function} callback
 * @param {*} args
 * @protected
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
IDBTransaction.prototype.__assertActive = function () {
  if (!this.__active) {
    throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
  }
};
IDBTransaction.prototype.__assertWritable = function () {
  if (this.mode === 'readonly') {
    throw createDOMException('ReadOnlyError', 'The transaction is read only');
  }
};
IDBTransaction.prototype.__assertVersionChange = function () {
  IDBTransaction.__assertVersionChange(this);
};

/**
 * Returns the specified object store.
 * @param {string} objectStoreName
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
    // eslint-disable-line unicorn/prefer-includes
    throw createDOMException('NotFoundError', objectStoreName + ' is not participating in this transaction');
  }
  const store = me.db.__objectStores[objectStoreName];
  if (!store) {
    throw createDOMException('NotFoundError', objectStoreName + ' does not exist in ' + me.db.name);
  }
  if (!me.__storeHandles[objectStoreName] ||
  // These latter conditions are to allow store
  //   recreation to create new clone object
  me.__storeHandles[objectStoreName].__pendingDelete || me.__storeHandles[objectStoreName].__deleted) {
    me.__storeHandles[objectStoreName] = IDBObjectStore.__clone(store, me);
  }
  return me.__storeHandles[objectStoreName];
};
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
      if ('__pendingName' in store && me.db.__oldObjectStoreNames.indexOf(store.__pendingName) > -1 // eslint-disable-line unicorn/prefer-includes
      ) {
        store.__name = store.__originalName;
      }
      store.__indexNames = store.__oldIndexNames;
      delete store.__pendingDelete;
      Object.values(store.__indexes).concat(Object.values(store.__indexHandles)).forEach(function (index) {
        // Index was already created so we restore to name before the rename
        if ('__pendingName' in index && store.__oldIndexNames.indexOf(index.__pendingName) > -1 // eslint-disable-line unicorn/prefer-includes
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
  function abort(tx, errOrResult) {
    if (!tx) {
      CFG.DEBUG && console.log('Rollback not possible due to missing transaction', me);
    } else if (errOrResult && typeof errOrResult.code === 'number') {
      CFG.DEBUG && console.log('Rollback erred; feature is probably not supported as per WebSQL', me);
    } else {
      CFG.DEBUG && console.log('Rollback succeeded', me);
    }
    me.dispatchEvent(createEvent('__preabort'));
    me.__requests.filter(function (q, i, arr) {
      // eslint-disable-line promise/no-promise-in-callback
      return q.req && !q.req.__done && [i, -1].includes(arr.map(q => q.req).lastIndexOf(q.req));
    }).reduce(function (promises, q) {
      // We reduce to a chain of promises to be queued in order, so we cannot
      //  use `Promise.all`, and I'm unsure whether `setTimeout` currently
      //  behaves first-in-first-out with the same timeout so we could
      //  just use a `forEach`.
      return promises.then(function () {
        q.req.__done = true;
        q.req.__result = undefined;
        q.req.__error = createDOMException('AbortError', 'A request was aborted (an unfinished request).');
        const reqEvt = createEvent('error', q.req.__error, {
          bubbles: true,
          cancelable: true
        });
        return new syncPromiseCommonjs(function (resolve) {
          setTimeout(() => {
            q.req.dispatchEvent(reqEvt); // No need to catch errors
            resolve();
          });
        });
      });
    }, syncPromiseCommonjs.resolve()).then(function () {
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
      });
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
        me.__tx.executeSql('ROLLBACK', [], abort, abort); // Not working in some circumstances, even in Node
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
IDBTransaction.prototype.abort = function () {
  const me = this;
  if (!(me instanceof IDBTransaction)) {
    throw new TypeError('Illegal invocation');
  }
  CFG.DEBUG && console.log('The transaction was aborted', me);
  IDBTransaction.__assertNotFinished(me);
  me.__abortTransaction(null);
};
IDBTransaction.prototype[Symbol.toStringTag] = 'IDBTransactionPrototype';
IDBTransaction.__assertVersionChange = function (tx) {
  if (!tx || tx.mode !== 'versionchange') {
    throw createDOMException('InvalidStateError', 'Not a version transaction');
  }
};
IDBTransaction.__assertNotVersionChange = function (tx) {
  if (tx && tx.mode === 'versionchange') {
    throw createDOMException('InvalidStateError', 'Cannot be called during a version transaction');
  }
};
IDBTransaction.__assertNotFinished = function (tx) {
  if (!tx || tx.__completed || tx.__abortFinished || tx.__errored) {
    throw createDOMException('InvalidStateError', 'Transaction finished by commit or abort');
  }
};

// object store methods behave differently: see https://github.com/w3c/IndexedDB/issues/192
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
IDBTransaction.__assertActive = function (tx) {
  if (!tx || !tx.__active) {
    throw createDOMException('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
  }
};

/**
* Used by our `EventTarget.prototype` library to implement bubbling/capturing.
* @returns {IDBDatabase}
*/
IDBTransaction.prototype.__getParent = function () {
  return this.db;
};
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

function ownKeys(e, t) {
  var r = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    t && (n = n.filter(function (t) {
      return Object.getOwnPropertyDescriptor(e, t).enumerable;
    })), r.push.apply(r, n);
  }
  return r;
}
function _objectSpread2(e) {
  for (var t = 1; t < arguments.length; t++) {
    var r = null != arguments[t] ? arguments[t] : {};
    t % 2 ? ownKeys(Object(r), !0).forEach(function (t) {
      _defineProperty(e, t, r[t]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(r)) : ownKeys(Object(r)).forEach(function (t) {
      Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(r, t));
    });
  }
  return e;
}
function _typeof(e) {
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
    return typeof e;
  } : function (e) {
    return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
  }, _typeof(e);
}
function _classCallCheck(e, t) {
  if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
}
function _defineProperties(e, t) {
  for (var r = 0; r < t.length; r++) {
    var n = t[r];
    n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, _toPropertyKey(n.key), n);
  }
}
function _createClass(e, t, r) {
  return t && _defineProperties(e.prototype, t), r && _defineProperties(e, r), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}
function _defineProperty(e, t, r) {
  return (t = _toPropertyKey(t)) in e ? Object.defineProperty(e, t, {
    value: r,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[t] = r, e;
}
function _slicedToArray(e, t) {
  return function _arrayWithHoles(e) {
    if (Array.isArray(e)) return e;
  }(e) || function _iterableToArrayLimit(e, t) {
    var r = null == e ? null : "undefined" != typeof Symbol && e[Symbol.iterator] || e["@@iterator"];
    if (null != r) {
      var n,
        a,
        o,
        i,
        c = [],
        s = !0,
        u = !1;
      try {
        if (o = (r = r.call(e)).next, 0 === t) {
          if (Object(r) !== r) return;
          s = !1;
        } else for (; !(s = (n = o.call(r)).done) && (c.push(n.value), c.length !== t); s = !0);
      } catch (e) {
        u = !0, a = e;
      } finally {
        try {
          if (!s && null != r.return && (i = r.return(), Object(i) !== i)) return;
        } finally {
          if (u) throw a;
        }
      }
      return c;
    }
  }(e, t) || _unsupportedIterableToArray(e, t) || function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }();
}
function _unsupportedIterableToArray(e, t) {
  if (e) {
    if ("string" == typeof e) return _arrayLikeToArray(e, t);
    var r = Object.prototype.toString.call(e).slice(8, -1);
    return "Object" === r && e.constructor && (r = e.constructor.name), "Map" === r || "Set" === r ? Array.from(e) : "Arguments" === r || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r) ? _arrayLikeToArray(e, t) : void 0;
  }
}
function _arrayLikeToArray(e, t) {
  (null == t || t > e.length) && (t = e.length);
  for (var r = 0, n = new Array(t); r < t; r++) n[r] = e[r];
  return n;
}
function _toPropertyKey(e) {
  var t = function _toPrimitive(e, t) {
    if ("object" != typeof e || null === e) return e;
    var r = e[Symbol.toPrimitive];
    if (void 0 !== r) {
      var n = r.call(e, t || "default");
      if ("object" != typeof n) return n;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === t ? String : Number)(e);
  }(e, "string");
  return "symbol" == typeof t ? t : String(t);
}
var e = _createClass(function TypesonPromise(e) {
  _classCallCheck(this, TypesonPromise), this.p = new Promise(e);
});
e.__typeson__type__ = "TypesonPromise", "undefined" != typeof Symbol && (e.prototype[Symbol.toStringTag] = "TypesonPromise"), e.prototype.then = function (t, r) {
  var n = this;
  return new e(function (e, a) {
    n.p.then(function (r) {
      e(t ? t(r) : r);
    }).catch(function (e) {
      return r ? r(e) : Promise.reject(e);
    }).then(e, a);
  });
}, e.prototype.catch = function (e) {
  return this.then(null, e);
}, e.resolve = function (t) {
  return new e(function (e) {
    e(t);
  });
}, e.reject = function (t) {
  return new e(function (e, r) {
    r(t);
  });
}, ["all", "race", "allSettled"].forEach(function (t) {
  e[t] = function (r) {
    return new e(function (e, n) {
      Promise[t](r.map(function (e) {
        return e && e.constructor && "TypesonPromise" === e.constructor.__typeson__type__ ? e.p : e;
      })).then(e, n);
    });
  };
});
var t = {}.toString,
  r = {}.hasOwnProperty,
  n = Object.getPrototypeOf,
  a = r.toString;
function isThenable(e, t) {
  return isObject(e) && "function" == typeof e.then && (!t || "function" == typeof e.catch);
}
function toStringTag(e) {
  return t.call(e).slice(8, -1);
}
function hasConstructorOf(e, t) {
  if (!e || "object" !== _typeof(e)) return !1;
  var o = n(e);
  if (!o) return null === t;
  var i = r.call(o, "constructor") && o.constructor;
  return "function" != typeof i ? null === t : t === i || null !== t && a.call(i) === a.call(t) || "function" == typeof t && "string" == typeof i.__typeson__type__ && i.__typeson__type__ === t.__typeson__type__;
}
function isPlainObject(e) {
  return !(!e || "Object" !== toStringTag(e)) && (!n(e) || hasConstructorOf(e, Object));
}
function isUserObject(e) {
  if (!e || "Object" !== toStringTag(e)) return !1;
  var t = n(e);
  return !t || hasConstructorOf(e, Object) || isUserObject(t);
}
function isObject(e) {
  return e && "object" === _typeof(e);
}
function escapeKeyPathComponent(e) {
  return e.replace(/''/g, "''''").replace(/^$/, "''").replace(/~/g, "~0").replace(/\./g, "~1");
}
function unescapeKeyPathComponent(e) {
  return e.replace(/~1/g, ".").replace(/~0/g, "~").replace(/^''$/, "").replace(/''''/g, "''");
}
function getByKeyPath(e, t) {
  if ("" === t) return e;
  var r = t.indexOf(".");
  if (r > -1) {
    var n = e[unescapeKeyPathComponent(t.slice(0, r))];
    return void 0 === n ? void 0 : getByKeyPath(n, t.slice(r + 1));
  }
  return e[unescapeKeyPathComponent(t)];
}
function setAtKeyPath(e, t, r) {
  if ("" === t) return r;
  var n = t.indexOf(".");
  return n > -1 ? setAtKeyPath(e[unescapeKeyPathComponent(t.slice(0, n))], t.slice(n + 1), r) : (e[unescapeKeyPathComponent(t)] = r, e);
}
function getJSONType(e) {
  return null === e ? "null" : Array.isArray(e) ? "array" : _typeof(e);
}
function _await(e, t, r) {
  return r ? t ? t(e) : e : (e && e.then || (e = Promise.resolve(e)), t ? e.then(t) : e);
}
var o = Object.keys,
  i = Array.isArray,
  c = {}.hasOwnProperty,
  s = ["type", "replaced", "iterateIn", "iterateUnsetNumeric"];
function _async(e) {
  return function () {
    for (var t = [], r = 0; r < arguments.length; r++) t[r] = arguments[r];
    try {
      return Promise.resolve(e.apply(this, t));
    } catch (e) {
      return Promise.reject(e);
    }
  };
}
function nestedPathsFirst(e, t) {
  if ("" === e.keypath) return -1;
  var r = e.keypath.match(/\./g) || 0,
    n = t.keypath.match(/\./g) || 0;
  return r && (r = r.length), n && (n = n.length), r > n ? -1 : r < n ? 1 : e.keypath < t.keypath ? -1 : e.keypath > t.keypath;
}
var u = function () {
    function Typeson(e) {
      _classCallCheck(this, Typeson), this.options = e, this.plainObjectReplacers = [], this.nonplainObjectReplacers = [], this.revivers = {}, this.types = {};
    }
    return _createClass(Typeson, [{
      key: "stringify",
      value: function stringify(e, t, r, n) {
        n = _objectSpread2(_objectSpread2(_objectSpread2({}, this.options), n), {}, {
          stringification: !0
        });
        var a = this.encapsulate(e, null, n);
        return i(a) ? JSON.stringify(a[0], t, r) : a.then(function (e) {
          return JSON.stringify(e, t, r);
        });
      }
    }, {
      key: "stringifySync",
      value: function stringifySync(e, t, r, n) {
        return this.stringify(e, t, r, _objectSpread2(_objectSpread2({
          throwOnBadSyncType: !0
        }, n), {}, {
          sync: !0
        }));
      }
    }, {
      key: "stringifyAsync",
      value: function stringifyAsync(e, t, r, n) {
        return this.stringify(e, t, r, _objectSpread2(_objectSpread2({
          throwOnBadSyncType: !0
        }, n), {}, {
          sync: !1
        }));
      }
    }, {
      key: "parse",
      value: function parse(e, t, r) {
        return r = _objectSpread2(_objectSpread2(_objectSpread2({}, this.options), r), {}, {
          parse: !0
        }), this.revive(JSON.parse(e, t), r);
      }
    }, {
      key: "parseSync",
      value: function parseSync(e, t, r) {
        return this.parse(e, t, _objectSpread2(_objectSpread2({
          throwOnBadSyncType: !0
        }, r), {}, {
          sync: !0
        }));
      }
    }, {
      key: "parseAsync",
      value: function parseAsync(e, t, r) {
        return this.parse(e, t, _objectSpread2(_objectSpread2({
          throwOnBadSyncType: !0
        }, r), {}, {
          sync: !1
        }));
      }
    }, {
      key: "specialTypeNames",
      value: function specialTypeNames(e, t) {
        var r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
        return r.returnTypeNames = !0, this.encapsulate(e, t, r);
      }
    }, {
      key: "rootTypeName",
      value: function rootTypeName(e, t) {
        var r = arguments.length > 2 && void 0 !== arguments[2] ? arguments[2] : {};
        return r.iterateNone = !0, this.encapsulate(e, t, r);
      }
    }, {
      key: "encapsulate",
      value: function encapsulate(t, r, n) {
        var a = _async(function (t, r) {
            return _await(Promise.all(r.map(function (e) {
              return e[1].p;
            })), function (n) {
              return _await(Promise.all(n.map(_async(function (n) {
                var o = !1,
                  i = [],
                  c = _slicedToArray(r.splice(0, 1), 1),
                  s = _slicedToArray(c[0], 7),
                  u = s[0],
                  l = s[2],
                  f = s[3],
                  y = s[4],
                  p = s[5],
                  d = s[6],
                  v = _encapsulate(u, n, l, f, i, !0, d),
                  b = hasConstructorOf(v, e);
                return function _invoke(e, t) {
                  var r = e();
                  return r && r.then ? r.then(t) : t(r);
                }(function () {
                  if (u && b) return _await(v.p, function (e) {
                    y[p] = e;
                    var r = a(t, i);
                    return o = !0, r;
                  });
                }, function (e) {
                  return o ? e : (u ? y[p] = v : t = b ? v.p : v, a(t, i));
                });
              }))), function () {
                return t;
              });
            });
          }),
          u = (n = _objectSpread2(_objectSpread2({
            sync: !0
          }, this.options), n)).sync,
          l = this,
          f = {},
          y = [],
          p = [],
          d = [],
          v = !("cyclic" in n) || n.cyclic,
          b = n.encapsulateObserver,
          h = _encapsulate("", t, v, r || {}, d);
        function finish(e) {
          var t = Object.values(f);
          if (n.iterateNone) return t.length ? t[0] : getJSONType(e);
          if (t.length) {
            if (n.returnTypeNames) return function _toConsumableArray(e) {
              return function _arrayWithoutHoles(e) {
                if (Array.isArray(e)) return _arrayLikeToArray(e);
              }(e) || function _iterableToArray(e) {
                if ("undefined" != typeof Symbol && null != e[Symbol.iterator] || null != e["@@iterator"]) return Array.from(e);
              }(e) || _unsupportedIterableToArray(e) || function _nonIterableSpread() {
                throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
              }();
            }(new Set(t));
            e && isPlainObject(e) && !c.call(e, "$types") ? e.$types = f : e = {
              $: e,
              $types: {
                $: f
              }
            };
          } else isObject(e) && c.call(e, "$types") && (e = {
            $: e,
            $types: !0
          });
          return !n.returnTypeNames && e;
        }
        function _adaptBuiltinStateObjectProperties(e, t, r) {
          Object.assign(e, t);
          var n = s.map(function (t) {
            var r = e[t];
            return delete e[t], r;
          });
          r(), s.forEach(function (t, r) {
            e[t] = n[r];
          });
        }
        function _encapsulate(t, r, a, s, u, d, v) {
          var h,
            g = {},
            m = _typeof(r),
            O = b ? function (n) {
              var o = v || s.type || getJSONType(r);
              b(Object.assign(n || g, {
                keypath: t,
                value: r,
                cyclic: a,
                stateObj: s,
                promisesData: u,
                resolvingTypesonPromise: d,
                awaitingTypesonPromise: hasConstructorOf(r, e)
              }, {
                type: o
              }));
            } : null;
          if (["string", "boolean", "number", "undefined"].includes(m)) return void 0 === r || Number.isNaN(r) || r === Number.NEGATIVE_INFINITY || r === Number.POSITIVE_INFINITY ? (h = s.replaced ? r : replace(t, r, s, u, !1, d, O)) !== r && (g = {
            replaced: h
          }) : h = r, O && O(), h;
          if (null === r) return O && O(), r;
          if (a && !s.iterateIn && !s.iterateUnsetNumeric && r && "object" === _typeof(r)) {
            var S = y.indexOf(r);
            if (!(S < 0)) return f[t] = "#", O && O({
              cyclicKeypath: p[S]
            }), "#" + p[S];
            !0 === a && (y.push(r), p.push(t));
          }
          var _,
            w = isPlainObject(r),
            A = i(r),
            j = (w || A) && (!l.plainObjectReplacers.length || s.replaced) || s.iterateIn ? r : replace(t, r, s, u, w || A, null, O);
          if (j !== r ? (h = j, g = {
            replaced: j
          }) : "" === t && hasConstructorOf(r, e) ? (u.push([t, r, a, s, void 0, void 0, s.type]), h = r) : A && "object" !== s.iterateIn || "array" === s.iterateIn ? (_ = new Array(r.length), g = {
            clone: _
          }) : (["function", "symbol"].includes(_typeof(r)) || "toJSON" in r || hasConstructorOf(r, e) || hasConstructorOf(r, Promise) || hasConstructorOf(r, ArrayBuffer)) && !w && "object" !== s.iterateIn ? h = r : (_ = {}, s.addLength && (_.length = r.length), g = {
            clone: _
          }), O && O(), n.iterateNone) return _ || h;
          if (!_) return h;
          if (s.iterateIn) {
            var T = function _loop(n) {
              var o = {
                ownKeys: c.call(r, n)
              };
              _adaptBuiltinStateObjectProperties(s, o, function () {
                var o = t + (t ? "." : "") + escapeKeyPathComponent(n),
                  i = _encapsulate(o, r[n], Boolean(a), s, u, d);
                hasConstructorOf(i, e) ? u.push([o, i, Boolean(a), s, _, n, s.type]) : void 0 !== i && (_[n] = i);
              });
            };
            for (var I in r) T(I);
            O && O({
              endIterateIn: !0,
              end: !0
            });
          } else o(r).forEach(function (n) {
            var o = t + (t ? "." : "") + escapeKeyPathComponent(n);
            _adaptBuiltinStateObjectProperties(s, {
              ownKeys: !0
            }, function () {
              var t = _encapsulate(o, r[n], Boolean(a), s, u, d);
              hasConstructorOf(t, e) ? u.push([o, t, Boolean(a), s, _, n, s.type]) : void 0 !== t && (_[n] = t);
            });
          }), O && O({
            endIterateOwn: !0,
            end: !0
          });
          if (s.iterateUnsetNumeric) {
            for (var P = r.length, N = function _loop2(n) {
                if (!(n in r)) {
                  var o = t + (t ? "." : "") + n;
                  _adaptBuiltinStateObjectProperties(s, {
                    ownKeys: !1
                  }, function () {
                    var t = _encapsulate(o, void 0, Boolean(a), s, u, d);
                    hasConstructorOf(t, e) ? u.push([o, t, Boolean(a), s, _, n, s.type]) : void 0 !== t && (_[n] = t);
                  });
                }
              }, C = 0; C < P; C++) N(C);
            O && O({
              endIterateUnsetNumeric: !0,
              end: !0
            });
          }
          return _;
        }
        function replace(e, t, r, n, a, o, i) {
          for (var c = a ? l.plainObjectReplacers : l.nonplainObjectReplacers, s = c.length; s--;) {
            var y = c[s];
            if (y.test(t, r)) {
              var p = y.type;
              if (l.revivers[p]) {
                var d = f[e];
                f[e] = d ? [p].concat(d) : p;
              }
              return Object.assign(r, {
                type: p,
                replaced: !0
              }), !u && y.replaceAsync || y.replace ? (i && i({
                replacing: !0
              }), _encapsulate(e, y[u || !y.replaceAsync ? "replace" : "replaceAsync"](t, r), v && "readonly", r, n, o, p)) : (i && i({
                typeDetected: !0
              }), _encapsulate(e, t, v && "readonly", r, n, o, p));
            }
          }
          return t;
        }
        return d.length ? u && n.throwOnBadSyncType ? function () {
          throw new TypeError("Sync method requested but async result obtained");
        }() : Promise.resolve(a(h, d)).then(finish) : !u && n.throwOnBadSyncType ? function () {
          throw new TypeError("Async method requested but sync result obtained");
        }() : n.stringification && u ? [finish(h)] : u ? finish(h) : Promise.resolve(finish(h));
      }
    }, {
      key: "encapsulateSync",
      value: function encapsulateSync(e, t, r) {
        return this.encapsulate(e, t, _objectSpread2(_objectSpread2({
          throwOnBadSyncType: !0
        }, r), {}, {
          sync: !0
        }));
      }
    }, {
      key: "encapsulateAsync",
      value: function encapsulateAsync(e, t, r) {
        return this.encapsulate(e, t, _objectSpread2(_objectSpread2({
          throwOnBadSyncType: !0
        }, r), {}, {
          sync: !1
        }));
      }
    }, {
      key: "revive",
      value: function revive(t, r) {
        var n = t && t.$types;
        if (!n) return t;
        if (!0 === n) return t.$;
        var a = (r = _objectSpread2(_objectSpread2({
            sync: !0
          }, this.options), r)).sync,
          c = [],
          s = {},
          u = !0;
        n.$ && isPlainObject(n.$) && (t = t.$, n = n.$, u = !1);
        var f = this;
        function executeReviver(e, t) {
          var r = _slicedToArray(f.revivers[e] || [], 1)[0];
          if (!r) throw new Error("Unregistered type: " + e);
          return a && !("revive" in r) ? t : r[a && r.revive ? "revive" : !a && r.reviveAsync ? "reviveAsync" : "revive"](t, s);
        }
        var y = [];
        function checkUndefined(e) {
          return hasConstructorOf(e, l) ? void 0 : e;
        }
        var p,
          d = function revivePlainObjects() {
            var r = [];
            if (Object.entries(n).forEach(function (e) {
              var t = _slicedToArray(e, 2),
                a = t[0],
                o = t[1];
              "#" !== o && [].concat(o).forEach(function (e) {
                _slicedToArray(f.revivers[e] || [null, {}], 2)[1].plain && (r.push({
                  keypath: a,
                  type: e
                }), delete n[a]);
              });
            }), r.length) return r.sort(nestedPathsFirst).reduce(function reducer(r, n) {
              var a = n.keypath,
                o = n.type;
              if (isThenable(r)) return r.then(function (e) {
                return reducer(e, {
                  keypath: a,
                  type: o
                });
              });
              var i = getByKeyPath(t, a);
              if (hasConstructorOf(i = executeReviver(o, i), e)) return i.then(function (e) {
                var r = setAtKeyPath(t, a, e);
                r === e && (t = r);
              });
              var c = setAtKeyPath(t, a, i);
              c === i && (t = c);
            }, void 0);
          }();
        return hasConstructorOf(d, e) ? p = d.then(function () {
          return t;
        }) : (p = function _revive(t, r, a, s, f) {
          if (!u || "$types" !== t) {
            var p = n[t],
              d = i(r);
            if (d || isPlainObject(r)) {
              var v = d ? new Array(r.length) : {};
              for (o(r).forEach(function (n) {
                var o = _revive(t + (t ? "." : "") + escapeKeyPathComponent(n), r[n], a || v, v, n),
                  i = function set(e) {
                    return hasConstructorOf(e, l) ? v[n] = void 0 : void 0 !== e && (v[n] = e), e;
                  };
                hasConstructorOf(o, e) ? y.push(o.then(function (e) {
                  return i(e);
                })) : i(o);
              }), r = v; c.length;) {
                var b = _slicedToArray(c[0], 4),
                  h = b[0],
                  g = b[1],
                  m = b[2],
                  O = b[3],
                  S = getByKeyPath(h, g);
                if (void 0 === S) break;
                m[O] = S, c.splice(0, 1);
              }
            }
            if (!p) return r;
            if ("#" === p) {
              var _ = getByKeyPath(a, r.slice(1));
              return void 0 === _ && c.push([a, r.slice(1), s, f]), _;
            }
            return [].concat(p).reduce(function reducer(t, r) {
              return hasConstructorOf(t, e) ? t.then(function (e) {
                return reducer(e, r);
              }) : executeReviver(r, t);
            }, r);
          }
        }("", t, null), y.length && (p = e.resolve(p).then(function (t) {
          return e.all([t].concat(y));
        }).then(function (e) {
          return _slicedToArray(e, 1)[0];
        }))), isThenable(p) ? a && r.throwOnBadSyncType ? function () {
          throw new TypeError("Sync method requested but async result obtained");
        }() : hasConstructorOf(p, e) ? p.p.then(checkUndefined) : p : !a && r.throwOnBadSyncType ? function () {
          throw new TypeError("Async method requested but sync result obtained");
        }() : a ? checkUndefined(p) : Promise.resolve(checkUndefined(p));
      }
    }, {
      key: "reviveSync",
      value: function reviveSync(e, t) {
        return this.revive(e, _objectSpread2(_objectSpread2({
          throwOnBadSyncType: !0
        }, t), {}, {
          sync: !0
        }));
      }
    }, {
      key: "reviveAsync",
      value: function reviveAsync(e, t) {
        return this.revive(e, _objectSpread2(_objectSpread2({
          throwOnBadSyncType: !0
        }, t), {}, {
          sync: !1
        }));
      }
    }, {
      key: "register",
      value: function register(e, t) {
        var r = this;
        t = t || {};
        var n = function R(e) {
          i(e) ? e.forEach(function (e) {
            return R(e);
          }) : e && o(e).forEach(function (n) {
            if ("#" === n) throw new TypeError("# cannot be used as a type name as it is reserved for cyclic objects");
            if (f.includes(n)) throw new TypeError("Plain JSON object types are reserved as type names");
            var a = e[n],
              o = a && a.testPlainObjects ? r.plainObjectReplacers : r.nonplainObjectReplacers,
              c = o.filter(function (e) {
                return e.type === n;
              });
            if (c.length && (o.splice(o.indexOf(c[0]), 1), delete r.revivers[n], delete r.types[n]), "function" == typeof a) {
              var s = a;
              a = {
                test: function test(e) {
                  return e && e.constructor === s;
                },
                replace: function replace(e) {
                  return _objectSpread2({}, e);
                },
                revive: function revive(e) {
                  return Object.assign(Object.create(s.prototype), e);
                }
              };
            } else if (i(a)) {
              var u = _slicedToArray(a, 3);
              a = {
                test: u[0],
                replace: u[1],
                revive: u[2]
              };
            }
            if (a && a.test) {
              var l = {
                type: n,
                test: a.test.bind(a)
              };
              a.replace && (l.replace = a.replace.bind(a)), a.replaceAsync && (l.replaceAsync = a.replaceAsync.bind(a));
              var y = "number" == typeof t.fallback ? t.fallback : t.fallback ? 0 : Number.POSITIVE_INFINITY;
              if (a.testPlainObjects ? r.plainObjectReplacers.splice(y, 0, l) : r.nonplainObjectReplacers.splice(y, 0, l), a.revive || a.reviveAsync) {
                var p = {};
                a.revive && (p.revive = a.revive.bind(a)), a.reviveAsync && (p.reviveAsync = a.reviveAsync.bind(a)), r.revivers[n] = [p, {
                  plain: a.testPlainObjects
                }];
              }
              r.types[n] = a;
            }
          });
        };
        return [].concat(e).forEach(function (e) {
          return n(e);
        }), this;
      }
    }]), Typeson;
  }(),
  l = _createClass(function Undefined() {
    _classCallCheck(this, Undefined);
  });
l.__typeson__type__ = "TypesonUndefined";
for (var f = ["null", "boolean", "number", "string", "array", "object"], y = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", p = new Uint8Array(256), d = 0; d < y.length; d++) p[y.codePointAt(d)] = d;
var v = function encode(e, t, r) {
    null == r && (r = e.byteLength);
    for (var n = new Uint8Array(e, t || 0, r), a = n.length, o = "", i = 0; i < a; i += 3) o += y[n[i] >> 2], o += y[(3 & n[i]) << 4 | n[i + 1] >> 4], o += y[(15 & n[i + 1]) << 2 | n[i + 2] >> 6], o += y[63 & n[i + 2]];
    return a % 3 == 2 ? o = o.slice(0, -1) + "=" : a % 3 == 1 && (o = o.slice(0, -2) + "=="), o;
  },
  b = function decode(e) {
    var t,
      r,
      n,
      a,
      o = e.length,
      i = .75 * e.length,
      c = 0;
    "=" === e[e.length - 1] && (i--, "=" === e[e.length - 2] && i--);
    for (var s = new ArrayBuffer(i), u = new Uint8Array(s), l = 0; l < o; l += 4) t = p[e.codePointAt(l)], r = p[e.codePointAt(l + 1)], n = p[e.codePointAt(l + 2)], a = p[e.codePointAt(l + 3)], u[c++] = t << 2 | r >> 4, u[c++] = (15 & r) << 4 | n >> 2, u[c++] = (3 & n) << 6 | 63 & a;
    return s;
  };
const h = {
    arraybuffer: {
      test: e => "ArrayBuffer" === toStringTag(e),
      replace(e, t) {
        t.buffers || (t.buffers = []);
        const r = t.buffers.indexOf(e);
        return r > -1 ? {
          index: r
        } : (t.buffers.push(e), v(e));
      },
      revive(e, t) {
        if (t.buffers || (t.buffers = []), "object" == typeof e) return t.buffers[e.index];
        const r = b(e);
        return t.buffers.push(r), r;
      }
    }
  },
  g = {
    bigintObject: {
      test: e => "object" == typeof e && hasConstructorOf(e, BigInt),
      replace: String,
      revive: e => new Object(BigInt(e))
    }
  },
  m = {
    bigint: {
      test: e => "bigint" == typeof e,
      replace: String,
      revive: BigInt
    }
  };
function string2arraybuffer(e) {
  const t = new Uint8Array(e.length);
  for (let r = 0; r < e.length; r++) t[r] = e.charCodeAt(r);
  return t.buffer;
}
const O = {
  blob: {
    test: e => "Blob" === toStringTag(e),
    replace(e) {
      const t = new XMLHttpRequest();
      if (t.overrideMimeType("text/plain; charset=x-user-defined"), t.open("GET", URL.createObjectURL(e), !1), t.send(), 200 !== t.status && 0 !== t.status) throw new Error("Bad Blob access: " + t.status);
      return {
        type: e.type,
        stringContents: t.responseText
      };
    },
    revive: ({
      type: e,
      stringContents: t
    }) => new Blob([string2arraybuffer(t)], {
      type: e
    }),
    replaceAsync: t => new e((e, r) => {
      const n = new FileReader();
      n.addEventListener("load", () => {
        e({
          type: t.type,
          stringContents: n.result
        });
      }), n.addEventListener("error", () => {
        r(n.error);
      }), n.readAsBinaryString(t);
    })
  }
};
const w = {
    cryptokey: {
      test: e => "CryptoKey" === toStringTag(e) && e.extractable,
      replaceAsync: t => new e( /*#__PURE__*/function () {
        var _ref = _asyncToGenerator(function* (e, r) {
          let n;
          try {
            n = yield crypto.subtle.exportKey("jwk", t);
          } catch (e) {
            return void r(e);
          }
          e({
            jwk: n,
            algorithm: t.algorithm,
            usages: t.usages
          });
        });
        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      }()),
      revive: ({
        jwk: e,
        algorithm: t,
        usages: r
      }) => crypto.subtle.importKey("jwk", e, t, !0, r)
    }
  },
  A = {
    dataview: {
      test: e => "DataView" === toStringTag(e),
      replace({
        buffer: e,
        byteOffset: t,
        byteLength: r
      }, n) {
        n.buffers || (n.buffers = []);
        const a = n.buffers.indexOf(e);
        return a > -1 ? {
          index: a,
          byteOffset: t,
          byteLength: r
        } : (n.buffers.push(e), {
          encoded: v(e),
          byteOffset: t,
          byteLength: r
        });
      },
      revive(e, t) {
        t.buffers || (t.buffers = []);
        const {
          byteOffset: r,
          byteLength: n,
          encoded: a,
          index: o
        } = e;
        let i;
        return "index" in e ? i = t.buffers[o] : (i = b(a), t.buffers.push(i)), new DataView(i, r, n);
      }
    }
  },
  j = {
    date: {
      test: e => "Date" === toStringTag(e),
      replace(e) {
        const t = e.getTime();
        return Number.isNaN(t) ? "NaN" : t;
      },
      revive: e => "NaN" === e ? new Date(Number.NaN) : new Date(e)
    }
  },
  I = {};
function create$2(e) {
  I[e.name.toLowerCase()] = {
    test: t => hasConstructorOf(t, e),
    replace: e => e.message,
    revive: t => new e(t)
  };
}
[TypeError, RangeError, SyntaxError, ReferenceError, EvalError, URIError].forEach(e => create$2(e)), "function" == typeof InternalError && create$2(InternalError);
const P = {
    file: {
      test: e => "File" === toStringTag(e),
      replace(e) {
        const t = new XMLHttpRequest();
        if (t.overrideMimeType("text/plain; charset=x-user-defined"), t.open("GET", URL.createObjectURL(e), !1), t.send(), 200 !== t.status && 0 !== t.status) throw new Error("Bad File access: " + t.status);
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
      replaceAsync: t => new e(function (e, r) {
        const n = new FileReader();
        n.addEventListener("load", function () {
          e({
            type: t.type,
            stringContents: n.result,
            name: t.name,
            lastModified: t.lastModified
          });
        }), n.addEventListener("error", function () {
          r(n.error);
        }), n.readAsBinaryString(t);
      })
    }
  },
  N = {
    file: P.file,
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
  C = {
    imagebitmap: {
      test: e => "ImageBitmap" === toStringTag(e) || e && e.dataset && "ImageBitmap" === e.dataset.toStringTag,
      replace(e) {
        const t = document.createElement("canvas");
        return t.getContext("2d").drawImage(e, 0, 0), t.toDataURL();
      },
      revive(e) {
        const t = document.createElement("canvas"),
          r = t.getContext("2d"),
          n = document.createElement("img");
        return n.addEventListener("load", function () {
          r.drawImage(n, 0, 0);
        }), n.src = e, t;
      },
      reviveAsync(e) {
        const t = document.createElement("canvas"),
          r = t.getContext("2d"),
          n = document.createElement("img");
        return n.addEventListener("load", function () {
          r.drawImage(n, 0, 0);
        }), n.src = e, createImageBitmap(t);
      }
    }
  },
  E = {
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
  x = {
    infinity: {
      test: e => e === Number.POSITIVE_INFINITY,
      replace: e => "Infinity",
      revive: e => Number.POSITIVE_INFINITY
    }
  },
  k = {
    test: e => hasConstructorOf(e, Intl.Collator),
    replace: e => e.resolvedOptions(),
    revive: e => new Intl.Collator(e.locale, e)
  },
  B = {
    IntlCollator: k,
    IntlDateTimeFormat: {
      test: e => hasConstructorOf(e, Intl.DateTimeFormat),
      replace: e => e.resolvedOptions(),
      revive: e => new Intl.DateTimeFormat(e.locale, e)
    },
    IntlNumberFormat: {
      test: e => hasConstructorOf(e, Intl.NumberFormat),
      replace: e => e.resolvedOptions(),
      revive: e => new Intl.NumberFormat(e.locale, e)
    }
  },
  U = {
    map: {
      test: e => "Map" === toStringTag(e),
      replace: e => [...e.entries()],
      revive: e => new Map(e)
    }
  },
  K = {
    nan: {
      test: e => Number.isNaN(e),
      replace: e => "NaN",
      revive: e => Number.NaN
    }
  },
  L = {
    negativeInfinity: {
      test: e => e === Number.NEGATIVE_INFINITY,
      replace: e => "-Infinity",
      revive: e => Number.NEGATIVE_INFINITY
    }
  },
  D = {
    StringObject: {
      test: e => "String" === toStringTag(e) && "object" == typeof e,
      replace: String,
      revive: e => new String(e)
    },
    BooleanObject: {
      test: e => "Boolean" === toStringTag(e) && "object" == typeof e,
      replace: Boolean,
      revive: e => new Boolean(e)
    },
    NumberObject: {
      test: e => "Number" === toStringTag(e) && "object" == typeof e,
      replace: Number,
      revive: e => new Number(e)
    }
  },
  M = {
    regexp: {
      test: e => "RegExp" === toStringTag(e),
      replace: e => ({
        source: e.source,
        flags: (e.global ? "g" : "") + (e.ignoreCase ? "i" : "") + (e.multiline ? "m" : "") + (e.sticky ? "y" : "") + (e.unicode ? "u" : "")
      }),
      revive: ({
        source: e,
        flags: t
      }) => new RegExp(e, t)
    }
  },
  J = {
    set: {
      test: e => "Set" === toStringTag(e),
      replace: e => [...e.values()],
      revive: e => new Set(e)
    }
  },
  Y = {};
"function" == typeof Int8Array && [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array].forEach(e => function create$1(e) {
  const t = e.name;
  Y[t.toLowerCase()] = {
    test: e => toStringTag(e) === t,
    replace: e => (0 === e.byteOffset && e.byteLength === e.buffer.byteLength ? e : e.slice(0)).buffer,
    revive: t => "ArrayBuffer" === toStringTag(t) ? new e(t) : t
  };
}(e));
const q = {};
"function" == typeof Int8Array && [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array].forEach(e => function create(e) {
  const t = e.name;
  q[t.toLowerCase()] = {
    test: e => toStringTag(e) === t,
    replace({
      buffer: e,
      byteOffset: t,
      length: r
    }, n) {
      n.buffers || (n.buffers = []);
      const a = n.buffers.indexOf(e);
      return a > -1 ? {
        index: a,
        byteOffset: t,
        length: r
      } : (n.buffers.push(e), {
        encoded: v(e),
        byteOffset: t,
        length: r
      });
    },
    revive(t, r) {
      r.buffers || (r.buffers = []);
      const {
        byteOffset: n,
        length: a,
        encoded: o,
        index: i
      } = t;
      let c;
      return "index" in t ? c = r.buffers[i] : (c = b(o), r.buffers.push(c)), new e(c, n, a);
    }
  };
}(e));
const W = {
    undef: {
      test: (e, t) => void 0 === e && (t.ownKeys || !("ownKeys" in t)),
      replace: e => 0,
      revive: e => new l()
    }
  },
  G = {
    userObject: {
      test: (e, t) => isUserObject(e),
      replace: e => _objectSpread2$1({}, e),
      revive: e => e
    }
  },
  H = [{
    arrayNonindexKeys: {
      testPlainObjects: !0,
      test: (e, t) => !!Array.isArray(e) && (Object.keys(e).some(e => String(Number.parseInt(e)) !== e) && (t.iterateIn = "object", t.addLength = !0), !0),
      replace: (e, t) => (t.iterateUnsetNumeric = !0, e),
      revive(e) {
        if (Array.isArray(e)) return e;
        const t = [];
        return Object.keys(e).forEach(r => {
          const n = e[r];
          t[r] = n;
        }), t;
      }
    }
  }, {
    sparseUndefined: {
      test: (e, t) => void 0 === e && !1 === t.ownKeys,
      replace: e => 0,
      revive(e) {}
    }
  }],
  X = [K, x, L],
  te = [G, W, H, D, X, j, M, E, C, P, N, O].concat("function" == typeof Map ? U : [], "function" == typeof Set ? J : [], "function" == typeof ArrayBuffer ? h : [], "function" == typeof Uint8Array ? q : [], "function" == typeof DataView ? A : [], "undefined" != typeof Intl ? B : [], "undefined" != typeof crypto ? w : [], "undefined" != typeof BigInt ? [m, g] : []);
var re = te.concat({
  checkDataCloneException: {
    test(e) {
      const t = {}.toString.call(e).slice(8, -1);
      if (["symbol", "function"].includes(typeof e) || ["Arguments", "Module", "Error", "Promise", "WeakMap", "WeakSet", "Event", "MessageChannel"].includes(t) || e && "object" == typeof e && "number" == typeof e.nodeType && "function" == typeof e.insertBefore) throw new DOMException("The object cannot be cloned.", "DataCloneError");
      return !1;
    }
  }
});

// See: http://stackoverflow.com/questions/42170826/categories-for-rejection-by-the-structured-cloning-algorithm

let typeson = new u().register(re);
function register(func) {
  typeson = new u().register(func(re));
}

// We are keeping the callback approach for now in case we wish to reexpose
//   `Blob`, `File`, `FileList` asynchronously (though in such a case, we
//   should probably refactor as a Promise)
function encode(obj, func) {
  let ret;
  try {
    // eslint-disable-next-line n/no-sync
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
  if (func) func(ret);
  return ret;
}
function decode(obj) {
  return typeson.parse(obj);
}
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

/* eslint-disable jsdoc/check-param-names */
/**
 * IDB Index.
 * @see http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
 * @param {IDBObjectStore} store
 * @param {IDBIndexProperties} indexProperties
 * @class
 */
function IDBIndex() {
  /* eslint-enable jsdoc/check-param-names */
  throw new TypeError('Illegal constructor');
}
const IDBIndexAlias = IDBIndex;
IDBIndex.__createInstance = function (store, indexProperties) {
  function IDBIndex() {
    const me = this;
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
    Object.defineProperty(me, '__currentName', {
      get() {
        return '__pendingName' in me ? me.__pendingName : me.name;
      }
    });
    Object.defineProperty(me, 'name', {
      enumerable: false,
      configurable: false,
      get() {
        return this.__name;
      },
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
        if (me.objectStore.__indexes[newName] && !me.objectStore.__indexes[newName].__deleted && !me.objectStore.__indexes[newName].__pendingDelete) {
          throw createDOMException('ConstraintError', 'Index "' + newName + '" already exists on ' + me.objectStore.__currentName);
        }
        me.__name = newName;
        const {
          objectStore
        } = me;
        delete objectStore.__indexes[oldName];
        objectStore.__indexes[newName] = me;
        objectStore.indexNames.splice(objectStore.indexNames.indexOf(oldName), 1, newName);
        const storeHandle = objectStore.transaction.__storeHandles[objectStore.name];
        const oldIndexHandle = storeHandle.__indexHandles[oldName];
        oldIndexHandle.__name = newName; // Fix old references
        storeHandle.__indexHandles[newName] = oldIndexHandle; // Ensure new reference accessible
        me.__pendingName = oldName;
        const colInfoToPreserveArr = [['key', 'BLOB ' + (objectStore.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY')], ['value', 'BLOB']].concat([...objectStore.indexNames].filter(indexName => indexName !== newName).map(indexName => [escapeIndexNameForSQL(indexName), 'BLOB']));
        me.__renameIndex(objectStore, oldName, newName, colInfoToPreserveArr, function (tx, success) {
          IDBIndexAlias.__updateIndexList(store, tx, function (store) {
            delete storeHandle.__pendingName;
            success(store);
          });
        });
      }
    });
  }
  IDBIndex.prototype = IDBIndexAlias.prototype;
  return new IDBIndex();
};
IDBIndex.__invalidStateIfDeleted = function (index, msg) {
  if (index.__deleted || index.__pendingDelete || index.__pendingCreate && index.objectStore.transaction && index.objectStore.transaction.__errored) {
    throw createDOMException('InvalidStateError', msg || 'This index has been deleted');
  }
};

/**
 * Clones an IDBIndex instance for a different IDBObjectStore instance.
 * @param {IDBIndex} index
 * @param {IDBObjectStore} store
 * @protected
 * @returns {IDBIndex}
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
  ['__pendingCreate', '__pendingDelete', '__deleted', '__originalName', '__recreated'].forEach(p => {
    idx[p] = index[p];
  });
  return idx;
};

/**
 * Creates a new index on an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @returns {void}
 * @protected
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
  transaction.__addNonRequestToTransactionQueue(function createIndex(tx, args, success, failure) {
    const columnExists = idx && (idx.__deleted || idx.__recreated); // This check must occur here rather than earlier as properties may not have been set yet otherwise
    let indexValues = {};
    function error(tx, err) {
      failure(createDOMException('UnknownError', 'Could not create index "' + indexName + '"' + err.code + '::' + err.message, err));
    }
    function applyIndex(tx) {
      // Update the object store's index list
      IDBIndex.__updateIndexList(store, tx, function () {
        // Add index entries for all existing records
        tx.executeSql('SELECT "key", "value" FROM ' + escapeStoreNameForSQL(storeName), [], function (tx, data) {
          CFG.DEBUG && console.log('Adding existing ' + storeName + ' records to the ' + indexName + ' index');
          addIndexEntry(0);
          function addIndexEntry(i) {
            if (i < data.rows.length) {
              try {
                const value = decode(unescapeSQLiteResponse(data.rows.item(i).value));
                let indexKey = extractKeyValueDecodedFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Todo: Do we need this stricter error checking?
                if (indexKey.invalid || indexKey.failure) {
                  // Todo: Do we need invalid checks and should we instead treat these as being duplicates?
                  throw new Error('Go to catch; ignore bad indexKey');
                }
                indexKey = encode$1(indexKey.value, index.multiEntry);
                if (index.unique) {
                  if (indexValues[indexKey]) {
                    indexValues = {};
                    failure(createDOMException('ConstraintError', 'Duplicate values already exist within the store'));
                    return;
                  }
                  indexValues[indexKey] = true;
                }
                tx.executeSql('UPDATE ' + escapeStoreNameForSQL(storeName) + ' SET ' + escapeIndexNameForSQL(indexName) + ' = ? WHERE "key" = ?', [escapeSQLiteStatement(indexKey), data.rows.item(i).key], function (tx, data) {
                  addIndexEntry(i + 1);
                }, error);
              } catch (e) {
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
        }, error);
      }, error);
    }
    const escapedStoreNameSQL = escapeStoreNameForSQL(storeName);
    const escapedIndexNameSQL = escapeIndexNameForSQL(index.name);
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
      escapedStoreNameSQL.slice(1, -1) + '^5' + escapedIndexNameSQL.slice(1, -1) + '" ON ' + escapedStoreNameSQL + '(' + escapedIndexNameSQL + ')', [], applyIndex, error);
    }
    if (columnExists) {
      // For a previously existing index, just update the index entries in the existing column;
      //   no need to add SQLite index to it either as should already exist
      applyIndex(tx);
    } else {
      // For a new index, add a new column to the object store, then apply the index
      const sql = ['ALTER TABLE', escapedStoreNameSQL, 'ADD', escapedIndexNameSQL, 'BLOB'].join(' ');
      CFG.DEBUG && console.log(sql);
      tx.executeSql(sql, [], addIndexSQL, error);
    }
  }, undefined, store);
};

/**
 * Deletes an index from an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @protected
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
  transaction.__addNonRequestToTransactionQueue(function deleteIndex(tx, args, success, failure) {
    function error(tx, err) {
      failure(createDOMException('UnknownError', 'Could not delete index "' + index.name + '"', err));
    }
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
      }, error);
    }
    if (!CFG.useSQLiteIndexes) {
      finishDeleteIndex();
      return;
    }
    tx.executeSql('DROP INDEX IF EXISTS ' + sqlQuote(escapeStoreNameForSQL(store.name).slice(1, -1) + '^5' + escapeIndexNameForSQL(index.name).slice(1, -1)), [], finishDeleteIndex, error);
  }, undefined, store);
};

/**
 * Updates index list for the given object store.
 * @param {IDBObjectStore} store
 * @param {object} tx
 * @param {function} success
 * @param {function} failure
 * @returns {void}
 */
IDBIndex.__updateIndexList = function (store, tx, success, failure) {
  const indexList = {};
  for (let i = 0; i < store.indexNames.length; i++) {
    const idx = store.__indexes[store.indexNames[i]];
    /** @type {IDBIndexProperties} **/
    indexList[idx.name] = {
      columnName: idx.name,
      keyPath: idx.keyPath,
      optionalParams: {
        unique: idx.unique,
        multiEntry: idx.multiEntry
      },
      deleted: Boolean(idx.deleted)
    };
  }
  CFG.DEBUG && console.log('Updating the index list for ' + store.__currentName, indexList);
  tx.executeSql('UPDATE __sys__ SET "indexList" = ? WHERE "name" = ?', [JSON.stringify(indexList), escapeSQLiteStatement(store.__currentName)], function () {
    success(store);
  }, failure);
};

/**
 * Retrieves index data for the given key.
 * @param {*|IDBKeyRange} range
 * @param {string} opType
 * @param {boolean} nullDisallowed
 * @param {number} count
 * @returns {IDBRequest}
 * @private
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
  return me.objectStore.transaction.__addToTransactionQueue(function (...args) {
    executeFetchIndexData(count, ...fetchArgs, ...args);
  }, undefined, me);
};

/* eslint-disable jsdoc/check-param-names */
/**
 * Opens a cursor over the given key range.
 * @param {*|IDBKeyRange} query
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openCursor = function /* query, direction */
() {
  /* eslint-enable jsdoc/check-param-names */
  const me = this;
  // eslint-disable-next-line prefer-rest-params
  const [query, direction] = arguments;
  const cursor = IDBCursorWithValue.__createInstance(query, direction, me.objectStore, me, escapeIndexNameForSQLKeyColumn(me.name), 'value');
  me.__objectStore.__cursors.push(cursor);
  return cursor.__request;
};

/* eslint-disable jsdoc/check-param-names */
/**
 * Opens a cursor over the given key range.  The cursor only includes key values, not data.
 * @param {*|IDBKeyRange} query
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openKeyCursor = function /* query, direction */
() {
  /* eslint-enable jsdoc/check-param-names */
  const me = this;
  // eslint-disable-next-line prefer-rest-params
  const [query, direction] = arguments;
  const cursor = IDBCursor.__createInstance(query, direction, me.objectStore, me, escapeIndexNameForSQLKeyColumn(me.name), 'key');
  me.__objectStore.__cursors.push(cursor);
  return cursor.__request;
};
IDBIndex.prototype.get = function (query) {
  if (!arguments.length) {
    // Per https://heycam.github.io/webidl/
    throw new TypeError('A parameter was missing for `IDBIndex.get`.');
  }
  return this.__fetchIndexData(query, 'value', true);
};
IDBIndex.prototype.getKey = function (query) {
  if (!arguments.length) {
    // Per https://heycam.github.io/webidl/
    throw new TypeError('A parameter was missing for `IDBIndex.getKey`.');
  }
  return this.__fetchIndexData(query, 'key', true);
};
IDBIndex.prototype.getAll = function /* query, count */
() {
  // eslint-disable-next-line prefer-rest-params
  const [query, count] = arguments;
  return this.__fetchIndexData(query, 'value', false, count);
};
IDBIndex.prototype.getAllKeys = function /* query, count */
() {
  // eslint-disable-next-line prefer-rest-params
  const [query, count] = arguments;
  return this.__fetchIndexData(query, 'key', false, count);
};
IDBIndex.prototype.count = function /* query */
() {
  const me = this;
  // eslint-disable-next-line prefer-rest-params
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

  // We could adapt the approach at http://stackoverflow.com/a/8430746/271577
  //    to make the approach reusable without passing column names, but it is a bit fragile
  store.transaction.__addNonRequestToTransactionQueue(function renameIndex(tx, args, success, error) {
    function sqlError(tx, err) {
      error(err);
    }
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
    CFG.DEBUG && console.log(sql);
    tx.executeSql(sql, [], function () {
      const sql = 'INSERT INTO ' + escapedTmpStoreNameSQL + '(' + listColsToPreserve + escapedNewIndexNameSQL + ') SELECT ' + listColsToPreserve + escapeIndexNameForSQL(oldName) + ' FROM ' + escapedStoreNameSQL;
      CFG.DEBUG && console.log(sql);
      tx.executeSql(sql, [], function () {
        const sql = 'DROP TABLE ' + escapedStoreNameSQL;
        CFG.DEBUG && console.log(sql);
        tx.executeSql(sql, [], function () {
          const sql = 'ALTER TABLE ' + escapedTmpStoreNameSQL + ' RENAME TO ' + escapedStoreNameSQL;
          CFG.DEBUG && console.log(sql);
          tx.executeSql(sql, [], function (tx, data) {
            if (!CFG.useSQLiteIndexes) {
              finish();
              return;
            }
            const indexCreations = colNamesToPreserve.slice(2) // Doing `key` separately and no need for index on `value`
            .map(escapedIndexNameSQL => new syncPromiseCommonjs(function (resolve, reject) {
              const escapedIndexToRecreate = sqlQuote(escapedStoreNameSQL.slice(1, -1) + '^5' + escapedIndexNameSQL.slice(1, -1));
              // const sql = 'DROP INDEX IF EXISTS ' + escapedIndexToRecreate;
              // CFG.DEBUG && console.log(sql);
              // tx.executeSql(sql, [], function () {
              const sql = 'CREATE INDEX ' + escapedIndexToRecreate + ' ON ' + escapedStoreNameSQL + '(' + escapedIndexNameSQL + ')';
              CFG.DEBUG && console.log(sql);
              tx.executeSql(sql, [], resolve, function (tx, err) {
                reject(err);
              });
              // }, function (tx, err) {
              //    reject(err);
              // });
            }));

            indexCreations.push(new syncPromiseCommonjs(function (resolve, reject) {
              const escapedIndexToRecreate = sqlQuote('sk_' + escapedStoreNameSQL.slice(1, -1));
              // Chrome erring here if not dropped first; Node does not
              const sql = 'DROP INDEX IF EXISTS ' + escapedIndexToRecreate;
              CFG.DEBUG && console.log(sql);
              tx.executeSql(sql, [], function () {
                const sql = 'CREATE INDEX ' + escapedIndexToRecreate + ' ON ' + escapedStoreNameSQL + '("key")';
                CFG.DEBUG && console.log(sql);
                tx.executeSql(sql, [], resolve, function (tx, err) {
                  reject(err);
                });
              }, function (tx, err) {
                reject(err);
              });
            }));
            syncPromiseCommonjs.all(indexCreations).then(finish, error).catch(err => {
              console.log('Index rename error');
              throw err;
            });
          }, sqlError);
        }, sqlError);
      }, sqlError);
    }, sqlError);
  });
};
Object.defineProperty(IDBIndex, Symbol.hasInstance, {
  value: obj => isObj(obj) && typeof obj.openCursor === 'function' && typeof obj.multiEntry === 'boolean'
});
defineReadonlyOuterInterface(IDBIndex.prototype, readonlyProperties$2);
defineOuterInterface(IDBIndex.prototype, ['name']);
IDBIndex.prototype[Symbol.toStringTag] = 'IDBIndexPrototype';
Object.defineProperty(IDBIndex, 'prototype', {
  writable: false
});
function executeFetchIndexData(count, unboundedDisallowed, index, hasKey, range, opType, multiChecks, sql, sqlValues, tx, args, success, error) {
  if (unboundedDisallowed) {
    count = 1;
  }
  if (count) {
    sql.push('LIMIT', count);
  }
  const isCount = opType === 'count';
  CFG.DEBUG && console.log('Trying to fetch data for Index', sql.join(' '), sqlValues);
  tx.executeSql(sql.join(' '), sqlValues, function (tx, data) {
    const records = [];
    let recordCount = 0;
    const decode$2 = isCount ? () => {/* */} : opType === 'key' ? record => {
      // Key.convertValueToKey(record.key); // Already validated before storage
      return decode$1(unescapeSQLiteResponse(record.key));
    } : record => {
      // when opType is value
      return decode(unescapeSQLiteResponse(record.value));
    };
    if (index.multiEntry) {
      const escapedIndexNameForKeyCol = escapeIndexNameForSQLKeyColumn(index.name);
      const encodedKey = encode$1(range, index.multiEntry);
      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows.item(i);
        const rowKey = decode$1(row[escapedIndexNameForKeyCol]);
        let record;
        if (hasKey && (multiChecks && range.some(check => rowKey.includes(check)) ||
        // More precise than our SQL
        isMultiEntryMatch(encodedKey, row[escapedIndexNameForKeyCol]))) {
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
  }, error);
}
function buildFetchIndexDataSQL(nullDisallowed, index, range, opType, multiChecks) {
  const hasRange = nullDisallowed || !isNullish(range);
  const col = opType === 'count' ? 'key' : opType; // It doesn't matter which column we use for 'count' as long as it is valid
  const sql = ['SELECT', sqlQuote(col) + (index.multiEntry ? ', ' + escapeIndexNameForSQL(index.name) : ''), 'FROM', escapeStoreNameForSQL(index.objectStore.__currentName), 'WHERE', escapeIndexNameForSQL(index.name), 'NOT NULL'];
  const sqlValues = [];
  if (hasRange) {
    if (multiChecks) {
      sql.push('AND (');
      range.forEach((innerKey, i) => {
        if (i > 0) sql.push('OR');
        sql.push(escapeIndexNameForSQL(index.name), "LIKE ? ESCAPE '^' ");
        sqlValues.push('%' + sqlLIKEEscape(encode$1(innerKey, index.multiEntry)) + '%');
      });
      sql.push(')');
    } else if (index.multiEntry) {
      sql.push('AND', escapeIndexNameForSQL(index.name), "LIKE ? ESCAPE '^'");
      sqlValues.push('%' + sqlLIKEEscape(encode$1(range, index.multiEntry)) + '%');
    } else {
      const convertedRange = convertValueToKeyRange(range, nullDisallowed);
      setSQLForKeyRange(convertedRange, escapeIndexNameForSQL(index.name), sql, sqlValues, true, false);
    }
  }
  return [nullDisallowed, index, hasRange, range, opType, multiChecks, sql, sqlValues];
}

const readonlyProperties$1 = ['keyPath', 'indexNames', 'transaction', 'autoIncrement'];

/* eslint-disable jsdoc/check-param-names */
/**
 * IndexedDB Object Store.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
 * @param {IDBObjectStoreProperties} storeProperties
 * @param {IDBTransaction} transaction
 * @class
 */
function IDBObjectStore() {
  /* eslint-enable jsdoc/check-param-names */
  throw new TypeError('Illegal constructor');
}
const IDBObjectStoreAlias = IDBObjectStore;
IDBObjectStore.__createInstance = function (storeProperties, transaction) {
  function IDBObjectStore() {
    const me = this;
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
      if (hasOwn(indexList, indexName)) {
        const index = IDBIndex.__createInstance(me, indexList[indexName]);
        me.__indexes[index.name] = index;
        if (!index.__deleted) {
          me.indexNames.push(index.name);
        }
      }
    }
    me.__oldIndexNames = me.indexNames.clone();
    Object.defineProperty(this, '__currentName', {
      get() {
        return '__pendingName' in this ? this.__pendingName : this.name;
      }
    });
    Object.defineProperty(this, 'name', {
      enumerable: false,
      configurable: false,
      get() {
        return this.__name;
      },
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
        if (me.__idbdb.__objectStores[name] && !me.__idbdb.__objectStores[name].__pendingDelete) {
          throw createDOMException('ConstraintError', 'Object store "' + name + '" already exists in ' + me.__idbdb.name);
        }
        me.__name = name;
        const oldStore = me.__idbdb.__objectStores[oldName];
        oldStore.__name = name; // Fix old references
        me.__idbdb.__objectStores[name] = oldStore; // Ensure new reference accessible
        delete me.__idbdb.__objectStores[oldName]; // Ensure won't be found

        me.__idbdb.objectStoreNames.splice(me.__idbdb.objectStoreNames.indexOf(oldName), 1, name);
        const oldHandle = me.transaction.__storeHandles[oldName];
        oldHandle.__name = name; // Fix old references
        me.transaction.__storeHandles[name] = oldHandle; // Ensure new reference accessible

        me.__pendingName = oldName;
        const sql = 'UPDATE __sys__ SET "name" = ? WHERE "name" = ?';
        const sqlValues = [escapeSQLiteStatement(name), escapeSQLiteStatement(oldName)];
        CFG.DEBUG && console.log(sql, sqlValues);
        me.transaction.__addNonRequestToTransactionQueue(function objectStoreClear(tx, args, success, error) {
          tx.executeSql(sql, sqlValues, function (tx, data) {
            // This SQL preserves indexes per https://www.sqlite.org/lang_altertable.html
            const sql = 'ALTER TABLE ' + escapeStoreNameForSQL(oldName) + ' RENAME TO ' + escapeStoreNameForSQL(name);
            CFG.DEBUG && console.log(sql);
            tx.executeSql(sql, [], function (tx, data) {
              delete me.__pendingName;
              success();
            });
          }, function (tx, err) {
            error(err);
          });
        });
      }
    });
  }
  IDBObjectStore.prototype = IDBObjectStoreAlias.prototype;
  return new IDBObjectStore();
};

/**
 * Clones an IDBObjectStore instance for a different IDBTransaction instance.
 * @param {IDBObjectStore} store
 * @param {IDBTransaction} transaction
 * @protected
 * @returns {IDBObjectStore}
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
  ['__indexes', '__indexNames', '__oldIndexNames', '__deleted', '__pendingDelete', '__pendingCreate', '__originalName'].forEach(p => {
    newStore[p] = store[p];
  });
  return newStore;
};
IDBObjectStore.__invalidStateIfDeleted = function (store, msg) {
  if (store.__deleted || store.__pendingDelete || store.__pendingCreate && store.transaction && store.transaction.__errored) {
    throw createDOMException('InvalidStateError', msg || 'This store has been deleted');
  }
};

/**
 * Creates a new object store in the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 * @returns {IDBObjectStore}
 */
IDBObjectStore.__createObjectStore = function (db, store) {
  // Add the object store to the IDBDatabase
  const storeName = store.__currentName;
  store.__pendingCreate = true;
  db.__objectStores[storeName] = store;
  db.objectStoreNames.push(storeName);

  // Add the object store to WebSQL
  const transaction = db.__versionTransaction;
  const storeHandles = transaction.__storeHandles;
  if (!storeHandles[storeName] ||
  // These latter conditions are to allow store
  //   recreation to create new clone object
  storeHandles[storeName].__pendingDelete || storeHandles[storeName].__deleted) {
    storeHandles[storeName] = IDBObjectStore.__clone(store, transaction);
  }
  transaction.__addNonRequestToTransactionQueue(function createObjectStore(tx, args, success, failure) {
    function error(tx, err) {
      CFG.DEBUG && console.log(err);
      failure(createDOMException('UnknownError', 'Could not create object store "' + storeName + '"', err));
    }
    const escapedStoreNameSQL = escapeStoreNameForSQL(storeName);
    // key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
    const sql = ['CREATE TABLE', escapedStoreNameSQL, '(key BLOB', store.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY', ', value BLOB)'].join(' ');
    CFG.DEBUG && console.log(sql);
    tx.executeSql(sql, [], function (tx, data) {
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
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
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
  const transaction = db.__versionTransaction;
  transaction.__addNonRequestToTransactionQueue(function deleteObjectStore(tx, args, success, failure) {
    function error(tx, err) {
      CFG.DEBUG && console.log(err);
      failure(createDOMException('UnknownError', 'Could not delete ObjectStore', err));
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
* @typedef {GenericArray} KeyValueArray
* @property {module:Key.Key} 0
* @property {*} 1
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
 * @param {*} value Used for inline keys
 * @param {*} key Used for out-of-line keys
 * @param {boolean} cursorUpdate
 * @throws {DOMException}
 * @returns {KeyValueArray}
 * @private
 */
IDBObjectStore.prototype.__validateKeyAndValueAndCloneValue = function (value, key, cursorUpdate) {
  const me = this;
  if (me.keyPath !== null) {
    if (key !== undefined) {
      throw createDOMException('DataError', 'The object store uses in-line keys and the key parameter was provided', me);
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
        if (!checkKeyCouldBeInjectedIntoValue(clonedValue, me.keyPath)) {
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
      throw createDOMException('DataError', 'The object store uses out-of-line keys and has no key generator and the key parameter was not provided.', me);
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
 * @param {Object} tx
 * @param {Object} value
 * @param {Object} key
 * @param {function} success
 * @param {function} failCb
 * @returns {void}
 */
IDBObjectStore.prototype.__deriveKey = function (tx, value, key, success, failCb) {
  const me = this;

  // Only run if cloning is needed
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
          injectKeyIntoValueUsingKeyPath(value, key, me.keyPath);
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
IDBObjectStore.prototype.__insertData = function (tx, encoded, value, clonedKeyOrCurrentNumber, oldCn, success, error) {
  const me = this;
  // The `ConstraintError` to occur for `add` upon a duplicate will occur naturally in attempting an insert
  // We process the index information first as it will stored in the same table as the store
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
    return new syncPromiseCommonjs((resolve, reject) => {
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
        resolve();
        return;
      }
      let indexKey;
      try {
        indexKey = extractKeyValueDecodedFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Add as necessary to this and skip past this index if exceptions here)
        if (indexKey.invalid || indexKey.failure) {
          throw new Error('Go to catch');
        }
      } catch (err) {
        resolve();
        return;
      }
      indexKey = indexKey.value;
      function setIndexInfo(index) {
        if (indexKey === undefined) {
          return;
        }
        paramMap[index.__currentName] = encode$1(indexKey, index.multiEntry);
      }
      if (index.unique) {
        const multiCheck = index.multiEntry && Array.isArray(indexKey);
        const fetchArgs = buildFetchIndexDataSQL(true, index, indexKey, 'key', multiCheck);
        executeFetchIndexData(null, ...fetchArgs, tx, null, function success(key) {
          if (key === undefined) {
            setIndexInfo(index);
            resolve();
            return;
          }
          reject(createDOMException('ConstraintError', 'Index already contains a record equal to ' + (multiCheck ? 'one of the subkeys of' : '') + '`indexKey`'));
        }, reject);
      } else {
        setIndexInfo(index);
        resolve();
      }
    });
  });
  return syncPromiseCommonjs.all(indexPromises).then(() => {
    const sqlStart = ['INSERT INTO', escapeStoreNameForSQL(me.__currentName), '('];
    const sqlEnd = [' VALUES ('];
    const insertSqlValues = [];
    if (clonedKeyOrCurrentNumber !== undefined) {
      // Key.convertValueToKey(primaryKey); // Already run
      sqlStart.push(sqlQuote('key'), ',');
      sqlEnd.push('?,');
      insertSqlValues.push(escapeSQLiteStatement(encode$1(clonedKeyOrCurrentNumber)));
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
    CFG.DEBUG && console.log('SQL for adding', insertSql, insertSqlValues);
    tx.executeSql(insertSql, insertSqlValues, function (tx, data) {
      success(clonedKeyOrCurrentNumber);
    }, function (tx, err) {
      // Should occur for `add` operation
      error(createDOMException('ConstraintError', err.message, err));
    });
    return undefined;
  }).catch(function (err) {
    function fail() {
      // Todo: Add a different error object here if `assignCurrentNumber`
      //  fails in reverting?
      error(err);
    }
    if (typeof oldCn === 'number') {
      assignCurrentNumber(tx, me, oldCn, fail, fail);
      return;
    }
    fail();
  });
};
IDBObjectStore.prototype.add = function (value /* , key */) {
  const me = this;
  // eslint-disable-next-line prefer-rest-params
  const key = arguments[1];
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('No value was specified');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  me.transaction.__assertWritable();
  const request = me.transaction.__createRequest(me);
  const [ky, clonedValue] = me.__validateKeyAndValueAndCloneValue(value, key, false);
  IDBObjectStore.__storingRecordObjectStore(request, me, true, clonedValue, true, ky);
  return request;
};
IDBObjectStore.prototype.put = function (value /*, key */) {
  const me = this;
  // eslint-disable-next-line prefer-rest-params
  const key = arguments[1];
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  if (arguments.length === 0) {
    throw new TypeError('No value was specified');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  me.transaction.__assertWritable();
  const request = me.transaction.__createRequest(me);
  const [ky, clonedValue] = me.__validateKeyAndValueAndCloneValue(value, key, false);
  IDBObjectStore.__storingRecordObjectStore(request, me, true, clonedValue, false, ky);
  return request;
};
IDBObjectStore.prototype.__overwrite = function (tx, key, cb, error) {
  const me = this;
  // First try to delete if the record exists
  // Key.convertValueToKey(key); // Already run
  const sql = 'DELETE FROM ' + escapeStoreNameForSQL(me.__currentName) + ' WHERE "key" = ?';
  const encodedKey = encode$1(key);
  tx.executeSql(sql, [escapeSQLiteStatement(encodedKey)], function (tx, data) {
    CFG.DEBUG && console.log('Did the row with the', key, 'exist?', data.rowsAffected);
    cb(tx);
  }, function (tx, err) {
    error(err);
  });
};
IDBObjectStore.__storingRecordObjectStore = function (request, store, invalidateCache, value, noOverwrite /* , key */) {
  // eslint-disable-next-line prefer-rest-params
  const key = arguments[5];
  store.transaction.__pushToQueue(request, function (tx, args, success, error) {
    store.__deriveKey(tx, value, key, function (clonedKeyOrCurrentNumber, oldCn) {
      encode(value, function (encoded) {
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
IDBObjectStore.prototype.__get = function (query, getKey, getAll, count) {
  const me = this;
  if (count !== undefined) {
    count = enforceRange(count, 'unsigned long');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  const range = convertValueToKeyRange(query, !getAll);
  const col = getKey ? 'key' : 'value';
  let sql = ['SELECT', sqlQuote(col), 'FROM', escapeStoreNameForSQL(me.__currentName)];
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
    sql.push('LIMIT', count);
  }
  sql = sql.join(' ');
  return me.transaction.__addToTransactionQueue(function objectStoreGet(tx, args, success, error) {
    CFG.DEBUG && console.log('Fetching', me.__currentName, sqlValues);
    tx.executeSql(sql, sqlValues, function (tx, data) {
      CFG.DEBUG && console.log('Fetched data', data);
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
        CFG.DEBUG && console.log(e);
      }
      success(ret);
    }, function (tx, err) {
      error(err);
    });
  }, undefined, me);
};
IDBObjectStore.prototype.get = function (query) {
  if (!arguments.length) {
    throw new TypeError('A parameter was missing for `IDBObjectStore.get`.');
  }
  return this.__get(query);
};
IDBObjectStore.prototype.getKey = function (query) {
  if (!arguments.length) {
    throw new TypeError('A parameter was missing for `IDBObjectStore.getKey`.');
  }
  return this.__get(query, true);
};
IDBObjectStore.prototype.getAll = function /* query, count */
() {
  // eslint-disable-next-line prefer-rest-params
  const [query, count] = arguments;
  return this.__get(query, false, true, count);
};
IDBObjectStore.prototype.getAllKeys = function /* query, count */
() {
  // eslint-disable-next-line prefer-rest-params
  const [query, count] = arguments;
  return this.__get(query, true, true, count);
};
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
  me.transaction.__assertWritable();
  const range = convertValueToKeyRange(query, true);
  const sqlArr = ['DELETE FROM', escapeStoreNameForSQL(me.__currentName), 'WHERE'];
  const sqlValues = [];
  setSQLForKeyRange(range, sqlQuote('key'), sqlArr, sqlValues);
  const sql = sqlArr.join(' ');
  return me.transaction.__addToTransactionQueue(function objectStoreDelete(tx, args, success, error) {
    CFG.DEBUG && console.log('Deleting', me.__currentName, sqlValues);
    tx.executeSql(sql, sqlValues, function (tx, data) {
      CFG.DEBUG && console.log('Deleted from database', data.rowsAffected);
      me.__cursors.forEach(cursor => {
        cursor.__invalidateCache(); // Delete
      });

      success();
    }, function (tx, err) {
      error(err);
    });
  }, undefined, me);
};
IDBObjectStore.prototype.clear = function () {
  const me = this;
  if (!(this instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);
  me.transaction.__assertWritable();
  return me.transaction.__addToTransactionQueue(function objectStoreClear(tx, args, success, error) {
    tx.executeSql('DELETE FROM ' + escapeStoreNameForSQL(me.__currentName), [], function (tx, data) {
      CFG.DEBUG && console.log('Cleared all records from database', data.rowsAffected);
      me.__cursors.forEach(cursor => {
        cursor.__invalidateCache(); // Clear
      });

      success();
    }, function (tx, err) {
      error(err);
    });
  }, undefined, me);
};
IDBObjectStore.prototype.count = function /* query */
() {
  const me = this;
  // eslint-disable-next-line prefer-rest-params
  const query = arguments[0];
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  IDBTransaction.__assertActive(me.transaction);

  // We don't need to add to cursors array since has the count parameter which won't cache
  return IDBCursorWithValue.__createInstance(query, 'next', me, me, 'key', 'value', true).__request;
};
IDBObjectStore.prototype.openCursor = function /* query, direction */
() {
  const me = this;
  // eslint-disable-next-line prefer-rest-params
  const [query, direction] = arguments;
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  const cursor = IDBCursorWithValue.__createInstance(query, direction, me, me, 'key', 'value');
  me.__cursors.push(cursor);
  return cursor.__request;
};
IDBObjectStore.prototype.openKeyCursor = function /* query, direction */
() {
  const me = this;
  if (!(me instanceof IDBObjectStore)) {
    throw new TypeError('Illegal invocation');
  }
  IDBObjectStore.__invalidStateIfDeleted(me);
  // eslint-disable-next-line prefer-rest-params
  const [query, direction] = arguments;
  const cursor = IDBCursor.__createInstance(query, direction, me, me, 'key', 'key');
  me.__cursors.push(cursor);
  return cursor.__request;
};
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
  if (!me.__indexHandles[indexName] || me.__indexes[indexName].__pendingDelete || me.__indexes[indexName].__deleted) {
    me.__indexHandles[indexName] = IDBIndex.__clone(index, me);
  }
  return me.__indexHandles[indexName];
};

/* eslint-disable jsdoc/check-param-names */
/**
 * Creates a new index on the object store.
 * @param {string} indexName
 * @param {string} keyPath
 * @param {object} optionalParameters
 * @returns {IDBIndex}
 */
IDBObjectStore.prototype.createIndex = function (indexName, keyPath /* , optionalParameters */) {
  /* eslint-enable jsdoc/check-param-names */
  const me = this;
  // eslint-disable-next-line prefer-rest-params
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
  if (me.__indexes[indexName] && !me.__indexes[indexName].__deleted && !me.__indexes[indexName].__pendingDelete) {
    throw createDOMException('ConstraintError', 'Index "' + indexName + '" already exists on ' + me.__currentName);
  }
  keyPath = convertToSequenceDOMString(keyPath);
  if (!isValidKeyPath(keyPath)) {
    throw createDOMException('SyntaxError', 'A valid keyPath must be supplied');
  }
  if (Array.isArray(keyPath) && optionalParameters && optionalParameters.multiEntry) {
    throw createDOMException('InvalidAccessError', 'The keyPath argument was an array and the multiEntry option is true.');
  }
  optionalParameters = optionalParameters || {};
  /** @name IDBIndexProperties */
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
defineReadonlyOuterInterface(IDBObjectStore.prototype, readonlyProperties$1);
defineOuterInterface(IDBObjectStore.prototype, ['name']);
IDBObjectStore.prototype[Symbol.toStringTag] = 'IDBObjectStorePrototype';
Object.defineProperty(IDBObjectStore, 'prototype', {
  writable: false
});

const listeners = ['onabort', 'onclose', 'onerror', 'onversionchange'];
const readonlyProperties = ['name', 'version', 'objectStoreNames'];

/**
 * IDB Database Object.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
 * @class
 */
function IDBDatabase() {
  throw new TypeError('Illegal constructor');
}
const IDBDatabaseAlias = IDBDatabase;
IDBDatabase.__createInstance = function (db, name, oldVersion, version, storeProperties) {
  function IDBDatabase() {
    this[Symbol.toStringTag] = 'IDBDatabase';
    defineReadonlyProperties(this, readonlyProperties);
    this.__db = db;
    this.__closePending = false;
    this.__oldVersion = oldVersion;
    this.__version = version;
    this.__name = name;
    this.__upgradeTransaction = null;
    defineListenerProperties(this, listeners);
    this.__setOptions({
      legacyOutputDidListenersThrowFlag: true // Event hook for IndexedB
    });

    this.__transactions = [];
    this.__objectStores = {};
    this.__objectStoreNames = DOMStringList.__createInstance();
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
      ['autoInc', 'indexList'].forEach(function (prop) {
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
  return new IDBDatabase();
};
IDBDatabase.prototype = EventTargetFactory.createInstance();
IDBDatabase.prototype[Symbol.toStringTag] = 'IDBDatabasePrototype';

/* eslint-disable jsdoc/check-param-names */
/**
 * Creates a new object store.
 * @param {string} storeName
 * @param {object} [createOptions]
 * @returns {IDBObjectStore}
 */
IDBDatabase.prototype.createObjectStore = function (storeName /* , createOptions */) {
  /* eslint-enable jsdoc/check-param-names */
  // eslint-disable-next-line prefer-rest-params
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
  createOptions = _objectSpread2$1({}, createOptions);
  let {
    keyPath
  } = createOptions;
  keyPath = keyPath === undefined ? null : convertToSequenceDOMString(keyPath);
  if (keyPath !== null && !isValidKeyPath(keyPath)) {
    throw createDOMException('SyntaxError', 'The keyPath argument contains an invalid key path.');
  }
  if (this.__objectStores[storeName] && !this.__objectStores[storeName].__pendingDelete) {
    throw createDOMException('ConstraintError', 'Object store "' + storeName + '" already exists in ' + this.name);
  }
  const autoInc = createOptions.autoIncrement;
  if (autoInc && (keyPath === '' || Array.isArray(keyPath))) {
    throw createDOMException('InvalidAccessError', 'With autoIncrement set, the keyPath argument must not be an array or empty string.');
  }

  /** @name IDBObjectStoreProperties */
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
IDBDatabase.prototype.close = function () {
  if (!(this instanceof IDBDatabase)) {
    throw new TypeError('Illegal invocation');
  }
  this.__closePending = true;
  if (this.__unblocking) {
    this.__unblocking.check();
  }
};

/* eslint-disable jsdoc/check-param-names */
/**
 * Starts a new transaction.
 * @param {string|string[]} storeNames
 * @param {string} mode
 * @returns {IDBTransaction}
 */
IDBDatabase.prototype.transaction = function (storeNames /* , mode */) {
  /* eslint-enable jsdoc/check-param-names */
  if (arguments.length === 0) {
    throw new TypeError('You must supply a valid `storeNames` to `IDBDatabase.transaction`');
  }
  // eslint-disable-next-line prefer-rest-params
  let mode = arguments[1];
  storeNames = isIterable(storeNames)
  // Creating new array also ensures sequence is passed by value: https://heycam.github.io/webidl/#idl-sequence
  ? [...new Set(
  // to be unique
  convertToSequenceDOMString(storeNames) // iterables have `ToString` applied (and we convert to array for convenience)
  )].sort() // must be sorted
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
  mode = mode || 'readonly';
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

// See https://github.com/w3c/IndexedDB/issues/192
IDBDatabase.prototype.throwIfUpgradeTransactionNull = function () {
  if (this.__upgradeTransaction === null) {
    throw createDOMException('InvalidStateError', 'No upgrade transaction associated with database.');
  }
};

// Todo __forceClose: Add tests for `__forceClose`
/**
 *
 * @param {string} msg
 * @returns {void}
 */
IDBDatabase.prototype.__forceClose = function (msg) {
  const me = this;
  me.close();
  let ct = 0;
  me.__transactions.forEach(function (trans) {
    trans.on__abort = function () {
      ct++;
      if (ct === me.__transactions.length) {
        // Todo __forceClose: unblock any pending `upgradeneeded` or `deleteDatabase` calls
        const evt = createEvent('close');
        setTimeout(() => {
          me.dispatchEvent(evt);
        });
      }
    };
    trans.__abortTransaction(createDOMException('AbortError', 'The connection was force-closed: ' + (msg || '')));
  });
};
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

/* globals location */
let fs;
const setFS = _fs => {
  fs = _fs;
};
const getOrigin = () => {
  return typeof location !== 'object' || !location ? 'null' : location.origin;
};
const hasNullOrigin = () => CFG.checkOrigin !== false && getOrigin() === 'null';

// Todo: This really should be process and tab-independent so the
//  origin could vary; in the browser, this might be through a
//  `SharedWorker`
const connectionQueue = {};
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
  function removeFromQueue() {
    queueItems.shift();
    processNextInConnectionQueue(name, origin);
  }
  req.addEventListener('success', removeFromQueue);
  req.addEventListener('error', removeFromQueue);
  cb(req);
}

// eslint-disable-next-line default-param-last
function addRequestToConnectionQueue(req, name, origin = getOrigin(), cb) {
  if (!connectionQueue[origin][name]) {
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
function triggerAnyVersionChangeAndBlockedEvents(openConnections, req, oldVersion, newVersion) {
  // Todo: For Node (and in browser using service workers if available?) the
  //    connections ought to involve those in any process; should also
  //    auto-close if unloading
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
      const e = new IDBVersionChangeEvent('versionchange', {
        oldVersion,
        newVersion
      });
      return new syncPromiseCommonjs(function (resolve) {
        setTimeout(() => {
          entry.dispatchEvent(e); // No need to catch errors
          resolve();
        });
      });
    });
  }, syncPromiseCommonjs.resolve()).then(function () {
    if (connectionsClosed()) {
      return undefined;
    }
    return new syncPromiseCommonjs(function (resolve) {
      const unblocking = {
        check() {
          if (connectionsClosed()) {
            resolve();
          }
        }
      };
      const e = new IDBVersionChangeEvent('blocked', {
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
          resolve();
        }
      });
    });
  });
}
const websqlDBCache = {};
let sysdb;
let nameCounter = 0;
function getLatestCachedWebSQLVersion(name) {
  return Object.keys(websqlDBCache[name]).map(Number).reduce((prev, curr) => {
    return curr > prev ? curr : prev;
  }, 0);
}
function getLatestCachedWebSQLDB(name) {
  return websqlDBCache[name] && websqlDBCache[name][getLatestCachedWebSQLVersion(name)];
}
function cleanupDatabaseResources(__openDatabase, name, escapedDatabaseName, databaseDeleted, dbError) {
  const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
  if (useMemoryDatabase) {
    const latestSQLiteDBCached = websqlDBCache[name] ? getLatestCachedWebSQLDB(name) : null;
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
    sqliteDB.close(function (err) {
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
  const sqliteDB = __openDatabase(path.join(CFG.databaseBasePath || '', escapedDatabaseName), 1, name, CFG.DEFAULT_DB_SIZE);
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
          });
        }
      })(0);
    }, function (e) {
      // __sys__ table does not exist, but that does not mean delete did not happen
      databaseDeleted();
    });
  });
}

/**
* @callback CreateSysDBSuccessCallback
* @returns {void}
*/

/**
 * Creates the sysDB to keep track of version numbers for databases.
 * @param {openDatabase} __openDatabase
 * @param {CreateSysDBSuccessCallback} success
 * @param {DOMException} failure
 * @returns {void}
 */
function createSysDB(__openDatabase, success, failure) {
  function sysDbCreateError(tx, err) {
    err = webSQLErrback(err || tx);
    CFG.DEBUG && console.log('Error in sysdb transaction - when creating dbVersions', err);
    failure(err);
  }
  if (sysdb) {
    success();
  } else {
    sysdb = __openDatabase(typeof CFG.memoryDatabase === 'string' ? CFG.memoryDatabase : path.join(typeof CFG.sysDatabaseBasePath === 'string' ? CFG.sysDatabaseBasePath : CFG.databaseBasePath || '', '__sysdb__' + (CFG.addSQLiteExtension !== false ? '.sqlite' : '')), 1, 'System Database', CFG.DEFAULT_DB_SIZE);
    sysdb.transaction(function (systx) {
      systx.executeSql('CREATE TABLE IF NOT EXISTS dbVersions (name BLOB, version INT);', [], function (systx) {
        if (!CFG.useSQLiteIndexes) {
          success();
          return;
        }
        systx.executeSql('CREATE INDEX IF NOT EXISTS dbvname ON dbVersions(name)', [], success, sysDbCreateError);
      }, sysDbCreateError);
    }, sysDbCreateError);
  }
}

/**
 * IDBFactory Class.
 * @see https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
 * @class
 */
function IDBFactory() {
  throw new TypeError('Illegal constructor');
}
const IDBFactoryAlias = IDBFactory;
IDBFactory.__createInstance = function () {
  function IDBFactory() {
    this[Symbol.toStringTag] = 'IDBFactory';
    this.__connections = {};
  }
  IDBFactory.prototype = IDBFactoryAlias.prototype;
  return new IDBFactory();
};

/* eslint-disable jsdoc/check-param-names */
/**
 * The IndexedDB Method to create a new database and return the DB.
 * @param {string} name
 * @param {number} version
 * @throws {TypeError} Illegal invocation or no arguments (for database name)
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.open = function (name /* , version */) {
  /* eslint-enable jsdoc/check-param-names */
  const me = this;
  if (!(me instanceof IDBFactory)) {
    throw new TypeError('Illegal invocation');
  }
  // eslint-disable-next-line prefer-rest-params
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
    name = 'autoNamedDatabase_' + nameCounter++;
  }
  name = String(name); // cast to a string
  const sqlSafeName = escapeSQLiteStatement(name);
  const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
  const useDatabaseCache = CFG.cacheDatabaseInstances !== false || useMemoryDatabase;
  let escapedDatabaseName;
  // eslint-disable-next-line no-useless-catch
  try {
    escapedDatabaseName = escapeDatabaseNameForSQLAndFiles(name);
    // eslint-disable-next-line sonarjs/no-useless-catch
  } catch (err) {
    throw err; // new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
  }

  function dbCreateError(tx, err) {
    if (calledDbCreateError) {
      return;
    }
    err = err ? webSQLErrback(err) : tx;
    calledDbCreateError = true;
    // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
    const evt = createEvent('error', err, {
      bubbles: true,
      cancelable: true
    });
    req.__done = true;
    req.__error = err;
    req.__result = undefined; // Must be undefined if an error per `result` getter
    req.dispatchEvent(evt);
  }
  function setupDatabase(tx, db, oldVersion) {
    tx.executeSql('SELECT "name", "keyPath", "autoInc", "indexList" FROM __sys__', [], function (tx, data) {
      function finishRequest() {
        req.__result = connection;
        req.__done = true;
      }
      const connection = IDBDatabase.__createInstance(db, name, oldVersion, version, data);
      if (!me.__connections[name]) {
        me.__connections[name] = [];
      }
      me.__connections[name].push(connection);
      if (oldVersion < version) {
        const openConnections = me.__connections[name].slice(0, -1);
        triggerAnyVersionChangeAndBlockedEvents(openConnections, req, oldVersion, version).then(function () {
          // DB Upgrade in progress
          let sysdbFinishedCb = function (systx, err, cb) {
            if (err) {
              try {
                systx.executeSql('ROLLBACK', [], cb, cb);
              } catch (er) {
                // Browser may fail with expired transaction above so
                //     no choice but to manually revert
                sysdb.transaction(function (systx) {
                  function reportError(msg) {
                    throw new Error('Unable to roll back upgrade transaction!' + (msg || ''));
                  }

                  // Attempt to revert
                  if (oldVersion === 0) {
                    systx.executeSql('DELETE FROM dbVersions WHERE "name" = ?', [sqlSafeName], function () {
                      cb(reportError); // eslint-disable-line promise/no-callback-in-promise
                    }, reportError);
                  } else {
                    systx.executeSql('UPDATE dbVersions SET "version" = ? WHERE "name" = ?', [oldVersion, sqlSafeName], cb, reportError);
                  }
                });
              }
              return;
            }
            // In browser, should auto-commit
            cb(); // eslint-disable-line promise/no-callback-in-promise
          };

          sysdb.transaction(function (systx) {
            function versionSet() {
              const e = new IDBVersionChangeEvent('upgradeneeded', {
                oldVersion,
                newVersion: version
              });
              req.__result = connection;
              connection.__upgradeTransaction = req.__transaction = req.__result.__versionTransaction = IDBTransaction.__createInstance(req.__result, req.__result.objectStoreNames, 'versionchange');
              req.__done = true;
              req.transaction.__addNonRequestToTransactionQueue(function onupgradeneeded(tx, args, finished, error) {
                req.dispatchEvent(e);
                if (e.__legacyOutputDidListenersThrowError) {
                  logError('Error', 'An error occurred in an upgradeneeded handler attached to request chain', e.__legacyOutputDidListenersThrowError); // We do nothing else with this error as per spec
                  req.transaction.__abortTransaction(createDOMException('AbortError', 'A request was aborted.'));
                  return;
                }
                finished();
              });
              req.transaction.on__beforecomplete = function (ev) {
                connection.__upgradeTransaction = null;
                req.__result.__versionTransaction = null;
                sysdbFinishedCb(systx, false, function () {
                  req.transaction.__transFinishedCb(false, function () {
                    ev.complete();
                    req.__transaction = null;
                  });
                });
              };
              req.transaction.on__preabort = function () {
                connection.__upgradeTransaction = null;
                // We ensure any cache is deleted before any request error events fire and try to reopen
                if (useDatabaseCache) {
                  if (name in websqlDBCache) {
                    delete websqlDBCache[name][version];
                  }
                }
              };
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
                      cleanupDatabaseResources(me.__openDatabase, name, escapedDatabaseName, dbCreateError.bind(null, err), reportError || dbCreateError);
                      return;
                    }
                    dbCreateError(err);
                  });
                });
              };
              req.transaction.on__complete = function () {
                if (req.__result.__closePending) {
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
          }, dbCreateError, null, function (currentTask, err, done, rollback, commit) {
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
  function openDB(oldVersion) {
    let db;
    if ((useMemoryDatabase || useDatabaseCache) && name in websqlDBCache && websqlDBCache[name][version]) {
      db = websqlDBCache[name][version];
    } else {
      db = me.__openDatabase(useMemoryDatabase ? CFG.memoryDatabase : path.join(CFG.databaseBasePath || '', escapedDatabaseName), 1, name, CFG.DEFAULT_DB_SIZE);
      if (useDatabaseCache) {
        if (!(name in websqlDBCache)) {
          websqlDBCache[name] = {};
        }
        websqlDBCache[name][version] = db;
      }
    }
    if (version === undefined) {
      version = oldVersion || 1;
    }
    if (oldVersion > version) {
      const err = createDOMException('VersionError', 'An attempt was made to open a database using a lower version than the existing version.', version);
      if (useDatabaseCache) {
        setTimeout(() => {
          dbCreateError(err);
        });
      } else {
        dbCreateError(err);
      }
      return;
    }
    db.transaction(function (tx) {
      tx.executeSql('CREATE TABLE IF NOT EXISTS __sys__ (name BLOB, keyPath BLOB, autoInc BOOLEAN, indexList BLOB, currNum INTEGER)', [], function () {
        function setup() {
          setupDatabase(tx, db, oldVersion);
        }
        if (!CFG.createIndexes) {
          setup();
          return;
        }
        tx.executeSql('CREATE INDEX IF NOT EXISTS sysname ON __sys__(name)', [], setup, dbCreateError);
      }, dbCreateError);
    }, dbCreateError);
  }
  addRequestToConnectionQueue(req, name, /* origin */undefined, function (req) {
    let latestCachedVersion;
    if (useDatabaseCache) {
      if (!(name in websqlDBCache)) {
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
  let escapedDatabaseName;
  // eslint-disable-next-line no-useless-catch
  try {
    escapedDatabaseName = escapeDatabaseNameForSQLAndFiles(name);
    // eslint-disable-next-line sonarjs/no-useless-catch
  } catch (err) {
    throw err; // throw new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
  }

  const useMemoryDatabase = typeof CFG.memoryDatabase === 'string';
  const useDatabaseCache = CFG.cacheDatabaseInstances !== false || useMemoryDatabase;
  const req = IDBOpenDBRequest.__createInstance();
  let calledDBError = false;
  let version = 0;
  let sysdbFinishedCbDelete = function (err, cb) {
    cb(err);
  };

  // Although the spec has no specific conditions where an error
  //  may occur in `deleteDatabase`, it does provide for
  //  `UnknownError` as we may require upon a SQL deletion error
  function dbError(tx, err) {
    if (calledDBError || err === true) {
      return;
    }
    err = webSQLErrback(err || tx);
    sysdbFinishedCbDelete(true, function () {
      req.__done = true;
      req.__error = err;
      req.__result = undefined; // Must be undefined if an error per `result` getter
      // Re: why bubbling here (and how cancelable is only really relevant for `window.onerror`) see: https://github.com/w3c/IndexedDB/issues/86
      const e = createEvent('error', err, {
        bubbles: true,
        cancelable: true
      });
      req.dispatchEvent(e);
      calledDBError = true;
    });
  }
  addRequestToConnectionQueue(req, name, /* origin */undefined, function (req) {
    createSysDB(me.__openDatabase, function () {
      // function callback (cb) { cb(); }
      // callback(function () {

      function completeDatabaseDelete() {
        req.__result = undefined;
        req.__done = true;
        const e = new IDBVersionChangeEvent('success', {
          oldVersion: version,
          newVersion: null
        });
        req.dispatchEvent(e);
      }
      function databaseDeleted() {
        sysdbFinishedCbDelete(false, function () {
          if (useDatabaseCache && name in websqlDBCache) {
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
            // eslint-disable-line promise/catch-or-return
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
            }, dbError, null, function (currentTask, err, done, rollback, commit) {
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
          }, dbError);
          return undefined;
        }, dbError);
      });
    }, dbError);
  });
  return req;
};
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
* @returns {Promise<string[]>}
*/
IDBFactory.prototype.databases = function () {
  const me = this;
  let calledDbCreateError = false;
  return new Promise(function (resolve, reject) {
    // eslint-disable-line promise/avoid-new
    if (!(me instanceof IDBFactory)) {
      throw new TypeError('Illegal invocation');
    }
    if (hasNullOrigin()) {
      throw createDOMException('SecurityError', 'Cannot get IndexedDB database names from an opaque origin.');
    }
    function dbGetDatabaseNamesError(tx, err) {
      if (calledDbCreateError) {
        return;
      }
      err = err ? webSQLErrback(err) : tx;
      calledDbCreateError = true;
      reject(err);
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
* <http://w3c.github.io/IndexedDB/#steps-for-closing-a-database-connection>
* @param {string} dbName
* @param {Integer} connIdx
* @param {string} msg
* @throws {TypeError}
* @returns {void}
*/
IDBFactory.prototype.__forceClose = function (dbName, connIdx, msg) {
  const me = this;
  function forceClose(conn) {
    conn.__forceClose(msg);
  }
  if (isNullish(dbName)) {
    Object.values(me.__connections).forEach(conn => {
      forceClose(conn);
    });
  } else if (!me.__connections[dbName]) {
    console.log('No database connections with that name to force close');
  } else if (isNullish(connIdx)) {
    me.__connections[dbName].forEach(conn => {
      forceClose(conn);
    });
  } else if (!Number.isInteger(connIdx) || connIdx < 0 || connIdx > me.__connections[dbName].length - 1) {
    throw new TypeError('If providing an argument, __forceClose must be called with a ' + 'numeric index to indicate a specific connection to lose');
  } else {
    forceClose(me.__connections[dbName][connIdx]);
  }
};
IDBFactory.prototype.__setConnectionQueueOrigin = function (origin = getOrigin()) {
  connectionQueue[origin] = {};
};
IDBFactory.prototype[Symbol.toStringTag] = 'IDBFactoryPrototype';
Object.defineProperty(IDBFactory, 'prototype', {
  writable: false
});
const shimIndexedDB = IDBFactory.__createInstance();

function IDBCursor() {
  throw new TypeError('Illegal constructor');
}
const IDBCursorAlias = IDBCursor;

/* eslint-disable func-name-matching */
/**
 * The IndexedDB Cursor Object.
 * @see http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
 * @param {IDBKeyRange} query
 * @param {string} direction
 * @param {IDBObjectStore} store
 * @param {IDBObjectStore|IDBIndex} source
 * @param {string} keyColumnName
 * @param {string} valueColumnName
 * @param {boolean} count
 * @returns {void}
 */
IDBCursor.__super = function IDBCursor(query, direction, store, source, keyColumnName, valueColumnName, count) {
  /* eslint-enable func-name-matching */
  this[Symbol.toStringTag] = 'IDBCursor';
  defineReadonlyProperties(this, ['key', 'primaryKey', 'request']);
  IDBObjectStore.__invalidStateIfDeleted(store);
  this.__indexSource = instanceOf(source, IDBIndex);
  if (this.__indexSource) IDBIndex.__invalidStateIfDeleted(source);
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
  this.__multiEntryIndex = this.__indexSource ? source.multiEntry : false;
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
IDBCursor.__createInstance = function (...args) {
  const IDBCursor = IDBCursorAlias.__super;
  IDBCursor.prototype = IDBCursorAlias.prototype;
  return new IDBCursor(...args);
};
IDBCursor.prototype.__find = function (...args /* key, tx, success, error, recordsToLoad */) {
  if (this.__multiEntryIndex) {
    this.__findMultiEntry(...args);
  } else {
    this.__findBasic(...args);
  }
};
IDBCursor.prototype.__findBasic = function (key, primaryKey, tx, success, error, recordsToLoad) {
  const continueCall = recordsToLoad !== undefined;
  recordsToLoad = recordsToLoad || 1;
  const me = this;
  const quotedKeyColumnName = sqlQuote(me.__keyColumnName);
  const quotedKey = sqlQuote('key');
  let sql = ['SELECT * FROM', escapeStoreNameForSQL(me.__store.__currentName)];
  const sqlValues = [];
  sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
  setSQLForKeyRange(me.__range, quotedKeyColumnName, sql, sqlValues, true, true);

  // Determine the ORDER BY direction based on the cursor.
  const direction = me.__sqlDirection;
  const op = direction === 'ASC' ? '>' : '<';
  if (primaryKey !== undefined) {
    sql.push('AND', quotedKey, op + '= ?');
    // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
    sqlValues.push(encode$1(primaryKey));
  }
  if (key !== undefined) {
    sql.push('AND', quotedKeyColumnName, op + '= ?');
    // Key.convertValueToKey(key); // Already checked by `continue` or `continuePrimaryKey`
    sqlValues.push(encode$1(key));
  } else if (continueCall && me.__key !== undefined) {
    sql.push('AND', quotedKeyColumnName, op + ' ?');
    // Key.convertValueToKey(me.__key); // Already checked when stored
    sqlValues.push(encode$1(me.__key));
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
    sql.push('LIMIT', recordsToLoad);
  }
  sql = sql.join(' ');
  CFG.DEBUG && console.log(sql, sqlValues);
  tx.executeSql(sql, sqlValues, function (tx, data) {
    if (me.__count) {
      success(undefined, data.rows.length, undefined);
    } else if (data.rows.length > 1) {
      me.__prefetchedIndex = 0;
      me.__prefetchedData = data.rows;
      CFG.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for cursor');
      me.__decode(data.rows.item(0), success);
    } else if (data.rows.length === 1) {
      me.__decode(data.rows.item(0), success);
    } else {
      CFG.DEBUG && console.log('Reached end of cursors');
      success(undefined, undefined, undefined);
    }
  }, function (tx, err) {
    CFG.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
    error(err);
  });
};
const leftBracketRegex = /\[/gu;
IDBCursor.prototype.__findMultiEntry = function (key, primaryKey, tx, success, error) {
  const me = this;
  if (me.__prefetchedData && me.__prefetchedData.length === me.__prefetchedIndex) {
    CFG.DEBUG && console.log('Reached end of multiEntry cursor');
    success(undefined, undefined, undefined);
    return;
  }
  const quotedKeyColumnName = sqlQuote(me.__keyColumnName);
  let sql = ['SELECT * FROM', escapeStoreNameForSQL(me.__store.__currentName)];
  const sqlValues = [];
  sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
  if (me.__range && me.__range.lower !== undefined && Array.isArray(me.__range.upper)) {
    if (me.__range.upper.indexOf(me.__range.lower) === 0) {
      sql.push('AND', quotedKeyColumnName, "LIKE ? ESCAPE '^'");
      sqlValues.push('%' + sqlLIKEEscape(me.__range.__lowerCached.slice(0, -1)) + '%');
    }
  }

  // Determine the ORDER BY direction based on the cursor.
  const direction = me.__sqlDirection;
  const op = direction === 'ASC' ? '>' : '<';
  const quotedKey = sqlQuote('key');
  if (primaryKey !== undefined) {
    sql.push('AND', quotedKey, op + '= ?');
    // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
    sqlValues.push(encode$1(primaryKey));
  }
  if (key !== undefined) {
    sql.push('AND', quotedKeyColumnName, op + '= ?');
    // Key.convertValueToKey(key); // Already checked by `continue` or `continuePrimaryKey`
    sqlValues.push(encode$1(key));
  } else if (me.__key !== undefined) {
    sql.push('AND', quotedKeyColumnName, op + ' ?');
    // Key.convertValueToKey(me.__key); // Already checked when entered
    sqlValues.push(encode$1(me.__key));
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
  }
  sql = sql.join(' ');
  CFG.DEBUG && console.log(sql, sqlValues);
  tx.executeSql(sql, sqlValues, function (tx, data) {
    if (data.rows.length > 0) {
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
      const rows = [];
      for (let i = 0; i < data.rows.length; i++) {
        const rowItem = data.rows.item(i);
        const rowKey = decode$1(rowItem[me.__keyColumnName], true);
        const matches = findMultiEntryMatches(rowKey, me.__range);
        for (const matchingKey of matches) {
          const clone = {
            matchingKey: encode$1(matchingKey, true),
            key: rowItem.key
          };
          clone[me.__keyColumnName] = rowItem[me.__keyColumnName];
          clone[me.__valueColumnName] = rowItem[me.__valueColumnName];
          rows.push(clone);
        }
      }
      const reverse = me.direction.indexOf('prev') === 0;
      rows.sort(function (a, b) {
        if (a.matchingKey.replace(leftBracketRegex, 'z') < b.matchingKey.replace(leftBracketRegex, 'z')) {
          return reverse ? 1 : -1;
        }
        if (a.matchingKey.replace(leftBracketRegex, 'z') > b.matchingKey.replace(leftBracketRegex, 'z')) {
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
      if (rows.length > 1) {
        me.__prefetchedIndex = 0;
        me.__prefetchedData = {
          data: rows,
          length: rows.length,
          item(index) {
            return this.data[index];
          }
        };
        CFG.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for multiEntry cursor');
        me.__decode(rows[0], success);
      } else if (rows.length === 1) {
        CFG.DEBUG && console.log('Reached end of multiEntry cursor');
        me.__decode(rows[0], success);
      } else {
        CFG.DEBUG && console.log('Reached end of multiEntry cursor');
        success(undefined, undefined, undefined);
      }
    } else {
      CFG.DEBUG && console.log('Reached end of multiEntry cursor');
      success(undefined, undefined, undefined);
    }
  }, function (tx, err) {
    CFG.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
    error(err);
  });
};

/**
* @callback module:IDBCursor.SuccessArg
* @param value
* @param {IDBRequest} req
* @returns {void}
*/

/**
* @callback module:IDBCursor.SuccessCallback
* @param key
* @param value
* @param primaryKey
* @returns {void}
*/

/**
 * Creates an "onsuccess" callback.
 * @private
 * @param {module:IDBCursor.SuccessArg} success
 * @returns {module:IDBCursor.SuccessCallback}
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
IDBCursor.prototype.__decode = function (rowItem, callback) {
  const me = this;
  if (me.__multiEntryIndex && me.__unique) {
    if (!me.__matchedKeys) {
      me.__matchedKeys = {};
    }
    if (me.__matchedKeys[rowItem.matchingKey]) {
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
  callback(key, val, primaryKey, encKey /*, encVal, encPrimaryKey */);
};

IDBCursor.prototype.__sourceOrEffectiveObjStoreDeleted = function () {
  IDBObjectStore.__invalidStateIfDeleted(this.__store, "The cursor's effective object store has been deleted");
  if (this.__indexSource) IDBIndex.__invalidStateIfDeleted(this.source, "The cursor's index source has been deleted");
};
IDBCursor.prototype.__invalidateCache = function () {
  this.__prefetchedData = null;
};
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
IDBCursor.prototype.__continueFinish = function (key, primaryKey, advanceState) {
  const me = this;
  const recordsToPreloadOnContinue = me.__advanceCount || CFG.cursorPreloadPackSize || 100;
  me.__gotValue = false;
  me.__request.__done = false;
  me.__store.transaction.__pushToQueue(me.__request, function cursorContinue(tx, args, success, error, executeNextRequest) {
    function triggerSuccess(k, val, primKey) {
      if (advanceState) {
        if (me.__advanceCount >= 2 && k !== undefined) {
          me.__advanceCount--;
          me.__key = k;
          me.__continue(undefined, true);
          executeNextRequest(); // We don't call success yet but do need to advance the transaction queue
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
          function checkKey() {
            const cmpResult = key === undefined || cmp(k, key);
            if (cmpResult > 0 || cmpResult === 0 && (me.__unique || primaryKey === undefined || cmp(primKey, primaryKey) >= 0)) {
              triggerSuccess(k, val, primKey);
              return;
            }
            cursorContinue(tx, args, success, error);
          }
          if (me.__unique && !me.__multiEntryIndex && encKey === encode$1(me.key, me.__multiEntryIndex)) {
            cursorContinue(tx, args, success, error);
            return;
          }
          checkKey();
        });
        return;
      }
    }

    // No (or not enough) pre-fetched data, do query
    me.__find(key, primaryKey, tx, triggerSuccess, function (...args) {
      me.__advanceCount = undefined;
      error(...args);
    }, recordsToPreloadOnContinue);
  });
};
IDBCursor.prototype.continue = function /* key */
() {
  // eslint-disable-next-line prefer-rest-params
  this.__continue(arguments[0]);
};
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
IDBCursor.prototype.update = function (valueToUpdate) {
  const me = this;
  if (!arguments.length) throw new TypeError('A value must be passed to update()');
  IDBTransaction.__assertActive(me.__store.transaction);
  me.__store.transaction.__assertWritable();
  me.__sourceOrEffectiveObjStoreDeleted();
  if (!me.__gotValue) {
    throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
  }
  if (me.__keyOnly) {
    throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
  }
  const request = me.__store.transaction.__createRequest(me);
  const key = me.primaryKey;
  function addToQueue(clonedValue) {
    // We set the `invalidateCache` argument to `false` since the old value shouldn't be accessed
    IDBObjectStore.__storingRecordObjectStore(request, me.__store, false, clonedValue, false, key);
  }
  if (me.__store.keyPath !== null) {
    const [evaluatedKey, clonedValue] = me.__store.__validateKeyAndValueAndCloneValue(valueToUpdate, undefined, true);
    if (cmp(me.primaryKey, evaluatedKey) !== 0) {
      throw createDOMException('DataError', 'The key of the supplied value to `update` is not equal to the cursor\'s effective key');
    }
    addToQueue(clonedValue);
  } else {
    const clonedValue = clone(valueToUpdate);
    addToQueue(clonedValue);
  }
  return request;
};
IDBCursor.prototype.delete = function () {
  const me = this;
  IDBTransaction.__assertActive(me.__store.transaction);
  me.__store.transaction.__assertWritable();
  me.__sourceOrEffectiveObjStoreDeleted();
  if (!me.__gotValue) {
    throw createDOMException('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
  }
  if (me.__keyOnly) {
    throw createDOMException('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
  }
  return this.__store.transaction.__addToTransactionQueue(function cursorDelete(tx, args, success, error) {
    me.__find(undefined, undefined, tx, function (key, value, primaryKey) {
      const sql = 'DELETE FROM  ' + escapeStoreNameForSQL(me.__store.__currentName) + ' WHERE "key" = ?';
      CFG.DEBUG && console.log(sql, key, primaryKey);
      // Key.convertValueToKey(primaryKey); // Already checked when entered
      tx.executeSql(sql, [escapeSQLiteStatement(encode$1(primaryKey))], function (tx, data) {
        if (data.rowsAffected === 1) {
          // We don't invalidate the cache (as we don't access it anymore
          //    and it will set the index off)
          success(undefined);
        } else {
          error('No rows with key found' + key);
        }
      }, function (tx, data) {
        error(data);
      });
    }, error);
  }, undefined, me);
};
IDBCursor.prototype[Symbol.toStringTag] = 'IDBCursorPrototype';
defineReadonlyOuterInterface(IDBCursor.prototype, ['source', 'direction', 'key', 'primaryKey', 'request']);
Object.defineProperty(IDBCursor, 'prototype', {
  writable: false
});
function IDBCursorWithValue() {
  throw new TypeError('Illegal constructor');
}
IDBCursorWithValue.prototype = Object.create(IDBCursor.prototype);
Object.defineProperty(IDBCursorWithValue.prototype, 'constructor', {
  enumerable: false,
  writable: true,
  configurable: true,
  value: IDBCursorWithValue
});
const IDBCursorWithValueAlias = IDBCursorWithValue;
IDBCursorWithValue.__createInstance = function (...args) {
  function IDBCursorWithValue() {
    IDBCursor.__super.call(this, ...args);
    this[Symbol.toStringTag] = 'IDBCursorWithValue';
    defineReadonlyProperties(this, 'value');
  }
  IDBCursorWithValue.prototype = IDBCursorWithValueAlias.prototype;
  return new IDBCursorWithValue();
};
defineReadonlyOuterInterface(IDBCursorWithValue.prototype, ['value']);
IDBCursorWithValue.prototype[Symbol.toStringTag] = 'IDBCursorWithValuePrototype';
Object.defineProperty(IDBCursorWithValue, 'prototype', {
  writable: false
});

/* globals self */
function setConfig(prop, val) {
  if (prop && typeof prop === 'object') {
    Object.entries(prop).forEach(([p, val]) => {
      setConfig(p, val);
    });
    return;
  }
  if (!(prop in CFG)) {
    throw new Error(prop + ' is not a valid configuration property');
  }
  CFG[prop] = val;
  if (prop === 'registerSCA' && typeof val === 'function') {
    register(val);
  }
}
function setGlobalVars(idb, initialConfig) {
  if (initialConfig) {
    setConfig(initialConfig);
  }
  const IDB = idb || (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : typeof global !== 'undefined' ? global : {});
  function shim(name, value, propDesc) {
    if (!propDesc || !Object.defineProperty) {
      try {
        // Try setting the property. This will fail if the property is read-only.
        IDB[name] = value;
      } catch (e) {
        console.log(e);
      }
    }
    if (IDB[name] !== value && Object.defineProperty) {
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
            get [name]() {
              return propDesc.get.call(this);
            }
          };
          desc = Object.getOwnPropertyDescriptor(o, name);
        }
        Object.defineProperty(IDB, name, desc);
      } catch (e) {
        // With `indexedDB`, PhantomJS fails here and below but
        //  not above, while Chrome is reverse (and Firefox doesn't
        //  get here since no WebSQL to use for shimming)
      }
    }
    if (IDB[name] !== value) {
      typeof console !== 'undefined' && console.warn && console.warn('Unable to shim ' + name);
    }
  }
  if (CFG.win.openDatabase !== undefined) {
    shim('shimIndexedDB', shimIndexedDB, {
      enumerable: false,
      configurable: true
    });
  }
  if (IDB.shimIndexedDB) {
    IDB.shimIndexedDB.__useShim = function () {
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
          // Slow per MDN so off by default! Though apparently needed for WebIDL: http://stackoverflow.com/questions/41927589/rationales-consequences-of-webidl-class-inheritance-requirements

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
        IDB.shimIndexedDB.__setConnectionQueueOrigin();
      }
    };
    IDB.shimIndexedDB.__debug = function (val) {
      CFG.DEBUG = val;
    };
    IDB.shimIndexedDB.__setConfig = setConfig;
    IDB.shimIndexedDB.__getConfig = function (prop) {
      if (!(prop in CFG)) {
        throw new Error(prop + ' is not a valid configuration property');
      }
      return CFG[prop];
    };
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
    IDB.shimIndexedDB = {};
    ['__useShim', '__debug', '__setConfig', '__getConfig', '__setUnicodeIdentifiers'].forEach(prop => {
      IDB.shimIndexedDB[prop] = function () {
        console.warn('This browser does not have WebSQL to shim.');
      };
    });
  }

  // Workaround to prevent an error in Firefox
  if (!('indexedDB' in IDB) && typeof window !== 'undefined') {
    // 2nd condition avoids problems in Node
    IDB.indexedDB = IDB.indexedDB || IDB.webkitIndexedDB || IDB.mozIndexedDB || IDB.oIndexedDB || IDB.msIndexedDB;
  }

  // Detect browsers with known IndexedDB issues (e.g. Android pre-4.4)
  let poorIndexedDbSupport = false;
  if (typeof navigator !== 'undefined' &&
  // Not apparently defined in React Native
  navigator.userAgent && (
  // Ignore Node or other environments
  // Bad non-Chrome Android support
  /Android (?:2|3|4\.[0-3])/u.test(navigator.userAgent) && !navigator.userAgent.includes('Chrome') ||
  // Bad non-Safari iOS9 support (see <https://github.com/axemclion/IndexedDBShim/issues/252>)
  (!navigator.userAgent.includes('Safari') || navigator.userAgent.includes('Chrome')) &&
  // Exclude genuine Safari: http://stackoverflow.com/a/7768006/271577
  // Detect iOS: http://stackoverflow.com/questions/9038625/detect-if-device-is-ios/9039885#9039885
  // and detect version 9: http://stackoverflow.com/a/26363560/271577
  /(iPad|iPhone|iPod).* os 9_/ui.test(navigator.userAgent) && !window.MSStream // But avoid IE11
  )) {
    poorIndexedDbSupport = true;
  }
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
    IDB.IDBDatabase = IDB.IDBDatabase || IDB.webkitIDBDatabase;
    IDB.IDBTransaction = IDB.IDBTransaction || IDB.webkitIDBTransaction || {};
    IDB.IDBCursor = IDB.IDBCursor || IDB.webkitIDBCursor;
    IDB.IDBKeyRange = IDB.IDBKeyRange || IDB.webkitIDBKeyRange;
  }
  return IDB;
}

function SQLiteResult$1(error, insertId, rowsAffected, rows) {
  this.error = error;
  this.insertId = insertId;
  this.rowsAffected = rowsAffected;
  this.rows = rows;
}
var SQLiteResult_1 = SQLiteResult$1;

var sqlite3 = require('sqlite3');
var SQLiteResult = SQLiteResult_1;
var READ_ONLY_ERROR = new Error('could not prepare statement (23 not authorized)');
function SQLiteDatabase(name, opts) {
  opts = opts || {};
  this._db = new sqlite3.Database(name);
  if (opts.busyTimeout) {
    this._db.configure('busyTimeout', opts.busyTimeout); // Default is 1000
  }

  if (opts.trace) {
    this._db.configure('trace', opts.trace);
  }
  if (opts.profile) {
    this._db.configure('profile', opts.profile);
  }
}
function runSelect(db, sql, args, cb) {
  db.all(sql, args, function (err, rows) {
    if (err) {
      return cb(new SQLiteResult(err));
    }
    var insertId = void 0;
    var rowsAffected = 0;
    var resultSet = new SQLiteResult(null, insertId, rowsAffected, rows);
    cb(resultSet);
  });
}
function runNonSelect(db, sql, args, cb) {
  db.run(sql, args, function (err) {
    if (err) {
      return cb(new SQLiteResult(err));
    }
    /* jshint validthis:true */
    var executionResult = this;
    var insertId = executionResult.lastID;
    var rowsAffected = executionResult.changes;
    var rows = [];
    var resultSet = new SQLiteResult(null, insertId, rowsAffected, rows);
    cb(resultSet);
  });
}
SQLiteDatabase.prototype.exec = function exec(queries, readOnly, callback) {
  var db = this._db;
  var len = queries.length;
  var results = new Array(len);
  var i = 0;
  function checkDone() {
    if (++i === len) {
      callback(null, results);
    } else {
      doNext();
    }
  }
  function onQueryComplete(i) {
    return function (res) {
      results[i] = res;
      checkDone();
    };
  }
  function doNext() {
    var query = queries[i];
    var sql = query.sql;
    var args = query.args;

    // TODO: It seems like the node-sqlite3 API either allows:
    // 1) all(), which returns results but not rowsAffected or lastID
    // 2) run(), which doesn't return results, but returns rowsAffected and lastID
    // So we try to sniff whether it's a SELECT query or not.
    // This is inherently error-prone, although it will probably work in the 99%
    // case.
    var isSelect = /^\s*SELECT\b/i.test(sql);
    if (readOnly && !isSelect) {
      onQueryComplete(i)(new SQLiteResult(READ_ONLY_ERROR));
    } else if (isSelect) {
      runSelect(db, sql, args, onQueryComplete(i));
    } else {
      runNonSelect(db, sql, args, onQueryComplete(i));
    }
  }
  doNext();
};
var SQLiteDatabase_1 = SQLiteDatabase;

function wrappedSQLiteDatabase(name) {
  const db = new SQLiteDatabase_1(name);
  if (CFG.sqlBusyTimeout) {
    db._db.configure('busyTimeout', CFG.sqlBusyTimeout); // Default is 1000
  }

  if (CFG.sqlTrace) {
    db._db.configure('trace', CFG.sqlTrace);
  }
  if (CFG.sqlProfile) {
    db._db.configure('profile', CFG.sqlProfile);
  }
  return db;
}
const nodeWebSQL = customOpenDatabase(wrappedSQLiteDatabase);

CFG.win = {
  openDatabase: nodeWebSQL
};
const __setGlobalVars = function (idb, initialConfig = {}) {
  return setGlobalVars(idb, _objectSpread2$1({
    fs: fs$1
  }, initialConfig));
};

module.exports = __setGlobalVars;
//# sourceMappingURL=indexeddbshim-node.cjs.map
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.dummyPlaceholder = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

module.exports = argsArray;

function argsArray(fun) {
  return function () {
    var len = arguments.length;
    if (len) {
      var args = [];
      var i = -1;
      while (++i < len) {
        args[i] = arguments[i];
      }
      return fun.call(this, args);
    } else {
      return fun.call(this, []);
    }
  };
}
},{}],2:[function(require,module,exports){
(function (Buffer){
"use strict";

function atob(str) {
  return new Buffer(str, 'base64').toString('binary');
}

module.exports = atob.atob = atob;

}).call(this,require("buffer").Buffer)
},{"buffer":undefined}],3:[function(require,module,exports){
(function (global){
"use strict";

require("core-js/shim");

require("regenerator-runtime/runtime");

require("core-js/fn/regexp/escape");

if (global._babelPolyfill) {
  throw new Error("only one instance of babel-polyfill is allowed");
}
global._babelPolyfill = true;

var DEFINE_PROPERTY = "defineProperty";
function define(O, key, value) {
  O[key] || Object[DEFINE_PROPERTY](O, key, {
    writable: true,
    configurable: true,
    value: value
  });
}

define(String.prototype, "padLeft", "".padStart);
define(String.prototype, "padRight", "".padEnd);

"pop,reverse,shift,keys,values,entries,indexOf,every,some,forEach,map,filter,find,findIndex,includes,join,slice,concat,push,splice,unshift,sort,lastIndexOf,reduce,reduceRight,copyWithin,fill".split(",").forEach(function (key) {
  [][key] && define(Array, key, Function.call.bind([][key]));
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"core-js/fn/regexp/escape":5,"core-js/shim":298,"regenerator-runtime/runtime":4}],4:[function(require,module,exports){
(function (global){
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] =
    GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  runtime.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return Promise.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  runtime.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" ||
              (method === "throw" && delegate.iterator[method] === undefined)) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(
            delegate.iterator[method],
            delegate.iterator,
            arg
          );

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = arg;

        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }

        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[toStringTagSymbol] = "Generator";

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof global === "object" ? global :
  typeof window === "object" ? window :
  typeof self === "object" ? self : this
);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
require('../../modules/core.regexp.escape');
module.exports = require('../../modules/_core').RegExp.escape;
},{"../../modules/_core":26,"../../modules/core.regexp.escape":122}],6:[function(require,module,exports){
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
},{}],7:[function(require,module,exports){
var cof = require('./_cof');
module.exports = function(it, msg){
  if(typeof it != 'number' && cof(it) != 'Number')throw TypeError(msg);
  return +it;
};
},{"./_cof":21}],8:[function(require,module,exports){
// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = require('./_wks')('unscopables')
  , ArrayProto  = Array.prototype;
if(ArrayProto[UNSCOPABLES] == undefined)require('./_hide')(ArrayProto, UNSCOPABLES, {});
module.exports = function(key){
  ArrayProto[UNSCOPABLES][key] = true;
};
},{"./_hide":43,"./_wks":120}],9:[function(require,module,exports){
module.exports = function(it, Constructor, name, forbiddenField){
  if(!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)){
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};
},{}],10:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
},{"./_is-object":52}],11:[function(require,module,exports){
// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
'use strict';
var toObject = require('./_to-object')
  , toIndex  = require('./_to-index')
  , toLength = require('./_to-length');

module.exports = [].copyWithin || function copyWithin(target/*= 0*/, start/*= 0, end = @length*/){
  var O     = toObject(this)
    , len   = toLength(O.length)
    , to    = toIndex(target, len)
    , from  = toIndex(start, len)
    , end   = arguments.length > 2 ? arguments[2] : undefined
    , count = Math.min((end === undefined ? len : toIndex(end, len)) - from, len - to)
    , inc   = 1;
  if(from < to && to < from + count){
    inc  = -1;
    from += count - 1;
    to   += count - 1;
  }
  while(count-- > 0){
    if(from in O)O[to] = O[from];
    else delete O[to];
    to   += inc;
    from += inc;
  } return O;
};
},{"./_to-index":108,"./_to-length":111,"./_to-object":112}],12:[function(require,module,exports){
// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
'use strict';
var toObject = require('./_to-object')
  , toIndex  = require('./_to-index')
  , toLength = require('./_to-length');
module.exports = function fill(value /*, start = 0, end = @length */){
  var O      = toObject(this)
    , length = toLength(O.length)
    , aLen   = arguments.length
    , index  = toIndex(aLen > 1 ? arguments[1] : undefined, length)
    , end    = aLen > 2 ? arguments[2] : undefined
    , endPos = end === undefined ? length : toIndex(end, length);
  while(endPos > index)O[index++] = value;
  return O;
};
},{"./_to-index":108,"./_to-length":111,"./_to-object":112}],13:[function(require,module,exports){
var forOf = require('./_for-of');

module.exports = function(iter, ITERATOR){
  var result = [];
  forOf(iter, false, result.push, result, ITERATOR);
  return result;
};

},{"./_for-of":40}],14:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject')
  , toLength  = require('./_to-length')
  , toIndex   = require('./_to-index');
module.exports = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};
},{"./_to-index":108,"./_to-iobject":110,"./_to-length":111}],15:[function(require,module,exports){
// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx      = require('./_ctx')
  , IObject  = require('./_iobject')
  , toObject = require('./_to-object')
  , toLength = require('./_to-length')
  , asc      = require('./_array-species-create');
module.exports = function(TYPE, $create){
  var IS_MAP        = TYPE == 1
    , IS_FILTER     = TYPE == 2
    , IS_SOME       = TYPE == 3
    , IS_EVERY      = TYPE == 4
    , IS_FIND_INDEX = TYPE == 6
    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX
    , create        = $create || asc;
  return function($this, callbackfn, that){
    var O      = toObject($this)
      , self   = IObject(O)
      , f      = ctx(callbackfn, that, 3)
      , length = toLength(self.length)
      , index  = 0
      , result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined
      , val, res;
    for(;length > index; index++)if(NO_HOLES || index in self){
      val = self[index];
      res = f(val, index, O);
      if(TYPE){
        if(IS_MAP)result[index] = res;            // map
        else if(res)switch(TYPE){
          case 3: return true;                    // some
          case 5: return val;                     // find
          case 6: return index;                   // findIndex
          case 2: result.push(val);               // filter
        } else if(IS_EVERY)return false;          // every
      }
    }
    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};
},{"./_array-species-create":18,"./_ctx":28,"./_iobject":48,"./_to-length":111,"./_to-object":112}],16:[function(require,module,exports){
var aFunction = require('./_a-function')
  , toObject  = require('./_to-object')
  , IObject   = require('./_iobject')
  , toLength  = require('./_to-length');

module.exports = function(that, callbackfn, aLen, memo, isRight){
  aFunction(callbackfn);
  var O      = toObject(that)
    , self   = IObject(O)
    , length = toLength(O.length)
    , index  = isRight ? length - 1 : 0
    , i      = isRight ? -1 : 1;
  if(aLen < 2)for(;;){
    if(index in self){
      memo = self[index];
      index += i;
      break;
    }
    index += i;
    if(isRight ? index < 0 : length <= index){
      throw TypeError('Reduce of empty array with no initial value');
    }
  }
  for(;isRight ? index >= 0 : length > index; index += i)if(index in self){
    memo = callbackfn(memo, self[index], index, O);
  }
  return memo;
};
},{"./_a-function":6,"./_iobject":48,"./_to-length":111,"./_to-object":112}],17:[function(require,module,exports){
var isObject = require('./_is-object')
  , isArray  = require('./_is-array')
  , SPECIES  = require('./_wks')('species');

module.exports = function(original){
  var C;
  if(isArray(original)){
    C = original.constructor;
    // cross-realm fallback
    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
    if(isObject(C)){
      C = C[SPECIES];
      if(C === null)C = undefined;
    }
  } return C === undefined ? Array : C;
};
},{"./_is-array":50,"./_is-object":52,"./_wks":120}],18:[function(require,module,exports){
// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = require('./_array-species-constructor');

module.exports = function(original, length){
  return new (speciesConstructor(original))(length);
};
},{"./_array-species-constructor":17}],19:[function(require,module,exports){
'use strict';
var aFunction  = require('./_a-function')
  , isObject   = require('./_is-object')
  , invoke     = require('./_invoke')
  , arraySlice = [].slice
  , factories  = {};

var construct = function(F, len, args){
  if(!(len in factories)){
    for(var n = [], i = 0; i < len; i++)n[i] = 'a[' + i + ']';
    factories[len] = Function('F,a', 'return new F(' + n.join(',') + ')');
  } return factories[len](F, args);
};

module.exports = Function.bind || function bind(that /*, args... */){
  var fn       = aFunction(this)
    , partArgs = arraySlice.call(arguments, 1);
  var bound = function(/* args... */){
    var args = partArgs.concat(arraySlice.call(arguments));
    return this instanceof bound ? construct(fn, args.length, args) : invoke(fn, args, that);
  };
  if(isObject(fn.prototype))bound.prototype = fn.prototype;
  return bound;
};
},{"./_a-function":6,"./_invoke":47,"./_is-object":52}],20:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./_cof')
  , TAG = require('./_wks')('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function(it, key){
  try {
    return it[key];
  } catch(e){ /* empty */ }
};

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
},{"./_cof":21,"./_wks":120}],21:[function(require,module,exports){
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
},{}],22:[function(require,module,exports){
'use strict';
var dP          = require('./_object-dp').f
  , create      = require('./_object-create')
  , redefineAll = require('./_redefine-all')
  , ctx         = require('./_ctx')
  , anInstance  = require('./_an-instance')
  , defined     = require('./_defined')
  , forOf       = require('./_for-of')
  , $iterDefine = require('./_iter-define')
  , step        = require('./_iter-step')
  , setSpecies  = require('./_set-species')
  , DESCRIPTORS = require('./_descriptors')
  , fastKey     = require('./_meta').fastKey
  , SIZE        = DESCRIPTORS ? '_s' : 'size';

var getEntry = function(that, key){
  // fast case
  var index = fastKey(key), entry;
  if(index !== 'F')return that._i[index];
  // frozen object case
  for(entry = that._f; entry; entry = entry.n){
    if(entry.k == key)return entry;
  }
};

module.exports = {
  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
    var C = wrapper(function(that, iterable){
      anInstance(that, C, NAME, '_i');
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear(){
        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
          entry.r = true;
          if(entry.p)entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function(key){
        var that  = this
          , entry = getEntry(that, key);
        if(entry){
          var next = entry.n
            , prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if(prev)prev.n = next;
          if(next)next.p = prev;
          if(that._f == entry)that._f = next;
          if(that._l == entry)that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /*, that = undefined */){
        anInstance(this, C, 'forEach');
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3)
          , entry;
        while(entry = entry ? entry.n : this._f){
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while(entry && entry.r)entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key){
        return !!getEntry(this, key);
      }
    });
    if(DESCRIPTORS)dP(C.prototype, 'size', {
      get: function(){
        return defined(this[SIZE]);
      }
    });
    return C;
  },
  def: function(that, key, value){
    var entry = getEntry(that, key)
      , prev, index;
    // change existing entry
    if(entry){
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if(!that._f)that._f = entry;
      if(prev)prev.n = entry;
      that[SIZE]++;
      // add to index
      if(index !== 'F')that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function(C, NAME, IS_MAP){
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function(iterated, kind){
      this._t = iterated;  // target
      this._k = kind;      // kind
      this._l = undefined; // previous
    }, function(){
      var that  = this
        , kind  = that._k
        , entry = that._l;
      // revert to the last existing entry
      while(entry && entry.r)entry = entry.p;
      // get next entry
      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if(kind == 'keys'  )return step(0, entry.k);
      if(kind == 'values')return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};
},{"./_an-instance":9,"./_ctx":28,"./_defined":30,"./_descriptors":31,"./_for-of":40,"./_iter-define":56,"./_iter-step":58,"./_meta":65,"./_object-create":69,"./_object-dp":70,"./_redefine-all":89,"./_set-species":94}],23:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var classof = require('./_classof')
  , from    = require('./_array-from-iterable');
module.exports = function(NAME){
  return function toJSON(){
    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
    return from(this);
  };
};
},{"./_array-from-iterable":13,"./_classof":20}],24:[function(require,module,exports){
'use strict';
var redefineAll       = require('./_redefine-all')
  , getWeak           = require('./_meta').getWeak
  , anObject          = require('./_an-object')
  , isObject          = require('./_is-object')
  , anInstance        = require('./_an-instance')
  , forOf             = require('./_for-of')
  , createArrayMethod = require('./_array-methods')
  , $has              = require('./_has')
  , arrayFind         = createArrayMethod(5)
  , arrayFindIndex    = createArrayMethod(6)
  , id                = 0;

// fallback for uncaught frozen keys
var uncaughtFrozenStore = function(that){
  return that._l || (that._l = new UncaughtFrozenStore);
};
var UncaughtFrozenStore = function(){
  this.a = [];
};
var findUncaughtFrozen = function(store, key){
  return arrayFind(store.a, function(it){
    return it[0] === key;
  });
};
UncaughtFrozenStore.prototype = {
  get: function(key){
    var entry = findUncaughtFrozen(this, key);
    if(entry)return entry[1];
  },
  has: function(key){
    return !!findUncaughtFrozen(this, key);
  },
  set: function(key, value){
    var entry = findUncaughtFrozen(this, key);
    if(entry)entry[1] = value;
    else this.a.push([key, value]);
  },
  'delete': function(key){
    var index = arrayFindIndex(this.a, function(it){
      return it[0] === key;
    });
    if(~index)this.a.splice(index, 1);
    return !!~index;
  }
};

module.exports = {
  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
    var C = wrapper(function(that, iterable){
      anInstance(that, C, NAME, '_i');
      that._i = id++;      // collection id
      that._l = undefined; // leak store for uncaught frozen objects
      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.3.3.2 WeakMap.prototype.delete(key)
      // 23.4.3.3 WeakSet.prototype.delete(value)
      'delete': function(key){
        if(!isObject(key))return false;
        var data = getWeak(key);
        if(data === true)return uncaughtFrozenStore(this)['delete'](key);
        return data && $has(data, this._i) && delete data[this._i];
      },
      // 23.3.3.4 WeakMap.prototype.has(key)
      // 23.4.3.4 WeakSet.prototype.has(value)
      has: function has(key){
        if(!isObject(key))return false;
        var data = getWeak(key);
        if(data === true)return uncaughtFrozenStore(this).has(key);
        return data && $has(data, this._i);
      }
    });
    return C;
  },
  def: function(that, key, value){
    var data = getWeak(anObject(key), true);
    if(data === true)uncaughtFrozenStore(that).set(key, value);
    else data[that._i] = value;
    return that;
  },
  ufstore: uncaughtFrozenStore
};
},{"./_an-instance":9,"./_an-object":10,"./_array-methods":15,"./_for-of":40,"./_has":42,"./_is-object":52,"./_meta":65,"./_redefine-all":89}],25:[function(require,module,exports){
'use strict';
var global            = require('./_global')
  , $export           = require('./_export')
  , redefine          = require('./_redefine')
  , redefineAll       = require('./_redefine-all')
  , meta              = require('./_meta')
  , forOf             = require('./_for-of')
  , anInstance        = require('./_an-instance')
  , isObject          = require('./_is-object')
  , fails             = require('./_fails')
  , $iterDetect       = require('./_iter-detect')
  , setToStringTag    = require('./_set-to-string-tag')
  , inheritIfRequired = require('./_inherit-if-required');

module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
  var Base  = global[NAME]
    , C     = Base
    , ADDER = IS_MAP ? 'set' : 'add'
    , proto = C && C.prototype
    , O     = {};
  var fixMethod = function(KEY){
    var fn = proto[KEY];
    redefine(proto, KEY,
      KEY == 'delete' ? function(a){
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'has' ? function has(a){
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'get' ? function get(a){
        return IS_WEAK && !isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'add' ? function add(a){ fn.call(this, a === 0 ? 0 : a); return this; }
        : function set(a, b){ fn.call(this, a === 0 ? 0 : a, b); return this; }
    );
  };
  if(typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function(){
    new C().entries().next();
  }))){
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    var instance             = new C
      // early implementations not supports chaining
      , HASNT_CHAINING       = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance
      // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
      , THROWS_ON_PRIMITIVES = fails(function(){ instance.has(1); })
      // most early implementations doesn't supports iterables, most modern - not close it correctly
      , ACCEPT_ITERABLES     = $iterDetect(function(iter){ new C(iter); }) // eslint-disable-line no-new
      // for early implementations -0 and +0 not the same
      , BUGGY_ZERO = !IS_WEAK && fails(function(){
        // V8 ~ Chromium 42- fails only with 5+ elements
        var $instance = new C()
          , index     = 5;
        while(index--)$instance[ADDER](index, index);
        return !$instance.has(-0);
      });
    if(!ACCEPT_ITERABLES){ 
      C = wrapper(function(target, iterable){
        anInstance(target, C, NAME);
        var that = inheritIfRequired(new Base, target, C);
        if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      });
      C.prototype = proto;
      proto.constructor = C;
    }
    if(THROWS_ON_PRIMITIVES || BUGGY_ZERO){
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    if(BUGGY_ZERO || HASNT_CHAINING)fixMethod(ADDER);
    // weak collections should not contains .clear method
    if(IS_WEAK && proto.clear)delete proto.clear;
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F * (C != Base), O);

  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);

  return C;
};
},{"./_an-instance":9,"./_export":35,"./_fails":37,"./_for-of":40,"./_global":41,"./_inherit-if-required":46,"./_is-object":52,"./_iter-detect":57,"./_meta":65,"./_redefine":90,"./_redefine-all":89,"./_set-to-string-tag":95}],26:[function(require,module,exports){
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
},{}],27:[function(require,module,exports){
'use strict';
var $defineProperty = require('./_object-dp')
  , createDesc      = require('./_property-desc');

module.exports = function(object, index, value){
  if(index in object)$defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};
},{"./_object-dp":70,"./_property-desc":88}],28:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
},{"./_a-function":6}],29:[function(require,module,exports){
'use strict';
var anObject    = require('./_an-object')
  , toPrimitive = require('./_to-primitive')
  , NUMBER      = 'number';

module.exports = function(hint){
  if(hint !== 'string' && hint !== NUMBER && hint !== 'default')throw TypeError('Incorrect hint');
  return toPrimitive(anObject(this), hint != NUMBER);
};
},{"./_an-object":10,"./_to-primitive":113}],30:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
},{}],31:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_fails":37}],32:[function(require,module,exports){
var isObject = require('./_is-object')
  , document = require('./_global').document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
},{"./_global":41,"./_is-object":52}],33:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');
},{}],34:[function(require,module,exports){
// all enumerable object keys, includes symbols
var getKeys = require('./_object-keys')
  , gOPS    = require('./_object-gops')
  , pIE     = require('./_object-pie');
module.exports = function(it){
  var result     = getKeys(it)
    , getSymbols = gOPS.f;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = pIE.f
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))result.push(key);
  } return result;
};
},{"./_object-gops":76,"./_object-keys":79,"./_object-pie":80}],35:[function(require,module,exports){
var global    = require('./_global')
  , core      = require('./_core')
  , hide      = require('./_hide')
  , redefine  = require('./_redefine')
  , ctx       = require('./_ctx')
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE]
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE] || (exports[PROTOTYPE] = {})
    , key, own, out, exp;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if(target)redefine(target, key, out, type & $export.U);
    // export
    if(exports[key] != out)hide(exports, key, exp);
    if(IS_PROTO && expProto[key] != out)expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;
},{"./_core":26,"./_ctx":28,"./_global":41,"./_hide":43,"./_redefine":90}],36:[function(require,module,exports){
var MATCH = require('./_wks')('match');
module.exports = function(KEY){
  var re = /./;
  try {
    '/./'[KEY](re);
  } catch(e){
    try {
      re[MATCH] = false;
      return !'/./'[KEY](re);
    } catch(f){ /* empty */ }
  } return true;
};
},{"./_wks":120}],37:[function(require,module,exports){
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
},{}],38:[function(require,module,exports){
'use strict';
var hide     = require('./_hide')
  , redefine = require('./_redefine')
  , fails    = require('./_fails')
  , defined  = require('./_defined')
  , wks      = require('./_wks');

module.exports = function(KEY, length, exec){
  var SYMBOL   = wks(KEY)
    , fns      = exec(defined, SYMBOL, ''[KEY])
    , strfn    = fns[0]
    , rxfn     = fns[1];
  if(fails(function(){
    var O = {};
    O[SYMBOL] = function(){ return 7; };
    return ''[KEY](O) != 7;
  })){
    redefine(String.prototype, KEY, strfn);
    hide(RegExp.prototype, SYMBOL, length == 2
      // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
      // 21.2.5.11 RegExp.prototype[@@split](string, limit)
      ? function(string, arg){ return rxfn.call(string, this, arg); }
      // 21.2.5.6 RegExp.prototype[@@match](string)
      // 21.2.5.9 RegExp.prototype[@@search](string)
      : function(string){ return rxfn.call(string, this); }
    );
  }
};
},{"./_defined":30,"./_fails":37,"./_hide":43,"./_redefine":90,"./_wks":120}],39:[function(require,module,exports){
'use strict';
// 21.2.5.3 get RegExp.prototype.flags
var anObject = require('./_an-object');
module.exports = function(){
  var that   = anObject(this)
    , result = '';
  if(that.global)     result += 'g';
  if(that.ignoreCase) result += 'i';
  if(that.multiline)  result += 'm';
  if(that.unicode)    result += 'u';
  if(that.sticky)     result += 'y';
  return result;
};
},{"./_an-object":10}],40:[function(require,module,exports){
var ctx         = require('./_ctx')
  , call        = require('./_iter-call')
  , isArrayIter = require('./_is-array-iter')
  , anObject    = require('./_an-object')
  , toLength    = require('./_to-length')
  , getIterFn   = require('./core.get-iterator-method')
  , BREAK       = {}
  , RETURN      = {};
var exports = module.exports = function(iterable, entries, fn, that, ITERATOR){
  var iterFn = ITERATOR ? function(){ return iterable; } : getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator, result;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if(result === BREAK || result === RETURN)return result;
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    result = call(iterator, f, step.value, entries);
    if(result === BREAK || result === RETURN)return result;
  }
};
exports.BREAK  = BREAK;
exports.RETURN = RETURN;
},{"./_an-object":10,"./_ctx":28,"./_is-array-iter":49,"./_iter-call":54,"./_to-length":111,"./core.get-iterator-method":121}],41:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
},{}],42:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
},{}],43:[function(require,module,exports){
var dP         = require('./_object-dp')
  , createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
},{"./_descriptors":31,"./_object-dp":70,"./_property-desc":88}],44:[function(require,module,exports){
module.exports = require('./_global').document && document.documentElement;
},{"./_global":41}],45:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function(){
  return Object.defineProperty(require('./_dom-create')('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
},{"./_descriptors":31,"./_dom-create":32,"./_fails":37}],46:[function(require,module,exports){
var isObject       = require('./_is-object')
  , setPrototypeOf = require('./_set-proto').set;
module.exports = function(that, target, C){
  var P, S = target.constructor;
  if(S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && setPrototypeOf){
    setPrototypeOf(that, P);
  } return that;
};
},{"./_is-object":52,"./_set-proto":93}],47:[function(require,module,exports){
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
},{}],48:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
},{"./_cof":21}],49:[function(require,module,exports){
// check on default Array iterator
var Iterators  = require('./_iterators')
  , ITERATOR   = require('./_wks')('iterator')
  , ArrayProto = Array.prototype;

module.exports = function(it){
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};
},{"./_iterators":59,"./_wks":120}],50:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg){
  return cof(arg) == 'Array';
};
},{"./_cof":21}],51:[function(require,module,exports){
// 20.1.2.3 Number.isInteger(number)
var isObject = require('./_is-object')
  , floor    = Math.floor;
module.exports = function isInteger(it){
  return !isObject(it) && isFinite(it) && floor(it) === it;
};
},{"./_is-object":52}],52:[function(require,module,exports){
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
},{}],53:[function(require,module,exports){
// 7.2.8 IsRegExp(argument)
var isObject = require('./_is-object')
  , cof      = require('./_cof')
  , MATCH    = require('./_wks')('match');
module.exports = function(it){
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : cof(it) == 'RegExp');
};
},{"./_cof":21,"./_is-object":52,"./_wks":120}],54:[function(require,module,exports){
// call something on iterator step with safe closing on error
var anObject = require('./_an-object');
module.exports = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject(ret.call(iterator));
    throw e;
  }
};
},{"./_an-object":10}],55:[function(require,module,exports){
'use strict';
var create         = require('./_object-create')
  , descriptor     = require('./_property-desc')
  , setToStringTag = require('./_set-to-string-tag')
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};
},{"./_hide":43,"./_object-create":69,"./_property-desc":88,"./_set-to-string-tag":95,"./_wks":120}],56:[function(require,module,exports){
'use strict';
var LIBRARY        = require('./_library')
  , $export        = require('./_export')
  , redefine       = require('./_redefine')
  , hide           = require('./_hide')
  , has            = require('./_has')
  , Iterators      = require('./_iterators')
  , $iterCreate    = require('./_iter-create')
  , setToStringTag = require('./_set-to-string-tag')
  , getPrototypeOf = require('./_object-gpo')
  , ITERATOR       = require('./_wks')('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
    , methods, key, IteratorPrototype;
  // Fix native
  if($anyNative){
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
    if(IteratorPrototype !== Object.prototype){
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if(DEF_VALUES && $native && $native.name !== VALUES){
    VALUES_BUG = true;
    $default = function values(){ return $native.call(this); };
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES ? $default : getMethod(VALUES),
      keys:    IS_SET     ? $default : getMethod(KEYS),
      entries: $entries
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};
},{"./_export":35,"./_has":42,"./_hide":43,"./_iter-create":55,"./_iterators":59,"./_library":61,"./_object-gpo":77,"./_redefine":90,"./_set-to-string-tag":95,"./_wks":120}],57:[function(require,module,exports){
var ITERATOR     = require('./_wks')('iterator')
  , SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }

module.exports = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[ITERATOR]();
    iter.next = function(){ return {done: safe = true}; };
    arr[ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
},{"./_wks":120}],58:[function(require,module,exports){
module.exports = function(done, value){
  return {value: value, done: !!done};
};
},{}],59:[function(require,module,exports){
module.exports = {};
},{}],60:[function(require,module,exports){
var getKeys   = require('./_object-keys')
  , toIObject = require('./_to-iobject');
module.exports = function(object, el){
  var O      = toIObject(object)
    , keys   = getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};
},{"./_object-keys":79,"./_to-iobject":110}],61:[function(require,module,exports){
module.exports = false;
},{}],62:[function(require,module,exports){
// 20.2.2.14 Math.expm1(x)
var $expm1 = Math.expm1;
module.exports = (!$expm1
  // Old FF bug
  || $expm1(10) > 22025.465794806719 || $expm1(10) < 22025.4657948067165168
  // Tor Browser bug
  || $expm1(-2e-17) != -2e-17
) ? function expm1(x){
  return (x = +x) == 0 ? x : x > -1e-6 && x < 1e-6 ? x + x * x / 2 : Math.exp(x) - 1;
} : $expm1;
},{}],63:[function(require,module,exports){
// 20.2.2.20 Math.log1p(x)
module.exports = Math.log1p || function log1p(x){
  return (x = +x) > -1e-8 && x < 1e-8 ? x - x * x / 2 : Math.log(1 + x);
};
},{}],64:[function(require,module,exports){
// 20.2.2.28 Math.sign(x)
module.exports = Math.sign || function sign(x){
  return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
};
},{}],65:[function(require,module,exports){
var META     = require('./_uid')('meta')
  , isObject = require('./_is-object')
  , has      = require('./_has')
  , setDesc  = require('./_object-dp').f
  , id       = 0;
var isExtensible = Object.isExtensible || function(){
  return true;
};
var FREEZE = !require('./_fails')(function(){
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function(it){
  setDesc(it, META, {value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  }});
};
var fastKey = function(it, create){
  // return primitive with prefix
  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return 'F';
    // not necessary to add metadata
    if(!create)return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function(it, create){
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return true;
    // not necessary to add metadata
    if(!create)return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function(it){
  if(FREEZE && meta.NEED && isExtensible(it) && !has(it, META))setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY:      META,
  NEED:     false,
  fastKey:  fastKey,
  getWeak:  getWeak,
  onFreeze: onFreeze
};
},{"./_fails":37,"./_has":42,"./_is-object":52,"./_object-dp":70,"./_uid":117}],66:[function(require,module,exports){
var Map     = require('./es6.map')
  , $export = require('./_export')
  , shared  = require('./_shared')('metadata')
  , store   = shared.store || (shared.store = new (require('./es6.weak-map')));

var getOrCreateMetadataMap = function(target, targetKey, create){
  var targetMetadata = store.get(target);
  if(!targetMetadata){
    if(!create)return undefined;
    store.set(target, targetMetadata = new Map);
  }
  var keyMetadata = targetMetadata.get(targetKey);
  if(!keyMetadata){
    if(!create)return undefined;
    targetMetadata.set(targetKey, keyMetadata = new Map);
  } return keyMetadata;
};
var ordinaryHasOwnMetadata = function(MetadataKey, O, P){
  var metadataMap = getOrCreateMetadataMap(O, P, false);
  return metadataMap === undefined ? false : metadataMap.has(MetadataKey);
};
var ordinaryGetOwnMetadata = function(MetadataKey, O, P){
  var metadataMap = getOrCreateMetadataMap(O, P, false);
  return metadataMap === undefined ? undefined : metadataMap.get(MetadataKey);
};
var ordinaryDefineOwnMetadata = function(MetadataKey, MetadataValue, O, P){
  getOrCreateMetadataMap(O, P, true).set(MetadataKey, MetadataValue);
};
var ordinaryOwnMetadataKeys = function(target, targetKey){
  var metadataMap = getOrCreateMetadataMap(target, targetKey, false)
    , keys        = [];
  if(metadataMap)metadataMap.forEach(function(_, key){ keys.push(key); });
  return keys;
};
var toMetaKey = function(it){
  return it === undefined || typeof it == 'symbol' ? it : String(it);
};
var exp = function(O){
  $export($export.S, 'Reflect', O);
};

module.exports = {
  store: store,
  map: getOrCreateMetadataMap,
  has: ordinaryHasOwnMetadata,
  get: ordinaryGetOwnMetadata,
  set: ordinaryDefineOwnMetadata,
  keys: ordinaryOwnMetadataKeys,
  key: toMetaKey,
  exp: exp
};
},{"./_export":35,"./_shared":97,"./es6.map":152,"./es6.weak-map":258}],67:[function(require,module,exports){
var global    = require('./_global')
  , macrotask = require('./_task').set
  , Observer  = global.MutationObserver || global.WebKitMutationObserver
  , process   = global.process
  , Promise   = global.Promise
  , isNode    = require('./_cof')(process) == 'process';

module.exports = function(){
  var head, last, notify;

  var flush = function(){
    var parent, fn;
    if(isNode && (parent = process.domain))parent.exit();
    while(head){
      fn   = head.fn;
      head = head.next;
      try {
        fn();
      } catch(e){
        if(head)notify();
        else last = undefined;
        throw e;
      }
    } last = undefined;
    if(parent)parent.enter();
  };

  // Node.js
  if(isNode){
    notify = function(){
      process.nextTick(flush);
    };
  // browsers with MutationObserver
  } else if(Observer){
    var toggle = true
      , node   = document.createTextNode('');
    new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
    notify = function(){
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if(Promise && Promise.resolve){
    var promise = Promise.resolve();
    notify = function(){
      promise.then(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function(){
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }

  return function(fn){
    var task = {fn: fn, next: undefined};
    if(last)last.next = task;
    if(!head){
      head = task;
      notify();
    } last = task;
  };
};
},{"./_cof":21,"./_global":41,"./_task":107}],68:[function(require,module,exports){
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys  = require('./_object-keys')
  , gOPS     = require('./_object-gops')
  , pIE      = require('./_object-pie')
  , toObject = require('./_to-object')
  , IObject  = require('./_iobject')
  , $assign  = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || require('./_fails')(function(){
  var A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , aLen  = arguments.length
    , index = 1
    , getSymbols = gOPS.f
    , isEnum     = pIE.f;
  while(aLen > index){
    var S      = IObject(arguments[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  } return T;
} : $assign;
},{"./_fails":37,"./_iobject":48,"./_object-gops":76,"./_object-keys":79,"./_object-pie":80,"./_to-object":112}],69:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject    = require('./_an-object')
  , dPs         = require('./_object-dps')
  , enumBugKeys = require('./_enum-bug-keys')
  , IE_PROTO    = require('./_shared-key')('IE_PROTO')
  , Empty       = function(){ /* empty */ }
  , PROTOTYPE   = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe')
    , i      = enumBugKeys.length
    , lt     = '<'
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties){
  var result;
  if(O !== null){
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty;
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":10,"./_dom-create":32,"./_enum-bug-keys":33,"./_html":44,"./_object-dps":71,"./_shared-key":96}],70:[function(require,module,exports){
var anObject       = require('./_an-object')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , toPrimitive    = require('./_to-primitive')
  , dP             = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};
},{"./_an-object":10,"./_descriptors":31,"./_ie8-dom-define":45,"./_to-primitive":113}],71:[function(require,module,exports){
var dP       = require('./_object-dp')
  , anObject = require('./_an-object')
  , getKeys  = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties){
  anObject(O);
  var keys   = getKeys(Properties)
    , length = keys.length
    , i = 0
    , P;
  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
  return O;
};
},{"./_an-object":10,"./_descriptors":31,"./_object-dp":70,"./_object-keys":79}],72:[function(require,module,exports){
// Forced replacement prototype accessors methods
module.exports = require('./_library')|| !require('./_fails')(function(){
  var K = Math.random();
  // In FF throws only define methods
  __defineSetter__.call(null, K, function(){ /* empty */});
  delete require('./_global')[K];
});
},{"./_fails":37,"./_global":41,"./_library":61}],73:[function(require,module,exports){
var pIE            = require('./_object-pie')
  , createDesc     = require('./_property-desc')
  , toIObject      = require('./_to-iobject')
  , toPrimitive    = require('./_to-primitive')
  , has            = require('./_has')
  , IE8_DOM_DEFINE = require('./_ie8-dom-define')
  , gOPD           = Object.getOwnPropertyDescriptor;

exports.f = require('./_descriptors') ? gOPD : function getOwnPropertyDescriptor(O, P){
  O = toIObject(O);
  P = toPrimitive(P, true);
  if(IE8_DOM_DEFINE)try {
    return gOPD(O, P);
  } catch(e){ /* empty */ }
  if(has(O, P))return createDesc(!pIE.f.call(O, P), O[P]);
};
},{"./_descriptors":31,"./_has":42,"./_ie8-dom-define":45,"./_object-pie":80,"./_property-desc":88,"./_to-iobject":110,"./_to-primitive":113}],74:[function(require,module,exports){
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = require('./_to-iobject')
  , gOPN      = require('./_object-gopn').f
  , toString  = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function(it){
  try {
    return gOPN(it);
  } catch(e){
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it){
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};

},{"./_object-gopn":75,"./_to-iobject":110}],75:[function(require,module,exports){
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys      = require('./_object-keys-internal')
  , hiddenKeys = require('./_enum-bug-keys').concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O){
  return $keys(O, hiddenKeys);
};
},{"./_enum-bug-keys":33,"./_object-keys-internal":78}],76:[function(require,module,exports){
exports.f = Object.getOwnPropertySymbols;
},{}],77:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has         = require('./_has')
  , toObject    = require('./_to-object')
  , IE_PROTO    = require('./_shared-key')('IE_PROTO')
  , ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function(O){
  O = toObject(O);
  if(has(O, IE_PROTO))return O[IE_PROTO];
  if(typeof O.constructor == 'function' && O instanceof O.constructor){
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};
},{"./_has":42,"./_shared-key":96,"./_to-object":112}],78:[function(require,module,exports){
var has          = require('./_has')
  , toIObject    = require('./_to-iobject')
  , arrayIndexOf = require('./_array-includes')(false)
  , IE_PROTO     = require('./_shared-key')('IE_PROTO');

module.exports = function(object, names){
  var O      = toIObject(object)
    , i      = 0
    , result = []
    , key;
  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while(names.length > i)if(has(O, key = names[i++])){
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};
},{"./_array-includes":14,"./_has":42,"./_shared-key":96,"./_to-iobject":110}],79:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = require('./_object-keys-internal')
  , enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O){
  return $keys(O, enumBugKeys);
};
},{"./_enum-bug-keys":33,"./_object-keys-internal":78}],80:[function(require,module,exports){
exports.f = {}.propertyIsEnumerable;
},{}],81:[function(require,module,exports){
// most Object methods by ES6 should accept primitives
var $export = require('./_export')
  , core    = require('./_core')
  , fails   = require('./_fails');
module.exports = function(KEY, exec){
  var fn  = (core.Object || {})[KEY] || Object[KEY]
    , exp = {};
  exp[KEY] = exec(fn);
  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
};
},{"./_core":26,"./_export":35,"./_fails":37}],82:[function(require,module,exports){
var getKeys   = require('./_object-keys')
  , toIObject = require('./_to-iobject')
  , isEnum    = require('./_object-pie').f;
module.exports = function(isEntries){
  return function(it){
    var O      = toIObject(it)
      , keys   = getKeys(O)
      , length = keys.length
      , i      = 0
      , result = []
      , key;
    while(length > i)if(isEnum.call(O, key = keys[i++])){
      result.push(isEntries ? [key, O[key]] : O[key]);
    } return result;
  };
};
},{"./_object-keys":79,"./_object-pie":80,"./_to-iobject":110}],83:[function(require,module,exports){
// all object keys, includes non-enumerable and symbols
var gOPN     = require('./_object-gopn')
  , gOPS     = require('./_object-gops')
  , anObject = require('./_an-object')
  , Reflect  = require('./_global').Reflect;
module.exports = Reflect && Reflect.ownKeys || function ownKeys(it){
  var keys       = gOPN.f(anObject(it))
    , getSymbols = gOPS.f;
  return getSymbols ? keys.concat(getSymbols(it)) : keys;
};
},{"./_an-object":10,"./_global":41,"./_object-gopn":75,"./_object-gops":76}],84:[function(require,module,exports){
var $parseFloat = require('./_global').parseFloat
  , $trim       = require('./_string-trim').trim;

module.exports = 1 / $parseFloat(require('./_string-ws') + '-0') !== -Infinity ? function parseFloat(str){
  var string = $trim(String(str), 3)
    , result = $parseFloat(string);
  return result === 0 && string.charAt(0) == '-' ? -0 : result;
} : $parseFloat;
},{"./_global":41,"./_string-trim":105,"./_string-ws":106}],85:[function(require,module,exports){
var $parseInt = require('./_global').parseInt
  , $trim     = require('./_string-trim').trim
  , ws        = require('./_string-ws')
  , hex       = /^[\-+]?0[xX]/;

module.exports = $parseInt(ws + '08') !== 8 || $parseInt(ws + '0x16') !== 22 ? function parseInt(str, radix){
  var string = $trim(String(str), 3);
  return $parseInt(string, (radix >>> 0) || (hex.test(string) ? 16 : 10));
} : $parseInt;
},{"./_global":41,"./_string-trim":105,"./_string-ws":106}],86:[function(require,module,exports){
'use strict';
var path      = require('./_path')
  , invoke    = require('./_invoke')
  , aFunction = require('./_a-function');
module.exports = function(/* ...pargs */){
  var fn     = aFunction(this)
    , length = arguments.length
    , pargs  = Array(length)
    , i      = 0
    , _      = path._
    , holder = false;
  while(length > i)if((pargs[i] = arguments[i++]) === _)holder = true;
  return function(/* ...args */){
    var that = this
      , aLen = arguments.length
      , j = 0, k = 0, args;
    if(!holder && !aLen)return invoke(fn, pargs, that);
    args = pargs.slice();
    if(holder)for(;length > j; j++)if(args[j] === _)args[j] = arguments[k++];
    while(aLen > k)args.push(arguments[k++]);
    return invoke(fn, args, that);
  };
};
},{"./_a-function":6,"./_invoke":47,"./_path":87}],87:[function(require,module,exports){
module.exports = require('./_global');
},{"./_global":41}],88:[function(require,module,exports){
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
},{}],89:[function(require,module,exports){
var redefine = require('./_redefine');
module.exports = function(target, src, safe){
  for(var key in src)redefine(target, key, src[key], safe);
  return target;
};
},{"./_redefine":90}],90:[function(require,module,exports){
var global    = require('./_global')
  , hide      = require('./_hide')
  , has       = require('./_has')
  , SRC       = require('./_uid')('src')
  , TO_STRING = 'toString'
  , $toString = Function[TO_STRING]
  , TPL       = ('' + $toString).split(TO_STRING);

require('./_core').inspectSource = function(it){
  return $toString.call(it);
};

(module.exports = function(O, key, val, safe){
  var isFunction = typeof val == 'function';
  if(isFunction)has(val, 'name') || hide(val, 'name', key);
  if(O[key] === val)return;
  if(isFunction)has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if(O === global){
    O[key] = val;
  } else {
    if(!safe){
      delete O[key];
      hide(O, key, val);
    } else {
      if(O[key])O[key] = val;
      else hide(O, key, val);
    }
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString(){
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});
},{"./_core":26,"./_global":41,"./_has":42,"./_hide":43,"./_uid":117}],91:[function(require,module,exports){
module.exports = function(regExp, replace){
  var replacer = replace === Object(replace) ? function(part){
    return replace[part];
  } : replace;
  return function(it){
    return String(it).replace(regExp, replacer);
  };
};
},{}],92:[function(require,module,exports){
// 7.2.9 SameValue(x, y)
module.exports = Object.is || function is(x, y){
  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
};
},{}],93:[function(require,module,exports){
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = require('./_is-object')
  , anObject = require('./_an-object');
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = require('./_ctx')(Function.call, require('./_object-gopd').f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
},{"./_an-object":10,"./_ctx":28,"./_is-object":52,"./_object-gopd":73}],94:[function(require,module,exports){
'use strict';
var global      = require('./_global')
  , dP          = require('./_object-dp')
  , DESCRIPTORS = require('./_descriptors')
  , SPECIES     = require('./_wks')('species');

module.exports = function(KEY){
  var C = global[KEY];
  if(DESCRIPTORS && C && !C[SPECIES])dP.f(C, SPECIES, {
    configurable: true,
    get: function(){ return this; }
  });
};
},{"./_descriptors":31,"./_global":41,"./_object-dp":70,"./_wks":120}],95:[function(require,module,exports){
var def = require('./_object-dp').f
  , has = require('./_has')
  , TAG = require('./_wks')('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
},{"./_has":42,"./_object-dp":70,"./_wks":120}],96:[function(require,module,exports){
var shared = require('./_shared')('keys')
  , uid    = require('./_uid');
module.exports = function(key){
  return shared[key] || (shared[key] = uid(key));
};
},{"./_shared":97,"./_uid":117}],97:[function(require,module,exports){
var global = require('./_global')
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
},{"./_global":41}],98:[function(require,module,exports){
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject  = require('./_an-object')
  , aFunction = require('./_a-function')
  , SPECIES   = require('./_wks')('species');
module.exports = function(O, D){
  var C = anObject(O).constructor, S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};
},{"./_a-function":6,"./_an-object":10,"./_wks":120}],99:[function(require,module,exports){
var fails = require('./_fails');

module.exports = function(method, arg){
  return !!method && fails(function(){
    arg ? method.call(null, function(){}, 1) : method.call(null);
  });
};
},{"./_fails":37}],100:[function(require,module,exports){
var toInteger = require('./_to-integer')
  , defined   = require('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
},{"./_defined":30,"./_to-integer":109}],101:[function(require,module,exports){
// helper for String#{startsWith, endsWith, includes}
var isRegExp = require('./_is-regexp')
  , defined  = require('./_defined');

module.exports = function(that, searchString, NAME){
  if(isRegExp(searchString))throw TypeError('String#' + NAME + " doesn't accept regex!");
  return String(defined(that));
};
},{"./_defined":30,"./_is-regexp":53}],102:[function(require,module,exports){
var $export = require('./_export')
  , fails   = require('./_fails')
  , defined = require('./_defined')
  , quot    = /"/g;
// B.2.3.2.1 CreateHTML(string, tag, attribute, value)
var createHTML = function(string, tag, attribute, value) {
  var S  = String(defined(string))
    , p1 = '<' + tag;
  if(attribute !== '')p1 += ' ' + attribute + '="' + String(value).replace(quot, '&quot;') + '"';
  return p1 + '>' + S + '</' + tag + '>';
};
module.exports = function(NAME, exec){
  var O = {};
  O[NAME] = exec(createHTML);
  $export($export.P + $export.F * fails(function(){
    var test = ''[NAME]('"');
    return test !== test.toLowerCase() || test.split('"').length > 3;
  }), 'String', O);
};
},{"./_defined":30,"./_export":35,"./_fails":37}],103:[function(require,module,exports){
// https://github.com/tc39/proposal-string-pad-start-end
var toLength = require('./_to-length')
  , repeat   = require('./_string-repeat')
  , defined  = require('./_defined');

module.exports = function(that, maxLength, fillString, left){
  var S            = String(defined(that))
    , stringLength = S.length
    , fillStr      = fillString === undefined ? ' ' : String(fillString)
    , intMaxLength = toLength(maxLength);
  if(intMaxLength <= stringLength || fillStr == '')return S;
  var fillLen = intMaxLength - stringLength
    , stringFiller = repeat.call(fillStr, Math.ceil(fillLen / fillStr.length));
  if(stringFiller.length > fillLen)stringFiller = stringFiller.slice(0, fillLen);
  return left ? stringFiller + S : S + stringFiller;
};

},{"./_defined":30,"./_string-repeat":104,"./_to-length":111}],104:[function(require,module,exports){
'use strict';
var toInteger = require('./_to-integer')
  , defined   = require('./_defined');

module.exports = function repeat(count){
  var str = String(defined(this))
    , res = ''
    , n   = toInteger(count);
  if(n < 0 || n == Infinity)throw RangeError("Count can't be negative");
  for(;n > 0; (n >>>= 1) && (str += str))if(n & 1)res += str;
  return res;
};
},{"./_defined":30,"./_to-integer":109}],105:[function(require,module,exports){
var $export = require('./_export')
  , defined = require('./_defined')
  , fails   = require('./_fails')
  , spaces  = require('./_string-ws')
  , space   = '[' + spaces + ']'
  , non     = '\u200b\u0085'
  , ltrim   = RegExp('^' + space + space + '*')
  , rtrim   = RegExp(space + space + '*$');

var exporter = function(KEY, exec, ALIAS){
  var exp   = {};
  var FORCE = fails(function(){
    return !!spaces[KEY]() || non[KEY]() != non;
  });
  var fn = exp[KEY] = FORCE ? exec(trim) : spaces[KEY];
  if(ALIAS)exp[ALIAS] = fn;
  $export($export.P + $export.F * FORCE, 'String', exp);
};

// 1 -> String#trimLeft
// 2 -> String#trimRight
// 3 -> String#trim
var trim = exporter.trim = function(string, TYPE){
  string = String(defined(string));
  if(TYPE & 1)string = string.replace(ltrim, '');
  if(TYPE & 2)string = string.replace(rtrim, '');
  return string;
};

module.exports = exporter;
},{"./_defined":30,"./_export":35,"./_fails":37,"./_string-ws":106}],106:[function(require,module,exports){
module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';
},{}],107:[function(require,module,exports){
var ctx                = require('./_ctx')
  , invoke             = require('./_invoke')
  , html               = require('./_html')
  , cel                = require('./_dom-create')
  , global             = require('./_global')
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(require('./_cof')(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
},{"./_cof":21,"./_ctx":28,"./_dom-create":32,"./_global":41,"./_html":44,"./_invoke":47}],108:[function(require,module,exports){
var toInteger = require('./_to-integer')
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
},{"./_to-integer":109}],109:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
},{}],110:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject')
  , defined = require('./_defined');
module.exports = function(it){
  return IObject(defined(it));
};
},{"./_defined":30,"./_iobject":48}],111:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer')
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
},{"./_to-integer":109}],112:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function(it){
  return Object(defined(it));
};
},{"./_defined":30}],113:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};
},{"./_is-object":52}],114:[function(require,module,exports){
'use strict';
if(require('./_descriptors')){
  var LIBRARY             = require('./_library')
    , global              = require('./_global')
    , fails               = require('./_fails')
    , $export             = require('./_export')
    , $typed              = require('./_typed')
    , $buffer             = require('./_typed-buffer')
    , ctx                 = require('./_ctx')
    , anInstance          = require('./_an-instance')
    , propertyDesc        = require('./_property-desc')
    , hide                = require('./_hide')
    , redefineAll         = require('./_redefine-all')
    , toInteger           = require('./_to-integer')
    , toLength            = require('./_to-length')
    , toIndex             = require('./_to-index')
    , toPrimitive         = require('./_to-primitive')
    , has                 = require('./_has')
    , same                = require('./_same-value')
    , classof             = require('./_classof')
    , isObject            = require('./_is-object')
    , toObject            = require('./_to-object')
    , isArrayIter         = require('./_is-array-iter')
    , create              = require('./_object-create')
    , getPrototypeOf      = require('./_object-gpo')
    , gOPN                = require('./_object-gopn').f
    , getIterFn           = require('./core.get-iterator-method')
    , uid                 = require('./_uid')
    , wks                 = require('./_wks')
    , createArrayMethod   = require('./_array-methods')
    , createArrayIncludes = require('./_array-includes')
    , speciesConstructor  = require('./_species-constructor')
    , ArrayIterators      = require('./es6.array.iterator')
    , Iterators           = require('./_iterators')
    , $iterDetect         = require('./_iter-detect')
    , setSpecies          = require('./_set-species')
    , arrayFill           = require('./_array-fill')
    , arrayCopyWithin     = require('./_array-copy-within')
    , $DP                 = require('./_object-dp')
    , $GOPD               = require('./_object-gopd')
    , dP                  = $DP.f
    , gOPD                = $GOPD.f
    , RangeError          = global.RangeError
    , TypeError           = global.TypeError
    , Uint8Array          = global.Uint8Array
    , ARRAY_BUFFER        = 'ArrayBuffer'
    , SHARED_BUFFER       = 'Shared' + ARRAY_BUFFER
    , BYTES_PER_ELEMENT   = 'BYTES_PER_ELEMENT'
    , PROTOTYPE           = 'prototype'
    , ArrayProto          = Array[PROTOTYPE]
    , $ArrayBuffer        = $buffer.ArrayBuffer
    , $DataView           = $buffer.DataView
    , arrayForEach        = createArrayMethod(0)
    , arrayFilter         = createArrayMethod(2)
    , arraySome           = createArrayMethod(3)
    , arrayEvery          = createArrayMethod(4)
    , arrayFind           = createArrayMethod(5)
    , arrayFindIndex      = createArrayMethod(6)
    , arrayIncludes       = createArrayIncludes(true)
    , arrayIndexOf        = createArrayIncludes(false)
    , arrayValues         = ArrayIterators.values
    , arrayKeys           = ArrayIterators.keys
    , arrayEntries        = ArrayIterators.entries
    , arrayLastIndexOf    = ArrayProto.lastIndexOf
    , arrayReduce         = ArrayProto.reduce
    , arrayReduceRight    = ArrayProto.reduceRight
    , arrayJoin           = ArrayProto.join
    , arraySort           = ArrayProto.sort
    , arraySlice          = ArrayProto.slice
    , arrayToString       = ArrayProto.toString
    , arrayToLocaleString = ArrayProto.toLocaleString
    , ITERATOR            = wks('iterator')
    , TAG                 = wks('toStringTag')
    , TYPED_CONSTRUCTOR   = uid('typed_constructor')
    , DEF_CONSTRUCTOR     = uid('def_constructor')
    , ALL_CONSTRUCTORS    = $typed.CONSTR
    , TYPED_ARRAY         = $typed.TYPED
    , VIEW                = $typed.VIEW
    , WRONG_LENGTH        = 'Wrong length!';

  var $map = createArrayMethod(1, function(O, length){
    return allocate(speciesConstructor(O, O[DEF_CONSTRUCTOR]), length);
  });

  var LITTLE_ENDIAN = fails(function(){
    return new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  });

  var FORCED_SET = !!Uint8Array && !!Uint8Array[PROTOTYPE].set && fails(function(){
    new Uint8Array(1).set({});
  });

  var strictToLength = function(it, SAME){
    if(it === undefined)throw TypeError(WRONG_LENGTH);
    var number = +it
      , length = toLength(it);
    if(SAME && !same(number, length))throw RangeError(WRONG_LENGTH);
    return length;
  };

  var toOffset = function(it, BYTES){
    var offset = toInteger(it);
    if(offset < 0 || offset % BYTES)throw RangeError('Wrong offset!');
    return offset;
  };

  var validate = function(it){
    if(isObject(it) && TYPED_ARRAY in it)return it;
    throw TypeError(it + ' is not a typed array!');
  };

  var allocate = function(C, length){
    if(!(isObject(C) && TYPED_CONSTRUCTOR in C)){
      throw TypeError('It is not a typed array constructor!');
    } return new C(length);
  };

  var speciesFromList = function(O, list){
    return fromList(speciesConstructor(O, O[DEF_CONSTRUCTOR]), list);
  };

  var fromList = function(C, list){
    var index  = 0
      , length = list.length
      , result = allocate(C, length);
    while(length > index)result[index] = list[index++];
    return result;
  };

  var addGetter = function(it, key, internal){
    dP(it, key, {get: function(){ return this._d[internal]; }});
  };

  var $from = function from(source /*, mapfn, thisArg */){
    var O       = toObject(source)
      , aLen    = arguments.length
      , mapfn   = aLen > 1 ? arguments[1] : undefined
      , mapping = mapfn !== undefined
      , iterFn  = getIterFn(O)
      , i, length, values, result, step, iterator;
    if(iterFn != undefined && !isArrayIter(iterFn)){
      for(iterator = iterFn.call(O), values = [], i = 0; !(step = iterator.next()).done; i++){
        values.push(step.value);
      } O = values;
    }
    if(mapping && aLen > 2)mapfn = ctx(mapfn, arguments[2], 2);
    for(i = 0, length = toLength(O.length), result = allocate(this, length); length > i; i++){
      result[i] = mapping ? mapfn(O[i], i) : O[i];
    }
    return result;
  };

  var $of = function of(/*...items*/){
    var index  = 0
      , length = arguments.length
      , result = allocate(this, length);
    while(length > index)result[index] = arguments[index++];
    return result;
  };

  // iOS Safari 6.x fails here
  var TO_LOCALE_BUG = !!Uint8Array && fails(function(){ arrayToLocaleString.call(new Uint8Array(1)); });

  var $toLocaleString = function toLocaleString(){
    return arrayToLocaleString.apply(TO_LOCALE_BUG ? arraySlice.call(validate(this)) : validate(this), arguments);
  };

  var proto = {
    copyWithin: function copyWithin(target, start /*, end */){
      return arrayCopyWithin.call(validate(this), target, start, arguments.length > 2 ? arguments[2] : undefined);
    },
    every: function every(callbackfn /*, thisArg */){
      return arrayEvery(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    fill: function fill(value /*, start, end */){ // eslint-disable-line no-unused-vars
      return arrayFill.apply(validate(this), arguments);
    },
    filter: function filter(callbackfn /*, thisArg */){
      return speciesFromList(this, arrayFilter(validate(this), callbackfn,
        arguments.length > 1 ? arguments[1] : undefined));
    },
    find: function find(predicate /*, thisArg */){
      return arrayFind(validate(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
    },
    findIndex: function findIndex(predicate /*, thisArg */){
      return arrayFindIndex(validate(this), predicate, arguments.length > 1 ? arguments[1] : undefined);
    },
    forEach: function forEach(callbackfn /*, thisArg */){
      arrayForEach(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    indexOf: function indexOf(searchElement /*, fromIndex */){
      return arrayIndexOf(validate(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
    },
    includes: function includes(searchElement /*, fromIndex */){
      return arrayIncludes(validate(this), searchElement, arguments.length > 1 ? arguments[1] : undefined);
    },
    join: function join(separator){ // eslint-disable-line no-unused-vars
      return arrayJoin.apply(validate(this), arguments);
    },
    lastIndexOf: function lastIndexOf(searchElement /*, fromIndex */){ // eslint-disable-line no-unused-vars
      return arrayLastIndexOf.apply(validate(this), arguments);
    },
    map: function map(mapfn /*, thisArg */){
      return $map(validate(this), mapfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    reduce: function reduce(callbackfn /*, initialValue */){ // eslint-disable-line no-unused-vars
      return arrayReduce.apply(validate(this), arguments);
    },
    reduceRight: function reduceRight(callbackfn /*, initialValue */){ // eslint-disable-line no-unused-vars
      return arrayReduceRight.apply(validate(this), arguments);
    },
    reverse: function reverse(){
      var that   = this
        , length = validate(that).length
        , middle = Math.floor(length / 2)
        , index  = 0
        , value;
      while(index < middle){
        value         = that[index];
        that[index++] = that[--length];
        that[length]  = value;
      } return that;
    },
    some: function some(callbackfn /*, thisArg */){
      return arraySome(validate(this), callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    },
    sort: function sort(comparefn){
      return arraySort.call(validate(this), comparefn);
    },
    subarray: function subarray(begin, end){
      var O      = validate(this)
        , length = O.length
        , $begin = toIndex(begin, length);
      return new (speciesConstructor(O, O[DEF_CONSTRUCTOR]))(
        O.buffer,
        O.byteOffset + $begin * O.BYTES_PER_ELEMENT,
        toLength((end === undefined ? length : toIndex(end, length)) - $begin)
      );
    }
  };

  var $slice = function slice(start, end){
    return speciesFromList(this, arraySlice.call(validate(this), start, end));
  };

  var $set = function set(arrayLike /*, offset */){
    validate(this);
    var offset = toOffset(arguments[1], 1)
      , length = this.length
      , src    = toObject(arrayLike)
      , len    = toLength(src.length)
      , index  = 0;
    if(len + offset > length)throw RangeError(WRONG_LENGTH);
    while(index < len)this[offset + index] = src[index++];
  };

  var $iterators = {
    entries: function entries(){
      return arrayEntries.call(validate(this));
    },
    keys: function keys(){
      return arrayKeys.call(validate(this));
    },
    values: function values(){
      return arrayValues.call(validate(this));
    }
  };

  var isTAIndex = function(target, key){
    return isObject(target)
      && target[TYPED_ARRAY]
      && typeof key != 'symbol'
      && key in target
      && String(+key) == String(key);
  };
  var $getDesc = function getOwnPropertyDescriptor(target, key){
    return isTAIndex(target, key = toPrimitive(key, true))
      ? propertyDesc(2, target[key])
      : gOPD(target, key);
  };
  var $setDesc = function defineProperty(target, key, desc){
    if(isTAIndex(target, key = toPrimitive(key, true))
      && isObject(desc)
      && has(desc, 'value')
      && !has(desc, 'get')
      && !has(desc, 'set')
      // TODO: add validation descriptor w/o calling accessors
      && !desc.configurable
      && (!has(desc, 'writable') || desc.writable)
      && (!has(desc, 'enumerable') || desc.enumerable)
    ){
      target[key] = desc.value;
      return target;
    } else return dP(target, key, desc);
  };

  if(!ALL_CONSTRUCTORS){
    $GOPD.f = $getDesc;
    $DP.f   = $setDesc;
  }

  $export($export.S + $export.F * !ALL_CONSTRUCTORS, 'Object', {
    getOwnPropertyDescriptor: $getDesc,
    defineProperty:           $setDesc
  });

  if(fails(function(){ arrayToString.call({}); })){
    arrayToString = arrayToLocaleString = function toString(){
      return arrayJoin.call(this);
    }
  }

  var $TypedArrayPrototype$ = redefineAll({}, proto);
  redefineAll($TypedArrayPrototype$, $iterators);
  hide($TypedArrayPrototype$, ITERATOR, $iterators.values);
  redefineAll($TypedArrayPrototype$, {
    slice:          $slice,
    set:            $set,
    constructor:    function(){ /* noop */ },
    toString:       arrayToString,
    toLocaleString: $toLocaleString
  });
  addGetter($TypedArrayPrototype$, 'buffer', 'b');
  addGetter($TypedArrayPrototype$, 'byteOffset', 'o');
  addGetter($TypedArrayPrototype$, 'byteLength', 'l');
  addGetter($TypedArrayPrototype$, 'length', 'e');
  dP($TypedArrayPrototype$, TAG, {
    get: function(){ return this[TYPED_ARRAY]; }
  });

  module.exports = function(KEY, BYTES, wrapper, CLAMPED){
    CLAMPED = !!CLAMPED;
    var NAME       = KEY + (CLAMPED ? 'Clamped' : '') + 'Array'
      , ISNT_UINT8 = NAME != 'Uint8Array'
      , GETTER     = 'get' + KEY
      , SETTER     = 'set' + KEY
      , TypedArray = global[NAME]
      , Base       = TypedArray || {}
      , TAC        = TypedArray && getPrototypeOf(TypedArray)
      , FORCED     = !TypedArray || !$typed.ABV
      , O          = {}
      , TypedArrayPrototype = TypedArray && TypedArray[PROTOTYPE];
    var getter = function(that, index){
      var data = that._d;
      return data.v[GETTER](index * BYTES + data.o, LITTLE_ENDIAN);
    };
    var setter = function(that, index, value){
      var data = that._d;
      if(CLAMPED)value = (value = Math.round(value)) < 0 ? 0 : value > 0xff ? 0xff : value & 0xff;
      data.v[SETTER](index * BYTES + data.o, value, LITTLE_ENDIAN);
    };
    var addElement = function(that, index){
      dP(that, index, {
        get: function(){
          return getter(this, index);
        },
        set: function(value){
          return setter(this, index, value);
        },
        enumerable: true
      });
    };
    if(FORCED){
      TypedArray = wrapper(function(that, data, $offset, $length){
        anInstance(that, TypedArray, NAME, '_d');
        var index  = 0
          , offset = 0
          , buffer, byteLength, length, klass;
        if(!isObject(data)){
          length     = strictToLength(data, true)
          byteLength = length * BYTES;
          buffer     = new $ArrayBuffer(byteLength);
        } else if(data instanceof $ArrayBuffer || (klass = classof(data)) == ARRAY_BUFFER || klass == SHARED_BUFFER){
          buffer = data;
          offset = toOffset($offset, BYTES);
          var $len = data.byteLength;
          if($length === undefined){
            if($len % BYTES)throw RangeError(WRONG_LENGTH);
            byteLength = $len - offset;
            if(byteLength < 0)throw RangeError(WRONG_LENGTH);
          } else {
            byteLength = toLength($length) * BYTES;
            if(byteLength + offset > $len)throw RangeError(WRONG_LENGTH);
          }
          length = byteLength / BYTES;
        } else if(TYPED_ARRAY in data){
          return fromList(TypedArray, data);
        } else {
          return $from.call(TypedArray, data);
        }
        hide(that, '_d', {
          b: buffer,
          o: offset,
          l: byteLength,
          e: length,
          v: new $DataView(buffer)
        });
        while(index < length)addElement(that, index++);
      });
      TypedArrayPrototype = TypedArray[PROTOTYPE] = create($TypedArrayPrototype$);
      hide(TypedArrayPrototype, 'constructor', TypedArray);
    } else if(!$iterDetect(function(iter){
      // V8 works with iterators, but fails in many other cases
      // https://code.google.com/p/v8/issues/detail?id=4552
      new TypedArray(null); // eslint-disable-line no-new
      new TypedArray(iter); // eslint-disable-line no-new
    }, true)){
      TypedArray = wrapper(function(that, data, $offset, $length){
        anInstance(that, TypedArray, NAME);
        var klass;
        // `ws` module bug, temporarily remove validation length for Uint8Array
        // https://github.com/websockets/ws/pull/645
        if(!isObject(data))return new Base(strictToLength(data, ISNT_UINT8));
        if(data instanceof $ArrayBuffer || (klass = classof(data)) == ARRAY_BUFFER || klass == SHARED_BUFFER){
          return $length !== undefined
            ? new Base(data, toOffset($offset, BYTES), $length)
            : $offset !== undefined
              ? new Base(data, toOffset($offset, BYTES))
              : new Base(data);
        }
        if(TYPED_ARRAY in data)return fromList(TypedArray, data);
        return $from.call(TypedArray, data);
      });
      arrayForEach(TAC !== Function.prototype ? gOPN(Base).concat(gOPN(TAC)) : gOPN(Base), function(key){
        if(!(key in TypedArray))hide(TypedArray, key, Base[key]);
      });
      TypedArray[PROTOTYPE] = TypedArrayPrototype;
      if(!LIBRARY)TypedArrayPrototype.constructor = TypedArray;
    }
    var $nativeIterator   = TypedArrayPrototype[ITERATOR]
      , CORRECT_ITER_NAME = !!$nativeIterator && ($nativeIterator.name == 'values' || $nativeIterator.name == undefined)
      , $iterator         = $iterators.values;
    hide(TypedArray, TYPED_CONSTRUCTOR, true);
    hide(TypedArrayPrototype, TYPED_ARRAY, NAME);
    hide(TypedArrayPrototype, VIEW, true);
    hide(TypedArrayPrototype, DEF_CONSTRUCTOR, TypedArray);

    if(CLAMPED ? new TypedArray(1)[TAG] != NAME : !(TAG in TypedArrayPrototype)){
      dP(TypedArrayPrototype, TAG, {
        get: function(){ return NAME; }
      });
    }

    O[NAME] = TypedArray;

    $export($export.G + $export.W + $export.F * (TypedArray != Base), O);

    $export($export.S, NAME, {
      BYTES_PER_ELEMENT: BYTES,
      from: $from,
      of: $of
    });

    if(!(BYTES_PER_ELEMENT in TypedArrayPrototype))hide(TypedArrayPrototype, BYTES_PER_ELEMENT, BYTES);

    $export($export.P, NAME, proto);

    setSpecies(NAME);

    $export($export.P + $export.F * FORCED_SET, NAME, {set: $set});

    $export($export.P + $export.F * !CORRECT_ITER_NAME, NAME, $iterators);

    $export($export.P + $export.F * (TypedArrayPrototype.toString != arrayToString), NAME, {toString: arrayToString});

    $export($export.P + $export.F * fails(function(){
      new TypedArray(1).slice();
    }), NAME, {slice: $slice});

    $export($export.P + $export.F * (fails(function(){
      return [1, 2].toLocaleString() != new TypedArray([1, 2]).toLocaleString()
    }) || !fails(function(){
      TypedArrayPrototype.toLocaleString.call([1, 2]);
    })), NAME, {toLocaleString: $toLocaleString});

    Iterators[NAME] = CORRECT_ITER_NAME ? $nativeIterator : $iterator;
    if(!LIBRARY && !CORRECT_ITER_NAME)hide(TypedArrayPrototype, ITERATOR, $iterator);
  };
} else module.exports = function(){ /* empty */ };
},{"./_an-instance":9,"./_array-copy-within":11,"./_array-fill":12,"./_array-includes":14,"./_array-methods":15,"./_classof":20,"./_ctx":28,"./_descriptors":31,"./_export":35,"./_fails":37,"./_global":41,"./_has":42,"./_hide":43,"./_is-array-iter":49,"./_is-object":52,"./_iter-detect":57,"./_iterators":59,"./_library":61,"./_object-create":69,"./_object-dp":70,"./_object-gopd":73,"./_object-gopn":75,"./_object-gpo":77,"./_property-desc":88,"./_redefine-all":89,"./_same-value":92,"./_set-species":94,"./_species-constructor":98,"./_to-index":108,"./_to-integer":109,"./_to-length":111,"./_to-object":112,"./_to-primitive":113,"./_typed":116,"./_typed-buffer":115,"./_uid":117,"./_wks":120,"./core.get-iterator-method":121,"./es6.array.iterator":133}],115:[function(require,module,exports){
'use strict';
var global         = require('./_global')
  , DESCRIPTORS    = require('./_descriptors')
  , LIBRARY        = require('./_library')
  , $typed         = require('./_typed')
  , hide           = require('./_hide')
  , redefineAll    = require('./_redefine-all')
  , fails          = require('./_fails')
  , anInstance     = require('./_an-instance')
  , toInteger      = require('./_to-integer')
  , toLength       = require('./_to-length')
  , gOPN           = require('./_object-gopn').f
  , dP             = require('./_object-dp').f
  , arrayFill      = require('./_array-fill')
  , setToStringTag = require('./_set-to-string-tag')
  , ARRAY_BUFFER   = 'ArrayBuffer'
  , DATA_VIEW      = 'DataView'
  , PROTOTYPE      = 'prototype'
  , WRONG_LENGTH   = 'Wrong length!'
  , WRONG_INDEX    = 'Wrong index!'
  , $ArrayBuffer   = global[ARRAY_BUFFER]
  , $DataView      = global[DATA_VIEW]
  , Math           = global.Math
  , RangeError     = global.RangeError
  , Infinity       = global.Infinity
  , BaseBuffer     = $ArrayBuffer
  , abs            = Math.abs
  , pow            = Math.pow
  , floor          = Math.floor
  , log            = Math.log
  , LN2            = Math.LN2
  , BUFFER         = 'buffer'
  , BYTE_LENGTH    = 'byteLength'
  , BYTE_OFFSET    = 'byteOffset'
  , $BUFFER        = DESCRIPTORS ? '_b' : BUFFER
  , $LENGTH        = DESCRIPTORS ? '_l' : BYTE_LENGTH
  , $OFFSET        = DESCRIPTORS ? '_o' : BYTE_OFFSET;

// IEEE754 conversions based on https://github.com/feross/ieee754
var packIEEE754 = function(value, mLen, nBytes){
  var buffer = Array(nBytes)
    , eLen   = nBytes * 8 - mLen - 1
    , eMax   = (1 << eLen) - 1
    , eBias  = eMax >> 1
    , rt     = mLen === 23 ? pow(2, -24) - pow(2, -77) : 0
    , i      = 0
    , s      = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0
    , e, m, c;
  value = abs(value)
  if(value != value || value === Infinity){
    m = value != value ? 1 : 0;
    e = eMax;
  } else {
    e = floor(log(value) / LN2);
    if(value * (c = pow(2, -e)) < 1){
      e--;
      c *= 2;
    }
    if(e + eBias >= 1){
      value += rt / c;
    } else {
      value += rt * pow(2, 1 - eBias);
    }
    if(value * c >= 2){
      e++;
      c /= 2;
    }
    if(e + eBias >= eMax){
      m = 0;
      e = eMax;
    } else if(e + eBias >= 1){
      m = (value * c - 1) * pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * pow(2, eBias - 1) * pow(2, mLen);
      e = 0;
    }
  }
  for(; mLen >= 8; buffer[i++] = m & 255, m /= 256, mLen -= 8);
  e = e << mLen | m;
  eLen += mLen;
  for(; eLen > 0; buffer[i++] = e & 255, e /= 256, eLen -= 8);
  buffer[--i] |= s * 128;
  return buffer;
};
var unpackIEEE754 = function(buffer, mLen, nBytes){
  var eLen  = nBytes * 8 - mLen - 1
    , eMax  = (1 << eLen) - 1
    , eBias = eMax >> 1
    , nBits = eLen - 7
    , i     = nBytes - 1
    , s     = buffer[i--]
    , e     = s & 127
    , m;
  s >>= 7;
  for(; nBits > 0; e = e * 256 + buffer[i], i--, nBits -= 8);
  m = e & (1 << -nBits) - 1;
  e >>= -nBits;
  nBits += mLen;
  for(; nBits > 0; m = m * 256 + buffer[i], i--, nBits -= 8);
  if(e === 0){
    e = 1 - eBias;
  } else if(e === eMax){
    return m ? NaN : s ? -Infinity : Infinity;
  } else {
    m = m + pow(2, mLen);
    e = e - eBias;
  } return (s ? -1 : 1) * m * pow(2, e - mLen);
};

var unpackI32 = function(bytes){
  return bytes[3] << 24 | bytes[2] << 16 | bytes[1] << 8 | bytes[0];
};
var packI8 = function(it){
  return [it & 0xff];
};
var packI16 = function(it){
  return [it & 0xff, it >> 8 & 0xff];
};
var packI32 = function(it){
  return [it & 0xff, it >> 8 & 0xff, it >> 16 & 0xff, it >> 24 & 0xff];
};
var packF64 = function(it){
  return packIEEE754(it, 52, 8);
};
var packF32 = function(it){
  return packIEEE754(it, 23, 4);
};

var addGetter = function(C, key, internal){
  dP(C[PROTOTYPE], key, {get: function(){ return this[internal]; }});
};

var get = function(view, bytes, index, isLittleEndian){
  var numIndex = +index
    , intIndex = toInteger(numIndex);
  if(numIndex != intIndex || intIndex < 0 || intIndex + bytes > view[$LENGTH])throw RangeError(WRONG_INDEX);
  var store = view[$BUFFER]._b
    , start = intIndex + view[$OFFSET]
    , pack  = store.slice(start, start + bytes);
  return isLittleEndian ? pack : pack.reverse();
};
var set = function(view, bytes, index, conversion, value, isLittleEndian){
  var numIndex = +index
    , intIndex = toInteger(numIndex);
  if(numIndex != intIndex || intIndex < 0 || intIndex + bytes > view[$LENGTH])throw RangeError(WRONG_INDEX);
  var store = view[$BUFFER]._b
    , start = intIndex + view[$OFFSET]
    , pack  = conversion(+value);
  for(var i = 0; i < bytes; i++)store[start + i] = pack[isLittleEndian ? i : bytes - i - 1];
};

var validateArrayBufferArguments = function(that, length){
  anInstance(that, $ArrayBuffer, ARRAY_BUFFER);
  var numberLength = +length
    , byteLength   = toLength(numberLength);
  if(numberLength != byteLength)throw RangeError(WRONG_LENGTH);
  return byteLength;
};

if(!$typed.ABV){
  $ArrayBuffer = function ArrayBuffer(length){
    var byteLength = validateArrayBufferArguments(this, length);
    this._b       = arrayFill.call(Array(byteLength), 0);
    this[$LENGTH] = byteLength;
  };

  $DataView = function DataView(buffer, byteOffset, byteLength){
    anInstance(this, $DataView, DATA_VIEW);
    anInstance(buffer, $ArrayBuffer, DATA_VIEW);
    var bufferLength = buffer[$LENGTH]
      , offset       = toInteger(byteOffset);
    if(offset < 0 || offset > bufferLength)throw RangeError('Wrong offset!');
    byteLength = byteLength === undefined ? bufferLength - offset : toLength(byteLength);
    if(offset + byteLength > bufferLength)throw RangeError(WRONG_LENGTH);
    this[$BUFFER] = buffer;
    this[$OFFSET] = offset;
    this[$LENGTH] = byteLength;
  };

  if(DESCRIPTORS){
    addGetter($ArrayBuffer, BYTE_LENGTH, '_l');
    addGetter($DataView, BUFFER, '_b');
    addGetter($DataView, BYTE_LENGTH, '_l');
    addGetter($DataView, BYTE_OFFSET, '_o');
  }

  redefineAll($DataView[PROTOTYPE], {
    getInt8: function getInt8(byteOffset){
      return get(this, 1, byteOffset)[0] << 24 >> 24;
    },
    getUint8: function getUint8(byteOffset){
      return get(this, 1, byteOffset)[0];
    },
    getInt16: function getInt16(byteOffset /*, littleEndian */){
      var bytes = get(this, 2, byteOffset, arguments[1]);
      return (bytes[1] << 8 | bytes[0]) << 16 >> 16;
    },
    getUint16: function getUint16(byteOffset /*, littleEndian */){
      var bytes = get(this, 2, byteOffset, arguments[1]);
      return bytes[1] << 8 | bytes[0];
    },
    getInt32: function getInt32(byteOffset /*, littleEndian */){
      return unpackI32(get(this, 4, byteOffset, arguments[1]));
    },
    getUint32: function getUint32(byteOffset /*, littleEndian */){
      return unpackI32(get(this, 4, byteOffset, arguments[1])) >>> 0;
    },
    getFloat32: function getFloat32(byteOffset /*, littleEndian */){
      return unpackIEEE754(get(this, 4, byteOffset, arguments[1]), 23, 4);
    },
    getFloat64: function getFloat64(byteOffset /*, littleEndian */){
      return unpackIEEE754(get(this, 8, byteOffset, arguments[1]), 52, 8);
    },
    setInt8: function setInt8(byteOffset, value){
      set(this, 1, byteOffset, packI8, value);
    },
    setUint8: function setUint8(byteOffset, value){
      set(this, 1, byteOffset, packI8, value);
    },
    setInt16: function setInt16(byteOffset, value /*, littleEndian */){
      set(this, 2, byteOffset, packI16, value, arguments[2]);
    },
    setUint16: function setUint16(byteOffset, value /*, littleEndian */){
      set(this, 2, byteOffset, packI16, value, arguments[2]);
    },
    setInt32: function setInt32(byteOffset, value /*, littleEndian */){
      set(this, 4, byteOffset, packI32, value, arguments[2]);
    },
    setUint32: function setUint32(byteOffset, value /*, littleEndian */){
      set(this, 4, byteOffset, packI32, value, arguments[2]);
    },
    setFloat32: function setFloat32(byteOffset, value /*, littleEndian */){
      set(this, 4, byteOffset, packF32, value, arguments[2]);
    },
    setFloat64: function setFloat64(byteOffset, value /*, littleEndian */){
      set(this, 8, byteOffset, packF64, value, arguments[2]);
    }
  });
} else {
  if(!fails(function(){
    new $ArrayBuffer;     // eslint-disable-line no-new
  }) || !fails(function(){
    new $ArrayBuffer(.5); // eslint-disable-line no-new
  })){
    $ArrayBuffer = function ArrayBuffer(length){
      return new BaseBuffer(validateArrayBufferArguments(this, length));
    };
    var ArrayBufferProto = $ArrayBuffer[PROTOTYPE] = BaseBuffer[PROTOTYPE];
    for(var keys = gOPN(BaseBuffer), j = 0, key; keys.length > j; ){
      if(!((key = keys[j++]) in $ArrayBuffer))hide($ArrayBuffer, key, BaseBuffer[key]);
    };
    if(!LIBRARY)ArrayBufferProto.constructor = $ArrayBuffer;
  }
  // iOS Safari 7.x bug
  var view = new $DataView(new $ArrayBuffer(2))
    , $setInt8 = $DataView[PROTOTYPE].setInt8;
  view.setInt8(0, 2147483648);
  view.setInt8(1, 2147483649);
  if(view.getInt8(0) || !view.getInt8(1))redefineAll($DataView[PROTOTYPE], {
    setInt8: function setInt8(byteOffset, value){
      $setInt8.call(this, byteOffset, value << 24 >> 24);
    },
    setUint8: function setUint8(byteOffset, value){
      $setInt8.call(this, byteOffset, value << 24 >> 24);
    }
  }, true);
}
setToStringTag($ArrayBuffer, ARRAY_BUFFER);
setToStringTag($DataView, DATA_VIEW);
hide($DataView[PROTOTYPE], $typed.VIEW, true);
exports[ARRAY_BUFFER] = $ArrayBuffer;
exports[DATA_VIEW] = $DataView;
},{"./_an-instance":9,"./_array-fill":12,"./_descriptors":31,"./_fails":37,"./_global":41,"./_hide":43,"./_library":61,"./_object-dp":70,"./_object-gopn":75,"./_redefine-all":89,"./_set-to-string-tag":95,"./_to-integer":109,"./_to-length":111,"./_typed":116}],116:[function(require,module,exports){
var global = require('./_global')
  , hide   = require('./_hide')
  , uid    = require('./_uid')
  , TYPED  = uid('typed_array')
  , VIEW   = uid('view')
  , ABV    = !!(global.ArrayBuffer && global.DataView)
  , CONSTR = ABV
  , i = 0, l = 9, Typed;

var TypedArrayConstructors = (
  'Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array'
).split(',');

while(i < l){
  if(Typed = global[TypedArrayConstructors[i++]]){
    hide(Typed.prototype, TYPED, true);
    hide(Typed.prototype, VIEW, true);
  } else CONSTR = false;
}

module.exports = {
  ABV:    ABV,
  CONSTR: CONSTR,
  TYPED:  TYPED,
  VIEW:   VIEW
};
},{"./_global":41,"./_hide":43,"./_uid":117}],117:[function(require,module,exports){
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
},{}],118:[function(require,module,exports){
var global         = require('./_global')
  , core           = require('./_core')
  , LIBRARY        = require('./_library')
  , wksExt         = require('./_wks-ext')
  , defineProperty = require('./_object-dp').f;
module.exports = function(name){
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if(name.charAt(0) != '_' && !(name in $Symbol))defineProperty($Symbol, name, {value: wksExt.f(name)});
};
},{"./_core":26,"./_global":41,"./_library":61,"./_object-dp":70,"./_wks-ext":119}],119:[function(require,module,exports){
exports.f = require('./_wks');
},{"./_wks":120}],120:[function(require,module,exports){
var store      = require('./_shared')('wks')
  , uid        = require('./_uid')
  , Symbol     = require('./_global').Symbol
  , USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function(name){
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;
},{"./_global":41,"./_shared":97,"./_uid":117}],121:[function(require,module,exports){
var classof   = require('./_classof')
  , ITERATOR  = require('./_wks')('iterator')
  , Iterators = require('./_iterators');
module.exports = require('./_core').getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
},{"./_classof":20,"./_core":26,"./_iterators":59,"./_wks":120}],122:[function(require,module,exports){
// https://github.com/benjamingr/RexExp.escape
var $export = require('./_export')
  , $re     = require('./_replacer')(/[\\^$*+?.()|[\]{}]/g, '\\$&');

$export($export.S, 'RegExp', {escape: function escape(it){ return $re(it); }});

},{"./_export":35,"./_replacer":91}],123:[function(require,module,exports){
// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
var $export = require('./_export');

$export($export.P, 'Array', {copyWithin: require('./_array-copy-within')});

require('./_add-to-unscopables')('copyWithin');
},{"./_add-to-unscopables":8,"./_array-copy-within":11,"./_export":35}],124:[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $every  = require('./_array-methods')(4);

$export($export.P + $export.F * !require('./_strict-method')([].every, true), 'Array', {
  // 22.1.3.5 / 15.4.4.16 Array.prototype.every(callbackfn [, thisArg])
  every: function every(callbackfn /* , thisArg */){
    return $every(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":15,"./_export":35,"./_strict-method":99}],125:[function(require,module,exports){
// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
var $export = require('./_export');

$export($export.P, 'Array', {fill: require('./_array-fill')});

require('./_add-to-unscopables')('fill');
},{"./_add-to-unscopables":8,"./_array-fill":12,"./_export":35}],126:[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $filter = require('./_array-methods')(2);

$export($export.P + $export.F * !require('./_strict-method')([].filter, true), 'Array', {
  // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
  filter: function filter(callbackfn /* , thisArg */){
    return $filter(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":15,"./_export":35,"./_strict-method":99}],127:[function(require,module,exports){
'use strict';
// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
var $export = require('./_export')
  , $find   = require('./_array-methods')(6)
  , KEY     = 'findIndex'
  , forced  = true;
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  findIndex: function findIndex(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./_add-to-unscopables')(KEY);
},{"./_add-to-unscopables":8,"./_array-methods":15,"./_export":35}],128:[function(require,module,exports){
'use strict';
// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
var $export = require('./_export')
  , $find   = require('./_array-methods')(5)
  , KEY     = 'find'
  , forced  = true;
// Shouldn't skip holes
if(KEY in [])Array(1)[KEY](function(){ forced = false; });
$export($export.P + $export.F * forced, 'Array', {
  find: function find(callbackfn/*, that = undefined */){
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./_add-to-unscopables')(KEY);
},{"./_add-to-unscopables":8,"./_array-methods":15,"./_export":35}],129:[function(require,module,exports){
'use strict';
var $export  = require('./_export')
  , $forEach = require('./_array-methods')(0)
  , STRICT   = require('./_strict-method')([].forEach, true);

$export($export.P + $export.F * !STRICT, 'Array', {
  // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
  forEach: function forEach(callbackfn /* , thisArg */){
    return $forEach(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":15,"./_export":35,"./_strict-method":99}],130:[function(require,module,exports){
'use strict';
var ctx            = require('./_ctx')
  , $export        = require('./_export')
  , toObject       = require('./_to-object')
  , call           = require('./_iter-call')
  , isArrayIter    = require('./_is-array-iter')
  , toLength       = require('./_to-length')
  , createProperty = require('./_create-property')
  , getIterFn      = require('./core.get-iterator-method');

$export($export.S + $export.F * !require('./_iter-detect')(function(iter){ Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
    var O       = toObject(arrayLike)
      , C       = typeof this == 'function' ? this : Array
      , aLen    = arguments.length
      , mapfn   = aLen > 1 ? arguments[1] : undefined
      , mapping = mapfn !== undefined
      , index   = 0
      , iterFn  = getIterFn(O)
      , length, result, step, iterator;
    if(mapping)mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for(result = new C(length); length > index; index++){
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});

},{"./_create-property":27,"./_ctx":28,"./_export":35,"./_is-array-iter":49,"./_iter-call":54,"./_iter-detect":57,"./_to-length":111,"./_to-object":112,"./core.get-iterator-method":121}],131:[function(require,module,exports){
'use strict';
var $export       = require('./_export')
  , $indexOf      = require('./_array-includes')(false)
  , $native       = [].indexOf
  , NEGATIVE_ZERO = !!$native && 1 / [1].indexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
  // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
  indexOf: function indexOf(searchElement /*, fromIndex = 0 */){
    return NEGATIVE_ZERO
      // convert -0 to +0
      ? $native.apply(this, arguments) || 0
      : $indexOf(this, searchElement, arguments[1]);
  }
});
},{"./_array-includes":14,"./_export":35,"./_strict-method":99}],132:[function(require,module,exports){
// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = require('./_export');

$export($export.S, 'Array', {isArray: require('./_is-array')});
},{"./_export":35,"./_is-array":50}],133:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./_add-to-unscopables')
  , step             = require('./_iter-step')
  , Iterators        = require('./_iterators')
  , toIObject        = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');
},{"./_add-to-unscopables":8,"./_iter-define":56,"./_iter-step":58,"./_iterators":59,"./_to-iobject":110}],134:[function(require,module,exports){
'use strict';
// 22.1.3.13 Array.prototype.join(separator)
var $export   = require('./_export')
  , toIObject = require('./_to-iobject')
  , arrayJoin = [].join;

// fallback for not array-like strings
$export($export.P + $export.F * (require('./_iobject') != Object || !require('./_strict-method')(arrayJoin)), 'Array', {
  join: function join(separator){
    return arrayJoin.call(toIObject(this), separator === undefined ? ',' : separator);
  }
});
},{"./_export":35,"./_iobject":48,"./_strict-method":99,"./_to-iobject":110}],135:[function(require,module,exports){
'use strict';
var $export       = require('./_export')
  , toIObject     = require('./_to-iobject')
  , toInteger     = require('./_to-integer')
  , toLength      = require('./_to-length')
  , $native       = [].lastIndexOf
  , NEGATIVE_ZERO = !!$native && 1 / [1].lastIndexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
  // 22.1.3.14 / 15.4.4.15 Array.prototype.lastIndexOf(searchElement [, fromIndex])
  lastIndexOf: function lastIndexOf(searchElement /*, fromIndex = @[*-1] */){
    // convert -0 to +0
    if(NEGATIVE_ZERO)return $native.apply(this, arguments) || 0;
    var O      = toIObject(this)
      , length = toLength(O.length)
      , index  = length - 1;
    if(arguments.length > 1)index = Math.min(index, toInteger(arguments[1]));
    if(index < 0)index = length + index;
    for(;index >= 0; index--)if(index in O)if(O[index] === searchElement)return index || 0;
    return -1;
  }
});
},{"./_export":35,"./_strict-method":99,"./_to-integer":109,"./_to-iobject":110,"./_to-length":111}],136:[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $map    = require('./_array-methods')(1);

$export($export.P + $export.F * !require('./_strict-method')([].map, true), 'Array', {
  // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
  map: function map(callbackfn /* , thisArg */){
    return $map(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":15,"./_export":35,"./_strict-method":99}],137:[function(require,module,exports){
'use strict';
var $export        = require('./_export')
  , createProperty = require('./_create-property');

// WebKit Array.of isn't generic
$export($export.S + $export.F * require('./_fails')(function(){
  function F(){}
  return !(Array.of.call(F) instanceof F);
}), 'Array', {
  // 22.1.2.3 Array.of( ...items)
  of: function of(/* ...args */){
    var index  = 0
      , aLen   = arguments.length
      , result = new (typeof this == 'function' ? this : Array)(aLen);
    while(aLen > index)createProperty(result, index, arguments[index++]);
    result.length = aLen;
    return result;
  }
});
},{"./_create-property":27,"./_export":35,"./_fails":37}],138:[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $reduce = require('./_array-reduce');

$export($export.P + $export.F * !require('./_strict-method')([].reduceRight, true), 'Array', {
  // 22.1.3.19 / 15.4.4.22 Array.prototype.reduceRight(callbackfn [, initialValue])
  reduceRight: function reduceRight(callbackfn /* , initialValue */){
    return $reduce(this, callbackfn, arguments.length, arguments[1], true);
  }
});
},{"./_array-reduce":16,"./_export":35,"./_strict-method":99}],139:[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $reduce = require('./_array-reduce');

$export($export.P + $export.F * !require('./_strict-method')([].reduce, true), 'Array', {
  // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
  reduce: function reduce(callbackfn /* , initialValue */){
    return $reduce(this, callbackfn, arguments.length, arguments[1], false);
  }
});
},{"./_array-reduce":16,"./_export":35,"./_strict-method":99}],140:[function(require,module,exports){
'use strict';
var $export    = require('./_export')
  , html       = require('./_html')
  , cof        = require('./_cof')
  , toIndex    = require('./_to-index')
  , toLength   = require('./_to-length')
  , arraySlice = [].slice;

// fallback for not array-like ES3 strings and DOM objects
$export($export.P + $export.F * require('./_fails')(function(){
  if(html)arraySlice.call(html);
}), 'Array', {
  slice: function slice(begin, end){
    var len   = toLength(this.length)
      , klass = cof(this);
    end = end === undefined ? len : end;
    if(klass == 'Array')return arraySlice.call(this, begin, end);
    var start  = toIndex(begin, len)
      , upTo   = toIndex(end, len)
      , size   = toLength(upTo - start)
      , cloned = Array(size)
      , i      = 0;
    for(; i < size; i++)cloned[i] = klass == 'String'
      ? this.charAt(start + i)
      : this[start + i];
    return cloned;
  }
});
},{"./_cof":21,"./_export":35,"./_fails":37,"./_html":44,"./_to-index":108,"./_to-length":111}],141:[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $some   = require('./_array-methods')(3);

$export($export.P + $export.F * !require('./_strict-method')([].some, true), 'Array', {
  // 22.1.3.23 / 15.4.4.17 Array.prototype.some(callbackfn [, thisArg])
  some: function some(callbackfn /* , thisArg */){
    return $some(this, callbackfn, arguments[1]);
  }
});
},{"./_array-methods":15,"./_export":35,"./_strict-method":99}],142:[function(require,module,exports){
'use strict';
var $export   = require('./_export')
  , aFunction = require('./_a-function')
  , toObject  = require('./_to-object')
  , fails     = require('./_fails')
  , $sort     = [].sort
  , test      = [1, 2, 3];

$export($export.P + $export.F * (fails(function(){
  // IE8-
  test.sort(undefined);
}) || !fails(function(){
  // V8 bug
  test.sort(null);
  // Old WebKit
}) || !require('./_strict-method')($sort)), 'Array', {
  // 22.1.3.25 Array.prototype.sort(comparefn)
  sort: function sort(comparefn){
    return comparefn === undefined
      ? $sort.call(toObject(this))
      : $sort.call(toObject(this), aFunction(comparefn));
  }
});
},{"./_a-function":6,"./_export":35,"./_fails":37,"./_strict-method":99,"./_to-object":112}],143:[function(require,module,exports){
require('./_set-species')('Array');
},{"./_set-species":94}],144:[function(require,module,exports){
// 20.3.3.1 / 15.9.4.4 Date.now()
var $export = require('./_export');

$export($export.S, 'Date', {now: function(){ return new Date().getTime(); }});
},{"./_export":35}],145:[function(require,module,exports){
'use strict';
// 20.3.4.36 / 15.9.5.43 Date.prototype.toISOString()
var $export = require('./_export')
  , fails   = require('./_fails')
  , getTime = Date.prototype.getTime;

var lz = function(num){
  return num > 9 ? num : '0' + num;
};

// PhantomJS / old WebKit has a broken implementations
$export($export.P + $export.F * (fails(function(){
  return new Date(-5e13 - 1).toISOString() != '0385-07-25T07:06:39.999Z';
}) || !fails(function(){
  new Date(NaN).toISOString();
})), 'Date', {
  toISOString: function toISOString(){
    if(!isFinite(getTime.call(this)))throw RangeError('Invalid time value');
    var d = this
      , y = d.getUTCFullYear()
      , m = d.getUTCMilliseconds()
      , s = y < 0 ? '-' : y > 9999 ? '+' : '';
    return s + ('00000' + Math.abs(y)).slice(s ? -6 : -4) +
      '-' + lz(d.getUTCMonth() + 1) + '-' + lz(d.getUTCDate()) +
      'T' + lz(d.getUTCHours()) + ':' + lz(d.getUTCMinutes()) +
      ':' + lz(d.getUTCSeconds()) + '.' + (m > 99 ? m : '0' + lz(m)) + 'Z';
  }
});
},{"./_export":35,"./_fails":37}],146:[function(require,module,exports){
'use strict';
var $export     = require('./_export')
  , toObject    = require('./_to-object')
  , toPrimitive = require('./_to-primitive');

$export($export.P + $export.F * require('./_fails')(function(){
  return new Date(NaN).toJSON() !== null || Date.prototype.toJSON.call({toISOString: function(){ return 1; }}) !== 1;
}), 'Date', {
  toJSON: function toJSON(key){
    var O  = toObject(this)
      , pv = toPrimitive(O);
    return typeof pv == 'number' && !isFinite(pv) ? null : O.toISOString();
  }
});
},{"./_export":35,"./_fails":37,"./_to-object":112,"./_to-primitive":113}],147:[function(require,module,exports){
var TO_PRIMITIVE = require('./_wks')('toPrimitive')
  , proto        = Date.prototype;

if(!(TO_PRIMITIVE in proto))require('./_hide')(proto, TO_PRIMITIVE, require('./_date-to-primitive'));
},{"./_date-to-primitive":29,"./_hide":43,"./_wks":120}],148:[function(require,module,exports){
var DateProto    = Date.prototype
  , INVALID_DATE = 'Invalid Date'
  , TO_STRING    = 'toString'
  , $toString    = DateProto[TO_STRING]
  , getTime      = DateProto.getTime;
if(new Date(NaN) + '' != INVALID_DATE){
  require('./_redefine')(DateProto, TO_STRING, function toString(){
    var value = getTime.call(this);
    return value === value ? $toString.call(this) : INVALID_DATE;
  });
}
},{"./_redefine":90}],149:[function(require,module,exports){
// 19.2.3.2 / 15.3.4.5 Function.prototype.bind(thisArg, args...)
var $export = require('./_export');

$export($export.P, 'Function', {bind: require('./_bind')});
},{"./_bind":19,"./_export":35}],150:[function(require,module,exports){
'use strict';
var isObject       = require('./_is-object')
  , getPrototypeOf = require('./_object-gpo')
  , HAS_INSTANCE   = require('./_wks')('hasInstance')
  , FunctionProto  = Function.prototype;
// 19.2.3.6 Function.prototype[@@hasInstance](V)
if(!(HAS_INSTANCE in FunctionProto))require('./_object-dp').f(FunctionProto, HAS_INSTANCE, {value: function(O){
  if(typeof this != 'function' || !isObject(O))return false;
  if(!isObject(this.prototype))return O instanceof this;
  // for environment w/o native `@@hasInstance` logic enough `instanceof`, but add this:
  while(O = getPrototypeOf(O))if(this.prototype === O)return true;
  return false;
}});
},{"./_is-object":52,"./_object-dp":70,"./_object-gpo":77,"./_wks":120}],151:[function(require,module,exports){
var dP         = require('./_object-dp').f
  , createDesc = require('./_property-desc')
  , has        = require('./_has')
  , FProto     = Function.prototype
  , nameRE     = /^\s*function ([^ (]*)/
  , NAME       = 'name';

var isExtensible = Object.isExtensible || function(){
  return true;
};

// 19.2.4.2 name
NAME in FProto || require('./_descriptors') && dP(FProto, NAME, {
  configurable: true,
  get: function(){
    try {
      var that = this
        , name = ('' + that).match(nameRE)[1];
      has(that, NAME) || !isExtensible(that) || dP(that, NAME, createDesc(5, name));
      return name;
    } catch(e){
      return '';
    }
  }
});
},{"./_descriptors":31,"./_has":42,"./_object-dp":70,"./_property-desc":88}],152:[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');

// 23.1 Map Objects
module.exports = require('./_collection')('Map', function(get){
  return function Map(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.1.3.6 Map.prototype.get(key)
  get: function get(key){
    var entry = strong.getEntry(this, key);
    return entry && entry.v;
  },
  // 23.1.3.9 Map.prototype.set(key, value)
  set: function set(key, value){
    return strong.def(this, key === 0 ? 0 : key, value);
  }
}, strong, true);
},{"./_collection":25,"./_collection-strong":22}],153:[function(require,module,exports){
// 20.2.2.3 Math.acosh(x)
var $export = require('./_export')
  , log1p   = require('./_math-log1p')
  , sqrt    = Math.sqrt
  , $acosh  = Math.acosh;

$export($export.S + $export.F * !($acosh
  // V8 bug: https://code.google.com/p/v8/issues/detail?id=3509
  && Math.floor($acosh(Number.MAX_VALUE)) == 710
  // Tor Browser bug: Math.acosh(Infinity) -> NaN 
  && $acosh(Infinity) == Infinity
), 'Math', {
  acosh: function acosh(x){
    return (x = +x) < 1 ? NaN : x > 94906265.62425156
      ? Math.log(x) + Math.LN2
      : log1p(x - 1 + sqrt(x - 1) * sqrt(x + 1));
  }
});
},{"./_export":35,"./_math-log1p":63}],154:[function(require,module,exports){
// 20.2.2.5 Math.asinh(x)
var $export = require('./_export')
  , $asinh  = Math.asinh;

function asinh(x){
  return !isFinite(x = +x) || x == 0 ? x : x < 0 ? -asinh(-x) : Math.log(x + Math.sqrt(x * x + 1));
}

// Tor Browser bug: Math.asinh(0) -> -0 
$export($export.S + $export.F * !($asinh && 1 / $asinh(0) > 0), 'Math', {asinh: asinh});
},{"./_export":35}],155:[function(require,module,exports){
// 20.2.2.7 Math.atanh(x)
var $export = require('./_export')
  , $atanh  = Math.atanh;

// Tor Browser bug: Math.atanh(-0) -> 0 
$export($export.S + $export.F * !($atanh && 1 / $atanh(-0) < 0), 'Math', {
  atanh: function atanh(x){
    return (x = +x) == 0 ? x : Math.log((1 + x) / (1 - x)) / 2;
  }
});
},{"./_export":35}],156:[function(require,module,exports){
// 20.2.2.9 Math.cbrt(x)
var $export = require('./_export')
  , sign    = require('./_math-sign');

$export($export.S, 'Math', {
  cbrt: function cbrt(x){
    return sign(x = +x) * Math.pow(Math.abs(x), 1 / 3);
  }
});
},{"./_export":35,"./_math-sign":64}],157:[function(require,module,exports){
// 20.2.2.11 Math.clz32(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  clz32: function clz32(x){
    return (x >>>= 0) ? 31 - Math.floor(Math.log(x + 0.5) * Math.LOG2E) : 32;
  }
});
},{"./_export":35}],158:[function(require,module,exports){
// 20.2.2.12 Math.cosh(x)
var $export = require('./_export')
  , exp     = Math.exp;

$export($export.S, 'Math', {
  cosh: function cosh(x){
    return (exp(x = +x) + exp(-x)) / 2;
  }
});
},{"./_export":35}],159:[function(require,module,exports){
// 20.2.2.14 Math.expm1(x)
var $export = require('./_export')
  , $expm1  = require('./_math-expm1');

$export($export.S + $export.F * ($expm1 != Math.expm1), 'Math', {expm1: $expm1});
},{"./_export":35,"./_math-expm1":62}],160:[function(require,module,exports){
// 20.2.2.16 Math.fround(x)
var $export   = require('./_export')
  , sign      = require('./_math-sign')
  , pow       = Math.pow
  , EPSILON   = pow(2, -52)
  , EPSILON32 = pow(2, -23)
  , MAX32     = pow(2, 127) * (2 - EPSILON32)
  , MIN32     = pow(2, -126);

var roundTiesToEven = function(n){
  return n + 1 / EPSILON - 1 / EPSILON;
};


$export($export.S, 'Math', {
  fround: function fround(x){
    var $abs  = Math.abs(x)
      , $sign = sign(x)
      , a, result;
    if($abs < MIN32)return $sign * roundTiesToEven($abs / MIN32 / EPSILON32) * MIN32 * EPSILON32;
    a = (1 + EPSILON32 / EPSILON) * $abs;
    result = a - (a - $abs);
    if(result > MAX32 || result != result)return $sign * Infinity;
    return $sign * result;
  }
});
},{"./_export":35,"./_math-sign":64}],161:[function(require,module,exports){
// 20.2.2.17 Math.hypot([value1[, value2[, … ]]])
var $export = require('./_export')
  , abs     = Math.abs;

$export($export.S, 'Math', {
  hypot: function hypot(value1, value2){ // eslint-disable-line no-unused-vars
    var sum  = 0
      , i    = 0
      , aLen = arguments.length
      , larg = 0
      , arg, div;
    while(i < aLen){
      arg = abs(arguments[i++]);
      if(larg < arg){
        div  = larg / arg;
        sum  = sum * div * div + 1;
        larg = arg;
      } else if(arg > 0){
        div  = arg / larg;
        sum += div * div;
      } else sum += arg;
    }
    return larg === Infinity ? Infinity : larg * Math.sqrt(sum);
  }
});
},{"./_export":35}],162:[function(require,module,exports){
// 20.2.2.18 Math.imul(x, y)
var $export = require('./_export')
  , $imul   = Math.imul;

// some WebKit versions fails with big numbers, some has wrong arity
$export($export.S + $export.F * require('./_fails')(function(){
  return $imul(0xffffffff, 5) != -5 || $imul.length != 2;
}), 'Math', {
  imul: function imul(x, y){
    var UINT16 = 0xffff
      , xn = +x
      , yn = +y
      , xl = UINT16 & xn
      , yl = UINT16 & yn;
    return 0 | xl * yl + ((UINT16 & xn >>> 16) * yl + xl * (UINT16 & yn >>> 16) << 16 >>> 0);
  }
});
},{"./_export":35,"./_fails":37}],163:[function(require,module,exports){
// 20.2.2.21 Math.log10(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  log10: function log10(x){
    return Math.log(x) / Math.LN10;
  }
});
},{"./_export":35}],164:[function(require,module,exports){
// 20.2.2.20 Math.log1p(x)
var $export = require('./_export');

$export($export.S, 'Math', {log1p: require('./_math-log1p')});
},{"./_export":35,"./_math-log1p":63}],165:[function(require,module,exports){
// 20.2.2.22 Math.log2(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  log2: function log2(x){
    return Math.log(x) / Math.LN2;
  }
});
},{"./_export":35}],166:[function(require,module,exports){
// 20.2.2.28 Math.sign(x)
var $export = require('./_export');

$export($export.S, 'Math', {sign: require('./_math-sign')});
},{"./_export":35,"./_math-sign":64}],167:[function(require,module,exports){
// 20.2.2.30 Math.sinh(x)
var $export = require('./_export')
  , expm1   = require('./_math-expm1')
  , exp     = Math.exp;

// V8 near Chromium 38 has a problem with very small numbers
$export($export.S + $export.F * require('./_fails')(function(){
  return !Math.sinh(-2e-17) != -2e-17;
}), 'Math', {
  sinh: function sinh(x){
    return Math.abs(x = +x) < 1
      ? (expm1(x) - expm1(-x)) / 2
      : (exp(x - 1) - exp(-x - 1)) * (Math.E / 2);
  }
});
},{"./_export":35,"./_fails":37,"./_math-expm1":62}],168:[function(require,module,exports){
// 20.2.2.33 Math.tanh(x)
var $export = require('./_export')
  , expm1   = require('./_math-expm1')
  , exp     = Math.exp;

$export($export.S, 'Math', {
  tanh: function tanh(x){
    var a = expm1(x = +x)
      , b = expm1(-x);
    return a == Infinity ? 1 : b == Infinity ? -1 : (a - b) / (exp(x) + exp(-x));
  }
});
},{"./_export":35,"./_math-expm1":62}],169:[function(require,module,exports){
// 20.2.2.34 Math.trunc(x)
var $export = require('./_export');

$export($export.S, 'Math', {
  trunc: function trunc(it){
    return (it > 0 ? Math.floor : Math.ceil)(it);
  }
});
},{"./_export":35}],170:[function(require,module,exports){
'use strict';
var global            = require('./_global')
  , has               = require('./_has')
  , cof               = require('./_cof')
  , inheritIfRequired = require('./_inherit-if-required')
  , toPrimitive       = require('./_to-primitive')
  , fails             = require('./_fails')
  , gOPN              = require('./_object-gopn').f
  , gOPD              = require('./_object-gopd').f
  , dP                = require('./_object-dp').f
  , $trim             = require('./_string-trim').trim
  , NUMBER            = 'Number'
  , $Number           = global[NUMBER]
  , Base              = $Number
  , proto             = $Number.prototype
  // Opera ~12 has broken Object#toString
  , BROKEN_COF        = cof(require('./_object-create')(proto)) == NUMBER
  , TRIM              = 'trim' in String.prototype;

// 7.1.3 ToNumber(argument)
var toNumber = function(argument){
  var it = toPrimitive(argument, false);
  if(typeof it == 'string' && it.length > 2){
    it = TRIM ? it.trim() : $trim(it, 3);
    var first = it.charCodeAt(0)
      , third, radix, maxCode;
    if(first === 43 || first === 45){
      third = it.charCodeAt(2);
      if(third === 88 || third === 120)return NaN; // Number('+0x1') should be NaN, old V8 fix
    } else if(first === 48){
      switch(it.charCodeAt(1)){
        case 66 : case 98  : radix = 2; maxCode = 49; break; // fast equal /^0b[01]+$/i
        case 79 : case 111 : radix = 8; maxCode = 55; break; // fast equal /^0o[0-7]+$/i
        default : return +it;
      }
      for(var digits = it.slice(2), i = 0, l = digits.length, code; i < l; i++){
        code = digits.charCodeAt(i);
        // parseInt parses a string to a first unavailable symbol
        // but ToNumber should return NaN if a string contains unavailable symbols
        if(code < 48 || code > maxCode)return NaN;
      } return parseInt(digits, radix);
    }
  } return +it;
};

if(!$Number(' 0o1') || !$Number('0b1') || $Number('+0x1')){
  $Number = function Number(value){
    var it = arguments.length < 1 ? 0 : value
      , that = this;
    return that instanceof $Number
      // check on 1..constructor(foo) case
      && (BROKEN_COF ? fails(function(){ proto.valueOf.call(that); }) : cof(that) != NUMBER)
        ? inheritIfRequired(new Base(toNumber(it)), that, $Number) : toNumber(it);
  };
  for(var keys = require('./_descriptors') ? gOPN(Base) : (
    // ES3:
    'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
    // ES6 (in case, if modules with ES6 Number statics required before):
    'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
    'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
  ).split(','), j = 0, key; keys.length > j; j++){
    if(has(Base, key = keys[j]) && !has($Number, key)){
      dP($Number, key, gOPD(Base, key));
    }
  }
  $Number.prototype = proto;
  proto.constructor = $Number;
  require('./_redefine')(global, NUMBER, $Number);
}
},{"./_cof":21,"./_descriptors":31,"./_fails":37,"./_global":41,"./_has":42,"./_inherit-if-required":46,"./_object-create":69,"./_object-dp":70,"./_object-gopd":73,"./_object-gopn":75,"./_redefine":90,"./_string-trim":105,"./_to-primitive":113}],171:[function(require,module,exports){
// 20.1.2.1 Number.EPSILON
var $export = require('./_export');

$export($export.S, 'Number', {EPSILON: Math.pow(2, -52)});
},{"./_export":35}],172:[function(require,module,exports){
// 20.1.2.2 Number.isFinite(number)
var $export   = require('./_export')
  , _isFinite = require('./_global').isFinite;

$export($export.S, 'Number', {
  isFinite: function isFinite(it){
    return typeof it == 'number' && _isFinite(it);
  }
});
},{"./_export":35,"./_global":41}],173:[function(require,module,exports){
// 20.1.2.3 Number.isInteger(number)
var $export = require('./_export');

$export($export.S, 'Number', {isInteger: require('./_is-integer')});
},{"./_export":35,"./_is-integer":51}],174:[function(require,module,exports){
// 20.1.2.4 Number.isNaN(number)
var $export = require('./_export');

$export($export.S, 'Number', {
  isNaN: function isNaN(number){
    return number != number;
  }
});
},{"./_export":35}],175:[function(require,module,exports){
// 20.1.2.5 Number.isSafeInteger(number)
var $export   = require('./_export')
  , isInteger = require('./_is-integer')
  , abs       = Math.abs;

$export($export.S, 'Number', {
  isSafeInteger: function isSafeInteger(number){
    return isInteger(number) && abs(number) <= 0x1fffffffffffff;
  }
});
},{"./_export":35,"./_is-integer":51}],176:[function(require,module,exports){
// 20.1.2.6 Number.MAX_SAFE_INTEGER
var $export = require('./_export');

$export($export.S, 'Number', {MAX_SAFE_INTEGER: 0x1fffffffffffff});
},{"./_export":35}],177:[function(require,module,exports){
// 20.1.2.10 Number.MIN_SAFE_INTEGER
var $export = require('./_export');

$export($export.S, 'Number', {MIN_SAFE_INTEGER: -0x1fffffffffffff});
},{"./_export":35}],178:[function(require,module,exports){
var $export     = require('./_export')
  , $parseFloat = require('./_parse-float');
// 20.1.2.12 Number.parseFloat(string)
$export($export.S + $export.F * (Number.parseFloat != $parseFloat), 'Number', {parseFloat: $parseFloat});
},{"./_export":35,"./_parse-float":84}],179:[function(require,module,exports){
var $export   = require('./_export')
  , $parseInt = require('./_parse-int');
// 20.1.2.13 Number.parseInt(string, radix)
$export($export.S + $export.F * (Number.parseInt != $parseInt), 'Number', {parseInt: $parseInt});
},{"./_export":35,"./_parse-int":85}],180:[function(require,module,exports){
'use strict';
var $export      = require('./_export')
  , toInteger    = require('./_to-integer')
  , aNumberValue = require('./_a-number-value')
  , repeat       = require('./_string-repeat')
  , $toFixed     = 1..toFixed
  , floor        = Math.floor
  , data         = [0, 0, 0, 0, 0, 0]
  , ERROR        = 'Number.toFixed: incorrect invocation!'
  , ZERO         = '0';

var multiply = function(n, c){
  var i  = -1
    , c2 = c;
  while(++i < 6){
    c2 += n * data[i];
    data[i] = c2 % 1e7;
    c2 = floor(c2 / 1e7);
  }
};
var divide = function(n){
  var i = 6
    , c = 0;
  while(--i >= 0){
    c += data[i];
    data[i] = floor(c / n);
    c = (c % n) * 1e7;
  }
};
var numToString = function(){
  var i = 6
    , s = '';
  while(--i >= 0){
    if(s !== '' || i === 0 || data[i] !== 0){
      var t = String(data[i]);
      s = s === '' ? t : s + repeat.call(ZERO, 7 - t.length) + t;
    }
  } return s;
};
var pow = function(x, n, acc){
  return n === 0 ? acc : n % 2 === 1 ? pow(x, n - 1, acc * x) : pow(x * x, n / 2, acc);
};
var log = function(x){
  var n  = 0
    , x2 = x;
  while(x2 >= 4096){
    n += 12;
    x2 /= 4096;
  }
  while(x2 >= 2){
    n  += 1;
    x2 /= 2;
  } return n;
};

$export($export.P + $export.F * (!!$toFixed && (
  0.00008.toFixed(3) !== '0.000' ||
  0.9.toFixed(0) !== '1' ||
  1.255.toFixed(2) !== '1.25' ||
  1000000000000000128..toFixed(0) !== '1000000000000000128'
) || !require('./_fails')(function(){
  // V8 ~ Android 4.3-
  $toFixed.call({});
})), 'Number', {
  toFixed: function toFixed(fractionDigits){
    var x = aNumberValue(this, ERROR)
      , f = toInteger(fractionDigits)
      , s = ''
      , m = ZERO
      , e, z, j, k;
    if(f < 0 || f > 20)throw RangeError(ERROR);
    if(x != x)return 'NaN';
    if(x <= -1e21 || x >= 1e21)return String(x);
    if(x < 0){
      s = '-';
      x = -x;
    }
    if(x > 1e-21){
      e = log(x * pow(2, 69, 1)) - 69;
      z = e < 0 ? x * pow(2, -e, 1) : x / pow(2, e, 1);
      z *= 0x10000000000000;
      e = 52 - e;
      if(e > 0){
        multiply(0, z);
        j = f;
        while(j >= 7){
          multiply(1e7, 0);
          j -= 7;
        }
        multiply(pow(10, j, 1), 0);
        j = e - 1;
        while(j >= 23){
          divide(1 << 23);
          j -= 23;
        }
        divide(1 << j);
        multiply(1, 1);
        divide(2);
        m = numToString();
      } else {
        multiply(0, z);
        multiply(1 << -e, 0);
        m = numToString() + repeat.call(ZERO, f);
      }
    }
    if(f > 0){
      k = m.length;
      m = s + (k <= f ? '0.' + repeat.call(ZERO, f - k) + m : m.slice(0, k - f) + '.' + m.slice(k - f));
    } else {
      m = s + m;
    } return m;
  }
});
},{"./_a-number-value":7,"./_export":35,"./_fails":37,"./_string-repeat":104,"./_to-integer":109}],181:[function(require,module,exports){
'use strict';
var $export      = require('./_export')
  , $fails       = require('./_fails')
  , aNumberValue = require('./_a-number-value')
  , $toPrecision = 1..toPrecision;

$export($export.P + $export.F * ($fails(function(){
  // IE7-
  return $toPrecision.call(1, undefined) !== '1';
}) || !$fails(function(){
  // V8 ~ Android 4.3-
  $toPrecision.call({});
})), 'Number', {
  toPrecision: function toPrecision(precision){
    var that = aNumberValue(this, 'Number#toPrecision: incorrect invocation!');
    return precision === undefined ? $toPrecision.call(that) : $toPrecision.call(that, precision); 
  }
});
},{"./_a-number-value":7,"./_export":35,"./_fails":37}],182:[function(require,module,exports){
// 19.1.3.1 Object.assign(target, source)
var $export = require('./_export');

$export($export.S + $export.F, 'Object', {assign: require('./_object-assign')});
},{"./_export":35,"./_object-assign":68}],183:[function(require,module,exports){
var $export = require('./_export')
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', {create: require('./_object-create')});
},{"./_export":35,"./_object-create":69}],184:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.3 / 15.2.3.7 Object.defineProperties(O, Properties)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', {defineProperties: require('./_object-dps')});
},{"./_descriptors":31,"./_export":35,"./_object-dps":71}],185:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !require('./_descriptors'), 'Object', {defineProperty: require('./_object-dp').f});
},{"./_descriptors":31,"./_export":35,"./_object-dp":70}],186:[function(require,module,exports){
// 19.1.2.5 Object.freeze(O)
var isObject = require('./_is-object')
  , meta     = require('./_meta').onFreeze;

require('./_object-sap')('freeze', function($freeze){
  return function freeze(it){
    return $freeze && isObject(it) ? $freeze(meta(it)) : it;
  };
});
},{"./_is-object":52,"./_meta":65,"./_object-sap":81}],187:[function(require,module,exports){
// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
var toIObject                 = require('./_to-iobject')
  , $getOwnPropertyDescriptor = require('./_object-gopd').f;

require('./_object-sap')('getOwnPropertyDescriptor', function(){
  return function getOwnPropertyDescriptor(it, key){
    return $getOwnPropertyDescriptor(toIObject(it), key);
  };
});
},{"./_object-gopd":73,"./_object-sap":81,"./_to-iobject":110}],188:[function(require,module,exports){
// 19.1.2.7 Object.getOwnPropertyNames(O)
require('./_object-sap')('getOwnPropertyNames', function(){
  return require('./_object-gopn-ext').f;
});
},{"./_object-gopn-ext":74,"./_object-sap":81}],189:[function(require,module,exports){
// 19.1.2.9 Object.getPrototypeOf(O)
var toObject        = require('./_to-object')
  , $getPrototypeOf = require('./_object-gpo');

require('./_object-sap')('getPrototypeOf', function(){
  return function getPrototypeOf(it){
    return $getPrototypeOf(toObject(it));
  };
});
},{"./_object-gpo":77,"./_object-sap":81,"./_to-object":112}],190:[function(require,module,exports){
// 19.1.2.11 Object.isExtensible(O)
var isObject = require('./_is-object');

require('./_object-sap')('isExtensible', function($isExtensible){
  return function isExtensible(it){
    return isObject(it) ? $isExtensible ? $isExtensible(it) : true : false;
  };
});
},{"./_is-object":52,"./_object-sap":81}],191:[function(require,module,exports){
// 19.1.2.12 Object.isFrozen(O)
var isObject = require('./_is-object');

require('./_object-sap')('isFrozen', function($isFrozen){
  return function isFrozen(it){
    return isObject(it) ? $isFrozen ? $isFrozen(it) : false : true;
  };
});
},{"./_is-object":52,"./_object-sap":81}],192:[function(require,module,exports){
// 19.1.2.13 Object.isSealed(O)
var isObject = require('./_is-object');

require('./_object-sap')('isSealed', function($isSealed){
  return function isSealed(it){
    return isObject(it) ? $isSealed ? $isSealed(it) : false : true;
  };
});
},{"./_is-object":52,"./_object-sap":81}],193:[function(require,module,exports){
// 19.1.3.10 Object.is(value1, value2)
var $export = require('./_export');
$export($export.S, 'Object', {is: require('./_same-value')});
},{"./_export":35,"./_same-value":92}],194:[function(require,module,exports){
// 19.1.2.14 Object.keys(O)
var toObject = require('./_to-object')
  , $keys    = require('./_object-keys');

require('./_object-sap')('keys', function(){
  return function keys(it){
    return $keys(toObject(it));
  };
});
},{"./_object-keys":79,"./_object-sap":81,"./_to-object":112}],195:[function(require,module,exports){
// 19.1.2.15 Object.preventExtensions(O)
var isObject = require('./_is-object')
  , meta     = require('./_meta').onFreeze;

require('./_object-sap')('preventExtensions', function($preventExtensions){
  return function preventExtensions(it){
    return $preventExtensions && isObject(it) ? $preventExtensions(meta(it)) : it;
  };
});
},{"./_is-object":52,"./_meta":65,"./_object-sap":81}],196:[function(require,module,exports){
// 19.1.2.17 Object.seal(O)
var isObject = require('./_is-object')
  , meta     = require('./_meta').onFreeze;

require('./_object-sap')('seal', function($seal){
  return function seal(it){
    return $seal && isObject(it) ? $seal(meta(it)) : it;
  };
});
},{"./_is-object":52,"./_meta":65,"./_object-sap":81}],197:[function(require,module,exports){
// 19.1.3.19 Object.setPrototypeOf(O, proto)
var $export = require('./_export');
$export($export.S, 'Object', {setPrototypeOf: require('./_set-proto').set});
},{"./_export":35,"./_set-proto":93}],198:[function(require,module,exports){
'use strict';
// 19.1.3.6 Object.prototype.toString()
var classof = require('./_classof')
  , test    = {};
test[require('./_wks')('toStringTag')] = 'z';
if(test + '' != '[object z]'){
  require('./_redefine')(Object.prototype, 'toString', function toString(){
    return '[object ' + classof(this) + ']';
  }, true);
}
},{"./_classof":20,"./_redefine":90,"./_wks":120}],199:[function(require,module,exports){
var $export     = require('./_export')
  , $parseFloat = require('./_parse-float');
// 18.2.4 parseFloat(string)
$export($export.G + $export.F * (parseFloat != $parseFloat), {parseFloat: $parseFloat});
},{"./_export":35,"./_parse-float":84}],200:[function(require,module,exports){
var $export   = require('./_export')
  , $parseInt = require('./_parse-int');
// 18.2.5 parseInt(string, radix)
$export($export.G + $export.F * (parseInt != $parseInt), {parseInt: $parseInt});
},{"./_export":35,"./_parse-int":85}],201:[function(require,module,exports){
'use strict';
var LIBRARY            = require('./_library')
  , global             = require('./_global')
  , ctx                = require('./_ctx')
  , classof            = require('./_classof')
  , $export            = require('./_export')
  , isObject           = require('./_is-object')
  , aFunction          = require('./_a-function')
  , anInstance         = require('./_an-instance')
  , forOf              = require('./_for-of')
  , speciesConstructor = require('./_species-constructor')
  , task               = require('./_task').set
  , microtask          = require('./_microtask')()
  , PROMISE            = 'Promise'
  , TypeError          = global.TypeError
  , process            = global.process
  , $Promise           = global[PROMISE]
  , process            = global.process
  , isNode             = classof(process) == 'process'
  , empty              = function(){ /* empty */ }
  , Internal, GenericPromiseCapability, Wrapper;

var USE_NATIVE = !!function(){
  try {
    // correct subclassing with @@species support
    var promise     = $Promise.resolve(1)
      , FakePromise = (promise.constructor = {})[require('./_wks')('species')] = function(exec){ exec(empty, empty); };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
  } catch(e){ /* empty */ }
}();

// helpers
var sameConstructor = function(a, b){
  // with library wrapper special case
  return a === b || a === $Promise && b === Wrapper;
};
var isThenable = function(it){
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var newPromiseCapability = function(C){
  return sameConstructor($Promise, C)
    ? new PromiseCapability(C)
    : new GenericPromiseCapability(C);
};
var PromiseCapability = GenericPromiseCapability = function(C){
  var resolve, reject;
  this.promise = new C(function($$resolve, $$reject){
    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject  = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject  = aFunction(reject);
};
var perform = function(exec){
  try {
    exec();
  } catch(e){
    return {error: e};
  }
};
var notify = function(promise, isReject){
  if(promise._n)return;
  promise._n = true;
  var chain = promise._c;
  microtask(function(){
    var value = promise._v
      , ok    = promise._s == 1
      , i     = 0;
    var run = function(reaction){
      var handler = ok ? reaction.ok : reaction.fail
        , resolve = reaction.resolve
        , reject  = reaction.reject
        , domain  = reaction.domain
        , result, then;
      try {
        if(handler){
          if(!ok){
            if(promise._h == 2)onHandleUnhandled(promise);
            promise._h = 1;
          }
          if(handler === true)result = value;
          else {
            if(domain)domain.enter();
            result = handler(value);
            if(domain)domain.exit();
          }
          if(result === reaction.promise){
            reject(TypeError('Promise-chain cycle'));
          } else if(then = isThenable(result)){
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch(e){
        reject(e);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if(isReject && !promise._h)onUnhandled(promise);
  });
};
var onUnhandled = function(promise){
  task.call(global, function(){
    var value = promise._v
      , abrupt, handler, console;
    if(isUnhandled(promise)){
      abrupt = perform(function(){
        if(isNode){
          process.emit('unhandledRejection', value, promise);
        } else if(handler = global.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if(abrupt)throw abrupt.error;
  });
};
var isUnhandled = function(promise){
  if(promise._h == 1)return false;
  var chain = promise._a || promise._c
    , i     = 0
    , reaction;
  while(chain.length > i){
    reaction = chain[i++];
    if(reaction.fail || !isUnhandled(reaction.promise))return false;
  } return true;
};
var onHandleUnhandled = function(promise){
  task.call(global, function(){
    var handler;
    if(isNode){
      process.emit('rejectionHandled', promise);
    } else if(handler = global.onrejectionhandled){
      handler({promise: promise, reason: promise._v});
    }
  });
};
var $reject = function(value){
  var promise = this;
  if(promise._d)return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if(!promise._a)promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function(value){
  var promise = this
    , then;
  if(promise._d)return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if(promise === value)throw TypeError("Promise can't be resolved itself");
    if(then = isThenable(value)){
      microtask(function(){
        var wrapper = {_w: promise, _d: false}; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch(e){
    $reject.call({_w: promise, _d: false}, e); // wrap
  }
};

// constructor polyfill
if(!USE_NATIVE){
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor){
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction(executor);
    Internal.call(this);
    try {
      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
    } catch(err){
      $reject.call(this, err);
    }
  };
  Internal = function Promise(executor){
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = require('./_redefine-all')($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var reaction    = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok     = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail   = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process.domain : undefined;
      this._c.push(reaction);
      if(this._a)this._a.push(reaction);
      if(this._s)notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
  PromiseCapability = function(){
    var promise  = new Internal;
    this.promise = promise;
    this.resolve = ctx($resolve, promise, 1);
    this.reject  = ctx($reject, promise, 1);
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: $Promise});
require('./_set-to-string-tag')($Promise, PROMISE);
require('./_set-species')(PROMISE);
Wrapper = require('./_core')[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    var capability = newPromiseCapability(this)
      , $$reject   = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
    if(x instanceof $Promise && sameConstructor(x.constructor, this))return x;
    var capability = newPromiseCapability(this)
      , $$resolve  = capability.resolve;
    $$resolve(x);
    return capability.promise;
  }
});
$export($export.S + $export.F * !(USE_NATIVE && require('./_iter-detect')(function(iter){
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C          = this
      , capability = newPromiseCapability(C)
      , resolve    = capability.resolve
      , reject     = capability.reject;
    var abrupt = perform(function(){
      var values    = []
        , index     = 0
        , remaining = 1;
      forOf(iterable, false, function(promise){
        var $index        = index++
          , alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function(value){
          if(alreadyCalled)return;
          alreadyCalled  = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C          = this
      , capability = newPromiseCapability(C)
      , reject     = capability.reject;
    var abrupt = perform(function(){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  }
});
},{"./_a-function":6,"./_an-instance":9,"./_classof":20,"./_core":26,"./_ctx":28,"./_export":35,"./_for-of":40,"./_global":41,"./_is-object":52,"./_iter-detect":57,"./_library":61,"./_microtask":67,"./_redefine-all":89,"./_set-species":94,"./_set-to-string-tag":95,"./_species-constructor":98,"./_task":107,"./_wks":120}],202:[function(require,module,exports){
// 26.1.1 Reflect.apply(target, thisArgument, argumentsList)
var $export   = require('./_export')
  , aFunction = require('./_a-function')
  , anObject  = require('./_an-object')
  , rApply    = (require('./_global').Reflect || {}).apply
  , fApply    = Function.apply;
// MS Edge argumentsList argument is optional
$export($export.S + $export.F * !require('./_fails')(function(){
  rApply(function(){});
}), 'Reflect', {
  apply: function apply(target, thisArgument, argumentsList){
    var T = aFunction(target)
      , L = anObject(argumentsList);
    return rApply ? rApply(T, thisArgument, L) : fApply.call(T, thisArgument, L);
  }
});
},{"./_a-function":6,"./_an-object":10,"./_export":35,"./_fails":37,"./_global":41}],203:[function(require,module,exports){
// 26.1.2 Reflect.construct(target, argumentsList [, newTarget])
var $export    = require('./_export')
  , create     = require('./_object-create')
  , aFunction  = require('./_a-function')
  , anObject   = require('./_an-object')
  , isObject   = require('./_is-object')
  , fails      = require('./_fails')
  , bind       = require('./_bind')
  , rConstruct = (require('./_global').Reflect || {}).construct;

// MS Edge supports only 2 arguments and argumentsList argument is optional
// FF Nightly sets third argument as `new.target`, but does not create `this` from it
var NEW_TARGET_BUG = fails(function(){
  function F(){}
  return !(rConstruct(function(){}, [], F) instanceof F);
});
var ARGS_BUG = !fails(function(){
  rConstruct(function(){});
});

$export($export.S + $export.F * (NEW_TARGET_BUG || ARGS_BUG), 'Reflect', {
  construct: function construct(Target, args /*, newTarget*/){
    aFunction(Target);
    anObject(args);
    var newTarget = arguments.length < 3 ? Target : aFunction(arguments[2]);
    if(ARGS_BUG && !NEW_TARGET_BUG)return rConstruct(Target, args, newTarget);
    if(Target == newTarget){
      // w/o altered newTarget, optimization for 0-4 arguments
      switch(args.length){
        case 0: return new Target;
        case 1: return new Target(args[0]);
        case 2: return new Target(args[0], args[1]);
        case 3: return new Target(args[0], args[1], args[2]);
        case 4: return new Target(args[0], args[1], args[2], args[3]);
      }
      // w/o altered newTarget, lot of arguments case
      var $args = [null];
      $args.push.apply($args, args);
      return new (bind.apply(Target, $args));
    }
    // with altered newTarget, not support built-in constructors
    var proto    = newTarget.prototype
      , instance = create(isObject(proto) ? proto : Object.prototype)
      , result   = Function.apply.call(Target, instance, args);
    return isObject(result) ? result : instance;
  }
});
},{"./_a-function":6,"./_an-object":10,"./_bind":19,"./_export":35,"./_fails":37,"./_global":41,"./_is-object":52,"./_object-create":69}],204:[function(require,module,exports){
// 26.1.3 Reflect.defineProperty(target, propertyKey, attributes)
var dP          = require('./_object-dp')
  , $export     = require('./_export')
  , anObject    = require('./_an-object')
  , toPrimitive = require('./_to-primitive');

// MS Edge has broken Reflect.defineProperty - throwing instead of returning false
$export($export.S + $export.F * require('./_fails')(function(){
  Reflect.defineProperty(dP.f({}, 1, {value: 1}), 1, {value: 2});
}), 'Reflect', {
  defineProperty: function defineProperty(target, propertyKey, attributes){
    anObject(target);
    propertyKey = toPrimitive(propertyKey, true);
    anObject(attributes);
    try {
      dP.f(target, propertyKey, attributes);
      return true;
    } catch(e){
      return false;
    }
  }
});
},{"./_an-object":10,"./_export":35,"./_fails":37,"./_object-dp":70,"./_to-primitive":113}],205:[function(require,module,exports){
// 26.1.4 Reflect.deleteProperty(target, propertyKey)
var $export  = require('./_export')
  , gOPD     = require('./_object-gopd').f
  , anObject = require('./_an-object');

$export($export.S, 'Reflect', {
  deleteProperty: function deleteProperty(target, propertyKey){
    var desc = gOPD(anObject(target), propertyKey);
    return desc && !desc.configurable ? false : delete target[propertyKey];
  }
});
},{"./_an-object":10,"./_export":35,"./_object-gopd":73}],206:[function(require,module,exports){
'use strict';
// 26.1.5 Reflect.enumerate(target)
var $export  = require('./_export')
  , anObject = require('./_an-object');
var Enumerate = function(iterated){
  this._t = anObject(iterated); // target
  this._i = 0;                  // next index
  var keys = this._k = []       // keys
    , key;
  for(key in iterated)keys.push(key);
};
require('./_iter-create')(Enumerate, 'Object', function(){
  var that = this
    , keys = that._k
    , key;
  do {
    if(that._i >= keys.length)return {value: undefined, done: true};
  } while(!((key = keys[that._i++]) in that._t));
  return {value: key, done: false};
});

$export($export.S, 'Reflect', {
  enumerate: function enumerate(target){
    return new Enumerate(target);
  }
});
},{"./_an-object":10,"./_export":35,"./_iter-create":55}],207:[function(require,module,exports){
// 26.1.7 Reflect.getOwnPropertyDescriptor(target, propertyKey)
var gOPD     = require('./_object-gopd')
  , $export  = require('./_export')
  , anObject = require('./_an-object');

$export($export.S, 'Reflect', {
  getOwnPropertyDescriptor: function getOwnPropertyDescriptor(target, propertyKey){
    return gOPD.f(anObject(target), propertyKey);
  }
});
},{"./_an-object":10,"./_export":35,"./_object-gopd":73}],208:[function(require,module,exports){
// 26.1.8 Reflect.getPrototypeOf(target)
var $export  = require('./_export')
  , getProto = require('./_object-gpo')
  , anObject = require('./_an-object');

$export($export.S, 'Reflect', {
  getPrototypeOf: function getPrototypeOf(target){
    return getProto(anObject(target));
  }
});
},{"./_an-object":10,"./_export":35,"./_object-gpo":77}],209:[function(require,module,exports){
// 26.1.6 Reflect.get(target, propertyKey [, receiver])
var gOPD           = require('./_object-gopd')
  , getPrototypeOf = require('./_object-gpo')
  , has            = require('./_has')
  , $export        = require('./_export')
  , isObject       = require('./_is-object')
  , anObject       = require('./_an-object');

function get(target, propertyKey/*, receiver*/){
  var receiver = arguments.length < 3 ? target : arguments[2]
    , desc, proto;
  if(anObject(target) === receiver)return target[propertyKey];
  if(desc = gOPD.f(target, propertyKey))return has(desc, 'value')
    ? desc.value
    : desc.get !== undefined
      ? desc.get.call(receiver)
      : undefined;
  if(isObject(proto = getPrototypeOf(target)))return get(proto, propertyKey, receiver);
}

$export($export.S, 'Reflect', {get: get});
},{"./_an-object":10,"./_export":35,"./_has":42,"./_is-object":52,"./_object-gopd":73,"./_object-gpo":77}],210:[function(require,module,exports){
// 26.1.9 Reflect.has(target, propertyKey)
var $export = require('./_export');

$export($export.S, 'Reflect', {
  has: function has(target, propertyKey){
    return propertyKey in target;
  }
});
},{"./_export":35}],211:[function(require,module,exports){
// 26.1.10 Reflect.isExtensible(target)
var $export       = require('./_export')
  , anObject      = require('./_an-object')
  , $isExtensible = Object.isExtensible;

$export($export.S, 'Reflect', {
  isExtensible: function isExtensible(target){
    anObject(target);
    return $isExtensible ? $isExtensible(target) : true;
  }
});
},{"./_an-object":10,"./_export":35}],212:[function(require,module,exports){
// 26.1.11 Reflect.ownKeys(target)
var $export = require('./_export');

$export($export.S, 'Reflect', {ownKeys: require('./_own-keys')});
},{"./_export":35,"./_own-keys":83}],213:[function(require,module,exports){
// 26.1.12 Reflect.preventExtensions(target)
var $export            = require('./_export')
  , anObject           = require('./_an-object')
  , $preventExtensions = Object.preventExtensions;

$export($export.S, 'Reflect', {
  preventExtensions: function preventExtensions(target){
    anObject(target);
    try {
      if($preventExtensions)$preventExtensions(target);
      return true;
    } catch(e){
      return false;
    }
  }
});
},{"./_an-object":10,"./_export":35}],214:[function(require,module,exports){
// 26.1.14 Reflect.setPrototypeOf(target, proto)
var $export  = require('./_export')
  , setProto = require('./_set-proto');

if(setProto)$export($export.S, 'Reflect', {
  setPrototypeOf: function setPrototypeOf(target, proto){
    setProto.check(target, proto);
    try {
      setProto.set(target, proto);
      return true;
    } catch(e){
      return false;
    }
  }
});
},{"./_export":35,"./_set-proto":93}],215:[function(require,module,exports){
// 26.1.13 Reflect.set(target, propertyKey, V [, receiver])
var dP             = require('./_object-dp')
  , gOPD           = require('./_object-gopd')
  , getPrototypeOf = require('./_object-gpo')
  , has            = require('./_has')
  , $export        = require('./_export')
  , createDesc     = require('./_property-desc')
  , anObject       = require('./_an-object')
  , isObject       = require('./_is-object');

function set(target, propertyKey, V/*, receiver*/){
  var receiver = arguments.length < 4 ? target : arguments[3]
    , ownDesc  = gOPD.f(anObject(target), propertyKey)
    , existingDescriptor, proto;
  if(!ownDesc){
    if(isObject(proto = getPrototypeOf(target))){
      return set(proto, propertyKey, V, receiver);
    }
    ownDesc = createDesc(0);
  }
  if(has(ownDesc, 'value')){
    if(ownDesc.writable === false || !isObject(receiver))return false;
    existingDescriptor = gOPD.f(receiver, propertyKey) || createDesc(0);
    existingDescriptor.value = V;
    dP.f(receiver, propertyKey, existingDescriptor);
    return true;
  }
  return ownDesc.set === undefined ? false : (ownDesc.set.call(receiver, V), true);
}

$export($export.S, 'Reflect', {set: set});
},{"./_an-object":10,"./_export":35,"./_has":42,"./_is-object":52,"./_object-dp":70,"./_object-gopd":73,"./_object-gpo":77,"./_property-desc":88}],216:[function(require,module,exports){
var global            = require('./_global')
  , inheritIfRequired = require('./_inherit-if-required')
  , dP                = require('./_object-dp').f
  , gOPN              = require('./_object-gopn').f
  , isRegExp          = require('./_is-regexp')
  , $flags            = require('./_flags')
  , $RegExp           = global.RegExp
  , Base              = $RegExp
  , proto             = $RegExp.prototype
  , re1               = /a/g
  , re2               = /a/g
  // "new" creates a new object, old webkit buggy here
  , CORRECT_NEW       = new $RegExp(re1) !== re1;

if(require('./_descriptors') && (!CORRECT_NEW || require('./_fails')(function(){
  re2[require('./_wks')('match')] = false;
  // RegExp constructor can alter flags and IsRegExp works correct with @@match
  return $RegExp(re1) != re1 || $RegExp(re2) == re2 || $RegExp(re1, 'i') != '/a/i';
}))){
  $RegExp = function RegExp(p, f){
    var tiRE = this instanceof $RegExp
      , piRE = isRegExp(p)
      , fiU  = f === undefined;
    return !tiRE && piRE && p.constructor === $RegExp && fiU ? p
      : inheritIfRequired(CORRECT_NEW
        ? new Base(piRE && !fiU ? p.source : p, f)
        : Base((piRE = p instanceof $RegExp) ? p.source : p, piRE && fiU ? $flags.call(p) : f)
      , tiRE ? this : proto, $RegExp);
  };
  var proxy = function(key){
    key in $RegExp || dP($RegExp, key, {
      configurable: true,
      get: function(){ return Base[key]; },
      set: function(it){ Base[key] = it; }
    });
  };
  for(var keys = gOPN(Base), i = 0; keys.length > i; )proxy(keys[i++]);
  proto.constructor = $RegExp;
  $RegExp.prototype = proto;
  require('./_redefine')(global, 'RegExp', $RegExp);
}

require('./_set-species')('RegExp');
},{"./_descriptors":31,"./_fails":37,"./_flags":39,"./_global":41,"./_inherit-if-required":46,"./_is-regexp":53,"./_object-dp":70,"./_object-gopn":75,"./_redefine":90,"./_set-species":94,"./_wks":120}],217:[function(require,module,exports){
// 21.2.5.3 get RegExp.prototype.flags()
if(require('./_descriptors') && /./g.flags != 'g')require('./_object-dp').f(RegExp.prototype, 'flags', {
  configurable: true,
  get: require('./_flags')
});
},{"./_descriptors":31,"./_flags":39,"./_object-dp":70}],218:[function(require,module,exports){
// @@match logic
require('./_fix-re-wks')('match', 1, function(defined, MATCH, $match){
  // 21.1.3.11 String.prototype.match(regexp)
  return [function match(regexp){
    'use strict';
    var O  = defined(this)
      , fn = regexp == undefined ? undefined : regexp[MATCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[MATCH](String(O));
  }, $match];
});
},{"./_fix-re-wks":38}],219:[function(require,module,exports){
// @@replace logic
require('./_fix-re-wks')('replace', 2, function(defined, REPLACE, $replace){
  // 21.1.3.14 String.prototype.replace(searchValue, replaceValue)
  return [function replace(searchValue, replaceValue){
    'use strict';
    var O  = defined(this)
      , fn = searchValue == undefined ? undefined : searchValue[REPLACE];
    return fn !== undefined
      ? fn.call(searchValue, O, replaceValue)
      : $replace.call(String(O), searchValue, replaceValue);
  }, $replace];
});
},{"./_fix-re-wks":38}],220:[function(require,module,exports){
// @@search logic
require('./_fix-re-wks')('search', 1, function(defined, SEARCH, $search){
  // 21.1.3.15 String.prototype.search(regexp)
  return [function search(regexp){
    'use strict';
    var O  = defined(this)
      , fn = regexp == undefined ? undefined : regexp[SEARCH];
    return fn !== undefined ? fn.call(regexp, O) : new RegExp(regexp)[SEARCH](String(O));
  }, $search];
});
},{"./_fix-re-wks":38}],221:[function(require,module,exports){
// @@split logic
require('./_fix-re-wks')('split', 2, function(defined, SPLIT, $split){
  'use strict';
  var isRegExp   = require('./_is-regexp')
    , _split     = $split
    , $push      = [].push
    , $SPLIT     = 'split'
    , LENGTH     = 'length'
    , LAST_INDEX = 'lastIndex';
  if(
    'abbc'[$SPLIT](/(b)*/)[1] == 'c' ||
    'test'[$SPLIT](/(?:)/, -1)[LENGTH] != 4 ||
    'ab'[$SPLIT](/(?:ab)*/)[LENGTH] != 2 ||
    '.'[$SPLIT](/(.?)(.?)/)[LENGTH] != 4 ||
    '.'[$SPLIT](/()()/)[LENGTH] > 1 ||
    ''[$SPLIT](/.?/)[LENGTH]
  ){
    var NPCG = /()??/.exec('')[1] === undefined; // nonparticipating capturing group
    // based on es5-shim implementation, need to rework it
    $split = function(separator, limit){
      var string = String(this);
      if(separator === undefined && limit === 0)return [];
      // If `separator` is not a regex, use native split
      if(!isRegExp(separator))return _split.call(string, separator, limit);
      var output = [];
      var flags = (separator.ignoreCase ? 'i' : '') +
                  (separator.multiline ? 'm' : '') +
                  (separator.unicode ? 'u' : '') +
                  (separator.sticky ? 'y' : '');
      var lastLastIndex = 0;
      var splitLimit = limit === undefined ? 4294967295 : limit >>> 0;
      // Make `global` and avoid `lastIndex` issues by working with a copy
      var separatorCopy = new RegExp(separator.source, flags + 'g');
      var separator2, match, lastIndex, lastLength, i;
      // Doesn't need flags gy, but they don't hurt
      if(!NPCG)separator2 = new RegExp('^' + separatorCopy.source + '$(?!\\s)', flags);
      while(match = separatorCopy.exec(string)){
        // `separatorCopy.lastIndex` is not reliable cross-browser
        lastIndex = match.index + match[0][LENGTH];
        if(lastIndex > lastLastIndex){
          output.push(string.slice(lastLastIndex, match.index));
          // Fix browsers whose `exec` methods don't consistently return `undefined` for NPCG
          if(!NPCG && match[LENGTH] > 1)match[0].replace(separator2, function(){
            for(i = 1; i < arguments[LENGTH] - 2; i++)if(arguments[i] === undefined)match[i] = undefined;
          });
          if(match[LENGTH] > 1 && match.index < string[LENGTH])$push.apply(output, match.slice(1));
          lastLength = match[0][LENGTH];
          lastLastIndex = lastIndex;
          if(output[LENGTH] >= splitLimit)break;
        }
        if(separatorCopy[LAST_INDEX] === match.index)separatorCopy[LAST_INDEX]++; // Avoid an infinite loop
      }
      if(lastLastIndex === string[LENGTH]){
        if(lastLength || !separatorCopy.test(''))output.push('');
      } else output.push(string.slice(lastLastIndex));
      return output[LENGTH] > splitLimit ? output.slice(0, splitLimit) : output;
    };
  // Chakra, V8
  } else if('0'[$SPLIT](undefined, 0)[LENGTH]){
    $split = function(separator, limit){
      return separator === undefined && limit === 0 ? [] : _split.call(this, separator, limit);
    };
  }
  // 21.1.3.17 String.prototype.split(separator, limit)
  return [function split(separator, limit){
    var O  = defined(this)
      , fn = separator == undefined ? undefined : separator[SPLIT];
    return fn !== undefined ? fn.call(separator, O, limit) : $split.call(String(O), separator, limit);
  }, $split];
});
},{"./_fix-re-wks":38,"./_is-regexp":53}],222:[function(require,module,exports){
'use strict';
require('./es6.regexp.flags');
var anObject    = require('./_an-object')
  , $flags      = require('./_flags')
  , DESCRIPTORS = require('./_descriptors')
  , TO_STRING   = 'toString'
  , $toString   = /./[TO_STRING];

var define = function(fn){
  require('./_redefine')(RegExp.prototype, TO_STRING, fn, true);
};

// 21.2.5.14 RegExp.prototype.toString()
if(require('./_fails')(function(){ return $toString.call({source: 'a', flags: 'b'}) != '/a/b'; })){
  define(function toString(){
    var R = anObject(this);
    return '/'.concat(R.source, '/',
      'flags' in R ? R.flags : !DESCRIPTORS && R instanceof RegExp ? $flags.call(R) : undefined);
  });
// FF44- RegExp#toString has a wrong name
} else if($toString.name != TO_STRING){
  define(function toString(){
    return $toString.call(this);
  });
}
},{"./_an-object":10,"./_descriptors":31,"./_fails":37,"./_flags":39,"./_redefine":90,"./es6.regexp.flags":217}],223:[function(require,module,exports){
'use strict';
var strong = require('./_collection-strong');

// 23.2 Set Objects
module.exports = require('./_collection')('Set', function(get){
  return function Set(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value){
    return strong.def(this, value = value === 0 ? 0 : value, value);
  }
}, strong);
},{"./_collection":25,"./_collection-strong":22}],224:[function(require,module,exports){
'use strict';
// B.2.3.2 String.prototype.anchor(name)
require('./_string-html')('anchor', function(createHTML){
  return function anchor(name){
    return createHTML(this, 'a', 'name', name);
  }
});
},{"./_string-html":102}],225:[function(require,module,exports){
'use strict';
// B.2.3.3 String.prototype.big()
require('./_string-html')('big', function(createHTML){
  return function big(){
    return createHTML(this, 'big', '', '');
  }
});
},{"./_string-html":102}],226:[function(require,module,exports){
'use strict';
// B.2.3.4 String.prototype.blink()
require('./_string-html')('blink', function(createHTML){
  return function blink(){
    return createHTML(this, 'blink', '', '');
  }
});
},{"./_string-html":102}],227:[function(require,module,exports){
'use strict';
// B.2.3.5 String.prototype.bold()
require('./_string-html')('bold', function(createHTML){
  return function bold(){
    return createHTML(this, 'b', '', '');
  }
});
},{"./_string-html":102}],228:[function(require,module,exports){
'use strict';
var $export = require('./_export')
  , $at     = require('./_string-at')(false);
$export($export.P, 'String', {
  // 21.1.3.3 String.prototype.codePointAt(pos)
  codePointAt: function codePointAt(pos){
    return $at(this, pos);
  }
});
},{"./_export":35,"./_string-at":100}],229:[function(require,module,exports){
// 21.1.3.6 String.prototype.endsWith(searchString [, endPosition])
'use strict';
var $export   = require('./_export')
  , toLength  = require('./_to-length')
  , context   = require('./_string-context')
  , ENDS_WITH = 'endsWith'
  , $endsWith = ''[ENDS_WITH];

$export($export.P + $export.F * require('./_fails-is-regexp')(ENDS_WITH), 'String', {
  endsWith: function endsWith(searchString /*, endPosition = @length */){
    var that = context(this, searchString, ENDS_WITH)
      , endPosition = arguments.length > 1 ? arguments[1] : undefined
      , len    = toLength(that.length)
      , end    = endPosition === undefined ? len : Math.min(toLength(endPosition), len)
      , search = String(searchString);
    return $endsWith
      ? $endsWith.call(that, search, end)
      : that.slice(end - search.length, end) === search;
  }
});
},{"./_export":35,"./_fails-is-regexp":36,"./_string-context":101,"./_to-length":111}],230:[function(require,module,exports){
'use strict';
// B.2.3.6 String.prototype.fixed()
require('./_string-html')('fixed', function(createHTML){
  return function fixed(){
    return createHTML(this, 'tt', '', '');
  }
});
},{"./_string-html":102}],231:[function(require,module,exports){
'use strict';
// B.2.3.7 String.prototype.fontcolor(color)
require('./_string-html')('fontcolor', function(createHTML){
  return function fontcolor(color){
    return createHTML(this, 'font', 'color', color);
  }
});
},{"./_string-html":102}],232:[function(require,module,exports){
'use strict';
// B.2.3.8 String.prototype.fontsize(size)
require('./_string-html')('fontsize', function(createHTML){
  return function fontsize(size){
    return createHTML(this, 'font', 'size', size);
  }
});
},{"./_string-html":102}],233:[function(require,module,exports){
var $export        = require('./_export')
  , toIndex        = require('./_to-index')
  , fromCharCode   = String.fromCharCode
  , $fromCodePoint = String.fromCodePoint;

// length should be 1, old FF problem
$export($export.S + $export.F * (!!$fromCodePoint && $fromCodePoint.length != 1), 'String', {
  // 21.1.2.2 String.fromCodePoint(...codePoints)
  fromCodePoint: function fromCodePoint(x){ // eslint-disable-line no-unused-vars
    var res  = []
      , aLen = arguments.length
      , i    = 0
      , code;
    while(aLen > i){
      code = +arguments[i++];
      if(toIndex(code, 0x10ffff) !== code)throw RangeError(code + ' is not a valid code point');
      res.push(code < 0x10000
        ? fromCharCode(code)
        : fromCharCode(((code -= 0x10000) >> 10) + 0xd800, code % 0x400 + 0xdc00)
      );
    } return res.join('');
  }
});
},{"./_export":35,"./_to-index":108}],234:[function(require,module,exports){
// 21.1.3.7 String.prototype.includes(searchString, position = 0)
'use strict';
var $export  = require('./_export')
  , context  = require('./_string-context')
  , INCLUDES = 'includes';

$export($export.P + $export.F * require('./_fails-is-regexp')(INCLUDES), 'String', {
  includes: function includes(searchString /*, position = 0 */){
    return !!~context(this, searchString, INCLUDES)
      .indexOf(searchString, arguments.length > 1 ? arguments[1] : undefined);
  }
});
},{"./_export":35,"./_fails-is-regexp":36,"./_string-context":101}],235:[function(require,module,exports){
'use strict';
// B.2.3.9 String.prototype.italics()
require('./_string-html')('italics', function(createHTML){
  return function italics(){
    return createHTML(this, 'i', '', '');
  }
});
},{"./_string-html":102}],236:[function(require,module,exports){
'use strict';
var $at  = require('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./_iter-define')(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
},{"./_iter-define":56,"./_string-at":100}],237:[function(require,module,exports){
'use strict';
// B.2.3.10 String.prototype.link(url)
require('./_string-html')('link', function(createHTML){
  return function link(url){
    return createHTML(this, 'a', 'href', url);
  }
});
},{"./_string-html":102}],238:[function(require,module,exports){
var $export   = require('./_export')
  , toIObject = require('./_to-iobject')
  , toLength  = require('./_to-length');

$export($export.S, 'String', {
  // 21.1.2.4 String.raw(callSite, ...substitutions)
  raw: function raw(callSite){
    var tpl  = toIObject(callSite.raw)
      , len  = toLength(tpl.length)
      , aLen = arguments.length
      , res  = []
      , i    = 0;
    while(len > i){
      res.push(String(tpl[i++]));
      if(i < aLen)res.push(String(arguments[i]));
    } return res.join('');
  }
});
},{"./_export":35,"./_to-iobject":110,"./_to-length":111}],239:[function(require,module,exports){
var $export = require('./_export');

$export($export.P, 'String', {
  // 21.1.3.13 String.prototype.repeat(count)
  repeat: require('./_string-repeat')
});
},{"./_export":35,"./_string-repeat":104}],240:[function(require,module,exports){
'use strict';
// B.2.3.11 String.prototype.small()
require('./_string-html')('small', function(createHTML){
  return function small(){
    return createHTML(this, 'small', '', '');
  }
});
},{"./_string-html":102}],241:[function(require,module,exports){
// 21.1.3.18 String.prototype.startsWith(searchString [, position ])
'use strict';
var $export     = require('./_export')
  , toLength    = require('./_to-length')
  , context     = require('./_string-context')
  , STARTS_WITH = 'startsWith'
  , $startsWith = ''[STARTS_WITH];

$export($export.P + $export.F * require('./_fails-is-regexp')(STARTS_WITH), 'String', {
  startsWith: function startsWith(searchString /*, position = 0 */){
    var that   = context(this, searchString, STARTS_WITH)
      , index  = toLength(Math.min(arguments.length > 1 ? arguments[1] : undefined, that.length))
      , search = String(searchString);
    return $startsWith
      ? $startsWith.call(that, search, index)
      : that.slice(index, index + search.length) === search;
  }
});
},{"./_export":35,"./_fails-is-regexp":36,"./_string-context":101,"./_to-length":111}],242:[function(require,module,exports){
'use strict';
// B.2.3.12 String.prototype.strike()
require('./_string-html')('strike', function(createHTML){
  return function strike(){
    return createHTML(this, 'strike', '', '');
  }
});
},{"./_string-html":102}],243:[function(require,module,exports){
'use strict';
// B.2.3.13 String.prototype.sub()
require('./_string-html')('sub', function(createHTML){
  return function sub(){
    return createHTML(this, 'sub', '', '');
  }
});
},{"./_string-html":102}],244:[function(require,module,exports){
'use strict';
// B.2.3.14 String.prototype.sup()
require('./_string-html')('sup', function(createHTML){
  return function sup(){
    return createHTML(this, 'sup', '', '');
  }
});
},{"./_string-html":102}],245:[function(require,module,exports){
'use strict';
// 21.1.3.25 String.prototype.trim()
require('./_string-trim')('trim', function($trim){
  return function trim(){
    return $trim(this, 3);
  };
});
},{"./_string-trim":105}],246:[function(require,module,exports){
'use strict';
// ECMAScript 6 symbols shim
var global         = require('./_global')
  , has            = require('./_has')
  , DESCRIPTORS    = require('./_descriptors')
  , $export        = require('./_export')
  , redefine       = require('./_redefine')
  , META           = require('./_meta').KEY
  , $fails         = require('./_fails')
  , shared         = require('./_shared')
  , setToStringTag = require('./_set-to-string-tag')
  , uid            = require('./_uid')
  , wks            = require('./_wks')
  , wksExt         = require('./_wks-ext')
  , wksDefine      = require('./_wks-define')
  , keyOf          = require('./_keyof')
  , enumKeys       = require('./_enum-keys')
  , isArray        = require('./_is-array')
  , anObject       = require('./_an-object')
  , toIObject      = require('./_to-iobject')
  , toPrimitive    = require('./_to-primitive')
  , createDesc     = require('./_property-desc')
  , _create        = require('./_object-create')
  , gOPNExt        = require('./_object-gopn-ext')
  , $GOPD          = require('./_object-gopd')
  , $DP            = require('./_object-dp')
  , $keys          = require('./_object-keys')
  , gOPD           = $GOPD.f
  , dP             = $DP.f
  , gOPN           = gOPNExt.f
  , $Symbol        = global.Symbol
  , $JSON          = global.JSON
  , _stringify     = $JSON && $JSON.stringify
  , PROTOTYPE      = 'prototype'
  , HIDDEN         = wks('_hidden')
  , TO_PRIMITIVE   = wks('toPrimitive')
  , isEnum         = {}.propertyIsEnumerable
  , SymbolRegistry = shared('symbol-registry')
  , AllSymbols     = shared('symbols')
  , OPSymbols      = shared('op-symbols')
  , ObjectProto    = Object[PROTOTYPE]
  , USE_NATIVE     = typeof $Symbol == 'function'
  , QObject        = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function(){
  return _create(dP({}, 'a', {
    get: function(){ return dP(this, 'a', {value: 7}).a; }
  })).a != 7;
}) ? function(it, key, D){
  var protoDesc = gOPD(ObjectProto, key);
  if(protoDesc)delete ObjectProto[key];
  dP(it, key, D);
  if(protoDesc && it !== ObjectProto)dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function(tag){
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function(it){
  return typeof it == 'symbol';
} : function(it){
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D){
  if(it === ObjectProto)$defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if(has(AllSymbols, key)){
    if(!D.enumerable){
      if(!has(it, HIDDEN))dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc(0, false)});
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P){
  anObject(it);
  var keys = enumKeys(P = toIObject(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P){
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key){
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if(this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key))return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
  it  = toIObject(it);
  key = toPrimitive(key, true);
  if(it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key))return;
  var D = gOPD(it, key);
  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it){
  var names  = gOPN(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i){
    if(!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META)result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
  var IS_OP  = it === ObjectProto
    , names  = gOPN(IS_OP ? OPSymbols : toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i){
    if(has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true))result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if(!USE_NATIVE){
  $Symbol = function Symbol(){
    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function(value){
      if(this === ObjectProto)$set.call(OPSymbols, value);
      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if(DESCRIPTORS && setter)setSymbolDesc(ObjectProto, tag, {configurable: true, set: $set});
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString(){
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f   = $defineProperty;
  require('./_object-gopn').f = gOPNExt.f = $getOwnPropertyNames;
  require('./_object-pie').f  = $propertyIsEnumerable;
  require('./_object-gops').f = $getOwnPropertySymbols;

  if(DESCRIPTORS && !require('./_library')){
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function(name){
    return wrap(wks(name));
  }
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Symbol: $Symbol});

for(var symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), i = 0; symbols.length > i; )wks(symbols[i++]);

for(var symbols = $keys(wks.store), i = 0; symbols.length > i; )wksDefine(symbols[i++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    if(isSymbol(key))return keyOf(SymbolRegistry, key);
    throw TypeError(key + ' is not a symbol!');
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function(){
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it){
    if(it === undefined || isSymbol(it))return; // IE8 returns string on undefined
    var args = [it]
      , i    = 1
      , replacer, $replacer;
    while(arguments.length > i)args.push(arguments[i++]);
    replacer = args[1];
    if(typeof replacer == 'function')$replacer = replacer;
    if($replacer || !isArray(replacer))replacer = function(key, value){
      if($replacer)value = $replacer.call(this, key, value);
      if(!isSymbol(value))return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || require('./_hide')($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);
},{"./_an-object":10,"./_descriptors":31,"./_enum-keys":34,"./_export":35,"./_fails":37,"./_global":41,"./_has":42,"./_hide":43,"./_is-array":50,"./_keyof":60,"./_library":61,"./_meta":65,"./_object-create":69,"./_object-dp":70,"./_object-gopd":73,"./_object-gopn":75,"./_object-gopn-ext":74,"./_object-gops":76,"./_object-keys":79,"./_object-pie":80,"./_property-desc":88,"./_redefine":90,"./_set-to-string-tag":95,"./_shared":97,"./_to-iobject":110,"./_to-primitive":113,"./_uid":117,"./_wks":120,"./_wks-define":118,"./_wks-ext":119}],247:[function(require,module,exports){
'use strict';
var $export      = require('./_export')
  , $typed       = require('./_typed')
  , buffer       = require('./_typed-buffer')
  , anObject     = require('./_an-object')
  , toIndex      = require('./_to-index')
  , toLength     = require('./_to-length')
  , isObject     = require('./_is-object')
  , ArrayBuffer  = require('./_global').ArrayBuffer
  , speciesConstructor = require('./_species-constructor')
  , $ArrayBuffer = buffer.ArrayBuffer
  , $DataView    = buffer.DataView
  , $isView      = $typed.ABV && ArrayBuffer.isView
  , $slice       = $ArrayBuffer.prototype.slice
  , VIEW         = $typed.VIEW
  , ARRAY_BUFFER = 'ArrayBuffer';

$export($export.G + $export.W + $export.F * (ArrayBuffer !== $ArrayBuffer), {ArrayBuffer: $ArrayBuffer});

$export($export.S + $export.F * !$typed.CONSTR, ARRAY_BUFFER, {
  // 24.1.3.1 ArrayBuffer.isView(arg)
  isView: function isView(it){
    return $isView && $isView(it) || isObject(it) && VIEW in it;
  }
});

$export($export.P + $export.U + $export.F * require('./_fails')(function(){
  return !new $ArrayBuffer(2).slice(1, undefined).byteLength;
}), ARRAY_BUFFER, {
  // 24.1.4.3 ArrayBuffer.prototype.slice(start, end)
  slice: function slice(start, end){
    if($slice !== undefined && end === undefined)return $slice.call(anObject(this), start); // FF fix
    var len    = anObject(this).byteLength
      , first  = toIndex(start, len)
      , final  = toIndex(end === undefined ? len : end, len)
      , result = new (speciesConstructor(this, $ArrayBuffer))(toLength(final - first))
      , viewS  = new $DataView(this)
      , viewT  = new $DataView(result)
      , index  = 0;
    while(first < final){
      viewT.setUint8(index++, viewS.getUint8(first++));
    } return result;
  }
});

require('./_set-species')(ARRAY_BUFFER);
},{"./_an-object":10,"./_export":35,"./_fails":37,"./_global":41,"./_is-object":52,"./_set-species":94,"./_species-constructor":98,"./_to-index":108,"./_to-length":111,"./_typed":116,"./_typed-buffer":115}],248:[function(require,module,exports){
var $export = require('./_export');
$export($export.G + $export.W + $export.F * !require('./_typed').ABV, {
  DataView: require('./_typed-buffer').DataView
});
},{"./_export":35,"./_typed":116,"./_typed-buffer":115}],249:[function(require,module,exports){
require('./_typed-array')('Float32', 4, function(init){
  return function Float32Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":114}],250:[function(require,module,exports){
require('./_typed-array')('Float64', 8, function(init){
  return function Float64Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":114}],251:[function(require,module,exports){
require('./_typed-array')('Int16', 2, function(init){
  return function Int16Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":114}],252:[function(require,module,exports){
require('./_typed-array')('Int32', 4, function(init){
  return function Int32Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":114}],253:[function(require,module,exports){
require('./_typed-array')('Int8', 1, function(init){
  return function Int8Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":114}],254:[function(require,module,exports){
require('./_typed-array')('Uint16', 2, function(init){
  return function Uint16Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":114}],255:[function(require,module,exports){
require('./_typed-array')('Uint32', 4, function(init){
  return function Uint32Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":114}],256:[function(require,module,exports){
require('./_typed-array')('Uint8', 1, function(init){
  return function Uint8Array(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
});
},{"./_typed-array":114}],257:[function(require,module,exports){
require('./_typed-array')('Uint8', 1, function(init){
  return function Uint8ClampedArray(data, byteOffset, length){
    return init(this, data, byteOffset, length);
  };
}, true);
},{"./_typed-array":114}],258:[function(require,module,exports){
'use strict';
var each         = require('./_array-methods')(0)
  , redefine     = require('./_redefine')
  , meta         = require('./_meta')
  , assign       = require('./_object-assign')
  , weak         = require('./_collection-weak')
  , isObject     = require('./_is-object')
  , getWeak      = meta.getWeak
  , isExtensible = Object.isExtensible
  , uncaughtFrozenStore = weak.ufstore
  , tmp          = {}
  , InternalMap;

var wrapper = function(get){
  return function WeakMap(){
    return get(this, arguments.length > 0 ? arguments[0] : undefined);
  };
};

var methods = {
  // 23.3.3.3 WeakMap.prototype.get(key)
  get: function get(key){
    if(isObject(key)){
      var data = getWeak(key);
      if(data === true)return uncaughtFrozenStore(this).get(key);
      return data ? data[this._i] : undefined;
    }
  },
  // 23.3.3.5 WeakMap.prototype.set(key, value)
  set: function set(key, value){
    return weak.def(this, key, value);
  }
};

// 23.3 WeakMap Objects
var $WeakMap = module.exports = require('./_collection')('WeakMap', wrapper, methods, weak, true, true);

// IE11 WeakMap frozen keys fix
if(new $WeakMap().set((Object.freeze || Object)(tmp), 7).get(tmp) != 7){
  InternalMap = weak.getConstructor(wrapper);
  assign(InternalMap.prototype, methods);
  meta.NEED = true;
  each(['delete', 'has', 'get', 'set'], function(key){
    var proto  = $WeakMap.prototype
      , method = proto[key];
    redefine(proto, key, function(a, b){
      // store frozen objects on internal weakmap shim
      if(isObject(a) && !isExtensible(a)){
        if(!this._f)this._f = new InternalMap;
        var result = this._f[key](a, b);
        return key == 'set' ? this : result;
      // store all the rest on native weakmap
      } return method.call(this, a, b);
    });
  });
}
},{"./_array-methods":15,"./_collection":25,"./_collection-weak":24,"./_is-object":52,"./_meta":65,"./_object-assign":68,"./_redefine":90}],259:[function(require,module,exports){
'use strict';
var weak = require('./_collection-weak');

// 23.4 WeakSet Objects
require('./_collection')('WeakSet', function(get){
  return function WeakSet(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.4.3.1 WeakSet.prototype.add(value)
  add: function add(value){
    return weak.def(this, value, true);
  }
}, weak, false, true);
},{"./_collection":25,"./_collection-weak":24}],260:[function(require,module,exports){
'use strict';
// https://github.com/tc39/Array.prototype.includes
var $export   = require('./_export')
  , $includes = require('./_array-includes')(true);

$export($export.P, 'Array', {
  includes: function includes(el /*, fromIndex = 0 */){
    return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
  }
});

require('./_add-to-unscopables')('includes');
},{"./_add-to-unscopables":8,"./_array-includes":14,"./_export":35}],261:[function(require,module,exports){
// https://github.com/rwaldron/tc39-notes/blob/master/es6/2014-09/sept-25.md#510-globalasap-for-enqueuing-a-microtask
var $export   = require('./_export')
  , microtask = require('./_microtask')()
  , process   = require('./_global').process
  , isNode    = require('./_cof')(process) == 'process';

$export($export.G, {
  asap: function asap(fn){
    var domain = isNode && process.domain;
    microtask(domain ? domain.bind(fn) : fn);
  }
});
},{"./_cof":21,"./_export":35,"./_global":41,"./_microtask":67}],262:[function(require,module,exports){
// https://github.com/ljharb/proposal-is-error
var $export = require('./_export')
  , cof     = require('./_cof');

$export($export.S, 'Error', {
  isError: function isError(it){
    return cof(it) === 'Error';
  }
});
},{"./_cof":21,"./_export":35}],263:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export  = require('./_export');

$export($export.P + $export.R, 'Map', {toJSON: require('./_collection-to-json')('Map')});
},{"./_collection-to-json":23,"./_export":35}],264:[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  iaddh: function iaddh(x0, x1, y0, y1){
    var $x0 = x0 >>> 0
      , $x1 = x1 >>> 0
      , $y0 = y0 >>> 0;
    return $x1 + (y1 >>> 0) + (($x0 & $y0 | ($x0 | $y0) & ~($x0 + $y0 >>> 0)) >>> 31) | 0;
  }
});
},{"./_export":35}],265:[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  imulh: function imulh(u, v){
    var UINT16 = 0xffff
      , $u = +u
      , $v = +v
      , u0 = $u & UINT16
      , v0 = $v & UINT16
      , u1 = $u >> 16
      , v1 = $v >> 16
      , t  = (u1 * v0 >>> 0) + (u0 * v0 >>> 16);
    return u1 * v1 + (t >> 16) + ((u0 * v1 >>> 0) + (t & UINT16) >> 16);
  }
});
},{"./_export":35}],266:[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  isubh: function isubh(x0, x1, y0, y1){
    var $x0 = x0 >>> 0
      , $x1 = x1 >>> 0
      , $y0 = y0 >>> 0;
    return $x1 - (y1 >>> 0) - ((~$x0 & $y0 | ~($x0 ^ $y0) & $x0 - $y0 >>> 0) >>> 31) | 0;
  }
});
},{"./_export":35}],267:[function(require,module,exports){
// https://gist.github.com/BrendanEich/4294d5c212a6d2254703
var $export = require('./_export');

$export($export.S, 'Math', {
  umulh: function umulh(u, v){
    var UINT16 = 0xffff
      , $u = +u
      , $v = +v
      , u0 = $u & UINT16
      , v0 = $v & UINT16
      , u1 = $u >>> 16
      , v1 = $v >>> 16
      , t  = (u1 * v0 >>> 0) + (u0 * v0 >>> 16);
    return u1 * v1 + (t >>> 16) + ((u0 * v1 >>> 0) + (t & UINT16) >>> 16);
  }
});
},{"./_export":35}],268:[function(require,module,exports){
'use strict';
var $export         = require('./_export')
  , toObject        = require('./_to-object')
  , aFunction       = require('./_a-function')
  , $defineProperty = require('./_object-dp');

// B.2.2.2 Object.prototype.__defineGetter__(P, getter)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __defineGetter__: function __defineGetter__(P, getter){
    $defineProperty.f(toObject(this), P, {get: aFunction(getter), enumerable: true, configurable: true});
  }
});
},{"./_a-function":6,"./_descriptors":31,"./_export":35,"./_object-dp":70,"./_object-forced-pam":72,"./_to-object":112}],269:[function(require,module,exports){
'use strict';
var $export         = require('./_export')
  , toObject        = require('./_to-object')
  , aFunction       = require('./_a-function')
  , $defineProperty = require('./_object-dp');

// B.2.2.3 Object.prototype.__defineSetter__(P, setter)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __defineSetter__: function __defineSetter__(P, setter){
    $defineProperty.f(toObject(this), P, {set: aFunction(setter), enumerable: true, configurable: true});
  }
});
},{"./_a-function":6,"./_descriptors":31,"./_export":35,"./_object-dp":70,"./_object-forced-pam":72,"./_to-object":112}],270:[function(require,module,exports){
// https://github.com/tc39/proposal-object-values-entries
var $export  = require('./_export')
  , $entries = require('./_object-to-array')(true);

$export($export.S, 'Object', {
  entries: function entries(it){
    return $entries(it);
  }
});
},{"./_export":35,"./_object-to-array":82}],271:[function(require,module,exports){
// https://github.com/tc39/proposal-object-getownpropertydescriptors
var $export        = require('./_export')
  , ownKeys        = require('./_own-keys')
  , toIObject      = require('./_to-iobject')
  , gOPD           = require('./_object-gopd')
  , createProperty = require('./_create-property');

$export($export.S, 'Object', {
  getOwnPropertyDescriptors: function getOwnPropertyDescriptors(object){
    var O       = toIObject(object)
      , getDesc = gOPD.f
      , keys    = ownKeys(O)
      , result  = {}
      , i       = 0
      , key;
    while(keys.length > i)createProperty(result, key = keys[i++], getDesc(O, key));
    return result;
  }
});
},{"./_create-property":27,"./_export":35,"./_object-gopd":73,"./_own-keys":83,"./_to-iobject":110}],272:[function(require,module,exports){
'use strict';
var $export                  = require('./_export')
  , toObject                 = require('./_to-object')
  , toPrimitive              = require('./_to-primitive')
  , getPrototypeOf           = require('./_object-gpo')
  , getOwnPropertyDescriptor = require('./_object-gopd').f;

// B.2.2.4 Object.prototype.__lookupGetter__(P)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __lookupGetter__: function __lookupGetter__(P){
    var O = toObject(this)
      , K = toPrimitive(P, true)
      , D;
    do {
      if(D = getOwnPropertyDescriptor(O, K))return D.get;
    } while(O = getPrototypeOf(O));
  }
});
},{"./_descriptors":31,"./_export":35,"./_object-forced-pam":72,"./_object-gopd":73,"./_object-gpo":77,"./_to-object":112,"./_to-primitive":113}],273:[function(require,module,exports){
'use strict';
var $export                  = require('./_export')
  , toObject                 = require('./_to-object')
  , toPrimitive              = require('./_to-primitive')
  , getPrototypeOf           = require('./_object-gpo')
  , getOwnPropertyDescriptor = require('./_object-gopd').f;

// B.2.2.5 Object.prototype.__lookupSetter__(P)
require('./_descriptors') && $export($export.P + require('./_object-forced-pam'), 'Object', {
  __lookupSetter__: function __lookupSetter__(P){
    var O = toObject(this)
      , K = toPrimitive(P, true)
      , D;
    do {
      if(D = getOwnPropertyDescriptor(O, K))return D.set;
    } while(O = getPrototypeOf(O));
  }
});
},{"./_descriptors":31,"./_export":35,"./_object-forced-pam":72,"./_object-gopd":73,"./_object-gpo":77,"./_to-object":112,"./_to-primitive":113}],274:[function(require,module,exports){
// https://github.com/tc39/proposal-object-values-entries
var $export = require('./_export')
  , $values = require('./_object-to-array')(false);

$export($export.S, 'Object', {
  values: function values(it){
    return $values(it);
  }
});
},{"./_export":35,"./_object-to-array":82}],275:[function(require,module,exports){
'use strict';
// https://github.com/zenparsing/es-observable
var $export     = require('./_export')
  , global      = require('./_global')
  , core        = require('./_core')
  , microtask   = require('./_microtask')()
  , OBSERVABLE  = require('./_wks')('observable')
  , aFunction   = require('./_a-function')
  , anObject    = require('./_an-object')
  , anInstance  = require('./_an-instance')
  , redefineAll = require('./_redefine-all')
  , hide        = require('./_hide')
  , forOf       = require('./_for-of')
  , RETURN      = forOf.RETURN;

var getMethod = function(fn){
  return fn == null ? undefined : aFunction(fn);
};

var cleanupSubscription = function(subscription){
  var cleanup = subscription._c;
  if(cleanup){
    subscription._c = undefined;
    cleanup();
  }
};

var subscriptionClosed = function(subscription){
  return subscription._o === undefined;
};

var closeSubscription = function(subscription){
  if(!subscriptionClosed(subscription)){
    subscription._o = undefined;
    cleanupSubscription(subscription);
  }
};

var Subscription = function(observer, subscriber){
  anObject(observer);
  this._c = undefined;
  this._o = observer;
  observer = new SubscriptionObserver(this);
  try {
    var cleanup      = subscriber(observer)
      , subscription = cleanup;
    if(cleanup != null){
      if(typeof cleanup.unsubscribe === 'function')cleanup = function(){ subscription.unsubscribe(); };
      else aFunction(cleanup);
      this._c = cleanup;
    }
  } catch(e){
    observer.error(e);
    return;
  } if(subscriptionClosed(this))cleanupSubscription(this);
};

Subscription.prototype = redefineAll({}, {
  unsubscribe: function unsubscribe(){ closeSubscription(this); }
});

var SubscriptionObserver = function(subscription){
  this._s = subscription;
};

SubscriptionObserver.prototype = redefineAll({}, {
  next: function next(value){
    var subscription = this._s;
    if(!subscriptionClosed(subscription)){
      var observer = subscription._o;
      try {
        var m = getMethod(observer.next);
        if(m)return m.call(observer, value);
      } catch(e){
        try {
          closeSubscription(subscription);
        } finally {
          throw e;
        }
      }
    }
  },
  error: function error(value){
    var subscription = this._s;
    if(subscriptionClosed(subscription))throw value;
    var observer = subscription._o;
    subscription._o = undefined;
    try {
      var m = getMethod(observer.error);
      if(!m)throw value;
      value = m.call(observer, value);
    } catch(e){
      try {
        cleanupSubscription(subscription);
      } finally {
        throw e;
      }
    } cleanupSubscription(subscription);
    return value;
  },
  complete: function complete(value){
    var subscription = this._s;
    if(!subscriptionClosed(subscription)){
      var observer = subscription._o;
      subscription._o = undefined;
      try {
        var m = getMethod(observer.complete);
        value = m ? m.call(observer, value) : undefined;
      } catch(e){
        try {
          cleanupSubscription(subscription);
        } finally {
          throw e;
        }
      } cleanupSubscription(subscription);
      return value;
    }
  }
});

var $Observable = function Observable(subscriber){
  anInstance(this, $Observable, 'Observable', '_f')._f = aFunction(subscriber);
};

redefineAll($Observable.prototype, {
  subscribe: function subscribe(observer){
    return new Subscription(observer, this._f);
  },
  forEach: function forEach(fn){
    var that = this;
    return new (core.Promise || global.Promise)(function(resolve, reject){
      aFunction(fn);
      var subscription = that.subscribe({
        next : function(value){
          try {
            return fn(value);
          } catch(e){
            reject(e);
            subscription.unsubscribe();
          }
        },
        error: reject,
        complete: resolve
      });
    });
  }
});

redefineAll($Observable, {
  from: function from(x){
    var C = typeof this === 'function' ? this : $Observable;
    var method = getMethod(anObject(x)[OBSERVABLE]);
    if(method){
      var observable = anObject(method.call(x));
      return observable.constructor === C ? observable : new C(function(observer){
        return observable.subscribe(observer);
      });
    }
    return new C(function(observer){
      var done = false;
      microtask(function(){
        if(!done){
          try {
            if(forOf(x, false, function(it){
              observer.next(it);
              if(done)return RETURN;
            }) === RETURN)return;
          } catch(e){
            if(done)throw e;
            observer.error(e);
            return;
          } observer.complete();
        }
      });
      return function(){ done = true; };
    });
  },
  of: function of(){
    for(var i = 0, l = arguments.length, items = Array(l); i < l;)items[i] = arguments[i++];
    return new (typeof this === 'function' ? this : $Observable)(function(observer){
      var done = false;
      microtask(function(){
        if(!done){
          for(var i = 0; i < items.length; ++i){
            observer.next(items[i]);
            if(done)return;
          } observer.complete();
        }
      });
      return function(){ done = true; };
    });
  }
});

hide($Observable.prototype, OBSERVABLE, function(){ return this; });

$export($export.G, {Observable: $Observable});

require('./_set-species')('Observable');
},{"./_a-function":6,"./_an-instance":9,"./_an-object":10,"./_core":26,"./_export":35,"./_for-of":40,"./_global":41,"./_hide":43,"./_microtask":67,"./_redefine-all":89,"./_set-species":94,"./_wks":120}],276:[function(require,module,exports){
var metadata                  = require('./_metadata')
  , anObject                  = require('./_an-object')
  , toMetaKey                 = metadata.key
  , ordinaryDefineOwnMetadata = metadata.set;

metadata.exp({defineMetadata: function defineMetadata(metadataKey, metadataValue, target, targetKey){
  ordinaryDefineOwnMetadata(metadataKey, metadataValue, anObject(target), toMetaKey(targetKey));
}});
},{"./_an-object":10,"./_metadata":66}],277:[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , toMetaKey              = metadata.key
  , getOrCreateMetadataMap = metadata.map
  , store                  = metadata.store;

metadata.exp({deleteMetadata: function deleteMetadata(metadataKey, target /*, targetKey */){
  var targetKey   = arguments.length < 3 ? undefined : toMetaKey(arguments[2])
    , metadataMap = getOrCreateMetadataMap(anObject(target), targetKey, false);
  if(metadataMap === undefined || !metadataMap['delete'](metadataKey))return false;
  if(metadataMap.size)return true;
  var targetMetadata = store.get(target);
  targetMetadata['delete'](targetKey);
  return !!targetMetadata.size || store['delete'](target);
}});
},{"./_an-object":10,"./_metadata":66}],278:[function(require,module,exports){
var Set                     = require('./es6.set')
  , from                    = require('./_array-from-iterable')
  , metadata                = require('./_metadata')
  , anObject                = require('./_an-object')
  , getPrototypeOf          = require('./_object-gpo')
  , ordinaryOwnMetadataKeys = metadata.keys
  , toMetaKey               = metadata.key;

var ordinaryMetadataKeys = function(O, P){
  var oKeys  = ordinaryOwnMetadataKeys(O, P)
    , parent = getPrototypeOf(O);
  if(parent === null)return oKeys;
  var pKeys  = ordinaryMetadataKeys(parent, P);
  return pKeys.length ? oKeys.length ? from(new Set(oKeys.concat(pKeys))) : pKeys : oKeys;
};

metadata.exp({getMetadataKeys: function getMetadataKeys(target /*, targetKey */){
  return ordinaryMetadataKeys(anObject(target), arguments.length < 2 ? undefined : toMetaKey(arguments[1]));
}});
},{"./_an-object":10,"./_array-from-iterable":13,"./_metadata":66,"./_object-gpo":77,"./es6.set":223}],279:[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , getPrototypeOf         = require('./_object-gpo')
  , ordinaryHasOwnMetadata = metadata.has
  , ordinaryGetOwnMetadata = metadata.get
  , toMetaKey              = metadata.key;

var ordinaryGetMetadata = function(MetadataKey, O, P){
  var hasOwn = ordinaryHasOwnMetadata(MetadataKey, O, P);
  if(hasOwn)return ordinaryGetOwnMetadata(MetadataKey, O, P);
  var parent = getPrototypeOf(O);
  return parent !== null ? ordinaryGetMetadata(MetadataKey, parent, P) : undefined;
};

metadata.exp({getMetadata: function getMetadata(metadataKey, target /*, targetKey */){
  return ordinaryGetMetadata(metadataKey, anObject(target), arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
}});
},{"./_an-object":10,"./_metadata":66,"./_object-gpo":77}],280:[function(require,module,exports){
var metadata                = require('./_metadata')
  , anObject                = require('./_an-object')
  , ordinaryOwnMetadataKeys = metadata.keys
  , toMetaKey               = metadata.key;

metadata.exp({getOwnMetadataKeys: function getOwnMetadataKeys(target /*, targetKey */){
  return ordinaryOwnMetadataKeys(anObject(target), arguments.length < 2 ? undefined : toMetaKey(arguments[1]));
}});
},{"./_an-object":10,"./_metadata":66}],281:[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , ordinaryGetOwnMetadata = metadata.get
  , toMetaKey              = metadata.key;

metadata.exp({getOwnMetadata: function getOwnMetadata(metadataKey, target /*, targetKey */){
  return ordinaryGetOwnMetadata(metadataKey, anObject(target)
    , arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
}});
},{"./_an-object":10,"./_metadata":66}],282:[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , getPrototypeOf         = require('./_object-gpo')
  , ordinaryHasOwnMetadata = metadata.has
  , toMetaKey              = metadata.key;

var ordinaryHasMetadata = function(MetadataKey, O, P){
  var hasOwn = ordinaryHasOwnMetadata(MetadataKey, O, P);
  if(hasOwn)return true;
  var parent = getPrototypeOf(O);
  return parent !== null ? ordinaryHasMetadata(MetadataKey, parent, P) : false;
};

metadata.exp({hasMetadata: function hasMetadata(metadataKey, target /*, targetKey */){
  return ordinaryHasMetadata(metadataKey, anObject(target), arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
}});
},{"./_an-object":10,"./_metadata":66,"./_object-gpo":77}],283:[function(require,module,exports){
var metadata               = require('./_metadata')
  , anObject               = require('./_an-object')
  , ordinaryHasOwnMetadata = metadata.has
  , toMetaKey              = metadata.key;

metadata.exp({hasOwnMetadata: function hasOwnMetadata(metadataKey, target /*, targetKey */){
  return ordinaryHasOwnMetadata(metadataKey, anObject(target)
    , arguments.length < 3 ? undefined : toMetaKey(arguments[2]));
}});
},{"./_an-object":10,"./_metadata":66}],284:[function(require,module,exports){
var metadata                  = require('./_metadata')
  , anObject                  = require('./_an-object')
  , aFunction                 = require('./_a-function')
  , toMetaKey                 = metadata.key
  , ordinaryDefineOwnMetadata = metadata.set;

metadata.exp({metadata: function metadata(metadataKey, metadataValue){
  return function decorator(target, targetKey){
    ordinaryDefineOwnMetadata(
      metadataKey, metadataValue,
      (targetKey !== undefined ? anObject : aFunction)(target),
      toMetaKey(targetKey)
    );
  };
}});
},{"./_a-function":6,"./_an-object":10,"./_metadata":66}],285:[function(require,module,exports){
// https://github.com/DavidBruant/Map-Set.prototype.toJSON
var $export  = require('./_export');

$export($export.P + $export.R, 'Set', {toJSON: require('./_collection-to-json')('Set')});
},{"./_collection-to-json":23,"./_export":35}],286:[function(require,module,exports){
'use strict';
// https://github.com/mathiasbynens/String.prototype.at
var $export = require('./_export')
  , $at     = require('./_string-at')(true);

$export($export.P, 'String', {
  at: function at(pos){
    return $at(this, pos);
  }
});
},{"./_export":35,"./_string-at":100}],287:[function(require,module,exports){
'use strict';
// https://tc39.github.io/String.prototype.matchAll/
var $export     = require('./_export')
  , defined     = require('./_defined')
  , toLength    = require('./_to-length')
  , isRegExp    = require('./_is-regexp')
  , getFlags    = require('./_flags')
  , RegExpProto = RegExp.prototype;

var $RegExpStringIterator = function(regexp, string){
  this._r = regexp;
  this._s = string;
};

require('./_iter-create')($RegExpStringIterator, 'RegExp String', function next(){
  var match = this._r.exec(this._s);
  return {value: match, done: match === null};
});

$export($export.P, 'String', {
  matchAll: function matchAll(regexp){
    defined(this);
    if(!isRegExp(regexp))throw TypeError(regexp + ' is not a regexp!');
    var S     = String(this)
      , flags = 'flags' in RegExpProto ? String(regexp.flags) : getFlags.call(regexp)
      , rx    = new RegExp(regexp.source, ~flags.indexOf('g') ? flags : 'g' + flags);
    rx.lastIndex = toLength(regexp.lastIndex);
    return new $RegExpStringIterator(rx, S);
  }
});
},{"./_defined":30,"./_export":35,"./_flags":39,"./_is-regexp":53,"./_iter-create":55,"./_to-length":111}],288:[function(require,module,exports){
'use strict';
// https://github.com/tc39/proposal-string-pad-start-end
var $export = require('./_export')
  , $pad    = require('./_string-pad');

$export($export.P, 'String', {
  padEnd: function padEnd(maxLength /*, fillString = ' ' */){
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, false);
  }
});
},{"./_export":35,"./_string-pad":103}],289:[function(require,module,exports){
'use strict';
// https://github.com/tc39/proposal-string-pad-start-end
var $export = require('./_export')
  , $pad    = require('./_string-pad');

$export($export.P, 'String', {
  padStart: function padStart(maxLength /*, fillString = ' ' */){
    return $pad(this, maxLength, arguments.length > 1 ? arguments[1] : undefined, true);
  }
});
},{"./_export":35,"./_string-pad":103}],290:[function(require,module,exports){
'use strict';
// https://github.com/sebmarkbage/ecmascript-string-left-right-trim
require('./_string-trim')('trimLeft', function($trim){
  return function trimLeft(){
    return $trim(this, 1);
  };
}, 'trimStart');
},{"./_string-trim":105}],291:[function(require,module,exports){
'use strict';
// https://github.com/sebmarkbage/ecmascript-string-left-right-trim
require('./_string-trim')('trimRight', function($trim){
  return function trimRight(){
    return $trim(this, 2);
  };
}, 'trimEnd');
},{"./_string-trim":105}],292:[function(require,module,exports){
require('./_wks-define')('asyncIterator');
},{"./_wks-define":118}],293:[function(require,module,exports){
require('./_wks-define')('observable');
},{"./_wks-define":118}],294:[function(require,module,exports){
// https://github.com/ljharb/proposal-global
var $export = require('./_export');

$export($export.S, 'System', {global: require('./_global')});
},{"./_export":35,"./_global":41}],295:[function(require,module,exports){
var $iterators    = require('./es6.array.iterator')
  , redefine      = require('./_redefine')
  , global        = require('./_global')
  , hide          = require('./_hide')
  , Iterators     = require('./_iterators')
  , wks           = require('./_wks')
  , ITERATOR      = wks('iterator')
  , TO_STRING_TAG = wks('toStringTag')
  , ArrayValues   = Iterators.Array;

for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
  var NAME       = collections[i]
    , Collection = global[NAME]
    , proto      = Collection && Collection.prototype
    , key;
  if(proto){
    if(!proto[ITERATOR])hide(proto, ITERATOR, ArrayValues);
    if(!proto[TO_STRING_TAG])hide(proto, TO_STRING_TAG, NAME);
    Iterators[NAME] = ArrayValues;
    for(key in $iterators)if(!proto[key])redefine(proto, key, $iterators[key], true);
  }
}
},{"./_global":41,"./_hide":43,"./_iterators":59,"./_redefine":90,"./_wks":120,"./es6.array.iterator":133}],296:[function(require,module,exports){
var $export = require('./_export')
  , $task   = require('./_task');
$export($export.G + $export.B, {
  setImmediate:   $task.set,
  clearImmediate: $task.clear
});
},{"./_export":35,"./_task":107}],297:[function(require,module,exports){
// ie9- setTimeout & setInterval additional parameters fix
var global     = require('./_global')
  , $export    = require('./_export')
  , invoke     = require('./_invoke')
  , partial    = require('./_partial')
  , navigator  = global.navigator
  , MSIE       = !!navigator && /MSIE .\./.test(navigator.userAgent); // <- dirty ie9- check
var wrap = function(set){
  return MSIE ? function(fn, time /*, ...args */){
    return set(invoke(
      partial,
      [].slice.call(arguments, 2),
      typeof fn == 'function' ? fn : Function(fn)
    ), time);
  } : set;
};
$export($export.G + $export.B + $export.F * MSIE, {
  setTimeout:  wrap(global.setTimeout),
  setInterval: wrap(global.setInterval)
});
},{"./_export":35,"./_global":41,"./_invoke":47,"./_partial":86}],298:[function(require,module,exports){
require('./modules/es6.symbol');
require('./modules/es6.object.create');
require('./modules/es6.object.define-property');
require('./modules/es6.object.define-properties');
require('./modules/es6.object.get-own-property-descriptor');
require('./modules/es6.object.get-prototype-of');
require('./modules/es6.object.keys');
require('./modules/es6.object.get-own-property-names');
require('./modules/es6.object.freeze');
require('./modules/es6.object.seal');
require('./modules/es6.object.prevent-extensions');
require('./modules/es6.object.is-frozen');
require('./modules/es6.object.is-sealed');
require('./modules/es6.object.is-extensible');
require('./modules/es6.object.assign');
require('./modules/es6.object.is');
require('./modules/es6.object.set-prototype-of');
require('./modules/es6.object.to-string');
require('./modules/es6.function.bind');
require('./modules/es6.function.name');
require('./modules/es6.function.has-instance');
require('./modules/es6.parse-int');
require('./modules/es6.parse-float');
require('./modules/es6.number.constructor');
require('./modules/es6.number.to-fixed');
require('./modules/es6.number.to-precision');
require('./modules/es6.number.epsilon');
require('./modules/es6.number.is-finite');
require('./modules/es6.number.is-integer');
require('./modules/es6.number.is-nan');
require('./modules/es6.number.is-safe-integer');
require('./modules/es6.number.max-safe-integer');
require('./modules/es6.number.min-safe-integer');
require('./modules/es6.number.parse-float');
require('./modules/es6.number.parse-int');
require('./modules/es6.math.acosh');
require('./modules/es6.math.asinh');
require('./modules/es6.math.atanh');
require('./modules/es6.math.cbrt');
require('./modules/es6.math.clz32');
require('./modules/es6.math.cosh');
require('./modules/es6.math.expm1');
require('./modules/es6.math.fround');
require('./modules/es6.math.hypot');
require('./modules/es6.math.imul');
require('./modules/es6.math.log10');
require('./modules/es6.math.log1p');
require('./modules/es6.math.log2');
require('./modules/es6.math.sign');
require('./modules/es6.math.sinh');
require('./modules/es6.math.tanh');
require('./modules/es6.math.trunc');
require('./modules/es6.string.from-code-point');
require('./modules/es6.string.raw');
require('./modules/es6.string.trim');
require('./modules/es6.string.iterator');
require('./modules/es6.string.code-point-at');
require('./modules/es6.string.ends-with');
require('./modules/es6.string.includes');
require('./modules/es6.string.repeat');
require('./modules/es6.string.starts-with');
require('./modules/es6.string.anchor');
require('./modules/es6.string.big');
require('./modules/es6.string.blink');
require('./modules/es6.string.bold');
require('./modules/es6.string.fixed');
require('./modules/es6.string.fontcolor');
require('./modules/es6.string.fontsize');
require('./modules/es6.string.italics');
require('./modules/es6.string.link');
require('./modules/es6.string.small');
require('./modules/es6.string.strike');
require('./modules/es6.string.sub');
require('./modules/es6.string.sup');
require('./modules/es6.date.now');
require('./modules/es6.date.to-json');
require('./modules/es6.date.to-iso-string');
require('./modules/es6.date.to-string');
require('./modules/es6.date.to-primitive');
require('./modules/es6.array.is-array');
require('./modules/es6.array.from');
require('./modules/es6.array.of');
require('./modules/es6.array.join');
require('./modules/es6.array.slice');
require('./modules/es6.array.sort');
require('./modules/es6.array.for-each');
require('./modules/es6.array.map');
require('./modules/es6.array.filter');
require('./modules/es6.array.some');
require('./modules/es6.array.every');
require('./modules/es6.array.reduce');
require('./modules/es6.array.reduce-right');
require('./modules/es6.array.index-of');
require('./modules/es6.array.last-index-of');
require('./modules/es6.array.copy-within');
require('./modules/es6.array.fill');
require('./modules/es6.array.find');
require('./modules/es6.array.find-index');
require('./modules/es6.array.species');
require('./modules/es6.array.iterator');
require('./modules/es6.regexp.constructor');
require('./modules/es6.regexp.to-string');
require('./modules/es6.regexp.flags');
require('./modules/es6.regexp.match');
require('./modules/es6.regexp.replace');
require('./modules/es6.regexp.search');
require('./modules/es6.regexp.split');
require('./modules/es6.promise');
require('./modules/es6.map');
require('./modules/es6.set');
require('./modules/es6.weak-map');
require('./modules/es6.weak-set');
require('./modules/es6.typed.array-buffer');
require('./modules/es6.typed.data-view');
require('./modules/es6.typed.int8-array');
require('./modules/es6.typed.uint8-array');
require('./modules/es6.typed.uint8-clamped-array');
require('./modules/es6.typed.int16-array');
require('./modules/es6.typed.uint16-array');
require('./modules/es6.typed.int32-array');
require('./modules/es6.typed.uint32-array');
require('./modules/es6.typed.float32-array');
require('./modules/es6.typed.float64-array');
require('./modules/es6.reflect.apply');
require('./modules/es6.reflect.construct');
require('./modules/es6.reflect.define-property');
require('./modules/es6.reflect.delete-property');
require('./modules/es6.reflect.enumerate');
require('./modules/es6.reflect.get');
require('./modules/es6.reflect.get-own-property-descriptor');
require('./modules/es6.reflect.get-prototype-of');
require('./modules/es6.reflect.has');
require('./modules/es6.reflect.is-extensible');
require('./modules/es6.reflect.own-keys');
require('./modules/es6.reflect.prevent-extensions');
require('./modules/es6.reflect.set');
require('./modules/es6.reflect.set-prototype-of');
require('./modules/es7.array.includes');
require('./modules/es7.string.at');
require('./modules/es7.string.pad-start');
require('./modules/es7.string.pad-end');
require('./modules/es7.string.trim-left');
require('./modules/es7.string.trim-right');
require('./modules/es7.string.match-all');
require('./modules/es7.symbol.async-iterator');
require('./modules/es7.symbol.observable');
require('./modules/es7.object.get-own-property-descriptors');
require('./modules/es7.object.values');
require('./modules/es7.object.entries');
require('./modules/es7.object.define-getter');
require('./modules/es7.object.define-setter');
require('./modules/es7.object.lookup-getter');
require('./modules/es7.object.lookup-setter');
require('./modules/es7.map.to-json');
require('./modules/es7.set.to-json');
require('./modules/es7.system.global');
require('./modules/es7.error.is-error');
require('./modules/es7.math.iaddh');
require('./modules/es7.math.isubh');
require('./modules/es7.math.imulh');
require('./modules/es7.math.umulh');
require('./modules/es7.reflect.define-metadata');
require('./modules/es7.reflect.delete-metadata');
require('./modules/es7.reflect.get-metadata');
require('./modules/es7.reflect.get-metadata-keys');
require('./modules/es7.reflect.get-own-metadata');
require('./modules/es7.reflect.get-own-metadata-keys');
require('./modules/es7.reflect.has-metadata');
require('./modules/es7.reflect.has-own-metadata');
require('./modules/es7.reflect.metadata');
require('./modules/es7.asap');
require('./modules/es7.observable');
require('./modules/web.timers');
require('./modules/web.immediate');
require('./modules/web.dom.iterable');
module.exports = require('./modules/_core');
},{"./modules/_core":26,"./modules/es6.array.copy-within":123,"./modules/es6.array.every":124,"./modules/es6.array.fill":125,"./modules/es6.array.filter":126,"./modules/es6.array.find":128,"./modules/es6.array.find-index":127,"./modules/es6.array.for-each":129,"./modules/es6.array.from":130,"./modules/es6.array.index-of":131,"./modules/es6.array.is-array":132,"./modules/es6.array.iterator":133,"./modules/es6.array.join":134,"./modules/es6.array.last-index-of":135,"./modules/es6.array.map":136,"./modules/es6.array.of":137,"./modules/es6.array.reduce":139,"./modules/es6.array.reduce-right":138,"./modules/es6.array.slice":140,"./modules/es6.array.some":141,"./modules/es6.array.sort":142,"./modules/es6.array.species":143,"./modules/es6.date.now":144,"./modules/es6.date.to-iso-string":145,"./modules/es6.date.to-json":146,"./modules/es6.date.to-primitive":147,"./modules/es6.date.to-string":148,"./modules/es6.function.bind":149,"./modules/es6.function.has-instance":150,"./modules/es6.function.name":151,"./modules/es6.map":152,"./modules/es6.math.acosh":153,"./modules/es6.math.asinh":154,"./modules/es6.math.atanh":155,"./modules/es6.math.cbrt":156,"./modules/es6.math.clz32":157,"./modules/es6.math.cosh":158,"./modules/es6.math.expm1":159,"./modules/es6.math.fround":160,"./modules/es6.math.hypot":161,"./modules/es6.math.imul":162,"./modules/es6.math.log10":163,"./modules/es6.math.log1p":164,"./modules/es6.math.log2":165,"./modules/es6.math.sign":166,"./modules/es6.math.sinh":167,"./modules/es6.math.tanh":168,"./modules/es6.math.trunc":169,"./modules/es6.number.constructor":170,"./modules/es6.number.epsilon":171,"./modules/es6.number.is-finite":172,"./modules/es6.number.is-integer":173,"./modules/es6.number.is-nan":174,"./modules/es6.number.is-safe-integer":175,"./modules/es6.number.max-safe-integer":176,"./modules/es6.number.min-safe-integer":177,"./modules/es6.number.parse-float":178,"./modules/es6.number.parse-int":179,"./modules/es6.number.to-fixed":180,"./modules/es6.number.to-precision":181,"./modules/es6.object.assign":182,"./modules/es6.object.create":183,"./modules/es6.object.define-properties":184,"./modules/es6.object.define-property":185,"./modules/es6.object.freeze":186,"./modules/es6.object.get-own-property-descriptor":187,"./modules/es6.object.get-own-property-names":188,"./modules/es6.object.get-prototype-of":189,"./modules/es6.object.is":193,"./modules/es6.object.is-extensible":190,"./modules/es6.object.is-frozen":191,"./modules/es6.object.is-sealed":192,"./modules/es6.object.keys":194,"./modules/es6.object.prevent-extensions":195,"./modules/es6.object.seal":196,"./modules/es6.object.set-prototype-of":197,"./modules/es6.object.to-string":198,"./modules/es6.parse-float":199,"./modules/es6.parse-int":200,"./modules/es6.promise":201,"./modules/es6.reflect.apply":202,"./modules/es6.reflect.construct":203,"./modules/es6.reflect.define-property":204,"./modules/es6.reflect.delete-property":205,"./modules/es6.reflect.enumerate":206,"./modules/es6.reflect.get":209,"./modules/es6.reflect.get-own-property-descriptor":207,"./modules/es6.reflect.get-prototype-of":208,"./modules/es6.reflect.has":210,"./modules/es6.reflect.is-extensible":211,"./modules/es6.reflect.own-keys":212,"./modules/es6.reflect.prevent-extensions":213,"./modules/es6.reflect.set":215,"./modules/es6.reflect.set-prototype-of":214,"./modules/es6.regexp.constructor":216,"./modules/es6.regexp.flags":217,"./modules/es6.regexp.match":218,"./modules/es6.regexp.replace":219,"./modules/es6.regexp.search":220,"./modules/es6.regexp.split":221,"./modules/es6.regexp.to-string":222,"./modules/es6.set":223,"./modules/es6.string.anchor":224,"./modules/es6.string.big":225,"./modules/es6.string.blink":226,"./modules/es6.string.bold":227,"./modules/es6.string.code-point-at":228,"./modules/es6.string.ends-with":229,"./modules/es6.string.fixed":230,"./modules/es6.string.fontcolor":231,"./modules/es6.string.fontsize":232,"./modules/es6.string.from-code-point":233,"./modules/es6.string.includes":234,"./modules/es6.string.italics":235,"./modules/es6.string.iterator":236,"./modules/es6.string.link":237,"./modules/es6.string.raw":238,"./modules/es6.string.repeat":239,"./modules/es6.string.small":240,"./modules/es6.string.starts-with":241,"./modules/es6.string.strike":242,"./modules/es6.string.sub":243,"./modules/es6.string.sup":244,"./modules/es6.string.trim":245,"./modules/es6.symbol":246,"./modules/es6.typed.array-buffer":247,"./modules/es6.typed.data-view":248,"./modules/es6.typed.float32-array":249,"./modules/es6.typed.float64-array":250,"./modules/es6.typed.int16-array":251,"./modules/es6.typed.int32-array":252,"./modules/es6.typed.int8-array":253,"./modules/es6.typed.uint16-array":254,"./modules/es6.typed.uint32-array":255,"./modules/es6.typed.uint8-array":256,"./modules/es6.typed.uint8-clamped-array":257,"./modules/es6.weak-map":258,"./modules/es6.weak-set":259,"./modules/es7.array.includes":260,"./modules/es7.asap":261,"./modules/es7.error.is-error":262,"./modules/es7.map.to-json":263,"./modules/es7.math.iaddh":264,"./modules/es7.math.imulh":265,"./modules/es7.math.isubh":266,"./modules/es7.math.umulh":267,"./modules/es7.object.define-getter":268,"./modules/es7.object.define-setter":269,"./modules/es7.object.entries":270,"./modules/es7.object.get-own-property-descriptors":271,"./modules/es7.object.lookup-getter":272,"./modules/es7.object.lookup-setter":273,"./modules/es7.object.values":274,"./modules/es7.observable":275,"./modules/es7.reflect.define-metadata":276,"./modules/es7.reflect.delete-metadata":277,"./modules/es7.reflect.get-metadata":279,"./modules/es7.reflect.get-metadata-keys":278,"./modules/es7.reflect.get-own-metadata":281,"./modules/es7.reflect.get-own-metadata-keys":280,"./modules/es7.reflect.has-metadata":282,"./modules/es7.reflect.has-own-metadata":283,"./modules/es7.reflect.metadata":284,"./modules/es7.set.to-json":285,"./modules/es7.string.at":286,"./modules/es7.string.match-all":287,"./modules/es7.string.pad-end":288,"./modules/es7.string.pad-start":289,"./modules/es7.string.trim-left":290,"./modules/es7.string.trim-right":291,"./modules/es7.symbol.async-iterator":292,"./modules/es7.symbol.observable":293,"./modules/es7.system.global":294,"./modules/web.dom.iterable":295,"./modules/web.immediate":296,"./modules/web.timers":297}],299:[function(require,module,exports){
/**
 * Cyclone.js: An Adaptation of the HTML5 structured cloning alogrithm.
 * @author Travis Kaufman <travis.kaufman@gmail.com>
 * @license MIT.
 */

// This module can recursively clone objects, including those containing
// number, boolean, string, date, and regex objects. It can also clone objects
// which include cyclic references to itself, including nested cyclic
// references. It is tested in all ES5-compatible environments.
(function(root) {
  'use strict';

  var _hasOwn = Object.prototype.hasOwnProperty;
  var _toString = Object.prototype.toString;
  var _slice = Array.prototype.slice;

  function _isFunc(obj) {
    return (typeof obj === 'function');
  }

  // Quick and dirty shallow-copy functionality for options hash
  function _mergeParams(src/*, target1, ..., targetN*/) {
    return _slice.call(arguments, 1).reduce(function(target, mixin) {
      for (var key in mixin) {
        if (_hasOwn.call(mixin, key) && !_hasOwn.call(target, key)) {
          target[key] = mixin[key];
        }
      }
      return target;
    }, src);
  }

  // We shim ES6's Map here if it's not in the environment already. Although
  // it would be better to use WeakMaps here, this is impossible to do with ES5
  // since references to objects won't be garbage collected if they're still
  // in the map, so it's better to keep the implementation consistent.
  // We can ignore coverage of the following ternary statement.
  /* istanbul ignore next */
  var Map = _isFunc(root.Map) ? root.Map : function Map() {
    Object.defineProperties(this, {
      inputs: {
        value: [],
        enumerable: false
      },
      outputs: {
        value: [],
        enumerable: false
      }
    });
  };

  // All we need are the `get` and `set` public-facing methods so we shim just
  // them.

  // Ignoring this and the subsequent if statement since we don't need to cover
  // shim conditionals.
  /* istanbul ignore next */
  if (!_isFunc(Map.prototype.set)) {
    // Map a given `input` object to a given `output` object. Relatively
    // straightforward.
    Map.prototype.set = function(input, output) {
      // Note that here for our purposes we *never* have to assert that
      // we're re-assigning since clones will always map 1:1 and never be
      // overridden by another clone in one go. Therefore that conditional logic
      // is omitted.
      this.inputs.push(input);
      this.outputs.push(output);

      // As per the specification, return the Map object
      return this;
    };
  }

  /* istanbul ignore next */
  if (!_isFunc(Map.prototype.get)) {
    // Retrieve the object that's mapped to `input`, or null if input is not
    // found within the transfer map.
    Map.prototype.get = function(input) {
      var idx = this.inputs.indexOf(input);
      var output;

      if (idx > -1) {
        output = this.outputs[idx];
      }

      return output;
    };
  }

  // Any custom cloning procedures defined by the client will be stored here.
  var _customCloneProcedures = [];

  // Performs the "internal structured clone" portion of the structured cloning
  // algorithm. `input` is any valid object, and `mMap` is a(n empty)
  // Map instance. `options` is the same as it is for `clone`
  function _iSClone(input, mMap, options) {

    if (input === null) {
      return null;
    }

    if (Object(input) === input) {
      return _handleObjectClone(input, mMap, options);
    }

    // If the value is a primitive, simply return it.
    return input;
  }

  // Here lies the meat and potatoes of the algorithm. `_handleObjectClone`
  // is responsible for creating deep copies of complex objects. Its parameters
  // are the same as for `_isClone`.
  function _handleObjectClone(input, mMap, options) {
    // First we make sure that we aren't dealing with a circular reference.
    var _selfRef = mMap.get(input);
    if (_selfRef !== undefined) {
      return _selfRef;
    }

    // We also check up front to make sure that a client-defined custom
    // procedure has not been registered for this type of object. If it has,
    // it takes priority over any of the implementations below.
    var _cloneAttempt = _attemptCustomClone(input);
    if (typeof _cloneAttempt !== 'undefined') {
      return _cloneAttempt;
    }

    // Most supported object types can be copied simply by creating a new
    // instance of the object using its current value, so we save that in this
    // variable.
    var val = input.valueOf();
    var obType = _toString.call(input);
    var output;
    // We define a collection as either an array of Objects other than String,
    // Number, Boolean, Date, or RegExp objects. Basically it's any structure
    // where recursive cloning may be necessary.
    var isCollection = false;

    switch (obType) {
      // These cases follow the W3C's specification for how certain objects
      // are handled. Note that jshint will complain about using Object
      // wrappers for primitives (as it should), but we have to handle this
      // case should the client pass one in.

      /*jshint -W053 */
      case '[object String]':
        output = new String(val);
        break;

      case '[object Number]':
        output = new Number(val);
        break;

      case '[object Boolean]':
        output = new Boolean(val);
        break;

      case '[object Date]':
        output = new Date(val);
        break;

      case '[object RegExp]':
        output = _handleRegExpClone(val);
        break;

      case '[object ArrayBuffer]':
        output = _handleArrayBufferClone(input);
        break;

      case '[object Array]':
        output = [];
        isCollection = true;
        break;

      case '[object Object]':
        // Although the spec says to simply create an empty object when
        // encountered with this scenario, we set up the proper prototype chain
        // in order to correctly copy objects that may not directly inherit
        // from Object.prototype.
        output = Object.create(Object.getPrototypeOf(input));
        isCollection = true;
        break;

      default:
        // If `options.allowFunctions` is set to true, we allow functions to
        // be passed directly into the copied object.
        if (_isFunc(input) && (options.allowFunctions === true)) {
          output = input;
        } else if (_isTypedArray(input)) {
          // If it is a typed array, clone it according to the W3C spec
          output = _handleTypedArrayClone(input);
        } else {
          throw new TypeError(
            'Don\'t know how to clone object of type ' + obType
          );
        }
        break;
    }

    // Map this specific object to its output in case its cyclically referenced
    mMap.set(input, output);

    if (isCollection) {
      _handleCollectionClone(input, output, mMap, options);
    }

    return output;
  }

  // Handles the safe cloning of RegExp objects, where we explicitly pass the
  // regex object, the source, and flags separately, as this prevents bugs
  // within phantomJS (and possibly other environments as well).
  function _handleRegExpClone(re) {
    var flags = '';
    if (re.global) {
      flags += 'g';
    }
    if (re.ignoreCase) {
      flags += 'i';
    }
    if (re.multiline) {
      flags += 'm';
    }

    return new RegExp(re.source, flags);
  }

  // Handles the recursive portion of structured cloning.
  function _handleCollectionClone(input, output, mMap, options) {
    // Note that we use own property names here since we've already
    // used `Object.create()` to create the duplicate, so we have
    // already acquired the original object's prototype. Note that the W3C
    // spec explicitly states that this algorithm does *not* walk the
    // prototype chain, and therefore all Object prototypes are live
    // (assigned as a reference).
    Object.getOwnPropertyNames(input).forEach(function(prop) {
      var desc = Object.getOwnPropertyDescriptor(input, prop);
      var isNonAccessor = _hasOwn.call(desc, 'value');
      var inputVal = isNonAccessor ? desc.value : desc.get();
      var outputVal = _iSClone(inputVal, mMap, options);
      // If `options.preserveDescriptors` is true, only then do we preserve
      // descriptors. Otherwise we simply assign the property. This is in an
      // effort to adhere to the spec, since this behaviour errs more towards
      // what developers expect.
      if (options.preserveDescriptors === true) {
        // We only clone if the property is a non-accessor. We can't really
        // clone getters and setters, we can only pass them through.
        if (desc.value !== undefined) {
          desc.value = outputVal;
        }
        Object.defineProperty(output, prop, desc);
      } else {
        output[prop] = outputVal;
      }
    });
  }

  // Handles the cloning of ArrayBuffer objects, as specified in the W3C
  // spec.
  function _handleArrayBufferClone(buf) {
    var dst = new ArrayBuffer(buf.byteLength);
    for (var i = 0, l = buf.byteLength; i < l; i++) {
      dst[i] = buf[i];
    }
    return dst;
  }

  function _isTypedArray(obj) {
    var Ctor = Object.getPrototypeOf(obj).constructor;
    return /^(?:.+)Array$/.test(Ctor.name);
  }

  // Handles the cloning of TypedArray objects, as specified in the W3C
  // spec.
  function _handleTypedArrayClone(typedArray) {
    var TypedArray = Object.getPrototypeOf(typedArray).constructor;
    return new TypedArray(
      _handleArrayBufferClone(typedArray.buffer),
      typedArray.byteOffset,
      typedArray.length
    );
  }

  function _attemptCustomClone(obj) {
    var proc;
    var copy;
    var procIdx = _customCloneProcedures.length;
    // Note that if two procedures passed in detect the same type of object,
    // the latest procedure will take priority.
    while (procIdx--) {
      proc = _customCloneProcedures[procIdx];
      if (proc.detect(obj)) {
        copy = proc.copy(obj);
        break;
      }
    }

    return copy;
  }

  // This is the module that we expose to the rest of the world.
  // CY.clone...get it? :)
  var CY = {
    clone: function(input, options) {
      var result, map = new Map();
      options = _mergeParams(((typeof options === 'object') ? options : {}), {
        // If set to true, this will simply pass a function through to the
        // copied object instead of throwing.
        allowFunctions: false,
        // If set to true, this will stop CY.clone() from throwing *any* errors
        // at all if it can't clone the object. Instead, it will simply return
        // `null`. This is useful if you don't want a bad clone to halt program
        // execution.
        suppressErrors: false
      });

      // Don't enter try/catch unless suppressErrors is given.
      // We want to try to avoid context switches if we can to get the most
      // performance possible out of this function.
      if (options.suppressErrors === true) {
        try {
          result = _iSClone(input, map, options);
        } catch (err) {
          result = null;
        } finally {
          return result;
        }
      }

      return _iSClone(input, map, options);
    },

    // Returns true if the procedure is successfullly defined, false otherwise.
    defineCloneProcedure: function(procObj) {
      // Make sure we can use this procedure
      if (typeof procObj === 'object' &&
          _isFunc(procObj.detect) &&
          _isFunc(procObj.copy)) {

        _customCloneProcedures.push(procObj);
        return true;
      }

      return false;
    },

    clearCustomCloneProcedures: function() {
      _customCloneProcedures = [];
    }
  };

  // Finally we take care of exporting business. We can ignore coverage of this.
  /* istanbul ignore next */
  if (typeof module === 'object' && typeof module.exports === 'object') {
    // Node
    module.exports = CY;
  } else if (typeof define === 'function' && define.amd) {
    // AMD/RequireJS
    define([], function() { return CY; });
  } else {
    // Browser or some other environment. Simply attach the module to the root
    // object.
    root.CY = CY;
  }
})(this);

},{}],300:[function(require,module,exports){
var DOMException;
(function () {
  'use strict';

  var phases = {
    NONE: 0,
    CAPTURING_PHASE: 1,
    AT_TARGET: 2,
    BUBBLING_PHASE: 3
  };

  if (typeof DOMException === 'undefined') {
    // Todo: Better polyfill (if even needed here)
    DOMException = function (msg, name) { // No need for `toString` as same as for `Error`
      var err = new Error(msg);
      err.name = name;
      return err;
    };
  }

  var ev = new WeakMap();
  var evCfg = new WeakMap();

  // Todo: Set _ev argument outside of this function
  /**
  * We use an adapter class rather than a proxy not only for compatibility but also since we have to clone
  * native event properties anyways in order to properly set `target`, etc.
  * @note The regular DOM method `dispatchEvent` won't work with this polyfill as it expects a native event
  */
  var EventPolyfill = function EventPolyfill (type, evInit, _ev) { // eslint-disable-line no-native-reassign
    if (!arguments.length) {
      throw new TypeError("Failed to construct 'Event': 1 argument required, but only 0 present.");
    }
    evInit = evInit || {};
    _ev = _ev || {};

    var _evCfg = {};
    _evCfg.type = type;
    if ('bubbles' in evInit) {
      _evCfg.bubbles = evInit.bubbles;
    }
    if ('cancelable' in evInit) {
      _evCfg.cancelable = evInit.cancelable;
    }
    if ('composed' in evInit) {
      _evCfg.composed = evInit.composed;
    }

    // _evCfg.isTrusted = true; // We are not always using this for user-created events
    // _evCfg.timeStamp = new Date().valueOf(); // This is no longer a timestamp, but monotonic (elapsed?)

    ev.set(this, _ev);
    evCfg.set(this, _evCfg);
    Object.defineProperties(this,
      ['target', 'currentTarget', 'eventPhase', 'defaultPrevented'].reduce(function (obj, prop) {
        obj[prop] = {
          get: function () {
            return (/* prop in _evCfg && */ _evCfg[prop] !== undefined) ? _evCfg[prop] : (
              prop in _ev ? _ev[prop] : (
                // Defaults
                prop === 'eventPhase' ? 0 : (prop === 'defaultPrevented' ? false : null)
              )
            );
          }
        };
        return obj;
      }, {})
    );
    var props = [
      // Event
      'type',
      'bubbles', 'cancelable', // Defaults to false
      'isTrusted', 'timeStamp',
      // Other event properties (not used by our code)
      'composedPath', 'composed', 'initEvent', 'initCustomEvent'
    ];
    if (this.toString() === '[object CustomEvent]') {
      props.push('detail');
    }

    Object.defineProperties(this, props.reduce(function (obj, prop) {
      obj[prop] = {
        get: function () {
          return prop in _evCfg ? _evCfg[prop] : (prop in _ev ? _ev[prop] : (
            ['bubbles', 'cancelable', 'composed'].indexOf(prop) > -1 ? false : undefined
          ));
        }
      };
      return obj;
    }, {}));
  };
  Object.defineProperties(EventPolyfill.prototype, {
    NONE: {writable: false, value: 0},
    CAPTURING_PHASE: {writable: false, value: 1},
    AT_TARGET: {writable: false, value: 2},
    BUBBLING_PHASE: {writable: false, value: 3}
  });
  EventPolyfill.prototype.preventDefault = function () {
    var _ev = ev.get(this);
    var _evCfg = evCfg.get(this);
    if (this.cancelable && !_evCfg._passive) {
      _evCfg.defaultPrevented = true;
      if (typeof _ev.preventDefault === 'function') { // Prevent any predefined defaults
        _ev.preventDefault();
      }
    };
  };
  EventPolyfill.prototype.stopImmediatePropagation = function () {
    var _evCfg = evCfg.get(this);
    _evCfg._stopImmediatePropagation = true;
  };
  EventPolyfill.prototype.stopPropagation = function () {
    var _evCfg = evCfg.get(this);
    _evCfg._stopPropagation = true;
  };
  EventPolyfill.prototype.toString = function () {
    return '[object Event]';
  };

  var CustomEventPolyfill = function (type, eventInitDict, _ev) {
    EventPolyfill.call(this, type, eventInitDict, _ev);
    var _evCfg = evCfg.get(this);
    _evCfg.detail = eventInitDict && typeof eventInitDict === 'object' ? eventInitDict.detail : null;
  };
  CustomEventPolyfill.prototype.toString = function () {
    return '[object CustomEvent]';
  };

  function copyEvent (ev) {
    if ('detail' in ev) {
      return new CustomEventPolyfill(ev.type, {bubbles: ev.bubbles, cancelable: ev.cancelable, detail: ev.detail}, ev);
    }
    return new EventPolyfill(ev.type, {bubbles: ev.bubbles, cancelable: ev.cancelable}, ev);
  }

  function getListenersOptions (listeners, type, options) {
    var listenersByType = listeners[type];
    if (listenersByType === undefined) listeners[type] = listenersByType = [];
    options = typeof options === 'boolean' ? {capture: options} : (options || {});
    var stringifiedOptions = JSON.stringify(options);
    var listenersByTypeOptions = listenersByType.filter(function (obj) {
      return stringifiedOptions === JSON.stringify(obj.options);
    });
    return {listenersByTypeOptions: listenersByTypeOptions, options: options, listenersByType: listenersByType};
  }

  var methods = {
    addListener: function addListener (listeners, listener, type, options) {
      var listenerOptions = getListenersOptions(listeners, type, options);
      var listenersByTypeOptions = listenerOptions.listenersByTypeOptions;
      options = listenerOptions.options;
      var listenersByType = listenerOptions.listenersByType;

      if (listenersByTypeOptions.some(function (l) {
        return l.listener === listener;
      })) return;
      listenersByType.push({listener: listener, options: options});
    },

    removeListener: function removeListener (listeners, listener, type, options) {
      var listenerOptions = getListenersOptions(listeners, type, options);
      var listenersByType = listenerOptions.listenersByType;
      var stringifiedOptions = JSON.stringify(listenerOptions.options);

      listenersByType.some(function (l, i) {
        if (l.listener === listener && stringifiedOptions === JSON.stringify(l.options)) {
          listenersByType.splice(i, 1);
          if (!listenersByType.length) delete listeners[type];
          return true;
        }
      });
    },

    hasListener: function hasListener (listeners, listener, type, options) {
      var listenerOptions = getListenersOptions(listeners, type, options);
      var listenersByTypeOptions = listenerOptions.listenersByTypeOptions;
      return listenersByTypeOptions.some(function (l) {
        return l.listener === listener;
      });
    }
  };

  function EventTarget (customOptions) {
    this.__setOptions(customOptions);
  }

  Object.assign(EventTarget.prototype, ['Early', '', 'Late', 'Default'].reduce(function (obj, listenerType) {
    ['add', 'remove', 'has'].forEach(function (method) {
      obj[method + listenerType + 'EventListener'] = function (type, listener, options) {
        if (arguments.length < 2) throw new TypeError('2 or more arguments required');
        if (typeof type !== 'string') throw new DOMException('UNSPECIFIED_EVENT_TYPE_ERR', 'UNSPECIFIED_EVENT_TYPE_ERR'); // eslint-disable-line eqeqeq
        if (listener.handleEvent) { listener = listener.handleEvent.bind(listener); }
        var arrStr = '_' + listenerType.toLowerCase() + (listenerType === '' ? 'l' : 'L') + 'isteners';
        if (!this[arrStr]) Object.defineProperty(this, arrStr, {value: {}});
        return methods[method + 'Listener'](this[arrStr], listener, type, options);
      };
    });
    return obj;
  }, {}));

  Object.assign(EventTarget.prototype, {
    __setOptions: function (customOptions) {
      customOptions = customOptions || {};
      // Todo: Make into event properties?
      this._defaultSync = customOptions.defaultSync;
      this._extraProperties = customOptions.extraProperties;
    },
    dispatchEvent: function (ev) {
      return this._dispatchEvent(ev, true);
    },
    _dispatchEvent: function (ev, setTarget) {
      var me = this;
      ['early', '', 'late', 'default'].forEach(function (listenerType) {
        var arrStr = '_' + listenerType + (listenerType === '' ? 'l' : 'L') + 'isteners';
        if (!this[arrStr]) Object.defineProperty(this, arrStr, {value: {}});
      }, this);

      var _evCfg = evCfg.get(ev);
      if (_evCfg && setTarget && _evCfg._dispatched) throw new DOMException('The object is in an invalid state.', 'InvalidStateError');

      var eventCopy;
      if (_evCfg) {
        eventCopy = ev;
      } else {
        eventCopy = copyEvent(ev);
        _evCfg = evCfg.get(eventCopy);
        _evCfg._dispatched = true;
        (this._extraProperties || []).forEach(function (prop) {
          if (prop in ev) {
            eventCopy[prop] = ev[prop]; // Todo: Put internal to `EventPolyfill`?
          }
        });
      }
      var type = eventCopy.type;

      function finishEventDispatch () {
        _evCfg.eventPhase = phases.NONE;
        _evCfg.currentTarget = null;
        delete _evCfg._children;
      }
      function invokeDefaults () {
        // Ignore stopPropagation from defaults
        _evCfg._stopImmediatePropagation = undefined;
        _evCfg._stopPropagation = undefined;
        // We check here for whether we should invoke since may have changed since timeout (if late listener prevented default)
        if (!eventCopy.defaultPrevented || !_evCfg.cancelable) { // 2nd check should be redundant
          _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke default listeners
          eventCopy.target.invokeCurrentListeners(eventCopy.target._defaultListeners, eventCopy, type);
        }
        finishEventDispatch();
      }
      function continueEventDispatch () {
        // Ignore stop propagation of user now
        _evCfg._stopImmediatePropagation = undefined;
        _evCfg._stopPropagation = undefined;
        if (!me._defaultSync) {
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
      }

      if (setTarget) _evCfg.target = this;

      switch (eventCopy.eventPhase) {
        default: case phases.NONE:

          _evCfg.eventPhase = phases.AT_TARGET; // Temporarily set before we invoke early listeners
          this.invokeCurrentListeners(this._earlyListeners, eventCopy, type);
          if (!this.__getParent) {
            _evCfg.eventPhase = phases.AT_TARGET;
            return this._dispatchEvent(eventCopy, false);
          }

          var par = this;
          var root = this;
          while (par.__getParent && (par = par.__getParent()) !== null) {
            if (!_evCfg._children) {
              _evCfg._children = [];
            }
            _evCfg._children.push(root);
            root = par;
          }
          root._defaultSync = me._defaultSync;
          _evCfg.eventPhase = phases.CAPTURING_PHASE;
          return root._dispatchEvent(eventCopy, false);
        case phases.CAPTURING_PHASE:
          if (_evCfg._stopPropagation) {
            return continueEventDispatch();
          }
          this.invokeCurrentListeners(this._listeners, eventCopy, type);
          var child = _evCfg._children && _evCfg._children.length && _evCfg._children.pop();
          if (!child || child === eventCopy.target) {
            _evCfg.eventPhase = phases.AT_TARGET;
          }
          if (child) child._defaultSync = me._defaultSync;
          return (child || this)._dispatchEvent(eventCopy, false);
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
          if (_evCfg._stopPropagation) {
            return continueEventDispatch();
          }
          var parent = this.__getParent && this.__getParent();
          if (!parent) {
            return continueEventDispatch();
          }
          parent.invokeCurrentListeners(parent._listeners, eventCopy, type, true);
          parent._defaultSync = me._defaultSync;
          return parent._dispatchEvent(eventCopy, false);
      }
    },
    invokeCurrentListeners: function (listeners, eventCopy, type, checkOnListeners) {
      var _evCfg = evCfg.get(eventCopy);
      var me = this;
      _evCfg.currentTarget = this;

      var listOpts = getListenersOptions(listeners, type, {});
      var listenersByType = listOpts.listenersByType.concat();
      var dummyIPos = listenersByType.length ? 1 : 0;

      listenersByType.some(function (listenerObj, i) {
        var onListener = checkOnListeners ? me['on' + type] : null;
        if (_evCfg._stopImmediatePropagation) return true;
        if (i === dummyIPos && typeof onListener === 'function') {
          // We don't splice this in as could be overwritten; executes here per
          //  https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes:event-handlers-14
          this.tryCatch(function () {
            var ret = onListener.call(eventCopy.currentTarget, eventCopy);
            if (ret === false) {
              eventCopy.preventDefault();
            }
          });
        }
        var options = listenerObj.options;
        var once = options.once; // Remove listener after invoking once
        var passive = options.passive; // Don't allow `preventDefault`
        var capture = options.capture; // Use `_children` and set `eventPhase`
        _evCfg._passive = passive;

        if ((capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.CAPTURING_PHASE) ||
          (eventCopy.eventPhase === phases.AT_TARGET ||
          (!capture && eventCopy.target !== eventCopy.currentTarget && eventCopy.eventPhase === phases.BUBBLING_PHASE))
        ) {
          var listener = listenerObj.listener;
          this.tryCatch(function () {
            listener.call(eventCopy.currentTarget, eventCopy);
          });
          if (once) {
            this.removeEventListener(type, listener, options);
          }
        }
      }, this);
      this.tryCatch(function () {
        var onListener = checkOnListeners ? me['on' + type] : null;
        if (typeof onListener === 'function' && listenersByType.length < 2) {
          var ret = onListener.call(eventCopy.currentTarget, eventCopy); // Won't have executed if too short
          if (ret === false) {
            eventCopy.preventDefault();
          }
        }
      });

      return !eventCopy.defaultPrevented;
    },
    tryCatch: function (cb) {
      try {
        // Per MDN: Exceptions thrown by event handlers are reported
        //  as uncaught exceptions; the event handlers run on a nested
        //  callstack: they block the caller until they complete, but
        //  exceptions do not propagate to the caller.
        cb();
      } catch (err) {
        this.triggerErrorEvent(err);
      }
    },
    triggerErrorEvent: function (err) {
      var error = err;
      if (typeof err === 'string') {
        error = new Error('Uncaught exception: ' + err);
      } else {
        error.message = 'Uncaught exception: ' + err.message;
      }

      var triggerGlobalErrorEvent;
      if (typeof window === 'undefined' || typeof ErrorEvent === 'undefined' || (
          window && typeof window === 'object' && !window.dispatchEvent)
      ) {
        triggerGlobalErrorEvent = function () {
          setTimeout(function () { // Node won't be able to catch in this way if we throw in the main thread
            // console.log(err); // Should we auto-log for user?
            throw error; // Let user listen to `process.on('uncaughtException', function(err) {});`
          });
        };
      } else {
        triggerGlobalErrorEvent = function () {
          // See https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onerror
          //   and https://github.com/w3c/IndexedDB/issues/49

          // Note that a regular Event will properly trigger
          //   `window.addEventListener('error')` handlers, but it will not trigger
          //   `window.onerror` as per https://html.spec.whatwg.org/multipage/webappapis.html#handler-onerror
          // Note also that the following line won't handle `window.addEventListener` handlers
          //    if (window.onerror) window.onerror(error.message, err.fileName, err.lineNumber, error.columnNumber, error);

          // `ErrorEvent` properly triggers `window.onerror` and `window.addEventListener('error')` handlers
          var ev = new ErrorEvent('error', {
            error: err,
            message: error.message || '',
            // We can't get the actually useful user's values!
            filename: error.fileName || '',
            lineno: error.lineNumber || 0,
            colno: error.columnNumber || 0
          });
          window.dispatchEvent(ev);
          // console.log(err); // Should we auto-log for user?
        };
      }
      if (this.__userErrorEventHandler) {
        this.__userErrorEventHandler(error, triggerGlobalErrorEvent);
      } else {
        triggerGlobalErrorEvent();
      }
    }
  });

  // Todo: Move to own library (but allowing WeakMaps to be passed in for sharing here)
  EventTarget.EventPolyfill = EventPolyfill;
  EventTarget.CustomEventPolyfill = CustomEventPolyfill;
  EventTarget.DOMException = DOMException;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventTarget;
  } else {
    window.EventTarget = EventTarget;
  }
}());

},{}],301:[function(require,module,exports){
'use strict';
var types = [
  require('./nextTick'),
  require('./mutation.js'),
  require('./messageChannel'),
  require('./stateChange'),
  require('./timeout')
];
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
module.exports = immediate;
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

},{"./messageChannel":302,"./mutation.js":303,"./nextTick":304,"./stateChange":305,"./timeout":306}],302:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  if (global.setImmediate) {
    // we can only get here in IE10
    // which doesn't handel postMessage well
    return false;
  }
  return typeof global.MessageChannel !== 'undefined';
};

exports.install = function (func) {
  var channel = new global.MessageChannel();
  channel.port1.onmessage = func;
  return function () {
    channel.port2.postMessage(0);
  };
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],303:[function(require,module,exports){
(function (global){
'use strict';
//based off rsvp https://github.com/tildeio/rsvp.js
//license https://github.com/tildeio/rsvp.js/blob/master/LICENSE
//https://github.com/tildeio/rsvp.js/blob/master/lib/rsvp/asap.js

var Mutation = global.MutationObserver || global.WebKitMutationObserver;

exports.test = function () {
  return Mutation;
};

exports.install = function (handle) {
  var called = 0;
  var observer = new Mutation(handle);
  var element = global.document.createTextNode('');
  observer.observe(element, {
    characterData: true
  });
  return function () {
    element.data = (called = ++called % 2);
  };
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],304:[function(require,module,exports){
'use strict';
exports.test = function () {
  // Don't get fooled by e.g. browserify environments.
  return (typeof process !== 'undefined') && !process.browser;
};

exports.install = function (func) {
  return function () {
    process.nextTick(func);
  };
};

},{}],305:[function(require,module,exports){
(function (global){
'use strict';

exports.test = function () {
  return 'document' in global && 'onreadystatechange' in global.document.createElement('script');
};

exports.install = function (handle) {
  return function () {

    // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
    // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
    var scriptEl = global.document.createElement('script');
    scriptEl.onreadystatechange = function () {
      handle();

      scriptEl.onreadystatechange = null;
      scriptEl.parentNode.removeChild(scriptEl);
      scriptEl = null;
    };
    global.document.documentElement.appendChild(scriptEl);

    return handle;
  };
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],306:[function(require,module,exports){
'use strict';
exports.test = function () {
  return true;
};

exports.install = function (t) {
  return function () {
    setTimeout(t, 0);
  };
};
},{}],307:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],308:[function(require,module,exports){
module.exports = function() {};

},{}],309:[function(require,module,exports){
(function (__dirname){
var binary = require('node-pre-gyp');
var path = require('path');
var binding_path = binary.find(path.resolve(path.join(__dirname,'../package.json')));
var binding = require(binding_path);
var sqlite3 = module.exports = exports = binding;
var EventEmitter = require('events').EventEmitter;

function normalizeMethod (fn) {
    return function (sql) {
        var errBack;
        var args = Array.prototype.slice.call(arguments, 1);
        if (typeof args[args.length - 1] === 'function') {
            var callback = args[args.length - 1];
            errBack = function(err) {
                if (err) {
                    callback(err);
                }
            };
        }
        var statement = new Statement(this, sql, errBack);
        return fn.call(this, statement, args);
    };
}

function inherits(target, source) {
    for (var k in source.prototype)
        target.prototype[k] = source.prototype[k];
}

sqlite3.cached = {
    Database: function(file, a, b) {
        if (file === '' || file === ':memory:') {
            // Don't cache special databases.
            return new Database(file, a, b);
        }

        var db;
        file = path.resolve(file);
        function cb() { callback.call(db, null); }

        if (!sqlite3.cached.objects[file]) {
            db = sqlite3.cached.objects[file] = new Database(file, a, b);
        }
        else {
            // Make sure the callback is called.
            db = sqlite3.cached.objects[file];
            var callback = (typeof a === 'number') ? b : a;
            if (typeof callback === 'function') {
                if (db.open) process.nextTick(cb);
                else db.once('open', cb);
            }
        }

        return db;
    },
    objects: {}
};


var Database = sqlite3.Database;
var Statement = sqlite3.Statement;

inherits(Database, EventEmitter);
inherits(Statement, EventEmitter);

// Database#prepare(sql, [bind1, bind2, ...], [callback])
Database.prototype.prepare = normalizeMethod(function(statement, params) {
    return params.length
        ? statement.bind.apply(statement, params)
        : statement;
});

// Database#run(sql, [bind1, bind2, ...], [callback])
Database.prototype.run = normalizeMethod(function(statement, params) {
    statement.run.apply(statement, params).finalize();
    return this;
});

// Database#get(sql, [bind1, bind2, ...], [callback])
Database.prototype.get = normalizeMethod(function(statement, params) {
    statement.get.apply(statement, params).finalize();
    return this;
});

// Database#all(sql, [bind1, bind2, ...], [callback])
Database.prototype.all = normalizeMethod(function(statement, params) {
    statement.all.apply(statement, params).finalize();
    return this;
});

// Database#each(sql, [bind1, bind2, ...], [callback], [complete])
Database.prototype.each = normalizeMethod(function(statement, params) {
    statement.each.apply(statement, params).finalize();
    return this;
});

Database.prototype.map = normalizeMethod(function(statement, params) {
    statement.map.apply(statement, params).finalize();
    return this;
});

Statement.prototype.map = function() {
    var params = Array.prototype.slice.call(arguments);
    var callback = params.pop();
    params.push(function(err, rows) {
        if (err) return callback(err);
        var result = {};
        if (rows.length) {
            var keys = Object.keys(rows[0]), key = keys[0];
            if (keys.length > 2) {
                // Value is an object
                for (var i = 0; i < rows.length; i++) {
                    result[rows[i][key]] = rows[i];
                }
            } else {
                var value = keys[1];
                // Value is a plain value
                for (i = 0; i < rows.length; i++) {
                    result[rows[i][key]] = rows[i][value];
                }
            }
        }
        callback(err, result);
    });
    return this.all.apply(this, params);
};

var isVerbose = false;

var supportedEvents = [ 'trace', 'profile', 'insert', 'update', 'delete' ];

Database.prototype.addListener = Database.prototype.on = function(type) {
    var val = EventEmitter.prototype.addListener.apply(this, arguments);
    if (supportedEvents.indexOf(type) >= 0) {
        this.configure(type, true);
    }
    return val;
};

Database.prototype.removeListener = function(type) {
    var val = EventEmitter.prototype.removeListener.apply(this, arguments);
    if (supportedEvents.indexOf(type) >= 0 && !this._events[type]) {
        this.configure(type, false);
    }
    return val;
};

Database.prototype.removeAllListeners = function(type) {
    var val = EventEmitter.prototype.removeAllListeners.apply(this, arguments);
    if (supportedEvents.indexOf(type) >= 0) {
        this.configure(type, false);
    }
    return val;
};

// Save the stack trace over EIO callbacks.
sqlite3.verbose = function() {
    if (!isVerbose) {
        var trace = require('./trace');
        [
            'prepare',
            'get',
            'run',
            'all',
            'each',
            'map',
            'close',
            'exec'
        ].forEach(function (name) {
            trace.extendTrace(Database.prototype, name);
        });
        [
            'bind',
            'get',
            'run',
            'all',
            'each',
            'map',
            'reset',
            'finalize',
        ].forEach(function (name) {
            trace.extendTrace(Statement.prototype, name);
        });
        isVerbose = true;
    }

    return this;
};

}).call(this,require("path").join(__dirname, "../node_modules/sqlite3/lib"))
},{"./trace":310,"events":undefined,"node-pre-gyp":311,"path":undefined}],310:[function(require,module,exports){
(function (__filename){
// Inspired by https://github.com/tlrobinson/long-stack-traces
var util = require('util');

function extendTrace(object, property, pos) {
    var old = object[property];
    object[property] = function() {
        var error = new Error();
        var name = object.constructor.name + '#' + property + '(' + 
            Array.prototype.slice.call(arguments).map(function(el) {
                return util.inspect(el, false, 0);
            }).join(', ') + ')';

        if (typeof pos === 'undefined') pos = -1;
        if (pos < 0) pos += arguments.length;
        var cb = arguments[pos];
        if (typeof arguments[pos] === 'function') {
            arguments[pos] = function replacement() {
                try {
                    return cb.apply(this, arguments);
                } catch (err) {
                    if (err && err.stack && !err.__augmented) {
                        err.stack = filter(err).join('\n');
                        err.stack += '\n--> in ' + name;
                        err.stack += '\n' + filter(error).slice(1).join('\n');
                        err.__augmented = true;
                    }
                    throw err;
                }
            };
        }
        return old.apply(this, arguments);
    };
}
exports.extendTrace = extendTrace;


function filter(error) {
    return error.stack.split('\n').filter(function(line) {
        return line.indexOf(__filename) < 0;
    });
}

}).call(this,require("path").join(__dirname, "../node_modules/sqlite3/lib/trace.js"))
},{"path":undefined,"util":undefined}],311:[function(require,module,exports){
(function (__dirname){
"use strict";

/**
 * Module exports.
 */

module.exports = exports;

/**
 * Module dependencies.
 */

var path = require('path');
var nopt = require('nopt');
var log = require('npmlog');
var EE = require('events').EventEmitter;
var inherits = require('util').inherits;
var commands = [
      'clean',
      'install',
      'reinstall',
      'build',
      'rebuild',
      'package',
      'testpackage',
      'publish',
      'unpublish',
      'info',
      'testbinary',
      'reveal',
      'configure'
    ];
var aliases = {};

// differentiate node-pre-gyp's logs from npm's
log.heading = 'node-pre-gyp';

exports.find = require('./pre-binding').find;

function Run() {
  var self = this;

  this.commands = {};

  commands.forEach(function (command) {
    self.commands[command] = function (argv, callback) {
      log.verbose('command', command, argv);
      return require('./' + command)(self, argv, callback);
    };
  });
}
inherits(Run, EE);
exports.Run = Run;
var proto = Run.prototype;

/**
 * Export the contents of the package.json.
 */

proto.package = require('../package');

/**
 * nopt configuration definitions
 */

proto.configDefs = {
    help: Boolean,     // everywhere
    arch: String,      // 'configure'
    debug: Boolean,    // 'build'
    directory: String, // bin
    proxy: String,     // 'install'
    loglevel: String,  // everywhere
};

/**
 * nopt shorthands
 */

proto.shorthands = {
    release: '--no-debug',
    C: '--directory',
    debug: '--debug',
    j: '--jobs',
    silent: '--loglevel=silent',
    silly: '--loglevel=silly',
    verbose: '--loglevel=verbose',
};

/**
 * expose the command aliases for the bin file to use.
 */

proto.aliases = aliases;

/**
 * Parses the given argv array and sets the 'opts',
 * 'argv' and 'command' properties.
 */

proto.parseArgv = function parseOpts (argv) {
  this.opts = nopt(this.configDefs, this.shorthands, argv);
  this.argv = this.opts.argv.remain.slice();
  var commands = this.todo = [];

  // create a copy of the argv array with aliases mapped
  argv = this.argv.map(function (arg) {
    // is this an alias?
    if (arg in this.aliases) {
      arg = this.aliases[arg];
    }
    return arg;
  }, this);

  // process the mapped args into "command" objects ("name" and "args" props)
  argv.slice().forEach(function (arg) {
    if (arg in this.commands) {
      var args = argv.splice(0, argv.indexOf(arg));
      argv.shift();
      if (commands.length > 0) {
        commands[commands.length - 1].args = args;
      }
      commands.push({ name: arg, args: [] });
    }
  }, this);
  if (commands.length > 0) {
    commands[commands.length - 1].args = argv.splice(0);
  }

  // support for inheriting config env variables from npm
  var npm_config_prefix = 'npm_config_';
  Object.keys(process.env).forEach(function (name) {
    if (name.indexOf(npm_config_prefix) !== 0) return;
    var val = process.env[name];
    if (name === npm_config_prefix + 'loglevel') {
      log.level = val;
    } else {
      // add the user-defined options to the config
      name = name.substring(npm_config_prefix.length);
      // avoid npm argv clobber already present args
      // which avoids problem of 'npm test' calling
      // script that runs unique npm install commands
      if (name === 'argv') {
         if (this.opts.argv &&
             this.opts.argv.remain &&
             this.opts.argv.remain.length) {
            // do nothing
         } else {
            this.opts[name] = val;
         }
      } else {
        this.opts[name] = val;
      }
    }
  }, this);

  if (this.opts.loglevel) {
    log.level = this.opts.loglevel;
  }
  log.resume();
};

/**
 * Returns the usage instructions for node-pre-gyp.
 */

proto.usage = function usage () {
  var str = [
      '',
      '  Usage: node-pre-gyp <command> [options]',
      '',
      '  where <command> is one of:',
      commands.map(function (c) {
        return '    - ' + c + ' - ' + require('./' + c).usage;
      }).join('\n'),
      '',
      'node-pre-gyp@' + this.version + '  ' + path.resolve(__dirname, '..'),
      'node@' + process.versions.node
  ].join('\n');
  return str;
};

/**
 * Version number getter.
 */

Object.defineProperty(proto, 'version', {
    get: function () {
      return this.package.version;
    },
    enumerable: true
});


}).call(this,require("path").join(__dirname, "../node_modules/sqlite3/lib"))
},{"../package":370,"./pre-binding":312,"events":undefined,"nopt":315,"npmlog":317,"path":undefined,"util":undefined}],312:[function(require,module,exports){
"use strict";

var versioning = require('../lib/util/versioning.js');
var existsSync = require('fs').existsSync || require('path').existsSync;
var path = require('path');

module.exports = exports;

exports.usage = 'Finds the require path for the node-pre-gyp installed module';

exports.validate = function(package_json) {
    versioning.validate_config(package_json);
};

exports.find = function(package_json_path,opts) {
   if (!existsSync(package_json_path)) {
        throw new Error("package.json does not exist at " + package_json_path);
   }
   var package_json = require(package_json_path);
   versioning.validate_config(package_json);
   opts = opts || {};
   if (!opts.module_root) opts.module_root = path.dirname(package_json_path);
   var meta = versioning.evaluate(package_json,opts);
   return meta.module;
};

},{"../lib/util/versioning.js":314,"fs":undefined,"path":undefined}],313:[function(require,module,exports){
module.exports={
  "0.1.14": {
    "node_abi": null,
    "v8": "1.3"
  },
  "0.1.15": {
    "node_abi": null,
    "v8": "1.3"
  },
  "0.1.16": {
    "node_abi": null,
    "v8": "1.3"
  },
  "0.1.17": {
    "node_abi": null,
    "v8": "1.3"
  },
  "0.1.18": {
    "node_abi": null,
    "v8": "1.3"
  },
  "0.1.19": {
    "node_abi": null,
    "v8": "2.0"
  },
  "0.1.20": {
    "node_abi": null,
    "v8": "2.0"
  },
  "0.1.21": {
    "node_abi": null,
    "v8": "2.0"
  },
  "0.1.22": {
    "node_abi": null,
    "v8": "2.0"
  },
  "0.1.23": {
    "node_abi": null,
    "v8": "2.0"
  },
  "0.1.24": {
    "node_abi": null,
    "v8": "2.0"
  },
  "0.1.25": {
    "node_abi": null,
    "v8": "2.0"
  },
  "0.1.26": {
    "node_abi": null,
    "v8": "2.0"
  },
  "0.1.27": {
    "node_abi": null,
    "v8": "2.1"
  },
  "0.1.28": {
    "node_abi": null,
    "v8": "2.1"
  },
  "0.1.29": {
    "node_abi": null,
    "v8": "2.1"
  },
  "0.1.30": {
    "node_abi": null,
    "v8": "2.1"
  },
  "0.1.31": {
    "node_abi": null,
    "v8": "2.1"
  },
  "0.1.32": {
    "node_abi": null,
    "v8": "2.1"
  },
  "0.1.33": {
    "node_abi": null,
    "v8": "2.1"
  },
  "0.1.90": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.91": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.92": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.93": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.94": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.95": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.96": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.97": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.98": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.99": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.100": {
    "node_abi": null,
    "v8": "2.2"
  },
  "0.1.101": {
    "node_abi": null,
    "v8": "2.3"
  },
  "0.1.102": {
    "node_abi": null,
    "v8": "2.3"
  },
  "0.1.103": {
    "node_abi": null,
    "v8": "2.3"
  },
  "0.1.104": {
    "node_abi": null,
    "v8": "2.3"
  },
  "0.2.0": {
    "node_abi": 1,
    "v8": "2.3"
  },
  "0.2.1": {
    "node_abi": 1,
    "v8": "2.3"
  },
  "0.2.2": {
    "node_abi": 1,
    "v8": "2.3"
  },
  "0.2.3": {
    "node_abi": 1,
    "v8": "2.3"
  },
  "0.2.4": {
    "node_abi": 1,
    "v8": "2.3"
  },
  "0.2.5": {
    "node_abi": 1,
    "v8": "2.3"
  },
  "0.2.6": {
    "node_abi": 1,
    "v8": "2.3"
  },
  "0.3.0": {
    "node_abi": 1,
    "v8": "2.5"
  },
  "0.3.1": {
    "node_abi": 1,
    "v8": "2.5"
  },
  "0.3.2": {
    "node_abi": 1,
    "v8": "3.0"
  },
  "0.3.3": {
    "node_abi": 1,
    "v8": "3.0"
  },
  "0.3.4": {
    "node_abi": 1,
    "v8": "3.0"
  },
  "0.3.5": {
    "node_abi": 1,
    "v8": "3.0"
  },
  "0.3.6": {
    "node_abi": 1,
    "v8": "3.0"
  },
  "0.3.7": {
    "node_abi": 1,
    "v8": "3.0"
  },
  "0.3.8": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.0": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.1": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.2": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.3": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.4": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.5": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.6": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.7": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.8": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.9": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.10": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.11": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.4.12": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.5.0": {
    "node_abi": 1,
    "v8": "3.1"
  },
  "0.5.1": {
    "node_abi": 1,
    "v8": "3.4"
  },
  "0.5.2": {
    "node_abi": 1,
    "v8": "3.4"
  },
  "0.5.3": {
    "node_abi": 1,
    "v8": "3.4"
  },
  "0.5.4": {
    "node_abi": 1,
    "v8": "3.5"
  },
  "0.5.5": {
    "node_abi": 1,
    "v8": "3.5"
  },
  "0.5.6": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.5.7": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.5.8": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.5.9": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.5.10": {
    "node_abi": 1,
    "v8": "3.7"
  },
  "0.6.0": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.1": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.2": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.3": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.4": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.5": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.6": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.7": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.8": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.9": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.10": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.11": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.12": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.13": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.14": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.15": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.16": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.17": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.18": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.19": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.20": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.6.21": {
    "node_abi": 1,
    "v8": "3.6"
  },
  "0.7.0": {
    "node_abi": 1,
    "v8": "3.8"
  },
  "0.7.1": {
    "node_abi": 1,
    "v8": "3.8"
  },
  "0.7.2": {
    "node_abi": 1,
    "v8": "3.8"
  },
  "0.7.3": {
    "node_abi": 1,
    "v8": "3.9"
  },
  "0.7.4": {
    "node_abi": 1,
    "v8": "3.9"
  },
  "0.7.5": {
    "node_abi": 1,
    "v8": "3.9"
  },
  "0.7.6": {
    "node_abi": 1,
    "v8": "3.9"
  },
  "0.7.7": {
    "node_abi": 1,
    "v8": "3.9"
  },
  "0.7.8": {
    "node_abi": 1,
    "v8": "3.9"
  },
  "0.7.9": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.7.10": {
    "node_abi": 1,
    "v8": "3.9"
  },
  "0.7.11": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.7.12": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.0": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.1": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.2": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.3": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.4": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.5": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.6": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.7": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.8": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.9": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.10": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.11": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.12": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.13": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.14": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.15": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.16": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.17": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.18": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.19": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.20": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.21": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.22": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.23": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.24": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.25": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.26": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.27": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.8.28": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.9.0": {
    "node_abi": 1,
    "v8": "3.11"
  },
  "0.9.1": {
    "node_abi": 10,
    "v8": "3.11"
  },
  "0.9.2": {
    "node_abi": 10,
    "v8": "3.11"
  },
  "0.9.3": {
    "node_abi": 10,
    "v8": "3.13"
  },
  "0.9.4": {
    "node_abi": 10,
    "v8": "3.13"
  },
  "0.9.5": {
    "node_abi": 10,
    "v8": "3.13"
  },
  "0.9.6": {
    "node_abi": 10,
    "v8": "3.15"
  },
  "0.9.7": {
    "node_abi": 10,
    "v8": "3.15"
  },
  "0.9.8": {
    "node_abi": 10,
    "v8": "3.15"
  },
  "0.9.9": {
    "node_abi": 11,
    "v8": "3.15"
  },
  "0.9.10": {
    "node_abi": 11,
    "v8": "3.15"
  },
  "0.9.11": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.9.12": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.0": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.1": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.2": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.3": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.4": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.5": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.6": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.7": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.8": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.9": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.10": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.11": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.12": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.13": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.14": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.15": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.16": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.17": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.18": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.19": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.20": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.21": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.22": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.23": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.24": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.25": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.26": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.27": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.28": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.29": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.30": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.31": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.32": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.33": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.34": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.35": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.36": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.37": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.38": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.39": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.40": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.41": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.42": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.43": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.44": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.45": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.46": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.47": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.10.48": {
    "node_abi": 11,
    "v8": "3.14"
  },
  "0.11.0": {
    "node_abi": 12,
    "v8": "3.17"
  },
  "0.11.1": {
    "node_abi": 12,
    "v8": "3.18"
  },
  "0.11.2": {
    "node_abi": 12,
    "v8": "3.19"
  },
  "0.11.3": {
    "node_abi": 12,
    "v8": "3.19"
  },
  "0.11.4": {
    "node_abi": 12,
    "v8": "3.20"
  },
  "0.11.5": {
    "node_abi": 12,
    "v8": "3.20"
  },
  "0.11.6": {
    "node_abi": 12,
    "v8": "3.20"
  },
  "0.11.7": {
    "node_abi": 12,
    "v8": "3.20"
  },
  "0.11.8": {
    "node_abi": 13,
    "v8": "3.21"
  },
  "0.11.9": {
    "node_abi": 13,
    "v8": "3.22"
  },
  "0.11.10": {
    "node_abi": 13,
    "v8": "3.22"
  },
  "0.11.11": {
    "node_abi": 14,
    "v8": "3.22"
  },
  "0.11.12": {
    "node_abi": 14,
    "v8": "3.22"
  },
  "0.11.13": {
    "node_abi": 14,
    "v8": "3.25"
  },
  "0.11.14": {
    "node_abi": 14,
    "v8": "3.26"
  },
  "0.11.15": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.11.16": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.0": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.1": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.2": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.3": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.4": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.5": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.6": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.7": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.8": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.9": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.10": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.11": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.12": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.13": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.14": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.15": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.16": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "0.12.17": {
    "node_abi": 14,
    "v8": "3.28"
  },
  "1.0.0": {
    "node_abi": 42,
    "v8": "3.31"
  },
  "1.0.1": {
    "node_abi": 42,
    "v8": "3.31"
  },
  "1.0.2": {
    "node_abi": 42,
    "v8": "3.31"
  },
  "1.0.3": {
    "node_abi": 42,
    "v8": "4.1"
  },
  "1.0.4": {
    "node_abi": 42,
    "v8": "4.1"
  },
  "1.1.0": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.2.0": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.3.0": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.4.1": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.4.2": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.4.3": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.5.0": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.5.1": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.6.0": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.6.1": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.6.2": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.6.3": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.6.4": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.7.1": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.8.1": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.8.2": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.8.3": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "1.8.4": {
    "node_abi": 43,
    "v8": "4.1"
  },
  "2.0.0": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.0.1": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.0.2": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.1.0": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.2.0": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.2.1": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.3.0": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.3.1": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.3.2": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.3.3": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.3.4": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.4.0": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "2.5.0": {
    "node_abi": 44,
    "v8": "4.2"
  },
  "3.0.0": {
    "node_abi": 45,
    "v8": "4.4"
  },
  "3.1.0": {
    "node_abi": 45,
    "v8": "4.4"
  },
  "3.2.0": {
    "node_abi": 45,
    "v8": "4.4"
  },
  "3.3.0": {
    "node_abi": 45,
    "v8": "4.4"
  },
  "3.3.1": {
    "node_abi": 45,
    "v8": "4.4"
  },
  "4.0.0": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.1.0": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.1.1": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.1.2": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.2.0": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.2.1": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.2.2": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.2.3": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.2.4": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.2.5": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.2.6": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.3.0": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.3.1": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.3.2": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.4.0": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.4.1": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.4.2": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.4.3": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.4.4": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.4.5": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.4.6": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.4.7": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.5.0": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.6.0": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "4.6.1": {
    "node_abi": 46,
    "v8": "4.5"
  },
  "5.0.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.1.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.1.1": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.2.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.3.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.4.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.4.1": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.5.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.6.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.7.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.7.1": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.8.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.9.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.9.1": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.10.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.10.1": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.11.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.11.1": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "5.12.0": {
    "node_abi": 47,
    "v8": "4.6"
  },
  "6.0.0": {
    "node_abi": 48,
    "v8": "5.0"
  },
  "6.1.0": {
    "node_abi": 48,
    "v8": "5.0"
  },
  "6.2.0": {
    "node_abi": 48,
    "v8": "5.0"
  },
  "6.2.1": {
    "node_abi": 48,
    "v8": "5.0"
  },
  "6.2.2": {
    "node_abi": 48,
    "v8": "5.0"
  },
  "6.3.0": {
    "node_abi": 48,
    "v8": "5.0"
  },
  "6.3.1": {
    "node_abi": 48,
    "v8": "5.0"
  },
  "6.4.0": {
    "node_abi": 48,
    "v8": "5.0"
  },
  "6.5.0": {
    "node_abi": 48,
    "v8": "5.1"
  },
  "6.6.0": {
    "node_abi": 48,
    "v8": "5.1"
  },
  "6.7.0": {
    "node_abi": 48,
    "v8": "5.1"
  },
  "6.8.0": {
    "node_abi": 48,
    "v8": "5.1"
  },
  "6.8.1": {
    "node_abi": 48,
    "v8": "5.1"
  },
  "6.9.0": {
    "node_abi": 48,
    "v8": "5.1"
  },
  "6.9.1": {
    "node_abi": 48,
    "v8": "5.1"
  }
}
},{}],314:[function(require,module,exports){
"use strict";

module.exports = exports;

var path = require('path');
var semver = require('semver');
var url = require('url');

var abi_crosswalk;

// This is used for unit testing to provide a fake
// ABI crosswalk that emulates one that is not updated
// for the current version
if (process.env.NODE_PRE_GYP_ABI_CROSSWALK) {
    abi_crosswalk = require(process.env.NODE_PRE_GYP_ABI_CROSSWALK);
} else {
    abi_crosswalk = require('./abi_crosswalk.json');
}

function get_electron_abi(runtime, target_version) {
    if (!runtime) {
        throw new Error("get_electron_abi requires valid runtime arg");
    }
    if (typeof target_version === 'undefined') {
        // erroneous CLI call
        throw new Error("Empty target version is not supported if electron is the target.");
    }
    // Electron guarantees that patch version update won't break native modules.
    var sem_ver = semver.parse(target_version);
    return runtime + '-v' + sem_ver.major + '.' + sem_ver.minor;
}
module.exports.get_electron_abi = get_electron_abi;

function get_node_webkit_abi(runtime, target_version) {
    if (!runtime) {
        throw new Error("get_node_webkit_abi requires valid runtime arg");
    }
    if (typeof target_version === 'undefined') {
        // erroneous CLI call
        throw new Error("Empty target version is not supported if node-webkit is the target.");
    }
    return runtime + '-v' + target_version;
}
module.exports.get_node_webkit_abi = get_node_webkit_abi;

function get_node_abi(runtime, versions) {
    if (!runtime) {
        throw new Error("get_node_abi requires valid runtime arg");
    }
    if (!versions) {
        throw new Error("get_node_abi requires valid process.versions object");
    }
    var sem_ver = semver.parse(versions.node);
    if (sem_ver.major === 0 && sem_ver.minor % 2) { // odd series
        // https://github.com/mapbox/node-pre-gyp/issues/124
        return runtime+'-v'+versions.node;
    } else {
        // process.versions.modules added in >= v0.10.4 and v0.11.7
        // https://github.com/joyent/node/commit/ccabd4a6fa8a6eb79d29bc3bbe9fe2b6531c2d8e
        return versions.modules ? runtime+'-v' + (+versions.modules) :
            'v8-' + versions.v8.split('.').slice(0,2).join('.');
    }
}
module.exports.get_node_abi = get_node_abi;

function get_runtime_abi(runtime, target_version) {
    if (!runtime) {
        throw new Error("get_runtime_abi requires valid runtime arg");
    }
    if (runtime === 'node-webkit') {
        return get_node_webkit_abi(runtime, target_version || process.versions['node-webkit']);
    } else if (runtime === 'electron') {
        return get_electron_abi(runtime, target_version || process.versions.electron);
    } else {
        if (runtime != 'node') {
            throw new Error("Unknown Runtime: '" + runtime + "'");
        }
        if (!target_version) {
            return get_node_abi(runtime,process.versions);
        } else {
            var cross_obj;
            // abi_crosswalk generated with ./scripts/abi_crosswalk.js
            if (abi_crosswalk[target_version]) {
                cross_obj = abi_crosswalk[target_version];
            } else {
                var target_parts = target_version.split('.').map(function(i) { return +i; });
                if (target_parts.length != 3) { // parse failed
                    throw new Error("Unknown target version: " + target_version);
                }
                /*
                    The below code tries to infer the last known ABI compatible version
                    that we have recorded in the abi_crosswalk.json when an exact match
                    is not possible. The reasons for this to exist are complicated:

                       - We support passing --target to be able to allow developers to package binaries for versions of node
                         that are not the same one as they are running. This might also be used in combination with the
                         --target_arch or --target_platform flags to also package binaries for alternative platforms
                       - When --target is passed we can't therefore determine the ABI (process.versions.modules) from the node
                         version that is running in memory
                       - So, therefore node-pre-gyp keeps an "ABI crosswalk" (lib/util/abi_crosswalk.json) to be able to look
                         this info up for all versions
                       - But we cannot easily predict what the future ABI will be for released versions
                       - And node-pre-gyp needs to be a `bundledDependency` in apps that depend on it in order to work correctly
                         by being fully available at install time.
                       - So, the speed of node releases and the bundled nature of node-pre-gyp mean that a new node-pre-gyp release
                         need to happen for every node.js/io.js/node-webkit/nw.js/atom-shell/etc release that might come online if
                         you want the `--target` flag to keep working for the latest version
                       - Which is impractical ^^
                       - Hence the below code guesses about future ABI to make the need to update node-pre-gyp less demanding.

                    In practice then you can have a dependency of your app like `node-sqlite3` that bundles a `node-pre-gyp` that
                    only knows about node v0.10.33 in the `abi_crosswalk.json` but target node v0.10.34 (which is assumed to be
                    ABI compatible with v0.10.33).

                    TODO: use semver module instead of custom version parsing
                */
                var major = target_parts[0];
                var minor = target_parts[1];
                var patch = target_parts[2];
                // io.js: yeah if node.js ever releases 1.x this will break
                // but that is unlikely to happen: https://github.com/iojs/io.js/pull/253#issuecomment-69432616
                if (major === 1) {
                    // look for last release that is the same major version
                    // e.g. we assume io.js 1.x is ABI compatible with >= 1.0.0
                    while (true) {
                        if (minor > 0) --minor;
                        if (patch > 0) --patch;
                        var new_iojs_target = '' + major + '.' + minor + '.' + patch;
                        if (abi_crosswalk[new_iojs_target]) {
                            cross_obj = abi_crosswalk[new_iojs_target];
                            console.log('Warning: node-pre-gyp could not find exact match for ' + target_version);
                            console.log('Warning: but node-pre-gyp successfully choose ' + new_iojs_target + ' as ABI compatible target');
                            break;
                        }
                        if (minor === 0 && patch === 0) {
                            break;
                        }
                    }
                } else if (major === 0) { // node.js
                    if (target_parts[1] % 2 === 0) { // for stable/even node.js series
                        // look for the last release that is the same minor release
                        // e.g. we assume node 0.10.x is ABI compatible with >= 0.10.0
                        while (--patch > 0) {
                            var new_node_target = '' + major + '.' + minor + '.' + patch;
                            if (abi_crosswalk[new_node_target]) {
                                cross_obj = abi_crosswalk[new_node_target];
                                console.log('Warning: node-pre-gyp could not find exact match for ' + target_version);
                                console.log('Warning: but node-pre-gyp successfully choose ' + new_node_target + ' as ABI compatible target');
                                break;
                            }
                        }
                    }
                }
            }
            if (!cross_obj) {
                throw new Error("Unsupported target version: " + target_version);
            }
            // emulate process.versions
            var versions_obj = {
                node: target_version,
                v8: cross_obj.v8+'.0',
                // abi_crosswalk uses 1 for node versions lacking process.versions.modules
                // process.versions.modules added in >= v0.10.4 and v0.11.7
                modules: cross_obj.node_abi > 1 ? cross_obj.node_abi : undefined
            };
            return get_node_abi(runtime, versions_obj);
        }
    }
}
module.exports.get_runtime_abi = get_runtime_abi;

var required_parameters = [
    'module_name',
    'module_path',
    'host'
];

function validate_config(package_json) {
    var msg = package_json.name + ' package.json is not node-pre-gyp ready:\n';
    var missing = [];
    if (!package_json.main) {
        missing.push('main');
    }
    if (!package_json.version) {
        missing.push('version');
    }
    if (!package_json.name) {
        missing.push('name');
    }
    if (!package_json.binary) {
        missing.push('binary');
    }
    var o = package_json.binary;
    required_parameters.forEach(function(p) {
        if (missing.indexOf('binary') > -1) {
            missing.pop('binary');
        }
        if (!o || o[p] === undefined) {
            missing.push('binary.' + p);
        }
    });
    if (missing.length >= 1) {
        throw new Error(msg+"package.json must declare these properties: \n" + missing.join('\n'));
    }
    if (o) {
        // enforce https over http
        var protocol = url.parse(o.host).protocol;
        if (protocol === 'http:') {
            throw new Error("'host' protocol ("+protocol+") is invalid - only 'https:' is accepted");
        }
    }
}

module.exports.validate_config = validate_config;

function eval_template(template,opts) {
    Object.keys(opts).forEach(function(key) {
        var pattern = '{'+key+'}';
        while (template.indexOf(pattern) > -1) {
            template = template.replace(pattern,opts[key]);
        }
    });
    return template;
}

// url.resolve needs single trailing slash
// to behave correctly, otherwise a double slash
// may end up in the url which breaks requests
// and a lacking slash may not lead to proper joining
function fix_slashes(pathname) {
    if (pathname.slice(-1) != '/') {
        return pathname + '/';
    }
    return pathname;
}

// remove double slashes
// note: path.normalize will not work because
// it will convert forward to back slashes
function drop_double_slashes(pathname) {
    return pathname.replace(/\/\//g,'/');
}

function get_process_runtime(versions) {
    var runtime = 'node';
    if (versions['node-webkit']) {
        runtime = 'node-webkit';
    } else if (versions.electron) {
        runtime = 'electron';
    }
    return runtime;
}

module.exports.get_process_runtime = get_process_runtime;

var default_package_name = '{module_name}-v{version}-{node_abi}-{platform}-{arch}.tar.gz';
var default_remote_path = '';

module.exports.evaluate = function(package_json,options) {
    options = options || {};
    validate_config(package_json);
    var v = package_json.version;
    var module_version = semver.parse(v);
    var runtime = options.runtime || get_process_runtime(process.versions);
    var opts = {
        name: package_json.name,
        configuration: Boolean(options.debug) ? 'Debug' : 'Release',
        debug: options.debug,
        module_name: package_json.binary.module_name,
        version: module_version.version,
        prerelease: module_version.prerelease.length ? module_version.prerelease.join('.') : '',
        build: module_version.build.length ? module_version.build.join('.') : '',
        major: module_version.major,
        minor: module_version.minor,
        patch: module_version.patch,
        runtime: runtime,
        node_abi: get_runtime_abi(runtime,options.target),
        target: options.target || '',
        platform: options.target_platform || process.platform,
        target_platform: options.target_platform || process.platform,
        arch: options.target_arch || process.arch,
        target_arch: options.target_arch || process.arch,
        module_main: package_json.main,
        toolset : options.toolset || '' // address https://github.com/mapbox/node-pre-gyp/issues/119
    };
    // support host mirror with npm config `--{module_name}_binary_host_mirror`
    // e.g.: https://github.com/node-inspector/v8-profiler/blob/master/package.json#L25
    // > npm install v8-profiler --profiler_binary_host_mirror=https://npm.taobao.org/mirrors/node-inspector/
    var host = process.env['npm_config_' + opts.module_name + '_binary_host_mirror'] || package_json.binary.host;
    opts.host = fix_slashes(eval_template(host,opts));
    opts.module_path = eval_template(package_json.binary.module_path,opts);
    // now we resolve the module_path to ensure it is absolute so that binding.gyp variables work predictably
    if (options.module_root) {
        // resolve relative to known module root: works for pre-binding require
        opts.module_path = path.join(options.module_root,opts.module_path);
    } else {
        // resolve relative to current working directory: works for node-pre-gyp commands
        opts.module_path = path.resolve(opts.module_path);
    }
    opts.module = path.join(opts.module_path,opts.module_name + '.node');
    opts.remote_path = package_json.binary.remote_path ? drop_double_slashes(fix_slashes(eval_template(package_json.binary.remote_path,opts))) : default_remote_path;
    var package_name = package_json.binary.package_name ? package_json.binary.package_name : default_package_name;
    opts.package_name = eval_template(package_name,opts);
    opts.staged_tarball = path.join('build/stage',opts.remote_path,opts.package_name);
    opts.hosted_path = url.resolve(opts.host,opts.remote_path);
    opts.hosted_tarball = url.resolve(opts.hosted_path,opts.package_name);
    return opts;
};

},{"./abi_crosswalk.json":313,"path":undefined,"semver":369,"url":undefined}],315:[function(require,module,exports){
// info about each config option.

var debug = process.env.DEBUG_NOPT || process.env.NOPT_DEBUG
  ? function () { console.error.apply(console, arguments) }
  : function () {}

var url = require("url")
  , path = require("path")
  , Stream = require("stream").Stream
  , abbrev = require("abbrev")

module.exports = exports = nopt
exports.clean = clean

exports.typeDefs =
  { String  : { type: String,  validate: validateString  }
  , Boolean : { type: Boolean, validate: validateBoolean }
  , url     : { type: url,     validate: validateUrl     }
  , Number  : { type: Number,  validate: validateNumber  }
  , path    : { type: path,    validate: validatePath    }
  , Stream  : { type: Stream,  validate: validateStream  }
  , Date    : { type: Date,    validate: validateDate    }
  }

function nopt (types, shorthands, args, slice) {
  args = args || process.argv
  types = types || {}
  shorthands = shorthands || {}
  if (typeof slice !== "number") slice = 2

  debug(types, shorthands, args, slice)

  args = args.slice(slice)
  var data = {}
    , key
    , remain = []
    , cooked = args
    , original = args.slice(0)

  parse(args, data, remain, types, shorthands)
  // now data is full
  clean(data, types, exports.typeDefs)
  data.argv = {remain:remain,cooked:cooked,original:original}
  Object.defineProperty(data.argv, 'toString', { value: function () {
    return this.original.map(JSON.stringify).join(" ")
  }, enumerable: false })
  return data
}

function clean (data, types, typeDefs) {
  typeDefs = typeDefs || exports.typeDefs
  var remove = {}
    , typeDefault = [false, true, null, String, Array]

  Object.keys(data).forEach(function (k) {
    if (k === "argv") return
    var val = data[k]
      , isArray = Array.isArray(val)
      , type = types[k]
    if (!isArray) val = [val]
    if (!type) type = typeDefault
    if (type === Array) type = typeDefault.concat(Array)
    if (!Array.isArray(type)) type = [type]

    debug("val=%j", val)
    debug("types=", type)
    val = val.map(function (val) {
      // if it's an unknown value, then parse false/true/null/numbers/dates
      if (typeof val === "string") {
        debug("string %j", val)
        val = val.trim()
        if ((val === "null" && ~type.indexOf(null))
            || (val === "true" &&
               (~type.indexOf(true) || ~type.indexOf(Boolean)))
            || (val === "false" &&
               (~type.indexOf(false) || ~type.indexOf(Boolean)))) {
          val = JSON.parse(val)
          debug("jsonable %j", val)
        } else if (~type.indexOf(Number) && !isNaN(val)) {
          debug("convert to number", val)
          val = +val
        } else if (~type.indexOf(Date) && !isNaN(Date.parse(val))) {
          debug("convert to date", val)
          val = new Date(val)
        }
      }

      if (!types.hasOwnProperty(k)) {
        return val
      }

      // allow `--no-blah` to set 'blah' to null if null is allowed
      if (val === false && ~type.indexOf(null) &&
          !(~type.indexOf(false) || ~type.indexOf(Boolean))) {
        val = null
      }

      var d = {}
      d[k] = val
      debug("prevalidated val", d, val, types[k])
      if (!validate(d, k, val, types[k], typeDefs)) {
        if (exports.invalidHandler) {
          exports.invalidHandler(k, val, types[k], data)
        } else if (exports.invalidHandler !== false) {
          debug("invalid: "+k+"="+val, types[k])
        }
        return remove
      }
      debug("validated val", d, val, types[k])
      return d[k]
    }).filter(function (val) { return val !== remove })

    if (!val.length) delete data[k]
    else if (isArray) {
      debug(isArray, data[k], val)
      data[k] = val
    } else data[k] = val[0]

    debug("k=%s val=%j", k, val, data[k])
  })
}

function validateString (data, k, val) {
  data[k] = String(val)
}

function validatePath (data, k, val) {
  if (val === true) return false
  if (val === null) return true

  val = String(val)
  var homePattern = process.platform === 'win32' ? /^~(\/|\\)/ : /^~\//
  if (val.match(homePattern) && process.env.HOME) {
    val = path.resolve(process.env.HOME, val.substr(2))
  }
  data[k] = path.resolve(String(val))
  return true
}

function validateNumber (data, k, val) {
  debug("validate Number %j %j %j", k, val, isNaN(val))
  if (isNaN(val)) return false
  data[k] = +val
}

function validateDate (data, k, val) {
  debug("validate Date %j %j %j", k, val, Date.parse(val))
  var s = Date.parse(val)
  if (isNaN(s)) return false
  data[k] = new Date(val)
}

function validateBoolean (data, k, val) {
  if (val instanceof Boolean) val = val.valueOf()
  else if (typeof val === "string") {
    if (!isNaN(val)) val = !!(+val)
    else if (val === "null" || val === "false") val = false
    else val = true
  } else val = !!val
  data[k] = val
}

function validateUrl (data, k, val) {
  val = url.parse(String(val))
  if (!val.host) return false
  data[k] = val.href
}

function validateStream (data, k, val) {
  if (!(val instanceof Stream)) return false
  data[k] = val
}

function validate (data, k, val, type, typeDefs) {
  // arrays are lists of types.
  if (Array.isArray(type)) {
    for (var i = 0, l = type.length; i < l; i ++) {
      if (type[i] === Array) continue
      if (validate(data, k, val, type[i], typeDefs)) return true
    }
    delete data[k]
    return false
  }

  // an array of anything?
  if (type === Array) return true

  // NaN is poisonous.  Means that something is not allowed.
  if (type !== type) {
    debug("Poison NaN", k, val, type)
    delete data[k]
    return false
  }

  // explicit list of values
  if (val === type) {
    debug("Explicitly allowed %j", val)
    // if (isArray) (data[k] = data[k] || []).push(val)
    // else data[k] = val
    data[k] = val
    return true
  }

  // now go through the list of typeDefs, validate against each one.
  var ok = false
    , types = Object.keys(typeDefs)
  for (var i = 0, l = types.length; i < l; i ++) {
    debug("test type %j %j %j", k, val, types[i])
    var t = typeDefs[types[i]]
    if (t &&
      ((type && type.name && t.type && t.type.name) ? (type.name === t.type.name) : (type === t.type))) {
      var d = {}
      ok = false !== t.validate(d, k, val)
      val = d[k]
      if (ok) {
        // if (isArray) (data[k] = data[k] || []).push(val)
        // else data[k] = val
        data[k] = val
        break
      }
    }
  }
  debug("OK? %j (%j %j %j)", ok, k, val, types[i])

  if (!ok) delete data[k]
  return ok
}

function parse (args, data, remain, types, shorthands) {
  debug("parse", args, data, remain)

  var key = null
    , abbrevs = abbrev(Object.keys(types))
    , shortAbbr = abbrev(Object.keys(shorthands))

  for (var i = 0; i < args.length; i ++) {
    var arg = args[i]
    debug("arg", arg)

    if (arg.match(/^-{2,}$/)) {
      // done with keys.
      // the rest are args.
      remain.push.apply(remain, args.slice(i + 1))
      args[i] = "--"
      break
    }
    var hadEq = false
    if (arg.charAt(0) === "-" && arg.length > 1) {
      if (arg.indexOf("=") !== -1) {
        hadEq = true
        var v = arg.split("=")
        arg = v.shift()
        v = v.join("=")
        args.splice.apply(args, [i, 1].concat([arg, v]))
      }

      // see if it's a shorthand
      // if so, splice and back up to re-parse it.
      var shRes = resolveShort(arg, shorthands, shortAbbr, abbrevs)
      debug("arg=%j shRes=%j", arg, shRes)
      if (shRes) {
        debug(arg, shRes)
        args.splice.apply(args, [i, 1].concat(shRes))
        if (arg !== shRes[0]) {
          i --
          continue
        }
      }
      arg = arg.replace(/^-+/, "")
      var no = null
      while (arg.toLowerCase().indexOf("no-") === 0) {
        no = !no
        arg = arg.substr(3)
      }

      if (abbrevs[arg]) arg = abbrevs[arg]

      var isArray = types[arg] === Array ||
        Array.isArray(types[arg]) && types[arg].indexOf(Array) !== -1

      // allow unknown things to be arrays if specified multiple times.
      if (!types.hasOwnProperty(arg) && data.hasOwnProperty(arg)) {
        if (!Array.isArray(data[arg]))
          data[arg] = [data[arg]]
        isArray = true
      }

      var val
        , la = args[i + 1]

      var isBool = typeof no === 'boolean' ||
        types[arg] === Boolean ||
        Array.isArray(types[arg]) && types[arg].indexOf(Boolean) !== -1 ||
        (typeof types[arg] === 'undefined' && !hadEq) ||
        (la === "false" &&
         (types[arg] === null ||
          Array.isArray(types[arg]) && ~types[arg].indexOf(null)))

      if (isBool) {
        // just set and move along
        val = !no
        // however, also support --bool true or --bool false
        if (la === "true" || la === "false") {
          val = JSON.parse(la)
          la = null
          if (no) val = !val
          i ++
        }

        // also support "foo":[Boolean, "bar"] and "--foo bar"
        if (Array.isArray(types[arg]) && la) {
          if (~types[arg].indexOf(la)) {
            // an explicit type
            val = la
            i ++
          } else if ( la === "null" && ~types[arg].indexOf(null) ) {
            // null allowed
            val = null
            i ++
          } else if ( !la.match(/^-{2,}[^-]/) &&
                      !isNaN(la) &&
                      ~types[arg].indexOf(Number) ) {
            // number
            val = +la
            i ++
          } else if ( !la.match(/^-[^-]/) && ~types[arg].indexOf(String) ) {
            // string
            val = la
            i ++
          }
        }

        if (isArray) (data[arg] = data[arg] || []).push(val)
        else data[arg] = val

        continue
      }

      if (types[arg] === String && la === undefined)
        la = ""

      if (la && la.match(/^-{2,}$/)) {
        la = undefined
        i --
      }

      val = la === undefined ? true : la
      if (isArray) (data[arg] = data[arg] || []).push(val)
      else data[arg] = val

      i ++
      continue
    }
    remain.push(arg)
  }
}

function resolveShort (arg, shorthands, shortAbbr, abbrevs) {
  // handle single-char shorthands glommed together, like
  // npm ls -glp, but only if there is one dash, and only if
  // all of the chars are single-char shorthands, and it's
  // not a match to some other abbrev.
  arg = arg.replace(/^-+/, '')

  // if it's an exact known option, then don't go any further
  if (abbrevs[arg] === arg)
    return null

  // if it's an exact known shortopt, same deal
  if (shorthands[arg]) {
    // make it an array, if it's a list of words
    if (shorthands[arg] && !Array.isArray(shorthands[arg]))
      shorthands[arg] = shorthands[arg].split(/\s+/)

    return shorthands[arg]
  }

  // first check to see if this arg is a set of single-char shorthands
  var singles = shorthands.___singles
  if (!singles) {
    singles = Object.keys(shorthands).filter(function (s) {
      return s.length === 1
    }).reduce(function (l,r) {
      l[r] = true
      return l
    }, {})
    shorthands.___singles = singles
    debug('shorthand singles', singles)
  }

  var chrs = arg.split("").filter(function (c) {
    return singles[c]
  })

  if (chrs.join("") === arg) return chrs.map(function (c) {
    return shorthands[c]
  }).reduce(function (l, r) {
    return l.concat(r)
  }, [])


  // if it's an arg abbrev, and not a literal shorthand, then prefer the arg
  if (abbrevs[arg] && !shorthands[arg])
    return null

  // if it's an abbr for a shorthand, then use that
  if (shortAbbr[arg])
    arg = shortAbbr[arg]

  // make it an array, if it's a list of words
  if (shorthands[arg] && !Array.isArray(shorthands[arg]))
    shorthands[arg] = shorthands[arg].split(/\s+/)

  return shorthands[arg]
}

},{"abbrev":316,"path":undefined,"stream":undefined,"url":undefined}],316:[function(require,module,exports){

module.exports = exports = abbrev.abbrev = abbrev

abbrev.monkeyPatch = monkeyPatch

function monkeyPatch () {
  Object.defineProperty(Array.prototype, 'abbrev', {
    value: function () { return abbrev(this) },
    enumerable: false, configurable: true, writable: true
  })

  Object.defineProperty(Object.prototype, 'abbrev', {
    value: function () { return abbrev(Object.keys(this)) },
    enumerable: false, configurable: true, writable: true
  })
}

function abbrev (list) {
  if (arguments.length !== 1 || !Array.isArray(list)) {
    list = Array.prototype.slice.call(arguments, 0)
  }
  for (var i = 0, l = list.length, args = [] ; i < l ; i ++) {
    args[i] = typeof list[i] === "string" ? list[i] : String(list[i])
  }

  // sort them lexicographically, so that they're next to their nearest kin
  args = args.sort(lexSort)

  // walk through each, seeing how much it has in common with the next and previous
  var abbrevs = {}
    , prev = ""
  for (var i = 0, l = args.length ; i < l ; i ++) {
    var current = args[i]
      , next = args[i + 1] || ""
      , nextMatches = true
      , prevMatches = true
    if (current === next) continue
    for (var j = 0, cl = current.length ; j < cl ; j ++) {
      var curChar = current.charAt(j)
      nextMatches = nextMatches && curChar === next.charAt(j)
      prevMatches = prevMatches && curChar === prev.charAt(j)
      if (!nextMatches && !prevMatches) {
        j ++
        break
      }
    }
    prev = current
    if (j === cl) {
      abbrevs[current] = current
      continue
    }
    for (var a = current.substr(0, j) ; j <= cl ; j ++) {
      abbrevs[a] = current
      a += current.charAt(j)
    }
  }
  return abbrevs
}

function lexSort (a, b) {
  return a === b ? 0 : a > b ? 1 : -1
}

},{}],317:[function(require,module,exports){
'use strict'
var Progress = require('are-we-there-yet')
var Gauge = require('gauge')
var EE = require('events').EventEmitter
var log = exports = module.exports = new EE()
var util = require('util')

var setBlocking = require('set-blocking')
var consoleControl = require('console-control-strings')

setBlocking(true)
var stream = process.stderr
Object.defineProperty(log, 'stream', {
  set: function (newStream) {
    stream = newStream
    if (this.gauge) this.gauge.setWriteTo(stream, stream)
  },
  get: function () {
    return stream
  }
})

// by default, decide based on tty-ness.
var colorEnabled
log.useColor = function () {
  return colorEnabled != null ? colorEnabled : stream.isTTY
}

log.enableColor = function () {
  colorEnabled = true
  this.gauge.setTheme({hasColor: colorEnabled, hasUnicode: unicodeEnabled})
}
log.disableColor = function () {
  colorEnabled = false
  this.gauge.setTheme({hasColor: colorEnabled, hasUnicode: unicodeEnabled})
}

// default level
log.level = 'info'

log.gauge = new Gauge(stream, {
  theme: {hasColor: log.useColor()},
  template: [
    {type: 'progressbar', length: 20},
    {type: 'activityIndicator', kerning: 1, length: 1},
    {type: 'section', default: ''},
    ':',
    {type: 'logline', kerning: 1, default: ''}
  ]
})

log.tracker = new Progress.TrackerGroup()

// no progress bars unless asked
log.progressEnabled = false

var unicodeEnabled

log.enableUnicode = function () {
  unicodeEnabled = true
  this.gauge.setTheme({hasColor: this.useColor(), hasUnicode: unicodeEnabled})
}

log.disableUnicode = function () {
  unicodeEnabled = false
  this.gauge.setTheme({hasColor: this.useColor(), hasUnicode: unicodeEnabled})
}

log.setGaugeThemeset = function (themes) {
  this.gauge.setThemeset(themes)
}

log.setGaugeTemplate = function (template) {
  this.gauge.setTemplate(template)
}

log.enableProgress = function () {
  if (this.progressEnabled) return
  this.progressEnabled = true
  if (this._pause) return
  this.tracker.on('change', this.showProgress)
  this.gauge.enable()
  this.showProgress()
}

log.disableProgress = function () {
  if (!this.progressEnabled) return
  this.clearProgress()
  this.progressEnabled = false
  this.tracker.removeListener('change', this.showProgress)
  this.gauge.disable()
}

var trackerConstructors = ['newGroup', 'newItem', 'newStream']

var mixinLog = function (tracker) {
  // mixin the public methods from log into the tracker
  // (except: conflicts and one's we handle specially)
  Object.keys(log).forEach(function (P) {
    if (P[0] === '_') return
    if (trackerConstructors.filter(function (C) { return C === P }).length) return
    if (tracker[P]) return
    if (typeof log[P] !== 'function') return
    var func = log[P]
    tracker[P] = function () {
      return func.apply(log, arguments)
    }
  })
  // if the new tracker is a group, make sure any subtrackers get
  // mixed in too
  if (tracker instanceof Progress.TrackerGroup) {
    trackerConstructors.forEach(function (C) {
      var func = tracker[C]
      tracker[C] = function () { return mixinLog(func.apply(tracker, arguments)) }
    })
  }
  return tracker
}

// Add tracker constructors to the top level log object
trackerConstructors.forEach(function (C) {
  log[C] = function () { return mixinLog(this.tracker[C].apply(this.tracker, arguments)) }
})

log.clearProgress = function (cb) {
  if (!this.progressEnabled) return cb && process.nextTick(cb)
  this.gauge.hide(cb)
}

log.showProgress = function (name, completed) {
  if (!this.progressEnabled) return
  var values = {}
  if (name) values.section = name
  var last = log.record[log.record.length - 1]
  if (last) {
    values.subsection = last.prefix
    var disp = log.disp[last.level] || last.level
    var logline = this._format(disp, log.style[last.level])
    if (last.prefix) logline += ' ' + this._format(last.prefix, this.prefixStyle)
    logline += ' ' + last.message.split(/\r?\n/)[0]
    values.logline = logline
  }
  values.completed = completed || this.tracker.completed()
  this.gauge.show(values)
}.bind(log) // bind for use in tracker's on-change listener

// temporarily stop emitting, but don't drop
log.pause = function () {
  this._paused = true
}

log.resume = function () {
  if (!this._paused) return
  this._paused = false

  var b = this._buffer
  this._buffer = []
  b.forEach(function (m) {
    this.emitLog(m)
  }, this)
  if (this.progressEnabled) this.enableProgress()
}

log._buffer = []

var id = 0
log.record = []
log.maxRecordSize = 10000
log.log = function (lvl, prefix, message) {
  var l = this.levels[lvl]
  if (l === undefined) {
    return this.emit('error', new Error(util.format(
      'Undefined log level: %j', lvl)))
  }

  var a = new Array(arguments.length - 2)
  var stack = null
  for (var i = 2; i < arguments.length; i++) {
    var arg = a[i - 2] = arguments[i]

    // resolve stack traces to a plain string.
    if (typeof arg === 'object' && arg &&
        (arg instanceof Error) && arg.stack) {
      arg.stack = stack = arg.stack + ''
    }
  }
  if (stack) a.unshift(stack + '\n')
  message = util.format.apply(util, a)

  var m = { id: id++,
            level: lvl,
            prefix: String(prefix || ''),
            message: message,
            messageRaw: a }

  this.emit('log', m)
  this.emit('log.' + lvl, m)
  if (m.prefix) this.emit(m.prefix, m)

  this.record.push(m)
  var mrs = this.maxRecordSize
  var n = this.record.length - mrs
  if (n > mrs / 10) {
    var newSize = Math.floor(mrs * 0.9)
    this.record = this.record.slice(-1 * newSize)
  }

  this.emitLog(m)
}.bind(log)

log.emitLog = function (m) {
  if (this._paused) {
    this._buffer.push(m)
    return
  }
  if (this.progressEnabled) this.gauge.pulse(m.prefix)
  var l = this.levels[m.level]
  if (l === undefined) return
  if (l < this.levels[this.level]) return
  if (l > 0 && !isFinite(l)) return

  // If 'disp' is null or undefined, use the lvl as a default
  // Allows: '', 0 as valid disp
  var disp = log.disp[m.level] != null ? log.disp[m.level] : m.level
  this.clearProgress()
  m.message.split(/\r?\n/).forEach(function (line) {
    if (this.heading) {
      this.write(this.heading, this.headingStyle)
      this.write(' ')
    }
    this.write(disp, log.style[m.level])
    var p = m.prefix || ''
    if (p) this.write(' ')
    this.write(p, this.prefixStyle)
    this.write(' ' + line + '\n')
  }, this)
  this.showProgress()
}

log._format = function (msg, style) {
  if (!stream) return

  var output = ''
  if (this.useColor()) {
    style = style || {}
    var settings = []
    if (style.fg) settings.push(style.fg)
    if (style.bg) settings.push('bg' + style.bg[0].toUpperCase() + style.bg.slice(1))
    if (style.bold) settings.push('bold')
    if (style.underline) settings.push('underline')
    if (style.inverse) settings.push('inverse')
    if (settings.length) output += consoleControl.color(settings)
    if (style.beep) output += consoleControl.beep()
  }
  output += msg
  if (this.useColor()) {
    output += consoleControl.color('reset')
  }
  return output
}

log.write = function (msg, style) {
  if (!stream) return

  stream.write(this._format(msg, style))
}

log.addLevel = function (lvl, n, style, disp) {
  // If 'disp' is null or undefined, use the lvl as a default
  if (disp == null) disp = lvl
  this.levels[lvl] = n
  this.style[lvl] = style
  if (!this[lvl]) {
    this[lvl] = function () {
      var a = new Array(arguments.length + 1)
      a[0] = lvl
      for (var i = 0; i < arguments.length; i++) {
        a[i + 1] = arguments[i]
      }
      return this.log.apply(this, a)
    }.bind(this)
  }
  this.disp[lvl] = disp
}

log.prefixStyle = { fg: 'magenta' }
log.headingStyle = { fg: 'white', bg: 'black' }

log.style = {}
log.levels = {}
log.disp = {}
log.addLevel('silly', -Infinity, { inverse: true }, 'sill')
log.addLevel('verbose', 1000, { fg: 'blue', bg: 'black' }, 'verb')
log.addLevel('info', 2000, { fg: 'green' })
log.addLevel('http', 3000, { fg: 'green', bg: 'black' })
log.addLevel('warn', 4000, { fg: 'black', bg: 'yellow' }, 'WARN')
log.addLevel('error', 5000, { fg: 'red', bg: 'black' }, 'ERR!')
log.addLevel('silent', Infinity)

// allow 'error' prefix
log.on('error', function () {})

},{"are-we-there-yet":318,"console-control-strings":339,"events":undefined,"gauge":343,"set-blocking":368,"util":undefined}],318:[function(require,module,exports){
'use strict'
exports.TrackerGroup = require('./tracker-group.js')
exports.Tracker = require('./tracker.js')
exports.TrackerStream = require('./tracker-stream.js')

},{"./tracker-group.js":336,"./tracker-stream.js":337,"./tracker.js":338}],319:[function(require,module,exports){

/**
 * Expose `Delegator`.
 */

module.exports = Delegator;

/**
 * Initialize a delegator.
 *
 * @param {Object} proto
 * @param {String} target
 * @api public
 */

function Delegator(proto, target) {
  if (!(this instanceof Delegator)) return new Delegator(proto, target);
  this.proto = proto;
  this.target = target;
  this.methods = [];
  this.getters = [];
  this.setters = [];
  this.fluents = [];
}

/**
 * Delegate method `name`.
 *
 * @param {String} name
 * @return {Delegator} self
 * @api public
 */

Delegator.prototype.method = function(name){
  var proto = this.proto;
  var target = this.target;
  this.methods.push(name);

  proto[name] = function(){
    return this[target][name].apply(this[target], arguments);
  };

  return this;
};

/**
 * Delegator accessor `name`.
 *
 * @param {String} name
 * @return {Delegator} self
 * @api public
 */

Delegator.prototype.access = function(name){
  return this.getter(name).setter(name);
};

/**
 * Delegator getter `name`.
 *
 * @param {String} name
 * @return {Delegator} self
 * @api public
 */

Delegator.prototype.getter = function(name){
  var proto = this.proto;
  var target = this.target;
  this.getters.push(name);

  proto.__defineGetter__(name, function(){
    return this[target][name];
  });

  return this;
};

/**
 * Delegator setter `name`.
 *
 * @param {String} name
 * @return {Delegator} self
 * @api public
 */

Delegator.prototype.setter = function(name){
  var proto = this.proto;
  var target = this.target;
  this.setters.push(name);

  proto.__defineSetter__(name, function(val){
    return this[target][name] = val;
  });

  return this;
};

/**
 * Delegator fluent accessor
 *
 * @param {String} name
 * @return {Delegator} self
 * @api public
 */

Delegator.prototype.fluent = function (name) {
  var proto = this.proto;
  var target = this.target;
  this.fluents.push(name);

  proto[name] = function(val){
    if ('undefined' != typeof val) {
      this[target][name] = val;
      return this;
    } else {
      return this[target][name];
    }
  };

  return this;
};

},{}],320:[function(require,module,exports){
// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

var keys = objectKeys(Writable.prototype);
for (var v = 0; v < keys.length; v++) {
  var method = keys[v];
  if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  processNextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}
},{"./_stream_readable":322,"./_stream_writable":324,"core-util-is":327,"inherits":328,"process-nextick-args":331}],321:[function(require,module,exports){
// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":323,"core-util-is":327,"inherits":328}],322:[function(require,module,exports){
'use strict';

module.exports = Readable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var StringDecoder;

util.inherits(Readable, Stream);

function prependListener(emitter, event, fn) {
  if (typeof emitter.prependListener === 'function') {
    return emitter.prependListener(event, fn);
  } else {
    // This is a hack to make sure that our error handler is attached before any
    // userland ones.  NEVER DO THIS. This is here only because this code needs
    // to continue to work with older versions of Node.js that do not include
    // the prependListener() method. The goal is to eventually remove this hack.
    if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
  }
}

var Duplex;
function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

var Duplex;
function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options && typeof options.read === 'function') this._read = options.read;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;

  if (!state.objectMode && typeof chunk === 'string') {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = bufferShim.from(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var _e = new Error('stream.unshift() after end event');
      stream.emit('error', _e);
    } else {
      var skipAdd;
      if (state.decoder && !addToFront && !encoding) {
        chunk = state.decoder.write(chunk);
        skipAdd = !state.objectMode && chunk.length === 0;
      }

      if (!addToFront) state.reading = false;

      // Don't add to the buffer if we've decoded to an empty string chunk and
      // we're not in object mode
      if (!skipAdd) {
        // if we want the data now, just emit it.
        if (state.flowing && state.length === 0 && !state.sync) {
          stream.emit('data', chunk);
          stream.read(0);
        } else {
          // update the buffer info.
          state.length += state.objectMode ? 1 : chunk.length;
          if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

          if (state.needReadable) emitReadable(stream);
        }
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) processNextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    processNextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted) processNextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var _i = 0; _i < len; _i++) {
      dests[_i].emit('unpipe', this);
    }return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1) return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        processNextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    processNextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function (ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = bufferShim.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    processNextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function forEach(xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
},{"./_stream_duplex":320,"./internal/streams/BufferList":325,"buffer":undefined,"buffer-shims":326,"core-util-is":327,"events":undefined,"inherits":328,"isarray":330,"process-nextick-args":331,"string_decoder/":332,"util":undefined}],323:[function(require,module,exports){
// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function TransformState(stream) {
  this.afterTransform = function (er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
  this.writeencoding = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (data !== null && data !== undefined) stream.push(data);

  cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  this.once('prefinish', function () {
    if (typeof this._flush === 'function') this._flush(function (er) {
      done(stream, er);
    });else done(stream);
  });
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('Not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

function done(stream, er) {
  if (er) return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length) throw new Error('Calling transform done when ws.length != 0');

  if (ts.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":320,"core-util-is":327,"inherits":328}],324:[function(require,module,exports){
// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

module.exports = Writable;

/*<replacement>*/
var processNextTick = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream;
(function () {
  try {
    Stream = require('st' + 'ream');
  } catch (_) {} finally {
    if (!Stream) Stream = require('events').EventEmitter;
  }
})();
/*</replacement>*/

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

util.inherits(Writable, Stream);

function nop() {}

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

var Duplex;
function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~ ~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function writableStateGetBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
  } catch (_) {}
})();

var Duplex;
function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  processNextTick(cb, er);
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;
  // Always throw error if a null is written
  // if we are not in object mode then throw
  // if it is not a buffer, string, or undefined.
  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    processNextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = bufferShim.from(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);

  if (Buffer.isBuffer(chunk)) encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;
  if (sync) processNextTick(cb, er);else cb(er);

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
        afterWrite(stream, state, finished, cb);
      }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    while (entry) {
      buffer[count] = entry;
      entry = entry.next;
      count += 1;
    }

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequestCount = 0;
  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else {
      prefinish(stream, state);
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) processNextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;

  this.finish = function (err) {
    var entry = _this.entry;
    _this.entry = null;
    while (entry) {
      var cb = entry.callback;
      state.pendingcb--;
      cb(err);
      entry = entry.next;
    }
    if (state.corkedRequestsFree) {
      state.corkedRequestsFree.next = _this;
    } else {
      state.corkedRequestsFree = _this;
    }
  };
}
},{"./_stream_duplex":320,"buffer":undefined,"buffer-shims":326,"core-util-is":327,"events":undefined,"inherits":328,"process-nextick-args":331,"util-deprecate":333}],325:[function(require,module,exports){
'use strict';

var Buffer = require('buffer').Buffer;
/*<replacement>*/
var bufferShim = require('buffer-shims');
/*</replacement>*/

module.exports = BufferList;

function BufferList() {
  this.head = null;
  this.tail = null;
  this.length = 0;
}

BufferList.prototype.push = function (v) {
  var entry = { data: v, next: null };
  if (this.length > 0) this.tail.next = entry;else this.head = entry;
  this.tail = entry;
  ++this.length;
};

BufferList.prototype.unshift = function (v) {
  var entry = { data: v, next: this.head };
  if (this.length === 0) this.tail = entry;
  this.head = entry;
  ++this.length;
};

BufferList.prototype.shift = function () {
  if (this.length === 0) return;
  var ret = this.head.data;
  if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
  --this.length;
  return ret;
};

BufferList.prototype.clear = function () {
  this.head = this.tail = null;
  this.length = 0;
};

BufferList.prototype.join = function (s) {
  if (this.length === 0) return '';
  var p = this.head;
  var ret = '' + p.data;
  while (p = p.next) {
    ret += s + p.data;
  }return ret;
};

BufferList.prototype.concat = function (n) {
  if (this.length === 0) return bufferShim.alloc(0);
  if (this.length === 1) return this.head.data;
  var ret = bufferShim.allocUnsafe(n >>> 0);
  var p = this.head;
  var i = 0;
  while (p) {
    p.data.copy(ret, i);
    i += p.data.length;
    p = p.next;
  }
  return ret;
};
},{"buffer":undefined,"buffer-shims":326}],326:[function(require,module,exports){
(function (global){
'use strict';

var buffer = require('buffer');
var Buffer = buffer.Buffer;
var SlowBuffer = buffer.SlowBuffer;
var MAX_LEN = buffer.kMaxLength || 2147483647;
exports.alloc = function alloc(size, fill, encoding) {
  if (typeof Buffer.alloc === 'function') {
    return Buffer.alloc(size, fill, encoding);
  }
  if (typeof encoding === 'number') {
    throw new TypeError('encoding must not be number');
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size > MAX_LEN) {
    throw new RangeError('size is too large');
  }
  var enc = encoding;
  var _fill = fill;
  if (_fill === undefined) {
    enc = undefined;
    _fill = 0;
  }
  var buf = new Buffer(size);
  if (typeof _fill === 'string') {
    var fillBuf = new Buffer(_fill, enc);
    var flen = fillBuf.length;
    var i = -1;
    while (++i < size) {
      buf[i] = fillBuf[i % flen];
    }
  } else {
    buf.fill(_fill);
  }
  return buf;
}
exports.allocUnsafe = function allocUnsafe(size) {
  if (typeof Buffer.allocUnsafe === 'function') {
    return Buffer.allocUnsafe(size);
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size > MAX_LEN) {
    throw new RangeError('size is too large');
  }
  return new Buffer(size);
}
exports.from = function from(value, encodingOrOffset, length) {
  if (typeof Buffer.from === 'function' && (!global.Uint8Array || Uint8Array.from !== Buffer.from)) {
    return Buffer.from(value, encodingOrOffset, length);
  }
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number');
  }
  if (typeof value === 'string') {
    return new Buffer(value, encodingOrOffset);
  }
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    var offset = encodingOrOffset;
    if (arguments.length === 1) {
      return new Buffer(value);
    }
    if (typeof offset === 'undefined') {
      offset = 0;
    }
    var len = length;
    if (typeof len === 'undefined') {
      len = value.byteLength - offset;
    }
    if (offset >= value.byteLength) {
      throw new RangeError('\'offset\' is out of bounds');
    }
    if (len > value.byteLength - offset) {
      throw new RangeError('\'length\' is out of bounds');
    }
    return new Buffer(value.slice(offset, offset + len));
  }
  if (Buffer.isBuffer(value)) {
    var out = new Buffer(value.length);
    value.copy(out, 0, 0, value.length);
    return out;
  }
  if (value) {
    if (Array.isArray(value) || (typeof ArrayBuffer !== 'undefined' && value.buffer instanceof ArrayBuffer) || 'length' in value) {
      return new Buffer(value);
    }
    if (value.type === 'Buffer' && Array.isArray(value.data)) {
      return new Buffer(value.data);
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ' + 'ArrayBuffer, Array, or array-like object.');
}
exports.allocUnsafeSlow = function allocUnsafeSlow(size) {
  if (typeof Buffer.allocUnsafeSlow === 'function') {
    return Buffer.allocUnsafeSlow(size);
  }
  if (typeof size !== 'number') {
    throw new TypeError('size must be a number');
  }
  if (size >= MAX_LEN) {
    throw new RangeError('size is too large');
  }
  return new SlowBuffer(size);
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"buffer":undefined}],327:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../../../../../../../../../../../is-buffer/index.js")})
},{"../../../../../../../../../../../../is-buffer/index.js":307}],328:[function(require,module,exports){
try {
  var util = require('util');
  if (typeof util.inherits !== 'function') throw '';
  module.exports = util.inherits;
} catch (e) {
  module.exports = require('./inherits_browser.js');
}

},{"./inherits_browser.js":329,"util":undefined}],329:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],330:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],331:[function(require,module,exports){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = nextTick;
} else {
  module.exports = process.nextTick;
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}

},{}],332:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":undefined}],333:[function(require,module,exports){

/**
 * For Node.js, simply re-export the core `util.deprecate` function.
 */

module.exports = require('util').deprecate;

},{"util":undefined}],334:[function(require,module,exports){
var Stream = (function (){
  try {
    return require('st' + 'ream'); // hack to fix a circular dependency issue when used with browserify
  } catch(_){}
}());
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = Stream || exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

if (!process.browser && process.env.READABLE_STREAM === 'disable' && Stream) {
  module.exports = Stream;
}

},{"./lib/_stream_duplex.js":320,"./lib/_stream_passthrough.js":321,"./lib/_stream_readable.js":322,"./lib/_stream_transform.js":323,"./lib/_stream_writable.js":324}],335:[function(require,module,exports){
'use strict'
var EventEmitter = require('events').EventEmitter
var util = require('util')

var trackerId = 0
var TrackerBase = module.exports = function (name) {
  EventEmitter.call(this)
  this.id = ++trackerId
  this.name = name
}
util.inherits(TrackerBase, EventEmitter)

},{"events":undefined,"util":undefined}],336:[function(require,module,exports){
'use strict'
var util = require('util')
var TrackerBase = require('./tracker-base.js')
var Tracker = require('./tracker.js')
var TrackerStream = require('./tracker-stream.js')

var TrackerGroup = module.exports = function (name) {
  TrackerBase.call(this, name)
  this.parentGroup = null
  this.trackers = []
  this.completion = {}
  this.weight = {}
  this.totalWeight = 0
  this.finished = false
  this.bubbleChange = bubbleChange(this)
}
util.inherits(TrackerGroup, TrackerBase)

function bubbleChange (trackerGroup) {
  return function (name, completed, tracker) {
    trackerGroup.completion[tracker.id] = completed
    if (trackerGroup.finished) return
    trackerGroup.emit('change', name || trackerGroup.name, trackerGroup.completed(), trackerGroup)
  }
}

TrackerGroup.prototype.nameInTree = function () {
  var names = []
  var from = this
  while (from) {
    names.unshift(from.name)
    from = from.parentGroup
  }
  return names.join('/')
}

TrackerGroup.prototype.addUnit = function (unit, weight) {
  if (unit.addUnit) {
    var toTest = this
    while (toTest) {
      if (unit === toTest) {
        throw new Error(
          'Attempted to add tracker group ' +
          unit.name + ' to tree that already includes it ' +
          this.nameInTree(this))
      }
      toTest = toTest.parentGroup
    }
    unit.parentGroup = this
  }
  this.weight[unit.id] = weight || 1
  this.totalWeight += this.weight[unit.id]
  this.trackers.push(unit)
  this.completion[unit.id] = unit.completed()
  unit.on('change', this.bubbleChange)
  if (!this.finished) this.emit('change', unit.name, this.completion[unit.id], unit)
  return unit
}

TrackerGroup.prototype.completed = function () {
  if (this.trackers.length === 0) return 0
  var valPerWeight = 1 / this.totalWeight
  var completed = 0
  for (var ii = 0; ii < this.trackers.length; ii++) {
    var trackerId = this.trackers[ii].id
    completed += valPerWeight * this.weight[trackerId] * this.completion[trackerId]
  }
  return completed
}

TrackerGroup.prototype.newGroup = function (name, weight) {
  return this.addUnit(new TrackerGroup(name), weight)
}

TrackerGroup.prototype.newItem = function (name, todo, weight) {
  return this.addUnit(new Tracker(name, todo), weight)
}

TrackerGroup.prototype.newStream = function (name, todo, weight) {
  return this.addUnit(new TrackerStream(name, todo), weight)
}

TrackerGroup.prototype.finish = function () {
  this.finished = true
  if (!this.trackers.length) this.addUnit(new Tracker(), 1, true)
  for (var ii = 0; ii < this.trackers.length; ii++) {
    var tracker = this.trackers[ii]
    tracker.finish()
    tracker.removeListener('change', this.bubbleChange)
  }
  this.emit('change', this.name, 1, this)
}

var buffer = '                                  '
TrackerGroup.prototype.debug = function (depth) {
  depth = depth || 0
  var indent = depth ? buffer.substr(0, depth) : ''
  var output = indent + (this.name || 'top') + ': ' + this.completed() + '\n'
  this.trackers.forEach(function (tracker) {
    if (tracker instanceof TrackerGroup) {
      output += tracker.debug(depth + 1)
    } else {
      output += indent + ' ' + tracker.name + ': ' + tracker.completed() + '\n'
    }
  })
  return output
}

},{"./tracker-base.js":335,"./tracker-stream.js":337,"./tracker.js":338,"util":undefined}],337:[function(require,module,exports){
'use strict'
var util = require('util')
var stream = require('readable-stream')
var delegate = require('delegates')
var Tracker = require('./tracker.js')

var TrackerStream = module.exports = function (name, size, options) {
  stream.Transform.call(this, options)
  this.tracker = new Tracker(name, size)
  this.name = name
  this.id = this.tracker.id
  this.tracker.on('change', delegateChange(this))
}
util.inherits(TrackerStream, stream.Transform)

function delegateChange (trackerStream) {
  return function (name, completion, tracker) {
    trackerStream.emit('change', name, completion, trackerStream)
  }
}

TrackerStream.prototype._transform = function (data, encoding, cb) {
  this.tracker.completeWork(data.length ? data.length : 1)
  this.push(data)
  cb()
}

TrackerStream.prototype._flush = function (cb) {
  this.tracker.finish()
  cb()
}

delegate(TrackerStream.prototype, 'tracker')
  .method('completed')
  .method('addWork')

},{"./tracker.js":338,"delegates":319,"readable-stream":334,"util":undefined}],338:[function(require,module,exports){
'use strict'
var util = require('util')
var TrackerBase = require('./tracker-base.js')

var Tracker = module.exports = function (name, todo) {
  TrackerBase.call(this, name)
  this.workDone = 0
  this.workTodo = todo || 0
}
util.inherits(Tracker, TrackerBase)

Tracker.prototype.completed = function () {
  return this.workTodo === 0 ? 0 : this.workDone / this.workTodo
}

Tracker.prototype.addWork = function (work) {
  this.workTodo += work
  this.emit('change', this.name, this.completed(), this)
}

Tracker.prototype.completeWork = function (work) {
  this.workDone += work
  if (this.workDone > this.workTodo) this.workDone = this.workTodo
  this.emit('change', this.name, this.completed(), this)
}

Tracker.prototype.finish = function () {
  this.workTodo = this.workDone = 1
  this.emit('change', this.name, 1, this)
}

},{"./tracker-base.js":335,"util":undefined}],339:[function(require,module,exports){
'use strict'

// These tables borrowed from `ansi`

var prefix = '\x1b['

exports.up = function up (num) {
  return prefix + (num || '') + 'A'
}

exports.down = function down (num) {
  return prefix + (num || '') + 'B'
}

exports.forward = function forward (num) {
  return prefix + (num || '') + 'C'
}

exports.back = function back (num) {
  return prefix + (num || '') + 'D'
}

exports.nextLine = function nextLine (num) {
  return prefix + (num || '') + 'E'
}

exports.previousLine = function previousLine (num) {
  return prefix + (num || '') + 'F'
}

exports.horizontalAbsolute = function horizontalAbsolute (num) {
  if (num == null) throw new Error('horizontalAboslute requires a column to position to')
  return prefix + num + 'G'
}

exports.eraseData = function eraseData () {
  return prefix + 'J'
}

exports.eraseLine = function eraseLine () {
  return prefix + 'K'
}

exports.goto = function (x, y) {
  return prefix + y + ';' + x + 'H'
}

exports.gotoSOL = function () {
  return '\r'
}

exports.beep = function () {
  return '\x07'
}

exports.hideCursor = function hideCursor () {
  return prefix + '?25l'
}

exports.showCursor = function showCursor () {
  return prefix + '?25h'
}

var colors = {
  reset: 0,
// styles
  bold: 1,
  italic: 3,
  underline: 4,
  inverse: 7,
// resets
  stopBold: 22,
  stopItalic: 23,
  stopUnderline: 24,
  stopInverse: 27,
// colors
  white: 37,
  black: 30,
  blue: 34,
  cyan: 36,
  green: 32,
  magenta: 35,
  red: 31,
  yellow: 33,
  bgWhite: 47,
  bgBlack: 40,
  bgBlue: 44,
  bgCyan: 46,
  bgGreen: 42,
  bgMagenta: 45,
  bgRed: 41,
  bgYellow: 43,

  grey: 90,
  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,

  bgGrey: 100,
  bgBrightBlack: 100,
  bgBrightRed: 101,
  bgBrightGreen: 102,
  bgBrightYellow: 103,
  bgBrightBlue: 104,
  bgBrightMagenta: 105,
  bgBrightCyan: 106,
  bgBrightWhite: 107
}

exports.color = function color (colorWith) {
  if (arguments.length !== 1 || !Array.isArray(colorWith)) {
    colorWith = Array.prototype.slice.call(arguments)
  }
  return prefix + colorWith.map(colorNameToCode).join(';') + 'm'
}

function colorNameToCode (color) {
  if (colors[color] != null) return colors[color]
  throw new Error('Unknown color or style name: ' + color)
}

},{}],340:[function(require,module,exports){
'use strict'
var spin = require('./spin.js')
var progressBar = require('./progress-bar.js')

module.exports = {
  activityIndicator: function (values, theme, width) {
    if (values.spun == null) return
    return spin(theme, values.spun)
  },
  progressbar: function (values, theme, width) {
    if (values.completed == null) return
    return progressBar(theme, width, values.completed)
  }
}

},{"./progress-bar.js":359,"./spin.js":363}],341:[function(require,module,exports){
'use strict'
var util = require('util')

var User = exports.User = function User (msg) {
  var err = new Error(msg)
  Error.captureStackTrace(err, User)
  err.code = 'EGAUGE'
  return err
}

exports.MissingTemplateValue = function MissingTemplateValue (item, values) {
  var err = new User(util.format('Missing template value "%s"', item.type))
  Error.captureStackTrace(err, MissingTemplateValue)
  err.template = item
  err.values = values
  return err
}

exports.Internal = function Internal (msg) {
  var err = new Error(msg)
  Error.captureStackTrace(err, Internal)
  err.code = 'EGAUGEINTERNAL'
  return err
}

},{"util":undefined}],342:[function(require,module,exports){
'use strict'

module.exports = isWin32() || isColorTerm()

function isWin32 () {
  return process.platform === 'win32'
}

function isColorTerm () {
  var termHasColor = /^screen|^xterm|^vt100|color|ansi|cygwin|linux/i
  return !!process.env.COLORTERM || termHasColor.test(process.env.TERM)
}

},{}],343:[function(require,module,exports){
'use strict'
var Plumbing = require('./plumbing.js')
var hasUnicode = require('has-unicode')
var hasColor = require('./has-color.js')
var onExit = require('signal-exit')
var defaultThemes = require('./themes')
var setInterval = require('./set-interval.js')
var process = require('./process.js')
var setImmediate = require('./set-immediate')

module.exports = Gauge

function callWith (obj, method) {
  return function () {
    return method.call(obj)
  }
}

function Gauge (arg1, arg2) {
  var options, writeTo
  if (arg1 && arg1.write) {
    writeTo = arg1
    options = arg2 || {}
  } else if (arg2 && arg2.write) {
    writeTo = arg2
    options = arg1 || {}
  } else {
    writeTo = process.stderr
    options = arg1 || arg2 || {}
  }

  this._status = {
    spun: 0,
    section: '',
    subsection: ''
  }
  this._paused = false // are we paused for back pressure?
  this._disabled = true // are all progress bar updates disabled?
  this._showing = false // do we WANT the progress bar on screen
  this._onScreen = false // IS the progress bar on screen
  this._needsRedraw = false // should we print something at next tick?
  this._hideCursor = options.hideCursor == null ? true : options.hideCursor
  this._fixedFramerate = options.fixedFramerate == null
    ? !(/^v0\.8\./.test(process.version))
    : options.fixedFramerate
  this._lastUpdateAt = null
  this._updateInterval = options.updateInterval == null ? 50 : options.updateInterval

  this._themes = options.themes || defaultThemes
  this._theme = options.theme
  var theme = this._computeTheme(options.theme)
  var template = options.template || [
    {type: 'progressbar', length: 20},
    {type: 'activityIndicator', kerning: 1, length: 1},
    {type: 'section', kerning: 1, default: ''},
    {type: 'subsection', kerning: 1, default: ''}
  ]
  this.setWriteTo(writeTo, options.tty)
  var PlumbingClass = options.Plumbing || Plumbing
  this._gauge = new PlumbingClass(theme, template, this.getWidth())

  this._$$doRedraw = callWith(this, this._doRedraw)
  this._$$handleSizeChange = callWith(this, this._handleSizeChange)

  if (options.cleanupOnExit == null || options.cleanupOnExit) {
    onExit(callWith(this, this.disable))
  }

  if (options.enabled || (options.enabled == null && this._tty && this._tty.isTTY)) {
    this.enable()
  } else {
    this.disable()
  }
}
Gauge.prototype = {}

Gauge.prototype.setTemplate = function (template) {
  this._gauge.setTemplate(template)
  if (this._showing) this._requestRedraw()
}

Gauge.prototype._computeTheme = function (theme) {
  if (!theme) theme = {}
  if (theme && (Object.keys(theme).length === 0 || theme.hasUnicode != null || theme.hasColor != null)) {
    var useUnicode = theme.hasUnicode == null ? hasUnicode() : theme.hasUnicode
    var useColor = theme.hasColor == null ? hasColor : theme.hasColor
    theme = this._themes.getDefault({hasUnicode: useUnicode, hasColor: useColor, platform: theme.platform})
  } else if (typeof theme === 'string') {
    theme = this._themes.getTheme(theme)
  }
  return theme
}

Gauge.prototype.setThemeset = function (themes) {
  this._themes = themes
  this.setTheme(this._theme)
}

Gauge.prototype.setTheme = function (theme) {
  this._gauge.setTheme(this._computeTheme(theme))
  if (this._showing) this._requestRedraw()
  this._theme = theme
}

Gauge.prototype._requestRedraw = function () {
  this._needsRedraw = true
  if (!this._fixedFramerate) this._doRedraw()
}

Gauge.prototype.getWidth = function () {
  return ((this._tty && this._tty.columns) || 80) - 1
}

Gauge.prototype.setWriteTo = function (writeTo, tty) {
  var enabled = !this._disabled
  if (enabled) this.disable()
  this._writeTo = writeTo
  this._tty = tty ||
    (writeTo === process.stderr && process.stdout.isTTY && process.stdout) ||
    (writeTo.isTTY && writeTo) ||
    this._tty
  if (this._gauge) this._gauge.setWidth(this.getWidth())
  if (enabled) this.enable()
}

Gauge.prototype.enable = function () {
  if (!this._disabled) return
  this._disabled = false
  if (this._tty) this._enableEvents()
  if (this._showing) this.show()
}

Gauge.prototype.disable = function () {
  if (this._disabled) return
  if (this._showing) {
    this._lastUpdateAt = null
    this._showing = false
    this._doRedraw()
    this._showing = true
  }
  this._disabled = true
  if (this._tty) this._disableEvents()
}

Gauge.prototype._enableEvents = function () {
  this._tty.on('resize', this._$$handleSizeChange)
  if (this._fixedFramerate) {
    this.redrawTracker = setInterval(this._$$doRedraw, this._updateInterval)
    if (this.redrawTracker.unref) this.redrawTracker.unref()
  }
}

Gauge.prototype._disableEvents = function () {
  this._tty.removeListener('resize', this._$$handleSizeChange)
  if (this._fixedFramerate) clearInterval(this.redrawTracker)
}

Gauge.prototype.hide = function (cb) {
  if (this._disabled) return cb && process.nextTick(cb)
  if (!this._showing) return cb && process.nextTick(cb)
  this._showing = false
  this._doRedraw()
  cb && setImmediate(cb)
}

Gauge.prototype.show = function (section, completed) {
  if (this._disabled) return
  this._showing = true
  if (typeof section === 'string') {
    this._status.section = section
  } else if (typeof section === 'object') {
    var sectionKeys = Object.keys(section)
    for (var ii = 0; ii < sectionKeys.length; ++ii) {
      var key = sectionKeys[ii]
      this._status[key] = section[key]
    }
  }
  if (completed != null) this._status.completed = completed
  this._requestRedraw()
}

Gauge.prototype.pulse = function (subsection) {
  if (this._disabled) return
  if (!this._showing) return
  this._status.subsection = subsection || ''
  this._status.spun ++
  this._requestRedraw()
}

Gauge.prototype._handleSizeChange = function () {
  this._gauge.setWidth(this._tty.columns - 1)
  this._requestRedraw()
}

Gauge.prototype._doRedraw = function () {
  if (this._disabled || this._paused) return
  if (!this._fixedFramerate) {
    var now = Date.now()
    if (this._lastUpdateAt && now - this._lastUpdateAt < this._updateInterval) return
    this._lastUpdateAt = now
  }
  if (!this._showing && this._onScreen) {
    this._onScreen = false
    var result = this._gauge.hide()
    if (this._hideCursor) {
      result += this._gauge.showCursor()
    }
    return this._writeTo.write(result)
  }
  if (!this._showing && !this._onScreen) return
  if (this._showing && !this._onScreen) {
    this._onScreen = true
    this._needsRedraw = true
    if (this._hideCursor) {
      this._writeTo.write(this._gauge.hideCursor())
    }
  }
  if (!this._needsRedraw) return
  if (!this._writeTo.write(this._gauge.show(this._status))) {
    this._paused = true
    this._writeTo.on('drain', callWith(this, function () {
      this._paused = false
      this._doRedraw()
    }))
  }
}

},{"./has-color.js":342,"./plumbing.js":357,"./process.js":358,"./set-immediate":361,"./set-interval.js":362,"./themes":366,"has-unicode":345,"signal-exit":347}],344:[function(require,module,exports){
'use strict'

function isArguments (thingy) {
  return typeof thingy === 'object' && thingy.hasOwnProperty('callee')
}

var types = {
  '*': ['any', function () { return true }],
  A: ['array', function (thingy) { return Array.isArray(thingy) || isArguments(thingy) }],
  S: ['string', function (thingy) { return typeof thingy === 'string' }],
  N: ['number', function (thingy) { return typeof thingy === 'number' }],
  F: ['function', function (thingy) { return typeof thingy === 'function' }],
  O: ['object', function (thingy) { return typeof thingy === 'object' && !types.A[1](thingy) && !types.E[1](thingy) }],
  B: ['boolean', function (thingy) { return typeof thingy === 'boolean' }],
  E: ['error', function (thingy) { return thingy instanceof Error }]
}

var validate = module.exports = function (schema, args) {
  if (!schema) throw missingRequiredArg(0, 'schema')
  if (!args) throw missingRequiredArg(1, 'args')
  if (!types.S[1](schema)) throw invalidType(0, 'string', schema)
  if (!types.A[1](args)) throw invalidType(1, 'array', args)
  for (var ii = 0; ii < schema.length; ++ii) {
    var type = schema[ii]
    if (!types[type]) throw unknownType(ii, type)
    var typeLabel = types[type][0]
    var typeCheck = types[type][1]
    if (type === 'E' && args[ii] == null) continue
    if (args[ii] == null) throw missingRequiredArg(ii)
    if (!typeCheck(args[ii])) throw invalidType(ii, typeLabel, args[ii])
    if (type === 'E') return
  }
  if (schema.length < args.length) throw tooManyArgs(schema.length, args.length)
}

function missingRequiredArg (num) {
  return newException('EMISSINGARG', 'Missing required argument #' + (num + 1))
}

function unknownType (num, type) {
  return newException('EUNKNOWNTYPE', 'Unknown type ' + type + ' in argument #' + (num + 1))
}

function invalidType (num, expectedType, value) {
  var valueType
  Object.keys(types).forEach(function (typeCode) {
    if (types[typeCode][1](value)) valueType = types[typeCode][0]
  })
  return newException('EINVALIDTYPE', 'Argument #' + (num + 1) + ': Expected ' +
    expectedType + ' but got ' + valueType)
}

function tooManyArgs (expected, got) {
  return newException('ETOOMANYARGS', 'Too many arguments, expected ' + expected + ' and got ' + got)
}

function newException (code, msg) {
  var e = new Error(msg)
  e.code = code
  Error.captureStackTrace(e, validate)
  return e
}

},{}],345:[function(require,module,exports){
"use strict"
var os = require("os")

var hasUnicode = module.exports = function () {
  // Recent Win32 platforms (>XP) CAN support unicode in the console but
  // don't have to, and in non-english locales often use traditional local
  // code pages. There's no way, short of windows system calls or execing
  // the chcp command line program to figure this out. As such, we default
  // this to false and encourage your users to override it via config if
  // appropriate.
  if (os.type() == "Windows_NT") { return false }

  var isUTF8 = /UTF-?8$/i
  var ctype = process.env.LC_ALL || process.env.LC_CTYPE || process.env.LANG
  return isUTF8.test(ctype)
}

},{"os":undefined}],346:[function(require,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],347:[function(require,module,exports){
// Note: since nyc uses this module to output coverage, any lines
// that are in the direct sync flow of nyc's outputCoverage are
// ignored, since we can never get coverage for them.
var assert = require('assert')
var signals = require('./signals.js')

var EE = require('events')
/* istanbul ignore if */
if (typeof EE !== 'function') {
  EE = EE.EventEmitter
}

var emitter
if (process.__signal_exit_emitter__) {
  emitter = process.__signal_exit_emitter__
} else {
  emitter = process.__signal_exit_emitter__ = new EE()
  emitter.count = 0
  emitter.emitted = {}
}

module.exports = function (cb, opts) {
  assert.equal(typeof cb, 'function', 'a callback must be provided for exit handler')

  if (loaded === false) {
    load()
  }

  var ev = 'exit'
  if (opts && opts.alwaysLast) {
    ev = 'afterexit'
  }

  var remove = function () {
    emitter.removeListener(ev, cb)
    if (emitter.listeners('exit').length === 0 &&
        emitter.listeners('afterexit').length === 0) {
      unload()
    }
  }
  emitter.on(ev, cb)

  return remove
}

module.exports.unload = unload
function unload () {
  if (!loaded) {
    return
  }
  loaded = false

  signals.forEach(function (sig) {
    try {
      process.removeListener(sig, sigListeners[sig])
    } catch (er) {}
  })
  process.emit = originalProcessEmit
  process.reallyExit = originalProcessReallyExit
  emitter.count -= 1
}

function emit (event, code, signal) {
  if (emitter.emitted[event]) {
    return
  }
  emitter.emitted[event] = true
  emitter.emit(event, code, signal)
}

// { <signal>: <listener fn>, ... }
var sigListeners = {}
signals.forEach(function (sig) {
  sigListeners[sig] = function listener () {
    // If there are no other listeners, an exit is coming!
    // Simplest way: remove us and then re-send the signal.
    // We know that this will kill the process, so we can
    // safely emit now.
    var listeners = process.listeners(sig)
    if (listeners.length === emitter.count) {
      unload()
      emit('exit', null, sig)
      /* istanbul ignore next */
      emit('afterexit', null, sig)
      /* istanbul ignore next */
      process.kill(process.pid, sig)
    }
  }
})

module.exports.signals = function () {
  return signals
}

module.exports.load = load

var loaded = false

function load () {
  if (loaded) {
    return
  }
  loaded = true

  // This is the number of onSignalExit's that are in play.
  // It's important so that we can count the correct number of
  // listeners on signals, and don't wait for the other one to
  // handle it instead of us.
  emitter.count += 1

  signals = signals.filter(function (sig) {
    try {
      process.on(sig, sigListeners[sig])
      return true
    } catch (er) {
      return false
    }
  })

  process.emit = processEmit
  process.reallyExit = processReallyExit
}

var originalProcessReallyExit = process.reallyExit
function processReallyExit (code) {
  process.exitCode = code || 0
  emit('exit', process.exitCode, null)
  /* istanbul ignore next */
  emit('afterexit', process.exitCode, null)
  /* istanbul ignore next */
  originalProcessReallyExit.call(process, process.exitCode)
}

var originalProcessEmit = process.emit
function processEmit (ev, arg) {
  if (ev === 'exit') {
    if (arg !== undefined) {
      process.exitCode = arg
    }
    var ret = originalProcessEmit.apply(this, arguments)
    emit('exit', process.exitCode, null)
    /* istanbul ignore next */
    emit('afterexit', process.exitCode, null)
    return ret
  } else {
    return originalProcessEmit.apply(this, arguments)
  }
}

},{"./signals.js":348,"assert":undefined,"events":undefined}],348:[function(require,module,exports){
// This is not the set of all possible signals.
//
// It IS, however, the set of all signals that trigger
// an exit on either Linux or BSD systems.  Linux is a
// superset of the signal names supported on BSD, and
// the unknown signals just fail to register, so we can
// catch that easily enough.
//
// Don't bother with SIGKILL.  It's uncatchable, which
// means that we can't fire any callbacks anyway.
//
// If a user does happen to register a handler on a non-
// fatal signal like SIGWINCH or something, and then
// exit, it'll end up firing `process.emit('exit')`, so
// the handler will be fired anyway.
//
// SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
// artificially, inherently leave the process in a
// state from which it is not safe to try and enter JS
// listeners.
module.exports = [
  'SIGABRT',
  'SIGALRM',
  'SIGHUP',
  'SIGINT',
  'SIGTERM'
]

if (process.platform !== 'win32') {
  module.exports.push(
    'SIGVTALRM',
    'SIGXCPU',
    'SIGXFSZ',
    'SIGUSR2',
    'SIGTRAP',
    'SIGSYS',
    'SIGQUIT',
    'SIGIOT'
    // should detect profiler and enable/disable accordingly.
    // see #21
    // 'SIGPROF'
  )
}

if (process.platform === 'linux') {
  module.exports.push(
    'SIGIO',
    'SIGPOLL',
    'SIGPWR',
    'SIGSTKFLT',
    'SIGUNUSED'
  )
}

},{}],349:[function(require,module,exports){
'use strict';
var stripAnsi = require('strip-ansi');
var codePointAt = require('code-point-at');
var isFullwidthCodePoint = require('is-fullwidth-code-point');

// https://github.com/nodejs/io.js/blob/cff7300a578be1b10001f2d967aaedc88aee6402/lib/readline.js#L1345
module.exports = function (str) {
	if (typeof str !== 'string' || str.length === 0) {
		return 0;
	}

	var width = 0;

	str = stripAnsi(str);

	for (var i = 0; i < str.length; i++) {
		var code = codePointAt(str, i);

		// ignore control characters
		if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
			continue;
		}

		// surrogates
		if (code >= 0x10000) {
			i++;
		}

		if (isFullwidthCodePoint(code)) {
			width += 2;
		} else {
			width++;
		}
	}

	return width;
};

},{"code-point-at":350,"is-fullwidth-code-point":352,"strip-ansi":354}],350:[function(require,module,exports){
'use strict';
var numberIsNan = require('number-is-nan');

module.exports = function (str, pos) {
	if (str === null || str === undefined) {
		throw TypeError();
	}

	str = String(str);

	var size = str.length;
	var i = pos ? Number(pos) : 0;

	if (numberIsNan(i)) {
		i = 0;
	}

	if (i < 0 || i >= size) {
		return undefined;
	}

	var first = str.charCodeAt(i);

	if (first >= 0xD800 && first <= 0xDBFF && size > i + 1) {
		var second = str.charCodeAt(i + 1);

		if (second >= 0xDC00 && second <= 0xDFFF) {
			return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
		}
	}

	return first;
};

},{"number-is-nan":351}],351:[function(require,module,exports){
'use strict';
module.exports = Number.isNaN || function (x) {
	return x !== x;
};

},{}],352:[function(require,module,exports){
'use strict';
var numberIsNan = require('number-is-nan');

module.exports = function (x) {
	if (numberIsNan(x)) {
		return false;
	}

	// https://github.com/nodejs/io.js/blob/cff7300a578be1b10001f2d967aaedc88aee6402/lib/readline.js#L1369

	// code points are derived from:
	// http://www.unix.org/Public/UNIDATA/EastAsianWidth.txt
	if (x >= 0x1100 && (
		x <= 0x115f ||  // Hangul Jamo
		0x2329 === x || // LEFT-POINTING ANGLE BRACKET
		0x232a === x || // RIGHT-POINTING ANGLE BRACKET
		// CJK Radicals Supplement .. Enclosed CJK Letters and Months
		(0x2e80 <= x && x <= 0x3247 && x !== 0x303f) ||
		// Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
		0x3250 <= x && x <= 0x4dbf ||
		// CJK Unified Ideographs .. Yi Radicals
		0x4e00 <= x && x <= 0xa4c6 ||
		// Hangul Jamo Extended-A
		0xa960 <= x && x <= 0xa97c ||
		// Hangul Syllables
		0xac00 <= x && x <= 0xd7a3 ||
		// CJK Compatibility Ideographs
		0xf900 <= x && x <= 0xfaff ||
		// Vertical Forms
		0xfe10 <= x && x <= 0xfe19 ||
		// CJK Compatibility Forms .. Small Form Variants
		0xfe30 <= x && x <= 0xfe6b ||
		// Halfwidth and Fullwidth Forms
		0xff01 <= x && x <= 0xff60 ||
		0xffe0 <= x && x <= 0xffe6 ||
		// Kana Supplement
		0x1b000 <= x && x <= 0x1b001 ||
		// Enclosed Ideographic Supplement
		0x1f200 <= x && x <= 0x1f251 ||
		// CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
		0x20000 <= x && x <= 0x3fffd)) {
		return true;
	}

	return false;
}

},{"number-is-nan":353}],353:[function(require,module,exports){
arguments[4][351][0].apply(exports,arguments)
},{"dup":351}],354:[function(require,module,exports){
'use strict';
var ansiRegex = require('ansi-regex')();

module.exports = function (str) {
	return typeof str === 'string' ? str.replace(ansiRegex, '') : str;
};

},{"ansi-regex":355}],355:[function(require,module,exports){
'use strict';
module.exports = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
};

},{}],356:[function(require,module,exports){
'use strict'
var stringWidth = require('string-width')

exports.center = alignCenter
exports.left = alignLeft
exports.right = alignRight

// lodash's way of generating pad characters.

function createPadding (width) {
  var result = ''
  var string = ' '
  var n = width
  do {
    if (n % 2) {
      result += string;
    }
    n = Math.floor(n / 2);
    string += string;
  } while (n);

  return result;
}

function alignLeft (str, width) {
  var trimmed = str.trimRight()
  if (trimmed.length === 0 && str.length >= width) return str
  var padding = ''
  var strWidth = stringWidth(trimmed)

  if (strWidth < width) {
    padding = createPadding(width - strWidth)
  }

  return trimmed + padding
}

function alignRight (str, width) {
  var trimmed = str.trimLeft()
  if (trimmed.length === 0 && str.length >= width) return str
  var padding = ''
  var strWidth = stringWidth(trimmed)

  if (strWidth < width) {
    padding = createPadding(width - strWidth)
  }

  return padding + trimmed
}

function alignCenter (str, width) {
  var trimmed = str.trim()
  if (trimmed.length === 0 && str.length >= width) return str
  var padLeft = ''
  var padRight = ''
  var strWidth = stringWidth(trimmed)

  if (strWidth < width) {
    var padLeftBy = parseInt((width - strWidth) / 2, 10) 
    padLeft = createPadding(padLeftBy)
    padRight = createPadding(width - (strWidth + padLeftBy))
  }

  return padLeft + trimmed + padRight
}

},{"string-width":349}],357:[function(require,module,exports){
'use strict'
var consoleControl = require('console-control-strings')
var renderTemplate = require('./render-template.js')
var validate = require('aproba')

var Plumbing = module.exports = function (theme, template, width) {
  if (!width) width = 80
  validate('OAN', [theme, template, width])
  this.showing = false
  this.theme = theme
  this.width = width
  this.template = template
}
Plumbing.prototype = {}

Plumbing.prototype.setTheme = function (theme) {
  validate('O', [theme])
  this.theme = theme
}

Plumbing.prototype.setTemplate = function (template) {
  validate('A', [template])
  this.template = template
}

Plumbing.prototype.setWidth = function (width) {
  validate('N', [width])
  this.width = width
}

Plumbing.prototype.hide = function () {
  return consoleControl.gotoSOL() + consoleControl.eraseLine()
}

Plumbing.prototype.hideCursor = consoleControl.hideCursor

Plumbing.prototype.showCursor = consoleControl.showCursor

Plumbing.prototype.show = function (status) {
  var values = Object.create(this.theme)
  for (var key in status) {
    values[key] = status[key]
  }

  return renderTemplate(this.width, this.template, values).trim() +
         consoleControl.eraseLine() + consoleControl.gotoSOL()
}

},{"./render-template.js":360,"aproba":344,"console-control-strings":339}],358:[function(require,module,exports){
'use strict'
// this exists so we can replace it during testing
module.exports = process

},{}],359:[function(require,module,exports){
'use strict'
var validate = require('aproba')
var renderTemplate = require('./render-template.js')
var wideTruncate = require('./wide-truncate')
var stringWidth = require('string-width')

module.exports = function (theme, width, completed) {
  validate('ONN', [theme, width, completed])
  if (completed < 0) completed = 0
  if (completed > 1) completed = 1
  if (width <= 0) return ''
  var sofar = Math.round(width * completed)
  var rest = width - sofar
  var template = [
    {type: 'complete', value: repeat(theme.complete, sofar), length: sofar},
    {type: 'remaining', value: repeat(theme.remaining, rest), length: rest}
  ]
  return renderTemplate(width, template, theme)
}

// lodash's way of repeating
function repeat (string, width) {
  var result = ''
  var n = width
  do {
    if (n % 2) {
      result += string
    }
    n = Math.floor(n / 2)
    /*eslint no-self-assign: 0*/
    string += string
  } while (n && stringWidth(result) < width)

  return wideTruncate(result, width)
}

},{"./render-template.js":360,"./wide-truncate":367,"aproba":344,"string-width":349}],360:[function(require,module,exports){
'use strict'
var align = require('wide-align')
var validate = require('aproba')
var objectAssign = require('object-assign')
var wideTruncate = require('./wide-truncate')
var error = require('./error')
var TemplateItem = require('./template-item')

function renderValueWithValues (values) {
  return function (item) {
    return renderValue(item, values)
  }
}

var renderTemplate = module.exports = function (width, template, values) {
  var items = prepareItems(width, template, values)
  var rendered = items.map(renderValueWithValues(values)).join('')
  return align.left(wideTruncate(rendered, width), width)
}

function preType (item) {
  var cappedTypeName = item.type[0].toUpperCase() + item.type.slice(1)
  return 'pre' + cappedTypeName
}

function postType (item) {
  var cappedTypeName = item.type[0].toUpperCase() + item.type.slice(1)
  return 'post' + cappedTypeName
}

function hasPreOrPost (item, values) {
  if (!item.type) return
  return values[preType(item)] || values[postType(item)]
}

function generatePreAndPost (baseItem, parentValues) {
  var item = objectAssign({}, baseItem)
  var values = Object.create(parentValues)
  var template = []
  var pre = preType(item)
  var post = postType(item)
  if (values[pre]) {
    template.push({value: values[pre]})
    values[pre] = null
  }
  item.minLength = null
  item.length = null
  item.maxLength = null
  template.push(item)
  values[item.type] = values[item.type]
  if (values[post]) {
    template.push({value: values[post]})
    values[post] = null
  }
  return function ($1, $2, length) {
    return renderTemplate(length, template, values)
  }
}

function prepareItems (width, template, values) {
  function cloneAndObjectify (item, index, arr) {
    var cloned = new TemplateItem(item, width)
    var type = cloned.type
    if (cloned.value == null) {
      if (!(type in values)) {
        if (cloned.default == null) {
          throw new error.MissingTemplateValue(cloned, values)
        } else {
          cloned.value = cloned.default
        }
      } else {
        cloned.value = values[type]
      }
    }
    if (cloned.value == null || cloned.value === '') return null
    cloned.index = index
    cloned.first = index === 0
    cloned.last = index === arr.length - 1
    if (hasPreOrPost(cloned, values)) cloned.value = generatePreAndPost(cloned, values)
    return cloned
  }

  var output = template.map(cloneAndObjectify).filter(function (item) { return item != null })

  var outputLength = 0
  var remainingSpace = width
  var variableCount = output.length

  function consumeSpace (length) {
    if (length > remainingSpace) length = remainingSpace
    outputLength += length
    remainingSpace -= length
  }

  function finishSizing (item, length) {
    if (item.finished) throw new error.Internal('Tried to finish template item that was already finished')
    if (length === Infinity) throw new error.Internal('Length of template item cannot be infinity')
    if (length != null) item.length = length
    item.minLength = null
    item.maxLength = null
    --variableCount
    item.finished = true
    if (item.length == null) item.length = item.getBaseLength()
    if (item.length == null) throw new error.Internal('Finished template items must have a length')
    consumeSpace(item.getLength())
  }

  output.forEach(function (item) {
    if (!item.kerning) return
    var prevPadRight = item.first ? 0 : output[item.index - 1].padRight
    if (!item.first && prevPadRight < item.kerning) item.padLeft = item.kerning - prevPadRight
    if (!item.last) item.padRight = item.kerning
  })

  // Finish any that have a fixed (literal or intuited) length
  output.forEach(function (item) {
    if (item.getBaseLength() == null) return
    finishSizing(item)
  })

  var resized = 0
  var resizing
  var hunkSize
  do {
    resizing = false
    hunkSize = Math.round(remainingSpace / variableCount)
    output.forEach(function (item) {
      if (item.finished) return
      if (!item.maxLength) return
      if (item.getMaxLength() < hunkSize) {
        finishSizing(item, item.maxLength)
        resizing = true
      }
    })
  } while (resizing && resized++ < output.length)
  if (resizing) throw new error.Internal('Resize loop iterated too many times while determining maxLength')

  resized = 0
  do {
    resizing = false
    hunkSize = Math.round(remainingSpace / variableCount)
    output.forEach(function (item) {
      if (item.finished) return
      if (!item.minLength) return
      if (item.getMinLength() >= hunkSize) {
        finishSizing(item, item.minLength)
        resizing = true
      }
    })
  } while (resizing && resized++ < output.length)
  if (resizing) throw new error.Internal('Resize loop iterated too many times while determining minLength')

  hunkSize = Math.round(remainingSpace / variableCount)
  output.forEach(function (item) {
    if (item.finished) return
    finishSizing(item, hunkSize)
  })

  return output
}

function renderFunction (item, values, length) {
  validate('OON', arguments)
  if (item.type) {
    return item.value(values, values[item.type + 'Theme'] || {}, length)
  } else {
    return item.value(values, {}, length)
  }
}

function renderValue (item, values) {
  var length = item.getBaseLength()
  var value = typeof item.value === 'function' ? renderFunction(item, values, length) : item.value
  if (value == null || value === '') return ''
  var alignWith = align[item.align] || align.left
  var leftPadding = item.padLeft ? align.left('', item.padLeft) : ''
  var rightPadding = item.padRight ? align.right('', item.padRight) : ''
  var truncated = wideTruncate(String(value), length)
  var aligned = alignWith(truncated, length)
  return leftPadding + aligned + rightPadding
}

},{"./error":341,"./template-item":364,"./wide-truncate":367,"aproba":344,"object-assign":346,"wide-align":356}],361:[function(require,module,exports){
'use strict'
var process = require('./process')
try {
  module.exports = setImmediate
} catch (ex) {
  module.exports = process.nextTick
}

},{"./process":358}],362:[function(require,module,exports){
'use strict'
// this exists so we can replace it during testing
module.exports = setInterval

},{}],363:[function(require,module,exports){
'use strict'

module.exports = function spin (spinstr, spun) {
  return spinstr[spun % spinstr.length]
}

},{}],364:[function(require,module,exports){
'use strict'
var stringWidth = require('string-width')

module.exports = TemplateItem

function isPercent (num) {
  if (typeof num !== 'string') return false
  return num.slice(-1) === '%'
}

function percent (num) {
  return Number(num.slice(0, -1)) / 100
}

function TemplateItem (values, outputLength) {
  this.overallOutputLength = outputLength
  this.finished = false
  this.type = null
  this.value = null
  this.length = null
  this.maxLength = null
  this.minLength = null
  this.kerning = null
  this.align = 'left'
  this.padLeft = 0
  this.padRight = 0
  this.index = null
  this.first = null
  this.last = null
  if (typeof values === 'string') {
    this.value = values
  } else {
    for (var prop in values) this[prop] = values[prop]
  }
  // Realize percents
  if (isPercent(this.length)) {
    this.length = Math.round(this.overallOutputLength * percent(this.length))
  }
  if (isPercent(this.minLength)) {
    this.minLength = Math.round(this.overallOutputLength * percent(this.minLength))
  }
  if (isPercent(this.maxLength)) {
    this.maxLength = Math.round(this.overallOutputLength * percent(this.maxLength))
  }
  return this
}

TemplateItem.prototype = {}

TemplateItem.prototype.getBaseLength = function () {
  var length = this.length
  if (length == null && typeof this.value === 'string' && this.maxLength == null && this.minLength == null) {
    length = stringWidth(this.value)
  }
  return length
}

TemplateItem.prototype.getLength = function () {
  var length = this.getBaseLength()
  if (length == null) return null
  return length + this.padLeft + this.padRight
}

TemplateItem.prototype.getMaxLength = function () {
  if (this.maxLength == null) return null
  return this.maxLength + this.padLeft + this.padRight
}

TemplateItem.prototype.getMinLength = function () {
  if (this.minLength == null) return null
  return this.minLength + this.padLeft + this.padRight
}


},{"string-width":349}],365:[function(require,module,exports){
'use strict'
var objectAssign = require('object-assign')

module.exports = function () {
  return ThemeSetProto.newThemeSet()
}

var ThemeSetProto = {}

ThemeSetProto.baseTheme = require('./base-theme.js')

ThemeSetProto.newTheme = function (parent, theme) {
  if (!theme) {
    theme = parent
    parent = this.baseTheme
  }
  return objectAssign({}, parent, theme)
}

ThemeSetProto.getThemeNames = function () {
  return Object.keys(this.themes)
}

ThemeSetProto.addTheme = function (name, parent, theme) {
  this.themes[name] = this.newTheme(parent, theme)
}

ThemeSetProto.addToAllThemes = function (theme) {
  var themes = this.themes
  Object.keys(themes).forEach(function (name) {
    objectAssign(themes[name], theme)
  })
  objectAssign(this.baseTheme, theme)
}

ThemeSetProto.getTheme = function (name) {
  if (!this.themes[name]) throw this.newMissingThemeError(name)
  return this.themes[name]
}

ThemeSetProto.setDefault = function (opts, name) {
  if (name == null) {
    name = opts
    opts = {}
  }
  var platform = opts.platform == null ? 'fallback' : opts.platform
  var hasUnicode = !!opts.hasUnicode
  var hasColor = !!opts.hasColor
  if (!this.defaults[platform]) this.defaults[platform] = {true: {}, false: {}}
  this.defaults[platform][hasUnicode][hasColor] = name
}

ThemeSetProto.getDefault = function (opts) {
  if (!opts) opts = {}
  var platformName = opts.platform || process.platform
  var platform = this.defaults[platformName] || this.defaults.fallback
  var hasUnicode = !!opts.hasUnicode
  var hasColor = !!opts.hasColor
  if (!platform) throw this.newMissingDefaultThemeError(platformName, hasUnicode, hasColor)
  if (!platform[hasUnicode][hasColor]) {
    if (hasUnicode && hasColor && platform[!hasUnicode][hasColor]) {
      hasUnicode = false
    } else if (hasUnicode && hasColor && platform[hasUnicode][!hasColor]) {
      hasColor = false
    } else if (hasUnicode && hasColor && platform[!hasUnicode][!hasColor]) {
      hasUnicode = false
      hasColor = false
    } else if (hasUnicode && !hasColor && platform[!hasUnicode][hasColor]) {
      hasUnicode = false
    } else if (!hasUnicode && hasColor && platform[hasUnicode][!hasColor]) {
      hasColor = false
    } else if (platform === this.defaults.fallback) {
      throw this.newMissingDefaultThemeError(platformName, hasUnicode, hasColor)
    }
  }
  if (platform[hasUnicode][hasColor]) {
    return this.getTheme(platform[hasUnicode][hasColor])
  } else {
    return this.getDefault(objectAssign({}, opts, {platform: 'fallback'}))
  }
}

ThemeSetProto.newMissingThemeError = function newMissingThemeError (name) {
  var err = new Error('Could not find a gauge theme named "' + name + '"')
  Error.captureStackTrace.call(err, newMissingThemeError)
  err.theme = name
  err.code = 'EMISSINGTHEME'
  return err
}

ThemeSetProto.newMissingDefaultThemeError = function newMissingDefaultThemeError (platformName, hasUnicode, hasColor) {
  var err = new Error(
    'Could not find a gauge theme for your platform/unicode/color use combo:\n' +
    '    platform = ' + platformName + '\n' +
    '    hasUnicode = ' + hasUnicode + '\n' +
    '    hasColor = ' + hasColor)
  Error.captureStackTrace.call(err, newMissingDefaultThemeError)
  err.platform = platformName
  err.hasUnicode = hasUnicode
  err.hasColor = hasColor
  err.code = 'EMISSINGTHEME'
  return err
}

ThemeSetProto.newThemeSet = function () {
  var themeset = function (opts) {
    return themeset.getDefault(opts)
  }
  return objectAssign(themeset, ThemeSetProto, {
    themes: objectAssign({}, this.themes),
    baseTheme: objectAssign({}, this.baseTheme),
    defaults: JSON.parse(JSON.stringify(this.defaults || {}))
  })
}


},{"./base-theme.js":340,"object-assign":346}],366:[function(require,module,exports){
'use strict'
var consoleControl = require('console-control-strings')
var ThemeSet = require('./theme-set.js')

var themes = module.exports = new ThemeSet()

themes.addTheme('ASCII', {
  preProgressbar: '[',
  postProgressbar: ']',
  progressbarTheme: {
    complete: '#',
    remaining: '.'
  },
  activityIndicatorTheme: '-\\|/',
  preSubsection: '>'
})

themes.addTheme('colorASCII', themes.getTheme('ASCII'), {
  progressbarTheme: {
    preComplete: consoleControl.color('inverse'),
    complete: ' ',
    postComplete: consoleControl.color('stopInverse'),
    preRemaining: consoleControl.color('brightBlack'),
    remaining: '.',
    postRemaining: consoleControl.color('reset')
  }
})

themes.addTheme('brailleSpinner', {
  preProgressbar: '⸨',
  postProgressbar: '⸩',
  progressbarTheme: {
    complete: '░',
    remaining: '⠂'
  },
  activityIndicatorTheme: '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏',
  preSubsection: '>'
})

themes.addTheme('colorBrailleSpinner', themes.getTheme('brailleSpinner'), {
  progressbarTheme: {
    preComplete: consoleControl.color('inverse'),
    complete: ' ',
    postComplete: consoleControl.color('stopInverse'),
    preRemaining: consoleControl.color('brightBlack'),
    remaining: '░',
    postRemaining: consoleControl.color('reset')
  }
})

themes.setDefault({}, 'ASCII')
themes.setDefault({hasColor: true}, 'colorASCII')
themes.setDefault({platform: 'darwin', hasUnicode: true}, 'brailleSpinner')
themes.setDefault({platform: 'darwin', hasUnicode: true, hasColor: true}, 'colorBrailleSpinner')

},{"./theme-set.js":365,"console-control-strings":339}],367:[function(require,module,exports){
'use strict'
var stringWidth = require('string-width')
var stripAnsi = require('strip-ansi')

module.exports = wideTruncate

function wideTruncate (str, target) {
  if (stringWidth(str) === 0) return str
  if (target <= 0) return ''
  if (stringWidth(str) <= target) return str

  // We compute the number of bytes of ansi sequences here and add
  // that to our initial truncation to ensure that we don't slice one
  // that we want to keep in half.
  var noAnsi = stripAnsi(str)
  var ansiSize = str.length + noAnsi.length
  var truncated = str.slice(0, target + ansiSize)

  // we have to shrink the result to account for our ansi sequence buffer
  // (if an ansi sequence was truncated) and double width characters.
  while (stringWidth(truncated) > target) {
    truncated = truncated.slice(0, -1)
  }
  return truncated
}

},{"string-width":349,"strip-ansi":354}],368:[function(require,module,exports){
module.exports = function (blocking) {
  [process.stdout, process.stderr].forEach(function (stream) {
    if (stream._handle && stream.isTTY && typeof stream._handle.setBlocking === 'function') {
      stream._handle.setBlocking(blocking)
    }
  })
}

},{}],369:[function(require,module,exports){
exports = module.exports = SemVer;

// The debug function is excluded entirely from the minified version.
/* nomin */ var debug;
/* nomin */ if (typeof process === 'object' &&
    /* nomin */ process.env &&
    /* nomin */ process.env.NODE_DEBUG &&
    /* nomin */ /\bsemver\b/i.test(process.env.NODE_DEBUG))
  /* nomin */ debug = function() {
    /* nomin */ var args = Array.prototype.slice.call(arguments, 0);
    /* nomin */ args.unshift('SEMVER');
    /* nomin */ console.log.apply(console, args);
    /* nomin */ };
/* nomin */ else
  /* nomin */ debug = function() {};

// Note: this is the semver.org version of the spec that it implements
// Not necessarily the package version of this code.
exports.SEMVER_SPEC_VERSION = '2.0.0';

var MAX_LENGTH = 256;
var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;

// The actual regexps go on exports.re
var re = exports.re = [];
var src = exports.src = [];
var R = 0;

// The following Regular Expressions can be used for tokenizing,
// validating, and parsing SemVer version strings.

// ## Numeric Identifier
// A single `0`, or a non-zero digit followed by zero or more digits.

var NUMERICIDENTIFIER = R++;
src[NUMERICIDENTIFIER] = '0|[1-9]\\d*';
var NUMERICIDENTIFIERLOOSE = R++;
src[NUMERICIDENTIFIERLOOSE] = '[0-9]+';


// ## Non-numeric Identifier
// Zero or more digits, followed by a letter or hyphen, and then zero or
// more letters, digits, or hyphens.

var NONNUMERICIDENTIFIER = R++;
src[NONNUMERICIDENTIFIER] = '\\d*[a-zA-Z-][a-zA-Z0-9-]*';


// ## Main Version
// Three dot-separated numeric identifiers.

var MAINVERSION = R++;
src[MAINVERSION] = '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')\\.' +
                   '(' + src[NUMERICIDENTIFIER] + ')';

var MAINVERSIONLOOSE = R++;
src[MAINVERSIONLOOSE] = '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')\\.' +
                        '(' + src[NUMERICIDENTIFIERLOOSE] + ')';

// ## Pre-release Version Identifier
// A numeric identifier, or a non-numeric identifier.

var PRERELEASEIDENTIFIER = R++;
src[PRERELEASEIDENTIFIER] = '(?:' + src[NUMERICIDENTIFIER] +
                            '|' + src[NONNUMERICIDENTIFIER] + ')';

var PRERELEASEIDENTIFIERLOOSE = R++;
src[PRERELEASEIDENTIFIERLOOSE] = '(?:' + src[NUMERICIDENTIFIERLOOSE] +
                                 '|' + src[NONNUMERICIDENTIFIER] + ')';


// ## Pre-release Version
// Hyphen, followed by one or more dot-separated pre-release version
// identifiers.

var PRERELEASE = R++;
src[PRERELEASE] = '(?:-(' + src[PRERELEASEIDENTIFIER] +
                  '(?:\\.' + src[PRERELEASEIDENTIFIER] + ')*))';

var PRERELEASELOOSE = R++;
src[PRERELEASELOOSE] = '(?:-?(' + src[PRERELEASEIDENTIFIERLOOSE] +
                       '(?:\\.' + src[PRERELEASEIDENTIFIERLOOSE] + ')*))';

// ## Build Metadata Identifier
// Any combination of digits, letters, or hyphens.

var BUILDIDENTIFIER = R++;
src[BUILDIDENTIFIER] = '[0-9A-Za-z-]+';

// ## Build Metadata
// Plus sign, followed by one or more period-separated build metadata
// identifiers.

var BUILD = R++;
src[BUILD] = '(?:\\+(' + src[BUILDIDENTIFIER] +
             '(?:\\.' + src[BUILDIDENTIFIER] + ')*))';


// ## Full Version String
// A main version, followed optionally by a pre-release version and
// build metadata.

// Note that the only major, minor, patch, and pre-release sections of
// the version string are capturing groups.  The build metadata is not a
// capturing group, because it should not ever be used in version
// comparison.

var FULL = R++;
var FULLPLAIN = 'v?' + src[MAINVERSION] +
                src[PRERELEASE] + '?' +
                src[BUILD] + '?';

src[FULL] = '^' + FULLPLAIN + '$';

// like full, but allows v1.2.3 and =1.2.3, which people do sometimes.
// also, 1.0.0alpha1 (prerelease without the hyphen) which is pretty
// common in the npm registry.
var LOOSEPLAIN = '[v=\\s]*' + src[MAINVERSIONLOOSE] +
                 src[PRERELEASELOOSE] + '?' +
                 src[BUILD] + '?';

var LOOSE = R++;
src[LOOSE] = '^' + LOOSEPLAIN + '$';

var GTLT = R++;
src[GTLT] = '((?:<|>)?=?)';

// Something like "2.*" or "1.2.x".
// Note that "x.x" is a valid xRange identifer, meaning "any version"
// Only the first item is strictly required.
var XRANGEIDENTIFIERLOOSE = R++;
src[XRANGEIDENTIFIERLOOSE] = src[NUMERICIDENTIFIERLOOSE] + '|x|X|\\*';
var XRANGEIDENTIFIER = R++;
src[XRANGEIDENTIFIER] = src[NUMERICIDENTIFIER] + '|x|X|\\*';

var XRANGEPLAIN = R++;
src[XRANGEPLAIN] = '[v=\\s]*(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:\\.(' + src[XRANGEIDENTIFIER] + ')' +
                   '(?:' + src[PRERELEASE] + ')?' +
                   src[BUILD] + '?' +
                   ')?)?';

var XRANGEPLAINLOOSE = R++;
src[XRANGEPLAINLOOSE] = '[v=\\s]*(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:\\.(' + src[XRANGEIDENTIFIERLOOSE] + ')' +
                        '(?:' + src[PRERELEASELOOSE] + ')?' +
                        src[BUILD] + '?' +
                        ')?)?';

var XRANGE = R++;
src[XRANGE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAIN] + '$';
var XRANGELOOSE = R++;
src[XRANGELOOSE] = '^' + src[GTLT] + '\\s*' + src[XRANGEPLAINLOOSE] + '$';

// Tilde ranges.
// Meaning is "reasonably at or greater than"
var LONETILDE = R++;
src[LONETILDE] = '(?:~>?)';

var TILDETRIM = R++;
src[TILDETRIM] = '(\\s*)' + src[LONETILDE] + '\\s+';
re[TILDETRIM] = new RegExp(src[TILDETRIM], 'g');
var tildeTrimReplace = '$1~';

var TILDE = R++;
src[TILDE] = '^' + src[LONETILDE] + src[XRANGEPLAIN] + '$';
var TILDELOOSE = R++;
src[TILDELOOSE] = '^' + src[LONETILDE] + src[XRANGEPLAINLOOSE] + '$';

// Caret ranges.
// Meaning is "at least and backwards compatible with"
var LONECARET = R++;
src[LONECARET] = '(?:\\^)';

var CARETTRIM = R++;
src[CARETTRIM] = '(\\s*)' + src[LONECARET] + '\\s+';
re[CARETTRIM] = new RegExp(src[CARETTRIM], 'g');
var caretTrimReplace = '$1^';

var CARET = R++;
src[CARET] = '^' + src[LONECARET] + src[XRANGEPLAIN] + '$';
var CARETLOOSE = R++;
src[CARETLOOSE] = '^' + src[LONECARET] + src[XRANGEPLAINLOOSE] + '$';

// A simple gt/lt/eq thing, or just "" to indicate "any version"
var COMPARATORLOOSE = R++;
src[COMPARATORLOOSE] = '^' + src[GTLT] + '\\s*(' + LOOSEPLAIN + ')$|^$';
var COMPARATOR = R++;
src[COMPARATOR] = '^' + src[GTLT] + '\\s*(' + FULLPLAIN + ')$|^$';


// An expression to strip any whitespace between the gtlt and the thing
// it modifies, so that `> 1.2.3` ==> `>1.2.3`
var COMPARATORTRIM = R++;
src[COMPARATORTRIM] = '(\\s*)' + src[GTLT] +
                      '\\s*(' + LOOSEPLAIN + '|' + src[XRANGEPLAIN] + ')';

// this one has to use the /g flag
re[COMPARATORTRIM] = new RegExp(src[COMPARATORTRIM], 'g');
var comparatorTrimReplace = '$1$2$3';


// Something like `1.2.3 - 1.2.4`
// Note that these all use the loose form, because they'll be
// checked against either the strict or loose comparator form
// later.
var HYPHENRANGE = R++;
src[HYPHENRANGE] = '^\\s*(' + src[XRANGEPLAIN] + ')' +
                   '\\s+-\\s+' +
                   '(' + src[XRANGEPLAIN] + ')' +
                   '\\s*$';

var HYPHENRANGELOOSE = R++;
src[HYPHENRANGELOOSE] = '^\\s*(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s+-\\s+' +
                        '(' + src[XRANGEPLAINLOOSE] + ')' +
                        '\\s*$';

// Star ranges basically just allow anything at all.
var STAR = R++;
src[STAR] = '(<|>)?=?\\s*\\*';

// Compile to actual regexp objects.
// All are flag-free, unless they were created above with a flag.
for (var i = 0; i < R; i++) {
  debug(i, src[i]);
  if (!re[i])
    re[i] = new RegExp(src[i]);
}

exports.parse = parse;
function parse(version, loose) {
  if (version instanceof SemVer)
    return version;

  if (typeof version !== 'string')
    return null;

  if (version.length > MAX_LENGTH)
    return null;

  var r = loose ? re[LOOSE] : re[FULL];
  if (!r.test(version))
    return null;

  try {
    return new SemVer(version, loose);
  } catch (er) {
    return null;
  }
}

exports.valid = valid;
function valid(version, loose) {
  var v = parse(version, loose);
  return v ? v.version : null;
}


exports.clean = clean;
function clean(version, loose) {
  var s = parse(version.trim().replace(/^[=v]+/, ''), loose);
  return s ? s.version : null;
}

exports.SemVer = SemVer;

function SemVer(version, loose) {
  if (version instanceof SemVer) {
    if (version.loose === loose)
      return version;
    else
      version = version.version;
  } else if (typeof version !== 'string') {
    throw new TypeError('Invalid Version: ' + version);
  }

  if (version.length > MAX_LENGTH)
    throw new TypeError('version is longer than ' + MAX_LENGTH + ' characters')

  if (!(this instanceof SemVer))
    return new SemVer(version, loose);

  debug('SemVer', version, loose);
  this.loose = loose;
  var m = version.trim().match(loose ? re[LOOSE] : re[FULL]);

  if (!m)
    throw new TypeError('Invalid Version: ' + version);

  this.raw = version;

  // these are actually numbers
  this.major = +m[1];
  this.minor = +m[2];
  this.patch = +m[3];

  if (this.major > MAX_SAFE_INTEGER || this.major < 0)
    throw new TypeError('Invalid major version')

  if (this.minor > MAX_SAFE_INTEGER || this.minor < 0)
    throw new TypeError('Invalid minor version')

  if (this.patch > MAX_SAFE_INTEGER || this.patch < 0)
    throw new TypeError('Invalid patch version')

  // numberify any prerelease numeric ids
  if (!m[4])
    this.prerelease = [];
  else
    this.prerelease = m[4].split('.').map(function(id) {
      if (/^[0-9]+$/.test(id)) {
        var num = +id;
        if (num >= 0 && num < MAX_SAFE_INTEGER)
          return num;
      }
      return id;
    });

  this.build = m[5] ? m[5].split('.') : [];
  this.format();
}

SemVer.prototype.format = function() {
  this.version = this.major + '.' + this.minor + '.' + this.patch;
  if (this.prerelease.length)
    this.version += '-' + this.prerelease.join('.');
  return this.version;
};

SemVer.prototype.toString = function() {
  return this.version;
};

SemVer.prototype.compare = function(other) {
  debug('SemVer.compare', this.version, this.loose, other);
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return this.compareMain(other) || this.comparePre(other);
};

SemVer.prototype.compareMain = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  return compareIdentifiers(this.major, other.major) ||
         compareIdentifiers(this.minor, other.minor) ||
         compareIdentifiers(this.patch, other.patch);
};

SemVer.prototype.comparePre = function(other) {
  if (!(other instanceof SemVer))
    other = new SemVer(other, this.loose);

  // NOT having a prerelease is > having one
  if (this.prerelease.length && !other.prerelease.length)
    return -1;
  else if (!this.prerelease.length && other.prerelease.length)
    return 1;
  else if (!this.prerelease.length && !other.prerelease.length)
    return 0;

  var i = 0;
  do {
    var a = this.prerelease[i];
    var b = other.prerelease[i];
    debug('prerelease compare', i, a, b);
    if (a === undefined && b === undefined)
      return 0;
    else if (b === undefined)
      return 1;
    else if (a === undefined)
      return -1;
    else if (a === b)
      continue;
    else
      return compareIdentifiers(a, b);
  } while (++i);
};

// preminor will bump the version up to the next minor release, and immediately
// down to pre-release. premajor and prepatch work the same way.
SemVer.prototype.inc = function(release, identifier) {
  switch (release) {
    case 'premajor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor = 0;
      this.major++;
      this.inc('pre', identifier);
      break;
    case 'preminor':
      this.prerelease.length = 0;
      this.patch = 0;
      this.minor++;
      this.inc('pre', identifier);
      break;
    case 'prepatch':
      // If this is already a prerelease, it will bump to the next version
      // drop any prereleases that might already exist, since they are not
      // relevant at this point.
      this.prerelease.length = 0;
      this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;
    // If the input is a non-prerelease version, this acts the same as
    // prepatch.
    case 'prerelease':
      if (this.prerelease.length === 0)
        this.inc('patch', identifier);
      this.inc('pre', identifier);
      break;

    case 'major':
      // If this is a pre-major version, bump up to the same major version.
      // Otherwise increment major.
      // 1.0.0-5 bumps to 1.0.0
      // 1.1.0 bumps to 2.0.0
      if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0)
        this.major++;
      this.minor = 0;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'minor':
      // If this is a pre-minor version, bump up to the same minor version.
      // Otherwise increment minor.
      // 1.2.0-5 bumps to 1.2.0
      // 1.2.1 bumps to 1.3.0
      if (this.patch !== 0 || this.prerelease.length === 0)
        this.minor++;
      this.patch = 0;
      this.prerelease = [];
      break;
    case 'patch':
      // If this is not a pre-release version, it will increment the patch.
      // If it is a pre-release it will bump up to the same patch version.
      // 1.2.0-5 patches to 1.2.0
      // 1.2.0 patches to 1.2.1
      if (this.prerelease.length === 0)
        this.patch++;
      this.prerelease = [];
      break;
    // This probably shouldn't be used publicly.
    // 1.0.0 "pre" would become 1.0.0-0 which is the wrong direction.
    case 'pre':
      if (this.prerelease.length === 0)
        this.prerelease = [0];
      else {
        var i = this.prerelease.length;
        while (--i >= 0) {
          if (typeof this.prerelease[i] === 'number') {
            this.prerelease[i]++;
            i = -2;
          }
        }
        if (i === -1) // didn't increment anything
          this.prerelease.push(0);
      }
      if (identifier) {
        // 1.2.0-beta.1 bumps to 1.2.0-beta.2,
        // 1.2.0-beta.fooblz or 1.2.0-beta bumps to 1.2.0-beta.0
        if (this.prerelease[0] === identifier) {
          if (isNaN(this.prerelease[1]))
            this.prerelease = [identifier, 0];
        } else
          this.prerelease = [identifier, 0];
      }
      break;

    default:
      throw new Error('invalid increment argument: ' + release);
  }
  this.format();
  this.raw = this.version;
  return this;
};

exports.inc = inc;
function inc(version, release, loose, identifier) {
  if (typeof(loose) === 'string') {
    identifier = loose;
    loose = undefined;
  }

  try {
    return new SemVer(version, loose).inc(release, identifier).version;
  } catch (er) {
    return null;
  }
}

exports.diff = diff;
function diff(version1, version2) {
  if (eq(version1, version2)) {
    return null;
  } else {
    var v1 = parse(version1);
    var v2 = parse(version2);
    if (v1.prerelease.length || v2.prerelease.length) {
      for (var key in v1) {
        if (key === 'major' || key === 'minor' || key === 'patch') {
          if (v1[key] !== v2[key]) {
            return 'pre'+key;
          }
        }
      }
      return 'prerelease';
    }
    for (var key in v1) {
      if (key === 'major' || key === 'minor' || key === 'patch') {
        if (v1[key] !== v2[key]) {
          return key;
        }
      }
    }
  }
}

exports.compareIdentifiers = compareIdentifiers;

var numeric = /^[0-9]+$/;
function compareIdentifiers(a, b) {
  var anum = numeric.test(a);
  var bnum = numeric.test(b);

  if (anum && bnum) {
    a = +a;
    b = +b;
  }

  return (anum && !bnum) ? -1 :
         (bnum && !anum) ? 1 :
         a < b ? -1 :
         a > b ? 1 :
         0;
}

exports.rcompareIdentifiers = rcompareIdentifiers;
function rcompareIdentifiers(a, b) {
  return compareIdentifiers(b, a);
}

exports.major = major;
function major(a, loose) {
  return new SemVer(a, loose).major;
}

exports.minor = minor;
function minor(a, loose) {
  return new SemVer(a, loose).minor;
}

exports.patch = patch;
function patch(a, loose) {
  return new SemVer(a, loose).patch;
}

exports.compare = compare;
function compare(a, b, loose) {
  return new SemVer(a, loose).compare(b);
}

exports.compareLoose = compareLoose;
function compareLoose(a, b) {
  return compare(a, b, true);
}

exports.rcompare = rcompare;
function rcompare(a, b, loose) {
  return compare(b, a, loose);
}

exports.sort = sort;
function sort(list, loose) {
  return list.sort(function(a, b) {
    return exports.compare(a, b, loose);
  });
}

exports.rsort = rsort;
function rsort(list, loose) {
  return list.sort(function(a, b) {
    return exports.rcompare(a, b, loose);
  });
}

exports.gt = gt;
function gt(a, b, loose) {
  return compare(a, b, loose) > 0;
}

exports.lt = lt;
function lt(a, b, loose) {
  return compare(a, b, loose) < 0;
}

exports.eq = eq;
function eq(a, b, loose) {
  return compare(a, b, loose) === 0;
}

exports.neq = neq;
function neq(a, b, loose) {
  return compare(a, b, loose) !== 0;
}

exports.gte = gte;
function gte(a, b, loose) {
  return compare(a, b, loose) >= 0;
}

exports.lte = lte;
function lte(a, b, loose) {
  return compare(a, b, loose) <= 0;
}

exports.cmp = cmp;
function cmp(a, op, b, loose) {
  var ret;
  switch (op) {
    case '===':
      if (typeof a === 'object') a = a.version;
      if (typeof b === 'object') b = b.version;
      ret = a === b;
      break;
    case '!==':
      if (typeof a === 'object') a = a.version;
      if (typeof b === 'object') b = b.version;
      ret = a !== b;
      break;
    case '': case '=': case '==': ret = eq(a, b, loose); break;
    case '!=': ret = neq(a, b, loose); break;
    case '>': ret = gt(a, b, loose); break;
    case '>=': ret = gte(a, b, loose); break;
    case '<': ret = lt(a, b, loose); break;
    case '<=': ret = lte(a, b, loose); break;
    default: throw new TypeError('Invalid operator: ' + op);
  }
  return ret;
}

exports.Comparator = Comparator;
function Comparator(comp, loose) {
  if (comp instanceof Comparator) {
    if (comp.loose === loose)
      return comp;
    else
      comp = comp.value;
  }

  if (!(this instanceof Comparator))
    return new Comparator(comp, loose);

  debug('comparator', comp, loose);
  this.loose = loose;
  this.parse(comp);

  if (this.semver === ANY)
    this.value = '';
  else
    this.value = this.operator + this.semver.version;

  debug('comp', this);
}

var ANY = {};
Comparator.prototype.parse = function(comp) {
  var r = this.loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var m = comp.match(r);

  if (!m)
    throw new TypeError('Invalid comparator: ' + comp);

  this.operator = m[1];
  if (this.operator === '=')
    this.operator = '';

  // if it literally is just '>' or '' then allow anything.
  if (!m[2])
    this.semver = ANY;
  else
    this.semver = new SemVer(m[2], this.loose);
};

Comparator.prototype.toString = function() {
  return this.value;
};

Comparator.prototype.test = function(version) {
  debug('Comparator.test', version, this.loose);

  if (this.semver === ANY)
    return true;

  if (typeof version === 'string')
    version = new SemVer(version, this.loose);

  return cmp(version, this.operator, this.semver, this.loose);
};


exports.Range = Range;
function Range(range, loose) {
  if ((range instanceof Range) && range.loose === loose)
    return range;

  if (!(this instanceof Range))
    return new Range(range, loose);

  this.loose = loose;

  // First, split based on boolean or ||
  this.raw = range;
  this.set = range.split(/\s*\|\|\s*/).map(function(range) {
    return this.parseRange(range.trim());
  }, this).filter(function(c) {
    // throw out any that are not relevant for whatever reason
    return c.length;
  });

  if (!this.set.length) {
    throw new TypeError('Invalid SemVer Range: ' + range);
  }

  this.format();
}

Range.prototype.format = function() {
  this.range = this.set.map(function(comps) {
    return comps.join(' ').trim();
  }).join('||').trim();
  return this.range;
};

Range.prototype.toString = function() {
  return this.range;
};

Range.prototype.parseRange = function(range) {
  var loose = this.loose;
  range = range.trim();
  debug('range', range, loose);
  // `1.2.3 - 1.2.4` => `>=1.2.3 <=1.2.4`
  var hr = loose ? re[HYPHENRANGELOOSE] : re[HYPHENRANGE];
  range = range.replace(hr, hyphenReplace);
  debug('hyphen replace', range);
  // `> 1.2.3 < 1.2.5` => `>1.2.3 <1.2.5`
  range = range.replace(re[COMPARATORTRIM], comparatorTrimReplace);
  debug('comparator trim', range, re[COMPARATORTRIM]);

  // `~ 1.2.3` => `~1.2.3`
  range = range.replace(re[TILDETRIM], tildeTrimReplace);

  // `^ 1.2.3` => `^1.2.3`
  range = range.replace(re[CARETTRIM], caretTrimReplace);

  // normalize spaces
  range = range.split(/\s+/).join(' ');

  // At this point, the range is completely trimmed and
  // ready to be split into comparators.

  var compRe = loose ? re[COMPARATORLOOSE] : re[COMPARATOR];
  var set = range.split(' ').map(function(comp) {
    return parseComparator(comp, loose);
  }).join(' ').split(/\s+/);
  if (this.loose) {
    // in loose mode, throw out any that are not valid comparators
    set = set.filter(function(comp) {
      return !!comp.match(compRe);
    });
  }
  set = set.map(function(comp) {
    return new Comparator(comp, loose);
  });

  return set;
};

// Mostly just for testing and legacy API reasons
exports.toComparators = toComparators;
function toComparators(range, loose) {
  return new Range(range, loose).set.map(function(comp) {
    return comp.map(function(c) {
      return c.value;
    }).join(' ').trim().split(' ');
  });
}

// comprised of xranges, tildes, stars, and gtlt's at this point.
// already replaced the hyphen ranges
// turn into a set of JUST comparators.
function parseComparator(comp, loose) {
  debug('comp', comp);
  comp = replaceCarets(comp, loose);
  debug('caret', comp);
  comp = replaceTildes(comp, loose);
  debug('tildes', comp);
  comp = replaceXRanges(comp, loose);
  debug('xrange', comp);
  comp = replaceStars(comp, loose);
  debug('stars', comp);
  return comp;
}

function isX(id) {
  return !id || id.toLowerCase() === 'x' || id === '*';
}

// ~, ~> --> * (any, kinda silly)
// ~2, ~2.x, ~2.x.x, ~>2, ~>2.x ~>2.x.x --> >=2.0.0 <3.0.0
// ~2.0, ~2.0.x, ~>2.0, ~>2.0.x --> >=2.0.0 <2.1.0
// ~1.2, ~1.2.x, ~>1.2, ~>1.2.x --> >=1.2.0 <1.3.0
// ~1.2.3, ~>1.2.3 --> >=1.2.3 <1.3.0
// ~1.2.0, ~>1.2.0 --> >=1.2.0 <1.3.0
function replaceTildes(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceTilde(comp, loose);
  }).join(' ');
}

function replaceTilde(comp, loose) {
  var r = loose ? re[TILDELOOSE] : re[TILDE];
  return comp.replace(r, function(_, M, m, p, pr) {
    debug('tilde', comp, _, M, m, p, pr);
    var ret;

    if (isX(M))
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    else if (isX(p))
      // ~1.2 == >=1.2.0 <1.3.0
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    else if (pr) {
      debug('replaceTilde pr', pr);
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      ret = '>=' + M + '.' + m + '.' + p + pr +
            ' <' + M + '.' + (+m + 1) + '.0';
    } else
      // ~1.2.3 == >=1.2.3 <1.3.0
      ret = '>=' + M + '.' + m + '.' + p +
            ' <' + M + '.' + (+m + 1) + '.0';

    debug('tilde return', ret);
    return ret;
  });
}

// ^ --> * (any, kinda silly)
// ^2, ^2.x, ^2.x.x --> >=2.0.0 <3.0.0
// ^2.0, ^2.0.x --> >=2.0.0 <3.0.0
// ^1.2, ^1.2.x --> >=1.2.0 <2.0.0
// ^1.2.3 --> >=1.2.3 <2.0.0
// ^1.2.0 --> >=1.2.0 <2.0.0
function replaceCarets(comp, loose) {
  return comp.trim().split(/\s+/).map(function(comp) {
    return replaceCaret(comp, loose);
  }).join(' ');
}

function replaceCaret(comp, loose) {
  debug('caret', comp, loose);
  var r = loose ? re[CARETLOOSE] : re[CARET];
  return comp.replace(r, function(_, M, m, p, pr) {
    debug('caret', comp, _, M, m, p, pr);
    var ret;

    if (isX(M))
      ret = '';
    else if (isX(m))
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    else if (isX(p)) {
      if (M === '0')
        ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
      else
        ret = '>=' + M + '.' + m + '.0 <' + (+M + 1) + '.0.0';
    } else if (pr) {
      debug('replaceCaret pr', pr);
      if (pr.charAt(0) !== '-')
        pr = '-' + pr;
      if (M === '0') {
        if (m === '0')
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + m + '.' + (+p + 1);
        else
          ret = '>=' + M + '.' + m + '.' + p + pr +
                ' <' + M + '.' + (+m + 1) + '.0';
      } else
        ret = '>=' + M + '.' + m + '.' + p + pr +
              ' <' + (+M + 1) + '.0.0';
    } else {
      debug('no pr');
      if (M === '0') {
        if (m === '0')
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + m + '.' + (+p + 1);
        else
          ret = '>=' + M + '.' + m + '.' + p +
                ' <' + M + '.' + (+m + 1) + '.0';
      } else
        ret = '>=' + M + '.' + m + '.' + p +
              ' <' + (+M + 1) + '.0.0';
    }

    debug('caret return', ret);
    return ret;
  });
}

function replaceXRanges(comp, loose) {
  debug('replaceXRanges', comp, loose);
  return comp.split(/\s+/).map(function(comp) {
    return replaceXRange(comp, loose);
  }).join(' ');
}

function replaceXRange(comp, loose) {
  comp = comp.trim();
  var r = loose ? re[XRANGELOOSE] : re[XRANGE];
  return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
    debug('xRange', comp, ret, gtlt, M, m, p, pr);
    var xM = isX(M);
    var xm = xM || isX(m);
    var xp = xm || isX(p);
    var anyX = xp;

    if (gtlt === '=' && anyX)
      gtlt = '';

    if (xM) {
      if (gtlt === '>' || gtlt === '<') {
        // nothing is allowed
        ret = '<0.0.0';
      } else {
        // nothing is forbidden
        ret = '*';
      }
    } else if (gtlt && anyX) {
      // replace X with 0
      if (xm)
        m = 0;
      if (xp)
        p = 0;

      if (gtlt === '>') {
        // >1 => >=2.0.0
        // >1.2 => >=1.3.0
        // >1.2.3 => >= 1.2.4
        gtlt = '>=';
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else if (xp) {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === '<=') {
        // <=0.7.x is actually <0.8.0, since any 0.7.x should
        // pass.  Similarly, <=7.x is actually <8.0.0, etc.
        gtlt = '<';
        if (xm)
          M = +M + 1;
        else
          m = +m + 1;
      }

      ret = gtlt + M + '.' + m + '.' + p;
    } else if (xm) {
      ret = '>=' + M + '.0.0 <' + (+M + 1) + '.0.0';
    } else if (xp) {
      ret = '>=' + M + '.' + m + '.0 <' + M + '.' + (+m + 1) + '.0';
    }

    debug('xRange return', ret);

    return ret;
  });
}

// Because * is AND-ed with everything else in the comparator,
// and '' means "any version", just remove the *s entirely.
function replaceStars(comp, loose) {
  debug('replaceStars', comp, loose);
  // Looseness is ignored here.  star is always as loose as it gets!
  return comp.trim().replace(re[STAR], '');
}

// This function is passed to string.replace(re[HYPHENRANGE])
// M, m, patch, prerelease, build
// 1.2 - 3.4.5 => >=1.2.0 <=3.4.5
// 1.2.3 - 3.4 => >=1.2.0 <3.5.0 Any 3.4.x will do
// 1.2 - 3.4 => >=1.2.0 <3.5.0
function hyphenReplace($0,
                       from, fM, fm, fp, fpr, fb,
                       to, tM, tm, tp, tpr, tb) {

  if (isX(fM))
    from = '';
  else if (isX(fm))
    from = '>=' + fM + '.0.0';
  else if (isX(fp))
    from = '>=' + fM + '.' + fm + '.0';
  else
    from = '>=' + from;

  if (isX(tM))
    to = '';
  else if (isX(tm))
    to = '<' + (+tM + 1) + '.0.0';
  else if (isX(tp))
    to = '<' + tM + '.' + (+tm + 1) + '.0';
  else if (tpr)
    to = '<=' + tM + '.' + tm + '.' + tp + '-' + tpr;
  else
    to = '<=' + to;

  return (from + ' ' + to).trim();
}


// if ANY of the sets match ALL of its comparators, then pass
Range.prototype.test = function(version) {
  if (!version)
    return false;

  if (typeof version === 'string')
    version = new SemVer(version, this.loose);

  for (var i = 0; i < this.set.length; i++) {
    if (testSet(this.set[i], version))
      return true;
  }
  return false;
};

function testSet(set, version) {
  for (var i = 0; i < set.length; i++) {
    if (!set[i].test(version))
      return false;
  }

  if (version.prerelease.length) {
    // Find the set of versions that are allowed to have prereleases
    // For example, ^1.2.3-pr.1 desugars to >=1.2.3-pr.1 <2.0.0
    // That should allow `1.2.3-pr.2` to pass.
    // However, `1.2.4-alpha.notready` should NOT be allowed,
    // even though it's within the range set by the comparators.
    for (var i = 0; i < set.length; i++) {
      debug(set[i].semver);
      if (set[i].semver === ANY)
        continue;

      if (set[i].semver.prerelease.length > 0) {
        var allowed = set[i].semver;
        if (allowed.major === version.major &&
            allowed.minor === version.minor &&
            allowed.patch === version.patch)
          return true;
      }
    }

    // Version has a -pre, but it's not one of the ones we like.
    return false;
  }

  return true;
}

exports.satisfies = satisfies;
function satisfies(version, range, loose) {
  try {
    range = new Range(range, loose);
  } catch (er) {
    return false;
  }
  return range.test(version);
}

exports.maxSatisfying = maxSatisfying;
function maxSatisfying(versions, range, loose) {
  return versions.filter(function(version) {
    return satisfies(version, range, loose);
  }).sort(function(a, b) {
    return rcompare(a, b, loose);
  })[0] || null;
}

exports.minSatisfying = minSatisfying;
function minSatisfying(versions, range, loose) {
  return versions.filter(function(version) {
    return satisfies(version, range, loose);
  }).sort(function(a, b) {
    return compare(a, b, loose);
  })[0] || null;
}

exports.validRange = validRange;
function validRange(range, loose) {
  try {
    // Return '*' instead of '' so that truthiness works.
    // This will throw if it's invalid anyway
    return new Range(range, loose).range || '*';
  } catch (er) {
    return null;
  }
}

// Determine if version is less than all the versions possible in the range
exports.ltr = ltr;
function ltr(version, range, loose) {
  return outside(version, range, '<', loose);
}

// Determine if version is greater than all the versions possible in the range.
exports.gtr = gtr;
function gtr(version, range, loose) {
  return outside(version, range, '>', loose);
}

exports.outside = outside;
function outside(version, range, hilo, loose) {
  version = new SemVer(version, loose);
  range = new Range(range, loose);

  var gtfn, ltefn, ltfn, comp, ecomp;
  switch (hilo) {
    case '>':
      gtfn = gt;
      ltefn = lte;
      ltfn = lt;
      comp = '>';
      ecomp = '>=';
      break;
    case '<':
      gtfn = lt;
      ltefn = gte;
      ltfn = gt;
      comp = '<';
      ecomp = '<=';
      break;
    default:
      throw new TypeError('Must provide a hilo val of "<" or ">"');
  }

  // If it satisifes the range it is not outside
  if (satisfies(version, range, loose)) {
    return false;
  }

  // From now on, variable terms are as if we're in "gtr" mode.
  // but note that everything is flipped for the "ltr" function.

  for (var i = 0; i < range.set.length; ++i) {
    var comparators = range.set[i];

    var high = null;
    var low = null;

    comparators.forEach(function(comparator) {
      if (comparator.semver === ANY) {
        comparator = new Comparator('>=0.0.0')
      }
      high = high || comparator;
      low = low || comparator;
      if (gtfn(comparator.semver, high.semver, loose)) {
        high = comparator;
      } else if (ltfn(comparator.semver, low.semver, loose)) {
        low = comparator;
      }
    });

    // If the edge version comparator has a operator then our version
    // isn't outside it
    if (high.operator === comp || high.operator === ecomp) {
      return false;
    }

    // If the lowest version comparator has an operator and our version
    // is less than it then it isn't higher than the range
    if ((!low.operator || low.operator === comp) &&
        ltefn(version, low.semver)) {
      return false;
    } else if (low.operator === ecomp && ltfn(version, low.semver)) {
      return false;
    }
  }
  return true;
}

exports.prerelease = prerelease;
function prerelease(version, loose) {
  var parsed = parse(version, loose);
  return (parsed && parsed.prerelease.length) ? parsed.prerelease : null;
}

},{}],370:[function(require,module,exports){
module.exports={
  "_from": "node-pre-gyp@~0.6.31",
  "_id": "node-pre-gyp@0.6.31",
  "_location": "/sqlite3/node-pre-gyp",
  "_phantomChildren": {},
  "_requiredBy": [
    "/sqlite3"
  ],
  "_shasum": "d8a00ddaa301a940615dbcc8caad4024d58f6017",
  "_shrinkwrap": null,
  "author": {
    "name": "Dane Springmeyer",
    "email": "dane@mapbox.com"
  },
  "bin": {
    "node-pre-gyp": "./bin/node-pre-gyp"
  },
  "bugs": {
    "url": "https://github.com/mapbox/node-pre-gyp/issues"
  },
  "dependencies": {
    "mkdirp": "~0.5.1",
    "nopt": "~3.0.6",
    "npmlog": "^4.0.0",
    "rc": "~1.1.6",
    "request": "^2.75.0",
    "rimraf": "~2.5.4",
    "semver": "~5.3.0",
    "tar": "~2.2.1",
    "tar-pack": "~3.3.0"
  },
  "description": "Node.js native addon binary install tool",
  "devDependencies": {
    "aws-sdk": "2.x",
    "jshint": "2.x",
    "mocha": "3.x",
    "retire": "1.2.10"
  },
  "gitHead": "2c32561503c33728cb8de5a445e76a28868826a8",
  "homepage": "https://github.com/mapbox/node-pre-gyp#readme",
  "jshintConfig": {
    "node": true,
    "globalstrict": true,
    "undef": true,
    "unused": true,
    "noarg": true,
    "mocha": true
  },
  "keywords": [
    "native",
    "addon",
    "module",
    "c",
    "c++",
    "bindings",
    "binary"
  ],
  "license": "BSD-3-Clause",
  "main": "./lib/node-pre-gyp.js",
  "name": "node-pre-gyp",
  "optionalDependencies": {},
  "readme": "# node-pre-gyp\n\n#### node-pre-gyp makes it easy to publish and install Node.js C++ addons from binaries\n\n[![NPM](https://nodei.co/npm/node-pre-gyp.png?downloads=true&downloadRank=true)](https://nodei.co/npm/node-pre-gyp/)\n\n[![Build Status](https://api.travis-ci.org/mapbox/node-pre-gyp.svg)](https://travis-ci.org/mapbox/node-pre-gyp)\n[![Build status](https://ci.appveyor.com/api/projects/status/3nxewb425y83c0gv)](https://ci.appveyor.com/project/Mapbox/node-pre-gyp)\n[![Dependencies](https://david-dm.org/mapbox/node-pre-gyp.svg)](https://david-dm.org/mapbox/node-pre-gyp)\n\n`node-pre-gyp` stands between [npm](https://github.com/npm/npm) and [node-gyp](https://github.com/Tootallnate/node-gyp) and offers a cross-platform method of binary deployment.\n\n### Features\n\n - A command line tool called `node-pre-gyp` that can install your package's C++ module from a binary.\n - A variety of developer targeted commands for packaging, testing, and publishing binaries.\n - A JavaScript module that can dynamically require your installed binary: `require('node-pre-gyp').find`\n\nFor a hello world example of a module packaged with `node-pre-gyp` see <https://github.com/springmeyer/node-addon-example> and [the wiki ](https://github.com/mapbox/node-pre-gyp/wiki/Modules-using-node-pre-gyp) for real world examples.\n\n## Credits\n\n - The module is modeled after [node-gyp](https://github.com/Tootallnate/node-gyp) by [@Tootallnate](https://github.com/Tootallnate)\n - Motivation for initial development came from [@ErisDS](https://github.com/ErisDS) and the [Ghost Project](https://github.com/TryGhost/Ghost).\n - Development is sponsored by [Mapbox](https://www.mapbox.com/)\n\n## FAQ\n\nSee the [Frequently Ask Questions](https://github.com/mapbox/node-pre-gyp/wiki/FAQ).\n\n## Depends\n\n - Node.js >= node v0.10.x\n\n## Install\n\n`node-pre-gyp` is designed to be installed as a local dependency of your Node.js C++ addon and accessed like:\n\n    ./node_modules/.bin/node-pre-gyp --help\n\nBut you can also install it globally:\n\n    npm install node-pre-gyp -g\n\n## Usage\n\n### Commands\n\nView all possible commands:\n\n    node-pre-gyp --help\n\n- clean - Remove the entire folder containing the compiled .node module\n- install - Install pre-built binary for module\n- reinstall - Run \"clean\" and \"install\" at once\n- build - Compile the module by dispatching to node-gyp or nw-gyp\n- rebuild - Run \"clean\" and \"build\" at once\n- package - Pack binary into tarball\n- testpackage - Test that the staged package is valid\n- publish - Publish pre-built binary\n- unpublish - Unpublish pre-built binary\n- info - Fetch info on published binaries\n\nYou can also chain commands:\n\n    node-pre-gyp clean build unpublish publish info\n\n### Options\n\nOptions include:\n\n - `-C/--directory`: run the command in this directory\n - `--build-from-source`: build from source instead of using pre-built binary\n - `--update-binary`: reinstall by replacing previously installed local binary with remote binary\n - `--runtime=node-webkit`: customize the runtime: `node`, `electron` and `node-webkit` are the valid options\n - `--fallback-to-build`: fallback to building from source if pre-built binary is not available\n - `--target=0.10.25`: Pass the target node or node-webkit version to compile against\n - `--target_arch=ia32`: Pass the target arch and override the host `arch`. Valid values are 'ia32','x64', or `arm`.\n - `--target_platform=win32`: Pass the target platform and override the host `platform`. Valid values are `linux`, `darwin`, `win32`, `sunos`, `freebsd`, `openbsd`, and `aix`.\n\nBoth `--build-from-source` and `--fallback-to-build` can be passed alone or they can provide values. You can pass `--fallback-to-build=false` to override the option as declared in package.json. In addition to being able to pass `--build-from-source` you can also pass `--build-from-source=myapp` where `myapp` is the name of your module.\n\nFor example: `npm install --build-from-source=myapp`. This is useful if:\n\n - `myapp` is referenced in the package.json of a larger app and therefore `myapp` is being installed as a dependent with `npm install`.\n - The larger app also depends on other modules installed with `node-pre-gyp`\n - You only want to trigger a source compile for `myapp` and the other modules.\n\n### Configuring\n\nThis is a guide to configuring your module to use node-pre-gyp.\n\n#### 1) Add new entries to your `package.json`\n\n - Add `node-pre-gyp` to `dependencies`\n - Add `aws-sdk` as a `devDependency`\n - Add a custom `install` script\n - Declare a `binary` object\n\nThis looks like:\n\n```js\n    \"dependencies\"  : {\n      \"node-pre-gyp\": \"0.6.x\"\n    },\n    \"devDependencies\": {\n      \"aws-sdk\": \"2.x\"\n    }\n    \"scripts\": {\n        \"preinstall\": \"npm install node-pre-gyp\",\n        \"install\": \"node-pre-gyp install --fallback-to-build\"\n    },\n    \"binary\": {\n        \"module_name\": \"your_module\",\n        \"module_path\": \"./lib/binding/\",\n        \"host\": \"https://your_module.s3-us-west-1.amazonaws.com\"\n    }\n```\n\nFor a full example see [node-addon-examples's package.json](https://github.com/springmeyer/node-addon-example/blob/master/package.json).\n\n##### The `binary` object has three required properties\n\n###### module_name\n\nThe name of your native node module. This value must:\n\n - Match the name passed to [the NODE_MODULE macro](http://nodejs.org/api/addons.html#addons_hello_world)\n - Must be a valid C variable name (e.g. it cannot contain `-`)\n - Should not include the `.node` extension.\n\n###### module_path\n\nThe location your native module is placed after a build. This should be an empty directory without other Javascript files. This entire directory will be packaged in the binary tarball. When installing from a remote package this directory will be overwritten with the contents of the tarball.\n\nNote: This property supports variables based on [Versioning](#versioning).\n\n###### host\n\nA url to the remote location where you've published tarball binaries (must be `https` not `http`).\n\nIt is highly recommended that you use Amazon S3. The reasons are:\n\n  - Various node-pre-gyp commands like `publish` and `info` only work with an S3 host.\n  - S3 is a very solid hosting platform for distributing large files.\n  - We provide detail documentation for using [S3 hosting](#s3-hosting) with node-pre-gyp.\n\nWhy then not require S3? Because while some applications using node-pre-gyp need to distribute binaries as large as 20-30 MB, others might have very small binaries and might wish to store them in a GitHub repo. This is not recommended, but if an author really wants to host in a non-s3 location then it should be possible.\n\nIt should also be mentioned that there is an optional and entirely separate npm module called [node-pre-gyp-github](https://github.com/bchr02/node-pre-gyp-github) which is intended to complement node-pre-gyp and be installed along with it. It provides the ability to store and publish your binaries within your repositories GitHub Releases if you would rather not use S3 directly. Installation and usage instructions can be found [here](https://github.com/bchr02/node-pre-gyp-github), but the basic premise is that instead of using the ```node-pre-gyp publish``` command you would use ```node-pre-gyp-github publish```.\n\n##### The `binary` object has two optional properties\n\n###### remote_path\n\nIt **is recommended** that you customize this property. This is an extra path to use for publishing and finding remote tarballs. The default value for `remote_path` is `\"\"` meaning that if you do not provide it then all packages will be published at the base of the `host`. It is recommended to provide a value like `./{name}/v{version}` to help organize remote packages in the case that you choose to publish multiple node addons to the same `host`.\n\nNote: This property supports variables based on [Versioning](#versioning).\n\n###### package_name\n\nIt is **not recommended** to override this property unless you are also overriding the `remote_path`. This is the versioned name of the remote tarball containing the binary `.node` module and any supporting files you've placed inside the `module_path` directory. Unless you specify `package_name` in your `package.json` then it defaults to `{module_name}-v{version}-{node_abi}-{platform}-{arch}.tar.gz` which allows your binary to work across node versions, platforms, and architectures. If you are using `remote_path` that is also versioned by `./{module_name}/v{version}` then you could remove these variables from the `package_name` and just use: `{node_abi}-{platform}-{arch}.tar.gz`. Then your remote tarball will be looked up at, for example, `https://example.com/your-module/v0.1.0/node-v11-linux-x64.tar.gz`.\n\nAvoiding the version of your module in the `package_name` and instead only embedding in a directory name can be useful when you want to make a quick tag of your module that does not change any C++ code. In this case you can just copy binaries to the new version behind the scenes like:\n\n```sh\naws s3 sync --acl public-read s3://mapbox-node-binary/sqlite3/v3.0.3/ s3://mapbox-node-binary/sqlite3/v3.0.4/\n```\n\nNote: This property supports variables based on [Versioning](#versioning).\n\n#### 2) Add a new target to binding.gyp\n\n`node-pre-gyp` calls out to `node-gyp` to compile the module and passes variables along like [module_name](#module_name) and [module_path](#module_path).\n\nA new target must be added to `binding.gyp` that moves the compiled `.node` module from `./build/Release/module_name.node` into the directory specified by `module_path`.\n\nAdd a target like this at the end of your `targets` list:\n\n```js\n    {\n      \"target_name\": \"action_after_build\",\n      \"type\": \"none\",\n      \"dependencies\": [ \"<(module_name)\" ],\n      \"copies\": [\n        {\n          \"files\": [ \"<(PRODUCT_DIR)/<(module_name).node\" ],\n          \"destination\": \"<(module_path)\"\n        }\n      ]\n    }\n```\n\nFor a full example see [node-addon-example's binding.gyp](https://github.com/springmeyer/node-addon-example/blob/2ff60a8ded7f042864ad21db00c3a5a06cf47075/binding.gyp).\n\n#### 3) Dynamically require your `.node`\n\nInside the main js file that requires your addon module you are likely currently doing:\n\n```js\nvar binding = require('../build/Release/binding.node');\n```\n\nor:\n\n```js\nvar bindings = require('./bindings')\n```\n\nChange those lines to:\n\n```js\nvar binary = require('node-pre-gyp');\nvar path = require('path');\nvar binding_path = binary.find(path.resolve(path.join(__dirname,'./package.json')));\nvar binding = require(binding_path);\n```\n\nFor a full example see [node-addon-example's index.js](https://github.com/springmeyer/node-addon-example/blob/2ff60a8ded7f042864ad21db00c3a5a06cf47075/index.js#L1-L4)\n\n#### 4) Build and package your app\n\nNow build your module from source:\n\n    npm install --build-from-source\n\nThe `--build-from-source` tells `node-pre-gyp` to not look for a remote package and instead dispatch to node-gyp to build.\n\nNow `node-pre-gyp` should now also be installed as a local dependency so the command line tool it offers can be found at `./node_modules/.bin/node-pre-gyp`.\n\n#### 5) Test\n\nNow `npm test` should work just as it did before.\n\n#### 6) Publish the tarball\n\nThen package your app:\n\n    ./node_modules/.bin/node-pre-gyp package\n\nOnce packaged, now you can publish:\n\n    ./node_modules/.bin/node-pre-gyp publish\n\nCurrently the `publish` command pushes your binary to S3. This requires:\n\n - You have installed `aws-sdk` with `npm install aws-sdk`\n - You have created a bucket already.\n - The `host` points to an S3 http or https endpoint.\n - You have configured node-pre-gyp to read your S3 credentials (see [S3 hosting](#s3-hosting) for details).\n\nYou can also host your binaries elsewhere. To do this requires:\n\n - You manually publish the binary created by the `package` command to an `https` endpoint\n - Ensure that the `host` value points to your custom `https` endpoint.\n\n#### 7) Automate builds\n\nNow you need to publish builds for all the platforms and node versions you wish to support. This is best automated.\n\n - See [Appveyor Automation](#appveyor-automation) for how to auto-publish builds on Windows.\n - See [Travis Automation](#travis-automation) for how to auto-publish builds on OS X and Linux.\n\n#### 8) You're done!\n\nNow publish your module to the npm registry. Users will now be able to install your module from a binary.\n\nWhat will happen is this:\n\n1. `npm install <your package>` will pull from the npm registry\n2. npm will run the `install` script which will call out to `node-pre-gyp`\n3. `node-pre-gyp` will fetch the binary `.node` module and unpack in the right place\n4. Assuming that all worked, you are done\n\nIf a a binary was not available for a given platform and `--fallback-to-build` was used then `node-gyp rebuild` will be called to try to source compile the module.\n\n## S3 Hosting\n\nYou can host wherever you choose but S3 is cheap, `node-pre-gyp publish` expects it, and S3 can be integrated well with [Travis.ci](http://travis-ci.org) to automate builds for OS X and Ubuntu, and with [Appveyor](http://appveyor.com) to automate builds for Windows. Here is an approach to do this:\n\nFirst, get setup locally and test the workflow:\n\n#### 1) Create an S3 bucket\n\nAnd have your **key** and **secret key** ready for writing to the bucket.\n\nIt is recommended to create a IAM user with a policy that only gives permissions to the specific bucket you plan to publish to. This can be done in the [IAM console](https://console.aws.amazon.com/iam/) by: 1) adding a new user, 2) choosing `Attach User Policy`, 3) Using the `Policy Generator`, 4) selecting `Amazon S3` for the service, 5) adding the actions: `DeleteObject`, `GetObject`, `GetObjectAcl`, `ListBucket`, `PutObject`, `PutObjectAcl`, 6) adding an ARN of `arn:aws:s3:::bucket/*` (replacing `bucket` with your bucket name), and finally 7) clicking `Add Statement` and saving the policy. It should generate a policy like:\n\n```js\n{\n  \"Version\": \"2012-10-17\",\n  \"Statement\": [\n    {\n      \"Sid\": \"Stmt1394587197000\",\n      \"Effect\": \"Allow\",\n      \"Action\": [\n        \"s3:DeleteObject\",\n        \"s3:GetObject\",\n        \"s3:GetObjectAcl\",\n        \"s3:ListBucket\",\n        \"s3:PutObject\",\n        \"s3:PutObjectAcl\"\n      ],\n      \"Resource\": [\n        \"arn:aws:s3:::node-pre-gyp-tests/*\"\n      ]\n    }\n  ]\n}\n```\n\n#### 2) Install node-pre-gyp\n\nEither install it globally:\n\n    npm install node-pre-gyp -g\n\nOr put the local version on your PATH\n\n    export PATH=`pwd`/node_modules/.bin/:$PATH\n\n#### 3) Configure AWS credentials\n\nThere are several ways to do this.\n\nYou can use any of the methods described at http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html.\n\nOr you can create a `~/.node_pre_gyprc`\n\nOr pass options in any way supported by [RC](https://github.com/dominictarr/rc#standards)\n\nA `~/.node_pre_gyprc` looks like:\n\n```js\n{\n    \"accessKeyId\": \"xxx\",\n    \"secretAccessKey\": \"xxx\"\n}\n```\n\nAnother way is to use your environment:\n\n    export node_pre_gyp_accessKeyId=xxx\n    export node_pre_gyp_secretAccessKey=xxx\n\nYou may also need to specify the `region` if it is not explicit in the `host` value you use. The `bucket` can also be specified but it is optional because `node-pre-gyp` will detect it from the `host` value.\n\n#### 4) Package and publish your build\n\nInstall the `aws-sdk`:\n\n    npm install aws-sdk\n\nThen publish:\n\n    node-pre-gyp package publish\n\nNote: if you hit an error like `Hostname/IP doesn't match certificate's altnames` it may mean that you need to provide the `region` option in your config.\n\n## Appveyor Automation\n\n[Appveyor](http://www.appveyor.com/) can build binaries and publish the results per commit and supports:\n\n - Windows Visual Studio 2013 and related compilers\n - Both 64 bit (x64) and 32 bit (x86) build configurations\n - Multiple Node.js versions\n\nFor an example of doing this see [node-sqlite3's appveyor.yml](https://github.com/mapbox/node-sqlite3/blob/master/appveyor.yml).\n\nBelow is a guide to getting set up:\n\n#### 1) Create a free Appveyor account\n\nGo to https://ci.appveyor.com/signup/free and sign in with your GitHub account.\n\n#### 2) Create a new project\n\nGo to https://ci.appveyor.com/projects/new and select the GitHub repo for your module\n\n#### 3) Add appveyor.yml and push it\n\nOnce you have committed an `appveyor.yml` ([appveyor.yml reference](http://www.appveyor.com/docs/appveyor-yml)) to your GitHub repo and pushed it AppVeyor should automatically start building your project.\n\n#### 4) Create secure variables\n\nEncrypt your S3 AWS keys by going to <https://ci.appveyor.com/tools/encrypt> and hitting the `encrypt` button.\n\nThen paste the result into your `appveyor.yml`\n\n```yml\nenvironment:\n  node_pre_gyp_accessKeyId:\n    secure: Dn9HKdLNYvDgPdQOzRq/DqZ/MPhjknRHB1o+/lVU8MA=\n  node_pre_gyp_secretAccessKey:\n    secure: W1rwNoSnOku1r+28gnoufO8UA8iWADmL1LiiwH9IOkIVhDTNGdGPJqAlLjNqwLnL\n```\n\nNOTE: keys are per account but not per repo (this is difference than Travis where keys are per repo but not related to the account used to encrypt them).\n\n#### 5) Hook up publishing\n\nJust put `node-pre-gyp package publish` in your `appveyor.yml` after `npm install`.\n\n#### 6) Publish when you want\n\nYou might wish to publish binaries only on a specific commit. To do this you could borrow from the [Travis CI idea of commit keywords](http://about.travis-ci.org/docs/user/how-to-skip-a-build/) and add special handling for commit messages with `[publish binary]`:\n\n    SET CM=%APPVEYOR_REPO_COMMIT_MESSAGE%\n    if not \"%CM%\" == \"%CM:[publish binary]=%\" node-pre-gyp --msvs_version=2013 publish\n\nIf your commit message contains special characters (e.g. `&`) this method might fail. An alternative is to use PowerShell, which gives you additional possibilities, like ignoring case by using `ToLower()`:\n\n    ps: if($env:APPVEYOR_REPO_COMMIT_MESSAGE.ToLower().Contains('[publish binary]')) { node-pre-gyp --msvs_version=2013 publish }\n\nRemember this publishing is not the same as `npm publish`. We're just talking about the binary module here and not your entire npm package.\n\n## Travis Automation\n\n[Travis](https://travis-ci.org/) can push to S3 after a successful build and supports both:\n\n - Ubuntu Precise and OS X (64 bit)\n - Multiple Node.js versions\n\nFor an example of doing this see [node-add-example's .travis.yml](https://github.com/springmeyer/node-addon-example/blob/2ff60a8ded7f042864ad21db00c3a5a06cf47075/.travis.yml).\n\nNote: if you need 32 bit binaries, this can be done from a 64 bit Travis machine. See [the node-sqlite3 scripts for an example of doing this](https://github.com/mapbox/node-sqlite3/blob/bae122aa6a2b8a45f6b717fab24e207740e32b5d/scripts/build_against_node.sh#L54-L74).\n\nBelow is a guide to getting set up:\n\n#### 1) Install the Travis gem\n\n    gem install travis\n\n#### 2) Create secure variables\n\nMake sure you run this command from within the directory of your module.\n\nUse `travis-encrypt` like:\n\n    travis encrypt node_pre_gyp_accessKeyId=${node_pre_gyp_accessKeyId}\n    travis encrypt node_pre_gyp_secretAccessKey=${node_pre_gyp_secretAccessKey}\n\nThen put those values in your `.travis.yml` like:\n\n```yaml\nenv:\n  global:\n    - secure: F+sEL/v56CzHqmCSSES4pEyC9NeQlkoR0Gs/ZuZxX1ytrj8SKtp3MKqBj7zhIclSdXBz4Ev966Da5ctmcTd410p0b240MV6BVOkLUtkjZJyErMBOkeb8n8yVfSoeMx8RiIhBmIvEn+rlQq+bSFis61/JkE9rxsjkGRZi14hHr4M=\n    - secure: o2nkUQIiABD139XS6L8pxq3XO5gch27hvm/gOdV+dzNKc/s2KomVPWcOyXNxtJGhtecAkABzaW8KHDDi5QL1kNEFx6BxFVMLO8rjFPsMVaBG9Ks6JiDQkkmrGNcnVdxI/6EKTLHTH5WLsz8+J7caDBzvKbEfTux5EamEhxIWgrI=\n```\n\nMore details on Travis encryption at http://about.travis-ci.org/docs/user/encryption-keys/.\n\n#### 3) Hook up publishing\n\nJust put `node-pre-gyp package publish` in your `.travis.yml` after `npm install`.\n\n##### OS X publishing\n\nIf you want binaries for OS X in addition to linux you can enable [multi-os for Travis](http://docs.travis-ci.com/user/multi-os/#Setting-.travis.yml)\n\nUse a configuration like:\n\n```yml\n\nlanguage: cpp\n\nos:\n- linux\n- osx\n\nenv:\n  matrix:\n    - NODE_VERSION=\"0.10\"\n    - NODE_VERSION=\"0.11.14\"\n\nbefore_install:\n- rm -rf ~/.nvm/ && git clone --depth 1 https://github.com/creationix/nvm.git ~/.nvm\n- source ~/.nvm/nvm.sh\n- nvm install $NODE_VERSION\n- nvm use $NODE_VERSION\n```\n\nSee [Travis OS X Gotchas](#travis-os-x-gotchas) for why we replace `language: node_js` and `node_js:` sections with `language: cpp` and a custom matrix.\n\nAlso create platform specific sections for any deps that need install. For example if you need libpng:\n\n```yml\n- if [ $(uname -s) == 'Linux' ]; then apt-get install libpng-dev; fi;\n- if [ $(uname -s) == 'Darwin' ]; then brew install libpng; fi;\n```\n\nFor detailed multi-OS examples see [node-mapnik](https://github.com/mapnik/node-mapnik/blob/master/.travis.yml) and [node-sqlite3](https://github.com/mapbox/node-sqlite3/blob/master/.travis.yml).\n\n##### Travis OS X Gotchas\n\nFirst, unlike the Travis Linux machines, the OS X machines do not put `node-pre-gyp` on PATH by default. To do so you will need to:\n\n```sh\nexport PATH=$(pwd)/node_modules/.bin:${PATH}\n```\n\nSecond, the OS X machines do not support using a matrix for installing different Node.js versions. So you need to bootstrap the installation of Node.js in a cross platform way.\n\nBy doing:\n\n```yml\nenv:\n  matrix:\n    - NODE_VERSION=\"0.10\"\n    - NODE_VERSION=\"0.11.14\"\n\nbefore_install:\n - rm -rf ~/.nvm/ && git clone --depth 1 https://github.com/creationix/nvm.git ~/.nvm\n - source ~/.nvm/nvm.sh\n - nvm install $NODE_VERSION\n - nvm use $NODE_VERSION\n```\n\nYou can easily recreate the previous behavior of this matrix:\n\n```yml\nnode_js:\n  - \"0.10\"\n  - \"0.11.14\"\n```\n\n#### 4) Publish when you want\n\nYou might wish to publish binaries only on a specific commit. To do this you could borrow from the [Travis CI idea of commit keywords](http://about.travis-ci.org/docs/user/how-to-skip-a-build/) and add special handling for commit messages with `[publish binary]`:\n\n    COMMIT_MESSAGE=$(git log --format=%B --no-merges -n 1 | tr -d '\\n')\n    if [[ ${COMMIT_MESSAGE} =~ \"[publish binary]\" ]]; then node-pre-gyp publish; fi;\n\nThen you can trigger new binaries to be built like:\n\n    git commit -a -m \"[publish binary]\"\n\nOr, if you don't have any changes to make simply run:\n\n    git commit --allow-empty -m \"[publish binary]\"\n\nWARNING: if you are working in a pull request and publishing binaries from there then you will want to avoid double publishing when Travis CI builds both the `push` and `pr`. You only want to run the publish on the `push` commit. See https://github.com/Project-OSRM/node-osrm/blob/8eb837abe2e2e30e595093d16e5354bc5c573575/scripts/is_pr_merge.sh which is called from https://github.com/Project-OSRM/node-osrm/blob/8eb837abe2e2e30e595093d16e5354bc5c573575/scripts/publish.sh for an example of how to do this.\n\nRemember this publishing is not the same as `npm publish`. We're just talking about the binary module here and not your entire npm package. To automate the publishing of your entire package to npm on Travis see http://about.travis-ci.org/docs/user/deployment/npm/\n\n# Versioning\n\nThe `binary` properties of `module_path`, `remote_path`, and `package_name` support variable substitution. The strings are evaluated by `node-pre-gyp` depending on your system and any custom build flags you passed.\n\n - `node_abi`: The node C++ `ABI` number. This value is available in Javascript as `process.versions.modules` as of [`>= v0.10.4 >= v0.11.7`](https://github.com/joyent/node/commit/ccabd4a6fa8a6eb79d29bc3bbe9fe2b6531c2d8e) and in C++ as the `NODE_MODULE_VERSION` define much earlier. For versions of Node before this was available we fallback to the V8 major and minor version.\n - `platform` matches node's `process.platform` like `linux`, `darwin`, and `win32` unless the user passed the `--target_platform` option to override.\n - `arch` matches node's `process.arch` like `x64` or `ia32` unless the user passes the `--target_arch` option to override.\n - `configuration` - Either 'Release' or 'Debug' depending on if `--debug` is passed during the build.\n - `module_name` - the `binary.module_name` attribute from `package.json`.\n - `version` - the semver `version` value for your module from `package.json` (NOTE: ignores the `semver.build` property).\n - `major`, `minor`, `patch`, and `prelease` match the individual semver values for your module's `version`\n - `build` - the sevmer `build` value. For example it would be `this.that` if your package.json `version` was `v1.0.0+this.that`\n - `prerelease` - the semver `prerelease` value. For example it would be `alpha.beta` if your package.json `version` was `v1.0.0-alpha.beta`\n\n\nThe options are visible in the code at <https://github.com/mapbox/node-pre-gyp/blob/612b7bca2604508d881e1187614870ba19a7f0c5/lib/util/versioning.js#L114-L127>\n\n# Download binary files from a mirror\n\nS3 is broken in China for the well known reason.\n\nUsing the `npm` config argument: `--{module_name}_binary_host_mirror` can download binary files through a mirror.\n\ne.g.: Install [v8-profiler](https://www.npmjs.com/package/v8-profiler) from `npm`.\n\n```bash\n$ npm install v8-profiler --profiler_binary_host_mirror=https://npm.taobao.org/mirrors/node-inspector/\n```\n",
  "readmeFilename": "README.md",
  "repository": {
    "type": "git",
    "url": "git://github.com/mapbox/node-pre-gyp.git"
  },
  "scripts": {
    "prepublish": "retire -n && npm ls && jshint test/build.test.js test/s3_setup.test.js test/versioning.test.js",
    "test": "jshint lib lib/util scripts bin/node-pre-gyp && mocha -R spec --timeout 500000",
    "update-crosswalk": "node scripts/abi_crosswalk.js"
  },
  "version": "0.6.31"
}

},{}],371:[function(require,module,exports){
// Since [immediate](https://github.com/calvinmetcalf/immediate) is
//   not doing the trick for our WebSQL transactions (at least in Node),
//   we are forced to make the promises run fully synchronously.

function isPromise(p) {
  return p && typeof p.then === 'function';
}
function addReject(prom, reject) {
  prom.then(null, reject) // Use this style for sake of non-Promise thenables (e.g., jQuery Deferred)
}

// States
var PENDING = 2,
    FULFILLED = 0, // We later abuse these as array indices
    REJECTED = 1;

function SyncPromise(fn) {
  var self = this;
  self.v = 0; // Value, this will be set to either a resolved value or rejected reason
  self.s = PENDING; // State of the promise
  self.c = [[],[]]; // Callbacks c[0] is fulfillment and c[1] contains rejection callbacks
  function transist(val, state) {
    self.v = val;
    self.s = state;
    self.c[state].forEach(function(fn) { fn(val); });
    // Release memory, but if no handlers have been added, as we
    //   assume that we will resolve/reject (truly) synchronously
    //   and thus we avoid flagging checks about whether we've
    //   already resolved/rejected.
    if (self.c[state].length) self.c = null;
  }
  function resolve(val) {
    if (!self.c) {
      // Already resolved (or will be resolved), do nothing.
    } else if (isPromise(val)) {
      addReject(val.then(resolve), reject);
    } else {
      transist(val, FULFILLED);
    }
  }
  function reject(reason) {
    if (!self.c) {
      // Already resolved (or will be resolved), do nothing.
    } else if (isPromise(reason)) {
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

prot.then = function(cb, errBack) {
  var self = this;
  return new SyncPromise(function(resolve, reject) {
    var rej = typeof errBack === 'function' ? errBack : reject;
    function settle() {
      try {
        resolve(cb ? cb(self.v) : self.v);
      } catch(e) {
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

prot.catch = function(cb) {
  var self = this;
  return new SyncPromise(function(resolve, reject) {
    function settle() {
      try {
        resolve(cb(self.v));
      } catch(e) {
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

SyncPromise.all = function(promises) {
  return new SyncPromise(function(resolve, reject, l) {
    l = promises.length;
    var hasPromises = false;
    var newPromises = [];
    if (!l) {
        resolve(newPromises);
        return;
    }
    promises.forEach(function(p, i) {
      if (isPromise(p)) {
        addReject(p.then(function(res) {
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

SyncPromise.race = function(promises) {
  var resolved = false;
  return new SyncPromise(function(resolve, reject) {
    promises.some(function(p, i) {
      if (isPromise(p)) {
        addReject(p.then(function(res) {
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

SyncPromise.resolve = function(val) {
  return new SyncPromise(function(resolve, reject) {
    resolve(val);
  });
};

SyncPromise.reject = function(val) {
  return new SyncPromise(function(resolve, reject) {
    reject(val);
  });
};
module.exports = SyncPromise;

},{}],372:[function(require,module,exports){
'use strict';

// Simple FIFO queue implementation to avoid having to do shift()
// on an array, which is slow.

function Queue() {
  this.length = 0;
}

Queue.prototype.push = function (item) {
  var node = {item: item};
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
    if (!(--this.length)) {
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
}

module.exports = Queue;

},{}],373:[function(require,module,exports){
module.exports = Blob

var Buffer = require('buffer').Buffer
  , str = {}.toString.call.bind({}.toString)

function Blob(parts, properties) {
  properties = properties || {}
  this.type = properties.type || ''
  var size = 0
  for(var i = 0, len = parts.length; i < len; ++i) {
    size += typeof parts[i] === 'string' ? Buffer.byteLength(parts[i]) :
            str(parts[i]).indexOf('ArrayBuffer') > -1 ? parts[i].byteLength :
            parts[i].buffer ? parts[i].buffer.byteLength :
            parts[i].length
  }
  this.size = size
}

var cons = Blob
  , proto = cons.prototype

proto.slice = function(start, end) {
  var b = new Blob([], {type: this.type})
  b.size = (end || this.size) - (start || 0)
  return b
}

},{"buffer":undefined}],374:[function(require,module,exports){
module.exports = require('../lib/custom');
},{"../lib/custom":375}],375:[function(require,module,exports){
'use strict';

var immediate = require('immediate');
var argsarray = require('argsarray');

var WebSQLDatabase = require('./websql/WebSQLDatabase');

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
      throw new Error('Failed to execute \'openDatabase\': ' +
        '4 arguments required, but only ' + args.length + ' present');
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

  return argsarray(openDatabase);
}

module.exports = customOpenDatabase;

},{"./websql/WebSQLDatabase":378,"argsarray":1,"immediate":301}],376:[function(require,module,exports){
'use strict';

var sqlite3 = require('sqlite3');
var SQLiteResult = require('./SQLiteResult');

var READ_ONLY_ERROR = new Error(
  'could not prepare statement (23 not authorized)');

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

module.exports = SQLiteDatabase;

},{"./SQLiteResult":377,"sqlite3":309}],377:[function(require,module,exports){
'use strict';

function SQLiteResult(error, insertId, rowsAffected, rows) {
  this.error = error;
  this.insertId = insertId;
  this.rowsAffected = rowsAffected;
  this.rows = rows;
}

module.exports = SQLiteResult;
},{}],378:[function(require,module,exports){
'use strict';

var Queue = require('tiny-queue');
var immediate = require('immediate');
var noop = require('noop-fn');

var WebSQLTransaction = require('./WebSQLTransaction');

var ROLLBACK = [
  {sql: 'ROLLBACK;', args: []}
];

var COMMIT = [
  {sql: 'END;', args: []}
];

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

WebSQLDatabase.prototype._onTransactionComplete = function(err) {
  var self = this;

  function done(er) {
    if (er) {
      self._currentTask.errorCallback(er);
    } else {
      self._currentTask.successCallback();
    }
    self._running = false;
    self._currentTask = null;
    self._runNextTransaction();
  }
  function rollback (er, cb) {
    self._db.exec(ROLLBACK, false, function () {
      done(er);
      if (cb) {
        cb();
      }
    });
  }
  function commit (cb) {
    self._db.exec(COMMIT, false, function () {
      done();
      if (cb) {
        cb();
      }
    });
  }

  if (self._currentTask.nonstandardTransCb) {
    var cont = self._currentTask.nonstandardTransCb.call(this, self._currentTask, err, done, rollback, commit);
    if (!cont) {
        return;
    }
  }
  if (self._currentTask.readOnly) {
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

WebSQLDatabase.prototype._runNextTransaction = function() {
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

WebSQLDatabase.prototype._createTransaction = function(
    readOnly, txnCallback, errorCallback, successCallback, nonstandardTransCb) {
  errorCallback = errorCallback || noop;
  successCallback = successCallback || noop;

  if (typeof txnCallback !== 'function') {
    throw new Error('The callback provided as parameter 1 is not a function.');
  }

  this._txnQueue.push(new TransactionTask(readOnly, txnCallback, errorCallback, successCallback, nonstandardTransCb));
  this._runNextTransaction();
};

WebSQLDatabase.prototype.transaction = function (txnCallback, errorCallback, successCallback, nonstandardTransCb) {
  this._createTransaction(false, txnCallback, errorCallback, successCallback, nonstandardTransCb);
};

WebSQLDatabase.prototype.readTransaction = function (txnCallback, errorCallback, successCallback) {
  this._createTransaction(true, txnCallback, errorCallback, successCallback);
};

module.exports = WebSQLDatabase;

},{"./WebSQLTransaction":380,"immediate":301,"noop-fn":308,"tiny-queue":372}],379:[function(require,module,exports){
'use strict';

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

module.exports = WebSQLResultSet;
},{}],380:[function(require,module,exports){
'use strict';

var noop = require('noop-fn');
var Queue = require('tiny-queue');
var immediate = require('immediate');
var WebSQLResultSet = require('./WebSQLResultSet');

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
        batchTask.sqlCallback(self, massageSQLResult(
          batch[i].sql, res.insertId, res.rowsAffected, res.rows));
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
  while ((task = self._sqlQueue.shift())) {
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

WebSQLTransaction.prototype.executeSql = function (sql, args, sqlCallback, sqlErrorCallback) {
  args = Array.isArray(args) ? args : [];
  sqlCallback = typeof sqlCallback === 'function' ? sqlCallback : noop;
  sqlErrorCallback = typeof sqlErrorCallback === 'function' ? sqlErrorCallback : errorUnhandled;

  executeSql(this, sql, args, sqlCallback, sqlErrorCallback, this._executeDelay);
};

WebSQLTransaction.prototype._checkDone = function () {
  runAllSql(this);
};

module.exports = WebSQLTransaction;

},{"./WebSQLResultSet":379,"immediate":301,"noop-fn":308,"tiny-queue":372}],381:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var map = {};
var CFG = {};

[
// Boolean for verbose reporting
'DEBUG', // Effectively defaults to false (ignored unless true)

// Used by `IDBCursor` continue methods for number of records to cache;
'cursorPreloadPackSize', //  Defaults to 100

// See optional API (`shimIndexedDB.__setUnicodeIdentifiers`);
//    or just use the Unicode builds which invoke this method
//    automatically using the large, fully spec-compliant, regular
//    expression strings of `src/UnicodeIdentifiers.js`)
'UnicodeIDStart', // In the non-Unicode builds, defaults to /[$A-Z_a-z]/
'UnicodeIDContinue', // In the non-Unicode builds, defaults to /[$0-9A-Z_a-z]/

// -----------SQL CONFIG----------
// Object (`window` in the browser) on which there may be an
//  `openDatabase` method (if any) for WebSQL. (The browser
//  throws if attempting to call `openDatabase` without the window
//  so this is why the config doesn't just allow the function.)
'win', // Defaults to `window` or `self` in browser builds or
// a singleton object with the `openDatabase` method set to
// the "websql" package in Node.

// For internal `openDatabase` calls made by `IDBFactory` methods;
//  per the WebSQL spec, "User agents are expected to use the display name
//  and the estimated database size to optimize the user experience.
//  For example, a user agent could use the estimated size to suggest an
//  initial quota to the user. This allows a site that is aware that it
//  will try to use hundreds of megabytes to declare this upfront, instead
//  of the user agent prompting the user for permission to increase the
//  quota every five megabytes."
'DEFAULT_DB_SIZE', // Defaults to (4 * 1024 * 1024) or (25 * 1024 * 1024) in Safari

// Overcoming limitations with node-sqlite3/storing database name on file systems
// https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
'escapeDatabaseName', // Defaults to prefixing database with `D_`, escaping
//   `databaseCharacterEscapeList`, escaping NUL, and
//   escaping upper case letters, as well as enforcing
//   `databaseNameLengthLimit`
'unescapeDatabaseName', // Not used internally; usable as a convenience method
'databaseCharacterEscapeList', // Defaults to global regex representing the following
// (characters nevertheless commonly reserved in modern, Unicode-supporting
// systems): 0x00-0x1F 0x7F " * / : < > ? \ |
'databaseNameLengthLimit', // Defaults to 254 (shortest typical modern file length limit)

// Optional Node WebSQL config
'sqlBusyTimeout', // Defaults to 1000
'sqlTrace', // Callback not used by default
'sqlProfile' // Callback not used by default
].forEach(function (prop) {
    Object.defineProperty(CFG, prop, {
        get: function get() {
            return map[prop];
        },
        set: function set(val) {
            map[prop] = val;
        }
    });
});

exports.default = CFG;
module.exports = exports['default'];

},{}],382:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.webSQLErrback = exports.createDOMException = exports.DOMException = exports.findError = exports.logError = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates a native DOMException, for browsers that support it
 * @returns {DOMException}
 */
function createNativeDOMException(name, message) {
    return new DOMException.prototype.constructor(message, name || 'DOMException');
}

/**
 * Creates a generic Error object
 * @returns {Error}
 */
function createError(name, message) {
    var e = new Error(message); // DOMException uses the same `toString` as `Error`, so no need to add
    e.name = name || 'DOMException';
    e.code = { // From web-platform-tests testharness.js name_code_map (though not in new spec)
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
    }[name];
    e.message = message;
    return e;
}

/**
 * Logs detailed error information to the console.
 * @param {string} name
 * @param {string} message
 * @param {string|Error|null} error
 */
function logError(name, message, error) {
    if (_CFG2.default.DEBUG) {
        if (error && error.message) {
            error = error.message;
        }

        var method = typeof console.error === 'function' ? 'error' : 'log';
        console[method](name + ': ' + message + '. ' + (error || ''));
        console.trace && console.trace();
    }
}

function isErrorOrDOMErrorOrDOMException(obj) {
    return obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object' && // We don't use util.isObj here as mutual dependency causing problems in Babel with browser
    typeof obj.name === 'string';
}

/**
 * Finds the error argument.  This is useful because some WebSQL callbacks
 * pass the error as the first argument, and some pass it as the second argument.
 * @param {array} args
 * @returns {Error|DOMException|undefined}
 */
function findError(args) {
    var err = void 0;
    if (args) {
        if (args.length === 1) {
            return args[0];
        }
        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
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

function webSQLErrback(webSQLErr) {
    var name = void 0,
        message = void 0;
    switch (webSQLErr.code) {
        case 4:
            {
                // SQLError.QUOTA_ERR
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
        default:
            {
                name = 'UnknownError';
                message = 'The operation failed for reasons unrelated to the database itself and not covered by any other errors.';
                break;
            }
    }
    message += ' (' + webSQLErr.message + ')--(' + webSQLErr.code + ')';
    var err = createDOMException(name, message);
    return err;
}

var test = void 0,
    useNativeDOMException = false;

// Test whether we can use the browser's native DOMException class
try {
    test = createNativeDOMException('test name', 'test message');
    if (isErrorOrDOMErrorOrDOMException(test) && test.name === 'test name' && test.message === 'test message') {
        // Native DOMException works as expected
        useNativeDOMException = true;
    }
} catch (e) {}

var createDOMException = void 0,
    shimDOMException = void 0;
if (useNativeDOMException) {
    exports.DOMException = shimDOMException = DOMException;
    exports.createDOMException = createDOMException = function createDOMException(name, message, error) {
        logError(name, message, error);
        return createNativeDOMException(name, message);
    };
} else {
    exports.DOMException = shimDOMException = Error;
    exports.createDOMException = createDOMException = function createDOMException(name, message, error) {
        logError(name, message, error);
        return createError(name, message);
    };
}

exports.logError = logError;
exports.findError = findError;
exports.DOMException = shimDOMException;
exports.createDOMException = createDOMException;
exports.webSQLErrback = webSQLErrback;

},{"./CFG.js":381}],383:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ShimEvent = exports.createEvent = exports.IDBVersionChangeEvent = undefined;

var _eventtarget = require('eventtarget');

var _eventtarget2 = _interopRequireDefault(_eventtarget);

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ShimEvent = _eventtarget2.default.EventPolyfill;

function createEvent(type, debug, evInit) {
    var ev = new ShimEvent(type, evInit);
    ev.debug = debug;
    return ev;
}

// Babel apparently having a problem adding `hasInstance` to a class, so we are redefining as a function
function IDBVersionChangeEvent(type, eventInitDict) {
    // eventInitDict is a IDBVersionChangeEventInit (but is not defined as a global)
    ShimEvent.call(this, type);
    Object.defineProperty(this, 'oldVersion', {
        enumerable: true,
        configurable: true,
        get: function get() {
            return eventInitDict.oldVersion;
        }
    });
    Object.defineProperty(this, 'newVersion', {
        enumerable: true,
        configurable: true,
        get: function get() {
            return eventInitDict.newVersion;
        }
    });
}
IDBVersionChangeEvent.prototype = new ShimEvent('bogus');
IDBVersionChangeEvent.prototype.constructor = IDBVersionChangeEvent;
IDBVersionChangeEvent.prototype.toString = function () {
    return '[object IDBVersionChangeEvent]';
};

Object.defineProperty(IDBVersionChangeEvent, Symbol.hasInstance, {
    value: function value(obj) {
        return util.isObj(obj) && 'oldVersion' in obj && typeof obj.defaultPrevented === 'boolean';
    }
});

// We don't add within polyfill repo as might not always be the desired implementation
Object.defineProperty(ShimEvent, Symbol.hasInstance, {
    value: function value(obj) {
        return util.isObj(obj) && 'target' in obj && typeof obj.bubbles === 'boolean';
    }
});

exports.IDBVersionChangeEvent = IDBVersionChangeEvent;
exports.createEvent = createEvent;
exports.ShimEvent = ShimEvent; // Event not currently in use

},{"./util.js":399,"eventtarget":300}],384:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IDBCursorWithValue = exports.IDBCursor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _IDBRequest = require('./IDBRequest.js');

var _DOMException = require('./DOMException.js');

var _IDBKeyRange = require('./IDBKeyRange.js');

var _IDBFactory = require('./IDBFactory.js');

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

var _Sca = require('./Sca.js');

var _Sca2 = _interopRequireDefault(_Sca);

var _IDBIndex = require('./IDBIndex.js');

var _IDBIndex2 = _interopRequireDefault(_IDBIndex);

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * The IndexedDB Cursor Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @param {IDBObjectStore} store
 * @param {IDBObjectStore|IDBIndex} source
 * @param {string} keyColumnName
 * @param {string} valueColumnName
 * @param {boolean} count
 */
function IDBCursor(range, direction, store, source, keyColumnName, valueColumnName, count) {
    // Calling openCursor on an index or objectstore with null is allowed but we treat it as undefined internally
    _IDBTransaction2.default.__assertActive(store.transaction);
    if (range === null) {
        range = undefined;
    }
    if (util.instanceOf(range, _IDBKeyRange.IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!range.toString() !== '[object IDBKeyRange]') {
            range = new _IDBKeyRange.IDBKeyRange(range.lower, range.upper, range.lowerOpen, range.upperOpen);
        }
    } else if (range !== undefined) {
        range = new _IDBKeyRange.IDBKeyRange(range, range, false, false);
    }
    if (direction !== undefined && !['next', 'prev', 'nextunique', 'prevunique'].includes(direction)) {
        throw new TypeError(direction + 'is not a valid cursor direction');
    }

    Object.defineProperties(this, {
        // Babel is not respecting default writable false here, so make explicit
        source: { writable: false, value: source },
        direction: { writable: false, value: direction || 'next' }
    });
    this.__key = undefined;
    this.__primaryKey = undefined;

    this.__store = store;
    this.__range = range;
    this.__req = new _IDBRequest.IDBRequest();
    this.__req.__source = source;
    this.__req.__transaction = this.__store.transaction;
    this.__keyColumnName = keyColumnName;
    this.__valueColumnName = valueColumnName;
    this.__keyOnly = valueColumnName === 'key';
    this.__valueDecoder = this.__keyOnly ? _Key2.default : _Sca2.default;
    this.__count = count;
    this.__prefetchedIndex = -1;
    this.__indexSource = util.instanceOf(source, _IDBIndex2.default);
    this.__multiEntryIndex = this.__indexSource ? source.multiEntry : false;
    this.__unique = this.direction.includes('unique');
    this.__sqlDirection = ['prev', 'prevunique'].includes(this.direction) ? 'DESC' : 'ASC';

    if (range !== undefined) {
        // Encode the key range and cache the encoded values, so we don't have to re-encode them over and over
        range.__lowerCached = range.lower !== undefined && _Key2.default.encode(range.lower, this.__multiEntryIndex);
        range.__upperCached = range.upper !== undefined && _Key2.default.encode(range.upper, this.__multiEntryIndex);
    }
    this.__gotValue = true;
    this['continue']();
}

IDBCursor.prototype.__find = function () /* key, tx, success, error, recordsToLoad */{
    if (this.__multiEntryIndex) {
        this.__findMultiEntry.apply(this, arguments);
    } else {
        this.__findBasic.apply(this, arguments);
    }
};

IDBCursor.prototype.__findBasic = function (key, primaryKey, tx, success, error, recordsToLoad) {
    var continueCall = recordsToLoad !== undefined;
    recordsToLoad = recordsToLoad || 1;

    var me = this;
    var quotedKeyColumnName = util.quote(me.__keyColumnName);
    var quotedKey = util.quote('key');
    var sql = ['SELECT * FROM', util.escapeStore(me.__store.name)];
    var sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    (0, _IDBKeyRange.setSQLForRange)(me.__range, quotedKeyColumnName, sql, sqlValues, true, true);

    // Determine the ORDER BY direction based on the cursor.
    var direction = me.__sqlDirection;
    var op = direction === 'ASC' ? '>' : '<';

    if (primaryKey !== undefined) {
        sql.push('AND', quotedKey, op + '= ?');
        // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
        sqlValues.push(_Key2.default.encode(primaryKey));
    }
    if (key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + '= ?');
        _Key2.default.convertValueToKey(key);
        sqlValues.push(_Key2.default.encode(key));
    } else if (continueCall && me.__key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + ' ?');
        _Key2.default.convertValueToKey(me.__key);
        sqlValues.push(_Key2.default.encode(me.__key));
    }

    if (!me.__count) {
        // 1. Sort by key
        sql.push('ORDER BY', quotedKeyColumnName, direction);

        // 2. Sort by primaryKey (if defined and not unique)
        if (!me.__unique && me.__keyColumnName !== 'key') {
            // Avoid adding 'key' twice
            sql.push(',', quotedKey, direction);
        }

        // 3. Sort by position (if defined)

        if (!me.__unique && me.__indexSource) {
            // 4. Sort by object store position (if defined and not unique)
            sql.push(',', util.quote(me.__valueColumnName), direction);
        }
        sql.push('LIMIT', recordsToLoad);
    }
    sql = sql.join(' ');
    _CFG2.default.DEBUG && console.log(sql, sqlValues);

    tx.executeSql(sql, sqlValues, function (tx, data) {
        if (me.__count) {
            success(undefined, data.rows.length, undefined);
        } else if (data.rows.length > 1) {
            me.__prefetchedIndex = 0;
            me.__prefetchedData = data.rows;
            _CFG2.default.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for cursor');
            me.__decode(data.rows.item(0), success);
        } else if (data.rows.length === 1) {
            me.__decode(data.rows.item(0), success);
        } else {
            _CFG2.default.DEBUG && console.log('Reached end of cursors');
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        _CFG2.default.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
        error(err);
    });
};

IDBCursor.prototype.__findMultiEntry = function (key, primaryKey, tx, success, error) {
    var me = this;

    if (me.__prefetchedData && me.__prefetchedData.length === me.__prefetchedIndex) {
        _CFG2.default.DEBUG && console.log('Reached end of multiEntry cursor');
        success(undefined, undefined, undefined);
        return;
    }

    var quotedKeyColumnName = util.quote(me.__keyColumnName);
    var sql = ['SELECT * FROM', util.escapeStore(me.__store.name)];
    var sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && me.__range.lower !== undefined && Array.isArray(me.__range.upper)) {
        if (me.__range.upper.indexOf(me.__range.lower) === 0) {
            sql.push('AND', quotedKeyColumnName, "LIKE ? ESCAPE '^'");
            sqlValues.push('%' + util.sqlLIKEEscape(me.__range.__lowerCached.slice(0, -1)) + '%');
        }
    }

    // Determine the ORDER BY direction based on the cursor.
    var direction = me.__sqlDirection;
    var op = direction === 'ASC' ? '>' : '<';
    var quotedKey = util.quote('key');

    if (primaryKey !== undefined) {
        sql.push('AND', quotedKey, op + '= ?');
        // Key.convertValueToKey(primaryKey); // Already checked by `continuePrimaryKey`
        sqlValues.push(_Key2.default.encode(primaryKey));
    }
    if (key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + '= ?');
        _Key2.default.convertValueToKey(key);
        sqlValues.push(_Key2.default.encode(key));
    } else if (me.__key !== undefined) {
        sql.push('AND', quotedKeyColumnName, op + ' ?');
        _Key2.default.convertValueToKey(me.__key);
        sqlValues.push(_Key2.default.encode(me.__key));
    }

    if (!me.__count) {
        // 1. Sort by key
        sql.push('ORDER BY', quotedKeyColumnName, direction);

        // 2. Sort by primaryKey (if defined and not unique)
        if (!me.__unique && me.__keyColumnName !== 'key') {
            // Avoid adding 'key' twice
            sql.push(',', util.quote('key'), direction);
        }

        // 3. Sort by position (if defined)

        if (!me.__unique && me.__indexSource) {
            // 4. Sort by object store position (if defined and not unique)
            sql.push(',', util.quote(me.__valueColumnName), direction);
        }
    }
    sql = sql.join(' ');
    _CFG2.default.DEBUG && console.log(sql, sqlValues);

    tx.executeSql(sql, sqlValues, function (tx, data) {
        if (data.rows.length > 0) {
            var _ret = function () {
                if (me.__count) {
                    // Avoid caching and other processing below
                    var ct = 0;
                    for (var i = 0; i < data.rows.length; i++) {
                        var rowItem = data.rows.item(i);
                        var rowKey = _Key2.default.decode(rowItem[me.__keyColumnName], true);
                        var matches = _Key2.default.findMultiEntryMatches(rowKey, me.__range);
                        ct += matches.length;
                    }
                    success(undefined, ct, undefined);
                    return {
                        v: void 0
                    };
                }
                var rows = [];
                for (var _i = 0; _i < data.rows.length; _i++) {
                    var _rowItem = data.rows.item(_i);
                    var _rowKey = _Key2.default.decode(_rowItem[me.__keyColumnName], true);
                    var _matches = _Key2.default.findMultiEntryMatches(_rowKey, me.__range);

                    for (var j = 0; j < _matches.length; j++) {
                        var matchingKey = _matches[j];
                        var clone = {
                            matchingKey: _Key2.default.encode(matchingKey, true),
                            key: _rowItem.key
                        };
                        clone[me.__keyColumnName] = _rowItem[me.__keyColumnName];
                        clone[me.__valueColumnName] = _rowItem[me.__valueColumnName];
                        rows.push(clone);
                    }
                }
                var reverse = me.direction.indexOf('prev') === 0;
                rows.sort(function (a, b) {
                    if (a.matchingKey.replace('[', 'z') < b.matchingKey.replace('[', 'z')) {
                        return reverse ? 1 : -1;
                    }
                    if (a.matchingKey.replace('[', 'z') > b.matchingKey.replace('[', 'z')) {
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
                        item: function item(index) {
                            return this.data[index];
                        }
                    };
                    _CFG2.default.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for multiEntry cursor');
                    me.__decode(rows[0], success);
                } else if (rows.length === 1) {
                    _CFG2.default.DEBUG && console.log('Reached end of multiEntry cursor');
                    me.__decode(rows[0], success);
                } else {
                    _CFG2.default.DEBUG && console.log('Reached end of multiEntry cursor');
                    success(undefined, undefined, undefined);
                }
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        } else {
            _CFG2.default.DEBUG && console.log('Reached end of multiEntry cursor');
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        _CFG2.default.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
        error(err);
    });
};

/**
 * Creates an "onsuccess" callback
 * @private
 */
IDBCursor.prototype.__onsuccess = function (success) {
    var me = this;
    return function (key, value, primaryKey) {
        me.__gotValue = true;
        if (me.__count) {
            success(value, me.__req);
        } else {
            me.__key = key === undefined ? null : key;
            me.__primaryKey = primaryKey === undefined ? null : primaryKey;
            me.__value = value === undefined ? null : value;
            var result = key === undefined ? null : me;
            success(result, me.__req);
        }
    };
};

IDBCursor.prototype.__decode = function (rowItem, callback) {
    if (this.__multiEntryIndex && this.__unique) {
        if (!this.__matchedKeys) {
            this.__matchedKeys = {};
        }
        if (this.__matchedKeys[rowItem.matchingKey]) {
            callback(undefined, undefined, undefined);
            return;
        }
        this.__matchedKeys[rowItem.matchingKey] = true;
    }
    var key = _Key2.default.decode(util.unescapeNUL(this.__multiEntryIndex ? rowItem.matchingKey : rowItem[this.__keyColumnName]), this.__multiEntryIndex);
    var val = this.__valueDecoder.decode(util.unescapeNUL(rowItem[this.__valueColumnName]));
    var primaryKey = _Key2.default.decode(util.unescapeNUL(rowItem.key));
    callback(key, val, primaryKey);
};

IDBCursor.prototype.__sourceOrEffectiveObjStoreDeleted = function () {
    if (!this.__store.transaction.db.objectStoreNames.contains(this.__store.name) || this.__indexSource && !this.__store.indexNames.contains(this.source.name)) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'The cursor\'s source or effective object store has been deleted');
    }
};

IDBCursor.prototype.__invalidateCache = function () {
    this.__prefetchedData = null;
};

IDBCursor.prototype.__continue = function (key, advanceContinue) {
    var me = this;
    var advanceState = me.__advanceCount !== undefined;
    _IDBTransaction2.default.__assertActive(me.__store.transaction);
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue && !advanceContinue) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (key !== undefined) _Key2.default.convertValueToKey(key);

    if (key !== undefined) {
        var cmpResult = (0, _IDBFactory.cmp)(key, me.key);
        if (cmpResult === 0 || me.direction.includes('next') && cmpResult === -1 || me.direction.includes('prev') && cmpResult === 1) {
            throw (0, _DOMException.createDOMException)('DataError', 'Cannot ' + (advanceState ? 'advance' : 'continue') + ' the cursor in an unexpected direction');
        }
    }
    this.__continueFinish(key, undefined, advanceState);
};

IDBCursor.prototype.__continueFinish = function (key, primaryKey, advanceState) {
    var me = this;
    var recordsToPreloadOnContinue = me.__advanceCount || _CFG2.default.cursorPreloadPackSize || 100;
    me.__gotValue = false;
    me.__req.__readyState = 'pending'; // Unset done flag

    me.__store.transaction.__pushToQueue(me.__req, function cursorContinue(tx, args, success, error, executeNextRequest) {
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
                me.__decode(me.__prefetchedData.item(me.__prefetchedIndex), function (k, val, primKey) {
                    function checkKey() {
                        if (key !== undefined && k !== key && (primaryKey === undefined || primaryKey !== primKey)) {
                            cursorContinue(tx, args, success, error);
                            return;
                        }
                        triggerSuccess(k, val, primKey);
                    }
                    if (me.__unique && !me.__multiEntryIndex) {
                        _Sca2.default.encode(val, function (encVal) {
                            _Sca2.default.encode(me.value, function (encMeVal) {
                                if (encVal === encMeVal) {
                                    cursorContinue(tx, args, success, error);
                                    return;
                                }
                                checkKey();
                            });
                        });
                        return;
                    }
                    checkKey();
                });
                return;
            }
        }

        // No (or not enough) pre-fetched data, do query
        me.__find(key, primaryKey, tx, triggerSuccess, function () {
            me.__advanceCount = undefined;
            error.apply(undefined, arguments);
        }, recordsToPreloadOnContinue);
    });
};

IDBCursor.prototype['continue'] = function (key) {
    this.__continue(key);
};

IDBCursor.prototype.continuePrimaryKey = function (key, primaryKey) {
    var me = this;
    _IDBTransaction2.default.__assertActive(me.__store.transaction);
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__indexSource) {
        throw (0, _DOMException.createDOMException)('InvalidAccessError', '`continuePrimaryKey` may only be called on an index source.');
    }
    if (!['next', 'prev'].includes(me.direction)) {
        throw (0, _DOMException.createDOMException)('InvalidAccessError', '`continuePrimaryKey` may not be called with unique cursors.');
    }
    if (!me.__gotValue) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    _Key2.default.convertValueToKey(key);
    _Key2.default.convertValueToKey(primaryKey);

    var cmpResult = (0, _IDBFactory.cmp)(key, me.key);
    if (me.direction === 'next' && cmpResult === -1 || me.direction === 'prev' && cmpResult === 1) {
        throw (0, _DOMException.createDOMException)('DataError', 'Cannot continue the cursor in an unexpected direction');
    }
    function noErrors() {
        me.__continueFinish(key, primaryKey, false);
    }
    if (cmpResult === 0) {
        _Sca2.default.encode(primaryKey, function (encPrimaryKey) {
            _Sca2.default.encode(me.primaryKey, function (encObjectStorePos) {
                if (encPrimaryKey === encObjectStorePos || me.direction === 'next' && encPrimaryKey < encObjectStorePos || me.direction === 'prev' && encPrimaryKey > encObjectStorePos) {
                    throw (0, _DOMException.createDOMException)('DataError', 'Cannot continue the cursor in an unexpected direction');
                }
                noErrors();
            });
        });
    } else {
        noErrors();
    }
};

IDBCursor.prototype.advance = function (count) {
    var me = this;
    if (count === 0) {
        throw new TypeError('Calling advance() with count argument 0');
    }
    if (!Number.isFinite(count) || count < 0) {
        throw new TypeError('Count is invalid - non-finite or negative: ' + count);
    }
    if (me.__gotValue) {
        // Only set the count if not running in error (otherwise will override earlier good advance calls)
        me.__advanceCount = count;
    }
    me.__continue();
};

IDBCursor.prototype.update = function (valueToUpdate) {
    var me = this;
    if (!arguments.length) throw new TypeError('A value must be passed to update()');
    _IDBTransaction2.default.__assertActive(me.__store.transaction);
    me.__store.transaction.__assertWritable();
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (me.__keyOnly) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
    }
    util.throwIfNotClonable(valueToUpdate, 'The data to be updated could not be cloned by the internal structured cloning algorithm.');
    if (me.__store.keyPath !== null) {
        var evaluatedKey = me.__store.__validateKeyAndValue(valueToUpdate);
        if (me.primaryKey !== evaluatedKey) {
            throw (0, _DOMException.createDOMException)('DataError', 'The key of the supplied value to `update` is not equal to the cursor\'s effective key');
        }
    }
    return me.__store.transaction.__addToTransactionQueue(function cursorUpdate(tx, args, success, error) {
        var key = me.key;
        var primaryKey = me.primaryKey;
        var store = me.__store;
        _Sca2.default.encode(valueToUpdate, function (encoded) {
            var value = _Sca2.default.decode(encoded);
            _Sca2.default.encode(value, function (encoded) {
                // First try to delete if the record exists
                _Key2.default.convertValueToKey(primaryKey);
                var sql = 'DELETE FROM ' + util.escapeStore(store.name) + ' WHERE key = ?';
                var encodedPrimaryKey = _Key2.default.encode(primaryKey);
                _CFG2.default.DEBUG && console.log(sql, encoded, key, primaryKey, encodedPrimaryKey);

                tx.executeSql(sql, [util.escapeNUL(encodedPrimaryKey)], function (tx, data) {
                    _CFG2.default.DEBUG && console.log('Did the row with the', primaryKey, 'exist? ', data.rowsAffected);

                    store.__deriveKey(tx, value, key, function (primaryKey, useNewForAutoInc) {
                        store.__insertData(tx, encoded, value, primaryKey, key, useNewForAutoInc, function () {
                            store.__cursors.forEach(function (cursor) {
                                cursor.__invalidateCache(); // Delete and add
                            });
                            success.apply(undefined, arguments);
                        }, error);
                    }, function (tx, err) {
                        error(err);
                    });
                });
            });
        });
    }, undefined, me);
};

IDBCursor.prototype['delete'] = function () {
    var me = this;
    _IDBTransaction2.default.__assertActive(me.__store.transaction);
    me.__store.transaction.__assertWritable();
    me.__sourceOrEffectiveObjStoreDeleted();
    if (!me.__gotValue) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'The cursor is being iterated or has iterated past its end.');
    }
    if (me.__keyOnly) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This cursor method cannot be called when the key only flag has been set.');
    }
    return this.__store.transaction.__addToTransactionQueue(function cursorDelete(tx, args, success, error) {
        me.__find(undefined, undefined, tx, function (key, value, primaryKey) {
            var sql = 'DELETE FROM  ' + util.escapeStore(me.__store.name) + ' WHERE key = ?';
            _CFG2.default.DEBUG && console.log(sql, key, primaryKey);
            _Key2.default.convertValueToKey(primaryKey);
            tx.executeSql(sql, [util.escapeNUL(_Key2.default.encode(primaryKey))], function (tx, data) {
                if (data.rowsAffected === 1) {
                    me.__store.__cursors.forEach(function (cursor) {
                        cursor.__invalidateCache(); // Delete
                    });
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

IDBCursor.prototype.toString = function () {
    return '[object IDBCursor]';
};

util.defineReadonlyProperties(IDBCursor.prototype, ['key', 'primaryKey']);

var IDBCursorWithValue = function (_IDBCursor) {
    _inherits(IDBCursorWithValue, _IDBCursor);

    function IDBCursorWithValue() {
        _classCallCheck(this, IDBCursorWithValue);

        return _possibleConstructorReturn(this, (IDBCursorWithValue.__proto__ || Object.getPrototypeOf(IDBCursorWithValue)).apply(this, arguments));
    }

    _createClass(IDBCursorWithValue, [{
        key: 'toString',
        value: function toString() {
            return '[object IDBCursorWithValue]';
        }
    }]);

    return IDBCursorWithValue;
}(IDBCursor);

util.defineReadonlyProperties(IDBCursorWithValue.prototype, 'value');

exports.IDBCursor = IDBCursor;
exports.IDBCursorWithValue = IDBCursorWithValue;

},{"./CFG.js":381,"./DOMException.js":382,"./IDBFactory.js":386,"./IDBIndex.js":387,"./IDBKeyRange.js":388,"./IDBRequest.js":390,"./IDBTransaction.js":391,"./Key.js":392,"./Sca.js":393,"./util.js":399}],385:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _DOMException = require('./DOMException.js');

var _Event = require('./Event.js');

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

var _IDBObjectStore = require('./IDBObjectStore.js');

var _IDBObjectStore2 = _interopRequireDefault(_IDBObjectStore);

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

var _Sca = require('./Sca.js');

var _Sca2 = _interopRequireDefault(_Sca);

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

var _eventtarget = require('eventtarget');

var _eventtarget2 = _interopRequireDefault(_eventtarget);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * IDB Database Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
 * @constructor
 */
function IDBDatabase(db, name, oldVersion, version, storeProperties) {
    var _this = this;

    this.__db = db;
    this.__closed = false;
    this.__oldVersion = oldVersion;
    this.__version = version;
    this.__name = name;
    this.onabort = this.onclose = this.onerror = this.onversionchange = null;

    this.__transactions = [];
    this.__objectStores = {};
    this.__objectStoreNames = new util.StringList();
    var itemCopy = {};

    var _loop = function _loop(i) {
        var item = storeProperties.rows.item(i);
        // Safari implements `item` getter return object's properties
        //  as readonly, so we copy all its properties (except our
        //  custom `currNum` which we don't need) onto a new object
        itemCopy.name = item.name;
        itemCopy.keyPath = _Sca2.default.decode(item.keyPath);
        ['autoInc', 'indexList'].forEach(function (prop) {
            itemCopy[prop] = JSON.parse(item[prop]);
        });
        itemCopy.idbdb = _this;
        var store = new _IDBObjectStore2.default(itemCopy);
        _this.__objectStores[store.name] = store;
        _this.objectStoreNames.push(store.name);
    };

    for (var i = 0; i < storeProperties.rows.length; i++) {
        _loop(i);
    }
    this.__oldObjectStoreNames = this.objectStoreNames.clone();
}

/**
 * Creates a new object store.
 * @param {string} storeName
 * @param {object} [createOptions]
 * @returns {IDBObjectStore}
 */
IDBDatabase.prototype.createObjectStore = function (storeName, createOptions) {
    storeName = String(storeName); // W3C test within IDBObjectStore.js seems to accept string conversion
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    _IDBTransaction2.default.__assertVersionChange(this.__versionTransaction); // this.__versionTransaction may not exist if called mistakenly by user in onsuccess
    _IDBTransaction2.default.__assertActive(this.__versionTransaction);
    if (this.__objectStores[storeName]) {
        throw (0, _DOMException.createDOMException)('ConstraintError', 'Object store "' + storeName + '" already exists in ' + this.name);
    }
    createOptions = Object.assign({}, createOptions);
    if (createOptions.keyPath === undefined) {
        createOptions.keyPath = null;
    }

    var keyPath = createOptions.keyPath;
    var autoIncrement = createOptions.autoIncrement;

    if (keyPath !== null && !util.isValidKeyPath(keyPath)) {
        throw (0, _DOMException.createDOMException)('SyntaxError', 'The keyPath argument contains an invalid key path.');
    }
    if (autoIncrement && (keyPath === '' || Array.isArray(keyPath))) {
        throw (0, _DOMException.createDOMException)('InvalidAccessError', 'With autoIncrement set, the keyPath argument must not be an array or empty string.');
    }

    /** @name IDBObjectStoreProperties **/
    var storeProperties = {
        name: storeName,
        keyPath: keyPath,
        autoInc: autoIncrement,
        indexList: {},
        idbdb: this
    };
    var store = new _IDBObjectStore2.default(storeProperties, this.__versionTransaction);
    _IDBObjectStore2.default.__createObjectStore(this, store);
    return store;
};

/**
 * Deletes an object store.
 * @param {string} storeName
 */
IDBDatabase.prototype.deleteObjectStore = function (storeName) {
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    _IDBTransaction2.default.__assertVersionChange(this.__versionTransaction);
    _IDBTransaction2.default.__assertActive(this.__versionTransaction);

    var store = this.__objectStores[storeName];
    if (!store) {
        throw (0, _DOMException.createDOMException)('NotFoundError', 'Object store "' + storeName + '" does not exist in ' + this.name);
    }

    _IDBObjectStore2.default.__deleteObjectStore(this, store);
};

IDBDatabase.prototype.close = function () {
    this.__closed = true;
};

/**
 * Starts a new transaction.
 * @param {string|string[]} storeNames
 * @param {string} mode
 * @returns {IDBTransaction}
 */
IDBDatabase.prototype.transaction = function (storeNames, mode) {
    var _this2 = this;

    // Since SQLite (at least node-websql and definitely WebSQL) requires
    //   locking of the whole database, to allow simultaneous readwrite
    //   operations on transactions without overlapping stores, we'd probably
    //   need to save the stores in separate databases (we could also consider
    //   prioritizing readonly but not starving readwrite).
    // Even for readonly transactions, due to [issue 17](https://github.com/nolanlawson/node-websql/issues/17),
    //   we're not currently actually running the SQL requests in parallel.
    if (typeof mode === 'number') {
        mode = mode === 1 ? 'readwrite' : 'readonly';
        _CFG2.default.DEBUG && console.log('Mode should be a string, but was specified as ', mode); // Todo: Remove this option as no longer in spec
    } else {
        mode = mode || 'readonly';
    }

    if (mode !== 'readonly' && mode !== 'readwrite') {
        throw new TypeError('Invalid transaction mode: ' + mode);
    }

    _IDBTransaction2.default.__assertNotVersionChange(this.__versionTransaction);
    if (this.__closed) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'An attempt was made to start a new transaction on a database connection that is not open');
    }

    storeNames = typeof storeNames === 'string' ? [storeNames] : storeNames;
    storeNames.forEach(function (storeName) {
        if (!_this2.objectStoreNames.contains(storeName)) {
            throw (0, _DOMException.createDOMException)('NotFoundError', 'The "' + storeName + '" object store does not exist');
        }
    });
    if (storeNames.length === 0) {
        throw (0, _DOMException.createDOMException)('InvalidAccessError', 'No object store names were specified');
    }
    // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
    var trans = new _IDBTransaction2.default(this, storeNames, mode);
    this.__transactions.push(trans);
    return trans;
};

// Todo: Test
IDBDatabase.prototype.__forceClose = function (msg) {
    var me = this;
    me.close();
    var ct = 0;
    me.__transactions.forEach(function (trans) {
        trans.on__abort = function () {
            ct++;
            if (ct === me.__transactions.length) {
                (function () {
                    // Todo: unblock any pending `upgradeneeded` or `deleteDatabase` calls
                    var evt = (0, _Event.createEvent)('close');
                    setTimeout(function () {
                        me.dispatchEvent(evt);
                    });
                })();
            }
        };
        trans.__abortTransaction((0, _DOMException.createDOMException)('AbortError', 'The connection was force-closed: ' + (msg || '')));
    });
};

IDBDatabase.prototype.toString = function () {
    return '[object IDBDatabase]';
};

util.defineReadonlyProperties(IDBDatabase.prototype, ['name', 'version', 'objectStoreNames']);

Object.assign(IDBDatabase.prototype, _eventtarget2.default.prototype);

exports.default = IDBDatabase;
module.exports = exports['default'];

},{"./CFG.js":381,"./DOMException.js":382,"./Event.js":383,"./IDBObjectStore.js":389,"./IDBTransaction.js":391,"./Sca.js":393,"./util.js":399,"eventtarget":300}],386:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.shimIndexedDB = exports.cmp = exports.IDBFactory = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _Event = require('./Event.js');

var _DOMException = require('./DOMException.js');

var _IDBRequest = require('./IDBRequest.js');

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

var _IDBDatabase = require('./IDBDatabase.js');

var _IDBDatabase2 = _interopRequireDefault(_IDBDatabase);

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var sysdb = void 0;

/**
 * Craetes the sysDB to keep track of version numbers for databases
 **/
function createSysDB(success, failure) {
    function sysDbCreateError(tx, err) {
        err = (0, _DOMException.webSQLErrback)(err);
        _CFG2.default.DEBUG && console.log('Error in sysdb transaction - when creating dbVersions', err);
        failure(err);
    }

    if (sysdb) {
        success();
    } else {
        sysdb = _CFG2.default.win.openDatabase('__sysdb__.sqlite', 1, 'System Database', _CFG2.default.DEFAULT_DB_SIZE);
        sysdb.transaction(function (systx) {
            systx.executeSql('CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);', [], success, sysDbCreateError);
        }, sysDbCreateError);
    }
}

/**
 * IDBFactory Class
 * https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
 * @constructor
 */
function IDBFactory() {
    this.modules = { DOMException: _DOMException.DOMException, Event: typeof Event !== 'undefined' ? Event : _Event.ShimEvent, ShimEvent: _Event.ShimEvent, IDBFactory: IDBFactory };
    this.utils = { createDOMException: _DOMException.createDOMException }; // Expose for ease in simulating such exception during testing
    this.__connections = [];
}

/**
 * The IndexedDB Method to create a new database and return the DB
 * @param {string} name
 * @param {number} version
 */
IDBFactory.prototype.open = function (name, version) {
    var me = this;
    var req = new _IDBRequest.IDBOpenDBRequest();
    var calledDbCreateError = false;

    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    }
    if (arguments.length >= 2) {
        version = Number(version);
        if (isNaN(version) || !isFinite(version) || version >= 0x20000000000000 || // 2 ** 53
        version < 1) {
            // The spec only mentions version==0 as throwing, but W3C tests fail with these
            throw new TypeError('Invalid database version: ' + version);
        }
    }
    name = String(name); // cast to a string
    var sqlSafeName = util.escapeNUL(name);
    var escapedDatabaseName = void 0;
    try {
        escapedDatabaseName = util.escapeDatabaseName(name);
    } catch (err) {
        throw err; // new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
    }

    function dbCreateError(tx, err) {
        if (calledDbCreateError) {
            return;
        }
        err = err ? (0, _DOMException.webSQLErrback)(err) : tx;
        calledDbCreateError = true;
        var evt = (0, _Event.createEvent)('error', err, { bubbles: true });
        req.__readyState = 'done';
        req.__error = err;
        req.__result = undefined;
        req.dispatchEvent(evt);
    }

    function openDB(oldVersion) {
        var db = _CFG2.default.win.openDatabase(escapedDatabaseName, 1, name, _CFG2.default.DEFAULT_DB_SIZE);
        req.__readyState = 'done';
        if (version === undefined) {
            version = oldVersion || 1;
        }
        if (oldVersion > version) {
            var err = (0, _DOMException.createDOMException)('VersionError', 'An attempt was made to open a database using a lower version than the existing version.', version);
            dbCreateError(err);
            return;
        }

        db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexList BLOB, currNum INTEGER)', [], function () {
                tx.executeSql('SELECT "name", "keyPath", "autoInc", "indexList", "currNum" FROM __sys__', [], function (tx, data) {
                    req.__result = new _IDBDatabase2.default(db, name, oldVersion, version, data);
                    me.__connections.push(req.result);
                    if (oldVersion < version) {
                        (function () {
                            // DB Upgrade in progress
                            var sysdbFinishedCb = function sysdbFinishedCb(systx, err, cb) {
                                if (err) {
                                    try {
                                        systx.executeSql('ROLLBACK', [], cb, cb);
                                        return;
                                    } catch (err) {
                                        // Browser may fail with expired transaction above so
                                        // no choice but to manually revert
                                        sysdb.transaction(function (systx) {
                                            function reportError() {
                                                throw new Error('Unable to roll back upgrade transaction!');
                                            }
                                            // Attempt to revert
                                            if (oldVersion === 0) {
                                                systx.executeSql('DELETE FROM dbVersions WHERE name = ?', [sqlSafeName], cb, reportError);
                                            } else {
                                                systx.executeSql('UPDATE dbVersions SET version = ? WHERE name = ?', [oldVersion, sqlSafeName], cb, reportError);
                                            }
                                        });
                                        return;
                                    }
                                }
                                cb(); // In browser, should auto-commit
                            };
                            sysdb.transaction(function (systx) {
                                function versionSet() {
                                    var e = new _Event.IDBVersionChangeEvent('upgradeneeded', { oldVersion: oldVersion, newVersion: version });
                                    req.__transaction = req.result.__versionTransaction = new _IDBTransaction2.default(req.result, req.result.objectStoreNames, 'versionchange');
                                    req.transaction.__addNonRequestToTransactionQueue(function onupgradeneeded(tx, args, finished, error) {
                                        req.dispatchEvent(e);
                                        finished();
                                    });
                                    req.transaction.on__beforecomplete = function (ev) {
                                        req.result.__versionTransaction = null;
                                        if (req.result.__closed) {
                                            req.transaction.__transFinishedCb(true, function () {
                                                sysdbFinishedCb(systx, true, function () {
                                                    req.__transaction = null;
                                                    var err = (0, _DOMException.createDOMException)('AbortError', 'The connection has been closed.');
                                                    dbCreateError(err);
                                                });
                                            });
                                            throw new Error('Discontinue complete');
                                        }
                                        sysdbFinishedCb(systx, false, function () {
                                            req.transaction.__transFinishedCb(false, function () {
                                                ev.complete();
                                                req.__transaction = null;
                                            });
                                        });
                                    };
                                    req.transaction.on__abort = function () {
                                        req.__transaction = null;
                                        setTimeout(function () {
                                            var err = (0, _DOMException.createDOMException)('AbortError', 'The upgrade transaction was aborted.');
                                            sysdbFinishedCb(systx, err, function () {
                                                dbCreateError(err);
                                            });
                                        });
                                    };
                                    req.transaction.on__complete = function () {
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
                                        req.__transaction = null;
                                        var e = (0, _Event.createEvent)('success');
                                        req.dispatchEvent(e);
                                        // });
                                    };
                                }
                                if (oldVersion === 0) {
                                    systx.executeSql('INSERT INTO dbVersions VALUES (?,?)', [sqlSafeName, version], versionSet, dbCreateError);
                                } else {
                                    systx.executeSql('UPDATE dbVersions SET version = ? WHERE name = ?', [version, sqlSafeName], versionSet, dbCreateError);
                                }
                            }, dbCreateError, null, function (currentTask, err, done, rollback, commit) {
                                if (currentTask.readOnly || err) {
                                    return true;
                                }
                                sysdbFinishedCb = function sysdbFinishedCb(systx, err, cb) {
                                    if (err) {
                                        rollback(err, cb);
                                    } else {
                                        commit(cb);
                                    }
                                };
                                return false;
                            });
                        })();
                    } else {
                        var e = (0, _Event.createEvent)('success');
                        req.dispatchEvent(e);
                    }
                }, dbCreateError);
            }, dbCreateError);
        }, dbCreateError);
    }

    createSysDB(function () {
        sysdb.readTransaction(function (sysReadTx) {
            sysReadTx.executeSql('SELECT "version" FROM dbVersions WHERE name = ?', [sqlSafeName], function (sysReadTx, data) {
                if (data.rows.length === 0) {
                    // Database with this name does not exist
                    openDB(0);
                } else {
                    openDB(data.rows.item(0).version);
                }
            }, dbCreateError);
        }, dbCreateError);
    }, dbCreateError);

    return req;
};

/**
 * Deletes a database
 * @param {string} name
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.deleteDatabase = function (name) {
    var req = new _IDBRequest.IDBOpenDBRequest();
    var calledDBError = false;
    var version = 0;

    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    }
    name = String(name); // cast to a string
    var sqlSafeName = util.escapeNUL(name);

    var escapedDatabaseName = void 0;
    try {
        escapedDatabaseName = util.escapeDatabaseName(name);
    } catch (err) {
        throw err; // throw new TypeError('You have supplied a database name which does not match the currently supported configuration, possibly due to a length limit enforced for Node compatibility.');
    }

    var sysdbFinishedCbDelete = function sysdbFinishedCbDelete(err, cb) {
        cb(err);
    };

    // Although the spec has no specific conditions where an error
    //  may occur in `deleteDatabase`, it does provide for
    //  `UnknownError` as we may require upon a SQL deletion error
    function dbError(err) {
        if (calledDBError || err === true) {
            return;
        }
        sysdbFinishedCbDelete(true, function () {
            err = (0, _DOMException.webSQLErrback)(err || {});
            req.__readyState = 'done';
            req.__error = err;
            req.__result = undefined;
            var e = (0, _Event.createEvent)('error', err, { bubbles: true });
            req.dispatchEvent(e);
            calledDBError = true;
        });
    }

    createSysDB(function () {
        function databaseDeleted() {
            sysdbFinishedCbDelete(false, function () {
                req.__result = undefined;
                req.__readyState = 'done';
                var e = new _Event.IDBVersionChangeEvent('success', { oldVersion: version, newVersion: null });
                req.dispatchEvent(e);
            });
        }
        sysdb.readTransaction(function (sysReadTx) {
            sysReadTx.executeSql('SELECT "version" FROM dbVersions WHERE name = ?', [sqlSafeName], function (sysReadTx, data) {
                if (data.rows.length === 0) {
                    req.__result = undefined;
                    var e = new _Event.IDBVersionChangeEvent('success', { oldVersion: version, newVersion: null });
                    req.dispatchEvent(e);
                    return;
                }
                version = data.rows.item(0).version;

                // Since we need two databases which can't be in a single transaction, we
                //  do this deleting from `dbVersions` first since the `__sys__` deleting
                //  only impacts file memory whereas this one is critical for avoiding it
                //  being found via `open` or `webkitGetDatabaseNames`; however, we will
                //  avoid committing anyways until all deletions are made and rollback the
                //  `dbVersions` change if they fail
                sysdb.transaction(function (systx) {
                    systx.executeSql('DELETE FROM dbVersions WHERE name = ? ', [sqlSafeName], function () {
                        // Todo: Give config option to Node to delete the entire database file
                        var db = _CFG2.default.win.openDatabase(escapedDatabaseName, 1, name, _CFG2.default.DEFAULT_DB_SIZE);
                        db.transaction(function (tx) {
                            tx.executeSql('SELECT "name" FROM __sys__', [], function (tx, data) {
                                var tables = data.rows;
                                (function deleteTables(i) {
                                    if (i >= tables.length) {
                                        // If all tables are deleted, delete the housekeeping tables
                                        tx.executeSql('DROP TABLE IF EXISTS __sys__', [], function () {
                                            databaseDeleted();
                                        }, dbError);
                                    } else {
                                        // Delete all tables in this database, maintained in the sys table
                                        tx.executeSql('DROP TABLE ' + util.escapeStore(util.unescapeNUL( // Avoid double-escaping
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
                    }, dbError);
                }, dbError, null, function (currentTask, err, done, rollback, commit) {
                    if (currentTask.readOnly || err) {
                        return true;
                    }
                    sysdbFinishedCbDelete = function sysdbFinishedCbDelete(err, cb) {
                        if (err) {
                            rollback(err, cb);
                        } else {
                            commit(cb);
                        }
                    };
                    return false;
                });
            }, dbError);
        }, dbError);
    }, dbError);

    return req;
};

/**
 * Compares two keys
 * @param key1
 * @param key2
 * @returns {number}
 */
function cmp(key1, key2) {
    if (arguments.length < 2) {
        throw new TypeError('You must provide two keys to be compared');
    }

    _Key2.default.convertValueToKey(key1);
    _Key2.default.convertValueToKey(key2);
    var encodedKey1 = _Key2.default.encode(key1);
    var encodedKey2 = _Key2.default.encode(key2);
    var result = encodedKey1 > encodedKey2 ? 1 : encodedKey1 === encodedKey2 ? 0 : -1;

    if (_CFG2.default.DEBUG) {
        // verify that the keys encoded correctly
        var decodedKey1 = _Key2.default.decode(encodedKey1);
        var decodedKey2 = _Key2.default.decode(encodedKey2);
        if ((typeof key1 === 'undefined' ? 'undefined' : _typeof(key1)) === 'object') {
            key1 = JSON.stringify(key1);
            decodedKey1 = JSON.stringify(decodedKey1);
        }
        if ((typeof key2 === 'undefined' ? 'undefined' : _typeof(key2)) === 'object') {
            key2 = JSON.stringify(key2);
            decodedKey2 = JSON.stringify(decodedKey2);
        }

        // encoding/decoding mismatches are usually due to a loss of floating-point precision
        if (decodedKey1 !== key1) {
            console.warn(key1 + ' was incorrectly encoded as ' + decodedKey1);
        }
        if (decodedKey2 !== key2) {
            console.warn(key2 + ' was incorrectly encoded as ' + decodedKey2);
        }
    }

    return result;
}

IDBFactory.prototype.cmp = cmp;

/**
* NON-STANDARD!! (Also may return outdated information if a database has since been deleted)
* @link https://www.w3.org/Bugs/Public/show_bug.cgi?id=16137
* @link http://lists.w3.org/Archives/Public/public-webapps/2011JulSep/1537.html
*/
IDBFactory.prototype.webkitGetDatabaseNames = function () {
    var calledDbCreateError = false;
    function dbGetDatabaseNamesError(tx, err) {
        if (calledDbCreateError) {
            return;
        }
        err = err ? (0, _DOMException.webSQLErrback)(err) : tx;
        calledDbCreateError = true;
        var evt = (0, _Event.createEvent)('error', err, { bubbles: true, cancelable: true }); // http://stackoverflow.com/questions/40165909/to-where-do-idbopendbrequest-error-events-bubble-up/40181108#40181108
        req.__readyState = 'done';
        req.__error = err;
        req.__result = undefined;
        req.dispatchEvent(evt);
    }
    var req = new _IDBRequest.IDBRequest();
    createSysDB(function () {
        sysdb.readTransaction(function (sysReadTx) {
            sysReadTx.executeSql('SELECT "name" FROM dbVersions', [], function (sysReadTx, data) {
                var dbNames = new util.StringList();
                for (var i = 0; i < data.rows.length; i++) {
                    dbNames.push(util.unescapeNUL(data.rows.item(i).name));
                }
                req.__result = dbNames;
                req.__readyState = 'done';
                var e = (0, _Event.createEvent)('success'); // http://stackoverflow.com/questions/40165909/to-where-do-idbopendbrequest-error-events-bubble-up/40181108#40181108
                req.dispatchEvent(e);
            }, dbGetDatabaseNamesError);
        }, dbGetDatabaseNamesError);
    }, dbGetDatabaseNamesError);
    return req;
};

/**
* @Todo: Test
* This is provided to facilitate unit-testing of the
*  closing of a database connection with a forced flag:
* <http://w3c.github.io/IndexedDB/#steps-for-closing-a-database-connection>
*/
IDBFactory.prototype.__forceClose = function (connIdx, msg) {
    var me = this;
    function forceClose(conn) {
        conn.__forceClose(msg);
    }
    if (connIdx == null) {
        me.__connections.forEach(forceClose);
    } else if (!Number.isInteger(connIdx) || connIdx < 0 || connIdx > me.__connections.length - 1) {
        throw new TypeError('If providing an argument, __forceClose must be called with a ' + 'numeric index to indicate a specific connection to lose');
    } else {
        forceClose(me.__connections[connIdx]);
    }
};

IDBFactory.prototype.toString = function () {
    return '[object IDBFactory]';
};

var shimIndexedDB = new IDBFactory();
exports.IDBFactory = IDBFactory;
exports.cmp = cmp;
exports.shimIndexedDB = shimIndexedDB;

},{"./CFG.js":381,"./DOMException.js":382,"./Event.js":383,"./IDBDatabase.js":385,"./IDBRequest.js":390,"./IDBTransaction.js":391,"./Key.js":392,"./util.js":399}],387:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = exports.IDBIndex = exports.executeFetchIndexData = exports.fetchIndexData = undefined;

var _DOMException = require('./DOMException.js');

var _IDBCursor = require('./IDBCursor.js');

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

var _IDBKeyRange = require('./IDBKeyRange.js');

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

var _Sca = require('./Sca.js');

var _Sca2 = _interopRequireDefault(_Sca);

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * IDB Index
 * http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
 * @param {IDBObjectStore} store
 * @param {IDBIndexProperties} indexProperties
 * @constructor
 */
function IDBIndex(store, indexProperties) {
    var me = this;
    me.__objectStore = store;
    me.__name = me.__originalName = indexProperties.columnName;
    me.__keyPath = Array.isArray(indexProperties.keyPath) ? indexProperties.keyPath.slice() : indexProperties.keyPath;
    var optionalParams = indexProperties.optionalParams;
    me.__multiEntry = !!(optionalParams && optionalParams.multiEntry);
    me.__unique = !!(optionalParams && optionalParams.unique);
    me.__deleted = !!indexProperties.__deleted;
    me.__objectStore.__cursors = indexProperties.cursors || [];
}

/**
 * Clones an IDBIndex instance for a different IDBObjectStore instance.
 * @param {IDBIndex} index
 * @param {IDBObjectStore} store
 * @protected
 */
IDBIndex.__clone = function (index, store) {
    var idx = new IDBIndex(store, {
        columnName: index.name,
        keyPath: index.keyPath,
        optionalParams: {
            multiEntry: index.multiEntry,
            unique: index.unique
        }
    });
    // idx.__deleted = index.__deleted;
    return idx;
};

/**
 * Creates a new index on an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @returns {IDBIndex}
 * @protected
 */
IDBIndex.__createIndex = function (store, index) {
    var idx = store.__indexes[index.name];
    var columnExists = idx && idx.__deleted;

    // Add the index to the IDBObjectStore
    index.__pending = true;
    store.__indexes[index.name] = index;
    store.indexNames.push(index.name);

    // Create the index in WebSQL
    var transaction = store.transaction;
    transaction.__addNonRequestToTransactionQueue(function createIndex(tx, args, success, failure) {
        var indexValues = {};

        function error(tx, err) {
            failure((0, _DOMException.createDOMException)('UnknownError', 'Could not create index "' + index.name + '"', err));
        }

        function applyIndex(tx) {
            // Update the object store's index list
            IDBIndex.__updateIndexList(store, tx, function () {
                // Add index entries for all existing records
                tx.executeSql('SELECT "key", "value" FROM ' + util.escapeStore(store.name), [], function (tx, data) {
                    _CFG2.default.DEBUG && console.log('Adding existing ' + store.name + ' records to the ' + index.name + ' index');
                    addIndexEntry(0);

                    function addIndexEntry(i) {
                        if (i < data.rows.length) {
                            try {
                                var value = _Sca2.default.decode(util.unescapeNUL(data.rows.item(i).value));
                                var indexKey = _Key2.default.evaluateKeyPathOnValue(value, index.keyPath, index.multiEntry);
                                indexKey = _Key2.default.encode(indexKey, index.multiEntry);
                                if (index.unique) {
                                    if (indexValues[indexKey]) {
                                        indexValues = {};
                                        failure((0, _DOMException.createDOMException)('ConstraintError', 'Duplicate values already exist within the store'));
                                        return;
                                    }
                                    indexValues[indexKey] = true;
                                }

                                tx.executeSql('UPDATE ' + util.escapeStore(store.name) + ' SET ' + util.escapeIndex(index.name) + ' = ? WHERE key = ?', [util.escapeNUL(indexKey), data.rows.item(i).key], function (tx, data) {
                                    addIndexEntry(i + 1);
                                }, error);
                            } catch (e) {
                                // Not a valid value to insert into index, so just continue
                                addIndexEntry(i + 1);
                            }
                        } else {
                            delete index.__pending;
                            indexValues = {};
                            success(store);
                        }
                    }
                }, error);
            }, error);
        }

        if (columnExists) {
            // For a previously existing index, just update the index entries in the existing column
            applyIndex(tx);
        } else {
            // For a new index, add a new column to the object store, then apply the index
            var sql = ['ALTER TABLE', util.escapeStore(store.name), 'ADD', util.escapeIndex(index.name), 'BLOB'].join(' ');
            _CFG2.default.DEBUG && console.log(sql);
            tx.executeSql(sql, [], applyIndex, error);
        }
    }, undefined, store);
};

/**
 * Deletes an index from an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @protected
 */
IDBIndex.__deleteIndex = function (store, index) {
    // Remove the index from the IDBObjectStore
    store.__indexes[index.name].__deleted = true;
    store.indexNames.splice(store.indexNames.indexOf(index.name), 1);

    // Remove the index in WebSQL
    var transaction = store.transaction;
    transaction.__addNonRequestToTransactionQueue(function deleteIndex(tx, args, success, failure) {
        function error(tx, err) {
            failure((0, _DOMException.createDOMException)('UnknownError', 'Could not delete index "' + index.name + '"', err));
        }

        // Update the object store's index list
        IDBIndex.__updateIndexList(store, tx, success, error);
    }, undefined, store);
};

/**
 * Updates index list for the given object store.
 * @param {IDBObjectStore} store
 * @param {object} tx
 * @param {function} success
 * @param {function} failure
 */
IDBIndex.__updateIndexList = function (store, tx, success, failure) {
    var indexList = {};
    for (var i = 0; i < store.indexNames.length; i++) {
        var idx = store.__indexes[store.indexNames[i]];
        /** @type {IDBIndexProperties} **/
        indexList[idx.name] = {
            columnName: idx.name,
            keyPath: idx.keyPath,
            optionalParams: {
                unique: idx.unique,
                multiEntry: idx.multiEntry
            },
            deleted: !!idx.deleted
        };
    }

    _CFG2.default.DEBUG && console.log('Updating the index list for ' + store.name, indexList);
    tx.executeSql('UPDATE __sys__ SET indexList = ? WHERE name = ?', [JSON.stringify(indexList), util.escapeNUL(store.name)], function () {
        success(store);
    }, failure);
};

/**
 * Retrieves index data for the given key
 * @param {*|IDBKeyRange} range
 * @param {string} opType
 * @param {boolean} nullDisallowed
 * @param {number} count
 * @returns {IDBRequest}
 * @private
 */
IDBIndex.prototype.__fetchIndexData = function (range, opType, nullDisallowed, count) {
    var me = this;
    var hasUnboundedRange = !nullDisallowed && range == null;

    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This index has been deleted');
    }
    if (me.objectStore.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', "This index's object store has been deleted");
    }
    _IDBTransaction2.default.__assertActive(me.objectStore.transaction);

    if (nullDisallowed && range == null) {
        throw (0, _DOMException.createDOMException)('DataError', 'No key or range was specified');
    }

    var fetchArgs = fetchIndexData(me, !hasUnboundedRange, range, opType, false);
    return me.objectStore.transaction.__addToTransactionQueue(function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        executeFetchIndexData.apply(undefined, [nullDisallowed, count].concat(_toConsumableArray(fetchArgs), args));
    }, undefined, me);
};

/**
 * Opens a cursor over the given key range.
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openCursor = function (range, direction) {
    var me = this;
    var cursor = new _IDBCursor.IDBCursorWithValue(range, direction, me.objectStore, me, util.escapeIndexName(me.name), 'value');
    me.__objectStore.__cursors.push(cursor);
    return cursor.__req;
};

/**
 * Opens a cursor over the given key range.  The cursor only includes key values, not data.
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openKeyCursor = function (range, direction) {
    var me = this;
    var cursor = new _IDBCursor.IDBCursor(range, direction, me.objectStore, me, util.escapeIndexName(me.name), 'key');
    me.__objectStore.__cursors.push(cursor);
    return cursor.__req;
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

IDBIndex.prototype.getAll = function (query, count) {
    return this.__fetchIndexData(query, 'value', false, count);
};

IDBIndex.prototype.getAllKeys = function (query, count) {
    return this.__fetchIndexData(query, 'key', false, count);
};

IDBIndex.prototype.count = function (query) {
    var me = this;
    // With the exception of needing to check whether the index has been
    //  deleted, we could, for greater spec parity (if not accuracy),
    //  just call:
    //  `return me.__objectStore.count(query);`

    // key is optional
    if (util.instanceOf(query, _IDBKeyRange.IDBKeyRange)) {
        if (!query.toString() !== '[object IDBKeyRange]') {
            query = new _IDBKeyRange.IDBKeyRange(query.lower, query.upper, query.lowerOpen, query.upperOpen);
        }
        // We don't need to add to cursors array since has the count parameter which won't cache
        return new _IDBCursor.IDBCursorWithValue(query, 'next', me.objectStore, me, util.escapeIndexName(me.name), 'value', true).__req;
    }
    return me.__fetchIndexData(query, 'count', false);
};

IDBIndex.prototype.__renameIndex = function (store, oldName, newName) {
    var colInfoToPreserveArr = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : [];

    var newNameType = 'BLOB';
    var storeName = store.name;
    var escapedStoreName = util.escapeStore(storeName);
    var colNamesToPreserve = colInfoToPreserveArr.map(function (colInfo) {
        return colInfo[0];
    });
    var colInfoToPreserve = colInfoToPreserveArr.map(function (colInfo) {
        return colInfo.join(' ');
    });
    var listColInfoToPreserve = colInfoToPreserve.length ? colInfoToPreserve.join(', ') + ', ' : '';
    var listColsToPreserve = colNamesToPreserve.length ? colNamesToPreserve.join(', ') + ', ' : '';

    // We could adapt the approach at http://stackoverflow.com/a/8430746/271577
    //    to make the approach reusable without passing column names, but it is a bit fragile
    store.transaction.__addNonRequestToTransactionQueue(function renameIndex(tx, args, success, error) {
        var sql = 'ALTER TABLE ' + escapedStoreName + ' RENAME TO tmp_' + escapedStoreName;
        tx.executeSql(sql, [], function (tx, data) {
            var sql = 'CREATE TABLE ' + escapedStoreName + '(' + listColInfoToPreserve + util.escapeIndex(newName) + ' ' + newNameType + ')';
            tx.executeSql(sql, [], function (tx, data) {
                var sql = 'INSERT INTO ' + escapedStoreName + '(' + listColsToPreserve + util.escapeIndex(newName) + ') SELECT ' + listColsToPreserve + util.escapeIndex(oldName) + ' FROM tmp_' + escapedStoreName;
                tx.executeSql(sql, [], function (tx, data) {
                    var sql = 'DROP TABLE tmp_' + escapedStoreName;
                    tx.executeSql(sql, [], function (tx, data) {
                        success();
                    }, function (tx, err) {
                        error(err);
                    });
                }, function (tx, err) {
                    error(err);
                });
            });
        }, function (tx, err) {
            error(err);
        });
    });
};

IDBIndex.prototype.toString = function () {
    return '[object IDBIndex]';
};

util.defineReadonlyProperties(IDBIndex.prototype, ['objectStore', 'keyPath', 'multiEntry', 'unique']);

Object.defineProperty(IDBIndex, Symbol.hasInstance, {
    value: function value(obj) {
        return util.isObj(obj) && typeof obj.openCursor === 'function' && typeof obj.multiEntry === 'boolean';
    }
});

Object.defineProperty(IDBIndex.prototype, 'name', {
    enumerable: false,
    configurable: false,
    get: function get() {
        return this.__name;
    },
    set: function set(newName) {
        var me = this;
        var oldName = me.name;
        _IDBTransaction2.default.__assertVersionChange(me.objectStore.transaction);
        _IDBTransaction2.default.__assertActive(me.objectStore.transaction);
        if (me.__deleted) {
            throw (0, _DOMException.createDOMException)('InvalidStateError', 'This index has been deleted');
        }
        if (me.objectStore.__deleted) {
            throw (0, _DOMException.createDOMException)('InvalidStateError', "This index's object store has been deleted");
        }
        if (newName === oldName) {
            return;
        }
        if (me.objectStore.__indexes[newName] && !me.objectStore.__indexes[newName].__deleted) {
            throw (0, _DOMException.createDOMException)('ConstraintError', 'Index "' + newName + '" already exists on ' + me.objectStore.name);
        }

        delete me.objectStore.__indexes[me.name];
        me.objectStore.indexNames.splice(me.objectStore.indexNames.indexOf(me.name), 1);
        me.objectStore.__indexes[newName] = me;
        me.objectStore.indexNames.push(newName);

        me.__name = newName;
        // Todo: Add pending flag to delay queries against this index until renamed in SQLite?
        var colInfoToPreserveArr = [['key', 'BLOB ' + (me.objectStore.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY')], ['value', 'BLOB']];
        me.__renameIndex(me.objectStore, oldName, newName, colInfoToPreserveArr);
    }
});

function executeFetchIndexData(unboundedDisallowed, count, index, hasKey, encodedKey, opType, multiChecks, sql, sqlValues, tx, args, success, error) {
    if (unboundedDisallowed) {
        count = 1;
    }
    if (count) {
        sql.push('LIMIT', count);
    }
    _CFG2.default.DEBUG && console.log('Trying to fetch data for Index', sql.join(' '), sqlValues);
    tx.executeSql(sql.join(' '), sqlValues, function (tx, data) {
        var records = [];
        var recordCount = 0;
        var record = null;
        var decode = opType === 'count' ? function () {} : opType === 'key' ? function (record) {
            // Key.convertValueToKey(record.key); // Already validated before storage
            return _Key2.default.decode(util.unescapeNUL(record.key));
        } : function (record) {
            // when opType is value
            return _Sca2.default.decode(util.unescapeNUL(record.value));
        };
        if (index.multiEntry) {
            var escapedIndexName = util.escapeIndexName(index.name);

            var _loop = function _loop(i) {
                var row = data.rows.item(i);
                var rowKey = _Key2.default.decode(row[escapedIndexName]);
                if (hasKey && (multiChecks && encodedKey.some(function (check) {
                    return rowKey.includes(check);
                }) || // More precise than our SQL
                _Key2.default.isMultiEntryMatch(encodedKey, row[escapedIndexName]))) {
                    recordCount++;
                    record = record || row;
                } else if (!hasKey && !multiChecks) {
                    if (rowKey !== undefined) {
                        recordCount += Array.isArray(rowKey) ? rowKey.length : 1;
                        record = record || row;
                    }
                }
                if (record) {
                    records.push(decode(record));
                }
            };

            for (var i = 0; i < data.rows.length; i++) {
                _loop(i);
            }
        } else {
            for (var _i = 0; _i < data.rows.length; _i++) {
                record = data.rows.item(_i);
                if (record) {
                    records.push(decode(record));
                }
            }
            recordCount = records.length;
        }
        if (opType === 'count') {
            success(recordCount);
        } else if (recordCount === 0) {
            success(undefined);
        } else if (unboundedDisallowed) {
            success(records[0]);
        } else {
            success(records);
        }
    }, error);
}

function fetchIndexData(index, hasRange, range, opType, multiChecks) {
    var col = opType === 'count' ? 'key' : opType; // It doesn't matter which column we use for 'count' as long as it is valid
    var sql = ['SELECT ' + util.quote(col) + (index.multiEntry ? ', ' + util.escapeIndex(index.name) : '') + ' FROM', util.escapeStore(index.objectStore.name), 'WHERE', util.escapeIndex(index.name), 'NOT NULL'];
    var sqlValues = [];
    if (hasRange) {
        if (multiChecks) {
            sql.push('AND (');
            range.forEach(function (innerKey, i) {
                if (i > 0) sql.push('OR');
                sql.push(util.escapeIndex(index.name), "LIKE ? ESCAPE '^' ");
                sqlValues.push('%' + util.sqlLIKEEscape(_Key2.default.encode(innerKey, index.multiEntry)) + '%');
            });
            sql.push(')');
        } else if (index.multiEntry) {
            sql.push('AND', util.escapeIndex(index.name), "LIKE ? ESCAPE '^'");
            range = _Key2.default.encode(range, index.multiEntry);
            sqlValues.push('%' + util.sqlLIKEEscape(range) + '%');
        } else {
            if (util.instanceOf(range, _IDBKeyRange.IDBKeyRange)) {
                // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
                if (!range.toString() !== '[object IDBKeyRange]') {
                    range = new _IDBKeyRange.IDBKeyRange(range.lower, range.upper, range.lowerOpen, range.upperOpen);
                }
            } else {
                range = _IDBKeyRange.IDBKeyRange.only(range);
            }
            (0, _IDBKeyRange.setSQLForRange)(range, util.escapeIndex(index.name), sql, sqlValues, true, false);
        }
    }
    return [index, hasRange, range, opType, multiChecks, sql, sqlValues];
}

exports.fetchIndexData = fetchIndexData;
exports.executeFetchIndexData = executeFetchIndexData;
exports.IDBIndex = IDBIndex;
exports.default = IDBIndex;

},{"./CFG.js":381,"./DOMException.js":382,"./IDBCursor.js":384,"./IDBKeyRange.js":388,"./IDBTransaction.js":391,"./Key.js":392,"./Sca.js":393,"./util.js":399}],388:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = exports.IDBKeyRange = exports.setSQLForRange = undefined;

var _DOMException = require('./DOMException.js');

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The IndexedDB KeyRange object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
 * @param {Object} lower
 * @param {Object} upper
 * @param {Object} lowerOpen
 * @param {Object} upperOpen
 */
function IDBKeyRange(lower, upper, lowerOpen, upperOpen) {
    if (lower === undefined && upper === undefined) {
        throw new TypeError('Both arguments to the key range method cannot be undefined');
    }
    if (lower !== undefined) {
        _Key2.default.convertValueToKey(lower);
    }
    if (upper !== undefined) {
        _Key2.default.convertValueToKey(upper);
    }
    if (lower !== undefined && upper !== undefined && lower !== upper) {
        if (_Key2.default.encode(lower) > _Key2.default.encode(upper)) {
            throw (0, _DOMException.createDOMException)('DataError', '`lower` must not be greater than `upper` argument in `bound()` call.');
        }
    }

    this.__lower = lower;
    this.__upper = upper;
    this.__lowerOpen = !!lowerOpen;
    this.__upperOpen = !!upperOpen;
}
IDBKeyRange.prototype.includes = function (key) {
    _Key2.default.convertValueToKey(key);
    return _Key2.default.isKeyInRange(key, this);
};

IDBKeyRange.only = function (value) {
    return new IDBKeyRange(value, value, false, false);
};

IDBKeyRange.lowerBound = function (value, open) {
    return new IDBKeyRange(value, undefined, open, true);
};
IDBKeyRange.upperBound = function (value, open) {
    return new IDBKeyRange(undefined, value, true, open);
};
IDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
    return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
};
IDBKeyRange.prototype.toString = function () {
    return '[object IDBKeyRange]';
};

util.defineReadonlyProperties(IDBKeyRange.prototype, ['lower', 'upper', 'lowerOpen', 'upperOpen']);

Object.defineProperty(IDBKeyRange, Symbol.hasInstance, {
    value: function value(obj) {
        return util.isObj(obj) && 'upper' in obj && typeof obj.lowerOpen === 'boolean';
    }
});

function setSQLForRange(range, quotedKeyColumnName, sql, sqlValues, addAnd, checkCached) {
    if (range && (range.lower !== undefined || range.upper !== undefined)) {
        if (addAnd) sql.push('AND');
        if (range.lower !== undefined) {
            sql.push(quotedKeyColumnName, range.lowerOpen ? '>' : '>=', '?');
            sqlValues.push(util.escapeNUL(checkCached ? range.__lowerCached : _Key2.default.encode(range.lower)));
        }
        range.lower !== undefined && range.upper !== undefined && sql.push('AND');
        if (range.upper !== undefined) {
            sql.push(quotedKeyColumnName, range.upperOpen ? '<' : '<=', '?');
            sqlValues.push(util.escapeNUL(checkCached ? range.__upperCached : _Key2.default.encode(range.upper)));
        }
    }
}

exports.setSQLForRange = setSQLForRange;
exports.IDBKeyRange = IDBKeyRange;
exports.default = IDBKeyRange;

},{"./DOMException.js":382,"./Key.js":392,"./util.js":399}],389:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _DOMException = require('./DOMException.js');

var _IDBCursor = require('./IDBCursor.js');

var _IDBKeyRange = require('./IDBKeyRange.js');

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

var _IDBIndex = require('./IDBIndex.js');

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

var _Sca = require('./Sca.js');

var _Sca2 = _interopRequireDefault(_Sca);

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

var _syncPromise = require('sync-promise');

var _syncPromise2 = _interopRequireDefault(_syncPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * IndexedDB Object Store
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
 * @param {IDBObjectStoreProperties} storeProperties
 * @param {IDBTransaction} transaction
 * @constructor
 */
function IDBObjectStore(storeProperties, transaction) {
    var me = this;
    me.__name = me.__originalName = storeProperties.name;
    me.__keyPath = Array.isArray(storeProperties.keyPath) ? storeProperties.keyPath.slice() : storeProperties.keyPath;
    me.__transaction = transaction;
    me.__idbdb = storeProperties.idbdb;
    me.__cursors = storeProperties.cursors || [];

    // autoInc is numeric (0/1) on WinPhone
    me.__autoIncrement = !!storeProperties.autoInc;

    me.__indexes = {};
    me.__indexNames = new util.StringList();
    var indexList = storeProperties.indexList;
    for (var indexName in indexList) {
        if (indexList.hasOwnProperty(indexName)) {
            var index = new _IDBIndex.IDBIndex(me, indexList[indexName]);
            me.__indexes[index.name] = index;
            if (!index.__deleted) {
                me.indexNames.push(index.name);
            }
        }
    }
    me.__oldIndexNames = me.indexNames.clone();
}

/**
 * Clones an IDBObjectStore instance for a different IDBTransaction instance.
 * @param {IDBObjectStore} store
 * @param {IDBTransaction} transaction
 * @protected
 */
IDBObjectStore.__clone = function (store, transaction) {
    var newStore = new IDBObjectStore({
        name: store.name,
        keyPath: Array.isArray(store.keyPath) ? store.keyPath.slice() : store.keyPath,
        autoInc: store.autoIncrement,
        indexList: {},
        idbdb: store.__idbdb,
        cursors: store.__cursors
    }, transaction);

    newStore.__indexes = store.__indexes;
    newStore.__indexNames = store.indexNames;
    newStore.__oldIndexNames = store.__oldIndexNames;
    return newStore;
};

/**
 * Creates a new object store in the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 */
IDBObjectStore.__createObjectStore = function (db, store) {
    // Add the object store to the IDBDatabase
    db.__objectStores[store.name] = store;
    db.objectStoreNames.push(store.name);

    // Add the object store to WebSQL
    var transaction = db.__versionTransaction;
    _IDBTransaction2.default.__assertVersionChange(transaction);

    transaction.__addNonRequestToTransactionQueue(function createObjectStore(tx, args, success, failure) {
        function error(tx, err) {
            _CFG2.default.DEBUG && console.log(err);
            failure((0, _DOMException.createDOMException)('UnknownError', 'Could not create object store "' + store.name + '"', err));
        }

        // key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
        var sql = ['CREATE TABLE', util.escapeStore(store.name), '(key BLOB', store.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY', ', value BLOB)'].join(' ');
        _CFG2.default.DEBUG && console.log(sql);
        tx.executeSql(sql, [], function (tx, data) {
            _Sca2.default.encode(store.keyPath, function (encodedKeyPath) {
                tx.executeSql('INSERT INTO __sys__ VALUES (?,?,?,?,?)', [util.escapeNUL(store.name), encodedKeyPath, store.autoIncrement, '{}', 1], function () {
                    success(store);
                }, error);
            });
        }, error);
    });
};

/**
 * Deletes an object store from the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 */
IDBObjectStore.__deleteObjectStore = function (db, store) {
    // Remove the object store from the IDBDatabase
    store.__deleted = true;
    db.__objectStores[store.name] = undefined;
    db.objectStoreNames.splice(db.objectStoreNames.indexOf(store.name), 1);

    var storeClone = db.__versionTransaction.__storeClones[store.name];
    if (storeClone) {
        storeClone.__indexNames = new util.StringList();
        storeClone.__indexes = {};
        storeClone.__deleted = true;
    }

    // Remove the object store from WebSQL
    var transaction = db.__versionTransaction;
    _IDBTransaction2.default.__assertVersionChange(transaction);

    transaction.__addNonRequestToTransactionQueue(function deleteObjectStore(tx, args, success, failure) {
        function error(tx, err) {
            _CFG2.default.DEBUG && console.log(err);
            failure((0, _DOMException.createDOMException)('UnknownError', 'Could not delete ObjectStore', err));
        }

        tx.executeSql('SELECT "name", "keyPath", "autoInc", "indexList", "currNum" FROM __sys__ WHERE name = ?', [util.escapeNUL(store.name)], function (tx, data) {
            if (data.rows.length > 0) {
                tx.executeSql('DROP TABLE ' + util.escapeStore(store.name), [], function () {
                    tx.executeSql('DELETE FROM __sys__ WHERE name = ?', [util.escapeNUL(store.name)], function () {
                        success();
                    }, error);
                }, error);
            }
        });
    });
};

/**
 * Determines whether the given inline or out-of-line key is valid, according to the object store's schema.
 * @param {*} value     Used for inline keys
 * @param {*} key       Used for out-of-line keys
 * @private
 */
IDBObjectStore.prototype.__validateKeyAndValue = function (value, key) {
    var me = this;
    if (me.keyPath !== null) {
        if (key !== undefined) {
            throw (0, _DOMException.createDOMException)('DataError', 'The object store uses in-line keys and the key parameter was provided', me);
        }
        util.throwIfNotClonable(value, 'The data to be stored could not be cloned by the internal structured cloning algorithm.');
        key = _Key2.default.evaluateKeyPathOnValue(value, me.keyPath);
        if (key === undefined) {
            if (me.autoIncrement) {
                // Todo: Check whether this next check is a problem coming from `IDBCursor.update()`
                if (!util.isObj(value)) {
                    // Although steps for storing will detect this, we want to throw synchronously for `add`/`put`
                    throw (0, _DOMException.createDOMException)('DataError', 'KeyPath was specified, but value was not an object');
                }
                // A key will be generated
                return undefined;
            }
            throw (0, _DOMException.createDOMException)('DataError', 'Could not evaluate a key from keyPath');
        }
        _Key2.default.convertValueToKey(key);
    } else {
        if (key === undefined) {
            if (me.autoIncrement) {
                // A key will be generated
                return undefined;
            }
            throw (0, _DOMException.createDOMException)('DataError', 'The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ', me);
        }
        _Key2.default.convertValueToKey(key);
        util.throwIfNotClonable(value, 'The data to be stored could not be cloned by the internal structured cloning algorithm.');
    }

    return key;
};

/**
 * From the store properties and object, extracts the value for the key in the object store
 * If the table has auto increment, get the current number (unless it has a keyPath leading to a
 *  valid but non-numeric or < 1 key)
 * @param {Object} tx
 * @param {Object} value
 * @param {Object} key
 * @param {function} success
 * @param {function} failure
 */
IDBObjectStore.prototype.__deriveKey = function (tx, value, key, success, failure) {
    var me = this;

    function getCurrentNumber(callback) {
        tx.executeSql('SELECT currNum FROM __sys__ WHERE name = ?', [util.escapeNUL(me.name)], function (tx, data) {
            if (data.rows.length !== 1) {
                callback(1);
            } else {
                callback(data.rows.item(0).currNum);
            }
        }, function (tx, error) {
            failure((0, _DOMException.createDOMException)('DataError', 'Could not get the auto increment value for key', error));
        });
    }

    // This variable determines against which key comparisons should be made
    //   when determining whether to update the current number
    var keyToCheck = key;
    var hasKeyPath = me.keyPath !== null;
    if (hasKeyPath) {
        keyToCheck = _Key2.default.evaluateKeyPathOnValue(value, me.keyPath);
    }
    // If auto-increment and no valid primaryKey found on the keyPath, get and set the new value, and use
    if (me.autoIncrement && keyToCheck === undefined) {
        getCurrentNumber(function (cn) {
            if (hasKeyPath) {
                try {
                    // Update the value with the new key
                    _Key2.default.setValue(value, me.keyPath, cn);
                } catch (e) {
                    failure((0, _DOMException.createDOMException)('DataError', 'Could not assign a generated value to the keyPath', e));
                }
            }
            success(cn);
        });
        // If auto-increment and the keyPath item is a valid numeric key, get the old auto-increment to compare if the new is higher
        //  to determine which to use and whether to update the current number
    } else if (me.autoIncrement && Number.isFinite(keyToCheck) && keyToCheck >= 1) {
        getCurrentNumber(function (cn) {
            var useNewForAutoInc = keyToCheck >= cn;
            success(keyToCheck, useNewForAutoInc);
        });
        // Not auto-increment or auto-increment with a bad (non-numeric or < 1) keyPath key
    } else {
        success(keyToCheck);
    }
};

IDBObjectStore.prototype.__insertData = function (tx, encoded, value, primaryKey, passedKey, useNewForAutoInc, success, error) {
    var me = this;
    var paramMap = {};
    var indexPromises = me.indexNames.map(function (indexName) {
        // While this may sometimes resolve sync and sometimes async, the
        //   idea is to avoid, where possible, unnecessary delays (and
        //   consuming code ought to only see a difference in the browser
        //   where we can't control the transaction timeout anyways).
        return new _syncPromise2.default(function (resolve, reject) {
            var index = me.__indexes[indexName];
            if (index.__pending) {
                resolve();
                return;
            }
            var indexKey = void 0;
            try {
                indexKey = _Key2.default.extractKeyFromValueUsingKeyPath(value, index.keyPath, index.multiEntry); // Add as necessary to this and skip past this index if exceptions here)
            } catch (err) {
                resolve();
                return;
            }
            function setIndexInfo(index) {
                if (indexKey === undefined) {
                    return;
                }
                paramMap[index.name] = _Key2.default.encode(indexKey, index.multiEntry);
            }
            if (index.unique) {
                (function () {
                    var multiCheck = index.multiEntry && Array.isArray(indexKey);
                    var fetchArgs = (0, _IDBIndex.fetchIndexData)(index, true, indexKey, 'key', multiCheck);
                    _IDBIndex.executeFetchIndexData.apply(undefined, [true, null].concat(_toConsumableArray(fetchArgs), [tx, null, function success(key) {
                        if (key === undefined) {
                            setIndexInfo(index);
                            resolve();
                            return;
                        }
                        reject((0, _DOMException.createDOMException)('ConstraintError', 'Index already contains a record equal to ' + (multiCheck ? 'one of the subkeys of' : '') + '`indexKey`'));
                    }, reject]));
                })();
            } else {
                setIndexInfo(index);
                resolve();
            }
        });
    });
    _syncPromise2.default.all(indexPromises).then(function () {
        var sqlStart = ['INSERT INTO ', util.escapeStore(me.name), '('];
        var sqlEnd = [' VALUES ('];
        var insertSqlValues = [];
        if (primaryKey !== undefined) {
            _Key2.default.convertValueToKey(primaryKey);
            sqlStart.push(util.quote('key'), ',');
            sqlEnd.push('?,');
            insertSqlValues.push(util.escapeNUL(_Key2.default.encode(primaryKey)));
        }
        for (var key in paramMap) {
            sqlStart.push(util.escapeIndex(key) + ',');
            sqlEnd.push('?,');
            insertSqlValues.push(util.escapeNUL(paramMap[key]));
        }
        // removing the trailing comma
        sqlStart.push(util.quote('value') + ' )');
        sqlEnd.push('?)');
        insertSqlValues.push(util.escapeNUL(encoded));

        var insertSql = sqlStart.join(' ') + sqlEnd.join(' ');
        _CFG2.default.DEBUG && console.log('SQL for adding', insertSql, insertSqlValues);

        var insert = function insert(result) {
            var cb = void 0;
            if (typeof result === 'function') {
                cb = result;
                result = undefined;
            }
            tx.executeSql(insertSql, insertSqlValues, function (tx, data) {
                if (cb) {
                    cb();
                } else success(result);
            }, function (tx, err) {
                error((0, _DOMException.createDOMException)('ConstraintError', err.message, err));
            });
        };

        // Need for a clone here?
        _Sca2.default.encode(primaryKey, function (primaryKey) {
            primaryKey = _Sca2.default.decode(primaryKey);
            if (!me.autoIncrement) {
                insert(primaryKey);
                return;
            }

            // Bump up the auto-inc counter if the key path-resolved value is valid (greater than old value and >=1) OR
            //  if a manually passed in key is valid (numeric and >= 1) and >= any primaryKey
            // Todo: If primaryKey is not a number, we should be checking the value of any previous "current number" and compare with that
            if (useNewForAutoInc) {
                insert(function () {
                    var sql = 'UPDATE __sys__ SET currNum = ? WHERE name = ?';
                    var sqlValues = [Math.floor(primaryKey) + 1, util.escapeNUL(me.name)];
                    _CFG2.default.DEBUG && console.log(sql, sqlValues);
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        success(primaryKey);
                    }, function (tx, err) {
                        error((0, _DOMException.createDOMException)('UnknownError', 'Could not set the auto increment value for key', err));
                    });
                });
                // If the key path-resolved value is invalid (not numeric or < 1) or
                //    if a manually passed in key is invalid (non-numeric or < 1),
                //    then we don't need to modify the current number
            } else if (useNewForAutoInc === false || !Number.isFinite(primaryKey) || primaryKey < 1) {
                insert(primaryKey);
                // Increment current number by 1 (we cannot leverage SQLite's
                //  autoincrement (and decrement when not needed), as decrementing
                //  will be overwritten/ignored upon the next insert)
            } else {
                insert(function () {
                    var sql = 'UPDATE __sys__ SET currNum = currNum + 1 WHERE name = ?';
                    var sqlValues = [util.escapeNUL(me.name)];
                    _CFG2.default.DEBUG && console.log(sql, sqlValues);
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        success(primaryKey);
                    }, function (tx, err) {
                        error((0, _DOMException.createDOMException)('UnknownError', 'Could not set the auto increment value for key', err));
                    });
                });
            }
        });
    }).catch(function (err) {
        error(err);
    });
};

IDBObjectStore.prototype.add = function (value, key) {
    var me = this;
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    _IDBTransaction2.default.__assertActive(me.transaction);
    me.transaction.__assertWritable();
    this.__validateKeyAndValue(value, key);

    var request = me.transaction.__createRequest(me);
    me.transaction.__pushToQueue(request, function objectStoreAdd(tx, args, success, error) {
        _Sca2.default.encode(value, function (encoded) {
            value = _Sca2.default.decode(encoded);
            me.__deriveKey(tx, value, key, function (primaryKey, useNewForAutoInc) {
                _Sca2.default.encode(value, function (encoded) {
                    me.__insertData(tx, encoded, value, primaryKey, key, useNewForAutoInc, function () {
                        me.__cursors.forEach(function (cursor) {
                            cursor.__invalidateCache(); // Add
                        });
                        success.apply(undefined, arguments);
                    }, error);
                });
            }, error);
        });
    });
    return request;
};

IDBObjectStore.prototype.put = function (value, key) {
    var me = this;
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    _IDBTransaction2.default.__assertActive(me.transaction);
    me.transaction.__assertWritable();
    me.__validateKeyAndValue(value, key);

    var request = me.transaction.__createRequest(me);
    me.transaction.__pushToQueue(request, function objectStorePut(tx, args, success, error) {
        _Sca2.default.encode(value, function (encoded) {
            value = _Sca2.default.decode(encoded);
            me.__deriveKey(tx, value, key, function (primaryKey, useNewForAutoInc) {
                _Sca2.default.encode(value, function (encoded) {
                    // First try to delete if the record exists
                    _Key2.default.convertValueToKey(primaryKey);
                    var sql = 'DELETE FROM ' + util.escapeStore(me.name) + ' WHERE key = ?';
                    var encodedPrimaryKey = _Key2.default.encode(primaryKey);
                    tx.executeSql(sql, [util.escapeNUL(encodedPrimaryKey)], function (tx, data) {
                        _CFG2.default.DEBUG && console.log('Did the row with the', primaryKey, 'exist? ', data.rowsAffected);
                        me.__insertData(tx, encoded, value, primaryKey, key, useNewForAutoInc, function () {
                            me.__cursors.forEach(function (cursor) {
                                cursor.__invalidateCache(); // Add
                            });
                            success.apply(undefined, arguments);
                        }, error);
                    }, function (tx, err) {
                        error(err);
                    });
                });
            }, error);
        });
    });
    return request;
};

IDBObjectStore.prototype.__get = function (range, getKey, getAll, count) {
    var me = this;
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    _IDBTransaction2.default.__assertActive(me.transaction);
    if (range == null) {
        throw (0, _DOMException.createDOMException)('DataError', 'No key or range was specified');
    }

    if (util.instanceOf(range, _IDBKeyRange.IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!range.toString() !== '[object IDBKeyRange]') {
            range = new _IDBKeyRange.IDBKeyRange(range.lower, range.upper, range.lowerOpen, range.upperOpen);
        }
    } else {
        range = _IDBKeyRange.IDBKeyRange.only(range);
    }

    var col = getKey ? 'key' : 'value';
    var sql = ['SELECT ' + util.quote(col) + ' FROM ', util.escapeStore(me.name), ' WHERE '];
    var sqlValues = [];
    (0, _IDBKeyRange.setSQLForRange)(range, util.quote('key'), sql, sqlValues);
    if (!getAll) {
        count = 1;
    }
    if (count) {
        if (typeof count !== 'number' || isNaN(count) || !isFinite(count)) {
            throw new TypeError('The count parameter must be a finite number');
        }
        sql.push('LIMIT', count);
    }
    sql = sql.join(' ');
    return me.transaction.__addToTransactionQueue(function objectStoreGet(tx, args, success, error) {
        _CFG2.default.DEBUG && console.log('Fetching', me.name, sqlValues);
        tx.executeSql(sql, sqlValues, function (tx, data) {
            _CFG2.default.DEBUG && console.log('Fetched data', data);
            var ret = void 0;
            try {
                // Opera can't deal with the try-catch here.
                if (data.rows.length === 0) {
                    return success();
                }
                ret = [];
                if (getKey) {
                    for (var i = 0; i < data.rows.length; i++) {
                        // Key.convertValueToKey(data.rows.item(i).key); // Already validated before storage
                        ret.push(_Key2.default.decode(util.unescapeNUL(data.rows.item(i).key), false));
                    }
                } else {
                    for (var _i = 0; _i < data.rows.length; _i++) {
                        ret.push(_Sca2.default.decode(util.unescapeNUL(data.rows.item(0).value)));
                    }
                }
                if (!getAll) {
                    ret = ret[0];
                }
            } catch (e) {
                // If no result is returned, or error occurs when parsing JSON
                _CFG2.default.DEBUG && console.log(e);
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

IDBObjectStore.prototype.getAll = function (query, count) {
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.getAll`.');
    }
    return this.__get(query, false, true, count);
};

IDBObjectStore.prototype.getAllKeys = function (query, count) {
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.getAllKeys`.');
    }
    return this.__get(query, true, true, count);
};

IDBObjectStore.prototype['delete'] = function (range) {
    var me = this;
    if (!arguments.length) {
        throw new TypeError('A parameter was missing for `IDBObjectStore.delete`.');
    }

    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    _IDBTransaction2.default.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    if (range == null) {
        throw (0, _DOMException.createDOMException)('DataError', 'No key or range was specified');
    }

    if (util.instanceOf(range, _IDBKeyRange.IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!range.toString() !== '[object IDBKeyRange]') {
            range = new _IDBKeyRange.IDBKeyRange(range.lower, range.upper, range.lowerOpen, range.upperOpen);
        }
    } else {
        range = _IDBKeyRange.IDBKeyRange.only(range);
    }

    var sqlArr = ['DELETE FROM ', util.escapeStore(me.name), ' WHERE '];
    var sqlValues = [];
    (0, _IDBKeyRange.setSQLForRange)(range, util.quote('key'), sqlArr, sqlValues);
    var sql = sqlArr.join(' ');

    return me.transaction.__addToTransactionQueue(function objectStoreDelete(tx, args, success, error) {
        _CFG2.default.DEBUG && console.log('Deleting', me.name, sqlValues);
        tx.executeSql(sql, sqlValues, function (tx, data) {
            _CFG2.default.DEBUG && console.log('Deleted from database', data.rowsAffected);
            me.__cursors.forEach(function (cursor) {
                cursor.__invalidateCache(); // Delete
            });
            success();
        }, function (tx, err) {
            error(err);
        });
    }, undefined, me);
};

IDBObjectStore.prototype.clear = function () {
    var me = this;
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    _IDBTransaction2.default.__assertActive(me.transaction);
    me.transaction.__assertWritable();

    return me.transaction.__addToTransactionQueue(function objectStoreClear(tx, args, success, error) {
        tx.executeSql('DELETE FROM ' + util.escapeStore(me.name), [], function (tx, data) {
            _CFG2.default.DEBUG && console.log('Cleared all records from database', data.rowsAffected);
            me.__cursors.forEach(function (cursor) {
                cursor.__invalidateCache(); // Clear
            });
            success();
        }, function (tx, err) {
            error(err);
        });
    }, undefined, me);
};

IDBObjectStore.prototype.count = function (key) {
    var me = this;
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    _IDBTransaction2.default.__assertActive(me.transaction);
    if (util.instanceOf(key, _IDBKeyRange.IDBKeyRange)) {
        // We still need to validate IDBKeyRange-like objects (the above check is based on duck-typing)
        if (!key.toString() !== '[object IDBKeyRange]') {
            key = new _IDBKeyRange.IDBKeyRange(key.lower, key.upper, key.lowerOpen, key.upperOpen);
        }
        // We don't need to add to cursors array since has the count parameter which won't cache
        return new _IDBCursor.IDBCursorWithValue(key, 'next', me, me, 'key', 'value', true).__req;
    } else {
        var _ret2 = function () {
            var hasKey = key != null;

            // key is optional
            if (hasKey) {
                _Key2.default.convertValueToKey(key);
            }

            return {
                v: me.transaction.__addToTransactionQueue(function objectStoreCount(tx, args, success, error) {
                    var sql = 'SELECT * FROM ' + util.escapeStore(me.name) + (hasKey ? ' WHERE key = ?' : '');
                    var sqlValues = [];
                    hasKey && sqlValues.push(util.escapeNUL(_Key2.default.encode(key)));
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        success(data.rows.length);
                    }, function (tx, err) {
                        error(err);
                    });
                }, undefined, me)
            };
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
    }
};

IDBObjectStore.prototype.openCursor = function (range, direction) {
    var me = this;
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    var cursor = new _IDBCursor.IDBCursorWithValue(range, direction, me, me, 'key', 'value');
    me.__cursors.push(cursor);
    return cursor.__req;
};

IDBObjectStore.prototype.openKeyCursor = function (range, direction) {
    var me = this;
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    var cursor = new _IDBCursor.IDBCursor(range, direction, me, me, 'key', 'key');
    me.__cursors.push(cursor);
    return cursor.__req;
};

IDBObjectStore.prototype.index = function (indexName) {
    var me = this;
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    _IDBTransaction2.default.__assertActive(me.transaction);
    var index = me.__indexes[indexName];
    if (!index || index.__deleted) {
        throw (0, _DOMException.createDOMException)('NotFoundError', 'Index "' + indexName + '" does not exist on ' + me.name);
    }
    /*
    // const storeClone = me.transaction.objectStore(me.name); // Ensure clone is made if not present
    // const indexes = storeClone.__indexes;
    const storeClones = me.transaction.__storeClones;
    if (!storeClones[me.name] || storeClones[me.name].__deleted) { // The latter condition is to allow store
                                                         //   recreation to create new clone object
        storeClones[me.name] = IDBObjectStore.__clone(me, me.transaction);
    }
      const indexes = storeClones[me.name].__indexes;
    if (!indexes[indexName]) {
        indexes[indexName] = IDBIndex.__clone(index, me);
    }
    return indexes[indexName];
    */
    return _IDBIndex.IDBIndex.__clone(index, me);
};

/**
 * Creates a new index on the object store.
 * @param {string} indexName
 * @param {string} keyPath
 * @param {object} optionalParameters
 * @returns {IDBIndex}
 */
IDBObjectStore.prototype.createIndex = function (indexName, keyPath, optionalParameters) {
    var me = this;
    indexName = String(indexName); // W3C test within IDBObjectStore.js seems to accept string conversion
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    if (arguments.length === 1) {
        throw new TypeError('No key path was specified');
    }
    _IDBTransaction2.default.__assertVersionChange(me.transaction);
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    _IDBTransaction2.default.__assertActive(me.transaction);
    if (me.__indexes[indexName] && !me.__indexes[indexName].__deleted) {
        throw (0, _DOMException.createDOMException)('ConstraintError', 'Index "' + indexName + '" already exists on ' + me.name);
    }
    if (!util.isValidKeyPath(keyPath)) {
        throw (0, _DOMException.createDOMException)('SyntaxError', 'A valid keyPath must be supplied');
    }
    if (Array.isArray(keyPath) && optionalParameters && optionalParameters.multiEntry) {
        throw (0, _DOMException.createDOMException)('InvalidAccessError', 'The keyPath argument was an array and the multiEntry option is true.');
    }

    optionalParameters = optionalParameters || {};
    /** @name IDBIndexProperties **/
    var indexProperties = {
        columnName: indexName,
        keyPath: keyPath,
        optionalParams: {
            unique: !!optionalParameters.unique,
            multiEntry: !!optionalParameters.multiEntry
        }
    };
    var index = new _IDBIndex.IDBIndex(me, indexProperties);
    _IDBIndex.IDBIndex.__createIndex(me, index);
    return index;
};

IDBObjectStore.prototype.deleteIndex = function (indexName) {
    var me = this;
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    _IDBTransaction2.default.__assertVersionChange(me.transaction);
    if (me.__deleted) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
    }
    _IDBTransaction2.default.__assertActive(me.transaction);
    var index = me.__indexes[indexName];
    if (!index) {
        throw (0, _DOMException.createDOMException)('NotFoundError', 'Index "' + indexName + '" does not exist on ' + me.name);
    }

    _IDBIndex.IDBIndex.__deleteIndex(me, index);
};

IDBObjectStore.prototype.toString = function () {
    return '[object IDBObjectStore]';
};

util.defineReadonlyProperties(IDBObjectStore.prototype, ['keyPath', 'indexNames', 'transaction', 'autoIncrement']);

Object.defineProperty(IDBObjectStore.prototype, 'name', {
    enumerable: false,
    configurable: false,
    get: function get() {
        return this.__name;
    },
    set: function set(name) {
        var me = this;
        if (me.__deleted) {
            throw (0, _DOMException.createDOMException)('InvalidStateError', 'This store has been deleted');
        }
        _IDBTransaction2.default.__assertVersionChange(me.transaction);
        _IDBTransaction2.default.__assertActive(me.transaction);
        if (me.name === name) {
            return;
        }
        if (me.__idbdb.__objectStores[name]) {
            throw (0, _DOMException.createDOMException)('ConstraintError', 'Object store "' + name + '" already exists in ' + me.__idbdb.name);
        }

        delete me.__idbdb.__objectStores[me.name];
        me.__idbdb.objectStoreNames.splice(me.__idbdb.objectStoreNames.indexOf(me.name), 1);
        me.__idbdb.__objectStores[name] = me;
        me.__idbdb.objectStoreNames.push(name);
        me.__name = name;
        // Todo: Add pending flag to delay queries against this store until renamed in SQLite

        var sql = 'ALTER TABLE ' + util.escapeStore(me.name) + ' RENAME TO ' + util.escapeStore(name);
        me.transaction.__addNonRequestToTransactionQueue(function objectStoreClear(tx, args, success, error) {
            tx.executeSql(sql, [], function (tx, data) {
                success();
            }, function (tx, err) {
                error(err);
            });
        });
    }
});

exports.default = IDBObjectStore;
module.exports = exports['default'];

},{"./CFG.js":381,"./DOMException.js":382,"./IDBCursor.js":384,"./IDBIndex.js":387,"./IDBKeyRange.js":388,"./IDBTransaction.js":391,"./Key.js":392,"./Sca.js":393,"./util.js":399,"sync-promise":371}],390:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IDBOpenDBRequest = exports.IDBRequest = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _DOMException = require('./DOMException.js');

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

var _eventtarget = require('eventtarget');

var _eventtarget2 = _interopRequireDefault(_eventtarget);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * The IDBRequest Object that is returns for all async calls
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 */
var IDBRequest = function () {
    function IDBRequest() {
        _classCallCheck(this, IDBRequest);

        this.onsuccess = this.onerror = null;
        this.__result = undefined;
        this.__error = this.__source = this.__transaction = null;
        this.__readyState = 'pending';
        this.__setOptions({ extraProperties: ['debug'] }); // Ensure EventTarget preserves our properties
    }

    _createClass(IDBRequest, [{
        key: 'toString',
        value: function toString() {
            return '[object IDBRequest]';
        }
    }, {
        key: '__getParent',
        value: function __getParent() {
            if (this.toString() === '[object IDBOpenDBRequest]') {
                return null;
            }
            return this.__transaction;
        }
    }]);

    return IDBRequest;
}();

util.defineReadonlyProperties(IDBRequest.prototype, ['source', 'transaction', 'readyState']);

['result', 'error'].forEach(function (prop) {
    var obj = IDBRequest.prototype;
    Object.defineProperty(obj, '__' + prop, {
        enumerable: false,
        configurable: false,
        writable: true
    });
    Object.defineProperty(obj, prop, {
        enumerable: true,
        configurable: true,
        get: function get() {
            if (this.__readyState !== 'done') {
                throw (0, _DOMException.createDOMException)('InvalidStateError', 'The request is still pending.');
            }
            return this['__' + prop];
        }
    });
});

Object.assign(IDBRequest.prototype, _eventtarget2.default.prototype);

/**
 * The IDBOpenDBRequest called when a database is opened
 */

var IDBOpenDBRequest = function (_IDBRequest) {
    _inherits(IDBOpenDBRequest, _IDBRequest);

    function IDBOpenDBRequest() {
        _classCallCheck(this, IDBOpenDBRequest);

        var _this = _possibleConstructorReturn(this, (IDBOpenDBRequest.__proto__ || Object.getPrototypeOf(IDBOpenDBRequest)).call(this));

        _this.__setOptions({ extraProperties: ['oldVersion', 'newVersion', 'debug'] }); // Ensure EventTarget preserves our properties
        _this.onblocked = _this.onupgradeneeded = null;
        return _this;
    }

    _createClass(IDBOpenDBRequest, [{
        key: 'toString',
        value: function toString() {
            return '[object IDBOpenDBRequest]';
        }
    }]);

    return IDBOpenDBRequest;
}(IDBRequest);

exports.IDBRequest = IDBRequest;
exports.IDBOpenDBRequest = IDBOpenDBRequest;

},{"./DOMException.js":382,"./util.js":399,"eventtarget":300}],391:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Event = require('./Event.js');

var _DOMException = require('./DOMException.js');

var _IDBRequest = require('./IDBRequest.js');

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

var _IDBObjectStore = require('./IDBObjectStore.js');

var _IDBObjectStore2 = _interopRequireDefault(_IDBObjectStore);

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

var _eventtarget = require('eventtarget');

var _eventtarget2 = _interopRequireDefault(_eventtarget);

var _syncPromise = require('sync-promise');

var _syncPromise2 = _interopRequireDefault(_syncPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var uniqueID = 0;

/**
 * The IndexedDB Transaction
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
 * @param {IDBDatabase} db
 * @param {string[]} storeNames
 * @param {string} mode
 * @constructor
 */
function IDBTransaction(db, storeNames, mode) {
    var me = this;
    me.__id = ++uniqueID; // for debugging simultaneous transactions
    me.__active = true;
    me.__running = false;
    me.__errored = false;
    me.__requests = [];
    me.__objectStoreNames = storeNames;
    me.__mode = mode;
    me.__db = db;
    me.__error = null;
    me.__internal = false;
    me.onabort = me.onerror = me.oncomplete = null;
    me.__storeClones = {};
    me.__setOptions({ defaultSync: true, extraProperties: ['complete'] }); // Ensure EventTarget preserves our properties

    // Kick off the transaction as soon as all synchronous code is done
    setTimeout(function () {
        me.__executeRequests();
    }, 0);
}

IDBTransaction.prototype.__transFinishedCb = function (err, cb) {
    if (err) {
        cb(true);
        return;
    }
    cb();
};

IDBTransaction.prototype.__executeRequests = function () {
    var me = this;
    if (me.__running) {
        _CFG2.default.DEBUG && console.log('Looks like the request set is already running', me.mode);
        return;
    }

    me.__running = true;

    me.db.__db[me.mode === 'readonly' ? 'readTransaction' : 'transaction']( // `readTransaction` is optimized, at least in `node-websql`
    function executeRequests(tx) {
        me.__tx = tx;
        var q = null,
            i = -1;

        function success(result, req) {
            if (me.__errored || me.__requestsFinished) {
                // We've already called "onerror", "onabort", or thrown within the transaction, so don't do it again.
                return;
            }
            if (req) {
                q.req = req; // Need to do this in case of cursors
            }
            if (q.req.__readyState === 'done') {
                // Avoid continuing with aborted requests
                return;
            }
            q.req.__readyState = 'done';
            q.req.__result = result;
            q.req.__error = null;
            var e = (0, _Event.createEvent)('success');
            try {
                // Catching a `dispatchEvent` call is normally not possible for a standard `EventTarget`,
                // but we are using the `EventTarget` library's `__userErrorEventHandler` to override this
                // behavior for convenience in our internal calls
                me.__internal = true;
                me.__active = true;
                q.req.dispatchEvent(e);
                me.__internal = false;
                // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
            } catch (err) {
                me.__internal = false;
                me.__abortTransaction((0, _DOMException.createDOMException)('AbortError', 'A request was aborted.'));
                return;
            }
            executeNextRequest();
        }

        function error() /* tx, err */{
            if (me.__errored || me.__requestsFinished) {
                // We've already called "onerror", "onabort", or thrown within the transaction, so don't do it again.
                return;
            }
            if (q.req && q.req.__readyState === 'done') {
                // Avoid continuing with aborted requests
                return;
            }

            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var err = (0, _DOMException.findError)(args);
            if (!q.req) {
                me.__abortTransaction(err);
                return;
            }
            // Fire an error event for the current IDBRequest
            q.req.__readyState = 'done';
            q.req.__error = err;
            q.req.__result = undefined;
            q.req.addLateEventListener('error', function (e) {
                if (e.cancelable && e.defaultPrevented) {
                    executeNextRequest();
                }
            });
            q.req.addDefaultEventListener('error', function () {
                me.__abortTransaction(q.req.__error);
            });
            var e = void 0;
            try {
                // Catching a `dispatchEvent` call is normally not possible for a standard `EventTarget`,
                // but we are using the `EventTarget` library's `__userErrorEventHandler` to override this
                // behavior for convenience in our internal calls
                me.__internal = true;
                me.__active = true;
                e = (0, _Event.createEvent)('error', err, { bubbles: true, cancelable: true });
                q.req.dispatchEvent(e);
                me.__internal = false;
                // Do not set __active flag to false yet: https://github.com/w3c/IndexedDB/issues/87
            } catch (handlerErr) {
                me.__internal = false;
                (0, _DOMException.logError)('Error', 'An error occurred in a handler attached to request chain', handlerErr); // We do nothing else with this `handlerErr` per spec
                e.preventDefault(); // Prevent 'error' default as steps indicate we should abort with `AbortError` even without cancellation
                me.__abortTransaction((0, _DOMException.createDOMException)('AbortError', 'A request was aborted.'));
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
                    if (q.req.__readyState === 'done') {
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
        var err = (0, _DOMException.webSQLErrback)(webSQLErr);
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
            _CFG2.default.DEBUG && console.log('Transaction completed');
            var evt = (0, _Event.createEvent)('complete');
            try {
                me.__internal = true;
                me.dispatchEvent(evt);
                me.__internal = false;
                me.dispatchEvent((0, _Event.createEvent)('__complete'));
            } catch (e) {
                me.__internal = false;
                // An error occurred in the "oncomplete" handler.
                // It's too late to call "onerror" or "onabort". Throw a global error instead.
                // (this may seem odd/bad, but it's how all native IndexedDB implementations work)
                me.__errored = true;
                throw e;
            } finally {
                me.__storeClones = {};
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
        try {
            // Catching a `dispatchEvent` call is normally not possible for a standard `EventTarget`,
            // but we are using the `EventTarget` library's `__userErrorEventHandler` to override this
            // behavior for convenience in our internal calls
            me.__internal = true;
            var ev = (0, _Event.createEvent)('__beforecomplete');
            ev.complete = complete;
            me.dispatchEvent(ev);
        } catch (err) {} finally {
            me.__internal = false;
        }
    }
};

/**
 * Creates a new IDBRequest for the transaction.
 * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__createRequest = function (source) {
    var me = this;
    var request = new _IDBRequest.IDBRequest();
    request.__source = source !== undefined ? source : me.db;
    request.__transaction = me;
    return request;
};

/**
 * Adds a callback function to the transaction queue
 * @param {function} callback
 * @param {*} args
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__addToTransactionQueue = function (callback, args, source) {
    var request = this.__createRequest(source);
    this.__pushToQueue(request, callback, args);
    return request;
};

/**
 * Adds a callback function to the transaction queue without generating a request
 * @param {function} callback
 * @param {*} args
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__addNonRequestToTransactionQueue = function (callback, args, source) {
    this.__pushToQueue(null, callback, args);
};

/**
 * Adds an IDBRequest to the transaction queue
 * @param {IDBRequest} request
 * @param {function} callback
 * @param {*} args
 * @protected
 */
IDBTransaction.prototype.__pushToQueue = function (request, callback, args) {
    this.__assertActive();
    this.__requests.push({
        'op': callback,
        'args': args,
        'req': request
    });
};

IDBTransaction.prototype.__assertActive = function () {
    if (!this.__active) {
        throw (0, _DOMException.createDOMException)('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

IDBTransaction.prototype.__assertWritable = function () {
    if (this.mode === 'readonly') {
        throw (0, _DOMException.createDOMException)('ReadOnlyError', 'The transaction is read only');
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
    var me = this;
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    if (!me.__active) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
    if (me.__objectStoreNames.indexOf(objectStoreName) === -1) {
        throw (0, _DOMException.createDOMException)('NotFoundError', objectStoreName + ' is not participating in this transaction');
    }
    var store = me.db.__objectStores[objectStoreName];
    if (!store) {
        throw (0, _DOMException.createDOMException)('NotFoundError', objectStoreName + ' does not exist in ' + me.db.name);
    }

    if (!me.__storeClones[objectStoreName] || me.__storeClones[objectStoreName].__deleted) {
        // The latter condition is to allow store
        //   recreation to create new clone object
        me.__storeClones[objectStoreName] = _IDBObjectStore2.default.__clone(store, me);
    }
    return me.__storeClones[objectStoreName];
};

IDBTransaction.prototype.__abortTransaction = function (err) {
    var me = this;
    (0, _DOMException.logError)('Error', 'An error occurred in a transaction', err);
    if (me.__errored) {
        // We've already called "onerror", "onabort", or thrown, so don't do it again.
        return;
    }
    me.__errored = true;

    if (me.mode === 'versionchange') {
        // Steps for aborting an upgrade transaction
        me.db.__version = me.db.__oldVersion;
        me.db.__objectStoreNames = me.db.__oldObjectStoreNames;
        Object.values(me.__storeClones).forEach(function (store) {
            store.__name = store.__originalName;
            store.__indexNames = store.__oldIndexNames;
            Object.values(store.__indexes).forEach(function (index) {
                index.__name = index.__originalName;
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
        setTimeout(function () {
            throw err;
        }, 0);
    }

    function abort(tx, errOrResult) {
        if (!tx) {
            _CFG2.default.DEBUG && console.log('Rollback not possible due to missing transaction', me);
        } else if (errOrResult && typeof errOrResult.code === 'number') {
            _CFG2.default.DEBUG && console.log('Rollback erred; feature is probably not supported as per WebSQL', me);
        } else {
            _CFG2.default.DEBUG && console.log('Rollback succeeded', me);
        }

        me.__requests.filter(function (q) {
            return q.req && q.req.__readyState !== 'done';
        }).reduce(function (promises, q) {
            // We reduce to a chain of promises to be queued in order, so we cannot use `Promise.all`,
            //  and I'm unsure whether `setTimeout` currently behaves first-in-first-out with the same timeout
            //  so we could just use a `forEach`.
            return promises.then(function () {
                q.req.__readyState = 'done';
                q.req.__result = undefined;
                q.req.__error = (0, _DOMException.createDOMException)('AbortError', 'A request was aborted.');
                var reqEvt = (0, _Event.createEvent)('error', q.req.__error, { bubbles: true, cancelable: true });
                return new _syncPromise2.default(function (resolve) {
                    setTimeout(function () {
                        q.req.dispatchEvent(reqEvt); // No need to catch errors
                        resolve();
                    });
                });
            });
        }, _syncPromise2.default.resolve()).then(function () {
            // Also works when there are no pending requests
            var evt = (0, _Event.createEvent)('abort', err, { bubbles: true, cancelable: false });
            me.dispatchEvent(evt);
            me.__storeClones = {};
            me.dispatchEvent((0, _Event.createEvent)('__abort'));
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
            me.__tx.executeSql('ROLLBACK', [], abort, abort); // Not working in some circumstances, even in Node
        } else {
            abort(null, { code: 0 });
        }
    });
};

IDBTransaction.prototype.abort = function () {
    var me = this;
    _CFG2.default.DEBUG && console.log('The transaction was aborted', me);
    if (!me.__active) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
    me.__abortTransaction(null);
};
IDBTransaction.prototype.toString = function () {
    return '[object IDBTransaction]';
};

IDBTransaction.__assertVersionChange = function (tx) {
    if (!tx || tx.mode !== 'versionchange') {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'Not a version transaction');
    }
};
IDBTransaction.__assertNotVersionChange = function (tx) {
    if (tx && tx.mode === 'versionchange') {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'Cannot be called during a version transaction');
    }
};

IDBTransaction.__assertActive = function (tx) {
    if (!tx || !tx.__active) {
        throw (0, _DOMException.createDOMException)('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

/**
* Used by our EventTarget.prototype library to implement bubbling/capturing
*/
IDBTransaction.prototype.__getParent = function () {
    return this.db;
};
/**
* Used by our EventTarget.prototype library to detect errors in user handlers
*/
IDBTransaction.prototype.__userErrorEventHandler = function (error, triggerGlobalErrorEvent) {
    if (this.__internal) {
        this.__internal = false;
        throw error;
    }
    triggerGlobalErrorEvent();
};

util.defineReadonlyProperties(IDBTransaction.prototype, ['objectStoreNames', 'mode', 'db', 'error']);

Object.assign(IDBTransaction.prototype, _eventtarget2.default.prototype);

exports.default = IDBTransaction;
module.exports = exports['default'];

},{"./CFG.js":381,"./DOMException.js":382,"./Event.js":383,"./IDBObjectStore.js":389,"./IDBRequest.js":390,"./util.js":399,"eventtarget":300,"sync-promise":371}],392:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = exports.findMultiEntryMatches = exports.isKeyInRange = exports.isMultiEntryMatch = exports.setValue = exports.evaluateKeyPathOnValue = exports.extractKeyFromValueUsingKeyPath = exports.convertValueToKeyMultiEntry = exports.convertValueToKey = exports.decode = exports.encode = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _DOMException = require('./DOMException.js');

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var Key = {};

/**
 * Encodes the keys based on their types. This is required to maintain collations
 */
var collations = ['undefined', 'number', 'date', 'string', 'array'];

/**
 * The sign values for numbers, ordered from least to greatest.
 *  - "negativeInfinity": Sorts below all other values.
 *  - "bigNegative": Negative values less than or equal to negative one.
 *  - "smallNegative": Negative values between negative one and zero, noninclusive.
 *  - "smallPositive": Positive values between zero and one, including zero but not one.
 *  - "largePositive": Positive values greater than or equal to one.
 *  - "positiveInfinity": Sorts above all other values.
 */
var signValues = ['negativeInfinity', 'bigNegative', 'smallNegative', 'smallPositive', 'bigPositive', 'positiveInfinity'];

// Todo: Support `ArrayBuffer`/Views on buffers (`TypedArray` or `DataView`)
var types = {
    // Undefined is not a valid key type.  It's only used when there is no key.
    undefined: {
        encode: function encode(key) {
            return collations.indexOf('undefined') + '-';
        },
        decode: function decode(key) {
            return undefined;
        }
    },

    // Numbers are represented in a lexically sortable base-32 sign-exponent-mantissa
    // notation.
    //
    // sign: takes a value between zero and five, inclusive. Represents infinite cases
    //     and the signs of both the exponent and the fractional part of the number.
    // exponent: paded to two base-32 digits, represented by the 32's compliment in the
    //     "smallPositive" and "bigNegative" cases to ensure proper lexical sorting.
    // mantissa: also called the fractional part. Normed 11-digit base-32 representation.
    //     Represented by the 32's compliment in the "smallNegative" and "bigNegative"
    //     cases to ensure proper lexical sorting.
    number: {
        // The encode step checks for six numeric cases and generates 14-digit encoded
        // sign-exponent-mantissa strings.
        encode: function encode(key) {
            var key32 = Math.abs(key).toString(32);
            // Get the index of the decimal.
            var decimalIndex = key32.indexOf('.');
            // Remove the decimal.
            key32 = decimalIndex !== -1 ? key32.replace('.', '') : key32;
            // Get the index of the first significant digit.
            var significantDigitIndex = key32.search(/[^0]/);
            // Truncate leading zeros.
            key32 = key32.slice(significantDigitIndex);
            var sign = void 0,
                exponent = zeros(2),
                mantissa = zeros(11);

            // Finite cases:
            if (isFinite(key)) {
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
                } else {
                    // Negative exponent case:
                    if (key < 1) {
                        sign = signValues.indexOf('smallPositive');
                        exponent = flipBase32(padBase32Exponent(significantDigitIndex));
                        mantissa = padBase32Mantissa(key32);
                        // Non-negative exponent case:
                    } else {
                        sign = signValues.indexOf('bigPositive');
                        exponent = padBase32Exponent(decimalIndex !== -1 ? decimalIndex : key32.length);
                        mantissa = padBase32Mantissa(key32);
                    }
                }
                // Infinite cases:
            } else {
                sign = signValues.indexOf(key > 0 ? 'positiveInfinity' : 'negativeInfinity');
            }

            return collations.indexOf('number') + '-' + sign + exponent + mantissa;
        },
        // The decode step must interpret the sign, reflip values encoded as the 32's complements,
        // apply signs to the exponent and mantissa, do the base-32 power operation, and return
        // the original JavaScript number values.
        decode: function decode(key) {
            var sign = +key.substr(2, 1);
            var exponent = key.substr(3, 2);
            var mantissa = key.substr(5, 11);

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
    // IF the strings are in an array, then some extra encoding is done to make sorting work correctly:
    // Since we can't force all strings to be the same length, we need to ensure that characters line-up properly
    // for sorting, while also accounting for the extra characters that are added when the array itself is encoded as JSON.
    // To do this, each character of the string is prepended with a dash ("-"), and a space is added to the end of the string.
    // This effectively doubles the size of every string, but it ensures that when two arrays of strings are compared,
    // the indexes of each string's characters line up with each other.
    string: {
        encode: function encode(key, inArray) {
            if (inArray) {
                // prepend each character with a dash, and append a space to the end
                key = key.replace(/(.)/g, '-$1') + ' ';
            }
            return collations.indexOf('string') + '-' + key;
        },
        decode: function decode(key, inArray) {
            key = key.slice(2);
            if (inArray) {
                // remove the space at the end, and the dash before each character
                key = key.substr(0, key.length - 1).replace(/-(.)/g, '$1');
            }
            return key;
        }
    },

    // Arrays are encoded as JSON strings.
    // An extra, value is added to each array during encoding to make empty arrays sort correctly.
    array: {
        encode: function encode(key) {
            var encoded = [];
            for (var i = 0; i < key.length; i++) {
                var item = key[i];
                var encodedItem = _encode(item, true); // encode the array item
                encoded[i] = encodedItem;
            }
            encoded.push(collations.indexOf('undefined') + '-'); // append an extra item, so empty arrays sort correctly
            return collations.indexOf('array') + '-' + JSON.stringify(encoded);
        },
        decode: function decode(key) {
            var decoded = JSON.parse(key.slice(2));
            decoded.pop(); // remove the extra item
            for (var i = 0; i < decoded.length; i++) {
                var item = decoded[i];
                var decodedItem = _decode(item, true); // decode the item
                decoded[i] = decodedItem;
            }
            return decoded;
        }
    },

    // Dates are encoded as ISO 8601 strings, in UTC time zone.
    date: {
        encode: function encode(key) {
            return collations.indexOf('date') + '-' + key.toJSON();
        },
        decode: function decode(key) {
            return new Date(key.slice(2));
        }
    }
};

/**
 * Return a padded base-32 exponent value.
 * @param {number}
 * @return {string}
 */
function padBase32Exponent(n) {
    n = n.toString(32);
    return n.length === 1 ? '0' + n : n;
}

/**
 * Return a padded base-32 mantissa.
 * @param {string}
 * @return {string}
 */
function padBase32Mantissa(s) {
    return (s + zeros(11)).slice(0, 11);
}

/**
 * Flips each digit of a base-32 encoded string.
 * @param {string} encoded
 */
function flipBase32(encoded) {
    var flipped = '';
    for (var i = 0; i < encoded.length; i++) {
        flipped += (31 - parseInt(encoded[i], 32)).toString(32);
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
 * @param {string}
 * @param {string}
 * @return {number}
 */
function pow32(mantissa, exponent) {
    exponent = parseInt(exponent, 32);
    if (exponent < 0) {
        return roundToPrecision(parseInt(mantissa, 32) * Math.pow(32, exponent - 10));
    } else {
        if (exponent < 11) {
            var whole = mantissa.slice(0, exponent);
            whole = parseInt(whole, 32);
            var fraction = mantissa.slice(exponent);
            fraction = parseInt(fraction, 32) * Math.pow(32, exponent - 11);
            return roundToPrecision(whole + fraction);
        } else {
            var expansion = mantissa + zeros(exponent - 11);
            return parseInt(expansion, 32);
        }
    }
}

/**
 *
 */
function roundToPrecision(num, precision) {
    precision = precision || 16;
    return parseFloat(num.toPrecision(precision));
}

/**
 * Returns a string of n zeros.
 * @param {number}
 * @return {string}
 */
function zeros(n) {
    var result = '';
    while (n--) {
        result = result + '0';
    }
    return result;
}

/**
 * Negates numeric strings.
 * @param {string}
 * @return {string}
 */
function negate(s) {
    return '-' + s;
}

/**
 * Returns the string "number", "date", "string", or "array".
 */
function getType(key) {
    if (Array.isArray(key)) return 'array';
    if (util.isDate(key)) return 'date';
    // if (util.isArrayBufferOrView(key)) return 'ArrayBuffer'; // Todo: Uncomment when supported
    return typeof key === 'undefined' ? 'undefined' : _typeof(key);
}

/**
 * Keys must be strings, numbers (besides NaN), Dates (if value is not NaN),
 *   Arrays (or, once supported, ArrayBuffer) objects
 * @todo Currently this is being used in code for validation but for greater
 *   spec parity if nothing else, ought to probably instead be returning a
 *   key object with {type, value}
 */
function convertValueToKey(key, arrayRefs, multiEntry) {
    var type = getType(key);
    switch (type) {
        case 'ArrayBuffer':
            // Copy bytes once implemented (not a supported type yet)
            return key;
        case 'array':
            arrayRefs = arrayRefs || [];
            arrayRefs.push(key);
            var newKeys = [];
            for (var i = 0; i < key.length; i++) {
                // We cannot iterate here with array extras as we must ensure sparse arrays are invalidated
                var item = key[i];
                if (arrayRefs.includes(item)) throw (0, _DOMException.createDOMException)('DataError', 'An array key cannot be circular');
                var newKey = void 0;
                try {
                    newKey = convertValueToKey(item, arrayRefs);
                } catch (err) {
                    if (!multiEntry) {
                        throw err;
                    }
                }
                if (!multiEntry || !newKeys.includes(newKey)) {
                    newKeys.push(newKey);
                }
            }
            return newKeys;
        case 'date':
            if (!Number.isNaN(key.getTime())) {
                return new Date(key.getTime());
            }
        // Falls through
        default:
            // allow for strings, numbers instead of first part of this check:
            // Other `typeof` types which are not valid keys:
            //    'undefined', 'boolean', 'object' (including `null`), 'symbol', 'function'
            if (!['string', 'number'].includes(type) || Number.isNaN(key)) {
                throw (0, _DOMException.createDOMException)('DataError', 'Not a valid key');
            }
            return key;
    }
}

function convertValueToKeyMultiEntry(key) {
    return convertValueToKey(key, null, true);
}

function extractKeyFromValueUsingKeyPath(value, keyPath, multiEntry) {
    var key = evaluateKeyPathOnValue(value, keyPath, multiEntry);
    if (!multiEntry) {
        return convertValueToKey(key);
    }
    return convertValueToKeyMultiEntry(key);
}

/**
 * Returns the value of an inline key based on a key path
 * @param {object} value
 * @param {string|array} keyPath
 * @param {boolean} multiEntry
 * @returns {undefined|array|string}
 */
function evaluateKeyPathOnValue(value, keyPath, multiEntry) {
    if (Array.isArray(keyPath)) {
        var _ret = function () {
            var arrayValue = [];
            return {
                v: keyPath.some(function (kpPart) {
                    // If W3C tests are accurate, it appears sequence<DOMString> implies `toString()`
                    // See also https://heycam.github.io/webidl/#idl-DOMString
                    // and http://stackoverflow.com/questions/38164752/should-a-call-to-db-close-within-upgradeneeded-inevitably-prevent-onsuccess
                    kpPart = util.isObj(kpPart) ? kpPart.toString() : kpPart;
                    var key = extractKeyFromValueUsingKeyPath(value, kpPart, multiEntry);
                    try {
                        key = convertValueToKey(key);
                    } catch (err) {
                        return true;
                    }
                    arrayValue.push(key);
                }, []) ? undefined : arrayValue
            };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }
    if (keyPath === '') {
        return value;
    }
    var identifiers = keyPath.split('.');
    identifiers.some(function (idntfr, i) {
        if (idntfr === 'length' && typeof value === 'string' && i === identifiers.length - 1) {
            value = value.length;
            return true;
        }
        if (!util.isObj(value)) {
            value = undefined;
            return true;
        }
        value = value[idntfr];
        return value === undefined;
    });
    return value;
}

/**
 * Sets the inline key value
 * @param {object} source
 * @param {string} keyPath
 * @param {*} value
 */
function setValue(source, keyPath, value) {
    var props = keyPath.split('.');
    for (var i = 0; i < props.length - 1; i++) {
        var prop = props[i];
        source = source[prop] = source[prop] || {};
    }
    source[props[props.length - 1]] = value;
}

/**
 * Determines whether an index entry matches a multi-entry key value.
 * @param {string} encodedEntry     The entry value (already encoded)
 * @param {string} encodedKey       The full index key (already encoded)
 * @returns {boolean}
 */
function isMultiEntryMatch(encodedEntry, encodedKey) {
    var keyType = collations[encodedKey.substring(0, 1)];

    if (keyType === 'array') {
        return encodedKey.indexOf(encodedEntry) > 1;
    } else {
        return encodedKey === encodedEntry;
    }
}

function isKeyInRange(key, range, checkCached) {
    var lowerMatch = range.lower === undefined;
    var upperMatch = range.upper === undefined;
    var encodedKey = _encode(key, true);
    var lower = checkCached ? range.__lowerCached : _encode(range.lower, true);
    var upper = checkCached ? range.__upperCached : _encode(range.upper, true);

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

function findMultiEntryMatches(keyEntry, range) {
    var matches = [];

    if (Array.isArray(keyEntry)) {
        for (var i = 0; i < keyEntry.length; i++) {
            var key = keyEntry[i];

            if (Array.isArray(key)) {
                if (range.lower === range.upper) {
                    continue;
                }
                if (key.length === 1) {
                    key = key[0];
                } else {
                    var nested = findMultiEntryMatches(key, range);
                    if (nested.length > 0) {
                        matches.push(key);
                    }
                    continue;
                }
            }

            if (isKeyInRange(key, range, true)) {
                matches.push(key);
            }
        }
    } else {
        if (isKeyInRange(keyEntry, range, true)) {
            matches.push(keyEntry);
        }
    }
    return matches;
}

function _encode(key, inArray) {
    // Bad keys like `null`, `object`, `boolean`, 'function', 'symbol' should not be passed here due to prior validation
    if (key === undefined) {
        return null;
    }
    // Currently has array, date, number, string
    return types[getType(key)].encode(key, inArray);
}
function _decode(key, inArray) {
    if (typeof key !== 'string') {
        return undefined;
    }
    return types[collations[key.substring(0, 1)]].decode(key, inArray);
}

exports.default = Key = { encode: _encode, decode: _decode, convertValueToKey: convertValueToKey, convertValueToKeyMultiEntry: convertValueToKeyMultiEntry, extractKeyFromValueUsingKeyPath: extractKeyFromValueUsingKeyPath, evaluateKeyPathOnValue: evaluateKeyPathOnValue, setValue: setValue, isMultiEntryMatch: isMultiEntryMatch, isKeyInRange: isKeyInRange, findMultiEntryMatches: findMultiEntryMatches };
exports.encode = _encode;
exports.decode = _decode;
exports.convertValueToKey = convertValueToKey;
exports.convertValueToKeyMultiEntry = convertValueToKeyMultiEntry;
exports.extractKeyFromValueUsingKeyPath = extractKeyFromValueUsingKeyPath;
exports.evaluateKeyPathOnValue = evaluateKeyPathOnValue;
exports.setValue = setValue;
exports.isMultiEntryMatch = isMultiEntryMatch;
exports.isKeyInRange = isKeyInRange;
exports.findMultiEntryMatches = findMultiEntryMatches;
exports.default = Key;

},{"./DOMException.js":382,"./util.js":399}],393:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = exports.decode = exports.encode = exports.retrocycle = exports.decycle = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /* eslint-disable no-eval */
// Needed by Node; uses native if available (browser)


var _atob = require('atob');

var _atob2 = _interopRequireDefault(_atob);

var _w3cBlob = require('w3c-blob');

var _w3cBlob2 = _interopRequireDefault(_w3cBlob);

var _util = require('./util.js');

var util = _interopRequireWildcard(_util);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Implementation of the Structured Cloning Algorithm.  Supports the
 * following object types:
 * - Blob
 * - Boolean
 * - Date object
 * - File object (deserialized as Blob object).
 * - Number object
 * - RegExp object
 * - String object
 * This is accomplished by doing the following:
 * 1) Using the cycle/decycle functions from:
 *    https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 * 2) Serializing/deserializing objects to/from string that don't work with
 *    JSON.stringify and JSON.parse by using object specific logic (eg use
 *    the FileReader API to convert a Blob or File object to a data URL.
 * 3) JSON.stringify and JSON.parse do the final conversion to/from string.
 */
function decycle(object, callback) {
    // From: https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
    // Contains additional logic to convert the following object types to string
    // so that they can properly be encoded using JSON.stringify:
    //  *Boolean
    //  *Date
    //  *File
    //  *Blob
    //  *Number
    //  *Regex
    // Make a deep copy of an object or array, assuring that there is at most
    // one instance of each object or array in the resulting structure. The
    // duplicate references (which might be forming cycles) are replaced with
    // an object of the form
    //      {$ref: PATH}
    // where the PATH is a JSONPath string that locates the first occurance.
    // So,
    //      var a = [];
    //      a[0] = a;
    //      return JSON.stringify(JSON.decycle(a));
    // produces the string '[{"$ref":"$"}]'.

    // JSONPath is used to locate the unique object. $ indicates the top level of
    // the object or array. [NUMBER] or [STRING] indicates a child member or
    // property.

    var objects = []; // Keep a reference to each unique object or array
    var paths = []; // Keep the path to each unique object or array
    var queuedObjects = [];
    var returnCallback = callback;
    var derezObj = void 0; // eslint-disable-line prefer-const

    /**
     * Check the queue to see if all objects have been processed.
     * if they have, call the callback with the converted object.
     */
    function checkForCompletion() {
        if (queuedObjects.length === 0) {
            returnCallback(derezObj);
        }
    }

    /**
     * Convert a blob to a data URL.
     * @param {Blob} blob to convert.
     * @param {String} path of blob in object being encoded.
     */
    function readBlobAsDataURL(blob, path) {
        var reader = new FileReader();
        reader.onloadend = function (loadedEvent) {
            var dataURL = loadedEvent.target.result;
            var blobtype = 'Blob';
            if (util.isFile(blob)) {
                // blobtype = 'File';
            }
            updateEncodedBlob(dataURL, path, blobtype);
        };
        reader.readAsDataURL(blob);
    }

    /**
     * Async handler to update a blob object to a data URL for encoding.
     * @param {String} dataURL
     * @param {String} path
     * @param {String} blobtype - file if the blob is a file; blob otherwise
     */
    function updateEncodedBlob(dataURL, path, blobtype) {
        var encoded = queuedObjects.indexOf(path);
        path = path.replace('$', 'derezObj');
        eval(path + '.$enc="' + dataURL + '"');
        eval(path + '.$type="' + blobtype + '"');
        queuedObjects.splice(encoded, 1);
        checkForCompletion();
    }

    function derez(value, path) {
        // The derez recurses through the object, producing the deep copy.

        var i = void 0,
            // The loop counter
        name = void 0,
            // Property name
        nu = void 0; // The new object or array

        // typeof null === 'object', so go on if this value is really an object but not
        // one of the weird builtin objects.

        var isObj = util.isObj(value);
        var valOfType = isObj && _typeof(value.valueOf());
        if (isObj && !['boolean', 'number', 'string'].includes(valOfType) && !util.isDate(value) && !util.isRegExp(value) && !util.isBlob(_w3cBlob2.default)) {
            // If the value is an object or array, look to see if we have already
            // encountered it. If so, return a $ref/path object. This is a hard way,
            // linear search that will get slower as the number of unique objects grows.

            for (i = 0; i < objects.length; i += 1) {
                if (objects[i] === value) {
                    return { $ref: paths[i] };
                }
            }

            // Otherwise, accumulate the unique value and its path.

            objects.push(value);
            paths.push(path);

            // If it is an array, replicate the array.

            if (Array.isArray(value)) {
                nu = [];
                for (i = 0; i < value.length; i += 1) {
                    nu[i] = derez(value[i], path + '[' + i + ']');
                }
            } else {
                // If it is an object, replicate the object.
                nu = {};
                for (name in value) {
                    if (Object.prototype.hasOwnProperty.call(value, name)) {
                        nu[name] = derez(value[name], path + '[' + JSON.stringify(name) + ']');
                    }
                }
            }

            return nu;
        } else if (util.isBlob(value)) {
            // Queue blob for conversion
            queuedObjects.push(path);
            readBlobAsDataURL(value, path);
        } else if (valOfType === 'boolean') {
            value = {
                '$type': 'Boolean',
                '$enc': value.toString()
            };
        } else if (util.isDate(value)) {
            value = {
                '$type': 'Date',
                '$enc': value.getTime()
            };
        } else if (valOfType === 'number') {
            value = {
                '$type': 'Number',
                '$enc': value.toString()
            };
        } else if (util.isRegExp(value)) {
            value = {
                '$type': 'RegExp',
                '$enc': value.toString()
            };
        } else if (typeof value === 'number') {
            value = {
                '$type': 'number',
                '$enc': value + '' // handles NaN, Infinity, Negative Infinity
            };
        } else if (value === undefined) {
            value = {
                '$type': 'undefined'
            };
        }
        return value;
    }
    derezObj = derez(object, '$');
    checkForCompletion();
}

function retrocycle($) {
    // From: https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
    // Contains additional logic to convert strings to the following object types
    // so that they can properly be decoded:
    //  *Boolean
    //  *Date
    //  *File
    //  *Blob
    //  *Number
    //  *Regex
    // Restore an object that was reduced by decycle. Members whose values are
    // objects of the form
    //      {$ref: PATH}
    // are replaced with references to the value found by the PATH. This will
    // restore cycles. The object will be mutated.

    // The eval function is used to locate the values described by a PATH. The
    // root object is kept in a $ variable. A regular expression is used to
    // assure that the PATH is extremely well formed. The regexp contains nested
    // * quantifiers. That has been known to have extremely bad performance
    // problems on some browsers for very long strings. A PATH is expected to be
    // reasonably short. A PATH is allowed to belong to a very restricted subset of
    // Goessner's JSONPath.

    // So,
    //      var s = '[{"$ref":"$"}]';
    //      return JSON.retrocycle(JSON.parse(s));
    // produces an array containing a single element which is the array itself.

    var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\([\\"/bfnrt]|u[0-9a-zA-Z]{4}))*")])*$/;

    /**
     * Converts the specified data URL to a Blob object
     * @param {String} dataURL to convert to a Blob
     * @returns {Blob} the converted Blob object
     */
    function dataURLToBlob(dataURL) {
        var BASE64_MARKER = ';base64,';
        var contentType = void 0,
            parts = void 0,
            raw = void 0;
        if (!dataURL.includes(BASE64_MARKER)) {
            parts = dataURL.split(',');
            contentType = parts[0].split(':')[1];
            raw = parts[1];

            return new _w3cBlob2.default([raw], { type: contentType });
        }

        parts = dataURL.split(BASE64_MARKER);
        contentType = parts[0].split(':')[1];
        raw = (0, _atob2.default)(parts[1]);
        var rawLength = raw.length;
        var uInt8Array = new Uint8Array(rawLength);

        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new _w3cBlob2.default([uInt8Array.buffer], { type: contentType });
    }

    function rez(value) {
        // The rez function walks recursively through the object looking for $ref
        // properties. When it finds one that has a value that is a path, then it
        // replaces the $ref object with a reference to the value that is found by
        // the path.

        var i = void 0,
            item = void 0,
            name = void 0,
            path = void 0;

        if (util.isObj(value)) {
            if (Array.isArray(value)) {
                for (i = 0; i < value.length; i += 1) {
                    item = value[i];
                    if (util.isObj(item)) {
                        path = item.$ref;
                        if (typeof path === 'string' && px.test(path)) {
                            value[i] = eval(path);
                        } else {
                            value[i] = rez(item);
                        }
                    }
                }
            } else {
                if (value.$type !== undefined) {
                    switch (value.$type) {
                        case 'Blob':
                        case 'File':
                            value = dataURLToBlob(value.$enc);
                            break;
                        case 'Boolean':
                            value = Boolean(value.$enc === 'true');
                            break;
                        case 'Date':
                            value = new Date(value.$enc);
                            break;
                        case 'Number':
                            value = Number(value.$enc);
                            break;
                        case 'RegExp':
                            value = eval(value.$enc);
                            break;
                        case 'number':
                            value = parseFloat(value.$enc);
                            break;
                        case 'undefined':
                            value = undefined;
                            break;
                    }
                } else {
                    for (name in value) {
                        if (_typeof(value[name]) === 'object') {
                            item = value[name];
                            if (item) {
                                path = item.$ref;
                                if (typeof path === 'string' && px.test(path)) {
                                    value[name] = eval(path);
                                } else {
                                    value[name] = rez(item);
                                }
                            }
                        }
                    }
                }
            }
        }
        return value;
    }
    return rez($);
}

/**
 * Encode the specified object as a string.  Because of the asynchronus
 * conversion of Blob/File to string, the encode function requires
 * a callback
 * @param {Object} val the value to convert.
 * @param {function} callback the function to call once conversion is
 * complete.  The callback gets called with the converted value.
 */
function encode(val, callback) {
    function finishEncode(val) {
        callback(JSON.stringify(val));
    }
    decycle(val, finishEncode);
}

/**
 * Deserialize the specified string to an object
 * @param {String} val the serialized string
 * @returns {Object} the deserialized object
 */
function decode(val) {
    return retrocycle(JSON.parse(val));
}

var Sca = { decycle: decycle, retrocycle: retrocycle, encode: encode, decode: decode };
exports.decycle = decycle;
exports.retrocycle = retrocycle;
exports.encode = encode;
exports.decode = decode;
exports.default = Sca;

},{"./util.js":399,"atob":2,"w3c-blob":373}],394:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// ID_Start (includes Other_ID_Start)
var UnicodeIDStart = '(?:[$A-Z_a-z\\xAA\\xB5\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0370-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386\\u0388-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0620-\\u064A\\u066E\\u066F\\u0671-\\u06D3\\u06D5\\u06E5\\u06E6\\u06EE\\u06EF\\u06FA-\\u06FC\\u06FF\\u0710\\u0712-\\u072F\\u074D-\\u07A5\\u07B1\\u07CA-\\u07EA\\u07F4\\u07F5\\u07FA\\u0800-\\u0815\\u081A\\u0824\\u0828\\u0840-\\u0858\\u08A0-\\u08B4\\u08B6-\\u08BD\\u0904-\\u0939\\u093D\\u0950\\u0958-\\u0961\\u0971-\\u0980\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BD\\u09CE\\u09DC\\u09DD\\u09DF-\\u09E1\\u09F0\\u09F1\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A59-\\u0A5C\\u0A5E\\u0A72-\\u0A74\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABD\\u0AD0\\u0AE0\\u0AE1\\u0AF9\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3D\\u0B5C\\u0B5D\\u0B5F-\\u0B61\\u0B71\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BD0\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D\\u0C58-\\u0C5A\\u0C60\\u0C61\\u0C80\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBD\\u0CDE\\u0CE0\\u0CE1\\u0CF1\\u0CF2\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D\\u0D4E\\u0D54-\\u0D56\\u0D5F-\\u0D61\\u0D7A-\\u0D7F\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0E01-\\u0E30\\u0E32\\u0E33\\u0E40-\\u0E46\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB0\\u0EB2\\u0EB3\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EDC-\\u0EDF\\u0F00\\u0F40-\\u0F47\\u0F49-\\u0F6C\\u0F88-\\u0F8C\\u1000-\\u102A\\u103F\\u1050-\\u1055\\u105A-\\u105D\\u1061\\u1065\\u1066\\u106E-\\u1070\\u1075-\\u1081\\u108E\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u1380-\\u138F\\u13A0-\\u13F5\\u13F8-\\u13FD\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176C\\u176E-\\u1770\\u1780-\\u17B3\\u17D7\\u17DC\\u1820-\\u1877\\u1880-\\u18A8\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1950-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19B0-\\u19C9\\u1A00-\\u1A16\\u1A20-\\u1A54\\u1AA7\\u1B05-\\u1B33\\u1B45-\\u1B4B\\u1B83-\\u1BA0\\u1BAE\\u1BAF\\u1BBA-\\u1BE5\\u1C00-\\u1C23\\u1C4D-\\u1C4F\\u1C5A-\\u1C7D\\u1C80-\\u1C88\\u1CE9-\\u1CEC\\u1CEE-\\u1CF1\\u1CF5\\u1CF6\\u1D00-\\u1DBF\\u1E00-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u2071\\u207F\\u2090-\\u209C\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2118-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CEE\\u2CF2\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D80-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u309B-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FD5\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA61F\\uA62A\\uA62B\\uA640-\\uA66E\\uA67F-\\uA69D\\uA6A0-\\uA6EF\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA7AE\\uA7B0-\\uA7B7\\uA7F7-\\uA801\\uA803-\\uA805\\uA807-\\uA80A\\uA80C-\\uA822\\uA840-\\uA873\\uA882-\\uA8B3\\uA8F2-\\uA8F7\\uA8FB\\uA8FD\\uA90A-\\uA925\\uA930-\\uA946\\uA960-\\uA97C\\uA984-\\uA9B2\\uA9CF\\uA9E0-\\uA9E4\\uA9E6-\\uA9EF\\uA9FA-\\uA9FE\\uAA00-\\uAA28\\uAA40-\\uAA42\\uAA44-\\uAA4B\\uAA60-\\uAA76\\uAA7A\\uAA7E-\\uAAAF\\uAAB1\\uAAB5\\uAAB6\\uAAB9-\\uAABD\\uAAC0\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEA\\uAAF2-\\uAAF4\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB65\\uAB70-\\uABE2\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D\\uFB1F-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF21-\\uFF3A\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]|\\uD800[\\uDC00-\\uDC0B\\uDC0D-\\uDC26\\uDC28-\\uDC3A\\uDC3C\\uDC3D\\uDC3F-\\uDC4D\\uDC50-\\uDC5D\\uDC80-\\uDCFA\\uDD40-\\uDD74\\uDE80-\\uDE9C\\uDEA0-\\uDED0\\uDF00-\\uDF1F\\uDF30-\\uDF4A\\uDF50-\\uDF75\\uDF80-\\uDF9D\\uDFA0-\\uDFC3\\uDFC8-\\uDFCF\\uDFD1-\\uDFD5]|\\uD801[\\uDC00-\\uDC9D\\uDCB0-\\uDCD3\\uDCD8-\\uDCFB\\uDD00-\\uDD27\\uDD30-\\uDD63\\uDE00-\\uDF36\\uDF40-\\uDF55\\uDF60-\\uDF67]|\\uD802[\\uDC00-\\uDC05\\uDC08\\uDC0A-\\uDC35\\uDC37\\uDC38\\uDC3C\\uDC3F-\\uDC55\\uDC60-\\uDC76\\uDC80-\\uDC9E\\uDCE0-\\uDCF2\\uDCF4\\uDCF5\\uDD00-\\uDD15\\uDD20-\\uDD39\\uDD80-\\uDDB7\\uDDBE\\uDDBF\\uDE00\\uDE10-\\uDE13\\uDE15-\\uDE17\\uDE19-\\uDE33\\uDE60-\\uDE7C\\uDE80-\\uDE9C\\uDEC0-\\uDEC7\\uDEC9-\\uDEE4\\uDF00-\\uDF35\\uDF40-\\uDF55\\uDF60-\\uDF72\\uDF80-\\uDF91]|\\uD803[\\uDC00-\\uDC48\\uDC80-\\uDCB2\\uDCC0-\\uDCF2]|\\uD804[\\uDC03-\\uDC37\\uDC83-\\uDCAF\\uDCD0-\\uDCE8\\uDD03-\\uDD26\\uDD50-\\uDD72\\uDD76\\uDD83-\\uDDB2\\uDDC1-\\uDDC4\\uDDDA\\uDDDC\\uDE00-\\uDE11\\uDE13-\\uDE2B\\uDE80-\\uDE86\\uDE88\\uDE8A-\\uDE8D\\uDE8F-\\uDE9D\\uDE9F-\\uDEA8\\uDEB0-\\uDEDE\\uDF05-\\uDF0C\\uDF0F\\uDF10\\uDF13-\\uDF28\\uDF2A-\\uDF30\\uDF32\\uDF33\\uDF35-\\uDF39\\uDF3D\\uDF50\\uDF5D-\\uDF61]|\\uD805[\\uDC00-\\uDC34\\uDC47-\\uDC4A\\uDC80-\\uDCAF\\uDCC4\\uDCC5\\uDCC7\\uDD80-\\uDDAE\\uDDD8-\\uDDDB\\uDE00-\\uDE2F\\uDE44\\uDE80-\\uDEAA\\uDF00-\\uDF19]|\\uD806[\\uDCA0-\\uDCDF\\uDCFF\\uDEC0-\\uDEF8]|\\uD807[\\uDC00-\\uDC08\\uDC0A-\\uDC2E\\uDC40\\uDC72-\\uDC8F]|\\uD808[\\uDC00-\\uDF99]|\\uD809[\\uDC00-\\uDC6E\\uDC80-\\uDD43]|[\\uD80C\\uD81C-\\uD820\\uD840-\\uD868\\uD86A-\\uD86C\\uD86F-\\uD872][\\uDC00-\\uDFFF]|\\uD80D[\\uDC00-\\uDC2E]|\\uD811[\\uDC00-\\uDE46]|\\uD81A[\\uDC00-\\uDE38\\uDE40-\\uDE5E\\uDED0-\\uDEED\\uDF00-\\uDF2F\\uDF40-\\uDF43\\uDF63-\\uDF77\\uDF7D-\\uDF8F]|\\uD81B[\\uDF00-\\uDF44\\uDF50\\uDF93-\\uDF9F\\uDFE0]|\\uD821[\\uDC00-\\uDFEC]|\\uD822[\\uDC00-\\uDEF2]|\\uD82C[\\uDC00\\uDC01]|\\uD82F[\\uDC00-\\uDC6A\\uDC70-\\uDC7C\\uDC80-\\uDC88\\uDC90-\\uDC99]|\\uD835[\\uDC00-\\uDC54\\uDC56-\\uDC9C\\uDC9E\\uDC9F\\uDCA2\\uDCA5\\uDCA6\\uDCA9-\\uDCAC\\uDCAE-\\uDCB9\\uDCBB\\uDCBD-\\uDCC3\\uDCC5-\\uDD05\\uDD07-\\uDD0A\\uDD0D-\\uDD14\\uDD16-\\uDD1C\\uDD1E-\\uDD39\\uDD3B-\\uDD3E\\uDD40-\\uDD44\\uDD46\\uDD4A-\\uDD50\\uDD52-\\uDEA5\\uDEA8-\\uDEC0\\uDEC2-\\uDEDA\\uDEDC-\\uDEFA\\uDEFC-\\uDF14\\uDF16-\\uDF34\\uDF36-\\uDF4E\\uDF50-\\uDF6E\\uDF70-\\uDF88\\uDF8A-\\uDFA8\\uDFAA-\\uDFC2\\uDFC4-\\uDFCB]|\\uD83A[\\uDC00-\\uDCC4\\uDD00-\\uDD43]|\\uD83B[\\uDE00-\\uDE03\\uDE05-\\uDE1F\\uDE21\\uDE22\\uDE24\\uDE27\\uDE29-\\uDE32\\uDE34-\\uDE37\\uDE39\\uDE3B\\uDE42\\uDE47\\uDE49\\uDE4B\\uDE4D-\\uDE4F\\uDE51\\uDE52\\uDE54\\uDE57\\uDE59\\uDE5B\\uDE5D\\uDE5F\\uDE61\\uDE62\\uDE64\\uDE67-\\uDE6A\\uDE6C-\\uDE72\\uDE74-\\uDE77\\uDE79-\\uDE7C\\uDE7E\\uDE80-\\uDE89\\uDE8B-\\uDE9B\\uDEA1-\\uDEA3\\uDEA5-\\uDEA9\\uDEAB-\\uDEBB]|\\uD869[\\uDC00-\\uDED6\\uDF00-\\uDFFF]|\\uD86D[\\uDC00-\\uDF34\\uDF40-\\uDFFF]|\\uD86E[\\uDC00-\\uDC1D\\uDC20-\\uDFFF]|\\uD873[\\uDC00-\\uDEA1]|\\uD87E[\\uDC00-\\uDE1D])';

// ID_Continue (includes Other_ID_Continue)
var UnicodeIDContinue = '(?:[$0-9A-Z_a-z\\xAA\\xB5\\xB7\\xBA\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02C1\\u02C6-\\u02D1\\u02E0-\\u02E4\\u02EC\\u02EE\\u0300-\\u0374\\u0376\\u0377\\u037A-\\u037D\\u037F\\u0386-\\u038A\\u038C\\u038E-\\u03A1\\u03A3-\\u03F5\\u03F7-\\u0481\\u0483-\\u0487\\u048A-\\u052F\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u0591-\\u05BD\\u05BF\\u05C1\\u05C2\\u05C4\\u05C5\\u05C7\\u05D0-\\u05EA\\u05F0-\\u05F2\\u0610-\\u061A\\u0620-\\u0669\\u066E-\\u06D3\\u06D5-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06FC\\u06FF\\u0710-\\u074A\\u074D-\\u07B1\\u07C0-\\u07F5\\u07FA\\u0800-\\u082D\\u0840-\\u085B\\u08A0-\\u08B4\\u08B6-\\u08BD\\u08D4-\\u08E1\\u08E3-\\u0963\\u0966-\\u096F\\u0971-\\u0983\\u0985-\\u098C\\u098F\\u0990\\u0993-\\u09A8\\u09AA-\\u09B0\\u09B2\\u09B6-\\u09B9\\u09BC-\\u09C4\\u09C7\\u09C8\\u09CB-\\u09CE\\u09D7\\u09DC\\u09DD\\u09DF-\\u09E3\\u09E6-\\u09F1\\u0A01-\\u0A03\\u0A05-\\u0A0A\\u0A0F\\u0A10\\u0A13-\\u0A28\\u0A2A-\\u0A30\\u0A32\\u0A33\\u0A35\\u0A36\\u0A38\\u0A39\\u0A3C\\u0A3E-\\u0A42\\u0A47\\u0A48\\u0A4B-\\u0A4D\\u0A51\\u0A59-\\u0A5C\\u0A5E\\u0A66-\\u0A75\\u0A81-\\u0A83\\u0A85-\\u0A8D\\u0A8F-\\u0A91\\u0A93-\\u0AA8\\u0AAA-\\u0AB0\\u0AB2\\u0AB3\\u0AB5-\\u0AB9\\u0ABC-\\u0AC5\\u0AC7-\\u0AC9\\u0ACB-\\u0ACD\\u0AD0\\u0AE0-\\u0AE3\\u0AE6-\\u0AEF\\u0AF9\\u0B01-\\u0B03\\u0B05-\\u0B0C\\u0B0F\\u0B10\\u0B13-\\u0B28\\u0B2A-\\u0B30\\u0B32\\u0B33\\u0B35-\\u0B39\\u0B3C-\\u0B44\\u0B47\\u0B48\\u0B4B-\\u0B4D\\u0B56\\u0B57\\u0B5C\\u0B5D\\u0B5F-\\u0B63\\u0B66-\\u0B6F\\u0B71\\u0B82\\u0B83\\u0B85-\\u0B8A\\u0B8E-\\u0B90\\u0B92-\\u0B95\\u0B99\\u0B9A\\u0B9C\\u0B9E\\u0B9F\\u0BA3\\u0BA4\\u0BA8-\\u0BAA\\u0BAE-\\u0BB9\\u0BBE-\\u0BC2\\u0BC6-\\u0BC8\\u0BCA-\\u0BCD\\u0BD0\\u0BD7\\u0BE6-\\u0BEF\\u0C00-\\u0C03\\u0C05-\\u0C0C\\u0C0E-\\u0C10\\u0C12-\\u0C28\\u0C2A-\\u0C39\\u0C3D-\\u0C44\\u0C46-\\u0C48\\u0C4A-\\u0C4D\\u0C55\\u0C56\\u0C58-\\u0C5A\\u0C60-\\u0C63\\u0C66-\\u0C6F\\u0C80-\\u0C83\\u0C85-\\u0C8C\\u0C8E-\\u0C90\\u0C92-\\u0CA8\\u0CAA-\\u0CB3\\u0CB5-\\u0CB9\\u0CBC-\\u0CC4\\u0CC6-\\u0CC8\\u0CCA-\\u0CCD\\u0CD5\\u0CD6\\u0CDE\\u0CE0-\\u0CE3\\u0CE6-\\u0CEF\\u0CF1\\u0CF2\\u0D01-\\u0D03\\u0D05-\\u0D0C\\u0D0E-\\u0D10\\u0D12-\\u0D3A\\u0D3D-\\u0D44\\u0D46-\\u0D48\\u0D4A-\\u0D4E\\u0D54-\\u0D57\\u0D5F-\\u0D63\\u0D66-\\u0D6F\\u0D7A-\\u0D7F\\u0D82\\u0D83\\u0D85-\\u0D96\\u0D9A-\\u0DB1\\u0DB3-\\u0DBB\\u0DBD\\u0DC0-\\u0DC6\\u0DCA\\u0DCF-\\u0DD4\\u0DD6\\u0DD8-\\u0DDF\\u0DE6-\\u0DEF\\u0DF2\\u0DF3\\u0E01-\\u0E3A\\u0E40-\\u0E4E\\u0E50-\\u0E59\\u0E81\\u0E82\\u0E84\\u0E87\\u0E88\\u0E8A\\u0E8D\\u0E94-\\u0E97\\u0E99-\\u0E9F\\u0EA1-\\u0EA3\\u0EA5\\u0EA7\\u0EAA\\u0EAB\\u0EAD-\\u0EB9\\u0EBB-\\u0EBD\\u0EC0-\\u0EC4\\u0EC6\\u0EC8-\\u0ECD\\u0ED0-\\u0ED9\\u0EDC-\\u0EDF\\u0F00\\u0F18\\u0F19\\u0F20-\\u0F29\\u0F35\\u0F37\\u0F39\\u0F3E-\\u0F47\\u0F49-\\u0F6C\\u0F71-\\u0F84\\u0F86-\\u0F97\\u0F99-\\u0FBC\\u0FC6\\u1000-\\u1049\\u1050-\\u109D\\u10A0-\\u10C5\\u10C7\\u10CD\\u10D0-\\u10FA\\u10FC-\\u1248\\u124A-\\u124D\\u1250-\\u1256\\u1258\\u125A-\\u125D\\u1260-\\u1288\\u128A-\\u128D\\u1290-\\u12B0\\u12B2-\\u12B5\\u12B8-\\u12BE\\u12C0\\u12C2-\\u12C5\\u12C8-\\u12D6\\u12D8-\\u1310\\u1312-\\u1315\\u1318-\\u135A\\u135D-\\u135F\\u1369-\\u1371\\u1380-\\u138F\\u13A0-\\u13F5\\u13F8-\\u13FD\\u1401-\\u166C\\u166F-\\u167F\\u1681-\\u169A\\u16A0-\\u16EA\\u16EE-\\u16F8\\u1700-\\u170C\\u170E-\\u1714\\u1720-\\u1734\\u1740-\\u1753\\u1760-\\u176C\\u176E-\\u1770\\u1772\\u1773\\u1780-\\u17D3\\u17D7\\u17DC\\u17DD\\u17E0-\\u17E9\\u180B-\\u180D\\u1810-\\u1819\\u1820-\\u1877\\u1880-\\u18AA\\u18B0-\\u18F5\\u1900-\\u191E\\u1920-\\u192B\\u1930-\\u193B\\u1946-\\u196D\\u1970-\\u1974\\u1980-\\u19AB\\u19B0-\\u19C9\\u19D0-\\u19DA\\u1A00-\\u1A1B\\u1A20-\\u1A5E\\u1A60-\\u1A7C\\u1A7F-\\u1A89\\u1A90-\\u1A99\\u1AA7\\u1AB0-\\u1ABD\\u1B00-\\u1B4B\\u1B50-\\u1B59\\u1B6B-\\u1B73\\u1B80-\\u1BF3\\u1C00-\\u1C37\\u1C40-\\u1C49\\u1C4D-\\u1C7D\\u1C80-\\u1C88\\u1CD0-\\u1CD2\\u1CD4-\\u1CF6\\u1CF8\\u1CF9\\u1D00-\\u1DF5\\u1DFB-\\u1F15\\u1F18-\\u1F1D\\u1F20-\\u1F45\\u1F48-\\u1F4D\\u1F50-\\u1F57\\u1F59\\u1F5B\\u1F5D\\u1F5F-\\u1F7D\\u1F80-\\u1FB4\\u1FB6-\\u1FBC\\u1FBE\\u1FC2-\\u1FC4\\u1FC6-\\u1FCC\\u1FD0-\\u1FD3\\u1FD6-\\u1FDB\\u1FE0-\\u1FEC\\u1FF2-\\u1FF4\\u1FF6-\\u1FFC\\u200C\\u200D\\u203F\\u2040\\u2054\\u2071\\u207F\\u2090-\\u209C\\u20D0-\\u20DC\\u20E1\\u20E5-\\u20F0\\u2102\\u2107\\u210A-\\u2113\\u2115\\u2118-\\u211D\\u2124\\u2126\\u2128\\u212A-\\u2139\\u213C-\\u213F\\u2145-\\u2149\\u214E\\u2160-\\u2188\\u2C00-\\u2C2E\\u2C30-\\u2C5E\\u2C60-\\u2CE4\\u2CEB-\\u2CF3\\u2D00-\\u2D25\\u2D27\\u2D2D\\u2D30-\\u2D67\\u2D6F\\u2D7F-\\u2D96\\u2DA0-\\u2DA6\\u2DA8-\\u2DAE\\u2DB0-\\u2DB6\\u2DB8-\\u2DBE\\u2DC0-\\u2DC6\\u2DC8-\\u2DCE\\u2DD0-\\u2DD6\\u2DD8-\\u2DDE\\u2DE0-\\u2DFF\\u3005-\\u3007\\u3021-\\u302F\\u3031-\\u3035\\u3038-\\u303C\\u3041-\\u3096\\u3099-\\u309F\\u30A1-\\u30FA\\u30FC-\\u30FF\\u3105-\\u312D\\u3131-\\u318E\\u31A0-\\u31BA\\u31F0-\\u31FF\\u3400-\\u4DB5\\u4E00-\\u9FD5\\uA000-\\uA48C\\uA4D0-\\uA4FD\\uA500-\\uA60C\\uA610-\\uA62B\\uA640-\\uA66F\\uA674-\\uA67D\\uA67F-\\uA6F1\\uA717-\\uA71F\\uA722-\\uA788\\uA78B-\\uA7AE\\uA7B0-\\uA7B7\\uA7F7-\\uA827\\uA840-\\uA873\\uA880-\\uA8C5\\uA8D0-\\uA8D9\\uA8E0-\\uA8F7\\uA8FB\\uA8FD\\uA900-\\uA92D\\uA930-\\uA953\\uA960-\\uA97C\\uA980-\\uA9C0\\uA9CF-\\uA9D9\\uA9E0-\\uA9FE\\uAA00-\\uAA36\\uAA40-\\uAA4D\\uAA50-\\uAA59\\uAA60-\\uAA76\\uAA7A-\\uAAC2\\uAADB-\\uAADD\\uAAE0-\\uAAEF\\uAAF2-\\uAAF6\\uAB01-\\uAB06\\uAB09-\\uAB0E\\uAB11-\\uAB16\\uAB20-\\uAB26\\uAB28-\\uAB2E\\uAB30-\\uAB5A\\uAB5C-\\uAB65\\uAB70-\\uABEA\\uABEC\\uABED\\uABF0-\\uABF9\\uAC00-\\uD7A3\\uD7B0-\\uD7C6\\uD7CB-\\uD7FB\\uF900-\\uFA6D\\uFA70-\\uFAD9\\uFB00-\\uFB06\\uFB13-\\uFB17\\uFB1D-\\uFB28\\uFB2A-\\uFB36\\uFB38-\\uFB3C\\uFB3E\\uFB40\\uFB41\\uFB43\\uFB44\\uFB46-\\uFBB1\\uFBD3-\\uFD3D\\uFD50-\\uFD8F\\uFD92-\\uFDC7\\uFDF0-\\uFDFB\\uFE00-\\uFE0F\\uFE20-\\uFE2F\\uFE33\\uFE34\\uFE4D-\\uFE4F\\uFE70-\\uFE74\\uFE76-\\uFEFC\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF3F\\uFF41-\\uFF5A\\uFF66-\\uFFBE\\uFFC2-\\uFFC7\\uFFCA-\\uFFCF\\uFFD2-\\uFFD7\\uFFDA-\\uFFDC]|\\uD800[\\uDC00-\\uDC0B\\uDC0D-\\uDC26\\uDC28-\\uDC3A\\uDC3C\\uDC3D\\uDC3F-\\uDC4D\\uDC50-\\uDC5D\\uDC80-\\uDCFA\\uDD40-\\uDD74\\uDDFD\\uDE80-\\uDE9C\\uDEA0-\\uDED0\\uDEE0\\uDF00-\\uDF1F\\uDF30-\\uDF4A\\uDF50-\\uDF7A\\uDF80-\\uDF9D\\uDFA0-\\uDFC3\\uDFC8-\\uDFCF\\uDFD1-\\uDFD5]|\\uD801[\\uDC00-\\uDC9D\\uDCA0-\\uDCA9\\uDCB0-\\uDCD3\\uDCD8-\\uDCFB\\uDD00-\\uDD27\\uDD30-\\uDD63\\uDE00-\\uDF36\\uDF40-\\uDF55\\uDF60-\\uDF67]|\\uD802[\\uDC00-\\uDC05\\uDC08\\uDC0A-\\uDC35\\uDC37\\uDC38\\uDC3C\\uDC3F-\\uDC55\\uDC60-\\uDC76\\uDC80-\\uDC9E\\uDCE0-\\uDCF2\\uDCF4\\uDCF5\\uDD00-\\uDD15\\uDD20-\\uDD39\\uDD80-\\uDDB7\\uDDBE\\uDDBF\\uDE00-\\uDE03\\uDE05\\uDE06\\uDE0C-\\uDE13\\uDE15-\\uDE17\\uDE19-\\uDE33\\uDE38-\\uDE3A\\uDE3F\\uDE60-\\uDE7C\\uDE80-\\uDE9C\\uDEC0-\\uDEC7\\uDEC9-\\uDEE6\\uDF00-\\uDF35\\uDF40-\\uDF55\\uDF60-\\uDF72\\uDF80-\\uDF91]|\\uD803[\\uDC00-\\uDC48\\uDC80-\\uDCB2\\uDCC0-\\uDCF2]|\\uD804[\\uDC00-\\uDC46\\uDC66-\\uDC6F\\uDC7F-\\uDCBA\\uDCD0-\\uDCE8\\uDCF0-\\uDCF9\\uDD00-\\uDD34\\uDD36-\\uDD3F\\uDD50-\\uDD73\\uDD76\\uDD80-\\uDDC4\\uDDCA-\\uDDCC\\uDDD0-\\uDDDA\\uDDDC\\uDE00-\\uDE11\\uDE13-\\uDE37\\uDE3E\\uDE80-\\uDE86\\uDE88\\uDE8A-\\uDE8D\\uDE8F-\\uDE9D\\uDE9F-\\uDEA8\\uDEB0-\\uDEEA\\uDEF0-\\uDEF9\\uDF00-\\uDF03\\uDF05-\\uDF0C\\uDF0F\\uDF10\\uDF13-\\uDF28\\uDF2A-\\uDF30\\uDF32\\uDF33\\uDF35-\\uDF39\\uDF3C-\\uDF44\\uDF47\\uDF48\\uDF4B-\\uDF4D\\uDF50\\uDF57\\uDF5D-\\uDF63\\uDF66-\\uDF6C\\uDF70-\\uDF74]|\\uD805[\\uDC00-\\uDC4A\\uDC50-\\uDC59\\uDC80-\\uDCC5\\uDCC7\\uDCD0-\\uDCD9\\uDD80-\\uDDB5\\uDDB8-\\uDDC0\\uDDD8-\\uDDDD\\uDE00-\\uDE40\\uDE44\\uDE50-\\uDE59\\uDE80-\\uDEB7\\uDEC0-\\uDEC9\\uDF00-\\uDF19\\uDF1D-\\uDF2B\\uDF30-\\uDF39]|\\uD806[\\uDCA0-\\uDCE9\\uDCFF\\uDEC0-\\uDEF8]|\\uD807[\\uDC00-\\uDC08\\uDC0A-\\uDC36\\uDC38-\\uDC40\\uDC50-\\uDC59\\uDC72-\\uDC8F\\uDC92-\\uDCA7\\uDCA9-\\uDCB6]|\\uD808[\\uDC00-\\uDF99]|\\uD809[\\uDC00-\\uDC6E\\uDC80-\\uDD43]|[\\uD80C\\uD81C-\\uD820\\uD840-\\uD868\\uD86A-\\uD86C\\uD86F-\\uD872][\\uDC00-\\uDFFF]|\\uD80D[\\uDC00-\\uDC2E]|\\uD811[\\uDC00-\\uDE46]|\\uD81A[\\uDC00-\\uDE38\\uDE40-\\uDE5E\\uDE60-\\uDE69\\uDED0-\\uDEED\\uDEF0-\\uDEF4\\uDF00-\\uDF36\\uDF40-\\uDF43\\uDF50-\\uDF59\\uDF63-\\uDF77\\uDF7D-\\uDF8F]|\\uD81B[\\uDF00-\\uDF44\\uDF50-\\uDF7E\\uDF8F-\\uDF9F\\uDFE0]|\\uD821[\\uDC00-\\uDFEC]|\\uD822[\\uDC00-\\uDEF2]|\\uD82C[\\uDC00\\uDC01]|\\uD82F[\\uDC00-\\uDC6A\\uDC70-\\uDC7C\\uDC80-\\uDC88\\uDC90-\\uDC99\\uDC9D\\uDC9E]|\\uD834[\\uDD65-\\uDD69\\uDD6D-\\uDD72\\uDD7B-\\uDD82\\uDD85-\\uDD8B\\uDDAA-\\uDDAD\\uDE42-\\uDE44]|\\uD835[\\uDC00-\\uDC54\\uDC56-\\uDC9C\\uDC9E\\uDC9F\\uDCA2\\uDCA5\\uDCA6\\uDCA9-\\uDCAC\\uDCAE-\\uDCB9\\uDCBB\\uDCBD-\\uDCC3\\uDCC5-\\uDD05\\uDD07-\\uDD0A\\uDD0D-\\uDD14\\uDD16-\\uDD1C\\uDD1E-\\uDD39\\uDD3B-\\uDD3E\\uDD40-\\uDD44\\uDD46\\uDD4A-\\uDD50\\uDD52-\\uDEA5\\uDEA8-\\uDEC0\\uDEC2-\\uDEDA\\uDEDC-\\uDEFA\\uDEFC-\\uDF14\\uDF16-\\uDF34\\uDF36-\\uDF4E\\uDF50-\\uDF6E\\uDF70-\\uDF88\\uDF8A-\\uDFA8\\uDFAA-\\uDFC2\\uDFC4-\\uDFCB\\uDFCE-\\uDFFF]|\\uD836[\\uDE00-\\uDE36\\uDE3B-\\uDE6C\\uDE75\\uDE84\\uDE9B-\\uDE9F\\uDEA1-\\uDEAF]|\\uD838[\\uDC00-\\uDC06\\uDC08-\\uDC18\\uDC1B-\\uDC21\\uDC23\\uDC24\\uDC26-\\uDC2A]|\\uD83A[\\uDC00-\\uDCC4\\uDCD0-\\uDCD6\\uDD00-\\uDD4A\\uDD50-\\uDD59]|\\uD83B[\\uDE00-\\uDE03\\uDE05-\\uDE1F\\uDE21\\uDE22\\uDE24\\uDE27\\uDE29-\\uDE32\\uDE34-\\uDE37\\uDE39\\uDE3B\\uDE42\\uDE47\\uDE49\\uDE4B\\uDE4D-\\uDE4F\\uDE51\\uDE52\\uDE54\\uDE57\\uDE59\\uDE5B\\uDE5D\\uDE5F\\uDE61\\uDE62\\uDE64\\uDE67-\\uDE6A\\uDE6C-\\uDE72\\uDE74-\\uDE77\\uDE79-\\uDE7C\\uDE7E\\uDE80-\\uDE89\\uDE8B-\\uDE9B\\uDEA1-\\uDEA3\\uDEA5-\\uDEA9\\uDEAB-\\uDEBB]|\\uD869[\\uDC00-\\uDED6\\uDF00-\\uDFFF]|\\uD86D[\\uDC00-\\uDF34\\uDF40-\\uDFFF]|\\uD86E[\\uDC00-\\uDC1D\\uDC20-\\uDFFF]|\\uD873[\\uDC00-\\uDEA1]|\\uD87E[\\uDC00-\\uDE1D]|\\uDB40[\\uDD00-\\uDDEF])';

exports.UnicodeIDStart = UnicodeIDStart;
exports.UnicodeIDContinue = UnicodeIDContinue;

},{}],395:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _setGlobalVars = require('./setGlobalVars.js');

var _setGlobalVars2 = _interopRequireDefault(_setGlobalVars);

var _nodeWebSQL = require('./nodeWebSQL');

var _nodeWebSQL2 = _interopRequireDefault(_nodeWebSQL);

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

var _UnicodeIdentifiers = require('./UnicodeIdentifiers');

var UnicodeIdentifiers = _interopRequireWildcard(_UnicodeIdentifiers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Importing "websql" would not gain us SQLite config ability
_CFG2.default.win = { openDatabase: _nodeWebSQL2.default };

var __setGlobalVars = function __setGlobalVars(idb) {
    idb = (0, _setGlobalVars2.default)(idb);
    idb.shimIndexedDB.__setUnicodeIdentifiers(UnicodeIdentifiers);
};

exports.default = __setGlobalVars;
module.exports = exports['default'];

},{"./CFG.js":381,"./UnicodeIdentifiers":394,"./nodeWebSQL":396,"./setGlobalVars.js":398}],396:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _custom = require('websql/custom');

var _custom2 = _interopRequireDefault(_custom);

var _SQLiteDatabase = require('../node_modules/websql/lib/sqlite/SQLiteDatabase');

var _SQLiteDatabase2 = _interopRequireDefault(_SQLiteDatabase);

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function wrappedSQLiteDatabase(name) {
    var db = new _SQLiteDatabase2.default(name);
    if (_CFG2.default.sqlBusyTimeout) {
        db._db.configure('busyTimeout', _CFG2.default.sqlBusyTimeout); // Default is 1000
    }
    if (_CFG2.default.sqlTrace) {
        db._db.configure('trace', _CFG2.default.sqlTrace);
    }
    if (_CFG2.default.sqlProfile) {
        db._db.configure('profile', _CFG2.default.sqlProfile);
    }
    return db;
}

var nodeWebSQL = (0, _custom2.default)(wrappedSQLiteDatabase);
exports.default = nodeWebSQL;
module.exports = exports['default'];

},{"../node_modules/websql/lib/sqlite/SQLiteDatabase":376,"./CFG.js":381,"websql/custom":374}],397:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _DOMException = require('./DOMException.js');

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Todo: polyfill IDBVersionChangeEvent, IDBOpenDBRequest?

/**
 * Polyfills missing features in the browser's native IndexedDB implementation.
 * This is used for browsers that DON'T support WebSQL but DO support IndexedDB
 */
function polyfill() {
    if (navigator.userAgent.match(/MSIE/) || navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/Edge/)) {
        // Internet Explorer's native IndexedDB does not support compound keys
        compoundKeyPolyfill();
    }
}

/**
 * Polyfills support for compound keys
 */
function compoundKeyPolyfill(IDBCursor, IDBCursorWithValue, IDBDatabase, IDBFactory, IDBIndex, IDBKeyRange, IDBObjectStore, IDBRequest, IDBTransaction) {
    var cmp = IDBFactory.prototype.cmp;
    var createObjectStore = IDBDatabase.prototype.createObjectStore;
    var createIndex = IDBObjectStore.prototype.createIndex;
    var add = IDBObjectStore.prototype.add;
    var put = IDBObjectStore.prototype.put;
    var indexGet = IDBIndex.prototype.get;
    var indexGetKey = IDBIndex.prototype.getKey;
    var indexCursor = IDBIndex.prototype.openCursor;
    var indexKeyCursor = IDBIndex.prototype.openKeyCursor;
    var storeGet = IDBObjectStore.prototype.get;
    var storeDelete = IDBObjectStore.prototype.delete;
    var storeCursor = IDBObjectStore.prototype.openCursor;
    var storeKeyCursor = IDBObjectStore.prototype.openKeyCursor;
    var bound = IDBKeyRange.bound;
    var upperBound = IDBKeyRange.upperBound;
    var lowerBound = IDBKeyRange.lowerBound;
    var only = IDBKeyRange.only;
    var requestResult = Object.getOwnPropertyDescriptor(IDBRequest.prototype, 'result');
    var cursorPrimaryKey = Object.getOwnPropertyDescriptor(IDBCursor.prototype, 'primaryKey');
    var cursorKey = Object.getOwnPropertyDescriptor(IDBCursor.prototype, 'key');
    var cursorValue = Object.getOwnPropertyDescriptor(IDBCursorWithValue.prototype, 'value');

    IDBFactory.prototype.cmp = function (key1, key2) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key1)) {
            args[0] = encodeCompoundKey(key1);
        }
        if (Array.isArray(key2)) {
            args[1] = encodeCompoundKey(key2);
        }
        return cmp.apply(this, args);
    };

    IDBDatabase.prototype.createObjectStore = function (name, opts) {
        if (opts && Array.isArray(opts.keyPath)) {
            opts.keyPath = encodeCompoundKeyPath(opts.keyPath);
        }
        return createObjectStore.apply(this, arguments);
    };

    IDBObjectStore.prototype.createIndex = function (name, keyPath, opts) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(keyPath)) {
            args[1] = encodeCompoundKeyPath(keyPath);
        }
        return createIndex.apply(this, args);
    };

    IDBObjectStore.prototype.add = function () /* value, key */{
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return this.__insertData(add, args);
    };

    IDBObjectStore.prototype.put = function () /* value, key */{
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
        }

        return this.__insertData(put, args);
    };

    IDBObjectStore.prototype.__insertData = function (method, args) {
        args = Array.prototype.slice.call(args);
        var value = args[0];
        var key = args[1];

        // out-of-line key
        if (Array.isArray(key)) {
            args[1] = encodeCompoundKey(key);
        }

        if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
            // inline key
            if (isCompoundKey(this.keyPath)) {
                setInlineCompoundKey(value, this.keyPath);
            }

            // inline indexes
            for (var i = 0; i < this.indexNames.length; i++) {
                var index = this.index(this.indexNames[i]);
                if (isCompoundKey(index.keyPath)) {
                    try {
                        setInlineCompoundKey(value, index.keyPath, index.multiEntry);
                    } catch (e) {
                        // The value doesn't have a valid key for this index.
                    }
                }
            }
        }
        return method.apply(this, args);
    };

    IDBIndex.prototype.get = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return indexGet.apply(this, args);
    };

    IDBIndex.prototype.getKey = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return indexGetKey.apply(this, args);
    };

    IDBIndex.prototype.openCursor = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return indexCursor.apply(this, args);
    };

    IDBIndex.prototype.openKeyCursor = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return indexKeyCursor.apply(this, args);
    };

    IDBObjectStore.prototype.get = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return storeGet.apply(this, args);
    };

    IDBObjectStore.prototype.delete = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return storeDelete.apply(this, args);
    };

    IDBObjectStore.prototype.openCursor = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return storeCursor.apply(this, args);
    };

    IDBObjectStore.prototype.openKeyCursor = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return storeKeyCursor.apply(this, args);
    };

    IDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(lower)) {
            args[0] = encodeCompoundKey(lower);
        }
        if (Array.isArray(upper)) {
            args[1] = encodeCompoundKey(upper);
        }
        return bound.apply(IDBKeyRange, args);
    };

    IDBKeyRange.upperBound = function (key, open) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return upperBound.apply(IDBKeyRange, args);
    };

    IDBKeyRange.lowerBound = function (key, open) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return lowerBound.apply(IDBKeyRange, args);
    };

    IDBKeyRange.only = function (key) {
        var args = Array.prototype.slice.call(arguments);
        if (Array.isArray(key)) {
            args[0] = encodeCompoundKey(key);
        }
        return only.apply(IDBKeyRange, args);
    };

    Object.defineProperty(IDBRequest.prototype, 'result', {
        enumerable: requestResult.enumerable,
        configurable: requestResult.configurable,
        get: function get() {
            var result = requestResult.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });

    Object.defineProperty(IDBCursor.prototype, 'primaryKey', {
        enumerable: cursorPrimaryKey.enumerable,
        configurable: cursorPrimaryKey.configurable,
        get: function get() {
            var result = cursorPrimaryKey.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });

    Object.defineProperty(IDBCursor.prototype, 'key', {
        enumerable: cursorKey.enumerable,
        configurable: cursorKey.configurable,
        get: function get() {
            var result = cursorKey.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });

    Object.defineProperty(IDBCursorWithValue.prototype, 'value', {
        enumerable: cursorValue.enumerable,
        configurable: cursorValue.configurable,
        get: function get() {
            var result = cursorValue.get.call(this);
            return removeInlineCompoundKey(result);
        }
    });
}

var compoundKeysPropertyName = '__$$compoundKey';
var propertySeparatorRegExp = /\$\$/g;
var propertySeparator = '$$$$'; // "$$" after RegExp escaping
var keySeparator = '$_$';

function isCompoundKey(keyPath) {
    return keyPath && keyPath.indexOf(compoundKeysPropertyName + '.') === 0;
}

function encodeCompoundKeyPath(keyPath) {
    // Encoded dotted properties
    // ["name.first", "name.last"] ==> ["name$$first", "name$$last"]
    for (var i = 0; i < keyPath.length; i++) {
        keyPath[i] = keyPath[i].replace(/\./g, propertySeparator);
    }

    // Encode the array as a single property
    // ["name$$first", "name$$last"] => "__$$compoundKey.name$$first$_$name$$last"
    return compoundKeysPropertyName + '.' + keyPath.join(keySeparator);
}

function decodeCompoundKeyPath(keyPath) {
    // Remove the "__$$compoundKey." prefix
    keyPath = keyPath.substr(compoundKeysPropertyName.length + 1);

    // Split the properties into an array
    // "name$$first$_$name$$last" ==> ["name$$first", "name$$last"]
    keyPath = keyPath.split(keySeparator);

    // Decode dotted properties
    // ["name$$first", "name$$last"] ==> ["name.first", "name.last"]
    for (var i = 0; i < keyPath.length; i++) {
        keyPath[i] = keyPath[i].replace(propertySeparatorRegExp, '.');
    }
    return keyPath;
}

function setInlineCompoundKey(value, encodedKeyPath, multiEntry) {
    // Encode the key
    var keyPath = decodeCompoundKeyPath(encodedKeyPath);
    var key = _Key2.default.evaluateKeyPathOnValue(value, keyPath, multiEntry);
    var encodedKey = encodeCompoundKey(key);

    // Store the encoded key inline
    encodedKeyPath = encodedKeyPath.substr(compoundKeysPropertyName.length + 1);
    value[compoundKeysPropertyName] = value[compoundKeysPropertyName] || {};
    value[compoundKeysPropertyName][encodedKeyPath] = encodedKey;
}

function removeInlineCompoundKey(value) {
    if (typeof value === 'string' && isCompoundKey(value)) {
        return decodeCompoundKey(value);
    } else if (value && _typeof(value[compoundKeysPropertyName]) === 'object') {
        delete value[compoundKeysPropertyName];
    }
    return value;
}

function encodeCompoundKey(key) {
    // Validate and encode the key
    _Key2.default.convertValueToKey(key);
    key = _Key2.default.encode(key);

    // Prepend the "__$$compoundKey." prefix
    key = compoundKeysPropertyName + '.' + key;

    validateKeyLength(key);
    return key;
}

function decodeCompoundKey(key) {
    validateKeyLength(key);

    // Remove the "__$$compoundKey." prefix
    key = key.substr(compoundKeysPropertyName.length + 1);

    // Decode the key
    key = _Key2.default.decode(key);
    return key;
}

function validateKeyLength(key) {
    // BUG: Internet Explorer truncates string keys at 889 characters
    if (key.length > 889) {
        throw (0, _DOMException.createDOMException)('DataError', 'The encoded key is ' + key.length + ' characters long, but IE only allows 889 characters. Consider replacing numeric keys with strings to reduce the encoded length.');
    }
}

exports.default = polyfill;
module.exports = exports['default'];

},{"./DOMException.js":382,"./Key.js":392}],398:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; // Object.assign in EventTarget, etc.


require('babel-polyfill');

var _Event = require('./Event.js');

var _IDBCursor = require('./IDBCursor.js');

var _IDBRequest = require('./IDBRequest.js');

var _IDBFactory = require('./IDBFactory.js');

var _IDBKeyRange = require('./IDBKeyRange.js');

var _IDBKeyRange2 = _interopRequireDefault(_IDBKeyRange);

var _IDBObjectStore = require('./IDBObjectStore.js');

var _IDBObjectStore2 = _interopRequireDefault(_IDBObjectStore);

var _IDBIndex = require('./IDBIndex.js');

var _IDBIndex2 = _interopRequireDefault(_IDBIndex);

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

var _IDBDatabase = require('./IDBDatabase.js');

var _IDBDatabase2 = _interopRequireDefault(_IDBDatabase);

var _polyfill = require('./polyfill.js');

var _polyfill2 = _interopRequireDefault(_polyfill);

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var glob = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : self;
glob._babelPolyfill = false; // http://stackoverflow.com/questions/31282702/conflicting-use-of-babel-register

var IDB = void 0;

function shim(name, value) {
    try {
        // Try setting the property. This will fail if the property is read-only.
        IDB[name] = value;
    } catch (e) {
        console.log(e);
    }
    if (IDB[name] !== value && Object.defineProperty) {
        // Setting a read-only property failed, so try re-defining the property
        try {
            var desc = { value: value };
            if (name === 'indexedDB') {
                desc.writable = false; // Make explicit for Babel
            }
            Object.defineProperty(IDB, name, desc);
        } catch (e) {
            // With `indexedDB`, PhantomJS fails here and below but
            //  not above, while Chrome is reverse (and Firefox doesn't
            //  get here since no WebSQL to use for shimming)
        }

        if (IDB[name] !== value) {
            typeof console !== 'undefined' && console.warn && console.warn('Unable to shim ' + name);
        }
    }
}

function setConfig(prop, val) {
    if (prop && (typeof prop === 'undefined' ? 'undefined' : _typeof(prop)) === 'object') {
        for (var p in prop) {
            setConfig(p, prop[p]);
        }
        return;
    }
    if (!(prop in _CFG2.default)) {
        throw new Error(prop + ' is not a valid configuration property');
    }
    _CFG2.default[prop] = val;
}

function setGlobalVars(idb, initialConfig) {
    if (initialConfig) {
        setConfig(initialConfig);
    }
    IDB = idb || (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {});
    shim('shimIndexedDB', _IDBFactory.shimIndexedDB);
    if (IDB.shimIndexedDB) {
        IDB.shimIndexedDB.__useShim = function () {
            if (_CFG2.default.win.openDatabase !== undefined) {
                // Polyfill ALL of IndexedDB, using WebSQL
                shim('indexedDB', _IDBFactory.shimIndexedDB);
                shim('IDBFactory', _IDBFactory.IDBFactory);
                shim('IDBDatabase', _IDBDatabase2.default);
                shim('IDBObjectStore', _IDBObjectStore2.default);
                shim('IDBIndex', _IDBIndex2.default);
                shim('IDBTransaction', _IDBTransaction2.default);
                shim('IDBCursor', _IDBCursor.IDBCursor);
                shim('IDBCursorWithValue', _IDBCursor.IDBCursorWithValue);
                shim('IDBKeyRange', _IDBKeyRange2.default);
                shim('IDBRequest', _IDBRequest.IDBRequest);
                shim('IDBOpenDBRequest', _IDBRequest.IDBOpenDBRequest);
                shim('IDBVersionChangeEvent', _Event.IDBVersionChangeEvent);
            } else if (_typeof(IDB.indexedDB) === 'object') {
                // Polyfill the missing IndexedDB features (no need for IDBEnvironment, the window containing indexedDB itself))
                (0, _polyfill2.default)(_IDBCursor.IDBCursor, _IDBCursor.IDBCursorWithValue, _IDBDatabase2.default, _IDBFactory.IDBFactory, _IDBIndex2.default, _IDBKeyRange2.default, _IDBObjectStore2.default, _IDBRequest.IDBRequest, _IDBTransaction2.default);
            }
        };

        IDB.shimIndexedDB.__debug = function (val) {
            _CFG2.default.DEBUG = val;
        };
        IDB.shimIndexedDB.__setConfig = setConfig;
        IDB.shimIndexedDB.__getConfig = function (prop) {
            if (!(prop in _CFG2.default)) {
                throw new Error(prop + ' is not a valid configuration property');
            }
            return _CFG2.default[prop];
        };
        IDB.shimIndexedDB.__setUnicodeIdentifiers = function (ui) {
            setConfig({
                UnicodeIDStart: ui.UnicodeIDStart,
                UnicodeIDContinue: ui.UnicodeIDContinue
            });
        };
    }

    // Workaround to prevent an error in Firefox
    if (!('indexedDB' in IDB)) {
        IDB.indexedDB = IDB.indexedDB || IDB.webkitIndexedDB || IDB.mozIndexedDB || IDB.oIndexedDB || IDB.msIndexedDB;
    }

    // Detect browsers with known IndexedDb issues (e.g. Android pre-4.4)
    var poorIndexedDbSupport = false;
    if (typeof navigator !== 'undefined' && ( // Ignore Node or other environments

    // Bad non-Chrome Android support
    navigator.userAgent.match(/Android (?:2|3|4\.[0-3])/) && !navigator.userAgent.match(/Chrome/) ||
    // Bad non-Safari iOS9 support (see <https://github.com/axemclion/IndexedDBShim/issues/252>)
    (navigator.userAgent.indexOf('Safari') === -1 || navigator.userAgent.indexOf('Chrome') > -1) && // Exclude genuine Safari: http://stackoverflow.com/a/7768006/271577
    // Detect iOS: http://stackoverflow.com/questions/9038625/detect-if-device-is-ios/9039885#9039885
    // and detect version 9: http://stackoverflow.com/a/26363560/271577
    /(iPad|iPhone|iPod).* os 9_/i.test(navigator.userAgent) && !window.MSStream // But avoid IE11
    )) {
        poorIndexedDbSupport = true;
    }
    if (!_CFG2.default.DEFAULT_DB_SIZE) {
        _CFG2.default.DEFAULT_DB_SIZE = ( // Safari currently requires larger size: (We don't need a larger size for Node as node-websql doesn't use this info)
        // https://github.com/axemclion/IndexedDBShim/issues/41
        // https://github.com/axemclion/IndexedDBShim/issues/115
        typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1 ? 25 : 4) * 1024 * 1024;
    }

    if ((IDB.indexedDB === undefined || !IDB.indexedDB || poorIndexedDbSupport) && _CFG2.default.win.openDatabase !== undefined) {
        IDB.shimIndexedDB.__useShim();
    } else {
        IDB.IDBDatabase = IDB.IDBDatabase || IDB.webkitIDBDatabase;
        IDB.IDBTransaction = IDB.IDBTransaction || IDB.webkitIDBTransaction || {};
        IDB.IDBCursor = IDB.IDBCursor || IDB.webkitIDBCursor;
        IDB.IDBKeyRange = IDB.IDBKeyRange || IDB.webkitIDBKeyRange;
    }
    return IDB;
}

exports.default = setGlobalVars;
module.exports = exports['default'];

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./CFG.js":381,"./Event.js":383,"./IDBCursor.js":384,"./IDBDatabase.js":385,"./IDBFactory.js":386,"./IDBIndex.js":387,"./IDBKeyRange.js":388,"./IDBObjectStore.js":389,"./IDBRequest.js":390,"./IDBTransaction.js":391,"./polyfill.js":397,"babel-polyfill":3}],399:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.isValidKeyPath = exports.defineReadonlyProperties = exports.throwIfNotClonable = exports.isFile = exports.isRegExp = exports.isBlob = exports.isDate = exports.isObj = exports.instanceOf = exports.sqlLIKEEscape = exports.escapeIndexName = exports.escapeIndex = exports.escapeStore = exports.unescapeDatabaseName = exports.escapeDatabaseName = exports.quote = exports.unescapeNUL = exports.escapeNUL = exports.StringList = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _DOMException = require('./DOMException.js');

var _CFG = require('./CFG.js');

var _CFG2 = _interopRequireDefault(_CFG);

var _cyclonejs = require('cyclonejs');

var _cyclonejs2 = _interopRequireDefault(_cyclonejs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cleanInterface = false;

var testObject = { test: true };
// Test whether Object.defineProperty really works.
if (Object.defineProperty) {
    try {
        Object.defineProperty(testObject, 'test', { enumerable: false });
        if (testObject.test) {
            cleanInterface = true;
        }
    } catch (e) {
        // Object.defineProperty does not work as intended.
    }
}

/**
 * Shim the DOMStringList object.
 *
 */
var StringList = function StringList() {
    this.length = 0;
    this._items = [];
    // Internal functions on the prototype have been made non-enumerable below.
    if (cleanInterface) {
        Object.defineProperties(this, {
            '_items': {
                enumerable: false
            },
            'length': {
                enumerable: false
            }
        });
    }
};
StringList.prototype = {
    // Interface.
    contains: function contains(str) {
        return this._items.includes(str);
    },
    item: function item(key) {
        return this._items[key];
    },

    // Helpers. Should only be used internally.
    clone: function clone() {
        var stringList = new StringList();
        stringList._items = this._items.slice();
        stringList.length = this.length;
        stringList.addIndexes();
        return stringList;
    },
    addIndexes: function addIndexes() {
        for (var i = 0; i < this._items.length; i++) {
            this[i] = this._items[i];
        }
    },
    sortList: function sortList() {
        // http://w3c.github.io/IndexedDB/#sorted-list
        // https://tc39.github.io/ecma262/#sec-abstract-relational-comparison
        this._items.sort();
        this.addIndexes();
        return this._items;
    },
    forEach: function forEach(cb, thisArg) {
        this._items.forEach(cb, thisArg);
    },
    map: function map(cb, thisArg) {
        return this._items.map(cb, thisArg);
    },
    indexOf: function indexOf(str) {
        return this._items.indexOf(str);
    },
    push: function push(item) {
        this._items.push(item);
        this.length++;
        this.sortList();
    },
    splice: function splice() /* index, howmany, item1, ..., itemX */{
        var _items;

        (_items = this._items).splice.apply(_items, arguments);
        this.length = this._items.length;
        for (var i in this) {
            if (i === String(parseInt(i, 10))) {
                delete this[i];
            }
        }
        this.sortList();
    }
};
if (cleanInterface) {
    for (var i in {
        'addIndexes': false,
        'sortList': false,
        'forEach': false,
        'map': false,
        'indexOf': false,
        'push': false,
        'splice': false
    }) {
        Object.defineProperty(StringList.prototype, i, {
            enumerable: false
        });
    }
}

function escapeNULAndCasing(arg) {
    // http://stackoverflow.com/a/6701665/271577
    return arg.replace(/\^/g, '^^').replace(/\0/g, '^0')
    // We need to avoid tables being treated as duplicates based on SQLite's case-insensitive table and column names
    // http://stackoverflow.com/a/17215009/271577
    // See also https://www.sqlite.org/faq.html#q18 re: Unicode case-insensitive not working
    .replace(/([A-Z])/g, '^$1').replace(/([\uD800-\uDBFF])(?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])([\uDC00-\uDFFF])/g, function (_, unmatchedHighSurrogate, unmatchedLowSurrogate) {
        if (unmatchedHighSurrogate) {
            return '^2' + unmatchedHighSurrogate + '\uDC00'; // Add a low surrogate for compatibility with `node-sqlite3`: http://bugs.python.org/issue12569 and http://stackoverflow.com/a/6701665/271577
        }
        return '^3\uD800' + unmatchedLowSurrogate;
    });
}

function escapeNUL(arg) {
    return arg.replace(/\^/g, '^^').replace(/\0/g, '^0');
}
function unescapeNUL(arg) {
    return arg.replace(/^0/g, '\0').replace(/\^\^/g, '^');
}

function sqlEscape(arg) {
    // https://www.sqlite.org/lang_keywords.html
    // http://stackoverflow.com/a/6701665/271577
    // There is no need to escape ', `, or [], as
    //   we should always be within double quotes
    // NUL should have already been stripped
    return arg.replace(/"/g, '""');
}

function quote(arg) {
    return '"' + sqlEscape(arg) + '"';
}

function escapeDatabaseName(db) {
    if (_CFG2.default.escapeDatabaseName) {
        // We at least ensure NUL is escaped by default, but we need to still
        //   handle empty string and possibly also length (potentially
        //   throwing if too long), escaping casing (including Unicode?),
        //   and escaping special characters depending on file system
        return _CFG2.default.escapeDatabaseName(escapeNUL(db));
    }
    db = 'D_' + escapeNULAndCasing(db);
    if (_CFG2.default.databaseCharacterEscapeList !== false) {
        db = db.replace(_CFG2.default.databaseCharacterEscapeList ? new RegExp(_CFG2.default.databaseCharacterEscapeList, 'g') : /[\u0000-\u001F\u007F"*/:<>?\\|]/g, function (n0) {
            return '^1' + n0.charCodeAt().toString(16).padStart(2, '0');
        });
    }
    if (_CFG2.default.databaseNameLengthLimit !== false && db.length >= (_CFG2.default.databaseNameLengthLimit || 254)) {
        throw new Error('Unexpectedly long database name supplied; length limit required for Node compatibility; passed length: ' + db.length + '; length limit setting: ' + (_CFG2.default.databaseNameLengthLimit || 254) + '.');
    }
    return db; // Shouldn't have quoting (do we even need NUL/case escaping here?)
}

// Not in use internally but supplied for convenience
function unescapeDatabaseName(db) {
    if (_CFG2.default.unescapeDatabaseName) {
        // We at least ensure NUL is unescaped by default, but we need to still
        //   handle empty string and possibly also length (potentially
        //   throwing if too long), unescaping casing (including Unicode?),
        //   and unescaping special characters depending on file system
        return _CFG2.default.unescapeDatabaseName(unescapeNUL(db));
    }

    return db.slice(2) // D_
    .replace(/(\^+)1([0-9a-f]{2})/g, function (_, esc, hex) {
        return esc % 2 ? String.fromCharCode(parseInt(hex, 16)) : _;
    }) // databaseCharacterEscapeList
    .replace(/(\^+)3\uD800([\uDC00-\uDFFF])/g, function (_, esc, lowSurr) {
        return esc % 2 ? lowSurr : _;
    }).replace(/(\^+)2([\uD800-\uDBFF])\uDC00/g, function (_, esc, highSurr) {
        return esc % 2 ? highSurr : _;
    }).replace(/(\^+)([A-Z])/g, function (_, esc, upperCase) {
        return esc % 2 ? upperCase : _;
    }).replace(/(\^+)0/g, function (_, esc) {
        return esc % 2 ? '\0' : _;
    }).replace(/\^\^/g, '^');
}

function escapeStore(store) {
    return quote('s_' + escapeNULAndCasing(store));
}

function escapeIndex(index) {
    return quote('_' + escapeNULAndCasing(index));
}

function escapeIndexName(index) {
    return '_' + escapeNULAndCasing(index);
}

function sqlLIKEEscape(str) {
    // https://www.sqlite.org/lang_expr.html#like
    return sqlEscape(str).replace(/\^/g, '^^');
}

// Babel doesn't seem to provide a means of using the `instanceof` operator with Symbol.hasInstance (yet?)
function instanceOf(obj, Clss) {
    return Clss[Symbol.hasInstance](obj);
}

function isObj(obj) {
    return obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
}

function isDate(obj) {
    return isObj(obj) && typeof obj.getDate === 'function';
}

function isBlob(obj) {
    return isObj(obj) && typeof obj.size === 'number' && typeof obj.slice === 'function';
}

function isRegExp(obj) {
    return isObj(obj) && typeof obj.flags === 'string' && typeof obj.exec === 'function';
}

function isFile(obj) {
    return isObj(obj) && typeof obj.name === 'string' && isBlob(obj);
}

/*
// Todo: Uncomment and use with ArrayBuffer encoding/decoding when ready
function isArrayBufferOrView (obj) {
    return isObj(obj) && typeof obj.byteLength === 'number' && (
        typeof obj.slice === 'function' || // `TypedArray` (view on buffer) or `ArrayBuffer`
        typeof obj.getFloat64 === 'function' // `DataView` (view on buffer)
    );
}
*/

function isNotClonable(value) {
    try {
        _cyclonejs2.default.clone(value);
        return false;
    } catch (err) {
        return true;
    }
}

function throwIfNotClonable(value, errMsg) {
    if (isNotClonable(value)) {
        throw (0, _DOMException.createDOMException)('DataCloneError', errMsg);
    }
}

function defineReadonlyProperties(obj, props) {
    props = typeof props === 'string' ? [props] : props;
    props.forEach(function (prop) {
        Object.defineProperty(obj, '__' + prop, {
            enumerable: false,
            configurable: false,
            writable: true
        });
        Object.defineProperty(obj, prop, {
            enumerable: true,
            configurable: true,
            get: function get() {
                return this['__' + prop];
            }
        });
    });
}

var HexDigit = '[0-9a-fA-F]';
// The commented out line below is technically the grammar, with a SyntaxError
//   to occur if larger than U+10FFFF, but we will prevent the error by
//   establishing the limit in regular expressions
// const HexDigits = HexDigit + HexDigit + '*';
var HexDigits = '0*(?:' + HexDigit + '{1,5}|10' + HexDigit + '{4})*';
var UnicodeEscapeSequence = '(?:u' + HexDigit + '{4}|u{' + HexDigits + '})';

function isIdentifier(item) {
    // For load-time and run-time performance, we don't provide the complete regular
    //   expression for identifiers, but these can be passed in, using the expressions
    //   found at https://gist.github.com/brettz9/b4cd6821d990daa023b2e604de371407
    // ID_Start (includes Other_ID_Start)
    var UnicodeIDStart = _CFG2.default.UnicodeIDStart || '[$A-Z_a-z]';
    // ID_Continue (includes Other_ID_Continue)
    var UnicodeIDContinue = _CFG2.default.UnicodeIDContinue || '[$0-9A-Z_a-z]';
    var IdentifierStart = '(?:' + UnicodeIDStart + '|[$_]|\\\\' + UnicodeEscapeSequence + ')';
    var IdentifierPart = '(?:' + UnicodeIDContinue + '|[$_]|\\\\' + UnicodeEscapeSequence + '|\\u200C|\\u200D)';
    return new RegExp('^' + IdentifierStart + IdentifierPart + '*$').test(item);
}

function isValidKeyPathString(keyPathString) {
    return typeof keyPathString === 'string' && (keyPathString === '' || isIdentifier(keyPathString) || keyPathString.split('.').every(isIdentifier));
}

function isValidKeyPath(keyPath) {
    return isValidKeyPathString(keyPath) || Array.isArray(keyPath) && keyPath.length &&
    // Convert array from sparse to dense http://www.2ality.com/2012/06/dense-arrays.html
    Array.apply(null, keyPath).every(function (kpp) {
        // If W3C tests are accurate, it appears sequence<DOMString> implies `toString()`
        // See also https://heycam.github.io/webidl/#idl-DOMString
        return isValidKeyPathString(kpp.toString());
    });
}

exports.StringList = StringList;
exports.escapeNUL = escapeNUL;
exports.unescapeNUL = unescapeNUL;
exports.quote = quote;
exports.escapeDatabaseName = escapeDatabaseName;
exports.unescapeDatabaseName = unescapeDatabaseName;
exports.escapeStore = escapeStore;
exports.escapeIndex = escapeIndex;
exports.escapeIndexName = escapeIndexName;
exports.sqlLIKEEscape = sqlLIKEEscape;
exports.instanceOf = instanceOf;
exports.isObj = isObj;
exports.isDate = isDate;
exports.isBlob = isBlob;
exports.isRegExp = isRegExp;
exports.isFile = isFile;
exports.throwIfNotClonable = throwIfNotClonable;
exports.defineReadonlyProperties = defineReadonlyProperties;
exports.isValidKeyPath = isValidKeyPath;

},{"./CFG.js":381,"./DOMException.js":382,"cyclonejs":299}]},{},[395])(395)
});
(function(idbModules){
  /**
   * A utility method to callback onsuccess, onerror, etc as soon as the calling function's context is over
   * @param {Object} fn
   * @param {Object} context
   * @param {Object} argArray
   */
  function callback(fn, context, event, func){
    //window.setTimeout(function(){
    event.target = context;
    (typeof context[fn] === "function") && context[fn].apply(context, [event]);
    (typeof func === "function") && func();
    //}, 1);
  }
  
  /**
   * Throws a new DOM Exception,
   * @param {Object} name
   * @param {Object} message
   * @param {Object} error
   */
  function throwDOMException(name, message, error){
    DEBUG && logger.log(name, message, error);
    var e = new DOMException.constructor(0, message);
    e.name = name;
    e.message = message;
//    e.stack = arguments.callee.caller;
    throw e;
  }
  
  /**
   * Shim the DOMStringList object.
   * 
   */
  var StringList = function() {
    this.length = 0;
    this._items = [];
  };
  StringList.prototype = {
    // Interface.
    contains: function(str) {
      return -1 !== this._items.indexOf(str);
    },
    item: function(key) {
      return this._items[key];
    },

    // Helpers. Should only be used internally.
    indexOf: function(str) {
      return this._items.indexOf(str);
    },
    push: function(item) {
      this._items.push(item);
      this.length += 1;
    },
    splice: function(/*index, howmany, item1, ..., itemX*/) {
      this._items.splice.apply(this._items, arguments);
      this.length = this._items.length;
    }
  };

  idbModules.util = {
    "throwDOMException": throwDOMException,
    "callback": callback,
    "quote" : function(arg){
      return "'" + arg + "'";
    },
    "StringList": StringList
  };
}(idbModules));

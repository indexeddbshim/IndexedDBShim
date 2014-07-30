/*jshint globalstrict: true*/
'use strict';
(function(idbModules) {
    /**
     * A utility method to callback onsuccess, onerror, etc as soon as the calling function's context is over
     * @param {Object} fn
     * @param {Object} context
     * @param {Object} argArray
     */

    function callback(fn, context, event, func) {
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

    function throwDOMException(name, message, error) {
        var e;
        try {
            e = new DOMException.prototype.constructor(0, message);
        } catch (_error) {
            e = new Error(message);
        }

        e.name = name;
        e.message = message;
        if (idbModules.DEBUG) {
            console.log(name, message, error, e);
            console.trace && console.trace();
        }
        throw e;
    }

    /**
     * Shim the DOMStringList object.
     *
     */
    var StringList = function() {
        this.length = 0;
        this._items = [];
        //Internal functions on the prototype have been made non-enumerable below.
        if (cleanInterface) {
            Object.defineProperty(this, '_items', {
                enumerable: false
            });
        }
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
            for (var i = 0; i < this._items.length; i++) {
                this[i] = this._items[i];
            }
        },
        splice: function( /*index, howmany, item1, ..., itemX*/ ) {
            this._items.splice.apply(this._items, arguments);
            this.length = this._items.length;
            for (var i in this) {
                if (i === String(parseInt(i, 10))) {
                    delete this[i];
                }
            }
            for (i = 0; i < this._items.length; i++) {
                this[i] = this._items[i];
            }
        }
    };
    if (cleanInterface) {
        for (var i in {
            'indexOf': false,
            'push': false,
            'splice': false
        }) {
            Object.defineProperty(StringList.prototype, i, {
                enumerable: false
            });
        }
    }
    idbModules.util = {
        "throwDOMException": throwDOMException,
        "callback": callback,
        "quote": function(arg) {
            return "'" + arg + "'";
        },
        "StringList": StringList
    };
}(idbModules));

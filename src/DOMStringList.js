let cleanInterface = false;

const testObject = {test: true};
// Test whether Object.defineProperty really works.
if (Object.defineProperty) {
    try {
        Object.defineProperty(testObject, 'test', {enumerable: false});
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
    contains (str) {
        if (!arguments.length) {
            throw new TypeError('DOMStringList.contains must be supplied a value');
        }
        return this._items.includes(str);
    },
    item (key) {
        if (!arguments.length) {
            throw new TypeError('DOMStringList.item must be supplied a value');
        }
        if (key < 0 || key >= this.length || !Number.isInteger(key)) {
            return null;
        }
        return this._items[key];
    },

    // Helpers. Should only be used internally.
    clone () {
        const stringList = DOMStringList.__createInstance();
        stringList._items = this._items.slice();
        stringList._length = this.length;
        stringList.addIndexes();
        return stringList;
    },
    addIndexes () {
        for (let i = 0; i < this._items.length; i++) {
            this[i] = this._items[i];
        }
    },
    sortList () {
        // http://w3c.github.io/IndexedDB/#sorted-list
        // https://tc39.github.io/ecma262/#sec-abstract-relational-comparison
        this._items.sort();
        this.addIndexes();
        return this._items;
    },
    forEach (cb, thisArg) {
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        this._items.forEach(cb, thisArg);
    },
    map (cb, thisArg) {
        // eslint-disable-next-line unicorn/no-fn-reference-in-iterator
        return this._items.map(cb, thisArg);
    },
    indexOf (str) {
        return this._items.indexOf(str);
    },
    push (item) {
        this._items.push(item);
        this._length++;
        this.sortList();
    },
    splice (...args /* index, howmany, item1, ..., itemX */) {
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
    * [Symbol.iterator] () {
        let i = 0;
        while (i < this._items.length) {
            yield this._items[i++];
        }
    }
};
Object.defineProperty(DOMStringList, Symbol.hasInstance, {
    value (obj) {
        return ({}.toString.call(obj) === 'DOMStringListPrototype');
    }
});
const DOMStringListAlias = DOMStringList;
Object.defineProperty(DOMStringList, '__createInstance', {
    value () {
        const DOMStringList = function DOMStringList () {
            this.toString = function () {
                return '[object DOMStringList]';
            };
            // Internal functions on the prototype have been made non-enumerable below.
            Object.defineProperty(this, 'length', {
                enumerable: true,
                get () {
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
    nonenumerableReadonly.forEach((nonenumerableReadonly) => {
        Object.defineProperty(DOMStringList.prototype, nonenumerableReadonly, {
            enumerable: false
        });
    });

    // Illegal invocations
    Object.defineProperty(DOMStringList.prototype, 'length', {
        configurable: true,
        enumerable: true,
        get () {
            throw new TypeError('Illegal invocation');
        }
    });

    const nonenumerableWritable = ['_items', '_length'];
    nonenumerableWritable.forEach((nonenumerableWritable) => {
        Object.defineProperty(DOMStringList.prototype, nonenumerableWritable, {
            enumerable: false,
            writable: true
        });
    });
}

export default DOMStringList;

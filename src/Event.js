/**
 * Creates a native Event object, for browsers that support it
 * @returns {Event}
 */
function createNativeEvent (type, debug) {
    const event = new Event(type);
    event.debug = debug;

    // Make the "target" writable
    Object.defineProperty(event, 'target', {
        writable: true
    });

    return event;
}

function isEvent (ev) {
    return typeof ev.bubbles === 'boolean' && typeof ev.stopPropgation === 'function';
}

/**
 * A shim Event class, for browsers that don't allow us to create native Event objects.
 * @constructor
 */
function ShimEvent (type, debug) {
    this.type = type;
    this.debug = debug;
    this.bubbles = false;
    this.cancelable = false;
    this.eventPhase = 0;
    this.timeStamp = new Date().valueOf();
}

let useNativeEvent = false;
try {
    // Test whether we can use the browser's native Event class
    const test = createNativeEvent('test type', 'test debug');
    const target = {test: 'test target'};
    test.target = target;

    if (isEvent(test) && test.type === 'test type' && test.debug === 'test debug' && test.target === target) {
        // Native events work as expected
        useNativeEvent = true;
    }
} catch (e) {}

let expEvent, createEvent;
if (useNativeEvent) {
    expEvent = Event;
    createEvent = createNativeEvent;
} else {
    expEvent = ShimEvent;
    createEvent = function (type, debug) {
        return new ShimEvent(type, debug);
    };
}

class IDBVersionChangeEvent extends expEvent {
    constructor (type, eventInitDict) { // eventInitDict is a IDBVersionChangeEventInit (but is not defined as a global)
        super(type);
        Object.defineProperty(this, 'target', {
            writable: true
        });
        Object.defineProperty(this, 'oldVersion', {
            enumerable: true,
            configurable: true,
            get: function () {
                return eventInitDict.oldVersion;
            }
        });
        Object.defineProperty(this, 'newVersion', {
            enumerable: true,
            configurable: true,
            get: function () {
                return eventInitDict.newVersion;
            }
        });
    }
}

export {expEvent as Event, IDBVersionChangeEvent, createEvent}; // Event not currently in use

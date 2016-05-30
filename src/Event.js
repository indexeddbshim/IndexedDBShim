/**
 * Creates a native Event object, for browsers that support it
 * @returns {Event}
 */
function createNativeEvent(type, debug) {
    const event = new Event(type);
    event.debug = debug;

    // Make the "target" writable
    Object.defineProperty(event, 'target', {
        writable: true
    });

    return event;
}

/**
 * A shim Event class, for browsers that don't allow us to create native Event objects.
 * @constructor
 */
function ShimEvent(type, debug) {
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

    if (test instanceof Event && test.type === 'test type' && test.debug === 'test debug' && test.target === target) {
        // Native events work as expected
        useNativeEvent = true;
    }
}
catch (e) {}

let createEvent, IDBVersionChangeEvent;
if (useNativeEvent) {
    IDBVersionChangeEvent = Event;
    createEvent = createNativeEvent;
}
else {
    Event = ShimEvent;
    IDBVersionChangeEvent = ShimEvent;
    createEvent = function(type, debug) {
        return new ShimEvent(type, debug);
    };
}

export {Event, IDBVersionChangeEvent, createEvent}; // Event not currently in use

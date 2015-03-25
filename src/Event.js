/*jshint globalstrict: true*/
'use strict';
(function(idbModules) {
    /**
     * Creates a native Event object, for browsers that support it
     * @returns {Event}
     */
    function createNativeEvent(type, debug) {
        var event = new Event(type);
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

    var useNativeEvent = false;
    try {
        // Test whether we can use the browser's native Event class
        var test = createNativeEvent('test type', 'test debug');
        var target = {test: 'test target'};
        test.target = target;

        if (test instanceof Event && test.type === 'test type' && test.debug === 'test debug' && test.target === target) {
            // Native events work as expected
            useNativeEvent = true;
        }
    }
    catch (e) {}

    if (useNativeEvent) {
        idbModules.Event = Event;
        idbModules.IDBVersionChangeEvent = Event;
        idbModules.util.createEvent = createNativeEvent;
    }
    else {
        idbModules.Event = ShimEvent;
        idbModules.IDBVersionChangeEvent = ShimEvent;
        idbModules.util.createEvent = function(type, debug) {
            return new ShimEvent(type, debug);
        };
    }
}(idbModules));

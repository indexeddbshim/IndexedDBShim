/*jshint globalstrict: true*/
'use strict';
(function(idbModules, undefined){
	// The event interface used for IndexedBD Actions.
	var Event = function(type, debug){
		// Returning an object instead of an even as the event's target cannot be set to IndexedDB Objects
		// We still need to have event.target.result as the result of the IDB request
		return {
			"type": type,
			debug: debug,
			bubbles: false,
			cancelable: false,
			eventPhase: 0,
			timeStamp: new Date()
		};
	};
	idbModules.Event = Event;
}(idbModules));

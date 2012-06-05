(function(idbModules, undefined){

	var Event = function(type, debug){
		var e = document.createEvent("Event");
		e.initEvent(type, true, true);
		e.debug = debug;
		return e;
	}
	
	idbModules.Event = Event;
}(idbModules));

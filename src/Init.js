/**
 * An initialization file that checks for conditions, removes console.log and warn, etc
 */
var idbModules = {};

var logger = {};
logger.log = logger.error = logger.warn = logger.debug = function(){
	console.log.apply(console, arguments);
};
if (typeof window.openDatabase === 'undefined') {
	return;
}

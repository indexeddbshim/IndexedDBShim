/**
 * An initialization file that checks for conditions, removes console.log and warn, etc
 */
if (typeof window.openDatabase === 'undefined') {
	return null;
}
var idbModules = {};

var console = {
	log: function(){
	},
	warn: function(){
	},
	error: function(){
	},
	debug: function(){
	}
}



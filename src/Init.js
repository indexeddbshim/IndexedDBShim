/**
 * An initialization file that checks for conditions, removes console.log and warn, etc
 */
if (typeof window.openDatabase === 'undefined') {
	return;
}

var idbModules = {};

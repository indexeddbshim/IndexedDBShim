/**
 * An initialization file that checks for conditions, removes console.log and warn, etc
 */
var idbModules = {};

var logger = {};
logger.log = logger.error = logger.warn = logger.debug = function(){
    if (typeof DEBUG !== "undefined") {
        console.log.apply(console, arguments);
    }
};

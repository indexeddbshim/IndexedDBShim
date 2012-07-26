/**
 * An initialization file that checks for conditions, removes console.log and warn, etc
 */
var idbModules = {};

if('undefined' === typeof DEBUG) {
  DEBUG = true;
}

if(DEBUG) {
  var logger = {};
  logger.log = logger.error = logger.warn = logger.debug = function(){
    console.log.apply(console, arguments);
  };
}
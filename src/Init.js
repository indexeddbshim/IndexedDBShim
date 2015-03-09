/*jshint globalstrict: true*/
'use strict';
/**
 * An initialization file that checks for conditions, removes console.log and warn, etc
 */
var idbModules = {};                        // jshint ignore:line
var cleanInterface = false;                 // jshint ignore:line
(function () {
    var testObject = {test: true};
    //Test whether Object.defineProperty really works.
    if (Object.defineProperty) {
        try {
            Object.defineProperty(testObject, 'test', { enumerable: false });
            if (testObject.test) {
                cleanInterface = true;      // jshint ignore:line
            }
        } catch (e) {
        //Object.defineProperty does not work as intended.
        }
    }
})();

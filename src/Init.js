/*jshint globalstrict: true*/
'use strict';
/**
 * An initialization file that checks for conditions, removes console.log and warn, etc
 */
var idbModules = {};

var cleanInterface = false;
(function () {
    var testObject = {test: true};
    //Test whether Object.defineProperty really works.
    if (Object.defineProperty) {
        try {
            Object.defineProperty(testObject, 'test', { enumerable: false });
            if (testObject.test) {
                cleanInterface = true;
            }
        } catch (e) {
        //Object.defineProperty does not work as intended.
        }
    }
})();

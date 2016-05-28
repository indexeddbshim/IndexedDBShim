var idbModules = {
    util: {
        cleanInterface: false
    }
};

(function () {
    'use strict';

    var testObject = {test: true};
    //Test whether Object.defineProperty really works.
    if (Object.defineProperty) {
        try {
            Object.defineProperty(testObject, 'test', { enumerable: false });
            if (testObject.test) {
                idbModules.util.cleanInterface = true;
            }
        } catch (e) {
        //Object.defineProperty does not work as intended.
        }
    }
})();

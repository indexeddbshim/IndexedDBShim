const map = {};
const CFG = {};

[
    'DEBUG', // boolean
    'cursorPreloadPackSize', // 100
    'win',  // (window on which there may be an `openDatabase` method (if any)
            //  for WebSQL; the browser throws if attempting to call
            //  `openDatabase` without the window)
    'UnicodeIDStart', // See https://gist.github.com/brettz9/b4cd6821d990daa023b2e604de371407
    'UnicodeIDContinue' // See https://gist.github.com/brettz9/b4cd6821d990daa023b2e604de371407
].forEach((prop) => {
    Object.defineProperty(CFG, prop, {
        get: function () {
            return map[prop];
        },
        set: function (val) {
            map[prop] = val;
        }
    });
});

export default CFG;

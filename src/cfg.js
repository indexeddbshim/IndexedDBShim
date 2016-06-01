const map = {};
const CFG = {};

[
    'DEBUG', // boolean
    'cursorPreloadPackSize', // 100
    'win',  // (window on which there may be an `openDatabase` method (if any)
            //  for WebSQL; the browser throws if attempting to call
            //  `openDatabase` without the window)
    'IDB' // Namespace for IndexedDB objects
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

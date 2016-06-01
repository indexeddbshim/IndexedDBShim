const map = {};
const CFG = {};

[
    'DEBUG', // boolean
    'cursorPreloadPackSize', // 100
    'openDatabase', // (Method (if any) for WebSQL)
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

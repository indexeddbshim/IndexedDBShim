// See https://github.com/tmpvar/jsdom/issues/1720
const assert = require('assert');
const jsdom = require('jsdom');

const window = jsdom.jsdom().defaultView;
Object.defineProperty(window, 'testVar', {
    enumerable: true,
    get: function () {
        return 'test';
    }
});
assert('get' in Object.getOwnPropertyDescriptor(window, 'testVar')); // unexpectedly `false`

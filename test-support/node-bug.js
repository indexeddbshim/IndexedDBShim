// See https://github.com/tmpvar/jsdom/issues/1720
const assert = require('assert');
const jsdom = require('jsdom');
const {JSDOM} = jsdom;

const {window} = new JSDOM();
Object.defineProperty(window, 'testVar', {
    enumerable: true,
    get () {
        return 'test';
    }
});
assert('get' in Object.getOwnPropertyDescriptor(window, 'testVar')); // unexpectedly `false`
console.log('ok');

import * as chai from 'chai';
import sinon from 'sinon';

global.window = global;
window.location = {search: ''}; // useShim=true // This must go before sinon as well as before our test-environment.js.

window.chai = chai;
window.sinon = sinon;

window.mocha = {setup () { /* */ }, globals () { /* */ }, checkLeaks () { /* */ }};

/**
 * @param {string} type
 * @returns {void}
 */
window.addEventListener = function (type) {
    if (type !== 'cordovacallbackerror') {
        throw new Error('Event listener type added for dummy addEventListener placeholder: ' + type);
    }
    console.log('dummy window.addEventListener called');
};

/**
 * @param {Event} e
 * @returns {void}
 */
window.dispatchEvent = function (e) {
    window.onerror(e);
};

/**
 * An Error event.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
 */
class ErrorEvent {}

window.ErrorEvent = ErrorEvent;

/**
 * @returns {void}
 */
window.onerror = function () {
    console.log('Node onerror called');
};

const setGlobalVars = (await import('../src/node.js')).default;
setGlobalVars(window, {addNonIDBGlobals: true});

await import('./test-environment.js');
await import('./test-utils.js');
await import('./test-load.js');

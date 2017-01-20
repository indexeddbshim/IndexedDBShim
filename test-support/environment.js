/* globals shimNS */
var window = this; // eslint-disable-line no-var, no-unused-vars
var self = this; // eslint-disable-line no-var
self.parent = self;
[
    // Needed early by testing framework
    'clearTimeout', 'setTimeout',
    'addEventListener', 'document'
].forEach(function (prop) {
    this[prop] = shimNS.window[prop];
}, this);

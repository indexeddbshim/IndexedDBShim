IndexedDB Polyfill [![Build Status](https://secure.travis-ci.org/axemclion/IndexedDBShim.png)](https://travis-ci.org/axemclion/IndexedDBShim)
================================

A polyfill to enable IndexedDB using WebSql.

IndexedDB is not supported on <a href = "http://caniuse.com/#search=IndexedDB" target="_blank">all browsers</a>.
This IndexedDB polyfill exposes the IndexedDB API in unsupported browsers using WebSQL. This shim is basically an IndexedDB-WebSql adapter.

<a href = "http://nparashuram.com/IndexedDBShim">More details about the project at gh-pages</a>

Using this polyfill, you can use a single offline storage API across browsers (Opera, Safari, Firefox, Chrome and IE10) and even mobile devices (Phonegap on iOS and Android).

Using the polyfill
==================
To use the polyfill, simply download [the concatenated, minified product](https://raw.github.com/axemclion/IndexedDBShim/master/dist/IndexedDBShim.min.js) from the `dist` directory and include it in your HTML document.

If IndexedDB is not natively supported (and WebSQL is), the polyfill kicks in and makes a `window.IndexedDB` object available for you to use.
If you want to force the use of this polyfill (on Chrome where both IndexedDB and WebSql are supported), simply use `window.shimIndexedDB.__useShim()`.

Building
========
To build `IndexedDBShim.min.js`

1. Ensure that you have node and grunt.
2. Run `npm install grunt-jsmin-sourcemap grunt-contrib-concat grunt-contrib-uglify grunt-contrib-connect grunt-contrib-qunit grunt-saucelabs grunt-contrib-jshint grunt-contrib-watch`.
3. Run `grunt` (or `grunt.cmd` on windows) on your command line
4. The output files will be generated in the `dist` directory.

Testing
=======
To check if the IndexedDB polyfill works, open test/index.html (hosted from a local server) and check if all the tests complete.

Debugging
=========
The IndexedDB polyfill has sourcemaps enabled, so the polyfill can be debugged even if the minified file is included. 
To print out debug status, use `window.shimIndexedDB.__debug(true)`

Contributing
============
Pull requests or Bug reports welcome !!

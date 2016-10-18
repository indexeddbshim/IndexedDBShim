These tests come from <https://github.com/w3c/web-platform-tests/tree/master/IndexedDB>
(courtesy of [idb-polyfill](https://github.com/treojs/idb-polyfill)) but they
are designed to run in a web browser, which is annoying for this project. So
they were converted to Mocha tests, hopefully without losing anything.

Run these tests in Node by running `npm run w3c-old`.

Note that we have since included `web-platform-tests` as a submodule and
which can be tested from `test-support/node-indexeddbshim-test.js` (though
as the environment currently seems to be imperfectly set up, we are still
keeping these older and less faithfully adapted tests until such time as
the former can be fixed).

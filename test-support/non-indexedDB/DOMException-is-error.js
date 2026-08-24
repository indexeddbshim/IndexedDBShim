// From web-platform-tests/webidl/ecmascript-binding/es-exceptions

/*beginscript::/resources/testharness.js::endscript*/
/*beginscript::/resources/testharnessreport.js::endscript*/

'use strict';

test(function() {
  // https://github.com/tc39/proposal-is-error/issues/9
  // https://github.com/whatwg/webidl/pull/1421
  assert_true(Error.isError(new DOMException()));
});

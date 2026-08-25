// From web-platform-tests/dom/events

/*beginscript::/resources/testharness.js::endscript*/
/*beginscript::/resources/testharnessreport.js::endscript*/

// Step 1.
test(function() {
  assert_equals(globalThis.removeEventListener("x", null, false), undefined);
  assert_equals(globalThis.removeEventListener("x", null, true), undefined);
  assert_equals(globalThis.removeEventListener("x", null), undefined);
}, "removing a null event listener should succeed");

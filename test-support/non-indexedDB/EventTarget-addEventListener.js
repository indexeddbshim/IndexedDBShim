// From web-platform-tests/dom/events

/*beginscript::/resources/testharness.js::endscript*/
/*beginscript::/resources/testharnessreport.js::endscript*/

// Step 1.
test(function() {
  const et = new EventTarget();
  assert_equals(et.addEventListener("x", null, false), undefined);
  assert_equals(et.addEventListener("x", null, true), undefined);
  assert_equals(et.addEventListener("x", null), undefined);
}, "Adding a null event listener should succeed");

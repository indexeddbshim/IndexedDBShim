var assert = require('assert');
var support = require('./support');
var FDBKeyRange = IDBKeyRange;

describe('W3C IDBKeyRange.includes', function () {
  it("IDBKeyRange.includes() with a closed range", function() {
    var closedRange = IDBKeyRange.bound(5, 20);
    support.assert_true(!!closedRange.includes, "IDBKeyRange has a .includes");
    support.assert_true(closedRange.includes(7), "in range");
    support.assert_false(closedRange.includes(1), "below range");
    support.assert_false(closedRange.includes(42), "above range");
    support.assert_true(closedRange.includes(5) && closedRange.includes(20),
                 "boundary points");
    support.throws(function() { closedRange.includes({}) }, "DataError",
                  "invalid key");
  });

  it("IDBKeyRange.includes() with an open range", function() {
    var openRange = IDBKeyRange.bound(5, 20, true, true);
    support.assert_false(openRange.includes(5) || openRange.includes(20),
                 "boundary points");
  });
  it("IDBKeyRange.includes() with an only range", function() {
    var range = IDBKeyRange.only(42);
    support.assert_true(range.includes(42), "in range");
    support.assert_false(range.includes(1), "below range");
    support.assert_false(range.includes(9000), "above range");
  });
  it("IDBKeyRange.includes() with an closed lower-bounded range", function() {
    var range = IDBKeyRange.lowerBound(5);
    support.assert_false(range.includes(4), 'value before closed lower bound');
    support.assert_true(range.includes(5), 'value at closed lower bound');
    support.assert_true(range.includes(6), 'value after closed lower bound');
  });
  it("IDBKeyRange.includes() with an open lower-bounded range", function() {
    var range = IDBKeyRange.lowerBound(5, true);
    support.assert_false(range.includes(4), 'value before open lower bound');
    support.assert_false(range.includes(5), 'value at open lower bound');
    support.assert_true(range.includes(6), 'value after open lower bound');
  });
  it("IDBKeyRange.includes() with an closed upper-bounded range", function() {
    var range = IDBKeyRange.upperBound(5);
    support.assert_true(range.includes(4), 'value before closed upper bound');
    support.assert_true(range.includes(5), 'value at closed upper bound');
    support.assert_false(range.includes(6), 'value after closed upper bound');
  });
  it("IDBKeyRange.includes() with an open upper-bounded range", function() {
    var range = IDBKeyRange.upperBound(5, true);
    support.assert_true(range.includes(4), 'value before open upper bound');
    support.assert_false(range.includes(5), 'value at open upper bound');
    support.assert_false(range.includes(6), 'value after open upper bound');
  });
});

describe('W3C IDBKeyRange Tests', function () {
    var FDBKeyRange = IDBKeyRange;

    // idbkeyrange
    describe('IDBKeyRange Tests', function () {
        it("FDBKeyRange.only() - returns an FDBKeyRange and the properties are set correctly", function() {
            var keyRange = FDBKeyRange.only(1);
            assert(keyRange instanceof FDBKeyRange, "keyRange instanceof FDBKeyRange");
            assert.equal(keyRange.lower, 1, "keyRange");
            assert.equal(keyRange.upper, 1, "keyRange");
            assert(!keyRange.lowerOpen, "keyRange.lowerOpen");
            assert(!keyRange.upperOpen, "keyRange.upperOpen");
        });
        it("FDBKeyRange.lowerBound() - returns an FDBKeyRange and the properties are set correctly", function() {
            var keyRange = FDBKeyRange.lowerBound(1, true)
            assert(keyRange instanceof FDBKeyRange, "keyRange instanceof FDBKeyRange");
            assert.equal(keyRange.lower, 1, "keyRange.lower");
            assert.equal(keyRange.upper, undefined, "keyRange.upper");
            assert(keyRange.lowerOpen, "keyRange.lowerOpen");
            assert(keyRange.upperOpen, "keyRange.upperOpen");
        });
        it("FDBKeyRange.lowerBound() - 'open' parameter has correct default set", function() {
            var keyRange = FDBKeyRange.lowerBound(1);
            assert(!keyRange.lowerOpen, "keyRange.lowerOpen");
        });
        it("FDBKeyRange.upperBound() - returns an FDBKeyRange and the properties are set correctly", function() {
            var keyRange = FDBKeyRange.upperBound(1, true);
            assert(keyRange instanceof FDBKeyRange, "keyRange instanceof FDBKeyRange");
            assert.equal(keyRange.lower, undefined, "keyRange.lower");
            assert.equal(keyRange.upper, 1, "keyRange.upper");
            assert(keyRange.lowerOpen, "keyRange.lowerOpen");
            assert(keyRange.upperOpen, "keyRange.upperOpen");
        });
        it("FDBKeyRange.upperBound() - 'open' parameter has correct default set", function() {
            var keyRange = FDBKeyRange.upperBound(1);
            assert(!keyRange.upperOpen, "keyRange.upperOpen");
        });
        it("FDBKeyRange.bound() - returns an FDBKeyRange and the properties are set correctly", function() {
            var keyRange = FDBKeyRange.bound(1, 2, true, true);
            assert(keyRange instanceof FDBKeyRange, "keyRange instanceof FDBKeyRange");
            assert.equal(keyRange.lower, 1, "keyRange");
            assert.equal(keyRange.upper, 2, "keyRange");
            assert(keyRange.lowerOpen, "keyRange.lowerOpen");
            assert(keyRange.upperOpen, "keyRange.upperOpen");
        });
        it("FDBKeyRange.bound() - 'lowerOpen' and 'upperOpen' parameters have correct defaults set", function() {
            var keyRange = FDBKeyRange.bound(1, 2);
            assert(!keyRange.lowerOpen, "keyRange.lowerOpen");
            assert(!keyRange.upperOpen, "keyRange.upperOpen");
        });
    });

    // idbkeyrange_incorrect
    describe('IDBKeyRange Tests - Incorrect', function () {
        it("FDBKeyRange.bound() - bound requires more than 0 arguments.", function() {
            assert.throws(function() {
                FDBKeyRange.bound();
            }, TypeError);
        });

        // Null parameters
        it("FDBKeyRange.bound(null, null) - null parameters are incorrect.", function() {
            support.throws(function() {
                FDBKeyRange.bound(null, null);
            }, 'DataError');
        });

        // // Null parameter
        it("FDBKeyRange.bound(1, null / null, 1) - null parameter is incorrect.", function() {
            support.throws(function() {
                FDBKeyRange.bound(1, null);
            }, 'DataError');
            support.throws(function() {
                FDBKeyRange.bound(null, 1);
            }, 'DataError');
        });

        // bound incorrect
        it("FDBKeyRange.bound(lower, upper / lower > upper) -  'lower' is greater than 'upper'.", function() {
            var lowerBad = Math.floor(Math.random()*31) + 5;
            var upper = lowerBad - 1;
            support.throws(function() {
                FDBKeyRange.bound(lowerBad, upper);
            }, 'DataError');
            support.throws(function() {
                FDBKeyRange.bound('b', 'a');
            }, 'DataError');
        });

        it("FDBKeyRange.bound(DOMString/Date/Array, 1) - A DOMString, Date and Array are greater than a float.", function() {
            support.throws(function() {
                FDBKeyRange.bound('a', 1);
            }, 'DataError');
            support.throws(function() {
                FDBKeyRange.bound(new Date(), 1);
            }, 'DataError');
            support.throws(function() {
                FDBKeyRange.bound([1, 2], 1);
            }, 'DataError');
        });


        // ReferenceError: the variable is not defined
        it("FDBKeyRange.bound(noExistingVariable, 1 / goodVariable, noExistingVariable) - noExistingVariable is not defined.", function() {
            var goodVariable = 1;
            assert.throws(function() {
                FDBKeyRange.bound(noExistingVariable, 1);
            }, ReferenceError);
            assert.throws(function() {
                FDBKeyRange.bound(goodVariable, noExistingVariable);
            }, ReferenceError);
        });

        // Valid type key error
        it("FDBKeyRange.bound(true, 1) - boolean is not a valid key type.", function() {
            support.throws(function() {
                FDBKeyRange.bound(true, 1);
            }, 'DataError');
        });
    });
});

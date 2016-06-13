require('./setup')
var assert = require('assert')

describe('KeyRange', function() {
    it("only - number", function () {
        var value = 1;

        var keyRange = KeyRange.only(value);

        assert.equal(keyRange.lower, value, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, value, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, false, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, false, "upperOpen: " + keyRange.upperOpen);
    });
    it("only - date", function () {
        var value = new Date();

        var keyRange = KeyRange.only(value);

        assert.deepEqual(keyRange.lower, value, "lower: " + keyRange.lower);
        assert.deepEqual(keyRange.upper, value, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, false, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, false, "upperOpen: " + keyRange.upperOpen);
    });
    it("only - string", function () {
        var value = "1";

        var keyRange = KeyRange.only(value);

        assert.deepEqual(keyRange.lower, value, "lower: " + keyRange.lower);
        assert.deepEqual(keyRange.upper, value, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, false, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, false, "upperOpen: " + keyRange.upperOpen);
    });
    it("only - array", function () {
        var value = [1,"1",new Date()];

        var keyRange = KeyRange.only(value);

        assert.deepEqual(keyRange.lower, value, "lower: " + keyRange.lower);
        assert.deepEqual(keyRange.upper, value, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, false, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, false, "upperOpen: " + keyRange.upperOpen);
    });
    it("only - invalid key", function () {
        var value = {};

        try{
            var keyRange = KeyRange.only(value);
        }
        catch(ex){
            assert.equal(ex.name, "DataError", "DataError");
        }
    });
    it("lowerBound", function () {
        var value = 1;

        var keyRange = KeyRange.lowerBound(value);

        assert.equal(keyRange.lower, value, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, undefined, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, false, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, true, "upperOpen: " + keyRange.upperOpen);
    });
    it("lowerBound - value inclusieve", function () {
        var value = 1;

        var keyRange = KeyRange.lowerBound(value, false);

        assert.equal(keyRange.lower, value, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, undefined, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, false, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, true, "upperOpen: " + keyRange.upperOpen);
    });
    it("lowerBound - value exclusieve", function () {
        var value = 1;

        var keyRange = KeyRange.lowerBound(value, true);

        assert.equal(keyRange.lower, value, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, undefined, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, true, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, true, "upperOpen: " + keyRange.upperOpen);
    });
    it("lowerBound - invalid key", function () {
        var value = {};

        try{
            var keyRange = KeyRange.lowerBound(value);
        }
        catch(ex){
            assert.equal(ex.name, "DataError", "DataError");
        }
    });
    it("upperBound", function () {
        var value = 1;

        var keyRange = KeyRange.upperBound(value);

        assert.equal(keyRange.lower, undefined, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, value, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, true, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, false, "upperOpen: " + keyRange.upperOpen);
    });
    it("upperBound - value inclusieve", function () {
        var value = 1;

        var keyRange = KeyRange.upperBound(value, false);

        assert.equal(keyRange.lower, undefined, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, value, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, true, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, false, "upperOpen: " + keyRange.upperOpen);
    });
    it("upperBound - value exclusieve", function () {
        var value = 1;

        var keyRange = KeyRange.upperBound(value, true);

        assert.equal(keyRange.lower, undefined, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, value, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, true, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, true, "upperOpen: " + keyRange.upperOpen);
    });
    it("upperBound - invalid key", function () {
        var value = {};

        try{
            var keyRange = KeyRange.upperBound(value);
        }
        catch(ex){
            assert.equal(ex.name, "DataError", "DataError");
        }
    });
    it("bound", function () {
        var lower = 1;
        var upper = 2;

        var keyRange = KeyRange.bound(lower, upper);

        assert.equal(keyRange.lower, lower, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, upper, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, false, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, false, "upperOpen: " + keyRange.upperOpen);
    });
    it("bound - lower & upper inclusieve", function () {
        var lower = 1;
        var upper = 2;

        var keyRange = KeyRange.bound(lower, upper, true, true);

        assert.equal(keyRange.lower, lower, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, upper, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, true, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, true, "upperOpen: " + keyRange.upperOpen);
    });
    it("bound - lower & upper exclusieve", function () {
        var lower = 1;
        var upper = 2;

        var keyRange = KeyRange.bound(lower, upper, false, false);

        assert.equal(keyRange.lower, lower, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, upper, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, false, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, false, "upperOpen: " + keyRange.upperOpen);
    });
    it("bound - lower inclusieve & upper exclusieve", function () {
        var lower = 1;
        var upper = 2;

        var keyRange = KeyRange.bound(lower, upper, true, false);

        assert.equal(keyRange.lower, lower, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, upper, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, true, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, false, "upperOpen: " + keyRange.upperOpen);
    });
    it("bound - lower exclusieve & upper inclusieve", function () {
        var lower = 1;
        var upper = 2;

        var keyRange = KeyRange.bound(lower, upper, false, true);

        assert.equal(keyRange.lower, lower, "lower: " + keyRange.lower);
        assert.equal(keyRange.upper, upper, "upper: " + keyRange.upper);
        assert.equal(keyRange.lowerOpen, false, "lowerOpen: " + keyRange.lowerOpen);
        assert.equal(keyRange.upperOpen, true, "upperOpen: " + keyRange.upperOpen);
    });
    it("bound - invalid key lower", function () {
        var value = {};

        try{
            var keyRange = KeyRange.bound(value, 1);
        }
        catch(ex){
            assert.equal(ex.name, "DataError", "DataError");
        }
    });
    it("bound - invalid key upper", function () {
        var value = {};

        try{
            var keyRange = KeyRange.bound(1,value);
        }
        catch(ex){
            assert.equal(ex.name, "DataError", "DataError");
        }
    });
    it("bound - upper smaler then lower", function () {
        var lower = 1;
        var upper = 2;

        try{
            var keyRange = KeyRange.bound(upper, lower);
        }
        catch(ex){
            assert.equal(ex.name, "DataError", "DataError");
        }
    });
    it("bound - lower == upper and lower & upper exclusieve", function () {
        var lower = 1;
        var upper = 2;

        try{
            var keyRange = KeyRange.bound(upper, lower);
        }
        catch(ex){
            assert.equal(ex.name, "DataError", "DataError");
        }
    });
});

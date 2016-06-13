var assert = require('assert');
var support = require('./support');
var createdb = support.createdb;

describe('W3C Key Generator Tests', function () {
    // keygenerator
    it('Key generator', function (done) {
        var numChecks = 0;
        var numDone = 0;

        function keygenerator(objects, expected_keys, desc, func) {
            numChecks += 1;
            var db;

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("store", { keyPath: "id", autoIncrement: true });

                for (var i = 0; i < objects.length; i++)
                {
                    if (objects[i] === null)
                        objStore.add({});
                    else
                        objStore.add({ id: objects[i] });
                }
            };

            open_rq.onsuccess = function(e) {
                var actual_keys = [],
                  rq = db.transaction("store")
                         .objectStore("store")
                         .openCursor();

                rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    if (cursor) {
                        actual_keys.push(cursor.key.valueOf());
                        cursor.continue();
                    }
                    else {
                        assert.deepEqual(actual_keys, expected_keys, "keygenerator array");

                        numDone += 1;
                        if (numDone === numChecks) {
                            done();
                        }
                    }
                };
            };
        }


        keygenerator([null, null, null, null],  [1, 2, 3, 4],
            "starts at one, and increments by one");

        keygenerator([2, null, 5, null, 6.66, 7],  [2, 3, 5, 6, 6.66, 7],
            "increments by one from last set key");

        keygenerator([-10, null, "6", 6.3, [10], -2, 4, null],   [-10, -2, 1, 4, 6.3, 7, "6", [10]],
            "don't increment when new key is not bigger than current");
    });

    // keygenerator-constrainterror
    it('ConstraintError when using same id as already generated', function (done) {
        var db,
          objects = [1, null, {id: 2}, null, 2.00001, 5, null, {id: 6} ],
          expected = [1, 2, 2.00001, 3, 5, 6],
          errors = 0;

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "id", autoIncrement: true });

            for (var i = 0; i < objects.length; i++)
            {
                if (objects[i] === null)
                {
                    objStore.add({});
                }
                else if (typeof objects[i] === "object")
                {
                    (function (i) {
                        var rq = objStore.add(objects[i])
                        rq.onerror = function(e) {
                            errors++;

                            assert.equal(e.target.error.name, "ConstraintError");
                            assert.equal(e.type, "error");

                            e.stopPropagation();
                            e.preventDefault();
                        };
                        rq.onsuccess = function(e) {
                            assert.fail("Got rq.success when adding duplicate id " + objects[i].id);
                        };
                    }(i));
                }
                else {
                    objStore.add({ id: objects[i] });
                }
            }
        };

        open_rq.onsuccess = function(e) {
            var actual_keys = [],
              rq = db.transaction("store")
                     .objectStore("store")
                     .openCursor();

            rq.onsuccess = function(e) {
                var cursor = e.target.result;

                if (cursor) {
                    actual_keys.push(cursor.key.valueOf());
                    cursor.continue();
                }
                else {
                    assert.equal(errors, 2, "expected ConstraintError's");

                    assert.equal(actual_keys.length, expected.length, "array length");
                    assert.deepEqual(actual_keys, expected, "keygenerator array");

                    done();
                }
            };
        };
    });

    // keygenerator-overflow
    it('overflow', function (done) {
        var db,
          overflow_error_fired = false,
          objects =  [9007199254740991, null, "error", 2, "error" ],
          expected_keys = [2, 9007199254740991, 9007199254740992];

        var open_rq = createdb(done);
        open_rq.onupgradeneeded = function(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("store", { keyPath: "id", autoIncrement: true });

            for (var i = 0; i < objects.length; i++)
            {
                if (objects[i] === null)
                {
                    objStore.add({});
                }
                else if (objects[i] === "error")
                {
                    var rq = objStore.add({});
                    rq.onerror = function(e) {
                        overflow_error_fired = true;
                        assert.equal(e.target.error.name, "ConstraintError", "error name");
                        e.preventDefault();
                        e.stopPropagation();
                    };
                }
                else
                    objStore.add({ id: objects[i] });
            }
        };

        open_rq.onsuccess = function(e) {
            var actual_keys = [],
              rq = db.transaction("store")
                     .objectStore("store")
                     .openCursor();

            rq.onsuccess = function(e) {
                var cursor = e.target.result;

                if (cursor) {
                    actual_keys.push(cursor.key.valueOf());
                    cursor.continue();
                }
                else {
                    assert(overflow_error_fired, "error fired on 'current number' overflow");
                    assert.deepEqual(actual_keys, expected_keys, "keygenerator array");

                    done();
                }
            };
        };
    });
});
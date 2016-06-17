var assert = require('assert');
var indexedDB = require('../test-helper');
//var FDBRequest = IDBRequest;
//var DataError = DOMException;
var support = require('./support');
var createdb = support.createdb;

describe('W3C Key Path Tests', function () {
    // keypath
    it('Keypath', function (done) {
        var numChecks = 0;
        var numDone = 0;

        function keypath(keypath, objects, expected_keys, desc) {
            numChecks += 1;

            var db,
                store_name = "store-"+(Date.now())+Math.random();

            var open_rq = createdb(done);
            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore(store_name, { keyPath: keypath });

                for (var i = 0; i < objects.length; i++) {
                    objStore.add(objects[i]);
                }
            };

            open_rq.onsuccess = function(e) {
                var actual_keys = [],
                  rq = db.transaction(store_name)
                         .objectStore(store_name)
                         .openCursor();

                rq.onsuccess = function(e) {
                    var cursor = e.target.result;

                    if (cursor) {
                        actual_keys.push(cursor.key.valueOf());
                        cursor.continue();
                    }
                    else {
                        assert.equal(actual_keys.length, expected_keys.length, "array length");
                        assert.deepEqual(actual_keys, expected_keys, "keyorder array");

                        numDone += 1;
                        if (numDone === numChecks) {
                            done();
                        }
                    }
                };
            };
        }

        keypath('my.key',
            [ { my: { key: 10 } } ],
            [ 10 ]);

        keypath('my.køi',
            [ { my: { køi: 5 } } ],
            [ 5 ]);

        keypath('my.key_ya',
            [ { my: { key_ya: 10 } } ],
            [ 10 ]);

        keypath('public.key$ya',
            [ { public: { key$ya: 10 } } ],
            [ 10 ]);

        keypath('true.$',
            [ { true: { $: 10 } } ],
            [ 10 ]);

        keypath('my._',
            [ { my: { _: 10 } } ],
            [ 10 ]);

        keypath('delete.a7',
            [ { delete: { a7: 10 } } ],
            [ 10 ]);

        keypath('p.p.p.p.p.p.p.p.p.p.p.p.p.p',
            [ {p:{p:{p:{p:{p:{p:{p:{p:{p:{p:{p:{p:{p:{p:10}}}}}}}}}}}}}} ],
            [ 10 ]);

        keypath('str.length',
            [ { str: "pony" }, { str: "my" }, { str: "little" }, { str: "" } ],
            [ 0, 2, 4, 6 ]);

        keypath('arr.length',
            [ {arr: [0, 0, 0, 0]}, {arr: [{}, 0, "hei", "length", Infinity, []]}, {arr: [10, 10]}, { arr: []} ],
            [ 0, 2, 4, 6 ]);

        keypath('length',
            [ [10, 10], "123", { length: 20 } ],
            [ 2, 3, 20 ]);

        keypath('',
            [ ["bags"], "bean", 10 ],
            [ 10, "bean", ["bags"] ],
            "'' uses value as key");

        keypath([''],
            [ ["bags"], "bean", 10 ],
            [ [10], ["bean"] , [["bags"]] ],
            "[''] uses value as [key]");

        keypath(['x', 'y'],
            [ {x:10, y:20}, {y:1.337, x:100} ],
            [ [10, 20], [100, 1.337] ],
            "['x', 'y']");

        keypath([['x'], ['y']],
            [ {x:10, y:20}, {y:1.337, x:100} ],
            [ [10, 20], [100, 1.337] ],
            "[['x'], 'y'] (stringifies)");

        keypath(['x', {toString:function(){return 'y'}}],
            [ {x:10, y:20}, {y:1.337, x:100} ],
            [ [10, 20], [100, 1.337] ],
            "['x', {toString->'y'}] (stringifies)");

        if (false) {
            var myblob = Blob(["Yoda"], {type:'suprawsum'});
            keypath(['length', 'type'],
                [ myblob ],
                [ 4, 'suprawsum' ],
                "[Blob.length, Blob.type]");
        }

        // File.name and File.lastModifiedDate is not testable automatically

        keypath(['name', 'type'],
            [ { name: "orange", type: "fruit" }, { name: "orange", type: ["telecom", "french"] } ],
            [ ["orange", "fruit"], ["orange", ["telecom", "french"]] ]);

        keypath(['name', 'type.name'],
            [ { name: "orange", type: { name: "fruit" }}, { name: "orange", type: { name: "telecom" }} ],
            [ ["orange", "fruit"], ["orange", "telecom" ] ]);

        // FIXME: skip recursive structure test
        // loop_array = [];
        // loop_array.push(loop_array);
        // keypath(loop_array,
        //     [ "a", 1, ["k"] ],
        //     [ [1], ["a"], [["k"]] ],
        //     "array loop -> stringify becomes ['']");
    });

    // keypath_invalid
    it('Invalid keypath', function (done) {
        var numChecks = 0;
        var numDone = 0;

        function invalid_keypath(keypath, desc) {
            numChecks += 1;

            var open_rq = createdb(done),
                store_name  = "store-" + Date.now() + Math.random();
            open_rq.onupgradeneeded = function (e) {
                var db = e.target.result;
                assert.throws(function() {
                        db.createObjectStore(store_name, { keyPath: keypath })
                    }, SyntaxError, "createObjectStore with keyPath");

                store = db.createObjectStore(store_name);
                assert.throws(function() {
                        store.createIndex('index', keypath);
                    }, SyntaxError, "createIndex with keyPath");

                db.close();

                numDone += 1;
                if (numDone === numChecks) {
                    done();
                }
            };
            open_rq.onerror = function () {}; // Because of db.close() in onupgradeneeded
        }

        invalid_keypath('j a');
        invalid_keypath('.yo');
        invalid_keypath('yo,lo');
        invalid_keypath([]);
        invalid_keypath(['array with space']);
        invalid_keypath(['multi_array', ['a', 'b']], "multidimensional array (invalid toString)"); // => ['multi_array', 'a,b']
        invalid_keypath('3m');
        invalid_keypath({toString:function(){return '3m'}}, '{toString->3m}');
        invalid_keypath('my.1337');
        invalid_keypath('..yo');
        invalid_keypath('y..o');
        invalid_keypath('y.o.');
        invalid_keypath('y.o..');
        invalid_keypath('m.*');
        invalid_keypath('"m"');
        invalid_keypath('m%');
        invalid_keypath('m/');
        invalid_keypath('m/a');
        invalid_keypath('m&');
        invalid_keypath('m!');
        invalid_keypath('*');
        invalid_keypath('*.*');
        invalid_keypath('^m');
        invalid_keypath('/m/');
    });

    // keypath_maxsize
    it('Max size', function (done) {
        var numChecks = 0;
        var numDone = 0;

        function keypath(keypath, objects, expected_keys, desc) {
            numChecks += 1;

            var db,
                open_rq = createdb(done);

            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;
                var objStore = db.createObjectStore("store", { keyPath: keypath });

                for (var i = 0; i < objects.length; i++)
                    objStore.add(objects[i]);
            };

            open_rq.onerror = function(e) {
                throw error;
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
                    } else {
                        assert.equal(actual_keys.length, expected_keys.length, "array length");
                        assert.deepEqual(actual_keys, expected_keys, "keyorder array");

                        numDone += 1;
                        if (numDone === numChecks) {
                            done();
                        }
                    }
                };
            };
        }

        keypath('maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai.keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey',
            [ { maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai: { keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey: 10 } } ],
            [ 10 ], '~260 chars');

        keypath('maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai_maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai.keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey_keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey',
            [ { maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai_maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai: { keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey_keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey: 10 } } ],
            [ 10 ], '~530 chars');

        keypath('maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai_maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai_maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai_maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai.keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey_keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey_keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey_keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey',
            [ { maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai_maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai_maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai_maaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaai: { keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey_keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey_keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey_keeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeey: 10 } } ],
            [ 10 ], '~1050 chars');
    });
});

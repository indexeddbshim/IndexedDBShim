var assert = require('assert');
var indexedDB = require('../test-helper');
var FDBRequest = IDBRequest;
var support = require('./support');
var createdb = support.createdb;

describe('W3C Key Validity Tests', function () {
    this.timeout(20000);
    // key_invalid
    it('Invalid key', function (done) {
        var numChecks = 0;
        var numDone = 0;

        /*function is_cloneable(o) {
            try {
                self.postMessage(o, '*');
                return true;
            } catch (ex) {
                return false;
            }
        }*/

        function invalid_key(desc, key) {
            numChecks += 1;

            var open_rq = createdb(done);
            var objStore, objStore2;

            // set the current test, and run it
            open_rq.onupgradeneeded = function(e) {
                objStore = e.target.result.createObjectStore("store");
                support.throws(function() {
                    objStore.add("value", key);
                }, 'DataError', desc);

                /*if (is_cloneable(key)) {
                    objStore2 = e.target.result.createObjectStore("store2", { keyPath: ["x", "keypath"] });
                    support.throws(function() {
                        objStore2.add({ x: "value", keypath: key });
                    }, 'DataError', desc);
                }*/

                numDone += 1;
                if (numDone === numChecks) {
                    done();
                }
            };
            open_rq.onsuccess = function () {};
        }

        var fake_array = {
            length      : 0,
            constructor : Array
        };

        var ArrayClone = function(){};
        ArrayClone.prototype = Array;
        var ArrayClone_instance = new ArrayClone();

        // booleans
        invalid_key( 'true'  , true );
        invalid_key( 'false' , false );

        // null/NaN/undefined
        invalid_key( 'null'      , null );
        invalid_key( 'NaN'       , NaN );
        invalid_key( 'undefined' , undefined );
        invalid_key( 'undefined2');

        // functions
        invalid_key( 'function() {}', function(){} );

        // objects
        invalid_key( '{}'                           , {} );
        invalid_key( '{ obj: 1 }'                   , { obj: 1 });
        invalid_key( 'Math'                         , Math );
        //invalid_key( 'window'                       , window );
        invalid_key( '{length:0,constructor:Array}' , fake_array );
        invalid_key( 'Array clone’s instance'       , ArrayClone_instance );
        invalid_key( 'Array (object)'               , Array );
        invalid_key( 'String (object)'              , String );
        invalid_key( 'new String()'                 , new String() );
        invalid_key( 'new Number()'                 , new Number() );
        invalid_key( 'new Boolean()'                , new Boolean() );

        // arrays
        invalid_key( '[{}]'                     , [{}] );
        invalid_key( '[[], [], [], [[ Date ]]]' , [ [], [], [], [[ Date ]] ] );
        invalid_key( '[undefined]'              , [undefined] );
        invalid_key( '[,1]'                     , [,1] );
        //invalid_key( 'document.getElements'
        //            +'ByTagName("script")'      , document.getElementsByTagName("script") );

        //  dates
        invalid_key( 'new Date(NaN)'      , new Date(NaN) );
        invalid_key( 'new Date(Infinity)' , new Date(Infinity) );

        // regexes
        invalid_key( '/foo/'        , /foo/ );
        invalid_key( 'new RegExp()' , new RegExp() );

        var sparse = [];
        sparse[10] = "hei";
        invalid_key('sparse array', sparse);

        var sparse2 = [];
        sparse2[0]  = 1;
        sparse2[""] = 2;
        sparse2[2]  = 3;
        invalid_key('sparse array 2', sparse2);

        invalid_key('[[1], [3], [7], [[ sparse array ]]]', [ [1], [3], [7], [[ sparse2 ]] ]);

        // sparse3
        invalid_key( '[1,2,3,,]', [1,2,3,,] );

        var recursive = [];
        recursive.push(recursive);
        invalid_key('array directly contains self', recursive);

        var recursive2 = [];
        recursive2.push([recursive2]);
        invalid_key('array indirectly contains self', recursive2);

        var recursive3 = [recursive];
        invalid_key('array member contains self', recursive3);
    });

    // key_valid
    it('Valid key', function (done) {
        var numChecks = 0;
        var numDone = 0;

        function valid_key(desc, key) {
            numChecks += 1;

            var db;
            var open_rq = createdb(done);
            var store, store2;

            open_rq.onupgradeneeded = function(e) {
                db = e.target.result;

                store = db.createObjectStore("store");
                assert(store.add('value', key) instanceof FDBRequest);

                store2 = db.createObjectStore("store2", { keyPath: ["x", "keypath"] });
                assert(store2.add({ x: 'v', keypath: key }) instanceof FDBRequest);
            };
            open_rq.onsuccess = function(e) {
                var rq = db.transaction("store")
                           .objectStore("store")
                           .get(key)
                rq.onsuccess = function(e) {
                    assert.equal(e.target.result, 'value')
                    var rq = db.transaction("store2")
                               .objectStore("store2")
                               .get(['v', key])
                    rq.onsuccess = function(e) {
                        assert.deepEqual(e.target.result, { x: 'v', keypath: key })
                        numDone += 1;
                        if (numDone === numChecks) {
                            done();
                        }
                    };
                };
            }
        }

        // Date
        valid_key( 'new Date()'    , new Date() );
        valid_key( 'new Date(0)'   , new Date(0) );

        // Array
        valid_key( '[]'            , [] );
        valid_key( 'new Array()'   , new Array() );

        valid_key( '["undefined"]' , ['undefined'] );

        // Float
        valid_key( 'Infinity'      , Infinity );
        valid_key( '-Infinity'     , -Infinity );
        valid_key( '0'             , 0 );
        valid_key( '1.5'           , 1.5 );
        valid_key( '3e38'          , 3e38 );
        valid_key( '3e-38'         , 3e38 );

        // String
        valid_key( '"foo"'         , "foo" );
        valid_key( '"\\n"'         , "\n" );
        valid_key( '""'            , "" );
        valid_key( '"\\""'         , "\"" );
        valid_key( '"\\u1234"'     , "\u1234" );
        valid_key( '"\\u0000"'     , "\u0000" );
        valid_key( '"NaN"'         , "NaN" );
    });
});

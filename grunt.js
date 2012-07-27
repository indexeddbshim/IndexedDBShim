/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*!\n' +
              ' * IndexedDB Polyfill\n' +
              ' *  - original by axemclion (https://github.com/axemclion/IndexedDBShim/)\n' +
              ' */'
    },
    lint: {
      files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
    },
    test: {
      files: ['test/**/*.js']
    },
    concat: {
      dist: {
        src: [
          '<banner:meta.banner>',
          '<file_strip_banner:src/Init.js>',
          '<file_strip_banner:src/util.js>',
          '<file_strip_banner:src/Sca.js>',
          '<file_strip_banner:src/Key.js>',
          '<file_strip_banner:src/Event.js>',
          '<file_strip_banner:src/IDBRequest.js>',
          '<file_strip_banner:src/IDBKeyRange.js>',
          '<file_strip_banner:src/IDBCursor.js>',
          '<file_strip_banner:src/IDBIndex.js>',
          '<file_strip_banner:src/IDBObjectStore.js>',
          '<file_strip_banner:src/IDBTransaction.js>',
          '<file_strip_banner:src/IDBDatabase.js>',
          '<file_strip_banner:src/shimIndexedDB.js>',
          '<file_strip_banner:src/globalVars.js>'
        ],
        dest: 'dist/<%= pkg.name %>.js'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dist.dest>'],
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint test'
    },
    jshint: {
      options: {
        curly: true,//require { }
        eqeqeq: true,//=== instead of ==
        immed: true,//wrap IIFE in parentheses
        latedef: true,//variable declared before usage
        newcap: true,//capitalize class names
        noarg: true,//forbids arguments.calle(e/r)
        undef: true,//checks for undefined variables

        eqnull: true,//== allowed for undefined/null checking
        expr: true,//allow foo && foo()

        browser: true//browser environment
      },
      globals: {
        // Build defines.
        DEBUG: true,

        // Shim.
        console: true,
        DOMException: true,
        IDBTransaction: true,
        idbModules: true,
        logger: true,

        // Tests.
        _: true,
        asyncTest: true,
        DB: true,
        dbVersion: true,
        deepEqual: true,
        equal: true,
        expect: true,
        fail: true,
        module: true,
        nextTest: true,
        notEqual: true,
        ok: true,
        sample: true,
        start: true,
        stop: true,
        queuedAsyncTest: true,
        queuedModule: true,
        unescape: true
      }
    },
    uglify: {
      mangle: { defines: { DEBUG: ['name', false] } }
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint concat min');

};

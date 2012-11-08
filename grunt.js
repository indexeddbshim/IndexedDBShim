/*global module:false*/
module.exports = function(grunt) {
	var srcFiles = [ 'src/Init.js', 'src/util.js', 'src/Sca.js', 'src/Key.js',
			'src/Event.js', 'src/IDBRequest.js', 'src/IDBKeyRange.js',
			'src/IDBCursor.js', 'src/IDBIndex.js', 'src/IDBObjectStore.js',
			'src/IDBTransaction.js', 'src/IDBDatabase.js',
			'src/shimIndexedDB.js', 'src/globalVars.js' ];
	// Project configuration.
	grunt.initConfig({
		pkg : '<json:package.json>',
		meta : {
			banner : '/*! <%= pkg.name %> */'
		},
		lint : {
			files : [ 'grunt.js', 'src/**/*.js', 'test/**/*.js' ]
		},
		concat : {
			dist : {
				src : srcFiles,
				dest : 'dist/<%= pkg.name %>.js'
			}
		},
		'jsmin-sourcemap' : {
			all : {
				src : srcFiles,
				dest : 'dist/<%= pkg.name %>.min.js',
				srcRoot : '..'
			}
		},
		watch : {
			files : '<config:lint.files>',
			tasks : 'lint test'
		},

		server : {
			base : '.',
			port : 9999
		},

		qunit : {
			all : [ 'http://localhost:9999/test/index.html' ]
		},

		jshint : {
			options : {
				camelcase : true,
				nonew : true,
				curly : true,// require { }
				eqeqeq : true,// === instead of ==
				immed : true,// wrap IIFE in parentheses
				latedef : true,// variable declared before usage
				newcap : true,// capitalize class names
				undef : true,// checks for undefined variables
				regexp : true,
				evil : true,
				eqnull : true,// == allowed for undefined/null checking
				expr : true,// allow foo && foo()
				browser : true
			// browser environment
			},
			globals : {
				// Shim.
				DEBUG : true,
				console : true,
				DOMException : true,
				IDBTransaction : true,
				idbModules : true,
				logger : true,

				// Tests.
				_ : true,
				asyncTest : true,
				DB : true,
				dbVersion : true,
				deepEqual : true,
				equal : true,
				expect : true,
				fail : true,
				module : true,
				nextTest : true,
				notEqual : true,
				ok : true,
				sample : true,
				start : true,
				stop : true,
				queuedAsyncTest : true,
				queuedModule : true,
				unescape : true
			}
		},
		uglify : {}
	});

	// Default task.
	grunt.loadNpmTasks('grunt-jsmin-sourcemap');
	grunt.registerTask('build', 'lint concat jsmin-sourcemap');
	grunt.registerTask('test', 'build server qunit');
	
	grunt.registerTask('default', 'build');
};

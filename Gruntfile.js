/* global module:false */
module.exports = function(grunt) {
	var srcFiles = ['src/Init.js', 'src/util.js', 'src/Sca.js', 'src/Key.js', 'src/Event.js', 'src/IDBRequest.js', 'src/IDBKeyRange.js', 'src/IDBCursor.js', 'src/IDBIndex.js', 'src/IDBObjectStore.js', 'src/IDBTransaction.js', 'src/IDBDatabase.js', 'src/shimIndexedDB.js', 'src/globalVars.js'];
	// Project configuration.
	var saucekey = null;
	if (typeof process.env.saucekey !== "undefined") {
		saucekey = process.env.saucekey;
	}
	grunt.initConfig({
		jshint: {
			files: ['grunt.js', 'src/**/*.js', 'test/**/*.js']
		},
		concat: {
			dist: {
				src: srcFiles,
				dest: 'dist/IndexedDBShim.js'
			}
		},
		uglify: {
			all: {
				src: srcFiles,
				dest: 'dist/IndexedDBShim.min.js'
			}
		},
		'jsmin-sourcemap': {
			all: {
				src: srcFiles,
				dest: 'dist/IndexedDBShim.min.js',
				srcRoot: '..'
			}
		},
		connect: {
			server: {
				options: {
					base: '.',
					port: 9999
				}
			}
		},
		qunit: {
			all: ['http://localhost:9999/test/index.html']
		},

		'saucelabs-qunit': {
			all: {
				username: 'indexeddbshim',
				key: saucekey,
				testname: 'IndexedDBShim',
				tags: ['master'],
				urls: ['http://127.0.0.1:9999/test/index.html'],
				browsers: [{
					browserName: 'safari',
					platform: 'Windows 2008',
					version: '5'
				}, {
					browserName: 'opera'
				}]
			}
		},

		jshint: {
			options: {
				camelcase: true,
				nonew: true,
				curly: true, // require { }
				eqeqeq: true, // === instead of ==
				immed: true, // wrap IIFE in parentheses
				latedef: true, // variable declared before usage
				newcap: true, // capitalize class names
				undef: true, // checks for undefined variables
				regexp: true,
				evil: true,
				eqnull: true, // == allowed for undefined/null checking
				expr: true, // allow foo && foo()
				browser: true
				// browser environment
			},
			globals: {
				// Shim.
				DEBUG: true,
				console: true,
				DOMException: true,
				IDBTransaction: true,
				idbModules: true,
				logger: true,
				require: true,

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
				unescape: true,
				process: true
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-jsmin-sourcemap');
	grunt.loadNpmTasks('grunt-saucelabs');
	grunt.registerTask('build', ['jshint', 'concat', 'uglify']);


	grunt.registerTask("publish", function() {
		var done = this.async();
		console.log("Running publish action");
		var request = require("request");
		request("https://api.travis-ci.org/repos/axemclion/IndexedDBShim/builds.json", function(err, res, body) {
			var commit = JSON.parse(body)[0];
			var commitMessage = ["Commit from Travis Build #", commit.number, "\nBuild - https://travis-ci.org/axemclion/IndexedDBShim/builds/", commit.id, "\nBranch : ", commit.branch, "@ ", commit.commit];
			console.log("Got Travis Build details");
			request({
				url: "https://api.github.com/repos/axemclion/IndexedDBShim/merges?access_token=" + process.env.githubtoken,
				method: "POST",
				body: JSON.stringify({
					"base": "gh-pages",
					"head": "master",
					"commit_message": commitMessage.join("")
				})
			}, function(err, response, body) {
				console.log(body);
				done(!err);
			});
		});
	});

	var testJobs = ["build", "connect"];
	if (saucekey !== null) {
		testJobs.push("saucelabs-qunit");
	}

	if (process.env.CI && process.env.TRAVIS) {
		testJobs.push("publish");
	}
	testJobs.push("publish");
	grunt.registerTask('test', testJobs);

	grunt.registerTask('default', 'build');
};
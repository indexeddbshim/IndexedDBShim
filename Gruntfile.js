/* global module:false */
module.exports = function(grunt) {
	var srcFiles = ['src/Init.js', 'src/util.js', 'src/Sca.js', 'src/Key.js', 'src/Event.js', 'src/IDBRequest.js', 'src/IDBKeyRange.js', 'src/IDBCursor.js', 'src/IDBIndex.js', 'src/IDBObjectStore.js', 'src/IDBTransaction.js', 'src/IDBDatabase.js', 'src/shimIndexedDB.js', 'src/globalVars.js'];
	// Project configuration.
	var saucekey = null;
	if (typeof process.env.saucekey !== "undefined") {
		saucekey = process.env.saucekey;
	}
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			dist: {
				src: srcFiles,
				dest: 'dist/<%= pkg.name%>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
				sourceMap: 'dist/<%=pkg.name%>.min.map',
				sourceMapRoot: 'http://nparashuram.com/IndexedDBShim/',
				sourceMappingURL: 'http://nparashuram.com/IndexedDBShim/dist/<%=pkg.name%>.min.map'
			},
			all: {
				src: srcFiles,
				dest: 'dist/<%=pkg.name%>.min.js',
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
				options : {
					username: 'indexeddbshim',
					key: saucekey,
					tags: ['master'],
					urls: ['http://127.0.0.1:9999/test/index.html'],
					browsers: [{
						browserName: 'safari',
						platform: 'Windows 2008',
						version: '5'
					}, {
						browserName: 'opera',
						version: '12'
					}]
				}
			}
		},

		jshint: {
			files: ['grunt.js', 'src/**/*.js', 'test/**/*.js'],
			options: {
				jshintrc: '.jshintrc'
			}
		},
		watch: {
			dev: {
				files: ["src/*"],
				tasks: ["jshint", "concat"]
			}
		}
	});

	for (var key in grunt.file.readJSON('package.json').devDependencies) {
		if (key !== 'grunt' && key.indexOf('grunt') === 0) grunt.loadNpmTasks(key);
	}
	
	grunt.registerTask("publish", "Publish to gh-pages", function() {
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

	grunt.registerTask('build', ['jshint', 'concat', 'uglify']);
	var testJobs = ["build", "connect"];
	if (saucekey !== null) {
		testJobs.push("saucelabs-qunit");
	}

	if (process.env.CI && process.env.TRAVIS) {
		testJobs.push("publish");
	}
	grunt.registerTask('test', testJobs);

	grunt.registerTask('default', 'build');
	grunt.registerTask('dev', ['build', 'connect', 'watch']);
};
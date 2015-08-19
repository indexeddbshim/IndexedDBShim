/* global module:false */
/*jshint globalstrict: true*/
"use strict";

module.exports = function(grunt) {
	var srcFiles = ['src/Init.js', 'src/util.js', 'src/polyfill.js', 'src/Sca.js', 'src/Key.js', 'src/Event.js', 'src/DOMException.js', 'src/IDBRequest.js', 'src/IDBKeyRange.js', 'src/IDBCursor.js', 'src/IDBIndex.js', 'src/IDBObjectStore.js', 'src/IDBTransaction.js', 'src/IDBDatabase.js', 'src/IDBFactory.js', 'src/globalVars.js'];
	var saucekey = null;
	if (typeof process.env.saucekey !== "undefined") {
		saucekey = process.env.SAUCE_ACCESS_KEY;
	}
	var pkg = require('./package.json');
    bumpVersion(pkg);
	grunt.initConfig({
		pkg: pkg,
		concat: {
			dist: {
				src: srcFiles,
				dest: 'dist/<%= pkg.name%>.js'
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
				sourceMap: 'dist/<%=pkg.name%>.min.js.map',
				sourceMapRoot: 'http://nparashuram.com/IndexedDBShim/dist/',
				sourceMappingURL: 'http://nparashuram.com/IndexedDBShim/dist/<%=pkg.name%>.min.js.map'
			},
			all: {
				src: srcFiles,
				dest: 'dist/<%=pkg.name%>.min.js'
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
			all: {
				options: {
					urls: ['http://localhost:9999/test/index.html']
				}
			}
		},

		'saucelabs-qunit': {
			all: {
				options: {
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
						}
					]
				}
			}
		},

		jshint: {
			files: ['src/**/*.js'],
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

	grunt.registerTask('build', ['jshint', 'concat', 'uglify']);
	var testJobs = ["build", "connect"];
	if (saucekey !== null) {
		testJobs.push("saucelabs-qunit");
	} else {
		testJobs.push("qunit");
	}

	grunt.registerTask('test', testJobs);

	grunt.registerTask('default', 'build');
	grunt.registerTask('dev', ['build', 'connect', 'watch']);
};

/**
 * Bumps the revision number of the node package object, so the the banner in indexeddbshim.min.js
 * will match the next upcoming revision of the package.
 */
function bumpVersion(pkg) {
    var version = pkg.version.split('.');
    version[2] = parseInt(version[2]) + 1;
    pkg.version = version.join('.');
}

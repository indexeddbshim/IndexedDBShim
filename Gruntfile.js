/* global module:false */
"use strict";

module.exports = function(grunt) {
	var srcFiles = [
		'Init.js', 'util.js', 'polyfill.js', 'Sca.js', 'Key.js', 'Event.js',
		'DOMException.js', 'IDBRequest.js', 'IDBKeyRange.js', 'IDBCursor.js',
		'IDBIndex.js', 'IDBObjectStore.js', 'IDBTransaction.js', 'IDBDatabase.js',
		'IDBFactory.js', 'globalVars.js'
	].map(function (srcFile) {return 'src/' + srcFile;});
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
		babel: {
			options: {
				sourceMap: true
			},
			dist: {
				files: {
					'dist/<%= pkg.name%>.js': 'dist/<%= pkg.name%>.js',
					'dist/<%= pkg.name%>-node.js': 'src/<%= pkg.name%>-node.js'
				}
			}
		},
		browserify: {
			dist: {
				files: {
					'dist/<%= pkg.name%>.js': 'dist/<%= pkg.name%>.js',
					'dist/<%= pkg.name%>-node.js': 'dist/<%= pkg.name%>-node.js'
				}
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
				sourceMap: true,
				sourceMapName: 'dist/<%=pkg.name%>.min.js.map',
				sourceMapRoot: 'http://nparashuram.com/IndexedDBShim/dist/'
			},
			all: {
				src: 'dist/<%= pkg.name%>.js',
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

		eslint: {
			files: ['src/**/*.js', 'Gruntfile.js', 'build.js'],
			options: {
				configFile: ".eslintrc"
			}
		},

		watch: {
			dev: {
				files: ["src/*"],
				tasks: ["eslint", "concat", "babel", "browserify"]
			}
		}
	});

	for (var key in grunt.file.readJSON('package.json').devDependencies) {
		if (key !== 'grunt' && key.indexOf('grunt') === 0) {grunt.loadNpmTasks(key);}
	}

	grunt.registerTask('build', ['eslint', 'concat', 'babel', 'browserify', 'uglify']);
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

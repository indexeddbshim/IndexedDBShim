/* global module:false */
'use strict';

module.exports = function (grunt) {
    const sauceuser = process.env.SAUCE_USERNAME !== undefined ? process.env.SAUCE_USERNAME : 'indexeddbshim';
    const saucekey = process.env.SAUCE_ACCESS_KEY !== undefined ? process.env.SAUCE_ACCESS_KEY : null;

    const pkg = require('./package.json');
    bumpVersion(pkg);
    grunt.initConfig({
        pkg: pkg,
        browserify: {
            unicode: {
                options: {
                    transform: [['babelify']]
                },
                files: {
                    'dist/<%= pkg.name%>-UnicodeIdentifiers.js': 'src/browser-UnicodeIdentifiers.js'
                }
            },
            unicodeNode: {
                options: {
                    transform: [['babelify']],
                    exclude: ['websql/custom', 'websql/lib/sqlite/SQLiteDatabase'],
                    // Avoid `window` checking
                    browserifyOptions: {
                        standalone: 'dummyPlaceholder',
                        builtins: false, // No need to define in Node (if there are any)
                        commondir: false, // No need in Node to look up to nearest common directory (if there are any)
                        browserField: false, // Avoid using `browser` entry in package.json
                        // https://github.com/substack/node-browserify/issues/1277#issuecomment-115198436
                        // One would think this wouldn't be necessary with `builts`: false
                        insertGlobalVars: {
                            process: function () { // Avoid having a non-Node polyfill added
                                return;
                            }
                        }
                    }
                },
                files: {
                    'dist/<%= pkg.name%>-UnicodeIdentifiers-node.js': 'src/node-UnicodeIdentifiers.js'
                }
            },
            browser: {
                options: {
                    transform: [['babelify', {sourceMaps: true}]]
                },
                files: {
                    'dist/<%= pkg.name%>.js': 'src/browser.js'
                }
            },
            browserNoninvasive: {
                options: {
                    transform: [['babelify', {sourceMaps: true}]]
                },
                files: {
                    'dist/<%= pkg.name%>-noninvasive.js': 'src/setGlobalVars.js'
                }
            },
            node: {
                options: {
                    transform: [['babelify', {sourceMaps: true}]],
                    exclude: ['websql/custom', 'websql/lib/sqlite/SQLiteDatabase'],
                    // Avoid `window` checking
                    browserifyOptions: {
                        standalone: 'dummyPlaceholder',
                        builtins: false, // No need to define in Node (if there are any)
                        commondir: false, // No need in Node to look up to nearest common directory (if there are any)
                        browserField: false, // Avoid using `browser` entry in package.json
                        // https://github.com/substack/node-browserify/issues/1277#issuecomment-115198436
                        // One would think this wouldn't be necessary with `builts`: false
                        insertGlobalVars: {
                            process: function () { // Avoid having a non-Node polyfill added
                                return;
                            }
                        }
                    }
                },
                files: {
                    'dist/<%= pkg.name%>-node.js': 'src/node.js'
                }
            }
        },
        uglify: {
            unicode: {
                src: 'dist/<%= pkg.name%>-UnicodeIdentifiers.js',
                dest: 'dist/<%= pkg.name%>-UnicodeIdentifiers.min.js'
            },
            unicodeNode: {
                src: 'dist/<%= pkg.name%>-UnicodeIdentifiers-node.js',
                dest: 'dist/<%= pkg.name%>-UnicodeIdentifiers-node.min.js'
            },
            browser: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    sourceMap: true,
                    sourceMapName: 'dist/<%=pkg.name%>.min.js.map',
                    sourceMapRoot: 'http://nparashuram.com/IndexedDBShim/dist/'
                },
                src: 'dist/<%= pkg.name%>.js',
                dest: 'dist/<%=pkg.name%>.min.js'
            },
            browserNoninvasive: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    sourceMap: true,
                    sourceMapName: 'dist/<%=pkg.name%>-noninvasive.min.js.map',
                    sourceMapRoot: 'http://nparashuram.com/IndexedDBShim/dist/'
                },
                src: 'dist/<%= pkg.name%>-noninvasive.js',
                dest: 'dist/<%=pkg.name%>-noninvasive.min.js'
            },
            node: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    sourceMap: true,
                    sourceMapName: 'dist/<%=pkg.name%>-node.min.js.map',
                    sourceMapRoot: 'http://nparashuram.com/IndexedDBShim/dist/'
                },
                src: 'dist/<%= pkg.name%>-node.js',
                dest: 'dist/<%=pkg.name%>-node.min.js'
            }
        },
        clean: {
            qunitTests: {
                src: ['D_dbname*']
            },
            mochaTests: {
                src: ['D_indexeddbshim_test_database_*', 'D_test.sqlite']
            },
            fake: {
                src: ['D_test0.*']
            },
            mock: {
                src: ['D_test_database*']
            },
            w3c: {
                src: ['D_db*', 'D_test*', 'D_about*', 'D_^I^D^B*', 'D_blank*', 'D_database_name*', 'D_idbtransaction*', 'D_x', 'D_y', 'D_webworker*']
            },
            w3cOld: {
                src: ['D_db.sqlite*', 'D_test*', 'D_database_name*', 'D_idbtransaction*']
            },
            sysDB: {
                src: ['__sysdb__*']
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
                    urls: ['http://localhost:9999/tests-qunit/index.html']
                }
            }
        },
        'node-qunit': {
            all: {
                deps: ['./tests-qunit/node-init.js', './tests-qunit/queuedUnit.js', './tests-qunit/sampleData.js', './tests-qunit/startTests.js'],
                code: './dist/<%= pkg.name%>-node.js',
                tests: './tests-qunit/nodeTest.js',
                callback: function (err, res) { // var doneCb = this.async();
                    if (err) console.log(err);
                    else console.log(res);
                }
            }
        },

        mochaTest: {
            test: {
                options: {
                    bail: false,
                    timeout: 5000,
                    reporter: 'spec',
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
                },
                src: ['tests-mocha/test-node.js']
            },
            fake: {
                options: {
                    bail: false,
                    timeout: 5000,
                    reporter: 'spec',
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
                },
                src: ['tests-polyfill/fakeIndexedDB/test-node.js']
            },
            mock: {
                options: {
                    bail: false,
                    timeout: 5000,
                    reporter: 'spec',
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
                },
                src: ['tests-polyfill/indexedDBmock/test-node.js']
            },
            w3cOld: {
                options: {
                    bail: false,
                    timeout: 5000,
                    reporter: 'spec',
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
                },
                src: ['tests-polyfill/w3c/test-node.js']
            }
        },

        'saucelabs-qunit': {
            all: {
                options: {
                    username: sauceuser,
                    key: function () { return saucekey; }, // Workaround for https://github.com/axemclion/grunt-saucelabs/issues/215
                    tags: ['master'],
                    urls: ['http://127.0.0.1:9999/tests-qunit/index.html'],
                    testTimeout: 8000,
                    onTestComplete: function (result, callback) {
                        console.log(result);
                        callback(null);
                    },
                    browsers: [{
                        browserName: 'chrome',
                        platform: 'Windows 10',
                        version: '54.0'
                    /* }, { // Fails non-standard `webkitGetDatabaseNames` test
                        browserName: 'firefox',
                        platform: 'Windows 10',
                        version: '49.0'
                    }, { // Timing out
                        browserName: 'Safari',
                        appiumVersion: '1.5.2',
                        deviceName: 'iPhone 6',
                        deviceOrientation: 'portrait',
                        platformName: 'iOS',
                        platformVersion: '9.3',
                        name: 'iPhone 6'
                    }, { // Timing out
                        browserName: 'microsoftedge',
                        platform: 'Windows 10',
                        version: '14'
                    }, { // Timing out
                        browserName: 'safari',
                        platform: 'MacOS El Capitan 10.11',
                        version: '9'
                    }, { // Timing out
                        platform: 'Windows 7',
                        browserName: 'opera',
                        version: '12' */
                    }]
                }
            }
        },

        eslint: {
            files: ['src/**/*.js', 'tests-qunit/**/*.js', 'tests-mocha/**/*.js', 'test-support/node*.js', 'test-support/environment.js', 'test-support/custom-reporter.js', 'test-support/webworker/*.js', 'Gruntfile.js'],
            options: {
                configFile: '.eslintrc'
            }
        },

        watch: {
            all: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: ['eslint', 'browserify', 'uglify']
            },
            browser: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: ['eslint', 'browserify:browser', 'uglify:browser']
            },
            browserNoninvasive: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: ['eslint', 'browserify:browserNoninvasive', 'uglify:browserNoninvasive']
            },
            node: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: ['eslint', 'browserify:node', 'uglify:node']
            },
            unicode: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: ['eslint', 'browserify:unicode', 'uglify:unicode']
            },
            unicodeNode: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: ['eslint', 'browserify:unicodeNode', 'uglify:unicodeNode']
            }
        }
    });

    for (const key in grunt.file.readJSON('package.json').devDependencies) {
        if (key !== 'grunt' && key.indexOf('grunt') === 0) { grunt.loadNpmTasks(key); }
    }

    grunt.registerTask('build-browser', ['eslint', 'browserify:browser', 'uglify:browser']);
    grunt.registerTask('build-browserNoninvasive', ['eslint', 'browserify:browserNoninvasive', 'uglify:browserNoninvasive']);
    grunt.registerTask('build-node', ['eslint', 'browserify:node', 'uglify:node']);
    grunt.registerTask('build-unicode', ['eslint', 'browserify:unicode', 'uglify:unicode']);
    grunt.registerTask('build-unicodeNode', ['eslint', 'browserify:unicodeNode', 'uglify:unicodeNode']);
    grunt.registerTask('build', ['eslint', 'browserify', 'uglify']);

    const testJobs = ['build', 'connect'];
    grunt.registerTask('nodequnit', testJobs.concat('node-qunit'));
    grunt.registerTask('mocha', ['mochaTest:test']); // clean:mochaTests isn't working here as locked (even with force:true on it or grunt-wait) so we do in package.json
    grunt.registerTask('fake', ['mochaTest:fake']);
    grunt.registerTask('mock', ['mochaTest:mock']);
    grunt.registerTask('w3c-old', ['mochaTest:w3cOld']);

    grunt.registerTask('phantom-qunit', testJobs.concat('qunit'));

    if (saucekey !== null) {
        testJobs.push('saucelabs-qunit');
    } else {
        testJobs.push('qunit');
    }

    grunt.registerTask('sauce-qunit', testJobs);

    grunt.registerTask('clean-mocha', ['clean:mochaTests', 'clean:sysDB']);
    grunt.registerTask('clean-qunit', ['clean:qunitTests', 'clean:sysDB']);
    grunt.registerTask('clean-polyfill', ['clean:fake', 'clean:mock', 'clean:w3c-old', 'clean:sysDB']);
    grunt.registerTask('clean-fake', ['clean:fake', 'clean:sysDB']);
    grunt.registerTask('clean-mock', ['clean:mock', 'clean:sysDB']);
    grunt.registerTask('clean-w3c', ['clean:w3c', 'clean:sysDB']);
    grunt.registerTask('clean-w3c-old', ['clean:w3cOld', 'clean:sysDB']);

    grunt.registerTask('default', 'build');
    grunt.registerTask('dev', ['build', 'connect', 'watch:all']);
    grunt.registerTask('dev-browser', ['build-browser', 'connect', 'watch:browser']);
    grunt.registerTask('dev-browserNoninvasive', ['build-browserNoninvasive', 'connect', 'watch:browserNoninvasive']);
    grunt.registerTask('dev-node', ['build-node', 'connect', 'watch:node']);
    grunt.registerTask('dev-unicode', ['build-unicode', 'connect', 'watch:unicode']);
    grunt.registerTask('dev-unicodeNode', ['build-unicodeNode', 'connect', 'watch:unicodeNode']);

    grunt.event.on('qunit.error.onError', function (msg, trace) {
        grunt.log.ok('Grunt qunit: ' + msg + '::' + JSON.stringify(trace));
    });
};

/**
 * Bumps the revision number of the node package object, so the the banner in indexeddbshim.min.js
 * will match the next upcoming revision of the package.
 */
function bumpVersion (pkg) {
    const version = pkg.version.split('.');
    version[2] = parseInt(version[2]) + 1;
    pkg.version = version.join('.');
}

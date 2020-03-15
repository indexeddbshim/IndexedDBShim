/* eslint-env node */
'use strict';

const pkg = require('./package.json');

module.exports = function (grunt) {
    const sauceuser = process.env.SAUCE_USERNAME !== undefined ? process.env.SAUCE_USERNAME : 'indexeddbshim'; // eslint-disable-line no-process-env
    const saucekey = process.env.SAUCE_ACCESS_KEY !== undefined ? process.env.SAUCE_ACCESS_KEY : null; // eslint-disable-line no-process-env

    // bumpVersion(pkg);
    // Todo: Add `grunt-mocha-istanbul`! https://www.npmjs.com/package/grunt-mocha-istanbul
    grunt.initConfig({
        pkg,
        uglify: {
            key: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    sourceMap: true,
                    sourceMapIn: 'dist/<%=pkg.name%>-Key.js.map',
                    sourceMapName: 'dist/<%=pkg.name%>-Key.min.js.map',
                    sourceMapRoot: 'https://raw.githack.com/axemclion/IndexedDBShim/v' + pkg.version + '/dist/'
                },
                src: 'dist/<%= pkg.name%>-Key.js',
                dest: 'dist/<%= pkg.name%>-Key.min.js'
            },
            unicode: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    sourceMap: true,
                    sourceMapIn: 'dist/<%=pkg.name%>-UnicodeIdentifiers.js.map',
                    sourceMapName: 'dist/<%=pkg.name%>-UnicodeIdentifiers.min.js.map',
                    sourceMapRoot: 'https://raw.githack.com/axemclion/IndexedDBShim/v' + pkg.version + '/dist/'
                },
                src: 'dist/<%= pkg.name%>-UnicodeIdentifiers.js',
                dest: 'dist/<%= pkg.name%>-UnicodeIdentifiers.min.js'
            },
            browser: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    sourceMap: true,
                    sourceMapIn: 'dist/<%=pkg.name%>.js.map',
                    sourceMapName: 'dist/<%=pkg.name%>.min.js.map',
                    sourceMapRoot: 'https://cdn.rawgit.com/axemclion/IndexedDBShim/v' + pkg.version + '/dist/'
                },
                src: 'dist/<%= pkg.name%>.js',
                dest: 'dist/<%=pkg.name%>.min.js'
            },
            browserNoninvasive: {
                options: {
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %> */\n',
                    sourceMap: true,
                    sourceMapIn: 'dist/<%=pkg.name%>-noninvasive.js.map',
                    sourceMapName: 'dist/<%=pkg.name%>-noninvasive.min.js.map',
                    sourceMapRoot: 'https://cdn.rawgit.com/axemclion/IndexedDBShim/v' + pkg.version + '/dist/'
                },
                src: 'dist/<%= pkg.name%>-noninvasive.js',
                dest: 'dist/<%=pkg.name%>-noninvasive.min.js'
            }
        },
        connect: {
            server: {
                options: {
                    base: '.',
                    port: 9999,
                    middleware (connect, options, middlewares) {
                        middlewares.unshift((req, res, next) => {
                            // Allow access to this domain from web-platform-tests so we can add the polyfill to its tests
                            res.setHeader('Access-Control-Allow-Origin', 'http://web-platform.test:8000');
                            res.setHeader('Access-Control-Allow-Methods', 'GET');
                            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
                            next();
                        });
                        return middlewares;
                    }
                }
            }
        },
        qunit_puppeteer: {
            test: {
                options: {
                    headless: true,
                    traceSettings: {
                        outputConsole: false,
                        outputAllAssertions: false
                    },
                    /*
                    viewport: {
                        width: 1920,
                        height: 1080
                    },
                    mobile: {
                        emulate: false,
                        landscape: true,
                        tablet: false
                    },
                    */
                    qunitPage: 'http://localhost:9999/tests-qunit/index.html'
                }
            }
        },
        'saucelabs-qunit': {
            all: {
                options: {
                    username: sauceuser,
                    key () { return saucekey; }, // Workaround for https://github.com/axemclion/grunt-saucelabs/issues/215
                    tags: ['master'],
                    urls: ['http://127.0.0.1:9999/tests-qunit/index.html'],
                    testTimeout: 8000,
                    onTestComplete (result, callback) {
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

        mochaTest: {
            test: {
                options: {
                    bail: false,
                    require: 'source-map-support/register',
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
                    require: 'source-map-support/register',
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
                    require: 'source-map-support/register',
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
                    require: 'source-map-support/register',
                    timeout: 5000,
                    reporter: 'spec',
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
                },
                src: ['tests-polyfill/w3c/test-node.js']
            }
        },

        watch: {
            all: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: ['uglify']
            },
            browser: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: [
                    // 'eslint',
                    'uglify:browser'
                ]
            },
            browserNoninvasive: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: [
                    // 'eslint',
                    'uglify:browserNoninvasive'
                ]
            },
            node: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: [
                    // 'eslint'
                ]
            },
            unicode: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: [
                    // 'eslint',
                    'uglify:unicode'
                ]
            },
            unicodeNode: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: []
            }
        }
    });

    for (const key in grunt.file.readJSON('package.json').devDependencies) {
        if (key !== 'grunt' && key.indexOf('grunt') === 0 && key !== 'grunt-cli') {
            grunt.loadNpmTasks(key);
        }
    }

    const testJobs = ['connect'];
    grunt.registerTask('puppeteer-qunit', ['connect', 'qunit_puppeteer']);
    grunt.registerTask('mocha', ['mochaTest:test']); // clean:mochaTests isn't working here as locked (even with force:true on it or grunt-wait) so we do in package.json
    grunt.registerTask('fake', ['mochaTest:fake']);
    grunt.registerTask('mock', ['mochaTest:mock']);
    grunt.registerTask('w3c-old', ['mochaTest:w3cOld']);

    if (saucekey !== null) {
        testJobs.push('saucelabs-qunit');
    } else {
        testJobs.push('puppeteer-qunit');
    }

    grunt.registerTask('sauce-qunit', testJobs);

    grunt.registerTask('default', 'dev');
    grunt.registerTask('dev', ['connect', 'watch:all']);
    grunt.registerTask('connect-watch', ['connect', 'watch:all']);
    grunt.registerTask('dev-browser', ['connect', 'watch:browser']);
    grunt.registerTask('dev-browserNoninvasive', ['connect', 'watch:browserNoninvasive']);
    grunt.registerTask('dev-node', ['connect', 'watch:node']);
    grunt.registerTask('dev-unicode', ['connect', 'watch:unicode']);
    grunt.registerTask('dev-unicodeNode', ['connect', 'watch:unicodeNode']);
};

/**
 * Bumps the revision number of the node package object, so the the banner in indexeddbshim.min.js
 * will match the next upcoming revision of the package.
 */
/*
function bumpVersion (pkg) {
    const version = pkg.version.split('.');
    version[2] = parseInt(version[2]) + 1;
    pkg.version = version.join('.');
}
*/

/* eslint-env node */
/* eslint-disable node/no-unsupported-features/es-syntax */
'use strict';

const babel = require('rollup-plugin-babel');
const nodeResolve = require('@rollup/plugin-node-resolve');
const commonJS = require('@rollup/plugin-commonjs');

const globals = require('rollup-plugin-node-globals');
const nodePolyfills = require('rollup-plugin-node-polyfills');

const json = require('@rollup/plugin-json');
const replace = require('@rollup/plugin-replace');
const builtins = require('builtin-modules');

const pkg = require('./package.json');

const getRollupPlugins = (babelOptions, {addBuiltins} = {}) => {
    return {
        plugins () {
            const ret = [
                nodeResolve({
                    preferBuiltins: !addBuiltins
                }),
                commonJS({
                    // Gets issue with dynamic requires and we aren't
                    //  "importing" anyways
                    ignore: ['sqlite3']
                }),
                babel(babelOptions)
            ];
            if (addBuiltins) {
                ret.unshift(globals(), nodePolyfills());
            } else {
                // Fix from https://github.com/rollup/rollup/issues/1507#issuecomment-340550539
                ret.splice(1, 0, replace({
                    delimiters: ['', ''],
                    // Replacements:
                    'require(\'readable-stream/transform\')': 'require(\'stream\').Transform',
                    'require("readable-stream/transform")': 'require("stream").Transform',
                    'readable-stream': 'stream'
                }));

                ret.unshift(json());
            }
            return ret;
        }
    };
};

const browserEnvironment = () => {
    return {
        format: 'umd',
        sourcemap: true,
        ...getRollupPlugins(babelBrowserOptions, {addBuiltins: true}),
        mainFields: ['browser', 'module', 'main'] // Don't need 'jsnext'?
    };
};

const nodeEnvironment = () => {
    return {
        // Avoid using `browser` entry in package.json
        // mainFields: ['module', 'main'], // Default
        format: 'cjs',
        // Avoid `window` checking (link now broken)
        // https://github.com/substack/node-rollup/issues/1277#issuecomment-115198436
        name: 'dummyPlaceholder',
        sourcemap: true,
        ...getRollupPlugins(babelNodeOptions, {addBuiltins: false}),
        external: [
            ...builtins,
            'websql/custom/index.js', 'websql/lib/sqlite/SQLiteDatabase',
            // Fix from https://github.com/rollup/rollup/issues/1507#issuecomment-340550539
            'readable-stream', 'readable-stream/transform'
        ]
        // Notes when using browserify:
        // Could try for consistency with any relative paths if still
        //  seeing https://github.com/axemclion/IndexedDBShim/issues/291 ;
        //  see also http://stackoverflow.com/a/33124979/271577
        // basedir: __dirname,
    };
};

const babelBrowserOptions = {
    // sourceMapsAbsolute: true,
    plugins: ['add-module-exports'],
    presets: [
        ['@babel/env', {
            targets: pkg.browserslist[0] // cover 100%
        }]
    ]
};

const babelNodeOptions = {...babelBrowserOptions,
    presets: [
        ['@babel/env', {
            targets: {
                node: '6.9'
            }
        }]
    ]
};

module.exports = function (grunt) {
    const sauceuser = process.env.SAUCE_USERNAME !== undefined ? process.env.SAUCE_USERNAME : 'indexeddbshim'; // eslint-disable-line no-process-env
    const saucekey = process.env.SAUCE_ACCESS_KEY !== undefined ? process.env.SAUCE_ACCESS_KEY : null; // eslint-disable-line no-process-env

    // bumpVersion(pkg);
    // Todo: Add `grunt-mocha-istanbul`! https://www.npmjs.com/package/grunt-mocha-istanbul
    grunt.initConfig({
        pkg,
        rollup: {
            key: {
                options: {
                    ...browserEnvironment(),
                    name: 'IDBKeyUtils'
                },
                files: {
                    'dist/<%= pkg.name%>-Key.js': 'src/Key.js'
                }
            },
            unicode: {
                options: browserEnvironment(),
                files: {
                    'dist/<%= pkg.name%>-UnicodeIdentifiers.js': 'src/browser-UnicodeIdentifiers.js'
                }
            },
            unicodeNode: {
                options: nodeEnvironment(),
                files: {
                    'dist/<%= pkg.name%>-UnicodeIdentifiers-node.js': 'src/node-UnicodeIdentifiers.js'
                }
            },
            browser: {
                options: browserEnvironment(),
                files: {
                    'dist/<%= pkg.name%>.js': 'src/browser.js'
                }
            },
            browserNoninvasive: {
                options: {
                    ...browserEnvironment(),
                    name: 'setGlobalVars'
                },
                files: {
                    'dist/<%= pkg.name%>-noninvasive.js': 'src/browser-noninvasive.js'
                }
            },
            node: {
                options: nodeEnvironment(),
                files: {
                    'dist/<%= pkg.name%>-node.js': 'src/node.js'
                }
            }
        },
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
                src: ['D_^D^B2*', 'D_db*', 'D_test*', 'D_about*', 'D_^I^D^B*', 'D_blank*', 'D_database_name*', 'D_idbtransaction*', 'D_x', 'D_x.sqlite', 'D_y', 'D_y.sqlite', 'D_webworker*', 'D_http*']
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
        'node-qunit': {
            all: {
                deps: ['./tests-qunit/node-init.js', './tests-qunit/queuedUnit.js', './tests-qunit/startTests.js'],
                code: './dist/<%= pkg.name%>-node.js',
                tests: './tests-qunit/nodeTest.js',
                callback (err, res) { // var doneCb = this.async();
                    if (err) console.log(err);
                    else console.log(res);
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

        eslint: {
            files: ['**/*.md', 'src/**/*.js', 'tests-qunit/**/*.js', 'tests-mocha/**/*.js', 'test-support/*.js', 'test-support/webworker/*.js', 'Gruntfile.js', '!test-support/qunit-2.1.1.js', '!test-support/latest-erring-bundled.js', '!src/unicode-regex.js', '!web-platform-tests/**', '!node_modules/**', '!tests-polyfill/**'],
            /*
            // Didn't work for some reason
            // https://github.com/sindresorhus/grunt-eslint/issues/119#issuecomment-343716068
            files: [
                '**'
            ].concat(grunt.file.read('.eslintignore').split('\n')
                .map(e => e.split('#', 1)[0].trim()).filter(e => e !== '')
                .map(e => e.startsWith('!') ? e.slice(1) : `!${e}`)),
            */
            options: {
                configFile: '.eslintrc.js'
            }
        },

        watch: {
            all: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: ['rollup', 'uglify']
            },
            browser: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: [
                    // 'eslint',
                    'rollup:browser', 'uglify:browser'
                ]
            },
            browserNoninvasive: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: [
                    // 'eslint',
                    'rollup:browserNoninvasive', 'uglify:browserNoninvasive'
                ]
            },
            node: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: [
                    // 'eslint',
                    'rollup:node'
                ]
            },
            unicode: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: [
                    // 'eslint',
                    'rollup:unicode', 'uglify:unicode'
                ]
            },
            unicodeNode: {
                files: ['Gruntfile.js', 'src/*', 'node_modules/eventtarget/EventTarget.js', 'node_modules/websql/lib/websql/WebSQLTransaction.js', 'node_modules/websql/lib/websql/WebSQLDatabase.js'],
                tasks: ['rollup:unicodeNode']
            }
        },

        copy: {
            'test-files': {
                files: [
                    {src: 'node_modules/regenerator-runtime/runtime.js', dest: 'test-support/regenerator-runtime/runtime.js', filter: 'isFile'},
                    {src: 'node_modules/core-js-bundle/minified.js', dest: 'test-support/core-js-bundle/minified.js', filter: 'isFile'},
                    {src: 'node_modules/source-map-support/browser-source-map-support.js', dest: 'test-support/source-map-support/browser-source-map-support.js', filter: 'isFile'},
                    {src: 'node_modules/mocha/mocha.css', dest: 'test-support/mocha/mocha.css', filter: 'isFile'},
                    {src: 'node_modules/mocha/mocha.js', dest: 'test-support/mocha/mocha.js', filter: 'isFile'},
                    {src: 'node_modules/chai/chai.js', dest: 'test-support/chai/chai.js', filter: 'isFile'},
                    {src: 'node_modules/sinon/pkg/sinon-no-sourcemaps.js', dest: 'test-support/sinon/pkg/sinon-no-sourcemaps.js', filter: 'isFile'}
                ]
            },
            regex: {
                files: [
                    {src: 'node_modules/unicode-10.0.0/Binary_Property/Expands_On_NFD/regex.js', dest: 'src/unicode-regex.js', filter: 'isFile'}
                ]
            }
        }
    });

    for (const key in grunt.file.readJSON('package.json').devDependencies) {
        if (key !== 'grunt' && key.indexOf('grunt') === 0 && key !== 'grunt-cli') {
            grunt.loadNpmTasks(key);
        }
    }

    grunt.registerTask('build-browser', [
        // 'eslint',
        'rollup:browser', 'uglify:browser'
    ]);
    grunt.registerTask('build-browserNoninvasive', [
        // 'eslint',
        'rollup:browserNoninvasive', 'uglify:browserNoninvasive'
    ]);
    grunt.registerTask('build-node', [
        // 'eslint',
        'rollup:node'
    ]);
    grunt.registerTask('build-unicode', [
        // 'eslint',
        'rollup:unicode', 'uglify:unicode'
    ]);
    grunt.registerTask('build-unicodeNode', ['rollup:unicodeNode']);
    grunt.registerTask('build-key', [
        // 'eslint',
        'rollup:key', 'uglify:key'
    ]);
    grunt.registerTask('build', ['rollup', 'uglify']);

    const testJobs = ['build', 'connect'];
    grunt.registerTask('nodequnit', 'node-qunit');
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

    grunt.registerTask('clean-mocha', ['clean:mochaTests', 'clean:sysDB']);
    grunt.registerTask('clean-qunit', ['clean:qunitTests', 'clean:sysDB']);
    grunt.registerTask('clean-polyfill', ['clean:fake', 'clean:mock', 'clean:w3cOld', 'clean:sysDB']);
    grunt.registerTask('clean-fake', ['clean:fake', 'clean:sysDB']);
    grunt.registerTask('clean-mock', ['clean:mock', 'clean:sysDB']);
    grunt.registerTask('clean-w3c', ['clean:w3c', 'clean:sysDB']);
    grunt.registerTask('clean-w3c-old', ['clean:w3cOld', 'clean:sysDB']);

    grunt.registerTask('default', 'build');
    grunt.registerTask('dev', ['build', 'connect', 'watch:all']);
    grunt.registerTask('connect-watch', ['connect', 'watch:all']);
    grunt.registerTask('dev-browser', ['build-browser', 'connect', 'watch:browser']);
    grunt.registerTask('dev-browserNoninvasive', ['build-browserNoninvasive', 'connect', 'watch:browserNoninvasive']);
    grunt.registerTask('dev-node', ['build-node', 'connect', 'watch:node']);
    grunt.registerTask('dev-unicode', ['build-unicode', 'connect', 'watch:unicode']);
    grunt.registerTask('dev-unicodeNode', ['build-unicodeNode', 'connect', 'watch:unicodeNode']);

    grunt.event.on('qunit.error.onError', (msg, trace) => {
        grunt.log.ok('Grunt qunit: ' + msg + '::' + JSON.stringify(trace));
    });
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

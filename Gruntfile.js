/* global module:false */
'use strict';

module.exports = function (grunt) {
    let saucekey = null;
    if (typeof process.env.saucekey !== 'undefined') {
        saucekey = process.env.SAUCE_ACCESS_KEY;
    }
    const pkg = require('./package.json');
    bumpVersion(pkg);
    grunt.initConfig({
        pkg: pkg,
        browserify: {
            dist: {
                options: {
                    transform: [['babelify', {sourceMaps: true}]]
                },
                files: {
                    'dist/<%= pkg.name%>.js': 'src/browser.js'
                }
            },
            node: {
                options: {
                    browserifyOptions: {
                        // https://github.com/substack/node-browserify/issues/1277#issuecomment-115198436
                        builtins: false,
                        commondir: false,
                        browserField: false,
                        insertGlobalVars: {
                            process: function () {
                                return;
                            }
                        }
                    },
                    transform: [['babelify', {sourceMaps: true}]]
                },
                files: {
                    'dist/<%= pkg.name%>-node.js': 'src/node.js'
                }
            }
        },
        uglify: {
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
        'node-qunit': {
            all: {
                deps: ['./dist/<%= pkg.name%>-node.js', './test/queuedUnit.js', './test/sampleData.js', './test/startTests.js'],
                tests: './test/nodeTest.js',
                callback: function (err, res) { // var doneCb = this.async();
                    if (err) console.log(err);
                    else console.log(res);
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
                    }]
                }
            }
        },

        eslint: {
            files: ['src/**/*.js', 'Gruntfile.js'],
            options: {
                configFile: '.eslintrc'
            }
        },

        watch: {
            dev: {
                files: ['src/*'],
                tasks: ['eslint', 'browserify', 'uglify']
            }
        }
    });

    for (const key in grunt.file.readJSON('package.json').devDependencies) {
        if (key !== 'grunt' && key.indexOf('grunt') === 0) { grunt.loadNpmTasks(key); }
    }

    grunt.registerTask('build', ['eslint', 'browserify', 'uglify']);
    const testJobs = ['build', 'connect'];
    grunt.registerTask('node', testJobs.concat('node-qunit'));

    if (saucekey !== null) {
        testJobs.push('saucelabs-qunit');
    } else {
        testJobs.push('qunit');
    }

    grunt.registerTask('test', testJobs);

    grunt.registerTask('default', 'build');
    grunt.registerTask('dev', ['build', 'connect', 'watch']);
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

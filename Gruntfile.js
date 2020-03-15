'use strict';

module.exports = function (grunt) {
    const sauceuser = process.env.SAUCE_USERNAME !== undefined ? process.env.SAUCE_USERNAME : 'indexeddbshim'; // eslint-disable-line no-process-env
    const saucekey = process.env.SAUCE_ACCESS_KEY !== undefined ? process.env.SAUCE_ACCESS_KEY : null; // eslint-disable-line no-process-env

    grunt.initConfig({
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
        }
    });

    const testJobs = [];
    grunt.registerTask('puppeteer-qunit', ['connect', 'qunit_puppeteer']);

    if (saucekey !== null) {
        testJobs.push('saucelabs-qunit');
    } else {
        testJobs.push('puppeteer-qunit');
    }

    grunt.registerTask('sauce-qunit', testJobs);
};

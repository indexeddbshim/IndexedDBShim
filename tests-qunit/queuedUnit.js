/* eslint-disable no-var */
/**
 * Ideally unit tests should be independent, but there are some cases where you
 * really want those tests to be executed one after the other Here is some code
 * that does exactly that - a wrapper on top of QUnit.
 *
 * Usage Instead of asyncTest, call queuedAsyncTest (same params) Instead of
 * module(), call queuedModule After a test is over and the next test has to
 * run, call nextTest()
 */
(function (window, console) {
    var testQueue = [], currentModule = null;

    // Filtering the tests based on the URLs
    var filteredTests = [];
    if (window.location) {
        var q = window.location.search.substring(1).split('&');
        for (var i = 0; i < q.length; i++) {
            var parts = q[i].split('=');
            switch (parts[0]) {
            case 'filter': {
                filteredTests.push(decodeURIComponent(parts[1]));
                break;
            }
            }
        }
    }

    QUnit.test('Setting up qunit', function (assert) {
        var done = assert.async(); // Needed by grunt-contrib-qunit
        assert.ok('Queued Unit setup complete');
        done();
    });

    /**
    * Use this method instead of QUnit.test. Once the test is finished, call
    * nextTest();
    */
    function queuedAsyncTest (name) {
        if (filteredTests.length === 0 || filteredTests.indexOf(currentModule + ': ' + name) !== -1) {
            testQueue.push({
                'name': name,
                'module': currentModule,
                'args': arguments
            });
        }
    }

    /**
    * Use this in place of module(blah)
    */
    function queuedModule (module) {
        currentModule = module;
    }

    /**
    * Once the current test is over, call nextTest() to start running the next
    * test
    */
    var testCount = 1;
    function nextTest () {
        if (testQueue.length <= 0) {
            if (console.groupEnd) console.groupEnd();
            console.log('All tests completed');
            return;
        }
        var current = testQueue.splice(0, 1)[0];
        if (console.groupEnd) console.groupEnd();
        if (console.groupCollapsed) console.groupCollapsed('=========', testCount++, current.module, ':', current.name, '============');
        else console.log('=========', testCount++, current.module, ':', current.name, '============');
        QUnit.module(current.module);

        // Expected asserts specified or not
        if (current.args.length === 2) {
            QUnit.test(current.name, current.args[1]);
        } else if (current.args.length === 3) {
            // QUnit.test(current.name, current.args[1], current.args[2]);
            throw new Error('Replace 2nd arg to QUnit.test with `assert.expect(2nd arg val)`; test name: ' + current.name);
        }
    }

    window.queuedAsyncTest = queuedAsyncTest;
    window.queuedModule = queuedModule;
    window.nextTest = nextTest;
}(window, console));

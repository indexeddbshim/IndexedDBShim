/**
 * Ideally unit tests should be independent, but there are some cases where you
 * really want those tests to be executed one after the other Here is some code
 * that does exactly that - a wrapper on top of QUnit.
 * 
 * Usage Instead of asyncTest, call queuedAsyncTest (same params) Instead of
 * module(), call queuedModule After a test is over and the next test has to
 * run, call nextTest()
 */
(function(window, console, undefined){
	var testQueue = [], currentModule = null;

	// Filtering the tests based on the URLs
	var q = window.location.search.substring(1).split("&");
	var filteredTests = [];
	for ( var i = 0; i < q.length; i++) {
		var parts = q[i].split("=");
		if (parts[0] === "filter") {
			filteredTests.push(unescape(parts[1]));
		}
	}

	asyncTest("Setting up qunit", function(){
		ok("Queued Unit setup complete");
	});

	/**
	* Use this method instead of asyncTest. Once the test is finished, call
	* nextTest();
	*/
	function queuedAsyncTest(name){
		if (filteredTests.length === 0 || filteredTests.indexOf(currentModule + ": " + name) !== -1) {
			testQueue.push({
				"name" : name,
				"module" : currentModule,
				"args" : arguments
			});
		}
	}

	/**
	* Use this in place of module(blah)
	*/
	function queuedModule(module){
		currentModule = module;
	}

	/**
	* Once the current test is over, call nextTest() to start running the next
	* test
	*/
	var timer = null;
	var testCount = 1;
	var initialized = false;
	function nextTest(){
		if (!initialized) {
			initialized = true;
			start();
		}
		window.clearTimeout(timer);
		if (testQueue.length <= 0) {
			console.groupEnd();
			console.log("All tests completed");
			return;
		}
		var current = testQueue.splice(0, 1)[0];
		console.groupEnd();
		console.groupCollapsed("=========", testCount++, current.module, ":", current.name, "============");
		module(current.module);
		// Expected asserts specified or not
		if (current.args.length === 2) {
			asyncTest(current.name, current.args[1]);
		} else if (current.args.length === 3) {
			asyncTest(current.name, current.args[1], current.args[2]);
		}
	}

	window.queuedAsyncTest = queuedAsyncTest;
	window.queuedModule = queuedModule;
	window.nextTest = nextTest;
}(window, console));

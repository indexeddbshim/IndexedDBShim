# Please send all pull requests to the __incoming-pr__ branch.

This repository uses [travis-ci](https://travis-ci.org/axemclion/indexeddbshim) for running the continuous integration (CI) tests. It uses [saucelabs](http://saucelabs.com) to run automated test cases on different browsers. The saucelabs server can be only accessed using a secure environment variable that is not accessible in pull requests.

The Pull-Request lifecycle
------------------------

Thank you for submitting a patch to this project, we really appretiate it. Here is a quick overview of the process used to ensure that pull requests do not break existing functionality. You just have to do Step 1, all others are done by travis. 

1. Send a pull request with your changes to `incoming-pr` branch
2. Travis runs only jslint on your pull request. 
	* If the pull request tests fail, please correct the lint errors
3. Once the pull request passes the lint test, you pull request is merged into `incoming-pr` branch.
4. Travis runs *ALL* tests on `incoming-pr` branch. Since `incoming-pr` has access to the secure environment variables, it runs the saucelabs tests also. 
	* If the saucelabs tests fail, `incoming-pr` is reverted to its original state.
	* Your changes are preserved in a separate branch. Please take a look at this branch and fix any failing tests
5. Once travis on the `incoming-pr` branch succeeds, your commits are automatically merged into `master`. 
'use strict';

module.exports = {
    reject: [
        // Until `mocha-multi-reporters` supports Mocha 12:
        //   https://github.com/stanleyhlng/mocha-multi-reporters/issues/111
        'mocha',

        // Issue with eslint-plugin-sonarjs
        'typescript'
    ]
};

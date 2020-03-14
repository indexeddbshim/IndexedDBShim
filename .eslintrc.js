'use strict';

module.exports = {
    extends: [
        'ash-nazg/sauron-node', 'plugin:qunit/recommended'
    ],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module'
    },
    plugins: ['qunit'],
    env: {
        browser: true
    },
    settings: {
        polyfills: [
            'Array.isArray',
            'ArrayBuffer',
            'console',
            'document.body',
            'document.head',
            'document.querySelector',
            'document.querySelectorAll',
            'Error',
            'IDBKeyRange',
            'JSON',
            'location.origin',
            'location.search',
            'Number.isInteger',
            'Number.isNaN',
            'Object.create',
            'Object.defineProperty',
            'Object.defineProperties',
            'Object.getOwnPropertyDescriptor',
            'Object.entries',
            'Object.keys',
            'Object.setPrototypeOf',
            'Object.values',
            'Promise',
            'Set',
            'String.fromCodePoint',
            'Symbol.hasInstance',
            'Symbol.iterator',
            'Symbol.toStringTag',
            'Uint8Array'
        ],
        jsdoc: {
            additionalTagNames: {
                // In case we need to extend
                customTags: []
            }
        }
    },
    overrides: [
        {
            files: 'src/node*',
            globals: {
                require: true
            },
            env: {
                browser: false,
                node: true
            }
        },
        {
            files: '*.html',
            rules: {
                'import/unambiguous': 0
            }
        },
        // Our Markdown rules (and used for JSDoc examples as well, by way of
        //   our use of `matchingFileName` in conjunction with
        //   `jsdoc/check-examples` within `ash-nazg`)
        {
            files: ['**/*.md'],
            rules: {
                'import/no-commonjs': 'off',
                'eol-last': ['off'],
                'no-console': ['off'],
                'no-undef': ['off'],
                'no-unused-vars': ['warn', {varsIgnorePattern: 'setGlobalVars'}],
                'padded-blocks': ['off'],
                'import/unambiguous': ['off'],
                'import/no-unresolved': ['off'],
                'node/no-missing-require': ['off'],
                'node/no-missing-import': ['off'],
                'node/no-unsupported-features/es-syntax': 'off'
            }
        },
        // Non-ESM Node files:
        {
            files: ['Gruntfile.js', '.eslintrc.js'],
            extends: ['plugin:node/recommended-script'],
            globals: {
                require: 'readonly',
                module: 'readonly',
                __dirname: 'readonly'
            },
            rules: {
                'import/no-commonjs': 0,
                strict: ['error', 'global']
            }
        },
        // @core-js-bundle can provide
        {
            files: ['src/**'],
            rules: {
                'node/no-unsupported-features/es-builtins': 'off',
                'node/no-unsupported-features/es-syntax': 'off'
            }
        },
        // May need to support a lower browser version for test/development files, but
        //   not a lower Node version
        {
            files: ['test-support/**', 'tests-mocha/**', 'tests-qunit/**'],
            extends: ['plugin:node/recommended-script'],
            globals: {
                require: 'readonly',
                exports: 'readonly',
                module: 'readonly',
                __dirname: 'readonly'
            },
            rules: {
                // See about reenabling
                'vars-on-top': 0,

                'import/no-commonjs': 0,
                strict: 0, // ['error', 'function'],
                // Add back since overridding
                'unicorn/no-process-exit': 'error',
                'no-process-exit': 0,
                // We want console in tests!
                'no-console': 'off',
                'object-shorthand': ['off'],
                'prefer-destructuring': ['off'],
                'require-unicode-regexp': ['off'],
                'node/no-unsupported-features/es-syntax': 'off',
                'node/no-unsupported-features/es-builtins': ['off'],
                'node/no-unsupported-features/node-builtins': ['off'],
                'unicorn/prefer-add-event-listener': ['off'],
                'unicorn/no-array-instanceof': ['off']
            }
        }
    ],
    rules: {
        indent: ['error', 4],
        'consistent-this': ['error', 'me'],
        // We use `instanceof` otherwise prohibited by `eslint-config-ash-nazg`,
        //  with `Symbol.hasInstance`
        'no-restricted-syntax': 0,

        // Disable until find time to address
        'default-case': 0,
        'max-len': 0,
        'no-console': 0,
        'no-shadow': 0,
        'no-sync': 0,
        'prefer-named-capture-group': 0,

        // These should definitely be enabled at some point
        'jsdoc/require-jsdoc': 0,
        'jsdoc/require-param-type': 0,
        'jsdoc/check-types': 0,

        'node/prefer-promises/fs': 0,
        'promise/prefer-await-to-callbacks': 0,
        'promise/prefer-await-to-then': 0,
        'unicorn/no-unsafe-regex': 0
    }
};

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
        // Our Markdown rules (and used for JSDoc examples as well, by way of
        //   our use of `matchingFileName` in conjunction with
        //   `jsdoc/check-examples` within `ash-nazg`)
        {
            files: ['**/*.md'],
            rules: {
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
            files: ['Gruntfile.js'],
            globals: {
                "require": "readonly",
                "module": "readonly",
                __dirname: "readonly"
            },
            rules: {
                'strict': ['off']
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
            // We want console in tests!
            globals: {
                "require": "readonly",
                "exports": "readonly",
                "module": "readonly",
                __dirname: "readonly"
            },
            rules: {
                'strict': 'off',
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
        // This should definitely be enabled at some point
        'jsdoc/require-jsdoc': 0,
        indent: ['error', 4],

        'consistent-this': ['error', 'me'],

        // Disable until find time to address
        'default-case': 0,
        'func-name-matching': 0,
        'import/extensions': 0,
        'node/file-extension-in-import': 0,
        'import/no-commonjs': 0,
        'import/no-mutable-exports': 0,
        'import/unambiguous': 0,
        'max-len': 0,
        'multiline-ternary': 0,
        'no-console': 0,
        'no-multi-spaces': 0,
        'no-shadow': 0,
        'no-sync': 0,
        'prefer-rest-params': 0,
        'require-jsdoc': 0,
        'valid-jsdoc': 0,
        'vars-on-top': 0,
        'jsdoc/require-param': 0,
        'jsdoc/require-param-type': 0,
        'jsdoc/check-types': 0,
        'jsdoc/check-param-names': 0,
        'promise/prefer-await-to-callbacks': 0,
        'promise/prefer-await-to-then': 0,
        'node/prefer-promises/fs': 0,
        'unicorn/no-fn-reference-in-iterator': 0,
        'unicorn/no-unsafe-regex': 0,
        'no-restricted-syntax': 0,
        'prefer-named-capture-group': 0,
    }
};

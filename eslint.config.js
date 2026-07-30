import ashNazg from 'eslint-config-ash-nazg';
import globals from 'globals';

const rules = {
    '@stylistic/indent': ['error', 4, {SwitchCase: 0}],
    '@stylistic/dot-location': ['error', 'property'],
    'consistent-this': ['error', 'me'],
    // We use `instanceof` otherwise prohibited by `eslint-config-ash-nazg`,
    //  with `Symbol.hasInstance`
    'no-restricted-syntax': 0,

    // Disable until find time to address
    'jsdoc/reject-any-type': 0,
    'jsdoc/reject-function-type': 0,

    '@stylistic/max-len': 0,
    '@stylistic/brace-style': 0,
    'unicorn/prefer-global-this': 0,
    'unicorn/prefer-top-level-await': 0,
    'no-console': 0,
    'no-shadow': 0,
    'prefer-named-capture-group': 0,

    'n/prefer-promises/fs': 0,
    'promise/prefer-await-to-callbacks': 0,
    'promise/prefer-await-to-then': 0,
    'unicorn/no-this-assignment': 0,
    'unicorn/prefer-spread': 0,

    // Mocha uses this.timeout(), and we have some pseudo-classes for API reasons
    'unicorn/no-this-outside-of-class': 'off',

    // While useful, we want to follow the order of the spec for readability
    'unicorn/no-declarations-before-early-exit': 'off',
    'unicorn/prefer-simple-condition-first': 'off',

    // If not counted by the testing suite, then flags what is expected
    'sonarjs/no-trivial-assertions': 'off',

    'jsdoc/require-throws': 'error',
    'jsdoc/require-returns': ['error', {
        forceRequireReturn: true,
        forceReturnsWithAsync: true
    }],

    'jsdoc/require-jsdoc': ['warn', {
        contexts: [
            'Program > VariableDeclaration > ' +
            'Program > VariableDeclaration > ' +
            'VariableDeclarator > ArrowFunctionExpression',
            'VariableDeclarator > FunctionExpression',
            'ExportNamedDeclaration > VariableDeclaration > ' +
            'VariableDeclarator > ArrowFunctionExpression',
            'ExportNamedDeclaration > VariableDeclaration > ' +
            'VariableDeclarator > FunctionExpression',
            'ExportDefaultDeclaration > ArrowFunctionExpression',
            'ExportDefaultDeclaration > FunctionExpression',

            'Program > ExpressionStatement > ' +
            'AssignmentExpression > FunctionExpression',

            'ClassDeclaration',
            'ClassExpression',
            'FunctionDeclaration', // Default is true
            'MethodDefinition'
        ]
    }]
};

export default [
    {
        ignores: [
            'dist',
            'src/unicode-regex.js',
            'examples',
            'ignore',
            'coverage',
            '.nyc_output',
            'tests-polyfill',
            'web-platform-tests',
            'test-support/**/*.js',
            '!test-support/webworker/*.js',
            '!test-support/*.js',
            'test-support/latest-erring-bundled.js'
        ]
    },
    ...ashNazg(['sauron']),
    {
        settings: {
            polyfills: [
                'Promise',
                'Uint8Array'
            ]
        }
    },
    ...ashNazg(['sauron', 'node']).map((cfg) => {
        return {
            files: ['src/node*'],
            ...cfg
        };
    }),
    // Our Markdown rules (and used for JSDoc examples as well, by way of
    //   our use of `matchingFileName` in conjunction with
    //   `jsdoc/check-examples` within `ash-nazg`)
    {
        files: ['**/*.md/*.js'],
        rules: {
            'unicorn/prefer-global-this': 'off', // Older browsers
            'import-x/no-commonjs': 'off',
            'eol-last': 'off',
            'no-console': 'off',
            'no-undef': 'off',
            'no-unused-vars': ['warn', {varsIgnorePattern: 'setGlobalVars'}],
            'padded-blocks': 'off',
            'unicorn/no-global-object-property-assignment': 'off',
            'import-x/unambiguous': 'off',
            'import-x/no-unresolved': 'off',
            'n/no-missing-require': 'off',
            'n/no-missing-import': 'off',
            'n/no-unsupported-features/es-syntax': 'off'
        }
    },
    // We should do polyglot (default) but do `browser` to catch escompat issues,
    //  but this also adds more globals
    ...ashNazg(['sauron', 'browser']).map((cfg) => {
        return {
            files: [
                'src/*.js'
            ],
            ...cfg
        };
    }),
    // May need to support a lower browser version for test/development files, but
    //   not a lower Node version
    ...ashNazg(['sauron', 'node']).map((cfg) => {
        return {
            files: ['test-support/**', 'tests-mocha/**'],
            ...cfg
        };
    }),
    {
        files: ['test-support/**', 'tests-mocha/**'],
        languageOptions: {
            globals: {
                window: 'readonly',
                location: 'readonly',
                document: 'readonly',
                indexedDB: 'readonly',
                IDBFactory: 'readonly',
                IDBDatabase: 'readonly',
                IDBObjectStore: 'readonly',
                IDBIndex: 'readonly',
                IDBTransaction: 'readonly',
                IDBCursor: 'readonly',
                IDBKeyRange: 'readonly',
                IDBRequest: 'readonly',
                IDBOpenDBRequest: 'readonly',
                IDBVersionChangeEvent: 'readonly',
                ...globals.mocha,
                chai: 'readonly',
                expect: 'readonly',
                sinon: 'readonly',
                // Our environment
                shimIndexedDB: 'readonly',
                util: 'readonly',
                env: 'readonly',
                testHelper: 'readonly',
                testData: 'readonly'
            }
        },
        settings: {
            polyfills: [
                'ErrorEvent',
                'navigator'
            ]
        },
        rules: {
            // See about reenabling
            'sonarjs/no-parameter-reassignment': 0,

            // Should be applied in ash-nazg
            'no-unused-expressions': 0,

            'no-process-exit': 0,
            // We want console in tests!
            'no-console': 'off',
            'import-x/unambiguous': 'off',
            'n/no-unsupported-features/node-builtins': 'off',
            'unicorn/prefer-add-event-listener': 'off',

            'unicorn/no-global-object-property-assignment': 'off',
            ...rules
        }
    },
    // Disable import-x rules for files with top-level await due to ESM/CommonJS compatibility
    {
        files: [
            'eslint.config.js',
            'test-support/node-buildjs.js',
            'tests-mocha/test-node.js',
            'tests-polyfill/fakeIndexedDB/test-node.js',
            'tests-polyfill/indexedDBmock/test-node.js',
            'tests-polyfill/w3c/test-node.js'
        ],
        rules: {
            'import-x/namespace': 0,
            'import-x/no-deprecated': 0,
            'import-x/default': 0,
            'import-x/named': 0,
            'import-x/no-named-as-default': 0,
            'import-x/no-named-as-default-member': 0
        }
    },
    {
        rules
    }
];

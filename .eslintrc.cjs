'use strict';

const rules = {
    '@stylistic/indent': ['error', 4, {SwitchCase: 0}],
    '@stylistic/dot-location': ['error', 'property'],
    'consistent-this': ['error', 'me'],
    // We use `instanceof` otherwise prohibited by `eslint-config-ash-nazg`,
    //  with `Symbol.hasInstance`
    'no-restricted-syntax': 0,

    // Disable until find time to address
    '@stylistic/max-len': 0,
    '@stylistic/brace-style': 0,
    'unicorn/prefer-top-level-await': 0,
    'default-case': 0,
    'no-console': 0,
    'no-shadow': 0,
    'no-sync': 0,
    'prefer-named-capture-group': 0,
    'eslint-comments/require-description': 0,

    'n/prefer-promises/fs': 0,
    'promise/prefer-await-to-callbacks': 0,
    'promise/prefer-await-to-then': 0,
    'unicorn/no-unsafe-regex': 0,
    'unicorn/no-this-assignment': 0,
    'unicorn/prefer-spread': 0,

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

module.exports = {
    extends: [
        'ash-nazg/sauron-node-overrides'
    ],
    parserOptions: {
        ecmaVersion: 2022
    },
    env: {
        browser: true
    },
    settings: {
        polyfills: [
            'Array.filter',
            'Array.isArray',
            'Array.every',
            'Array.forEach',
            'Array.includes',
            'Array.map',
            'Array.reduce',
            'ArrayBuffer',
            'console',
            'document.body',
            'document.head',
            'document.querySelector',
            'document.querySelectorAll',
            'Error',
            'IDBKeyRange',
            'indexedDB',
            'JSON',
            'location.origin',
            'location.search',
            'Number.isFinite',
            'Number.isInteger',
            'Number.isNaN',
            'Number.parseFloat',
            'Number.parseInt',
            'Object.create',
            'Object.defineProperty',
            'Object.defineProperties',
            'Object.getOwnPropertyDescriptor',
            'Object.entries',
            'Object.hasOwn',
            'Object.keys',
            'Object.setPrototypeOf',
            'Object.values',
            'Promise',
            'Set',
            'String.fromCodePoint',
            'String.padStart',
            'String.repeat',
            'Symbol.hasInstance',
            'Symbol.iterator',
            'Symbol.toStringTag',
            'Uint8Array'
        ],
        jsdoc: {
            mode: 'typescript',
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
            files: ['**/*.md/*.js'],
            rules: {
                'import/no-commonjs': 'off',
                'eol-last': ['off'],
                'no-console': ['off'],
                'no-undef': ['off'],
                'no-unused-vars': ['warn', {varsIgnorePattern: 'setGlobalVars'}],
                'padded-blocks': ['off'],
                'import/unambiguous': ['off'],
                'import/no-unresolved': ['off'],
                'n/no-missing-require': ['off'],
                'n/no-missing-import': ['off'],
                'n/no-unsupported-features/es-syntax': 'off'
            }
        },
        // @core-js-bundle can provide
        {
            files: ['src/**'],
            rules: {
                'n/no-unsupported-features/es-builtins': 'off',
                'n/no-unsupported-features/es-syntax': 'off'
            }
        },
        // May need to support a lower browser version for test/development files, but
        //   not a lower Node version
        {
            files: ['test-support/**', 'tests-mocha/**'],
            extends: ['ash-nazg/sauron-node'],
            parserOptions: {
                ecmaVersion: 2022
            },
            settings: {
                polyfills: [
                    'ErrorEvent',
                    'navigator'
                ]
            },
            rules: {
                // See about reenabling
                'vars-on-top': 0,

                strict: 0, // ['error', 'function'],
                'no-process-exit': 0,
                // We want console in tests!
                'no-console': 'off',
                'import/unambiguous': 'off',
                'object-shorthand': ['off'],
                'prefer-destructuring': ['off'],
                'require-unicode-regexp': ['off'],
                'n/no-unsupported-features/es-syntax': 'off',
                'n/no-unsupported-features/es-builtins': ['off'],
                'n/no-unsupported-features/node-builtins': ['off'],
                'unicorn/prefer-add-event-listener': ['off'],
                'unicorn/no-instanceof-array': ['off'],

                ...rules
            }
        }
    ],
    rules
};

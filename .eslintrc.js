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
    polyfills: ["promises"],
    jsdoc: {
      additionalTagNames: {
        // In case we need to extend
        customTags: []
      },
      tagNamePreference: {
        arg: 'param',
        return: 'returns'
      },
      allowOverrideWithoutParam: true,
      allowImplementsWithoutParam: true,
      allowAugmentsExtendsWithoutParam: true,
      // For `jsdoc/check-examples` in `ash-nazg`
      matchingFileName: 'dummy.md',
      rejectExampleCodeRegex: '^`',
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
          'no-unused-vars': ['warn'],
          'padded-blocks': ['off'],
          'import/unambiguous': ['off'],
          'import/no-unresolved': ['off'],
          'node/no-missing-require': ['off'],
          'node/no-missing-import': ['off']
        }
      },
      // We want console in tests!
      {
        files: ['test-support/**', 'tests-mocha/**', 'tests-qunit/**'],
        rules: {
          'strict': ['off'],
          'no-console': ['off']
        }
      },
      // Non-ESM Node files:
      {
        files: ['Gruntfile.js'],
        rules: {
          'strict': ['off']
        }
      },
      // @babel/polyfill can provide
      {
        files: ['src/**'],
        rules: {
          'node/no-unsupported-features/es-builtins': ['off']
        }
      },
      // May need to support a lower browser version for test/development files, but
      //   not a lower Node version
      {
        files: ['test-support/**', 'tests-mocha/**', 'tests-qunit/**', 'test-support/**'],
        rules: {
          'object-shorthand': ['off'],
          'prefer-destructuring': ['off'],
          'require-unicode-regexp': ['off'],
          'node/no-unsupported-features/es-builtins': ['off'],
          'node/no-unsupported-features/node-builtins': ['off'],
          'unicorn/prefer-add-event-listener': ['off'],
          'unicorn/no-array-instanceof': ['off']
        }
      }
  ],
  rules: {
      'consistent-this': ['error', 'me'],
      'default-case': 0,
      'func-name-matching': 0,
      indent: ['error', 4],
      'import/extensions': 0,
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
      'unicorn/no-fn-reference-in-iterator': 0,
      'no-restricted-syntax': 0
  }
}

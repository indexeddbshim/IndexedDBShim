// /* eslint-disable import/no-deprecated, import/namespace,
//     import/default, import/no-named-as-default,
//     import/no-named-as-default-member -- Problems with JSON import */
import {readFile} from 'node:fs/promises';

import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

import {babel} from '@rollup/plugin-babel';
import globals from 'rollup-plugin-node-globals';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import filesize from 'rollup-plugin-filesize';
import terser from '@rollup/plugin-terser';

import builtins from 'builtin-modules';

const pkg = JSON.parse(await readFile(
    new URL('package.json', import.meta.url)
));

const {name: pkgName} = pkg;

const babelBrowserOptions = {
    // sourceMapsAbsolute: true,
    babelHelpers: 'bundled',
    plugins: ['add-module-exports'],
    presets: [
        ['@babel/env', {
            targets: pkg.browserslist[0] // cover 100%
        }]
    ]
};

const babelNodeOptions = {...babelBrowserOptions,
    babelHelpers: 'bundled',
    presets: [
        ['@babel/env', {
            targets: {
                node: '16'
            }
        }]
    ]
};

const getRollupPlugins = (babelOptions, {addBuiltins, mainFields, min} = {}) => {
    const ret = [
        nodeResolve({
            mainFields,
            preferBuiltins: !addBuiltins
        }),
        commonJS({
            // Gets issue with dynamic requires and we aren't
            //  "importing" anyways
            ignore: ['sqlite3']
        }),
        babel(babelOptions),
        filesize({
            showBeforeSizes: 'build'
        })
    ];
    if (addBuiltins) {
        ret.unshift(globals(), nodePolyfills());
    } else {
        ret.unshift(json());
    }
    if (min) {
        ret.push(terser({
            // // Not apparently working per https://github.com/TrySound/rollup-plugin-terser/issues/68
            // comments (node, comment) {
            //     return (/\/\*!/u).test(comment.value);
            // }
        }));
    }
    return ret;
};

const browserEnvironment = ({input, name, output: file}) => {
    const banner = `/*! ${pkg.name} - v${pkg.version} - ` +
        `${new Intl.DateTimeFormat('en-US').format(new Date())} */\n`;
    return [true, false].map((min) => {
        return {
            input,
            output: {
                name,
                banner,
                file: min ? file.replace(/\.js$/u, '.min.js') : file,
                format: 'umd',
                sourcemap: true
            },
            plugins: getRollupPlugins(
                babelBrowserOptions,
                {min, addBuiltins: true, mainFields: ['browser', 'module', 'main']} // Don't need 'jsnext'?
            )
        };
    });
};

const nodeEnvironment = ({input, name, output: file}) => {
    const banner = `/*! ${pkg.name} - v${pkg.version} - ` +
        `${new Intl.DateTimeFormat('en-US').format(new Date())} */\n`;
    return [false].map((min) => {
        return {
            input,
            external: [
                ...builtins,
                'websql/custom/index.js', 'websql/lib/sqlite/SQLiteDatabase',
                // Fix from https://github.com/rollup/rollup/issues/1507#issuecomment-340550539
                'readable-stream', 'readable-stream/transform'
            ],
            output: {
                file: min ? file.replace(/\.js$/u, '.min.js') : file,
                name,
                banner,
                exports: 'default',
                // Avoid using `browser` entry in package.json
                format: 'cjs',
                // Avoid `window` checking (link now broken)
                // https://github.com/substack/node-rollup/issues/1277#issuecomment-115198436
                sourcemap: true
                // Notes when using browserify:
                // Could try for consistency with any relative paths if still
                //  seeing https://github.com/axemclion/IndexedDBShim/issues/291 ;
                //  see also http://stackoverflow.com/a/33124979/271577
                // basedir: __dirname,
            },
            plugins: getRollupPlugins(
                babelNodeOptions,
                {
                    min,
                    addBuiltins: false
                    // mainFields: ['module', 'main'] // Default
                }
            )
        };
    });
};

/**
 * @returns {Rollup[]}
 */
export default function rollupConfig () {
    // if (commandLineArgs.configBrowserOnly) {

    return [
        {
            input: 'node_modules/@unicode/unicode-17.0.0/Binary_Property/Expands_On_NFD/regex.js',
            output: {
                banner: '// @ts-nocheck\n',
                file: 'src/unicode-regex.js',
                format: 'esm'
            },
            plugins: [
                commonJS({
                    include: ['node_modules/**']
                })
            ]
        },
        ...browserEnvironment({
            name: 'IDBKeyUtils',
            input: 'src/Key.js',
            output: `dist/${pkgName}-Key.js`
        }),
        ...browserEnvironment({
            input: 'src/browser-UnicodeIdentifiers.js',
            output: `dist/${pkgName}-UnicodeIdentifiers.js`
        }),
        ...nodeEnvironment({
            input: 'src/node-UnicodeIdentifiers.js',
            output: `dist/${pkgName}-UnicodeIdentifiers-node.cjs`
        }),
        ...browserEnvironment({
            input: 'src/browser.js',
            output: `dist/${pkgName}.js`
        }),
        ...browserEnvironment({
            name: 'setGlobalVars',
            input: 'src/browser-noninvasive.js',
            output: `dist/${pkgName}-noninvasive.js`
        }),
        ...nodeEnvironment({
            input: 'src/node.js',
            output: `dist/${pkgName}-node.cjs`
        })
    ];
}

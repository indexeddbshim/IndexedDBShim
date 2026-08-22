// To renable, need to package this as a separate repo:
// `sourcemap-transformer` (which used to rewrite stack traces from the
//   bundled/transpiled file back to their original source positions) isn't
//   currently packaged as an installable dependency:
//     "sourcemap-transformer": "git+https://github.com/brettz9/sourcemap-transformer.git",

// import sourcemapTransformer from 'sourcemap-transformer';

// const {transformSourceMapString} = sourcemapTransformer;
// Until it's restored, stack traces are passed through untransformed.

/**
 * @param {string} stack
 * @returns {string}
 */
function transformW3CStack (stack) {
    // return transformSourceMapString(stack, {
    //     // at /Users/brett/IndexedDBShim/dist/indexeddbshim-UnicodeIdentifiers-node.js:6626:32
    //     // at IDBOpenDBRequest.tryCatch (/Users/brett/IndexedDBShim/dist/indexeddbshim-UnicodeIdentifiers-node.js:6641:9)
    //     newFileRegex: /(\s*)at (\S+ \()?([^e][^\(]*?):(\d+):(\d+)(\))?/v,
    //     newFilePath (match) {
    //         return match[3];
    //     },
    //     newFileLineNumber (match) {
    //         return Math.trunc(Number(match[4]));
    //     },
    //     newFileColumnNumber (match) {
    //         return match[5] || '';
    //     },
    //     originalPositionString (formattingSpaces, originalPosition, untransformedOutput, match /* , prev=false */) {
    //         const erringFunc = match[2] || '';
    //         const endingParenth = match[6] || '';
    //         if (originalPosition.source) {
    //             return formattingSpaces + 'at ' + erringFunc + originalPosition.source + ':' + originalPosition.line + ':' + originalPosition.column + endingParenth;
    //         }
    //         return untransformedOutput;
    //     }
    // });
    return stack;
}

export default transformW3CStack;

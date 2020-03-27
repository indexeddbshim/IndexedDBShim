const {transformSourceMapString} = require('sourcemap-transformer');

function transformW3CStack (stack) {
    return transformSourceMapString(stack, {
        // at /Users/brett/IndexedDBShim/dist/indexeddbshim-UnicodeIdentifiers-node.js:6626:32
        // at IDBOpenDBRequest.tryCatch (/Users/brett/IndexedDBShim/dist/indexeddbshim-UnicodeIdentifiers-node.js:6641:9)
        newFileRegex: /(\s*)at (\S+ \()?([^e][^(]*?):(\d+):(\d+)(\))?/u,
        newFilePath (match) {
            return match[3];
        },
        newFileLineNumber (match) {
            return Number.parseInt(match[4]);
        },
        newFileColumnNumber (match) {
            return match[5] || '';
        },
        originalPositionString (formattingSpaces, originalPosition, untransformedOutput, match /*, prev=false */) {
            const erringFunc = match[2] || '';
            const endingParenth = match[6] || '';
            if (originalPosition.source) {
                return formattingSpaces + 'at ' + erringFunc + originalPosition.source + ':' + originalPosition.line + ':' + originalPosition.column + endingParenth;
            }
            return untransformedOutput;
        }
    });
}
if (typeof module !== 'undefined') {
    module.exports = transformW3CStack;
}

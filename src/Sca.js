/*eslint-disable no-eval*/
import atob from 'atob';

/**
 * Implementation of the Structured Cloning Algorithm.  Supports the
 * following object types:
 * - Blob
 * - Boolean
 * - Date object
 * - File object (deserialized as Blob object).
 * - Number object
 * - RegExp object
 * - String object
 * This is accomplished by doing the following:
 * 1) Using the cycle/decycle functions from:
 *    https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
 * 2) Serializing/deserializing objects to/from string that don't work with
 *    JSON.stringify and JSON.parse by using object specific logic (eg use
 *    the FileReader API to convert a Blob or File object to a data URL.
 * 3) JSON.stringify and JSON.parse do the final conversion to/from string.
 */
function decycle (object, callback) {
    // From: https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
    // Contains additional logic to convert the following object types to string
    // so that they can properly be encoded using JSON.stringify:
    //  *Boolean
    //  *Date
    //  *File
    //  *Blob
    //  *Number
    //  *Regex
    // Make a deep copy of an object or array, assuring that there is at most
    // one instance of each object or array in the resulting structure. The
    // duplicate references (which might be forming cycles) are replaced with
    // an object of the form
    //      {$ref: PATH}
    // where the PATH is a JSONPath string that locates the first occurance.
    // So,
    //      var a = [];
    //      a[0] = a;
    //      return JSON.stringify(JSON.decycle(a));
    // produces the string '[{"$ref":"$"}]'.

    // JSONPath is used to locate the unique object. $ indicates the top level of
    // the object or array. [NUMBER] or [STRING] indicates a child member or
    // property.

    const objects = [];   // Keep a reference to each unique object or array
    const paths = [];     // Keep the path to each unique object or array
    const queuedObjects = [];
    const returnCallback = callback;
    let derezObj; // eslint-disable-line prefer-const

    /**
     * Check the queue to see if all objects have been processed.
     * if they have, call the callback with the converted object.
     */
    function checkForCompletion () {
        if (queuedObjects.length === 0) {
            returnCallback(derezObj);
        }
    }

    /**
     * Convert a blob to a data URL.
     * @param {Blob} blob to convert.
     * @param {String} path of blob in object being encoded.
     */
    function readBlobAsDataURL (blob, path) {
        const reader = new FileReader();
        reader.onloadend = function (loadedEvent) {
            const dataURL = loadedEvent.target.result;
            const blobtype = 'Blob';
            if (blob instanceof File) {
                // blobtype = 'File';
            }
            updateEncodedBlob(dataURL, path, blobtype);
        };
        reader.readAsDataURL(blob);
    }

    /**
     * Async handler to update a blob object to a data URL for encoding.
     * @param {String} dataURL
     * @param {String} path
     * @param {String} blobtype - file if the blob is a file; blob otherwise
     */
    function updateEncodedBlob (dataURL, path, blobtype) {
        const encoded = queuedObjects.indexOf(path);
        path = path.replace('$', 'derezObj');
        eval(path + '.$enc="' + dataURL + '"');
        eval(path + '.$type="' + blobtype + '"');
        queuedObjects.splice(encoded, 1);
        checkForCompletion();
    }

    function derez (value, path) {
        // The derez recurses through the object, producing the deep copy.

        let i,          // The loop counter
            name,       // Property name
            nu;         // The new object or array

        // typeof null === 'object', so go on if this value is really an object but not
        // one of the weird builtin objects.

        if (typeof value === 'object' && value !== null &&
            !(value instanceof Boolean) &&
            !(value instanceof Date) &&
            !(value instanceof Number) &&
            !(value instanceof RegExp) &&
            !(value instanceof Blob) &&
            !(value instanceof String)) {
            // If the value is an object or array, look to see if we have already
            // encountered it. If so, return a $ref/path object. This is a hard way,
            // linear search that will get slower as the number of unique objects grows.

            for (i = 0; i < objects.length; i += 1) {
                if (objects[i] === value) {
                    return {$ref: paths[i]};
                }
            }

            // Otherwise, accumulate the unique value and its path.

            objects.push(value);
            paths.push(path);

            // If it is an array, replicate the array.

            if (Object.prototype.toString.apply(value) === '[object Array]') {
                nu = [];
                for (i = 0; i < value.length; i += 1) {
                    nu[i] = derez(value[i], path + '[' + i + ']');
                }
            } else {
                // If it is an object, replicate the object.
                nu = {};
                for (name in value) {
                    if (Object.prototype.hasOwnProperty.call(value, name)) {
                        nu[name] = derez(value[name],
                         path + '[' + JSON.stringify(name) + ']');
                    }
                }
            }

            return nu;
        } else if (value instanceof Blob) {
            // Queue blob for conversion
            queuedObjects.push(path);
            readBlobAsDataURL(value, path);
        } else if (value instanceof Boolean) {
            value = {
                '$type': 'Boolean',
                '$enc': value.toString()
            };
        } else if (value instanceof Date) {
            value = {
                '$type': 'Date',
                '$enc': value.getTime()
            };
        } else if (value instanceof Number) {
            value = {
                '$type': 'Number',
                '$enc': value.toString()
            };
        } else if (value instanceof RegExp) {
            value = {
                '$type': 'RegExp',
                '$enc': value.toString()
            };
        } else if (typeof value === 'number') {
            value = {
                '$type': 'number',
                '$enc': value + ''  // handles NaN, Infinity, Negative Infinity
            };
        } else if (value === undefined) {
            value = {
                '$type': 'undefined'
            };
        }
        return value;
    }
    derezObj = derez(object, '$');
    checkForCompletion();
}

function retrocycle ($) {
    // From: https://github.com/douglascrockford/JSON-js/blob/master/cycle.js
    // Contains additional logic to convert strings to the following object types
    // so that they can properly be decoded:
    //  *Boolean
    //  *Date
    //  *File
    //  *Blob
    //  *Number
    //  *Regex
    // Restore an object that was reduced by decycle. Members whose values are
    // objects of the form
    //      {$ref: PATH}
    // are replaced with references to the value found by the PATH. This will
    // restore cycles. The object will be mutated.

    // The eval function is used to locate the values described by a PATH. The
    // root object is kept in a $ variable. A regular expression is used to
    // assure that the PATH is extremely well formed. The regexp contains nested
    // * quantifiers. That has been known to have extremely bad performance
    // problems on some browsers for very long strings. A PATH is expected to be
    // reasonably short. A PATH is allowed to belong to a very restricted subset of
    // Goessner's JSONPath.

    // So,
    //      var s = '[{"$ref":"$"}]';
    //      return JSON.retrocycle(JSON.parse(s));
    // produces an array containing a single element which is the array itself.

    const px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\([\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;

    /**
     * Converts the specified data URL to a Blob object
     * @param {String} dataURL to convert to a Blob
     * @returns {Blob} the converted Blob object
     */
    function dataURLToBlob (dataURL) {
        const BASE64_MARKER = ';base64,';
        let contentType,
            parts,
            raw;
        if (dataURL.indexOf(BASE64_MARKER) === -1) {
            parts = dataURL.split(',');
            contentType = parts[0].split(':')[1];
            raw = parts[1];

            return new Blob([raw], {type: contentType});
        }

        parts = dataURL.split(BASE64_MARKER);
        contentType = parts[0].split(':')[1];
        raw = atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);

        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array.buffer], {type: contentType});
    }

    function rez (value) {
        // The rez function walks recursively through the object looking for $ref
        // properties. When it finds one that has a value that is a path, then it
        // replaces the $ref object with a reference to the value that is found by
        // the path.

        let i, item, name, path;

        if (value && typeof value === 'object') {
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                for (i = 0; i < value.length; i += 1) {
                    item = value[i];
                    if (item && typeof item === 'object') {
                        path = item.$ref;
                        if (typeof path === 'string' && px.test(path)) {
                            value[i] = eval(path);
                        } else {
                            value[i] = rez(item);
                        }
                    }
                }
            } else {
                if (value.$type !== undefined) {
                    switch (value.$type) {
                    case 'Blob':
                    case 'File':
                        value = dataURLToBlob(value.$enc);
                        break;
                    case 'Boolean':
                        value = Boolean(value.$enc === 'true');
                        break;
                    case 'Date':
                        value = new Date(value.$enc);
                        break;
                    case 'Number':
                        value = Number(value.$enc);
                        break;
                    case 'RegExp':
                        value = eval(value.$enc);
                        break;
                    case 'number':
                        value = parseFloat(value.$enc);
                        break;
                    case 'undefined':
                        value = undefined;
                        break;
                    }
                } else {
                    for (name in value) {
                        if (typeof value[name] === 'object') {
                            item = value[name];
                            if (item) {
                                path = item.$ref;
                                if (typeof path === 'string' && px.test(path)) {
                                    value[name] = eval(path);
                                } else {
                                    value[name] = rez(item);
                                }
                            }
                        }
                    }
                }
            }
        }
        return value;
    }
    return rez($);
}

/**
 * Encode the specified object as a string.  Because of the asynchronus
 * conversion of Blob/File to string, the encode function requires
 * a callback
 * @param {Object} val the value to convert.
 * @param {function} callback the function to call once conversion is
 * complete.  The callback gets called with the converted value.
 */
function encode (val, callback) {
    function finishEncode (val) {
        callback(JSON.stringify(val));
    }
    decycle(val, finishEncode);
}

/**
 * Deserialize the specified string to an object
 * @param {String} val the serialized string
 * @returns {Object} the deserialized object
 */
function decode (val) {
    return retrocycle(JSON.parse(val));
}

const Sca = {decycle, retrocycle, encode, decode};
export {decycle, retrocycle, encode, decode, Sca as default};

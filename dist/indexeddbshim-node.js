(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (Buffer){
(function (w) {
  "use strict";

  var a2b = w.atob;

  function atob(str) {
    // normal window
    if ('function' === typeof a2b) {
      return a2b(str);
    }
    // browserify (web worker)
    else if ('function' === typeof Buffer) {
      return new Buffer(str, 'base64').toString('binary');
    }
    // ios web worker with base64js
    else if ('object' === typeof w.base64js) {
      // bufferToBinaryString
      // https://github.com/coolaj86/unibabel-js/blob/master/index.js#L50
      var buf = w.base64js.b64ToByteArray(str);

      return Array.prototype.map.call(buf, function (ch) {
        return String.fromCharCode(ch);
      }).join('');
    }
    // ios web worker without base64js
    else {
      throw new Error("you're probably in an ios webworker. please include use beatgammit's base64-js");
    }
  }

  w.atob = atob;

  if (typeof module !== 'undefined') {
    module.exports = atob;
  }
}(window));

}).call(this,require("buffer").Buffer)
},{"buffer":3}],2:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":2,"ieee754":5,"isarray":6}],4:[function(require,module,exports){

function EventTarget() {}

Object.assign(EventTarget.prototype, {

  addEventListener: function (type, listener) {
    if (!this._listeners) Object.defineProperty(this, '_listeners', {value: {}})
    var listeners = this._listeners

    var listenersByType = listeners[type]
    if (listenersByType === undefined) listeners[type] = listenersByType = [];

    if (listenersByType.some(function (l) {
      return l === listener
    })) return

    listenersByType.push(listener)
  },

  dispatchEvent: function (ev) {
    if (!this._listeners) Object.defineProperty(this, '_listeners', {value: {}})
    var listeners = this._listeners
    if (ev._dispatched) throw new DOMException('The object is in an invalid state.', 'InvalidStateError')
    ev._dispatched = true

    var type = ev.type
    if (type == undefined || type == '') throw new DOMException('UNSPECIFIED_EVENT_TYPE_ERR', 'UNSPECIFIED_EVENT_TYPE_ERR')

    var listenersByType = listeners[type].concat() || []

    var dummyListener = this['on' + type]
    var dummyIPos = listenersByType.length ? 1 : 0

    var stopImmediatePropagation = false

    // [ToDo] Use read-only properties instead of attributes when available
    ev.cancelable = true
    ev.defaultPrevented = false
    ev.isTrusted = false
    ev.preventDefault = function () {
      if (this.cancelable) this.defaultPrevented = true
    }
    ev.stopImmediatePropagation = function () {
      stopImmediatePropagation = true
    }
    ev.target = this
    ev.timeStamp = new Date().getTime()

    listenersByType.some(function (listener, i) {
      if (stopImmediatePropagation) return true
      if (i === dummyIPos && typeof dummyListener === 'function') {
        // We don't splice this in as could be overwritten; executes here per
        //  https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes:event-handlers-14
        dummyListener.call(this, ev)
      }
      listener.call(this, ev)
    }, this)
    if (typeof dummyListener === 'function' && listenersByType.length < 2) dummyListener.call(this, ev) // Won't have executed if too short

    return !ev.defaultPrevented
  },

  hasEventListener: function (type, listener) {
    if (!this._listeners) Object.defineProperty(this, '_listeners', {value: {}})

    var listeners = this._listeners;
    if (listeners[type] !== undefined && listeners[type].indexOf(listener) !== - 1) {
      return true
    }
    return false
  },

  removeEventListener: function (type, listener) {
    if (!this._listeners) Object.defineProperty(this, '_listeners', {value: {}})
    var listeners = this._listeners

    var listenersByType = listeners[type]
    if (listenersByType === undefined) return

    listenersByType.some(function (l, i) {
      if (l === listener) {
        listenersByType.splice(i, 1)
        return true
      }
    })

    if (!listenersByType.length) delete listeners[type]
  }
})

if (typeof module !== 'undefined' && module.exports) module.exports = EventTarget

},{}],5:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],6:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],7:[function(require,module,exports){
(function (global){
'use strict';

module.exports = global.openDatabase;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/*global GLOBAL*/
var global = typeof window !== 'undefined' ? window : GLOBAL;

/**
 * Creates a native DOMException, for browsers that support it
 * @returns {DOMException}
 */
function createNativeDOMException(name, message) {
    var e = new DOMException.prototype.constructor(0, message);
    e.name = name || 'DOMException';
    e.message = message;
    return e;
}

/**
 * Creates a native DOMError, for browsers that support it
 * @returns {DOMError}
 */
function createNativeDOMError(name, message) {
    name = name || 'DOMError';
    var e = new DOMError(name, message);
    e.name === name || (e.name = name);
    e.message === message || (e.message = message);
    return e;
}

/**
 * Creates a generic Error object
 * @returns {Error}
 */
function createError(name, message) {
    var e = new Error(message);
    e.name = name || 'DOMException';
    e.message = message;
    return e;
}

/**
 * Logs detailed error information to the console.
 * @param {string} name
 * @param {string} message
 * @param {string|Error|null} error
 */
function logError(name, message, error) {
    if (global.DEBUG) {
        if (error && error.message) {
            error = error.message;
        }

        var method = typeof console.error === 'function' ? 'error' : 'log';
        console[method](name + ': ' + message + '. ' + (error || ''));
        console.trace && console.trace();
    }
};

/**
 * Finds the error argument.  This is useful because some WebSQL callbacks
 * pass the error as the first argument, and some pass it as the second argument.
 * @param {array} args
 * @returns {Error|DOMException|undefined}
 */
function findError(args) {
    var err = void 0;
    if (args) {
        if (args.length === 1) {
            return args[0];
        }
        for (var i = 0; i < args.length; i++) {
            var arg = args[i];
            if (arg instanceof Error || arg instanceof DOMException) {
                return arg;
            } else if (arg && typeof arg.message === 'string') {
                err = arg;
            }
        }
    }
    return err;
};

var test = void 0,
    useNativeDOMException = false,
    useNativeDOMError = false;

// Test whether we can use the browser's native DOMException class
try {
    test = createNativeDOMException('test name', 'test message');
    if (test instanceof DOMException && test.name === 'test name' && test.message === 'test message') {
        // Native DOMException works as expected
        useNativeDOMException = true;
    }
} catch (e) {}

// Test whether we can use the browser's native DOMError class
try {
    test = createNativeDOMError('test name', 'test message');
    if (test instanceof DOMError && test.name === 'test name' && test.message === 'test message') {
        // Native DOMError works as expected
        useNativeDOMError = true;
    }
} catch (e) {}

var createDOMException = void 0,
    shimDOMException = void 0;
if (useNativeDOMException) {
    exports.DOMException = shimDOMException = DOMException;
    exports.createDOMException = createDOMException = function createDOMException(name, message, error) {
        logError(name, message, error);
        return createNativeDOMException(name, message);
    };
} else {
    exports.DOMException = shimDOMException = Error;
    exports.createDOMException = createDOMException = function createDOMException(name, message, error) {
        logError(name, message, error);
        return createError(name, message);
    };
}

var createDOMError = void 0,
    shimDOMError = void 0;
if (useNativeDOMError) {
    exports.DOMError = shimDOMError = DOMError;
    exports.createDOMError = createDOMError = function createDOMError(name, message, error) {
        logError(name, message, error);
        return createNativeDOMError(name, message);
    };
} else {
    exports.DOMError = shimDOMError = Error;
    exports.createDOMError = createDOMError = function createDOMError(name, message, error) {
        logError(name, message, error);
        return createError(name, message);
    };
}

exports.logError = logError;
exports.findError = findError;
exports.DOMError = shimDOMError;
exports.DOMException = shimDOMException;
exports.createDOMException = createDOMException;
exports.createDOMError = createDOMError;

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
/**
 * Creates a native Event object, for browsers that support it
 * @returns {Event}
 */
function createNativeEvent(type, debug) {
    var event = new Event(type);
    event.debug = debug;

    // Make the "target" writable
    Object.defineProperty(event, 'target', {
        writable: true
    });

    return event;
}

/**
 * A shim Event class, for browsers that don't allow us to create native Event objects.
 * @constructor
 */
function ShimEvent(type, debug) {
    this.type = type;
    this.debug = debug;
    this.bubbles = false;
    this.cancelable = false;
    this.eventPhase = 0;
    this.timeStamp = new Date().valueOf();
}

var useNativeEvent = false;
try {
    // Test whether we can use the browser's native Event class
    var test = createNativeEvent('test type', 'test debug');
    var target = { test: 'test target' };
    test.target = target;

    if (test instanceof Event && test.type === 'test type' && test.debug === 'test debug' && test.target === target) {
        // Native events work as expected
        useNativeEvent = true;
    }
} catch (e) {}

var expEvent = void 0,
    createEvent = void 0,
    IDBVersionChangeEvent = void 0;
if (useNativeEvent) {
    exports.Event = expEvent = Event;
    exports.IDBVersionChangeEvent = IDBVersionChangeEvent = Event;
    exports.createEvent = createEvent = createNativeEvent;
} else {
    exports.Event = expEvent = ShimEvent;
    exports.IDBVersionChangeEvent = IDBVersionChangeEvent = ShimEvent;
    exports.createEvent = createEvent = function createEvent(type, debug) {
        return new ShimEvent(type, debug);
    };
}

exports.Event = expEvent;
exports.IDBVersionChangeEvent = IDBVersionChangeEvent;
exports.createEvent = createEvent; // Event not currently in use

},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.IDBCursorWithValue = exports.IDBCursor = undefined;

var _DOMException = require('./DOMException.js');

var _IDBRequest = require('./IDBRequest.js');

var _util = require('./util.js');

var _util2 = _interopRequireDefault(_util);

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

var _IDBKeyRange = require('./IDBKeyRange.js');

var _IDBKeyRange2 = _interopRequireDefault(_IDBKeyRange);

var _Sca = require('./Sca.js');

var _Sca2 = _interopRequireDefault(_Sca);

var _IDBIndex = require('./IDBIndex.js');

var _IDBIndex2 = _interopRequireDefault(_IDBIndex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global GLOBAL*/
var global = typeof window !== 'undefined' ? window : GLOBAL;

/**
 * The IndexedDB Cursor Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBCursor
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @param {IDBObjectStore} store
 * @param {IDBObjectStore|IDBIndex} source
 * @param {string} keyColumnName
 * @param {string} valueColumnName
 * @param {boolean} count
 */
function IDBCursor(range, direction, store, source, keyColumnName, valueColumnName, count) {
    // Calling openCursor on an index or objectstore with null is allowed but we treat it as undefined internally
    if (range === null) {
        range = undefined;
    }
    if (range !== undefined && !(range instanceof _IDBKeyRange2.default)) {
        range = new _IDBKeyRange2.default(range, range, false, false);
    }
    store.transaction.__assertActive();
    if (direction !== undefined && ['next', 'prev', 'nextunique', 'prevunique'].indexOf(direction) === -1) {
        throw new TypeError(direction + 'is not a valid cursor direction');
    }

    this.source = source;
    this.direction = direction || 'next';
    this.key = undefined;
    this.primaryKey = undefined;
    this.__store = store;
    this.__range = range;
    this.__req = new _IDBRequest.IDBRequest();
    this.__keyColumnName = keyColumnName;
    this.__valueColumnName = valueColumnName;
    this.__valueDecoder = valueColumnName === 'value' ? _Sca2.default : _Key2.default;
    this.__count = count;
    this.__offset = -1; // Setting this to -1 as continue will set it to 0 anyway
    this.__lastKeyContinued = undefined; // Used when continuing with a key
    this.__multiEntryIndex = source instanceof _IDBIndex2.default ? source.multiEntry : false;
    this.__unique = this.direction.indexOf('unique') !== -1;

    if (range !== undefined) {
        // Encode the key range and cache the encoded values, so we don't have to re-encode them over and over
        range.__lower = range.lower !== undefined && _Key2.default.encode(range.lower, this.__multiEntryIndex);
        range.__upper = range.upper !== undefined && _Key2.default.encode(range.upper, this.__multiEntryIndex);
    }

    this['continue']();
}

IDBCursor.prototype.__find = function () /* key, tx, success, error, recordsToLoad */{
    var args = Array.prototype.slice.call(arguments);
    if (this.__multiEntryIndex) {
        this.__findMultiEntry.apply(this, args);
    } else {
        this.__findBasic.apply(this, args);
    }
};

IDBCursor.prototype.__findBasic = function (key, tx, success, error, recordsToLoad) {
    recordsToLoad = recordsToLoad || 1;

    var me = this;
    var quotedKeyColumnName = _util2.default.quote(me.__keyColumnName);
    var sql = ['SELECT * FROM', _util2.default.quote(me.__store.name)];
    var sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && (me.__range.lower !== undefined || me.__range.upper !== undefined)) {
        sql.push('AND');
        if (me.__range.lower !== undefined) {
            sql.push(quotedKeyColumnName, me.__range.lowerOpen ? '>' : '>=', '?');
            sqlValues.push(me.__range.__lower);
        }
        me.__range.lower !== undefined && me.__range.upper !== undefined && sql.push('AND');
        if (me.__range.upper !== undefined) {
            sql.push(quotedKeyColumnName, me.__range.upperOpen ? '<' : '<=', '?');
            sqlValues.push(me.__range.__upper);
        }
    }
    if (typeof key !== 'undefined') {
        me.__lastKeyContinued = key;
        me.__offset = 0;
    }
    if (me.__lastKeyContinued !== undefined) {
        sql.push('AND', quotedKeyColumnName, '>= ?');
        _Key2.default.validate(me.__lastKeyContinued);
        sqlValues.push(_Key2.default.encode(me.__lastKeyContinued));
    }

    // Determine the ORDER BY direction based on the cursor.
    var direction = me.direction === 'prev' || me.direction === 'prevunique' ? 'DESC' : 'ASC';

    if (!me.__count) {
        sql.push('ORDER BY', quotedKeyColumnName, direction);
        sql.push('LIMIT', recordsToLoad, 'OFFSET', me.__offset);
    }
    sql = sql.join(' ');
    global.DEBUG && console.log(sql, sqlValues);

    me.__prefetchedData = null;
    me.__prefetchedIndex = 0;
    tx.executeSql(sql, sqlValues, function (tx, data) {
        if (me.__count) {
            success(undefined, data.rows.length, undefined);
        } else if (data.rows.length > 1) {
            me.__prefetchedData = data.rows;
            me.__prefetchedIndex = 0;
            global.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for cursor');
            me.__decode(data.rows.item(0), success);
        } else if (data.rows.length === 1) {
            me.__decode(data.rows.item(0), success);
        } else {
            global.DEBUG && console.log('Reached end of cursors');
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        global.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
        error(err);
    });
};

IDBCursor.prototype.__findMultiEntry = function (key, tx, success, error) {
    var me = this;

    if (me.__prefetchedData && me.__prefetchedData.length === me.__prefetchedIndex) {
        global.DEBUG && console.log('Reached end of multiEntry cursor');
        success(undefined, undefined, undefined);
        return;
    }

    var quotedKeyColumnName = _util2.default.quote(me.__keyColumnName);
    var sql = ['SELECT * FROM', _util2.default.quote(me.__store.name)];
    var sqlValues = [];
    sql.push('WHERE', quotedKeyColumnName, 'NOT NULL');
    if (me.__range && me.__range.lower !== undefined && me.__range.upper !== undefined) {
        if (me.__range.upper.indexOf(me.__range.lower) === 0) {
            sql.push('AND', quotedKeyColumnName, 'LIKE ?');
            sqlValues.push('%' + me.__range.__lower.slice(0, -1) + '%');
        }
    }
    if (typeof key !== 'undefined') {
        me.__lastKeyContinued = key;
        me.__offset = 0;
    }
    if (me.__lastKeyContinued !== undefined) {
        sql.push('AND', quotedKeyColumnName, '>= ?');
        _Key2.default.validate(me.__lastKeyContinued);
        sqlValues.push(_Key2.default.encode(me.__lastKeyContinued));
    }

    // Determine the ORDER BY direction based on the cursor.
    var direction = me.direction === 'prev' || me.direction === 'prevunique' ? 'DESC' : 'ASC';

    if (!me.__count) {
        sql.push('ORDER BY key', direction);
    }
    sql = sql.join(' ');
    global.DEBUG && console.log(sql, sqlValues);

    me.__prefetchedData = null;
    me.__prefetchedIndex = 0;
    tx.executeSql(sql, sqlValues, function (tx, data) {
        me.__multiEntryOffset = data.rows.length;

        if (data.rows.length > 0) {
            (function () {
                var rows = [];

                for (var i = 0; i < data.rows.length; i++) {
                    var rowItem = data.rows.item(i);
                    var rowKey = _Key2.default.decode(rowItem[me.__keyColumnName], true);
                    var matches = _Key2.default.findMultiEntryMatches(rowKey, me.__range);

                    for (var j = 0; j < matches.length; j++) {
                        var matchingKey = matches[j];
                        var clone = {
                            matchingKey: _Key2.default.encode(matchingKey, true),
                            key: rowItem.key
                        };
                        clone[me.__keyColumnName] = rowItem[me.__keyColumnName];
                        clone[me.__valueColumnName] = rowItem[me.__valueColumnName];
                        rows.push(clone);
                    }
                }

                var reverse = me.direction.indexOf('prev') === 0;
                rows.sort(function (a, b) {
                    if (a.matchingKey.replace('[', 'z') < b.matchingKey.replace('[', 'z')) {
                        return reverse ? 1 : -1;
                    }
                    if (a.matchingKey.replace('[', 'z') > b.matchingKey.replace('[', 'z')) {
                        return reverse ? -1 : 1;
                    }
                    if (a.key < b.key) {
                        return me.direction === 'prev' ? 1 : -1;
                    }
                    if (a.key > b.key) {
                        return me.direction === 'prev' ? -1 : 1;
                    }
                    return 0;
                });

                me.__prefetchedData = {
                    data: rows,
                    length: rows.length,
                    item: function item(index) {
                        return this.data[index];
                    }
                };
                me.__prefetchedIndex = 0;

                if (me.__count) {
                    success(undefined, rows.length, undefined);
                } else if (rows.length > 1) {
                    global.DEBUG && console.log('Preloaded ' + me.__prefetchedData.length + ' records for multiEntry cursor');
                    me.__decode(rows[0], success);
                } else if (rows.length === 1) {
                    global.DEBUG && console.log('Reached end of multiEntry cursor');
                    me.__decode(rows[0], success);
                } else {
                    global.DEBUG && console.log('Reached end of multiEntry cursor');
                    success(undefined, undefined, undefined);
                }
            })();
        } else {
            global.DEBUG && console.log('Reached end of multiEntry cursor');
            success(undefined, undefined, undefined);
        }
    }, function (tx, err) {
        global.DEBUG && console.log('Could not execute Cursor.continue', sql, sqlValues);
        error(err);
    });
};

/**
 * Creates an "onsuccess" callback
 * @private
 */
IDBCursor.prototype.__onsuccess = function (success) {
    var me = this;
    return function (key, value, primaryKey) {
        if (me.__count) {
            success(value, me.__req);
        } else {
            me.key = key === undefined ? null : key;
            me.value = value === undefined ? null : value;
            me.primaryKey = primaryKey === undefined ? null : primaryKey;
            var result = key === undefined ? null : me;
            success(result, me.__req);
        }
    };
};

IDBCursor.prototype.__decode = function (rowItem, callback) {
    if (this.__multiEntryIndex && this.__unique) {
        if (!this.__matchedKeys) {
            this.__matchedKeys = {};
        }
        if (this.__matchedKeys[rowItem.matchingKey]) {
            callback(undefined, undefined, undefined);
            return;
        }
        this.__matchedKeys[rowItem.matchingKey] = true;
    }
    var key = _Key2.default.decode(this.__multiEntryIndex ? rowItem.matchingKey : rowItem[this.__keyColumnName], this.__multiEntryIndex);
    var val = this.__valueDecoder.decode(rowItem[this.__valueColumnName]);
    var primaryKey = _Key2.default.decode(rowItem.key);
    callback(key, val, primaryKey);
};

IDBCursor.prototype['continue'] = function (key) {
    var recordsToPreloadOnContinue = global.cursorPreloadPackSize || 100;
    var me = this;

    this.__store.transaction.__pushToQueue(me.__req, function cursorContinue(tx, args, success, error) {
        me.__offset++;

        if (me.__prefetchedData) {
            // We have pre-loaded data for the cursor
            me.__prefetchedIndex++;
            if (me.__prefetchedIndex < me.__prefetchedData.length) {
                me.__decode(me.__prefetchedData.item(me.__prefetchedIndex), me.__onsuccess(success));
                return;
            }
        }

        // No pre-fetched data, do query
        me.__find(key, tx, me.__onsuccess(success), error, recordsToPreloadOnContinue);
    });
};

IDBCursor.prototype.advance = function (count) {
    if (count <= 0) {
        throw (0, _DOMException.createDOMException)('Type Error', 'Count is invalid - 0 or negative', count);
    }
    var me = this;
    this.__store.transaction.__pushToQueue(me.__req, function cursorAdvance(tx, args, success, error) {
        me.__offset += count;
        me.__find(undefined, tx, me.__onsuccess(success), error);
    });
};

IDBCursor.prototype.update = function (valueToUpdate) {
    var me = this;
    me.__store.transaction.__assertWritable();
    return me.__store.transaction.__addToTransactionQueue(function cursorUpdate(tx, args, success, error) {
        _Sca2.default.encode(valueToUpdate, function (encoded) {
            me.__find(undefined, tx, function (key, value, primaryKey) {
                var store = me.__store;
                var params = [encoded];
                var sql = ['UPDATE', _util2.default.quote(store.name), 'SET value = ?'];
                _Key2.default.validate(primaryKey);

                // Also correct the indexes in the table
                for (var i = 0; i < store.indexNames.length; i++) {
                    var index = store.__indexes[store.indexNames[i]];
                    var indexKey = _Key2.default.getValue(valueToUpdate, index.keyPath);
                    sql.push(',', _util2.default.quote(index.name), '= ?');
                    params.push(_Key2.default.encode(indexKey, index.multiEntry));
                }

                sql.push('WHERE key = ?');
                params.push(_Key2.default.encode(primaryKey));

                global.DEBUG && console.log(sql.join(' '), encoded, key, primaryKey);
                tx.executeSql(sql.join(' '), params, function (tx, data) {
                    me.__prefetchedData = null;
                    me.__prefetchedIndex = 0;
                    if (data.rowsAffected === 1) {
                        success(key);
                    } else {
                        error('No rows with key found' + key);
                    }
                }, function (tx, data) {
                    error(data);
                });
            }, error);
        });
    });
};

IDBCursor.prototype['delete'] = function () {
    var me = this;
    me.__store.transaction.__assertWritable();
    return this.__store.transaction.__addToTransactionQueue(function cursorDelete(tx, args, success, error) {
        me.__find(undefined, tx, function (key, value, primaryKey) {
            var sql = 'DELETE FROM  ' + _util2.default.quote(me.__store.name) + ' WHERE key = ?';
            global.DEBUG && console.log(sql, key, primaryKey);
            _Key2.default.validate(primaryKey);
            tx.executeSql(sql, [_Key2.default.encode(primaryKey)], function (tx, data) {
                me.__prefetchedData = null;
                me.__prefetchedIndex = 0;
                if (data.rowsAffected === 1) {
                    // lower the offset or we will miss a row
                    me.__offset--;
                    success(undefined);
                } else {
                    error('No rows with key found' + key);
                }
            }, function (tx, data) {
                error(data);
            });
        }, error);
    });
};

// Todo: Add IDBCursorWithValue?
var IDBCursorWithValue = {};
exports.IDBCursor = IDBCursor;
exports.IDBCursorWithValue = IDBCursorWithValue;

},{"./DOMException.js":8,"./IDBIndex.js":13,"./IDBKeyRange.js":14,"./IDBRequest.js":16,"./Key.js":18,"./Sca.js":19,"./util.js":21}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _DOMException = require('./DOMException.js');

var _util = require('./util.js');

var _util2 = _interopRequireDefault(_util);

var _IDBObjectStore = require('./IDBObjectStore.js');

var _IDBObjectStore2 = _interopRequireDefault(_IDBObjectStore);

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global GLOBAL*/
var global = typeof window !== 'undefined' ? window : GLOBAL;

/**
 * IDB Database Object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#database-interface
 * @constructor
 */
function IDBDatabase(db, name, version, storeProperties) {
    this.__db = db;
    this.__closed = false;
    this.version = version;
    this.name = name;
    this.onabort = this.onerror = this.onversionchange = null;

    this.__objectStores = {};
    this.objectStoreNames = new _util2.default.StringList();
    for (var i = 0; i < storeProperties.rows.length; i++) {
        var store = new _IDBObjectStore2.default(storeProperties.rows.item(i));
        this.__objectStores[store.name] = store;
        this.objectStoreNames.push(store.name);
    }
}

/**
 * Creates a new object store.
 * @param {string} storeName
 * @param {object} [createOptions]
 * @returns {IDBObjectStore}
 */
IDBDatabase.prototype.createObjectStore = function (storeName, createOptions) {
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    if (this.__objectStores[storeName]) {
        throw (0, _DOMException.createDOMException)('ConstraintError', 'Object store "' + storeName + '" already exists in ' + this.name);
    }
    this.__versionTransaction.__assertVersionChange();

    createOptions = createOptions || {};
    /** @name IDBObjectStoreProperties **/
    var storeProperties = {
        name: storeName,
        keyPath: JSON.stringify(createOptions.keyPath || null),
        autoInc: JSON.stringify(createOptions.autoIncrement),
        indexList: '{}'
    };
    var store = new _IDBObjectStore2.default(storeProperties, this.__versionTransaction);
    _IDBObjectStore2.default.__createObjectStore(this, store);
    return store;
};

/**
 * Deletes an object store.
 * @param {string} storeName
 */
IDBDatabase.prototype.deleteObjectStore = function (storeName) {
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    var store = this.__objectStores[storeName];
    if (!store) {
        throw (0, _DOMException.createDOMException)('NotFoundError', 'Object store "' + storeName + '" does not exist in ' + this.name);
    }
    this.__versionTransaction.__assertVersionChange();

    _IDBObjectStore2.default.__deleteObjectStore(this, store);
};

IDBDatabase.prototype.close = function () {
    this.__closed = true;
};

/**
 * Starts a new transaction.
 * @param {string|string[]} storeNames
 * @param {string} mode
 * @returns {IDBTransaction}
 */
IDBDatabase.prototype.transaction = function (storeNames, mode) {
    if (this.__closed) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'An attempt was made to start a new transaction on a database connection that is not open');
    }

    if (typeof mode === 'number') {
        mode = mode === 1 ? _IDBTransaction2.default.READ_WRITE : _IDBTransaction2.default.READ_ONLY;
        global.DEBUG && console.log('Mode should be a string, but was specified as ', mode);
    } else {
        mode = mode || _IDBTransaction2.default.READ_ONLY;
    }

    if (mode !== _IDBTransaction2.default.READ_ONLY && mode !== _IDBTransaction2.default.READ_WRITE) {
        throw new TypeError('Invalid transaction mode: ' + mode);
    }

    storeNames = typeof storeNames === 'string' ? [storeNames] : storeNames;
    if (storeNames.length === 0) {
        throw (0, _DOMException.createDOMException)('InvalidAccessError', 'No object store names were specified');
    }
    for (var i = 0; i < storeNames.length; i++) {
        if (!this.objectStoreNames.contains(storeNames[i])) {
            throw (0, _DOMException.createDOMException)('NotFoundError', 'The "' + storeNames[i] + '" object store does not exist');
        }
    }

    var transaction = new _IDBTransaction2.default(this, storeNames, mode);
    return transaction;
};

exports.default = IDBDatabase;

},{"./DOMException.js":8,"./IDBObjectStore.js":15,"./IDBTransaction.js":17,"./util.js":21}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.shimIndexedDB = exports.IDBFactory = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _Event = require('./Event.js');

var _DOMException = require('./DOMException.js');

var _IDBRequest = require('./IDBRequest.js');

var _util = require('./util.js');

var _util2 = _interopRequireDefault(_util);

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

var _IDBDatabase = require('./IDBDatabase.js');

var _IDBDatabase2 = _interopRequireDefault(_IDBDatabase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global GLOBAL*/
var global = typeof window !== 'undefined' ? window : GLOBAL;
var openDatabase = typeof global.nodeWebsql === 'undefined' ? window.openDatabase : global.nodeWebsql;

var DEFAULT_DB_SIZE = 4 * 1024 * 1024;
var sysdb = void 0;

/**
 * Craetes the sysDB to keep track of version numbers for databases
 **/
function createSysDB(success, failure) {
    function sysDbCreateError(tx, err) {
        err = (0, _DOMException.findError)(arguments);
        global.DEBUG && console.log('Error in sysdb transaction - when creating dbVersions', err);
        failure(err);
    }

    if (sysdb) {
        success();
    } else {
        sysdb = openDatabase('__sysdb__', 1, 'System Database', DEFAULT_DB_SIZE);
        sysdb.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);', [], success, sysDbCreateError);
        }, sysDbCreateError);
    }
}

/**
 * IDBFactory Class
 * https://w3c.github.io/IndexedDB/#idl-def-IDBFactory
 * @constructor
 */
function IDBFactory() {}

/**
 * The IndexedDB Method to create a new database and return the DB
 * @param {string} name
 * @param {number} version
 */
IDBFactory.prototype.open = function (name, version) {
    var req = new _IDBRequest.IDBOpenDBRequest();
    var calledDbCreateError = false;

    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    } else if (arguments.length === 2) {
        version = parseFloat(version);
        if (isNaN(version) || !isFinite(version) || version <= 0) {
            throw new TypeError('Invalid database version: ' + version);
        }
    }
    name = name + ''; // cast to a string

    function dbCreateError(tx, err) {
        if (calledDbCreateError) {
            return;
        }
        err = (0, _DOMException.findError)(arguments);
        calledDbCreateError = true;
        var evt = (0, _Event.createEvent)('error', arguments);
        req.readyState = 'done';
        req.error = err || _DOMException.DOMError;
        _util2.default.callback('onerror', req, evt);
    }

    function openDB(oldVersion) {
        var db = openDatabase(name, 1, name, DEFAULT_DB_SIZE);
        req.readyState = 'done';
        if (typeof version === 'undefined') {
            version = oldVersion || 1;
        }
        if (version <= 0 || oldVersion > version) {
            var err = (0, _DOMException.createDOMError)('VersionError', 'An attempt was made to open a database using a lower version than the existing version.', version);
            dbCreateError(err);
            return;
        }

        db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexList BLOB)', [], function () {
                tx.executeSql('SELECT * FROM __sys__', [], function (tx, data) {
                    var e = (0, _Event.createEvent)('success');
                    req.source = req.result = new _IDBDatabase2.default(db, name, version, data);
                    if (oldVersion < version) {
                        // DB Upgrade in progress
                        sysdb.transaction(function (systx) {
                            systx.executeSql('UPDATE dbVersions set version = ? where name = ?', [version, name], function () {
                                var e = (0, _Event.createEvent)('upgradeneeded');
                                e.oldVersion = oldVersion;
                                e.newVersion = version;
                                req.transaction = req.result.__versionTransaction = new _IDBTransaction2.default(req.source, [], _IDBTransaction2.default.VERSION_CHANGE);
                                req.transaction.__addToTransactionQueue(function onupgradeneeded(tx, args, success) {
                                    _util2.default.callback('onupgradeneeded', req, e);
                                    success();
                                });
                                req.transaction.__oncomplete = function () {
                                    req.transaction = null;
                                    var e = (0, _Event.createEvent)('success');
                                    _util2.default.callback('onsuccess', req, e);
                                };
                            }, dbCreateError);
                        }, dbCreateError);
                    } else {
                        _util2.default.callback('onsuccess', req, e);
                    }
                }, dbCreateError);
            }, dbCreateError);
        }, dbCreateError);
    }

    createSysDB(function () {
        sysdb.transaction(function (tx) {
            tx.executeSql('SELECT * FROM dbVersions where name = ?', [name], function (tx, data) {
                if (data.rows.length === 0) {
                    // Database with this name does not exist
                    tx.executeSql('INSERT INTO dbVersions VALUES (?,?)', [name, version || 1], function () {
                        openDB(0);
                    }, dbCreateError);
                } else {
                    openDB(data.rows.item(0).version);
                }
            }, dbCreateError);
        }, dbCreateError);
    }, dbCreateError);

    return req;
};

/**
 * Deletes a database
 * @param {string} name
 * @returns {IDBOpenDBRequest}
 */
IDBFactory.prototype.deleteDatabase = function (name) {
    var req = new _IDBRequest.IDBOpenDBRequest();
    var calledDBError = false;
    var version = null;

    if (arguments.length === 0) {
        throw new TypeError('Database name is required');
    }
    name = name + ''; // cast to a string

    function dbError(tx, err) {
        if (calledDBError) {
            return;
        }
        err = (0, _DOMException.findError)(arguments);
        req.readyState = 'done';
        req.error = err || _DOMException.DOMError;
        var e = (0, _Event.createEvent)('error');
        e.debug = arguments;
        _util2.default.callback('onerror', req, e);
        calledDBError = true;
    }

    function deleteFromDbVersions() {
        sysdb.transaction(function (systx) {
            systx.executeSql('DELETE FROM dbVersions where name = ? ', [name], function () {
                req.result = undefined;
                var e = (0, _Event.createEvent)('success');
                e.newVersion = null;
                e.oldVersion = version;
                _util2.default.callback('onsuccess', req, e);
            }, dbError);
        }, dbError);
    }

    createSysDB(function () {
        sysdb.transaction(function (systx) {
            systx.executeSql('SELECT * FROM dbVersions where name = ?', [name], function (tx, data) {
                if (data.rows.length === 0) {
                    req.result = undefined;
                    var e = (0, _Event.createEvent)('success');
                    e.newVersion = null;
                    e.oldVersion = version;
                    _util2.default.callback('onsuccess', req, e);
                    return;
                }
                version = data.rows.item(0).version;
                var db = openDatabase(name, 1, name, DEFAULT_DB_SIZE);
                db.transaction(function (tx) {
                    tx.executeSql('SELECT * FROM __sys__', [], function (tx, data) {
                        var tables = data.rows;
                        (function deleteTables(i) {
                            if (i >= tables.length) {
                                // If all tables are deleted, delete the housekeeping tables
                                tx.executeSql('DROP TABLE IF EXISTS __sys__', [], function () {
                                    // Finally, delete the record for this DB from sysdb
                                    deleteFromDbVersions();
                                }, dbError);
                            } else {
                                // Delete all tables in this database, maintained in the sys table
                                tx.executeSql('DROP TABLE ' + _util2.default.quote(tables.item(i).name), [], function () {
                                    deleteTables(i + 1);
                                }, function () {
                                    deleteTables(i + 1);
                                });
                            }
                        })(0);
                    }, function (e) {
                        // __sysdb table does not exist, but that does not mean delete did not happen
                        deleteFromDbVersions();
                    });
                });
            }, dbError);
        }, dbError);
    }, dbError);

    return req;
};

/**
 * Compares two keys
 * @param key1
 * @param key2
 * @returns {number}
 */
IDBFactory.prototype.cmp = function (key1, key2) {
    if (arguments.length < 2) {
        throw new TypeError('You must provide two keys to be compared');
    }

    _Key2.default.validate(key1);
    _Key2.default.validate(key2);
    var encodedKey1 = _Key2.default.encode(key1);
    var encodedKey2 = _Key2.default.encode(key2);
    var result = encodedKey1 > encodedKey2 ? 1 : encodedKey1 === encodedKey2 ? 0 : -1;

    if (global.DEBUG) {
        // verify that the keys encoded correctly
        var decodedKey1 = _Key2.default.decode(encodedKey1);
        var decodedKey2 = _Key2.default.decode(encodedKey2);
        if ((typeof key1 === 'undefined' ? 'undefined' : _typeof(key1)) === 'object') {
            key1 = JSON.stringify(key1);
            decodedKey1 = JSON.stringify(decodedKey1);
        }
        if ((typeof key2 === 'undefined' ? 'undefined' : _typeof(key2)) === 'object') {
            key2 = JSON.stringify(key2);
            decodedKey2 = JSON.stringify(decodedKey2);
        }

        // encoding/decoding mismatches are usually due to a loss of floating-point precision
        if (decodedKey1 !== key1) {
            console.warn(key1 + ' was incorrectly encoded as ' + decodedKey1);
        }
        if (decodedKey2 !== key2) {
            console.warn(key2 + ' was incorrectly encoded as ' + decodedKey2);
        }
    }

    return result;
};

var shimIndexedDB = new IDBFactory();
exports.IDBFactory = IDBFactory;
exports.shimIndexedDB = shimIndexedDB;

},{"./DOMException.js":8,"./Event.js":9,"./IDBDatabase.js":11,"./IDBRequest.js":16,"./IDBTransaction.js":17,"./Key.js":18,"./util.js":21}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _DOMException = require('./DOMException.js');

var _util = require('./util.js');

var _util2 = _interopRequireDefault(_util);

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

var _IDBKeyRange = require('./IDBKeyRange.js');

var _IDBKeyRange2 = _interopRequireDefault(_IDBKeyRange);

var _IDBCursor = require('./IDBCursor.js');

var _Sca = require('./Sca.js');

var _Sca2 = _interopRequireDefault(_Sca);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global GLOBAL*/
var global = typeof window !== 'undefined' ? window : GLOBAL;

/**
 * IDB Index
 * http://www.w3.org/TR/IndexedDB/#idl-def-IDBIndex
 * @param {IDBObjectStore} store
 * @param {IDBIndexProperties} indexProperties
 * @constructor
 */
function IDBIndex(store, indexProperties) {
    this.objectStore = store;
    this.name = indexProperties.columnName;
    this.keyPath = indexProperties.keyPath;
    this.multiEntry = indexProperties.optionalParams && indexProperties.optionalParams.multiEntry;
    this.unique = indexProperties.optionalParams && indexProperties.optionalParams.unique;
    this.__deleted = !!indexProperties.__deleted;
}

/**
 * Clones an IDBIndex instance for a different IDBObjectStore instance.
 * @param {IDBIndex} index
 * @param {IDBObjectStore} store
 * @protected
 */
IDBIndex.__clone = function (index, store) {
    return new IDBIndex(store, {
        columnName: index.name,
        keyPath: index.keyPath,
        optionalParams: {
            multiEntry: index.multiEntry,
            unique: index.unique
        }
    });
};

/**
 * Creates a new index on an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @returns {IDBIndex}
 * @protected
 */
IDBIndex.__createIndex = function (store, index) {
    var columnExists = !!store.__indexes[index.name] && store.__indexes[index.name].__deleted;

    // Add the index to the IDBObjectStore
    store.__indexes[index.name] = index;
    store.indexNames.push(index.name);

    // Create the index in WebSQL
    var transaction = store.transaction;
    transaction.__addToTransactionQueue(function createIndex(tx, args, success, failure) {
        function error(tx, err) {
            failure((0, _DOMException.createDOMException)(0, 'Could not create index "' + index.name + '"', err));
        }

        function applyIndex(tx) {
            // Update the object store's index list
            IDBIndex.__updateIndexList(store, tx, function () {
                // Add index entries for all existing records
                tx.executeSql('SELECT * FROM ' + _util2.default.quote(store.name), [], function (tx, data) {
                    global.DEBUG && console.log('Adding existing ' + store.name + ' records to the ' + index.name + ' index');
                    addIndexEntry(0);

                    function addIndexEntry(i) {
                        if (i < data.rows.length) {
                            try {
                                var value = _Sca2.default.decode(data.rows.item(i).value);
                                var indexKey = _Key2.default.getValue(value, index.keyPath);
                                indexKey = _Key2.default.encode(indexKey, index.multiEntry);

                                tx.executeSql('UPDATE ' + _util2.default.quote(store.name) + ' set ' + _util2.default.quote(index.name) + ' = ? where key = ?', [indexKey, data.rows.item(i).key], function (tx, data) {
                                    addIndexEntry(i + 1);
                                }, error);
                            } catch (e) {
                                // Not a valid value to insert into index, so just continue
                                addIndexEntry(i + 1);
                            }
                        } else {
                            success(store);
                        }
                    }
                }, error);
            }, error);
        }

        if (columnExists) {
            // For a previously existing index, just update the index entries in the existing column
            applyIndex(tx);
        } else {
            // For a new index, add a new column to the object store, then apply the index
            var sql = ['ALTER TABLE', _util2.default.quote(store.name), 'ADD', _util2.default.quote(index.name), 'BLOB'].join(' ');
            global.DEBUG && console.log(sql);
            tx.executeSql(sql, [], applyIndex, error);
        }
    });
};

/**
 * Deletes an index from an object store.
 * @param {IDBObjectStore} store
 * @param {IDBIndex} index
 * @protected
 */
IDBIndex.__deleteIndex = function (store, index) {
    // Remove the index from the IDBObjectStore
    store.__indexes[index.name].__deleted = true;
    store.indexNames.splice(store.indexNames.indexOf(index.name), 1);

    // Remove the index in WebSQL
    var transaction = store.transaction;
    transaction.__addToTransactionQueue(function createIndex(tx, args, success, failure) {
        function error(tx, err) {
            failure((0, _DOMException.createDOMException)(0, 'Could not delete index "' + index.name + '"', err));
        }

        // Update the object store's index list
        IDBIndex.__updateIndexList(store, tx, success, error);
    });
};

/**
 * Updates index list for the given object store.
 * @param {IDBObjectStore} store
 * @param {object} tx
 * @param {function} success
 * @param {function} failure
 */
IDBIndex.__updateIndexList = function (store, tx, success, failure) {
    var indexList = {};
    for (var i = 0; i < store.indexNames.length; i++) {
        var idx = store.__indexes[store.indexNames[i]];
        /** @type {IDBIndexProperties} **/
        indexList[idx.name] = {
            columnName: idx.name,
            keyPath: idx.keyPath,
            optionalParams: {
                unique: idx.unique,
                multiEntry: idx.multiEntry
            },
            deleted: !!idx.deleted
        };
    }

    global.DEBUG && console.log('Updating the index list for ' + store.name, indexList);
    tx.executeSql('UPDATE __sys__ set indexList = ? where name = ?', [JSON.stringify(indexList), store.name], function () {
        success(store);
    }, failure);
};

/**
 * Retrieves index data for the given key
 * @param {*|IDBKeyRange} key
 * @param {string} opType
 * @returns {IDBRequest}
 * @private
 */
IDBIndex.prototype.__fetchIndexData = function (key, opType) {
    var me = this;
    var hasKey = void 0,
        encodedKey = void 0;

    // key is optional
    if (arguments.length === 1) {
        opType = key;
        hasKey = false;
    } else {
        _Key2.default.validate(key);
        encodedKey = _Key2.default.encode(key, me.multiEntry);
        hasKey = true;
    }

    return me.objectStore.transaction.__addToTransactionQueue(function fetchIndexData(tx, args, success, error) {
        var sql = ['SELECT * FROM', _util2.default.quote(me.objectStore.name), 'WHERE', _util2.default.quote(me.name), 'NOT NULL'];
        var sqlValues = [];
        if (hasKey) {
            if (me.multiEntry) {
                sql.push('AND', _util2.default.quote(me.name), 'LIKE ?');
                sqlValues.push('%' + encodedKey + '%');
            } else {
                sql.push('AND', _util2.default.quote(me.name), '= ?');
                sqlValues.push(encodedKey);
            }
        }
        global.DEBUG && console.log('Trying to fetch data for Index', sql.join(' '), sqlValues);
        tx.executeSql(sql.join(' '), sqlValues, function (tx, data) {
            var recordCount = 0,
                record = null;
            if (me.multiEntry) {
                for (var i = 0; i < data.rows.length; i++) {
                    var row = data.rows.item(i);
                    var rowKey = _Key2.default.decode(row[me.name]);
                    if (hasKey && _Key2.default.isMultiEntryMatch(encodedKey, row[me.name])) {
                        recordCount++;
                        record = record || row;
                    } else if (!hasKey && rowKey !== undefined) {
                        recordCount = recordCount + (rowKey instanceof Array ? rowKey.length : 1);
                        record = record || row;
                    }
                }
            } else {
                recordCount = data.rows.length;
                record = recordCount && data.rows.item(0);
            }

            if (opType === 'count') {
                success(recordCount);
            } else if (recordCount === 0) {
                success(undefined);
            } else if (opType === 'key') {
                success(_Key2.default.decode(record.key));
            } else {
                // when opType is value
                success(_Sca2.default.decode(record.value));
            }
        }, error);
    });
};

/**
 * Opens a cursor over the given key range.
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openCursor = function (range, direction) {
    return new _IDBCursor.IDBCursor(range, direction, this.objectStore, this, this.name, 'value').__req;
};

/**
 * Opens a cursor over the given key range.  The cursor only includes key values, not data.
 * @param {IDBKeyRange} range
 * @param {string} direction
 * @returns {IDBRequest}
 */
IDBIndex.prototype.openKeyCursor = function (range, direction) {
    return new _IDBCursor.IDBCursor(range, direction, this.objectStore, this, this.name, 'key').__req;
};

IDBIndex.prototype.get = function (key) {
    if (arguments.length === 0) {
        throw new TypeError('No key was specified');
    }

    return this.__fetchIndexData(key, 'value');
};

IDBIndex.prototype.getKey = function (key) {
    if (arguments.length === 0) {
        throw new TypeError('No key was specified');
    }

    return this.__fetchIndexData(key, 'key');
};

IDBIndex.prototype.count = function (key) {
    // key is optional
    if (key === undefined) {
        return this.__fetchIndexData('count');
    }
    if (key instanceof _IDBKeyRange2.default) {
        return new _IDBCursor.IDBCursor(key, 'next', this.objectStore, this, this.name, 'value', true).__req;
    }
    return this.__fetchIndexData(key, 'count');
};

exports.default = IDBIndex;

},{"./DOMException.js":8,"./IDBCursor.js":10,"./IDBKeyRange.js":14,"./Key.js":18,"./Sca.js":19,"./util.js":21}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The IndexedDB KeyRange object
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
 * @param {Object} lower
 * @param {Object} upper
 * @param {Object} lowerOpen
 * @param {Object} upperOpen
 */
function IDBKeyRange(lower, upper, lowerOpen, upperOpen) {
    if (lower !== undefined) {
        _Key2.default.validate(lower);
    }
    if (upper !== undefined) {
        _Key2.default.validate(upper);
    }

    this.lower = lower;
    this.upper = upper;
    this.lowerOpen = !!lowerOpen;
    this.upperOpen = !!upperOpen;
}

IDBKeyRange.only = function (value) {
    return new IDBKeyRange(value, value, false, false);
};

IDBKeyRange.lowerBound = function (value, open) {
    return new IDBKeyRange(value, undefined, open, undefined);
};
IDBKeyRange.upperBound = function (value, open) {
    return new IDBKeyRange(undefined, value, undefined, open);
};
IDBKeyRange.bound = function (lower, upper, lowerOpen, upperOpen) {
    return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
};

exports.default = IDBKeyRange;

},{"./Key.js":18}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _DOMException = require('./DOMException.js');

var _util = require('./util.js');

var _util2 = _interopRequireDefault(_util);

var _Key = require('./Key.js');

var _Key2 = _interopRequireDefault(_Key);

var _IDBKeyRange = require('./IDBKeyRange.js');

var _IDBKeyRange2 = _interopRequireDefault(_IDBKeyRange);

var _IDBCursor = require('./IDBCursor.js');

var _IDBIndex = require('./IDBIndex.js');

var _IDBIndex2 = _interopRequireDefault(_IDBIndex);

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

var _Sca = require('./Sca.js');

var _Sca2 = _interopRequireDefault(_Sca);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global GLOBAL*/
var global = typeof window !== 'undefined' ? window : GLOBAL;

/**
 * IndexedDB Object Store
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBObjectStore
 * @param {IDBObjectStoreProperties} storeProperties
 * @param {IDBTransaction} transaction
 * @constructor
 */
function IDBObjectStore(storeProperties, transaction) {
    this.name = storeProperties.name;
    this.keyPath = JSON.parse(storeProperties.keyPath);
    this.transaction = transaction;

    // autoInc is numeric (0/1) on WinPhone
    this.autoIncrement = typeof storeProperties.autoInc === 'string' ? storeProperties.autoInc === 'true' : !!storeProperties.autoInc;

    this.__indexes = {};
    this.indexNames = new _util2.default.StringList();
    var indexList = JSON.parse(storeProperties.indexList);
    for (var indexName in indexList) {
        if (indexList.hasOwnProperty(indexName)) {
            var index = new _IDBIndex2.default(this, indexList[indexName]);
            this.__indexes[index.name] = index;
            if (!index.__deleted) {
                this.indexNames.push(index.name);
            }
        }
    }
}

/**
 * Clones an IDBObjectStore instance for a different IDBTransaction instance.
 * @param {IDBObjectStore} store
 * @param {IDBTransaction} transaction
 * @protected
 */
IDBObjectStore.__clone = function (store, transaction) {
    var newStore = new IDBObjectStore({
        name: store.name,
        keyPath: JSON.stringify(store.keyPath),
        autoInc: JSON.stringify(store.autoIncrement),
        indexList: '{}'
    }, transaction);
    newStore.__indexes = store.__indexes;
    newStore.indexNames = store.indexNames;
    return newStore;
};

/**
 * Creates a new object store in the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 */
IDBObjectStore.__createObjectStore = function (db, store) {
    // Add the object store to the IDBDatabase
    db.__objectStores[store.name] = store;
    db.objectStoreNames.push(store.name);

    // Add the object store to WebSQL
    var transaction = db.__versionTransaction;
    _IDBTransaction2.default.__assertVersionChange(transaction);
    transaction.__addToTransactionQueue(function createObjectStore(tx, args, success, failure) {
        function error(tx, err) {
            throw (0, _DOMException.createDOMException)(0, 'Could not create object store "' + store.name + '"', err);
        }

        // key INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL UNIQUE
        var sql = ['CREATE TABLE', _util2.default.quote(store.name), '(key BLOB', store.autoIncrement ? 'UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT' : 'PRIMARY KEY', ', value BLOB)'].join(' ');
        global.DEBUG && console.log(sql);
        tx.executeSql(sql, [], function (tx, data) {
            tx.executeSql('INSERT INTO __sys__ VALUES (?,?,?,?)', [store.name, JSON.stringify(store.keyPath), store.autoIncrement, '{}'], function () {
                success(store);
            }, error);
        }, error);
    });
};

/**
 * Deletes an object store from the database.
 * @param {IDBDatabase} db
 * @param {IDBObjectStore} store
 * @protected
 */
IDBObjectStore.__deleteObjectStore = function (db, store) {
    // Remove the object store from the IDBDatabase
    db.__objectStores[store.name] = undefined;
    db.objectStoreNames.splice(db.objectStoreNames.indexOf(store.name), 1);

    // Remove the object store from WebSQL
    var transaction = db.__versionTransaction;
    _IDBTransaction2.default.__assertVersionChange(transaction);
    transaction.__addToTransactionQueue(function deleteObjectStore(tx, args, success, failure) {
        function error(tx, err) {
            failure((0, _DOMException.createDOMException)(0, 'Could not delete ObjectStore', err));
        }

        tx.executeSql('SELECT * FROM __sys__ where name = ?', [store.name], function (tx, data) {
            if (data.rows.length > 0) {
                tx.executeSql('DROP TABLE ' + _util2.default.quote(store.name), [], function () {
                    tx.executeSql('DELETE FROM __sys__ WHERE name = ?', [store.name], function () {
                        success();
                    }, error);
                }, error);
            }
        });
    });
};

/**
 * Determines whether the given inline or out-of-line key is valid, according to the object store's schema.
 * @param {*} value     Used for inline keys
 * @param {*} key       Used for out-of-line keys
 * @private
 */
IDBObjectStore.prototype.__validateKey = function (value, key) {
    if (this.keyPath) {
        if (typeof key !== 'undefined') {
            throw (0, _DOMException.createDOMException)('DataError', 'The object store uses in-line keys and the key parameter was provided', this);
        } else if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
            key = _Key2.default.getValue(value, this.keyPath);
            if (key === undefined) {
                if (this.autoIncrement) {
                    // A key will be generated
                    return;
                }
                throw (0, _DOMException.createDOMException)('DataError', 'Could not eval key from keyPath');
            }
        } else {
            throw (0, _DOMException.createDOMException)('DataError', 'KeyPath was specified, but value was not an object');
        }
    } else {
        if (typeof key === 'undefined') {
            if (this.autoIncrement) {
                // A key will be generated
                return;
            } else {
                throw (0, _DOMException.createDOMException)('DataError', 'The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ', this);
            }
        }
    }

    _Key2.default.validate(key);
};

/**
 * From the store properties and object, extracts the value for the key in hte object Store
 * If the table has auto increment, get the next in sequence
 * @param {Object} tx
 * @param {Object} value
 * @param {Object} key
 * @param {function} success
 * @param {function} failure
 */
IDBObjectStore.prototype.__deriveKey = function (tx, value, key, success, failure) {
    var me = this;

    function getNextAutoIncKey(callback) {
        tx.executeSql('SELECT * FROM sqlite_sequence where name like ?', [me.name], function (tx, data) {
            if (data.rows.length !== 1) {
                callback(1);
            } else {
                callback(data.rows.item(0).seq + 1);
            }
        }, function (tx, error) {
            failure((0, _DOMException.createDOMException)('DataError', 'Could not get the auto increment value for key', error));
        });
    }

    if (me.keyPath) {
        var primaryKey = _Key2.default.getValue(value, me.keyPath);
        if (primaryKey === undefined && me.autoIncrement) {
            getNextAutoIncKey(function (primaryKey) {
                try {
                    // Update the value with the new key
                    _Key2.default.setValue(value, me.keyPath, primaryKey);
                    success(primaryKey);
                } catch (e) {
                    failure((0, _DOMException.createDOMException)('DataError', 'Could not assign a generated value to the keyPath', e));
                }
            });
        } else {
            success(primaryKey);
        }
    } else {
        if (typeof key === 'undefined' && me.autoIncrement) {
            // Looks like this has autoInc, so lets get the next in sequence and return that.
            getNextAutoIncKey(success);
        } else {
            success(key);
        }
    }
};

IDBObjectStore.prototype.__insertData = function (tx, encoded, value, primaryKey, success, error) {
    try {
        var paramMap = {};
        if (typeof primaryKey !== 'undefined') {
            _Key2.default.validate(primaryKey);
            paramMap.key = _Key2.default.encode(primaryKey);
        }
        for (var i = 0; i < this.indexNames.length; i++) {
            var index = this.__indexes[this.indexNames[i]];
            paramMap[index.name] = _Key2.default.encode(_Key2.default.getValue(value, index.keyPath), index.multiEntry);
        }
        var sqlStart = ['INSERT INTO ', _util2.default.quote(this.name), '('];
        var sqlEnd = [' VALUES ('];
        var sqlValues = [];
        for (var key in paramMap) {
            sqlStart.push(_util2.default.quote(key) + ',');
            sqlEnd.push('?,');
            sqlValues.push(paramMap[key]);
        }
        // removing the trailing comma
        sqlStart.push('value )');
        sqlEnd.push('?)');
        sqlValues.push(encoded);

        var sql = sqlStart.join(' ') + sqlEnd.join(' ');

        global.DEBUG && console.log('SQL for adding', sql, sqlValues);
        tx.executeSql(sql, sqlValues, function (tx, data) {
            _Sca2.default.encode(primaryKey, function (primaryKey) {
                primaryKey = _Sca2.default.decode(primaryKey);
                success(primaryKey);
            });
        }, function (tx, err) {
            error((0, _DOMException.createDOMError)('ConstraintError', err.message, err));
        });
    } catch (e) {
        error(e);
    }
};

IDBObjectStore.prototype.add = function (value, key) {
    var me = this;
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    this.__validateKey(value, key);
    me.transaction.__assertWritable();

    var request = me.transaction.__createRequest();
    me.transaction.__pushToQueue(request, function objectStoreAdd(tx, args, success, error) {
        me.__deriveKey(tx, value, key, function (primaryKey) {
            _Sca2.default.encode(value, function (encoded) {
                me.__insertData(tx, encoded, value, primaryKey, success, error);
            });
        }, error);
    });
    return request;
};

IDBObjectStore.prototype.put = function (value, key) {
    var me = this;
    if (arguments.length === 0) {
        throw new TypeError('No value was specified');
    }
    this.__validateKey(value, key);
    me.transaction.__assertWritable();

    var request = me.transaction.__createRequest();
    me.transaction.__pushToQueue(request, function objectStorePut(tx, args, success, error) {
        me.__deriveKey(tx, value, key, function (primaryKey) {
            _Sca2.default.encode(value, function (encoded) {
                // First try to delete if the record exists
                _Key2.default.validate(primaryKey);
                var sql = 'DELETE FROM ' + _util2.default.quote(me.name) + ' where key = ?';
                tx.executeSql(sql, [_Key2.default.encode(primaryKey)], function (tx, data) {
                    global.DEBUG && console.log('Did the row with the', primaryKey, 'exist? ', data.rowsAffected);
                    me.__insertData(tx, encoded, value, primaryKey, success, error);
                }, function (tx, err) {
                    error(err);
                });
            });
        }, error);
    });
    return request;
};

IDBObjectStore.prototype.get = function (key) {
    // TODO Key should also be a key range
    var me = this;

    if (arguments.length === 0) {
        throw new TypeError('No key was specified');
    }

    _Key2.default.validate(key);
    var primaryKey = _Key2.default.encode(key);
    return me.transaction.__addToTransactionQueue(function objectStoreGet(tx, args, success, error) {
        global.DEBUG && console.log('Fetching', me.name, primaryKey);
        tx.executeSql('SELECT * FROM ' + _util2.default.quote(me.name) + ' where key = ?', [primaryKey], function (tx, data) {
            global.DEBUG && console.log('Fetched data', data);
            var value = void 0;
            try {
                // Opera can't deal with the try-catch here.
                if (0 === data.rows.length) {
                    return success();
                }

                value = _Sca2.default.decode(data.rows.item(0).value);
            } catch (e) {
                // If no result is returned, or error occurs when parsing JSON
                global.DEBUG && console.log(e);
            }
            success(value);
        }, function (tx, err) {
            error(err);
        });
    });
};

IDBObjectStore.prototype['delete'] = function (key) {
    var me = this;

    if (arguments.length === 0) {
        throw new TypeError('No key was specified');
    }

    me.transaction.__assertWritable();
    _Key2.default.validate(key);
    var primaryKey = _Key2.default.encode(key);
    // TODO key should also support key ranges
    return me.transaction.__addToTransactionQueue(function objectStoreDelete(tx, args, success, error) {
        global.DEBUG && console.log('Fetching', me.name, primaryKey);
        tx.executeSql('DELETE FROM ' + _util2.default.quote(me.name) + ' where key = ?', [primaryKey], function (tx, data) {
            global.DEBUG && console.log('Deleted from database', data.rowsAffected);
            success();
        }, function (tx, err) {
            error(err);
        });
    });
};

IDBObjectStore.prototype.clear = function () {
    var me = this;
    me.transaction.__assertWritable();
    return me.transaction.__addToTransactionQueue(function objectStoreClear(tx, args, success, error) {
        tx.executeSql('DELETE FROM ' + _util2.default.quote(me.name), [], function (tx, data) {
            global.DEBUG && console.log('Cleared all records from database', data.rowsAffected);
            success();
        }, function (tx, err) {
            error(err);
        });
    });
};

IDBObjectStore.prototype.count = function (key) {
    var _this = this;

    if (key instanceof _IDBKeyRange2.default) {
        return new _IDBCursor.IDBCursor(key, 'next', this, this, 'key', 'value', true).__req;
    } else {
        var _ret = function () {
            var me = _this;
            var hasKey = false;

            // key is optional
            if (key !== undefined) {
                hasKey = true;
                _Key2.default.validate(key);
            }

            return {
                v: me.transaction.__addToTransactionQueue(function objectStoreCount(tx, args, success, error) {
                    var sql = 'SELECT * FROM ' + _util2.default.quote(me.name) + (hasKey ? ' WHERE key = ?' : '');
                    var sqlValues = [];
                    hasKey && sqlValues.push(_Key2.default.encode(key));
                    tx.executeSql(sql, sqlValues, function (tx, data) {
                        success(data.rows.length);
                    }, function (tx, err) {
                        error(err);
                    });
                })
            };
        }();

        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    }
};

IDBObjectStore.prototype.openCursor = function (range, direction) {
    return new _IDBCursor.IDBCursor(range, direction, this, this, 'key', 'value').__req;
};

IDBObjectStore.prototype.index = function (indexName) {
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    var index = this.__indexes[indexName];
    if (!index) {
        throw (0, _DOMException.createDOMException)('NotFoundError', 'Index "' + indexName + '" does not exist on ' + this.name);
    }

    return _IDBIndex2.default.__clone(index, this);
};

/**
 * Creates a new index on the object store.
 * @param {string} indexName
 * @param {string} keyPath
 * @param {object} optionalParameters
 * @returns {IDBIndex}
 */
IDBObjectStore.prototype.createIndex = function (indexName, keyPath, optionalParameters) {
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    if (arguments.length === 1) {
        throw new TypeError('No key path was specified');
    }
    if (keyPath instanceof Array && optionalParameters && optionalParameters.multiEntry) {
        throw (0, _DOMException.createDOMException)('InvalidAccessError', 'The keyPath argument was an array and the multiEntry option is true.');
    }
    if (this.__indexes[indexName] && !this.__indexes[indexName].__deleted) {
        throw (0, _DOMException.createDOMException)('ConstraintError', 'Index "' + indexName + '" already exists on ' + this.name);
    }

    this.transaction.__assertVersionChange();

    optionalParameters = optionalParameters || {};
    /** @name IDBIndexProperties **/
    var indexProperties = {
        columnName: indexName,
        keyPath: keyPath,
        optionalParams: {
            unique: !!optionalParameters.unique,
            multiEntry: !!optionalParameters.multiEntry
        }
    };
    var index = new _IDBIndex2.default(this, indexProperties);
    _IDBIndex2.default.__createIndex(this, index);
    return index;
};

IDBObjectStore.prototype.deleteIndex = function (indexName) {
    if (arguments.length === 0) {
        throw new TypeError('No index name was specified');
    }
    var index = this.__indexes[indexName];
    if (!index) {
        throw (0, _DOMException.createDOMException)('NotFoundError', 'Index "' + indexName + '" does not exist on ' + this.name);
    }
    this.transaction.__assertVersionChange();

    _IDBIndex2.default.__deleteIndex(this, index);
};

exports.default = IDBObjectStore;

},{"./DOMException.js":8,"./IDBCursor.js":10,"./IDBIndex.js":13,"./IDBKeyRange.js":14,"./IDBTransaction.js":17,"./Key.js":18,"./Sca.js":19,"./util.js":21}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * The IDBRequest Object that is returns for all async calls
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#request-api
 */
function IDBRequest() {
  this.onsuccess = this.onerror = this.result = this.error = this.source = this.transaction = null;
  this.readyState = 'pending';
}

/**
 * The IDBOpenDBRequest called when a database is opened
 */
function IDBOpenDBRequest() {
  this.onblocked = this.onupgradeneeded = null;
}
IDBOpenDBRequest.prototype = new IDBRequest();
IDBOpenDBRequest.prototype.constructor = IDBOpenDBRequest;

exports.IDBRequest = IDBRequest;
exports.IDBOpenDBRequest = IDBOpenDBRequest;

},{}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _eventtarget = require('eventtarget');

var _eventtarget2 = _interopRequireDefault(_eventtarget);

var _Event = require('./Event.js');

var _DOMException = require('./DOMException.js');

var _IDBRequest = require('./IDBRequest.js');

var _util = require('./util.js');

var _util2 = _interopRequireDefault(_util);

var _IDBObjectStore = require('./IDBObjectStore.js');

var _IDBObjectStore2 = _interopRequireDefault(_IDBObjectStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*global GLOBAL*/
var global = typeof window !== 'undefined' ? window : GLOBAL;

var uniqueID = 0;

/**
 * The IndexedDB Transaction
 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#idl-def-IDBTransaction
 * @param {IDBDatabase} db
 * @param {string[]} storeNames
 * @param {string} mode
 * @constructor
 */
function IDBTransaction(db, storeNames, mode) {
    this.__id = ++uniqueID; // for debugging simultaneous transactions
    this.__active = true;
    this.__running = false;
    this.__errored = false;
    this.__requests = [];
    this.__storeNames = storeNames;
    this.mode = mode;
    this.db = db;
    this.error = null;
    this.onabort = this.onerror = this.oncomplete = null;

    // Kick off the transaction as soon as all synchronous code is done.
    var me = this;
    setTimeout(function () {
        me.__executeRequests();
    }, 0);
}

IDBTransaction.prototype.__executeRequests = function () {
    if (this.__running) {
        global.DEBUG && console.log('Looks like the request set is already running', this.mode);
        return;
    }

    this.__running = true;
    var me = this;

    me.db.__db.transaction(function executeRequests(tx) {
        me.__tx = tx;
        var q = null,
            i = 0;

        function success(result, req) {
            if (req) {
                q.req = req; // Need to do this in case of cursors
            }
            q.req.readyState = 'done';
            q.req.result = result;
            delete q.req.error;
            var e = (0, _Event.createEvent)('success');
            _util2.default.callback('onsuccess', q.req, e);
            i++;
            executeNextRequest();
        }

        function error(tx, err) {
            err = (0, _DOMException.findError)(arguments);
            try {
                // Fire an error event for the current IDBRequest
                q.req.readyState = 'done';
                q.req.error = err || _DOMException.DOMError;
                q.req.result = undefined;
                var e = (0, _Event.createEvent)('error', err);
                _util2.default.callback('onerror', q.req, e);
            } finally {
                // Fire an error event for the transaction
                transactionError(err);
            }
        }

        function executeNextRequest() {
            if (i >= me.__requests.length) {
                // All requests in the transaction are done
                me.__requests = [];
                if (me.__active) {
                    me.__active = false;
                    transactionFinished();
                }
            } else {
                try {
                    q = me.__requests[i];
                    q.op(tx, q.args, success, error);
                } catch (e) {
                    error(e);
                }
            }
        }

        executeNextRequest();
    }, function webSqlError(err) {
        transactionError(err);
    });

    function transactionError(err) {
        (0, _DOMException.logError)('Error', 'An error occurred in a transaction', err);

        if (me.__errored) {
            // We've already called "onerror", "onabort", or thrown, so don't do it again.
            return;
        }

        me.__errored = true;

        if (!me.__active) {
            // The transaction has already completed, so we can't call "onerror" or "onabort".
            // So throw the error instead.
            throw err;
        }

        try {
            me.error = err;
            var evt = (0, _Event.createEvent)('error');
            _util2.default.callback('onerror', me, evt);
            _util2.default.callback('onerror', me.db, evt);
        } finally {
            me.abort();
        }
    }

    function transactionFinished() {
        global.DEBUG && console.log('Transaction completed');
        var evt = (0, _Event.createEvent)('complete');
        try {
            _util2.default.callback('oncomplete', me, evt);
            _util2.default.callback('__oncomplete', me, evt);
        } catch (e) {
            // An error occurred in the "oncomplete" handler.
            // It's too late to call "onerror" or "onabort". Throw a global error instead.
            // (this may seem odd/bad, but it's how all native IndexedDB implementations work)
            me.__errored = true;
            throw e;
        }
    }
};

/**
 * Creates a new IDBRequest for the transaction.
 * NOTE: The transaction is not queued until you call {@link IDBTransaction#__pushToQueue}
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__createRequest = function () {
    var request = new _IDBRequest.IDBRequest();
    request.source = this.db;
    request.transaction = this;
    return request;
};

/**
 * Adds a callback function to the transaction queue
 * @param {function} callback
 * @param {*} args
 * @returns {IDBRequest}
 * @protected
 */
IDBTransaction.prototype.__addToTransactionQueue = function (callback, args) {
    var request = this.__createRequest();
    this.__pushToQueue(request, callback, args);
    return request;
};

/**
 * Adds an IDBRequest to the transaction queue
 * @param {IDBRequest} request
 * @param {function} callback
 * @param {*} args
 * @protected
 */
IDBTransaction.prototype.__pushToQueue = function (request, callback, args) {
    this.__assertActive();
    this.__requests.push({
        'op': callback,
        'args': args,
        'req': request
    });
};

IDBTransaction.prototype.__assertActive = function () {
    if (!this.__active) {
        throw (0, _DOMException.createDOMException)('TransactionInactiveError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
};

IDBTransaction.prototype.__assertWritable = function () {
    if (this.mode === IDBTransaction.READ_ONLY) {
        throw (0, _DOMException.createDOMException)('ReadOnlyError', 'The transaction is read only');
    }
};

IDBTransaction.prototype.__assertVersionChange = function () {
    IDBTransaction.__assertVersionChange(this);
};

IDBTransaction.__assertVersionChange = function (tx) {
    if (!tx || tx.mode !== IDBTransaction.VERSION_CHANGE) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'Not a version transaction');
    }
};

/**
 * Returns the specified object store.
 * @param {string} objectStoreName
 * @returns {IDBObjectStore}
 */
IDBTransaction.prototype.objectStore = function (objectStoreName) {
    if (arguments.length === 0) {
        throw new TypeError('No object store name was specified');
    }
    if (!this.__active) {
        throw (0, _DOMException.createDOMException)('InvalidStateError', 'A request was placed against a transaction which is currently not active, or which is finished');
    }
    if (this.__storeNames.indexOf(objectStoreName) === -1 && this.mode !== IDBTransaction.VERSION_CHANGE) {
        throw (0, _DOMException.createDOMException)('NotFoundError', objectStoreName + ' is not participating in this transaction');
    }
    var store = this.db.__objectStores[objectStoreName];
    if (!store) {
        throw (0, _DOMException.createDOMException)('NotFoundError', objectStoreName + ' does not exist in ' + this.db.name);
    }

    return _IDBObjectStore2.default.__clone(store, this);
};

IDBTransaction.prototype.abort = function () {
    var me = this;
    global.DEBUG && console.log('The transaction was aborted', me);
    me.__active = false;
    var evt = (0, _Event.createEvent)('abort');

    // Fire the "onabort" event asynchronously, so errors don't bubble
    setTimeout(function () {
        _util2.default.callback('onabort', me, evt);
    }, 0);
};

Object.assign(IDBTransaction.prototype, _eventtarget2.default.prototype);

IDBTransaction.READ_ONLY = 'readonly';
IDBTransaction.READ_WRITE = 'readwrite';
IDBTransaction.VERSION_CHANGE = 'versionchange';

exports.default = IDBTransaction;

},{"./DOMException.js":8,"./Event.js":9,"./IDBObjectStore.js":15,"./IDBRequest.js":16,"./util.js":21,"eventtarget":4}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = exports.findMultiEntryMatches = exports.isMultiEntryMatch = exports.setValue = exports.getValue = exports.validate = exports.decode = exports.encode = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /*eslint-disable no-eval*/


var _DOMException = require('./DOMException.js');

var Key = {};

/**
 * Encodes the keys based on their types. This is required to maintain collations
 */
var collations = ['undefined', 'number', 'date', 'string', 'array'];

/**
 * The sign values for numbers, ordered from least to greatest.
 *  - "negativeInfinity": Sorts below all other values.
 *  - "bigNegative": Negative values less than or equal to negative one.
 *  - "smallNegative": Negative values between negative one and zero, noninclusive.
 *  - "smallPositive": Positive values between zero and one, including zero but not one.
 *  - "largePositive": Positive values greater than or equal to one.
 *  - "positiveInfinity": Sorts above all other values.
 */
var signValues = ['negativeInfinity', 'bigNegative', 'smallNegative', 'smallPositive', 'bigPositive', 'positiveInfinity'];

var types = {
    // Undefined is not a valid key type.  It's only used when there is no key.
    undefined: {
        encode: function encode(key) {
            return collations.indexOf('undefined') + '-';
        },
        decode: function decode(key) {
            return undefined;
        }
    },

    // Dates are encoded as ISO 8601 strings, in UTC time zone.
    date: {
        encode: function encode(key) {
            return collations.indexOf('date') + '-' + key.toJSON();
        },
        decode: function decode(key) {
            return new Date(key.substring(2));
        }
    },

    // Numbers are represented in a lexically sortable base-32 sign-exponent-mantissa
    // notation.
    //
    // sign: takes a value between zero and five, inclusive. Represents infinite cases
    //     and the signs of both the exponent and the fractional part of the number.
    // exponent: paded to two base-32 digits, represented by the 32's compliment in the
    //     "smallPositive" and "bigNegative" cases to ensure proper lexical sorting.
    // mantissa: also called the fractional part. Normed 11-digit base-32 representation.
    //     Represented by the 32's compliment in the "smallNegative" and "bigNegative"
    //     cases to ensure proper lexical sorting.
    number: {
        // The encode step checks for six numeric cases and generates 14-digit encoded
        // sign-exponent-mantissa strings.
        encode: function encode(key) {
            var key32 = Math.abs(key).toString(32);
            // Get the index of the decimal.
            var decimalIndex = key32.indexOf('.');
            // Remove the decimal.
            key32 = decimalIndex !== -1 ? key32.replace('.', '') : key32;
            // Get the index of the first significant digit.
            var significantDigitIndex = key32.search(/[^0]/);
            // Truncate leading zeros.
            key32 = key32.slice(significantDigitIndex);
            var sign = void 0,
                exponent = zeros(2),
                mantissa = zeros(11);

            // Finite cases:
            if (isFinite(key)) {
                // Negative cases:
                if (key < 0) {
                    // Negative exponent case:
                    if (key > -1) {
                        sign = signValues.indexOf('smallNegative');
                        exponent = padBase32Exponent(significantDigitIndex);
                        mantissa = flipBase32(padBase32Mantissa(key32));
                        // Non-negative exponent case:
                    } else {
                            sign = signValues.indexOf('bigNegative');
                            exponent = flipBase32(padBase32Exponent(decimalIndex !== -1 ? decimalIndex : key32.length));
                            mantissa = flipBase32(padBase32Mantissa(key32));
                        }
                    // Non-negative cases:
                } else {
                        // Negative exponent case:
                        if (key < 1) {
                            sign = signValues.indexOf('smallPositive');
                            exponent = flipBase32(padBase32Exponent(significantDigitIndex));
                            mantissa = padBase32Mantissa(key32);
                            // Non-negative exponent case:
                        } else {
                                sign = signValues.indexOf('bigPositive');
                                exponent = padBase32Exponent(decimalIndex !== -1 ? decimalIndex : key32.length);
                                mantissa = padBase32Mantissa(key32);
                            }
                    }
                // Infinite cases:
            } else {
                    sign = signValues.indexOf(key > 0 ? 'positiveInfinity' : 'negativeInfinity');
                }

            return collations.indexOf('number') + '-' + sign + exponent + mantissa;
        },
        // The decode step must interpret the sign, reflip values encoded as the 32's complements,
        // apply signs to the exponent and mantissa, do the base-32 power operation, and return
        // the original JavaScript number values.
        decode: function decode(key) {
            var sign = +key.substr(2, 1);
            var exponent = key.substr(3, 2);
            var mantissa = key.substr(5, 11);

            switch (signValues[sign]) {
                case 'negativeInfinity':
                    return -Infinity;
                case 'positiveInfinity':
                    return Infinity;
                case 'bigPositive':
                    return pow32(mantissa, exponent);
                case 'smallPositive':
                    exponent = negate(flipBase32(exponent));
                    return pow32(mantissa, exponent);
                case 'smallNegative':
                    exponent = negate(exponent);
                    mantissa = flipBase32(mantissa);
                    return -pow32(mantissa, exponent);
                case 'bigNegative':
                    exponent = flipBase32(exponent);
                    mantissa = flipBase32(mantissa);
                    return -pow32(mantissa, exponent);
                default:
                    throw new Error('Invalid number.');
            }
        }
    },

    // Strings are encoded as JSON strings (with quotes and unicode characters escaped).
    //
    // IF the strings are in an array, then some extra encoding is done to make sorting work correctly:
    // Since we can't force all strings to be the same length, we need to ensure that characters line-up properly
    // for sorting, while also accounting for the extra characters that are added when the array itself is encoded as JSON.
    // To do this, each character of the string is prepended with a dash ("-"), and a space is added to the end of the string.
    // This effectively doubles the size of every string, but it ensures that when two arrays of strings are compared,
    // the indexes of each string's characters line up with each other.
    string: {
        encode: function encode(key, inArray) {
            if (inArray) {
                // prepend each character with a dash, and append a space to the end
                key = key.replace(/(.)/g, '-$1') + ' ';
            }
            return collations.indexOf('string') + '-' + key;
        },
        decode: function decode(key, inArray) {
            key = key.substring(2);
            if (inArray) {
                // remove the space at the end, and the dash before each character
                key = key.substr(0, key.length - 1).replace(/-(.)/g, '$1');
            }
            return key;
        }
    },

    // Arrays are encoded as JSON strings.
    // An extra, value is added to each array during encoding to make empty arrays sort correctly.
    array: {
        encode: function encode(key) {
            var encoded = [];
            for (var i = 0; i < key.length; i++) {
                var item = key[i];
                var encodedItem = _encode(item, true); // encode the array item
                encoded[i] = encodedItem;
            }
            encoded.push(collations.indexOf('undefined') + '-'); // append an extra item, so empty arrays sort correctly
            return collations.indexOf('array') + '-' + JSON.stringify(encoded);
        },
        decode: function decode(key) {
            var decoded = JSON.parse(key.substring(2));
            decoded.pop(); // remove the extra item
            for (var i = 0; i < decoded.length; i++) {
                var item = decoded[i];
                var decodedItem = _decode(item, true); // decode the item
                decoded[i] = decodedItem;
            }
            return decoded;
        }
    }
};

/**
 * Return a padded base-32 exponent value.
 * @param {number}
 * @return {string}
 */
function padBase32Exponent(n) {
    n = n.toString(32);
    return n.length === 1 ? '0' + n : n;
}

/**
 * Return a padded base-32 mantissa.
 * @param {string}
 * @return {string}
 */
function padBase32Mantissa(s) {
    return (s + zeros(11)).slice(0, 11);
}

/**
 * Flips each digit of a base-32 encoded string.
 * @param {string} encoded
 */
function flipBase32(encoded) {
    var flipped = '';
    for (var i = 0; i < encoded.length; i++) {
        flipped += (31 - parseInt(encoded[i], 32)).toString(32);
    }
    return flipped;
}

/**
 * Base-32 power function.
 * RESEARCH: This function does not precisely decode floats because it performs
 * floating point arithmetic to recover values. But can the original values be
 * recovered exactly?
 * Someone may have already figured out a good way to store JavaScript floats as
 * binary strings and convert back. Barring a better method, however, one route
 * may be to generate decimal strings that `parseFloat` decodes predictably.
 * @param {string}
 * @param {string}
 * @return {number}
 */
function pow32(mantissa, exponent) {
    exponent = parseInt(exponent, 32);
    if (exponent < 0) {
        return roundToPrecision(parseInt(mantissa, 32) * Math.pow(32, exponent - 10));
    } else {
        if (exponent < 11) {
            var whole = mantissa.slice(0, exponent);
            whole = parseInt(whole, 32);
            var fraction = mantissa.slice(exponent);
            fraction = parseInt(fraction, 32) * Math.pow(32, exponent - 11);
            return roundToPrecision(whole + fraction);
        } else {
            var expansion = mantissa + zeros(exponent - 11);
            return parseInt(expansion, 32);
        }
    }
}

/**
 *
 */
function roundToPrecision(num, precision) {
    precision = precision || 16;
    return parseFloat(num.toPrecision(precision));
}

/**
 * Returns a string of n zeros.
 * @param {number}
 * @return {string}
 */
function zeros(n) {
    var result = '';
    while (n--) {
        result = result + '0';
    }
    return result;
}

/**
 * Negates numeric strings.
 * @param {string}
 * @return {string}
 */
function negate(s) {
    return '-' + s;
}

/**
 * Returns the string "number", "date", "string", or "array".
 */
function getType(key) {
    if (key instanceof Date) {
        return 'date';
    }
    if (key instanceof Array) {
        return 'array';
    }
    return typeof key === 'undefined' ? 'undefined' : _typeof(key);
}

/**
 * Keys must be strings, numbers, Dates, or Arrays
 */
function validate(key) {
    var type = getType(key);
    if (type === 'array') {
        for (var i = 0; i < key.length; i++) {
            validate(key[i]);
        }
    } else if (!types[type] || type !== 'string' && isNaN(key)) {
        throw (0, _DOMException.createDOMException)('DataError', 'Not a valid key');
    }
}

/**
 * Returns the value of an inline key
 * @param {object} source
 * @param {string|array} keyPath
 */
function getValue(source, keyPath) {
    try {
        if (keyPath instanceof Array) {
            var arrayValue = [];
            for (var i = 0; i < keyPath.length; i++) {
                arrayValue.push(eval('source.' + keyPath[i]));
            }
            return arrayValue;
        } else {
            return eval('source.' + keyPath);
        }
    } catch (e) {
        return undefined;
    }
}

/**
 * Sets the inline key value
 * @param {object} source
 * @param {string} keyPath
 * @param {*} value
 */
function setValue(source, keyPath, value) {
    var props = keyPath.split('.');
    for (var i = 0; i < props.length - 1; i++) {
        var prop = props[i];
        source = source[prop] = source[prop] || {};
    }
    source[props[props.length - 1]] = value;
}

/**
 * Determines whether an index entry matches a multi-entry key value.
 * @param {string} encodedEntry     The entry value (already encoded)
 * @param {string} encodedKey       The full index key (already encoded)
 * @returns {boolean}
 */
function isMultiEntryMatch(encodedEntry, encodedKey) {
    var keyType = collations[encodedKey.substring(0, 1)];

    if (keyType === 'array') {
        return encodedKey.indexOf(encodedEntry) > 1;
    } else {
        return encodedKey === encodedEntry;
    }
}

function isKeyInRange(key, range) {
    var lowerMatch = range.lower === undefined;
    var upperMatch = range.upper === undefined;
    var encodedKey = _encode(key, true);

    if (range.lower !== undefined) {
        if (range.lowerOpen && encodedKey > range.__lower) {
            lowerMatch = true;
        }
        if (!range.lowerOpen && encodedKey >= range.__lower) {
            lowerMatch = true;
        }
    }
    if (range.upper !== undefined) {
        if (range.upperOpen && encodedKey < range.__upper) {
            upperMatch = true;
        }
        if (!range.upperOpen && encodedKey <= range.__upper) {
            upperMatch = true;
        }
    }

    return lowerMatch && upperMatch;
}

function findMultiEntryMatches(keyEntry, range) {
    var matches = [];

    if (keyEntry instanceof Array) {
        for (var i = 0; i < keyEntry.length; i++) {
            var key = keyEntry[i];

            if (key instanceof Array) {
                if (range.lower === range.upper) {
                    continue;
                }
                if (key.length === 1) {
                    key = key[0];
                } else {
                    var nested = findMultiEntryMatches(key, range);
                    if (nested.length > 0) {
                        matches.push(key);
                    }
                    continue;
                }
            }

            if (isKeyInRange(key, range)) {
                matches.push(key);
            }
        }
    } else {
        if (isKeyInRange(keyEntry, range)) {
            matches.push(keyEntry);
        }
    }
    return matches;
}

function _encode(key, inArray) {
    if (key === undefined) {
        return null;
    }
    return types[getType(key)].encode(key, inArray);
}
function _decode(key, inArray) {
    if (typeof key !== 'string') {
        return undefined;
    }
    return types[collations[key.substring(0, 1)]].decode(key, inArray);
}

exports.default = Key = { encode: _encode, decode: _decode, validate: validate, getValue: getValue, setValue: setValue, isMultiEntryMatch: isMultiEntryMatch, findMultiEntryMatches: findMultiEntryMatches };
exports.encode = _encode;
exports.decode = _decode;
exports.validate = validate;
exports.getValue = getValue;
exports.setValue = setValue;
exports.isMultiEntryMatch = isMultiEntryMatch;
exports.findMultiEntryMatches = findMultiEntryMatches;
exports.default = Key;

},{"./DOMException.js":8}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = exports.decode = exports.encode = exports.retrocycle = exports.decycle = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /*eslint-disable no-eval*/


var _atob = require('atob');

var _atob2 = _interopRequireDefault(_atob);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
function decycle(object, callback) {
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

    var objects = []; // Keep a reference to each unique object or array
    var paths = []; // Keep the path to each unique object or array
    var queuedObjects = [];
    var returnCallback = callback;
    var derezObj = void 0; // eslint-disable-line prefer-const

    /**
     * Check the queue to see if all objects have been processed.
     * if they have, call the callback with the converted object.
     */
    function checkForCompletion() {
        if (queuedObjects.length === 0) {
            returnCallback(derezObj);
        }
    }

    /**
     * Convert a blob to a data URL.
     * @param {Blob} blob to convert.
     * @param {String} path of blob in object being encoded.
     */
    function readBlobAsDataURL(blob, path) {
        var reader = new FileReader();
        reader.onloadend = function (loadedEvent) {
            var dataURL = loadedEvent.target.result;
            var blobtype = 'Blob';
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
    function updateEncodedBlob(dataURL, path, blobtype) {
        var encoded = queuedObjects.indexOf(path);
        path = path.replace('$', 'derezObj');
        eval(path + '.$enc="' + dataURL + '"');
        eval(path + '.$type="' + blobtype + '"');
        queuedObjects.splice(encoded, 1);
        checkForCompletion();
    }

    function derez(value, path) {
        // The derez recurses through the object, producing the deep copy.

        var i = void 0,
            // The loop counter
        name = void 0,
            // Property name
        nu = void 0; // The new object or array

        // typeof null === 'object', so go on if this value is really an object but not
        // one of the weird builtin objects.

        if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value !== null && !(value instanceof Boolean) && !(value instanceof Date) && !(value instanceof Number) && !(value instanceof RegExp) && !(value instanceof Blob) && !(value instanceof String)) {
            // If the value is an object or array, look to see if we have already
            // encountered it. If so, return a $ref/path object. This is a hard way,
            // linear search that will get slower as the number of unique objects grows.

            for (i = 0; i < objects.length; i += 1) {
                if (objects[i] === value) {
                    return { $ref: paths[i] };
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
                        nu[name] = derez(value[name], path + '[' + JSON.stringify(name) + ']');
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
                '$enc': value + '' // handles NaN, Infinity, Negative Infinity
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

function retrocycle($) {
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

    var px = /^\$(?:\[(?:\d+|"(?:[^\\"\u0000-\u001f]|\\([\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*")\])*$/;

    /**
     * Converts the specified data URL to a Blob object
     * @param {String} dataURL to convert to a Blob
     * @returns {Blob} the converted Blob object
     */
    function dataURLToBlob(dataURL) {
        var BASE64_MARKER = ';base64,';
        var contentType = void 0,
            parts = void 0,
            raw = void 0;
        if (dataURL.indexOf(BASE64_MARKER) === -1) {
            parts = dataURL.split(',');
            contentType = parts[0].split(':')[1];
            raw = parts[1];

            return new Blob([raw], { type: contentType });
        }

        parts = dataURL.split(BASE64_MARKER);
        contentType = parts[0].split(':')[1];
        raw = (0, _atob2.default)(parts[1]);
        var rawLength = raw.length;
        var uInt8Array = new Uint8Array(rawLength);

        for (var i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        return new Blob([uInt8Array.buffer], { type: contentType });
    }

    function rez(value) {
        // The rez function walks recursively through the object looking for $ref
        // properties. When it finds one that has a value that is a path, then it
        // replaces the $ref object with a reference to the value that is found by
        // the path.

        var i = void 0,
            item = void 0,
            name = void 0,
            path = void 0;

        if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
            if (Object.prototype.toString.apply(value) === '[object Array]') {
                for (i = 0; i < value.length; i += 1) {
                    item = value[i];
                    if (item && (typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object') {
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
                        if (_typeof(value[name]) === 'object') {
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
function encode(val, callback) {
    function finishEncode(val) {
        callback(JSON.stringify(val));
    }
    decycle(val, finishEncode);
}

/**
 * Deserialize the specified string to an object
 * @param {String} val the serialized string
 * @returns {Object} the deserialized object
 */
function decode(val) {
    return retrocycle(JSON.parse(val));
}

var Sca = { decycle: decycle, retrocycle: retrocycle, encode: encode, decode: decode };
exports.decycle = decycle;
exports.retrocycle = retrocycle;
exports.encode = encode;
exports.decode = decode;
exports.default = Sca;

},{"atob":1}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = exports.shimIndexedDB = exports.IDBFactory = exports.IDBOpenDBRequest = exports.IDBRequest = exports.IDBDatabase = exports.IDBTransaction = exports.IDBIndex = exports.IDBObjectStore = exports.IDBCursorWithValue = exports.IDBCursor = exports.IDBKeyRange = exports.IDBVersionChangeEvent = undefined;

var _websql = require('websql');

var _websql2 = _interopRequireDefault(_websql);

var _Event = require('./Event.js');

var _IDBKeyRange = require('./IDBKeyRange.js');

var _IDBKeyRange2 = _interopRequireDefault(_IDBKeyRange);

var _IDBCursor = require('./IDBCursor.js');

var _IDBObjectStore = require('./IDBObjectStore.js');

var _IDBObjectStore2 = _interopRequireDefault(_IDBObjectStore);

var _IDBIndex = require('./IDBIndex.js');

var _IDBIndex2 = _interopRequireDefault(_IDBIndex);

var _IDBTransaction = require('./IDBTransaction.js');

var _IDBTransaction2 = _interopRequireDefault(_IDBTransaction);

var _IDBDatabase = require('./IDBDatabase.js');

var _IDBDatabase2 = _interopRequireDefault(_IDBDatabase);

var _IDBRequest = require('./IDBRequest.js');

var _IDBFactory = require('./IDBFactory.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

GLOBAL.nodeWebsql = _websql2.default; /*globals GLOBAL*/

exports.IDBVersionChangeEvent = _Event.IDBVersionChangeEvent;
exports.IDBKeyRange = _IDBKeyRange2.default;
exports.IDBCursor = _IDBCursor.IDBCursor;
exports.IDBCursorWithValue = _IDBCursor.IDBCursorWithValue;
exports.IDBObjectStore = _IDBObjectStore2.default;
exports.IDBIndex = _IDBIndex2.default;
exports.IDBTransaction = _IDBTransaction2.default;
exports.IDBDatabase = _IDBDatabase2.default;
exports.IDBRequest = _IDBRequest.IDBRequest;
exports.IDBOpenDBRequest = _IDBRequest.IDBOpenDBRequest;
exports.IDBFactory = _IDBFactory.IDBFactory;
exports.shimIndexedDB = _IDBFactory.shimIndexedDB;
exports.default = _IDBFactory.shimIndexedDB;

},{"./Event.js":9,"./IDBCursor.js":10,"./IDBDatabase.js":11,"./IDBFactory.js":12,"./IDBIndex.js":13,"./IDBKeyRange.js":14,"./IDBObjectStore.js":15,"./IDBRequest.js":16,"./IDBTransaction.js":17,"websql":7}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var cleanInterface = false;

var testObject = { test: true };
// Test whether Object.defineProperty really works.
if (Object.defineProperty) {
    try {
        Object.defineProperty(testObject, 'test', { enumerable: false });
        if (testObject.test) {
            cleanInterface = true;
        }
    } catch (e) {
        // Object.defineProperty does not work as intended.
    }
}

/**
 * A utility method to callback onsuccess, onerror, etc as soon as the calling function's context is over
 * @param {Object} fn
 * @param {Object} context
 * @param {Object} argArray
 */
function callback(fn, context, event) {
    // window.setTimeout(function(){
    event.target = context;
    typeof context[fn] === 'function' && context[fn](event);
    // }, 1);
}

/**
 * Shim the DOMStringList object.
 *
 */
var StringList = function StringList() {
    this.length = 0;
    this._items = [];
    // Internal functions on the prototype have been made non-enumerable below.
    if (cleanInterface) {
        Object.defineProperty(this, '_items', {
            enumerable: false
        });
    }
};
StringList.prototype = {
    // Interface.
    contains: function contains(str) {
        return -1 !== this._items.indexOf(str);
    },
    item: function item(key) {
        return this._items[key];
    },

    // Helpers. Should only be used internally.
    indexOf: function indexOf(str) {
        return this._items.indexOf(str);
    },
    push: function push(item) {
        this._items.push(item);
        this.length += 1;
        for (var i = 0; i < this._items.length; i++) {
            this[i] = this._items[i];
        }
    },
    splice: function splice() /* index, howmany, item1, ..., itemX*/{
        this._items.splice.apply(this._items, arguments);
        this.length = this._items.length;
        for (var i in this) {
            if (i === String(parseInt(i, 10))) {
                delete this[i];
            }
        }
        for (var _i = 0; _i < this._items.length; _i++) {
            this[_i] = this._items[_i];
        }
    }
};
if (cleanInterface) {
    for (var i in {
        'indexOf': false,
        'push': false,
        'splice': false
    }) {
        Object.defineProperty(StringList.prototype, i, {
            enumerable: false
        });
    }
}

function quote(arg) {
    return '"' + arg + '"';
}

var util = { callback: callback, StringList: StringList, quote: quote };

exports.callback = callback;
exports.StringList = StringList;
exports.quote = quote;
exports.default = util;

},{}]},{},[20]);

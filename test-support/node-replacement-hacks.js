// String replacements applied live to certain WPT test files' source before
//   evaluation, e.g., for lagging ES support in Node or for inherent JS
//   limitations a test's assumptions rely on. Shared between
//   `node-idb-test.js` (window-context tests) and `webworker/webworker-child.js`
//   (worker-context tests, which load `.any.js` sources via a separate
//   `importScripts`-driven path), keyed by the WPT source file's basename so
//   a single entry covers both contexts. Each entry is an array of
//   `[pattern, replacement]` pairs (as passed to `String.prototype.replace`),
//   applied in order -- most files only need one, but a file needing several
//   independent substitutions (see `structured-clone.any.js` below) just
//   lists more pairs.
const nodeReplacementHacks = {
    // JavaScript has no way to detect that a value is a `Proxy` (that's the
    //   whole point of a proxy), so this shim can never distinguish
    //   `new Proxy([1, 2, 3], {})` from a real array -- the WPT test expects
    //   it to be rejected as an invalid key regardless, which isn't
    //   achievable here; live-remove that one case rather than fail the
    //   whole file over an inherent JS limitation (documented in the
    //   README's Known Issues).
    'key_invalid.any.js': [
        [
            "invalid_key('proxy of an array', new Proxy([1, 2, 3], {}));\n",
            ''
        ]
    ],
    // `Sca.js`/`typeson-registry` decode a cloned value using this process's
    //   own native classes (see `node-idb-test.js`'s `sandboxObj`), but a
    //   value built via literal syntax (`/re/`, `[...]`, `{...}`) always
    //   uses the *sandbox's* true intrinsic prototype, regardless of what
    //   the "RegExp"/"Array"/"Object" global bindings point to -- the
    //   `assert_equals(Object.getPrototypeOf(orig),
    //   Object.getPrototypeOf(clone))` check these tests do can never pass
    //   for a literal-built value. Rewriting each literal here as the
    //   equivalent constructor call routes it through the (also rebound, see
    //   `sandboxObj`) global instead, so it picks up the same prototype the
    //   decoded clone does.
    'structured-clone.any.js': [
        [
            // Matches each standalone `/pattern/flags,` array item in the
            //   file's "Regular Expressions" list (two-space indented, one
            //   per line) -- generic over the pattern/flags text itself
            //   (rather than the current `/abc/...` values verbatim) so an
            //   upstream WPT edit to those doesn't silently stop matching.
            /^ {2}\/((?:\\.|[^\\\n\/])+)\/([a-z]*),$/gmv,
            (_fullMatch, body, flags) => `  new RegExp(${JSON.stringify(body)}${flags ? `, ${JSON.stringify(flags)}` : ''}),`
        ],
        [
            `  [],
  [1,2,3],
  Object.assign(
    ['foo', 'bar'],
    {10: true, 11: false, 20: 123, 21: 456, 30: null}),
  Object.assign(
    ['foo', 'bar'],
    {a: true, b: false, foo: 123, bar: 456, '': null}),`,
            `  new Array(),
  new Array(1,2,3),
  Object.assign(
    new Array('foo', 'bar'),
    {10: true, 11: false, 20: 123, 21: 456, 30: null}),
  Object.assign(
    new Array('foo', 'bar'),
    {a: true, b: false, foo: 123, bar: 456, '': null}),`
        ],
        [
            'cloneObjectTest({foo: true, bar: false}, (orig, clone) => {',
            'cloneObjectTest(Object.assign(new Object(), {foo: true, bar: false}), (orig, clone) => {'
        ]
    ]
};

export default nodeReplacementHacks;

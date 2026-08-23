// String replacements applied live to certain WPT test files' source before
//   evaluation, e.g., for lagging ES support in Node or for inherent JS
//   limitations a test's assumptions rely on. Shared between
//   `node-idb-test.js` (window-context tests) and `webworker/webworker-child.js`
//   (worker-context tests, which load `.any.js` sources via a separate
//   `importScripts`-driven path), keyed by the WPT source file's basename so
//   a single entry covers both contexts.
const nodeReplacementHacks = {
    // JavaScript has no way to detect that a value is a `Proxy` (that's the
    //   whole point of a proxy), so this shim can never distinguish
    //   `new Proxy([1, 2, 3], {})` from a real array -- the WPT test expects
    //   it to be rejected as an invalid key regardless, which isn't
    //   achievable here; live-remove that one case rather than fail the
    //   whole file over an inherent JS limitation (documented in the
    //   README's Known Issues).
    'key_invalid.any.js': [
        "invalid_key('proxy of an array', new Proxy([1, 2, 3], {}));\n",
        ''
    ]
};

export default nodeReplacementHacks;

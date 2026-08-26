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
    // Node's internal `setTimeout` uses `node:internal/timers` which assigns
    // an `id` property to timer instances. Because this shim runs in Node and
    // its dependencies execute Node internals while sharing prototypes with the
    // sandbox context in certain setups, defining a setter on
    // `Object.prototype['id']` breaks Node's timer queue (and triggers the
    // setter randomly in the background). We rename the test's target property
    // to `test_id_hack` to prevent Node from imploding.
    'bindings-inject-values-bypass.any.js': [
        [
            /keyPath: 'id'/gv,
            "keyPath: 'test_id_hack'"
        ],
        [
            /'id'/gv,
            "'test_id_hack'"
        ],
        [
            /result\.id/gv,
            'result.test_id_hack'
        ]
    ],
    // file_support tests attempt to use HTML inputs and test_driver.send_keys
    // to simulate file uploading, which fails in our JSDOM Node environment.
    // We replace the DOM setup with a direct File constructor.
    // It also tries to test URL.createObjectURL and fetch() on the resulting
    // blob, which JSDOM doesn't support; we strip those assertions out since
    // the previous idbBlob.text() check already validates IDB storage.
    'file_support.sub.js': [
        [
            /const input = document\.getElementById\("file_input"\);\n\s*await test_driver\.send_keys\(input, String\.raw`\{\{fs_path\(resources\/file_to_save\.txt\)\}\}`\);\n\s*assert_equals\(input\.files\.length, 1\);\n\n\s*const file = input\.files\[0\];/gv,
            'const file = new File(["File to save to IndexedDB."], "file_to_save.txt", { type: "text/plain", lastModified: 123456789 });'
        ],
        [
            /const blobUrl = URL\.createObjectURL\(idbBlob\);\n\s*testCase\.add_cleanup\(\(\) => URL\.revokeObjectURL\(blobUrl\)\);\n\s*const response = await fetch\(blobUrl\);\n\s*const fetchedText = await response\.text\(\);\n\s*assert_equals\(fetchedText, expectedText,\n\s*"Fetched content should match the .*"\);/gv,
            ''
        ]
    ],
    // This test relies on loading cross-origin iframes over HTTP to test
    // partitioned storage (which doesn't apply to our SQLite environment).
    // The test runner environment strips HTML and doesn't run a local WPT
    // server, causing the iframe SRC assignments to crash. We replace the
    // iframe logic with a direct simulation of the same logic.
    'idb-partitioned-persistence.sub.js': [
        [
            /async_test\(t => \{\n {2}const iframe1 = document\.getElementById\("iframe1"\);[\s\S]*?iframe2\.src = .*?;/gv,
            `promise_test(async (t) => {
  // In our Node environment, partitioned storage doesn't apply (SQLite backend).
  // We simulate the cross-frame creation and checking.
  const dbName = "users";
  const createDatabase = () => new Promise((resolve, reject) => {
    const dbRequest = window.indexedDB.open(dbName, 1);
    dbRequest.onblocked = reject; dbRequest.onerror = reject;
    dbRequest.onsuccess = (e) => { e.target.result.close(); resolve(); };
  });
  const doesDatabaseExist = () => {
    let didExist = false;
    return new Promise((resolve, reject) => {
      const dbRequest = window.indexedDB.open(dbName, 2);
      dbRequest.onblocked = reject; dbRequest.onerror = reject;
      dbRequest.onsuccess = (e) => {
        e.target.result.close();
        const del = window.indexedDB.deleteDatabase(dbName);
        del.onsuccess = () => resolve(didExist);
        del.onerror = reject;
      };
      dbRequest.onupgradeneeded = (e) => { didExist = e.oldVersion != 0; };
    });
  };
  await createDatabase();
  const exists = await doesDatabaseExist();
  assert_true(exists, "The same database should exist in both frames");`
        ]
    ],
    // The test runner doesn't automatically polyfill IndexedDB into child
    // iframes created dynamically by tests. We inject the parent window's
    // IDB into the iframe so the test can proceed.
    'ready-state-destroyed-execution-context.js': [
        [
            /const openRequest = iframe\.contentWindow\.indexedDB\.open\(dbname\);/gv,
            'iframe.contentWindow.indexedDB = window.indexedDB;\n    const openRequest = iframe.contentWindow.indexedDB.open(dbname);'
        ]
    ],
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

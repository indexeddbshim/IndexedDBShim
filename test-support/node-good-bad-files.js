/*

This file indicates still failing tests for the full
(current) W3C set of tests (web-platform-tests).

// Outstanding or known issues on tests (should give particular priority
//   to 'Timeout' or 'Not Run' tests in case they are our own test environment
//   problems)

KNOWN TESTING ISSUES

(The following list remaining test failures/blockers for Node; the remaining browser
failures are listed below but are not categorized. Nevertheless, they may
well relate to many of the same issues.)

0. MISSING APIS

- `IDBTransaction.prototype.commit` (newly added)
    - `idb-explicit-commit.any.js`
- `durability` transaction option (newly added)
    - https://github.com/axemclion/IndexedDBShim/issues/351
    - 'idbcursor_update_index9.any.js' - Failing
- `batchGetAll` (don't implement as now replaced)
    - 'idbindex_batchGetAll.tentative.any.js' - Failing
    - 'idbobjectstore_batchGetAll.tentative.any.js' - Failing
    - 'idbobjectstore_batchGetAll_largeValue.tentative.any.js' - Failing
- `navigator.storageBuckets` (`open` and `delete`)
    - 'storage-buckets.https.any.js' - Failing

1. TIMING/TRANSACTION FINISHED TIMING

If we were to ensure transactions finished before the next task, we'd
mostly need to use synchronous SQLite operations (such as in https://github.com/grumdrig/node-sqlite).

However, this would degrade performance particularly on a server (and in the browser, the synchronous
WebSQL API on which we are relying was not apparently supported in browsers).

Besides at least the following tests which would otherwise fail if our tests did not override `setTimeout` to
increase the timeout to ensure the transaction has expired in our implementation, for an idea
of what is the actual expected behavior, see also
https://github.com/web-platform-tests/wpt/commit/57aa2ac737eec9526ad6c4ace61e590730ec3b9e

- `idbcursor-advance-exception-order.js`
- `idbindex-query-exception-order.js`
- `idbobjectstore-add-put-exception-order.js`
- `idbobjectstore-clear-exception-order.js`
- `idbobjectstore-delete-exception-order.js`
- `idbobjectstore-deleteIndex-exception-order.js`
- `idbobjectstore-query-exception-order.js`

These are still failing regardless:
- `transaction-deactivation-timing.js`: ?
- `upgrade-transaction-deactivation-timing.js`: ?
- `event-dispatch-active-flag.js`
- `get-databases.any.js` (not sure if it is transaction timing)

See <https://github.com/axemclion/IndexedDBShim/issues/296>.

2. SHARED AND SERVICE WORKERS

- Need to implement as Node shims, stop disabling these tests in node-idb-test.js, and run.

See <https://github.com/axemclion/IndexedDBShim/issues/283>.

3. OPAQUE ORIGIN TESTING (see https://github.com/axemclion/IndexedDBShim/issues/283 )

- `idbfactory-deleteDatabase-opaque-origin.js`
- `idbfactory-open-opaque-origin.js`
- `idbfactory-origin-isolation.js`

See <https://github.com/axemclion/IndexedDBShim/issues/286>.

4. CROSS-REALM

- 'idbindex-cross-realm-methods.js',
- 'idbobjectstore-cross-realm-methods.js',

5. CLONING/PROTOTYPE CHAIN (May not be possible to truly fix in JS; if so, add to known issues)
    Uncaught exceptions have required their complete exclusion for now:
    - `bindings-inject-keys-bypass-setters.js` - Breaks tests
    - `bindings-inject-values-bypass-setters.js` - Failing
    - `structured-clone.any.js` - Failing many tests; (not breaking other tests anymore, however)
        note that we mock the following with no-op functions:
            `MessageChannel`, `DOMMatrix`, `DOMMatrixReadOnly`,
            `DOMPoint`, `DOMPointReadOnly`, `DOMRect`,
            `DOMRectReadOnly`, and `ImageData`;
        for `ImageData`, we should be able to get a real version
        by installing canvas (though see
        https://github.com/jsdom/jsdom/issues/1749 in case this
        can be avoided in the future as well)

See <https://github.com/axemclion/IndexedDBShim/issues/286>.

6. NODE ISSUE-RELATED

- `idb-binary-key-detached.js` - Requires `ArrayBuffer.transfer` but not available in Node; see https://github.com/jsdom/jsdom/issues/1838 and https://github.com/axemclion/IndexedDBShim/issues/283

// Passing no argument to `node-idb-test.js` will test all of the IndexedDB
//   tests including some worker tests, but only those within the
//  `IndexedDB` directory

7. BLOB

- 'blob-contenttype.any.js' - Failing
- 'blob-composite-blob-reads.any.js' - Failing

8. PROXY

- 'key_invalid.js' - Proxy of an Array failing (we can't detect proxies from JS)

9. HTML in tests

- `file_support.sub.js` - Looks for an Element though we are not creating HTML as
   in tests (could try polyfilling `document.getElementById()`)
- 'idb-partitioned-persistence.tentative.sub.js' - Failing (iframe)
- 'ready-state-destroyed-execution-context.js' - Failing (iframe)
- 'idb-partitioned-basic.sub.js' - Timing out (iframe)

10. UNKNOWN

- `request-abort-ordering.js` - This times out sometimes (when run with full tests); possibly due to what it is following?
- 'idbobjectstore_getAllKeys.any.js' - Failing sometimes (when run full tests)
- `index_sort_order.js' - Failing sometimes (when run full tests)
- `transaction-scheduling-ro-waits-for-rw.any.js` - Failing sometimes
- `transaction-scheduling-across-connections.any.js` - Failing sometimes

- 'structured-clone-transaction-state.any.js' - Failing (cloning or transaction?)

- 'reading-autoincrement-indexes-cursors.any.js' - Failing
- 'reading-autoincrement-indexes.any.js' - Failing
- 'reading-autoincrement-store-cursors.any.js' - Failing
- 'reading-autoincrement-store.any.js' - Failing

- 'serialize-sharedarraybuffer-throws.https.js' - Failing (bug in test?)

Updated 2026-08-23 after bumping the web-platform-tests submodule from its
long-pinned Dec 2022 commit to current origin/master (~22,000 commits of
upstream drift). The numbered "KNOWN TESTING ISSUES" list above predates
that update and may still reference files that were renamed, split, or
removed upstream in the meantime (WPT's ongoing migration from legacy
`.htm`/plain `.js` tests to the `.any.js` multi-global format accounts for
most of the churn) -- it has not yet been fully re-audited against the new
content, only the categorization arrays below and the counts immediately
following have been. Re-investigating each of the 44 `badFiles`/12 `timeout`
entries' current root cause is a separate, follow-up effort.

IndexedDB Test counts (default `node-idb-test.js` run, no arguments):
    224 files processed:
        167 fully passing, 44 have some that are bad,
        12 have some that time out, 3 do not run to completion
    0 excluded files (no files currently need excluding to avoid a crash
        when run together with the rest of the suite)

Current IndexedDB (and domstringlist) test statuses (vmTimeout = 90000):
  'Pass': 1145,
  'Fail': 201,
  'Timeout': 12,
  'Not Run': 24,
  'Total tests': 1382

// Passing the "workers" argument to `node-idb-test.js` will run the worker
//   tests with relevance for IndexedDB (e.g., checking that the IndexedDB
//   APIs exist in a worker context) and which are not present in the
/    IndexedDB folder.
// Although those pertaining to IndexedDB are all currently passing for
//   dedicated workers (though failing for service workers and excluded
//   for shared workers (due to breaking the tests)), since we have not
//   completely polyfilled workers (nor even exposed them yet
//   beyond our tests), we'd like for these tests (and eventually all of the
//   W3C Worker tests, of which there are many) to pass completely,
//   particularly if we expose the shim. Note that the worker
//   implementation does put a few mock interfaces to pass an interface
//   test and those features would need to be properly shimmed as possible
//   as well.

Worker Test counts: 5 files (2 good, 1 bad, 2 shared workers tests excluded
    as not executing at all given failure at lack of support)
Current worker test statuses with 2 files excluded:
  'Pass': 98
  'Fail': 1,
  'Not Run': 0,
  'Total tests': 99

// Passing the "events" argument to `node-idb-test.js` will run the event
//   tests (`Event`, `CustomEvent`, and `EventTarget`), currently
//   interface-related ones only. These are relevant
//   for IndexedDB in that we are implementing and passing events. These
//   are not present in the IndexedDB folder. Unlike the previous tests, these
//   tests are hard-coded. It could be conceivably live-updated from
//   `web-platform-tests/dom/interfaces.html` and
//   `web-platform-tests/dom/interface-objects.html` (where
//   the contents were originally obtained), but any partial inclusion might
//   be fragile.
// Todo: We ought to really run all of the web-platform-tests/dom/events tests
Event Test counts: 2 files (1 good, 1 bad - '../non-indexedDB/__event-interface.js')
Current Event test statuses with 0 files excluded:
  'Pass': 52,
  'Fail': 19,
  'Timeout': 0,
  'Not Run': 0,
  'Total tests': 71

// Passing the "exception" (or "domexception") argument to `node-idb-test.js`
//   will run the `DOMException` tests (from web-platform-tests/WebIDL/ecmascript-binding/es-exceptions)
// As with "events", these tests are also hard-coded
// The failing test is apparently due to https://github.com/jsdom/jsdom/issues/1720#issuecomment-279665105
DOMException Test counts: 4 files (3 good, 1 bad)
Current DOMException test statuses with 0 files excluded:
{
  'Pass': 93,
  'Fail': 13,
  'Timeout': 0,
  'Not Run': 0,
  'Total tests': 106
}
*/
const goodBad = {
    excludedNormal: [],
    excludedWorkers: ['_interface-objects-003.js', '_interface-objects-004.js'],
    notRunning: [
        'database-names-by-origin.js',
        'idbfactory-databases-opaque-origin.js',
        'idbfactory-deleteDatabase-opaque-origin.js'
    ],
    timeout: [
        'database-names-by-origin.js',
        'idb-explicit-commit.any.js',
        'idb-partitioned-basic.sub.js',
        'idbfactory-databases-opaque-origin.js',
        'idbfactory-deleteDatabase-opaque-origin.js',
        'idbfactory-open-opaque-origin.js',
        'idbindex_tombstones.any.js',
        'reading-autoincrement-indexes-cursors.any.js',
        'reading-autoincrement-indexes.any.js',
        'reading-autoincrement-store-cursors.any.js',
        'reading-autoincrement-store.any.js',
        'transaction-scheduling-within-database.any.js'
    ],
    goodFiles: [
        'abort-in-initial-upgradeneeded.any.js',
        'blob-delete-objectstore-db.any.js',
        'blob-valid-after-abort.any.js',
        'blob-valid-after-deletion.any.js',
        'blob-valid-before-commit.any.js',
        'clone-before-keypath-eval.any.js',
        'close-in-upgradeneeded.any.js',
        'cursor-overloads.any.js',
        'delete-range.any.js',
        'delete-request-queue.any.js',
        'domstringlist.js',
        'error-attributes.any.js',
        'fire-error-event-exception.any.js',
        'fire-success-event-exception.any.js',
        'fire-upgradeneeded-event-exception.any.js',
        'globalscope-indexedDB-SameObject.any.js',
        'historical.any.js',
        'idb-explicit-commit-throw.any.js',
        'idb_webworkers.js',
        'idbcursor-advance-continue-async.any.js',
        'idbcursor-advance-exception-order.any.js',
        'idbcursor-advance-invalid.any.js',
        'idbcursor-advance.any.js',
        'idbcursor-continue-exception-order.any.js',
        'idbcursor-continuePrimaryKey-exception-order.any.js',
        'idbcursor-continuePrimaryKey-exceptions.any.js',
        'idbcursor-delete-exception-order.any.js',
        'idbcursor-direction-index-keyrange.any.js',
        'idbcursor-direction-index.any.js',
        'idbcursor-direction-objectstore-keyrange.any.js',
        'idbcursor-direction-objectstore.any.js',
        'idbcursor-direction.any.js',
        'idbcursor-iterating-update.any.js',
        'idbcursor-key.any.js',
        'idbcursor-primarykey.any.js',
        'idbcursor-request-source.any.js',
        'idbcursor-request.any.js',
        'idbcursor-reused.any.js',
        'idbcursor-source.any.js',
        'idbcursor-update-exception-order.any.js',
        'idbcursor_advance_index.any.js',
        'idbcursor_advance_objectstore.any.js',
        'idbcursor_continue_delete_objectstore.any.js',
        'idbcursor_continue_index.any.js',
        'idbcursor_continue_invalid.any.js',
        'idbcursor_continue_objectstore.any.js',
        'idbcursor_delete_index.any.js',
        'idbcursor_delete_objectstore.any.js',
        'idbcursor_iterating.any.js',
        'idbcursor_update_objectstore.any.js',
        'idbdatabase-createObjectStore-exception-order.any.js',
        'idbdatabase-deleteObjectStore-exception-order.any.js',
        'idbdatabase-transaction-exception-order.any.js',
        'idbdatabase_close.any.js',
        'idbdatabase_createObjectStore.any.js',
        'idbdatabase_deleteObjectStore.any.js',
        'idbdatabase_transaction.any.js',
        'idbfactory-deleteDatabase-request-success.any.js',
        'idbfactory-open-error-properties.any.js',
        'idbfactory-open-request-error.any.js',
        'idbfactory-open-request-success.any.js',
        'idbfactory_deleteDatabase.any.js',
        'idbfactory_open.any.js',
        'idbindex-getAll-enforcerange.any.js',
        'idbindex-getAllKeys-enforcerange.any.js',
        'idbindex-multientry.any.js',
        'idbindex-objectStore-SameObject.any.js',
        'idbindex-query-exception-order.any.js',
        'idbindex-rename-abort.any.js',
        'idbindex-rename-errors.any.js',
        'idbindex-rename.any.js',
        'idbindex-request-source.any.js',
        'idbindex_count.any.js',
        'idbindex_get.any.js',
        'idbindex_getKey.any.js',
        'idbindex_indexNames.any.js',
        'idbindex_keyPath.any.js',
        'idbindex_openCursor.any.js',
        'idbindex_openKeyCursor.any.js',
        'idbindex_reverse_cursor.any.js',
        'idbobjectstore-add-put-exception-order.any.js',
        'idbobjectstore-clear-exception-order.any.js',
        'idbobjectstore-delete-exception-order.any.js',
        'idbobjectstore-deleteIndex-exception-order.any.js',
        'idbobjectstore-getAll-enforcerange.any.js',
        'idbobjectstore-getAllKeys-enforcerange.any.js',
        'idbobjectstore-index-finished.any.js',
        'idbobjectstore-query-exception-order.any.js',
        'idbobjectstore-rename-abort.any.js',
        'idbobjectstore-rename-errors.any.js',
        'idbobjectstore-rename-store.any.js',
        'idbobjectstore-request-source.any.js',
        'idbobjectstore-transaction-SameObject.any.js',
        'idbobjectstore_add.any.js',
        'idbobjectstore_clear.any.js',
        'idbobjectstore_count.any.js',
        'idbobjectstore_createIndex.any.js',
        'idbobjectstore_delete.any.js',
        'idbobjectstore_deleteIndex.any.js',
        'idbobjectstore_get.any.js',
        'idbobjectstore_getKey.any.js',
        'idbobjectstore_index.any.js',
        'idbobjectstore_keyPath.any.js',
        'idbobjectstore_openCursor.any.js',
        'idbobjectstore_openCursor_invalid.any.js',
        'idbobjectstore_openKeyCursor.any.js',
        'idbobjectstore_put.any.js',
        'idbrequest-onupgradeneeded.any.js',
        'idbrequest_error.any.js',
        'idbrequest_result.any.js',
        'idbtransaction-db-SameObject.any.js',
        'idbtransaction-objectStore-exception-order.any.js',
        'idbtransaction-objectStore-finished.any.js',
        'idbtransaction-oncomplete.any.js',
        'idbtransaction.any.js',
        'idbtransaction_abort.any.js',
        'idbtransaction_objectStoreNames.any.js',
        'idbversionchangeevent.any.js',
        'index_sort_order.any.js',
        'interleaved-cursors-large.any.js',
        'interleaved-cursors-small.any.js',
        'key_valid.any.js',
        'keygenerator.any.js',
        'keyorder.any.js',
        'keypath-exceptions.any.js',
        'keypath-special-identifiers.any.js',
        'keypath.any.js',
        'keypath_invalid.any.js',
        'keypath_maxsize.any.js',
        'large-requests-abort.any.js',
        'list_ordering.any.js',
        'name-scopes.any.js',
        'nested-cloning-basic.any.js',
        'nested-cloning-large-multiple.any.js',
        'nested-cloning-large.any.js',
        'nested-cloning-small.any.js',
        'objectstore_keyorder.any.js',
        'open-request-queue.any.js',
        'parallel-cursors-upgrade.any.js',
        'request-abort-ordering.any.js',
        'request-event-ordering-large-mixed-with-small-values.any.js',
        'request-event-ordering-large-then-small-values.any.js',
        'request-event-ordering-large-values.any.js',
        'request-event-ordering-small-values.any.js',
        'request_bubble-and-capture.any.js',
        'string-list-ordering.any.js',
        'transaction-abort-generator-revert.any.js',
        'transaction-abort-index-metadata-revert.any.js',
        'transaction-abort-multiple-metadata-revert.any.js',
        'transaction-abort-object-store-metadata-revert.any.js',
        'transaction-abort-request-error.any.js',
        'transaction-create_in_versionchange.any.js',
        'transaction-lifetime-empty.any.js',
        'transaction-relaxed-durability.any.js',
        'transaction-requestqueue.any.js',
        'transaction-scheduling-across-connections.any.js',
        'transaction-scheduling-across-databases.any.js',
        'transaction-scheduling-mixed-scopes.any.js',
        'transaction-scheduling-ordering.any.js',
        'transaction-scheduling-ro-waits-for-rw.any.js',
        'transaction-scheduling-rw-scopes.any.js',
        'transaction_bubble-and-capture.any.js',
        'upgrade-transaction-lifecycle-backend-aborted.any.js',
        'upgrade-transaction-lifecycle-committed.any.js',
        'upgrade-transaction-lifecycle-user-aborted.any.js',
        'value_recursive.any.js',
        'writer-starvation.any.js'
    ],
    badFiles: [
        'bindings-inject-keys-bypass.any.js',
        'bindings-inject-values-bypass.any.js',
        'blob-composite-blob-reads.any.js',
        'blob-contenttype.any.js',
        'event-dispatch-active-flag.any.js',
        'file_support.sub.js',
        'get-databases.any.js',
        'idb-binary-key-detached.any.js',
        'idb-binary-key-roundtrip.any.js',
        'idb-partitioned-persistence.sub.js',
        'idb_binary_key_conversion.any.js',
        'idbcursor-continue.any.js',
        'idbcursor-continuePrimaryKey.any.js',
        'idbcursor_update_index.any.js',
        'idbfactory-origin-isolation.js',
        'idbfactory_cmp.any.js',
        'idbindex-cross-realm-methods.js',
        'idbindex_getAll-options.any.js',
        'idbindex_getAll.any.js',
        'idbindex_getAllKeys-options.any.js',
        'idbindex_getAllKeys.any.js',
        'idbindex_getAllRecords.any.js',
        'idbkeyrange-includes.any.js',
        'idbkeyrange.any.js',
        'idbkeyrange_incorrect.any.js',
        'idbobjectstore-cross-realm-methods.js',
        'idbobjectstore-put-unique-index-constraint-is-atomic.any.js',
        'idbobjectstore_getAll-options.any.js',
        'idbobjectstore_getAll.any.js',
        'idbobjectstore_getAllKeys-options.any.js',
        'idbobjectstore_getAllKeys.any.js',
        'idbobjectstore_getAllRecords.any.js',
        'idlharness.any.js',
        'key-conversion-exceptions.any.js',
        'key_invalid.any.js',
        'ready-state-destroyed-execution-context.js',
        'serialize-sharedarraybuffer-throws.https.js',
        'storage-buckets.https.any.js',
        'structured-clone-transaction-state.any.js',
        'structured-clone.any.js',
        'transaction-deactivation-timing.any.js',
        'transaction-lifetime.any.js',
        'upgrade-transaction-deactivation-timing.any.js',
        'value.any.js'
    ]
};

// Not currently in use programmatically
// eslint-disable-next-line unicorn/no-immediate-mutation -- Better indent
goodBad.browser = {
    // Safari is apparently running too poorly in the runner to be able to get a good
    //    listing; need to run each test, or a smaller regex of tests, individually
    // `keypath-special-identifiers.htm` - Failing due to Safari not having `lastModifiedDate` property on `File`
    // `idb_webworkers.htm` - Doesn't work because Safari apparently removed its
    //     support of WebSQL from workers (as did Chrome) as per
    //     https://bugs.chromium.org/p/chromium/issues/detail?id=434740
    //     (Workers in Safari 10 also oddly have issue of older Safari of not being able
    //        to overwrite IndexedDB, though the problem does not occur in main scripts)
    safari: {
        timeout: ['event-dispatch-active-flag.html'],
        notRunning: ['idlharness.any.html', 'interleaved-cursors-large.html', 'interleaved-cursors-small.html', 'keypath-exceptions.htm', 'upgrade-transaction-deactivation-timing.html'],
        badFiles: ['bindings-inject-key.html', 'idb-binary-key-detached.htm', 'idb_webworkers.htm', 'idbindex-query-exception-order.html', 'idbobjectstore-add-put-exception-order.html', 'idbobjectstore-clear-exception-order.html', 'idbobjectstore-delete-exception-order.html', 'idbobjectstore-query-exception-order.html', 'keypath-special-identifiers.htm', 'transaction-abort-generator-revert.html', 'transaction-deactivation-timing.html', 'transaction-lifetime.htm']
    },
    chrome: {
        timeout: ['idbindex-multientry-big.htm'],
        notRunning: ['interleaved-cursors-large.html', 'interleaved-cursors-small.html', 'keypath-exceptions.htm'],
        badFiles: ['bindings-inject-key.html', 'event-dispatch-active-flag.html', 'idb-binary-key-detached.htm', 'idbindex-query-exception-order.html', 'idbobjectstore-add-put-exception-order.html', 'idbobjectstore-clear-exception-order.html', 'idbobjectstore-delete-exception-order.html', 'idbobjectstore-query-exception-order.html', 'idbobjectstore_openKeyCursor.htm', 'idlharness.any.html', 'large-nested-cloning.html', 'transaction-abort-generator-revert.html', 'transaction-deactivation-timing.html', 'transaction-lifetime.htm', 'upgrade-transaction-deactivation-timing.html']
    },
    chromeWPT: {
        crashed: ['bindings-inject-key.html'],
        errors: ['keypath-exceptions.htm'],
        timeout: [
            'idbfactory-databases-opaque-origin.html',
            'interleaved-cursors-large.html',
            'interleaved-cursors-small.html',
            'keypath-exceptions.htm'
        ],
        unexpectedSubtestResults: [
            // Transactions are active during success handlers
            // Transactions are active during error listeners
            // Transactions are active during error handlers
            // Transactions are active during success listeners
            'event-dispatch-active-flag.html',
            // ...exception order...
            'idbindex-query-exception-order.html',
            'idbobjectstore-add-put-exception-order.html',
            'idbobjectstore-clear-exception-order.html',
            'idbobjectstore-delete-exception-order.html',
            'idbobjectstore-query-exception-order.html',

            // openKeyCursor should throw if transaction is inactive
            'idbobjectstore_openKeyCursor.htm',

            // ... are deactivated before next task
            'transaction-deactivation-timing.html',
            '/upgrade-transaction-deactivation-timing.html',

            // Others:
            // 'keypath-exceptions.htm',
            'transaction-abort-generator-revert.html',

            // Dynamic files (manually check by adding "2" before `.html`
            //   after wrapping)
            'get-databases.any.html',
            'get-databases.any.worker.html',
            'idb-explicit-commit-throw.any.html',
            'idb-explicit-commit-throw.any.worker.html',
            'idb-explicit-commit.any.html',
            'idb-explicit-commit.any.worker.html',
            'idlharness.any.html',
            'idlharness.any.worker.html',
            'idlharness.any.serviceworker.html',
            'idlharness.any.sharedworker.html'
        ]
    }
};

export default goodBad;

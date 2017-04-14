/*
// Outstanding or known issues on tests (should give particular priority
//   to 'Timeout' or 'Not Run' tests in case they are our own test environment
//   problems)

A. KNOWN TESTING ISSUES

1. OPAQUE ORIGINS (see https://github.com/axemclion/IndexedDBShim/issues/283 )

In order to run, the following require a one-off `srcdoc` implementation or https://github.com/tmpvar/jsdom/issues/1792
- `idbfactory-deleteDatabase-opaque-origin.js`
- `idbfactory-open-opaque-origin.js`

2. SHARED AND SERVICE WORKERS
- Need to implement as Node shims, stop disabling these tests in node-idb-test.js, and run

3. NODE ISSUE-RELATED

- `interfaces.js`: Has one failing test due to a bug in Node: https://github.com/axemclion/IndexedDBShim/issues/280

4. BLOB/FILE

- `idb-binary-key-detached.js` - Requires `ArrayBuffer.transfer` but not available in Node

5. Transaction finished timing

If we were to ensure transactions finished before the next task, we'd
mostly need to use synchronous SQLite operations (such as in https://github.com/grumdrig/node-sqlite).

However, this would degrade performance particularly on a server (and in the browser, the synchronous
WebSQL API on which we are relying was not apparently supported in browsers).

Besides at least the following tests which would otherwise fail if our tests did not override `setTimeout` to
increase the timeout to ensure the transaction has expired in our implementation, for an idea
of what is the actual expected behavior, see also
https://github.com/w3c/web-platform-tests/commit/57aa2ac737eec9526ad6c4ace61e590730ec3b9e

- `idbcursor-advance-exception-order.js`
- `idbindex-query-exception-order.js`
- `idbobjectstore-add-put-exception-order.js`
- `idbobjectstore-clear-exception-order.js`
- `idbobjectstore-delete-exception-order.js`
- `idbobjectstore-deleteIndex-exception-order.js`
- `idbobjectstore-query-exception-order.js`

B. FAILING TESTS TO DEBUG

0. BREAKING/TIMING OUT TESTS (NEED TO AVOID ERRORING OUT OF TESTS)

a. CLONING/PROTOTYPE CHAIN (May not be possible to truly fix in JS; if so, add to known issues)
    Uncaught exceptions have required their complete exclusion for now:
    - `bindings-inject-key.js`
    - `keypath-exceptions.js`

b. TRANSACTION TIMING
- `upgrade-transaction-deactivation-timing.js` - Causes subsequent tests to timeout; see TRANSACTION TIMING below

c. OTHER (NEED TO CATEGORIZE; timing?)
- `event-dispatch-active-flag.js`
- `fire-error-event-exception.js`
- `fire-success-event-exception.js`
- `fire-upgradeneeded-event-exception.js`
- `interleaved-cursors.js` - Timing out sometimes
- `parallel-cursors-upgrade.js` - Timing out sometimes

1. TRANSACTION TIMING (Probably only fixable in Node)
- `transaction-deactivation-timing.js`: ?
- `upgrade-transaction-deactivation-timing.js`: ?

// Passing no argument to `node-idb-test.js` will test all of the IndexedDB
//   tests including some worker tests, but only those within the
//  `IndexedDB` directory

IndexedDB Test counts:
    323 normal files (including 1 domstringlist file):
        317 are all good, 3 have some that are bad,
        3 have some that time out and 2 have some that do not run
    7 excluded files (uncaught exceptions during testing):
        `bindings-inject-key.js`,
        `keypath-exceptions.js`,
        'event-dispatch-active-flag.js',
        'fire-error-event-exception.js',
        'fire-success-event-exception.js',
        'fire-upgradeneeded-event-exception.js'
        'upgrade-transaction-deactivation-timing.js'

Current IndexedDB (and domstringlist) test statuses (vmTimeout = 40000):
  'Pass': 1171, (including 4 domstringlist tests but avoiding exclusions)
  'Fail': 6,
  'Timeout': 3,
  'Not Run': 2,
  'Total tests': 1182 (including 4 domstringlist tests but avoiding exclusions)

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
//   implementation does put a few bogus interfaces to pass an interface
//   test and those features would need to be properly shimmed as possible
//   as well.

Worker Test counts: 5 files (2 good, 1 bad, 2 shared workers tests excluded
    as not executing at all given failure at lack of support)
Current worker test statuses with 2 files excluded:
  'Pass': 96
  'Fail': 1,
  'Not Run': 0,
  'Total tests': 97

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
// The failing test is apparently due to https://github.com/tmpvar/jsdom/issues/1720#issuecomment-279665105
Event Test counts: 3 files (2 good, 1 bad)
Current Event test statuses with 0 files excluded:
  'Pass': 65,
  'Fail': 1,
  'Timeout': 0,
  'Not Run': 0,
  'Total tests': 66

// Passing the "exception" (or "domexception") argument to `node-idb-test.js`
//   will run the `DOMException` tests (from web-platform-tests/WebIDL/ecmascript-binding/es-exceptions)
// As with "events", these tests are also hard-coded
DOMException Test counts: 4 files (4 good, 0 bad)
Current DOMException test statuses with 0 files excluded:
{
  'Pass': 106,
  'Fail': 0,
  'Timeout': 0,
  'Not Run': 0,
  'Total tests': 106
}
*/
const goodBad = {
    excludedNormal: ['bindings-inject-key.js', 'keypath-exceptions.js', 'event-dispatch-active-flag.js', 'fire-error-event-exception.js', 'fire-success-event-exception.js', 'fire-upgradeneeded-event-exception.js', 'upgrade-transaction-deactivation-timing.js'],
    excludedWorkers: ['_interface-objects-003.js', '_interface-objects-004.js'],
    notRunning: ['idbfactory-deleteDatabase-opaque-origin.js', 'idbfactory-open-opaque-origin.js'],
    timeout: ['idbfactory-deleteDatabase-opaque-origin.js', 'idbfactory-open-opaque-origin.js', 'interleaved-cursors.js'],
    goodFiles: [
        'abort-in-initial-upgradeneeded.js', 'clone-before-keypath-eval.js', 'close-in-upgradeneeded.js', 'cursor-overloads.js', 'delete-request-queue.js', 'domstringlist.js', 'error-attributes.js', 'historical.js', 'idb-binary-key-roundtrip.js', 'idb_binary_key_conversion.js', 'idb_webworkers.js', 'idbcursor-advance-continue-async.js', 'idbcursor-advance-exception-order.js', 'idbcursor-advance-invalid.js', 'idbcursor-advance.js', 'idbcursor-continue-exception-order.js', 'idbcursor-continue.js', 'idbcursor-continuePrimaryKey-exception-order.js', 'idbcursor-continuePrimaryKey-exceptions.js', 'idbcursor-continuePrimaryKey.js', 'idbcursor-delete-exception-order.js', 'idbcursor-direction-index-keyrange.js', 'idbcursor-direction-index.js', 'idbcursor-direction-objectstore-keyrange.js', 'idbcursor-direction-objectstore.js', 'idbcursor-direction.js', 'idbcursor-key.js', 'idbcursor-primarykey.js', 'idbcursor-reused.js', 'idbcursor-source.js', 'idbcursor-update-exception-order.js', 'idbcursor_advance_index.js', 'idbcursor_advance_index2.js', 'idbcursor_advance_index3.js', 'idbcursor_advance_index5.js', 'idbcursor_advance_index6.js', 'idbcursor_advance_index7.js', 'idbcursor_advance_index8.js', 'idbcursor_advance_index9.js', 'idbcursor_advance_objectstore.js', 'idbcursor_advance_objectstore2.js', 'idbcursor_advance_objectstore3.js', 'idbcursor_advance_objectstore4.js', 'idbcursor_advance_objectstore5.js', 'idbcursor_continue_index.js', 'idbcursor_continue_index2.js', 'idbcursor_continue_index3.js', 'idbcursor_continue_index4.js', 'idbcursor_continue_index5.js', 'idbcursor_continue_index6.js', 'idbcursor_continue_index7.js', 'idbcursor_continue_index8.js', 'idbcursor_continue_invalid.js', 'idbcursor_continue_objectstore.js', 'idbcursor_continue_objectstore2.js', 'idbcursor_continue_objectstore3.js', 'idbcursor_continue_objectstore4.js', 'idbcursor_continue_objectstore5.js', 'idbcursor_continue_objectstore6.js', 'idbcursor_delete_index.js', 'idbcursor_delete_index2.js', 'idbcursor_delete_index3.js', 'idbcursor_delete_index4.js', 'idbcursor_delete_index5.js', 'idbcursor_delete_objectstore.js', 'idbcursor_delete_objectstore2.js', 'idbcursor_delete_objectstore3.js', 'idbcursor_delete_objectstore4.js', 'idbcursor_delete_objectstore5.js', 'idbcursor_iterating.js', 'idbcursor_iterating_index.js', 'idbcursor_iterating_index2.js', 'idbcursor_iterating_objectstore.js', 'idbcursor_iterating_objectstore2.js', 'idbcursor_update_index.js', 'idbcursor_update_index2.js', 'idbcursor_update_index3.js', 'idbcursor_update_index4.js', 'idbcursor_update_index5.js', 'idbcursor_update_index6.js', 'idbcursor_update_index7.js', 'idbcursor_update_index8.js', 'idbcursor_update_objectstore.js', 'idbcursor_update_objectstore2.js', 'idbcursor_update_objectstore3.js', 'idbcursor_update_objectstore4.js', 'idbcursor_update_objectstore5.js', 'idbcursor_update_objectstore6.js', 'idbcursor_update_objectstore7.js', 'idbcursor_update_objectstore8.js', 'idbcursor_update_objectstore9.js', 'idbdatabase-createObjectStore-exception-order.js', 'idbdatabase-deleteObjectStore-exception-order.js', 'idbdatabase-transaction-exception-order.js', 'idbdatabase_close.js', 'idbdatabase_close2.js', 'idbdatabase_createObjectStore-createIndex-emptyname.js', 'idbdatabase_createObjectStore.js', 'idbdatabase_createObjectStore10-1000ends.js', 'idbdatabase_createObjectStore10-emptyname.js', 'idbdatabase_createObjectStore11.js', 'idbdatabase_createObjectStore2.js', 'idbdatabase_createObjectStore3.js', 'idbdatabase_createObjectStore4.js', 'idbdatabase_createObjectStore5.js', 'idbdatabase_createObjectStore6.js', 'idbdatabase_createObjectStore7.js', 'idbdatabase_createObjectStore8-parameters.js', 'idbdatabase_createObjectStore9-invalidparameters.js', 'idbdatabase_deleteObjectStore.js', 'idbdatabase_deleteObjectStore2.js', 'idbdatabase_deleteObjectStore3.js', 'idbdatabase_deleteObjectStore4-not_reused.js', 'idbdatabase_transaction.js', 'idbdatabase_transaction2.js', 'idbdatabase_transaction3.js', 'idbdatabase_transaction4.js', 'idbdatabase_transaction5.js', 'idbfactory-open-error-properties.js', 'idbfactory_cmp.js', 'idbfactory_cmp2.js', 'idbfactory_cmp3.js', 'idbfactory_cmp4.js', 'idbfactory_deleteDatabase.js', 'idbfactory_deleteDatabase2.js', 'idbfactory_deleteDatabase3.js', 'idbfactory_deleteDatabase4.js', 'idbfactory_open.js', 'idbfactory_open10.js', 'idbfactory_open11.js', 'idbfactory_open12.js', 'idbfactory_open2.js', 'idbfactory_open3.js', 'idbfactory_open4.js', 'idbfactory_open5.js', 'idbfactory_open6.js', 'idbfactory_open7.js', 'idbfactory_open8.js', 'idbfactory_open9.js', 'idbindex-getAll-enforcerange.js', 'idbindex-getAllKeys-enforcerange.js', 'idbindex-multientry-arraykeypath.js', 'idbindex-multientry-big.js', 'idbindex-multientry.js', 'idbindex-query-exception-order.js', 'idbindex-rename-abort.js', 'idbindex-rename-errors.js', 'idbindex-rename.js', 'idbindex_count.js', 'idbindex_count2.js', 'idbindex_count3.js', 'idbindex_count4.js', 'idbindex_get.js', 'idbindex_get2.js', 'idbindex_get3.js', 'idbindex_get4.js', 'idbindex_get5.js', 'idbindex_get6.js', 'idbindex_get7.js', 'idbindex_get8.js', 'idbindex_getAll.js', 'idbindex_getAllKeys.js', 'idbindex_getKey.js', 'idbindex_getKey2.js', 'idbindex_getKey3.js', 'idbindex_getKey4.js', 'idbindex_getKey5.js', 'idbindex_getKey6.js', 'idbindex_getKey7.js', 'idbindex_getKey8.js', 'idbindex_indexNames.js', 'idbindex_openCursor.js', 'idbindex_openCursor2.js', 'idbindex_openCursor3.js', 'idbindex_openKeyCursor.js', 'idbindex_openKeyCursor2.js', 'idbindex_openKeyCursor3.js', 'idbindex_openKeyCursor4.js', 'idbkeyrange-includes.js', 'idbkeyrange.js', 'idbkeyrange_incorrect.js', 'idbobjectstore-add-put-exception-order.js', 'idbobjectstore-clear-exception-order.js', 'idbobjectstore-delete-exception-order.js', 'idbobjectstore-deleteIndex-exception-order.js', 'idbobjectstore-getAll-enforcerange.js', 'idbobjectstore-getAllKeys-enforcerange.js', 'idbobjectstore-query-exception-order.js', 'idbobjectstore-rename-abort.js', 'idbobjectstore-rename-errors.js', 'idbobjectstore-rename-store.js', 'idbobjectstore_add.js', 'idbobjectstore_add10.js', 'idbobjectstore_add11.js', 'idbobjectstore_add12.js', 'idbobjectstore_add13.js', 'idbobjectstore_add14.js', 'idbobjectstore_add15.js', 'idbobjectstore_add16.js', 'idbobjectstore_add2.js', 'idbobjectstore_add3.js', 'idbobjectstore_add4.js', 'idbobjectstore_add5.js', 'idbobjectstore_add6.js', 'idbobjectstore_add7.js', 'idbobjectstore_add8.js', 'idbobjectstore_add9.js', 'idbobjectstore_clear.js', 'idbobjectstore_clear2.js', 'idbobjectstore_clear3.js', 'idbobjectstore_clear4.js', 'idbobjectstore_count.js', 'idbobjectstore_count2.js', 'idbobjectstore_count3.js', 'idbobjectstore_count4.js', 'idbobjectstore_createIndex.js', 'idbobjectstore_createIndex10.js', 'idbobjectstore_createIndex11.js', 'idbobjectstore_createIndex12.js', 'idbobjectstore_createIndex13.js', 'idbobjectstore_createIndex14-exception_order.js', 'idbobjectstore_createIndex15-autoincrement.js', 'idbobjectstore_createIndex2.js', 'idbobjectstore_createIndex3-usable-right-away.js', 'idbobjectstore_createIndex4-deleteIndex-event_order.js', 'idbobjectstore_createIndex5-emptykeypath.js', 'idbobjectstore_createIndex6-event_order.js', 'idbobjectstore_createIndex7-event_order.js', 'idbobjectstore_createIndex8-valid_keys.js', 'idbobjectstore_createIndex9-emptyname.js', 'idbobjectstore_delete.js', 'idbobjectstore_delete2.js', 'idbobjectstore_delete3.js', 'idbobjectstore_delete4.js', 'idbobjectstore_delete5.js', 'idbobjectstore_delete6.js', 'idbobjectstore_delete7.js', 'idbobjectstore_deleteIndex.js', 'idbobjectstore_deleted.js', 'idbobjectstore_get.js', 'idbobjectstore_get2.js', 'idbobjectstore_get3.js', 'idbobjectstore_get4.js', 'idbobjectstore_get5.js', 'idbobjectstore_get6.js', 'idbobjectstore_get7.js', 'idbobjectstore_getAll.js', 'idbobjectstore_getAllKeys.js', 'idbobjectstore_getKey.js', 'idbobjectstore_index.js', 'idbobjectstore_openCursor.js', 'idbobjectstore_openCursor_invalid.js', 'idbobjectstore_openKeyCursor.js', 'idbobjectstore_put.js', 'idbobjectstore_put10.js', 'idbobjectstore_put11.js', 'idbobjectstore_put12.js', 'idbobjectstore_put13.js', 'idbobjectstore_put14.js', 'idbobjectstore_put15.js', 'idbobjectstore_put16.js', 'idbobjectstore_put2.js', 'idbobjectstore_put3.js', 'idbobjectstore_put4.js', 'idbobjectstore_put5.js', 'idbobjectstore_put6.js', 'idbobjectstore_put7.js', 'idbobjectstore_put8.js', 'idbobjectstore_put9.js', 'idbrequest-onupgradeneeded.js', 'idbrequest_error.js', 'idbrequest_result.js', 'idbtransaction-objectStore-exception-order.js', 'idbtransaction-oncomplete.js', 'idbtransaction.js', 'idbtransaction_abort.js', 'idbtransaction_objectStoreNames.js', 'idbversionchangeevent.js', 'index_sort_order.js', 'interfaces.worker.js', 'key-conversion-exceptions.js', 'key_invalid.js', 'key_valid.js', 'keygenerator-constrainterror.js', 'keygenerator-explicit.js', 'keygenerator-inject.js', 'keygenerator-overflow.js', 'keygenerator.js', 'keyorder.js', 'keypath-special-identifiers.js', 'keypath.js', 'keypath_invalid.js', 'keypath_maxsize.js', 'list_ordering.js', 'name-scopes.js', 'objectstore_keyorder.js', 'open-request-queue.js', 'parallel-cursors-upgrade.js', 'request_bubble-and-capture.js', 'string-list-ordering.js', 'transaction-abort-generator-revert.js', 'transaction-abort-index-metadata-revert.js', 'transaction-abort-multiple-metadata-revert.js', 'transaction-abort-object-store-metadata-revert.js', 'transaction-abort-request-error.js', 'transaction-create_in_versionchange.js', 'transaction-lifetime-blocked.js', 'transaction-lifetime-empty.js', 'transaction-lifetime.js', 'transaction-requestqueue.js', 'transaction_bubble-and-capture.js', 'upgrade-transaction-lifecycle-backend-aborted.js', 'upgrade-transaction-lifecycle-committed.js', 'upgrade-transaction-lifecycle-user-aborted.js', 'value.js', 'value_recursive.js', 'writer-starvation.js'
    ],
    badFiles: [
        'idb-binary-key-detached.js', 'interfaces.js', 'transaction-deactivation-timing.js'
    ]
};

if (typeof module !== 'undefined') {
    module.exports = goodBad;
}

describe('W3C Transaction Behavior Tests', function () {
    var FDBDatabase = IDBDatabase;
    var createdb = support.createdb;

    // transaction-lifetime
    it('Test events opening a second database when one connection is open already', function (done) {
        var db, db_got_versionchange, db2,
            events = [];

        var openrq = indexedDB.open('db', 3);

        // 1
        openrq.onupgradeneeded = function(e) {
            events.push("open." + e.type);
            e.target.result.createObjectStore('store');
        };

        // 2
        openrq.onsuccess = function(e) {
            db = e.target.result;

            events.push("open." + e.type);

            // 3
            db.onversionchange = function(e) {
                events.push("db." + e.type);

                assert.equal(e.oldVersion, 3, "old version");
                assert.equal(e.newVersion, 4, "new version");
                db.close();
            };

            // Errors
            db.onerror = function () { throw new Error("db.error"); };
            db.abort = function () { throw new Error("db.abort"); };

            setTimeout(OpenSecond, 10);
        };

        // Errors
        openrq.onerror = function () { throw new Error("open.error"); };
        openrq.onblocked = function () { throw new Error("open.blocked"); };

        function OpenSecond (e) {
            assert.equal(db2, undefined);
            assert(db instanceof FDBDatabase);
            assert.deepEqual(Array.from(db.objectStoreNames), [ "store" ]);

            var openrq2 = indexedDB.open('db', 4);

            // 4
            openrq2.onupgradeneeded = function(e) {
                db2 = e.target.result;

                events.push("open2." + e.type);

                assert(db2 instanceof FDBDatabase);

                // Errors
                db2.onversionchange = function () { throw new Error("db2.versionchange"); };
                db2.onerror = function () { throw new Error("db2.error"); };
                db2.abort = function () { throw new Error("db2.abort"); };
            };

            // 5
            openrq2.onsuccess = function(e) {
                events.push("open2." + e.type);

                assert.deepEqual(events,
                    [ "open.upgradeneeded",
                      "open.success",
                      "db.versionchange",
                      "open2.upgradeneeded",
                      "open2.success",
                    ]);

                if (db2) db2.close();
                indexedDB.deleteDatabase('db');
                setTimeout(function() {
                    done();
                }, 10);
            };

            // Errors
            openrq2.onerror = function () { throw new Error("open2.error"); };
            openrq2.onblocked = function () { throw new Error("open2.blocked"); };
        }
    });

    // transaction-lifetime-blocked
    it('Blocked event', function (done) {
        var db, db_got_versionchange, db2,
            events = [];

        var openrq = indexedDB.open('db', 3);

        // 1
        openrq.onupgradeneeded = function(e) {
            events.push("open." + e.type);
            e.target.result.createObjectStore('store');
        };

        // 2
        openrq.onsuccess = function(e) {
            db = e.target.result;

            events.push("open." + e.type);

            // 3
            db.onversionchange = function(e) {
                events.push("db." + e.type);

                assert.equal(e.oldVersion, 3, "old version");
                assert.equal(e.newVersion, 4, "new version");
                // Do not close db here (as we should)
            };

            // Errors
            db.onerror = function () { throw new Error("db.error"); };
            db.abort = function () { throw new Error("db.abort"); };

            setTimeout(OpenSecond, 10);
        };

        // Errors
        openrq.onerror = function () { throw new Error("open.error"); };
        openrq.onblocked = function () { throw new Error("open.blocked"); };

        function OpenSecond (e) {
            assert.equal(db2, undefined);
            assert(db instanceof FDBDatabase);
            assert.deepEqual(Array.from(db.objectStoreNames), [ "store" ]);

            var openrq2 = indexedDB.open('db', 4);

            // 4
            openrq2.onblocked = function(e) {
                events.push("open2." + e.type);
                // We're closing connection from the other open()
                db.close();
            };

            // 5
            openrq2.onupgradeneeded = function(e) {
                db2 = e.target.result;

                events.push("open2." + e.type);

                assert(db2 instanceof FDBDatabase);

                // Errors
                db2.onversionchange = function () { throw new Error("db2.versionchange"); };
                db2.onerror = function () { throw new Error("db2.error"); };
                db2.abort = function () { throw new Error("db2.abort"); };
            };

            // 6
            openrq2.onsuccess = function(e) {
                events.push("open2." + e.type);

                assert.deepEqual(events,
                    [ "open.upgradeneeded",
                      "open.success",
                      "db.versionchange",
                      "open2.blocked",
                      "open2.upgradeneeded",
                      "open2.success",
                    ]);

                if (db2) db2.close();
                indexedDB.deleteDatabase('db');
                setTimeout(function() { done(); }, 10);
            };

            // Errors
            openrq2.onerror = function () { throw new Error("open2.error") };
        }
    });

    // transaction-requestqueue
    it('Transactions have a request queue', function (done) {
        var db,
            keys = { txn: [], txn2: [] },
            open_rq = createdb(done)

        open_rq.onupgradeneeded = function(e) {
            var i, os;
            db = e.target.result;

            for (i = 1; i < 6; i++)
            {
                os = db.createObjectStore("os" + i, { autoIncrement: true, keyPath: "k" });
                os.add({ os: "os" + i });
                os.put({ os: "os" + i, k: i});
                os.add({ os: "os" + i });
            }

           assert.deepEqual(Array.from(db.objectStoreNames), ["os1", "os2", "os3", "os4", "os5" ], "objectStores");
        }

        open_rq.onsuccess = function(e) {
            var txn = db.transaction(["os2", "os1", "os3", "os5"])
            txn.objectStore("os1").openCursor().onsuccess = reg("txn")
            txn.objectStore("os3").openCursor().onsuccess = reg("txn")
            txn.objectStore("os1").get(2).onsuccess = reg("txn")
            txn.objectStore("os2").get(3).onsuccess = reg("txn")

            var txn2 = db.transaction(["os4", "os3", "os1", "os5"])
            var os4 = txn2.objectStore("os4")

            for (var i=0; i < 3; i++) {
                os4.openCursor().onsuccess = reg("txn2")
                os4.get(5).onsuccess = reg("txn2")
                os4.get(4).onsuccess = reg("txn2")
                txn.objectStore("os2").get(1).onsuccess = reg("txn")
                txn2.objectStore("os3").get(1).onsuccess = reg("txn2")
            }

            txn2.objectStore("os1").get(2).onsuccess = reg("txn2")
            txn.objectStore("os1").openCursor(null, "prev").onsuccess = reg("txn")
            os4.openCursor(null, "prev").onsuccess = reg("txn2")

            txn.oncomplete = finish;
            txn2.oncomplete = finish;
        }


        function reg(n) {
            return function (e) {
                var v = e.target.result;
                if (v.value) v = v.value;
                keys[n].push(v.os + ": " + v.k);
            };
        }

        var finish_to_go = 2;
        function finish() {
            if (--finish_to_go)
                return;

            assert.deepEqual(keys['txn'], [
                                   "os1: 1",
                                   "os3: 1",
                                   "os1: 2",
                                   "os2: 3",
                                   "os2: 1", "os2: 1", "os2: 1",
                                   "os1: 2",
                                  ], 'transaction keys');

            assert.deepEqual(keys['txn2'], [
                                   "os4: 1", "os4: 5", "os4: 4", "os3: 1",
                                   "os4: 1", "os4: 5", "os4: 4", "os3: 1",
                                   "os4: 1", "os4: 5", "os4: 4", "os3: 1",
                                   "os1: 2",
                                   "os4: 5",
                                  ], 'transaction 2 keys');

            done();
        }
    });

    // transaction_bubble-and-capture
    it('Capture and bubble', function (done) {
      var events = [];

      var open_rq = createdb(done);
      open_rq.onupgradeneeded = function(e) {
          var db = e.target.result;
          var txn = e.target.transaction;
          var store = db.createObjectStore("store");
          var rq1 = store.add("", 1);
          var rq2 = store.add("", 1);

          db.onerror = undefined; // We will run db.error, but don't let that fail the test

          log_events('db', db, 'success');
          log_events('db', db, 'error');

          log_events('txn', txn, 'success');
          log_events('txn', txn, 'error');

          log_events('rq1', rq1, 'success');
          log_events('rq1', rq1, 'error');

          log_events('rq2', rq2, 'success');
          log_events('rq2', rq2, 'error');

          // Don't let it get to abort
          db.addEventListener('error', function(e) { e.preventDefault(); }, false);
      }

      open_rq.onsuccess = function(e) {
          log("open_rq.success")(e);
          assert.deepEqual(events, [
                                         "capture db.success",
                                         "capture txn.success",
                                         "capture rq1.success",
                                         "bubble  rq1.success",

                                         "capture db.error: ConstraintError",
                                         "capture txn.error: ConstraintError",
                                         "capture rq2.error: ConstraintError",
                                         "bubble  rq2.error: ConstraintError",
                                         "bubble  txn.error: ConstraintError",
                                         "bubble  db.error: ConstraintError",

                                         "open_rq.success",
                                       ],
                              "events");
          done();
      }


      function log_events(type, obj, evt) {
          obj.addEventListener(evt, log('capture ' + type + '.' + evt), true);
          obj.addEventListener(evt, log('bubble  ' + type + '.' + evt), false);
      }

      function log(msg) {
          return function(e) {
              if(e && e.target && e.target.error)
                  events.push(msg + ": " + e.target.error.name);
              else
                  events.push(msg);
          };
      }
    });
});

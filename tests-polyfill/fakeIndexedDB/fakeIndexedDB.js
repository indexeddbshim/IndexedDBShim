function getFakeTestName () {
    return 'test' + Math.random() + '.sqlite';
}

describe('indexedDB Tests', function () {
    describe('Transaction Lifetime', function () {
        it('Transactions should be activated from queue based on mode', function (done) {
            var request = indexedDB.open(getFakeTestName());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore('store', {keyPath: 'key'});

                for (var i = 0; i < 10; i++) {
                    store.add({key: i, content: 'test' + i});
                }
            };

            var started = [];
            var completed = [];

            function startTx(db, mode, desc) {
                var tx = db.transaction('store', mode);
                tx.objectStore('store').get(1).onsuccess = function () {
                    // If this is one of the readwrite transactions or the first readonly after a readwrite, make sure we waited for all active transactions to finish before starting a new one
                    if (mode === 'readwrite' || started.length === 7) {
                        expect(started.length).equal(completed.length);
                    }

                    started.push(desc);
                    //console.log('start', desc);

                    tx.objectStore('store').get(2).onsuccess = function () {
                        tx.objectStore('store').get(3).onsuccess = function () {
                            tx.objectStore('store').get(4).onsuccess = function () {
                                tx.objectStore('store').get(5).onsuccess = function () {
                                    tx.objectStore('store').get(6);
                                };
                            };
                        };
                    };
                };
                tx.oncomplete = function () {
                    completed.push(desc);
                    //console.log('done', desc);

                    if (completed.length >= 12) {
                        done();
                    }
                };
            }

            request.onsuccess = function (e) {
                var db = e.target.result;

                var i;
                for (i = 0; i < 5; i++) {
                    startTx(db, 'readonly', '1-' + i);
                }
                startTx(db, 'readwrite', 2);
                startTx(db, 'readwrite', 3);
                for (i = 0; i < 5; i++) {
                    startTx(db, 'readonly', '4-' + i);
                }
            };
        });
    });
    describe('Transaction Rollback', function () {
        it('Rollback FDBObjectStore.add', function (done) {
            var request = indexedDB.open(getFakeTestName());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore('store', {autoIncrement: true});

                for (var i = 0; i < 10; i++) {
                    store.add({content: 'test' + (i + 1)});
                }
            };
            request.onsuccess = function (e) {
                var db = e.target.result;

                var tx = db.transaction('store', 'readwrite');
                tx.objectStore('store').count().onsuccess = function (e) {
                    expect(e.target.result).equal(10);
                    tx.objectStore('store').add({content: 'SHOULD BE ROLLED BACK'});

                    tx.objectStore('store').get(11).onsuccess = function (e) {
                        expect(e.target.result.content).equal('SHOULD BE ROLLED BACK');
                        tx.abort();
                    };
                };

                var tx2 = db.transaction('store', 'readwrite');
                tx2.objectStore('store').count().onsuccess = function (e) {
                    expect(e.target.result).equal(10);
                    tx2.objectStore('store').add({content: 'SHOULD BE 11TH RECORD'}); // add would fail if SHOULD BE ROLLED BACK was still there

                    tx2.objectStore('store').count().onsuccess = function (e) {
                        expect(e.target.result).equal(11);
                    };
                    tx2.objectStore('store').get(11).onsuccess = function (e) {
                        expect(e.target.result.content).equal('SHOULD BE 11TH RECORD');
                    };
                };

                tx2.oncomplete = function () { done(); };
            };
        });

        it('Rollback FDBObjectStore.clear', function (done) {
            var request = indexedDB.open(getFakeTestName());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore('store', {autoIncrement: true});

                for (var i = 0; i < 10; i++) {
                    store.add({content: 'test' + (i + 1)});
                }
            };
            request.onsuccess = function (e) {
                var db = e.target.result;

                var tx = db.transaction('store', 'readwrite');
                tx.objectStore('store').clear().onsuccess = function () {
                    tx.objectStore('store').count().onsuccess = function (e) {
                        expect(e.target.result).equal(0);
                        tx.abort();
                    };
                };

                var tx2 = db.transaction('store', 'readwrite');
                tx2.objectStore('store').count().onsuccess = function (e) {
                    expect(e.target.result).equal(10);
                };

                tx2.oncomplete = function () { done(); };
            };
        });

        it('Rollback FDBObjectStore.delete', function (done) {
            var request = indexedDB.open(getFakeTestName());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore('store', {autoIncrement: true});

                for (var i = 0; i < 10; i++) {
                    store.add({content: 'test' + (i + 1)});
                }
            };
            request.onsuccess = function (e) {
                var db = e.target.result;

                var tx = db.transaction('store', 'readwrite');
                tx.objectStore('store').delete(2).onsuccess = function () {
                    tx.objectStore('store').count().onsuccess = function (e) {
                        expect(e.target.result).equal(9);
                        tx.abort();
                    };
                };

                var tx2 = db.transaction('store', 'readwrite');
                tx2.objectStore('store').count().onsuccess = function (e) {
                    expect(e.target.result).equal(10);
                };

                tx2.oncomplete = function () { done(); };
            };
        });

        it('Rollback FDBObjectStore.put', function (done) {
            var request = indexedDB.open(getFakeTestName());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore('store', {autoIncrement: true});

                for (var i = 0; i < 10; i++) {
                    store.add({content: 'test' + (i + 1)});
                }
            };
            request.onsuccess = function (e) {
                var db = e.target.result;

                var tx = db.transaction('store', 'readwrite');
                tx.objectStore('store').put({content: 'SHOULD BE ROLLED BACK'}, 10);
                tx.objectStore('store').get(10).onsuccess = function (e) {
                    expect(e.target.result.content).equal('SHOULD BE ROLLED BACK');
                    tx.abort();
                };

                var tx2 = db.transaction('store', 'readwrite');
                tx2.objectStore('store').get(10).onsuccess = function (e) {
                    expect(e.target.result.content).equal('test10');
                };

                tx2.oncomplete = function () { done(); };
            };
        });

        it('Rollback FDBCursor.delete', function (done) {
            var request = indexedDB.open(getFakeTestName());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore('store', {autoIncrement: true});

                for (var i = 0; i < 10; i++) {
                    store.add({content: 'test' + (i + 1)});
                }
            };
            request.onsuccess = function (e) {
                var db = e.target.result;

                var tx = db.transaction('store', 'readwrite');
                tx.objectStore('store').openCursor(3).onsuccess = function (e) {
                    var cursor = e.target.result;
                    var obj = cursor.value;
                    obj.content = 'SHOULD BE ROLLED BACK';
                    cursor.delete();
                    tx.objectStore('store').get(3).onsuccess = function (e) {
                        expect(e.target.result).equal(undefined);
                        tx.abort();
                    };
                };

                var tx2 = db.transaction('store', 'readwrite');
                tx2.objectStore('store').get(3).onsuccess = function (e) {
                    expect(e.target.result.content).equal('test3');
                };

                tx2.oncomplete = function () { done(); };
            };
        });

        it('Rollback FDBCursor.update', function (done) {
            var request = indexedDB.open(getFakeTestName());
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore('store', {autoIncrement: true});

                for (var i = 0; i < 10; i++) {
                    store.add({content: 'test' + (i + 1)});
                }
            };
            request.onsuccess = function (e) {
                var db = e.target.result;

                var tx = db.transaction('store', 'readwrite');
                tx.objectStore('store').openCursor(3).onsuccess = function (e) {
                    var cursor = e.target.result;
                    var obj = cursor.value;
                    obj.content = 'SHOULD BE ROLLED BACK';
                    cursor.update(obj);
                    tx.objectStore('store').get(3).onsuccess = function (e) {
                        expect(e.target.result.content).equal('SHOULD BE ROLLED BACK');
                        tx.abort();
                    };
                };

                var tx2 = db.transaction('store', 'readwrite');
                tx2.objectStore('store').get(3).onsuccess = function (e) {
                    expect(e.target.result.content).equal('test3');
                };

                tx2.oncomplete = function () { done(); };
            };
        });

        it('Rollback of versionchange transaction', function (done) {
            var dbName = getFakeTestName();
            var request = indexedDB.open(dbName);
            request.onupgradeneeded = function(e) {
                var db = e.target.result;
                var store = db.createObjectStore('store', {autoIncrement: true});
                store.createIndex('content', 'content');

                for (var i = 0; i < 10; i++) {
                    store.add({content: 'test' + (i + 1)});
                }

                // Brett added:
                var storeB = db.createObjectStore('storeB', {autoIncrement: true});
                expect(storeB.name).equal('storeB');
                var idxNew = storeB.createIndex('contentB', 'content');
                expect(idxNew.name).equal('contentB');
                expect(storeB.indexNames.length).equal(1);
            };
            request.onsuccess = function (e) {
                var db = e.target.result;
                db.close();

                var request = indexedDB.open(dbName, 2);
                request.onupgradeneeded = function(e) {
                    var db = e.target.result;
                    expect(db.objectStoreNames.length).equal(2);
                    expect(db.objectStoreNames.item(0)).equal('store');
                    expect(db.objectStoreNames.item(1)).equal('storeB');

                    db.createObjectStore('store2', {autoIncrement: true});
                    expect(db.objectStoreNames.length).equal(3);

                    var store = e.target.transaction.objectStore('store');
                    expect(store.indexNames.length).equal(1);
                    expect(store.indexNames.item(0)).equal('content');
                    store.createIndex('content2', 'content');
                    expect(store.indexNames.length).equal(2);
                    expect(store.indexNames.item(1)).equal('content2');

                    store.add({content: 'SHOULD BE ROLLED BACK'});

                    store.deleteIndex('content');
                    expect(store.indexNames.length).equal(1);

                    db.deleteObjectStore('store');
                    expect(db.objectStoreNames.length).equal(2);


                    var storeB = e.target.transaction.objectStore('storeB');
                    expect(storeB.name).equal('storeB');

                    storeB.name = 'storeB2';
                    expect(storeB.name).equal('storeB2');

                    var idxNew = storeB.index('contentB');
                    idxNew.name = 'contentB2';
                    expect(idxNew.name).equal('contentB2');

                    e.target.transaction.onabort = function () { // Brett added
                        expect(db.version).equal(1);
                        expect(db.objectStoreNames.length).equal(2);
                        expect(db.objectStoreNames.item(0)).equal('store');
                        expect(db.objectStoreNames.item(1)).equal('storeB');

                        expect(storeB.name).equal('storeB');

                        expect(store.indexNames.length).equal(1);
                        expect(store.indexNames.item(0)).equal('content');
                        expect(storeB.indexNames.length).equal(1);

                        expect(idxNew.name).equal('contentB');
                    };

                    request.transaction.abort();
                };
                request.onerror = function () {
                    var request = indexedDB.open(dbName);
                    request.onsuccess = function(e) {
                        var db = e.target.result;
                        expect(db.version).equal(1);
                        expect(db.objectStoreNames.length).equal(2);
                        expect(db.objectStoreNames.item(0)).equal('store'); // Brett added
                        expect(db.objectStoreNames.item(1)).equal('storeB'); // Brett added

                        var tx = db.transaction(['store', 'storeB']);
                        var store = tx.objectStore('store');
                        expect(store.indexNames.length).equal(1);
                        expect(store.indexNames.item(0)).equal('content');

                        var storeB = tx.objectStore('storeB');
                        expect(storeB.indexNames.length).equal(1); // Brett added
                        expect(storeB.indexNames.item(0)).equal('contentB'); // Brett added

                        // assert(!store._rawObjectStore.deleted);
                        var index = store.index('content');
                        // assert(!index._rawIndex.deleted);

                        store.count().onsuccess = function (e) {
                            expect(e.target.result).equal(10);
                        };

                        index.get('test2').onsuccess = function (e) {
                            expect(e.target.result).deep.equal({content: 'test2'});
                        };

                        expect(store.indexNames.length).equal(1);

                        tx.oncomplete = function () { done(); };
                    };
                };
            };
        });
    });
});

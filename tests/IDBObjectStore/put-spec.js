describe('IDBObjectStore.put', function() {
    'use strict';

    it('should update an existing record with an out-of-line key', function(done) {
        util.createDatabase('out-of-line', function(err, db) {
            var tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line');
            store.put({foo: 'bar'}, 12345);
            store.put({foo: 'bar'}, 12345);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    key: 12345, value: {foo: 'bar'}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a generated out-of-line key', function(done) {
        util.createDatabase('out-of-line-generated', function(err, db) {
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line-generated');
            store.put({foo: 'bar'});
            store.put({foo: 'bar'}, 1);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    key: 1, value: {foo: 'bar'}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with an inline key', function(done) {
        util.createDatabase('inline', function(err, db) {
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            store.put({id: 12345, foo: 'bar'});
            store.put({id: 12345, biz: 'baz'});

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    key: 12345, value: {id: 12345, biz: 'baz'}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a generated inline key', function(done) {
        util.createDatabase('inline-generated', function(err, db) {
            var tx = db.transaction('inline-generated', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline-generated');
            store.put({foo: 'bar'});
            store.put({id: 1, biz: 'baz'});

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    key: 1, value: {id: 1, biz: 'baz'}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a dotted key', function(done) {
        util.createDatabase('dotted', function(err, db) {
            var tx = db.transaction('dotted', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('dotted');
            store.put({name: {first: 'John', last: 'Doe'}, age: 30});
            store.put({name: {first: 'John', last: 'Smith'}, age: 42});

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    key: 'John', value: {name: {first: 'John', last: 'Smith'}, age: 42}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a generated dotted key', function(done) {
        util.createDatabase('dotted-generated', function(err, db) {
            var tx = db.transaction('dotted-generated', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('dotted-generated');
            store.put({age: 30});
            store.put({name: {first: 1, last: 'Smith'}, age: 42});

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    key: 1, value: {name: {first: 1, last: 'Smith'}, age: 42}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a compound out-of-line key', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('out-of-line-compound', function(err, db) {
            var tx = db.transaction('out-of-line-compound', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line-compound');
            store.put({foo: 'bar'}, [1, 'two', new Date(2003, 4, 5)]);
            store.put({foo: 'bar'}, [1, 'two', new Date(2003, 4, 5)]);

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    key: [1, 'two', new Date(2003, 4, 5)], value: {foo: 'bar'}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a compound key', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('inline-compound', function(err, db) {
            var tx = db.transaction('inline-compound', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline-compound');
            store.put({id: 12345, name: 'John Doe', age: 30});
            store.put({id: 12345, name: 'John Doe', age: 42});

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    key: [12345, 'John Doe'], value: {id: 12345, name: 'John Doe', age: 42}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a dotted compound key', function(done) {
        if (env.isNative && env.browser.isIE) {
            // BUG: IE's native IndexedDB does not support compound keys at all
            console.error('Skipping test: ' + this.test.title);
            return done();
        }

        util.createDatabase('dotted-compound', function(err, db) {
            var tx = db.transaction('dotted-compound', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('dotted-compound');
            store.put({id: 12345, name: {first: 'John', last: 'Doe'}, age: 30});
            store.put({id: 12345, name: {first: 'John', last: 'Doe'}, age: 42});

            var allData;
            util.getAll(store, function(err, data) {
                allData = data;
            });

            tx.oncomplete = function() {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    key: [12345, 'John', 'Doe'], value: {id: 12345, name: {first: 'John', last: 'Doe'}, age: 42}
                });

                db.close();
                done();
            };
        });
    });
});

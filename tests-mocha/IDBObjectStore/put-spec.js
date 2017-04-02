/* eslint-env mocha */
/* globals expect, util, env */
/* eslint-disable no-var */
describe('IDBObjectStore.put', function () {
    'use strict';

    it('should update an existing record with an out-of-line key', function (done) {
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line');
            store.put({foo: 'bar'}, 12345);
            store.put({foo: 'bar'}, 12345);

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    primaryKey: 12345, key: 12345, value: {foo: 'bar'}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a generated out-of-line key', function (done) {
        this.timeout(5000);

        util.createDatabase('out-of-line-generated', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line-generated', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line-generated');
            store.put({foo: 'bar'});
            store.put({foo: 'bar'}, 1);

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    primaryKey: 1, key: 1, value: {foo: 'bar'}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with an inline key', function (done) {
        util.createDatabase('inline', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline');
            store.put({id: 12345, foo: 'bar'});
            store.put({id: 12345, biz: 'baz'});

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    primaryKey: 12345, key: 12345, value: {id: 12345, biz: 'baz'}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a generated inline key', function (done) {
        this.timeout(5000);

        util.createDatabase('inline-generated', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline-generated', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline-generated');
            store.put({foo: 'bar'});
            store.put({id: 1, biz: 'baz'});

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    primaryKey: 1, key: 1, value: {id: 1, biz: 'baz'}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a dotted key', function (done) {
        util.createDatabase('dotted', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('dotted', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('dotted');
            store.put({name: {first: 'John', last: 'Doe'}, age: 30});
            store.put({name: {first: 'John', last: 'Smith'}, age: 42});

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    primaryKey: 'John', key: 'John', value: {name: {first: 'John', last: 'Smith'}, age: 42}
                });

                db.close();
                done();
            };
        });
    });

    it('should update an existing record with a generated dotted key', function (done) {
        util.createDatabase('dotted-generated', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('dotted-generated', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('dotted-generated');
            store.put({age: 30});
            store.put({name: {first: 1, last: 'Smith'}, age: 42});

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    primaryKey: 1, key: 1, value: {name: {first: 1, last: 'Smith'}, age: 42}
                });

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should update an existing record with a compound out-of-line key', function (done) {
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('out-of-line-compound', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line-compound', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line-compound');
            store.put({foo: 'bar'}, [1, 'two', new Date(2003, 4, 5)]);
            store.put({foo: 'bar'}, [1, 'two', new Date(2003, 4, 5)]);

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    primaryKey: [1, 'two', new Date(2003, 4, 5)], key: [1, 'two', new Date(2003, 4, 5)], value: {foo: 'bar'}
                });

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should update an existing record with a compound key', function (done) {
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('inline-compound', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('inline-compound', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('inline-compound');
            store.put({id: 12345, name: 'John Doe', age: 30});
            store.put({id: 12345, name: 'John Doe', age: 42});

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    primaryKey: [12345, 'John Doe'], key: [12345, 'John Doe'], value: {id: 12345, name: 'John Doe', age: 42}
                });

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.isNative && env.browser.isIE, 'should update an existing record with a dotted compound key', function (done) {
        // BUG: IE's native IndexedDB does not support compound keys at all
        util.createDatabase('dotted-compound', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('dotted-compound', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('dotted-compound');
            store.put({id: 12345, name: {first: 'John', last: 'Doe'}, age: 30});
            store.put({id: 12345, name: {first: 'John', last: 'Doe'}, age: 42});

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should only contain one record
                expect(allData).to.have.lengthOf(1);
                expect(allData[0]).to.deep.equal({
                    primaryKey: [12345, 'John', 'Doe'], key: [12345, 'John', 'Doe'], value: {id: 12345, name: {first: 'John', last: 'Doe'}, age: 42}
                });

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should distinguish between very-long string keys (10,000+ characters)', function (done) {
        this.timeout(10000);
        // BUG: IE's IndexedDB truncates string keys at 889 characters
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line');

            var key1 = util.sampleData.veryLongString + 'a';
            expect(key1).to.have.lengthOf(10001);
            store.put({foo: 'bar'}, key1);

            var key2 = util.sampleData.veryLongString + 'b';
            expect(key1).to.have.lengthOf(10001);
            store.put({foo: 'bar'}, key2);

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should contain two records
                expect(allData).to.have.lengthOf(2);
                expect(allData).to.deep.equal([
                    {primaryKey: key1, key: key1, value: {foo: 'bar'}},
                    {primaryKey: key2, key: key2, value: {foo: 'bar'}}
                ]);

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should distinguish between very-long string keys (890+ characters)', function (done) {
        // BUG: IE's IndexedDB truncates string keys at 889 characters
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line');

            var key1 = util.sampleData.veryLongString.substr(0, 889) + 'a';
            expect(key1).to.have.lengthOf(890);
            store.put({foo: 'bar'}, key1);

            var key2 = util.sampleData.veryLongString.substr(0, 889) + 'b';
            expect(key1).to.have.lengthOf(890);
            store.put({foo: 'bar'}, key2);

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should contain two records
                expect(allData).to.have.lengthOf(2);
                expect(allData).to.deep.equal([
                    {primaryKey: key1, key: key1, value: {foo: 'bar'}},
                    {primaryKey: key2, key: key2, value: {foo: 'bar'}}
                ]);

                db.close();
                done();
            };
        });
    });

    it('should distinguish between very-long string keys (889 characters)', function (done) {
        // BUG: IE's IndexedDB truncates string keys at 889 characters
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line');

            var key1 = util.sampleData.veryLongString.substr(0, 888) + 'a';
            expect(key1).to.have.lengthOf(889);
            store.put({foo: 'bar'}, key1);

            var key2 = util.sampleData.veryLongString.substr(0, 888) + 'b';
            expect(key1).to.have.lengthOf(889);
            store.put({foo: 'bar'}, key2);

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should contain two records
                expect(allData).to.have.lengthOf(2);
                expect(allData).to.deep.equal([
                    {primaryKey: key1, key: key1, value: {foo: 'bar'}},
                    {primaryKey: key2, key: key2, value: {foo: 'bar'}}
                ]);

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && (env.isNative || env.isPolyfilled), 'should distinguish between very-long compound keys (890+ characters)', function (done) {
        // BUG: IE's IndexedDB truncates string keys at 889 characters
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line');
            var veryLongString = util.sampleData.veryLongString.substr(0, 400);
            store.put({foo: 'bar'}, [veryLongString, 1, 2, 3, 4, 5]);   // Key encodes this as an 925-character string
            store.put({foo: 'bar'}, [veryLongString, 1, 2, 3, 4, 6]);   // Key encodes this as an 925-character string

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should contain two records
                expect(allData).to.have.lengthOf(2);
                expect(allData).to.deep.equal([
                    {primaryKey: [veryLongString, 1, 2, 3, 4, 5], key: [veryLongString, 1, 2, 3, 4, 5], value: {foo: 'bar'}},
                    {primaryKey: [veryLongString, 1, 2, 3, 4, 6], key: [veryLongString, 1, 2, 3, 4, 6], value: {foo: 'bar'}}
                ]);

                db.close();
                done();
            };
        });
    });

    util.skipIf(env.browser.isIE && env.isNative, 'should distinguish between compound keys under 890 total characters', function (done) {
        // BUG: IE's IndexedDB truncates string keys at 889 characters
        util.createDatabase('out-of-line', function (err, db) {
            if (err) {
                expect(function () { throw err; }).to.not.throw(Error);
                done();
                return;
            }
            var tx = db.transaction('out-of-line', 'readwrite');
            tx.onerror = done;

            var store = tx.objectStore('out-of-line');
            store.put({foo: 'bar'}, [1, 2, 3, 4]);   // Key encodes this as an 844-character string
            store.put({foo: 'bar'}, [1, 2, 3, 5]);   // Key encodes this as an 844-character string

            var allData;
            util.getAll(store, function (err, data) {
                if (err) {
                    expect(function () { throw err; }).to.not.throw(Error);
                    done();
                    return;
                }
                allData = data;
            });

            tx.oncomplete = function () {
                // The table should contain two records
                expect(allData).to.have.lengthOf(2);
                expect(allData).to.deep.equal([
                    {primaryKey: [1, 2, 3, 4], key: [1, 2, 3, 4], value: {foo: 'bar'}},
                    {primaryKey: [1, 2, 3, 5], key: [1, 2, 3, 5], value: {foo: 'bar'}}
                ]);

                db.close();
                done();
            };
        });
    });
});

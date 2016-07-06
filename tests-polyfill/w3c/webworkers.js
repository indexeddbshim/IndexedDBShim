var assert = require('assert');
var support = require('./support');

var db, count = 0;

describe('W3C IDBIndex.webworkers Tests', function () {
    it('Test that an abort in the initial upgradeneeded sets version back to 0', function () {
        var worker = new Worker("idbworker.js");
        worker.onmessage = function (e) {
            switch(count) {
                case 0:
                    assert.equal(e.data, true, 'worker has idb object')
                    break
                case 1:
                    assert.equal(e.data, "test", "get(1) in worker")
                    done()
            }
            count++
        };
        worker.postMessage(1);
    });
});

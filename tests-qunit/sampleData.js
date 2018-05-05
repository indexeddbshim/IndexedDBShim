/* eslint-env qunit */
/* eslint-disable no-var */
var DB = { // eslint-disable-line no-unused-vars
    NAME: 'dbname',
    OBJECT_STORE_1: 'objectStore1',
    OBJECT_STORE_2: 'objectStore2',
    OBJECT_STORE_3: 'objectStore3',
    OBJECT_STORE_4: 'objectStore4',
    OBJECT_STORE_5: 'objectStore5',
    INDEX1_ON_OBJECT_STORE_1: 'Index1_ObjectStore1',
    INDEX1_ON_OBJECT_STORE_2: 'Index1_ObjectStore2'
};

var sample = (function () { // eslint-disable-line no-unused-vars
    var generatedNumbers = {};
    return {
        obj () {
            return {
                'String': 'Sample ' + new Date(),
                'Int': this.integer(),
                'Float': Math.random(),
                'Boolean': true
            };
        },
        integer (arg) {
            // Ensuring a unique integer everytime, for the sake of index get
            var r;
            do {
                r = parseInt(Math.random() * (arg || 100000), 10);
            }
            while (generatedNumbers[r]);
            generatedNumbers[r] = true;
            return r;
        }
    };
}());

if (typeof global !== 'undefined') {
    global.DB = DB;
    global.sample = sample;
}

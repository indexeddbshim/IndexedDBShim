var DB = {
    NAME: "dbName",
    OBJECT_STORE_1: "objectStore1",
    OBJECT_STORE_2: "objectStore2",
    OBJECT_STORE_3: "objectStore3",
    OBJECT_STORE_4: "objectStore4",
    OBJECT_STORE_5: "objectStore5",
    INDEX1_ON_OBJECT_STORE_1: "Index1_ObjectStore1",
    INDEX1_ON_OBJECT_STORE_2: "Index1_ObjectStore2"
};

var sample = (function(){
    var generatedNumbers = {};
    return {
        obj: function(){
            return {
                "String": "Sample " + new Date(),
                "Int": this.integer(),
                "Float": Math.random(),
                "Boolean": true
            };
        },
        integer: function(arg){
            // Ensuring a unique integer everytime, for the sake of indexe get
            var r;
            do {
                r = parseInt(Math.random() * (arg || 100), 10);
            }
            while (generatedNumbers[r]);
            generatedNumbers[r] = true;
            return r;
        }
    };
}());

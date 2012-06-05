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

var sample = {
	obj: function(){
		return {
			"String": "Sample " + new Date(),
			"Int": this.integer(),
			"Float": Math.random(),
			"Boolean": true
		}
	},
	integer: function(arg){
		return parseInt(Math.random() * (arg || 100));
	}
};

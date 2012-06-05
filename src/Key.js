(function(idbModules){
	/**
	 * Encodes the keys and values based on their types. This is required to maintain collations
	 */
	var Key = (function(){
		return {
			encode: function(key){
				// TODO The keys should be numbers, as they need to be compared
				var prefix = "5";
				switch (typeof key) {
					case "number":
						prefix = 1;
						break;
					case "string":
						prefix = 2;
						break;
					case "boolean":
						prefix = 3;
						break;
					case "object":
						prefix = 4;
						break;
					case "undefined":
						prefix = 5;
						break;
					default:
						prefix = 6;
						break;
				}
				return prefix + "-" + JSON.stringify(key);
			},
			decode: function(key){
				if (typeof key === "undefined" || key === null) {
					return key;
				}
				return JSON.parse(key.substring(2));
			}
		}
	}());
	idbModules["Key"] = Key;
}(idbModules));

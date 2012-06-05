(function(idbModules){
	/**
	 * A dummy implementation of the Structured Cloning Algorithm
	 * This just converts to a JSON string
	 */
	var Sca = (function(){
		return {
			"encode": function(val){
				return JSON.stringify(val);
			},
			"decode": function(val){
				return JSON.parse(val);
			}
		}
	}());
	idbModules["Sca"] = Sca;
}(idbModules));

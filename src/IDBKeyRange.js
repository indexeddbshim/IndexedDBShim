(function(idbModules, undefined){
	/**
	 * The IndexedDB KeyRange object
	 * http://dvcs.w3.org/hg/IndexedDB/raw-file/tip/Overview.html#dfn-key-range
	 * @param {Object} lower
	 * @param {Object} upper
	 * @param {Object} lowerOpen
	 * @param {Object} upperOpen
	 */
	var IDBKeyRange = function(lower, upper, lowerOpen, upperOpen){
		this.lower = lower;
		this.upper = upper;
		this.lowerOpen = lowerOpen;
		this.upperOpen = upperOpen;
	}
	
	IDBKeyRange.only = function(value){
		return new IDBKeyRange(value, value, true, true);
	};
	
	IDBKeyRange.lowerBound = function(value, open){
		return new IDBKeyRange(value, undefined, open, undefined);
	};
	IDBKeyRange.upperBound = function(value){
		return new IDBKeyRange(undefined, value, undefined, open);
	};
	IDBKeyRange.bound = function(lower, upper, lowerOpen, upperOpen){
		return new IDBKeyRange(lower, upper, lowerOpen, upperOpen);
	};
	
	window.IDBKeyRange = idbModules.IDBKeyRange = IDBKeyRange;
	
}(idbModules));

/**
 * An initialization file that checks for conditions, removes console.log and warn, etc
 */
var idbModules = {};

/*global window:true*/
if (typeof window === 'undefined') {
	// Node.js environment	
	var sqlite = require('sqlite3');
	window = {
		//DEBUG : true,
		openDatabase: function(dbname,version,description,dbsize){
			var db = {
				db : new sqlite.Database(dbname+".sqlite",console.log.bind('opened...')),
				busy : false,
				transactionQueue : [],
				transaction : function(request,error){
					var tr = {
						executeSql : function(sql,params,success,error){
							db.busy = true;
							var callback = function(err,rows){
								db.busy = false;
								if(err) {
									err.sql=sql;
									error && error(err);
								} else {
									if (rows) {
										rows.item = function(i) { return this[i];};
									}
									success && success(tr,{rows:rows});
								}
								db.processNext(tr);
							};
							if (sql.match(/^SELECT/i)!=null){
								db.db.all(sql,params,callback);
							} else {
								db.db.run(sql,params,callback);
							}
						}
					};
					this.transactionQueue.push(request);
					this.processNext(tr);
				},
				processNext : function(tr){
					if (!db.busy && db.transactionQueue.length>0){
						var nextRequest = db.transactionQueue.shift();
						nextRequest(tr);
					}		
				}
			};
			return db;
		}
	};
	DOMException = {
		constructor : function(code,message){
			console.log(message);
			return new Error(message);
		}
	};
	module.exports = window;
}

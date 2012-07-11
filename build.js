/**
 * Function that concantenates all the modules that are used by IndexedDB
 * @param {Object} callback
 */
var buildIndexedDB = (function(){
	var moduleList = ["Init", "util", "Sca", "Key", "Event", "IDBRequest", "IDBKeyRange", "IDBCursor", "IDBIndex", "IDBObjectStore", "IDBTransaction", "IDBDatabase", "shimIndexedDB", "globalVars"];
	return {
		addScripts: function(callback){
			window.idbModules = {};
			(function addScript(i){
				var x = document.createElement("script");
				x.src = "/IndexedDBShim/src/" + moduleList[i] + ".js";
				x.type = "text/javascript"
				x.onload = function(){
					if (i < moduleList.length - 1) addScript(i + 1);
					else callback();
				}
				document.getElementsByTagName('head').appendChild(x);
			}(0));
		},
		concatScripts: function(callback){
			var scripts = ["(function(){if (typeof window.openDatabase === 'undefined') {return;}\n"];
			(function fetchScript(i){
				var xmlhttp;
				if (window.XMLHttpRequest) {
					xmlhttp = new XMLHttpRequest(); // code for IE7+, Firefox, Chrome, Opera, Safari
				} else {
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");// code for IE6, IE5
				}
				xmlhttp.open("GET", "/IndexedDBShim/src/" + moduleList[i] + ".js" + "", true);
				xmlhttp.onreadystatechange = function(){
					if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
						scripts.push(xmlhttp.responseText);
						if (i >= moduleList.length - 1) {
							scripts.push("}());");
							callback(scripts.join("\n"));
						} else {
							fetchScript(i + 1);
						}
					}
				}
				xmlhttp.send();
			})(0);
		}
	}
})();


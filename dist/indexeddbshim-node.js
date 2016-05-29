(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _websql = require('websql');

var _websql2 = _interopRequireDefault(_websql);

var _indexeddbshimMin = require('./indexeddbshim.min.js');

var _indexeddbshimMin2 = _interopRequireDefault(_indexeddbshimMin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }


},{"./indexeddbshim.min.js":2,"websql":9}],2:[function(require,module,exports){
(function (global){
/*! indexeddbshim - v2.2.2 - 2016-06-12 */

!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);var j=new Error("Cannot find module '"+g+"'");throw j.code="MODULE_NOT_FOUND",j}var k=c[g]={exports:{}};b[g][0].call(k.exports,function(a){var c=b[g][1][a];return e(c?c:a)},k,k.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(require,module,exports){"use strict";function _interopRequireDefault(a){return a&&a.__esModule?a:{"default":a}}Object.defineProperty(exports,"__esModule",{value:!0});var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol?"symbol":typeof a},_atob=require("atob"),_atob2=_interopRequireDefault(_atob),_eventtarget=require("eventtarget"),_eventtarget2=_interopRequireDefault(_eventtarget),idbModules={util:{cleanInterface:!1}};!function(){var a={test:!0};if(Object.defineProperty)try{Object.defineProperty(a,"test",{enumerable:!1}),a.test&&(idbModules.util.cleanInterface=!0)}catch(b){}}(),function(a){function b(a,b,c){c.target=b,"function"==typeof b[a]&&b[a].apply(b,[c])}var c=function(){this.length=0,this._items=[],a.util.cleanInterface&&Object.defineProperty(this,"_items",{enumerable:!1})};if(c.prototype={contains:function(a){return-1!==this._items.indexOf(a)},item:function(a){return this._items[a]},indexOf:function(a){return this._items.indexOf(a)},push:function(a){this._items.push(a),this.length+=1;for(var b=0;b<this._items.length;b++)this[b]=this._items[b]},splice:function(){this._items.splice.apply(this._items,arguments),this.length=this._items.length;for(var a in this)a===String(parseInt(a,10))&&delete this[a];for(a=0;a<this._items.length;a++)this[a]=this._items[a]}},a.util.cleanInterface)for(var d in{indexOf:!1,push:!1,splice:!1})Object.defineProperty(c.prototype,d,{enumerable:!1});a.util.callback=b,a.util.StringList=c,a.util.quote=function(a){return'"'+a+'"'}}(idbModules),function(a){function b(){(navigator.userAgent.match(/MSIE/)||navigator.userAgent.match(/Trident/)||navigator.userAgent.match(/Edge/))&&c()}function c(){var a=IDBFactory.prototype.cmp,b=IDBDatabase.prototype.createObjectStore,c=IDBObjectStore.prototype.createIndex,f=IDBObjectStore.prototype.add,j=IDBObjectStore.prototype.put,k=IDBIndex.prototype.get,l=IDBIndex.prototype.getKey,m=IDBIndex.prototype.openCursor,n=IDBIndex.prototype.openKeyCursor,o=IDBObjectStore.prototype.get,p=IDBObjectStore.prototype["delete"],q=IDBObjectStore.prototype.openCursor,r=IDBObjectStore.prototype.openKeyCursor,s=IDBKeyRange.bound,t=IDBKeyRange.upperBound,u=IDBKeyRange.lowerBound,v=IDBKeyRange.only,w=Object.getOwnPropertyDescriptor(IDBRequest.prototype,"result"),x=Object.getOwnPropertyDescriptor(IDBCursor.prototype,"primaryKey"),y=Object.getOwnPropertyDescriptor(IDBCursor.prototype,"key"),z=Object.getOwnPropertyDescriptor(IDBCursorWithValue.prototype,"value");IDBFactory.prototype.cmp=function(b,c){var d=Array.prototype.slice.call(arguments);return b instanceof Array&&(d[0]=i(b)),c instanceof Array&&(d[1]=i(c)),a.apply(this,d)},IDBDatabase.prototype.createObjectStore=function(a,c){return c&&c.keyPath instanceof Array&&(c.keyPath=e(c.keyPath)),b.apply(this,arguments)},IDBObjectStore.prototype.createIndex=function(a,b,d){var f=Array.prototype.slice.call(arguments);return b instanceof Array&&(f[1]=e(b)),c.apply(this,f)},IDBObjectStore.prototype.add=function(a,b){return this.__insertData(f,arguments)},IDBObjectStore.prototype.put=function(a,b){return this.__insertData(j,arguments)},IDBObjectStore.prototype.__insertData=function(a,b){b=Array.prototype.slice.call(b);var c=b[0],e=b[1];if(e instanceof Array&&(b[1]=i(e)),"object"===("undefined"==typeof c?"undefined":_typeof(c))){d(this.keyPath)&&g(c,this.keyPath);for(var f=0;f<this.indexNames.length;f++){var h=this.index(this.indexNames[f]);if(d(h.keyPath))try{g(c,h.keyPath)}catch(j){}}}return a.apply(this,b)},IDBIndex.prototype.get=function(a){var b=Array.prototype.slice.call(arguments);return a instanceof Array&&(b[0]=i(a)),k.apply(this,b)},IDBIndex.prototype.getKey=function(a){var b=Array.prototype.slice.call(arguments);return a instanceof Array&&(b[0]=i(a)),l.apply(this,b)},IDBIndex.prototype.openCursor=function(a){var b=Array.prototype.slice.call(arguments);return a instanceof Array&&(b[0]=i(a)),m.apply(this,b)},IDBIndex.prototype.openKeyCursor=function(a){var b=Array.prototype.slice.call(arguments);return a instanceof Array&&(b[0]=i(a)),n.apply(this,b)},IDBObjectStore.prototype.get=function(a){var b=Array.prototype.slice.call(arguments);return a instanceof Array&&(b[0]=i(a)),o.apply(this,b)},IDBObjectStore.prototype["delete"]=function(a){var b=Array.prototype.slice.call(arguments);return a instanceof Array&&(b[0]=i(a)),p.apply(this,b)},IDBObjectStore.prototype.openCursor=function(a){var b=Array.prototype.slice.call(arguments);return a instanceof Array&&(b[0]=i(a)),q.apply(this,b)},IDBObjectStore.prototype.openKeyCursor=function(a){var b=Array.prototype.slice.call(arguments);return a instanceof Array&&(b[0]=i(a)),r.apply(this,b)},IDBKeyRange.bound=function(a,b,c,d){var e=Array.prototype.slice.call(arguments);return a instanceof Array&&(e[0]=i(a)),b instanceof Array&&(e[1]=i(b)),s.apply(IDBKeyRange,e)},IDBKeyRange.upperBound=function(a,b){var c=Array.prototype.slice.call(arguments);return a instanceof Array&&(c[0]=i(a)),t.apply(IDBKeyRange,c)},IDBKeyRange.lowerBound=function(a,b){var c=Array.prototype.slice.call(arguments);return a instanceof Array&&(c[0]=i(a)),u.apply(IDBKeyRange,c)},IDBKeyRange.only=function(a){var b=Array.prototype.slice.call(arguments);return a instanceof Array&&(b[0]=i(a)),v.apply(IDBKeyRange,b)},Object.defineProperty(IDBRequest.prototype,"result",{enumerable:w.enumerable,configurable:w.configurable,get:function(){var a=w.get.call(this);return h(a)}}),Object.defineProperty(IDBCursor.prototype,"primaryKey",{enumerable:x.enumerable,configurable:x.configurable,get:function(){var a=x.get.call(this);return h(a)}}),Object.defineProperty(IDBCursor.prototype,"key",{enumerable:y.enumerable,configurable:y.configurable,get:function(){var a=y.get.call(this);return h(a)}}),Object.defineProperty(IDBCursorWithValue.prototype,"value",{enumerable:z.enumerable,configurable:z.configurable,get:function(){var a=z.get.call(this);return h(a)}});try{IDBTransaction.VERSION_CHANGE||(IDBTransaction.VERSION_CHANGE="versionchange")}catch(A){}}function d(a){return a&&0===a.indexOf(l+".")}function e(a){for(var b=0;b<a.length;b++)a[b]=a[b].replace(/\./g,n);return l+"."+a.join(o)}function f(a){a=a.substr(l.length+1),a=a.split(o);for(var b=0;b<a.length;b++)a[b]=a[b].replace(m,".");return a}function g(b,c){var d=f(c),e=a.Key.getValue(b,d),g=i(e);c=c.substr(l.length+1),b[l]=b[l]||{},b[l][c]=g}function h(a){return"string"==typeof a&&d(a)?j(a):(a&&"object"===_typeof(a[l])&&delete a[l],a)}function i(b){return a.Key.validate(b),b=a.Key.encode(b),b=l+"."+b,k(b),b}function j(b){return k(b),b=b.substr(l.length+1),b=a.Key.decode(b)}function k(b){if(b.length>889)throw a.util.createDOMException("DataError","The encoded key is "+b.length+" characters long, but IE only allows 889 characters. Consider replacing numeric keys with strings to reduce the encoded length.")}var l="__$$compoundKey",m=/\$\$/g,n="$$$$",o="$_$";a.polyfill=b}(idbModules),function(idbModules){var Sca=function(){return{decycle:function decycle(object,callback){function checkForCompletion(){0===queuedObjects.length&&returnCallback(derezObj)}function readBlobAsDataURL(a,b){var c=new FileReader;c.onloadend=function(c){var d=c.target.result,e="Blob";a instanceof File,updateEncodedBlob(d,b,e)},c.readAsDataURL(a)}function updateEncodedBlob(dataURL,path,blobtype){var encoded=queuedObjects.indexOf(path);path=path.replace("$","derezObj"),eval(path+'.$enc="'+dataURL+'"'),eval(path+'.$type="'+blobtype+'"'),queuedObjects.splice(encoded,1),checkForCompletion()}function derez(a,b){var c,d,e;if(!("object"!==("undefined"==typeof a?"undefined":_typeof(a))||null===a||a instanceof Boolean||a instanceof Date||a instanceof Number||a instanceof RegExp||a instanceof Blob||a instanceof String)){for(c=0;c<objects.length;c+=1)if(objects[c]===a)return{$ref:paths[c]};if(objects.push(a),paths.push(b),"[object Array]"===Object.prototype.toString.apply(a))for(e=[],c=0;c<a.length;c+=1)e[c]=derez(a[c],b+"["+c+"]");else{e={};for(d in a)Object.prototype.hasOwnProperty.call(a,d)&&(e[d]=derez(a[d],b+"["+JSON.stringify(d)+"]"))}return e}return a instanceof Blob?(queuedObjects.push(b),readBlobAsDataURL(a,b)):a instanceof Boolean?a={$type:"Boolean",$enc:a.toString()}:a instanceof Date?a={$type:"Date",$enc:a.getTime()}:a instanceof Number?a={$type:"Number",$enc:a.toString()}:a instanceof RegExp?a={$type:"RegExp",$enc:a.toString()}:"number"==typeof a?a={$type:"number",$enc:a+""}:void 0===a&&(a={$type:"undefined"}),a}var derezObj,objects=[],paths=[],queuedObjects=[],returnCallback=callback;derezObj=derez(object,"$"),checkForCompletion()},retrocycle:function retrocycle($){function dataURLToBlob(a){var b,c,d,e=";base64,";if(-1===a.indexOf(e))return c=a.split(","),b=c[0].split(":")[1],d=c[1],new Blob([d],{type:b});c=a.split(e),b=c[0].split(":")[1],d=(0,_atob2["default"])(c[1]);for(var f=d.length,g=new Uint8Array(f),h=0;f>h;++h)g[h]=d.charCodeAt(h);return new Blob([g.buffer],{type:b})}function rez(value){var i,item,name,path;if(value&&"object"===("undefined"==typeof value?"undefined":_typeof(value)))if("[object Array]"===Object.prototype.toString.apply(value))for(i=0;i<value.length;i+=1)item=value[i],item&&"object"===("undefined"==typeof item?"undefined":_typeof(item))&&(path=item.$ref,"string"==typeof path&&px.test(path)?value[i]=eval(path):value[i]=rez(item));else if(void 0!==value.$type)switch(value.$type){case"Blob":case"File":value=dataURLToBlob(value.$enc);break;case"Boolean":value=Boolean("true"===value.$enc);break;case"Date":value=new Date(value.$enc);break;case"Number":value=Number(value.$enc);break;case"RegExp":value=eval(value.$enc);break;case"number":value=parseFloat(value.$enc);break;case"undefined":value=void 0}else for(name in value)"object"===_typeof(value[name])&&(item=value[name],item&&(path=item.$ref,"string"==typeof path&&px.test(path)?value[name]=eval(path):value[name]=rez(item)));return value}var px=/^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;return rez($)},encode:function(a,b){function c(a){b(JSON.stringify(a))}this.decycle(a,c)},decode:function(a){return this.retrocycle(JSON.parse(a))}}}();idbModules.Sca=Sca}(idbModules),function(idbModules){function padBase32Exponent(a){return a=a.toString(32),1===a.length?"0"+a:a}function padBase32Mantissa(a){return(a+zeros(11)).slice(0,11)}function flipBase32(a){for(var b="",c=0;c<a.length;c++)b+=(31-parseInt(a[c],32)).toString(32);return b}function pow32(a,b){var c,d,e;return b=parseInt(b,32),0>b?roundToPrecision(parseInt(a,32)*Math.pow(32,b-10)):11>b?(c=a.slice(0,b),c=parseInt(c,32),d=a.slice(b),d=parseInt(d,32)*Math.pow(32,b-11),roundToPrecision(c+d)):(e=a+zeros(b-11),parseInt(e,32))}function roundToPrecision(a,b){return b=b||16,parseFloat(a.toPrecision(b))}function zeros(a){for(var b="";a--;)b+="0";return b}function negate(a){return"-"+a}function getType(a){return a instanceof Date?"date":a instanceof Array?"array":"undefined"==typeof a?"undefined":_typeof(a)}function validate(a){var b=getType(a);if("array"===b)for(var c=0;c<a.length;c++)validate(a[c]);else if(!types[b]||"string"!==b&&isNaN(a))throw idbModules.util.createDOMException("DataError","Not a valid key")}function getValue(source,keyPath){try{if(keyPath instanceof Array){for(var arrayValue=[],i=0;i<keyPath.length;i++)arrayValue.push(eval("source."+keyPath[i]));return arrayValue}return eval("source."+keyPath)}catch(e){return}}function setValue(a,b,c){for(var d=b.split("."),e=0;e<d.length-1;e++){var f=d[e];a=a[f]=a[f]||{}}a[d[d.length-1]]=c}function isMultiEntryMatch(a,b){var c=collations[b.substring(0,1)];return"array"===c?b.indexOf(a)>1:b===a}function isKeyInRange(a,b){var c=void 0===b.lower,d=void 0===b.upper,e=idbModules.Key.encode(a,!0);return void 0!==b.lower&&(b.lowerOpen&&e>b.__lower&&(c=!0),!b.lowerOpen&&e>=b.__lower&&(c=!0)),void 0!==b.upper&&(b.upperOpen&&e<b.__upper&&(d=!0),!b.upperOpen&&e<=b.__upper&&(d=!0)),c&&d}function findMultiEntryMatches(a,b){var c=[];if(a instanceof Array)for(var d=0;d<a.length;d++){var e=a[d];if(e instanceof Array){if(b.lower===b.upper)continue;if(1!==e.length){var f=findMultiEntryMatches(e,b);f.length>0&&c.push(e);continue}e=e[0]}isKeyInRange(e,b)&&c.push(e)}else isKeyInRange(a,b)&&c.push(a);return c}var collations=["undefined","number","date","string","array"],signValues=["negativeInfinity","bigNegative","smallNegative","smallPositive","bigPositive","positiveInfinity"],types={undefined:{encode:function(a){return collations.indexOf("undefined")+"-"},decode:function(a){}},date:{encode:function(a){return collations.indexOf("date")+"-"+a.toJSON()},decode:function(a){return new Date(a.substring(2))}},number:{encode:function(a){var b=Math.abs(a).toString(32),c=b.indexOf(".");b=-1!==c?b.replace(".",""):b;var d=b.search(/[^0]/);b=b.slice(d);var e,f=zeros(2),g=zeros(11);return isFinite(a)?0>a?a>-1?(e=signValues.indexOf("smallNegative"),f=padBase32Exponent(d),g=flipBase32(padBase32Mantissa(b))):(e=signValues.indexOf("bigNegative"),f=flipBase32(padBase32Exponent(-1!==c?c:b.length)),g=flipBase32(padBase32Mantissa(b))):1>a?(e=signValues.indexOf("smallPositive"),f=flipBase32(padBase32Exponent(d)),g=padBase32Mantissa(b)):(e=signValues.indexOf("bigPositive"),f=padBase32Exponent(-1!==c?c:b.length),g=padBase32Mantissa(b)):e=signValues.indexOf(a>0?"positiveInfinity":"negativeInfinity"),collations.indexOf("number")+"-"+e+f+g},decode:function(a){var b=+a.substr(2,1),c=a.substr(3,2),d=a.substr(5,11);switch(signValues[b]){case"negativeInfinity":return-(1/0);case"positiveInfinity":return 1/0;case"bigPositive":return pow32(d,c);case"smallPositive":return c=negate(flipBase32(c)),pow32(d,c);case"smallNegative":return c=negate(c),d=flipBase32(d),-pow32(d,c);case"bigNegative":return c=flipBase32(c),d=flipBase32(d),-pow32(d,c);default:throw new Error("Invalid number.")}}},string:{encode:function(a,b){return b&&(a=a.replace(/(.)/g,"-$1")+" "),collations.indexOf("string")+"-"+a},decode:function(a,b){return a=a.substring(2),b&&(a=a.substr(0,a.length-1).replace(/-(.)/g,"$1")),a}},array:{encode:function(a){for(var b=[],c=0;c<a.length;c++){var d=a[c],e=idbModules.Key.encode(d,!0);b[c]=e}return b.push(collations.indexOf("undefined")+"-"),collations.indexOf("array")+"-"+JSON.stringify(b)},decode:function(a){var b=JSON.parse(a.substring(2));b.pop();for(var c=0;c<b.length;c++){var d=b[c],e=idbModules.Key.decode(d,!0);b[c]=e}return b}}};idbModules.Key={encode:function(a,b){return void 0===a?null:types[getType(a)].encode(a,b)},decode:function(a,b){return"string"==typeof a?types[collations[a.substring(0,1)]].decode(a,b):void 0},validate:validate,getValue:getValue,setValue:setValue,isMultiEntryMatch:isMultiEntryMatch,findMultiEntryMatches:findMultiEntryMatches}}(idbModules),function(a){function b(a,b){var c=new Event(a);return c.debug=b,Object.defineProperty(c,"target",{writable:!0}),c}function c(a,b){this.type=a,this.debug=b,this.bubbles=!1,this.cancelable=!1,this.eventPhase=0,this.timeStamp=(new Date).valueOf()}var d=!1;try{var e=b("test type","test debug"),f={test:"test target"};e.target=f,e instanceof Event&&"test type"===e.type&&"test debug"===e.debug&&e.target===f&&(d=!0)}catch(g){}d?(a.Event=Event,a.IDBVersionChangeEvent=Event,a.util.createEvent=b):(a.Event=c,a.IDBVersionChangeEvent=c,a.util.createEvent=function(a,b){return new c(a,b)})}(idbModules),function(a){function b(a,b){var c=new DOMException.prototype.constructor(0,b);return c.name=a||"DOMException",c.message=b,c}function c(a,b){a=a||"DOMError";var c=new DOMError(a,b);return c.name===a||(c.name=a),c.message===b||(c.message=b),c}function d(a,b){var c=new Error(b);return c.name=a||"DOMException",c.message=b,c}a.util.logError=function(b,c,d){if(a.DEBUG){d&&d.message&&(d=d.message);var e="function"==typeof console.error?"error":"log";console[e](b+": "+c+". "+(d||"")),console.trace&&console.trace()}},a.util.findError=function(a){var b;if(a){if(1===a.length)return a[0];for(var c=0;c<a.length;c++){var d=a[c];if(d instanceof Error||d instanceof DOMException)return d;d&&"string"==typeof d.message&&(b=d)}}return b};var e,f=!1,g=!1;try{e=b("test name","test message"),e instanceof DOMException&&"test name"===e.name&&"test message"===e.message&&(f=!0)}catch(h){}try{e=c("test name","test message"),e instanceof DOMError&&"test name"===e.name&&"test message"===e.message&&(g=!0)}catch(h){}f?(a.DOMException=DOMException,a.util.createDOMException=function(c,d,e){return a.util.logError(c,d,e),b(c,d)}):(a.DOMException=Error,a.util.createDOMException=function(b,c,e){return a.util.logError(b,c,e),d(b,c)}),g?(a.DOMError=DOMError,a.util.createDOMError=function(b,d,e){return a.util.logError(b,d,e),c(b,d)}):(a.DOMError=Error,a.util.createDOMError=function(b,c,e){return a.util.logError(b,c,e),d(b,c)})}(idbModules),function(a){function b(){this.onsuccess=this.onerror=this.result=this.error=this.source=this.transaction=null,this.readyState="pending"}function c(){this.onblocked=this.onupgradeneeded=null}c.prototype=new b,c.prototype.constructor=c,a.IDBRequest=b,a.IDBOpenDBRequest=c}(idbModules),function(a,b){function c(c,d,e,f){c!==b&&a.Key.validate(c),d!==b&&a.Key.validate(d),this.lower=c,this.upper=d,this.lowerOpen=!!e,this.upperOpen=!!f}c.only=function(a){return new c(a,a,!1,!1)},c.lowerBound=function(a,d){return new c(a,b,d,b)},c.upperBound=function(a,d){return new c(b,a,b,d)},c.bound=function(a,b,d,e){return new c(a,b,d,e)},a.IDBKeyRange=c}(idbModules),function(a,b){function c(c,d,e,f,g,h,i){if(null===c&&(c=b),c===b||c instanceof a.IDBKeyRange||(c=new a.IDBKeyRange(c,c,!1,!1)),e.transaction.__assertActive(),d!==b&&-1===["next","prev","nextunique","prevunique"].indexOf(d))throw new TypeError(d+"is not a valid cursor direction");this.source=f,this.direction=d||"next",this.key=b,this.primaryKey=b,this.__store=e,this.__range=c,this.__req=new a.IDBRequest,this.__keyColumnName=g,this.__valueColumnName=h,this.__valueDecoder="value"===h?a.Sca:a.Key,this.__count=i,this.__offset=-1,this.__lastKeyContinued=b,this.__multiEntryIndex=f instanceof a.IDBIndex?f.multiEntry:!1,this.__unique=-1!==this.direction.indexOf("unique"),c!==b&&(c.__lower=c.lower!==b&&a.Key.encode(c.lower,this.__multiEntryIndex),c.__upper=c.upper!==b&&a.Key.encode(c.upper,this.__multiEntryIndex)),this["continue"]()}c.prototype.__find=function(){var a=Array.prototype.slice.call(arguments);this.__multiEntryIndex?this.__findMultiEntry.apply(this,a):this.__findBasic.apply(this,a)},c.prototype.__findBasic=function(c,d,e,f,g){g=g||1;var h=this,i=a.util.quote(h.__keyColumnName),j=["SELECT * FROM",a.util.quote(h.__store.name)],k=[];j.push("WHERE",i,"NOT NULL"),!h.__range||h.__range.lower===b&&h.__range.upper===b||(j.push("AND"),h.__range.lower!==b&&(j.push(i,h.__range.lowerOpen?">":">=","?"),k.push(h.__range.__lower)),h.__range.lower!==b&&h.__range.upper!==b&&j.push("AND"),h.__range.upper!==b&&(j.push(i,h.__range.upperOpen?"<":"<=","?"),k.push(h.__range.__upper))),"undefined"!=typeof c&&(h.__lastKeyContinued=c,h.__offset=0),h.__lastKeyContinued!==b&&(j.push("AND",i,">= ?"),a.Key.validate(h.__lastKeyContinued),k.push(a.Key.encode(h.__lastKeyContinued)));var l="prev"===h.direction||"prevunique"===h.direction?"DESC":"ASC";h.__count||(j.push("ORDER BY",i,l),j.push("LIMIT",g,"OFFSET",h.__offset)),j=j.join(" "),a.DEBUG&&console.log(j,k),h.__prefetchedData=null,h.__prefetchedIndex=0,d.executeSql(j,k,function(c,d){h.__count?e(b,d.rows.length,b):d.rows.length>1?(h.__prefetchedData=d.rows,h.__prefetchedIndex=0,a.DEBUG&&console.log("Preloaded "+h.__prefetchedData.length+" records for cursor"),h.__decode(d.rows.item(0),e)):1===d.rows.length?h.__decode(d.rows.item(0),e):(a.DEBUG&&console.log("Reached end of cursors"),e(b,b,b))},function(b,c){a.DEBUG&&console.log("Could not execute Cursor.continue",j,k),f(c)})},c.prototype.__findMultiEntry=function(c,d,e,f){var g=this;if(g.__prefetchedData&&g.__prefetchedData.length===g.__prefetchedIndex)return a.DEBUG&&console.log("Reached end of multiEntry cursor"),void e(b,b,b);var h=a.util.quote(g.__keyColumnName),i=["SELECT * FROM",a.util.quote(g.__store.name)],j=[];i.push("WHERE",h,"NOT NULL"),g.__range&&g.__range.lower!==b&&g.__range.upper!==b&&0===g.__range.upper.indexOf(g.__range.lower)&&(i.push("AND",h,"LIKE ?"),j.push("%"+g.__range.__lower.slice(0,-1)+"%")),"undefined"!=typeof c&&(g.__lastKeyContinued=c,g.__offset=0),g.__lastKeyContinued!==b&&(i.push("AND",h,">= ?"),a.Key.validate(g.__lastKeyContinued),j.push(a.Key.encode(g.__lastKeyContinued)));var k="prev"===g.direction||"prevunique"===g.direction?"DESC":"ASC";g.__count||i.push("ORDER BY key",k),i=i.join(" "),a.DEBUG&&console.log(i,j),g.__prefetchedData=null,g.__prefetchedIndex=0,d.executeSql(i,j,function(c,d){if(g.__multiEntryOffset=d.rows.length,d.rows.length>0){for(var f=[],h=0;h<d.rows.length;h++)for(var i=d.rows.item(h),j=a.Key.decode(i[g.__keyColumnName],!0),k=a.Key.findMultiEntryMatches(j,g.__range),l=0;l<k.length;l++){var m=k[l],n={matchingKey:a.Key.encode(m,!0),key:i.key};n[g.__keyColumnName]=i[g.__keyColumnName],n[g.__valueColumnName]=i[g.__valueColumnName],f.push(n)}var o=0===g.direction.indexOf("prev");f.sort(function(a,b){return a.matchingKey.replace("[","z")<b.matchingKey.replace("[","z")?o?1:-1:a.matchingKey.replace("[","z")>b.matchingKey.replace("[","z")?o?-1:1:a.key<b.key?"prev"===g.direction?1:-1:a.key>b.key?"prev"===g.direction?-1:1:0}),g.__prefetchedData={data:f,length:f.length,item:function(a){return this.data[a]}},g.__prefetchedIndex=0,g.__count?e(b,f.length,b):f.length>1?(a.DEBUG&&console.log("Preloaded "+g.__prefetchedData.length+" records for multiEntry cursor"),g.__decode(f[0],e)):1===f.length?(a.DEBUG&&console.log("Reached end of multiEntry cursor"),g.__decode(f[0],e)):(a.DEBUG&&console.log("Reached end of multiEntry cursor"),e(b,b,b))}else a.DEBUG&&console.log("Reached end of multiEntry cursor"),e(b,b,b)},function(b,c){a.DEBUG&&console.log("Could not execute Cursor.continue",i,j),f(c)})},c.prototype.__onsuccess=function(a){var c=this;return function(d,e,f){if(c.__count)a(e,c.__req);else{c.key=d===b?null:d,c.value=e===b?null:e,c.primaryKey=f===b?null:f;var g=d===b?null:c;a(g,c.__req)}}},c.prototype.__decode=function(c,d){if(this.__multiEntryIndex&&this.__unique){if(this.__matchedKeys||(this.__matchedKeys={}),this.__matchedKeys[c.matchingKey])return void d(b,b,b);this.__matchedKeys[c.matchingKey]=!0}var e=a.Key.decode(this.__multiEntryIndex?c.matchingKey:c[this.__keyColumnName],this.__multiEntryIndex),f=this.__valueDecoder.decode(c[this.__valueColumnName]),g=a.Key.decode(c.key);d(e,f,g)},c.prototype["continue"]=function(b){var c=a.cursorPreloadPackSize||100,d=this;this.__store.transaction.__pushToQueue(d.__req,function(a,e,f,g){return d.__offset++,d.__prefetchedData&&(d.__prefetchedIndex++,d.__prefetchedIndex<d.__prefetchedData.length)?void d.__decode(d.__prefetchedData.item(d.__prefetchedIndex),d.__onsuccess(f)):void d.__find(b,a,d.__onsuccess(f),g,c)})},c.prototype.advance=function(c){if(0>=c)throw a.util.createDOMException("Type Error","Count is invalid - 0 or negative",c);var d=this;this.__store.transaction.__pushToQueue(d.__req,function(a,e,f,g){d.__offset+=c,d.__find(b,a,d.__onsuccess(f),g)})},c.prototype.update=function(c){var d=this;return d.__store.transaction.__assertWritable(),d.__store.transaction.__addToTransactionQueue(function(e,f,g,h){a.Sca.encode(c,function(f){d.__find(b,e,function(b,i,j){var k=d.__store,l=[f],m=["UPDATE",a.util.quote(k.name),"SET value = ?"];a.Key.validate(j);for(var n=0;n<k.indexNames.length;n++){var o=k.__indexes[k.indexNames[n]],p=a.Key.getValue(c,o.keyPath);m.push(",",a.util.quote(o.name),"= ?"),l.push(a.Key.encode(p,o.multiEntry))}m.push("WHERE key = ?"),l.push(a.Key.encode(j)),a.DEBUG&&console.log(m.join(" "),f,b,j),e.executeSql(m.join(" "),l,function(a,c){d.__prefetchedData=null,d.__prefetchedIndex=0,1===c.rowsAffected?g(b):h("No rows with key found"+b)},function(a,b){h(b)})},h)})})},c.prototype["delete"]=function(){var c=this;return c.__store.transaction.__assertWritable(),this.__store.transaction.__addToTransactionQueue(function(d,e,f,g){c.__find(b,d,function(e,h,i){var j="DELETE FROM  "+a.util.quote(c.__store.name)+" WHERE key = ?";a.DEBUG&&console.log(j,e,i),a.Key.validate(i),d.executeSql(j,[a.Key.encode(i)],function(a,d){c.__prefetchedData=null,c.__prefetchedIndex=0,1===d.rowsAffected?(c.__offset--,f(b)):g("No rows with key found"+e)},function(a,b){g(b)})},g)})},a.IDBCursor=c}(idbModules),function(a,b){function c(a,b){this.objectStore=a,this.name=b.columnName,this.keyPath=b.keyPath,this.multiEntry=b.optionalParams&&b.optionalParams.multiEntry,this.unique=b.optionalParams&&b.optionalParams.unique,this.__deleted=!!b.__deleted}c.__clone=function(a,b){return new c(b,{columnName:a.name,keyPath:a.keyPath,optionalParams:{multiEntry:a.multiEntry,unique:a.unique}})},c.__createIndex=function(b,d){var e=!!b.__indexes[d.name]&&b.__indexes[d.name].__deleted;b.__indexes[d.name]=d,b.indexNames.push(d.name);var f=b.transaction;f.__addToTransactionQueue(function(f,g,h,i){function j(b,c){i(a.util.createDOMException(0,'Could not create index "'+d.name+'"',c))}function k(e){c.__updateIndexList(b,e,function(){e.executeSql("SELECT * FROM "+a.util.quote(b.name),[],function(c,e){function f(g){if(g<e.rows.length)try{var i=a.Sca.decode(e.rows.item(g).value),k=a.Key.getValue(i,d.keyPath);k=a.Key.encode(k,d.multiEntry),c.executeSql("UPDATE "+a.util.quote(b.name)+" set "+a.util.quote(d.name)+" = ? where key = ?",[k,e.rows.item(g).key],function(a,b){f(g+1)},j)}catch(l){f(g+1)}else h(b)}a.DEBUG&&console.log("Adding existing "+b.name+" records to the "+d.name+" index"),f(0)},j)},j)}if(e)k(f);else{var l=["ALTER TABLE",a.util.quote(b.name),"ADD",a.util.quote(d.name),"BLOB"].join(" ");a.DEBUG&&console.log(l),f.executeSql(l,[],k,j)}})},c.__deleteIndex=function(b,d){b.__indexes[d.name].__deleted=!0,b.indexNames.splice(b.indexNames.indexOf(d.name),1);var e=b.transaction;e.__addToTransactionQueue(function(e,f,g,h){function i(b,c){h(a.util.createDOMException(0,'Could not delete index "'+d.name+'"',c))}c.__updateIndexList(b,e,g,i)})},c.__updateIndexList=function(b,c,d,e){for(var f={},g=0;g<b.indexNames.length;g++){var h=b.__indexes[b.indexNames[g]];f[h.name]={columnName:h.name,keyPath:h.keyPath,optionalParams:{unique:h.unique,multiEntry:h.multiEntry},deleted:!!h.deleted}}a.DEBUG&&console.log("Updating the index list for "+b.name,f),c.executeSql("UPDATE __sys__ set indexList = ? where name = ?",[JSON.stringify(f),b.name],function(){d(b)},e)},c.prototype.__fetchIndexData=function(c,d){var e,f,g=this;return 1===arguments.length?(d=c,e=!1):(a.Key.validate(c),f=a.Key.encode(c,g.multiEntry),e=!0),g.objectStore.transaction.__addToTransactionQueue(function(c,h,i,j){var k=["SELECT * FROM",a.util.quote(g.objectStore.name),"WHERE",a.util.quote(g.name),"NOT NULL"],l=[];e&&(g.multiEntry?(k.push("AND",a.util.quote(g.name),"LIKE ?"),l.push("%"+f+"%")):(k.push("AND",a.util.quote(g.name),"= ?"),l.push(f))),a.DEBUG&&console.log("Trying to fetch data for Index",k.join(" "),l),c.executeSql(k.join(" "),l,function(c,h){var j=0,k=null;if(g.multiEntry)for(var l=0;l<h.rows.length;l++){var m=h.rows.item(l),n=a.Key.decode(m[g.name]);e&&a.Key.isMultiEntryMatch(f,m[g.name])?(j++,k=k||m):e||n===b||(j+=n instanceof Array?n.length:1,k=k||m)}else j=h.rows.length,k=j&&h.rows.item(0);i("count"===d?j:0===j?b:"key"===d?a.Key.decode(k.key):a.Sca.decode(k.value))},j)})},c.prototype.openCursor=function(b,c){return new a.IDBCursor(b,c,this.objectStore,this,this.name,"value").__req},c.prototype.openKeyCursor=function(b,c){return new a.IDBCursor(b,c,this.objectStore,this,this.name,"key").__req},c.prototype.get=function(a){if(0===arguments.length)throw new TypeError("No key was specified");return this.__fetchIndexData(a,"value")},c.prototype.getKey=function(a){if(0===arguments.length)throw new TypeError("No key was specified");return this.__fetchIndexData(a,"key")},c.prototype.count=function(c){return c===b?this.__fetchIndexData("count"):c instanceof a.IDBKeyRange?new a.IDBCursor(c,"next",this.objectStore,this,this.name,"value",!0).__req:this.__fetchIndexData(c,"count")},a.IDBIndex=c}(idbModules),function(a){function b(b,c){this.name=b.name,this.keyPath=JSON.parse(b.keyPath),this.transaction=c,this.autoIncrement="string"==typeof b.autoInc?"true"===b.autoInc:!!b.autoInc,this.__indexes={},this.indexNames=new a.util.StringList;var d=JSON.parse(b.indexList);for(var e in d)if(d.hasOwnProperty(e)){var f=new a.IDBIndex(this,d[e]);this.__indexes[f.name]=f,f.__deleted||this.indexNames.push(f.name)}}b.__clone=function(a,c){var d=new b({name:a.name,keyPath:JSON.stringify(a.keyPath),autoInc:JSON.stringify(a.autoIncrement),indexList:"{}"},c);return d.__indexes=a.__indexes,d.indexNames=a.indexNames,d},b.__createObjectStore=function(b,c){b.__objectStores[c.name]=c,b.objectStoreNames.push(c.name);var d=b.__versionTransaction;a.IDBTransaction.__assertVersionChange(d),d.__addToTransactionQueue(function(b,d,e,f){function g(b,d){throw a.util.createDOMException(0,'Could not create object store "'+c.name+'"',d)}var h=["CREATE TABLE",a.util.quote(c.name),"(key BLOB",c.autoIncrement?"UNIQUE, inc INTEGER PRIMARY KEY AUTOINCREMENT":"PRIMARY KEY",", value BLOB)"].join(" ");a.DEBUG&&console.log(h),b.executeSql(h,[],function(a,b){a.executeSql("INSERT INTO __sys__ VALUES (?,?,?,?)",[c.name,JSON.stringify(c.keyPath),c.autoIncrement,"{}"],function(){e(c)},g)},g)})},b.__deleteObjectStore=function(b,c){b.__objectStores[c.name]=void 0,b.objectStoreNames.splice(b.objectStoreNames.indexOf(c.name),1);var d=b.__versionTransaction;a.IDBTransaction.__assertVersionChange(d),d.__addToTransactionQueue(function(b,d,e,f){function g(b,c){f(a.util.createDOMException(0,"Could not delete ObjectStore",c))}b.executeSql("SELECT * FROM __sys__ where name = ?",[c.name],function(b,d){d.rows.length>0&&b.executeSql("DROP TABLE "+a.util.quote(c.name),[],function(){b.executeSql("DELETE FROM __sys__ WHERE name = ?",[c.name],function(){e()},g)},g)})})},b.prototype.__validateKey=function(b,c){if(this.keyPath){if("undefined"!=typeof c)throw a.util.createDOMException("DataError","The object store uses in-line keys and the key parameter was provided",this);if(!b||"object"!==("undefined"==typeof b?"undefined":_typeof(b)))throw a.util.createDOMException("DataError","KeyPath was specified, but value was not an object");if(c=a.Key.getValue(b,this.keyPath),void 0===c){if(this.autoIncrement)return;throw a.util.createDOMException("DataError","Could not eval key from keyPath")}}else if("undefined"==typeof c){if(this.autoIncrement)return;throw a.util.createDOMException("DataError","The object store uses out-of-line keys and has no key generator and the key parameter was not provided. ",this)}a.Key.validate(c)},b.prototype.__deriveKey=function(b,c,d,e,f){function g(c){b.executeSql("SELECT * FROM sqlite_sequence where name like ?",[h.name],function(a,b){c(1!==b.rows.length?1:b.rows.item(0).seq+1)},function(b,c){f(a.util.createDOMException("DataError","Could not get the auto increment value for key",c))})}var h=this;if(h.keyPath){var i=a.Key.getValue(c,h.keyPath);void 0===i&&h.autoIncrement?g(function(b){try{a.Key.setValue(c,h.keyPath,b),e(b)}catch(d){f(a.util.createDOMException("DataError","Could not assign a generated value to the keyPath",d))}}):e(i)}else"undefined"==typeof d&&h.autoIncrement?g(e):e(d)},b.prototype.__insertData=function(b,c,d,e,f,g){try{var h={};"undefined"!=typeof e&&(a.Key.validate(e),h.key=a.Key.encode(e));for(var i=0;i<this.indexNames.length;i++){var j=this.__indexes[this.indexNames[i]];h[j.name]=a.Key.encode(a.Key.getValue(d,j.keyPath),j.multiEntry)}var k=["INSERT INTO ",a.util.quote(this.name),"("],l=[" VALUES ("],m=[];
for(var n in h)k.push(a.util.quote(n)+","),l.push("?,"),m.push(h[n]);k.push("value )"),l.push("?)"),m.push(c);var o=k.join(" ")+l.join(" ");a.DEBUG&&console.log("SQL for adding",o,m),b.executeSql(o,m,function(b,c){a.Sca.encode(e,function(b){b=a.Sca.decode(b),f(b)})},function(b,c){g(a.util.createDOMError("ConstraintError",c.message,c))})}catch(p){g(p)}},b.prototype.add=function(b,c){var d=this;if(0===arguments.length)throw new TypeError("No value was specified");this.__validateKey(b,c),d.transaction.__assertWritable();var e=d.transaction.__createRequest();return d.transaction.__pushToQueue(e,function(e,f,g,h){d.__deriveKey(e,b,c,function(c){a.Sca.encode(b,function(a){d.__insertData(e,a,b,c,g,h)})},h)}),e},b.prototype.put=function(b,c){var d=this;if(0===arguments.length)throw new TypeError("No value was specified");this.__validateKey(b,c),d.transaction.__assertWritable();var e=d.transaction.__createRequest();return d.transaction.__pushToQueue(e,function(e,f,g,h){d.__deriveKey(e,b,c,function(c){a.Sca.encode(b,function(f){a.Key.validate(c);var i="DELETE FROM "+a.util.quote(d.name)+" where key = ?";e.executeSql(i,[a.Key.encode(c)],function(e,i){a.DEBUG&&console.log("Did the row with the",c,"exist? ",i.rowsAffected),d.__insertData(e,f,b,c,g,h)},function(a,b){h(b)})})},h)}),e},b.prototype.get=function(b){var c=this;if(0===arguments.length)throw new TypeError("No key was specified");a.Key.validate(b);var d=a.Key.encode(b);return c.transaction.__addToTransactionQueue(function(b,e,f,g){a.DEBUG&&console.log("Fetching",c.name,d),b.executeSql("SELECT * FROM "+a.util.quote(c.name)+" where key = ?",[d],function(b,c){a.DEBUG&&console.log("Fetched data",c);var d;try{if(0===c.rows.length)return f();d=a.Sca.decode(c.rows.item(0).value)}catch(e){a.DEBUG&&console.log(e)}f(d)},function(a,b){g(b)})})},b.prototype["delete"]=function(b){var c=this;if(0===arguments.length)throw new TypeError("No key was specified");c.transaction.__assertWritable(),a.Key.validate(b);var d=a.Key.encode(b);return c.transaction.__addToTransactionQueue(function(b,e,f,g){a.DEBUG&&console.log("Fetching",c.name,d),b.executeSql("DELETE FROM "+a.util.quote(c.name)+" where key = ?",[d],function(b,c){a.DEBUG&&console.log("Deleted from database",c.rowsAffected),f()},function(a,b){g(b)})})},b.prototype.clear=function(){var b=this;return b.transaction.__assertWritable(),b.transaction.__addToTransactionQueue(function(c,d,e,f){c.executeSql("DELETE FROM "+a.util.quote(b.name),[],function(b,c){a.DEBUG&&console.log("Cleared all records from database",c.rowsAffected),e()},function(a,b){f(b)})})},b.prototype.count=function(b){if(b instanceof a.IDBKeyRange)return new a.IDBCursor(b,"next",this,this,"key","value",!0).__req;var c=this,d=!1;return void 0!==b&&(d=!0,a.Key.validate(b)),c.transaction.__addToTransactionQueue(function(e,f,g,h){var i="SELECT * FROM "+a.util.quote(c.name)+(d?" WHERE key = ?":""),j=[];d&&j.push(a.Key.encode(b)),e.executeSql(i,j,function(a,b){g(b.rows.length)},function(a,b){h(b)})})},b.prototype.openCursor=function(b,c){return new a.IDBCursor(b,c,this,this,"key","value").__req},b.prototype.index=function(b){if(0===arguments.length)throw new TypeError("No index name was specified");var c=this.__indexes[b];if(!c)throw a.util.createDOMException("NotFoundError",'Index "'+b+'" does not exist on '+this.name);return a.IDBIndex.__clone(c,this)},b.prototype.createIndex=function(b,c,d){if(0===arguments.length)throw new TypeError("No index name was specified");if(1===arguments.length)throw new TypeError("No key path was specified");if(c instanceof Array&&d&&d.multiEntry)throw a.util.createDOMException("InvalidAccessError","The keyPath argument was an array and the multiEntry option is true.");if(this.__indexes[b]&&!this.__indexes[b].__deleted)throw a.util.createDOMException("ConstraintError",'Index "'+b+'" already exists on '+this.name);this.transaction.__assertVersionChange(),d=d||{};var e={columnName:b,keyPath:c,optionalParams:{unique:!!d.unique,multiEntry:!!d.multiEntry}},f=new a.IDBIndex(this,e);return a.IDBIndex.__createIndex(this,f),f},b.prototype.deleteIndex=function(b){if(0===arguments.length)throw new TypeError("No index name was specified");var c=this.__indexes[b];if(!c)throw a.util.createDOMException("NotFoundError",'Index "'+b+'" does not exist on '+this.name);this.transaction.__assertVersionChange(),a.IDBIndex.__deleteIndex(this,c)},a.IDBObjectStore=b}(idbModules),function(a){function b(a,b,d){this.__id=++c,this.__active=!0,this.__running=!1,this.__errored=!1,this.__requests=[],this.__storeNames=b,this.mode=d,this.db=a,this.error=null,this.onabort=this.onerror=this.oncomplete=null;var e=this;setTimeout(function(){e.__executeRequests()},0)}var c=0;b.prototype.__executeRequests=function(){function b(b){if(a.util.logError("Error","An error occurred in a transaction",b),!d.__errored){if(d.__errored=!0,!d.__active)throw b;try{d.error=b;var c=a.util.createEvent("error");a.util.callback("onerror",d,c),a.util.callback("onerror",d.db,c)}finally{d.abort()}}}function c(){a.DEBUG&&console.log("Transaction completed");var b=a.util.createEvent("complete");try{a.util.callback("oncomplete",d,b),a.util.callback("__oncomplete",d,b)}catch(c){throw d.__errored=!0,c}}if(this.__running)return void(a.DEBUG&&console.log("Looks like the request set is already running",this.mode));this.__running=!0;var d=this;d.db.__db.transaction(function(e){function f(b,c){c&&(i.req=c),i.req.readyState="done",i.req.result=b,delete i.req.error;var d=a.util.createEvent("success");a.util.callback("onsuccess",i.req,d),j++,h()}function g(c,d){d=a.util.findError(arguments);try{i.req.readyState="done",i.req.error=d||"DOMError",i.req.result=void 0;var e=a.util.createEvent("error",d);a.util.callback("onerror",i.req,e)}finally{b(d)}}function h(){if(j>=d.__requests.length)d.__requests=[],d.__active&&(d.__active=!1,c());else try{i=d.__requests[j],i.op(e,i.args,f,g)}catch(a){g(a)}}d.__tx=e;var i=null,j=0;h()},function(a){b(a)})},b.prototype.__createRequest=function(){var b=new a.IDBRequest;return b.source=this.db,b.transaction=this,b},b.prototype.__addToTransactionQueue=function(a,b){var c=this.__createRequest();return this.__pushToQueue(c,a,b),c},b.prototype.__pushToQueue=function(a,b,c){this.__assertActive(),this.__requests.push({op:b,args:c,req:a})},b.prototype.__assertActive=function(){if(!this.__active)throw a.util.createDOMException("TransactionInactiveError","A request was placed against a transaction which is currently not active, or which is finished")},b.prototype.__assertWritable=function(){if(this.mode===b.READ_ONLY)throw a.util.createDOMException("ReadOnlyError","The transaction is read only")},b.prototype.__assertVersionChange=function(){b.__assertVersionChange(this)},b.__assertVersionChange=function(c){if(!c||c.mode!==b.VERSION_CHANGE)throw a.util.createDOMException("InvalidStateError","Not a version transaction")},b.prototype.objectStore=function(c){if(0===arguments.length)throw new TypeError("No object store name was specified");if(!this.__active)throw a.util.createDOMException("InvalidStateError","A request was placed against a transaction which is currently not active, or which is finished");if(-1===this.__storeNames.indexOf(c)&&this.mode!==b.VERSION_CHANGE)throw a.util.createDOMException("NotFoundError",c+" is not participating in this transaction");var d=this.db.__objectStores[c];if(!d)throw a.util.createDOMException("NotFoundError",c+" does not exist in "+this.db.name);return a.IDBObjectStore.__clone(d,this)},b.prototype.abort=function(){var b=this;a.DEBUG&&console.log("The transaction was aborted",b),b.__active=!1;var c=a.util.createEvent("abort");setTimeout(function(){a.util.callback("onabort",b,c)},0)},Object.assign(b.prototype,_eventtarget2["default"].prototype),b.READ_ONLY="readonly",b.READ_WRITE="readwrite",b.VERSION_CHANGE="versionchange",a.IDBTransaction=b}(idbModules),function(a){function b(b,c,d,e){this.__db=b,this.__closed=!1,this.version=d,this.name=c,this.onabort=this.onerror=this.onversionchange=null,this.__objectStores={},this.objectStoreNames=new a.util.StringList;for(var f=0;f<e.rows.length;f++){var g=new a.IDBObjectStore(e.rows.item(f));this.__objectStores[g.name]=g,this.objectStoreNames.push(g.name)}}b.prototype.createObjectStore=function(b,c){if(0===arguments.length)throw new TypeError("No object store name was specified");if(this.__objectStores[b])throw a.util.createDOMException("ConstraintError",'Object store "'+b+'" already exists in '+this.name);this.__versionTransaction.__assertVersionChange(),c=c||{};var d={name:b,keyPath:JSON.stringify(c.keyPath||null),autoInc:JSON.stringify(c.autoIncrement),indexList:"{}"},e=new a.IDBObjectStore(d,this.__versionTransaction);return a.IDBObjectStore.__createObjectStore(this,e),e},b.prototype.deleteObjectStore=function(b){if(0===arguments.length)throw new TypeError("No object store name was specified");var c=this.__objectStores[b];if(!c)throw a.util.createDOMException("NotFoundError",'Object store "'+b+'" does not exist in '+this.name);this.__versionTransaction.__assertVersionChange(),a.IDBObjectStore.__deleteObjectStore(this,c)},b.prototype.close=function(){this.__closed=!0},b.prototype.transaction=function(b,c){if(this.__closed)throw a.util.createDOMException("InvalidStateError","An attempt was made to start a new transaction on a database connection that is not open");if("number"==typeof c?(c=1===c?IDBTransaction.READ_WRITE:IDBTransaction.READ_ONLY,a.DEBUG&&console.log("Mode should be a string, but was specified as ",c)):c=c||IDBTransaction.READ_ONLY,c!==IDBTransaction.READ_ONLY&&c!==IDBTransaction.READ_WRITE)throw new TypeError("Invalid transaction mode: "+c);if(b="string"==typeof b?[b]:b,0===b.length)throw a.util.createDOMException("InvalidAccessError","No object store names were specified");for(var d=0;d<b.length;d++)if(!this.objectStoreNames.contains(b[d]))throw a.util.createDOMException("NotFoundError",'The "'+b[d]+'" object store does not exist');var e=new a.IDBTransaction(this,b,c);return e},a.IDBDatabase=b}(idbModules);var openDatabase="undefined"==typeof nodeWebsql?window.openDatabase:nodeWebsql;!function(a){function b(b,c){function f(b,d){d=a.util.findError(arguments),a.DEBUG&&console.log("Error in sysdb transaction - when creating dbVersions",d),c(d)}d?b():(d=openDatabase("__sysdb__",1,"System Database",e),d.transaction(function(a){a.executeSql("CREATE TABLE IF NOT EXISTS dbVersions (name VARCHAR(255), version INT);",[],b,f)},f))}function c(){this.modules=a}var d,e=4194304;c.prototype.open=function(c,f){function g(b,c){if(!j){c=a.util.findError(arguments),j=!0;var d=a.util.createEvent("error",arguments);i.readyState="done",i.error=c||"DOMError",a.util.callback("onerror",i,d)}}function h(b){var h=openDatabase(c,1,c,e);if(i.readyState="done","undefined"==typeof f&&(f=b||1),0>=f||b>f){var j=a.util.createDOMError("VersionError","An attempt was made to open a database using a lower version than the existing version.",f);return void g(j)}h.transaction(function(e){e.executeSql("CREATE TABLE IF NOT EXISTS __sys__ (name VARCHAR(255), keyPath VARCHAR(255), autoInc BOOLEAN, indexList BLOB)",[],function(){e.executeSql("SELECT * FROM __sys__",[],function(e,j){var k=a.util.createEvent("success");i.source=i.result=new a.IDBDatabase(h,c,f,j),f>b?d.transaction(function(d){d.executeSql("UPDATE dbVersions set version = ? where name = ?",[f,c],function(){var c=a.util.createEvent("upgradeneeded");c.oldVersion=b,c.newVersion=f,i.transaction=i.result.__versionTransaction=new a.IDBTransaction(i.source,[],a.IDBTransaction.VERSION_CHANGE),i.transaction.__addToTransactionQueue(function(b,d,e){a.util.callback("onupgradeneeded",i,c),e()}),i.transaction.__oncomplete=function(){i.transaction=null;var b=a.util.createEvent("success");a.util.callback("onsuccess",i,b)}},g)},g):a.util.callback("onsuccess",i,k)},g)},g)},g)}var i=new a.IDBOpenDBRequest,j=!1;if(0===arguments.length)throw new TypeError("Database name is required");if(2===arguments.length&&(f=parseFloat(f),isNaN(f)||!isFinite(f)||0>=f))throw new TypeError("Invalid database version: "+f);return c+="",b(function(){d.transaction(function(a){a.executeSql("SELECT * FROM dbVersions where name = ?",[c],function(a,b){0===b.rows.length?a.executeSql("INSERT INTO dbVersions VALUES (?,?)",[c,f||1],function(){h(0)},g):h(b.rows.item(0).version)},g)},g)},g),i},c.prototype.deleteDatabase=function(c){function f(b,c){if(!i){c=a.util.findError(arguments),h.readyState="done",h.error=c||"DOMError";var d=a.util.createEvent("error");d.debug=arguments,a.util.callback("onerror",h,d),i=!0}}function g(){d.transaction(function(b){b.executeSql("DELETE FROM dbVersions where name = ? ",[c],function(){h.result=void 0;var b=a.util.createEvent("success");b.newVersion=null,b.oldVersion=j,a.util.callback("onsuccess",h,b)},f)},f)}var h=new a.IDBOpenDBRequest,i=!1,j=null;if(0===arguments.length)throw new TypeError("Database name is required");return c+="",b(function(){d.transaction(function(b){b.executeSql("SELECT * FROM dbVersions where name = ?",[c],function(b,d){if(0===d.rows.length){h.result=void 0;var i=a.util.createEvent("success");return i.newVersion=null,i.oldVersion=j,void a.util.callback("onsuccess",h,i)}j=d.rows.item(0).version;var k=openDatabase(c,1,c,e);k.transaction(function(b){b.executeSql("SELECT * FROM __sys__",[],function(b,c){var d=c.rows;!function e(c){c>=d.length?b.executeSql("DROP TABLE IF EXISTS __sys__",[],function(){g()},f):b.executeSql("DROP TABLE "+a.util.quote(d.item(c).name),[],function(){e(c+1)},function(){e(c+1)})}(0)},function(a){g()})})},f)},f)},f),h},c.prototype.cmp=function(b,c){if(arguments.length<2)throw new TypeError("You must provide two keys to be compared");a.Key.validate(b),a.Key.validate(c);var d=a.Key.encode(b),e=a.Key.encode(c),f=d>e?1:d===e?0:-1;if(a.DEBUG){var g=a.Key.decode(d),h=a.Key.decode(e);"object"===("undefined"==typeof b?"undefined":_typeof(b))&&(b=JSON.stringify(b),g=JSON.stringify(g)),"object"===("undefined"==typeof c?"undefined":_typeof(c))&&(c=JSON.stringify(c),h=JSON.stringify(h)),g!==b&&console.warn(b+" was incorrectly encoded as "+g),h!==c&&console.warn(c+" was incorrectly encoded as "+h)}return f},a.shimIndexedDB=new c,a.IDBFactory=c}(idbModules);var win="undefined"==typeof window?{}:window;exports["default"]=win,function(a,b){function c(b,c){try{a[b]=c}catch(d){}if(a[b]!==c&&Object.defineProperty){try{Object.defineProperty(a,b,{value:c})}catch(d){}a[b]!==c&&a.console&&console.warn&&console.warn("Unable to shim "+b)}}if(!a)return void(b.indexedDB=b.shimIndexedDB);c("shimIndexedDB",b.shimIndexedDB),a.shimIndexedDB&&(a.shimIndexedDB.__useShim=function(){"undefined"!=typeof a.openDatabase?(c("indexedDB",b.shimIndexedDB),c("IDBFactory",b.IDBFactory),c("IDBDatabase",b.IDBDatabase),c("IDBObjectStore",b.IDBObjectStore),c("IDBIndex",b.IDBIndex),c("IDBTransaction",b.IDBTransaction),c("IDBCursor",b.IDBCursor),c("IDBKeyRange",b.IDBKeyRange),c("IDBRequest",b.IDBRequest),c("IDBOpenDBRequest",b.IDBOpenDBRequest),c("IDBVersionChangeEvent",b.IDBVersionChangeEvent)):"object"===_typeof(a.indexedDB)&&b.polyfill()},a.shimIndexedDB.__debug=function(a){b.DEBUG=a}),"indexedDB"in a||(a.indexedDB=a.indexedDB||a.webkitIndexedDB||a.mozIndexedDB||a.oIndexedDB||a.msIndexedDB);var d=!1;if((navigator.userAgent.match(/Android 2/)||navigator.userAgent.match(/Android 3/)||navigator.userAgent.match(/Android 4\.[0-3]/))&&(navigator.userAgent.match(/Chrome/)||(d=!0)),"undefined"!=typeof a.indexedDB&&a.indexedDB&&!d||"undefined"==typeof a.openDatabase){a.IDBDatabase=a.IDBDatabase||a.webkitIDBDatabase,a.IDBTransaction=a.IDBTransaction||a.webkitIDBTransaction,a.IDBCursor=a.IDBCursor||a.webkitIDBCursor,a.IDBKeyRange=a.IDBKeyRange||a.webkitIDBKeyRange,a.IDBTransaction||(a.IDBTransaction={});try{a.IDBTransaction.READ_ONLY=a.IDBTransaction.READ_ONLY||"readonly",a.IDBTransaction.READ_WRITE=a.IDBTransaction.READ_WRITE||"readwrite"}catch(e){}}else a.shimIndexedDB.__useShim()}(win,idbModules)},{atob:2,eventtarget:5}],2:[function(a,b,c){(function(a){!function(c){"use strict";function d(b){if("function"==typeof e)return e(b);if("function"==typeof a)return new a(b,"base64").toString("binary");if("object"==typeof c.base64js){var d=c.base64js.b64ToByteArray(b);return Array.prototype.map.call(d,function(a){return String.fromCharCode(a)}).join("")}throw new Error("you're probably in an ios webworker. please include use beatgammit's base64-js")}var e=c.atob;c.atob=d,"undefined"!=typeof b&&(b.exports=d)}(window)}).call(this,a("buffer").Buffer)},{buffer:4}],3:[function(a,b,c){"use strict";function d(){for(var a="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",b=0,c=a.length;c>b;++b)i[b]=a[b],j[a.charCodeAt(b)]=b;j["-".charCodeAt(0)]=62,j["_".charCodeAt(0)]=63}function e(a){var b,c,d,e,f,g,h=a.length;if(h%4>0)throw new Error("Invalid string. Length must be a multiple of 4");f="="===a[h-2]?2:"="===a[h-1]?1:0,g=new k(3*h/4-f),d=f>0?h-4:h;var i=0;for(b=0,c=0;d>b;b+=4,c+=3)e=j[a.charCodeAt(b)]<<18|j[a.charCodeAt(b+1)]<<12|j[a.charCodeAt(b+2)]<<6|j[a.charCodeAt(b+3)],g[i++]=e>>16&255,g[i++]=e>>8&255,g[i++]=255&e;return 2===f?(e=j[a.charCodeAt(b)]<<2|j[a.charCodeAt(b+1)]>>4,g[i++]=255&e):1===f&&(e=j[a.charCodeAt(b)]<<10|j[a.charCodeAt(b+1)]<<4|j[a.charCodeAt(b+2)]>>2,g[i++]=e>>8&255,g[i++]=255&e),g}function f(a){return i[a>>18&63]+i[a>>12&63]+i[a>>6&63]+i[63&a]}function g(a,b,c){for(var d,e=[],g=b;c>g;g+=3)d=(a[g]<<16)+(a[g+1]<<8)+a[g+2],e.push(f(d));return e.join("")}function h(a){for(var b,c=a.length,d=c%3,e="",f=[],h=16383,j=0,k=c-d;k>j;j+=h)f.push(g(a,j,j+h>k?k:j+h));return 1===d?(b=a[c-1],e+=i[b>>2],e+=i[b<<4&63],e+="=="):2===d&&(b=(a[c-2]<<8)+a[c-1],e+=i[b>>10],e+=i[b>>4&63],e+=i[b<<2&63],e+="="),f.push(e),f.join("")}c.toByteArray=e,c.fromByteArray=h;var i=[],j=[],k="undefined"!=typeof Uint8Array?Uint8Array:Array;d()},{}],4:[function(a,b,c){(function(b){"use strict";function d(){try{var a=new Uint8Array(1);return a.foo=function(){return 42},42===a.foo()&&"function"==typeof a.subarray&&0===a.subarray(1,1).byteLength}catch(b){return!1}}function e(){return g.TYPED_ARRAY_SUPPORT?2147483647:1073741823}function f(a,b){if(e()<b)throw new RangeError("Invalid typed array length");return g.TYPED_ARRAY_SUPPORT?(a=new Uint8Array(b),a.__proto__=g.prototype):(null===a&&(a=new g(b)),a.length=b),a}function g(a,b,c){if(!(g.TYPED_ARRAY_SUPPORT||this instanceof g))return new g(a,b,c);if("number"==typeof a){if("string"==typeof b)throw new Error("If encoding is specified then the first argument must be a string");return k(this,a)}return h(this,a,b,c)}function h(a,b,c,d){if("number"==typeof b)throw new TypeError('"value" argument must not be a number');return"undefined"!=typeof ArrayBuffer&&b instanceof ArrayBuffer?n(a,b,c,d):"string"==typeof b?l(a,b,c):o(a,b)}function i(a){if("number"!=typeof a)throw new TypeError('"size" argument must be a number')}function j(a,b,c,d){return i(b),0>=b?f(a,b):void 0!==c?"string"==typeof d?f(a,b).fill(c,d):f(a,b).fill(c):f(a,b)}function k(a,b){if(i(b),a=f(a,0>b?0:0|p(b)),!g.TYPED_ARRAY_SUPPORT)for(var c=0;b>c;c++)a[c]=0;return a}function l(a,b,c){if("string"==typeof c&&""!==c||(c="utf8"),!g.isEncoding(c))throw new TypeError('"encoding" must be a valid string encoding');var d=0|r(b,c);return a=f(a,d),a.write(b,c),a}function m(a,b){var c=0|p(b.length);a=f(a,c);for(var d=0;c>d;d+=1)a[d]=255&b[d];return a}function n(a,b,c,d){if(b.byteLength,0>c||b.byteLength<c)throw new RangeError("'offset' is out of bounds");if(b.byteLength<c+(d||0))throw new RangeError("'length' is out of bounds");return b=void 0===d?new Uint8Array(b,c):new Uint8Array(b,c,d),g.TYPED_ARRAY_SUPPORT?(a=b,a.__proto__=g.prototype):a=m(a,b),a}function o(a,b){if(g.isBuffer(b)){var c=0|p(b.length);return a=f(a,c),0===a.length?a:(b.copy(a,0,0,c),a)}if(b){if("undefined"!=typeof ArrayBuffer&&b.buffer instanceof ArrayBuffer||"length"in b)return"number"!=typeof b.length||X(b.length)?f(a,0):m(a,b);if("Buffer"===b.type&&$(b.data))return m(a,b.data)}throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.")}function p(a){if(a>=e())throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+e().toString(16)+" bytes");return 0|a}function q(a){return+a!=a&&(a=0),g.alloc(+a)}function r(a,b){if(g.isBuffer(a))return a.length;if("undefined"!=typeof ArrayBuffer&&"function"==typeof ArrayBuffer.isView&&(ArrayBuffer.isView(a)||a instanceof ArrayBuffer))return a.byteLength;"string"!=typeof a&&(a=""+a);var c=a.length;if(0===c)return 0;for(var d=!1;;)switch(b){case"ascii":case"binary":case"raw":case"raws":return c;case"utf8":case"utf-8":case void 0:return S(a).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*c;case"hex":return c>>>1;case"base64":return V(a).length;default:if(d)return S(a).length;b=(""+b).toLowerCase(),d=!0}}function s(a,b,c){var d=!1;if((void 0===b||0>b)&&(b=0),b>this.length)return"";if((void 0===c||c>this.length)&&(c=this.length),0>=c)return"";if(c>>>=0,b>>>=0,b>=c)return"";for(a||(a="utf8");;)switch(a){case"hex":return G(this,b,c);case"utf8":case"utf-8":return C(this,b,c);case"ascii":return E(this,b,c);case"binary":return F(this,b,c);case"base64":return B(this,b,c);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return H(this,b,c);default:if(d)throw new TypeError("Unknown encoding: "+a);a=(a+"").toLowerCase(),d=!0}}function t(a,b,c){var d=a[b];a[b]=a[c],a[c]=d}function u(a,b,c,d){function e(a,b){return 1===f?a[b]:a.readUInt16BE(b*f)}var f=1,g=a.length,h=b.length;if(void 0!==d&&(d=String(d).toLowerCase(),"ucs2"===d||"ucs-2"===d||"utf16le"===d||"utf-16le"===d)){if(a.length<2||b.length<2)return-1;f=2,g/=2,h/=2,c/=2}for(var i=-1,j=0;g>c+j;j++)if(e(a,c+j)===e(b,-1===i?0:j-i)){if(-1===i&&(i=j),j-i+1===h)return(c+i)*f}else-1!==i&&(j-=j-i),i=-1;return-1}function v(a,b,c,d){c=Number(c)||0;var e=a.length-c;d?(d=Number(d),d>e&&(d=e)):d=e;var f=b.length;if(f%2!==0)throw new Error("Invalid hex string");d>f/2&&(d=f/2);for(var g=0;d>g;g++){var h=parseInt(b.substr(2*g,2),16);if(isNaN(h))return g;a[c+g]=h}return g}function w(a,b,c,d){return W(S(b,a.length-c),a,c,d)}function x(a,b,c,d){return W(T(b),a,c,d)}function y(a,b,c,d){return x(a,b,c,d)}function z(a,b,c,d){return W(V(b),a,c,d)}function A(a,b,c,d){return W(U(b,a.length-c),a,c,d)}function B(a,b,c){return 0===b&&c===a.length?Y.fromByteArray(a):Y.fromByteArray(a.slice(b,c))}function C(a,b,c){c=Math.min(a.length,c);for(var d=[],e=b;c>e;){var f=a[e],g=null,h=f>239?4:f>223?3:f>191?2:1;if(c>=e+h){var i,j,k,l;switch(h){case 1:128>f&&(g=f);break;case 2:i=a[e+1],128===(192&i)&&(l=(31&f)<<6|63&i,l>127&&(g=l));break;case 3:i=a[e+1],j=a[e+2],128===(192&i)&&128===(192&j)&&(l=(15&f)<<12|(63&i)<<6|63&j,l>2047&&(55296>l||l>57343)&&(g=l));break;case 4:i=a[e+1],j=a[e+2],k=a[e+3],128===(192&i)&&128===(192&j)&&128===(192&k)&&(l=(15&f)<<18|(63&i)<<12|(63&j)<<6|63&k,l>65535&&1114112>l&&(g=l))}}null===g?(g=65533,h=1):g>65535&&(g-=65536,d.push(g>>>10&1023|55296),g=56320|1023&g),d.push(g),e+=h}return D(d)}function D(a){var b=a.length;if(_>=b)return String.fromCharCode.apply(String,a);for(var c="",d=0;b>d;)c+=String.fromCharCode.apply(String,a.slice(d,d+=_));return c}function E(a,b,c){var d="";c=Math.min(a.length,c);for(var e=b;c>e;e++)d+=String.fromCharCode(127&a[e]);return d}function F(a,b,c){var d="";c=Math.min(a.length,c);for(var e=b;c>e;e++)d+=String.fromCharCode(a[e]);return d}function G(a,b,c){var d=a.length;(!b||0>b)&&(b=0),(!c||0>c||c>d)&&(c=d);for(var e="",f=b;c>f;f++)e+=R(a[f]);return e}function H(a,b,c){for(var d=a.slice(b,c),e="",f=0;f<d.length;f+=2)e+=String.fromCharCode(d[f]+256*d[f+1]);return e}function I(a,b,c){if(a%1!==0||0>a)throw new RangeError("offset is not uint");if(a+b>c)throw new RangeError("Trying to access beyond buffer length")}function J(a,b,c,d,e,f){if(!g.isBuffer(a))throw new TypeError('"buffer" argument must be a Buffer instance');if(b>e||f>b)throw new RangeError('"value" argument is out of bounds');if(c+d>a.length)throw new RangeError("Index out of range")}function K(a,b,c,d){0>b&&(b=65535+b+1);for(var e=0,f=Math.min(a.length-c,2);f>e;e++)a[c+e]=(b&255<<8*(d?e:1-e))>>>8*(d?e:1-e)}function L(a,b,c,d){0>b&&(b=4294967295+b+1);for(var e=0,f=Math.min(a.length-c,4);f>e;e++)a[c+e]=b>>>8*(d?e:3-e)&255}function M(a,b,c,d,e,f){if(c+d>a.length)throw new RangeError("Index out of range");if(0>c)throw new RangeError("Index out of range")}function N(a,b,c,d,e){return e||M(a,b,c,4,3.4028234663852886e38,-3.4028234663852886e38),Z.write(a,b,c,d,23,4),c+4}function O(a,b,c,d,e){return e||M(a,b,c,8,1.7976931348623157e308,-1.7976931348623157e308),Z.write(a,b,c,d,52,8),c+8}function P(a){if(a=Q(a).replace(aa,""),a.length<2)return"";for(;a.length%4!==0;)a+="=";return a}function Q(a){return a.trim?a.trim():a.replace(/^\s+|\s+$/g,"")}function R(a){return 16>a?"0"+a.toString(16):a.toString(16)}function S(a,b){b=b||1/0;for(var c,d=a.length,e=null,f=[],g=0;d>g;g++){if(c=a.charCodeAt(g),c>55295&&57344>c){if(!e){if(c>56319){(b-=3)>-1&&f.push(239,191,189);continue}if(g+1===d){(b-=3)>-1&&f.push(239,191,189);continue}e=c;continue}if(56320>c){(b-=3)>-1&&f.push(239,191,189),e=c;continue}c=(e-55296<<10|c-56320)+65536}else e&&(b-=3)>-1&&f.push(239,191,189);if(e=null,128>c){if((b-=1)<0)break;f.push(c)}else if(2048>c){if((b-=2)<0)break;f.push(c>>6|192,63&c|128)}else if(65536>c){if((b-=3)<0)break;f.push(c>>12|224,c>>6&63|128,63&c|128)}else{if(!(1114112>c))throw new Error("Invalid code point");if((b-=4)<0)break;f.push(c>>18|240,c>>12&63|128,c>>6&63|128,63&c|128)}}return f}function T(a){for(var b=[],c=0;c<a.length;c++)b.push(255&a.charCodeAt(c));return b}function U(a,b){for(var c,d,e,f=[],g=0;g<a.length&&!((b-=2)<0);g++)c=a.charCodeAt(g),d=c>>8,e=c%256,f.push(e),f.push(d);return f}function V(a){return Y.toByteArray(P(a))}function W(a,b,c,d){for(var e=0;d>e&&!(e+c>=b.length||e>=a.length);e++)b[e+c]=a[e];return e}function X(a){return a!==a}var Y=a("base64-js"),Z=a("ieee754"),$=a("isarray");c.Buffer=g,c.SlowBuffer=q,c.INSPECT_MAX_BYTES=50,g.TYPED_ARRAY_SUPPORT=void 0!==b.TYPED_ARRAY_SUPPORT?b.TYPED_ARRAY_SUPPORT:d(),c.kMaxLength=e(),g.poolSize=8192,g._augment=function(a){return a.__proto__=g.prototype,a},g.from=function(a,b,c){return h(null,a,b,c)},g.TYPED_ARRAY_SUPPORT&&(g.prototype.__proto__=Uint8Array.prototype,g.__proto__=Uint8Array,"undefined"!=typeof Symbol&&Symbol.species&&g[Symbol.species]===g&&Object.defineProperty(g,Symbol.species,{value:null,configurable:!0})),g.alloc=function(a,b,c){return j(null,a,b,c)},g.allocUnsafe=function(a){return k(null,a)},g.allocUnsafeSlow=function(a){return k(null,a)},g.isBuffer=function(a){return!(null==a||!a._isBuffer)},g.compare=function(a,b){if(!g.isBuffer(a)||!g.isBuffer(b))throw new TypeError("Arguments must be Buffers");if(a===b)return 0;for(var c=a.length,d=b.length,e=0,f=Math.min(c,d);f>e;++e)if(a[e]!==b[e]){c=a[e],d=b[e];break}return d>c?-1:c>d?1:0},g.isEncoding=function(a){switch(String(a).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"binary":case"base64":case"raw":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},g.concat=function(a,b){if(!$(a))throw new TypeError('"list" argument must be an Array of Buffers');if(0===a.length)return g.alloc(0);var c;if(void 0===b)for(b=0,c=0;c<a.length;c++)b+=a[c].length;var d=g.allocUnsafe(b),e=0;for(c=0;c<a.length;c++){var f=a[c];if(!g.isBuffer(f))throw new TypeError('"list" argument must be an Array of Buffers');f.copy(d,e),e+=f.length}return d},g.byteLength=r,g.prototype._isBuffer=!0,g.prototype.swap16=function(){var a=this.length;if(a%2!==0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var b=0;a>b;b+=2)t(this,b,b+1);return this},g.prototype.swap32=function(){var a=this.length;if(a%4!==0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var b=0;a>b;b+=4)t(this,b,b+3),t(this,b+1,b+2);return this},g.prototype.toString=function(){var a=0|this.length;return 0===a?"":0===arguments.length?C(this,0,a):s.apply(this,arguments)},g.prototype.equals=function(a){if(!g.isBuffer(a))throw new TypeError("Argument must be a Buffer");return this===a?!0:0===g.compare(this,a)},g.prototype.inspect=function(){var a="",b=c.INSPECT_MAX_BYTES;return this.length>0&&(a=this.toString("hex",0,b).match(/.{2}/g).join(" "),this.length>b&&(a+=" ... ")),"<Buffer "+a+">"},g.prototype.compare=function(a,b,c,d,e){if(!g.isBuffer(a))throw new TypeError("Argument must be a Buffer");if(void 0===b&&(b=0),void 0===c&&(c=a?a.length:0),void 0===d&&(d=0),void 0===e&&(e=this.length),0>b||c>a.length||0>d||e>this.length)throw new RangeError("out of range index");if(d>=e&&b>=c)return 0;if(d>=e)return-1;if(b>=c)return 1;if(b>>>=0,c>>>=0,d>>>=0,e>>>=0,this===a)return 0;for(var f=e-d,h=c-b,i=Math.min(f,h),j=this.slice(d,e),k=a.slice(b,c),l=0;i>l;++l)if(j[l]!==k[l]){f=j[l],h=k[l];break}return h>f?-1:f>h?1:0},g.prototype.indexOf=function(a,b,c){if("string"==typeof b?(c=b,b=0):b>2147483647?b=2147483647:-2147483648>b&&(b=-2147483648),b>>=0,0===this.length)return-1;if(b>=this.length)return-1;if(0>b&&(b=Math.max(this.length+b,0)),"string"==typeof a&&(a=g.from(a,c)),g.isBuffer(a))return 0===a.length?-1:u(this,a,b,c);if("number"==typeof a)return g.TYPED_ARRAY_SUPPORT&&"function"===Uint8Array.prototype.indexOf?Uint8Array.prototype.indexOf.call(this,a,b):u(this,[a],b,c);throw new TypeError("val must be string, number or Buffer")},g.prototype.includes=function(a,b,c){return-1!==this.indexOf(a,b,c)},g.prototype.write=function(a,b,c,d){if(void 0===b)d="utf8",c=this.length,b=0;else if(void 0===c&&"string"==typeof b)d=b,c=this.length,b=0;else{if(!isFinite(b))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");b=0|b,isFinite(c)?(c=0|c,void 0===d&&(d="utf8")):(d=c,c=void 0)}var e=this.length-b;if((void 0===c||c>e)&&(c=e),a.length>0&&(0>c||0>b)||b>this.length)throw new RangeError("Attempt to write outside buffer bounds");d||(d="utf8");for(var f=!1;;)switch(d){case"hex":return v(this,a,b,c);case"utf8":case"utf-8":return w(this,a,b,c);case"ascii":return x(this,a,b,c);case"binary":return y(this,a,b,c);case"base64":return z(this,a,b,c);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return A(this,a,b,c);default:if(f)throw new TypeError("Unknown encoding: "+d);d=(""+d).toLowerCase(),f=!0}},g.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};var _=4096;g.prototype.slice=function(a,b){var c=this.length;a=~~a,b=void 0===b?c:~~b,0>a?(a+=c,0>a&&(a=0)):a>c&&(a=c),0>b?(b+=c,0>b&&(b=0)):b>c&&(b=c),a>b&&(b=a);var d;if(g.TYPED_ARRAY_SUPPORT)d=this.subarray(a,b),d.__proto__=g.prototype;else{var e=b-a;d=new g(e,void 0);for(var f=0;e>f;f++)d[f]=this[f+a]}return d},g.prototype.readUIntLE=function(a,b,c){a=0|a,b=0|b,c||I(a,b,this.length);for(var d=this[a],e=1,f=0;++f<b&&(e*=256);)d+=this[a+f]*e;return d},g.prototype.readUIntBE=function(a,b,c){a=0|a,b=0|b,c||I(a,b,this.length);for(var d=this[a+--b],e=1;b>0&&(e*=256);)d+=this[a+--b]*e;return d},g.prototype.readUInt8=function(a,b){return b||I(a,1,this.length),this[a]},g.prototype.readUInt16LE=function(a,b){return b||I(a,2,this.length),this[a]|this[a+1]<<8},g.prototype.readUInt16BE=function(a,b){return b||I(a,2,this.length),this[a]<<8|this[a+1]},g.prototype.readUInt32LE=function(a,b){return b||I(a,4,this.length),(this[a]|this[a+1]<<8|this[a+2]<<16)+16777216*this[a+3]},g.prototype.readUInt32BE=function(a,b){return b||I(a,4,this.length),16777216*this[a]+(this[a+1]<<16|this[a+2]<<8|this[a+3])},g.prototype.readIntLE=function(a,b,c){a=0|a,b=0|b,c||I(a,b,this.length);for(var d=this[a],e=1,f=0;++f<b&&(e*=256);)d+=this[a+f]*e;return e*=128,d>=e&&(d-=Math.pow(2,8*b)),d},g.prototype.readIntBE=function(a,b,c){a=0|a,b=0|b,c||I(a,b,this.length);for(var d=b,e=1,f=this[a+--d];d>0&&(e*=256);)f+=this[a+--d]*e;return e*=128,f>=e&&(f-=Math.pow(2,8*b)),f},g.prototype.readInt8=function(a,b){return b||I(a,1,this.length),128&this[a]?-1*(255-this[a]+1):this[a]},g.prototype.readInt16LE=function(a,b){b||I(a,2,this.length);var c=this[a]|this[a+1]<<8;return 32768&c?4294901760|c:c},g.prototype.readInt16BE=function(a,b){b||I(a,2,this.length);
var c=this[a+1]|this[a]<<8;return 32768&c?4294901760|c:c},g.prototype.readInt32LE=function(a,b){return b||I(a,4,this.length),this[a]|this[a+1]<<8|this[a+2]<<16|this[a+3]<<24},g.prototype.readInt32BE=function(a,b){return b||I(a,4,this.length),this[a]<<24|this[a+1]<<16|this[a+2]<<8|this[a+3]},g.prototype.readFloatLE=function(a,b){return b||I(a,4,this.length),Z.read(this,a,!0,23,4)},g.prototype.readFloatBE=function(a,b){return b||I(a,4,this.length),Z.read(this,a,!1,23,4)},g.prototype.readDoubleLE=function(a,b){return b||I(a,8,this.length),Z.read(this,a,!0,52,8)},g.prototype.readDoubleBE=function(a,b){return b||I(a,8,this.length),Z.read(this,a,!1,52,8)},g.prototype.writeUIntLE=function(a,b,c,d){if(a=+a,b=0|b,c=0|c,!d){var e=Math.pow(2,8*c)-1;J(this,a,b,c,e,0)}var f=1,g=0;for(this[b]=255&a;++g<c&&(f*=256);)this[b+g]=a/f&255;return b+c},g.prototype.writeUIntBE=function(a,b,c,d){if(a=+a,b=0|b,c=0|c,!d){var e=Math.pow(2,8*c)-1;J(this,a,b,c,e,0)}var f=c-1,g=1;for(this[b+f]=255&a;--f>=0&&(g*=256);)this[b+f]=a/g&255;return b+c},g.prototype.writeUInt8=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,1,255,0),g.TYPED_ARRAY_SUPPORT||(a=Math.floor(a)),this[b]=255&a,b+1},g.prototype.writeUInt16LE=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,2,65535,0),g.TYPED_ARRAY_SUPPORT?(this[b]=255&a,this[b+1]=a>>>8):K(this,a,b,!0),b+2},g.prototype.writeUInt16BE=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,2,65535,0),g.TYPED_ARRAY_SUPPORT?(this[b]=a>>>8,this[b+1]=255&a):K(this,a,b,!1),b+2},g.prototype.writeUInt32LE=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,4,4294967295,0),g.TYPED_ARRAY_SUPPORT?(this[b+3]=a>>>24,this[b+2]=a>>>16,this[b+1]=a>>>8,this[b]=255&a):L(this,a,b,!0),b+4},g.prototype.writeUInt32BE=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,4,4294967295,0),g.TYPED_ARRAY_SUPPORT?(this[b]=a>>>24,this[b+1]=a>>>16,this[b+2]=a>>>8,this[b+3]=255&a):L(this,a,b,!1),b+4},g.prototype.writeIntLE=function(a,b,c,d){if(a=+a,b=0|b,!d){var e=Math.pow(2,8*c-1);J(this,a,b,c,e-1,-e)}var f=0,g=1,h=0;for(this[b]=255&a;++f<c&&(g*=256);)0>a&&0===h&&0!==this[b+f-1]&&(h=1),this[b+f]=(a/g>>0)-h&255;return b+c},g.prototype.writeIntBE=function(a,b,c,d){if(a=+a,b=0|b,!d){var e=Math.pow(2,8*c-1);J(this,a,b,c,e-1,-e)}var f=c-1,g=1,h=0;for(this[b+f]=255&a;--f>=0&&(g*=256);)0>a&&0===h&&0!==this[b+f+1]&&(h=1),this[b+f]=(a/g>>0)-h&255;return b+c},g.prototype.writeInt8=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,1,127,-128),g.TYPED_ARRAY_SUPPORT||(a=Math.floor(a)),0>a&&(a=255+a+1),this[b]=255&a,b+1},g.prototype.writeInt16LE=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,2,32767,-32768),g.TYPED_ARRAY_SUPPORT?(this[b]=255&a,this[b+1]=a>>>8):K(this,a,b,!0),b+2},g.prototype.writeInt16BE=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,2,32767,-32768),g.TYPED_ARRAY_SUPPORT?(this[b]=a>>>8,this[b+1]=255&a):K(this,a,b,!1),b+2},g.prototype.writeInt32LE=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,4,2147483647,-2147483648),g.TYPED_ARRAY_SUPPORT?(this[b]=255&a,this[b+1]=a>>>8,this[b+2]=a>>>16,this[b+3]=a>>>24):L(this,a,b,!0),b+4},g.prototype.writeInt32BE=function(a,b,c){return a=+a,b=0|b,c||J(this,a,b,4,2147483647,-2147483648),0>a&&(a=4294967295+a+1),g.TYPED_ARRAY_SUPPORT?(this[b]=a>>>24,this[b+1]=a>>>16,this[b+2]=a>>>8,this[b+3]=255&a):L(this,a,b,!1),b+4},g.prototype.writeFloatLE=function(a,b,c){return N(this,a,b,!0,c)},g.prototype.writeFloatBE=function(a,b,c){return N(this,a,b,!1,c)},g.prototype.writeDoubleLE=function(a,b,c){return O(this,a,b,!0,c)},g.prototype.writeDoubleBE=function(a,b,c){return O(this,a,b,!1,c)},g.prototype.copy=function(a,b,c,d){if(c||(c=0),d||0===d||(d=this.length),b>=a.length&&(b=a.length),b||(b=0),d>0&&c>d&&(d=c),d===c)return 0;if(0===a.length||0===this.length)return 0;if(0>b)throw new RangeError("targetStart out of bounds");if(0>c||c>=this.length)throw new RangeError("sourceStart out of bounds");if(0>d)throw new RangeError("sourceEnd out of bounds");d>this.length&&(d=this.length),a.length-b<d-c&&(d=a.length-b+c);var e,f=d-c;if(this===a&&b>c&&d>b)for(e=f-1;e>=0;e--)a[e+b]=this[e+c];else if(1e3>f||!g.TYPED_ARRAY_SUPPORT)for(e=0;f>e;e++)a[e+b]=this[e+c];else Uint8Array.prototype.set.call(a,this.subarray(c,c+f),b);return f},g.prototype.fill=function(a,b,c,d){if("string"==typeof a){if("string"==typeof b?(d=b,b=0,c=this.length):"string"==typeof c&&(d=c,c=this.length),1===a.length){var e=a.charCodeAt(0);256>e&&(a=e)}if(void 0!==d&&"string"!=typeof d)throw new TypeError("encoding must be a string");if("string"==typeof d&&!g.isEncoding(d))throw new TypeError("Unknown encoding: "+d)}else"number"==typeof a&&(a=255&a);if(0>b||this.length<b||this.length<c)throw new RangeError("Out of range index");if(b>=c)return this;b>>>=0,c=void 0===c?this.length:c>>>0,a||(a=0);var f;if("number"==typeof a)for(f=b;c>f;f++)this[f]=a;else{var h=g.isBuffer(a)?a:S(new g(a,d).toString()),i=h.length;for(f=0;c-b>f;f++)this[f+b]=h[f%i]}return this};var aa=/[^+\/0-9A-Za-z-_]/g}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"base64-js":3,ieee754:6,isarray:7}],5:[function(a,b,c){function d(){}Object.assign(d.prototype,{addEventListener:function(a,b){this._listeners||Object.defineProperty(this,"_listeners",{value:{}});var c=this._listeners,d=c[a];void 0===d&&(c[a]=d=[]),d.some(function(a){return a===b})||d.push(b)},dispatchEvent:function(a){this._listeners||Object.defineProperty(this,"_listeners",{value:{}});var b=this._listeners;if(a._dispatched)throw new DOMException("The object is in an invalid state.","InvalidStateError");a._dispatched=!0;var c=a.type;if(void 0==c||""==c)throw new DOMException("UNSPECIFIED_EVENT_TYPE_ERR","UNSPECIFIED_EVENT_TYPE_ERR");var d=b[c].concat()||[],e=this["on"+c],f=d.length?1:0,g=!1;return a.cancelable=!0,a.defaultPrevented=!1,a.isTrusted=!1,a.preventDefault=function(){this.cancelable&&(this.defaultPrevented=!0)},a.stopImmediatePropagation=function(){g=!0},a.target=this,a.timeStamp=(new Date).getTime(),d.some(function(b,c){return g?!0:(c===f&&"function"==typeof e&&e.call(this,a),void b.call(this,a))},this),"function"==typeof e&&d.length<2&&e.call(this,a),!a.defaultPrevented},hasEventListener:function(a,b){this._listeners||Object.defineProperty(this,"_listeners",{value:{}});var c=this._listeners;return void 0!==c[a]&&-1!==c[a].indexOf(b)},removeEventListener:function(a,b){this._listeners||Object.defineProperty(this,"_listeners",{value:{}});var c=this._listeners,d=c[a];void 0!==d&&(d.some(function(a,c){return a===b?(d.splice(c,1),!0):void 0}),d.length||delete c[a])}}),"undefined"!=typeof b&&b.exports&&(b.exports=d)},{}],6:[function(a,b,c){c.read=function(a,b,c,d,e){var f,g,h=8*e-d-1,i=(1<<h)-1,j=i>>1,k=-7,l=c?e-1:0,m=c?-1:1,n=a[b+l];for(l+=m,f=n&(1<<-k)-1,n>>=-k,k+=h;k>0;f=256*f+a[b+l],l+=m,k-=8);for(g=f&(1<<-k)-1,f>>=-k,k+=d;k>0;g=256*g+a[b+l],l+=m,k-=8);if(0===f)f=1-j;else{if(f===i)return g?NaN:(n?-1:1)*(1/0);g+=Math.pow(2,d),f-=j}return(n?-1:1)*g*Math.pow(2,f-d)},c.write=function(a,b,c,d,e,f){var g,h,i,j=8*f-e-1,k=(1<<j)-1,l=k>>1,m=23===e?Math.pow(2,-24)-Math.pow(2,-77):0,n=d?0:f-1,o=d?1:-1,p=0>b||0===b&&0>1/b?1:0;for(b=Math.abs(b),isNaN(b)||b===1/0?(h=isNaN(b)?1:0,g=k):(g=Math.floor(Math.log(b)/Math.LN2),b*(i=Math.pow(2,-g))<1&&(g--,i*=2),b+=g+l>=1?m/i:m*Math.pow(2,1-l),b*i>=2&&(g++,i/=2),g+l>=k?(h=0,g=k):g+l>=1?(h=(b*i-1)*Math.pow(2,e),g+=l):(h=b*Math.pow(2,l-1)*Math.pow(2,e),g=0));e>=8;a[c+n]=255&h,n+=o,h/=256,e-=8);for(g=g<<e|h,j+=e;j>0;a[c+n]=255&g,n+=o,g/=256,j-=8);a[c+n-o]|=128*p}},{}],7:[function(a,b,c){var d={}.toString;b.exports=Array.isArray||function(a){return"[object Array]"==d.call(a)}},{}]},{},[1]);


}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"atob":3,"eventtarget":6}],3:[function(require,module,exports){
(function (Buffer){
(function (w) {
  "use strict";

  var a2b = w.atob;

  function atob(str) {
    // normal window
    if ('function' === typeof a2b) {
      return a2b(str);
    }
    // browserify (web worker)
    else if ('function' === typeof Buffer) {
      return new Buffer(str, 'base64').toString('binary');
    }
    // ios web worker with base64js
    else if ('object' === typeof w.base64js) {
      // bufferToBinaryString
      // https://github.com/coolaj86/unibabel-js/blob/master/index.js#L50
      var buf = w.base64js.b64ToByteArray(str);

      return Array.prototype.map.call(buf, function (ch) {
        return String.fromCharCode(ch);
      }).join('');
    }
    // ios web worker without base64js
    else {
      throw new Error("you're probably in an ios webworker. please include use beatgammit's base64-js");
    }
  }

  w.atob = atob;

  if (typeof module !== 'undefined') {
    module.exports = atob;
  }
}(window));

}).call(this,require("buffer").Buffer)
},{"buffer":5}],4:[function(require,module,exports){
'use strict'

exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

function init () {
  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i]
    revLookup[code.charCodeAt(i)] = i
  }

  revLookup['-'.charCodeAt(0)] = 62
  revLookup['_'.charCodeAt(0)] = 63
}

init()

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0

  // base64 is 4/3 + up to two characters of the original data
  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],5:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; i++) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  that.write(string, encoding)
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

function arrayIndexOf (arr, val, byteOffset, encoding) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var foundIndex = -1
  for (var i = 0; byteOffset + i < arrLength; i++) {
    if (read(arr, byteOffset + i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
      if (foundIndex === -1) foundIndex = i
      if (i - foundIndex + 1 === valLength) return (byteOffset + foundIndex) * indexSize
    } else {
      if (foundIndex !== -1) i -= i - foundIndex
      foundIndex = -1
    }
  }
  return -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    // special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(this, val, byteOffset, encoding)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset, encoding)
  }

  throw new TypeError('val must be string, number or Buffer')
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; i++) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; i++) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":4,"ieee754":7,"isarray":8}],6:[function(require,module,exports){

function EventTarget() {}

Object.assign(EventTarget.prototype, {

  addEventListener: function (type, listener) {
    if (!this._listeners) Object.defineProperty(this, '_listeners', {value: {}})
    var listeners = this._listeners

    var listenersByType = listeners[type]
    if (listenersByType === undefined) listeners[type] = listenersByType = [];

    if (listenersByType.some(function (l) {
      return l === listener
    })) return

    listenersByType.push(listener)
  },

  dispatchEvent: function (ev) {
    if (!this._listeners) Object.defineProperty(this, '_listeners', {value: {}})
    var listeners = this._listeners
    if (ev._dispatched) throw new DOMException('The object is in an invalid state.', 'InvalidStateError')
    ev._dispatched = true

    var type = ev.type
    if (type == undefined || type == '') throw new DOMException('UNSPECIFIED_EVENT_TYPE_ERR', 'UNSPECIFIED_EVENT_TYPE_ERR')

    var listenersByType = listeners[type].concat() || []

    var dummyListener = this['on' + type]
    var dummyIPos = listenersByType.length ? 1 : 0

    var stopImmediatePropagation = false

    // [ToDo] Use read-only properties instead of attributes when available
    ev.cancelable = true
    ev.defaultPrevented = false
    ev.isTrusted = false
    ev.preventDefault = function () {
      if (this.cancelable) this.defaultPrevented = true
    }
    ev.stopImmediatePropagation = function () {
      stopImmediatePropagation = true
    }
    ev.target = this
    ev.timeStamp = new Date().getTime()

    listenersByType.some(function (listener, i) {
      if (stopImmediatePropagation) return true
      if (i === dummyIPos && typeof dummyListener === 'function') {
        // We don't splice this in as could be overwritten; executes here per
        //  https://html.spec.whatwg.org/multipage/webappapis.html#event-handler-attributes:event-handlers-14
        dummyListener.call(this, ev)
      }
      listener.call(this, ev)
    }, this)
    if (typeof dummyListener === 'function' && listenersByType.length < 2) dummyListener.call(this, ev) // Won't have executed if too short

    return !ev.defaultPrevented
  },

  hasEventListener: function (type, listener) {
    if (!this._listeners) Object.defineProperty(this, '_listeners', {value: {}})

    var listeners = this._listeners;
    if (listeners[type] !== undefined && listeners[type].indexOf(listener) !== - 1) {
      return true
    }
    return false
  },

  removeEventListener: function (type, listener) {
    if (!this._listeners) Object.defineProperty(this, '_listeners', {value: {}})
    var listeners = this._listeners

    var listenersByType = listeners[type]
    if (listenersByType === undefined) return

    listenersByType.some(function (l, i) {
      if (l === listener) {
        listenersByType.splice(i, 1)
        return true
      }
    })

    if (!listenersByType.length) delete listeners[type]
  }
})

if (typeof module !== 'undefined' && module.exports) module.exports = EventTarget

},{}],7:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],8:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],9:[function(require,module,exports){
(function (global){
'use strict';

module.exports = global.openDatabase;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);

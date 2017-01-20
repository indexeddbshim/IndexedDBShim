/* globals shimNS, add_completion_callback */
// Now set-up our mechanism to report results back
(function () {
    // Although we needed a few of these in environment.js, we cannot set there as some are exposed by the test framework
    /* shimIndexedDB,indexedDB,IDBFactory,IDBDatabase,IDBObjectStore,IDBIndex,IDBTransaction,IDBCursor,IDBCursorWithValue,IDBKeyRange,IDBRequest,IDBOpenDBRequest,IDBVersionChangeEvent

    ,_core,_globalProxy,__timers,_top,_parent,_frameElement,_document,_sessionHistory,_currentSessionHistoryEntryIndex,_length,_virtualConsole,
    length,window,frameElement,frames,self,parent,top,document,location,history,navigator,addEventListener,removeEventListener,dispatchEvent,setTimeout,setInterval,clearInterval,clearTimeout,
    __stopAllTimers,
    postMessage,atob,btoa,FileReader,XMLHttpRequest,ArrayBuffer,Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,stop,close,getComputedStyle,console,name,innerWidth,innerHeight,outerWidth,outerHeight,pageXOffset,pageYOffset,screenX,screenY,screenLeft,screenTop,scrollX,scrollY,
    scrollTop,scrollLeft,
    screen,alert,blur,confirm,
    createPopup,
    focus,moveBy,moveTo,open,print,prompt,resizeBy,resizeTo,scroll,scrollBy,scrollTo,toString,
    log
    */
    Object.keys(shimNS.window).forEach(function (prop) {
        if (prop[0] === '_' || // One type added by jsdom
            [
                // Already added
                'clearTimeout', 'setTimeout',
                'addEventListener', 'document',
                // Not in Chrome (and at least log should not become a global as used in test scripts)
                'scrollTop', 'scrollLeft', 'createPopup', 'log'
            ].includes(prop)) {
            return;
        }
        this[prop] = shimNS.window[prop];
    }, this);
    // shimIndexedDB.__debug(true);
    this.DOMException = indexedDB.modules.DOMException;
    this.Event = indexedDB.modules.ShimEvent;

    const colors = shimNS.colors;
    const theme = {
        pass: 'green',
        fail: 'red',
        timeout: 'red',
        notrun: 'red'
    };
    colors.setTheme(theme);

    /*
    function unescapeHTML (s) {
        return s
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&amp;/g, '&');
    }
    */
    function write (statusText, status) {
        const color = colors[Object.keys(theme)[status]];
        let msg = color(statusText);
        shimNS.statuses[statusText] += 1;
        msg += shimNS.statuses[statusText];
        shimNS.write(msg);
    }

    function reportResults (tests, harnessStatus) {
        // Todo: Look instead on `id=log` and possibly `id=summary` or
        //      `id=metadata_cache` if we add one (and `id=metadata_cache`?)
        // Insert our own reporting to be ready once tests evaluate
        const fileName = shimNS.fileName;
        const trs = [...document.querySelectorAll('table#results > tbody > tr')];
        trs.forEach((tr, i) => {
            const test = tests[i];
            const tds = [...tr.querySelectorAll('td')].map((td) => td.textContent);
            const [statusText] = tds; // 2nd is testName
            let [,, assertions, messageWithAnyStack] = tds;
            if (messageWithAnyStack === undefined) {
                messageWithAnyStack = assertions;
                assertions = undefined;
            }
            write(statusText, test.status);
            if (!shimNS.files[statusText].includes(fileName)) shimNS.files[statusText].push(fileName);
            shimNS.writeln(' (' + fileName + '): ' + test.name);
            if (assertions) shimNS.writeln(assertions);
            if (test.message && test.stack) shimNS.writeln((test.message || ' ') + test.stack);
        });
        shimNS.finished();
    }
    add_completion_callback((...args) => {
        try {
            reportResults(...args);
        } catch (err) {
            shimNS.writeln('err' + err);
        }
    });
}());

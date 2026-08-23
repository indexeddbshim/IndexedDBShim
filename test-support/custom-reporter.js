/* globals shimNS, add_completion_callback -- Environment */
// Now set-up our mechanism to report results back
(function () {
    // Although we needed a few of these in environment.js, we cannot set there as some are only exposed after including the test framework
    /*
    ShimEvent, ShimCustomEvent, ShimEventTarget, ShimDOMException,
    Event, CustomEvent, EventTarget, DOMException,
    XMLHttpRequest, URL, URLSearchParams, postMessage, Worker,
    _core,_globalProxy,__timers,_top,_parent,_frameElement,_document,_sessionHistory,_currentSessionHistoryEntryIndex,_length,_virtualConsole,
    length,window,frameElement,frames,self,parent,top,document,location,history,navigator,addEventListener,removeEventListener,dispatchEvent,setTimeout,setInterval,clearInterval,clearTimeout,
    __stopAllTimers,
    atob,btoa,FileReader,ArrayBuffer,Int8Array,Uint8Array,Uint8ClampedArray,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,stop,close,getComputedStyle,console,name,innerWidth,innerHeight,outerWidth,outerHeight,pageXOffset,pageYOffset,screenX,screenY,screenLeft,screenTop,scrollX,scrollY,
    scrollTop,scrollLeft,
    screen,alert,blur,confirm,
    createPopup,
    focus,moveBy,moveTo,open,print,prompt,resizeBy,resizeTo,scroll,scrollBy,scrollTo,toString,
    log,
    Object, Function
    */
    const nonEnumerables = [
        'Blob', 'File', 'DOMException', 'Event', 'CustomEvent', 'EventTarget', 'DOMStringList', 'URL',
        'Window', 'Node', 'Document', 'DOMImplementation', 'DocumentFragment', 'ProcessingInstruction', 'DocumentType', 'Element', 'Attr', 'CharacterData', 'Text', 'Comment', 'NodeIterator', 'TreeWalker', 'NodeFilter', 'NodeList', 'HTMLCollection', 'DOMTokenList'
    ]; // These are needed by IndexedDB tests
    nonEnumerables.concat(Object.keys(shimNS.window)).forEach((prop) => {
        if (prop[0] === '_' || // One type added by jsdom
            [
                // Already added
                'clearTimeout', 'setTimeout',
                'addEventListener', 'document',
                // Let's allow us to override the jsdom console with that in the main script
                'console',
                // Not in Chrome (and at least log should not become a global as used in test scripts)
                'scrollTop', 'scrollLeft', 'createPopup', 'log'
            ].includes(prop)) {
            return;
        }
        const desc = Object.getOwnPropertyDescriptor(shimNS.window, prop);
        // Todo: This doesn't seem to work for Event, EventTarget, CustomEvent, DOMStringList as still enumerable
        if (desc) {
            Object.defineProperty(this, prop, desc);
        } else {
            // `addEventListener` has none (in browser also)
            this[prop] = shimNS.window[prop].bind(shimNS.window);
        }
    });
    // We need to overcome the `value.js` test's `instanceof` checks as
    //   our IDB object is injected rather than inline
    // jsdom doesn't make them available as `window` properties
    Object.defineProperty(Array, Symbol.hasInstance, {
        value: (obj) => Array.isArray(obj),
        configurable: true
    });

    Object.defineProperty(Date, Symbol.hasInstance, {
        value: (obj) => shimNS.isDateObject(obj),
        configurable: true
    });

    // testharness.js's own `show_results()` (building its native HTML
    //   results table) walks its `["tag", attrs, ...children]` template
    //   arrays and checks `children[i] instanceof Object` to decide whether
    //   a child is a nested template (array) or plain text -- since these
    //   arrays are cross-realm relative to whatever realm `Object` is
    //   evaluated from here, that check can spuriously come back `false`,
    //   causing nested templates to be stringified as text (e.g. the results
    //   table's own child elements) instead of rendered, and (worse) causing
    //   a later `getElementById("rerun")` lookup on the now-malformed markup
    //   to return `null` and throw -- aborting the shared `all_done_callbacks`
    //   loop before our own `add_completion_callback` handler below ever
    //   gets to run. Same fix as `Array`/`Date` above, generalized: match
    //   real `instanceof Object` semantics (true for any non-null object or
    //   function) regardless of which realm the value came from.
    Object.defineProperty(Object, Symbol.hasInstance, {
        value: (obj) => obj !== null && (typeof obj === 'object' || typeof obj === 'function'),
        configurable: true
    });

    const {colors} = shimNS;
    const theme = {
        pass: 'green',
        fail: 'red',
        timeout: 'red',
        notrun: 'red'
    };
    colors.setTheme(theme);

    /**
     * @param {string} statusText
     * @param {string} status
     * @returns {void}
     */
    function write (statusText, status) {
        const color = colors[Object.keys(theme)[status]];
        let msg = color(statusText);
        shimNS.statuses[statusText] += 1;
        msg += ' ' + shimNS.statuses[statusText];
        shimNS.write(msg);
    }

    const {fileName} = shimNS;

    /**
     * @param {{
     *   status: number,
     *   name: string,
     *   message: string,
     *   stack: string
     * }[]} tests
     * @returns {void}
     */
    function reportResults (tests) {
        // Todo: Look instead on `id=log` and possibly `id=summary` or
        //      `id=metadata_cache` if we add one (and `id=metadata_cache`?)
        // Insert our own reporting to be ready once tests evaluate
        const trs = [...document.querySelectorAll('table#results > tbody > tr')];
        trs.forEach((tr, i) => {
            const test = tests[i];
            // Only the direct-child `<td>`s of this `<tr>` (`tr.cells`, not
            //   `tr.querySelectorAll('td')`): testharness.js nests its own
            //   per-assertion "Asserts run" `<details><table>...</table></details>`
            //   inside the message `<td>` of every row, pass or fail, and
            //   `querySelectorAll('td')` matches those nested `<td>`s too,
            //   throwing off which index holds which real column.
            const tds = [...tr.cells].map((td) => td.textContent);
            const [statusText] = tds; // 2nd is testName
            // `test.properties.assert` (WPT's optional, rarely-used metadata
            //   listing which named assertions a test covers) is the only
            //   thing here not already available directly on `test` --
            //   message/stack come straight from `test` below instead of
            //   being scraped from the DOM, since that DOM text also
            //   includes the "Asserts run" block noted above.
            const assertions = test.properties && Object.hasOwn(test.properties, 'assert')
                ? (Array.isArray(test.properties.assert) ? test.properties.assert.join(' ') : test.properties.assert)
                : undefined;
            write(statusText, test.status);
            if (!shimNS.files[statusText].includes(fileName)) { shimNS.files[statusText].push(fileName); }
            shimNS.writeln(' (' + fileName + '): ' + test.name);
            if (assertions) { shimNS.writeln(assertions); }
            // testharness.js captures `.message`/`.stack` for every assertion
            //   call, pass or fail, purely as internal bookkeeping -- only
            //   print it for a genuine failure/timeout/not-run, where it's
            //   actually diagnostic; echoing it for `status === 0` (pass) just
            //   prints a message-less "Error" stack trace after every single
            //   passing assertion.
            if (test.status !== 0 && test.message && test.stack) {
                shimNS.writeStack(test.message || ' ', test.stack);
            }
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

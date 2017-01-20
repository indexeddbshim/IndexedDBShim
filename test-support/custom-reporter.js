/* globals shimNS, add_completion_callback */
// Now set-up our mechanism to report results back
(function () {
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

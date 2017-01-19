/* globals statuses, shimFiles, fileName, finished, add_completion_callback */
(function () {
    const shimNS = {
        write: function (msg) {
            (process && process.stdout && process.stdout.isTTY) ? process.stdout.write(msg) : console.log(msg);
        },
        writeln: function (msg) {
            console.log(msg);
        }
    };

    const colors = require('colors/safe');
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
        statuses[statusText] += 1;
        msg += statuses[statusText];
        shimNS.write(msg);
    }

    function reportResults (tests, harnessStatus) {
        // Todo: Look instead on `id=log` and possibly `id=summary` or
        //      `id=metadata_cache` if we add one (and `id=metadata_cache`?)
        // Insert our own reporting to be ready once tests evaluate
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
            if (!shimFiles[statusText].includes(fileName)) shimFiles[statusText].push(fileName);
            shimNS.writeln(' (' + fileName + '): ' + test.name);
            if (assertions) shimNS.writeln(assertions);
            if (test.message && test.stack) shimNS.writeln((test.message || ' ') + test.stack);
        });
        finished();
    }
    add_completion_callback((...args) => {
        try {
            reportResults(...args);
        } catch (err) {
            console.log('err' + err);
        }
    });
}());

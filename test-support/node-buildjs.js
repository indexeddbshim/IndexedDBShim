const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Known scripts
const testHarnessScripts = ['/resources/testharness.js', '/resources/testharnessreport.js'];
const supportAndTestHarnessScripts = testHarnessScripts.concat('support.js', 'support-promises.js');
const webIDLScripts = supportAndTestHarnessScripts.concat('/resources/WebIDLParser.js', '/resources/idlharness.js');

const dirPath = process.argv[2] || 'web-platform-tests/IndexedDB';
const builtJSPath = path.join('test-support', 'js');
fs.mkdir(builtJSPath, function () {
    fs.readdir(dirPath, function (err, items) {
        if (err) { return console.log(err); }
        const htmlExt = /\.html?$/;
        const normalIndexedDBFiles = items.filter((item) => item.match(htmlExt));
        const htmlFiles = normalIndexedDBFiles.map((htmlFile) => ({
            inputFile: path.join(dirPath, htmlFile),
            outputFile: path.join(builtJSPath, htmlFile.replace(htmlExt, '.js'))
        })).concat({
            // Uses IndexedDB test and is used by IndexedDB
            inputFile: 'web-platform-tests/html/infrastructure/common-dom-interfaces/collections/domstringlist.html',
            outputFile: path.join(builtJSPath, 'domstringlist.js')
        });
        let ct = 0;

        // Iterate IndexedDB files
        htmlFiles.forEach(({inputFile, outputFile}, i) => {
            fs.readFile(inputFile, 'utf8', function (err, data) {
                if (err) { return console.log(err); }

                // Extract JavaScript content and save to file
                const $ = cheerio.load(data);

                // List files without standard 3 items
                const scriptCount = $('script[src]').length;

                // Confirm there are no unexpected elements which should be handled in the test
                // <(?!/?(script(>| src| type="text/javascript")|div( id="?log"?)?>|link|meta|!|title>|html|http|DOM|head>|body>| |=))
                $('*').each(function (i, elem) {
                    if (!['html', 'head', 'body', 'meta', 'title', 'link', 'script', 'div', 'h1'].includes(elem.name)) {
                        console.log('Unexpected element: ' + elem.name);
                    }
                    const atts = Object.keys(elem.attribs);
                    if (atts.some((att) => {
                        return !['src', 'type', 'id', 'rel', 'charset', 'title', 'href', 'name', 'content'].includes(att);
                    })) {
                        console.log('Unrecognized attributes: ' + atts + ' on element: ' + elem.name);
                    }
                });

                // Build script content
                let scriptContent = '';
                $('script[src]').each(function (script, item) {
                    const src = $(this).attr('src');
                    if (scriptCount === 3 && !supportAndTestHarnessScripts.includes(src)) {
                        console.log('Found non-typical script src: ' + src + ' in: ' + inputFile);
                    } else if (scriptCount === 2 && !testHarnessScripts.includes(src)) {
                        console.log('Found non-typical script src (out of 2): ' + src + ' in: ' + inputFile);
                    } else if ((scriptCount < 2 || scriptCount > 3) && !webIDLScripts.includes(src)) {
                        console.log('Found non-typical script src: ' + src + ' in: ' + inputFile);
                    } else {
                        // scriptContent += "require('" + src.replace(/^\//, '../../').replace(/^support/, '../support') + "');\n";
                    }
                    scriptContent += '/' + '*beginscript::' + src + '::endscript*' + '/\n';
                });
                scriptContent += "document.title = '" + $('title').text().replace(/'/g, "\\'").replace(/\n|\r/g, ' ') + "';\n";
                scriptContent += $('script').text();

                fs.writeFile(outputFile, scriptContent, function (err) {
                    if (err) { return console.log(err); }
                    ct++;
                    if (ct === htmlFiles.length - 1) {
                        const script = 'interfaces.worker.js';
                        scriptContent = ['/resources/testharness.js', '/resources/testharnessreport.js'].reduce(
                            (s, src) => s + '/' + '*beginscript::' + src + '::endscript*' + '/\n',
                            ''
                        ) + "document.title = '" + script + "';\n" +
                            'fetch_tests_from_worker(new Worker("' + script + '"));'; // There is no name conflict as this will be attempting to load from inside web-platform-tests/IndexedDB/
                        fs.writeFile(path.join(builtJSPath, script), scriptContent, function (err) {
                            if (err) { return console.log(err); }
                            fs.readFile('web-platform-tests/resources/webidl2/lib/webidl2.js', 'utf8', function (err, data) {
                                if (err) { return console.log(err); }
                                fs.writeFile('web-platform-tests/resources/WebIDLParser.js', data, function (err) {
                                    if (err) { return console.log(err); }
                                    console.log('All files have been saved!');
                                });
                            });
                        });
                    }
                    // console.log("The file " + outputFile + " was saved!");
                });
            });
        });
    });
});

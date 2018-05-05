var dbPrefix = 'testdb-';
var dbSuffix = '';

function getDBName () {
    return dbPrefix + new Date().getTime() + dbSuffix;
}
function getDBNameRandom () {
    return dbPrefix + new Date().getTime() + Math.random() + dbSuffix;
}

function createdb(done, dbname, version)
{
    var rq_open = createdb_for_multiple_tests(dbname, version);
    return rq_open.setDone(done);
}

function createdb_for_multiple_tests(dbname, version) {
    var rq_open,
        fake_open = {},
        test = null,
        dbname = (dbname || getDBNameRandom());

    if (version)
        rq_open = indexedDB.open(dbname, version);
    else
        rq_open = indexedDB.open(dbname);

    function auto_fail(evt) {
        /* Fail handlers, if we haven't set on/whatever/, don't
         * expect to get event whatever. */
        rq_open['on' + evt] = function () { done(new Error('Unexpected ' + evt + ' event')) };
    }

    // add a .setTest method to the DB object
    Object.defineProperty(rq_open, 'setDone', {
        enumerable: false,
        value (d) {
            done = d;

            auto_fail("upgradeneeded");
            auto_fail("success");
            auto_fail("blocked");
            auto_fail("error");

            return this;
        }
    });

    return rq_open;
}

function format_value(val, seen)
{
    if (!seen) {
        seen = [];
    }
    if (typeof val === "object" && val !== null) {
        if (seen.indexOf(val) >= 0) {
            return "[...]";
        }
        seen.push(val);
    }
    if (Array.isArray(val)) {
        return "[" + val.map(function(x) {return format_value(x, seen);}).join(", ") + "]";
    }

    switch (typeof val) {
    case "string":
        val = val.replace("\\", "\\\\");
        for (var i = 0; i < 32; i++) {
            var replace = "\\";
            switch (i) {
            case 0: replace += "0"; break;
            case 1: replace += "x01"; break;
            case 2: replace += "x02"; break;
            case 3: replace += "x03"; break;
            case 4: replace += "x04"; break;
            case 5: replace += "x05"; break;
            case 6: replace += "x06"; break;
            case 7: replace += "x07"; break;
            case 8: replace += "b"; break;
            case 9: replace += "t"; break;
            case 10: replace += "n"; break;
            case 11: replace += "v"; break;
            case 12: replace += "f"; break;
            case 13: replace += "r"; break;
            case 14: replace += "x0e"; break;
            case 15: replace += "x0f"; break;
            case 16: replace += "x10"; break;
            case 17: replace += "x11"; break;
            case 18: replace += "x12"; break;
            case 19: replace += "x13"; break;
            case 20: replace += "x14"; break;
            case 21: replace += "x15"; break;
            case 22: replace += "x16"; break;
            case 23: replace += "x17"; break;
            case 24: replace += "x18"; break;
            case 25: replace += "x19"; break;
            case 26: replace += "x1a"; break;
            case 27: replace += "x1b"; break;
            case 28: replace += "x1c"; break;
            case 29: replace += "x1d"; break;
            case 30: replace += "x1e"; break;
            case 31: replace += "x1f"; break;
            }
            val = val.replace(RegExp(String.fromCharCode(i), "g"), replace);
        }
        return '"' + val.replace(/"/g, '\\"') + '"';
    case "boolean":
    case "undefined":
        return String(val);
    case "number":
        // In JavaScript, -0 === 0 and String(-0) == "0", so we have to
        // special-case.
        if (val === -0 && 1/val === -Infinity) {
            return "-0";
        }
        return String(val);
    case "object":
        if (val === null) {
            return "null";
        }

        // Special-case Node objects, since those come up a lot in my tests.  I
        // ignore namespaces.
        if (is_node(val)) {
            switch (val.nodeType) {
            case Node.ELEMENT_NODE:
                var ret = "<" + val.localName;
                for (var i = 0; i < val.attributes.length; i++) {
                    ret += " " + val.attributes[i].name + '="' + val.attributes[i].value + '"';
                }
                ret += ">" + val.innerHTML + "</" + val.localName + ">";
                return "Element node " + truncate(ret, 60);
            case Node.TEXT_NODE:
                return 'Text node "' + truncate(val.data, 60) + '"';
            case Node.PROCESSING_INSTRUCTION_NODE:
                return "ProcessingInstruction node with target " + format_value(truncate(val.target, 60)) + " and data " + format_value(truncate(val.data, 60));
            case Node.COMMENT_NODE:
                return "Comment node <!--" + truncate(val.data, 60) + "-->";
            case Node.DOCUMENT_NODE:
                return "Document node with " + val.childNodes.length + (val.childNodes.length == 1 ? " child" : " children");
            case Node.DOCUMENT_TYPE_NODE:
                return "DocumentType node";
            case Node.DOCUMENT_FRAGMENT_NODE:
                return "DocumentFragment node with " + val.childNodes.length + (val.childNodes.length == 1 ? " child" : " children");
            default:
                return "Node object of unknown type";
            }
        }

    /* falls through */
    default:
        return typeof val + ' "' + truncate(String(val), 60) + '"';
    }
}

var errs = [
    "AbortError",
    "ConstraintError",
    "DataCloneError",
    "DataError",
    "InvalidAccessError",
    "InvalidStateError",
    "NotFoundError",
    "QuotaExceededError",
    "SyntaxError",
    "ReadOnlyError",
    "TransactionInactiveError",
    "UnknownError",
    "VersionError"
];

function throws (cb, errName, msg) {
    if (errs.indexOf(errName) === -1) {
        throw new Error("Unrecognized error name");
    }
    try {
        cb();
    } catch (err) {
        assert(err instanceof DOMException, "DOMException");
        assert.equal(err.name, errName, msg);
        return;
    }
    throw new Error("Assertion did not throw: " + msg);
}

function assert_unreached(description) {
     assert(false, "assert_unreached", description,
            "Reached unreachable code");
}

function instanceOf (obj, Clss) {
    return Clss[Symbol.hasInstance](obj);
}

var support = {
    createdb: createdb,
    format_value: format_value,
    instanceOf: instanceOf,
    getDBName: getDBName,
    getDBNameRandom: getDBNameRandom,
    throws: throws,
    assert_unreached: assert_unreached
};

if (typeof module !== 'undefined') {
    module.exports = support;
}

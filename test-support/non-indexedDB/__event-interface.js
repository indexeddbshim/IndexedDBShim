// Out of web-platform-tests/dom/interfaces.html

/*beginscript::/resources/testharness.js::endscript*/
/*beginscript::/resources/testharnessreport.js::endscript*/
/*beginscript::/resources/WebIDLParser.js::endscript*/
/*beginscript::/resources/idlharness.js::endscript*/
document.title = 'Event IDL tests';
"use strict";
const idls = `
[Constructor(DOMString type, optional EventInit eventInitDict)/*,
 Exposed=(Window,Worker)*/]
interface Event {
  readonly attribute DOMString type;
  readonly attribute EventTarget? target;
  readonly attribute EventTarget? currentTarget;

  const unsigned short NONE = 0;
  const unsigned short CAPTURING_PHASE = 1;
  const unsigned short AT_TARGET = 2;
  const unsigned short BUBBLING_PHASE = 3;
  readonly attribute unsigned short eventPhase;

  void stopPropagation();
  void stopImmediatePropagation();

  readonly attribute boolean bubbles;
  readonly attribute boolean cancelable;
  void preventDefault();
  readonly attribute boolean defaultPrevented;

  [Unforgeable] readonly attribute boolean isTrusted;
  readonly attribute DOMTimeStamp timeStamp;

  void initEvent(DOMString type, boolean bubbles, boolean cancelable);
};

dictionary EventInit {
  boolean bubbles = false;
  boolean cancelable = false;
};

[Constructor(DOMString type, optional CustomEventInit eventInitDict)/*,
 Exposed=(Window,Worker)*/]
interface CustomEvent : Event {
  readonly attribute any detail;

  void initCustomEvent(DOMString type, boolean bubbles, boolean cancelable, any detail);
};

dictionary CustomEventInit : EventInit {
  any detail = null;
};

//[Exposed=(Window,Worker)]
interface EventTarget {
  void addEventListener(DOMString type, EventListener? callback, optional boolean capture = false);
  void removeEventListener(DOMString type, EventListener? callback, optional boolean capture = false);
  boolean dispatchEvent(Event event);
};

callback interface EventListener {
  void handleEvent(Event event);
};
`;

test(function(t) {
    var idlArray = new IdlArray();

    // Event, EventTarget
    idlArray.add_idls(idls);

    idlArray.test();
    t.done();
});

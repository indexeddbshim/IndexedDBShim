// Must be the *first* import wherever it's used (see `node-idb-test.js`) --
//   before anything that transitively imports `typeson-registry` (e.g.
//   `src/Sca.js`, pulled in via `indexeddbshim`). Each of typeson-registry's
//   DOMMatrix/DOMPoint/DOMRect/DOMQuad type specs checks `typeof X !==
//   'undefined'` exactly once, at that spec module's own first evaluation,
//   to decide whether to register cloning support for that type at all. In
//   a real browser these globals already exist by then; Node has none of
//   them, so without this running first, `structured-clone.any.js`'s
//   DOMMatrix/DOMPoint/DOMRect round-trips have no clone implementation to
//   go through at all -- not just a sandbox-realm prototype mismatch.
import {
    DOMMatrix, DOMMatrixReadOnly, DOMPoint, DOMPointReadOnly,
    DOMRect, DOMRectReadOnly, DOMQuad
} from 'typeson-registry/polyfills';

Object.assign(globalThis, {
    DOMMatrix, DOMMatrixReadOnly, DOMPoint, DOMPointReadOnly,
    DOMRect, DOMRectReadOnly, DOMQuad
});

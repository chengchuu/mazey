# jQuery-style DOM visibility helpers

## Problem and approach

Add public `hide()` and `show()` DOM helpers that accept a CSS selector, one
element, or an element collection. They will mutate each resolved element and
return the caller's original target to support chaining. The behavior will be
locally implemented because the existing Mazey API has no suitable visibility
utility and the package intentionally has no runtime dependencies.

The helpers will use browser DOM and computed-style APIs to provide jQuery-style
visibility behavior:

- `hide()` preserves a visible element's existing inline display value before
  setting `display: none`.
- `show()` restores a preserved inline display value. When CSS keeps the element
  hidden after clearing an inline `display: none`, it will apply a suitable
  default display for that element's document and tag.
- Direct elements, selectors, iterables, and array-like DOM collections will be
  resolved without duplicate mutations. Invalid selectors and unsupported
  values will resolve to no targets and leave the input unchanged.

## Todos

1. Define target resolution and visibility behavior in `src/dom.ts`, including
   display-value preservation and document-aware default-display resolution.
2. Add `hide()` and `show()` TypeDoc API documentation and examples, retaining
   the flat `src/index.ts` export through its DOM re-export.
3. Add deterministic jsdom coverage in `test/dom.test.js` for direct elements,
   selectors, iterable and array-like collections, chaining returns, inline
   display restoration, stylesheet-hidden elements, default display recovery,
   invalid targets, and duplicate target handling.
4. Document the two public DOM helpers in `README.md` and, if the API catalog
   changes, update the canonical `prefer-mazey` map and synchronize its public
   copy.
5. Build the package before running the focused DOM test suite; inspect
   generated declarations and package contents because this adds public API.

## Notes and considerations

- The current DOM mutators accept `HTMLElement | null`, but the requested
  selector and collection support requires a dedicated public target type that
  can represent `Element`, selectors, `Iterable<Element>`, and
  `ArrayLike<Element>`.
- The functions are browser-only at call time. They must not access `document`
  or `getComputedStyle` until resolving a target that requires those APIs.
- Return type is intentionally the original target, not an element list or a
  jQuery wrapper.
- No suitable Mazey utility exists; this is a focused local DOM implementation.

# Native API modernization plan

## Summary

Modernize Mazey's maintained package source by replacing obsolete browser-compatibility code with mature Web Platform and ECMAScript APIs. Preserve public APIs, intentional Mazey semantics, SSR safety, package formats, and the zero-runtime-dependency contract.

Create [`NATIVE_API_MODERNIZATION_AUDIT.md`](./NATIVE_API_MODERNIZATION_AUDIT.md) before broad implementation. The audit will record each candidate's current behavior, native alternative, compatibility, semantic differences, risk, decision, status, and required regression coverage.

## Runtime baseline

Replace Babel's moving `> 1%, last 2 versions, android>4.0` query with this fixed support policy:

- Chrome 109 or later
- Edge 109 or later
- Firefox 115 or later
- Safari 16.4 or later
- iOS Safari 16.4 or later
- Android Chrome 109 or later
- Samsung Internet 21 or later

Internet Explorer, Opera Mini, KaiOS, the legacy Android Browser, and older WebKit or Firefox releases are outside the new support contract.

Define the browser policy centrally through Browserslist configuration and make Babel consume it. Raise the TypeScript `target` from `ES2015` to `ES2022`, and use the `ES2022`, `DOM`, and `DOM.Iterable` libraries. ES2022 syntax becomes part of the generated package contract.

Do not add a Node.js `engines` restriction. Node.js 22 remains the CI and development validation environment, but package runtime compatibility with Node.js stays unspecified.

## Implementation changes

### Build configuration

- Remove Babel's embedded popularity query in favor of the central fixed Browserslist policy.
- Remove ineffective `core-js` entry-mode configuration and redundant explicit transforms already governed by the selected target.
- Remove only development dependencies proven unused after the Babel changes, including the corresponding `core-js` and runtime-core-js packages.
- Update `pnpm-lock.yaml` only when required by those intentional dependency removals. Do not create or modify `package-lock.json`.
- Keep Rollup responsible for CommonJS, ESM, browser IIFE, and declaration outputs.

### High-confidence native replacements

- Use native `WeakMap` for clone-cycle tracking.
- Use `RegExp.prototype.flags` and unconditional symbol-key reflection.
- Use `Object.hasOwn` where it exactly preserves prototype-safe ownership checks.
- Implement `mTrim` with `String.prototype.trim` and `mNow` with `Date.now`.
- Simplify URL parsing around guaranteed `URL` support while preserving Mazey's strict HTTP hostname validation, malformed-input handling, relative-document resolution, duplicate query behavior, encoding, ordering, and fragments.
- Make `cancelBubble` use standard `Event.stopPropagation`.
- Replace old WebKit and Firefox stylesheet polling and IE script `readyState` handling with standard load and error events. Register handlers before inserting resources.
- Use standard `MediaQueryList` change events without `addListener` or `removeListener` fallbacks.
- Use `PerformanceNavigationTiming` without the deprecated `PerformanceTiming` fallback while preserving `WebPerformance` field names, calculations, and camel-case selection.

### Intentional implementations to retain

Keep custom code where native behavior is not equivalent, including:

- query parsing and `updateQueryParam` serialization rules;
- strict local date parsing, validation, leap-year behavior, and formatting tokens;
- `deepCopy` support for descriptors, symbols, cycles, cross-realm values, custom instances, and unsupported native objects;
- cookie name/value encoding and storage failure behavior;
- selector validation that converts invalid-selector exceptions to `false`;
- Mazey's named event registry and timer semantics;
- explicit browser, operating-system, device, crawler, and automation classification;
- the iOS standalone PWA compatibility signal;
- numeric random-string and hashing contracts;
- loading, cancellation, and cleanup behavior without exact native equivalents.

Do not use `URL.canParse`, `AbortSignal.any`, immutable array methods, Temporal, or other APIs that exceed the selected baseline. Record such candidates as deferred rather than forcing replacements.

## Public API and documentation

- Preserve all public names, signatures, return shapes, aliases, module formats, and declaration exports.
- Add no new runtime dependencies and no new deprecations.
- Document the browser baseline and any below-baseline behavior changes in `README.md`, `README.zh-CN.md`, `AGENTS.md`, and relevant TypeDoc comments.
- Update the canonical `.agents/skills/prefer-mazey/` guidance when runtime assumptions or recommendations change, then synchronize it with the existing scripts.
- Do not hand-edit `lib/`, `dist-dev/`, `docs/`, or `coverage/`.

## Regression testing

Before editing each candidate, compare the current and proposed behavior for relevant inputs, including empty and invalid values, Unicode, encoded URLs, duplicate query keys, circular objects, symbols, exceptions, SSR, mutation, event cleanup, and Promise settlement.

Add or update focused tests for:

- Unicode and all-whitespace trimming;
- `Date.now` delegation;
- clone cycles, symbols, RegExp flags, and prototype-safe ownership;
- strict URL validation and serialization plus absolute and relative `getDomain` behavior;
- stylesheet and script success, failure, cleanup, and single settlement;
- standard event propagation and idempotent media-query cleanup;
- modern navigation timing with unchanged snake-case and camel-case output;
- consistent CJS, ESM, browser IIFE, and declaration exports.

Tests that only simulate environments below the declared baseline may be removed or rewritten, but their still-supported behavioral assertions must remain covered.

## Validation

Build package output before tests that import `lib/`, then run:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
npm test
npm run docs
npm run preview
npm run skill:sync
npm run skill:sync:check
npm pack --dry-run
```

Also validate the sibling skills repository, compare the canonical and public skill trees, inspect CJS, ESM, IIFE, declarations, packed files, and runtime dependencies, and run final Git diff and whitespace checks.

Do not stage, commit, tag, push, publish, or deploy as part of this work.

## Acceptance criteria

- The audit covers every maintained runtime module rather than selected search results.
- Every candidate has an evidence-based decision and risk level.
- Native APIs replace only compatibility mechanisms that are unnecessary under the fixed baseline and semantically equivalent.
- Intentional Mazey behavior remains intact.
- Public APIs and all package formats remain consistent.
- No runtime dependency is introduced.
- Material replacements have focused regression coverage.
- Documentation and prefer-Mazey guidance match the implemented behavior.
- Generated artifacts are produced only by their owning scripts.
- All applicable validation passes, with any remaining limitations reported explicitly.

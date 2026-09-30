# Native API modernization audit

## Browser and runtime baseline

Mazey previously had no fixed browser-version contract. Babel used the moving query `> 1%, last 2 versions, android>4.0`, which currently includes partial or legacy runtimes such as Opera Mini and KaiOS. TypeScript emitted ES2015 while declaring the open-ended `ESNext` library.

This modernization adopts a fixed baseline: Chrome and Edge 109+, Firefox 115+, Safari and iOS Safari 16.4+, Android Chrome 109+, and Samsung Internet 21+. Internet Explorer, Opera Mini, KaiOS, the legacy Android Browser, and older WebKit or Firefox releases are unsupported. Node.js remains unspecified as a package runtime; Node.js 22 is the tested development and CI environment.

The selected browsers support ES2022 syntax and the native APIs used by implemented replacements. APIs newer than this floor remain guarded, custom, or deferred.

## Candidate summary

| ID      | Area        | Existing approach                                   | Native candidate                     | Risk   | Decision    | Status      |
|:--------|:------------|:----------------------------------------------------|:-------------------------------------|:-------|:------------|:------------|
| MOD-001 | Build       | Moving popularity query                             | Fixed Browserslist targets           | Medium | Replace     | Implemented |
| MOD-002 | TypeScript  | ES2015 output and open-ended libraries              | ES2022                               | Medium | Replace     | Implemented |
| MOD-003 | Babel       | Ineffective entry polyfill and redundant transforms | Target-driven preset                 | Low    | Simplify    | Implemented |
| MOD-004 | Object      | Array fallback for clone cycles                     | `WeakMap`                            | Low    | Replace     | Implemented |
| MOD-005 | Object      | Feature checks for RegExp flags and symbols         | `RegExp.flags`, symbol reflection    | Low    | Replace     | Implemented |
| MOD-006 | Object      | Borrowed `hasOwnProperty` calls                     | `Object.hasOwn`                      | Low    | Replace     | Implemented |
| MOD-007 | String      | Manual whitespace trimming                          | `String.prototype.trim`              | Low    | Replace     | Implemented |
| MOD-008 | Date        | `Date.now` availability fallback                    | `Date.now`                           | Low    | Replace     | Implemented |
| MOD-009 | URL         | URL-constructor availability helper                 | Guaranteed `URL`                     | Low    | Simplify    | Implemented |
| MOD-010 | URL         | Custom query parsing and serialization              | `URLSearchParams`                    | Medium | Keep        | No change   |
| MOD-011 | URL         | Complete HTTP fallback parser                       | `URL` plus Mazey grammar             | Medium | Simplify    | Implemented |
| MOD-012 | DOM         | Manual class manipulation                           | `classList`                          | Medium | Keep        | No change   |
| MOD-013 | DOM         | Selector exception wrapper                          | `querySelector`                      | Low    | Keep        | No change   |
| MOD-014 | Events      | IE propagation fallback                             | `Event.stopPropagation`              | Low    | Replace     | Implemented |
| MOD-015 | Events      | Global named-listener registry                      | `EventTarget`                        | High   | Keep        | No change   |
| MOD-016 | Loading     | WebKit/Firefox polling and IE ready state           | Standard load/error events           | Medium | Replace     | Implemented |
| MOD-017 | Loading     | URL-resolution fallback                             | `URL`                                | Medium | Keep        | No change   |
| MOD-018 | Browser     | Legacy media-query listeners                        | Standard change events               | Low    | Replace     | Implemented |
| MOD-019 | PWA         | iOS standalone signal                               | Display-mode query only              | Medium | Keep        | No change   |
| MOD-020 | Performance | Deprecated navigation timing fallback               | `PerformanceNavigationTiming`        | Medium | Simplify    | Implemented |
| MOD-021 | Browser     | User-Agent classification                           | Feature detection or UA Client Hints | High   | Keep        | No change   |
| MOD-022 | Object      | Contract-aware deep clone                           | `structuredClone`                    | High   | Keep        | No change   |
| MOD-023 | Date        | Strict local parser                                 | `Date.parse` or Temporal             | High   | Keep        | No change   |
| MOD-024 | Language    | Canonicalization and display-name fallbacks         | `Intl` APIs                          | Medium | Keep        | No change   |
| MOD-025 | Storage     | Encoded cookie and JSON storage contracts           | Cookie Store API                     | High   | Keep        | No change   |
| MOD-026 | Async       | Timer and cancellation contracts                    | AbortSignal helpers                  | Medium | Investigate | Deferred    |
| MOD-027 | Randomness  | Numeric random-string contracts                     | Web Crypto UUID APIs                 | High   | Keep        | No change   |
| MOD-028 | Loading     | Image and script element contracts                  | `decode`, `fetch`, modules           | Medium | Keep        | No change   |

## Audit coverage

Every maintained package source file was reviewed. Files without a distinct
candidate are listed explicitly so the audit does not imply that they were
omitted.

| Source file          | Audit result                                                          |
|:---------------------|:----------------------------------------------------------------------|
| `src/browser.ts`     | MOD-018, MOD-019, MOD-021, MOD-026, and MOD-028                 |
| `src/calc.ts`        | No compatibility shim or equivalent native replacement found          |
| `src/date.ts`        | MOD-008 and MOD-023                                                     |
| `src/debug.ts`       | MOD-024                                                                 |
| `src/dom.ts`         | MOD-012 and MOD-013                                                     |
| `src/event.ts`       | MOD-014 and MOD-015                                                     |
| `src/index.ts`       | Export surface reviewed; no implementation candidate                  |
| `src/language.ts`    | MOD-024                                                                 |
| `src/load.ts`        | MOD-016, MOD-017, MOD-026, and MOD-028                                 |
| `src/package.ts`     | No compatibility shim or equivalent native replacement found          |
| `src/perf.ts`        | MOD-020 and MOD-021                                                     |
| `src/preference.ts`  | MOD-025                                                                 |
| `src/store.ts`       | MOD-025                                                                 |
| `src/theme.ts`       | Media-query observation is delegated to MOD-018                       |
| `src/typing.d.ts`    | Declarations reviewed; no implementation candidate                    |
| `src/url.ts`         | MOD-009, MOD-010, and MOD-011                                           |
| `src/util.ts`        | MOD-004 through MOD-007, MOD-022, MOD-026, and MOD-027                 |

## Detailed findings

### MOD-001: Replace the moving browser query

**Area:** Build  
**Affected files:** `.babelrc`, `package.json`  
**Current implementation:** Babel embeds a popularity query whose resolved browsers change over time and include runtimes without a consistent native-API set.  
**Historical reason:** Broad browser compatibility.  
**Native candidate:** A fixed Browserslist contract.  
**Standard:** Build configuration  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Compatible with an explicit support-policy change  
**Public API impact:** Behavioral below the new browser floor  
**Risk:** Medium  
**Decision:** Replace  
**Reason:** Native dependencies need a stable, auditable minimum rather than a moving usage threshold.  
**Required tests:** Assert the configured minimums and inspect generated syntax.

### MOD-002: Emit ES2022

**Area:** TypeScript  
**Affected files:** `tsconfig.json`  
**Current implementation:** TypeScript targets ES2015 and combines `es5`, DOM, ScriptHost, and `ESNext` declarations.  
**Historical reason:** Older JavaScript engines and permissive native typings.  
**Native candidate:** ES2022 output and libraries.  
**Standard:** ECMAScript 2022  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact for library behavior; generated syntax changes  
**Public API impact:** Runtime syntax baseline  
**Risk:** Medium  
**Decision:** Replace  
**Reason:** ES2022 matches the chosen browsers and prevents accidental use of APIs newer than the contract.  
**Required tests:** Type-check every project, build all formats, and smoke-test each output.

### MOD-003: Remove ineffective polyfill configuration

**Area:** Build  
**Affected files:** `.babelrc`, `package.json`, `pnpm-lock.yaml`  
**Current implementation:** `useBuiltIns: "entry"` declares Core-JS behavior without a package entry importing Core-JS; explicit class-property and object-rest transforms duplicate target-driven preset behavior.  
**Historical reason:** Legacy transpilation and polyfill setup.  
**Native candidate:** Target-driven `@babel/preset-env`.  
**Standard:** ECMAScript  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact for current builds  
**Public API impact:** None  
**Risk:** Low  
**Decision:** Simplify  
**Reason:** The package intentionally ships no runtime polyfill and the fixed target owns syntax transformation.  
**Required tests:** Build inspection and dependency/bundle checks.

### MOD-004: Use WeakMap for clone-cycle tracking

**Area:** Object  
**Affected files:** `src/util.ts`  
**Current implementation:** `deepCopy` falls back to parallel arrays when `WeakMap` is absent.  
**Historical reason:** Pre-WeakMap compatibility.  
**Native candidate:** `WeakMap`  
**Standard:** ECMAScript 2015  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact within the supported baseline  
**Public API impact:** Behavioral only in unsupported runtimes without `WeakMap`  
**Risk:** Low  
**Decision:** Replace  
**Reason:** Every supported runtime provides `WeakMap`; the array cache is polyfill-like code.  
**Required tests:** Circular objects, repeated references, and primitives.

### MOD-005: Use standard RegExp and symbol reflection

**Area:** Object  
**Affected files:** `src/util.ts`  
**Current implementation:** Clone helpers reconstruct RegExp flags and conditionally read symbol keys when native properties are absent.  
**Historical reason:** Pre-ES2015 compatibility.  
**Native candidate:** `RegExp.prototype.flags`, `Object.getOwnPropertySymbols`  
**Standard:** ECMAScript 2015  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact  
**Public API impact:** None within the supported baseline  
**Risk:** Low  
**Decision:** Replace  
**Reason:** Native reflection handles current and future supported flags without duplicated reconstruction.  
**Required tests:** RegExp source/flags/lastIndex and enumerable/non-enumerable symbol properties.

### MOD-006: Use Object.hasOwn

**Area:** Object and URL  
**Affected files:** `src/util.ts`, `src/url.ts`  
**Current implementation:** Prototype-safe ownership uses borrowed `hasOwnProperty`.  
**Historical reason:** `Object.hasOwn` was unavailable.  
**Native candidate:** `Object.hasOwn`  
**Standard:** ECMAScript 2022  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact  
**Public API impact:** None  
**Risk:** Low  
**Decision:** Replace  
**Reason:** The native operation directly expresses the existing prototype-safe check.  
**Required tests:** Null-prototype objects, `__proto__`, and duplicate query keys.

### MOD-007: Replace manual trimming

**Area:** String  
**Affected files:** `src/util.ts`  
**Current implementation:** `mTrim` removes leading whitespace with a regular expression and scans trailing whitespace manually.  
**Historical reason:** Pre-native trim compatibility.  
**Native candidate:** `String.prototype.trim`  
**Standard:** ECMAScript 5  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact in supported engines  
**Public API impact:** None  
**Risk:** Low  
**Decision:** Replace  
**Reason:** Native trim is clearer and covers the standardized whitespace set.  
**Required tests:** Empty, all-whitespace, internal whitespace, and Unicode whitespace.

### MOD-008: Replace Date.now fallback

**Area:** Date  
**Affected files:** `src/date.ts`  
**Current implementation:** `mNow` checks for `Date.now` and falls back to `new Date().getTime()`.  
**Historical reason:** Pre-ES5 compatibility.  
**Native candidate:** `Date.now`  
**Standard:** ECMAScript 5  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact  
**Public API impact:** None  
**Risk:** Low  
**Decision:** Replace  
**Reason:** The fallback is unreachable in supported runtimes.  
**Required tests:** Delegation to a controlled `Date.now` value.

### MOD-009: Remove URL-constructor availability checks

**Area:** URL  
**Affected files:** `src/url.ts`  
**Current implementation:** Helpers test whether `URL` exists and use an anchor fallback.  
**Historical reason:** Browsers without WHATWG URL.  
**Native candidate:** `URL` with `document.baseURI` for relative inputs  
**Standard:** WHATWG URL  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Compatible with retained malformed-input handling  
**Public API impact:** None within the baseline  
**Risk:** Low  
**Decision:** Simplify  
**Reason:** Availability detection is obsolete, while a narrow anchor fallback remains useful for existing malformed-input behavior.  
**Required tests:** Absolute, relative, protocol-relative, invalid, and multi-rule extraction.

### MOD-010: Preserve query-string semantics

**Area:** URL  
**Affected files:** `src/url.ts`  
**Current implementation:** Mazey parses bare query strings, ignores key-only parts, tolerates malformed escapes, preserves duplicates and ordering, and serializes replacement spaces as `%20`.  
**Historical reason:** Intentional API behavior and earlier browser compatibility.  
**Native candidate:** `URLSearchParams`  
**Standard:** WHATWG URL  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Incompatible  
**Public API impact:** Behavioral  
**Risk:** Medium  
**Decision:** Keep  
**Reason:** `URLSearchParams` changes key-only pairs, malformed decoding, untouched encoding, and space serialization.  
**Required tests:** Existing duplicate, key-only, malformed, plus-sign, `%20`, fragment, and ordering cases.

### MOD-011: Retain HTTP grammar around native URL

**Area:** URL  
**Affected files:** `src/url.ts`  
**Current implementation:** A custom grammar validates hostnames, ports, IPv4, IPv6, credentials, and strict/protocol-relative inputs before native parsing, with a second fallback for missing or broken `URL`.  
**Historical reason:** Native URL normalization accepts inputs Mazey intentionally rejects, plus older URL availability.  
**Native candidate:** `URL`  
**Standard:** WHATWG URL  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Compatible only when Mazey grammar remains  
**Public API impact:** None within the baseline  
**Risk:** Medium  
**Decision:** Simplify  
**Reason:** Remove only the unavailable-constructor fallback; keep the strict grammar that prevents shorthand IPv4, credentials, single-label hosts, and invalid ports.  
**Required tests:** Full existing HTTP URL matrix.

### MOD-012: Preserve class helper behavior

**Area:** DOM  
**Affected files:** `src/dom.ts`  
**Current implementation:** Scalar class helpers manipulate `className`; array addition uses `classList`.  
**Historical reason:** Compatibility and permissive string behavior.  
**Native candidate:** `classList`  
**Standard:** DOM  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Compatible with caveats  
**Public API impact:** Behavioral for whitespace tokens, duplicate classes, and exception behavior  
**Risk:** Medium  
**Decision:** Keep  
**Reason:** A complete replacement would make previously tolerated scalar strings throw and would normalize removals differently.  
**Required tests:** Existing class addition, duplication, removal, and empty-value cases.

### MOD-013: Preserve selector validation

**Area:** DOM  
**Affected files:** `src/dom.ts`  
**Current implementation:** Mazey calls `querySelector` and converts invalid-selector exceptions to `false`.  
**Historical reason:** Intentional validation abstraction.  
**Native candidate:** Direct `querySelector`  
**Standard:** DOM  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Incompatible error contract  
**Public API impact:** Behavioral  
**Risk:** Low  
**Decision:** Keep  
**Reason:** The wrapper adds meaningful boolean and SSR semantics.  
**Required tests:** Invalid selectors, empty values, supplied roots, and missing DOM.

### MOD-014: Use standard propagation cancellation

**Area:** Events  
**Affected files:** `src/event.ts`  
**Current implementation:** `cancelBubble` accepts `window.event` and falls back to the IE `cancelBubble` property.  
**Historical reason:** Internet Explorer event compatibility.  
**Native candidate:** `Event.stopPropagation`  
**Standard:** DOM  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact for the declared `Event` input  
**Public API impact:** Behavioral only for invalid legacy event-like objects  
**Risk:** Low  
**Decision:** Replace  
**Reason:** Supported browsers always provide the standard method.  
**Required tests:** Standard event propagation call and return value.

### MOD-015: Preserve the Mazey event registry

**Area:** Events  
**Affected files:** `src/event.ts`  
**Current implementation:** Named callbacks are stored on `window`, allow duplicates, accept an optional object, and dispatch a snapshot.  
**Historical reason:** Application-level custom event semantics.  
**Native candidate:** `EventTarget`, `CustomEvent`  
**Standard:** DOM  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Incompatible  
**Public API impact:** Behavioral and type  
**Risk:** High  
**Decision:** Keep  
**Reason:** Native events would change payload, duplicate, global-registry, and removal semantics.  
**Required tests:** Duplicate listeners, prototype names, snapshot dispatch, and removal.

### MOD-016: Use standard stylesheet and script events

**Area:** Loading  
**Affected files:** `src/load.ts`  
**Current implementation:** Stylesheets poll for old WebKit and Firefox; scripts and styles support IE `readyState`.  
**Historical reason:** WebKit before 536, Firefox before 9, and Internet Explorer.  
**Native candidate:** `HTMLLinkElement` and `HTMLScriptElement` load/error events  
**Standard:** HTML  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact for supported browsers  
**Public API impact:** Behavioral below the baseline  
**Risk:** Medium  
**Decision:** Replace  
**Reason:** Polling, UA parsing, and ready-state handlers are obsolete and can miss fast events because link handlers are currently assigned after insertion.  
**Required tests:** Handler-before-insertion, success, failure, timeout, callback rejection, and single settlement.

### MOD-017: Preserve CSS companion URL recovery

**Area:** Loading  
**Affected files:** `src/load.ts`  
**Current implementation:** `URL` resolves companion CSS paths, with a textual fallback when browser location or inputs reject.  
**Historical reason:** Boundary resilience for caller-provided URLs and browser globals.  
**Native candidate:** `URL` only  
**Standard:** WHATWG URL  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Compatible with caveats  
**Public API impact:** Behavioral on malformed inputs  
**Risk:** Medium  
**Decision:** Keep  
**Reason:** The catch protects a real external-input/browser boundary and preserves the established best-effort CSS behavior.  
**Required tests:** Absolute and relative companion URLs and CSS failure isolation.

### MOD-018: Use MediaQueryList change events

**Area:** Browser  
**Affected files:** `src/browser.ts`  
**Current implementation:** The helper prefers standard events but falls back to deprecated `addListener` and `removeListener`.  
**Historical reason:** Older Safari and browser compatibility.  
**Native candidate:** `addEventListener("change")`, `removeEventListener`  
**Standard:** CSSOM View  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact within the baseline  
**Public API impact:** Behavioral below the baseline  
**Risk:** Low  
**Decision:** Replace  
**Reason:** Every supported browser exposes standard event methods.  
**Required tests:** Delivery, idempotent cleanup, `null`, invalid inputs, and unavailable standard methods.

### MOD-019: Preserve the iOS standalone signal

**Area:** PWA  
**Affected files:** `src/browser.ts`  
**Current implementation:** Standard display-mode detection falls back to `navigator.standalone`.  
**Historical reason:** iOS PWA behavior.  
**Native candidate:** Display-mode media query only  
**Standard:** Web App Manifest plus browser extension  
**Browser baseline compatibility:** Compatibility signal remains relevant  
**Semantic compatibility:** Incompatible on iOS cases  
**Public API impact:** Behavioral  
**Risk:** Medium  
**Decision:** Keep  
**Reason:** The fallback remains necessary for the supported iOS baseline.  
**Required tests:** Standard match, iOS standalone, SSR, and inaccessible matchMedia.

### MOD-020: Remove deprecated PerformanceTiming

**Area:** Performance  
**Affected files:** `src/perf.ts`  
**Current implementation:** `getPerformance` prefers `PerformanceNavigationTiming` but falls back to deprecated `performance.timing`.  
**Historical reason:** Navigation Timing Level 1 compatibility.  
**Native candidate:** `PerformanceNavigationTiming`  
**Standard:** Performance Timeline and Navigation Timing Level 2  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Exact within the baseline  
**Public API impact:** Behavioral below the baseline  
**Risk:** Medium  
**Decision:** Simplify  
**Reason:** Supported browsers provide navigation entries; old timing values use a different time origin and should not remain mixed into one contract.  
**Required tests:** Completed and delayed navigation entries, field calculations, error path, and casing.

### MOD-021: Preserve browser and device classification

**Area:** Browser  
**Affected files:** `src/browser.ts`, `src/perf.ts`  
**Current implementation:** User-Agent and platform tokens classify captured or current browsers, systems, devices, crawlers, and automation.  
**Historical reason:** Intentional public classification.  
**Native candidate:** Feature detection and User-Agent Client Hints  
**Standard:** Web APIs  
**Browser baseline compatibility:** Client Hints are incomplete across the baseline  
**Semantic compatibility:** Incompatible  
**Public API impact:** Breaking  
**Risk:** High  
**Decision:** Keep  
**Reason:** Feature detection cannot classify an explicit captured UA, and Client Hints do not replace the promised taxonomy.  
**Required tests:** Existing explicit-UA, SSR, device, OS, crawler, and cached-browser cases.

### MOD-022: Preserve deepCopy semantics

**Area:** Object  
**Affected files:** `src/util.ts`  
**Current implementation:** Mazey clones supported built-ins, descriptors, symbols, cycles, buffers, maps, sets, and custom-instance state while preserving unsupported native objects by reference.  
**Historical reason:** Intentional clone contract.  
**Native candidate:** `structuredClone`  
**Standard:** HTML structured clone algorithm  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Incompatible  
**Public API impact:** Breaking  
**Risk:** High  
**Decision:** Keep  
**Reason:** `structuredClone` differs for functions, DOM nodes, prototypes, descriptors, unsupported values, and exception behavior.  
**Required tests:** Existing comprehensive clone matrix.

### MOD-023: Preserve strict date handling

**Area:** Date  
**Affected files:** `src/date.ts`  
**Current implementation:** Explicit local parsers validate fields, leap years, precision, time zones, and invalid dates.  
**Historical reason:** Intentional deterministic behavior.  
**Native candidate:** `Date.parse`, Temporal  
**Standard:** ECMAScript and proposed Temporal APIs  
**Browser baseline compatibility:** `Date.parse` is supported but semantically unsuitable; Temporal is outside the baseline  
**Semantic compatibility:** Incompatible  
**Public API impact:** Breaking  
**Risk:** High  
**Decision:** Keep  
**Reason:** Native Date parsing normalizes values Mazey rejects and varies for non-standard strings.  
**Required tests:** Existing strict parsing, leap-year, timezone, local-field, and token cases.

### MOD-024: Preserve Intl fallbacks

**Area:** Language and debug  
**Affected files:** `src/language.ts`, `src/debug.ts`  
**Current implementation:** Mazey already prefers `Intl.getCanonicalLocales`, `Intl.DisplayNames`, and locale formatting while retaining documented fallbacks for unavailable or throwing boundaries.  
**Historical reason:** SSR and partial-Intl resilience.  
**Native candidate:** Unconditional `Intl` APIs  
**Standard:** ECMAScript Internationalization API  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Incompatible with documented resilience  
**Public API impact:** Behavioral  
**Risk:** Medium  
**Decision:** Keep  
**Reason:** The remaining fallback is intentional boundary behavior rather than a replacement for normal supported execution.  
**Required tests:** Invalid tags, missing Intl components, throwing implementations, locale labels, and SSR.

### MOD-025: Preserve storage and cookie contracts

**Area:** Storage  
**Affected files:** `src/store.ts`, `src/preference.ts`  
**Current implementation:** Mazey preserves raw legacy JSON strings, encodes unsafe cookie names/values with markers, and distinguishes propagating storage APIs from resilient preference APIs.  
**Historical reason:** Intentional persistence compatibility and browser failure handling.  
**Native candidate:** Cookie Store API and direct storage calls  
**Standard:** Web Storage and Cookie Store APIs  
**Browser baseline compatibility:** Cookie Store is not available across the baseline  
**Semantic compatibility:** Incompatible  
**Public API impact:** Breaking  
**Risk:** High  
**Decision:** Keep  
**Reason:** Newer storage APIs do not reproduce synchronous cookie, serialization, marker, or error semantics.  
**Required tests:** Existing JSON, raw-string, unsafe cookie, domain, path, removal, SSR, and throwing-storage cases.

### MOD-026: Defer AbortSignal composition

**Area:** Async and cancellation  
**Affected files:** `src/util.ts`, `src/load.ts`, `src/browser.ts`  
**Current implementation:** Timers and resource watchers own explicit cleanup and return established Promises or disposer objects.  
**Historical reason:** Public synchronous/Promise contracts and lifecycle ownership.  
**Native candidate:** `AbortController`, `AbortSignal.timeout`, `AbortSignal.any`  
**Standard:** DOM  
**Browser baseline compatibility:** Mixed; `AbortSignal.any` exceeds the selected floor  
**Semantic compatibility:** Uncertain without API redesign  
**Public API impact:** Behavioral and type  
**Risk:** Medium  
**Decision:** Investigate  
**Reason:** Adding signals or changing timeout rejection would alter APIs without removing enough logic to justify the migration.  
**Required tests:** Future cancellation ownership, cleanup, timeout, and race cases.

### MOD-027: Preserve randomness contracts

**Area:** Util  
**Affected files:** `src/util.ts`  
**Current implementation:** Helpers generate numeric or caller-shaped random-looking strings with documented lengths.  
**Historical reason:** Intentional output format.  
**Native candidate:** `crypto.getRandomValues`, `crypto.randomUUID`  
**Standard:** Web Cryptography API  
**Browser baseline compatibility:** Supported  
**Semantic compatibility:** Incompatible output contract  
**Public API impact:** Behavioral  
**Risk:** High  
**Decision:** Keep  
**Reason:** UUID and cryptographic byte APIs do not preserve numeric-only formats or existing statistical promises.  
**Required tests:** Existing length, alphabet, and uniqueness-shape tests.

### MOD-028: Preserve resource element semantics

**Area:** Loading  
**Affected files:** `src/load.ts`, `src/browser.ts`  
**Current implementation:** Image and script helpers use DOM resource elements so browser loading, execution, caching, and error events determine results.  
**Historical reason:** Intentional browser behavior.  
**Native candidate:** `HTMLImageElement.decode`, `fetch`, module loading  
**Standard:** HTML and Fetch  
**Browser baseline compatibility:** Supported in parts  
**Semantic compatibility:** Incompatible  
**Public API impact:** Behavioral and security  
**Risk:** Medium  
**Decision:** Keep  
**Reason:** Fetching or decoding separately changes execution, credentials, CORS, cache, and resolution behavior.  
**Required tests:** Existing image/script success, failure, timeout, attributes, callback, and request deduplication.

## Summary

### Replaced

- Moving browser targets with a fixed modern baseline.
- ES2015 output and open-ended libraries with ES2022.
- WeakMap, RegExp flag, symbol reflection, ownership, trim, and clock fallbacks.
- IE event propagation, old stylesheet/script loading, and legacy media-query listeners.

### Simplified

- Babel target/polyfill configuration.
- URL availability handling while preserving Mazey validation and serialization.
- Navigation timing around `PerformanceNavigationTiming` only.

### Kept intentionally

- Strict query, URL grammar, date, clone, storage, cookie, DOM selector, event-bus, UA classification, PWA, randomness, and resource-loading semantics.

### Deprecated

None.

### Deferred or requiring a baseline decision

- AbortSignal composition and APIs newer than the fixed floor, including `URL.canParse`, `AbortSignal.any`, immutable array methods, and Temporal.

### Behavior changes

- Environments below the documented baseline no longer receive fallbacks for missing `WeakMap`, URL, standard event methods, standard media-query events, stylesheet/script load events, or Navigation Timing Level 2.
- Valid inputs and supported runtimes retain the existing public API behavior and return shapes.

### Validation

Validation completed on Node.js 22:

- `npm run preview` passed type checking, linting, package builds, all 27 Jest
  suites and 1,042 tests, TypeDoc, the production website build, SEO validation,
  and PWA validation.
- `npm run format:check` passed the repository-owned formatting scope.
- `npm run skill:sync` and `npm run skill:sync:check` passed. The canonical and
  public `prefer-mazey` trees are identical.
- The sibling skills repository passed `npm run validate` and `npm test`,
  including 19 English technical-writing validator regressions.
- Two consecutive documentation builds produced the same SHA-256 tree digest:
  `4f9ba7adac9d14305471ab6587dc7949bb542162cc0b1d0e0933c741bfd07953`.
- Baseline-versus-modern output comparisons passed for query parsing, query
  updates, URL host/path extraction, trimming, and clone cycles. CommonJS, ESM,
  browser IIFE, and declaration smoke checks passed.
- `npm pack --dry-run --json` reported 15 expected entries, no website or audit
  files, no `package-lock.json`, and no runtime dependencies.
- Final whitespace checks passed in both repositories.

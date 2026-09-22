# Mazey API Map

This discovery index was verified against the flat exports from `src/index.ts` and the defining source modules. It covers all 131 runtime exports in the current repository: 129 functions and 2 console constants. Always confirm the installed Mazey version's declarations or source before use.

## Contents

- [Runtime labels](#runtime-labels)
- [Date and time](#date-and-time)
- [Function control](#function-control)
- [Validation](#validation)
- [Numbers](#numbers)
- [Strings](#strings)
- [Objects and arrays](#objects-and-arrays)
- [URL](#url)
- [DOM and styles](#dom-and-styles)
- [Storage and cookies](#storage-and-cookies)
- [Resource loading](#resource-loading)
- [Browser and PWA](#browser-and-pwa)
- [Events](#events)
- [Debugging](#debugging)
- [Performance](#performance)
- [Calculation](#calculation)
- [Compatibility and low-level exports](#compatibility-and-low-level-exports)

## Runtime labels

| Label              | Meaning                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Universal          | Uses standard JavaScript available in browsers and supported Node.js versions.                                     |
| Node.js-compatible | Uses facilities such as timers, `console`, or `Intl` that are available in Node.js without DOM globals.            |
| Browser-preferred  | Safe or guarded outside a browser, but only meaningful for browser capabilities. Verify its fallback or rejection. |
| Browser-only       | Directly requires browser or DOM globals. Do not call from a Node.js-only path.                                    |

## Date and time

| Function                  | Purpose                                                   | Runtime            | Notes                                                                                                    |
| ------------------------- | --------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `mNow`                    | Return the current epoch time in milliseconds             | Universal          | Uses `Date.now()` with an older fallback.                                                                |
| `getDateDifference`      | Calculate an interval as days, seconds, or English text   | Universal          | Local time for `YYYY-MM-DD HH:mm:ss`; `text` omits zero-valued units; negative or invalid intervals return empty. |
| `formatDurationFromMs`    | Format milliseconds in seconds, minutes, hours, or days   | Universal          | Largest unit; one decimal maximum; negatives and non-finite values become `0 seconds`.                   |
| `isValidDate`             | Validate date objects, timestamps, and structured strings | Universal          | Numbers are milliseconds; local and zoned ISO-style strings are parsed strictly; locale date strings are rejected. |
| `formatDate`              | Format a date with Mazey tokens                           | Universal          | Local time; supports `yyyy MM dd HH hh mm ss a`; invalid dates throw `RangeError`.                       |
| `generateCalendarVersion` | Generate `YEAR.MONTHDAY.TIME` calendar versions           | Universal          | Local time, strips segment-leading zeroes, and can decrease after clock or DST rollback.                 |
| `waitTime`                | Resolve with the supplied millisecond value after a delay | Node.js-compatible | Uses `setTimeout`; does not validate or cancel the delay.                                                |

## Function control

| Function                  | Purpose                                          | Runtime            | Notes                                                                                            |
| ------------------------- | ------------------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------ |
| `throttle`                | Limit function invocation frequency              | Node.js-compatible | Supports `leading` and `trailing`; returns the latest result or `null`; no cancel/flush API.     |
| `debounce`                | Delay invocation until calls stop                | Node.js-compatible | Third argument enables immediate invocation; returns the latest result or `null`; no cancel API. |
| `invokeFn`                | Invoke a value only when it is a function        | Universal          | Forwards arguments and returns `null` for nullish/non-function input.                            |
| `repeatUntilConditionMet` | Poll a callback until a condition or count limit | Node.js-compatible | Uses timers; validates finite non-negative interval/count; callback begins after the interval.   |

## Validation

| Function             | Purpose                                           | Runtime   | Notes                                                                                               |
| -------------------- | ------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `isNumber`           | Test for a numeric primitive                      | Universal | Rejects strings and, by default, `NaN`/infinities; `isUnFiniteAsNumber` is compatibility-sensitive. |
| `isJSONString`       | Test whether a string is valid JSON               | Universal | Accepts JSON primitives as well as arrays/objects; rejects non-string input.                        |
| `isNonEmptyArray`    | Test for an array with at least one item          | Universal | Returns a boolean; does not inspect item values.                                                    |
| `isPureObject`       | Test for a non-null value tagged as an object     | Universal | Accepts class instances and null-prototype objects; excludes arrays and non-object values.          |
| `isFunction`         | Test for a function                               | Universal | Equivalent to `typeof value === "function"`; prefer native syntax when clearer.                     |
| `isString`           | Test for a string primitive                       | Universal | Equivalent to `typeof value === "string"`.                                                          |
| `isBool`             | Test for a boolean primitive                      | Universal | Canonical implementation used by `isBoolean`.                                                       |
| `isBoolean`          | Test for a boolean primitive                      | Universal | Alias of `isBool`; use the name established by the project.                                         |
| `isUdfOrNul`         | Test for `undefined` or `null`                    | Universal | Does not treat other falsy values as nullish.                                                       |
| `isArray`            | Test for an array using the object tag            | Universal | Native `Array.isArray` is usually clearer for trivial checks.                                       |
| `isNonEmptyObject`   | Test for an object-tag value with own string keys | Universal | Accepts class instances with enumerable own keys; rejects arrays, null, and empty objects.          |
| `isValidData`        | Verify an own-property path equals a value        | Universal | Requires every segment to be an own property; does not mutate input.                                |
| `isValidPhoneNumber` | Validate an 11-digit Chinese mobile-shaped number | Universal | Pattern is `^1\d{10}$`; not an international phone validator.                                       |
| `isValidEmail`       | Validate common email syntax                      | Universal | Regex-based and not a complete RFC/mail-deliverability check.                                       |

## Numbers

| Function             | Purpose                                                   | Runtime   | Notes                                                                                         |
| -------------------- | --------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------- |
| `genRndNumString`    | Generate a random decimal-digit string                    | Universal | Floors positive finite length; non-cryptographic `Math.random`; invalid length returns empty. |
| `genUniqueNumString` | Combine current milliseconds with random digits           | Universal | Not guaranteed unique and not suitable for security identifiers.                              |
| `floatToPercent`     | Convert a fraction to a percentage string                 | Universal | Without `fixSize`, floors after multiplying by 100; with it, uses `toFixed`.                  |
| `floatFixed`         | Format a number/string to fixed decimals                  | Universal | Uses `parseFloat(...).toFixed(size)` and returns a string.                                    |
| `getFileSize`        | Format bytes using 1024-based units                       | Universal | Uses ceiling and returns empty for non-positive/non-finite values.                            |
| `genHashCode`        | Produce a numeric hash from a string                      | Universal | Small non-cryptographic signed integer hash.                                                  |
| `convert10To26`      | Convert a positive integer to lowercase alphabetic digits | Universal | Spreadsheet-like `a..z, aa`; floors input; invalid/non-positive returns empty.                |

## Strings

| Function              | Purpose                                       | Runtime   | Notes                                                                   |
| --------------------- | --------------------------------------------- | --------- | ----------------------------------------------------------------------- |
| `convertCamelToKebab` | Convert camel/Pascal case to kebab case       | Universal | Inserts separators before capitals and lowercases.                      |
| `convertKebabToCamel` | Convert kebab case to camel case              | Universal | Handles lowercase letters after `-`; trims one trailing hyphen.         |
| `convertCamelToUnder` | Convert camel/Pascal case to snake case       | Universal | Inserts underscores before capitals and lowercases.                     |
| `convertUnderToCamel` | Convert snake case to camel case              | Universal | Handles lowercase letters after `_`.                                    |
| `toJavaScriptGlobalName` | Convert text to an uppercase ASCII identifier | Universal | Replaces invalid identifier characters with `_`, preserves `$`/`_`, and prefixes leading digits. |
| `convertToHtmlBreaks` | Replace line breaks with `<br />`             | Universal | Returns empty for falsy input; does not escape HTML.                    |
| `removeHTML`          | Strip HTML-like tags from text                | Universal | Regex-based, optional newline removal; not an HTML parser or sanitizer. |
| `sanitizeInput`       | Escape six HTML-sensitive characters          | Universal | Context-limited escaping, not a complete XSS sanitizer.                 |
| `unsanitizeInput`     | Decode entities emitted by `sanitizeInput`    | Universal | Decodes only Mazey's fixed entity set.                                  |
| `cutZHString`         | Truncate text using a Chinese-width heuristic | Universal | Supports `hasDot`/`dotText`; nullish input returns empty.               |

## Objects and arrays

| Function     | Purpose                                     | Runtime   | Notes                                                                                                                                                              |
| ------------ | ------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deepCopy`   | Deep-copy supported object graphs           | Universal | Handles cycles and common built-ins; custom classes become plain own-property objects; unsupported native objects remain shared references. Does not mutate input. |
| `deepFreeze` | Recursively freeze enumerable object values | Universal | Mutates state by freezing the original graph; handles cycles; does not traverse symbol/non-enumerable values or Map/Set entries.                                   |

## URL

| Function               | Purpose                                             | Runtime           | Notes                                                                                                                     |
| ---------------------- | --------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `getQueryParam`        | Read one value from `location.search`               | Browser-only      | Decodes percent escapes and `+` spaces; first matching value wins.                                                        |
| `getAllQueryParams`    | Parse first values into an object                   | Browser-only      | The default call reads `location.search` and throws without it; Node.js-compatible only with a non-empty URL/query. Keeps first duplicate. |
| `getUrlParam`          | Read one or all values from a supplied URL/query    | Universal         | `returnArray` preserves duplicates; scalar mode returns first value or `null`.                                            |
| `updateQueryParam`     | Set a query value while preserving the hash         | Universal         | Encodes key/value and collapses duplicate target keys.                                                                    |
| `getHashQueryParam`    | Read a query value embedded in `location.hash`      | Browser-only      | Uses text after the first `?`; decodes values.                                                                            |
| `getDomain`            | Concatenate selected URL/anchor fields              | Browser-only      | Uses `window.URL` or a DOM anchor; `rules` controls fields such as hostname/pathname.                                     |
| `isValidUrl`           | Match a scheme URL                                  | Universal         | Regex-based and broader than HTTP; not equivalent to WHATWG `URL` validation.                                             |
| `isValidHttpUrl`       | Validate strict HTTP/HTTPS URLs                     | Universal         | Rejects credentials and malformed hosts/ports; `strict: false` permits protocol-relative URLs.                            |
| `parseGitHubRepository` | Parse GitHub shorthands and Git transport URLs      | Universal         | Returns owner/name/slug/HTTPS URL; bounded strict-ASCII grammar; permits only the conventional `git` username and rejects passwords, ports, queries, fragments, and encoding. |
| `getUrlFileType`       | Extract the final path extension                    | Universal         | Ignores query/hash; returns an empty string when absent despite the broader declaration.                                  |
| `getScriptQueryParam`  | Read a query value from matching script tags        | Browser-only      | Scans `document` script `src` attributes; default match substring is `.js`.                                               |
| `convertObjectToQuery` | Encode own string properties as a query             | Universal         | Returns `?key=value`; empty object returns empty; excludes inherited properties.                                          |
| `convertHttpToHttps`   | Replace a leading `http:` with `https:`             | Universal         | Simple prefix replacement; does not validate the URL.                                                                     |
| `getUrlHost`           | Return host and optional port                       | Browser-only      | Uses `window.URL`; accepts protocol-relative HTTP URLs after normalization.                                               |
| `getUrlPath`           | Return a URL pathname                               | Browser-only      | Uses `window.URL`; returns empty for unsupported/invalid input.                                                           |
| `onURLChange`          | Observe popstate, hash, pushState, and replaceState | Browser-only      | Patches history methods globally once and returns an unsubscribe function.                                                |

## DOM and styles

| Function          | Purpose                                    | Runtime      | Notes                                                                   |
| ----------------- | ------------------------------------------ | ------------ | ----------------------------------------------------------------------- |
| `hasClass`        | Test an element class                      | Browser-only | Logs and returns false for a missing element.                           |
| `addClass`        | Add one or more classes                    | Browser-only | Mutates the element; ignores empty names; array path uses `classList`.  |
| `removeClass`     | Remove a class                             | Browser-only | Mutates the element and logs for missing input.                         |
| `addStyle`        | Insert or replace a `<style>` element      | Browser-only | Mutates `document.head`; an `id` updates an existing style element.     |
| `setImgSizeBySrc` | Apply image dimensions from URL parameters | Browser-only | Mutates image styles; reads `width`/`height`; uses jQuery when present. |
| `genStyleString`  | Build a CSS rule string                    | Universal    | Joins declarations with semicolons; does not validate or escape CSS.    |
| `getPageMeta`     | Read the first named meta tag's content    | Browser-only | Scans DOM meta elements with exact name matching.                       |

## Storage and cookies

| Function            | Purpose                                | Runtime      | Notes                                                                                           |
| ------------------- | -------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `setSessionStorage` | JSON-store a session value             | Browser-only | Mutates `sessionStorage`; `undefined` is stored as JSON `null`; storage errors propagate.       |
| `getSessionStorage` | Read and JSON-parse a session value    | Browser-only | Returns `null` when absent and raw strings for legacy invalid JSON.                             |
| `setLocalStorage`   | JSON-store a persistent value          | Browser-only | Mutates `localStorage`; `undefined` becomes JSON `null`; storage errors propagate.              |
| `getLocalStorage`   | Read and JSON-parse a persistent value | Browser-only | Returns `null` when absent and raw strings for legacy invalid JSON.                             |
| `getCookie`         | Read a cookie by logical name          | Browser-only | Understands Mazey's encoded-name/value marker scheme; returns empty when absent.                |
| `setCookie`         | Set a root-path cookie                 | Browser-only | Encodes unsafe names/values, may infer a parent domain, and writes a companion encoding marker. |
| `removeCookie`      | Expire a cookie and marker             | Browser-only | Mutates cookies across root/current-directory and candidate domain scopes; returns success.     |

## Resource loading

| Function                | Purpose                                          | Runtime      | Notes                                                                                     |
| ----------------------- | ------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------- |
| `loadCSS`               | Append a stylesheet and await loading            | Browser-only | Resolves `loaded`, rejects modern load errors, and contains old-browser polling behavior. |
| `loadScript`            | Append and await a script element                | Browser-only | Supports attributes, callback, CSS companion, and timeout; rejects errors/timeouts.       |
| `windowLoaded`          | Await page load or timeout                       | Browser-only | Resolves `complete`/`load`; removes listener and timer; timeout rejects `Error`.          |
| `loadImage`             | Preload an image without adding it to DOM        | Browser-only | Requires global `Image`; resolves the image or rejects its error event.                   |
| `loadScriptIfUndefined` | Load a script unless a window property is truthy | Browser-only | Deduplicates concurrent requests by property and URL; resolves `defined` or `loaded`.     |

## Browser and PWA

| Function          | Purpose                                                    | Runtime           | Notes                                                                                                                         |
| ----------------- | ---------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `isSafePWAEnv`    | Detect minimum synchronous PWA prerequisites               | Browser-preferred | Safe false outside browser; manifest remains required by default; options can skip it or enforce a same-origin path scope.   |
| `isStandalonePWA` | Detect standalone PWA presentation                          | Browser-preferred | Uses the standard display-mode query plus the iOS `navigator.standalone` fallback; not installation proof.                  |
| `getBrowserInfo`  | Classify browser/system from user agent                    | Browser-only      | Reads `window`/`navigator`, caches on `window.MAZEY_BROWSER_INFO`, and is UA/compatibility-sensitive.                         |
| `genBrowserAttrs` | Convert browser classification fields to attribute strings | Browser-only      | Calls cached `getBrowserInfo`; optional prefix/separator.                                                                     |
| `isSupportWebp`   | Probe WebP image support                                   | Browser-only      | Uses `Image` and caches the Promise result state.                                                                             |
| `isBrowser`       | Detect the presence of a browser-like `window` global      | Universal         | Safe in Node.js; only a `true` browser result is cached, while `false` is re-evaluated.                                       |

## Events

| Function       | Purpose                                         | Runtime      | Notes                                                                                    |
| -------------- | ----------------------------------------------- | ------------ | ---------------------------------------------------------------------------------------- |
| `cancelBubble` | Stop DOM event propagation                      | Browser-only | Calls `stopPropagation` or legacy `cancelBubble`.                                        |
| `addEvent`     | Register a named Mazey callback                 | Browser-only | Mutates the global registry on `window`; duplicate callbacks are allowed.                |
| `fireEvent`    | Invoke a snapshot of named callbacks            | Browser-only | Optional single params object; listener changes do not alter the current dispatch queue. |
| `removeEvent`  | Remove one callback or all callbacks for a name | Browser-only | Omitting `fn` deletes the entire named listener list.                                    |

## Debugging

| Export             | Purpose                                      | Runtime            | Notes                                                                                         |
| ------------------ | -------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `genCustomConsole` | Create prefixed/configurable console methods | Node.js-compatible | Uses `console`, `Date`, and optional `Intl`; `isClosed` is deprecated in favor of `enabled`.  |
| `mazeyCon`         | Preconfigured `[Mazey]` console              | Node.js-compatible | Module-level constant created with `genCustomConsole`; hidden from generated API docs.        |
| `timeCon`          | Preconfigured dated Chinese-locale console   | Node.js-compatible | Module-level constant with date and object-stringification enabled; hidden from API docs.     |

## Performance

| Function         | Purpose                                              | Runtime           | Notes                                                                                                             |
| ---------------- | ---------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| `getFCP`         | Resolve first-contentful-paint time                  | Browser-preferred | Returns `0` when unsupported; uses `PerformanceObserver` when available.                                          |
| `getFP`          | Resolve first-paint time                             | Browser-preferred | Returns `0` when unsupported; observer Promise waits for a matching entry.                                        |
| `getLCP`         | Resolve first observed largest-contentful-paint time | Browser-preferred | Returns `0` when unsupported and disconnects after a matching entry.                                              |
| `getFID`         | Resolve first-input delay                            | Browser-preferred | May wait until user input; returns `0` when unsupported or processing data is absent.                             |
| `getCLS`         | Sum one observed layout-shift batch                  | Browser-preferred | Returns `0` when unsupported; disconnects after the first observer callback.                                      |
| `getTTFB`        | Calculate response-start minus request-start         | Browser-preferred | Returns `0` when navigation timing is unavailable.                                                                |
| `getPerformance` | Collect navigation, paint, device, and network data  | Browser-preferred | Rejects when navigation/performance APIs are unavailable; waits for final load timing; optional camelCase output. |

## Calculation

| Function                | Purpose                                           | Runtime   | Notes                                                                                 |
| ----------------------- | ------------------------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| `longestComSubstring`   | Return longest common contiguous substring length | Universal | Dynamic programming with O(n\*m) time and memory; empty input returns 0.              |
| `longestComSubsequence` | Return longest common subsequence length          | Universal | Dynamic programming with O(n\*m) time and memory; empty input returns 0.              |
| `isHit`                 | Return a probabilistic hit using `Math.random`    | Universal | Evaluates `Math.random() < rate`; does not clamp or provide cryptographic randomness. |

## Compatibility and low-level exports

These names are exported by the flat package entry but are aliases or `@hidden` low-level APIs. Prefer the canonical API in new code unless compatibility requires the listed name.

| Function                      | Purpose                                 | Runtime            | Notes                                                                                     |
| ----------------------------- | --------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `calLongestCommonSubstring`   | Compatibility alias                     | Universal          | Prefer `longestComSubstring`.                                                             |
| `calLongestCommonSubsequence` | Compatibility alias                     | Universal          | Prefer `longestComSubsequence`.                                                           |
| `inRate`                      | Compatibility alias                     | Universal          | Prefer `isHit`.                                                                           |
| `deepCopyObject`              | Compatibility alias                     | Universal          | Prefer `deepCopy`.                                                                        |
| `camelCaseToKebabCase`        | Compatibility alias                     | Universal          | Prefer `convertCamelToKebab`.                                                             |
| `camelCase2Underscore`        | Compatibility alias                     | Universal          | Prefer `convertCamelToUnder`.                                                             |
| `mTrim`                       | Manual whitespace trimming helper       | Universal          | Hidden from docs; prefer native `String.prototype.trim` unless legacy behavior matters.   |
| `isJsonString`                | Compatibility alias                     | Universal          | Prefer `isJSONString`.                                                                    |
| `generateRndNum`              | Compatibility alias                     | Universal          | Prefer `genRndNumString`.                                                                 |
| `generateUniqueNum`           | Compatibility alias                     | Universal          | Prefer `genUniqueNumString`.                                                              |
| `doFn`                        | Compatibility alias                     | Universal          | Prefer `invokeFn`.                                                                        |
| `newLine`                     | Compatibility alias                     | Universal          | Prefer `convertToHtmlBreaks`.                                                             |
| `removeHtml`                  | Compatibility alias                     | Universal          | Prefer `removeHTML`.                                                                      |
| `clearHTML`                   | Compatibility alias                     | Universal          | Prefer `removeHTML`.                                                                      |
| `clearHtml`                   | Compatibility alias                     | Universal          | Prefer `removeHTML`.                                                                      |
| `unsanitize`                  | Compatibility alias                     | Universal          | Prefer `unsanitizeInput`.                                                                 |
| `truncateZHString`            | Legacy truncation signature             | Universal          | Delegates to `cutZHString` with boolean `hasDot`.                                         |
| `cutCHSString`                | Compatibility alias                     | Universal          | Prefer `cutZHString` or `truncateZHString`.                                               |
| `zAxiosIsValidRes`            | Validate a legacy Axios-shaped response | Universal          | Hidden and schema-specific: status range plus `data.code`; do not use for unrelated APIs. |
| `getCurrentVersion`           | Return Mazey's hard-coded major marker  | Universal          | Hidden; currently returns `v4`; not the package version.                                  |
| `sleep`                       | Compatibility alias                     | Node.js-compatible | Prefer `waitTime`.                                                                        |
| `replaceHttp`                 | Compatibility alias                     | Universal          | Prefer `convertHttpToHttps`.                                                              |
| `setClass`                    | Compatibility alias                     | Browser-only       | Prefer `addClass`.                                                                        |
| `setImgWidHeiBySrc`           | Compatibility alias                     | Browser-only       | Prefer `setImgSizeBySrc`.                                                                 |
| `invokeEvent`                 | Compatibility alias                     | Browser-only       | Prefer `fireEvent`.                                                                       |
| `getDefineListeners`          | Access Mazey's global listener registry | Browser-only       | Hidden low-level API; mutates/returns `window.MAZEY_DEFINE_LISTENERS`.                    |
| `delCookie`                   | Compatibility deletion wrapper          | Browser-only       | Prefer `removeCookie`; return type is `void`.                                             |
| `isSupportedEntryType`        | Probe PerformanceObserver entry types   | Browser-preferred  | Hidden low-level API; safely returns false without `window`.                              |
| `getFriendlyInterval`         | Compatibility alias                     | Universal          | Prefer `getDateDifference`.                                                               |

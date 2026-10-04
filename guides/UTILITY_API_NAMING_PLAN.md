# Utility API naming plan

## Goal

Give selected Mazey utilities clearer public names without breaking existing imports. Keep `waitTime` and `fireEvent` unchanged. Deprecate `mNow` in favor of native `Date.now()`.

Implemented: the canonical names below are exported from the package root,
the old names remain available with deprecation guidance, and the seven
additional renames share function objects with their old names. Their
implementation bodies and callable signatures are preserved. README examples,
TypeDoc, tests, and both copies of the `prefer-mazey` API map are updated.

## Public API decisions

| Canonical name     | Existing name    | Compatibility decision                          |
|:-------------------|:-----------------|:------------------------------------------------|
| `hideElements`     | `hide`           | Keep `hide` as a deprecated alias.              |
| `showElements`     | `show`           | Keep `show` as a deprecated alias.              |
| `randomBoolean`    | `isHit`          | Keep `isHit` as a deprecated alias.             |
| `isNullish`        | `isUdfOrNul`     | Keep `isUdfOrNul` as a deprecated alias.        |
| `Date.now()`       | `mNow`           | Keep `mNow` exported, but mark it deprecated.   |

Do not rename `waitTime` or `fireEvent`. Preserve the existing `sleep` and `inRate` aliases and their behavior. Do not remove any public export in this change.

## Additional selected names

The additional canonical names use these exact spellings, including the uppercase `CN`, `HTML`, `CSS`, and `URL` segments:

| Current name         | Selected name              |
|:---------------------|:---------------------------|
| `isValidPhoneNumber` | `isCNMobileNumber`         |
| `sanitizeInput`      | `escapeHTML`               |
| `unsanitizeInput`    | `unescapeHTML`             |
| `genStyleString`     | `createCSSRule`            |
| `genBrowserAttrs`    | `getBrowserClassNames`     |
| `getUrlFileType`     | `getURLPathExtension`      |
| `cutZHString`        | `truncateByWeightedLength` |

The implementation preserves the compatibility policy and these behaviors:

- `isCNMobileNumber` checks an 11-digit string beginning with `1`. It does not verify an assigned number or international phone formats.
- `escapeHTML` escapes the existing set of ampersands, angle brackets, quotes, and forward slashes. It does not sanitize arbitrary HTML or validate URLs.
- `unescapeHTML` reverses the fixed entity set handled by the existing implementation. It is not a general HTML entity decoder.
- `createCSSRule` returns a selector and declaration block as CSS text. It does not validate or escape CSS.
- `getBrowserClassNames` returns browser classification tokens with the optional prefix and separator. It does not modify the DOM.
- `getURLPathExtension` extracts the suffix from a URL or path after removing query and fragment text. It does not inspect file contents or detect a MIME type.
- `truncateByWeightedLength` counts UTF-16 code units from `U+0000` through `U+00FF` as one unit and all other code units as two. Optional truncation text is appended after that limit. Preserve the existing options and the `truncateZHString` and `cutCHSString` aliases. Byte length, rendered width, and grapheme-safe truncation are outside this rename.

## Implementation

1. Add the canonical functions in their current owning modules and expose them through the flat package-root API. Preserve each existing function's parameters, return type, and runtime behavior. In particular, do not change DOM target handling, the `Math.random() < rate` calculation, or the exact nullish check.
2. Make the old names delegate to the canonical implementations, or otherwise share one implementation without duplicating logic. Mark the old names with TypeDoc `@deprecated` guidance naming the replacement. Mark `mNow` deprecated with `Date.now()` as its replacement; it remains a callable export.
3. Replace Mazey's internal `mNow()` calls with `Date.now()` without changing timer or identifier behavior. Do not add a wrapper around `Date.now()`.
4. Update relevant TypeDoc, README examples and contents, and the canonical `prefer-mazey` API map. Synchronize its public copy through the repository's skill commands. Keep generated declarations and documentation under their owning build commands rather than editing them manually.

## Verification

- Add deterministic tests for every new package-root export and verify equivalence with the corresponding old name, including DOM return values, nullish edge cases, and probability boundaries. Confirm `waitTime` and `fireEvent` retain their existing behavior.
- Check that generated declarations expose the new names and retain the deprecated names and their signatures.
- Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build`, `npm test`, `npm run docs`, `npm run skill:sync`, `npm run skill:sync:check`, `npm pack --dry-run`, and `git diff --check`. Build before Jest because library tests import generated package output.
- Inspect Git status and diffs separately in Mazey and the public skills repository. Do not commit, publish, or remove deprecated names as part of this work.

## Compatibility assumption

Deprecated names remain available until a separately planned major-version removal. This plan changes naming and documentation only; it does not change the utilities' semantics.

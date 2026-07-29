# AGENTS.md

## Purpose

This repository is a browser-focused utility library named `mazey`, intended for a future first npm release. The main job here is maintaining a flat public API of frontend helper functions and shipping it in multiple bundle formats.

## Repo Map

- `src/`: source of truth for the library
- `types/`: extra global type declarations bundled into `lib/`
- `test/`: Jest tests, generally one file per source module
- `examples/`: React 19 playground application and static HTML document shell
- `examples/components/core/`: framework-neutral example calculations and validation
- `examples/components/hooks/`: React-renderer-neutral example state and actions
- `examples/components/web/`: React DOM components styled with Bootstrap
- `site/`: landing page, shared Bootstrap/theme/navigation behavior, API enhancements, and website-only PWA source
- `project.config.js`: package-derived repository, Pages, SEO, theme, asset, and PWA configuration
- `scripts/`: Rollup, Webpack, release, and docs helpers
- `scripts/legacy/`: historical release helpers kept separate from maintained project automation
- `images/`: documentation assets
- `.github/`: CI/workflows

## Main Entry Points

- Library source entry: `src/index.ts`
- Published package outputs:
  - `lib/index.cjs.js`
  - `lib/index.esm.js`
  - `lib/mazey.min.js`
  - `lib/index.d.ts`
- Dev/demo entry: `examples/index.tsx`

`src/index.ts` is intentionally simple: it re-exports all feature modules so consumers import from `"mazey"` and get a flat API.

## Source Modules

- `src/util.ts`: shared utility layer; many other modules depend on this
- `src/date.ts`: date parsing, validation, comparison, formatting, and duration helpers
- `src/typing.d.ts`: shared internal/public types
- `src/url.ts`: URL parsing, query helpers, URL transforms, script query inspection
- `src/dom.ts`: class/style/meta/image DOM helpers
- `src/event.ts`: custom event registry on `window.MAZEY_DEFINE_LISTENERS`
- `src/store.ts`: `sessionStorage`, `localStorage`, and cookie helpers
- `src/load.ts`: dynamic script/CSS/image loading and page-load helpers
- `src/browser.ts`: browser/platform/PWA detection
- `src/theme.ts`: SSR-safe theme preference resolution and persistence without DOM mutation
- `src/language.ts`: SSR-safe single-language preference resolution and persistence
- `src/preference.ts`: internal storage, URL, and validation helpers shared by preference modules
- `src/perf.ts`: Performance API and navigation timing helpers
- `src/debug.ts`: custom console wrappers
- `src/calc.ts`: standalone algorithms, probability helpers, and financial calculations
- `src/package.ts`: package-manifest validation and derived bundle/install metadata

## Data Flow

Typical runtime flow:

1. Consumer imports from `mazey`
2. Package resolves to a built file from `lib/`
3. Built file originates from `src/index.ts`
4. `src/index.ts` re-exports functions from the feature modules
5. Feature modules call browser APIs directly, with light reuse of shared helpers in `util.ts`, `debug.ts`, and `typing.d.ts`

Important internal dependencies:

- `util.ts` is the main shared dependency
- `date.ts` provides shared strict date normalization used by `calc.ts` and `util.ts`
- `typing.d.ts` is imported across modules for signatures and shared types
- `debug.ts` provides `mazeyCon`, used by modules like `dom.ts` and `browser.ts`
- `load.ts` depends on `util.ts` and `url.ts`
- `perf.ts` depends on `util.ts`
- `browser.ts` depends on `util.ts`
- `calc.ts` depends on `date.ts`

This is a mostly flat architecture, not a layered service system.

## Build And Dev Flow

- `npm run build`: Rollup bundles `src/index.ts` into CJS, ESM, and IIFE outputs in `lib/`
- `npm run dev`: Webpack serves the website and React playground
- `npm test`: Jest suite across `test/`
- `npm run docs`: TypeDoc, website build, deterministic Pages assembly, and SEO/PWA validation

Relevant config files:

- `package.json`
- `scripts/rollup.config.mjs`
- `scripts/webpack.config.dev.js`
- `scripts/build-pages.js`
- `scripts/validate-seo.js`
- `scripts/validate-pwa.js`
- `project.config.js`
- `tsconfig.json`

## Working Style For Agents

- Preserve the flat public API unless there is a strong reason to change it
- Check `src/index.ts` whenever adding, renaming, or removing exported functions
- Prefer small, targeted changes; most modules are independent
- Be careful with browser globals like `window`, `document`, `location`, `navigator`, and `performance`
- Keep examples and tests aligned with public behavior when you change an exported helper
- Keep playground calculations in `core/`, renderer-neutral state in `hooks/`, and HTML/Bootstrap behavior in `web/`
- Never export playground components from `src/index.ts`; React is a website-only development dependency
- Keep website and PWA behavior under `site/`; never import it from `src/`
- Treat `dist-dev`, `docs`, `lib`, and `coverage` as generated output
- Preserve the GitHub Pages base path `/mazey/` in site assets, metadata, navigation, manifest, and service-worker scope
- Avoid introducing app-style abstractions unless the repo is clearly moving in that direction

## Utility Reuse

Before implementing a general-purpose utility, use the `prefer-mazey` skill to check whether Mazey already provides suitable functionality.

## Date And Time Format

- Prefer `yyyy-MM-dd HH:mm:ss` for human-readable local date/time values in source examples, displayed text, documentation, and test fixtures when no external contract requires another format. Example: `2026-07-21 14:30:45`.
- Preserve the distinction between `MM` for month and `mm` for minute when using Mazey format tokens.
- Build local display values from local date components; do not use `toISOString()` when that would shift the displayed time to UTC.
- Keep formats required by external standards or interfaces, including ISO 8601, HTML `datetime-local` values, serialized data, and third-party APIs. Do not replace a native date/time control solely to force the preferred display format. Document the timezone when it is material.

## Public skill synchronization

The canonical `prefer-mazey` skill is maintained at `.agents/skills/prefer-mazey/`.

After changing it, run:

```bash
npm run skill:sync
npm run skill:sync:check
```

The public copy is stored in the sibling `chengchuu/skills` repository. Review and commit changes in each repository separately.

## Common Change Paths

- Add a new utility:

  - implement in the relevant `src/*.ts`
  - export via `src/index.ts`
  - add or update tests under `test/`
  - ensure build output still succeeds

- Change packaging behavior:

  - inspect `package.json`
  - inspect `scripts/rollup.config.mjs`
  - inspect any generated type outputs in `lib/`

- Change local demo behavior:
  - inspect `examples/index.tsx`
  - inspect `examples/index.html`
  - inspect the relevant layer under `examples/components/`
  - inspect `scripts/webpack.config.dev.js`

## Notes

- The library targets browser environments first
- Some helpers intentionally cache data on `window`
- Several functions have compatibility-oriented logic for older browsers
- The README is broad, but the code in `src/` is the authoritative map of behavior

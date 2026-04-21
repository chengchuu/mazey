# AGENTS.md

## Purpose

This repository is a browser-focused utility library published as `mazey`. It is not an application or monorepo. The main job here is maintaining a flat public API of frontend helper functions and shipping it in multiple bundle formats.

## Repo Map

- `src/`: source of truth for the library
- `types/`: extra global type declarations bundled into `lib/`
- `test/`: Jest tests, generally one file per source module
- `examples/`: demo page and TS entry used by the local dev server
- `scripts/`: Rollup, Webpack, release, and docs helpers
- `images/`: documentation assets
- `.github/`: CI/workflows

## Main Entry Points

- Library source entry: `src/index.ts`
- Published package outputs:
  - `lib/index.cjs.js`
  - `lib/index.esm.js`
  - `lib/mazey.min.js`
  - `lib/index.d.ts`
- Dev/demo entry: `examples/index.ts`

`src/index.ts` is intentionally simple: it re-exports all feature modules so consumers import from `"mazey"` and get a flat API.

## Source Modules

- `src/util.ts`: shared utility layer; many other modules depend on this
- `src/typing.d.ts`: shared internal/public types
- `src/url.ts`: URL parsing, query helpers, URL transforms, script query inspection
- `src/dom.ts`: class/style/meta/image DOM helpers
- `src/event.ts`: custom event registry on `window.MAZEY_DEFINE_LISTENERS`
- `src/store.ts`: `sessionStorage`, `localStorage`, and cookie helpers
- `src/load.ts`: dynamic script/CSS/image loading and page-load helpers
- `src/browser.ts`: browser/platform/PWA detection
- `src/perf.ts`: Performance API and navigation timing helpers
- `src/debug.ts`: custom console wrappers
- `src/calc.ts`: standalone algorithms and probability helpers

## Data Flow

Typical runtime flow:

1. Consumer imports from `mazey`
2. Package resolves to a built file from `lib/`
3. Built file originates from `src/index.ts`
4. `src/index.ts` re-exports functions from the feature modules
5. Feature modules call browser APIs directly, with light reuse of shared helpers in `util.ts`, `debug.ts`, and `typing.d.ts`

Important internal dependencies:

- `util.ts` is the main shared dependency
- `typing.d.ts` is imported across modules for signatures and shared types
- `debug.ts` provides `mazeyCon`, used by modules like `dom.ts` and `browser.ts`
- `load.ts` depends on `util.ts` and `url.ts`
- `perf.ts` depends on `util.ts`
- `browser.ts` depends on `util.ts`
- `calc.ts` depends on `util.ts`

This is a mostly flat architecture, not a layered service system.

## Build And Dev Flow

- `npm run build`: Rollup bundles `src/index.ts` into CJS, ESM, and IIFE outputs in `lib/`
- `npm run dev`: Webpack serves `examples/index.ts` via `examples/index.html`
- `npm test`: Jest suite across `test/`
- `npm run docs`: TypeDoc using `README.md`

Relevant config files:

- `package.json`
- `scripts/rollup.config.mjs`
- `scripts/webpack.config.dev.js`
- `tsconfig.json`

## Working Style For Agents

- Preserve the flat public API unless there is a strong reason to change it
- Check `src/index.ts` whenever adding, renaming, or removing exported functions
- Prefer small, targeted changes; most modules are independent
- Be careful with browser globals like `window`, `document`, `location`, `navigator`, and `performance`
- Keep examples and tests aligned with public behavior when you change an exported helper
- Avoid introducing app-style abstractions unless the repo is clearly moving in that direction

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
  - inspect `examples/index.ts`
  - inspect `examples/index.html`
  - inspect `scripts/webpack.config.dev.js`

## Notes

- The library targets browser environments first
- Some helpers intentionally cache data on `window`
- Several functions have compatibility-oriented logic for older browsers
- The README is broad, but the code in `src/` is the authoritative map of behavior

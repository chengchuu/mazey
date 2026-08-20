# AGENTS.md

Guidance for automated coding agents working in the Mazey repository.

## Project purpose

Mazey is a published, browser-focused TypeScript utility library for common
frontend work. It exposes a flat package-root API and ships CommonJS, ES module,
browser IIFE, and TypeScript declaration outputs. The repository also maintains
a React playground, a Bootstrap-based project website, TypeDoc API documentation,
and a Progressive Web App (PWA) assembled for GitHub Pages.

Keep package runtime code separate from website and documentation behavior.
Public library code must not depend on React, Bootstrap, the site theme, or PWA
modules.

## Repository map

- `src/`: public package source and internal library helpers.
- `src/index.ts`: flat public API entry point.
- `src/typing.d.ts`: shared public and internal TypeScript types.
- `types/global.d.ts`: global declarations bundled as `lib/global.d.ts`.
- `test/`: Jest tests for built library output, site behavior, PWA behavior,
  legacy scripts, and playground source.
- `examples/`: React 19 playground entry, crawlable HTML shell, and components.
- `examples/components/core/`: framework-neutral playground calculations and
  validation.
- `examples/components/hooks/`: React state and actions without React DOM
  dependencies.
- `examples/components/web/`: React DOM components styled with Bootstrap.
- `site/`: homepage, shared navigation and theme behavior, TypeDoc enhancements,
  and website-only PWA source.
- `project.config.js`: package-derived site identity, repository URLs, GitHub
  Pages paths, SEO metadata, theme palette, and PWA settings.
- `scripts/rollup.config.mjs`: publishable package and declaration builds.
- `scripts/webpack.config.dev.js`: homepage and playground development and
  production website builds.
- `scripts/build-pages.js`: deterministic final Pages assembly and TypeDoc HTML
  transformation.
- `scripts/validate-seo.js` and `scripts/validate-pwa.js`: final-artifact
  validators.
- `scripts/legacy/`: published historical release helpers and their setup guide.
- `scripts/sync-prefer-mazey-skill.mjs`: canonical-to-public skill synchronization.
- `images/`: source favicon, logo, Open Graph, and PWA icon assets.
- `.agents/skills/prefer-mazey/`: canonical `prefer-mazey` skill.
- `.github/workflows/`: Pages and package publishing automation.
- `lib/`, `dist-dev/`, `docs/`, and `coverage/`: ignored generated output.

## Package contract

The package root resolves to these generated files:

- CommonJS: `lib/index.cjs.js`
- ES module: `lib/index.esm.js`
- Browser IIFE: `lib/mazey.min.js`, exposed through the global name `mazey`
- Public declarations: `lib/index.d.ts`
- Shared declarations: `lib/typing.d.ts`
- Global declarations: `lib/global.d.ts`

The package `files` allowlist publishes `README.md`, `LICENSE`, `lib/`, and
`scripts/legacy/`. Keep this allowlist aligned with tests and documented external
use.

The package intentionally has no runtime `dependencies`. Build, test, website,
and legacy-helper requirements belong in `devDependencies`. Do not add a runtime
dependency without checking bundle output, browser compatibility, package size,
and whether a focused local implementation is more appropriate.

The maintained browser baseline is Chrome 109+, Edge 109+, Firefox 115+,
Safari 16.4+, iOS Safari 16.4+, Android Chrome 109+, and Samsung Internet 21+.
Browserslist in `package.json` is the authoritative build policy. TypeScript
targets ES2022 with the ES2022, DOM, and DOM iterable libraries, and package
output can contain ES2022 syntax. Do not add compatibility branches or
polyfills solely for browsers below this baseline. Node.js 22 is the development
and CI environment, but the package does not declare a Node.js runtime range.

## Source modules

- `src/calc.ts`: standalone calculations, probability helpers, and financial
  formulas.
- `src/package.ts`: package-manifest validation and derived package metadata.
- `src/date.ts`: strict date normalization, local date parsing and formatting,
  comparisons, intervals, durations, and calendar helpers.
- `src/util.ts`: shared number, string, object, array, validation, timer, hashing,
  and general utilities.
- `src/url.ts`: URL validation, query parsing, transforms, and script URL helpers.
- `src/dom.ts`: DOM text, class, style, meta, image, and selector helpers.
- `src/event.ts`: custom event registry backed by
  `window.MAZEY_DEFINE_LISTENERS`.
- `src/store.ts`: session storage, local storage, and cookie helpers.
- `src/load.ts`: dynamic CSS, script, and image loading plus page-load helpers.
- `src/perf.ts`: Performance API and navigation timing helpers.
- `src/browser.ts`: browser, platform, media-query, PWA, service-worker, and
  visitor detection.
- `src/theme.ts`: SSR-safe system-theme detection and theme preference resolution
  and persistence without DOM mutation.
- `src/language.ts`: SSR-safe single-language resolution, canonicalization,
  display labels, and persistence without DOM mutation.
- `src/preference.ts`: private URL, storage, and validation helpers shared by the
  theme and language modules. Do not export this module.
- `src/debug.ts`: custom console wrappers used by other library modules.

Important internal relationships include:

- `date.ts` supplies strict date normalization to `calc.ts` and date behavior to
  `util.ts`.
- `preference.ts` supports `theme.ts` and `language.ts`.
- `debug.ts` supports browser and DOM diagnostics.
- `load.ts` uses utility and URL helpers.
- `package.ts` uses package-safe naming from `util.ts`.

Preserve this mostly flat architecture. Add a shared internal dependency only
when it removes real duplication without creating a public namespace or a
website-to-library dependency.

## Public API changes

When adding, renaming, or removing a public function or type:

1. Implement it in the owning `src/*.ts` module.
2. Export it from `src/index.ts` through the flat package API.
3. Add deterministic tests under `test/`.
4. Update TypeDoc comments and `README.md` examples or contents when applicable.
5. Update the canonical `prefer-mazey` API map when the reusable public catalog
   changes.
6. Run the package build before library tests so `lib/index.esm.js` and generated
   declarations reflect the source.
7. Inspect the generated declarations and `npm pack --dry-run` for packaging
   changes.

Most JavaScript library tests import `lib/index.esm.js`, not `src/` directly.
Running `npm test` without a current build can test stale output or fail when
`lib/` is absent. Use `npm run build && npm test` for source API work, or use
`npm run preview` for the complete verification pipeline.

Playground tests under `test/playground/` import maintained TypeScript and React
source directly. Keep package-output tests and playground-source tests aligned
with their different boundaries.

## Theme and language preferences

Keep the public preference helpers focused on data and storage:

- `getSystemTheme()` performs one synchronous media-query read and returns
  `"light"`, `"dark"`, or `null`.
- `resolveThemePreference(storageKey)` returns `{ value, label }`. Application
  logic should use only the concrete `value`, which is always `"light"` or
  `"dark"`. The label may be `"System"` when the operating-system preference
  supplied that value.
- A valid `theme` URL query value is persisted when storage is available.
- `setThemePreference()` stores only `"system"`, `"light"`, or `"dark"`.
- `resolveLanguagePreference(storageKey)` checks the fixed `lang` query,
  storage, `navigator.language`, then `en`. It canonicalizes one language and
  returns `{ value, label }`; it intentionally ignores `navigator.languages`.
- `setLanguagePreference()` canonicalizes and persists one language tag.

These library functions must remain SSR-safe and must not mutate the DOM, apply
Bootstrap color mode, load translations, or install listeners. The site owns
`data-bs-theme`, `data-theme`, `color-scheme`, theme-color metadata, controls,
and media-query listeners.

## Playground architecture

The playground is a website-only React 19 application mounted once from
`examples/index.tsx` with `createRoot` and `StrictMode`. Do not export playground
components from `src/index.ts`.

The current examples are Date interval, CAGR, and Aspect ratio. Their tab state,
hash navigation, ARIA relationships, and keyboard handling live in the React
`PlaygroundTabs` component. Bootstrap supplies CSS classes, but the playground
does not use Bootstrap's JavaScript Tab component. Preserve the tests that guard
against duplicate tab systems.

Keep these boundaries:

- Put reusable calculations and validation in `examples/components/core/`.
- Put React state and actions in `examples/components/hooks/`.
- Put HTML and Bootstrap-specific rendering in `examples/components/web/`.
- Keep `examples/index.html` crawlable with one `h1`, useful initial content, a
  loading status, and a `noscript` message.
- Preserve stable tab hashes and keyboard navigation.
- Keep date initialization and reset behavior separate when they have different
  requirements.

## Website, TypeDoc, SEO, and PWA

Webpack owns the homepage and playground. TypeDoc owns API documentation.
`scripts/build-pages.js` combines those outputs, transforms every TypeDoc page,
and generates the final `docs/` artifact. Do not edit generated Pages or TypeDoc
HTML directly.

Preserve these public routes under the `/mazey/` GitHub Pages base path:

- `/mazey/`
- `/mazey/playground/`
- `/mazey/api/`

Keep package identity, URLs, SEO text, theme values, manifest paths, and PWA
settings centralized in `project.config.js`. Browser-safe settings are injected
through Webpack. Keep internal navigation and static assets valid below the
project base path.

The final Pages artifact must include valid page metadata, `robots.txt`,
`sitemap.xml`, `manifest.webmanifest`, icons, and a project-scoped service worker.
Use `npm run docs` to assemble the artifact and run both validators. Service
worker registration belongs to production website behavior and must not affect
npm consumers.

## Build and validation commands

Run commands from the repository root:

```bash
npm run dev
npm run build
npm run build:dev
npm run typecheck
npm run lint
npm run format:check
npm test
npm run docs
npm run preview
npm run pwa:preview
npm pack --dry-run
```

Command responsibilities:

- `npm run build`: generate publishable JavaScript and declarations with Rollup.
- `npm run build:dev`: generate the local website and playground with Webpack.
- `npm run typecheck`: check package, website, playground, and playground-test
  TypeScript configurations.
- `npm run docs`: generate TypeDoc, build the production site, assemble Pages,
  and validate SEO and PWA output.
- `npm run preview`: run type checking, linting, package build, Jest, and the
  complete documentation build.
- `npm run pwa:preview`: rebuild and serve the production-like Pages artifact.

Match validation to the change. For a documentation-only `AGENTS.md` edit,
inspect the final diff and run `git diff --check`; do not rebuild generated
artifacts without a technical reason.

## Package manager and module conventions

GitHub Actions uses Node.js 22 and `npm install`. The repository also tracks
`pnpm-lock.yaml`, while `package-lock.json` is ignored. Preserve the current
package-manager policy and do not add, remove, or regenerate lockfiles unless the
task explicitly includes dependency resolution or lockfile maintenance.

The package does not declare `"type": "module"`:

- Keep ordinary `.js` scripts in CommonJS unless a file already has a concrete
  ESM requirement.
- Use `.mjs` for ESM configuration such as the Rollup config.
- Keep TypeScript source compatible with the current Rollup, Webpack, Babel, and
  declaration build targets.
- Prefer `node:` specifiers when touching Node.js built-in imports in scripts.

Do not run broad dependency upgrades as part of an unrelated change. Inspect the
installed contract and all output formats before updating build dependencies.

## Legacy scripts

Historical release helpers live only under `scripts/legacy/` and remain part of
the published package. Their optional dependencies are development-only and are
documented in `scripts/legacy/README.md` for consumers who use those helpers.

Do not move duplicate helpers back to the `scripts/` root. Before changing or
removing a legacy helper, inspect its tests, package allowlist, README examples,
and documented external import paths.

## Skill synchronization

The canonical `prefer-mazey` skill lives at:

```text
.agents/skills/prefer-mazey/
```

After changing it, run:

```bash
npm run skill:sync
npm run skill:sync:check
```

The public copy lives in the independent sibling `skills` repository. Review
both repositories separately. Do not stage or commit either copy automatically.

## GitHub Actions and releases

`.github/workflows/pages.yml` builds and deploys Pages from `docs/v*` and
`release/v*` branches, plus manual dispatches. It installs dependencies with
npm, checks types and lint, builds the package, runs Jest, builds and validates
Pages, then uploads `docs/`.

`.github/workflows/publish-npm.yml` validates pull requests to `main` and
`release/v*`. Pushes to `release/v*` run the full preview pipeline, publish the
package to npm and GitHub Packages, restore temporarily changed package files,
and create the version tag.

Do not publish, tag, deploy, push, or modify registry credentials unless the user
explicitly requests that action. A workflow branch must also satisfy the
`github-pages` environment protection rules.

## Working rules

- Inspect staged, unstaged, and untracked changes before editing. Preserve
  unrelated user work.
- Treat source, tests, README examples, TypeDoc comments, declarations, and the
  flat export surface as one contract.
- Use browser globals only in modules whose documented runtime permits them.
  Preserve SSR-safe behavior where it exists.
- Keep tests independent of the real clock, local timezone, browser language,
  color preference, storage, network, and production credentials.
- Prefer small changes with focused regression tests. Avoid speculative wrappers,
  aliases, and application-style abstractions.
- Do not hand-edit `lib/`, `dist-dev/`, `docs/`, or `coverage/`.
- Do not stage, commit, tag, push, publish, or deploy unless explicitly asked.

## Date and time conventions

Prefer `yyyy-MM-dd HH:mm:ss` for ordinary human-readable local date and time text
when no external contract requires another format. Preserve `MM` for month and
`mm` for minute.

Build local display values from local date components. Do not use
`toISOString()` when it would shift a displayed local time to UTC. Preserve ISO
8601, HTML `datetime-local`, serialized, and third-party formats where their
contracts require them. Do not replace a native date/time control only to force
a display format.

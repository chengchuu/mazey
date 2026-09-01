# Legacy scripts

These scripts are retained for compatibility with historical Mazey release
workflows. New project automation should use the maintained npm scripts and
GitHub Actions workflows instead.

Mazey does not install the legacy helpers' dependencies for library consumers.
Install them in the project that uses these scripts:

```bash
npm install --save-dev date-fns@^2.30.0 execa@^5.1.1 markdown-toc@^1.2.0
```

The canonical helper import is:

```javascript
const { release } = require("mazey/scripts/legacy/git-helper.js");
```

## release

Release this project with an explicit version. The bundled entry point reads
`SCRIPTS_NPM_PACKAGE_VERSION` or `VERSION`.

Usage:

```javascript
const pkgVersion = process.env.VERSION;
release(pkgVersion);
```

It will be more straightforward if you use the development dependence CrossEnv.

```shell
# Install
npm i cross-env -D

# scripts
cross-env SCRIPTS_NPM_PACKAGE_VERSION=$npm_package_version node ./scripts/legacy/release.js
```

```javascript
// release.js
release();
```

<!-- @param {string} ver Version
@returns {void} -->

## generateToc

Generate table of contents for the markdown file.

<!-- @param {string} path Path of markdown file.
@param {array} options.hiddenHeadings Hidden headings.
@returns {void} -->

# scripts

## release

Release this project with version by `process.env.VERSION` or `package.json`.

Usage:

```javascript
const pkgVersion = process.env.VERSION || require("../package.json").version;
release(pkgVersion);
```

It will be more straightforward if you use the development dependence CrossEnv.

```shell
# Install
npm i cross-env -D

# scripts
cross-env SCRIPTS_NPM_PACKAGE_VERSION=$npm_package_version node ./scripts/release.js
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

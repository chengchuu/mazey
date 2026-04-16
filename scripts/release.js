/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
// release
const { release } = require("./git-helper.js");
const pkgVersion = process.env.SCRIPTS_NPM_PACKAGE_VERSION || process.env.VERSION || require("../package.json").version;

console.log("release: SCRIPTS_NPM_PACKAGE_VERSION", process.env.SCRIPTS_NPM_PACKAGE_VERSION);

release(pkgVersion, { canGenerateToc: true, generateTocOnly: true });

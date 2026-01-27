/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
// Git Helper
const execa = require("execa");

/**
 * Release this project with version by `process.env.VERSION` or `package.json`.
 * 
 * Usage:
 * 
 * ```javascript
 * const pkgVersion = process.env.VERSION || require("../package.json").version;
 * release(pkgVersion);
 * ```
 * 
 * It will be more straightforward if you use the development dependence CrossEnv.
 * 
 * ```shell
 * # Install
 * npm i cross-env -D
 * 
 * # scripts
 * cross-env SCRIPTS_NPM_PACKAGE_VERSION=$npm_package_version node ./scripts/release.js
 * ```
 * 
 * ```javascript
 * // release.js
 * release();
 * ```
 * 
 * @param {string} ver Version
 * @returns {void}
 */
async function release (ver, { canGenerateToc = false, defaultBranch = "main" } = {}) {
  if (!ver) {
    ver = process.env.SCRIPTS_NPM_PACKAGE_VERSION;
  }
  if (!ver) {
    console.error("Fail to get the current version.");
    return;
  }
  const { generateToc } = require("./build-helper");
  const releaseVersion = `v${ver}`;
  const { stdout: releaseStdout } = await execa("echo", [ `Start release ${releaseVersion}...` ]);
  console.log(releaseStdout);
  // Generating Table of Contents
  if (canGenerateToc) {
    generateToc();
  }
  // Commit
  await gitCommit(`${releaseVersion} stage`);
  // Marge
  await gitMergeMain2Release(defaultBranch);
  // Build
  await execa("npm", [ "run", "preview" ]);
  await execa("npm", [ "publish" ]);
  // Commit Again
  await gitCommit(releaseVersion);
  // Push
  console.log("Pushing to the remote Git...");
  // await execa("git", ["tag", "-a", `${releaseVersion}`, "-m", `Release ${releaseVersion}`]);
  // await execa("git", ["push", "origin", `refs/tags/${releaseVersion}`]);
  await gitTagPush(releaseVersion);
  await gitPush();
  console.log("All done.");
}

/**
 * Push git tag.
 * 
 * @example
 * ```
 * await gitTagPush("v1.0.0");
 * ```
 * 
 * @param {string} ver Release version
 * @returns {boolean} Is success
 */
async function gitTagPush (ver = "") {
  if (!ver) {
    console.error("Fail to get the current version.");
    return false;
  }
  if (!ver.startsWith("v")) {
    ver = `v${ver}`;
  }
  await execa("git", [ "tag", "-a", `${ver}`, "-m", `Release ${ver}` ]);
  await execa("git", [ "push", "origin", `refs/tags/${ver}` ]);
  return true;
}

/**
 * Push code.
 */
async function gitPush () {
  try {
    await execa("git", [ "push" ], { stdio: "pipe" });
  } catch (error) {
    console.log("Error:", error.message);
    const { stdout: currentBranch } = await execa("git", [ "branch", "--show-current" ], { stdio: "pipe" });
    console.log(`Current Branch: ${currentBranch}`);
    await execa("git", [ "push", "--set-upstream", "origin", currentBranch ]);
  }
  return true;
}

/**
 * Merge main to current branch.
 */
async function gitMergeMain2Release (defaultBranch = "main") {
  const currentBranch = await getGitCurrentBranch();
  await execa("git", [ "checkout", defaultBranch ]);
  await execa("git", [ "pull" ]);
  await execa("git", [ "checkout", currentBranch ]);
  await execa("git", [ "merge", defaultBranch ]);
  return true;
}

/**
 * Alias of `gitMergeMain2Release`.
 */
async function gitMergeMaster2Release (defaultBranch = "main") {
  return await gitMergeMain2Release(defaultBranch);
}

/**
 * Get git current branch.
 */
async function getGitCurrentBranch () {
  let currentBranch = "";
  try {
    ({ stdout: currentBranch } = await execa("git", [ "branch", "--show-current" ], { stdio: "pipe" }));
  } catch (error) {
    ({ stdout: currentBranch } = await execa("git", [ "rev-parse", "--abbrev-ref", "HEAD" ], { stdio: "pipe" }));
  }
  console.log(`Current Branch: ${currentBranch}`);
  return currentBranch;
}

/**
 * Commit current code.
 */
async function gitCommit (releaseVersion = 0) {
  const { stdout: diffStdout } = await execa("git", [ "diff" ], { stdio: "pipe" });
  if (diffStdout) {
    console.log("Committing changes...");
    await execa("git", [ "add", "-A" ]);
    await execa("git", [ "commit", "-m", `release: ${releaseVersion}` ]);
  } else {
    console.log("No changes to commit.");
  }
  return true;
}

module.exports = {
  release,
  gitPush,
  gitMergeMaster2Release, // Deprecated
  gitMergeMain2Release,
  getGitCurrentBranch,
  gitCommit,
  gitTagPush,
};

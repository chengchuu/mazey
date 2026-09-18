/** @jest-environment node */
/* eslint-env jest, node */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("node:fs");
const path = require("node:path");
const pkg = require("../package.json");
const legacyBuildHelper = require("../scripts/legacy/build-helper");
const legacyGitHelper = require("../scripts/legacy/git-helper");

test("legacy helpers remain available from their canonical directory", () => {
  expect(legacyBuildHelper).toEqual(
    expect.objectContaining({
      generateToc: expect.any(Function),
    })
  );
  expect(legacyGitHelper).toEqual(
    expect.objectContaining({
      release: expect.any(Function),
    })
  );
});

test("published legacy helpers document their optional developer setup", () => {
  expect(pkg.files).toEqual(
    expect.arrayContaining([
      "README.md",
      "LICENSE",
      "scripts/legacy",
    ])
  );
  expect(pkg.dependencies).toBeUndefined();
  expect(pkg.devDependencies).toEqual(
    expect.objectContaining({
      "date-fns": expect.any(String),
      execa: expect.any(String),
      "markdown-toc": expect.any(String),
    })
  );

  const readme = fs.readFileSync(
    path.join(process.cwd(), "scripts", "legacy", "README.md"),
    "utf8"
  );
  expect(readme).toContain(
    "npm install --save-dev date-fns@^2.30.0 execa@^5.1.1 markdown-toc@^1.2.0"
  );
  expect(readme).toContain("const pkgVersion = process.env.VERSION;");
  expect(readme).not.toMatch(/require\([^)]*package\.json/);
});

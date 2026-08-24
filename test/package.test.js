/** @jest-environment node */
/* eslint-env jest, node */

import fs from "node:fs";
import path from "node:path";
import * as mazey from "../lib/index.esm";

const { derivePackageMetadata } = mazey;

describe("derivePackageMetadata", () => {
  it("derives scoped package identity without mutating the manifest", () => {
    const author = {
      name: " Example Maintainer ",
      email: " maintainer@example.com ",
      url: " https://example.com ",
      ignored: "value",
    };
    const manifest = {
      name: "@example/my-library",
      version: "1.2.3",
      description: "A reusable library.",
      license: "MIT",
      author,
    };

    expect(
      derivePackageMetadata(manifest, { packageManager: "pnpm" })
    ).toEqual({
      name: "@example/my-library",
      version: "1.2.3",
      description: "A reusable library.",
      license: "MIT",
      author: {
        name: "Example Maintainer",
        email: "maintainer@example.com",
        url: "https://example.com",
      },
      unscopedName: "my-library",
      iifeGlobal: "MY_LIBRARY",
      installCommand: "pnpm add @example/my-library",
    });
    expect(author).toEqual({
      name: " Example Maintainer ",
      email: " maintainer@example.com ",
      url: " https://example.com ",
      ignored: "value",
    });
  });

  it.each([
    [ undefined, "npm install example-package" ],
    [ "npm", "npm install example-package" ],
    [ "pnpm", "pnpm add example-package" ],
    [ "yarn", "yarn add example-package" ],
  ])("uses %p to derive %p", (packageManager, installCommand) => {
    expect(
      derivePackageMetadata(
        { name: "example-package", author: " Example Maintainer " },
        packageManager ? { packageManager } : undefined
      )
    ).toEqual({
      name: "example-package",
      version: undefined,
      description: undefined,
      license: undefined,
      author: { name: "Example Maintainer" },
      unscopedName: "example-package",
      iifeGlobal: "EXAMPLE_PACKAGE",
      installCommand,
    });
  });

  it("uses an empty normalized author when no author is provided", () => {
    expect(derivePackageMetadata({ name: "example" }).author).toEqual({
      name: "",
    });
  });

  it.each([
    [ null, "manifest must be an object" ],
    [ [], "manifest must be an object" ],
    [ {}, "manifest.name must be a non-empty string" ],
    [ { name: " " }, "manifest.name must be a non-empty string" ],
    [ { name: "scope/package" }, "unscoped or scoped" ],
    [ { name: "@scope" }, "valid scoped package name" ],
    [ { name: "@scope/" }, "valid scoped package name" ],
    [ { name: "example package" }, "must not contain whitespace" ],
    [ { name: "example", version: 1 }, "manifest.version must be a string" ],
    [ { name: "example", author: 1 }, "manifest.author must be a string" ],
    [
      { name: "example", author: { name: 1 } },
      "manifest.author.name must be a string",
    ],
  ])("rejects invalid manifest input %#", (manifest, message) => {
    expect(() => derivePackageMetadata(manifest)).toThrow(message);
  });

  it("rejects invalid options and package managers", () => {
    expect(() => derivePackageMetadata({ name: "example" }, null)).toThrow(
      "options must be an object"
    );
    expect(() =>
      derivePackageMetadata({ name: "example" }, { packageManager: "bun" })
    ).toThrow("packageManager");
  });
});

describe("package API catalog", () => {
  it("publishes the injected PWA environment declarations", () => {
    const declarations = fs.readFileSync(
      path.join(process.cwd(), "lib", "index.d.ts"),
      "utf8"
    );

    expect(declarations).toContain("interface PWAEnvironment");
    expect(declarations).toContain("environment?: PWAEnvironment");
    expect(declarations).toMatch(
      /declare function isStandalonePWA\(options\?: IsStandalonePWAOptions\): boolean;/
    );
  });

  it("keeps the documented runtime-export totals aligned with the package", () => {
    const apiMap = fs.readFileSync(
      path.join(
        process.cwd(),
        ".agents",
        "skills",
        "prefer-mazey",
        "references",
        "mazey-api-map.md"
      ),
      "utf8"
    );
    const documentedTotals = apiMap.match(
      /covers all (\d+) runtime exports in the current repository: (\d+) functions and (\d+) console constants\./
    );
    const runtimeExports = Object.entries(mazey);
    const functionCount = runtimeExports.filter(entry =>
      typeof entry[1] === "function"
    ).length;
    const consoleConstants = runtimeExports
      .filter(entry => typeof entry[1] !== "function")
      .map(entry => entry[0])
      .sort();
    const undocumentedExports = runtimeExports
      .map(entry => entry[0])
      .filter(name => !apiMap.includes(`\`${name}\``));

    expect(documentedTotals).not.toBeNull();
    expect(documentedTotals.slice(1).map(Number)).toEqual([
      runtimeExports.length,
      functionCount,
      consoleConstants.length,
    ]);
    expect(consoleConstants).toEqual([ "mazeyCon", "timeCon" ]);
    expect(undocumentedExports).toEqual([]);
  });
});

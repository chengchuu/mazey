/** @jest-environment node */
/* eslint-env jest */

import { derivePackageMetadata } from "../lib/index.esm";

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

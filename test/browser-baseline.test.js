/**
 * @jest-environment node
 */
/* eslint-disable no-undef */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8")
);
const babelConfig = JSON.parse(
  readFileSync(path.join(root, ".babelrc"), "utf8")
);
const tsconfig = JSON.parse(
  readFileSync(path.join(root, "tsconfig.json"), "utf8")
);

test("the package declares the fixed modern browser baseline", () => {
  expect(packageJson.browserslist).toEqual([
    "Chrome >= 109",
    "Edge >= 109",
    "Firefox >= 115",
    "Safari >= 16.4",
    "iOS >= 16.4",
    "ChromeAndroid >= 109",
    "Samsung >= 21",
  ]);
  expect(babelConfig.presets[0][1]).not.toHaveProperty("targets");
  expect(babelConfig.presets[0][1]).not.toHaveProperty("useBuiltIns");
  expect(babelConfig.presets[0][1]).not.toHaveProperty("corejs");
});

test("TypeScript emits ES2022 against bounded native libraries", () => {
  expect(tsconfig.compilerOptions.target).toBe("ES2022");
  expect(tsconfig.compilerOptions.lib).toEqual([
    "ES2022",
    "DOM",
    "DOM.Iterable",
  ]);
});

test("obsolete polyfill dependencies and lock formats stay absent", () => {
  const removedDependencies = [
    "@babel/plugin-transform-class-properties",
    "@babel/plugin-transform-object-rest-spread",
    "@babel/runtime-corejs3",
    "core-js",
  ];

  removedDependencies.forEach((dependency) => {
    expect(packageJson.devDependencies).not.toHaveProperty(dependency);
  });
  expect(packageJson.dependencies).toBeUndefined();
  const trackedLocks = execFileSync(
    "git",
    [ "ls-files", "--", "package-lock.json", "pnpm-lock.yaml" ],
    { cwd: root, encoding: "utf8" }
  ).trim().split(/\r?\n/).filter(Boolean);
  expect(trackedLocks).toEqual([ "pnpm-lock.yaml" ]);
});

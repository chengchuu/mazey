/** @jest-environment node */
/* eslint-env jest, node */

import pkg from "../package.json";
import projectConfig from "../project.config";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import {
  createManifest,
  fingerprintPages,
  normalizeHeadingOrder,
  renderServiceWorker,
  transformApiHtml,
} from "../scripts/build-pages";
import {
  packageDetails,
  repositoryDetails,
} from "../scripts/project-config-utils";
import { manifestMetadataFailures } from "../scripts/validate-pwa";

const typeDocHtml = `<!doctype html><html><head><title>mazey</title></head><body><header><div class="tsd-toolbar-contents container"></div></header><div class="tsd-page-title"><h2>mazey</h2></div><main><p>Public API documentation content.</p></main></body></html>`;

test("project configuration derives deployment identity from package metadata", () => {
  expect(pkg.private).not.toBe(true);
  expect(pkg.scripts.prepublishOnly).toBeUndefined();
  expect(projectConfig.package).toMatchObject({
    name: pkg.name,
    version: pkg.version,
    installCommand: `npm install ${pkg.name}`,
  });
  expect(projectConfig.site).toMatchObject({
    url: pkg.homepage,
    basePath: "/mazey/",
  });
  expect(projectConfig.pwa.serviceWorkerUrl).toBe("/mazey/service-worker.js");
  expect(projectConfig.site.theme.storageKey).toBe("mazey-theme");
  expect(projectConfig.urls.cdn).toBe(
    "https://cdn.jsdelivr.net/npm/mazey@latest/lib/mazey.min.js"
  );
});

test("README CDN examples track the latest npm release", () => {
  const expected = "https://cdn.jsdelivr.net/npm/mazey@latest/lib/mazey.min.js";
  for (const file of ["README.md", "README.zh-CN.md"]) {
    const readme = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    expect(readme).toContain(expected);
    expect(readme).not.toMatch(
      /cdn\.jsdelivr\.net\/npm\/mazey@(?!latest\/)[^/]+\/lib\/mazey\.min\.js/
    );
  }

  const homepage = fs.readFileSync(
    path.join(process.cwd(), "site", "index.html"),
    "utf8"
  );
  expect(homepage).toContain("<%= CDN_URL %>");
  expect(homepage).not.toContain("Pin an exact version");
});

test("Pages CI builds package outputs before running Jest", () => {
  const workflow = fs.readFileSync(
    path.join(process.cwd(), ".github", "workflows", "pages.yml"),
    "utf8"
  );
  const build = workflow.indexOf("run: npm run build");
  const test = workflow.indexOf("run: npm test -- --runInBand");

  expect(build).toBeGreaterThan(-1);
  expect(test).toBeGreaterThan(build);
});

test.each([
  "github:example/library",
  "example/library",
  "git@github.com:example/library.git",
  "git+https://github.com/example/library.git",
])("normalizes GitHub repository metadata from %s", (repository) => {
  expect(repositoryDetails(repository)).toEqual({
    name: "library",
    owner: "example",
    slug: "example/library",
    url: "https://github.com/example/library",
  });
});

test("package identity supports scoped package names", () => {
  expect(packageDetails({ name: "@example/library" })).toMatchObject({
    bundleBaseName: "library",
    iifeGlobal: "library",
    installCommand: "npm install @example/library",
  });
});

test("API transformation is complete, idempotent, and promotes a page h1", () => {
  const transformed = transformApiHtml(typeDocHtml, "modules.html");
  expect(transformApiHtml(transformed, "modules.html")).toBe(transformed);
  expect(transformed).toContain(
    `rel="canonical" href="${projectConfig.site.pages.api.url}modules.html"`
  );
  expect(transformed).toContain('href="../assets/api.css"');
  expect(transformed).toContain('src="../assets/api.js"');
  expect(transformed.match(/<h1\b/g)).toHaveLength(1);
});

test("API toolbar reserves space between the project title and search control", () => {
  const apiCss = fs.readFileSync(
    path.join(process.cwd(), "site", "api.css"),
    "utf8"
  );

  expect(apiCss).toMatch(
    /\.tsd-page-toolbar \.tsd-toolbar-contents > #tsd-search\s*{[^}]*min-width:\s*8rem;[^}]*}/
  );
  expect(apiCss).toMatch(
    /@media \(max-width: 600px\)\s*{[\s\S]*?#tsd-search > a\.title\s*{[^}]*display:\s*none;[^}]*}/
  );
  expect(apiCss).not.toContain(".tsd-toolbar-contents > a.title");
});

test("API index uses the TypeDoc page title as its primary heading", () => {
  const transformed = transformApiHtml(
    typeDocHtml.replace("<main><p>", "<main><h1>Mazey</h1><p>"),
    "index.html"
  );
  const headings = [...transformed.matchAll(/<h([1-6])\b/g)].map(
    (match) => match[1]
  );

  expect(headings[0]).toBe("1");
  expect(headings.filter((level) => level === "1")).toHaveLength(1);
  expect(transformed).toContain("<h2>Mazey</h2>");
});

test("API function pages retain one primary heading", () => {
  const transformed = transformApiHtml(
    `<!doctype html><html><head><title>addClass | mazey API Reference</title></head><body><header><div class="tsd-toolbar-contents container"></div></header><div class="tsd-page-title"><ul><li>mazey</li></ul><h1>Function addClass</h1></div><main><h2>Parameters</h2><h3>Returns</h3></main></body></html>`,
    "functions/addClass.html"
  );
  const headings = [...transformed.matchAll(/<h([1-6])\b/g)].map(
    (match) => match[1]
  );

  expect(headings.slice(0, 3)).toEqual(["1", "2", "3"]);
  expect(headings.filter((level) => level === "1")).toHaveLength(1);
});

test("API theme bootstrap rejects corrupted stored preferences", () => {
  const transformed = transformApiHtml(typeDocHtml, "index.html");
  const initializer = [...transformed.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .find((script) => script.includes("tsd-theme"));
  const values = new Map([["mazey-theme", "corrupted"]]);
  const meta = {
    content: projectConfig.site.theme.colorLight,
    dataset: {
      themeColorDark: projectConfig.site.theme.colorDark,
      themeColorLight: projectConfig.site.theme.colorLight,
    },
  };
  const documentElement = { dataset: {}, style: {} };

  vm.runInNewContext(initializer, {
    document: {
      documentElement,
      querySelector: () => meta,
    },
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
    matchMedia: () => ({ matches: false }),
  });

  expect(documentElement.dataset.bsTheme).toBe("light");
  expect(values.get("tsd-theme")).toBe("os");
});

test("heading normalization prevents skipped levels", () => {
  expect(
    normalizeHeadingOrder(
      "<main><h1>Entry</h1><h4>Signature</h4><h6>Returns</h6></main>"
    )
  ).toBe("<main><h1>Entry</h1><h2>Signature</h2><h3>Returns</h3></main>");
});

test("manifest and service worker stay scoped to the Pages base path", () => {
  const manifest = createManifest();
  expect(manifest).toMatchObject({
    id: "/mazey/",
    start_url: "/mazey/",
    scope: "/mazey/",
  });
  expect(manifest.icons).toHaveLength(3);

  const worker = renderServiceWorker(
    'const base = "__PWA_PROJECT_BASE__"; const prefix = "__PWA_CACHE_PREFIX__"; const version = "__PWA_CACHE_VERSION__"; const apiAssets = JSON.parse("__PWA_API_APP_SHELL__");',
    "test-version",
    ["/mazey/api/assets/main.js"]
  );
  expect(worker).toContain('const base = "/mazey/"');
  expect(worker).toContain("test-version");
  expect(worker).toContain("/mazey/api/assets/main.js");
  expect(worker).not.toMatch(/__PWA_[A-Z_]+__/);
});

test("Pages fingerprint changes when the service worker source changes", () => {
  const directory = fs.mkdtempSync(path.join(tmpdir(), "mazey-pages-"));
  try {
    fs.writeFileSync(path.join(directory, "index.html"), "same page");
    const first = fingerprintPages(directory, [
      { name: "site/service-worker.js", contents: "worker version one" },
    ]);
    const second = fingerprintPages(directory, [
      { name: "site/service-worker.js", contents: "worker version two" },
    ]);

    expect(second).not.toBe(first);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("manifest validation rejects malformed metadata", () => {
  expect(
    manifestMetadataFailures({
      ...createManifest(),
      short_name: " ",
      display: "native-window",
      theme_color: "purple",
      background_color: "#fff",
    })
  ).toEqual(
    expect.arrayContaining([
      "Manifest short_name must be a non-empty string",
      "Manifest display mode is invalid: native-window",
      "Manifest theme_color must be a six-digit hex color",
      "Manifest background_color must be a six-digit hex color",
    ])
  );
});

/* eslint-env node */

const { existsSync, readFileSync, readdirSync, statSync } = require("node:fs");
const path = require("node:path");
const projectConfig = require("../project.config");
const { apiAppShellAssets } = require("./build-pages");
const manifestDisplayModes = new Set([
  "browser",
  "fullscreen",
  "minimal-ui",
  "standalone",
]);

function manifestMetadataFailures(manifest) {
  const failures = [];
  for (const field of ["name", "short_name", "description"]) {
    if (typeof manifest[field] !== "string" || !manifest[field].trim()) {
      failures.push(`Manifest ${field} must be a non-empty string`);
    }
  }
  if (!manifestDisplayModes.has(manifest.display)) {
    failures.push(`Manifest display mode is invalid: ${manifest.display}`);
  }
  for (const field of ["theme_color", "background_color"]) {
    if (!/^#[0-9a-f]{6}$/i.test(manifest[field] ?? "")) {
      failures.push(`Manifest ${field} must be a six-digit hex color`);
    }
  }
  return failures;
}

function pngDimensions(file) {
  const contents = readFileSync(file);
  if (contents.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${file}: expected a PNG signature`);
  }
  if (contents.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`${file}: missing PNG IHDR chunk`);
  }
  return {
    width: contents.readUInt32BE(16),
    height: contents.readUInt32BE(20),
  };
}

function filesIn(directory) {
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return statSync(file).isDirectory() ? filesIn(file) : [file];
  });
}

function findTag(html, tagName, attributeName, value) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))]
    .map((match) =>
      Object.fromEntries(
        [...match[0].matchAll(/([:\w-]+)(?:=["']([^"']*)["'])?/g)].map(
          (attribute) => [attribute[1].toLowerCase(), attribute[2] ?? ""]
        )
      )
    )
    .find((attributes) => attributes[attributeName] === value);
}

function validatePwa({ rootDir = path.resolve(__dirname, "..") } = {}) {
  const failures = [];
  const docs = path.join(rootDir, "docs");
  const manifestFile = path.join(docs, "manifest.webmanifest");
  const workerFile = path.join(docs, "service-worker.js");
  let manifest;

  if (!existsSync(manifestFile)) failures.push("Manifest is missing from docs");
  else {
    try {
      manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
    } catch (error) {
      failures.push(`Manifest is invalid JSON: ${error.message}`);
    }
  }

  if (manifest) {
    failures.push(...manifestMetadataFailures(manifest));
    if (manifest.name !== projectConfig.pwa.name) {
      failures.push(`Manifest name must be ${projectConfig.pwa.name}`);
    }
    if (manifest.short_name !== projectConfig.pwa.shortName) {
      failures.push(
        `Manifest short_name must be ${projectConfig.pwa.shortName}`
      );
    }
    if (manifest.description !== projectConfig.pwa.description) {
      failures.push("Manifest description must match project configuration");
    }
    for (const field of ["id", "start_url", "scope"]) {
      if (manifest[field] !== projectConfig.site.basePath) {
        failures.push(
          `Manifest ${field} must be ${projectConfig.site.basePath}`
        );
      }
    }
    if (manifest.display !== projectConfig.pwa.display) {
      failures.push(`Manifest display must be ${projectConfig.pwa.display}`);
    }
    if (manifest.theme_color !== projectConfig.pwa.themeColor) {
      failures.push(
        `Manifest theme_color must be ${projectConfig.pwa.themeColor}`
      );
    }
    if (manifest.background_color !== projectConfig.pwa.backgroundColor) {
      failures.push(
        `Manifest background_color must be ${projectConfig.pwa.backgroundColor}`
      );
    }
    const requiredSizes = new Set(["192x192", "512x512"]);
    let maskable = false;
    for (const icon of manifest.icons ?? []) {
      if (!icon.src?.startsWith(projectConfig.site.basePath)) {
        failures.push(`Manifest icon is outside project scope: ${icon.src}`);
        continue;
      }
      if (icon.type !== "image/png") {
        failures.push(`Manifest icon must use image/png: ${icon.src}`);
      }
      const iconFile = path.join(
        docs,
        icon.src.slice(projectConfig.site.basePath.length)
      );
      if (!existsSync(iconFile)) {
        failures.push(`Manifest icon is missing: ${icon.src}`);
        continue;
      }
      const actual = pngDimensions(iconFile);
      if (`${actual.width}x${actual.height}` !== icon.sizes) {
        failures.push(`Manifest icon dimensions do not match ${icon.src}`);
      }
      requiredSizes.delete(icon.sizes);
      if (String(icon.purpose).split(/\s+/).includes("maskable"))
        maskable = true;
    }
    for (const size of requiredSizes)
      failures.push(`Manifest is missing a ${size} icon`);
    if (!maskable) failures.push("Manifest is missing a maskable icon");
  }

  const pages = [
    ["Homepage", path.join(docs, "index.html"), true],
    ["Playground", path.join(docs, "playground", "index.html"), true],
    ["API documentation", path.join(docs, "api", "index.html"), false],
  ];
  for (const [label, file, installButton] of pages) {
    if (!existsSync(file)) {
      failures.push(`${label} HTML is missing`);
      continue;
    }
    const html = readFileSync(file, "utf8");
    if (
      findTag(html, "link", "rel", "manifest")?.href !==
      projectConfig.pwa.manifestUrl
    ) {
      failures.push(`${label} must link ${projectConfig.pwa.manifestUrl}`);
    }
    const themeColor = findTag(html, "meta", "name", "theme-color");
    if (!themeColor || !Object.hasOwn(themeColor, "data-theme-color")) {
      failures.push(`${label} is missing dynamic theme-color metadata`);
    } else {
      const lightThemeColor = projectConfig.site.theme.colorPrimary;
      const darkThemeColor = projectConfig.site.theme.primary.dark.base;
      if (
        themeColor.content !== lightThemeColor ||
        themeColor["data-theme-color-light"] !== lightThemeColor
      ) {
        failures.push(`${label} must use the light primary theme color`);
      }
      if (themeColor["data-theme-color-dark"] !== darkThemeColor) {
        failures.push(`${label} must use the dark primary theme color`);
      }
    }
    if (installButton && !/<button\b[^>]*data-pwa-install/.test(html)) {
      failures.push(`${label} is missing an install button`);
    }
    if (!/<button\b[^>]*data-pwa-update-now/.test(html)) {
      failures.push(`${label} is missing an update button`);
    }
    if (!/data-pwa-status/.test(html))
      failures.push(`${label} is missing a PWA status region`);
  }

  if (!existsSync(workerFile))
    failures.push("Service worker is missing from docs");
  else {
    const worker = readFileSync(workerFile, "utf8");
    if (/__PWA_[A-Z_]+__/.test(worker))
      failures.push("Service worker has unresolved tokens");
    if (
      !worker.includes(`const PROJECT_BASE = "${projectConfig.site.basePath}"`)
    ) {
      failures.push("Service worker project base is incorrect");
    }
    if (
      !worker.includes(
        `const CACHE_PREFIX = "${projectConfig.pwa.cachePrefix}"`
      )
    ) {
      failures.push("Service worker cache prefix is incorrect");
    }
    if (!worker.includes('request.method === "GET"')) {
      failures.push("Service worker must ignore non-GET requests");
    }
    if (!worker.includes("url.origin === self.location.origin")) {
      failures.push("Service worker must ignore cross-origin requests");
    }
    if (!worker.includes('event.data?.type === "SKIP_WAITING"')) {
      failures.push("Service worker updates must require explicit activation");
    }
    const apiIndex = path.join(docs, "api", "index.html");
    if (existsSync(apiIndex)) {
      const apiAssets = apiAppShellAssets(readFileSync(apiIndex, "utf8"));
      for (const asset of apiAssets) {
        if (!worker.includes(asset)) {
          failures.push(`Service worker does not precache API asset: ${asset}`);
        }
      }
    }
  }

  const scriptDirectory = path.join(docs, "assets");
  if (!existsSync(scriptDirectory)) {
    failures.push("Compiled site assets are missing");
  } else {
    const browserCode = filesIn(scriptDirectory)
      .filter((file) => file.endsWith(".js") && !file.endsWith(".map"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    if (!browserCode.includes(projectConfig.pwa.serviceWorkerUrl)) {
      failures.push(
        "Compiled site does not contain the configured service worker URL"
      );
    }
    if (!browserCode.includes(projectConfig.site.basePath)) {
      failures.push("Compiled site does not contain the service worker scope");
    }
  }
  const packageSource = filesIn(path.join(rootDir, "src"))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
  if (
    /serviceWorker\s*\.\s*register|beforeinstallprompt|manifest\.webmanifest/.test(
      packageSource
    )
  ) {
    failures.push("Published package source contains website PWA behavior");
  }

  if (failures.length) {
    throw new Error(`PWA validation failed:\n- ${failures.join("\n- ")}`);
  }
  return { icons: manifest.icons?.length ?? 0, pages: pages.length };
}

if (require.main === module) {
  try {
    const result = validatePwa();
    console.log(
      `PWA validation passed for ${result.pages} entry pages and ${result.icons} manifest icons.`
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  manifestMetadataFailures,
  pngDimensions,
  validatePwa,
};

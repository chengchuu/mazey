/* eslint-env node */

const { existsSync, readFileSync, readdirSync, statSync } = require("node:fs");
const path = require("node:path");
const projectConfig = require("../project.config");
const { pngDimensions } = require("./validate-pwa");

const root = path.resolve(__dirname, "..");
const docs = path.join(root, "docs");
const failures = [];
const sitePages = projectConfig.site.pages;

function fail(message) {
  failures.push(message);
}

function matches(html, expression) {
  return [...html.matchAll(expression)];
}

function attributes(tag) {
  return Object.fromEntries(
    matches(tag, /([:\w-]+)(?:=["']([^"']*)["'])?/g).map((item) => [
      item[1].toLowerCase(),
      item[2] ?? "",
    ])
  );
}

function attribute(html, tag, name, value) {
  return (
    matches(html, new RegExp(`<${tag}\\b[^>]*>`, "gi"))
      .map((match) => attributes(match[0]))
      .find((item) => item[name] === value) ?? null
  );
}

function visibleText(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function validateJsonLd(label, html, expectedUrl) {
  const blocks = matches(
    html,
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (blocks.length !== 1) {
    fail(`${label}: expected exactly one JSON-LD block`);
    return;
  }
  try {
    const data = JSON.parse(blocks[0][1]);
    if (data.url !== expectedUrl)
      fail(`${label}: JSON-LD URL must be ${expectedUrl}`);
  } catch (error) {
    fail(`${label}: JSON-LD is invalid (${error.message})`);
  }
}

function validateHeadingOrder(label, html) {
  const levels = matches(html, /<h([1-6])\b/gi).map((match) =>
    Number(match[1])
  );
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] > levels[index - 1] + 1) {
      fail(
        `${label}: heading level jumps from h${levels[index - 1]} to h${
          levels[index]
        }`
      );
    }
  }
}

function validateSocial(label, html, canonical, title, description) {
  const image = projectConfig.seo.openGraphImage;
  const expected = {
    "og:type": "website",
    "og:site_name": projectConfig.brand.displayName,
    "og:title": title,
    "og:description": description,
    "og:url": canonical,
    "og:image": image.url,
    "og:image:type": image.type,
    "og:image:width": String(image.width),
    "og:image:height": String(image.height),
    "og:image:alt": image.alt,
  };
  for (const [property, value] of Object.entries(expected)) {
    if (attribute(html, "meta", "property", property)?.content !== value) {
      fail(`${label}: ${property} must be ${value}`);
    }
  }
  const twitter = {
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": image.url,
    "twitter:image:alt": image.alt,
  };
  for (const [name, value] of Object.entries(twitter)) {
    if (attribute(html, "meta", "name", name)?.content !== value) {
      fail(`${label}: ${name} must be ${value}`);
    }
  }
}

function validatePage({
  label,
  file,
  canonical,
  title,
  description,
  requiredLinks,
  css,
  scripts,
  navigation = false,
}) {
  if (!existsSync(file)) {
    fail(`${label}: missing ${file}`);
    return;
  }
  const html = readFileSync(file, "utf8");
  const pageTitles = matches(html, /<title>([^<]*)<\/title>/gi);
  if (pageTitles.length !== 1 || pageTitles[0][1].trim() !== title) {
    fail(`${label}: title must be ${title}`);
  }
  if (attribute(html, "meta", "name", "description")?.content !== description) {
    fail(`${label}: meta description is missing or incorrect`);
  }
  if (attribute(html, "link", "rel", "canonical")?.href !== canonical) {
    fail(`${label}: canonical must be ${canonical}`);
  }
  if (!attribute(html, "link", "rel", "icon"))
    fail(`${label}: favicon is missing`);
  if (!attribute(html, "link", "rel", "manifest"))
    fail(`${label}: manifest link is missing`);
  if (!attribute(html, "html", "data-bs-theme", "light")) {
    fail(`${label}: Bootstrap color-mode default is missing`);
  }
  if (!attribute(html, "link", "href", css))
    fail(`${label}: stylesheet ${css} is missing`);
  for (const script of scripts) {
    if (!attribute(html, "script", "src", script))
      fail(`${label}: script ${script} is missing`);
  }
  for (const link of requiredLinks) {
    if (!attribute(html, "a", "href", link))
      fail(`${label}: link ${link} is missing`);
  }
  const h1s = matches(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  if (h1s.length !== 1 || !visibleText(h1s[0][1])) {
    fail(`${label}: expected exactly one non-empty h1`);
  }
  if (visibleText(html).length < 220)
    fail(`${label}: initial HTML lacks crawlable content`);
  if (!/<select\b[^>]*data-theme-select/.test(html))
    fail(`${label}: theme control is missing`);
  if (
    navigation &&
    !/<button\b[^>]*aria-expanded="false"[^>]*data-nav-toggle/.test(html)
  ) {
    fail(`${label}: accessible mobile navigation toggle is missing`);
  }
  validateHeadingOrder(label, html);
  validateJsonLd(label, html, canonical);
  validateSocial(label, html, canonical, title, description);
}

function htmlFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const file = path.join(directory, name);
    return statSync(file).isDirectory()
      ? htmlFiles(file)
      : file.endsWith(".html")
      ? [file]
      : [];
  });
}

function validateApiPages() {
  const api = path.join(docs, "api");
  const canonicals = new Set();
  const titles = new Set();
  for (const file of htmlFiles(api)) {
    const relative = path.relative(api, file).replaceAll(path.sep, "/");
    const html = readFileSync(file, "utf8");
    const canonical = attribute(html, "link", "rel", "canonical")?.href;
    if (!canonical?.startsWith(sitePages.api.url)) {
      fail(`API ${relative}: canonical is missing or outside the API route`);
    } else if (canonicals.has(canonical)) {
      fail(`API ${relative}: duplicate canonical ${canonical}`);
    } else {
      canonicals.add(canonical);
    }
    const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
    if (!title) fail(`API ${relative}: title is missing`);
    else if (titles.has(title))
      fail(`API ${relative}: duplicate title ${title}`);
    else titles.add(title);
    const description = attribute(html, "meta", "name", "description")?.content;
    if (!description) {
      fail(`API ${relative}: description is missing`);
    }
    const assetPrefix = "../".repeat(relative.split("/").length);
    if (!attribute(html, "link", "href", `${assetPrefix}assets/api.css`)) {
      fail(`API ${relative}: API stylesheet is missing`);
    }
    if (!attribute(html, "script", "src", `${assetPrefix}assets/api.js`)) {
      fail(`API ${relative}: API script is missing`);
    }
    for (const control of [
      'id="tsd-search-trigger"',
      '<dialog id="tsd-search"',
      'id="tsd-search-input"',
      'id="tsd-search-results"',
    ]) {
      if (!html.includes(control)) {
        fail(`API ${relative}: search dialog control is missing: ${control}`);
      }
    }
    const h1s = matches(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
    if (h1s.length !== 1) fail(`API ${relative}: expected exactly one h1`);
    const firstHeading = html.match(/<h([1-6])\b/i);
    if (firstHeading?.[1] !== "1")
      fail(`API ${relative}: first heading must be h1`);
    validateHeadingOrder(`API ${relative}`, html);
    if (canonical) {
      validateJsonLd(`API ${relative}`, html, canonical);
      validateSocial(
        `API ${relative}`,
        html,
        canonical,
        title ?? "",
        description ?? ""
      );
    }
  }
  return htmlFiles(api).length;
}

function validateStaticAssets() {
  for (const asset of [
    "assets/shared.css",
    "assets/shared.js",
    "assets/home.js",
    "assets/playground.js",
    "assets/api.css",
    "assets/api.js",
    `images/${projectConfig.assets.faviconFile}`,
    `images/${projectConfig.assets.logoFile}`,
    `images/${projectConfig.seo.openGraphImage.file}`,
  ]) {
    if (!existsSync(path.join(docs, asset)))
      fail(`${asset}: missing from Pages artifact`);
  }
  const socialFile = path.join(
    docs,
    "images",
    projectConfig.seo.openGraphImage.file
  );
  if (existsSync(socialFile)) {
    const dimensions = pngDimensions(socialFile);
    if (dimensions.width !== 1200 || dimensions.height !== 630) {
      fail("Open Graph image must be 1200x630");
    }
  }
  const sharedCss = path.join(docs, "assets", "shared.css");
  if (
    existsSync(sharedCss) &&
    !/Bootstrap\s+v5\.3\.8/.test(readFileSync(sharedCss, "utf8"))
  ) {
    fail("Bootstrap 5.3.8 is missing from the site bundle");
  }
  const homepage = path.join(docs, "index.html");
  if (
    existsSync(homepage) &&
    !readFileSync(homepage, "utf8").includes(projectConfig.urls.cdn)
  ) {
    fail(`Homepage CDN example must use ${projectConfig.urls.cdn}`);
  }
  const robots = path.join(docs, "robots.txt");
  const sitemap = path.join(docs, "sitemap.xml");
  if (!existsSync(robots)) fail("robots.txt is missing");
  else if (!readFileSync(robots, "utf8").includes(projectConfig.urls.sitemap)) {
    fail("robots.txt does not reference the canonical sitemap");
  }
  if (!existsSync(sitemap)) fail("sitemap.xml is missing");
  else {
    const xml = readFileSync(sitemap, "utf8");
    if (!/^<\?xml\b[^>]*\?>\s*<urlset\b[^>]*>[\s\S]*<\/urlset>\s*$/.test(xml)) {
      fail("sitemap.xml is not a complete XML urlset document");
    }
    const locations = matches(xml, /<loc>([^<]+)<\/loc>/g).map(
      (match) => match[1]
    );
    for (const url of [
      sitePages.home.url,
      sitePages.playground.url,
      sitePages.api.url,
    ]) {
      if (!locations.includes(url)) fail(`sitemap.xml is missing ${url}`);
    }
    if (new Set(locations).size !== locations.length)
      fail("sitemap.xml has duplicate URLs");
  }
}

function validateSite() {
  failures.length = 0;
  validatePage({
    label: "Homepage",
    file: path.join(docs, "index.html"),
    canonical: sitePages.home.url,
    title: sitePages.home.title,
    description: sitePages.home.description,
    requiredLinks: [
      "./playground/",
      "./api/",
      "./sitemap.xml",
      projectConfig.urls.github,
      projectConfig.urls.npm,
    ],
    css: `${projectConfig.site.basePath}assets/shared.css`,
    scripts: [
      `${projectConfig.site.basePath}assets/shared.js`,
      `${projectConfig.site.basePath}assets/home.js`,
    ],
    navigation: true,
  });
  validatePage({
    label: "Playground",
    file: path.join(docs, "playground", "index.html"),
    canonical: sitePages.playground.url,
    title: sitePages.playground.title,
    description: sitePages.playground.description,
    requiredLinks: [
      "../",
      "../#installation",
      "../#usage",
      "../api/",
      projectConfig.urls.github,
      projectConfig.urls.npm,
    ],
    css: `${projectConfig.site.basePath}assets/shared.css`,
    scripts: [
      `${projectConfig.site.basePath}assets/shared.js`,
      `${projectConfig.site.basePath}assets/playground.js`,
    ],
    navigation: true,
  });
  const apiPages = validateApiPages();
  validateStaticAssets();
  if (failures.length)
    throw new Error(`SEO validation failed:\n- ${failures.join("\n- ")}`);
  return { apiPages, pages: 3 };
}

if (require.main === module) {
  try {
    const result = validateSite();
    console.log(
      `SEO validation passed for ${result.pages} primary pages and ${result.apiPages} API pages.`
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { attribute, validateSite, visibleText };

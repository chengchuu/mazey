const pkg = require("./package.json");
const {
  packageDetails,
  repositoryDetails,
} = require("./scripts/project-config-utils");

const packageConfig = packageDetails(pkg);
const repository = repositoryDetails(pkg.repository);
const siteUrl = new URL(pkg.homepage);
const basePath = siteUrl.pathname.endsWith("/")
  ? siteUrl.pathname
  : `${siteUrl.pathname}/`;
siteUrl.pathname = basePath;
siteUrl.search = "";
siteUrl.hash = "";

const displayName = "Mazey";
const githubUrl = repository.url;
const npmUrl = `https://www.npmjs.com/package/${pkg.name}`;
const cdnUrl = `https://cdn.jsdelivr.net/npm/${pkg.name}@latest/lib/${packageConfig.bundleBaseName}.min.js`;
const faviconFile = "logo-dark-circle-transparent-32x32.png";
const logoFile = "logo-dark-circle-transparent-200x200.png";
const openGraphImageFile = "logo-dark-circle-open-graph-1200x630.png";
const primaryPalette = {
  light: {
    base: "#5b3fd6",
    hover: "#4229b5",
    active: "#362097",
    soft: "#ece8ff",
    rgb: "91, 63, 214",
    hoverRgb: "66, 41, 181",
  },
  dark: {
    base: "#b5a6ff",
    hover: "#cbbfff",
    active: "#ded8ff",
    soft: "#29234c",
    rgb: "181, 166, 255",
    hoverRgb: "203, 191, 255",
  },
};
const theme = {
  storageKey: `${packageConfig.bundleBaseName}-theme`,
  colorPrimary: primaryPalette.light.base,
  colorLight: "#f7f8fc",
  colorDark: "#0d1220",
  primary: primaryPalette,
};
const pages = {
  home: {
    title: "Mazey - TypeScript Utilities for Frontend Development",
    description:
      "Mazey is a TypeScript utility library for common frontend work, including URLs, dates, validation, DOM helpers, storage, loading, browser detection, and performance.",
    url: siteUrl.href,
  },
  playground: {
    title: "Mazey Playground - Try Frontend Utility APIs",
    description:
      "Try Mazey duration formatting, identifier conversion, and email validation utilities in an interactive browser playground.",
    url: new URL("playground/", siteUrl).href,
  },
  api: {
    title: "Mazey API Documentation",
    description:
      "TypeScript API documentation for Mazey frontend utilities, including runtime behavior, parameters, return values, and public types.",
    url: new URL("api/", siteUrl).href,
  },
};
const pwaIcons = [
  {
    file: "logo-dark-circle-transparent-192x192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any",
  },
  {
    file: "logo-dark-circle-transparent-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any",
  },
  {
    file: "logo-dark-circle-transparent-maskable-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];
const software = {
  "@type": "SoftwareSourceCode",
  name: displayName,
  description: pages.home.description,
  url: pages.home.url,
  codeRepository: githubUrl,
  downloadUrl: npmUrl,
  license: `${githubUrl}/blob/main/LICENSE`,
  programmingLanguage: "TypeScript",
};
const openGraphImage = {
  file: openGraphImageFile,
  url: new URL(`images/${openGraphImageFile}`, siteUrl).href,
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "The Mazey rabbit logo on a purple abstract background.",
};

module.exports = Object.freeze({
  package: packageConfig,
  repository,
  brand: {
    displayName,
    shortName: "Mazey",
  },
  urls: {
    cdn: cdnUrl,
    github: githubUrl,
    npm: npmUrl,
    license: `${githubUrl}/blob/main/LICENSE`,
    sitemap: new URL("sitemap.xml", siteUrl).href,
  },
  assets: {
    faviconFile,
    faviconUrl: `${basePath}images/${faviconFile}`,
    logoFile,
    logoUrl: `${basePath}images/${logoFile}`,
  },
  site: {
    url: siteUrl.href,
    basePath,
    markerPrefix: packageConfig.bundleBaseName,
    pages,
    theme,
  },
  seo: {
    openGraphImage,
    software,
    rootJsonLd: {
      "@context": "https://schema.org",
      ...software,
    },
    playgroundJsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Mazey Utility Playground",
      description: pages.playground.description,
      url: pages.playground.url,
      isPartOf: {
        "@type": "WebSite",
        name: displayName,
        url: pages.home.url,
      },
      about: software,
    },
  },
  pwa: {
    name: "Mazey Documentation",
    shortName: "Mazey",
    display: "standalone",
    backgroundColor: theme.colorLight,
    themeColor: theme.colorPrimary,
    manifestUrl: `${basePath}manifest.webmanifest`,
    serviceWorkerUrl: `${basePath}service-worker.js`,
    cachePrefix: `${packageConfig.bundleBaseName}-site-`,
    description:
      "Installable Mazey website with utility examples, a browser playground, and TypeScript API documentation.",
    icons: pwaIcons.map(({ file, ...icon }) => ({
      ...icon,
      file,
      src: `${basePath}images/${file}`,
    })),
  },
});

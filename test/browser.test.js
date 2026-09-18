/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  detectVisitorType, isSafePWAEnv, isStandalonePWA, getBrowserInfo,
  isSupportWebp, genBrowserAttrs, isIOS, isAndroid, isMacOS, isWindows,
  isLinux,
} from "../lib/index.esm";

const operatingSystemChecks = {
  ios: isIOS,
  android: isAndroid,
  macos: isMacOS,
  windows: isWindows,
  linux: isLinux,
};

const operatingSystemUserAgents = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
    "AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  ipad:
    "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) " +
    "AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  ipod:
    "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_7 like Mac OS X) " +
    "AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  androidPhone:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) " +
    "AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36",
  androidTablet:
    "Mozilla/5.0 (Linux; Android 13; Pixel Tablet) " +
    "AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
  macos:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) " +
    "AppleWebKit/605.1.15 Version/17.5 Safari/605.1.15",
  windows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
  linux:
    "Mozilla/5.0 (X11; Linux x86_64) " +
    "AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
};

describe("detectVisitorType", () => {
  const originalUserAgent = Object.getOwnPropertyDescriptor(
    navigator,
    "userAgent"
  );
  const originalWebdriver = Object.getOwnPropertyDescriptor(
    navigator,
    "webdriver"
  );

  function restoreNavigatorProperty(property, descriptor) {
    if (descriptor) {
      Object.defineProperty(navigator, property, descriptor);
    } else {
      delete navigator[property];
    }
  }

  function setNavigatorProperty(property, value) {
    Object.defineProperty(navigator, property, {
      configurable: true,
      value,
    });
  }

  afterEach(() => {
    restoreNavigatorProperty("userAgent", originalUserAgent);
    restoreNavigatorProperty("webdriver", originalWebdriver);
  });

  it.each([
    [
      "Googlebot",
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ],
    [
      "Googlebot Smartphone",
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36 " +
        "(compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ],
    [ "Google Inspection Tool", "Mozilla/5.0 Google-InspectionTool/1.0" ],
    [ "Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0)" ],
    [ "BingPreview", "Mozilla/5.0 (compatible; BingPreview/1.0)" ],
    [ "DuckDuckBot", "DuckDuckBot/1.0; (+http://duckduckgo.com/duckduckbot.html)" ],
    [ "Baiduspider", "Mozilla/5.0 (compatible; Baiduspider/2.0)" ],
    [ "YandexBot", "Mozilla/5.0 (compatible; YandexBot/3.0)" ],
    [ "Applebot", "Mozilla/5.0 (compatible; Applebot/0.1)" ],
    [ "PetalBot", "Mozilla/5.0 (compatible; PetalBot; +https://aspiegel.com)" ],
    [ "Bytespider", "Mozilla/5.0 (compatible; Bytespider)" ],
    [ "Yahoo Slurp", "Mozilla/5.0 (compatible; Yahoo! Slurp)" ],
    [ "Facebook external hit", "facebookexternalhit/1.1" ],
    [ "Twitterbot", "Twitterbot/1.0" ],
    [ "LinkedInBot", "LinkedInBot/1.0" ],
    [ "Slackbot", "Slackbot-LinkExpanding 1.0" ],
    [ "Discordbot", "Mozilla/5.0 (compatible; Discordbot/2.0)" ],
    [ "TelegramBot", "TelegramBot (like TwitterBot)" ],
    [ "WhatsApp", "WhatsApp/2.23.20" ],
    [ "GPTBot", "Mozilla/5.0; GPTBot/1.0" ],
    [ "ChatGPT-User", "Mozilla/5.0; ChatGPT-User/1.0" ],
    [ "ClaudeBot", "Mozilla/5.0 (compatible; ClaudeBot/1.0)" ],
    [ "CCBot", "CCBot/2.0 (https://commoncrawl.org/faq/)" ],
    [ "PerplexityBot", "Mozilla/5.0 (compatible; PerplexityBot/1.0)" ],
    [ "Amazonbot", "Mozilla/5.0 (compatible; Amazonbot/0.1)" ],
    [ "AhrefsBot", "Mozilla/5.0 (compatible; AhrefsBot/7.0)" ],
    [ "SemrushBot", "Mozilla/5.0 (compatible; SemrushBot/7~bl)" ],
    [ "MJ12bot", "Mozilla/5.0 (compatible; MJ12bot/v1.4.8)" ],
    [ "DotBot", "Mozilla/5.0 (compatible; DotBot/1.2)" ],
  ])("classifies %s as a crawler", (name, userAgent) => {
    expect(detectVisitorType(userAgent)).toBe("crawler");
  });

  it("matches crawler user-agent tokens case-insensitively", () => {
    expect(detectVisitorType("Mozilla/5.0 gOoGlEbOt/2.1")).toBe("crawler");
  });

  it.each([
    "Mozilla/5.0 HeadlessChrome/130.0",
    "Mozilla/5.0 PhantomJS/2.1",
    "Mozilla/5.0 SlimerJS/1.0",
    "Mozilla/5.0 Selenium/4.0",
    "Mozilla/5.0 Puppeteer/23.0",
    "Mozilla/5.0 Playwright/1.48",
  ])("classifies explicit automation user-agent %p", userAgent => {
    expect(detectVisitorType(userAgent)).toBe("automation");
  });

  it("classifies an ordinary browser controlled through WebDriver as automation", () => {
    setNavigatorProperty("userAgent", "Mozilla/5.0 Chrome/130.0 Safari/537.36");
    setNavigatorProperty("webdriver", true);

    expect(detectVisitorType()).toBe("automation");
  });

  it("does not treat a false WebDriver signal as proof of a user", () => {
    setNavigatorProperty("userAgent", "Mozilla/5.0 Chrome/130.0 Safari/537.36");
    setNavigatorProperty("webdriver", false);

    expect(detectVisitorType()).toBe("unknown");
  });

  it("gives crawler signals priority over automation signals", () => {
    setNavigatorProperty("webdriver", true);

    expect(detectVisitorType("Googlebot/2.1 HeadlessChrome/130.0")).toBe(
      "crawler"
    );
  });

  it("tolerates a throwing WebDriver getter", () => {
    Object.defineProperty(navigator, "webdriver", {
      configurable: true,
      get() {
        throw new Error("host failure");
      },
    });

    expect(detectVisitorType("Mozilla/5.0 Chrome/130.0")).toBe("unknown");
  });

  it("does not read WebDriver after identifying a crawler", () => {
    const webdriverGetter = jest.fn(() => {
      throw new Error("host failure");
    });
    Object.defineProperty(navigator, "webdriver", {
      configurable: true,
      get: webdriverGetter,
    });

    expect(detectVisitorType("Googlebot/2.1")).toBe("crawler");
    expect(webdriverGetter).not.toHaveBeenCalled();
  });

  it("tolerates a missing WebDriver signal", () => {
    setNavigatorProperty("webdriver", undefined);

    expect(detectVisitorType("Mozilla/5.0 Chrome/130.0")).toBe("unknown");
  });

  it.each([
    [
      "Chrome on Windows",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "Chrome/130.0 Safari/537.36",
    ],
    [
      "Safari on macOS",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 " +
        "Version/17.6 Safari/605.1.15",
    ],
    [
      "Firefox",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) " +
        "Gecko/20100101 Firefox/131.0",
    ],
    [
      "Mobile Safari",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) " +
        "AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    ],
    [
      "Android Chrome",
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 " +
        "Chrome/130.0 Mobile Safari/537.36",
    ],
    [
      "CUBOT Android device",
      "Mozilla/5.0 (Linux; Android 13; CUBOT P80) AppleWebKit/537.36 " +
        "Chrome/130.0 Mobile Safari/537.36",
    ],
    [ "empty user agent", "" ],
    [ "whitespace-only user agent", "   " ],
    [ "custom client", "ExampleClient/1.0" ],
  ])("returns unknown for %s", (name, userAgent) => {
    setNavigatorProperty("webdriver", false);

    expect(detectVisitorType(userAgent)).toBe("unknown");
  });

  it("tolerates a throwing default user-agent getter", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      get() {
        throw new Error("host failure");
      },
    });
    setNavigatorProperty("webdriver", false);

    expect(detectVisitorType()).toBe("unknown");
  });

  it("tolerates a missing default user-agent property", () => {
    setNavigatorProperty("userAgent", undefined);
    setNavigatorProperty("webdriver", false);

    expect(detectVisitorType()).toBe("unknown");
  });

  it("uses an explicit user agent instead of navigator.userAgent", () => {
    setNavigatorProperty("userAgent", "Googlebot/2.1");
    setNavigatorProperty("webdriver", false);

    expect(detectVisitorType("Mozilla/5.0 Chrome/130.0")).toBe("unknown");
  });

  it("still checks WebDriver when an ordinary user agent is explicit", () => {
    setNavigatorProperty("webdriver", true);

    expect(detectVisitorType("Mozilla/5.0 Chrome/130.0")).toBe("automation");
  });

  it("does not modify an explicitly supplied user-agent string", () => {
    const userAgent = "  Mozilla/5.0 Chrome/130.0  ";

    detectVisitorType(userAgent);

    expect(userAgent).toBe("  Mozilla/5.0 Chrome/130.0  ");
  });

  it.each([ null, 123, true, {}, [] ])(
    "rejects invalid runtime user-agent value %p",
    userAgent => {
      expect(() => detectVisitorType(userAgent)).toThrow(TypeError);
    },
  );

  it("returns only the documented visitor classifications", () => {
    setNavigatorProperty("webdriver", true);
    const results = [
      detectVisitorType("Googlebot/2.1"),
      detectVisitorType("HeadlessChrome/130.0"),
      detectVisitorType("Mozilla/5.0 Chrome/130.0"),
    ];

    results.forEach(result => {
      expect([ "crawler", "automation", "unknown" ]).toContain(result);
      expect([ "user", "human", true, false ]).not.toContain(result);
    });
  });
});

describe("operating-system helpers", () => {
  const originalUserAgent = Object.getOwnPropertyDescriptor(
    navigator,
    "userAgent"
  );
  const originalPlatform = Object.getOwnPropertyDescriptor(
    navigator,
    "platform"
  );
  const originalMaxTouchPoints = Object.getOwnPropertyDescriptor(
    navigator,
    "maxTouchPoints"
  );
  const originalBrowserInfo = window.MAZEY_BROWSER_INFO;

  function restoreNavigatorProperty(property, descriptor) {
    if (descriptor) {
      Object.defineProperty(navigator, property, descriptor);
    } else {
      delete navigator[property];
    }
  }

  function setNavigatorProperty(property, value) {
    Object.defineProperty(navigator, property, {
      configurable: true,
      value,
    });
  }

  afterEach(() => {
    restoreNavigatorProperty("userAgent", originalUserAgent);
    restoreNavigatorProperty("platform", originalPlatform);
    restoreNavigatorProperty("maxTouchPoints", originalMaxTouchPoints);
    window.MAZEY_BROWSER_INFO = originalBrowserInfo;
  });

  it.each([
    [ "iPhone", operatingSystemUserAgents.iphone, "ios" ],
    [ "iPad", operatingSystemUserAgents.ipad, "ios" ],
    [ "iPod", operatingSystemUserAgents.ipod, "ios" ],
    [ "Android phone", operatingSystemUserAgents.androidPhone, "android" ],
    [ "Android tablet", operatingSystemUserAgents.androidTablet, "android" ],
    [ "macOS", operatingSystemUserAgents.macos, "macos" ],
    [ "Windows", operatingSystemUserAgents.windows, "windows" ],
    [ "Linux", operatingSystemUserAgents.linux, "linux" ],
  ])("classifies an explicit %s user agent", (name, userAgent, system) => {
    Object.entries(operatingSystemChecks).forEach(([ candidate, checkSystem ]) => {
      expect(checkSystem(userAgent)).toBe(candidate === system);
    });
  });

  it("matches user agents case-insensitively", () => {
    expect(isIOS(operatingSystemUserAgents.iphone.toUpperCase())).toBe(true);
    expect(isAndroid(operatingSystemUserAgents.androidPhone.toUpperCase())).toBe(
      true
    );
  });

  it.each([
    "",
    "   ",
    "ExampleClient/1.0",
    "ExampleBIOS/1.0",
    "Mozilla/5.0 (X11; FreeBSD amd64)",
    "NotAndroid/1.0",
    "MyiPhoneClient/1.0",
    "Darwin32/1.0",
    "NotMacintosh/1.0",
    "Linuxoid/1.0",
  ])(
    "returns false for unsupported user agent %p",
    (userAgent) => {
      Object.values(operatingSystemChecks).forEach((checkSystem) => {
        expect(checkSystem(userAgent)).toBe(false);
      });
    }
  );

  it("uses an explicit user agent instead of current navigator signals", () => {
    setNavigatorProperty("userAgent", operatingSystemUserAgents.androidPhone);
    setNavigatorProperty("platform", "Linux armv8l");
    setNavigatorProperty("maxTouchPoints", 5);

    expect(isWindows(operatingSystemUserAgents.windows)).toBe(true);
    expect(isAndroid(operatingSystemUserAgents.windows)).toBe(false);
  });

  it("does not mix iPad compatibility signals into explicit analysis", () => {
    setNavigatorProperty("platform", "MacIntel");
    setNavigatorProperty("maxTouchPoints", 5);

    expect(isMacOS(operatingSystemUserAgents.macos)).toBe(true);
    expect(isIOS(operatingSystemUserAgents.macos)).toBe(false);
  });

  it("recognizes iPadOS desktop mode from current navigator signals", () => {
    setNavigatorProperty("userAgent", operatingSystemUserAgents.macos);
    setNavigatorProperty("platform", "MacIntel");
    setNavigatorProperty("maxTouchPoints", 5);

    expect(isIOS()).toBe(true);
    expect(isMacOS()).toBe(false);
  });

  it("keeps an ordinary non-touch Mac classified as macOS", () => {
    setNavigatorProperty("userAgent", operatingSystemUserAgents.macos);
    setNavigatorProperty("platform", "MacIntel");
    setNavigatorProperty("maxTouchPoints", 0);

    expect(isMacOS()).toBe(true);
    expect(isIOS()).toBe(false);
  });

  it("does not read or update the getBrowserInfo cache", () => {
    const cached = { system: "windows" };
    window.MAZEY_BROWSER_INFO = cached;
    setNavigatorProperty("userAgent", operatingSystemUserAgents.androidPhone);

    expect(isAndroid()).toBe(true);
    expect(isWindows()).toBe(false);
    expect(window.MAZEY_BROWSER_INFO).toBe(cached);
  });

  it("returns false when the default user agent is inaccessible", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      get() {
        throw new Error("host failure");
      },
    });

    Object.values(operatingSystemChecks).forEach((checkSystem) => {
      expect(checkSystem()).toBe(false);
    });
  });

  it("continues safely when platform and touch signals are inaccessible", () => {
    setNavigatorProperty("userAgent", operatingSystemUserAgents.macos);
    Object.defineProperty(navigator, "platform", {
      configurable: true,
      get() {
        throw new Error("host failure");
      },
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      get() {
        throw new Error("host failure");
      },
    });

    expect(isMacOS()).toBe(true);
    expect(isIOS()).toBe(false);
  });

  it("reads each default navigator signal only once", () => {
    const userAgentGetter = jest.fn(() => operatingSystemUserAgents.linux);
    const platformGetter = jest.fn(() => "Linux x86_64");
    const maxTouchPointsGetter = jest.fn(() => 0);
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      get: userAgentGetter,
    });
    Object.defineProperty(navigator, "platform", {
      configurable: true,
      get: platformGetter,
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      get: maxTouchPointsGetter,
    });

    expect(isLinux()).toBe(true);
    expect(userAgentGetter).toHaveBeenCalledTimes(1);
    expect(platformGetter).toHaveBeenCalledTimes(1);
    expect(maxTouchPointsGetter).toHaveBeenCalledTimes(1);
  });

  it.each([ null, 123, true, {}, [] ])(
    "rejects invalid runtime user-agent value %p",
    (userAgent) => {
      Object.values(operatingSystemChecks).forEach((checkSystem) => {
        expect(() => checkSystem(userAgent)).toThrow(TypeError);
      });
    }
  );
});

describe("isSafePWAEnv", () => {
  const originalSecureContext = Object.getOwnPropertyDescriptor(window, "isSecureContext");
  const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
  const originalBrowserInfo = Object.getOwnPropertyDescriptor(window, "MAZEY_BROWSER_INFO");
  const originalPromise = Object.getOwnPropertyDescriptor(window, "Promise");
  const originalPath = window.location.pathname;
  const optionalApis = [ "fetch", "indexedDB", "caches" ];
  const originalOptionalApis = optionalApis.map(api => (
    [ api, Object.getOwnPropertyDescriptor(window, api) ]
  ));

  function restoreProperty(target, property, descriptor) {
    if (descriptor) {
      Object.defineProperty(target, property, descriptor);
    } else {
      delete target[property];
    }
  }

  function addManifest(href = "/manifest.webmanifest") {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.setAttribute("href", href);
    document.head.appendChild(manifest);
    return manifest;
  }

  beforeEach(() => {
    window.history.replaceState({}, "", originalPath);
    document.head.innerHTML = "";
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {},
    });
  });

  afterEach(() => {
    window.history.replaceState({}, "", originalPath);
    document.head.innerHTML = "";
    restoreProperty(window, "isSecureContext", originalSecureContext);
    restoreProperty(navigator, "serviceWorker", originalServiceWorker);
    restoreProperty(window, "MAZEY_BROWSER_INFO", originalBrowserInfo);
    restoreProperty(window, "Promise", originalPromise);
    originalOptionalApis.forEach(([ api, descriptor ]) => {
      restoreProperty(window, api, descriptor);
    });
  });

  it("returns true when the minimum detectable prerequisites are met", () => {
    addManifest();

    expect(isSafePWAEnv()).toBe(true);
  });

  it("returns false outside a secure context", () => {
    addManifest();
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });

    expect(isSafePWAEnv()).toBe(false);
  });

  it("returns false without Service Worker API support", () => {
    addManifest();
    delete navigator.serviceWorker;

    expect(isSafePWAEnv()).toBe(false);
  });

  it("returns false without a manifest link", () => {
    expect(isSafePWAEnv()).toBe(false);
  });

  it.each([ undefined, "", "   " ])(
    "returns false when the manifest href is %p",
    href => {
      const manifest = document.createElement("link");
      manifest.rel = "manifest";
      if (href !== undefined) {
        manifest.setAttribute("href", href);
      }
      document.head.appendChild(manifest);

      expect(isSafePWAEnv()).toBe(false);
    },
  );

  it("supports secure localhost contexts served over HTTP", () => {
    addManifest();

    expect(window.location.protocol).toBe("http:");
    expect(isSafePWAEnv()).toBe(true);
  });

  it("does not reject a capable embedded browser shell", () => {
    addManifest();
    window.MAZEY_BROWSER_INFO = { shell: "wechat" };

    expect(isSafePWAEnv()).toBe(true);
  });

  it("does not require Promise, Fetch, IndexedDB, or Cache Storage", () => {
    addManifest();
    window.Promise = function WrappedPromise() {};
    optionalApis.forEach(api => {
      delete window[api];
    });

    expect(isSafePWAEnv()).toBe(true);
  });

  it("re-evaluates the document when a manifest is added", () => {
    expect(isSafePWAEnv()).toBe(false);

    addManifest();

    expect(isSafePWAEnv()).toBe(true);
  });

  it("can make the manifest optional", () => {
    expect(isSafePWAEnv({ requireManifest: false })).toBe(true);
  });

  it("accepts pages within a normalized same-origin scope", () => {
    addManifest();
    window.history.replaceState({}, "", "/mazey/%E2%9C%93/playground/");

    expect(isSafePWAEnv({ scope: "/mazey/" })).toBe(true);
    expect(isSafePWAEnv({ scope: "/mazey/%E2%9C%93/" })).toBe(true);
    expect(isSafePWAEnv({ scope: "/other/" })).toBe(false);
  });

  it("matches an exact scope without matching sibling path prefixes", () => {
    addManifest();
    window.history.replaceState({}, "", "/mazey");
    expect(isSafePWAEnv({ scope: "/mazey" })).toBe(true);

    window.history.replaceState({}, "", "/mazey-tools/");
    expect(isSafePWAEnv({ scope: "/mazey" })).toBe(false);
  });

  it.each([
    "",
    "https://example.com/mazey/",
    "/mazey/?",
    "/mazey/?preview=true",
    "/mazey/#",
    "/mazey/#preview",
  ])("rejects invalid or nonmatching scope %p", scope => {
    addManifest();
    window.history.replaceState({}, "", "/mazey/playground/");

    expect(isSafePWAEnv({ scope })).toBe(false);
  });

  it("returns false for malformed runtime options", () => {
    expect(isSafePWAEnv(null)).toBe(false);
    expect(isSafePWAEnv([])).toBe(false);
    expect(isSafePWAEnv({ requireManifest: "yes" })).toBe(false);
    expect(isSafePWAEnv({ scope: 123 })).toBe(false);
  });

  it("returns false when reading runtime options throws", () => {
    const options = Object.defineProperty({}, "scope", {
      get() {
        throw new Error("host failure");
      },
    });

    expect(isSafePWAEnv(options)).toBe(false);
  });

  it("reads each runtime option once", () => {
    addManifest();
    window.history.replaceState({}, "", "/mazey/playground/");
    const scopeGetter = jest.fn().mockReturnValue("/mazey/");
    const manifestGetter = jest.fn().mockReturnValue(true);
    const options = Object.defineProperties({}, {
      scope: { get: scopeGetter },
      requireManifest: { get: manifestGetter },
    });

    expect(isSafePWAEnv(options)).toBe(true);
    expect(scopeGetter).toHaveBeenCalledTimes(1);
    expect(manifestGetter).toHaveBeenCalledTimes(1);
  });

  function createInjectedEnvironment({
    secure = true,
    serviceWorker = {},
    manifest = true,
    url = "https://example.com/mazey/",
  } = {}) {
    const documentRef = document.implementation.createHTMLDocument("PWA test");
    if (manifest) {
      const manifestLink = documentRef.createElement("link");
      manifestLink.rel = "manifest";
      manifestLink.href = "/manifest.webmanifest";
      documentRef.head.appendChild(manifestLink);
    }
    const navigatorRef = {};
    if (serviceWorker !== undefined) {
      navigatorRef.serviceWorker = serviceWorker;
    }
    return {
      window: {
        isSecureContext: secure,
        location: new URL(url),
        matchMedia: jest.fn().mockReturnValue({ matches: false }),
      },
      navigator: navigatorRef,
      document: documentRef,
    };
  }

  it("checks injected PWA capabilities without reading conflicting globals", () => {
    addManifest();
    const environment = createInjectedEnvironment({ secure: false });

    expect(isSafePWAEnv({ environment })).toBe(false);

    environment.window.isSecureContext = true;
    delete environment.navigator.serviceWorker;
    expect(isSafePWAEnv({ environment })).toBe(false);
  });

  it("rejects an injected null Service Worker capability", () => {
    const environment = createInjectedEnvironment({ serviceWorker: null });

    expect(isSafePWAEnv({ environment })).toBe(false);
  });

  it("uses a valid injected environment when globals are incompatible", () => {
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: false,
    });
    delete navigator.serviceWorker;
    const environment = createInjectedEnvironment();

    expect(isSafePWAEnv({ environment })).toBe(true);
  });

  it("supports optional manifests and requires injected documents by default", () => {
    const environment = createInjectedEnvironment({ manifest: false });

    expect(isSafePWAEnv({ environment })).toBe(false);
    expect(isSafePWAEnv({ environment, requireManifest: false })).toBe(true);

    delete environment.document;
    expect(isSafePWAEnv({ environment })).toBe(false);
    expect(isSafePWAEnv({ environment, requireManifest: false })).toBe(true);
  });

  it.each([
    [ "/mazey/", true ],
    [ "/mazey/playground/", true ],
    [ "/other/", false ],
    [ "https://other.example/mazey/", false ],
  ])("checks injected page URL against scope %p", (scope, expected) => {
    const environment = createInjectedEnvironment({
      url: "https://example.com/mazey/playground/",
    });

    expect(isSafePWAEnv({ environment, scope })).toBe(expected);
  });

  it("does not fall back to a global document for an injected environment", () => {
    addManifest();
    const environment = createInjectedEnvironment();
    delete environment.document;

    expect(isSafePWAEnv({ environment })).toBe(false);
  });
});

describe("isStandalonePWA", () => {
  const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
  const originalStandalone = Object.getOwnPropertyDescriptor(navigator, "standalone");

  function restoreProperty(target, property, descriptor) {
    if (descriptor) {
      Object.defineProperty(target, property, descriptor);
    } else {
      delete target[property];
    }
  }

  afterEach(() => {
    restoreProperty(window, "matchMedia", originalMatchMedia);
    restoreProperty(navigator, "standalone", originalStandalone);
  });

  it("detects the standard standalone display mode", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });

    expect(isStandalonePWA()).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith("(display-mode: standalone)");
  });

  it("uses the iOS standalone fallback when the media query does not match", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      value: true,
    });

    expect(isStandalonePWA()).toBe(true);
  });

  it("uses the iOS fallback when matchMedia is missing or throws", () => {
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      value: true,
    });
    delete window.matchMedia;
    expect(isStandalonePWA()).toBe(true);

    window.matchMedia = jest.fn(() => {
      throw new Error("host failure");
    });
    expect(isStandalonePWA()).toBe(true);
  });

  it("returns false in an ordinary browser tab and is repeatable", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });

    expect(isStandalonePWA()).toBe(false);
    expect(isStandalonePWA()).toBe(false);
  });

  it("returns false when browser host properties throw", () => {
    window.matchMedia = jest.fn(() => {
      throw new Error("host failure");
    });
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      get() {
        throw new Error("host failure");
      },
    });

    expect(isStandalonePWA()).toBe(false);
  });

  it("reads the iOS fallback only once when it throws", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
    const standaloneGetter = jest.fn(() => {
      throw new Error("host failure");
    });
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      get: standaloneGetter,
    });

    expect(isStandalonePWA()).toBe(false);
    expect(standaloneGetter).toHaveBeenCalledTimes(1);
  });

  it("reads matchMedia only once and preserves its receiver", () => {
    const matchMedia = jest.fn(function () {
      return { matches: this === window };
    });
    const matchMediaGetter = jest.fn(() => matchMedia);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      get: matchMediaGetter,
    });

    expect(isStandalonePWA()).toBe(true);
    expect(matchMediaGetter).toHaveBeenCalledTimes(1);
    expect(matchMedia).toHaveBeenCalledWith("(display-mode: standalone)");
  });

  it("detects standalone mode from an injected environment", () => {
    const windowRef = {
      isSecureContext: true,
      location: new URL("https://example.com/"),
      matchMedia: jest.fn(function () {
        return { matches: this === windowRef };
      }),
    };

    expect(
      isStandalonePWA({
        environment: { window: windowRef, navigator: {} },
      })
    ).toBe(true);
    expect(windowRef.matchMedia).toHaveBeenCalledWith(
      "(display-mode: standalone)"
    );
  });

  it("uses the injected iOS standalone signal", () => {
    const environment = {
      window: {
        isSecureContext: true,
        location: new URL("https://example.com/"),
        matchMedia: jest.fn().mockReturnValue({ matches: false }),
      },
      navigator: { standalone: true },
    };

    expect(isStandalonePWA({ environment })).toBe(true);
  });

  it("returns false for an injected ordinary tab", () => {
    const environment = {
      window: {
        isSecureContext: true,
        location: new URL("https://example.com/"),
        matchMedia: jest.fn().mockReturnValue({ matches: false }),
      },
      navigator: { standalone: false },
    };

    expect(isStandalonePWA({ environment })).toBe(false);
  });

  it("uses only injected values when globals report standalone mode", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      value: true,
    });
    const environment = {
      window: {
        isSecureContext: true,
        location: new URL("https://example.com/"),
        matchMedia: jest.fn().mockReturnValue({ matches: false }),
      },
      navigator: { standalone: false },
    };

    expect(isStandalonePWA({ environment })).toBe(false);
  });

  it("falls back to injected iOS state when injected matchMedia throws", () => {
    const environment = {
      window: {
        isSecureContext: true,
        location: new URL("https://example.com/"),
        matchMedia: jest.fn(() => {
          throw new Error("host failure");
        }),
      },
      navigator: { standalone: true },
    };

    expect(isStandalonePWA({ environment })).toBe(true);
  });
});

describe("getBrowserInfo", () => {
  it("should return the correct browser information", () => {
    const browserInfo = getBrowserInfo();

    // Test the system information
    expect(browserInfo.system).toBeDefined();
    expect(browserInfo.systemVs).toBeDefined();

    // Test the platform information
    expect(browserInfo.platform).toBeDefined();

    // Test the engine and supporter information
    expect(browserInfo.engine).toBeDefined();
    expect(browserInfo.engineVs).toBeDefined();
    expect(browserInfo.supporter).toBeDefined();
    expect(browserInfo.supporterVs).toBeDefined();

    // Test the shell information
    expect(browserInfo.shell).toBeDefined();
    expect(browserInfo.shellVs).toBeDefined();

    // Test Color Scheme
    expect(browserInfo.colorScheme).toBeDefined();
  });

  it("classifies Chromium-based Edge as Edge instead of Chrome", () => {
    const originalUserAgent = Object.getOwnPropertyDescriptor(navigator, "userAgent");
    const originalBrowserInfo = window.MAZEY_BROWSER_INFO;
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.102",
    });
    window.MAZEY_BROWSER_INFO = undefined;

    try {
      const browserInfo = getBrowserInfo();

      expect(browserInfo.supporter).toBe("edge");
      expect(browserInfo.supporterVs).toBe("126.0.2592.102");
    } finally {
      if (originalUserAgent) {
        Object.defineProperty(navigator, "userAgent", originalUserAgent);
      }
      window.MAZEY_BROWSER_INFO = originalBrowserInfo;
    }
  });

  it("uses shared iPadOS detection and preserves the cached result", () => {
    const originalUserAgent = Object.getOwnPropertyDescriptor(
      navigator,
      "userAgent"
    );
    const originalPlatform = Object.getOwnPropertyDescriptor(
      navigator,
      "platform"
    );
    const originalMaxTouchPoints = Object.getOwnPropertyDescriptor(
      navigator,
      "maxTouchPoints"
    );
    const originalBrowserInfo = window.MAZEY_BROWSER_INFO;

    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: operatingSystemUserAgents.macos,
    });
    Object.defineProperty(navigator, "platform", {
      configurable: true,
      value: "MacIntel",
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: 5,
    });
    window.MAZEY_BROWSER_INFO = undefined;

    try {
      const browserInfo = getBrowserInfo();
      expect(browserInfo).toMatchObject({
        system: "ios",
        platform: "mobile",
        appleType: "ipad",
      });

      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value: operatingSystemUserAgents.windows,
      });
      expect(getBrowserInfo()).toBe(browserInfo);
      expect(getBrowserInfo().system).toBe("ios");
    } finally {
      if (originalUserAgent) {
        Object.defineProperty(navigator, "userAgent", originalUserAgent);
      } else {
        delete navigator.userAgent;
      }
      if (originalPlatform) {
        Object.defineProperty(navigator, "platform", originalPlatform);
      } else {
        delete navigator.platform;
      }
      if (originalMaxTouchPoints) {
        Object.defineProperty(
          navigator,
          "maxTouchPoints",
          originalMaxTouchPoints
        );
      } else {
        delete navigator.maxTouchPoints;
      }
      window.MAZEY_BROWSER_INFO = originalBrowserInfo;
    }
  });
});

describe("isSupportWebp", () => {
  it("should return true if webp is supported", async () => {
    // Mock the Image class
    class MockImage {
      width = 100;
      height = 100;
      onload = () => {};
      onerror = () => {};
      src = "";

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 100);
      }
    }

    // Replace the global Image with the MockImage
    const originalImage = global.Image;
    global.Image = MockImage;

    const result = await isSupportWebp();

    // Restore the original Image
    global.Image = originalImage;

    expect(result).toBe(true);
  });

  it("should return true because of the cache", async () => {
    // Mock the Image class
    class MockImage {
      width = 0;
      height = 0;
      onload = () => {};
      onerror = () => {};
      src = "";

      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror();
          }
        }, 200);
      }
    }

    // Replace the global Image with the MockImage
    const originalImage = global.Image;
    global.Image = MockImage;

    const result = await isSupportWebp();

    // Restore the original Image
    global.Image = originalImage;

    expect(result).toBe(true);
  });
});

describe("genBrowserAttrs", () => {
  test("returns an array of browser attributes without a prefix", () => {
    const attrs = genBrowserAttrs();
    expect(attrs.includes("webkit")).toEqual(true); // ).toEqual([ "webkit" ]);
  });

  test("returns an array of browser attributes with a prefix", () => {
    const attrs = genBrowserAttrs("m");
    expect(attrs.includes("m-webkit")).toEqual(true); // .toEqual([ "m-webkit" ]);
  });
});

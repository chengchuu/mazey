import { mazeyCon } from "./debug";
import type {
  BrowserInfo, MazeyObject, TestUa, TestVs,
} from "./typing";
import { isNonEmptyArray } from "./util";

/**
 * Conservative visitor classifications detected from supported browser-side
 * signals.
 *
 * - `"crawler"`: a known crawler or automated-fetcher user-agent token matched.
 * - `"automation"`: an explicit automation user-agent token matched or
 *   `navigator.webdriver` is `true`.
 * - `"unknown"`: no supported crawler or automation signal was detected.
 *
 * `"unknown"` does not mean that the visitor is verified as human.
 *
 * @remarks This heuristic result is not suitable for authentication,
 * authorization, fraud prevention, access control, or other security decisions.
 * @category Browser Information
 */
export type VisitorType = "crawler" | "automation" | "unknown";

const knownCrawlerUserAgentTokens = Object.freeze([
  "adsbot-google",
  "ahrefsbot",
  "amazonbot",
  "applebot",
  "baiduspider",
  "bingbot",
  "bingpreview",
  "bytespider",
  "ccbot",
  "chatgpt-user",
  "claudebot",
  "discordbot",
  "dotbot",
  "duckduckbot",
  "facebookexternalhit",
  "facebot",
  "google-inspectiontool",
  "googlebot",
  "googleother",
  "gptbot",
  "linkedinbot",
  "mediapartners-google",
  "mj12bot",
  "perplexitybot",
  "petalbot",
  "semrushbot",
  "slackbot",
  "slurp",
  "storebot-google",
  "telegrambot",
  "twitterbot",
  "whatsapp",
  "yandexbot",
] as const);

const knownAutomationUserAgentTokens = Object.freeze([
  "headlesschrome",
  "phantomjs",
  "slimerjs",
  "selenium",
  "puppeteer",
  "playwright",
] as const);

function getBrowserNavigator(): Navigator | null {
  try {
    return typeof navigator === "undefined" ? null : navigator;
  } catch (e) {
    return null;
  }
}

function getDefaultUserAgent(): string {
  const browserNavigator = getBrowserNavigator();
  if (!browserNavigator) {
    return "";
  }

  try {
    const userAgent = browserNavigator.userAgent;
    return typeof userAgent === "string" ? userAgent : "";
  } catch (e) {
    return "";
  }
}

function hasKnownUserAgentToken(
  userAgent: string,
  tokens: readonly string[]
): boolean {
  const normalizedUserAgent = userAgent.trim().toLowerCase();
  return tokens.some(token => normalizedUserAgent.includes(token));
}

function isBrowserAutomated(): boolean {
  const browserNavigator = getBrowserNavigator();
  if (!browserNavigator) {
    return false;
  }

  try {
    return browserNavigator.webdriver === true;
  } catch (e) {
    return false;
  }
}

/**
 * Classify a visitor using conservative browser-side heuristics.
 *
 * Classification checks known crawler and automated-fetcher user-agent tokens
 * first. It then checks explicit browser-automation user-agent tokens and
 * `navigator.webdriver === true`. All other visitors return `"unknown"`.
 *
 * `"unknown"` means that no supported signal was detected. It does not verify
 * that the visitor is human. User-agent values can be modified or spoofed, and
 * automation signals can be hidden, modified, or unavailable. Both false
 * positives and false negatives are possible.
 *
 * Usage:
 *
 * ```typescript
 * import { detectVisitorType } from "mazey";
 *
 * const visitorType = detectVisitorType();
 * console.log(visitorType);
 * ```
 *
 * Possible output:
 *
 * ```text
 * unknown
 * ```
 *
 * Explicit user-agent:
 *
 * ```typescript
 * const visitorType = detectVisitorType(
 *   "Mozilla/5.0 (compatible; Googlebot/2.1)"
 * );
 *
 * console.log(visitorType);
 * ```
 *
 * Output:
 *
 * ```text
 * crawler
 * ```
 *
 * @param userAgent Optional user-agent string. Defaults to
 * `navigator.userAgent` when available. An explicit value replaces only the
 * user-agent source; the current browser's WebDriver signal is still checked.
 * @returns `"crawler"`, `"automation"`, or `"unknown"`, in that priority.
 * @throws {TypeError} If an explicitly supplied user agent is not a string.
 * @remarks Safe during SSR and in Node.js. This is a heuristic classification
 * utility, not human verification, crawler authentication, or a security
 * boundary. Do not use it by itself for authentication, authorization,
 * payments, rate limiting, fraud prevention, access control, or
 * security-sensitive content. Genuine crawler verification generally requires
 * server-side request information and provider-specific validation.
 * @category Browser Information
 */
export function detectVisitorType(userAgent?: string): VisitorType {
  if (userAgent !== undefined && typeof userAgent !== "string") {
    throw new TypeError("userAgent must be a string when provided.");
  }

  const resolvedUserAgent =
    userAgent === undefined ? getDefaultUserAgent() : userAgent;

  if (
    hasKnownUserAgentToken(
      resolvedUserAgent,
      knownCrawlerUserAgentTokens
    )
  ) {
    return "crawler";
  }

  if (
    hasKnownUserAgentToken(
      resolvedUserAgent,
      knownAutomationUserAgentTokens
    ) ||
    isBrowserAutomated()
  ) {
    return "automation";
  }

  return "unknown";
}

/**
 * Options for {@link isSafePWAEnv}.
 *
 * @category Browser Information
 */
export interface IsSafePWAEnvOptions {
  /** Require a non-empty web app manifest link. Defaults to `true`. */
  requireManifest?: boolean;
  /**
   * Require the current page path to be within this same-origin URL scope.
   * Comparison uses serialized WHATWG URL paths; encoded separators remain encoded.
   */
  scope?: string;
}

function isCurrentPageWithinScope(scope: string): boolean {
  const normalizedScope = scope.trim();
  if (!normalizedScope || /[?#]/.test(normalizedScope)) {
    return false;
  }

  try {
    const currentUrl = new URL(window.location.href);
    const scopeUrl = new URL(normalizedScope, currentUrl);
    if (
      scopeUrl.origin !== currentUrl.origin ||
      scopeUrl.search !== "" ||
      scopeUrl.hash !== ""
    ) {
      return false;
    }

    if (currentUrl.pathname === scopeUrl.pathname) {
      return true;
    }

    const nestedScopePath = scopeUrl.pathname.endsWith("/")
      ? scopeUrl.pathname
      : `${scopeUrl.pathname}/`;
    return currentUrl.pathname.startsWith(nestedScopePath);
  } catch (e) {
    return false;
  }
}

/**
 * Detect whether the current browser document provides the minimum
 * JavaScript-detectable prerequisites for PWA functionality.
 *
 * This function checks for a secure context, Service Worker API support,
 * and, by default, a web app manifest link with a non-empty `href`. Options
 * can make the manifest optional or require the current path to be within a
 * same-origin scope.
 *
 * It does not validate or request the manifest, verify service worker
 * registration, determine whether the app is installed, or guarantee that an
 * installation prompt is available. Browser-specific installation policies
 * may impose additional requirements.
 *
 * Usage:
 *
 * ```javascript
 * import { isSafePWAEnv } from "mazey";
 *
 * const ret = isSafePWAEnv();
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * true
 * ```
 *
 * @remarks Browser-preferred and safe to call during SSR.
 * @param options Optional manifest and URL-scope requirements.
 * @returns Whether the detectable minimum PWA prerequisites are satisfied.
 * @category Browser Information
 */
export function isSafePWAEnv(options: IsSafePWAEnvOptions = {}): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  try {
    if (options === null || typeof options !== "object" || Array.isArray(options)) {
      return false;
    }

    const requireManifest = options.requireManifest;
    const scope = options.scope;
    if (
      (requireManifest !== undefined && typeof requireManifest !== "boolean") ||
      (scope !== undefined && typeof scope !== "string")
    ) {
      return false;
    }

    if (window.isSecureContext !== true || !("serviceWorker" in navigator)) {
      return false;
    }

    if (scope !== undefined && !isCurrentPageWithinScope(scope)) {
      return false;
    }

    if (requireManifest === false) {
      return true;
    }

    if (typeof document === "undefined") {
      return false;
    }

    const manifest = document.querySelector<HTMLLinkElement>("link[rel~=\"manifest\"][href]");
    return Boolean(manifest?.getAttribute("href")?.trim());
  } catch (e) {
    return false;
  }
}

/**
 * Detect whether the current page is displayed as a standalone PWA.
 *
 * Checks the standard `display-mode: standalone` media query and the iOS Safari
 * `navigator.standalone` compatibility signal. This does not prove that the app
 * is installed, trusted, or controlled by a service worker.
 *
 * @remarks Browser-preferred and safe to call during SSR.
 * @returns `true` in detected standalone presentation; otherwise `false`.
 * @category Browser Information
 */
export function isStandalonePWA(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const appleNavigator = navigator as Navigator & { standalone?: boolean };
  try {
    const matchMedia = window.matchMedia;
    if (
      typeof matchMedia === "function" &&
      matchMedia.call(window, "(display-mode: standalone)").matches
    ) {
      return true;
    }
  } catch (e) {
    // Fall through to the iOS compatibility signal.
  }

  try {
    return appleNavigator.standalone === true;
  } catch (e) {
    return false;
  }
}

/**
 * Return detailed information about the current browser.
 *
 * Usage:
 *
 * ```javascript
 * import { getBrowserInfo } from "mazey";
 *
 * const ret = getBrowserInfo();
 * console.log(ret);
 * ```
 *
 * Output:
 *
 * ```text
 * {"engine":"webkit","engineVs":"537.36","platform":"desktop","supporter":"chrome","supporterVs":"85.0.4183.121","system":"windows","systemVs":"10"}
 * ```
 *
 * Results:
 *
 * | Attribute | Description | Type | Values |
 * | :------------ | :------------ | :------------ | :------------ |
 * | **system** | System | string | android, ios, windows, macos, linux |
 * | systemVs | System version | string | Windows: 2000, xp, 2003, vista, 7, 8, 8.1, 10 macOS: ... |
 * | platform | Platform | string | desktop, mobile |
 * | engine | Engine | string | webkit, gecko, presto, trident |
 * | engineVs | Engine version | string | - |
 * | supporter | Supporter | string | edge, opera, chrome, safari, firefox, iexplore |
 * | supporterVs | Supporter version | string | - |
 * | shell | Shell | string | (Optional) wechat, qq_browser, qq_app, uc, 360, 2345, sougou, liebao, maxthon, bilibili |
 * | shellVs | Shell version | string | (Optional) 20/... |
 * | appleType | Apple device type | string | (Optional) ipad, iphone, ipod, iwatch |
 *
 * Example: Determine the environment of the mobile QQ.
 *
 * ```javascript
 * const { system, shell } = getBrowserInfo();
 * const isMobileQQ = ["android", "ios"].includes(system) && ["qq_browser", "qq_app"].includes(shell);
 * ```
 *
 * @remarks Browser only.
 * @returns Browser information
 * @category Browser Information
 */
export function getBrowserInfo(): BrowserInfo {
  // Cache
  if (window.MAZEY_BROWSER_INFO && typeof window.MAZEY_BROWSER_INFO === "object") {
    return window.MAZEY_BROWSER_INFO;
  }
  let browserInfo: BrowserInfo = {
    engine: "", // webkit gecko presto trident
    engineVs: "",
    platform: "", // desktop mobile
    supporter: "", // chrome safari firefox opera iexplore edge
    supporterVs: "",
    system: "", // windows macos linux android ios
    systemVs: "",
    shell: "",
    shellVs: "",
    appleType: "",
    colorScheme: "",
  };
  try {
    // Priority: system + system version > platform > engine + carrier + engine version + carrier version > shell + shell version
    const ua: string = navigator.userAgent.toLowerCase();
    if (!ua) {
      return browserInfo;
    }
    const testUa: TestUa = regexp => regexp.test(ua);
    const testVs: TestVs = regexp => {
      let ret = "";
      const matchRes = ua.match(regexp); // ["os 13_2_3"]
      // Confirm the Safety of the match result
      if (matchRes && isNonEmptyArray(matchRes)) {
        ret = matchRes.toString();
        ret = ret.replace(/[^0-9|_.]/g, ""); // 1323
        ret = ret.replace(/_/g, "."); // 13.2.3
      }
      return ret;
    };
    // System
    let system = "";
    // Apple Device Type
    let appleType = "";
    if (testUa(/windows|win32|win64|wow32|wow64/g)) {
      system = "windows"; // Windows system
    } else if (testUa(/macintosh|macintel/g)) {
      system = "macos"; // macOS system
    } else if (testUa(/x11/g)) {
      system = "linux"; // Linux system
    } else if (testUa(/android|adr/g)) {
      system = "android"; // Android system
    } else if (testUa(/ios|iphone|ipad|ipod|iwatch/g)) {
      system = "ios"; // iOS system
      if (testUa(/ipad/g)) {
        appleType = "ipad";
      } else if (testUa(/iphone/g)) {
        appleType = "iphone";
      } else if (testUa(/iwatch/g)) {
        appleType = "iwatch";
      } else if (testUa(/ipod/g)) {
        appleType = "ipod";
      }
    }
    browserInfo = {
      ...browserInfo,
      system,
      appleType,
    };
    // System Version
    let systemVs = "";
    if (system === "windows") {
      if (testUa(/windows nt 5.0|windows 2000/g)) {
        systemVs = "2000";
      } else if (testUa(/windows nt 5.1|windows xp/g)) {
        systemVs = "xp";
      } else if (testUa(/windows nt 5.2|windows 2003/g)) {
        systemVs = "2003";
      } else if (testUa(/windows nt 6.0|windows vista/g)) {
        systemVs = "vista";
      } else if (testUa(/windows nt 6.1|windows 7/g)) {
        systemVs = "7";
      } else if (testUa(/windows nt 6.2|windows 8/g)) {
        systemVs = "8";
      } else if (testUa(/windows nt 6.3|windows 8.1/g)) {
        systemVs = "8.1";
      } else if (testUa(/windows nt 10.0|windows 10/g)) {
        systemVs = "10";
      }
    } else if (system === "macos") {
      systemVs = testVs(/os x [\d._]+/g);
    } else if (system === "android") {
      systemVs = testVs(/android [\d._]+/g); // 8.0
    } else if (system === "ios") {
      systemVs = testVs(/os [\d._]+/g); // 13.2.3 13.3
    }
    browserInfo = {
      ...browserInfo,
      systemVs,
    };
    // Platform
    let platform = "";
    if (system === "windows" || system === "macos" || system === "linux") {
      platform = "desktop"; // Desktop
    } else if (system === "android" || system === "ios" || testUa(/mobile/g)) {
      platform = "mobile"; // Mobile
    }
    browserInfo = {
      ...browserInfo,
      platform,
    };
    // Engine and Shell
    let engine = "";
    let supporter = "";
    if (testUa(/applewebkit/g)) {
      engine = "webkit"; // webkit engine
      if (testUa(/edg(?:a|ios)?\//g) || testUa(/edge\//g)) {
        supporter = "edge"; // Edge browser
      } else if (testUa(/opr/g)) {
        supporter = "opera"; // Opera browser
      } else if (testUa(/chrome/g)) {
        supporter = "chrome"; // Chrome browser
      } else if (testUa(/safari/g)) {
        supporter = "safari"; // Safari browser
      }
    } else if (testUa(/gecko/g) && testUa(/firefox/g)) {
      engine = "gecko"; // gecko engine
      supporter = "firefox"; // Firefox browser
    } else if (testUa(/presto/g)) {
      engine = "presto"; // presto engine
      supporter = "opera"; // Opera browser
    } else if (testUa(/trident|compatible|msie/g)) {
      engine = "trident"; // trident engine
      supporter = "iexplore"; // Internet Explorer browser
    }
    browserInfo = {
      ...browserInfo,
      engine,
      supporter,
    };
    // Engine Version
    let engineVs = "";
    if (engine === "webkit") {
      engineVs = testVs(/applewebkit\/[\d._]+/g);
    } else if (engine === "gecko") {
      engineVs = testVs(/gecko\/[\d._]+/g);
    } else if (engine === "presto") {
      engineVs = testVs(/presto\/[\d._]+/g);
    } else if (engine === "trident") {
      engineVs = testVs(/trident\/[\d._]+/g);
    }
    browserInfo = {
      ...browserInfo,
      engineVs,
    };
    // Supporter Version
    let supporterVs = "";
    if (supporter === "chrome") {
      supporterVs = testVs(/chrome\/[\d._]+/g);
    } else if (supporter === "safari") {
      supporterVs = testVs(/version\/[\d._]+/g);
    } else if (supporter === "firefox") {
      supporterVs = testVs(/firefox\/[\d._]+/g);
    } else if (supporter === "opera") {
      supporterVs = testVs(/opr\/[\d._]+/g);
    } else if (supporter === "iexplore") {
      supporterVs = testVs(/(msie [\d._]+)|(rv:[\d._]+)/g);
    } else if (supporter === "edge") {
      supporterVs = testVs(/(?:edge|edg|edga|edgios)\/[\d._]+/g);
    }
    browserInfo = {
      ...browserInfo,
      supporterVs,
    };
    // Shell Name and Shell Version
    let shell = "";
    let shellVs = "";
    if (testUa(/micromessenger/g)) {
      shell = "wechat"; // WeChat browser
      shellVs = testVs(/micromessenger\/[\d._]+/g);
    } else if (testUa(/qqbrowser/g)) {
      shell = "qq_browser"; // QQ Browser
      shellVs = testVs(/qqbrowser\/[\d._]+/g);
    } else if (testUa(/\sqq/g)) {
      shell = "qq_app"; // QQ APP
    } else if (testUa(/ucbrowser/g)) {
      shell = "uc"; // UC Browser
      shellVs = testVs(/ucbrowser\/[\d._]+/g);
    } else if (testUa(/qihu 360se/g)) {
      shell = "360"; // 360 Browser (no version)
    } else if (testUa(/2345explorer/g)) {
      shell = "2345"; // 2345 Browser
      shellVs = testVs(/2345explorer\/[\d._]+/g);
    } else if (testUa(/metasr/g)) {
      shell = "sougou"; // Sogou Browser (no version)
    } else if (testUa(/lbbrowser/g)) {
      shell = "liebao"; // Liebao Browser (no version)
    } else if (testUa(/maxthon/g)) {
      shell = "maxthon"; // Maxthon Browser
      shellVs = testVs(/maxthon\/[\d._]+/g);
    } else if (testUa(/biliapp/g)) {
      shell = "bilibili"; // Bilibili
    }
    browserInfo = {
      ...browserInfo,
      shell,
      shellVs,
    };
    // Add colorScheme based on prefers-color-scheme media query
    let colorScheme = "";
    if (window.matchMedia) {
      const mqDarkRes = window.matchMedia("(prefers-color-scheme: dark)");
      const mqLightRes = window.matchMedia("(prefers-color-scheme: light)");
      if (mqDarkRes.matches) {
        colorScheme = "dark";
      } else if (mqLightRes.matches) {
        colorScheme = "light";
      }
    }
    browserInfo = {
      ...browserInfo,
      colorScheme,
    };
    window.MAZEY_BROWSER_INFO = browserInfo;
    return browserInfo;
  } catch (err) {
    mazeyCon.warn(err);
    return browserInfo;
  }
}

/**
 * Generate browser attributes from the detected browser information.
 *
 * Usage:
 *
 * ```javascript
 * import { genBrowserAttrs } from "mazey";
 *
 * const attrs = genBrowserAttrs();
 * console.log(attrs);
 * ```
 *
 * Output:
 *
 * ```text
 * ["windows", "desktop", "webkit", "chrome"]
 * ```
 *
 * @remarks Browser only.
 * @param {string} prefix
 * @returns {array} Browser attributes
 * @category Browser Information
 */
export function genBrowserAttrs(prefix = "", separator = "-"): string[] {
  const keys = [ "system", "platform", "engine", "supporter", "shell", "appleType" ];
  const info = getBrowserInfo() as MazeyObject;
  const attrs: string[] = [];
  keys.forEach((key: string) => {
    const val = info[key];
    if (val) {
      let rPre = "";
      if (prefix && prefix.length > 0) {
        rPre = `${prefix}${separator}`;
      }
      attrs.push(`${rPre}${val}`);
    }
  });
  return attrs;
}

let webpSupport = "";

/**
 * Detect webp support.
 *
 * Usage:
 *
 * ```javascript
 * import { isSupportWebp } from "mazey";
 *
 * isSupportWebp().then(res => {
 *  console.log("isSupportWebp:", res);
 * });
 * ```
 *
 * Output:
 *
 * ```text
 * isSupportWebp: true
 * ```
 *
 * Reference: [Detect WEBP Support with JavaScript](https://davidwalsh.name/detect-webp)
 *
 * @category Browser Information
 */
export function isSupportWebp(): Promise<boolean> {
  if (webpSupport) {
    return Promise.resolve(webpSupport === "webp");
  }
  const fn = (resolve: (v: boolean) => void) => {
    const img = new Image();
    img.onload = () => {
      const ret = img.width > 0 && img.height > 0;
      webpSupport = ret ? "webp" : "no-webp";
      resolve(ret);
    };
    img.onerror = () => {
      webpSupport = "no-webp";
      resolve(false);
    };
    img.src = "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=";
  };
  return new Promise(fn);
}

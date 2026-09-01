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

type DetectedOperatingSystem =
  | "android"
  | "ios"
  | "windows"
  | "macos"
  | "linux"
  | "";

type DetectedDeviceType = "desktop" | "mobile" | "tablet" | "";

interface OperatingSystemSignals {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

function isIPadOSDesktopMode(
  signals: OperatingSystemSignals,
  normalizedUserAgent = signals.userAgent.trim().toLowerCase()
): boolean {
  return (
    /\bmacintosh\b/.test(normalizedUserAgent) &&
    signals.platform.toLowerCase() === "macintel" &&
    signals.maxTouchPoints > 1
  );
}

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

function getDefaultOperatingSystemSignals(): OperatingSystemSignals {
  const browserNavigator = getBrowserNavigator();
  if (!browserNavigator) {
    return { userAgent: "", platform: "", maxTouchPoints: 0 };
  }

  let userAgent = "";
  let platform = "";
  let maxTouchPoints = 0;
  try {
    const currentUserAgent = browserNavigator.userAgent;
    userAgent = typeof currentUserAgent === "string" ? currentUserAgent : "";
  } catch (e) {
    return { userAgent: "", platform: "", maxTouchPoints: 0 };
  }
  try {
    const currentPlatform = browserNavigator.platform;
    platform = typeof currentPlatform === "string" ? currentPlatform : "";
  } catch (e) {
    platform = "";
  }
  try {
    const currentMaxTouchPoints = browserNavigator.maxTouchPoints;
    maxTouchPoints = Number.isFinite(currentMaxTouchPoints)
      ? currentMaxTouchPoints
      : 0;
  } catch (e) {
    maxTouchPoints = 0;
  }

  return { userAgent, platform, maxTouchPoints };
}

function detectOperatingSystem(
  signals: OperatingSystemSignals
): DetectedOperatingSystem {
  const userAgent = signals.userAgent.trim().toLowerCase();
  if (!userAgent) return "";

  if (/\bandroid\b|\badr\b/.test(userAgent)) return "android";

  if (
    /\bios\b|\biphone\b|\bipad\b|\bipod\b|\biwatch\b/.test(userAgent) ||
    isIPadOSDesktopMode(signals, userAgent)
  ) {
    return "ios";
  }

  if (/\bwindows\b|\bwin32\b|\bwin64\b|\bwow32\b|\bwow64\b/.test(userAgent)) {
    return "windows";
  }
  if (/\bmacintosh\b|\bmacintel\b|\bmac os x\b/.test(userAgent)) {
    return "macos";
  }
  if (/\blinux\b/.test(userAgent)) return "linux";
  return "";
}

function detectDeviceType(
  signals: OperatingSystemSignals
): DetectedDeviceType {
  const userAgent = signals.userAgent.trim().toLowerCase();
  if (!userAgent) return "";

  if (/\biwatch\b|\bapple watch\b/.test(userAgent)) return "";
  if (
    /\bipad\b|\btablet\b/.test(userAgent) ||
    isIPadOSDesktopMode(signals, userAgent)
  ) {
    return "tablet";
  }

  const operatingSystem = detectOperatingSystem(signals);
  if (operatingSystem === "android") {
    return /\bmobile\b/.test(userAgent) ? "mobile" : "tablet";
  }
  if (
    operatingSystem === "ios" &&
    /\biphone\b|\bipod\b/.test(userAgent)
  ) {
    return "mobile";
  }
  if (
    operatingSystem === "windows" ||
    operatingSystem === "macos" ||
    operatingSystem === "linux" ||
    /\bcros\b/.test(userAgent)
  ) {
    return "desktop";
  }
  if (/\bmobile\b/.test(userAgent)) return "mobile";
  return "";
}

function resolveDeviceType(userAgent?: string): DetectedDeviceType {
  if (userAgent !== undefined && typeof userAgent !== "string") {
    throw new TypeError("userAgent must be a string when provided.");
  }
  if (userAgent !== undefined) {
    return detectDeviceType({
      userAgent,
      platform: "",
      maxTouchPoints: 0,
    });
  }
  return detectDeviceType(getDefaultOperatingSystemSignals());
}

function resolveOperatingSystem(
  userAgent?: string
): DetectedOperatingSystem {
  if (userAgent !== undefined && typeof userAgent !== "string") {
    throw new TypeError("userAgent must be a string when provided.");
  }
  if (userAgent !== undefined) {
    return detectOperatingSystem({
      userAgent,
      platform: "",
      maxTouchPoints: 0,
    });
  }
  return detectOperatingSystem(getDefaultOperatingSystemSignals());
}

/**
 * Check whether a user agent represents a mobile phone or handset-class
 * device. Tablet devices are classified separately by {@link isTablet}.
 *
 * The classifier recognizes iPhone and iPod user agents, Android user agents
 * that contain the `Mobile` token, and a bounded `Mobile` token as a fallback
 * for otherwise unknown clients. Stronger tablet signals take priority.
 *
 * @param userAgent Optional user-agent string. Defaults to the current
 * browser's guarded navigator signals. An explicit string is classified by
 * itself without current platform or touch information.
 * @returns `true` for a recognized phone or handset-class device; otherwise
 * `false`. Returns `false` during SSR when no explicit user agent is available.
 * @throws {TypeError} If an explicitly supplied user agent is not a string.
 * @remarks Device classification is heuristic and spoofable. Do not use this
 * helper as a security boundary or as a substitute for responsive CSS or
 * feature detection. It does not inspect viewport dimensions. The separate
 * `isMobile` export is an alias of the `isValidPhoneNumber` string validator.
 * @category Browser Information
 */
export function isPhone(userAgent?: string): boolean {
  return resolveDeviceType(userAgent) === "mobile";
}

/**
 * Check whether a user agent represents a desktop or laptop-class device.
 *
 * The classifier recognizes Windows, ordinary macOS, Linux, and ChromeOS.
 * Touch capability does not make a Windows device a tablet. A current browser
 * with the existing MacIntel multi-touch iPadOS compatibility signals is
 * excluded from desktop classification.
 *
 * @param userAgent Optional user-agent string. Defaults to the current
 * browser's guarded navigator signals. An explicit string is classified by
 * itself without current platform or touch information.
 * @returns `true` for a recognized desktop or laptop-class device; otherwise
 * `false`. Returns `false` during SSR when no explicit user agent is available.
 * @throws {TypeError} If an explicitly supplied user agent is not a string.
 * @remarks Device classification is heuristic and spoofable. Do not use this
 * helper as a security boundary or as a substitute for responsive CSS or
 * feature detection. It does not inspect viewport dimensions.
 * @category Browser Information
 */
export function isDesktop(userAgent?: string): boolean {
  return resolveDeviceType(userAgent) === "desktop";
}

/**
 * Check whether a user agent represents a tablet device.
 *
 * The classifier recognizes conventional iPad user agents, bounded `Tablet`
 * tokens, and Android user agents without a `Mobile` token. When no explicit
 * user agent is supplied, it also recognizes modern iPadOS desktop mode from a
 * Macintosh user agent, `MacIntel` platform, and more than one touch point.
 * An explicit user agent never borrows current platform or touch signals.
 *
 * @param userAgent Optional user-agent string. Defaults to the current
 * browser's guarded navigator signals. An explicit string is classified by
 * itself without current platform or touch information.
 * @returns `true` for a recognized tablet device; otherwise `false`. Returns
 * `false` during SSR when no explicit user agent is available.
 * @throws {TypeError} If an explicitly supplied user agent is not a string.
 * @remarks Device classification is heuristic and spoofable. Do not use this
 * helper as a security boundary or as a substitute for responsive CSS or
 * feature detection. It does not inspect viewport dimensions.
 * @category Browser Information
 */
export function isTablet(userAgent?: string): boolean {
  return resolveDeviceType(userAgent) === "tablet";
}

/**
 * Check whether a user agent represents iOS or iPadOS.
 *
 * Without an argument, the function reads the current `navigator.userAgent`.
 * It also recognizes iPadOS browsers that identify as macOS by checking the
 * current `navigator.platform` and `navigator.maxTouchPoints` compatibility
 * signals. An explicit user agent is classified by that string alone.
 *
 * Usage:
 *
 * ```ts
 * import { isIOS } from "mazey";
 *
 * const result = isIOS();
 * console.log(result);
 * ```
 *
 * Possible output:
 *
 * ```text
 * true
 * ```
 *
 * @param userAgent Optional user-agent string. Defaults to the current browser's user agent.
 * @returns `true` for recognized iOS or iPadOS user agents; otherwise `false`.
 * @throws {TypeError} If an explicitly supplied user agent is not a string.
 * @remarks Safe during SSR and in Node.js. User-agent detection is heuristic and spoofable; do not use this result as a security boundary.
 * @category Browser Information
 */
export function isIOS(userAgent?: string): boolean {
  return resolveOperatingSystem(userAgent) === "ios";
}

/**
 * Check whether a user agent represents Android.
 *
 * Usage:
 *
 * ```ts
 * import { isAndroid } from "mazey";
 *
 * const result = isAndroid();
 * console.log(result);
 * ```
 *
 * @param userAgent Optional user-agent string. Defaults to the current browser's user agent.
 * @returns `true` for recognized Android user agents; otherwise `false`.
 * @throws {TypeError} If an explicitly supplied user agent is not a string.
 * @remarks Safe during SSR and in Node.js. An explicit value is classified without reading current browser signals. User-agent detection is heuristic and spoofable; do not use this result as a security boundary.
 * @category Browser Information
 */
export function isAndroid(userAgent?: string): boolean {
  return resolveOperatingSystem(userAgent) === "android";
}

/**
 * Check whether a user agent represents macOS.
 *
 * Modern iPadOS browsers that identify as macOS are excluded when the current
 * browser exposes the standard MacIntel multi-touch compatibility signals.
 *
 * Usage:
 *
 * ```ts
 * import { isMacOS } from "mazey";
 *
 * const result = isMacOS();
 * console.log(result);
 * ```
 *
 * @param userAgent Optional user-agent string. Defaults to the current browser's user agent.
 * @returns `true` for recognized macOS user agents; otherwise `false`.
 * @throws {TypeError} If an explicitly supplied user agent is not a string.
 * @remarks Safe during SSR and in Node.js. An explicit value is classified without reading current browser signals. User-agent detection is heuristic and spoofable; do not use this result as a security boundary.
 * @category Browser Information
 */
export function isMacOS(userAgent?: string): boolean {
  return resolveOperatingSystem(userAgent) === "macos";
}

/**
 * Check whether a user agent represents Windows.
 *
 * Usage:
 *
 * ```ts
 * import { isWindows } from "mazey";
 *
 * const result = isWindows();
 * console.log(result);
 * ```
 *
 * @param userAgent Optional user-agent string. Defaults to the current browser's user agent.
 * @returns `true` for recognized Windows user agents; otherwise `false`.
 * @throws {TypeError} If an explicitly supplied user agent is not a string.
 * @remarks Safe during SSR and in Node.js. An explicit value is classified without reading current browser signals. User-agent detection is heuristic and spoofable; do not use this result as a security boundary.
 * @category Browser Information
 */
export function isWindows(userAgent?: string): boolean {
  return resolveOperatingSystem(userAgent) === "windows";
}

/**
 * Check whether a user agent represents Linux.
 *
 * Android user agents are excluded even though they commonly contain the
 * `Linux` token.
 *
 * Usage:
 *
 * ```ts
 * import { isLinux } from "mazey";
 *
 * const result = isLinux();
 * console.log(result);
 * ```
 *
 * @param userAgent Optional user-agent string. Defaults to the current browser's user agent.
 * @returns `true` for recognized Linux user agents; otherwise `false`.
 * @throws {TypeError} If an explicitly supplied user agent is not a string.
 * @remarks Safe during SSR and in Node.js. An explicit value is classified without reading current browser signals. User-agent detection is heuristic and spoofable; do not use this result as a security boundary.
 * @category Browser Information
 */
export function isLinux(userAgent?: string): boolean {
  return resolveOperatingSystem(userAgent) === "linux";
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
 * Browser objects used by Mazey's synchronous PWA capability checks.
 *
 * Supply an environment when the caller already owns browser references, such
 * as a site initializer, iframe integration, or deterministic test. Injected
 * objects are used exclusively and are never combined with global browser
 * objects.
 *
 * @category Browser Information
 */
export interface PWAEnvironment {
  /** Window capabilities used by PWA scope and display-mode checks. */
  window: Pick<Window, "isSecureContext" | "location" | "matchMedia">;
  /** Navigator capabilities used by Service Worker and iOS standalone checks. */
  navigator: Navigator & { readonly standalone?: boolean };
  /** Document inspected for a web app manifest when one is required. */
  document?: Document;
}

/**
 * Options for {@link isStandalonePWA}.
 *
 * @category Browser Information
 */
export interface IsStandalonePWAOptions {
  /** Browser objects to inspect instead of browser globals. */
  environment?: PWAEnvironment;
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
  /** Browser objects to inspect instead of browser globals. */
  environment?: PWAEnvironment;
}

function isCurrentPageWithinScope(
  scope: string,
  windowRef: PWAEnvironment["window"]
): boolean {
  const normalizedScope = scope.trim();
  if (!normalizedScope || /[?#]/.test(normalizedScope)) {
    return false;
  }

  try {
    const currentUrl = new URL(windowRef.location.href);
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

function getGlobalPWAEnvironment(): PWAEnvironment | null {
  try {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return null;
    }
    return {
      window,
      navigator: navigator as PWAEnvironment["navigator"],
      document: typeof document === "undefined" ? undefined : document,
    };
  } catch (e) {
    return null;
  }
}

function getPWAEnvironment(
  environment: unknown
): PWAEnvironment | null {
  if (environment === undefined) {
    return getGlobalPWAEnvironment();
  }
  if (
    environment === null ||
    typeof environment !== "object" ||
    Array.isArray(environment)
  ) {
    return null;
  }

  try {
    const windowRef = (environment as PWAEnvironment).window;
    const navigatorRef = (environment as PWAEnvironment).navigator;
    const documentRef = (environment as PWAEnvironment).document;
    if (
      windowRef === null ||
      typeof windowRef !== "object" ||
      navigatorRef === null ||
      typeof navigatorRef !== "object" ||
      (documentRef !== undefined &&
        (documentRef === null || typeof documentRef !== "object"))
    ) {
      return null;
    }
    return {
      window: windowRef,
      navigator: navigatorRef,
      document: documentRef,
    };
  } catch (e) {
    return null;
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
 * Callers that already own browser references can inject them without changing
 * globals:
 *
 * ```javascript
 * const ret = isSafePWAEnv({
 *   scope: "/app/",
 *   environment: { window, navigator, document },
 * });
 * ```
 *
 * @remarks Browser-preferred and safe to call during SSR. When `environment`
 * is provided, only those objects are inspected; missing injected capabilities
 * return `false` rather than falling back to globals.
 * @param options Optional manifest, URL-scope, and browser-environment requirements.
 * @returns Whether the detectable minimum PWA prerequisites are satisfied.
 * @category Browser Information
 */
export function isSafePWAEnv(options: IsSafePWAEnvOptions = {}): boolean {
  try {
    if (options === null || typeof options !== "object" || Array.isArray(options)) {
      return false;
    }

    const requireManifest = options.requireManifest;
    const scope = options.scope;
    const environment = options.environment;
    if (
      (requireManifest !== undefined && typeof requireManifest !== "boolean") ||
      (scope !== undefined && typeof scope !== "string")
    ) {
      return false;
    }

    const resolvedEnvironment = getPWAEnvironment(environment);
    if (!resolvedEnvironment) {
      return false;
    }
    const {
      window: windowRef,
      navigator: navigatorRef,
      document: documentRef,
    } = resolvedEnvironment;

    const serviceWorker = navigatorRef.serviceWorker;
    if (
      windowRef.isSecureContext !== true ||
      serviceWorker === null ||
      typeof serviceWorker !== "object"
    ) {
      return false;
    }

    if (
      scope !== undefined &&
      !isCurrentPageWithinScope(scope, windowRef)
    ) {
      return false;
    }

    if (requireManifest === false) {
      return true;
    }

    if (!documentRef) {
      return false;
    }

    const manifest = documentRef.querySelector<HTMLLinkElement>("link[rel~=\"manifest\"][href]");
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
 * Callers that already own browser references can inject them without changing
 * globals:
 *
 * ```javascript
 * const standalone = isStandalonePWA({
 *   environment: { window, navigator },
 * });
 * ```
 *
 * @remarks Browser-preferred and safe to call during SSR. This is a one-time
 * synchronous read and does not install listeners. When `environment` is
 * supplied, only those objects are inspected.
 * @param options Optional browser environment to inspect instead of globals.
 * @returns `true` in detected standalone presentation; otherwise `false`.
 * @category Browser Information
 */
export function isStandalonePWA(
  options: IsStandalonePWAOptions = {}
): boolean {
  let environment: unknown;
  try {
    if (options === null || typeof options !== "object" || Array.isArray(options)) {
      return false;
    }
    environment = options.environment;
  } catch (e) {
    return false;
  }

  const resolvedEnvironment = getPWAEnvironment(environment);
  if (!resolvedEnvironment) {
    return false;
  }
  const {
    window: windowRef,
    navigator: navigatorRef,
  } = resolvedEnvironment;

  try {
    const matchMedia = windowRef.matchMedia;
    if (
      typeof matchMedia === "function" &&
      matchMedia.call(windowRef, "(display-mode: standalone)").matches
    ) {
      return true;
    }
  } catch (e) {
    // Fall through to the iOS compatibility signal.
  }

  try {
    return navigatorRef.standalone === true;
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
    const operatingSystemSignals = getDefaultOperatingSystemSignals();
    const ua: string = operatingSystemSignals.userAgent.toLowerCase();
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
    const system = detectOperatingSystem(operatingSystemSignals);
    // Apple Device Type
    let appleType = "";
    if (system === "ios") {
      if (testUa(/ipad/g)) {
        appleType = "ipad";
      } else if (testUa(/iphone/g)) {
        appleType = "iphone";
      } else if (testUa(/iwatch/g)) {
        appleType = "iwatch";
      } else if (testUa(/ipod/g)) {
        appleType = "ipod";
      } else if (
        operatingSystemSignals.platform.toLowerCase() === "macintel" &&
        operatingSystemSignals.maxTouchPoints > 1
      ) {
        appleType = "ipad";
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

/**
 * Listen for media-query changes with the standard browser event API.
 *
 * A missing media query or unavailable standard event methods return an inert
 * cleanup function.
 *
 * Usage:
 *
 * ```javascript
 * import { listenMediaQueryChanges } from "mazey";
 *
 * const media = window.matchMedia("(prefers-color-scheme: dark)");
 * const stop = listenMediaQueryChanges(media, event => {
 *   console.log(event.matches);
 * });
 *
 * stop();
 * stop();
 * ```
 *
 * @param media Media-query result to observe, or `null` when unavailable.
 * @param listener Callback invoked for media-query change events.
 * @returns An idempotent function that removes the registered listener.
 * @throws {TypeError} If `listener` is not a function or `media` is neither an object nor `null`.
 * @remarks This helper does not call `matchMedia`, invoke the listener immediately, or modify the DOM. It is safe during SSR when `null` is supplied.
 * @category Browser Information
 */
export function listenMediaQueryChanges(
  media: MediaQueryList | null,
  listener: (event: MediaQueryListEvent) => void
): () => void {
  if (typeof listener !== "function") {
    throw new TypeError("listener must be a function");
  }
  if (media === null) return () => undefined;
  if (typeof media !== "object") {
    throw new TypeError("media must be a MediaQueryList or null");
  }

  const addEventListener = media.addEventListener;
  const removeEventListener = media.removeEventListener;
  let remove: (() => void) | null = null;

  if (
    typeof addEventListener === "function" &&
    typeof removeEventListener === "function"
  ) {
    const eventListener = listener as EventListener;
    addEventListener.call(media, "change", eventListener);
    remove = () => removeEventListener.call(media, "change", eventListener);
  }

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    remove?.();
  };
}

/**
 * Callbacks used by {@link watchServiceWorkerUpdates}.
 *
 * @category Browser Information
 */
export interface ServiceWorkerUpdateCallbacks {
  /** Called when a waiting update is ready to be activated. */
  onUpdateAvailable(worker: ServiceWorker): void;
  /** Called after the service worker controlling the page changes. */
  onControllerChange?(): void;
}

/**
 * Controls returned by {@link watchServiceWorkerUpdates}.
 *
 * @category Browser Information
 */
export interface ServiceWorkerUpdateWatcher {
  /**
   * Post a message to the current waiting worker.
   * The default message is `{ type: "SKIP_WAITING" }`.
   */
  activateWaiting(message?: unknown): boolean;
  /** Remove every listener installed by the watcher. Idempotent. */
  dispose(): void;
}

/**
 * Watch a service-worker registration for an update ready to activate.
 *
 * Existing waiting workers and newly installed workers are reported only when
 * the page already has a controller, which distinguishes updates from a first
 * installation. Activation, UI, status copy, and reload policy remain under
 * caller control.
 *
 * Usage:
 *
 * ```javascript
 * import { watchServiceWorkerUpdates } from "mazey";
 *
 * const watcher = watchServiceWorkerUpdates(
 *   registration,
 *   navigator.serviceWorker,
 *   {
 *     onUpdateAvailable() {
 *       console.log("Update available");
 *     },
 *     onControllerChange() {
 *       console.log("Controller changed");
 *     },
 *   }
 * );
 *
 * watcher.activateWaiting();
 * watcher.dispose();
 * ```
 *
 * @param registration Service-worker registration to observe.
 * @param container Service-worker container that owns the page controller.
 * @param callbacks Update and optional controller-change callbacks.
 * @returns Controls for requesting activation and disposing all listeners.
 * @throws {TypeError} If required registration, container, or callback methods are missing.
 * @remarks This helper does not register a service worker, mutate the DOM, reload the page, or decide when an update should activate. `activateWaiting` returns `false` when no update is waiting or `postMessage` fails.
 * @category Browser Information
 */
export function watchServiceWorkerUpdates(
  registration: ServiceWorkerRegistration,
  container: ServiceWorkerContainer,
  callbacks: ServiceWorkerUpdateCallbacks
): ServiceWorkerUpdateWatcher {
  if (
    registration === null ||
    typeof registration !== "object" ||
    typeof registration.addEventListener !== "function" ||
    typeof registration.removeEventListener !== "function"
  ) {
    throw new TypeError("registration must support event listeners");
  }
  if (
    container === null ||
    typeof container !== "object" ||
    typeof container.addEventListener !== "function" ||
    typeof container.removeEventListener !== "function"
  ) {
    throw new TypeError("container must support event listeners");
  }
  if (
    callbacks === null ||
    typeof callbacks !== "object" ||
    typeof callbacks.onUpdateAvailable !== "function" ||
    (callbacks.onControllerChange !== undefined &&
      typeof callbacks.onControllerChange !== "function")
  ) {
    throw new TypeError("callbacks must provide onUpdateAvailable");
  }

  let disposed = false;
  let installingWorker: ServiceWorker | null = null;
  let waitingWorker: ServiceWorker | null = null;
  let registrationListenerAdded = false;
  let containerListenerAdded = false;

  const reportUpdate = (worker: ServiceWorker) => {
    if (disposed || waitingWorker === worker) return;
    waitingWorker = worker;
    callbacks.onUpdateAvailable(worker);
  };
  const handleStateChange = () => {
    if (
      !disposed &&
      installingWorker?.state === "installed" &&
      container.controller
    ) {
      reportUpdate(installingWorker);
    }
  };
  const handleUpdateFound = () => {
    if (disposed) return;
    installingWorker?.removeEventListener("statechange", handleStateChange);
    installingWorker = registration.installing;
    installingWorker?.addEventListener("statechange", handleStateChange);
    handleStateChange();
  };
  const handleControllerChange = () => {
    if (!disposed) callbacks.onControllerChange?.();
  };

  const removeListeners = () => {
    if (registrationListenerAdded) {
      try {
        registration.removeEventListener("updatefound", handleUpdateFound);
      } catch (e) {
        // Continue removing the remaining listeners.
      }
      registrationListenerAdded = false;
    }
    try {
      installingWorker?.removeEventListener("statechange", handleStateChange);
    } catch (e) {
      // Continue removing the remaining listeners.
    }
    if (containerListenerAdded) {
      try {
        container.removeEventListener("controllerchange", handleControllerChange);
      } catch (e) {
        // Cleanup remains best-effort for browser-provided event targets.
      }
      containerListenerAdded = false;
    }
  };

  try {
    registration.addEventListener("updatefound", handleUpdateFound);
    registrationListenerAdded = true;
    container.addEventListener("controllerchange", handleControllerChange);
    containerListenerAdded = true;
    if (registration.waiting && container.controller) {
      reportUpdate(registration.waiting);
    }
    if (registration.installing) handleUpdateFound();
  } catch (error) {
    disposed = true;
    removeListeners();
    installingWorker = null;
    waitingWorker = null;
    throw error;
  }

  return {
    activateWaiting(message: unknown = { type: "SKIP_WAITING" }): boolean {
      if (disposed || !waitingWorker) return false;
      try {
        waitingWorker.postMessage(message);
        return true;
      } catch (e) {
        return false;
      }
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      removeListeners();
      installingWorker = null;
      waitingWorker = null;
    },
  };
}

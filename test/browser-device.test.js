/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  getBrowserInfo,
  isAndroid,
  isDesktop,
  isIOS,
  isLinux,
  isMacOS,
  isPhone,
  isTablet,
  isWindows,
} from "../lib/index.esm";

const userAgents = {
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
    "AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  ipod:
    "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_7 like Mac OS X) " +
    "AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  ipad:
    "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) " +
    "AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  ipadChrome:
    "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) " +
    "AppleWebKit/605.1.15 CriOS/126.0 Mobile/15E148 Safari/604.1",
  androidPhone:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) " +
    "AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36",
  androidTablet:
    "Mozilla/5.0 (Linux; Android 14; SM-X710) " +
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
  chromeOS:
    "Mozilla/5.0 (X11; CrOS x86_64 15917.71.0) " +
    "AppleWebKit/537.36 Chrome/126.0 Safari/537.36",
};

const checks = [ isDesktop, isPhone, isTablet ];

function classify(userAgent) {
  return checks.map(check => check(userAgent));
}

describe("device form-factor helpers", () => {
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
  const originalBrowserInfo = Object.getOwnPropertyDescriptor(
    window,
    "MAZEY_BROWSER_INFO"
  );
  const originalMatchMedia = Object.getOwnPropertyDescriptor(
    window,
    "matchMedia"
  );

  function restoreProperty(target, property, descriptor) {
    if (descriptor) {
      Object.defineProperty(target, property, descriptor);
    } else {
      delete target[property];
    }
  }

  function setNavigatorSignals({
    userAgent = "",
    platform = "",
    maxTouchPoints = 0,
  }) {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: userAgent,
    });
    Object.defineProperty(navigator, "platform", {
      configurable: true,
      value: platform,
    });
    Object.defineProperty(navigator, "maxTouchPoints", {
      configurable: true,
      value: maxTouchPoints,
    });
  }

  afterEach(() => {
    restoreProperty(navigator, "userAgent", originalUserAgent);
    restoreProperty(navigator, "platform", originalPlatform);
    restoreProperty(navigator, "maxTouchPoints", originalMaxTouchPoints);
    restoreProperty(window, "MAZEY_BROWSER_INFO", originalBrowserInfo);
    restoreProperty(window, "matchMedia", originalMatchMedia);
  });

  it.each([
    [ "iPhone", userAgents.iphone, [ false, true, false ] ],
    [ "iPod", userAgents.ipod, [ false, true, false ] ],
    [ "iPad", userAgents.ipad, [ false, false, true ] ],
    [ "iPad Chrome", userAgents.ipadChrome, [ false, false, true ] ],
    [ "mixed-case iPad", userAgents.ipad.toUpperCase(), [ false, false, true ] ],
    [ "Android phone", userAgents.androidPhone, [ false, true, false ] ],
    [ "Android tablet", userAgents.androidTablet, [ false, false, true ] ],
    [ "generic Android tablet", "Mozilla/5.0 (Android 14)", [ false, false, true ] ],
    [ "explicit tablet", "ExampleClient/1.0 Tablet", [ false, false, true ] ],
    [ "generic mobile", "ExampleClient/1.0 Mobile", [ false, true, false ] ],
    [ "Windows", userAgents.windows, [ true, false, false ] ],
    [ "macOS", userAgents.macos, [ true, false, false ] ],
    [ "Linux", userAgents.linux, [ true, false, false ] ],
    [ "ChromeOS", userAgents.chromeOS, [ true, false, false ] ],
    [ "unknown", "CustomClient/1.0", [ false, false, false ] ],
    [ "Apple Watch", "Mozilla/5.0 (Apple Watch) Mobile/15E148", [ false, false, false ] ],
    [ "iWatch", "Mozilla/5.0 (iWatch) Mobile/15E148", [ false, false, false ] ],
    [ "unbounded tablet text", "CustomTabletClient/1.0", [ false, false, false ] ],
  ])("classifies an explicit %s user agent", (name, userAgent, expected) => {
    const result = classify(userAgent);

    expect(result).toEqual(expected);
    expect(result.filter(Boolean)).toHaveLength(expected.includes(true) ? 1 : 0);
  });

  it.each([ "", "   " ])(
    "returns false for explicit empty input %p",
    userAgent => {
      expect(classify(userAgent)).toEqual([ false, false, false ]);
    }
  );

  it("recognizes modern iPadOS desktop mode only above one touch point", () => {
    [
      [ 0, [ true, false, false ] ],
      [ 1, [ true, false, false ] ],
      [ 5, [ false, false, true ] ],
    ].forEach(([ maxTouchPoints, expected ]) => {
      setNavigatorSignals({
        userAgent: userAgents.macos,
        platform: "MacIntel",
        maxTouchPoints,
      });

      expect(classify()).toEqual(expected);
    });
  });

  it("keeps a touchscreen Windows laptop classified as desktop", () => {
    setNavigatorSignals({
      userAgent: userAgents.windows,
      platform: "Win32",
      maxTouchPoints: 10,
    });

    expect(classify()).toEqual([ true, false, false ]);
  });

  it("isolates explicit user agents from current iPadOS signals", () => {
    setNavigatorSignals({
      userAgent: userAgents.macos,
      platform: "MacIntel",
      maxTouchPoints: 5,
    });

    expect(classify(userAgents.macos)).toEqual([ true, false, false ]);
  });

  it("preserves OS helper behavior and the legacy broad platform grouping", () => {
    setNavigatorSignals({
      userAgent: userAgents.ipad,
      platform: "iPad",
      maxTouchPoints: 5,
    });

    expect(isIOS()).toBe(true);
    expect(isMacOS()).toBe(false);
    expect(isTablet()).toBe(true);
    expect(getBrowserInfo().platform).toBe("mobile");
    expect(isAndroid(userAgents.androidPhone)).toBe(true);
    expect(isAndroid(userAgents.androidTablet)).toBe(true);
    expect(isWindows(userAgents.windows)).toBe(true);
    expect(isLinux(userAgents.linux)).toBe(true);
  });

  it("does not classify Android as desktop through its Linux token", () => {
    expect(isDesktop(userAgents.androidPhone)).toBe(false);
    expect(isDesktop(userAgents.androidTablet)).toBe(false);
  });

  it.each([ null, 123, true, {}, [] ])(
    "rejects invalid runtime user-agent value %p",
    userAgent => {
      checks.forEach(check => {
        expect(() => check(userAgent)).toThrow(TypeError);
        expect(() => check(userAgent)).toThrow(
          "userAgent must be a string when provided."
        );
      });
    }
  );

  it("treats undefined as current-browser classification", () => {
    setNavigatorSignals({ userAgent: userAgents.androidPhone });

    expect(classify(undefined)).toEqual([ false, true, false ]);
  });

  it("returns false when the default user-agent getter throws", () => {
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      get() {
        throw new Error("host failure");
      },
    });

    expect(classify()).toEqual([ false, false, false ]);
  });

  it.each([ "platform", "maxTouchPoints" ])(
    "returns false for an unknown UA when the %s getter throws",
    property => {
      setNavigatorSignals({ userAgent: "CustomClient/1.0" });
      Object.defineProperty(navigator, property, {
        configurable: true,
        get() {
          throw new Error("host failure");
        },
      });

      expect(classify()).toEqual([ false, false, false ]);
    }
  );

  it("does not read viewport or input-capability APIs", () => {
    const matchMedia = jest.fn(() => ({ matches: false }));
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMedia,
    });
    setNavigatorSignals({ userAgent: userAgents.androidPhone });

    expect(classify()).toEqual([ false, true, false ]);
    expect(matchMedia).not.toHaveBeenCalled();
  });
});

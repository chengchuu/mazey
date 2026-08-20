/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  getFCP, getFP, getLCP, getFID, getCLS, getTTFB, getPerformance, isSupportedEntryType, 
} from "../lib/index.esm";

describe("Web Performance Metrics", () => {
  it("should return FCP time in milliseconds", async () => {
    const fcp = await getFCP();
    expect(fcp).toBeGreaterThanOrEqual(0);
  });
  
  it("should return FP time in milliseconds", async () => {
    const fp = await getFP();
    expect(fp).toBeGreaterThanOrEqual(0);
  });
  
  it("should return LCP time in milliseconds", async () => {
    const lcp = await getLCP();
    expect(lcp).toBeGreaterThanOrEqual(0);
  });
  
  it("should return FID time in milliseconds", async () => {
    const fid = await getFID();
    expect(fid).toBeGreaterThanOrEqual(0);
  });
  
  it("should return CLS score", async () => {
    const cls = await getCLS();
    expect(cls).toBeGreaterThanOrEqual(0);
  });
  
  it("should return TTFB time in milliseconds", async () => {
    const ttfb = await getTTFB();
    expect(ttfb).toBeGreaterThanOrEqual(0);
  });
});

describe("getPerformanceStatus", () => {
  it("returns an object with performance data", () => {
    return expect(getPerformance()).rejects.toThrow("navigation is not supported");
  });
});

describe("isSupportedEntryType", () => {
  const originalPerformanceObserver = Object.getOwnPropertyDescriptor(window, "PerformanceObserver");

  afterEach(() => {
    if (originalPerformanceObserver) {
      Object.defineProperty(window, "PerformanceObserver", originalPerformanceObserver);
    } else {
      delete window.PerformanceObserver;
    }
  });

  it("should return true if the entry type is supported", () => {
    // Arrange
    const name = "navigation";
    window.PerformanceObserver = {
      supportedEntryTypes: [ "navigation", "paint", "resource" ],
    };

    // Act
    const result = isSupportedEntryType(name);

    // Assert
    expect(result).toBe(true);
  });

  it("should return false if the entry type is not supported", () => {
    // Arrange
    const name = "longtask";
    window.PerformanceObserver = {
      supportedEntryTypes: [ "navigation", "paint", "resource" ],
    };

    // Act
    const result = isSupportedEntryType(name);

    // Assert
    expect(result).toBe(false);
  });

  it("should return false if PerformanceObserver is not supported", () => {
    // Arrange
    const name = "navigation";
    window.PerformanceObserver = undefined;

    // Act
    const result = isSupportedEntryType(name);

    // Assert
    expect(result).toBe(false);
  });
});

describe("getPerformance navigation timing", () => {
  const originalPerformanceObserver = Object.getOwnPropertyDescriptor(window, "PerformanceObserver");
  const originalReadyState = Object.getOwnPropertyDescriptor(document, "readyState");
  const originalUserAgent = Object.getOwnPropertyDescriptor(navigator, "userAgent");
  const originalOrientation = Object.getOwnPropertyDescriptor(window.screen, "orientation");
  const originalGetEntries = Object.getOwnPropertyDescriptor(window.performance, "getEntries");
  const originalGetEntriesByType = Object.getOwnPropertyDescriptor(window.performance, "getEntriesByType");
  let getEntriesByType;

  function createNavigationTiming(overrides = {}) {
    return {
      decodedBodySize: 100,
      encodedBodySize: 80,
      unloadEventEnd: 0,
      unloadEventStart: 0,
      redirectEnd: 0,
      redirectStart: 0,
      domainLookupEnd: 2,
      domainLookupStart: 1,
      connectEnd: 4,
      connectStart: 2,
      secureConnectionStart: 3,
      responseStart: 8,
      requestStart: 5,
      responseEnd: 10,
      domContentLoadedEventStart: 12,
      loadEventStart: 14,
      loadEventEnd: 16,
      startTime: 0,
      fetchStart: 0,
      ...overrides,
    };
  }

  beforeEach(() => {
    Object.defineProperty(window, "PerformanceObserver", {
      configurable: true,
      value: { supportedEntryTypes: [ "navigation" ] },
    });
    Object.defineProperty(navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (X11; Linux x86_64)",
    });
    Object.defineProperty(window.screen, "orientation", {
      configurable: true,
      value: { angle: 0 },
    });
    Object.defineProperty(window.performance, "getEntries", {
      configurable: true,
      value: jest.fn(() => []),
    });
  });

  afterEach(() => {
    if (originalPerformanceObserver) {
      Object.defineProperty(window, "PerformanceObserver", originalPerformanceObserver);
    } else {
      delete window.PerformanceObserver;
    }
    if (originalReadyState) {
      Object.defineProperty(document, "readyState", originalReadyState);
    }
    if (originalUserAgent) {
      Object.defineProperty(navigator, "userAgent", originalUserAgent);
    }
    if (originalOrientation) {
      Object.defineProperty(window.screen, "orientation", originalOrientation);
    } else {
      delete window.screen.orientation;
    }
    if (originalGetEntries) {
      Object.defineProperty(window.performance, "getEntries", originalGetEntries);
    } else {
      delete window.performance.getEntries;
    }
    if (originalGetEntriesByType) {
      Object.defineProperty(window.performance, "getEntriesByType", originalGetEntriesByType);
    } else {
      delete window.performance.getEntriesByType;
    }
    jest.useRealTimers();
  });

  it("settles for an already-loaded document and reports desktop Linux correctly", async () => {
    const navigationTiming = createNavigationTiming();
    getEntriesByType = jest.fn(() => [ navigationTiming ]);
    Object.defineProperty(window.performance, "getEntriesByType", {
      configurable: true,
      value: getEntriesByType,
    });
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "complete",
    });

    await expect(getPerformance(true)).resolves.toMatchObject({
      os: "others",
      deviceType: "pc",
      screenDirection: "|",
      responseTime: 3,
      renderTime: 16,
    });
  });

  it("rejects when the browser provides no navigation entry", async () => {
    Object.defineProperty(window.performance, "getEntriesByType", {
      configurable: true,
      value: jest.fn(() => []),
    });

    await expect(getPerformance()).rejects.toThrow("NavigationTiming is not supported");
  });

  it("defers an incomplete timing entry until the next task", async () => {
    const navigationTiming = createNavigationTiming({
      domContentLoadedEventStart: 0,
      loadEventStart: 0,
      loadEventEnd: 0,
    });
    getEntriesByType = jest.fn(() => [ navigationTiming ]);
    Object.defineProperty(window.performance, "getEntriesByType", {
      configurable: true,
      value: getEntriesByType,
    });
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "complete",
    });
    const status = getPerformance(true);
    window.setTimeout(() => {
      navigationTiming.domContentLoadedEventStart = 17;
      navigationTiming.loadEventStart = 19;
      navigationTiming.loadEventEnd = 20;
    }, 0);

    await expect(status).resolves.toMatchObject({
      domReadyTime: 17,
      onloadTime: 19,
      renderTime: 20,
    });
  });

  it("reads the final navigation values after the load event", async () => {
    const navigationTiming = createNavigationTiming({
      domContentLoadedEventStart: 0,
      loadEventStart: 0,
      loadEventEnd: 0,
    });
    getEntriesByType = jest.fn(() => [ navigationTiming ]);
    Object.defineProperty(window.performance, "getEntriesByType", {
      configurable: true,
      value: getEntriesByType,
    });
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "loading",
    });
    const status = getPerformance(true);
    await Promise.resolve();
    await Promise.resolve();

    navigationTiming.domContentLoadedEventStart = 17;
    navigationTiming.loadEventStart = 19;
    navigationTiming.loadEventEnd = 20;
    window.dispatchEvent(new Event("load"));

    await expect(status).resolves.toMatchObject({
      domReadyTime: 17,
      onloadTime: 19,
      renderTime: 20,
    });
  });
});

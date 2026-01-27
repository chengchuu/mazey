/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  isSafePWAEnv, getBrowserInfo, isSupportWebp, genBrowserAttrs, 
} from "../lib/index.esm";

describe("isSafePWAEnv", () => {
  it("should return true when all conditions are met", () => {
    // Mock the necessary browser features
    navigator.serviceWorker = {};
    window.fetch = jest.fn();
    window.indexedDB = {};
    window.caches = {};
    // Remove jsdom's location object and set our own
    delete window.location;
    window.location = { protocol: 'https:' };

    expect(isSafePWAEnv()).toBe(true);
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

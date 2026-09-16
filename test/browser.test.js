/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  isSafePWAEnv, getBrowserInfo, isSupportWebp, genBrowserAttrs, 
} from "../lib/index.esm";

describe("isSafePWAEnv", () => {
  const originalSecureContext = Object.getOwnPropertyDescriptor(window, "isSecureContext");
  const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
  const originalBrowserInfo = Object.getOwnPropertyDescriptor(window, "MAZEY_BROWSER_INFO");
  const originalPromise = Object.getOwnPropertyDescriptor(window, "Promise");
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

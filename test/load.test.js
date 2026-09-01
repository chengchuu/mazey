/**
 * @jest-environment jsdom
 */
/* eslint-disable no-undef */
import {
  loadCSS, loadScript, loadScriptIfUndefined, windowLoaded,
} from "../lib/index.esm";

describe("windowLoaded", () => {
  const originalReadyState = Object.getOwnPropertyDescriptor(document, "readyState");

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    if (originalReadyState) {
      Object.defineProperty(document, "readyState", originalReadyState);
    }
  });

  it("resolves with complete if document is already loaded", async () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "complete",
    });

    await expect(windowLoaded()).resolves.toBe("complete");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("cleans up its timeout after the load event", async () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "loading",
    });
    const status = windowLoaded(1000);

    window.dispatchEvent(new Event("load"));

    await expect(status).resolves.toBe("load");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rejects and removes its load listener after a timeout", async () => {
    Object.defineProperty(document, "readyState", {
      configurable: true,
      value: "loading",
    });
    const removeEventListener = jest.spyOn(window, "removeEventListener");
    const status = windowLoaded(1000);

    jest.advanceTimersByTime(1000);

    await expect(status).rejects.toThrow("timeout");
    expect(removeEventListener).toHaveBeenCalledWith("load", expect.any(Function));
    removeEventListener.mockRestore();
  });
});

describe("loadCSS", () => {
  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("rejects when the stylesheet fails to load", async () => {
    const status = loadCSS("http://example.com/missing.css");
    const link = document.querySelector("link[href='http://example.com/missing.css']");

    link.dispatchEvent(new Event("error"));

    await expect(status).rejects.toThrow("Failed to load CSS");
  });
});

describe("loadScript", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    document.head.innerHTML = "";
    document.body.innerHTML = "";
    delete window.concurrentScript;
  });

  it("appends and loads a script when the document has no existing script tags", async () => {
    const status = loadScript("http://example.com/script.js", { timeout: 1000 });
    const script = document.querySelector("script[src='http://example.com/script.js']");

    expect(script).not.toBeNull();
    script.dispatchEvent(new Event("load"));

    await expect(status).resolves.toBe("loaded");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rejects on a script loading error and clears its timeout", async () => {
    const status = loadScript("http://example.com/missing.js", { timeout: 1000 });
    const script = document.querySelector("script[src='http://example.com/missing.js']");

    script.dispatchEvent(new Event("error"));

    await expect(status).rejects.toThrow("Failed to load script");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rejects when the callback throws", async () => {
    const status = loadScript("http://example.com/script.js", {
      callback: () => {
        throw new Error("callback failed");
      },
    });
    const script = document.querySelector("script[src='http://example.com/script.js']");

    script.dispatchEvent(new Event("load"));

    await expect(status).rejects.toThrow("callback failed");
    expect(jest.getTimerCount()).toBe(0);
  });

  it("settles once on timeout and ignores a later load event", async () => {
    const callback = jest.fn();
    const status = loadScript("http://example.com/slow.js", { callback, timeout: 1000 });
    const script = document.querySelector("script[src='http://example.com/slow.js']");

    jest.advanceTimersByTime(1000);
    script.dispatchEvent(new Event("load"));

    await expect(status).rejects.toThrow("timeout");
    expect(callback).not.toHaveBeenCalled();
  });

  it("shares one in-flight request between concurrent conditional loads", async () => {
    const first = loadScriptIfUndefined("concurrentScript", "http://example.com/concurrent.js");
    const second = loadScriptIfUndefined("concurrentScript", "http://example.com/concurrent.js");
    const scripts = document.querySelectorAll("script[src='http://example.com/concurrent.js']");

    expect(second).toBe(first);
    expect(scripts).toHaveLength(1);
    scripts[0].dispatchEvent(new Event("load"));

    await expect(Promise.all([ first, second ])).resolves.toEqual([ "loaded", "loaded" ]);
  });

  it("keeps distinct attribute and URL pairs separate", async () => {
    const first = loadScriptIfUndefined("a:https", "//example.com/x.js");
    const second = loadScriptIfUndefined("a", "https://example.com/x.js");
    const scripts = Array.from(document.querySelectorAll("script"));

    expect(second).not.toBe(first);
    expect(scripts.map(script => script.getAttribute("src"))).toEqual(expect.arrayContaining([
      "//example.com/x.js",
      "https://example.com/x.js",
    ]));
    expect(scripts).toHaveLength(2);
    scripts.forEach(script => script.dispatchEvent(new Event("load")));

    await expect(Promise.all([ first, second ])).resolves.toEqual([ "loaded", "loaded" ]);
  });
});

describe("loadScriptIfUndefined", () => {
  beforeEach(() => {
    Object.defineProperty(window, "testScript", {
      configurable: true,
      writable: true,
      value: {},
    });
  });

  afterEach(() => {
    delete window.testScript;
  });

  it("resolves with defined if the window attribute is already defined", async () => {
    await expect(
      loadScriptIfUndefined("testScript", "http://example.com/script.js")
    ).resolves.toBe("defined");
  });
});

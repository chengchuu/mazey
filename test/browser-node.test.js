/**
 * @jest-environment node
 */
/* eslint-disable no-undef */
import {
  detectVisitorType,
  isAndroid,
  isIOS,
  isLinux,
  isMacOS,
  isSafePWAEnv,
  isStandalonePWA,
  isWindows,
} from "../lib/index.esm";

describe("detectVisitorType outside a browser", () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator"
  );

  beforeEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    } else {
      delete globalThis.navigator;
    }
  });

  it("returns unknown without navigator", () => {
    expect(detectVisitorType()).toBe("unknown");
  });

  it("classifies an explicit crawler without navigator", () => {
    expect(detectVisitorType("Googlebot/2.1")).toBe("crawler");
  });
});

describe("operating-system helpers outside a browser", () => {
  const originalNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator"
  );

  beforeEach(() => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    } else {
      delete globalThis.navigator;
    }
  });

  it.each([ isIOS, isAndroid, isMacOS, isWindows, isLinux ])(
    "returns false without navigator",
    (checkSystem) => {
      expect(checkSystem()).toBe(false);
    }
  );

  it("classifies an explicit user agent without navigator", () => {
    expect(
      isWindows("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
    ).toBe(true);
    expect(isMacOS("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe(
      false
    );
  });
});

describe("isSafePWAEnv outside a browser", () => {
  it("returns false instead of throwing", () => {
    expect(isSafePWAEnv()).toBe(false);
  });
});

describe("isStandalonePWA outside a browser", () => {
  it("returns false instead of throwing", () => {
    expect(isStandalonePWA()).toBe(false);
  });
});

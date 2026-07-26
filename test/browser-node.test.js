/**
 * @jest-environment node
 */
/* eslint-disable no-undef */
import {
  detectVisitorType,
  isSafePWAEnv,
  isStandalonePWA,
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

/**
 * @jest-environment node
 */
/* eslint-disable no-undef */
import * as mazey from "../lib/index.esm";

const { isDesktop, isPhone, isTablet } = mazey;
const checks = [ isDesktop, isPhone, isTablet ];

describe("device form-factor helpers outside a browser", () => {
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

  it("returns false without window or navigator", () => {
    expect(typeof window).toBe("undefined");
    expect(checks.map(check => check())).toEqual([ false, false, false ]);
  });

  it("classifies explicit user agents without browser globals", () => {
    expect(
      checks.map(check => check("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"))
    ).toEqual([ true, false, false ]);
    expect(
      checks.map(check => check("Mozilla/5.0 (Linux; Android 14) Mobile"))
    ).toEqual([ false, true, false ]);
    expect(
      checks.map(check => check("Mozilla/5.0 (Linux; Android 14; SM-X710)"))
    ).toEqual([ false, false, true ]);
  });

  it("keeps device and phone-number checks as separate root APIs", () => {
    const androidPhone = "Mozilla/5.0 (Linux; Android 14) Mobile";

    expect(isPhone(androidPhone)).toBe(true);
    expect(mazey.isMobile(androidPhone)).toBe(false);
    expect(mazey.isMobile("13800138000")).toBe(true);
    expect(mazey.isMobile).toBe(mazey.isValidPhoneNumber);
  });
});

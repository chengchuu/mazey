/**
 * @jest-environment node
 */
/* eslint-disable no-undef */
import { isSafePWAEnv, isStandalonePWA } from "../lib/index.esm";

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

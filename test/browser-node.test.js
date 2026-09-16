/**
 * @jest-environment node
 */
/* eslint-disable no-undef */
import { isSafePWAEnv } from "../lib/index.esm";

describe("isSafePWAEnv outside a browser", () => {
  it("returns false instead of throwing", () => {
    expect(isSafePWAEnv()).toBe(false);
  });
});

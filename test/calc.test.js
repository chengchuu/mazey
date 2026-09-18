/**
 * @jest-environment node
 */
/* eslint-disable no-undef */
import {
  longestComSubstring,
  longestComSubsequence,
  inRate,
} from "../lib/index.esm";

describe("longestComSubstring", () => {
  it("should return 3 for \"fish\" and \"finish\"", () => {
    expect(longestComSubstring("fish", "finish")).toEqual(3);
  });

  it("should return 0 for \"abc\" and \"def\"", () => {
    expect(longestComSubstring("abc", "def")).toEqual(0);
  });

  it("should return 1 for \"abc\" and \"bcd\"", () => {
    expect(longestComSubstring("abc", "bcd")).toEqual(2);
  });

  it("should return 2 for \"abc\" and \"ab\"", () => {
    expect(longestComSubstring("abc", "ab")).toEqual(2);
  });

  it("should return 1 for \"abc\" and \"bc\"", () => {
    expect(longestComSubstring("abc", "bc")).toEqual(2);
  });

  it("should return 0 when either input is empty", () => {
    expect(longestComSubstring("", "abc")).toBe(0);
    expect(longestComSubstring("abc", "")).toBe(0);
  });
});

describe("longestComSubsequence", () => {
  it("should return 4 for \"fish\" and \"finish\"", () => {
    expect(longestComSubsequence("fish", "finish")).toEqual(4);
  });

  it("should return 0 for \"abc\" and \"def\"", () => {
    expect(longestComSubsequence("abc", "def")).toEqual(0);
  });

  it("should return 2 for \"abc\" and \"bcd\"", () => {
    expect(longestComSubsequence("abc", "bcd")).toEqual(2);
  });

  it("should return 2 for \"abc\" and \"ab\"", () => {
    expect(longestComSubsequence("abc", "ab")).toEqual(2);
  });

  it("should return 2 for \"abc\" and \"bc\"", () => {
    expect(longestComSubsequence("abc", "bc")).toEqual(2);
  });

  it("should return 0 when either input is empty", () => {
    expect(longestComSubsequence("", "abc")).toBe(0);
    expect(longestComSubsequence("abc", "")).toBe(0);
  });
});

describe("long string inputs", () => {
  const repeated = "a".repeat(500);

  it("calculates the longest common substring without spreading the result matrix", () => {
    expect(longestComSubstring(repeated, repeated)).toBe(500);
  });

  it("calculates the longest common subsequence without spreading the result matrix", () => {
    expect(longestComSubsequence(repeated, repeated)).toBe(500);
  });
});

describe("inRate", () => {
  it("compares the mocked random value with the requested rate", () => {
    const randomSpy = jest.spyOn(Math, "random");
    randomSpy.mockReturnValueOnce(0.49).mockReturnValueOnce(0.5);

    expect(inRate(0.5)).toBe(true);
    expect(inRate(0.5)).toBe(false);
    randomSpy.mockRestore();
  });
});

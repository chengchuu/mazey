/**
 * @jest-environment node
 */
/* eslint-disable no-undef */
import {
  calculateCAGR,
  longestComSubstring,
  longestComSubsequence,
  inRate,
} from "../lib/index.esm";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

function expectedCAGR(totalReturn, durationInDays) {
  return Math.pow(1 + totalReturn, 365 / durationInDays) - 1;
}

describe("calculateCAGR", () => {
  const startDate = "2022-04-01";
  const endDate = "2025-10-01";

  it.each([ 0.202, "20.2%", "20.2", " 20.2% ", "+20.2%", "2.02e1%" ])(
    "treats %p as a 20.2% total return",
    (totalReturnRate) => {
      expect(calculateCAGR(startDate, endDate, totalReturnRate)).toBeCloseTo(
        calculateCAGR(startDate, endDate, 0.202),
        14
      );
    }
  );

  it.each([ -0.155, "-15.5%", "-15.5", " -15.5% " ])(
    "treats %p as a -15.5% total return",
    (totalReturnRate) => {
      const result = calculateCAGR(startDate, endDate, totalReturnRate);
      expect(result).toBeCloseTo(
        calculateCAGR(startDate, endDate, -0.155),
        14
      );
      expect(result).toBeLessThan(0);
    }
  );

  it.each([ 0, "0", "0%", " 0% " ])(
    "returns zero for %p",
    (totalReturnRate) => {
      expect(calculateCAGR(startDate, endDate, totalReturnRate)).toBe(0);
    }
  );

  it("returns the total return for an exact 365-day period", () => {
    expect(calculateCAGR("2025-01-01", "2026-01-01", "10%")).toBeCloseTo(
      0.1,
      14
    );
  });

  it("annualizes positive returns upward for short periods", () => {
    expect(calculateCAGR("2025-01-01", "2025-07-02", "10%")).toBeGreaterThan(
      0.1
    );
  });

  it("annualizes positive returns downward for long periods", () => {
    expect(calculateCAGR("2020-01-01", "2025-01-01", "50%")).toBeLessThan(
      0.5
    );
  });

  it("uses the actual elapsed duration across a leap-year interval", () => {
    expect(calculateCAGR("2024-01-01", "2025-01-01", "10%")).toBeCloseTo(
      expectedCAGR(0.1, 366),
      14
    );
  });

  it("preserves fractional days from time-of-day components", () => {
    const result = calculateCAGR(
      "2025-01-01 00:00:00",
      "2026-01-01 12:00:00",
      "10%"
    );
    expect(result).toBeCloseTo(expectedCAGR(0.1, 365.5), 14);
    expect(result).not.toBe(0.1);
  });

  it("accepts millisecond timestamps", () => {
    const start = Date.UTC(2025, 0, 1);
    const end = start + 365 * millisecondsPerDay;
    expect(calculateCAGR(start, end, 0.1)).toBeCloseTo(0.1, 14);
  });

  it("accepts Date instances without mutating them", () => {
    const start = new Date("2025-01-01T00:00:00Z");
    const end = new Date("2026-01-01T00:00:00Z");
    const startTime = start.getTime();
    const endTime = end.getTime();

    expect(calculateCAGR(start, end, "10%")).toBeCloseTo(0.1, 14);
    expect(start.getTime()).toBe(startTime);
    expect(end.getTime()).toBe(endTime);
  });

  it.each([
    [ "2025-01-01", "2026-01-01" ],
    [ "2025-01-01 12:30", "2026-01-01 12:30" ],
    [ "2025-01-01 12:30:45", "2026-01-01 12:30:45" ],
    [ "2025-01-01T12:30", "2026-01-01T12:30" ],
    [ "2025-01-01T12:30:45", "2026-01-01T12:30:45" ],
  ])("accepts supported local date strings %s and %s", (start, end) => {
    expect(calculateCAGR(start, end, "10%")).toBeCloseTo(0.1, 14);
  });

  it.each([
    [ "2025-01-01T00:00:00Z", "2026-01-01T00:00:00Z" ],
    [ "2025-01-01T08:00:00+08:00", "2026-01-01T08:00:00+08:00" ],
  ])("accepts supported zoned ISO strings %s and %s", (start, end) => {
    expect(calculateCAGR(start, end, "10%")).toBeCloseTo(0.1, 14);
  });

  it("divides string rates by 100 exactly once and leaves numbers unchanged", () => {
    expect(calculateCAGR("2025-01-01", "2026-01-01", "20.2")).toBeCloseTo(
      0.202,
      14
    );
    expect(calculateCAGR("2025-01-01", "2026-01-01", 20.2)).toBeCloseTo(
      20.2,
      14
    );
  });

  it("returns a full-precision result without internal rounding", () => {
    const result = calculateCAGR(startDate, endDate, 0.202);
    const durationInDays =
      (new Date(2025, 9, 1).getTime() - new Date(2022, 3, 1).getTime()) /
      millisecondsPerDay;
    expect(result).toBe(expectedCAGR(0.202, durationInDays));
    expect(result).not.toBe(Number(result.toFixed(4)));
  });

  it.each([
    [ "invalid", "2026-01-01" ],
    [ "", "2026-01-01" ],
    [ "2025-02-30", "2026-01-01" ],
    [ 8640000000000001, "2026-01-01" ],
    [ new Date("invalid"), "2026-01-01" ],
  ])("rejects invalid start date %p", (start, end) => {
    expect(() => calculateCAGR(start, end, "10%")).toThrow(TypeError);
  });

  it.each([
    [ "2025-01-01", "invalid" ],
    [ "2025-01-01", "" ],
    [ "2025-01-01", "2026-02-30" ],
    [ "2025-01-01", 8640000000000001 ],
    [ "2025-01-01", new Date("invalid") ],
  ])("rejects invalid end date %p", (start, end) => {
    expect(() => calculateCAGR(start, end, "10%")).toThrow(TypeError);
  });

  it.each([
    [ "2025-01-01", "2025-01-01" ],
    [ "2025-01-02", "2025-01-01" ],
  ])("requires the end date to be later than the start date", (start, end) => {
    expect(() => calculateCAGR(start, end, "10%")).toThrow(RangeError);
  });

  it.each([ -1, -1.1 ])("rejects impossible numeric return %p", (returnRate) => {
    expect(() => calculateCAGR(startDate, endDate, returnRate)).toThrow(
      RangeError
    );
  });

  it.each([ NaN, Infinity, -Infinity ])(
    "rejects non-finite numeric return %p",
    (returnRate) => {
      expect(() => calculateCAGR(startDate, endDate, returnRate)).toThrow(
        TypeError
      );
    }
  );

  it.each([ "-100%", "-100", "-110%", "-110" ])(
    "rejects impossible string return %p",
    (returnRate) => {
      expect(() => calculateCAGR(startDate, endDate, returnRate)).toThrow(
        RangeError
      );
    }
  );

  it.each([
    "",
    " ",
    "%",
    "abc",
    "20 percent",
    "20%abc",
    "20.2%%",
    "--20%",
    "+-20%",
    "NaN",
    "Infinity",
    "-Infinity",
  ])("rejects malformed string return %p in full", (returnRate) => {
    expect(() => calculateCAGR(startDate, endDate, returnRate)).toThrow(
      TypeError
    );
  });

  it.each([ null, undefined, {}, [], true, false ])(
    "rejects invalid runtime return type %p",
    (returnRate) => {
      expect(() => calculateCAGR(startDate, endDate, returnRate)).toThrow(
        TypeError
      );
    }
  );

  it("accepts a valid return close to a complete loss", () => {
    const result = calculateCAGR(startDate, endDate, -0.999);
    expect(Number.isFinite(result)).toBe(true);
    expect(result).toBeLessThan(0);
  });

  it("rejects a non-finite calculated CAGR", () => {
    expect(() => calculateCAGR(0, 1, 1)).toThrow(RangeError);
  });
});

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

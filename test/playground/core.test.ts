/** @jest-environment node */
/* eslint-env jest */

import {
  calculateAspectRatioExample,
  calculateCAGRExample,
  calculateDateIntervalExample,
  createCAGRExampleValues,
  createCurrentDateIntervalExampleValues,
  createDateIntervalExampleValues,
} from "../../examples/components/core";

describe("date interval example core", () => {
  test("defaults the end to the next first day of the year", () => {
    const values = createDateIntervalExampleValues(
      new Date(2026, 7, 3, 14, 30, 45)
    );

    expect(values).toEqual({
      start: "2026-08-03T14:30:45",
      end: "2027-01-01T00:00:00",
    });
    expect(
      createDateIntervalExampleValues(new Date(2027, 0, 3, 8, 9, 10))
    ).toEqual({
      start: "2027-01-03T08:09:10",
      end: "2028-01-01T00:00:00",
    });
  });

  test("creates equal current values for reset behavior", () => {
    const values = createCurrentDateIntervalExampleValues(
      new Date(2026, 7, 3, 14, 30, 45)
    );

    expect(values).toEqual({
      start: "2026-08-03T14:30:45",
      end: "2026-08-03T14:30:45",
    });
    expect(calculateDateIntervalExample(values.start, values.end)).toEqual({
      value: "0 seconds",
      error: null,
    });
  });

  test("preserves years below 100 without applying the Date constructor offset", () => {
    const current = new Date(0);
    current.setFullYear(98, 7, 3);
    current.setHours(14, 30, 45, 0);

    expect(createDateIntervalExampleValues(current)).toEqual({
      start: "0098-08-03T14:30:45",
      end: "0099-01-01T00:00:00",
    });
  });

  test("calculates a positive interval", () => {
    expect(
      calculateDateIntervalExample("2026-07-28T13:29:44", "2026-07-29T14:30:45")
    ).toEqual({
      value: "1 day 1 hour 1 minute 1 second",
      error: null,
    });
  });

  test.each([
    ["", "2026-07-29T14:30:45"],
    ["2026-07-29T14:30:45", "invalid"],
  ])("rejects invalid input without throwing", (start, end) => {
    expect(() => calculateDateIntervalExample(start, end)).not.toThrow();
    expect(calculateDateIntervalExample(start, end)).toEqual({
      value: null,
      error: "Enter a valid start and end date and time.",
    });
  });

  test("rejects a reversed interval", () => {
    expect(
      calculateDateIntervalExample("2026-07-29T14:30:45", "2026-07-28T14:30:45")
    ).toEqual({
      value: null,
      error:
        "The start date and time must not be later than the end date and time.",
    });
  });
});

describe("CAGR example core", () => {
  test("creates defaults with the current local day", () => {
    expect(createCAGRExampleValues(new Date(2026, 6, 29, 23, 59, 58))).toEqual({
      start: "2016-07-29",
      end: "2026-07-29",
      totalReturn: "50.2%",
    });
  });

  test("clamps a leap-day start through subYears", () => {
    expect(createCAGRExampleValues(new Date(2024, 1, 29, 12))).toMatchObject({
      start: "2014-02-28",
      end: "2024-02-29",
    });
  });

  test("passes percentage text through and formats the result", () => {
    const percentage = calculateCAGRExample(
      "2022-04-01",
      "2025-10-01",
      "20.2%"
    );
    const numericText = calculateCAGRExample(
      "2022-04-01",
      "2025-10-01",
      "20.2"
    );

    expect(percentage.error).toBeNull();
    expect(percentage.value?.decimal).toBeCloseTo(0.05390890296644435, 14);
    expect(percentage.value?.percentage).toBe("5.39%");
    expect(numericText.value).toEqual(percentage.value);
  });

  test.each([
    ["invalid", "2025-10-01", "20.2%", "startDate must be a valid date"],
    ["2022-04-01", "invalid", "20.2%", "endDate must be a valid date"],
    [
      "2022-04-01",
      "2025-10-01",
      "20%abc",
      "totalReturnRate must be a valid percentage string",
    ],
    [
      "2025-10-01",
      "2022-04-01",
      "20.2%",
      "endDate must be later than startDate",
    ],
  ])(
    "returns a focused validation result",
    (start, end, totalReturn, error) => {
      const result = calculateCAGRExample(start, end, totalReturn);

      expect(result.value).toBeNull();
      expect(result.error).toContain(error);
    }
  );
});

describe("aspect ratio example core", () => {
  test.each([
    ["1920", "1080", "16x9"],
    ["900", "1200", "3x4"],
    ["3440", "1440", "43x18"],
  ])("reduces %s by %s to %s", (width, height, ratio) => {
    expect(calculateAspectRatioExample(width, height)).toEqual({
      value: ratio,
      error: null,
    });
  });

  test.each([
    ["", "1080", "width must be a safe integer"],
    ["1920", "", "height must be a safe integer"],
    ["1920.5", "1080", "width must be a safe integer"],
    ["1920", "1080.5", "height must be a safe integer"],
    ["0", "1080", "width and height must be greater than zero"],
    ["1920", "-1", "width and height must be greater than zero"],
    ["Infinity", "1080", "width must be a safe integer"],
    [
      String(Number.MAX_SAFE_INTEGER + 1),
      "1080",
      "width must be a safe integer",
    ],
  ])("returns a focused error for %p by %p", (width, height, error) => {
    expect(calculateAspectRatioExample(width, height)).toEqual({
      value: null,
      error: `The aspect ratio example could not run: ${error}.`,
    });
  });
});

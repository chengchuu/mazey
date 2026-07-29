/** @jest-environment node */
/* eslint-env jest */

import {
  calculateCAGRExample,
  calculateDateIntervalExample,
  calculateDurationExample,
  createCAGRExampleValues,
  createDateIntervalExampleValues,
  parseDurationInput,
} from "../../examples/components/core";

describe("date interval example core", () => {
  test("formats equal local values and returns zero seconds", () => {
    const values = createDateIntervalExampleValues(
      new Date(2026, 6, 29, 14, 30, 45)
    );

    expect(values).toEqual({
      start: "2026-07-29T14:30:45",
      end: "2026-07-29T14:30:45",
    });
    expect(calculateDateIntervalExample(values.start, values.end)).toEqual({
      value: "0 seconds",
      error: null,
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
      start: "2022-04-01",
      end: "2026-07-29",
      totalReturn: "20.2%",
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

describe("duration example core", () => {
  test.each([
    ["0", "0 seconds"],
    ["1500", "1.5 seconds"],
    ["90000", "1.5 minutes"],
  ])("formats %s milliseconds", (input, output) => {
    expect(calculateDurationExample(input)).toEqual({
      value: output,
      error: null,
    });
  });

  test.each(["", "-1", "Infinity", "not-a-number"])(
    "rejects invalid duration %p",
    (input) => {
      expect(parseDurationInput(input)).toBeNull();
      expect(calculateDurationExample(input)).toEqual({
        value: null,
        error: "Enter a finite duration of zero milliseconds or more.",
      });
    }
  );
});

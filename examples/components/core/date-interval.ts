import {
  formatLocalDateTime,
  getDateDifference,
  parseLocalDateTime,
} from "../../../src";

import type { ExampleResult } from "./example-result";

export interface DateIntervalExampleValues {
  start: string;
  end: string;
}

export function createDateIntervalExampleValues(
  now: Date
): DateIntervalExampleValues {
  const start = formatLocalDateTime(now, { precision: "second" });
  const nextYear = new Date(now.getTime());
  nextYear.setFullYear(now.getFullYear() + 1, 0, 1);
  nextYear.setHours(0, 0, 0, 0);
  const end = formatLocalDateTime(nextYear, { precision: "second" });
  return { start, end };
}

export function createCurrentDateIntervalExampleValues(
  now: Date
): DateIntervalExampleValues {
  const value = formatLocalDateTime(now, { precision: "second" });
  return { start: value, end: value };
}

export function calculateDateIntervalExample(
  start: string,
  end: string
): ExampleResult<string> {
  const startDate = parseLocalDateTime(start);
  const endDate = parseLocalDateTime(end);

  if (!startDate || !endDate) {
    return {
      value: null,
      error: "Enter a valid start and end date and time.",
    };
  }
  if (startDate.getTime() > endDate.getTime()) {
    return {
      value: null,
      error:
        "The start date and time must not be later than the end date and time.",
    };
  }

  return {
    value: String(getDateDifference(startDate, endDate, { type: "text" })),
    error: null,
  };
}

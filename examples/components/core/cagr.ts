import { calculateCAGR, floatToPercent, formatDate } from "../../../src";

import type { ExampleResult } from "./example-result";

export interface CAGRExampleValue {
  decimal: number;
  percentage: string;
}

export interface CAGRExampleValues {
  start: string;
  end: string;
  totalReturn: string;
}

export function createCAGRExampleValues(now: Date): CAGRExampleValues {
  return {
    start: "2022-04-01",
    end: formatDate(now, "yyyy-MM-dd"),
    totalReturn: "20.2%",
  };
}

export function calculateCAGRExample(
  start: string,
  end: string,
  totalReturn: string
): ExampleResult<CAGRExampleValue> {
  try {
    const decimal = calculateCAGR(start, end, totalReturn);
    return {
      value: {
        decimal,
        percentage: floatToPercent(decimal, 2),
      },
      error: null,
    };
  } catch (cause) {
    return {
      value: null,
      error:
        cause instanceof Error
          ? `The CAGR example could not run: ${cause.message}`
          : "The CAGR example could not run because of an unexpected error.",
    };
  }
}

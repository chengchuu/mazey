import { calculateAspectRatio } from "../../../src";

import type { ExampleResult } from "./example-result";

function parseDimension(value: string): number {
  return value.trim() ? Number(value) : NaN;
}

export function calculateAspectRatioExample(
  width: string,
  height: string
): ExampleResult<string> {
  try {
    return {
      value: calculateAspectRatio(
        parseDimension(width),
        parseDimension(height)
      ),
      error: null,
    };
  } catch (cause) {
    if (cause instanceof TypeError || cause instanceof RangeError) {
      return {
        value: null,
        error: `The aspect ratio example could not run: ${cause.message}`,
      };
    }
    throw cause;
  }
}

import { formatDurationFromMs } from "../../../src";

import type { ExampleResult } from "./example-result";

export function parseDurationInput(value: string): number | null {
  if (!value.trim()) return null;
  const duration = Number(value);
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
}

export function calculateDurationExample(
  milliseconds: string
): ExampleResult<string> {
  const duration = parseDurationInput(milliseconds);
  if (duration === null) {
    return {
      value: null,
      error: "Enter a finite duration of zero milliseconds or more.",
    };
  }

  return {
    value: formatDurationFromMs(duration),
    error: null,
  };
}

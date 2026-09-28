import { useState } from "react";

import { calculateDurationExample } from "../core";

export interface DurationExampleController {
  milliseconds: string;
  result: string | null;
  error: string | null;
  setMilliseconds(value: string): void;
  submit(): void;
}

export function useDurationExample(): DurationExampleController {
  const initialMilliseconds = "90000";
  const [milliseconds, setMillisecondsState] = useState(initialMilliseconds);
  const [result, setResult] = useState<string | null>(
    () => calculateDurationExample(initialMilliseconds).value
  );
  const [error, setError] = useState<string | null>(null);

  return {
    milliseconds,
    result,
    error,
    setMilliseconds(value): void {
      setMillisecondsState(value);
      setError(null);
    },
    submit(): void {
      setError(null);
      const next = calculateDurationExample(milliseconds);
      setResult(next.value);
      setError(next.error);
    },
  };
}

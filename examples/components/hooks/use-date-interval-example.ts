import { useState } from "react";

import {
  calculateDateIntervalExample,
  createCurrentDateIntervalExampleValues,
  createDateIntervalExampleValues,
} from "../core";

export interface DateIntervalExampleController {
  start: string;
  end: string;
  result: string | null;
  error: string | null;
  setStart(value: string): void;
  setEnd(value: string): void;
  submit(): void;
  reset(): void;
}

export function useDateIntervalExample(
  now: () => Date = () => new Date()
): DateIntervalExampleController {
  const [initialState] = useState(() => {
    const values = createDateIntervalExampleValues(now());
    return {
      ...values,
      result: calculateDateIntervalExample(values.start, values.end).value,
    };
  });
  const [start, setStartState] = useState(initialState.start);
  const [end, setEndState] = useState(initialState.end);
  const [result, setResult] = useState<string | null>(initialState.result);
  const [error, setError] = useState<string | null>(null);

  const applyResult = (nextStart: string, nextEnd: string): void => {
    setError(null);
    const next = calculateDateIntervalExample(nextStart, nextEnd);
    setResult(next.value);
    setError(next.error);
  };

  return {
    start,
    end,
    result,
    error,
    setStart(value): void {
      setStartState(value);
      setError(null);
    },
    setEnd(value): void {
      setEndState(value);
      setError(null);
    },
    submit(): void {
      applyResult(start, end);
    },
    reset(): void {
      const values = createCurrentDateIntervalExampleValues(now());
      setStartState(values.start);
      setEndState(values.end);
      applyResult(values.start, values.end);
    },
  };
}

import { useState } from "react";

import { calculateCAGRExample, createCAGRExampleValues } from "../core";

import type { CAGRExampleValue } from "../core";

export interface CAGRExampleController {
  start: string;
  end: string;
  totalReturn: string;
  result: CAGRExampleValue | null;
  error: string | null;
  setStart(value: string): void;
  setEnd(value: string): void;
  setTotalReturn(value: string): void;
  submit(): void;
}

export function useCAGRExample(
  now: () => Date = () => new Date()
): CAGRExampleController {
  const [initialState] = useState(() => {
    const values = createCAGRExampleValues(now());
    return {
      ...values,
      result: calculateCAGRExample(values.start, values.end, values.totalReturn)
        .value,
    };
  });
  const [start, setStartState] = useState(initialState.start);
  const [end, setEndState] = useState(initialState.end);
  const [totalReturn, setTotalReturnState] = useState(initialState.totalReturn);
  const [result, setResult] = useState<CAGRExampleValue | null>(
    initialState.result
  );
  const [error, setError] = useState<string | null>(null);

  const clearError = (): void => setError(null);

  return {
    start,
    end,
    totalReturn,
    result,
    error,
    setStart(value): void {
      setStartState(value);
      clearError();
    },
    setEnd(value): void {
      setEndState(value);
      clearError();
    },
    setTotalReturn(value): void {
      setTotalReturnState(value);
      clearError();
    },
    submit(): void {
      setError(null);
      const next = calculateCAGRExample(start, end, totalReturn);
      setResult(next.value);
      setError(next.error);
    },
  };
}

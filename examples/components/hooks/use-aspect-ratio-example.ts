import { useState } from "react";

import { calculateAspectRatioExample } from "../core";

export interface AspectRatioExampleController {
  width: string;
  height: string;
  result: string | null;
  error: string | null;
  setWidth(value: string): void;
  setHeight(value: string): void;
  submit(): void;
}

export function useAspectRatioExample(): AspectRatioExampleController {
  const initialWidth = "1920";
  const initialHeight = "1080";
  const [width, setWidthState] = useState(initialWidth);
  const [height, setHeightState] = useState(initialHeight);
  const [result, setResult] = useState<string | null>(
    () => calculateAspectRatioExample(initialWidth, initialHeight).value
  );
  const [error, setError] = useState<string | null>(null);

  return {
    width,
    height,
    result,
    error,
    setWidth(value): void {
      setWidthState(value);
      setError(null);
    },
    setHeight(value): void {
      setHeightState(value);
      setError(null);
    },
    submit(): void {
      setError(null);
      const next = calculateAspectRatioExample(width, height);
      setResult(next.value);
      setError(next.error);
    },
  };
}

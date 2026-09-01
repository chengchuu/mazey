import type { FormEvent } from "react";

import { useAspectRatioExample } from "../hooks";
import { FormError } from "./FormError";
import { ResultPanel } from "./ResultPanel";

export function AspectRatioExample(): React.JSX.Element {
  const example = useAspectRatioExample();
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    example.submit();
  };

  return (
    <>
      <h3 className="h4">Calculate an aspect ratio</h3>
      <p>
        Reduce image or video dimensions exactly using
        <code> calculateAspectRatio</code>.
      </p>
      <form onSubmit={submit} noValidate>
        <div className="row g-4">
          <div className="col-md-6">
            <label className="form-label" htmlFor="aspect-ratio-width">
              Width
            </label>
            <input
              id="aspect-ratio-width"
              className="form-control"
              type="number"
              min="1"
              step="1"
              required
              value={example.width}
              onChange={(event) => example.setWidth(event.currentTarget.value)}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label" htmlFor="aspect-ratio-height">
              Height
            </label>
            <input
              id="aspect-ratio-height"
              className="form-control"
              type="number"
              min="1"
              step="1"
              required
              value={example.height}
              onChange={(event) => example.setHeight(event.currentTarget.value)}
            />
          </div>
        </div>
        <div className="form-text mt-2">Example: 1920 × 1080 becomes 16x9.</div>
        <button className="btn btn-primary mt-4" type="submit">
          Calculate aspect ratio
        </button>
        <FormError message={example.error} />
        <ResultPanel>
          <strong>Simplified aspect ratio</strong>
          <br />
          <code>{example.result}</code>
        </ResultPanel>
      </form>
    </>
  );
}

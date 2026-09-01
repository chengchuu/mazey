import type { FormEvent } from "react";

import { useDurationExample } from "../hooks";
import { FormError } from "./FormError";
import { ResultPanel } from "./ResultPanel";

export function DurationExample(): React.JSX.Element {
  const example = useDurationExample();
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    example.submit();
  };

  return (
    <>
      <h3 className="h4">Format a duration</h3>
      <p>
        Convert milliseconds into a concise readable duration using
        <code> formatDurationFromMs</code>.
      </p>
      <form onSubmit={submit} noValidate>
        <label className="form-label" htmlFor="duration-ms">
          Duration in milliseconds
        </label>
        <input
          id="duration-ms"
          className="form-control"
          type="number"
          min="0"
          step="any"
          required
          value={example.milliseconds}
          onChange={(event) =>
            example.setMilliseconds(event.currentTarget.value)
          }
        />
        <div className="form-text">Example: 90000 becomes 1.5 minutes.</div>
        <button className="btn btn-primary mt-4" type="submit">
          Run example
        </button>
        <FormError message={example.error} />
        <ResultPanel>
          <strong>Formatted duration</strong>
          <br />
          <code>{example.result}</code>
        </ResultPanel>
      </form>
    </>
  );
}

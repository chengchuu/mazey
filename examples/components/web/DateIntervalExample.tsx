import type { FormEvent } from "react";

import { useDateIntervalExample } from "../hooks";
import { FormError } from "./FormError";
import { ResultPanel } from "./ResultPanel";

export interface DateIntervalExampleProps {
  now?: () => Date;
}

export function DateIntervalExample({
  now,
}: DateIntervalExampleProps): React.JSX.Element {
  const example = useDateIntervalExample(now);
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    example.submit();
  };

  return (
    <>
      <h3 className="h4">Calculate date and time interval</h3>
      <p>
        Calculate the interval from the start date and time to the end date and
        time using <code>getDateDifference</code>.
      </p>
      <form onSubmit={submit} noValidate>
        <div className="row g-4">
          <div className="col-lg-6">
            <label className="form-label" htmlFor="date-time-start">
              Start date and time
            </label>
            <input
              id="date-time-start"
              className="form-control"
              type="datetime-local"
              step="1"
              required
              value={example.start}
              onChange={(event) => example.setStart(event.currentTarget.value)}
            />
          </div>
          <div className="col-lg-6">
            <label className="form-label" htmlFor="date-time-end">
              End date and time
            </label>
            <input
              id="date-time-end"
              className="form-control"
              type="datetime-local"
              step="1"
              required
              value={example.end}
              onChange={(event) => example.setEnd(event.currentTarget.value)}
            />
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2 mt-4">
          <button className="btn btn-primary" type="submit">
            Calculate interval
          </button>
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={example.reset}
          >
            Reset to current time
          </button>
        </div>
        <FormError message={example.error} />
        <ResultPanel>
          <strong>Interval</strong>
          <br />
          <code>{example.result}</code>
        </ResultPanel>
      </form>
    </>
  );
}

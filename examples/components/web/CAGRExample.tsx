import type { FormEvent } from "react";

import { useCAGRExample } from "../hooks";
import { FormError } from "./FormError";
import { ResultPanel } from "./ResultPanel";

export interface CAGRExampleProps {
  now?: () => Date;
}

export function CAGRExample({ now }: CAGRExampleProps): React.JSX.Element {
  const example = useCAGRExample(now);
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    example.submit();
  };

  return (
    <>
      <h3 className="h4">Calculate an investment CAGR</h3>
      <p>
        Annualize a complete-period return using <code>calculateCAGR</code> and
        a fixed 365-day year.
      </p>
      <form onSubmit={submit} noValidate>
        <div className="row g-4">
          <div className="col-lg-6">
            <label className="form-label" htmlFor="cagr-start">
              Start date
            </label>
            <input
              id="cagr-start"
              className="form-control"
              type="date"
              required
              value={example.start}
              onChange={(event) => example.setStart(event.currentTarget.value)}
            />
          </div>
          <div className="col-lg-6">
            <label className="form-label" htmlFor="cagr-end">
              End date
            </label>
            <input
              id="cagr-end"
              className="form-control"
              type="date"
              required
              value={example.end}
              onChange={(event) => example.setEnd(event.currentTarget.value)}
            />
          </div>
          <div className="col-lg-6">
            <label className="form-label" htmlFor="cagr-return">
              Total return
            </label>
            <input
              id="cagr-return"
              className="form-control"
              type="text"
              maxLength={100}
              required
              value={example.totalReturn}
              onChange={(event) =>
                example.setTotalReturn(event.currentTarget.value)
              }
            />
            <div className="form-text">
              Enter a percentage value such as 20.2%, 20.2, or -15.5%.
            </div>
          </div>
        </div>
        <button className="btn btn-primary mt-4" type="submit">
          Calculate CAGR
        </button>
        <FormError message={example.error} />
        <ResultPanel>
          <strong>Formatted CAGR</strong>
          <br />
          <code>{example.result?.percentage}</code>
          <br />
          <strong>Decimal CAGR</strong>
          <br />
          <code>{example.result?.decimal}</code>
        </ResultPanel>
      </form>
    </>
  );
}

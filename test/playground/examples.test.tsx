/** @jest-environment jsdom */
/* eslint-env browser, jest */

import "@testing-library/jest-dom";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  AspectRatioExample,
  CAGRExample,
  DateIntervalExample,
} from "../../examples/components/web";

afterEach(cleanup);

test("date interval initializes, validates, calculates, and resets", async () => {
  const user = userEvent.setup();
  const now = jest
    .fn<Date, []>()
    .mockReturnValueOnce(new Date(2026, 6, 29, 14, 30, 45))
    .mockReturnValueOnce(new Date(2026, 7, 1, 8, 9, 10));
  render(<DateIntervalExample now={now} />);
  const start = screen.getByLabelText("Start date and time");
  const end = screen.getByLabelText("End date and time");

  expect((start as HTMLInputElement).value).toBe("2026-07-29T14:30:45.000");
  expect((end as HTMLInputElement).value).toBe("2027-01-01T00:00");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent("day");

  await user.clear(start);
  await user.click(screen.getByRole("button", { name: "Calculate interval" }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Enter a valid start and end date and time."
  );
  expect(screen.getByRole("status")).not.toHaveTextContent("0 seconds");

  await user.type(start, "2026-07-28T13:29:44");
  await user.clear(end);
  await user.type(end, "2026-07-29T14:30:45");
  await user.click(screen.getByRole("button", { name: "Calculate interval" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "1 day 1 hour 1 minute 1 second"
  );

  await user.click(
    screen.getByRole("button", { name: "Reset to current time" })
  );
  expect(now).toHaveBeenCalledTimes(2);
  expect((start as HTMLInputElement).value).toBe("2026-08-01T08:09:10.000");
  expect((end as HTMLInputElement).value).toBe("2026-08-01T08:09:10.000");
  expect(screen.getByRole("status")).toHaveTextContent("0 seconds");
});

test("date interval rejects a reversed range", async () => {
  const user = userEvent.setup();
  render(<DateIntervalExample now={() => new Date(2026, 6, 29, 14, 30, 45)} />);

  await user.clear(screen.getByLabelText("End date and time"));
  await user.type(
    screen.getByLabelText("End date and time"),
    "2026-07-28T14:30:45"
  );
  await user.click(screen.getByRole("button", { name: "Calculate interval" }));

  expect(screen.getByRole("alert")).toHaveTextContent(
    "The start date and time must not be later than the end date and time."
  );
  expect(screen.getByRole("status")).not.toHaveTextContent("0 seconds");
});

test("CAGR preserves defaults and clears stale output on validation failure", async () => {
  const user = userEvent.setup();
  render(<CAGRExample now={() => new Date(2025, 9, 1, 12, 0, 0)} />);

  expect(screen.getByLabelText("Start date")).toHaveValue("2015-10-01");
  expect(screen.getByLabelText("End date")).toHaveValue("2025-10-01");
  expect(screen.getByLabelText("Total return")).toHaveValue("50.2%");
  expect(screen.getByRole("status")).toHaveTextContent("4.15%");
  const initialDecimal =
    screen.getByRole("status").querySelectorAll("code")[1].textContent ?? "";
  expect(initialDecimal).not.toBe("");
  expect(Number(initialDecimal)).toBeCloseTo(0.04148, 4);

  await user.clear(screen.getByLabelText("Total return"));
  await user.type(screen.getByLabelText("Total return"), "20%abc");
  await user.click(screen.getByRole("button", { name: "Calculate CAGR" }));

  expect(screen.getByRole("alert")).toHaveTextContent(
    "totalReturnRate must be a valid percentage string."
  );
  expect(screen.getByRole("status")).not.toHaveTextContent("4.15%");
  expect(screen.getByRole("status")).not.toHaveTextContent(initialDecimal);
});

test("aspect ratio initializes and handles valid and invalid submissions", async () => {
  const user = userEvent.setup();
  render(<AspectRatioExample />);
  const width = screen.getByLabelText("Width");
  const height = screen.getByLabelText("Height");

  expect(width).toHaveValue(1920);
  expect(height).toHaveValue(1080);
  expect(screen.getByRole("status")).toHaveTextContent("16x9");

  await user.clear(width);
  await user.type(width, "3440");
  await user.clear(height);
  await user.type(height, "1440");
  await user.click(
    screen.getByRole("button", { name: "Calculate aspect ratio" })
  );
  expect(screen.getByRole("status")).toHaveTextContent("43x18");

  await user.clear(width);
  await user.type(width, "0");
  await user.click(
    screen.getByRole("button", { name: "Calculate aspect ratio" })
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "width and height must be greater than zero."
  );
  expect(screen.getByRole("status")).not.toHaveTextContent("43x18");
});

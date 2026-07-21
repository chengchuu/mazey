/** @jest-environment jsdom */
/* eslint-env browser, jest, node */

import fs from "node:fs";
import path from "node:path";
import {
  formatDateTimeLocalValue,
  initializeDateTimeExample,
  parseDateTimeInput,
  parseDurationInput,
} from "../examples/index";

function renderPlaygroundForms() {
  document.body.innerHTML = `
    <form data-date-time-form>
      <input data-date-time-start />
      <input data-date-time-end />
      <button type="submit">Calculate interval</button>
      <button type="button" data-date-time-reset>Reset to current time</button>
      <p role="alert" data-date-time-error></p>
      <code role="status" data-date-time-result></code>
    </form>
    <form data-utility-form>
      <input data-duration value="90000" />
      <input data-identifier value="helloWorld" />
      <input data-email value="dev@example.com" />
      <button type="submit">Run utilities</button>
      <p data-error></p>
      <code data-duration-result></code>
      <code data-identifier-result></code>
      <code data-email-result></code>
    </form>
  `;
}

afterEach(() => {
  document.body.innerHTML = "";
});

test.each([
  ["", null],
  ["   ", null],
  ["-1", null],
  ["Infinity", null],
  ["0", 0],
  ["90000", 90000],
])("parses playground duration %p as %p", (value, expected) => {
  expect(parseDurationInput(value)).toBe(expected);
});

test("places the date interval form before the existing utility form", () => {
  const html = fs.readFileSync(
    path.join(process.cwd(), "examples", "index.html"),
    "utf8"
  );

  expect(html.indexOf("data-date-time-form")).toBeGreaterThan(-1);
  expect(html.indexOf("data-date-time-form")).toBeLessThan(
    html.indexOf("data-utility-form")
  );
  expect(html).toContain("data-date-time-start");
  expect(html).toContain("data-date-time-end");
  expect(html).toContain('type="submit">\n                Calculate interval');
  expect(html).toContain("data-date-time-reset");
  expect(html).toContain("data-date-time-result");
  expect(html).toContain("data-date-time-error");
  expect(html.match(/type="datetime-local"/g)).toHaveLength(2);
});

test("formats datetime-local values from local components", () => {
  const localDate = new Date(2024, 0, 2, 3, 4, 5);

  expect(formatDateTimeLocalValue(localDate)).toBe("2024-01-02T03:04:05");
  expect(formatDateTimeLocalValue.toString()).not.toContain("toISOString");
});

test.each(["", "invalid", "2024-02-30T12:00:00"])(
  "rejects invalid date-time input %p",
  (value) => {
    expect(parseDateTimeInput(value)).toBeNull();
  }
);

test("calculates a valid date and time interval", () => {
  renderPlaygroundForms();
  initializeDateTimeExample(document, () => new Date(2024, 0, 1, 0, 0, 0));
  const form = document.querySelector("[data-date-time-form]");
  const start = document.querySelector("[data-date-time-start]");
  const end = document.querySelector("[data-date-time-end]");

  start.value = "2024-01-01T00:00:00";
  end.value = "2024-01-02T01:01:01";
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  expect(document.querySelector("[data-date-time-result]").textContent).toBe(
    "1 day 1 hour 1 minute 1 second"
  );
  expect(document.querySelector("[data-date-time-error]").textContent).toBe("");
});

test("shows an error for missing or reversed date-time input", () => {
  renderPlaygroundForms();
  initializeDateTimeExample(document, () => new Date(2024, 0, 1, 0, 0, 0));
  const form = document.querySelector("[data-date-time-form]");
  const start = document.querySelector("[data-date-time-start]");
  const end = document.querySelector("[data-date-time-end]");

  start.value = "";
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(document.querySelector("[data-date-time-error]").textContent).toBe(
    "Enter a valid start and end date and time."
  );
  expect(document.querySelector("[data-date-time-result]").textContent).toBe(
    ""
  );

  start.value = "2024-01-02T00:00:00";
  end.value = "2024-01-01T00:00:00";
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  expect(document.querySelector("[data-date-time-error]").textContent).toBe(
    "The start date and time must not be later than the end date and time."
  );
  expect(document.querySelector("[data-date-time-result]").textContent).toBe(
    ""
  );
});

test("reset uses a fresh current time, clears errors, and recalculates", () => {
  renderPlaygroundForms();
  const now = jest
    .fn()
    .mockReturnValueOnce(new Date(2024, 0, 1, 1, 2, 3))
    .mockReturnValueOnce(new Date(2024, 5, 7, 8, 9, 10));
  initializeDateTimeExample(document, now);
  const start = document.querySelector("[data-date-time-start]");
  const end = document.querySelector("[data-date-time-end]");
  const error = document.querySelector("[data-date-time-error]");

  expect(start.value).toBe("2024-01-01T01:02:03");
  expect(end.value).toBe("2024-01-01T01:02:03");
  error.textContent = "Previous error";
  document.querySelector("[data-date-time-reset]").click();

  expect(now).toHaveBeenCalledTimes(2);
  expect(start.value).toBe("2024-06-07T08:09:10");
  expect(end.value).toBe("2024-06-07T08:09:10");
  expect(error.textContent).toBe("");
  expect(document.querySelector("[data-date-time-result]").textContent).toBe(
    "0 seconds"
  );
});

test("existing duration, identifier, and email examples still run", () => {
  renderPlaygroundForms();
  jest.isolateModules(() => {
    require("../examples/index");
  });

  document
    .querySelector("[data-utility-form]")
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

  expect(document.querySelector("[data-duration-result]").textContent).toBe(
    "1.5 minutes"
  );
  expect(document.querySelector("[data-identifier-result]").textContent).toBe(
    "hello-world"
  );
  expect(document.querySelector("[data-email-result]").textContent).toBe(
    "true"
  );
  expect(document.querySelector("[data-error]").textContent).toBe("");
});

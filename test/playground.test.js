/** @jest-environment jsdom */
/* eslint-env browser, jest, node */

import fs from "node:fs";
import path from "node:path";
import Tab from "bootstrap/js/dist/tab";
import {
  initializeCAGRExample,
  initializeDateTimeExample,
  initializeDurationExample,
  initializePlaygroundTabs,
  parseDurationInput,
} from "../examples/index";

const tabDefinitions = [
  ["date-interval-tab", "date-interval", "Date interval"],
  ["cagr-tab", "cagr", "CAGR"],
  ["duration-tab", "duration", "Duration"],
];

function renderPlaygroundForms() {
  const tabs = tabDefinitions
    .map(
      ([tabId, panelId, label], index) => `
        <button
          id="${tabId}"
          class="nav-link${index === 0 ? " active" : ""}"
          role="tab"
          data-bs-toggle="tab"
          data-bs-target="#${panelId}"
          aria-controls="${panelId}"
          aria-selected="${index === 0 ? "true" : "false"}"
        >${label}</button>
      `
    )
    .join("");

  document.body.innerHTML = `
    <ul
      class="nav nav-tabs playground-tabs overflow-x-auto"
      role="tablist"
    >${tabs}</ul>
    <div class="tab-content">
      <div
        id="date-interval"
        class="tab-pane fade show active"
        role="tabpanel"
        aria-labelledby="date-interval-tab"
      >
        <form data-date-time-form>
          <input data-date-time-start />
          <input data-date-time-end />
          <button type="submit">Calculate interval</button>
          <button type="button" data-date-time-reset>
            Reset to current time
          </button>
          <p role="alert" data-date-time-error></p>
          <div role="status"><code data-date-time-result></code></div>
        </form>
      </div>
      <div
        id="cagr"
        class="tab-pane fade"
        role="tabpanel"
        aria-labelledby="cagr-tab"
      >
        <form data-cagr-form>
          <input data-cagr-start value="2022-04-01" />
          <input data-cagr-end value="2025-10-01" />
          <input data-cagr-return value="20.2%" />
          <button type="submit">Calculate CAGR</button>
          <p role="alert" data-cagr-error></p>
          <div role="status">
            <code data-cagr-percentage-result></code>
            <code data-cagr-decimal-result></code>
          </div>
        </form>
      </div>
      <div
        id="duration"
        class="tab-pane fade"
        role="tabpanel"
        aria-labelledby="duration-tab"
      >
        <form data-duration-form>
          <input data-duration value="90000" />
          <button type="submit">Run example</button>
          <p role="alert" data-duration-error></p>
          <div role="status"><code data-duration-result></code></div>
        </form>
      </div>
    </div>
  `;
}

function submit(selector) {
  document
    .querySelector(selector)
    .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

afterEach(() => {
  document
    .querySelectorAll('[data-bs-toggle="tab"]')
    .forEach((trigger) => Tab.getInstance(trigger)?.dispose());
  document.body.innerHTML = "";
  history.replaceState(null, "", "/");
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

test("uses accessible Bootstrap tabs with matching panels", () => {
  const html = fs.readFileSync(
    path.join(process.cwd(), "examples", "index.html"),
    "utf8"
  );
  const playground = new DOMParser().parseFromString(html, "text/html");
  const tabList = playground.querySelector('[role="tablist"]');
  const triggers = [...playground.querySelectorAll('[role="tab"]')];
  const panels = [...playground.querySelectorAll('[role="tabpanel"]')];

  expect(tabList).not.toBeNull();
  expect(tabList.classList).toContain("playground-tabs");
  expect(tabList.classList).toContain("overflow-x-auto");
  expect(triggers).toHaveLength(3);
  expect(panels).toHaveLength(3);

  tabDefinitions.forEach(([tabId, panelId, label], index) => {
    const trigger = playground.getElementById(tabId);
    const panel = playground.getElementById(panelId);

    expect(trigger.textContent.trim()).toBe(label);
    expect(trigger.dataset.bsToggle).toBe("tab");
    expect(trigger.dataset.bsTarget).toBe(`#${panelId}`);
    expect(trigger.getAttribute("aria-controls")).toBe(panelId);
    expect(panel.getAttribute("aria-labelledby")).toBe(tabId);
    expect(panel.getAttribute("tabindex")).toBeNull();
    expect(trigger.getAttribute("aria-selected")).toBe(
      index === 0 ? "true" : "false"
    );
    expect(trigger.classList.contains("active")).toBe(index === 0);
    expect(panel.classList.contains("active")).toBe(index === 0);
    expect(panel.classList.contains("show")).toBe(index === 0);
  });

  expect(playground.querySelector("#date-interval form")).toMatchObject({
    dataset: expect.objectContaining({ dateTimeForm: "" }),
  });
  expect(
    playground.querySelector("#duration [data-duration-form]")
  ).not.toBeNull();
  expect(playground.querySelector("#cagr [data-cagr-form]")).not.toBeNull();
  expect(
    [...playground.querySelectorAll("#cagr .playground-output strong")].map(
      (heading) => heading.textContent.trim()
    )
  ).toEqual(["Formatted CAGR", "Decimal CAGR"]);
  expect(playground.querySelectorAll(".playground-output")).toHaveLength(3);
  expect(playground.querySelectorAll('[role="alert"]')).toHaveLength(3);
  const ids = [...playground.querySelectorAll("[id]")].map(
    (element) => element.id
  );
  expect(new Set(ids).size).toBe(ids.length);
  expect(html).not.toContain("data-utility-form");
  expect(html).not.toContain("data-error");
});

test("hides the native tab scrollbar without disabling horizontal scrolling", () => {
  const css = fs.readFileSync(
    path.join(process.cwd(), "site", "site.css"),
    "utf8"
  );

  expect(css).toMatch(
    /\.playground-tabs\s*\{[^}]*scrollbar-width:\s*none;[^}]*\}/
  );
  expect(css).toMatch(
    /\.playground-tabs::-webkit-scrollbar\s*\{[^}]*display:\s*none;[^}]*\}/
  );
  expect(css).not.toMatch(/\.playground-tabs\s*\{[^}]*overflow-x:\s*hidden;/);
});

test("keeps the date interval controls and native local inputs", () => {
  const html = fs.readFileSync(
    path.join(process.cwd(), "examples", "index.html"),
    "utf8"
  );

  expect(html).toContain("data-date-time-start");
  expect(html).toContain("data-date-time-end");
  expect(html).toContain("Calculate interval");
  expect(html).toContain("data-date-time-reset");
  expect(html).toContain("data-date-time-result");
  expect(html).toContain("data-date-time-error");
  expect(html.match(/type="datetime-local"/g)).toHaveLength(2);
});

test("initializes every example with its expected result", () => {
  renderPlaygroundForms();
  initializeDateTimeExample(document, () => new Date(2024, 0, 1, 0, 0, 0));
  initializeCAGRExample();
  initializeDurationExample();

  expect(document.querySelector("[data-date-time-result]").textContent).toBe(
    "0 seconds"
  );
  expect(document.querySelector("[data-duration-result]").textContent).toBe(
    "1.5 minutes"
  );
  expect(
    Number(document.querySelector("[data-cagr-decimal-result]").textContent)
  ).toBeCloseTo(0.05390890296644435, 14);
  expect(
    document.querySelector("[data-cagr-percentage-result]").textContent
  ).toBe("5.39%");
});

test("passes the CAGR return string directly and renders both result forms", () => {
  renderPlaygroundForms();
  initializeCAGRExample();
  const initialResult = Number(
    document.querySelector("[data-cagr-decimal-result]").textContent
  );
  document.querySelector("[data-cagr-return]").value = "20.2";

  submit("[data-cagr-form]");

  expect(
    Number(document.querySelector("[data-cagr-decimal-result]").textContent)
  ).toBeCloseTo(initialResult, 14);
  expect(
    document.querySelector("[data-cagr-percentage-result]").textContent
  ).toBe("5.39%");
  expect(document.querySelector("[data-cagr-error]").textContent).toBe("");
});

test("shows a CAGR validation error without stale results", () => {
  renderPlaygroundForms();
  initializeCAGRExample();
  document.querySelector("[data-cagr-return]").value = "20%abc";

  submit("[data-cagr-form]");

  expect(document.querySelector("[data-cagr-error]").textContent).toContain(
    "totalReturnRate must be a valid percentage string."
  );
  expect(document.querySelector("[data-cagr-decimal-result]").textContent).toBe(
    ""
  );
  expect(
    document.querySelector("[data-cagr-percentage-result]").textContent
  ).toBe("");
});

test("calculates a valid date and time interval", () => {
  renderPlaygroundForms();
  initializeDateTimeExample(document, () => new Date(2024, 0, 1, 0, 0, 0));
  const start = document.querySelector("[data-date-time-start]");
  const end = document.querySelector("[data-date-time-end]");

  start.value = "2024-01-01T00:00:00";
  end.value = "2024-01-02T01:01:01";
  submit("[data-date-time-form]");

  expect(document.querySelector("[data-date-time-result]").textContent).toBe(
    "1 day 1 hour 1 minute 1 second"
  );
  expect(document.querySelector("[data-date-time-error]").textContent).toBe("");
});

test("shows an error for missing or reversed date-time input", () => {
  renderPlaygroundForms();
  initializeDateTimeExample(document, () => new Date(2024, 0, 1, 0, 0, 0));
  const start = document.querySelector("[data-date-time-start]");
  const end = document.querySelector("[data-date-time-end]");

  start.value = "";
  submit("[data-date-time-form]");
  expect(document.querySelector("[data-date-time-error]").textContent).toBe(
    "Enter a valid start and end date and time."
  );
  expect(document.querySelector("[data-date-time-result]").textContent).toBe(
    ""
  );

  start.value = "2024-01-02T00:00:00";
  end.value = "2024-01-01T00:00:00";
  submit("[data-date-time-form]");
  expect(document.querySelector("[data-date-time-error]").textContent).toBe(
    "The start date and time must not be later than the end date and time."
  );
  expect(document.querySelector("[data-date-time-result]").textContent).toBe(
    ""
  );
});

test("date reset uses a fresh current time, clears errors, and recalculates", () => {
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

test("duration submission updates only the duration result", () => {
  renderPlaygroundForms();
  initializeDurationExample();
  document.querySelector("[data-cagr-decimal-result]").textContent =
    "unchanged";
  document.querySelector("[data-duration]").value = "120000";

  submit("[data-duration-form]");

  expect(document.querySelector("[data-duration-result]").textContent).toBe(
    "2 minutes"
  );
  expect(document.querySelector("[data-cagr-decimal-result]").textContent).toBe(
    "unchanged"
  );
});

test("invalid duration shows only the duration error", () => {
  renderPlaygroundForms();
  initializeDurationExample();
  initializeCAGRExample();
  document.querySelector("[data-duration]").value = "-1";

  submit("[data-duration-form]");

  expect(document.querySelector("[data-duration-error]").textContent).toBe(
    "Enter a finite duration of zero milliseconds or more."
  );
  expect(document.querySelector("[data-duration-result]").textContent).toBe("");
  expect(document.querySelector("[data-cagr-error]").textContent).toBe("");
});

test("initializers tolerate incomplete markup", () => {
  document.body.innerHTML = `
    <form data-date-time-form></form>
    <form data-duration-form><input data-duration /></form>
    <form data-cagr-form><input data-cagr-start /></form>
  `;

  expect(() => initializePlaygroundTabs()).not.toThrow();
  expect(() => initializeDateTimeExample()).not.toThrow();
  expect(() => initializeCAGRExample()).not.toThrow();
  expect(() => initializeDurationExample()).not.toThrow();
});

test("Bootstrap Tab initialization reuses existing instances", () => {
  renderPlaygroundForms();
  initializePlaygroundTabs();
  const triggers = [...document.querySelectorAll('[data-bs-toggle="tab"]')];
  const firstInstances = triggers.map((trigger) => Tab.getInstance(trigger));

  expect(firstInstances.every(Boolean)).toBe(true);
  initializePlaygroundTabs();
  expect(triggers.map((trigger) => Tab.getInstance(trigger))).toEqual(
    firstInstances
  );
});

test("keeps the playground URL unchanged when it has no fragment", () => {
  renderPlaygroundForms();
  const windowRef = {
    history: { replaceState: jest.fn() },
    location: { hash: "" },
  };

  initializePlaygroundTabs(document, windowRef);

  expect(document.getElementById("date-interval-tab").classList).toContain(
    "active"
  );
  expect(windowRef.history.replaceState).not.toHaveBeenCalled();
});

test("activates the tab targeted by the initial URL hash", () => {
  renderPlaygroundForms();
  const windowRef = {
    history: { replaceState: jest.fn() },
    location: { hash: "#cagr" },
  };

  initializePlaygroundTabs(document, windowRef);

  expect(document.getElementById("cagr-tab").classList).toContain("active");
  expect(document.getElementById("cagr").classList).toContain("active");
  expect(document.getElementById("date-interval-tab").classList).not.toContain(
    "active"
  );
});

test("ignores an unknown initial URL hash", () => {
  renderPlaygroundForms();
  const windowRef = {
    history: { replaceState: jest.fn() },
    location: { hash: "#unknown-example" },
  };

  initializePlaygroundTabs(document, windowRef);

  expect(document.getElementById("date-interval-tab").classList).toContain(
    "active"
  );
  expect(windowRef.history.replaceState).not.toHaveBeenCalled();
});

test("updates the hash and scrolls a shown tab without duplicate listeners", () => {
  renderPlaygroundForms();
  const cagrTab = document.getElementById("cagr-tab");
  const windowRef = {
    history: { replaceState: jest.fn() },
    location: { hash: "#date-interval" },
  };
  cagrTab.scrollIntoView = jest.fn();

  initializePlaygroundTabs(document, windowRef);
  initializePlaygroundTabs(document, windowRef);
  cagrTab.dispatchEvent(new Event("shown.bs.tab", { bubbles: true }));

  expect(cagrTab.scrollIntoView).toHaveBeenCalledTimes(1);
  expect(cagrTab.scrollIntoView).toHaveBeenCalledWith({
    block: "nearest",
    inline: "nearest",
  });
  expect(windowRef.history.replaceState).toHaveBeenCalledTimes(1);
  expect(windowRef.history.replaceState).toHaveBeenCalledWith(
    null,
    "",
    "#cagr"
  );
});

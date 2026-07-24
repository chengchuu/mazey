/** @jest-environment jsdom */
/* eslint-env browser, jest, node */

import fs from "node:fs";
import path from "node:path";
import Tab from "bootstrap/js/dist/tab";
import {
  formatDateTimeLocalValue,
  initializeDateTimeExample,
  initializeDurationExample,
  initializeEmailExample,
  initializeIdentifierExample,
  initializePlaygroundTabs,
  parseDateTimeInput,
  parseDurationInput,
} from "../examples/index";

const tabDefinitions = [
  ["date-interval-tab", "date-interval", "Date interval"],
  ["duration-tab", "duration", "Duration"],
  ["identifier-tab", "identifier", "Identifier"],
  ["email-tab", "email", "Email"],
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
      <div
        id="identifier"
        class="tab-pane fade"
        role="tabpanel"
        aria-labelledby="identifier-tab"
      >
        <form data-identifier-form>
          <input data-identifier value="helloWorld" />
          <button type="submit">Run example</button>
          <p role="alert" data-identifier-error></p>
          <div role="status"><code data-identifier-result></code></div>
        </form>
      </div>
      <div
        id="email"
        class="tab-pane fade"
        role="tabpanel"
        aria-labelledby="email-tab"
      >
        <form data-email-form>
          <input data-email value="dev@example.com" />
          <button type="submit">Run example</button>
          <p role="alert" data-email-error></p>
          <div role="status"><code data-email-result></code></div>
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

test("uses four accessible Bootstrap tabs with matching panels", () => {
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
  expect(triggers).toHaveLength(4);
  expect(panels).toHaveLength(4);

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
  expect(
    playground.querySelector("#identifier [data-identifier-form]")
  ).not.toBeNull();
  expect(playground.querySelector("#email [data-email-form]")).not.toBeNull();
  expect(playground.querySelectorAll(".playground-output")).toHaveLength(4);
  expect(playground.querySelectorAll('[role="alert"]')).toHaveLength(4);
  const ids = [...playground.querySelectorAll("[id]")].map(
    (element) => element.id
  );
  expect(new Set(ids).size).toBe(ids.length);
  expect(
    playground.querySelector('label[for="identifier-value"]').control
  ).toBe(playground.getElementById("identifier-value"));
  expect(playground.querySelector('label[for="email-address"]').control).toBe(
    playground.getElementById("email-address")
  );
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

test("initializes every example with its expected result", () => {
  renderPlaygroundForms();
  initializeDateTimeExample(document, () => new Date(2024, 0, 1, 0, 0, 0));
  initializeDurationExample();
  initializeIdentifierExample();
  initializeEmailExample();

  expect(document.querySelector("[data-date-time-result]").textContent).toBe(
    "0 seconds"
  );
  expect(document.querySelector("[data-duration-result]").textContent).toBe(
    "1.5 minutes"
  );
  expect(document.querySelector("[data-identifier-result]").textContent).toBe(
    "hello-world"
  );
  expect(document.querySelector("[data-email-result]").textContent).toBe(
    "true"
  );
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
  document.querySelector("[data-identifier-result]").textContent = "unchanged";
  document.querySelector("[data-email-result]").textContent = "unchanged";
  document.querySelector("[data-duration]").value = "120000";

  submit("[data-duration-form]");

  expect(document.querySelector("[data-duration-result]").textContent).toBe(
    "2 minutes"
  );
  expect(document.querySelector("[data-identifier-result]").textContent).toBe(
    "unchanged"
  );
  expect(document.querySelector("[data-email-result]").textContent).toBe(
    "unchanged"
  );
});

test("identifier submission updates only the identifier result", () => {
  renderPlaygroundForms();
  initializeIdentifierExample();
  document.querySelector("[data-duration-result]").textContent = "unchanged";
  document.querySelector("[data-email-result]").textContent = "unchanged";
  document.querySelector("[data-identifier]").value = "newIdentifier";

  submit("[data-identifier-form]");

  expect(document.querySelector("[data-identifier-result]").textContent).toBe(
    "new-identifier"
  );
  expect(document.querySelector("[data-duration-result]").textContent).toBe(
    "unchanged"
  );
  expect(document.querySelector("[data-email-result]").textContent).toBe(
    "unchanged"
  );
});

test("email submission updates only the email result", () => {
  renderPlaygroundForms();
  initializeEmailExample();
  document.querySelector("[data-duration-result]").textContent = "unchanged";
  document.querySelector("[data-identifier-result]").textContent = "unchanged";
  document.querySelector("[data-email]").value = "invalid";

  submit("[data-email-form]");

  expect(document.querySelector("[data-email-result]").textContent).toBe(
    "false"
  );
  expect(document.querySelector("[data-duration-result]").textContent).toBe(
    "unchanged"
  );
  expect(document.querySelector("[data-identifier-result]").textContent).toBe(
    "unchanged"
  );
});

test("invalid duration shows only the duration error", () => {
  renderPlaygroundForms();
  initializeDurationExample();
  initializeIdentifierExample();
  initializeEmailExample();
  document.querySelector("[data-duration]").value = "-1";

  submit("[data-duration-form]");

  expect(document.querySelector("[data-duration-error]").textContent).toBe(
    "Enter a finite duration of zero milliseconds or more."
  );
  expect(document.querySelector("[data-duration-result]").textContent).toBe("");
  expect(document.querySelector("[data-identifier-error]").textContent).toBe(
    ""
  );
  expect(document.querySelector("[data-email-error]").textContent).toBe("");
});

test("initializers tolerate incomplete markup", () => {
  document.body.innerHTML = `
    <form data-date-time-form></form>
    <form data-duration-form><input data-duration /></form>
    <form data-identifier-form><input data-identifier /></form>
    <form data-email-form><input data-email /></form>
  `;

  expect(() => initializePlaygroundTabs()).not.toThrow();
  expect(() => initializeDateTimeExample()).not.toThrow();
  expect(() => initializeDurationExample()).not.toThrow();
  expect(() => initializeIdentifierExample()).not.toThrow();
  expect(() => initializeEmailExample()).not.toThrow();
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
    location: { hash: "#email" },
  };

  initializePlaygroundTabs(document, windowRef);

  expect(document.getElementById("email-tab").classList).toContain("active");
  expect(document.getElementById("email").classList).toContain("active");
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
  const emailTab = document.getElementById("email-tab");
  const windowRef = {
    history: { replaceState: jest.fn() },
    location: { hash: "#date-interval" },
  };
  emailTab.scrollIntoView = jest.fn();

  initializePlaygroundTabs(document, windowRef);
  initializePlaygroundTabs(document, windowRef);
  emailTab.dispatchEvent(new Event("shown.bs.tab", { bubbles: true }));

  expect(emailTab.scrollIntoView).toHaveBeenCalledTimes(1);
  expect(emailTab.scrollIntoView).toHaveBeenCalledWith({
    block: "nearest",
    inline: "nearest",
  });
  expect(windowRef.history.replaceState).toHaveBeenCalledTimes(1);
  expect(windowRef.history.replaceState).toHaveBeenCalledWith(
    null,
    "",
    "#email"
  );
});

import Tab from "bootstrap/js/dist/tab";

import {
  calculateCAGR,
  floatToPercent,
  formatDate,
  formatDurationFromMs,
  formatLocalDateTime,
  getDateDifference,
  parseLocalDateTime,
} from "../src";

const initializedTabTriggers = new WeakSet<HTMLElement>();

type PlaygroundWindow = Pick<Window, "history" | "location">;

function getTabHash(trigger: HTMLElement): string | null {
  const target = trigger.getAttribute("data-bs-target");
  return target?.startsWith("#") && target.length > 1 ? target : null;
}

function replaceTabHash(windowRef: PlaygroundWindow, hash: string): void {
  if (windowRef.location.hash === hash) return;
  try {
    windowRef.history.replaceState(null, "", hash);
  } catch {
    // History may be unavailable in restricted browser environments.
  }
}

export function parseDurationInput(value: string): number | null {
  if (!value.trim()) return null;
  const duration = Number(value);
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
}

export function initializePlaygroundTabs(
  root: ParentNode = document,
  windowRef: PlaygroundWindow = window
): void {
  const triggers = Array.from(
    root.querySelectorAll<HTMLElement>('[data-bs-toggle="tab"]')
  );

  triggers.forEach((trigger) => {
    Tab.getOrCreateInstance(trigger);
    if (initializedTabTriggers.has(trigger)) return;

    trigger.addEventListener("shown.bs.tab", () => {
      trigger.scrollIntoView?.({
        block: "nearest",
        inline: "nearest",
      });
      const hash = getTabHash(trigger);
      if (hash) replaceTabHash(windowRef, hash);
    });
    initializedTabTriggers.add(trigger);
  });

  const hash = windowRef.location.hash;
  const hashTrigger = triggers.find((trigger) => getTabHash(trigger) === hash);
  if (hashTrigger) {
    Tab.getOrCreateInstance(hashTrigger).show();
  }
}

export function initializeDateTimeExample(
  root: ParentNode = document,
  now: () => Date = () => new Date()
): void {
  const form = root.querySelector<HTMLFormElement>("[data-date-time-form]");
  const startInput = root.querySelector<HTMLInputElement>(
    "[data-date-time-start]"
  );
  const endInput = root.querySelector<HTMLInputElement>("[data-date-time-end]");
  const resetButton = root.querySelector<HTMLButtonElement>(
    "[data-date-time-reset]"
  );
  const error = root.querySelector<HTMLElement>("[data-date-time-error]");
  const result = root.querySelector<HTMLElement>("[data-date-time-result]");

  if (!form || !startInput || !endInput || !resetButton || !error || !result) {
    return;
  }

  const run = (): void => {
    error.textContent = "";
    result.textContent = "";
    const start = parseLocalDateTime(startInput.value);
    const end = parseLocalDateTime(endInput.value);

    if (!start || !end) {
      error.textContent = "Enter a valid start and end date and time.";
      return;
    }
    if (start.getTime() > end.getTime()) {
      error.textContent =
        "The start date and time must not be later than the end date and time.";
      return;
    }

    result.textContent = String(
      getDateDifference(start, end, { type: "text" })
    );
  };

  const reset = (): void => {
    const currentValue = formatLocalDateTime(now(), { precision: "second" });
    startInput.value = currentValue;
    endInput.value = currentValue;
    error.textContent = "";
    run();
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  resetButton.addEventListener("click", reset);
  reset();
}

export function initializeCAGRExample(
  root: ParentNode = document,
  now: () => Date = () => new Date()
): void {
  const form = root.querySelector<HTMLFormElement>("[data-cagr-form]");
  const startInput = root.querySelector<HTMLInputElement>("[data-cagr-start]");
  const endInput = root.querySelector<HTMLInputElement>("[data-cagr-end]");
  const returnInput =
    root.querySelector<HTMLInputElement>("[data-cagr-return]");
  const error = root.querySelector<HTMLElement>("[data-cagr-error]");
  const percentageResult = root.querySelector<HTMLElement>(
    "[data-cagr-percentage-result]"
  );
  const decimalResult = root.querySelector<HTMLElement>(
    "[data-cagr-decimal-result]"
  );
  if (
    !form ||
    !startInput ||
    !endInput ||
    !returnInput ||
    !error ||
    !percentageResult ||
    !decimalResult
  ) {
    return;
  }

  const run = (): void => {
    error.textContent = "";
    percentageResult.textContent = "";
    decimalResult.textContent = "";
    try {
      const cagr = calculateCAGR(
        startInput.value,
        endInput.value,
        returnInput.value
      );
      percentageResult.textContent = floatToPercent(cagr, 2);
      decimalResult.textContent = String(cagr);
    } catch (cause) {
      error.textContent =
        cause instanceof Error
          ? `The CAGR example could not run: ${cause.message}`
          : "The CAGR example could not run because of an unexpected error.";
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  endInput.value = formatDate(now(), "yyyy-MM-dd");
  run();
}

export function initializeDurationExample(root: ParentNode = document): void {
  const form = root.querySelector<HTMLFormElement>("[data-duration-form]");
  const input = root.querySelector<HTMLInputElement>("[data-duration]");
  const error = root.querySelector<HTMLElement>("[data-duration-error]");
  const result = root.querySelector<HTMLElement>("[data-duration-result]");
  if (!form || !input || !error || !result) return;

  const run = (): void => {
    error.textContent = "";
    result.textContent = "";
    const duration = parseDurationInput(input.value);
    if (duration === null) {
      error.textContent =
        "Enter a finite duration of zero milliseconds or more.";
      return;
    }

    try {
      result.textContent = formatDurationFromMs(duration);
    } catch (cause) {
      error.textContent =
        cause instanceof Error
          ? `The duration example could not run: ${cause.message}`
          : "The duration example could not run because of an unexpected error.";
    }
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  run();
}

initializePlaygroundTabs();
initializeDateTimeExample();
initializeCAGRExample();
initializeDurationExample();

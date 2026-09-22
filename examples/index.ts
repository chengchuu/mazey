import {
  convertCamelToKebab,
  formatDurationFromMs,
  getDateDifference,
  isValidDate,
  isValidEmail,
} from "../src";

const form = document.querySelector<HTMLFormElement>("[data-utility-form]");
const durationInput =
  document.querySelector<HTMLInputElement>("[data-duration]");
const identifierInput =
  document.querySelector<HTMLInputElement>("[data-identifier]");
const emailInput = document.querySelector<HTMLInputElement>("[data-email]");
const durationResult = document.querySelector<HTMLElement>(
  "[data-duration-result]"
);
const identifierResult = document.querySelector<HTMLElement>(
  "[data-identifier-result]"
);
const emailResult = document.querySelector<HTMLElement>("[data-email-result]");
const error = document.querySelector<HTMLElement>("[data-error]");

export function parseDurationInput(value: string): number | null {
  if (!value.trim()) return null;
  const duration = Number(value);
  return Number.isFinite(duration) && duration >= 0 ? duration : null;
}

export function formatDateTimeLocalValue(date: Date): string {
  const pad = (value: number): string =>
    value < 10 ? `0${value}` : String(value);

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`,
  ].join("T");
}

export function parseDateTimeInput(value: string): Date | null {
  const trimmedValue = value.trim();
  if (!isValidDate(trimmedValue)) return null;

  const date = new Date(trimmedValue);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function initializeDateTimeExample(
  root: ParentNode = document,
  now: () => Date = () => new Date()
): void {
  const dateTimeForm = root.querySelector<HTMLFormElement>(
    "[data-date-time-form]"
  );
  const startInput = root.querySelector<HTMLInputElement>(
    "[data-date-time-start]"
  );
  const endInput = root.querySelector<HTMLInputElement>("[data-date-time-end]");
  const resetButton = root.querySelector<HTMLButtonElement>(
    "[data-date-time-reset]"
  );
  const result = root.querySelector<HTMLElement>("[data-date-time-result]");
  const dateTimeError = root.querySelector<HTMLElement>(
    "[data-date-time-error]"
  );

  if (
    !dateTimeForm ||
    !startInput ||
    !endInput ||
    !resetButton ||
    !result ||
    !dateTimeError
  ) {
    return;
  }

  const runDateTimeExample = (): void => {
    dateTimeError.textContent = "";
    result.textContent = "";
    const start = parseDateTimeInput(startInput.value);
    const end = parseDateTimeInput(endInput.value);

    if (!start || !end) {
      dateTimeError.textContent = "Enter a valid start and end date and time.";
      return;
    }
    if (start.getTime() > end.getTime()) {
      dateTimeError.textContent =
        "The start date and time must not be later than the end date and time.";
      return;
    }

    result.textContent = String(
      getDateDifference(start, end, { type: "text" })
    );
  };

  const resetDateTimeExample = (): void => {
    const currentValue = formatDateTimeLocalValue(now());
    startInput.value = currentValue;
    endInput.value = currentValue;
    dateTimeError.textContent = "";
    runDateTimeExample();
  };

  dateTimeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runDateTimeExample();
  });
  resetButton.addEventListener("click", resetDateTimeExample);
  resetDateTimeExample();
}

function runExamples(): void {
  if (
    !durationInput ||
    !identifierInput ||
    !emailInput ||
    !durationResult ||
    !identifierResult ||
    !emailResult ||
    !error
  ) {
    return;
  }

  error.textContent = "";
  const duration = parseDurationInput(durationInput.value);
  if (duration === null) {
    error.textContent = "Enter a finite duration of zero milliseconds or more.";
    return;
  }

  try {
    durationResult.textContent = formatDurationFromMs(duration);
    identifierResult.textContent = convertCamelToKebab(identifierInput.value);
    emailResult.textContent = String(isValidEmail(emailInput.value));
  } catch (cause) {
    error.textContent =
      cause instanceof Error
        ? `The utilities could not run: ${cause.message}`
        : "The utilities could not run because of an unexpected error.";
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  runExamples();
});

initializeDateTimeExample();

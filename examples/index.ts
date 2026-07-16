import {
  convertCamelToKebab,
  formatDurationFromMs,
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

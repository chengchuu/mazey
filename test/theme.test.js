/** @jest-environment jsdom */
/* eslint-env browser, jest */

import { jest } from "@jest/globals";
import projectConfig from "../project.config";
import { initializeThemeControls } from "../site/theme";

const { colorPrimary, primary, storageKey } = projectConfig.site.theme;
const darkThemeColor = primary.dark.base;

afterEach(() => {
  localStorage.clear();
});

function renderThemeControl() {
  document.documentElement.removeAttribute("data-theme-controls-ready");
  document.head.innerHTML = `
    <meta name="theme-color" content="${colorPrimary}" data-theme-color
      data-theme-color-light="${colorPrimary}" data-theme-color-dark="${darkThemeColor}">
  `;
  document.body.innerHTML = `
    <label>Theme
      <select data-theme-select>
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  `;
}

test("theme initialization tolerates inaccessible local storage", () => {
  renderThemeControl();
  const media = {
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const windowRef = {
    get localStorage() {
      throw new DOMException("Storage unavailable", "SecurityError");
    },
    matchMedia: () => media,
  };

  let cleanup;
  expect(() => {
    cleanup = initializeThemeControls(storageKey, document, windowRef);
  }).not.toThrow();
  expect(document.documentElement.dataset.bsTheme).toBe("dark");
  cleanup();
});

test("theme changes support legacy MediaQueryList listeners", () => {
  renderThemeControl();
  localStorage.clear();
  const media = {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
  const windowRef = {
    localStorage,
    matchMedia: () => media,
  };
  const cleanup = initializeThemeControls(storageKey, document, windowRef);

  expect(media.addListener).toHaveBeenCalledTimes(1);
  cleanup();
  expect(media.removeListener).toHaveBeenCalledTimes(1);
});

test("theme changes keep browser chrome aligned with the primary palette", () => {
  renderThemeControl();
  localStorage.setItem(storageKey, "light");
  const media = {
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const cleanup = initializeThemeControls(storageKey, document, {
    localStorage,
    matchMedia: () => media,
  });
  const meta = document.querySelector('meta[name="theme-color"]');

  expect(meta.content).toBe(colorPrimary);
  const select = document.querySelector("[data-theme-select]");
  select.value = "dark";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  expect(meta.content).toBe(darkThemeColor);

  cleanup();
});

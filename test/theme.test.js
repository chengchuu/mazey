/** @jest-environment jsdom */
/* eslint-env browser, jest */

import { jest } from "@jest/globals";
import projectConfig from "../project.config";
import { initializeThemeControls } from "../site/theme";

const { colorDark, colorLight, storageKey } = projectConfig.site.theme;

function renderThemeControl() {
  document.documentElement.removeAttribute("data-theme-controls-ready");
  document.head.innerHTML = `
    <meta name="theme-color" content="${colorLight}" data-theme-color
      data-theme-color-light="${colorLight}" data-theme-color-dark="${colorDark}">
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

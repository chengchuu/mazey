/** @jest-environment jsdom */
/* eslint-env browser, jest */

import { jest } from "@jest/globals";
import projectConfig from "../project.config";
import { initializeThemeControls } from "../site/theme";

const { colorPrimary, colorLight, colorDark, storageKey } =
  projectConfig.site.theme;

afterEach(() => {
  localStorage.clear();
});

function renderThemeControl() {
  document.documentElement.removeAttribute("data-theme-controls-ready");
  document.head.innerHTML = `
    <meta name="theme-color" content="${colorPrimary}" data-theme-color
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

test("theme changes use standard MediaQueryList listeners", () => {
  renderThemeControl();
  localStorage.clear();
  const media = {
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const windowRef = {
    localStorage,
    matchMedia: () => media,
  };
  const cleanup = initializeThemeControls(storageKey, document, windowRef);

  expect(media.addEventListener).toHaveBeenCalledTimes(1);
  cleanup();
  expect(media.removeEventListener).toHaveBeenCalledTimes(1);
});

test("theme changes keep browser chrome aligned with navbar backgrounds", () => {
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

  expect(meta.content).toBe(colorLight);
  const select = document.querySelector("[data-theme-select]");
  select.value = "dark";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  expect(meta.content).toBe(colorDark);

  cleanup();
});

test("theme initialization honors a URL override", () => {
  renderThemeControl();
  localStorage.setItem(storageKey, "light");
  const media = {
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const cleanup = initializeThemeControls(storageKey, document, {
    location: { href: "https://example.com/?theme=dark" },
    localStorage,
    matchMedia: () => media,
  });

  expect(document.documentElement.dataset.bsTheme).toBe("dark");
  expect(document.querySelector("[data-theme-select]").value).toBe("dark");
  expect(localStorage.getItem(storageKey)).toBe("light");

  cleanup();
});

test("stored system preference keeps its selection and resolves through media", () => {
  renderThemeControl();
  localStorage.setItem(storageKey, "system");
  const media = {
    matches: true,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const cleanup = initializeThemeControls(storageKey, document, {
    location: { href: "https://example.com/" },
    localStorage,
    matchMedia: () => media,
  });

  expect(document.documentElement.dataset.bsTheme).toBe("dark");
  expect(document.querySelector("[data-theme-select]").value).toBe("system");

  cleanup();
});

test("system changes keep working after replacing a URL override", () => {
  renderThemeControl();
  localStorage.setItem(storageKey, "light");
  const media = {
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };
  const cleanup = initializeThemeControls(storageKey, document, {
    location: { href: "https://example.com/?theme=dark" },
    localStorage,
    matchMedia: () => media,
  });
  const select = document.querySelector("[data-theme-select]");

  select.value = "system";
  select.dispatchEvent(new Event("change", { bubbles: true }));
  expect(document.documentElement.dataset.bsTheme).toBe("light");

  media.matches = true;
  media.addEventListener.mock.calls[0][1]();
  expect(document.documentElement.dataset.bsTheme).toBe("dark");
  expect(select.value).toBe("system");
  expect(localStorage.getItem(storageKey)).toBe("system");

  cleanup();
});

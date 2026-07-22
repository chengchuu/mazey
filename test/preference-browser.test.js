/** @jest-environment jsdom */
/* eslint-env browser, jest */

import {
  resolveLanguagePreference,
  resolveThemePreference,
} from "../lib/index.esm";

function createCrossRealmUrl(value) {
  const iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  const url = new iframe.contentWindow.URL(value);
  iframe.remove();
  return url;
}

test("language preference accepts a URL created in another realm", () => {
  const url = createCrossRealmUrl("https://example.com/?lang=ja");

  expect(url).not.toBeInstanceOf(URL);
  expect(
    resolveLanguagePreference({
      storageKey: "PROJECT_LANGUAGE",
      languages: [
        { value: "en", label: "English" },
        { value: "ja", label: "日本語" },
      ],
      fallback: "en",
      url,
      storage: null,
      navigatorLanguages: [],
    })
  ).toMatchObject({
    preference: "ja",
    resolvedLanguage: "ja",
    source: "query",
  });
});

test("theme preference accepts a URL created in another realm", () => {
  const url = createCrossRealmUrl("https://example.com/?theme=dark");

  expect(url).not.toBeInstanceOf(URL);
  expect(
    resolveThemePreference({
      storageKey: "PROJECT_THEME",
      url,
      storage: null,
      matchMedia: () => ({ matches: false }),
    })
  ).toMatchObject({
    preference: "dark",
    resolvedTheme: "dark",
    source: "query",
  });
});

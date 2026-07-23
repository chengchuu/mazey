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
      languages: [ "en", "ja" ],
      fallback: "en",
      url,
      storage: null,
      navigatorLanguage: null,
    })
  ).toBe("ja");
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

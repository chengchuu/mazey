/** @jest-environment node */
/* eslint-env jest, node */

import {
  resolveLanguagePreference,
  setLanguagePreference,
} from "../lib/index.esm";

const storageKey = "PROJECT_LANGUAGE";

function createStorage(value = null) {
  return {
    getItem: jest.fn(() => value),
    setItem: jest.fn(),
  };
}

function createWindow({
  url = "https://example.com/",
  storage = createStorage(),
} = {}) {
  return {
    location: { href: url },
    localStorage: storage,
  };
}

function withGlobal(name, value, callback) {
  const descriptor = Object.getOwnPropertyDescriptor(global, name);
  if (value === undefined) {
    delete global[name];
  } else {
    Object.defineProperty(global, name, {
      configurable: true,
      value,
    });
  }
  try {
    return callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(global, name, descriptor);
    } else {
      delete global[name];
    }
  }
}

function withBrowser({ windowValue, navigatorValue }, callback) {
  return withGlobal("window", windowValue, () =>
    withGlobal("navigator", navigatorValue, callback)
  );
}

function withIntlProperty(name, value, callback) {
  const descriptor = Object.getOwnPropertyDescriptor(Intl, name);
  Object.defineProperty(Intl, name, {
    configurable: true,
    value,
  });
  try {
    return callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(Intl, name, descriptor);
    } else {
      delete Intl[name];
    }
  }
}

function expectLanguageResult(result, value, label = `Label: ${value}`) {
  expect(result).toEqual({ value, label });
  expect(Object.keys(result).sort()).toEqual([ "label", "value" ]);
}

class MockDisplayNames {
  of(value) {
    return `Label: ${value}`;
  }
}

function withMockDisplayNames(callback) {
  return withIntlProperty("DisplayNames", MockDisplayNames, callback);
}

describe("resolveLanguagePreference URL priority", () => {
  test.each([
    [ "ja", "ja" ],
    [ "ja-JP", "ja-JP" ],
    [ "ZH_cn", "zh-CN" ],
  ])("resolves and canonicalizes ?lang=%s", (query, expected) => {
    const storage = createStorage("en-US");
    withMockDisplayNames(() =>
      withBrowser(
        {
          windowValue: createWindow({
            url: `https://example.com/?lang=${query}`,
            storage,
          }),
          navigatorValue: { language: "en-GB" },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            expected
          );
        }
      )
    );
    expect(storage.getItem).not.toHaveBeenCalled();
  });

  test("URL query overrides storage and navigator.language", () => {
    withMockDisplayNames(() =>
      withBrowser(
        {
          windowValue: createWindow({
            url: "https://example.com/?lang=ja-JP",
            storage: createStorage("zh-CN"),
          }),
          navigatorValue: { language: "en-US" },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            "ja-JP"
          );
        }
      )
    );
  });

  test("malformed query falls through to storage", () => {
    withMockDisplayNames(() =>
      withBrowser(
        {
          windowValue: createWindow({
            url: "https://example.com/?lang=not%20a%20locale",
            storage: createStorage("zh-CN"),
          }),
          navigatorValue: { language: "en-US" },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            "zh-CN"
          );
        }
      )
    );
  });

  test("uses only the first duplicate query value", () => {
    withMockDisplayNames(() =>
      withBrowser(
        {
          windowValue: createWindow({
            url: "https://example.com/?lang=ja&lang=zh-CN",
          }),
          navigatorValue: { language: "en-US" },
        },
        () => {
          expectLanguageResult(resolveLanguagePreference(storageKey), "ja");
        }
      )
    );
  });
});

describe("resolveLanguagePreference storage and browser behavior", () => {
  test("stored language overrides navigator.language", () => {
    withMockDisplayNames(() =>
      withBrowser(
        {
          windowValue: createWindow({ storage: createStorage("zh-CN") }),
          navigatorValue: { language: "ja-JP" },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            "zh-CN"
          );
        }
      )
    );
  });

  test("malformed storage falls through to navigator.language", () => {
    withMockDisplayNames(() =>
      withBrowser(
        {
          windowValue: createWindow({
            storage: createStorage("not a locale"),
          }),
          navigatorValue: { language: "ja-JP" },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            "ja-JP"
          );
        }
      )
    );
  });

  test("uses navigator.language and ignores navigator.languages", () => {
    withMockDisplayNames(() =>
      withBrowser(
        {
          windowValue: createWindow(),
          navigatorValue: {
            language: "ja-JP",
            languages: [ "zh-CN", "en-US" ],
          },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            "ja-JP"
          );
        }
      )
    );
  });

  test.each([
    [ "EN_us", "en-US" ],
    [ "zh_hans_cn", "zh-Hans-CN" ],
    [ "JA-jp", "ja-JP" ],
  ])("canonicalizes browser language %s", (language, expected) => {
    withMockDisplayNames(() =>
      withBrowser(
        {
          windowValue: createWindow(),
          navigatorValue: { language },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            expected
          );
        }
      )
    );
  });

  test("uses the fixed fallback for malformed or unavailable navigator", () => {
    withMockDisplayNames(() => {
      withBrowser(
        {
          windowValue: createWindow(),
          navigatorValue: { language: "not a locale" },
        },
        () => {
          expectLanguageResult(resolveLanguagePreference(storageKey), "en");
        }
      );
      withBrowser(
        { windowValue: createWindow(), navigatorValue: undefined },
        () => {
          expectLanguageResult(resolveLanguagePreference(storageKey), "en");
        }
      );
    });
  });

  test("handles throwing storage and navigator access", () => {
    const windowValue = createWindow();
    Object.defineProperty(windowValue, "localStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
    const navigatorValue = {};
    Object.defineProperty(navigatorValue, "language", {
      get() {
        throw new Error("Navigator unavailable");
      },
    });
    withMockDisplayNames(() =>
      withBrowser({ windowValue, navigatorValue }, () => {
        expectLanguageResult(resolveLanguagePreference(storageKey), "en");
      })
    );
  });

  test("returns the fixed fallback during SSR", () => {
    withMockDisplayNames(() =>
      withBrowser(
        { windowValue: undefined, navigatorValue: undefined },
        () => {
          expectLanguageResult(resolveLanguagePreference(storageKey), "en");
        }
      )
    );
  });

  test("ignores a Node-style navigator when window is unavailable", () => {
    withMockDisplayNames(() =>
      withBrowser(
        {
          windowValue: undefined,
          navigatorValue: { language: "ja-JP" },
        },
        () => {
          expectLanguageResult(resolveLanguagePreference(storageKey), "en");
        }
      )
    );
  });

  test.each([ "", "   ", null ])("rejects storage key %p", (key) => {
    expect(() => resolveLanguagePreference(key)).toThrow(TypeError);
  });
});

describe("resolveLanguagePreference labels", () => {
  test("uses Intl.DisplayNames with the language as the display locale", () => {
    const constructor = jest.fn().mockImplementation((locales, options) => {
      expect(locales).toEqual([ "ja-JP" ]);
      expect(options).toEqual({ type: "language" });
      return { of: jest.fn(() => "日本語（日本）") };
    });
    withIntlProperty("DisplayNames", constructor, () =>
      withBrowser(
        {
          windowValue: createWindow(),
          navigatorValue: { language: "ja-JP" },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            "ja-JP",
            "日本語（日本）"
          );
        }
      )
    );
  });

  test("uses the canonical value when Intl.DisplayNames is unavailable", () => {
    withIntlProperty("DisplayNames", undefined, () =>
      withBrowser(
        {
          windowValue: createWindow(),
          navigatorValue: { language: "ja-JP" },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            "ja-JP",
            "ja-JP"
          );
        }
      )
    );
  });

  test("uses the canonical value when Intl.DisplayNames throws", () => {
    class ThrowingDisplayNames {
      constructor() {
        throw new Error("Display names unavailable");
      }
    }
    withIntlProperty("DisplayNames", ThrowingDisplayNames, () =>
      withBrowser(
        {
          windowValue: createWindow(),
          navigatorValue: { language: "ja-JP" },
        },
        () => {
          expectLanguageResult(
            resolveLanguagePreference(storageKey),
            "ja-JP",
            "ja-JP"
          );
        }
      )
    );
  });
});

describe("language canonicalization fallback", () => {
  test.each([
    [ "en-us", "en-US" ],
    [ "zh-hans-cn", "zh-Hans-CN" ],
    [ "ja-jp", "ja-JP" ],
  ])("canonicalizes %s without Intl.getCanonicalLocales", (language, expected) => {
    withIntlProperty("getCanonicalLocales", undefined, () =>
      withMockDisplayNames(() =>
        withBrowser(
          {
            windowValue: createWindow({
              url: `https://example.com/?lang=${language}`,
            }),
            navigatorValue: { language: "en" },
          },
          () => {
            expectLanguageResult(
              resolveLanguagePreference(storageKey),
              expected
            );
          }
        )
      )
    );
  });

  test("uses the fallback normalizer when Intl canonicalization fails", () => {
    const throwingCanonicalizer = () => {
      throw new Error("Intl data unavailable");
    };
    withIntlProperty("getCanonicalLocales", throwingCanonicalizer, () =>
      withMockDisplayNames(() =>
        withBrowser(
          {
            windowValue: createWindow({
              url: "https://example.com/?lang=zh_hans_cn",
            }),
            navigatorValue: { language: "en" },
          },
          () => {
            expectLanguageResult(
              resolveLanguagePreference(storageKey),
              "zh-Hans-CN"
            );
          }
        )
      )
    );
  });
});

describe("setLanguagePreference", () => {
  test.each([
    [ "en", "en" ],
    [ "en-US", "en-US" ],
    [ "zh-CN", "zh-CN" ],
    [ "ja-JP", "ja-JP" ],
    [ "ZH_cn", "zh-CN" ],
  ])("canonicalizes and persists %s as %s", (language, expected) => {
    const storage = createStorage();
    withBrowser(
      {
        windowValue: createWindow({ storage }),
        navigatorValue: undefined,
      },
      () => {
        expect(setLanguagePreference(storageKey, language)).toBe(true);
      }
    );
    expect(storage.setItem).toHaveBeenCalledWith(storageKey, expected);
  });

  test("returns false when storage is unavailable or throws", () => {
    withBrowser(
      { windowValue: undefined, navigatorValue: undefined },
      () => {
        expect(setLanguagePreference(storageKey, "ja")).toBe(false);
      }
    );

    const storage = createStorage();
    storage.setItem.mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    withBrowser(
      {
        windowValue: createWindow({ storage }),
        navigatorValue: undefined,
      },
      () => {
        expect(setLanguagePreference(storageKey, "ja")).toBe(false);
      }
    );
  });

  test.each([ "", "   " ])("rejects storage key %p", (key) => {
    expect(() => setLanguagePreference(key, "ja")).toThrow(TypeError);
  });

  test.each([ "", "   ", "not a locale", "en--US" ])(
    "rejects language %p",
    (language) => {
      expect(() =>
        setLanguagePreference(storageKey, language)
      ).toThrow(TypeError);
    }
  );
});

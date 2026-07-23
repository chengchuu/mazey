/** @jest-environment node */
/* eslint-env jest, node */

import {
  resolveLanguagePreference,
  setLanguagePreference,
} from "../lib/index.esm";

const languages = [ "en", "zh-CN", "ja" ];
const noQueryUrl = "https://example.com/";

function createReadableStorage(value) {
  return { getItem: jest.fn(() => value) };
}

function resolve(overrides = {}) {
  return resolveLanguagePreference({
    storageKey: "PROJECT_LANGUAGE",
    languages,
    fallback: "en",
    url: noQueryUrl,
    storage: null,
    navigatorLanguage: null,
    ...overrides,
  });
}

describe("resolveLanguagePreference URL priority", () => {
  test("URL language overrides storage and navigator.language", () => {
    const storage = createReadableStorage("en");

    expect(
      resolve({
        url: `${noQueryUrl}?lang=ja`,
        storage,
        navigatorLanguage: "zh-CN",
      })
    ).toBe("ja");
    expect(storage.getItem).not.toHaveBeenCalled();
  });

  test.each([
    [ "zh-CN", "zh-CN" ],
    [ "ZH-cn", "zh-CN" ],
    [ "zh_CN", "zh-CN" ],
    [ "en-US", "en" ],
  ])("normalizes URL language %s to %s", (value, expected) => {
    expect(resolve({ url: `${noQueryUrl}?lang=${value}` })).toBe(expected);
  });

  test("supports a custom query parameter", () => {
    expect(
      resolve({
        queryParam: "locale",
        url: `${noQueryUrl}?locale=ja`,
      })
    ).toBe("ja");
  });

  test("uses only the first duplicate query value", () => {
    expect(
      resolve({
        url: `${noQueryUrl}?lang=unsupported&lang=ja`,
        storage: createReadableStorage("zh-CN"),
      })
    ).toBe("zh-CN");
  });

  test.each([ "", "unsupported", "system" ])(
    "unsupported URL value %p falls through to storage",
    (value) => {
      expect(
        resolve({
          url: `${noQueryUrl}?lang=${value}`,
          storage: createReadableStorage("ja"),
        })
      ).toBe("ja");
    }
  );
});

describe("resolveLanguagePreference storage priority", () => {
  test.each([
    [ "en", "en" ],
    [ "ZH_cn", "zh-CN" ],
    [ "ja-JP", "ja" ],
  ])("resolves stored language %s to %s", (stored, expected) => {
    expect(resolve({ storage: createReadableStorage(stored) })).toBe(expected);
  });

  test("invalid storage falls through to navigator.language", () => {
    expect(
      resolve({
        storage: createReadableStorage("unsupported"),
        navigatorLanguage: "ja-JP",
      })
    ).toBe("ja");
  });

  test("continues when storage access throws", () => {
    const storage = {
      getItem: jest.fn(() => {
        throw new Error("Storage unavailable");
      }),
    };

    expect(resolve({ storage, navigatorLanguage: "ja-JP" })).toBe("ja");
  });

  test("continues when the storage method cannot be accessed", () => {
    const storage = {};
    Object.defineProperty(storage, "getItem", {
      get() {
        throw new Error("Storage unavailable");
      },
    });

    expect(resolve({ storage, navigatorLanguage: "ja-JP" })).toBe("ja");
  });
});

describe("resolveLanguagePreference navigator.language and fallback", () => {
  test.each([
    [ "ja", "ja" ],
    [ "JA", "ja" ],
    [ "zh_CN", "zh-CN" ],
    [ "en-US", "en" ],
  ])("resolves navigator language %s to %s", (value, expected) => {
    expect(resolve({ navigatorLanguage: value })).toBe(expected);
  });

  test("does not infer a different regional language", () => {
    expect(
      resolveLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages: [ "en-GB", "ja" ],
        fallback: "ja",
        url: noQueryUrl,
        storage: null,
        navigatorLanguage: "en-US",
      })
    ).toBe("ja");
  });

  test("uses fallback for an unsupported or unavailable browser language", () => {
    expect(resolve({ navigatorLanguage: "fr-FR" })).toBe("en");
    expect(resolve({ navigatorLanguage: null })).toBe("en");
  });

  test("uses fallback during SSR instead of the Node.js navigator locale", () => {
    expect(
      resolveLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        fallback: "ja",
      })
    ).toBe("ja");
  });

  test("reads navigator.language in a browser", () => {
    const navigatorDescriptor = Object.getOwnPropertyDescriptor(
      global,
      "navigator"
    );
    const windowDescriptor = Object.getOwnPropertyDescriptor(
      global,
      "window"
    );
    Object.defineProperty(global, "window", {
      configurable: true,
      value: {
        location: { href: noQueryUrl },
        localStorage: createReadableStorage(null),
      },
    });
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: { language: "ja-JP" },
    });

    try {
      expect(
        resolveLanguagePreference({
          storageKey: "PROJECT_LANGUAGE",
          languages,
          fallback: "en",
        })
      ).toBe("ja");
    } finally {
      if (navigatorDescriptor) {
        Object.defineProperty(global, "navigator", navigatorDescriptor);
      } else {
        delete global.navigator;
      }
      if (windowDescriptor) {
        Object.defineProperty(global, "window", windowDescriptor);
      } else {
        delete global.window;
      }
    }
  });

  test("uses fallback when navigator.language is inaccessible", () => {
    const navigatorDescriptor = Object.getOwnPropertyDescriptor(
      global,
      "navigator"
    );
    const windowDescriptor = Object.getOwnPropertyDescriptor(
      global,
      "window"
    );
    Object.defineProperty(global, "window", {
      configurable: true,
      value: { location: { href: noQueryUrl } },
    });
    Object.defineProperty(global, "navigator", {
      configurable: true,
      value: {
        get language() {
          throw new Error("Language unavailable");
        },
      },
    });

    try {
      expect(
        resolveLanguagePreference({
          storageKey: "PROJECT_LANGUAGE",
          languages,
          fallback: "en",
          storage: null,
        })
      ).toBe("en");
    } finally {
      if (navigatorDescriptor) {
        Object.defineProperty(global, "navigator", navigatorDescriptor);
      } else {
        delete global.navigator;
      }
      if (windowDescriptor) {
        Object.defineProperty(global, "window", windowDescriptor);
      } else {
        delete global.window;
      }
    }
  });
});

describe("setLanguagePreference", () => {
  test.each(languages)("persists the exact %s language", (language) => {
    const storage = { setItem: jest.fn() };

    expect(
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        language,
        storage,
      })
    ).toBe(true);
    expect(storage.setItem).toHaveBeenCalledWith(
      "PROJECT_LANGUAGE",
      language
    );
  });

  test.each([ "unsupported", "ja-JP", "system" ])(
    "rejects unsupported language %p",
    (language) => {
      expect(() =>
        setLanguagePreference({
          storageKey: "PROJECT_LANGUAGE",
          languages,
          language,
          storage: { setItem: jest.fn() },
        })
      ).toThrow(TypeError);
    }
  );

  test("returns false when storage is unavailable or rejects the write", () => {
    expect(
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        language: "ja",
        storage: null,
      })
    ).toBe(false);
    expect(
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        language: "ja",
        storage: {
          setItem: jest.fn(() => {
            throw new Error("Storage unavailable");
          }),
        },
      })
    ).toBe(false);
  });

  test("returns false when the storage method cannot be accessed", () => {
    const storage = {};
    Object.defineProperty(storage, "setItem", {
      get() {
        throw new Error("Storage unavailable");
      },
    });

    expect(
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        language: "ja",
        storage,
      })
    ).toBe(false);
  });
});

describe("language preference validation", () => {
  const baseOptions = {
    storageKey: "PROJECT_LANGUAGE",
    languages,
    fallback: "en",
    url: noQueryUrl,
    storage: null,
    navigatorLanguage: null,
  };

  test("requires an options object", () => {
    expect(() => resolveLanguagePreference()).toThrow(TypeError);
    expect(() => setLanguagePreference()).toThrow(TypeError);
  });

  test.each([ "", "   " ])("rejects storage key %p", (storageKey) => {
    expect(() =>
      resolveLanguagePreference({ ...baseOptions, storageKey })
    ).toThrow(TypeError);
    expect(() =>
      setLanguagePreference({
        storageKey,
        languages,
        language: "en",
        storage: null,
      })
    ).toThrow(TypeError);
  });

  test.each([
    [ [] ],
    [ [ "" ] ],
    [ [ "en-US", "EN_us" ] ],
    [ [ "en", 1 ] ],
  ])("rejects invalid languages %p", (invalidLanguages) => {
    expect(() =>
      resolveLanguagePreference({
        ...baseOptions,
        languages: invalidLanguages,
      })
    ).toThrow(TypeError);
  });

  test("rejects an unsupported fallback", () => {
    expect(() =>
      resolveLanguagePreference({ ...baseOptions, fallback: "fr" })
    ).toThrow(TypeError);
  });

  test.each([
    [ "queryParam", "" ],
    [ "url", "not a url" ],
    [ "storage", {} ],
    [ "navigatorLanguage", [] ],
  ])("rejects invalid %s", (key, value) => {
    expect(() =>
      resolveLanguagePreference({ ...baseOptions, [key]: value })
    ).toThrow(TypeError);
  });

  test("reports a TypeError when URL object inspection fails", () => {
    const url = new global.Proxy(
      {},
      {
        getPrototypeOf() {
          throw new Error("Prototype unavailable");
        },
      }
    );

    expect(() =>
      resolveLanguagePreference({ ...baseOptions, url })
    ).toThrow(TypeError);
  });

  test("setter rejects invalid storage and language configuration", () => {
    expect(() =>
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        language: "en",
        storage: {},
      })
    ).toThrow(TypeError);
    expect(() =>
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages: [],
        language: "en",
      })
    ).toThrow(TypeError);
  });
});

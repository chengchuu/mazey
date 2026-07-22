/** @jest-environment node */
/* eslint-env jest, node */

import {
  resolveLanguagePreference,
  setLanguagePreference,
} from "../lib/index.esm";

const languages = [
  { value: "en", label: "English", aliases: [ "en-US", "en-GB" ] },
  {
    value: "zh-CN",
    label: "简体中文",
    aliases: [ "zh-Hans", "zh-Hans-CN" ],
  },
  { value: "ja", label: "日本語", aliases: [ "ja-JP" ] },
];
const noQueryUrl = "https://example.com/";

function createReadableStorage(value) {
  return { getItem: jest.fn(() => value) };
}

function expectLanguageResult(result, expected) {
  expect(result).toEqual(expected);
  expect(Object.keys(result).sort()).toEqual([
    "displayName",
    "preference",
    "resolvedDisplayName",
    "resolvedLanguage",
    "source",
  ]);
}

function resolve(overrides = {}) {
  return resolveLanguagePreference({
    storageKey: "PROJECT_LANGUAGE",
    languages,
    fallback: "en",
    url: noQueryUrl,
    storage: null,
    navigatorLanguages: [],
    ...overrides,
  });
}

describe("resolveLanguagePreference URL priority", () => {
  test("a supported query overrides storage and browser languages", () => {
    const storage = createReadableStorage("en");

    expectLanguageResult(
      resolve({
        url: `${noQueryUrl}?lang=ja`,
        storage,
        navigatorLanguages: [ "zh-Hans" ],
      }),
      {
        preference: "ja",
        resolvedLanguage: "ja",
        displayName: "日本語",
        resolvedDisplayName: "日本語",
        source: "query",
      }
    );
    expect(storage.getItem).not.toHaveBeenCalled();
  });

  test.each([
    [ "zh-CN", "zh-CN" ],
    [ "ZH-cn", "zh-CN" ],
    [ "zh_CN", "zh-CN" ],
    [ "zh-Hans", "zh-CN" ],
  ])("query %s resolves to canonical %s", (query, expected) => {
    expect(resolve({ url: `${noQueryUrl}?lang=${query}` })).toMatchObject({
      preference: expected,
      resolvedLanguage: expected,
      source: "query",
    });
  });

  test.each([ "unsupported", "", "system" ])(
    "query %p falls through to storage",
    (query) => {
      expect(
        resolve({
          url: `${noQueryUrl}?lang=${query}`,
          storage: createReadableStorage("ja"),
        })
      ).toMatchObject({ preference: "ja", source: "storage" });
    }
  );

  test("supports a custom query parameter", () => {
    expect(
      resolve({
        queryParam: "locale",
        url: `${noQueryUrl}?locale=ja-JP`,
      })
    ).toMatchObject({ preference: "ja", source: "query" });
  });

  test("uses only the first duplicate query value", () => {
    expect(
      resolve({
        url: `${noQueryUrl}?lang=unsupported&lang=ja`,
        storage: createReadableStorage("en"),
      })
    ).toMatchObject({ preference: "en", source: "storage" });
  });
});

describe("resolveLanguagePreference storage priority", () => {
  test.each([
    [ "en", "English" ],
    [ "zh-CN", "简体中文" ],
    [ "ja", "日本語" ],
  ])("resolves stored canonical %s", (stored, label) => {
    expectLanguageResult(
      resolve({ storage: createReadableStorage(stored) }),
      {
        preference: stored,
        resolvedLanguage: stored,
        displayName: label,
        resolvedDisplayName: label,
        source: "storage",
      }
    );
  });

  test("stored system retains its preference and source", () => {
    expectLanguageResult(
      resolve({
        storage: createReadableStorage("system"),
        navigatorLanguages: [ "zh-Hans" ],
      }),
      {
        preference: "system",
        resolvedLanguage: "zh-CN",
        displayName: "System",
        resolvedDisplayName: "简体中文",
        source: "storage",
      }
    );
  });

  test("stored system uses the fallback without changing its source", () => {
    expectLanguageResult(
      resolve({
        storage: createReadableStorage("system"),
        navigatorLanguages: [ "unsupported" ],
      }),
      {
        preference: "system",
        resolvedLanguage: "en",
        displayName: "System",
        resolvedDisplayName: "English",
        source: "storage",
      }
    );
  });

  test.each([ "invalid", "", "ja-JP" ])(
    "stored value %p is ignored",
    (stored) => {
      expect(
        resolve({
          storage: createReadableStorage(stored),
          navigatorLanguages: [ "en-US" ],
        })
      ).toMatchObject({
        preference: "system",
        resolvedLanguage: "en",
        source: "system",
      });
    }
  );

  test("continues when storage is unavailable", () => {
    expect(
      resolve({ storage: null, navigatorLanguages: [ "ja-JP" ] })
    ).toMatchObject({ resolvedLanguage: "ja", source: "system" });
  });

  test("continues when storage access throws", () => {
    const storage = {
      getItem: jest.fn(() => {
        throw new Error("Storage unavailable");
      }),
    };

    expect(
      resolve({ storage, navigatorLanguages: [ "ja-JP" ] })
    ).toMatchObject({ resolvedLanguage: "ja", source: "system" });
  });

  test("continues when the storage method cannot be accessed", () => {
    const storage = {};
    Object.defineProperty(storage, "getItem", {
      get() {
        throw new Error("Storage unavailable");
      },
    });

    expect(
      resolve({ storage, navigatorLanguages: [ "ja-JP" ] })
    ).toMatchObject({ resolvedLanguage: "ja", source: "system" });
  });
});

describe("resolveLanguagePreference browser matching", () => {
  test.each([
    [ [ "zh-CN" ], "zh-CN" ],
    [ [ "zh-Hans" ], "zh-CN" ],
    [ [ "en-AU" ], "en" ],
    [ [ "unsupported", "ja-JP" ], "ja" ],
    [ [ "EN_us", "en-US" ], "en" ],
  ])("resolves %p to %s", (navigatorLanguages, expected) => {
    expect(resolve({ navigatorLanguages })).toMatchObject({
      preference: "system",
      resolvedLanguage: expected,
      source: "system",
    });
  });

  test("preserves browser language order", () => {
    expect(
      resolve({ navigatorLanguages: [ "ja-JP", "en-US" ] })
    ).toMatchObject({ resolvedLanguage: "ja" });
  });

  test("prefers an explicit base language over a regional sibling", () => {
    expect(
      resolveLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages: [
          { value: "en", label: "English" },
          { value: "en-GB", label: "English (UK)" },
        ],
        fallback: "en-GB",
        url: noQueryUrl,
        storage: null,
        navigatorLanguages: [ "en-US" ],
      })
    ).toMatchObject({ resolvedLanguage: "en", source: "system" });
  });

  test("does not infer sibling regional languages", () => {
    const regionalLanguages = [
      { value: "zh-CN", label: "简体中文" },
      { value: "pt-PT", label: "Português" },
      { value: "en-GB", label: "English (UK)" },
      { value: "ja", label: "日本語" },
    ];

    for (const browserLanguage of [ "zh-TW", "pt-BR", "en-US" ]) {
      expect(
        resolveLanguagePreference({
          storageKey: "PROJECT_LANGUAGE",
          languages: regionalLanguages,
          fallback: "ja",
          url: noQueryUrl,
          storage: null,
          navigatorLanguages: [ browserLanguage ],
        })
      ).toMatchObject({ resolvedLanguage: "ja", source: "fallback" });
    }
  });

  test("does not choose between regional variants from a base language", () => {
    expect(
      resolveLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages: [
          { value: "en-US", label: "English (US)" },
          { value: "en-GB", label: "English (UK)" },
          { value: "ja", label: "日本語" },
        ],
        fallback: "ja",
        url: noQueryUrl,
        storage: null,
        navigatorLanguages: [ "en" ],
      })
    ).toMatchObject({ resolvedLanguage: "ja", source: "fallback" });
  });
});

describe("resolveLanguagePreference fallback and SSR behavior", () => {
  test("uses the exact configured fallback and display name", () => {
    expectLanguageResult(resolve(), {
      preference: "en",
      resolvedLanguage: "en",
      displayName: "English",
      resolvedDisplayName: "English",
      source: "fallback",
    });
  });

  test("uses fallback during SSR instead of the Node.js navigator locale", () => {
    expectLanguageResult(
      resolveLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        fallback: "ja",
      }),
      {
        preference: "ja",
        resolvedLanguage: "ja",
        displayName: "日本語",
        resolvedDisplayName: "日本語",
        source: "fallback",
      }
    );
  });

  test("supports a custom system display name", () => {
    expect(
      resolve({
        navigatorLanguages: [ "ja" ],
        systemDisplayName: "Automatic",
      })
    ).toMatchObject({
      displayName: "Automatic",
      resolvedDisplayName: "日本語",
    });
  });

  test("uses default browser languages in deterministic priority order", () => {
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
      value: { languages: [ "unsupported" ], language: "ja-JP" },
    });

    try {
      expect(
        resolveLanguagePreference({
          storageKey: "PROJECT_LANGUAGE",
          languages,
          fallback: "en",
        })
      ).toMatchObject({ resolvedLanguage: "ja", source: "system" });
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

  test("uses fallback when browser language properties are inaccessible", () => {
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
        get languages() {
          throw new Error("Languages unavailable");
        },
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
      ).toMatchObject({ resolvedLanguage: "en", source: "fallback" });
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
  test.each([ "system", "en", "zh-CN", "ja" ])(
    "persists the exact %s preference",
    (preference) => {
      const storage = { setItem: jest.fn() };

      expect(
        setLanguagePreference({
          storageKey: "PROJECT_LANGUAGE",
          languages,
          preference,
          storage,
        })
      ).toBe(true);
      expect(storage.setItem).toHaveBeenCalledWith(
        "PROJECT_LANGUAGE",
        preference
      );
    }
  );

  test.each([ "unsupported", "ja-JP", "JA" ])(
    "rejects unsupported or non-canonical preference %p",
    (preference) => {
      expect(() =>
        setLanguagePreference({
          storageKey: "PROJECT_LANGUAGE",
          languages,
          preference,
          storage: { setItem: jest.fn() },
        })
      ).toThrow(TypeError);
    }
  );

  test("returns false when default storage is unavailable during SSR", () => {
    expect(
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        preference: "ja",
      })
    ).toBe(false);
  });

  test("returns false for explicitly unavailable or throwing storage", () => {
    expect(
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        preference: "ja",
        storage: null,
      })
    ).toBe(false);
    expect(
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages,
        preference: "ja",
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
        preference: "ja",
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
    navigatorLanguages: [],
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
        preference: "en",
        storage: null,
      })
    ).toThrow(TypeError);
  });

  test("rejects an empty language list", () => {
    expect(() =>
      resolveLanguagePreference({ ...baseOptions, languages: [] })
    ).toThrow(TypeError);
  });

  test.each([
    [
      [
        { value: "en-US", label: "English" },
        { value: "EN_us", label: "Duplicate" },
      ],
      "en-US",
    ],
    [ [ { value: "system", label: "System language" } ], "system" ],
    [ [ { value: "en", label: "" } ], "en" ],
    [ [ { value: "en", label: "English", aliases: [ "" ] } ], "en" ],
    [ [ { value: "en", label: "English", aliases: [ 1 ] } ], "en" ],
  ])("rejects invalid language configuration %#", (invalid, fallback) => {
    expect(() =>
      resolveLanguagePreference({
        ...baseOptions,
        languages: invalid,
        fallback,
      })
    ).toThrow(TypeError);
  });

  test("rejects ambiguous aliases and aliases colliding with canonical values", () => {
    for (const invalid of [
      [
        { value: "en", label: "English", aliases: [ "shared" ] },
        { value: "ja", label: "日本語", aliases: [ "shared" ] },
      ],
      [
        { value: "en", label: "English", aliases: [ "ja" ] },
        { value: "ja", label: "日本語" },
      ],
    ]) {
      expect(() =>
        resolveLanguagePreference({
          ...baseOptions,
          languages: invalid,
          fallback: "en",
        })
      ).toThrow(TypeError);
    }
  });

  test("rejects a fallback that is not an exact canonical value", () => {
    expect(() =>
      resolveLanguagePreference({ ...baseOptions, fallback: "en-US" })
    ).toThrow(TypeError);
  });

  test.each([
    [ "queryParam", "" ],
    [ "systemDisplayName", "" ],
    [ "url", "not a url" ],
    [ "storage", {} ],
    [ "navigatorLanguages", [ "en", 1 ] ],
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
        preference: "en",
        storage: {},
      })
    ).toThrow(TypeError);
    expect(() =>
      setLanguagePreference({
        storageKey: "PROJECT_LANGUAGE",
        languages: [],
        preference: "en",
      })
    ).toThrow(TypeError);
  });
});

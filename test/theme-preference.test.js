/** @jest-environment node */
/* eslint-env jest, node */

import {
  resolveThemePreference,
  setThemePreference,
} from "../lib/index.esm";

const noQueryUrl = "https://example.com/";

function createStorage(value) {
  return {
    getItem: jest.fn(() => value),
  };
}

function createMatchMedia(matches) {
  return jest.fn(() => ({ matches }));
}

function expectThemeResult(result, expected) {
  expect(result).toEqual(expected);
  expect(Object.keys(result).sort()).toEqual([
    "displayName",
    "preference",
    "resolvedTheme",
    "source",
  ]);
}

describe("resolveThemePreference URL priority", () => {
  test.each([
    [ "dark", "light", false, "dark", "Dark" ],
    [ "light", "dark", true, "light", "Light" ],
  ])(
    "query %s overrides storage %s and system %s",
    (query, stored, systemDark, expectedTheme, displayName) => {
      const storage = createStorage(stored);
      const matchMedia = createMatchMedia(systemDark);

      expectThemeResult(
        resolveThemePreference({
          storageKey: "PROJECT_THEME",
          url: `${noQueryUrl}?theme=${query}`,
          storage,
          matchMedia,
        }),
        {
          preference: expectedTheme,
          resolvedTheme: expectedTheme,
          displayName,
          source: "query",
        }
      );
      expect(storage.getItem).not.toHaveBeenCalled();
      expect(matchMedia).not.toHaveBeenCalled();
    }
  );

  test.each([ "invalid", "system" ])(
    "query %s falls through to storage",
    (query) => {
      expect(
        resolveThemePreference({
          storageKey: "PROJECT_THEME",
          url: `${noQueryUrl}?theme=${query}`,
          storage: createStorage("dark"),
          matchMedia: createMatchMedia(false),
        })
      ).toEqual({
        preference: "dark",
        resolvedTheme: "dark",
        displayName: "Dark",
        source: "storage",
      });
    }
  );

  test("supports a custom query parameter", () => {
    expect(
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        queryParam: "color",
        url: `${noQueryUrl}?color=dark`,
        storage: null,
        matchMedia: createMatchMedia(false),
      })
    ).toMatchObject({ preference: "dark", source: "query" });
  });

  test("uses the first duplicate query value", () => {
    expect(
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        url: `${noQueryUrl}?theme=light&theme=dark`,
        storage: null,
        matchMedia: createMatchMedia(true),
      })
    ).toEqual({
      preference: "light",
      resolvedTheme: "light",
      displayName: "Light",
      source: "query",
    });
  });
});

describe("resolveThemePreference storage priority", () => {
  test.each([
    [ "dark", false, "dark", "Dark" ],
    [ "light", true, "light", "Light" ],
    [ "system", true, "dark", "System" ],
    [ "system", false, "light", "System" ],
  ])(
    "resolves stored %s with system dark %s",
    (stored, systemDark, resolvedTheme, displayName) => {
      const matchMedia = createMatchMedia(systemDark);
      const result = resolveThemePreference({
        storageKey: "PROJECT_THEME",
        url: noQueryUrl,
        storage: createStorage(stored),
        matchMedia,
      });

      expectThemeResult(result, {
        preference: stored,
        resolvedTheme,
        displayName,
        source: "storage",
      });
      expect(matchMedia).toHaveBeenCalledTimes(stored === "system" ? 1 : 0);
    }
  );

  test.each([ "invalid", "" ])("ignores the stored value %p", (stored) => {
    expect(
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        url: noQueryUrl,
        storage: createStorage(stored),
        matchMedia: createMatchMedia(true),
      })
    ).toMatchObject({
      preference: "system",
      resolvedTheme: "dark",
      source: "system",
    });
  });

  test("continues when storage is unavailable", () => {
    expect(
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        url: noQueryUrl,
        storage: null,
        matchMedia: createMatchMedia(false),
      })
    ).toMatchObject({ preference: "system", source: "system" });
  });

  test("continues when storage access throws", () => {
    const storage = {
      getItem: jest.fn(() => {
        throw new Error("Storage unavailable");
      }),
    };

    expect(
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        url: noQueryUrl,
        storage,
        matchMedia: createMatchMedia(true),
      })
    ).toMatchObject({
      preference: "system",
      resolvedTheme: "dark",
      source: "system",
    });
  });
});

describe("resolveThemePreference system and fallback behavior", () => {
  test.each([
    [ true, "dark" ],
    [ false, "light" ],
  ])("resolves system dark %s as %s", (matches, resolvedTheme) => {
    expectThemeResult(
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        url: noQueryUrl,
        storage: null,
        matchMedia: createMatchMedia(matches),
      }),
      {
        preference: "system",
        resolvedTheme,
        displayName: "System",
        source: "system",
      }
    );
  });

  test("uses the default fallback when matchMedia is unavailable during SSR", () => {
    expectThemeResult(resolveThemePreference({ storageKey: "PROJECT_THEME" }), {
      preference: "light",
      resolvedTheme: "light",
      displayName: "Light",
      source: "fallback",
    });
  });

  test("uses an explicit dark fallback", () => {
    expectThemeResult(
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        url: noQueryUrl,
        storage: null,
        matchMedia: undefined,
        fallback: "dark",
      }),
      {
        preference: "dark",
        resolvedTheme: "dark",
        displayName: "Dark",
        source: "fallback",
      }
    );
  });

  test("uses fallback when matchMedia throws", () => {
    expect(
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        url: noQueryUrl,
        storage: null,
        matchMedia: () => {
          throw new Error("Media query unavailable");
        },
        fallback: "dark",
      })
    ).toEqual({
      preference: "dark",
      resolvedTheme: "dark",
      displayName: "Dark",
      source: "fallback",
    });
  });

  test("keeps a stored system preference when media queries fail", () => {
    expect(
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        url: noQueryUrl,
        storage: createStorage("system"),
        matchMedia: () => {
          throw new Error("Media query unavailable");
        },
        fallback: "dark",
      })
    ).toEqual({
      preference: "system",
      resolvedTheme: "dark",
      displayName: "System",
      source: "storage",
    });
  });
});

describe("resolveThemePreference validation", () => {
  test.each([ "", "   " ])("rejects storage key %p", (storageKey) => {
    expect(() => resolveThemePreference({ storageKey })).toThrow(TypeError);
  });

  test("rejects an empty query parameter", () => {
    expect(() =>
      resolveThemePreference({ storageKey: "PROJECT_THEME", queryParam: "" })
    ).toThrow(TypeError);
  });

  test("rejects an invalid fallback", () => {
    expect(() =>
      resolveThemePreference({
        storageKey: "PROJECT_THEME",
        fallback: "system",
      })
    ).toThrow(TypeError);
  });

  test("rejects a malformed URL", () => {
    expect(() =>
      resolveThemePreference({ storageKey: "PROJECT_THEME", url: "not a url" })
    ).toThrow(TypeError);
  });

  test("rejects invalid injected storage", () => {
    expect(() =>
      resolveThemePreference({ storageKey: "PROJECT_THEME", storage: {} })
    ).toThrow(TypeError);
  });

  test("rejects invalid injected matchMedia", () => {
    expect(() =>
      resolveThemePreference({ storageKey: "PROJECT_THEME", matchMedia: {} })
    ).toThrow(TypeError);
  });
});

test("returns the exact display-name mapping", () => {
  expect(
    resolveThemePreference({
      storageKey: "PROJECT_THEME",
      url: `${noQueryUrl}?theme=dark`,
    }).displayName
  ).toBe("Dark");
  expect(
    resolveThemePreference({
      storageKey: "PROJECT_THEME",
      url: `${noQueryUrl}?theme=light`,
    }).displayName
  ).toBe("Light");
  expect(
    resolveThemePreference({
      storageKey: "PROJECT_THEME",
      url: noQueryUrl,
      storage: createStorage("system"),
      matchMedia: createMatchMedia(false),
    }).displayName
  ).toBe("System");
});

describe("setThemePreference", () => {
  test.each([ "system", "light", "dark" ])(
    "writes the exact %s preference",
    (preference) => {
      const storage = { setItem: jest.fn() };

      expect(
        setThemePreference({
          storageKey: "PROJECT_THEME",
          preference,
          storage,
        })
      ).toBe(true);
      expect(storage.setItem).toHaveBeenCalledWith(
        "PROJECT_THEME",
        preference
      );
    }
  );

  test("returns false when storage is unavailable during SSR", () => {
    expect(
      setThemePreference({
        storageKey: "PROJECT_THEME",
        preference: "dark",
      })
    ).toBe(false);
  });

  test("returns false when storage rejects the write", () => {
    const storage = {
      setItem: jest.fn(() => {
        throw new Error("Storage unavailable");
      }),
    };

    expect(
      setThemePreference({
        storageKey: "PROJECT_THEME",
        preference: "dark",
        storage,
      })
    ).toBe(false);
  });

  test.each([ "", "   " ])("rejects storage key %p", (storageKey) => {
    expect(() =>
      setThemePreference({ storageKey, preference: "dark" })
    ).toThrow(TypeError);
  });

  test("rejects unsupported preferences", () => {
    expect(() =>
      setThemePreference({
        storageKey: "PROJECT_THEME",
        preference: "blue",
      })
    ).toThrow(TypeError);
  });

  test("rejects an invalid injected storage implementation", () => {
    expect(() =>
      setThemePreference({
        storageKey: "PROJECT_THEME",
        preference: "dark",
        storage: {},
      })
    ).toThrow(TypeError);
  });

  test("accepts explicit unavailable storage", () => {
    expect(
      setThemePreference({
        storageKey: "PROJECT_THEME",
        preference: "dark",
        storage: null,
      })
    ).toBe(false);
  });
});

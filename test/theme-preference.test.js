/** @jest-environment node */
/* eslint-env jest, node */

import {
  resolveThemePreference,
  setThemePreference,
} from "../lib/index.esm";

const storageKey = "PROJECT_THEME";

function createStorage(value = null) {
  return {
    getItem: jest.fn(() => value),
    setItem: jest.fn(),
  };
}

function createWindow({
  url = "https://example.com/",
  storage = createStorage(),
  systemDark = false,
  matchMedia = () => ({ matches: systemDark }),
} = {}) {
  return {
    location: { href: url },
    localStorage: storage,
    matchMedia,
  };
}

function withWindow(windowValue, callback) {
  const descriptor = Object.getOwnPropertyDescriptor(global, "window");
  if (windowValue === undefined) {
    delete global.window;
  } else {
    Object.defineProperty(global, "window", {
      configurable: true,
      value: windowValue,
    });
  }
  try {
    return callback();
  } finally {
    if (descriptor) {
      Object.defineProperty(global, "window", descriptor);
    } else {
      delete global.window;
    }
  }
}

function expectThemeResult(result, value, label) {
  expect(result).toEqual({ value, label });
  expect(Object.keys(result).sort()).toEqual([ "label", "value" ]);
}

describe("resolveThemePreference URL priority", () => {
  test.each([
    [ "dark", "dark", "Dark" ],
    [ "light", "light", "Light" ],
  ])("resolves ?theme=%s", (query, value, label) => {
    const storage = createStorage(query === "dark" ? "light" : "dark");
    const windowValue = createWindow({
      url: `https://example.com/?theme=${query}`,
      storage,
      systemDark: query === "light",
    });

    withWindow(windowValue, () => {
      expectThemeResult(resolveThemePreference(storageKey), value, label);
    });
    expect(storage.getItem).not.toHaveBeenCalled();
  });

  test.each([ "system", "unsupported", "" ])(
    "ignores query value %p and continues to storage",
    (query) => {
      withWindow(
        createWindow({
          url: `https://example.com/?theme=${query}`,
          storage: createStorage("dark"),
        }),
        () => {
          expectThemeResult(
            resolveThemePreference(storageKey),
            "dark",
            "Dark"
          );
        }
      );
    }
  );

  test("uses only the first duplicate query value", () => {
    withWindow(
      createWindow({
        url: "https://example.com/?theme=light&theme=dark",
        storage: createStorage("dark"),
        systemDark: true,
      }),
      () => {
        expectThemeResult(
          resolveThemePreference(storageKey),
          "light",
          "Light"
        );
      }
    );
  });
});

describe("resolveThemePreference storage and system behavior", () => {
  test.each([
    [ "dark", false, "dark", "Dark" ],
    [ "light", true, "light", "Light" ],
    [ "system", true, "dark", "System" ],
    [ "system", false, "light", "System" ],
  ])(
    "resolves stored %s with system dark %s",
    (stored, systemDark, value, label) => {
      withWindow(
        createWindow({ storage: createStorage(stored), systemDark }),
        () => {
          expectThemeResult(resolveThemePreference(storageKey), value, label);
        }
      );
    }
  );

  test.each([
    [ true, "dark" ],
    [ false, "light" ],
  ])("resolves system dark %s", (systemDark, value) => {
    withWindow(createWindow({ systemDark }), () => {
      expectThemeResult(
        resolveThemePreference(storageKey),
        value,
        "System"
      );
    });
  });

  test("invalid storage falls through to the system preference", () => {
    withWindow(
      createWindow({ storage: createStorage("invalid"), systemDark: true }),
      () => {
        expectThemeResult(
          resolveThemePreference(storageKey),
          "dark",
          "System"
        );
      }
    );
  });

  test("unavailable or throwing storage does not escape", () => {
    const unavailableStorageWindow = createWindow({ systemDark: true });
    Object.defineProperty(unavailableStorageWindow, "localStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
    withWindow(unavailableStorageWindow, () => {
      expectThemeResult(
        resolveThemePreference(storageKey),
        "dark",
        "System"
      );
    });

    const throwingStorage = createStorage();
    throwingStorage.getItem.mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    withWindow(
      createWindow({ storage: throwingStorage, systemDark: false }),
      () => {
        expectThemeResult(
          resolveThemePreference(storageKey),
          "light",
          "System"
        );
      }
    );
  });

  test("falls back to light when matchMedia is unavailable or throws", () => {
    withWindow(
      createWindow({ matchMedia: null }),
      () => {
        expectThemeResult(
          resolveThemePreference(storageKey),
          "light",
          "Light"
        );
      }
    );
    withWindow(
      createWindow({
        matchMedia: () => {
          throw new Error("Media query unavailable");
        },
      }),
      () => {
        expectThemeResult(
          resolveThemePreference(storageKey),
          "light",
          "Light"
        );
      }
    );
  });

  test("returns the light fallback during SSR", () => {
    withWindow(undefined, () => {
      expectThemeResult(
        resolveThemePreference(storageKey),
        "light",
        "Light"
      );
    });
  });

  test.each([ "", "   ", null ])("rejects storage key %p", (key) => {
    expect(() => resolveThemePreference(key)).toThrow(TypeError);
  });
});

describe("setThemePreference", () => {
  test.each([ "system", "light", "dark" ])(
    "persists exact lowercase value %s",
    (value) => {
      const storage = createStorage();
      withWindow(createWindow({ storage }), () => {
        expect(setThemePreference(storageKey, value)).toBe(true);
      });
      expect(storage.setItem).toHaveBeenCalledWith(storageKey, value);
    }
  );

  test("returns false when storage is unavailable or throws", () => {
    withWindow(undefined, () => {
      expect(setThemePreference(storageKey, "dark")).toBe(false);
    });

    const storage = createStorage();
    storage.setItem.mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    withWindow(createWindow({ storage }), () => {
      expect(setThemePreference(storageKey, "dark")).toBe(false);
    });
  });

  test.each([ "", "   " ])("rejects storage key %p", (key) => {
    expect(() => setThemePreference(key, "dark")).toThrow(TypeError);
  });

  test.each([ "blue", "Dark", "" ])("rejects value %p", (value) => {
    expect(() => setThemePreference(storageKey, value)).toThrow(TypeError);
  });
});

/** @jest-environment node */
/* eslint-env jest, node */

import {
  getSystemTheme,
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

describe("getSystemTheme", () => {
  test("is available from the package root", () => {
    expect(getSystemTheme).toEqual(expect.any(Function));
  });

  test.each([
    [ "dark", true ],
    [ "light", false ],
  ])("returns %s when dark matching is %s", (expected, matches) => {
    const matchMedia = jest.fn(() => ({ matches }));

    withWindow(createWindow({ matchMedia }), () => {
      expect(getSystemTheme()).toBe(expected);
    });
    expect(matchMedia).toHaveBeenCalledTimes(1);
    expect(matchMedia).toHaveBeenCalledWith(
      "(prefers-color-scheme: dark)"
    );
  });

  test("returns null when window is unavailable", () => {
    withWindow(undefined, () => {
      expect(getSystemTheme()).toBeNull();
    });
  });

  test.each([
    {},
    { matchMedia: null },
    { matchMedia: "not-a-function" },
  ])("returns null for unavailable matchMedia", (windowValue) => {
    withWindow(windowValue, () => {
      expect(getSystemTheme()).toBeNull();
    });
  });

  test("returns null when accessing or invoking matchMedia throws", () => {
    const inaccessibleWindow = {};
    Object.defineProperty(inaccessibleWindow, "matchMedia", {
      get() {
        throw new Error("matchMedia is inaccessible");
      },
    });
    withWindow(inaccessibleWindow, () => {
      expect(getSystemTheme()).toBeNull();
    });

    withWindow(
      createWindow({
        matchMedia: () => {
          throw new Error("matchMedia failed");
        },
      }),
      () => {
        expect(getSystemTheme()).toBeNull();
      }
    );
  });

  test("does not read URL or storage, mutate the DOM, or add listeners", () => {
    const locationGetter = jest.fn(() => {
      throw new Error("location must not be read");
    });
    const storageGetter = jest.fn(() => {
      throw new Error("storage must not be read");
    });
    const media = {
      matches: true,
      addEventListener: jest.fn(),
      addListener: jest.fn(),
    };
    const windowValue = {
      matchMedia: jest.fn(() => media),
    };
    Object.defineProperties(windowValue, {
      location: { get: locationGetter },
      localStorage: { get: storageGetter },
    });

    const documentDescriptor = Object.getOwnPropertyDescriptor(
      global,
      "document"
    );
    const setAttribute = jest.fn();
    Object.defineProperty(global, "document", {
      configurable: true,
      value: { documentElement: { setAttribute } },
    });
    try {
      withWindow(windowValue, () => {
        expect(getSystemTheme()).toBe("dark");
      });
    } finally {
      if (documentDescriptor) {
        Object.defineProperty(global, "document", documentDescriptor);
      } else {
        delete global.document;
      }
    }

    expect(locationGetter).not.toHaveBeenCalled();
    expect(storageGetter).not.toHaveBeenCalled();
    expect(setAttribute).not.toHaveBeenCalled();
    expect(media.addEventListener).not.toHaveBeenCalled();
    expect(media.addListener).not.toHaveBeenCalled();
  });

  test("matches resolveThemePreference system resolution", () => {
    const windowValue = createWindow({ systemDark: true });

    withWindow(windowValue, () => {
      expect(getSystemTheme()).toBe("dark");
      expectThemeResult(
        resolveThemePreference(storageKey),
        "dark",
        "System"
      );
    });
  });
});

describe("resolveThemePreference URL priority", () => {
  test.each([
    [ "dark", "dark", "Dark" ],
    [ "light", "light", "Light" ],
  ])("resolves the storage-key query value %s", (query, value, label) => {
    const storage = createStorage(query === "dark" ? "light" : "dark");
    const windowValue = createWindow({
      url: `https://example.com/?${storageKey}=${query}`,
      storage,
      systemDark: query === "light",
    });

    withWindow(windowValue, () => {
      expectThemeResult(resolveThemePreference(storageKey), value, label);
    });
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  test("does not access storage for a valid query preference", () => {
    const windowValue = createWindow({
      url: `https://example.com/?${storageKey}=dark`,
    });
    Object.defineProperty(windowValue, "localStorage", {
      get() {
        throw new Error("Storage must not be accessed");
      },
    });

    withWindow(windowValue, () => {
      expectThemeResult(
        resolveThemePreference(storageKey),
        "dark",
        "Dark"
      );
    });
  });

  test.each([ "system", "unsupported", "" ])(
    "ignores query value %p and continues to storage",
    (query) => {
      const storage = createStorage("dark");
      withWindow(
        createWindow({
          url: `https://example.com/?${storageKey}=${query}`,
          storage,
        }),
        () => {
          expectThemeResult(
            resolveThemePreference(storageKey),
            "dark",
            "Dark"
          );
        }
      );
      expect(storage.setItem).not.toHaveBeenCalled();
    }
  );

  test("uses only the first duplicate query value", () => {
    const storage = createStorage("dark");
    withWindow(
      createWindow({
        url: `https://example.com/?${storageKey}=light&${storageKey}=dark`,
        storage,
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
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  test("does not use the fixed theme query name", () => {
    const storage = createStorage("dark");
    withWindow(
      createWindow({
        url: "https://example.com/?theme=light",
        storage,
      }),
      () => {
        expectThemeResult(
          resolveThemePreference(storageKey),
          "dark",
          "Dark"
        );
      }
    );
    expect(storage.getItem).toHaveBeenCalledWith(storageKey);
    expect(storage.setItem).not.toHaveBeenCalled();
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

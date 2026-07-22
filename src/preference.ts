export function validateStorageKey(
  storageKey: unknown
): asserts storageKey is string {
  if (typeof storageKey !== "string" || storageKey.trim() === "") {
    throw new TypeError("storageKey must be a non-empty string.");
  }
}

export function validatePreferenceUrl(
  url: unknown
): asserts url is string | URL | undefined {
  let isUrlObject = false;
  if (url !== null && typeof url === "object") {
    try {
      isUrlObject =
        (typeof URL !== "undefined" && url instanceof URL) ||
        Object.prototype.toString.call(url) === "[object URL]";
    } catch (error) {
      isUrlObject = false;
    }
  }
  if (
    url !== undefined &&
    typeof url !== "string" &&
    !isUrlObject
  ) {
    throw new TypeError("url must be a valid string or URL.");
  }
}

export function getPreferenceUrl(url: string | URL | undefined): URL | null {
  if (url === undefined) {
    if (typeof window === "undefined") return null;
    try {
      return new URL(window.location.href);
    } catch (error) {
      return null;
    }
  }

  try {
    return new URL(url.toString());
  } catch (error) {
    throw new TypeError("url must be a valid string or URL.");
  }
}

export function getDefaultReadableStorage(): Pick<Storage, "getItem"> | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    return storage && typeof storage.getItem === "function" ? storage : null;
  } catch (error) {
    return null;
  }
}

export function getDefaultWritableStorage(): Pick<Storage, "setItem"> | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    return storage && typeof storage.setItem === "function" ? storage : null;
  } catch (error) {
    return null;
  }
}

export function validateStorageKey(
  storageKey: unknown
): asserts storageKey is string {
  if (typeof storageKey !== "string" || storageKey.trim() === "") {
    throw new TypeError("storageKey must be a non-empty string.");
  }
}

export function getUrlQueryValue(name: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URL(window.location.href).searchParams.get(name);
  } catch (error) {
    return null;
  }
}

export function readLocalStorage(storageKey: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    return storage && typeof storage.getItem === "function"
      ? storage.getItem(storageKey)
      : null;
  } catch (error) {
    return null;
  }
}

export function writeLocalStorage(
  storageKey: string,
  value: string
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storage = window.localStorage;
    if (!storage || typeof storage.setItem !== "function") return false;
    storage.setItem(storageKey, value);
    return true;
  } catch (error) {
    return false;
  }
}

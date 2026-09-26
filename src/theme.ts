import {
  getUrlQueryValue,
  readLocalStorage,
  validateStorageKey,
  writeLocalStorage,
} from "./preference";
import type { PreferenceResult } from "./typing";

/**
 * A user-selectable color-theme preference.
 *
 * @category Browser Information
 */
export type ThemePreference = "system" | "light" | "dark";

/**
 * A concrete color theme that can be applied to a page.
 *
 * @category Browser Information
 */
export type ResolvedTheme = "light" | "dark";

const themeLabels: Readonly<Record<ThemePreference, string>> = Object.freeze({
  system: "System",
  light: "Light",
  dark: "Dark",
});

function isResolvedTheme(value: unknown): value is ResolvedTheme {
  return value === "light" || value === "dark";
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || isResolvedTheme(value);
}

function getSystemTheme(): ResolvedTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const matchMedia = window.matchMedia;
    if (typeof matchMedia !== "function") return null;
    return matchMedia.call(window, "(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch (error) {
    return null;
  }
}

function createThemeResult(
  value: ResolvedTheme,
  label: ThemePreference
): PreferenceResult<ResolvedTheme> {
  return { value, label: themeLabels[label] };
}

/**
 * Resolve the current website theme.
 *
 * Resolution checks the fixed `theme` URL query, the supplied local-storage
 * key, the current `prefers-color-scheme` media query, and finally the fixed
 * `light` fallback. Query values accept only `light` and `dark`. Storage also
 * accepts `system`, which resolves to a concrete value while retaining the
 * `System` label. A valid query preference is written under the supplied
 * storage key when browser storage is available; resolution still succeeds
 * when the write fails.
 *
 * Resolution matrix:
 *
 * | Query   | Storage  | System dark | Result                                |
 * | ------- | -------- | ----------: | ------------------------------------- |
 * | `dark`  | `light`  |       false | `{ value: "dark", label: "Dark" }`    |
 * | `light` | `dark`   |        true | `{ value: "light", label: "Light" }`  |
 * | invalid | `dark`   |       false | `{ value: "dark", label: "Dark" }`    |
 * | missing | `light`  |        true | `{ value: "light", label: "Light" }`  |
 * | missing | `system` |        true | `{ value: "dark", label: "System" }`  |
 * | missing | `system` |       false | `{ value: "light", label: "System" }` |
 * | missing | invalid  |        true | `{ value: "dark", label: "System" }`  |
 * | missing | missing  |       false | `{ value: "light", label: "System" }` |
 * | missing | missing  | unavailable | `{ value: "light", label: "Light" }`  |
 *
 * Usage:
 *
 * ```ts
 * import {
 *   resolveThemePreference,
 *   setThemePreference,
 * } from "mazey";
 *
 * const theme = resolveThemePreference(
 *   "MY_WEBSITE_THEME"
 * );
 *
 * console.log(theme);
 *
 * setThemePreference(
 *   "MY_WEBSITE_THEME",
 *   "system"
 * );
 * ```
 *
 * Possible output:
 *
 * ```text
 * {
 *   value: "dark",
 *   label: "System"
 * }
 * ```
 *
 * @param storageKey Project-specific local-storage key.
 * @returns The concrete `light` or `dark` value and the label of the preference that selected it.
 * @throws {TypeError} If `storageKey` is not a non-empty string.
 * @remarks Safe during SSR and resilient to unavailable or throwing browser APIs. A valid URL preference is written to storage when possible; other resolution paths remain read-only. The function never mutates the DOM or adds listeners.
 * @category Browser Information
 */
export function resolveThemePreference(
  storageKey: string
): PreferenceResult<ResolvedTheme> {
  validateStorageKey(storageKey);

  const queryPreference = getUrlQueryValue("theme");
  if (isResolvedTheme(queryPreference)) {
    writeLocalStorage(storageKey, queryPreference);
    return createThemeResult(queryPreference, queryPreference);
  }

  const storedPreference = readLocalStorage(storageKey);
  if (isResolvedTheme(storedPreference)) {
    return createThemeResult(storedPreference, storedPreference);
  }

  const systemTheme = getSystemTheme();
  if (storedPreference === "system" && systemTheme) {
    return createThemeResult(systemTheme, "system");
  }
  if (systemTheme) return createThemeResult(systemTheme, "system");
  return createThemeResult("light", "light");
}

/**
 * Persist a website theme preference.
 *
 * The exact lowercase value `system`, `light`, or `dark` is written under the
 * project-specific key. The function does not resolve or apply the theme.
 *
 * Usage:
 *
 * ```ts
 * import { setThemePreference } from "mazey";
 *
 * const stored = setThemePreference(
 *   "MY_WEBSITE_THEME",
 *   "dark"
 * );
 *
 * console.log(stored);
 * ```
 *
 * Output when browser storage is available:
 *
 * ```text
 * true
 * ```
 *
 * @param storageKey Project-specific local-storage key.
 * @param value Theme preference to persist.
 * @returns `true` when storage succeeds, or `false` when storage is unavailable or rejects the write.
 * @throws {TypeError} If `storageKey` is empty or `value` is not `system`, `light`, or `dark`.
 * @remarks Safe during SSR. This function writes only the preference and never mutates the DOM, applies a theme, or adds listeners.
 * @category Browser Information
 */
export function setThemePreference(
  storageKey: string,
  value: ThemePreference
): boolean {
  validateStorageKey(storageKey);
  if (!isThemePreference(value)) {
    throw new TypeError("value must be \"system\", \"light\", or \"dark\".");
  }
  return writeLocalStorage(storageKey, value);
}

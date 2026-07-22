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

/**
 * Human-readable names for supported theme preferences.
 *
 * @category Browser Information
 */
export type ThemePreferenceDisplayName = "System" | "Light" | "Dark";

/**
 * The highest-priority source that selected a theme preference.
 *
 * @category Browser Information
 */
export type ThemePreferenceSource = "query" | "storage" | "system" | "fallback";

/**
 * Options for {@link resolveThemePreference}.
 *
 * @category Browser Information
 */
export interface ResolveThemePreferenceOptions {
  /** Project-specific local-storage key, such as `MAZEY_THEME`. */
  storageKey: string;
  /** URL query parameter name. Defaults to `theme`. */
  queryParam?: string;
  /** URL inspected for a query override. Defaults to `window.location.href` when available. */
  url?: string | URL;
  /** Storage used to read a persisted preference. Defaults to `window.localStorage` when available. */
  storage?: Pick<Storage, "getItem"> | null;
  /** Media-query implementation. Defaults to `window.matchMedia` when available. */
  matchMedia?: (query: string) => Pick<MediaQueryList, "matches">;
  /** Theme used when the system preference is unavailable. Defaults to `light`. */
  fallback?: ResolvedTheme;
}

/**
 * Result returned by {@link resolveThemePreference}.
 *
 * @category Browser Information
 */
export interface ThemePreferenceResult {
  /** Selected user-facing preference. */
  preference: ThemePreference;
  /** Effective light or dark theme. */
  resolvedTheme: ResolvedTheme;
  /** Human-readable name of the selected preference. */
  displayName: ThemePreferenceDisplayName;
  /** Highest-priority source that supplied the selected preference. */
  source: ThemePreferenceSource;
}

const themePreferenceDisplayNames: Readonly<
  Record<ThemePreference, ThemePreferenceDisplayName>
> = Object.freeze({
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

function createThemeResult(
  preference: ThemePreference,
  resolvedTheme: ResolvedTheme,
  source: ThemePreferenceSource
): ThemePreferenceResult {
  return {
    preference,
    resolvedTheme,
    displayName: themePreferenceDisplayNames[preference],
    source,
  };
}

function validateOptions(options: ResolveThemePreferenceOptions): {
  storageKey: string;
  queryParam: string;
  fallback: ResolvedTheme;
} {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Theme options must be an object.");
  }
  if (
    typeof options.storageKey !== "string" ||
    options.storageKey.trim() === ""
  ) {
    throw new TypeError("storageKey must be a non-empty string.");
  }
  if (
    options.queryParam !== undefined &&
    (typeof options.queryParam !== "string" || options.queryParam.trim() === "")
  ) {
    throw new TypeError("queryParam must be a non-empty string.");
  }
  if (options.fallback !== undefined && !isResolvedTheme(options.fallback)) {
    throw new TypeError("fallback must be \"light\" or \"dark\".");
  }
  if (
    options.storage !== undefined &&
    options.storage !== null &&
    (typeof options.storage !== "object" ||
      typeof options.storage.getItem !== "function")
  ) {
    throw new TypeError("storage must provide a getItem function.");
  }
  if (
    options.matchMedia !== undefined &&
    typeof options.matchMedia !== "function"
  ) {
    throw new TypeError("matchMedia must be a function.");
  }
  if (
    options.url !== undefined &&
    typeof options.url !== "string" &&
    !(typeof URL !== "undefined" && options.url instanceof URL)
  ) {
    throw new TypeError("url must be a valid string or URL.");
  }

  return {
    storageKey: options.storageKey,
    queryParam: options.queryParam ?? "theme",
    fallback: options.fallback ?? "light",
  };
}

function getExplicitUrl(url: string | URL): URL {
  try {
    return new URL(url.toString());
  } catch (error) {
    throw new TypeError("url must be a valid string or URL.");
  }
}

function getDefaultUrl(): URL | null {
  if (typeof window === "undefined") return null;
  try {
    return new URL(window.location.href);
  } catch (error) {
    return null;
  }
}

function getDefaultStorage(): Pick<Storage, "getItem"> | null {
  if (typeof window === "undefined") return null;
  try {
    const storage = window.localStorage;
    return storage && typeof storage.getItem === "function" ? storage : null;
  } catch (error) {
    return null;
  }
}

function getDefaultMatchMedia():
  | ((query: string) => Pick<MediaQueryList, "matches">)
  | null {
  if (typeof window === "undefined") return null;
  try {
    const mediaQuery = window.matchMedia;
    return typeof mediaQuery === "function"
      ? (query: string) => mediaQuery.call(window, query)
      : null;
  } catch (error) {
    return null;
  }
}

function resolveSystemTheme(
  matchMedia: ((query: string) => Pick<MediaQueryList, "matches">) | null
): ResolvedTheme | null {
  if (!matchMedia) return null;
  try {
    return matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch (error) {
    return null;
  }
}

/**
 * Resolve a website theme preference without mutating the DOM or storage.
 *
 * Resolution uses four priority levels: a `light` or `dark` URL query
 * override, a stored `system`/`light`/`dark` preference, the current system
 * color scheme, and finally a configured `light` or `dark` fallback. The
 * default query parameter is `theme`, and the storage key must be supplied by
 * the consuming project. Query `system` and all unsupported values are ignored.
 *
 * The result separates the selected preference from the effective theme and
 * includes its display name (`System`, `Light`, or `Dark`) and source. A stored
 * `system` preference retains `source: "storage"` while its effective theme is
 * resolved from the current media query or fallback.
 *
 * Usage:
 *
 * ```javascript
 * import { resolveThemePreference } from "mazey";
 *
 * const theme = resolveThemePreference({
 *   storageKey: "MY_WEBSITE_THEME",
 * });
 * console.log(theme.preference);
 * console.log(theme.resolvedTheme);
 * console.log(theme.displayName);
 * console.log(theme.source);
 * ```
 *
 * Possible output:
 *
 * ```text
 * system
 * dark
 * System
 * system
 * ```
 *
 * URL override:
 *
 * ```javascript
 * const theme = resolveThemePreference({
 *   storageKey: "MY_WEBSITE_THEME",
 *   url: "https://example.com/?theme=light",
 * });
 * ```
 *
 * @param options Project storage key and optional URL, storage, media-query, and fallback inputs.
 * @returns The selected preference, effective theme, display name, and preference source.
 * @throws {TypeError} If required options or explicitly supplied option values are invalid.
 * @remarks Safe during SSR and resilient to unavailable or throwing browser APIs. This function does not write storage, mutate the DOM, or add listeners. System resolution reads the current media-query result rather than cached browser information.
 * @category Browser Information
 */
export function resolveThemePreference(
  options: ResolveThemePreferenceOptions
): ThemePreferenceResult {
  const { storageKey, queryParam, fallback } = validateOptions(options);
  const url =
    options.url === undefined ? getDefaultUrl() : getExplicitUrl(options.url);
  const storage =
    options.storage === undefined ? getDefaultStorage() : options.storage;
  const matchMedia =
    options.matchMedia === undefined
      ? getDefaultMatchMedia()
      : options.matchMedia;

  const queryPreference = url?.searchParams.get(queryParam);
  if (isResolvedTheme(queryPreference)) {
    return createThemeResult(queryPreference, queryPreference, "query");
  }

  let storedPreference: ThemePreference | null = null;
  if (storage) {
    try {
      const value = storage.getItem(storageKey);
      storedPreference = isThemePreference(value) ? value : null;
    } catch (error) {
      storedPreference = null;
    }
  }

  if (storedPreference && storedPreference !== "system") {
    return createThemeResult(storedPreference, storedPreference, "storage");
  }

  const systemTheme = resolveSystemTheme(matchMedia);
  if (storedPreference === "system") {
    return createThemeResult("system", systemTheme ?? fallback, "storage");
  }
  if (systemTheme) {
    return createThemeResult("system", systemTheme, "system");
  }
  return createThemeResult(fallback, fallback, "fallback");
}

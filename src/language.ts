import {
  getDefaultReadableStorage,
  getDefaultWritableStorage,
  getPreferenceUrl,
  validatePreferenceUrl,
  validateStorageKey,
} from "./preference";

/**
 * Options for {@link resolveLanguagePreference}.
 *
 * @category Browser Information
 */
export interface ResolveLanguagePreferenceOptions<
  T extends string = string
> {
  /** Project-specific local-storage key, such as `MAZEY_LANGUAGE`. */
  storageKey: string;
  /** Language codes supported by the website, in canonical project form. */
  languages: readonly T[];
  /** Supported language returned when no preference can be resolved. */
  fallback: T;
  /** URL query parameter name. Defaults to `lang`. */
  queryParam?: string;
  /** URL inspected for a language override. Defaults to `window.location.href`. */
  url?: string | URL;
  /** Storage used to read the saved language. Defaults to `window.localStorage`. */
  storage?: Pick<Storage, "getItem"> | null;
  /** Browser language. Defaults to `navigator.language`; use `null` to skip it. */
  navigatorLanguage?: string | null;
}

/**
 * Options for {@link setLanguagePreference}.
 *
 * @category Browser Information
 */
export interface SetLanguagePreferenceOptions<T extends string = string> {
  /** Project-specific local-storage key. */
  storageKey: string;
  /** Language codes supported by the website, in canonical project form. */
  languages: readonly T[];
  /** Supported language selected by the user. */
  language: T;
  /** Storage used to save the language. Defaults to `window.localStorage`. */
  storage?: Pick<Storage, "setItem"> | null;
}

interface LanguageConfiguration<T extends string> {
  values: readonly T[];
  byNormalizedValue: Map<string, T>;
}

function normalizeLanguage(value: string): string {
  return value.trim().replace(/_/g, "-").toLowerCase();
}

function validateLanguages<T extends string>(
  languages: readonly T[]
): LanguageConfiguration<T> {
  if (!Array.isArray(languages) || languages.length === 0) {
    throw new TypeError("languages must be a non-empty array.");
  }

  const byNormalizedValue = new Map<string, T>();
  languages.forEach((language) => {
    if (typeof language !== "string" || language.trim() === "") {
      throw new TypeError("languages must contain non-empty strings.");
    }
    const normalizedLanguage = normalizeLanguage(language);
    if (byNormalizedValue.has(normalizedLanguage)) {
      throw new TypeError(
        "languages must be unique after case and separator normalization."
      );
    }
    byNormalizedValue.set(normalizedLanguage, language as T);
  });

  return { values: languages, byNormalizedValue };
}

function findExactLanguage<T extends string>(
  configuration: LanguageConfiguration<T>,
  value: unknown
): T | null {
  if (typeof value !== "string") return null;
  return configuration.values.find((language) => language === value) ?? null;
}

function matchLanguage<T extends string>(
  configuration: LanguageConfiguration<T>,
  value: unknown
): T | null {
  if (typeof value !== "string") return null;
  const normalizedValue = normalizeLanguage(value);
  if (!normalizedValue) return null;

  const exact = configuration.byNormalizedValue.get(normalizedValue);
  if (exact) return exact;

  const separatorIndex = normalizedValue.indexOf("-");
  if (separatorIndex === -1) return null;
  const base = normalizedValue.slice(0, separatorIndex);
  return configuration.byNormalizedValue.get(base) ?? null;
}

function validateReadableStorage(
  storage: ResolveLanguagePreferenceOptions<string>["storage"]
): ResolveLanguagePreferenceOptions<string>["storage"] {
  if (storage === undefined || storage === null) return storage;
  if (typeof storage !== "object") {
    throw new TypeError("storage must provide a getItem function.");
  }
  let getItem: unknown;
  try {
    getItem = storage.getItem;
  } catch (error) {
    return null;
  }
  if (typeof getItem !== "function") {
    throw new TypeError("storage must provide a getItem function.");
  }
  return storage;
}

function validateWritableStorage(
  storage: SetLanguagePreferenceOptions<string>["storage"]
): SetLanguagePreferenceOptions<string>["storage"] {
  if (storage === undefined || storage === null) return storage;
  if (typeof storage !== "object") {
    throw new TypeError("storage must provide a setItem function.");
  }
  let setItem: unknown;
  try {
    setItem = storage.setItem;
  } catch (error) {
    return null;
  }
  if (typeof setItem !== "function") {
    throw new TypeError("storage must provide a setItem function.");
  }
  return storage;
}

function getDefaultNavigatorLanguage(): string | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null;
  }
  try {
    return typeof navigator.language === "string"
      ? navigator.language
      : null;
  } catch (error) {
    return null;
  }
}

/**
 * Return the supported language a website should use.
 *
 * Basic usage:
 *
 * ```ts
 * import { resolveLanguagePreference } from "mazey";
 *
 * const language = resolveLanguagePreference({
 *   storageKey: "MY_WEBSITE_LANGUAGE",
 *   languages: ["en", "zh-CN", "ja"],
 *   fallback: "en",
 *   url: "https://example.com/?lang=ja",
 * });
 *
 * console.log(language);
 * ```
 *
 * Output:
 *
 * ```text
 * ja
 * ```
 *
 * Use the returned value with a native language selector:
 *
 * ```html
 * <select id="language" aria-label="Language">
 *   <option value="en">English</option>
 *   <option value="zh-CN">简体中文</option>
 *   <option value="ja">日本語</option>
 * </select>
 * ```
 *
 * ```ts
 * const select = document.querySelector<HTMLSelectElement>("#language");
 *
 * if (select) {
 *   select.value = resolveLanguagePreference({
 *     storageKey: "MY_WEBSITE_LANGUAGE",
 *     languages: ["en", "zh-CN", "ja"],
 *     fallback: "en",
 *   });
 * }
 * ```
 *
 * The resolution order is the URL query, local storage, `navigator.language`,
 * and the fallback. Matching is case-insensitive and treats `_` as `-`.
 * A regional value can match an explicitly supported base language, such as
 * `en-US` to `en`, but never a different regional variant.
 *
 * @param options Supported languages, fallback, storage key, and optional browser inputs.
 * @returns The canonical supported language selected by the resolution order.
 * @throws {TypeError} If the options, languages, fallback, URL, or injected storage are invalid.
 * @remarks Safe during SSR. This function reads preferences only; it does not mutate the DOM, write storage, load translations, redirect, or add listeners.
 * @category Browser Information
 */
export function resolveLanguagePreference<T extends string>(
  options: ResolveLanguagePreferenceOptions<T>
): T {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Language options must be an object.");
  }
  validateStorageKey(options.storageKey);
  const configuration = validateLanguages(options.languages);
  const fallback = findExactLanguage(configuration, options.fallback);
  if (!fallback) {
    throw new TypeError("fallback must be a configured language.");
  }
  if (
    options.queryParam !== undefined &&
    (typeof options.queryParam !== "string" || options.queryParam.trim() === "")
  ) {
    throw new TypeError("queryParam must be a non-empty string.");
  }
  validatePreferenceUrl(options.url);
  const suppliedStorage = validateReadableStorage(options.storage);
  if (
    options.navigatorLanguage !== undefined &&
    options.navigatorLanguage !== null &&
    typeof options.navigatorLanguage !== "string"
  ) {
    throw new TypeError("navigatorLanguage must be a string or null.");
  }

  const url = getPreferenceUrl(options.url);
  const queryLanguage = matchLanguage(
    configuration,
    url?.searchParams.get(options.queryParam ?? "lang")
  );
  if (queryLanguage) return queryLanguage;

  const storage =
    options.storage === undefined
      ? getDefaultReadableStorage()
      : suppliedStorage;
  if (storage) {
    try {
      const storedLanguage = matchLanguage(
        configuration,
        storage.getItem(options.storageKey)
      );
      if (storedLanguage) return storedLanguage;
    } catch (error) {
      // Continue to the browser language when storage is inaccessible.
    }
  }

  const navigatorLanguage =
    options.navigatorLanguage === undefined
      ? getDefaultNavigatorLanguage()
      : options.navigatorLanguage;
  return matchLanguage(configuration, navigatorLanguage) ?? fallback;
}

/**
 * Save a supported language selected by the user.
 *
 * Basic usage:
 *
 * ```ts
 * import { setLanguagePreference } from "mazey";
 *
 * const stored = setLanguagePreference({
 *   storageKey: "MY_WEBSITE_LANGUAGE",
 *   languages: ["en", "zh-CN", "ja"],
 *   language: "ja",
 * });
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
 * Persist changes from a native language selector:
 *
 * ```ts
 * const select = document.querySelector<HTMLSelectElement>("#language");
 *
 * select?.addEventListener("change", () => {
 *   setLanguagePreference({
 *     storageKey: "MY_WEBSITE_LANGUAGE",
 *     languages: ["en", "zh-CN", "ja"],
 *     language: select.value,
 *   });
 * });
 * ```
 *
 * @param options Storage key, supported languages, selected language, and optional storage implementation.
 * @returns `true` when the canonical language was written, or `false` when storage is unavailable or rejects the write.
 * @throws {TypeError} If the options, languages, storage key, selected language, or injected storage are invalid.
 * @remarks Safe during SSR. This function writes only the selected language and performs no DOM, URL, cookie, translation, network, or listener work.
 * @category Browser Information
 */
export function setLanguagePreference<T extends string>(
  options: SetLanguagePreferenceOptions<T>
): boolean {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Language options must be an object.");
  }
  validateStorageKey(options.storageKey);
  const configuration = validateLanguages(options.languages);
  const language = findExactLanguage(configuration, options.language);
  if (!language) {
    throw new TypeError("language must be a configured language.");
  }
  const suppliedStorage = validateWritableStorage(options.storage);
  const storage =
    options.storage === undefined
      ? getDefaultWritableStorage()
      : suppliedStorage;
  if (!storage) return false;

  try {
    storage.setItem(options.storageKey, language);
    return true;
  } catch (error) {
    return false;
  }
}

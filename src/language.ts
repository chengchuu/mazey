import {
  getDefaultReadableStorage,
  getDefaultWritableStorage,
  getPreferenceUrl,
  validatePreferenceUrl,
  validateStorageKey,
} from "./preference";

/**
 * A language supported by a consuming project.
 *
 * @category Browser Information
 */
export interface LanguageOption<T extends string = string> {
  /** Canonical project language value, such as `en`, `zh-CN`, or `ja`. */
  value: T;
  /** Human-readable name displayed in a language control. */
  label: string;
  /** Optional browser-language aliases that resolve to this language. */
  aliases?: readonly string[];
}

/**
 * A selected language preference, including the browser-driven system option.
 *
 * @category Browser Information
 */
export type LanguagePreference<T extends string = string> = "system" | T;

/**
 * The highest-priority source that selected a language preference.
 *
 * @category Browser Information
 */
export type LanguagePreferenceSource =
  | "query"
  | "storage"
  | "system"
  | "fallback";

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
  /** Languages supported by the consuming project. */
  languages: readonly LanguageOption<T>[];
  /** Canonical configured language used when no browser language matches. */
  fallback: T;
  /** URL query parameter name. Defaults to `lang`. */
  queryParam?: string;
  /** URL inspected for a query override. Defaults to `window.location.href` when available. */
  url?: string | URL;
  /** Storage used to read a persisted preference. Defaults to `window.localStorage` when available. */
  storage?: Pick<Storage, "getItem"> | null;
  /** Browser language preferences. Defaults to `navigator.languages`, followed by `navigator.language`. */
  navigatorLanguages?: readonly string[];
  /** Human-readable name of the system option. Defaults to `System`. */
  systemDisplayName?: string;
}

/**
 * Options for {@link setLanguagePreference}.
 *
 * @category Browser Information
 */
export interface SetLanguagePreferenceOptions<T extends string = string> {
  /** Project-specific local-storage key. */
  storageKey: string;
  /** Languages supported by the consuming project. */
  languages: readonly LanguageOption<T>[];
  /** `system` or an exact configured canonical language to persist. */
  preference: LanguagePreference<T>;
  /** Storage used to persist the preference. Defaults to `window.localStorage` when available. */
  storage?: Pick<Storage, "setItem"> | null;
}

/**
 * Result returned by {@link resolveLanguagePreference}.
 *
 * @category Browser Information
 */
export interface LanguagePreferenceResult<T extends string = string> {
  /** Selected user-facing preference, which may be `system`. */
  preference: LanguagePreference<T>;
  /** Concrete configured language that the UI should use. */
  resolvedLanguage: T;
  /** Human-readable name of the selected preference. */
  displayName: string;
  /** Human-readable name of the concrete resolved language. */
  resolvedDisplayName: string;
  /** Highest-priority source that supplied the selected preference. */
  source: LanguagePreferenceSource;
}

interface LanguageConfiguration<T extends string> {
  options: readonly LanguageOption<T>[];
  canonicalByNormalizedValue: Map<string, LanguageOption<T>>;
  aliasByNormalizedValue: Map<string, LanguageOption<T>>;
}

function normalizeLanguageTag(value: string): string {
  return value.trim().replace(/_/g, "-").toLowerCase();
}

function validateLanguages<T extends string>(
  languages: readonly LanguageOption<T>[]
): LanguageConfiguration<T> {
  if (!Array.isArray(languages) || languages.length === 0) {
    throw new TypeError("languages must be a non-empty array.");
  }

  const canonicalByNormalizedValue = new Map<string, LanguageOption<T>>();
  const aliasByNormalizedValue = new Map<string, LanguageOption<T>>();

  languages.forEach((option) => {
    if (!option || typeof option !== "object" || Array.isArray(option)) {
      throw new TypeError("each language must be an object.");
    }
    if (typeof option.value !== "string" || option.value.trim() === "") {
      throw new TypeError("each language value must be a non-empty string.");
    }
    if (normalizeLanguageTag(option.value) === "system") {
      throw new TypeError("language value \"system\" is reserved.");
    }
    if (typeof option.label !== "string" || option.label.trim() === "") {
      throw new TypeError("each language label must be a non-empty string.");
    }
    if (
      option.aliases !== undefined &&
      (!Array.isArray(option.aliases) ||
        option.aliases.some(
          (alias: string) => typeof alias !== "string" || alias.trim() === ""
        ))
    ) {
      throw new TypeError("language aliases must be non-empty strings.");
    }

    const normalizedValue = normalizeLanguageTag(option.value);
    if (canonicalByNormalizedValue.has(normalizedValue)) {
      throw new TypeError(
        "language values must be unique after normalization."
      );
    }
    canonicalByNormalizedValue.set(normalizedValue, option);
  });

  languages.forEach((option) => {
    option.aliases?.forEach((alias: string) => {
      const normalizedAlias = normalizeLanguageTag(alias);
      if (normalizedAlias === "system") {
        throw new TypeError("language alias \"system\" is reserved.");
      }
      const canonicalOwner = canonicalByNormalizedValue.get(normalizedAlias);
      const aliasOwner = aliasByNormalizedValue.get(normalizedAlias);
      if (
        (canonicalOwner && canonicalOwner !== option) ||
        (aliasOwner && aliasOwner !== option)
      ) {
        throw new TypeError(
          "language aliases must not resolve to multiple languages."
        );
      }
      aliasByNormalizedValue.set(normalizedAlias, option);
    });
  });

  return {
    options: languages,
    canonicalByNormalizedValue,
    aliasByNormalizedValue,
  };
}

function findExactCanonical<T extends string>(
  configuration: LanguageConfiguration<T>,
  value: unknown
): LanguageOption<T> | null {
  if (typeof value !== "string") return null;
  return (
    configuration.options.find((option) => option.value === value) ?? null
  );
}

function matchExactLanguage<T extends string>(
  configuration: LanguageConfiguration<T>,
  value: unknown
): LanguageOption<T> | null {
  if (typeof value !== "string") return null;
  const normalizedValue = normalizeLanguageTag(value);
  if (!normalizedValue || normalizedValue === "system") return null;
  return (
    configuration.canonicalByNormalizedValue.get(normalizedValue) ??
    configuration.aliasByNormalizedValue.get(normalizedValue) ??
    null
  );
}

function matchBrowserLanguage<T extends string>(
  configuration: LanguageConfiguration<T>,
  value: string
): LanguageOption<T> | null {
  const exactMatch = matchExactLanguage(configuration, value);
  if (exactMatch) return exactMatch;

  const normalizedValue = normalizeLanguageTag(value);
  const separatorIndex = normalizedValue.indexOf("-");
  if (separatorIndex === -1) return null;
  const base = normalizedValue.slice(0, separatorIndex);
  return configuration.canonicalByNormalizedValue.get(base) ?? null;
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

function getDefaultNavigatorLanguages(): string[] {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return [];
  }
  const languages: string[] = [];
  try {
    if (Array.isArray(navigator.languages)) {
      navigator.languages.forEach((language) => {
        if (typeof language === "string") languages.push(language);
      });
    }
  } catch (error) {
    // Continue to the single browser language when the list is inaccessible.
  }
  try {
    if (typeof navigator.language === "string") {
      languages.push(navigator.language);
    }
  } catch (error) {
    // Return the languages that were accessible.
  }
  return languages;
}

function findBrowserLanguage<T extends string>(
  configuration: LanguageConfiguration<T>,
  languages: readonly string[]
): LanguageOption<T> | null {
  const seen = new Set<string>();
  for (const language of languages) {
    const normalizedLanguage = normalizeLanguageTag(language);
    if (!normalizedLanguage || seen.has(normalizedLanguage)) continue;
    seen.add(normalizedLanguage);
    const match = matchBrowserLanguage(configuration, language);
    if (match) return match;
  }
  return null;
}

function createConcreteResult<T extends string>(
  option: LanguageOption<T>,
  source: LanguagePreferenceSource
): LanguagePreferenceResult<T> {
  return {
    preference: option.value,
    resolvedLanguage: option.value,
    displayName: option.label,
    resolvedDisplayName: option.label,
    source,
  };
}

function createSystemResult<T extends string>(
  option: LanguageOption<T>,
  source: "storage" | "system",
  systemDisplayName: string
): LanguagePreferenceResult<T> {
  return {
    preference: "system",
    resolvedLanguage: option.value,
    displayName: systemDisplayName,
    resolvedDisplayName: option.label,
    source,
  };
}

/**
 * Resolve a configured website language without mutating the DOM or storage.
 *
 * Resolution uses four priority levels: a configured language or explicit
 * alias in the URL query, an exact stored canonical value or `system`, the
 * current browser-language list, and finally a configured fallback. Query
 * `system` and unsupported values are ignored. Browser matching is
 * case-insensitive, treats `_` as `-`, checks exact values and aliases first,
 * and maps a regional locale to an explicitly configured base language. It
 * never infers a different regional variant without an alias.
 *
 * Usage:
 *
 * ```javascript
 * import { resolveLanguagePreference } from "mazey";
 *
 * const languages = [
 *   { value: "en", label: "English", aliases: ["en-US", "en-GB"] },
 *   { value: "zh-CN", label: "简体中文", aliases: ["zh-Hans"] },
 *   { value: "ja", label: "日本語", aliases: ["ja-JP"] },
 * ];
 * const language = resolveLanguagePreference({
 *   storageKey: "MY_WEBSITE_LANGUAGE",
 *   languages,
 *   fallback: "en",
 * });
 * console.log(language.resolvedLanguage);
 * ```
 *
 * @param options Supported languages, fallback, storage key, and optional browser inputs.
 * @returns The selected preference, concrete language, display names, and preference source.
 * @throws {TypeError} If required options, language configuration, fallback, or injected implementations are invalid.
 * @remarks Safe during SSR and resilient to unavailable or throwing browser APIs. This function does not write storage, mutate the DOM, load translations, redirect, or add listeners.
 * @category Browser Information
 */
export function resolveLanguagePreference<T extends string>(
  options: ResolveLanguagePreferenceOptions<T>
): LanguagePreferenceResult<T> {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("Language options must be an object.");
  }
  validateStorageKey(options.storageKey);
  const configuration = validateLanguages(options.languages);
  const fallback = findExactCanonical(configuration, options.fallback);
  if (!fallback) {
    throw new TypeError("fallback must be a configured canonical language.");
  }
  if (
    options.queryParam !== undefined &&
    (typeof options.queryParam !== "string" || options.queryParam.trim() === "")
  ) {
    throw new TypeError("queryParam must be a non-empty string.");
  }
  if (
    options.systemDisplayName !== undefined &&
    (typeof options.systemDisplayName !== "string" ||
      options.systemDisplayName.trim() === "")
  ) {
    throw new TypeError("systemDisplayName must be a non-empty string.");
  }
  validatePreferenceUrl(options.url);
  const suppliedStorage = validateReadableStorage(options.storage);
  if (
    options.navigatorLanguages !== undefined &&
    (!Array.isArray(options.navigatorLanguages) ||
      options.navigatorLanguages.some((language) => typeof language !== "string"))
  ) {
    throw new TypeError("navigatorLanguages must contain only strings.");
  }

  const url = getPreferenceUrl(options.url);
  const queryLanguage = matchExactLanguage(
    configuration,
    url?.searchParams.get(options.queryParam ?? "lang")
  );
  if (queryLanguage) return createConcreteResult(queryLanguage, "query");

  const storage =
    options.storage === undefined
      ? getDefaultReadableStorage()
      : suppliedStorage;
  let storedPreference: "system" | LanguageOption<T> | null = null;
  if (storage) {
    try {
      const value = storage.getItem(options.storageKey);
      storedPreference =
        value === "system"
          ? "system"
          : findExactCanonical(configuration, value);
    } catch (error) {
      storedPreference = null;
    }
  }
  if (storedPreference && storedPreference !== "system") {
    return createConcreteResult(storedPreference, "storage");
  }

  const navigatorLanguages =
    options.navigatorLanguages === undefined
      ? getDefaultNavigatorLanguages()
      : options.navigatorLanguages;
  const browserLanguage = findBrowserLanguage(
    configuration,
    navigatorLanguages
  );
  const systemDisplayName = options.systemDisplayName ?? "System";
  if (storedPreference === "system") {
    return createSystemResult(
      browserLanguage ?? fallback,
      "storage",
      systemDisplayName
    );
  }
  if (browserLanguage) {
    return createSystemResult(browserLanguage, "system", systemDisplayName);
  }
  return createConcreteResult(fallback, "fallback");
}

/**
 * Persist an exact configured website language preference.
 *
 * The function accepts `system` or a configured canonical language value;
 * aliases are not accepted. It writes only the preference and never resolves
 * a language, mutates the DOM, or loads translations.
 *
 * Usage:
 *
 * ```javascript
 * import { setLanguagePreference } from "mazey";
 *
 * const stored = setLanguagePreference({
 *   storageKey: "MY_WEBSITE_LANGUAGE",
 *   languages: [{ value: "en", label: "English" }],
 *   preference: "en",
 * });
 * console.log(stored);
 * ```
 *
 * @param options Storage key, supported languages, preference, and optional storage implementation.
 * @returns `true` when the preference was written, or `false` when storage is unavailable or rejects the write.
 * @throws {TypeError} If the options, language configuration, storage key, preference, or injected storage implementation is invalid.
 * @remarks Safe during SSR. This function writes only the exact selected preference and performs no DOM, URL, cookie, translation, network, or listener work.
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
  const preference =
    options.preference === "system"
      ? "system"
      : findExactCanonical(configuration, options.preference)?.value;
  if (!preference) {
    throw new TypeError(
      "preference must be \"system\" or a configured canonical language."
    );
  }
  const suppliedStorage = validateWritableStorage(options.storage);

  const storage =
    options.storage === undefined
      ? getDefaultWritableStorage()
      : suppliedStorage;
  if (!storage) return false;
  try {
    storage.setItem(options.storageKey, preference);
    return true;
  } catch (error) {
    return false;
  }
}

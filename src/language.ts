import {
  getUrlQueryValue,
  readLocalStorage,
  validateStorageKey,
  writeLocalStorage,
} from "./preference";
import type { PreferenceResult } from "./typing";

const fallbackLanguage = "en";

interface IntlLanguageApi {
  getCanonicalLocales?: (locales: string | readonly string[]) => string[];
  DisplayNames?: new (
    locales: readonly string[],
    options: { type: "language" }
  ) => {
    of(code: string): string | undefined;
  };
}

function canonicalizeLanguageFallback(value: string): string | null {
  const parts = value.split("-");
  if (!/^[a-z]{2,8}$/i.test(parts[0])) return null;

  const canonical = [ parts[0].toLowerCase() ];
  let index = 1;
  if (index < parts.length && /^[a-z]{4}$/i.test(parts[index])) {
    const script = parts[index].toLowerCase();
    canonical.push(`${script[0].toUpperCase()}${script.slice(1)}`);
    index++;
  }
  if (
    index < parts.length &&
    (/^[a-z]{2}$/i.test(parts[index]) || /^\d{3}$/.test(parts[index]))
  ) {
    canonical.push(
      /^[a-z]{2}$/i.test(parts[index])
        ? parts[index].toUpperCase()
        : parts[index]
    );
    index++;
  }
  for (; index < parts.length; index++) {
    const variant = parts[index];
    if (!/^(?:[a-z0-9]{5,8}|\d[a-z0-9]{3})$/i.test(variant)) {
      return null;
    }
    canonical.push(variant.toLowerCase());
  }
  return canonical.join("-");
}

function canonicalizeLanguage(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/_/g, "-");
  if (!normalized) return null;

  if (typeof Intl !== "undefined") {
    try {
      const intlApi = Intl as unknown as IntlLanguageApi;
      const getCanonicalLocales = intlApi.getCanonicalLocales;
      if (typeof getCanonicalLocales === "function") {
        const canonical = getCanonicalLocales.call(intlApi, normalized)[0];
        return typeof canonical === "string" && canonical ? canonical : null;
      }
    } catch (error) {
      if (
        error instanceof RangeError ||
        (typeof error === "object" &&
          error !== null &&
          "name" in error &&
          error.name === "RangeError")
      ) {
        return null;
      }
      return canonicalizeLanguageFallback(normalized);
    }
  }
  return canonicalizeLanguageFallback(normalized);
}

function getLanguageLabel(language: string): string {
  if (typeof Intl === "undefined") return language;
  try {
    const DisplayNames = (Intl as unknown as IntlLanguageApi).DisplayNames;
    if (typeof DisplayNames !== "function") return language;
    const label = new DisplayNames([ language ], { type: "language" }).of(
      language
    );
    return typeof label === "string" && label.trim() ? label : language;
  } catch (error) {
    return language;
  }
}

function createLanguageResult(language: string): PreferenceResult<string> {
  return { value: language, label: getLanguageLabel(language) };
}

function getNavigatorLanguage(): string | null {
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
 * Resolve the current website language.
 *
 * Resolution checks the fixed `lang` URL query, the supplied local-storage
 * key, `navigator.language`, and finally the fixed `en` fallback. Each value
 * is trimmed, treats `_` as `-`, and is canonicalized as a language tag.
 * `navigator.languages` is intentionally ignored.
 *
 * The label is generated at runtime with `Intl.DisplayNames` in the resolved
 * language when available. Runtime wording may vary; the canonical language
 * value is used as the label when display-name generation is unavailable.
 *
 * Usage:
 *
 * ```ts
 * import {
 *   resolveLanguagePreference,
 *   setLanguagePreference,
 * } from "mazey";
 *
 * const language =
 *   resolveLanguagePreference(
 *     "MY_WEBSITE_LANGUAGE"
 *   );
 *
 * console.log(language);
 *
 * setLanguagePreference(
 *   "MY_WEBSITE_LANGUAGE",
 *   "ja-JP"
 * );
 * ```
 *
 * Possible output:
 *
 * ```text
 * {
 *   value: "ja-JP",
 *   label: "日本語（日本）"
 * }
 * ```
 *
 * @param storageKey Project-specific local-storage key.
 * @returns The canonical current language and a runtime-generated display label.
 * @throws {TypeError} If `storageKey` is not a non-empty string.
 * @remarks Safe during SSR and resilient to unavailable or throwing browser and `Intl` APIs. This function reads preferences only and never writes storage, mutates the DOM, loads translations, redirects, or adds listeners.
 * @category Browser Information
 */
export function resolveLanguagePreference(
  storageKey: string
): PreferenceResult<string> {
  validateStorageKey(storageKey);

  const queryLanguage = canonicalizeLanguage(getUrlQueryValue("lang"));
  if (queryLanguage) return createLanguageResult(queryLanguage);

  const storedLanguage = canonicalizeLanguage(readLocalStorage(storageKey));
  if (storedLanguage) return createLanguageResult(storedLanguage);

  const browserLanguage = canonicalizeLanguage(getNavigatorLanguage());
  return createLanguageResult(browserLanguage ?? fallbackLanguage);
}

/**
 * Canonicalize and persist a website language.
 *
 * Usage:
 *
 * ```ts
 * import { setLanguagePreference } from "mazey";
 *
 * const stored = setLanguagePreference(
 *   "MY_WEBSITE_LANGUAGE",
 *   "ZH_cn"
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
 * The stored value is canonicalized to:
 *
 * ```text
 * zh-CN
 * ```
 *
 * @param storageKey Project-specific local-storage key.
 * @param language Language tag to canonicalize and persist.
 * @returns `true` when storage succeeds, or `false` when storage is unavailable or rejects the write.
 * @throws {TypeError} If `storageKey` is empty or `language` is empty or malformed.
 * @remarks Safe during SSR. This function writes only the canonical language and never mutates the DOM, applies translations, redirects, or adds listeners.
 * @category Browser Information
 */
export function setLanguagePreference(
  storageKey: string,
  language: string
): boolean {
  validateStorageKey(storageKey);
  const canonicalLanguage = canonicalizeLanguage(language);
  if (!canonicalLanguage) {
    throw new TypeError("language must be a valid language tag.");
  }
  return writeLocalStorage(storageKey, canonicalLanguage);
}

import type { ResolvedTheme, ThemePreference } from "../src/theme";
import { listenMediaQueryChanges } from "../src/browser";

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function getThemeMedia(windowRef: Window): MediaQueryList | null {
  try {
    const matchMedia = windowRef.matchMedia;
    return typeof matchMedia === "function"
      ? matchMedia.call(windowRef, "(prefers-color-scheme: dark)")
      : null;
  } catch {
    return null;
  }
}

function resolveCurrentTheme(
  windowRef: Window,
  storageKey: string,
  media: MediaQueryList | null
): { preference: ThemePreference; resolvedTheme: ResolvedTheme } {
  let queryPreference: ThemePreference | null = null;
  try {
    const value = new URL(windowRef.location.href).searchParams.get("theme");
    queryPreference = value === "light" || value === "dark" ? value : null;
  } catch {
    // Continue to storage when the location is inaccessible.
  }
  if (queryPreference) {
    return {
      preference: queryPreference,
      resolvedTheme: queryPreference,
    };
  }

  let storedPreference: ThemePreference | null = null;
  try {
    const value = windowRef.localStorage.getItem(storageKey);
    storedPreference = isThemePreference(value) ? value : null;
  } catch {
    // Continue to the system preference when storage is inaccessible.
  }
  if (storedPreference === "light" || storedPreference === "dark") {
    return {
      preference: storedPreference,
      resolvedTheme: storedPreference,
    };
  }
  return {
    preference: "system",
    resolvedTheme: media?.matches ? "dark" : "light",
  };
}

export function initializeThemeControls(
  storageKey: string,
  documentRef: Document = document,
  windowRef: Window = window
): () => void {
  const root = documentRef.documentElement;
  if (root.dataset.themeControlsReady === "true") return () => undefined;

  const media = getThemeMedia(windowRef);
  let currentPreference: ThemePreference = "system";
  const apply = (
    value: ThemePreference,
    persist: boolean,
    resolvedTheme?: ResolvedTheme
  ) => {
    const selected = isThemePreference(value) ? value : "system";
    currentPreference = selected;
    const resolved =
      resolvedTheme ??
      (selected === "system" ? (media?.matches ? "dark" : "light") : selected);

    root.dataset.bsTheme = resolved;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    const themeColor = documentRef.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][data-theme-color]'
    );
    if (themeColor) {
      themeColor.content =
        resolved === "dark"
          ? themeColor.dataset.themeColorDark ?? themeColor.content
          : themeColor.dataset.themeColorLight ?? themeColor.content;
    }

    if (persist) {
      try {
        windowRef.localStorage.setItem(storageKey, selected);
      } catch {
        // Storage may be unavailable in privacy-restricted contexts.
      }
    }
    try {
      windowRef.localStorage.setItem(
        "tsd-theme",
        selected === "system" ? "os" : selected
      );
    } catch {
      // Storage may be unavailable in privacy-restricted contexts.
    }

    documentRef
      .querySelectorAll<HTMLSelectElement>("[data-theme-select]")
      .forEach((control) => {
        if (control.value !== selected) control.value = selected;
      });
  };

  const handleChange = (event: Event) => {
    const control = event.target;
    if (!(control instanceof HTMLSelectElement)) return;
    if (!control.matches("[data-theme-select]")) return;
    apply(control.value as ThemePreference, true);
  };
  const handleSystemTheme = () => {
    if (currentPreference === "system") {
      apply("system", false, media?.matches ? "dark" : "light");
    }
  };

  root.dataset.themeControlsReady = "true";
  const initialTheme = resolveCurrentTheme(windowRef, storageKey, media);
  apply(initialTheme.preference, false, initialTheme.resolvedTheme);
  documentRef.addEventListener("change", handleChange);
  const removeMediaListener = listenMediaQueryChanges(media, handleSystemTheme);

  return () => {
    documentRef.removeEventListener("change", handleChange);
    removeMediaListener();
    delete root.dataset.themeControlsReady;
  };
}

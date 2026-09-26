import type { ResolvedTheme, ThemePreference } from "../src/theme";

type ThemeMediaQuery = Pick<MediaQueryList, "matches"> &
  Partial<
    Pick<
      MediaQueryList,
      | "addEventListener"
      | "removeEventListener"
      | "addListener"
      | "removeListener"
    >
  >;

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function getThemeMedia(windowRef: Window): ThemeMediaQuery {
  try {
    const matchMedia = windowRef.matchMedia;
    return typeof matchMedia === "function"
      ? matchMedia.call(windowRef, "(prefers-color-scheme: dark)")
      : { matches: false };
  } catch {
    return { matches: false };
  }
}

function listenForMediaChanges(
  media: ThemeMediaQuery,
  listener: () => void
): () => void {
  const addEventListener = media.addEventListener;
  const removeEventListener = media.removeEventListener;
  if (
    typeof addEventListener === "function" &&
    typeof removeEventListener === "function"
  ) {
    addEventListener.call(media, "change", listener);
    return () => removeEventListener.call(media, "change", listener);
  }
  const addListener = media.addListener;
  const removeListener = media.removeListener;
  if (
    typeof addListener === "function" &&
    typeof removeListener === "function"
  ) {
    addListener.call(media, listener);
    return () => removeListener.call(media, listener);
  }
  return () => undefined;
}

function resolveCurrentTheme(
  windowRef: Window,
  storageKey: string,
  media: ThemeMediaQuery
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
    resolvedTheme: media.matches ? "dark" : "light",
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
      (selected === "system" ? (media.matches ? "dark" : "light") : selected);

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
      apply("system", false, media.matches ? "dark" : "light");
    }
  };

  root.dataset.themeControlsReady = "true";
  const initialTheme = resolveCurrentTheme(windowRef, storageKey, media);
  apply(initialTheme.preference, false, initialTheme.resolvedTheme);
  documentRef.addEventListener("change", handleChange);
  const removeMediaListener = listenForMediaChanges(media, handleSystemTheme);

  return () => {
    documentRef.removeEventListener("change", handleChange);
    removeMediaListener();
    delete root.dataset.themeControlsReady;
  };
}

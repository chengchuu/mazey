export type ThemePreference = "system" | "light" | "dark";

const preferences = new Set<ThemePreference>(["system", "light", "dark"]);

function readPreference(
  windowRef: Window,
  storageKey: string
): ThemePreference {
  try {
    const value = windowRef.localStorage.getItem(
      storageKey
    ) as ThemePreference | null;
    return value && preferences.has(value) ? value : "system";
  } catch {
    return "system";
  }
}

function listenForMediaChanges(
  media: MediaQueryList,
  listener: () => void
): () => void {
  if (media.addEventListener) {
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }
  media.addListener(listener);
  return () => media.removeListener(listener);
}

export function initializeThemeControls(
  storageKey: string,
  documentRef: Document = document,
  windowRef: Window = window
): () => void {
  const root = documentRef.documentElement;
  if (root.dataset.themeControlsReady === "true") return () => undefined;

  const media = windowRef.matchMedia("(prefers-color-scheme: dark)");
  const apply = (value: ThemePreference, persist: boolean) => {
    const selected = preferences.has(value) ? value : "system";
    const resolved =
      selected === "system" ? (media.matches ? "dark" : "light") : selected;

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

    try {
      if (persist) windowRef.localStorage.setItem(storageKey, selected);
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
    if (readPreference(windowRef, storageKey) === "system") {
      apply("system", false);
    }
  };

  root.dataset.themeControlsReady = "true";
  apply(readPreference(windowRef, storageKey), false);
  documentRef.addEventListener("change", handleChange);
  const removeMediaListener = listenForMediaChanges(media, handleSystemTheme);

  return () => {
    documentRef.removeEventListener("change", handleChange);
    removeMediaListener();
    delete root.dataset.themeControlsReady;
  };
}

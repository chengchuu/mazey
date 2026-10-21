import { isStandalonePWA } from "../src/browser";

export const playgroundTabs = [
  { id: "date-interval", label: "Date interval" },
  { id: "cagr", label: "CAGR" },
  { id: "aspect-ratio", label: "Aspect ratio" },
] as const;

export type PlaygroundTabId = (typeof playgroundTabs)[number]["id"];

export function readQuickAccess(storageKey: string): PlaygroundTabId | null {
  try {
    const value = localStorage.getItem(storageKey);
    return playgroundTabs.find((tab) => tab.id === value)?.id ?? null;
  } catch {
    // Unavailable storage leaves normal navigation intact.
    return null;
  }
}

export function getQuickAccessDestination(
  url: URL,
  basePath: string,
  storageKey: string
): string | null {
  if (
    !isStandalonePWA() ||
    url.pathname !== basePath ||
    url.hash ||
    url.searchParams.has("home")
  ) {
    return null;
  }
  const selected = readQuickAccess(storageKey);
  return selected ? `${basePath}playground/${url.search}#${selected}` : null;
}

export function enableHomeBypass(basePath: string): void {
  if (!isStandalonePWA()) return;
  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    const url = new URL(link.href);
    if (
      url.origin === location.origin &&
      url.pathname === basePath &&
      !url.hash
    ) {
      url.searchParams.set("home", "1");
      link.href = url.href;
    }
  });
}

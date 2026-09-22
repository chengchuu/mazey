import { listenMediaQueryChanges } from "../src/browser";

export interface SitePwaConfig {
  appName: string;
  enabled: boolean;
  scope: string;
  serviceWorkerUrl: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

interface WindowWithIdleCallback {
  requestIdleCallback?: (callback: () => void) => number;
}

function announce(documentRef: Document, message: string): void {
  documentRef
    .querySelectorAll<HTMLElement>("[data-pwa-status]")
    .forEach((region) => {
      region.textContent = message;
    });
}

export function isStandaloneMode(
  windowRef: Window,
  navigatorRef: NavigatorWithStandalone
): boolean {
  return (
    windowRef.matchMedia("(display-mode: standalone)").matches ||
    navigatorRef.standalone === true
  );
}

export function shouldRegisterSiteServiceWorker(
  config: SitePwaConfig,
  locationRef: Location,
  navigatorRef: Navigator
): boolean {
  const isLocalhost = new Set(["localhost", "127.0.0.1", "[::1]"]).has(
    locationRef.hostname
  );
  return (
    config.enabled &&
    "serviceWorker" in navigatorRef &&
    (locationRef.protocol === "https:" || isLocalhost) &&
    locationRef.pathname.startsWith(config.scope)
  );
}

export function initializeInstallExperience(
  documentRef: Document,
  windowRef: Window,
  navigatorRef: NavigatorWithStandalone,
  appName: string
): () => void {
  const buttons = Array.from(
    documentRef.querySelectorAll<HTMLButtonElement>("[data-pwa-install]")
  );
  const help = Array.from(
    documentRef.querySelectorAll<HTMLElement>("[data-pwa-install-help]")
  );
  const displayMode = windowRef.matchMedia("(display-mode: standalone)");
  let deferredPrompt: BeforeInstallPromptEvent | null = null;

  const hideButtons = () => {
    buttons.forEach((button) => {
      button.hidden = true;
      const container = button.closest<HTMLElement>(
        "[data-pwa-install-container]"
      );
      if (container) container.hidden = true;
    });
  };
  const showInstalledState = () => {
    deferredPrompt = null;
    hideButtons();
    help.forEach((element) => {
      element.hidden = true;
    });
  };
  const handlePrompt = (event: Event) => {
    if (isStandaloneMode(windowRef, navigatorRef)) return;
    const promptEvent = event as BeforeInstallPromptEvent;
    promptEvent.preventDefault();
    deferredPrompt = promptEvent;
    buttons.forEach((button) => {
      button.disabled = false;
      button.hidden = false;
      const container = button.closest<HTMLElement>(
        "[data-pwa-install-container]"
      );
      if (container) container.hidden = false;
    });
  };
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    buttons.forEach((button) => {
      button.disabled = true;
    });
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      announce(
        documentRef,
        choice.outcome === "accepted"
          ? "The app installation was accepted."
          : "Installation was dismissed. You can use the browser install menu later."
      );
    } catch {
      announce(
        documentRef,
        "The browser could not open its installation prompt. Use the browser install menu instead."
      );
    } finally {
      hideButtons();
    }
  };
  const handleInstalled = () => {
    showInstalledState();
    announce(documentRef, `${appName} was installed.`);
  };
  const handleDisplayMode = () => {
    if (isStandaloneMode(windowRef, navigatorRef)) showInstalledState();
  };

  if (isStandaloneMode(windowRef, navigatorRef)) showInstalledState();
  buttons.forEach((button) => button.addEventListener("click", handleInstall));
  windowRef.addEventListener("beforeinstallprompt", handlePrompt);
  windowRef.addEventListener("appinstalled", handleInstalled);
  const removeDisplayModeListener = listenMediaQueryChanges(
    displayMode,
    handleDisplayMode
  );

  return () => {
    buttons.forEach((button) =>
      button.removeEventListener("click", handleInstall)
    );
    windowRef.removeEventListener("beforeinstallprompt", handlePrompt);
    windowRef.removeEventListener("appinstalled", handleInstalled);
    removeDisplayModeListener();
  };
}

export async function registerSiteServiceWorker(
  config: SitePwaConfig,
  windowRef: Window,
  navigatorRef: Navigator
): Promise<ServiceWorkerRegistration | null> {
  if (
    !shouldRegisterSiteServiceWorker(config, windowRef.location, navigatorRef)
  ) {
    return null;
  }
  try {
    return await navigatorRef.serviceWorker.register(config.serviceWorkerUrl, {
      scope: config.scope,
    });
  } catch (error) {
    console.error(
      `Failed to register the ${config.appName} service worker.`,
      error
    );
    return null;
  }
}

export function initializeSitePwa(config: SitePwaConfig): void {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof navigator === "undefined"
  ) {
    return;
  }
  const root = document.documentElement;
  if (root.dataset.pwaReady === "true") return;
  root.dataset.pwaReady = "true";

  initializeInstallExperience(document, window, navigator, config.appName);
  if (!shouldRegisterSiteServiceWorker(config, window.location, navigator))
    return;

  const scheduleRegistration = () => {
    const idleWindow = window as unknown as WindowWithIdleCallback;
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(() => {
        void registerSiteServiceWorker(config, window, navigator);
      });
    } else {
      window.setTimeout(() => {
        void registerSiteServiceWorker(config, window, navigator);
      }, 0);
    }
  };
  if (document.readyState === "complete") scheduleRegistration();
  else window.addEventListener("load", scheduleRegistration, { once: true });
}
